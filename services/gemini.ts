
import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { Scene, AnalysisResponse, ProjectContext, Character } from "../types";

// Create a function to get the AI client, ensuring we use the latest key if selected via UI
const getAiClient = () => {
  const apiKey = process.env.API_KEY || '';
  return new GoogleGenAI({ apiKey });
};

export const hasValidApiKey = async (): Promise<boolean> => {
    if ((window as any).aistudio && (window as any).aistudio.hasSelectedApiKey) {
        return await (window as any).aistudio.hasSelectedApiKey();
    }
    return !!process.env.API_KEY;
}

export const analyzeScriptWithGemini = async (text: string, useProModel: boolean = false, context?: ProjectContext): Promise<Scene[]> => {
  const ai = getAiClient();
  const modelName = useProModel ? 'gemini-3-pro-preview' : 'gemini-2.5-flash';

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      scenes: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            script: { type: Type.STRING, description: "此分鏡涵蓋的原始小說文本片段" },
            visualDescription: { type: Type.STRING, description: "詳細的動漫畫面描述 (Prompt)。請強調「豎構圖 (Vertical Composition)」。描述角色在畫面中的位置（如：佔據畫面下半部、從頂部俯視等）。" },
            videoPrompt: { type: Type.STRING, description: "專為 Veo 影片生成模型設計的英文提示詞。格式範例: 'Anime style, vertical video, 9:16, [Character Action], [Camera Movement], cinematic lighting'." },
            narration: { type: Type.STRING, description: "旁白、台詞或字幕內容" },
            duration: { type: Type.NUMBER, description: "預估秒數 (短影音節奏通常較快，約 2-5秒)" },
            cameraAngle: { type: Type.STRING, description: "建議的運鏡方式 (如：滑動變焦、特寫、荷蘭式傾斜)" },
            bgm: { type: Type.STRING, description: "建議的背景音樂情緒" },
            soundEffects: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "音效列表"
            },
            order: { type: Type.INTEGER, description: "鏡頭序號" }
          },
          required: ["script", "visualDescription", "videoPrompt", "narration", "duration", "cameraAngle", "bgm", "order"]
        }
      }
    }
  };

  // Build Context String safely
  let contextPrompt = "";
  if (context) {
    if (context.characters.length > 0) {
      contextPrompt += "\n\n【角色設定 (Character Sheets)】:\n" + 
        context.characters.map(c => `- ${c.name}: ${c.description}`).join("\n");
    }
    if (context.settings.length > 0) {
      contextPrompt += "\n\n【世界觀設定 (World Setting)】:\n" + 
        context.settings.map(s => `- ${s.name}: ${s.description}`).join("\n");
    }
  }

  const systemInstruction = "你是一位專精於直式短影音的動漫分鏡師。所有畫面設計都必須基於 9:16 的豎屏比例。影片提示詞 (Video Prompt) 必須包含 'Anime style, 9:16 vertical'。";

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `你是一位頂尖的動漫導演，專精於製作 TikTok/Reels 風格的「直式動漫短影音 (Vertical Anime Shorts)」。
      請將以下小說文本改編為適合手機全螢幕觀看的動態分鏡。
      
      設計重點：
      1. **豎屏構圖 (9:16)**：思考如何在狹長的畫面中安排角色與背景。善用垂直空間（如天空、高樓）。
      2. **動漫風格**：使用動漫術語描述畫面（如：誇張的透視、速度線、強調表情特寫）。
      3. **短影音節奏**：剪輯要明快，吸引注意力。
      4. 除了 "videoPrompt" 必須使用英文外，其他欄位請使用 **繁體中文 (台灣)**。
      ${contextPrompt}

      小說文本：
      ${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: systemInstruction
      }
    });

    const responseText = response.text || '{}';
    const result = JSON.parse(responseText) as AnalysisResponse;
    
    // Hydrate with IDs and auto-detect characters
    return (result.scenes || []).map((s) => {
      // Auto-detect characters based on name presence in description or narration
      const combinedText = (s.visualDescription + " " + s.narration).toLowerCase();
      const activeCharIds = context?.characters
        .filter(c => combinedText.includes(c.name.toLowerCase()))
        .map(c => c.id) || [];

      return {
        ...s,
        id: crypto.randomUUID(),
        soundEffects: s.soundEffects || [],
        videoPrompt: s.videoPrompt || s.visualDescription, // Fallback
        activeCharacterIds: activeCharIds
      };
    });

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
};

export const generateSceneImage = async (
  description: string, 
  styleModifier: string = "anime style",
  context?: ProjectContext,
  activeCharacterIds?: string[]
): Promise<string> => {
  const ai = getAiClient();

  // 1. Determine relevant characters
  let relevantCharacters: Character[] = [];
  let charPrompt = "";
  const parts: any[] = [];

  if (context?.characters && context.characters.length > 0) {
    if (activeCharacterIds && activeCharacterIds.length > 0) {
      // Use explicitly selected characters
      relevantCharacters = context.characters.filter(c => activeCharacterIds.includes(c.id));
    } else {
      // Fallback: Check if character name is in the description
      relevantCharacters = context.characters.filter(c => 
        c.imageUrl && description.toLowerCase().includes(c.name.toLowerCase())
      );
    }

    // If matches found, add their images as reference
    relevantCharacters.forEach((char, index) => {
        if (char.imageUrl) {
            try {
              const base64Data = char.imageUrl.split(',')[1]; // Remove data URL prefix
              if (base64Data) {
                parts.push({
                    inlineData: {
                        mimeType: "image/png", // Assuming PNG/JPEG common inputs, model handles it
                        data: base64Data
                    }
                });
                charPrompt += `[Reference Image ${index + 1}] is character "${char.name}". `;
              }
            } catch (e) {
              console.warn("Invalid character image data", e);
            }
        }
    });
  }

  // 2. Construct the full prompt safely
  const instructions = charPrompt 
    ? `INSTRUCTIONS: You are provided with character reference images. You MUST generate the character "${relevantCharacters.map(c=>c.name).join(', ')}" looking consistent with the reference [Reference Image x]. Maintain their hair style, hair color, eye color, and clothing details exactly.` 
    : "";

  const fullPrompt = `
  ${instructions}
  (masterpiece), best quality, ${styleModifier}, 9:16 vertical aspect ratio, mobile wallpaper.
  SCENE DESCRIPTION: ${description}
  `;

  parts.push({ text: fullPrompt });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: parts
      },
      config: {
          imageConfig: {
              aspectRatio: "9:16"
          }
      }
    });

    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    
    console.warn("Gemini Image Generation: No inlineData found in response", response);
    throw new Error("圖片生成失敗：模型未返回影像數據，可能觸發了安全過濾 (Safety Filter) 或連線問題。");

  } catch (error) {
    console.error("Gemini Image Generation Failed:", error);
    throw error;
  }
};

export const generateSceneVideo = async (prompt: string): Promise<string> => {
  const ai = getAiClient();
  const apiKey = process.env.API_KEY;

  // Ensure prompts are optimized for Veo vertical generation
  const optimizedPrompt = `Vertical video, 9:16 aspect ratio, anime style, ${prompt}`;

  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: optimizedPrompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '9:16' // Vertical Video
      }
    });

    // Polling loop
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation failed: No URI");

    const videoResponse = await fetch(`${downloadLink}&key=${apiKey}`);
    const blob = await videoResponse.blob();
    return URL.createObjectURL(blob);

  } catch (error) {
    console.error("Veo Video Generation Failed:", error);
    throw error;
  }
};

export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
    const ai = getAiClient();

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voiceName },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio data returned");

        const audioBytes = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0));
        const wavBytes = pcmToWav(audioBytes, 24000);
        const blob = new Blob([wavBytes], { type: 'audio/wav' });
        return URL.createObjectURL(blob);

    } catch (error) {
        console.error("TTS Generation Failed", error);
        throw error;
    }
};

// NEW: Sound Design Agent (BGM & SFX Analysis)
export const generateSoundDesign = async (sceneDescription: string, mood: string): Promise<{ bgmPrompt: string, sfxList: string[] }> => {
    const ai = getAiClient();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `
                Act as a professional Anime Sound Designer.
                Analyze the following scene and provide:
                1. "bgmPrompt": A detailed English music generation prompt (for tools like Suno/Udio). Include genre (e.g., Lo-fi, Orchestral, Rock), BPM, instruments, and mood.
                2. "sfxList": A list of specific Sound Effects (SFX) needed (e.g., "footsteps on puddle", "distant thunder", "mecha servo motor").

                Scene: "${sceneDescription.replace(/"/g, '\\"')}"
                Current Mood: "${mood.replace(/"/g, '\\"')}"

                Output in JSON format.
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        bgmPrompt: { type: Type.STRING },
                        sfxList: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
        });
        
        const result = JSON.parse(response.text || '{}');
        return {
            bgmPrompt: result.bgmPrompt || mood || "Cinematic anime background music",
            sfxList: result.sfxList || []
        };
    } catch (e) {
        console.error("Sound Design failed", e);
        return { bgmPrompt: mood, sfxList: [] };
    }
}

