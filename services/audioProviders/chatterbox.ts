import { spawn } from 'child_process';
import { promisify } from 'util';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import {
  IAudioProvider,
  AudioGenerationOptions,
  AudioGenerationResult,
  VoiceInfo,
  ChatterboxConfig,
  ChatterboxTTSOptions
} from './types';

const execAsync = promisify(exec);

interface ChatterboxVoice {
  id: string;
  name: string;
  description: string;
  gender: 'male' | 'female' | 'neutral';
  age: 'child' | 'young' | 'adult' | 'senior';
  languages: string[];
  style: string;
  characteristics: string[];
}

export class ChatterboxAudioProvider implements IAudioProvider {
  name = 'chatterbox' as const;
  supportsEmotion = true;
  supportsProsodyControl = true;
  supportsMultipleVoices = true;
  isLocal = true;

  private config: ChatterboxConfig;
  private chatterboxPath: string;
  private pythonPath: string;
  private isInstalled: boolean = false;

  private voices: ChatterboxVoice[] = [
    {
      id: 'narrator_male',
      name: 'Narrator (Male)',
      description: 'Deep, authoritative male narrator voice',
      gender: 'male',
      age: 'adult',
      languages: ['en'],
      style: 'narrative',
      characteristics: ['authoritative', 'clear', 'engaging']
    },
    {
      id: 'narrator_female',
      name: 'Narrator (Female)',
      description: 'Clear, engaging female narrator voice',
      gender: 'female',
      age: 'adult',
      languages: ['en'],
      style: 'narrative',
      characteristics: ['clear', 'engaging', 'warm']
    },
    {
      id: 'character_hero',
      name: 'Hero',
      description: 'Strong, confident hero character voice',
      gender: 'male',
      age: 'young',
      languages: ['en'],
      style: 'dramatic',
      characteristics: ['confident', 'strong', 'heroic']
    },
    {
      id: 'character_villain',
      name: 'Villain',
      description: 'Dark, menacing villain character voice',
      gender: 'male',
      age: 'adult',
      languages: ['en'],
      style: 'dramatic',
      characteristics: ['menacing', 'dark', 'powerful']
    },
    {
      id: 'character_child',
      name: 'Child',
      description: 'Playful, innocent child character voice',
      gender: 'neutral',
      age: 'child',
      languages: ['en'],
      style: 'playful',
      characteristics: ['innocent', 'playful', 'energetic']
    },
    {
      id: 'character_elder',
      name: 'Elder',
      description: 'Wise, elderly character voice',
      gender: 'male',
      age: 'senior',
      languages: ['en'],
      style: 'wise',
      characteristics: ['wise', 'calm', 'experienced']
    }
  ];

  constructor(config: ChatterboxConfig) {
    this.config = config;
    this.chatterboxPath = config.installPath;
    this.pythonPath = config.pythonPath || 'python';
  }

  async initialize(): Promise<void> {
    await this.checkInstallation();
    if (!this.isInstalled) {
      throw new Error('Chatterbox TTS is not installed. Please run: git clone https://github.com/resemble-ai/chatterbox.git && cd chatterbox && pip install -r requirements.txt');
    }
  }

  private async checkInstallation(): Promise<void> {
    try {
      const requirementsPath = path.join(this.chatterboxPath, 'requirements.txt');
      await fs.access(requirementsPath);
      this.isInstalled = true;
    } catch (error) {
      this.isInstalled = false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.checkInstallation();
      if (!this.isInstalled) return false;

      const testScript = `
import sys
sys.path.append('${this.chatterboxPath.replace(/\\/g, '\\\\')}')
try:
    import chatterbox
    print("OK")
except Exception as e:
    print(f"ERROR: {e}")
`;
      
      const result = await execAsync(`${this.pythonPath} -c "${testScript}"`);
      return result.stdout.trim() === 'OK';
    } catch (error) {
      return false;
    }
  }

  async listVoices(): Promise<VoiceInfo[]> {
    return this.voices.map(v => ({
      id: v.id,
      name: v.name,
      description: v.description,
      gender: v.gender,
      age: v.age,
      languages: v.languages,
      provider: 'chatterbox'
    }));
  }

