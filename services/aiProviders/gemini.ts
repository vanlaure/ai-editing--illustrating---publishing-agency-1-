import { GoogleGenAI, Type, Modality } from "@google/genai";
import { IAiProvider, TextGenerationOptions, StructuredTextGenerationOptions, ImageGenerationOptions, AudioGenerationOptions, ImageEditOptions, ChatOptions, ModelInfo, ProviderConfig } from "./types";

export class GeminiProvider implements IAiProvider {
  readonly name = 'Gemini';
  readonly supportsImages = true;
  readonly supportsAudio = true;
  readonly supportsStructuredOutput = true;
  readonly supportsChat = true;
  readonly supportsTools = true;

  private ai: GoogleGenAI;
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.ai = new GoogleGenAI({ apiKey: config.apiKey });
  }

  async generateText(options: TextGenerationOptions): Promise<string> {
    const model = options.model || this.config.models?.textGeneration || 'gemini-2.5-pro';
    const response = await this.ai.models.generateContent({
      model,
      contents: options.prompt,
      config: {
        temperature: options.temperature,
        maxOutputTokens: options.maxTokens,
        systemInstruction: options.systemPrompt,
      }
    });
    return response.text;
  }

  async generateStructuredText(options: StructuredTextGenerationOptions): Promise<string> {
    const model = options.model || this.config.models?.textGeneration || 'gemini-2.5-pro';
    const response = await this.ai.models.generateContent({
      model,
      contents: options.prompt,
      config: {
        temperature: options.temperature,
        maxOutputTokens: options.maxTokens,
        systemInstruction: options.systemPrompt,
        responseMimeType: options.responseMimeType || "application/json",
        responseSchema: options.responseSchema,
      }
    });
    return response.text.trim();
  }

  async generateImages(options: ImageGenerationOptions): Promise<string[]> {
    const model = options.model || this.config.models?.imageGeneration || 'imagen-4.0-generate-001';
    const response = await this.ai.models.generateImages({
      model,
      prompt: options.prompt,
      config: {
        numberOfImages: options.numberOfImages || 1,
        outputMimeType: `image/${options.outputFormat || 'png'}`,
        aspectRatio: options.aspectRatio || '3:4',
      },
    });
    return response.generatedImages.map(img => img.image.imageBytes);
  }

  async generateAudio(options: AudioGenerationOptions): Promise<string> {
    const model = options.model || this.config.models?.audioGeneration || 'gemini-2.5-flash-preview-tts';
    const fullPrompt = options.stylePrompt ? `${options.stylePrompt}: ${options.text}` : options.text;
    
    const response = await this.ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: fullPrompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: options.voiceName || 'Kore' },
          },
        },
      },
    });
    
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio data returned from Gemini API.");
    }
    return base64Audio;
  }

  async editImage(options: ImageEditOptions): Promise<string> {
    const imagePart = {
      inlineData: {
        mimeType: 'image/png',
        data: options.base64Image,
      },
    };
    const textPart = { text: options.prompt };
    
    const response = await this.ai.models.generateContent({
      model: options.model || 'gemini-2.5-flash-image',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });
    
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    throw new Error("No image data returned from Gemini API.");
  }

  createChatSession(options: ChatOptions): any {
    const model = options.model || this.config.models?.textGenerationFast || 'gemini-2.5-flash';
    return this.ai.chats.create({
      model,
      history: options.history?.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : msg.role,
        parts: [{ text: msg.content }]
      }))
    });
  }

  async sendChatMessage(chat: any, message: string): Promise<string> {
    const response = await chat.sendMessage({ message });
    return response.text;
  }

  async listModels(): Promise<ModelInfo[]> {
    return [
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', capabilities: ['text', 'structured', 'tools', 'thinking'] },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', capabilities: ['text', 'structured', 'tools'] },
      { id: 'gemini-2.5-flash-image', name: 'Gemini 2.5 Flash Image', capabilities: ['image-edit'] },
      { id: 'imagen-4.0-generate-001', name: 'Imagen 4.0', capabilities: ['image-gen'] },
      { id: 'gemini-2.5-flash-preview-tts', name: 'Gemini TTS', capabilities: ['audio-gen'] },
      { id: 'text-embedding-004', name: 'Text Embedding 004', capabilities: ['embedding'] },
    ];
  }
}