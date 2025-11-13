import React, { useState, useRef, useEffect } from 'react';
import type { Storyboard, ExportOptions, IntroOverlayConfig, OutroOverlayConfig, IntroOverlayStyle, OutroOverlayStyle } from '../types';
import Spinner from './Spinner';
import { renderVideo } from '../services/ffmpegService';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyboard: Storyboard;
  songFile: File | null;
}

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, storyboard, songFile }) => {
  const [error, setError] = useState<string | null>(null);
  const [resolution, setResolution] = useState<ExportOptions['resolution']>('720p');
  const [renderState, setRenderState] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
  const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [renderStatusMessage, setRenderStatusMessage] = useState('Preparing to render...');
  const [localSongFile, setLocalSongFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [introEnabled, setIntroEnabled] = useState(false);
  const [outroEnabled, setOutroEnabled] = useState(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [introConfig, setIntroConfig] = useState<IntroOverlayConfig>({
    enabled: false,
    duration: 3,
    song_title: storyboard?.title || '',
    artist_name: storyboard?.artist || '',
    style: 'minimal',
    animation: 'fade',
    background: 'blur'
  });
  const [outroConfig, setOutroConfig] = useState<OutroOverlayConfig>({
    enabled: false,
    duration: 5,
    credits: {
      custom_credits: []
    },
    style: 'minimal',
    animation: 'fade'
  });

  useEffect(() => {
    if (isOpen) {
        setRenderState('idle');
        setFinalVideoUrl(null);
        setProgress(0);
        setError(null);
        setLocalSongFile(songFile || null);
    }
  }, [isOpen]);

  const handleRenderVideo = async () => {
    const fileToUse = localSongFile || songFile;
    if (!storyboard || !fileToUse) {
        setError("Missing storyboard or audio file. Please upload your song.");
        return;
    }
    setRenderState('processing');
    setProgress(0);
    setFinalVideoUrl(null);
    setError(null);

    try {
        const handleProgress = ({ progress, message }: { progress: number; message: string }) => {
            setProgress(progress * 100);
            setRenderStatusMessage(message);
        };
        const outputBlob = await renderVideo(
            storyboard,
            fileToUse,
            resolution,
            handleProgress,
            introEnabled ? introConfig : undefined,
            outroEnabled ? outroConfig : undefined
        );
        const url = URL.createObjectURL(outputBlob);
        setFinalVideoUrl(url);
        setRenderState('done');
    } catch (err) {
        console.error("Failed to render video with FFmpeg", err);
        const message = err instanceof Error ? err.message : "An unknown error occurred during rendering.";
        setError(message);
        setRenderState('error');
    }
  };

  const handlePreviewOverlays = async () => {
    const fileToUse = localSongFile || songFile;
    if (!storyboard || !fileToUse) {
      alert('Missing storyboard or audio file. Please upload your song.');
      return;
    }

    // Validate intro/outro configs
    if (introEnabled) {
      if (!introConfig.song_title.trim()) {
        alert('Please enter a song title for the intro.');
        return;
      }
      if (!introConfig.artist_name.trim()) {
        alert('Please enter an artist name for the intro.');
        return;
      }
    }

    if (outroEnabled) {
      if (outroConfig.credits.custom_credits.length === 0) {
        alert('Please enter at least one credit line for the outro.');
        return;
      }
    }

    try {
      setIsGeneratingPreview(true);

      // Create a preview using only the first 10 seconds of video
      const previewStoryboard = {
        ...storyboard,
        scenes: storyboard.scenes.slice(0, Math.min(3, storyboard.scenes.length)) // Use first 3 scenes for preview
      };

      const handleProgress = ({ progress, message }: { progress: number; message: string }) => {
        console.log(`Preview: ${message} (${Math.round(progress * 100)}%)`);
      };

      const outputBlob = await renderVideo(
        previewStoryboard,
        fileToUse,
        '720p', // Always use 720p for preview for speed
        handleProgress,
        introEnabled ? introConfig : undefined,
        outroEnabled ? outroConfig : undefined
      );

      const url = URL.createObjectURL(outputBlob);
      setPreviewVideoUrl(url);
      setShowPreviewModal(true);
    } catch (error) {
      console.error('Preview generation failed:', error);
      alert('Failed to generate preview. Please try again.');
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-brand-gray p-8 rounded-xl shadow-2xl shadow-black/30 border border-brand-light-gray/20 w-full max-w-lg m-4 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Export Final Music Video</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="space-y-6">
            <div>
                <label htmlFor="resolution-select" className="block text-sm font-medium text-gray-300 mb-1">Resolution</label>
                <select
                    id="resolution-select"
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value as any)}
                    disabled={renderState === 'processing'}
                    className="w-full bg-brand-dark border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan outline-none transition"
                >
                    <option value="720p">1280x720 (720p HD)</option>
                    <option value="1080p">1920x1080 (1080p Full HD)</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Audio File</label>
                <div className="flex items-center justify-between bg-brand-dark border border-gray-600 rounded-lg px-3 py-2">
                    <p className="text-sm text-gray-300 truncate mr-3">
                        {localSongFile ? `Selected: ${localSongFile.name}` : songFile ? `Selected: ${songFile.name}` : 'No audio selected'}
                    </p>
                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="audio/*,.mp3,.wav,.aac,.flac"
                            onChange={(e) => setLocalSongFile(e.target.files?.[0] || null)}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-brand-cyan text-brand-dark font-bold py-2 px-3 rounded-lg hover:bg-white transition-all"
                            disabled={renderState === 'processing'}
                        >
                            {localSongFile || songFile ? 'Replace' : 'Upload'}
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={introEnabled}
                            onChange={(e) => {
                                setIntroEnabled(e.target.checked);
                                setIntroConfig({ ...introConfig, enabled: e.target.checked });
                            }}
                            className="w-5 h-5 text-brand-cyan bg-brand-dark border-gray-600 rounded focus:ring-brand-cyan focus:ring-2"
                        />
                        <span className="text-lg font-semibold text-white">Add Intro Overlay</span>
                    </label>
                </div>
                
                {introEnabled && (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Song Title</label>
                            <input
                                type="text"
                                value={introConfig.song_title}
                                onChange={(e) => setIntroConfig({ ...introConfig, song_title: e.target.value })}
                                placeholder="Enter song title"
                                className="w-full px-3 py-2 bg-brand-dark border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan outline-none"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Artist Name</label>
                            <input
                                type="text"
                                value={introConfig.artist_name}
                                onChange={(e) => setIntroConfig({ ...introConfig, artist_name: e.target.value })}
                                placeholder="Enter artist name"
                                className="w-full px-3 py-2 bg-brand-dark border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan outline-none"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Custom Text (Optional)</label>
                            <input
                                type="text"
                                value={introConfig.custom_text || ''}
                                onChange={(e) => setIntroConfig({ ...introConfig, custom_text: e.target.value })}
                                placeholder="e.g., 'Official Music Video'"
                                className="w-full px-3 py-2 bg-brand-dark border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan outline-none"
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Style</label>
                                <select
                                    value={introConfig.style}
                                    onChange={(e) => setIntroConfig({ ...introConfig, style: e.target.value as IntroOverlayStyle })}
                                    className="w-full px-3 py-2 bg-brand-dark border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan outline-none"
                                >
                                    <option value="minimal">Minimal</option>
                                    <option value="cinematic">Cinematic</option>
                                    <option value="glitch">Glitch</option>
                                    <option value="neon">Neon</option>
                                    <option value="elegant">Elegant</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Animation</label>
                                <select
                                    value={introConfig.animation}
                                    onChange={(e) => setIntroConfig({ ...introConfig, animation: e.target.value as any })}
                                    className="w-full px-3 py-2 bg-brand-dark border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan outline-none"
                                >
                                    <option value="fade">Fade In</option>
                                    <option value="slide">Slide Up</option>
                                    <option value="zoom">Zoom In</option>
                                    <option value="typewriter">Typewriter</option>
                                </select>
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Duration (seconds)</label>
                            <input
                                type="number"
                                min="1"
                                max="10"
                                value={introConfig.duration}
                                onChange={(e) => setIntroConfig({ ...introConfig, duration: parseInt(e.target.value) || 3 })}
                                className="w-full px-3 py-2 bg-brand-dark border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan outline-none"
                            />
                        </div>
                    </div>
                )}
            </div>
            
            <div className="border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={outroEnabled}
                            onChange={(e) => {
                                setOutroEnabled(e.target.checked);
                                setOutroConfig({ ...outroConfig, enabled: e.target.checked });
                            }}
                            className="w-5 h-5 text-brand-cyan bg-brand-dark border-gray-600 rounded focus:ring-brand-cyan focus:ring-2"
                        />
                        <span className="text-lg font-semibold text-white">Add Outro/Credits</span>
                    </label>
                </div>
                
                {outroEnabled && (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Credits (one per line)</label>
                            <textarea
                                value={outroConfig.credits.custom_credits.join('\n')}
                                onChange={(e) => setOutroConfig({
                                    ...outroConfig,
                                    credits: {
                                        ...outroConfig.credits,
                                        custom_credits: e.target.value.split('\n').filter(l => l.trim())
                                    }
                                })}
                                placeholder="Directed by John Doe&#10;Produced by Jane Smith&#10;Music by Artist Name"
                                rows={5}
                                className="w-full px-3 py-2 bg-brand-dark border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan outline-none resize-none"
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Style</label>
                                <select
                                    value={outroConfig.style}
                                    onChange={(e) => setOutroConfig({ ...outroConfig, style: e.target.value as OutroOverlayStyle })}
                                    className="w-full px-3 py-2 bg-brand-dark border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan outline-none"
                                >
                                    <option value="minimal">Minimal</option>
                                    <option value="cinematic">Cinematic</option>
                                    <option value="scroll-credits">Scrolling Credits</option>
                                    <option value="modern">Modern</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Duration (seconds)</label>
                                <input
                                    type="number"
                                    min="3"
                                    max="15"
                                    value={outroConfig.duration}
                                    onChange={(e) => setOutroConfig({ ...outroConfig, duration: parseInt(e.target.value) || 5 })}
                                    className="w-full px-3 py-2 bg-brand-dark border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan outline-none"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <p className="text-xs text-gray-500">
                The final video will be rendered and combined with your song. This process happens entirely in your browser using FFmpeg.wasm and may take several minutes depending on video length and your computer's performance.
            </p>
        </div>

        {renderState === 'idle' && (
             <div className="mt-8 text-center">
                <button 
                    onClick={handleRenderVideo}
                    className="w-full flex items-center justify-center bg-brand-cyan text-brand-dark font-bold py-3 px-4 rounded-lg hover:bg-white transition-all transform hover:scale-105"
                    disabled={!localSongFile && !songFile}
                >
                    Render Final Video
                </button>
             </div>
        )}

        {renderState === 'processing' && (
            <div className="mt-8 text-center">
                <div className="flex items-center justify-center text-white mb-4">
                    <Spinner />
                    <p className="font-semibold">{renderStatusMessage}</p>
                </div>
        <div className="w-full bg-brand-light-gray rounded-full h-4">
          {/** Use Tailwind arbitrary width class to avoid inline styles (e.g. w-[50%]) */}
          <div
            className={`bg-brand-cyan h-4 rounded-full transition-all duration-500 ${`w-[${Math.round(progress)}%]`}`}
            aria-hidden
          />
        </div>
                <p className="text-sm text-gray-400 mt-2">{Math.round(progress)}% complete</p>
            </div>
        )}

        {renderState === 'done' && finalVideoUrl && (
            <div className="mt-8 text-center p-4 bg-green-900/50 border border-green-500 rounded-lg">
                <h3 className="text-lg font-bold text-green-300 mb-2">Render Complete!</h3>
                <p className="text-sm text-gray-300 mb-4">Your final music video is ready to be downloaded.</p>
                <a
                    href={finalVideoUrl}
                    download={`ai-music-video-${storyboard.title.replace(/\s/g, '_')}.mp4`}
                    className="w-full inline-flex items-center justify-center bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-all transform hover:scale-105"
                >
                    <DownloadIcon /> Download Video (.mp4)
                </a>
            </div>
        )}
        
        {renderState === 'error' && (
             <div className="mt-8 text-center p-4 bg-red-900/50 border border-red-500 rounded-lg">
                <h3 className="text-lg font-bold text-red-300 mb-2">Render Failed</h3>
                <p className="text-sm text-gray-300 mb-4 font-mono bg-brand-dark p-2 rounded">{error}</p>
                <button 
                    onClick={handleRenderVideo}
                    className="w-full flex items-center justify-center bg-brand-magenta text-white font-bold py-3 px-4 rounded-lg hover:opacity-80 transition-all"
                >
                    Try Rendering Again
                </button>
            </div>
        )}

        <div className="mt-6 flex justify-end">
          <button 
            onClick={onClose}
            className="bg-brand-dark border border-gray-600 hover:border-brand-light-gray text-white font-bold py-2 px-6 rounded-lg transition-all"
          >
            Close
          </button>
        </div>
      </div>
      
      {/* Preview Modal */}
      {showPreviewModal && previewVideoUrl && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60]"
          onClick={() => {
            setShowPreviewModal(false);
            if (previewVideoUrl) {
              URL.revokeObjectURL(previewVideoUrl);
              setPreviewVideoUrl(null);
            }
          }}
        >
          <div
            className="bg-brand-gray p-6 rounded-xl shadow-2xl border border-brand-light-gray/20 w-full max-w-4xl m-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Intro/Outro Preview</h3>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  if (previewVideoUrl) {
                    URL.revokeObjectURL(previewVideoUrl);
                    setPreviewVideoUrl(null);
                  }
                }}
                className="text-gray-400 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="bg-black rounded-lg overflow-hidden">
              <video
                controls
                autoPlay
                preload="metadata"
                crossOrigin="anonymous"
                className="w-full"
                style={{ maxHeight: '70vh' }}
              >
                {previewVideoUrl && <source src={previewVideoUrl} type="video/mp4" />}
              </video>
            </div>
            
            <p className="text-sm text-gray-400 mt-4 text-center">
              This is a preview of your intro/outro overlays. The final video will include all scenes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportModal;
