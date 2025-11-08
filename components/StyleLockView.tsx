import React, { useState } from 'react';
import type { StyleGuide, ColorPalette, PaletteColor } from '../types';
import { PlusIcon, Loader2Icon, Trash2Icon, UploadIcon } from './icons/IconDefs';

interface StyleLockViewProps {
  styleGuide: StyleGuide | null;
  palettes: ColorPalette[];
  onCreateStyleGuide: (
    artStyle: StyleGuide['artStyle'],
    lighting: StyleGuide['lighting'],
    linework: StyleGuide['linework'],
    notes: string
  ) => Promise<void>;
  onUpdateStyleGuide: (updates: Partial<StyleGuide>) => void;
  onCreatePalette: (
    name: string,
    colors: PaletteColor[],
    purpose: ColorPalette['purpose'],
    notes: string
  ) => Promise<void>;
  onDeletePalette: (paletteId: string) => void;
  onUploadReference: (file: File) => Promise<string>;
  isGenerating: boolean;
}

export const StyleLockView: React.FC<StyleLockViewProps> = ({
  styleGuide,
  palettes,
  onCreateStyleGuide,
  onUpdateStyleGuide,
  onCreatePalette,
  onDeletePalette,
  onUploadReference,
  isGenerating
}) => {
  const [activeTab, setActiveTab] = useState<'style-guide' | 'palettes' | 'references'>('style-guide');
  
  // Style Guide State
  const [selectedArtStyle, setSelectedArtStyle] = useState<StyleGuide['artStyle']>('graphic-novel');
  const [selectedLighting, setSelectedLighting] = useState<StyleGuide['lighting']>('film');
  const [selectedLinework, setSelectedLinework] = useState<StyleGuide['linework']>('variable');
  const [styleNotes, setStyleNotes] = useState('');
  
  // Palette State
  const [paletteName, setPaletteName] = useState('');
  const [palettePurpose, setPalettePurpose] = useState<ColorPalette['purpose']>('global');
  const [paletteNotes, setPaletteNotes] = useState('');
  const [paletteColors, setPaletteColors] = useState<PaletteColor[]>([
    { name: 'Primary', hex: '#3B82F6', usage: 'Main theme color' }
  ]);

  const artStyleOptions = [
    { value: 'anime' as const, label: 'Anime', desc: 'Japanese animation style', emoji: '🎌' },
    { value: 'realism' as const, label: 'Realism', desc: 'Photo-realistic rendering', emoji: '📷' },
    { value: 'painterly' as const, label: 'Painterly', desc: 'Traditional painting look', emoji: '🎨' },
    { value: 'graphic-novel' as const, label: 'Graphic Novel', desc: 'Bold comic book style', emoji: '📚' },
    { value: 'watercolor' as const, label: 'Watercolor', desc: 'Soft watercolor aesthetic', emoji: '💧' },
    { value: 'manga' as const, label: 'Manga', desc: 'Japanese comic style', emoji: '📖' },
    { value: 'webtoon' as const, label: 'Webtoon', desc: 'Korean digital comic style', emoji: '📱' },
    { value: 'custom' as const, label: 'Custom', desc: 'Unique custom style', emoji: '✨' }
  ];

  const lightingOptions = [
    { value: 'film' as const, label: 'Film Lighting', desc: 'Cinematic three-point lighting' },
    { value: 'painterly' as const, label: 'Painterly', desc: 'Traditional art lighting' },
    { value: 'comic' as const, label: 'Comic', desc: 'High-contrast comic shading' },
    { value: 'natural' as const, label: 'Natural', desc: 'Realistic natural light' }
  ];

  const lineworkOptions = [
    { value: 'heavy' as const, label: 'Heavy', desc: 'Bold, thick outlines' },
    { value: 'light' as const, label: 'Light', desc: 'Thin, delicate lines' },
    { value: 'variable' as const, label: 'Variable', desc: 'Mixed line weights' },
    { value: 'none' as const, label: 'None', desc: 'Painterly, no outlines' }
  ];

  const palettePurposeOptions = [
    { value: 'global' as const, label: 'Global', desc: 'Project-wide palette' },
    { value: 'chapter' as const, label: 'Chapter', desc: 'Specific chapter mood' },
    { value: 'character' as const, label: 'Character', desc: 'Character-specific colors' },
    { value: 'environment' as const, label: 'Environment', desc: 'Location/setting palette' }
  ];

  const handleCreateStyleGuide = async () => {
    await onCreateStyleGuide(selectedArtStyle, selectedLighting, selectedLinework, styleNotes);
    setStyleNotes('');
  };

  const handleCreatePalette = async () => {
    if (!paletteName.trim() || paletteColors.length === 0) return;
    
    await onCreatePalette(paletteName, paletteColors, palettePurpose, paletteNotes);
    setPaletteName('');
    setPaletteNotes('');
    setPaletteColors([{ name: 'Primary', hex: '#3B82F6', usage: 'Main theme color' }]);
  };

  const addColorToPalette = () => {
    setPaletteColors([
      ...paletteColors,
      { name: `Color ${paletteColors.length + 1}`, hex: '#000000', usage: 'Description' }
    ]);
  };

  const updatePaletteColor = (index: number, field: keyof PaletteColor, value: string) => {
    const updated = [...paletteColors];
    updated[index] = { ...updated[index], [field]: value };
    setPaletteColors(updated);
  };

  const removePaletteColor = (index: number) => {
    setPaletteColors(paletteColors.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-brand-border">
        <h2 className="text-xl font-bold text-brand-text-primary mb-2">Style Lock System</h2>
        <p className="text-sm text-brand-text-secondary">
          Ensure visual consistency across all artwork with style guides and color palettes
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-brand-border">
        <button
          onClick={() => setActiveTab('style-guide')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'style-guide'
              ? 'border-b-2 border-brand-primary text-brand-text-primary'
              : 'text-brand-text-secondary hover:text-brand-text-primary'
          }`}
        >
          🎨 Style Guide
        </button>
        <button
          onClick={() => setActiveTab('palettes')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'palettes'
              ? 'border-b-2 border-brand-primary text-brand-text-primary'
              : 'text-brand-text-secondary hover:text-brand-text-primary'
          }`}
        >
          🎨 Color Palettes ({palettes.length})
        </button>
        <button
          onClick={() => setActiveTab('references')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'references'
              ? 'border-b-2 border-brand-primary text-brand-text-primary'
              : 'text-brand-text-secondary hover:text-brand-text-primary'
          }`}
        >
          📁 Reference Images
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {/* Style Guide Tab */}
        {activeTab === 'style-guide' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {styleGuide ? (
              <div className="bg-brand-surface rounded-lg border border-brand-border p-6">
                <h3 className="text-lg font-semibold text-brand-text-primary mb-4">
                  Current Style Guide
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-brand-text-secondary mb-1">
                      Art Style
                    </label>
                    <div className="text-lg font-semibold text-brand-text-primary">
                      {artStyleOptions.find(s => s.value === styleGuide.artStyle)?.emoji}{' '}
                      {artStyleOptions.find(s => s.value === styleGuide.artStyle)?.label}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-text-secondary mb-1">
                      Lighting
                    </label>
                    <div className="text-lg font-semibold text-brand-text-primary capitalize">
                      {styleGuide.lighting}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-text-secondary mb-1">
                      Linework
                    </label>
                    <div className="text-lg font-semibold text-brand-text-primary capitalize">
                      {styleGuide.linework || 'None'}
                    </div>
                  </div>
                </div>
                {styleGuide.notes && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-brand-text-secondary mb-1">
                      Notes
                    </label>
                    <p className="text-sm text-brand-text-primary">{styleGuide.notes}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary rounded-lg font-medium transition-colors">
                    Edit Style Guide
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-brand-surface rounded-lg border border-brand-border p-6">
                <h3 className="text-lg font-semibold text-brand-text-primary mb-4">
                  Create Style Guide
                </h3>

                {/* Art Style Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-brand-text-primary mb-3">
                    Art Style
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {artStyleOptions.map(style => (
                      <button
                        key={style.value}
                        onClick={() => setSelectedArtStyle(style.value)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          selectedArtStyle === style.value
                            ? 'border-brand-primary bg-brand-primary/10'
                            : 'border-brand-border hover:border-brand-primary/50'
                        }`}
                        disabled={isGenerating}
                      >
                        <div className="text-2xl mb-1">{style.emoji}</div>
                        <div className="text-sm font-medium text-brand-text-primary mb-1">
                          {style.label}
                        </div>
                        <div className="text-xs text-brand-text-secondary">
                          {style.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lighting Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-brand-text-primary mb-3">
                    Lighting Style
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {lightingOptions.map(light => (
                      <button
                        key={light.value}
                        onClick={() => setSelectedLighting(light.value)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          selectedLighting === light.value
                            ? 'border-brand-primary bg-brand-primary/10'
                            : 'border-brand-border hover:border-brand-primary/50'
                        }`}
                        disabled={isGenerating}
                      >
                        <div className="text-sm font-medium text-brand-text-primary mb-1">
                          {light.label}
                        </div>
                        <div className="text-xs text-brand-text-secondary">
                          {light.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Linework Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-brand-text-primary mb-3">
                    Linework Style
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {lineworkOptions.map(line => (
                      <button
                        key={line.value}
                        onClick={() => setSelectedLinework(line.value)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          selectedLinework === line.value
                            ? 'border-brand-primary bg-brand-primary/10'
                            : 'border-brand-border hover:border-brand-primary/50'
                        }`}
                        disabled={isGenerating}
                      >
                        <div className="text-sm font-medium text-brand-text-primary mb-1">
                          {line.label}
                        </div>
                        <div className="text-xs text-brand-text-secondary">
                          {line.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Style Notes */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-brand-text-primary mb-2">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    value={styleNotes}
                    onChange={(e) => setStyleNotes(e.target.value)}
                    placeholder="Add any specific style requirements, references, or guidelines..."
                    rows={4}
                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg 
                             text-brand-text-primary placeholder-brand-text-secondary
                             focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                    disabled={isGenerating}
                  />
                </div>

                {/* Create Button */}
                <button
                  onClick={handleCreateStyleGuide}
                  disabled={isGenerating}
                  className="w-full px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 
                           text-white rounded-lg font-medium transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2Icon className="w-4 h-4 animate-spin" />
                      Creating Style Guide...
                    </>
                  ) : (
                    <>
                      <PlusIcon className="w-4 h-4" />
                      Create Style Guide
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Palettes Tab */}
        {activeTab === 'palettes' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Create Palette Panel */}
            <div className="space-y-4">
              <div className="bg-brand-surface rounded-lg border border-brand-border p-4">
                <h3 className="text-lg font-semibold text-brand-text-primary mb-4">
                  Create Color Palette
                </h3>

                {/* Palette Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-brand-text-primary mb-2">
                    Palette Name
                  </label>
                  <input
                    type="text"
                    value={paletteName}
                    onChange={(e) => setPaletteName(e.target.value)}
                    placeholder="e.g., 'Dark Fantasy', 'Warm Autumn'"
                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg 
                             text-brand-text-primary placeholder-brand-text-secondary
                             focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    disabled={isGenerating}
                  />
                </div>

                {/* Purpose */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-brand-text-primary mb-2">
                    Purpose
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {palettePurposeOptions.map(purpose => (
                      <button
                        key={purpose.value}
                        onClick={() => setPalettePurpose(purpose.value)}
                        className={`p-2 rounded-lg border text-left transition-all ${
                          palettePurpose === purpose.value
                            ? 'border-brand-primary bg-brand-primary/10'
                            : 'border-brand-border hover:border-brand-primary/50'
                        }`}
                        disabled={isGenerating}
                      >
                        <div className="text-sm font-medium text-brand-text-primary">
                          {purpose.label}
                        </div>
                        <div className="text-xs text-brand-text-secondary">
                          {purpose.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Colors */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-brand-text-primary">
                      Colors
                    </label>
                    <button
                      onClick={addColorToPalette}
                      className="text-xs text-brand-primary hover:text-brand-primary/80"
                      disabled={isGenerating}
                    >
                      + Add Color
                    </button>
                  </div>
                  <div className="space-y-2">
                    {paletteColors.map((color, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="color"
                          value={color.hex}
                          onChange={(e) => updatePaletteColor(index, 'hex', e.target.value)}
                          className="w-12 h-10 rounded cursor-pointer"
                          disabled={isGenerating}
                        />
                        <input
                          type="text"
                          value={color.name}
                          onChange={(e) => updatePaletteColor(index, 'name', e.target.value)}
                          placeholder="Color name"
                          className="flex-1 px-3 py-2 bg-brand-bg border border-brand-border rounded-lg 
                                   text-brand-text-primary placeholder-brand-text-secondary text-sm
                                   focus:outline-none focus:ring-2 focus:ring-brand-primary"
                          disabled={isGenerating}
                        />
                        <input
                          type="text"
                          value={color.usage}
                          onChange={(e) => updatePaletteColor(index, 'usage', e.target.value)}
                          placeholder="Usage"
                          className="flex-1 px-3 py-2 bg-brand-bg border border-brand-border rounded-lg 
                                   text-brand-text-primary placeholder-brand-text-secondary text-sm
                                   focus:outline-none focus:ring-2 focus:ring-brand-primary"
                          disabled={isGenerating}
                        />
                        {paletteColors.length > 1 && (
                          <button
                            onClick={() => removePaletteColor(index)}
                            className="text-brand-text-secondary hover:text-red-500 p-1"
                            disabled={isGenerating}
                          >
                            <Trash2Icon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-brand-text-primary mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={paletteNotes}
                    onChange={(e) => setPaletteNotes(e.target.value)}
                    placeholder="When to use this palette, emotional tone, etc..."
                    rows={2}
                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg 
                             text-brand-text-primary placeholder-brand-text-secondary text-sm
                             focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                    disabled={isGenerating}
                  />
                </div>

                {/* Create Button */}
                <button
                  onClick={handleCreatePalette}
                  disabled={isGenerating || !paletteName.trim() || paletteColors.length === 0}
                  className="w-full px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 
                           text-white rounded-lg font-medium transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2Icon className="w-4 h-4 animate-spin" />
                      Creating Palette...
                    </>
                  ) : (
                    <>
                      <PlusIcon className="w-4 h-4" />
                      Create Palette
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Existing Palettes */}
            <div className="space-y-4">
              <div className="bg-brand-surface rounded-lg border border-brand-border p-4">
                <h3 className="text-lg font-semibold text-brand-text-primary mb-4">
                  Saved Palettes ({palettes.length})
                </h3>

                {palettes.length === 0 ? (
                  <div className="text-center py-12 text-brand-text-secondary">
                    <p>No palettes yet. Create your first palette to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {palettes.map(palette => (
                      <div
                        key={palette.id}
                        className="bg-brand-bg rounded-lg border border-brand-border p-3"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-brand-text-primary">
                              {palette.name}
                            </h4>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-primary/20 text-brand-primary mt-1">
                              {palette.purpose}
                            </span>
                          </div>
                          <button
                            onClick={() => onDeletePalette(palette.id)}
                            className="text-brand-text-secondary hover:text-red-500 transition-colors p-1"
                            title="Delete palette"
                          >
                            <Trash2Icon className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Color Swatches */}
                        <div className="flex flex-wrap gap-2 mb-2">
                          {palette.colors.map((color, idx) => (
                            <div key={idx} className="group relative">
                              <div
                                className="w-12 h-12 rounded border-2 border-brand-border cursor-pointer"
                                style={{ backgroundColor: color.hex }}
                                title={`${color.name}: ${color.usage}`}
                              ></div>
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-brand-bg border border-brand-border rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                {color.name}
                              </div>
                            </div>
                          ))}
                        </div>

                        {palette.notes && (
                          <p className="text-xs text-brand-text-secondary italic mt-2">
                            {palette.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* References Tab */}
        {activeTab === 'references' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-brand-surface rounded-lg border border-brand-border p-6">
              <h3 className="text-lg font-semibold text-brand-text-primary mb-4">
                Reference Image Library
              </h3>
              <div className="text-center py-12 text-brand-text-secondary">
                <UploadIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Reference image management coming soon...</p>
                <p className="text-sm mt-2">Upload and organize visual references for your style guide</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};