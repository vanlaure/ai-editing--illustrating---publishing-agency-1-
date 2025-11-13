import { CinematicAudiobook, CharacterVoiceAssignment, Soundscape, MusicCue } from '../types';

export interface ExportOptions {
  projectName: string;
  outputDir: string;
  sampleRate?: number;
  bitDepth?: number;
  includeMetadata?: boolean;
}

export interface ExportResult {
  success: boolean;
  path?: string;
  error?: string;
  tracks?: TrackInfo[];
}

export interface TrackInfo {
  name: string;
  type: 'dialogue' | 'soundscape' | 'music' | 'sfx';
  audioUrl: string;
  volume: number;
  startTime: number;
  duration: number;
}

/**
 * Export cinematic audiobook project for Audacity (.aup3 format)
 * 
 * Audacity 3.x uses SQLite database format (.aup3)
 * This creates a project structure with separate tracks for:
 * - Character dialogue (one track per character)
 * - Soundscapes
 * - Music cues
 * - Sound effects
 */
export async function exportForAudacity(
  project: CinematicAudiobook,
  options: ExportOptions
): Promise<ExportResult> {
  try {
    const tracks = await prepareMultiTrackExport(project);
    
    // Generate Audacity project XML structure
    const audacityXML = generateAudacityXML(tracks, options);
    
    // Create .aup3 file structure
    const projectPath = `${options.outputDir}/${options.projectName}.aup3`;
    
    // In a real implementation, this would write the SQLite database
    // For now, we'll create an XML representation
    const xmlPath = `${options.outputDir}/${options.projectName}_audacity.xml`;
    
    console.log(`Exporting Audacity project to: ${xmlPath}`);
    console.log(`Total tracks: ${tracks.length}`);
    console.log('Track breakdown:', {
      dialogue: tracks.filter(t => t.type === 'dialogue').length,
      soundscapes: tracks.filter(t => t.type === 'soundscape').length,
      music: tracks.filter(t => t.type === 'music').length,
      sfx: tracks.filter(t => t.type === 'sfx').length
    });
    
    // TODO: Implement actual file writing with fs/path modules
    // await fs.writeFile(xmlPath, audacityXML, 'utf-8');
    
    return {
      success: true,
      path: xmlPath,
      tracks
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown export error'
    };
  }
}

/**
 * Export cinematic audiobook project for DaVinci Resolve (.edl format)
 * 
 * CMX 3600 EDL format with:
 * - Timecode for precise sync
 * - Track assignments (A1-A16 for audio)
 * - Volume/fade automation markers
 * - Clip names with metadata
 */
export async function exportForResolve(
  project: CinematicAudiobook,
  options: ExportOptions
): Promise<ExportResult> {
  try {
    const tracks = await prepareMultiTrackExport(project);
    
    // Generate EDL content
    const edlContent = generateEDL(tracks, options);
    
    const edlPath = `${options.outputDir}/${options.projectName}.edl`;
    
    console.log(`Exporting DaVinci Resolve EDL to: ${edlPath}`);
    console.log(`Total clips: ${tracks.length}`);
    console.log('Timeline duration:', calculateTotalDuration(tracks), 'seconds');
    
    // TODO: Implement actual file writing
    // await fs.writeFile(edlPath, edlContent, 'utf-8');
    
    return {
      success: true,
      path: edlPath,
      tracks
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown export error'
    };
  }
}

/**
 * Prepare multi-track export data from cinematic audiobook project
 */
async function prepareMultiTrackExport(project: CinematicAudiobook): Promise<TrackInfo[]> {
  const tracks: TrackInfo[] = [];
  let currentTime = 0;
  
  // Process voice assignments (dialogue tracks)
  if (project.fullCastVoices) {
    for (const assignment of project.fullCastVoices) {
      // TODO: Actual audio URLs would come from RecordingTake objects after generation
      // For now, using voiceSample as placeholder
      if (assignment.voiceSample) {
        tracks.push({
          name: `Dialogue - ${assignment.characterName}`,
          type: 'dialogue',
          audioUrl: assignment.voiceSample,
          volume: 100,
          startTime: currentTime,
          duration: 30 // Placeholder duration, should be calculated from actual audio
        });
        currentTime += 30 + 0.5; // 0.5s gap
      }
    }
  }
  
  // Process soundscapes
  if (project.soundscapes) {
    for (const soundscape of project.soundscapes) {
      tracks.push({
        name: `Soundscape - ${soundscape.name}`,
        type: 'soundscape',
        audioUrl: soundscape.audioUrl || '',
        volume: soundscape.volume || 30,
        startTime: 0, // Soundscapes often span multiple scenes
        duration: 60 // Default 60s, should be calculated from actual audio
      });
    }
  }
  
  // Process music cues
  if (project.musicCues) {
    for (const cue of project.musicCues) {
      if (cue.musicUrl) {
        tracks.push({
          name: `Music - ${cue.name}`,
          type: 'music',
          audioUrl: cue.musicUrl,
          volume: cue.volume || 50,
          startTime: cue.timestamp || 0,
          duration: cue.duration || 30
        });
      }
    }
  }
  
  return tracks;
}

/**
 * Generate Audacity project XML structure
 */
