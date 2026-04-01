/**
 * Prompt Engineering Knowledge Base
 *
 * Maps model IDs/families to their optimal prompt structures for image and video generation.
 * Each entry describes how to format prompts for best output quality.
 */

export type PromptFormat = 'natural' | 'tagged' | 'sdxl-weighted' | 'structured-json' | 'simple';

export interface ModelPromptProfile {
    /** Glob-style pattern or exact model ID to match against */
    match: string | RegExp;
    /** Human-readable model family name */
    family: string;
    /** Prompt format style */
    format: PromptFormat;
    /** Max recommended prompt token/char length (0 = no limit) */
    maxPromptLength: number;
    /** Whether the model supports negative prompts */
    supportsNegative: boolean;
    /** Whether weighted tags like (tag:1.3) are supported */
    supportsWeights: boolean;
    /** Optimal quality tags to prepend */
    qualityPrefix: string;
    /** Optimal negative prompt */
    negativePrompt: string;
    /** Prompt structure template — use {subject}, {style}, {camera}, {lighting}, {characters}, {location}, {action}, {colors} */
    promptTemplate: string;
    /** Tips and notes for the LLM when adapting prompts */
    tips: string;
    /** Model-specific tags to append */
    modelTags: string;
    /** Whether this model handles character consistency well on its own */
    nativeConsistency: boolean;
    /** Output type */
    outputType: 'image' | 'video' | 'both';
}

// ────────────────────────────────────────────────────────
//  IMAGE GENERATION MODELS
// ────────────────────────────────────────────────────────

const IMAGE_PROFILES: ModelPromptProfile[] = [
    // --- Stable Diffusion XL / ComfyUI checkpoints ---
    {
        match: /(sdxl|stable.?diffusion.*xl|realvis|dreamshaperxl|juggernautxl)/i,
        family: 'SDXL',
        format: 'sdxl-weighted',
        maxPromptLength: 150,
        supportsNegative: true,
        supportsWeights: true,
        qualityPrefix: 'photorealistic, 8k uhd, RAW photo, ultra-realistic skin texture, visible pores, subsurface scattering, film grain, sharp focus, professional photography',
        negativePrompt: 'deformed, blurry, bad anatomy, disfigured, poorly drawn face, mutation, extra limb, ugly, poorly drawn hands, missing limb, floating limbs, disconnected limbs, malformed hands, blur, out of focus, long neck, extra fingers, mutated hands, watermark, text',
        promptTemplate: '{qualityPrefix}, {shot_type} of {characters}, {action}, {location}, {lighting}, {style}, {colors}',
        tips: 'Use comma-separated tags with (tag:weight) syntax. Keep under 150 tokens. Front-load the most important subjects. Use BREAK to separate concepts. Avoid full sentences.',
        modelTags: '',
        nativeConsistency: false,
        outputType: 'image',
    },
    // --- FLUX models ---
    {
        match: /(flux|FLUX)/i,
        family: 'FLUX',
        format: 'natural',
        maxPromptLength: 500,
        supportsNegative: false,
        supportsWeights: false,
        qualityPrefix: '',
        negativePrompt: '',
        promptTemplate: 'A cinematic {shot_type} photograph. {characters} {action}. {location}. {lighting}. Style: {style}. Colors: {colors}.',
        tips: 'FLUX responds best to natural language descriptions, NOT tagged prompts. No negative prompts, no weights. Be descriptive and specific. Include photographic terms (lens, film stock). Describe the scene as if writing a screenplay direction.',
        modelTags: '',
        nativeConsistency: false,
        outputType: 'image',
    },
    // --- OpenAI GPT Image / DALL-E ---
    {
        match: /(gpt.*image|dall-?e|gpt-5-image)/i,
        family: 'GPT-Image',
        format: 'natural',
        maxPromptLength: 4000,
        supportsNegative: false,
        supportsWeights: false,
        qualityPrefix: '',
        negativePrompt: '',
        promptTemplate: 'Create a cinematic {shot_type} image for a music video. {characters} {action}. Setting: {location}. Lighting: {lighting}. Visual style: {style}. Color palette: {colors}. The image should be photorealistic with ultra-detailed skin textures and anatomically correct features.',
        tips: 'Use descriptive natural language. Can handle very detailed and long prompts. Specify art style, mood, and technical camera details. Avoid negative language — describe what you WANT, not what to avoid.',
        modelTags: '',
        nativeConsistency: true,
        outputType: 'image',
    },
    // --- Google Gemini Image ---
    {
        match: /(gemini.*image|gemini.*flash.*image)/i,
        family: 'Gemini-Image',
        format: 'natural',
        maxPromptLength: 2000,
        supportsNegative: false,
        supportsWeights: false,
        qualityPrefix: '',
        negativePrompt: '',
        promptTemplate: 'Generate a cinematic {shot_type} photo for a music video. Subject: {characters} {action}. Location: {location}. {lighting}. Style: {style}. Dominant colors: {colors}.',
        tips: 'Natural language works best. Be specific about composition, framing, and mood. Gemini handles complex scene descriptions well. Mention camera angle and lens type for better cinematic results.',
        modelTags: '',
        nativeConsistency: true,
        outputType: 'image',
    },
    // --- Riverflow (OpenRouter image) ---
    {
        match: /riverflow/i,
        family: 'Riverflow',
        format: 'natural',
        maxPromptLength: 1000,
        supportsNegative: false,
        supportsWeights: false,
        qualityPrefix: '',
        negativePrompt: '',
        promptTemplate: 'A {shot_type} photograph: {characters} {action}. {location}. {lighting}. {style}. {colors}.',
        tips: 'Natural language prompts. Be concise but descriptive. Specify the photographic style and mood clearly.',
        modelTags: '',
        nativeConsistency: false,
        outputType: 'image',
    },
    // --- ByteDance SeedDream ---
    {
        match: /seedream/i,
        family: 'SeedDream',
        format: 'natural',
        maxPromptLength: 1000,
        supportsNegative: false,
        supportsWeights: false,
        qualityPrefix: '',
        negativePrompt: '',
        promptTemplate: 'A high-quality {shot_type} image. {characters} {action}. Setting: {location}. {lighting}. Style: {style}. Colors: {colors}.',
        tips: 'Natural language. Focus on subject description and artistic style. Good at handling detailed character descriptions.',
        modelTags: '',
        nativeConsistency: false,
        outputType: 'image',
    },
    // --- HuggingFace Stable Diffusion models ---
    {
        match: /(stable-diffusion|stabilityai)/i,
        family: 'Stable Diffusion',
        format: 'sdxl-weighted',
        maxPromptLength: 150,
        supportsNegative: true,
        supportsWeights: true,
        qualityPrefix: 'masterpiece, best quality, photorealistic, highly detailed',
        negativePrompt: 'worst quality, low quality, blurry, deformed, ugly, bad anatomy',
        promptTemplate: '{qualityPrefix}, {shot_type}, {characters}, {action}, {location}, {lighting}, {style}',
        tips: 'Use SD1.5/SDXL tag format. Comma-separated, weight syntax (tag:1.3). Keep concise. Quality tags first.',
        modelTags: '',
        nativeConsistency: false,
        outputType: 'image',
    },
];

