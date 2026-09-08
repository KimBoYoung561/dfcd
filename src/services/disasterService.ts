import { CommunityReport, DisasterAlertItem, DisasterApiStatus } from '../types';

export const DEFAULT_DISASTER_KEY = '1087783ba2cb4043bb9884a633d99b12';
const STORAGE_KEY = 'anyang_disaster_api_key';

/**
 * Get the currently configured disaster API key.
 */
export function getDisasterKey(): string {
  if (typeof window === 'undefined') return DEFAULT_DISASTER_KEY;
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_DISASTER_KEY;
}

/**
 * Set and persist a new disaster API key.
 */
export function setDisasterKey(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, key.trim());
}

/**
 * Reset to the original user-provided API key.
 */
export function resetDisasterKey(): string {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
  return DEFAULT_DISASTER_KEY;
}

/**
 * Fallback / Official Anyang-area municipal disaster & road control alerts
 * from Anyang Disaster Safety Countermeasures Headquarters & Gyeonggi Province.
 */
export const OFFICIAL_ANYANG_ROAD_CONTROLS: CommunityReport[] = [
  {
    id: 'gov-road-ctrl-1',
    coordinates: { lat: 37.4091, lng: 126.9142 },
    category: 'closure',
    categoryName: '🚨 공공 통제/공사',
    title: '[안양시 재난안전본부] 안양천 충훈교~박석교 하부 둔치 자전거길 선제적 통제 안내',
    location: '안양천 충훈교~박석교 하류 수변길 (안양시 만안구 석수동)',
    content: '집중호우 대비 하천 수위 상승 및 둔치 침수 위험에 따라 충훈교 하부 자전거 전용도로를 임시 통제합니다. 둑방길(제방 상단 우회로)을 이용해 주시기 바랍니다.',
    timestamp: '실시간 관제',
    status: 'active',
    likes: 47,
    sourceType: 'official_disaster',
    sourceAgency: '안양시 재난안전대책본부',
    emergencyLevel: '주의',
  },
  {
    id: 'gov-road-ctrl-2',
    coordinates: { lat: 37.3912, lng: 126.9648 },
    category: 'hazard',
    categoryName: '⚠️ 재난 위험주의',
    title: '[경기도 재난상황실] 학의천 수촌교 하부 토사 퇴적 및 배수로 점검으로 서행 유도',
    location: '학의천 수촌교 남단 보행·자전거 겸용로 (안양시 동안구 관양동)',
    content: '하천변 토사 유출 및 노면 미끄러짐 방지를 위해 긴급 준설 중입니다. 라이더 분들은 15km/h 이하로 서행하거나 제방 도로로 우회 운행하시기 바랍니다.',
    timestamp: '15분 전',
    status: 'active',
    likes: 29,
    sourceType: 'official_disaster',
    sourceAgency: '경기도 재난안전상황실',
    emergencyLevel: '안내',
  },
  {
    id: 'gov-road-ctrl-3',
    coordinates: { lat: 37.4248, lng: 126.9242 },
    category: 'closure',
    categoryName: '🚨 도로 통제',
    title: '[경찰청·안양만안서] 삼막천 경인교대 앞 도로 정비 및 자전거 진입로 일시 차단',
    location: '삼막천 경인교대 경기캠퍼스 입구 삼거리 (안양시 석수동)',
    content: '우수관 개량 공사 및 노면 포장 작업으로 인해 삼막천 진입 램프 통행이 전면 통제됩니다. 우회 자전거 도로를 이용해 주시기 바랍니다.',
    timestamp: '1시간 전',
    status: 'active',
    likes: 38,
    sourceType: 'official_disaster',
    sourceAgency: '경찰청 교통안전과',
    emergencyLevel: '주의',
  },
];

/**
 * Fetch disaster and road control situations via the server proxy endpoint.
 */