  async generateAudio(
    options: AudioGenerationOptions
  ): Promise<AudioGenerationResult> {
    if (options.provider !== 'chatterbox') {
      throw new Error('Invalid provider for Chatterbox audio generation');
    }

    if (!this.isInstalled) {
      await this.initialize();
    }

    const chatterboxOptions = options as ChatterboxTTSOptions;
    const text = chatterboxOptions.text;
    const voice = chatterboxOptions.voiceId || chatterboxOptions.voicePreset || 'narrator_male';
    
    const outputPath = path.join(
      this.config.modelsPath || path.join(process.cwd(), 'audio_output'),
      `chatterbox_${Date.now()}.wav`
    );

    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    const pythonScript = this.generatePythonScript(
      text,
      voice,
      outputPath,
      chatterboxOptions
    );

    try {
      await this.executePythonScript(pythonScript);
      
      const audioBuffer = await fs.readFile(outputPath);
      const base64Audio = audioBuffer.toString('base64');
      const blob = new Blob([audioBuffer], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(blob);

      const duration = await this.estimateAudioDuration(audioBuffer);

      const result: AudioGenerationResult = {
        audioData: base64Audio,
        audioUrl,
        duration,
        format: 'wav',
        metadata: {
          voice,
          provider: 'chatterbox',
          model: chatterboxOptions.voicePreset,
          sampleRate: 22050,
          channels: 1,
          bitrate: 352800
        }
      };

      return result;
    } catch (error) {
      throw new Error(`Chatterbox TTS generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private generatePythonScript(
    text: string,
    voice: string,
    outputPath: string,
    options?: ChatterboxTTSOptions
  ): string {
    const emotion = options?.emotionalControls?.emotion || 'neutral';
    const intensity = options?.emotionalControls?.emotionIntensity || 50;
    const breathingPattern = options?.breathingPattern || 'natural';
    const speakingStyle = options?.speakingStyle || 'narration';

    return `
import sys
import os
sys.path.append('${this.chatterboxPath.replace(/\\/g, '\\\\')}')

try:
    from chatterbox import ChatterboxTTS
    import numpy as np
    import soundfile as sf
    
    # Initialize Chatterbox
    tts = ChatterboxTTS()
    
    # Configure voice
    voice_config = {
        'voice_id': '${voice}',
        'emotion': '${emotion}',
        'intensity': ${intensity},
        'breathing_pattern': '${breathingPattern}',
        'speaking_style': '${speakingStyle}'
    }
    
    # Generate audio
    text = """${text.replace(/"/g, '\\"')}"""
    audio = tts.synthesize(text, **voice_config)
    
    # Save to file
    output_path = r'${outputPath.replace(/\\/g, '\\\\')}'
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    sf.write(output_path, audio, 22050)
    
    print("SUCCESS")
    
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    sys.exit(1)
`;
  }

  private async executePythonScript(script: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const process = spawn(this.pythonPath, ['-c', script]);
      
      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0 && stdout.includes('SUCCESS')) {
          resolve();
        } else {
          reject(new Error(`Python script failed: ${stderr || stdout}`));
        }
      });

      process.on('error', (error) => {
        reject(new Error(`Failed to execute Python script: ${error.message}`));
      });
    });
  }

  private async estimateAudioDuration(buffer: Buffer): Promise<number> {
    const sampleRate = 22050;
    const bytesPerSample = 2;
    const channels = 1;
    
    const dataSize = buffer.length - 44;
    const numSamples = dataSize / (bytesPerSample * channels);
    const duration = numSamples / sampleRate;
    
    return duration;
  }

  async cleanup(): Promise<void> {
    const keepFiles = this.config.maxConcurrentJobs !== undefined;
    if (!keepFiles) {
      const outputDir = this.config.modelsPath || path.join(process.cwd(), 'audio_output');
      try {
        const files = await fs.readdir(outputDir);
        for (const file of files) {
          if (file.startsWith('chatterbox_')) {
            await fs.unlink(path.join(outputDir, file)).catch(() => {});
          }
        }
      } catch (error) {
      }
    }
  }

  getEmotions(): string[] {
    return ['neutral', 'happy', 'sad', 'angry', 'fearful', 'surprised', 'excited', 'calm'];
  }

  getBreathingPatterns(): string[] {
    return ['normal', 'relaxed', 'excited', 'tense', 'exhausted'];
  }

  getSpeakingStyles(): string[] {
    return ['conversational', 'narrative', 'dramatic', 'whisper', 'shout', 'sing'];
  }
}