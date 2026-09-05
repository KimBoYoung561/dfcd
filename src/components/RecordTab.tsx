import { useState, useEffect } from 'react';
import { RidingRecord } from '../types';
import {
  Trophy,
  ShieldCheck,
  BellRing,
  CheckCircle2,
  Bike,
  PhoneCall,
  ShieldAlert,
  Calendar,
  Plus,
  RotateCcw,
  Edit3,
  Flame,
  Clock,
  Sparkles,
  ChevronRight,
  ArrowLeft,
  X,
  Check,
  ExternalLink
} from 'lucide-react';
import HandSignalsGuide from './HandSignalsGuide';
import EmergencyContacts from './EmergencyContacts';
import AccidentGuide from './AccidentGuide';

interface RecordTabProps {
  records?: RidingRecord[];
  onSelectRecordRoute?: (record: RidingRecord) => void;
  onClearRecords?: () => void;
}

interface DayRecord {
  id: string;
  name: string;
  fullName: string;
  km: number;
}

const DEFAULT_WEEK_DAYS: DayRecord[] = [
  { id: 'mon', name: '월', fullName: '월요일', km: 4.5 },
  { id: 'tue', name: '화', fullName: '화요일', km: 3.2 },
  { id: 'wed', name: '수', fullName: '수요일', km: 7.0 },
  { id: 'thu', name: '목', fullName: '목요일', km: 0.0 },
  { id: 'fri', name: '금', fullName: '금요일', km: 5.5 },
  { id: 'sat', name: '토', fullName: '토요일', km: 12.8 },
  { id: 'sun', name: '일', fullName: '일요일', km: 6.0 },
];

const LOCAL_STORAGE_WEEK_KEY = 'anyang_weekly_mileage_days_v1';
const LOCAL_STORAGE_GOAL_KEY = 'anyang_weekly_mileage_goal_v1';

