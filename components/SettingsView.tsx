import React, { useState, useEffect } from 'react';
import { AiProvider, AiModelConfig, AiProviderSettings, AppSettings, AudioProvider, AudioProviderConfig } from '../types';
import { SaveIcon, AlertTriangleIcon } from './icons/IconDefs';
import { ProviderFactory } from '../services/aiProviders/factory';
import { ModelInfo } from '../services/aiProviders/types';

const DEFAULT_GEMINI_MODELS: AiModelConfig = {
  textGeneration: 'gemini-2.5-pro',
  textGenerationFast: 'gemini-2.5-flash',
  imageGeneration: 'imagen-4.0-generate-001',
  audioGeneration: 'gemini-2.5-flash',
  embedding: 'text-embedding-004'
};

const DEFAULT_OPENAI_MODELS: AiModelConfig = {
  textGeneration: 'gpt-4-turbo-preview',
  textGenerationFast: 'gpt-3.5-turbo',
  imageGeneration: 'dall-e-3',
  audioGeneration: 'tts-1',
  embedding: 'text-embedding-3-small'
};

const DEFAULT_ANTHROPIC_MODELS: AiModelConfig = {
  textGeneration: 'claude-3-opus-20240229',
  textGenerationFast: 'claude-3-sonnet-20240229',
  imageGeneration: '',
  audioGeneration: '',
  embedding: ''
};

const DEFAULT_OPENROUTER_MODELS: AiModelConfig = {
  textGeneration: 'openrouter/polaris-alpha',
  textGenerationFast: 'openrouter/polaris-alpha',
  imageGeneration: 'stability-ai/stable-diffusion-xl',
  audioGeneration: '',
  embedding: 'openai/text-embedding-3-small'
};

