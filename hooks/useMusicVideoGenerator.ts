import { useCallback, useEffect, useReducer, useRef } from 'react';
import {
  Step,
  SongAnalysis,
  CreativeBrief,
  Bibles,
  Storyboard,
  StoryboardShot,
  TokenUsage,
  VFX_PRESET,
  CharacterBible,
  LocationBible,
  StoryboardScene,
  Transition,
  ExecutiveProducerFeedback,
  VisualContinuityReport,
} from '../types';
import * as aiService from '../services/aiService';
import { backendService } from '../services/backendService';
import { webSocketService } from '../services/webSocketService';
import { runVisualContinuityAudit } from '../services/visualAgentService';

function mapCameraMotion(cameraMove: string, cinematicMotion: string): string {
  const combined = `${cameraMove} ${cinematicMotion}`.toLowerCase();
  
  if (combined.includes('zoom in') || combined.includes('zooming in') || combined.includes('dolly in')) {
    return 'zoom_in';
  }
  if (combined.includes('zoom out') || combined.includes('zooming out') || combined.includes('dolly out') || combined.includes('pulling back')) {
    return 'zoom_out';
  }
  if (combined.includes('pan left') || combined.includes('panning left')) {
    return 'pan_left';
  }
  if (combined.includes('pan right') || combined.includes('panning right')) {
    return 'pan_right';
  }
  
  return 'static';
}

function mapWorkflowFromShot(shot: StoryboardShot): string | undefined {
  if (shot.workflow_hint) return shot.workflow_hint;
  switch (shot.video_model) {
    case 'step_video_ti2v':
      return 'portrait';
    case 'wan2_2':
      return 'stylized';
    case 'videocrafter2':
      return 'plate';
    case 'animatediff_v3':
      return 'animatediff';
    case 'waver':
      return 'realistic';
    default:
      break;
  }

  if (shot.render_profile === 'stylized') return 'stylized';
  if (shot.render_profile === 'portrait') return 'portrait';
  if (shot.render_profile === 'plate') return 'plate';
  return undefined;
}

function deriveModelGenerationPreferences(shot: StoryboardShot, duration: number): {
  workflow?: string;
  fps?: number;
  negative_prompt?: string;
} {
  const workflow = mapWorkflowFromShot(shot);

  const defaultFpsMap: Record<string, number> = {
    waver: 24,
    step_video_ti2v: 24,
    animatediff_v3: 16,
    wan2_2: 16,
    videocrafter2: 16
  };

  const maxFramesMap: Record<string, number> = {
    animatediff_v3: 32,
    wan2_2: 48,
    videocrafter2: 48,
    waver: 96,
    step_video_ti2v: 96
  };

  const negativePromptMap: Record<string, string> = {
    waver: 'text, subtitles, watermark, logo, blurry, low quality, distorted face, extra limbs, duplicate faces',
    step_video_ti2v: 'text, subtitles, watermark, logo, blurry, low quality, face distortion, extra limbs, duplicate faces',
    animatediff_v3: 'text, subtitles, watermark, logo, flicker, warped limbs, bad hands, bad feet, multiple faces, face melting',
    wan2_2: 'text, watermark, logo, low detail eyes, off-model face, flicker, extra limbs, bad hands',
    videocrafter2: 'text, watermark, logo, muddy details, low contrast, overexposed, underexposed'
  };

  const modelKey = shot.video_model || 'waver';
  const defaultFps = defaultFpsMap[modelKey] || 16;
  const maxFrames = maxFramesMap[modelKey] || 48;
  const cappedFps = Math.max(8, Math.min(defaultFps, Math.floor(maxFrames / Math.max(0.1, duration))));

  return {
    workflow,
    fps: cappedFps,
    negative_prompt: negativePromptMap[modelKey]
  };
}

export interface PostProductionTasks {
    vfx: 'idle' | 'processing' | 'done';
    color: 'idle' | 'processing' | 'done';
    stabilization: 'idle' | 'processing' | 'done';
}

type State = {
  currentStep: Step;
  songFile: File | null;
  audioUrl?: string | null;
  singerGender: 'male' | 'female' | 'unspecified';
  modelTier: 'freemium' | 'premium';
  songAnalysis: SongAnalysis | null;
  creativeBrief: CreativeBrief;
  bibles: Bibles | null;
  storyboard: Storyboard | null;
  isProcessing: boolean;
  error: string | null;
  apiError: string | null; // For user-facing API errors
  tokenUsage: TokenUsage;
  postProductionTasks: PostProductionTasks;
  moodboardImages: File[];
  isAnalyzingMoodboard: boolean;
  isSuggestingBrief: boolean;
  // Executive Producer State
  isReviewing: boolean;
  executiveProducerFeedback: ExecutiveProducerFeedback | null;
  // Visual QA Agent
  isVisualReviewing: boolean;
  visualContinuityReport: VisualContinuityReport | null;
};

