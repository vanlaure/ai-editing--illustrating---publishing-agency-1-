import { Router } from 'express';

type AspectRatio = '3:4' | '16:9' | '1:1';

const POLLINATIONS_BASE_URL = (process.env.POLLINATIONS_BASE_URL || 'https://image.pollinations.ai/prompt/').trim();
const PUBLIC_IMAGE_FALLBACK_BASE_URL = 'https://picsum.photos';

const sanitizePrompt = (prompt?: string): string => {
  if (!prompt) return 'cinematic concept art';
  return prompt.replace(/\s+/g, ' ').trim().slice(0, 400) || 'cinematic concept art';
};

const aspectDimensions: Record<AspectRatio, [number, number]> = {
  '16:9': [1024, 576],
  '1:1': [896, 896],
  '3:4': [768, 1024],
};

const fetchAsBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url, { cache: 'no-store', headers: { Accept: 'image/png,image/jpeg,*/*' } });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  return buffer.toString('base64');
};

const fetchPollinationsBatch = async (prompt: string, count: number, aspectRatio: AspectRatio) => {
  const [width, height] = aspectDimensions[aspectRatio];
  const baseUrl = POLLINATIONS_BASE_URL.endsWith('/') ? POLLINATIONS_BASE_URL : `${POLLINATIONS_BASE_URL}/`;
  const results: string[] = [];

  for (let i = 0; i < count; i += 1) {
    const seed = Math.floor(Math.random() * 1_000_000);
    const encodedPrompt = encodeURIComponent(prompt);
    const url = new URL(encodedPrompt, baseUrl);
    url.searchParams.set('width', width.toString());
    url.searchParams.set('height', height.toString());
    url.searchParams.set('seed', seed.toString());
    url.searchParams.set('nologo', 'true');
    url.searchParams.set('model', 'flux');

    results.push(await fetchAsBase64(url.toString()));
  }

  return results;
};

const fetchPublicFallbackBatch = async (count: number, aspectRatio: AspectRatio) => {
  const [width, height] = aspectDimensions[aspectRatio];
  const results: string[] = [];

  for (let i = 0; i < count; i += 1) {
    const seed = Math.floor(Math.random() * 1_000_000);
    const url = `${PUBLIC_IMAGE_FALLBACK_BASE_URL}/seed/${seed}/${width}/${height}`;
    results.push(await fetchAsBase64(url));
  }

  return results;
};

export const createImageRouter = () => {
  const router = Router();

  router.post('/image-proxy', async (req, res) => {
    const prompt = sanitizePrompt(req.body?.prompt);
    const requestedCount = Number.parseInt(req.body?.count, 10) || 1;
    const count = Math.min(Math.max(requestedCount, 1), 8);
    const aspectRatio: AspectRatio = ['3:4', '16:9', '1:1'].includes(req.body?.aspectRatio)
      ? req.body.aspectRatio
      : '3:4';

    try {
      const images = await fetchPollinationsBatch(prompt, count, aspectRatio);
      res.json({ provider: 'pollinations', images });
    } catch (pollinationsError) {
      console.warn('Pollinations image request failed. Falling back to public imagery.', pollinationsError);
      try {
        const images = await fetchPublicFallbackBatch(count, aspectRatio);
        res.json({ provider: 'picsum', images });
      } catch (fallbackError) {
        console.error('Public image fallback failed.', fallbackError);
        res.status(502).json({ error: 'Image providers unavailable. Please try again later.' });
      }
    }
  });

  return router;
};
