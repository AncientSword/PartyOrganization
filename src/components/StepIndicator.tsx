import { useLocation, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';

const STEPS = [
  { path: '/', label: '地图配置' },
  { path: '/info', label: '信息收集' },
  { path: '/time', label: '时间统计' },
  { path: '/location', label: '地点统计' },
  { path: '/result', label: '最终方案' },
];

export default function StepIndicator() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentIndex = STEPS.findIndex((s) => s.path === location.pathname);

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 py-4 px-4 overflow-x-auto">
      {STEPS.map((step, idx) => {
        const isCompleted = idx < currentIndex;
        const isCurrent = idx === currentIndex;

        return (
          <div key={step.path} className="flex items-center shrink-0">
            {idx > 0 && (
              <div
                className={`w-4 sm:w-8 h-0.5 mx-0.5 ${
                  idx <= currentIndex ? 'bg-orange-500' : 'bg-zinc-700'
                }`}
              />
            )}
            <button
              onClick={() => navigate(step.path)}
              className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all min-w-[44px] min-h-[44px] justify-center ${
                isCurrent
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                  : isCompleted
                  ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 cursor-pointer'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300 cursor-pointer'
              }`}
            >
              {isCompleted ? (
                <Check className="w-4 h-4" />
              ) : (
                <span className="w-4 h-4 flex items-center justify-center">{idx}</span>
              )}
              <span className="hidden sm:inline">{step.label}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
