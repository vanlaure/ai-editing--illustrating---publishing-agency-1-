import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * FFmpeg Audio Effects Service
 * 
 * Provides pitch shifting, tempo adjustment, and audio effects processing
 * for voice personality control and audio mastering.
 */

export interface PitchShiftOptions {
  /** Pitch shift in semitones (-12 to +12, 0 = no change) */
  semitones: number;
  /** Optional tempo preservation (default: true) */
  preserveTempo?: boolean;
}

export interface TempoOptions {
  /** Tempo multiplier (0.5 = half speed, 2.0 = double speed) */
  speed: number;
  /** Optional pitch preservation (default: true) */
  preservePitch?: boolean;
}

export interface ReverbOptions {
  /** Room size (0-100, default: 50) */
  roomSize?: number;
  /** Reverb time in milliseconds (default: 1000) */
  reverbTime?: number;
  /** Wet/dry mix (0-100, default: 30) */
  wetness?: number;
}

export interface EQOptions {
  /** Bass adjustment in dB (-20 to +20, default: 0) */
  bass?: number;
  /** Mid adjustment in dB (-20 to +20, default: 0) */
  mid?: number;
  /** Treble adjustment in dB (-20 to +20, default: 0) */
  treble?: number;
}

export interface CompressionOptions {
  /** Threshold in dB (default: -20) */
  threshold?: number;
  /** Ratio (default: 4) */
  ratio?: number;
  /** Attack time in milliseconds (default: 5) */
  attack?: number;
  /** Release time in milliseconds (default: 50) */
  release?: number;
}

export interface NormalizationOptions {
  /** Target loudness in LUFS (default: -16) */
  targetLoudness?: number;
  /** Peak normalization (default: -1 dB) */
  peakLevel?: number;
}

export interface MixingOptions {
  /** Array of audio file paths to mix */
  inputs: string[];
  /** Volume levels for each input (0-1, default: 1 for all) */
  volumes?: number[];
  /** Crossfade duration in seconds (default: 0) */
  crossfade?: number;
}

export interface AudioEffectsChain {
  pitch?: PitchShiftOptions;
  tempo?: TempoOptions;
  reverb?: ReverbOptions;
  eq?: EQOptions;
  compression?: CompressionOptions;
  normalization?: NormalizationOptions;
}

export class FFmpegAudioService {
  private ffmpegPath: string;
  private tempDir: string;

  constructor(ffmpegPath: string = 'ffmpeg', tempDir: string = './temp') {
    this.ffmpegPath = ffmpegPath;
    this.tempDir = tempDir;
  }

  /**
   * Apply pitch shift to audio file
   */
  async pitchShift(
    inputPath: string,
    outputPath: string,
    options: PitchShiftOptions
  ): Promise<void> {
    const { semitones, preserveTempo = true } = options;
    
    // Calculate pitch shift factor (2^(semitones/12))
    const pitchFactor = Math.pow(2, semitones / 12);
    
    const filters: string[] = [];
    
    if (preserveTempo) {
      // Use rubberband for time-stretching with pitch preservation
      filters.push(`rubberband=pitch=${pitchFactor}`);
    } else {
      // Simple pitch shift with tempo change
      filters.push(`asetrate=44100*${pitchFactor},aresample=44100`);
    }

    await this.executeFFmpeg([
      '-i', inputPath,
      '-af', filters.join(','),
      '-y',
      outputPath
    ]);
  }

  /**
   * Adjust audio tempo/speed
   */
  async adjustTempo(
    inputPath: string,
    outputPath: string,
    options: TempoOptions
  ): Promise<void> {
    const { speed, preservePitch = true } = options;
    
    const filters: string[] = [];
    
    if (preservePitch) {
      // Use atempo for speed change without pitch change
      // atempo range is 0.5-2.0, chain multiple for larger changes
      let remaining = speed;
      while (remaining > 2.0) {
        filters.push('atempo=2.0');
        remaining /= 2.0;
      }
      while (remaining < 0.5) {
        filters.push('atempo=0.5');
        remaining *= 2.0;
      }
      if (remaining !== 1.0) {
        filters.push(`atempo=${remaining}`);
      }
    } else {
      // Simple speed change with pitch shift
      filters.push(`asetrate=44100*${speed},aresample=44100`);
    }

    await this.executeFFmpeg([
      '-i', inputPath,
      '-af', filters.join(','),
      '-y',
      outputPath
    ]);
  }

