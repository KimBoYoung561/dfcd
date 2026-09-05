import { useState, useEffect, type FormEvent } from 'react';
import { UserPreferences, CommunityReport, ReportCategory, FontSize } from '../types';
import { INITIAL_COMMUNITY_REPORTS } from '../data/reports';
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

  // Filtered reports
  const filteredReports = reports.filter((rep) => {
    if (selectedReportFilter === 'all') return true;
    return rep.category === selectedReportFilter;
  });

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

          {/* Report Category Filter Tabs */}
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-2 pt-1">
            {[
              { id: 'all', label: '전체' },
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
                <p className="text-xs font-bold text-slate-600">등록된 제보가 없습니다.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">새로운 도로 통제나 위험 상황을 먼저 제보해 보세요!</p>
              </div>
            ) : (
              filteredReports.map((report) => {
                const isClosure = report.category === 'closure';
                const isAccident = report.category === 'accident';
                const isResolved = report.status === 'resolved';

                return (
                  <div
                    key={report.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isResolved
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
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            isResolved
                              ? 'bg-emerald-200 text-emerald-900'
                              : isAccident
                              ? 'bg-red-200 text-red-900'
                              : isClosure
                              ? 'bg-amber-200 text-amber-900'
                              : 'bg-blue-200 text-blue-900'
                          }`}
                        >
                          {report.categoryName}
                        </span>
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

                    <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed bg-white/70 p-2 rounded-lg border border-slate-200/50">
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

        {/* ── 3. 비상 연락처 및 관련 기관 ── */}
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

