import { Type } from "@google/genai";
import type { SongAnalysis, Bibles, Storyboard, CreativeBrief, StoryboardShot, TranscriptEntry, VFX_PRESET, CharacterBible, LocationBible, StoryboardScene, Transition, ExecutiveProducerFeedback, EnhancedSongAnalysis, Beat, VideoGenerationModel, RenderProfile, AIProviderSettings, AIProvider } from '../types';
import { VFX_PRESETS } from "../constants";
import { backendService } from './backendService';
import { getProfileForModel, adaptPromptForModel, buildThinkingModelKnowledge, buildResearchPrompt, cacheResearchedProfile, parseResearchResponse } from './promptOptimizer';
import { generateThinking, hasThinkingProvider } from './providerClient';

/** Safely join an array-like field — handles undefined, strings, and objects */
const safeJoin = (val: any, sep = ', '): string => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (Array.isArray(val)) return val.join(sep);
    return String(val);
};

/** Safely access a nested property, returning fallback if undefined */
const safe = (val: any, fallback = ''): string => val ?? fallback;

/**
 * Unified text generation: tries configured thinking provider first (OpenRouter, etc.),
 * falls back to Gemini if no provider is configured or if the provider call fails.
 */
const generateText = async (
    options: {
        prompt: string;
        system?: string;
        responseSchema?: any;
        images?: { data: string; mimeType: string }[];
        providerSettings?: AIProviderSettings;
        geminiModel?: string;
        /** Gemini-specific: multipart contents array (for audio, etc.) */
        geminiContents?: any;
        /** Max output tokens — set explicitly for large responses (storyboards, bibles) */
        maxTokens?: number;
    }
): Promise<{ text: string; tokenUsage: number }> => {
    const { prompt, system, responseSchema, images, providerSettings, geminiModel, geminiContents, maxTokens } = options;

    // Use configured provider — no Gemini fallback
    if (hasThinkingProvider(providerSettings)) {
        const result = await generateThinking(providerSettings, {
            prompt,
            system,
            responseSchema,
            images,
            maxTokens,
        });
        if (result) return result;
        throw new Error('Configured thinking provider returned no result');
    }

    return backendService.generateAiText({
        prompt,
        system,
        responseSchema,
        images,
        geminiModel,
        geminiContents,
        maxTokens,
    });
};


// --- VIDEO MODEL ROUTING HELPERS ---

const stylizedRegex = /(anime|cel[- ]?shade|toon|cyber|neon|surreal|fantasy|dream|vapor|abstract|psychedelic)/i;
const portraitRegex = /(close[- ]?up|portrait|headshot|bust|face|profile|medium close)/i;
const widePlateRegex = /(wide|establishing|aerial|drone|landscape|cityscape|panorama)/i;

function chooseVideoModel(
    shot: StoryboardShot,
    section: string,
    brief: CreativeBrief
): Pick<StoryboardShot, 'video_model' | 'render_profile' | 'video_model_reason' | 'workflow_hint'> {
    const hasCharacter = Array.isArray(shot.character_refs) && shot.character_refs.length > 0;
    const combinedText = `${shot.shot_type} ${shot.composition} ${shot.subject}`.toLowerCase();
    const isPortrait = portraitRegex.test(combinedText);
    const isPlate = widePlateRegex.test(combinedText) && !hasCharacter;
    const hasMotion = /dance|running|spinning|chase|camera|dolly|pan|zoom/.test(combinedText) || /move|motion/i.test(shot.camera_move);
    const isChorus = /chorus|drop|hook/.test(section.toLowerCase());
    const isStylizedBrief = stylizedRegex.test(`${brief.style} ${brief.feel}`);

    let video_model: VideoGenerationModel = 'waver';
    let render_profile: RenderProfile = 'realism';
    let workflow_hint = 'realistic';
    let video_model_reason = 'Defaulting to Waver for balanced realism';

    if (isPortrait && hasCharacter && !isStylizedBrief) {
        video_model = 'step_video_ti2v';
        render_profile = 'portrait';
        workflow_hint = 'portrait';
        video_model_reason = 'Portrait/face-driven shot -> Step-Video TI2V for facial consistency';
    } else if (isPortrait && isStylizedBrief) {
        video_model = 'wan2_2';
        render_profile = 'stylized';
        workflow_hint = 'stylized';
        video_model_reason = 'Stylized close-up -> Wan2.2 for anime/surreal look';
    } else if (isPlate) {
        video_model = 'videocrafter2';
        render_profile = 'plate';
        workflow_hint = 'plate';
        video_model_reason = 'Wide/establishing plate -> VideoCrafter2 for efficient backgrounds';
    } else if (isChorus || hasMotion) {
        video_model = isStylizedBrief ? 'wan2_2' : 'animatediff_v3';
        render_profile = isStylizedBrief ? 'stylized' : 'realism';
        workflow_hint = isStylizedBrief ? 'stylized' : 'realistic';
        video_model_reason = isStylizedBrief
            ? 'High-energy stylized section -> Wan2.2 for punchy motion'
            : 'High-energy section -> AnimateDiff v3 for controlled motion';
    } else if (isStylizedBrief) {
        video_model = 'wan2_2';
        render_profile = 'stylized';
        workflow_hint = 'stylized';
        video_model_reason = 'Stylized brief -> Wan2.2 aligns with art direction';
    } else {
        video_model = 'waver';
        render_profile = 'realism';
        workflow_hint = 'realistic';
        video_model_reason = 'Realistic/narrative shot -> Waver for highest quality T2V/I2V';
    }

    return { video_model, render_profile, video_model_reason, workflow_hint };
}

// --- CHARACTER IDENTITY LOCK ---
// Builds a dense, reproducible character description from bible data.
// Used in EVERY prompt to enforce visual consistency across shots.
const buildCharacterIdentityBlock = (char: CharacterBible, level: 'full' | 'concise' = 'full'): string => {
    const pa = char.physical_appearance;
    const cos = char.costuming_and_props;

    if (level === 'concise') {
        // For token-limited models — still includes the critical face + hair + clothing anchors
        return [
            `(${char.name}:1.3)`,
            `(${pa.skin_tone} skin, ${pa.face_shape} face, ${pa.nose_description} nose, ${pa.lip_description}, ${pa.brow_description}, ${pa.jawline_description}:1.3)`,
            `(${pa.hair_style_and_color}, ${pa.hair_texture}:1.3)`,
            `(${pa.eye_shape} ${pa.eye_color} eyes:1.2)`,
            pa.key_facial_features ? `(${pa.key_facial_features}:1.1)` : '',
            `(wearing ${safe(cos.outfit_style)}: ${safeJoin(cos.specific_clothing_items)}:1.2)`,
        ].filter(Boolean).join(', ');
    }

    // Full natural-language block for detailed-prompt models (Waver, Step-Video, etc.)
    return [
        `Character "${char.name}":`,
        `${safe(pa.gender_presentation)}, ${safe(pa.ethnicity)}, ${safe(pa.age_range)} years old, ${safe(pa.body_type)} build.`,
        `FACE (must be photorealistic and identical in every frame): ${safe(pa.skin_tone)} skin, ${safe(pa.face_shape)} face. Nose: ${safe(pa.nose_description)}. Lips: ${safe(pa.lip_description)}. Brows: ${safe(pa.brow_description)}. Jaw: ${safe(pa.jawline_description)}. Eyes: ${safe(pa.eye_shape)}, ${safe(pa.eye_color)}.`,
        pa.key_facial_features ? `Distinguishing features: ${pa.key_facial_features}.` : '',
        `HAIR (must remain consistent): ${safe(pa.hair_style_and_color)}, ${safe(pa.hair_texture)} texture.`,
        `OUTFIT (must remain identical): ${safe(cos.outfit_style)} — ${safeJoin(cos.specific_clothing_items)}.`,
        safeJoin(cos.signature_props) ? `Props: ${safeJoin(cos.signature_props)}.` : '',
        `Performance: ${safe(char.performance_and_demeanor?.performance_style)}.`,
    ].filter(Boolean).join(' ');
};

// --- PROMPT GENERATION HELPERS (for UI display) ---

// Enhanced prompt builder for ComfyUI with ultra-realistic quality tags
const getEnhancedPromptForComfyUI = (shot: StoryboardShot, bibles: Bibles, brief: CreativeBrief): string => {
    console.log('=== getEnhancedPromptForComfyUI CALLED ===');

    const characterRef = shot.character_refs[0];
    const char = characterRef ? bibles.characters.find(c => c.name === characterRef) : null;

    // Full identity-locked character description for facial consistency
    const charDesc = char
        ? buildCharacterIdentityBlock(char, 'concise')
        : '(person:1.1)';

    // Location: Just setting type and time of day
    const loc = bibles.locations.find(l => l.name === shot.location_ref);
    const locDesc = loc ? `${loc.setting_type}, ${loc.atmosphere_and_environment.time_of_day}` : '';

    // Action and composition from the storyboard shot
    const actionDesc = shot.action ? `Action: ${shot.action}.` : '';
    const compositionDesc = shot.composition ? `Composition: ${shot.composition}.` : '';
    const cameraDesc = shot.cinematic_enhancements.camera_motion ? `Camera: ${shot.cinematic_enhancements.camera_motion}.` : '';

    // Quality tags - cinematic but not portrait-biased, respects shot type
    const isCloseUp = /close.?up|macro|portrait/i.test(shot.shot_type || '');
    const qualityTags = isCloseUp
        ? 'photorealistic, 8k uhd, RAW photo, ultra-realistic skin texture, visible pores, subsurface scattering, film grain, Fujifilm XT3, sharp focus, professional photography, cinematic lighting, anatomically correct face'
        : 'photorealistic, 8k uhd, RAW photo, film grain, Fujifilm XT3, sharp focus, professional photography, physically-based rendering, cinematic lighting, dynamic composition, full scene visible';

    // Build prompt with action and composition included
    const prompt = `${shot.shot_type} of ${charDesc}, ${shot.subject}. ${actionDesc} ${compositionDesc} ${cameraDesc} ${locDesc}, ${shot.cinematic_enhancements.lighting_style}, ${qualityTags}`.replace(/\s+/g, ' ').trim();

    console.log('=== OPTIMIZED COMFYUI PROMPT (length:', prompt.length, 'chars) ===');
    console.log(prompt);
    console.log('=== END COMFYUI PROMPT ===');

    return prompt;
};

export const getPromptForImageShot = (shot: StoryboardShot, bibles: Bibles, brief: CreativeBrief): string => {
    const characterDetails = shot.character_refs.map(ref => {
        const char = bibles.characters.find(c => c.name === ref);
        return char ? buildCharacterIdentityBlock(char, 'full') : '';
    }).filter(Boolean).join('\n');

    const locationDetails = (() => {
        const loc = bibles.locations.find(l => l.name === shot.location_ref);
        return loc ? `Location is ${loc.name}, which is a ${loc.setting_type} with ${loc.atmosphere_and_environment.dominant_mood} mood.` : '';
    })();

    const prompt = `
A cinematic, 16:9 aspect ratio photo. Ultra-realistic, photorealistic skin, visible pores, anatomically correct face.
- Visual Style: ${brief.style}, ${brief.feel}.
- Subject: ${shot.subject}.
- Shot Description: ${shot.shot_type}, ${shot.composition}.
- Camera: Using a ${shot.cinematic_enhancements.camera_lens}, performing a ${shot.cinematic_enhancements.camera_motion}.
- Lighting: ${shot.cinematic_enhancements.lighting_style}.
- Character(s) — MUST match this description EXACTLY:
${characterDetails || 'None'}.
- Location: ${locationDetails}.
- Important Colors: ${brief.color_palette?.join(', ')}.
    `;
    return prompt.trim().replace(/^ +/gm, ''); // Tidy up for display
};

export const getPromptForClipShot = (shot: StoryboardShot, bibles: Bibles, brief: CreativeBrief, useDetailedPrompt = false): string => {
    const model = shot.video_model;
    const renderProfile = shot.render_profile;
    const shouldUseDetailed = useDetailedPrompt || model === 'waver' || model === 'step_video_ti2v';
    const isStylized = renderProfile === 'stylized' || model === 'wan2_2';
    const isPortrait = renderProfile === 'portrait';

    // Build character descriptions from bible data — using identity-locked blocks for consistency
    const characterDetails = shot.character_refs.map(ref => {
        const char = bibles.characters.find(c => c.name === ref);
        if (!char) return '';

        if (shouldUseDetailed) {
            return buildCharacterIdentityBlock(char, 'full');
        }

        return buildCharacterIdentityBlock(char, 'concise');
    }).filter(Boolean).join(', ');

    // Build location description from bible data
    const locationDetails = (() => {
        const loc = bibles.locations.find(l => l.name === shot.location_ref);
        if (!loc) return '';

        if (shouldUseDetailed) {
            return `Location "${loc.name}": ${safe(loc.setting_type)}, ${safe(loc.atmosphere_and_environment?.time_of_day)}, ${safe(loc.atmosphere_and_environment?.weather)} weather, ${safe(loc.atmosphere_and_environment?.dominant_mood)} mood. Architecture: ${safe(loc.architectural_and_natural_details?.style)}. Key features: ${safeJoin(loc.architectural_and_natural_details?.key_features)}.`;
        }

        const weight = isStylized ? ':1.2' : ':1.1';
        return `(${loc.setting_type}, ${loc.atmosphere_and_environment.time_of_day}${weight})`;
    })();

    const cinematics = `${shot.cinematic_enhancements.lighting_style} lighting, using ${shot.cinematic_enhancements.camera_lens}`;
    const pacing = `Duration: ${(shot.end - shot.start).toFixed(1)} seconds`;

    if (shouldUseDetailed) {
        // Waver / Step-Video detailed prompt
        const parts = [
            `Animate this ${isPortrait ? 'portrait-focused' : 'cinematic'} shot for a music video. The character's face, hair, and clothing MUST be ultra-realistic and identical to the reference description in every single frame — no morphing, no drift.`,
            characterDetails ? `Characters (IDENTITY-LOCKED — render EXACTLY as described): ${characterDetails}` : '',
            locationDetails ? `Setting: ${locationDetails}` : '',
            `Subject: ${shot.subject}`,
            shot.action ? `Character Action: ${shot.action}` : '',
            `Shot type: ${shot.shot_type}, ${shot.composition}`,
            `Camera: ${shot.cinematic_enhancements.camera_motion} motion, ${shot.camera_move}`,
            `Cinematography: ${cinematics}`,
            `Visual style: ${brief.style}, ${brief.feel}`,
            brief.color_palette ? `Color palette: ${brief.color_palette.join(', ')}` : '',
            brief.videoType === 'Concert Performance' ? 'Live concert performance energy, stage lighting, audience atmosphere.' : '',
            shot.lip_sync_hint ? 'Align mouth movements to implied singing (lip-synced look).' : '',
            pacing
        ].filter(Boolean);

        return parts.join(' ');
    }

    // Concise prompt for AnimateDiff / Wan / VideoCrafter2
    const actionDesc = shot.action ? `${shot.subject}, ${shot.action}` : shot.subject;
    const styleLine = isStylized ? `${brief.style}, ${brief.feel}, vibrant stylized look` : `${brief.style}, ${brief.feel}, cinematic realism`;
    const modelTags =
        model === 'wan2_2'
            ? '(anime aesthetic, saturated neon, crisp line art:1.1)'
            : model === 'animatediff_v3'
                ? '(coherent motion, smooth camera move:1.2)'
                : model === 'videocrafter2'
                    ? '(environment plate, atmospheric depth:1.1)'
                    : '(high quality:1.2)';
    const consistencyTags = model === 'videocrafter2' ? '' : '(consistent face across all frames, identity lock, no face morphing, no feature drift, same person throughout:1.3)';
    const realismTags = '(ultra-realistic skin texture, visible pores, photorealistic face, anatomically correct:1.2)';

    const parts = [
        characterDetails || '(figure:1.1)',
        actionDesc,
        locationDetails,
        `(${shot.cinematic_enhancements.camera_motion}:1.2)`,
        `(${styleLine})`,
        modelTags,
        consistencyTags,
        realismTags,
        pacing
    ].filter(Boolean);

    return parts.join(', ');
};


