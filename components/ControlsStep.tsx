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
  const handlePresetSelect = (preset: StylePreset) => {
    onUpdateBrief(preset.settings);
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
                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={() => onUpdateBrief({
                            videoType: 'Concert Performance',
                            feel: brief.feel || 'Energetic, Live, Immersive',
                            style: brief.style || 'Concert performance, stage lighting, dynamic audience',
                            color_palette: brief.color_palette?.length ? brief.color_palette : ['#000000', '#1E90FF', '#FF0000', '#FFFFFF']
                        })}
                        className="px-4 py-2 rounded-lg border-2 border-brand-cyan text-white hover:bg-brand-cyan/10 transition"
                        title="Focus on live performance with singers featured and stage visuals"
                    >
                        Concert Performance
                    </button>
                </div>
            </div>
            <div>
                <h3 className="text-lg font-semibold mb-3 text-brand-cyan">1. Select a Style Preset (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {STYLE_PRESETS.map(preset => (
                        <button
                            key={preset.name}
                            type="button"
                            onClick={() => handlePresetSelect(preset)}
                            className={`p-4 border-2 rounded-lg text-left transition-all h-full ${brief.style === preset.settings.style ? 'border-brand-cyan bg-brand-cyan/10' : 'border-brand-light-gray hover:border-gray-600'}`}
                        >
                            <h4 className="font-bold text-white">{preset.name}</h4>
                            <p className="text-sm text-gray-400 mt-1">{preset.description}</p>
                        </button>
                    ))}
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
