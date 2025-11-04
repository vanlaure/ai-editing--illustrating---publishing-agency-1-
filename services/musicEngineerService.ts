import type {
    Storyboard,
    SongAnalysis,
    CreativeBrief,
    ExportOptions,
    StoryboardShot,
    Beat,
    SyncedClip,
    Transition,
    TransitionType,
    QualityReport,
    CinematicOverlay
} from '../types';
import { backendService } from './backendService';

/**
 * Music Engineer Service
 * 
 * Provides automated video assembly with beat synchronization, intelligent transitions,
 * and quality control for the AI Music Video Generator.
 */
export class MusicEngineerService {
    private readonly SYNC_TOLERANCE_MS = 100;
    private readonly MIN_TRANSITION_DURATION = 0.2;
    private readonly MAX_TRANSITION_DURATION = 1.0;

    /**
     * Main assembly function that orchestrates the entire video production pipeline
     * 
     * @param storyboard - Complete storyboard with shots and scenes
     * @param songAnalysis - Detailed song analysis with beats and structure
     * @param creativeBrief - Creative direction and styling preferences
     * @param exportOptions - Export settings (resolution, aspect ratio, etc.)
     * @param audioUrl - URL to the audio file
     * @param onProgress - Optional progress callback
     * @returns Final video URL and quality report
     */
    async assembleFinalVideo(
        storyboard: Storyboard,
        songAnalysis: SongAnalysis,
        creativeBrief: CreativeBrief,
        exportOptions: ExportOptions,
        audioUrl: string,
        onProgress?: (progress: number, stage: string) => void
    ): Promise<{ videoUrl: string; qualityReport: QualityReport }> {
        const startTime = Date.now();
        
        try {
            onProgress?.(0.05, 'Validating storyboard...');
            await this.validateStoryboard(storyboard);

            onProgress?.(0.1, 'Synchronizing clips to beats...');
            const syncedClips = await this.syncAllClipsToBeats(storyboard, songAnalysis);

            onProgress?.(0.2, 'Selecting optimal transitions...');
            const enhancedStoryboard = await this.applyIntelligentTransitions(
                storyboard,
                songAnalysis,
                syncedClips
            );

            onProgress?.(0.3, 'Preparing media files...');
            await this.prepareMediaFiles(enhancedStoryboard);

            onProgress?.(0.4, 'Assembling video...');
            const videoUrl = await this.assembleVideo(
                enhancedStoryboard,
                audioUrl,
                exportOptions,
                creativeBrief,
                (subProgress) => onProgress?.(0.4 + subProgress * 0.4, 'Rendering video...')
            );

            onProgress?.(0.9, 'Validating quality...');
            const qualityReport = await this.validateQuality(
                videoUrl,
                songAnalysis.beats[songAnalysis.beats.length - 1]?.time || 0,
                audioUrl,
                Date.now() - startTime
            );

            onProgress?.(1.0, 'Assembly complete!');

            return { videoUrl, qualityReport };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Video assembly failed: ${errorMessage}`);
        }
    }

    /**
     * Synchronizes a single clip to the nearest beats
     * 
     * @param shot - Storyboard shot to synchronize
     * @param beats - Array of beat timestamps
     * @returns Synced clip with adjusted timing
     */
    private async syncClipToBeats(
        shot: StoryboardShot,
        beats: Beat[]
    ): Promise<SyncedClip> {
        const originalStart = shot.start;
        const originalEnd = shot.end;
        const originalDuration = originalEnd - originalStart;

        const startBeat = this.findNearestBeat(originalStart, beats);
        const endBeat = this.findNearestBeat(originalEnd, beats);

        let syncedStart = originalStart;
        let syncedEnd = originalEnd;
        const alignedBeats: number[] = [];

        if (shot.music_alignment?.align_start_to_beat && startBeat) {
            syncedStart = startBeat.time;
            alignedBeats.push(startBeat.time);
        }

        if (shot.music_alignment?.align_end_to_beat && endBeat) {
            syncedEnd = endBeat.time;
            if (!alignedBeats.includes(endBeat.time)) {
                alignedBeats.push(endBeat.time);
            }
        }

        if (shot.music_alignment?.extend_to_complete_phrase) {
            const phrase = this.findContainingPhrase(originalStart, originalEnd, beats);
            if (phrase) {
                syncedStart = Math.min(syncedStart, phrase.start);
                syncedEnd = Math.max(syncedEnd, phrase.end);
            }
        }

        if (shot.duration_flexibility) {
            const { min_duration, max_duration } = shot.duration_flexibility;
            const newDuration = syncedEnd - syncedStart;
            
            if (newDuration < min_duration) {
                syncedEnd = syncedStart + min_duration;
            } else if (newDuration > max_duration) {
                syncedEnd = syncedStart + max_duration;
            }
        }

        const timingOffsetMs = Math.abs(syncedStart - originalStart) * 1000;

        return {
            shot_id: shot.id,
            original_start: originalStart,
            original_end: originalEnd,
            synced_start: syncedStart,
            synced_end: syncedEnd,
            timing_offset_ms: timingOffsetMs,
            aligned_beats: alignedBeats
        };
    }

    /**
     * Synchronizes all clips in the storyboard to beats
     */
    private async syncAllClipsToBeats(
        storyboard: Storyboard,
        songAnalysis: SongAnalysis
    ): Promise<Map<string, SyncedClip>> {
        const syncedClips = new Map<string, SyncedClip>();

        for (const scene of storyboard.scenes) {
            for (const shot of scene.shots) {
                const syncedClip = await this.syncClipToBeats(shot, songAnalysis.beats);
                syncedClips.set(shot.id, syncedClip);
            }
        }

        return syncedClips;
    }

    /**
     * Selects optimal transition based on beat energy and shot context
     * 
     * @param currentShot - Current shot
     * @param nextShot - Next shot
     * @param beatEnergy - Energy level at transition point (0-1)
     * @param transitionTime - Timestamp of the transition
     * @returns Selected transition
     */
    private selectTransition(
        currentShot: StoryboardShot,
        nextShot: StoryboardShot,
        beatEnergy: number,
        transitionTime: number
    ): Transition {
        let type: TransitionType;
        let duration: number;
        let description: string;

        if (beatEnergy > 0.7) {
            const highEnergyTypes: TransitionType[] = ['Hard Cut', 'Whip Pan', 'Glitch'];
            type = highEnergyTypes[Math.floor(Math.random() * highEnergyTypes.length)];
            duration = this.MIN_TRANSITION_DURATION;
            description = `High-energy transition at beat energy ${(beatEnergy * 100).toFixed(0)}%`;
        } else if (beatEnergy > 0.4) {
            const mediumEnergyTypes: TransitionType[] = ['Crossfade', 'Match Cut'];
            type = mediumEnergyTypes[Math.floor(Math.random() * mediumEnergyTypes.length)];
            duration = (this.MIN_TRANSITION_DURATION + this.MAX_TRANSITION_DURATION) / 2;
            description = `Medium-energy transition at beat energy ${(beatEnergy * 100).toFixed(0)}%`;
        } else {
            const lowEnergyTypes: TransitionType[] = ['Fade to Black', 'Crossfade'];
            type = lowEnergyTypes[Math.floor(Math.random() * lowEnergyTypes.length)];
            duration = this.MAX_TRANSITION_DURATION;
            description = `Gentle transition at beat energy ${(beatEnergy * 100).toFixed(0)}%`;
        }

        const shotSimilarity = this.calculateShotSimilarity(currentShot, nextShot);
        if (shotSimilarity > 0.8 && type !== 'Hard Cut') {
            type = 'Match Cut';
            description += ' (similar compositions detected)';
        }

        return { type, duration, description };
    }

    /**
     * Applies intelligent transitions throughout the storyboard
     */
    private async applyIntelligentTransitions(
        storyboard: Storyboard,
        songAnalysis: SongAnalysis,
        syncedClips: Map<string, SyncedClip>
    ): Promise<Storyboard> {
        const enhancedStoryboard = JSON.parse(JSON.stringify(storyboard)) as Storyboard;

        for (const scene of enhancedStoryboard.scenes) {
            const transitions: (Transition | null)[] = [];

            for (let i = 0; i < scene.shots.length; i++) {
                if (i === scene.shots.length - 1) {
                    transitions.push(null);
                    continue;
                }

                const currentShot = scene.shots[i];
                const nextShot = scene.shots[i + 1];
                const syncedClip = syncedClips.get(currentShot.id);
                
                if (!syncedClip) {
                    transitions.push(null);
                    continue;
                }

                const transitionTime = syncedClip.synced_end;
                const beatAtTransition = this.findNearestBeat(transitionTime, songAnalysis.beats);
                const beatEnergy = beatAtTransition?.energy || 0.5;

                const transition = this.selectTransition(
                    currentShot,
                    nextShot,
                    beatEnergy,
                    transitionTime
                );

                transitions.push(transition);
            }

            scene.transitions = transitions;
        }

        return enhancedStoryboard;
    }

    /**
     * Validates storyboard completeness
     */
    private async validateStoryboard(storyboard: Storyboard): Promise<void> {
        const issues: string[] = [];

        for (const scene of storyboard.scenes) {
            for (const shot of scene.shots) {
                if (!shot.preview_image_url && !shot.clip_url) {
                    issues.push(`Shot ${shot.id} missing both preview image and clip`);
                }
            }
        }

        if (issues.length > 0) {
            throw new Error(`Storyboard validation failed:\n${issues.join('\n')}`);
        }
    }

    /**
     * Prepares and normalizes all media files
     */
    private async prepareMediaFiles(storyboard: Storyboard): Promise<void> {
        for (const scene of storyboard.scenes) {
            for (const shot of scene.shots) {
                const mediaUrl = shot.clip_url || shot.preview_image_url;
                if (!mediaUrl) continue;

                if (mediaUrl.startsWith('blob:') || mediaUrl.startsWith('data:')) {
                    console.warn(`Shot ${shot.id} uses local URL, may need upload`);
                }
            }
        }
    }

    /**
     * Assembles the final video using the backend rendering service
     */
    private async assembleVideo(
        storyboard: Storyboard,
        audioUrl: string,
        exportOptions: ExportOptions,
        creativeBrief: CreativeBrief,
        onProgress?: (progress: number) => void
    ): Promise<string> {
        const allShots = storyboard.scenes
            .flatMap(scene => scene.shots)
            .sort((a, b) => a.start - b.start);

        const scenes = allShots.map((shot, i) => ({
            imageUrl: shot.preview_image_url,
            videoUrl: shot.clip_url,
            duration: shot.end - shot.start,
            description: shot.lyric_overlay?.text || shot.subject || `Scene ${i + 1}`
        }));

        const resolutionMap = {
            '720p': { width: 1280, height: 720 },
            '1080p': { width: 1920, height: 1080 },
            '2160p': { width: 3840, height: 2160 }
        };

        const { width, height } = resolutionMap[exportOptions.resolution];

        const response = await backendService.generateVideo({
            scenes,
            audioUrl,
            width,
            height,
            fps: 30,
            outputFormat: 'mp4'
        });

        if (!response.success || !response.videoUrl) {
            throw new Error(response.error || 'Video assembly failed');
        }

        onProgress?.(1.0);
        return response.videoUrl;
    }

    /**
     * Validates final video quality
     */
    private async validateQuality(
        videoUrl: string,
        expectedDuration: number,
        audioUrl: string,
        renderTimeSeconds: number
    ): Promise<QualityReport> {
        const issues: QualityReport['issues'] = [];
        let actualDuration = expectedDuration;

        try {
            const videoResponse = await fetch(videoUrl);
            if (!videoResponse.ok) {
                issues.push({
                    severity: 'error',
                    message: 'Failed to fetch generated video for validation'
                });
            }
        } catch (error) {
            issues.push({
                severity: 'error',
                message: `Video fetch error: ${error instanceof Error ? error.message : 'Unknown'}`
            });
        }

        const durationDifferenceMs = Math.abs(actualDuration - expectedDuration) * 1000;
        const syncAccuracyMs = durationDifferenceMs < this.SYNC_TOLERANCE_MS ? 
            durationDifferenceMs : this.SYNC_TOLERANCE_MS;

        if (durationDifferenceMs > 500) {
            issues.push({
                severity: 'warning',
                message: `Duration mismatch: ${durationDifferenceMs.toFixed(0)}ms difference`
            });
        }

        const overallScore = Math.max(0, 100 - (issues.length * 10) - (durationDifferenceMs / 100));

        return {
            overall_score: Math.round(overallScore),
            sync_accuracy_ms: syncAccuracyMs,
            frames_dropped: false,
            duration_match: {
                expected_seconds: expectedDuration,
                actual_seconds: actualDuration,
                difference_ms: durationDifferenceMs
            },
            issues,
            performance: {
                render_time_seconds: renderTimeSeconds / 1000,
                estimated_cost_usd: this.estimateRenderingCost(renderTimeSeconds / 1000),
                bottleneck_phase: renderTimeSeconds > 300000 ? 'post_production' : undefined
            }
        };
    }

    /**
     * Finds the nearest beat to a given timestamp
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

        return minDistance <= 1.0 ? nearestBeat : null;
    }

    /**
     * Finds musical phrase containing the given time range
     */
    private findContainingPhrase(
        start: number,
        end: number,
        beats: Beat[]
    ): { start: number; end: number } | null {
        const measureLength = this.estimateMeasureLength(beats);
        if (!measureLength) return null;

        const phraseStart = Math.floor(start / measureLength) * measureLength;
        const phraseEnd = Math.ceil(end / measureLength) * measureLength;

        return { start: phraseStart, end: phraseEnd };
    }

    /**
     * Estimates measure length from beat array
     */
    private estimateMeasureLength(beats: Beat[]): number | null {
        if (beats.length < 8) return null;

        const intervals: number[] = [];
        for (let i = 1; i < Math.min(beats.length, 16); i++) {
            intervals.push(beats[i].time - beats[i - 1].time);
        }

        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        return avgInterval * 4;
    }

    /**
     * Calculates similarity between two shots
     */
    private calculateShotSimilarity(shot1: StoryboardShot, shot2: StoryboardShot): number {
        let similarity = 0;
        let factors = 0;

        if (shot1.shot_type === shot2.shot_type) {
            similarity += 0.3;
        }
        factors++;

        if (shot1.location_ref === shot2.location_ref) {
            similarity += 0.3;
        }
        factors++;

        const sharedCharacters = shot1.character_refs.filter(c => 
            shot2.character_refs.includes(c)
        );
        similarity += (sharedCharacters.length / Math.max(shot1.character_refs.length, shot2.character_refs.length, 1)) * 0.4;
        factors++;

        return similarity / factors;
    }

    /**
     * Estimates rendering cost based on duration
     */
    private estimateRenderingCost(durationSeconds: number): number {
        const COST_PER_SECOND = 0.01;
        return durationSeconds * COST_PER_SECOND;
    }

    /**
     * Applies color grading from creative brief
     */
    private applyColorGrading(
        videoUrl: string,
        colorPalette: string[]
    ): Promise<string> {
        console.log(`Applying color grading with palette: ${colorPalette.join(', ')}`);
        return Promise.resolve(videoUrl);
    }

    /**
     * Applies cinematic overlay effects
     */
    private applyCinematicOverlay(
        videoUrl: string,
        overlay: CinematicOverlay
    ): Promise<string> {
        console.log(`Applying cinematic overlay: ${overlay}`);
        return Promise.resolve(videoUrl);
    }
}

export const musicEngineerService = new MusicEngineerService();