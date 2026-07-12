import { useCallback, useRef, useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import type { TransportMode } from '@/types';

interface PoiSuggestion {
  name: string;
  address: string;
  location: { lng: number; lat: number };
}

interface RoutePlan {
  duration: number; // minutes
  cost: number; // yuan
}

type RoutePlanResult = Record<TransportMode, RoutePlan | null>;

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    AMap: any;
    _AMapSecurityConfig: { securityJsCode: string };
  }
}

export function useAmap() {
  const amapKey = useAppStore((s) => s.amapKey);
  const amapSecurityCode = useAppStore((s) => s.amapSecurityCode);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const currentKeyRef = useRef('');

  useEffect(() => {
    if (amapKey !== currentKeyRef.current) {
      setLoaded(false);
      setError(null);
      loadingRef.current = false;
      if (scriptRef.current) {
        scriptRef.current.remove();
        scriptRef.current = null;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).AMap = undefined;
    }
    currentKeyRef.current = amapKey;
  }, [amapKey]);

  const loadAmap = useCallback((): Promise<typeof window.AMap | null> => {
    if (!amapKey) return Promise.resolve(null);
    if (loaded && window.AMap) return Promise.resolve(window.AMap);
    if (loadingRef.current) {
      return new Promise((resolve) => {
        const check = setInterval(() => {
          if (window.AMap) {
            clearInterval(check);
            setLoaded(true);
            resolve(window.AMap);
          }
        }, 100);
        setTimeout(() => {
          clearInterval(check);
          if (!window.AMap) resolve(null);
        }, 15000);
      });
    }

    if (amapSecurityCode) {
      window._AMapSecurityConfig = { securityJsCode: amapSecurityCode };
    }

    loadingRef.current = true;
    setError(null);
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${amapKey}&plugin=AMap.PlaceSearch,AMap.Driving,AMap.Transfer,AMap.Riding,AMap.Taxi`;
      script.async = true;
      script.onload = () => {
        setLoaded(true);
        loadingRef.current = false;
        resolve(window.AMap);
      };
      script.onerror = () => {
        loadingRef.current = false;
        setError('地图脚本加载失败，请检查 API Key 是否正确');
        resolve(null);
      };
      document.head.appendChild(script);
      scriptRef.current = script;
    });
  }, [amapKey, amapSecurityCode, loaded]);

  const searchPlace = useCallback(
    async (keyword: string, city = '全国'): Promise<PoiSuggestion[]> => {
      const AMap = await loadAmap();
      if (!AMap || !keyword.trim()) return [];

      return new Promise((resolve) => {
        try {
          const placeSearch = new AMap.PlaceSearch({
            city,
            pageSize: 10,
            citylimit: false,
          });

          placeSearch.search(keyword, (
            status: string,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            result: any
          ) => {
            if (status === 'complete' && result.poiList?.pois) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const pois = result.poiList.pois.map((poi: any) => ({
                name: poi.name,
                address: poi.address || poi.cityname + poi.adname,
                location: {
                  lng: poi.location?.lng || 0,
                  lat: poi.location?.lat || 0,
                },
              }));
              resolve(pois);
            } else {
              setError(result?.info || '搜索失败');
              resolve([]);
            }
          });
        } catch (e) {
          setError(e instanceof Error ? e.message : '搜索异常');
          resolve([]);
        }
      });
    },
    [loadAmap]
  );

  const planRoutes = useCallback(
    async (
      origin: { lng: number; lat: number },
      destination: { lng: number; lat: number },
      modes: TransportMode[]
    ): Promise<RoutePlanResult> => {
      const AMap = await loadAmap();
      if (!AMap) {
        return { taxi: null, driving: null, cycling: null, transit: null };
      }

      const result: RoutePlanResult = { taxi: null, driving: null, cycling: null, transit: null };

      const originLngLat = new AMap.LngLat(origin.lng, origin.lat);
      const destLngLat = new AMap.LngLat(destination.lng, destination.lat);

      const promises: Promise<void>[] = [];

      if (modes.includes('driving')) {
        promises.push(
          new Promise<void>((resolve) => {
            try {
              const driving = new AMap.Driving({
                policy: AMap.DrivingPolicy?.LEAST_TIME,
              });
              driving.search(originLngLat, destLngLat, (
                status: string,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                res: any
              ) => {
                if (status === 'complete' && res.routes?.length) {
                  const route = res.routes[0];
                  result.driving = {
                    duration: Math.round(route.time / 60),
                    cost: route.tolls || 0,
                  };
                }
                resolve();
              });
            } catch {
              resolve();
            }
          })
        );
      }

      if (modes.includes('transit')) {
        promises.push(
          new Promise<void>((resolve) => {
            try {
              const transfer = new AMap.Transfer({
                policy: AMap.TransferPolicy?.LEAST_TIME,
                city: '全国',
              });
              transfer.search(originLngLat, destLngLat, (
                status: string,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                res: any
              ) => {
                if (status === 'complete' && res.plans?.length) {
                  const plan = res.plans[0];
                  result.transit = {
                    duration: Math.round(plan.time / 60),
                    cost: plan.cost || 0,
                  };
                }
                resolve();
              });
            } catch {
              resolve();
            }
          })
        );
      }

      if (modes.includes('cycling')) {
        promises.push(
          new Promise<void>((resolve) => {
            try {
              const riding = new AMap.Riding({
                policy: AMap.RidingPolicy?.FASTEST,
              });
              riding.search(originLngLat, destLngLat, (
                status: string,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                res: any
              ) => {
                if (status === 'complete' && res.routes?.length) {
                  const route = res.routes[0];
                  result.cycling = {
                    duration: Math.round(route.time / 60),
                    cost: 0,
                  };
                }
                resolve();
              });
            } catch {
              resolve();
            }
          })
        );
      }

      if (modes.includes('taxi')) {
        promises.push(
          new Promise<void>((resolve) => {
            try {
              const taxi = new AMap.Taxi();
              taxi.search(originLngLat, destLngLat, (
                status: string,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                res: any
              ) => {
                if (status === 'complete' && res.taxi?.duration) {
                  result.taxi = {
                    duration: Math.round(res.taxi.duration / 60),
                    cost: res.taxi.price || 0,
                  };
                }
                resolve();
              });
            } catch {
              resolve();
            }
          })
        );
      }

      await Promise.all(promises);
      return result;
    },
    [loadAmap]
  );

  return {
    hasKey: !!amapKey,
    loaded,
    error,
    loadAmap,
    searchPlace,
    planRoutes,
  };
}
