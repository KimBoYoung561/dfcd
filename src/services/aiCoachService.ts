import { WeatherSummary } from './weatherService';

export interface AiCoachAnalysis {
  badgeTitle: string;
  badgeColor: string;
  coachMessage: string;
}

/**
 * 실시간 기상 관측 데이터(기온, 풍속, 풍향, 습도, 강수 등)를 바탕으로
 * 자전거 타기에 적합한지 1~2줄로 명확하고 간결하게 안내합니다.
 */
export function getAiRidingCoachAnalysis(
  weather: WeatherSummary | null,
  currentDate = new Date()
): AiCoachAnalysis {
  const currentHour = currentDate.getHours();
  const isNight = currentHour >= 19 || currentHour < 6;

  const temp = weather?.tempC ?? weather?.temperatureC ?? 25.4;
  const wind = weather?.windSpeedMps ?? 3.1;
  const humid = weather?.humidity ?? 40;
  const pty = weather?.precipitationType || '없음';
  const ptyMm = weather?.precipitationMm ?? 0;
  const isRaining = (pty === '비' || pty === '비/눈' || pty === '눈' || pty === '소나기') || ptyMm > 0;

  // 1. 강수 / 비 / 눈 감지
  if (isRaining) {
    return {
      badgeTitle: '라이딩 비권장',
      badgeColor: 'text-rose-700 bg-rose-50 border-rose-200',
      coachMessage: '현재 비가 내려 노면이 많이 미끄러워요. 낙차 위험이 크니 오늘은 자전거를 쉬는 것을 추천해요.',
    };
  }

  // 2. 높은 습도나 흐림으로 비 가능성 있는 경우 (습도 85% 이상)
  if (humid >= 85) {
    return {
      badgeTitle: '짧은 코스 권장',
      badgeColor: 'text-amber-700 bg-amber-50 border-amber-200',
      coachMessage: '공기가 많이 습하고 비가 올 수 있으니, 멀리 가지 마시고 가까운 수변 코스로 가볍게 다녀오세요.',
    };
  }

  // 3. 강풍 (풍속 7.0m/s 이상)
  if (wind >= 7.0) {
    return {
      badgeTitle: '강풍 주의',
      badgeColor: 'text-amber-700 bg-amber-50 border-amber-200',
      coachMessage: `바람이 ${wind.toFixed(1)}m/s로 강하게 불어 핸들이 흔들릴 수 있어요. 무리하지 마시고 가볍게 동네 위주로 타세요.`,
    };
  }

  // 4. 폭염 (기온 32℃ 이상)
  if (temp >= 32.0) {
    return {
      badgeTitle: '더위 주의',
      badgeColor: 'text-red-700 bg-red-50 border-red-200',
      coachMessage: '햇볕이 뜨겁고 많이 더워요. 시원한 물 챙기시고 그늘진 코스로 짧게만 다녀오세요.',
    };
  }

  // 5. 한파 / 결빙 (기온 2℃ 이하)
  if (temp <= 2.0) {
    return {
      badgeTitle: '결빙 주의',
      badgeColor: 'text-cyan-700 bg-cyan-50 border-cyan-200',
      coachMessage: '기온이 낮아 그늘진 교량 밑에 살얼음이 있을 수 있어요. 미끄러우니 무리한 주행은 피하세요.',
    };
  }

  // 6. 다소 바람 부는 날 (풍속 4.5 ~ 6.9m/s)
  if (wind >= 4.5) {
    return {
      badgeTitle: '가벼운 라이딩',
      badgeColor: 'text-indigo-700 bg-indigo-50 border-indigo-200',
      coachMessage: '바람이 다소 부는 편이지만 타기엔 괜찮아요. 맞바람 구간만 무리하지 마시고 가볍게 즐겨보세요.',
    };
  }

  // 7. 야간 시간대 (19시 ~ 06시)
  if (isNight) {
    return {
      badgeTitle: '야간 안전 라이딩',
      badgeColor: 'text-purple-700 bg-purple-50 border-purple-200',
      coachMessage: '선선해서 달리기 좋지만 어두우니 전조등·후미등 꼭 켜시고, 산책하는 분들 조심하며 다녀오세요.',
    };
  }

  // 8. 쌀쌀한 날씨 (기온 3 ~ 11℃)
  if (temp < 12.0) {
    return {
      badgeTitle: '보온 겉옷 추천',
      badgeColor: 'text-sky-700 bg-sky-50 border-sky-200',
      coachMessage: '달릴 때 주행풍 때문에 쌀쌀할 수 있어요. 바람막이나 장갑 챙겨서 가볍게 순항하고 오세요.',
    };
  }

  // 9. 선선함 (기온 12 ~ 17℃)
  if (temp < 18.0) {
    return {
      badgeTitle: '라이딩 적합',
      badgeColor: 'text-teal-700 bg-teal-50 border-teal-200',
      coachMessage: '선선해서 땀 흘리지 않고 타기 딱 좋아요! 가벼운 겉옷 하나 입고 안양천 나들이 다녀오세요.',
    };
  }

  // 10. 최적의 날씨 (기온 18 ~ 31℃, 풍속 잔잔) - 현재 기상청 데이터(25.4℃, 3.1m/s) 완벽 부합
  return {
    badgeTitle: '자전거 타기 최적',
    badgeColor: 'text-blue-700 bg-blue-50 border-blue-200',
    coachMessage: '바람도 잔잔하고 기온도 쾌적해 지금 자전거 타기 딱 좋은 날씨예요! 안양천 수변길 산뜻하게 다녀오세요.',
  };
}

