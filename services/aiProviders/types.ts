export interface TextGenerationOptions {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  thinkingBudget?: number;
}

export interface StructuredTextGenerationOptions extends TextGenerationOptions {
  responseSchema: any;
  responseMimeType?: string;
}

export interface ImageGenerationOptions {
  prompt: string;
  model?: string;
  numberOfImages?: number;
  aspectRatio?: '1:1' | '3:4' | '16:9';
  outputFormat?: 'png' | 'jpeg';
}

export interface AudioGenerationOptions {
  text: string;
  model?: string;
  voiceName?: string;
  stylePrompt?: string;
}

export interface ImageEditOptions {
  base64Image: string;
  prompt: string;
  model?: string;
}

export interface ChatMessage {
  role: 'user' | 'model' | 'assistant' | 'system';
  content: string;
}

export interface ChatOptions {
  model?: string;
  history?: ChatMessage[];
}

export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  contextWindow?: number;
  capabilities?: string[];
}

export interface IAiProvider {
  readonly name: string;
  readonly supportsImages: boolean;
  readonly supportsAudio: boolean;
  readonly supportsStructuredOutput: boolean;
  readonly supportsChat: boolean;
  readonly supportsTools: boolean;

  generateText(options: TextGenerationOptions): Promise<string>;
  generateStructuredText(options: StructuredTextGenerationOptions): Promise<string>;
  generateImages?(options: ImageGenerationOptions): Promise<string[]>;
  generateAudio?(options: AudioGenerationOptions): Promise<string>;
  editImage?(options: ImageEditOptions): Promise<string>;
  createChatSession?(options: ChatOptions): any;
  sendChatMessage?(chat: any, message: string): Promise<string>;
  listModels?(): Promise<ModelInfo[]>;
}

export type ProviderType = 'gemini' | 'openai' | 'anthropic' | 'openrouter' | 'groq' | 'custom';

export interface ProviderConfig {
  type: ProviderType;
  apiKey: string;
  endpoint?: string;
  models?: {
    textGeneration?: string;
    textGenerationFast?: string;
    imageGeneration?: string;
    audioGeneration?: string;
    embedding?: string;
  };
}