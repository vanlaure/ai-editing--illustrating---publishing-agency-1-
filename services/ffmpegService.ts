import type { Storyboard, ExportOptions, IntroOverlayConfig, OutroOverlayConfig } from '../types';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { backendService } from './backendService';
import type { Scene } from './backendService';

let ffmpeg: FFmpeg | null = null;
let ffmpegLoaded = false;
let ffmpegLoading = false;
let useBackend = true;

// Add a function to check if FFmpeg libraries are available
export const isFFmpegAvailable = (): boolean => {
    return ffmpeg !== null && ffmpegLoaded;
};

// Add a function to wait for FFmpeg to be available
export const waitForFFmpeg = async (timeout = 30000): Promise<boolean> => {
    if (isFFmpegAvailable()) {
        console.log('FFmpeg libraries are already available');
        return true;
    }

    // If already loading, wait for it
    if (ffmpegLoading) {
        console.log('FFmpeg is already loading, waiting...');
        const startWait = Date.now();
        while (ffmpegLoading && Date.now() - startWait < timeout) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return isFFmpegAvailable();
    }

    console.log('Loading FFmpeg libraries from npm packages...');
    const startTime = Date.now();
    
    try {
        ffmpegLoading = true;
        const loadPromise = loadFFmpeg((msg) => console.log(msg));
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('FFmpeg load timeout')), timeout)
        );
        
        await Promise.race([loadPromise, timeoutPromise]);
        const elapsed = Date.now() - startTime;
        console.log(`FFmpeg libraries loaded successfully after ${elapsed}ms`);
        return true;
    } catch (error) {
        const elapsed = Date.now() - startTime;
        console.error(`FFmpeg libraries failed to load after ${elapsed}ms:`, error);
        return false;
    } finally {
        ffmpegLoading = false;
    }
};

const loadFFmpeg = async (progressCallback: (message: string) => void) => {
    if (ffmpegLoaded) return ffmpeg;

    progressCallback('Loading FFmpeg Core...');
    ffmpeg = new FFmpeg();

    ffmpeg.on('log', ({ message }: { message: string }) => {
        console.log('[FFmpeg]', message);
    });

    progressCallback('Fetching FFmpeg WASM files from CDN...');
    const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd';
    
    try {
        const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
        progressCallback('Core JS loaded, fetching WASM...');
        
        const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');
        progressCallback('WASM loaded, initializing FFmpeg...');
        
        await ffmpeg.load({ coreURL, wasmURL });
        progressCallback('FFmpeg initialized successfully');
        
        ffmpegLoaded = true;
        return ffmpeg;
    } catch (error) {
        console.error('Error loading FFmpeg:', error);
        ffmpegLoading = false;
        throw error;
    }
};

