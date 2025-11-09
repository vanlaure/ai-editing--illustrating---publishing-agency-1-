import React, { useState } from 'react';
import type { MapDesign, SymbolDesign, EnvironmentDesign, PropDesign } from '../types';

type WorldbuildingTab = 'maps' | 'symbols' | 'environments' | 'props' | 'knowledge';

type MapType = 'world' | 'region' | 'city' | 'dungeon' | 'battle';
type EnvironmentType = 'architectural' | 'natural' | 'urban' | 'fantasy' | 'scifi' | 'cultural';
type PropType = 'weapon' | 'vehicle' | 'technology' | 'artifact';

interface WorldbuildingViewProps {
  maps: MapDesign[];
  symbols: SymbolDesign[];
  environments: EnvironmentDesign[];
  props: PropDesign[];
  onGenerateMap: (mapType: MapType, name: string, description: string, scale: string) => Promise<void>;
  onGenerateSymbol: (name: string, description: string, symbolType: string, faction?: string) => Promise<void>;
  onGenerateEnvironment: (envType: EnvironmentType, name: string, description: string, mood: string) => Promise<void>;
  onGenerateProp: (propType: PropType, name: string, description: string, scale: string) => Promise<void>;
  onDeleteMap: (id: string) => void;
  onDeleteSymbol: (id: string) => void;
  onDeleteEnvironment: (id: string) => void;
  onDeleteProp: (id: string) => void;
  // Knowledge/Context Bible handlers
  onUploadKnowledgeSource?: (params: {
    bibleType: 'series' | 'research' | 'styleTone' | 'canon' | 'licensingIP' | 'custom';
    label: string;
    seriesId?: string;
    bookId?: string;
    projectId?: string;
    text?: string;
    files?: FileList;
  }) => Promise<void>;
  isProcessingKnowledge?: boolean;
}

