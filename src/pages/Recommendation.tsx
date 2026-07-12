import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Star, Bookmark, Users, ArrowLeft, RotateCcw, Share2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { getAvailableMembers, formatDate } from '@/utils/calculation';
import { PERIOD_LABELS } from '@/types';

export default function FinalPlan() {
  const members = useAppStore((s) => s.members);
  const selectedTimeSlot = useAppStore((s) => s.selectedTimeSlot);
  const selectedLocations = useAppStore((s) => s.selectedLocations);
  const navigate = useNavigate();

  const availableMembers = useMemo(() => {
    if (!selectedTimeSlot) return [];
    return getAvailableMembers(members, selectedTimeSlot.date, selectedTimeSlot.period);
  }, [members, selectedTimeSlot]);

  if (!selectedTimeSlot) {
    return (
      <div className="text-center py-16">
        <p className="text-zinc-500 mb-4">请先完成时间和地点的选择</p>
        <button
          onClick={() => navigate('/time')}
          className="px-4 py-2.5 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors"
        >
          去选择时间
        </button>
      </div>
    );
  }

  const primary = selectedLocations.primary;
  const alternatives = selectedLocations.alternatives;

  const copyPlan = () => {
    const lines: string[] = [];
    lines.push('聚会方案');
    lines.push('———');
    if (selectedTimeSlot) {
      lines.push(`时间：${formatDate(selectedTimeSlot.date)} ${PERIOD_LABELS[selectedTimeSlot.period]}`);
      lines.push(`参与：${availableMembers.map(m => m.nickname).join('、')}（${availableMembers.length}人）`);
    }
    if (primary) {
      lines.push(`地点：${primary.name}（首选）`);
    }
    if (alternatives.length > 0) {
      alternatives.forEach((loc, idx) => {
        lines.push(`备选${idx + 1}：${loc.name}`);
      });
    }
    const text = lines.join('\n');
    navigator.clipboard?.writeText(text).catch(() => {});
  };

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <Star className="w-6 h-6 text-orange-400 fill-orange-400" />
          最终方案
        </h1>
        <button
          onClick={copyPlan}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg border border-zinc-700 transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          复制
        </button>
      </div>

      <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 rounded-2xl p-5">
        <div className="flex items-center gap-2 text-orange-400 text-sm font-medium mb-3">
          <Calendar className="w-5 h-5" />
          聚会时间
        </div>
        <div className="text-2xl font-bold text-zinc-100">
          {formatDate(selectedTimeSlot.date)} {PERIOD_LABELS[selectedTimeSlot.period]}
        </div>
        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
          {availableMembers.map((m) => (
            <span
              key={m.id}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-500/30 text-orange-200 text-xs font-medium"
              title={m.nickname}
            >
              {m.nickname.charAt(0)}
            </span>
          ))}
          <span className="text-sm text-orange-300 ml-1">
            {availableMembers.length}人
          </span>
        </div>
        <div className="text-sm text-zinc-400 mt-2">
          有空：{availableMembers.map(m => m.nickname).join('、')}
        </div>
      </div>

      {primary && (
        <div className="bg-gradient-to-br from-green-500/15 to-green-600/5 border border-green-500/30 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-green-400 text-sm font-medium mb-3">
            <MapPin className="w-5 h-5" />
            首选地点
          </div>
          <div className="text-2xl font-bold text-zinc-100">{primary.name}</div>
          <div className="text-sm text-zinc-400 mt-2">
            由组织者从地点统计中选定
          </div>
        </div>
      )}

      {!primary && (
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-5 text-center">
          <MapPin className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
          <p className="text-zinc-500 text-sm">尚未选择首选地点</p>
          <button
            onClick={() => navigate('/location')}
            className="mt-3 px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors"
          >
            去选择地点
          </button>
        </div>
      )}

      {alternatives.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-blue-400 text-sm font-medium mb-3">
            <Bookmark className="w-5 h-5" />
            备选地点
            <span className="text-xs text-zinc-500 font-normal">（{alternatives.length}个）</span>
          </div>
          <div className="space-y-2">
            {alternatives.map((loc, idx) => (
              <div
                key={loc.id}
                className="flex items-center gap-3 bg-zinc-800/50 rounded-xl px-4 py-3"
              >
                <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-zinc-200 truncate">{loc.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5">
        <div className="flex items-center gap-2 text-zinc-300 text-sm font-medium mb-3">
          <Users className="w-4 h-4" />
          参与成员
        </div>
        <div className="space-y-2">
          {availableMembers.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3 bg-zinc-800/50 rounded-lg px-3 py-2"
            >
              <div className="w-7 h-7 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-sm font-bold">
                {m.nickname.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-zinc-200">{m.nickname}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={() => navigate('/location')}
          className="flex-1 flex items-center justify-center gap-2 py-3 border border-zinc-600 text-zinc-300 font-medium rounded-xl hover:bg-zinc-800 transition-colors min-h-[48px] text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          调整地点
        </button>
        <button
          onClick={() => navigate('/info')}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-zinc-800 text-zinc-300 font-medium rounded-xl hover:bg-zinc-700 transition-colors min-h-[48px] text-sm"
        >
          <RotateCcw className="w-4 h-4" />
          重新开始
        </button>
      </div>
    </div>
  );
}
