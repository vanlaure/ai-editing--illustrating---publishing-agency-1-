import {
  IAudioProvider,
  DiffRhythmConfig,
  ComfyUIMusicOptions,
  AudioGenerationOptions,
  AudioGenerationResult,
  VoiceInfo
} from './types';

interface ComfyUIWorkflow {
  prompt: Record<string, any>;
  workflow: Record<string, any>;
}

interface ComfyUIQueueResponse {
  prompt_id: string;
  number: number;
  node_errors?: Record<string, any>;
}

interface ComfyUIHistoryResponse {
  [key: string]: {
    prompt: any[];
    outputs: Record<string, {
      images?: Array<{ filename: string; subfolder: string; type: string }>;
      audio?: Array<{ filename: string; subfolder: string; type: string }>;
    }>;
  };
}

export class ComfyUIAudioProvider implements IAudioProvider {
  readonly name = 'comfyui' as const;
  readonly supportsEmotion = false;
  readonly supportsProsodyControl = false;
  readonly supportsMultipleVoices = false;
  readonly isLocal = true;

  private apiUrl: string;
  private workflowPath?: string;
  private pollInterval: number;
  private maxPollAttempts: number;
  private defaultBpm: number;
  private defaultDuration: number;

  constructor(config: DiffRhythmConfig) {
    this.apiUrl = config.comfyUIEndpoint;
    this.workflowPath = config.workflowPath;
    this.pollInterval = 1000;
    this.maxPollAttempts = 60;
    this.defaultBpm = config.defaultBpm || 120;
    this.defaultDuration = config.defaultDuration || 30;
  }

  async initialize(): Promise<void> {
    const response = await fetch(`${this.apiUrl}/system_stats`);
    if (!response.ok) {
      throw new Error('ComfyUI server is not responding');
    }
  }

  async listVoices(): Promise<VoiceInfo[]> {
    return [
      {
        id: 'diffrhythm',
        name: 'DiffRhythm Music Generator',
        languages: ['en'],
        gender: 'neutral'
      }
    ];
  }

  async generateAudio(options: AudioGenerationOptions): Promise<AudioGenerationResult> {
    if (options.provider !== 'comfyui') {
      throw new Error('Invalid provider for ComfyUI audio generation');
    }

    const musicOptions = options as ComfyUIMusicOptions;
    
    const workflow = await this.buildDiffRhythmWorkflow(musicOptions.prompt, musicOptions);
    
    const promptId = await this.queuePrompt(workflow);
    
    const result = await this.pollForCompletion(promptId);
    
    const audioUrl = await this.getAudioUrl(result);
    
    const audioData = await this.fetchAudioData(audioUrl);
    
    const duration = musicOptions.duration || this.defaultDuration;

    return {
      audioData,
      audioUrl,
      duration,
      format: 'wav',
      metadata: {
        provider: 'comfyui',
        processingTime: 0,
        timestamp: new Date()
      }
    };
  }

  private async buildDiffRhythmWorkflow(
    prompt: string,
    options: ComfyUIMusicOptions
  ): Promise<ComfyUIWorkflow> {
    if (this.workflowPath) {
      const workflowData = await this.loadWorkflowFromFile(this.workflowPath);
      return this.customizeWorkflow(workflowData, prompt, options);
    }

    return this.buildDefaultDiffRhythmWorkflow(prompt, options);
  }

