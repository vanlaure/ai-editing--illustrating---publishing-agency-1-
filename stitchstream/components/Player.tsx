
import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { VideoClip, TitleDesign, ClosingCredits, CinematicEffects } from '../types';
import { formatDuration, downloadBlob } from '../utils/videoUtils';
import { VIDEO_FILTERS, FONT_STYLES } from '../constants';

export interface PlayerRef {
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  playSequence: () => void;
  pauseSequence: () => void;
}

interface PlayerProps {
  clips: VideoClip[];
  activeClipId: string | undefined;
  activeFilter: string; // Key from VIDEO_FILTERS
  activeTransition: 'cut' | 'dissolve' | 'fade_black'; // Default/Fallback
  transitionMap?: ('cut' | 'dissolve' | 'fade_black')[]; // Granular list
  titleDesign?: TitleDesign;
  closingCredits?: ClosingCredits;
  cinematicEffects?: CinematicEffects;
  backingTrackUrl?: string;
  onClipChange: (id: string) => void;
  onPlaybackComplete: () => void;
}

const TRANSITION_DURATION = 1000; // ms
const TITLE_DURATION = 4000; // ms to show title

const Player = forwardRef<PlayerRef, PlayerProps>(({ clips, activeClipId, activeFilter, activeTransition, transitionMap, titleDesign, closingCredits, cinematicEffects, backingTrackUrl, onClipChange, onPlaybackComplete }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const grainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Ghost canvas to hold the last frame of the previous video for transitions
  const ghostCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Audio context for mixing
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const destNodeRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const backingAudioRef = useRef<HTMLAudioElement | null>(null);
  const backingSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  
  // Transition state
  const transitionStartTimeRef = useRef<number>(0);
  const isTransitioningRef = useRef<boolean>(false);
  const currentTransitionTypeRef = useRef<string>('cut');
  const prevClipIdRef = useRef<string | undefined>(undefined);
  
  const requestRef = useRef<number>();

  // Initialize Audio Context & Analyser
  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContext();
      destNodeRef.current = audioCtxRef.current.createMediaStreamDestination();
      
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
    }

    if (backingTrackUrl && audioCtxRef.current && destNodeRef.current && !backingAudioRef.current) {
        const backing = new Audio(backingTrackUrl);
        backing.crossOrigin = 'anonymous';
        backingAudioRef.current = backing;

        try {
            backingSourceRef.current = audioCtxRef.current.createMediaElementSource(backing);
            if (analyserRef.current) {
                backingSourceRef.current.connect(analyserRef.current);
            }
            backingSourceRef.current.connect(audioCtxRef.current.destination);
            backingSourceRef.current.connect(destNodeRef.current);
        } catch (e) {
            console.warn('Failed to wire backing track into audio graph', e);
        }
    }
  };

  // Generate Film Grain Pattern (Once)
  useEffect(() => {
      if (!grainCanvasRef.current) {
          const gc = document.createElement('canvas');
          gc.width = 512;
          gc.height = 512;
          const ctx = gc.getContext('2d');
          if (ctx) {
              const w = gc.width;
              const h = gc.height;
              const idata = ctx.createImageData(w, h);
              const buffer32 = new Uint32Array(idata.data.buffer);
              const len = buffer32.length;
              for (let i = 0; i < len; i++) {
                  if (Math.random() < 0.5) {
                      buffer32[i] = 0xff000000; // Black
                  } else {
                      buffer32[i] = 0x00000000; // Transparent
                  }
              }
              ctx.putImageData(idata, 0, 0);
          }
          grainCanvasRef.current = gc;
      }
  }, []);

  useEffect(() => {
    setTotalDuration(clips.reduce((acc, c) => acc + c.duration, 0));
  }, [clips]);

  useEffect(() => {
    if (videoRef.current) {
        videoRef.current.muted = !!backingTrackUrl;
    }
  }, [backingTrackUrl]);

  // Handle active clip changes and setup transitions
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeClipId) return;

    // Determine specific transition logic
    let specificTransition = activeTransition;
    
    const currentIdx = clips.findIndex(c => c.id === activeClipId);
    const prevIdx = clips.findIndex(c => c.id === prevClipIdRef.current);

    // If we have a smart map and this is a sequential forward play
    if (transitionMap && prevIdx !== -1 && currentIdx === prevIdx + 1 && transitionMap[prevIdx]) {
        specificTransition = transitionMap[prevIdx];
    } else if (prevIdx === -1 || currentIdx !== prevIdx + 1) {
        // Jumping around timeline or first load -> hard cut
        specificTransition = 'cut';
    }

    currentTransitionTypeRef.current = specificTransition;

    // 1. Capture Ghost Frame BEFORE switching if needed
    if (video.readyState > 0 && specificTransition !== 'cut' && prevClipIdRef.current) {
        if (!ghostCanvasRef.current) {
            ghostCanvasRef.current = document.createElement('canvas');
            ghostCanvasRef.current.width = 1280;
            ghostCanvasRef.current.height = 720;
        }
        const gCtx = ghostCanvasRef.current.getContext('2d');
        if (gCtx) {
            // Apply current filter to ghost frame so transition matches look
            const filterString = VIDEO_FILTERS[activeFilter] || 'none';
            gCtx.filter = filterString;
            
            // Draw current video state to ghost
            gCtx.drawImage(video, 0, 0, 1280, 720);
            gCtx.filter = 'none'; // reset
            
            isTransitioningRef.current = true;
            transitionStartTimeRef.current = performance.now();
        }
    } else {
        isTransitioningRef.current = false;
    }

    // 2. Load New Clip
    const clip = clips.find(c => c.id === activeClipId);
    if (clip) {
      video.src = clip.url;
      video.load();
      if (isPlaying) {
        // Small timeout to ensure load starts before play
        const p = video.play().catch(console.error);
      }
    }
    
    prevClipIdRef.current = activeClipId;
  }, [activeClipId, clips, activeTransition, transitionMap, activeFilter]); 

  useEffect(() => {
     if (videoRef.current && audioCtxRef.current && !sourceNodeRef.current) {
         try {
             sourceNodeRef.current = audioCtxRef.current.createMediaElementSource(videoRef.current);
             
             // Connect to Visualizer
             if (analyserRef.current) {
                 sourceNodeRef.current.connect(analyserRef.current);
             }

             // Connect to Destination (Speakers + Recorder)
             if (analyserRef.current) {
                // If using analyser, pass through it
                analyserRef.current.connect(audioCtxRef.current.destination);
                if (destNodeRef.current) analyserRef.current.connect(destNodeRef.current);
             } else {
                 sourceNodeRef.current.connect(audioCtxRef.current.destination);
                 if (destNodeRef.current) sourceNodeRef.current.connect(destNodeRef.current);
             }
         } catch(e) {
             // Ignore re-connection errors
         }
     }
  }, [videoRef.current, audioCtxRef.current]);


  // Rendering Loop for Canvas (Visual Stitching)
  const drawFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = 1280;
        canvas.height = 720;
        
        // Apply filter to context
        const filterString = VIDEO_FILTERS[activeFilter] || 'none';
        ctx.filter = filterString;

        // Helper to draw video contained with Ken Burns Effect
        const drawContained = (source: CanvasImageSource, isLiveVideo: boolean = false) => {
            // Draw black bg
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            const vWidth = source instanceof HTMLVideoElement ? source.videoWidth : (source as HTMLCanvasElement).width;
            const vHeight = source instanceof HTMLVideoElement ? source.videoHeight : (source as HTMLCanvasElement).height;
            
            if (!vWidth || !vHeight) return;

            // KEN BURNS CALCULATION
            let scale = 1.0;
            if (isLiveVideo && source instanceof HTMLVideoElement && source.duration) {
                const progress = source.currentTime / source.duration;
                // Subtle zoom
                scale = 1.0 + (progress * 0.08); 
            }

            const vRatio = vWidth / vHeight;
            const cRatio = canvas.width / canvas.height;
            let baseW, baseH, baseX, baseY;

            // Calculate 'contain' dimensions
            if (vRatio > cRatio) {
                baseW = canvas.width;
                baseH = canvas.width / vRatio;
                baseX = 0;
                baseY = (canvas.height - baseH) / 2;
            } else {
                baseH = canvas.height;
                baseW = canvas.height * vRatio;
                baseX = (canvas.width - baseW) / 2;
                baseY = 0;
            }

            // Apply Scale (Ken Burns) from center
            const scaledW = baseW * scale;
            const scaledH = baseH * scale;
            const scaledX = baseX - (scaledW - baseW) / 2;
            const scaledY = baseY - (scaledH - baseH) / 2;

            ctx.drawImage(source, scaledX, scaledY, scaledW, scaledH);
        }

        // --- TRANSITION LOGIC ---
        let drawn = false;
        const currentTransition = currentTransitionTypeRef.current;

        if (isTransitioningRef.current && ghostCanvasRef.current && currentTransition !== 'cut') {
            const now = performance.now();
            const elapsed = now - transitionStartTimeRef.current;
            
            if (elapsed < TRANSITION_DURATION) {
                // We are in transition
                drawn = true;
                const progress = elapsed / TRANSITION_DURATION; // 0 to 1

                if (currentTransition === 'dissolve') {
                    // Draw New (Bottom)
                    if (!video.paused && !video.ended && video.readyState >= 2) {
                        drawContained(video, true);
                    } else {
                        ctx.fillStyle = 'black'; 
                        ctx.fillRect(0,0,canvas.width, canvas.height);
                    }

                    // Draw Old (Top) with fading opacity
                    ctx.globalAlpha = 1 - progress;
                    ctx.filter = 'none'; 
                    drawContained(ghostCanvasRef.current, false);
                    ctx.filter = filterString; 
                    ctx.globalAlpha = 1.0;
                } 
                else if (currentTransition === 'fade_black') {
                    if (progress < 0.5) {
                        // Fade out old
                        const fadeOutProgress = progress * 2;
                        ctx.filter = 'none';
                        drawContained(ghostCanvasRef.current, false);
                        
                        // Overlay Black
                        ctx.fillStyle = `rgba(0,0,0,${fadeOutProgress})`;
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.filter = filterString;
                    } else {
                        // Fade in new
                        const fadeInProgress = (progress - 0.5) * 2;
                         if (!video.paused && !video.ended && video.readyState >= 2) {
                            drawContained(video, true);
                        }
                        
                        // Overlay Black fading out
                        ctx.filter = 'none';
                        ctx.fillStyle = `rgba(0,0,0,${1 - fadeInProgress})`;
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.filter = filterString;
                    }
                }
            } else {
                isTransitioningRef.current = false;
            }
        }

        // Normal Draw
        if (!drawn) {
            if (!video.paused && !video.ended && video.readyState >= 2) {
                drawContained(video, true);
            } else if (isTransitioningRef.current && ghostCanvasRef.current) {
                // New video loading, stick on ghost frame
                ctx.filter = 'none';
                drawContained(ghostCanvasRef.current, false);
                ctx.filter = filterString;
            }
        }
        
        ctx.filter = 'none'; // Clear filters for UI/Overlays

        // --- VFX ENGINE ---
        // 1. Film Grain
        if (cinematicEffects?.applyGrain && grainCanvasRef.current) {
            ctx.save();
            ctx.globalAlpha = 0.08;
            ctx.globalCompositeOperation = 'overlay';
            // Tile the grain
            const ptrn = ctx.createPattern(grainCanvasRef.current, 'repeat');
            if (ptrn) {
                ctx.fillStyle = ptrn;
                // Move pattern slightly for life
                ctx.translate(Math.random() * 50, Math.random() * 50);
                ctx.fillRect(-50, -50, canvas.width + 50, canvas.height + 50);
            }
            ctx.restore();
        }

        // 2. Vignette
        if (cinematicEffects?.applyVignette) {
            ctx.save();
            const gradient = ctx.createRadialGradient(
                canvas.width / 2, canvas.height / 2, canvas.height * 0.3,
                canvas.width / 2, canvas.height / 2, canvas.height * 0.8
            );
            gradient.addColorStop(0, "transparent");
            gradient.addColorStop(1, "rgba(0,0,0,0.6)");
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
        }

        // 3. Cinema Bars (Letterbox)
        if (cinematicEffects?.applyLetterbox) {
            const barHeight = canvas.height * 0.12; // approx for 2.35:1
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, canvas.width, barHeight);
            ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);
        }

        // --- AUDIO VISUALIZER ---
        if (isPlaying && analyserRef.current && dataArrayRef.current) {
            analyserRef.current.getByteFrequencyData(dataArrayRef.current);
            const bufferLength = analyserRef.current.frequencyBinCount;
            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barX = 0;

            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = activeFilter === 'bw' ? 'rgba(255,255,255,0.2)' : 'rgba(100,200,255,0.2)';

            // Draw at bottom
            const bottomY = cinematicEffects?.applyLetterbox ? canvas.height - (canvas.height * 0.12) : canvas.height;
            
            ctx.beginPath();
            ctx.moveTo(0, bottomY);
            
            for(let i = 0; i < bufferLength; i++) {
                const barHeight = (dataArrayRef.current[i] / 255) * 100;
                ctx.lineTo(barX, bottomY - barHeight);
                barX += barWidth + 1;
            }
            ctx.lineTo(canvas.width, bottomY);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }


        // --- TITLE OVERLAY LOGIC ---
        // Only show if titleDesign exists AND we are on the very first clip of the timeline
        if (titleDesign && activeClipId === clips[0]?.id && !video.paused) {
            const currentTime = video.currentTime;
            
            if (currentTime < TITLE_DURATION / 1000) {
                let alpha = 1.0;
                
                // Fade In (0 - 1s)
                if (currentTime < 1) {
                    alpha = currentTime;
                }
                // Fade Out (3s - 4s)
                else if (currentTime > 3) {
                    alpha = 1 - (currentTime - 3);
                }
                
                if (alpha > 0) {
                    ctx.save();
                    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
                    ctx.fillStyle = titleDesign.color || '#ffffff';
                    ctx.font = FONT_STYLES[titleDesign.style] || FONT_STYLES['modern'];
                    
                    // Shadow for visibility
                    ctx.shadowColor = 'rgba(0,0,0,0.8)';
                    ctx.shadowBlur = 15;
                    ctx.shadowOffsetX = 2;
                    ctx.shadowOffsetY = 2;

                    const text = titleDesign.text;
                    const metrics = ctx.measureText(text);
                    const textWidth = metrics.width;
                    
                    let x = canvas.width / 2;
                    let y = canvas.height / 2;

                    if (titleDesign.position === 'bottom_left') {
                        x = 60 + textWidth / 2; // slight padding
                        y = canvas.height - 80;
                    } else if (titleDesign.position === 'bottom_center') {
                        x = canvas.width / 2;
                        y = canvas.height - 80;
                    } else {
                        // center
                        x = canvas.width / 2;
                        y = canvas.height / 2;
                    }

                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(text, x, y);
                    ctx.restore();
                }
            }
        }

        // --- CLOSING CREDITS LOGIC ---
        if (closingCredits && closingCredits.enabled && activeClipId === clips[clips.length - 1]?.id && !video.paused) {
          const currentTime = video.currentTime;
          const duration = video.duration;
          const timeLeft = duration - currentTime;

          // Start credits 5 seconds before end
          if (timeLeft < 5) {
             const progress = (5 - timeLeft) / 5; // 0 to 1 over last 5 seconds
             
             // Fade background to black gently
             const bgAlpha = Math.min(0.8, progress);
             ctx.fillStyle = `rgba(0,0,0,${bgAlpha})`;
             ctx.fillRect(0, 0, canvas.width, canvas.height);

             ctx.save();
             ctx.fillStyle = '#ffffff';
             ctx.textAlign = 'center';
             ctx.textBaseline = 'middle';
             ctx.shadowColor = 'rgba(0,0,0,0.8)';
             ctx.shadowBlur = 10;
             
             const startY = canvas.height + 50;
             const endY = canvas.height / 2 - (closingCredits.lines.length * 40) / 2;
             
             // Scroll up effect
             const currentY = startY - (progress * (startY - endY));
             
             closingCredits.lines.forEach((line, index) => {
                const lineY = currentY + (index * 60);
                
                // Role
                ctx.font = '16px "Inter", sans-serif';
                ctx.globalAlpha = Math.min(1, progress * 2);
                ctx.fillStyle = '#94a3b8'; // slate-400
                ctx.fillText(line.role.toUpperCase(), canvas.width / 2, lineY);

                // Name
                ctx.font = 'bold 32px "Inter", sans-serif';
                ctx.fillStyle = '#ffffff';
                ctx.fillText(line.name, canvas.width / 2, lineY + 28);
             });
             
             ctx.restore();
          }
        }
      }
    }
    requestRef.current = requestAnimationFrame(drawFrame);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(drawFrame);
    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [activeFilter, titleDesign, closingCredits, cinematicEffects]); 

  const handleVideoEnded = () => {
    const currentIndex = clips.findIndex(c => c.id === activeClipId);
    if (currentIndex >= 0 && currentIndex < clips.length - 1) {
      // Play next
      onClipChange(clips[currentIndex + 1].id);
    } else {
      setIsPlaying(false);
      syncBackingTrack(false);
      onPlaybackComplete();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
      }
    }
  };

  const handleTimeUpdate = () => {
      if (!videoRef.current) return;
      const currentClipIndex = clips.findIndex(c => c.id === activeClipId);
      if (currentClipIndex === -1) return;

      let timeBefore = 0;
      for (let i = 0; i < currentClipIndex; i++) {
          timeBefore += clips[i].duration;
      }
      setProgress(timeBefore + videoRef.current.currentTime);
  };

  const syncBackingTrack = (shouldPlay: boolean) => {
      if (!backingAudioRef.current) return;
      if (shouldPlay) {
          const targetTime = Math.min(backingAudioRef.current.duration || progress, progress);
          backingAudioRef.current.currentTime = targetTime;
          backingAudioRef.current.play().catch(e => console.warn('Backing track play failed', e));
      } else {
          backingAudioRef.current.pause();
      }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      syncBackingTrack(false);
    } else {
      initAudio();
      if (audioCtxRef.current?.state === 'suspended') {
          audioCtxRef.current.resume();
      }
      video.play().catch(e => console.error("Play failed", e));
      syncBackingTrack(true);
    }
    setIsPlaying(!isPlaying);
  };

  useImperativeHandle(ref, () => ({
    playSequence: () => {
        if (!clips.length) return;
        if (!activeClipId) onClipChange(clips[0].id);
        
        setIsPlaying(true);
        setTimeout(() => {
            initAudio();
            if (audioCtxRef.current?.state === 'suspended') {
                audioCtxRef.current.resume();
            }
            if (videoRef.current) {
                videoRef.current.play();
            }
            syncBackingTrack(true);
        }, 100);
    },
    pauseSequence: () => {
        setIsPlaying(false);
        if (videoRef.current) videoRef.current.pause();
        syncBackingTrack(false);
    },
    startRecording: async () => {
        if (!canvasRef.current || !clips.length) return;
        
        initAudio();
        if (audioCtxRef.current?.state === 'suspended') {
            await audioCtxRef.current.resume();
        }

        const canvasStream = canvasRef.current.captureStream(30);
        
        if (destNodeRef.current) {
            const audioTracks = destNodeRef.current.stream.getAudioTracks();
            if (audioTracks.length > 0) {
                canvasStream.addTrack(audioTracks[0]);
            }
        }

        recordedChunks.current = [];
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
            ? 'video/webm;codecs=vp9' 
            : 'video/webm';
        
        const recorder = new MediaRecorder(canvasStream, {
            mimeType,
            videoBitsPerSecond: 8000000
        });

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) recordedChunks.current.push(e.data);
        };

        recorder.onstop = () => {
            const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
            downloadBlob(blob, 'creative_stitch.webm');
        };

        mediaRecorderRef.current = recorder;
        recorder.start();

        onClipChange(clips[0].id);
        setIsPlaying(true);
        setTimeout(() => {
             if (videoRef.current) {
                 videoRef.current.currentTime = 0;
                 videoRef.current.play();
             }
             syncBackingTrack(true);
        }, 200);
    },
    stopRecording: () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        setIsPlaying(false);
        if (videoRef.current) videoRef.current.pause();
        syncBackingTrack(false);
    }
  }));

  // Helper to get current transition label for UI
  const currentT = currentTransitionTypeRef.current;
  const tLabel = currentT === 'cut' ? null : (currentT === 'dissolve' ? 'Cross Dissolve' : 'Fade to Black');

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl group border border-slate-800">
      <video
        ref={videoRef}
        className="hidden"
        onEnded={handleVideoEnded}
        onTimeUpdate={handleTimeUpdate}
        playsInline
        crossOrigin="anonymous"
      />

      <canvas 
        ref={canvasRef} 
        className="w-full h-full object-contain"
      />

      {/* Controls Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
          <div className="w-full h-1 bg-white/20 rounded-full mb-4 cursor-pointer overflow-hidden backdrop-blur-sm">
              <div 
                className="h-full bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                style={{ width: `${totalDuration > 0 ? (progress / totalDuration) * 100 : 0}%` }}
              />
          </div>

          <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                  <button 
                    onClick={togglePlay}
                    className="p-3 bg-white text-black rounded-full hover:bg-blue-400 hover:text-white transition-all transform hover:scale-105 shadow-lg"
                  >
                      {isPlaying ? (
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                      ) : (
                          <svg className="w-6 h-6 pl-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      )}
                  </button>
                  <div className="text-white text-sm font-mono tracking-wider">
                      {formatDuration(progress)} <span className="text-slate-500">/</span> {formatDuration(totalDuration)}
                  </div>
              </div>
              
              <div className="flex gap-2">
                 {/* Filter Indicator Badge */}
                {activeFilter !== 'natural' && (
                    <div className="px-3 py-1 bg-blue-600/30 border border-blue-500/50 rounded-full text-xs text-blue-200 font-medium backdrop-blur-md">
                        {VIDEO_FILTERS[activeFilter] ? activeFilter : 'AI Filter'}
                    </div>
                )}
                 {/* Transition Indicator Badge - Shows generic if default, or specific if playing */}
                 {(tLabel || (activeTransition !== 'cut' && !transitionMap)) && (
                    <div className="px-3 py-1 bg-purple-600/30 border border-purple-500/50 rounded-full text-xs text-purple-200 font-medium backdrop-blur-md">
                        {tLabel || `Trans: ${activeTransition}`}
                    </div>
                )}
                {titleDesign && (
                   <div className="px-3 py-1 bg-pink-600/30 border border-pink-500/50 rounded-full text-xs text-pink-200 font-medium backdrop-blur-md">
                       Title
                   </div>
                )}
                {cinematicEffects?.applyLetterbox && (
                   <div className="px-3 py-1 bg-yellow-600/30 border border-yellow-500/50 rounded-full text-xs text-yellow-200 font-medium backdrop-blur-md">
                       Cinema Scope
                   </div>
                )}
              </div>
          </div>
      </div>
      
      {clips.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-slate-500">
                  <svg className="w-16 h-16 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p className="font-light tracking-wide">Add clips to start</p>
              </div>
          </div>
      )}
    </div>
  );
});

Player.displayName = 'Player';

export default Player;
