import { Facility } from '../types';

export interface AirPump {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: 'automatic' | 'manual' | 'both';
  operatingHours: string;
}

export const airPumps: AirPump[] = [
  { id: 'air-1', name: '호계3동 행정복지센터', address: '경기 안양시 동안구 경수대로 504', lat: 37.36952, lng: 126.95874, type: 'automatic', operatingHours: '24시간' },
  { id: 'air-2', name: '비산2동 이마트 앞', address: '경기 안양시 동안구 관악대로 104', lat: 37.39851, lng: 126.93211, type: 'manual', operatingHours: '24시간' },
  { id: 'air-3', name: '인덕원역 8번출구 앞 자전거보관대', address: '경기 안양시 동안구 관양동 136-11', lat: 37.40142, lng: 126.97651, type: 'automatic', operatingHours: '24시간' },
  { id: 'air-4', name: '인덕원역 3번 출구', address: '경기 안양시 동안구 관양동 1581', lat: 37.40082, lng: 126.97682, type: 'automatic', operatingHours: '24시간' },
  { id: 'air-5', name: '인덕원동 행정복지센터 내', address: '경기 안양시 동안구 관양로 215', lat: 37.40512, lng: 126.97341, type: 'automatic', operatingHours: '24시간' },
  { id: 'air-6', name: '평안동 행정복지센터', address: '경기 안양시 동안구 관평로138번길 39', lat: 37.39121, lng: 126.96321, type: 'automatic', operatingHours: '24시간' },
  { id: 'air-7', name: '관양동 행정복지센터', address: '경기 안양시 동안구 관평로358번길 46', lat: 37.40781, lng: 126.96541, type: 'automatic', operatingHours: '24시간' },
  { id: 'air-8', name: '부림동 행정복지센터', address: '경기 안양시 동안구 달안로 154', lat: 37.39612, lng: 126.96021, type: 'automatic', operatingHours: '24시간' },
  { id: 'air-9', name: '달안동 행정복지센터', address: '경기 안양시 동안구 달안로 65', lat: 37.39081, lng: 126.95481, type: 'automatic', operatingHours: '24시간' },
  { id: 'air-10', name: '범계역 뉴코아아울렛 앞', address: '경기 안양시 동안구 동안로 119', lat: 37.38991, lng: 126.95231, type: 'automatic', operatingHours: '24시간' },
  { id: 'air-11', name: '부흥동 청소년수련관 옆', address: '경기 안양시 동안구 동안로 155', lat: 37.39341, lng: 126.95351, type: 'automatic', operatingHours: '24시간' },
  { id: 'air-12', name: '동안구청 내 후문 주차장 입구', address: '경기 안양시 동안구 동안로 158', lat: 37.39281, lng: 126.95511, type: 'automatic', operatingHours: '24시간' },
  { id: 'air-13', name: '신촌동 행정복지센터 앞 육교아래', address: '경기 안양시 동안구 동안로 28', lat: 37.38211, lng: 126.95181, type: 'automatic', operatingHours: '24시간' },
  { id: 'air-14', name: '관양도서관 옆', address: '경기 안양시 동안구 동편로 124', lat: 37.41121, lng: 126.97411, type: 'automatic', operatingHours: '24시간' },
  { id: 'air-15', name: '평촌역 동아프라자 앞', address: '경기 안양시 동안구 부림로 121', lat: 37.39481, lng: 126.96381, type: 'manual', operatingHours: '24시간' },
  { id: 'air-16', name: '귀인동 행정복지센터 부근', address: '경기 안양시 동안구 부림로 16', lat: 37.38581, lng: 126.96121, type: 'automatic', operatingHours: '24시간' },
  { id: 'air-17', name: '민백초등학교 앞(공원보도)', address: '경기 안양시 동안구 부림로 22', lat: 37.38631, lng: 126.96211, type: 'manual', operatingHours: '24시간' },
  { id: 'air-18', name: '학운공원 운동장 부근', address: '경기 안양시 동안구 비산동 1100', lat: 37.39511, lng: 126.94781, type: 'automatic', operatingHours: '24시간' },
  { id: 'air-19', name: '비산1동 행정복지센터 앞', address: '경기 안양시 동안구 비산로 12', lat: 37.40181, lng: 126.94121, type: 'manual', operatingHours: '24시간' },
  { id: 'air-20', name: '미관광장 인라인스케이트장 앞', address: '경기 안양시 동안구 시민대로 지하 238', lat: 37.39181, lng: 126.95821, type: 'automatic', operatingHours: '24시간' },
  { id: 'air-21', name: '비산3동 행정복지센터 옆', address: '경기 안양시 동안구 운곡로 34', lat: 37.40681, lng: 126.94821, type: 'manual', operatingHours: '24시간' },
  { id: 'air-22', name: '관양고등학교 앞', address: '경기 안양시 동안구 일동로 115', lat: 37.41211, lng: 126.96981, type: 'automatic', operatingHours: '24시간' },
  { id: 'air-23', name: '범계 로데오거리 스타벅스 앞', address: '경기 안양시 동안구 평촌대로 223', lat: 37.3914623701313, lng: 126.9551126722, type: 'automatic', operatingHours: '24시간' },
  { id: 'air-24', name: '안양종합운동장 내', address: '경기 안양시 동안구 평촌대로 389', lat: 37.40481, lng: 126.95211, type: 'automatic', operatingHours: '24시간' },
  { id: 'air-25', name: '범계역 6번 출구', address: '경기 안양시 동안구 호계동 1053', lat: 37.38921, lng: 126.95011, type: 'automatic', operatingHours: '24시간' },
  { id: 'air-26', name: '범계역 7번 출구', address: '경기 안양시 동안구 호계동 1053', lat: 37.38891, lng: 126.94981, type: 'automatic', operatingHours: '24시간' },
  { id: 'air-27', name: '비산3동 행정복지센터', address: '경기 안양시 동안구 관악대로 213', lat: 37.40691, lng: 126.94811, type: 'automatic', operatingHours: '24시간' },
  { id: 'air-28', name: '범계역 2번 출구', address: '경기 안양시 동안구 호계동 1130', lat: 37.38981, lng: 126.95078, type: 'automatic', operatingHours: '24시간' },
  { id: 'air-29', name: '평촌동 행정복지센터', address: '경기 안양시 동안구 흥안대로456번길 21', lat: 37.39711, lng: 126.97451, type: 'automatic', operatingHours: '24시간' },
  { id: 'air-30', name: '석수1동 행정복지센터', address: '경기도 안양시 만안구 경수대로 1252', lat: 37.4196252640956, lng: 126.910625543032, type: 'both', operatingHours: '24시간' },
  { id: 'air-31', name: '안양5동 주민센터', address: '경기 안양시 만안구 냉천로157번길 18', lat: 37.38881, lng: 126.93121, type: 'automatic', operatingHours: '24시간' },
  { id: 'air-32', name: '안양4동 주민센터', address: '경기 안양시 만안구 냉천로193번길 34', lat: 37.39151, lng: 126.93011, type: 'both', operatingHours: '24시간' },
  { id: 'air-33', name: '안양7동 주민센터', address: '경기 안양시 만안구 덕천로 115', lat: 37.39581, lng: 126.93811, type: 'both', operatingHours: '24시간' },
  { id: 'air-34', name: '충훈2교 쉼터', address: '경기 안양시 만안구 박달동 838-1', lat: 37.40951, lng: 126.90821, type: 'both', operatingHours: '24시간' },
  { id: 'air-35', name: '박달2동 주민센터', address: '경기 안양시 만안구 박달로 470', lat: 37.40821, lng: 126.90311, type: 'automatic', operatingHours: '24시간' },
  { id: 'air-36', name: '안양9동 주민센터', address: '경기 안양시 만안구 병목안로142번길 12-9', lat: 37.38281, lng: 126.91581, type: 'both', operatingHours: '24시간' },
  { id: 'air-37', name: '안양천 삼성교', address: '경기 안양시 만안구 석수동', lat: 37.42511, lng: 126.90381, type: 'both', operatingHours: '24시간' },
  { id: 'air-38', name: '관악역 2번 출구', address: '경기 안양시 만안구 석수동 104-240', lat: 37.41911, lng: 126.90921, type: 'both', operatingHours: '24시간' },
  { id: 'air-39', name: '관악역 1번 출구', address: '경기 안양시 만안구 석수동 334', lat: 37.41961, lng: 126.90811, type: 'both', operatingHours: '24시간' },
  { id: 'air-40', name: '석수역 2번 출구', address: '경기 안양시 만안구 석수동 423-6', lat: 37.43521, lng: 126.90151, type: 'both', operatingHours: '24시간' },
  { id: 'air-41', name: '명학역 자전거 보관소', address: '경기 안양시 만안구 안양동 1163-1', lat: 37.37351, lng: 126.93881, type: 'both', operatingHours: '24시간' },
  { id: 'air-42', name: '안양역 1번 출구(메타볼)', address: '경기 안양시 만안구 안양동 88-1', lat: 37.40181, lng: 126.92281, type: 'both', operatingHours: '24시간' },
  { id: 'air-43', name: '안양역 2번 출구(래미안A)', address: '경기 안양시 만안구 안양동 90-21', lat: 37.40221, lng: 126.92411, type: 'both', operatingHours: '24시간' },
  { id: 'air-44', name: '만안구청 정문', address: '경기 안양시 만안구 안양로 128', lat: 37.38251, lng: 126.93511, type: 'both', operatingHours: '24시간' },
  { id: 'air-45', name: '석수2동 주민센터', address: '경기 안양시 만안구 안양로 496', lat: 37.42481, lng: 126.90681, type: 'both', operatingHours: '24시간' },
  { id: 'air-46', name: '안양8동 주민센터', address: '경기 안양시 만안구 안양로111번길 17', lat: 37.38011, lng: 126.93821, type: 'automatic', operatingHours: '24시간' },
  { id: 'air-47', name: '안양6동 주민센터', address: '경기 안양시 만안구 안양로170번길 23', lat: 37.38521, lng: 126.93611, type: 'automatic', operatingHours: '24시간' },
  { id: 'air-48', name: '안양2동 주민센터', address: '경기 안양시 만안구 안양로384번길 50', lat: 37.40421, lng: 126.91811, type: 'both', operatingHours: '24시간' },
  { id: 'air-49', name: '안양3동 주민센터', address: '경기 안양시 만안구 양화로 28', lat: 37.39081, lng: 126.92151, type: 'automatic', operatingHours: '24시간' },
  { id: 'air-50', name: '박달1동 주민센터', address: '경기 안양시 만안구 양화로127번길 9', lat: 37.39951, lng: 126.91381, type: 'both', operatingHours: '24시간' },
  { id: 'air-51', name: '충훈동 주민센터', address: '경기도 안양시 만안구 박달로 470', lat: 37.40821, lng: 126.90311, type: 'both', operatingHours: '24시간' },
  { id: 'air-52', name: '만안종합사회복지회관', address: '경기도 안양시 만안구 박달로 547-1', lat: 37.41251, lng: 126.89881, type: 'both', operatingHours: '24시간' },
  { id: 'air-53', name: '석수동477-3(연현마을)', address: '경기도 안양시 만안구 석수동 477-3', lat: 37.43081, lng: 126.90321, type: 'both', operatingHours: '24시간' },
  { id: 'air-54', name: '생태이야기관', address: '경기도 안양시 만안구 석수로 320', lat: 37.42081, lng: 126.89851, type: 'both', operatingHours: '24시간' },
  { id: 'air-55', name: '석수도서관', address: '경기도 안양시 만안구 양화로217번길 34', lat: 37.40611, lng: 126.90881, type: 'both', operatingHours: '24시간' },
  { id: 'air-56', name: '비산3동 관악대로 213앞', address: '경기도 안양시 동안구 관악대로 213', lat: 37.40381, lng: 126.94521, type: 'manual', operatingHours: '24시간' },
];

