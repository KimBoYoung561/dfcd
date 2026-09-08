import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  MapPin,
  Compass,
  Navigation,
  ExternalLink,
  ChevronRight,
  RotateCcw,
  Bike,
} from 'lucide-react';
import { AnyangTourSpot, ANYANG_TOUR_SPOTS } from '../data/anyangAttractions';

interface AiChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  riderPosition: { lat: number; lng: number } | null;
  onSelectAttraction: (spot: AnyangTourSpot) => void;
  onFocusOnMap: (spot: AnyangTourSpot) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  matchedSpots?: Array<AnyangTourSpot & { distanceKm: number }>;
  timestamp: Date;
}

// 두 좌표 간 거리 계산 (km)
function calcDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// 대표 추천 질문 프리셋
const PRESET_PROMPTS = [
  { label: '🏆 안양 9경 추천', query: '안양 9경 중 대표적인 명소 순서대로 추천해 줘' },
  { label: '🌅 노을·일몰 뷰', query: '저녁 노을이나 일몰 뷰가 예쁜 라이딩 코스 추천해 줘' },
  { label: '☕ 카페거리 라이딩', query: '자전거길 따라 갈 수 있는 카페거리나 쉼터 알려줘' },
  { label: '🌲 초보 숲속 힐링', query: '자전거 초보자도 갈 수 있는 평지 수변길과 숲속 힐링 명소' },
  { label: '👨‍👩‍👧 가족 피크닉 공원', query: '아이들이나 가족과 함께 잔디밭 피크닉 가기 좋은 공원' },
  { label: '📍 내 위치 근처 명소', query: '현재 위치에서 가장 가까운 라이딩 명소 알려줘' },
];