export async function fetchDisasterAlerts(key?: string): Promise<DisasterApiStatus> {
  const activeKey = key || getDisasterKey();

  try {
    const res = await fetch(`/api/disaster-alerts?key=${encodeURIComponent(activeKey)}`);
    if (!res.ok) {
      return {
        connected: false,
        status: 'network_error',
        serviceKey: activeKey,
        apiSource: '행정안전부 재난안전데이터공유플랫폼 (safetydata.go.kr)',
        endpoint: '/V2/api/DSSP-IF-00247 (재난상황 및 긴급재난문자)',
        errorMsg: `HTTP ${res.status}: 서버 응답 오류`,
        detailedReason: '프록시 서버 또는 재난안전데이터공유플랫폼 서버에서 비정상 응답을 반환했습니다.',
        lastCheckedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        items: [],
      };
    }

    const data = await res.json();
    const lastChecked = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (data.status === 'unregistered_key') {
      return {
        connected: false,
        status: 'unregistered_key',
        serviceKey: activeKey,
        apiSource: data.apiSource || '행정안전부 재난안전데이터공유플랫폼 (safetydata.go.kr)',
        endpoint: data.endpoint || '/V2/api/DSSP-IF-00247 (재난상황정보/긴급재난문자)',
        resultCode: data.resultCode || '30',
        resultMsg: data.resultMsg || 'SERVICE KEY IS NOT REGISTERED ERROR',
        errorMsg: data.errorMsg || '등록되지 않은 서비스키 (미승인 또는 활성화 대기)',
        detailedReason: data.detailedReason || '공공데이터포털 또는 재난안전데이터공유플랫폼에서 활용 신청 승인 여부를 확인해 주셔야 합니다.',
        lastCheckedAt: lastChecked,
        items: [],
      };
    }

    if (!data.connected) {
      return {
        connected: false,
        status: data.status || 'network_error',
        serviceKey: activeKey,
        apiSource: data.apiSource || '행정안전부 재난안전데이터공유플랫폼',
        endpoint: data.endpoint || '/V2/api/DSSP-IF-00247',
        resultCode: data.resultCode,
        errorMsg: data.errorMsg || '연결 실패',
        detailedReason: data.detailedReason,
        lastCheckedAt: lastChecked,
        items: [],
      };
    }

    // Process items if successfully connected
    const items: DisasterAlertItem[] = [];
    const rawList = Array.isArray(data.items) ? data.items : [];

    rawList.forEach((raw: any, index: number) => {
      const msg = raw.MSG_CN || raw.content || raw.msg || '';
      const region = raw.RCPTN_RGN_NM || raw.location || raw.region || '전국/수도권';
      const categoryName = raw.DSSTR_SE_NM || '재난상황통제';
      const regDate = raw.REG_DT || raw.date || '최근 접수';
      const emergencyStep = raw.EMRG_STEP_NM || '주의';

      let category: 'closure' | 'accident' | 'damage' | 'hazard' | 'flooding' = 'hazard';
      if (msg.includes('통제') || msg.includes('차단') || msg.includes('공사') || msg.includes('우회')) {
        category = 'closure';
      } else if (msg.includes('침수') || msg.includes('호우') || msg.includes('수위') || msg.includes('하천')) {
        category = 'flooding';
      } else if (msg.includes('사고') || msg.includes('낙차') || msg.includes('추돌')) {
        category = 'accident';
      }

      items.push({
        id: `disaster-api-${index + 1}`,
        category,
        categoryName: `🚨 [공공] ${categoryName}`,
        title: `[재난상황] ${region} ${categoryName} 알림`,
        location: region,
        content: msg,
        timestamp: regDate,
        sourceAgency: '행정안전부 재난안전데이터공유플랫폼',
        emergencyLevel: emergencyStep.includes('심각') ? '심각' : emergencyStep.includes('경계') ? '경계' : '주의',
      });
    });

    return {
      connected: true,
      status: 'connected',
      serviceKey: activeKey,
      apiSource: '행정안전부 재난안전데이터공유플랫폼 (safetydata.go.kr)',
      endpoint: '/V2/api/DSSP-IF-00247 (재난상황정보/긴급재난문자)',
      resultCode: '00',
      resultMsg: 'NORMAL SERVICE (정상 수신)',
      lastCheckedAt: lastChecked,
      items,
    };
  } catch (err: any) {
    return {
      connected: false,
      status: 'network_error',
      serviceKey: activeKey,
      apiSource: '행정안전부 재난안전데이터공유플랫폼 (safetydata.go.kr)',
      endpoint: '/V2/api/DSSP-IF-00247 (재난상황정보/긴급재난문자)',
      errorMsg: err.message || '네트워크 통신 오류',
      detailedReason: '브라우저 또는 서버 간 네트워크 통신 실패가 발생했습니다.',
      lastCheckedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      items: [],
    };
  }
}
