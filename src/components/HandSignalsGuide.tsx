import React, { useState } from 'react';
import {
  Bike,
  ArrowLeft,
  ArrowRight,
  Octagon,
  TrendingDown,
  ArrowUpRight,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Maximize2,
  CheckCircle,
  HelpCircle,
  Volume2
} from 'lucide-react';

interface HandSignal {
  id: string;
  title: string;
  subtitle: string;
  actionDesc: string;
  armDetail: string;
  whenToUse: string;
  tip: string;
  badgeColor: string;
  icon: React.ReactNode;
  svgType: 'left' | 'right' | 'stop' | 'slow' | 'yield' | 'hazard';
}

const HAND_SIGNALS: HandSignal[] = [
  {
    id: 'left_turn',
    title: '좌회전 (Left Turn)',
    subtitle: '왼쪽으로 방향을 전환할 때',
    actionDesc: '왼팔을 지면과 수평이 되도록 왼쪽 옆으로 곧게 뻗습니다.',
    armDetail: '왼팔 수평 전개 (손가락을 모으고 손바닥은 앞 또는 아래를 향함)',
    whenToUse: '교차로 좌회전 30m 전, 자전거 도로 분기점, 차선 변경 시',
    tip: '뒤따라오는 자전거 및 후방 차량이 인식할 수 있도록 3초 이상 유지 후 양손으로 핸들을 잡고 회전하세요.',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <ArrowLeft size={18} className="text-blue-600" />,
    svgType: 'left',
  },
  {
    id: 'right_turn',
    title: '우회전 (Right Turn)',
    subtitle: '오른쪽으로 방향을 전환할 때',
    actionDesc: '오른팔을 수평으로 곧게 뻗거나, 왼팔의 팔꿈치를 직각으로 올려 손을 위로 듭니다.',
    armDetail: '오른팔 수평 전개 (또는 왼팔 90도 직각 세우기)',
    whenToUse: '교차로 우회전 전, 골목길 진입 전, 우측 자전거 도로 진입 시',
    tip: '한국 도로교통법상 오른팔 수평 뻗기 또는 왼팔 90도 직각 세우기 모두 공식 신호로 인정됩니다.',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: <ArrowRight size={18} className="text-emerald-600" />,
    svgType: 'right',
  },
  {
    id: 'stop',
    title: '정지 및 급감속 (Stop)',
    subtitle: '자전거를 멈추거나 급정거할 때',
    actionDesc: '왼팔을 아래로 45도 뻗고 손바닥을 뒤쪽(후방)을 향하게 폅니다.',
    armDetail: '왼팔 45도 하향 전개 + 손바닥 후방 노출',
    whenToUse: '신호 대기 정지 전, 갑작스러운 정지, 보행자 횡단 발견 시',
    tip: '자전거는 제동 거리가 있으므로 급정거 직전 신호를 주어 후방 추돌 사고를 방지합니다.',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    icon: <Octagon size={18} className="text-rose-600" />,
    svgType: 'stop',
  },
  {
    id: 'slow_down',
    title: '서행 (Slow Down)',
    subtitle: '속도를 서서히 줄일 때',
    actionDesc: '왼팔을 비스듬히 아래로 뻗어 손바닥을 아래로 향한 채 위아래로 천천히 흔듭니다.',
    armDetail: '왼팔 45도 하향 + 손바닥 상하 펌핑 제스처',
    whenToUse: '내리막길, 노면 미끄러움, 전방 코너링, 혼잡 구간 진입 시',
    tip: '무리하게 멈추지 않고 주변 라이더들에게 "감속 중"임을 미리 알려 안전 거리를 확보하게 합니다.',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: <TrendingDown size={18} className="text-amber-600" />,
    svgType: 'slow',
  },
  {
    id: 'yield',
    title: '추월 허용 / 먼저 가세요 (Yield & Pass)',
    subtitle: '후방 라이더에게 먼저 가도록 양보할 때',
    actionDesc: '왼팔을 비스듬히 아래로 내린 뒤, 손을 앞뒤로 가볍게 저어주며 추월을 유도합니다.',
    armDetail: '왼손 전후 웨이브 제스처 + 우측 측면 서행',
    whenToUse: '자전거 도로에서 후방 속도가 빠를 때, 좁은 도로에서 양보할 때',
    tip: '신호와 함께 오른쪽 길 가장자리로 자전거를 붙여 통행로를 열어주는 것이 매너입니다.',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: <ArrowUpRight size={18} className="text-purple-600" />,
    svgType: 'yield',
  },
  {
    id: 'hazard',
    title: '노면 위험 / 장애물 (Road Hazard)',
    subtitle: '포트홀, 턱, 유리파편 등 위험 요소 발견 시',
    actionDesc: '위험물이 있는 방향의 손가락으로 바닥(노면)을 정확히 가리킵니다.',
    armDetail: '위험 방향(좌/우) 하향 손가락 지목 + 필요시 "바닥 조심!" 구호',
    whenToUse: '안양천 데크 턱, 우수관 덮개, 모래/자갈, 깨진 유리 발견 시',
    tip: '그룹 라이딩 시 후방 라이더가 미리 위험물을 피해갈 수 있도록 돕는 매우 중요한 신호입니다.',
    badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: <AlertTriangle size={18} className="text-orange-600" />,
    svgType: 'hazard',
  },
];

