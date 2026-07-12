import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, MapPin, Clock, Bus, Car, Bike, Zap, ChevronDown, ChevronUp, Loader2, AlertCircle, Star, Bookmark, Users, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useAmap } from '@/hooks/useAmap';
import { getAvailableMembers, formatDate, formatDuration, formatCost, getLocationKey, generateLocationStatsCacheKey } from '@/utils/calculation';
import { PERIOD_LABELS, TRANSPORT_MODE_LABELS } from '@/types';
import type { LocationStat, RouteResult, ExpectedLocation, TransportMode, Member } from '@/types';

type ModeResult = { duration: number; cost: number } | null;

export default function LocationStatistics() {
  const members = useAppStore((s) => s.members);
  const selectedTimeSlot = useAppStore((s) => s.selectedTimeSlot);
  const amapKey = useAppStore((s) => s.amapKey);
  const selectedLocations = useAppStore((s) => s.selectedLocations);
  const cachedStats = useAppStore((s) => s.locationStats);
  const cachedCacheKey = useAppStore((s) => s.locationStatsCacheKey);
  const setPrimaryLocation = useAppStore((s) => s.setPrimaryLocation);
  const toggleAlternativeLocation = useAppStore((s) => s.toggleAlternativeLocation);
  const setLocationStats = useAppStore((s) => s.setLocationStats);
  const navigate = useNavigate();
  const { planRoutes } = useAmap();

  const [loading, setLoading] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [error, setError] = useState('');

  const currentCacheKey = useMemo(() => {
    return generateLocationStatsCacheKey(members, selectedTimeSlot, amapKey);
  }, [members, selectedTimeSlot, amapKey]);

  const cacheHit = useMemo(() => {
    if (!currentCacheKey || !cachedCacheKey) return false;
    return currentCacheKey === cachedCacheKey && cachedStats.length > 0;
  }, [currentCacheKey, cachedCacheKey, cachedStats]);

  const locationStats = cacheHit ? cachedStats : [];
  const calculated = cacheHit;

  const availableMembers = useMemo(() => {
    if (!selectedTimeSlot) return [];
    return getAvailableMembers(members, selectedTimeSlot.date, selectedTimeSlot.period);
  }, [members, selectedTimeSlot]);

  const expectedLocationUnion = useMemo(() => {
    const map = new Map<string, { loc: ExpectedLocation; wantToGo: string[] }>();
    for (const member of availableMembers) {
      for (const loc of member.expectedLocations) {
        if (!loc.active) continue;
        const key = getLocationKey(loc);
        if (!map.has(key)) {
          map.set(key, { loc, wantToGo: [] });
        }
        map.get(key)!.wantToGo.push(member.nickname);
      }
    }
    return Array.from(map.values()).map(({ loc, wantToGo }) => ({ loc, wantToGo }));
  }, [availableMembers]);

  const membersWithResidence = useMemo(
    () => availableMembers.filter((m) => m.residence !== null && m.transportModes.length > 0),
    [availableMembers]
  );

  const pickBestMode = (results: Record<TransportMode, ModeResult>, modes: TransportMode[]): { mode: TransportMode; duration: number; cost: number } | null => {
    const validModes = modes
      .filter((m) => results[m] && results[m]!.duration > 0)
      .map((m) => ({ mode: m, ...results[m]! }));

    if (validModes.length === 0) return null;
    if (validModes.length === 1) return validModes[0];

    const maxDuration = Math.max(...validModes.map((m) => m.duration));
    const maxCost = Math.max(...validModes.map((m) => m.cost), 1);

    let best = validModes[0];
    let bestScore = Infinity;

    for (const m of validModes) {
      const normDuration = m.duration / maxDuration;
      const normCost = m.cost / maxCost;
      const score = normDuration * 0.6 + normCost * 0.4;
      if (score < bestScore) {
        bestScore = score;
        best = m;
      }
    }

    return best;
  };

  const calculateRoutes = useCallback(async () => {
    if (!amapKey || expectedLocationUnion.length === 0 || membersWithResidence.length === 0) return;

    setLoading(true);
    setError('');
    try {
      const stats: LocationStat[] = [];

      for (const { loc, wantToGo } of expectedLocationUnion) {
        const details: RouteResult[] = [];

        for (const member of membersWithResidence as (Member & { residence: NonNullable<Member['residence']> })[]) {
          try {
            const result = await planRoutes(
              { lng: member.residence.lng, lat: member.residence.lat },
              { lng: loc.lng, lat: loc.lat },
              member.transportModes
            );

            const best = pickBestMode(result, member.transportModes);

            details.push({
              memberNickname: member.nickname,
              origin: member.residence,
              destination: loc,
              taxi: result.taxi,
              driving: result.driving,
              cycling: result.cycling,
              transit: result.transit,
              bestMode: best?.mode || 'transit',
              bestDuration: best?.duration || 0,
              bestCost: best?.cost || 0,
            });
          } catch {
            details.push({
              memberNickname: member.nickname,
              origin: member.residence,
              destination: loc,
              taxi: null,
              driving: null,
              cycling: null,
              transit: null,
              bestMode: 'transit',
              bestDuration: 0,
              bestCost: 0,
            });
          }
        }

        const validDetails = details.filter((d) => d.bestDuration > 0);
        const avgDuration =
          validDetails.length > 0
            ? validDetails.reduce((s, d) => s + d.bestDuration, 0) / validDetails.length
            : 0;
        const avgCost =
          validDetails.length > 0
            ? validDetails.reduce((s, d) => s + d.bestCost, 0) / validDetails.length
            : 0;

        stats.push({
          location: loc,
          averageDuration: avgDuration,
          averageCost: avgCost,
          details,
          wantToGo,
        });
      }

      stats.sort((a, b) => {
        if (a.averageDuration !== b.averageDuration) return a.averageDuration - b.averageDuration;
        return a.averageCost - b.averageCost;
      });

      setLocationStats(stats, currentCacheKey);
    } catch {
      setError('路线规划失败，请检查网络连接和地图Key配置');
    } finally {
      setLoading(false);
    }
  }, [amapKey, expectedLocationUnion, membersWithResidence, planRoutes, currentCacheKey, setLocationStats]);

  if (!selectedTimeSlot) {
    return (
      <div className="text-center py-16">
        <p className="text-zinc-500 mb-4">请先在时间统计页选择聚会时间</p>
        <button
          onClick={() => navigate('/time')}
          className="px-4 py-2.5 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors"
        >
          去选择时间
        </button>
      </div>
    );
  }

  const modeIcon = (mode: TransportMode) => {
    switch (mode) {
      case 'taxi': return <Zap className="w-3 h-3" />;
      case 'driving': return <Car className="w-3 h-3" />;
      case 'cycling': return <Bike className="w-3 h-3" />;
      case 'transit': return <Bus className="w-3 h-3" />;
    }
  };

  const isPrimary = (loc: ExpectedLocation) => {
    if (!selectedLocations.primary) return false;
    return getLocationKey(selectedLocations.primary) === getLocationKey(loc);
  };
  const isAlternative = (loc: ExpectedLocation) => {
    const key = getLocationKey(loc);
    return selectedLocations.alternatives.some((l) => getLocationKey(l) === key);
  };
  const canSelectAlternative = selectedLocations.alternatives.length < 2;

  const canProceed = selectedLocations.primary !== null;

  return (
    <div className="space-y-4 pb-8">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4">
        <div className="flex items-center gap-2 text-orange-400 text-sm font-medium mb-1">
          <Clock className="w-4 h-4" />
          聚会时间
        </div>
        <div className="text-zinc-100 font-medium">
          {formatDate(selectedTimeSlot.date)} {PERIOD_LABELS[selectedTimeSlot.period]}
        </div>
        <div className="text-sm text-zinc-400 mt-1">
          {availableMembers.length}人参与：{availableMembers.map((m) => m.nickname).join('、')}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-100">地点统计</h1>
        {selectedLocations.primary && (
          <div className="text-xs text-zinc-400">
            已选 1首选 + {selectedLocations.alternatives.length}备选
          </div>
        )}
      </div>

      {expectedLocationUnion.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <MapPin className="w-8 h-8 mx-auto mb-3 text-zinc-600" />
          <p>参与成员没有已激活的预期地点</p>
        </div>
      ) : (
        <>
          {!amapKey && !calculated && (
            <div className="space-y-3">
              {expectedLocationUnion.map(({ loc, wantToGo }) => (
                <div
                  key={loc.id}
                  className="bg-zinc-900 border border-zinc-700 rounded-xl p-4"
                >
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-zinc-200 font-medium">{loc.name}</div>
                      <div className="flex items-center gap-1 text-xs text-zinc-500 mt-1">
                        <Users className="w-3 h-3" />
                        {wantToGo.length}人想去：{wantToGo.join('、')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-zinc-300">请配置高德地图Key以查看出行成本分析</p>
                  <button
                    onClick={() => navigate('/')}
                    className="text-xs text-orange-400 hover:text-orange-300 mt-1"
                  >
                    前往设置
                  </button>
                </div>
              </div>
            </div>
          )}

          {amapKey && !calculated && expectedLocationUnion.length > 0 && membersWithResidence.length > 0 && (
            <button
              onClick={calculateRoutes}
              disabled={loading}
              className="w-full py-3 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors min-h-[48px] text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  正在计算出行成本...
                </>
              ) : (
                '计算出行成本'
              )}
            </button>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          {calculated && locationStats.length > 0 && (
            <div className="space-y-3">
              {cacheHit && (
                <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-sm text-green-300">使用缓存结果，数据未变化</span>
                  </div>
                  <button
                    onClick={calculateRoutes}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 text-green-300 text-xs rounded-lg hover:bg-green-500/30 transition-colors min-h-[36px]"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    重新计算
                  </button>
                </div>
              )}
              {locationStats.map((stat, idx) => {
                const primary = isPrimary(stat.location);
                const alt = isAlternative(stat.location);
                return (
                  <div
                    key={getLocationKey(stat.location)}
                    className={`bg-zinc-900 border rounded-xl overflow-hidden transition-colors ${
                      primary ? 'border-orange-500' : alt ? 'border-blue-500/50' : 'border-zinc-700'
                    }`}
                  >
                    <div className="px-4 pt-3 pb-2">
                      <div className="flex items-start gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                          idx === 0
                            ? 'bg-green-500/20 text-green-400'
                            : idx === 1
                            ? 'bg-orange-500/20 text-orange-400'
                            : 'bg-zinc-700 text-zinc-400'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-zinc-200">{stat.location.name}</span>
                            {primary && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-500/20 text-orange-300 text-xs rounded-full">
                                <Star className="w-3 h-3 fill-current" />
                                首选
                              </span>
                            )}
                            {alt && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                                <Bookmark className="w-3 h-3" />
                                备选
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              平均{formatDuration(stat.averageDuration)}
                            </span>
                            <span>{formatCost(stat.averageCost)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-zinc-500 mt-1">
                            <Users className="w-3 h-3" />
                            {stat.wantToGo.length}人想去：{stat.wantToGo.join('、')}
                          </div>
                        </div>
                        <button
                          onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                          className="p-1 -mr-1 text-zinc-500 hover:text-zinc-300 flex-shrink-0"
                        >
                          {expandedIdx === idx ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => setPrimaryLocation(primary ? null : stat.location)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg min-h-[36px] transition-colors ${
                            primary
                              ? 'bg-orange-500 text-white'
                              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
                          }`}
                        >
                          <Star className="w-3.5 h-3.5" />
                          {primary ? '取消首选' : '设为首选'}
                        </button>
                        <button
                          onClick={() => toggleAlternativeLocation(stat.location)}
                          disabled={!alt && !canSelectAlternative}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg min-h-[36px] transition-colors ${
                            alt
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50'
                              : canSelectAlternative
                              ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
                              : 'bg-zinc-800/50 text-zinc-600 border border-zinc-800 cursor-not-allowed'
                          }`}
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                          {alt ? '取消备选' : canSelectAlternative ? '加入备选' : '备选已满'}
                        </button>
                      </div>
                    </div>

                    {expandedIdx === idx && (
                      <div className="border-t border-zinc-800 px-4 py-3 space-y-2">
                        {stat.details.map((detail) => (
                          <div
                            key={detail.memberNickname}
                            className="flex items-center gap-2 bg-zinc-800/50 rounded-lg px-3 py-2"
                          >
                            <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {detail.memberNickname.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-zinc-300">{detail.memberNickname}</div>
                              <div className="flex items-center gap-2 text-xs text-zinc-500">
                                <span className="flex items-center gap-0.5">
                                  {modeIcon(detail.bestMode)}
                                  {TRANSPORT_MODE_LABELS[detail.bestMode]}
                                </span>
                                <span>·</span>
                                <span>{formatDuration(detail.bestDuration)}</span>
                                <span>·</span>
                                <span>{formatCost(detail.bestCost)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {membersWithResidence.length < availableMembers.length && (
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-3 text-xs text-zinc-400">
            {availableMembers.length - membersWithResidence.length}位成员未填写居住地点或未选择出行方式，不参与出行成本计算
          </div>
          )}
        </>
      )}

      <div className="flex gap-3 pt-4">
        <button
          onClick={() => navigate('/time')}
          className="flex-1 flex items-center justify-center gap-2 py-3 border border-zinc-600 text-zinc-300 font-medium rounded-xl hover:bg-zinc-800 transition-colors min-h-[48px] text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          重选时间
        </button>
        <button
          onClick={() => navigate('/result')}
          disabled={!canProceed}
          className={`flex-1 flex items-center justify-center gap-2 py-3 font-medium rounded-xl min-h-[48px] text-sm transition-colors ${
            canProceed
              ? 'bg-orange-500 text-white hover:bg-orange-600'
              : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
          }`}
        >
          最终方案
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
