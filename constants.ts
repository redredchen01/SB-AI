
import { ArtStyle } from './types';

export const MOCK_SCRIPT = `雨水無情地拍打在新東京霓虹閃爍的街道上。
賽佛拉起衣領，遮擋住他的義眼，試圖避開傾盆大雨。
「他們發現我了。」他低聲自語，瞥了一眼水坑中的倒影。
身後，執法機器人沉重的腳步聲越來越近。
他轉身閃進一條狹窄的小巷，通風口冒著白色的蒸汽。
是死路。
他猛然轉身，拔出等離子手槍。「來跳支舞吧。」`;

export const CAMERA_ANGLES = [
  "標準豎屏 (Standard Vertical)",
  "動漫式大特寫 (Anime Extreme Close Up)",
  "荷蘭式傾斜 (Dutch Angle / Tilt)",
  "誇張透視 (Exaggerated Perspective)",
  "速度線背景 (Speed Lines Action)",
  "滑動變焦 (Dolly Zoom / Vertigo)",
  "對角線構圖 (Diagonal Composition)",
  "角色全身 (Full Body Vertical)",
  "仰視霸氣視角 (Low Angle Hero)",
  "俯視壓迫視角 (High Angle Vulnerable)",
  "分鏡特寫 (Panel Close Up)",
  "動態跟隨 (Dynamic Tracking)"
];

export const ANIME_STYLES: ArtStyle[] = [
  { 
    id: 'cinematic', 
    label: '劇場版動畫 (Cinematic Anime)', 
    promptModifier: 'cinematic anime movie still, 9:16 vertical, makoto shinkai lighting, detailed background, 8k, wallpaper quality' 
  },
  { 
    id: 'cyberpunk_anime', 
    label: '賽博龐克 (Cyberpunk Edge)', 
    promptModifier: 'cyberpunk edgerunners style, 9:16 vertical, neon lights, high contrast, chromatic aberration, trigger studio style, dynamic angle' 
  },
  { 
    id: 'ghibli', 
    label: '吉卜力手繪 (Ghibli Style)', 
    promptModifier: 'studio ghibli style, 9:16 vertical, watercolor background, cel shaded, lush details, hayao miyazaki, picturesque' 
  },
  { 
    id: 'manga_action', 
    label: '熱血漫 (Shonen Action)', 
    promptModifier: 'shonen jump anime style, 9:16 vertical, intense action, effect lines, bold outlines, vivid colors, mappa style' 
  },
  { 
    id: 'vintage_90s', 
    label: '90年代賽璐珞 (90s Cel)', 
    promptModifier: '90s anime aesthetic, cowboy bebop style, cel animation, 9:16 vertical, retro vhs grain, lo-fi anime' 
  },
  { 
    id: 'manhwa', 
    label: '韓漫條漫 (Webtoon/Manhwa)', 
    promptModifier: 'high quality manhwa style, solo leveling art style, 9:16 vertical, digital art, glowing effects, sharp details' 
  }
];
