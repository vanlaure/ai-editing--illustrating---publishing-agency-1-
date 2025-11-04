import { StylePreset, VFX_PRESET } from './types';

export const VFX_PRESETS: { name: VFX_PRESET, description: string }[] = [
    { name: 'Slow Motion', description: 'Reduces playback speed for dramatic effect.' },
    { name: 'Speed Ramp', description: 'Smoothly transitions between different speeds.' },
    { name: 'Lens Flare', description: 'Adds cinematic light flares.' },
    { name: 'Glitch Effect', description: 'Creates a digital, corrupted look.' },
    { name: 'Vintage Film Grain', description: 'Adds a classic, grainy texture.' },
];

export const STYLE_PRESETS: StylePreset[] = [
  {
    name: "80s Retro Futurism",
    description: "Neon grids, chrome surfaces, and a synthwave vibe.",
    settings: {
      feel: "Nostalgic, Energetic, Cool",
      style: "80s retro-futurism, synthwave aesthetic, neon-drenched",
      color_palette: ["#FF00FF", "#00FFFF", "#FFD700", "#000000"],
    },
  },
  {
    name: "Dreamy Lo-fi Animation",
    description: "Soft, pastel-colored, hand-drawn animation with a cozy feel.",
    settings: {
      feel: "Relaxed, Dreamy, Introspective",
      style: "Lo-fi anime aesthetic, soft pastels, grainy textures, hand-drawn look",
      color_palette: ["#F4B3C2", "#A6D9F7", "#F9F871", "#7E7F9A"],
    },
  },
  {
    name: "Dark Cinematic Noir",
    description: "High-contrast black and white, dramatic shadows, and a mysterious mood.",
    settings: {
      feel: "Mysterious, Tense, Dramatic",
      style: "Black and white film noir, high contrast, dramatic chiaroscuro lighting, smoke and rain",
      color_palette: ["#000000", "#FFFFFF", "#808080"],
    },
  },
   {
    name: "Nature's Serenity",
    description: "Lush landscapes, natural light, and a peaceful, organic feel.",
    settings: {
      feel: "Calm, Serene, Organic",
      style: "Documentary-style nature cinematography, golden hour lighting, sweeping landscapes, macro shots",
      color_palette: ["#2F4F4F", "#556B2F", "#F5DEB3", "#87CEEB"],
    },
  },
  {
    name: "Gritty Urban Hype",
    description: "Fisheye lenses, fast cuts, and raw, urban environments for a hip-hop feel.",
    settings: {
        feel: "Energetic, Confident, Raw, Gritty",
        style: "Hype Williams inspired, fisheye lens, low-angle shots, rapid cuts, urban cityscapes at night, concrete textures",
        color_palette: ["#FFD700", "#FFFFFF", "#1E90FF", "#000000"],
    },
  },
  {
    name: "Psychedelic Visual Trip",
    description: "Surreal, kaleidoscopic visuals with vibrant, shifting colors.",
    settings: {
        feel: "Surreal, Trippy, Hypnotic, Expansive",
        style: "Psychedelic visuals, kaleidoscopic effects, liquid light show, datamoshing, surreal landscapes, vibrant color shifts",
        color_palette: ["#FF00FF", "#00FF00", "#FFFF00", "#FF4500"],
    },
  },
  {
    name: "Sun-drenched Americana",
    description: "Warm, golden hour tones, rustic settings, and a touch of nostalgia.",
    settings: {
        feel: "Heartfelt, Nostalgic, Warm, Authentic",
        style: "Americana aesthetic, golden hour lighting, dusty roads, pickup trucks, lens flares, vintage film look",
        color_palette: ["#DEB887", "#A0522D", "#F5F5DC", "#4682B4"],
    },
  },
  {
    name: "High-Fashion Pop Glam",
    description: "Clean, vibrant, and perfectly choreographed with a high-fashion aesthetic.",
    settings: {
        feel: "Chic, Energetic, Polished, Confident",
        style: "High-fashion music video, clean lighting, designer outfits, minimalist sets with bold colors, synchronized choreography",
        color_palette: ["#FFC0CB", "#FFFFFF", "#ADD8E6", "#E6E6FA"],
    },
  },
  {
    name: "Aggressive Metal Fury",
    description: "Fast-paced, high-contrast, and intense visuals with a dark, aggressive tone.",
    settings: {
        feel: "Aggressive, Intense, Powerful, Dark",
        style: "High-energy performance shots, fast cuts, strobe lights, dark industrial locations, high contrast, heavy film grain",
        color_palette: ["#FF0000", "#000000", "#FFFFFF", "#8B0000"],
    },
  },
];