  /**
   * Apply reverb effect
   */
  async applyReverb(
    inputPath: string,
    outputPath: string,
    options: ReverbOptions = {}
  ): Promise<void> {
    const {
      roomSize = 50,
      reverbTime = 1000,
      wetness = 30
    } = options;

    // FFmpeg reverb using aecho and afftfilt
    const delay = Math.floor(reverbTime / 4);
    const decay = 0.3 + (roomSize / 200);
    const wet = wetness / 100;
    const dry = 1 - wet;

    await this.executeFFmpeg([
      '-i', inputPath,
      '-af', `aecho=0.8:0.88:${delay}:${decay},volume=${wet},amix=inputs=2:weights=${dry} ${wet}`,
      '-y',
      outputPath
    ]);
  }

  /**
   * Apply EQ adjustments
   */
  async applyEQ(
    inputPath: string,
    outputPath: string,
    options: EQOptions
  ): Promise<void> {
    const { bass = 0, mid = 0, treble = 0 } = options;
    
    const filters: string[] = [];
    
    if (bass !== 0) {
      filters.push(`bass=g=${bass}`);
    }
    if (treble !== 0) {
      filters.push(`treble=g=${treble}`);
    }
    if (mid !== 0) {
      // Apply mid-range boost/cut using equalizer
      filters.push(`equalizer=f=1000:t=h:w=500:g=${mid}`);
    }

    if (filters.length === 0) {
      throw new Error('No EQ adjustments specified');
    }

    await this.executeFFmpeg([
      '-i', inputPath,
      '-af', filters.join(','),
      '-y',
      outputPath
    ]);
  }

  /**
   * Apply dynamic range compression
   */
  async applyCompression(
    inputPath: string,
    outputPath: string,
    options: CompressionOptions = {}
  ): Promise<void> {
    const {
      threshold = -20,
      ratio = 4,
      attack = 5,
      release = 50
    } = options;

    await this.executeFFmpeg([
      '-i', inputPath,
      '-af', `acompressor=threshold=${threshold}dB:ratio=${ratio}:attack=${attack}:release=${release}`,
      '-y',
      outputPath
    ]);
  }

  /**
   * Normalize audio loudness
   */
  async normalize(
    inputPath: string,
    outputPath: string,
    options: NormalizationOptions = {}
  ): Promise<void> {
    const {
      targetLoudness = -16,
      peakLevel = -1
    } = options;

    // Two-pass normalization using loudnorm filter
    await this.executeFFmpeg([
      '-i', inputPath,
      '-af', `loudnorm=I=${targetLoudness}:TP=${peakLevel}:LRA=11`,
      '-y',
      outputPath
    ]);
  }

  /**
   * Apply a chain of audio effects
   */
  async applyEffectsChain(
    inputPath: string,
    outputPath: string,
    effects: AudioEffectsChain
  ): Promise<void> {
    await fs.mkdir(this.tempDir, { recursive: true });
    
    let currentInput = inputPath;
    let tempFiles: string[] = [];

    try {
      // Apply effects in sequence
      if (effects.pitch) {
        const tempOutput = path.join(this.tempDir, `pitch_${Date.now()}.wav`);
        await this.pitchShift(currentInput, tempOutput, effects.pitch);
        tempFiles.push(tempOutput);
        currentInput = tempOutput;
      }

      if (effects.tempo) {
        const tempOutput = path.join(this.tempDir, `tempo_${Date.now()}.wav`);
        await this.adjustTempo(currentInput, tempOutput, effects.tempo);
        tempFiles.push(tempOutput);
        currentInput = tempOutput;
      }

      if (effects.reverb) {
        const tempOutput = path.join(this.tempDir, `reverb_${Date.now()}.wav`);
        await this.applyReverb(currentInput, tempOutput, effects.reverb);
        tempFiles.push(tempOutput);
        currentInput = tempOutput;
      }

      if (effects.eq) {
        const tempOutput = path.join(this.tempDir, `eq_${Date.now()}.wav`);
        await this.applyEQ(currentInput, tempOutput, effects.eq);
        tempFiles.push(tempOutput);
        currentInput = tempOutput;
      }

      if (effects.compression) {
        const tempOutput = path.join(this.tempDir, `comp_${Date.now()}.wav`);
        await this.applyCompression(currentInput, tempOutput, effects.compression);
        tempFiles.push(tempOutput);
        currentInput = tempOutput;
      }

      if (effects.normalization) {
        const tempOutput = path.join(this.tempDir, `norm_${Date.now()}.wav`);
        await this.normalize(currentInput, tempOutput, effects.normalization);
        tempFiles.push(tempOutput);
        currentInput = tempOutput;
      }

      // Copy final result to output
      if (currentInput !== inputPath) {
        await fs.copyFile(currentInput, outputPath);
      }

    } finally {
      // Cleanup temp files
      for (const tempFile of tempFiles) {
        try {
          await fs.unlink(tempFile);
        } catch (err) {
          console.warn(`Failed to delete temp file ${tempFile}:`, err);
        }
      }
    }
  }