// --- MODEL-AWARE PROMPT GENERATION ---
// These wrap the existing prompt builders but adapt output to match the selected model's
// optimal prompt format using the prompt engineering knowledge base.

/**
 * Generate an image prompt optimized for the currently selected image model.
 * Falls back to the existing getEnhancedPromptForComfyUI/getPromptForImageShot if no settings provided.
 */
export const getOptimizedImagePrompt = (
    shot: StoryboardShot,
    bibles: Bibles,
    brief: CreativeBrief,
    settings?: AIProviderSettings
): { prompt: string; negativePrompt: string } => {
    if (!settings?.image?.selectedModel) {
        // No model selected — use legacy prompt
        return { prompt: getEnhancedPromptForComfyUI(shot, bibles, brief), negativePrompt: '' };
    }

    const profile = getProfileForModel(settings.image.selectedModel, 'image');
    if (profile) {
        return adaptPromptForModel({ shot, bibles, brief, characterBlock: '', locationBlock: '' }, profile);
    }

    // Unknown model — use natural-language fallback (thinking LLM will research later)
    return { prompt: getPromptForImageShot(shot, bibles, brief), negativePrompt: '' };
};

/**
 * Generate a video prompt optimized for the currently selected video model.
 * Falls back to the existing getPromptForClipShot if no settings provided.
 */
export const getOptimizedVideoPrompt = (
    shot: StoryboardShot,
    bibles: Bibles,
    brief: CreativeBrief,
    settings?: AIProviderSettings
): { prompt: string; negativePrompt: string } => {
    if (!settings?.video?.selectedModel) {
        // No model selected — use legacy prompt
        return { prompt: getPromptForClipShot(shot, bibles, brief), negativePrompt: '' };
    }

    const profile = getProfileForModel(settings.video.selectedModel, 'video');
    if (profile) {
        return adaptPromptForModel({ shot, bibles, brief, characterBlock: '', locationBlock: '' }, profile);
    }

    // Unknown model — use detailed natural-language fallback
    return { prompt: getPromptForClipShot(shot, bibles, brief, true), negativePrompt: '' };
};

/**
 * Get the prompt engineering knowledge block to inject into thinking LLM system prompts.
 * This teaches the LLM about the selected image/video models so it creates optimal prompts
 * during storyboard generation, creative direction, and shot planning.
 */
export const getPromptEngineeringKnowledge = (settings?: AIProviderSettings): string => {
    if (!settings) return '';
    return buildThinkingModelKnowledge(settings);
};

/**
 * Ask the thinking LLM to research optimal prompt engineering for an unknown model.
 * Caches the result so subsequent prompts for the same model are optimized.
 */
export const researchModelPromptStyle = async (
    modelId: string,
    outputType: 'image' | 'video',
    providerSettings?: AIProviderSettings
): Promise<void> => {
    // Skip if already known
    if (getProfileForModel(modelId, outputType)) return;

    try {
        const researchPromptText = buildResearchPrompt(modelId, outputType);
        const result = await generateText({
            prompt: researchPromptText,
            providerSettings,
            geminiModel: 'gemini-2.5-flash',
        });
        const text = result.text || '';
        const profile = parseResearchResponse(modelId, text);
        if (profile) {
            cacheResearchedProfile(modelId, outputType, profile);
            console.log(`[promptOptimizer] Researched and cached profile for ${outputType} model: ${modelId} (family: ${profile.family})`);
        }
    } catch (e) {
        console.warn(`[promptOptimizer] Failed to research model ${modelId}:`, e);
    }
};

// --- API FUNCTIONS ---

// Helper to convert File to Base64
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result.split(',')[1]);
            } else {
                reject(new Error('Failed to convert file to base64'));
            }
        };
        reader.onerror = error => reject(error);
    });
};

export const analyzeSong = async (file: File, lyrics: string, title: string | undefined, artist: string | undefined, singerGender: string, providerSettings?: AIProviderSettings): Promise<{ analysis: SongAnalysis, tokenUsage: number }> => {
    console.log(`AI Service: Analyzing song...`, { title, artist, singerGender });
    const geminiModel = 'gemini-2.5-flash';

    // Convert audio file to base64 for Gemini "listening"
    const audioBase64 = await fileToBase64(file);

    const prompt = `
      Analyze the following song lyrics, metadata, and the attached AUDIO FILE to create a detailed musical and lyrical analysis.
      You must LISTEN to the audio to determine the mood, energy, instrumentation, and vocal style accurately.
      The output must be a valid JSON object.
      
      **MUSICAL ANALYSIS:**
      The analysis should include BPM, mood, genre, instrumentation, and a breakdown of the song structure (e.g., intro, verse, chorus).
      For the structure, provide estimated start and end timestamps in seconds.
      
      **BEATS:** Do NOT generate a beats array — it will be calculated programmatically from BPM and structure. Just provide accurate BPM and structure timestamps.

      **VOCALS (DUET/QUARTET DETECTION):**
      The user specified the singer type as: "${singerGender}".
      - LISTEN to the audio to confirm this and identify specific vocal characteristics (e.g., "raspy male voice", "soprano female", "harmonizing group").
      - Verify if it is a solo, duet (male/female, male/male, female/female), or quartet/group.
      - Provide vocalist entries with gender, role, and time segments where each vocalist sings.
      
      **LYRIC ANALYSIS (CRITICAL — READ THE WORDS CAREFULLY):**
      You MUST read every line of the lyrics closely and extract meaning, not just skim for keywords. The lyrics are the primary source of truth for the music video's story, characters, and world.

      - primary_themes: Array of 2-5 main thematic elements (e.g., "love", "heartbreak", "celebration", "social justice", "personal growth", "loneliness", "adventure", "rebellion", "spirituality", "nostalgia")
      - narrative_structure: The storytelling approach - "linear story", "vignettes", "stream of consciousness", "dialogue-based", "metaphorical journey", "non-narrative/abstract", "testimonial", or "descriptive"
      - imagery_style: How to interpret the lyrics visually - "literal" (show exactly what's said), "metaphorical" (symbolic interpretation), "surreal" (dreamlike/abstract), "symbolic" (deeper meaning), "mixed" (combination)
      - emotional_arc: Describe how emotions progress through the song (e.g., "starts melancholic, builds to hopeful", "maintains energetic celebration throughout", "alternates between anger and reflection")
      - key_visual_elements: Array of 3-7 specific visual concepts, symbols, or imagery mentioned in or suggested by the lyrics (e.g., "ocean waves", "city streets at night", "broken mirrors", "dancing figures", "mountain peaks", "vintage photographs")
      - character_insights: A detailed paragraph describing WHO the people in this song are, based on what the lyrics actually say. Include:
        * Their approximate age/life stage (young lovers in their 20s? middle-aged looking back? teenagers?)
        * Their relationship to each other (new love? long-term? unrequited? friends becoming more?)
        * Their emotional state and personality as revealed by the words they sing
        * Specific lyrics that support these interpretations (quote them)
        * The world/setting the lyrics imply (urban nightlife? suburban? rural? specific locations mentioned?)
      - line_by_line_story: For each verse/chorus/bridge, write 1-2 sentences summarizing what is literally happening or being expressed in that section. This ensures every lyric is accounted for in the visual storytelling.
      
      **VIDEO TYPE RECOMMENDATIONS (CRITICAL FOR CREATIVE DIVERSITY):**
      Based on the lyric themes, emotional content, and song characteristics, recommend the most appropriate video format(s):
      - primary: The single best-suited video type from these options:
        * "Concert Performance" - Live performance footage, singer(s) featured prominently, stage setting, audience interaction
        * "Story Narrative" - Plot-driven storyline with characters and scenes that tell a story related to the lyrics
        * "Hybrid Performance-Story" - Combination of performance footage intercut with narrative scenes
        * "Animated/Cartoon" - Animated characters and worlds, illustration style, motion graphics
        * "Abstract/Experimental" - Non-literal visual interpretation, artistic imagery, conceptual visuals
        * "Lyric Video" - Typography-focused, animated text, visual design around words
        * "Documentary Style" - Real footage, interviews, behind-the-scenes, candid moments
        * "Cinematic Concept" - High-production narrative with symbolic or metaphorical meaning
        * "Dance/Choreography" - Dance-focused performance, movement as storytelling
        * "Stop Motion/Claymation" - Frame-by-frame animation, tactile artistic style
      - alternatives: Array of 2-3 other suitable video types that could also work well
      - reasoning: 2-3 sentence explanation of why these video types fit the song's themes, lyrics, and emotional content
      
      Song Title: ${title || 'Untitled'}
      Artist: ${artist || 'Unknown'}
      Lyrics:
      ---
      ${lyrics}
      ---
    `;

    const songAnalysisSchema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            artist: { type: Type.STRING },
            bpm: { type: Type.INTEGER },
            mood: { type: Type.ARRAY, items: { type: Type.STRING } },
            genre: { type: Type.STRING },
            instrumentation: { type: Type.ARRAY, items: { type: Type.STRING } },
            structure: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        start: { type: Type.NUMBER },
                        end: { type: Type.NUMBER },
                    },
                    required: ['name', 'start', 'end'],
                },
            },
            vocals: {
                type: Type.OBJECT,
                properties: {
                    count: { type: Type.INTEGER },
                    type: { type: Type.STRING },
                    duet_pairing: { type: Type.STRING },
                    vocalists: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING },
                                display_name: { type: Type.STRING },
                                gender: { type: Type.STRING },
                                role: { type: Type.STRING },
                                segments: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            start: { type: Type.NUMBER },
                                            end: { type: Type.NUMBER },
                                        },
                                        required: ['start', 'end']
                                    }
                                }
                            },
                            required: ['id', 'display_name', 'gender', 'role', 'segments']
                        }
                    }
                }
            },
            lyric_analysis: {
                type: Type.OBJECT,
                properties: {
                    primary_themes: { type: Type.ARRAY, items: { type: Type.STRING } },
                    narrative_structure: { type: Type.STRING },
                    imagery_style: { type: Type.STRING },
                    emotional_arc: { type: Type.STRING },
                    key_visual_elements: { type: Type.ARRAY, items: { type: Type.STRING } },
                    character_insights: { type: Type.STRING },
                    line_by_line_story: { type: Type.STRING }
                },
                required: ['primary_themes', 'narrative_structure', 'imagery_style', 'emotional_arc', 'key_visual_elements', 'character_insights', 'line_by_line_story']
            },
            recommended_video_types: {
                type: Type.OBJECT,
                properties: {
                    primary: { type: Type.STRING },
                    alternatives: { type: Type.ARRAY, items: { type: Type.STRING } },
                    reasoning: { type: Type.STRING }
                },
                required: ['primary', 'alternatives', 'reasoning']
            }
        },
        required: ['title', 'artist', 'bpm', 'mood', 'genre', 'instrumentation', 'structure', 'lyric_analysis', 'recommended_video_types'],
    };

    // Provider path: text+lyrics only (no audio — most LLMs don't support audio input)
    // Gemini fallback: includes audio for "listening"
    const result = await generateText({
        prompt,
        responseSchema: songAnalysisSchema,
        providerSettings,
        geminiModel,
        maxTokens: 4096,
        geminiContents: [
            { role: 'user', parts: [{ text: prompt }] },
            {
                role: 'user',
                parts: [{
                    inlineData: {
                        mimeType: file.type || 'audio/mp3',
                        data: audioBase64
                    }
                }]
            }
        ],
    });

    const analysis = JSON.parse(result.text) as SongAnalysis;

    // Generate beats programmatically from BPM + structure (fast and reliable)
    // Note: analyzeSongEnhanced exists for opt-in deep beat detection but its naive DFT
    // is too slow to run synchronously here (~30s+ for a 3-minute song)
    if (analysis.bpm && Array.isArray(analysis.structure) && analysis.structure.length > 0 && (!analysis.beats || analysis.beats.length === 0)) {
        const totalDuration = analysis.structure[analysis.structure.length - 1]?.end || 0;
        const interval = 60 / analysis.bpm;
        const beats: { time: number; energy: number }[] = [];
        for (let t = 0; t < totalDuration; t += interval) {
            // Find which section this beat falls in
            const section = analysis.structure.find(s => t >= s.start && t < s.end);
            const name = (section?.name || '').toLowerCase();
            // Assign energy based on section type
            const energy = /chorus|drop|hook/.test(name) ? 0.8 + Math.random() * 0.2
                : /bridge|solo/.test(name) ? 0.6 + Math.random() * 0.2
                : /intro|outro/.test(name) ? 0.3 + Math.random() * 0.2
                : 0.5 + Math.random() * 0.2;
            beats.push({ time: Math.round(t * 100) / 100, energy: Math.round(energy * 100) / 100 });
        }
        analysis.beats = beats;
        console.log(`AI Service: Generated ${beats.length} beats programmatically from ${analysis.bpm} BPM (fallback)`);
    }

    return { analysis, tokenUsage: result.tokenUsage || 1500 };
};

