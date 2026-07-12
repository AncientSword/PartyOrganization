import { useRef } from 'react';
import { Download, Upload, Trash2 } from 'lucide-react';
import { exportData, importData } from '@/utils/export';
import { useAppStore } from '@/store/useAppStore';

export default function ImportExportBar() {
  const importDataFn = useAppStore((s) => s.importData);
  const resetAll = useAppStore((s) => s.resetAll);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await importData(file);
      importDataFn(data);
    } catch (err) {
      alert(err instanceof Error ? err.message : '导入失败');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleReset = () => {
    if (window.confirm('确定要清除所有数据吗？此操作不可撤销。')) {
      resetAll();
    }
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={exportData}
        className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        title="导出数据"
      >
        <Download className="w-5 h-5" />
      </button>
      <button
        onClick={() => fileRef.current?.click()}
        className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        title="导入数据"
      >
        <Upload className="w-5 h-5" />
      </button>
      <button
        onClick={handleReset}
        className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-red-400 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        title="清除数据"
      >
        <Trash2 className="w-5 h-5" />
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="hidden"
      />
    </div>
  );
}
