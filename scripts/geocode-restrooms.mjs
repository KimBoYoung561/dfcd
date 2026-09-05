#!/usr/bin/env node
// Fill facility coordinates in a TypeScript facility data file.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const targetFile = path.resolve(root, process.env.TARGET_FILE || 'src/data/importedFacilities.ts');
const apiKey = process.env.KAKAO_REST_API_KEY?.trim();
const forceGeocode = process.env.FORCE_GEOCODE !== '0';

if (!apiKey) {
  console.error('KAKAO_REST_API_KEY 환경변수를 설정하세요.');
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 카카오 API 호출 함수 (에러 상태 원인 파악 가능)
async function fetchKakao(type, query) {
  if (!query || query.trim().length < 2) return { coord: null, error: '쿼리 미입력' };
  
  const endpoint = type === 'address' ? 'address.json' : 'keyword.json';
  const url = `https://dapi.kakao.com/v2/local/search/${endpoint}?size=1&query=${encodeURIComponent(query.trim())}`;
  
  try {
    const res = await fetch(url, { headers: { Authorization: `KakaoAK ${apiKey}` } });
    if (!res.ok) {
      return { coord: null, error: `HTTP ${res.status}` };
    }
    const data = await res.json();
    const doc = data.documents?.[0];
    if (!doc) return { coord: null, error: '검색결과 0건' };
    
    const lat = Number(doc.y);
    const lng = Number(doc.x);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { coord: { lat, lng }, error: null };
    }
    return { coord: null, error: '좌표 데이터 이상' };
  } catch (err) {
    return { coord: null, error: err.message };
  }
}

// 안전한 주소 정제 (수식어만 제거)
function sanitize(str) {
  if (!str) return '';
  return str
    .replace(/시민대로 광장/g, '시민대로')
    .replace(/\s+(1층|2층|상가|입구|정문|후문|앞|뒤|옆|부근|일원|광장|동측|서측).*$/g, '')
    .trim();
}

async function resolveCoordinates(name, address, roadAddress) {
  let lastError = '검색 실패';

  // 1. 순수 도로명 주소 검색 (최우선)
  if (roadAddress) {
    let { coord, error } = await fetchKakao('address', roadAddress);
    if (coord) return { coord, error: null };
    lastError = error;
  }

  // 2. 순수 지번 주소 검색
  if (address) {
    let { coord, error } = await fetchKakao('address', address);
    if (coord) return { coord, error: null };
    lastError = error;
  }

  // 3. 정제된 도로명 주소 검색
  const cleanRoad = sanitize(roadAddress);
  if (cleanRoad && cleanRoad !== roadAddress) {
    let { coord, error } = await fetchKakao('address', cleanRoad);
    if (coord) return { coord, error: null };
    lastError = error;
  }

  // 4. 장소명 키워드 검색 ("안양 + 장소명")
  const cleanName = name.replace(/(자전거|거치대|보관소|대형|환승|스마트|주차타워|-1|-2)/g, '').trim();
  if (cleanName) {
    let { coord, error } = await fetchKakao('keyword', `안양 ${cleanName}`);
    if (coord) return { coord, error: null };
    lastError = error;
  }

  return { coord: null, error: lastError };
}

async function main() {
  if (!fs.existsSync(targetFile)) {
    console.error(`파일을 찾을 수 없습니다: ${targetFile}`);
    process.exit(1);
  }

  const source = fs.readFileSync(targetFile, 'utf8');
  const objectBlockRegex = /\{[\s\S]*?\}/g;
  let updated = 0;
  let skipped = 0;
  let failed = [];

  let newSource = await replaceAsync(source, objectBlockRegex, async (block) => {
    const categoryMatch = block.match(/["']category["']\s*:\s*["']([^"']+)["']/);
    const category = categoryMatch ? categoryMatch[1] : '';

    if (category !== 'restroom' && category !== 'parking') {
      return block;
    }

    const hasLat = /["']lat["']\s*:/.test(block);
    const hasLng = /["']lng["']\s*:/.test(block);

    if (!forceGeocode && hasLat && hasLng) {
      skipped++;
      return block;
    }

    const nameMatch = block.match(/["']name["']\s*:\s*["']([^"']+)["']/);
    const roadMatch = block.match(/["']roadAddress["']\s*:\s*["']([^"']+)["']/);
    const addrMatch = block.match(/["']address["']\s*:\s*["']([^"']+)["']/);

    const name = nameMatch ? nameMatch[1] : '';
    const roadAddress = roadMatch ? roadMatch[1] : '';
    const address = addrMatch ? addrMatch[1] : '';

    // API 과호출 방지를 위해 200ms 대기 (초당 5회 제한)
    await sleep(200);

    const { coord, error } = await resolveCoordinates(name, address, roadAddress);

    if (coord) {
      updated++;
      let cleanBlock = block
        .replace(/\s*["']?lat["']?\s*:\s*-?\d+(\.\d+)?,?/g, '')
        .replace(/\s*["']?lng["']?\s*:\s*-?\d+(\.\d+)?,?/g, '');

      const insertTarget = cleanBlock.includes('"roadAddress"') ? '"roadAddress"' : '"address"';
      const targetRegex = new RegExp(`("${insertTarget}"|'${insertTarget}')\\s*:\\s*["']([^"']+)["']`);
      const match = cleanBlock.match(targetRegex);

      if (match) {
        const replacement = `${match[0]},\n    "lat": ${coord.lat},\n    "lng": ${coord.lng}`;
        return cleanBlock.replace(match[0], replacement);
      }
      return cleanBlock;
    } else {
      failed.push(`${name} -> [원인: ${error}] ([도로명] ${roadAddress} / [지번] ${address})`);
      return block;
    }
  });

  fs.writeFileSync(targetFile, newSource, 'utf8');
  console.log(`완료: ${updated}건 좌표 갱신, ${skipped}건 기존 좌표 유지, ${failed.length}건 실패`);
  if (failed.length) failed.forEach((item) => console.warn(`- 실패: ${item}`));
}

async function replaceAsync(str, regex, asyncFn) {
  const matches = [];
  str.replace(regex, (match, ...args) => {
    matches.push({ match, offset: args[args.length - 2] });
    return match;
  });
  const data = await Promise.all(matches.map((m) => asyncFn(m.match)));
  let result = str;
  let offsetShift = 0;
  for (let i = 0; i < matches.length; i++) {
    const orig = matches[i];
    const rep = data[i];
    const start = orig.offset + offsetShift;
    result = result.slice(0, start) + rep + result.slice(start + orig.match.length);
    offsetShift += rep.length - orig.match.length;
  }
  return result;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
