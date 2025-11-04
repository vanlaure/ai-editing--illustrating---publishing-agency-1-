/**
 * Duration Adjustment Service - Phase 7
 * 
 * Dynamically adjusts shot durations based on musical phrasing, ensuring shots align
 * with the natural flow of the music. This service:
 * - Extends shots to complete lyric phrases
 * - Aligns shot boundaries to musical measures and phrases
 * - Respects minimum/maximum duration constraints
 * - Considers energy curves for pacing
 * - Uses enhanced beat detection data from Phase 3
 */

import {
    StoryboardShot,
    Storyboard,
    StoryboardScene,
    EnhancedSongAnalysis,
    Beat,
    DurationFlexibility,
    MusicAlignment
} from '../types';

/**
 * Report generated after duration optimization
 */
export interface DurationAdjustmentReport {
    total_shots_adjusted: number;
    average_alignment_score: number; // 0-1
    constraint_violations: string[];
    timing_improvements: {
        shot_id: string;
        original_duration: number;
        adjusted_duration: number;
        reason: string;
        alignment_score_improvement: number;
    }[];
}

/**
 * Musical phrase from song analysis
 */
interface MusicalPhrase {
    start_time: number;
    end_time: number;
    type: 'verse' | 'chorus' | 'bridge' | 'pre-chorus' | 'outro' | 'intro';
}

/**
 * Duration Adjustment Service
 * 
 * Provides intelligent duration adjustment that aligns shots with musical structure
 */
export class DurationAdjustmentService {
    private readonly BEAT_ALIGNMENT_TOLERANCE = 0.05; // 50ms tolerance for beat alignment
    private readonly PHRASE_ALIGNMENT_TOLERANCE = 0.1; // 100ms tolerance for phrase alignment
    
    /**
     * Adjust single shot duration based on musical context
     * 
     * @param shot - Shot to adjust
     * @param songAnalysis - Enhanced song analysis with beats, phrases, energy curve
     * @param lyrics - Optional lyrics for phrase completion
     * @returns Adjusted shot with optimized duration
     */
    adjustShotDuration(
        shot: StoryboardShot,
        songAnalysis: EnhancedSongAnalysis,
        lyrics?: string
    ): StoryboardShot {
        const originalDuration = shot.end - shot.start;
        let adjustedDuration = this.calculateOptimalDuration(shot, songAnalysis, lyrics);
        
        // Validate constraints
        const validation = this.validateDurationConstraints(shot);
        if (!validation.valid) {
            console.warn(`Duration constraint issues for shot ${shot.id}:`, validation.warnings);
        }
        
        // Apply energy-based pacing if energy curve available
        if (songAnalysis.energy_curve) {
            const energyAtShot = this.getEnergyAtTime(shot.start, songAnalysis.energy_curve);
            adjustedDuration = this.adjustForEnergy(adjustedDuration, energyAtShot);
        }
        
        // Clamp to constraints
        const minDur = shot.duration_flexibility?.min_duration || 0.5;
        const maxDur = shot.duration_flexibility?.max_duration || 10;
        adjustedDuration = Math.max(minDur, Math.min(maxDur, adjustedDuration));
        
        return {
            ...shot,
            end: shot.start + adjustedDuration
        };
    }
    
