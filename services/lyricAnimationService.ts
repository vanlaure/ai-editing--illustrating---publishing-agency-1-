/**
 * Lyric Animation Service
 * 
 * Professional lyric overlay rendering with advanced timing, animations, and styling.
 * Generates FFmpeg-compatible subtitle files and drawtext filters for video overlays.
 * 
 * Features:
 * - Word-level timing and karaoke highlighting
 * - Multiple animation styles (fade, slide, bounce, typewriter, etc.)
 * - Advanced styling (fonts, colors, strokes, shadows, 3D)
 * - Flexible positioning (anchors, offsets, subject-following)
 * - Preset animation combinations
 * - ASS/SRT subtitle generation
 * - FFmpeg filter chain generation
 */

import type { LyricOverlay, SongAnalysis, EnhancedSongAnalysis } from '../types';

/**
 * Preset animation configurations
 */
const ANIMATION_PRESETS = {
    karaoke: {
        timing: { word_by_word: true },
        animation: {
            appear_style: 'fade' as const,
            disappear_style: 'fade' as const,
            karaoke_highlight: true,
            easing: 'ease-out' as const
        },
        styling: {
            font_family: 'Arial',
            font_size: 48,
            color: '#FFFFFF',
            stroke_color: '#000000',
            stroke_width: 2,
            shadow: true,
            opacity: 1
        },
        positioning: {
            anchor: 'bottom' as const,
            offset_y: -80,
            z_index: 10
        }
    },
    cinematic: {
        timing: { word_by_word: false },
        animation: {
            appear_style: 'fade' as const,
            disappear_style: 'fade' as const,
            karaoke_highlight: false,
            easing: 'ease-in-out' as const
        },
        styling: {
            font_family: 'Georgia',
            font_size: 42,
            color: '#E8E8E8',
            stroke_color: '#1A1A1A',
            stroke_width: 1,
            shadow: true,
            opacity: 0.95
        },
        positioning: {
            anchor: 'bottom' as const,
            offset_y: -100,
            z_index: 10
        }
    },
    minimal: {
        timing: { word_by_word: false },
        animation: {
            appear_style: 'fade' as const,
            disappear_style: 'fade' as const,
            karaoke_highlight: false,
            easing: 'linear' as const
        },
        styling: {
            font_family: 'Helvetica',
            font_size: 36,
            color: '#FFFFFF',
            opacity: 0.9
        },
        positioning: {
            anchor: 'center' as const,
            z_index: 10
        }
    },
    energetic: {
        timing: { word_by_word: true },
        animation: {
            appear_style: 'bounce' as const,
            disappear_style: 'explode' as const,
            karaoke_highlight: true,
            easing: 'ease-out' as const
        },
        styling: {
            font_family: 'Impact',
            font_size: 56,
            color: '#FF00FF',
            stroke_color: '#00FFFF',
            stroke_width: 3,
            shadow: true,
            opacity: 1
        },
        positioning: {
            anchor: 'center' as const,
            z_index: 10
        }
    },
    storytelling: {
        timing: { word_by_word: false },
        animation: {
            appear_style: 'slide' as const,
            disappear_style: 'slide' as const,
            karaoke_highlight: false,
            easing: 'ease-in-out' as const
        },
        styling: {
            font_family: 'Times New Roman',
            font_size: 40,
            color: '#F5F5DC',
            stroke_color: '#2F4F4F',
            stroke_width: 1.5,
            shadow: true,
            opacity: 0.95
        },
        positioning: {
            anchor: 'bottom' as const,
            offset_y: -120,
            z_index: 10
        }
    }
};

/**
 * Lyric Animation Service
 */
