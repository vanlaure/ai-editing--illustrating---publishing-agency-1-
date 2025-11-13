import { IAiProvider, ProviderConfig } from './types';
import { GeminiProvider } from './gemini';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { GroqProvider } from './groq';
import { OpenRouterProvider } from './openrouter';

export class ProviderFactory {
  static createProvider(config: ProviderConfig): IAiProvider {
    switch (config.type) {
      case 'gemini':
        return new GeminiProvider(config);
      case 'openai':
        return new OpenAIProvider(config);
      case 'anthropic':
        return new AnthropicProvider(config);
      case 'groq':
        return new GroqProvider(config);
      case 'openrouter':
        return new OpenRouterProvider(config);
      case 'custom':
        return new OpenAIProvider({ ...config, endpoint: config.endpoint });
      default:
        throw new Error(`Unsupported provider type: ${config.type}`);
    }
  }

  static getSupportedProviders(): string[] {
    return ['gemini', 'openai', 'anthropic', 'groq', 'openrouter', 'custom'];
  }
}