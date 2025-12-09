
import React from 'react';
import { Scene } from '../types';
import { Clock, Camera, Music, Video, Mic } from 'lucide-react';

interface SceneCardProps {
  scene: Scene;
  onClick: (scene: Scene) => void;
  index: number;
}

const SceneCard: React.FC<SceneCardProps> = ({ scene, onClick, index }) => {
  return (
    <div 
      onClick={() => onClick(scene)}
      className="group bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-blue-500/50 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-blue-900/20 hover:-translate-y-1 relative flex flex-col"
    >
      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded z-10">
        Shot {index + 1}
      </div>

      <div className="absolute top-2 right-2 flex gap-1 z-10">
         {scene.audioUrl && (
             <div className="bg-indigo-600/90 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 shadow-lg" title="Audio Generated">
                <Mic className="w-3 h-3" />
             </div>
         )}
         {scene.videoUrl && (
             <div className="bg-purple-600/90 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 shadow-lg animate-pulse" title="Video Generated">
                <Video className="w-3 h-3" />
             </div>
         )}
      </div>

      {/* 9:16 Aspect Ratio Container */}
      <div className="aspect-[9/16] w-full bg-slate-900 relative overflow-hidden flex items-center justify-center border-b border-slate-800">
        {scene.imageUrl ? (
          <img 
            src={scene.imageUrl} 
            alt={`Shot ${index + 1}`} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="text-slate-600 flex flex-col items-center gap-4 p-6 text-center">
            <div className="w-16 h-16 border-2 border-dashed border-slate-700 rounded-lg flex items-center justify-center">
                <Camera className="w-6 h-6 opacity-50" />
            </div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">9:16 Vertical</p>
            <p className="text-xs line-clamp-4 px-2 opacity-60">{scene.visualDescription}</p>
          </div>
        )}
        
        {scene.videoUrl && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <div className="bg-white/20 backdrop-blur-md p-3 rounded-full">
                    <Video className="w-8 h-8 text-white" />
                </div>
            </div>
        )}
      </div>

      <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
        <div>
            <div className="flex items-center gap-2 text-[10px] text-blue-400 font-medium tracking-wider mb-1">
            <Camera className="w-3 h-3" />
            <span className="truncate">{scene.cameraAngle}</span>
            </div>
            
            <p className="text-xs text-slate-300 line-clamp-3 italic font-serif leading-relaxed">
            "{scene.narration}"
            </p>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-700 pt-2 mt-1">
            <div className="flex items-center gap-1" title="Duration">
                <Clock className="w-3 h-3" />
                {scene.duration}s
            </div>
            <div className="flex items-center gap-1 max-w-[60%]" title="BGM">
                <Music className="w-3 h-3" />
                <span className="truncate">{scene.bgm}</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SceneCard;
