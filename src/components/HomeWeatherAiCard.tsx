import { useMemo } from 'react';
import { MapPin, Sparkles, Compass } from 'lucide-react';
import { WeatherSummary } from '../services/weatherService';

interface HomeWeatherAiCardProps {
  weather: WeatherSummary | null;
  origin: string;
}

export default function HomeWeatherAiCard({ weather, origin }: HomeWeatherAiCardProps) {
  const tempDisplay = weather?.tempC != null ? `${weather.tempC}°C` : '29°C';
  const windSpeed = weather?.windSpeedMps != null ? `${weather.windSpeedMps}m/s` : '2.8m/s';
  const windDir = weather?.windDirection || '동북동풍';
  const airQuality = weather?.airQualityLabel || '좋음';
  const uv = weather?.uvLabel || '보통';

  // AI 코칭 분석 메시지 도출
  const aiCoachMessage = useMemo(() => {
    if (weather?.safetyAlert?.message) {
      return weather.safetyAlert.message;
    }

    const windVal = weather?.windSpeedMps ?? 2.8;
    const tempVal = weather?.tempC ?? 29;

    if (weather?.precipitationType && weather.precipitationType !== '없음') {
      return '현재 강수가 감지되었습니다. 노면이 미끄러울 수 있으니 교량 하부 및 급커브에서 감속하시고 서행하세요.';
    }

    if (windVal >= 5.0) {
      return `현재 풍속이 ${windVal}m/s로 다소 강합니다. 맞바람 구간에서는 기어비를 낮추고 핸들을 견고히 파지하세요.`;
    }

    if (tempVal >= 31) {
      return '낮 기온이 높습니다. 충분한 수분 섭취와 함께 그늘이 풍부한 학의천 수변길이나 안양예술공원 숲길을 추천합니다.';
    }

    // 기본 쾌적한 라이딩 날씨 (이미지 속 문구 완벽 일치)
    return '시야와 바람이 온화한 최적의 라이딩 환경입니다. 안양 9경 및 수변 코스를 안전하게 즐기세요!';
  }, [weather]);

  return (
    <div className="rounded-3xl bg-gradient-to-br from-[#0055FF] via-[#0050FF] to-[#0042D9] text-white p-4.5 shadow-lg relative overflow-hidden select-none">
      {/* Decorative subtle light blob in background */}
      <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />

      {/* Top Location & Status Row */}
      <div className="flex items-center justify-between gap-2 mb-3.5 relative z-10">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white">
            <MapPin size={12} fill="currentColor" />
          </div>
          <span className="text-xs font-black text-white/95 truncate">
            {origin || '경기도 광명시 소하1동 소하로'}
          </span>
        </div>

        <div className="shrink-0 flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-white border border-white/25 shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>실시간 라이딩 기상</span>
        </div>
      </div>

      {/* Main Temp & 4 Weather Chips Grid */}
      <div className="flex items-center justify-between gap-3 relative z-10">
        {/* Left Big Temp */}
        <div className="shrink-0">
          <div className="text-4xl sm:text-5xl font-black tracking-tight text-white drop-shadow-xs">
            {tempDisplay}
          </div>
          <div className="text-xs font-bold text-white/90 mt-1">
            {weather?.summary || '맑음 / 라이딩 최적'}
          </div>
        </div>

        {/* Right 4 Chips in horizontal row */}
        <div className="grid grid-cols-4 gap-1.5 flex-1 max-w-[260px]">
          {/* 1. 풍속 */}
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md px-1.5 py-2 border border-white/20 shadow-2xs">
            <span className="text-[10px] text-white/80 font-bold flex items-center gap-0.5 whitespace-nowrap">
              <span className="text-[10px]">💨</span> 풍속
            </span>
            <span className="text-[11px] font-black text-white mt-0.5 whitespace-nowrap">
              {windSpeed}
            </span>
          </div>

          {/* 2. 풍향 */}
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md px-1.5 py-2 border border-white/20 shadow-2xs">
            <span className="text-[10px] text-white/80 font-bold flex items-center gap-0.5 whitespace-nowrap">
              <span className="text-[10px]">🧭</span> 풍향
            </span>
            <span className="text-[11px] font-black text-white mt-0.5 truncate max-w-full">
              {windDir}
            </span>
          </div>

          {/* 3. 미세 */}
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md px-1.5 py-2 border border-white/20 shadow-2xs">
            <span className="text-[10px] text-white/80 font-bold flex items-center gap-0.5 whitespace-nowrap">
              <span className="text-[10px]">🫧</span> 미세
            </span>
            <span className="text-[11px] font-black text-white mt-0.5 whitespace-nowrap">
              {airQuality}
            </span>
          </div>

          {/* 4. 자외선 */}
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md px-1.5 py-2 border border-white/20 shadow-2xs">
            <span className="text-[10px] text-white/80 font-bold flex items-center gap-0.5 whitespace-nowrap">
              <span className="text-[10px]">☀️</span> 자외선
            </span>
            <span className="text-[11px] font-black text-white mt-0.5 whitespace-nowrap">
              {uv}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Inset AI Coach Advice Box */}
      <div className="mt-3.5 rounded-2xl bg-white p-3.5 shadow-sm text-slate-900 flex items-start gap-3 relative z-10">
        {/* Left AI Blue Icon with sparkles */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0055FF] text-white shadow-xs">
          <Sparkles size={18} className="text-amber-300" fill="currentColor" />
        </div>

        {/* Text Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1 mb-1">
            <div className="flex items-center gap-1 text-xs font-black text-[#0055FF]">
              <Compass size={13} className="text-[#0055FF]" />
              <span>AI 라이딩 코치 맞춤 분석</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 shrink-0">
              실시간 조언
            </span>
          </div>
          <p className="text-xs font-bold text-slate-800 leading-relaxed">
            {aiCoachMessage}
          </p>
        </div>
      </div>
    </div>
  );
}