export default function RecordTab({}: RecordTabProps) {
  // Modal state for opening detailed guides in a new window/dialog
  const [activeModal, setActiveModal] = useState<'signals' | 'contacts' | 'accident' | null>(null);
  
  // Weekly mileage day-by-day state
  const [weekDays, setWeekDays] = useState<DayRecord[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_WEEK_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return DEFAULT_WEEK_DAYS;
  });

  const [weeklyGoalKm, setWeeklyGoalKm] = useState<number>(() => {
    try {
      const savedGoal = localStorage.getItem(LOCAL_STORAGE_GOAL_KEY);
      if (savedGoal) {
        return Number(savedGoal) || 40;
      }
    } catch {
      // ignore
    }
    return 40;
  });

  const [selectedDayId, setSelectedDayId] = useState<string>('sat');
  const [isEditingGoal, setIsEditingGoal] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_WEEK_KEY, JSON.stringify(weekDays));
    } catch {
      // ignore
    }
  }, [weekDays]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_GOAL_KEY, weeklyGoalKm.toString());
    } catch {
      // ignore
    }
  }, [weeklyGoalKm]);

  // Handle ESC key to close modal & prevent background scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveModal(null);
      }
    };

    if (activeModal) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [activeModal]);

  // Derived metrics
  const totalWeeklyKm = Math.round(weekDays.reduce((acc, d) => acc + (Number(d.km) || 0), 0) * 10) / 10;
  const progressPercent = Math.min(100, Math.round((totalWeeklyKm / (weeklyGoalKm || 1)) * 100));
  // Est calories (~29 kcal per km)
  const totalCalories = Math.round(totalWeeklyKm * 29);
  // Est ride time (avg 18 km/h)
  const estTotalMinutes = Math.round((totalWeeklyKm / 18) * 60);
  const estHours = Math.floor(estTotalMinutes / 60);
  const estMins = estTotalMinutes % 60;
  // Max day
  const maxDay = [...weekDays].sort((a, b) => b.km - a.km)[0];
  const activeDay = weekDays.find((d) => d.id === selectedDayId) || weekDays[0];

  // Handlers for modifying distance
  const handleUpdateKm = (dayId: string, newKm: number) => {
    const validKm = Math.max(0, Math.min(999, Math.round(newKm * 10) / 10));
    setWeekDays((prev) =>
      prev.map((day) => (day.id === dayId ? { ...day, km: validKm } : day))
    );
  };

  const handleAddKm = (dayId: string, amount: number) => {
    setWeekDays((prev) =>
      prev.map((day) => {
        if (day.id === dayId) {
          const updated = Math.max(0, Math.round(((day.km || 0) + amount) * 10) / 10);
          return { ...day, km: updated };
        }
        return day;
      })
    );
  };

  const handleResetWeek = () => {
    if (window.confirm('이번 주 모든 요일의 주행거리를 0km로 초기화하시겠습니까?')) {
      setWeekDays(weekDays.map((d) => ({ ...d, km: 0 })));
    }
  };

  const maxKmVal = Math.max(...weekDays.map((d) => d.km), 10);

  return (
    <div className="flex h-full flex-col bg-slate-100 text-slate-900 overflow-y-auto pb-24">
      {/* Top Header */}
      <div className="bg-white px-6 pt-6 pb-4 border-b border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">주행 기록 & 안전 센터</h1>
            <p className="text-xs text-slate-500 mt-0.5">요일별 주행량 관리 및 라이더 필수 안전 정보</p>
          </div>
          <span className="text-xs font-bold text-[#0055FF] bg-blue-50 border border-blue-200 px-3 py-1 rounded-full flex items-center gap-1">
            <Sparkles size={13} />
            이번 주 {totalWeeklyKm}km
          </span>
        </div>

        {/* Quick Safety Shortcuts */}
        <div className="mt-3.5 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveModal('signals')}
            className="flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-all active:scale-95"
          >
            <Bike size={13} className="text-[#0055FF]" />
            <span>수신호 도감</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveModal('contacts')}
            className="flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-all active:scale-95"
          >
            <PhoneCall size={13} className="text-red-600" />
            <span>비상 연락처</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveModal('accident')}
            className="flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition-all active:scale-95"
          >
            <ShieldAlert size={13} className="text-amber-600" />
            <span>사고 대처요령</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-5 pt-5 pb-8 space-y-6">

        {/* Section 1: Weekly Mileage (Interactive Tracker) */}
        <div className="space-y-4 animate-in fade-in">
          {/* Summary Card */}
          <div className="rounded-3xl bg-gradient-to-br from-[#0055FF] via-blue-600 to-[#003bb3] p-6 text-white shadow-lg">
            <div className="flex items-center justify-between text-blue-100 text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} />
                이번 주 안양천 주행 기록
              </span>
              <button
                type="button"
                onClick={() => setIsEditingGoal(!isEditingGoal)}
                className="flex items-center gap-1 bg-white/20 hover:bg-white/30 active:scale-95 px-2.5 py-1 rounded-full text-white text-[11px] font-bold transition-all border border-white/20"
              >
                <Trophy size={13} className="text-amber-300" />
                <span>목표 {weeklyGoalKm}km ({progressPercent}%)</span>
                <Edit3 size={11} className="ml-0.5 opacity-80" />
              </button>
            </div>

            {/* Goal Edit Dropdown */}
            {isEditingGoal && (
              <div className="mt-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 flex items-center justify-between gap-2 animate-in fade-in">
                <span className="text-xs font-bold text-white">주간 목표 거리:</span>
                <div className="flex items-center gap-1.5">
                  {[20, 30, 40, 50, 70].map((goal) => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => {
                        setWeeklyGoalKm(goal);
                        setIsEditingGoal(false);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                        weeklyGoalKm === goal
                          ? 'bg-white text-[#0055FF] shadow'
                          : 'bg-black/20 text-white hover:bg-white/20'
                      }`}
                    >
                      {goal}km
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 flex items-baseline justify-between">
              <div>
                <span className="text-5xl font-black tracking-tight leading-none">{totalWeeklyKm}</span>
                <span className="text-xl font-bold text-blue-100 ml-1.5">km</span>
              </div>
              {maxDay && maxDay.km > 0 && (
                <div className="text-right">
                  <span className="text-[11px] text-blue-200 font-medium">주간 최고 주행일</span>
                  <p className="text-sm font-bold text-amber-300">
                    {maxDay.fullName} ({maxDay.km}km)
                  </p>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mt-3">
              <div className="w-full bg-black/25 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-300 h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Stat breakdown */}
            <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/20 pt-3 text-center">
              <div>
                <p className="text-[11px] font-bold text-blue-100 flex items-center justify-center gap-1">
                  <Clock size={12} />
                  예상 주행 시간
                </p>
                <p className="text-sm font-bold text-white mt-0.5">
                  {estHours > 0 ? `${estHours}시간 ` : ''}{estMins}분
                </p>
              </div>
              <div className="border-x border-white/20">
                <p className="text-[11px] font-bold text-blue-100 flex items-center justify-center gap-1">
                  <Bike size={12} />
                  주간 주행일
                </p>
                <p className="text-sm font-bold text-white mt-0.5">
                  {weekDays.filter((d) => d.km > 0).length}일 / 7일
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-blue-100 flex items-center justify-center gap-1">
                  <Flame size={12} />
                  소모 열량
                </p>
                <p className="text-sm font-bold text-white mt-0.5">{totalCalories} kcal</p>
              </div>
            </div>
          </div>

          {/* Interactive Day-by-Day Mileage Editor & Bar Graph */}
          <div className="rounded-3xl bg-white p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <span>📊 요일별 주간 주행량 직접 입력</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  요일을 터치하여 선택 후 거리를 직접 수정하거나 증감 버튼을 누르세요.
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetWeek}
                className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-red-600 bg-slate-100 hover:bg-red-50 px-2.5 py-1 rounded-xl transition-colors border border-slate-200"
                title="전체 0km로 초기화"
              >
                <RotateCcw size={11} />
                <span>초기화</span>
              </button>
            </div>

            {/* Visual Interactive Bar Graph */}
            <div className="mt-5 flex items-end justify-between gap-2 h-28 pt-2 pb-1 px-1 bg-slate-50 rounded-2xl border border-slate-100">
              {weekDays.map((day) => {
                const isSelected = day.id === selectedDayId;
                const barHeight = maxKmVal > 0 ? Math.max(8, (day.km / maxKmVal) * 100) : 8;
                const isTopDay = day.km > 0 && day.km === maxDay.km;

                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => setSelectedDayId(day.id)}
                    className="flex flex-1 flex-col items-center gap-1.5 group cursor-pointer focus:outline-none"
                  >
                    <span className={`text-[10px] font-extrabold transition-colors ${
                      isSelected ? 'text-[#0055FF]' : isTopDay ? 'text-amber-600' : 'text-slate-600'
                    }`}>
                      {day.km > 0 ? `${day.km}` : '-'}
                    </span>
                    <div className={`relative w-full rounded-xl overflow-hidden flex items-end h-16 transition-all ${
                      isSelected ? 'bg-blue-100 ring-2 ring-[#0055FF]' : 'bg-slate-200/80 group-hover:bg-slate-300'
                    }`}>
                      <div
                        className={`w-full rounded-t-lg transition-all duration-300 ${
                          isSelected
                            ? 'bg-[#0055FF] shadow-sm'
                            : isTopDay
                            ? 'bg-amber-500'
                            : day.km > 0
                            ? 'bg-blue-400'
                            : 'bg-transparent'
                        }`}
                        style={{ height: `${barHeight}%` }}
                      />
                    </div>
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black transition-all ${
                      isSelected
                        ? 'bg-[#0055FF] text-white shadow-sm scale-110'
                        : 'text-slate-700 bg-white border border-slate-200'
                    }`}>
                      {day.name}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Day Detail & Quick Edit Box */}
            {activeDay && (
              <div className="mt-4 rounded-2xl bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/70 p-4 border border-blue-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0055FF] text-white font-black text-sm shadow-md shadow-blue-500/20">
                      {activeDay.name}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-slate-900">{activeDay.fullName} 주행 기록</h4>
                        <span className="text-[11px] font-bold text-[#0055FF] bg-blue-100 px-2 py-0.5 rounded-full">
                          선택됨
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        예상 소모 열량: <strong className="text-amber-600">{Math.round(activeDay.km * 29)} kcal</strong>
                      </p>
                    </div>
                  </div>

                  {/* Direct Distance Input Field */}
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="999"
                        value={activeDay.km === 0 ? '' : activeDay.km}
                        placeholder="0.0"
                        onChange={(e) => {
                          const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          handleUpdateKm(activeDay.id, isNaN(val) ? 0 : val);
                        }}
                        className="w-24 rounded-xl border border-blue-300 bg-white px-3 py-2 text-right text-base font-black text-slate-900 shadow-sm focus:border-[#0055FF] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      <span className="absolute right-2.5 top-2.5 text-xs font-bold text-slate-400 pointer-events-none">
                        km
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Increment Buttons */}
                <div className="mt-3.5 pt-3 border-t border-blue-100 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-600 mr-1 flex items-center gap-1">
                    <Plus size={11} className="text-[#0055FF]" />
                    빠른 추가:
                  </span>
                  {[
                    { label: '+1 km', val: 1 },
                    { label: '+3 km', val: 3 },
                    { label: '+5 km', val: 5 },
                    { label: '+10 km', val: 10 },
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      type="button"
                      onClick={() => handleAddKm(activeDay.id, btn.val)}
                      className="rounded-xl bg-white hover:bg-blue-50 active:scale-95 border border-blue-200 px-2.5 py-1 text-xs font-bold text-[#0055FF] transition-all shadow-sm"
                    >
                      {btn.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleUpdateKm(activeDay.id, 0)}
                    className="rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 active:scale-95 border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600 transition-all ml-auto"
                  >
                    0km 초기화
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Safe Riding Rules & Maintenance Reminder */}
        <div className="space-y-4 pt-1">
          {/* Maintenance Checklist Reminder */}
          <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <BellRing size={16} className="text-amber-600" />
              <h3 className="text-sm font-black text-slate-900">오늘의 정비 알림</h3>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-white/80 p-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-600">안전 점검 필수 4대 수칙 (ABC-Q)</p>
                  <p className="mt-1 text-xs font-bold text-slate-900">
                    Air(공기압), Brake(브레이크), Chain(체인), Quick release(안장/바퀴 잠금 레버)
                  </p>
                  <p className="mt-1 text-[11px] text-slate-600">
                    출발 전 1분 점검이 라이딩 중 발생하는 낙차 사고와 기재 고장을 예방합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 5 Core Safe Riding Rules */}
          <div className="rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50 p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck size={16} className="text-sky-600" />
              <h3 className="text-sm font-black text-slate-900">안양천 자전거도로 5대 안전 수칙</h3>
            </div>

            <div className="space-y-2">
              {[
                '안전모(헬멧)는 생명모! 턱끈을 조여 반드시 착용하세요.',
                '안양천 보행자 겸용도로에서는 시속 20km 이하로 서행하세요.',
                '횡단보도에서는 자전거에서 내려 보행자로 끌고 건너세요.',
                '야간 라이딩 시 전조등(아래 방향) 및 후미등(적색) 필수 점등.',
                '주행 중 이어폰 사용 및 스마트폰 조작은 금지입니다.',
              ].map((rule, index) => (
                <div key={rule} className="flex gap-2.5 rounded-2xl border border-sky-100 bg-white/80 p-2.5 items-center">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[10px] font-black text-sky-700">
                    {index + 1}
                  </div>
                  <p className="text-xs leading-snug text-slate-700 font-medium">{rule}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 3: 3 Compact Safety Cards at the bottom */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-[#0055FF]" />
              <span>라이더 안전 정보 & 가이드</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">카드를 누르면 새 창으로 상세 보기</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {/* Box 1: 자전거 수신호 도감 */}
            <button
              id="card-hand-signals"
              type="button"
              onClick={() => setActiveModal('signals')}
              className="group w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-sm active:scale-[0.99] transition-all text-left gap-3"
            >
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0055FF] border border-blue-100 group-hover:bg-[#0055FF] group-hover:text-white transition-all shadow-2xs">
                  <Bike size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-slate-900 group-hover:text-[#0055FF] transition-colors truncate">
                      자전거 수신호 도감
                    </h4>
                    <span className="shrink-0 text-[10px] font-extrabold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md border border-blue-200">
                      공식 6종
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    좌·우회전, 정지, 서행 등 필수 6종 수신호
                  </p>
                </div>
              </div>

              {/* Square New Window Action Button */}
              <div
                title="새 창 열기"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 group-hover:bg-[#0055FF] text-[#0055FF] group-hover:text-white border border-blue-200 transition-all shadow-2xs"
              >
                <ExternalLink size={15} />
              </div>
            </button>

            {/* Box 2: 비상연락처 */}
            <button
              id="card-emergency-contacts"
              type="button"
              onClick={() => setActiveModal('contacts')}
              className="group w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white border border-slate-200 hover:border-red-400 hover:shadow-sm active:scale-[0.99] transition-all text-left gap-3"
            >
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-100 group-hover:bg-red-600 group-hover:text-white transition-all shadow-2xs">
                  <PhoneCall size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-slate-900 group-hover:text-red-600 transition-colors truncate">
                      비상연락처
                    </h4>
                    <span className="shrink-0 text-[10px] font-extrabold text-red-700 bg-red-100/80 px-2 py-0.5 rounded-md border border-red-200">
                      긴급 번호
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    119 응급구조, 112 경찰, 안양시민 자전거보험
                  </p>
                </div>
              </div>

              {/* Square New Window Action Button */}
              <div
                title="새 창 열기"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 group-hover:bg-red-600 text-red-600 group-hover:text-white border border-red-200 transition-all shadow-2xs"
              >
                <ExternalLink size={15} />
              </div>
            </button>

            {/* Box 3: 사고발생시 대처요령 */}
            <button
              id="card-accident-guide"
              type="button"
              onClick={() => setActiveModal('accident')}
              className="group w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-sm active:scale-[0.99] transition-all text-left gap-3"
            >
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-2xs">
                  <ShieldAlert size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-slate-900 group-hover:text-amber-700 transition-colors truncate">
                      사고발생시 대처요령
                    </h4>
                    <span className="shrink-0 text-[10px] font-extrabold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200">
                      5단계 수칙
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    현장 즉시 정차, 증거 촬영, 112 신고 및 보험 접수
                  </p>
                </div>
              </div>

              {/* Square New Window Action Button */}
              <div
                title="새 창 열기"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 group-hover:bg-amber-600 text-amber-700 group-hover:text-white border border-amber-200 transition-all shadow-2xs"
              >
                <ExternalLink size={15} />
              </div>
            </button>
          </div>
        </div>

      </div>

      {/* Full-Screen / Dialog Modal Window for Detailed Guides */}
      {activeModal && (
        <div
          id="record-detail-modal-overlay"
          className="fixed inset-0 z-50 flex flex-col bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActiveModal(null);
            }
          }}
        >
          <div className="flex h-full w-full max-w-4xl mx-auto flex-col bg-slate-100 shadow-2xl md:my-4 md:h-[calc(100vh-2rem)] md:rounded-3xl overflow-hidden animate-in slide-in-from-bottom-6 duration-200 border border-slate-200">
            {/* Modal Header */}
            <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3.5 shadow-sm">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 active:scale-95 transition-all"
                  title="뒤로가기"
                >
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50">
                      {activeModal === 'signals' && <Bike size={14} className="text-[#0055FF]" />}
                      {activeModal === 'contacts' && <PhoneCall size={14} className="text-red-500" />}
                      {activeModal === 'accident' && <ShieldAlert size={14} className="text-amber-500" />}
                    </span>
                    <h2 className="text-base font-black text-slate-900">
                      {activeModal === 'signals' && '자전거 수신호 도감'}
                      {activeModal === 'contacts' && '비상연락처'}
                      {activeModal === 'accident' && '사고발생시 대처요령'}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 ml-8">
                    {activeModal === 'signals' && '도로교통법 기준 라이더 간 필수 의사소통 수신호 6종 및 안전 팁'}
                    {activeModal === 'contacts' && '119 긴급구조, 112 경찰, 안양시민 무료 단체보험 및 시청 연락망'}
                    {activeModal === 'accident' && '현장조치 5단계 매뉴얼, 증거확보 체크리스트 및 보험 접수 안내'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 active:scale-95 transition-all"
                title="닫기"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body with Detailed Guide Component */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {activeModal === 'signals' && <HandSignalsGuide />}
              {activeModal === 'contacts' && <EmergencyContacts />}
              {activeModal === 'accident' && <AccidentGuide />}

              {/* Bottom Close Button */}
              <div className="pt-6 pb-4 text-center">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md active:scale-95 transition-all"
                >
                  <Check size={16} />
                  <span>확인 완료 (주행기록으로 돌아가기)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
