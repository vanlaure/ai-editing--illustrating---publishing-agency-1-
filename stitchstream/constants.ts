
export const GEMINI_MODEL = 'gemini-2.5-flash';

// Colors for UI
export const COLORS = {
  primary: '#3b82f6',
  secondary: '#64748b',
  accent: '#8b5cf6',
  danger: '#ef4444',
  success: '#22c55e',
};

// CSS Filters for Canvas context
export const VIDEO_FILTERS: Record<string, string> = {
  cinematic: 'contrast(1.1) saturate(1.2) brightness(0.95)',
  vintage: 'sepia(0.4) contrast(1.1) brightness(0.9) saturate(0.8)',
  vibrant: 'saturate(1.5) contrast(1.05)',
  bw: 'grayscale(1) contrast(1.2)',
  warm: 'sepia(0.2) saturate(1.3) contrast(1.05)',
  cool: 'saturate(0.9) contrast(1.1) brightness(1.05)',
  natural: 'none'
};

export const FILTER_LABELS: Record<string, string> = {
  cinematic: '🎬 Cinematic',
  vintage: '🎞️ Vintage',
  vibrant: '🌈 Vibrant',
  bw: '⚫ Noir B&W',
  warm: '☀️ Golden Hour',
  cool: '❄️ Arctic',
  natural: '🍃 Natural'
};

export const TRANSITION_LABELS: Record<string, string> = {
  cut: '✂️ Hard Cut',
  dissolve: '💧 Cross Dissolve',
  fade_black: '⚫ Fade to Black'
};

export const FONT_STYLES: Record<string, string> = {
  modern: '600 60px "Inter", sans-serif',
  classic: '400 60px "Times New Roman", serif',
  handwritten: '400 70px "Brush Script MT", cursive',
  bold: '900 70px "Impact", sans-serif',
  scifi: '300 60px "Courier New", monospace'
};
