// Prefer environment-provided backend URL (set via Vite env)
// with a fallback to the backend server port (3002) so health checks hit the API instead of the frontend dev server.
export const BACKEND_URL = (import.meta as any)?.env?.VITE_BACKEND_URL || 'http://localhost:3002';
export const STITCHSTREAM_URL = (import.meta as any)?.env?.VITE_STITCHSTREAM_URL || 'http://localhost:4100';
export const REQUIRED_BACKEND_FEATURES = [
  'api_meta_v1',
  'ai_generate_v1',
  'provider_models_post_v1',
  'provider_test_v1',
  'comfyui_baseurl_v1',
] as const;

// Add debug logging to confirm which URL is being used
console.log('Backend URL initialized to:', BACKEND_URL);
console.log('StitchStream URL initialized to:', STITCHSTREAM_URL);

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

export interface BackendMeta {
  status: string;
  service: string;
  startedAt: string;
  port: number;
  features: string[];
}

export interface ComfyUIHealthResult {
  available: boolean;
  backendReachable: boolean;
  message?: string;
  baseUrl?: string;
  requestedBaseUrl?: string;
  fallbackUsed?: boolean;
}

export interface ComfyUIPreflightResult extends ComfyUIHealthResult {
  ok: boolean;
  missingNodes: string[];
}