/**
 * Enhanced song analysis using Web Audio API for precise beat detection
 * Provides sub-beats, musical phrases, tempo curves, and energy analysis
 */
export const analyzeSongEnhanced = async (
    audioBlob: Blob,
    progressCallback?: (phase: string, progress: number) => void
): Promise<EnhancedSongAnalysis> => {
    console.log('AI Service: Starting enhanced song analysis...');

    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        progressCallback?.('Decoding audio...', 10);

        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        progressCallback?.('Analyzing frequency spectrum...', 30);
        const { beats, subBeats } = await detectBeatsAndSubBeats(audioBuffer, audioContext, progressCallback);

        progressCallback?.('Detecting musical phrases...', 60);
        const phrases = detectMusicalPhrases(beats, audioBuffer.duration);

        progressCallback?.('Calculating tempo curve...', 75);
        const tempoCurve = calculateTempoCurve(beats);

        progressCallback?.('Analyzing energy...', 85);
        const { measures, energyCurve } = analyzeEnergyAndMeasures(beats, audioBuffer);

        progressCallback?.('Finalizing analysis...', 95);

        const basicAnalysis = await generateBasicAnalysisFromBeats(beats, audioBuffer.duration);

        const enhanced: EnhancedSongAnalysis = {
            ...basicAnalysis,
            beats,
            sub_beats: subBeats,
            phrases,
            tempo_curve: tempoCurve,
            measures,
            energy_curve: energyCurve
        };

        progressCallback?.('Complete', 100);
        audioContext.close();

        return enhanced;
    } catch (error) {
        console.error('Enhanced analysis failed:', error);
        throw new Error(`Enhanced audio analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

/**
 * Detect beats and sub-beats using onset detection
 */
async function detectBeatsAndSubBeats(
    audioBuffer: AudioBuffer,
    audioContext: AudioContext,
    progressCallback?: (phase: string, progress: number) => void
): Promise<{ beats: Beat[], subBeats: Beat[] }> {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const duration = audioBuffer.duration;

    const fftSize = 2048;
    const hopSize = 512;
    const numFrames = Math.floor(channelData.length / hopSize);

    const spectralFlux: number[] = [];
    let prevSpectrum: Float32Array | null = null;

    for (let i = 0; i < numFrames - 1; i++) {
        const frameStart = i * hopSize;
        const frame = channelData.slice(frameStart, frameStart + fftSize);

        const spectrum = computeSpectrum(frame);

        if (prevSpectrum) {
            let flux = 0;
            for (let j = 0; j < spectrum.length; j++) {
                const diff = spectrum[j] - prevSpectrum[j];
                flux += diff > 0 ? diff : 0;
            }
            spectralFlux.push(flux);
        } else {
            spectralFlux.push(0);
        }

        prevSpectrum = spectrum;

        if (i % 1000 === 0) {
            const progress = 30 + (i / numFrames) * 20;
            progressCallback?.('Analyzing onsets...', progress);
        }
    }

    const threshold = calculateAdaptiveThreshold(spectralFlux);
    const onsets = findPeaks(spectralFlux, threshold, hopSize / sampleRate);

    const { tempo, confidence } = estimateTempo(onsets);
    const beatInterval = 60 / tempo;

    const beats: Beat[] = [];
    const subBeats: Beat[] = [];

    const quantizedOnsets = quantizeOnsets(onsets, beatInterval);

    for (let i = 0; i < quantizedOnsets.length; i++) {
        const onset = quantizedOnsets[i];
        const energy = calculateEnergyAtTime(onset.time, channelData, sampleRate);
        const beatType = classifyBeatType(onset.time, channelData, sampleRate);

        const beat: Beat = {
            time: onset.time,
            energy,
            confidence: onset.confidence,
            is_downbeat: i % 4 === 0,
            type: beatType
        };

        beats.push(beat);

        const subBeatTimes = generateSubBeats(onset.time, beatInterval);
        for (const subTime of subBeatTimes) {
            if (subTime > 0 && subTime < duration) {
                const subEnergy = calculateEnergyAtTime(subTime, channelData, sampleRate);
                subBeats.push({
                    time: subTime,
                    energy: subEnergy * 0.6,
                    confidence: 0.7,
                    is_downbeat: false,
                    type: 'hi-hat'
                });
            }
        }
    }

    return { beats, subBeats };
}

/**
 * Compute frequency spectrum using FFT
 */
function computeSpectrum(frame: Float32Array): Float32Array {
    const n = frame.length;
    const spectrum = new Float32Array(n / 2);

    for (let k = 0; k < spectrum.length; k++) {
        let real = 0;
        let imag = 0;
        for (let t = 0; t < n; t++) {
            const angle = (-2 * Math.PI * k * t) / n;
            real += frame[t] * Math.cos(angle);
            imag += frame[t] * Math.sin(angle);
        }
        spectrum[k] = Math.sqrt(real * real + imag * imag);
    }

    return spectrum;
}

/**
 * Calculate adaptive threshold for onset detection
 */
function calculateAdaptiveThreshold(spectralFlux: number[]): number[] {
    const windowSize = 10;
    const threshold: number[] = [];

    for (let i = 0; i < spectralFlux.length; i++) {
        const start = Math.max(0, i - windowSize);
        const end = Math.min(spectralFlux.length, i + windowSize);
        const window = spectralFlux.slice(start, end);

        const mean = window.reduce((a, b) => a + b, 0) / window.length;
        const variance = window.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / window.length;
        const stdDev = Math.sqrt(variance);

        threshold.push(mean + 1.5 * stdDev);
    }

    return threshold;
}

/**
 * Find peaks in spectral flux that exceed threshold
 */
function findPeaks(
    spectralFlux: number[],
    threshold: number[],
    timeStep: number
): { time: number; confidence: number }[] {
    const peaks: { time: number; confidence: number }[] = [];

    for (let i = 1; i < spectralFlux.length - 1; i++) {
        if (
            spectralFlux[i] > threshold[i] &&
            spectralFlux[i] > spectralFlux[i - 1] &&
            spectralFlux[i] > spectralFlux[i + 1]
        ) {
            const time = i * timeStep;
            const confidence = Math.min(1.0, spectralFlux[i] / (threshold[i] * 2));
            peaks.push({ time, confidence });
        }
    }

    return peaks;
}

/**
 * Estimate tempo using autocorrelation
 */
function estimateTempo(onsets: { time: number }[]): { tempo: number; confidence: number } {
    if (onsets.length < 2) {
        return { tempo: 120, confidence: 0.5 };
    }

    const intervals: number[] = [];
    for (let i = 1; i < onsets.length; i++) {
        intervals.push(onsets[i].time - onsets[i - 1].time);
    }

    const histogram: { [key: string]: number } = {};
    for (const interval of intervals) {
        const bpm = Math.round(60 / interval);
        if (bpm >= 60 && bpm <= 200) {
            histogram[bpm] = (histogram[bpm] || 0) + 1;
        }
    }

    let maxCount = 0;
    let estimatedTempo = 120;
    for (const [bpm, count] of Object.entries(histogram)) {
        if (count > maxCount) {
            maxCount = count;
            estimatedTempo = parseInt(bpm);
        }
    }

    const confidence = maxCount / intervals.length;
    return { tempo: estimatedTempo, confidence };
}

/**
 * Quantize onsets to musical grid
 */
function quantizeOnsets(
    onsets: { time: number; confidence: number }[],
    beatInterval: number
): { time: number; confidence: number }[] {
    const quantized: { time: number; confidence: number }[] = [];

    let expectedTime = 0;
    for (const onset of onsets) {
        const nearestBeat = Math.round(onset.time / beatInterval) * beatInterval;

        if (Math.abs(onset.time - nearestBeat) < beatInterval * 0.15) {
            quantized.push({
                time: nearestBeat,
                confidence: onset.confidence
            });
            expectedTime = nearestBeat + beatInterval;
        } else if (quantized.length > 0) {
            const lastBeat = quantized[quantized.length - 1].time;
            const gap = onset.time - lastBeat;
            if (gap > beatInterval * 1.5) {
                let fillTime = lastBeat + beatInterval;
                while (fillTime < onset.time) {
                    quantized.push({
                        time: fillTime,
                        confidence: 0.5
                    });
                    fillTime += beatInterval;
                }
            }
        }
    }

    return quantized;
}

/**
 * Calculate energy at a specific time
 */
function calculateEnergyAtTime(
    time: number,
    channelData: Float32Array,
    sampleRate: number
): number {
    const windowSize = 2048;
    const startSample = Math.floor(time * sampleRate);
    const endSample = Math.min(startSample + windowSize, channelData.length);

    let energy = 0;
    for (let i = startSample; i < endSample; i++) {
        energy += channelData[i] * channelData[i];
    }

    return Math.min(1.0, Math.sqrt(energy / windowSize) * 10);
}

/**
 * Classify beat type based on frequency content
 */
function classifyBeatType(
    time: number,
    channelData: Float32Array,
    sampleRate: number
): 'kick' | 'snare' | 'hi-hat' | 'cymbal' | 'other' {
    const windowSize = 2048;
    const startSample = Math.floor(time * sampleRate);
    const frame = channelData.slice(startSample, startSample + windowSize);

    const spectrum = computeSpectrum(frame);

    const bassEnergy = spectrum.slice(0, 5).reduce((a, b) => a + b, 0);
    const midEnergy = spectrum.slice(5, 20).reduce((a, b) => a + b, 0);
    const highEnergy = spectrum.slice(20, 50).reduce((a, b) => a + b, 0);

    if (bassEnergy > midEnergy * 1.5 && bassEnergy > highEnergy * 2) {
        return 'kick';
    } else if (midEnergy > bassEnergy * 1.2 && midEnergy > highEnergy) {
        return 'snare';
    } else if (highEnergy > midEnergy * 1.5) {
        return 'hi-hat';
    } else if (highEnergy > bassEnergy * 2) {
        return 'cymbal';
    }

    return 'other';
}

/**
 * Generate sub-beat times (eighth notes)
 */
function generateSubBeats(beatTime: number, beatInterval: number): number[] {
    const subBeatInterval = beatInterval / 2;
    return [
        beatTime + subBeatInterval
    ];
}

/**
 * Detect musical phrases (4-bar and 8-bar sections)
 */
function detectMusicalPhrases(
    beats: Beat[],
    duration: number
): EnhancedSongAnalysis['phrases'] {
    if (beats.length < 8) {
        return [];
    }

    const phrases: NonNullable<EnhancedSongAnalysis['phrases']> = [];
    const beatsPerBar = 4;
    const barsPerPhrase = 4;
    const beatsPerPhrase = beatsPerBar * barsPerPhrase;

    for (let i = 0; i < beats.length; i += beatsPerPhrase) {
        const phraseBeats = beats.slice(i, i + beatsPerPhrase);
        if (phraseBeats.length < beatsPerPhrase / 2) break;

        const start = phraseBeats[0].time;
        const end = phraseBeats[phraseBeats.length - 1].time;

        const avgEnergy = phraseBeats.reduce((sum, b) => sum + b.energy, 0) / phraseBeats.length;

        let type: 'verse' | 'chorus' | 'bridge' | 'pre-chorus' | 'outro' | 'intro';
        if (start < 20) {
            type = 'intro';
        } else if (end > duration - 20) {
            type = 'outro';
        } else if (avgEnergy > 0.75) {
            type = 'chorus';
        } else if (avgEnergy > 0.6) {
            type = 'pre-chorus';
        } else if (avgEnergy > 0.45) {
            type = 'verse';
        } else {
            type = 'bridge';
        }

        phrases.push({ start, end, type });
    }

    return phrases;
}

/**
 * Calculate tempo changes over time
 */
function calculateTempoCurve(beats: Beat[]): EnhancedSongAnalysis['tempo_curve'] {
    if (beats.length < 8) {
        return [];
    }

    const tempoCurve: NonNullable<EnhancedSongAnalysis['tempo_curve']> = [];
    const windowSize = 8;

    for (let i = 0; i < beats.length - windowSize; i += windowSize / 2) {
        const window = beats.slice(i, i + windowSize);
        const intervals = window.slice(1).map((b, idx) => b.time - window[idx].time);
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const bpm = 60 / avgInterval;

        tempoCurve.push({
            time: window[0].time,
            bpm: Math.round(bpm)
        });
    }

    return tempoCurve;
}

/**
 * Analyze energy and detect measures
 */
function analyzeEnergyAndMeasures(
    beats: Beat[],
    audioBuffer: AudioBuffer
): {
    measures: EnhancedSongAnalysis['measures'];
    energyCurve: EnhancedSongAnalysis['energy_curve'];
} {
    const measures: NonNullable<EnhancedSongAnalysis['measures']> = [];
    const energyCurve: NonNullable<EnhancedSongAnalysis['energy_curve']> = [];

    const beatsPerBar = 4;
    for (let i = 0; i < beats.length; i += beatsPerBar) {
        measures.push({
            time: beats[i].time,
            bar_number: Math.floor(i / beatsPerBar) + 1
        });
    }

    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const energyWindowSize = 0.1;

    for (let time = 0; time < audioBuffer.duration; time += energyWindowSize) {
        const energy = calculateEnergyAtTime(time, channelData, sampleRate);
        energyCurve.push({ time, energy });
    }

    return { measures, energyCurve };
}

/**
 * Generate basic analysis structure from detected beats
 */
async function generateBasicAnalysisFromBeats(
    beats: Beat[],
    duration: number
): Promise<SongAnalysis> {
    const intervals = beats.slice(1).map((b, i) => b.time - beats[i].time);
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const bpm = Math.round(60 / avgInterval);

    const highEnergyBeats = beats.filter(b => b.energy > 0.7);
    const avgEnergy = beats.reduce((sum, b) => sum + b.energy, 0) / beats.length;

    const structure: SongAnalysis['structure'] = [
        { name: 'intro', start: 0, end: Math.min(20, duration * 0.15) },
        { name: 'verse', start: Math.min(20, duration * 0.15), end: Math.min(60, duration * 0.4) },
        { name: 'chorus', start: Math.min(60, duration * 0.4), end: Math.min(100, duration * 0.6) },
        { name: 'verse', start: Math.min(100, duration * 0.6), end: Math.min(140, duration * 0.75) },
        { name: 'chorus', start: Math.min(140, duration * 0.75), end: Math.min(180, duration * 0.9) },
        { name: 'outro', start: Math.min(180, duration * 0.9), end: duration }
    ].filter(s => s.start < s.end);

    return {
        title: 'Untitled',
        artist: 'Unknown',
        bpm,
        mood: avgEnergy > 0.7 ? ['energetic', 'upbeat'] : avgEnergy > 0.5 ? ['moderate', 'steady'] : ['calm', 'subdued'],
        genre: 'Unknown',
        instrumentation: [],
        structure,
        beats
    };
}

export const generateBibles = async (analysis: SongAnalysis, brief: CreativeBrief, singerGender: 'male' | 'female' | 'unspecified', providerSettings?: AIProviderSettings): Promise<{ bibles: Bibles, tokenUsage: number }> => {
    console.log(`AI Service: Generating Bibles...`, brief);
    const geminiModel = 'gemini-2.5-flash';

    const prompt = `
      Act as a world-class cinematographer and production designer. Based on the provided song analysis and creative brief, generate HYPER-DETAILED "visual bibles" for a music video. The output must be a valid JSON object adhering to the specified schema.

      The goal is MAXIMUM DETAIL to ensure visual consistency. Be extremely specific and descriptive.
      The primary singer's gender is ${singerGender}. This should influence the main character's gender presentation unless the song's lyrics or mood strongly suggest otherwise.

      **LYRICS ARE YOUR PRIMARY SOURCE OF TRUTH:**
      Before designing ANY character or location, carefully read the lyric_analysis — especially "character_insights" and "line_by_line_story". These fields contain a close reading of the actual lyrics.

      EVERY creative decision must be grounded in what the lyrics actually say:
      - Character ages MUST match what the lyrics imply. If lyrics describe young love, first experiences, or youthful energy, characters should be in their early-to-mid 20s. Do NOT default to 35+ unless the lyrics explicitly describe maturity, looking back on decades, or life experience.
      - Character personalities, clothing, and demeanor must reflect the emotional tone and situation described in the lyrics — not generic archetypes.
      - Locations must match settings mentioned or implied by the lyrics. If lyrics mention a car, a rooftop, a bedroom, rain — those should appear.
      - The relationship dynamic between characters must match what the lyrics describe — are they falling in love? fighting? reuniting? strangers? Quote specific lyrics that justify your choices.
      - Actions and props should come from imagery in the lyrics, not from stock music video clichés.

      For each Character, provide:
      - role_in_story: Their purpose in the narrative — tied to what the lyrics say about them.
      - physical_appearance: You MUST be EXTREMELY SPECIFIC about every facial feature. This is critical for visual consistency across shots. The age_range MUST be justified by the lyric analysis.
        * age_range: Derived from lyric clues about life stage, relationship maturity, cultural references
        * skin_tone: Exact shade (e.g., "warm golden-brown", "pale ivory with light freckles across the nose bridge")
        * face_shape: Precise bone structure (e.g., "oval face with prominent high cheekbones and a narrow chin")
        * nose_description: Exact nose shape (e.g., "slightly upturned button nose with a narrow bridge", "broad flat nose with flared nostrils")
        * lip_description: Exact lip shape (e.g., "full plump lips with a pronounced cupid's bow", "thin straight lips")
        * brow_description: Exact brow shape (e.g., "thick dark arched brows with a slight gap", "thin blonde straight brows")
        * jawline_description: Exact jaw shape (e.g., "sharp angular jawline with a cleft chin", "soft rounded jaw tapering to a small chin")
        * key_facial_features: Any distinguishing marks — scars, dimples, moles, wrinkles, piercings
        * hair_style_and_color: Extremely detailed (e.g., "shoulder-length jet-black hair with a side part, swept behind the left ear")
        * hair_texture: Specific curl pattern/texture (e.g., "3B loose curls", "pin-straight and glossy", "thick wavy")
        * eye_color: Specific shade (e.g., "hazel-green with amber flecks around the pupil")
        * eye_shape: Exact shape (e.g., "large almond-shaped eyes with a slight upturn at the outer corners")
      - costuming_and_props: Define ONE CONSISTENT outfit that the character wears throughout the video. The outfit must reflect the character's age, personality, and world as described in the lyrics. Be hyper-specific about every clothing item — brand aesthetic, fabric, color, fit, layering. This outfit must remain IDENTICAL in every shot unless a wardrobe change is narratively justified. List EVERY visible item from head to toe.
      - performance_and_demeanor: How do they act? What is their emotional journey? This MUST align with the emotional_arc from the lyric analysis.
      - cinematic_style: How should they be filmed? Specify lenses, lighting, and colors that define their presence.

      For each Location, provide:
      - setting_type: What kind of place is this? Derive from lyrics — if lyrics mention specific places, use them.
      - atmosphere_and_environment: The mood, time, and weather — match the lyric tone.
      - architectural_and_natural_details: What makes this place unique? Mention styles and key features.
      - sensory_details: What textures and environmental effects are present (e.g., fog, dust, lens flare)?
      - cinematic_style: How should this location be filmed? Specify lighting, color palette, and camera perspectives.

      VOCALS-DRIVEN CHARACTERS:
      - If analysis.vocals indicates a duet (vocals.count >= 2 or vocals.type == 'duet'), create TWO distinct main characters aligned to the detected vocalists (names, gender presentation, styling can differ). Otherwise, create ONE main character.
      - Map vocalist genders to character gender_presentation when reasonable.

      LOCATIONS:
      - Always include at least ONE primary location.
      - Locations should be derived from imagery in the lyrics where possible.
      - If the Creative Brief videoType is "Concert Performance" or the styling implies a performance video, ensure one location is a performance venue (e.g., concert stage, club, festival) with lighting and crowd atmosphere details.

      Song Analysis:
      ${JSON.stringify(analysis, null, 2)}

      Creative Brief:
      ${JSON.stringify(brief, null, 2)}
    `;

    const biblesSchema = {
                type: Type.OBJECT,
                properties: {
                    characters: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                role_in_story: { type: Type.STRING },
                                physical_appearance: {
                                    type: Type.OBJECT,
                                    properties: {
                                        age_range: { type: Type.STRING },
                                        gender_presentation: { type: Type.STRING },
                                        ethnicity: { type: Type.STRING },
                                        body_type: { type: Type.STRING },
                                        skin_tone: { type: Type.STRING, description: "Exact skin shade, e.g. 'warm olive', 'deep brown with golden undertones'" },
                                        face_shape: { type: Type.STRING, description: "Precise bone structure, e.g. 'oval with high cheekbones'" },
                                        nose_description: { type: Type.STRING, description: "Exact nose shape and size" },
                                        lip_description: { type: Type.STRING, description: "Exact lip shape and fullness" },
                                        brow_description: { type: Type.STRING, description: "Exact eyebrow shape, thickness, color" },
                                        jawline_description: { type: Type.STRING, description: "Exact jaw and chin shape" },
                                        key_facial_features: { type: Type.STRING, description: "Distinguishing marks: scars, dimples, moles, piercings" },
                                        hair_style_and_color: { type: Type.STRING, description: "Ultra-specific hairstyle, color, parting, length" },
                                        hair_texture: { type: Type.STRING, description: "Curl pattern/texture, e.g. '3B curls', 'pin-straight'" },
                                        eye_color: { type: Type.STRING, description: "Specific shade with detail" },
                                        eye_shape: { type: Type.STRING, description: "Exact eye shape" },
                                    },
                                    required: ['age_range', 'gender_presentation', 'ethnicity', 'body_type', 'skin_tone', 'face_shape', 'nose_description', 'lip_description', 'brow_description', 'jawline_description', 'key_facial_features', 'hair_style_and_color', 'hair_texture', 'eye_color', 'eye_shape']
                                },
                                costuming_and_props: {
                                    type: Type.OBJECT,
                                    properties: {
                                        outfit_style: { type: Type.STRING },
                                        specific_clothing_items: { type: Type.ARRAY, items: { type: Type.STRING } },
                                        signature_props: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    },
                                    required: ['outfit_style', 'specific_clothing_items', 'signature_props']
                                },
                                performance_and_demeanor: {
                                    type: Type.OBJECT,
                                    properties: {
                                        emotional_arc: { type: Type.STRING },
                                        performance_style: { type: Type.STRING },
                                        gaze_direction: { type: Type.STRING },
                                    },
                                    required: ['emotional_arc', 'performance_style', 'gaze_direction']
                                },
                                cinematic_style: {
                                    type: Type.OBJECT,
                                    properties: {
                                        camera_lenses: { type: Type.STRING },
                                        lighting_style: { type: Type.STRING },
                                        color_dominants_in_shots: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    },
                                    required: ['camera_lenses', 'lighting_style', 'color_dominants_in_shots']
                                },
                                source_images: { type: Type.ARRAY, items: { type: Type.STRING, description: "Leave this as an empty array." } },
                            },
                            required: ['name', 'role_in_story', 'physical_appearance', 'costuming_and_props', 'performance_and_demeanor', 'cinematic_style', 'source_images']
                        }
                    },
                    locations: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                setting_type: { type: Type.STRING },
                                atmosphere_and_environment: {
                                    type: Type.OBJECT,
                                    properties: {
                                        time_of_day: { type: Type.STRING },
                                        weather: { type: Type.STRING },
                                        dominant_mood: { type: Type.STRING },
                                    },
                                    required: ['time_of_day', 'weather', 'dominant_mood']
                                },
                                architectural_and_natural_details: {
                                    type: Type.OBJECT,
                                    properties: {
                                        style: { type: Type.STRING },
                                        key_features: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    },
                                    required: ['style', 'key_features']
                                },
                                sensory_details: {
                                    type: Type.OBJECT,
                                    properties: {
                                        textures: { type: Type.ARRAY, items: { type: Type.STRING } },
                                        environmental_effects: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    },
                                    required: ['textures', 'environmental_effects']
                                },
                                cinematic_style: {
                                    type: Type.OBJECT,
                                    properties: {
                                        lighting_style: { type: Type.STRING },
                                        color_palette: { type: Type.ARRAY, items: { type: Type.STRING } },
                                        camera_perspective: { type: Type.STRING },
                                    },
                                    required: ['lighting_style', 'color_palette', 'camera_perspective']
                                },
                                source_images: { type: Type.ARRAY, items: { type: Type.STRING, description: "Leave this as an empty array." } },
                            },
                            required: ['name', 'setting_type', 'atmosphere_and_environment', 'architectural_and_natural_details', 'sensory_details', 'cinematic_style', 'source_images']
                        }
                    }
                },
                required: ['characters', 'locations']
    };

    const result = await generateText({
        prompt,
        responseSchema: biblesSchema,
        providerSettings,
        geminiModel,
        maxTokens: 8192,
    });

    let parsed: any;
    try {
        parsed = JSON.parse(result.text);
    } catch (parseError) {
        console.error('AI Service: Failed to parse bibles JSON, attempting extraction...', parseError);
        const jsonMatch = result.text.match(/\{[\s\S]*"characters"[\s\S]*"locations"[\s\S]*\}/);
        if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
        } else {
            throw new Error('Failed to parse bibles response as JSON');
        }
    }

    // Unwrap if model nested inside a wrapper key (e.g. "visual_bible", "bibles", "result")
    if (!Array.isArray(parsed.characters)) {
        const inner = Object.values(parsed).find((v: any) => v && typeof v === 'object' && Array.isArray((v as any).characters));
        if (inner) {
            console.log('AI Service: Unwrapping nested bibles object');
            parsed = inner;
        }
    }

    const bibles = {
        ...parsed,
        characters: Array.isArray(parsed?.characters) ? parsed.characters.filter(Boolean) : [],
        locations: Array.isArray(parsed?.locations) ? parsed.locations.filter(Boolean) : [],
    } as Bibles;

    if (!Array.isArray(bibles.characters) || !Array.isArray(bibles.locations)) {
        console.error('AI Service: Invalid bibles structure:', Object.keys(parsed));
        throw new Error('Bibles response missing characters or locations array');
    }

    bibles.characters = bibles.characters.map((character: any, index: number) => ({
        ...character,
        name: safe(character?.name, `Character ${index + 1}`),
        source_images: Array.isArray(character?.source_images) ? character.source_images : [],
        costuming_and_props: {
            outfit_style: safe(character?.costuming_and_props?.outfit_style),
            specific_clothing_items: Array.isArray(character?.costuming_and_props?.specific_clothing_items) ? character.costuming_and_props.specific_clothing_items : [],
            signature_props: Array.isArray(character?.costuming_and_props?.signature_props) ? character.costuming_and_props.signature_props : [],
        },
        performance_and_demeanor: character?.performance_and_demeanor || {},
        cinematic_style: {
            ...(character?.cinematic_style || {}),
            color_dominants_in_shots: Array.isArray(character?.cinematic_style?.color_dominants_in_shots)
                ? character.cinematic_style.color_dominants_in_shots
                : [],
        },
        physical_appearance: character?.physical_appearance || {},
    }));

    bibles.locations = bibles.locations.map((location: any, index: number) => ({
        ...location,
        name: safe(location?.name, `Location ${index + 1}`),
        source_images: Array.isArray(location?.source_images) ? location.source_images : [],
        atmosphere_and_environment: location?.atmosphere_and_environment || {},
        architectural_and_natural_details: {
            ...(location?.architectural_and_natural_details || {}),
            key_features: Array.isArray(location?.architectural_and_natural_details?.key_features)
                ? location.architectural_and_natural_details.key_features
                : [],
        },
        sensory_details: {
            ...(location?.sensory_details || {}),
            textures: Array.isArray(location?.sensory_details?.textures) ? location.sensory_details.textures : [],
            environmental_effects: Array.isArray(location?.sensory_details?.environmental_effects)
                ? location.sensory_details.environmental_effects
                : [],
        },
        cinematic_style: {
            ...(location?.cinematic_style || {}),
            color_palette: Array.isArray(location?.cinematic_style?.color_palette) ? location.cinematic_style.color_palette : [],
        },
    }));

    return { bibles, tokenUsage: result.tokenUsage || 2500 };
};


export const generateStoryboard = async (analysis: SongAnalysis, brief: CreativeBrief, bibles: Bibles, providerSettings?: AIProviderSettings): Promise<{ storyboard: Storyboard, tokenUsage: number }> => {
    console.log(`AI Service: Generating Storyboard...`);
    const geminiModel = 'gemini-2.5-flash';
    const structure = Array.isArray(analysis?.structure) ? analysis.structure : [];
    const totalDuration = structure.length > 0 ? structure[structure.length - 1]?.end || 0 : 0;

    const prompt = `
      Act as an expert music video director and cinematographer. Create a complete storyboard based on the provided song analysis, creative brief, and visual bibles.
      The output must be a valid JSON object.
      
      **CRITICAL VIDEO GENERATION CONSTRAINT**: Each shot you create will result in ONE 3-5 second video clip. Music videos cut FAST — think MTV pacing, not film. Short, punchy shots create energy and keep viewers engaged.

      **COVERAGE REQUIREMENT**: The song is ${totalDuration} seconds long. You MUST create enough shots to cover the ENTIRE song duration.
      - Target approximately ${Math.ceil(totalDuration / 4)} shots total (song duration ÷ 4 seconds average clip length).
      - Distribute shots evenly across ALL song sections to ensure complete coverage.
      - Each section should have multiple shots based on its duration (longer sections need more shots).
      - Vary shot duration: quick 2-3s cuts for high-energy moments (chorus, drops), 4-5s holds for emotional beats (verse introspection, bridge climax).
      
      **RHYTHM IS KEY**: Use the provided 'beats' data. The start and end times of your generated shots MUST align with the beat timestamps provided in the analysis. This is crucial for creating a rhythmically engaging video.
      
      **LYRIC-DRIVEN CREATIVITY**: Pay close attention to the lyric_analysis in the song analysis. The primary themes, narrative structure, imagery style, emotional arc, and key visual elements should heavily influence your creative choices. Let the lyrics guide your visual storytelling.
      
      **VIDEO TYPE APPROACH**: The song analysis includes recommended_video_types with a primary recommendation and alternatives. Use this as your creative foundation:
      - **Concert Performance**: Feature artist(s) performing live. Use dynamic stage lighting, crowd shots, close-ups of instruments/vocals, varying angles (front stage, side stage, crowd POV). Mix performance shots with audience reactions.
      - **Story Narrative**: Tell a visual story that complements or interprets the lyrics. Create character arcs, plot progression, emotional journey. Use cinematic techniques like establishing shots, dialogue-free storytelling, visual metaphors.
      - **Hybrid Performance-Story**: Intercut between performance footage and narrative scenes. The story should relate thematically to the song. Transition smoothly between the two worlds (performance venue and story location).
      - **Animated/Cartoon**: Create stylized, illustrated visuals. Specify animation style (2D hand-drawn, motion graphics, rotoscope, etc.). Use exaggerated expressions, surreal environments, and vibrant color palettes.
      - **Abstract/Experimental**: Focus on visual art, symbolism, and unconventional imagery. Use abstract shapes, color theory, avant-garde cinematography, visual effects, surreal compositions that evoke emotion without literal storytelling.
      - **Lyric Video**: Typography-focused with creative text animations. Display lyrics as the primary visual element with supporting imagery, backgrounds, or motion graphics that enhance readability and mood.
      - **Documentary Style**: Behind-the-scenes, interview-style, candid footage aesthetic. Use handheld camera work, natural lighting, real locations, authentic moments. Can include artist commentary or process footage.
      - **Cinematic Concept**: High-production narrative with film-quality cinematography. Use dramatic lighting, carefully composed frames, color grading, and cinematic camera movements. Focus on visual storytelling with movie-like production values.
      - **Dance/Choreography**: Feature choreographed movement as the primary focus. Wide shots to capture full body movement, rhythmic editing synchronized to beats, dynamic camera angles that enhance the dance, multiple dancers or solo performances.
      - **Stop Motion/Claymation**: Frame-by-frame animation using physical objects. Specify materials (clay, paper, objects), tactile aesthetic, handcrafted look, creative set design with practical effects.
      
      **CREATIVE VARIETY**: Each video should feel unique and inspired by the specific song content. Vary your visual metaphors, shot compositions, color palettes, and storytelling approaches based on:
      - The song's lyrical themes and narrative structure
      - The recommended video type and its conventions
      - The emotional arc and key visual elements from lyric analysis
      - The creative brief's specified style, feel, and mood
      
      
      **VOCALS / DUET GUIDANCE**:
      - If analysis.vocals indicates a duet, clearly plan which vocalist is featured in each shot. Use alternating solos, harmonies, or split-screen when appropriate.
      - Add performance-focused shots (close-ups on mouths/mics, expressive singing, crowd interaction) and set a lip sync hint on shots where vocals occur.
      - Include a 'performer_refs' array on shots that feature one or both vocalists, using their names from the character bible.
      
      **CONCERT/PERFORMANCE STYLE**:
      - If Creative Brief videoType is "Concert Performance", prioritize stage and audience shots, dynamic lights, and multi-angle coverage. Ensure most shots visibly feature the singer(s) and enable lip-sync hints where vocals occur.
      
      **CRITICAL: NO DUPLICATE SHOTS.** Every single shot MUST have a unique subject, action, and composition. Even when a chorus or section repeats in the song:
      - Use COMPLETELY DIFFERENT camera angles, locations, character actions, and visual metaphors for each repetition.
      - Chorus 1 might show the singer close-up; Chorus 2 could be a wide two-shot; Chorus 3 might cut to a symbolic image.
      - NEVER copy-paste the same shot description. Each shot description must be unique across the entire storyboard.
      - Vary the 'subject' field dramatically between shots — different framing, different moment, different emotion.

      Avoid repetitive patterns. For example:
      - If the song has themes of freedom, consider open landscapes, birds in flight, breaking chains, or expansive drone shots rather than generic imagery.
      - If it's a love song, explore specific relationship dynamics from the lyrics rather than generic romantic tropes.
      - For energetic songs, vary between fast-paced editing, dynamic camera moves, vibrant colors, and kinetic compositions.
      - For melancholic songs, use slower pacing, muted colors, intimate close-ups, rain/weather effects, or solitary figure compositions.
      
      For each section in the song's structure, calculate how many shots are needed:
      - Short sections (0-10s): 2-3 shots
      - Medium sections (10-20s): 4-6 shots
      - Long sections (20-40s): 6-10 shots
      - Very long sections (40s+): 10-15 shots

      **LYRIC-SPECIFIC VISUALS**: For EACH shot, the 'subject' description MUST reference a specific lyric line, image, or emotion from that exact moment in the song. Do NOT use generic descriptions. If the lyric says "broken glass on the floor", show broken glass. If the lyric says "I watch the way you walk the room", show the character walking through a room being watched. Be LITERAL with lyric imagery first, then add cinematic interpretation on top.

      **VISUAL CONTRAST BETWEEN SECTIONS**: Each song section must have a distinctly different visual identity:
      - Verses: intimate, grounded, naturalistic — close framing, warm practical lighting
      - Choruses: expansive, heightened, dramatic — wider shots, stylized lighting, more movement
      - Bridge: visual rupture — completely different color palette, location, or visual style from everything before
      - Intro/Outro: establishing/resolving shots that bookend the visual narrative
      
      For EACH SHOT, provide ALL of the following details:
      - A detailed description for 'subject' and 'composition'.
      - **action**: CRITICAL - Specify exactly what the character/subject is doing (e.g., "smiling radiantly at camera", "looking pensively at horizon", "turning head slowly left", "dancing energetically"). This controls character behavior in the video.
      - Reference characters and locations from the bibles by name.
      - **camera_move**: Specify the primary camera movement using professional cinematography language. Think like an expert director — VARY your camera work across shots to create visual rhythm and narrative tension. Available movement vocabulary:
        * DEPTH moves: "Slow push-in", "Dolly in", "Dolly out", "Zoom in", "Zoom out", "Pull back"
        * HORIZONTAL moves: "Pan left", "Pan right", "Tracking left", "Tracking right", "Whip pan"
        * VERTICAL moves: "Tilt up", "Tilt down", "Crane up", "Crane down", "Boom up", "Boom down"
        * ORBITAL moves: "Orbit left", "Orbit right", "Arc shot around subject"
        * STABILIZED moves: "Steadicam follow", "Steadicam reveal", "Handheld"
        * SPECIALTY: "Rack focus", "Parallax", "Push in with rotation (vertigo effect)"
        * STATIC: "Static tripod" — use sparingly and intentionally, not as a default

        **DIRECTOR'S RULES FOR CAMERA MOVEMENT**:
        - Never use the same camera move for more than 2 consecutive shots
        - Establishing/wide shots: use crane up, dolly out, or tracking shots to reveal the space
        - Emotional close-ups: use slow push-in or dolly in to build intimacy
        - High-energy chorus/drop sections: use whip pans, tracking shots, handheld, or orbit shots for kinetic energy
        - Transitions between story beats: use crane moves or steadicam reveals
        - Quiet/introspective moments: use static tripod or slow rack focus
        - When cutting between two characters: alternate between tracking left/right or orbit directions
        - Match camera energy to musical energy — slow deliberate moves for verses, dynamic moves for choruses

      - **cinematic_enhancements**: Be specific. Define a 'lighting_style' (e.g., "High-key, soft fill light"), a 'camera_lens' (e.g., "85mm prime lens", "Wide-angle 24mm"), and a 'camera_motion' that complements the camera_move (e.g., "Slow push-in on subject", "Handheld with subtle shake"). The camera_motion should elaborate on the camera_move with more descriptive detail.
      - **design_agent_feedback**: Provide a critical evaluation. The 'sync_score' (1-10) should reflect how well the shot matches the song's energy at that moment. The 'cohesion_score' (1-10) should reflect how well it fits the overall creative brief. Provide constructive 'feedback'.
      - **lyric_overlay**: If a key lyric is sung during the shot, include it with a suggested 'animation_style' that matches the emotion (e.g., "Aggressive punch-in", "Gentle fade").
      - Set 'preview_image_url' to an empty string.

      For EACH SCENE, provide:
      - 'narrative_beats': A short (1-2 sentence) description of the story progression.
      - 'description': A slightly more detailed summary of the scene's content and mood.
      - 'transitions': Set this to an empty array. It will be filled in later.
      
      ${providerSettings ? `
      **PROMPT ENGINEERING FOR DOWNSTREAM MODELS**:
      When writing the 'subject', 'action', 'composition', and 'cinematic_enhancements' fields for each shot, keep in mind that these will be used to construct prompts for the image and video generation models described below. Write descriptions that align with their optimal prompt style.

      ${getPromptEngineeringKnowledge(providerSettings)}
      ` : ''}

      Song Analysis: ${JSON.stringify(analysis, null, 2)}
      Creative Brief: ${JSON.stringify(brief, null, 2)}
      Visual Bibles: ${JSON.stringify(bibles, null, 2)}
    `;

    const storyboardSchema = {
        type: Type.OBJECT,
        properties: {
            id: { type: Type.STRING, description: "A unique project ID, e.g., proj-123" },
            title: { type: Type.STRING },
            artist: { type: Type.STRING },
            scenes: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        section: { type: Type.STRING },
                        start: { type: Type.NUMBER },
                        end: { type: Type.NUMBER },
                        description: { type: Type.STRING, description: "An optional summary of the scene's content and mood." },
                        narrative_beats: { type: Type.ARRAY, items: { type: Type.STRING } },
                        transitions: { type: Type.ARRAY, items: { type: Type.NULL }, description: "Set this to an empty array." },
                        shots: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.STRING },
                                    start: { type: Type.NUMBER },
                                    end: { type: Type.NUMBER },
                                    shot_type: { type: Type.STRING },
                                    camera_move: { type: Type.STRING },
                                    composition: { type: Type.STRING },
                                    subject: { type: Type.STRING },
                                    action: { type: Type.STRING, description: "What the character/subject is doing (e.g., 'smiling radiantly', 'looking at horizon')" },
                                    location_ref: { type: Type.STRING },
                                    character_refs: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    performer_refs: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Optional: which vocalist(s) are featured in this shot" },
                                    lip_sync_hint: { type: Type.BOOLEAN, description: "Optional: true if this shot should be lip-synced" },
                                    preview_image_url: { type: Type.STRING, description: "Set to an empty string" },
                                    lyric_overlay: {
                                        type: Type.OBJECT,
                                        properties: {
                                            text: { type: Type.STRING },
                                            animation_style: { type: Type.STRING }
                                        }
                                    },
                                    cinematic_enhancements: {
                                        type: Type.OBJECT,
                                        properties: {
                                            lighting_style: { type: Type.STRING },
                                            camera_lens: { type: Type.STRING },
                                            camera_motion: { type: Type.STRING },
                                        },
                                        required: ['lighting_style', 'camera_lens', 'camera_motion']
                                    },
                                    design_agent_feedback: {
                                        type: Type.OBJECT,
                                        properties: {
                                            sync_score: { type: Type.INTEGER },
                                            cohesion_score: { type: Type.INTEGER },
                                            placement: { type: Type.STRING },
                                            feedback: { type: Type.STRING },
                                        },
                                        required: ['sync_score', 'cohesion_score', 'placement', 'feedback']
                                    }
                                },
                                required: ['id', 'start', 'end', 'shot_type', 'camera_move', 'composition', 'subject', 'action', 'location_ref', 'character_refs', 'preview_image_url', 'cinematic_enhancements', 'design_agent_feedback'],
                            },
                        },
                    },
                    required: ['id', 'section', 'start', 'end', 'shots', 'narrative_beats', 'transitions'],
                },
            },
        },
        required: ['id', 'title', 'artist', 'scenes'],
    };

    const result = await generateText({
        prompt,
        responseSchema: storyboardSchema,
        providerSettings,
        geminiModel,
        maxTokens: 16384,
    });
    const storyboard = JSON.parse(result.text) as Storyboard;

    // Post-process to guarantee full coverage with 6–8s shots aligned to beats
    const covered = ensureStoryboardCoverage(analysis, brief, bibles, storyboard);

    // Assign every shot a simple, globally unique sequential number
    let shotNum = 1;
    for (const scene of covered.scenes) {
        for (const shot of scene.shots) {
            shot.id = `shot-${shotNum}`;
            shotNum++;
        }
    }
    console.log(`AI Service: Storyboard has ${shotNum - 1} shots with unique IDs (shot-1 through shot-${shotNum - 1})`);

    return { storyboard: covered, tokenUsage: 4000 };
};

// === STORYBOARD COVERAGE ENFORCER ===
function ensureStoryboardCoverage(
    analysis: SongAnalysis,
    brief: CreativeBrief,
    bibles: Bibles,
    sb: Storyboard
): Storyboard {
    try {
        const structure = Array.isArray(analysis?.structure) ? analysis.structure : [];
        const characters = Array.isArray(bibles?.characters) ? bibles.characters.filter(Boolean) : [];
        const locations = Array.isArray(bibles?.locations) ? bibles.locations.filter(Boolean) : [];
        const totalDuration = structure.length > 0 ? structure[structure.length - 1]?.end || 0 : 0;
        const expectedShots = Math.max(1, Math.ceil(totalDuration / 4));

        // Helper: snap a time to the nearest beat within a window
        const beats = (analysis.beats || []).map(b => b.time).sort((a, b) => a - b);
        const snapToBeat = (t: number): number => {
            if (beats.length === 0) return Math.max(0, Math.min(totalDuration, t));
            let lo = 0, hi = beats.length - 1, best = beats[0];
            while (lo <= hi) {
                const mid = (lo + hi) >> 1;
                const bt = beats[mid];
                if (Math.abs(bt - t) < Math.abs(best - t)) best = bt;
                if (bt < t) lo = mid + 1; else hi = mid - 1;
            }
            return Math.max(0, Math.min(totalDuration, best));
        };

        // Build index: vocalist -> character name
        const vocalistMap: Record<string, string> = {};
        const vocalists = analysis.vocals?.vocalists || [];
        for (let i = 0; i < vocalists.length && i < characters.length; i++) {
            vocalistMap[vocalists[i].id] = characters[i].name;
        }

        // Compute scenes by structure sections; ensure each has enough shots
        const scenes = [...(sb.scenes || [])].map(s => ({ ...s, shots: [...(s.shots || [])], transitions: Array.isArray(s.transitions) ? s.transitions : [] }));
        const sectionMap = new Map<string, { start: number; end: number; name: string }>();
        for (const sec of structure) sectionMap.set(sec.name + ':' + sec.start, { start: sec.start, end: sec.end, name: sec.name });

        // Fill or create scenes per section
        const ensureShotsForSection = (sectionName: string, start: number, end: number) => {
            const duration = Math.max(0, end - start);
            const target = Math.max(1, Math.ceil(duration / 4));
            // Find existing scene or create
            let scene = scenes.find(sc => sc.section === sectionName && Math.abs(sc.start - start) < 1.5);
            if (!scene) {
                scene = {
                    id: `${sectionName}-${start.toFixed(1)}`,
                    section: sectionName,
                    start, end,
                    shots: [],
                    transitions: [],
                    narrative_beats: [],
                    description: ''
                } as any;
                scenes.push(scene);
            }
            // Add shots until target reached, enforcing 6–8s
            const existing = scene.shots.sort((a, b) => a.start - b.start);
            let t = start;
            // If existing shots, advance t
            if (existing.length > 0) t = Math.max(t, existing[existing.length - 1].end);
            let shotIndex = existing.length;
            while (shotIndex < target && t + 2.5 < end) {
                const rawStart = snapToBeat(t);
                const desired = 4; // seconds — music videos cut fast
                const rawEnd = snapToBeat(Math.min(end, rawStart + desired));
                const clipDur = Math.max(3, Math.min(5, rawEnd - rawStart || desired));
                const finalEnd = snapToBeat(Math.min(end, rawStart + clipDur));

                // Choose defaults
                const primaryChar = characters[0]?.name;
                const loc = locations[0]?.name;
                const id = `${sectionName}-${Math.round(rawStart * 10)}`;

                // Determine performers and lip-sync hint
                const performer_refs: string[] = [];
                let lipSync = false;
                for (const v of vocalists) {
                    const hasOverlap = (v.segments || []).some(seg => Math.max(seg.start, rawStart) < Math.min(seg.end, finalEnd));
                    if (hasOverlap) {
                        lipSync = true;
                        const mapped = vocalistMap[v.id] || primaryChar;
                        if (mapped) performer_refs.push(mapped);
                    }
                }

                // Expert director: rotate camera moves per shot to avoid monotony
                const sectionLower = sectionName.toLowerCase();
                const isChorus = /chorus|hook|drop/.test(sectionLower);
                const isBridge = /bridge|break|interlude/.test(sectionLower);
                const isOutro = /outro|ending|coda/.test(sectionLower);
                const isIntro = /intro|opening/.test(sectionLower);

                // Camera move palette — varied by section energy like an expert editor
                const verseMoves = [
                    { move: 'Slow push-in', motion: 'Slow dolly in on subject', lens: '85mm prime', shot: 'Medium close-up' },
                    { move: 'Tracking left', motion: 'Lateral tracking following subject', lens: '50mm prime', shot: 'Medium shot' },
                    { move: 'Rack focus', motion: 'Focus pull from foreground to subject', lens: '85mm prime', shot: 'Close-up' },
                    { move: 'Static tripod', motion: 'Locked off static composition', lens: '35mm wide', shot: 'Wide shot' },
                    { move: 'Tilt up', motion: 'Slow vertical tilt revealing subject', lens: '50mm prime', shot: 'Low angle medium' },
                    { move: 'Dolly out', motion: 'Gradual pull back revealing environment', lens: '35mm wide', shot: 'Medium wide' },
                ];
                const chorusMoves = [
                    { move: 'Orbit right', motion: 'Dynamic arc around subject', lens: '24mm wide-angle', shot: 'Dynamic medium' },
                    { move: 'Crane up', motion: 'Rising crane revealing wide scene', lens: '24mm wide-angle', shot: 'Wide establishing' },
                    { move: 'Whip pan', motion: 'Fast whip pan with motion blur', lens: '35mm wide', shot: 'Dynamic wide' },
                    { move: 'Steadicam follow', motion: 'Fluid steadicam tracking subject', lens: '35mm wide', shot: 'Tracking medium' },
                    { move: 'Handheld', motion: 'Energetic handheld with organic shake', lens: '50mm prime', shot: 'Close-up' },
                    { move: 'Tracking right', motion: 'Fast lateral track matching energy', lens: '24mm wide-angle', shot: 'Dynamic medium' },
                ];
                const bridgeMoves = [
                    { move: 'Steadicam reveal', motion: 'Smooth orbiting reveal of subject', lens: '50mm prime', shot: 'Medium shot' },
                    { move: 'Crane down', motion: 'Descending crane approaching subject', lens: '85mm prime', shot: 'Close-up' },
                    { move: 'Parallax', motion: 'Lateral parallax with depth separation', lens: '85mm prime', shot: 'Medium close-up' },
                ];
                const introMoves = [
                    { move: 'Crane up', motion: 'Rising crane establishing the scene', lens: '24mm wide-angle', shot: 'Wide establishing' },
                    { move: 'Dolly in', motion: 'Slow dolly forward approaching subject', lens: '35mm wide', shot: 'Wide to medium' },
                    { move: 'Tilt down', motion: 'Descending tilt revealing subject', lens: '50mm prime', shot: 'Medium shot' },
                ];
                const outroMoves = [
                    { move: 'Dolly out', motion: 'Slow pull back retreating from subject', lens: '35mm wide', shot: 'Medium to wide' },
                    { move: 'Crane up', motion: 'Ascending crane for final wide shot', lens: '24mm wide-angle', shot: 'Wide establishing' },
                    { move: 'Static tripod', motion: 'Locked off contemplative composition', lens: '85mm prime', shot: 'Close-up' },
                ];

                const movePool = isChorus ? chorusMoves
                    : isBridge ? bridgeMoves
                    : isIntro ? introMoves
                    : isOutro ? outroMoves
                    : verseMoves;
                const pick = movePool[shotIndex % movePool.length];

                // Build a unique subject line from actual lyric content + visual elements
                const charName = primaryChar || 'Subject';
                const locName = loc || 'the setting';
                const lyricAnalysis = analysis.lyric_analysis;
                const keyVisuals = lyricAnalysis?.key_visual_elements || [];
                const themes = lyricAnalysis?.primary_themes || [];
                const emotionalArc = lyricAnalysis?.emotional_arc || '';
                const lineByLine = lyricAnalysis?.line_by_line_story || '';

                // Extract visual cues from the line-by-line story for this section
                const sectionStoryLines = lineByLine.split(/[.\n]/).filter(l => l.trim().length > 10);
                const sectionVisual = keyVisuals[shotIndex % Math.max(1, keyVisuals.length)] || '';
                const sectionTheme = themes[shotIndex % Math.max(1, themes.length)] || '';

                // Build lyric-aware subjects that vary by section type AND actual song content
                const buildSubject = (): string => {
                    const storyHint = sectionStoryLines[shotIndex % Math.max(1, sectionStoryLines.length)] || '';
                    const visualHint = sectionVisual;

                    if (isIntro) {
                        const introOptions = [
                            `Wide establishing shot of ${locName}, ${visualHint || 'atmospheric haze'}, setting the tone for ${sectionTheme || 'the story'}`,
                            `Slow reveal of ${charName} in silhouette, ${emotionalArc.split(',')[0] || 'contemplative mood'}, opening moment`,
                            `Detail shot: ${visualHint || 'symbolic object'} in ${locName}, shallow focus, narrative foreshadowing`,
                            `${charName} alone in ${locName}, first glimpse — ${storyHint || 'the world before the story begins'}`,
                        ];
                        return introOptions[shotIndex % introOptions.length];
                    }
                    if (isChorus) {
                        const chorusOptions = [
                            `${charName} ${storyHint ? '— ' + storyHint.trim() : 'expressing raw emotion'}, dramatic lighting, wide framing`,
                            `Dynamic shot of ${visualHint || charName}, energy peaks, ${sectionTheme || 'heightened emotion'} fills the frame`,
                            `${charName} center frame, ${storyHint || 'the core emotion laid bare'}, cinematic backlighting`,
                            `${visualHint || charName} in motion, chorus energy — ${sectionTheme || 'passion and intensity'}`,
                            `Wide shot: ${charName} and ${locName} unified, ${storyHint || 'the emotional climax of this moment'}`,
                            `Close-up: ${charName}'s face, ${storyHint || 'singing with full conviction'}, light flaring behind`,
                        ];
                        return chorusOptions[shotIndex % chorusOptions.length];
                    }
                    if (isBridge) {
                        const bridgeOptions = [
                            `Extreme close-up of ${charName}, ${storyHint || 'moment of transformation'}, shifting light`,
                            `${visualHint || 'Symbolic imagery'}: ${storyHint || 'the turning point'}, different color palette from earlier`,
                            `${charName} in a new visual context — ${storyHint || 'everything changes here'}, dramatic contrast`,
                        ];
                        return bridgeOptions[shotIndex % bridgeOptions.length];
                    }
                    if (isOutro) {
                        const outroOptions = [
                            `${charName} ${storyHint || 'finding resolution'}, fading warm light, sense of closure`,
                            `Final wide shot of ${locName}, ${visualHint || 'the world after the story'}, peaceful`,
                            `Slow pull back from ${charName}, ${emotionalArc.split(',').pop()?.trim() || 'quiet acceptance'}, ending`,
                        ];
                        return outroOptions[shotIndex % outroOptions.length];
                    }
                    // Verse — intimate, grounded, lyric-literal
                    const verseOptions = [
                        `${charName} ${storyHint || 'in a quiet moment'}, naturalistic lighting in ${locName}`,
                        `Close framing: ${charName} with ${visualHint || 'meaningful detail'}, ${sectionTheme || 'introspection'}`,
                        `${charName} moving through ${locName}, ${storyHint || 'the story unfolds'}, warm practical light`,
                        `Detail shot: ${visualHint || 'hands, texture, environment'} — ${sectionTheme || 'grounding the narrative'}`,
                        `${charName} interacting with the space, ${storyHint || 'living in the lyrics'}, intimate framing`,
                        `${locName} framed around ${charName}, ${visualHint || 'visual metaphor'}, ${storyHint || 'verse narrative'}`,
                    ];
                    return verseOptions[shotIndex % verseOptions.length];
                };
                const subject = buildSubject();

                const newShot: StoryboardShot = {
                    id,
                    start: rawStart,
                    end: finalEnd,
                    shot_type: pick.shot,
                    camera_move: pick.move,
                    composition: 'Rule of thirds, shallow depth of field',
                    subject,
                    action: subject.split(',').slice(1).join(',').trim() || 'expressing emotion naturally',
                    location_ref: loc || 'Primary Location',
                    character_refs: primaryChar ? [primaryChar] : [],
                    performer_refs: performer_refs.length ? performer_refs : undefined,
                    lip_sync_hint: lipSync || undefined,
                    preview_image_url: '',
                    cinematic_enhancements: {
                        lighting_style: 'Cinematic key light with soft fill',
                        camera_lens: pick.lens,
                        camera_motion: pick.motion
                    },
                    design_agent_feedback: {
                        sync_score: 8,
                        cohesion_score: 8,
                        placement: 'Aligned to beat grid',
                        feedback: 'Auto-generated coverage shot aligned to music.'
                    }
                } as any;

                const shotWithModel = { ...newShot, ...chooseVideoModel(newShot, sectionName, brief) };
                scene.shots.push(shotWithModel);
                shotIndex++;
                t = finalEnd; // No gap — next shot starts right where this one ends for tight editing
            }
            // Ensure transitions array length
            const shotCount = scene.shots.length;
            if (!scene.transitions || scene.transitions.length !== Math.max(0, shotCount - 1)) {
                scene.transitions = new Array(Math.max(0, shotCount - 1)).fill(null);
            }
        };

        for (const sec of structure) {
            ensureShotsForSection(sec.name, sec.start, sec.end);
        }

        // If global shot count still low, add more to longest sections
        const flatShots = scenes.flatMap(s => s.shots);
        if (flatShots.length < expectedShots) {
            const sectionsByDur = [...structure].sort((a, b) => (b.end - b.start) - (a.end - a.start));
            let idx = 0;
            while (scenes.flatMap(s => s.shots).length < expectedShots && idx < sectionsByDur.length) {
                const sec = sectionsByDur[idx++];
                ensureShotsForSection(sec.name, sec.start, sec.end);
            }
        }

        // Sort scenes and shots
        scenes.sort((a, b) => a.start - b.start);
        for (const s of scenes) s.shots.sort((a, b) => a.start - b.start);

        const scenesWithModelHints = scenes.map(scene => ({
            ...scene,
            shots: scene.shots.map(shot => ({
                ...shot,
                ...(shot.video_model ? {} : chooseVideoModel(shot, scene.section || '', brief))
            }))
        }));

        return { ...sb, scenes: scenesWithModelHints };
    } catch (e) {
        console.warn('ensureStoryboardCoverage failed, returning original storyboard', e);
        return sb;
    }
}

