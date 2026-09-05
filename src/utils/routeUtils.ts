import { LatLng, NavStep, Course, Facility, FilterCategory, RouteType } from '../types';
import { calculateAnyangDenseRoadRoute, calculateRoadTypeBreakdown, interpolateDenseRoadPath } from '../services/routerService';
import { ANYANG_CROSSWALKS } from '../data/crosswalkData';

export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
  return Math.round(R * c * 100) / 100;
}

export function getCurrentTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function getCalculatedArrivalTime(timeMinutes: number, curTimeString?: string): string {
  const now = new Date();
  if (curTimeString && curTimeString.includes(':')) {
    const [h, m] = curTimeString.split(':').map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      now.setHours(h, m, 0, 0);
    }
  }
  const arrivalDate = new Date(now.getTime() + timeMinutes * 60 * 1000);
  const hours = String(arrivalDate.getHours()).padStart(2, '0');
  const minutes = String(arrivalDate.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Creates optimal bicycle route directly to a selected facility
 */
export function createFacilityOptimalRoute(
  startCoords: LatLng,
  originName: string,
  fac: Facility
): Course {
  const destCoords: LatLng = { lat: fac.lat, lng: fac.lng };
  const routeResult = calculateAnyangDenseRoadRoute(startCoords, destCoords, originName, fac.name, '단거리');
  const curTime = getCurrentTimeString();

  return {
    id: `fac-route-${fac.id}-${Date.now()}`,
    tag: '단거리',
    name: `${fac.name} 편의시설 경로`,
    distance: `${routeResult.distanceKm}km`,
    distanceKm: routeResult.distanceKm,
    time: `${routeResult.timeMinutes}분`,
    timeMinutes: routeResult.timeMinutes,
    type: '편의시설 연결로',
    arrival: getCalculatedArrivalTime(routeResult.timeMinutes, curTime),
    bikePath: routeResult.dedicatedBikeRatio,
    road: routeResult.sharedBikeRatio,
    sidewalk: routeResult.sidewalkRatio,
    dedicatedBikeRatio: routeResult.dedicatedBikeRatio,
    sharedBikeRatio: routeResult.sharedBikeRatio,
    sidewalkRatio: routeResult.sidewalkRatio,
    riverPathRatio: routeResult.riverPathRatio,
    segregatedRatio: routeResult.segregatedRatio,
    unsegregatedRatio: routeResult.unsegregatedRatio,
    stairs: 0,
    overpass: 0,
    slope: '평탄 (경사도 1.2%)',
    slopeLevel: '평탄',
    calories: routeResult.calories,
    description: `${fac.name} (${fac.categoryName})까지 안양시 자전거 안전도로를 통해 최적화된 경로입니다.`,
    startPoint: originName || '내 위치',
    endPoint: fac.name,
    path: routeResult.path,
    elevationProfile: [28, 29, 30, 29, 28, 28, 29, 30],
    navSteps: routeResult.navSteps,
  };
}

/**
 * Creates point-to-point custom optimal route
 */
export function createCustomOptimalRoute(
  originName: string,
  startCoords: LatLng,
  destName: string,
  destCoords: LatLng,
  routeType: RouteType = 'oneway',
  preferredFilter: FilterCategory = '추천 코스'
): Course {
  const routeResult = calculateAnyangDenseRoadRoute(startCoords, destCoords, originName, destName, preferredFilter);
  const curTime = getCurrentTimeString();
  
  let finalPath = routeResult.path;
  let finalDistanceKm = routeResult.distanceKm;
  let finalTimeMinutes = routeResult.timeMinutes;
  let finalCalories = routeResult.calories;
  let finalNavSteps = [...routeResult.navSteps];

  if (routeType === 'roundtrip') {
    const returnPath = [...routeResult.path].reverse().slice(1);
    finalPath = [...routeResult.path, ...returnPath];
    finalDistanceKm = Math.round(routeResult.distanceKm * 2 * 10) / 10;
    finalTimeMinutes = Math.round(routeResult.timeMinutes * 1.95);
    finalCalories = Math.round(routeResult.calories * 2);
    finalNavSteps.push({
      id: 'step-roundtrip-return',
      iconType: 'u-turn',
      text: `${destName} 회차 후 ${originName} 복귀`,
      sub: '왕복 코스 안전 복귀 주행',
      distanceMeter: Math.round(routeResult.distanceKm * 1000),
      instruction: `${destName}에서 안전하게 회차하여 ${originName} 방면으로 복귀 주행하세요.`,
    });
  }

  return {
    id: `custom-route-${Date.now()}`,
    tag: preferredFilter,
    name: routeType === 'roundtrip' ? `${originName} ↔ ${destName} 왕복` : `${originName} → ${destName}`,
    distance: `${finalDistanceKm}km`,
    distanceKm: finalDistanceKm,
    time: `${finalTimeMinutes}분`,
    timeMinutes: finalTimeMinutes,
    type: preferredFilter,
    arrival: getCalculatedArrivalTime(finalTimeMinutes, curTime),
    bikePath: routeResult.dedicatedBikeRatio,
    road: routeResult.sharedBikeRatio,
    sidewalk: routeResult.sidewalkRatio,
    dedicatedBikeRatio: routeResult.dedicatedBikeRatio,
    sharedBikeRatio: routeResult.sharedBikeRatio,
    sidewalkRatio: routeResult.sidewalkRatio,
    riverPathRatio: routeResult.riverPathRatio,
    segregatedRatio: routeResult.segregatedRatio,
    unsegregatedRatio: routeResult.unsegregatedRatio,
    stairs: 0,
    overpass: preferredFilter === '계단 없음' ? 0 : 1,
    slope: '평탄 (평균 경사 1.5%)',
    slopeLevel: '평탄',
    calories: finalCalories,
    description: `${originName}에서 ${destName}까지 ${preferredFilter} 기준으로 설계된 안양시 맞춤 자전거 코스입니다.`,
    startPoint: originName,
    endPoint: destName,
    path: finalPath,
    elevationProfile: [27, 28, 29, 31, 30, 29, 28, 27],
    navSteps: finalNavSteps,
  };
}

/**
 * Creates circular distance loop route centered around start coordinate
 */
export function createLoopRouteByDistance(
  originName: string,
  startCoords: LatLng,
  targetDistanceKm: number = 10,
  filter: FilterCategory = '추천 코스'
): Course {
  const radiusKm = targetDistanceKm / (2 * Math.PI);
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos((startCoords.lat * Math.PI) / 180));

  const rawLoopWaypoints: [number, number][] = [];
  const numWaypoints = 12;
  for (let i = 0; i <= numWaypoints; i++) {
    const angle = (i / numWaypoints) * 2 * Math.PI;
    const lat = startCoords.lat + Math.sin(angle) * latDelta;
    const lng = startCoords.lng + Math.cos(angle) * lngDelta;
    rawLoopWaypoints.push([lat, lng]);
  }

  const loopPath = interpolateDenseRoadPath(rawLoopWaypoints, 36);
  const curTime = getCurrentTimeString();
  const timeMinutes = Math.round((targetDistanceKm / 15) * 60);
  const calories = Math.round(targetDistanceKm * 36);
  const breakdown = calculateRoadTypeBreakdown(loopPath);

  const matchedCw = ANYANG_CROSSWALKS[0];

  const navSteps: NavStep[] = [
    {
      id: 'step-loop-start',
      iconType: 'up',
      text: `${originName} 순환 출발`,
      sub: `목표 ${targetDistanceKm}km 자전거 순환로 진입`,
      distanceMeter: 200,
      instruction: `${originName}에서 출발하여 ${targetDistanceKm}km 순환 루프 코스를 시작합니다.`,
    },
    {
      id: 'step-loop-cw',
      iconType: 'crosswalk',
      text: `${matchedCw.dong} 안전 횡단`,
      sub: `${matchedCw.dong} 보행자 배려 구간`,
      distanceMeter: 250,
      warn: true,
      instruction: '횡단보도 접근 시 감속 및 보행자 우선 양보하세요.',
      crosswalkInfo: {
        dong: matchedCw.dong,
        widthM: matchedCw.widthM,
        lengthM: matchedCw.lengthM,
        roadName: matchedCw.roadName,
      },
    },
    {
      id: 'step-loop-half',
      iconType: 'up',
      text: '안양천/학의천 수변 산책로 순환',
      sub: '시원한 바람과 함께 평탄한 수변 전용도로 주행',
      distanceMeter: Math.round((targetDistanceKm * 1000) / 2),
      instruction: '수변 자전거길을 따라 페이스를 유지하며 순환하세요.',
    },
    {
      id: 'step-loop-arrive',
      iconType: 'arrive',
      text: `${originName} 원점 회귀 완료`,
      sub: `${targetDistanceKm}km 순환 라이딩 완주`,
      distanceMeter: 0,
      instruction: `목표 ${targetDistanceKm}km 순환 라이딩을 성공적으로 마쳤습니다!`,
    },
  ];

  return {
    id: `loop-route-${Date.now()}`,
    tag: filter,
    name: `${originName} ${targetDistanceKm}km AI 순환 코스`,
    distance: `${targetDistanceKm}km`,
    distanceKm: targetDistanceKm,
    time: `${timeMinutes}분`,
    timeMinutes,
    type: '순환 루프 코스',
    arrival: getCalculatedArrivalTime(timeMinutes, curTime),
    bikePath: breakdown.dedicatedBikeRatio,
    road: breakdown.sharedBikeRatio,
    sidewalk: breakdown.sidewalkRatio,
    dedicatedBikeRatio: breakdown.dedicatedBikeRatio,
    sharedBikeRatio: breakdown.sharedBikeRatio,
    sidewalkRatio: breakdown.sidewalkRatio,
    riverPathRatio: breakdown.riverPathRatio,
    segregatedRatio: breakdown.segregatedRatio,
    unsegregatedRatio: breakdown.unsegregatedRatio,
    stairs: 0,
    overpass: 0,
    slope: '평탄 (평균 경사 1.0%)',
    slopeLevel: '평탄',
    calories,
    description: `${originName}을(를) 기점으로 안양 주요 수변 및 자전거 전용도로를 한 바퀴 도는 ${targetDistanceKm}km 맞춤 순환 코스입니다.`,
    startPoint: originName,
    endPoint: `${originName} (순환)`,
    path: loopPath,
    elevationProfile: [28, 29, 30, 29, 28, 29, 30, 28],
    navSteps,
  };
}

