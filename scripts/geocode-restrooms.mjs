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

async function geocode(address) {
  const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`;
  const response = await fetch(url, { headers: { Authorization: `KakaoAK ${apiKey}` } });
  if (!response.ok) throw new Error(`Kakao API ${response.status}`);
  const data = await response.json();
  const document = data.documents?.[0];
  if (!document) return null;
  return { lat: Number(document.y), lng: Number(document.x) };
}

async function searchPlace(name, address) {
  const query = address ? `${name} ${address}` : `${name}`;
  const url = `https://dapi.kakao.com/v2/local/search/keyword.json?size=1&query=${encodeURIComponent(query)}`;
  const response = await fetch(url, { headers: { Authorization: `KakaoAK ${apiKey}` } });
  if (!response.ok) throw new Error(`Kakao keyword API ${response.status}`);
  const data = await response.json();
  const document = data.documents?.[0];
  if (!document) return null;
  const lat = Number(document.y);
  const lng = Number(document.x);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

async function main() {
  if (!fs.existsSync(targetFile)) {
    console.error(`파일을 찾을 수 없습니다: ${targetFile}`);
    process.exit(1);
  }

  const source = fs.readFileSync(targetFile, 'utf8');
  const lines = source.split(/\r?\n/);
  const output = [];

  let current = { name: '', category: '', address: '', roadAddress: '', lat: null, lng: null, hasLat: false, hasLng: false };
  let updated = 0;
  let skipped = 0;
  let failed = [];

  function resetCurrent() {
    return { name: '', category: '', address: '', roadAddress: '', lat: null, lng: null, hasLat: false, hasLng: false };
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    // 쌍따옴표(")와 홑따옴표(') 모두 지원하도록 정규식 개선
    const nameMatch = line.match(/^\s*["']?name["']?:\s*["']((?:\\.|[^"'\\])*)["'],?/);
    const categoryMatch = line.match(/^\s*["']?category["']?:\s*["']((?:\\.|[^"'\\])*)["'],?/);
    const addressMatch = line.match(/^\s*["']?address["']?:\s*["']((?:\\.|[^"'\\])*)["'],?/);
    const roadMatch = line.match(/^\s*["']?roadAddress["']?:\s*["']((?:\\.|[^"'\\])*)["'],?/);

    if (nameMatch) current.name = nameMatch[1];
    if (categoryMatch) current.category = categoryMatch[1];
    if (addressMatch) current.address = addressMatch[1];
    if (roadMatch) current.roadAddress = roadMatch[1];

    const isLatLine = /^\s*["']?lat["']?:\s*-?\d/.test(line);
    const isLngLine = /^\s*["']?lng["']?:\s*-?\d/.test(line);

    if (isLatLine) {
      current.hasLat = true;
      current.lat = Number(line.match(/-?\d+(?:\.\d+)?/)?.[0]);
    }
    if (isLngLine) {
      current.hasLng = true;
      current.lng = Number(line.match(/-?\d+(?:\.\d+)?/)?.[0]);
    }

    // restroom과 parking(자전거 거치대) 모두 처리 대상에 포함
    const isTargetCategory = current.category === 'restroom' || current.category === 'parking';

    // FORCE_GEOCODE가 설정되어 있다면 기존 lat/lng 줄은 스킵하여 덮어쓰도록 처리
    if (forceGeocode && isTargetCategory && (isLatLine || isLngLine)) {
      continue;
    }

    const isObjectEnd = /^\s*\},?\s*$/.test(line);

    if (isObjectEnd && isTargetCategory) {
      if (!forceGeocode && current.hasLat && current.hasLng) {
        skipped += 1;
      } else {
        const candidate = current.roadAddress || current.address;
        if (candidate) {
          try {
            const coordinate = await geocode(candidate)
              || await searchPlace(current.name, candidate)
              || await searchPlace(current.name, '');

            if (coordinate) {
              output.push(`    "lat": ${coordinate.lat},`);
              output.push(`    "lng": ${coordinate.lng},`);
              updated += 1;
            } else {
              if (current.lat !== null && current.lng !== null) {
                output.push(`    "lat": ${current.lat},`);
                output.push(`    "lng": ${current.lng},`);
              }
              failed.push(`${current.name}: ${candidate}`);
            }
          } catch (error) {
            if (current.lat !== null && current.lng !== null) {
              output.push(`    "lat": ${current.lat},`);
              output.push(`    "lng": ${current.lng},`);
            }
            failed.push(`${current.name}: ${candidate} (${error.message})`);
          }
          await sleep(100);
        } else {
          failed.push(`${current.name}: 주소 없음`);
        }
      }
    }

    output.push(line);
    if (isObjectEnd) current = resetCurrent();
  }

  fs.writeFileSync(targetFile, output.join('\n'), 'utf8');
  console.log(`완료: ${updated}건 좌표 갱신, ${skipped}건 기존 좌표 유지, ${failed.length}건 실패`);
  if (failed.length) failed.forEach((item) => console.warn(`- ${item}`));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
