import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { AIProvider, AIProviderSettings, AIProviderRole, ProviderPreset, ProviderPresetConfig } from '../types';

// --- Provider Presets ---

export const PROVIDER_PRESETS: ProviderPresetConfig[] = [
    // Thinking / LLM providers (also available for image & video where applicable)
    { id: 'openrouter', name: 'OpenRouter', defaultBaseUrl: 'https://openrouter.ai/api/v1', roles: ['thinking', 'image', 'video'], requiresApiKey: true, modelListEndpoint: '/models' },
    { id: 'nvidia', name: 'NVIDIA NIM', defaultBaseUrl: 'https://integrate.api.nvidia.com/v1', roles: ['thinking', 'image', 'video'], requiresApiKey: true, modelListEndpoint: '/models' },
    { id: 'ollama', name: 'Ollama (Local)', defaultBaseUrl: 'http://localhost:11434', roles: ['thinking', 'image', 'video'], requiresApiKey: false, modelListEndpoint: '/api/tags' },

    // Image generation providers
    { id: 'comfyui', name: 'ComfyUI (Local)', defaultBaseUrl: 'http://localhost:8188', roles: ['image'], requiresApiKey: false },
    { id: 'huggingface', name: 'HuggingFace Inference', defaultBaseUrl: 'https://api-inference.huggingface.co', roles: ['image', 'video'], requiresApiKey: true, modelListEndpoint: '/api/models' },

    // Video generation providers
    { id: 'comfyui-video', name: 'ComfyUI Video (Local)', defaultBaseUrl: 'http://127.0.0.1:8189', roles: ['video'], requiresApiKey: false },
];

// --- Default State ---

const defaultProvider = (role: AIProviderRole): AIProvider => {
    const defaults: Record<AIProviderRole, Partial<AIProvider> & { id: string; name: string; baseUrl: string }> = {
        thinking: { id: 'openrouter', name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1' },
        image: { id: 'comfyui', name: 'ComfyUI (Local)', baseUrl: 'http://localhost:8188' },
        video: { id: 'comfyui-video', name: 'ComfyUI Video (Local)', baseUrl: 'http://127.0.0.1:8189' },
    };
    const d = defaults[role];
    return {
        ...d,
        apiKey: '',
        models: [],
        selectedModel: '',
        enabled: true,
    };
};

const defaultSettings: AIProviderSettings = {
    thinking: defaultProvider('thinking'),
    image: defaultProvider('image'),
    video: defaultProvider('video'),
};

// --- Reducer ---

type SettingsAction =
    | { type: 'SET_PROVIDER'; role: AIProviderRole; provider: AIProvider }
    | { type: 'SET_PRESET'; role: AIProviderRole; preset: ProviderPreset }
    | { type: 'UPDATE_FIELD'; role: AIProviderRole; field: keyof AIProvider; value: any }
    | { type: 'SET_MODELS'; role: AIProviderRole; models: AIProvider['models'] }
    | { type: 'LOAD'; settings: AIProviderSettings };

function settingsReducer(state: AIProviderSettings, action: SettingsAction): AIProviderSettings {
    switch (action.type) {
        case 'SET_PROVIDER':
            return { ...state, [action.role]: action.provider };
        case 'SET_PRESET': {
            const preset = PROVIDER_PRESETS.find(p => p.id === action.preset);
            if (!preset) return state;
            return {
                ...state,
                [action.role]: {
                    ...state[action.role],
                    id: preset.id,
                    name: preset.name,
                    baseUrl: preset.defaultBaseUrl,
                    models: [],
                    selectedModel: '',
                },
            };
        }
        case 'UPDATE_FIELD':
            return {
                ...state,
                [action.role]: { ...state[action.role], [action.field]: action.value },
            };
        case 'SET_MODELS':
            return {
                ...state,
                [action.role]: { ...state[action.role], models: action.models },
            };
        case 'LOAD':
            return action.settings;
        default:
            return state;
    }
}

// --- Context ---

interface SettingsContextValue {
    settings: AIProviderSettings;
    dispatch: React.Dispatch<SettingsAction>;
    setPreset: (role: AIProviderRole, preset: ProviderPreset) => void;
    updateField: (role: AIProviderRole, field: keyof AIProvider, value: any) => void;
    setModels: (role: AIProviderRole, models: AIProvider['models']) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

const SETTINGS_KEY = 'ai_music_video_provider_settings';

// Resolve API key from env vars when not explicitly set

function getEnvApiKey(providerId: string): string {
    switch (providerId) {
        case 'openrouter': return process.env.OPENROUTER_API_KEY || '';
        case 'nvidia': return process.env.NVIDIA_API_KEY || '';
        case 'huggingface': return process.env.HUGGINGFACE_API_KEY || '';
        default: return '';
    }
}

function resolveApiKey(provider: AIProvider): AIProvider {
    // Always prefer env var if available, fall back to stored key
    const envKey = getEnvApiKey(provider.id);
    if (envKey) {
        return { ...provider, apiKey: envKey };
    }
    return provider;
}

function loadSettings(): AIProviderSettings {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            // Merge with defaults to handle new fields, then resolve env API keys
            return {
                thinking: resolveApiKey({ ...defaultSettings.thinking, ...parsed.thinking }),
                image: resolveApiKey({ ...defaultSettings.image, ...parsed.image }),
                video: resolveApiKey({ ...defaultSettings.video, ...parsed.video }),
            };
        }
    } catch (e) {
        console.warn('Failed to load provider settings', e);
    }
    return defaultSettings;
}

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, dispatch] = useReducer(settingsReducer, null, loadSettings);

    // Persist to localStorage on changes
    useEffect(() => {
        try {
            // Strip API keys from localStorage for security - they're only kept in memory
            // Actually, for local dev convenience, we do persist them (users can clear manually)
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (e) {
            console.warn('Failed to save provider settings', e);
        }
    }, [settings]);

    const setPreset = useCallback((role: AIProviderRole, preset: ProviderPreset) => {
        dispatch({ type: 'SET_PRESET', role, preset });
    }, []);

    const updateField = useCallback((role: AIProviderRole, field: keyof AIProvider, value: any) => {
        dispatch({ type: 'UPDATE_FIELD', role, field, value });
    }, []);

    const setModels = useCallback((role: AIProviderRole, models: AIProvider['models']) => {
        dispatch({ type: 'SET_MODELS', role, models });
    }, []);

    // Always resolve API keys from env vars before providing to consumers
    const resolvedSettings = React.useMemo(() => ({
        thinking: resolveApiKey(settings.thinking),
        image: resolveApiKey(settings.image),
        video: resolveApiKey(settings.video),
    }), [settings]);

    return (
        <SettingsContext.Provider value={{ settings: resolvedSettings, dispatch, setPreset, updateField, setModels }}>
            {children}
        </SettingsContext.Provider>
    );
};

export function useSettings(): SettingsContextValue {
    const ctx = useContext(SettingsContext);
    if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
    return ctx;
}

export { defaultSettings, SETTINGS_KEY };