/**
 * Generate an image using the user's configured image provider.
 * OpenRouter uses /chat/completions with modalities: ["image"].
 * Other providers (HuggingFace, etc.) use /images/generations.
 */
async function generateImageWithProvider(provider: AIProvider, prompt: string): Promise<{ imageUrl: string, tokenUsage: number }> {
    return backendService.generateProviderImage({
        provider,
        prompt,
        width: 1024,
        height: 576,
    });
}

export const generateImageForShot = async (shot: StoryboardShot, bibles: Bibles, brief: CreativeBrief, providerSettings?: AIProviderSettings): Promise<{ imageUrl: string, tokenUsage: number }> => {
    // Use model-optimized prompt if provider settings are available
    const optimized = providerSettings ? getOptimizedImagePrompt(shot, bibles, brief, providerSettings) : null;
    const prompt = optimized?.prompt || getPromptForImageShot(shot, bibles, brief);

    const imageProvider = providerSettings?.image;
    const isComfyUIProvider = imageProvider?.id === 'comfyui' || imageProvider?.id === 'comfyui-video';

    // --- If a non-ComfyUI provider is configured, use it directly ---
    if (imageProvider && !isComfyUIProvider) {
        console.log(`AI Service: Generating shot image via provider: ${imageProvider.id}`, shot.id);
        return generateImageWithProvider(imageProvider, prompt);
    }

    // --- Priority 1: ComfyUI with IP-Adapter face lock (best consistency) ---
    const characterRef = shot.character_refs?.[0];
    const character = characterRef ? bibles.characters.find(c => c.name === characterRef) : null;
    const referenceImageUrl = character?.source_images?.[0];
    if (referenceImageUrl && referenceImageUrl !== 'error') {
        try {
            const health = await backendService.checkComfyUIHealth();
            if (health.available) {
                console.log(`AI Service: Using ComfyUI + IP-Adapter for face consistency (ref: ${character?.name})`, shot.id);
                const enhancedPrompt = getEnhancedPromptForComfyUI(shot, bibles, brief);
                const result = await backendService.generateImageWithComfyUI({
                    prompt: enhancedPrompt,
                    negative_prompt: "blurry, low quality, worst quality, bad anatomy, deformed, disfigured, multiple heads, extra limbs, watermark, text, signature, face morphing, different person, changing face",
                    width: 1280,
                    height: 720,
                    steps: 35,
                    cfg_scale: 7.5,
                    reference_face_image: referenceImageUrl,
                    ipadapter_weight: 0.85,
                });
                return { imageUrl: result.imageUrl, tokenUsage: 0 };
            }
        } catch (error) {
            console.warn('AI Service: ComfyUI IP-Adapter failed, falling through to API provider:', error);
        }
    }

    // --- ComfyUI without IP-Adapter ---
    try {
        console.log("AI Service: Checking ComfyUI availability...");
        const health = await backendService.checkComfyUIHealth(imageProvider?.baseUrl);

        if (health.available) {
            console.log("AI Service: Generating image for shot with ComfyUI...", shot.id);

            // Get character reference image from bible if available
            const characterRef = shot.character_refs[0]; // Primary character
            const character = characterRef ? bibles.characters.find(c => c.name === characterRef) : null;
            // Use the character's bible portrait (stored in source_images after generation) for IP-Adapter face consistency
            const referenceImageUrl = character?.source_images?.[0];

            const enhancedPrompt = getEnhancedPromptForComfyUI(shot, bibles, brief);
            console.log("AI Service: Enhanced prompt length:", enhancedPrompt.length);
            console.log("AI Service: Enhanced prompt preview:", enhancedPrompt.substring(0, 200));
            console.log("AI Service: Character reference for IP-Adapter:", referenceImageUrl ? "YES" : "NO");

            const params: any = {
                prompt: enhancedPrompt,
                baseUrl: imageProvider?.baseUrl,
                negative_prompt: "blurry, low quality, worst quality, bad anatomy, deformed, disfigured, extra limbs, extra fingers, missing limbs, watermark, text, signature, amateur, low res, jpeg artifacts, grainy, inconsistent lighting, unrealistic, bad proportions, duplicate, clone, cartoon, anime, illustration, 3d render, painting",
                width: 1024,
                height: 576,
                steps: 50,
                cfg_scale: 7.5,
                shotId: shot.id,
                generationType: 'shot'
            };

            // IP-Adapter face consistency: use the character's bible portrait
            // This keeps the character's face consistent across all shots
            const faceRefUrl = referenceImageUrl;
            if (faceRefUrl) {
                let faceBase64 = faceRefUrl;
                if (faceRefUrl.startsWith('http')) {
                    try {
                        const resp = await fetch(faceRefUrl);
                        const blob = await resp.blob();
                        const reader = new FileReader();
                        faceBase64 = await new Promise((resolve) => {
                            reader.onload = () => resolve(reader.result as string);
                            reader.readAsDataURL(blob);
                        });
                        console.log("AI Service: Converted face reference to base64 for IP-Adapter");
                    } catch (e) {
                        console.warn("AI Service: Failed to convert face reference to base64", e);
                        faceBase64 = "";
                    }
                }

                if (faceBase64) {
                    params.reference_face_image = faceBase64;
                    params.ipadapter_weight = 0.85;
                    console.log("AI Service: IP-Adapter face consistency enabled");
                }
            } else {
                console.log("AI Service: No character portrait — generating without IP-Adapter face lock");
            }

            const result = await backendService.generateImageWithComfyUI(params);
            return { imageUrl: result.imageUrl, tokenUsage: 0 };
        } else {
            console.log("AI Service: ComfyUI unavailable, trying provider fallback...");
        }
    } catch (error) {
        console.warn("AI Service: ComfyUI generation failed, trying provider fallback:", error);
    }

    // Fallback: use configured image provider (OpenRouter/FLUX, HuggingFace, etc.)
    const fallbackProvider = providerSettings?.image;
    if (fallbackProvider) {
        console.log(`AI Service: Generating shot image via provider: ${fallbackProvider.id}`);
        return generateImageWithProvider(fallbackProvider, prompt);
    }

    throw new Error("All image generation methods failed. Please check your image provider settings and API key.");
};