// Vector Cyclist Graphic Component representing specific hand posture
function CyclistPoseVisual({ type }: { type: HandSignal['svgType'] }) {
  return (
    <div className="relative w-full h-36 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-700 shadow-inner">
      {/* Road / Perspective grid lines */}
      <div className="absolute inset-x-0 bottom-0 h-10 bg-slate-950/60 border-t border-slate-700 flex justify-center">
        <div className="w-1 h-full bg-amber-400/40" />
      </div>

      <svg viewBox="0 0 200 130" className="w-48 h-32 select-none">
        <defs>
          <radialGradient id="cyclistGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0055FF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0055FF" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Halo Glow */}
        <circle cx="100" cy="65" r="45" fill="url(#cyclistGlow)" />

        {/* Bicycle Outline (Rear perspective) */}
        {/* Rear Wheel */}
        <circle cx="100" cy="100" r="16" stroke="#94a3b8" strokeWidth="3" fill="#1e293b" />
        <circle cx="100" cy="100" r="4" fill="#cbd5e1" />
        {/* Frame & Seat */}
        <line x1="100" y1="100" x2="100" y2="70" stroke="#cbd5e1" strokeWidth="3.5" strokeLinecap="round" />
        <ellipse cx="100" cy="68" rx="8" ry="3" fill="#64748b" />
        {/* Handlebars */}
        <line x1="80" y1="58" x2="120" y2="58" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />

        {/* Cyclist Body */}
        {/* Torso */}
        <path d="M92,68 L108,68 L105,45 L95,45 Z" fill="#0284c7" />
        {/* Helmet / Head */}
        <circle cx="100" cy="34" r="9" fill="#f8fafc" />
        <path d="M91,33 Q100,24 109,33 Q100,29 91,33 Z" fill="#f59e0b" />

        {/* ARMS BASED ON TYPE */}
        {type === 'left' && (
          <g>
            {/* Left Arm extended straight horizontally */}
            <line x1="95" y1="48" x2="42" y2="48" stroke="#38bdf8" strokeWidth="5" strokeLinecap="round" />
            {/* Hand with indicator pulse */}
            <circle cx="38" cy="48" r="5" fill="#38bdf8" />
            <circle cx="38" cy="48" r="9" stroke="#38bdf8" strokeWidth="1.5" opacity="0.6" className="animate-ping" />
            {/* Right arm on handlebar */}
            <line x1="105" y1="48" x2="116" y2="58" stroke="#0284c7" strokeWidth="4" strokeLinecap="round" />
            {/* Direction Arrow */}
            <path d="M55,34 L32,34 L42,26 M32,34 L42,42" fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}

        {type === 'right' && (
          <g>
            {/* Left arm on handlebar */}
            <line x1="95" y1="48" x2="84" y2="58" stroke="#0284c7" strokeWidth="4" strokeLinecap="round" />
            {/* Right arm extended straight horizontally */}
            <line x1="105" y1="48" x2="158" y2="48" stroke="#34d399" strokeWidth="5" strokeLinecap="round" />
            {/* Hand with indicator pulse */}
            <circle cx="162" cy="48" r="5" fill="#34d399" />
            <circle cx="162" cy="48" r="9" stroke="#34d399" strokeWidth="1.5" opacity="0.6" className="animate-ping" />
            {/* Direction Arrow */}
            <path d="M145,34 L168,34 L158,26 M168,34 L158,42" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}

        {type === 'stop' && (
          <g>
            {/* Left Arm extended downward 45 deg */}
            <line x1="95" y1="48" x2="60" y2="82" stroke="#f43f5e" strokeWidth="5" strokeLinecap="round" />
            {/* Palm back facing indicator */}
            <circle cx="56" cy="85" r="5" fill="#f43f5e" />
            <circle cx="56" cy="85" r="10" stroke="#f43f5e" strokeWidth="1.5" opacity="0.7" className="animate-ping" />
            {/* Right arm on handlebar */}
            <line x1="105" y1="48" x2="116" y2="58" stroke="#0284c7" strokeWidth="4" strokeLinecap="round" />
            {/* Stop Octagon Sign in Korean */}
            <g transform="translate(28, 68) scale(0.7)">
              <polygon points="12,2 24,2 32,10 32,22 24,30 12,30 4,22 4,10" fill="#f43f5e" stroke="#ffffff" strokeWidth="2" />
              <text x="18" y="19" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle">정지</text>
            </g>
          </g>
        )}

        {type === 'slow' && (
          <g>
            {/* Left Arm down with wave wave indicator */}
            <line x1="95" y1="48" x2="62" y2="76" stroke="#fbbf24" strokeWidth="5" strokeLinecap="round" />
            <circle cx="58" cy="80" r="5" fill="#fbbf24" />
            {/* Wave arrows */}
            <path d="M50,68 L50,88 M46,73 L50,68 L54,73 M46,83 L50,88 L54,83" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
            {/* Right arm on handlebar */}
            <line x1="105" y1="48" x2="116" y2="58" stroke="#0284c7" strokeWidth="4" strokeLinecap="round" />
          </g>
        )}

        {type === 'yield' && (
          <g>
            {/* Left Arm gesturing backward/forward to pass */}
            <line x1="95" y1="48" x2="65" y2="70" stroke="#c084fc" strokeWidth="5" strokeLinecap="round" />
            <circle cx="60" cy="74" r="5" fill="#c084fc" />
            {/* Forward Passing Arcs */}
            <path d="M48,60 Q38,72 52,84" fill="none" stroke="#c084fc" strokeWidth="2" strokeDasharray="3 3" />
            <path d="M46,88 L54,84 L48,78" fill="none" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" />
            {/* Right arm on handlebar */}
            <line x1="105" y1="48" x2="116" y2="58" stroke="#0284c7" strokeWidth="4" strokeLinecap="round" />
          </g>
        )}

        {type === 'hazard' && (
          <g>
            {/* Arm pointing finger down at road */}
            <line x1="95" y1="48" x2="70" y2="88" stroke="#fb923c" strokeWidth="5" strokeLinecap="round" />
            <circle cx="67" cy="93" r="4" fill="#fb923c" />
            {/* Hazard Triangle on ground */}
            <polygon points="50,112 65,88 80,112" fill="#ea580c" stroke="#ffffff" strokeWidth="1.5" />
            <text x="65" y="108" fill="white" fontSize="11" fontWeight="bold" textAnchor="middle">!</text>
            {/* Right arm on handlebar */}
            <line x1="105" y1="48" x2="116" y2="58" stroke="#0284c7" strokeWidth="4" strokeLinecap="round" />
          </g>
        )}
      </svg>
    </div>
  );
}

export default function HandSignalsGuide() {
  const [activeSignalId, setActiveSignalId] = useState<string>('left_turn');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFullPhotoModal, setShowFullPhotoModal] = useState<boolean>(false);

  const currentSignal = HAND_SIGNALS.find((s) => s.id === activeSignalId) || HAND_SIGNALS[0];

  const handleSpeakGuidance = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div id="hand-signals-section" className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50/70 via-white to-sky-50/60 p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#0055FF] text-white shadow-md shadow-blue-500/20">
            <Bike size={18} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-black text-slate-900">자전거 필수 수신호 도감</h3>
              <span className="rounded-full bg-blue-100 border border-blue-200 px-2 py-0.5 text-[10px] font-extrabold text-[#0055FF]">
                도로교통법 표준
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              자전거는 도로교통법상 &apos;차&apos;입니다. 방향 전환 및 정지 시 수신호로 소통하세요.
            </p>
          </div>
        </div>
      </div>

      {/* Main Illustration Banner (Korean Illustrated Guide) */}
      <div className="mt-4 relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-sm group">
        <img
          src="/src/assets/images/korean_bicycle_hand_signals_1788237007232.jpg"
          alt="자전거 수신호 안전 라이딩 일러스트"
          referrerPolicy="no-referrer"
          className="w-full h-44 object-cover object-center opacity-90 transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-black/20 flex flex-col justify-between p-3.5">
          <div className="flex justify-between items-start">
            <span className="rounded-lg bg-blue-600/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-extrabold text-white shadow-sm">
              🇰🇷 한국 도로교통법 기준
            </span>
            <button
              type="button"
              onClick={() => setShowFullPhotoModal(true)}
              className="flex items-center gap-1 rounded-xl bg-black/60 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-white hover:bg-black/80 transition-colors border border-white/20"
            >
              <Maximize2 size={12} />
              <span>크게보기</span>
            </button>
          </div>
          <div className="text-white">
            <p className="text-xs font-black text-amber-300 flex items-center gap-1">
              <span>💡 자전거 수신호 4대 골든룰</span>
            </p>
            <div className="grid grid-cols-2 gap-1.5 mt-1 text-[11px] font-medium text-slate-100">
              <span className="bg-white/15 px-2 py-0.5 rounded backdrop-blur-sm">1. 회전 3초 전 미리 신호</span>
              <span className="bg-white/15 px-2 py-0.5 rounded backdrop-blur-sm">2. 신호 후 반드시 양손 파지</span>
              <span className="bg-white/15 px-2 py-0.5 rounded backdrop-blur-sm">3. 고개 돌려 후방 확인</span>
              <span className="bg-white/15 px-2 py-0.5 rounded backdrop-blur-sm">4. &quot;좌회전!&quot; 음성구호 병행</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Tabs for Hand Signals */}
      <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {HAND_SIGNALS.map((signal) => {
          const isActive = signal.id === activeSignalId;
          return (
            <button
              key={signal.id}
              type="button"
              onClick={() => setActiveSignalId(signal.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                isActive
                  ? 'bg-[#0055FF] text-white shadow-md shadow-blue-500/25 scale-[1.02]'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {signal.icon}
              <span>{signal.title.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Active Hand Signal Interactive Feature Card */}
      <div className="mt-3.5 rounded-2xl border border-blue-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className={`rounded-lg px-2 py-0.5 text-[11px] font-extrabold border ${currentSignal.badgeColor}`}>
                {currentSignal.title}
              </span>
              <button
                type="button"
                onClick={() => handleSpeakGuidance(`${currentSignal.title}. ${currentSignal.actionDesc}. ${currentSignal.tip}`)}
                className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-[#0055FF] bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200"
                title="음성 안내 듣기"
              >
                <Volume2 size={12} />
                <span>음성 안내</span>
              </button>
            </div>
            <h4 className="mt-1 text-sm font-black text-slate-900">{currentSignal.subtitle}</h4>
          </div>
        </div>

        {/* Dynamic Pose Visualizer */}
        <div className="mt-3">
          <CyclistPoseVisual type={currentSignal.svgType} />
        </div>

        {/* Action Description */}
        <div className="mt-3 space-y-2 text-xs">
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
            <p className="font-bold text-slate-500 text-[11px]">동작 방법</p>
            <p className="text-slate-900 font-bold mt-0.5 text-xs leading-relaxed">{currentSignal.actionDesc}</p>
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg">
              <CheckCircle size={13} className="shrink-0 text-blue-600" />
              <span>포인트: {currentSignal.armDetail}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-2.5">
              <p className="font-bold text-emerald-800 flex items-center gap-1">
                <HelpCircle size={12} /> 언제 사용하나요?
              </p>
              <p className="mt-0.5 text-slate-700 leading-snug">{currentSignal.whenToUse}</p>
            </div>
            <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-2.5">
              <p className="font-bold text-amber-800 flex items-center gap-1">
                <AlertTriangle size={12} /> 안전 라이딩 팁
              </p>
              <p className="mt-0.5 text-slate-700 leading-snug">{currentSignal.tip}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Accordion list of all 6 signals for quick glance */}
      <div className="mt-4">
        <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
          <span>전체 수신호 목록 및 요약</span>
          <span className="text-[11px] text-slate-400 font-normal">터치하여 상세 펼치기</span>
        </h4>
        <div className="space-y-1.5">
          {HAND_SIGNALS.map((s) => {
            const isItemExpanded = expandedId === s.id;
            return (
              <div
                key={s.id}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(isItemExpanded ? null : s.id)}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-50"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                      {s.icon}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900">{s.title}</p>
                      <p className="text-[11px] text-slate-500">{s.subtitle}</p>
                    </div>
                  </div>
                  <div className="text-slate-400">
                    {isItemExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>
                {isItemExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/80 p-3 text-xs space-y-2">
                    <p className="text-slate-800 font-semibold leading-relaxed">👉 {s.actionDesc}</p>
                    <p className="text-[11px] text-slate-600">📍 권장 상황: {s.whenToUse}</p>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSignalId(s.id);
                          setExpandedId(null);
                        }}
                        className="text-[11px] font-bold text-[#0055FF] underline"
                      >
                        상단 그래픽에서 자세히 보기
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Full Photo Modal */}
      {showFullPhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="relative max-w-lg w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Bike size={18} className="text-blue-400" />
                <h4 className="font-bold text-sm">자전거 수신호 표준 종합 가이드</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowFullPhotoModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold bg-slate-800 px-2.5 py-1 rounded-lg"
              >
                닫기 ✕
              </button>
            </div>
            <div className="p-2 bg-black flex justify-center">
              <img
                src="/src/assets/images/korean_bicycle_hand_signals_1788237007232.jpg"
                alt="자전거 수신호 안전 라이딩 가이드"
                referrerPolicy="no-referrer"
                className="max-h-[60vh] w-auto object-contain rounded-xl"
              />
            </div>
            <div className="p-4 text-xs text-slate-300 space-y-2 bg-slate-900">
              <div className="flex items-center justify-between">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <span className="text-amber-400">💡</span> 자전거 수신호 핵심 4원칙
                </p>
                <span className="text-[10px] text-blue-400 font-bold bg-blue-950/80 border border-blue-800 px-2 py-0.5 rounded">
                  도로교통법 제38조
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-300">
                <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700">
                  <span className="font-bold text-blue-400">1. 사전 신호</span>: 회전·정지 30m(3초) 전 미리 표기
                </div>
                <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700">
                  <span className="font-bold text-emerald-400">2. 양손 파지</span>: 신호 완료 후 반드시 양손으로 조향
                </div>
                <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700">
                  <span className="font-bold text-amber-400">3. 숄더 체크</span>: 신호와 함께 고개 돌려 후방 확인
                </div>
                <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700">
                  <span className="font-bold text-purple-400">4. 육성 병행</span>: &quot;좌회전&quot;, &quot;정지&quot; 음성 구호
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
