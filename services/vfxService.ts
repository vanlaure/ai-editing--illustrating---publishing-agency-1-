import { VFXEffect, VFX_CATEGORY, VFX_PRESET, StoryboardShot } from '../types';

/**
 * VFX effect definition with FFmpeg filter generation
 */
interface VFXDefinition {
    category: VFX_CATEGORY;
    name: string;
    description: string;
    ffmpegFilter: (params: any, intensity: number) => string;
    defaultParams: Record<string, any>;
    paramSchema: Record<string, {
        type: 'number' | 'string' | 'boolean';
        min?: number;
        max?: number;
        default?: any;
    }>;
}

/**
 * Validation result for VFX stacks
 */
interface ValidationResult {
    valid: boolean;
    warnings: string[];
    errors: string[];
}

/**
 * VFX Service - Advanced video effects with stacking and filter chain generation
 * 
 * Provides comprehensive VFX capabilities including:
 * - 20+ effects across motion, stylization, atmospheric, and transition categories
 * - Effect stacking with proper ordering
 * - FFmpeg filter chain generation
 * - Legacy preset conversion
 * - Parameter validation
 */
export class VFXService {
    private static instance: VFXService;
    private effectLibrary: Map<string, VFXDefinition>;

    private constructor() {
        this.effectLibrary = new Map();
        this.initializeEffectLibrary();
    }

    public static getInstance(): VFXService {
        if (!VFXService.instance) {
            VFXService.instance = new VFXService();
        }
        return VFXService.instance;
    }

