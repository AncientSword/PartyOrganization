import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Users, Clock } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { computeTimeStats, formatDate, getAvailableMembers } from '@/utils/calculation';
import { PERIOD_LABELS } from '@/types';
import type { Period } from '@/types';

export default function TimeStatistics() {
  const members = useAppStore((s) => s.members);
  const selectedTimeSlot = useAppStore((s) => s.selectedTimeSlot);
  const setSelectedTimeSlot = useAppStore((s) => s.setSelectedTimeSlot);
  const navigate = useNavigate();

  const stats = useMemo(() => computeTimeStats(members), [members]);

  const totalMembers = members.length;

  const handleSelectSlot = (date: string, period: Period) => {
    setSelectedTimeSlot({ date, period });
  };

  const selectedAvailableMembers = useMemo(() => {
    if (!selectedTimeSlot) return [];
    return getAvailableMembers(members, selectedTimeSlot.date, selectedTimeSlot.period);
  }, [members, selectedTimeSlot]);

  if (members.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-zinc-500 mb-4">请先在信息收集页添加成员</p>
        <button
          onClick={() => navigate('/info')}
          className="px-4 py-2.5 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors"
        >
          去添加成员
        </button>
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-zinc-500 mb-4">暂无有效的时间记录</p>
        <button
          onClick={() => navigate('/info')}
          className="px-4 py-2.5 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors"
        >
          返回添加时间
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-100">时间统计</h1>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <Users className="w-4 h-4" />
          共 {totalMembers} 人
        </div>
      </div>

      {/* 选中预览 */}
      {selectedTimeSlot && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-orange-400 text-sm font-medium mb-2">
            <Clock className="w-4 h-4" />
            已选择时间
          </div>
          <div className="text-zinc-100 font-medium">
            {formatDate(selectedTimeSlot.date)} {PERIOD_LABELS[selectedTimeSlot.period]}
          </div>
          <div className="text-sm text-zinc-400 mt-1">
            {selectedAvailableMembers.length}人有空：{selectedAvailableMembers.map((m) => m.nickname).join('、')}
          </div>
        </div>
      )}

      {/* 统计表格 */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden">
        {/* 表头 */}
        <div className="grid grid-cols-[1fr_80px_60px_44px] sm:grid-cols-[1fr_100px_80px_44px] bg-zinc-800 px-4 py-2.5 text-xs text-zinc-400 font-medium">
          <div>时间</div>
          <div className="text-center">时段</div>
          <div className="text-center">人数</div>
          <div></div>
        </div>

        {/* 表格内容 */}
        <div className="divide-y divide-zinc-800">
          {stats.map((item) => {
            const isSelected =
              selectedTimeSlot?.date === item.date && selectedTimeSlot?.period === item.period;

            return (
              <button
                key={`${item.date}-${item.period}`}
                onClick={() => handleSelectSlot(item.date, item.period)}
                className={`w-full grid grid-cols-[1fr_80px_60px_44px] sm:grid-cols-[1fr_100px_80px_44px] px-4 py-3 text-left transition-colors ${
                  isSelected
                    ? 'bg-orange-500/15 border-l-2 border-orange-500'
                    : 'hover:bg-zinc-800/50'
                }`}
              >
                <div className="text-sm text-zinc-200">{formatDate(item.date)}</div>
                <div className="text-sm text-zinc-300 text-center">{PERIOD_LABELS[item.period]}</div>
                <div className="text-center">
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                    item.count === totalMembers
                      ? 'bg-green-500/20 text-green-400'
                      : item.count >= totalMembers / 2
                      ? 'bg-orange-500/20 text-orange-400'
                      : 'bg-zinc-700 text-zinc-400'
                  }`}>
                    {item.count}
                  </span>
                </div>
                <div className="flex items-center justify-center">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-orange-500 bg-orange-500' : 'border-zinc-600'
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 成员详情 - 选中后展示 */}
      {selectedTimeSlot && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4">
          <h3 className="text-sm font-medium text-zinc-300 mb-3">有空成员详情</h3>
          <div className="flex flex-wrap gap-2">
            {selectedAvailableMembers.map((m) => (
              <span
                key={m.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/15 text-orange-300 text-xs rounded-full"
              >
                {m.nickname}
                {m.residence ? null : <span className="text-zinc-500">(无居住地)</span>}
                {m.expectedLocations.filter((l) => l.active).length === 0 && (
                  <span className="text-zinc-500">(无预期地点)</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 导航按钮 */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={() => navigate('/info')}
          className="flex-1 flex items-center justify-center gap-2 py-3 border border-zinc-600 text-zinc-300 font-medium rounded-xl hover:bg-zinc-800 transition-colors min-h-[48px] text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          返回修改
        </button>
        <button
          onClick={() => navigate('/location')}
          disabled={!selectedTimeSlot}
          className={`flex-1 flex items-center justify-center gap-2 py-3 font-medium rounded-xl min-h-[48px] text-sm transition-colors ${
            selectedTimeSlot
              ? 'bg-orange-500 text-white hover:bg-orange-600'
              : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
          }`}
        >
          地点统计
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
