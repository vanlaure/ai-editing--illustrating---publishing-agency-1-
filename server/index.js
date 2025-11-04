const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs').promises;
const { exec } = require('child_process');
const { promisify } = require('util');
const http = require('http');
const https = require('https');

// Load environment variables from project root .env.local (if present), then server/.env
try {
  dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });
  dotenv.config();
} catch (e) {
  // ignore if dotenv not available
}

const execAsync = promisify(exec);
const app = express();
const PORT = 3002;
const A1111_URL = process.env.A1111_API_URL || 'http://localhost:7860';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = 'uploads';
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/images', express.static('data/images'));
app.use('/videos', express.static('data/videos'));
app.use('/audio', express.static('data/audio'));

// Ensure directories exist
async function ensureDirectories() {
  const dirs = [
    'data/productions',
    'data/images',
    'data/videos',
    'data/audio',
    'uploads'
  ];
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }
}

// ==================== PRODUCTION ENDPOINTS ====================

// Get all productions
app.get('/api/productions', async (req, res) => {
  try {
    const files = await fs.readdir('data/productions');
    const productions = await Promise.all(
      files
        .filter(f => f.endsWith('.json'))
        .map(async file => {
          const content = await fs.readFile(path.join('data/productions', file), 'utf-8');
          return JSON.parse(content);
        })
    );
    res.json(productions);
  } catch (error) {
    console.error('Error fetching productions:', error);
    res.json([]); // Return empty array if no productions yet
  }
});

// Get single production
app.get('/api/productions/:id', async (req, res) => {
  try {
    const filePath = path.join('data/productions', `${req.params.id}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    res.json(JSON.parse(content));
  } catch (error) {
    console.error('Error fetching production:', error);
    res.status(404).json({ error: 'Production not found' });
  }
});

// Save/Update production
app.post('/api/productions', async (req, res) => {
  try {
    const production = req.body;
    const id = production.id || Date.now().toString();
    production.id = id;
    production.updatedAt = new Date().toISOString();
    
    const filePath = path.join('data/productions', `${id}.json`);
    await fs.writeFile(filePath, JSON.stringify(production, null, 2));
    
    res.json({ success: true, id, production });
  } catch (error) {
    console.error('Error saving production:', error);
    res.status(500).json({ error: 'Failed to save production' });
  }
});

// Delete production
app.delete('/api/productions/:id', async (req, res) => {
  try {
    const filePath = path.join('data/productions', `${req.params.id}.json`);
    await fs.unlink(filePath);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting production:', error);
    res.status(500).json({ error: 'Failed to delete production' });
  }
});

// ==================== IMAGE ENDPOINTS ====================

// Upload image
app.post('/api/images/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const imageId = Date.now().toString();
    const ext = path.extname(req.file.originalname);
    const filename = `${imageId}${ext}`;
    const destPath = path.join('data/images', filename);
    
    await fs.rename(req.file.path, destPath);
    
    const imageUrl = `http://localhost:${PORT}/images/${filename}`;
    res.json({ success: true, url: imageUrl, filename });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Upload multiple images
app.post('/api/images/upload-batch', upload.array('images', 100), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }

    const images = await Promise.all(
      req.files.map(async (file, index) => {
        const imageId = `${Date.now()}-${index}`;
        const ext = path.extname(file.originalname);
        const filename = `${imageId}${ext}`;
        const destPath = path.join('data/images', filename);
        
        await fs.rename(file.path, destPath);
        
        return {
          url: `http://localhost:${PORT}/images/${filename}`,
          filename
        };
      })
    );
    
    res.json({ success: true, images });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ error: 'Failed to upload images' });
  }
});

// ==================== AUDIO ENDPOINTS ====================

// Upload audio
app.post('/api/audio/upload', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const audioId = Date.now().toString();
    const ext = path.extname(req.file.originalname);
    const filename = `${audioId}${ext}`;
    const destPath = path.join('data/audio', filename);
    
    await fs.rename(req.file.path, destPath);
    
    const audioUrl = `http://localhost:${PORT}/audio/${filename}`;
    res.json({ success: true, url: audioUrl, filename });
  } catch (error) {
    console.error('Error uploading audio:', error);
    res.status(500).json({ error: 'Failed to upload audio' });
  }
});

// Upload video clip (used when front-end has blob clip URLs)
app.post('/api/videos/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const videoId = Date.now().toString();
    const ext = path.extname(req.file.originalname) || '.mp4';
    const filename = `${videoId}${ext}`;
    const destPath = path.join('data/videos', filename);

    await fs.rename(req.file.path, destPath);

    const videoUrl = `http://localhost:${PORT}/videos/${filename}`;
    res.json({ success: true, url: videoUrl, filename });
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({ error: 'Failed to upload video' });
  }
});

// ==================== VIDEO PROCESSING ENDPOINTS ====================

