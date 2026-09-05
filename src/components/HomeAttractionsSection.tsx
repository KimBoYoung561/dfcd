import { useState, useMemo } from 'react';
import { Search, X, ChevronRight, ArrowUpDown, Sparkles } from 'lucide-react';
import { AnyangTourSpot, ANYANG_TOUR_SPOTS } from '../data/anyangAttractions';

interface HomeAttractionsSectionProps {
  riderPosition: { lat: number; lng: number } | null;
  onSelectAttraction: (spot: AnyangTourSpot) => void;
}

type CategoryTab = 'all' | 'nineGyeong' | 'anyang' | 'pyeongchon' | 'seoksu' | 'bisan' | 'nearby';
type SortMode = 'nineGyeong' | 'distance' | 'weather' | 'name';

// 두 좌표 간 거리 계산 (km)
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // 지구 반지름 (km)
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

export default function HomeAttractionsSection({
  riderPosition,
  onSelectAttraction,
}: HomeAttractionsSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryTab>('all');
  const [sortMode, setSortMode] = useState<SortMode>('nineGyeong');

  // 카테고리별 개수 산출
  const categoryCounts = useMemo(() => {
    return {
      all: ANYANG_TOUR_SPOTS.length,
      nineGyeong: ANYANG_TOUR_SPOTS.filter((s) => s.nineGyeongNumber != null).length,
      anyang: ANYANG_TOUR_SPOTS.filter((s) => s.regionKey === 'anyang').length,
      pyeongchon: ANYANG_TOUR_SPOTS.filter((s) => s.regionKey === 'pyeongchon').length,
      seoksu: ANYANG_TOUR_SPOTS.filter((s) => s.regionKey === 'seoksu').length,
      bisan: ANYANG_TOUR_SPOTS.filter((s) => s.regionKey === 'bisan').length,
      nearby: ANYANG_TOUR_SPOTS.filter((s) => s.regionKey === 'nearby').length,
    };
  }, []);

  // 필터 및 정렬
  const filteredSpots = useMemo(() => {
    const userLat = riderPosition?.lat ?? 37.3943;
    const userLng = riderPosition?.lng ?? 126.9568;

    return ANYANG_TOUR_SPOTS.filter((spot) => {
      // 1. 카테고리 필터
      if (selectedCategory === 'nineGyeong' && spot.nineGyeongNumber == null) return false;
      if (selectedCategory === 'anyang' && spot.regionKey !== 'anyang') return false;
      if (selectedCategory === 'pyeongchon' && spot.regionKey !== 'pyeongchon') return false;
      if (selectedCategory === 'seoksu' && spot.regionKey !== 'seoksu') return false;
      if (selectedCategory === 'bisan' && spot.regionKey !== 'bisan') return false;
      if (selectedCategory === 'nearby' && spot.regionKey !== 'nearby') return false;

      // 2. 검색어 필터
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = spot.name.toLowerCase().includes(q);
        const matchDong = spot.dong.toLowerCase().includes(q);
        const matchDesc = spot.description.toLowerCase().includes(q);
        const matchTags = spot.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchName && !matchDong && !matchDesc && !matchTags) return false;
      }

      return true;
    }).map((spot) => {
      const dist = getDistanceKm(userLat, userLng, spot.lat, spot.lng);
      return {
        ...spot,
        distanceKm: dist,
      };
    }).sort((a, b) => {
      if (sortMode === 'nineGyeong') {
        // 9경 우선 정렬 (1경~9경, 없는 것은 뒤로)
        const numA = a.nineGyeongNumber ?? 999;
        const numB = b.nineGyeongNumber ?? 999;
        if (numA !== numB) return numA - numB;
        return a.distanceKm - b.distanceKm;
      }
      if (sortMode === 'distance') {
        return a.distanceKm - b.distanceKm;
      }
      if (sortMode === 'weather') {
        // 날씨 맞춤 추천 가중치 (수변/숲길/공원 우선)
        const isOutdoorA = a.tags.includes('삼성천') || a.tags.includes('학의천') || a.tags.includes('안양천');
        const isOutdoorB = b.tags.includes('삼성천') || b.tags.includes('학의천') || b.tags.includes('안양천');
        if (isOutdoorA && !isOutdoorB) return -1;
        if (!isOutdoorA && isOutdoorB) return 1;
        return a.distanceKm - b.distanceKm;
      }
      if (sortMode === 'name') {
        return a.name.localeCompare(b.name, 'ko');
      }
      return 0;
    });
  }, [riderPosition, selectedCategory, searchQuery, sortMode]);

  // 정렬 모드 설명 문구
  const sortDescription = useMemo(() => {
    switch (sortMode) {
      case 'nineGyeong':
        return '제1경 ~ 제9경 순서';
      case 'distance':
        return '현재 위치 기준 가까운 순';
      case 'weather':
        return '오늘 날씨 맞춤 쾌적 코스';
      case 'name':
        return '가나다 이름 순서';
    }
  }, [sortMode]);

  return (
    <div className="space-y-3 pt-1 select-none text-slate-900">
      {/* ── 1. Search Bar ── */}
      <div className="relative flex items-center rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-2xs focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
        <Search size={16} className="text-slate-400 shrink-0 mr-2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="명소 또는 동 검색 (예: 안양예술공원, 만안교)"
          className="w-full text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-hidden bg-transparent"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
            title="검색어 지우기"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* ── 2. Horizontal Scrollable Category Filter Chips ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-1 text-xs">
        {/* 전체 */}
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`shrink-0 flex items-center gap-1 rounded-2xl px-3 py-1.5 transition-all ${
            selectedCategory === 'all'
              ? 'bg-[#0055FF] text-white font-black shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 font-bold hover:bg-slate-50'
          }`}
        >
          <span>🧭 전체</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
              selectedCategory === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {categoryCounts.all}
          </span>
        </button>

        {/* 안양 9경 */}
        <button
          type="button"
          onClick={() => setSelectedCategory('nineGyeong')}
          className={`shrink-0 flex items-center gap-1 rounded-2xl px-3 py-1.5 transition-all ${
            selectedCategory === 'nineGyeong'
              ? 'bg-[#0055FF] text-white font-black shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 font-bold hover:bg-slate-50'
          }`}
        >
          <span>🏆 안양 9경</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
              selectedCategory === 'nineGyeong'
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {categoryCounts.nineGyeong}
          </span>
        </button>

        {/* 안양동 */}
        <button
          type="button"
          onClick={() => setSelectedCategory('anyang')}
          className={`shrink-0 flex items-center gap-1 rounded-2xl px-3 py-1.5 transition-all ${
            selectedCategory === 'anyang'
              ? 'bg-[#0055FF] text-white font-black shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 font-bold hover:bg-slate-50'
          }`}
        >
          <span>🏛️ 안양동</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
              selectedCategory === 'anyang' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {categoryCounts.anyang}
          </span>
        </button>

        {/* 평촌/호계 */}
        <button
          type="button"
          onClick={() => setSelectedCategory('pyeongchon')}
          className={`shrink-0 flex items-center gap-1 rounded-2xl px-3 py-1.5 transition-all ${
            selectedCategory === 'pyeongchon'
              ? 'bg-[#0055FF] text-white font-black shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 font-bold hover:bg-slate-50'
          }`}
        >
          <span>🏢 평촌/호계</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
              selectedCategory === 'pyeongchon'
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {categoryCounts.pyeongchon}
          </span>
        </button>

        {/* 석수/박달 */}
        <button
          type="button"
          onClick={() => setSelectedCategory('seoksu')}
          className={`shrink-0 flex items-center gap-1 rounded-2xl px-3 py-1.5 transition-all ${
            selectedCategory === 'seoksu'
              ? 'bg-[#0055FF] text-white font-black shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 font-bold hover:bg-slate-50'
          }`}
        >
          <span>🌳 석수/박달</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
              selectedCategory === 'seoksu' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {categoryCounts.seoksu}
          </span>
        </button>

        {/* 비산/관양 */}
        <button
          type="button"
          onClick={() => setSelectedCategory('bisan')}
          className={`shrink-0 flex items-center gap-1 rounded-2xl px-3 py-1.5 transition-all ${
            selectedCategory === 'bisan'
              ? 'bg-[#0055FF] text-white font-black shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 font-bold hover:bg-slate-50'
          }`}
        >
          <span>🚴 비산/관양</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
              selectedCategory === 'bisan' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {categoryCounts.bisan}
          </span>
        </button>

        {/* 인근 수변 */}
        <button
          type="button"
          onClick={() => setSelectedCategory('nearby')}
          className={`shrink-0 flex items-center gap-1 rounded-2xl px-3 py-1.5 transition-all ${
            selectedCategory === 'nearby'
              ? 'bg-[#0055FF] text-white font-black shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 font-bold hover:bg-slate-50'
          }`}
        >
          <span>🏞️ 인근 수변</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
              selectedCategory === 'nearby' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {categoryCounts.nearby}
          </span>
        </button>
      </div>

      {/* ── 3. Search & Sort Criteria Container (탐색 정렬 기준 박스) ── */}
      <div className="rounded-2xl bg-blue-50/50 border border-blue-100/80 p-2.5 space-y-2">
        <div className="flex items-center justify-between px-1 text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1">
            <ArrowUpDown size={12} className="text-[#0055FF]" />
            탐색 정렬 기준
          </span>
          <span className="text-[11px] font-medium text-slate-500">
            {sortDescription}
          </span>
        </div>

        {/* 4 Sort Option Buttons */}
        <div className="grid grid-cols-4 gap-1.5 text-xs">
          {/* 1. 안양 9경 */}
          <button
            type="button"
            onClick={() => setSortMode('nineGyeong')}
            className={`flex items-center justify-center gap-1 rounded-xl py-2 px-1 text-center transition-all ${
              sortMode === 'nineGyeong'
                ? 'bg-white text-[#0055FF] shadow-xs border border-blue-200 font-black'
                : 'bg-transparent text-slate-600 hover:bg-white/60 font-bold'
            }`}
          >
            <span>🏆</span>
            <span className="text-[11px] truncate">안양 9경</span>
          </button>

          {/* 2. 가까운 거리 */}
          <button
            type="button"
            onClick={() => setSortMode('distance')}
            className={`flex items-center justify-center gap-1 rounded-xl py-2 px-1 text-center transition-all ${
              sortMode === 'distance'
                ? 'bg-white text-[#0055FF] shadow-xs border border-blue-200 font-black'
                : 'bg-transparent text-slate-600 hover:bg-white/60 font-bold'
            }`}
          >
            <span>📍</span>
            <span className="text-[11px] truncate">가까운 거리</span>
          </button>

          {/* 3. 오늘 날씨 맞춤 */}
          <button
            type="button"
            onClick={() => setSortMode('weather')}
            className={`flex items-center justify-center gap-1 rounded-xl py-2 px-1 text-center transition-all ${
              sortMode === 'weather'
                ? 'bg-white text-[#0055FF] shadow-xs border border-blue-200 font-black'
                : 'bg-transparent text-slate-600 hover:bg-white/60 font-bold'
            }`}
          >
            <span>🌤️</span>
            <span className="text-[11px] truncate">오늘 날씨 맞춤</span>
          </button>

          {/* 4. 이름 */}
          <button
            type="button"
            onClick={() => setSortMode('name')}
            className={`flex items-center justify-center gap-1 rounded-xl py-2 px-1 text-center transition-all ${
              sortMode === 'name'
                ? 'bg-white text-[#0055FF] shadow-xs border border-blue-200 font-black'
                : 'bg-transparent text-slate-600 hover:bg-white/60 font-bold'
            }`}
          >
            <span>🔤</span>
            <span className="text-[11px] truncate">이름</span>
          </button>
        </div>
      </div>

      {/* ── 4. Section Header (추천 라이딩 명소 헤더) ── */}
      <div className="flex items-center justify-between px-0.5 pt-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black text-slate-900">추천 라이딩 명소</span>
          <span className="rounded-full bg-slate-200/80 px-2 py-0.2 text-[10px] font-black text-slate-700">
            {filteredSpots.length}곳
          </span>
        </div>
        <span className="text-[11px] font-medium text-slate-400">
          카드 터치 시 상세 가이드
        </span>
      </div>

      {/* ── 5. Attraction Cards List ── */}
      <div className="space-y-2">
        {filteredSpots.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-400">
            <p className="text-sm font-bold">검색 결과가 없습니다.</p>
            <p className="text-xs mt-1">다른 검색어나 카테고리를 선택해 보세요.</p>
          </div>
        ) : (
          filteredSpots.map((spot) => (
            <div
              key={spot.id}
              onClick={() => onSelectAttraction(spot)}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-2xs hover:border-blue-300 hover:shadow-xs active:scale-[0.99] transition-all cursor-pointer group"
            >
              {/* Thumbnail Image */}
              <div className="relative shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-slate-100">
                <img
                  src={spot.imageUrl}
                  alt={spot.name}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = 'https://www.anyang.go.kr/DATA/tour/17/thumb/t_202302090318183334ECKEZ.png';
                  }}
                />
                {spot.nineGyeongNumber && (
                  <span className="absolute top-0.5 left-0.5 rounded-md bg-amber-500 text-white text-[9px] font-black px-1 py-0.2 shadow-2xs">
                    제{spot.nineGyeongNumber}경
                  </span>
                )}
                {/* 이미지 우측 하단 출처 표기 */}
                <span className="absolute bottom-0 right-0 rounded-tl-md bg-black/75 backdrop-blur-xs text-[7.5px] text-white font-medium px-1.5 py-0.5 leading-none select-none">
                  출처: 안양시
                </span>
              </div>

              {/* Spot Information */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded-md">
                    {spot.dong}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    약 {spot.distanceKm}km
                  </span>
                </div>

                <div className="text-xs font-black text-slate-900 truncate group-hover:text-[#0055FF] transition-colors">
                  {spot.name}
                </div>

                <p className="text-[11px] text-slate-600 font-medium truncate mt-0.5">
                  {spot.aiSummary}
                </p>

                {/* Tags */}
                <div className="flex items-center gap-1 mt-1.5 overflow-hidden">
                  {spot.tags.slice(0, 3).map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded-sm truncate"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right Arrow */}
              <div className="shrink-0 text-slate-400 group-hover:text-[#0055FF] group-hover:translate-x-0.5 transition-all">
                <ChevronRight size={16} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
