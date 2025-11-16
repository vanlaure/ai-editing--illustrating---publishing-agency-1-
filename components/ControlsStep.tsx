import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import type { CreativeBrief, StylePreset } from '../types';
import { STYLE_PRESETS } from '../constants';
import Spinner from './Spinner';

interface ControlsStepProps {
  creativeBrief: CreativeBrief;
  onUpdateBrief: (updates: Partial<CreativeBrief>) => void;
  onSubmit: () => void;
  isProcessing: boolean;
  moodboardImages: File[];
  onSetMoodboardImages: (files: File[]) => void;
  onAnalyzeMoodboard: () => void;
  isAnalyzingMoodboard: boolean;
  onGetDirectorSuggestions: () => void;
  isSuggestingBrief: boolean;
}

type QuickPreset = {
  key: string;
  label: string;
  description: string;
  settings: Partial<CreativeBrief>;
};

const QUICK_PRESETS: QuickPreset[] = [
  {
    key: 'concert',
    label: 'Concert Performance',
    description: 'Live energy, crowd shots, dramatic stage lighting.',
    settings: {
      videoType: 'Concert Performance',
      feel: 'Electric, Immersive, Live',
      style: 'Concert performance with stage lights, crowd energy, and close-ups of the singer',
      mood: ['energetic', 'live', 'cinematic'],
      color_palette: ['#0C1A2B', '#00FFC6', '#FF3B30', '#F8F8F8'],
      lyricsOverlay: true,
    },
  },
  {
    key: 'hybrid',
    label: 'Hybrid Performance + Story',
    description: 'Mix live stage with narrative cutaways for emotional punch.',
    settings: {
      videoType: 'Hybrid Performance-Story',
      feel: 'Emotional, Dynamic, Heroic',
      style: 'Cinematic story moments woven between performance on stage',
      mood: ['cinematic', 'emotional', 'uplifting'],
      color_palette: ['#0F1115', '#D99A5A', '#5AC8FA', '#F2E8DC'],
      lyricsOverlay: true,
    },
  },
  {
    key: 'dance',
    label: 'Dance-Choreo Focus',
    description: 'Choreographed movement, rhythmic cuts, and wide angles.',
    settings: {
      videoType: 'Dance/Choreography',
      feel: 'Rhythmic, High-Energy, Precise',
      style: 'Dance-focused visuals with synchronized lighting and wide lens choreography shots',
      mood: ['energetic', 'stylized', 'rhythmic'],
      color_palette: ['#0B0B0F', '#FF6B6B', '#7C3AED', '#FAD02C'],
      lyricsOverlay: false,
    },
  },
  {
    key: 'cinematic',
    label: 'Cinematic Concept',
    description: 'Artful cinematography, moody lighting, and smooth camera moves.',
    settings: {
      videoType: 'Cinematic Concept',
      feel: 'Moody, Elegant, Dramatic',
      style: 'High-concept visuals with atmospheric lighting and shallow depth of field',
      mood: ['dramatic', 'atmospheric', 'stylized'],
      color_palette: ['#0A0A0A', '#1B263B', '#415A77', '#E0E1DD'],
      lyricsOverlay: true,
    },
  },
  {
    key: 'documentary',
    label: 'Documentary / BTS',
    description: 'Raw, candid, behind-the-scenes vibe with handheld motion.',
    settings: {
      videoType: 'Documentary Style',
      feel: 'Authentic, Intimate, Honest',
      style: 'Candid handheld shots, rehearsal moments, crew interactions, and on-the-road details',
      mood: ['intimate', 'raw', 'uplifting'],
      color_palette: ['#0E1012', '#6C757D', '#C0C0C0', '#F5F5F5'],
      lyricsOverlay: false,
    },
  },
];

