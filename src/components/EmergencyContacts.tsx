import { useState } from 'react';
import {
  Phone,
  PhoneCall,
  Shield,
  Copy,
  Check,
  AlertOctagon,
  Building,
  Info,
  ChevronRight
} from 'lucide-react';

interface ContactItem {
  id: string;
  category: 'emergency' | 'anyang' | 'safety' | 'repair';
  title: string;
  number: string;
  rawTel: string;
  desc: string;
  hours: string;
  badge: string;
  badgeBg: string;
  important?: boolean;
}

const CONTACTS_DATA: ContactItem[] = [
  {
    id: '119',
    category: 'emergency',
    title: '119 소방재난 / 응급구조',
    number: '119',
    rawTel: '119',
    desc: '라이딩 중 인명 부상, 낙차로 인한 골절, 응급환자 발생 시 구급차 긴급출동',
    hours: '24시간 365일 연중무휴',
    badge: '긴급구조',
    badgeBg: 'bg-red-500 text-white',
    important: true,
  },
  {
    id: '112',
    category: 'emergency',
    title: '112 경찰청 / 교통사고 접수',
    number: '112',
    rawTel: '112',
    desc: '차량 또는 보행자와의 충돌사고, 뺑소니 사고, 현장 교통 통제 및 정밀 조사',
    hours: '24시간 365일 연중무휴',
    badge: '경찰신고',
    badgeBg: 'bg-blue-600 text-white',
    important: true,
  },
  {
    id: 'anyang_insurance',
    category: 'anyang',
    title: '안양시민 자전거 단체보험 전담창구',
    number: '1899-7751',
    rawTel: '1899-7751',
    desc: '안양시민 전원 자동가입 무료 보험. 자전거 사고 진단위로금(20만~60만원), 입원비, 벌금 및 변호사비용 보상 청구',
    hours: '평일 09:00 ~ 18:00 (점심시간 12:00~13:00)',
    badge: '안양시민 무료',
    badgeBg: 'bg-emerald-600 text-white',
    important: true,
  },
  {
    id: 'anyang_callcenter',
    category: 'anyang',
    title: '안양시 종합민원 콜센터',
    number: '031-8045-7000',
    rawTel: '03180457000',
    desc: '안양시 자전거 정책, 대여소 및 공공자전거 이용 문의, 일반 행정 민원',
    hours: '평일 08:30 ~ 18:30',
    badge: '시정상담',
    badgeBg: 'bg-indigo-600 text-white',
  },
  {
    id: 'anyang_road',
    category: 'anyang',
    title: '안양시 도로과 (자전거도로 정비/신고)',
    number: '031-8045-5683',
    rawTel: '03180455683',
    desc: '안양천/학의천 자전거도로 노면 파손, 포트홀, 표지판 훼손, 빗물받이 위험 신고',
    hours: '평일 09:00 ~ 18:00',
    badge: '시설물보수',
    badgeBg: 'bg-amber-600 text-white',
  },
  {
    id: 'traffic_safety',
    category: 'safety',
    title: '도로교통공단 사고처리 상담',
    number: '1577-1120',
    rawTel: '1577-1120',
    desc: '자전거-자동차 사고 과실비율 상담, 교통안전 수칙 안내',
    hours: '평일 09:00 ~ 18:00',
    badge: '과실상담',
    badgeBg: 'bg-slate-700 text-white',
  },
  {
    id: 'gyeonggi_call',
    category: 'safety',
    title: '경기도 콜센터',
    number: '031-120',
    rawTel: '031120',
    desc: '경기도 내 광역 자전거길 연계 및 도정 민원 접수',
    hours: '24시간 365일',
    badge: '광역민원',
    badgeBg: 'bg-teal-600 text-white',
  },
];