    /**
     * Initialize the VFX effect library with all available effects
     */
    private initializeEffectLibrary(): void {
        // MOTION EFFECTS
        this.registerEffect({
            category: 'motion',
            name: 'slow-motion',
            description: 'Slow down video playback speed',
            ffmpegFilter: (params, intensity) => {
                const speedFactor = 1 - (intensity * 0.75); // 1.0 to 0.25 speed
                return `setpts=${(1 / speedFactor).toFixed(2)}*PTS`;
            },
            defaultParams: {},
            paramSchema: {}
        });

        this.registerEffect({
            category: 'motion',
            name: 'speed-ramp',
            description: 'Dynamic speed changes throughout the clip',
            ffmpegFilter: (params, intensity) => {
                const rampPoints = params.rampPoints || '0.5,1.5,0.5';
                return `setpts='if(lt(T,${params.rampDuration || 1}),PTS/${rampPoints.split(',')[0]},if(lt(T,${params.rampDuration * 2 || 2}),PTS*${rampPoints.split(',')[1]},PTS/${rampPoints.split(',')[2]}))'`;
            },
            defaultParams: { rampDuration: 1, rampPoints: '0.5,1.5,0.5' },
            paramSchema: {
                rampDuration: { type: 'number', min: 0.1, max: 10, default: 1 },
                rampPoints: { type: 'string', default: '0.5,1.5,0.5' }
            }
        });

        this.registerEffect({
            category: 'motion',
            name: 'freeze-frame',
            description: 'Freeze video at specific timestamp',
            ffmpegFilter: (params, intensity) => {
                const freezeTime = params.freezeTime || 0;
                const duration = params.duration || 1;
                return `tpad=stop_mode=clone:stop_duration=${duration}`;
            },
            defaultParams: { freezeTime: 0, duration: 1 },
            paramSchema: {
                freezeTime: { type: 'number', min: 0, default: 0 },
                duration: { type: 'number', min: 0.1, max: 5, default: 1 }
            }
        });

        this.registerEffect({
            category: 'motion',
            name: 'rewind',
            description: 'Play video in reverse',
            ffmpegFilter: (params, intensity) => {
                return intensity > 0.5 ? 'reverse' : 'setpts=1.5*PTS,reverse';
            },
            defaultParams: {},
            paramSchema: {}
        });

        this.registerEffect({
            category: 'motion',
            name: 'time-stretch',
            description: 'Non-uniform time stretching',
            ffmpegFilter: (params, intensity) => {
                const stretchFactor = 1 + (intensity * 2);
                return `setpts=${stretchFactor.toFixed(2)}*PTS`;
            },
            defaultParams: {},
            paramSchema: {}
        });

        // STYLIZATION EFFECTS
        this.registerEffect({
            category: 'stylization',
            name: 'vintage-film',
            description: 'Classic film look with grain and vignette',
            ffmpegFilter: (params, intensity) => {
                const grainStrength = Math.floor(intensity * 20);
                const vignetteStrength = intensity * 0.5;
                return `curves=vintage,noise=alls=${grainStrength}:allf=t,vignette=PI/${(4 / vignetteStrength).toFixed(1)}`;
            },
            defaultParams: {},
            paramSchema: {}
        });

        this.registerEffect({
            category: 'stylization',
            name: 'glitch-art',
            description: 'Digital glitch distortion effects',
            ffmpegFilter: (params, intensity) => {
                const noiseLevel = Math.floor(intensity * 30);
                return `noise=c0s=${noiseLevel}:allf=t,split[a][b];[a]crop=iw:ih*0.5:0:0[top];[b]crop=iw:ih*0.5:0:ih*0.5[bottom];[top][bottom]vstack`;
            },
            defaultParams: {},
            paramSchema: {}
        });

        this.registerEffect({
            category: 'stylization',
            name: 'anime-style',
            description: 'Anime/cartoon posterization effect',
            ffmpegFilter: (params, intensity) => {
                const levels = Math.max(2, Math.floor(8 - (intensity * 6)));
                return `edgedetect=low=0.1:high=0.4,negate,format=gray,colorkey=black:0.1:0.1,eq=contrast=2:brightness=-0.1,posterize=${levels}`;
            },
            defaultParams: {},
            paramSchema: {}
        });

        this.registerEffect({
            category: 'stylization',
            name: 'rotoscoping',
            description: 'Painterly rotoscope effect',
            ffmpegFilter: (params, intensity) => {
                return `edgedetect,negate,eq=contrast=${1 + intensity}:brightness=${-0.2 * intensity}`;
            },
            defaultParams: {},
            paramSchema: {}
        });

        this.registerEffect({
            category: 'stylization',
            name: 'posterize',
            description: 'Reduce color levels for poster effect',
            ffmpegFilter: (params, intensity) => {
                const levels = Math.max(2, Math.floor(32 - (intensity * 28)));
                return `posterize=${levels}`;
            },
            defaultParams: {},
            paramSchema: {}
        });

        // ATMOSPHERIC EFFECTS
        this.registerEffect({
            category: 'atmospheric',
            name: 'lens-flare',
            description: 'Simulated lens flare effect',
            ffmpegFilter: (params, intensity) => {
                const brightness = 0.3 + (intensity * 0.7);
                return `lut='c0=if(gt(val,200),val*${brightness.toFixed(2)},val):c1=if(gt(val,200),val*${brightness.toFixed(2)},val):c2=if(gt(val,200),val*${brightness.toFixed(2)},val)'`;
            },
            defaultParams: {},
            paramSchema: {}
        });

        this.registerEffect({
            category: 'atmospheric',
            name: 'light-leaks',
            description: 'Organic light leak overlays',
            ffmpegFilter: (params, intensity) => {
                const amount = intensity * 0.4;
                return `curves=r='0/0 0.5/${0.5 + amount} 1/1':g='0/0 0.5/${0.5 + amount * 0.8} 1/1':b='0/0 0.5/${0.5 + amount * 0.6} 1/1'`;
            },
            defaultParams: {},
            paramSchema: {}
        });

        this.registerEffect({
            category: 'atmospheric',
            name: 'bokeh',
            description: 'Shallow depth of field blur',
            ffmpegFilter: (params, intensity) => {
                const blurStrength = Math.floor(intensity * 10) + 1;
                return `boxblur=lr=${blurStrength}:lp=1`;
            },
            defaultParams: {},
            paramSchema: {}
        });

        this.registerEffect({
            category: 'atmospheric',
            name: 'chromatic-aberration',
            description: 'RGB channel separation',
            ffmpegFilter: (params, intensity) => {
                const offset = Math.floor(intensity * 5);
                return `split[r][gb];[r]lutrgb=g=0:b=0,crop=iw-${offset}:ih:${offset}:0[r];[gb]lutrgb=r=0[gb];[r][gb]overlay=0:0`;
            },
            defaultParams: {},
            paramSchema: {}
        });

        this.registerEffect({
            category: 'atmospheric',
            name: 'vignette',
            description: 'Darkened corners for focus',
            ffmpegFilter: (params, intensity) => {
                const angle = Math.PI / (4 - (intensity * 3));
                return `vignette=angle=${angle.toFixed(2)}`;
            },
            defaultParams: {},
            paramSchema: {}
        });

        // TRANSITION EFFECTS
        this.registerEffect({
            category: 'transition',
            name: 'zoom-blur',
            description: 'Radial zoom blur transition',
            ffmpegFilter: (params, intensity) => {
                const zoomAmount = 1 + (intensity * 0.3);
                return `zoompan=z='${zoomAmount}':d=1:s=1920x1080,boxblur=2:1`;
            },
            defaultParams: {},
            paramSchema: {}
        });

        this.registerEffect({
            category: 'transition',
            name: 'pixelate',
            description: 'Pixelation transition effect',
            ffmpegFilter: (params, intensity) => {
                const pixelSize = Math.floor(intensity * 50) + 10;
                return `scale=iw/${pixelSize}:ih/${pixelSize},scale=iw*${pixelSize}:ih*${pixelSize}:flags=neighbor`;
            },
            defaultParams: {},
            paramSchema: {}
        });

        this.registerEffect({
            category: 'transition',
            name: 'wipe-patterns',
            description: 'Directional wipe transition',
            ffmpegFilter: (params, intensity) => {
                const direction = params.direction || 'right';
                return `fade=t=in:st=0:d=${intensity}:alpha=1`;
            },
            defaultParams: { direction: 'right' },
            paramSchema: {
                direction: { type: 'string', default: 'right' }
            }
        });

        this.registerEffect({
            category: 'transition',
            name: 'dissolve',
            description: 'Smooth dissolve transition',
            ffmpegFilter: (params, intensity) => {
                return `fade=t=in:st=0:d=${intensity * 2}`;
            },
            defaultParams: {},
            paramSchema: {}
        });

        this.registerEffect({
            category: 'transition',
            name: 'page-turn',
            description: 'Page flip transition effect',
            ffmpegFilter: (params, intensity) => {
                // Simulate page turn with perspective transform
                return `perspective=x0=0:y0=0:x1=W:y1=0:x2=${intensity * 100}:y2=H:x3=W-${intensity * 100}:y3=H:interpolation=linear`;
            },
            defaultParams: {},
            paramSchema: {}
        });

        // Add more advanced effects
        this.registerEffect({
            category: 'stylization',
            name: 'datamosh',
            description: 'Compression artifact glitches',
            ffmpegFilter: (params, intensity) => {
                const artifactLevel = Math.floor(intensity * 50);
                return `noise=alls=${artifactLevel}:allf=t,eq=contrast=${1 + intensity}`;
            },
            defaultParams: {},
            paramSchema: {}
        });

        this.registerEffect({
            category: 'atmospheric',
            name: 'fog-overlay',
            description: 'Atmospheric fog/haze effect',
            ffmpegFilter: (params, intensity) => {
                const fogAmount = intensity * 0.3;
                return `curves=all='0/0 0.5/${0.5 + fogAmount} 1/1',eq=brightness=${fogAmount}`;
            },
            defaultParams: {},
            paramSchema: {}
        });

        this.registerEffect({
            category: 'motion',
            name: 'strobe',
            description: 'Rhythmic strobe flashing',
            ffmpegFilter: (params, intensity) => {
                const frequency = Math.floor(intensity * 10) + 2;
                return `select='not(mod(n,${frequency}))',setpts=N/FRAME_RATE/TB`;
            },
            defaultParams: {},
            paramSchema: {}
        });

        this.registerEffect({
            category: 'stylization',
            name: 'thermal-vision',
            description: 'Heat signature thermal camera effect',
            ffmpegFilter: (params, intensity) => {
                return `pseudocolor='preset=turbo:opacity=${intensity}'`;
            },
            defaultParams: {},
            paramSchema: {}
        });

        this.registerEffect({
            category: 'atmospheric',
            name: 'rain-drops',
            description: 'Simulated rain on lens',
            ffmpegFilter: (params, intensity) => {
                const dropAmount = Math.floor(intensity * 50);
                return `noise=alls=${dropAmount}:allf=t,boxblur=2:1`;
            },
            defaultParams: {},
            paramSchema: {}
        });
    }

