import { AudioProviderFactory } from './audioProviders/factory';
import { FFmpegAudioService, AudioEffectsChain } from './audioProviders/ffmpeg';
import type {
  IAudioProvider,
  AudioProviderType,
  AudioGenerationOptions,
  AudioGenerationResult,
  ProviderConfiguration
} from './audioProviders/types';
import type { CharacterVoiceAssignment, AudioProviderConfig } from '../types';

// Local voice personality preset definition
export interface VoicePersonalityPreset {
  name: string;
  pitch?: number; // semitones
  speed?: number; // multiplier
  reverb?: boolean;
  eq?: boolean;
}

export interface DialogueLine {
  id: string;
  sceneId: string;
  characterName: string;
  text: string;
  timestamp?: number;
  emotion?: string;
}

export interface GeneratedDialogue {
  lineId: string;
  sceneId: string;
  characterName: string;
  audioUrl: string;
  duration: number;
  voiceProvider: AudioProviderType;
  voiceId: string;
  appliedEffects?: string[];
}

export interface AudioProductionProgress {
  total: number;
  completed: number;
  current?: DialogueLine;
  status: 'idle' | 'generating' | 'processing' | 'complete' | 'error';
  error?: string;
}

export interface CharacterVoiceConfig {
  characterName: string;
  provider: AudioProviderType;
  voiceId: string;
  voiceConfig?: Partial<AudioGenerationOptions>;
  personalityPreset?: VoicePersonalityPreset;
  emotionMapping?: Record<string, any>;
}

export class AudioProductionService {
  private ffmpegService: FFmpegAudioService;
  private progressCallback?: (progress: AudioProductionProgress) => void;

  constructor() {
    this.ffmpegService = new FFmpegAudioService();
  }

  /**
   * Set callback for progress updates during batch generation
   */
  setProgressCallback(callback: (progress: AudioProductionProgress) => void) {
    this.progressCallback = callback;
  }

