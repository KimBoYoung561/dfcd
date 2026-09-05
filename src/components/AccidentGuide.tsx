import React, { useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Camera,
  UserCheck,
  FileText,
  PhoneCall,
  CheckCircle2,
  CheckSquare,
  Square,
  Sparkles,
  ChevronRight,
  Info
} from 'lucide-react';

interface StepData {
  step: number;
  title: string;
  subtitle: string;
  details: string[];
  tips: string;
  icon: ReactNode;
  color: string;
}

const ACCIDENT_STEPS: StepData[] = [
  {
    step: 1,
    title: '즉시 정차 및 부상자 확인 (119 신고)',
    subtitle: '사고 즉시 자전거를 멈추고 2차 사고를 방지하세요',
    details: [
      '사고가 난 지점에 무리하게 움직이지 않고 비상등 점멸 또는 후방에 신호를 보냅니다.',
      '자신과 상대방의 부상 상태를 즉시 확인하고, 출혈이나 골절 등 중상자가 있을 경우 지체 없이 119에 신고합니다.',
      '부상자를 함부로 옮기지 말고(경추/척추 손상 위험), 안전지대로의 이동이 불가피할 때만 최소한으로 조치합니다.',
    ],
    tips: '🚨 절대 그냥 현장을 벗어나지 마세요. 가벼운 접촉이라도 자리를 뜨면 뺑소니(도주치상) 혐의를 받을 수 있습니다.',
    icon: <AlertTriangle size={18} className="text-red-600" />,
    color: 'from-red-50 to-rose-50 border-red-200 text-red-700',
  },
  {
    step: 2,
    title: '현장 보존 및 다각도 증거 촬영',
    subtitle: '스마트폰으로 현장과 주변 상황을 빠짐없이 기록하세요',
    details: [
      '자전거와 차량(또는 보행자)이 쓰러진 위치, 이동 궤적, 충돌 부위를 전체 샷(원거리 10m)으로 촬영합니다.',
      '자전거 차체 파손 부위, 긁힘, 찌그러짐, 페인트 흔적 등을 근접 촬영합니다.',
      '노면 상태(급경사, 모래, 물기, 포트홀, 표지판 유무) 및 스키드 마크(급제동 흔적)를 촬영합니다.',
      '주변 주차된 차량의 블랙박스 유무와 방범/교통 CCTV 위치를 확인하고 기록합니다.',
    ],
    tips: '📸 사진뿐만 아니라 현장 전체 음성이 담긴 동영상으로 주변 상황을 360도 회전 촬영해두면 과실 산정에 결정적 증거가 됩니다.',
    icon: <Camera size={18} className="text-indigo-600" />,
    color: 'from-indigo-50 to-blue-50 border-indigo-200 text-indigo-700',
  },
  {
    step: 3,
    title: '112 경찰 신고 및 상대방 인적사항 확보',
    subtitle: '공식 사고 접수와 상호 신원 확인은 필수입니다',
    details: [
      '상대방(운전자 또는 보행자)의 이름, 연락처, 주소, 차량번호를 메모하거나 명함/신분증을 상호 교환합니다.',
      '상대방의 자동차 보험사명 및 사고접수번호를 그 자리에서 확인하고 전화 통화로 번호가 맞는지 확인합니다.',
      '목격자가 있다면 정중하게 연락처와 진술 협조를 부탁드립니다.',
      '사고 규모와 관계없이 112에 신고하여 경찰관 현장 출동 및 정식 교통사고 기록을 남깁니다.',
    ],
    tips: '⚠️ "괜찮으니 그냥 가자"는 구두 합의는 절대 금물입니다. 나중에 뺑소니로 고소당하거나 부상이 악화되어 분쟁이 생깁니다.',
    icon: <UserCheck size={18} className="text-blue-600" />,
    color: 'from-blue-50 to-sky-50 border-blue-200 text-blue-700',
  },
  {
    step: 4,
    title: '안양시민 자전거 단체보험 접수',
    subtitle: '안양시민이라면 누구나 자동으로 무료 보장받습니다',
    details: [
      '안양시에 주민등록이 되어 있는 모든 시민(외국인 등록자 포함)은 별도 절차 없이 무료 자동 가입되어 있습니다.',
      '자전거를 직접 운전 중 일어난 사고뿐만 아니라, 보행 중 자전거로부터 입은 사고도 모두 보장됩니다.',
      '안양시민 자전거보험 콜센터(1899-7751)로 전화하여 사고 접수 및 청구서류를 안내받습니다.',
      '사고 발생일로부터 3년 이내에 청구할 수 있으므로 치료 완료 후 청구 가능합니다.',
    ],
    tips: '💼 개인 실손의료보험이나 운전자보험과 중복 보상(중복 지급)이 가능하므로 꼭 챙겨서 수령하세요.',
    icon: <ShieldAlert size={18} className="text-emerald-600" />,
    color: 'from-emerald-50 to-teal-50 border-emerald-200 text-emerald-700',
  },
  {
    step: 5,
    title: '병원 정밀검사 및 자전거 수리 견적서 수령',
    subtitle: '몸의 치료와 물적 손해 산정을 공식 문서화하세요',
    details: [
      '사고 직후에는 긴장으로 통증을 못 느낄 수 있으므로 당일 또는 익일 반드시 정형외과/응급실 진료를 받습니다.',
      '초진 진료 차트, X-ray/MRI 검사 결과, 의사 진단서(4주 이상 여부 기재)를 발급받습니다.',
      '공식 자전거 대리점 또는 정비샵에서 파손 자전거의 수리 견적서 및 점검 소견서를 발급받아 보관합니다.',
      '상대방 보험사 대인/대물 보상 담당자와 치료비 및 자전거 파손 손해배상을 협의합니다.',
    ],
    tips: '📄 진단서와 치료비 영수증, 약제비 영수증, 수리 견적서는 분실되지 않도록 스마트폰 사진으로 즉시 스캔 저장하세요.',
    icon: <FileText size={18} className="text-amber-600" />,
    color: 'from-amber-50 to-orange-50 border-amber-200 text-amber-700',
  },
];

