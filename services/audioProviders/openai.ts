import OpenAI from 'openai';
import {
  IAudioProvider,
  AudioGenerationResult,
  VoiceInfo,
  OpenAIAudioConfig,
  AudioGenerationOptions,
  OpenAITTSOptions
} from './types';

export class OpenAIAudioProvider implements IAudioProvider {
  readonly name = 'openai' as const;
  readonly supportsEmotion = false;
  readonly supportsProsodyControl = true;
  readonly supportsMultipleVoices = true;
  readonly isLocal = false;

  private client: OpenAI;

  private readonly VOICES: VoiceInfo[] = [
    {
      id: 'alloy',
      name: 'Alloy',
      gender: 'neutral',
      age: 'adult',
      style: 'balanced, versatile',
      languages: ['en']
    },
    {
      id: 'echo',
      name: 'Echo',
      gender: 'male',
      age: 'adult',
      style: 'deep, resonant',
      languages: ['en']
    },
    {
      id: 'fable',
      name: 'Fable',
      gender: 'male',
      age: 'adult',
      style: 'warm, friendly',
      languages: ['en']
    },
    {
      id: 'onyx',
      name: 'Onyx',
      gender: 'male',
      age: 'adult',
      style: 'deep, authoritative',
      languages: ['en']
    },
    {
      id: 'nova',
      name: 'Nova',
      gender: 'female',
      age: 'young',
      style: 'bright, energetic',
      languages: ['en']
    },
    {
      id: 'shimmer',
      name: 'Shimmer',
      gender: 'female',
      age: 'adult',
      style: 'soft, gentle',
      languages: ['en']
    }
  ];

  constructor(private config: OpenAIAudioConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      dangerouslyAllowBrowser: true
    });
  }

  async generateAudio(options: AudioGenerationOptions): Promise<AudioGenerationResult> {
    if (options.provider !== 'openai') {
      throw new Error('Invalid provider for OpenAIAudioProvider');
    }

    const openaiOptions = options as OpenAITTSOptions;
    const startTime = Date.now();

    try {
      const speed = openaiOptions.speed || 1.0;
      const voice = openaiOptions.voice || 'alloy';
      const model = openaiOptions.model || this.config.defaultModel || 'tts-1';
      const format = this.mapFormatToOpenAI(openaiOptions.responseFormat || 'mp3');

      const response = await this.client.audio.speech.create({
        model,
        voice,
        input: openaiOptions.text,
        speed,
        response_format: format
      });

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const audioData = buffer.toString('base64');
      const audioBlob = new Blob([buffer], { 
        type: this.getMimeType(format) 
      });

      const duration = await this.estimateAudioDuration(buffer, format);

      return {
        audioData,
        audioUrl: URL.createObjectURL(audioBlob),
        format,
        duration,
        metadata: {
          provider: 'openai',
          model,
          voice,
          speed,
          processingTime: Date.now() - startTime,
          sampleRate: this.getSampleRate(format),
          channels: 1,
          bitrate: this.getBitrate(model, format)
        }
      };
    } catch (error) {
      throw new Error(`OpenAI audio generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async listVoices(): Promise<VoiceInfo[]> {
    return this.VOICES;
  }

  async testConnection(): Promise<boolean> {
    try {
      const testText = 'Test';
      await this.client.audio.speech.create({
        model: this.config.defaultModel || 'tts-1',
        voice: 'alloy',
        input: testText
      });
      return true;
    } catch (error) {
      console.error('OpenAI connection test failed:', error);
      return false;
    }
  }

  private mapFormatToOpenAI(format: string): 'mp3' | 'opus' | 'aac' | 'flac' | 'wav' | 'pcm' {
    const formatMap: Record<string, 'mp3' | 'opus' | 'aac' | 'flac' | 'wav' | 'pcm'> = {
      'mp3': 'mp3',
      'opus': 'opus',
      'ogg': 'opus',
      'aac': 'aac',
      'm4a': 'aac',
      'flac': 'flac',
      'wav': 'wav',
      'pcm': 'pcm'
    };
    return formatMap[format.toLowerCase()] || 'mp3';
  }

  private getMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      'mp3': 'audio/mpeg',
      'opus': 'audio/opus',
      'aac': 'audio/aac',
      'flac': 'audio/flac',
      'wav': 'audio/wav',
      'pcm': 'audio/pcm'
    };
    return mimeTypes[format] || 'audio/mpeg';
  }

  private getSampleRate(format: string): number {
    if (format === 'opus') return 48000;
    if (format === 'pcm') return 24000;
    return 24000;
  }

  private getBitrate(model: string, format: string): number {
    if (model === 'tts-1-hd') {
      return format === 'opus' ? 128000 : 192000;
    }
    return format === 'opus' ? 96000 : 128000;
  }

  private async estimateAudioDuration(buffer: Buffer, format: string): Promise<number> {
    const sampleRate = this.getSampleRate(format);
    const bitrate = this.getBitrate(this.config.defaultModel || 'tts-1', format);
    
    if (format === 'pcm') {
      const bytesPerSample = 2;
      const channels = 1;
      const samples = buffer.length / (bytesPerSample * channels);
      return samples / sampleRate;
    }

    const bitsPerSecond = bitrate;
    const bytesPerSecond = bitsPerSecond / 8;
    return buffer.length / bytesPerSecond;
  }

  async generateWithSpeedControl(
    text: string,
    voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
    speed: number
  ): Promise<AudioGenerationResult> {
    const options: OpenAITTSOptions = {
      provider: 'openai',
      text,
      voice,
      speed,
      model: this.config.defaultModel || 'tts-1'
    };
    return this.generateAudio(options);
  }
}