import { useMemo } from 'react';
import { MapPin, Sparkles, Compass, RotateCw } from 'lucide-react';
import { WeatherSummary } from '../services/weatherService';
import { getAiRidingCoachAnalysis } from '../services/aiCoachService';

interface HomeWeatherAiCardProps {
  weather: WeatherSummary | null;
  origin: string;
  onRefreshWeather?: () => void;
  isRefreshingWeather?: boolean;
}

export default function HomeWeatherAiCard({
  weather,
  origin,
  onRefreshWeather,
  isRefreshingWeather = false,
}: HomeWeatherAiCardProps) {
  const tempVal = weather?.tempC ?? weather?.temperatureC ?? 25.4;
  const tempDisplay = typeof tempVal === 'number' ? `${tempVal.toFixed(1)}°C` : '25.4°C';
  const windVal = weather?.windSpeedMps ?? 3.1;
  const windSpeed = typeof windVal === 'number' ? `${windVal.toFixed(1)}m/s` : '3.1m/s';
  const windDir = weather?.windDirection || '북동풍';
  const humidity = weather?.humidity != null ? `${weather.humidity}%` : '40%';
  const airQuality = weather?.airQualityLabel || '좋음';
  const uv = weather?.uvLabel || '보통';

  // 실시간 기상 관측 데이터 기반 종합 AI 라이딩 코칭 분석 도출
  const analysis = useMemo(() => {
    return getAiRidingCoachAnalysis(weather);
  }, [weather]);

  return (
    <div className="rounded-3xl bg-gradient-to-br from-[#0055FF] via-[#0050FF] to-[#0042D9] text-white p-4 sm:p-5 shadow-lg relative overflow-hidden select-none">
      {/* Decorative subtle light blob in background */}
      <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />

      {/* Top Location & Status Row */}
      <div className="flex items-center justify-between gap-2 mb-3 relative z-10">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white">
            <MapPin size={12} fill="currentColor" />
          </div>
          <span className="text-xs font-black text-white/95 truncate">
            {origin || '경기도 안양시 동안구 비산동'}
          </span>
        </div>

        <div className="shrink-0 flex items-center gap-1.5">
          <button
            type="button"
            onClick={onRefreshWeather}
            disabled={isRefreshingWeather}
            className="flex items-center gap-1.5 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 transition-all backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-white border border-white/25 shadow-2xs cursor-pointer disabled:opacity-75"
            title="기상청 실시간 날씨 새로고침 (클릭)"
            aria-label="기상청 실시간 날씨 새로고침"
          >
            <RotateCw size={11} className={isRefreshingWeather ? 'animate-spin' : ''} />
            <span>{isRefreshingWeather ? '갱신 중...' : (weather?.isLive ? '기상청 실시간' : '기상청 기상정보')}</span>
            {weather?.observedAt && !isRefreshingWeather && (
              <span className="text-[10px] text-white/80 font-mono font-normal">
                {weather.observedAt.replace(/.*(\d{2}:\d{2}).*/, '$1')}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Middle Hero: Large Temperature & Condition Headline */}
      <div className="flex items-center justify-between gap-3 relative z-10">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black tracking-tight text-white drop-shadow-xs">
              {tempDisplay}
            </span>
            <span className="text-base sm:text-lg font-bold text-white/95">
              {weather?.skyStatus || '맑음'}
            </span>
          </div>
          <div className="text-xs font-semibold text-white/85 mt-1 flex items-center gap-1.5 flex-wrap">
            <span>{weather?.summary || '라이딩 최적 날씨'}</span>
            <span className="text-white/40">·</span>
            <span className="inline-flex items-center gap-0.5 text-white/95 font-medium">
              <span>🫧</span> 대기질 {airQuality}
            </span>
          </div>
        </div>

        {/* Cycling condition icon/badge */}
        <div className="shrink-0 text-right">
          <div className="inline-flex flex-col items-end">
            <span className="text-3xl sm:text-4xl select-none filter drop-shadow-sm">
              {(weather?.precipitationType === '비' || weather?.precipitationType === '소나기' || (weather?.precipitationMm && weather.precipitationMm > 0))
                ? '🌧️'
                : (tempVal >= 30 ? '☀️' : (windVal >= 6 ? '💨' : '🚴'))}
            </span>
            <span className="text-[10px] font-extrabold text-white/95 bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full mt-1 border border-white/25 shadow-2xs whitespace-nowrap">
              라이딩 {weather?.cyclingStatus || '쾌적'}
            </span>
          </div>
        </div>
      </div>

      {/* 4 Weather Detail Chips (풍속, 풍향, 습도, 자외선) - Full width spacious grid */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mt-3.5 relative z-10">
        {/* 1. 풍속 */}
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md px-1.5 sm:px-2 py-2 border border-white/20 shadow-2xs min-w-0">
          <span className="text-[10px] text-white/80 font-bold flex items-center gap-0.5 whitespace-nowrap">
            <span>💨</span>
            <span>풍속</span>
          </span>
          <span className="text-xs sm:text-sm font-black text-white mt-1 whitespace-nowrap tracking-tight">
            {windSpeed}
          </span>
        </div>

        {/* 2. 풍향 */}
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md px-1.5 sm:px-2 py-2 border border-white/20 shadow-2xs min-w-0">
          <span className="text-[10px] text-white/80 font-bold flex items-center gap-0.5 whitespace-nowrap">
            <span>🧭</span>
            <span>풍향</span>
          </span>
          <span className="text-xs sm:text-sm font-black text-white mt-1 whitespace-nowrap tracking-tight truncate max-w-full">
            {windDir}
          </span>
        </div>

        {/* 3. 습도 */}
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md px-1.5 sm:px-2 py-2 border border-white/20 shadow-2xs min-w-0">
          <span className="text-[10px] text-white/80 font-bold flex items-center gap-0.5 whitespace-nowrap">
            <span>💧</span>
            <span>습도</span>
          </span>
          <span className="text-xs sm:text-sm font-black text-white mt-1 whitespace-nowrap tracking-tight">
            {humidity}
          </span>
        </div>

        {/* 4. 자외선 */}
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md px-1.5 sm:px-2 py-2 border border-white/20 shadow-2xs min-w-0">
          <span className="text-[10px] text-white/80 font-bold flex items-center gap-0.5 whitespace-nowrap">
            <span>☀️</span>
            <span>자외선</span>
          </span>
          <span className="text-xs sm:text-sm font-black text-white mt-1 whitespace-nowrap tracking-tight">
            {uv}
          </span>
        </div>
      </div>

      {/* Bottom Inset AI Coach Advice Box (간결한 1~2줄 코칭) */}
      <div className="mt-3 rounded-2xl bg-white p-3 sm:p-3.5 shadow-sm text-slate-900 relative z-10 flex items-center gap-2.5 sm:gap-3 border border-slate-100/90">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#0055FF] text-white shadow-2xs">
          <Sparkles size={15} className="text-amber-300" fill="currentColor" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-xs font-black text-[#0055FF]">
              AI 코치
            </span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black border ${analysis.badgeColor} shrink-0`}>
              {analysis.badgeTitle}
            </span>
          </div>
          <p className="text-xs font-bold text-slate-800 leading-snug">
            {analysis.coachMessage}
          </p>
        </div>
      </div>
    </div>
  );
}

