// ============================================
// AUDIO GENERATION PROVIDER TYPES
// ============================================

export type AudioProviderType = 'gemini' | 'openai' | 'chatterbox' | 'comfyui' | 'elevenlabs' | 'azure' | 'aws';

export type AudioContentType = 'narration' | 'dialogue' | 'character-voice' | 'music' | 'sfx' | 'ambience';

// Base audio generation options
export interface BaseAudioGenerationOptions {
  text: string;
  contentType?: AudioContentType;
  model?: string;
  voiceId?: string;
  voiceName?: string;
  outputFormat?: 'mp3' | 'wav' | 'flac' | 'aac' | 'ogg';
  sampleRate?: 16000 | 22050 | 44100 | 48000;
  bitRate?: number;
}

// ============================================
// EMOTION & PROSODY CONTROL
// ============================================

export interface EmotionalProsodyControls {
  pitch?: number; // -20 to 20 (semitones)
  speed?: number; // 0.5 to 2.0 (multiplier)
  stability?: number; // 0 to 100 (voice consistency)
  clarity?: number; // 0 to 100 (articulation)
  energy?: number; // 0 to 100 (vocal intensity)
  emotion?: EmotionType;
  emotionIntensity?: number; // 0 to 100
}

export type EmotionType = 
  | 'neutral' 
  | 'happy' 
  | 'sad' 
  | 'angry' 
  | 'fearful' 
  | 'surprised' 
  | 'excited'
  | 'calm'
  | 'tense'
  | 'warm'
  | 'cold'
  | 'mysterious'
  | 'dramatic';

// ============================================
// CHATTERBOX TTS (Local)
// ============================================

export interface ChatterboxTTSOptions extends BaseAudioGenerationOptions {
  provider: 'chatterbox';
  characterName?: string;
  emotionalControls?: EmotionalProsodyControls;
  stylePrompt?: string;
  // Chatterbox-specific controls
  voicePreset?: string;
  breathingPattern?: 'natural' | 'minimal' | 'dramatic';
  speakingStyle?: 'narration' | 'conversation' | 'dramatic-reading' | 'audiobook';
  pronunciationDictionary?: Record<string, string>;
}

export interface ChatterboxConfig {
  installPath: string;
  pythonPath?: string;
  modelsPath?: string;
  defaultVoicePreset?: string;
  maxConcurrentJobs?: number;
}

// ============================================
// GEMINI TTS (Cloud)
// ============================================

export interface GeminiTTSOptions extends BaseAudioGenerationOptions {
  provider: 'gemini';
  model?: 'gemini-2.5-flash' | string;
  voiceName?: string;
  languageCode?: string;
  speakingRate?: number; // 0.25 to 4.0
  pitch?: number; // -20.0 to 20.0
  volumeGainDb?: number;
  audioEncoding?: 'MP3' | 'LINEAR16' | 'OGG_OPUS';
  effectsProfileId?: string[];
}

export interface GeminiAudioConfig {
  apiKey: string;
  endpoint?: string;
  defaultModel?: string;
  defaultVoice?: string;
  maxRetries?: number;
}

// ============================================
// OPENAI TTS (Cloud)
// ============================================

export interface OpenAITTSOptions extends BaseAudioGenerationOptions {
  provider: 'openai';
  model?: 'tts-1' | 'tts-1-hd';
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  speed?: number; // 0.25 to 4.0
  responseFormat?: 'mp3' | 'opus' | 'aac' | 'flac' | 'wav' | 'pcm';
}

export interface OpenAIAudioConfig {
  apiKey: string;
  endpoint?: string;
  organization?: string;
  defaultModel?: 'tts-1' | 'tts-1-hd';
  defaultVoice?: string;
  maxRetries?: number;
}

// ============================================
// COMFYUI / DIFFRHYTHM (Music Generation)
// ============================================

export interface ComfyUIMusicOptions {
  provider: 'comfyui';
  workflowName: 'diffrhythm';
  prompt: string;
  duration?: number; // seconds
  bpm?: number;
  genre?: string;
  mood?: string;
  instruments?: string[];
  key?: string; // musical key (e.g., 'C major', 'A minor')
  style?: string;
  seed?: number;
}

export interface DiffRhythmConfig {
  comfyUIEndpoint: string;
  workflowPath?: string;
  defaultBpm?: number;
  defaultDuration?: number;
  outputPath?: string;
}

// ============================================
// SFX LIBRARY INTEGRATION
// ============================================

export interface SFXOptions {
  query: string;
  category?: 'ambience' | 'foley' | 'impact' | 'mechanical' | 'nature' | 'ui' | 'voice' | 'other';
  duration?: number;
  tags?: string[];
  license?: 'cc0' | 'cc-by' | 'cc-by-sa' | 'royalty-free';
}

export interface SFXLibraryConfig {
  libraries: {
    name: string;
    apiEndpoint?: string;
    localPath?: string;
    apiKey?: string;
  }[];
  cachePath?: string;
  preferredLicense?: string;
}

// ============================================
// FFMPEG AUDIO EFFECTS
// ============================================