export const generateImageForBibleCharacter = async (character: CharacterBible, brief: CreativeBrief, providerSettings?: AIProviderSettings): Promise<{ imageUrl: string, tokenUsage: number }> => {
    const pa = character.physical_appearance || {} as any;
    const cos = character.costuming_and_props || {} as any;
    const cin = character.cinematic_style || {} as any;

    const prompt = `
      A cinematic 3:4 aspect ratio character reference photo. Ultra-realistic, photorealistic skin with visible pores, anatomically perfect face.
      - Style: ${safe(brief.style)}, ${safe(brief.feel)}.
      - Character Name: ${safe(character.name)}.
      - Gender/Ethnicity: ${safe(pa.gender_presentation)}, ${safe(pa.ethnicity)}, ${safe(pa.age_range)} years old, ${safe(pa.body_type)} build.
      - Skin: ${safe(pa.skin_tone)}.
      - Face: ${safe(pa.face_shape)} face shape. Nose: ${safe(pa.nose_description)}. Lips: ${safe(pa.lip_description)}. Brows: ${safe(pa.brow_description)}. Jaw: ${safe(pa.jawline_description)}.
      - Eyes: ${safe(pa.eye_shape)}, ${safe(pa.eye_color)}.
      - Distinguishing features: ${safe(pa.key_facial_features, 'none')}.
      - Hair: ${safe(pa.hair_style_and_color)}, ${safe(pa.hair_texture)} texture.
      - Outfit (head to toe): ${safe(cos.outfit_style)} — ${safeJoin(cos.specific_clothing_items)}.
      ${safeJoin(cos.signature_props) ? `- Props: ${safeJoin(cos.signature_props)}.` : ''}
      - Cinematic Lighting: ${safe(cin.lighting_style)}.
    `;

    const enhancedPrompt = `
Cinematic ${safe(brief.style)} character reference portrait, ${safe(brief.feel)} mood, 3:4 aspect ratio.
${safe(character.name)}: ${safe(pa.gender_presentation)} ${safe(pa.ethnicity)} person, ${safe(pa.age_range)} years old, ${safe(pa.body_type)} build.
Skin: ${safe(pa.skin_tone)}.
Face: ${safe(pa.face_shape)} face. Nose: ${safe(pa.nose_description)}. Lips: ${safe(pa.lip_description)}. Brows: ${safe(pa.brow_description)}. Jaw: ${safe(pa.jawline_description)}.
Eyes: ${safe(pa.eye_shape)}, ${safe(pa.eye_color)}.
${pa.key_facial_features ? `Distinguishing features: ${pa.key_facial_features}.` : ''}
Hair: ${safe(pa.hair_style_and_color)}, ${safe(pa.hair_texture)} texture.
Wearing ${safe(cos.outfit_style)}: ${safeJoin(cos.specific_clothing_items)}.
${safeJoin(cos.signature_props) ? `Props: ${safeJoin(cos.signature_props)}.` : ''}
Expression: ${safe(character.performance_and_demeanor?.emotional_arc)}.
Lighting: ${safe(cin.lighting_style)}.
Style: ${safeJoin(cin.color_dominants_in_shots)} color palette.
Ultra-realistic RAW photo, photorealistic skin texture, visible pores, subsurface scattering, anatomically perfect face, sharp focus, ${cin.camera_lenses}.
    `.trim().replace(/^ +/gm, '');

    // ComfyUI image generation
    try {
        console.log("AI Service: Checking ComfyUI availability...");
        const health = await backendService.checkComfyUIHealth();

        if (health.available) {
            console.log("AI Service: Generating character image with ComfyUI...", character.name);
            const result = await backendService.generateImageWithComfyUI({
                prompt: enhancedPrompt,
                negative_prompt: "blurry, low quality, worst quality, bad anatomy, deformed, disfigured, multiple heads, multiple people, extra limbs, extra fingers, missing limbs, watermark, text, signature, amateur, low res, duplicate face, inconsistent features, clone, bad proportions, plastic skin, airbrushed, smooth skin, doll-like, uncanny valley, asymmetric eyes, wrong eye color, face morphing, hair color change, outfit change",
                width: 768,
                height: 1024,
                steps: 50,
                cfg_scale: 9
            });
            return { imageUrl: result.imageUrl, tokenUsage: 0 };
        }
    } catch (error) {
        console.warn("AI Service: ComfyUI generation failed:", error);
    }

    throw new Error("Character image generation failed. Please check your image provider settings.");
};

