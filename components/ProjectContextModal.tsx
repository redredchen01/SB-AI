
import React, { useState, useRef } from 'react';
import { ProjectContext, Character, WorldSetting } from '../types';
import { X, Plus, User, Map, Trash2, Save, Upload, Image as ImageIcon } from 'lucide-react';

interface ProjectContextModalProps {
  context: ProjectContext;
  onUpdate: (context: ProjectContext) => void;
  isOpen: boolean;
  onClose: () => void;
}

const ProjectContextModal: React.FC<ProjectContextModalProps> = ({ context, onUpdate, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'characters' | 'settings'>('characters');

  if (!isOpen) return null;

  const addCharacter = () => {
    const newChar: Character = {
      id: crypto.randomUUID(),
      name: "新角色",
      description: ""
    };
    onUpdate({
      ...context,
      characters: [...context.characters, newChar]
    });
  };

  const updateCharacter = (id: string, field: keyof Character, value: string) => {
    onUpdate({
      ...context,
      characters: context.characters.map(c => c.id === id ? { ...c, [field]: value } : c)
    });
  };

  const handleImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        updateCharacter(id, 'imageUrl', event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeCharacter = (id: string) => {
    onUpdate({
      ...context,
      characters: context.characters.filter(c => c.id !== id)
    });
  };

  const addSetting = () => {
    const newSetting: WorldSetting = {
      id: crypto.randomUUID(),
      name: "新場景/設定",
      description: ""
    };
    onUpdate({
      ...context,
      settings: [...context.settings, newSetting]
    });
  };

  const updateSetting = (id: string, field: keyof WorldSetting, value: string) => {
    onUpdate({
      ...context,
      settings: context.settings.map(s => s.id === id ? { ...s, [field]: value } : s)
    });
  };

  const removeSetting = (id: string) => {
    onUpdate({
      ...context,
      settings: context.settings.filter(s => s.id !== id)
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-850 rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">導演筆記：設定集</h2>
            <p className="text-sm text-slate-400">定義角色外觀與世界觀，讓 AI 生成的畫面更連貫。</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex border-b border-slate-800">
             <button 
                onClick={() => setActiveTab('characters')}
                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'characters' ? 'border-blue-500 text-blue-400 bg-slate-800/50' : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
                <User className="w-4 h-4" /> 角色設定 (Character Sheets)
            </button>
            <button 
                onClick={() => setActiveTab('settings')}
                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'settings' ? 'border-green-500 text-green-400 bg-slate-800/50' : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
                <Map className="w-4 h-4" /> 世界觀與場景 (World Building)
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {activeTab === 'characters' ? (
                <div className="space-y-4">
                    {context.characters.length === 0 && (
                        <div className="text-center py-12 text-slate-600 border-2 border-dashed border-slate-800 rounded-xl">
                            <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>尚未建立角色</p>
                            <button onClick={addCharacter} className="mt-4 text-blue-400 hover:text-blue-300 text-sm font-bold underline">
                                立即新增主角
                            </button>
                        </div>
                    )}
                    {context.characters.map((char) => (
                        <div key={char.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex gap-4 items-start group hover:border-blue-500/30 transition-colors">
                            {/* Character Image Upload */}
                            <div className="flex-shrink-0 relative w-20 h-20 bg-slate-700 rounded-lg overflow-hidden border border-slate-600 group-hover:border-blue-500 transition-colors">
                                {char.imageUrl ? (
                                    <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                                        <User className="w-8 h-8 opacity-50" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                                    <label className="cursor-pointer flex flex-col items-center">
                                        <Upload className="w-4 h-4 text-white mb-1" />
                                        <span className="text-[8px] text-white">上傳參考圖</span>
                                        <input 
                                            type="file" 
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(char.id, e)} 
                                            className="hidden" 
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="flex-1 space-y-3">
                                <input 
                                    type="text" 
                                    value={char.name}
                                    onChange={(e) => updateCharacter(char.id, 'name', e.target.value)}
                                    placeholder="角色名稱 (例如: 賽佛)"
                                    className="bg-transparent text-lg font-bold text-white placeholder:text-slate-600 focus:outline-none w-full border-b border-transparent focus:border-blue-500"
                                />
                                <textarea 
                                    value={char.description}
                                    onChange={(e) => updateCharacter(char.id, 'description', e.target.value)}
                                    placeholder="外觀描述 (例如: 銀色短髮，穿著紅色風衣，右眼是藍色義眼...)"
                                    className="w-full bg-slate-900/50 rounded-lg p-3 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[80px] resize-none"
                                />
                            </div>
                            <button 
                                onClick={() => removeCharacter(char.id)}
                                className="p-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    <button 
                        onClick={addCharacter}
                        className="w-full py-3 border-2 border-dashed border-slate-700 hover:border-blue-500/50 rounded-xl text-slate-500 hover:text-blue-400 font-bold transition-all flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> 新增角色
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                     {context.settings.length === 0 && (
                        <div className="text-center py-12 text-slate-600 border-2 border-dashed border-slate-800 rounded-xl">
                            <Map className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>尚未建立場景</p>
                        </div>
                    )}
                    {context.settings.map((setting) => (
                        <div key={setting.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex gap-4 items-start group hover:border-green-500/30 transition-colors">
                            <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0 text-slate-400">
                                <Map className="w-6 h-6" />
                            </div>
                            <div className="flex-1 space-y-3">
                                <input 
                                    type="text" 
                                    value={setting.name}
                                    onChange={(e) => updateSetting(setting.id, 'name', e.target.value)}
                                    placeholder="場景名稱 (例如: 新東京貧民窟)"
                                    className="bg-transparent text-lg font-bold text-white placeholder:text-slate-600 focus:outline-none w-full border-b border-transparent focus:border-green-500"
                                />
                                <textarea 
                                    value={setting.description}
                                    onChange={(e) => updateSetting(setting.id, 'description', e.target.value)}
                                    placeholder="氛圍描述 (例如: 總是下著酸雨，霓虹燈閃爍，充滿蒸氣與鐵鏽味...)"
                                    className="w-full bg-slate-900/50 rounded-lg p-3 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-green-500 min-h-[80px] resize-none"
                                />
                            </div>
                            <button 
                                onClick={() => removeSetting(setting.id)}
                                className="p-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    <button 
                        onClick={addSetting}
                        className="w-full py-3 border-2 border-dashed border-slate-700 hover:border-green-500/50 rounded-xl text-slate-500 hover:text-green-400 font-bold transition-all flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> 新增場景
                    </button>
                </div>
            )}
        </div>
        
        <div className="p-4 border-t border-slate-800 flex justify-end">
            <button 
                onClick={onClose}
                className="flex items-center gap-2 bg-slate-100 hover:bg-white text-slate-900 px-6 py-2.5 rounded-xl font-bold transition-colors"
            >
                <Save className="w-4 h-4" />
                儲存設定
            </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectContextModal;