  /**
   * Generate audio for all dialogue lines in a scene
   */
  async generateSceneDialogue(
    dialogueLines: DialogueLine[],
    characterVoiceConfigs: CharacterVoiceConfig[],
    providerConfigs: Record<AudioProviderType, AudioProviderConfig>
  ): Promise<GeneratedDialogue[]> {
    const results: GeneratedDialogue[] = [];
    const total = dialogueLines.length;

    this.updateProgress({
      total,
      completed: 0,
      status: 'generating'
    });

    for (let i = 0; i < dialogueLines.length; i++) {
      const line = dialogueLines[i];
      
      this.updateProgress({
        total,
        completed: i,
        current: line,
        status: 'generating'
      });

      try {
        const voiceConfig = this.getVoiceConfigForCharacter(
          line.characterName,
          characterVoiceConfigs
        );

        if (!voiceConfig) {
          console.warn(`No voice config found for character: ${line.characterName}`);
          continue;
        }

        // Generate base TTS audio
        const audioResult = await this.generateDialogueAudio(
          line,
          voiceConfig,
          providerConfigs[voiceConfig.provider]
        );

        // Apply voice personality effects if configured
        let finalAudioUrl = audioResult.audioUrl;
        const appliedEffects: string[] = [];

        if (voiceConfig.personalityPreset) {
          this.updateProgress({
            total,
            completed: i,
            current: line,
            status: 'processing'
          });

          finalAudioUrl = await this.applyVoicePersonality(
            audioResult.audioUrl,
            voiceConfig.personalityPreset
          );
          appliedEffects.push(`personality:${voiceConfig.personalityPreset}`);
        }

        results.push({
          lineId: line.id,
          sceneId: line.sceneId,
          characterName: line.characterName,
          audioUrl: finalAudioUrl,
          duration: audioResult.duration,
          voiceProvider: voiceConfig.provider,
          voiceId: voiceConfig.voiceId,
          appliedEffects
        });

      } catch (error) {
        console.error(`Failed to generate audio for line ${line.id}:`, error);
        this.updateProgress({
          total,
          completed: i,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    this.updateProgress({
      total,
      completed: total,
      status: 'complete'
    });

    return results;
  }

  /**
   * Generate audio for a single dialogue line
   */
  private async generateDialogueAudio(
    line: DialogueLine,
    voiceConfig: CharacterVoiceConfig,
    providerConfig: AudioProviderConfig
  ): Promise<{ audioUrl: string; duration: number }> {
    // Convert AudioProviderConfig to ProviderConfiguration
    const factoryConfig: ProviderConfiguration = this.convertToProviderConfiguration(providerConfig);
    const provider = await AudioProviderFactory.createProvider(factoryConfig);

    // Build generation parameters with proper type
    const params: AudioGenerationOptions = {
      provider: voiceConfig.provider,
      text: line.text,
      voiceId: voiceConfig.voiceId,
      contentType: 'dialogue'
    } as AudioGenerationOptions;

    // Add emotion if supported and configured
    if (line.emotion && voiceConfig.emotionMapping?.[line.emotion]) {
      (params as any).emotion = voiceConfig.emotionMapping[line.emotion];
    }

    // Merge voice-specific configuration
    if (voiceConfig.voiceConfig) {
      Object.assign(params, voiceConfig.voiceConfig);
    }

    const result = await provider.generateAudio(params);

    return {
      audioUrl: result.audioUrl,
      duration: result.duration || 0
    };
  }

  /**
   * Apply voice personality preset using FFmpeg effects
   */
  private async applyVoicePersonality(
    audioUrl: string,
    preset: VoicePersonalityPreset
  ): Promise<string> {
    // Convert preset to effects chain
    const effectsChain: AudioEffectsChain = {};

    if (preset.pitch) {
      effectsChain.pitch = {
        semitones: preset.pitch,
        preserveTempo: true
      };
    }

    if (preset.speed) {
      effectsChain.tempo = {
        speed: preset.speed,
        preservePitch: true
      };
    }

    if (preset.reverb) {
      effectsChain.reverb = {
        roomSize: 50,
        reverbTime: 1000,
        wetness: 30
      };
    }

    if (preset.eq) {
      effectsChain.eq = {
        bass: 0,
        mid: 2,
        treble: 1
      };
    }

    // Download audio to process with FFmpeg
    const audioBlob = await this.urlToBlob(audioUrl);
    const inputFile = new File([audioBlob], 'input.mp3', { type: 'audio/mpeg' });
    
    // Apply effects chain (FFmpeg processing would happen here)
    // For now, return original URL as FFmpeg integration needs more setup
    // TODO: Implement actual FFmpeg processing with effects chain
    return audioUrl;
  }

  /**
   * Get voice configuration for a specific character
   */
  private getVoiceConfigForCharacter(
    characterName: string,
    configs: CharacterVoiceConfig[]
  ): CharacterVoiceConfig | undefined {
    return configs.find(
      c => c.characterName.toLowerCase() === characterName.toLowerCase()
    );
  }

  /**
   * Convert URL to Blob for processing
   */
  private async urlToBlob(url: string): Promise<Blob> {
    const response = await fetch(url);
    return await response.blob();
  }

  /**
   * Update progress callback
   */
  private updateProgress(progress: Partial<AudioProductionProgress>) {
    if (this.progressCallback) {
      this.progressCallback({
        total: progress.total || 0,
        completed: progress.completed || 0,
        current: progress.current,
        status: progress.status || 'idle',
        error: progress.error
      });
    }
  }

  /**
   * Generate batch dialogue from script with automatic character mapping
   */
  async generateFromScript(
    script: string,
    characterVoiceAssignments: CharacterVoiceAssignment[],
    providerConfigs: Record<AudioProviderType, AudioProviderConfig>,
    sceneId: string
  ): Promise<GeneratedDialogue[]> {
    // Parse script into dialogue lines
    const dialogueLines = this.parseScriptToDialogue(script, sceneId);

    // Map character assignments to voice configs
    const characterVoiceConfigs = this.mapAssignmentsToConfigs(
      characterVoiceAssignments,
      providerConfigs
    );

    // Generate audio for all lines
    return await this.generateSceneDialogue(
      dialogueLines,
      characterVoiceConfigs,
      providerConfigs
    );
  }

  /**
   * Parse script text into structured dialogue lines
   * Format: "CHARACTER: dialogue text"
   */
  private parseScriptToDialogue(
    script: string,
    sceneId: string
  ): DialogueLine[] {
    const lines: DialogueLine[] = [];
    const scriptLines = script.split('\n').filter(line => line.trim());

    let lineNumber = 0;
    for (const scriptLine of scriptLines) {
      const match = scriptLine.match(/^([A-Z\s]+):\s*(.+)$/);
      if (match) {
        const [, characterName, text] = match;
        lines.push({
          id: `${sceneId}-line-${lineNumber++}`,
          sceneId,
          characterName: characterName.trim(),
          text: text.trim()
        });
      }
    }

    return lines;
  }

  /**
   * Map character voice assignments to production configs
   */
  private mapAssignmentsToConfigs(
    assignments: CharacterVoiceAssignment[],
    providerConfigs: Record<AudioProviderType, AudioProviderConfig>
  ): CharacterVoiceConfig[] {
    return assignments.map(assignment => {
      // Determine provider from voiceActorId
      // Format: "provider:voiceId" or just "voiceId" for default provider
      const [provider, voiceId] = this.parseVoiceActorId(assignment.voiceActorId);
      
      return {
        characterName: assignment.characterName,
        provider: provider as AudioProviderType,
        voiceId: voiceId,
        voiceConfig: {},
        emotionMapping: {}
      };
    });
  }

  /**
   * Convert AudioProviderConfig to ProviderConfiguration for factory
   */
  private convertToProviderConfiguration(config: AudioProviderConfig): ProviderConfiguration {
    const provider = config.provider;
    
    switch (provider) {
      case 'chatterbox':
        return {
          type: 'chatterbox',
          config: {
            installPath: config.chatterboxConfig?.installPath || '',
            pythonPath: config.chatterboxConfig?.pythonPath,
            modelsPath: config.chatterboxConfig?.modelsPath
          }
        };
      
      case 'gemini':
        return {
          type: 'gemini',
          config: {
            apiKey: config.apiKey || '',
            endpoint: config.endpoint
          }
        };
      
      case 'openai':
        return {
          type: 'openai',
          config: {
            apiKey: config.apiKey || '',
            endpoint: config.endpoint
          }
        };
      
      case 'comfyui':
        return {
          type: 'comfyui',
          config: {
            comfyUIEndpoint: config.comfyUIConfig?.endpoint || '',
            workflowPath: config.comfyUIConfig?.workflowPath
          }
        };
      
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Parse voice actor ID to extract provider and voice ID
   */
  private parseVoiceActorId(voiceActorId: string): [string, string] {
    if (voiceActorId.includes(':')) {
      const [provider, voiceId] = voiceActorId.split(':', 2);
      return [provider, voiceId];
    }
    // Default to Chatterbox for unprefixed IDs
    return ['chatterbox', voiceActorId];
  }

  /**
   * Estimate total audio duration from dialogue lines
   */
  estimateTotalDuration(dialogueLines: DialogueLine[]): number {
    // Rough estimate: ~150 words per minute = 2.5 words per second
    const totalWords = dialogueLines.reduce((sum, line) => {
      return sum + line.text.split(/\s+/).length;
    }, 0);
    return Math.ceil(totalWords / 2.5);
  }

  /**
   * Export generated dialogue to timeline format
   */
  exportToTimeline(
    generatedDialogue: GeneratedDialogue[]
  ): { sceneId: string; characterName: string; startTime: number; duration: number; audioUrl: string }[] {
    const timeline: any[] = [];
    let currentTime = 0;

    for (const dialogue of generatedDialogue) {
      timeline.push({
        sceneId: dialogue.sceneId,
        characterName: dialogue.characterName,
        startTime: currentTime,
        duration: dialogue.duration,
        audioUrl: dialogue.audioUrl
      });
      currentTime += dialogue.duration + 0.5; // Add 0.5s pause between lines
    }

    return timeline;
  }
}