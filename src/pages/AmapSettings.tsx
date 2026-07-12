import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Check, ExternalLink } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export default function AmapSettings() {
  const amapKey = useAppStore((s) => s.amapKey);
  const amapSecurityCode = useAppStore((s) => s.amapSecurityCode);
  const setAmapKey = useAppStore((s) => s.setAmapKey);
  const setAmapSecurityCode = useAppStore((s) => s.setAmapSecurityCode);
  const navigate = useNavigate();

  const [keyInput, setKeyInput] = useState(amapKey);
  const [codeInput, setCodeInput] = useState(amapSecurityCode);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setAmapKey(keyInput.trim());
    setAmapSecurityCode(codeInput.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const canProceed = amapKey.length > 0;

  return (
    <div className="space-y-6 pb-8">
      <div className="text-center py-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-orange-500/20 flex items-center justify-center">
          <MapPin className="w-8 h-8 text-orange-400" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-100 mb-2">地图配置</h1>
        <p className="text-sm text-zinc-400">配置高德地图 API 以启用地点搜索和路线规划</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-zinc-200 mb-2">
            API Key
            <span className="text-red-400 ml-1">*</span>
          </label>
          <input
            type="text"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="请输入高德地图 Web JS API Key"
            style={{ background: '#ffffff', color: '#000000' }}
            className="w-full rounded-lg px-4 py-3 text-base border-2 border-orange-500/50 focus:outline-none focus:border-orange-500 placeholder-gray-400"
          />
          <p className="text-xs text-zinc-500 mt-1.5">
            必填，用于加载地图和调用搜索/路线规划接口
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-zinc-200 mb-2">
            安全密钥 (Security JsCode)
          </label>
          <input
            type="text"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            placeholder="请输入安全密钥（可选，建议配置）"
            style={{ background: '#ffffff', color: '#000000' }}
            className="w-full rounded-lg px-4 py-3 text-base border-2 border-zinc-600 focus:outline-none focus:border-orange-500 placeholder-gray-400"
          />
          <p className="text-xs text-zinc-500 mt-1.5">
            2021年12月后申请的 Key 建议配置安全密钥，否则可能调用失败
          </p>
        </div>

        <button
          onClick={handleSave}
          className={`w-full py-3 rounded-lg font-medium text-sm transition-colors min-h-[48px] flex items-center justify-center gap-2 ${
            saved
              ? 'bg-green-500 text-white'
              : 'bg-orange-500 text-white hover:bg-orange-600'
          }`}
        >
          {saved ? (
            <>
              <Check className="w-4 h-4" />
              已保存
            </>
          ) : (
            '保存配置'
          )}
        </button>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-zinc-200 mb-3">如何获取 Key 和安全密钥</h3>
        <div className="space-y-2 text-xs text-zinc-400">
          <p className="flex gap-2">
            <span className="text-orange-400 font-bold shrink-0">1.</span>
            <span>
              访问
              <a
                href="https://lbs.amap.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-400 hover:underline inline-flex items-center gap-0.5 mx-1"
              >
                高德开放平台
                <ExternalLink className="w-3 h-3" />
              </a>
              ，注册并登录
            </span>
          </p>
          <p className="flex gap-2">
            <span className="text-orange-400 font-bold shrink-0">2.</span>
            <span>进入「控制台」→「应用管理」→「我的应用」，点击「创建新应用」</span>
          </p>
          <p className="flex gap-2">
            <span className="text-orange-400 font-bold shrink-0">3.</span>
            <span>添加 Key，服务平台选择「Web端(JS API)」</span>
          </p>
          <p className="flex gap-2">
            <span className="text-orange-400 font-bold shrink-0">4.</span>
            <span>在应用详情中找到「安全密钥」（可选，2021年12月后申请的Key需要配置）</span>
          </p>
          <p className="flex gap-2">
            <span className="text-orange-400 font-bold shrink-0">5.</span>
            <span>将 Key 和安全密钥分别填入上方输入框</span>
          </p>
        </div>
      </div>

      {canProceed && (
        <button
          onClick={() => navigate('/info')}
          className="w-full py-3 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors min-h-[48px] text-sm"
        >
          下一步：信息收集
        </button>
      )}

      {!canProceed && (
        <button
          onClick={() => navigate('/info')}
          className="w-full py-3 bg-zinc-800 text-zinc-400 font-medium rounded-xl hover:bg-zinc-700 transition-colors min-h-[48px] text-sm"
        >
          跳过，使用文本模式
        </button>
      )}
    </div>
  );
}