/**
 * Asynchronously calculates route with OSRM cycling engine, with instant topological fallback
 */
export async function fetchCustomOptimalRouteAsync(
  originName: string,
  startCoords: LatLng,
  destName: string,
  destCoords: LatLng,
  routeType: RouteType = 'oneway',
  preferredFilter: FilterCategory = '추천 코스',
  avoidPoint?: LatLng,
  detourSign: number = 1
): Promise<Course> {
  const fallback = createCustomOptimalRoute(originName, startCoords, destName, destCoords, routeType, preferredFilter);

  try {
    let url = `https://router.project-osrm.org/route/v1/bike/${startCoords.lng},${startCoords.lat}`;
    
    // If avoidPoint is given, route via a detour offset point
    if (avoidPoint) {
      const offsetLat = avoidPoint.lat + 0.003 * detourSign;
      const offsetLng = avoidPoint.lng + 0.003 * detourSign;
      url += `;${offsetLng},${offsetLat}`;
    }

    url += `;${destCoords.lng},${destCoords.lat}?overview=full&geometries=geojson&steps=true`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return fallback;
    }

    const data = await response.json();
    if (!data.routes || data.routes.length === 0) {
      return fallback;
    }

    const primary = data.routes[0];
    const rawCoordinates: [number, number][] = primary.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
    const distKm = Math.round((primary.distance / 1000) * 10) / 10;
    const timeMins = Math.max(3, Math.round(primary.duration / 60));
    const breakdown = calculateRoadTypeBreakdown(rawCoordinates);
    const curTime = getCurrentTimeString();

    let finalPath = rawCoordinates;
    let finalDist = distKm;
    let finalTime = timeMins;
    let finalNavSteps = fallback.navSteps;

    if (routeType === 'roundtrip') {
      finalPath = [...rawCoordinates, ...[...rawCoordinates].reverse().slice(1)];
      finalDist = Math.round(distKm * 2 * 10) / 10;
      finalTime = Math.round(timeMins * 1.95);
    }

    return {
      ...fallback,
      distance: `${finalDist}km`,
      distanceKm: finalDist,
      time: `${finalTime}분`,
      timeMinutes: finalTime,
      arrival: getCalculatedArrivalTime(finalTime, curTime),
      bikePath: breakdown.dedicatedBikeRatio,
      road: breakdown.sharedBikeRatio,
      sidewalk: breakdown.sidewalkRatio,
      dedicatedBikeRatio: breakdown.dedicatedBikeRatio,
      sharedBikeRatio: breakdown.sharedBikeRatio,
      sidewalkRatio: breakdown.sidewalkRatio,
      riverPathRatio: breakdown.riverPathRatio,
      segregatedRatio: breakdown.segregatedRatio,
      unsegregatedRatio: breakdown.unsegregatedRatio,
      path: finalPath,
      navSteps: finalNavSteps,
    };
  } catch (err) {
    return fallback;
  }
}
