import { GoogleGenAI, GenerateContentResponse, Type, Modality } from "@google/genai";
import { v4 as uuidv4 } from 'uuid';
import { GrammarIssue, ConsistencyIssue, PublishingOpportunity, MarketingCampaign, ShowVsTellIssue, FactCheckIssue, Source, DialogueIssue, ProsePolishIssue, SensitivityIssue, StructuralIssue, PacingBeat, ContinuityEvent, OutlineItem, LocalizationPack, LocalizedMetadata, AppSettings } from "../types";
import { IAiProvider, ProviderFactory, ProviderConfig } from "./aiProviders";

const SETTINGS_KEY = 'appSettings';

const DEFAULT_MODELS = {
    textGeneration: 'gemini-2.5-pro',
    textGenerationFast: 'gemini-2.5-flash',
    imageGeneration: 'imagen-4.0-generate-001',
    audioGeneration: 'gemini-2.5-flash-preview-tts',
    imageEditing: 'gemini-2.5-flash-image',
    embedding: 'text-embedding-004'
};

const loadSettings = (): AppSettings | null => {
    try {
        const stored = localStorage.getItem(SETTINGS_KEY);
        if (!stored) return null;
        return JSON.parse(stored);
    } catch (error) {
        console.warn('Failed to load AI settings from localStorage:', error);
        return null;
    }
};

let currentSettings = loadSettings();
let ai = new GoogleGenAI({ apiKey: currentSettings?.aiProvider.apiKey || import.meta.env.VITE_GEMINI_API_KEY! });

const refreshAiInstance = () => {
    currentSettings = loadSettings();
    ai = new GoogleGenAI({ apiKey: currentSettings?.aiProvider.apiKey || import.meta.env.VITE_GEMINI_API_KEY! });
};

const getVeoAiInstance = () => {
    const settings = loadSettings();
    return new GoogleGenAI({ apiKey: settings?.aiProvider.apiKey || import.meta.env.VITE_GEMINI_API_KEY! });
};

const getModel = (type: 'textGeneration' | 'textGenerationFast' | 'imageGeneration' | 'audioGeneration' | 'imageEditing' | 'embedding'): string => {
    const settings = loadSettings();
    return settings?.aiProvider.models[type] || DEFAULT_MODELS[type];
};

const getProviderInstance = async (): Promise<IAiProvider> => {
    const settings = loadSettings();
    if (!settings) {
        throw new Error('No AI provider settings found. Please configure settings first.');
    }
    
    const config: ProviderConfig = {
        type: settings.aiProvider.provider,
        apiKey: settings.aiProvider.apiKey,
        endpoint: settings.aiProvider.endpoint,
        models: settings.aiProvider.models
    };
    
    return ProviderFactory.createProvider(config);
};

if (typeof window !== 'undefined') {
    window.addEventListener('settingsUpdated', refreshAiInstance);
}

const PLACEHOLDER_IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAJUlEQVR4nO3BMQEAAADCoPdPbQ43oAAAAAAAAAAAAAAA4D8GdgAAAZLvt2kAAAAASUVORK5CYII=';
const USE_POLLINATIONS_ONLY = (import.meta.env.VITE_IMAGE_BACKEND || '').toLowerCase() === 'pollinations';

const notifyImageFallback = (message: string, type: 'info' | 'error' = 'info') => {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent('gemini-image-fallback', { detail: { message, type } }));
    }
};

type ImageAspectRatio = '3:4' | '16:9' | '1:1';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const isTransientGeminiError = (error: unknown) => {
    const message = typeof error === 'string'
        ? error
        : error && typeof error === 'object' && 'message' in error
        ? String((error as any).message)
        : '';
    const status = (error as any)?.error?.status || (error as any)?.status;
    const statusCode = typeof status === 'number' ? status : parseInt(String(status), 10);
    
    return (
        statusCode === 429 ||
        statusCode === 503 ||
        (typeof status === 'string' && status.toLowerCase() === 'unavailable') ||
        message.toLowerCase().includes('429') ||
        message.toLowerCase().includes('too many requests') ||
        message.toLowerCase().includes('unavailable') ||
        message.toLowerCase().includes('overloaded') ||
        message.includes('503')
    );
};

const withGeminiRetry = async <T>(label: string, run: () => Promise<T>, retries = 3, delayMs = 3000): Promise<T> => {
    for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
            return await run();
        } catch (error) {
            const is429 = (error as any)?.message?.includes('429') || (error as any)?.status === 429;
            
            if (attempt === retries || (!isTransientGeminiError(error) && !is429)) {
                throw error;
            }
            
            // Use longer backoff for rate limits (429 errors)
            const baseDelay = is429 ? 10000 : delayMs;
            const backoffDelay = baseDelay * Math.pow(2, attempt);
            
            console.warn(`[Gemini:${label}] ${is429 ? 'rate limited' : 'transient failure'} (attempt ${attempt + 1}/${retries + 1}). Retrying in ${backoffDelay}ms...`);
            await sleep(backoffDelay);
        }
    }
    throw new Error(`Failed to execute Gemini operation: ${label}`);
};

interface ImageProxyResponse {
    provider: 'pollinations' | 'picsum';
    images: string[];
}

const requestImagesFromProxy = async (prompt: string, numberOfImages: number, aspectRatio: ImageAspectRatio): Promise<string[]> => {
    const response = await fetch('/api/image-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, count: numberOfImages, aspectRatio })
    });

    if (!response.ok) {
        throw new Error(`Image proxy responded with status ${response.status}`);
    }

    const data = (await response.json()) as ImageProxyResponse;
    // Don't show notifications for Pollinations - it's a working fallback
    // Only show notification if using picsum placeholders
    if (data.provider === 'picsum') {
        notifyImageFallback('Using public stock imagery while Pollinations/Gemini services are unavailable.', 'error');
    }
    return data.images;
};


export const generateVideo = async (prompt: string, aspectRatio: '16:9' | '9:16') => {
    try {
        const veoAi = getVeoAiInstance();
        let operation = await veoAi.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: aspectRatio,
            }
        });
        return operation;
    } catch (error) {
        console.error("Error starting video generation:", error);
        throw error;
    }
};