// Generate video from storyboard
app.post('/api/video/generate', async (req, res) => {
  try {
    const { scenes, audioUrl, title, artist, width = 1280, height = 720, fps = 30 } = req.body;

    if (!scenes || scenes.length === 0) {
      return res.status(400).json({ error: 'No scenes provided' });
    }

    console.log(`Generating video for ${title} by ${artist}`);
    console.log(`Processing ${scenes.length} scenes`);
    try {
      scenes.slice(0, 5).forEach((s, idx) => {
        const u = s.imageUrl || '';
        console.log(`  scene[${idx}] url=${u.substring(0, 120)}${u.length>120?'…':''}`);
      });
    } catch (_) {}

    // Create job directory
    const jobId = Date.now().toString();
    const jobDir = path.join('data/videos', `job_${jobId}`);
    await fs.mkdir(jobDir, { recursive: true });

    // Helper: download a URL to a file (handles redirects + basic sanitization)
    const downloadWithRedirects = (url, destPath, redirectsLeft = 5) => new Promise((resolve, reject) => {
      try {
        const protocol = url.startsWith('https') ? https : http;
        const req = protocol.get(url, (response) => {
          const status = response.statusCode || 0;
          // Follow redirects
          if ([301, 302, 303, 307, 308].includes(status) && response.headers.location && redirectsLeft > 0) {
            const nextUrl = new URL(response.headers.location, url).toString();
            response.resume(); // discard data
            return resolve(downloadWithRedirects(nextUrl, destPath, redirectsLeft - 1));
          }
          if (status < 200 || status >= 300) {
            return reject(new Error(`HTTP ${status} for ${url}`));
          }
          const file = require('fs').createWriteStream(destPath);
          response.pipe(file);
          file.on('finish', () => file.close(resolve));
          file.on('error', (err) => reject(err));
        });
        req.on('error', reject);
        // Timeout after 20s
        req.setTimeout(20000, () => {
          req.destroy(new Error('Request timeout'));
        });
      } catch (e) {
        reject(e);
      }
    });

    // Build normalized per-scene segments (from images or videos), then concat
    const segmentFiles = [];
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const duration = Math.max(0.1, Number(scene.duration) || 3);
      const widthNum = Number(scene.width) || Number(width) || 1280;
      const heightNum = Number(scene.height) || Number(height) || 720;

      const imageUrl = scene.imageUrl;
      const videoUrl = scene.videoUrl;

      let inputPath = null;
      let isVideo = false;

      if (videoUrl && typeof videoUrl === 'string') {
        isVideo = true;
        if (videoUrl.startsWith('http')) {
          let baseName = 'clip.mp4';
          try { baseName = path.basename(new URL(videoUrl).pathname) || 'clip.mp4'; } catch (_) {}
          baseName = baseName.split('?')[0].split('#')[0].replace(/[^a-zA-Z0-9._-]/g, '_');
          inputPath = path.join(jobDir, `scene_${i}_${baseName}`);
          try { await downloadWithRedirects(videoUrl, inputPath); } catch (err) {
            console.error(`Failed to download video ${videoUrl}:`, err); continue;
          }
        } else if (videoUrl.startsWith('data:video')) {
          const base64Data = videoUrl.split(',')[1];
          inputPath = path.join(jobDir, `scene_${i}.mp4`);
          await fs.writeFile(inputPath, Buffer.from(base64Data, 'base64'));
        } else if (videoUrl.startsWith(`http://localhost:${PORT}/videos/`)) {
          const filename = videoUrl.split('/').pop();
          inputPath = path.join('data/videos', filename);
        }
      }

      if (!inputPath && imageUrl && typeof imageUrl === 'string' && !imageUrl.includes('error')) {
        if (imageUrl.startsWith('http')) {
          let baseName = 'image.png';
          try { baseName = path.basename(new URL(imageUrl).pathname) || 'image.png'; } catch (_) {}
          baseName = baseName.split('?')[0].split('#')[0].replace(/[^a-zA-Z0-9._-]/g, '_');
          inputPath = path.join(jobDir, `scene_${i}_${baseName}`);
          try { await downloadWithRedirects(imageUrl, inputPath); } catch (err) {
            console.error(`Failed to download image ${imageUrl}:`, err); continue;
          }
        } else if (imageUrl.startsWith('data:image')) {
          const base64Data = imageUrl.split(',')[1];
          inputPath = path.join(jobDir, `scene_${i}.png`);
          await fs.writeFile(inputPath, Buffer.from(base64Data, 'base64'));
        } else if (imageUrl.startsWith(`http://localhost:${PORT}/images/`)) {
          const filename = imageUrl.split('/').pop();
          inputPath = path.join('data/images', filename);
        }
      }

      if (!inputPath) continue;

      const segmentPath = path.join(jobDir, `segment_${i}.mp4`);
      const vf = `scale=${widthNum}:${heightNum}:force_original_aspect_ratio=decrease,pad=${widthNum}:${heightNum}:(ow-iw)/2:(oh-ih)/2,fps=${Number(fps) || 30}`;
      const cmd = isVideo
        ? `ffmpeg -y -i "${inputPath}" -t ${duration} -vf "${vf}" -c:v libx264 -pix_fmt yuv420p "${segmentPath}"`
        : `ffmpeg -y -loop 1 -t ${duration} -i "${inputPath}" -vf "${vf}" -c:v libx264 -pix_fmt yuv420p "${segmentPath}"`;
      console.log('Building segment', i, cmd);
      await execAsync(cmd);
      segmentFiles.push(segmentPath);
    }

    if (segmentFiles.length === 0) {
      return res.status(400).json({ error: 'No valid media found in scenes' });
    }

    // Concat normalized segments
    const concatFile = path.join(jobDir, 'concat.txt');
    await fs.writeFile(concatFile, segmentFiles.map(p => `file '${path.relative(jobDir, p)}'`).join('\n'));
    const combinedVideo = path.join(jobDir, 'combined.mp4');
    const concatCmd = `ffmpeg -y -f concat -safe 0 -i "${concatFile}" -c:v libx264 -pix_fmt yuv420p "${combinedVideo}"`;
    console.log('Concatenating segments:', concatCmd);
    await execAsync(concatCmd);

    // Attach audio if provided
    let audioPath;
    if (audioUrl && audioUrl.startsWith('http://localhost')) {
      const audioFilename = audioUrl.split('/').pop();
      audioPath = path.join('data/audio', audioFilename);
    }

    const outputVideo = path.join(jobDir, 'output.mp4');
    if (audioPath) {
      const muxCmd = `ffmpeg -y -i "${combinedVideo}" -i "${audioPath}" -c:v libx264 -c:a aac -shortest -pix_fmt yuv420p "${outputVideo}"`;
      console.log('Muxing audio:', muxCmd);
      await execAsync(muxCmd);
    } else {
      await fs.rename(combinedVideo, outputVideo);
    }

    // Return video URL
    const videoUrl = `http://localhost:${PORT}/videos/job_${jobId}/output.mp4`;
    res.json({ 
      success: true, 
      videoUrl,
      jobId 
    });

  } catch (error) {
    console.error('Error generating video:', error);
    res.status(500).json({ 
      error: 'Failed to generate video', 
      details: error.message 
    });
  }
});

