
export interface Character {
  id: string;
  name: string;
  description: string; // Appearance, personality traits
  imageUrl?: string; // Base64 reference image
}

export interface WorldSetting {
  id: string;
  name: string; // e.g., "Cyberpunk Tokyo"
  description: string; // Mood, lighting, key elements
}

export interface ProjectContext {
  characters: Character[];
  settings: WorldSetting[];
  artStyleId?: string; // Selected art style ID
}

export interface Scene {
  id: string;
  order: number;
  script: string; // Original text chunk
  visualDescription: string; // Prompt for image/video generation
  videoPrompt: string; // Specialized prompt for video generation (usually English, motion-focused)
  narration: string; // Subtitles/Dialogue
  duration: number; // Seconds
  cameraAngle: string; // e.g., "Wide Shot"
  bgm: string; // Mood
  soundEffects: string[];
  imageUrl?: string; // Generated image
  videoUrl?: string; // Generated video (Veo)
  audioUrl?: string; // Generated TTS audio
  artStyle?: string; // Optional specific style for this scene
  activeCharacterIds?: string[]; // IDs of characters appearing in this scene
}

export interface ArtStyle {
  id: string;
  label: string;
  promptModifier: string; // e.g. "ghibli style, cel shaded"
}

export enum ViewMode {
  INPUT = 'INPUT',
  BOARD = 'BOARD'
}

export interface AnalysisResponse {
  scenes: Array<Omit<Scene, 'id' | 'imageUrl' | 'videoUrl' | 'audioUrl' | 'activeCharacterIds'>>;
}

export interface ProjectData {
  context: ProjectContext;
  scenes: Scene[];
  scriptText?: string; // Saved raw input text
  version?: string;
}
