
export interface VideoClip {
  id: string;
  file?: File;
  url: string;
  thumbnail: string; // Base64
  duration: number; // Seconds
  name: string;
}

export interface ProcessingState {
  isProcessing: boolean;
  progress: number; // 0-100
  status: 'idle' | 'generating_thumbnails' | 'analyzing' | 'stitching' | 'completed' | 'error';
  message?: string;
}

export interface TitleDesign {
  text: string;
  style: 'modern' | 'classic' | 'handwritten' | 'bold' | 'scifi';
  position: 'center' | 'bottom_left' | 'bottom_center';
  color: string;
}

export interface CreditLine {
  role: string;
  name: string;
}

export interface ClosingCredits {
  enabled: boolean;
  lines: CreditLine[];
}

export interface CinematicEffects {
  applyGrain: boolean;
  applyVignette: boolean;
  applyLetterbox: boolean;
}

export interface DirectorNotes {
  mood: string;
  colorGrade: 'cinematic' | 'vintage' | 'vibrant' | 'bw' | 'cool' | 'warm' | 'natural';
  colorReasoning: string;
  pacing: string;
  transition: 'cut' | 'dissolve' | 'fade_black'; // Global fallback/dominant style
  clipTransitions: ('cut' | 'dissolve' | 'fade_black')[]; // Specific transition per gap
  transitionReasoning: string;
  titleDesign: TitleDesign;
  closingCredits: ClosingCredits;
  suggestedClipOrder: number[]; // Indices of the original array in the preferred order
  cinematicEffects: CinematicEffects;
}

export interface AIAnalysis {
  title: string;
  summary: string;
  keywords: string[];
  directorNotes: DirectorNotes;
}
