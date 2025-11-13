import { IAiProvider, TextGenerationOptions, StructuredTextGenerationOptions, ChatOptions, ModelInfo, ProviderConfig } from "./types";

export class AnthropicProvider implements IAiProvider {
  readonly name = 'Anthropic';
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
    this.endpoint = config.endpoint || 'https://api.anthropic.com/v1';
  }

  async generateText(options: TextGenerationOptions): Promise<string> {
    const model = options.model || this.config.models?.textGeneration || 'claude-sonnet-4-5';
    const response = await fetch(`${this.endpoint}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: options.prompt }],
        system: options.systemPrompt,
        temperature: options.temperature,
        max_tokens: options.maxTokens || 4096,
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  async generateStructuredText(options: StructuredTextGenerationOptions): Promise<string> {
    const model = options.model || this.config.models?.textGeneration || 'claude-sonnet-4-5';
    const systemPrompt = options.systemPrompt 
      ? `${options.systemPrompt}\n\nIMPORTANT: Respond with valid JSON only. No markdown, no code blocks, just raw JSON.`
      : 'Respond with valid JSON only. No markdown, no code blocks, just raw JSON.';

    const response = await fetch(`${this.endpoint}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: options.prompt }],
        system: systemPrompt,
        temperature: options.temperature,
        max_tokens: options.maxTokens || 4096,
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    let text = data.content[0].text;
    
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    return text;
  }

  async generateImages(): Promise<string[]> {
    throw new Error('Anthropic provider does not support image generation');
  }

  async generateAudio(): Promise<string> {
    throw new Error('Anthropic provider does not support audio generation');
  }

  async editImage(): Promise<string> {
    throw new Error('Anthropic provider does not support image editing');
  }

  createChatSession(options: ChatOptions): any {
    const model = options.model || this.config.models?.textGenerationFast || 'claude-haiku-4';
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

    const response = await fetch(`${chat.endpoint}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': chat.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: chat.model,
        messages,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    const reply = data.content[0].text;
    
    chat.history.push({ role: 'user', content: message });
    chat.history.push({ role: 'assistant', content: reply });
    
    return reply;
  }

  async listModels(): Promise<ModelInfo[]> {
    return [
      { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5', capabilities: ['text', 'structured', 'tools', 'thinking'] },
      { id: 'claude-opus-4', name: 'Claude Opus 4', capabilities: ['text', 'structured', 'tools', 'thinking'] },
      { id: 'claude-haiku-4', name: 'Claude Haiku 4', capabilities: ['text', 'structured', 'tools'] },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', capabilities: ['text', 'structured', 'tools'] },
    ];
  }
}