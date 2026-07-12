import type { Member, TransportMode } from '@/types';
import { useAppStore } from '@/store/useAppStore';

const DEFAULT_MODES: TransportMode[] = ['taxi', 'driving', 'cycling', 'transit'];

export function exportData() {
  const state = useAppStore.getState();
  const data = {
    version: 2,
    members: state.members,
    amapKey: state.amapKey,
    amapSecurityCode: state.amapSecurityCode,
    selectedTimeSlot: state.selectedTimeSlot,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `聚会助手_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importData(file: File): Promise<{ members: Member[]; amapKey?: string; amapSecurityCode?: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (!data.members || !Array.isArray(data.members)) {
          reject(new Error('无效的数据格式：缺少 members 字段'));
          return;
        }
        const members: Member[] = data.members.map((m: Member & { transportModes?: TransportMode[] }) => ({
          ...m,
          transportModes: m.transportModes && m.transportModes.length > 0
            ? m.transportModes
            : DEFAULT_MODES,
        }));
        resolve({ members, amapKey: data.amapKey, amapSecurityCode: data.amapSecurityCode });
      } catch {
        reject(new Error('无法解析文件，请确保是有效的JSON'));
      }
    };
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsText(file);
  });
}