export default function AiChatbotModal({
  isOpen,
  onClose,
  riderPosition,
  onSelectAttraction,
  onFocusOnMap,
}: AiChatbotModalProps) {
  const userLat = riderPosition?.lat ?? 37.3943;
  const userLng = riderPosition?.lng ?? 126.9568;

  // 전체 명소 거리 계산 매핑
  const spotsWithDistance = useMemo(() => {
    return ANYANG_TOUR_SPOTS.map((s) => ({
      ...s,
      distanceKm: calcDistanceKm(userLat, userLng, s.lat, s.lng),
    }));
  }, [userLat, userLng]);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      sender: 'ai',
      text: `안녕하세요! 안양시 25곳 자전거 명소와 안양 9경을 안내해 드리는 **안양 자전거 AI 추천 어시스턴트**입니다. 🚲\n\n원하시는 라이딩 분위기(힐링, 맛집, 노을, 초보자 코스, 가족 나들이)나 현재 위치 기준 맞춤 명소를 편하게 말씀해 주시면 딱 맞는 곳을 찾아드릴게요!`,
      timestamp: new Date(),
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 스크롤 맨 아래로 이동
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // 모달 열릴 때 인풋 포커스
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  // AI 응답 생성 엔진
  const generateAiResponse = (userQuery: string): { responseText: string; matchedSpots: Array<AnyangTourSpot & { distanceKm: number }> } => {
    const q = userQuery.toLowerCase().trim();

    // 1. 안양 9경 질의
    if (q.includes('9경') || q.includes('구경') || q.includes('대표') || q.includes('안양 구경')) {
      const nineSpots = spotsWithDistance
        .filter((s) => s.nineGyeongNumber != null)
        .sort((a, b) => (a.nineGyeongNumber ?? 999) - (b.nineGyeongNumber ?? 999));

      return {
        responseText: `안양시가 공식 선정한 **안양 9경(제1경~제9경)** 중 자전거로 접근하기 가장 좋은 대표 명소들을 순서대로 추천합니다!\n\n제1경 안양예술공원은 삼성천 숲길을 끼고 있어 힐링에 제격이며, 제2경 안양천 쌍개울은 안양천과 학의천이 만나는 라이더들의 성지입니다. 도심 속 호수가 아름다운 제3경 평촌중앙공원과 석양 명소인 제4경 망해암 일몰도 꼭 들러보세요.`,
        matchedSpots: nineSpots.slice(0, 4),
      };
    }

    // 2. 노을 / 일몰 / 전망 / 뷰
    if (q.includes('노을') || q.includes('일몰') || q.includes('낙조') || q.includes('전망') || q.includes('뷰') || q.includes('경치')) {
      const sunsetSpots = spotsWithDistance
        .filter(
          (s) =>
            s.id === 'spot-manghaeam' ||
            s.id === 'spot-ssanggaeul' ||
            s.id === 'spot-chunhun-cherry' ||
            s.tags.includes('일몰') ||
            s.tags.includes('낙조') ||
            s.tags.includes('전망')
        )
        .sort((a, b) => a.distanceKm - b.distanceKm);

      return {
        responseText: `탁 트인 하늘과 붉게 물드는 석양을 감상할 수 있는 **일몰 & 뷰포인트 명소**를 추천합니다! 🌅\n\n특히 **제4경 망해암 일몰**은 관악산 능선 너머로 서해 낙조를 조망할 수 있는 안양 최고의 뷰포인트입니다(약간의 언덕이 있으니 안전 기어 조절 권장). 평지 수변에서 탁 트인 노을을 보시려면 **안양천 쌍개울 광장**을 추천합니다.`,
        matchedSpots: sunsetSpots.length > 0 ? sunsetSpots : spotsWithDistance.slice(0, 3),
      };
    }

    // 3. 카페 / 커피 / 디저트 / 맛집 / 먹거리
    if (q.includes('카페') || q.includes('커피') || q.includes('맛집') || q.includes('디저트') || q.includes('먹거리') || q.includes('보급')) {
      const cafeSpots = spotsWithDistance
        .filter(
          (s) =>
            s.id === 'spot-dongpyeon-cafe' ||
            s.id === 'spot-anyang-1beonga' ||
            s.id === 'spot-pyeongchon-culture-street' ||
            s.id === 'spot-pyeongchon-food-town' ||
            s.id === 'spot-central-market' ||
            s.tags.includes('카페거리') ||
            s.tags.includes('맛집')
        )
        .sort((a, b) => a.distanceKm - b.distanceKm);

      return {
        responseText: `자전거를 타고 여유롭게 차 한잔과 디저트, 맛있는 보급을 즐길 수 있는 **카페거리 & 먹거리 명소**입니다! ☕\n\n학의천 자전거길과 바로 연결되는 **동편마을 카페거리**는 자전거 거치대와 야외 테라스가 잘 갖춰져 라이더들에게 인기가 많습니다. 활기찬 도심 분위기를 원하시면 **평촌1번가 로데오**나 **안양1번가**도 훌륭한 선택입니다.`,
        matchedSpots: cafeSpots.slice(0, 3),
      };
    }

    // 4. 초보자 / 평지 / 숲속 / 힐링 / 쉬운
    if (q.includes('초보') || q.includes('쉬운') || q.includes('평지') || q.includes('숲') || q.includes('힐링') || q.includes('피톤치드') || q.includes('나무')) {
      const easyForestSpots = spotsWithDistance
        .filter(
          (s) =>
            s.id === 'spot-art-park' ||
            s.id === 'spot-kwanak-arboretum' ||
            s.id === 'spot-hakun-park' ||
            s.id === 'spot-samdeok-park' ||
            s.id === 'spot-ssanggaeul' ||
            s.tags.includes('수변산책') ||
            s.tags.includes('숲속') ||
            s.tags.includes('평지')
        )
        .sort((a, b) => a.distanceKm - b.distanceKm);

      return {
        responseText: `오르막 걱정 없이 시원한 바람을 맞으며 달릴 수 있는 **초보자 맞춤 평지 수변길 & 숲속 힐링 명소**입니다! 🌿\n\n하천 전용 자전거도로로 연결되어 자동차 걱정이 없으며, 수목이 울창한 **안양예술공원**과 **서울대학교 관악수목원 입구**는 맑은 계곡물과 그늘이 있어 초보 라이더도 편안하게 즐기실 수 있습니다.`,
        matchedSpots: easyForestSpots.slice(0, 3),
      };
    }

    // 5. 가족 / 아이 / 피크닉 / 잔디 / 공원
    if (q.includes('가족') || q.includes('아이') || q.includes('피크닉') || q.includes('잔디') || q.includes('어린이') || q.includes('공원')) {
      const familySpots = spotsWithDistance
        .filter(
          (s) =>
            s.id === 'spot-central-park' ||
            s.id === 'spot-samdeok-park' ||
            s.id === 'spot-saemul-park' ||
            s.id === 'spot-byeongmokan' ||
            s.tags.includes('분수대') ||
            s.tags.includes('잔디밭') ||
            s.tags.includes('어린이')
        )
        .sort((a, b) => a.distanceKm - b.distanceKm);

      return {
        responseText: `넓은 잔디밭과 벤치, 안전한 광장이 있어 가족, 아이들과 함께 자전거 나들이하기 좋은 **패밀리 피크닉 공원**입니다! 👨‍👩‍👧\n\n**평촌중앙공원**은 넓은 광장과 분수대, 쉼터가 완비되어 있고, **삼덕공원**은 안양천 지류 수암천변에 있어 도심 속 소풍에 안성맞춤입니다.`,
        matchedSpots: familySpots.slice(0, 3),
      };
    }

    // 6. 가까운 / 근처 / 현재 위치 / 주변
    if (q.includes('가까운') || q.includes('근처') || q.includes('현재 위치') || q.includes('주변') || q.includes('가장 가까운')) {
      const nearestSpots = [...spotsWithDistance].sort((a, b) => a.distanceKm - b.distanceKm);

      return {
        responseText: `현재 계신 위치 기준으로 **가장 가깝고 자전거로 빠르게 갈 수 있는 추천 명소**입니다! 📍\n\n가장 가까운 곳은 **${nearestSpots[0].name}**(약 ${nearestSpots[0].distanceKm}km)이며, 자전거로 약 ${Math.max(2, Math.round((nearestSpots[0].distanceKm / 15) * 60))}분이면 도착할 수 있습니다.`,
        matchedSpots: nearestSpots.slice(0, 3),
      };
    }

    // 7. 역사 / 문화 / 정조 / 다리 / 성지
    if (q.includes('역사') || q.includes('문화') || q.includes('정조') || q.includes('다리') || q.includes('성지') || q.includes('순례')) {
      const historySpots = spotsWithDistance
        .filter(
          (s) =>
            s.id === 'spot-manangyo' ||
            s.id === 'spot-surisan-holy-ground' ||
            s.id === 'spot-sammaksa' ||
            s.tags.includes('역사') ||
            s.tags.includes('유적')
        )
        .sort((a, b) => a.distanceKm - b.distanceKm);

      return {
        responseText: `역사의 숨결과 전통의 정취를 느낄 수 있는 **안양의 역사·문화 라이딩 명소**입니다! 🏛️\n\n조선 정조대왕의 능행길을 위해 축조된 조선 후기 대표 석교 **제9경 만안교**와, 울창한 수리산 숲속에 자리한 **제6경 수리산성지**를 추천해 드립니다.`,
        matchedSpots: historySpots.slice(0, 3),
      };
    }

    // 8. 일반 / 키워드 검색 매칭
    const keywords = q.split(' ').filter((w) => w.length >= 2);
    const matched = spotsWithDistance.filter((spot) => {
      const text = `${spot.name} ${spot.dong} ${spot.description} ${spot.aiSummary} ${spot.tags.join(' ')}`.toLowerCase();
      return keywords.some((kw) => text.includes(kw));
    });

    if (matched.length > 0) {
      const sortedMatched = matched.sort((a, b) => a.distanceKm - b.distanceKm);
      return {
        responseText: `요청하신 키워드에 맞춰 **안양시 최적의 라이딩 명소**를 선별했습니다! 🚴\n\n현 위치 기준 거리와 라이딩 환경을 고려해 아래 장소들을 추천해 드려요. 카드에서 상세 정보와 카카오맵 길찾기를 바로 확인하실 수 있습니다.`,
        matchedSpots: sortedMatched.slice(0, 3),
      };
    }

    // 기본 매칭 폴백
    const fallbackSpots = [...spotsWithDistance]
      .sort((a, b) => (a.nineGyeongNumber ?? 999) - (b.nineGyeongNumber ?? 999))
      .slice(0, 3);

    return {
      responseText: `문의해 주신 내용에 맞춰 안양시에서 가장 평점이 높고 자전거 인프라가 우수한 대표 추천 장소들을 안내해 드립니다! 🌟\n\n더 구체적으로 원하시는 분위기(예: "초보자 평지 코스", "노을 예쁜 곳", "분위기 좋은 카페")를 말씀해주시면 더욱 정확히 추천해 드릴게요!`,
      matchedSpots: fallbackSpots,
    };
  };

  // 메시지 전송 핸들러
  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend ?? inputText).trim();
    if (!query) return;

    // 유저 메시지 추가
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // AI 응답 시뮬레이션 (약 400ms 후 부드러운 전환)
    setTimeout(() => {
      const { responseText, matchedSpots } = generateAiResponse(query);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: responseText,
        matchedSpots,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 450);
  };

  // 대화 초기화
  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: `대화가 새로 시작되었습니다! 안양시 25곳 명소와 안양 9경에 대해 무엇이든 편하게 물어보세요. 🚲`,
        timestamp: new Date(),
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex flex-col w-full max-w-lg h-[86vh] max-h-[720px] rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden text-slate-900 animate-in zoom-in-95 duration-200">
        {/* ── 1. Modal Header ── */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-5 py-4 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md shadow-xs text-amber-300">
              <Sparkles size={18} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-black tracking-tight">안양 자전거 AI 추천 챗봇</h2>
                <span className="rounded-full bg-amber-400 text-slate-950 px-1.5 py-0.2 text-[10px] font-black shadow-xs">
                  AI 라이딩 코치
                </span>
              </div>
              <p className="text-[11px] text-blue-100 font-medium">
                요청에 딱 맞는 안양 명소 & 실시간 추천
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleResetChat}
              className="p-1.5 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
              title="대화 다시 시작"
            >
              <RotateCcw size={16} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
              title="닫기"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── 2. Preset Prompt Chips ── */}
        <div className="bg-slate-50 border-b border-slate-100 px-3.5 py-2.5 overflow-x-auto hide-scrollbar shrink-0 flex items-center gap-1.5">
          {PRESET_PROMPTS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(preset.query)}
              className="shrink-0 flex items-center gap-1 rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-bold text-slate-700 hover:border-blue-400 hover:bg-blue-50 hover:text-[#0055FF] active:scale-95 transition-all shadow-2xs"
            >
              <span>{preset.label}</span>
            </button>
          ))}
        </div>

        {/* ── 3. Chat Messages Body ── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xs text-xs font-bold mt-0.5">
                  <Bot size={15} />
                </div>
              )}

              <div
                className={`max-w-[85%] space-y-2.5 ${
                  msg.sender === 'user'
                    ? 'rounded-2xl rounded-tr-xs bg-[#0055FF] px-4 py-2.5 text-white font-semibold text-xs shadow-xs'
                    : 'rounded-2xl rounded-tl-xs bg-white border border-slate-200/90 p-3.5 text-slate-800 text-xs shadow-xs leading-relaxed'
                }`}
              >
                {/* Message Text with simple line breaks & bold formatting */}
                <div className="whitespace-pre-line">
                  {msg.text.split('\n').map((line, lIdx) => (
                    <p key={lIdx} className={lIdx > 0 ? 'mt-1.5' : ''}>
                      {line.split('**').map((chunk, cIdx) =>
                        cIdx % 2 === 1 ? (
                          <strong key={cIdx} className="font-black text-[#0055FF]">
                            {chunk}
                          </strong>
                        ) : (
                          chunk
                        )
                      )}
                    </p>
                  ))}
                </div>

                {/* Attached Recommended Spot Cards */}
                {msg.matchedSpots && msg.matchedSpots.length > 0 && (
                  <div className="pt-1 space-y-2 border-t border-slate-100 mt-2">
                    <div className="flex items-center justify-between text-[11px] font-black text-slate-700">
                      <span className="flex items-center gap-1 text-[#0055FF]">
                        <Compass size={13} />
                        AI 추천 맞춤 장소 ({msg.matchedSpots.length}곳)
                      </span>
                    </div>

                    <div className="space-y-2">
                      {msg.matchedSpots.map((spot) => (
                        <div
                          key={spot.id}
                          className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 hover:border-blue-300 hover:bg-white transition-all shadow-2xs"
                        >
                          <div className="flex gap-2.5 items-center">
                            {/* Image Thumbnail */}
                            <div className="relative h-14 w-14 shrink-0 rounded-lg overflow-hidden bg-slate-200">
                              <img
                                src={spot.imageUrl}
                                alt={spot.name}
                                referrerPolicy="no-referrer"
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src =
                                    'https://www.anyang.go.kr/DATA/tour/17/thumb/t_202302090318183334ECKEZ.png';
                                }}
                              />
                              {spot.nineGyeongNumber && (
                                <span className="absolute top-0.5 left-0.5 rounded-sm bg-amber-500 text-white text-[8px] font-black px-1 py-0.2">
                                  제{spot.nineGyeongNumber}경
                                </span>
                              )}
                            </div>

                            {/* Spot Info */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1 mb-0.5">
                                <span className="text-[10px] font-bold text-blue-600 bg-blue-100/70 px-1 py-0.2 rounded-sm">
                                  {spot.dong}
                                </span>
                                <span className="text-[10px] font-bold text-emerald-600">
                                  약 {spot.distanceKm}km (자전거 약 {Math.max(2, Math.round((spot.distanceKm / 15) * 60))}분)
                                </span>
                              </div>
                              <h4 className="text-xs font-black text-slate-900 truncate">
                                {spot.name}
                              </h4>
                              <p className="text-[11px] text-slate-600 truncate mt-0.5">
                                {spot.aiSummary}
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons inside Card */}
                          <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-end gap-1.5 text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                onFocusOnMap(spot);
                                onClose();
                              }}
                              className="flex items-center gap-1 rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all shadow-2xs"
                            >
                              <MapPin size={12} className="text-[#0055FF]" />
                              <span>지도에서 보기</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                onSelectAttraction(spot);
                              }}
                              className="flex items-center gap-1 rounded-lg bg-[#0055FF] text-white px-2.5 py-1 text-[11px] font-bold shadow-2xs hover:bg-blue-700 active:scale-95 transition-all"
                            >
                              <span>상세 안내</span>
                              <ChevronRight size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-300 text-slate-700 text-xs font-bold mt-0.5">
                  <User size={15} />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-2.5 items-center text-xs text-slate-500 italic">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xs">
                <Bot size={15} />
              </div>
              <div className="rounded-2xl rounded-tl-xs bg-white border border-slate-200 px-3.5 py-2.5 flex items-center gap-1.5 shadow-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce" />
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]" />
                <span className="ml-1 text-[11px] font-medium text-slate-400 not-italic">
                  맞춤 명소와 코스를 분석하고 있습니다...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── 4. Message Input Bar ── */}
        <div className="p-3 border-t border-slate-200 bg-white shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="원하는 라이딩이나 명소를 물어보세요 (예: 주말에 친구랑 갈 만한 곳)"
              className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#0055FF] focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition-all"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#0055FF] text-white shadow-md disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none hover:bg-blue-600 active:scale-95 transition-all"
              aria-label="메시지 전송"
            >
              <Send size={16} />
            </button>
          </form>
          <p className="mt-1 text-[10px] text-center text-slate-400">
            안양시 공식 문화관광 데이터 기반으로 실시간 최적 명소를 추천합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