export const generateImageForBibleLocation = async (location: LocationBible, brief: CreativeBrief, providerSettings?: AIProviderSettings): Promise<{ imageUrl: string, tokenUsage: number }> => {
    const atm = location.atmosphere_and_environment || {} as any;
    const arch = location.architectural_and_natural_details || {} as any;
    const sens = location.sensory_details || {} as any;
    const cin = location.cinematic_style || {} as any;

    const prompt = `
       A cinematic 16:9 aspect ratio environment concept art photo.
      - Style: ${safe(brief.style)}, ${safe(brief.feel)}.
      - Location Name: ${safe(location.name)} (${safe(location.setting_type)}).
      - Atmosphere: ${safe(atm.dominant_mood)} mood, during the ${safe(atm.time_of_day)} with ${safe(atm.weather)}.
      - Key Features: ${safe(arch.style)}, featuring ${safeJoin(arch.key_features)}.
      - Environmental Effects: ${safeJoin(sens.environmental_effects)}.
      - Cinematic Lighting: ${safe(cin.lighting_style)}.
    `;

    const enhancedPrompt = `
Cinematic ${brief.style} environment concept art, ${brief.feel} mood, 16:9 aspect ratio.
${location.name}: ${location.setting_type}.
Time: ${safe(atm.time_of_day)}, Weather: ${safe(atm.weather)}, Mood: ${safe(atm.dominant_mood)}.
Architecture: ${safe(arch.style)} style featuring ${safeJoin(arch.key_features)}.
Textures: ${safeJoin(sens.textures)}.
Environmental effects: ${safeJoin(sens.environmental_effects)}.
Lighting: ${safe(cin.lighting_style)}.
Color palette: ${safeJoin(cin.color_palette)}.
Camera: ${safe(cin.camera_perspective)}.
Professional environment concept art, high detail, sharp focus, photorealistic, no people.
    `.trim().replace(/^ +/gm, '');

    // Try ComfyUI first
    try {
        console.log("AI Service: Checking ComfyUI availability...");
        const health = await backendService.checkComfyUIHealth();

        if (health.available) {
            console.log("AI Service: Generating location image with ComfyUI...", location.name);
            const result = await backendService.generateImageWithComfyUI({
                prompt: enhancedPrompt,
                negative_prompt: "blurry, low quality, worst quality, distorted, people, characters, humans, figures, watermark, text, signature, amateur, low res, jpeg artifacts, grainy, unrealistic lighting",
                width: 1024,
                height: 576,
                steps: 45,
                cfg_scale: 8
            });
            return { imageUrl: result.imageUrl, tokenUsage: 0 };
        }
    } catch (error) {
        console.warn("AI Service: ComfyUI generation failed, trying provider fallback:", error);
    }

    // Fallback: use configured image provider (OpenRouter/FLUX, HuggingFace, etc.)
    const imageProvider = providerSettings?.image;
    if (imageProvider) {
        console.log(`AI Service: Generating location image via provider: ${imageProvider.id}`);
        return generateImageWithProvider(imageProvider, enhancedPrompt);
    }

    throw new Error("Location image generation failed. Please check your image provider settings.");
};


