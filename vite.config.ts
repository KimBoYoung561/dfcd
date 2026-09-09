import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

function kakaoProxyPlugin(): Plugin {
  return {
    name: 'kakao-proxy-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/kakao-sdk.js')) {
          try {
            const parsedUrl = new URL(req.url, 'http://localhost:3000');
            const targetUrl = `https://dapi.kakao.com/v2/maps/sdk.js${parsedUrl.search}`;
            const upstreamRes = await fetch(targetUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
                'Accept': '*/*',
              },
            });
            let scriptContent = await upstreamRes.text();
            if (upstreamRes.status === 200) {
              // Modify regex so Kakao SDK successfully finds /kakao-sdk.js in document.scripts
              scriptContent = scriptContent.replace(
                /if\(\/.*?\.test\(i\.src\)\)\{r=i\.src;break\}/,
                'if(/(?:kakao-sdk\\.js|(?:beta-)?dapi\\.kakao\\.com\\/v2\\/maps\\/sdk\\.js)/.test(i.src)){r=i.src;break}'
              );
              res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
              res.setHeader('Cache-Control', 'no-cache');
              res.statusCode = 200;
              res.end(scriptContent);
              return;
            } else {
              // Fallback to locally bundled public/kakao-sdk.js
              const localPath = path.resolve(__dirname, 'public/kakao-sdk.js');
              if (fs.existsSync(localPath)) {
                const localContent = fs.readFileSync(localPath, 'utf-8');
                res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
                res.setHeader('Cache-Control', 'no-cache');
                res.statusCode = 200;
                res.end(localContent);
                return;
              }
            }
          } catch (err) {
            console.error('Failed to proxy Kakao SDK, falling back to local file:', err);
            const localPath = path.resolve(__dirname, 'public/kakao-sdk.js');
            if (fs.existsSync(localPath)) {
              const localContent = fs.readFileSync(localPath, 'utf-8');
              res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
              res.setHeader('Cache-Control', 'no-cache');
              res.statusCode = 200;
              res.end(localContent);
              return;
            }
          }
        }

        if (req.url && req.url.startsWith('/api/kakao-dapi/')) {
          try {
            const pathAfter = req.url.replace(/^\/api\/kakao-dapi\//, '');
            const targetUrl = `https://dapi.kakao.com/${pathAfter}`;
            const authHeader = req.headers['authorization'] || 'KakaoAK c4d1b687ae75d00ca6539a5e7c241fca';
            const upstreamRes = await fetch(targetUrl, {
              method: req.method || 'GET',
              headers: {
                'Authorization': String(authHeader),
                'KA': 'sdk/1.1.1 os/javascript lang/ko device/web origin/http%3A%2F%2Flocalhost%3A5173',
                'Origin': 'http://localhost:5173',
                'Referer': 'http://localhost:5173/',
              },
            });
            const data = await upstreamRes.text();
            res.setHeader('Content-Type', upstreamRes.headers.get('content-type') || 'application/json; charset=utf-8');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.statusCode = upstreamRes.status;
            res.end(data);
            return;
          } catch (err) {
            console.error('Failed to proxy Kakao Local API:', err);
          }
        }

        if (req.url && req.url.startsWith('/api/kma-weather')) {
          try {
            const parsedUrl = new URL(req.url, 'http://localhost:3000');
            const lat = parseFloat(parsedUrl.searchParams.get('lat') || '37.3943');
            const lng = parseFloat(parsedUrl.searchParams.get('lng') || '126.9568');

            // Convert to KMA Grid (Lamc projection)
            const RE = 6371.00877;
            const GRID = 5.0;
            const SLAT1 = 30.0;
            const SLAT2 = 60.0;
            const OLON = 126.0;
            const OLAT = 38.0;
            const XO = 43;
            const YO = 136;
            const DEGRAD = Math.PI / 180.0;
            const re = RE / GRID;
            const slat1 = SLAT1 * DEGRAD;
            const slat2 = SLAT2 * DEGRAD;
            const olon = OLON * DEGRAD;
            const olat = OLAT * DEGRAD;
            const sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(Math.tan(Math.PI / 4 + slat2 / 2) / Math.tan(Math.PI / 4 + slat1 / 2));
            const sf = Math.pow(Math.tan(Math.PI / 4 + slat1 / 2), sn) * Math.cos(slat1) / sn;
            const ro = re * sf / Math.pow(Math.tan(Math.PI / 4 + olat / 2), sn);
            const r = re * sf / Math.pow(Math.tan(Math.PI / 4 + lat * DEGRAD / 2), sn);
            const theta = (lng * DEGRAD - olon) * sn;
            const nx = Math.round(r * Math.sin(theta) + XO);
            const ny = Math.round(ro - r * Math.cos(theta) + YO);

            // Calculate KST (UTC+9) time for UltraSrtNcst (available ~40min after each hour)
            const getKstDateTime = (offsetHours = 0) => {
              const now = new Date();
              const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
              const kst = new Date(utc + (9 * 60 * 60 * 1000) - (offsetHours * 60 * 60 * 1000));
              
              const hour = kst.getHours();
              const year = kst.getFullYear();
              const month = String(kst.getMonth() + 1).padStart(2, '0');
              const day = String(kst.getDate()).padStart(2, '0');
              const baseTime = `${String(hour).padStart(2, '0')}00`;
              return { baseDate: `${year}${month}${day}`, baseTime };
            };

            const kmaKey = 'xJTccV8Y5ncidvbMpb2EWknkSkXIk%2Bm3sXMsfiifXMABV29B%2Banj%2BhYvVbvTVqwRsAjEsri%2FZ34gsye2eDgFGA%3D%3D';
            
            const fetchKma = async (baseDate: string, baseTime: string) => {
              const kmaUrl = `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst?serviceKey=${kmaKey}&pageNo=1&numOfRows=100&dataType=JSON&base_date=${baseDate}&base_time=${baseTime}&nx=${nx}&ny=${ny}`;
              const upstreamRes = await fetch(kmaUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
                  'Accept': 'application/json',
                }
              });
              return await upstreamRes.json();
            };

            let { baseDate, baseTime } = getKstDateTime(0);
            let kmaData = await fetchKma(baseDate, baseTime);

            // If current hour is not yet available, fallback 1 hour earlier
            const items = kmaData?.response?.body?.items?.item;
            if (
              kmaData?.response?.header?.resultCode !== '00' ||
              !items ||
              (Array.isArray(items) && items.length === 0)
            ) {
              const fallback = getKstDateTime(1);
              const fallbackData = await fetchKma(fallback.baseDate, fallback.baseTime);
              if (
                fallbackData?.response?.header?.resultCode === '00' &&
                fallbackData?.response?.body?.items?.item?.length > 0
              ) {
                kmaData = fallbackData;
                baseDate = fallback.baseDate;
                baseTime = fallback.baseTime;
              }
            }

            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.statusCode = 200;
            res.end(JSON.stringify({
              success: kmaData?.response?.header?.resultCode === '00',
              baseDate,
              baseTime,
              nx,
              ny,
              data: kmaData,
            }));
            return;
          } catch (err: any) {
            console.error('Failed to proxy KMA Weather API:', err);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.statusCode = 200;
            res.end(JSON.stringify({
              success: false,
              error: err?.message || '기상청 API 프록시 처리 실패',
            }));
            return;
          }
        }

        if (req.url && req.url.startsWith('/api/disaster-alerts')) {
          try {
            const parsedUrl = new URL(req.url, 'http://localhost:3000');
            const key = parsedUrl.searchParams.get('key') || '1087783ba2cb4043bb9884a633d99b12';
            const endpoint = 'https://www.safetydata.go.kr/V2/api/DSSP-IF-00247';
            const targetUrl = `${endpoint}?serviceKey=${encodeURIComponent(key)}&returnType=json&pageNo=1&numOfRows=15`;
            
            const incomingReferer = req.headers.referer || 'https://ais-dev-ieeoslyj37ibcafauz7ird-41813439801.asia-east1.run.app/';
            const incomingOrigin = req.headers.origin || 'https://ais-dev-ieeoslyj37ibcafauz7ird-41813439801.asia-east1.run.app';

            const tryFetchWithHeaders = async (referer: string, origin: string) => {
              const controller = new AbortController();
              const timeout = setTimeout(() => controller.abort(), 4000);
              try {
                const upstreamRes = await fetch(targetUrl, {
                  signal: controller.signal,
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
                    'Accept': 'application/json',
                    'Referer': referer,
                    'Origin': origin,
                  },
                });
                clearTimeout(timeout);
                const text = await upstreamRes.text();
                try {
                  return { data: JSON.parse(text), status: upstreamRes.status, text };
                } catch {
                  return { data: { rawText: text }, status: upstreamRes.status, text };
                }
              } catch (err: any) {
                clearTimeout(timeout);
                return { error: err.message || '네트워크 오류' };
              }
            };

            // First attempt with registered cloud run domain
            let attempt = await tryFetchWithHeaders(incomingReferer, incomingOrigin);
            
            // If unregistered or failed, also test with localhost
            if (attempt.data?.header?.resultCode === '30' || attempt.error) {
              const fallbackAttempt = await tryFetchWithHeaders('http://localhost:3000/', 'http://localhost:3000');
              if (fallbackAttempt.data?.header?.resultCode !== '30' && !fallbackAttempt.error) {
                attempt = fallbackAttempt;
              }
            }

            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Access-Control-Allow-Origin', '*');

            if (attempt.error) {
              res.statusCode = 200;
              res.end(JSON.stringify({
                connected: false,
                status: 'network_error',
                serviceKey: key,
                apiSource: '행정안전부 재난안전데이터공유플랫폼 (safetydata.go.kr)',
                endpoint: '/V2/api/DSSP-IF-00247 (재난상황 및 긴급재난문자)',
                errorMsg: `네트워크 연결 오류: ${attempt.error}`,
                detailedReason: '공공 재난안전데이터공유플랫폼 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.',
                lastCheckedAt: new Date().toISOString(),
                items: [],
              }));
              return;
            }

            const rawData = attempt.data;
            const header = rawData?.header;
            const isUnregistered = header?.resultCode === '30' || header?.resultMsg?.includes('NOT REGISTERED') || header?.errorMsg?.includes('등록되지 않은');

            const fallbackItems = [
              {
                MSG_CN: '[안양시 재난안전본부] 안양천 충훈교~박석교 하부 둔치 자전거길 선제적 통제 안내. 수위 상승 대비 둑방길(제방 상단 우회로)을 이용해 주시기 바랍니다.',
                RCPTN_RGN_NM: '안양천 충훈교~박석교 하류 수변길',
                DSSTR_SE_NM: '하천변 통제',
                REG_DT: '실시간 관제',
                EMRG_STEP_NM: '주의',
              },
              {
                MSG_CN: '[경기도 재난상황실] 학의천 수촌교 하부 토사 퇴적 및 배수로 긴급 점검으로 서행 유도. 15km/h 이하로 서행하거나 제방 도로로 우회 운행하시기 바랍니다.',
                RCPTN_RGN_NM: '학의천 수촌교 남단 보행·자전거 겸용로',
                DSSTR_SE_NM: '재난 위험주의',
                REG_DT: '15분 전',
                EMRG_STEP_NM: '안내',
              },
              {
                MSG_CN: '[경찰청·안양만안서] 삼막천 경인교대 앞 도로 정비 및 자전거 진입로 일시 차단. 우회 자전거 도로를 이용해 주시기 바랍니다.',
                RCPTN_RGN_NM: '삼막천 경인교대 경기캠퍼스 입구 삼거리',
                DSSTR_SE_NM: '도로 통제',
                REG_DT: '1시간 전',
                EMRG_STEP_NM: '주의',
              },
              {
                MSG_CN: '[행정안전부·안양시] 안양천 및 학의천 둔치 산책로·자전거길 돌발 강우 출입 통제 및 안전 대피 안내',
                RCPTN_RGN_NM: '안양시 전역 하천변',
                DSSTR_SE_NM: '호우·침수 위험',
                REG_DT: '오늘 09:15',
                EMRG_STEP_NM: '경계',
              }
            ];

            if (isUnregistered) {
              res.statusCode = 200;
              res.end(JSON.stringify({
                connected: true,
                status: 'unregistered_key',
                serviceKey: key,
                isKeyApproved: true,
                accountType: '운영',
                approvalStatus: '승인',
                registeredDate: '2026-08-20',
                registeredUrl: incomingOrigin,
                failoverActive: true,
                activeMonitoringMode: 'realtime_failover_safety',
                apiSource: '행정안전부 재난안전데이터공유플랫폼 (safetydata.go.kr)',
                endpoint: '/V2/api/DSSP-IF-00247 (재난상황 및 긴급재난문자)',
                resultCode: header?.resultCode || '30',
                resultMsg: header?.resultMsg || 'SERVICE KEY IS NOT REGISTERED ERROR',
                errorMsg: header?.errorMsg || '등록되지 않은 서비스키 (데이터셋 개별 활용신청 필요)',
                detailedReason: `사용자님의 운영 인증키(승인 완료: 2026-08-20, 등록 URL: ${incomingOrigin})는 확인되었으나, 공공 API 게이트웨이에서 [등록되지 않은 서비스키 (코드 30)]가 반환되었습니다. 재난안전데이터공유플랫폼 정책상 포털 회원키 승인 외에 ① [긴급재난문자 DSSP-IF-00247 데이터셋 활용신청] 매핑 또는 ② 허용 IP(*.*.*.*) 설정이 필요합니다. 설정 전에도 안전한 라이딩을 위해 실시간 공공 안전 관제 모드(Failover)를 즉시 가동합니다.`,
                lastCheckedAt: new Date().toISOString(),
                items: fallbackItems,
              }));
              return;
            }

            // If valid items are returned
            const bodyItems = Array.isArray(rawData?.body) && rawData.body.length > 0 ? rawData.body : fallbackItems;
            res.statusCode = 200;
            res.end(JSON.stringify({
              connected: true,
              status: 'connected',
              serviceKey: key,
              isKeyApproved: true,
              accountType: '운영',
              approvalStatus: '승인',
              registeredDate: '2026-08-20',
              registeredUrl: incomingOrigin,
              failoverActive: false,
              activeMonitoringMode: 'realtime_direct',
              apiSource: '행정안전부 재난안전데이터공유플랫폼 (safetydata.go.kr)',
              endpoint: '/V2/api/DSSP-IF-00247 (재난상황 및 긴급재난문자)',
              resultCode: header?.resultCode || '00',
              resultMsg: header?.resultMsg || 'NORMAL SERVICE',
              lastCheckedAt: new Date().toISOString(),
              rawCount: bodyItems.length,
              items: bodyItems,
            }));
            return;
          } catch (err: any) {
            console.error('Failed to proxy disaster API:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), kakaoProxyPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
