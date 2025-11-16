export enum Step {
  Upload = 'Upload',
  Plan = 'Plan',
  Controls = 'Controls',
  Storyboard = 'Storyboard',
  Review = 'Review',
}

export type VFX_PRESET = 'Slow Motion' | 'Speed Ramp' | 'Lens Flare' | 'Glitch Effect' | 'Vintage Film Grain';

/**
 * Video generation model routing for ComfyUI backends.
 */
export type VideoGenerationModel =
  | 'waver'
  | 'step_video_ti2v'
  | 'animatediff_v3'
  | 'wan2_2'
  | 'videocrafter2';

/**
 * High-level render intent hints to keep routing predictable.
 */
export type RenderProfile = 'realism' | 'stylized' | 'plate' | 'portrait';

/**
 * Categories for advanced VFX effects
 */
export type VFX_CATEGORY = 'motion' | 'stylization' | 'atmospheric' | 'transition';

/**
 * Advanced VFX effect with configurable parameters
 */
export interface VFXEffect {
    category: VFX_CATEGORY;
    name: string;
    /** Effect intensity from 0 (subtle) to 1 (maximum) */
    intensity: number;
    /** Effect-specific parameters (e.g., blur radius, color shift) */
    parameters?: Record<string, any>;
}

/**
 * Duration flexibility settings for dynamic shot timing
 */
export interface DurationFlexibility {
    min_duration: number;
    max_duration: number;
    preferred_duration: number;
}

/**
 * Music alignment settings for beat synchronization
 */
export interface MusicAlignment {
    /** Align shot start to nearest beat */
    align_start_to_beat: boolean;
    /** Align shot end to nearest beat */
    align_end_to_beat: boolean;
    /** Extend shot duration to complete musical phrase */
    extend_to_complete_phrase: boolean;
}

/**
 * Rich lyric overlay with advanced animation and styling
 */
export interface LyricOverlay {
    text: string;
    timing: {
        /** Individual word timestamps for karaoke-style highlighting */
        word_timestamps?: number[];
        line_appear_time: number;
        line_disappear_time: number;
    };
    animation: {
        appear_style: 'fade' | 'slide' | 'bounce' | 'typewriter' | 'zoom';
        disappear_style: 'fade' | 'slide' | 'explode' | 'dissolve';
        /** Enable karaoke-style word-by-word highlighting */
        karaoke_highlight: boolean;
        /** Animation easing function */
        easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
    };
    styling: {
        font_family: string;
        font_size: number;
        color: string;
        stroke_color?: string;
        stroke_width?: number;
        shadow?: boolean;
        /** Enable 3D text effects */
        is_3d?: boolean;
        /** Text opacity (0-1) */
        opacity?: number;
    };
    positioning: {
        anchor: 'top' | 'center' | 'bottom' | 'custom';
        offset_x?: number;
        offset_y?: number;
        /** Make lyrics follow the main subject */
        follows_subject?: boolean;
        /** Z-index for layering */
        z_index?: number;
    };
}

/**
 * Camera angle variation for multi-cam support
 */
export interface CameraAngle {
    angle_name: string; // "close-up", "wide", "over-shoulder", etc.
    preview_image_url: string;
    clip_url?: string;
    /** AI-assigned priority score for angle selection */
    priority_score: number;
}

/**
 * Multi-camera editing configuration
 */
export interface MultiCamEdit {
    enabled: boolean;
    /** Timestamps (in seconds) when camera angles switch */
    switch_times: number[];
}

/**
 * Audio stem types for stem separation
 */
export type AudioStem = 'vocals' | 'bass' | 'drums' | 'other' | 'full_mix';

/**
 * Audio stem analysis results
 */
export interface StemAnalysis {
    stems: {
        [K in AudioStem]?: {
            audio_url: string;
            /** Dominant frequency range in Hz */
            frequency_range: [number, number];
            /** Average volume level (0-1) */
            volume_level: number;
        };
    };
    /** Timestamps where specific stems are prominent */
    stem_highlights?: {
        stem: AudioStem;
        start: number;
        end: number;
        intensity: number;
    }[];
}

/**
 * Beat-synchronized clip with precise timing
 */
export interface SyncedClip {
    shot_id: string;
    original_start: number;
    original_end: number;
    /** Adjusted start time aligned to beat */
    synced_start: number;
    /** Adjusted end time aligned to beat */
    synced_end: number;
    /** Timing adjustment in milliseconds */
    timing_offset_ms: number;
    /** Beats this clip is synchronized to */
    aligned_beats: number[];
}

/**
 * Quality control report for final video
 */
