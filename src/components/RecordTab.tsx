import React, { useState, useMemo } from 'react';
import { RidingRecord } from '../types';
import { COURSE_DATA } from '../data/courses';
import HandSignalsGuide from './HandSignalsGuide';
import EmergencyContacts from './EmergencyContacts';
import AccidentGuide from './AccidentGuide';
import {
  Trophy,
  Navigation,
  Trash2,
  ShieldCheck,
  BellRing,
  Phone,
  AlertTriangle,
  CheckCircle2,
  Check,
  Bike,
  Plus,
  Calendar,
  Clock,
  Flame,
  Gauge,
  X,
  RotateCcw,
  CheckSquare,
  Square,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Info,
  Shield,
  FileCheck,
  Maximize2,
  FileText,
  Sparkles,
} from 'lucide-react';

interface RecordTabProps {
  records: RidingRecord[];
  onAddRecord: (record: RidingRecord) => void;
  onSelectRecordRoute: (record: RidingRecord) => void;
  onClearRecords: () => void;
  onDeleteRecord?: (id: string) => void;
}

type SubTab = 'all' | 'record' | 'checklist' | 'signals' | 'accident' | 'emergency';
type DetailModalType = 'signals' | 'accident' | 'contacts' | null;

interface PreRideCheckItem {
  id: string;
  code: string;
  title: string;
  desc: string;
  detail: string;
  icon: string;
}

const PRE_RIDE_CHECKS: PreRideCheckItem[] = [
  {
    id: 'air',
    code: 'A (Air)',
    title: '타이어 공기압 및 표면 점검',
    desc: '엄지손가락으로 눌렀을 때 단단하게 받쳐주는지 확인합니다.',
    detail: '적정 공기압(로드 80~100psi, MTB/하이브리드 50~65psi)을 유지하고 마모선, 유리조각 등 이물질 끼임을 확인하세요.',
    icon: '💨',
  },
  {
    id: 'brake',
    code: 'B (Brake)',
    title: '앞·뒤 브레이크 제동력 점검',
    desc: '브레이크 레버를 잡고 차체를 앞뒤로 밀어 제동력을 확인합니다.',
    detail: '레버를 끝까지 당기기 전 1/3~1/2 지점에서 제동이 걸려야 하며, 패드가 림 또는 디스크 로터에 닿는지 점검하세요.',
    icon: '🛑',
  },
  {
    id: 'chain',
    code: 'C (Chain & Crank)',
    title: '체인 오일 및 구동계 유격 점검',
    desc: '체인에 녹이나 소음이 없는지, 페달이 부드럽게 도는지 확인합니다.',
    detail: '체인이 건조하면 체인 전용 오일을 도포하고, 크랭크 암과 페달이 덜렁거리지 않는지 손으로 흔들어 확인하세요.',
    icon: '⛓️',
  },
  {
    id: 'helmet',
    code: 'H (Helmet & Gear)',
    title: '안전모(헬멧) 및 보호장구 착용',
    desc: 'KC 인증 헬멧을 눈썹 위 1~2cm 위치에 수평으로 착용합니다.',
    detail: '턱끈은 손가락 1개 들어갈 정도로 밀착하고, 장갑 및 고글을 착용하여 낙차 시 부상과 날벌레/자외선을 차단하세요.',
    icon: '⛑️',
  },
  {
    id: 'light',
    code: 'L (Light & Bell)',
    title: '전조등·후미등 배터리 및 벨 점검',
    desc: '야간 및 어두운 교량 하부 주행을 위한 라이트를 켭니다.',
    detail: '전조등(화이트)은 각도를 15도 하향 조준하여 맞은편 눈부심을 방지하고, 후미등(레드 점멸) 및 경음기(벨)를 확인하세요.',
    icon: '🔦',
  },
  {
    id: 'quick',
    code: 'Q (Quick & Saddle)',
    title: '바퀴 QR레버 체결 및 안장 높이',
    desc: '앞/뒤 바퀴 고정 레버가 단단히 잠겨 있는지 확인합니다.',
    detail: 'QR/스루액슬 레버가 풀려 있으면 주행 중 바퀴가 이탈할 수 있습니다. 안장은 앉았을 때 발뒤꿈치가 페달에 닿는 높이로 고정하세요.',
    icon: '🚲',
  },
];