export const editImageForShot = async (shot: StoryboardShot, bibles: Bibles, brief: CreativeBrief, userPrompt: string): Promise<{ imageUrl: string, tokenUsage: number }> => {
    console.log("AI Service: Editing image for shot with Gemini...", shot.id, userPrompt);
    if (!shot.preview_image_url.startsWith('data:')) {
        throw new Error("Cannot edit a non-data URL image.");
    }
    return backendService.editImageWithGemini(shot.preview_image_url, userPrompt);
};


export const generateClipForShot = async (
    shot: StoryboardShot,
    image: string,
    bibles: Bibles,
    brief: CreativeBrief,
    providerSettings?: AIProviderSettings
): Promise<{ clipUrl: string, tokenUsage: number }> => {
    console.log(`AI Service: Generating clip for shot...`, shot.id);

    // Helper: map shot camera hints to backend-friendly motion tag (expert director vocabulary)
    const mapCameraMotion = (cameraMove: string, cinematicMotion?: string): string => {
        const combined = `${cameraMove || ''} ${cinematicMotion || ''}`.toLowerCase();

        // Zoom / Dolly depth moves
        if (combined.includes('zoom in') || combined.includes('push in') || combined.includes('push-in')) {
            return combined.includes('slow') ? 'slow_push_in' : 'zoom_in';
        }
        if (combined.includes('dolly in') || combined.includes('dolly forward') || combined.includes('creep in')) return 'dolly_in';
        if (combined.includes('zoom out') || combined.includes('pull back') || combined.includes('pulling back')) return 'zoom_out';
        if (combined.includes('dolly out') || combined.includes('dolly back') || combined.includes('retreat')) return 'dolly_out';

        // Pan (horizontal rotation)
        if (combined.includes('pan left') || combined.includes('panning left')) return 'pan_left';
        if (combined.includes('pan right') || combined.includes('panning right')) return 'pan_right';
        if (combined.includes('whip pan') || combined.includes('swish pan')) return 'whip_pan';

        // Tilt (vertical rotation)
        if (combined.includes('tilt up') || combined.includes('tilting up')) return 'tilt_up';
        if (combined.includes('tilt down') || combined.includes('tilting down')) return 'tilt_down';

        // Tracking / lateral dolly
        if (combined.includes('tracking left') || combined.includes('track left') || combined.includes('crab left')) return 'tracking_left';
        if (combined.includes('tracking right') || combined.includes('track right') || combined.includes('crab right')) return 'tracking_right';
        if (combined.includes('tracking') || combined.includes('follow')) return 'steadicam_follow';

        // Crane / Jib
        if (combined.includes('crane up') || combined.includes('jib up') || combined.includes('boom up') || combined.includes('rising')) return 'crane_up';
        if (combined.includes('crane down') || combined.includes('jib down') || combined.includes('boom down') || combined.includes('descending')) return 'crane_down';

        // Orbit / Arc
        if (combined.includes('orbit left') || combined.includes('arc left') || combined.includes('circling left')) return 'orbit_left';
        if (combined.includes('orbit right') || combined.includes('arc right') || combined.includes('circling right')) return 'orbit_right';
        if (combined.includes('orbit') || combined.includes('arc shot') || combined.includes('circling')) return 'orbit_left';

        // Steadicam / Stabilized
        if (combined.includes('steadicam') || combined.includes('gimbal')) {
            return combined.includes('reveal') ? 'steadicam_reveal' : 'steadicam_follow';
        }

        // Handheld
        if (combined.includes('handheld') || combined.includes('shaky') || combined.includes('documentary')) return 'handheld';

        // Specialty
        if (combined.includes('rack focus') || combined.includes('focus pull')) return 'rack_focus';
        if (combined.includes('parallax')) return 'parallax';
        if (combined.includes('vertigo') || combined.includes('contra-zoom')) return 'push_in_rotate';

        if (combined.includes('static') || combined.includes('locked') || combined.includes('tripod')) return 'static';

        return 'static';
    };

    // Route to local ComfyUI via backend
    const rawDuration = typeof shot.end === 'number'
        ? shot.end - (shot.start ?? 0)
        : 6;
    const duration = Math.max(6, Math.min(8, rawDuration || 6));
    const bpm = (brief as any)?.bpm || 120;
    const fps = Math.max(12, Math.min(24, Math.round(bpm / 6)));
    const width = 1280;
    const height = 720;
    // Use model-optimized prompt if provider settings are available
    const optimized = providerSettings ? getOptimizedVideoPrompt(shot, bibles, brief, providerSettings) : null;
    const prompt = optimized?.prompt || getPromptForClipShot(shot, bibles, brief, false);
    const camera_motion = mapCameraMotion(shot.camera_move, shot.cinematic_enhancements?.camera_motion);

    const { promptId } = await backendService.generateVideoClip({
        baseUrl: providerSettings?.video?.baseUrl,
        imageUrl: image,
        prompt,
        duration,
        quality: 'draft',
        camera_motion,
        lipSync: !!shot.lip_sync_hint,
        audioUrl: undefined,
        shotId: shot.id,
        workflow: shot.workflow_hint as any,
        video_model: shot.video_model,
        render_profile: shot.render_profile,
        fps,
        width,
        height
    });

    let attempts = 0;
    const maxAttempts = 300; // ~5 minutes polling at 1s
    while (attempts < maxAttempts) {
        await new Promise(res => setTimeout(res, 1000));
        attempts++;
        const status = await backendService.getVideoClipStatus(promptId);
        if (status?.success && status.clipUrl) {
            return { clipUrl: status.clipUrl, tokenUsage: 0 };
        }
        if (status?.error) {
            throw new Error(status.error);
        }
    }
    throw new Error('Video generation timed out');
};

