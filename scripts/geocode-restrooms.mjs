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
if (!/^[\x21-\x7E]+$/.test(apiKey)) {
  console.error('KAKAO_REST_API_KEY에는 카카오 REST API 키만 입력하세요.');
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function geocode(query) {
  if (!query) return null;
  // 주소 끝 건물명/부속 명칭 정제 (예: "관악대로 215 1층" -> "관악대로 215")
  const cleanQuery = query.replace(/\s+(1층|2층|상가|앞|뒤|입구|정문|후문).*$/, '').trim();
  
  // 1. 카카오 주소 API 우선 검색
  let url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(cleanQuery)}`;
  try {
    let res = await fetch(url, { headers: { Authorization: `KakaoAK ${apiKey}` } });
    if (res.ok) {
      let data = await res.json();
      if (data.documents?.[0]) {
        return { lat: Number(data.documents[0].y), lng: Number(data.documents[0].x) };
      }
    }
  } catch {}

  // 2. 검색 실패 시 카카오 키워드 API로 우회 검색
  url = `https://dapi.kakao.com/v2/local/search/keyword.json?size=1&query=${encodeURIComponent(cleanQuery)}`;
  try {
    let res = await fetch(url, { headers: { Authorization: `KakaoAK ${apiKey}` } });
    if (res.ok) {
      let data = await res.json();
      if (data.documents?.[0]) {
        return { lat: Number(data.documents[0].y), lng: Number(data.documents[0].x) };
      }
    }
  } catch {}

  return null;
}

async function main() {
  if (!fs.existsSync(targetFile)) {
    console.error(`파일을 찾을 수 없습니다: ${targetFile}`);
    process.exit(1);
  }

  const source = fs.readFileSync(targetFile, 'utf8');

  // 객체 블록 단위({ ... })로 안전하게 캡처하는 정규식
  const objectBlockRegex = /\{[\s\S]*?\}/g;
  let updated = 0;
  let skipped = 0;
  let failed = [];

  // 각 객체 블록을 치환해가며 처리
  let newSource = await replaceAsync(source, objectBlockRegex, async (block) => {
    // category 확인
    const categoryMatch = block.match(/["']category["']\s*:\s*["']([^"']+)["']/);
    const category = categoryMatch ? categoryMatch[1] : '';

    if (category !== 'restroom' && category !== 'parking') {
      return block; // 대상 카테고리가 아니면 통과
    }

    // 이미 좌표가 있고 FORCE_GEOCODE가 false면 스킵
    const hasLat = /["']lat["']\s*:/.test(block);
    const hasLng = /["']lng["']\s*:/.test(block);

    if (!forceGeocode && hasLat && hasLng) {
      skipped++;
      return block;
    }

    // 이름 및 주소 추출
    const nameMatch = block.match(/["']name["']\s*:\s*["']([^"']+)["']/);
    const roadMatch = block.match(/["']roadAddress["']\s*:\s*["']([^"']+)["']/);
    const addrMatch = block.match(/["']address["']\s*:\s*["']([^"']+)["']/);

    const name = nameMatch ? nameMatch[1] : '';
    const roadAddress = roadMatch ? roadMatch[1] : '';
    const address = addrMatch ? addrMatch[1] : '';

    const queryCandidate = roadAddress || address;

    if (!queryCandidate) {
      failed.push(`${name}: 주소 정보 없음`);
      return block;
    }

    // 좌표 검색 (도로명 -> 지번 -> 장소명 순으로 시도)
    let coord = await geocode(roadAddress) 
      || await geocode(address)
      || await geocode(`안양 ${name.replace(/(자전거|거치대|보관소)/g, '').trim()}`);

    await sleep(100);

    if (coord) {
      updated++;
      // 기존 lat, lng 필드가 존재한다면 제거 후 새 lat, lng 주입
      let cleanBlock = block
        .replace(/\s*["']?lat["']?\s*:\s*-?\d+(\.\d+)?,?/g, '')
        .replace(/\s*["']?lng["']?\s*:\s*-?\d+(\.\d+)?,?/g, '');

      // "roadAddress": "..." 바로 다음에 lat, lng 추가
      const insertTarget = cleanBlock.includes('"roadAddress"') ? '"roadAddress"' : '"address"';
      const replacement = `${insertTarget}:${cleanBlock.match(new RegExp(`${insertTarget}\\s*:\\s*["']([^"']+)["']`))[0].split(':')[1]},\n    "lat": ${coord.lat},\n    "lng": ${coord.lng}`;

      return cleanBlock.replace(new RegExp(`${insertTarget}\\s*:\\s*["']([^"']+)["']`), replacement);
    } else {
      failed.push(`${name}: ${queryCandidate}`);
      return block;
    }
  });

  fs.writeFileSync(targetFile, newSource, 'utf8');
  console.log(`완료: ${updated}건 좌표 갱신, ${skipped}건 기존 좌표 유지, ${failed.length}건 실패`);
  if (failed.length) failed.forEach((item) => console.warn(`- 실패: ${item}`));
}

// async replace 지원 함수
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