// ────────────────────────────────────────────────────────
//  VIDEO GENERATION MODELS
// ────────────────────────────────────────────────────────

const VIDEO_PROFILES: ModelPromptProfile[] = [
    // --- ComfyUI Waver ---
    {
        match: /waver/i,
        family: 'Waver',
        format: 'natural',
        maxPromptLength: 500,
        supportsNegative: true,
        supportsWeights: false,
        qualityPrefix: '',
        negativePrompt: 'static image, no motion, blurry, deformed face, identity drift, face morphing, different person between frames',
        promptTemplate: 'Animate this cinematic shot for a music video. {characters} {action}. Setting: {location}. Shot: {shot_type}. Camera: {camera}. {lighting}. Style: {style}. Colors: {colors}.',
        tips: 'Waver handles detailed natural-language prompts well. Describe motion explicitly. Emphasize character consistency in every frame. Include camera motion direction. Mention duration.',
        modelTags: '',
        nativeConsistency: false,
        outputType: 'video',
    },
    // --- Step-Video TI2V ---
    {
        match: /step.?video/i,
        family: 'Step-Video-TI2V',
        format: 'natural',
        maxPromptLength: 500,
        supportsNegative: true,
        supportsWeights: false,
        qualityPrefix: '',
        negativePrompt: 'static, blurry, identity drift, face morphing, different person between frames',
        promptTemplate: 'Cinematic music video shot. {characters} {action}. {location}. Camera: {camera}. {lighting}. {style}.',
        tips: 'Optimized for identity consistency. Describe actions and movements clearly. Good for close-ups, medium shots, and action scenes.',
        modelTags: '',
        nativeConsistency: false,
        outputType: 'video',
    },
    // --- Wan 2.x (including OpenRouter alibaba/wan-2.6) ---
    {
        match: /(wan.?2|wan2)/i,
        family: 'Wan',
        format: 'tagged',
        maxPromptLength: 200,
        supportsNegative: true,
        supportsWeights: true,
        qualityPrefix: '',
        negativePrompt: 'static, blurry, deformed, low quality, identity drift',
        promptTemplate: '{characters}, {action}, {location}, {camera}, {lighting}, {style}, (anime aesthetic, saturated neon, crisp line art:1.1)',
        tips: 'Use concise comma-separated tags with weights. Stylized/anime look is its strength. Keep prompts short. Works well with vibrant color descriptions. Good for high-energy scenes.',
        modelTags: '(anime aesthetic, saturated neon, crisp line art:1.1)',
        nativeConsistency: false,
        outputType: 'video',
    },
    // --- AnimateDiff ---
    {
        match: /animatediff/i,
        family: 'AnimateDiff',
        format: 'tagged',
        maxPromptLength: 150,
        supportsNegative: true,
        supportsWeights: true,
        qualityPrefix: '',
        negativePrompt: 'static, blurry, deformed, jerky motion, frame skip, identity drift',
        promptTemplate: '{characters}, {action}, {location}, {camera}, {style}, (coherent motion, smooth camera move:1.2)',
        tips: 'Concise tagged format with weights. Emphasize motion coherence. Works best with motion-heavy scenes. Keep character descriptions brief. Use motion-specific tags.',
        modelTags: '(coherent motion, smooth camera move:1.2)',
        nativeConsistency: false,
        outputType: 'video',
    },
    // --- VideoCrafter2 ---
    {
        match: /videocrafter/i,
        family: 'VideoCrafter2',
        format: 'tagged',
        maxPromptLength: 150,
        supportsNegative: true,
        supportsWeights: true,
        qualityPrefix: '',
        negativePrompt: 'blurry, deformed, low quality, watermark',
        promptTemplate: '{action}, {location}, {camera}, {style}, (environment plate, atmospheric depth:1.1)',
        tips: 'Best for wide/establishing shots and backgrounds WITHOUT characters. Concise tagged format. Focus on environment and atmosphere. Do NOT include character consistency tags — this is a plate/background model.',
        modelTags: '(environment plate, atmospheric depth:1.1)',
        nativeConsistency: false,
        outputType: 'video',
    },
    // --- OpenAI Sora ---
    {
        match: /sora/i,
        family: 'Sora',
        format: 'natural',
        maxPromptLength: 2000,
        supportsNegative: false,
        supportsWeights: false,
        qualityPrefix: '',
        negativePrompt: '',
        promptTemplate: 'A cinematic music video shot. {characters} {action}. Location: {location}. Camera movement: {camera}. Lighting: {lighting}. Visual style: {style}. Color palette: {colors}. The shot should feel like a professional music video with smooth, natural motion.',
        tips: 'Sora excels with detailed natural-language descriptions. Describe the full scene, action, and camera movement narratively. Include emotional tone and pacing cues. Avoid tags/weights. Mention duration and tempo. Be specific about physics and motion.',
        modelTags: '',
        nativeConsistency: true,
        outputType: 'video',
    },
    // --- Google Veo ---
    {
        match: /veo/i,
        family: 'Veo',
        format: 'natural',
        maxPromptLength: 1500,
        supportsNegative: false,
        supportsWeights: false,
        qualityPrefix: '',
        negativePrompt: '',
        promptTemplate: 'Generate a cinematic video clip for a music video. {characters} {action}. Setting: {location}. Camera: {camera}. {lighting}. Style: {style}. Colors: {colors}.',
        tips: 'Natural language descriptions. Veo handles complex motion and camera work well. Be specific about what moves and how. Include timing cues. Describe the emotional arc of the shot.',
        modelTags: '',
        nativeConsistency: true,
        outputType: 'video',
    },
    // --- ByteDance Seedance ---
    {
        match: /seedance/i,
        family: 'Seedance',
        format: 'natural',
        maxPromptLength: 1000,
        supportsNegative: false,
        supportsWeights: false,
        qualityPrefix: '',
        negativePrompt: '',
        promptTemplate: 'A music video clip showing {characters} {action}. {location}. Camera: {camera}. {lighting}. {style}. {colors}.',
        tips: 'Natural language. Focus on clear motion descriptions. Specify camera movement explicitly. Good for character-focused video generation.',
        modelTags: '',
        nativeConsistency: false,
        outputType: 'video',
    },
    // --- Kling ---
    {
        match: /kling/i,
        family: 'Kling',
        format: 'natural',
        maxPromptLength: 1000,
        supportsNegative: true,
        supportsWeights: false,
        qualityPrefix: '',
        negativePrompt: 'blurry, deformed, static, low quality',
        promptTemplate: 'Cinematic music video shot: {characters} {action}. {location}. {camera}. {lighting}. {style}.',
        tips: 'Kling handles text-to-video and image-to-video well. Use clear, direct descriptions. Describe camera motion as a continuous movement. Specify duration. Works well with both realistic and stylized content.',
        modelTags: '',
        nativeConsistency: false,
        outputType: 'video',
    },
    // --- NVIDIA Cosmos ---
    {
        match: /cosmos/i,
        family: 'Cosmos',
        format: 'natural',
        maxPromptLength: 800,
        supportsNegative: false,
        supportsWeights: false,
        qualityPrefix: '',
        negativePrompt: '',
        promptTemplate: 'A cinematic video shot: {characters} {action}. Environment: {location}. Camera motion: {camera}. {lighting}. Style: {style}.',
        tips: 'Use descriptive natural language. Cosmos is good at world simulation. Describe physics and environmental dynamics. Specify camera trajectory clearly.',
        modelTags: '',
        nativeConsistency: false,
        outputType: 'video',
    },
];

