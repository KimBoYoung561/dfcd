export interface WeatherSummary {
  tempC: number | null;
  temperatureC?: number | null;
  windSpeedMps: number | null;
  windDirection: string;
  humidity: number | null;
  precipitationType: string;
  precipitationMm?: number | null;
  summary: string;
  airQualityLabel: string;
  uvLabel: string;
  dataSource?: string;
  safetyAlert?: {
    level: 'normal' | 'warning' | 'danger';
    title: string;
    message: string;
    icon?: string;
    bridgeWarning?: string;
    checklist?: string[];
  };
}

const KMA_SERVICE_KEY = 'xJTccV8Y5ncidvbMpb2EWknkSkXIk%2Bm3sXMsfiifXMABV29B%2Banj%2BhYvVbvTVqwRsAjEsri%2FZ34gsye2eDgFGA%3D%3D';
const KMA_BASE_URL = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0';

const VALID_BASE_TIMES = ['0200', '0500', '0800', '1100', '1400', '1700', '2000', '2300'];

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function getLocalDateParts(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return {
    year: local.getFullYear(),
    month: pad2(local.getMonth() + 1),
    day: pad2(local.getDate()),
    hour: local.getHours(),
  };
}

function getNearestBaseTime(date: Date) {
  const { year, month, day, hour } = getLocalDateParts(date);
  const currentHour = hour;
  let baseTime = '0200';

  for (const candidate of VALID_BASE_TIMES) {
    const candidateHour = Number(candidate.slice(0, 2));
    if (candidateHour <= currentHour) {
      baseTime = candidate;
    }
  }

  const candidateHour = Number(baseTime.slice(0, 2));
  const adjustedDate = new Date(date.getTime());
  if (candidateHour > currentHour && currentHour < 2) {
    adjustedDate.setDate(adjustedDate.getDate() - 1);
  }

  const adjusted = getLocalDateParts(adjustedDate);
  return {
    baseDate: `${adjusted.year}${adjusted.month}${adjusted.day}`,
    baseTime,
  };
}

function getWindDirectionFromDegrees(deg: number | null): string {
  if (deg === null || !Number.isFinite(deg)) return '무풍';
  const directions = ['북풍', '북동풍', '동풍', '남동풍', '남풍', '남서풍', '서풍', '북서풍'];
  const index = Math.round((deg % 360) / 45) % 8;
  return directions[index];
}

function getPrecipitationLabel (code: number | null): string {
  switch (code) {
    case 1:
      return '비';
    case 2:
      return '비/눈';
    case 3:
      return '눈';
    case 4:
      return '소나기';
    default:
      return '맑음';
  }
}

function getAirQualityLabel(tempC: number | null, humidity: number | null): string {
  if (tempC === null || humidity === null) return '양호';
  if (tempC >= 28 && humidity >= 70) return '보통';
  if (humidity >= 80) return '보통';
  return '좋음';
}

function getUvLabel(tempC: number | null, windSpeedMps: number | null): string {
  if (tempC === null || windSpeedMps === null) return '보통';
  if (tempC >= 30 && windSpeedMps <= 4) return '높음';
  if (tempC >= 26) return '보통';
  return '낮음';
}

function buildSummary(tempC: number | null, windSpeedMps: number | null): string {
  if (tempC === null && windSpeedMps === null) {
    return '현재 날씨 정보를 불러오고 있습니다.';
  }

  const tempText = tempC === null ? '기온 정보 없음' : `${Math.round(tempC)}°C`;
  const windText = windSpeedMps === null ? '풍속 정보 없음' : `${windSpeedMps.toFixed(1)}m/s`;

  if (tempC !== null && windSpeedMps !== null) {
    if (tempC >= 20 && tempC <= 28 && windSpeedMps <= 5) {
      return `현재 ${tempText}에 바람도 ${windText}로 자전거 타기 좋은 날씨입니다.`;
    }
    if (windSpeedMps > 7) {
      return `현재 ${tempText}이고 풍속 ${windText}로 바람이 강해 라이딩 준비를 더 신경 써야 합니다.`;
    }
    return `현재 ${tempText}이고 풍속 ${windText}로 무난한 라이딩 조건입니다.`;
  }

  return `현재 ${tempText}와 ${windText} 기준으로 라이딩 상태를 확인 중입니다.`;
}

function toGrid(lat: number, lng: number) {
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

  let sn = Math.tan(Math.PI / 4 + slat2 / 2) / Math.tan(Math.PI / 4 + slat1 / 2);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);

  const sf = Math.pow(Math.tan(Math.PI / 4 + lat * DEGRAD / 2), sn) * Math.cos(slat1) / Math.pow(Math.tan(Math.PI / 4 + slat1 / 2), sn);
  const ro = re * sf / Math.pow(Math.tan(Math.PI / 4 + olat / 2), sn);
  const theta = sn * (lng * DEGRAD - olon);

  const x = ro * Math.sin(theta) + XO;
  const y = ro * Math.cos(theta) + YO;

  return {
    nx: Math.round(x),
    ny: Math.round(y),
  };
}

