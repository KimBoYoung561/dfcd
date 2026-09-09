import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
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
            }
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache');
            res.statusCode = upstreamRes.status;
            res.end(scriptContent);
            return;
          } catch (err) {
            console.error('Failed to proxy Kakao SDK:', err);
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

            if (isUnregistered) {
              res.statusCode = 200;
              res.end(JSON.stringify({
                connected: false,
                status: 'unregistered_key',
                serviceKey: key,
                registeredUrl: incomingOrigin,
                apiSource: '행정안전부 재난안전데이터공유플랫폼 (safetydata.go.kr)',
                endpoint: '/V2/api/DSSP-IF-00247 (재난상황 및 긴급재난문자)',
                resultCode: header?.resultCode || '30',
                resultMsg: header?.resultMsg || 'SERVICE KEY IS NOT REGISTERED ERROR',
                errorMsg: header?.errorMsg || '등록되지 않은 서비스키',
                detailedReason: `등록해주신 URL(${incomingOrigin})을 포함하여 공공서버에 인증 요청을 전송했으나, 정부 API 게이트웨이에서 [등록되지 않은 서비스키 (코드 30)]가 응답되었습니다. 공공데이터포털 정책상 도메인 추가 등록/수정 후 게이트웨이에 실제 동기화되기까지 약 1~2시간(정시 배치) 소요될 수 있습니다.`,
                lastCheckedAt: new Date().toISOString(),
                items: [],
              }));
              return;
            }

            // If valid items are returned
            const bodyItems = Array.isArray(rawData?.body) ? rawData.body : [];
            res.statusCode = 200;
            res.end(JSON.stringify({
              connected: true,
              status: 'connected',
              serviceKey: key,
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