export interface QualityReport {
    /** Overall quality score (0-100) */
    overall_score: number;
    /** Audio-video synchronization accuracy in ms */
    sync_accuracy_ms: number;
    /** Whether any frames were dropped during rendering */
    frames_dropped: boolean;
    /** Actual video duration vs expected */
    duration_match: {
        expected_seconds: number;
        actual_seconds: number;
        difference_ms: number;
    };
    /** List of validation issues found */
    issues: {
        severity: 'error' | 'warning' | 'info';
        message: string;
        shot_id?: string;
    }[];
    /** Performance metrics */
    performance: {
        render_time_seconds: number;
        estimated_cost_usd?: number;
        bottleneck_phase?: string;
    };
}

export interface StylePreset {
    name: string;
    description: string;
    /** High-level grouping for dropdown filtering, e.g. 'Performance', 'Narrative', 'Visual FX' */
    category?: string;
    /** Optional substyle label for finer grouping */
    substyle?: string;
    settings: {
        feel: string;
        style: string;
        color_palette: string[];
    };
}

/**
 * Basic beat information with timing and energy level
 */
export interface Beat {
    time: number; // in seconds
    energy: number; // from 0 to 1
    /** Confidence score of beat detection (0-1) */
    confidence?: number;
    /** Whether this is a strong beat (downbeat) */
    is_downbeat?: boolean;
    /** Type of beat: kick, snare, hi-hat, etc. */
    type?: 'kick' | 'snare' | 'hi-hat' | 'cymbal' | 'other';
}

/**
 * Enhanced song analysis with detailed rhythmic structure
 */
export interface EnhancedSongAnalysis extends SongAnalysis {
    /** Sub-beat detections (hi-hat patterns, snare hits, etc.) */
    sub_beats?: Beat[];
    /** Musical phrases and their boundaries */
    phrases?: {
        start: number;
        end: number;
        type: 'verse' | 'chorus' | 'bridge' | 'pre-chorus' | 'outro' | 'intro';
    }[];
    /** Tempo changes throughout the song */
    tempo_curve?: {
        time: number;
        bpm: number;
    }[];
    /** Detected musical measures (bars) */
    measures?: {
        time: number;
        bar_number: number;
    }[];
    /** Overall energy curve over time */
    energy_curve?: {
        time: number;
        energy: number; // 0-1
    }[];
}

export interface SongAnalysis {
    title: string;
    artist: string;
    bpm: number;
    mood: string[];
    genre: string;
    instrumentation: string[];
    structure: {
        name: string;
        start: number;
        end: number;
    }[];
    beats: Beat[];
    /**
     * Detected vocalist roles for solo/duet scenarios.
     * When present, guides character creation and shot planning.
     */
    vocals?: {
        /** Total detected vocalists */
        count: number; // 1 or 2 (duet), can be >2 for group but capped to 2 for now
        /** Overall type of performance */
        type: 'solo' | 'duet' | 'ensemble';
        /** Duet pairing classification, if duet */
        duet_pairing?: 'male_female' | 'male_male' | 'female_female' | 'unknown';
        /** Per-vocalist info and where they sing */
        vocalists: {
            id: string;           // e.g., 'v1', 'v2'
            display_name: string; // e.g., 'Singer A', 'Singer B'
            gender: 'male' | 'female' | 'unknown';
            role: 'lead' | 'co-lead' | 'backing';
            /** Time segments (seconds) where this vocalist sings */
            segments: { start: number; end: number }[];
        }[];
    };
    lyric_analysis?: {
        primary_themes: string[];           // e.g., "love", "loss", "celebration", "protest", "personal journey"
        narrative_structure: 'first-person story' | 'observational' | 'abstract poetry' | 'character-driven' | 'anthemic';
        imagery_style: 'literal' | 'metaphorical' | 'surreal' | 'symbolic';
        emotional_arc: string;              // e.g., "builds from introspective to triumphant"
        key_visual_elements: string[];     // Visual concepts mentioned in lyrics
    };
    recommended_video_types?: {
        primary: VideoType;
        alternatives: VideoType[];
        reasoning: string;                  // Why these video types fit the song
    };
}

export interface CreativeBrief {
    feel: string;
    style: string;
    mood: string[];
    videoType: VideoType;
    lyricsOverlay: boolean;
    user_notes: string;
    color_palette?: string[];
}