export interface AirPumpItem {
  no: number;
  name: string;
  auto: boolean;
  manual: boolean;
  address: string;
  roadAddress: string;
  lat: number;
  lng: number;
  description?: string;
}

export const RAW_AIR_PUMPS: AirPumpItem[] = airPumps.map((pump, idx) => ({
  no: idx + 1,
  name: pump.name.includes('공기주입기') ? pump.name : `${pump.name} 공기주입기`,
  auto: pump.type === 'automatic' || pump.type === 'both',
  manual: pump.type === 'manual' || pump.type === 'both',
  address: pump.address,
  roadAddress: pump.address,
  lat: pump.lat,
  lng: pump.lng,
  description: `${pump.name} - 안양시 공식 자전거 공기주입기 (${pump.address})`,
}));

export const ANYANG_AIR_PUMPS: Facility[] = airPumps.map((pump) => ({
  id: `air-pump-${pump.id}`,
  name: pump.name.includes('공기주입기') ? pump.name : `${pump.name} 공기주입기`,
  category: 'repair',
  categoryName: '수리/공기주입기',
  facilityType: '공기주입기',
  address: pump.address,
  roadAddress: pump.address,
  lat: pump.lat,
  lng: pump.lng,
  description: `${pump.name} - 안양시 공식 자전거 공기주입기 (${pump.address}) [운영: ${pump.operatingHours}]`,
  availableItems: [
    pump.type === 'automatic' || pump.type === 'both' ? '⚡ 전자동 급속 에어펌프' : '',
    pump.type === 'manual' || pump.type === 'both' ? '🛠️ 수동식 고압 펌프' : '',
    '던롭/슈레더/프레스타 공용 노즐',
  ].filter(Boolean),
  openHours: pump.operatingHours === '24시간' ? '상시 개방 (24시간 이용 가능)' : pump.operatingHours,
  phone: '031-8045-2495',
  managementAgency: '안양시 도로교통과 / 관할 행정복지센터',
}));

