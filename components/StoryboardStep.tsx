import React, { useState, useEffect, useRef } from 'react';
import type { Bibles, Storyboard, StoryboardShot, DesignAgentFeedback, VFX_PRESET, Transition, SongAnalysis, CreativeBrief } from '../types';
import type { PostProductionTasks } from '../hooks/useMusicVideoGenerator';
import { VFX_PRESETS } from '../constants';
import * as aiService from '../services/aiService';
import Spinner from './Spinner';
import BiblesDisplay from './BiblesDisplay';
import ImageEditorModal from './ImageEditorModal';
import BeatTimelineVisualizer from './BeatTimelineVisualizer';
import MediaLibraryModal from './MediaLibraryModal';

declare global {
  interface Window {
    jspdf: any;
    JSZip: any;
  }
}

interface StoryboardStepProps {
  songAnalysis: SongAnalysis | null;
  bibles: Bibles | null;
  creativeBrief: CreativeBrief | null;
  storyboard: Storyboard | null;
  onRegenerateImage: (shotId: string) => void;
  onEditImage: (shotId: string, prompt: string) => Promise<void>;
  onGenerateClip: (shotId: string, quality?: 'draft' | 'high') => void;
  onGoToReview: () => void;
  onGenerateAllImages: () => void;
  isProcessing: boolean;
  postProductionTasks: PostProductionTasks;
  onSetVfx: (shotId: string, vfx: VFX_PRESET | 'None') => void;
  onApplyVfx: () => void;
  onApplyColor: () => void;
  onApplyStabilization: () => void;
  suggestAndApplyBeatSyncedVfx: () => void;
  onRegenerateBibleImage: (item: { type: 'character' | 'location'; name: string }) => void;
  updateShotWithFileUpload: (shotId: string, mediaType: 'image' | 'video', file: File) => void;
  modelTier: 'draft' | 'premium';
  onModelTierChange: (tier: 'draft' | 'premium') => void;
}

const RegenerateIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.899 2.186l-1.393.73a5.002 5.002 0 00-8.61-1.735.999.999 0 01-1.724-.998A7.002 7.002 0 014 4.101V6a1 1 0 01-2 0V3a1 1 0 011-1zm12 14a1 1 0 01-1-1v-2.101a7.002 7.002 0 01-11.899-2.186l1.393-.73a5.002 5.002 0 008.61 1.735.999.999 0 011.724.998A7.002 7.002 0 0116 15.899V14a1 1 0 012 0v3a1 1 0 01-1 1z" clipRule="evenodd" />
    </svg>
);

const PaintBrushIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
    </svg>
);

const PlayIcon = ({ className = "h-5 w-5 mr-2" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
    </svg>
);

const UploadIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);


const CheckCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);

const ExportIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const MusicNoteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-13c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
    </svg>
);

const ColorSwatchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-magenta" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
);

const FrameIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v4m0 0h-4m4 0l-5-5" />
    </svg>
);

const VideoPlayerModal: React.FC<{ url: string, onClose: () => void }> = ({ url, onClose }) => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    return (
        <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-brand-dark p-4 rounded-lg shadow-2xl w-full max-w-4xl"
                onClick={e => e.stopPropagation()}
            >
                <video controls autoPlay muted preload="metadata" crossOrigin="anonymous" className="w-full aspect-video rounded">
                    <source src={url} type="video/mp4" />
                </video>
                <button 
                    onClick={onClose}
                    className="mt-4 w-full bg-brand-magenta text-white font-bold py-2 px-4 rounded-lg hover:opacity-80 transition-opacity"
                    aria-label="Close video player"
                >
                    Close
                </button>
            </div>
        </div>
    );
};