    /**
     * Register a VFX effect in the library
     */
    private registerEffect(definition: VFXDefinition): void {
        this.effectLibrary.set(definition.name, definition);
    }

    /**
     * Apply a stack of VFX effects to a video clip
     * 
     * @param videoUrl - URL or path to input video
     * @param vfxStack - Array of VFX effects to apply
     * @param outputPath - Optional output path (auto-generated if not provided)
     * @returns Promise resolving to output video URL
     * 
     * @example
     * ```typescript
     * const vfxService = VFXService.getInstance();
     * const output = await vfxService.applyVFXStack(
     *   'input.mp4',
     *   [
     *     { category: 'motion', name: 'slow-motion', intensity: 0.7, parameters: {} },
     *     { category: 'stylization', name: 'vintage-film', intensity: 0.5, parameters: {} }
     *   ]
     * );
     * ```
     */
    public async applyVFXStack(
        videoUrl: string,
        vfxStack: VFXEffect[],
        outputPath?: string
    ): Promise<string> {
        // Validate the effect stack
        const validation = this.validateEffectStack(vfxStack);
        if (!validation.valid) {
            throw new Error(`Invalid VFX stack: ${validation.errors.join(', ')}`);
        }

        // Log warnings if any
        validation.warnings.forEach(warning => {
            console.warn(`VFX Warning: ${warning}`);
        });

        // Generate FFmpeg filter chain
        const filterChain = this.generateFilterChain(vfxStack);

        // TODO: Implement backend integration
        // For now, return the filter chain as a string for testing
        console.log('Generated FFmpeg filter chain:', filterChain);

        // TODO: Call backend service to apply filters
        // const result = await backendService.applyVFXFilters(videoUrl, filterChain, outputPath);
        // return result.outputUrl;

        // Stub implementation
        throw new Error('Backend VFX processing not yet implemented. Filter chain: ' + filterChain);
    }

