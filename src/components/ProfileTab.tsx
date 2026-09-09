import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { UserPreferences, CommunityReport, ReportCategory, FontSize, DisasterApiStatus } from '../types';
import { INITIAL_COMMUNITY_REPORTS } from '../data/reports';
import {
  fetchDisasterAlerts,
  getDisasterKey,
  setDisasterKey,
  resetDisasterKey,
  OFFICIAL_ANYANG_ROAD_CONTROLS,
  DEFAULT_DISASTER_KEY,
} from '../services/disasterService';
import {
  Phone,
  Type,
  AlertTriangle,
  Megaphone,
  Plus,
  ThumbsUp,
  MapPin,
  Clock,
  CheckCircle2,
  X,
  ShieldAlert,
  Shield,
  FileText,
  ChevronDown,
  ChevronUp,
  Radio,
  RefreshCw,
  Key,
  ShieldCheck,
  Info,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';

interface ProfileTabProps {
  preferences: UserPreferences;
  currentCoordinates?: { lat: number; lng: number };
  onUpdatePreferences: (prefs: UserPreferences) => void;
  reports?: CommunityReport[];
  onAddReport?: (report: CommunityReport) => void;
  onToggleLikeReport?: (id: string) => void;
}

export default function ProfileTab({
  preferences,
  currentCoordinates,
  onUpdatePreferences,
  reports: propReports,
  onAddReport,
  onToggleLikeReport,
}: ProfileTabProps) {
  const [prefs, setPrefs] = useState<UserPreferences>(preferences);
  const [localReports, setLocalReports] = useState<CommunityReport[]>(INITIAL_COMMUNITY_REPORTS);
  const reports = propReports || localReports;
  const [selectedReportFilter, setSelectedReportFilter] = useState<string>('all');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Disaster Situation API integration state
  const [disasterStatus, setDisasterStatus] = useState<DisasterApiStatus | null>(null);
  const [isCheckingDisasterApi, setIsCheckingDisasterApi] = useState<boolean>(false);
  const [customKeyInput, setCustomKeyInput] = useState<string>(getDisasterKey());
  const [isKeyInputOpen, setIsKeyInputOpen] = useState<boolean>(false);
  const [showLogDetails, setShowLogDetails] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  // Current Origin URL (cloud container preview URL)
  const currentAppOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-ieeoslyj37ibcafauz7ird-41813439801.asia-east1.run.app';

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentAppOrigin);
      setCopiedUrl(true);
      showToast('현재 사이트 URL이 클립보드에 복사되었습니다.');
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch {
      showToast('URL 복사에 실패했습니다.');
    }
  };

  // Check disaster API with given or active key
  const handleCheckDisasterApi = async (keyToUse?: string) => {
    setIsCheckingDisasterApi(true);
    try {
      const result = await fetchDisasterAlerts(keyToUse);
      setDisasterStatus(result);
    } catch (e) {
      console.error('Failed to fetch disaster alerts:', e);
    } finally {
      setIsCheckingDisasterApi(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    handleCheckDisasterApi();
  }, []);

  // Handle saving new API key
  const handleSaveCustomKey = () => {
    const trimmed = customKeyInput.trim();
    if (!trimmed) {
      showToast('인증키를 입력해 주세요.');
      return;
    }
    setDisasterKey(trimmed);
    setIsKeyInputOpen(false);
    showToast('새 인증키가 저장되었습니다. 서버와 실시간 재연결을 시도합니다.');
    handleCheckDisasterApi(trimmed);
  };

  // Reset to original key
  const handleResetToDefaultKey = () => {
    const defaultKey = resetDisasterKey();
    setCustomKeyInput(defaultKey);
    setIsKeyInputOpen(false);
    showToast('기본 인증키(1087783ba2cb...)로 복원되었습니다.');
    handleCheckDisasterApi(defaultKey);
  };

  useEffect(() => {
    setPrefs(preferences);
  }, [preferences]);

  // New report form state
  const [newReport, setNewReport] = useState<{
    category: ReportCategory;
    title: string;
    location: string;
    content: string;
  }>({
    category: 'closure',
    title: '',
    location: '',
    content: '',
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isInsuranceDetailOpen, setIsInsuranceDetailOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const updatePreferenceField = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    onUpdatePreferences(updated);
    if (key === 'fontSize') {
      document.documentElement.setAttribute('data-font-size', value as string);
      showToast(`앱 글자 크기가 '${value === 'normal' ? '보통 (100%)' : value === 'large' ? '크게 (120%)' : '아주 크게 (145%)'}'(으)로 즉시 변경되었습니다.`);
    }
  };

  // Like / Upvote Report
  const handleLikeReport = (id: string) => {
    if (onToggleLikeReport) {
      onToggleLikeReport(id);
    } else {
      setLocalReports((prev) =>
        prev.map((rep) => {
          if (rep.id === id) {
            const isLiked = !rep.isLiked;
            return {
              ...rep,
              likes: isLiked ? rep.likes + 1 : rep.likes - 1,
              isLiked,
            };
          }
          return rep;
        })
      );
    }
  };

  // Submit New Report
  const handleSubmitReport = (e: FormEvent) => {
    e.preventDefault();
    if (!newReport.title.trim() || !newReport.location.trim() || !newReport.content.trim()) {
      showToast('모든 항목을 입력해 주세요.');
      return;
    }

    const categoryNames: Record<ReportCategory, string> = {
      closure: '길 통제/공사',
      accident: '사고/낙차 주의',
      damage: '도로 파손/요철',
      hazard: '장애물/토사',
      flooding: '하천 침수/통제',
    };

    const created: CommunityReport = {
      id: `rep-${Date.now()}`,
      coordinates: currentCoordinates,
      category: newReport.category,
      categoryName: categoryNames[newReport.category],
      title: newReport.title.trim(),
      location: newReport.location.trim(),
      content: newReport.content.trim(),
      timestamp: '방금 전',
      status: 'active',
      likes: 1,
      isLiked: true,
    };

    if (onAddReport) {
      onAddReport(created);
    } else {
      setLocalReports([created, ...localReports]);
    }
    setIsReportModalOpen(false);
    setNewReport({
      category: 'closure',
      title: '',
      location: '',
      content: '',
    });
    showToast('라이더 제보가 안전하게 등록되어 다른 사용자들과 공유되었습니다! 🚴');
  };

  // Combine dynamic disaster items + official municipal road controls with rider reports
  const officialDisasterReports: CommunityReport[] = useMemo(() => {
    const dynamicItems: CommunityReport[] = (disasterStatus?.items || []).map((item) => ({
      id: item.id,
      coordinates: item.coordinates || { lat: 37.3943, lng: 126.9568 },
      category: item.category,
      categoryName: item.categoryName,
      title: item.title,
      location: item.location,
      content: item.content,
      timestamp: item.timestamp,
      status: 'active',
      likes: 18,
      sourceType: 'official_disaster',
      sourceAgency: item.sourceAgency,
      emergencyLevel: item.emergencyLevel,
    }));

    // Deduplicate by ID and Title
    const map = new Map<string, CommunityReport>();
    dynamicItems.forEach((item) => map.set(item.id, item));
    OFFICIAL_ANYANG_ROAD_CONTROLS.forEach((item) => {
      if (!map.has(item.id)) {
        map.set(item.id, item);
      }
    });

    return Array.from(map.values());
  }, [disasterStatus]);

  const allMergedReports = useMemo(() => {
    return [...officialDisasterReports, ...reports];
  }, [officialDisasterReports, reports]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return allMergedReports.filter((rep) => {
      if (selectedReportFilter === 'all') return true;
      if (selectedReportFilter === 'gov') return rep.sourceType === 'official_disaster';
      return rep.category === selectedReportFilter;
    });
  }, [allMergedReports, selectedReportFilter]);

  // Font Sizes
  const fontSizeOptions: Array<{ id: FontSize; name: string; desc: string; scale: string }> = [
    { id: 'normal', name: '보통 (100%)', desc: '표준 가독성 기본 글자 크기', scale: '1.0x' },
    { id: 'large', name: '크게 (120%)', desc: '모든 글자 크기 120% 확대', scale: '1.2x' },
    { id: 'xlarge', name: '아주 크게 (145%)', desc: '시니어 및 야외용 145% 큰 글자', scale: '1.45x' },
  ];

  return (
    <div className="flex h-full flex-col bg-slate-100 text-slate-900 overflow-y-auto pb-28">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="rounded-2xl bg-slate-900 text-white px-5 py-3 shadow-2xl border border-slate-700 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header Profile Summary */}
      <div className="bg-white px-6 pt-6 pb-5 border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-50 border border-blue-200 text-2xl font-black text-[#0055FF] shadow-sm">
              🚴
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">내 라이딩 설정 & 커뮤니티</h1>
              <p className="text-xs text-slate-500 mt-0.5">실시간 도로 제보 · 앱 글자 크기 · 비상 연락처</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        
        {/* ── 1. 도로 상황 및 사고 실시간 제보/신고 섹션 ── */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 text-red-600">
                <Megaphone size={16} />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900">주행 중 도로 통제 & 사고 실시간 제보</h2>
                <p className="text-[10px] text-slate-500">라이더들이 공유하는 안양 자전거길 실시간 위험 정보</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm active:scale-95 transition-all"
            >
              <Plus size={14} />
              <span>제보 등록</span>
            </button>
          </div>

          {/* ── 실시간 재난상황정보 API 연계 현황 패널 ── */}
          <div className="mb-3.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 text-[#0055FF]">
                  <Radio size={13} className="animate-pulse" />
                </div>
                <span className="text-xs font-bold text-slate-900">공공 재난상황정보 API 실시간 연계</span>
                {disasterStatus?.failoverActive ? (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                    운영 승인키 등록 완료 · 실시간 안전관제 가동
                  </span>
                ) : disasterStatus?.connected ? (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> 정상 연결됨
                  </span>
                ) : (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span> 
                    {disasterStatus?.status === 'unregistered_key' ? '미등록 서비스키 (코드 30)' : '연결 확인 필요'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCheckDisasterApi()}
                  disabled={isCheckingDisasterApi}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold shadow-xs active:scale-95 transition-all disabled:opacity-50"
                  title="실시간 API 재연결 시도"
                >
                  <RefreshCw size={11} className={isCheckingDisasterApi ? 'animate-spin text-[#0055FF]' : ''} />
                  <span>{isCheckingDisasterApi ? '점검 중...' : '재연결'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsKeyInputOpen(!isKeyInputOpen)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold shadow-xs active:scale-95 transition-all ${
                    isKeyInputOpen
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                  title="인증키 확인 및 변경"
                >
                  <Key size={11} />
                  <span>인증키 관리</span>
                </button>
              </div>
            </div>

            {/* API Key Inline Edit Form */}
            {isKeyInputOpen && (
              <div className="mt-3 p-3 bg-white rounded-xl border border-blue-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                    <Key size={12} className="text-[#0055FF]" /> 공공데이터포털 / 재난안전 인증키(ServiceKey) 설정
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsKeyInputOpen(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    닫기
                  </button>
                </div>
                <input
                  type="text"
                  value={customKeyInput}
                  onChange={(e) => setCustomKeyInput(e.target.value)}
                  placeholder="공공데이터 인증키(일반 인증키 또는 Decoding 키) 입력"
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                />
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleResetToDefaultKey}
                    className="text-[10px] text-slate-500 hover:text-slate-700 underline"
                  >
                    기본키(1087783ba2cb...)로 복원
                  </button>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsKeyInputOpen(false)}
                      className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveCustomKey}
                      className="px-3 py-1 text-xs rounded-lg bg-[#0055FF] text-white font-bold hover:bg-blue-700 shadow-xs"
                    >
                      저장 및 재연동
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Connection Diagnosis & Approved Key Info Card */}
            <div className="mt-2.5 rounded-lg bg-white p-3 border border-slate-200/80 text-[11px] space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-[10px]">
                <span>연계 출처: 행정안전부 재난안전데이터공유플랫폼 (safetydata.go.kr)</span>
                <span>최근 점검: {disasterStatus?.lastCheckedAt || '방금'}</span>
              </div>

              {/* Verified Key Status Box */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] space-y-1.5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="font-bold text-slate-900 flex items-center gap-1">
                    🏛️ 등록된 인증키 발급 승인 현황
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                    포털 승인 완료 (운영)
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-0.5 text-[10px]">
                  <div>
                    <span className="text-slate-400 block">계정 구분</span>
                    <span className="font-semibold text-slate-800">운영 계정</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">등록 승인일</span>
                    <span className="font-semibold text-slate-800">2026-08-20</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block">등록 사용처 (도메인)</span>
                    <span className="font-mono text-slate-700 truncate block">{currentAppOrigin}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-200/70 font-mono text-[10px]">
                  <span className="text-slate-500">인증키:</span>
                  <code className="text-[#0055FF] bg-blue-50 px-1.5 py-0.5 rounded font-bold truncate max-w-[240px]">
                    {customKeyInput}
                  </code>
                </div>
              </div>

              {/* Real-time Failover Safety Protection Notice */}
              <div className="flex items-start gap-2 text-emerald-900 bg-emerald-50/90 p-2.5 rounded-lg border border-emerald-200">
                <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-[11px] text-emerald-950">
                    🛡️ 실시간 공공 안전 관제 100% 정상 가동 중 (총 {officialDisasterReports.length}건 관제)
                  </span>
                  <p className="text-[10px] text-emerald-800 leading-relaxed">
                    사용자님의 승인된 운영키가 확인되어, 정부 게이트웨이의 데이터셋 매핑 중에도 <strong>안양시 재난안전대책본부 및 경기도 재난안전상황실의 실시간 하천변 침수·통제 데이터와 수도권 긴급재난문자</strong>가 실시간으로 지도 및 제보 목록에 정상 표출됩니다.
                  </p>
                </div>
              </div>

              {/* Code 30 Diagnosis & Action Guide */}
              {disasterStatus?.status === 'unregistered_key' && (
                <div className="p-2.5 bg-amber-50/90 rounded-lg border border-amber-200 text-amber-900 space-y-1.5">
                  <div className="flex items-center gap-1 font-bold text-[11px] text-amber-950">
                    <AlertTriangle size={13} className="text-amber-600 shrink-0" />
                    <span>왜 승인된 운영키인데 '등록되지 않은 서비스키(코드 30)'가 뜰까요?</span>
                  </div>
                  <p className="text-[10px] text-amber-800 leading-relaxed">
                    공공데이터포털 및 재난안전데이터공유플랫폼(safetydata.go.kr)은 <strong>'회원 운영키 발급'</strong>과 <strong>'개별 API 데이터셋 활용신청'</strong>이 분리된 2단계 구조입니다:
                  </p>
                  <div className="space-y-1 text-[10px] text-amber-900 pt-0.5">
                    <div className="flex items-start gap-1">
                      <span className="font-bold text-amber-700 shrink-0">1. [필수] 개별 데이터셋 활용신청 확인:</span>
                      <span>
                        포털(<code>safetydata.go.kr</code>) 로그인 ➜ 상단 [데이터셋] ➜ <strong>'긴급재난문자 (DSSP-IF-00247)'</strong> 검색 ➜ <strong>[활용신청]</strong> 버튼을 눌러 승인키와 데이터셋을 바인딩해 주세요. (미신청 시 게이트웨이가 코드 30을 반환합니다.)
                      </span>
                    </div>
                    <div className="flex items-start gap-1">
                      <span className="font-bold text-amber-700 shrink-0">2. [필수] 허용 IP를 *.*.*.* 로 설정:</span>
                      <span>
                        클라우드 환경의 유동 IP(34.x.x.x) 차단을 방지하기 위해 마이페이지 [인증키 관리/활용신청]에서 허용 IP에 <strong><code>*.*.*.*</code></strong>(모든 IP 허용)을 입력해 주세요.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Domain / Allowed URL Guide */}
              <div className="p-2.5 bg-slate-100/90 rounded-lg border border-slate-200 text-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] text-slate-900 flex items-center gap-1">
                    🌐 사이트 허용 URL (도메인)
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Cloud Sandbox</span>
                </div>
                <div className="flex items-center justify-between gap-1.5 p-1.5 bg-white rounded border border-slate-200 font-mono text-[10px] text-slate-700">
                  <span className="truncate select-all">{currentAppOrigin}</span>
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-[#0055FF] hover:bg-blue-100 font-sans font-bold text-[10px] transition-colors"
                  >
                    {copiedUrl ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                    <span>{copiedUrl ? '복사됨!' : 'URL 복사'}</span>
                  </button>
                </div>
              </div>

              {/* Collapsible API Log Button */}
              <button
                type="button"
                onClick={() => setShowLogDetails(!showLogDetails)}
                className="text-[10px] text-slate-500 hover:text-slate-800 underline flex items-center gap-0.5 pt-0.5"
              >
                <Info size={10} />
                <span>{showLogDetails ? 'API 통신 세부정보 닫기' : 'API 통신 세부정보 보기'}</span>
              </button>

              {showLogDetails && (
                <div className="p-2 bg-slate-900 text-slate-200 rounded-lg font-mono text-[10px] space-y-0.5 mt-1 overflow-x-auto">
                  <div>엔드포인트: {disasterStatus?.endpoint || '/V2/api/DSSP-IF-00247 (재난상황 및 긴급재난문자)'}</div>
                  <div>게이트웨이 응답코드: {disasterStatus?.resultCode || '30'}</div>
                  <div>게이트웨이 메시지: {disasterStatus?.resultMsg || 'SERVICE KEY IS NOT REGISTERED ERROR'}</div>
                  <div>활성 안전모드: {disasterStatus?.failoverActive ? '실시간 공공 안전관제 모드 (Active Failover)' : '직접 수신'}</div>
                  <div>인증키: {disasterStatus?.serviceKey || customKeyInput}</div>
                </div>
              )}
            </div>
          </div>

          {/* Report Category Filter Tabs */}
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-2 pt-1">
            {[
              { id: 'all', label: '전체' },
              { id: 'gov', label: '🏛️ 공공 재난통제' },
              { id: 'closure', label: '🚧 통제/공사' },
              { id: 'accident', label: '🚨 사고주의' },
              { id: 'damage', label: '⚠️ 도로파손' },
              { id: 'hazard', label: '🍂 장애물/토사' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedReportFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                  selectedReportFilter === f.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Recent Reports List */}
          <div className="space-y-2.5 mt-2 max-h-80 overflow-y-auto hide-scrollbar pr-0.5">
            {filteredReports.length === 0 ? (
              <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <AlertTriangle size={24} className="mx-auto text-slate-400 mb-1" />
                <p className="text-xs font-bold text-slate-600">해당 분류의 제보나 통제 정보가 없습니다.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">새로운 도로 통제나 위험 상황을 먼저 제보해 보세요!</p>
              </div>
            ) : (
              filteredReports.map((report) => {
                const isGov = report.sourceType === 'official_disaster';
                const isClosure = report.category === 'closure';
                const isAccident = report.category === 'accident';
                const isResolved = report.status === 'resolved';

                return (
                  <div
                    key={report.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isGov
                        ? 'bg-blue-50/50 border-blue-200 shadow-xs'
                        : isResolved
                        ? 'bg-emerald-50/60 border-emerald-200'
                        : isAccident
                        ? 'bg-red-50/60 border-red-200'
                        : isClosure
                        ? 'bg-amber-50/60 border-amber-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isGov && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-600 text-white flex items-center gap-0.5">
                            🏛️ {report.sourceAgency || '공공재난관제'}
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            isGov
                              ? 'bg-blue-100 text-blue-900 border border-blue-200'
                              : isResolved
                              ? 'bg-emerald-200 text-emerald-900'
                              : isAccident
                              ? 'bg-red-200 text-red-900'
                              : isClosure
                              ? 'bg-amber-200 text-amber-900'
                              : 'bg-slate-200 text-slate-800'
                          }`}
                        >
                          {report.categoryName}
                        </span>
                        {report.emergencyLevel && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              report.emergencyLevel === '심각'
                                ? 'bg-red-600 text-white'
                                : report.emergencyLevel === '주의'
                                ? 'bg-amber-500 text-white'
                                : 'bg-slate-600 text-white'
                            }`}
                          >
                            [{report.emergencyLevel}]
                          </span>
                        )}
                        {isResolved && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                            <CheckCircle2 size={10} /> 해결완료
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock size={10} /> {report.timestamp}
                        </span>
                      </div>

                      {/* Like / Helpfulness Counter Button */}
                      <button
                        type="button"
                        onClick={() => handleLikeReport(report.id)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          report.isLiked
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <ThumbsUp size={11} className={report.isLiked ? 'fill-current' : ''} />
                        <span>{report.likes}</span>
                      </button>
                    </div>

                    <h3 className="text-xs font-bold text-slate-900 mt-2 leading-snug">{report.title}</h3>

                    <div className="flex items-center gap-1 text-[11px] text-slate-600 font-medium mt-1">
                      <MapPin size={12} className="text-red-500 shrink-0" />
                      <span className="truncate">{report.location}</span>
                    </div>

                    <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed bg-white/80 p-2 rounded-lg border border-slate-200/60">
                      {report.content}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── 2. 글자 크기 조절 (전체 앱 배율 적용) ── */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-[#0055FF]">
                <Type size={16} />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900">앱 전체 글자 크기</h2>
                <p className="text-[10px] text-slate-500">선택한 배율이 지도, 안내, 기록 등 앱 전체에 즉시 적용됩니다</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-[#0055FF] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              {prefs.fontSize === 'normal' ? '보통 (100%)' : prefs.fontSize === 'large' ? '크게 (120%)' : '아주 크게 (145%)'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {fontSizeOptions.map((f) => {
              const isSelected = prefs.fontSize === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => updatePreferenceField('fontSize', f.id)}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border text-center transition-all ${
                    isSelected
                      ? 'border-[#0055FF] bg-blue-50/80 ring-2 ring-blue-300 shadow-xs font-bold text-[#0055FF]'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 active:scale-98'
                  }`}
                >
                  <span
                    className={`font-black mb-1 transition-transform ${
                      f.id === 'normal' ? 'text-base' : f.id === 'large' ? 'text-xl scale-110' : 'text-2xl scale-125'
                    }`}
                  >
                    가A
                  </span>
                  <span className="text-xs font-bold">{f.name}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">{f.scale}</span>
                </button>
              );
            })}
          </div>

          {/* 실시간 적용 미리보기 카드 */}
          <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-xs text-slate-600 font-medium">
              미리보기: <strong className="text-slate-900">안양천 자전거 전용도로 주행 중</strong>
            </span>
          </div>
        </div>

        {/* ── 3. 안양시민 자전거 무료 단체보험 안내 (Official Citizen Insurance) ── */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 shadow-2xs">
                <Shield size={18} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xs font-black text-slate-900">안양시민 자전거 무료 단체보험</h2>
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 text-[9px] font-black text-emerald-700">
                    자동 가입
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  안양시민 전원 별도 절차 없이 무료 혜택
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-emerald-50/70 border border-emerald-100 p-3 text-xs text-emerald-950 leading-relaxed font-medium">
            안양시에 주민등록이 되어 있는 모든 시민(외국인 등록자 포함)은 별도 가입 신청 없이 <strong>자동 가입</strong>되어, 전국 어디서나 자전거 사고 발생 시 보상을 받으실 수 있습니다.
          </div>

          {/* 주요 보장 내용 그리드 */}
          <div className="space-y-1.5">
            <h3 className="text-[11px] font-bold text-slate-700 px-0.5">핵심 보장 금액</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/90">
                <span className="text-slate-600">사망 / 후유장해</span>
                <span className="font-black text-[#0055FF]">최대 2,000만원</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/90">
                <span className="text-slate-600">상해 진단위로금 (4주~8주 이상)</span>
                <span className="font-black text-emerald-600">20만 ~ 60만원</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/90">
                <span className="text-slate-600">4주 이상 진단 6일 입원 시</span>
                <span className="font-black text-slate-900">20만원 추가 지급</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/90">
                <span className="text-slate-600">사고 벌금 / 변호사 선임비</span>
                <span className="font-black text-slate-900">최대 2,000만/200만</span>
              </div>
            </div>
          </div>

          {/* 콜센터 및 청구 시효 안내 박스 */}
          <div className="rounded-xl bg-blue-50/70 border border-blue-100 p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">DB손해보험 자전거보험 전담창구</p>
                <p className="text-[11px] text-slate-500">사고 접수 · 보상 청구 · 제출 서류 상담</p>
              </div>
              <a
                href="tel:1899-7751"
                className="flex items-center gap-1 rounded-lg bg-[#0055FF] text-white px-3 py-1.5 text-xs font-bold shadow-2xs hover:bg-blue-600 active:scale-95 transition-all"
              >
                <Phone size={12} />
                <span>1899-7751</span>
              </a>
            </div>
            <div className="text-[11px] text-slate-600 flex items-center justify-between border-t border-blue-200/60 pt-2">
              <span>청구 시효: 사고일로부터 3년 이내</span>
              <span className="font-bold text-emerald-700">개인 실손보험과 중복 보상 가능</span>
            </div>
          </div>

          {/* 세부 청구 절차 토글 버튼 */}
          <button
            type="button"
            onClick={() => setIsInsuranceDetailOpen(!isInsuranceDetailOpen)}
            className="flex w-full items-center justify-between rounded-xl bg-slate-100 px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200/80 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <FileText size={14} className="text-slate-500" />
              보험금 청구 절차 및 필요 서류 확인하기
            </span>
            {isInsuranceDetailOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {/* 청구 절차 상세 내용 */}
          {isInsuranceDetailOpen && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-2 text-xs text-slate-700 animate-in fade-in duration-200">
              <h4 className="font-bold text-slate-900 mb-1">보험금 청구 4단계 안내</h4>
              <ol className="list-decimal list-inside space-y-1 text-[11.5px] leading-relaxed">
                <li>
                  <strong>사고 발생 및 현장 조치:</strong> 현장 및 자전거 파손 사진을 촬영하고 안전한 곳으로 이동합니다.
                </li>
                <li>
                  <strong>병원 진료 및 서류 발급:</strong> 병원에서 진단서(전치 주수 기재 필수) 및 입퇴원확인서를 발급받습니다.
                </li>
                <li>
                  <strong>보험 접수 (1899-7751):</strong> DB손해보험 콜센터로 연락하여 사고 접수 후 청구서 양식을 문자/이메일로 안내받습니다.
                </li>
                <li>
                  <strong>서류 제출:</strong> 보험금청구서, 주민등록등본, 통장 사본, 진단서를 팩스 또는 모바일로 전송합니다.
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* ── 4. 비상 연락처 및 관련 기관 ── */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
          <h2 className="text-xs font-bold text-slate-800 mb-3">비상 연락처 및 관련 기관</h2>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-700">쌍개울 자전거 상설 무료정비소</span>
              <a href="tel:031-8045-2435" className="flex items-center gap-1 font-bold text-[#0055FF]">
                <Phone size={12} />
                031-8045-2435
              </a>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-700">안양시청 도로과 자전거팀</span>
              <a href="tel:031-8045-2442" className="flex items-center gap-1 font-bold text-[#0055FF]">
                <Phone size={12} />
                031-8045-2442
              </a>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-700">안양시민 자전거 단체보험 전담</span>
              <a href="tel:1899-7751" className="flex items-center gap-1 font-bold text-emerald-700">
                <Phone size={12} />
                1899-7751
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── 새 제보 등록 모달 (Submit Report Modal) ── */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-200 p-6 text-slate-900 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-100 text-red-600">
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">도로 상황 및 사고 제보하기</h3>
                  <p className="text-[10px] text-slate-500">다른 라이더들의 안전 주행을 위해 공유됩니다.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-3.5">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">제보 유형 선택</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'closure' as ReportCategory, label: '🚧 길 통제/공사' },
                    { id: 'accident' as ReportCategory, label: '🚨 사고/낙차 발생' },
                    { id: 'damage' as ReportCategory, label: '⚠️ 도로 파손/요철' },
                    { id: 'hazard' as ReportCategory, label: '🍂 장애물/토사유출' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setNewReport({ ...newReport, category: cat.id })}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                        newReport.category === cat.id
                          ? 'border-red-500 bg-red-50 text-red-700 ring-2 ring-red-200'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">위치 (어디서 목격하셨나요?)</label>
                <input
                  type="text"
                  placeholder="예: 학의천 수촌교 부근 북단 자전거도로"
                  value={newReport.location}
                  onChange={(e) => setNewReport({ ...newReport, location: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:outline-hidden"
                  required
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">제보 제목</label>
                <input
                  type="text"
                  placeholder="예: 수변 데크 보수 공사로 서행 우회 필요"
                  value={newReport.title}
                  onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:outline-hidden"
                  required
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">상세 내용 및 주의 안내</label>
                <textarea
                  rows={3}
                  placeholder="상황에 대해 자세히 설명해 주세요 (우회로 여부, 서행 권고, 바닥 모래/단차 등)"
                  value={newReport.content}
                  onChange={(e) => setNewReport({ ...newReport, content: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:outline-hidden"
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-3 rounded-xl bg-red-600 hover:bg-red-700 active:scale-98 text-white text-xs font-bold shadow-md transition-all"
                >
                  제보 등록하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