    /**
     * Optimize entire storyboard timing
     * 
     * @param storyboard - Complete storyboard to optimize
     * @param songAnalysis - Enhanced song analysis
     * @returns Optimized storyboard and adjustment report
     */
    optimizeStoryboardTiming(
        storyboard: Storyboard,
        songAnalysis: EnhancedSongAnalysis
    ): {
        optimizedStoryboard: Storyboard;
        adjustmentReport: DurationAdjustmentReport;
    } {
        const report: DurationAdjustmentReport = {
            total_shots_adjusted: 0,
            average_alignment_score: 0,
            constraint_violations: [],
            timing_improvements: []
        };
        
        let totalAlignmentScore = 0;
        let shotCount = 0;
        
        // Process each scene and shot
        const optimizedScenes: StoryboardScene[] = [];
        
        for (const scene of storyboard.scenes) {
            const optimizedShots: StoryboardShot[] = [];
            let currentTime = scene.start;
            
            for (const shot of scene.shots) {
                // Calculate original alignment score
                const originalScore = this.calculateAlignmentScore(shot, songAnalysis);
                
                // Create adjusted shot with new start time
                const adjustedShot: StoryboardShot = {
                    ...shot,
                    start: currentTime
                };
                
                // Adjust duration
                const optimized = this.adjustShotDuration(adjustedShot, songAnalysis);
                
                // Calculate new alignment score
                const newScore = this.calculateAlignmentScore(optimized, songAnalysis);
                
                // Record improvement if significant
                const originalDuration = shot.end - shot.start;
                const adjustedDuration = optimized.end - optimized.start;
                
                if (Math.abs(adjustedDuration - originalDuration) > 0.01) {
                    report.total_shots_adjusted++;
                    report.timing_improvements.push({
                        shot_id: shot.id,
                        original_duration: originalDuration,
                        adjusted_duration: adjustedDuration,
                        reason: this.determineAdjustmentReason(optimized, songAnalysis),
                        alignment_score_improvement: newScore - originalScore
                    });
                }
                
                // Validate constraints
                const validation = this.validateDurationConstraints(optimized);
                if (!validation.valid) {
                    report.constraint_violations.push(
                        ...validation.warnings.map(w => `Shot ${shot.id}: ${w}`)
                    );
                }
                
                totalAlignmentScore += newScore;
                shotCount++;
                
                optimizedShots.push(optimized);
                currentTime = optimized.end;
            }
            
            // Update scene timing
            const optimizedScene: StoryboardScene = {
                ...scene,
                shots: optimizedShots,
                start: optimizedShots[0]?.start || scene.start,
                end: optimizedShots[optimizedShots.length - 1]?.end || scene.end
            };
            
            optimizedScenes.push(optimizedScene);
        }
        
        // Calculate average alignment score
        report.average_alignment_score = shotCount > 0 ? totalAlignmentScore / shotCount : 0;
        
        const optimizedStoryboard: Storyboard = {
            ...storyboard,
            scenes: optimizedScenes
        };
        
        return { optimizedStoryboard, adjustmentReport: report };
    }
    
    /**
     * Calculate optimal duration for shot based on musical context
     * 
     * @param shot - Shot to analyze
     * @param songAnalysis - Enhanced song analysis
     * @param lyrics - Optional lyrics for phrase completion
     * @returns Optimal duration in seconds
     */
    calculateOptimalDuration(
        shot: StoryboardShot,
        songAnalysis: EnhancedSongAnalysis,
        lyrics?: string
    ): number {
        // Start with preferred duration
        let duration = shot.duration_flexibility?.preferred_duration || (shot.end - shot.start);
        
        // Convert phrases to MusicalPhrase format
        const phrases = this.convertToMusicalPhrases(songAnalysis);
        
        // If music alignment enabled, adjust to phrase boundaries
        if (shot.music_alignment?.extend_to_complete_phrase && phrases.length > 0) {
            const containingPhrase = this.findContainingPhrase(shot.end, phrases);
            if (containingPhrase) {
                duration = containingPhrase.end_time - shot.start;
            }
        }
        
        // If lyrics present and incomplete, extend
        if (lyrics && shot.music_alignment?.extend_to_complete_phrase) {
            const phraseEndTime = this.findLyricPhraseEnd(shot.end, lyrics, songAnalysis);
            duration = Math.max(duration, phraseEndTime - shot.start);
        }
        
        // Align end to nearest beat if requested
        if (shot.music_alignment?.align_end_to_beat && songAnalysis.beats.length > 0) {
            const nearestBeat = this.findNearestBeat(shot.start + duration, songAnalysis.beats);
            if (nearestBeat) {
                duration = nearestBeat.time - shot.start;
            }
        }
        
        // Align start to nearest beat if requested
        if (shot.music_alignment?.align_start_to_beat && songAnalysis.beats.length > 0) {
            const nearestStartBeat = this.findNearestBeat(shot.start, songAnalysis.beats);
            if (nearestStartBeat) {
                // Adjust duration to maintain end time or align to beat
                const originalEnd = shot.start + duration;
                const newStart = nearestStartBeat.time;
                duration = originalEnd - newStart;
            }
        }
        
        // Align to measures if available
        if (songAnalysis.measures && songAnalysis.measures.length > 0) {
            duration = this.alignToMeasures(shot.start, duration, songAnalysis.measures);
        }
        
        return duration;
    }
    
    /**
     * Find nearest musical phrase boundary
     * 
     * @param time - Time in seconds
     * @param phrases - Array of musical phrases
     * @param direction - Search direction ('before' or 'after')
     * @returns Nearest phrase boundary time
     */
    findNearestPhraseBoundary(
        time: number,
        phrases: MusicalPhrase[],
        direction: 'before' | 'after'
    ): number {
        if (phrases.length === 0) return time;
        
        if (direction === 'after') {
            // Find next phrase end after time
            const nextPhrase = phrases.find(p => p.end_time > time);
            return nextPhrase?.end_time || time;
        } else {
            // Find previous phrase start before time
            const prevPhrase = [...phrases].reverse().find(p => p.start_time < time);
            return prevPhrase?.start_time || time;
        }
    }
    
