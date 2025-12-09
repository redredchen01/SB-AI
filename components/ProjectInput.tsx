
import React, { useRef, useState } from 'react';
import { MOCK_SCRIPT } from '../constants';
import { Loader2, Wand2, Sparkles, Zap, ArrowUpRight, Settings, Upload, User, Map, AlertTriangle } from 'lucide-react';
import { ProjectData, ProjectContext } from '../types';

interface ProjectInputProps {
  text: string;
  onTextChange: (text: string) => void;
  onAnalyze: (text: string, usePro: boolean) => void;
  onImport: (data: ProjectData) => void;
  isAnalyzing: boolean;
  openSettings: () => void;
  projectContext?: ProjectContext;
  onOpenContext?: () => void;
}

const ProjectInput: React.FC<ProjectInputProps> = ({ 
    text, 
    onTextChange, 
    onAnalyze, 
    onImport, 
    isAnalyzing, 
    openSettings,
    projectContext,
    onOpenContext
}) => {
  const [usePro, setUsePro] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyzeClick = async () => {
      if (!text.trim()) return;
      onAnalyze(text, usePro);
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const json = JSON.parse(event.target?.result as string);
            onImport(json);
        } catch (error) {
            console.error("Invalid JSON", error);
            alert("檔案格式錯誤：請上傳有效的 .json 專案檔");
        }
        // Reset input so same file can be selected again if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const characterCount = projectContext?.characters.length || 0;
  const settingCount = projectContext?.settings.length || 0;

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-4 tracking-tight">
          StoryBoard AI <span className="text-2xl md:text-4xl text-white ml-2">分鏡大師</span>
        </h1>
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto">
          專為 TikTok/Reels 設計的直式動漫短影音生成工具。
          <br/>
          <button onClick={openSettings} className="text-sm text-blue-400 mt-2 inline-flex items-center gap-1 hover:underline">
             <Settings className="w-3 h-3" />
             請先至設定連接 API Key 以啟用完整功能
          </button>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Script Input */}
        <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-2 shadow-2xl flex flex-col">
            <div className="p-4 border-b border-slate-700/50 flex justify-between items-center">
                <span className="text-sm font-bold text-slate-300">劇本 / 小說文本</span>
                <div className="flex gap-3 text-xs">
                    <button
                        onClick={() => onTextChange(MOCK_SCRIPT)}
                        className="text-slate-400 hover:text-white transition-colors underline decoration-slate-600 underline-offset-4"
                    >
                        載入範例
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 group"
                    >
                        <Upload className="w-3 h-3 group-hover:text-blue-400" />
                        匯入 JSON
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept=".json" 
                        className="hidden" 
                    />
                </div>
            </div>
            <textarea
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="在此貼上您的小說內容... AI 將自動拆解為動漫分鏡。"
            className="w-full h-96 lg:h-[500px] bg-slate-900/50 text-slate-200 p-6 focus:outline-none resize-none font-serif leading-relaxed text-lg placeholder:text-slate-600"
            />
        </div>

        {/* Right Column: Pre-production & Actions */}
        <div className="space-y-6">
            
            {/* Context Setup Card */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <User className="w-24 h-24 text-blue-400" />
                </div>
                
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-400" />
                    前期製作設定 (必要)
                </h3>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                    為了保持角色與場景的一致性，請先設定角色名稱與參考圖。AI 生成圖片時將會自動參考這些設定。
                </p>

                {/* Status Indicators */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700/50 flex flex-col items-center">
                        <span className="text-2xl font-bold text-white">{characterCount}</span>
                        <span className="text-xs text-slate-500">登場角色</span>
                    </div>
                    <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700/50 flex flex-col items-center">
                        <span className="text-2xl font-bold text-white">{settingCount}</span>
                        <span className="text-xs text-slate-500">世界觀設定</span>
                    </div>
                </div>

                {/* Character Preview Avatars */}
                {projectContext?.characters && projectContext.characters.length > 0 && (
                     <div className="flex -space-x-2 mb-6 justify-center">
                        {projectContext.characters.slice(0, 5).map(char => (
                            <div key={char.id} className="w-8 h-8 rounded-full border-2 border-slate-800 overflow-hidden bg-slate-700" title={char.name}>
                                {char.imageUrl ? (
                                    <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs text-white bg-blue-600 font-bold">
                                        {char.name[0]}
                                    </div>
                                )}
                            </div>
                        ))}
                        {projectContext.characters.length > 5 && (
                             <div className="w-8 h-8 rounded-full border-2 border-slate-800 bg-slate-700 flex items-center justify-center text-[10px] text-white">
                                +{projectContext.characters.length - 5}
                             </div>
                        )}
                     </div>
                )}

                <button 
                    onClick={onOpenContext}
                    className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold text-sm transition-colors border border-slate-600 flex items-center justify-center gap-2"
                >
                    <Settings className="w-4 h-4" />
                    設定角色與世界觀
                </button>
            </div>

            {/* Action Card */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 shadow-xl">
                 <div className="mb-6">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">分析模式</label>
                    <div className="bg-slate-950 p-1 rounded-xl flex items-center border border-slate-800">
                        <button
                            onClick={() => setUsePro(false)}
                            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${!usePro ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <Zap className="w-3 h-3" />
                            快速 (Flash)
                        </button>
                        <button
                            onClick={() => setUsePro(true)}
                            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${usePro ? 'bg-purple-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <Sparkles className="w-3 h-3" />
                            深度 (Pro)
                        </button>
                    </div>
                </div>

                {characterCount === 0 && (
                     <div className="mb-4 flex gap-2 items-start bg-yellow-900/20 border border-yellow-700/30 p-3 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <p className="text-[10px] text-yellow-200/80 leading-tight">
                            建議先建立至少一位角色，以確保 AI 生成的圖片連貫一致。
                        </p>
                     </div>
                )}

                <button
                    onClick={handleAnalyzeClick}
                    disabled={isAnalyzing || !text.trim()}
                    className={`w-full flex flex-col items-center justify-center gap-1 px-8 py-4 rounded-xl font-bold text-white transition-all transform hover:scale-[1.02] active:scale-[0.98]
                    ${isAnalyzing 
                        ? 'bg-slate-600 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg hover:shadow-purple-500/25'
                    }`}
                >
                    {isAnalyzing ? (
                    <>
                        <Loader2 className="w-6 h-6 animate-spin mb-1" />
                        <span className="text-sm">AI 正在拆解劇本...</span>
                    </>
                    ) : (
                    <>
                        <div className="flex items-center gap-2">
                            <Wand2 className="w-5 h-5" />
                            <span className="text-lg">生成分鏡表</span>
                        </div>
                        <span className="text-[10px] opacity-70 font-normal">Generate Storyboard</span>
                    </>
                    )}
                </button>
            </div>

        </div>
      </div>
    </div>
  );
};

export default ProjectInput;
