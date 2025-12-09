
import React, { useState, useEffect, useRef } from 'react';
import { Scene, ProjectContext } from '../types';
import { X, Wand2, Play, Image as ImageIcon, Save, RefreshCw, Video, Film, Mic, AlignLeft, Sparkles, Volume2, Pause, Copy, Check, Smartphone, ChevronLeft, ChevronRight, User, Music, Speaker } from 'lucide-react';
import { generateSceneImage, generateSceneVideo, refineSceneText, generateSpeech, optimizeVideoPrompt, generateSoundDesign } from '../services/gemini';
import { CAMERA_ANGLES } from '../constants';

interface SceneEditorProps {
  scene: Scene;
  allScenes?: Scene[]; // Optional for backward compatibility, but required for navigation
  projectContext?: ProjectContext;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedScene: Scene) => void;
  onNavigate?: (scene: Scene) => void;
}

const SceneEditor: React.FC<SceneEditorProps> = ({ scene, allScenes, projectContext, isOpen, onClose, onUpdate, onNavigate }) => {
  const [editedScene, setEditedScene] = useState<Scene>(scene);
  const [activeTab, setActiveTab] = useState<'visual' | 'audio' | 'script'>('visual');
  
  // Animation state
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  
  // Loading states
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isAnalyzingSound, setIsAnalyzingSound] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [refineInstruction, setRefineInstruction] = useState("");
  
  // Video Prompt Optimization State
  const [videoPromptInstruction, setVideoPromptInstruction] = useState("");
  const [isOptimizingPrompt, setIsOptimizingPrompt] = useState(false);

  const [copied, setCopied] = useState(false);
  
  // Audio playback
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  
  // Video key check helper
  const checkApiKey = async () => {
    if ((window as any).aistudio && (window as any).aistudio.hasSelectedApiKey) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (!hasKey && (window as any).aistudio.openSelectKey) {
            await (window as any).aistudio.openSelectKey();
            return await (window as any).aistudio.hasSelectedApiKey();
        }
        return hasKey;
    }
    return true; // Fallback for dev/mock envs
  };

  useEffect(() => {
    setEditedScene(scene);
    // Reset audio state when scene changes
    setIsPlayingAudio(false); 
  }, [scene]);

  if (!isOpen) return null;

  // Navigation Logic
  const currentIndex = allScenes ? allScenes.findIndex(s => s.id === scene.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = allScenes ? currentIndex < allScenes.length - 1 : false;

  const handleNavigate = (direction: 'prev' | 'next') => {
      if (!allScenes || !onNavigate) return;
      
      const targetIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
      const targetScene = allScenes[targetIndex];
      
      if (targetScene) {
          setSlideDirection(direction === 'next' ? 'right' : 'left');
          onNavigate(targetScene);
      }
  };

  const handleGenerateImage = async () => {
    setIsGeneratingImage(true);
    try {
      // Pass the explicit activeCharacterIds to the service
      const base64Image = await generateSceneImage(
        editedScene.visualDescription, 
        "anime style", 
        projectContext,
        editedScene.activeCharacterIds // New
      );
      const updated = { ...editedScene, imageUrl: base64Image };
      setEditedScene(updated);
      onUpdate(updated);
    } catch (e) {
      alert("圖片生成失敗，可能觸發了安全過濾或網路問題。");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleGenerateVideo = async () => {
    const hasKey = await checkApiKey();
    if (!hasKey) return;

    setIsGeneratingVideo(true);
    try {
        // Use videoPrompt if available, otherwise visualDescription
        const promptToUse = editedScene.videoPrompt || editedScene.visualDescription;
        const videoUrl = await generateSceneVideo(promptToUse);
        const updated = { ...editedScene, videoUrl };
        setEditedScene(updated);
        onUpdate(updated);
    } catch (e) {
        alert("影片生成失敗 (Veo)。請確認您已選擇付費 API Key。");
    } finally {
        setIsGeneratingVideo(false);
    }
  };

  const handleGenerateAudio = async () => {
    if (!editedScene.narration) return;
    setIsGeneratingAudio(true);
    try {
        const audioUrl = await generateSpeech(editedScene.narration);
        const updated = { ...editedScene, audioUrl };
        setEditedScene(updated);
        onUpdate(updated);
    } catch (e) {
        alert("語音生成失敗。");
    } finally {
        setIsGeneratingAudio(false);
    }
  };

  const handleAnalyzeSoundDesign = async () => {
      setIsAnalyzingSound(true);
      try {
          const { bgmPrompt, sfxList } = await generateSoundDesign(
              editedScene.visualDescription,
              editedScene.bgm || "Anime style"
          );
          const updated = {
              ...editedScene,
              bgm: bgmPrompt,
              soundEffects: sfxList
          };
          setEditedScene(updated);
          onUpdate(updated);
      } catch (e) {
          console.error(e);
      } finally {
          setIsAnalyzingSound(false);
      }
  }

  const toggleAudioPlay = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
        audioRef.current.pause();
    } else {
        audioRef.current.play();
    }
    setIsPlayingAudio(!isPlayingAudio);
  };

  const handleRefineText = async (field: 'visualDescription' | 'narration') => {
      if (!refineInstruction) return;
      setIsRefining(true);
      try {
          const newText = await refineSceneText(String(editedScene[field]), refineInstruction);
          const updated = { ...editedScene, [field]: newText };
          setEditedScene(updated);
          onUpdate(updated);
          setRefineInstruction("");
      } catch (e) {
          console.error(e);
      } finally {
          setIsRefining(false);
      }
  }

  const handleOptimizeVideoPrompt = async () => {
      setIsOptimizingPrompt(true);
      try {
          const currentText = editedScene.videoPrompt || editedScene.visualDescription;
          const optimized = await optimizeVideoPrompt(currentText, videoPromptInstruction);
          
          const updated = { ...editedScene, videoPrompt: optimized };
          setEditedScene(updated);
          onUpdate(updated);
          setVideoPromptInstruction(""); // clear input
      } catch (e) {
          console.error(e);
      } finally {
          setIsOptimizingPrompt(false);
      }
  }

  const toggleActiveCharacter = (charId: string) => {
    const currentIds = editedScene.activeCharacterIds || [];
    let newIds;
    if (currentIds.includes(charId)) {
        newIds = currentIds.filter(id => id !== charId);
    } else {
        newIds = [...currentIds, charId];
    }
    const updated = { ...editedScene, activeCharacterIds: newIds };
    setEditedScene(updated);
    onUpdate(updated);
  };

  const handleChange = (field: keyof Scene, value: any) => {
    const updated = { ...editedScene, [field]: value };
    setEditedScene(updated);
    onUpdate(updated);
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-2xl bg-slate-900 h-full border-l border-slate-700 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900 z-10">
          <div className="flex items-center gap-4">
               {/* Navigation Buttons */}
               <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
                    <button 
                        onClick={() => handleNavigate('prev')} 
                        disabled={!hasPrev}
                        className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="上一景"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => handleNavigate('next')} 
                        disabled={!hasNext}
                        className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="下一景"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
               </div>
              
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <span className="bg-blue-600 text-xs px-2 py-1 rounded font-mono">SHOT {editedScene.order}</span>
                <span className="hidden sm:inline">豎屏編輯器</span>
              </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/50">
            <button 
                onClick={() => setActiveTab('visual')}
                className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'visual' ? 'border-blue-500 text-blue-400 bg-slate-800/50' : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
                <Video className="w-4 h-4" /> 畫面與影片
            </button>
            <button 
                onClick={() => setActiveTab('audio')}
                className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'audio' ? 'border-purple-500 text-purple-400 bg-slate-800/50' : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
                <Mic className="w-4 h-4" /> 聲音與節奏
            </button>
            <button 
                onClick={() => setActiveTab('script')}
                className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'script' ? 'border-green-500 text-green-400 bg-slate-800/50' : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
                <AlignLeft className="w-4 h-4" /> 文本與分析
            </button>
        </div>

        {/* Scrollable Content with Transition Animation */}
        <div 
            key={editedScene.id} 
            className={`flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar animate-in fade-in duration-500 ${slideDirection === 'right' ? 'slide-in-from-right-8' : 'slide-in-from-left-8'}`}
        >
          
          {/* VISUAL TAB */}
          {activeTab === 'visual' && (
              <div className="space-y-6">
                {/* Media Preview Area */}
                <div className="space-y-3 flex flex-col items-center">
                    <div className="flex items-center justify-between w-full">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                             <Smartphone className="w-3 h-3" />
                             視覺預覽 (9:16)
                        </label>
                        <div className="flex gap-2">
                             <button 
                                onClick={handleGenerateImage}
                                disabled={isGeneratingImage || isGeneratingVideo}
                                className="flex items-center gap-2 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                >
                                {isGeneratingImage ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" />}
                                生成動漫圖
                            </button>
                            <button 
                                onClick={handleGenerateVideo}
                                disabled={isGeneratingImage || isGeneratingVideo}
                                className="flex items-center gap-2 text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg transition-colors shadow-lg shadow-purple-900/20 disabled:opacity-50"
                                >
                                {isGeneratingVideo ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Film className="w-3 h-3" />}
                                生成影片 (Veo)
                            </button>
                        </div>
                    </div>
                    
                    {/* Vertical Preview Container */}
                    <div className="aspect-[9/16] w-[270px] bg-black rounded-xl border-2 border-dashed border-slate-700 flex items-center justify-center overflow-hidden relative group shadow-2xl">
                    {editedScene.videoUrl ? (
                        <video src={editedScene.videoUrl} controls className="w-full h-full object-cover" />
                    ) : editedScene.imageUrl ? (
                        <img src={editedScene.imageUrl} alt="Scene" className="w-full h-full object-cover" />
                    ) : (
                        <div className="text-center p-8 text-slate-600 flex flex-col items-center">
                            <Smartphone className="w-8 h-8 mb-3 opacity-30" />
                            <p className="text-sm">尚未生成影像</p>
                            <p className="text-xs opacity-50 mt-1">比例 9:16</p>
                        </div>
                    )}
                    
                    {/* Loading Overlay */}
                    {(isGeneratingImage || isGeneratingVideo) && (
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
                            <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mb-3" />
                            <p className="text-sm text-blue-200 font-medium animate-pulse text-center px-4">
                                {isGeneratingVideo ? "Veo 正在製作豎屏影片中 (需約 1-2 分鐘)..." : "正在繪製動漫分鏡圖..."}
                            </p>
                        </div>
                    )}
                    </div>
                </div>

                {/* Character Selection */}
                {projectContext?.characters && projectContext.characters.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs text-slate-500 flex items-center gap-1">
                      <User className="w-3 h-3" /> 
                      登場角色 (Active Cast) - 點擊以確保一致性
                    </label>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
                      {projectContext.characters.map((char) => {
                        const isActive = editedScene.activeCharacterIds?.includes(char.id);
                        return (
                          <div 
                            key={char.id}
                            onClick={() => toggleActiveCharacter(char.id)}
                            className={`flex flex-col items-center gap-1 cursor-pointer group flex-shrink-0 transition-all ${isActive ? 'opacity-100 scale-105' : 'opacity-50 hover:opacity-80'}`}
                          >
                            <div className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-colors ${isActive ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-slate-700'}`}>
                              {char.imageUrl ? (
                                <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                  <User className="w-5 h-5 text-slate-500" />
                                </div>
                              )}
                            </div>
                            <span className={`text-[10px] font-bold ${isActive ? 'text-blue-400' : 'text-slate-500'}`}>
                              {char.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Visual Description */}
                <div className="space-y-2">
                    <label className="text-xs text-slate-500">畫面描述 (Prompt) - 請強調豎構圖</label>
                    <textarea 
                        value={editedScene.visualDescription}
                        onChange={(e) => handleChange('visualDescription', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none resize-none h-24 leading-relaxed"
                        placeholder="例如：從下往上仰視，角色站在高樓邊緣，風吹動衣角，背景是巨大的月亮..."
                    />
                </div>

                {/* Video Prompt (New Field) */}
                <div className="space-y-2 bg-purple-900/10 border border-purple-500/20 rounded-xl p-4">
                     <div className="flex items-center justify-between mb-2">
                         <label className="text-xs text-purple-400 font-bold flex items-center gap-1">
                            <Film className="w-3 h-3" />
                            影片生成專用提示詞 (Video Prompt)
                         </label>
                         <button 
                            onClick={() => copyToClipboard(editedScene.videoPrompt || "")}
                            className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2 py-1 rounded"
                         >
                            {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                            複製
                         </button>
                     </div>
                    
                    <textarea 
                        value={editedScene.videoPrompt || ""}
                        onChange={(e) => handleChange('videoPrompt', e.target.value)}
                        className="w-full bg-slate-900/50 border border-purple-500/30 rounded-lg p-3 text-sm text-slate-300 focus:ring-1 focus:ring-purple-500 outline-none resize-none h-24 font-mono leading-relaxed"
                        placeholder="請確保包含 'vertical video', '9:16', 'anime style' 等關鍵字。"
                    />
                    
                    {/* AI Optimization Toolbar */}
                    <div className="flex gap-2 mt-2">
                        <input 
                            type="text"
                            value={videoPromptInstruction}
                            onChange={(e) => setVideoPromptInstruction(e.target.value)}
                            placeholder="指令：例如『增加速度線』、『眼神光』、『粒子特效』..."
                            className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                        />
                         <button 
                            onClick={handleOptimizeVideoPrompt}
                            disabled={isOptimizingPrompt}
                            className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                        >
                            {isOptimizingPrompt ? <Sparkles className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                            AI 優化提示詞
                        </button>
                    </div>

                    <div className="text-[10px] text-slate-500 mt-2">
                        點擊優化後，AI 會自動將提示詞改寫為適合 Veo 的高品質豎屏動漫 Prompt。
                    </div>
                </div>

                 <div className="space-y-2">
                    <label className="text-xs text-slate-500">動漫運鏡 (Camera)</label>
                    <select 
                        value={editedScene.cameraAngle}
                        onChange={(e) => handleChange('cameraAngle', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                        {CAMERA_ANGLES.map(angle => (
                            <option key={angle} value={angle}>{angle}</option>
                        ))}
                    </select>
                </div>
              </div>
          )}

          {/* AUDIO TAB */}
          {activeTab === 'audio' && (
              <div className="space-y-6">
                  {/* TTS Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                         <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">配音台詞 (TTS)</label>
                         <button
                            onClick={handleGenerateAudio}
                            disabled={isGeneratingAudio || !editedScene.narration}
                            className="text-xs flex items-center gap-1.5 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 px-3 py-1 rounded transition-colors"
                         >
                             {isGeneratingAudio ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Volume2 className="w-3 h-3" />}
                             生成日系語音
                         </button>
                    </div>
                    
                    <textarea 
                        value={editedScene.narration}
                        onChange={(e) => handleChange('narration', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-4 text-base text-slate-200 focus:ring-1 focus:ring-purple-500 outline-none resize-none h-40 font-serif leading-loose"
                        placeholder="輸入角色的內心獨白或對白..."
                    />

                    {editedScene.audioUrl && (
                        <div className="bg-slate-800 rounded-lg p-3 flex items-center gap-3 border border-slate-700">
                            <button 
                                onClick={toggleAudioPlay}
                                className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center hover:bg-purple-500 transition-colors"
                            >
                                {isPlayingAudio ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
                            </button>
                            <div className="flex-1">
                                <p className="text-xs text-slate-400 mb-1">AI 語音試聽</p>
                                <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                                    <div className={`h-full bg-purple-500 ${isPlayingAudio ? 'animate-pulse w-full' : 'w-0'}`}></div>
                                </div>
                            </div>
                            <audio 
                                ref={audioRef} 
                                src={editedScene.audioUrl} 
                                onEnded={() => setIsPlayingAudio(false)} 
                                onPause={() => setIsPlayingAudio(false)}
                                className="hidden" 
                            />
                        </div>
                    )}
                 </div>

                 {/* Sound Design Section */}
                 <div className="border-t border-slate-800 pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                         <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                             <Music className="w-4 h-4" />
                             聲音設計 (Sound Design)
                         </label>
                         <button
                            onClick={handleAnalyzeSoundDesign}
                            disabled={isAnalyzingSound}
                            className="text-xs flex items-center gap-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 px-3 py-1 rounded transition-colors"
                         >
                             {isAnalyzingSound ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                             AI 音效設計師
                         </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs text-slate-500 flex justify-between">
                                BGM 提示詞 (Music Prompt)
                                <button onClick={() => copyToClipboard(editedScene.bgm)} className="text-[10px] text-blue-400 hover:text-blue-300">複製</button>
                            </label>
                            <textarea 
                                value={editedScene.bgm}
                                onChange={(e) => handleChange('bgm', e.target.value)}
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-xs text-slate-300 focus:ring-1 focus:ring-blue-500 outline-none resize-none h-32 leading-relaxed"
                                placeholder="點擊上方按鈕，讓 AI 生成適合 Suno/Udio 的專業音樂提示詞..."
                            />
                        </div>
                        <div className="space-y-2">
                             <label className="text-xs text-slate-500 flex items-center gap-2">
                                <Speaker className="w-3 h-3" />
                                建議音效 (SFX List)
                             </label>
                             <div className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 h-32 overflow-y-auto space-y-1">
                                {editedScene.soundEffects && editedScene.soundEffects.length > 0 ? (
                                    editedScene.soundEffects.map((sfx, idx) => (
                                        <div key={idx} className="text-xs text-slate-300 flex items-center gap-2 bg-slate-800/50 p-1.5 rounded">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                            {sfx}
                                        </div>
                                    ))
                                ) : (
                                    <span className="text-xs text-slate-600 italic">尚未生成音效列表...</span>
                                )}
                             </div>
                        </div>
                    </div>
                 </div>

                 <div className="space-y-2 pt-4 border-t border-slate-800">
                     <label className="text-xs text-slate-500">鏡頭持續時間 (秒)</label>
                    <input 
                        type="number" 
                        value={editedScene.duration}
                        onChange={(e) => handleChange('duration', Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:ring-1 focus:ring-purple-500 outline-none"
                    />
                 </div>
              </div>
          )}

          {/* SCRIPT TAB */}
          {activeTab === 'script' && (
              <div className="space-y-6">
                  <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">原始小說文本片段</label>
                      <div className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm text-slate-300 leading-relaxed font-serif min-h-[150px]">
                          {editedScene.script}
                      </div>
                  </div>
                  
                  <div className="bg-blue-900/20 border border-blue-500/20 rounded-xl p-4">
                      <h4 className="text-blue-400 text-sm font-bold mb-2 flex items-center gap-2">
                          <Sparkles className="w-4 h-4" /> 
                          動漫分鏡分析
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                          AI 已根據 9:16 豎屏構圖與動漫節奏進行分析。建議您檢查「畫面描述」是否充分利用垂直空間（例如：天空的留白、角色的全身構圖）。
                      </p>
                  </div>
              </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-between items-center z-10">
            <span className="text-xs text-slate-500 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                自動儲存中
            </span>
            <button 
                onClick={onClose}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20"
            >
                <Save className="w-4 h-4" />
                完成編輯
            </button>
        </div>
      </div>
    </div>
  );
};

export default SceneEditor;
    