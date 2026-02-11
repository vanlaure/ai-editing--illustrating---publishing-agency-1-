import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CreativeBrief, SongAnalysis, Storyboard } from '../types';
import VideoUploader from '../stitchstream/components/VideoUploader';
import Timeline from '../stitchstream/components/Timeline';
import Player, { PlayerRef } from '../stitchstream/components/Player';
import { analyzeMontage } from '../stitchstream/services/geminiService';
import { FILTER_LABELS, TRANSITION_LABELS, FONT_STYLES } from '../stitchstream/constants';
import type {
  VideoClip,
  AIAnalysis,
  ProcessingState,
  TitleDesign,
  ClosingCredits,
  CinematicEffects
} from '../stitchstream/types';

type StitchStreamStudioProps = {
  storyboard: Storyboard | null;
  songFile: File | null;
  audioUrl?: string;
  creativeBrief?: CreativeBrief;
  songAnalysis?: SongAnalysis;
};

// Generate a thumbnail/duration from a remote clip URL, falling back to provided preview
const generateThumbFromUrl = async (
  url: string,
  fallback?: string,
  durationHint?: number
): Promise<{ thumbnail: string; duration: number }> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    video.src = url;

    const cleanUp = () => {
      video.removeAttribute('src');
      video.load();
    };

    video.onloadedmetadata = () => {
      const target = Math.min(1.0, (video.duration || durationHint || 2) * 0.25);
      video.currentTime = target;
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, video.videoWidth * 0.4);
      canvas.height = Math.max(1, video.videoHeight * 0.4);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
        resolve({ thumbnail, duration: video.duration || durationHint || 2 });
      } else {
        resolve({ thumbnail: fallback || '', duration: durationHint || 2 });
      }
      cleanUp();
    };

    video.onerror = () => {
      resolve({ thumbnail: fallback || '', duration: durationHint || 2 });
      cleanUp();
    };
  });
};

