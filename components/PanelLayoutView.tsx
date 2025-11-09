import React, { useState, useEffect } from 'react';
import type { PanelLayout, Panel } from '../types';
import { PlusIcon, Loader2Icon, Trash2Icon } from './icons/IconDefs';

interface PanelLayoutViewProps {
  layouts: PanelLayout[];
  onCreateLayout: (
    layoutType: PanelLayout['layoutType'],
    title: string,
    description: string
  ) => Promise<PanelLayout>;
  onGeneratePanel: (
    layoutId: string,
    panelDescription: string,
    cameraAngle: Panel['cameraAngle']
  ) => Promise<void>;
  onAddDialogue: (
    layoutId: string,
    panelId: string,
    speaker: string,
    text: string
  ) => void;
  onAddSoundEffect: (
    layoutId: string,
    panelId: string,
    effect: string
  ) => void;
  onDeleteLayout: (layoutId: string) => void;
  isGenerating: boolean;
  seedLayoutTitle?: string;
  seedLayoutDescription?: string;
  seedPanelPrompt?: string;
  seedLayoutType?: PanelLayout['layoutType'];
}

export const PanelLayoutView: React.FC<PanelLayoutViewProps> = ({
  layouts,
  onCreateLayout,
  onGeneratePanel,
  onAddDialogue,
  onAddSoundEffect,
  onDeleteLayout,
  isGenerating,
  seedLayoutTitle,
  seedLayoutDescription,
  seedPanelPrompt,
  seedLayoutType
}) => {
  const [activeTab, setActiveTab] = useState<'storyboard' | 'final-art' | 'publish'>('storyboard');
  const [selectedLayout, setSelectedLayout] = useState<string>('');
  const [newLayoutTitle, setNewLayoutTitle] = useState('');
  const [newLayoutDesc, setNewLayoutDesc] = useState('');
  const [newLayoutType, setNewLayoutType] = useState<PanelLayout['layoutType']>('comic');
  const [panelDescription, setPanelDescription] = useState('');
  const [cameraAngle, setCameraAngle] = useState<Panel['cameraAngle']>('medium');

  useEffect(() => {
    if (seedLayoutTitle !== undefined) {
      setNewLayoutTitle(seedLayoutTitle);
    }
  }, [seedLayoutTitle]);

  useEffect(() => {
    if (seedLayoutDescription !== undefined) {
      setNewLayoutDesc(seedLayoutDescription);
    }
  }, [seedLayoutDescription]);

  useEffect(() => {
    if (seedPanelPrompt !== undefined) {
      setPanelDescription(seedPanelPrompt);
    }
  }, [seedPanelPrompt]);

  useEffect(() => {
    if (seedLayoutType !== undefined) {
      setNewLayoutType(seedLayoutType);
    }
  }, [seedLayoutType]);

  const layoutTypes = [
    { value: 'comic' as const, label: 'Comic Book', desc: 'Traditional panel layouts with gutters' },
    { value: 'manga' as const, label: 'Manga', desc: 'Right-to-left reading format' },
    { value: 'webtoon' as const, label: 'Webtoon', desc: 'Vertical scroll format' },
    { value: 'graphic-novel' as const, label: 'Graphic Novel', desc: 'Cinematic page layouts' }
  ];

  const cameraAngles = [
    { value: 'close-up' as const, label: 'Close-Up', icon: '🎯' },
    { value: 'medium' as const, label: 'Medium Shot', icon: '👤' },
    { value: 'wide' as const, label: 'Wide Shot', icon: '🏞️' },
    { value: 'birds-eye' as const, label: 'Bird\'s Eye', icon: '🦅' },
    { value: 'worms-eye' as const, label: 'Worm\'s Eye', icon: '🐛' },
    { value: 'over-shoulder' as const, label: 'Over Shoulder', icon: '👥' },
    { value: 'dutch-angle' as const, label: 'Dutch Angle', icon: '📐' }
  ];

  const handleCreateLayout = async () => {
    if (!newLayoutTitle.trim() || !newLayoutDesc.trim()) return;
    
    await onCreateLayout(newLayoutType, newLayoutTitle, newLayoutDesc);
    setNewLayoutTitle('');
    setNewLayoutDesc('');
  };

  const handleGeneratePanel = async () => {
    if (!selectedLayout || !panelDescription.trim()) return;
    
    await onGeneratePanel(selectedLayout, panelDescription, cameraAngle);
    setPanelDescription('');
  };

  const selectedLayoutData = layouts.find(l => l.id === selectedLayout);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-brand-border">
        <h2 className="text-xl font-bold text-brand-text-primary mb-2">
          Sequential Art & Panel Layouts
        </h2>
        <p className="text-sm text-brand-text-secondary">
          Create graphic novels, manga, and webtoon pages with professional paneling
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-brand-border">
        <button
          onClick={() => setActiveTab('storyboard')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'storyboard'
              ? 'border-b-2 border-brand-primary text-brand-text-primary'
              : 'text-brand-text-secondary hover:text-brand-text-primary'
          }`}
        >
          📝 Storyboard & Thumbnails
        </button>
        <button
          onClick={() => setActiveTab('final-art')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'final-art'
              ? 'border-b-2 border-brand-primary text-brand-text-primary'
              : 'text-brand-text-secondary hover:text-brand-text-primary'
          }`}
        >
          🎨 Final Art & Coloring
        </button>
        <button
          onClick={() => setActiveTab('publish')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'publish'
              ? 'border-b-2 border-brand-primary text-brand-text-primary'
              : 'text-brand-text-secondary hover:text-brand-text-primary'
          }`}
        >
          📤 Export & Publish
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'storyboard' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Layout Creation Panel */}
            <div className="space-y-4">
              <div className="bg-brand-surface rounded-lg border border-brand-border p-4">
                <h3 className="text-lg font-semibold text-brand-text-primary mb-4">
                  Create New Page Layout
                </h3>

                {/* Layout Type Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-brand-text-primary mb-2">
                    Layout Format
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {layoutTypes.map(type => (
                      <button
                        key={type.value}
                        onClick={() => setNewLayoutType(type.value)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          newLayoutType === type.value
                            ? 'border-brand-primary bg-brand-primary/10'
                            : 'border-brand-border hover:border-brand-primary/50'
                        }`}
                        disabled={isGenerating}
                      >
                        <div className="text-sm font-medium text-brand-text-primary mb-1">
                          {type.label}
                        </div>
                        <div className="text-xs text-brand-text-secondary">
                          {type.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Page Title */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-brand-text-primary mb-2">
                    Page Title
                  </label>
                  <input
                    type="text"
                    value={newLayoutTitle}
                    onChange={(e) => setNewLayoutTitle(e.target.value)}
                    placeholder="e.g., 'Chapter 1 - Page 5'"
                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg 
                             text-brand-text-primary placeholder-brand-text-secondary
                             focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    disabled={isGenerating}
                  />
                </div>

                {/* Page Description */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-brand-text-primary mb-2">
                    Page Description
                  </label>
                  <textarea
                    value={newLayoutDesc}
                    onChange={(e) => setNewLayoutDesc(e.target.value)}
                    placeholder="Describe the story flow, pacing, and key moments for this page..."
                    rows={4}
                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg 
                             text-brand-text-primary placeholder-brand-text-secondary
                             focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                    disabled={isGenerating}
                  />
                </div>

                {/* Create Button */}
                <button
                  onClick={handleCreateLayout}
                  disabled={isGenerating || !newLayoutTitle.trim() || !newLayoutDesc.trim()}
                  className="w-full px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 
                           text-white rounded-lg font-medium transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2Icon className="w-4 h-4 animate-spin" />
                      Creating Layout...
                    </>
                  ) : (
                    <>
                      <PlusIcon className="w-4 h-4" />
                      Create Page Layout
                    </>
                  )}
                </button>
              </div>

              {/* Panel Generation */}
              {layouts.length > 0 && (
                <div className="bg-brand-surface rounded-lg border border-brand-border p-4">
                  <h3 className="text-lg font-semibold text-brand-text-primary mb-4">
                    Add Panel to Page
                  </h3>

                  {/* Select Layout */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-brand-text-primary mb-2">
                      Select Page
                    </label>
                    <select
                      value={selectedLayout}
                      onChange={(e) => setSelectedLayout(e.target.value)}
                      className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg 
                               text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      disabled={isGenerating}
                    >
                      <option value="">Choose a page...</option>
                      {layouts.map(layout => (
                        <option key={layout.id} value={layout.id}>
                          {layout.title} ({layout.panels.length} panels)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Camera Angle */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-brand-text-primary mb-2">
                      Camera Angle
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {cameraAngles.map(angle => (
                        <button
                          key={angle.value}
                          onClick={() => setCameraAngle(angle.value)}
                          className={`p-2 rounded-lg border text-left transition-all ${
                            cameraAngle === angle.value
                              ? 'border-brand-primary bg-brand-primary/10'
                              : 'border-brand-border hover:border-brand-primary/50'
                          }`}
                          disabled={isGenerating}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{angle.icon}</span>
                            <span className="text-xs font-medium text-brand-text-primary">
                              {angle.label}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Panel Description */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-brand-text-primary mb-2">
                      Panel Content
                    </label>
                    <textarea
                      value={panelDescription}
                      onChange={(e) => setPanelDescription(e.target.value)}
                      placeholder="Describe what happens in this panel: characters, actions, emotions, background..."
                      rows={4}
                      className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg 
                               text-brand-text-primary placeholder-brand-text-secondary
                               focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                      disabled={isGenerating}
                    />
                  </div>

                  {/* Generate Panel Button */}
                  <button
                    onClick={handleGeneratePanel}
                    disabled={isGenerating || !selectedLayout || !panelDescription.trim()}
                    className="w-full px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 
                             text-white rounded-lg font-medium transition-colors
                             disabled:opacity-50 disabled:cursor-not-allowed
                             flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2Icon className="w-4 h-4 animate-spin" />
                        Generating Panel...
                      </>
                    ) : (
                      <>
                        <PlusIcon className="w-4 h-4" />
                        Add Panel
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Layouts Gallery */}
            <div className="space-y-4">
              <div className="bg-brand-surface rounded-lg border border-brand-border p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-brand-text-primary">
                    Page Layouts ({layouts.length})
                  </h3>
                </div>

                {layouts.length === 0 ? (
                  <div className="text-center py-12 text-brand-text-secondary">
                    <p>No page layouts yet. Create your first page to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {layouts.map(layout => (
                      <div
                        key={layout.id}
                        className="bg-brand-bg rounded-lg border border-brand-border p-3 
                                 hover:border-brand-primary/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-brand-text-primary">
                              {layout.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-primary/20 text-brand-primary">
                                {layout.layoutType}
                              </span>
                              <span className="text-xs text-brand-text-secondary">
                                {layout.panels.length} panels
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => onDeleteLayout(layout.id)}
                            className="text-brand-text-secondary hover:text-red-500 transition-colors p-1"
                            title="Delete layout"
                          >
                            <Trash2Icon className="w-4 h-4" />
                          </button>
                        </div>

                        <p className="text-sm text-brand-text-secondary mb-3">
                          {layout.description}
                        </p>

                        {/* Panel Grid Preview */}
                        {layout.panels.length > 0 && (
                          <div className="grid grid-cols-3 gap-2">
                            {layout.panels.slice(0, 6).map((panel, idx) => (
                              <div
                                key={panel.id}
                                className="aspect-[3/4] bg-brand-bg rounded border border-brand-border 
                                         flex items-center justify-center text-xs text-brand-text-secondary"
                              >
                                {panel.imageUrl ? (
                                  <img
                                    src={panel.imageUrl}
                                    alt={`Panel ${idx + 1}`}
                                    className="w-full h-full object-cover rounded"
                                  />
                                ) : (
                                  <span>Panel {idx + 1}</span>
                                )}
                              </div>
                            ))}
                            {layout.panels.length > 6 && (
                              <div className="aspect-[3/4] bg-brand-bg rounded border border-brand-border 
                                           flex items-center justify-center text-xs text-brand-text-secondary">
                                +{layout.panels.length - 6} more
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'final-art' && (
          <div className="text-center py-12 text-brand-text-secondary">
            <p>Final Art & Coloring tools coming soon...</p>
            <p className="text-sm mt-2">Line art cleanup, shading, and colorization workflows</p>
          </div>
        )}

        {activeTab === 'publish' && (
          <div className="text-center py-12 text-brand-text-secondary">
            <p>Export & Publishing tools coming soon...</p>
            <p className="text-sm mt-2">PDF export, Webtoon formatting, print-ready files</p>
          </div>
        )}
      </div>
    </div>
  );
};
