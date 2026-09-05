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

// 카카오 API 호출 공통 함수
async function fetchKakao(type, query) {
  if (!query || query.trim().length < 2) return null;
  const endpoint = type === 'address' ? 'address.json' : 'keyword.json';
  const url = `https://dapi.kakao.com/v2/local/search/${endpoint}?size=1&query=${encodeURIComponent(query.trim())}`;
  try {
    const res = await fetch(url, { headers: { Authorization: `KakaoAK ${apiKey}` } });
    if (!res.ok) return null;
    const data = await res.json();
    const doc = data.documents?.[0];
    if (!doc) return null;
    const lat = Number(doc.y);
    const lng = Number(doc.x);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  } catch {
    return null;
  }
}

// 주소 정제 (잘못된 도로명 '광장' 제거, ~번길 공백 오타 수정, 수식어 제거)
function cleanAddress(addr) {
  if (!addr) return '';
  return addr
    .replace(/시민대로 광장/g, '시민대로')
    .replace(/(\d+)번길\s+(\d+)/g, '$1번길 $2') // 번길 띄어쓰기 정제
    .replace(/(\d+)번길$/g, '$1번길')
    .replace(/\s+(1층|2층|상가|앞|뒤|입구|정문|후문|옆|부근|일원|광장|동측|서측).*$/g, '')
    .trim();
}

// 장소명 정제 (키워드 검색용)
function cleanName(name) {
  if (!name) return '';
  return name
    .replace(/(자전거|거치대|보관소|대형|환승|스마트|주차타워|-1|-2|입구|정문|후문|앞|뒤|옆|동측|서측)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function resolveCoordinates(name, address, roadAddress) {
  const cleanedRoad = cleanAddress(roadAddress);
  const cleanedAddr = cleanAddress(address);
  const pureName = cleanName(name);

  // 1. 도로명주소 검색
  let coord = await fetchKakao('address', cleanedRoad);
  if (coord) return coord;

  // 2. 지번주소 검색
  coord = await fetchKakao('address', cleanedAddr);
  if (coord) return coord;

  // 3. 키워드 검색 (도로명 + 장소명)
  if (cleanedRoad && pureName) {
    coord = await fetchKakao('keyword', `${cleanedRoad} ${pureName}`);
    if (coord) return coord;
  }

  // 4. 키워드 검색 (지번 + 장소명)
  if (cleanedAddr && pureName) {
    coord = await fetchKakao('keyword', `${cleanedAddr} ${pureName}`);
    if (coord) return coord;
  }

  // 5. 키워드 검색 ("안양시" + 장소명) - 예: "안양시 귀인동 먹자골목"
  if (pureName) {
    coord = await fetchKakao('keyword', `안양 ${pureName}`);
    if (coord) return coord;
  }

  // 6. 구/동 단위 + 장소명 검색
  const regionMatch = (roadAddress || address || '').match(/(동안구|만안구|[가-힣]+동)/);
  if (regionMatch && pureName) {
    coord = await fetchKakao('keyword', `안양 ${regionMatch[0]} ${pureName}`);
    if (coord) return coord;
  }

  return null;
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

    const coord = await resolveCoordinates(name, address, roadAddress);
    await sleep(100);

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
      failed.push(`${name}: [도로명] ${roadAddress} / [지번] ${address}`);
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