export const getVideoOperationStatus = async (operation: any) => {
    try {
        const veoAi = getVeoAiInstance();
        const updatedOperation = await veoAi.operations.getVideosOperation({ operation: operation });
        return updatedOperation;
    } catch (error) {
        console.error("Error polling video status:", error);
        throw error;
    }
};

export const generateVideoPrompt = async (manuscript: string): Promise<string> => {
    const fullPrompt = `Based on the following manuscript excerpt, create a single, concise, and visually descriptive prompt for an AI video generator to create a 15-second book trailer. The prompt should evoke a strong mood and focus on a central, compelling cinematic sequence. Describe camera movements and visual styles.

Manuscript: "${manuscript.substring(0, 3000)}..."

Prompt:`;
    try {
        const response = await ai.models.generateContent({
            model: getModel('textGenerationFast'),
            contents: fullPrompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating video prompt:", error);
        throw new Error("Failed to generate a video trailer prompt.");
    }
};


export const editImage = async (base64Image: string, prompt: string): Promise<string> => {
    try {
        const imagePart = {
            inlineData: {
                mimeType: 'image/png',
                data: base64Image,
            },
        };
        const textPart = {
            text: prompt,
        };
        const response = await ai.models.generateContent({
            model: getModel('imageEditing'),
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                return base64ImageBytes;
            }
        }
        throw new Error("No image data returned from API.");

    } catch (error) {
        console.error("Error editing image:", error);
        throw new Error("Failed to edit the image.");
    }
};

export const generateImageFromImageFastSDCPU = async (base64Image: string, prompt: string, aspectRatio: ImageAspectRatio = '1:1'): Promise<string> => {
    const settings = loadSettings();
    const endpoint = settings?.fastsdcpuEndpoint || 'http://localhost:8000';

    const [width, height] = aspectRatio === '16:9'
        ? [1024, 576]
        : aspectRatio === '1:1'
        ? [1024, 1024]
        : [768, 1024];

    try {
        const response = await fetch(`${endpoint}/img2img`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: prompt,
                negative_prompt: 'text, watermark, low quality, blurry, distorted',
                init_images: [base64Image],
                width: width,
                height: height,
                steps: 20,
                cfg_scale: 7,
                denoising_strength: 0.75,
                seed: Math.floor(Math.random() * 1000000000)
            })
        });

        if (!response.ok) {
            throw new Error(`FastSD CPU img2img request failed with status ${response.status}`);
        }

        const data = await response.json();
        
        if (data.image) {
            return data.image;
        } else if (data.images && Array.isArray(data.images) && data.images.length > 0) {
            return data.images[0];
        } else {
            throw new Error('No image data returned from FastSD CPU img2img');
        }
    } catch (error) {
        console.error('FastSD CPU img2img generation failed:', error);
        throw new Error('Failed to generate image with FastSD CPU img2img.');
    }
};

export const generateSpeech = async (text: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: getModel('audioGeneration'),
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                      prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("No audio data returned from API.");
        }
        return base64Audio;
    } catch (error) {
        console.error("Error generating speech:", error);
        throw new Error("Failed to generate audio from text.");
    }
};