// ────────────────────────────────────────────────────────
//  THINKING / LLM MODELS (for reference prompt construction)
// ────────────────────────────────────────────────────────

const THINKING_PROFILES: ModelPromptProfile[] = [
    // These are less about image/video prompting and more about how to instruct the LLM
    // to generate optimal prompts for downstream image/video models.
    {
        match: /(gpt-4|gpt-5|openai)/i,
        family: 'GPT',
        format: 'natural',
        maxPromptLength: 0,
        supportsNegative: false,
        supportsWeights: false,
        qualityPrefix: '',
        negativePrompt: '',
        promptTemplate: '',
        tips: 'Excellent at following complex system prompts. Can generate both tagged and natural-language prompts for downstream models. Good at maintaining character consistency descriptions across shots.',
        modelTags: '',
        nativeConsistency: false,
        outputType: 'both',
    },
    {
        match: /(claude|anthropic)/i,
        family: 'Claude',
        format: 'natural',
        maxPromptLength: 0,
        supportsNegative: false,
        supportsWeights: false,
        qualityPrefix: '',
        negativePrompt: '',
        promptTemplate: '',
        tips: 'Strong at structured reasoning and maintaining consistency. Excellent for creative direction and detailed scene descriptions. Good at adapting prompt style to target model requirements.',
        modelTags: '',
        nativeConsistency: false,
        outputType: 'both',
    },
    {
        match: /(gemini|google)/i,
        family: 'Gemini',
        format: 'natural',
        maxPromptLength: 0,
        supportsNegative: false,
        supportsWeights: false,
        qualityPrefix: '',
        negativePrompt: '',
        promptTemplate: '',
        tips: 'Good multimodal understanding. Can analyze reference images to improve prompt descriptions. Strong at creative and technical writing.',
        modelTags: '',
        nativeConsistency: false,
        outputType: 'both',
    },
    {
        match: /(llama|mistral|mixtral|qwen|nemotron|deepseek)/i,
        family: 'Open-Source LLM',
        format: 'natural',
        maxPromptLength: 0,
        supportsNegative: false,
        supportsWeights: false,
        qualityPrefix: '',
        negativePrompt: '',
        promptTemplate: '',
        tips: 'Provide explicit formatting instructions. Use few-shot examples for prompt generation tasks. Be specific about the output format required for downstream image/video models.',
        modelTags: '',
        nativeConsistency: false,
        outputType: 'both',
    },
];