export interface FFmpegEffectsOptions {
  inputPath: string;
  outputPath: string;
  effects: AudioEffect[];
}

export interface AudioEffect {
  type: 'pitch' | 'tempo' | 'reverb' | 'eq' | 'compression' | 'normalize' | 'fade' | 'volume';
  parameters: Record<string, any>;
}

export interface PitchEffect extends AudioEffect {
  type: 'pitch';
  parameters: {
    semitones: number; // -12 to 12
    preserveTempo?: boolean;
  };
}

export interface TempoEffect extends AudioEffect {
  type: 'tempo';
  parameters: {
    rate: number; // 0.5 to 2.0
    preservePitch?: boolean;
  };
}

export interface ReverbEffect extends AudioEffect {
  type: 'reverb';
  parameters: {
    roomSize: number; // 0 to 100
    damping: number; // 0 to 100
    wetLevel: number; // 0 to 100
  };
}

export interface FFmpegConfig {
  ffmpegPath?: string;
  ffprobePath?: string;
  tempDir?: string;
}

// ============================================
// UNIFIED AUDIO GENERATION OPTIONS
// ============================================

export type AudioGenerationOptions = 
  | ChatterboxTTSOptions 
  | GeminiTTSOptions 
  | OpenAITTSOptions 
  | ComfyUIMusicOptions;

// ============================================
// AUDIO PROVIDER CONFIGURATION
// ============================================

export interface AudioProviderConfig {
  chatterbox?: ChatterboxConfig;
  gemini?: GeminiAudioConfig;
  openai?: OpenAIAudioConfig;
  comfyui?: DiffRhythmConfig;
  sfxLibrary?: SFXLibraryConfig;
  ffmpeg?: FFmpegConfig;
}

// Single provider configuration
export type ProviderConfiguration =
  | { type: 'chatterbox'; config: ChatterboxConfig }
  | { type: 'gemini'; config: GeminiAudioConfig }
  | { type: 'openai'; config: OpenAIAudioConfig }
  | { type: 'comfyui'; config: DiffRhythmConfig }
  | { type: 'elevenlabs'; config: { apiKey: string; endpoint?: string } }
  | { type: 'azure'; config: { apiKey: string; region: string; endpoint?: string } }
  | { type: 'aws'; config: { accessKeyId: string; secretAccessKey: string; region: string } };

// ============================================
// AUDIO GENERATION RESULT
// ============================================

export interface AudioGenerationResult {
  audioData: string; // base64 encoded audio
  audioUrl: string;
  duration: number; // seconds
  format: string;
  metadata?: {
    provider: AudioProviderType;
    model?: string;
    voice?: string;
    speed?: number;
    timestamp?: Date;
    processingTime?: number; // milliseconds
    sampleRate?: number;
    channels?: number;
    bitrate?: number;
  };
}

// ============================================
// AUDIO PROVIDER INTERFACE
// ============================================

export interface IAudioProvider {
  readonly name: AudioProviderType;
  readonly supportsEmotion: boolean;
  readonly supportsProsodyControl: boolean;
  readonly supportsMultipleVoices: boolean;
  readonly isLocal: boolean;
  
  generateAudio(options: AudioGenerationOptions): Promise<AudioGenerationResult>;
  listVoices?(): Promise<VoiceInfo[]>;
  testConnection?(): Promise<boolean>;
}

export interface VoiceInfo {
  id: string;
  name: string;
  gender?: 'male' | 'female' | 'neutral';
  age?: 'child' | 'young' | 'adult' | 'senior';
  style?: string;
  languages?: string[];
  provider?: AudioProviderType;
  previewUrl?: string;
  description?: string;
}

// ============================================
// BATCH AUDIO GENERATION
// ============================================

export interface BatchAudioGenerationRequest {
  jobs: AudioGenerationJob[];
  priority?: 'low' | 'normal' | 'high';
  callbackUrl?: string;
}

export interface AudioGenerationJob {
  id: string;
  options: AudioGenerationOptions;
  retries?: number;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  result?: AudioGenerationResult;
  error?: string;
}

// ============================================
// AUDIO MIXING & POST-PROCESSING
// ============================================

export interface AudioMixingOptions {
  tracks: AudioTrack[];
  outputPath: string;
  format?: 'mp3' | 'wav' | 'flac' | 'aac';
  masteringPreset?: 'cinematic-warm' | 'neutral-academic' | 'dark-intimate' | 'bright-youthful' | 'custom';
  normalize?: boolean;
  targetLoudness?: number; // LUFS
}

export interface AudioTrack {
  id: string;
  audioUrl: string;
  type: AudioContentType;
  volume: number; // 0 to 100
  startTime: number; // seconds
  fadeIn?: number; // seconds
  fadeOut?: number; // seconds
  effects?: AudioEffect[];
}

// ============================================
// VOICE CHARACTER PROFILES
// ============================================

export interface VoiceCharacterProfile {
  id: string;
  name: string;
  provider: AudioProviderType;
  voiceId: string;
  baseSettings: Partial<AudioGenerationOptions>;
  emotionalRanges: {
    emotion: EmotionType;
    prosody: EmotionalProsodyControls;
  }[];
  notes?: string;
}