export const generateAudiobook = async (text: string, stylePrompt: string): Promise<string> => {
    try {
        const fullPrompt = `${stylePrompt}: ${text}`;
        
        const response = await ai.models.generateContent({
            model: getModel('audioGeneration'),
            contents: [{ parts: [{ text: fullPrompt }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                      prebuiltVoiceConfig: { voiceName: 'Zephyr' }, // Zephyr is a good versatile voice
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("No audio data returned from API.");
        }
        return base64Audio;
    } catch (error) {
        console.error("Error generating audiobook:", error);
        throw new Error("Failed to generate audiobook from text.");
    }
};

const generateImagesViaComfyUI = async (prompt: string, numberOfImages: number, aspectRatio: ImageAspectRatio): Promise<string[]> => {
    const settings = loadSettings();
    const endpoint = settings?.comfyUIEndpoint || 'http://localhost:8188';

    const workflow = {
        "3": {
            "inputs": {
                "seed": Math.floor(Math.random() * 1000000000),
                "steps": 20,
                "cfg": 7,
                "sampler_name": "euler",
                "scheduler": "normal",
                "denoise": 1,
                "model": ["4", 0],
                "positive": ["6", 0],
                "negative": ["7", 0],
                "latent_image": ["5", 0]
            },
            "class_type": "KSampler"
        },
        "4": {
            "inputs": {
                "ckpt_name": "sd_xl_base_1.0.safetensors"
            },
            "class_type": "CheckpointLoaderSimple"
        },
        "5": {
            "inputs": {
                "width": aspectRatio === '16:9' ? 1024 : aspectRatio === '1:1' ? 1024 : 768,
                "height": aspectRatio === '16:9' ? 576 : aspectRatio === '1:1' ? 1024 : 1024,
                "batch_size": numberOfImages
            },
            "class_type": "EmptyLatentImage"
        },
        "6": {
            "inputs": {
                "text": prompt,
                "clip": ["4", 1]
            },
            "class_type": "CLIPTextEncode"
        },
        "7": {
            "inputs": {
                "text": "text, watermark, low quality, blurry",
                "clip": ["4", 1]
            },
            "class_type": "CLIPTextEncode"
        },
        "8": {
            "inputs": {
                "samples": ["3", 0],
                "vae": ["4", 2]
            },
            "class_type": "VAEDecode"
        },
        "9": {
            "inputs": {
                "filename_prefix": "ComfyUI",
                "images": ["8", 0]
            },
            "class_type": "SaveImage"
        }
    };

    try {
        const queueResponse = await fetch(`${endpoint}/prompt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: workflow })
        });

        if (!queueResponse.ok) {
            throw new Error(`ComfyUI queue request failed with status ${queueResponse.status}`);
        }

        const queueData = await queueResponse.json();
        const promptId = queueData.prompt_id;

        let completed = false;
        let historyData: any = null;
        
        for (let i = 0; i < 60; i++) {
            await sleep(1000);
            
            const historyResponse = await fetch(`${endpoint}/history/${promptId}`);
            if (!historyResponse.ok) continue;
            
            const history = await historyResponse.json();
            if (history[promptId] && history[promptId].status?.completed) {
                historyData = history[promptId];
                completed = true;
                break;
            }
        }

        if (!completed || !historyData) {
            throw new Error('ComfyUI generation timed out');
        }

        const outputs = historyData.outputs;
        const images: string[] = [];

        for (const nodeId in outputs) {
            const nodeOutput = outputs[nodeId];
            if (nodeOutput.images) {
                for (const img of nodeOutput.images) {
                    const imageUrl = `${endpoint}/view?filename=${encodeURIComponent(img.filename)}&subfolder=${encodeURIComponent(img.subfolder || '')}&type=${encodeURIComponent(img.type || 'output')}`;
                    const imageResponse = await fetch(imageUrl);
                    if (imageResponse.ok) {
                        const blob = await imageResponse.blob();
                        const base64 = await new Promise<string>((resolve) => {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                                const result = reader.result as string;
                                resolve(result.split(',')[1]);
                            };
                            reader.readAsDataURL(blob);
                        });
                        images.push(base64);
                    }
                }
            }
        }

        if (images.length === 0) {
            throw new Error('No images returned from ComfyUI');
        }

        return images;
    } catch (error) {
        console.error('ComfyUI generation failed:', error);
        throw error;
    }
};

const generateImagesViaFastSDCPU = async (prompt: string, numberOfImages: number, aspectRatio: ImageAspectRatio): Promise<string[]> => {
    const settings = loadSettings();
    const endpoint = settings?.fastsdcpuEndpoint || 'http://localhost:8000';

    const [width, height] = aspectRatio === '16:9'
        ? [1024, 576]
        : aspectRatio === '1:1'
        ? [1024, 1024]
        : [768, 1024];

    try {
        const images: string[] = [];
        
        for (let i = 0; i < numberOfImages; i++) {
            const response = await fetch(`${endpoint}/txt2img`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: prompt,
                    negative_prompt: 'text, watermark, low quality, blurry, distorted',
                    width: width,
                    height: height,
                    steps: 20,
                    cfg_scale: 7,
                    seed: Math.floor(Math.random() * 1000000000)
                })
            });

            if (!response.ok) {
                throw new Error(`FastSD CPU request failed with status ${response.status}`);
            }

            const data = await response.json();
            
            if (data.image) {
                images.push(data.image);
            } else if (data.images && Array.isArray(data.images) && data.images.length > 0) {
                images.push(data.images[0]);
            } else {
                throw new Error('No image data returned from FastSD CPU');
            }
        }

        if (images.length === 0) {
            throw new Error('No images returned from FastSD CPU');
        }

        return images;
    } catch (error) {
        console.error('FastSD CPU generation failed:', error);
        throw error;
    }
};

export const generateImages = async (prompt: string, numberOfImages: number = 1, aspectRatio: ImageAspectRatio = '3:4'): Promise<string[]> => {
    const settings = loadSettings();
    const selectedBackend = settings?.imageBackend || 'gemini';

    const useProxy = async () => {
        try {
            return await requestImagesFromProxy(prompt, numberOfImages, aspectRatio);
        } catch (proxyError) {
            console.error('Image proxy failed:', proxyError);
            notifyImageFallback('Image generation is currently unavailable. Inserted placeholders so you can keep working.', 'error');
            return Array.from({ length: numberOfImages }, () => PLACEHOLDER_IMAGE_BASE64);
        }
    };

    if (USE_POLLINATIONS_ONLY || selectedBackend === 'pollinations') {
        return useProxy();
    }

    if (selectedBackend === 'comfyui') {
        try {
            return await generateImagesViaComfyUI(prompt, numberOfImages, aspectRatio);
        } catch (error) {
            console.error('ComfyUI generation failed, falling back to proxy:', error);
            notifyImageFallback('ComfyUI is unavailable. Using Pollinations fallback.', 'info');
            return useProxy();
        }
    }

    if (selectedBackend === 'fastsdcpu') {
        try {
            return await generateImagesViaFastSDCPU(prompt, numberOfImages, aspectRatio);
        } catch (error) {
            console.error('FastSD CPU generation failed, falling back to proxy:', error);
            notifyImageFallback('FastSD CPU is unavailable. Using Pollinations fallback.', 'info');
            return useProxy();
        }
    }

    try {
        const response = await ai.models.generateImages({
            model: getModel('imageGeneration'),
            prompt: prompt,
            config: {
              numberOfImages: numberOfImages,
              outputMimeType: 'image/png',
              aspectRatio: aspectRatio,
            },
        });
        
        const base64ImageBytesArray = response.generatedImages.map(img => img.image.imageBytes);
        
        if (!base64ImageBytesArray || base64ImageBytesArray.length === 0) {
            throw new Error("No image data returned from API.");
        }
        return base64ImageBytesArray;
    } catch (error) {
        const rawMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : JSON.stringify(error);
        const lowerMessage = rawMessage.toLowerCase();
        const billingRestricted = lowerMessage.includes('billed users') || lowerMessage.includes('imagen api is only accessible');

        if (billingRestricted) {
            console.warn('Imagen API is unavailable for this API key. Using proxy fallback.');
            return useProxy();
        }

        console.error("Error generating image(s) via Gemini Imagen:", error);
        return useProxy();
    }
};

export const generateMoodboardPrompts = async (text: string): Promise<string[]> => {
    const prompt = `Act as a professional book illustration art director. Read the following manuscript excerpt carefully and generate 5-7 highly specific, visually descriptive prompts for an AI image generator to create a cohesive mood board for this book.

IMPORTANT GUIDELINES:
- Each prompt must be directly tied to specific details, characters, settings, or events from THIS manuscript
- Include specific character descriptions, clothing, physical features mentioned in the text
- Describe exact locations, time periods, architectural details from the story
- Capture the unique mood, atmosphere, and tone of THIS particular narrative
- Reference specific actions, objects, or scenes described in the text
- Each prompt should feel like it belongs to THIS book, not generic stock imagery

Manuscript Excerpt:
---
${text.substring(0, 4000)}...
---

Return a valid JSON array of strings, where each string is a detailed, book-specific image prompt. Each prompt should be 20-40 words and reference actual elements from the manuscript. Do not include any other text or markdown.`;

    try {
        const response = await withGeminiRetry('generateMoodboardPrompts', () => ai.models.generateContent({
            model: getModel('textGeneration'),
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.STRING
                    }
                }
            }
        }));
        const jsonStr = response.text.trim();
        const parsed = JSON.parse(jsonStr);
        if (!Array.isArray(parsed) || !parsed.every(item => typeof item === 'string')) {
            throw new Error('Unexpected prompt format returned by the AI.');
        }
        return parsed;
    } catch (error) {
        console.error("Error generating moodboard prompts:", error);
        throw new Error("Failed to generate moodboard prompts.");
    }
};

export const generateCoverPrompt = async (blurb: string): Promise<string> => {
    const fullPrompt = `Based on the following book blurb, create a single, concise, and visually descriptive prompt for an AI image generator to create a book cover. The prompt should evoke a strong mood and focus on a central, compelling image. Do not include text like "book cover" or "title".

Blurb: "${blurb}"

Prompt:`;
    try {
        const response = await ai.models.generateContent({
            model: getModel('textGenerationFast'),
            contents: fullPrompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating cover prompt:", error);
        throw new Error("Failed to generate a cover art prompt.");
    }
};


export const runResearchAgent = async (prompt: string, manuscriptContext: string): Promise<string> => {
  const fullPrompt = `
    Based on the user's idea and the context of their current manuscript, suggest a public domain book that would be a good fit.
    Explain why it's a good fit.
    Finally, state the suggested book title clearly in the format: **Book Title: [Title]**

    USER IDEA: "${prompt}"

    MANUSCRIPT CONTEXT:
    ---
    ${manuscriptContext.substring(0, 2000)}...
    ---
  `;

  try {
    const response = await ai.models.generateContent({
      model: getModel('textGenerationFast'),
      contents: fullPrompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error in runResearchAgent:", error);
    throw new Error("Failed to communicate with the AI agent.");
  }
};

export const runMarketSurveyorAgent = async (genre: string): Promise<PublishingOpportunity[]> => {
  const prompt = `
    Act as a senior publishing market analyst. Your task is to identify a promising opportunity to repackage a public domain book for a modern audience.

    1.  **Market Analysis**: Use Google Search to analyze the current top-selling books (e.g., on Amazon, New York Times Bestseller list) and social media trends (e.g., TikTok's #BookTok) for the "${genre}" genre.
    2.  **Identify Trend**: Synthesize your findings into a single, concise, and marketable trend.
    3.  **Select Book**: Based on this trend, select one suitable public domain book.
    4.  **Create Strategy**: Develop a complete repackaging strategy for this book. This includes:
        *   A short justification for why this book fits the trend.
        *   Actionable enhancement notes: Provide 2-3 specific, bullet-pointed recommendations on how to best enhance the original text to align with the trend (e.g., modernizing language, adding a prologue/epilogue, reframing the narrative).
        *   Supplementary Content Ideas: Provide 2-3 specific, bullet-pointed ideas for supplementary content that would increase the book's value. Consider commentary (e.g., historical context, analysis), new illustrations (e.g., style, key scenes to depict), or a study guide (e.g., discussion questions, theme analysis).
        *   A new, compelling book blurb (150-200 words) tailored to the modern audience and the identified trend.
        *   A visually descriptive prompt for an AI image generator to create a stunning book cover that aligns with the trend.

    Generate 2 unique opportunities.

    Your response must be a valid JSON array of objects. Each object must have the following keys: "trend", "bookTitle", "justification", "enhancementNotes", "supplementaryContentNotes", "blurb", and "coverPrompt". The "enhancementNotes" and "supplementaryContentNotes" should be single strings with newline characters for bullet points (e.g., "- First point.\\n- Second point."). Do not include any other text, markdown formatting, or explanations outside of the JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: getModel('textGeneration'),
      contents: prompt,
      // FIX: The `googleSearch` tool does not support `responseMimeType` or `responseSchema`.
      // The prompt is updated to request JSON output directly.
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    // FIX: Add robust parsing for JSON that might be wrapped in markdown.
    let jsonStr = response.text.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.substring(7, jsonStr.length - 3).trim();
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.substring(3, jsonStr.length - 3).trim();
    }
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error in runMarketSurveyorAgent:", error);
    throw new Error("Failed to communicate with the Market Surveyor AI agent.");
  }
};


export const searchPublicDomainBooks = async (query: string) => {
  const url = `https://gutendex.com/books/?search=${encodeURIComponent(query)}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error("Error searching public domain books:", error);
    throw new Error("Failed to search for books.");
  }
};

export const getPublicDomainBookText = async (url: string) => {
    try {
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.text();
    } catch (error) {
        console.error("Error fetching book text:", error);
        throw new Error("Failed to fetch book content.");
    }
};

export const runGrammarCheckAgent = async (text: string): Promise<GrammarIssue[]> => {
    if (!text.trim()) {
        return [];
    }
    try {
        const response = await withGeminiRetry('runGrammarCheckAgent', () => ai.models.generateContent({
            model: getModel('textGeneration'),
            contents: `
                Analyze the following text for spelling, grammar, and style errors.
                For each error found, provide the original text snippet, a suggested correction, a brief explanation, the type of error (spelling, grammar, or style), and the full sentence containing the error for context.
                Do not suggest changes for formatting or markdown.
                If there are no errors, return an empty array.

                Text to analyze:
                ---
                ${text}
                ---
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            original: { type: Type.STRING, description: 'The exact text with the error.' },
                            suggestion: { type: Type.STRING, description: 'The suggested correction.' },
                            explanation: { type: Type.STRING, description: 'A brief explanation of the error.' },
                            type: { type: Type.STRING, description: 'The type of issue (spelling, grammar, or style).' },
                            context: { type: Type.STRING, description: 'The full sentence where the error was found.' },
                        },
                        required: ['original', 'suggestion', 'explanation', 'type', 'context']
                    },
                },
            },
        }));
        
        const jsonStr = response.text.trim();
        const issues = JSON.parse(jsonStr);
        return issues.map((issue: Omit<GrammarIssue, 'id'>, index: number) => ({
            ...issue,
            id: `${Date.now()}-${index}`
        }));

    } catch (error) {
        console.error("Error checking grammar:", error);
        return [];
    }
};

