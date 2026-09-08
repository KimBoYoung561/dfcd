export type AppState = 'idle' | 'courseSelected';

export type TabType = 'home' | 'facilities' | 'record' | 'profile';

export type RouteType = 'oneway' | 'roundtrip';

export type FilterCategory = '추천 코스' | '경치 좋은' | '평지 중심' | '단거리' | '계단 없음' | '낮은 혼잡도';

export interface RouteSearchParams {
  routeType: RouteType;
  origin: string;
  originCoords?: LatLng;
  destination: string;
  destinationCoords?: LatLng;
  isDistanceLoop?: boolean;
  targetDistanceKm?: number;
  preferredFilter?: FilterCategory;
}

export type POICategory = 'water' | 'repair' | 'parking' | 'toilet';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface NavStep {
  id: string;
  iconType: 'up' | 'left' | 'right' | 'u-turn' | 'arrive' | 'crosswalk';
  text: string;
  sub: string;
  distanceMeter: number;
  warn?: boolean;
  instruction: string;
  crosswalkInfo?: {
    widthM: number;
    lengthM: number;
    dong: string;
    roadName?: string;
  };
}

export interface Course {
  id: string;
  tag: FilterCategory;
  name: string;
  distance: string;
  distanceKm: number;
  time: string;
  timeMinutes: number;
  type: string;
  arrival: string;
  bikePath: number; // legacy for backward compatibility
  road: number;     // legacy
  sidewalk: number; // legacy
  dedicatedBikeRatio?: number; // legacy alias
  sharedBikeRatio?: number;    // legacy alias
  sidewalkRatio?: number;      // legacy alias
  // 안양시 자전거도로 노선지정 고시 기준 세부 유형별 비율
  riverPathRatio?: number;     // 하천변 도로 (%) - 빨간색 (Red: #EF4444)
  segregatedRatio?: number;    // 분리도로 (%) - 남색 (Navy: #1E3A8A)
  unsegregatedRatio?: number;  // 비분리도로 (%) - 하늘색 (Sky Blue: #38BDF8)
  scenicScore?: string;        // 경치 평가 등급
  scenicHighlights?: string[]; // 경치 좋은 랜드마크 목록
  isScenicCourse?: boolean;    // 경치 우수 코스 태그
  stairs: number;
  overpass: number;
  slope: string;
  slopeLevel: '평탄' | '완만' | '경사';
  calories: number;
  description: string;
  startPoint: string;
  endPoint: string;
  path: [number, number][];
  elevationProfile: number[];
  navSteps: NavStep[];
}

export interface Facility {
  id: string;
  name: string;
  category: POICategory;
  categoryName: string;
  facilityType?: '음수대' | '수리시설' | '공기주입기' | '자전거보관소' | '화장실';
  address: string;
  roadAddress?: string;
  lat: number;
  lng: number;
  original?: string;
  searchKeyword?: string;
  detail?: string;
  description: string;
  availableItems?: string[];
  distance?: string;
  phone?: string;
  openHours?: string;
  managementAgency?: string;
  emergencyBell?: boolean;
  emergencyBellLocation?: string | null;
  disabledToilet?: boolean;
  cctv?: boolean;
  diaperTable?: boolean;
  diaperTableLocation?: string | null;
  flushType?: string | null;
  installationYear?: string | null;
  capacity?: number;
}

export interface RidingRecord {
  id: string;
  date: string;
  courseName: string;
  distanceKm: number;
  durationMinutes: number;
  avgSpeedKmh: number;
  maxSpeedKmh: number;
  calories: number;
  elevationM: number;
  path: [number, number][];
}

export type TTSVoiceType = 'female-clear' | 'male-calm' | 'female-friendly' | 'male-energetic';
export type ThemeColor = 'blue' | 'green' | 'dark' | 'high-contrast';
export type FontSize = 'normal' | 'large' | 'xlarge';
export type ReportCategory = 'closure' | 'accident' | 'damage' | 'hazard' | 'flooding';

export interface DisasterAlertItem {
  id: string;
  category: ReportCategory;
  categoryName: string;
  title: string;
  location: string;
  content: string;
  timestamp: string;
  sourceAgency: string;
  emergencyLevel?: '안내' | '주의' | '경계' | '심각';
  coordinates?: LatLng;
}

export interface DisasterApiStatus {
  connected: boolean;
  status: 'connected' | 'unregistered_key' | 'invalid_key' | 'network_error' | 'no_data';
  serviceKey: string;
  apiSource: string;
  endpoint: string;
  resultCode?: string;
  resultMsg?: string;
  errorMsg?: string;
  detailedReason?: string;
  lastCheckedAt: string;
  items: DisasterAlertItem[];
}

export interface CommunityReport {
  id: string;
  coordinates?: LatLng;
  category: ReportCategory;
  categoryName: string;
  title: string;
  location: string;
  content: string;
  timestamp: string;
  status: 'active' | 'resolved';
  likes: number;
  isLiked?: boolean;
  sourceType?: 'official_disaster' | 'rider_report';
  sourceAgency?: string;
  emergencyLevel?: '안내' | '주의' | '경계' | '심각';
}

export interface UserPreferences {
  avoidStairs: boolean;
  avoidSteepSlopes: boolean;
  voiceGuide: boolean;
  autoReroute: boolean;
  speedAlert: boolean;
  // Customization additions
  ttsVoice: TTSVoiceType;
  ttsSpeed: number;
  ttsPitch: number;
  themeColor: ThemeColor;
  fontSize: FontSize;
}

export interface OfficialStreamLine {
  id: string;
  name: string;
  streamName: '안양천' | '학의천' | '삼성천' | '수암천' | '삼막천' | '도심간선도로';
  color: string;
  totalDistanceKm: number;
  description: string;
  path: [number, number][];
  type: '하천전용로' | '도심전용로' | '보행겸용로';
}

export interface RampAccessPoint {
  id: string;
  name: string;
  streamName: string;
  type: '경사로(슬로프)' | '하천합수부쉼터' | '지하철연결로' | '자전거교량';
  lat: number;
  lng: number;
  description: string;
  connectedRoad?: string;
  hasAirPump?: boolean;
}

