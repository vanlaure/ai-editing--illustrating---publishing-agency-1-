import { GoogleGenAI, Modality } from "@google/genai";
import { 
  IAudioProvider, 
  AudioGenerationResult, 
  GeminiTTSOptions,
  GeminiAudioConfig,
  VoiceInfo,
  AudioGenerationOptions
} from "./types";

export class GeminiAudioProvider implements IAudioProvider {
  readonly name = 'gemini' as const;
  readonly supportsEmotion = false;
  readonly supportsProsodyControl = true;
  readonly supportsMultipleVoices = true;
  readonly isLocal = false;

  private ai: GoogleGenAI;
  private config: GeminiAudioConfig;

  constructor(config: GeminiAudioConfig) {
    this.config = config;
    this.ai = new GoogleGenAI({ 
      apiKey: config.apiKey,
      ...(config.endpoint && { baseUrl: config.endpoint })
    });
  }

  async generateAudio(options: AudioGenerationOptions): Promise<AudioGenerationResult> {
    if (options.provider !== 'gemini') {
      throw new Error('Invalid provider for GeminiAudioProvider');
    }

    const geminiOptions = options as GeminiTTSOptions;
    const startTime = Date.now();

    const model = geminiOptions.model || this.config.defaultModel || 'gemini-2.5-flash-preview-tts';
    const voiceName = geminiOptions.voiceName || this.config.defaultVoice || 'Kore';

    const response = await this.ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: geminiOptions.text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { 
              voiceName 
            },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio data returned from Gemini API");
    }

    const audioBuffer = Buffer.from(base64Audio, 'base64');
    const audioDuration = await this.estimateAudioDuration(audioBuffer, geminiOptions.sampleRate || 24000);

    const audioBlob = new Blob([audioBuffer], { type: 'audio/mp3' });
    const audioUrl = URL.createObjectURL(audioBlob);

    const processingTime = Date.now() - startTime;

    return {
      audioData: base64Audio,
      audioUrl,
      duration: audioDuration,
      format: geminiOptions.outputFormat || 'mp3',
      metadata: {
        provider: 'gemini',
        model,
        voice: voiceName,
        timestamp: new Date(),
        processingTime,
        sampleRate: geminiOptions.sampleRate || 24000,
        channels: 1,
        bitrate: 128000
      },
    };
  }

  async listVoices(): Promise<VoiceInfo[]> {
    return [
      {
        id: 'Kore',
        name: 'Kore',
        gender: 'female',
        age: 'adult',
        style: 'neutral',
        languages: ['en-US'],
        provider: 'gemini',
        description: 'Warm, clear female voice suitable for narration'
      },
      {
        id: 'Charon',
        name: 'Charon',
        gender: 'male',
        age: 'adult',
        style: 'neutral',
        languages: ['en-US'],
        provider: 'gemini',
        description: 'Deep, authoritative male voice'
      },
      {
        id: 'Fenrir',
        name: 'Fenrir',
        gender: 'male',
        age: 'adult',
        style: 'dramatic',
        languages: ['en-US'],
        provider: 'gemini',
        description: 'Powerful, dramatic male voice'
      },
      {
        id: 'Aoede',
        name: 'Aoede',
        gender: 'female',
        age: 'young',
        style: 'bright',
        languages: ['en-US'],
        provider: 'gemini',
        description: 'Bright, youthful female voice'
      },
      {
        id: 'Puck',
        name: 'Puck',
        gender: 'neutral',
        age: 'young',
        style: 'playful',
        languages: ['en-US'],
        provider: 'gemini',
        description: 'Playful, energetic voice'
      }
    ];
  }

  async testConnection(): Promise<boolean> {
    try {
      const testOptions: GeminiTTSOptions = {
        provider: 'gemini',
        text: 'Test',
        voiceName: 'Kore',
      };
      await this.generateAudio(testOptions);
      return true;
    } catch (error) {
      console.error('Gemini connection test failed:', error);
      return false;
    }
  }

  private async estimateAudioDuration(audioBuffer: Buffer, sampleRate: number): Promise<number> {
    const bytesPerSample = 2;
    const channels = 1;
    const samples = audioBuffer.length / (bytesPerSample * channels);
    return samples / sampleRate;
  }

  async generateWithProsodyControl(
    text: string,
    options: {
      voiceName?: string;
      speakingRate?: number;
      pitch?: number;
      volumeGainDb?: number;
      languageCode?: string;
    }
  ): Promise<AudioGenerationResult> {
    const geminiOptions: GeminiTTSOptions = {
      provider: 'gemini',
      text,
      voiceName: options.voiceName || this.config.defaultVoice,
      speakingRate: options.speakingRate,
      pitch: options.pitch,
      volumeGainDb: options.volumeGainDb,
      languageCode: options.languageCode || 'en-US',
    };

    return this.generateAudio(geminiOptions);
  }
}