export function generateIntroOverlayFilter(config: IntroOverlayConfig): string {
    const { song_title, artist_name, custom_text, style, animation, duration } = config;
    
    const styleConfig = {
        minimal: {
            titleSize: 72,
            artistSize: 48,
            titleColor: 'white',
            artistColor: 'gray',
        },
        cinematic: {
            titleSize: 96,
            artistSize: 64,
            titleColor: 'gold',
            artistColor: 'white',
        },
        glitch: {
            titleSize: 84,
            artistSize: 56,
            titleColor: 'cyan',
            artistColor: 'magenta',
        },
        neon: {
            titleSize: 88,
            artistSize: 60,
            titleColor: '#FF00FF',
            artistColor: '#00FFFF',
        },
        elegant: {
            titleSize: 80,
            artistSize: 52,
            titleColor: '#F5F5DC',
            artistColor: '#D3D3D3',
        }
    }[style];
    
    const fadeInDuration = duration * 0.3;
    const fadeOutStart = duration * 0.7;
    const fadeOutDuration = duration * 0.3;
    
    const escapedTitle = song_title.replace(/'/g, "'\\\\\\\\\\'\\'").replace(/:/g, '\\:');
    const escapedArtist = artist_name.replace(/'/g, "'\\\\\\\\\\'\\'").replace(/:/g, '\\:');
    
    let filter = `drawtext=text='${escapedTitle}':fontsize=${styleConfig.titleSize}:fontcolor=${styleConfig.titleColor}:x=(w-text_w)/2:y=(h-text_h)/2-50`;
    
    if (animation === 'fade') {
        filter += `:alpha='if(lt(t,${fadeInDuration}),t/${fadeInDuration},if(lt(t,${fadeOutStart}),1,(${duration}-t)/${fadeOutDuration}))'`;
    } else if (animation === 'slide') {
        filter += `:y='if(lt(t,${fadeInDuration}),h-(h-((h-text_h)/2-50))*(t/${fadeInDuration}),(h-text_h)/2-50)'`;
    } else if (animation === 'zoom') {
        filter += `:fontsize='${styleConfig.titleSize}*if(lt(t,${fadeInDuration}),t/${fadeInDuration},1)'`;
    }
    
    filter += `:enable='lt(t,${duration})'`;
    
    filter += `,drawtext=text='${escapedArtist}':fontsize=${styleConfig.artistSize}:fontcolor=${styleConfig.artistColor}:x=(w-text_w)/2:y=(h-text_h)/2+50`;
    filter += `:alpha='if(lt(t,${fadeInDuration}),t/${fadeInDuration},if(lt(t,${fadeOutStart}),1,(${duration}-t)/${fadeOutDuration}))'`;
    filter += `:enable='lt(t,${duration})'`;
    
    if (custom_text) {
        const escapedCustom = custom_text.replace(/'/g, "'\\\\\\\\\\'\\'").replace(/:/g, '\\:');
        filter += `,drawtext=text='${escapedCustom}':fontsize=36:fontcolor=white:x=(w-text_w)/2:y=h-100`;
        filter += `:alpha='if(lt(t,${fadeInDuration}),t/${fadeInDuration},if(lt(t,${fadeOutStart}),1,(${duration}-t)/${fadeOutDuration}))'`;
        filter += `:enable='lt(t,${duration})'`;
    }
    
    return filter;
}

export function generateOutroOverlayFilter(config: OutroOverlayConfig, videoHeight: number): string {
    const { credits, style, animation, duration } = config;
    
    if (animation === 'scroll') {
        const lineHeight = 60;
        const startY = videoHeight;
        const endY = -credits.custom_credits.length * lineHeight;
        const scrollSpeed = (startY - endY) / duration;
        
        let filter = '';
        credits.custom_credits.forEach((line, index) => {
            if (index > 0) filter += ',';
            const escapedLine = line.replace(/'/g, "'\\\\\\\\\\'\\'").replace(/:/g, '\\:');
            filter += `drawtext=text='${escapedLine}':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=${startY + index * lineHeight}-t*${scrollSpeed}:enable='gte(t,0)'`;
        });
        
        return filter;
    } else {
        const fadeInDuration = duration * 0.2;
        const fadeOutStart = duration * 0.8;
        const fadeOutDuration = duration * 0.2;
        
        let filter = '';
        const startY = videoHeight / 2 - (credits.custom_credits.length * 50) / 2;
        
        credits.custom_credits.forEach((line, index) => {
            if (index > 0) filter += ',';
            const escapedLine = line.replace(/'/g, "'\\\\\\\\\\'\\'").replace(/:/g, '\\:');
            filter += `drawtext=text='${escapedLine}':fontsize=42:fontcolor=white:x=(w-text_w)/2:y=${startY + index * 50}`;
            filter += `:alpha='if(lt(t,${fadeInDuration}),t/${fadeInDuration},if(lt(t,${fadeOutStart}),1,(${duration}-t)/${fadeOutDuration}))'`;
        });
        
        return filter;
    }
}

const fetchAndConvert = async (url: string) => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
        }
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        return new Uint8Array(arrayBuffer);
    } catch (e) {
        console.error(`Error fetching resource: ${url}`, e);
        return null; // Return null to signify failure
    }
}

export const renderVideo = async (
    storyboard: Storyboard,
    songFile: File,
    resolution: '720p' | '1080p' | '4k',
    progressCallback: (update: { progress: number; message: string }) => void,
    introConfig?: IntroOverlayConfig,
    outroConfig?: OutroOverlayConfig
): Promise<Blob> => {
    if (useBackend) {
        try {
            return await renderVideoWithBackend(storyboard, songFile, resolution, progressCallback, introConfig, outroConfig);
        } catch (error) {
            console.error('Backend video generation failed, falling back to WASM:', error);
            useBackend = false;
        }
    }
    
    const ffmpegInstance = await loadFFmpeg((message) => progressCallback({ progress: 0, message }));

    const songData = new Uint8Array(await songFile.arrayBuffer());
    // Build a chronologically ordered shot list to preserve intended sequence
    const allShots = storyboard.scenes
        .flatMap(scene => scene.shots)
        .slice()
        .sort((a, b) => (a.start ?? 0) - (b.start ?? 0));
    const totalDuration = allShots[allShots.length - 1]?.end || 0;

    // Write all media files to FFmpeg's virtual filesystem and build per-input args
    const inputFileNames: string[] = [];
    for (let i = 0; i < allShots.length; i++) {
        const shot = allShots[i];
        const mediaUrl = shot.clip_url || shot.preview_image_url;
        if (!mediaUrl) continue;

        const data = await fetchAndConvert(mediaUrl);
        if (!data) continue;

        const extension = shot.clip_url ? 'mp4' : (mediaUrl.includes('jpeg') || mediaUrl.includes('jpg') ? 'jpg' : 'png');
        const filename = `input${i}.${extension}`;
        await ffmpegInstance.writeFile(filename, data);
        inputFileNames.push(filename);
    }

    await ffmpegInstance.writeFile('audio.mp3', songData);

    progressCallback({ progress: 0, message: 'Generating FFmpeg command...' });

    // Build the complex filter for concatenation and transitions
    ffmpegInstance.on('progress', ({ time }: { time: number }) => {
        const progress = totalDuration > 0 ? time / totalDuration : 0;
        progressCallback({ progress: Math.min(progress, 1), message: `Transcoding... (${Math.round(progress * 100)}%)` });
    });

    const resolutionMap = {
        '720p': { width: 1280, height: 720 },
        '1080p': { width: 1920, height: 1080 },
        '4k': { width: 3840, height: 2160 }
    };
    const { width, height } = resolutionMap[resolution];

    // Build input args
    const inputArgs: string[] = [];
    for (const filename of inputFileNames) {
        inputArgs.push('-i', filename);
    }
    inputArgs.push('-i', 'audio.mp3');

    // Build filter_complex for scaling, padding, and concatenation
    let filterComplex = '';
    for (let i = 0; i < inputFileNames.length; i++) {
        const shot = allShots[i];
        const duration = shot.end - shot.start;
        const isVideo = shot.clip_url ? true : false;

        if (isVideo) {
            // For videos: scale, pad, set duration, set fps
            filterComplex += `[${i}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setpts=PTS-STARTPTS,fps=30,trim=duration=${duration}[v${i}];`;
        } else {
            // For images: scale, pad, loop for duration, set fps
            filterComplex += `[${i}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,loop=loop=-1:size=1:start=0,setpts=N/(30*TB),fps=30,trim=duration=${duration}[v${i}];`;
        }
    }

    // Concatenate all video streams
    const concatInputs = inputFileNames.map((_, i) => `[v${i}]`).join('');
    filterComplex += `${concatInputs}concat=n=${inputFileNames.length}:v=1:a=0[outv]`;
    
    // Add intro/outro overlay filters if enabled
    if (introConfig?.enabled) {
        const introFilter = generateIntroOverlayFilter(introConfig);
        filterComplex += `;[outv]${introFilter}[outv_intro]`;
        // Update the map to use the intro output
        filterComplex = filterComplex.replace('[outv]', '[outv_intro]');
    }
    
    if (outroConfig?.enabled) {
        const outroFilter = generateOutroOverlayFilter(outroConfig, height);
        const currentOutput = introConfig?.enabled ? '[outv_intro]' : '[outv]';
        filterComplex += `;${currentOutput}${outroFilter}[outv_outro]`;
    }

    // Determine final output label
    const finalOutput = outroConfig?.enabled ? '[outv_outro]' : (introConfig?.enabled ? '[outv_intro]' : '[outv]');
    
    const cmd = [
        ...inputArgs,
        '-filter_complex', filterComplex,
        '-map', finalOutput,
        '-map', `${inputFileNames.length}:a`, // Map the audio input
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-shortest', // End when shortest stream ends (audio or video)
        'output.mp4'
    ];

    console.log('Executing FFmpeg command:', cmd.join(' '));
    await ffmpegInstance.exec(cmd);

    progressCallback({ progress: 1, message: 'Finalizing...' });

    const data = await ffmpegInstance.readFile('output.mp4');
    
    for(const name of inputFileNames) {
       await ffmpegInstance.deleteFile(name);
    }
    await ffmpegInstance.deleteFile('audio.mp3');
    await ffmpegInstance.deleteFile('output.mp4');

    // Convert Uint8Array to Blob
    const videoData = data as Uint8Array;
    return new Blob([new Uint8Array(videoData)], { type: 'video/mp4' });
};

const renderVideoWithBackend = async (
    storyboard: Storyboard,
    songFile: File,
    resolution: '720p' | '1080p' | '4k',
    progressCallback: (update: { progress: number; message: string }) => void,
    introConfig?: IntroOverlayConfig,
    outroConfig?: OutroOverlayConfig
): Promise<Blob> => {
    progressCallback({ progress: 0.1, message: 'Uploading audio to backend...' });
    
    const { audioUrl } = await backendService.uploadAudio(songFile);
    progressCallback({ progress: 0.2, message: 'Audio uploaded successfully' });
    
    const allShots = storyboard.scenes
        .flatMap(scene => scene.shots)
        .slice()
        .sort((a, b) => (a.start ?? 0) - (b.start ?? 0));
    const scenes: Scene[] = [];
    
    progressCallback({ progress: 0.3, message: 'Processing scene images...' });
    
    const blobFromObjectURL = async (url: string): Promise<Blob> => {
        // First try in-memory cache populated when clips are generated
        try {
            const cached = (typeof window !== 'undefined') ? (window as any).__mvClipBlobs?.[url] : undefined;
            if (cached) return cached as Blob;
        } catch (_) {}
        // Try Fetch
        try {
            const res = await fetch(url);
            if (res.ok) return await res.blob();
        } catch (_) { /* ignore */ }
        // Fallback to XHR
        return await new Promise<Blob>((resolve, reject) => {
            try {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', url, true);
                xhr.responseType = 'blob';
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300 && xhr.response) resolve(xhr.response);
                    else reject(new Error(`XHR failed for ${url} (${xhr.status})`));
                };
                xhr.onerror = () => reject(new Error('XHR network error'));
                xhr.send();
            } catch (e) { reject(e as any); }
        });
    };

    for (let i = 0; i < allShots.length; i++) {
        const shot = allShots[i];
        const duration = shot.end - shot.start;
    // Prefer using generated video clips when available; otherwise fallback to preview image.
        let imageUrl = shot.preview_image_url || '';
        let videoUrl = shot.clip_url || '';

        if (!imageUrl) continue;

        // If the image comes from a browser blob: URL, upload it to backend first
        // so the server can access it (blob: URLs are not reachable by the server).
        try {
            // Handle local preview image data URLs by uploading
            if (imageUrl.startsWith('data:image')) {
                // Convert data URL to File then upload to get a stable http URL
                const comma = imageUrl.indexOf(',');
                const header = imageUrl.substring(0, comma);
                const b64 = imageUrl.substring(comma + 1);
                const mime = header.substring(header.indexOf(':') + 1, header.indexOf(';')) || 'image/png';
                const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
                const file = new File([bytes], `scene_${i}.${mime.includes('jpeg') ? 'jpg' : mime.includes('png') ? 'png' : 'png'}`, { type: mime });
                const upload = await backendService.uploadImage(file);
                imageUrl = upload.imageUrl || imageUrl;
            }

            // If we have a video clip, normalize it to a backend URL
            if (videoUrl) {
                if (videoUrl.startsWith('blob:')) {
                    // Convert blob video to File and upload
                    try {
                        const blob = await blobFromObjectURL(videoUrl);
                        const mime = blob.type || 'video/mp4';
                        if (mime.startsWith('video/')) {
                            const ext = mime.includes('webm') ? '.webm' : '.mp4';
                            const file = new File([blob], `clip_${i}${ext}`, { type: mime });
                            const uploaded = await backendService.uploadVideo(file);
                            videoUrl = uploaded.videoUrl || '';
                        } else {
                            videoUrl = '';
                        }
                    } catch (e) {
                        console.warn('Failed to upload blob video for scene', i, e);
                        videoUrl = '';
                    }
                } else if (videoUrl.startsWith('data:video')) {
                    try {
                        const comma = videoUrl.indexOf(',');
                        const header = videoUrl.substring(0, comma);
                        const b64 = videoUrl.substring(comma + 1);
                        const mime = header.substring(header.indexOf(':') + 1, header.indexOf(';')) || 'video/mp4';
                        const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
                        const ext = mime.includes('webm') ? '.webm' : '.mp4';
                        const file = new File([bytes], `clip_${i}${ext}`, { type: mime });
                        const uploaded = await backendService.uploadVideo(file);
                        videoUrl = uploaded.videoUrl || '';
                    } catch (e) {
                        console.warn('Failed to normalize data video for scene', i, e);
                        videoUrl = '';
                    }
                } else if (videoUrl.startsWith('http')) {
                    // keep as-is
                } else {
                    // unsupported scheme
                    videoUrl = '';
                }
            } else if (imageUrl.startsWith('http')) {
                // Use as-is; backend will download it.
            } else {
                // Unknown scheme; skip
                throw new Error('Unsupported image URL scheme');
            }
        } catch (e) {
            console.warn('Failed to normalize image for scene', i, e);
            continue;
        }

        scenes.push({
            imageUrl: imageUrl || undefined,
            // send videoUrl when available; backend prefers video
            ...(videoUrl ? { videoUrl } : {}),
            duration,
            description: shot.lyric_overlay?.text || shot.subject || `${shot.shot_type} - ${shot.composition}`
        });

        const progress = 0.3 + (i / allShots.length) * 0.3;
        progressCallback({ progress, message: `Processing scene ${i + 1}/${allShots.length}...` });
    }
    
    progressCallback({ progress: 0.6, message: 'Generating video on backend...' });
    
    const resolutionMap = {
        '720p': { width: 1280, height: 720 },
        '1080p': { width: 1920, height: 1080 },
        '4k': { width: 3840, height: 2160 }
    };
    const { width, height } = resolutionMap[resolution];
    
    const response = await backendService.generateVideo({
        scenes,
        audioUrl,
        width,
        height,
        fps: 30,
        intro: introConfig,
        outro: outroConfig
    });
    
    if (!response.success || !response.videoUrl) {
        throw new Error(response.error || 'Video generation failed');
    }
    
    progressCallback({ progress: 0.9, message: 'Downloading generated video...' });
    
    const videoResponse = await fetch(response.videoUrl);
    if (!videoResponse.ok) {
        throw new Error('Failed to download generated video');
    }
    
    const videoBlob = await videoResponse.blob();
    progressCallback({ progress: 1, message: 'Video generation complete!' });
    
    return videoBlob;
};
