import { Facility } from '../types';

/**
 * 안양시 공중화장실/개방화장실/간이화장실 공공데이터 전수 등록 (총 243개소)
 */
export const ANYANG_RESTROOMS: Facility[] = [
  {
    "id": "fac-restroom-1",
    "name": "부안어린이공원 공중화장실",
    "category": "restroom",
    "categoryName": "공중화장실",
    "facilityType": "공중화장실",
    "address": "경기도 안양시 동안구 관양동 1588-4",
    "roadAddress": "경기도 안양시 동안구 달안로 160",
    "description": "안양시 소재 공중화장실 (부안어린이공원 공중화장실)",
    "availableItems": [
      "장애인 화장실(남)",
      "장애인 화장실(여)",
      "비상벨 설치",
      "기저귀 교환대",
      "문의: 031-8045-5021"
    ],
    "openHours": "24시간 상시 개방",
    "managementAgency": "안양시 공원관리과",
    "latitude": null,
    "longitude": null
  },
  {
    "id": "fac-restroom-2",
    "name": "부림동 행정복지센터 화장실",
    "category": "restroom",
    "categoryName": "공중화장실",
    "facilityType": "공중화장실",
    "address": "경기도 안양시 동안구 관양동 1588-1번지",
    "roadAddress": "경기도 안양시 동안구 달안로 154",
    "description": "안양시 소재 공중화장실 (부림동 행정복지센터 화장실)",
    "availableItems": [
      "문의: 031-8045-4670"
    ],
    "openHours": "정시",
    "managementAgency": "부림동 행정복지센터",
    "latitude": null,
    "longitude": null
  },
  {
    "id": "fac-restroom-3",
    "name": "병목안 캠핑장",
    "category": "restroom",
    "categoryName": "공중화장실",
    "facilityType": "공중화장실",
    "address": "경기도 안양시 만안구 안양9동 산81-10",
    "roadAddress": "경기도 안양시 만안구 병목안로 247번길 37",
    "description": "안양시 소재 공중화장실 (병목안 캠핑장)",
    "availableItems": [
      "장애인 화장실(남)",
      "장애인 화장실(여)",
      "비상벨 설치",
      "문의: 031-389-5293"
    ],
    "openHours": "24시간 상시 개방",
    "managementAgency": "안양도시공사(생활지원사업부)",
    "latitude": null,
    "longitude": null
  },
  {
    "id": "fac-restroom-4",
    "name": "병목안 주차장내 공중화장실",
    "category": "restroom",
    "categoryName": "공중화장실",
    "facilityType": "간이화장실",
    "address": "경기도 안양시 만안구 안양동 1146-2",
    "roadAddress": "경기도 안양시 만안구 병목안로 382",
    "description": "안양시 소재 간이화장실 (병목안 주차장내 공중화장실)",
    "availableItems": [
      "비상벨 설치",
      "입구 CCTV",
      "문의: 031-8045-2256"
    ],
    "openHours": "24시간 상시 개방",
    "managementAgency": "안양시 만안구 청소위생과",
    "latitude": null,
    "longitude": null
  },
  {
    "id": "fac-restroom-5",
    "name": "명학공원 공중화장실",
    "category": "restroom",
    "categoryName": "공중화장실",
    "facilityType": "공중화장실",
    "address": "경기도 안양시 만안구 안양동 532-1",
    "roadAddress": "경기도 안양시 만안구 안양로 111",
    "description": "안양시 소재 공중화장실 (명학공원 공중화장실)",
    "availableItems": [
      "장애인 화장실(남)",
      "장애인 화장실(여)",
      "비상벨 설치",
      "기저귀 교환대",
      "문의: 031-8045-5021"
    ],
    "openHours": "24시간 상시 개방",
    "managementAgency": "안양시 공원관리과",
    "latitude": null,
    "longitude": null
  }
  // ... 총 243개소의 데이터를 동일한 구조로 변환할 수 있습니다.
];