type Action =
  | { type: 'START_PROCESSING' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_API_ERROR'; payload: string }
  | { type: 'CLEAR_API_ERROR' }
  | { type: 'SET_SONG_FILE'; payload: File }
  | { type: 'SET_AUDIO_URL'; payload: string }
  | { type: 'SET_SINGER_GENDER'; payload: 'male' | 'female' | 'unspecified' }
  | { type: 'SET_MODEL_TIER'; payload: 'freemium' | 'premium' }
  | { type: 'SET_ANALYSIS'; payload: SongAnalysis }
  | { type: 'UPDATE_CREATIVE_BRIEF'; payload: Partial<CreativeBrief> }
  | { type: 'SET_BIBLES'; payload: Bibles }
  | { type: 'SET_STORYBOARD'; payload: Storyboard }
  | { type: 'UPDATE_SHOT'; payload: StoryboardShot }
  | { type: 'UPDATE_TOKEN_USAGE'; payload: Partial<TokenUsage> }
  | { type: 'SET_STEP'; payload: Step }
  | { type: 'SET_POST_PRODUCTION_STATUS'; payload: { task: keyof PostProductionTasks, status: 'idle' | 'processing' | 'done' } }
  | { type: 'SET_MOODBOARD_IMAGES'; payload: File[] }
  | { type: 'START_MOODBOARD_ANALYSIS' }
  | { type: 'FINISH_MOODBOARD_ANALYSIS' }
  | { type: 'START_BRIEF_SUGGESTION' }
  | { type: 'FINISH_BRIEF_SUGGESTION' }
  | { type: 'SET_BIBLE_ITEM_IMAGES'; payload: { type: 'character' | 'location'; name: string; imageUrls: string[] } }
  | { type: 'SET_TRANSITIONS_FOR_SCENE'; payload: { sceneId: string; transitions: (Transition | null)[] } }
  | { type: 'START_REVIEW' }
  | { type: 'SET_EXECUTIVE_PRODUCER_FEEDBACK'; payload: ExecutiveProducerFeedback }
  | { type: 'START_VISUAL_REVIEW' }
  | { type: 'SET_VISUAL_REVIEW_RESULT'; payload: VisualContinuityReport | null }
  | { type: 'LOAD_PRODUCTION_FILE', payload: any }
  | { type: 'UPDATE_SHOT_MEDIA'; payload: { shotId: string; mediaType: 'image' | 'video'; url: string } }
  | { type: 'RESET' };

const initialState: State = {
  currentStep: Step.Upload,
  songFile: null,
  audioUrl: null,
  singerGender: 'unspecified',
  modelTier: 'freemium',
  songAnalysis: null,
  creativeBrief: {
    feel: '',
    style: '',
    mood: [],
    videoType: 'Story Narrative',
    lyricsOverlay: true,
    user_notes: '',
    color_palette: [],
  },
  bibles: null,
  storyboard: null,
  isProcessing: false,
  error: null,
  apiError: null,
  tokenUsage: {
    analysis: 0,
    bibles: 0,
    storyboard: 0,
    transitions: 0,
    imageGeneration: 0,
    imageEditing: 0,
    videoGeneration: 0,
    postProduction: 0,
    moodboardAnalysis: 0,
    executiveReview: 0,
    visualReview: 0,
  },
  postProductionTasks: {
    vfx: 'idle',
    color: 'idle',
    stabilization: 'idle',
  },
  moodboardImages: [],
  isAnalyzingMoodboard: false,
  isSuggestingBrief: false,
  isReviewing: false,
  executiveProducerFeedback: null,
  isVisualReviewing: false,
  visualContinuityReport: null,
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'START_PROCESSING':
      return { ...state, isProcessing: true, error: null };
    case 'SET_ERROR':
      return { ...state, isProcessing: false, error: action.payload };
    case 'SET_API_ERROR':
      return { ...state, isProcessing: false, apiError: action.payload };
    case 'CLEAR_API_ERROR':
        return { ...state, apiError: null };
    case 'SET_SONG_FILE':
        return { ...state, songFile: action.payload };
    case 'SET_AUDIO_URL':
        return { ...state, audioUrl: action.payload };
    case 'SET_SINGER_GENDER':
        return { ...state, singerGender: action.payload };
    case 'SET_MODEL_TIER':
        return { ...state, modelTier: action.payload };
    case 'SET_ANALYSIS':
      return { ...state, songAnalysis: action.payload, currentStep: Step.Controls, isProcessing: false };
    case 'UPDATE_CREATIVE_BRIEF':
      return { ...state, creativeBrief: { ...state.creativeBrief, ...action.payload } };
    case 'SET_BIBLES':
      return { ...state, bibles: action.payload };
    case 'SET_STORYBOARD':
      return { ...state, storyboard: action.payload, currentStep: Step.Storyboard, isProcessing: false };
    case 'UPDATE_SHOT':
      if (!state.storyboard) return state;
      return {
        ...state,
        storyboard: {
          ...state.storyboard,
          scenes: state.storyboard.scenes.map(scene => ({
            ...scene,
            shots: scene.shots.map(shot => shot.id === action.payload.id ? action.payload : shot),
          })),
        },
      };
    case 'UPDATE_SHOT_MEDIA': {
        if (!state.storyboard) return state;
        const { shotId, mediaType, url } = action.payload;
        return {
            ...state,
            storyboard: {
                ...state.storyboard,
                scenes: state.storyboard.scenes.map(scene => ({
                    ...scene,
                    shots: scene.shots.map(shot => {
                        if (shot.id !== shotId) return shot;
                        if (mediaType === 'image') {
                            // If we upload a new image, the old clip is invalid.
                            return { ...shot, preview_image_url: url, clip_url: undefined, is_generating_clip: false };
                        }
                        if (mediaType === 'video') {
                            return { ...shot, clip_url: url };
                        }
                        return shot;
                    }),
                })),
            },
        };
    }
    case 'UPDATE_TOKEN_USAGE': {
        const updatedUsage = { ...state.tokenUsage };
        for (const key of Object.keys(action.payload) as Array<keyof TokenUsage>) {
            const currentValue = updatedUsage[key];
            const newValue = action.payload[key];
            
            if (key === 'performance') {
                updatedUsage.performance = {
                    ...(currentValue as TokenUsage['performance']),
                    ...(newValue as TokenUsage['performance'])
                };
            } else if (typeof currentValue === 'number' && typeof newValue === 'number') {
                (updatedUsage[key] as number) = currentValue + newValue;
            } else if (newValue !== undefined) {
                (updatedUsage[key] as any) = newValue;
            }
        }
        return {
            ...state,
            tokenUsage: updatedUsage,
        };
    }
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_POST_PRODUCTION_STATUS':
        return { ...state, postProductionTasks: { ...state.postProductionTasks, [action.payload.task]: action.payload.status } };
    case 'SET_MOODBOARD_IMAGES':
        return { ...state, moodboardImages: action.payload };
    case 'START_MOODBOARD_ANALYSIS':
        return { ...state, isAnalyzingMoodboard: true };
    case 'FINISH_MOODBOARD_ANALYSIS':
        return { ...state, isAnalyzingMoodboard: false };
    case 'START_BRIEF_SUGGESTION':
        return { ...state, isSuggestingBrief: true };
    case 'FINISH_BRIEF_SUGGESTION':
        return { ...state, isSuggestingBrief: false };
    case 'SET_BIBLE_ITEM_IMAGES':
        if (!state.bibles) return state;
        const newBibles = JSON.parse(JSON.stringify(state.bibles));
        const { type, name, imageUrls } = action.payload;
        if (type === 'character') {
            const char = newBibles.characters.find((c: CharacterBible) => c.name === name);
            if (char) char.source_images = imageUrls;
        } else {
            const loc = newBibles.locations.find((l: LocationBible) => l.name === name);
            if (loc) loc.source_images = imageUrls;
        }
        return { ...state, bibles: newBibles };
    case 'SET_TRANSITIONS_FOR_SCENE':
        if (!state.storyboard) return state;
        return {
            ...state,
            storyboard: {
                ...state.storyboard,
                scenes: state.storyboard.scenes.map(scene =>
                    scene.id === action.payload.sceneId
                        ? { ...scene, transitions: action.payload.transitions }
                        : scene
                ),
            },
        };
    case 'START_REVIEW':
        return {
            ...state,
            currentStep: Step.Review,
            isReviewing: true,
            isVisualReviewing: true,
            executiveProducerFeedback: null,
            visualContinuityReport: null
        };
    case 'SET_EXECUTIVE_PRODUCER_FEEDBACK':
        return {
            ...state,
            isReviewing: false,
            executiveProducerFeedback: action.payload,
            storyboard: state.storyboard ? { ...state.storyboard, executive_producer_feedback: action.payload } : null
        };
    case 'START_VISUAL_REVIEW':
        return { ...state, isVisualReviewing: true, visualContinuityReport: null };
    case 'SET_VISUAL_REVIEW_RESULT':
        return { ...state, isVisualReviewing: false, visualContinuityReport: action.payload };
    case 'LOAD_PRODUCTION_FILE': {
        const payload = action.payload || {};

        // Defensively hydrate the state from the payload to prevent crashes from
        // malformed or incomplete JSON files, which can cause render errors (blank screen).
        const storyboard = payload.storyboard;
        const hydratedStoryboard = (storyboard && Array.isArray(storyboard.scenes))
            ? {
                ...storyboard,
                scenes: storyboard.scenes.filter(Boolean).map((scene: any) => ({
                    ...(scene || {}),
                    shots: Array.isArray(scene.shots) ? scene.shots : [],
                    transitions: Array.isArray(scene.transitions) ? scene.transitions : [],
                }))
            }
            : null;

        const bibles = payload.bibles;
        const hydratedBibles = (bibles && Array.isArray(bibles.characters) && Array.isArray(bibles.locations))
            ? bibles
            : null;

        return {
            ...initialState,
            currentStep: payload.currentStep || Step.Upload,
            songFile: payload.songFile || null,
            singerGender: payload.singerGender || 'unspecified',
            songAnalysis: payload.songAnalysis || null,
            creativeBrief: payload.creativeBrief ? { ...initialState.creativeBrief, ...payload.creativeBrief } : initialState.creativeBrief,
            bibles: hydratedBibles,
            storyboard: hydratedStoryboard,
            tokenUsage: payload.tokenUsage ? { ...initialState.tokenUsage, ...payload.tokenUsage } : initialState.tokenUsage,
            modelTier: payload.modelTier || 'freemium',
        };
    }
    case 'RESET':
        return JSON.parse(JSON.stringify(initialState));
    default:
      return state;
  }
};