    /**
     * Generate FFmpeg filter chain from VFX effect stack
     * 
     * Effects are ordered by category:
     * 1. Motion effects (affect frame count)
     * 2. Atmospheric effects
     * 3. Stylization effects
     * 4. Transition effects
     * 
     * @param vfxStack - Array of VFX effects
     * @returns FFmpeg-compatible filter string
     * 
     * @example
     * ```typescript
     * const chain = vfxService.generateFilterChain([
     *   { category: 'motion', name: 'slow-motion', intensity: 0.5, parameters: {} },
     *   { category: 'atmospheric', name: 'vignette', intensity: 0.8, parameters: {} }
     * ]);
     * // Returns: "setpts=1.33*PTS,vignette=angle=0.79"
     * ```
     */
    public generateFilterChain(vfxStack: VFXEffect[]): string {
        if (vfxStack.length === 0) {
            return '';
        }

        // Sort effects by category priority
        const categoryOrder: VFX_CATEGORY[] = ['motion', 'atmospheric', 'stylization', 'transition'];
        const sortedStack = [...vfxStack].sort((a, b) => {
            return categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
        });

        // Generate filter strings for each effect
        const filters: string[] = [];
        for (const effect of sortedStack) {
            const definition = this.effectLibrary.get(effect.name);
            if (!definition) {
                console.warn(`Unknown VFX effect: ${effect.name}`);
                continue;
            }

            // Merge default params with user params
            const params = { ...definition.defaultParams, ...effect.parameters };

            // Generate filter string
            const filterString = definition.ffmpegFilter(params, effect.intensity);
            filters.push(filterString);
        }

        // Join filters with comma for FFmpeg filter chain
        return filters.join(',');
    }