export default function RecordTab({
  records,
  onAddRecord,
  onSelectRecordRoute,
  onClearRecords,
  onDeleteRecord,
}: RecordTabProps) {
  const [subTab, setSubTab] = useState<SubTab>('all');
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [activeDetailModal, setActiveDetailModal] = useState<DetailModalType>(null);
  const [expandedCard, setExpandedCard] = useState<DetailModalType>(null);

  const toggleExpandCard = (card: 'signals' | 'accident' | 'contacts') => {
    setExpandedCard((prev) => (prev === card ? null : card));
  };

  // Pre-ride checklist state
  const [checkedList, setCheckedList] = useState<{ [key: string]: boolean }>(() => {
    try {
      const saved = localStorage.getItem('anyang_pre_ride_checklist');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleCheckItem = (id: string) => {
    setCheckedList((prev) => {
      const updated = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem('anyang_pre_ride_checklist', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const handleCheckAll = () => {
    const allChecked: { [key: string]: boolean } = {};
    PRE_RIDE_CHECKS.forEach((c) => {
      allChecked[c.id] = true;
    });
    setCheckedList(allChecked);
    try {
      localStorage.setItem('anyang_pre_ride_checklist', JSON.stringify(allChecked));
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetChecklist = () => {
    setCheckedList({});
    try {
      localStorage.removeItem('anyang_pre_ride_checklist');
    } catch (e) {
      console.error(e);
    }
  };

  const completedCheckCount = PRE_RIDE_CHECKS.filter((c) => checkedList[c.id]).length;
  const isAllChecksDone = completedCheckCount === PRE_RIDE_CHECKS.length;

  // New Record Form State
  const [newCourseName, setNewCourseName] = useState<string>('안양천-학의천 쌍개울 힐링 순환 코스');
  const [isCustomCourse, setIsCustomCourse] = useState(false);
  const [customCourseInput, setCustomCourseInput] = useState('');
  const [recordDate, setRecordDate] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const h = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d} ${h}:${min}`;
  });
  const [distanceKm, setDistanceKm] = useState<number>(5.8);
  const [durationMinutes, setDurationMinutes] = useState<number>(25);
  const [memo, setMemo] = useState<string>('');

  // Auto calculated fields
  const calculatedAvgSpeed = useMemo(() => {
    if (durationMinutes <= 0) return 0;
    const hours = durationMinutes / 60;
    return Math.round((distanceKm / hours) * 10) / 10;
  }, [distanceKm, durationMinutes]);

  const calculatedCalories = useMemo(() => {
    return Math.round(distanceKm * 38);
  }, [distanceKm]);

  // Handle saving new record
  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedCourseName = isCustomCourse ? customCourseInput.trim() || '사용자 지정 코스' : newCourseName;

    // Find path from matched course or default
    const matched = Object.values(COURSE_DATA).find((c) => c.name === resolvedCourseName);
    const path = matched ? matched.path : COURSE_DATA['추천 코스'].path;

    const newRec: RidingRecord = {
      id: `rec-${Date.now()}`,
      date: recordDate,
      courseName: resolvedCourseName,
      distanceKm: Math.round(distanceKm * 10) / 10,
      durationMinutes: Math.round(durationMinutes),
      avgSpeedKmh: calculatedAvgSpeed,
      maxSpeedKmh: Math.round((calculatedAvgSpeed * 1.35) * 10) / 10,
      calories: calculatedCalories,
      elevationM: 20,
      path: path,
    };

    onAddRecord(newRec);
    setIsInputModalOpen(false);
    setMemo('');
  };

  // Overall Statistics
  const totalKm = Math.round(records.reduce((acc, r) => acc + r.distanceKm, 0) * 10) / 10;
  const totalMinutes = records.reduce((acc, r) => acc + r.durationMinutes, 0);
  const totalCalories = records.reduce((acc, r) => acc + r.calories, 0);

  // Weekly Activity Data: 7 days of current week with distance (km)
  const weeklyData = useMemo(() => {
    const now = new Date();
    // Monday of current week
    const currentDay = now.getDay(); // 0 is Sun, 1 is Mon...
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday);

    const dayLabels = ['월', '화', '수', '목', '금', '토', '일'];
    const sampleKms = [4.2, 2.9, 6.5, 1.0, 5.1, 9.8, 3.5];

    const result = dayLabels.map((dayName, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dayNum}`;
      const shortDate = `${d.getMonth() + 1}.${d.getDate()}`;
      const isToday = d.toDateString() === now.toDateString();

      // Find user records on this date
      const dayRecords = records.filter((r) => r.date && r.date.startsWith(dateStr));
      let totalDayKm = 0;

      if (dayRecords.length > 0) {
        totalDayKm = Math.round(dayRecords.reduce((sum, r) => sum + r.distanceKm, 0) * 10) / 10;
      } else {
        totalDayKm = sampleKms[idx];
      }

      return {
        day: dayName,
        date: shortDate,
        fullDate: dateStr,
        km: totalDayKm,
        isToday,
        hasUserRecord: dayRecords.length > 0,
      };
    });

    const maxKm = Math.max(...result.map((r) => r.km), 10);
    const totalWeeklyKm = Math.round(result.reduce((sum, r) => sum + r.km, 0) * 10) / 10;

    return {
      days: result.map((r) => ({
        ...r,
        heightPct: Math.max(14, Math.round((r.km / maxKm) * 100)),
      })),
      totalWeeklyKm,
    };
  }, [records]);

  return (
    <div className="flex h-full flex-col bg-slate-100 text-slate-900 overflow-y-auto pb-28">
      {/* ── Tab Header & Sub-Navigation ── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-5 pt-5 pb-3 border-b border-slate-200 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0055FF] text-white shadow-md shadow-blue-500/20">
              <Bike size={20} />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900">라이딩 기록 & 안전 가이드</h1>
              <p className="text-[11px] text-slate-500">기록 관리 · 타기전 점검 · 필수 수신호 · 긴급 연락망</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsInputModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0055FF] hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all"
          >
            <Plus size={14} />
            <span>기록 입력</span>
          </button>
        </div>

        {/* Sub-Tabs Selector */}
        <div className="mt-3 flex gap-1.5 overflow-x-auto hide-scrollbar pb-1">
          {[
            { id: 'all' as SubTab, label: '전체 보기', icon: '📋' },
            { id: 'record' as SubTab, label: '주행 기록', icon: '📊' },
            { id: 'checklist' as SubTab, label: '타기전 점검', icon: '✅' },
            { id: 'signals' as SubTab, label: '수신호 요령', icon: '✋' },
            { id: 'accident' as SubTab, label: '사고 대처', icon: '🚨' },
            { id: 'emergency' as SubTab, label: '비상 연락망', icon: '📞' },
          ].map((tab) => {
            const isActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id)}
                className={`flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.id === 'checklist' && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isAllChecksDone ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-700'
                  }`}>
                    {completedCheckCount}/{PRE_RIDE_CHECKS.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-4xl mx-auto w-full">

        {/* ════════════════════════════════════════════════════════════════════════════
            SECTION 1: 주행 기록 통계 및 기록 목록 (Record Tab)
        ════════════════════════════════════════════════════════════════════════════ */}
        {(subTab === 'all' || subTab === 'record') && (
          <div className="space-y-3.5">
            {/* Summary Banner Card */}
            <div className="rounded-3xl bg-gradient-to-br from-[#0055FF] via-blue-700 to-indigo-800 p-5 text-white shadow-lg">
              <div className="flex items-center justify-between text-blue-100 text-xs font-bold">
                <span className="flex items-center gap-1">
                  <Trophy size={14} className="text-amber-300" />
                  누적 주행 요약
                </span>
                <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-white text-[11px] font-bold">
                  총 {records.length}회 주행 완료
                </span>
              </div>

              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black tracking-tight leading-none">{totalKm}</span>
                <span className="text-lg font-bold text-blue-200">km</span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/20 pt-3 text-center">
                <div>
                  <p className="text-[10px] font-bold text-blue-200">총 주행 시간</p>
                  <p className="text-sm font-black text-white mt-0.5">
                    {Math.floor(totalMinutes / 60)}시간 {totalMinutes % 60}분
                  </p>
                </div>
                <div className="border-x border-white/20">
                  <p className="text-[10px] font-bold text-blue-200">총 주행 횟수</p>
                  <p className="text-sm font-black text-white mt-0.5">{records.length}회</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-blue-200">소모 열량</p>
                  <p className="text-sm font-black text-amber-300 mt-0.5">{totalCalories} kcal</p>
                </div>
              </div>
            </div>

            {/* Weekly Activity Bar Chart with daily km values */}
            <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Flame size={15} className="text-orange-500" />
                  <span>주간 라이딩 활동량</span>
                  <span className="rounded bg-blue-50 border border-blue-200 px-1.5 py-0.2 text-[9px] font-bold text-[#0055FF]">
                    일별 주행거리(km)
                  </span>
                </div>
                <span className="text-[11px] font-extrabold text-[#0055FF]">
                  이번 주 합계 {weeklyData.totalWeeklyKm}km
                </span>
              </div>

              {/* 7-day Bar Chart with explicit km per date */}
              <div className="flex items-end justify-between gap-1.5 sm:gap-2 h-28 pt-4 px-1">
                {weeklyData.days.map((bar, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center justify-end h-full group">
                    {/* km Label above the bar */}
                    <div className="mb-1 text-center">
                      <span
                        className={`inline-block px-1 py-0.2 rounded text-[10px] font-black tracking-tight ${
                          bar.isToday
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : bar.km >= 6
                            ? 'text-[#0055FF] font-extrabold'
                            : 'text-slate-700'
                        }`}
                      >
                        {bar.km}
                        <span className="text-[8px] font-bold ml-0.5">km</span>
                      </span>
                    </div>

                    {/* Bar visualization */}
                    <div className="relative w-full max-w-[28px] bg-slate-100 rounded-t-lg overflow-hidden flex items-end h-16 border border-slate-200/60">
                      <div
                        className={`w-full rounded-t-lg transition-all duration-300 ${
                          bar.isToday
                            ? 'bg-gradient-to-t from-blue-700 to-blue-500'
                            : bar.km >= 6
                            ? 'bg-[#0055FF] group-hover:bg-blue-600'
                            : 'bg-slate-400 group-hover:bg-slate-500'
                        }`}
                        style={{ height: `${bar.heightPct}%` }}
                      />
                    </div>

                    {/* Day & Date Labels */}
                    <div className="mt-1.5 flex flex-col items-center leading-tight">
                      <span
                        className={`text-[11px] font-black ${
                          bar.isToday ? 'text-blue-600' : 'text-slate-700'
                        }`}
                      >
                        {bar.day}
                      </span>
                      <span className="text-[9px] text-slate-400 mt-0.5">
                        {bar.date}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Records List */}
            <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xs font-bold text-slate-800">최근 라이딩 기록</h2>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-[#0055FF] border border-blue-200">
                    {records.length}건
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsInputModalOpen(true)}
                    className="flex items-center gap-1 text-[11px] font-bold text-[#0055FF] hover:underline"
                  >
                    <Plus size={12} />
                    <span>직접 추가</span>
                  </button>
                  {records.length > 0 && (
                    <button
                      type="button"
                      onClick={onClearRecords}
                      className="flex items-center gap-0.5 text-[11px] font-bold text-slate-400 hover:text-red-500 transition-colors"
                      title="모든 기록 삭제"
                    >
                      <Trash2 size={11} />
                      <span>초기화</span>
                    </button>
                  )}
                </div>
              </div>

              {records.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-6 text-center border border-dashed border-slate-200">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-500">
                    <Navigation size={20} />
                  </div>
                  <p className="text-xs font-bold text-slate-700">등록된 주행 기록이 없습니다</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    상단의 [기록 입력] 버튼으로 오늘 주행한 기록을 등록해보세요!
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {records.map((rec) => (
                    <div
                      key={rec.id}
                      className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/90 hover:border-blue-300 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                              <Calendar size={11} />
                              {rec.date}
                            </span>
                            <span className="rounded-full bg-emerald-100 border border-emerald-200 px-2 py-0.2 text-[9px] font-extrabold text-emerald-800">
                              주행 완료
                            </span>
                          </div>
                          <h3 className="mt-1 text-xs font-bold text-slate-900 leading-snug">{rec.courseName}</h3>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => onSelectRecordRoute(rec)}
                            className="flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-[11px] font-bold text-[#0055FF] hover:bg-blue-100 active:scale-95 transition-all"
                          >
                            <span>지도 보기</span>
                            <ChevronRight size={12} />
                          </button>
                          {onDeleteRecord && (
                            <button
                              type="button"
                              onClick={() => onDeleteRecord(rec.id)}
                              className="p-1 text-slate-400 hover:text-red-500 rounded"
                              title="삭제"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-2.5 grid grid-cols-3 gap-1.5 rounded-lg bg-white border border-slate-200/80 p-2 text-center text-xs">
                        <div>
                          <p className="text-[10px] text-slate-400">거리</p>
                          <p className="font-bold text-slate-900 mt-0.5">{rec.distanceKm}km</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400">시간</p>
                          <p className="font-bold text-slate-900 mt-0.5">{rec.durationMinutes}분</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400">소모 열량</p>
                          <p className="font-bold text-amber-600 mt-0.5">{rec.calories}kcal</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════════════
            SECTION 2: 자전거 타기 전 확인리스트 (ABC 체크리스트)
        ════════════════════════════════════════════════════════════════════════════ */}
        {/* ════════════════════════════════════════════════════════════════════════════
            SECTION 2: 자전거 타기 전 필수 점검 (ABC-HLQ 체크리스트) - 가독성 대폭 강화
        ════════════════════════════════════════════════════════════════════════════ */}
        {(subTab === 'all' || subTab === 'checklist') && (
          <div id="pre-ride-checklist" className="rounded-3xl bg-white p-4 sm:p-5 border border-emerald-200/80 shadow-xs space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/20">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-black text-slate-900">자전거 타기 전 필수 점검 (ABC 체크리스트)</h3>
                    <span className="rounded-full bg-emerald-100 border border-emerald-200 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                      출발 전 1분
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">펑크, 브레이크 고장, 체인 이탈 등 주요 안전사고를 사전 예방합니다.</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={handleCheckAll}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 active:scale-98 shadow-xs transition-all"
                >
                  ✓ 전체 완료
                </button>
                <button
                  type="button"
                  onClick={handleResetChecklist}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                  title="초기화"
                >
                  <RotateCcw size={13} />
                  <span>초기화</span>
                </button>
              </div>
            </div>

            {/* Progress Gauge */}
            <div className="rounded-2xl bg-emerald-50/80 border border-emerald-100/90 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  {isAllChecksDone ? (
                    <span className="text-emerald-800 font-extrabold">🎉 모든 안전 점검 완료! 안심하고 라이딩을 즐기세요!</span>
                  ) : (
                    <span>점검 진행 상황 ({PRE_RIDE_CHECKS.length - completedCheckCount}개 항목 남음)</span>
                  )}
                </span>
                <span className="font-mono font-black text-emerald-700 bg-white px-2 py-0.5 rounded-lg border border-emerald-200 shadow-2xs">
                  {completedCheckCount} / {PRE_RIDE_CHECKS.length} 완료 ({Math.round((completedCheckCount / PRE_RIDE_CHECKS.length) * 100)}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-emerald-200/60 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-300 shadow-xs"
                  style={{ width: `${(completedCheckCount / PRE_RIDE_CHECKS.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Checklist Items: 가독성 극대화를 위한 전폭 단일 리스트 형태 */}
            <div className="flex flex-col gap-2.5">
              {PRE_RIDE_CHECKS.map((item, idx) => {
                const isChecked = !!checkedList[item.id];
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleCheckItem(item.id)}
                    className={`group cursor-pointer rounded-2xl border p-3.5 sm:p-4 transition-all duration-150 select-none ${
                      isChecked
                        ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-200/60'
                        : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50/50 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start gap-3 sm:gap-3.5">
                      {/* Checkbox button */}
                      <div className="pt-0.5 shrink-0">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-xl border transition-all ${
                            isChecked
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs scale-105'
                              : 'bg-white border-slate-300 text-slate-400 group-hover:border-emerald-500 group-hover:text-emerald-600'
                          }`}
                        >
                          {isChecked ? (
                            <Check size={16} className="stroke-[3]" />
                          ) : (
                            <span className="text-xs font-black">{idx + 1}</span>
                          )}
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="min-w-0 flex-1 space-y-1.5">
                        {/* Header Row: Category Badge + Full Title + Status Pill */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-lg shrink-0">{item.icon}</span>
                            <span
                              className={`text-[11px] font-extrabold px-2 py-0.5 rounded-lg shrink-0 ${
                                isChecked
                                  ? 'bg-emerald-200/90 text-emerald-900'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {item.code}
                            </span>
                            <h4
                              className={`text-xs sm:text-sm font-black transition-colors ${
                                isChecked
                                  ? 'text-emerald-950 line-through decoration-emerald-500/50'
                                  : 'text-slate-900'
                              }`}
                            >
                              {item.title}
                            </h4>
                          </div>

                          <span
                            className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              isChecked
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200 group-hover:bg-emerald-50 group-hover:text-emerald-700 group-hover:border-emerald-200'
                            }`}
                          >
                            {isChecked ? '점검 완료 ✓' : '확인 필요'}
                          </span>
                        </div>

                        {/* Core Inspection Instruction */}
                        <p
                          className={`text-xs leading-relaxed ${
                            isChecked ? 'text-emerald-900/80' : 'text-slate-700 font-medium'
                          }`}
                        >
                          {item.desc}
                        </p>

                        {/* Standard Criteria / Tip Box */}
                        <div
                          className={`flex items-start gap-2 text-xs rounded-xl px-3 py-2 border leading-relaxed ${
                            isChecked
                              ? 'bg-white/80 border-emerald-200/80 text-emerald-900'
                              : 'bg-slate-50 border-slate-200 text-slate-600'
                          }`}
                        >
                          <span className="shrink-0 text-amber-500 font-bold">💡</span>
                          <div className="text-[11px] sm:text-xs">
                            <strong className="text-slate-800 font-bold mr-1">점검 기준:</strong>
                            <span>{item.detail}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════════════
            SECTION 3: 안심 안전 가이드 3대 가로형 슬림 네모상자 (수신호 요령 · 사고대처 · 비상연락망)
        ════════════════════════════════════════════════════════════════════════════ */}
        {(subTab === 'all' || subTab === 'signals' || subTab === 'accident' || subTab === 'emergency') && (
          <div id="safety-guides-section" className="rounded-2xl bg-white p-3 sm:p-3.5 border border-slate-200 shadow-xs space-y-2">
            {/* Header */}
            <div className="flex items-center justify-between px-0.5">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Shield size={14} />
                </div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-black text-slate-900">안심 주행 안전 가이드</h3>
                  <span className="rounded-full bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 text-[9px] font-bold text-indigo-700">
                    3대 핵심 수칙
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-400">
                상자 터치 시 상세 설명 확인
              </span>
            </div>

            {/* 가로로 긴 슬림 네모상자 3개 (세로 길이 최소화, 설명 최소화) */}
            <div className="flex flex-col gap-1.5">
              {/* ── 가로 네모상자 1: 수신호 요령 ── */}
              <div
                onClick={() => setActiveDetailModal('signals')}
                className={`group cursor-pointer flex items-center justify-between rounded-xl border px-3 py-2 transition-all ${
                  expandedCard === 'signals' || subTab === 'signals'
                    ? 'border-blue-400 bg-blue-50/90 ring-1 ring-blue-300'
                    : 'border-blue-200 bg-gradient-to-r from-blue-50/80 via-white to-sky-50/30 hover:border-blue-400 hover:shadow-xs active:scale-[0.99]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#0055FF] text-white shadow-2xs">
                    <Bike size={13} />
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <h4 className="text-xs font-black text-slate-900 truncate">수신호 요령</h4>
                    <span className="rounded-full bg-blue-100 border border-blue-200 px-1.5 py-0.2 text-[9px] font-bold text-[#0055FF] shrink-0">
                      6대 표준동작
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-bold text-[#0055FF] group-hover:underline flex items-center gap-0.5">
                    상세보기
                    <ChevronRight size={13} className="text-[#0055FF] group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>

              {/* ── 가로 네모상자 2: 사고시 대처방법 ── */}
              <div
                onClick={() => setActiveDetailModal('accident')}
                className={`group cursor-pointer flex items-center justify-between rounded-xl border px-3 py-2 transition-all ${
                  expandedCard === 'accident' || subTab === 'accident'
                    ? 'border-amber-400 bg-amber-50/90 ring-1 ring-amber-300'
                    : 'border-amber-200 bg-gradient-to-r from-amber-50/80 via-white to-orange-50/30 hover:border-amber-400 hover:shadow-xs active:scale-[0.99]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-600 text-white shadow-2xs">
                    <AlertTriangle size={13} />
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <h4 className="text-xs font-black text-slate-900 truncate">사고시 대처방법</h4>
                    <span className="rounded-full bg-amber-100 border border-amber-200 px-1.5 py-0.2 text-[9px] font-bold text-amber-800 shrink-0">
                      5단계 수칙·보험
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-bold text-amber-700 group-hover:underline flex items-center gap-0.5">
                    상세보기
                    <ChevronRight size={13} className="text-amber-700 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>

              {/* ── 가로 네모상자 3: 비상연락망 ── */}
              <div
                onClick={() => setActiveDetailModal('contacts')}
                className={`group cursor-pointer flex items-center justify-between rounded-xl border px-3 py-2 transition-all ${
                  expandedCard === 'contacts' || subTab === 'emergency'
                    ? 'border-rose-400 bg-rose-50/90 ring-1 ring-rose-300'
                    : 'border-rose-200 bg-gradient-to-r from-rose-50/80 via-white to-red-50/30 hover:border-rose-400 hover:shadow-xs active:scale-[0.99]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-rose-600 text-white shadow-2xs">
                    <Phone size={13} />
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <h4 className="text-xs font-black text-slate-900 truncate">비상연락망</h4>
                    <span className="rounded-full bg-rose-100 border border-rose-200 px-1.5 py-0.2 text-[9px] font-bold text-rose-700 shrink-0">
                      119 · 안양시민보험
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-bold text-rose-700 group-hover:underline flex items-center gap-0.5">
                    상세보기
                    <ChevronRight size={13} className="text-rose-700 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            </div>

            {/* ── 인라인 펼침 상세 보기 (선택된 경우 인라인 렌더링) ── */}
            {(expandedCard === 'signals' || subTab === 'signals') && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-blue-700 flex items-center gap-1">
                    <Bike size={14} />
                    수신호 요령 상세 도감
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (subTab === 'signals') setSubTab('all');
                      setExpandedCard(null);
                    }}
                    className="text-[11px] text-slate-400 hover:text-slate-700 font-bold"
                  >
                    접기 ▲
                  </button>
                </div>
                <HandSignalsGuide />
              </div>
            )}

            {(expandedCard === 'accident' || subTab === 'accident') && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-amber-800 flex items-center gap-1">
                    <AlertTriangle size={14} />
                    사고 시 5단계 대처 요령
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (subTab === 'accident') setSubTab('all');
                      setExpandedCard(null);
                    }}
                    className="text-[11px] text-slate-400 hover:text-slate-700 font-bold"
                  >
                    접기 ▲
                  </button>
                </div>
                <AccidentGuide />
              </div>
            )}

            {(expandedCard === 'contacts' || subTab === 'emergency') && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-rose-800 flex items-center gap-1">
                    <Phone size={14} />
                    비상 연락처 및 긴급 직통
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (subTab === 'emergency') setSubTab('all');
                      setExpandedCard(null);
                    }}
                    className="text-[11px] text-slate-400 hover:text-slate-700 font-bold"
                  >
                    접기 ▲
                  </button>
                </div>
                <EmergencyContacts />
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── 라이딩 기록 직접 입력 모달 (New Record Modal) ── */}
      {isInputModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-200 p-6 text-slate-900 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-[#0055FF]">
                  <Bike size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">라이딩 기록 직접 입력</h3>
                  <p className="text-[10px] text-slate-500">주행하신 코스와 거리, 시간을 등록해 통계로 관리하세요.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInputModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRecord} className="space-y-3.5">
              {/* Course Input Mode Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">코스 입력 방식</label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl mb-2">
                  <button
                    type="button"
                    onClick={() => setIsCustomCourse(false)}
                    className={`flex items-center justify-center gap-1 py-2 px-2.5 rounded-lg text-xs font-bold transition-all ${
                      !isCustomCourse
                        ? 'bg-white text-[#0055FF] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>🎯 코스 목록에서 선택</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCustomCourse(true)}
                    className={`flex items-center justify-center gap-1 py-2 px-2.5 rounded-lg text-xs font-bold transition-all ${
                      isCustomCourse
                        ? 'bg-white text-[#0055FF] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>✏️ 코스명 직접 입력</span>
                  </button>
                </div>

                {!isCustomCourse ? (
                  <div className="space-y-1.5">
                    <select
                      value={newCourseName}
                      onChange={(e) => {
                        setNewCourseName(e.target.value);
                        const matched = Object.values(COURSE_DATA).find((c) => c.name === e.target.value);
                        if (matched) {
                          setDistanceKm(matched.distanceKm);
                        }
                      }}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-xs font-bold text-slate-800 bg-white focus:border-blue-500 focus:outline-none shadow-2xs"
                    >
                      {Object.values(COURSE_DATA).map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name} ({c.distanceKm}km)
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400">안양 공식 권장 코스를 선택하여 빠르게 등록합니다.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="예: 안양천~학의천 야간 산책 라이딩, 평촌 중앙공원 순환"
                      value={customCourseInput}
                      onChange={(e) => setCustomCourseInput(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-xs text-slate-800 bg-white focus:border-blue-500 focus:outline-none shadow-2xs"
                      required={isCustomCourse}
                    />
                    {/* Quick suggestion chips */}
                    <div className="flex flex-wrap items-center gap-1 text-[10px]">
                      <span className="text-slate-400 font-medium">자주 찾는 코스:</span>
                      {[
                        '안양천변 자유 주행',
                        '학의천 힐링 산책로',
                        '쌍개울~충훈교 코스',
                        '평촌중앙공원 순환',
                        '안양예술공원 라이딩',
                      ].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setCustomCourseInput(tag)}
                          className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 transition-colors border border-slate-200/80"
                        >
                          +{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Date & Time */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">주행 날짜 및 시각</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={recordDate}
                    onChange={(e) => setRecordDate(e.target.value)}
                    placeholder="2026-08-14 18:30"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono text-slate-800 focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Distance & Duration */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">주행 거리 (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="300"
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-800 focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">소요 시간 (분)</label>
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 0)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-800 focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Estimated Calories (Average speed removed as requested) */}
              <div className="rounded-xl bg-amber-50/90 border border-amber-200 p-3 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white shadow-2xs">
                    <Flame size={14} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-amber-900">예상 소모 열량</p>
                    <p className="text-xs font-black text-amber-700">{calculatedCalories} kcal</p>
                  </div>
                </div>
                <span className="text-[10px] text-amber-800/70 font-medium">거리 기준 자동 환산</span>
              </div>

              {/* Memo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">라이딩 메모 (선택)</label>
                <textarea
                  rows={2}
                  placeholder="오늘 라이딩 상태, 날씨, 체인 상태 등 기록"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInputModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-2.5 rounded-xl bg-[#0055FF] hover:bg-blue-700 active:scale-98 text-white text-xs font-bold shadow-md transition-all"
                >
                  기록 저장하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 안전 가이드 상세설명 모달 (수신호 요령 · 사고시 대처방법 · 비상연락망) ── */}
      {activeDetailModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setActiveDetailModal(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200 p-4 sm:p-5 text-slate-900 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-2xl text-white shadow-md ${
                    activeDetailModal === 'signals'
                      ? 'bg-[#0055FF] shadow-blue-500/20'
                      : activeDetailModal === 'accident'
                      ? 'bg-amber-600 shadow-amber-500/20'
                      : 'bg-rose-600 shadow-rose-500/20'
                  }`}
                >
                  {activeDetailModal === 'signals' && <Bike size={18} />}
                  {activeDetailModal === 'accident' && <AlertTriangle size={18} />}
                  {activeDetailModal === 'contacts' && <Phone size={18} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-slate-900">
                      {activeDetailModal === 'signals' && '자전거 수신호 요령 상세안내'}
                      {activeDetailModal === 'accident' && '사고 발생 시 대처방법 상세안내'}
                      {activeDetailModal === 'contacts' && '비상연락망 및 긴급 구조 안내'}
                    </h3>
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full border ${
                        activeDetailModal === 'signals'
                          ? 'bg-blue-50 text-[#0055FF] border-blue-200'
                          : activeDetailModal === 'accident'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      {activeDetailModal === 'signals' && '도로교통법'}
                      {activeDetailModal === 'accident' && '5단계 수칙'}
                      {activeDetailModal === 'contacts' && '원터치 연결'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {activeDetailModal === 'signals' && '표준 수신호 6대 동작 그래픽과 음성 안내'}
                    {activeDetailModal === 'accident' && '부상자 구호, 현장 사진 보존 및 안양시민 자전거보험 청구'}
                    {activeDetailModal === 'contacts' && '119, 112, 안양시민 자전거 단체보험 직통 전화'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveDetailModal(null)}
                className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                title="닫기"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body: Scrollable detail content */}
            <div className="overflow-y-auto flex-1 pr-1 space-y-3">
              {activeDetailModal === 'signals' && <HandSignalsGuide />}
              {activeDetailModal === 'accident' && <AccidentGuide />}
              {activeDetailModal === 'contacts' && <EmergencyContacts />}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400 font-medium">안전한 안양 라이딩을 응원합니다</span>
              <button
                type="button"
                onClick={() => setActiveDetailModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-bold transition-all shadow-xs"
              >
                확인 및 닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