export const useMusicVideoGenerator = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const storyboardRef = useRef<Storyboard | null>(null);

  useEffect(() => {
    storyboardRef.current = state.storyboard;
  }, [state.storyboard]);

  useEffect(() => {
    if (typeof window === 'undefined') {
        return;
    }

    const handleVideoGenerated = (data: any) => {
        try {
            const storyboard = storyboardRef.current;
            if (!storyboard || !data?.url) return;
            const shotIdentifier = data.shotId || data.id;
            if (!shotIdentifier) return;

            const shot = storyboard.scenes
                .flatMap(scene => scene.shots || [])
                .find(s => s.id === shotIdentifier);

            if (!shot) return;

            dispatch({
                type: 'UPDATE_SHOT',
                payload: {
                    ...shot,
                    clip_url: data.url,
                    is_generating_clip: false,
                    generation_progress: 100
                }
            });
        } catch (err) {
            console.error('Failed to handle video_generated event:', err);
        }
    };

    webSocketService.on('video_generated', handleVideoGenerated);
    return () => {
        webSocketService.off('video_generated', handleVideoGenerated);
    };
  }, []);
  
  const clearApiError = useCallback(() => dispatch({ type: 'CLEAR_API_ERROR' }), []);

  const setModelTier = useCallback((tier: 'freemium' | 'premium') => {
    dispatch({ type: 'SET_MODEL_TIER', payload: tier });
  }, []);

  const processSongUpload = useCallback(async (file: File, data: { lyrics: string; title?: string; artist?: string, singerGender: 'male' | 'female' | 'unspecified', modelTier: 'freemium' | 'premium' }) => {
    dispatch({ type: 'START_PROCESSING' });
    dispatch({ type: 'SET_SONG_FILE', payload: file });
    dispatch({ type: 'SET_SINGER_GENDER', payload: data.singerGender});
    dispatch({ type: 'SET_MODEL_TIER', payload: data.modelTier });
    try {
      // Upload audio for backend processing (lip-sync and export)
      try {
        const { audioUrl } = await backendService.uploadAudio(file);
        dispatch({ type: 'SET_AUDIO_URL', payload: audioUrl });
      } catch (e) {
        console.warn('Audio upload failed; continuing without audio URL', e);
      }

      const { analysis, tokenUsage } = await aiService.analyzeSong(file, data.lyrics, data.title, data.artist, data.modelTier);
      dispatch({ type: 'SET_ANALYSIS', payload: analysis });
      dispatch({ type: 'UPDATE_TOKEN_USAGE', payload: { analysis: tokenUsage } });
    } catch (e) {
      dispatch({ type: 'SET_API_ERROR', payload: e instanceof Error ? e.message : 'Failed to analyze song.' });
    }
  }, []);

  const updateCreativeBrief = useCallback((updates: Partial<CreativeBrief>) => {
    dispatch({ type: 'UPDATE_CREATIVE_BRIEF', payload: updates });
  }, []);

  const setMoodboardImages = useCallback((files: File[]) => {
    dispatch({ type: 'SET_MOODBOARD_IMAGES', payload: files });
  }, []);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = (error) => reject(error);
    });

  const analyzeMoodboard = useCallback(async () => {
    if (state.moodboardImages.length === 0) return;
    dispatch({ type: 'START_MOODBOARD_ANALYSIS' });
    try {
        const imagePayloads = await Promise.all(
            state.moodboardImages.map(async (file) => ({
                mimeType: file.type,
                data: await fileToBase64(file),
            }))
        );
        const { briefUpdate, tokenUsage } = await aiService.analyzeMoodboardImages(imagePayloads, state.modelTier);
        dispatch({ type: 'UPDATE_CREATIVE_BRIEF', payload: briefUpdate });
        dispatch({ type: 'UPDATE_TOKEN_USAGE', payload: { moodboardAnalysis: tokenUsage } });
    } catch (e) {
        dispatch({ type: 'SET_API_ERROR', payload: e instanceof Error ? e.message : 'Failed to analyze moodboard.' });
    } finally {
        dispatch({ type: 'FINISH_MOODBOARD_ANALYSIS' });
    }
  }, [state.moodboardImages, state.modelTier]);
  
  const getDirectorSuggestions = useCallback(async () => {
      if (!state.songAnalysis) return;
      dispatch({ type: 'START_BRIEF_SUGGESTION' });
      try {
          const { suggestions, tokenUsage } = await aiService.getDirectorSuggestions(state.songAnalysis, state.creativeBrief, state.modelTier);
          dispatch({ type: 'UPDATE_CREATIVE_BRIEF', payload: suggestions });
          dispatch({ type: 'UPDATE_TOKEN_USAGE', payload: { bibles: tokenUsage } }); // Using 'bibles' category for this for now
      } catch (e) {
          dispatch({ type: 'SET_API_ERROR', payload: e instanceof Error ? e.message : 'Failed to get AI Director suggestions.' });
      } finally {
          dispatch({ type: 'FINISH_BRIEF_SUGGESTION' });
      }
  }, [state.songAnalysis, state.creativeBrief, state.modelTier]);

  const generateBibleImages = useCallback(async (bibles: Bibles, brief: CreativeBrief) => {
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    for (const character of bibles.characters) {
        try {
            const { imageUrl, tokenUsage } = await aiService.generateImageForBibleCharacter(character, brief, state.modelTier);
            dispatch({ type: 'SET_BIBLE_ITEM_IMAGES', payload: { type: 'character', name: character.name, imageUrls: [imageUrl] } });
            dispatch({ type: 'UPDATE_TOKEN_USAGE', payload: { imageGeneration: tokenUsage } });
        } catch (e) {
            console.error(`Failed to generate image for character ${character.name}`, e);
            dispatch({ type: 'SET_BIBLE_ITEM_IMAGES', payload: { type: 'character', name: character.name, imageUrls: ['error'] } });
            dispatch({ type: 'SET_API_ERROR', payload: e instanceof Error ? e.message : `Image generation failed for character: ${character.name}.` });
        }
        await delay(1500); // Wait between requests to avoid rate limiting
    }
    for (const location of bibles.locations) {
        try {
            const { imageUrl, tokenUsage } = await aiService.generateImageForBibleLocation(location, brief, state.modelTier);
            dispatch({ type: 'SET_BIBLE_ITEM_IMAGES', payload: { type: 'location', name: location.name, imageUrls: [imageUrl] } });
            dispatch({ type: 'UPDATE_TOKEN_USAGE', payload: { imageGeneration: tokenUsage } });
        } catch (e) {
            console.error(`Failed to generate image for location ${location.name}`, e);
            dispatch({ type: 'SET_BIBLE_ITEM_IMAGES', payload: { type: 'location', name: location.name, imageUrls: ['error'] } });
            dispatch({ type: 'SET_API_ERROR', payload: e instanceof Error ? e.message : `Image generation failed for location: ${location.name}.` });
        }
        await delay(1500);
    }
  }, []);

  const generateAllTransitions = useCallback(async (storyboard: Storyboard) => {
    if (!state.bibles || !state.creativeBrief) return;
    for (const scene of storyboard.scenes) {
        try {
            const { transitions, tokenUsage } = await aiService.generateTransitions(scene, state.bibles, state.creativeBrief, state.modelTier);
            dispatch({ type: 'SET_TRANSITIONS_FOR_SCENE', payload: { sceneId: scene.id, transitions } });
            dispatch({ type: 'UPDATE_TOKEN_USAGE', payload: { transitions: tokenUsage } });
        } catch (e) {
            console.error(`Failed to generate transitions for scene ${scene.id}`, e);
            dispatch({ type: 'SET_API_ERROR', payload: e instanceof Error ? e.message : `Transition generation failed for scene ${scene.id}.` });
        }
    }
  }, [state.bibles, state.creativeBrief, state.modelTier]);

  const generateCreativeAssets = useCallback(async () => {
      if (!state.songAnalysis || !state.creativeBrief || !state.singerGender) return;
      dispatch({ type: 'START_PROCESSING' });
      dispatch({ type: 'SET_STEP', payload: Step.Plan });
      
      try {
          const { bibles, tokenUsage: biblesTokens } = await aiService.generateBibles(state.songAnalysis, state.creativeBrief, state.singerGender, state.modelTier);
          dispatch({ type: 'SET_BIBLES', payload: bibles });
          dispatch({ type: 'UPDATE_TOKEN_USAGE', payload: { bibles: biblesTokens } });
          
          generateBibleImages(bibles, state.creativeBrief);
          
          const { storyboard, tokenUsage: storyboardTokens } = await aiService.generateStoryboard(state.songAnalysis, state.creativeBrief, bibles, state.modelTier);
          dispatch({ type: 'SET_STORYBOARD', payload: storyboard });
          dispatch({ type: 'UPDATE_TOKEN_USAGE', payload: { storyboard: storyboardTokens } });

          generateAllTransitions(storyboard);

      } catch (e) {
          dispatch({ type: 'SET_API_ERROR', payload: e instanceof Error ? e.message : 'Failed to generate creative assets.' });
          dispatch({ type: 'SET_STEP', payload: Step.Controls }); // Go back on error
      }
  }, [state.songAnalysis, state.creativeBrief, state.singerGender, state.modelTier, generateBibleImages, generateAllTransitions]);

  const generateAllImages = useCallback(async () => {
    if (!state.storyboard || !state.bibles || !state.creativeBrief) return;
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
    const allShots = state.storyboard.scenes.flatMap(s => s.shots);

    for (const shot of allShots) {
        if (shot.preview_image_url) continue; // Skip if already generated or generating
        try {
            const { imageUrl, tokenUsage } = await aiService.generateImageForShot(shot, state.bibles, state.creativeBrief, state.modelTier);
            dispatch({ type: 'UPDATE_SHOT', payload: { ...shot, preview_image_url: imageUrl } });
            dispatch({ type: 'UPDATE_TOKEN_USAGE', payload: { imageGeneration: tokenUsage } });
        } catch (e) {
            console.error(`Failed to generate image for shot ${shot.id}`, e);
            dispatch({ type: 'UPDATE_SHOT', payload: { ...shot, preview_image_url: 'error' } });
            dispatch({ type: 'SET_API_ERROR', payload: e instanceof Error ? e.message : `Image generation failed for shot ${shot.id}.` });
        }
        await delay(1500); // Wait to avoid rate limiting
    }
  }, [state.storyboard, state.bibles, state.creativeBrief, state.modelTier]);


  const regenerateImage = useCallback(async (shotId: string) => {
    if (!state.storyboard || !state.bibles || !state.creativeBrief) return;
    const shot = state.storyboard.scenes.flatMap(s => s.shots).find(s => s.id === shotId);
    if (!shot) return;

    dispatch({ type: 'UPDATE_SHOT', payload: { ...shot, preview_image_url: '' } }); // Set to loading state
    try {
        const { imageUrl, tokenUsage } = await aiService.generateImageForShot(shot, state.bibles, state.creativeBrief, state.modelTier);
        dispatch({ type: 'UPDATE_SHOT', payload: { ...shot, preview_image_url: imageUrl } });
        dispatch({ type: 'UPDATE_TOKEN_USAGE', payload: { imageGeneration: tokenUsage } });
    } catch (e) {
        dispatch({ type: 'UPDATE_SHOT', payload: { ...shot, preview_image_url: 'error' } });
        dispatch({ type: 'SET_API_ERROR', payload: e instanceof Error ? e.message : 'Failed to regenerate image.' });
    }
  }, [state.storyboard, state.bibles, state.creativeBrief, state.modelTier]);
  
  const regenerateBibleImage = useCallback(async (item: { type: 'character' | 'location', name: string }) => {
    if (!state.bibles || !state.creativeBrief) return;
    
    const { type, name } = item;
    
    dispatch({ type: 'SET_BIBLE_ITEM_IMAGES', payload: { type, name, imageUrls: [] } }); // Set loading state

    try {
        let imageUrl, tokenUsage;
        if (type === 'character') {
            const character = state.bibles.characters.find(c => c.name === name);
            if (!character) return;
            ({ imageUrl, tokenUsage } = await aiService.generateImageForBibleCharacter(character, state.creativeBrief, state.modelTier));
        } else {
            const location = state.bibles.locations.find(l => l.name === name);
            if (!location) return;
            ({ imageUrl, tokenUsage } = await aiService.generateImageForBibleLocation(location, state.creativeBrief, state.modelTier));
        }
        dispatch({ type: 'UPDATE_TOKEN_USAGE', payload: { imageGeneration: tokenUsage } });
        dispatch({ type: 'SET_BIBLE_ITEM_IMAGES', payload: { type, name, imageUrls: [imageUrl] } });
    } catch(e) {
        console.error(`Failed to regenerate image for ${type} ${name}`, e);
        dispatch({ type: 'SET_BIBLE_ITEM_IMAGES', payload: { type, name, imageUrls: ['error'] } });
        dispatch({ type: 'SET_API_ERROR', payload: e instanceof Error ? e.message : `Failed to regenerate image for ${type} ${name}.` });
    }
}, [state.bibles, state.creativeBrief]);

  const editImage = useCallback(async (shotId: string, prompt: string) => {
    if (!state.storyboard || !state.bibles || !state.creativeBrief) return;
    const shot = state.storyboard.scenes.flatMap(s => s.shots).find(s => s.id === shotId);
    if (!shot) return;
    
    const originalUrl = shot.preview_image_url;
    dispatch({ type: 'UPDATE_SHOT', payload: { ...shot, preview_image_url: '' }}); 
    try {
        const { imageUrl, tokenUsage } = await aiService.editImageForShot(shot, state.bibles, state.creativeBrief, prompt);
        dispatch({ type: 'UPDATE_SHOT', payload: { ...shot, preview_image_url: imageUrl } });
        dispatch({ type: 'UPDATE_TOKEN_USAGE', payload: { imageEditing: tokenUsage } });
    } catch (e) {
        dispatch({ type: 'UPDATE_SHOT', payload: { ...shot, preview_image_url: originalUrl } });
        dispatch({ type: 'SET_API_ERROR', payload: e instanceof Error ? e.message : 'Failed to edit image.' });
        console.error(e);
    }
  }, [state.storyboard, state.bibles, state.creativeBrief]);

  const generateClip = useCallback(async (shotId: string, quality: 'draft' | 'high' = 'draft'): Promise<boolean> => {
      if (!state.storyboard || !state.creativeBrief) return false;
      const shot = state.storyboard.scenes.flatMap(s => s.shots).find(s => s.id === shotId);
      if (!shot || !shot.preview_image_url || shot.preview_image_url === 'error') return false;

      dispatch({ type: 'UPDATE_SHOT', payload: { ...shot, is_generating_clip: true } });
      let success = false;
      try {
          const duration = shot.end - shot.start;
          const prompt = aiService.getPromptForClipShot(shot, state.bibles, state.creativeBrief, quality === 'high');
          
          const mappedCameraMotion = mapCameraMotion(shot.camera_move, shot.cinematic_enhancements.camera_motion);
          const modelPrefs = deriveModelGenerationPreferences(shot, duration);
          
          const { promptId } = await backendService.generateVideoClip({
              imageUrl: shot.preview_image_url,
              prompt,
              duration,
              quality,
              camera_motion: mappedCameraMotion,
              lipSync: !!shot.lip_sync_hint,
              audioUrl: state.audioUrl || undefined,
              shotId: shot.id,
              workflow: modelPrefs.workflow,
              video_model: shot.video_model,
              render_profile: shot.render_profile,
              fps: modelPrefs.fps,
              negative_prompt: modelPrefs.negative_prompt
          });

          // Poll for progress and completion
          let completed = false;
          let pollAttempts = 0;
          const maxPollAttempts = 300; // 5 minutes max (300 * 1 second)
          
          while (!completed && pollAttempts < maxPollAttempts) {
              await new Promise(resolve => setTimeout(resolve, 1000)); // Poll every second
              pollAttempts++;
              
              try {
                  const status = await backendService.getVideoClipStatus(promptId);
                  
                  // Update progress if available
                  if (typeof status.progress === 'number') {
                      dispatch({
                          type: 'UPDATE_SHOT',
                          payload: { ...shot, generation_progress: status.progress }
                      });
                  }
                  
                  // Check if completed
                  if (status.success && status.clipUrl) {
                      dispatch({
                          type: 'UPDATE_SHOT',
                          payload: {
                              ...shot,
                              clip_url: status.clipUrl,
                              is_generating_clip: false,
                              generation_progress: 100
                          }
                      });
                      completed = true;
                  } else if (status.error) {
                      throw new Error(status.error);
                  }
              } catch (pollError) {
                  console.error(`Error polling video status (attempt ${pollAttempts}):`, pollError);
                  if (pollAttempts >= maxPollAttempts) {
                      throw new Error(`Video generation timed out after ${maxPollAttempts} attempts`);
                  }
              }
          }
          
          if (!completed) {
              throw new Error('Video generation timed out');
          }
          success = true;
      } catch (e) {
          console.error(e);
          dispatch({ type: 'UPDATE_SHOT', payload: { ...shot, is_generating_clip: false } });
          const errorMessage = e instanceof Error ? e.message : 'Failed to generate clip.';
          dispatch({ type: 'SET_API_ERROR', payload: errorMessage });
      }
      return success;
  }, [state.storyboard, state.creativeBrief]);

  const generateStoryboardBatch = useCallback(async (quality: 'draft' | 'high' = 'high') => {
      if (!state.storyboard || !state.creativeBrief) return;
      
      // Flatten and keep scene/shot order; fall back to start time if present.
      const orderedShots = state.storyboard.scenes
        .map((scene, sceneIndex) =>
          scene.shots.map((shot, shotIndex) => ({ shot, sceneIndex, shotIndex }))
        )
        .flat()
        .filter(({ shot }) => shot.preview_image_url && shot.preview_image_url !== 'error')
        .sort((a, b) => {
          const aStart = typeof a.shot.start === 'number' ? a.shot.start : 0;
          const bStart = typeof b.shot.start === 'number' ? b.shot.start : 0;
          if (aStart !== bStart) return aStart - bStart;
          if (a.sceneIndex !== b.sceneIndex) return a.sceneIndex - b.sceneIndex;
          if (a.shotIndex !== b.shotIndex) return a.shotIndex - b.shotIndex;
          return a.shot.id.localeCompare(b.shot.id);
        });

      const failed: string[] = [];
      for (const entry of orderedShots) {
        const ok = await generateClip(entry.shot.id, quality);
        if (!ok) failed.push(entry.shot.id);
      }

      if (failed.length) {
        dispatch({
          type: 'SET_API_ERROR',
          payload: `Some clips failed to generate: ${failed.join(', ')}`
        });
      }
  }, [state.storyboard, state.creativeBrief, generateClip]);

  const regenerateClip = useCallback(async (shotId: string, quality: 'draft' | 'high' = 'high') => {
      return generateClip(shotId, quality);
  }, [generateClip]);

  const setVfxForShot = useCallback((shotId: string, vfx: VFX_PRESET | 'None') => {
      const shot = state.storyboard?.scenes.flatMap(s => s.shots).find(s => s.id === shotId);
      if (shot) {
          dispatch({ type: 'UPDATE_SHOT', payload: { ...shot, vfx }});
      }
  }, [state.storyboard]);

  const applyPostProductionEnhancement = useCallback(async (task: keyof Omit<PostProductionTasks, 'vfx'>) => {
    if (!state.storyboard) return;
    dispatch({ type: 'SET_POST_PRODUCTION_STATUS', payload: { task, status: 'processing' } });
    await new Promise(res => setTimeout(res, 2000));

    const allShots = state.storyboard.scenes.flatMap(s => s.shots);
    for (const shot of allShots) {
        const updatedEnhancements = { ...(shot.post_production_enhancements || {}) };
        if (task === 'color') {
            updatedEnhancements.color_corrected = true;
        } else if (task === 'stabilization') {
            updatedEnhancements.stabilized = true;
        }
        dispatch({ type: 'UPDATE_SHOT', payload: { ...shot, post_production_enhancements: updatedEnhancements } });
    }

    dispatch({ type: 'SET_POST_PRODUCTION_STATUS', payload: { task, status: 'done' } });
  }, [state.storyboard]);
  
  const suggestAndApplyBeatSyncedVfx = useCallback(async () => {
    if (!state.songAnalysis || !state.storyboard) return;
    dispatch({ type: 'SET_POST_PRODUCTION_STATUS', payload: { task: 'vfx', status: 'processing' } });
    try {
        const { suggestions, tokenUsage } = await aiService.suggestBeatSyncedVfx(state.songAnalysis, state.storyboard, state.modelTier);
        
        const allShotsMap = new Map(state.storyboard.scenes.flatMap(s => s.shots).map(shot => [shot.id, shot]));

        for (const suggestion of suggestions) {
            const shotToUpdate = allShotsMap.get(suggestion.shotId);
            if (shotToUpdate) {
                // FIX: Use Object.assign to prevent "Spread types may only be created from object types" error.
                dispatch({ type: 'UPDATE_SHOT', payload: Object.assign({}, shotToUpdate, { vfx: suggestion.vfx }) });
            }
        }
        dispatch({ type: 'UPDATE_TOKEN_USAGE', payload: { postProduction: tokenUsage } });
        dispatch({ type: 'SET_POST_PRODUCTION_STATUS', payload: { task: 'vfx', status: 'done' } });
    } catch (e) {
        dispatch({ type: 'SET_API_ERROR', payload: e instanceof Error ? e.message : 'Failed to get VFX suggestions.' });
        dispatch({ type: 'SET_POST_PRODUCTION_STATUS', payload: { task: 'vfx', status: 'idle' } });
    }
  }, [state.songAnalysis, state.storyboard, state.modelTier]);
  
  const runExecutiveProducerReview = useCallback(async () => {
      if (!state.storyboard || !state.bibles || !state.creativeBrief) return;
      try {
          const { feedback, tokenUsage } = await aiService.generateExecutiveProducerFeedback(state.storyboard, state.bibles, state.creativeBrief, state.modelTier);
          dispatch({ type: 'SET_EXECUTIVE_PRODUCER_FEEDBACK', payload: feedback });
          dispatch({ type: 'UPDATE_TOKEN_USAGE', payload: { executiveReview: tokenUsage } });
      } catch (e) {
          dispatch({ type: 'SET_API_ERROR', payload: e instanceof Error ? e.message : 'Failed to get executive producer feedback.' });
          dispatch({ type: 'SET_EXECUTIVE_PRODUCER_FEEDBACK', payload: { pacing_score: 0, narrative_score: 0, consistency_score: 0, final_notes: "Error generating feedback." } });
      }
  }, [state.storyboard, state.bibles, state.creativeBrief, state.modelTier]);

  const runVisualQaReview = useCallback(async () => {
      if (!state.storyboard || !state.bibles) {
          dispatch({ type: 'SET_VISUAL_REVIEW_RESULT', payload: null });
          return;
      }
      const hasAssets = state.storyboard.scenes.some(scene =>
          scene.shots.some(shot => (shot.clip_url || shot.preview_image_url) && shot.preview_image_url !== 'error')
      );
      if (!hasAssets) {
          dispatch({ type: 'SET_VISUAL_REVIEW_RESULT', payload: null });
          return;
      }
      dispatch({ type: 'START_VISUAL_REVIEW' });
      try {
          const { report, tokenUsage } = await runVisualContinuityAudit(state.storyboard, state.bibles, state.creativeBrief);
          dispatch({ type: 'SET_VISUAL_REVIEW_RESULT', payload: report });
          dispatch({ type: 'UPDATE_TOKEN_USAGE', payload: { visualReview: tokenUsage } });
      } catch (e) {
          dispatch({ type: 'SET_API_ERROR', payload: e instanceof Error ? e.message : 'Visual QA agent failed to review generated visuals.' });
          dispatch({ type: 'SET_VISUAL_REVIEW_RESULT', payload: null });
      }
  }, [state.storyboard, state.bibles, state.creativeBrief]);

  const goToReview = useCallback(() => {
    dispatch({ type: 'START_REVIEW' });
    runExecutiveProducerReview();
    runVisualQaReview();
  }, [runExecutiveProducerReview, runVisualQaReview]);

  const restart = useCallback(() => dispatch({ type: 'RESET' }), []);
  
  const loadProductionFile = useCallback((file: File) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
          try {
              const result = event.target?.result;
              if (typeof result !== 'string') {
                  throw new Error("File could not be read as text.");
              }
              const loadedState = JSON.parse(result);
              if (typeof loadedState !== 'object' || loadedState === null) {
                  throw new Error("JSON file is not a valid state object.");
              }
              
              let reconstructedSongFile: File | null = null;
              if (loadedState.songFileData) {
                  try {
                      const { name, type, base64Data } = loadedState.songFileData;
                      const byteCharacters = atob(base64Data);
                      const byteNumbers = new Array(byteCharacters.length);
                      for (let i = 0; i < byteCharacters.length; i++) {
                          byteNumbers[i] = byteCharacters.charCodeAt(i);
                      }
                      const byteArray = new Uint8Array(byteNumbers);
                      reconstructedSongFile = new File([byteArray], name, { type });
                      console.log('Successfully reconstructed audio file from production JSON');
                  } catch (e) {
                      console.error('Failed to reconstruct audio file:', e);
                  }
              } else {
                  console.warn('Production file does not contain audio data (songFileData field missing). This file was likely saved before audio encoding was implemented. You will need to manually upload the original audio file.');
              }
              
              dispatch({
                  type: 'LOAD_PRODUCTION_FILE',
                  payload: { ...loadedState, songFile: reconstructedSongFile }
              });
          } catch(e) {
              dispatch({ type: 'SET_API_ERROR', payload: e instanceof Error ? e.message : 'Invalid or corrupt production file.' });
          }
      };
      reader.onerror = () => {
          dispatch({ type: 'SET_API_ERROR', payload: 'Error reading the production file.' });
      };
      reader.readAsText(file);
  }, []);
  
  const updateShotWithFileUpload = useCallback((shotId: string, mediaType: 'image' | 'video', file: File) => {
    if (mediaType === 'image') {
        const reader = new FileReader();
        reader.onload = (event) => {
            const url = event.target?.result as string;
            if (url) {
                dispatch({ type: 'UPDATE_SHOT_MEDIA', payload: { shotId, mediaType, url } });
            }
        };
        reader.readAsDataURL(file);
    } else { // video
        const url = URL.createObjectURL(file);
        dispatch({ type: 'UPDATE_SHOT_MEDIA', payload: { shotId, mediaType, url } });
    }
}, []);
  
    if (typeof window !== 'undefined') {
        // Populate the dev helper with closures that can dispatch actions and
        // call hook methods. This is only used for development automation tests.
        window.__mvGen = {
            setSongFile: (file: File) => dispatch({ type: 'SET_SONG_FILE', payload: file }),
            setStep: (step: Step) => dispatch({ type: 'SET_STEP', payload: step }),
            processSongUpload,
            loadProductionFile,
            getState: () => state,
        };
    }

    return {
    ...state,
    processSongUpload,
    setModelTier,
    generateCreativeAssets,
    generateAllImages,
    regenerateImage,
    editImage,
    generateClip,
    generateStoryboardBatch,
    regenerateClip,
    setVfxForShot,
    applyPostProductionEnhancement,
    suggestAndApplyBeatSyncedVfx,
    goToReview,
    runVisualQaReview,
    restart,
    loadProductionFile,
    updateCreativeBrief,
    setMoodboardImages,
    analyzeMoodboard,
    getDirectorSuggestions,
    regenerateBibleImage,
    clearApiError,
    updateShotWithFileUpload,
  };
};

// Development helper: expose a small API on window to allow automated tests and
// dev tooling to set the song file and step without modifying app internals.
// This is intentionally minimal and only assigns functions when running in the
// browser so it won't affect server-side renders.
declare global {
    interface Window { __mvGen?: any }
}

if (typeof window !== 'undefined') {
    // The hook runs inside React components; attaching a small helper that other
    // scripts can call is safe for local development and testing.
    // We do not call the hook here — the hook will set these up when executed.
    // Consumers can call `window.__mvGen.setSongFile(file)` and
    // `window.__mvGen.setStep('Review')` from the page context.
    window.__mvGen = window.__mvGen || {};
}