// ────────────────────────────────────────────────────────
//  LOOKUP & MATCHING
// ────────────────────────────────────────────────────────

const ALL_PROFILES = [...IMAGE_PROFILES, ...VIDEO_PROFILES, ...THINKING_PROFILES];

/**
 * Find the best matching prompt profile for a given model ID.
 * Checks against all known patterns.
 */
export function findPromptProfile(modelId: string): ModelPromptProfile | null {
    if (!modelId) return null;
    for (const profile of ALL_PROFILES) {
        if (profile.match instanceof RegExp) {
            if (profile.match.test(modelId)) return profile;
        } else if (modelId.toLowerCase().includes(profile.match.toLowerCase())) {
            return profile;
        }
    }
    return null;
}

/**
 * Find profile specifically for image generation models.
 */
export function findImageProfile(modelId: string): ModelPromptProfile | null {
    for (const profile of IMAGE_PROFILES) {
        if (profile.match instanceof RegExp) {
            if (profile.match.test(modelId)) return profile;
        } else if (modelId.toLowerCase().includes(profile.match.toLowerCase())) {
            return profile;
        }
    }
    return null;
}

/**
 * Find profile specifically for video generation models.
 */
export function findVideoProfile(modelId: string): ModelPromptProfile | null {
    for (const profile of VIDEO_PROFILES) {
        if (profile.match instanceof RegExp) {
            if (profile.match.test(modelId)) return profile;
        } else if (modelId.toLowerCase().includes(profile.match.toLowerCase())) {
            return profile;
        }
    }
    return null;
}

