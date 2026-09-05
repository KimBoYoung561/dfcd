// Kakao Maps API services helper & Geocoding / Place search utility

const KAKAO_API_KEY = 'c4d1b687ae75d00ca6539a5e7c241fca';

let kakaoLoadPromise: Promise<any> | null = null;

export function loadKakaoMapsServices(): Promise<any> {
  if (kakaoLoadPromise) return kakaoLoadPromise;

  kakaoLoadPromise = new Promise((resolve) => {
    // If kakao and services are already loaded
    if ((window as any).kakao?.maps?.services) {
      resolve((window as any).kakao.maps);
      return;
    }

    if ((window as any).kakao?.maps?.load) {
      (window as any).kakao.maps.load(() => {
        resolve((window as any).kakao.maps);
      });
      return;
    }

    // Check if script element already exists
    let script = document.getElementById('kakao-map-sdk') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = 'kakao-map-sdk';
      // Load via local proxy first; fallback to direct DAPI if needed
      script.src = `/kakao-sdk.js?appkey=${KAKAO_API_KEY}&libraries=services,clusterer&autoload=false`;
      script.async = true;
      script.referrerPolicy = 'no-referrer';
      document.head.appendChild(script);
    }

    script.onload = () => {
      if ((window as any).kakao?.maps?.load) {
        (window as any).kakao.maps.load(() => {
          resolve((window as any).kakao.maps);
        });
      } else if ((window as any).kakao?.maps) {
        resolve((window as any).kakao.maps);
      } else {
        resolve(null);
      }
    };

    script.onerror = () => {
      // Fallback: try direct Kakao DAPI URL if proxy wasn't reached
      const fallbackScript = document.createElement('script');
      fallbackScript.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_API_KEY}&libraries=services,clusterer&autoload=false`;
      fallbackScript.async = true;
      fallbackScript.referrerPolicy = 'no-referrer';
      fallbackScript.onload = () => {
        if ((window as any).kakao?.maps?.load) {
          (window as any).kakao.maps.load(() => {
            resolve((window as any).kakao.maps);
          });
        } else {
          resolve((window as any).kakao?.maps || null);
        }
      };
      fallbackScript.onerror = () => resolve(null);
      document.head.appendChild(fallbackScript);
    };

    // Polling check for kakao.maps.load
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if ((window as any).kakao?.maps?.load) {
        clearInterval(interval);
        try {
          (window as any).kakao.maps.load(() => {
            resolve((window as any).kakao.maps);
          });
        } catch {
          resolve(null);
        }
      } else if ((window as any).kakao?.maps) {
        clearInterval(interval);
        resolve((window as any).kakao.maps);
      } else if (attempts >= 40) {
        clearInterval(interval);
        resolve(null);
      }
    }, 100);
  });

  return kakaoLoadPromise;
}

export interface PlaceSearchResult {
  id: string;
  place_name: string;
  road_address_name?: string;
  address_name: string;
  x: string; // lng
  y: string; // lat
  category_group_name?: string;
  phone?: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface FacilityLocationSearch {
  original: string;
  searchKeyword: string;
  detail: string;
}

/** Separates searchable landmarks from installation-specific positional details. */
export function refineFacilitySearchKeyword(original: string): FacilityLocationSearch {
  const normalized = original.replace(/\s+/g, ' ').trim();
  const withoutDistrictPrefix = normalized.replace(/^안양시\s+/, '');
  const detailPattern = /\s+(정문|후문|앞|옆|부근|입구|내|일원|하천진입로|육교아래|보도|맞은편)(.*)$/;
  const match = withoutDistrictPrefix.match(detailPattern);
  const detail = match ? `${match[1]}${match[2] || ''}`.trim() : '';
  const searchKeyword = (match ? withoutDistrictPrefix.slice(0, match.index) : withoutDistrictPrefix)
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/(\d+)\s*번\s*출구/g, '$1번출구');
  return { original: normalized, searchKeyword, detail };
}

function normalizeGeocodingText(value: string): string {
  return value
    .replace(/\uFEFF/g, '')
    .replace(/안\s*양\s*시/g, '안양시')
    .replace(/\s+/g, ' ')
    .trim();
}

function toCoordinates(result: any): Coordinates | null {
  const lat = Number(result?.y);
  const lng = Number(result?.x);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

/** Resolves a facility address or installation place, then returns only valid coordinates. */
export async function geocodeFacilityLocation(name: string, address: string, preferPlaceSearch = false): Promise<Coordinates | null> {
  const normalizedAddress = normalizeGeocodingText(address);
  if (!normalizedAddress && !name) return null;

  // Clean pure address by removing parenthesized building names like (호계3동 행정복지센터)
  const pureAddress = normalizedAddress.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
  const cleanName = name.replace(/공기주입기|자전거보관대|자전거 거치대|수리센터/g, '').trim();

  try {
    const maps = await loadKakaoMapsServices();
    if (!maps?.services) return null;

    // 1. Direct address geocoding via Kakao Geocoder (highest precision for road/lot addresses)
    if (maps.services.Geocoder && pureAddress) {
      const geocoder = new maps.services.Geocoder();
      const addrCoord = await new Promise<Coordinates | null>((resolve) => {
        geocoder.addressSearch(pureAddress, (result: any[], status: any) => {
          if (status === maps.services.Status.OK && result?.[0]) {
            resolve(toCoordinates(result[0]));
          } else {
            resolve(null);
          }
        });
      });
      if (addrCoord) return addrCoord;
    }

    // 2. Keyword place search via Kakao Places (for landmark names like "안양역 1번출구", "호계3동 행정복지센터")
    if (maps.services.Places) {
      const places = new maps.services.Places();
      const searchQueries = [
        `안양 ${cleanName}`,
        `${cleanName} ${pureAddress}`,
        `${pureAddress}`,
      ].filter(Boolean);

      for (const query of searchQueries) {
        const placeCoord = await new Promise<Coordinates | null>((resolve) => {
          places.keywordSearch(
            query,
            (result: any[], status: any) => {
              if (status === maps.services.Status.OK && result?.[0]) {
                resolve(toCoordinates(result[0]));
              } else {
                resolve(null);
              }
            },
            { location: new maps.LatLng(37.3943, 126.9568), radius: 25000 }
          );
        });
        if (placeCoord) return placeCoord;
      }
    }

    // 3. Raw address search retry with full string
    if (maps.services.Geocoder && normalizedAddress && normalizedAddress !== pureAddress) {
      const geocoder = new maps.services.Geocoder();
      const rawCoord = await new Promise<Coordinates | null>((resolve) => {
        geocoder.addressSearch(normalizedAddress, (result: any[], status: any) => {
          if (status === maps.services.Status.OK && result?.[0]) {
            resolve(toCoordinates(result[0]));
          } else {
            resolve(null);
          }
        });
      });
      if (rawCoord) return rawCoord;
    }
  } catch (err) {
    console.warn('Kakao facility geocoding error:', err);
  }

  // 4. Kakao Local REST API fallback via Vite proxy
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const searchParam = encodeURIComponent(pureAddress || cleanName);
    const response = await fetch(`/api/kakao-dapi/v2/local/search/keyword.json?query=${searchParam}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (response.ok) {
      const data = await response.json();
      const firstDoc = data.documents?.[0];
      if (firstDoc?.x && firstDoc?.y) {
        return { lat: parseFloat(firstDoc.y), lng: parseFloat(firstDoc.x) };
      }
    }
  } catch (err) {
    console.warn('Kakao REST search fallback error:', err);
  }

  return null;
}