export default function EmergencyContacts() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'emergency' | 'anyang'>('all');
  const [showInsuranceDetail, setShowInsuranceDetail] = useState<boolean>(false);

  const handleCopy = (id: string, num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredContacts = CONTACTS_DATA.filter((c) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'emergency') return c.category === 'emergency';
    if (selectedFilter === 'anyang') return c.category === 'anyang';
    return true;
  });

  return (
    <div id="emergency-contacts-section" className="rounded-3xl border border-rose-200 bg-gradient-to-br from-rose-50/70 via-white to-red-50/60 p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-md shadow-rose-500/20">
            <Phone size={18} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-black text-slate-900">비상 연락처 및 상담 번호</h3>
              <span className="rounded-full bg-rose-100 border border-rose-200 px-2 py-0.5 text-[10px] font-extrabold text-rose-700">
                원터치 연결
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              위급 상황 발생 시 번호를 터치하여 즉시 통화할 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* High-priority Emergency Quick Actions */}
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <a
          href="tel:119"
          className="group relative flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 p-4 text-white shadow-md shadow-red-500/25 active:scale-95 transition-all hover:brightness-105"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 mb-2">
            <PhoneCall size={20} className="animate-pulse" />
          </div>
          <span className="text-[11px] font-bold text-red-100">응급의료 / 구조</span>
          <span className="text-2xl font-black tracking-tight mt-0.5">119</span>
          <span className="mt-1 text-[10px] bg-black/20 px-2 py-0.5 rounded-full font-medium">
            터치하여 즉시 통화
          </span>
        </a>

        <a
          href="tel:112"
          className="group relative flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-4 text-white shadow-md shadow-blue-600/25 active:scale-95 transition-all hover:brightness-105"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 mb-2">
            <AlertOctagon size={20} />
          </div>
          <span className="text-[11px] font-bold text-blue-100">경찰 / 사고접수</span>
          <span className="text-2xl font-black tracking-tight mt-0.5">112</span>
          <span className="mt-1 text-[10px] bg-black/20 px-2 py-0.5 rounded-full font-medium">
            터치하여 즉시 통화
          </span>
        </a>
      </div>

      {/* Anyang Citizen Free Bicycle Insurance Banner */}
      <div className="mt-4 rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <Shield size={16} />
            </div>
            <div>
              <p className="text-xs font-black text-emerald-900">안양시민 자전거 단체보험 (무료 자동가입)</p>
              <p className="text-[11px] text-emerald-700">별도 가입절차 없이 안양시민 누구나 보장</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowInsuranceDetail(!showInsuranceDetail)}
            className="flex items-center gap-0.5 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-100/70 px-2 py-1 rounded-lg transition-colors"
          >
            <span>{showInsuranceDetail ? '닫기' : '보장안내'}</span>
            <ChevronRight size={12} className={`transition-transform ${showInsuranceDetail ? 'rotate-90' : ''}`} />
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between bg-white rounded-xl p-3 border border-emerald-200">
          <div>
            <span className="text-[11px] text-slate-500 font-medium">보험 접수 및 문의</span>
            <p className="text-base font-black text-slate-900">1899-7751</p>
          </div>
          <a
            href="tel:1899-7751"
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition-all"
          >
            <PhoneCall size={13} />
            <span>보험 문의</span>
          </a>
        </div>

        {showInsuranceDetail && (
          <div className="mt-3 pt-3 border-t border-emerald-200/80 text-xs text-slate-700 space-y-2 animate-in fade-in">
            <p className="font-bold text-slate-900">📋 주요 보장 내용 (전국 어디서나 사고 발생 시 적용)</p>
            <ul className="space-y-1 text-[11px] text-slate-600 pl-1">
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">•</span>
                <span><strong>진단위로금</strong>: 4주 이상 진단 시 20만원 ~ 8주 이상 60만원 (4주이상 진단 후 6일이상 입원 시 20만원 추가)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">•</span>
                <span><strong>후유장해 / 사망</strong>: 최대 1,000만원 한도 보장 (만 15세 미만 사망 제외)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">•</span>
                <span><strong>사고 처리지원</strong>: 벌금(최대 2,000만원), 변호사 선임비용(최대 200만원), 교통사고처리지원금(최대 3,000만원)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">•</span>
                <span><strong>청구 기한</strong>: 사고일로부터 3년 이내 청구 가능</span>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Filter Buttons */}
      <div className="mt-4 flex gap-1.5">
        {[
          { id: 'all', label: '전체 번호' },
          { id: 'emergency', label: '긴급 신고 (119/112)' },
          { id: 'anyang', label: '안양시 행정/보험' },
        ].map((btn) => (
          <button
            key={btn.id}
            type="button"
            onClick={() => setSelectedFilter(btn.id as any)}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
              selectedFilter === btn.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Contact List */}
      <div className="mt-3 space-y-2">
        {filteredContacts.map((contact) => (
          <div
            key={contact.id}
            className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all hover:border-slate-300"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${contact.badgeBg}`}>
                    {contact.badge}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900">{contact.title}</h4>
                </div>
                <p className="mt-1 text-[11px] text-slate-500 leading-snug">{contact.desc}</p>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                  <span>운영: {contact.hours}</span>
                </div>
              </div>

              {/* Call and Copy Actions */}
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <a
                  href={`tel:${contact.rawTel}`}
                  className="flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 active:scale-95 transition-all"
                >
                  <PhoneCall size={12} />
                  <span>통화</span>
                </a>
                <button
                  type="button"
                  onClick={() => handleCopy(contact.id, contact.number)}
                  className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-slate-900 px-1.5 py-0.5 rounded border border-slate-100 bg-slate-50"
                  title="번호 복사"
                >
                  {copiedId === contact.id ? (
                    <>
                      <Check size={11} className="text-emerald-600" />
                      <span className="text-emerald-600 font-bold">복사됨</span>
                    </>
                  ) : (
                    <>
                      <Copy size={11} />
                      <span>{contact.number}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