export const analyzeMoodboardImages = async (
    images: { mimeType: string, data: string }[],
    providerSettings?: AIProviderSettings
): Promise<{ briefUpdate: Partial<CreativeBrief>, tokenUsage: number }> => {
    console.log(`AI Service: Analyzing ${images.length} moodboard images via provider...`);
    const geminiModel = 'gemini-2.5-flash';

    const moodboardPrompt = "Analyze the following images from a mood board for a music video. Describe the overall 'feel' and 'style', and extract the 5 most dominant colors as hex codes. Respond with a valid JSON object.";
    const moodboardSchema = {
        type: Type.OBJECT,
        properties: {
            feel: { type: Type.STRING },
            style: { type: Type.STRING },
            color_palette: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['feel', 'style', 'color_palette'],
    };

    const result = await generateText({
        prompt: moodboardPrompt,
        responseSchema: moodboardSchema,
        images: images.map(img => ({ data: img.data, mimeType: img.mimeType })),
        providerSettings,
        geminiModel,
        geminiContents: {
            parts: [
                { text: moodboardPrompt },
                ...images.map(img => ({ inlineData: { mimeType: img.mimeType, data: img.data } })),
            ],
        },
    });

    const briefUpdate = JSON.parse(result.text) as Partial<CreativeBrief>;
    return { briefUpdate, tokenUsage: result.tokenUsage || 1200 };
};

export const getDirectorSuggestions = async (songAnalysis: SongAnalysis, currentBrief: CreativeBrief, providerSettings?: AIProviderSettings): Promise<{ suggestions: Partial<CreativeBrief>, tokenUsage: number }> => {
    console.log(`AI Service: Getting director suggestions via provider...`);
    const geminiModel = 'gemini-2.5-flash';

    const prompt = `
      You are a helpful and creative AI music video director. Based on the provided song analysis and the user's current brief (which may be partially filled), enhance and complete the brief.
      Provide creative, specific, and cohesive ideas for the 'feel', 'style', and 'user_notes' fields.
      Your suggestions should be inspiring and directly related to the song's mood and genre.
      The 'user_notes' should contain a few concrete visual ideas.
      The output must be a valid JSON object.

      Song Analysis: ${JSON.stringify(songAnalysis, null, 2)}
      Current User Brief: ${JSON.stringify(currentBrief, null, 2)}
    `;

    const directorSchema = {
        type: Type.OBJECT,
        properties: {
            feel: { type: Type.STRING },
            style: { type: Type.STRING },
            user_notes: { type: Type.STRING },
        },
        required: ['feel', 'style', 'user_notes'],
    };

    const result = await generateText({
        prompt,
        responseSchema: directorSchema,
        providerSettings,
        geminiModel,
    });

    const suggestions = JSON.parse(result.text) as Partial<CreativeBrief>;
    return { suggestions, tokenUsage: result.tokenUsage || 1000 };
};

export const suggestBeatSyncedVfx = async (songAnalysis: SongAnalysis, storyboard: Storyboard, providerSettings?: AIProviderSettings): Promise<{ suggestions: { shotId: string; vfx: VFX_PRESET }[], tokenUsage: number }> => {
    console.log(`AI Service: Suggesting beat-synced VFX via provider...`);
    const geminiModel = 'gemini-2.5-flash';

    const prompt = `
      You are an expert AI music video editor and VFX supervisor. Your task is to assign a visual effect (VFX) to EVERY shot in the storyboard.

      **CRITICAL: You MUST return a suggestion for EVERY shot listed below — no exceptions.** Each shot ID must appear exactly once in your output.

      Analyze each shot's content, the section it belongs to (verse, chorus, bridge, etc.), and the music's energy at that moment.
      Choose the VFX that best enhances the visual storytelling:

      **VFX Selection Guide:**
      ${VFX_PRESETS.map(p => `- **${p.name}**: ${p.description}`).join('\n      ')}

      **Rules for VFX assignment:**
      - **Slow Motion**: Use for emotional peaks, dramatic reveals, tears, prayer, intimate moments
      - **Speed Ramp**: Use for transitions between energy levels, action sequences, dynamic movement
      - **Lens Flare**: Use for hopeful moments, spiritual scenes, golden hour shots, light-focused compositions
      - **Glitch Effect**: Use for tension, confusion, surreal moments, digital/modern aesthetics
      - **Vintage Film Grain**: Use for nostalgic moments, flashbacks, warm intimate verses, retro feel
      - Vary your choices — don't use the same VFX for more than 3 consecutive shots
      - Match VFX intensity to musical energy: verses get subtler effects, choruses get more dramatic ones
      - Consider the emotional arc: effects should evolve as the song progresses

      Song Structure:
      ${JSON.stringify(songAnalysis.structure, null, 2)}

      ALL Shots (you MUST assign a VFX to each one):
      ${JSON.stringify(storyboard.scenes.flatMap(s => s.shots.map(sh => ({ id: sh.id, section: s.section, start: sh.start, end: sh.end, subject: sh.subject, action: sh.action, shot_type: sh.shot_type, camera_move: sh.camera_move }))), null, 2)}
    `;

    const vfxSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                shotId: { type: Type.STRING },
                vfx: { type: Type.STRING, enum: VFX_PRESETS.map(p => p.name) },
            },
            required: ['shotId', 'vfx'],
        },
    };

    const result = await generateText({
        prompt,
        responseSchema: vfxSchema,
        providerSettings,
        geminiModel,
    });

    const suggestions = JSON.parse(result.text) as { shotId: string; vfx: VFX_PRESET }[];
    return { suggestions, tokenUsage: result.tokenUsage || 800 };
};

export const generateTransitions = async (scene: StoryboardScene, bibles: Bibles, brief: CreativeBrief, providerSettings?: AIProviderSettings): Promise<{ transitions: (Transition | null)[], tokenUsage: number }> => {
    console.log(`AI Service: Generating transitions for scene ${scene.id} via provider...`);
    const geminiModel = 'gemini-2.5-flash';

    if (!scene.shots || scene.shots.length <= 1) {
        const numShots = scene.shots?.length || 0;
        return { transitions: new Array(numShots).fill(null), tokenUsage: 0 };
    }

    const shotPairs = [];
    for (let i = 0; i < scene.shots.length - 1; i++) {
        shotPairs.push({ from: scene.shots[i], to: scene.shots[i + 1] });
    }

    const prompt = `
        You are an expert video editor. For each pair of shots provided, suggest a creative transition.
        The output must be a valid JSON object containing an array of transitions.
        Consider the visual content of the shots and the overall creative brief.
        Available transition types: 'Hard Cut', 'Crossfade', 'Fade to Black', 'Whip Pan', 'Match Cut', 'Glitch'.
        Provide a brief 'description' explaining your choice.
        The number of transitions must be exactly ${shotPairs.length}.

        Creative Brief: ${JSON.stringify(brief, null, 2)}
        Shot Pairs: ${JSON.stringify(shotPairs.map(p => ({ from: p.from.subject, to: p.to.subject })), null, 2)}
    `;

    const transitionSchema = {
        type: Type.OBJECT,
        properties: {
            transitions: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        type: { type: Type.STRING },
                        duration: { type: Type.NUMBER },
                        description: { type: Type.STRING },
                    },
                    required: ['type', 'duration', 'description'],
                },
            },
        },
        required: ['transitions']
    };

    const genResult = await generateText({
        prompt,
        responseSchema: transitionSchema,
        providerSettings,
        geminiModel,
    });

    const parsed = JSON.parse(genResult.text);
    const transitions = parsed?.transitions || [];
    const transitionsWithNull = [...transitions, null];
    return { transitions: transitionsWithNull, tokenUsage: genResult.tokenUsage || 1000 };
};

export const generateExecutiveProducerFeedback = async (storyboard: Storyboard, bibles: Bibles, brief: CreativeBrief, providerSettings?: AIProviderSettings): Promise<{ feedback: ExecutiveProducerFeedback, tokenUsage: number }> => {
    console.log(`AI Service: Generating Executive Producer feedback via provider...`);
    const geminiModel = 'gemini-2.5-flash';

    const prompt = `
      Act as a seasoned Executive Producer for a major record label. You are reviewing the complete pre-production package for a music video. Your task is to provide high-level, critical feedback on the project as a whole.
      The output must be a valid JSON object.

      Analyze the provided storyboard, bibles, and creative brief, then provide the following:
      1.  **pacing_score (1-10)**: How well does the video's rhythm and shot duration match the song's energy and structure? Does it build excitement correctly?
      2.  **narrative_score (1-10)**: How compelling and clear is the story or concept? Does the emotional arc make sense? (If it's an abstract video, judge this based on conceptual strength).
      3.  **consistency_score (1-10)**: How well do the visuals (characters, locations, shot styles) adhere to the creative brief and bibles? Does it feel like a single, cohesive project?
      4.  **final_notes**: A concise (2-3 sentences) summary of your overall impression. Be constructive. Mention one key strength and one potential area for improvement before the final render.

      **Project Documents:**
      Creative Brief: ${JSON.stringify(brief, null, 2)}
      Visual Bibles: ${JSON.stringify(bibles, null, 2)}
      Storyboard: ${JSON.stringify(storyboard.scenes.map(s => ({ section: s.section, description: s.description, shots: s.shots.length })), null, 2)}
    `;

    const epSchema = {
        type: Type.OBJECT,
        properties: {
            pacing_score: { type: Type.INTEGER },
            narrative_score: { type: Type.INTEGER },
            consistency_score: { type: Type.INTEGER },
            final_notes: { type: Type.STRING },
        },
        required: ['pacing_score', 'narrative_score', 'consistency_score', 'final_notes'],
    };

    const result = await generateText({
        prompt,
        responseSchema: epSchema,
        providerSettings,
        geminiModel,
    });

    const feedback = JSON.parse(result.text) as ExecutiveProducerFeedback;
    return { feedback, tokenUsage: result.tokenUsage || 1500 };
};