// ==================== AUTOMATIC1111 ENDPOINTS ====================

// Check A1111 health
app.get('/api/a1111/health', async (req, res) => {
  try {
    const response = await fetch(`${A1111_URL}/internal/ping`);
    if (response.ok) {
      res.json({ status: 'ok', available: true });
    } else {
      res.json({ status: 'error', available: false });
    }
  } catch (error) {
    res.json({ status: 'error', available: false, error: error.message });
  }
});

// Generate image with A1111
app.post('/api/a1111/generate', async (req, res) => {
  try {
    const {
      prompt,
      negative_prompt = 'blurry, low quality, worst quality, bad anatomy, extra limbs, watermark, text',
      width = 512,
      height = 512,
      steps = 20,
      cfg_scale = 7,
      sampler_name = 'DPM++ 2M Karras',
      model = 'realisticVisionV51_v51VAE.safetensors',
      lora = 'add_detail:0.7,more_details:0.5',
      vae = 'vae-ft-mse-840000-ema-pruned.safetensors',
      init_image = null,
      denoising_strength = 0.65
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const isImg2Img = !!init_image;
    console.log('Generating image with A1111:', {
      mode: isImg2Img ? 'img2img' : 'txt2img',
      prompt: prompt.substring(0, 100),
      model,
      sampler: sampler_name,
      steps,
      hasReferenceImage: isImg2Img
    });

    // Add LoRA to prompt (A1111 format)
    const enhancedPrompt = lora ? `${prompt} <lora:${lora}>` : prompt;

    // Choose endpoint based on whether we have an init image
    const endpoint = isImg2Img ? '/sdapi/v1/img2img' : '/sdapi/v1/txt2img';
    
    const requestBody = {
      prompt: enhancedPrompt,
      negative_prompt,
      width,
      height,
      steps,
      cfg_scale,
      sampler_name,
      batch_size: 1,
      n_iter: 1
    };

    // Add img2img specific parameters
    if (isImg2Img) {
      requestBody.init_images = [init_image];
      requestBody.denoising_strength = denoising_strength;
    }

    const a1111Response = await fetch(`${A1111_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!a1111Response.ok) {
      throw new Error(`A1111 API error: ${a1111Response.statusText}`);
    }

    const result = await a1111Response.json();
    
    if (!result.images || result.images.length === 0) {
      throw new Error('No images generated');
    }

    // Return base64 image
    const imageBase64 = result.images[0];
    const imageUrl = `data:image/png;base64,${imageBase64}`;

    res.json({
      success: true,
      imageUrl,
      info: result.info
    });

  } catch (error) {
    console.error('Error generating with A1111:', error);
    res.status(500).json({
      error: 'Failed to generate image with A1111',
      details: error.message
    });
  }
});

// Generate batch images with A1111 (parallel processing)
app.post('/api/a1111/generate-batch', async (req, res) => {
  try {
    const { images, parallel = true } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'Images array is required' });
    }

    console.log(`Generating ${images.length} images with A1111 in ${parallel ? 'parallel' : 'series'} mode`);

    const generateOne = async (imageParams) => {
      const {
        prompt,
        negative_prompt = 'blurry, low quality, worst quality, bad anatomy, extra limbs, watermark, text',
        width = 512,
        height = 512
      } = imageParams;

      const enhancedPrompt = `${prompt} <lora:add_detail:0.7,more_details:0.5>`;

      const response = await fetch(`${A1111_URL}/sdapi/v1/txt2img`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          negative_prompt,
          width,
          height,
          steps: 20,
          cfg_scale: 7,
          sampler_name: 'DPM++ 2M Karras',
          batch_size: 1,
          n_iter: 1
        })
      });

      if (!response.ok) {
        throw new Error(`A1111 API error: ${response.statusText}`);
      }

      const result = await response.json();
      const imageBase64 = result.images[0];
      return { imageUrl: `data:image/png;base64,${imageBase64}` };
    };

    let results;
    if (parallel) {
      // Generate all images in parallel for speed
      results = await Promise.all(images.map(generateOne));
    } else {
      // Generate one at a time
      results = [];
      for (const imageParams of images) {
        const result = await generateOne(imageParams);
        results.push(result);
      }
    }

    res.json({
      success: true,
      images: results
    });

  } catch (error) {
    console.error('Error generating batch with A1111:', error);
    res.status(500).json({
      error: 'Failed to generate batch images with A1111',
      details: error.message
    });
  }
});
// ==================== COMFYUI ENDPOINTS ====================

const COMFYUI_URL = process.env.COMFYUI_API_URL || 'http://localhost:8188';
const COMFYUI_OUTPUT_DIR = process.env.COMFYUI_OUTPUT_DIR || '../outputs';

// Check ComfyUI health
app.get('/api/comfyui/health', async (req, res) => {
  try {
    const response = await fetch(`${COMFYUI_URL}/queue`);
    if (response.ok) {
      const data = await response.json();
      res.json({ 
        status: 'ok', 
        available: true,
        queue_running: data.queue_running?.length || 0,
        queue_pending: data.queue_pending?.length || 0
      });
    } else {
      res.json({ status: 'error', available: false });
    }
  } catch (error) {
    res.json({ status: 'error', available: false, error: error.message });
  }
});

// Helper: Create ComfyUI workflow
function createComfyUIWorkflow({ prompt, negative_prompt, width, height, steps, cfg, seed, init_image = null, denoising_strength = 1.0 }) {
  const workflow = {
    "1": {
      inputs: { ckpt_name: "realvisxlV40.safetensors" },
      class_type: "CheckpointLoaderSimple"
    },
    "2": {
      inputs: { text: prompt, clip: ["1", 1] },
      class_type: "CLIPTextEncode"
    },
    "3": {
      inputs: { text: negative_prompt, clip: ["1", 1] },
      class_type: "CLIPTextEncode"
    }
  };

  if (init_image) {
    // img2img workflow: LoadImage -> VAEEncode -> KSampler -> VAEDecode -> SaveImage
    workflow["4"] = {
      inputs: {
        image: init_image,
        upload: "image"
      },
      class_type: "LoadImage"
    };
    workflow["5"] = {
      inputs: {
        pixels: ["4", 0],  // Use only the image output, not the mask
        vae: ["1", 2]
      },
      class_type: "VAEEncode"
    };
    workflow["6"] = {
      inputs: {
        seed,
        steps,
        cfg,
        sampler_name: "euler",
        scheduler: "normal",
        denoise: denoising_strength,
        model: ["1", 0],
        positive: ["2", 0],
        negative: ["3", 0],
        latent_image: ["5", 0]
      },
      class_type: "KSampler"
    };
    workflow["7"] = {
      inputs: {
        samples: ["6", 0],
        vae: ["1", 2]
      },
      class_type: "VAEDecode"
    };
    workflow["8"] = {
      inputs: {
        filename_prefix: "comfyui",
        images: ["7", 0]  // Only save the decoded latent, not the original image
      },
      class_type: "SaveImage"
    };
  } else {
    // txt2img workflow: EmptyLatentImage -> KSampler
    workflow["4"] = {
      inputs: { width, height, batch_size: 1 },
      class_type: "EmptyLatentImage"
    };
    workflow["5"] = {
      inputs: {
        seed,
        steps,
        cfg,
        sampler_name: "euler",
        scheduler: "normal",
        denoise: 1.0,
        model: ["1", 0],
        positive: ["2", 0],
        negative: ["3", 0],
        latent_image: ["4", 0]
      },
      class_type: "KSampler"
    };
    workflow["6"] = {
      inputs: { samples: ["5", 0], vae: ["1", 2] },
      class_type: "VAEDecode"
    };
    workflow["7"] = {
      inputs: { filename_prefix: "comfyui", images: ["6", 0] },
      class_type: "SaveImage"
    };
  }

  return workflow;
}

// Helper: Create AnimateDiff video workflow
function createAnimateDiffWorkflow({
  prompt,
  negative_prompt,
  init_image,
  width = 512,
  height = 512,
  steps = 20,
  cfg = 7.0,
  seed = -1,
  frame_count = 16,
  fps = 8,
  motion_model = "mm_sd_v15_v2.ckpt"
}) {
  const workflow = {
    "1": {
      inputs: { ckpt_name: "realisticVisionV51_v51VAE.safetensors" },
      class_type: "CheckpointLoaderSimple"
    },
    "2": {
      inputs: { text: prompt, clip: ["1", 1] },
      class_type: "CLIPTextEncode"
    },
    "3": {
      inputs: { text: negative_prompt, clip: ["1", 1] },
      class_type: "CLIPTextEncode"
    },
    "6": {
      inputs: {
        width,
        height,
        batch_size: frame_count
      },
      class_type: "ADE_EmptyLatentImageLarge"
    },
    "7": {
      inputs: {
        model_name: motion_model
      },
      class_type: "ADE_LoadAnimateDiffModel"
    },
    "8": {
      inputs: {
        motion_model: ["7", 0]
      },
      class_type: "ADE_ApplyAnimateDiffModelSimple"
    },
    "9": {
      inputs: {
        model: ["1", 0],
        m_models: ["8", 0],
        beta_schedule: "autoselect"
      },
      class_type: "ADE_UseEvolvedSampling"
    },
    "10": {
      inputs: {
        seed: seed === -1 ? Math.floor(Math.random() * 4294967295) : seed,
        steps,
        cfg,
        sampler_name: "euler",
        scheduler: "normal",
        denoise: 1.0,
        model: ["9", 0],
        positive: ["2", 0],
        negative: ["3", 0],
        latent_image: ["6", 0]
      },
      class_type: "KSampler"
    },
    "11": {
      inputs: {
        samples: ["10", 0],
        vae: ["1", 2]
      },
      class_type: "VAEDecode"
    },
    "12": {
      inputs: {
        filename_prefix: "animatediff",
        images: ["11", 0],
        frame_rate: fps,
        loop_count: 0,
        pingpong: false,
        save_output: true,
        format: "video/h264-mp4"
      },
      class_type: "VHS_VideoCombine"
    },
    "13": {
      inputs: {
        filename_prefix: "frames",
        images: ["11", 0]
      },
      class_type: "SaveImage"
    }
  };

  return workflow;
}
// Helper: Create HunyuanVideo I2V workflow using correct nodes
function createHunyuanVideoWorkflow({
  prompt,
  negative_prompt,
  init_image,
  width = 1280,
  height = 720,
  steps = 30,
  cfg = 8.0,
  seed = -1,
  frame_count = 48,
  fps = 24,
  denoise = 0.85,
  camera_motion = "static"
}) {
  const workflow = {
    "1": {
      inputs: {
        model: [],
        base_precision: "bf16",
        quantization: "fp8_e4m3fn_fast",
        load_device: "main_device",
        attention_mode: "sdpa"
      },
      class_type: "HyVideoModelLoader"
    },
    "2": {
      inputs: {
        image: init_image,
        upload: "image"
      },
      class_type: "LoadImage"
    },
    "3": {
      inputs: {
        clip_name: []
      },
      class_type: "CLIPVisionLoader"
    },
    "4": {
      inputs: {
        clip_vision: ["3", 0],
        image: ["2", 0]
      },
      class_type: "CLIPVisionEncode"
    },
    "5": {
      inputs: {
        clip_name: []
      },
      class_type: "CLIPLoader"
    },
    "6": {
      inputs: {
        clip: ["5", 0],
        clip_vision_output: ["4", 0],
        prompt: prompt,
        image_interleave: 2
      },
      class_type: "TextEncodeHunyuanVideo_ImageToVideo"
    },
    "7": {
      inputs: {
        positive: ["6", 0],
        vae: ["10", 0],
        width,
        height,
        length: frame_count,
        batch_size: 1,
        guidance_type: "v2 (replace)",
        start_image: ["2", 0]
      },
      class_type: "HunyuanImageToVideo"
    },
    "8": {
      inputs: {
        seed: seed === -1 ? Math.floor(Math.random() * 4294967295) : seed,
        steps,
        cfg,
        sampler_name: "euler",
        scheduler: "simple",
        denoise,
        model: ["1", 0],
        positive: ["7", 0],
        negative: ["7", 0],
        latent_image: ["7", 1]
      },
      class_type: "KSampler"
    },
    "9": {
      inputs: {
        samples: ["8", 0],
        vae: ["10", 0]
      },
      class_type: "VAEDecode"
    },
    "10": {
      inputs: {
        model_name: ["vae-ft-mse-840000-ema-pruned.safetensors"],
        precision: "bf16"
      },
      class_type: "HyVideoVAELoader"
    },
    "11": {
      inputs: {
        filename_prefix: "hunyuan_video",
        images: ["9", 0],
        frame_rate: fps,
        loop_count: 0,
        pingpong: false,
        save_output: true,
        format: "video/h264-mp4"
      },
      class_type: "VHS_VideoCombine"
    },
    "12": {
      inputs: {
        filename_prefix: "hunyuan_frames",
        images: ["9", 0]
      },
      class_type: "SaveImage"
    }
  };

  return workflow;
}


// Helper: Get ComfyUI progress for a prompt
async function getComfyUIProgress(promptId) {
  try {
    // Check queue for current progress
    const queueResponse = await fetch(`${COMFYUI_URL}/queue`);
    const queueData = await queueResponse.json();
    
    // Check if prompt is in running queue
    const runningItem = queueData.queue_running?.find(item => item[1] === promptId);
    if (runningItem) {
      // Estimate progress based on queue position and typical execution time
      // This is a rough estimate since ComfyUI doesn't expose detailed progress
      return { progress: 50, status: 'processing' };
    }
    
    // Check pending queue
    const pendingIndex = queueData.queue_pending?.findIndex(item => item[1] === promptId);
    if (pendingIndex >= 0) {
      // Calculate progress based on queue position
      const progress = Math.max(5, 40 - (pendingIndex * 5));
      return { progress, status: 'queued' };
    }
    
    // Check history for completion
    const historyResponse = await fetch(`${COMFYUI_URL}/history/${promptId}`);
    const history = await historyResponse.json();
    
    if (history[promptId]) {
      const status = history[promptId].status;
      if (status.completed) {
        return { progress: 100, status: 'completed' };
      }
      if (status.status_str === 'error') {
        return { progress: 0, status: 'error', error: status.messages };
      }
    }
    
    return { progress: 10, status: 'unknown' };
  } catch (error) {
    console.error('Error getting ComfyUI progress:', error);
    return { progress: 0, status: 'error', error: error.message };
  }
}

// Helper: Poll ComfyUI for completion
async function pollComfyUICompletion(promptId, maxAttempts = 120, intervalMs = 2000) {
  console.log(`ComfyUI: Starting poll for prompt_id: ${promptId}, max wait: ${maxAttempts * intervalMs / 1000}s`);
  
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`${COMFYUI_URL}/history/${promptId}`);
    const history = await response.json();
    
    if (history[promptId]) {
      const status = history[promptId].status;
      console.log(`ComfyUI: Poll attempt ${i + 1}/${maxAttempts} - Status:`, status.status_str || 'unknown');
      
      if (status.completed) {
        console.log(`ComfyUI: Generation completed after ${i + 1} attempts (${(i + 1) * intervalMs / 1000}s)`);
        return history[promptId];
      }
      if (status.status_str === 'error') {
        throw new Error(`ComfyUI generation failed: ${JSON.stringify(status.messages)}`);
      }
    } else {
      console.log(`ComfyUI: Poll attempt ${i + 1}/${maxAttempts} - No history entry yet`);
    }
    
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  
  throw new Error(`ComfyUI generation timeout after ${maxAttempts * intervalMs / 1000}s`);
}

// Helper: Save image for ComfyUI
async function uploadImageToComfyUI(base64DataUri) {
  if (!base64DataUri || !base64DataUri.startsWith('data:image/')) {
    throw new Error('Invalid base64 data URI');
  }

  // Extract the base64 data
  const matches = base64DataUri.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 data URI format');
  }

  const imageType = matches[1];
  const base64Data = matches[2];
  
  // Normalize extension (jpeg -> jpg for compatibility)
  const ext = imageType.toLowerCase() === 'jpeg' ? 'jpg' : imageType.toLowerCase();
  const filename = `ref_${Date.now()}.${ext}`;
  
  // Decode the image
  const buffer = Buffer.from(base64Data, 'base64');
  
  // Save to local folder which is mounted to ComfyUI's input folder
  const localPath = path.join('data', 'images', filename);
  await fs.writeFile(localPath, buffer);
  
  console.log(`ComfyUI: Saved reference image to ${localPath} (${buffer.length} bytes)`);
  
  // Verify file was written
  try {
    const stats = await fs.stat(localPath);
    console.log(`ComfyUI: Verified file exists, size: ${stats.size} bytes`);
  } catch (statError) {
    console.error(`ComfyUI: Failed to verify file: ${statError.message}`);
  }
  
  // Return just the filename - ComfyUI sees it via Docker volume mount
  return filename;
}

// Generate image with ComfyUI
app.post('/api/comfyui/generate', async (req, res) => {
  try {
    const {
      prompt,
      negative_prompt = 'blurry, low quality, worst quality, bad anatomy, extra limbs, watermark, text, deformed',
      width = 1024,
      height = 576,
      steps = 20,
      cfg_scale = 7.0,
      init_image = null,
      denoising_strength = 0.45
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const isImg2Img = !!init_image;
    console.log('ComfyUI: Starting generation', {
      mode: isImg2Img ? 'img2img' : 'txt2img',
      prompt: prompt.substring(0, 100),
      steps,
      cfg: cfg_scale,
      size: `${width}x${height}`,
      hasReferenceImage: isImg2Img,
      url: COMFYUI_URL
    });

    // If img2img, upload the reference image to ComfyUI
    let imageFilename = null;
    if (init_image) {
      try {
        imageFilename = await uploadImageToComfyUI(init_image);
        console.log(`ComfyUI: Reference image uploaded as ${imageFilename}`);
      } catch (error) {
        console.error('ComfyUI: Failed to upload reference image:', error);
        throw new Error(`Failed to upload reference image: ${error.message}`);
      }
    }

    // Create workflow
    let workflow;
    try {
      workflow = createComfyUIWorkflow({
        prompt,
        negative_prompt,
        width,
        height,
        steps,
        cfg: cfg_scale,
        seed: Date.now(),
        init_image: imageFilename, // Pass filename instead of base64
        denoising_strength
      });
      console.log('ComfyUI: Workflow created successfully');
    } catch (error) {
      console.error('ComfyUI: Workflow creation failed:', error);
      throw new Error(`Workflow creation failed: ${error.message}`);
    }

    // Submit workflow
    let submitResponse;
    try {
      console.log('ComfyUI: Submitting workflow to', `${COMFYUI_URL}/prompt`);
      submitResponse = await fetch(`${COMFYUI_URL}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: workflow })
      });

      if (!submitResponse.ok) {
        const errorText = await submitResponse.text();
        console.error('ComfyUI: Submit failed with status', submitResponse.status);
        console.error('ComfyUI: Error response:', errorText);
        throw new Error(`ComfyUI submit error (${submitResponse.status}): ${errorText}`);
      }
    } catch (error) {
      console.error('ComfyUI: Network error during submit:', error);
      throw new Error(`Failed to connect to ComfyUI at ${COMFYUI_URL}: ${error.message}`);
    }

    let submitResult;
    try {
      submitResult = await submitResponse.json();
      console.log('ComfyUI: Submit response:', JSON.stringify(submitResult).substring(0, 200));
    } catch (error) {
      console.error('ComfyUI: Failed to parse submit response:', error);
      throw new Error(`Invalid response from ComfyUI: ${error.message}`);
    }

    const promptId = submitResult.prompt_id;
    if (!promptId) {
      console.error('ComfyUI: No prompt_id in response:', submitResult);
      throw new Error('No prompt_id returned from ComfyUI');
    }

    console.log(`ComfyUI: Workflow submitted successfully, prompt_id: ${promptId}`);

    // Poll for completion
    let result;
    try {
      result = await pollComfyUICompletion(promptId);
      console.log('ComfyUI: Generation completed');
    } catch (error) {
      console.error('ComfyUI: Polling failed:', error);
      throw error;
    }

    // Extract output filename
    const outputNode = isImg2Img ? "8" : "7";
    console.log('ComfyUI: Extracting from output node', outputNode);
    
    const images = result.outputs?.[outputNode]?.images;
    if (!images || images.length === 0) {
      console.error('ComfyUI: No images in result. Result structure:', JSON.stringify(result).substring(0, 500));
      throw new Error('No images generated by ComfyUI');
    }

    const filename = images[0].filename;
    console.log('ComfyUI: Generated filename:', filename);
    const imageUrl = `${COMFYUI_URL}/view?filename=${filename}&type=output`;

    // Download image to local storage
    try {
      console.log('ComfyUI: Downloading image from', imageUrl);
      const imageResponse = await fetch(imageUrl);
      
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.statusText}`);
      }

      const imageBuffer = await imageResponse.arrayBuffer();
      const imageId = Date.now();
      const localFilename = `${imageId}.png`;
      const localPath = path.join('data/images', localFilename);

      await fs.writeFile(localPath, Buffer.from(imageBuffer));
      console.log('ComfyUI: Image saved to', localPath);

      const localImageUrl = `http://localhost:${PORT}/images/${localFilename}`;

      res.json({
        success: true,
        imageUrl: localImageUrl,
        promptId,
        filename: localFilename
      });
    } catch (error) {
      console.error('ComfyUI: Image download/save failed:', error);
      throw new Error(`Failed to save generated image: ${error.message}`);
    }

  } catch (error) {
    console.error('ComfyUI: Generation failed:', error.message);
    console.error('ComfyUI: Stack trace:', error.stack);
    res.status(500).json({
      error: 'Failed to generate image with ComfyUI',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Generate batch images with ComfyUI (sequential processing)
app.post('/api/comfyui/generate-batch', async (req, res) => {
  try {
    const { images } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'Images array is required' });
    }

    console.log(`Generating ${images.length} images with ComfyUI in series mode`);

    const generateOne = async (imageParams) => {
      const {
        prompt,
        negative_prompt = 'blurry, low quality, worst quality, bad anatomy, extra limbs, watermark, text, deformed',
        width = 1024,
        height = 576,
        steps = 45,
        cfg_scale = 8.5,
        init_image = null,
        denoising_strength = 0.45
      } = imageParams;

      // Create workflow
      const workflow = createComfyUIWorkflow({
        prompt,
        negative_prompt,
        width,
        height,
        steps,
        cfg: cfg_scale,
        seed: Date.now() + Math.random() * 1000,
        init_image,
        denoising_strength
      });

      // Submit workflow
      const submitResponse = await fetch(`${COMFYUI_URL}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: workflow })
      });

      const submitResult = await submitResponse.json();
      const promptId = submitResult.prompt_id;

      // Poll for completion
      const result = await pollComfyUICompletion(promptId);

      // Extract output filename
      const outputNode = init_image ? "8" : "7";
      const resultImages = result.outputs[outputNode]?.images;
      const filename = resultImages[0].filename;
      const imageUrl = `${COMFYUI_URL}/view?filename=${filename}&type=output`;

      // Download image to local storage
      const imageId = Date.now();
      const localFilename = `${imageId}.png`;
      const localPath = path.join('data/images', localFilename);

      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      await fs.writeFile(localPath, Buffer.from(imageBuffer));

      return {
        imageUrl: `http://localhost:${PORT}/images/${localFilename}`,
        filename: localFilename
      };
    };

    // Generate one at a time (ComfyUI queues them automatically)
    const results = [];
    for (const imageParams of images) {
      const result = await generateOne(imageParams);
      results.push(result);
    }

    res.json({
      success: true,
      images: results
    });

  } catch (error) {
    console.error('Error generating batch with ComfyUI:', error);
    res.status(500).json({
      error: 'Failed to generate batch images with ComfyUI',
      details: error.message
    });
  }
});

