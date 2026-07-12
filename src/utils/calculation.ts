import type { Member, TimeStatItem, Period, TimeSlot } from '@/types';

const PERIOD_WEIGHT = { morning: 0, afternoon: 1, evening: 2 } as const;

export function computeTimeStats(members: Member[]): TimeStatItem[] {
  // 只取已激活用户的已激活时间记录
  const activeMembers = members.filter(() => true); // all members are considered, each record has its own active state

  const slotMap = new Map<string, { count: number; members: string[] }>();

  for (const member of activeMembers) {
    for (const record of member.timeRecords) {
      if (!record.active) continue;
      const periods: Period[] = [];
      if (record.morning) periods.push('morning');
      if (record.afternoon) periods.push('afternoon');
      if (record.evening) periods.push('evening');

      for (const period of periods) {
        const key = `${record.date}|${period}`;
        const existing = slotMap.get(key);
        if (existing) {
          existing.count++;
          existing.members.push(member.nickname);
        } else {
          slotMap.set(key, { count: 1, members: [member.nickname] });
        }
      }
    }
  }

  const results: TimeStatItem[] = [];
  for (const [key, val] of slotMap) {
    const [date, period] = key.split('|') as [string, Period];
    results.push({ date, period, count: val.count, members: val.members });
  }

  // 排序：人数降序 → 日期升序 → 时段升序
  results.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return PERIOD_WEIGHT[a.period] - PERIOD_WEIGHT[b.period];
  });

  return results;
}

export function getAvailableMembers(members: Member[], date: string, period: Period): Member[] {
  return members.filter((m) =>
    m.timeRecords.some(
      (r) => r.active && r.date === date && r[period]
    )
  );
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${month}月${day}日 ${weekdays[d.getDay()]}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}分钟`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}小时${m}分钟` : `${h}小时`;
}

export function formatCost(yuan: number): string {
  if (yuan === 0) return '免费';
  return `¥${yuan.toFixed(1)}`;
}

export function getLocationKey(loc: { name: string; lng: number; lat: number }): string {
  if (loc.lng === 0 && loc.lat === 0) {
    return `text:${loc.name}`;
  }
  const lng = Math.round(loc.lng * 1000000) / 1000000;
  const lat = Math.round(loc.lat * 1000000) / 1000000;
  return `${loc.name}|${lng},${lat}`;
}

export function generateLocationStatsCacheKey(
  members: Member[],
  selectedTimeSlot: TimeSlot | null,
  amapKey: string
): string {
  if (!selectedTimeSlot) return '';
  const availableMembers = getAvailableMembers(members, selectedTimeSlot.date, selectedTimeSlot.period);
  const memberSigs = availableMembers
    .map((m) => {
      const resKey = m.residence ? getLocationKey(m.residence) : 'no-residence';
      const modes = [...m.transportModes].sort().join(',');
      const locs = m.expectedLocations
        .filter((l) => l.active)
        .map((l) => getLocationKey(l))
        .sort()
        .join(';');
      return `${m.nickname}:${resKey}:${modes}:${locs}`;
    })
    .sort()
    .join('|');
  return `${selectedTimeSlot.date}|${selectedTimeSlot.period}|${amapKey}|${memberSigs}`;
}