  /**
   * Mix multiple audio files
   */
  async mixAudio(
    outputPath: string,
    options: MixingOptions
  ): Promise<void> {
    const { inputs, volumes = [], crossfade = 0 } = options;
    
    if (inputs.length === 0) {
      throw new Error('No input files specified');
    }

    const inputArgs: string[] = [];
    const filterComplex: string[] = [];
    
    // Add input files
    inputs.forEach((input, i) => {
      inputArgs.push('-i', input);
      const vol = volumes[i] ?? 1;
      filterComplex.push(`[${i}:a]volume=${vol}[a${i}]`);
    });

    // Build amix filter
    const inputLabels = inputs.map((_, i) => `[a${i}]`).join('');
    filterComplex.push(`${inputLabels}amix=inputs=${inputs.length}:duration=longest[out]`);

    await this.executeFFmpeg([
      ...inputArgs,
      '-filter_complex', filterComplex.join(';'),
      '-map', '[out]',
      '-y',
      outputPath
    ]);
  }

  /**
   * Get audio file duration in seconds
   */
  async getDuration(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const args = [
        '-i', filePath,
        '-f', 'null',
        '-'
      ];

      const ffmpeg = spawn(this.ffmpegPath, args);
      let stderr = '';

      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', (code) => {
        // Parse duration from stderr
        const match = stderr.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
        if (match) {
          const hours = parseInt(match[1], 10);
          const minutes = parseInt(match[2], 10);
          const seconds = parseFloat(match[3]);
          const duration = hours * 3600 + minutes * 60 + seconds;
          resolve(duration);
        } else {
          reject(new Error('Could not parse duration from ffmpeg output'));
        }
      });

      ffmpeg.on('error', reject);
    });
  }

  /**
   * Execute FFmpeg command
   */
  private executeFFmpeg(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn(this.ffmpegPath, args);
      let stderr = '';

      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg process exited with code ${code}: ${stderr}`));
        }
      });

      ffmpeg.on('error', (err) => {
        reject(new Error(`Failed to start FFmpeg: ${err.message}`));
      });
    });
  }

  /**
   * Preset: Make voice sound more masculine
   */
  async applyMasculineVoice(inputPath: string, outputPath: string): Promise<void> {
    await this.applyEffectsChain(inputPath, outputPath, {
      pitch: { semitones: -2, preserveTempo: true },
      eq: { bass: 3, mid: -1, treble: -2 }
    });
  }

  /**
   * Preset: Make voice sound more feminine
   */
  async applyFeminineVoice(inputPath: string, outputPath: string): Promise<void> {
    await this.applyEffectsChain(inputPath, outputPath, {
      pitch: { semitones: 3, preserveTempo: true },
      eq: { bass: -2, mid: 1, treble: 3 }
    });
  }

  /**
   * Preset: Add warmth and presence for narration
   */
  async applyNarrationPreset(inputPath: string, outputPath: string): Promise<void> {
    await this.applyEffectsChain(inputPath, outputPath, {
      eq: { bass: 2, mid: 1, treble: 0 },
      compression: { threshold: -18, ratio: 3, attack: 5, release: 50 },
      normalization: { targetLoudness: -16, peakLevel: -1 }
    });
  }

  /**
   * Preset: Apply cinematic reverb for atmosphere
   */
  async applyCinematicPreset(inputPath: string, outputPath: string): Promise<void> {
    await this.applyEffectsChain(inputPath, outputPath, {
      reverb: { roomSize: 70, reverbTime: 1500, wetness: 25 },
      compression: { threshold: -20, ratio: 4, attack: 10, release: 100 },
      normalization: { targetLoudness: -16, peakLevel: -1 }
    });
  }
}

export default FFmpegAudioService;