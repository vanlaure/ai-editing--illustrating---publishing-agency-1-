/**
 * Canvas-based animated intro/outro renderer for music videos.
 * Renders cinematic motion graphics directly on a Canvas element.
 */

export interface IntroConfig {
  songTitle: string;
  artistName: string;
  subtitle?: string;
  style: 'cinematic' | 'glitch' | 'neon' | 'minimal' | 'particles';
  duration: number; // seconds
  colorPrimary?: string;
  colorSecondary?: string;
  colorAccent?: string;
}

export interface OutroConfig {
  songTitle: string;
  artistName: string;
  credits: { role: string; name: string }[];
  socialLinks?: { platform: string; handle: string }[];
  style: 'cinematic' | 'scroll' | 'modern' | 'minimal';
  duration: number; // seconds
  colorPrimary?: string;
  colorSecondary?: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  life: number;
}

// Easing functions
const ease = {
  inOut: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  out: (t: number) => 1 - Math.pow(1 - t, 3),
  in: (t: number) => t * t * t,
  elastic: (t: number) => t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1,
};

function createParticles(count: number, width: number, height: number, colors: string[]): Particle[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5 - 0.3,
    size: Math.random() * 3 + 1,
    alpha: Math.random() * 0.6 + 0.2,
    color: colors[Math.floor(Math.random() * colors.length)],
    life: Math.random(),
  }));
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[], globalAlpha: number) {
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.001;
    ctx.save();
    ctx.globalAlpha = p.alpha * globalAlpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

/**
 * Render a single frame of the intro animation onto the canvas.
 * Call this from requestAnimationFrame with increasing `time` values (0 to duration).
 */
export function renderIntroFrame(
  ctx: CanvasRenderingContext2D,
  config: IntroConfig,
  time: number,
  particles?: Particle[]
): Particle[] | undefined {
  const { songTitle, artistName, subtitle, style, duration, colorPrimary = '#ffffff', colorSecondary = '#aaaaaa', colorAccent = '#00f0ff' } = config;
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const progress = Math.min(time / duration, 1);

  // Global fade envelope: fade in first 15%, hold, fade out last 15%
  let envelope = 1;
  if (progress < 0.15) envelope = ease.out(progress / 0.15);
  else if (progress > 0.85) envelope = ease.in((1 - progress) / 0.15);

  // Clear to black
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, w, h);

  if (style === 'cinematic') {
    // Animated horizontal lines
    ctx.save();
    ctx.globalAlpha = 0.15 * envelope;
    ctx.strokeStyle = colorAccent;
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const lineY = h * 0.3 + i * (h * 0.1);
      const lineProgress = Math.max(0, Math.min(1, (progress - 0.05 * i) * 3));
      const lineWidth = w * 0.6 * ease.out(lineProgress);
      ctx.beginPath();
      ctx.moveTo(w / 2 - lineWidth / 2, lineY);
      ctx.lineTo(w / 2 + lineWidth / 2, lineY);
      ctx.stroke();
    }
    ctx.restore();

    // Title with reveal animation
    const titleReveal = Math.max(0, Math.min(1, (progress - 0.1) / 0.25));
    const titleAlpha = ease.out(titleReveal) * envelope;
    const titleY = h * 0.42 + (1 - ease.elastic(titleReveal)) * 30;

    ctx.save();
    ctx.globalAlpha = titleAlpha;
    ctx.fillStyle = colorPrimary;
    ctx.font = `bold 72px "Inter", "Helvetica Neue", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = colorAccent;
    ctx.shadowBlur = 20 * titleAlpha;
    ctx.fillText(songTitle, w / 2, titleY);
    ctx.restore();

    // Divider line
    const dividerReveal = Math.max(0, Math.min(1, (progress - 0.25) / 0.2));
    ctx.save();
    ctx.globalAlpha = ease.out(dividerReveal) * envelope;
    ctx.strokeStyle = colorAccent;
    ctx.lineWidth = 2;
    const divW = 200 * ease.out(dividerReveal);
    ctx.beginPath();
    ctx.moveTo(w / 2 - divW / 2, h * 0.5);
    ctx.lineTo(w / 2 + divW / 2, h * 0.5);
    ctx.stroke();
    ctx.restore();

    // Artist name
    const artistReveal = Math.max(0, Math.min(1, (progress - 0.3) / 0.2));
    ctx.save();
    ctx.globalAlpha = ease.out(artistReveal) * envelope;
    ctx.fillStyle = colorSecondary;
    ctx.font = `300 36px "Inter", "Helvetica Neue", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(artistName, w / 2, h * 0.58);
    ctx.restore();

    // Subtitle
    if (subtitle) {
      const subReveal = Math.max(0, Math.min(1, (progress - 0.4) / 0.2));
      ctx.save();
      ctx.globalAlpha = ease.out(subReveal) * envelope * 0.7;
      ctx.fillStyle = colorSecondary;
      ctx.font = `italic 24px "Inter", "Helvetica Neue", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(subtitle, w / 2, h * 0.67);
      ctx.restore();
    }

  } else if (style === 'glitch') {
    // Glitch effect intro
    const glitchIntensity = Math.sin(time * 15) * 0.5 + 0.5;
    const titleReveal = Math.max(0, Math.min(1, (progress - 0.05) / 0.2));

    // Random glitch bars
    if (progress < 0.6 && Math.random() > 0.7) {
      ctx.save();
      ctx.globalAlpha = 0.3 * envelope;
      const barH = Math.random() * 20 + 5;
      const barY = Math.random() * h;
      ctx.fillStyle = Math.random() > 0.5 ? '#ff0040' : '#00f0ff';
      ctx.fillRect(0, barY, w, barH);
      ctx.restore();
    }

    // Title with RGB split
    const titleAlpha = ease.out(titleReveal) * envelope;
    const offset = glitchIntensity * 4 * (progress < 0.4 ? 1 : 0.2);

    ctx.save();
    ctx.globalAlpha = titleAlpha * 0.5;
    ctx.fillStyle = '#ff0040';
    ctx.font = `bold 80px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(songTitle, w / 2 - offset, h * 0.43);
    ctx.fillStyle = '#00f0ff';
    ctx.fillText(songTitle, w / 2 + offset, h * 0.43);
    ctx.globalAlpha = titleAlpha;
    ctx.fillStyle = colorPrimary;
    ctx.fillText(songTitle, w / 2, h * 0.43);
    ctx.restore();

    // Artist
    const artistReveal = Math.max(0, Math.min(1, (progress - 0.25) / 0.2));
    ctx.save();
    ctx.globalAlpha = ease.out(artistReveal) * envelope;
    ctx.fillStyle = colorAccent;
    ctx.font = `400 32px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(artistName, w / 2, h * 0.57);
    ctx.restore();

    // Scanlines
    ctx.save();
    ctx.globalAlpha = 0.08 * envelope;
    for (let y = 0; y < h; y += 4) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, y, w, 2);
    }
    ctx.restore();

  } else if (style === 'neon') {
    const titleReveal = Math.max(0, Math.min(1, (progress - 0.1) / 0.2));
    const pulse = Math.sin(time * 3) * 0.3 + 0.7;

    // Neon glow background
    const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.5);
    grad.addColorStop(0, `rgba(128, 0, 255, ${0.15 * envelope})`);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Title with neon glow
    const titleAlpha = ease.out(titleReveal) * envelope;
    ctx.save();
    ctx.globalAlpha = titleAlpha;
    ctx.fillStyle = colorAccent;
    ctx.font = `bold 78px "Inter", "Helvetica Neue", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = colorAccent;
    ctx.shadowBlur = 30 * pulse;
    ctx.fillText(songTitle, w / 2, h * 0.43);
    // Double glow
    ctx.shadowBlur = 60 * pulse;
    ctx.globalAlpha = titleAlpha * 0.5;
    ctx.fillText(songTitle, w / 2, h * 0.43);
    ctx.restore();

    // Artist
    const artistReveal = Math.max(0, Math.min(1, (progress - 0.3) / 0.2));
    ctx.save();
    ctx.globalAlpha = ease.out(artistReveal) * envelope;
    ctx.fillStyle = '#ff00ff';
    ctx.font = `300 36px "Inter", "Helvetica Neue", sans-serif`;
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 15 * pulse;
    ctx.fillText(artistName, w / 2, h * 0.58);
    ctx.restore();

  } else if (style === 'particles') {
    // Initialize particles on first frame
    if (!particles) {
      particles = createParticles(150, w, h, [colorAccent, colorPrimary, colorSecondary]);
    }
    drawParticles(ctx, particles, envelope);

    // Title emerges from particles
    const titleReveal = Math.max(0, Math.min(1, (progress - 0.15) / 0.25));
    ctx.save();
    ctx.globalAlpha = ease.out(titleReveal) * envelope;
    ctx.fillStyle = colorPrimary;
    ctx.font = `bold 72px "Inter", "Helvetica Neue", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = colorAccent;
    ctx.shadowBlur = 25;
    ctx.fillText(songTitle, w / 2, h * 0.43);
    ctx.restore();

    const artistReveal = Math.max(0, Math.min(1, (progress - 0.3) / 0.2));
    ctx.save();
    ctx.globalAlpha = ease.out(artistReveal) * envelope;
    ctx.fillStyle = colorSecondary;
    ctx.font = `300 36px "Inter", "Helvetica Neue", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(artistName, w / 2, h * 0.58);
    ctx.restore();

    return particles;

  } else {
    // minimal
    const titleReveal = Math.max(0, Math.min(1, (progress - 0.15) / 0.3));
    ctx.save();
    ctx.globalAlpha = ease.out(titleReveal) * envelope;
    ctx.fillStyle = colorPrimary;
    ctx.font = `200 64px "Inter", "Helvetica Neue", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(songTitle, w / 2, h * 0.45);
    ctx.restore();

    const artistReveal = Math.max(0, Math.min(1, (progress - 0.3) / 0.25));
    ctx.save();
    ctx.globalAlpha = ease.out(artistReveal) * envelope;
    ctx.fillStyle = colorSecondary;
    ctx.font = `300 32px "Inter", "Helvetica Neue", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(artistName, w / 2, h * 0.56);
    ctx.restore();
  }

  return particles;
}

