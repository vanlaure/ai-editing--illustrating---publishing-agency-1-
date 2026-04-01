import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { AIProviderRole, AIProviderModel, ProviderPreset } from '../types';
import { useSettings, PROVIDER_PRESETS } from '../stores/settingsStore';
import { fetchModels, testConnection, getModelCategories } from '../services/providerService';

// --- Icons ---

const ThinkingIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
);

const ImageIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const VideoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M4 6h11a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" />
    </svg>
);

const RefreshIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 4l1.5 1.5A9 9 0 0120.5 16M20 20l-1.5-1.5A9 9 0 003.5 8" />
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

const BackIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);

// --- Role config ---

const ROLE_CONFIG: { role: AIProviderRole; label: string; description: string; icon: React.ReactNode; iconBg: string; iconText: string }[] = [
    {
        role: 'thinking',
        label: 'Thinking / Script Analysis',
        description: 'LLM for script analysis, editing, and tool use',
        icon: <ThinkingIcon />,
        iconBg: 'bg-brand-cyan/20',
        iconText: 'text-brand-cyan',
    },
    {
        role: 'image',
        label: 'Image Generation',
        description: 'Generate images from text prompts',
        icon: <ImageIcon />,
        iconBg: 'bg-brand-magenta/20',
        iconText: 'text-brand-magenta',
    },
    {
        role: 'video',
        label: 'Text+Image to Video',
        description: 'Generate video clips from images and text prompts',
        icon: <VideoIcon />,
        iconBg: 'bg-purple-400/20',
        iconText: 'text-purple-400',
    },
];

// --- Searchable Model Selector ---

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const ClearIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