const DEFAULT_GROQ_MODELS: AiModelConfig = {
  textGeneration: 'llama-3.3-70b-versatile',
  textGenerationFast: 'llama-3.1-8b-instant',
  imageGeneration: '',
  audioGeneration: '',
  embedding: ''
};

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('appSettings');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      aiProvider: {
        provider: 'gemini',
        apiKey: (import.meta as any).env?.VITE_GEMINI_API_KEY || '',
        models: DEFAULT_GEMINI_MODELS,
        endpoint: ''
      },
      audioProvider: {
        provider: 'gemini',
        apiKey: '',
        endpoint: ''
      },
      imageBackend: 'gemini',
      comfyUIEndpoint: 'http://localhost:8188',
      lastUpdated: new Date().toISOString()
    };
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('appSettings');
    if (!saved) {
      setHasChanges(true);
    }
  }, []);

  useEffect(() => {
    const fetchModels = async () => {
      if (!settings.aiProvider.apiKey) {
        setAvailableModels([]);
        return;
      }

      setLoadingModels(true);
      try {
        const provider = ProviderFactory.createProvider({
          type: settings.aiProvider.provider,
          apiKey: settings.aiProvider.apiKey,
          endpoint: settings.aiProvider.endpoint,
          models: settings.aiProvider.models
        });

        if (provider.listModels) {
          const models = await provider.listModels();
          setAvailableModels(models);
        } else {
          setAvailableModels([]);
        }
      } catch (error) {
        console.error('Failed to fetch models:', error);
        setAvailableModels([]);
      } finally {
        setLoadingModels(false);
      }
    };

    fetchModels();
  }, [settings.aiProvider.provider, settings.aiProvider.apiKey, settings.aiProvider.endpoint]);

  const handleProviderChange = (provider: AiProvider) => {
    let defaultModels: AiModelConfig;
    switch (provider) {
      case 'openai':
        defaultModels = DEFAULT_OPENAI_MODELS;
        break;
      case 'anthropic':
        defaultModels = DEFAULT_ANTHROPIC_MODELS;
        break;
      case 'openrouter':
        defaultModels = DEFAULT_OPENROUTER_MODELS;
        break;
      case 'groq':
        defaultModels = DEFAULT_GROQ_MODELS;
        break;
      case 'gemini':
      default:
        defaultModels = DEFAULT_GEMINI_MODELS;
        break;
    }

    setSettings(prev => ({
      ...prev,
      aiProvider: {
        ...prev.aiProvider,
        provider,
        models: defaultModels,
        apiKey: ''
      }
    }));
    setHasChanges(true);
  };

  const handleApiKeyChange = (apiKey: string) => {
    setSettings(prev => ({
      ...prev,
      aiProvider: {
        ...prev.aiProvider,
        apiKey
      }
    }));
    setHasChanges(true);
  };

  const handleModelChange = (modelType: keyof AiModelConfig, value: string) => {
    setSettings(prev => ({
      ...prev,
      aiProvider: {
        ...prev.aiProvider,
        models: {
          ...prev.aiProvider.models,
          [modelType]: value
        }
      }
    }));
    setHasChanges(true);
  };

  const handleEndpointChange = (endpoint: string) => {
    setSettings(prev => ({
      ...prev,
      aiProvider: {
        ...prev.aiProvider,
        endpoint
      }
    }));
    setHasChanges(true);
  };

  const handleImageBackendChange = (backend: 'gemini' | 'pollinations' | 'comfyui' | 'fastsdcpu') => {
    setSettings(prev => ({
      ...prev,
      imageBackend: backend
    }));
    setHasChanges(true);
  };

  const handleAudioProviderChange = (provider: AudioProvider) => {
    setSettings(prev => ({
      ...prev,
      audioProvider: {
        provider,
        apiKey: '',
        endpoint: '',
        defaultVoice: undefined
      }
    }));
    setHasChanges(true);
  };

  const handleAudioProviderApiKeyChange = (apiKey: string) => {
    setSettings(prev => ({
      ...prev,
      audioProvider: {
        ...prev.audioProvider!,
        apiKey
      }
    }));
    setHasChanges(true);
  };

  const handleAudioProviderEndpointChange = (endpoint: string) => {
    setSettings(prev => ({
      ...prev,
      audioProvider: {
        ...prev.audioProvider!,
        endpoint
      }
    }));
    setHasChanges(true);
  };

  const handleChatterboxConfigChange = (field: 'installPath' | 'pythonPath' | 'modelsPath', value: string) => {
    setSettings(prev => ({
      ...prev,
      audioProvider: {
        ...prev.audioProvider!,
        chatterboxConfig: {
          ...prev.audioProvider?.chatterboxConfig,
          installPath: prev.audioProvider?.chatterboxConfig?.installPath || '',
          pythonPath: prev.audioProvider?.chatterboxConfig?.pythonPath || '',
          modelsPath: prev.audioProvider?.chatterboxConfig?.modelsPath || '',
          [field]: value
        }
      }
    }));
    setHasChanges(true);
  };

  const handleComfyUIMusicConfigChange = (field: 'endpoint' | 'workflowPath', value: string) => {
    setSettings(prev => ({
      ...prev,
      audioProvider: {
        ...prev.audioProvider!,
        comfyUIConfig: {
          ...prev.audioProvider?.comfyUIConfig,
          endpoint: prev.audioProvider?.comfyUIConfig?.endpoint || 'http://localhost:8188',
          [field]: value
        }
      }
    }));
    setHasChanges(true);
  };

  const handleComfyUIEndpointChange = (endpoint: string) => {
    setSettings(prev => ({
      ...prev,
      comfyUIEndpoint: endpoint
    }));
    setHasChanges(true);
  };

  const handleFastSDCPUEndpointChange = (endpoint: string) => {
    setSettings(prev => ({
      ...prev,
      fastsdcpuEndpoint: endpoint
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    const updatedSettings = {
      ...settings,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem('appSettings', JSON.stringify(updatedSettings));
    setSettings(updatedSettings);
    setHasChanges(false);
    window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: updatedSettings }));
  };

  const handleReset = () => {
    const defaultSettings: AppSettings = {
      aiProvider: {
        provider: 'gemini',
        apiKey: (import.meta as any).env?.VITE_GEMINI_API_KEY || '',
        models: DEFAULT_GEMINI_MODELS,
        endpoint: ''
      },
      audioProvider: {
        provider: 'gemini',
        apiKey: '',
        endpoint: ''
      },
      imageBackend: 'gemini',
      comfyUIEndpoint: 'http://localhost:8188',
      lastUpdated: new Date().toISOString()
    };
    setSettings(defaultSettings);
    setHasChanges(true);
  };

  const isModelFieldDisabled = (modelType: keyof AiModelConfig): boolean => {
    if (settings.aiProvider.provider === 'anthropic') {
      return modelType === 'imageGeneration' || modelType === 'audioGeneration';
    }
    return false;
  };

  return (
    <div className="flex-1 overflow-auto bg-brand-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-brand-surface rounded-lg border border-brand-border p-6">
          <h2 className="text-2xl font-bold text-brand-text mb-6">AI Provider Settings</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-brand-text mb-2">
                AI Provider
              </label>
              <select
                value={settings.aiProvider.provider}
                onChange={(e) => handleProviderChange(e.target.value as AiProvider)}
                className="w-full px-3 py-2 bg-brand-background border border-brand-border rounded-md text-black focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="gemini">Google Gemini</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic Claude</option>
                <option value="openrouter">OpenRouter</option>
                <option value="groq">Groq</option>
                <option value="custom">Custom Endpoint</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-text mb-2">
                API Key
              </label>
              <div className="flex gap-2">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={settings.aiProvider.apiKey}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  placeholder="Enter your API key"
                  className="flex-1 px-3 py-2 bg-brand-background border border-brand-border rounded-md text-black focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="px-4 py-2 bg-brand-border hover:bg-brand-border/80 text-brand-text rounded-md transition-colors"
                >
                  {showApiKey ? 'Hide' : 'Show'}
                </button>
              </div>
              {!settings.aiProvider.apiKey && (
                <p className="text-amber-500 text-sm mt-2 flex items-center gap-2">
                  <AlertTriangleIcon className="w-4 h-4" />
                  API key is required for AI features to work
                </p>
              )}
            </div>

            {settings.aiProvider.provider === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-brand-text mb-2">
                  Custom Endpoint URL
                </label>
                <input
                  type="text"
                  value={settings.aiProvider.endpoint || ''}
                  onChange={(e) => handleEndpointChange(e.target.value)}
                  placeholder="https://api.example.com/v1"
                  className="w-full px-3 py-2 bg-brand-background border border-brand-border rounded-md text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
            )}
          </div>
        </div>

        <div className="bg-brand-surface rounded-lg border border-brand-border p-6">
          <h3 className="text-xl font-bold text-brand-text mb-4">Model Configuration</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-text mb-2">
                Text Generation (High Quality)
              </label>
              <select
                value={settings.aiProvider.models.textGeneration}
                onChange={(e) => handleModelChange('textGeneration', e.target.value)}
                disabled={isModelFieldDisabled('textGeneration') || loadingModels}
                className="w-full px-3 py-2 bg-brand-background border border-brand-border rounded-md text-black focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-50"
              >
                {loadingModels ? (
                  <option value="">Loading models...</option>
                ) : availableModels.length > 0 ? (
                  <>
                    <option value="">Select a model</option>
                    {availableModels
                      .filter(m => (m.capabilities || []).includes('text') || (m.capabilities || []).includes('structured'))
                      .map(model => (
                        <option key={model.id} value={model.id}>
                          {model.name} {model.contextWindow ? `(${model.contextWindow} tokens)` : ''}
                        </option>
                      ))}
                  </>
                ) : (
                  <option value={settings.aiProvider.models.textGeneration}>
                    {settings.aiProvider.models.textGeneration || 'No models available'}
                  </option>
                )}
              </select>
              <p className="text-brand-text-secondary text-xs mt-1">
                Used for complex writing tasks and detailed content generation
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-text mb-2">
                Text Generation (Fast)
              </label>
              <select
                value={settings.aiProvider.models.textGenerationFast}
                onChange={(e) => handleModelChange('textGenerationFast', e.target.value)}
                disabled={isModelFieldDisabled('textGenerationFast') || loadingModels}
                className="w-full px-3 py-2 bg-brand-background border border-brand-border rounded-md text-black focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-50"
              >
                {loadingModels ? (
                  <option value="">Loading models...</option>
                ) : availableModels.length > 0 ? (
                  <>
                    <option value="">Select a model</option>
                    {availableModels
                      .filter(m => (m.capabilities || []).includes('text') || (m.capabilities || []).includes('structured'))
                      .map(model => (
                        <option key={model.id} value={model.id}>
                          {model.name} {model.contextWindow ? `(${model.contextWindow} tokens)` : ''}
                        </option>
                      ))}
                  </>
                ) : (
                  <option value={settings.aiProvider.models.textGenerationFast}>
                    {settings.aiProvider.models.textGenerationFast || 'No models available'}
                  </option>
                )}
              </select>
              <p className="text-brand-text-secondary text-xs mt-1">
                Used for quick responses and simple tasks
              </p>
            </div>


            <div>
              <label className="block text-sm font-medium text-brand-text mb-2">
                Embedding Model
              </label>
              <input
                type="text"
                value={settings.aiProvider.models.embedding}
                onChange={(e) => handleModelChange('embedding', e.target.value)}
                disabled={isModelFieldDisabled('embedding')}
                className="w-full px-3 py-2 bg-brand-background border border-brand-border rounded-md text-black focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-50"
              />
              <p className="text-brand-text-secondary text-xs mt-1">
                Used for semantic search and document retrieval
              </p>
            </div>
          </div>
        </div>

        <div className="bg-brand-surface rounded-lg border border-brand-border p-6">
          <h3 className="text-xl font-bold text-brand-text mb-4">Image Backend</h3>
          
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 border border-brand-border rounded-md cursor-pointer hover:bg-brand-background transition-colors">
              <input
                type="radio"
                name="imageBackend"
                value="gemini"
                checked={settings.imageBackend === 'gemini'}
                onChange={() => handleImageBackendChange('gemini')}
                className="w-4 h-4 text-brand-primary"
              />
              <div>
                <div className="font-medium text-brand-text">Gemini Imagen</div>
                <div className="text-sm text-brand-text-secondary">
                  High-quality AI-generated images using Google's Imagen model
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border border-brand-border rounded-md cursor-pointer hover:bg-brand-background transition-colors">
              <input
                type="radio"
                name="imageBackend"
                value="pollinations"
                checked={settings.imageBackend === 'pollinations'}
                onChange={() => handleImageBackendChange('pollinations')}
                className="w-4 h-4 text-brand-primary"
              />
              <div>
                <div className="font-medium text-brand-text">Pollinations.ai</div>
                <div className="text-sm text-brand-text-secondary">
                  Free, open-source image generation (no API key required)
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border border-brand-border rounded-md cursor-pointer hover:bg-brand-background transition-colors">
              <input
                type="radio"
                name="imageBackend"
                value="comfyui"
                checked={settings.imageBackend === 'comfyui'}
                onChange={() => handleImageBackendChange('comfyui')}
                className="w-4 h-4 text-brand-primary"
              />
              <div>
                <div className="font-medium text-brand-text">ComfyUI</div>
                <div className="text-sm text-brand-text-secondary">
                  Self-hosted Stable Diffusion with ComfyUI API
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border border-brand-border rounded-md cursor-pointer hover:bg-brand-background transition-colors">
              <input
                type="radio"
                name="imageBackend"
                value="fastsdcpu"
                checked={settings.imageBackend === 'fastsdcpu'}
                onChange={() => handleImageBackendChange('fastsdcpu')}
                className="w-4 h-4 text-brand-primary"
              />
              <div>
                <div className="font-medium text-brand-text">FastSD CPU</div>
                <div className="text-sm text-brand-text-secondary">
                  Fast Stable Diffusion optimized for CPU inference
                </div>
              </div>
            </label>

            {settings.imageBackend === 'comfyui' && (
              <div className="mt-4 p-4 bg-brand-background rounded-md border border-brand-border">
                <label className="block text-sm font-medium text-brand-text mb-2">
                  ComfyUI Endpoint URL
                </label>
                <input
                  type="text"
                  value={settings.comfyUIEndpoint || 'http://localhost:8188'}
                  onChange={(e) => handleComfyUIEndpointChange(e.target.value)}
                  placeholder="http://localhost:8188"
                  className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded-md text-black focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
                <p className="text-brand-text-secondary text-xs mt-1">
                  URL of your ComfyUI server (typically http://localhost:8188)
                </p>
              </div>
            )}

            {settings.imageBackend === 'fastsdcpu' && (
              <div className="mt-4 p-4 bg-brand-background rounded-md border border-brand-border">
                <label className="block text-sm font-medium text-brand-text mb-2">
                  FastSD CPU Endpoint URL
                </label>
                <input
                  type="text"
                  value={settings.fastsdcpuEndpoint || 'http://localhost:8000'}
                  onChange={(e) => handleFastSDCPUEndpointChange(e.target.value)}
                  placeholder="http://localhost:8000"
                  className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded-md text-black focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
                <p className="text-brand-text-secondary text-xs mt-1">
                  URL of your FastSD CPU server (typically http://localhost:8000)
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-brand-surface rounded-lg border border-brand-border p-6">
          <h3 className="text-xl font-bold text-brand-text mb-4">Audio Provider Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-text mb-2">
                Audio Generation Provider
              </label>
              <select
                value={settings.audioProvider?.provider || 'gemini'}
                onChange={(e) => handleAudioProviderChange(e.target.value as AudioProvider)}
                className="w-full px-3 py-2 bg-brand-background border border-brand-border rounded-md text-black focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="gemini">Google Gemini TTS</option>
                <option value="openai">OpenAI TTS</option>
                <option value="chatterbox">Chatterbox TTS (Local)</option>
                <option value="comfyui">ComfyUI/DiffRhythm (Music)</option>
                <option value="elevenlabs">ElevenLabs</option>
                <option value="azure">Azure Speech</option>
                <option value="aws">AWS Polly</option>
              </select>
              <p className="text-brand-text-secondary text-xs mt-1">
                Provider for audiobook narration and music generation
              </p>
            </div>

            {settings.audioProvider && ['gemini', 'openai', 'elevenlabs', 'azure', 'aws'].includes(settings.audioProvider.provider) && (
              <div>
                <label className="block text-sm font-medium text-brand-text mb-2">
                  Audio Provider API Key
                </label>
                <div className="flex gap-2">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={settings.audioProvider.apiKey || ''}
                    onChange={(e) => handleAudioProviderApiKeyChange(e.target.value)}
                    placeholder="Enter API key for audio provider"
                    className="flex-1 px-3 py-2 bg-brand-background border border-brand-border rounded-md text-black focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="px-4 py-2 bg-brand-border hover:bg-brand-border/80 text-brand-text rounded-md transition-colors"
                  >
                    {showApiKey ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            )}

            {settings.audioProvider?.provider === 'chatterbox' && (
              <div className="space-y-3 p-4 bg-brand-background rounded-md border border-brand-border">
                <p className="text-sm text-brand-text mb-2 font-medium">
                  Chatterbox Local Configuration
                </p>
                <div>
                  <label className="block text-xs font-medium text-brand-text-secondary mb-1">
                    Installation Path
                  </label>
                  <input
                    type="text"
                    value={settings.audioProvider.chatterboxConfig?.installPath || ''}
                    onChange={(e) => handleChatterboxConfigChange('installPath', e.target.value)}
                    placeholder="C:/chatterbox or /usr/local/chatterbox"
                    className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded-md text-black focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-text-secondary mb-1">
                    Python Executable Path
                  </label>
                  <input
                    type="text"
                    value={settings.audioProvider.chatterboxConfig?.pythonPath || ''}
                    onChange={(e) => handleChatterboxConfigChange('pythonPath', e.target.value)}
                    placeholder="python or /usr/bin/python3"
                    className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded-md text-black focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-text-secondary mb-1">
                    Models Directory Path
                  </label>
                  <input
                    type="text"
                    value={settings.audioProvider.chatterboxConfig?.modelsPath || ''}
                    onChange={(e) => handleChatterboxConfigChange('modelsPath', e.target.value)}
                    placeholder="./models or /path/to/models"
                    className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded-md text-black focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
                <p className="text-xs text-amber-500 flex items-center gap-2 mt-2">
                  <AlertTriangleIcon className="w-3 h-3" />
                  Requires local Chatterbox installation. Run: git clone https://github.com/resemble-ai/chatterbox.git
                </p>
              </div>
            )}

            {settings.audioProvider?.provider === 'comfyui' && (
              <div className="space-y-3 p-4 bg-brand-background rounded-md border border-brand-border">
                <p className="text-sm text-brand-text mb-2 font-medium">
                  ComfyUI Music Generation (DiffRhythm)
                </p>
                <div>
                  <label className="block text-xs font-medium text-brand-text-secondary mb-1">
                    ComfyUI Endpoint URL
                  </label>
                  <input
                    type="text"
                    value={settings.audioProvider.comfyUIConfig?.endpoint || 'http://localhost:8188'}
                    onChange={(e) => handleComfyUIMusicConfigChange('endpoint', e.target.value)}
                    placeholder="http://localhost:8188"
                    className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded-md text-black focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-text-secondary mb-1">
                    DiffRhythm Workflow Path (Optional)
                  </label>
                  <input
                    type="text"
                    value={settings.audioProvider.comfyUIConfig?.workflowPath || ''}
                    onChange={(e) => handleComfyUIMusicConfigChange('workflowPath', e.target.value)}
                    placeholder="./workflows/diffrhythm.json"
                    className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded-md text-black focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                  <p className="text-xs text-brand-text-secondary mt-1">
                    Leave blank to use default DiffRhythm workflow
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center pt-4">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-brand-text-secondary hover:text-brand-text transition-colors"
          >
            Reset to Defaults
          </button>
          
          <div className="flex gap-2">
            {hasChanges && (
              <span className="text-amber-500 text-sm py-2 px-4">
                Unsaved changes
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="flex items-center gap-2 px-6 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SaveIcon className="w-4 h-4" />
              Save Settings
            </button>
          </div>
        </div>

        {settings.lastUpdated && (
          <div className="text-center text-xs text-brand-text-secondary pt-2">
            Last updated: {new Date(settings.lastUpdated).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};