    /**
     * Convert legacy VFX preset to new effect stack
     * 
     * @param preset - Legacy VFX_PRESET value
     * @returns Array of VFXEffect objects
     * 
     * @example
     * ```typescript
     * const stack = vfxService.presetToEffectStack('Vintage Film Grain');
     * // Returns VFX stack with vintage-film and related effects
     * ```
     */
    public presetToEffectStack(preset: VFX_PRESET): VFXEffect[] {
        const presetMap: Record<VFX_PRESET, VFXEffect[]> = {
            'Slow Motion': [
                {
                    category: 'motion',
                    name: 'slow-motion',
                    intensity: 0.7,
                    parameters: {}
                }
            ],
            'Speed Ramp': [
                {
                    category: 'motion',
                    name: 'speed-ramp',
                    intensity: 0.8,
                    parameters: {
                        rampDuration: 1.5,
                        rampPoints: '0.5,2.0,0.5'
                    }
                }
            ],
            'Lens Flare': [
                {
                    category: 'atmospheric',
                    name: 'lens-flare',
                    intensity: 0.6,
                    parameters: {}
                },
                {
                    category: 'atmospheric',
                    name: 'light-leaks',
                    intensity: 0.3,
                    parameters: {}
                }
            ],
            'Glitch Effect': [
                {
                    category: 'stylization',
                    name: 'glitch-art',
                    intensity: 0.7,
                    parameters: {}
                },
                {
                    category: 'stylization',
                    name: 'datamosh',
                    intensity: 0.5,
                    parameters: {}
                }
            ],
            'Vintage Film Grain': [
                {
                    category: 'stylization',
                    name: 'vintage-film',
                    intensity: 0.6,
                    parameters: {}
                },
                {
                    category: 'atmospheric',
                    name: 'vignette',
                    intensity: 0.4,
                    parameters: {}
                }
            ]
        };

        return presetMap[preset] || [];
    }

    /**
     * Validate VFX effect stack for compatibility and performance
     * 
     * @param vfxStack - Array of VFX effects to validate
     * @returns Validation result with errors and warnings
     * 
     * @example
     * ```typescript
     * const result = vfxService.validateEffectStack(myEffects);
     * if (!result.valid) {
     *   console.error('Validation errors:', result.errors);
     * }
     * ```
     */
    public validateEffectStack(vfxStack: VFXEffect[]): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Check for empty stack
        if (vfxStack.length === 0) {
            warnings.push('Empty VFX stack - no effects will be applied');
        }

        // Validate each effect
        for (const effect of vfxStack) {
            // Check if effect exists
            const definition = this.effectLibrary.get(effect.name);
            if (!definition) {
                errors.push(`Unknown effect: ${effect.name}`);
                continue;
            }

            // Validate intensity range
            if (effect.intensity < 0 || effect.intensity > 1) {
                errors.push(`Invalid intensity ${effect.intensity} for ${effect.name} (must be 0-1)`);
            }

            // Validate parameters
            if (effect.parameters) {
                for (const [key, value] of Object.entries(effect.parameters)) {
                    const schema = definition.paramSchema[key];
                    if (!schema) {
                        warnings.push(`Unknown parameter ${key} for effect ${effect.name}`);
                        continue;
                    }

                    // Type validation
                    if (schema.type === 'number' && typeof value !== 'number') {
                        errors.push(`Parameter ${key} for ${effect.name} must be a number`);
                    } else if (schema.type === 'string' && typeof value !== 'string') {
                        errors.push(`Parameter ${key} for ${effect.name} must be a string`);
                    } else if (schema.type === 'boolean' && typeof value !== 'boolean') {
                        errors.push(`Parameter ${key} for ${effect.name} must be a boolean`);
                    }

                    // Range validation for numbers
                    if (schema.type === 'number' && typeof value === 'number') {
                        if (schema.min !== undefined && value < schema.min) {
                            errors.push(`Parameter ${key} for ${effect.name} must be >= ${schema.min}`);
                        }
                        if (schema.max !== undefined && value > schema.max) {
                            errors.push(`Parameter ${key} for ${effect.name} must be <= ${schema.max}`);
                        }
                    }
                }
            }
        }

        // Check for performance-heavy combinations
        const motionEffects = vfxStack.filter(e => e.category === 'motion');
        if (motionEffects.length > 2) {
            warnings.push('Multiple motion effects may cause performance issues and unexpected results');
        }

        const highIntensityEffects = vfxStack.filter(e => e.intensity > 0.8);
        if (highIntensityEffects.length > 3) {
            warnings.push('Many high-intensity effects may cause quality degradation');
        }

        // Check for incompatible combinations
        const hasReverse = vfxStack.some(e => e.name === 'rewind');
        const hasSpeedChange = vfxStack.some(e => e.name === 'slow-motion' || e.name === 'speed-ramp');
        if (hasReverse && hasSpeedChange) {
            warnings.push('Combining reverse with speed changes may produce unexpected results');
        }