/**
 * Returns air pumps with any calibrated coordinates overlaid from localStorage cache
 */
export function getCalibratedAirPumps(): AirPump[] {
  return airPumps;
}

/**
 * Returns ANYANG_AIR_PUMPS facilities overlaid with calibrated coordinates
 */
export function getCalibratedAirPumpFacilities(): Facility[] {
  const currentPumps = getCalibratedAirPumps();
  return currentPumps.map((pump) => ({
    id: `air-pump-${pump.id}`,
    name: pump.name.includes('공기주입기') ? pump.name : `${pump.name} 공기주입기`,
    category: 'repair',
    categoryName: '수리/공기주입기',
    facilityType: '공기주입기',
    address: pump.address,
    roadAddress: pump.address,
    lat: pump.lat,
    lng: pump.lng,
    description: `${pump.name} - 안양시 공식 자전거 공기주입기 (${pump.address}) [운영: ${pump.operatingHours}]`,
    availableItems: [
      pump.type === 'automatic' || pump.type === 'both' ? '⚡ 전자동 급속 에어펌프' : '',
      pump.type === 'manual' || pump.type === 'both' ? '🛠️ 수동식 고압 펌프' : '',
      '던롭/슈레더/프레스타 공용 노즐',
    ].filter(Boolean),
    openHours: pump.operatingHours === '24시간' ? '상시 개방 (24시간 이용 가능)' : pump.operatingHours,
    phone: '031-8045-2495',
    managementAgency: '안양시 도로교통과 / 관할 행정복지센터',
  }));
}

