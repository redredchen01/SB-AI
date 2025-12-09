
import React, { useState, useEffect } from 'react';
import { ViewMode, Scene, ProjectContext, ProjectData } from './types';
import ProjectInput from './components/ProjectInput';
import SceneCard from './components/SceneCard';
import SceneEditor from './components/SceneEditor';
import TimelineChart from './components/TimelineChart';
import ProjectContextModal from './components/ProjectContextModal';
import SettingsModal from './components/SettingsModal';
import { analyzeScriptWithGemini, generateSceneImage, generateSpeech } from './services/gemini';
import { MOCK_SCRIPT, ANIME_STYLES } from './constants';
import { Clapperboard, Download, LayoutGrid, List as ListIcon, Plus, BookOpen, Settings, ArchiveRestore, XCircle, Trash2, Image as ImageIcon, Loader2, Smartphone, Mic, Volume2 } from 'lucide-react';

const AUTOSAVE_KEY = 'storyboard_autosave_v1';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.INPUT);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [scriptText, setScriptText] = useState(MOCK_SCRIPT);
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isListView, setIsListView] = useState(false);
  
  // Context & Settings
  const [projectContext, setProjectContext] = useState<ProjectContext>({
      characters: [],
      settings: [],
      artStyleId: 'cinematic'
  });
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Batch Generation State
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{current: number, total: number} | null>(null);

  const [isBatchGeneratingAudio, setIsBatchGeneratingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState<{current: number, total: number} | null>(null);

  // Auto-save State
  const [hasSavedData, setHasSavedData] = useState(false);
  const [savedTimestamp, setSavedTimestamp] = useState<number | null>(null);

  // 1. Check for autosave on mount
  useEffect(() => {
    const saved = localStorage.getItem(AUTOSAVE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const hasScenes = parsed.scenes && parsed.scenes.length > 0;
        const hasContext = parsed.context && (parsed.context.characters.length > 0 || parsed.context.settings.length > 0);
        const hasText = parsed.scriptText && parsed.scriptText !== MOCK_SCRIPT && parsed.scriptText.trim().length > 0;

        if (hasScenes || hasContext || hasText) {
          setHasSavedData(true);
          setSavedTimestamp(parsed.timestamp);
        }
      } catch (e) {
        console.error("Autosave load error", e);
      }
    }
  }, []);

  // 2. Auto-save logic
  useEffect(() => {
    const hasScenes = scenes.length > 0;
    const hasContext = projectContext.characters.length > 0 || projectContext.settings.length > 0;
    const hasText = scriptText !== MOCK_SCRIPT && scriptText.trim().length > 0;

    const hasData = hasScenes || hasContext || hasText;
    
    if (hasData) {
      const timer = setTimeout(() => {
        const dataToSave: ProjectData & { viewMode: ViewMode, timestamp: number } = {
          scenes,
          context: projectContext,
          scriptText,
          viewMode: scenes.length > 0 ? ViewMode.BOARD : ViewMode.INPUT,
          timestamp: Date.now()
        };
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(dataToSave));
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [scenes, projectContext, scriptText]);

  const restoreProject = () => {
    try {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (!saved) return;
      
      const parsed = JSON.parse(saved);
      
      if (parsed.context) setProjectContext(parsed.context);
      if (parsed.scenes) setScenes(parsed.scenes);
      if (parsed.scriptText) setScriptText(parsed.scriptText);
      
      if (parsed.viewMode === ViewMode.BOARD && parsed.scenes && parsed.scenes.length > 0) {
        setViewMode(ViewMode.BOARD);
      } else {
        setViewMode(ViewMode.INPUT);
      }
      
      setHasSavedData(false);
    } catch (e) {
      console.error("Restore failed", e);
      alert("讀取存檔失敗");
    }
  };

  const discardSave = () => {
    if (confirm("確定要捨棄未儲存的進度嗎？此動作無法復原。")) {
      localStorage.removeItem(AUTOSAVE_KEY);
      setHasSavedData(false);
    }
  };

  const handleAnalyze = async (text: string, usePro: boolean) => {
    setIsAnalyzing(true);
    try {
      const generatedScenes = await analyzeScriptWithGemini(text, usePro, projectContext);
      setScenes(generatedScenes);
      setViewMode(ViewMode.BOARD);
    } catch (error) {
      console.error(error);
      alert("分析失敗。請確認您的 API Key 是否正確，或稍後再試。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImportProject = (data: ProjectData) => {
    try {
      if (data.context) setProjectContext(data.context);
      if (data.scriptText) setScriptText(data.scriptText);
      if (data.scenes && Array.isArray(data.scenes)) {
        setScenes(data.scenes);
        if (data.scenes.length > 0) {
          setViewMode(ViewMode.BOARD);
        } else {
          setViewMode(ViewMode.INPUT);
        }
      }
      alert("專案匯入成功！");
    } catch (e) {
      console.error("Import failed", e);
      alert("專案匯入失敗：檔案格式錯誤");
    }
  }

  const handleSceneUpdate = (updatedScene: Scene) => {
    setScenes(prev => prev.map(s => s.id === updatedScene.id ? updatedScene : s));
    if (selectedScene?.id === updatedScene.id) {
        setSelectedScene(updatedScene);
    }
  };

  const handleBatchGenerateImages = async () => {
    const scenesToGenerate = scenes.filter(s => !s.imageUrl);
    
    if (scenesToGenerate.length === 0) {
      if (confirm("所有鏡頭都已有圖片。是否要重新生成所有圖片？")) {
         // Proceed with all scenes
      } else {
        return;
      }
    }

    const targetScenes = scenesToGenerate.length > 0 ? scenesToGenerate : scenes;
    
    setIsBatchGenerating(true);
    setGenerationProgress({ current: 0, total: targetScenes.length });

    const currentStyleId = projectContext.artStyleId || 'cinematic';
    const styleModifier = ANIME_STYLES.find(s => s.id === currentStyleId)?.promptModifier || 'anime style';

    // Process sequentially to avoid rate limits
    for (let i = 0; i < targetScenes.length; i++) {
        const scene = targetScenes[i];
        try {
            // Pass projectContext for character consistency
            const imageUrl = await generateSceneImage(scene.visualDescription, styleModifier, projectContext);
            
            setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, imageUrl } : s));
            setGenerationProgress(prev => prev ? { ...prev, current: i + 1 } : null);
            
            await new Promise(resolve => setTimeout(resolve, 500)); 
            
        } catch (error) {
            console.error(`Failed to generate image for scene ${scene.order}`, error);
        }
    }

    setIsBatchGenerating(false);
    setGenerationProgress(null);
  };

  const handleBatchGenerateAudio = async () => {
    const scenesToGenerate = scenes.filter(s => s.narration && !s.audioUrl);
    
    if (scenesToGenerate.length === 0) {
        alert("所有包含旁白的分鏡都已生成語音。");
        return;
    }

    setIsBatchGeneratingAudio(true);
    setAudioProgress({ current: 0, total: scenesToGenerate.length });

    for (let i = 0; i < scenesToGenerate.length; i++) {
        const scene = scenesToGenerate[i];
        try {
            const audioUrl = await generateSpeech(scene.narration);
            setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, audioUrl } : s));
            setAudioProgress(prev => prev ? { ...prev, current: i + 1 } : null);
            await new Promise(resolve => setTimeout(resolve, 200)); // Small delay
        } catch (error) {
            console.error(`Failed to generate audio for scene ${scene.order}`, error);
        }
    }

    setIsBatchGeneratingAudio(false);
    setAudioProgress(null);
  };

  const exportProject = () => {
    const projectData: ProjectData = {
        context: projectContext,
        scenes: scenes,
        scriptText: scriptText,
        version: "1.1"
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(projectData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "anime_storyboard_vertical.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const startNewProject = () => {
    if (confirm("確定要開啟新專案嗎？目前的進度將被清空 (除非已匯出)。")) {
      setScenes([]);
      setProjectContext({ characters: [], settings: [], artStyleId: 'cinematic' });
      setScriptText(MOCK_SCRIPT);
      setViewMode(ViewMode.INPUT);
      localStorage.removeItem(AUTOSAVE_KEY);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* Navbar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md fixed top-0 w-full z-40 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-900/20">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white">AnimeShorts AI <span className="text-slate-500 text-xs font-normal ml-2">豎屏動漫神器</span></span>
        </div>
        
        <div className="flex items-center gap-3">
             <button 
                onClick={() => setIsContextOpen(true)}
                className="flex items-center gap-2 text-xs bg-slate-800/50 hover:bg-slate-700 border border-slate-700 text-blue-300 px-3 py-1.5 rounded-lg transition-colors"
              >
                <BookOpen className="w-3 h-3" />
                設定集
              </button>

             <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>

            {viewMode === ViewMode.BOARD && (
               <>
                  <div className="h-6 w-px bg-slate-800 mx-1"></div>
                  <button 
                    onClick={startNewProject}
                    className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block"
                  >
                    開新專案
                  </button>
                  <button 
                    onClick={exportProject}
                    className="flex items-center gap-2 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    匯出
                  </button>
               </>
            )}
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-6 max-w-[1600px] mx-auto min-h-screen">
        {viewMode === ViewMode.INPUT ? (
          <ProjectInput 
            text={scriptText}
            onTextChange={setScriptText}
            onAnalyze={handleAnalyze} 
            onImport={handleImportProject}
            isAnalyzing={isAnalyzing} 
            openSettings={() => setIsSettingsOpen(true)}
            projectContext={projectContext}
            onOpenContext={() => setIsContextOpen(true)}
          />
        ) : (
          <div className="space-y-8 animate-in fade-in duration-500">
            
            {/* Dashboard Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                    <Smartphone className="w-8 h-8 text-pink-500" />
                    豎屏動漫分鏡板 (9:16)
                </h2>
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                   <span>{scenes.length} 個鏡頭</span>
                   <span>•</span>
                   <span>風格: {ANIME_STYLES.find(s => s.id === projectContext.artStyleId)?.label || '劇場版動畫'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                  {/* Batch Audio Button */}
                  <button
                    onClick={handleBatchGenerateAudio}
                    disabled={isBatchGeneratingAudio}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-lg ${
                        isBatchGeneratingAudio
                        ? 'bg-slate-700 text-slate-300 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 text-white shadow-blue-900/20'
                    }`}
                  >
                    {isBatchGeneratingAudio ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            ({audioProgress?.current}/{audioProgress?.total})
                        </>
                    ) : (
                        <>
                            <Mic className="w-4 h-4" />
                            一鍵生成語音
                        </>
                    )}
                  </button>

                  {/* Batch Image Button */}
                  <button
                    onClick={handleBatchGenerateImages}
                    disabled={isBatchGenerating}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-lg ${
                        isBatchGenerating 
                        ? 'bg-slate-700 text-slate-300 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white shadow-purple-900/20'
                    }`}
                  >
                    {isBatchGenerating ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            ({generationProgress?.current}/{generationProgress?.total})
                        </>
                    ) : (
                        <>
                            <ImageIcon className="w-4 h-4" />
                            一鍵生成動漫圖
                        </>
                    )}
                  </button>

                  <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
                    <button 
                        onClick={() => setIsListView(false)}
                        className={`p-2 rounded-md transition-all ${!isListView ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        title="網格檢視"
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => setIsListView(true)}
                        className={`p-2 rounded-md transition-all ${isListView ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        title="列表檢視"
                    >
                        <ListIcon className="w-4 h-4" />
                    </button>
                  </div>
              </div>
            </div>

            {/* Timeline Visualization */}
            <TimelineChart scenes={scenes} />

            {/* Grid - Adjusted for Vertical Cards */}
            <div className={`grid gap-6 ${isListView ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'}`}>
              {scenes.map((scene, index) => (
                <SceneCard 
                  key={scene.id} 
                  scene={scene} 
                  index={index}
                  onClick={setSelectedScene} 
                />
              ))}
              
              <div 
                onClick={() => {
                   // Add empty scene logic if needed, or just visual placeholder
                }}
                className="aspect-[9/16] border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-600 hover:border-slate-600 hover:text-slate-400 transition-colors cursor-pointer group bg-slate-900/30"
              >
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Plus className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold">新增鏡頭</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {selectedScene && (
        <SceneEditor 
          scene={selectedScene} 
          allScenes={scenes} // Pass the list for navigation
          projectContext={projectContext} // Pass context for image generation consistency
          isOpen={!!selectedScene} 
          onClose={() => setSelectedScene(null)} 
          onUpdate={handleSceneUpdate}
          onNavigate={setSelectedScene} // Allow editor to switch scenes
        />
      )}

      <ProjectContextModal 
        isOpen={isContextOpen}
        onClose={() => setIsContextOpen(false)}
        context={projectContext}
        onUpdate={setProjectContext}
      />

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />

      {/* Auto-save Restore Toast */}
      {hasSavedData && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-800 border border-slate-700 p-4 rounded-xl shadow-2xl flex flex-col gap-3 animate-in slide-in-from-bottom-10 fade-in duration-500 max-w-xs">
          <div className="flex items-start gap-3">
             <ArchiveRestore className="w-5 h-5 text-blue-400 mt-0.5" />
             <div>
                <h4 className="font-bold text-white text-sm">發現未儲存的進度</h4>
                <p className="text-xs text-slate-400 mt-1">
                   {savedTimestamp ? new Date(savedTimestamp).toLocaleString() : '上次編輯'} 的自動存檔
                </p>
             </div>
          </div>
          <div className="flex gap-2">
             <button 
                onClick={restoreProject}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs py-2 rounded-lg font-bold transition-colors"
             >
                回復進度
             </button>
             <button 
                onClick={discardSave}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs py-2 rounded-lg font-bold transition-colors"
             >
                捨棄
             </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