export default function AccidentGuide() {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [checklist, setChecklist] = useState<{ [key: string]: boolean }>({
    'step1_stop': false,
    'step1_injury': false,
    'step2_photo_far': false,
    'step2_photo_close': false,
    'step3_call_112': false,
    'step3_contact': false,
    'step4_insurance': false,
    'step5_hospital': false,
  });

  const toggleChecklist = (key: string) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const totalCount = Object.keys(checklist).length;

  return (
    <div id="accident-guide-section" className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50/70 via-white to-orange-50/60 p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
            <ShieldAlert size={18} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-black text-slate-900">사고 발생 시 5단계 대처요령</h3>
              <span className="rounded-full bg-amber-100 border border-amber-200 px-2 py-0.5 text-[10px] font-extrabold text-amber-800">
                골든타임 행동수칙
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              침착하게 단계별로 대처하여 2차 사고를 막고 정당한 권리를 보호받으세요.
            </p>
          </div>
        </div>
      </div>

      {/* Safety Illustration Banner */}
      <div className="mt-4 relative overflow-hidden rounded-2xl border border-amber-200 bg-slate-900 shadow-sm">
        <img
          src="/src/assets/images/bicycle_accident_safety_1788236743420.jpg"
          alt="자전거 사고 대처 가이드 일러스트"
          referrerPolicy="no-referrer"
          className="w-full h-36 object-cover object-center opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/30 to-transparent flex flex-col justify-end p-3.5 text-white">
          <p className="text-xs font-black text-amber-300 flex items-center gap-1">
            <span>🚨 자전거 사고 핵심 3원칙</span>
          </p>
          <p className="text-[11px] text-slate-200 mt-0.5 font-medium">
            1. 즉시 정차 및 부상자 구호 | 2. 112/119 공식 신고 | 3. 다각도 현장 증거 촬영
          </p>
        </div>
      </div>

      {/* Step Numbers Selector Bar */}
      <div className="mt-4 flex gap-1 overflow-x-auto pb-1 no-scrollbar">
        {ACCIDENT_STEPS.map((s) => (
          <button
            key={s.step}
            type="button"
            onClick={() => setActiveStep(s.step)}
            className={`flex flex-1 min-w-[58px] flex-col items-center justify-center rounded-xl py-2 px-1 text-center transition-all ${
              activeStep === s.step
                ? 'bg-slate-900 text-white shadow-sm font-bold scale-[1.02]'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 font-semibold'
            }`}
          >
            <span className="text-[10px] opacity-75">STEP {s.step}</span>
            <span className="text-[11px] truncate max-w-full">
              {s.step === 1 ? '구호' : s.step === 2 ? '증거' : s.step === 3 ? '신고' : s.step === 4 ? '보험' : '치료'}
            </span>
          </button>
        ))}
      </div>

      {/* Active Step Content Card */}
      {(() => {
        const stepData = ACCIDENT_STEPS.find((s) => s.step === activeStep) || ACCIDENT_STEPS[0];
        return (
          <div className="mt-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100">
                {stepData.icon}
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  STEP {stepData.step} of 5
                </span>
                <h4 className="text-sm font-black text-slate-900 mt-0.5">{stepData.title}</h4>
              </div>
            </div>

            <p className="mt-2 text-xs font-semibold text-slate-600">{stepData.subtitle}</p>

            <div className="mt-3 space-y-2 text-xs">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-2">
                {stepData.details.map((detail, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-black text-slate-700 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-slate-800 leading-relaxed text-xs">{detail}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-[11px] text-amber-900 font-medium">
                {stepData.tips}
              </div>
            </div>

            {/* Step Navigation Controls */}
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setActiveStep(Math.max(1, activeStep - 1))}
                disabled={activeStep === 1}
                className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none"
              >
                ← 이전 단계
              </button>

              <span className="text-[11px] font-bold text-slate-400">
                {activeStep} / 5
              </span>

              <button
                type="button"
                onClick={() => setActiveStep(Math.min(5, activeStep + 1))}
                disabled={activeStep === 5}
                className="flex items-center gap-1 rounded-lg bg-[#0055FF] px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-600 disabled:opacity-30 disabled:pointer-events-none"
              >
                <span>다음 단계</span>
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        );
      })()}

      {/* Interactive Emergency Accident Checklist */}
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <h4 className="text-xs font-black text-slate-900">현장 즉시 대응 체크리스트</h4>
          </div>
          <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            {completedCount} / {totalCount} 완료
          </span>
        </div>

        <p className="text-[11px] text-slate-500 mb-3">
          사고 발생 시 당황하지 않고 누락 없이 조치했는지 체크하세요.
        </p>

        <div className="space-y-1.5">
          {[
            { id: 'step1_stop', label: '1. 즉시 정차 후 안전지대 확보 및 2차 사고 방지 조치' },
            { id: 'step1_injury', label: '2. 부상자 확인 및 필요 시 119 구급차 긴급 호출' },
            { id: 'step2_photo_far', label: '3. 현장 전체 원거리 사진(10m 밖) 및 이동 궤적 촬영' },
            { id: 'step2_photo_close', label: '4. 자전거/차량 파손 부위 및 노면 스키드마크 근접 촬영' },
            { id: 'step3_call_112', label: '5. 112 경찰 접수로 정식 교통사고 사건번호 부여받기' },
            { id: 'step3_contact', label: '6. 상대방 이름, 전화번호, 보험사 접수번호 상호 교환' },
            { id: 'step4_insurance', label: '7. 안양시민 자전거보험(1899-7751) 사고 접수' },
            { id: 'step5_hospital', label: '8. 병원 정밀 진단서 발급 및 자전거 수리 견적서 보관' },
          ].map((item) => {
            const isChecked = checklist[item.id];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleChecklist(item.id)}
                className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all text-xs ${
                  isChecked
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900 font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {isChecked ? (
                  <CheckSquare size={16} className="shrink-0 text-emerald-600" />
                ) : (
                  <Square size={16} className="shrink-0 text-slate-400" />
                )}
                <span className={isChecked ? 'line-through opacity-80' : ''}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