const StitchStreamStudio: React.FC<StitchStreamStudioProps> = ({ storyboard, songFile, audioUrl, creativeBrief, songAnalysis }) => {
  const [clips, setClips] = useState<VideoClip[]>([]);
  const [activeClipId, setActiveClipId] = useState<string>();
  const [activeFilter, setActiveFilter] = useState<string>('natural');
  const [activeTransition, setActiveTransition] = useState<'cut' | 'dissolve' | 'fade_black'>('cut');
  const [aiEnabled, setAiEnabled] = useState(true);

  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    progress: 0,
    status: 'idle'
  });

  const [titleDesign, setTitleDesign] = useState<TitleDesign | undefined>();
  const [credits, setCredits] = useState<ClosingCredits | undefined>();
  const [cinematicEffects, setCinematicEffects] = useState<CinematicEffects>({
    applyGrain: false,
    applyVignette: false,
    applyLetterbox: false
  });

  const [backingTrackUrl, setBackingTrackUrl] = useState<string>();
  const playerRef = useRef<PlayerRef>(null);
  const contextText = useMemo(() => {
    const parts: string[] = [];
    if (songAnalysis?.title) parts.push(`Song: ${songAnalysis.title}`);
    if (songAnalysis?.artist) parts.push(`Artist: ${songAnalysis.artist}`);
    if ((songAnalysis as any)?.lyrics) parts.push(`Lyrics: ${(songAnalysis as any).lyrics}`);
    if (creativeBrief?.feel) parts.push(`Feel: ${creativeBrief.feel}`);
    if (creativeBrief?.style) parts.push(`Style: ${creativeBrief.style}`);
    if (creativeBrief?.mood?.length) parts.push(`Mood: ${creativeBrief.mood.join(', ')}`);
    if (creativeBrief?.user_notes) parts.push(`User Notes: ${creativeBrief.user_notes}`);
    if (storyboard?.title) parts.push(`Storyboard Title: ${storyboard.title}`);
    const shotLines = storyboard?.scenes
      ?.flatMap(scene => scene.shots || [])
      .slice(0, 12)
      .map(shot => shot.lyric_overlay?.text || shot.subject || shot.description)
      .filter(Boolean);
    if (shotLines?.length) {
      parts.push(`Script beats: ${shotLines.join(' | ')}`);
    }
    return parts.join(' || ');
  }, [songAnalysis, creativeBrief, storyboard]);

  useEffect(() => {
    // Prefer local file for best sync; fall back to provided audio URL.
    if (songFile) {
      const url = URL.createObjectURL(songFile);
      setBackingTrackUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    if (audioUrl) {
      setBackingTrackUrl(audioUrl);
    } else {
      setBackingTrackUrl(undefined);
    }
    return;
  }, [songFile, audioUrl]);

  // Bootstrap the timeline from the generated storyboard clips
  useEffect(() => {
    let cancelled = false;
    const seedFromStoryboard = async () => {
      if (!storyboard || clips.length > 0) return;

      const orderedShots = storyboard.scenes
        .flatMap(scene => scene.shots)
        .filter(shot => !!shot.clip_url);

      const hydrated: VideoClip[] = [];
      for (let i = 0; i < orderedShots.length; i++) {
        const shot = orderedShots[i];
        if (!shot.clip_url) continue;
        try {
          const { thumbnail, duration } = await generateThumbFromUrl(
            shot.clip_url,
            shot.preview_image_url,
            (shot.end || 0) - (shot.start || 0)
          );
          hydrated.push({
            id: shot.id || `shot-${i + 1}`,
            url: shot.clip_url,
            thumbnail: thumbnail || shot.preview_image_url || '',
            duration: duration || Math.max(2, (shot.end || 0) - (shot.start || 0)),
            name: shot.subject || shot.lyric_overlay?.text || `Shot ${i + 1}`
          });
        } catch (error) {
          console.warn('Failed to hydrate clip', shot.id, error);
        }
      }

      if (!cancelled && hydrated.length) {
        setClips(hydrated);
        setActiveClipId(hydrated[0]?.id);
      }
    };

    seedFromStoryboard();
    return () => {
      cancelled = true;
    };
  }, [storyboard, clips.length]);

  // When AI analysis arrives, auto-select settings and populate editable state
  useEffect(() => {
    if (analysis) {
      if (aiEnabled) {
        if (analysis.directorNotes.colorGrade) {
          setActiveFilter(analysis.directorNotes.colorGrade);
        }
        if (analysis.directorNotes.transition) {
          setActiveTransition(analysis.directorNotes.transition);
        }
      }
      setTitleDesign(analysis.directorNotes.titleDesign);
      setCredits(analysis.directorNotes.closingCredits);
      setCinematicEffects(analysis.directorNotes.cinematicEffects);
    }
  }, [analysis, aiEnabled]);

  const handleClipsAdded = (newClips: VideoClip[]) => {
    setClips(prev => {
      const updated = [...prev, ...newClips];
      if (!activeClipId && updated.length > 0) {
        setActiveClipId(updated[0].id);
      }
      return updated;
    });
    setAnalysis(null);
    setActiveFilter('natural');
    setActiveTransition('cut');
    setTitleDesign(undefined);
    setCredits(undefined);
  };

  const handleRemoveClip = (id: string) => {
    setClips(prev => {
      const updated = prev.filter(c => c.id !== id);
      if (activeClipId === id) {
        setActiveClipId(updated.length > 0 ? updated[0].id : undefined);
      }
      return updated;
    });
    setAnalysis(null);
  };

  const handleReorderClips = (startIndex: number, endIndex: number) => {
    setClips(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
    setAnalysis(null);
  };

  const handleApplyAIOrder = () => {
    if (!analysis?.directorNotes.suggestedClipOrder || clips.length === 0) return;

    const suggestedIndices = analysis.directorNotes.suggestedClipOrder;
    if (suggestedIndices.length !== clips.length) {
      alert('Clip count changed since analysis. Please analyze again.');
      return;
    }

    const reordered = suggestedIndices.map(index => clips[index]).filter(Boolean);
    if (reordered.length === clips.length) {
      setClips(reordered);
      setActiveClipId(reordered[0].id);
    }
  };

  const handleAIAnalyze = async () => {
    if (clips.length === 0) return;

    setProcessingState({ isProcessing: true, progress: 0, status: 'analyzing' });

    try {
      const thumbnails = clips.map(c => c.thumbnail);
      const result = await analyzeMontage(thumbnails, contextText);
      setAnalysis(result);
      setProcessingState({ isProcessing: false, progress: 100, status: 'completed' });
    } catch (error) {
      console.error(error);
      setProcessingState({ isProcessing: false, progress: 0, status: 'error', message: 'Analysis failed' });
    }
  };

  const handleExport = async () => {
    if (processingState.isProcessing) return;
    setProcessingState({ isProcessing: true, progress: 0, status: 'stitching' });

    try {
      if (playerRef.current) {
        await playerRef.current.startRecording();
      }
    } catch (e) {
      console.error(e);
      setProcessingState({ isProcessing: false, progress: 0, status: 'error' });
    }
  };

  const onPlaybackComplete = () => {
    if (processingState.status === 'stitching') {
      setProcessingState({ isProcessing: false, progress: 100, status: 'completed' });
    }
  };

  const updateTitleText = (text: string) => {
    if (titleDesign) setTitleDesign({ ...titleDesign, text });
  };

  const updateTitleStyle = (style: any) => {
    if (titleDesign) setTitleDesign({ ...titleDesign, style });
  };

  const addCreditLine = () => {
    if (credits) {
      setCredits({
        ...credits,
        lines: [...credits.lines, { role: 'Role', name: 'Name' }]
      });
    }
  };

  const updateCreditLine = (index: number, field: 'role' | 'name', value: string) => {
    if (credits) {
      const newLines = [...credits.lines];
      newLines[index] = { ...newLines[index], [field]: value };
      setCredits({ ...credits, lines: newLines });
    }
  };

  const removeCreditLine = (index: number) => {
    if (credits) {
      const newLines = credits.lines.filter((_, i) => i !== index);
      setCredits({ ...credits, lines: newLines });
    }
  };

  const toggleCredits = () => {
    if (credits) {
      setCredits({ ...credits, enabled: !credits.enabled });
    } else {
      setCredits({
        enabled: true,
        lines: [{ role: 'Director', name: 'You' }]
      });
    }
  };

  const suggestedOrderIsDifferent = useMemo(() => {
    if (!analysis?.directorNotes.suggestedClipOrder) return false;
    return JSON.stringify(analysis.directorNotes.suggestedClipOrder) !== JSON.stringify(clips.map((_, i) => i));
  }, [analysis, clips]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/20">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">StitchStream</p>
            <h2 className="text-xl font-bold text-white">AI Director Studio</h2>
            <p className="text-xs text-slate-500">Gemini 2.5 Flash powered final assembly</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleAIAnalyze}
            disabled={clips.length === 0 || processingState.isProcessing}
            className={`relative overflow-hidden flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all group ${
              analysis ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg hover:shadow-purple-500/25'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <span className="relative z-10 flex items-center gap-2">
              {processingState.status === 'analyzing' ? (
                <>
                  <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                  Analyze & Enhance
                </>
              )}
            </span>
          </button>

          <button
            onClick={handleExport}
            disabled={clips.length === 0 || processingState.isProcessing}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold shadow-lg transition-all ${
              processingState.status === 'stitching'
                ? 'bg-red-500/10 text-red-500 border border-red-500/50 animate-pulse'
                : 'bg-white text-black hover:bg-slate-200'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {processingState.status === 'stitching' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                Recording Output...
              </>
            ) : (
              <>
                <span>Export Video</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <Player
            ref={playerRef}
            clips={clips}
            activeClipId={activeClipId}
            activeFilter={aiEnabled ? activeFilter : 'natural'}
            activeTransition={aiEnabled ? activeTransition : 'cut'}
            transitionMap={aiEnabled && analysis?.directorNotes.clipTransitions ? analysis.directorNotes.clipTransitions : undefined}
            titleDesign={aiEnabled ? titleDesign : undefined}
            closingCredits={aiEnabled ? credits : undefined}
            cinematicEffects={aiEnabled ? cinematicEffects : undefined}
            backingTrackUrl={backingTrackUrl}
            onClipChange={setActiveClipId}
            onPlaybackComplete={onPlaybackComplete}
          />

          <Timeline
            clips={clips}
            activeClipId={activeClipId}
            onRemoveClip={handleRemoveClip}
            onReorderClips={handleReorderClips}
            onPlayClip={setActiveClipId}
          />
        </div>

        <div className="lg:col-span-4 space-y-4">
          {analysis && (
            <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/50 rounded-xl overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-slate-700/50 flex justify-between items-center bg-black/20">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                  Director's Notes
                </h3>
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-400">
                  <span>Apply AI</span>
                  <div
                    onClick={() => setAiEnabled(!aiEnabled)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${aiEnabled ? 'bg-purple-600' : 'bg-slate-600'}`}
                  >
                    <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${aiEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                  </div>
                </label>
              </div>

              <div className="p-5 space-y-4 max-h-[520px] overflow-y-auto scrollbar-hide">
                {suggestedOrderIsDifferent && (
                  <div className="bg-purple-900/30 border border-purple-500/30 p-4 rounded-lg flex flex-col gap-2">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      <div>
                        <h4 className="text-sm font-semibold text-white">Suggested Story Flow</h4>
                        <p className="text-xs text-slate-400 mt-1">The AI suggests a better sequence for your narrative.</p>
                      </div>
                    </div>
                    <button
                      onClick={handleApplyAIOrder}
                      className="w-full mt-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-2 rounded transition-colors"
                    >
                      Apply AI Storyboard
                    </button>
                  </div>
                )}

                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">VFX Engine</div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Film Grain', key: 'applyGrain' },
                      { label: 'Vignette', key: 'applyVignette' },
                      { label: 'Cinema Bars', key: 'applyLetterbox' }
                    ].map(effect => (
                      <button
                        key={effect.key}
                        onClick={() => setCinematicEffects(prev => ({ ...prev, [effect.key]: !prev[effect.key as keyof CinematicEffects] }))}
                        className={`p-2 rounded border text-xs font-medium transition-all ${
                          cinematicEffects[effect.key as keyof CinematicEffects]
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        {effect.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-xs text-slate-500 uppercase tracking-wider">Opening Title</div>
                    {titleDesign && <div className="text-[10px] text-pink-400 border border-pink-500/30 px-1.5 rounded">0:00 - 0:04s</div>}
                  </div>
                  {titleDesign ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={titleDesign.text}
                        onChange={(e) => updateTitleText(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white font-bold text-lg focus:border-blue-500 focus:outline-none"
                        placeholder="Enter Title..."
                      />
                      <div className="flex gap-2">
                        <select
                          value={titleDesign.style}
                          onChange={(e) => updateTitleStyle(e.target.value)}
                          className="bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded px-2 py-1 flex-1"
                        >
                          {Object.keys(FONT_STYLES).map(style => (
                            <option key={style} value={style}>{style.charAt(0).toUpperCase() + style.slice(1)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setTitleDesign({ text: 'My Movie', style: 'modern', position: 'center', color: '#ffffff' })} className="text-xs text-blue-400 hover:text-blue-300">+ Add Title</button>
                  )}
                </div>

                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-xs text-slate-500 uppercase tracking-wider">Closing Credits</div>
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400">
                      <span>Show</span>
                      <input type="checkbox" checked={credits?.enabled || false} onChange={toggleCredits} className="accent-blue-500" />
                    </label>
                  </div>

                  {credits && credits.enabled && (
                    <div className="space-y-2">
                      {credits.lines.map((line, idx) => (
                        <div key={idx} className="flex gap-2 items-center group">
                          <input
                            value={line.role}
                            onChange={(e) => updateCreditLine(idx, 'role', e.target.value)}
                            className="bg-slate-900/50 border border-slate-700/50 rounded px-2 py-1 text-xs text-slate-400 w-1/3 focus:border-blue-500 focus:outline-none focus:text-white"
                          />
                          <input
                            value={line.name}
                            onChange={(e) => updateCreditLine(idx, 'name', e.target.value)}
                            className="bg-slate-900/50 border border-slate-700/50 rounded px-2 py-1 text-xs text-white w-1/2 focus:border-blue-500 focus:outline-none"
                          />
                          <button onClick={() => removeCreditLine(idx)} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            &times;
                          </button>
                        </div>
                      ))}
                      <button onClick={addCreditLine} className="text-xs text-blue-400 hover:text-blue-300 mt-2 block w-full text-center border border-dashed border-slate-700 py-1 rounded hover:bg-slate-800 transition-colors">+ Add Line</button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Color Grade</div>
                    <div className="font-medium text-purple-300">{FILTER_LABELS[analysis.directorNotes.colorGrade]}</div>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Transition</div>
                    <div className="font-medium text-blue-300">
                      {analysis.directorNotes.clipTransitions.some(t => t !== 'cut') ? 'Smart Mix' : TRANSITION_LABELS[analysis.directorNotes.transition]}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex gap-3 items-start">
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0"></div>
                    <div>
                      <span className="text-xs font-bold text-slate-300 block mb-0.5">Color Logic</span>
                      <p className="text-xs text-slate-400">{analysis.directorNotes.colorReasoning}</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-pink-500 shrink-0"></div>
                    <div>
                      <span className="text-xs font-bold text-slate-300 block mb-0.5">Transition Logic</span>
                      <p className="text-xs text-slate-400">{analysis.directorNotes.transitionReasoning}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <VideoUploader
            onClipsAdded={handleClipsAdded}
            isProcessing={processingState.isProcessing}
          />

          {!analysis && clips.length > 0 && (
            <div className="bg-slate-800/30 border border-dashed border-slate-700 rounded-xl p-4 text-center text-slate-500 text-sm">
              <p>Analyze your clips to generate Director's Notes, AI Color Grading, Smart Transitions, and Cinematic Titles.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StitchStreamStudio;