export class LyricAnimationService {
    /**
     * Analyze lyrics and generate word-level timing aligned to song structure
     */
    analyzeLyricTiming(
        lyrics: string,
        songAnalysis: SongAnalysis | EnhancedSongAnalysis
    ): LyricOverlay[] {
        const lines = lyrics.split('\n').filter(line => line.trim().length > 0);
        const overlays: LyricOverlay[] = [];

        // Calculate total song duration
        const songDuration = songAnalysis.structure.length > 0
            ? songAnalysis.structure[songAnalysis.structure.length - 1].end
            : 180; // Default 3 minutes

        // Average words per second for natural speech/singing
        const wordsPerSecond = 3.5;

        // Distribute lyrics across song structure
        let currentStructureIndex = 0;
        const linesPerSection = Math.ceil(lines.length / songAnalysis.structure.length);

        lines.forEach((line, lineIndex) => {
            const words = line.trim().split(/\s+/);
            
            // Determine which song section this line belongs to
            const sectionIndex = Math.min(
                Math.floor(lineIndex / linesPerSection),
                songAnalysis.structure.length - 1
            );
            const section = songAnalysis.structure[sectionIndex];

            // Calculate line timing within section
            const sectionDuration = section.end - section.start;
            const lineOffset = (lineIndex % linesPerSection) / linesPerSection;
            const lineDuration = Math.min(words.length / wordsPerSecond, sectionDuration / linesPerSection);

            const lineStart = section.start + (sectionDuration * lineOffset);
            const lineEnd = Math.min(lineStart + lineDuration, section.end);

            // Generate word timestamps for karaoke
            const wordTimestamps: number[] = [];
            const wordDuration = (lineEnd - lineStart) / words.length;
            
            words.forEach((_, wordIndex) => {
                wordTimestamps.push(lineStart + (wordDuration * wordIndex));
            });

            // Create lyric overlay with default styling
            overlays.push({
                text: line.trim(),
                timing: {
                    word_timestamps: wordTimestamps,
                    line_appear_time: lineStart,
                    line_disappear_time: lineEnd
                },
                animation: {
                    appear_style: 'fade',
                    disappear_style: 'fade',
                    karaoke_highlight: false,
                    easing: 'ease-in-out'
                },
                styling: {
                    font_family: 'Arial',
                    font_size: 48,
                    color: '#FFFFFF',
                    stroke_color: '#000000',
                    stroke_width: 2,
                    shadow: true,
                    opacity: 1
                },
                positioning: {
                    anchor: 'bottom',
                    offset_y: -80,
                    z_index: 10
                }
            });
        });

        return overlays;
    }

    /**
     * Render lyric overlay to video using FFmpeg
     */
    async renderLyricOverlay(
        videoUrl: string,
        lyricOverlay: LyricOverlay,
        outputPath?: string
    ): Promise<string> {
        // This is a stub - actual implementation would use ffmpegService
        // For now, return the path where the video would be saved
        const defaultOutput = outputPath || `output_with_lyrics_${Date.now()}.mp4`;
        
        console.log('[LyricAnimationService] Rendering lyric overlay:', {
            video: videoUrl,
            text: lyricOverlay.text,
            output: defaultOutput
        });

        // In production, this would:
        // 1. Generate ASS subtitle or drawtext filter
        // 2. Call FFmpeg to render video with overlay
        // 3. Return path to rendered video
        
        return defaultOutput;
    }

