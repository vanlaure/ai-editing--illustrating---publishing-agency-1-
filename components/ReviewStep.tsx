import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Bibles, Storyboard, StoryboardShot, ExecutiveProducerFeedback } from '../types';
import Spinner from './Spinner';
import ExportModal from './ExportModal';
import ExecutiveProducerFeedbackDisplay from './ExecutiveProducerFeedbackDisplay';
import { renderVideo, waitForFFmpeg, isFFmpegAvailable } from '../services/ffmpegService';

interface ReviewStepProps {
  songFile: File | null;
  storyboard: Storyboard | null;
  bibles: Bibles | null;
  onRestart: () => void;
  isProcessing: boolean;
  isReviewing: boolean;
  executiveProducerFeedback: ExecutiveProducerFeedback | null;
}

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const ExportIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const RestartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 4l1.5 1.5A9 9 0 0120.5 16" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 20l-1.5-1.5A9 9 0 003.5 8" />
    </svg>
);

const ReviewStep: React.FC<ReviewStepProps> = ({ songFile, storyboard, bibles, onRestart, isProcessing, isReviewing, executiveProducerFeedback }) => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const allShots = storyboard?.scenes.flatMap(scene => scene.shots) || [];

  const [previewState, setPreviewState] = useState<'idle' | 'rendering' | 'ready' | 'error'>('idle');
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderStatusMessage, setRenderStatusMessage] = useState('Initializing...');
  const [renderError, setRenderError] = useState<string | null>(null);
  const [activeShotId, setActiveShotId] = useState<string | null>(allShots[0]?.id || null);
  const [uploadedAudioFile, setUploadedAudioFile] = useState<File | null>(null);
  const [ffmpegReady, setFfmpegReady] = useState(false);

  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);

  // Check FFmpeg availability on mount
  useEffect(() => {
    const checkFFmpeg = async () => {
      if (isFFmpegAvailable()) {
        setFfmpegReady(true);
      } else {
        const available = await waitForFFmpeg(); // Wait up to 30 seconds (default)
        setFfmpegReady(available);
        if (!available) {
          console.warn('FFmpeg libraries did not load within timeout period');
        }
      }
    };
    checkFFmpeg();
  }, []);
  
  const handleAudioFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedAudioFile(file);
      setPreviewState('idle'); // Reset to trigger re-render
    }
  };

  const generatePreviewVideo = useCallback(async () => {
    if (!storyboard) return;
    
    const audioFile = uploadedAudioFile || songFile;
    
    // If no song file (e.g., loaded from production JSON), skip preview rendering
    if (!audioFile) {
      setPreviewState('error');
      setRenderError('Audio file not available. Production files loaded from JSON do not include the original audio file. Please upload the original audio file to generate a preview.');
      return;
    }

    // Check if FFmpeg is ready
    if (!ffmpegReady) {
      setPreviewState('error');
      setRenderError('FFmpeg libraries are still loading. Please wait a moment and try again, or refresh the page if this persists.');
      return;
    }

    setPreviewState('rendering');
    setRenderProgress(0);
    setPreviewVideoUrl(null);
    setRenderError(null);

    try {
      const handleProgress = ({ progress, message }: { progress: number; message: string }) => {
          setRenderProgress(progress * 100);
          setRenderStatusMessage(message);
      };

      const outputBlob = await renderVideo(storyboard, audioFile, '720p', handleProgress);
      const url = URL.createObjectURL(outputBlob);
      setPreviewVideoUrl(url);
      setPreviewState('ready');

    } catch (err) {
        console.error("Failed to render preview video with FFmpeg", err);
        const message = err instanceof Error ? err.message : "An unknown error occurred during preview rendering.";
        setRenderError(message);
        setPreviewState('error');
    }
  }, [songFile, storyboard, uploadedAudioFile, ffmpegReady]);

  useEffect(() => {
    if (storyboard && previewState === 'idle') {
      // Always attempt to generate preview when in idle state
      // generatePreviewVideo will handle the case when songFile is null
      generatePreviewVideo();
    }
  }, [storyboard, previewState, generatePreviewVideo]);
  
  useEffect(() => {
    const video = previewVideoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      const shot = allShots.find(s => video.currentTime >= s.start && video.currentTime < s.end);
      if (shot && shot.id !== activeShotId) {
        setActiveShotId(shot.id);
      }
    };
    
    video.addEventListener('timeupdate', onTimeUpdate);
    return () => {
        if (video) {
          video.removeEventListener('timeupdate', onTimeUpdate);
        }
    };
  }, [previewVideoUrl, allShots, activeShotId]);


  const handleSeekToList = (time: number) => {
    if (previewVideoRef.current) {
        previewVideoRef.current.currentTime = time;
        previewVideoRef.current.play();
    }
  };
  
  const downloadJSON = (data: object, filename: string) => {
    if (!data) return;
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
  
   const renderPlayer = () => {
      switch(previewState) {
        case 'rendering':
            return (
                <div className="w-full h-full flex flex-col items-center justify-center text-white bg-brand-dark">
                    <Spinner />
                    <p className="font-semibold mt-4 mb-2">{renderStatusMessage}</p>
          <div className="w-full max-w-sm bg-brand-light-gray rounded-full h-2.5">
            {/* Avoid inline styles by using Tailwind arbitrary width class */}
            <div className={`bg-brand-cyan h-2.5 rounded-full ${`w-[${Math.round(renderProgress)}%]`}`}></div>
          </div>
                    <p className="text-sm text-gray-400 mt-2">{Math.round(renderProgress)}%</p>
                </div>
            );
        case 'ready':
            return (
                <video 
                    ref={previewVideoRef}
                    src={previewVideoUrl!}
                    controls
                    className="w-full h-full object-cover bg-black"
                />
            );
        case 'error':
            return (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 bg-red-900/50 text-red-300">
                    <h4 className="font-bold text-lg mb-2">Preview Not Available</h4>
                    <p className="text-sm bg-brand-dark p-4 rounded mb-4 max-w-2xl">{renderError}</p>
                    
                    {!songFile && !uploadedAudioFile ? (
                        <div className="flex flex-col items-center gap-3">
                            <input
                                ref={audioFileInputRef}
                                type="file"
                                accept="audio/*,.mp3,.wav,.aac,.flac"
                                onChange={handleAudioFileUpload}
                                className="hidden"
                            />
                            <button
                                onClick={() => audioFileInputRef.current?.click()}
                                className="bg-brand-cyan text-brand-dark font-bold py-3 px-6 rounded-lg hover:bg-white transition-all flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                </svg>
                                Upload Original Audio File
                            </button>
                        </div>
                    ) : (
                        <button onClick={generatePreviewVideo} className="bg-brand-magenta text-white font-bold py-2 px-4 rounded-lg hover:opacity-80">
                            Try Again
                        </button>
                    )}
                    
                    <p className="text-xs text-gray-400 mt-4 max-w-xl">
                        You can still view individual clips in the playlist below and export them using the buttons at the bottom of the page.
                    </p>
                </div>
            );
        case 'idle':
        default:
            return (
                <div className="w-full h-full flex flex-col items-center justify-center text-white bg-brand-dark">
                    <Spinner />
                    <p className="font-semibold mt-4">Initializing Preview Engine...</p>
                </div>
            );
      }
  }

  if (!storyboard) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <Spinner />
            <h2 className="text-2xl font-bold mt-6 mb-2 text-white">Loading review...</h2>
        </div>
    );
  }

  return (
    <>
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        storyboard={storyboard}
        songFile={uploadedAudioFile || songFile}
      />
      <div className="flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-2 text-white">Final Review & Export</h2>
        <p className="text-gray-400 mb-8">Review the final sequence and the AI Executive Producer's notes.</p>
        
        <div className="w-full max-w-7xl mx-auto mb-8">
            {isReviewing ? (
                <div className="flex flex-col items-center justify-center p-8 bg-brand-dark/50 rounded-lg border border-brand-light-gray text-center min-h-[200px]">
                    <Spinner />
                    <h3 className="text-lg font-semibold mt-4">AI Executive Producer is reviewing your project...</h3>
                    <p className="text-sm text-gray-400">This may take a moment.</p>
                </div>
            ) : executiveProducerFeedback ? (
                <ExecutiveProducerFeedbackDisplay feedback={executiveProducerFeedback} />
            ) : null}
        </div>


        <div className="w-full flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
                {/* Always-visible audio upload bar to avoid getting stuck */}
                <div className="flex items-center justify-between mb-3 bg-brand-dark/60 border border-brand-light-gray/30 rounded-lg p-3">
                  <div className="text-sm text-gray-300">
                    {uploadedAudioFile ? (
                      <span>Audio loaded: <span className="font-semibold text-white">{uploadedAudioFile.name}</span></span>
                    ) : songFile ? (
                      <span>Audio loaded from project</span>
                    ) : (
                      <span>No audio loaded. Upload your original song.</span>
                    )}
                  </div>
                  <div>
                    <input
                      ref={audioFileInputRef}
                      type="file"
                      accept="audio/*,.mp3,.wav,.aac,.flac"
                      onChange={handleAudioFileUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => audioFileInputRef.current?.click()}
                      className="bg-brand-cyan text-brand-dark font-bold py-2 px-4 rounded-lg hover:bg-white transition-all"
                    >
                      {uploadedAudioFile || songFile ? 'Replace Audio' : 'Upload Audio'}
                    </button>
                  </div>
                </div>

                <div className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl shadow-black/50 sticky top-4">
                  {renderPlayer()}
                </div>
            </div>
            <div className="w-full lg:w-1/3 max-h-[70vh] overflow-y-auto pr-2">
                <h3 className="text-lg font-bold mb-4">Clip Playlist</h3>
                <div className="space-y-3">
                  {allShots.map(shot => (
                    <button 
                      key={shot.id} 
                      onClick={() => handleSeekToList(shot.start)}
                      className={`w-full text-left p-3 rounded-lg flex items-center gap-4 transition-colors ${activeShotId === shot.id ? 'bg-brand-cyan/20 ring-2 ring-brand-cyan' : 'bg-brand-light-gray hover:bg-brand-light-gray/70'}`}
                    >
                      <img src={shot.preview_image_url} alt={`Thumb for ${shot.subject}`} className="w-24 h-14 object-cover rounded flex-shrink-0 bg-brand-dark" />
                      <div>
                        <p className="font-bold text-white">Shot {shot.id}</p>
                        <p className="text-xs text-gray-300">{shot.subject}</p>
                      </div>
                      {shot.clip_url && <div className="ml-auto w-5 h-5 rounded-full bg-green-500 flex-shrink-0" title="Clip generated"></div>}
                    </button>
                  ))}
                </div>
            </div>
        </div>


        <div className="w-full mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
          <button onClick={() => setIsExportModalOpen(true)} className="bg-brand-cyan text-brand-dark font-bold py-3 px-4 rounded-lg flex items-center justify-center hover:bg-white transition-all transform hover:scale-105">
              <ExportIcon /> Export Final Video
          </button>
          <button onClick={() => downloadJSON(storyboard!, 'storyboard.json')} className="bg-brand-light-gray text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center hover:bg-gray-600 transition-all transform hover:scale-105">
              <DownloadIcon /> Storyboard (JSON)
          </button>
          <button onClick={() => downloadJSON(bibles!, 'bibles.json')} className="bg-brand-light-gray text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center hover:bg-gray-600 transition-all transform hover:scale-105">
              <DownloadIcon /> Bibles (JSON)
          </button>
          <button onClick={onRestart} className="bg-brand-magenta text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center hover:opacity-80 transition-all transform hover:scale-105">
              <RestartIcon /> Create Another
          </button>
        </div>
      </div>
    </>
  );
};

export default ReviewStep;