    /**
     * Calculate alignment score for a shot
     * 
     * @param shot - Shot to evaluate
     * @param songAnalysis - Enhanced song analysis
     * @returns Alignment score (0-1, higher is better)
     */
    calculateAlignmentScore(
        shot: StoryboardShot,
        songAnalysis: EnhancedSongAnalysis
    ): number {
        let score = 0;
        let maxScore = 0;
        
        // Start alignment (40% weight)
        maxScore += 0.4;
        if (songAnalysis.beats.length > 0) {
            const startBeat = this.findNearestBeat(shot.start, songAnalysis.beats);
            if (startBeat) {
                const startOffset = Math.abs(shot.start - startBeat.time);
                if (startOffset < this.BEAT_ALIGNMENT_TOLERANCE) {
                    score += 0.4;
                } else if (startOffset < this.BEAT_ALIGNMENT_TOLERANCE * 2) {
                    score += 0.2;
                }
            }
        }
        
        // End alignment (40% weight)
        maxScore += 0.4;
        if (songAnalysis.beats.length > 0) {
            const endBeat = this.findNearestBeat(shot.end, songAnalysis.beats);
            if (endBeat) {
                const endOffset = Math.abs(shot.end - endBeat.time);
                if (endOffset < this.BEAT_ALIGNMENT_TOLERANCE) {
                    score += 0.4;
                } else if (endOffset < this.BEAT_ALIGNMENT_TOLERANCE * 2) {
                    score += 0.2;
                }
            }
        }
        
        // Phrase completion (20% weight)
        maxScore += 0.2;
        const phrases = this.convertToMusicalPhrases(songAnalysis);
        if (phrases.length > 0) {
            const phrase = this.findContainingPhrase(shot.end, phrases);
            if (phrase && Math.abs(shot.end - phrase.end_time) < this.PHRASE_ALIGNMENT_TOLERANCE) {
                score += 0.2;
            }
        }
        
        return maxScore > 0 ? score / maxScore : 0;
    }
    
    /**
     * Validate duration constraints
     * 
     * @param shot - Shot to validate
     * @returns Validation result with warnings
     */
    validateDurationConstraints(
        shot: StoryboardShot
    ): { valid: boolean; warnings: string[] } {
        const warnings: string[] = [];
        const duration = shot.end - shot.start;
        
        if (shot.duration_flexibility) {
            const { min_duration, max_duration, preferred_duration } = shot.duration_flexibility;
            
            if (duration < min_duration) {
                warnings.push(
                    `Duration ${duration.toFixed(2)}s is below minimum ${min_duration}s`
                );
            }
            
            if (duration > max_duration) {
                warnings.push(
                    `Duration ${duration.toFixed(2)}s exceeds maximum ${max_duration}s`
                );
            }
            
            if (min_duration > max_duration) {
                warnings.push(
                    `Invalid constraints: min_duration (${min_duration}) > max_duration (${max_duration})`
                );
            }
            
            // Warn if deviation from preferred is significant
            const deviation = Math.abs(duration - preferred_duration);
            if (deviation > preferred_duration * 0.3) {
                warnings.push(
                    `Duration deviates ${(deviation / preferred_duration * 100).toFixed(1)}% from preferred`
                );
            }
        }
        
        // Basic duration sanity checks
        if (duration < 0.1) {
            warnings.push(`Duration ${duration.toFixed(3)}s is too short (< 0.1s)`);
        }
        
        if (duration > 30) {
            warnings.push(`Duration ${duration.toFixed(1)}s is unusually long (> 30s)`);
        }
        
        return {
            valid: warnings.length === 0,
            warnings
        };
    }
    
    /**
     * Find nearest beat to a given time
     * 
     * @param time - Time in seconds
     * @param beats - Array of beats
     * @returns Nearest beat or null
     */
    private findNearestBeat(time: number, beats: Beat[]): Beat | null {
        if (beats.length === 0) return null;
        
        let nearestBeat = beats[0];
        let minDistance = Math.abs(beats[0].time - time);
        
        for (const beat of beats) {
            const distance = Math.abs(beat.time - time);
            if (distance < minDistance) {
                minDistance = distance;
                nearestBeat = beat;
            }
        }
        
        return nearestBeat;
    }
    
    /**
     * Find phrase containing the given time
     * 
     * @param time - Time in seconds
     * @param phrases - Array of musical phrases
     * @returns Containing phrase or null
     */
    private findContainingPhrase(time: number, phrases: MusicalPhrase[]): MusicalPhrase | null {
        return phrases.find(phrase => 
            time >= phrase.start_time && time <= phrase.end_time
        ) || null;
    }
    