export const WorldbuildingView: React.FC<WorldbuildingViewProps> = ({
  maps,
  symbols,
  environments,
  props,
  onGenerateMap,
  onGenerateSymbol,
  onGenerateEnvironment,
  onGenerateProp,
  onDeleteMap,
  onDeleteSymbol,
  onDeleteEnvironment,
  onDeleteProp,
}) => {
  const [activeTab, setActiveTab] = useState<WorldbuildingTab>('maps');
  const [isGenerating, setIsGenerating] = useState(false);

  // Map creation state
  const [mapType, setMapType] = useState<MapType>('world');
  const [mapName, setMapName] = useState('');
  const [mapDescription, setMapDescription] = useState('');
  const [mapScale, setMapScale] = useState('');

  // Symbol creation state
  const [symbolName, setSymbolName] = useState('');
  const [symbolDescription, setSymbolDescription] = useState('');
  const [symbolType, setSymbolType] = useState('');
  const [symbolFaction, setSymbolFaction] = useState('');

  // Environment creation state
  const [envType, setEnvType] = useState<EnvironmentType>('architectural');
  const [envName, setEnvName] = useState('');
  const [envDescription, setEnvDescription] = useState('');
  const [envMood, setEnvMood] = useState('');

  // Prop creation state
  const [propType, setPropType] = useState<PropType>('weapon');
  const [propName, setPropName] = useState('');
  const [propDescription, setPropDescription] = useState('');
  const [propScale, setPropScale] = useState('');

  const handleGenerateMap = async () => {
    if (!mapName || !mapDescription) return;
    setIsGenerating(true);
    try {
      await onGenerateMap(mapType, mapName, mapDescription, mapScale);
      setMapName('');
      setMapDescription('');
      setMapScale('');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateSymbol = async () => {
    if (!symbolName || !symbolDescription) return;
    setIsGenerating(true);
    try {
      await onGenerateSymbol(symbolName, symbolDescription, symbolType, symbolFaction || undefined);
      setSymbolName('');
      setSymbolDescription('');
      setSymbolType('');
      setSymbolFaction('');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateEnvironment = async () => {
    if (!envName || !envDescription) return;
    setIsGenerating(true);
    try {
      await onGenerateEnvironment(envType, envName, envDescription, envMood);
      setEnvName('');
      setEnvDescription('');
      setEnvMood('');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateProp = async () => {
    if (!propName || !propDescription) return;
    setIsGenerating(true);
    try {
      await onGenerateProp(propType, propName, propDescription, propScale);
      setPropName('');
      setPropDescription('');
      setPropScale('');
    } finally {
      setIsGenerating(false);
    }
  };

  const mapTypeOptions: { value: MapType; label: string; emoji: string }[] = [
    { value: 'world', label: 'World Map', emoji: '🌍' },
    { value: 'region', label: 'Region Map', emoji: '🗺️' },
    { value: 'city', label: 'City Map', emoji: '🏙️' },
    { value: 'dungeon', label: 'Dungeon Map', emoji: '⚔️' },
    { value: 'battle', label: 'Battle Map', emoji: '⚔️' },
  ];

  const envTypeOptions: { value: EnvironmentType; label: string; emoji: string }[] = [
    { value: 'architectural', label: 'Architectural', emoji: '🏛️' },
    { value: 'natural', label: 'Natural', emoji: '🌲' },
    { value: 'urban', label: 'Urban', emoji: '🌆' },
    { value: 'fantasy', label: 'Fantasy', emoji: '🏰' },
    { value: 'scifi', label: 'Sci-Fi', emoji: '🚀' },
    { value: 'cultural', label: 'Cultural', emoji: '🎭' },
  ];

  const propTypeOptions: { value: PropType; label: string; emoji: string }[] = [
    { value: 'weapon', label: 'Weapon', emoji: '⚔️' },
    { value: 'vehicle', label: 'Vehicle', emoji: '🚗' },
    { value: 'technology', label: 'Technology', emoji: '💻' },
    { value: 'artifact', label: 'Artifact', emoji: '💎' },
  ];

  return (
    <div className="h-full flex flex-col bg-brand-bg">
      {/* Tab Navigation */}
      <div className="border-b border-brand-border bg-brand-surface">
        <div className="flex space-x-1 px-4">
          <button
            onClick={() => setActiveTab('maps')}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'maps'
                ? 'border-b-2 border-brand-primary text-brand-primary'
                : 'text-brand-text-secondary hover:text-brand-text-primary'
            }`}
          >
            🗺️ Maps
          </button>
          <button
            onClick={() => setActiveTab('symbols')}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'symbols'
                ? 'border-b-2 border-brand-primary text-brand-primary'
                : 'text-brand-text-secondary hover:text-brand-text-primary'
            }`}
          >
            ⚜️ Symbols & Emblems
          </button>
          <button
            onClick={() => setActiveTab('environments')}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'environments'
                ? 'border-b-2 border-brand-primary text-brand-primary'
                : 'text-brand-text-secondary hover:text-brand-text-primary'
            }`}
          >
            🏛️ Environments
          </button>
          <button
            onClick={() => setActiveTab('props')}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'props'
                ? 'border-b-2 border-brand-primary text-brand-primary'
                : 'text-brand-text-secondary hover:text-brand-text-primary'
            }`}
          >
            ⚔️ Props & Vehicles
          </button>
          <button
            onClick={() => setActiveTab('knowledge')}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'knowledge'
                ? 'border-b-2 border-brand-primary text-brand-primary'
                : 'text-brand-text-secondary hover:text-brand-text-primary'
            }`}
          >
            📚 Knowledge Bibles
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Maps Tab */}
        {activeTab === 'maps' && (
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="grid xl:grid-cols-2 gap-6">
              {/* Map Creation Panel */}
              <div className="bg-brand-surface rounded-lg border border-brand-border p-6">
                <h3 className="text-lg font-semibold text-brand-text-primary mb-4">Create Map</h3>
                
                {/* Map Type Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                    Map Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {mapTypeOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setMapType(option.value)}
                        className={`px-3 py-2 text-sm rounded border transition-colors ${
                          mapType === option.value
                            ? 'bg-brand-primary text-white border-brand-primary'
                            : 'bg-brand-bg text-brand-text-primary border-brand-border hover:border-brand-primary'
                        }`}
                      >
                        {option.emoji} {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Map Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                    Map Name
                  </label>
                  <input
                    type="text"
                    value={mapName}
                    onChange={(e) => setMapName(e.target.value)}
                    placeholder="e.g., Continent of Aetheria"
                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded text-brand-text-primary placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>

                {/* Map Description */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                    Description & Features
                  </label>
                  <textarea
                    value={mapDescription}
                    onChange={(e) => setMapDescription(e.target.value)}
                    placeholder="Describe geography, landmarks, borders, terrain types..."
                    rows={4}
                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded text-brand-text-primary placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                  />
                </div>

                {/* Map Scale */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                    Scale (Optional)
                  </label>
                  <input
                    type="text"
                    value={mapScale}
                    onChange={(e) => setMapScale(e.target.value)}
                    placeholder="e.g., 1 inch = 100 miles"
                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded text-brand-text-primary placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>

                <button
                  onClick={handleGenerateMap}
                  disabled={isGenerating || !mapName || !mapDescription}
                  className="w-full px-4 py-2 bg-brand-primary text-white rounded hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                >
                  {isGenerating ? 'Generating Map...' : 'Generate Map'}
                </button>
              </div>

              {/* Maps Gallery */}
              <div className="bg-brand-surface rounded-lg border border-brand-border p-6">
                <h3 className="text-lg font-semibold text-brand-text-primary mb-4">
                  Maps ({maps.length})
                </h3>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {maps.length === 0 ? (
                    <p className="text-brand-text-secondary text-sm text-center py-8">
                      No maps created yet. Generate your first map!
                    </p>
                  ) : (
                    maps.map((map) => (
                      <div
                        key={map.id}
                        className="bg-brand-bg rounded-lg border border-brand-border p-4 hover:border-brand-primary transition-colors"
                      >
                        {map.imageUrl && (
                          <img
                            src={map.imageUrl}
                            alt={map.name}
                            className="w-full h-32 object-cover rounded mb-3"
                          />
                        )}
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-brand-text-primary">{map.name}</h4>
                          <button
                            onClick={() => onDeleteMap(map.id)}
                            className="text-red-500 hover:text-red-600 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                        <p className="text-sm text-brand-text-secondary mb-2">{map.description}</p>
                        <div className="flex gap-2 text-xs">
                          <span className="px-2 py-1 bg-brand-primary/20 text-brand-primary rounded">
                            {map.mapType}
                          </span>
                          {map.scale && (
                            <span className="px-2 py-1 bg-brand-bg border border-brand-border rounded text-brand-text-secondary">
                              {map.scale}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Symbols Tab */}
        {activeTab === 'symbols' && (
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="grid xl:grid-cols-2 gap-6">
              {/* Symbol Creation Panel */}
              <div className="bg-brand-surface rounded-lg border border-brand-border p-6">
                <h3 className="text-lg font-semibold text-brand-text-primary mb-4">Create Symbol/Emblem</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                    Symbol Name
                  </label>
                  <input
                    type="text"
                    value={symbolName}
                    onChange={(e) => setSymbolName(e.target.value)}
                    placeholder="e.g., House Stormborn Crest"
                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded text-brand-text-primary placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                    Symbol Type
                  </label>
                  <input
                    type="text"
                    value={symbolType}
                    onChange={(e) => setSymbolType(e.target.value)}
                    placeholder="e.g., faction, guild, military unit, magical house"
                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded text-brand-text-primary placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                    Faction/Organization (Optional)
                  </label>
                  <input
                    type="text"
                    value={symbolFaction}
                    onChange={(e) => setSymbolFaction(e.target.value)}
                    placeholder="e.g., Northern Alliance"
                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded text-brand-text-primary placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                    Design Description
                  </label>
                  <textarea
                    value={symbolDescription}
                    onChange={(e) => setSymbolDescription(e.target.value)}
                    placeholder="Describe the visual elements, symbolism, colors, and meaning..."
                    rows={4}
                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded text-brand-text-primary placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                  />
                </div>

                <button
                  onClick={handleGenerateSymbol}
                  disabled={isGenerating || !symbolName || !symbolDescription}
                  className="w-full px-4 py-2 bg-brand-primary text-white rounded hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                >
                  {isGenerating ? 'Generating Symbol...' : 'Generate Symbol'}
                </button>
              </div>

              {/* Symbols Gallery */}
              <div className="bg-brand-surface rounded-lg border border-brand-border p-6">
                <h3 className="text-lg font-semibold text-brand-text-primary mb-4">
                  Symbols & Emblems ({symbols.length})
                </h3>
                <div className="grid grid-cols-2 gap-3 max-h-[600px] overflow-y-auto">
                  {symbols.length === 0 ? (
                    <p className="col-span-2 text-brand-text-secondary text-sm text-center py-8">
                      No symbols created yet. Generate your first emblem!
                    </p>
                  ) : (
                    symbols.map((symbol) => (
                      <div
                        key={symbol.id}
                        className="bg-brand-bg rounded-lg border border-brand-border p-3 hover:border-brand-primary transition-colors"
                      >
                        {symbol.imageUrl && (
                          <img
                            src={symbol.imageUrl}
                            alt={symbol.name}
                            className="w-full h-24 object-contain rounded mb-2 bg-white"
                          />
                        )}
                        <h4 className="font-medium text-brand-text-primary text-sm mb-1">{symbol.name}</h4>
                        <p className="text-xs text-brand-text-secondary mb-2 line-clamp-2">{symbol.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs px-2 py-1 bg-brand-primary/20 text-brand-primary rounded">
                            {symbol.symbolType}
                          </span>
                          <button
                            onClick={() => onDeleteSymbol(symbol.id)}
                            className="text-red-500 hover:text-red-600 text-xs"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Environments Tab */}
        {activeTab === 'environments' && (
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="grid xl:grid-cols-2 gap-6">
              {/* Environment Creation Panel */}
              <div className="bg-brand-surface rounded-lg border border-brand-border p-6">
                <h3 className="text-lg font-semibold text-brand-text-primary mb-4">Create Environment</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                    Environment Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {envTypeOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setEnvType(option.value)}
                        className={`px-3 py-2 text-sm rounded border transition-colors ${
                          envType === option.value
                            ? 'bg-brand-primary text-white border-brand-primary'
                            : 'bg-brand-bg text-brand-text-primary border-brand-border hover:border-brand-primary'
                        }`}
                      >
                        {option.emoji} {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                    Environment Name
                  </label>
                  <input
                    type="text"
                    value={envName}
                    onChange={(e) => setEnvName(e.target.value)}
                    placeholder="e.g., Crystal Caverns of Lumina"
                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded text-brand-text-primary placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                    Description
                  </label>
                  <textarea
                    value={envDescription}
                    onChange={(e) => setEnvDescription(e.target.value)}
                    placeholder="Describe architecture, materials, atmosphere, lighting, cultural elements..."
                    rows={4}
                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded text-brand-text-primary placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                    Mood/Atmosphere (Optional)
                  </label>
                  <input
                    type="text"
                    value={envMood}
                    onChange={(e) => setEnvMood(e.target.value)}
                    placeholder="e.g., mysterious, serene, ominous, majestic"
                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded text-brand-text-primary placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>

                <button
                  onClick={handleGenerateEnvironment}
                  disabled={isGenerating || !envName || !envDescription}
                  className="w-full px-4 py-2 bg-brand-primary text-white rounded hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                >
                  {isGenerating ? 'Generating Environment...' : 'Generate Environment'}
                </button>
              </div>

              {/* Environments Gallery */}
              <div className="bg-brand-surface rounded-lg border border-brand-border p-6">
                <h3 className="text-lg font-semibold text-brand-text-primary mb-4">
                  Environments ({environments.length})
                </h3>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {environments.length === 0 ? (
                    <p className="text-brand-text-secondary text-sm text-center py-8">
                      No environments created yet. Design your first location!
                    </p>
                  ) : (
                    environments.map((env) => (
                      <div
                        key={env.id}
                        className="bg-brand-bg rounded-lg border border-brand-border p-4 hover:border-brand-primary transition-colors"
                      >
                        {env.imageUrl && (
                          <img
                            src={env.imageUrl}
                            alt={env.name}
                            className="w-full h-32 object-cover rounded mb-3"
                          />
                        )}
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-brand-text-primary">{env.name}</h4>
                          <button
                            onClick={() => onDeleteEnvironment(env.id)}
                            className="text-red-500 hover:text-red-600 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                        <p className="text-sm text-brand-text-secondary mb-2">{env.description}</p>
                        <div className="flex gap-2 text-xs">
                          <span className="px-2 py-1 bg-brand-primary/20 text-brand-primary rounded">
                            {env.environmentType}
                          </span>
                          {env.mood && (
                            <span className="px-2 py-1 bg-brand-bg border border-brand-border rounded text-brand-text-secondary">
                              {env.mood}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Props Tab */}
        {activeTab === 'props' && (
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="grid xl:grid-cols-2 gap-6">
              {/* Prop Creation Panel */}
              <div className="bg-brand-surface rounded-lg border border-brand-border p-6">
                <h3 className="text-lg font-semibold text-brand-text-primary mb-4">Create Prop/Vehicle</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                    Prop Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {propTypeOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setPropType(option.value)}
                        className={`px-3 py-2 text-sm rounded border transition-colors ${
                          propType === option.value
                            ? 'bg-brand-primary text-white border-brand-primary'
                            : 'bg-brand-bg text-brand-text-primary border-brand-border hover:border-brand-primary'
                        }`}
                      >
                        {option.emoji} {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                    Prop Name
                  </label>
                  <input
                    type="text"
                    value={propName}
                    onChange={(e) => setPropName(e.target.value)}
                    placeholder="e.g., Starfire Blade"
                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded text-brand-text-primary placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                    Description & Details
                  </label>
                  <textarea
                    value={propDescription}
                    onChange={(e) => setPropDescription(e.target.value)}
                    placeholder="Describe materials, features, usage, lore, and unique characteristics..."
                    rows={4}
                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded text-brand-text-primary placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                    Scale/Size (Optional)
                  </label>
                  <input
                    type="text"
                    value={propScale}
                    onChange={(e) => setPropScale(e.target.value)}
                    placeholder="e.g., 3 feet long, medium sized, massive"
                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded text-brand-text-primary placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>

                <button
                  onClick={handleGenerateProp}
                  disabled={isGenerating || !propName || !propDescription}
                  className="w-full px-4 py-2 bg-brand-primary text-white rounded hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                >
                  {isGenerating ? 'Generating Prop...' : 'Generate Prop'}
                </button>
              </div>

              {/* Props Gallery */}
              <div className="bg-brand-surface rounded-lg border border-brand-border p-6">
                <h3 className="text-lg font-semibold text-brand-text-primary mb-4">
                  Props & Vehicles ({props.length})
                </h3>
                <div className="grid grid-cols-2 gap-3 max-h-[600px] overflow-y-auto">
                  {props.length === 0 ? (
                    <p className="col-span-2 text-brand-text-secondary text-sm text-center py-8">
                      No props created yet. Design your first item!
                    </p>
                  ) : (
                    props.map((prop) => (
                      <div
                        key={prop.id}
                        className="bg-brand-bg rounded-lg border border-brand-border p-3 hover:border-brand-primary transition-colors"
                      >
                        {prop.imageUrl && (
                          <img
                            src={prop.imageUrl}
                            alt={prop.name}
                            className="w-full h-24 object-contain rounded mb-2 bg-white"
                          />
                        )}
                        <h4 className="font-medium text-brand-text-primary text-sm mb-1">{prop.name}</h4>
                        <p className="text-xs text-brand-text-secondary mb-2 line-clamp-2">{prop.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs px-2 py-1 bg-brand-primary/20 text-brand-primary rounded">
                            {prop.propType}
                          </span>
                          <button
                            onClick={() => onDeleteProp(prop.id)}
                            className="text-red-500 hover:text-red-600 text-xs"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Knowledge/Context Bibles Tab */}
        {activeTab === 'knowledge' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-brand-surface rounded-lg border border-brand-border p-6 space-y-4">
              <h3 className="text-lg font-semibold text-brand-text-primary">
                Unified Knowledge / Context Bibles
              </h3>
              <p className="text-sm text-brand-text-secondary">
                Upload manuscripts, research, style guides, licensing docs, or lore once. The Knowledge Agent will
                auto-extract structured bibles (series canon, research facts, tone rules, IP constraints, etc.) used
                across editing, worldbuilding, QC, and compliance.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Bible Type */}
                <div>
                  <label className="block text-xs font-medium text-brand-text-secondary mb-1">
                    Bible Type
                  </label>
                  <select
                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded text-sm text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    defaultValue="series"
                  >
                    <option value="series">Series / Story Canon</option>
                    <option value="research">Research / Reference</option>
                    <option value="styleTone">Style / Tone Guide</option>
                    <option value="canon">Universe Canon / Franchise Bible</option>
                    <option value="licensingIP">Licensing / IP Rules</option>
                    <option value="custom">Custom Knowledge Set</option>
                  </select>
                </div>

                {/* Label */}
                <div>
                  <label className="block text-xs font-medium text-brand-text-secondary mb-1">
                    Bible Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 'Saga of Aetheria Series Bible' or 'Sci-Fi Weapons Research'"
                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded text-sm text-brand-text-primary placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-brand-text-secondary mb-1">
                    Series ID (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Link to a series/project key if applicable"
                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded text-xs text-brand-text-primary placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-text-secondary mb-1">
                    Book ID (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Use for book-specific intake (e.g., Book 1)"
                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded text-xs text-brand-text-primary placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-text-secondary mb-1">
                    Project / Brand ID (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="For brand-wide style or IP guides"
                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded text-xs text-brand-text-primary placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
              </div>

              {/* Upload + Paste */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-brand-text-secondary mb-1">
                    Upload Source Files
                  </label>
                  <div className="border-2 border-dashed border-brand-border rounded-md p-3 text-xs text-brand-text-secondary bg-brand-bg">
                    <p className="mb-2">
                      Drop PDFs/DOCX/TXT/MD here or click to browse. These will be ingested by the Knowledge Agent
                      to build or update the selected bible.
                    </p>
                    <input
                      type="file"
                      multiple
                      className="w-full text-xs text-brand-text-secondary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-text-secondary mb-1">
                    Or Paste Raw Text / Excerpts
                  </label>
                  <textarea
                    rows={6}
                    placeholder="Paste chapters, notes, style rules, contracts, or reference passages here..."
                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded text-xs text-brand-text-primary placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={isGenerating || !onUploadKnowledgeSource}
                className="w-full md:w-auto px-5 py-2 bg-brand-primary text-white text-sm font-semibold rounded hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isGenerating
                  ? 'Processing with Knowledge Agent...'
                  : 'Create / Update Knowledge Bible with AI Agent'}
              </button>

              {!onUploadKnowledgeSource && (
                <p className="text-[10px] text-red-400 mt-2">
                  Note for developers: wire onUploadKnowledgeSource to backend extraction endpoint
                  (e.g., POST /knowledge-bibles/extract) so this intake triggers structured bible creation.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};