export async function fetchKmaWeather(lat: number, lng: number): Promise<WeatherSummary> {
  const { baseDate, baseTime } = getNearestBaseTime(new Date());
  const { nx, ny } = toGrid(lat, lng);

  const url = `${KMA_BASE_URL}/getUltraSrtNcst?serviceKey=${encodeURIComponent(KMA_SERVICE_KEY)}&pageNo=1&numOfRows=100&dataType=JSON&base_date=${baseDate}&base_time=${baseTime}&nx=${nx}&ny=${ny}`;

  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`KMA weather request failed: ${response.status}`);
  }

  const data = await response.json();
  const items = data?.response?.body?.items?.item ?? [];

  const itemMap = new Map<string, string | number>();
  items.forEach((item: any) => {
    itemMap.set(item.category, item.obsrValue ?? item.fcstValue ?? item.category);
  });

  const tempC = Number(itemMap.get('T1H'));
  const windSpeedMps = Number(itemMap.get('WSD'));
  const humidity = Number(itemMap.get('REH'));
  const vecDeg = Number(itemMap.get('VEC'));
  const precipitationCode = Number(itemMap.get('PTY'));

  const rn1Val = Number(itemMap.get('RN1'));
  const precipitationMm = Number.isFinite(rn1Val) ? rn1Val : 0;
  const validTemp = Number.isFinite(tempC) ? tempC : null;
  const validWind = Number.isFinite(windSpeedMps) ? windSpeedMps : null;

  // Build safety alert based on weather criteria
  let safetyLevel: 'normal' | 'warning' | 'danger' = 'normal';
  let alertTitle = '실시간 기상청 연동 안전 라이딩';
  let alertMessage = '안양천 및 학의천 자전거 전용도로 주행에 적합한 기상 조건입니다.';
  let alertIcon = '🚲';
  let bridgeWarning = '학의천·안양천 합수부(쌍개울) 및 하상 교량 진입 시 서행 및 안전거리 확보';
  const checklist = [
    'KC인증 헬멧 및 전·후미등 점검',
    '하천변 보행자 겸용구간 시속 20km 이하 서행',
    '교량 하부 음영구간 노면 상태 주의',
  ];

  if (precipitationCode && precipitationCode > 0) {
    safetyLevel = precipitationCode === 1 || precipitationCode === 4 ? 'danger' : 'warning';
    alertTitle = '우천/강설 미끄럼 주의보';
    alertMessage = '노면이 젖어 제동거리가 2배 이상 증가합니다. 급제동을 피하고 감속 운행하세요.';
    alertIcon = '🌧️';
    bridgeWarning = '하천변 데크로드 및 교량 이음매 미끄럼 위험 구역, 하차 보행 권장';
    checklist.unshift('우천 시 하천 징검다리 및 하상도로 진입 절대 금지');
  } else if (validWind && validWind >= 8) {
    safetyLevel = 'danger';
    alertTitle = '돌풍 / 강풍 위험 경보';
    alertMessage = `현재 풍속 ${validWind.toFixed(1)}m/s로 측풍 위험이 높습니다. 핸들을 단단히 잡으세요.`;
    alertIcon = '💨';
    bridgeWarning = '충훈교, 비산교 등 오픈 교량 횡단 시 강한 측풍 돌풍 주의';
    checklist.unshift('강풍 시 하천 제방 상단 도로 주행 자제');
  } else if (validWind && validWind >= 5) {
    safetyLevel = 'warning';
    alertTitle = '하천변 돌풍 주의';
    alertMessage = `현재 풍속 ${validWind.toFixed(1)}m/s입니다. 교량 통과 시 맞바람 및 측풍에 유의하세요.`;
    alertIcon = '🍃';
    bridgeWarning = '안양천-학의천 합수부(쌍개울) 개방 수변 강풍 유의';
  } else if (validTemp && validTemp >= 33) {
    safetyLevel = 'warning';
    alertTitle = '폭염 주의 라이딩';
    alertMessage = '한낮 체감온도가 높습니다. 30분 간격으로 수분을 충분히 섭취하세요.';
    alertIcon = '☀️';
    checklist.unshift('직사광선 차단용 쿨토시/선글라스 및 보온보냉 물통 준비');
  } else if (validTemp && validTemp <= -5) {
    safetyLevel = 'warning';
    alertTitle = '한파 / 결빙 주의';
    alertMessage = '그늘진 수변로 및 교량 하부에 블랙아이스(결빙)가 있을 수 있습니다.';
    alertIcon = '❄️';
    checklist.unshift('그늘진 수변 구간 및 교량 밑 서행 통과');
  }

  return {
    tempC: validTemp,
    temperatureC: validTemp,
    windSpeedMps: validWind,
    windDirection: getWindDirectionFromDegrees(Number.isFinite(vecDeg) ? vecDeg : null),
    humidity: Number.isFinite(humidity) ? humidity : null,
    precipitationType: getPrecipitationLabel(Number.isFinite(precipitationCode) ? precipitationCode : null),
    precipitationMm,
    summary: buildSummary(validTemp, validWind),
    airQualityLabel: getAirQualityLabel(validTemp, Number.isFinite(humidity) ? humidity : null),
    uvLabel: getUvLabel(validTemp, validWind),
    dataSource: '기상청 초단기실황',
    safetyAlert: {
      level: safetyLevel,
      title: alertTitle,
      message: alertMessage,
      icon: alertIcon,
      bridgeWarning,
      checklist,
    },
  };
}