// Get ComfyUI generation progress
app.get('/api/comfyui/progress/:promptId', async (req, res) => {
  try {
    const { promptId } = req.params;
    const progressData = await getComfyUIProgress(promptId);
    res.json(progressData);
  } catch (error) {
    console.error('Error getting progress:', error);
    res.status(500).json({
      progress: 0,
      status: 'error',
      error: error.message
    });
  }
});

// Generate video clip using ComfyUI (AnimateDiff or HunyuanVideo)
app.post('/api/comfyui/generate-video-clip', async (req, res) => {
  try {
    const {
      imageUrl,
      prompt,
      negative_prompt = "blurry, low quality, distorted, deformed",
      duration,
      quality = 'draft', // 'draft' (AnimateDiff) or 'high' (HunyuanVideo)
      width,
      height,
      fps,
      steps,
      cfg,
      seed = -1,
      denoise = 0.85,
      camera_motion = 'static'
    } = req.body;

    if (!imageUrl || !prompt) {
      return res.status(400).json({ error: 'Image URL and prompt are required' });
    }

    const clipDuration = Math.max(0.5, Number(duration) || 3);
    
    // Set defaults based on quality level
    let videoWidth, videoHeight, videoFps, videoSteps, videoCfg, frameCount;
    
    if (quality === 'high') {
      // HunyuanVideo high-quality defaults (720p)
      videoWidth = Number(width) || 1280;
      videoHeight = Number(height) || 720;
      videoFps = Number(fps) || 24;
      videoSteps = Number(steps) || 30;
      videoCfg = Number(cfg) || 8.0;
      frameCount = Math.ceil(clipDuration * videoFps);
      console.log(`ComfyUI HunyuanVideo: Generating ${clipDuration}s video (${frameCount} frames @ ${videoFps}fps, ${videoWidth}x${videoHeight})`);
    } else {
      // AnimateDiff draft quality defaults (512p)
      videoWidth = Number(width) || 512;
      videoHeight = Number(height) || 512;
      videoFps = Number(fps) || 8;
      videoSteps = Number(steps) || 20;
      videoCfg = Number(cfg) || 7.0;
      frameCount = Math.ceil(clipDuration * videoFps);
      console.log(`ComfyUI AnimateDiff: Generating ${clipDuration}s video (${frameCount} frames @ ${videoFps}fps)`);
    }

    console.log(`Using image: ${imageUrl.substring(0, 100)}...`);
    console.log(`Prompt: ${prompt}`);

    // Upload image to ComfyUI
    let comfyImageName;
    if (imageUrl.startsWith('data:image')) {
      comfyImageName = await uploadImageToComfyUI(imageUrl);
    } else if (imageUrl.includes('localhost:8188/view')) {
      // Handle ComfyUI view URL: http://localhost:8188/view?filename=X
      const url = new URL(imageUrl);
      const filename = url.searchParams.get('filename');
      if (!filename) {
        return res.status(400).json({ error: 'Invalid ComfyUI view URL: missing filename parameter' });
      }
      // Download image from ComfyUI
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        return res.status(400).json({ error: `Failed to download image from ComfyUI: ${imageResponse.statusText}` });
      }
      const imageBuffer = await imageResponse.arrayBuffer();
      const base64 = `data:image/png;base64,${Buffer.from(imageBuffer).toString('base64')}`;
      comfyImageName = await uploadImageToComfyUI(base64);
    } else if (imageUrl.startsWith('http://localhost')) {
      // Handle local backend URL
      const filename = imageUrl.split('/').pop();
      const localPath = path.join('data/images', filename);
      const imageBuffer = await fs.readFile(localPath);
      const base64 = `data:image/png;base64,${imageBuffer.toString('base64')}`;
      comfyImageName = await uploadImageToComfyUI(base64);
    } else {
      return res.status(400).json({ error: 'Unsupported image URL format' });
    }

    console.log(`ComfyUI: Image uploaded as ${comfyImageName}`);

    // Build workflow based on quality level
    let workflow;
    if (quality === 'high') {
      // HunyuanVideo high-quality workflow
      workflow = createHunyuanVideoWorkflow({
        prompt,
        negative_prompt,
        init_image: comfyImageName,
        width: videoWidth,
        height: videoHeight,
        steps: videoSteps,
        cfg: videoCfg,
        seed: Number(seed) || -1,
        frame_count: frameCount,
        fps: videoFps,
        denoise: Number(denoise) || 0.85,
        camera_motion: camera_motion || 'static'
      });
    } else {
      // AnimateDiff draft quality workflow
      workflow = createAnimateDiffWorkflow({
        prompt,
        negative_prompt,
        init_image: comfyImageName,
        width: videoWidth,
        height: videoHeight,
        steps: videoSteps,
        cfg: videoCfg,
        seed: Number(seed) || -1,
        frame_count: frameCount,
        fps: videoFps
      });
    }

    // Queue workflow
    console.log('ComfyUI: Queueing workflow...');
    console.log('Workflow JSON:', JSON.stringify(workflow, null, 2));
    
    const queueResponse = await fetch(`${COMFYUI_URL}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: workflow })
    });

    if (!queueResponse.ok) {
      const errorBody = await queueResponse.text();
      console.error('ComfyUI queue error:', errorBody);
      throw new Error(`ComfyUI queue failed: ${queueResponse.statusText} - ${errorBody}`);
    }

    const queueResult = await queueResponse.json();
    const promptId = queueResult.prompt_id;
    console.log(`ComfyUI: Workflow queued with prompt_id: ${promptId}`);

    // Return prompt_id immediately for progress polling
    res.json({
      success: true,
      promptId,
      message: 'Video generation started. Poll /api/comfyui/video-status/:promptId for progress.'
    });

    // Continue processing in background (don't await)
    (async () => {
      try {
        // Poll for completion (longer timeout for HunyuanVideo)
        const maxAttempts = quality === 'high' ? 300 : 180;
        const history = await pollComfyUICompletion(promptId, maxAttempts, 3000);

        // Extract video file from outputs
        const outputs = history.outputs;
        let videoFilename = null;

        for (const nodeId in outputs) {
          const output = outputs[nodeId];
          if (output.gifs && output.gifs.length > 0) {
            videoFilename = output.gifs[0].filename;
            break;
          }
          if (output.videos && output.videos.length > 0) {
            videoFilename = output.videos[0].filename;
            break;
          }
        }

        if (!videoFilename) {
          console.error(`ComfyUI: No video output found for prompt ${promptId}`);
          return;
        }

        console.log(`ComfyUI: Video generated: ${videoFilename}`);

        // Copy video to our videos directory
        const clipId = Date.now();
        const sourceVideoPath = path.join(COMFYUI_OUTPUT_DIR, videoFilename);
        const destVideoPath = path.join('data/videos', `clip_${clipId}.mp4`);
        
        await fs.copyFile(sourceVideoPath, destVideoPath);

        // Store the result for retrieval via status endpoint
        const clipUrl = `http://localhost:${PORT}/videos/clip_${clipId}.mp4`;
        videoResults.set(promptId, {
          success: true,
          clipUrl,
          duration: clipDuration,
          frameCount,
          fps: videoFps,
          comfyui_filename: videoFilename
        });
        
        console.log(`ComfyUI: Video saved to ${destVideoPath}`);
      } catch (error) {
        console.error(`ComfyUI: Background processing error for ${promptId}:`, error);
        videoResults.set(promptId, {
          success: false,
          error: error.message
        });
      }
    })();

  } catch (error) {
    console.error('Error generating video clip:', error);
    res.status(500).json({
      error: 'Failed to generate video clip',
      details: error.message
    });
  }
});

