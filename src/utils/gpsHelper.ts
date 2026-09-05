export type GpsStatus = 'active' | 'searching' | 'denied' | 'timeout' | 'unavailable' | 'error';

export interface GpsHubPreset {
  id: string;
  name: string;
  badge: string;
  desc: string;
  lat: number;
  lng: number;
  address?: string;
}

export const ANYANG_GPS_PRESETS: GpsHubPreset[] = [
  {
    id: 'preset-ssanggaeul',
    name: '학의천·안양천 합수부 (쌍개울 광장)',
    badge: '라이딩 중심',
    desc: '안양천-학의천 만남의 광장 (만안구 안양7동)',
    lat: 37.3980,
    lng: 126.9380,
    address: '경기도 안양시 만안구 안양동 쌍개울 광장'
  },
  {
    id: 'preset-beomgye',
    name: '범계역 롯데백화점 앞 (동안구 평촌)',
    badge: '지하철 4호선',
    desc: '평촌 1번가 및 학원가 접근 중심지',
    lat: 37.3897,
    lng: 126.9507,
    address: '경기도 안양시 동안구 호계동 시민대로 180'
  },
  {
    id: 'preset-anyang-station',
    name: '안양역 1번출구 광장 (만안구)',
    badge: '기차/전철 1호선',
    desc: '안양일번가 및 수암천 라이딩 출발점',
    lat: 37.4018,
    lng: 126.9228,
    address: '경기도 안양시 만안구 안양동 만안로 232'
  },
  {
    id: 'preset-indeogwon',
    name: '인덕원역 4번출구 (학의천 연결)',
    badge: '과천/의왕 방면',
    desc: '학의천 자전거길 진입 램프 인접',
    lat: 37.4019,
    lng: 126.9767,
    address: '경기도 안양시 동안구 관양동 관악대로 486'
  },
  {
    id: 'preset-central-park',
    name: '평촌중앙공원 야외광장',
    badge: '문화/도심공원',
    desc: '분수대 및 안전 라이딩 연습 코스',
    lat: 37.3912,
    lng: 126.9598,
    address: '경기도 안양시 동안구 관양동 관평로 149'
  },
  {
    id: 'preset-art-park',
    name: '안양예술공원 안내센터 앞 (삼성천)',
    badge: '숲속 힐링로',
    desc: '삼성천 수변길 및 관악산 숲속 예술 쉼터',
    lat: 37.4285,
    lng: 126.9270,
    address: '경기도 안양시 만안구 석수동 예술공원로 131'
  },
  {
    id: 'preset-myeonghak',
    name: '명학역 광장 (만안구청 인근)',
    badge: '안양천변 1호선',
    desc: '안양천 충훈교 및 군포 연결로 인접',
    lat: 37.3845,
    lng: 126.9356,
    address: '경기도 안양시 만안구 안양동 안양로 111번길 42'
  },
  {
    id: 'preset-byeongmokan',
    name: '병목안 시민공원 입구 (수암천 종점)',
    badge: '수리산 자락',
    desc: '수암천 복원 자전거길 완주 지점',
    lat: 37.3880,
    lng: 126.9080,
    address: '경기도 안양시 만안구 안양9동 산81'
  },
];

export function isRunningInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}
