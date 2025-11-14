import { GoogleGenAI, GenerateContentResponse, Type, Modality } from "@google/genai";
import type { SongAnalysis, Bibles, Storyboard, CreativeBrief, StoryboardShot, TranscriptEntry, VFX_PRESET, CharacterBible, LocationBible, StoryboardScene, Transition, ExecutiveProducerFeedback, EnhancedSongAnalysis, Beat } from '../types';
import { VFX_PRESETS } from "../constants";
import { backendService } from './backendService';

const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY! });

const isA1111Enabled = (): boolean => {
    // Check localStorage first (user toggle), then fall back to env var
    const localStorageValue = typeof window !== 'undefined' ? localStorage.getItem('USE_A1111') : null;
    if (localStorageValue !== null) {
        return localStorageValue === 'true';
    }
    return process.env.USE_A1111 === 'true';
};

// --- PROMPT GENERATION HELPERS (for UI display) ---

// Enhanced prompt builder for ComfyUI with ultra-realistic quality tags
const getEnhancedPromptForA1111 = (shot: StoryboardShot, bibles: Bibles, brief: CreativeBrief): string => {
    console.log('=== getEnhancedPromptForA1111 CALLED ===');
    
    const characterRef = shot.character_refs[0];
    const char = characterRef ? bibles.characters.find(c => c.name === characterRef) : null;
    
    // CRITICAL: Include character NAME and physical traits
    const charDesc = char
        ? `${char.name}, a ${char.physical_appearance.age_range.split('-')[0]}yo ${char.physical_appearance.gender_presentation.toLowerCase()} man`
        : 'person';
    
    // Location: Just setting type and time of day
    const loc = bibles.locations.find(l => l.name === shot.location_ref);
    const locDesc = loc ? `${loc.setting_type}, ${loc.atmosphere_and_environment.time_of_day}` : '';
    
    // Ultra-realistic quality tags optimized for SDXL
    const qualityTags = 'photorealistic, 8k uhd, high quality, film grain, Fujifilm XT3, sharp focus, professional photography, studio lighting, physically-based rendering, extreme detail description, raw photo, cinematic lighting';
    
    // EXPLICIT prompt with quality enhancement
    const prompt = `${shot.shot_type} of ${charDesc}, ${shot.subject}, ${locDesc}, ${shot.cinematic_enhancements.lighting_style}, ${qualityTags}`.trim();
    
    console.log('=== OPTIMIZED COMFYUI PROMPT (length:', prompt.length, 'chars) ===');
    console.log(prompt);
    console.log('=== END COMFYUI PROMPT ===');
    
    return prompt;
};

export const getPromptForImageShot = (shot: StoryboardShot, bibles: Bibles, brief: CreativeBrief): string => {
    const characterDetails = shot.character_refs.map(ref => {
        const char = bibles.characters.find(c => c.name === ref);
        return char ? `Character "${char.name}" (${char.physical_appearance.gender_presentation}, wearing ${char.costuming_and_props.outfit_style})` : '';
    }).join(', ');

    const locationDetails = (() => {
        const loc = bibles.locations.find(l => l.name === shot.location_ref);
        return loc ? `Location is ${loc.name}, which is a ${loc.setting_type} with ${loc.atmosphere_and_environment.dominant_mood} mood.` : '';
    })();

    const prompt = `
A cinematic, 16:9 aspect ratio photo.
- Visual Style: ${brief.style}, ${brief.feel}.
- Subject: ${shot.subject}.
- Shot Description: ${shot.shot_type}, ${shot.composition}.
- Camera: Using a ${shot.cinematic_enhancements.camera_lens}, performing a ${shot.cinematic_enhancements.camera_motion}.
- Lighting: ${shot.cinematic_enhancements.lighting_style}.
- Character(s): ${characterDetails || 'None'}.
- Location: ${locationDetails}.
- Important Colors: ${brief.color_palette?.join(', ')}.
    `;
    return prompt.trim().replace(/^ +/gm, ''); // Tidy up for display
};

export const getPromptForClipShot = (shot: StoryboardShot, bibles: Bibles, brief: CreativeBrief, useDetailedPrompt = false): string => {
    // Build character descriptions from bible data
    const characterDetails = shot.character_refs.map(ref => {
        const char = bibles.characters.find(c => c.name === ref);
        if (!char) return '';
        
        // Detailed character description for HunyuanVideo
        if (useDetailedPrompt) {
            return `Character "${char.name}": ${char.physical_appearance.gender_presentation}, ${char.physical_appearance.age_range} years old, ${char.physical_appearance.body_type} build, ${char.physical_appearance.key_facial_features}, ${char.physical_appearance.hair_style_and_color}. Wearing ${char.costuming_and_props.outfit_style}. Performance style: ${char.performance_and_demeanor.performance_style}.`;
        }
        
        // Concise for AnimateDiff/CLIP (with weights for emphasis)
        return `(${char.name}, ${char.physical_appearance.gender_presentation}, wearing ${char.costuming_and_props.outfit_style}:1.3)`;
    }).filter(Boolean).join(', ');

    // Build location description from bible data
    const locationDetails = (() => {
        const loc = bibles.locations.find(l => l.name === shot.location_ref);
        if (!loc) return '';
        
        if (useDetailedPrompt) {
            return `Location "${loc.name}": ${loc.setting_type}, ${loc.atmosphere_and_environment.time_of_day}, ${loc.atmosphere_and_environment.weather} weather, ${loc.atmosphere_and_environment.dominant_mood} mood. Architecture: ${loc.architectural_and_natural_details.style}. Key features: ${loc.architectural_and_natural_details.key_features.join(', ')}.`;
        }
        
        // Concise for CLIP (with weight)
        return `(${loc.setting_type}, ${loc.atmosphere_and_environment.time_of_day}:1.1)`;
    })();

    // Cinematic enhancements
    const cinematics = `${shot.cinematic_enhancements.lighting_style} lighting, using ${shot.cinematic_enhancements.camera_lens}`;
    
    // Build final prompt based on detail level
    if (useDetailedPrompt) {
        // HunyuanVideo detailed prompt (up to ~8K tokens)
        const parts = [
            `Animate this scene for a music video.`,
            characterDetails ? `Characters: ${characterDetails}` : '',
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
            `Duration: ${(shot.end - shot.start).toFixed(1)} seconds`
        ].filter(Boolean);
        
        return parts.join(' ');
    } else {
        // AnimateDiff concise prompt (~77 tokens for CLIP, with weighted syntax)
        const actionDesc = shot.action ? `${shot.subject}, ${shot.action}` : shot.subject;
        const parts = [
            characterDetails || '(person:1.2)',
            actionDesc,
            locationDetails,
            `(${shot.cinematic_enhancements.camera_motion}:1.2)`,
            `(${brief.style}, ${brief.feel}:1.1)`,
            `(high quality, cinematic:1.2)`
        ].filter(Boolean);
        
        return parts.join(', ');
    }
};


