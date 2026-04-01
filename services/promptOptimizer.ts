/**
 * Prompt Optimizer Service
 *
 * Adapts raw prompts from the storyboard/creative pipeline to match
 * the optimal format for the currently selected image or video model.
 * Falls back to asking the thinking LLM to research unknown models.
 */

import type { StoryboardShot, Bibles, CreativeBrief, CharacterBible, AIProviderSettings } from '../types';
import {
    findImageProfile,
    findVideoProfile,
    findPromptProfile,
    buildPromptEngineeringSystemPrompt,
    buildResearchPrompt,
    type ModelPromptProfile,
    type PromptFormat,
} from './promptEngineeringKB';

// ── Cache for dynamically-researched profiles ────────────────────────
const researchedProfileCache = new Map<string, ModelPromptProfile>();

/**
 * Get the prompt profile for a model, checking KB first, then cache.
 * Returns null if unknown (caller should trigger research).
 */
export function getProfileForModel(modelId: string, type: 'image' | 'video'): ModelPromptProfile | null {
    // 1. Check built-in KB
    const builtIn = type === 'image' ? findImageProfile(modelId) : findVideoProfile(modelId);
    if (builtIn) return builtIn;

    // 2. Check research cache
    const cached = researchedProfileCache.get(`${type}:${modelId}`);
    if (cached) return cached;

    // 3. Try generic match across all profiles
    const generic = findPromptProfile(modelId);
    if (generic) return generic;

    return null;
}

/**
 * Store a dynamically-researched profile in the runtime cache.
 */
export function cacheResearchedProfile(modelId: string, type: 'image' | 'video', profile: ModelPromptProfile): void {
    researchedProfileCache.set(`${type}:${modelId}`, profile);
}

/**
 * Parse the JSON response from the thinking LLM's research into a ModelPromptProfile.
 */