export const refineSceneText = async (currentText: string, instruction: string): Promise<string> => {
    const ai = getAiClient();
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `原始文本: "${currentText}"\n\n修改指令: ${instruction}\n\n請根據指令重寫文本，僅返回重寫後的內容。`
        });
        return response.text?.trim() || currentText;
    } catch (error) {
        console.error("Text refinement failed", error);
        return currentText;
    }
}

export const optimizeVideoPrompt = async (currentText: string, instruction: string = ""): Promise<string> => {
    const ai = getAiClient();
    
    try {
        const prompt = `
        Role: You are an expert Anime Video Prompt Engineer for Veo / Runway.
        Task: Rewrite the user's description into a high-quality ENGLISH prompt for generating a VERTICAL (9:16) ANIME video.
        
        Input: "${currentText.replace(/"/g, '\\"')}"
        User Instruction: "${instruction.replace(/"/g, '\\"')}"
        
        Requirements:
        1. Start with "Anime style, vertical video, 9:16 aspect ratio, ...".
        2. Describe the character visually (hair, clothes, eyes).
        3. Describe the ACTION clearly (e.g., "wind blowing hair", "turning head slowly", "running towards camera").
        4. Add camera movement (e.g., "slow dolly in", "handheld camera shake").
        5. Add lighting/atmosphere (e.g., "cinematic lighting", "sunset glow", "cyberpunk neon").
        6. Output ONLY the prompt string.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        return response.text?.trim() || currentText;
    } catch (error) {
        console.error("Video prompt optimization failed", error);
        return currentText;
    }
}

function pcmToWav(pcmData: Uint8Array, sampleRate: number): Uint8Array {
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * bitsPerSample / 8;
    const blockAlign = numChannels * bitsPerSample / 8;
    const dataSize = pcmData.length;
    const headerSize = 44;
    const totalSize = headerSize + dataSize;

    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');

    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    const bytes = new Uint8Array(buffer);
    bytes.set(pcmData, 44);

    return bytes;
}

function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}
    