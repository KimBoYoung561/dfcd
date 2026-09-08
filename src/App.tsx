import { useState, useEffect, useRef } from 'react';
import {
  User,
  X,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  BookOpen,
  TreePine,
  ShieldCheck,
  Zap,
  Info,
  AlertTriangle,
  ShieldAlert,
  MapPin,
  Radio,
  Crosshair,
  Wrench,
  Bike,
} from 'lucide-react';

import {
  AppState,
  TabType,
  RouteType,
  RouteSearchParams,
  FilterCategory,
  POICategory,
  Course,
  Facility,
  UserPreferences,
  RampAccessPoint,
  CommunityReport,
  RidingRecord,
} from './types';

import { FILTER_TAGS, COURSE_DATA, ANYANG_CENTER, OFFICIAL_STREAM_LINES } from './data/courses';
import { ANYANG_FACILITIES } from './data/facilities';
import { ANYANG_CROSSWALKS, CrosswalkInfo } from './data/crosswalkData';
import { INITIAL_COMMUNITY_REPORTS } from './data/reports';
import {
  createFacilityOptimalRoute,
  createCustomOptimalRoute,
  createLoopRouteByDistance,
  fetchCustomOptimalRouteAsync,
  getCurrentTimeString,
  getCalculatedArrivalTime,
} from './utils/routeUtils';
import { coordToAddress, geocodeFacilityLocation, refineFacilitySearchKeyword, Coordinates } from './services/kakaoService';
import { getBearing, getPointToPolylineDistanceMeters } from './utils/navigationMath';
import MapComponent from './components/MapComponent';
import QuickReportModal from './components/QuickReportModal';
import DepartureTimeModal from './components/DepartureTimeModal';
import FacilityDetailModal from './components/FacilityDetailModal';
import { fetchKmaWeather, type WeatherSummary } from './services/weatherService';
import OfficialBicycleMapModal from './components/OfficialBicycleMapModal';
import AllCoursesModal from './components/AllCoursesModal';
import FacilitiesTab from './components/FacilitiesTab';
import RecordTab from './components/RecordTab';
import ProfileTab from './components/ProfileTab';
import WeatherCyclingSafetyBanner from './components/WeatherCyclingSafetyBanner';
import HomeWeatherAiCard from './components/HomeWeatherAiCard';
import HomeAttractionsSection from './components/HomeAttractionsSection';
import AttractionDetailModal from './components/AttractionDetailModal';
import GpsTroubleshootModal from './components/GpsTroubleshootModal';
import AiChatbotModal from './components/AiChatbotModal';
import { ANYANG_TOUR_SPOTS, AnyangTourSpot } from './data/anyangAttractions';
import { GpsStatus, GpsHubPreset } from './utils/gpsHelper';