export type VideoType =
  | 'Concert Performance'      // Live performance, singer(s) featured, stage/venue setting
  | 'Story Narrative'          // Narrative-driven, characters and plot
  | 'Hybrid Performance-Story' // Mix of performance and narrative elements
  | 'Animated/Cartoon'         // Cartoon, animation, illustrated style
  | 'Abstract/Experimental'    // Abstract visuals, conceptual, artistic
  | 'Lyric Video'             // Focus on typography and lyric visualization
  | 'Documentary Style'        // Behind-the-scenes, real-life footage style
  | 'Cinematic Concept'       // High-concept, artistic cinematography
  | 'Dance/Choreography'      // Dance-focused, choreographed movements
  | 'Stop Motion/Claymation'; // Stop-motion animation style

export interface TranscriptEntry {
    speaker: 'user' | 'ai';
    text: string;
}

export interface AgentState {
  name: string;
  description: string;
  status: 'idle' | 'working' | 'done' | 'error';
}

export interface CharacterBible {
    name: string;
    role_in_story: string;
    physical_appearance: {
        age_range: string;
        gender_presentation: string;
        ethnicity: string;
        body_type: string;
        key_facial_features: string;
        hair_style_and_color: string;
        eye_color: string;
    };
    costuming_and_props: {
        outfit_style: string;
        specific_clothing_items: string[];
        signature_props: string[];
    };
    performance_and_demeanor: {
        emotional_arc: string;
        performance_style: string;
        gaze_direction: string;
    };
    cinematic_style: {
        camera_lenses: string;
        lighting_style: string;
        color_dominants_in_shots: string[];
    };
    source_images: string[];
}


export interface LocationBible {
    name: string;
    setting_type: string;
    atmosphere_and_environment: {
        time_of_day: string;
        weather: string;
        dominant_mood: string;
    };
    architectural_and_natural_details: {
        style: string; // e.g., 'Brutalist architecture', 'Untouched Redwood forest'
        key_features: string[];
    };
    sensory_details: {
        textures: string[];
        environmental_effects: string[]; // e.g., 'Heavy fog', 'Swirling digital particles'
    };
    cinematic_style: {
        lighting_style: string;
        color_palette: string[];
        camera_perspective: string;
    };
    source_images: string[];
}


export interface Bibles {
    characters: CharacterBible[];
    locations: LocationBible[];
}

export interface DesignAgentFeedback {
    sync_score: number;
    cohesion_score: number;
    placement: 'Intro' | 'Verse' | 'Chorus' | 'Bridge' | 'Outro' | 'Instrumental';
    feedback: string;
}

export type TransitionType = 'Hard Cut' | 'Crossfade' | 'Fade to Black' | 'Whip Pan' | 'Match Cut' | 'Glitch';

export interface Transition {
    type: TransitionType;
    duration: number; // in seconds
    description: string;
}

export interface StoryboardShot {
    id: string; // e.g., "1-1"
    start: number;
    end: number;
    shot_type: string;
    camera_move: string;
    composition: string;
    subject: string;
    /** What the character/subject is doing (e.g., "smiling radiantly", "looking at horizon", "turning head slowly") */
    action: string;
    location_ref: string;
    character_refs: string[];
    /**
     * Optional performers in frame (for performance/concert-style planning).
     * Use vocalist ids or character names to indicate who is singing.
     */
    performer_refs?: string[];
    /** Hint that this shot should align mouth motion to lyrics where possible. */
    lip_sync_hint?: boolean;
    /** @deprecated Use lyric_overlay_v2 for advanced features */
    lyric_overlay?: {
        text: string;
        animation_style: string; // e.g., "Gentle Fade In", "Aggressive Punch"
    };
    /** Enhanced lyric overlay with advanced animation and styling */
    lyric_overlay_v2?: LyricOverlay;
    preview_image_url: string; // URL or base64 string, or 'error'
    clip_url?: string; // URL to the generated video clip
    /** Preferred video model for this shot (ComfyUI routing hint) */
    video_model?: VideoGenerationModel;
    /** Render intent that complements the model choice */
    render_profile?: RenderProfile;
    /** Human-readable explanation for why the model/profile were chosen */
    video_model_reason?: string;
    /** Optional workflow hint for the backend (e.g., 'realistic', 'portrait', 'stylized') */
    workflow_hint?: string;
    /** @deprecated Use vfx_stack for multiple effects */
    vfx?: VFX_PRESET | 'None';
    /** Stack of VFX effects applied in sequence */
    vfx_stack?: VFXEffect[];
    cinematic_enhancements: {
        lighting_style: string;
        camera_lens: string;
        camera_motion: string; // e.g. "Slow dolly in", "Handheld jitter"
    };
    post_production_enhancements?: {
        stabilized?: boolean;
        color_corrected?: boolean;
        /** Color grading preset applied */
        color_grade?: string;
        /** Noise reduction applied */
        noise_reduction?: boolean;
    };
    design_agent_feedback: DesignAgentFeedback;
    is_generating_clip?: boolean;
    generation_progress?: number; // 0-100 percentage
    /** Duration flexibility for dynamic timing adjustments */
    duration_flexibility?: DurationFlexibility;
    /** Music alignment settings for beat synchronization */
    music_alignment?: MusicAlignment;
    /** Multi-camera angle support */
    camera_angles?: {
        primary: CameraAngle;
        alternates: CameraAngle[];
    };
    /** Multi-camera editing configuration */
    multi_cam_edit?: MultiCamEdit;
}

