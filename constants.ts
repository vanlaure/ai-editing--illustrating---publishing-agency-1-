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
    category: "Retro / Stylized",
    substyle: "Synthwave",
    description: "Neon grids, chrome surfaces, and a synthwave vibe.",
    settings: {
      feel: "Nostalgic, Energetic, Cool",
      style: "80s retro-futurism, synthwave aesthetic, neon-drenched",
      color_palette: ["#FF00FF", "#00FFFF", "#FFD700", "#000000"],
    },
  },
  {
    name: "Dreamy Lo-fi Animation",
    category: "Animation",
    substyle: "Hand-drawn / Lo-fi",
    description: "Soft, pastel-colored, hand-drawn animation with a cozy feel.",
    settings: {
      feel: "Relaxed, Dreamy, Introspective",
      style: "Lo-fi anime aesthetic, soft pastels, grainy textures, hand-drawn look",
      color_palette: ["#F4B3C2", "#A6D9F7", "#F9F871", "#7E7F9A"],
    },
  },
  {
    name: "Dark Cinematic Noir",
    category: "Cinematic",
    substyle: "Noir / Thriller",
    description: "High-contrast black and white, dramatic shadows, and a mysterious mood.",
    settings: {
      feel: "Mysterious, Tense, Dramatic",
      style: "Black and white film noir, high contrast, dramatic chiaroscuro lighting, smoke and rain",
      color_palette: ["#000000", "#FFFFFF", "#808080"],
    },
  },
  {
    name: "Nature's Serenity",
    category: "Documentary / Natural",
    substyle: "Nature",
    description: "Lush landscapes, natural light, and a peaceful, organic feel.",
    settings: {
      feel: "Calm, Serene, Organic",
      style: "Documentary-style nature cinematography, golden hour lighting, sweeping landscapes, macro shots",
      color_palette: ["#2F4F4F", "#556B2F", "#F5DEB3", "#87CEEB"],
    },
  },
  {
    name: "Gritty Urban Hype",
    category: "Performance",
    substyle: "Hip-Hop",
    description: "Fisheye lenses, fast cuts, and raw, urban environments for a hip-hop feel.",
    settings: {
      feel: "Energetic, Confident, Raw, Gritty",
      style: "Hype Williams inspired, fisheye lens, low-angle shots, rapid cuts, urban cityscapes at night, concrete textures",
      color_palette: ["#FFD700", "#FFFFFF", "#1E90FF", "#000000"],
    },
  },
  {
    name: "Psychedelic Visual Trip",
    category: "Experimental",
    substyle: "Psychedelic",
    description: "Surreal, kaleidoscopic visuals with vibrant, shifting colors.",
    settings: {
      feel: "Surreal, Trippy, Hypnotic, Expansive",
      style: "Psychedelic visuals, kaleidoscopic effects, liquid light show, datamoshing, surreal landscapes, vibrant color shifts",
      color_palette: ["#FF00FF", "#00FF00", "#FFFF00", "#FF4500"],
    },
  },
  {
    name: "Sun-drenched Americana",
    category: "Narrative",
    substyle: "Americana",
    description: "Warm, golden hour tones, rustic settings, and a touch of nostalgia.",
    settings: {
      feel: "Heartfelt, Nostalgic, Warm, Authentic",
      style: "Americana aesthetic, golden hour lighting, dusty roads, pickup trucks, lens flares, vintage film look",
      color_palette: ["#DEB887", "#A0522D", "#F5F5DC", "#4682B4"],
    },
  },
  {
    name: "High-Fashion Pop Glam",
    category: "Performance",
    substyle: "Pop / Glam",
    description: "Clean, vibrant, and perfectly choreographed with a high-fashion aesthetic.",
    settings: {
      feel: "Chic, Energetic, Polished, Confident",
      style: "High-fashion music video, clean lighting, designer outfits, minimalist sets with bold colors, synchronized choreography",
      color_palette: ["#FFC0CB", "#FFFFFF", "#ADD8E6", "#E6E6FA"],
    },
  },
  {
    name: "Aggressive Metal Fury",
    category: "Performance",
    substyle: "Metal / Rock",
    description: "Fast-paced, high-contrast, and intense visuals with a dark, aggressive tone.",
    settings: {
      feel: "Aggressive, Intense, Powerful, Dark",
      style: "High-energy performance shots, fast cuts, strobe lights, dark industrial locations, high contrast, heavy film grain",
      color_palette: ["#FF0000", "#000000", "#FFFFFF", "#8B0000"],
    },
  },
  {
    name: "Indie Bedroom Pop",
    category: "Narrative",
    substyle: "Indie / DIY",
    description: "Soft lighting, cozy interiors, analog textures, Super 8 vibes.",
    settings: {
      feel: "Tender, Intimate, Nostalgic",
      style: "Bedroom pop aesthetic, fairy lights, VHS or Super 8 overlays, handheld close-ups",
      color_palette: ["#FADADD", "#FFE4B5", "#B0C4DE", "#2F4F4F"],
    },
  },
  {
    name: "Afrofuturism Glow",
    category: "Cinematic",
    substyle: "Futuristic",
    description: "Metallic finishes, bold patterns, and culturally rich sci‑fi styling.",
    settings: {
      feel: "Empowering, Futuristic, Regal",
      style: "Afrofuturist costume design, reflective materials, saturated gels, graphic silhouettes",
      color_palette: ["#0B0B0F", "#7F00FF", "#FF8C00", "#00E5FF"],
    },
  },
  {
    name: "Epic Fantasy Saga",
    category: "Cinematic",
    substyle: "Fantasy / Epic",
    description: "Mythic worlds, sweeping vistas, and painterly hero lighting.",
    settings: {
      feel: "Majestic, Heroic, Awe-inspiring",
      style: "Epic fantasy cinematography, god rays, volumetric fog, wide landscape shots, ornate costuming",
      color_palette: ["#1A2A3A", "#8FB7D8", "#D9B26F", "#F2EBE0"],
    },
  },
  {
    name: "Romantic Melodrama",
    category: "Cinematic",
    substyle: "Romance / Drama",
    description: "Soft lenses, warm backlight, and intimate close-ups.",
    settings: {
      feel: "Tender, Emotional, Lush",
      style: "Romantic drama with soft diffusion, bokeh highlights, slow motion embraces, pastel gels",
      color_palette: ["#2B1B25", "#E8B4BC", "#F7E1D7", "#A6B1E1"],
    },
  },
  {
    name: "Suspense Thriller",
    category: "Cinematic",
    substyle: "Thriller / Suspense",
    description: "Tight framing, tungsten vs. teal contrast, and creeping camera moves.",
    settings: {
      feel: "Tense, Edgy, Unsettling",
      style: "High-contrast thriller look, silhouette lighting, dutch angles, slow push-ins, shallow depth of field",
      color_palette: ["#0A0C10", "#12263A", "#1E7A8A", "#F5B700"],
    },
  },
  {
    name: "Period Piece Classic",
    category: "Cinematic",
    substyle: "Historical",
    description: "Vintage lenses, natural light, and era-authentic production design.",
    settings: {
      feel: "Authentic, Poetic, Nostalgic",
      style: "Period cinematography with soft halation, warm sunlight, grain, and set dressing true to era",
      color_palette: ["#2E241D", "#C7A17A", "#DCC9A3", "#6E7B8B"],
    },
  },
  {
    name: "Western Neo-Noir",
    category: "Cinematic",
    substyle: "Western / Neo-Noir",
    description: "Dusty horizons, long shadows, and arid color tones with modern contrast.",
    settings: {
      feel: "Rugged, Brooding, Cinematic",
      style: "Western vistas, silhouette riders, sun flares, harsh sidelight, desaturated earth tones",
      color_palette: ["#2B1A12", "#9C6B3C", "#D4B483", "#C0C0C0"],
    },
  },
  {
    name: "IMAX Nature Grandeur",
    category: "Cinematic",
    substyle: "Nature / IMAX",
    description: "Sweeping aerials, massive scale, and crystal clarity.",
    settings: {
      feel: "Grand, Serene, Inspiring",
      style: "IMAX-style nature cinematography with aerials, long lenses on wildlife, ultra-wide landscapes, natural HDR light",
      color_palette: ["#0D1B2A", "#1B263B", "#778DA9", "#E0E1DD"],
    },
  },
  {
    name: "Horror Atmospherics",
    category: "Cinematic",
    substyle: "Horror / Atmosphere",
    description: "Fog, silhouettes, and practical light pools building dread.",
    settings: {
      feel: "Ominous, Claustrophobic, Foreboding",
      style: "Mist-filled sets, single-source lighting, creeping dolly moves, desaturated palette with blood accents",
      color_palette: ["#0B0B0C", "#1F1F29", "#6A6A7A", "#C1121F"],
    },
  },
  {
    name: "Sports Heroics",
    category: "Cinematic",
    substyle: "Sports / Hero",
    description: "High-speed shots, sweat highlights, and triumphant slow motion.",
    settings: {
      feel: "Driven, Triumphant, Gritty",
      style: "Sports drama with steadicam runs, slow-motion impacts, locker room steam, backlit particles",
      color_palette: ["#0E1624", "#1F4068", "#E43F5A", "#F8C537"],
    },
  },
  {
    name: "Vintage Film Grain",
    category: "Retro / Stylized",
    substyle: "70s/90s",
    description: "Film burn overlays, halation, and soft-focus nostalgia.",
    settings: {
      feel: "Warm, Nostalgic, Lived-in",
      style: "1970s/1990s film look, handheld zooms, light leaks, warm halation",
      color_palette: ["#F2C572", "#8B5E3C", "#32435F", "#E8E2D0"],
    },
  },
  {
    name: "Cyberpunk Night City",
    category: "Urban / Stylized",
    substyle: "Sci-Fi",
    description: "Rain-slick streets, neon signage, and chrome reflections.",
    settings: {
      feel: "Edgy, Futuristic, Gritty",
      style: "Cyberpunk cityscape, neon rain, reflective puddles, long lens compression",
      color_palette: ["#0B132B", "#1C2541", "#3A506B", "#FF2E63"],
    },
  },
  {
    name: "Festival Aftermovie",
    category: "Documentary / Natural",
    substyle: "Live / Crowd",
    description: "Handheld energy, crowd waves, lens flares, and sunsets.",
    settings: {
      feel: "Euphoric, Communal, Alive",
      style: "Festival recap with Steadicam sweeps, slow-motion confetti, silhouette backlight",
      color_palette: ["#0A0A0A", "#FFA500", "#FF00FF", "#00FFFF"],
    },
  },
  {
    name: "Luxury R&B Slow Burn",
    category: "Performance",
    substyle: "R&B",
    description: "Velvet textures, moody lighting, and slow dolly moves.",
    settings: {
      feel: "Sensual, Smooth, Moody",
      style: "R&B lounge aesthetic, velvet drapes, candlelight, slow dolly and slider moves",
      color_palette: ["#0D0A0B", "#4A154B", "#B76E79", "#F5E1DA"],
    },
  },
  {
    name: "Hardstyle Rave",
    category: "Performance",
    substyle: "EDM",
    description: "Strobes, lasers, and rapid cuts synced to the drop.",
    settings: {
      feel: "High-Octane, Pulsing, Electric",
      style: "Rave warehouse, laser grids, staccato edits, glitch overlays",
      color_palette: ["#050505", "#00FFB2", "#FF006E", "#7B2CBF"],
    },
  },
  {
    name: "Surreal Art House",
    category: "Experimental",
    substyle: "Art Film",
    description: "Symbolic imagery, tableaus, and painterly compositions.",
    settings: {
      feel: "Poetic, Abstract, Meditative",
      style: "Art-house staging, long takes, symbolic props, painterly lighting",
      color_palette: ["#1A1A1A", "#7A6F5A", "#B8C4BB", "#EAE2B7"],
    },
  },
  {
    name: "Anime Action",
    category: "Animation",
    substyle: "Action / Shonen",
    description: "Dynamic angles, speed lines, and explosive FX.",
    settings: {
      feel: "Heroic, Intense, Fast",
      style: "High-action anime with stylized motion blur, speed lines, and dramatic angles",
      color_palette: ["#0C0F0A", "#FF6B35", "#F7C59F", "#004E89"],
    },
  },
  {
    name: "Minimalist Monochrome",
    category: "Cinematic",
    substyle: "Minimal",
    description: "Clean lines, negative space, and strong contrast.",
    settings: {
      feel: "Calm, Refined, Modern",
      style: "Minimalist sets, symmetrical framing, monochrome palette with one accent color",
      color_palette: ["#0D1117", "#161B22", "#C9D1D9", "#58A6FF"],
    },
  },
];