    /**
     * Generate FFmpeg drawtext filter for a lyric overlay
     */
    generateDrawtextFilter(
        lyricOverlay: LyricOverlay,
        videoWidth: number = 1920,
        videoHeight: number = 1080
    ): string {
        const { text, timing, animation, styling, positioning } = lyricOverlay;
        
        // Escape text for FFmpeg
        const escapedText = text.replace(/'/g, "\\'").replace(/:/g, "\\:");

        // Calculate position
        const position = this.calculatePosition(positioning, videoWidth, videoHeight);

        // Base drawtext parameters
        const params: string[] = [
            `text='${escapedText}'`,
            `fontfile=Arial`, // In production, use actual font path
            `fontsize=${styling.font_size}`,
            this.colorToFFmpeg(styling.color, styling.opacity),
            `x=${position.x}`,
            `y=${position.y}`
        ];

        // Add stroke/outline
        if (styling.stroke_color && styling.stroke_width) {
            params.push(`borderw=${styling.stroke_width}`);
            params.push(`bordercolor=${this.colorToFFmpeg(styling.stroke_color)}`);
        }

        // Add shadow
        if (styling.shadow) {
            params.push('shadowcolor=black@0.5');
            params.push('shadowx=2');
            params.push('shadowy=2');
        }

        // Add timing enable
        params.push(`enable='between(t,${timing.line_appear_time},${timing.line_disappear_time})'`);

        // Add animation effects
        const animatedParams = this.addAnimationEffects(
            params,
            animation,
            timing,
            position
        );

        return `drawtext=${animatedParams.join(':')}`;
    }

    /**
     * Generate ASS subtitle file for multiple lyric overlays
     */
    generateASSSubtitle(lyricOverlays: LyricOverlay[]): string {
        const ass: string[] = [
            '[Script Info]',
            'Title: Lyric Subtitles',
            'ScriptType: v4.00+',
            'WrapStyle: 0',
            'PlayResX: 1920',
            'PlayResY: 1080',
            '',
            '[V4+ Styles]',
            'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding'
        ];

        // Create styles for each unique styling configuration
        const styles = new Map<string, string>();
        
        lyricOverlays.forEach((overlay, index) => {
            const styleKey = JSON.stringify(overlay.styling);
            if (!styles.has(styleKey)) {
                const styleName = `Style${styles.size}`;
                styles.set(styleKey, styleName);
                
                const style = this.generateASSStyle(styleName, overlay);
                ass.push(style);
            }
        });

        ass.push('', '[Events]');
        ass.push('Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text');

        // Add dialogue events
        lyricOverlays.forEach((overlay) => {
            const styleKey = JSON.stringify(overlay.styling);
            const styleName = styles.get(styleKey) || 'Style0';
            
            const dialogue = this.generateASSDialogue(overlay, styleName);
            ass.push(dialogue);
        });

        return ass.join('\n');
    }

    /**
     * Create preset animation configuration
     */
    createPresetAnimation(
        text: string,
        presetName: keyof typeof ANIMATION_PRESETS,
        timing: { start: number; end: number }
    ): LyricOverlay {
        const preset = ANIMATION_PRESETS[presetName];
        
        if (!preset) {
            throw new Error(`Unknown preset: ${presetName}`);
        }

        // Generate word timestamps if word-by-word timing
        let wordTimestamps: number[] | undefined;
        if (preset.timing.word_by_word) {
            const words = text.split(/\s+/);
            const duration = timing.end - timing.start;
            const wordDuration = duration / words.length;
            
            wordTimestamps = words.map((_, index) => 
                timing.start + (wordDuration * index)
            );
        }

        return {
            text,
            timing: {
                word_timestamps: wordTimestamps,
                line_appear_time: timing.start,
                line_disappear_time: timing.end
            },
            animation: preset.animation,
            styling: preset.styling,
            positioning: preset.positioning
        };
    }

    /**
     * Validate lyric overlay configuration
     */
    validateLyricOverlay(overlay: LyricOverlay): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Validate text
        if (!overlay.text || overlay.text.trim().length === 0) {
            errors.push('Text cannot be empty');
        }

        // Validate timing
        if (overlay.timing.line_appear_time < 0) {
            errors.push('Line appear time cannot be negative');
        }
        if (overlay.timing.line_disappear_time <= overlay.timing.line_appear_time) {
            errors.push('Line disappear time must be after appear time');
        }
        if (overlay.timing.word_timestamps) {
            const words = overlay.text.split(/\s+/);
            if (overlay.timing.word_timestamps.length !== words.length) {
                errors.push('Word timestamp count must match word count');
            }
        }

        // Validate styling
        if (overlay.styling.font_size <= 0) {
            errors.push('Font size must be positive');
        }
        if (overlay.styling.opacity !== undefined) {
            if (overlay.styling.opacity < 0 || overlay.styling.opacity > 1) {
                errors.push('Opacity must be between 0 and 1');
            }
        }
        if (!this.isValidColor(overlay.styling.color)) {
            errors.push('Invalid color format');
        }

        // Validate positioning
        if (overlay.positioning.z_index !== undefined && overlay.positioning.z_index < 0) {
            errors.push('Z-index cannot be negative');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Calculate position based on anchor and offsets
     */
    private calculatePosition(
        positioning: LyricOverlay['positioning'],
        videoWidth: number,
        videoHeight: number
    ): { x: string; y: string } {
        let x = '(w-text_w)/2'; // Center by default
        let y: string;

        // Calculate Y position based on anchor
        switch (positioning.anchor) {
            case 'top':
                y = '50';
                break;
            case 'center':
                y = '(h-text_h)/2';
                break;
            case 'bottom':
                y = 'h-100';
                break;
            case 'custom':
                y = positioning.offset_y?.toString() || '(h-text_h)/2';
                break;
            default:
                y = 'h-100';
        }

        // Apply offsets
        if (positioning.offset_x) {
            x = `(w-text_w)/2+${positioning.offset_x}`;
        }
        if (positioning.offset_y && positioning.anchor !== 'custom') {
            y = `${y}+${positioning.offset_y}`;
        }

        return { x, y };
    }

    /**
     * Convert hex color to FFmpeg format
     */
    private colorToFFmpeg(color: string, opacity: number = 1): string {
        // Remove # if present
        const hex = color.replace('#', '');
        
        // Convert to RGB
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // FFmpeg uses alpha channel (0-1)
        return `fontcolor=0x${hex}@${opacity}`;
    }

    /**
     * Convert hex color to ASS format (&HAABBGGRR)
     */
    private colorToASS(color: string, opacity: number = 1): string {
        const hex = color.replace('#', '');
        const r = hex.substr(0, 2);
        const g = hex.substr(2, 2);
        const b = hex.substr(4, 2);
        
        // ASS uses alpha 0-255 (00 = opaque, FF = transparent)
        const alpha = Math.round((1 - opacity) * 255).toString(16).padStart(2, '0');
        
        return `&H${alpha}${b}${g}${r}`;
    }

    /**
     * Add animation effects to drawtext parameters
     */
    private addAnimationEffects(
        params: string[],
        animation: LyricOverlay['animation'],
        timing: LyricOverlay['timing'],
        position: { x: string; y: string }
    ): string[] {
        const animatedParams = [...params];
        const duration = timing.line_disappear_time - timing.line_appear_time;
        const appearDuration = Math.min(0.5, duration / 4); // 0.5s or 25% of line duration

        // Appear animations
        switch (animation.appear_style) {
            case 'fade':
                // Fade in alpha from 0 to 1
                const alphaIndex = animatedParams.findIndex(p => p.startsWith('fontcolor='));
                if (alphaIndex >= 0) {
                    animatedParams[alphaIndex] = animatedParams[alphaIndex].replace(
                        /@[\d.]+/,
                        `@0.0+t/${appearDuration}`
                    );
                }
                break;

            case 'slide':
                // Slide up from below
                const yIndex = animatedParams.findIndex(p => p.startsWith('y='));
                if (yIndex >= 0) {
                    animatedParams[yIndex] = `y=${position.y}+50-50*min(1\\,t/${appearDuration})`;
                }
                break;

            case 'zoom':
                // Zoom in from small
                const sizeIndex = animatedParams.findIndex(p => p.startsWith('fontsize='));
                if (sizeIndex >= 0) {
                    const size = parseInt(animatedParams[sizeIndex].split('=')[1]);
                    animatedParams[sizeIndex] = `fontsize=${size}*min(1\\,t/${appearDuration})`;
                }
                break;

            case 'bounce':
                // Bounce effect using sine wave
                const bounceY = animatedParams.findIndex(p => p.startsWith('y='));
                if (bounceY >= 0) {
                    animatedParams[bounceY] = `y=${position.y}+20*sin(t*10)*max(0\\,1-t/${appearDuration})`;
                }
                break;

            case 'typewriter':
                // Progressively reveal text (simplified - full implementation needs text manipulation)
                // This is a stub - full typewriter effect requires text substring manipulation
                break;
        }

        return animatedParams;
    }

    /**
     * Generate ASS style definition
     */
    private generateASSStyle(styleName: string, overlay: LyricOverlay): string {
        const { styling, positioning } = overlay;

        // ASS alignment: 1=bottom-left, 2=bottom-center, 3=bottom-right, etc.
        let alignment = 2; // Default: bottom-center
        switch (positioning.anchor) {
            case 'top':
                alignment = 8; // Top-center
                break;
            case 'center':
                alignment = 5; // Middle-center
                break;
            case 'bottom':
                alignment = 2; // Bottom-center
                break;
        }

        const primaryColor = this.colorToASS(styling.color, styling.opacity);
        const outlineColor = styling.stroke_color 
            ? this.colorToASS(styling.stroke_color)
            : '&H00000000';

        const margin = Math.abs(positioning.offset_y || 80);

        return `Style: ${styleName},${styling.font_family},${styling.font_size},${primaryColor},${primaryColor},${outlineColor},&H00000000,0,0,0,0,100,100,0,0,1,${styling.stroke_width || 2},${styling.shadow ? 2 : 0},${alignment},10,10,${margin},1`;
    }

    /**
     * Generate ASS dialogue line with karaoke tags if enabled
     */
    private generateASSDialogue(overlay: LyricOverlay, styleName: string): string {
        const { text, timing, animation } = overlay;
        
        const start = this.formatASSTime(timing.line_appear_time);
        const end = this.formatASSTime(timing.line_disappear_time);

        let dialogueText = text;

        // Add karaoke tags if enabled
        if (animation.karaoke_highlight && timing.word_timestamps) {
            const words = text.split(/\s+/);
            const karaokeWords: string[] = [];

            words.forEach((word, index) => {
                const wordStart = timing.word_timestamps![index];
                const wordEnd = timing.word_timestamps![index + 1] || timing.line_disappear_time;
                const wordDuration = Math.round((wordEnd - wordStart) * 100); // Centiseconds

                karaokeWords.push(`{\\k${wordDuration}}${word}`);
            });

            dialogueText = karaokeWords.join(' ');
        }

        return `Dialogue: 0,${start},${end},${styleName},,0,0,0,,${dialogueText}`;
    }

    /**
     * Format time for ASS subtitle (H:MM:SS.CC)
     */
    private formatASSTime(seconds: number): string {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        const cs = Math.floor((seconds % 1) * 100);

        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
    }

    /**
     * Validate hex color format
     */
    private isValidColor(color: string): boolean {
        return /^#[0-9A-Fa-f]{6}$/.test(color);
    }

    /**
     * Get available preset names
     */
    static getPresetNames(): string[] {
        return Object.keys(ANIMATION_PRESETS);
    }

    /**
     * Get preset configuration
     */
    static getPresetConfig(presetName: string): typeof ANIMATION_PRESETS[keyof typeof ANIMATION_PRESETS] | null {
        return ANIMATION_PRESETS[presetName as keyof typeof ANIMATION_PRESETS] || null;
    }

    /**
     * Suggest preset based on song mood
     */
    suggestPresetForMood(mood: string[]): keyof typeof ANIMATION_PRESETS {
        const moodLower = mood.map(m => m.toLowerCase()).join(' ');

        if (moodLower.includes('energetic') || moodLower.includes('upbeat') || moodLower.includes('intense')) {
            return 'energetic';
        } else if (moodLower.includes('emotional') || moodLower.includes('dramatic') || moodLower.includes('cinematic')) {
            return 'cinematic';
        } else if (moodLower.includes('minimal') || moodLower.includes('ambient') || moodLower.includes('atmospheric')) {
            return 'minimal';
        } else if (moodLower.includes('storytelling') || moodLower.includes('narrative')) {
            return 'storytelling';
        } else {
            return 'karaoke'; // Default
        }
    }
}

// Export singleton instance
export const lyricAnimationService = new LyricAnimationService();