import { IAiProvider, TextGenerationOptions, StructuredTextGenerationOptions, ImageGenerationOptions, ChatOptions, ModelInfo, ProviderConfig } from "./types";

export class OpenAIProvider implements IAiProvider {
  readonly name = 'OpenAI';
  readonly supportsImages = true;
  readonly supportsAudio = false;
  readonly supportsStructuredOutput = true;
  readonly supportsChat = true;
  readonly supportsTools = true;

  private apiKey: string;
  private endpoint: string;
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.apiKey = config.apiKey;
    this.endpoint = config.endpoint || 'https://api.openai.com/v1';
  }

  async generateText(options: TextGenerationOptions): Promise<string> {
    const model = options.model || this.config.models?.textGeneration || 'gpt-4o';
    const response = await fetch(`${this.endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          ...(options.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
          { role: 'user', content: options.prompt }
        ],
        temperature: options.temperature,
        max_tokens: options.maxTokens,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async generateStructuredText(options: StructuredTextGenerationOptions): Promise<string> {
    const model = options.model || this.config.models?.textGeneration || 'gpt-4o';
    const response = await fetch(`${this.endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          ...(options.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
          { role: 'user', content: options.prompt }
        ],
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async generateImages(options: ImageGenerationOptions): Promise<string[]> {
    const model = options.model || this.config.models?.imageGeneration || 'dall-e-3';
    const response = await fetch(`${this.endpoint}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        prompt: options.prompt,
        n: options.numberOfImages || 1,
        size: this.mapAspectRatioToSize(options.aspectRatio),
        response_format: 'b64_json',
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data.map((img: any) => img.b64_json);
  }

  async generateAudio(): Promise<string> {
    throw new Error('OpenAI provider does not support audio generation through this interface');
  }

  async editImage(): Promise<string> {
    throw new Error('OpenAI provider does not support image editing through this interface');
  }

  createChatSession(options: ChatOptions): any {
    const model = options.model || this.config.models?.textGenerationFast || 'gpt-4o-mini';
    return {
      model,
      history: options.history || [],
      endpoint: this.endpoint,
      apiKey: this.apiKey,
    };
  }

  async sendChatMessage(chat: any, message: string): Promise<string> {
    const messages = [
      ...chat.history,
      { role: 'user', content: message }
    ];

    const response = await fetch(`${chat.endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${chat.apiKey}`,
      },
      body: JSON.stringify({
        model: chat.model,
        messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;
    
    chat.history.push({ role: 'user', content: message });
    chat.history.push({ role: 'assistant', content: reply });
    
    return reply;
  }

  async listModels(): Promise<ModelInfo[]> {
    const response = await fetch(`${this.endpoint}/models`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data
      .filter((model: any) => model.id.startsWith('gpt-') || model.id.startsWith('dall-e'))
      .map((model: any) => ({
        id: model.id,
        name: model.id,
        capabilities: this.inferCapabilities(model.id),
      }));
  }

  private mapAspectRatioToSize(aspectRatio?: string): string {
    switch (aspectRatio) {
      case '1:1': return '1024x1024';
      case '16:9': return '1792x1024';
      case '9:16': return '1024x1792';
      default: return '1024x1024';
    }
  }

  private inferCapabilities(modelId: string): string[] {
    if (modelId.startsWith('dall-e')) {
      return ['image-gen'];
    }
    if (modelId.includes('gpt-4')) {
      return ['text', 'structured', 'tools'];
    }
    return ['text', 'structured'];
  }
}