function formatBackendFetchError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return `${error.message}. Cannot reach backend at ${BACKEND_URL}.`;
  }

  return `Cannot reach backend at ${BACKEND_URL}.`;
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
      const detailParts = [
        error.error || 'Failed to generate video',
        error.details,
        error.stack
      ].filter(Boolean);
      throw new Error(detailParts.join(': '));
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Video generation failed');
    }
    return data;
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

  async checkComfyUIHealth(baseUrl?: string): Promise<ComfyUIHealthResult> {
    try {
      const query = baseUrl ? `?baseUrl=${encodeURIComponent(baseUrl)}` : '';
      const response = await fetch(`${BACKEND_URL}/api/comfyui/health${query}`);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          available: false,
          backendReachable: true,
          message: data.error || `Backend returned HTTP ${response.status} while checking ComfyUI.`,
          baseUrl: data.baseUrl,
          requestedBaseUrl: data.requestedBaseUrl,
          fallbackUsed: data.fallbackUsed,
        };
      }

      return {
        available: data.available || false,
        backendReachable: true,
        message: data.error,
        baseUrl: data.baseUrl,
        requestedBaseUrl: data.requestedBaseUrl,
        fallbackUsed: data.fallbackUsed,
      };
    } catch (error) {
      return {
        available: false,
        backendReachable: false,
        message: formatBackendFetchError(error),
        requestedBaseUrl: baseUrl,
      };
    }
  },

  async checkStitchStreamHealth(): Promise<{ available: boolean }> {
    // Ping StitchStream studio (configurable via VITE_STITCHSTREAM_URL) to see if it is reachable
    try {
      const response = await fetch(`${STITCHSTREAM_URL}/health`);
      if (response.ok) {
        return { available: true };
      }
    } catch {
      // ignored, falls through to secondary probe
    }

    // Secondary probe: try hitting root; some setups may not expose /health
    try {
      const response = await fetch(STITCHSTREAM_URL, { method: 'HEAD' });
      return { available: response.ok };
    } catch {
      return { available: false };
    }
  },

  async recoverImages(shotIds: string[]): Promise<{ recovered: Record<string, { imageUrl: string; id: number }>; missing: string[] }> {
    const response = await fetch(`${BACKEND_URL}/api/comfyui/recover-images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shotIds })
    });
    if (!response.ok) throw new Error('Recovery request failed');
    return response.json();
  },

  async getImageByShotId(shotId: string): Promise<{ imageUrl: string; id: number } | null> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/comfyui/image-by-shot/${shotId}`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.success ? data : null;
    } catch {
      return null;
    }
  },

  async generateImageWithComfyUI(params: {
    baseUrl?: string;
    prompt: string;
    negative_prompt?: string;
    width?: number;
    height?: number;
    steps?: number;
    cfg_scale?: number;
    init_image?: string;
    denoising_strength?: number;
    reference_face_image?: string;
    ipadapter_weight?: number;
    shotId?: string;
    generationType?: string;
  }): Promise<{ imageUrl: string }> {
    const comfyParams = {
      prompt: params.prompt,
      negative_prompt: params.negative_prompt || 'blurry, low quality, worst quality, bad anatomy, extra limbs, watermark, text, deformed',
      width: params.width || 1024,
      height: params.height || 576,
      steps: params.steps || 20,
      cfg_scale: params.cfg_scale || 7.0,
      init_image: params.init_image,
      denoising_strength: params.denoising_strength || 0.45,
      reference_face_image: params.reference_face_image,
      ipadapter_weight: params.ipadapter_weight || 0.85,
      shotId: params.shotId,
      generationType: params.generationType || 'shot',
      baseUrl: params.baseUrl,
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

  async generateBatchImagesWithComfyUI(prompts: Array<{
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
    baseUrl?: string;
    imageUrl: string;
    prompt: string;
    duration: number;
    quality?: 'draft' | 'high';
    workflow?: 'i2v' | 'portrait' | 'realistic' | 'stylized' | 'plate' | 'animatediff';
    negative_prompt?: string;
    width?: number;
    height?: number;
    fps?: number;
    steps?: number;
    cfg?: number;
    seed?: number;
    denoise?: number;
    camera_motion?: string;
    lipSync?: boolean;
    audioUrl?: string;
    shotId?: string;
    video_model?: string;
    render_profile?: string;
  }): Promise<{ promptId: string; message: string }> {
    const response = await fetch(`${BACKEND_URL}/api/comfyui/generate-video-clip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: response.statusText,
        details: `HTTP ${response.status}`
      }));

      // Build detailed error message
      let errorMessage = error.error || 'Failed to generate video clip';
      if (error.details) {
        errorMessage += `\n\nDetails: ${error.details}`;
      }
      if (error.stage) {
        errorMessage += `\n\nError occurred during: ${error.stage}`;
      }
      if (error.instructions) {
        errorMessage += `\n\nSetup Instructions:\n${error.instructions.join('\n')}`;
      }
      if (error.suggestion) {
        errorMessage += `\n\nSuggestion: ${error.suggestion}`;
      }

      console.error('Video generation API error:', {
        status: response.status,
        error: error.error,
        details: error.details,
        stage: error.stage,
        instructions: error.instructions,
        suggestion: error.suggestion
      });

      throw new Error(errorMessage);
    }

    const data = await response.json();
    return {
      promptId: data.promptId,
      message: data.message
    };
  },

  // Best-effort helper: fetch final clip URL for a completed prompt.
  // Frontend can call this to resolve playable URLs instead of relying only on in-memory blobs.
  async getVideoClipUrl(promptId: string): Promise<string | null> {
    const status = await this.getVideoClipStatus(promptId);
    if (status && status.success && status.clipUrl) {
      return status.clipUrl;
    }
    return null;
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
    shotId?: string | null;
    videoId?: number;
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

  async comfyPreflight(): Promise<ComfyUIPreflightResult> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/comfyui/preflight`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        return {
          ok: false,
          available: false,
          backendReachable: true,
          missingNodes: Array.isArray(data.missingNodes) ? data.missingNodes : ['unknown'],
          message: data.message || `Backend returned HTTP ${response.status} while checking ComfyUI preflight.`,
          baseUrl: data.baseUrl,
          requestedBaseUrl: data.requestedBaseUrl,
          fallbackUsed: data.fallbackUsed,
        };
      }
      return {
        ok: !!data.ok,
        available: !!data.available,
        backendReachable: true,
        missingNodes: Array.isArray(data.missingNodes) ? data.missingNodes : [],
        message: data.message,
        baseUrl: data.baseUrl,
        requestedBaseUrl: data.requestedBaseUrl,
        fallbackUsed: data.fallbackUsed,
      };
    } catch (e) {
      return {
        ok: false,
        available: false,
        backendReachable: false,
        missingNodes: ['unknown'],
        message: formatBackendFetchError(e),
      };
    }
  },

  async comfyPreflightFor(baseUrl?: string): Promise<ComfyUIPreflightResult> {
    try {
      const query = baseUrl ? `?baseUrl=${encodeURIComponent(baseUrl)}` : '';
      const response = await fetch(`${BACKEND_URL}/api/comfyui/preflight${query}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        return {
          ok: false,
          available: false,
          backendReachable: true,
          missingNodes: Array.isArray(data.missingNodes) ? data.missingNodes : ['unknown'],
          message: data.message || `Backend returned HTTP ${response.status} while checking ComfyUI preflight.`,
          baseUrl: data.baseUrl,
          requestedBaseUrl: data.requestedBaseUrl,
          fallbackUsed: data.fallbackUsed,
        };
      }
      return {
        ok: !!data.ok,
        available: !!data.available,
        backendReachable: true,
        missingNodes: Array.isArray(data.missingNodes) ? data.missingNodes : [],
        message: data.message,
        baseUrl: data.baseUrl,
        requestedBaseUrl: data.requestedBaseUrl,
        fallbackUsed: data.fallbackUsed,
      };
    } catch (e) {
      return {
        ok: false,
        available: false,
        backendReachable: false,
        missingNodes: ['unknown'],
        message: formatBackendFetchError(e),
        requestedBaseUrl: baseUrl,
      };
    }
  },

  async generateAiText(params: {
    provider?: any;
    prompt?: string;
    system?: string;
    responseSchema?: any;
    jsonMode?: boolean;
    images?: { data: string; mimeType: string }[];
    temperature?: number;
    maxTokens?: number;
    geminiModel?: string;
    geminiContents?: any;
  }): Promise<{ text: string; tokenUsage: number }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 300_000); // 5 min timeout for large LLM requests
    let response: Response;
    try {
      response = await fetch(`${BACKEND_URL}/api/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: controller.signal,
      });
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error('Request timed out — the AI provider took too long to respond. Try a faster model or simplify the request.');
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || 'Failed to generate AI text');
    }

    return response.json();
  },

  async generateProviderImage(params: {
    provider: any;
    prompt: string;
    width?: number;
    height?: number;
  }): Promise<{ imageUrl: string; tokenUsage: number }> {
    const response = await fetch(`${BACKEND_URL}/api/ai/image/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || 'Failed to generate image');
    }

    return response.json();
  },

  async editImageWithGemini(imageDataUrl: string, prompt: string): Promise<{ imageUrl: string; tokenUsage: number }> {
    const response = await fetch(`${BACKEND_URL}/api/ai/image/edit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageDataUrl, prompt }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || 'Failed to edit image');
    }

    return response.json();
  },

  getImageUrl(filename: string): string {
    return `${BACKEND_URL}/images/${filename}`;
  },

  getAudioUrl(filename: string): string {
    return `${BACKEND_URL}/audio/${filename}`;
  },

  getVideoUrl(filename: string): string {
    return `${BACKEND_URL}/videos/${filename}`;
  },

  async getBackendMeta(): Promise<BackendMeta> {
    const response = await fetch(`${BACKEND_URL}/api/meta`);
    if (!response.ok) {
      throw new Error(`Backend metadata unavailable (HTTP ${response.status})`);
    }
    return response.json();
  },

  async checkBackendCompatibility(): Promise<{
    ok: boolean;
    message?: string;
    meta?: BackendMeta;
    missingFeatures?: string[];
  }> {
    try {
      const meta = await this.getBackendMeta();
      const features = Array.isArray(meta.features) ? meta.features : [];
      const missingFeatures = REQUIRED_BACKEND_FEATURES.filter(feature => !features.includes(feature));

      if (missingFeatures.length > 0) {
        return {
          ok: false,
          meta,
          missingFeatures,
          message: `Backend is running but missing required features: ${missingFeatures.join(', ')}.`,
        };
      }

      return { ok: true, meta };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error
          ? `${error.message}. The backend may be offline or an outdated process is still bound to ${BACKEND_URL}.`
          : `Backend compatibility check failed for ${BACKEND_URL}.`,
      };
    }
  }
};
