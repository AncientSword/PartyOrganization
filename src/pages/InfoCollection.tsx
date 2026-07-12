import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Calendar, Clock, ToggleLeft, ToggleRight, ChevronDown, ChevronUp, Car, Bike, Bus, Zap } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import LocationSelector from '@/components/LocationSelector';
import { PERIOD_LABELS, TRANSPORT_MODE_LABELS } from '@/types';
import type { Period, TransportMode } from '@/types';

export default function InfoCollection() {
  const members = useAppStore((s) => s.members);
  const addMember = useAppStore((s) => s.addMember);
  const removeMember = useAppStore((s) => s.removeMember);
  const updateNickname = useAppStore((s) => s.updateNickname);
  const addTimeRecord = useAppStore((s) => s.addTimeRecord);
  const removeTimeRecord = useAppStore((s) => s.removeTimeRecord);
  const updateTimeRecordPeriod = useAppStore((s) => s.updateTimeRecordPeriod);
  const toggleTimeRecordActive = useAppStore((s) => s.toggleTimeRecordActive);
  const setResidence = useAppStore((s) => s.setResidence);
  const addExpectedLocation = useAppStore((s) => s.addExpectedLocation);
  const removeExpectedLocation = useAppStore((s) => s.removeExpectedLocation);
  const toggleExpectedLocationActive = useAppStore((s) => s.toggleExpectedLocationActive);
  const toggleTransportMode = useAppStore((s) => s.toggleTransportMode);
  const navigate = useNavigate();

  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());
  const [dateRangeInputs, setDateRangeInputs] = useState<Record<string, { start: string; end: string }>>({});

  const toggleExpand = (id: string) => {
    setExpandedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isNicknameDuplicate = (id: string, nickname: string) => {
    return members.some((m) => m.id !== id && m.nickname === nickname);
  };

  const handleAddDateRange = (memberId: string) => {
    const range = dateRangeInputs[memberId];
    if (!range?.start || !range?.end) return;
    const start = new Date(range.start);
    const end = new Date(range.end);
    if (end < start) return;

    const d = new Date(start);
    while (d <= end) {
      const dateStr = d.toISOString().slice(0, 10);
      // 避免重复日期
      const member = members.find((m) => m.id === memberId);
      const exists = member?.timeRecords.some((r) => r.date === dateStr);
      if (!exists) {
        addTimeRecord(memberId, dateStr);
      }
      d.setDate(d.getDate() + 1);
    }
    setDateRangeInputs((prev) => ({ ...prev, [memberId]: { start: '', end: '' } }));
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-100">成员信息</h1>
        <button
          onClick={addMember}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          添加成员
        </button>
      </div>

      {members.length === 0 && (
        <div className="text-center py-16 text-zinc-500">
          <p className="text-lg mb-2">还没有成员</p>
          <p className="text-sm">点击上方按钮添加第一位成员</p>
        </div>
      )}

      {members.map((member) => {
        const isExpanded = expandedMembers.has(member.id);
        const nicknameError = isNicknameDuplicate(member.id, member.nickname);

        return (
          <div
            key={member.id}
            className="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden"
          >
            {/* 卡片头部 */}
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-zinc-800/50 transition-colors"
              onClick={() => toggleExpand(member.id)}
            >
              <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
                {member.nickname.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-zinc-200">{member.nickname}</span>
                <span className="text-xs text-zinc-500 ml-2">
                  {member.timeRecords.filter((r) => r.active).length}个时间 · {member.expectedLocations.filter((l) => l.active).length}个预期地点
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`确定删除「${member.nickname}」吗？`)) {
                    removeMember(member.id);
                  }
                }}
                className="p-2 rounded-lg hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-zinc-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-zinc-500" />
              )}
            </div>

            {/* 卡片内容 */}
            {isExpanded && (
              <div className="px-4 pb-4 space-y-5 border-t border-zinc-800">
                {/* 昵称 */}
                <div className="pt-4">
                  <label className="block text-xs text-zinc-500 mb-1.5">昵称</label>
                  <input
                    type="text"
                    value={member.nickname}
                    onChange={(e) => updateNickname(member.id, e.target.value)}
                    className={`w-full bg-zinc-800 border rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors ${
                      nicknameError ? 'border-red-500 focus:border-red-500' : 'border-zinc-600 focus:border-orange-500'
                    }`}
                    placeholder="输入昵称"
                  />
                  {nicknameError && (
                    <p className="text-xs text-red-400 mt-1">昵称不能与其他成员重复</p>
                  )}
                </div>

                {/* 时间记录 */}
                <div>
                  <label className="block text-xs text-zinc-500 mb-2">可用时间</label>

                  {member.timeRecords.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {member.timeRecords.map((record) => (
                        <div
                          key={record.id}
                          className={`flex items-center gap-2 bg-zinc-800 border rounded-lg px-3 py-2 ${
                            record.active ? 'border-zinc-600' : 'border-zinc-700 opacity-50'
                          }`}
                        >
                          <div className={`text-sm flex-shrink-0 ${record.active ? 'text-zinc-200' : 'text-zinc-500 line-through'}`}>
                            {record.date}
                          </div>
                          <div className="flex gap-1 flex-1 flex-wrap">
                            {(['morning', 'afternoon', 'evening'] as Period[]).map((p) => (
                              <label
                                key={p}
                                className={`flex items-center gap-1 text-xs cursor-pointer px-2 py-1 rounded ${
                                  record.active
                                    ? record[p]
                                      ? 'bg-orange-500/20 text-orange-400'
                                      : 'text-zinc-500 hover:text-zinc-300'
                                    : 'text-zinc-600'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={record[p]}
                                  onChange={(e) => updateTimeRecordPeriod(member.id, record.id, p, e.target.checked)}
                                  disabled={!record.active}
                                  className="sr-only"
                                />
                                {PERIOD_LABELS[p]}
                              </label>
                            ))}
                          </div>
                          <button
                            onClick={() => toggleTimeRecordActive(member.id, record.id)}
                            className="p-1.5 rounded hover:bg-zinc-700 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                            title={record.active ? '禁用' : '激活'}
                          >
                            {record.active ? (
                              <ToggleRight className="w-5 h-5 text-green-400" />
                            ) : (
                              <ToggleLeft className="w-5 h-5 text-zinc-500" />
                            )}
                          </button>
                          <button
                            onClick={() => removeTimeRecord(member.id, record.id)}
                            className="p-1.5 rounded hover:bg-zinc-700 text-zinc-500 hover:text-red-400 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 日期范围添加 */}
                  <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <Calendar className="w-3.5 h-3.5" />
                      按日期范围添加
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={dateRangeInputs[member.id]?.start || ''}
                        min={today}
                        onChange={(e) =>
                          setDateRangeInputs((prev) => ({
                            ...prev,
                            [member.id]: { ...prev[member.id], start: e.target.value, end: prev[member.id]?.end || e.target.value },
                          }))
                        }
                        className="flex-1 bg-zinc-800 border border-zinc-600 rounded-lg px-2 py-2 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                      />
                      <span className="text-zinc-500 text-xs">至</span>
                      <input
                        type="date"
                        value={dateRangeInputs[member.id]?.end || ''}
                        min={dateRangeInputs[member.id]?.start || today}
                        onChange={(e) =>
                          setDateRangeInputs((prev) => ({
                            ...prev,
                            [member.id]: { ...prev[member.id], end: e.target.value },
                          }))
                        }
                        className="flex-1 bg-zinc-800 border border-zinc-600 rounded-lg px-2 py-2 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                      />
                      <button
                        onClick={() => handleAddDateRange(member.id)}
                        className="px-3 py-2 bg-orange-500/20 text-orange-400 text-xs rounded-lg hover:bg-orange-500/30 transition-colors min-h-[44px] flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        添加
                      </button>
                    </div>

                    {/* 单日添加 */}
                    <div className="flex items-center gap-2 text-xs text-zinc-400 pt-1">
                      <Clock className="w-3.5 h-3.5" />
                      或添加单日
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        min={today}
                        onChange={(e) => {
                          if (e.target.value) {
                            const exists = member.timeRecords.some((r) => r.date === e.target.value);
                            if (!exists) {
                              addTimeRecord(member.id, e.target.value);
                            }
                            e.target.value = '';
                          }
                        }}
                        className="flex-1 bg-zinc-800 border border-zinc-600 rounded-lg px-2 py-2 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 居住地点 */}
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">居住地点</label>
                  <LocationSelector
                    value={member.residence}
                    onChange={(loc) => setResidence(member.id, loc)}
                    placeholder="搜索居住地点"
                  />
                </div>

                {/* 出行方式 */}
                <div>
                  <label className="block text-xs text-zinc-500 mb-2">出行方式（可多选）</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['taxi', 'driving', 'cycling', 'transit'] as TransportMode[]).map((mode) => {
                      const active = member.transportModes.includes(mode);
                      const icons = { taxi: <Zap className="w-4 h-4" />, driving: <Car className="w-4 h-4" />, cycling: <Bike className="w-4 h-4" />, transit: <Bus className="w-4 h-4" /> };
                      return (
                        <button
                          key={mode}
                          onClick={() => toggleTransportMode(member.id, mode)}
                          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all min-h-[44px] border-2 ${
                            active
                              ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                              : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                          }`}
                        >
                          {icons[mode]}
                          {TRANSPORT_MODE_LABELS[mode]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 预期地点 */}
                <div>
                  <label className="block text-xs text-zinc-500 mb-2">
                    预期地点 ({member.expectedLocations.length}/5)
                  </label>
                  {member.expectedLocations.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {member.expectedLocations.map((loc) => (
                        <div
                          key={loc.id}
                          className={`flex items-center gap-2 bg-zinc-800 border rounded-lg px-3 py-2 ${
                            loc.active ? 'border-zinc-600' : 'border-zinc-700 opacity-50'
                          }`}
                        >
                          <span className={`text-sm flex-1 truncate ${loc.active ? 'text-zinc-200' : 'text-zinc-500 line-through'}`}>
                            {loc.name}
                          </span>
                          <button
                            onClick={() => toggleExpectedLocationActive(member.id, loc.id)}
                            className="p-1.5 rounded hover:bg-zinc-700 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                            title={loc.active ? '禁用' : '激活'}
                          >
                            {loc.active ? (
                              <ToggleRight className="w-5 h-5 text-green-400" />
                            ) : (
                              <ToggleLeft className="w-5 h-5 text-zinc-500" />
                            )}
                          </button>
                          <button
                            onClick={() => removeExpectedLocation(member.id, loc.id)}
                            className="p-1.5 rounded hover:bg-zinc-700 text-zinc-500 hover:text-red-400 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {member.expectedLocations.length < 5 ? (
                    <LocationSelector
                      value={null}
                      onChange={(loc) => {
                        if (loc) addExpectedLocation(member.id, loc);
                      }}
                      placeholder="搜索预期聚会地点"
                    />
                  ) : (
                    <p className="text-xs text-zinc-500">已达上限5个</p>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {members.length > 0 && (
        <div className="pt-4">
          <button
            onClick={() => navigate('/time')}
            className="w-full py-3 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors min-h-[48px] text-sm"
          >
            下一步：时间统计
          </button>
        </div>
      )}
    </div>
  );
}