export function parseResearchResponse(modelId: string, jsonStr: string): ModelPromptProfile | null {
    try {
        // Extract JSON from potential markdown code blocks
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;

        const data = JSON.parse(jsonMatch[0]);

        return {
            match: new RegExp(modelId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
            family: data.family || 'Unknown',
            format: data.format || 'natural',
            maxPromptLength: data.maxPromptLength || 500,
            supportsNegative: data.supportsNegative ?? false,
            supportsWeights: data.supportsWeights ?? false,
            qualityPrefix: data.qualityPrefix || '',
            negativePrompt: data.negativePrompt || '',
            promptTemplate: data.promptTemplate || '{characters} {action}. {location}. {camera}. {lighting}. {style}.',
            tips: data.tips || '',
            modelTags: data.modelTags || '',
            nativeConsistency: data.nativeConsistency ?? false,
            outputType: 'both',
        };
    } catch (e) {
        console.error('Failed to parse research response:', e);
        return null;
    }
}

// ── Prompt Adaptation ────────────────────────────────────────────────

interface PromptContext {
    shot: StoryboardShot;
    bibles: Bibles;
    brief: CreativeBrief;
    characterBlock: string;
    locationBlock: string;
}

/**
 * Build the identity-locked character block in the format the target model prefers.
 */
function buildCharacterBlockForProfile(
    chars: CharacterBible[],
    profile: ModelPromptProfile
): string {
    if (chars.length === 0) return '';

    if (profile.supportsWeights) {
        // Tagged/weighted format
        return chars.map(char => {
            const pa = char.physical_appearance;
            const cos = char.costuming_and_props;
            return [
                `(${char.name}:1.3)`,
                `(${pa.skin_tone} skin, ${pa.face_shape} face, ${pa.nose_description} nose, ${pa.lip_description}, ${pa.brow_description}:1.3)`,
                `(${pa.hair_style_and_color}, ${pa.hair_texture}:1.3)`,
                `(${pa.eye_shape} ${pa.eye_color} eyes:1.2)`,
                pa.key_facial_features ? `(${pa.key_facial_features}:1.1)` : '',
                `(wearing ${cos?.outfit_style || ''}: ${Array.isArray(cos?.specific_clothing_items) ? cos.specific_clothing_items.join(', ') : (cos?.specific_clothing_items || '')}:1.2)`,
            ].filter(Boolean).join(', ');
        }).join(', ');
    }

    // Natural language format
    return chars.map(char => {
        const pa = char.physical_appearance;
        const cos = char.costuming_and_props;
        return [
            `Character "${char.name}":`,
            `${pa.gender_presentation}, ${pa.ethnicity}, ${pa.age_range}, ${pa.body_type} build.`,
            `Face: ${pa.skin_tone} skin, ${pa.face_shape} face, ${pa.nose_description} nose, ${pa.lip_description}, ${pa.brow_description}, ${pa.jawline_description}. Eyes: ${pa.eye_shape}, ${pa.eye_color}.`,
            pa.key_facial_features ? `Distinguishing: ${pa.key_facial_features}.` : '',
            `Hair: ${pa.hair_style_and_color}, ${pa.hair_texture}.`,
            `Outfit: ${cos?.outfit_style || ''} — ${Array.isArray(cos?.specific_clothing_items) ? cos.specific_clothing_items.join(', ') : (cos?.specific_clothing_items || '')}.`,
        ].filter(Boolean).join(' ');
    }).join('\n');
}

/**
 * Core prompt adapter: takes a raw prompt context and reformats it
 * to match the target model's optimal prompt structure.
 */
export function adaptPromptForModel(
    ctx: PromptContext,
    profile: ModelPromptProfile
): { prompt: string; negativePrompt: string } {
    const { shot, bibles, brief } = ctx;

    // Resolve characters
    const chars = shot.character_refs
        .map(ref => bibles.characters.find(c => c.name === ref))
        .filter(Boolean) as CharacterBible[];
    const characterBlock = buildCharacterBlockForProfile(chars, profile);

    // Resolve location
    const loc = bibles.locations.find(l => l.name === shot.location_ref);
    const locationBlock = loc
        ? profile.supportsWeights
            ? `(${loc.setting_type}, ${loc.atmosphere_and_environment.time_of_day}:1.1)`
            : `${loc.name}: ${loc.setting_type}, ${loc.atmosphere_and_environment.time_of_day}, ${loc.atmosphere_and_environment.dominant_mood} mood`
        : '';

    // Common variables
    const vars: Record<string, string> = {
        characters: characterBlock || (profile.supportsWeights ? '(person:1.1)' : 'a person'),
        action: shot.action || shot.subject,
        location: locationBlock,
        camera: `${shot.cinematic_enhancements.camera_motion}, ${shot.camera_move}`,
        lighting: shot.cinematic_enhancements.lighting_style,
        style: `${brief.style}, ${brief.feel}`,
        colors: brief.color_palette?.join(', ') || '',
        shot_type: `${shot.shot_type}, ${shot.composition}`,
        qualityPrefix: profile.qualityPrefix,
    };

    // Fill the template
    let prompt = profile.promptTemplate;
    for (const [key, value] of Object.entries(vars)) {
        prompt = prompt.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }

    // Add model-specific tags
    if (profile.modelTags && !prompt.includes(profile.modelTags)) {
        prompt = `${prompt}, ${profile.modelTags}`;
    }

    // Add consistency instructions if the model doesn't handle it natively
    if (!profile.nativeConsistency && chars.length > 0) {
        if (profile.supportsWeights) {
            prompt += ', (consistent face across all frames, identity lock, no face morphing, same person throughout:1.3)';
        } else {
            prompt += ' The character\'s face, hair, and clothing must remain identical and ultra-realistic in every frame — no morphing or drift.';
        }
    }

    // Enforce max length
    if (profile.maxPromptLength > 0 && prompt.length > profile.maxPromptLength * 4) {
        // Rough char-to-token estimate (4 chars per token)
        prompt = prompt.slice(0, profile.maxPromptLength * 4);
    }

    // Clean up
    prompt = prompt.replace(/,\s*,/g, ',').replace(/\s+/g, ' ').trim();

    return {
        prompt,
        negativePrompt: profile.negativePrompt,
    };
}

// ── System Prompt for Thinking LLM ──────────────────────────────────

/**
 * Build the system prompt injection that teaches the thinking LLM
 * about the currently selected image and video models, so it generates
 * optimal prompts during storyboard creation and creative asset generation.
 */
export function buildThinkingModelKnowledge(settings: AIProviderSettings): string {
    const imageProfile = getProfileForModel(settings.image.selectedModel, 'image');
    const videoProfile = getProfileForModel(settings.video.selectedModel, 'video');

    const sections: string[] = [
        '=== PROMPT ENGINEERING KNOWLEDGE FOR DOWNSTREAM MODELS ===',
        '',
        'When generating image prompts or video clip prompts for the storyboard, you MUST follow these model-specific guidelines:',
    ];

    if (imageProfile) {
        sections.push('', '--- IMAGE GENERATION MODEL ---');
        sections.push(buildPromptEngineeringSystemPrompt(imageProfile));
    } else if (settings.image.selectedModel) {
        sections.push('', '--- IMAGE GENERATION MODEL ---');
        sections.push(`Model: ${settings.image.selectedModel}`);
        sections.push('No specific prompt profile found. Use descriptive natural language. Include: subject, composition, lighting, style, and camera details. If the model name suggests a Stable Diffusion variant, use comma-separated tags with quality prefixes.');
    }

    if (videoProfile) {
        sections.push('', '--- VIDEO GENERATION MODEL ---');
        sections.push(buildPromptEngineeringSystemPrompt(videoProfile));
    } else if (settings.video.selectedModel) {
        sections.push('', '--- VIDEO GENERATION MODEL ---');
        sections.push(`Model: ${settings.video.selectedModel}`);
        sections.push('No specific prompt profile found. Use descriptive natural language. Describe: subject action, camera movement, scene dynamics, lighting, and duration. Emphasize motion and character consistency across frames.');
    }

    sections.push('', '=== END PROMPT ENGINEERING KNOWLEDGE ===');

    return sections.join('\n');
}

/**
 * Get the research prompt to send to the thinking LLM for an unknown model.
 */
export { buildResearchPrompt } from './promptEngineeringKB';
