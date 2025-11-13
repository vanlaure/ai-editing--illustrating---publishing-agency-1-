import {
  IAudioProvider,
  ProviderConfiguration,
  AudioProviderType
} from './types';

export class AudioProviderFactory {
  static async createProvider(config: ProviderConfiguration): Promise<IAudioProvider> {
    switch (config.type) {
      case 'gemini':
        return this.createGeminiProvider(config);
      case 'openai':
        return this.createOpenAIProvider(config);
      case 'chatterbox':
        return this.createChatterboxProvider(config);
      case 'comfyui':
        return this.createComfyUIProvider(config);
      case 'elevenlabs':
        return this.createElevenLabsProvider(config);
      case 'azure':
        return this.createAzureProvider(config);
      case 'aws':
        return this.createAWSProvider(config);
      default:
        throw new Error(`Unsupported audio provider type: ${(config as any).type}`);
    }
  }

  private static async createGeminiProvider(config: Extract<ProviderConfiguration, { type: 'gemini' }>): Promise<IAudioProvider> {
    const { GeminiAudioProvider } = await import('./gemini');
    return new GeminiAudioProvider(config.config);
  }

  private static async createOpenAIProvider(config: Extract<ProviderConfiguration, { type: 'openai' }>): Promise<IAudioProvider> {
    const { OpenAIAudioProvider } = await import('./openai');
    return new OpenAIAudioProvider(config.config);
  }

  private static async createChatterboxProvider(config: Extract<ProviderConfiguration, { type: 'chatterbox' }>): Promise<IAudioProvider> {
    const { ChatterboxAudioProvider } = await import('./chatterbox');
    return new ChatterboxAudioProvider(config.config);
  }

  private static async createComfyUIProvider(config: Extract<ProviderConfiguration, { type: 'comfyui' }>): Promise<IAudioProvider> {
    const { ComfyUIAudioProvider } = await import('./comfyui');
    return new ComfyUIAudioProvider(config.config);
  }

  private static async createElevenLabsProvider(config: Extract<ProviderConfiguration, { type: 'elevenlabs' }>): Promise<IAudioProvider> {
    const { ElevenLabsProvider } = await import('./elevenlabs');
    return new ElevenLabsProvider(config.config);
  }

  private static async createAzureProvider(config: Extract<ProviderConfiguration, { type: 'azure' }>): Promise<IAudioProvider> {
    const { AzureAudioProvider } = await import('./azure');
    return new AzureAudioProvider(config.config);
  }

  private static async createAWSProvider(config: Extract<ProviderConfiguration, { type: 'aws' }>): Promise<IAudioProvider> {
    const { AWSAudioProvider } = await import('./aws');
    return new AWSAudioProvider(config.config);
  }

  static getSupportedProviders(): AudioProviderType[] {
    return ['gemini', 'openai', 'chatterbox', 'comfyui', 'elevenlabs', 'azure', 'aws'];
  }

  static getLocalProviders(): AudioProviderType[] {
    return ['chatterbox', 'comfyui'];
  }

  static getCloudProviders(): AudioProviderType[] {
    return ['gemini', 'openai', 'elevenlabs', 'azure', 'aws'];
  }

  static getTTSProviders(): AudioProviderType[] {
    return ['gemini', 'openai', 'chatterbox', 'elevenlabs', 'azure', 'aws'];
  }

  static getMusicProviders(): AudioProviderType[] {
    return ['comfyui'];
  }

  static isProviderSupported(type: string): type is AudioProviderType {
    return this.getSupportedProviders().includes(type as AudioProviderType);
  }

  static validateProviderConfig(config: ProviderConfiguration): boolean {
    if (!this.isProviderSupported(config.type)) {
      throw new Error(`Invalid provider type: ${config.type}`);
    }

    const localProviders = this.getLocalProviders();
    const requiresApiKey = !localProviders.includes(config.type);
    
    if (requiresApiKey) {
      const hasApiKey = 'apiKey' in config.config && config.config.apiKey;
      if (!hasApiKey) {
        throw new Error(`API key required for provider: ${config.type}`);
      }
    }

    return true;
  }
}