const UploadIcon = () => (
    <svg className="w-10 h-10 mx-auto text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const MoodboardUploader: React.FC<{
    images: File[];
    onSetImages: (files: File[]) => void;
    onAnalyze: () => void;
    isAnalyzing: boolean;
}> = ({ images, onSetImages, onAnalyze, isAnalyzing }) => {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        const newFiles = [...images, ...acceptedFiles].slice(0, 8); // Limit to 8 images
        onSetImages(newFiles);
    }, [images, onSetImages]);

    // Cast to `any` to satisfy differing DropzoneOptions typings across versions
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/jpeg': [], 'image/png': [] },
        maxSize: 5 * 1024 * 1024, // 5MB
    } as any);

    const removeImage = (index: number) => {
        onSetImages(images.filter((_, i) => i !== index));
    };

    const previews = useMemo(() => images.map(file => ({
        ...file,
        preview: URL.createObjectURL(file)
    })), [images]);

    return (
        <div>
            <div {...getRootProps()} className={`w-full p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragActive ? 'border-brand-cyan bg-brand-cyan/10' : 'border-brand-light-gray hover:border-brand-cyan'}`}>
                <input {...getInputProps()} />
                <UploadIcon />
                <p className="mt-2 text-md font-semibold text-white">Drop images here or click to upload</p>
                <p className="text-xs text-gray-400">Up to 8 images, PNG or JPG</p>
            </div>

            {previews.length > 0 && (
                <div className="mt-4 grid grid-cols-4 md:grid-cols-8 gap-2">
                    {previews.map((file, index) => (
                        <div key={index} className="relative aspect-square group">
                            <img src={file.preview} alt={`preview ${index + 1}`} className="w-full h-full object-cover rounded-md" onLoad={() => URL.revokeObjectURL(file.preview)} />
                            <button
                                onClick={() => removeImage(index)}
                                aria-label={`Remove image ${index + 1}`}
                                className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <span className="sr-only">Remove image {index + 1}</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}
            
            <button
                type="button"
                onClick={onAnalyze}
                disabled={images.length === 0 || isAnalyzing}
                className="w-full mt-4 flex items-center justify-center bg-brand-magenta text-white font-bold py-2 px-4 rounded-lg hover:opacity-80 transition-all disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
                {isAnalyzing ? <><Spinner /> Analyzing...</> : 'Analyze Mood Board with AI'}
            </button>
        </div>
    );
};


const ControlsStep: React.FC<ControlsStepProps> = ({
  creativeBrief: brief,
  onUpdateBrief,
  onSubmit,
  isProcessing,
  moodboardImages,
  onSetMoodboardImages,
  onAnalyzeMoodboard,
  isAnalyzingMoodboard,
  onGetDirectorSuggestions,
  isSuggestingBrief
}) => {
  const [preflight, setPreflight] = useState<{ ok: boolean; available: boolean; missingNodes: string[]; message?: string } | null>(null);
  const [selectedQuickPreset, setSelectedQuickPreset] = useState<string | null>(null);
  const [prePresetBrief, setPrePresetBrief] = useState<CreativeBrief | null>(null);
  const [styleCategory, setStyleCategory] = useState<string>('all');
  const [selectedStyleName, setSelectedStyleName] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    // Lazy-load to avoid hammering backend; small delay for UX
    const t = setTimeout(async () => {
      try {
        const mod = await import('../services/backendService');
        const result = await mod.backendService.comfyPreflight();
        if (mounted) setPreflight(result);
      } catch (e) {
        if (mounted) setPreflight({ ok: false, available: false, missingNodes: ['unknown'], message: e instanceof Error ? e.message : 'Failed to check ComfyUI' });
      }
    }, 300);
    return () => { mounted = false; clearTimeout(t); };
  }, []);

  useEffect(() => {
    const matchingPreset = QUICK_PRESETS.find(preset => preset.settings.videoType === brief.videoType);
    setSelectedQuickPreset(matchingPreset ? matchingPreset.key : null);
  }, [brief.videoType]);

  useEffect(() => {
    const currentStylePreset = STYLE_PRESETS.find(preset => preset.settings.style === brief.style);
    setSelectedStyleName(currentStylePreset?.name ?? '');
    if (currentStylePreset?.category) {
      setStyleCategory(currentStylePreset.category);
    }
  }, [brief.style]);

  const styleCategories = useMemo(() => {
    const unique = Array.from(new Set(STYLE_PRESETS.map(p => p.category || 'Other')));
    return ['all', ...unique];
  }, []);

  const filteredStylePresets = useMemo(() => {
    if (styleCategory === 'all') return STYLE_PRESETS;
    return STYLE_PRESETS.filter(preset => preset.category === styleCategory);
  }, [styleCategory]);

  const handlePresetSelect = (preset: StylePreset) => {
    onUpdateBrief(preset.settings);
    setSelectedStyleName(preset.name);
  };

  const handleQuickPresetToggle = (preset: QuickPreset) => {
    const isActive = selectedQuickPreset === preset.key;

    if (isActive) {
      const fallbackBrief = prePresetBrief ?? { ...brief, videoType: 'Story Narrative' };
      onUpdateBrief(fallbackBrief);
      setSelectedQuickPreset(null);
      setPrePresetBrief(null);
      return;
    }

    if (!selectedQuickPreset) {
      setPrePresetBrief(brief);
    }

    setSelectedQuickPreset(preset.key);
    onUpdateBrief({
      ...brief,
      ...preset.settings,
      mood: preset.settings.mood ?? brief.mood,
      color_palette: preset.settings.color_palette ?? brief.color_palette,
      user_notes: preset.settings.user_notes ?? brief.user_notes,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };
  
  return (
    <div className="flex flex-col items-center w-full">
      <h2 className="text-3xl font-bold mb-2 text-white">Direct the Vision</h2>
      <p className="text-gray-400 mb-8">Set the creative direction for your music video.</p>
      
        <form onSubmit={handleSubmit} className="w-full max-w-4xl space-y-8">
            {/* ComfyUI Preflight Banner */}
            {preflight && (
              <div className={`p-3 rounded-lg border ${preflight.ok ? 'border-green-700 bg-green-900/20' : 'border-yellow-700 bg-yellow-900/20'} flex items-start gap-3`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${preflight.ok ? 'text-green-400' : 'text-yellow-400'}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-5.25a.75.75 0 001.5 0V9a.75.75 0 00-1.5 0v3.75zM10 7a1 1 0 110-2 1 1 0 010 2z" clipRule="evenodd" />
                </svg>
                <div className="text-sm">
                  <div className="font-semibold text-white">ComfyUI Preflight {preflight.ok ? 'OK' : 'Needs Attention'}</div>
                  {!preflight.available && (
                    <div className="text-gray-300">Cannot reach ComfyUI. Check that it’s running at your configured URL.</div>
                  )}
                  {preflight.available && !preflight.ok && (
                    <div className="text-gray-300">Missing nodes: <span className="font-mono">{preflight.missingNodes.join(', ')}</span>. See setup guides: COMFYUI_ANIMATEDIFF_SETUP.md and COMFYUI_HUNYUANVIDEO_SETUP.md</div>
                  )}
                  {preflight.message && <div className="text-gray-400">{preflight.message}</div>}
                </div>
              </div>
            )}
            <div>
                <h3 className="text-lg font-semibold mb-3 text-brand-cyan">Quick Preset</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {QUICK_PRESETS.map(preset => {
                      const isActive = selectedQuickPreset === preset.key;
                      return (
                        <button
                          key={preset.key}
                          type="button"
                          onClick={() => handleQuickPresetToggle(preset)}
                          className={`p-4 text-left rounded-lg border-2 transition-all ${isActive ? 'border-brand-cyan bg-brand-cyan/10 shadow-lg' : 'border-brand-light-gray hover:border-brand-cyan hover:bg-brand-cyan/5'}`}
                          title={preset.description}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">{preset.label}</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${isActive ? 'bg-brand-cyan/30 text-white border border-brand-cyan/60' : 'bg-brand-dark text-gray-300 border border-gray-700'}`}>
                              {isActive ? 'Selected' : 'Tap to Apply'}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-gray-400">{preset.description}</p>
                        </button>
                      );
                    })}
                </div>
            </div>
            <div>
                <h3 className="text-lg font-semibold mb-3 text-brand-cyan">1. Select a Style Preset (Optional)</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Style Category</label>
                    <select
                      value={styleCategory}
                      onChange={e => setStyleCategory(e.target.value)}
                      className="w-full bg-brand-dark border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan"
                    >
                      {styleCategories.map(cat => (
                        <option key={cat} value={cat}>
                          {cat === 'all' ? 'All styles' : cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Style / Substyle</label>
                    <select
                      value={selectedStyleName}
                      onChange={e => {
                        const preset = STYLE_PRESETS.find(p => p.name === e.target.value);
                        if (preset) handlePresetSelect(preset);
                      }}
                      className="w-full bg-brand-dark border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan"
                    >
                      <option value="">-- Choose a style --</option>
                      {filteredStylePresets.map(preset => (
                        <option key={preset.name} value={preset.name}>
                          {preset.name} {preset.substyle ? `- ${preset.substyle}` : ''}
                        </option>
                      ))}
                    </select>
                    {selectedStyleName && (
                      <div className="text-xs text-gray-400">
                        {STYLE_PRESETS.find(p => p.name === selectedStyleName)?.description}
                      </div>
                    )}
                  </div>
                </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-brand-cyan">2. Visual Inspiration (Mood Board)</h3>
              <MoodboardUploader images={moodboardImages} onSetImages={onSetMoodboardImages} onAnalyze={onAnalyzeMoodboard} isAnalyzing={isAnalyzingMoodboard} />
            </div>

            <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-brand-cyan">3. Fine-tune Your Brief</h3>
                  <button
                    type="button"
                    onClick={onGetDirectorSuggestions}
                    disabled={isSuggestingBrief}
                    className="flex items-center bg-brand-dark border border-gray-600 hover:border-brand-cyan text-white font-semibold py-2 px-4 rounded-lg transition-all text-sm disabled:opacity-50"
                  >
                    {isSuggestingBrief ? <><Spinner /> Thinking...</> : 'Ask AI Director for Ideas'}
                  </button>
                </div>
                 <div className="space-y-4">
                     <div>
                         <label htmlFor="feel" className="block text-sm font-medium text-gray-300 mb-1">Feel</label>
                         <input id="feel" type="text" value={brief.feel} onChange={e => onUpdateBrief({ feel: e.target.value })} placeholder="e.g., Nostalgic, Energetic, Cool" className="w-full bg-brand-dark border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan outline-none transition" required />
                     </div>
                     <div>
                         <label htmlFor="style" className="block text-sm font-medium text-gray-300 mb-1">Style</label>
                         <input id="style" type="text" value={brief.style} onChange={e => onUpdateBrief({ style: e.target.value })} placeholder="e.g., 80s retro-futurism, synthwave aesthetic" className="w-full bg-brand-dark border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan outline-none transition" required />
                     </div>
                     <div>
                         <label className="block text-sm font-medium text-gray-300 mb-1">Color Palette</label>
                         <div className="p-3 bg-brand-dark border border-gray-600 rounded-lg min-h-[44px] flex items-center space-x-2">
                          {brief.color_palette && brief.color_palette.length > 0 ? (
                              brief.color_palette.map(color => (
                                  <div key={color} title={color} className="w-6 h-6 rounded-full border-2 border-brand-light-gray shadow-md overflow-hidden">
                                      {/* Use SVG fill attribute (not inline style) to render dynamic color without using style={{}} */}
                                      <svg className="w-full h-full block" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden>
                                          <rect width="1" height="1" fill={color} />
                                      </svg>
                                  </div>
                              ))
                          ) : (
                              <p className="text-sm text-gray-500">Auto-generated from mood board or style.</p>
                          )}
                         </div>
                     </div>
                     <div>
                         <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-1">Additional Notes</label>
                         <textarea id="notes" value={brief.user_notes} onChange={e => onUpdateBrief({ user_notes: e.target.value })} rows={3} placeholder="Any specific ideas? e.g., 'I want to see a lot of lens flare and scenes with rain.'" className="w-full bg-brand-dark border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan outline-none transition" />
                     </div>
                 </div>
            </div>
            
            <div className="mt-8 text-center">
                <button type="submit" className="bg-brand-cyan text-brand-dark font-bold py-3 px-10 rounded-lg hover:bg-white transition-all transform hover:scale-105 disabled:opacity-50" disabled={isProcessing || !brief.feel || !brief.style}>
                    {isProcessing ? <Spinner/> : 'Generate Storyboard &raquo;'}
                </button>
            </div>
        </form>
    </div>
  );
};

export default ControlsStep;