function generateAudacityXML(tracks: TrackInfo[], options: ExportOptions): string {
  const sampleRate = options.sampleRate || 44100;
  const bitDepth = options.bitDepth || 16;
  
  let xml = `<?xml version="1.0" standalone="no" ?>\n`;
  xml += `<!DOCTYPE project PUBLIC "-//audacityproject-1.3.0//DTD//EN" "http://audacity.sourceforge.net/xml/audacityproject-1.3.0.dtd" >\n`;
  xml += `<project xmlns="http://audacity.sourceforge.net/xml/" projname="${options.projectName}" version="1.3.0" audacityversion="3.4.2" sel0="0" sel1="0" vpos="0" h="0" zoom="86.1328125000000000" rate="${sampleRate}" snapto="off" selectionformat="hh:mm:ss + milliseconds" frequencyformat="Hz" bandwidthformat="octaves">\n`;
  
  // Add tags/metadata
  if (options.includeMetadata) {
    xml += `  <tags>\n`;
    xml += `    <tag name="TITLE" value="${options.projectName}" />\n`;
    xml += `    <tag name="ARTIST" value="Cinematic Audiobook Production" />\n`;
    xml += `    <tag name="GENRE" value="Audiobook" />\n`;
    xml += `    <tag name="YEAR" value="${new Date().getFullYear()}" />\n`;
    xml += `  </tags>\n`;
  }
  
  // Add tracks
  let trackNum = 0;
  for (const track of tracks) {
    xml += `  <wavetrack name="${escapeXML(track.name)}" channel="0" linked="0" mute="0" solo="0" height="150" minimized="0" isSelected="1" rate="${sampleRate}" gain="${track.volume / 100}" pan="0" colorindex="0">\n`;
    xml += `    <waveclip offset="${track.startTime.toFixed(6)}" colorindex="0">\n`;
    xml += `      <sequence maxsamples="262144" sampleformat="${bitDepth}bit" numsamples="${Math.floor(track.duration * sampleRate)}">\n`;
    xml += `        <!-- Audio data reference: ${track.audioUrl} -->\n`;
    xml += `        <waveblock start="0">\n`;
    xml += `          <simpleblockfile filename="${sanitizeFilename(track.name)}.au" len="${Math.floor(track.duration * sampleRate)}" min="-0.5" max="0.5" rms="0.1"/>\n`;
    xml += `        </waveblock>\n`;
    xml += `      </sequence>\n`;
    xml += `      <envelope numpoints="0"/>\n`;
    xml += `    </waveclip>\n`;
    xml += `  </wavetrack>\n`;
    trackNum++;
  }
  
  xml += `</project>\n`;
  
  return xml;
}

/**
 * Generate CMX 3600 EDL format for DaVinci Resolve
 */
function generateEDL(tracks: TrackInfo[], options: ExportOptions): string {
  const frameRate = 24; // 24fps for film
  let edl = `TITLE: ${options.projectName}\n`;
  edl += `FCM: NON-DROP FRAME\n\n`;
  
  let clipNum = 1;
  const trackChannels: { [key: string]: number } = {
    'dialogue': 1,
    'soundscape': 3,
    'music': 5,
    'sfx': 7
  };
  
  for (const track of tracks) {
    const channel = trackChannels[track.type] || 1;
    const startTC = secondsToTimecode(track.startTime, frameRate);
    const endTC = secondsToTimecode(track.startTime + track.duration, frameRate);
    const sourceStartTC = secondsToTimecode(0, frameRate);
    const sourceEndTC = secondsToTimecode(track.duration, frameRate);
    
    edl += `${clipNum.toString().padStart(3, '0')}  AX       A${channel}       C        ${startTC} ${endTC} ${sourceStartTC} ${sourceEndTC}\n`;
    edl += `* FROM CLIP NAME: ${track.name}\n`;
    edl += `* AUDIO URL: ${track.audioUrl}\n`;
    
    // Volume automation
    if (track.volume !== 100) {
      const dbGain = 20 * Math.log10(track.volume / 100);
      edl += `* AUDIO LEVEL: ${dbGain.toFixed(2)} DB\n`;
    }
    
    edl += `\n`;
    clipNum++;
  }
  
  return edl;
}

/**
 * Convert seconds to SMPTE timecode (HH:MM:SS:FF)
 */
function secondsToTimecode(seconds: number, frameRate: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const frames = Math.floor((seconds % 1) * frameRate);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
}

/**
 * Estimate audio duration from text (rough approximation)
 * Average speaking rate: ~150 words per minute
 */
function estimateAudioDuration(text: string): number {
  const words = text.split(/\s+/).length;
  const minutes = words / 150;
  return minutes * 60;
}

/**
 * Calculate total timeline duration
 */
function calculateTotalDuration(tracks: TrackInfo[]): number {
  let maxEnd = 0;
  for (const track of tracks) {
    const end = track.startTime + track.duration;
    if (end > maxEnd) maxEnd = end;
  }
  return maxEnd;
}

/**
 * Escape XML special characters
 */
function escapeXML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Sanitize filename for safe file system usage
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-z0-9_-]/gi, '_')
    .toLowerCase()
    .substring(0, 200);
}

/**
 * Export with progress tracking (for future implementation)
 */
export async function exportWithProgress(
  project: CinematicAudiobook,
  options: ExportOptions,
  format: 'audacity' | 'resolve',
  onProgress?: (progress: number) => void
): Promise<ExportResult> {
  onProgress?.(0);
  
  // Prepare tracks (20% progress)
  const tracks = await prepareMultiTrackExport(project);
  onProgress?.(20);
  
  // Generate format-specific content (60% progress)
  let result: ExportResult;
  if (format === 'audacity') {
    result = await exportForAudacity(project, options);
  } else {
    result = await exportForResolve(project, options);
  }
  onProgress?.(80);
  
  // Finalize (100% progress)
  onProgress?.(100);
  
  return result;
}