  private async loadWorkflowFromFile(path: string): Promise<any> {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load workflow from ${path}`);
    }
    return response.json();
  }

  private buildDefaultDiffRhythmWorkflow(
    prompt: string,
    options: ComfyUIMusicOptions
  ): ComfyUIWorkflow {
    const bpm = options.bpm || 120;
    const duration = options.duration || 30;
    const genre = options.genre || 'cinematic';
    const mood = options.mood || 'neutral';
    const key = options.key || 'C major';
    const instruments = options.instruments || ['piano', 'strings'];

    const musicPrompt = this.buildMusicPrompt(prompt, genre, mood, key, instruments);

    return {
      prompt: {
        "1": {
          "class_type": "DiffRhythmSampler",
          "inputs": {
            "prompt": musicPrompt,
            "bpm": bpm,
            "duration": duration,
            "seed": Math.floor(Math.random() * 1000000),
            "steps": 20,
            "cfg": 7.0
          }
        },
        "2": {
          "class_type": "AudioSave",
          "inputs": {
            "audio": ["1", 0],
            "filename_prefix": "diffrhythm_music",
            "format": "wav"
          }
        }
      },
      workflow: {}
    };
  }

  private customizeWorkflow(
    workflow: any,
    prompt: string,
    options: ComfyUIMusicOptions
  ): ComfyUIWorkflow {
    const customizedWorkflow = JSON.parse(JSON.stringify(workflow));

    for (const nodeId in customizedWorkflow.prompt) {
      const node = customizedWorkflow.prompt[nodeId];
      
      if (node.class_type === 'DiffRhythmSampler') {
        node.inputs.prompt = this.buildMusicPrompt(
          prompt,
          options.genre,
          options.mood,
          options.key,
          options.instruments
        );
        if (options.bpm) node.inputs.bpm = options.bpm;
        if (options.duration) node.inputs.duration = options.duration;
        node.inputs.seed = Math.floor(Math.random() * 1000000);
      }
      
      if (node.class_type === 'AudioSave') {
        node.inputs.format = 'wav';
      }
    }

    return customizedWorkflow;
  }

  private buildMusicPrompt(
    basePrompt: string,
    genre?: string,
    mood?: string,
    key?: string,
    instruments?: string[]
  ): string {
    const parts = [basePrompt];
    
    if (genre) parts.push(`${genre} style`);
    if (mood) parts.push(`${mood} mood`);
    if (key) parts.push(`in ${key}`);
    if (instruments && instruments.length > 0) {
      parts.push(`featuring ${instruments.join(', ')}`);
    }

    return parts.join(', ');
  }

  private async queuePrompt(workflow: ComfyUIWorkflow): Promise<string> {
    const response = await fetch(`${this.apiUrl}/prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: workflow.prompt,
        client_id: this.generateClientId()
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to queue prompt: ${error}`);
    }

    const data: ComfyUIQueueResponse = await response.json();
    
    if (data.node_errors) {
      throw new Error(`Workflow has errors: ${JSON.stringify(data.node_errors)}`);
    }

    return data.prompt_id;
  }

  private async pollForCompletion(promptId: string): Promise<any> {
    for (let i = 0; i < this.maxPollAttempts; i++) {
      const history = await this.getHistory(promptId);
      
      if (history && history[promptId]) {
        return history[promptId];
      }

      await this.sleep(this.pollInterval);
    }

    throw new Error(`Timeout waiting for prompt ${promptId} to complete`);
  }

  private async getHistory(promptId: string): Promise<ComfyUIHistoryResponse | null> {
    const response = await fetch(`${this.apiUrl}/history/${promptId}`);
    
    if (!response.ok) {
      return null;
    }

    return response.json();
  }

  private async getAudioUrl(result: any): Promise<string> {
    const outputs = result.outputs;
    
    for (const nodeId in outputs) {
      const nodeOutput = outputs[nodeId];
      
      if (nodeOutput.audio && nodeOutput.audio.length > 0) {
        const audio = nodeOutput.audio[0];
        return `${this.apiUrl}/view?filename=${audio.filename}&subfolder=${audio.subfolder}&type=${audio.type}`;
      }
    }

    throw new Error('No audio output found in workflow result');
  }

  private async fetchAudioData(url: string): Promise<string> {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${response.statusText}`);
    }

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = this.arrayBufferToBase64(arrayBuffer);
    
    return `data:audio/wav;base64,${base64}`;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.initialize();
      return true;
    } catch {
      return false;
    }
  }
}