/**
 * Build the system prompt for the thinking LLM that instructs it how to generate
 * optimal prompts for a specific downstream image or video model.
 */
export function buildPromptEngineeringSystemPrompt(targetProfile: ModelPromptProfile): string {
    return `You are an expert prompt engineer for AI image and video generation models.

TARGET MODEL: ${targetProfile.family}
PROMPT FORMAT: ${targetProfile.format}
MAX LENGTH: ${targetProfile.maxPromptLength || 'unlimited'} tokens
SUPPORTS NEGATIVE PROMPT: ${targetProfile.supportsNegative ? 'Yes' : 'No'}
SUPPORTS WEIGHTED TAGS: ${targetProfile.supportsWeights ? 'Yes — use (tag:weight) syntax where weight is 0.5-1.5' : 'No — do NOT use weight syntax'}
NATIVE CONSISTENCY: ${targetProfile.nativeConsistency ? 'Yes — model handles character consistency well' : 'No — include explicit consistency instructions'}

PROMPT TEMPLATE:
${targetProfile.promptTemplate}

QUALITY PREFIX (prepend to all prompts):
${targetProfile.qualityPrefix || '(none)'}

MODEL-SPECIFIC TAGS (append when relevant):
${targetProfile.modelTags || '(none)'}

TIPS FOR BEST RESULTS:
${targetProfile.tips}

${targetProfile.supportsNegative ? `NEGATIVE PROMPT TO USE:\n${targetProfile.negativePrompt}` : ''}

INSTRUCTIONS:
- Generate prompts that follow the format and guidelines above EXACTLY
- ${targetProfile.supportsWeights ? 'Use (tag:weight) syntax to emphasize critical elements' : 'Do NOT use any weight syntax or parenthetical emphasis'}
- ${targetProfile.maxPromptLength > 0 ? `Keep the prompt under ${targetProfile.maxPromptLength} tokens` : 'Prompt length is flexible'}
- ${!targetProfile.nativeConsistency ? 'Include explicit character consistency instructions (face, hair, clothing must remain identical across frames)' : 'The model handles consistency natively — focus on scene description'}
- Maintain the visual identity of characters EXACTLY as described in their character bibles
- Be specific about camera movement, lighting, and compositional details`;
}

/**
 * Build a prompt to send to the thinking LLM when we have NO known profile for a model.
 * Asks the LLM to research and determine the optimal prompt format.
 */
export function buildResearchPrompt(unknownModelId: string, outputType: 'image' | 'video'): string {
    return `I need to generate optimal ${outputType} generation prompts for the model "${unknownModelId}".

I don't have a known prompt engineering profile for this model. Please analyze the model name and determine:

1. **Model Family**: What model architecture/family does this likely belong to? (e.g., Stable Diffusion, DALL-E, Flux, Sora, etc.)
2. **Prompt Format**: Should prompts be:
   - "natural" (full natural-language sentences)
   - "tagged" (comma-separated tags with optional weights)
   - "sdxl-weighted" (SD-style with (tag:1.3) weight syntax)
   - "simple" (short, direct descriptions)
3. **Max Prompt Length**: Approximate recommended character/token limit
4. **Supports Negative Prompts**: Yes or No
5. **Supports Weights**: Does it support (tag:1.3) syntax? Yes or No
6. **Quality Tags**: What quality prefix tags produce the best results?
7. **Negative Prompt**: If supported, what negative prompt works best?
8. **Prompt Template**: An optimal prompt template using these variables: {characters}, {action}, {location}, {camera}, {lighting}, {style}, {colors}, {shot_type}
9. **Tips**: Key tips for getting the best output from this specific model
10. **Native Consistency**: Does this model maintain character consistency across frames natively?

Respond ONLY with a valid JSON object matching this structure:
{
  "family": "string",
  "format": "natural|tagged|sdxl-weighted|simple",
  "maxPromptLength": number,
  "supportsNegative": boolean,
  "supportsWeights": boolean,
  "qualityPrefix": "string",
  "negativePrompt": "string",
  "promptTemplate": "string",
  "tips": "string",
  "modelTags": "string",
  "nativeConsistency": boolean
}`;
}
