import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  VoiceTalent,
  AIVoiceModel,
  HybridPerformanceConfig,
  ContractType,
  VoiceGender,
  VoiceAge,
  VoiceStyle,
  EmotionalProsody
} from '../types';

interface VoiceTalentViewProps {
  onClose: () => void;
}

type TabType = 'human' | 'ai' | 'hybrid';

const VoiceTalentView: React.FC<VoiceTalentViewProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('human');
  const [humanTalents, setHumanTalents] = useState<VoiceTalent[]>(getMockHumanTalents());
  const [aiVoiceModels, setAiVoiceModels] = useState<AIVoiceModel[]>(getMockAIVoiceModels());
  const [hybridConfigs, setHybridConfigs] = useState<HybridPerformanceConfig[]>([]);
  const [selectedTalentId, setSelectedTalentId] = useState<string | null>(null);
  const [selectedAIModelId, setSelectedAIModelId] = useState<string | null>(null);
  const [selectedHybridId, setSelectedHybridId] = useState<string | null>(null);

  // Human Talent Management
  const addHumanTalent = () => {
    const newTalent: VoiceTalent = {
      id: uuidv4(),
      name: 'New Narrator',
      type: 'human',
      gender: 'neutral',
      ageRange: 'middle-aged',
      voiceStyle: 'warm',
      genres: [],
      genreSpecialties: [],
      voiceCharacteristics: {
        tone: 'warm',
        clarity: 7,
        emotionalRange: 7
      },
      demoReelUrl: '',
      rating: 0,
      reviewCount: 0,
      hourlyRate: 0,
      experienceYears: 0,
      contractType: 'flat-rate',
      availability: 'available',
      languagesCovered: ['English'],
      accentVariants: []
    };
    setHumanTalents([...humanTalents, newTalent]);
    setSelectedTalentId(newTalent.id);
  };

  const updateHumanTalent = (id: string, updates: Partial<VoiceTalent>) => {
    setHumanTalents(humanTalents.map(t => 
      t.id === id ? { ...t, ...updates } : t
    ));
  };

  const deleteHumanTalent = (id: string) => {
    setHumanTalents(humanTalents.filter(t => t.id !== id));
    if (selectedTalentId === id) setSelectedTalentId(null);
  };

  // AI Voice Model Management
  const addAIVoiceModel = () => {
    const newModel: AIVoiceModel = {
      id: uuidv4(),
      name: 'Custom AI Voice',
      modelName: 'Custom AI Voice',
      provider: 'elevenlabs',
      modelId: '',
      voiceId: '',
      voiceType: 'storyteller',
      gender: 'neutral',
      ageRange: 'middle-aged',
      voiceStyle: 'neutral',
      emotionalProsodySupport: true,
      emotionalRange: ['happiness', 'sadness', 'anger', 'fear', 'excitement', 'calmness'],
      prosodyControls: {
        pitch: 1.0,
        speed: 1.0,
        stability: 0.5,
        clarity: 0.75,
        style: 0.0
      },
      costPerThousandChars: 0,
      languagesSupported: ['English']
    };
    setAiVoiceModels([...aiVoiceModels, newModel]);
    setSelectedAIModelId(newModel.id);
  };

  const updateAIVoiceModel = (id: string, updates: Partial<AIVoiceModel>) => {
    setAiVoiceModels(aiVoiceModels.map(m => 
      m.id === id ? { ...m, ...updates } : m
    ));
  };

  const deleteAIVoiceModel = (id: string) => {
    setAiVoiceModels(aiVoiceModels.filter(m => m.id !== id));
    if (selectedAIModelId === id) setSelectedAIModelId(null);
  };

  // Hybrid Configuration Management
  const addHybridConfig = () => {
    const newConfig: HybridPerformanceConfig = {
      id: uuidv4(),
      name: 'New Hybrid Configuration',
      narratorVoice: humanTalents[0] || aiVoiceModels[0],
      characterVoiceAssignments: [],
      useAIForNarration: false,
      useAIForDialogue: false,
      blendingStyle: 'distinct',
      totalEstimatedCost: 0
    };
    setHybridConfigs([...hybridConfigs, newConfig]);
    setSelectedHybridId(newConfig.id);
  };

  const updateHybridConfig = (id: string, updates: Partial<HybridPerformanceConfig>) => {
    setHybridConfigs(hybridConfigs.map(c => 
      c.id === id ? { ...c, ...updates } : c
    ));
  };

  const deleteHybridConfig = (id: string) => {
    setHybridConfigs(hybridConfigs.filter(c => c.id !== id));
    if (selectedHybridId === id) setSelectedHybridId(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Voice Talent System</h2>
            <p className="text-gray-400 text-sm">Human Narrators • AI Voices • Hybrid Performance</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-700 px-6">
          <button
            onClick={() => setActiveTab('human')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'human'
                ? 'text-blue-400 border-blue-400'
                : 'text-gray-400 border-transparent hover:text-gray-300'
            }`}
          >
            Human Narrators
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'ai'
                ? 'text-blue-400 border-blue-400'
                : 'text-gray-400 border-transparent hover:text-gray-300'
            }`}
          >
            AI Voice Models
          </button>
          <button
            onClick={() => setActiveTab('hybrid')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'hybrid'
                ? 'text-blue-400 border-blue-400'
                : 'text-gray-400 border-transparent hover:text-gray-300'
            }`}
          >
            Hybrid Performance
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'human' && (
            <HumanNarratorsTab
              talents={humanTalents}
              selectedTalentId={selectedTalentId}
              onSelectTalent={setSelectedTalentId}
              onAddTalent={addHumanTalent}
              onUpdateTalent={updateHumanTalent}
              onDeleteTalent={deleteHumanTalent}
            />
          )}
          {activeTab === 'ai' && (
            <AIVoiceModelsTab
              models={aiVoiceModels}
              selectedModelId={selectedAIModelId}
              onSelectModel={setSelectedAIModelId}
              onAddModel={addAIVoiceModel}
              onUpdateModel={updateAIVoiceModel}
              onDeleteModel={deleteAIVoiceModel}
            />
          )}
          {activeTab === 'hybrid' && (
            <HybridPerformanceTab
              configs={hybridConfigs}
              selectedConfigId={selectedHybridId}
              onSelectConfig={setSelectedHybridId}
              onAddConfig={addHybridConfig}
              onUpdateConfig={updateHybridConfig}
              onDeleteConfig={deleteHybridConfig}
              humanTalents={humanTalents}
              aiVoiceModels={aiVoiceModels}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Human Narrators Tab Component
interface HumanNarratorsTabProps {
  talents: VoiceTalent[];
  selectedTalentId: string | null;
  onSelectTalent: (id: string | null) => void;
  onAddTalent: () => void;
  onUpdateTalent: (id: string, updates: Partial<VoiceTalent>) => void;
  onDeleteTalent: (id: string) => void;
}

const HumanNarratorsTab: React.FC<HumanNarratorsTabProps> = ({
  talents,
  selectedTalentId,
  onSelectTalent,
  onAddTalent,
  onUpdateTalent,
  onDeleteTalent
}) => {
  const selectedTalent = talents.find(t => t.id === selectedTalentId);
  const [filterGenre, setFilterGenre] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'rate' | 'experience'>('rating');

  const filteredTalents = talents
    .filter(t => filterGenre === 'all' || t.genreSpecialties.includes(filterGenre))
    .sort((a, b) => {
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'rate') return (a.hourlyRate || 0) - (b.hourlyRate || 0);
      return (b.experienceYears || 0) - (a.experienceYears || 0);
    });

  return (
    <div className="grid grid-cols-3 gap-6 h-full p-6">
      {/* Talent Library */}
      <div className="col-span-1 flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Narrator Library</h3>
          <button
            onClick={onAddTalent}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm font-medium transition-colors"
          >
            + Add Narrator
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={filterGenre}
            onChange={(e) => setFilterGenre(e.target.value)}
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
          >
            <option value="all">All Genres</option>
            <option value="Fantasy">Fantasy</option>
            <option value="Sci-Fi">Sci-Fi</option>
            <option value="Romance">Romance</option>
            <option value="Thriller">Thriller</option>
            <option value="Non-Fiction">Non-Fiction</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
          >
            <option value="rating">By Rating</option>
            <option value="rate">By Rate</option>
            <option value="experience">By Experience</option>
          </select>
        </div>

        {/* Talent List */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {filteredTalents.map(talent => (
            <div
              key={talent.id}
              onClick={() => onSelectTalent(talent.id)}
              className={`p-4 rounded-lg cursor-pointer transition-colors ${
                selectedTalentId === talent.id
                  ? 'bg-blue-600/20 border border-blue-500'
                  : 'bg-gray-800 border border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium text-white">{talent.name}</h4>
                  <p className="text-xs text-gray-400 capitalize">
                    {talent.gender} • {talent.ageRange} • {talent.voiceStyle}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-sm text-white">{talent.rating.toFixed(1)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">{talent.contractType}</span>
                <span className="text-green-400 font-medium">${talent.hourlyRate}/hr</span>
              </div>
              {talent.genreSpecialties.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {talent.genreSpecialties.slice(0, 2).map(genre => (
                    <span key={genre} className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded">
                      {genre}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Talent Details */}
      <div className="col-span-2 bg-gray-800/50 rounded-lg p-6 overflow-y-auto">
        {selectedTalent ? (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{selectedTalent.name}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="capitalize">{selectedTalent.gender}</span>
                  <span>•</span>
                  <span className="capitalize">{selectedTalent.ageRange}</span>
                  <span>•</span>
                  <span className="capitalize">{selectedTalent.voiceStyle}</span>
                  <span>•</span>
                  <span>{selectedTalent.experienceYears} years</span>
                </div>
              </div>
              <button
                onClick={() => onDeleteTalent(selectedTalent.id)}
                className="p-2 hover:bg-red-600/20 rounded text-red-400"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            {/* Demo Reel */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Demo Reel URL</label>
              <input
                type="text"
                value={selectedTalent.demoReelUrl}
                onChange={(e) => onUpdateTalent(selectedTalent.id, { demoReelUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
              {selectedTalent.demoReelUrl && (
                <button className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm font-medium">
                  ▶ Play Demo Reel
                </button>
              )}
            </div>

            {/* Voice Characteristics */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Gender</label>
                <select
                  value={selectedTalent.gender}
                  onChange={(e) => onUpdateTalent(selectedTalent.id, { gender: e.target.value as VoiceGender })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="neutral">Neutral</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Age Range</label>
                <select
                  value={selectedTalent.ageRange}
                  onChange={(e) => onUpdateTalent(selectedTalent.id, { ageRange: e.target.value as VoiceAge })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                >
                  <option value="young">Young</option>
                  <option value="middle-aged">Middle-Aged</option>
                  <option value="mature">Mature</option>
                  <option value="senior">Senior</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Voice Style</label>
                <select
                  value={selectedTalent.voiceStyle}
                  onChange={(e) => onUpdateTalent(selectedTalent.id, { voiceStyle: e.target.value as VoiceStyle })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                >
                  <option value="warm">Warm</option>
                  <option value="neutral">Neutral</option>
                  <option value="dark">Dark</option>
                  <option value="bright">Bright</option>
                  <option value="dramatic">Dramatic</option>
                  <option value="documentary">Documentary</option>
                  <option value="energetic">Energetic</option>
                  <option value="sultry">Sultry</option>
                  <option value="authoritative">Authoritative</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Availability</label>
                <select
                  value={selectedTalent.availability}
                  onChange={(e) => onUpdateTalent(selectedTalent.id, { availability: e.target.value as any })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                >
                  <option value="available">Available</option>
                  <option value="booked">Booked</option>
                  <option value="limited">Limited Availability</option>
                </select>
              </div>
            </div>

            {/* Contract & Pricing */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">Contract & Pricing</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Contract Type</label>
                  <select
                    value={selectedTalent.contractType}
                    onChange={(e) => onUpdateTalent(selectedTalent.id, { contractType: e.target.value as ContractType })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  >
                    <option value="flat-rate">Flat Rate</option>
                    <option value="hourly">Hourly Rate</option>
                    <option value="revenue-share">Revenue Share</option>
                    <option value="royalty-share">Royalty Share</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {selectedTalent.contractType === 'revenue-share' || selectedTalent.contractType === 'royalty-share'
                      ? 'Percentage (%)'
                      : 'Rate ($/hr)'}
                  </label>
                  <input
                    type="number"
                    value={selectedTalent.hourlyRate}
                    onChange={(e) => onUpdateTalent(selectedTalent.id, { hourlyRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
              </div>
            </div>

            {/* Rating & Reviews */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">Average Rating</div>
                <div className="text-2xl font-bold text-white flex items-center gap-2">
                  {selectedTalent.rating.toFixed(1)}
                  <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div className="text-xs text-gray-400 mt-1">{selectedTalent.reviewCount} reviews</div>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">Experience</div>
                <div className="text-2xl font-bold text-white">{selectedTalent.experienceYears} years</div>
                <div className="text-xs text-gray-400 mt-1">Professional narration</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Select a narrator to view details
          </div>
        )}
      </div>
    </div>
  );
};

// AI Voice Models Tab Component
interface AIVoiceModelsTabProps {
  models: AIVoiceModel[];
  selectedModelId: string | null;
  onSelectModel: (id: string | null) => void;
  onAddModel: () => void;
  onUpdateModel: (id: string, updates: Partial<AIVoiceModel>) => void;
  onDeleteModel: (id: string) => void;
}

const AIVoiceModelsTab: React.FC<AIVoiceModelsTabProps> = ({
  models,
  selectedModelId,
  onSelectModel,
  onAddModel,
  onUpdateModel,
  onDeleteModel
}) => {
  const selectedModel = models.find(m => m.id === selectedModelId);

  return (
    <div className="grid grid-cols-3 gap-6 h-full p-6">
      {/* Model Library */}
      <div className="col-span-1 flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">AI Voice Library</h3>
          <button
            onClick={onAddModel}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm font-medium transition-colors"
          >
            + Add Voice
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {models.map(model => (
            <div
              key={model.id}
              onClick={() => onSelectModel(model.id)}
              className={`p-4 rounded-lg cursor-pointer transition-colors ${
                selectedModelId === model.id
                  ? 'bg-blue-600/20 border border-blue-500'
                  : 'bg-gray-800 border border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium text-white">{model.modelName}</h4>
                  <p className="text-xs text-gray-400">{model.provider}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 capitalize">{model.voiceStyle}</span>
                <span className="text-green-400 font-medium">${model.costPerThousandChars}/1K chars</span>
              </div>
              <div className="mt-2 text-xs text-gray-400 capitalize">
                {model.gender} • {model.ageRange}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Model Details & Prosody Controls */}
      <div className="col-span-2 bg-gray-800/50 rounded-lg p-6 overflow-y-auto">
        {selectedModel ? (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{selectedModel.modelName}</h3>
                <p className="text-gray-400">{selectedModel.provider} • Voice ID: {selectedModel.voiceId || 'Not set'}</p>
              </div>
              <button
                onClick={() => onDeleteModel(selectedModel.id)}
                className="p-2 hover:bg-red-600/20 rounded text-red-400"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            {/* Basic Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Model Name</label>
                <input
                  type="text"
                  value={selectedModel.modelName}
                  onChange={(e) => onUpdateModel(selectedModel.id, { modelName: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Voice ID</label>
                <input
                  type="text"
                  value={selectedModel.voiceId}
                  onChange={(e) => onUpdateModel(selectedModel.id, { voiceId: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Provider</label>
                <select
                  value={selectedModel.provider}
                  onChange={(e) => onUpdateModel(selectedModel.id, { provider: e.target.value as any })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                >
                  <option value="elevenlabs">ElevenLabs</option>
                  <option value="google">Google Cloud TTS</option>
                  <option value="azure">Azure Speech</option>
                  <option value="aws">Amazon Polly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Cost per 1K Characters</label>
                <input
                  type="number"
                  step="0.01"
                  value={selectedModel.costPerThousandChars}
                  onChange={(e) => onUpdateModel(selectedModel.id, { costPerThousandChars: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
            </div>

            {/* Voice Characteristics */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">Voice Characteristics</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Gender</label>
                  <select
                    value={selectedModel.gender}
                    onChange={(e) => onUpdateModel(selectedModel.id, { gender: e.target.value as VoiceGender })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="neutral">Neutral</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Age Range</label>
                  <select
                    value={selectedModel.ageRange}
                    onChange={(e) => onUpdateModel(selectedModel.id, { ageRange: e.target.value as VoiceAge })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  >
                    <option value="young">Young</option>
                    <option value="middle-aged">Middle-Aged</option>
                    <option value="mature">Mature</option>
                    <option value="senior">Senior</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Voice Style</label>
                  <select
                    value={selectedModel.voiceStyle}
                    onChange={(e) => onUpdateModel(selectedModel.id, { voiceStyle: e.target.value as VoiceStyle })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  >
                    <option value="warm">Warm</option>
                    <option value="neutral">Neutral</option>
                    <option value="dark">Dark</option>
                    <option value="bright">Bright</option>
                    <option value="dramatic">Dramatic</option>
                    <option value="documentary">Documentary</option>
                    <option value="energetic">Energetic</option>
                    <option value="sultry">Sultry</option>
                    <option value="authoritative">Authoritative</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Emotional Prosody Controls */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">Emotional Prosody Controls</h4>
              <div className="space-y-4">
                {/* Pitch */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-300">Pitch</label>
                    <span className="text-sm text-gray-400">{selectedModel.prosodyControls.pitch.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.01"
                    value={selectedModel.prosodyControls.pitch}
                    onChange={(e) => onUpdateModel(selectedModel.id, {
                      prosodyControls: { ...selectedModel.prosodyControls, pitch: parseFloat(e.target.value) }
                    })}
                    className="w-full"
                  />
                </div>

                {/* Speed */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-300">Speed</label>
                    <span className="text-sm text-gray-400">{selectedModel.prosodyControls.speed.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.01"
                    value={selectedModel.prosodyControls.speed}
                    onChange={(e) => onUpdateModel(selectedModel.id, {
                      prosodyControls: { ...selectedModel.prosodyControls, speed: parseFloat(e.target.value) }
                    })}
                    className="w-full"
                  />
                </div>

                {/* Stability */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-300">Stability</label>
                    <span className="text-sm text-gray-400">{selectedModel.prosodyControls.stability.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={selectedModel.prosodyControls.stability}
                    onChange={(e) => onUpdateModel(selectedModel.id, {
                      prosodyControls: { ...selectedModel.prosodyControls, stability: parseFloat(e.target.value) }
                    })}
                    className="w-full"
                  />
                </div>

                {/* Clarity */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-300">Clarity</label>
                    <span className="text-sm text-gray-400">{selectedModel.prosodyControls.clarity.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={selectedModel.prosodyControls.clarity}
                    onChange={(e) => onUpdateModel(selectedModel.id, {
                      prosodyControls: { ...selectedModel.prosodyControls, clarity: parseFloat(e.target.value) }
                    })}
                    className="w-full"
                  />
                </div>

                {/* Style Exaggeration */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-300">Style Exaggeration</label>
                    <span className="text-sm text-gray-400">{selectedModel.prosodyControls.style?.toFixed(2) || '0.00'}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={selectedModel.prosodyControls.style || 0}
                    onChange={(e) => onUpdateModel(selectedModel.id, {
                      prosodyControls: { ...selectedModel.prosodyControls, style: parseFloat(e.target.value) }
                    })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Preview Button */}
            <button className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors">
              🎤 Preview AI Voice with Current Settings
            </button>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Select an AI voice model to view details
          </div>
        )}
      </div>
    </div>
  );
};

// Hybrid Performance Tab Component
interface HybridPerformanceTabProps {
  configs: HybridPerformanceConfig[];
  selectedConfigId: string | null;
  onSelectConfig: (id: string | null) => void;
  onAddConfig: () => void;
  onUpdateConfig: (id: string, updates: Partial<HybridPerformanceConfig>) => void;
  onDeleteConfig: (id: string) => void;
  humanTalents: VoiceTalent[];
  aiVoiceModels: AIVoiceModel[];
}

const HybridPerformanceTab: React.FC<HybridPerformanceTabProps> = ({
  configs,
  selectedConfigId,
  onSelectConfig,
  onAddConfig,
  onUpdateConfig,
  onDeleteConfig,
  humanTalents,
  aiVoiceModels
}) => {
  const selectedConfig = configs.find(c => c.id === selectedConfigId);

  const addCharacterVoice = (configId: string) => {
    const config = configs.find(c => c.id === configId);
    if (!config) return;

    const newAssignment: any = {
      characterName: 'New Character',
      voiceType: 'human',
      voiceId: ''
    };

    onUpdateConfig(configId, {
      characterVoiceAssignments: [...config.characterVoiceAssignments, newAssignment]
    });
  };

  const updateCharacterVoice = (configId: string, index: number, updates: any) => {
    const config = configs.find(c => c.id === configId);
    if (!config) return;

    const updatedAssignments = [...config.characterVoiceAssignments];
    updatedAssignments[index] = { ...updatedAssignments[index], ...updates };

    onUpdateConfig(configId, { characterVoiceAssignments: updatedAssignments });
  };

  const removeCharacterVoice = (configId: string, index: number) => {
    const config = configs.find(c => c.id === configId);
    if (!config) return;

    onUpdateConfig(configId, {
      characterVoiceAssignments: config.characterVoiceAssignments.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="grid grid-cols-3 gap-6 h-full p-6">
      {/* Config Library */}
      <div className="col-span-1 flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Hybrid Configs</h3>
          <button
            onClick={onAddConfig}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm font-medium transition-colors"
          >
            + New Config
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {configs.map((config, index) => (
            <div
              key={config.id}
              onClick={() => onSelectConfig(config.id)}
              className={`p-4 rounded-lg cursor-pointer transition-colors ${
                selectedConfigId === config.id
                  ? 'bg-blue-600/20 border border-blue-500'
                  : 'bg-gray-800 border border-gray-700 hover:border-gray-600'
              }`}
            >
              <h4 className="font-medium text-white mb-2">Configuration {index + 1}</h4>
              <div className="text-xs space-y-1">
                <div className="text-gray-400">
                  Narrator: {config.useAIForNarration ? 'AI Voice' : 'Human Voice'}
                </div>
                <div className="text-gray-400">
                  Characters: {config.characterVoiceAssignments.length} assigned
                </div>
                <div className="text-green-400 font-medium">
                  Est. ${config.totalEstimatedCost.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
          {configs.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No hybrid configurations yet
            </div>
          )}
        </div>
      </div>

      {/* Config Details */}
      <div className="col-span-2 bg-gray-800/50 rounded-lg p-6 overflow-y-auto">
        {selectedConfig ? (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Hybrid Performance Setup</h3>
                <p className="text-gray-400">Configure narrator and character voice assignments</p>
              </div>
              <button
                onClick={() => onDeleteConfig(selectedConfig.id)}
                className="p-2 hover:bg-red-600/20 rounded text-red-400"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            {/* Narrator Selection */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">Narrator Voice (Prose)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Voice Type</label>
                  <select
                    value={selectedConfig.useAIForNarration ? 'ai' : 'human'}
                    onChange={(e) => onUpdateConfig(selectedConfig.id, { useAIForNarration: e.target.value === 'ai' })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  >
                    <option value="human">Human Narrator</option>
                    <option value="ai">AI Voice</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Select Voice</label>
                  <select
                    value={typeof selectedConfig.narratorVoice === 'object' && selectedConfig.narratorVoice ? selectedConfig.narratorVoice.id : ''}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      if (!selectedId) {
                        onUpdateConfig(selectedConfig.id, { narratorVoice: humanTalents[0] || aiVoiceModels[0] });
                        return;
                      }
                      const voice = selectedConfig.useAIForNarration
                        ? aiVoiceModels.find(m => m.id === selectedId)
                        : humanTalents.find(t => t.id === selectedId);
                      if (voice) {
                        onUpdateConfig(selectedConfig.id, { narratorVoice: voice });
                      }
                    }}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  >
                    <option value="">-- Select --</option>
                    {selectedConfig.useAIForNarration ? (
                      aiVoiceModels.map(model => (
                        <option key={model.id} value={model.id}>{model.modelName}</option>
                      ))
                    ) : (
                      humanTalents.map(talent => (
                        <option key={talent.id} value={talent.id}>{talent.name}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Character Voice Assignments */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-white">Character Voices (Dialogue)</h4>
                <button
                  onClick={() => addCharacterVoice(selectedConfig.id)}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-white text-sm font-medium transition-colors"
                >
                  + Add Character
                </button>
              </div>

              <div className="space-y-3">
                {selectedConfig.characterVoiceAssignments.map((assignment, index) => (
                  <div key={index} className="bg-gray-700/50 p-4 rounded-lg">
                    <div className="grid grid-cols-3 gap-3 items-end">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Character Name</label>
                        <input
                          type="text"
                          value={assignment.characterName}
                          onChange={(e) => updateCharacterVoice(selectedConfig.id, index, { characterName: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Voice Type</label>
                        <select
                          value={assignment.voiceType}
                          onChange={(e) => updateCharacterVoice(selectedConfig.id, index, {
                            voiceType: e.target.value as 'human' | 'ai',
                            voiceId: ''
                          })}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
                        >
                          <option value="human">Human Actor</option>
                          <option value="ai">AI Voice</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <select
                          value={assignment.voiceId || ''}
                          onChange={(e) => updateCharacterVoice(selectedConfig.id, index, { voiceId: e.target.value || '' })}
                          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
                        >
                          <option value="">-- Select Voice --</option>
                          {assignment.voiceType === 'ai' ? (
                            aiVoiceModels.map(model => (
                              <option key={model.id} value={model.id}>{model.modelName}</option>
                            ))
                          ) : (
                            humanTalents.map(talent => (
                              <option key={talent.id} value={talent.id}>{talent.name}</option>
                            ))
                          )}
                        </select>
                        <button
                          onClick={() => removeCharacterVoice(selectedConfig.id, index)}
                          className="p-2 hover:bg-red-600/20 rounded text-red-400"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {selectedConfig.characterVoiceAssignments.length === 0 && (
                  <div className="text-center text-gray-500 py-8 border border-dashed border-gray-700 rounded-lg">
                    No character voices assigned yet
                  </div>
                )}
              </div>
            </div>

            {/* Blending Style */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">Audio Blending Style</h4>
              <select
                value={selectedConfig.blendingStyle}
                onChange={(e) => onUpdateConfig(selectedConfig.id, { blendingStyle: e.target.value as any })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value="distinct">Distinct (Clear separation between narrator and characters)</option>
                <option value="seamless">Seamless (Smooth transitions, natural flow)</option>
                <option value="cinematic">Cinematic (Theatrical, full sound design)</option>
              </select>
            </div>

            {/* Cost Estimate */}
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Total Estimated Cost</div>
                  <div className="text-2xl font-bold text-green-400">${selectedConfig.totalEstimatedCost.toFixed(2)}</div>
                </div>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm font-medium">
                  Recalculate Cost
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Create a hybrid configuration to get started
          </div>
        )}
      </div>
    </div>
  );
};

// Mock Data Generators
function getMockHumanTalents(): VoiceTalent[] {
  return [
    {
      id: uuidv4(),
      name: 'Sarah Chen',
      type: 'human',
      gender: 'female',
      ageRange: 'middle-aged',
      voiceStyle: 'warm',
      genres: ['Fantasy', 'Romance', 'YA Fiction'],
      genreSpecialties: ['Fantasy', 'Romance', 'YA Fiction'],
      voiceCharacteristics: {
        tone: 'warm',
        clarity: 9,
        emotionalRange: 9
      },
      demoReelUrl: 'https://example.com/demo-sarah',
      rating: 4.9,
      reviewCount: 127,
      hourlyRate: 350,
      experienceYears: 8,
      contractType: 'hourly',
      availability: 'available',
      languagesCovered: ['English', 'Mandarin'],
      accentVariants: ['Standard American', 'British RP']
    },
    {
      id: uuidv4(),
      name: 'Marcus Webb',
      type: 'human',
      gender: 'male',
      ageRange: 'mature',
      voiceStyle: 'authoritative',
      genres: ['Thriller', 'Non-Fiction', 'Sci-Fi'],
      genreSpecialties: ['Thriller', 'Non-Fiction', 'Sci-Fi'],
      voiceCharacteristics: {
        tone: 'documentary',
        clarity: 9,
        emotionalRange: 8
      },
      demoReelUrl: 'https://example.com/demo-marcus',
      rating: 4.8,
      reviewCount: 93,
      hourlyRate: 400,
      experienceYears: 12,
      contractType: 'hourly',
      availability: 'limited',
      languagesCovered: ['English'],
      accentVariants: ['Standard American', 'Southern']
    },
    {
      id: uuidv4(),
      name: 'Priya Kapoor',
      type: 'human',
      gender: 'female',
      ageRange: 'young',
      voiceStyle: 'bright',
      genres: ['YA Fiction', 'Contemporary', 'Mystery'],
      genreSpecialties: ['YA Fiction', 'Contemporary', 'Mystery'],
      voiceCharacteristics: {
        tone: 'bright',
        clarity: 8,
        emotionalRange: 8
      },
      demoReelUrl: 'https://example.com/demo-priya',
      rating: 4.7,
      reviewCount: 68,
      hourlyRate: 300,
      experienceYears: 5,
      contractType: 'flat-rate',
      availability: 'available',
      languagesCovered: ['English', 'Hindi'],
      accentVariants: ['Standard American', 'British']
    }
  ];
}

function getMockAIVoiceModels(): AIVoiceModel[] {
  return [
    {
      id: uuidv4(),
      name: 'Warm Storyteller',
      modelName: 'Warm Storyteller',
      provider: 'elevenlabs',
      modelId: 'eleven_multilingual_v2',
      voiceId: 'rachel-us',
      voiceType: 'storyteller',
      gender: 'female',
      ageRange: 'middle-aged',
      voiceStyle: 'warm',
      emotionalProsodySupport: true,
      emotionalRange: ['happiness', 'sadness', 'anger', 'fear', 'excitement', 'calmness'],
      prosodyControls: {
        pitch: 1.0,
        speed: 1.0,
        stability: 0.7,
        clarity: 0.8,
        style: 0.3
      },
      costPerThousandChars: 0.30,
      languagesSupported: ['English']
    },
    {
      id: uuidv4(),
      name: 'Documentary Narrator',
      modelName: 'Documentary Narrator',
      provider: 'google',
      modelId: 'neural2',
      voiceId: 'en-US-Neural2-D',
      voiceType: 'documentary',
      gender: 'male',
      ageRange: 'mature',
      voiceStyle: 'authoritative',
      emotionalProsodySupport: true,
      emotionalRange: ['happiness', 'sadness', 'excitement', 'calmness'],
      prosodyControls: {
        pitch: 0.9,
        speed: 1.0,
        stability: 0.85,
        clarity: 0.9,
        style: 0.0
      },
      costPerThousandChars: 0.16,
      languagesSupported: ['English']
    },
    {
      id: uuidv4(),
      name: 'Dark Dramatic',
      modelName: 'Dark Dramatic',
      provider: 'elevenlabs',
      modelId: 'eleven_multilingual_v2',
      voiceId: 'antoni-dark',
      voiceType: 'dramatic',
      gender: 'male',
      ageRange: 'mature',
      voiceStyle: 'dramatic',
      emotionalProsodySupport: true,
      emotionalRange: ['sadness', 'anger', 'fear'],
      prosodyControls: {
        pitch: 0.85,
        speed: 0.95,
        stability: 0.6,
        clarity: 0.75,
        style: 0.5
      },
      costPerThousandChars: 0.30,
      languagesSupported: ['English']
    }
  ];
}

export default VoiceTalentView;