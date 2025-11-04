// Prefer environment-provided backend URL (set via Vite env)
const BACKEND_URL = (import.meta as any)?.env?.VITE_BACKEND_URL || 'http://localhost:3002';

import type { IntroOverlayConfig, OutroOverlayConfig } from '../types';

export interface Scene {
  imageUrl: string;
  duration: number;
  description?: string;
}

export interface VideoGenerationRequest {
  scenes: Scene[];
  audioUrl?: string;
  outputFormat?: string;
  width?: number;
  height?: number;
  fps?: number;
  intro?: IntroOverlayConfig;
  outro?: OutroOverlayConfig;
}

export interface VideoGenerationResponse {
  success: boolean;
  videoUrl?: string;
  error?: string;
  processingTime?: number;
}

export interface ProductionData {
  id?: string;
  characterBibles?: any;
  visualBibles?: any;
  scripts?: any;
  storyboards?: any;
  metadata?: any;
}

export const backendService = {
  async saveProduction(data: ProductionData): Promise<{ id: string }> {
    const response = await fetch(`${BACKEND_URL}/api/productions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to save production: ${response.statusText}`);
    }
    
    return response.json();
  },

  async loadProduction(id: string): Promise<ProductionData> {
    const response = await fetch(`${BACKEND_URL}/api/productions/${id}`);
    
    if (!response.ok) {
      throw new Error(`Failed to load production: ${response.statusText}`);
    }
    
    return response.json();
  },

  async uploadImage(file: File): Promise<{ imageUrl: string, filename?: string }> {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch(`${BACKEND_URL}/api/images/upload`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Failed to upload image: ${response.statusText}`);
    }
    const json = await response.json();
    return { imageUrl: json.url, filename: json.filename };
  },

  async uploadImages(files: File[]): Promise<{ imageUrls: string[] }> {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    
    const response = await fetch(`${BACKEND_URL}/api/images/upload-batch`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Failed to upload images: ${response.statusText}`);
    }
    const json = await response.json();
    const urls = Array.isArray(json.images) ? json.images.map((i: any) => i.url) : [];
    return { imageUrls: urls };
  },

  async uploadAudio(file: File): Promise<{ audioUrl: string, filename?: string }> {
    const formData = new FormData();
    formData.append('audio', file);
    
    const response = await fetch(`${BACKEND_URL}/api/audio/upload`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Failed to upload audio: ${response.statusText}`);
    }
    const json = await response.json();
    return { audioUrl: json.url, filename: json.filename };
  },

  async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    const response = await fetch(`${BACKEND_URL}/api/video/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || 'Failed to generate video');
    }
    
    return response.json();
  },

  async uploadVideo(file: File): Promise<{ videoUrl: string, filename?: string }> {
    const formData = new FormData();
    formData.append('video', file);
    const response = await fetch(`${BACKEND_URL}/api/videos/upload`, { method: 'POST', body: formData });
    if (!response.ok) {
      throw new Error(`Failed to upload video: ${response.statusText}`);
    }
    const json = await response.json();
    return { videoUrl: json.url, filename: json.filename };
  },

  async checkA1111Health(): Promise<{ available: boolean }> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/comfyui/health`);
      const data = await response.json();
      return { available: data.available || false };
    } catch {
      return { available: false };
    }
  },

  async generateImageWithA1111(params: {
    prompt: string;
    negative_prompt?: string;
    width?: number;
    height?: number;
    steps?: number;
    cfg_scale?: number;
    init_image?: string;
    denoising_strength?: number;
  }): Promise<{ imageUrl: string }> {
    const comfyParams = {
      prompt: params.prompt,
      negative_prompt: params.negative_prompt || 'blurry, low quality, worst quality, bad anatomy, extra limbs, watermark, text, deformed',
      width: params.width || 1024,
      height: params.height || 576,
      steps: params.steps || 20,
      cfg_scale: params.cfg_scale || 7.0,
      init_image: params.init_image,
      denoising_strength: params.denoising_strength || 0.45
    };

    const response = await fetch(`${BACKEND_URL}/api/comfyui/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comfyParams)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || 'Failed to generate image with ComfyUI');
    }

    const data = await response.json();
    return { imageUrl: data.imageUrl };
  },

  async generateBatchImagesWithA1111(prompts: Array<{
    prompt: string;
    negative_prompt?: string;
    width?: number;
    height?: number;
    init_image?: string;
    denoising_strength?: number;
  }>): Promise<Array<{ imageUrl: string }>> {
    const response = await fetch(`${BACKEND_URL}/api/comfyui/generate-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images: prompts })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || 'Failed to generate batch images with ComfyUI');
    }

    const data = await response.json();
    return data.images;
  },

  async generateVideoClip(params: {
    imageUrl: string;
    prompt: string;
    duration: number;
    quality?: 'draft' | 'high';
    negative_prompt?: string;
    width?: number;
    height?: number;
    fps?: number;
    steps?: number;
    cfg?: number;
    seed?: number;
    denoise?: number;
    camera_motion?: string;
  }): Promise<{ promptId: string; message: string }> {
    const response = await fetch(`${BACKEND_URL}/api/comfyui/generate-video-clip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || 'Failed to generate video clip');
    }

    const data = await response.json();
    return {
      promptId: data.promptId,
      message: data.message
    };
  },

  async getVideoClipStatus(promptId: string): Promise<{
    success?: boolean;
    clipUrl?: string;
    duration?: number;
    frameCount?: number;
    fps?: number;
    progress?: number;
    status?: string;
    error?: string;
  }> {
    const response = await fetch(`${BACKEND_URL}/api/comfyui/video-status/${promptId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get video status: ${response.statusText}`);
    }
    
    return response.json();
  },

  async getVideoGenerationProgress(promptId: string): Promise<{ progress: number; status: string; error?: string }> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/comfyui/progress/${promptId}`);
      if (!response.ok) {
        throw new Error(`Failed to get progress: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      console.error('Error getting video generation progress:', error);
      return { progress: 0, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  getImageUrl(filename: string): string {
    return `${BACKEND_URL}/images/${filename}`;
  },

  getAudioUrl(filename: string): string {
    return `${BACKEND_URL}/audio/${filename}`;
  },

  getVideoUrl(filename: string): string {
    return `${BACKEND_URL}/videos/${filename}`;
  }
};