export const runConsistencyAgent = async (text: string): Promise<ConsistencyIssue[]> => {
    if (text.trim().length < 200) {
        return [];
    }
    try {
        const provider = await getProviderInstance();
        const jsonStr = await withGeminiRetry('runConsistencyAgent', () =>
            provider.generateStructuredText({
                prompt: `
                    Act as a professional continuity editor. Analyze the following manuscript for inconsistencies in plot, character traits, timeline, and setting.
                    For each inconsistency found, provide a description of the issue, the type of inconsistency (Character, Plot, Timeline, or Setting), and a direct quote from the text that highlights the problem.
                    If no inconsistencies are found, return an empty array.

                    Return a JSON array with the following structure:
                    [
                        {
                            "type": "string (Character, Plot, Timeline, or Setting)",
                            "description": "string (clear explanation of the inconsistency)",
                            "quote": "string (direct quote containing the inconsistency)"
                        }
                    ]

                    Manuscript to analyze:
                    ---
                    ${text}
                    ---
                `,
                responseSchema: {},
                responseMimeType: 'application/json',
                model: getModel('textGeneration')
            })
        );
        return JSON.parse(jsonStr.trim()) as ConsistencyIssue[];
    } catch (error) {
        console.error("Error in consistency agent:", error);
        return [];
    }
};