export interface StoryboardScene {
    id: string;
    section: string; // e.g., "verse_1"
    start: number;
    end: number;
    shots: StoryboardShot[];
    transitions: (Transition | null)[]; // One transition between each shot, null for end
    narrative_beats?: string[];
    description?: string;
}

export interface ExecutiveProducerFeedback {
    pacing_score: number; // 1-10
    narrative_score: number; // 1-10
    consistency_score: number; // 1-10
    final_notes: string;
}

export interface Storyboard {
    id: string;
    title: string;
    artist: string;
    scenes: StoryboardScene[];
    executive_producer_feedback?: ExecutiveProducerFeedback;
}

/**
 * Token usage and performance analytics
 */
export interface TokenUsage {
    analysis: number;
    bibles: number;
    storyboard: number;
    transitions: number;
    imageGeneration: number;
    imageEditing: number;
    videoGeneration: number;
    postProduction: number;
    moodboardAnalysis: number;
    executiveReview: number;
    /** Total tokens used across all operations */
    total?: number;
    /** Estimated cost in USD */
    estimated_cost_usd?: number;
    /** Performance metrics */
    performance?: {
        /** Total render time in seconds */
        total_render_time_seconds?: number;
        /** Image generation time in seconds */
        image_generation_time_seconds?: number;
        /** Video generation time in seconds */
        video_generation_time_seconds?: number;
        /** Identified bottleneck phase */
        bottleneck_phase?: 'analysis' | 'image_gen' | 'video_gen' | 'post_production';
        /** Bottleneck duration in seconds */
        bottleneck_duration_seconds?: number;
    };
    /** Tokens spent on last-minute visual QA */
    visualReview?: number;
}

export type TitleSequenceStyle = 'None' | 'Minimal Fade' | 'Kinetic Glitch' | 'Cinematic Reveal';
export type CinematicOverlay = 'None' | '8mm Film Grain' | 'Subtle Light Leaks' | 'Anamorphic Flares';

export type IntroOverlayStyle = 'minimal' | 'cinematic' | 'glitch' | 'neon' | 'elegant';
export type OutroOverlayStyle = 'minimal' | 'cinematic' | 'scroll-credits' | 'modern';

export interface IntroOverlayConfig {
    enabled: boolean;
    duration: number;
    song_title: string;
    artist_name: string;
    custom_text?: string;
    style: IntroOverlayStyle;
    animation: 'fade' | 'slide' | 'zoom' | 'typewriter';
    background: 'blur' | 'solid-black' | 'gradient' | 'video-background';
}

export interface OutroOverlayConfig {
    enabled: boolean;
    duration: number;
    credits: {
        director?: string;
        producer?: string;
        custom_credits: string[];
    };
    style: OutroOverlayStyle;
    animation: 'scroll' | 'fade' | 'cinematic';
    include_social_media?: {
        instagram?: string;
        youtube?: string;
        tiktok?: string;
    };
}

export interface ExportOptions {
    resolution: '720p' | '1080p' | '2160p';
    aspectRatio: '16:9' | '9:16' | '1:1';
    includeLyrics: boolean;
    titleSequenceStyle: TitleSequenceStyle;
    cinematicOverlay: CinematicOverlay;
    includeCredits: boolean;
    intro?: IntroOverlayConfig;
    outro?: OutroOverlayConfig;
}

export type VisualContinuitySeverity = 'note' | 'warn' | 'fail';

export interface VisualContinuityIssue {
    shotId: string;
    sceneId: string;
    section: string;
    assetType: 'image' | 'video';
    assetUrl: string;
    severity: VisualContinuitySeverity;
    finding: string;
    recommendation: string;
}

export interface VisualContinuityReport {
    summary: string;
    overallVerdict: 'pass' | 'warn' | 'fail';
    overallScore?: number;
    checklist: {
        characterConsistency: string;
        styleConsistency: string;
        continuity: string;
        visualQuality: string;
    };
    issues: VisualContinuityIssue[];
}
