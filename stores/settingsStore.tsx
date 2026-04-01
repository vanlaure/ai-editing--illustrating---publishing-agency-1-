import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { AIProvider, AIProviderSettings, AIProviderRole, ProviderPreset, ProviderPresetConfig } from '../types';

// --- Provider Presets ---

const DEFAULT_COMFYUI_URL = (import.meta as any)?.env?.VITE_COMFYUI_API_URL || 'http://localhost:8188';
const DEFAULT_COMFYUI_VIDEO_URL =
    (import.meta as any)?.env?.VITE_COMFYUI_VIDEO_API_URL ||
    DEFAULT_COMFYUI_URL;
const LEGACY_COMFYUI_VIDEO_URL = 'http://127.0.0.1:8189';

export const PROVIDER_PRESETS: ProviderPresetConfig[] = [
    // Thinking / LLM providers
    { id: 'openrouter', name: 'OpenRouter', defaultBaseUrl: 'https://openrouter.ai/api/v1', roles: ['thinking', 'image'], requiresApiKey: true, modelListEndpoint: '/models' },
    { id: 'nvidia', name: 'NVIDIA NIM', defaultBaseUrl: 'https://integrate.api.nvidia.com/v1', roles: ['thinking'], requiresApiKey: true, modelListEndpoint: '/models' },
    { id: 'ollama', name: 'Ollama (Local)', defaultBaseUrl: 'http://localhost:11434', roles: ['thinking'], requiresApiKey: false, modelListEndpoint: '/api/tags' },
    { id: 'custom', name: 'OpenAI-Compatible', defaultBaseUrl: 'http://localhost:1234/v1', roles: ['thinking', 'image'], requiresApiKey: true, modelListEndpoint: '/models' },

    // Image generation providers
    { id: 'comfyui', name: 'ComfyUI (Local)', defaultBaseUrl: DEFAULT_COMFYUI_URL, roles: ['image'], requiresApiKey: false },

    // Video generation providers
    { id: 'comfyui-video', name: 'ComfyUI Video (Local)', defaultBaseUrl: DEFAULT_COMFYUI_VIDEO_URL, roles: ['video'], requiresApiKey: false },
];

// --- Default State ---

const defaultProvider = (role: AIProviderRole): AIProvider => {
    const defaults: Record<AIProviderRole, Partial<AIProvider> & { id: string; name: string; baseUrl: string }> = {
        thinking: { id: 'openrouter', name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1' },
        image: { id: 'comfyui', name: 'ComfyUI (Local)', baseUrl: DEFAULT_COMFYUI_URL },
        video: { id: 'comfyui-video', name: 'ComfyUI Video (Local)', baseUrl: DEFAULT_COMFYUI_VIDEO_URL },
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

function isPresetAllowed(role: AIProviderRole, providerId: string): boolean {
    return PROVIDER_PRESETS.some(preset => preset.id === providerId && preset.roles.includes(role));
}

function sanitizeProvider(role: AIProviderRole, provider: AIProvider | undefined): AIProvider {
    if (!provider || !isPresetAllowed(role, provider.id)) {
        return defaultProvider(role);
    }

    const normalized = {
        ...defaultProvider(role),
        ...provider,
    };

    // Migrate the old separate video default (8189) to the active ComfyUI URL.
    if (role === 'video' && normalized.id === 'comfyui-video' && normalized.baseUrl === LEGACY_COMFYUI_VIDEO_URL) {
        normalized.baseUrl = DEFAULT_COMFYUI_VIDEO_URL;
    }

    return {
        ...normalized,
    };
}

function loadSettings(): AIProviderSettings {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            return {
                thinking: sanitizeProvider('thinking', parsed.thinking),
                image: sanitizeProvider('image', parsed.image),
                video: sanitizeProvider('video', parsed.video),
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

    return (
        <SettingsContext.Provider value={{ settings, dispatch, setPreset, updateField, setModels }}>
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