export const runShowVsTellAgent = async (text: string): Promise<ShowVsTellIssue[]> => {
    if (text.trim().length < 100) {
        return [];
    }
    try {
        const provider = await getProviderInstance();
        const jsonStr = await withGeminiRetry('runShowVsTellAgent', () =>
            provider.generateStructuredText({
                prompt: `
                    Act as a creative writing coach. Analyze the following manuscript text for instances of "telling" instead of "showing".
                    For each instance you find, provide the following:
                    1. The exact quote from the text that is "telling".
                    2. A brief explanation of why it is "telling" and how "showing" would be more effective.
                    3. A suggested rewrite of the quote that "shows" the information or emotion instead.

                    If no instances are found, return an empty array.

                    Return a JSON array with this structure:
                    [
                        {
                            "quote": "string (exact quote from text)",
                            "explanation": "string (why this is telling)",
                            "suggestion": "string (suggested rewrite that shows)"
                        }
                    ]

                    Manuscript to analyze:
                    ---
                    ${text}
                    ---
                `,
                responseSchema: {},
                responseMimeType: 'application/json',
                model: getModel('textGeneration')
            })
        );
        const parsed: Omit<ShowVsTellIssue, 'id'>[] = JSON.parse(jsonStr.trim());
        return parsed.map(issue => ({ ...issue, id: uuidv4() }));

    } catch (error) {
        console.error("Error in Show vs. Tell agent:", error);
        return [];
    }
};