/**
 * Render a single frame of the outro animation.
 */
export function renderOutroFrame(
  ctx: CanvasRenderingContext2D,
  config: OutroConfig,
  time: number
) {
  const { songTitle, artistName, credits, socialLinks, style, duration, colorPrimary = '#ffffff', colorSecondary = '#94a3b8' } = config;
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const progress = Math.min(time / duration, 1);

  // Fade envelope
  let envelope = 1;
  if (progress < 0.1) envelope = ease.out(progress / 0.1);
  else if (progress > 0.9) envelope = ease.in((1 - progress) / 0.1);

  // Black background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, w, h);

  if (style === 'scroll') {
    // Classic scrolling credits
    const totalLines = credits.length + 3; // title + artist + gap + credits
    const lineHeight = 70;
    const totalHeight = totalLines * lineHeight + h;
    const scrollY = h - progress * totalHeight;

    ctx.save();
    ctx.globalAlpha = envelope;
    ctx.textAlign = 'center';

    // Song title
    let y = scrollY;
    ctx.fillStyle = colorPrimary;
    ctx.font = `bold 48px "Inter", "Helvetica Neue", sans-serif`;
    ctx.fillText(songTitle, w / 2, y);

    // Artist
    y += lineHeight;
    ctx.fillStyle = colorSecondary;
    ctx.font = `300 32px "Inter", "Helvetica Neue", sans-serif`;
    ctx.fillText(`by ${artistName}`, w / 2, y);

    // Gap
    y += lineHeight * 1.5;

    // Credits
    credits.forEach(credit => {
      ctx.fillStyle = colorSecondary;
      ctx.font = `300 20px "Inter", "Helvetica Neue", sans-serif`;
      ctx.fillText(credit.role.toUpperCase(), w / 2, y);
      y += 30;
      ctx.fillStyle = colorPrimary;
      ctx.font = `bold 28px "Inter", "Helvetica Neue", sans-serif`;
      ctx.fillText(credit.name, w / 2, y);
      y += lineHeight;
    });

    // Social links
    if (socialLinks && socialLinks.length > 0) {
      y += lineHeight * 0.5;
      socialLinks.forEach(link => {
        ctx.fillStyle = colorSecondary;
        ctx.font = `300 22px "Inter", "Helvetica Neue", sans-serif`;
        ctx.fillText(`${link.platform}: ${link.handle}`, w / 2, y);
        y += 40;
      });
    }

    ctx.restore();

  } else if (style === 'cinematic') {
    // Cinematic fade-in credits with staggered reveals
    const centerY = h * 0.3;
    const titleReveal = Math.max(0, Math.min(1, progress / 0.15));

    ctx.save();
    ctx.textAlign = 'center';

    // Title
    ctx.globalAlpha = ease.out(titleReveal) * envelope;
    ctx.fillStyle = colorPrimary;
    ctx.font = `bold 56px "Inter", "Helvetica Neue", sans-serif`;
    ctx.fillText(songTitle, w / 2, centerY);

    // Artist
    const artistReveal = Math.max(0, Math.min(1, (progress - 0.08) / 0.15));
    ctx.globalAlpha = ease.out(artistReveal) * envelope;
    ctx.fillStyle = colorSecondary;
    ctx.font = `300 30px "Inter", "Helvetica Neue", sans-serif`;
    ctx.fillText(artistName, w / 2, centerY + 50);

    // Credits - staggered
    const creditsStartY = centerY + 120;
    credits.forEach((credit, i) => {
      const delay = 0.2 + i * 0.08;
      const reveal = Math.max(0, Math.min(1, (progress - delay) / 0.12));
      ctx.globalAlpha = ease.out(reveal) * envelope;

      ctx.fillStyle = colorSecondary;
      ctx.font = `300 18px "Inter", "Helvetica Neue", sans-serif`;
      ctx.fillText(credit.role.toUpperCase(), w / 2, creditsStartY + i * 55);

      ctx.fillStyle = colorPrimary;
      ctx.font = `500 26px "Inter", "Helvetica Neue", sans-serif`;
      ctx.fillText(credit.name, w / 2, creditsStartY + i * 55 + 26);
    });

    ctx.restore();

  } else if (style === 'modern') {
    // Modern split-screen style
    const leftX = w * 0.35;
    const rightX = w * 0.65;

    // Vertical divider line
    const lineReveal = Math.max(0, Math.min(1, progress / 0.2));
    ctx.save();
    ctx.globalAlpha = 0.3 * ease.out(lineReveal) * envelope;
    ctx.strokeStyle = colorSecondary;
    ctx.lineWidth = 1;
    const lineH = h * 0.6 * ease.out(lineReveal);
    ctx.beginPath();
    ctx.moveTo(w / 2, h * 0.2);
    ctx.lineTo(w / 2, h * 0.2 + lineH);
    ctx.stroke();
    ctx.restore();

    // Left side: title + artist
    const titleReveal = Math.max(0, Math.min(1, (progress - 0.1) / 0.2));
    ctx.save();
    ctx.globalAlpha = ease.out(titleReveal) * envelope;
    ctx.textAlign = 'right';
    ctx.fillStyle = colorPrimary;
    ctx.font = `bold 48px "Inter", "Helvetica Neue", sans-serif`;
    ctx.fillText(songTitle, leftX, h * 0.4);
    ctx.fillStyle = colorSecondary;
    ctx.font = `300 28px "Inter", "Helvetica Neue", sans-serif`;
    ctx.fillText(artistName, leftX, h * 0.4 + 45);
    ctx.restore();

    // Right side: credits
    ctx.save();
    ctx.textAlign = 'left';
    credits.forEach((credit, i) => {
      const delay = 0.15 + i * 0.06;
      const reveal = Math.max(0, Math.min(1, (progress - delay) / 0.15));
      ctx.globalAlpha = ease.out(reveal) * envelope;

      const y = h * 0.35 + i * 50;
      ctx.fillStyle = colorSecondary;
      ctx.font = `300 16px "Inter", "Helvetica Neue", sans-serif`;
      ctx.fillText(credit.role.toUpperCase(), rightX, y);
      ctx.fillStyle = colorPrimary;
      ctx.font = `500 22px "Inter", "Helvetica Neue", sans-serif`;
      ctx.fillText(credit.name, rightX, y + 22);
    });
    ctx.restore();

  } else {
    // minimal
    const titleReveal = Math.max(0, Math.min(1, progress / 0.2));
    ctx.save();
    ctx.textAlign = 'center';
    ctx.globalAlpha = ease.out(titleReveal) * envelope;
    ctx.fillStyle = colorPrimary;
    ctx.font = `200 52px "Inter", "Helvetica Neue", sans-serif`;
    ctx.fillText(songTitle, w / 2, h * 0.4);
    ctx.fillStyle = colorSecondary;
    ctx.font = `300 28px "Inter", "Helvetica Neue", sans-serif`;
    ctx.fillText(artistName, w / 2, h * 0.4 + 50);
    ctx.restore();
  }
}