/* ─── Sub-components for Sheets ─── */
function FilterTags({
  active,
  onSelect,
}: {
  active: FilterCategory;
  onSelect: (tag: FilterCategory) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
      {FILTER_TAGS.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => onSelect(tag)}
          className={`shrink-0 rounded-xl px-4 py-2 min-h-[44px] text-xs font-bold whitespace-nowrap transition-all ${
            active === tag
              ? 'bg-[#0055FF] text-white shadow-md'
              : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 active:bg-slate-300'
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}

function CongestionBar({ level = 1 }: { level?: number }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] text-slate-500 font-bold">도로 혼잡도</span>
      <div className="flex items-center gap-1.5">
        <div className="h-2.5 w-6 rounded-full bg-emerald-500 shadow-xs"></div>
        <div className="h-2.5 w-6 rounded-full bg-emerald-100"></div>
        <div className="h-2.5 w-6 rounded-full bg-emerald-100"></div>
        <span className="text-xs font-bold text-emerald-600 ml-1">원활</span>
      </div>
    </div>
  );
}

function PathTypeBar({
  riverPathRatio,
  segregatedRatio,
  unsegregatedRatio,
  dedicatedBikeRatio = 0,
  sharedBikeRatio = 0,
  sidewalkRatio = 0,
  legacyBikePath = 0,
  legacyRoad = 0,
  legacySidewalk = 0,
}: {
  riverPathRatio?: number;
  segregatedRatio?: number;
  unsegregatedRatio?: number;
  dedicatedBikeRatio?: number;
  sharedBikeRatio?: number;
  sidewalkRatio?: number;
  legacyBikePath?: number;
  legacyRoad?: number;
  legacySidewalk?: number;
}) {
  // Determine breakdown ratios
  let river = riverPathRatio;
  let segregated = segregatedRatio;
  let unsegregated = unsegregatedRatio;

  if (river === undefined || segregated === undefined || unsegregated === undefined) {
    const ded = dedicatedBikeRatio > 0 ? dedicatedBikeRatio : legacyBikePath || 85;
    const sha = sharedBikeRatio > 0 ? sharedBikeRatio : legacyRoad || 10;
    const sw = sidewalkRatio > 0 ? sidewalkRatio : legacySidewalk || 5;

    river = Math.round(ded * 0.88);
    segregated = Math.round(ded * 0.12) + Math.round(sha * 0.7);
    unsegregated = Math.max(1, 100 - river - segregated);
  }

  // Normalize sum to 100
  const sum = river + segregated + unsegregated;
  if (sum !== 100 && sum > 0) {
    unsegregated += (100 - sum);
  }

  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
      {/* Header with Official Badge */}
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Info size={14} className="text-[#0055FF]" />
          <span className="text-xs font-bold text-slate-800">
            자전거 도로 유형별 비율 안내
          </span>
          <span className="rounded bg-blue-50 border border-blue-200 px-1.5 py-0.5 text-[9px] font-bold text-[#0055FF]">
            고시도면 기준
          </span>
        </div>
        <span className="text-[11px] font-extrabold text-slate-700">
          총 100%
        </span>
      </div>

      {/* Visual Percentage Stacked Bar (Red, Navy, Sky Blue) */}
      <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner border border-slate-200/80 p-0.5">
        {river > 0 && (
          <div
            className="h-full rounded-l-full bg-[#EF4444] transition-all"
            style={{ width: `${river}%` }}
            title={`하천변 도로: ${river}%`}
          />
        )}
        {segregated > 0 && (
          <div
            className="h-full bg-[#1E3A8A] transition-all"
            style={{ width: `${segregated}%` }}
            title={`분리도로: ${segregated}%`}
          />
        )}
        {unsegregated > 0 && (
          <div
            className="h-full rounded-r-full bg-[#38BDF8] transition-all"
            style={{ width: `${unsegregated}%` }}
            title={`비분리도로: ${unsegregated}%`}
          />
        )}
      </div>

      {/* Detailed 3-Column Legend with Official Colors & Meaning */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {/* 1. 하천변 도로 (빨간색 - Red) */}
        <div className="flex flex-col items-center rounded-xl bg-red-50/70 border border-red-200/80 p-2">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] shrink-0 shadow-xs" />
            <span className="text-[11px] font-bold text-red-900">하천변 도로</span>
          </div>
          <span className="text-sm font-black text-[#EF4444] mt-0.5">
            {river}%
          </span>
          <span className="text-[9px] text-red-700 font-medium leading-tight mt-0.5">
            수변 전용 자전거길
          </span>
        </div>

        {/* 2. 분리도로 (남색 - Navy) */}
        <div className="flex flex-col items-center rounded-xl bg-blue-50/80 border border-blue-900/20 p-2">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1E3A8A] shrink-0 shadow-xs" />
            <span className="text-[11px] font-bold text-[#1E3A8A]">분리도로</span>
          </div>
          <span className="text-sm font-black text-[#1E3A8A] mt-0.5">
            {segregated}%
          </span>
          <span className="text-[9px] text-blue-900 font-medium leading-tight mt-0.5">
            보·차도 완전 분리
          </span>
        </div>

        {/* 3. 비분리도로 (하늘색 - Sky Blue) */}
        <div className="flex flex-col items-center rounded-xl bg-sky-50/80 border border-sky-200 p-2">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8] shrink-0 shadow-xs" />
            <span className="text-[11px] font-bold text-sky-900">비분리도로</span>
          </div>
          <span className="text-sm font-black text-[#0284C7] mt-0.5">
            {unsegregated}%
          </span>
          <span className="text-[9px] text-sky-800 font-medium leading-tight mt-0.5">
            보행자 겸용 서행로
          </span>
        </div>
      </div>

      <p className="mt-2 text-[10px] text-slate-500 text-center leading-relaxed">
        * 안양시 자전거도로 노선지정 고시도면 기준: 
        <span className="font-semibold text-red-600 ml-1">🔴 하천변</span> · 
        <span className="font-semibold text-[#1E3A8A] ml-1">🔵 분리도로</span> · 
        <span className="font-semibold text-sky-600 ml-1">🔷 비분리도로</span>
      </p>
    </div>
  );
}

function BottomNav({
  active = 'home',
  onChangeTab,
}: {
  active: TabType;
  onChangeTab: (tab: TabType) => void;
}) {
  const items: Array<{ id: TabType; icon: any; label: string }> = [
    { id: 'home', icon: MapPin, label: '메인' },
    { id: 'facilities', icon: Wrench, label: '편의시설' },
    { id: 'record', icon: Bike, label: '기록·안전' },
    { id: 'profile', icon: User, label: '내 설정' },
  ];
  return (
    <nav className="flex h-16 shrink-0 items-center justify-around border-t border-slate-200 bg-white shadow-lg">
      {items.map(({ id, icon: Icon, label }) => {
        const isSelected = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChangeTab(id)}
            className={`flex flex-1 flex-col items-center justify-center gap-1 py-1.5 min-h-[48px] transition-all ${
              isSelected ? 'text-[#0055FF] font-bold scale-105' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={isSelected ? 'relative' : ''}>
              <Icon size={21} strokeWidth={isSelected ? 2.5 : 1.9} />
              {isSelected && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#0055FF]" />
              )}
            </div>
            <span className="text-[11px] tracking-tight">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function HomeSummarySheet({
  origin,
  weather,
  riderPosition,
  onOpenAttractionModal,
  onOpenGpsModal,
  onSelectAttraction,
  onOpenAiChatbot,
  onNavigateToFacilitiesTab,
}: {
  origin: string;
  weather: WeatherSummary | null;
  riderPosition: { lat: number; lng: number } | null;
  onOpenAttractionModal: () => void;
  onOpenGpsModal: () => void;
  onSelectAttraction: (spot: AnyangTourSpot) => void;
  onOpenAiChatbot?: () => void;
  onNavigateToFacilitiesTab?: () => void;
}) {
  return (
    <div className="px-3.5 pb-6 pt-1 text-slate-900 space-y-3.5 max-h-[72vh] overflow-y-auto hide-scrollbar">
      {/* ── 1. Real-time Weather & AI Cycling Coach Advice Card ── */}
      <HomeWeatherAiCard weather={weather} origin={origin} />

      {/* ── 2. Recommended Attractions Section (Search, Categories, Sort, List) ── */}
      <HomeAttractionsSection
        riderPosition={riderPosition}
        onSelectAttraction={onSelectAttraction}
        onOpenAiChatbot={onOpenAiChatbot}
      />
    </div>
  );
}

/* ─── Main App Component ─── */
export default function App() {
  // Navigation & Screen states
  const [appState, setAppState] = useState<AppState>('idle');
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [mapCenter, setMapCenter] = useState<Coordinates>(ANYANG_CENTER);

  // Route & Course selection
  const [origin, setOrigin] = useState('내 현재 위치');
  const [destination, setDestination] = useState('');
  const [routeType, setRouteType] = useState<RouteType>('oneway');
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('추천 코스');
  const [selectedCourse, setSelectedCourse] = useState<Course>(COURSE_DATA['추천 코스']);
  const [departureTime, setDepartureTime] = useState<string>(getCurrentTimeString());

  // Active POI Filter toggles (e.g. water, repair, restroom, parking)
  const [activePoiFilters, setActivePoiFilters] = useState<POICategory[]>([]);

  // Modals
  const [isDepartureModalOpen, setIsDepartureModalOpen] = useState(false);
  const [isOfficialGuideOpen, setIsOfficialGuideOpen] = useState(false);
  const [isAllCoursesOpen, setIsAllCoursesOpen] = useState(false);
  const [isQuickReportOpen, setIsQuickReportOpen] = useState(false);
  const [selectedFacilityDetail, setSelectedFacilityDetail] = useState<Facility | null>(null);

  // GPS & Troubleshoot State
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('active');
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsMessage, setGpsMessage] = useState<string>('');
  const [isLocating, setIsLocating] = useState(false);
  const [isGpsTroubleshootOpen, setIsGpsTroubleshootOpen] = useState(false);
  const [isMapPickMode, setIsMapPickMode] = useState(false);

  // Anyang Attractions & Tour Spots State
  const [selectedAttraction, setSelectedAttraction] = useState<AnyangTourSpot | null>(ANYANG_TOUR_SPOTS[0]);
  const [isAttractionModalOpen, setIsAttractionModalOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  // Real-time Community Reports state
  const [reports, setReports] = useState<CommunityReport[]>(INITIAL_COMMUNITY_REPORTS);
  const [reportCoordinates, setReportCoordinates] = useState<{ lat: number; lng: number } | undefined>();
  const [routeWarning, setRouteWarning] = useState<CommunityReport | null>(null);
  const [warningRouteKey, setWarningRouteKey] = useState<string | null>(null);
  const [activeRouteEndpoints, setActiveRouteEndpoints] = useState<{
    origin: { lat: number; lng: number };
    destination: { lat: number; lng: number };
  } | null>(null);
  const [weather, setWeather] = useState<WeatherSummary | null>(null);
  const lastTriggeredReportIdRef = useRef<string | null>(null);

  // Riding Records with LocalStorage Persistence
  const [records, setRecords] = useState<RidingRecord[]>(() => {
    try {
      const saved = localStorage.getItem('anyang_riding_records');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'rec-1',
        date: '2026-08-14 18:30',
        courseName: '안양천-학의천 쌍개울 힐링 순환 코스',
        distanceKm: 5.8,
        durationMinutes: 25,
        avgSpeedKmh: 19.5,
        maxSpeedKmh: 28.0,
        calories: 220,
        elevationM: 27,
        path: COURSE_DATA['추천 코스'].path,
      },
      {
        id: 'rec-2',
        date: '2026-08-12 10:15',
        courseName: '학의천 평지 쾌속선 (쌍개울~인덕원교)',
        distanceKm: 4.5,
        durationMinutes: 20,
        avgSpeedKmh: 21.0,
        maxSpeedKmh: 29.5,
        calories: 175,
        elevationM: 20,
        path: COURSE_DATA['평지 중심'].path,
      },
    ];
  });

  const handleAddRecord = (newRec: RidingRecord) => {
    setRecords((prev) => {
      const updated = [newRec, ...prev];
      try {
        localStorage.setItem('anyang_riding_records', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const handleClearRecords = () => {
    setRecords([]);
    try {
      localStorage.removeItem('anyang_riding_records');
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteRecord = (id: string) => {
    setRecords((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      try {
        localStorage.setItem('anyang_riding_records', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const handleSelectRecordRoute = (rec: RidingRecord) => {
    const matched = Object.values(COURSE_DATA).find((c) => c.name === rec.courseName) || COURSE_DATA['추천 코스'];
    setSelectedCourse(matched);
    setActiveFilter(matched.tag);
    setAppState('courseSelected');
    setCurrentTab('home');
    setIsBottomSheetOpen(true);
  };

  const handleAddReport = (newRep: CommunityReport) => {
    const fallbackPoint = riderPosition || (selectedCourse.path[0]
      ? { lat: selectedCourse.path[0][0], lng: selectedCourse.path[0][1] }
      : undefined);
    const reportWithCoordinates = newRep.coordinates
      ? newRep
      : { ...newRep, coordinates: fallbackPoint };
    setReports((prev) => [reportWithCoordinates, ...prev]);
    if (
      appState !== 'idle' &&
      reportWithCoordinates.status === 'active' &&
      reportWithCoordinates.coordinates &&
      getPointToPolylineDistanceMeters(reportWithCoordinates.coordinates, selectedCourse.path) <= 40
    ) {
      setRouteWarning(reportWithCoordinates);
    }
  };

  const checkRouteReports = (path: [number, number][], routeKey: string) => {
    const nearbyReport = reports.find((report) =>
      report.status === 'active' && report.coordinates &&
      getPointToPolylineDistanceMeters(report.coordinates, path) <= 40
    );
    if (nearbyReport && warningRouteKey !== routeKey) {
      setWarningRouteKey(routeKey);
      setRouteWarning(nearbyReport);
    }
  };

  const handleSelectReport = (report: CommunityReport) => {
    if (
      appState !== 'idle' &&
      report.status === 'active' &&
      report.coordinates &&
      getPointToPolylineDistanceMeters(report.coordinates, selectedCourse.path) <= 40
    ) {
      setRouteWarning(report);
    }
  };

  const rerouteAroundReport = (report: CommunityReport) => {
    if (!report.coordinates || !activeRouteEndpoints) return;
    setRouteWarning(null);
    Promise.all([
      fetchCustomOptimalRouteAsync(selectedCourse.startPoint, activeRouteEndpoints.origin, destination, activeRouteEndpoints.destination, routeType, activeFilter, report.coordinates, 1),
      fetchCustomOptimalRouteAsync(selectedCourse.startPoint, activeRouteEndpoints.origin, destination, activeRouteEndpoints.destination, routeType, activeFilter, report.coordinates, -1),
    ])
      .then(([firstRoute, secondRoute]) => {
        const firstDistance = getPointToPolylineDistanceMeters(report.coordinates!, firstRoute.path);
        const secondDistance = getPointToPolylineDistanceMeters(report.coordinates!, secondRoute.path);
        return firstDistance >= secondDistance ? firstRoute : secondRoute;
      })
      .then((reroutedCourse) => {
        setSelectedCourse({
          ...reroutedCourse,
          description: `${reroutedCourse.description} ${report.categoryName} 제보 구간을 피해 실제 자전거도로로 재탐색한 경로입니다.`,
        });
      })
      .catch((error) => console.warn('Report avoidance route failed:', error));
  };

  const handleToggleLikeReport = (id: string) => {
    setReports((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const isLiked = !r.isLiked;
          return {
            ...r,
            likes: isLiked ? r.likes + 1 : r.likes - 1,
            isLiked,
          };
        }
        return r;
      })
    );
  };

  // Panel Collapsible / Expandable (Toggle) states
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(true);

  // Rider position
  const [riderPosition, setRiderPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [panToTrigger, setPanToTrigger] = useState(0);
  const [isGpsActive, setIsGpsActive] = useState(true);

  useEffect(() => {
    if (appState === 'idle' || !riderPosition || routeWarning) return;
    const nearbyReport = reports.find((report) =>
      report.status === 'active' &&
      report.coordinates &&
      getPointToPolylineDistanceMeters(report.coordinates, [[riderPosition.lat, riderPosition.lng]]) <= 40
    );
    if (!nearbyReport) {
      lastTriggeredReportIdRef.current = null;
    } else if (nearbyReport.id !== lastTriggeredReportIdRef.current) {
      lastTriggeredReportIdRef.current = nearbyReport.id;
      setRouteWarning(nearbyReport);
    }
  }, [appState, riderPosition, reports, routeWarning]);

  const isGeocodedFacility = (facility: Facility) =>
    facility.category === 'parking' && (!facility.lat || !facility.lng);
  const [mappedFacilities, setMappedFacilities] = useState<Facility[]>(ANYANG_FACILITIES);

  // Resolve source addresses to real map coordinates once, then reuse them on later visits.
  useEffect(() => {
    let cancelled = false;
    const cacheKey = 'anyang-facility-coordinates-v13-exact-bike-racks';
    const targets = ANYANG_FACILITIES.filter(isGeocodedFacility);
    let cached: Record<string, Coordinates> = {};

    try {
      localStorage.removeItem('anyang-facility-coordinates-v12-kakao-geocoded-exact');
      cached = JSON.parse(localStorage.getItem(cacheKey) || '{}') as Record<string, Coordinates>;
    } catch {
      cached = {};
    }

    const applyCoordinates = (coordinates: Record<string, Coordinates>) => {
      if (cancelled) return;
      setMappedFacilities(ANYANG_FACILITIES.map((facility) => ({
        ...facility,
        ...(facility.facilityType === '공기주입기'
          ? (() => {
              const refined = refineFacilitySearchKeyword(facility.name);
              return {
                original: refined.original,
                searchKeyword: refined.searchKeyword,
                detail: refined.detail,
              };
            })()
          : {}),
        lat: facility.lat || (coordinates[facility.id]?.lat ?? facility.lat),
        lng: facility.lng || (coordinates[facility.id]?.lng ?? facility.lng),
      })));
    };

    applyCoordinates(cached);
    const pendingFacilities = targets.filter((facility) => !cached[facility.id]);
    if (pendingFacilities.length === 0) return () => { cancelled = true; };

    const resolved = { ...cached };
    let nextIndex = 0;
    const worker = async () => {
      while (nextIndex < pendingFacilities.length && !cancelled) {
        const facility = pendingFacilities[nextIndex++];
        const refined = facility.facilityType === '공기주입기'
          ? refineFacilitySearchKeyword(facility.name)
          : null;
        const address = facility.address || facility.roadAddress;
        const coordinate = await geocodeFacilityLocation(
          refined?.searchKeyword || facility.name,
          address,
          facility.category === 'parking' || facility.facilityType === '공기주입기',
        );
        if (coordinate) {
          resolved[facility.id] = coordinate;
          try {
            localStorage.setItem(cacheKey, JSON.stringify(resolved));
          } catch {
            // ignore
          }
          applyCoordinates(resolved);
        }
        await new Promise((resolve) => setTimeout(resolve, 150));
      }
    };

    void Promise.all(Array.from({ length: 4 }, () => worker()));
    return () => { cancelled = true; };
  }, []);

  // User preferences with localStorage persistence
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const saved = localStorage.getItem('anyang-user-preferences');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.fontSize) {
          document.documentElement.setAttribute('data-font-size', parsed.fontSize);
        }
        return parsed;
      }
    } catch {}
    document.documentElement.setAttribute('data-font-size', 'normal');
    return {
      avoidStairs: true,
      avoidSteepSlopes: true,
      voiceGuide: true,
      autoReroute: true,
      speedAlert: true,
      ttsVoice: 'female-clear',
      ttsSpeed: 1.0,
      ttsPitch: 1.0,
      themeColor: 'blue',
      fontSize: 'normal',
    };
  });

  // Keep data-font-size attribute in sync with font size preference
  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', preferences.fontSize);
    try {
      localStorage.setItem('anyang-user-preferences', JSON.stringify(preferences));
    } catch {}
  }, [preferences]);

  // GPS Auto-location on startup & Continuous Live Time Update (10초마다 현재 시각 및 도착 시각 실시간 동기화)
  useEffect(() => {
    const updateTimes = () => {
      const curTime = getCurrentTimeString();
      setDepartureTime(curTime);
      setSelectedCourse((prev) => ({
        ...prev,
        arrival: getCalculatedArrivalTime(prev.timeMinutes, curTime),
      }));
    };

    updateTimes();
    const timer = setInterval(updateTimes, 10000); // 10초마다 자동 갱신

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setRiderPosition({ lat, lng });
          setMapCenter({ lat, lng });

          try {
            const address = await coordToAddress(lat, lng);
            if (address && address !== '내 현재 위치') {
              setOrigin(address);
            } else {
              setOrigin('내 현재 위치');
            }
          } catch {
            setOrigin('내 현재 위치');
          }
        },
        async () => {
          setRiderPosition({
            lat: ANYANG_CENTER.lat,
            lng: ANYANG_CENTER.lng,
          });
          setMapCenter(ANYANG_CENTER);
          setOrigin('내 현재 위치');
        },
        { enableHighAccuracy: true, timeout: 7000 }
      );
    }

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!riderPosition) return;

    let isMounted = true;
    const loadWeather = async () => {
      try {
        const nextWeather = await fetchKmaWeather(riderPosition.lat, riderPosition.lng);
        if (isMounted) setWeather(nextWeather);
      } catch {
        if (isMounted) setWeather(null);
      }
    };

    void loadWeather();
    return () => {
      isMounted = false;
    };
  }, [riderPosition]);

  /* Filter Tag Click */
  const handleFilterSelect = (tag: FilterCategory) => {
    setActiveFilter(tag);
    const course = COURSE_DATA[tag];
    if (course) {
      const curTime = getCurrentTimeString();
      const updatedCourse = {
        ...course,
        arrival: getCalculatedArrivalTime(course.timeMinutes, curTime),
      };
      setSelectedCourse(updatedCourse);
      setAppState('courseSelected');
      setIsBottomSheetOpen(true);
    }
  };

  /* POI Category Toggle */
  const handleTogglePoiFilter = (category: POICategory) => {
    setActivePoiFilters((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  /* Find My Location (GPS & Troubleshoot) */
  const handleFindMyLocation = () => {
    // 1. 이미 내 위치를 알고 있다면 지도를 즉시 그 위치로 이동
    if (riderPosition) {
      setMapCenter({ lat: riderPosition.lat, lng: riderPosition.lng });
      setPanToTrigger((prev) => prev + 1);
    }

    if (!navigator.geolocation) {
      setGpsStatus('unavailable');
      setGpsMessage('이 브라우저는 위치 서비스를 지원하지 않습니다.');
      setIsGpsTroubleshootOpen(true);
      return;
    }
    setIsLocating(true);
    setGpsStatus('searching');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setIsLocating(false);
        setGpsStatus('active');
        setGpsAccuracy(pos.coords.accuracy);
        setIsGpsActive(true);
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setRiderPosition(coords);
        setMapCenter(coords);
        setPanToTrigger((prev) => prev + 1);
        try {
          const addr = await coordToAddress(coords.lat, coords.lng);
          if (addr) setOrigin(addr);
        } catch {
          // ignore
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsStatus('denied');
          setGpsMessage('브라우저 위치 권한이 차단되어 있습니다.');
        } else if (err.code === err.TIMEOUT) {
          setGpsStatus('timeout');
          setGpsMessage('위치 수신 시간이 초과되었습니다.');
        } else {
          setGpsStatus('error');
          setGpsMessage('위치 정보를 가져올 수 없습니다. 음영 지역이거나 신호가 약합니다.');
        }
        setIsGpsTroubleshootOpen(true);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSelectGpsPreset = (preset: GpsHubPreset) => {
    const coords = { lat: preset.lat, lng: preset.lng };
    setRiderPosition(coords);
    setMapCenter(coords);
    setPanToTrigger((prev) => prev + 1);
    setOrigin(preset.address || preset.name);
    setGpsStatus('active');
    setIsGpsActive(true);
    setGpsAccuracy(15);
  };

  /* Close / Reset Route Search completely */
  const handleCloseRouteSearch = () => {
    setDestination('');
    setOrigin('현재 위치 (안양천 중앙광장)');
    setSelectedCourse(COURSE_DATA['추천 코스']);
    setActiveFilter('추천 코스');
    setAppState('idle');
    setIsBottomSheetOpen(false);
  };

  /* Find Optimal Route from Search Modal */
  const handleFindOptimalRoute = async (params: RouteSearchParams) => {
    setOrigin(params.origin);
    setDestination(params.destination);
    setRouteType(params.routeType);

    const startCoords = params.originCoords || riderPosition || ANYANG_CENTER;
    const resolvedDestCoords = params.destinationCoords || await geocodeFacilityLocation('', params.destination);
    const destCoords = resolvedDestCoords || { lat: 37.3943, lng: 126.9568 };
    setActiveRouteEndpoints({ origin: startCoords, destination: destCoords });

    if (params.originCoords) {
      setRiderPosition(params.originCoords);
    }

    if (params.preferredFilter) {
      setActiveFilter(params.preferredFilter);
    }

    if (params.isDistanceLoop) {
      // 1. AI Distance Loop Route (No destination, round-trip back to origin based on selected distance)
      const loopCourse = createLoopRouteByDistance(
        params.origin,
        startCoords,
        params.targetDistanceKm || 10
      );
      setSelectedCourse(loopCourse);
    } else {
      // 2. Point-to-Point Optimal Route: show instant route, then fetch real OSRM road route
      const initialCourse = createCustomOptimalRoute(
        params.origin,
        startCoords,
        params.destination,
        destCoords,
        params.routeType,
        params.preferredFilter
      );
      setSelectedCourse(initialCourse);
      checkRouteReports(initialCourse.path, `${params.origin}|${params.destination}|${Date.now()}`);

      // Asynchronously fetch high-precision real road route & matching turn-by-turn steps
      fetchCustomOptimalRouteAsync(
        params.origin,
        startCoords,
        params.destination,
        destCoords,
        params.routeType,
        params.preferredFilter
      )
        .then((realCourse) => {
          setSelectedCourse(realCourse);
          checkRouteReports(realCourse.path, realCourse.id);
        })
        .catch((err) => {
          console.warn('Real route fetch fallback used:', err);
        });
    }

    setAppState('courseSelected');
    setCurrentTab('home');
    setIsBottomSheetOpen(true);
  };

  /* Select Stream Corridor from Official Guide */
  const handleSelectOfficialStream = (streamId: string) => {
    const stream = OFFICIAL_STREAM_LINES.find((s) => s.id === streamId);
    if (!stream) return;

    let targetCourse: Course;
    if (streamId === 'stream-hagui') {
      targetCourse = COURSE_DATA['평지 중심'];
    } else if (streamId === 'stream-samseong') {
      targetCourse = COURSE_DATA['경치 좋은'];
    } else if (streamId === 'stream-sammak') {
      targetCourse = COURSE_DATA['낮은 혼잡도'];
    } else if (streamId === 'urban-simin') {
      targetCourse = COURSE_DATA['단거리'];
    } else {
      targetCourse = COURSE_DATA['추천 코스'];
    }

    const curTime = getCurrentTimeString();
    const updated = {
      ...targetCourse,
      arrival: getCalculatedArrivalTime(targetCourse.timeMinutes, curTime),
    };

    setSelectedCourse(updated);
    setActiveFilter(targetCourse.tag);
    setAppState('courseSelected');
    setCurrentTab('home');
    setIsBottomSheetOpen(true);
  };

  /* Select Anyang Theme Course from AllCoursesModal */
  const handleSelectThemeCourse = (course: Course) => {
    const curTime = getCurrentTimeString();
    const updated: Course = {
      ...course,
      arrival: getCalculatedArrivalTime(course.timeMinutes, curTime),
    };

    setOrigin(course.startPoint || '출발지');
    setDestination(course.endPoint || course.name);
    setSelectedCourse(updated);
    setActiveFilter(course.tag || '추천 코스');
    setAppState('courseSelected');
    setCurrentTab('home');
    setIsBottomSheetOpen(true);
  };

  /* Select Ramp Access Point */
  const handleSelectRampPoint = (ramp: RampAccessPoint) => {
    setDestination(ramp.name);
    setSelectedCourse(COURSE_DATA['계단 없음']);
    setAppState('courseSelected');
    setCurrentTab('home');
    setIsBottomSheetOpen(true);
  };

  /* Select Facility on Map */
  const handleNavigateToFacility = (fac: Facility) => {
    setRiderPosition({ lat: fac.lat, lng: fac.lng });
    setMapCenter({ lat: fac.lat, lng: fac.lng });
    setPanToTrigger((prev) => prev + 1);
    setCurrentTab('home');
    setSelectedFacilityDetail(fac);
  };

  return (
    <div
      data-font-size={preferences.fontSize}
      className="relative h-[100dvh] w-full overflow-hidden bg-slate-100 select-none"
    >
      {/* Background Radial Dots */}
      <div className="absolute inset-0 bg-grid-dots opacity-30 pointer-events-none" />

      {/* ── Main View Container ── */}
      <div className="relative h-full w-full max-w-md mx-auto bg-slate-50 overflow-hidden flex flex-col shadow-2xl border-x border-slate-200">
        
        {/* ── Map Canvas (Always mounted in Home view) ── */}
        <div className={`relative flex-1 w-full ${currentTab === 'home' ? 'block' : 'hidden'}`}>
          <MapComponent
            center={mapCenter}
            panToTrigger={panToTrigger}
            routePath={undefined}
            passedPath={undefined}
            remainingPath={undefined}
            riderPosition={riderPosition}
            activePoiFilters={activePoiFilters}
            alwaysVisibleCategories={[]}
            facilities={mappedFacilities}
            onSelectFacility={(fac) => setSelectedFacilityDetail(fac)}
            reports={reports}
            onSelectReport={handleSelectReport}
            onMapClick={(lat, lng) => {
              if (isMapPickMode) {
                setRiderPosition({ lat, lng });
                setMapCenter({ lat, lng });
                coordToAddress(lat, lng).then((addr) => {
                  if (addr) setOrigin(addr);
                });
                setIsMapPickMode(false);
                setGpsStatus('active');
                return;
              }
              setSelectedFacilityDetail(null);
            }}
            onSelectRampPoint={handleSelectRampPoint}
            onOpenOfficialGuide={() => setIsOfficialGuideOpen(true)}
            onFindMyLocation={handleFindMyLocation}
          />

          {/* Map Pick Mode Notification Banner */}
          {isMapPickMode && (
            <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between rounded-2xl bg-amber-500 text-white p-3 shadow-xl animate-in slide-in-from-top duration-300">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-white animate-bounce" />
                <span className="text-xs font-black">지도에서 내 현재 위치를 직접 터치해 주세요</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMapPickMode(false)}
                className="rounded-lg bg-black/20 px-2 py-1 text-[11px] font-bold text-white hover:bg-black/30"
              >
                취소
              </button>
            </div>
          )}

          {/* ── Top Utility Bar (Current location and quick access) ── */}
          <div className="absolute left-0 right-0 top-0 z-30 px-3 pt-3 pointer-events-none">
            <div className="pointer-events-auto flex items-center justify-between gap-2 rounded-2xl bg-white/95 p-2.5 shadow-xl backdrop-blur-xl border border-slate-200">
              <div
                onClick={handleFindMyLocation}
                className="flex min-w-0 items-center gap-2.5 cursor-pointer group select-none hover:opacity-85 transition-opacity"
                title="클릭 시 내 현재 위치로 지도 이동"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0055FF] text-white shadow-xs group-hover:scale-105 transition-transform">
                  <MapPin size={16} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-800">내 현재 위치</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 text-[9px] font-bold text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      실시간 GPS
                    </span>
                  </div>
                  <div className="truncate text-sm font-black text-slate-900 mt-0.5 group-hover:text-[#0055FF] transition-colors">
                    {origin || '경기도 안양시 안양천'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleFindMyLocation}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50/80 border border-blue-200 text-[#0055FF] hover:bg-blue-100 active:scale-95 transition-all"
                  title="내 위치로 지도 이동 (GPS)"
                  aria-label="내 위치로 지도 이동"
                >
                  <Crosshair size={17} />
                </button>

                <button
                  type="button"
                  onClick={() => setIsGpsTroubleshootOpen(true)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 active:scale-95 transition-all"
                  title="실시간 GPS 거점 보정"
                  aria-label="실시간 GPS 거점 보정"
                >
                  <Radio size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => setIsQuickReportOpen(true)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 active:scale-95 transition-all"
                  title="장애물/위험 제보"
                  aria-label="장애물/위험 제보"
                >
                  <ShieldAlert size={16} />
                </button>
              </div>
            </div>

            {/* Quick Map POI Filters Row */}
            <div className="pointer-events-auto mt-2 flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
              {[
                { id: 'toilet' as POICategory, label: '화장실 243', icon: '🚻' },
                { id: 'repair' as POICategory, label: '공기주입기', icon: '🔧' },
                { id: 'parking' as POICategory, label: '거치대', icon: '🚲' },
                { id: 'water' as POICategory, label: '음수대', icon: '💧' },
              ].map((poi) => {
                const isActive = activePoiFilters.includes(poi.id);
                return (
                  <button
                    key={poi.id}
                    type="button"
                    onClick={() => handleTogglePoiFilter(poi.id)}
                    className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-md transition-all active:scale-95 border ${
                      isActive
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white/95 text-slate-700 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <span>{poi.icon}</span>
                    <span>{poi.label}</span>
                    {isActive && <span className="ml-0.5 text-[9px] text-emerald-400 font-black">ON</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── AI Chatbot FAB Button (유저 맞춤 명소 추천) ── */}
          <button
            type="button"
            onClick={() => setIsChatbotOpen(true)}
            className={`absolute right-3.5 z-30 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#0055FF] via-indigo-600 to-blue-700 px-3.5 py-2.5 text-white shadow-xl hover:shadow-2xl border border-white/40 active:scale-95 transition-all duration-300 group ${
              isBottomSheetOpen ? 'bottom-[340px]' : 'bottom-[75px]'
            }`}
            aria-label="AI 명소 추천 챗봇 열기"
            title="AI 자전거 명소 맞춤 추천 챗봇"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/20 text-amber-300 backdrop-blur-xs group-hover:rotate-12 transition-transform">
              <Sparkles size={14} className="animate-pulse" />
            </div>
            <span className="text-xs font-black tracking-tight whitespace-nowrap">AI 챗봇</span>
          </button>

          {/* ── Bottom Sheet (안양시 명소 & 실시간 날씨 패널) ── */}
          <div className="absolute bottom-0 left-0 right-0 z-30 flex flex-col pointer-events-none">
            <div className="pointer-events-auto">
              <div className="rounded-t-[28px] bg-white/95 shadow-2xl border-t border-slate-200 backdrop-blur-2xl transition-all duration-300">
                  {isBottomSheetOpen ? (
                    /* Expanded Sheet: 안양시 명소 & 실시간 날씨 패널 */
                    <>
                      <div
                        onClick={() => setIsBottomSheetOpen(false)}
                        className="flex cursor-pointer flex-col items-center justify-center pt-2.5 pb-1 group min-h-[32px] select-none"
                        title="패널 접기"
                      >
                        <div className="h-1.5 w-12 rounded-full bg-slate-300 group-hover:bg-slate-400 transition-colors" />
                        <div className="w-full flex items-center justify-between px-4 pt-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-slate-900">안양시 명소 & 실시간 날씨</span>
                            <span className="text-[10px] bg-blue-50 text-[#0055FF] border border-blue-200 px-1.5 py-0.2 rounded-md font-bold">
                              안양 9경 · 25개 명소
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-600 flex items-center gap-0.5 transition-colors">
                            <ChevronDown size={13} /> 패널 접기
                          </span>
                        </div>
                      </div>
                      <HomeSummarySheet
                        origin={origin}
                        weather={weather}
                        riderPosition={riderPosition}
                        onOpenAttractionModal={() => setIsAttractionModalOpen(true)}
                        onOpenGpsModal={() => setIsGpsTroubleshootOpen(true)}
                        onSelectAttraction={(spot) => {
                          setSelectedAttraction(spot);
                          setIsAttractionModalOpen(true);
                        }}
                        onOpenAiChatbot={() => setIsChatbotOpen(true)}
                        onNavigateToFacilitiesTab={() => setCurrentTab('facilities')}
                      />
                    </>
                  ) : (
                    /* Collapsed Peek Bar: 안양시 명소 & 실시간 날씨 패널 */
                    <div
                      onClick={() => setIsBottomSheetOpen(true)}
                      className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors min-h-[58px]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100/80 text-[#0055FF] shadow-xs">
                          <Sparkles size={18} className="text-[#0055FF]" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-slate-900 truncate">
                              안양시 명소 & 실시간 날씨
                            </span>
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                              {weather ? `${weather.skyStatus} ${weather.temp}°C` : '실시간 예보'}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 truncate mt-0.5">
                            {weather?.cyclingStatus ? `라이딩 ${weather.cyclingStatus} · ` : ''}안양 9경 및 25곳 주요 명소 보기
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsBottomSheetOpen(true);
                          }}
                          className="flex items-center gap-1 rounded-xl bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-bold text-[#0055FF] hover:bg-blue-100 active:scale-95 transition-all"
                        >
                          <ChevronUp size={14} />
                          <span>패널 열기</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        {/* ── Other Navigation Tabs ── */}
        {currentTab === 'facilities' && (
          <FacilitiesTab
            facilities={mappedFacilities}
            riderPosition={riderPosition}
            onSelectFacilityOnMap={(fac) => {
              setSelectedFacilityDetail(fac);
            }}
            onNavigateToFacility={(fac) => {
              handleNavigateToFacility(fac);
            }}
          />
        )}

        {currentTab === 'record' && (
          <RecordTab
            records={records}
            onAddRecord={handleAddRecord}
            onSelectRecordRoute={handleSelectRecordRoute}
            onClearRecords={handleClearRecords}
            onDeleteRecord={handleDeleteRecord}
          />
        )}

        {currentTab === 'profile' && (
          <ProfileTab
            preferences={preferences}
            currentCoordinates={riderPosition || undefined}
            onUpdatePreferences={(p) => setPreferences(p)}
            reports={reports}
            onAddReport={handleAddReport}
            onToggleLikeReport={handleToggleLikeReport}
          />
        )}

        {/* ── Bottom Navigation Bar ── */}
        <BottomNav active={currentTab} onChangeTab={(t) => setCurrentTab(t)} />

        {/* ── Modals ── */}
        <QuickReportModal
          isOpen={isQuickReportOpen}
          onClose={() => setIsQuickReportOpen(false)}
          currentLocationName={origin && origin !== '내 현재 위치' ? origin : '안양시 자전거도로 (현재 위치)'}
          currentCoordinates={reportCoordinates || riderPosition || undefined}
          onSubmitReport={handleAddReport}
          onGoToReportPage={() => {
            setIsQuickReportOpen(false);
            setCurrentTab('profile');
          }}
        />

        {routeWarning && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 shrink-0 text-red-600" size={22} />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">경로 제보 알림</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {routeWarning.location} 구간에서 {routeWarning.categoryName} 제보가 있습니다. 그냥 가시겠습니까? 우회 경로를 재탐색할까요?
                  </p>
                </div>
              </div>
              <div className="mt-5 flex gap-2">
                <button type="button" onClick={() => setRouteWarning(null)} className="flex-1 rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-700">
                  기존 경로 유지
                </button>
                <button type="button" onClick={() => { rerouteAroundReport(routeWarning); setRouteWarning(null); }} className="flex-1 rounded-xl bg-red-600 py-3 text-xs font-bold text-white">
                  우회 재탐색
                </button>
              </div>
            </div>
          </div>
        )}

        <DepartureTimeModal
          isOpen={isDepartureModalOpen}
          onClose={() => setIsDepartureModalOpen(false)}
          currentTime={departureTime}
          durationMinutes={selectedCourse.timeMinutes}
          onApplyTime={(dep, arr) => {
            setDepartureTime(dep);
            setSelectedCourse((prev) => ({ ...prev, arrival: arr }));
          }}
        />

        <OfficialBicycleMapModal
          isOpen={isOfficialGuideOpen}
          onClose={() => setIsOfficialGuideOpen(false)}
          onSelectStreamCourse={handleSelectOfficialStream}
        />

        <AllCoursesModal
          isOpen={isAllCoursesOpen}
          onClose={() => setIsAllCoursesOpen(false)}
          onSelectCourse={handleSelectThemeCourse}
        />

        <FacilityDetailModal
          facility={selectedFacilityDetail}
          isOpen={!!selectedFacilityDetail}
          onClose={() => setSelectedFacilityDetail(null)}
          onNavigateTo={handleNavigateToFacility}
        />

        <AttractionDetailModal
          spot={selectedAttraction}
          isOpen={isAttractionModalOpen}
          onClose={() => setIsAttractionModalOpen(false)}
          onFocusOnMap={(spot) => {
            setRiderPosition({ lat: spot.lat, lng: spot.lng });
            setMapCenter({ lat: spot.lat, lng: spot.lng });
            setIsAttractionModalOpen(false);
          }}
          weather={weather}
          riderPosition={riderPosition}
        />

        <AiChatbotModal
          isOpen={isChatbotOpen}
          onClose={() => setIsChatbotOpen(false)}
          onSelectAttraction={(spot) => {
            setSelectedAttraction(spot);
            setIsAttractionModalOpen(true);
          }}
          onFocusOnMap={(spot) => {
            setRiderPosition({ lat: spot.lat, lng: spot.lng });
            setMapCenter({ lat: spot.lat, lng: spot.lng });
            setIsChatbotOpen(false);
          }}
          riderPosition={riderPosition}
        />

        <GpsTroubleshootModal
          isOpen={isGpsTroubleshootOpen}
          onClose={() => setIsGpsTroubleshootOpen(false)}
          gpsStatus={gpsStatus}
          gpsAccuracy={gpsAccuracy}
          gpsMessage={gpsMessage}
          currentCoords={riderPosition}
          currentAddress={origin}
          onRetryGps={handleFindMyLocation}
          onSelectPreset={handleSelectGpsPreset}
          onEnableMapPickMode={() => {
            setIsMapPickMode(true);
            setIsGpsTroubleshootOpen(false);
          }}
          isLocating={isLocating}
        />
      </div>
    </div>
  );
}