    /**
     * Find lyric phrase end time
     * 
     * @param time - Current time in seconds
     * @param lyrics - Song lyrics
     * @param songAnalysis - Song analysis for timing
     * @returns Phrase end time
     */
    private findLyricPhraseEnd(
        time: number,
        lyrics: string,
        songAnalysis: EnhancedSongAnalysis
    ): number {
        // Find the containing song structure section
        const section = songAnalysis.structure.find(s => 
            time >= s.start && time <= s.end
        );
        
        if (section) {
            // Extend to end of section
            return section.end;
        }
        
        // Fallback: extend by typical lyric phrase length (4-8 seconds)
        return time + 6;
    }
    
    /**
     * Adjust duration based on energy level
     * 
     * @param duration - Original duration
     * @param energyLevel - Energy level (0-1)
     * @returns Adjusted duration
     */
    private adjustForEnergy(duration: number, energyLevel: number): number {
        // High energy (>0.7): prefer shorter shots (0.8x multiplier)
        // Medium energy (0.4-0.7): no adjustment
        // Low energy (<0.4): prefer longer shots (1.2x multiplier)
        
        if (energyLevel > 0.7) {
            return duration * 0.8;
        } else if (energyLevel < 0.4) {
            return duration * 1.2;
        }
        return duration;
    }
    
    /**
     * Get energy level at specific time
     * 
     * @param time - Time in seconds
     * @param energyCurve - Energy curve data
     * @returns Energy level (0-1)
     */
    private getEnergyAtTime(
        time: number,
        energyCurve: { time: number; energy: number }[]
    ): number {
        if (energyCurve.length === 0) return 0.5; // Default medium energy
        
        // Find surrounding energy points
        let before = energyCurve[0];
        let after = energyCurve[energyCurve.length - 1];
        
        for (let i = 0; i < energyCurve.length - 1; i++) {
            if (energyCurve[i].time <= time && energyCurve[i + 1].time >= time) {
                before = energyCurve[i];
                after = energyCurve[i + 1];
                break;
            }
        }
        
        // Linear interpolation
        if (after.time === before.time) return before.energy;
        
        const t = (time - before.time) / (after.time - before.time);
        return before.energy + t * (after.energy - before.energy);
    }
    
    /**
     * Align duration to musical measures
     * 
     * @param startTime - Shot start time
     * @param duration - Current duration
     * @param measures - Musical measures
     * @returns Adjusted duration aligned to measure boundaries
     */
    private alignToMeasures(
        startTime: number,
        duration: number,
        measures: { time: number; bar_number: number }[]
    ): number {
        const endTime = startTime + duration;
        
        // Find nearest measure boundary after end time
        const nearestMeasure = measures.find(m => m.time >= endTime);
        
        if (nearestMeasure) {
            const measureOffset = Math.abs(nearestMeasure.time - endTime);
            
            // If within tolerance, extend to measure boundary
            if (measureOffset < 0.5) {
                return nearestMeasure.time - startTime;
            }
        }
        
        return duration;
    }
    
    /**
     * Convert EnhancedSongAnalysis phrases to MusicalPhrase format
     * 
     * @param songAnalysis - Enhanced song analysis
     * @returns Array of MusicalPhrase
     */
    private convertToMusicalPhrases(songAnalysis: EnhancedSongAnalysis): MusicalPhrase[] {
        if (!songAnalysis.phrases) return [];
        
        return songAnalysis.phrases.map(p => ({
            start_time: p.start,
            end_time: p.end,
            type: p.type
        }));
    }
    
    /**
     * Determine reason for duration adjustment
     * 
     * @param shot - Adjusted shot
     * @param songAnalysis - Song analysis
     * @returns Human-readable reason
     */
    private determineAdjustmentReason(
        shot: StoryboardShot,
        songAnalysis: EnhancedSongAnalysis
    ): string {
        const reasons: string[] = [];
        
        if (shot.music_alignment?.extend_to_complete_phrase) {
            reasons.push('Musical phrase alignment');
        }
        
        if (shot.music_alignment?.align_end_to_beat) {
            reasons.push('Beat synchronization');
        }
        
        if (songAnalysis.energy_curve) {
            const energy = this.getEnergyAtTime(shot.start, songAnalysis.energy_curve);
            if (energy > 0.7) {
                reasons.push('High-energy pacing');
            } else if (energy < 0.4) {
                reasons.push('Low-energy contemplation');
            }
        }
        
        if (reasons.length === 0) {
            reasons.push('Duration optimization');
        }
        
        return reasons.join(', ');
    }
}

/**
 * Create a default DurationAdjustmentService instance
 */
export const durationAdjustmentService = new DurationAdjustmentService();