// --- API FUNCTIONS ---

export const analyzeSong = async (file: File, lyrics: string, title: string | undefined, artist: string | undefined, modelTier: 'freemium' | 'premium'): Promise<{ analysis: SongAnalysis, tokenUsage: number }> => {
    console.log(`AI Service: Analyzing song with ${modelTier} tier...`, { title, artist });
    const ai = getAiClient();
    const modelName = modelTier === 'premium' ? 'gemini-2.5-pro' : 'gemini-2.5-flash';

    const prompt = `
      Analyze the following song lyrics and metadata to create a detailed musical and lyrical analysis.
      The output must be a valid JSON object.
      
      **MUSICAL ANALYSIS:**
      The analysis should include BPM, mood, genre, instrumentation, and a breakdown of the song structure (e.g., intro, verse, chorus).
      For the structure, provide estimated start and end timestamps in seconds.
      
      **BEATS ARRAY (CRITICAL):**
      You must also generate a 'beats' array containing the timestamp for every beat in the song.
      - Calculate the time between beats using the formula: 60 / BPM.
      - The first beat is at time 0.
      - Continue adding beats until you reach the end of the song's total duration.
      - For each beat, assign an 'energy' score from 0.0 to 1.0. Beats within 'chorus' sections should have a higher energy (e.g., 0.8-1.0), while beats in verses or bridges should have a moderate energy (e.g., 0.5-0.7).
      
      **VOCALS (DUET DETECTION):**
      Detect whether this is a solo or duet performance. If a duet, classify the pairing (male_female, male_male, female_female if possible) and provide vocalist entries with gender, role, and time segments where each vocalist sings.
      
      **LYRIC ANALYSIS (CRITICAL FOR CREATIVE VARIETY):**
      Deeply analyze the lyrics to understand the song's meaning and visual potential:
      - primary_themes: Array of 2-5 main thematic elements (e.g., "love", "heartbreak", "celebration", "social justice", "personal growth", "loneliness", "adventure", "rebellion", "spirituality", "nostalgia")
      - narrative_structure: The storytelling approach - "linear story", "vignettes", "stream of consciousness", "dialogue-based", "metaphorical journey", "non-narrative/abstract", "testimonial", or "descriptive"
      - imagery_style: How to interpret the lyrics visually - "literal" (show exactly what's said), "metaphorical" (symbolic interpretation), "surreal" (dreamlike/abstract), "symbolic" (deeper meaning), "mixed" (combination)
      - emotional_arc: Describe how emotions progress through the song (e.g., "starts melancholic, builds to hopeful", "maintains energetic celebration throughout", "alternates between anger and reflection")
      - key_visual_elements: Array of 3-7 specific visual concepts, symbols, or imagery mentioned in or suggested by the lyrics (e.g., "ocean waves", "city streets at night", "broken mirrors", "dancing figures", "mountain peaks", "vintage photographs")
      
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

    const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
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
                    beats: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                time: { type: Type.NUMBER },
                                energy: { type: Type.NUMBER },
                            },
                            required: ['time', 'energy'],
                        }
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
                            key_visual_elements: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ['primary_themes', 'narrative_structure', 'imagery_style', 'emotional_arc', 'key_visual_elements']
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
                required: ['title', 'artist', 'bpm', 'mood', 'genre', 'instrumentation', 'structure', 'beats', 'lyric_analysis', 'recommended_video_types'],
            }
        }
    });

    const analysis = JSON.parse(response.text) as SongAnalysis;
    return { analysis, tokenUsage: 1500 };
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

export const generateBibles = async (analysis: SongAnalysis, brief: CreativeBrief, singerGender: 'male' | 'female' | 'unspecified', modelTier: 'freemium' | 'premium'): Promise<{ bibles: Bibles, tokenUsage: number }> => {
    console.log(`AI Service: Generating Bibles with ${modelTier} tier...`, brief);
    const ai = getAiClient();
    const modelName = modelTier === 'premium' ? 'gemini-2.5-pro' : 'gemini-2.5-flash';

    const prompt = `
      Act as a world-class cinematographer and production designer. Based on the provided song analysis and creative brief, generate HYPER-DETAILED "visual bibles" for a music video. The output must be a valid JSON object adhering to the specified schema.

      The goal is MAXIMUM DETAIL to ensure visual consistency. Be extremely specific and descriptive.
      const primary singer's gender is ${singerGender}. This should influence the main character's gender presentation unless the song's lyrics or mood strongly suggest otherwise.

      For each Character, provide:
      - role_in_story: Their purpose in the narrative.
      - physical_appearance: Go beyond basics. Describe facial features, body type, ethnicity, etc.
      - costuming_and_props: Define a clear style and list specific items.
      - performance_and_demeanor: How do they act? What is their emotional journey?
      - cinematic_style: How should they be filmed? Specify lenses, lighting, and colors that define their presence.

      For each Location, provide:
      - setting_type: What kind of place is this? Urban, natural, surreal?
      - atmosphere_and_environment: The mood, time, and weather.
      - architectural_and_natural_details: What makes this place unique? Mention styles and key features.
      - sensory_details: What textures and environmental effects are present (e.g., fog, dust, lens flare)?
      - cinematic_style: How should this location be filmed? Specify lighting, color palette, and camera perspectives.
      
      VOCALS-DRIVEN CHARACTERS:
      - If analysis.vocals indicates a duet (vocals.count >= 2 or vocals.type == 'duet'), create TWO distinct main characters aligned to the detected vocalists (names, gender presentation, styling can differ). Otherwise, create ONE main character.
      - Map vocalist genders to character gender_presentation when reasonable.
      
      LOCATIONS:
      - Always include at least ONE primary location.
      - If the Creative Brief videoType is "Concert Performance" or the styling implies a performance video, ensure one location is a performance venue (e.g., concert stage, club, festival) with lighting and crowd atmosphere details.

      Song Analysis:
      ${JSON.stringify(analysis, null, 2)}
      
      Creative Brief:
      ${JSON.stringify(brief, null, 2)}
    `;

    const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
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
                                        key_facial_features: { type: Type.STRING },
                                        hair_style_and_color: { type: Type.STRING },
                                        eye_color: { type: Type.STRING },
                                    },
                                    required: ['age_range', 'gender_presentation', 'ethnicity', 'body_type', 'key_facial_features', 'hair_style_and_color', 'eye_color']
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
            }
        }
    });

    const bibles = JSON.parse(response.text) as Bibles;
    return { bibles, tokenUsage: 2500 };
};


export const generateStoryboard = async (analysis: SongAnalysis, brief: CreativeBrief, bibles: Bibles, modelTier: 'freemium' | 'premium'): Promise<{ storyboard: Storyboard, tokenUsage: number }> => {
    console.log(`AI Service: Generating Storyboard with ${modelTier} tier...`);
    const ai = getAiClient();
    const modelName = modelTier === 'premium' ? 'gemini-2.5-pro' : 'gemini-2.5-flash';

    const prompt = `
      Act as an expert music video director and cinematographer. Create a complete storyboard based on the provided song analysis, creative brief, and visual bibles.
      The output must be a valid JSON object.
      
      **CRITICAL VIDEO GENERATION CONSTRAINT**: ComfyUI generates video clips that are 6-8 seconds long. Each shot you create will result in ONE 6-8 second video clip.
      
      **COVERAGE REQUIREMENT**: The song is ${analysis.structure[analysis.structure.length - 1]?.end || 0} seconds long. You MUST create enough shots to cover the ENTIRE song duration.
      - Target approximately ${Math.ceil((analysis.structure[analysis.structure.length - 1]?.end || 0) / 7)} shots total (song duration ÷ 7 seconds average clip length).
      - Distribute shots evenly across ALL song sections to ensure complete coverage.
      - Each section should have multiple shots based on its duration (longer sections need more shots).
      
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
      
      Avoid repetitive patterns. For example:
      - If the song has themes of freedom, consider open landscapes, birds in flight, breaking chains, or expansive drone shots rather than generic imagery.
      - If it's a love song, explore specific relationship dynamics from the lyrics rather than generic romantic tropes.
      - For energetic songs, vary between fast-paced editing, dynamic camera moves, vibrant colors, and kinetic compositions.
      - For melancholic songs, use slower pacing, muted colors, intimate close-ups, rain/weather effects, or solitary figure compositions.
      
      For each section in the song's structure, calculate how many shots are needed:
      - Short sections (0-20s): 2-3 shots
      - Medium sections (20-40s): 4-6 shots
      - Long sections (40s+): 6-10 shots
      
      For EACH SHOT, provide ALL of the following details:
      - A detailed description for 'subject' and 'composition'.
      - **action**: CRITICAL - Specify exactly what the character/subject is doing (e.g., "smiling radiantly at camera", "looking pensively at horizon", "turning head slowly left", "dancing energetically"). This controls character behavior in the video.
      - Reference characters and locations from the bibles by name.
      - **cinematic_enhancements**: Be specific. Define a 'lighting_style' (e.g., "High-key, soft fill light"), a 'camera_lens' (e.g., "85mm prime lens", "Wide-angle 24mm"), and a 'camera_motion' (e.g., "Slow push-in on subject", "Static tripod shot").
      - **design_agent_feedback**: Provide a critical evaluation. The 'sync_score' (1-10) should reflect how well the shot matches the song's energy at that moment. The 'cohesion_score' (1-10) should reflect how well it fits the overall creative brief. Provide constructive 'feedback'.
      - **lyric_overlay**: If a key lyric is sung during the shot, include it with a suggested 'animation_style' that matches the emotion (e.g., "Aggressive punch-in", "Gentle fade").
      - Set 'preview_image_url' to an empty string.

      For EACH SCENE, provide:
      - 'narrative_beats': A short (1-2 sentence) description of the story progression.
      - 'description': A slightly more detailed summary of the scene's content and mood.
      - 'transitions': Set this to an empty array. It will be filled in later.
      
      Song Analysis: ${JSON.stringify(analysis, null, 2)}
      Creative Brief: ${JSON.stringify(brief, null, 2)}
      Visual Bibles: ${JSON.stringify(bibles, null, 2)}
    `;

    const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
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
                                narrative_beats: { type: Type.ARRAY, items: {type: Type.STRING }},
                                transitions: { type: Type.ARRAY, items: { type: Type.NULL }, description: "Set this to an empty array."},
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
            },
        },
    });
    const storyboard = JSON.parse(response.text) as Storyboard;

    // Post-process to guarantee full coverage with 6–8s shots aligned to beats
    const covered = ensureStoryboardCoverage(analysis, brief, bibles, storyboard);
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
        const totalDuration = analysis.structure?.[analysis.structure.length - 1]?.end || 0;
        const expectedShots = Math.max(1, Math.ceil(totalDuration / 7));

        // Helper: snap a time to the nearest beat within a window
        const beats = (analysis.beats || []).map(b => b.time).sort((a,b)=>a-b);
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
        const vocalistMap: Record<string,string> = {};
        const vocalists = analysis.vocals?.vocalists || [];
        for (let i=0; i<vocalists.length && i<bibles.characters.length; i++) {
            vocalistMap[vocalists[i].id] = bibles.characters[i].name;
        }

        // Compute scenes by structure sections; ensure each has enough shots
        const scenes = [...(sb.scenes || [])].map(s=>({ ...s, shots: [...(s.shots||[])], transitions: Array.isArray(s.transitions)? s.transitions: [] }));
        const sectionMap = new Map<string, {start:number;end:number;name:string}>();
        for (const sec of analysis.structure || []) sectionMap.set(sec.name + ':' + sec.start, {start: sec.start, end: sec.end, name: sec.name});

        // Fill or create scenes per section
        const ensureShotsForSection = (sectionName: string, start: number, end: number) => {
            const duration = Math.max(0, end - start);
            const target = Math.max(1, Math.ceil(duration / 7));
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
            const existing = scene.shots.sort((a,b)=>a.start-b.start);
            let t = start;
            // If existing shots, advance t
            if (existing.length > 0) t = Math.max(t, existing[existing.length-1].end);
            let shotIndex = existing.length;
            while (shotIndex < target && t + 5.5 < end) {
                const rawStart = snapToBeat(t);
                const desired = 7; // seconds
                const rawEnd = snapToBeat(Math.min(end, rawStart + desired));
                const clipDur = Math.max(6, Math.min(8, rawEnd - rawStart || desired));
                const finalEnd = snapToBeat(Math.min(end, rawStart + clipDur));

                // Choose defaults
                const primaryChar = bibles.characters[0]?.name;
                const loc = bibles.locations[0]?.name;
                const id = `${sectionName}-${Math.round(rawStart*10)}`;

                // Determine performers and lip-sync hint
                const performer_refs: string[] = [];
                let lipSync = false;
                for (const v of vocalists) {
                    const hasOverlap = (v.segments||[]).some(seg => Math.max(seg.start, rawStart) < Math.min(seg.end, finalEnd));
                    if (hasOverlap) {
                        lipSync = true;
                        const mapped = vocalistMap[v.id] || primaryChar;
                        if (mapped) performer_refs.push(mapped);
                    }
                }

                const newShot: StoryboardShot = {
                    id,
                    start: rawStart,
                    end: finalEnd,
                    shot_type: 'Performance close-up',
                    camera_move: 'Subtle dolly-in',
                    composition: 'Rule of thirds, shallow depth of field',
                    subject: brief.videoType === 'Concert Performance' ? 'Singer performing on stage with dynamic lights' : 'Subject expressing lyric emotion',
                    location_ref: loc || 'Primary Location',
                    character_refs: primaryChar ? [primaryChar] : [],
                    performer_refs: performer_refs.length ? performer_refs : undefined,
                    lip_sync_hint: lipSync || undefined,
                    preview_image_url: '',
                    cinematic_enhancements: {
                        lighting_style: 'Cinematic key light with soft fill',
                        camera_lens: '85mm prime',
                        camera_motion: 'Slow push-in'
                    },
                    design_agent_feedback: {
                        sync_score: 8,
                        cohesion_score: 8,
                        placement: 'Aligned to beat grid',
                        feedback: 'Auto-generated coverage shot aligned to music.'
                    }
                } as any;

                scene.shots.push(newShot);
                shotIndex++;
                t = finalEnd + (60 / Math.max(60, analysis.bpm || 120));
            }
            // Ensure transitions array length
            const shotCount = scene.shots.length;
            if (!scene.transitions || scene.transitions.length !== Math.max(0, shotCount - 1)) {
                scene.transitions = new Array(Math.max(0, shotCount - 1)).fill(null);
            }
        };

        for (const sec of analysis.structure || []) {
            ensureShotsForSection(sec.name, sec.start, sec.end);
        }

        // If global shot count still low, add more to longest sections
        const flatShots = scenes.flatMap(s=>s.shots);
        if (flatShots.length < expectedShots) {
            const sectionsByDur = [...(analysis.structure||[])].sort((a,b)=>(b.end-b.start)-(a.end-a.start));
            let idx = 0;
            while (scenes.flatMap(s=>s.shots).length < expectedShots && idx < sectionsByDur.length) {
                const sec = sectionsByDur[idx++];
                ensureShotsForSection(sec.name, sec.start, sec.end);
            }
        }

        // Sort scenes and shots
        scenes.sort((a,b)=>a.start-b.start);
        for (const s of scenes) s.shots.sort((a,b)=>a.start-b.start);

        return { ...sb, scenes };
    } catch (e) {
        console.warn('ensureStoryboardCoverage failed, returning original storyboard', e);
        return sb;
    }
}

export const generateImageForShot = async (shot: StoryboardShot, bibles: Bibles, brief: CreativeBrief, modelTier: 'freemium' | 'premium' = 'freemium'): Promise<{ imageUrl: string, tokenUsage: number }> => {
    const prompt = getPromptForImageShot(shot, bibles, brief);
    
    // Premium tier: Use Google Imagen (high quality, paid)
    if (modelTier === 'premium') {
        console.log("AI Service: Generating image for shot with Google Imagen (Premium)...", shot.id);
        const ai = getAiClient();
        
        try {
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: prompt,
                config: {
                  numberOfImages: 1,
                  outputMimeType: 'image/jpeg',
                  aspectRatio: '16:9',
                },
            });

            const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;
            if (!base64ImageBytes) {
                throw new Error("AI did not return a valid image.");
            }

            const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
            return { imageUrl, tokenUsage: 500 };
        } catch (error) {
            console.error("AI Service: Google Imagen failed:", error);
            throw error;
        }
    }
    
    // Freemium tier: Try ComfyUI first, fallback to Pollinations AI
    try {
        console.log("AI Service: Checking ComfyUI availability (Freemium)...");
        const health = await backendService.checkA1111Health();
        
        if (health.available) {
            console.log("AI Service: Generating image for shot with ComfyUI...", shot.id);
            
            // Get character reference image from bible if available
            const characterRef = shot.character_refs[0]; // Primary character
            const character = characterRef ? bibles.characters.find(c => c.name === characterRef) : null;
            const referenceImageUrl = character?.source_images?.[0]; // Use first source image
            
            const enhancedPrompt = getEnhancedPromptForA1111(shot, bibles, brief);
            console.log("AI Service: Enhanced prompt length:", enhancedPrompt.length);
            console.log("AI Service: Enhanced prompt preview:", enhancedPrompt.substring(0, 200));
            console.log("AI Service: Using character reference image:", referenceImageUrl ? "YES" : "NO");
            
            const params: any = {
                prompt: enhancedPrompt,
                negative_prompt: "blurry, low quality, worst quality, bad anatomy, deformed, disfigured, extra limbs, extra fingers, missing limbs, watermark, text, signature, amateur, low res, jpeg artifacts, grainy, inconsistent lighting, unrealistic, bad proportions, duplicate, clone, cartoon, anime, illustration, 3d render, painting",
                width: 1024,
                height: 576,
                steps: 50,
                cfg_scale: 7.5
            };
            
            // Add img2img parameters if reference image exists
            // High denoising_strength (0.85) means: use reference for style/composition hints only,
            // but generate mostly new content based on prompt (avoids copying collage structure)
            if (referenceImageUrl) {
                params.init_image = referenceImageUrl;
                params.denoising_strength = 0.85; // High value = more creative freedom, less reference copying
                console.log("AI Service: Using img2img mode with denoising_strength:", params.denoising_strength);
            } else {
                console.log("AI Service: NO REFERENCE IMAGE - using txt2img mode");
            }
            
            const result = await backendService.generateImageWithA1111(params);
            return { imageUrl: result.imageUrl, tokenUsage: 0 };
        } else {
            console.log("AI Service: ComfyUI unavailable, falling back to Pollinations AI...");
        }
    } catch (error) {
        console.warn("AI Service: ComfyUI generation failed, falling back to Pollinations AI:", error);
    }
    
    // Fallback for freemium: Use Pollinations AI (free)
    console.log("AI Service: Generating image for shot with Pollinations AI (Freemium fallback)...", shot.id);
    try {
        const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=576&model=flux&nologo=true&enhance=true`;
        
        // Fetch the image and convert to base64
        const response = await fetch(pollinationsUrl);
        if (!response.ok) {
            throw new Error(`Pollinations AI request failed: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                // Extract base64 data after the comma
                const base64Data = result.split(',')[1];
                resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
        
        const imageUrl = `data:image/jpeg;base64,${base64}`;
        return { imageUrl, tokenUsage: 0 };
    } catch (error) {
        console.error("AI Service: Pollinations AI failed:", error);
        throw new Error("All image generation methods failed. Please try again.");
    }
};

export const generateImageForBibleCharacter = async (character: CharacterBible, brief: CreativeBrief, modelTier: 'freemium' | 'premium' = 'freemium'): Promise<{ imageUrl: string, tokenUsage: number }> => {
    const pa = character.physical_appearance;
    const cos = character.costuming_and_props;
    const cin = character.cinematic_style;
    
    const prompt = `
      A cinematic 3:4 aspect ratio character concept art photo.
      - Style: ${brief.style}, ${brief.feel}.
      - Character Name: ${character.name}.
      - Appearance: ${pa.gender_presentation}, ${pa.ethnicity}, ${pa.age_range} years old. ${pa.key_facial_features}.
      - Hair and Eyes: ${pa.hair_style_and_color}, ${pa.eye_color} eyes.
      - Costume Style: ${cos.outfit_style}, specifically wearing ${cos.specific_clothing_items.join(', ')}.
      - Cinematic Lighting: ${cin.lighting_style}.
    `;
    
    if (modelTier === 'freemium') {
        try {
            console.log("AI Service: Checking A1111 availability...");
            const health = await backendService.checkA1111Health();
            
            if (health.available) {
                console.log("AI Service: Generating character image with A1111...", character.name);
                
                // Enhanced prompt with full character details
                const enhancedPrompt = `
Cinematic ${brief.style} character portrait, ${brief.feel} mood, 3:4 aspect ratio.
${character.name}: ${pa.gender_presentation} ${pa.ethnicity} person, ${pa.age_range} years old, ${pa.body_type} build.
Face: ${pa.key_facial_features}.
Hair: ${pa.hair_style_and_color}.
Eyes: ${pa.eye_color}.
Wearing ${cos.outfit_style}: ${cos.specific_clothing_items.join(', ')}.
${cos.signature_props.length > 0 ? `Props: ${cos.signature_props.join(', ')}.` : ''}
Expression: ${character.performance_and_demeanor.emotional_arc}.
Lighting: ${cin.lighting_style}.
Style: ${cin.color_dominants_in_shots.join(', ')} color palette.
Professional character concept art, high detail, sharp focus, photorealistic, ${cin.camera_lenses}.
                `.trim().replace(/^ +/gm, '');
                
                const result = await backendService.generateImageWithA1111({
                    prompt: enhancedPrompt,
                    negative_prompt: "blurry, low quality, worst quality, bad anatomy, deformed, disfigured, multiple heads, multiple people, extra limbs, extra fingers, missing limbs, watermark, text, signature, amateur, low res, duplicate face, inconsistent features, clone, bad proportions",
                    width: 768,
                    height: 1024,
                    steps: 50,
                    cfg_scale: 9
                });
                return { imageUrl: result.imageUrl, tokenUsage: 0 };
            } else {
                console.log("AI Service: ComfyUI unavailable, falling back to Pollinations AI...");
            }
        } catch (error) {
            console.warn("AI Service: ComfyUI generation failed, falling back to Pollinations AI:", error);
        }
        
        console.log("AI Service: Generating bible character with Pollinations AI (Freemium fallback)...", character.name);
        try {
            const enhancedPrompt = `
Cinematic ${brief.style} character portrait, ${brief.feel} mood, 3:4 aspect ratio.
${character.name}: ${pa.gender_presentation} ${pa.ethnicity} person, ${pa.age_range} years old, ${pa.body_type} build.
Face: ${pa.key_facial_features}. Hair: ${pa.hair_style_and_color}. Eyes: ${pa.eye_color}.
Wearing ${cos.outfit_style}: ${cos.specific_clothing_items.join(', ')}.
Expression: ${character.performance_and_demeanor.emotional_arc}. Lighting: ${cin.lighting_style}.
Professional character concept art, high detail, sharp focus, photorealistic.
            `.trim().replace(/\n/g, ' ');
            
            const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=768&height=1024&model=flux&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;
            const imageResponse = await fetch(pollinationsUrl);
            if (!imageResponse.ok) {
                throw new Error(`Pollinations AI returned status ${imageResponse.status}`);
            }
            
            const imageBlob = await imageResponse.blob();
            const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(imageBlob);
            });
            
            const imageUrl = base64;
            return { imageUrl, tokenUsage: 0 };
        } catch (error) {
            console.error("AI Service: Pollinations AI failed:", error);
            throw new Error("All image generation methods failed. Please try again.");
        }
    }
    
    console.log("AI Service: Generating image for character bible with Imagen...", character.name);
    const ai = getAiClient();
    
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '3:4',
        },
    });

    const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (!base64ImageBytes) {
        throw new Error("AI did not return a valid image.");
    }
    
    const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;

    return { imageUrl, tokenUsage: 400 };
};

export const generateImageForBibleLocation = async (location: LocationBible, brief: CreativeBrief, modelTier: 'freemium' | 'premium' = 'freemium'): Promise<{ imageUrl: string, tokenUsage: number }> => {
    const atm = location.atmosphere_and_environment;
    const arch = location.architectural_and_natural_details;
    const sens = location.sensory_details;
    const cin = location.cinematic_style;
    
    const prompt = `
       A cinematic 16:9 aspect ratio environment concept art photo.
      - Style: ${brief.style}, ${brief.feel}.
      - Location Name: ${location.name} (${location.setting_type}).
      - Atmosphere: ${atm.dominant_mood} mood, during the ${atm.time_of_day} with ${atm.weather}.
      - Key Features: ${arch.style}, featuring ${arch.key_features.join(', ')}.
      - Environmental Effects: ${sens.environmental_effects.join(', ')}.
      - Cinematic Lighting: ${cin.lighting_style}.
    `;
    
    if (modelTier === 'freemium') {
        try {
            console.log("AI Service: Checking A1111 availability...");
            const health = await backendService.checkA1111Health();
            
            if (health.available) {
                console.log("AI Service: Generating location image with A1111...", location.name);
                
                // Enhanced prompt with full location details
                const enhancedPrompt = `
Cinematic ${brief.style} environment concept art, ${brief.feel} mood, 16:9 aspect ratio.
${location.name}: ${location.setting_type}.
Time: ${atm.time_of_day}, Weather: ${atm.weather}, Mood: ${atm.dominant_mood}.
Architecture: ${arch.style} style featuring ${arch.key_features.join(', ')}.
Textures: ${sens.textures.join(', ')}.
Environmental effects: ${sens.environmental_effects.join(', ')}.
Lighting: ${cin.lighting_style}.
Color palette: ${cin.color_palette.join(', ')}.
Camera: ${cin.camera_perspective}.
Professional environment concept art, high detail, sharp focus, photorealistic, no people.
                `.trim().replace(/^ +/gm, '');
                
                const result = await backendService.generateImageWithA1111({
                    prompt: enhancedPrompt,
                    negative_prompt: "blurry, low quality, worst quality, distorted, people, characters, humans, figures, watermark, text, signature, amateur, low res, jpeg artifacts, grainy, unrealistic lighting",
                    width: 1024,
                    height: 576,
                    steps: 45,
                    cfg_scale: 8
                });
                return { imageUrl: result.imageUrl, tokenUsage: 0 };
            } else {
                console.log("AI Service: ComfyUI unavailable, falling back to Pollinations AI...");
            }
        } catch (error) {
            console.warn("AI Service: ComfyUI generation failed, falling back to Pollinations AI:", error);
        }
        
        console.log("AI Service: Generating bible location with Pollinations AI (Freemium fallback)...", location.name);
        try {
            const enhancedPrompt = `
Cinematic ${brief.style} environment concept art, ${brief.feel} mood, 16:9 aspect ratio.
${location.name}: ${location.setting_type}.
Time: ${atm.time_of_day}, Weather: ${atm.weather}, Mood: ${atm.dominant_mood}.
Architecture: ${arch.style} style featuring ${arch.key_features.join(', ')}.
Environmental effects: ${sens.environmental_effects.join(', ')}.
Lighting: ${cin.lighting_style}. Color palette: ${cin.color_palette.join(', ')}.
Professional environment concept art, high detail, sharp focus, photorealistic, no people.
            `.trim().replace(/\n/g, ' ');
            
            const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=1024&height=576&model=flux&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;
            const imageResponse = await fetch(pollinationsUrl);
            if (!imageResponse.ok) {
                throw new Error(`Pollinations AI returned status ${imageResponse.status}`);
            }
            
            const imageBlob = await imageResponse.blob();
            const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(imageBlob);
            });
            
            const imageUrl = base64;
            return { imageUrl, tokenUsage: 0 };
        } catch (error) {
            console.error("AI Service: Pollinations AI failed:", error);
            throw new Error("All image generation methods failed. Please try again.");
        }
    }
    
    console.log("AI Service: Generating image for location bible with Imagen...", location.name);
    const ai = getAiClient();
    
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '16:9',
        },
    });

    const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (!base64ImageBytes) {
        throw new Error("AI did not return a valid image.");
    }

    const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;

    return { imageUrl, tokenUsage: 400 };
};


export const editImageForShot = async (shot: StoryboardShot, bibles: Bibles, brief: CreativeBrief, userPrompt: string): Promise<{ imageUrl: string, tokenUsage: number }> => {
    console.log("AI Service: Editing image for shot with Gemini...", shot.id, userPrompt);
    const ai = getAiClient();
    if (!shot.preview_image_url.startsWith('data:')) {
        throw new Error("Cannot edit a non-data URL image.");
    }

    const [header, base64Data] = shot.preview_image_url.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: base64Data, mimeType: mimeType } },
                { text: userPrompt },
            ],
        },
        config: {
            // FIX: Corrected responseModalities to only include Modality.IMAGE as per API guidelines.
            responseModalities: [Modality.IMAGE],
        },
    });
    
    const partWithData = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (partWithData?.inlineData) {
        const newBase64ImageBytes: string = partWithData.inlineData.data;
        const newImageUrl = `data:${partWithData.inlineData.mimeType};base64,${newBase64ImageBytes}`;
        return { imageUrl: newImageUrl, tokenUsage: 750 };
    }
    
    throw new Error("AI did not return an edited image.");
};


export const generateClipForShot = async (
    shot: StoryboardShot,
    image: string,
    bibles: Bibles,
    brief: CreativeBrief,
    modelTier: 'freemium' | 'premium'
): Promise<{ clipUrl: string, tokenUsage: number }> => {
    console.log(`AI Service: Generating clip for shot with ${modelTier} tier...`, shot.id);
    
    // Freemium tier: Video generation is a premium feature
    if (modelTier === 'freemium') {
        throw new Error('AI video generation is a Premium feature. Please upgrade to generate video clips, or use image stills for your export.');
    }
    
    // Premium tier: Use Google Veo for high-quality AI video generation
    const ai = getAiClient(); // Create new instance to get latest key
    if (!image.startsWith('data:')) {
        throw new Error("Cannot generate clip from a non-data URL image.");
    }

    const [header, base64Data] = image.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';

    const prompt = getPromptForClipShot(shot, bibles, brief);

    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        image: {
            imageBytes: base64Data,
            mimeType: mimeType,
        },
        // The generated clips are visuals for a music track and should be silent.
        // The Veo API for image/text-to-video does not add an audio track.
        config: {
            numberOfVideos: 1,
            aspectRatio: '16:9',
            resolution: '720p',
        }
    });

    console.log("Video generation started, polling for completion...");
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
        operation = await ai.operations.getVideosOperation({ operation: operation });
        console.log(`Polling... done: ${operation.done}`);
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation completed, but no download link was provided.");
    }
    
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!response.ok) {
        const errorBody = await response.text();
        console.error("Fetch error body:", errorBody);
        throw new Error(`Failed to download the generated video. Status: ${response.statusText}`);
    }

    const videoBlob = await response.blob();
    const clipUrl = URL.createObjectURL(videoBlob);
    // Cache blob in-memory so export can upload without refetching blob: URL
    if (typeof window !== 'undefined') {
        (window as any).__mvClipBlobs = (window as any).__mvClipBlobs || {};
        (window as any).__mvClipBlobs[clipUrl] = videoBlob;
    }

    return { clipUrl, tokenUsage: 2000 };
};

export const analyzeMoodboardImages = async (
    images: {mimeType: string, data: string}[],
    modelTier: 'freemium' | 'premium'
): Promise<{ briefUpdate: Partial<CreativeBrief>, tokenUsage: number }> => {
    console.log(`AI Service: Analyzing ${images.length} moodboard images with ${modelTier} tier...`);
    const ai = getAiClient();
    const modelName = modelTier === 'premium' ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
    const imageParts = images.map(img => ({
        inlineData: {
            mimeType: img.mimeType,
            data: img.data,
        },
    }));

    const response = await ai.models.generateContent({
        model: modelName,
        contents: {
            parts: [
                { text: "Analyze the following images from a mood board for a music video. Describe the overall 'feel' and 'style', and extract the 5 most dominant colors as hex codes. Respond with a valid JSON object." },
                ...imageParts,
            ],
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    feel: { type: Type.STRING },
                    style: { type: Type.STRING },
                    color_palette: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['feel', 'style', 'color_palette'],
            },
        },
    });

    const briefUpdate = JSON.parse(response.text) as Partial<CreativeBrief>;
    return { briefUpdate, tokenUsage: 1200 };
};

export const getDirectorSuggestions = async (songAnalysis: SongAnalysis, currentBrief: CreativeBrief, modelTier: 'freemium' | 'premium'): Promise<{ suggestions: Partial<CreativeBrief>, tokenUsage: number }> => {
    console.log(`AI Service: Getting director suggestions with ${modelTier} tier...`);
    const ai = getAiClient();
    const modelName = modelTier === 'premium' ? 'gemini-2.5-pro' : 'gemini-2.5-flash';

    const prompt = `
      You are a helpful and creative AI music video director. Based on the provided song analysis and the user's current brief (which may be partially filled), enhance and complete the brief.
      Provide creative, specific, and cohesive ideas for the 'feel', 'style', and 'user_notes' fields.
      Your suggestions should be inspiring and directly related to the song's mood and genre.
      The 'user_notes' should contain a few concrete visual ideas.
      The output must be a valid JSON object.

      Song Analysis: ${JSON.stringify(songAnalysis, null, 2)}
      Current User Brief: ${JSON.stringify(currentBrief, null, 2)}
    `;

    const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    feel: { type: Type.STRING },
                    style: { type: Type.STRING },
                    user_notes: { type: Type.STRING },
                },
                required: ['feel', 'style', 'user_notes'],
            },
        },
    });

    const suggestions = JSON.parse(response.text) as Partial<CreativeBrief>;
    return { suggestions, tokenUsage: 1000 };
};

export const suggestBeatSyncedVfx = async (songAnalysis: SongAnalysis, storyboard: Storyboard, modelTier: 'freemium' | 'premium'): Promise<{ suggestions: { shotId: string; vfx: VFX_PRESET }[], tokenUsage: number }> => {
    console.log(`AI Service: Suggesting beat-synced VFX with ${modelTier} tier...`);
    const ai = getAiClient();
    const modelName = modelTier === 'premium' ? 'gemini-2.5-pro' : 'gemini-2.5-flash';

    const prompt = `
      You are an AI music video editor. Your task is to suggest visual effects (VFX) that sync with the music's energy.
      Analyze the provided song structure and storyboard.
      Identify shots that occur during high-energy sections (like a 'chorus' or 'solo').
      For 1-2 of those shots, suggest a suitable VFX from the provided list.
      Return your suggestions as a valid JSON array.
      
      Available VFX Presets: ${VFX_PRESETS.map(p => p.name).join(', ')}
      
      Song Analysis:
      ${JSON.stringify(songAnalysis.structure, null, 2)}
      
      Storyboard (shot IDs and timings):
      ${JSON.stringify(storyboard.scenes.map(s => ({ section: s.section, shots: s.shots.map(sh => ({ id: sh.id, start: sh.start, end: sh.end })) })), null, 2)}
    `;

    const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        shotId: { type: Type.STRING },
                        vfx: { type: Type.STRING, enum: VFX_PRESETS.map(p => p.name) },
                    },
                    required: ['shotId', 'vfx'],
                },
            },
        },
    });
    
    const suggestions = JSON.parse(response.text) as { shotId: string; vfx: VFX_PRESET }[];
    return { suggestions, tokenUsage: 800 };
};

export const generateTransitions = async (scene: StoryboardScene, bibles: Bibles, brief: CreativeBrief, modelTier: 'freemium' | 'premium'): Promise<{ transitions: (Transition | null)[], tokenUsage: number }> => {
    console.log(`AI Service: Generating transitions for scene ${scene.id} with ${modelTier} tier...`);
    const ai = getAiClient();
    const modelName = modelTier === 'premium' ? 'gemini-2.5-pro' : 'gemini-2.5-flash';

    // FIX: The error "Cannot read properties of undefined (reading 'length')" can occur if `scene.shots` is not a valid array.
    // This check ensures we handle malformed scene data gracefully before accessing .length.
    if (!scene.shots || scene.shots.length <= 1) {
        const numShots = scene.shots?.length || 0;
        return { transitions: new Array(numShots).fill(null), tokenUsage: 0 };
    }

    const shotPairs = [];
    for (let i = 0; i < scene.shots.length - 1; i++) {
        shotPairs.push({ from: scene.shots[i], to: scene.shots[i+1] });
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

    const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
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
            },
        },
    });

    // FIX: Safely handle the API response. The original code `result.transitions` would fail if `JSON.parse` returns null.
    // Also, the model may not return a `transitions` array. Defaulting to an empty array prevents crashes.
    const result = JSON.parse(response.text);
    const transitions = result?.transitions || [];
    const transitionsWithNull = [...transitions, null]; // Add null for the end of the last shot
    return { transitions: transitionsWithNull, tokenUsage: 1000 };
};

export const generateExecutiveProducerFeedback = async (storyboard: Storyboard, bibles: Bibles, brief: CreativeBrief, modelTier: 'freemium' | 'premium'): Promise<{ feedback: ExecutiveProducerFeedback, tokenUsage: number }> => {
    console.log(`AI Service: Generating Executive Producer feedback with ${modelTier} tier...`);
    const ai = getAiClient();
    const modelName = modelTier === 'premium' ? 'gemini-2.5-pro' : 'gemini-2.5-flash';

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

    const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    pacing_score: { type: Type.INTEGER },
                    narrative_score: { type: Type.INTEGER },
                    consistency_score: { type: Type.INTEGER },
                    final_notes: { type: Type.STRING },
                },
                required: ['pacing_score', 'narrative_score', 'consistency_score', 'final_notes'],
            },
        },
    });

    const feedback = JSON.parse(response.text) as ExecutiveProducerFeedback;
    return { feedback, tokenUsage: 1500 };
};
