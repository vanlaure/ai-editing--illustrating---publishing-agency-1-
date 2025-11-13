import { IAiProvider, TextGenerationOptions, StructuredTextGenerationOptions, ChatOptions, ModelInfo, ProviderConfig } from "./types";

export class GroqProvider implements IAiProvider {
  readonly name = 'Groq';
  readonly supportsImages = false;
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
    this.endpoint = config.endpoint || 'https://api.groq.com/openai/v1';
  }

  async generateText(options: TextGenerationOptions): Promise<string> {
    const model = options.model || this.config.models?.textGeneration || 'llama-3.3-70b-versatile';
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
      throw new Error(`Groq API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async generateStructuredText(options: StructuredTextGenerationOptions): Promise<string> {
    const model = options.model || this.config.models?.textGeneration || 'llama-3.3-70b-versatile';
    const systemPrompt = options.systemPrompt 
      ? `${options.systemPrompt}\n\nIMPORTANT: Respond with valid JSON only. No markdown, no code blocks, just raw JSON.`
      : 'Respond with valid JSON only. No markdown, no code blocks, just raw JSON.';

    const response = await fetch(`${this.endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: options.prompt }
        ],
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`);
    }

    const data = await response.json();
    let text = data.choices[0].message.content;
    
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    return text;
  }

  async generateImages(): Promise<string[]> {
    throw new Error('Groq provider does not support image generation');
  }

  async generateAudio(): Promise<string> {
    throw new Error('Groq provider does not support audio generation');
  }

  async editImage(): Promise<string> {
    throw new Error('Groq provider does not support image editing');
  }

  createChatSession(options: ChatOptions): any {
    const model = options.model || this.config.models?.textGenerationFast || 'llama-3.1-8b-instant';
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
      throw new Error(`Groq API error: ${response.statusText}`);
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
      throw new Error(`Groq API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data.map((model: any) => ({
      id: model.id,
      name: model.id,
      capabilities: ['text', 'structured', 'tools'],
    }));
  }
}