interface ModelSelectorProps {
    models: AIProviderModel[];
    selectedModel: string;
    onSelect: (id: string) => void;
    fetchStatus: 'idle' | 'fetching' | 'success' | 'error';
    fetchError: string | null;
    onFetch: () => void;
    disabled: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ models, selectedModel, onSelect, fetchStatus, fetchError, onFetch, disabled }) => {
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const categories = useMemo(() => getModelCategories(models), [models]);
    const hasCategories = categories.length > 1;

    const filteredModels = useMemo(() => {
        let filtered = models;
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(m => m.category === categoryFilter);
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            filtered = filtered.filter(m =>
                m.name.toLowerCase().includes(q) ||
                m.id.toLowerCase().includes(q) ||
                m.description?.toLowerCase().includes(q)
            );
        }
        return filtered;
    }, [models, categoryFilter, search]);

    // Group filtered models by category for display
    const groupedModels = useMemo(() => {
        if (!hasCategories || categoryFilter !== 'all') {
            return [{ category: null, models: filteredModels }];
        }
        const groups: { category: string | null; models: AIProviderModel[] }[] = [];
        const catMap = new Map<string, AIProviderModel[]>();
        for (const m of filteredModels) {
            const cat = m.category || 'Other';
            if (!catMap.has(cat)) catMap.set(cat, []);
            catMap.get(cat)!.push(m);
        }
        for (const [cat, ms] of catMap) {
            groups.push({ category: cat, models: ms });
        }
        return groups;
    }, [filteredModels, hasCategories, categoryFilter]);

    const selectedModelObj = models.find(m => m.id === selectedModel);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isOpen]);

    // Focus search when dropdown opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-sm text-gray-300 font-medium">Model</label>
                <button
                    onClick={onFetch}
                    disabled={fetchStatus === 'fetching' || disabled}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                        fetchStatus === 'fetching'
                            ? 'bg-brand-cyan/10 text-brand-cyan/50 cursor-wait'
                            : fetchStatus === 'success'
                                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                : fetchStatus === 'error'
                                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                    : 'bg-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan/30'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {fetchStatus === 'fetching' ? (
                        <span className="animate-spin"><RefreshIcon /></span>
                    ) : fetchStatus === 'success' ? (
                        <><CheckIcon /> {models.length} models</>
                    ) : (
                        <><RefreshIcon /> Fetch Models</>
                    )}
                </button>
            </div>

            {models.length > 0 ? (
                <div ref={dropdownRef} className="relative">
                    {/* Selected model display / trigger */}
                    <button
                        type="button"
                        onClick={() => !disabled && setIsOpen(!isOpen)}
                        disabled={disabled}
                        className="w-full bg-brand-gray border border-brand-light-gray/30 rounded-lg px-4 py-2.5 text-left text-white focus:outline-none focus:border-brand-cyan/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
                    >
                        <div className="truncate">
                            {selectedModelObj ? (
                                <span>
                                    <span className="text-white">{selectedModelObj.name}</span>
                                    {selectedModelObj.description && (
                                        <span className="text-gray-500 text-xs ml-2">{selectedModelObj.description}</span>
                                    )}
                                </span>
                            ) : (
                                <span className="text-gray-500">Select a model...</span>
                            )}
                        </div>
                        <svg className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {/* Dropdown */}
                    {isOpen && (
                        <div className="absolute z-50 mt-1 w-full bg-brand-dark border border-brand-light-gray/30 rounded-lg shadow-2xl overflow-hidden" style={{ maxHeight: '400px' }}>
                            {/* Search bar */}
                            <div className="p-2 border-b border-brand-light-gray/20 sticky top-0 bg-brand-dark z-10">
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"><SearchIcon /></span>
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        value={search}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                                        placeholder={`Search ${models.length} models...`}
                                        className="w-full bg-brand-gray border border-brand-light-gray/20 rounded-md pl-9 pr-8 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-cyan/50"
                                    />
                                    {search && (
                                        <button
                                            onClick={() => setSearch('')}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                                        >
                                            <ClearIcon />
                                        </button>
                                    )}
                                </div>

                                {/* Category filter pills */}
                                {hasCategories && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        <button
                                            onClick={() => setCategoryFilter('all')}
                                            className={`px-2 py-0.5 rounded text-xs transition-colors ${
                                                categoryFilter === 'all'
                                                    ? 'bg-brand-cyan/20 text-brand-cyan'
                                                    : 'bg-brand-light-gray/10 text-gray-400 hover:text-white'
                                            }`}
                                        >
                                            All ({models.length})
                                        </button>
                                        {categories.map(cat => {
                                            const count = models.filter(m => m.category === cat).length;
                                            return (
                                                <button
                                                    key={cat}
                                                    onClick={() => setCategoryFilter(cat)}
                                                    className={`px-2 py-0.5 rounded text-xs transition-colors ${
                                                        categoryFilter === cat
                                                            ? 'bg-brand-cyan/20 text-brand-cyan'
                                                            : 'bg-brand-light-gray/10 text-gray-400 hover:text-white'
                                                    }`}
                                                >
                                                    {cat} ({count})
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Model list */}
                            <div className="overflow-y-auto" style={{ maxHeight: '320px' }}>
                                {filteredModels.length === 0 ? (
                                    <div className="px-4 py-6 text-center text-gray-500 text-sm">
                                        No models match "{search}"
                                    </div>
                                ) : (
                                    groupedModels.map(group => (
                                        <div key={group.category || 'ungrouped'}>
                                            {group.category && (
                                                <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-brand-gray/50 sticky top-0">
                                                    {group.category} ({group.models.length})
                                                </div>
                                            )}
                                            {group.models.map((m, idx) => (
                                                <button
                                                    key={`${m.id}-${idx}`}
                                                    onClick={() => {
                                                        onSelect(m.id);
                                                        setIsOpen(false);
                                                        setSearch('');
                                                    }}
                                                    className={`w-full px-4 py-2 text-left text-sm transition-colors flex items-center justify-between gap-2 ${
                                                        m.id === selectedModel
                                                            ? 'bg-brand-cyan/10 text-brand-cyan'
                                                            : 'text-gray-300 hover:bg-brand-light-gray/10 hover:text-white'
                                                    }`}
                                                >
                                                    <div className="min-w-0">
                                                        <div className="truncate font-medium">{m.name}</div>
                                                        {m.description && (
                                                            <div className="text-xs text-gray-500 truncate">{m.description}</div>
                                                        )}
                                                    </div>
                                                    {m.id === selectedModel && (
                                                        <CheckIcon />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-brand-gray border border-brand-light-gray/20 rounded-lg px-4 py-3 text-gray-500 text-sm">
                    {fetchStatus === 'fetching'
                        ? 'Fetching available models...'
                        : fetchStatus === 'error'
                            ? `Error: ${fetchError}`
                            : 'Select a provider and click "Fetch Models" to load available models'
                    }
                </div>
            )}
        </div>
    );
};

// --- Provider Card ---

interface ProviderCardProps {
    role: AIProviderRole;
    label: string;
    description: string;
    icon: React.ReactNode;
    iconBg: string;
    iconText: string;
}

// Env key mapping: provider id -> VITE_ env var name
const ENV_KEY_MAP: Record<string, string> = {
    openrouter: 'VITE_OPENROUTER_API_KEY',
    nvidia: 'VITE_NVIDIA_API_KEY',
    huggingface: 'VITE_HUGGINGFACE_API_KEY',
};

function getEnvApiKey(providerId: string): string {
    const envVar = ENV_KEY_MAP[providerId];
    if (!envVar) return '';
    return (import.meta as any)?.env?.[envVar] || '';
}

const LockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);

const UnlockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
    </svg>
);

const SignalIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);

const ProviderCard: React.FC<ProviderCardProps> = ({ role, label, description, icon, iconBg, iconText }) => {
    const { settings, setPreset, updateField, setModels } = useSettings();
    const provider = settings[role];
    const presetsForRole = PROVIDER_PRESETS.filter(p => p.roles.includes(role));

    const [fetchStatus, setFetchStatus] = useState<'idle' | 'fetching' | 'success' | 'error'>('idle');
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [showApiKey, setShowApiKey] = useState(false);
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'connected' | 'failed'>('idle');
    const [testLatency, setTestLatency] = useState<number | null>(null);
    const [testError, setTestError] = useState<string | null>(null);
    const [locked, setLocked] = useState(false);

    // Resolve API key: explicit field > env var
    const resolvedApiKey = provider.apiKey || getEnvApiKey(provider.id);
    const providerWithKey = { ...provider, apiKey: resolvedApiKey };

    const handleFetchModels = useCallback(async () => {
        setFetchStatus('fetching');
        setFetchError(null);
        try {
            const models = await fetchModels(providerWithKey);
            setModels(role, models);
            setFetchStatus('success');
            if (!provider.selectedModel && models.length > 0) {
                updateField(role, 'selectedModel', models[0].id);
            }
        } catch (err: any) {
            setFetchError(err.message || 'Failed to fetch models');
            setFetchStatus('error');
        }
    }, [providerWithKey, provider.selectedModel, role, setModels, updateField]);

    const handlePresetChange = useCallback(async (presetId: string) => {
        if (locked) return;
        setPreset(role, presetId as ProviderPreset);
        setFetchStatus('idle');
        setFetchError(null);
        setTestStatus('idle');
        setTestLatency(null);

        const preset = PROVIDER_PRESETS.find(p => p.id === presetId);
        if (preset) {
            setTimeout(async () => {
                setFetchStatus('fetching');
                try {
                    const updatedProvider = {
                        ...provider,
                        id: preset.id,
                        name: preset.name,
                        baseUrl: preset.defaultBaseUrl,
                        apiKey: getEnvApiKey(preset.id) || provider.apiKey,
                        models: [],
                        selectedModel: '',
                    };
                    const models = await fetchModels(updatedProvider);
                    setModels(role, models);
                    setFetchStatus('success');
                    if (models.length > 0) {
                        updateField(role, 'selectedModel', models[0].id);
                    }
                } catch (err: any) {
                    setFetchError(err.message || 'Failed to fetch models');
                    setFetchStatus('error');
                }
            }, 100);
        }
    }, [locked, provider, role, setPreset, setModels, updateField]);

    const handleTestConnection = useCallback(async () => {
        setTestStatus('testing');
        setTestError(null);
        const result = await testConnection(providerWithKey);
        if (result.ok) {
            setTestStatus('connected');
            setTestLatency(result.latencyMs);
        } else {
            setTestStatus('failed');
            setTestError(result.error || 'Connection failed');
            setTestLatency(null);
        }
    }, [providerWithKey]);

    const handleLockIn = useCallback(() => {
        if (!provider.selectedModel) return;
        setLocked(true);
    }, [provider.selectedModel]);

    const handleUnlock = useCallback(() => {
        setLocked(false);
    }, []);

    const preset = PROVIDER_PRESETS.find(p => p.id === provider.id);
    const needsApiKey = preset?.requiresApiKey ?? false;
    const hasEnvKey = !!getEnvApiKey(provider.id);
    const canLock = !!provider.selectedModel && testStatus === 'connected';

    return (
        <div className={`bg-brand-dark border rounded-xl p-6 space-y-4 transition-all ${
            locked
                ? 'border-green-500/40 shadow-[0_0_15px_rgba(34,197,94,0.1)]'
                : 'border-brand-light-gray/20'
        }`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${iconBg} ${iconText}`}>
                        {icon}
                    </div>
                    <div>
                        <h3 className="text-white font-semibold text-lg">{label}</h3>
                        <p className="text-gray-400 text-sm">{description}</p>
                    </div>
                </div>
                {locked && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                        <LockIcon /> Locked
                    </div>
                )}
            </div>

            {/* Provider Selector */}
            <div className="space-y-2">
                <label className="text-sm text-gray-300 font-medium">Provider</label>
                <select
                    value={provider.id}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handlePresetChange(e.target.value)}
                    disabled={locked}
                    className="w-full bg-brand-gray border border-brand-light-gray/30 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand-cyan/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {presetsForRole.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </div>

            {/* Base URL */}
            <div className="space-y-2">
                <label className="text-sm text-gray-300 font-medium">Base URL</label>
                <input
                    type="text"
                    value={provider.baseUrl}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField(role, 'baseUrl', e.target.value)}
                    placeholder="https://api.example.com/v1"
                    disabled={locked}
                    className="w-full bg-brand-gray border border-brand-light-gray/30 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-brand-cyan/50 transition-colors font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                />
            </div>

            {/* API Key */}
            {needsApiKey && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm text-gray-300 font-medium">API Key</label>
                        {hasEnvKey && !provider.apiKey && (
                            <span className="text-xs text-green-400/70">Using .env key</span>
                        )}
                    </div>
                    <div className="relative">
                        <input
                            type={showApiKey ? 'text' : 'password'}
                            value={provider.apiKey}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField(role, 'apiKey', e.target.value)}
                            placeholder={hasEnvKey ? 'Using key from .env.local' : 'Enter API key...'}
                            disabled={locked}
                            className="w-full bg-brand-gray border border-brand-light-gray/30 rounded-lg px-4 py-2.5 pr-20 text-white placeholder-gray-500 focus:outline-none focus:border-brand-cyan/50 transition-colors font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors"
                        >
                            {showApiKey ? 'Hide' : 'Show'}
                        </button>
                    </div>
                </div>
            )}

            {/* Fetch Models + Model Selector */}
            <ModelSelector
                models={provider.models}
                selectedModel={provider.selectedModel}
                onSelect={(id: string) => updateField(role, 'selectedModel', id)}
                fetchStatus={fetchStatus}
                fetchError={fetchError}
                onFetch={handleFetchModels}
                disabled={locked}
            />

            {/* Test Connection + Lock In */}
            <div className="flex items-center gap-2 pt-2 border-t border-brand-light-gray/10">
                <button
                    onClick={handleTestConnection}
                    disabled={testStatus === 'testing' || !provider.selectedModel}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        testStatus === 'testing'
                            ? 'bg-yellow-500/20 text-yellow-400 cursor-wait'
                            : testStatus === 'connected'
                                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                : testStatus === 'failed'
                                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                    : 'bg-brand-light-gray/10 text-gray-300 hover:bg-brand-light-gray/20'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                    {testStatus === 'testing' ? (
                        <><span className="animate-spin"><SignalIcon /></span> Testing...</>
                    ) : testStatus === 'connected' ? (
                        <><CheckIcon /> Connected{testLatency !== null ? ` (${testLatency}ms)` : ''}</>
                    ) : testStatus === 'failed' ? (
                        <><SignalIcon /> Failed{testError ? `: ${testError.slice(0, 30)}` : ''}</>
                    ) : (
                        <><SignalIcon /> Test Connection</>
                    )}
                </button>

                {locked ? (
                    <button
                        onClick={handleUnlock}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-all"
                    >
                        <UnlockIcon /> Unlock
                    </button>
                ) : (
                    <button
                        onClick={handleLockIn}
                        disabled={!canLock}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        title={!canLock ? 'Select a model and test connection first' : 'Lock in this configuration'}
                    >
                        <LockIcon /> Lock In
                    </button>
                )}
            </div>
        </div>
    );
};

// --- Settings Page ---

interface SettingsPageProps {
    onClose: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onClose }) => {
    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-brand-light-gray/20 transition-colors"
                    >
                        <BackIcon />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-white">AI Provider Settings</h2>
                        <p className="text-gray-400 text-sm mt-1">Configure the AI providers and models for each stage of the pipeline</p>
                    </div>
                </div>
            </div>

            {/* Provider Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {ROLE_CONFIG.map(cfg => (
                    <ProviderCard key={cfg.role} {...cfg} />
                ))}
            </div>

            {/* Info footer */}
            <div className="bg-brand-dark/50 border border-brand-light-gray/10 rounded-xl p-4 text-sm text-gray-500">
                <p>API keys are stored in your browser's localStorage for convenience. For production use, configure keys via environment variables in <code className="text-gray-400">.env.local</code>.</p>
            </div>
        </div>
    );
};

export default SettingsPage;
