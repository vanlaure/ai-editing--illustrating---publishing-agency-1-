import type { AIProvider, AIProviderModel, AIProviderRole } from '../types';
import { PROVIDER_PRESETS } from '../stores/settingsStore';
import { BACKEND_URL } from './backendService';

async function postProviderModels(provider: AIProvider): Promise<any> {
    const response = await fetch(`${BACKEND_URL}/api/providers/models`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            provider: provider.id,
            baseUrl: provider.baseUrl,
            apiKey: provider.apiKey || undefined,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Fetch available models from a provider's API.
 * Returns an array of { id, name } objects.
 */
export async function fetchModels(provider: AIProvider): Promise<AIProviderModel[]> {
    const preset = PROVIDER_PRESETS.find(p => p.id === provider.id);

    try {
        switch (provider.id) {
            case 'openrouter':
                return await fetchOpenRouterModels(provider);

            case 'nvidia':
                return await fetchNvidiaModels(provider);

            case 'ollama':
                return await fetchOllamaModels(provider);

            case 'comfyui':
            case 'comfyui-video':
                return await fetchComfyUIModels(provider);

            case 'huggingface':
                return await fetchHuggingFaceModels(provider);

            case 'custom':
                return await fetchOpenAICompatibleModels(provider);

            default:
                if (preset?.modelListEndpoint) {
                    return await fetchOpenAICompatibleModels(provider);
                }
                return [];
        }
    } catch (error) {
        console.error(`Failed to fetch models from ${provider.name}:`, error);
        throw error;
    }
}

// --- OpenRouter (uses /api/frontend/models for full 665-model catalog) ---

/**
 * Categorize a model based on its input/output modality arrays.
 * Priority: output modality first (video > image > audio > embeddings > text),
 * then refine by input modalities.
 */
function categorizeByModalities(inputMods: string[], outputMods: string[]): string {
    const hasOut = (m: string) => outputMods.includes(m);
    const hasIn = (m: string) => inputMods.includes(m);

    if (hasOut('video')) return 'Video Generation';
    if (hasOut('image')) return 'Image Generation';
    if (hasOut('audio')) return 'Audio Generation';
    if (hasOut('embeddings')) return 'Embeddings';

    // Text output — sub-categorize by input
    if (hasIn('video')) return 'Vision + Video Understanding';
    if (hasIn('audio')) return 'Audio Understanding';
    if (hasIn('image') || hasIn('file')) return 'Vision (Multimodal)';
    return 'Text Only';
}

function formatPrice(priceStr: string | number | undefined): number | undefined {
    if (priceStr === undefined || priceStr === null) return undefined;
    const n = typeof priceStr === 'string' ? parseFloat(priceStr) : priceStr;
    if (isNaN(n)) return undefined;
    // API returns price per token; convert to per-million
    return Math.round(n * 1_000_000 * 100) / 100;
}

function formatContextLength(ctx: number | undefined): string {
    if (!ctx) return '';
    if (ctx >= 1_000_000) return `${(ctx / 1_000_000).toFixed(1)}M ctx`;
    if (ctx >= 1_000) return `${Math.round(ctx / 1_000)}K ctx`;
    return `${ctx} ctx`;
}

async function fetchOpenRouterModels(provider: AIProvider): Promise<AIProviderModel[]> {
    // The full OpenRouter catalog (665 models) lives at /api/frontend/models,
    // but that endpoint is CORS-restricted to openrouter.ai.
    // We proxy through our backend to bypass this.
    // Falls back to the v1 API (348 models) if the proxy is unavailable.
    let rawModels: any[];

    try {
        const proxyResp = await fetch(`${BACKEND_URL}/api/providers/models?provider=openrouter-full`);
        if (proxyResp.ok) {
            const proxyData = await proxyResp.json();
            rawModels = proxyData.data || [];
        } else {
            throw new Error('Backend proxy returned ' + proxyResp.status);
        }
    } catch {
        console.warn('OpenRouter full catalog proxy unavailable, falling back to backend /models proxy');
        const data = await postProviderModels(provider);
        rawModels = data.data || [];
    }

    if (!Array.isArray(rawModels) || rawModels.length === 0) return [];

    return rawModels
        .filter((m: any) => !m.hidden)
        .map((m: any) => {
            // V1 API uses `id` (includes variant suffix like `:free`)
            // Frontend proxy uses `slug` (no variant suffix) + `endpoint.is_free`
            // We must reconstruct the full model ID that the API actually accepts
            let id = m.id || m.slug;
            // Frontend proxy uses `slug` without `:free` suffix — reconstruct full API model ID
            if (!m.id && m.slug && (m.is_free || m.endpoint?.is_free)) {
                id = m.slug + ':free';
            }
            const name = m.name || id;
            const inputMods: string[] = m.input_modalities || m.architecture?.input_modalities || ['text'];
            const outputMods: string[] = m.output_modalities || m.architecture?.output_modalities || ['text'];
            const category = categorizeByModalities(inputMods, outputMods);

            // Pricing: frontend nests under endpoint.pricing, v1 has it top-level
            const pricing = m.endpoint?.pricing || m.pricing || {};
            const promptPrice = formatPrice(pricing.prompt);
            const completionPrice = formatPrice(pricing.completion);
            const ctx = m.context_length || m.endpoint?.context_length || m.top_provider?.context_length;
            const isFree = m.endpoint?.is_free || (promptPrice === 0 && completionPrice === 0);

            // Build concise description
            const parts: string[] = [];
            if (m.author) parts.push(m.author);
            if (ctx) parts.push(formatContextLength(ctx));
            if (isFree) {
                parts.push('Free');
            } else {
                if (promptPrice !== undefined) parts.push(`$${promptPrice}/M in`);
                if (completionPrice !== undefined) parts.push(`$${completionPrice}/M out`);
            }

            const modality = `${inputMods.join('+')} -> ${outputMods.join('+')}`;

            return {
                id,
                name,
                description: parts.join(' | ') || undefined,
                modality,
                contextLength: ctx,
                promptPrice,
                completionPrice,
                category,
            };
        })
        .filter((m: AIProviderModel, i: number, arr: AIProviderModel[]) => arr.findIndex(x => x.id === m.id) === i)
        .sort((a: AIProviderModel, b: AIProviderModel) => {
            // Sort by category first, then by name within category
            const catCmp = (a.category || '').localeCompare(b.category || '');
            if (catCmp !== 0) return catCmp;
            return a.name.localeCompare(b.name);
        });
}

/** Get unique categories from a model list (for filtering UI) */
export function getModelCategories(models: AIProviderModel[]): string[] {
    const cats = new Set(models.map(m => m.category).filter(Boolean));
    return Array.from(cats).sort() as string[];
}

// --- NVIDIA NIM (OpenAI-compatible) ---

async function fetchNvidiaModels(provider: AIProvider): Promise<AIProviderModel[]> {
    try {
        const data = await postProviderModels(provider);
        const models = data.data || data;

        return (Array.isArray(models) ? models : []).map((m: any) => ({
            id: m.id || m.model,
            name: m.id || m.name || m.model,
            description: m.owned_by || undefined,
        })).sort((a: AIProviderModel, b: AIProviderModel) => a.name.localeCompare(b.name));
    } catch {
        // Fallback: common NVIDIA NIM models
        return [
            { id: 'meta/llama-3.3-70b-instruct', name: 'Llama 3.3 70B Instruct', description: 'Meta' },
            { id: 'meta/llama-3.1-405b-instruct', name: 'Llama 3.1 405B Instruct', description: 'Meta' },
            { id: 'nvidia/llama-3.1-nemotron-70b-instruct', name: 'Nemotron 70B Instruct', description: 'NVIDIA' },
            { id: 'mistralai/mixtral-8x22b-instruct-v0.1', name: 'Mixtral 8x22B Instruct', description: 'Mistral AI' },
            { id: 'google/gemma-2-27b-it', name: 'Gemma 2 27B IT', description: 'Google' },
            { id: 'nvidia/consistory', name: 'Consistory (Image)', description: 'NVIDIA image gen' },
            { id: 'nvidia/cosmos-nemotron-34b', name: 'Cosmos Nemotron 34B (Video)', description: 'NVIDIA video gen' },
        ];
    }
}

// --- Ollama ---

async function fetchOllamaModels(provider: AIProvider): Promise<AIProviderModel[]> {
    const response = await fetch(`${provider.baseUrl}/api/tags`);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    const data = await response.json();
    return (data.models || []).map((m: any) => ({
        id: m.name || m.model,
        name: m.name || m.model,
        description: m.details?.family || m.details?.parameter_size || undefined,
    }));
}

// --- ComfyUI (checkpoint models) ---

async function fetchComfyUIModels(provider: AIProvider): Promise<AIProviderModel[]> {
    // Route through backend to avoid CORS issues (browser can't reach ComfyUI directly)
    try {
        const response = await fetch(`${BACKEND_URL}/api/comfyui/models?baseUrl=${encodeURIComponent(provider.baseUrl)}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        return (Array.isArray(data.models) ? data.models : []).map((name: string) => ({
            id: name,
            name: name.replace(/\.(safetensors|ckpt|pt)$/i, ''),
        }));
    } catch (err) {
        console.warn('Failed to fetch ComfyUI models via backend:', err);
        return [];
    }
}

// --- HuggingFace Inference API ---

async function fetchHuggingFaceModels(provider: AIProvider): Promise<AIProviderModel[]> {
    const headers: Record<string, string> = {};
    if (provider.apiKey) {
        headers['Authorization'] = `Bearer ${provider.apiKey}`;
    }

    // Fetch popular image generation models
    const tasks = ['text-to-image', 'image-to-video', 'text-to-video'];
    const allModels: AIProviderModel[] = [];

    for (const task of tasks) {
        try {
            const response = await fetch(
                `https://huggingface.co/api/models?pipeline_tag=${task}&sort=likes&direction=-1&limit=20`,
                { headers }
            );
            if (!response.ok) continue;
            const data = await response.json();
            for (const m of data) {
                allModels.push({
                    id: m.id || m.modelId,
                    name: m.id || m.modelId,
                    description: `${task} | ${m.likes || 0} likes`,
                });
            }
        } catch {
            // skip failed task queries
        }
    }

    if (allModels.length === 0) {
        // Fallback popular models
        return [
            { id: 'stabilityai/stable-diffusion-xl-base-1.0', name: 'SDXL Base 1.0', description: 'text-to-image' },
            { id: 'black-forest-labs/FLUX.1-dev', name: 'FLUX.1 Dev', description: 'text-to-image' },
            { id: 'black-forest-labs/FLUX.1-schnell', name: 'FLUX.1 Schnell', description: 'text-to-image (fast)' },
            { id: 'stabilityai/stable-video-diffusion-img2vid-xt', name: 'SVD img2vid XT', description: 'image-to-video' },
            { id: 'ali-vilab/text-to-video-ms-1.7b', name: 'Text-to-Video 1.7B', description: 'text-to-video' },
        ];
    }

    return allModels;
}

// --- Connectivity Test ---

export async function testConnection(provider: AIProvider, role?: AIProviderRole): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
    try {
        const response = await fetch(`${BACKEND_URL}/api/providers/test`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                role,
                provider: provider.id,
                baseUrl: provider.baseUrl,
                apiKey: provider.apiKey || undefined,
                selectedModel: provider.selectedModel || undefined,
            }),
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    } catch (err: any) {
        return { ok: false, latencyMs: 0, error: err.message || 'Connection failed' };
    }
}

// --- Generic OpenAI-compatible fallback ---

async function fetchOpenAICompatibleModels(provider: AIProvider): Promise<AIProviderModel[]> {
    const data = await postProviderModels(provider);
    const models = data.data || data;

    return (Array.isArray(models) ? models : []).map((m: any) => ({
        id: m.id || m.model,
        name: m.id || m.name || m.model,
        description: m.description || m.owned_by || undefined,
    })).sort((a: AIProviderModel, b: AIProviderModel) => a.name.localeCompare(b.name));
}