export const runFactCheckAgent = async (text: string): Promise<{ issues: FactCheckIssue[], sources: Source[] }> => {
    if (text.trim().length < 50) {
        return { issues: [], sources: [] };
    }
    const prompt = `
        Act as a meticulous fact-checker. Analyze the following text to identify verifiable claims (e.g., dates, historical events, statistics, scientific statements).
        For each claim you identify, use Google Search to verify its accuracy.
        Provide a verdict for each claim: "Verified", "Needs Correction", or "Uncertain".
        Provide a brief, neutral explanation for your verdict.

        Your response must be a valid JSON array of objects. Each object must have the following keys: "claim", "verdict", and "explanation".
        If no verifiable claims are found, return an empty array.
        Do not include any other text, markdown formatting, or explanations outside of the JSON.

        Text to analyze:
        ---
        ${text}
        ---
    `;

    try {
        const response = await ai.models.generateContent({
            model: getModel('textGeneration'),
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        let jsonStr = response.text.trim();
        if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.substring(7, jsonStr.length - 3).trim();
        }
        const issues: Omit<FactCheckIssue, 'sources'>[] = JSON.parse(jsonStr);
        
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources: Source[] = groundingChunks
            .filter(chunk => chunk.web)
            .map(chunk => ({
                title: chunk.web.title || chunk.web.uri,
                uri: chunk.web.uri,
            }));
        
        const uniqueSources = Array.from(new Map(sources.map(item => [item.uri, item])).values());
        
        const issuesWithSources = issues.map(issue => ({ ...issue, sources: uniqueSources }));

        return { issues: issuesWithSources, sources: uniqueSources };

    } catch (error) {
        console.error("Error in runFactCheckAgent:", error);
        throw new Error("Failed to communicate with the Fact-Check AI agent.");
    }
};

export const runDialogueAnalysisAgent = async (text: string): Promise<DialogueIssue[]> => {
    if (text.trim().length < 100) {
        return [];
    }
    try {
        const provider = await getProviderInstance();
        const jsonStr = await withGeminiRetry('runDialogueAnalysisAgent', () =>
            provider.generateStructuredText({
                prompt: `
                    Act as a dialogue coach. Analyze the dialogue in the following manuscript.
                    Identify up to 5 key areas for improvement. Focus on issues such as:
                    - Repetitive or bland dialogue tags (e.g., overusing "said").
                    - Dialogue that is too "on-the-nose" and lacks subtext.
                    - Unnatural or stilted phrasing.
                    - Lack of variety in sentence structure within the dialogue.
                    - Missed opportunities to use action beats instead of tags.

                    For each issue found, provide:
                    1. The exact quote containing the dialogue issue.
                    2. A concise name for the issue (e.g., "Repetitive Tags," "Lacks Subtext").
                    3. A constructive suggestion for how to improve it.

                    If no significant issues are found, return an empty array.

                    Return a JSON array with this structure:
                    [
                        {
                            "quote": "string (exact quote with dialogue issue)",
                            "issue": "string (short description like 'Repetitive Tags')",
                            "suggestion": "string (constructive improvement suggestion)"
                        }
                    ]

                    Manuscript to analyze:
                    ---
                    ${text}
                    ---
                `,
                responseSchema: {},
                responseMimeType: 'application/json',
                model: getModel('textGeneration')
            })
        );
        return JSON.parse(jsonStr.trim());

    } catch (error) {
        console.error("Error in Dialogue Analysis agent:", error);
        return [];
    }
};

export const runProsePolishAgent = async (text: string): Promise<ProsePolishIssue[]> => {
    if (text.trim().length < 100) {
        return [];
    }
    try {
        const provider = await getProviderInstance();
        const jsonStr = await withGeminiRetry('runProsePolishAgent', () =>
            provider.generateStructuredText({
                prompt: `
                    Act as an expert line editor. Analyze the following manuscript text, which is provided in paragraphs.
                    For each paragraph that could be stylistically improved, provide a polished rewrite.
                    Focus on improving flow and rhythm, eliminating clichés and filler words, strengthening verbs, reducing passive voice, and enhancing clarity and conciseness.
                    
                    For each identified paragraph, provide:
                    1. The 'original' full paragraph.
                    2. A 'suggestion' with your rewritten, polished version of the paragraph.
                    3. A brief 'explanation' of the key changes you made (e.g., "Improved flow and removed passive voice.").

                    Analyze up to 5 paragraphs from the text that would benefit most from a polish. If no improvements are needed, return an empty array.

                    Return a JSON array with this structure:
                    [
                        {
                            "original": "string (full original paragraph)",
                            "suggestion": "string (polished, rewritten paragraph)",
                            "explanation": "string (brief explanation of stylistic changes)"
                        }
                    ]

                    Manuscript Text (paragraphs separated by newlines):
                    ---
                    ${text.split('\n\n').join('\n---\n')}
                    ---
                `,
                responseSchema: {},
                responseMimeType: 'application/json',
                model: getModel('textGeneration')
            })
        );
        return JSON.parse(jsonStr.trim());

    } catch (error) {
        console.error("Error in Prose Polish agent:", error);
        return [];
    }
};

export const runSensitivityAgent = async (text: string): Promise<SensitivityIssue[]> => {
    if (text.trim().length < 50) {
        return [];
    }
    try {
        const provider = await getProviderInstance();
        const jsonStr = await withGeminiRetry('runSensitivityAgent', () =>
            provider.generateStructuredText({
                prompt: `
                    Act as a professional sensitivity and inclusivity reader. Analyze the following manuscript text.
                    Your goal is to identify language that may be unintentionally biased, outdated, non-inclusive, or rely on harmful stereotypes.
                    
                    For each potential issue you find, provide the following:
                    1. 'quote': The exact text snippet containing the issue.
                    2. 'issue': A brief, neutral description of the potential issue (e.g., "Outdated Term," "Potential Gender Bias," "Ableist Language").
                    3. 'explanation': A constructive explanation of why the term or phrase might be problematic and the context.
                    4. 'suggestion': A respectful and inclusive alternative phrasing.

                    Focus on providing helpful, educational feedback to the author. If no issues are found, return an empty array.

                    Return a JSON array with this structure:
                    [
                        {
                            "quote": "string (exact text snippet with issue)",
                            "issue": "string (brief neutral description)",
                            "explanation": "string (constructive explanation)",
                            "suggestion": "string (respectful inclusive alternative)"
                        }
                    ]

                    Manuscript to analyze:
                    ---
                    ${text}
                    ---
                `,
                responseSchema: {},
                responseMimeType: 'application/json',
                model: getModel('textGeneration')
            })
        );
        return JSON.parse(jsonStr.trim());

    } catch (error) {
        console.error("Error in Sensitivity agent:", error);
        return [];
    }
};

export const runStructuralAnalysisAgent = async (text: string): Promise<StructuralIssue[]> => {
    if (text.trim().length < 500) { // Requires significant context
        return [];
    }
    try {
        const provider = await getProviderInstance();
        const jsonStr = await withGeminiRetry('runStructuralAnalysisAgent', () =>
            provider.generateStructuredText({
                prompt: `
                    Act as a senior developmental editor. Analyze the entire manuscript provided below for high-level structural issues.
                    Focus on the following areas:
                    - **Pacing**: Identify sections that feel rushed or drag on too long.
                    - **Plot Holes**: Find logical inconsistencies or unresolved plot threads.
                    - **Character Arcs**: Assess if the main characters undergo meaningful development.
                    - **Structural Suggestions**: Provide recommendations for improving the overall narrative structure, such as reordering chapters or strengthening the story's midpoint.

                    For each of the most significant issues you find (up to 5), provide:
                    1. 'type': The category of the issue ('Pacing', 'Plot Hole', 'Character Arc', 'Structural Suggestion').
                    2. 'description': A detailed but clear explanation of the structural problem.
                    3. 'suggestion': A concrete, actionable suggestion for how the author could address the issue.

                    Do not comment on grammar, spelling, or sentence-level style. Focus only on the macro-structure of the story. If no major structural issues are found, return an empty array.

                    Return a JSON array with this structure:
                    [
                        {
                            "type": "string (category: Pacing, Plot Hole, Character Arc, or Structural Suggestion)",
                            "description": "string (detailed explanation of structural problem)",
                            "suggestion": "string (concrete actionable suggestion)"
                        }
                    ]

                    MANUSCRIPT:
                    ---
                    ${text}
                    ---
                `,
                responseSchema: {},
                responseMimeType: 'application/json',
                model: getModel('textGeneration'),
                thinkingBudget: 32768
            })
        );
        return JSON.parse(jsonStr.trim());

    } catch (error) {
        console.error("Error in Structural Analysis agent:", error);
        return [];
    }
};

export const runOutlinePacingAgent = async (outline: OutlineItem[], manuscript: string): Promise<PacingBeat[]> => {
    const condensedOutline = outline.slice(0, 50);
    const prompt = `You are a narrative pacing analyst. Given the document outline and manuscript excerpt below, score the intensity of each major beat (0-100), classify the beat type, and provide a concise note about pacing or emotional impact.

Outline JSON:
${JSON.stringify(condensedOutline, null, 2)}

Manuscript excerpt (first 4500 chars):
${manuscript.substring(0, 4500)}

Return a JSON array of 6-12 beats. Each beat must include:
- "id": unique string
- "outlineId": matching outline item id when available (fallback to "none")
- "heading": heading text
- "beatType": short label (e.g., Setup, Inciting, Midpoint, Climax, Resolution)
- "intensity": number between 0 and 100
- "notes": pacing insight (max 160 chars)

Example structure:
[
    {
        "id": "beat_1",
        "outlineId": "outline_1",
        "heading": "Opening Scene",
        "beatType": "Setup",
        "intensity": 45,
        "notes": "Establishes setting and introduces protagonist"
    }
]
`;

    try {
        const provider = await getProviderInstance();
        const jsonStr = await withGeminiRetry('runOutlinePacingAgent', () =>
            provider.generateStructuredText({
                prompt,
                responseSchema: {},
                responseMimeType: 'application/json',
                model: getModel('textGeneration')
            })
        );
        const payload = jsonStr.trim();
        if (!payload) return [];
        return JSON.parse(payload) as PacingBeat[];
    } catch (error) {
        console.error("Error running outline pacing agent:", error);
        return [];
    }
};

export const generateContinuityTimeline = async (outline: OutlineItem[], manuscript: string): Promise<ContinuityEvent[]> => {
    const trimmedOutline = outline.slice(0, 50);
    const prompt = `You are a continuity editor. Build a linear timeline of key story events, flagging continuity risks.

Outline JSON:
${JSON.stringify(trimmedOutline, null, 2)}

Manuscript excerpt (first 4500 chars):
${manuscript.substring(0, 4500)}

Return a JSON array of timeline events. Each event must include:
- "id": unique string
- "outlineId": optional outline id the event maps to
- "label": short event title
- "summary": 1-2 sentence description
- "risk": one of "low", "medium", "high"
- "recommendation": concrete action to fix the risk

Example structure:
[
    {
        "id": "event_1",
        "outlineId": "outline_1",
        "label": "Character Introduction",
        "summary": "Protagonist meets mentor figure.",
        "risk": "low",
        "recommendation": "None"
    }
]
`;

    try {
        const provider = await getProviderInstance();
        const jsonStr = await withGeminiRetry('generateContinuityTimeline', () =>
            provider.generateStructuredText({
                prompt,
                responseSchema: {},
                responseMimeType: 'application/json',
                model: getModel('textGeneration')
            })
        );
        const payload = jsonStr.trim();
        if (!payload) return [];
        return JSON.parse(payload) as ContinuityEvent[];
    } catch (error) {
        console.error("Error generating continuity timeline:", error);
        return [];
    }
};

export const runAiCommand = async (prompt: string, context: string): Promise<string> => {
    const fullPrompt = `${prompt}\n\nHere is the text to work on:\n---\n${context}\n---`;
    try {
        const response = await ai.models.generateContent({
            model: getModel('textGenerationFast'),
            contents: fullPrompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error running AI command:", error);
        throw new Error("The AI failed to process the request.");
    }
};

export const runCleanupAgent = async (text: string): Promise<string> => {
    const prompt = `Act as a meticulous copyeditor preparing a manuscript for submission. Perform the following cleanup tasks on the text below:
1.  **Smart Typography:** Convert all straight quotes (" and ') to their curly typographic equivalents (e.g., " ", ' '). Convert hyphens used as dashes to proper em dashes (—) or en dashes (–) where appropriate.
2.  **Spacing Hygiene:** Ensure there is only a single space after periods. Remove any instances of multiple spaces between words. Replace three consecutive periods with a proper ellipsis character (…).
3.  **Paragraph and Scene Breaks:** Remove multiple consecutive empty lines, ensuring there's only one empty line between paragraphs. Standardize all scene breaks to be a single line containing only three asterisks surrounded by a single space on each side (' *** ').

Return only the fully cleaned-up text. Do not add any commentary or explanation.

MANUSCRIPT:
---
${text}
---
`;
    const provider = await getProviderInstance();
    return await withGeminiRetry('runCleanupAgent', () =>
        provider.generateText({
            prompt,
            model: getModel('textGeneration')
        })
    );
};

export const runExpertAgent = async (prompt: string, manuscript: string, context: string): Promise<string> => {
    const fullPrompt = `You are an expert editor and continuity checker with deep contextual knowledge. You have been provided with a main manuscript, a "World Bible" containing structured data, and the full text of previous books in the series ("Series Context"). Your task is to answer the user's query by cross-referencing information from ALL provided sources to ensure maximum consistency.

USER QUERY:
---
${prompt}
---

MAIN MANUSCRIPT (CURRENT BOOK):
---
${manuscript}
---

WORLD BIBLE & SERIES CONTEXT:
---
${context}
---

Your Answer:`;

    const provider = await getProviderInstance();
    return await withGeminiRetry('runExpertAgent', () =>
        provider.generateText({
            prompt: fullPrompt,
            model: getModel('textGeneration')
        })
    );
};

export const generateKeywords = async (manuscript: string): Promise<string[]> => {
    const prompt = `Act as a publishing expert. Analyze the following manuscript and generate a list of 7 optimal keywords for Amazon KDP. These keywords should be relevant, target specific niches, and have good search potential. Focus on phrases rather than single words where appropriate.

Manuscript context (first 5000 chars):
---
${manuscript.substring(0, 5000)}...
---

Return the keywords as a valid JSON array of strings, like ["keyword phrase 1", "keyword phrase 2"]. Do not include any other text or markdown.`;

    try {
        const provider = await getProviderInstance();
        const jsonStr = await withGeminiRetry('generateKeywords', () =>
            provider.generateStructuredText({
                prompt,
                responseSchema: {},
                responseMimeType: 'application/json',
                model: getModel('textGenerationFast')
            })
        );
        return JSON.parse(jsonStr.trim());
    } catch (error) {
        console.error("Error generating keywords:", error);
        throw new Error("Failed to generate KDP keywords.");
    }
};

export const runMarketingCampaignAgent = async (manuscript: string): Promise<MarketingCampaign[]> => {
    const prompt = `Act as a social media marketing expert for an author. Your task is to generate a 3-day launch campaign for the book based on the provided manuscript.

For each of the 3 days, create a unique theme and generate one post for each of these platforms: X (formerly Twitter), Facebook, and Instagram.

Each post must be tailored to its platform:
- **X:** Short, punchy, and engaging (max 280 characters).
- **Facebook:** More detailed, can include a question to spark discussion.
- **Instagram:** Visually focused. The content should be a caption for an image. Also, provide a descriptive prompt for an AI image generator to create the accompanying visual.

Return a valid JSON array with this structure:
[
  {
    "day": 1,
    "theme": "Book Launch Announcement",
    "posts": [
      {
        "platform": "X",
        "postContent": "Excited to announce my new book!",
        "hashtags": ["#BookLaunch", "#NewRelease"],
        "visualPrompt": ""
      },
      {
        "platform": "Facebook",
        "postContent": "I'm thrilled to share my latest work with you all. What themes resonate with you?",
        "hashtags": ["#BookLaunch", "#NewBook"],
        "visualPrompt": ""
      },
      {
        "platform": "Instagram",
        "postContent": "Today's the day! My new book is here ✨",
        "hashtags": ["#BookLaunch", "#AuthorLife"],
        "visualPrompt": "A stack of books with soft lighting and coffee"
      }
    ]
  }
]

Manuscript context (first 5000 characters):
---
${manuscript.substring(0, 5000)}...
---`;

    try {
        const provider = await getProviderInstance();
        const jsonStr = await withGeminiRetry('runMarketingCampaignAgent', () =>
            provider.generateStructuredText({
                prompt,
                responseSchema: {},
                responseMimeType: 'application/json',
                model: getModel('textGeneration')
            })
        );
        return JSON.parse(jsonStr.trim());
    } catch (error) {
        console.error("Error generating marketing campaign:", error);
        throw new Error("Failed to generate the marketing campaign.");
    }
};

export const generateLocalizationPack = async (manuscript: string, locales: string[]): Promise<LocalizationPack[]> => {
    const requestedLocales = locales.slice(0, 6);
    const prompt = `You are a literary localization lead. For each requested locale, create a localization pack with fields: locale, localizedTitle, hook (one sentence tagline), blurb (<= 120 words), and toneNotes describing cultural or linguistic considerations.

Locales: ${requestedLocales.join(', ')}

Manuscript excerpt (first 4500 chars):
${manuscript.substring(0, 4500)}

Return a JSON array with this structure:
[
  {
    "locale": "es-ES",
    "localizedTitle": "El Título Localizado",
    "hook": "Una línea de enganche convincente",
    "blurb": "Una descripción atractiva de 120 palabras o menos que captura la esencia de la historia...",
    "toneNotes": "Considerations for Spanish market: use formal register, avoid regionalisms..."
  }
]`;

    try {
        const provider = await getProviderInstance();
        const jsonStr = await withGeminiRetry('generateLocalizationPack', () =>
            provider.generateStructuredText({
                prompt,
                responseSchema: {},
                responseMimeType: 'application/json',
                model: getModel('textGeneration')
            })
        );
        const payload = jsonStr.trim();
        if (!payload) return [];
        return JSON.parse(payload) as LocalizationPack[];
    } catch (error) {
        console.error("Error generating localization pack:", error);
        throw new Error('Failed to generate localization pack.');
    }
};

export const translateMetadata = async (manuscript: string, locales: string[]): Promise<LocalizedMetadata[]> => {
    const requestedLocales = locales.slice(0, 6);
    const prompt = `You are a publishing metadata specialist. For each locale listed, translate and localize metadata for the following manuscript excerpt. Provide up to 8 keywords, 2-3 BISAC-style categories, and an audienceNotes string describing positioning considerations.

Locales: ${requestedLocales.join(', ')}

Manuscript excerpt (first 4500 chars):
${manuscript.substring(0, 4500)}

Return a JSON array with this structure:
[
  {
    "locale": "es-ES",
    "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8"],
    "categories": ["FICTION / Fantasy / General", "FICTION / Action & Adventure"],
    "audienceNotes": "Target audience positioning notes for this locale, including cultural considerations and market preferences..."
  }
]`;

    try {
        const provider = await getProviderInstance();
        const jsonStr = await withGeminiRetry('translateMetadata', () =>
            provider.generateStructuredText({
                prompt,
                responseSchema: {},
                responseMimeType: 'application/json',
                model: getModel('textGeneration')
            })
        );
        const payload = jsonStr.trim();
        if (!payload) return [];
        return JSON.parse(payload) as LocalizedMetadata[];
    } catch (error) {
        console.error("Error translating metadata:", error);
        throw new Error('Failed to translate metadata.');
    }
};


export const createChatSession = (history?: { role: 'user' | 'model', parts: { text: string }[] }[]): any => {
    return ai.chats.create({
        model: getModel('textGenerationFast'),
        history: history
    });
};

export const sendChatMessage = async (chat: any, message: string): Promise<string> => {
    try {
        const response = await chat.sendMessage({ message });
        return response.text;
    } catch (error) {
        console.error("Error sending chat message:", error);
        throw new Error("Failed to get a response from the chat AI.");
    }
};