const DesignAgentFeedbackDisplay: React.FC<{ feedback: DesignAgentFeedback }> = ({ feedback }) => {
    const syncScoreColor = feedback.sync_score >= 8 ? 'text-green-400' : feedback.sync_score >= 5 ? 'text-yellow-400' : 'text-red-400';
    const cohesionScoreColor = feedback.cohesion_score >= 8 ? 'text-green-400' : feedback.cohesion_score >= 5 ? 'text-yellow-400' : 'text-red-400';

    return (
        <div className="mt-4 p-3 bg-brand-dark/50 rounded-lg border border-brand-light-gray">
            <h5 className="font-semibold text-sm text-brand-cyan mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm-.707 10.607a1 1 0 011.414-1.414l.707.707a1 1 0 01-1.414 1.414l-.707-.707zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
                </svg>
                Design Agent Feedback
            </h5>
            <div className="space-y-2 text-xs">
                 <div className="grid grid-cols-2 gap-2">
                    <div className="flex justify-between items-center bg-brand-dark/50 p-1.5 rounded">
                        <span className="text-gray-400 font-medium">Music Sync:</span>
                        <span className={`font-bold text-base ${syncScoreColor}`}>{feedback.sync_score}/10</span>
                    </div>
                     <div className="flex justify-between items-center bg-brand-dark/50 p-1.5 rounded">
                        <span className="text-gray-400 font-medium">Brief Cohesion:</span>
                        <span className={`font-bold text-base ${cohesionScoreColor}`}>{feedback.cohesion_score}/10</span>
                    </div>
                </div>
                <p className="text-gray-300 pt-1"><strong className="text-gray-400 font-medium">Creative Note:</strong> {feedback.feedback}</p>
            </div>
        </div>
    );
};