// In-memory storage for video generation results
const videoResults = new Map();

// Get video generation status/result
app.get('/api/comfyui/video-status/:promptId', async (req, res) => {
  try {
    const { promptId } = req.params;
    
    // Check if we have a completed result
    if (videoResults.has(promptId)) {
      const result = videoResults.get(promptId);
      // Clean up after retrieving
      videoResults.delete(promptId);
      return res.json(result);
    }
    
    // Otherwise, check progress
    const progressData = await getComfyUIProgress(promptId);
    res.json(progressData);
  } catch (error) {
    console.error('Error getting video status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


// ==================== HEALTH CHECK ====================

app.get('/api/health', async (req, res) => {
  try {
    // Check if FFmpeg is installed
    await execAsync('ffmpeg -version');
    
    // Check A1111 status
    let a1111Status = 'not checked';
    try {
      const a1111Response = await fetch(`${A1111_URL}/internal/ping`, { timeout: 2000 });
      a1111Status = a1111Response.ok ? 'available' : 'unavailable';
    } catch {
      a1111Status = 'unavailable';
    }
    
    res.json({
      status: 'ok',
      message: 'AI Music Video Backend Server',
      ffmpeg: 'installed',
      a1111: a1111Status
    });
  } catch (error) {
    res.json({
      status: 'warning',
      message: 'Server running but FFmpeg not found',
      ffmpeg: 'not installed',
      a1111: 'not checked'
    });
  }
});

// Start server
ensureDirectories().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🎬 AI Music Video Backend Server`);
    console.log(`📡 Running on http://localhost:${PORT}`);
    console.log(`\n📁 Storage directories:`);
    console.log(`   - Productions: data/productions`);
    console.log(`   - Images: data/images`);
    console.log(`   - Audio: data/audio`);
    console.log(`   - Videos: data/videos`);
    console.log(`\n⚠️  Make sure FFmpeg is installed on your system`);
    console.log(`   Check: ffmpeg -version\n`);
  });
});
