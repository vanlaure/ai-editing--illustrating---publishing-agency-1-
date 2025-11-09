import React, { useState, useEffect } from 'react';
import type { SceneIllustration, ColorPalette } from '../types';
import { PlusIcon, Loader2Icon, Trash2Icon } from './icons/IconDefs';

interface SceneManagementViewProps {
  scenes: SceneIllustration[];
  palettes: ColorPalette[];
  onGenerateScene: (
    sceneType: SceneIllustration['sceneType'],
    title: string,
    description: string,
    paletteId?: string
  ) => Promise<void>;
  onDeleteScene: (sceneId: string) => void;
  isGenerating: boolean;
  seedSceneTitle?: string;
  seedSceneDescription?: string;
  seedPaletteId?: string;
  seedSceneType?: SceneIllustration['sceneType'];
}

export const SceneManagementView: React.FC<SceneManagementViewProps> = ({
  scenes,
  palettes,
  onGenerateScene,
  onDeleteScene,
  isGenerating,
  seedSceneTitle,
  seedSceneDescription,
  seedPaletteId,
  seedSceneType
}) => {
  const [activeTab, setActiveTab] = useState<'all' | SceneIllustration['sceneType']>('all');
  const [sceneTitle, setSceneTitle] = useState('');
  const [sceneDescription, setSceneDescription] = useState('');
  const [selectedPalette, setSelectedPalette] = useState<string>('');
  const [selectedSceneType, setSelectedSceneType] = useState<SceneIllustration['sceneType']>('key-moment');

  useEffect(() => {
    if (seedSceneTitle !== undefined) {
      setSceneTitle(seedSceneTitle);
    }
  }, [seedSceneTitle]);

  useEffect(() => {
    if (seedSceneDescription !== undefined) {
      setSceneDescription(seedSceneDescription);
    }
  }, [seedSceneDescription]);

  useEffect(() => {
    if (seedPaletteId !== undefined) {
      setSelectedPalette(seedPaletteId);
    }
  }, [seedPaletteId]);

  useEffect(() => {
    if (seedSceneType !== undefined) {
      setSelectedSceneType(seedSceneType);
    }
  }, [seedSceneType]);

  const sceneTypes = [
    { value: 'chapter-opener' as const, label: 'Chapter Opener', color: 'bg-purple-500' },
    { value: 'key-moment' as const, label: 'Key Story Moment', color: 'bg-red-500' },
    { value: 'background' as const, label: 'Background / Landscape', color: 'bg-green-500' },
    { value: 'battle' as const, label: 'Battle / Action', color: 'bg-orange-500' },
    { value: 'emotional' as const, label: 'Emotional / Quiet', color: 'bg-blue-500' },
    { value: 'dream' as const, label: 'Dream / Vision', color: 'bg-indigo-500' }
  ];

  const handleGenerate = async () => {
    if (!sceneTitle.trim() || !sceneDescription.trim()) return;
    
    await onGenerateScene(
      selectedSceneType,
      sceneTitle,
      sceneDescription,
      selectedPalette || undefined
    );
    
    setSceneTitle('');
    setSceneDescription('');
  };

  const filteredScenes = activeTab === 'all' 
    ? scenes 
    : scenes.filter(s => s.sceneType === activeTab);

  const getSceneTypeLabel = (type: SceneIllustration['sceneType']) => {
    return sceneTypes.find(st => st.value === type)?.label || type;
  };

  const getSceneTypeColor = (type: SceneIllustration['sceneType']) => {
    return sceneTypes.find(st => st.value === type)?.color || 'bg-gray-500';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-brand-border">
        <h2 className="text-xl font-bold text-brand-text-primary mb-2">Scene Management</h2>
        <p className="text-sm text-brand-text-secondary">
          Create full-page illustrations, chapter openers, and cinematic scenes
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-brand-border overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 font-medium text-sm whitespace-nowrap transition-colors ${
            activeTab === 'all'
              ? 'border-b-2 border-brand-primary text-brand-text-primary'
              : 'text-brand-text-secondary hover:text-brand-text-primary'
          }`}
        >
          All Scenes ({scenes.length})
        </button>
        {sceneTypes.map(type => {
          const count = scenes.filter(s => s.sceneType === type.value).length;
          return (
            <button
              key={type.value}
              onClick={() => setActiveTab(type.value)}
              className={`px-4 py-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === type.value
                  ? 'border-b-2 border-brand-primary text-brand-text-primary'
                  : 'text-brand-text-secondary hover:text-brand-text-primary'
              }`}
            >
              {type.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Generation Panel */}
          <div className="space-y-4">
            <div className="bg-brand-surface rounded-lg border border-brand-border p-4">
              <h3 className="text-lg font-semibold text-brand-text-primary mb-4">Generate New Scene</h3>
              
              {/* Scene Type Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-brand-text-primary mb-2">
                  Scene Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {sceneTypes.map(type => (
                    <button
                      key={type.value}
                      onClick={() => setSelectedSceneType(type.value)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        selectedSceneType === type.value
                          ? 'border-brand-primary bg-brand-primary/10'
                          : 'border-brand-border hover:border-brand-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${type.color}`}></div>
                        <span className="text-sm font-medium text-brand-text-primary">
                          {type.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Scene Title */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-brand-text-primary mb-2">
                  Scene Title
                </label>
                <input
                  type="text"
                  value={sceneTitle}
                  onChange={(e) => setSceneTitle(e.target.value)}
                  placeholder="e.g., 'The Battle of Winterfell'"
                  className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg 
                           text-brand-text-primary placeholder-brand-text-secondary
                           focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  disabled={isGenerating}
                />
              </div>

              {/* Scene Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-brand-text-primary mb-2">
                  Scene Description
                </label>
                <textarea
                  value={sceneDescription}
                  onChange={(e) => setSceneDescription(e.target.value)}
                  placeholder="Describe the scene composition, lighting, mood, characters present, key visual elements..."
                  rows={6}
                  className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg 
                           text-brand-text-primary placeholder-brand-text-secondary
                           focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                  disabled={isGenerating}
                />
              </div>

              {/* Color Palette Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-brand-text-primary mb-2">
                  Color Palette (Optional)
                </label>
                <select
                  value={selectedPalette}
                  onChange={(e) => setSelectedPalette(e.target.value)}
                  className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg 
                           text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  disabled={isGenerating}
                >
                  <option value="">No specific palette</option>
                  {palettes.map(palette => (
                    <option key={palette.id} value={palette.id}>
                      {palette.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !sceneTitle.trim() || !sceneDescription.trim()}
                className="w-full px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 
                         text-white rounded-lg font-medium transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2Icon className="w-4 h-4 animate-spin" />
                    Generating Scene...
                  </>
                ) : (
                  <>
                    <PlusIcon className="w-4 h-4" />
                    Generate Scene
                  </>
                )}
              </button>
            </div>

            {/* Quick Scene Templates */}
            <div className="bg-brand-surface rounded-lg border border-brand-border p-4">
              <h3 className="text-sm font-semibold text-brand-text-primary mb-3">Quick Templates</h3>
              <div className="space-y-2">
                {[
                  { title: 'Epic Battle', desc: 'Large-scale combat with dynamic motion and dramatic lighting', type: 'battle' as const },
                  { title: 'Quiet Moment', desc: 'Intimate character scene with soft lighting and emotional depth', type: 'emotional' as const },
                  { title: 'Sweeping Landscape', desc: 'Wide establishing shot showcasing environment and atmosphere', type: 'background' as const },
                  { title: 'Prophetic Vision', desc: 'Surreal dreamscape with symbolic imagery and ethereal lighting', type: 'dream' as const }
                ].map((template, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSceneTitle(template.title);
                      setSceneDescription(template.desc);
                      setSelectedSceneType(template.type);
                    }}
                    className="w-full p-2 text-left rounded border border-brand-border 
                             hover:border-brand-primary transition-colors"
                    disabled={isGenerating}
                  >
                    <div className="text-sm font-medium text-brand-text-primary">{template.title}</div>
                    <div className="text-xs text-brand-text-secondary mt-1">{template.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Scene Gallery */}
          <div className="space-y-4">
            <div className="bg-brand-surface rounded-lg border border-brand-border p-4">
              <h3 className="text-lg font-semibold text-brand-text-primary mb-4">
                {activeTab === 'all' ? 'All Scenes' : getSceneTypeLabel(activeTab)}
              </h3>
              
              {filteredScenes.length === 0 ? (
                <div className="text-center py-12 text-brand-text-secondary">
                  <p>No scenes yet. Generate your first scene to get started.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredScenes.map(scene => (
                    <div
                      key={scene.id}
                      className="bg-brand-bg rounded-lg border border-brand-border p-3 hover:border-brand-primary/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        {scene.imageUrl && (
                          <img
                            src={scene.imageUrl}
                            alt={scene.title}
                            className="w-32 h-24 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <h4 className="font-medium text-brand-text-primary truncate">
                                {scene.title}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-white ${getSceneTypeColor(scene.sceneType)}`}>
                                  <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                  {getSceneTypeLabel(scene.sceneType)}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => onDeleteScene(scene.id)}
                              className="text-brand-text-secondary hover:text-red-500 transition-colors p-1"
                              title="Delete scene"
                            >
                              <Trash2Icon className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-sm text-brand-text-secondary line-clamp-2">
                            {scene.description}
                          </p>
                          {scene.notes && (
                            <p className="text-xs text-brand-text-secondary mt-2 italic">
                              Note: {scene.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
