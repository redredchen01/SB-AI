
import React, { useState, useEffect } from 'react';
import { X, Key, ShieldCheck, ExternalLink, CheckCircle2, AlertCircle, Zap } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [hasKey, setHasKey] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const checkStatus = async () => {
    setIsChecking(true);
    try {
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const status = await window.aistudio.hasSelectedApiKey();
        setHasKey(status);
      } else {
        // Fallback for dev environments where env var might be present but aistudio obj is not
        setHasKey(!!process.env.API_KEY);
      }
    } catch (e) {
      console.error("Failed to check API key status", e);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkStatus();
    }
  }, [isOpen]);

  const handleConnectKey = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
      try {
        await window.aistudio.openSelectKey();
        // Wait a tick for the state to update internally then check
        setTimeout(checkStatus, 500);
      } catch (e) {
        console.error("Failed to open key selector", e);
      }
    } else {
        alert("此環境不支援動態 API Key 選擇。請確認環境變數已設定。");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-850">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            系統設定
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
            
            {/* API Key Section */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${hasKey ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            <Key className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">Google Gemini API 金鑰</h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                                {isChecking ? "檢查中..." : hasKey ? "已連接付費帳戶" : "尚未連接"}
                            </p>
                        </div>
                    </div>
                    {hasKey && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                </div>

                <div className="text-sm text-slate-300 leading-relaxed mb-4">
                    本服務是一個 API 驅動的工具。為了使用 <strong>Veo 影片生成</strong> 與 <strong>Pro 深度分析</strong> 功能，您必須連接一個付費的 Google Cloud 專案 API Key。
                </div>

                <button 
                    onClick={handleConnectKey}
                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                        hasKey 
                        ? 'bg-slate-700 hover:bg-slate-600 text-white' 
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
                    }`}
                >
                    {hasKey ? '切換 API Key' : '立即連接 API Key'}
                </button>

                {!hasKey && (
                    <div className="flex items-start gap-2 mt-4 text-xs text-yellow-500/80 bg-yellow-900/10 p-3 rounded-lg border border-yellow-700/30">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <p>若未設定 Key，您可能無法使用影片生成功能，且分析次數將受限。</p>
                    </div>
                )}
            </div>

            {/* Billing Info Link */}
            <a 
                href="https://ai.google.dev/gemini-api/docs/billing" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-between p-4 rounded-xl border border-slate-700 hover:border-slate-500 hover:bg-slate-800/50 transition-all group"
            >
                <div className="flex items-center gap-3 text-slate-400 group-hover:text-white">
                    <ShieldCheck className="w-5 h-5" />
                    <span className="text-sm font-medium">查看計費與額度說明</span>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-white" />
            </a>

            <div className="text-center text-[10px] text-slate-600">
                StoryBoard AI v1.0 • Powered by Google Gemini
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