/**
 * Render a full intro animation to a video Blob using Canvas + MediaRecorder.
 */
export async function renderIntroToVideo(
  config: IntroConfig,
  fps: number = 30
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d')!;
  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
  const chunks: Blob[] = [];

  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

  return new Promise((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }));
    recorder.start();

    let particles: Particle[] | undefined;
    const totalFrames = Math.ceil(config.duration * fps);
    let frame = 0;

    const renderNext = () => {
      if (frame >= totalFrames) {
        recorder.stop();
        return;
      }
      const time = frame / fps;
      particles = renderIntroFrame(ctx, config, time, particles);
      frame++;
      requestAnimationFrame(renderNext);
    };

    renderNext();
  });
}

/**
 * Render a full outro animation to a video Blob.
 */
export async function renderOutroToVideo(
  config: OutroConfig,
  fps: number = 30
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d')!;
  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
  const chunks: Blob[] = [];

  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

  return new Promise((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }));
    recorder.start();

    const totalFrames = Math.ceil(config.duration * fps);
    let frame = 0;

    const renderNext = () => {
      if (frame >= totalFrames) {
        recorder.stop();
        return;
      }
      const time = frame / fps;
      renderOutroFrame(ctx, config, time);
      frame++;
      requestAnimationFrame(renderNext);
    };

    renderNext();
  });
}