const ShotCard: React.FC<{ shot: StoryboardShot; bibles: Bibles; brief: CreativeBrief; isPromptExpanded: boolean; onTogglePrompt: () => void; onRegenerate: () => void; onEdit: () => void; onGenerate: () => void; onPlayClip: (url: string) => void; onSetVfx: (vfx: VFX_PRESET | 'None') => void; onFileUpload: (mediaType: 'image' | 'video', file: File) => void; quality: 'draft' | 'high'; }> = ({ shot, bibles, brief, isPromptExpanded, onTogglePrompt, onRegenerate, onEdit, onGenerate, onPlayClip, onSetVfx, onFileUpload, quality }) => {
    const duration = shot.end - shot.start;
    const isGeneratingImage = !shot.preview_image_url;
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, mediaType: 'image' | 'video') => {
        const file = event.target.files?.[0];
        if (file) {
            onFileUpload(mediaType, file);
        }
        event.target.value = '';
    };

    return (
        <div className="bg-brand-light-gray rounded-lg p-4 flex flex-col md:flex-row gap-4">
            <div className="relative w-full md:w-48 flex-shrink-0 aspect-video">
                {isGeneratingImage ? (
                    <div className="w-full h-full object-cover rounded bg-brand-dark flex items-center justify-center">
                        <div className="flex flex-col items-center">
                            <Spinner />
                            <p className="text-xs text-gray-400 mt-2">Generating Image...</p>
                        </div>
                    </div>
                ) : shot.preview_image_url === 'error' ? (
                     <div className="w-full h-full object-cover rounded bg-red-900/50 flex items-center justify-center text-center p-2">
                        <p className="text-xs text-red-300">Image generation failed</p>
                    </div>
                ) : (
                    <img src={shot.preview_image_url} alt={`Preview for ${shot.subject}`} className="w-full h-full object-cover rounded" />
                )}
                <div className="absolute top-2 right-2 flex space-x-2">
                    <button 
                        onClick={onEdit}
                        disabled={isGeneratingImage || shot.preview_image_url === 'error'}
                        className="bg-black/50 text-white p-1.5 rounded-full hover:bg-brand-cyan transition-colors disabled:bg-gray-700 disabled:cursor-not-allowed"
                        aria-label="Edit image"
                        title="Edit image with AI"
                    >
                        <PaintBrushIcon />
                    </button>
                    <button 
                        onClick={onRegenerate}
                        disabled={isGeneratingImage}
                        className="bg-black/50 text-white p-1.5 rounded-full hover:bg-brand-magenta transition-colors disabled:bg-gray-700 disabled:cursor-not-allowed"
                        aria-label="Regenerate image"
                        title="Regenerate image"
                    >
                        <RegenerateIcon />
                    </button>
                </div>
                 <div className="absolute bottom-2 right-2 flex space-x-2">
                    <input type="file" ref={imageInputRef} onChange={(e) => handleFileChange(e, 'image')} accept="image/*" className="hidden" />
                    <input type="file" ref={videoInputRef} onChange={(e) => handleFileChange(e, 'video')} accept="video/*" className="hidden" />
                    <button onClick={() => imageInputRef.current?.click()} className="bg-black/50 text-white p-1.5 rounded-full hover:bg-brand-cyan transition-colors" title="Upload custom image"><UploadIcon /></button>
                    <button onClick={() => videoInputRef.current?.click()} className="bg-black/50 text-white p-1.5 rounded-full hover:bg-brand-cyan transition-colors" title="Upload custom video"><PlayIcon className="h-5 w-5" /></button>
                </div>
            </div>
            <div className="flex-grow">
                <h4 className="font-bold text-white flex items-center flex-wrap gap-2">
                    <span>Shot {shot.id.split('-')[1]}</span>
                    <span className="text-sm font-normal text-gray-400">({duration.toFixed(1)}s)</span>
                    {/* Vocalist / Duet badges */}
                    {Array.isArray(shot.performer_refs) && shot.performer_refs.length > 0 && (
                        <span className="ml-1 text-[11px] font-semibold bg-brand-dark border border-brand-light-gray text-white px-2 py-0.5 rounded-full">
                            {shot.performer_refs.length > 1 ? `Duet: ${shot.performer_refs.join(' + ')}` : `Vocal: ${shot.performer_refs[0]}`}
                        </span>
                    )}
                    {shot.lip_sync_hint && (
                        <span className="text-[11px] font-semibold bg-purple-900/60 text-purple-200 px-2 py-0.5 rounded-full border border-purple-700">Lip-sync</span>
                    )}
                </h4>
                {shot.lyric_overlay && (
                    <p className="text-lg text-brand-cyan italic my-2">"{shot.lyric_overlay.text}" <span className="text-xs not-italic text-gray-400">({shot.lyric_overlay.animation_style})</span></p>
                )}
                <div className="flex flex-wrap items-center gap-2 mb-2 text-xs">
                    {shot.post_production_enhancements?.stabilized && <span className="bg-blue-900/50 text-blue-300 px-2 py-1 rounded-full">Stabilized</span>}
                    {shot.post_production_enhancements?.color_corrected && <span className="bg-purple-900/50 text-purple-300 px-2 py-1 rounded-full">Color Corrected</span>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                    <p className="text-gray-300"><strong className="font-semibold text-gray-400">Shot:</strong> {shot.shot_type}</p>
                    <p className="text-gray-300"><strong className="font-semibold text-gray-400">Move:</strong> {shot.camera_move}</p>
                    <p className="text-gray-300"><strong className="font-semibold text-gray-400">Lens:</strong> {shot.cinematic_enhancements.camera_lens}</p>
                    <p className="text-gray-300 col-span-full"><strong className="font-semibold text-gray-400">Lighting:</strong> {shot.cinematic_enhancements.lighting_style}</p>
                    <p className="text-gray-300 col-span-full"><strong className="font-semibold text-gray-400">Subject:</strong> {shot.subject}</p>
                </div>
                
                {shot.design_agent_feedback && <DesignAgentFeedbackDisplay feedback={shot.design_agent_feedback} />}

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div>
                        <label htmlFor={`vfx-select-${shot.id}`} className="block text-xs font-medium text-gray-400 mb-1">Visual Effect</label>
                        <select
                            id={`vfx-select-${shot.id}`}
                            value={shot.vfx || 'None'}
                            onChange={e => onSetVfx(e.target.value as VFX_PRESET | 'None')}
                            className="w-full bg-brand-dark border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-brand-cyan focus:border-brand-cyan outline-none transition"
                        >
                            <option value="None">None</option>
                            {VFX_PRESETS.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                        </select>
                    </div>
                    <div className="self-end w-full">
                        {shot.is_generating_clip ? (
                            <div className="w-full">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-300 font-medium">Generating {quality === 'high' ? 'HD' : 'Draft'} Clip...</span>
                                    <span className="text-sm text-brand-cyan font-bold">{shot.generation_progress || 0}%</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2.5">
                                    <div
                                        className="bg-brand-cyan h-2.5 rounded-full transition-all duration-300"
                                        style={{ width: `${shot.generation_progress || 0}%` }}
                                    />
                                </div>
                            </div>
                        ) : shot.clip_url ? (
                            <div className="w-full flex items-center justify-between gap-2">
                                <span className="flex items-center text-green-400 font-semibold text-sm">
                                    <CheckCircleIcon />
                                    Clip Ready
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => onPlayClip(shot.clip_url!)}
                                        className="p-2.5 rounded-lg bg-brand-dark border border-gray-600 hover:border-brand-cyan text-white transition-colors"
                                        aria-label="Play clip"
                                        title="Play clip"
                                    >
                                       <PlayIcon className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={onGenerate}
                                        className="p-2.5 rounded-lg bg-brand-dark border border-gray-600 hover:border-brand-magenta text-white transition-colors"
                                        aria-label="Regenerate clip"
                                        title="Regenerate clip"
                                    >
                                        <RegenerateIcon />
                                    </button>
                                </div>
                            </div>
                        ) : (
                             <button 
                                onClick={onGenerate}
                                disabled={isGeneratingImage || shot.preview_image_url === 'error'}
                                className="w-full flex items-center justify-center bg-brand-magenta text-white font-bold py-2 px-4 rounded-lg hover:opacity-80 transition-all disabled:bg-gray-500 disabled:cursor-not-allowed"
                            >
                               <PlayIcon /> Generate Clip
                            </button>
                        )}
                    </div>
                </div>
                 <div className="mt-4">
                    <button onClick={onTogglePrompt} className="text-xs text-gray-400 hover:text-white hover:underline w-full text-left">
                        {isPromptExpanded ? 'Hide Generation Prompts' : 'Show Generation Prompts'}
                    </button>
                    {isPromptExpanded && (
                        <div className="mt-2 p-3 bg-brand-dark rounded-md text-xs space-y-3 font-mono border border-brand-light-gray/50">
                            <div>
                                <h6 className="font-bold text-gray-400 mb-1">Image Prompt:</h6>
                                <pre className="whitespace-pre-wrap text-gray-300 text-[11px] leading-relaxed">{aiService.getPromptForImageShot(shot, bibles, brief)}</pre>
                            </div>
                             <div className="border-t border-brand-light-gray/20 my-2"></div>
                            <div>
                                <h6 className="font-bold text-gray-400 mb-1">Video Prompt:</h6>
                                <pre className="whitespace-pre-wrap text-gray-300 text-[11px] leading-relaxed">{aiService.getPromptForClipShot(shot, bibles, brief)}</pre>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const TransitionDisplay: React.FC<{ transition: Transition | null }> = ({ transition }) => {
    if (!transition) return null;

    return (
        <div className="flex items-center justify-center my-2">
            <div className="flex items-center space-x-2 px-3 py-1 bg-brand-dark rounded-full border border-brand-light-gray text-xs">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                <span className="font-bold text-white">{transition.type}</span>
                <span className="text-gray-400">({transition.duration}s)</span>
                <span className="text-gray-500 hidden md:inline">- {transition.description}</span>
            </div>
        </div>
    );
}

import { webSocketService } from '../services/webSocketService';

const StoryboardStep: React.FC<StoryboardStepProps> = ({ songAnalysis, storyboard, bibles, creativeBrief, onRegenerateImage, onEditImage, onGenerateClip, onGoToReview, onGenerateAllImages, isProcessing, postProductionTasks, onSetVfx, onApplyVfx, onApplyColor, onApplyStabilization, suggestAndApplyBeatSyncedVfx, onRegenerateBibleImage, updateShotWithFileUpload, modelTier, onModelTierChange }) => {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const [playingClipUrl, setPlayingClipUrl] = useState<string | null>(null);
  const [editingShot, setEditingShot] = useState<StoryboardShot | null>(null);
  const [expandedPromptShotId, setExpandedPromptShotId] = useState<string | null>(null);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [selectedShotForMedia, setSelectedShotForMedia] = useState<string | null>(null);
  const [generatingClipId, setGeneratingClipId] = useState<string | null>(null);
  
  // Subscribe to video generation events for specific shots
  useEffect(() => {
    // Track which clips are being generated for WebSocket updates
    const handleVideoGenerated = (data: any) => {
      if (data.id && data.url) {
        // Update the UI to show that the video generation is complete
        // We could also directly update the shot with the new video URL if we have mapping
        console.log(`Video ${data.id} generated: ${data.url}`);
      }
    };
    
    webSocketService.on('video_generated', handleVideoGenerated);
    
    return () => {
      webSocketService.off('video_generated', handleVideoGenerated);
    };
  }, []);
  
  // Track specific clip generation for WebSocket updates
  useEffect(() => {
    if (generatingClipId) {
      // Subscribe to the specific video generation event for this shot
      const handleSpecificVideoGenerated = (data: any) => {
        if (data.id === generatingClipId) {
          // Update the shot with the generated video URL
          const updatedShots = storyboard.scenes.flatMap(s => s.shots).map(shot => {
            if (shot.id === generatingClipId) {
              return {
                ...shot,
                clip_url: data.url,
                is_generating_clip: false,
                generation_progress: 100
              };
            }
            return shot;
          });
          
          // Here we'd normally update the storyboard state, but since this is a component
          // we might need to call a callback to update the parent state
          
          console.log(`Shot ${generatingClipId} clip updated: ${data.url}`);
        }
      };
      
      // Subscribe to specific video ID
      webSocketService.on(`video_generated_${generatingClipId}`, handleSpecificVideoGenerated);
      
      return () => {
        webSocketService.off(`video_generated_${generatingClipId}`, handleSpecificVideoGenerated);
      };
    }
  }, [generatingClipId, storyboard]);
  
  // Override the onGenerateClip function to track which clip is being generated
  const handleGenerateClip = (shotId: string, quality: 'draft' | 'high' = 'draft') => {
    setGeneratingClipId(shotId);
    onGenerateClip(shotId, quality);
  };

  useEffect(() => {
    onGenerateAllImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  if (!storyboard || !songAnalysis || !bibles || !creativeBrief) {
    return (
      <div className="text-center">
        <Spinner />
        <p>Loading storyboard...</p>
      </div>
    );
  }

  const handleExportPdf = async () => {
    if (!storyboard || isExporting) return;
    setIsExporting(true);
    setExportMessage('pdf');

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 10;
        let y = margin;

        // Title Page
        doc.setFontSize(22);
        doc.text('AI Music Video Storyboard', pageWidth / 2, y + 10, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, y + 20, { align: 'center' });
        
        for (const scene of (storyboard.scenes || [])) {
            if (y > pageHeight - 40 || y === margin) { 
                doc.addPage();
                y = margin;
            }

            doc.setFontSize(16);
            doc.text(`Scene: ${scene.section.replace(/_/g, ' ')} (${scene.start.toFixed(1)}s - ${scene.end.toFixed(1)}s)`, margin, y);
            y += 10;
            
            for (const shot of (scene.shots || [])) {
                const shotHeight = 65; 
                if (y + shotHeight > pageHeight - margin) {
                    doc.addPage();
                    y = margin;
                }

                const imgWidth = 80;
                const imgHeight = (imgWidth * 9) / 16;
                try {
                    if (shot.preview_image_url.startsWith('data:image')) {
                       doc.addImage(shot.preview_image_url, 'JPEG', margin, y, imgWidth, imgHeight);
                    }
                } catch(e) {
                    console.error("Error adding image to PDF for shot", shot.id, e);
                }
                
                let textX = margin + imgWidth + 5;
                let textY = y;
                const availableTextWidth = pageWidth - textX - margin;

                doc.setFontSize(10).setFont(undefined, 'bold');
                doc.text(`Shot ${shot.id.split('-')[1]} (${(shot.end - shot.start).toFixed(1)}s)`, textX, textY, { maxWidth: availableTextWidth });
                textY += 5;

                doc.setFontSize(8).setFont(undefined, 'normal');
                
                const addDetail = (label: string, value?: string) => {
                    if (!value) return;
                    const lines = doc.splitTextToSize(`${label}: ${value}`, availableTextWidth);
                    if (textY + (lines.length * 3.5) > y + imgHeight) return; // Prevent text from overflowing image
                    doc.text(lines, textX, textY);
                    textY += lines.length * 3.5;
                };

                addDetail('Type', shot.shot_type);
                addDetail('Camera', shot.camera_move);
                addDetail('Subject', shot.subject);
                if (shot.lyric_overlay) {
                    doc.setFont(undefined, 'italic');
                    addDetail('Lyric', `"${shot.lyric_overlay.text}"`);
                    doc.setFont(undefined, 'normal');
                }
                
                y += imgHeight + 5;
                doc.setDrawColor(50, 50, 50);
                doc.line(margin, y, pageWidth - margin, y);
                y += 5;
            }
        }
        
        doc.deletePage(2); // Remove the first blank page added by the loop
        doc.save('storyboard.pdf');
    } catch (error) {
        console.error("Failed to generate PDF:", error);
    } finally {
        setIsExporting(false);
        setExportMessage('');
        setIsExportMenuOpen(false);
    }
  };

  const handleExportZip = async () => {
      if (!storyboard || isExporting) return;
      setIsExporting(true);
      setExportMessage('zip');

      try {
          const zip = new window.JSZip();

          for (const scene of (storyboard.scenes || [])) {
              for (const shot of (scene.shots || [])) {
                  const filename = `scene-${scene.section}_shot-${shot.id}`;
                  
                  if (shot.preview_image_url.startsWith('data:image')) {
                      const base64Data = shot.preview_image_url.split(',')[1];
                      zip.file(`${filename}.jpg`, base64Data, { base64: true });
                  }

                  let details = `Shot ID: ${shot.id}\n`;
                  details += `Scene: ${scene.section}\n`;
                  details += `Duration: ${(shot.end - shot.start).toFixed(1)}s (${shot.start.toFixed(1)}s - ${shot.end.toFixed(1)}s)\n\n`;
                  details += `Shot Type: ${shot.shot_type}\n`;
                  details += `Camera Move: ${shot.camera_move}\n`;
                  details += `Composition: ${shot.composition}\n`;
                  details += `Subject: ${shot.subject}\n`;
                  details += `Location: ${shot.location_ref}\n`;
                  details += `Characters: ${shot.character_refs.join(', ') || 'None'}\n\n`;

                  if (shot.lyric_overlay) {
                      details += `Lyric Overlay: "${shot.lyric_overlay.text}" (${shot.lyric_overlay.animation_style})\n\n`;
                  }

                  if (shot.design_agent_feedback) {
                      const feedback = shot.design_agent_feedback;
                      details += `Design Agent Feedback:\n`;
                      details += `- Sync Score: ${feedback.sync_score}/10\n`;
                      details += `- Cohesion Score: ${feedback.cohesion_score}/10\n`;
                      details += `- Note: ${feedback.feedback}\n`;
                  }

                  zip.file(`${filename}.txt`, details);
              }
          }

          zip.generateAsync({ type: 'blob' }).then(content => {
              const url = URL.createObjectURL(content);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'storyboard_images.zip';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
          });

      } catch (error) {
          console.error("Failed to generate ZIP:", error);
      } finally {
          setTimeout(() => {
              setIsExporting(false);
              setExportMessage('');
              setIsExportMenuOpen(false);
          }, 500);
      }
  };

  const scenes = storyboard.scenes || [];
  const allShots = scenes.flatMap(s => s.shots || []);
  const generatedClipsCount = allShots.filter(s => s.clip_url).length;
  const allClipsGenerated = allShots.length > 0 && generatedClipsCount === allShots.length;
    const generatedPercent = allShots.length > 0 ? Math.min(100, Math.max(0, Math.round((generatedClipsCount / allShots.length) * 100))) : 0;
  
  const PostProductionButton: React.FC<{
      title: string;
      description: string;
      status: 'idle' | 'processing' | 'done';
      onClick: () => void;
      icon: React.ReactNode;
      disabled?: boolean;
  }> = ({ title, description, status, onClick, icon, disabled = false }) => (
      <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-brand-light-gray">{icon}</div>
          <div className="flex-grow">
              <h5 className={`font-bold ${disabled ? 'text-gray-500' : 'text-white'}`}>{title}</h5>
              <p className="text-sm text-gray-400">{description}</p>
          </div>
          <div className="flex-shrink-0">
              {status === 'idle' && <button onClick={onClick} disabled={disabled} className="bg-brand-dark border border-gray-600 hover:border-brand-cyan text-white font-semibold py-2 px-4 rounded-lg transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-600">Apply</button>}
              {status === 'processing' && <button disabled className="bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-all text-sm flex items-center"><Spinner />Applying...</button>}
              {status === 'done' && <div className="text-brand-cyan font-semibold py-2 px-4 text-sm flex items-center"><CheckCircleIcon /> Applied</div>}
          </div>
      </div>
  );

  return (
    <div className="flex flex-col items-center">
      {playingClipUrl && <VideoPlayerModal url={playingClipUrl} onClose={() => setPlayingClipUrl(null)} />}
      {editingShot && (
          <ImageEditorModal 
            shot={editingShot}
            onClose={() => setEditingShot(null)}
            onSave={async (prompt) => {
                await onEditImage(editingShot.id, prompt);
                setEditingShot(null);
            }}
          />
      )}
      <div className="w-full flex justify-between items-start mb-8">
        <div>
          <h2 className="text-2xl font-bold mb-2 text-white">Visualize & Generate Storyboard</h2>
          <p className="text-gray-400">Review each shot, regenerate images, and generate video clips one by one.</p>
          {songAnalysis?.vocals?.type === 'duet' && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-dark border border-brand-light-gray">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-cyan" viewBox="0 0 20 20" fill="currentColor"><path d="M13 7H7v6h6V7z" /><path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm3 6a3 3 0 116 0 3 3 0 01-6 0z" clipRule="evenodd" /></svg>
              <span className="text-sm text-white font-semibold">Duet detected</span>
              <span className="text-xs text-gray-400">{songAnalysis.vocals.duet_pairing || 'unknown'}</span>
              {songAnalysis.vocals.vocalists?.length > 0 && (
                <span className="text-xs text-gray-300">{songAnalysis.vocals.vocalists.map(v => v.display_name).slice(0,2).join(' + ')}</span>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-brand-dark border border-brand-light-gray rounded-lg p-3">
            <label htmlFor="model-tier" className="block text-xs font-medium text-gray-400 mb-2">Model Tier</label>
            <select
              id="model-tier"
              value={modelTier}
              onChange={(e) => onModelTierChange(e.target.value as 'draft' | 'premium')}
              className="bg-brand-light-gray border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-brand-cyan focus:border-brand-cyan outline-none transition text-white"
            >
              <option value="draft">Draft (AnimateDiff 512p@8fps, ~30-60s)</option>
              <option value="premium">Premium (HunyuanVideo 720p@24fps, ~2-3min)</option>
            </select>
          </div>
          
          <button
            onClick={() => setShowMediaLibrary(true)}
            className="inline-flex items-center justify-center rounded-md border border-brand-light-gray shadow-sm px-4 py-2 bg-brand-dark text-sm font-medium text-gray-300 hover:bg-brand-light-gray focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-gray focus:ring-brand-cyan transition-colors"
            title="Browse media library"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Media Library
          </button>
          
          <div className="relative inline-block text-left flex-shrink-0">
          <div>
            <button
              type="button"
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="inline-flex justify-center w-full rounded-md border border-brand-light-gray shadow-sm px-4 py-2 bg-brand-dark text-sm font-medium text-gray-300 hover:bg-brand-light-gray focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-gray focus:ring-brand-cyan"
              id="menu-button"
              aria-expanded="true"
              aria-haspopup="true"
            >
              <ExportIcon />
              Export
              <svg className="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {isExportMenuOpen && (
            <div
              className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-brand-light-gray ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="menu-button"
            >
              <div className="py-1" role="none">
                <button
                  onClick={handleExportPdf}
                  disabled={isExporting}
                  className="text-gray-300 disabled:text-gray-500 disabled:cursor-wait block w-full text-left px-4 py-2 text-sm hover:bg-brand-dark"
                  role="menuitem"
                >
                  {isExporting && exportMessage === 'pdf' ? <div className="flex items-center"><Spinner/> Generating PDF...</div> : 'Export as PDF'}
                </button>
                <button
                  onClick={handleExportZip}
                  disabled={isExporting}
                  className="text-gray-300 disabled:text-gray-500 disabled:cursor-wait block w-full text-left px-4 py-2 text-sm hover:bg-brand-dark"
                  role="menuitem"
                >
                  {isExporting && exportMessage === 'zip' ? <div className="flex items-center"><Spinner/> Generating ZIP...</div> : 'Export Image Sequence (.zip)'}
                </button>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      <BeatTimelineVisualizer analysis={songAnalysis} />
      
      <BiblesDisplay bibles={bibles} onRegenerateBibleImage={onRegenerateBibleImage} />

      <div className="w-full space-y-8">
        {(storyboard.scenes || []).map(scene => (
          <div key={scene.id}>
            <h3 className="text-xl font-semibold mb-4 border-b-2 border-brand-cyan pb-2 text-white">
              <span className="font-normal text-gray-400 mr-2">Scene:</span>
              <span className="capitalize text-brand-cyan">{scene.section.replace('_', ' ')}</span>
              <span className="text-sm font-normal text-gray-400 ml-2">({scene.start.toFixed(1)}s - {scene.end.toFixed(1)}s)</span>
            </h3>
            <div className="mb-4 -mt-2 text-sm space-y-1">
                {scene.description && (
                    <p className="text-gray-300">
                        {scene.description}
                    </p>
                )}
                {scene.narrative_beats && scene.narrative_beats.length > 0 && (
                    <p className="text-gray-400 italic">
                        &raquo; {scene.narrative_beats.join(' ')}
                    </p>
                )}
            </div>
            <div className="space-y-4">
              {(scene.shots || []).map((shot, index) => (
                <React.Fragment key={shot.id}>
                    <ShotCard
                        shot={shot}
                        bibles={bibles}
                        brief={creativeBrief}
                        isPromptExpanded={expandedPromptShotId === shot.id}
                        onTogglePrompt={() => setExpandedPromptShotId(prevId => prevId === shot.id ? null : shot.id)}
                        onRegenerate={() => onRegenerateImage(shot.id)}
                        onEdit={() => setEditingShot(shot)}
                        onGenerate={() => handleGenerateClip(shot.id, modelTier === 'premium' ? 'high' : 'draft')}
                        onPlayClip={(url) => setPlayingClipUrl(url)}
                        onSetVfx={(vfx) => onSetVfx(shot.id, vfx)}
                        onFileUpload={(mediaType, file) => updateShotWithFileUpload(shot.id, mediaType, file)}
                        quality={modelTier === 'premium' ? 'high' : 'draft'}
                    />
                    <TransitionDisplay transition={scene.transitions[index]} />
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="w-full my-10 p-6 bg-brand-dark/50 rounded-lg border border-brand-light-gray">
          <h3 className="text-xl font-semibold mb-6 text-white">AI Post-Production Suite</h3>
          <p className="text-sm text-gray-400 -mt-4 mb-6">These actions can be time-consuming and may re-generate clips.</p>
          <div className="space-y-6">
                <PostProductionButton 
                  title="Suggest Beat-Synced VFX"
                  description="An AI agent will analyze the song's rhythm and suggest effects for high-energy moments."
                  status={postProductionTasks.vfx}
                  onClick={suggestAndApplyBeatSyncedVfx}
                  icon={<MusicNoteIcon />}
                  disabled={generatedClipsCount === 0}
                />
                <PostProductionButton 
                  title="Intelligent Color Correction"
                  description="An AI Colorist will analyze all shots and apply a consistent, professional color grade based on your creative brief."
                  status={postProductionTasks.color}
                  onClick={() => onApplyColor()}
                  icon={<ColorSwatchIcon />}
                  disabled={generatedClipsCount === 0}
                />
                <PostProductionButton 
                  title="AI Shot Stabilization"
                  description="Simulates camera shake removal for smoother, more professional-looking clips."
                  status={postProductionTasks.stabilization}
                  onClick={() => onApplyStabilization()}
                  icon={<FrameIcon />}
                   disabled={generatedClipsCount === 0}
                />
          </div>
      </div>
      
      <div className="w-full mt-10 p-4 bg-brand-light-gray rounded-lg sticky bottom-4 shadow-lg">
          <div className="flex items-center justify-between">
              <div>
                  <h4 className="font-bold text-white">Final Review</h4>
                  <p className="text-sm text-gray-400">{generatedClipsCount} of {allShots.length} clips generated.</p>
              </div>
              <button 
                  onClick={onGoToReview}
                  disabled={!allClipsGenerated || isProcessing}
                  className="w-full max-w-xs flex items-center justify-center bg-brand-cyan text-brand-dark font-bold py-3 px-6 rounded-lg hover:bg-white disabled:bg-gray-500 disabled:cursor-not-allowed transition-all transform hover:scale-105"
                >
                  {isProcessing ? <><Spinner /> Finalizing...</> : 'Finalize & Review'}
              </button>
          </div>
                    <div className="w-full bg-gray-700 rounded-full h-2.5 mt-3">
                        <div className={`bg-brand-cyan h-2.5 rounded-full w-[${generatedPercent}%]`} />
                    </div>
      </div>
      
      {showMediaLibrary && (
        <MediaLibraryModal
          isOpen={showMediaLibrary}
          onClose={() => {
            setShowMediaLibrary(false);
            setSelectedShotForMedia(null);
          }}
          onSelectMedia={async (url: string, type: 'image' | 'video') => {
            try {
              const response = await fetch(url);
              const blob = await response.blob();
              const filename = url.split('/').pop() || `media-${Date.now()}.${type === 'image' ? 'png' : 'mp4'}`;
              const file = new File([blob], filename, { type: blob.type });
              
              if (selectedShotForMedia) {
                updateShotWithFileUpload(selectedShotForMedia, type, file);
              }
              
              setShowMediaLibrary(false);
              setSelectedShotForMedia(null);
            } catch (error) {
              console.error('Failed to load media from library:', error);
              alert('Failed to load media from library. Please try again.');
            }
          }}
        />
      )}
    </div>
  );
};

export default StoryboardStep;