        return {
            valid: errors.length === 0,
            warnings,
            errors
        };
    }

    /**
     * Get all available effects, optionally filtered by category
     * 
     * @param category - Optional category filter
     * @returns Array of VFX definitions
     * 
     * @example
     * ```typescript
     * const motionEffects = vfxService.getAvailableEffects('motion');
     * const allEffects = vfxService.getAvailableEffects();
     * ```
     */
    public getAvailableEffects(category?: VFX_CATEGORY): VFXDefinition[] {
        const effects = Array.from(this.effectLibrary.values());
        
        if (category) {
            return effects.filter(e => e.category === category);
        }
        
        return effects;
    }

    /**
     * Get a specific effect definition by name
     * 
     * @param name - Effect name
     * @returns VFX definition or undefined
     */
    public getEffectDefinition(name: string): VFXDefinition | undefined {
        return this.effectLibrary.get(name);
    }

    /**
     * Create a preset effect stack for common use cases
     * 
     * @param presetName - Name of the preset
     * @returns Array of VFX effects
     * 
     * @example
     * ```typescript
     * const cinematic = vfxService.createPresetStack('cinematic');
     * const energetic = vfxService.createPresetStack('energetic-music-video');
     * ```
     */
    public createPresetStack(presetName: string): VFXEffect[] {
        const presets: Record<string, VFXEffect[]> = {
            'cinematic': [
                { category: 'atmospheric', name: 'vignette', intensity: 0.5, parameters: {} },
                { category: 'atmospheric', name: 'bokeh', intensity: 0.3, parameters: {} },
                { category: 'atmospheric', name: 'light-leaks', intensity: 0.2, parameters: {} }
            ],
            'retro': [
                { category: 'stylization', name: 'vintage-film', intensity: 0.7, parameters: {} },
                { category: 'atmospheric', name: 'vignette', intensity: 0.6, parameters: {} }
            ],
            'cyberpunk': [
                { category: 'stylization', name: 'glitch-art', intensity: 0.5, parameters: {} },
                { category: 'atmospheric', name: 'chromatic-aberration', intensity: 0.4, parameters: {} },
                { category: 'stylization', name: 'datamosh', intensity: 0.3, parameters: {} }
            ],
            'dream-sequence': [
                { category: 'atmospheric', name: 'bokeh', intensity: 0.6, parameters: {} },
                { category: 'motion', name: 'time-stretch', intensity: 0.7, parameters: {} },
                { category: 'atmospheric', name: 'fog-overlay', intensity: 0.4, parameters: {} }
            ],
            'energetic-music-video': [
                { category: 'motion', name: 'strobe', intensity: 0.6, parameters: {} },
                { category: 'atmospheric', name: 'chromatic-aberration', intensity: 0.5, parameters: {} }
            ],
            'horror': [
                { category: 'stylization', name: 'thermal-vision', intensity: 0.5, parameters: {} },
                { category: 'atmospheric', name: 'vignette', intensity: 0.8, parameters: {} },
                { category: 'stylization', name: 'posterize', intensity: 0.6, parameters: {} }
            ],
            'anime': [
                { category: 'stylization', name: 'anime-style', intensity: 0.8, parameters: {} },
                { category: 'stylization', name: 'rotoscoping', intensity: 0.5, parameters: {} }
            ]
        };

        return presets[presetName] || [];
    }

    /**
     * Estimate the performance impact of a VFX stack
     * 
     * @param vfxStack - Array of VFX effects
     * @returns Performance impact score (0-1, higher = more intensive)
     */
    public estimatePerformanceImpact(vfxStack: VFXEffect[]): number {
        let impact = 0;

        // Motion effects are most expensive
        const motionEffects = vfxStack.filter(e => e.category === 'motion');
        impact += motionEffects.length * 0.3;

        // Stylization effects are moderately expensive
        const stylizationEffects = vfxStack.filter(e => e.category === 'stylization');
        impact += stylizationEffects.length * 0.2;

        // Atmospheric effects are less expensive
        const atmosphericEffects = vfxStack.filter(e => e.category === 'atmospheric');
        impact += atmosphericEffects.length * 0.1;

        // Transition effects are least expensive
        const transitionEffects = vfxStack.filter(e => e.category === 'transition');
        impact += transitionEffects.length * 0.05;

        // High intensity increases impact
        const avgIntensity = vfxStack.reduce((sum, e) => sum + e.intensity, 0) / vfxStack.length;
        impact *= (0.5 + avgIntensity * 0.5);

        return Math.min(impact, 1);
    }
}

// Export singleton instance
export const vfxService = VFXService.getInstance();