/**
 * Converts lat, lng coordinates into real road / lot-number address using Kakao Geocoder
 */
export async function coordToAddress(lat: number, lng: number): Promise<string> {
  // 1. Try Kakao Maps Geocoder if SDK is available
  try {
    const maps = await loadKakaoMapsServices();
    if (maps && maps.services?.Geocoder) {
      const geocoder = new maps.services.Geocoder();
      const kakaoAddress = await new Promise<string | null>((resolve) => {
        geocoder.coord2Address(lng, lat, (result: any, status: any) => {
          if (status === maps.services.Status.OK && result && result[0]) {
            const roadAddr = result[0].road_address?.address_name;
            const jibunAddr = result[0].address?.address_name;
            resolve(roadAddr || jibunAddr || null);
          } else {
            resolve(null);
          }
        });
      });
      if (kakaoAddress) {
        return kakaoAddress;
      }
    }
  } catch (err) {
    console.warn('Kakao coord2Address error:', err);
  }

  // 2. Kakao REST coord2address via proxy
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`/api/kakao-dapi/v2/local/geo/coord2address.json?x=${lng}&y=${lat}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      const doc = data.documents?.[0];
      if (doc) {
        return doc.road_address?.address_name || doc.address?.address_name || '내 현재 위치';
      }
    }
  } catch (err) {
    console.warn('Kakao REST coord2address error:', err);
  }

  return '내 현재 위치';
}

/**
 * Searches places & addresses with Kakao Places keyword search
 */
export async function searchKakaoPlaces(keyword: string): Promise<PlaceSearchResult[]> {
  if (!keyword || keyword.trim().length === 0) return [];

  try {
    const maps = await loadKakaoMapsServices();
    if (maps && maps.services?.Places) {
      const ps = new maps.services.Places();
      const placeResults = await new Promise<PlaceSearchResult[]>((resolve) => {
        // Search prioritizing Anyang region coordinates
        ps.keywordSearch(
          keyword,
          (data: any, status: any) => {
            if (status === maps.services.Status.OK && Array.isArray(data)) {
              resolve(data);
            } else {
              resolve([]);
            }
          },
          {
            location: new maps.LatLng(37.3943, 126.9568),
            radius: 20000,
          }
        );
      });

        if (placeResults.length > 0) return placeResults;

        // Keyword search can miss a raw road or lot-number address. Try the
        // address geocoder before reporting that there are no results.
        if (maps.services.Geocoder) {
          const geocoder = new maps.services.Geocoder();
          return new Promise<PlaceSearchResult[]>((resolve) => {
            geocoder.addressSearch(keyword.trim(), (data: any[], status: any) => {
              if (status !== maps.services.Status.OK || !data?.[0]) {
                resolve([]);
                return;
              }

              const result = data[0];
              resolve([{
                id: `address-${result.x}-${result.y}`,
                place_name: keyword.trim(),
                road_address_name: result.road_address?.address_name,
                address_name: result.address?.address_name || keyword.trim(),
                x: result.x,
                y: result.y,
              }]);
            });
          });
        }

        return [];
    }
  } catch (err) {
    console.warn('Kakao keywordSearch error:', err);
  }

  return [];
}
