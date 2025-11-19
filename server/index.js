import express from "express";
import multer from "multer";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import fs from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
import http from "http";
import https from "https";
import { WebSocketServer } from "ws";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import * as db from "./db.js";

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure FFmpeg binary is resolvable even when not installed globally.
try {
  const bundledFfmpeg = ffmpegInstaller?.path;
  if (bundledFfmpeg) {
    const ffmpegDir = path.dirname(bundledFfmpeg);
    const existingPath = process.env.PATH ? process.env.PATH.split(path.delimiter) : [];
    if (!existingPath.includes(ffmpegDir)) {
      process.env.PATH = [ffmpegDir, ...existingPath].filter(Boolean).join(path.delimiter);
    }
    process.env.FFMPEG_PATH = bundledFfmpeg;
    console.log(`[backend] Using bundled FFmpeg binary at ${bundledFfmpeg}`);
  } else {
    console.warn("[backend] @ffmpeg-installer/ffmpeg did not resolve a binary. Falling back to system FFmpeg.");
  }
} catch (ffmpegError) {
  console.warn("[backend] Failed to configure bundled FFmpeg binary:", ffmpegError);
}

// Serve generated videos statically before other routes
const tmpApp = express();
tmpApp.use('/videos', express.static(path.join(__dirname, '../data/videos'), {
 setHeaders: (res, filePath) => {
   if (filePath.endsWith('.mp4')) {
     res.set('Content-Type', 'video/mp4');
   }
 }
}));
const appInstance = tmpApp;

// Load environment variables from project root .env.local (if present), then server/.env
try {
  dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });
  dotenv.config();
} catch (e) {
  // ignore if dotenv not available
}

const execAsync = promisify(exec);
let app = global.appInstance || express();
// Backend port can be overridden via PORT or BACKEND_PORT
const DEFAULT_PORT = 3002;
const PORT_ENV = Number(process.env.PORT || process.env.BACKEND_PORT || DEFAULT_PORT);
// Keep existing reference name used below
const PORT = PORT_ENV;
// Standard backend host and port to be used consistently
const BACKEND_HOST = 'localhost';
const BACKEND_PORT = 3002;
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
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3000'], // Allow both ports
  exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length']
}));
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

// ==================== DATABASE MEDIA SERVING ENDPOINTS ====================

// Serve image from database
app.get('/api/media/image/:id', async (req, res) => {
  try {
    const imageId = parseInt(req.params.id);
    const result = db.getImageBinary(imageId);
    
    if (!result) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // If binary data exists in database, serve it
    if (result.binary_data) {
      res.setHeader('Content-Type', result.mime_type || 'image/png');
      res.setHeader('Content-Disposition', `inline; filename="${result.filename}"`);
      return res.send(result.binary_data);
    }
    
    // Fallback to filesystem if binary_data is NULL (hybrid mode)
    const filePath = path.join('data/images', result.filename);
    try {
      const fileData = await fs.readFile(filePath);
      res.setHeader('Content-Type', result.mime_type || 'image/png');
      res.setHeader('Content-Disposition', `inline; filename="${result.filename}"`);
      return res.send(fileData);
    } catch (fsError) {
      return res.status(404).json({ error: 'Image file not found' });
    }
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).json({ error: 'Failed to serve image' });
  }
});

// Serve video from database
app.get('/api/media/video/:id', async (req, res) => {
  try {
    const videoId = parseInt(req.params.id);
    const result = db.getVideoBinary(videoId);

    if (!result) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const mimeType = result.mime_type || 'video/mp4';
    const range = req.headers.range;

    // If binary data exists in database, stream with Range support
    if (result.binary_data) {
      const buffer = Buffer.from(result.binary_data);
      const total = buffer.length;

      if (range) {
        const match = /bytes=(\d+)-(\d+)?/.exec(range);
        const start = match ? parseInt(match[1], 10) : 0;
        const end = match && match[2] ? Math.min(parseInt(match[2], 10), total - 1) : Math.min(start + 1024 * 1024 - 1, total - 1); // 1MB chunks
        const chunkSize = end - start + 1;

        res.status(206);
        res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Length', chunkSize);
        res.setHeader('Content-Type', mimeType);
        return res.end(buffer.subarray(start, end + 1));
      }

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', total);
      res.setHeader('Content-Disposition', `inline; filename="${result.filename}"`);
      return res.end(buffer);
    }

    // Fallback to filesystem if binary_data is NULL (hybrid mode)
    const filePath = path.join('data/videos', result.filename);
    try {
      const stat = await require('fs').promises.stat(filePath);
      const total = stat.size;

      if (range) {
        const match = /bytes=(\d+)-(\d+)?/.exec(range);
        const start = match ? parseInt(match[1], 10) : 0;
        const end = match && match[2] ? Math.min(parseInt(match[2], 10), total - 1) : Math.min(start + 1024 * 1024 - 1, total - 1);
        const chunkSize = end - start + 1;

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${total}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': mimeType,
          'Content-Disposition': `inline; filename="${result.filename}"`
        });
        const stream = require('fs').createReadStream(filePath, { start, end });
        return stream.pipe(res);
      }

      res.writeHead(200, {
        'Content-Type': mimeType,
        'Content-Length': total,
        'Content-Disposition': `inline; filename="${result.filename}"`
      });
      const stream = require('fs').createReadStream(filePath);
      return stream.pipe(res);
    } catch (fsError) {
      return res.status(404).json({ error: 'Video file not found' });
    }
  } catch (error) {
    console.error('Error serving video:', error);
    res.status(500).json({ error: 'Failed to serve video' });
  }
});

// Serve audio from database
app.get('/api/media/audio/:id', async (req, res) => {
  try {
    const audioId = parseInt(req.params.id);
    const result = db.getAudioBinary(audioId);
    
    if (!result) {
      return res.status(404).json({ error: 'Audio not found' });
    }
    
    // If binary data exists in database, serve it
    if (result.binary_data) {
      res.setHeader('Content-Type', result.mime_type || 'audio/mpeg');
      res.setHeader('Content-Disposition', `inline; filename="${result.filename}"`);
      return res.send(result.binary_data);
    }
    
    // Fallback to filesystem if binary_data is NULL (hybrid mode)
    const filePath = path.join('data/audio', result.filename);
    try {
      const fileData = await fs.readFile(filePath);
      res.setHeader('Content-Type', result.mime_type || 'audio/mpeg');
      res.setHeader('Content-Disposition', `inline; filename="${result.filename}"`);
      return res.send(fileData);
    } catch (fsError) {
      return res.status(404).json({ error: 'Audio file not found' });
    }
  } catch (error) {
    console.error('Error serving audio:', error);
    res.status(500).json({ error: 'Failed to serve audio' });
  }
});

// ==================== IMAGE ENDPOINTS ====================

// Upload image
app.post('/api/images/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const productionId = req.body.production_id || null;
    const ext = path.extname(req.file.originalname);
    const filename = `${Date.now()}${ext}`;
    const format = ext.substring(1).toLowerCase();
    const mimeType = req.file.mimetype || `image/${format}`;
    
    // Read file binary data
    const binaryData = await fs.readFile(req.file.path);
    
    // Insert into database
    const result = db.insertImage(
      productionId,
      filename,
      null, // width - can be extracted with sharp library if needed
      null, // height - can be extracted with sharp library if needed
      format,
      binaryData.length,
      binaryData,
      mimeType
    );
    
    // Clean up temp file
    await fs.unlink(req.file.path);
    
    const imageId = result.lastInsertRowid;
    const imageUrl = `http://localhost:${PORT}/api/media/image/${imageId}`;
    res.json({ success: true, url: imageUrl, filename, id: imageId });
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

    const productionId = req.body.production_id || null;
    
    const images = await Promise.all(
      req.files.map(async (file, index) => {
        const ext = path.extname(file.originalname);
        const filename = `${Date.now()}-${index}${ext}`;
        const format = ext.substring(1).toLowerCase();
        const mimeType = file.mimetype || `image/${format}`;
        
        // Read file binary data
        const binaryData = await fs.readFile(file.path);
        
        // Insert into database
        const result = db.insertImage(
          productionId,
          filename,
          null,
          null,
          format,
          binaryData.length,
          binaryData,
          mimeType
        );
        
        // Clean up temp file
        await fs.unlink(file.path);
        
        const imageId = result.lastInsertRowid;
        return {
          url: `http://localhost:${PORT}/api/media/image/${imageId}`,
          filename,
          id: imageId
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

    const timestamp = Date.now();
    const ext = path.extname(req.file.originalname);
    const format = ext.substring(1).toLowerCase();
    const filename = `${timestamp}${ext}`;
    const mimeType = req.file.mimetype || `audio/${format}`;
    
    // Read file binary data
    const binaryData = await fs.readFile(req.file.path);
    
    // Insert into database
    const result = db.insertAudio(
      null, // production_id
      filename,
      null, // duration
      format,
      binaryData.length,
      binaryData,
      mimeType
    );
    
    // Clean up temp file
    await fs.unlink(req.file.path);
    
    const audioId = result.lastInsertRowid;
    const audioUrl = `http://localhost:${PORT}/api/media/audio/${audioId}`;
    res.json({ success: true, url: audioUrl, filename, id: audioId });
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

    const timestamp = Date.now();
    const ext = path.extname(req.file.originalname) || '.mp4';
    const format = ext.substring(1).toLowerCase();
    const filename = `${timestamp}${ext}`;
    const mimeType = req.file.mimetype || `video/${format}`;

    // Read file binary data
    const binaryData = await fs.readFile(req.file.path);
    
    // Insert into database
    const result = db.insertVideo(
      null, // production_id
      filename,
      null, // duration
      null, // width
      null, // height
      format,
      binaryData.length,
      binaryData,
      mimeType
    );
    
    // Clean up temp file
    await fs.unlink(req.file.path);

    // Always use port 3002 for the backend media URLs
    const BACKEND_PORT = 3002;
    const BACKEND_HOST = 'localhost';
    
    const videoId = result.lastInsertRowid;
    const videoUrl = `http://${BACKEND_HOST}:${BACKEND_PORT}/api/media/video/${videoId}`;
    res.json({ success: true, url: videoUrl, filename, id: videoId });
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
        if (videoUrl.startsWith(`http://localhost:${PORT}/api/media/video/`)) {
          // Database video URL - fetch from database
          const videoId = videoUrl.split('/').pop();
          const videoData = db.getVideoBinary(parseInt(videoId));
          if (videoData && videoData.binary_data) {
            inputPath = path.join(jobDir, `scene_${i}_video_${videoId}.mp4`);
            await fs.writeFile(inputPath, videoData.binary_data);
          } else {
            console.error(`Video ${videoId} not found in database`); continue;
          }
        } else if (videoUrl.startsWith('http')) {
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
          // Legacy filesystem video URL
          const filename = videoUrl.split('/').pop();
          inputPath = path.join('data/videos', filename);
        }
      }

      if (!inputPath && imageUrl && typeof imageUrl === 'string' && !imageUrl.includes('error')) {
        if (imageUrl.startsWith(`http://localhost:${PORT}/api/media/image/`)) {
          // Database image URL - fetch from database
          const imageId = imageUrl.split('/').pop();
          const imageData = db.getImageBinary(parseInt(imageId));
          if (imageData && imageData.binary_data) {
            inputPath = path.join(jobDir, `scene_${i}_image_${imageId}.png`);
            await fs.writeFile(inputPath, imageData.binary_data);
          } else {
            console.error(`Image ${imageId} not found in database`); continue;
          }
        } else if (imageUrl.startsWith('http')) {
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
          // Legacy filesystem image URL
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
    if (audioUrl) {
      if (audioUrl.startsWith(`http://localhost:${PORT}/api/media/audio/`)) {
        // Database audio URL - fetch from database
        const audioId = audioUrl.split('/').pop();
        const audioData = db.getAudioBinary(parseInt(audioId));
        if (audioData && audioData.binary_data) {
          audioPath = path.join(jobDir, `audio_${audioId}.mp3`);
          await fs.writeFile(audioPath, audioData.binary_data);
        }
      } else if (audioUrl.startsWith('http://localhost')) {
        // Legacy filesystem audio URL
        const audioFilename = audioUrl.split('/').pop();
        audioPath = path.join('data/audio', audioFilename);
      }
    }

    const outputVideo = path.join(jobDir, 'output.mp4');
    if (audioPath) {
      const muxCmd = `ffmpeg -y -i "${combinedVideo}" -i "${audioPath}" -c:v libx264 -c:a aac -shortest -pix_fmt yuv420p "${outputVideo}"`;
      console.log('Muxing audio:', muxCmd);
      await execAsync(muxCmd);
    } else {
      await fs.rename(combinedVideo, outputVideo);
    }

    // Read final video and store in database
    const videoBinary = await fs.readFile(outputVideo);
    const result = db.insertVideo(
      null, // production_id
      `output_${jobId}.mp4`,
      null, // duration
      width,
      height,
      'mp4',
      videoBinary.length,
      videoBinary,
      'video/mp4'
    );
    
    const videoId = result.lastInsertRowid;
    const videoUrl = `http://${BACKEND_HOST}:${BACKEND_PORT}/api/media/video/${videoId}`;
    
    res.json({
      success: true,
      videoUrl,
      videoId,
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
      width = 1024,
      height = 1024,
      steps = 8,
      cfg_scale = 2,
      sampler_name = 'DPM++ SDE Karras',
      model = 'juggernautXL_v9Rdphoto2Lightning.safetensors',
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
const HUNYUAN_WORKFLOW_DIR = path.join(__dirname, '..', 'workflows', 'hunyuan');
const HUNYUAN_WORKFLOW_CACHE = {};

// Cache for ComfyUI node registry to avoid repeated calls
let __comfyNodeCache = null;
let __comfyNodeCacheAt = 0;
async function getComfyNodeMap(force = false) {
  const now = Date.now();
  const cacheStale = !__comfyNodeCache || (now - __comfyNodeCacheAt > 30_000);
  if (!force && !cacheStale) return __comfyNodeCache;
  try {
    const resp = await fetch(`${COMFYUI_URL}/object_info`);
    if (resp.ok) {
      const info = await resp.json();
      __comfyNodeCache = info?.nodes || info || {};
      __comfyNodeCacheAt = now;
      return __comfyNodeCache;
    }
  } catch (_) {}
  __comfyNodeCache = {};
  __comfyNodeCacheAt = now;
  return __comfyNodeCache;
}
async function comfyHasNode(name) {
  const nodes = await getComfyNodeMap();
  return Object.prototype.hasOwnProperty.call(nodes, name);
}

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

// Helper: Create ComfyUI workflow with ultra-realistic settings
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
    // img2img workflow with DPM++ 2M Karras sampler for quality
    workflow["4"] = {
      inputs: {
        image: init_image,
        upload: "image"
      },
      class_type: "LoadImage"
    };
    workflow["5"] = {
      inputs: {
        pixels: ["4", 0],
        vae: ["1", 2]
      },
      class_type: "VAEEncode"
    };
    workflow["6"] = {
      inputs: {
        seed,
        steps,
        cfg,
        sampler_name: "dpmpp_2m",
        scheduler: "karras",
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
        sampler_name: "dpmpp_2m",
        scheduler: "karras",
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

// Helper: Enhance prompt with camera motion instructions
function enhancePromptWithMotion(prompt, cameraMotion) {
  // Concise tokens (LLaMA-3 8B optimal: <512 tokens total)
  const motionDescriptions = {
    'zoom_in': 'zoom in:1.3',
    'slow push-in': 'slow push in:1.3',
    'zoom_out': 'zoom out:1.3',
    'pan_left': 'pan left:1.3',
    'pan_right': 'pan right:1.3',
    'dynamic steadicam reveal': 'steadicam reveal:1.4',
    'static': 'static camera:1.2'
  };
  
  let motionDesc = motionDescriptions[cameraMotion?.toLowerCase()] || motionDescriptions['static'];

  // Subject action takes priority
  if (cameraMotion && !motionDescriptions[cameraMotion.toLowerCase()]) {
    const truncatedAction = cameraMotion.length > 40 ? cameraMotion.substring(0, 37) + '...' : cameraMotion;
    return `${truncatedAction}:1.5, ${prompt}, ${motionDesc}`;
  }

  return `${prompt}, ${motionDesc}`;
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
  denoise = 0.55,
  frame_count = 16,
  fps = 8,
  motion_model = "mm_sd_v15_v2.ckpt",
  checkpoint = "realisticVisionV51_v51VAE.safetensors",
  use_vhs = true,
  camera_motion = 'static'
}) {
  const enhancedPrompt = enhancePromptWithMotion(prompt, camera_motion);
  const workflow = {
    "1": {
      inputs: { ckpt_name: checkpoint },
      class_type: "CheckpointLoaderSimple"
    },
    "2": {
      inputs: { text: enhancedPrompt, clip: ["1", 1] },
      class_type: "CLIPTextEncode"
    },
    "3": {
      inputs: { text: negative_prompt, clip: ["1", 1] },
      class_type: "CLIPTextEncode"
    },
    ...(init_image ? {
      "4": {
        inputs: {
          image: init_image,
          upload: "image"
        },
        class_type: "LoadImage"
      },
      "5": {
        inputs: {
          pixels: ["4", 0],
          vae: ["1", 2]
        },
        class_type: "VAEEncode"
      },
      "6": {
        inputs: {
          samples: ["5", 0],
          amount: frame_count
        },
        class_type: "RepeatLatentBatch"
      }
    } : {
      "6": {
        inputs: {
          width,
          height,
          batch_size: frame_count
        },
        class_type: "ADE_EmptyLatentImageLarge"
      }
    }),
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
        denoise,
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
    // Video combine via VHS (if installed). When unavailable, we rely on SaveImage + ffmpeg fallback.
    ...(use_vhs ? {
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
      }
    } : {}),
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
  denoise = 0.6,
  camera_motion = "static",
  use_vhs = true
}) {
  const enhancedPrompt = enhancePromptWithMotion(prompt, camera_motion);
  const workflow = {
    "1": {
      inputs: {
        model: "hunyuan_video_720_fp8_e4m3fn.safetensors",
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
        clip_name: "clip-vit-large-patch14"
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
        clip_name: "clip-vit-large-patch14"
      },
      class_type: "CLIPLoader"
    },
    "6": {
      inputs: {
        clip: ["5", 0],
        clip_vision_output: ["4", 0],
        prompt: enhancedPrompt,
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
        negative: ["11", 0],
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
        model_name: "hunyuan_video_vae_fp16.safetensors",
        precision: "bf16"
      },
      class_type: "HyVideoVAELoader"
    },
    "11": {
      inputs: {
        clip: ["5", 0],
        clip_vision_output: ["4", 0],
        prompt: "low quality, blurry, distorted, artifacts, pixelated, poor lighting, overexposed, underexposed",
        image_interleave: 2
      },
      class_type: "TextEncodeHunyuanVideo_ImageToVideo"
    },
    // Prefer VHS for video combine if available; otherwise fall back to frames only.
    ...(use_vhs ? {
      "13": {
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
      }
    } : {}),
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

async function loadHunyuanWorkflowPreset(fileName) {
  const presetPath = path.join(HUNYUAN_WORKFLOW_DIR, fileName);
  if (!HUNYUAN_WORKFLOW_CACHE[fileName]) {
    const raw = await fs.readFile(presetPath, 'utf-8');
    HUNYUAN_WORKFLOW_CACHE[fileName] = JSON.parse(raw);
  }
  // return deep clone so we don't mutate the cached version
  return JSON.parse(JSON.stringify(HUNYUAN_WORKFLOW_CACHE[fileName]));
}

function addSaveImageFallback(workflow, decodeNodeId, nodeId, filenamePrefix) {
  workflow[nodeId] = {
    inputs: {
      filename_prefix: filenamePrefix,
      images: [decodeNodeId, 0]
    },
    class_type: "SaveImage"
  };
}

function configureVhsOrFrames(workflow, {
  vhsNodeId,
  decodeNodeId,
  hasVHS,
  fps,
  filenamePrefix,
  framesNodeId
}) {
  if (hasVHS && workflow[vhsNodeId]) {
    workflow[vhsNodeId].inputs.fps = fps;
    workflow[vhsNodeId].inputs.filename_prefix = filenamePrefix;
  } else {
    // Remove VHS node if unavailable
    if (workflow[vhsNodeId]) {
      delete workflow[vhsNodeId];
    }
  }

  // Always add a frames output for fallback
  if (framesNodeId && !workflow[framesNodeId]) {
    addSaveImageFallback(workflow, decodeNodeId, framesNodeId, `${filenamePrefix || 'hunyuan_frames'}`);
  }
}

async function buildHunyuanPresetWorkflow({
  preset,
  prompt,
  negative_prompt,
  comfyImageName,
  width,
  height,
  frameCount,
  fps,
  steps,
  cfg,
  seed,
  flow_shift,
  strength,
  hasVHS,
  filenamePrefix = 'HunyuanVideo'
}) {
  const presetFile = {
    i2v: 'hunyuan_i2v_optimized.json',
    portrait: 'hunyuan_portrait_ultra_realistic.json',
    realistic: 'hunyuan_realistic_optimized.json'
  }[preset];

  if (!presetFile) {
    throw new Error(`Unknown Hunyuan workflow preset: ${preset}`);
  }

  const workflow = await loadHunyuanWorkflowPreset(presetFile);

  if (preset === 'i2v') {
    if (!comfyImageName) {
      throw new Error('I2V workflow requires a reference image');
    }
    // Load reference image
    if (workflow["5"]?.inputs) {
      workflow["5"].inputs.image = comfyImageName;
    }
    // Prompts
    if (workflow["6"]?.inputs && prompt) {
      workflow["6"].inputs.text = prompt;
    }
    if (workflow["7"]?.inputs && negative_prompt) {
      workflow["7"].inputs.text = negative_prompt;
    }
    // Encode strength
    if (workflow["8"]?.inputs && typeof strength === 'number') {
      workflow["8"].inputs.strength = strength;
    }
    // Latent dims
    if (workflow["9"]?.inputs) {
      workflow["9"].inputs.width = width;
      workflow["9"].inputs.height = height;
      workflow["9"].inputs.length = frameCount;
    }
    // Sampler
    if (workflow["10"]?.inputs) {
      workflow["10"].inputs.seed = seed;
      workflow["10"].inputs.steps = steps;
      workflow["10"].inputs.cfg = cfg;
      workflow["10"].inputs.sampler_name = "dpmpp_2m";
      workflow["10"].inputs.scheduler = "karras";
      workflow["10"].inputs.denoise = workflow["10"].inputs.denoise ?? 1.0;
      if (typeof flow_shift === 'number') {
        workflow["10"].inputs.flow_shift = flow_shift;
      }
    }
    configureVhsOrFrames(workflow, {
      vhsNodeId: "12",
      decodeNodeId: "11",
      hasVHS,
      fps,
      filenamePrefix: `${filenamePrefix}_I2V_`,
      framesNodeId: "save_frames"
    });
  } else if (preset === 'portrait') {
    if (workflow["4"]?.inputs && prompt) {
      workflow["4"].inputs.text = prompt;
    }
    if (workflow["5"]?.inputs && negative_prompt) {
      workflow["5"].inputs.text = negative_prompt;
    }
    if (workflow["6"]?.inputs) {
      workflow["6"].inputs.width = width;
      workflow["6"].inputs.height = height;
      workflow["6"].inputs.length = frameCount;
    }
    if (workflow["7"]?.inputs) {
      workflow["7"].inputs.seed = seed;
      workflow["7"].inputs.steps = steps;
      workflow["7"].inputs.cfg = cfg;
      workflow["7"].inputs.sampler_name = "dpmpp_2m";
      workflow["7"].inputs.scheduler = "karras";
    }
    configureVhsOrFrames(workflow, {
      vhsNodeId: "9",
      decodeNodeId: "8",
      hasVHS,
      fps,
      filenamePrefix: `${filenamePrefix}_Portrait_`,
      framesNodeId: "save_frames"
    });
  } else if (preset === 'realistic') {
    if (workflow["4"]?.inputs && prompt) {
      workflow["4"].inputs.text = prompt;
    }
    if (workflow["5"]?.inputs && negative_prompt) {
      workflow["5"].inputs.text = negative_prompt;
    }
    if (workflow["6"]?.inputs) {
      workflow["6"].inputs.width = width;
      workflow["6"].inputs.height = height;
      workflow["6"].inputs.length = frameCount;
    }
    if (workflow["7"]?.inputs) {
      workflow["7"].inputs.seed = seed;
      workflow["7"].inputs.steps = steps;
      workflow["7"].inputs.cfg = cfg;
      workflow["7"].inputs.sampler_name = "dpmpp_2m";
      workflow["7"].inputs.scheduler = "karras";
    }
    configureVhsOrFrames(workflow, {
      vhsNodeId: "9",
      decodeNodeId: "8",
      hasVHS,
      fps,
      filenamePrefix: `${filenamePrefix}_Realistic_`,
      framesNodeId: "save_frames"
    });
  }

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
      steps = 8,
      cfg_scale = 2.0,
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
      console.log('ComfyUI: Workflow JSON:', JSON.stringify(workflow, null, 2));
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
      console.error('ComfyUI: Workflow that failed:', JSON.stringify(workflow, null, 2));
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

    // Download image and store in database
    try {
      console.log('ComfyUI: Downloading image from', imageUrl);
      const imageResponse = await fetch(imageUrl);
      
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.statusText}`);
      }

      const imageBuffer = await imageResponse.arrayBuffer();
      const binaryData = Buffer.from(imageBuffer);
      const timestamp = Date.now();
      const localFilename = `${timestamp}.png`;
      
      // Insert into database
      const result = db.insertImage(
        null, // production_id - can be linked later
        localFilename,
        null, // width
        null, // height
        'png',
        binaryData.length,
        binaryData,
        'image/png'
      );
      
      const dbImageId = result.lastInsertRowid;
      console.log('ComfyUI: Image saved to database with id:', dbImageId);

      const localImageUrl = `http://localhost:${PORT}/api/media/image/${dbImageId}`;

      res.json({
        success: true,
        imageUrl: localImageUrl,
        promptId,
        filename: localFilename,
        id: dbImageId
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

      // Download image and store in database
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const binaryData = Buffer.from(imageBuffer);
      const timestamp = Date.now();
      const localFilename = `${timestamp}.png`;
      
      // Insert into database
      const dbResult = db.insertImage(
        null, // production_id
        localFilename,
        null, // width
        null, // height
        'png',
        binaryData.length,
        binaryData,
        'image/png'
      );
      
      const dbImageId = dbResult.lastInsertRowid;

      return {
        imageUrl: `http://localhost:${PORT}/api/media/image/${dbImageId}`,
        filename: localFilename,
        id: dbImageId
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
    // Check ComfyUI availability first
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const healthCheck = await fetch(`${COMFYUI_URL}/queue`, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!healthCheck.ok) {
        return res.status(503).json({
          error: 'ComfyUI service unavailable',
          details: `ComfyUI at ${COMFYUI_URL} returned status ${healthCheck.status}. Please ensure ComfyUI is running.`
        });
      }
    } catch (healthError) {
      console.error('ComfyUI health check failed:', healthError);
      return res.status(503).json({
        error: 'Cannot connect to ComfyUI',
        details: `Failed to connect to ComfyUI at ${COMFYUI_URL}. Error: ${healthError.message}. Please ensure ComfyUI is running and accessible.`
      });
    }

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
      camera_motion = 'static',
      lipSync = false,
      audioUrl,
      shotId = null,
      workflow: workflowHint = ''
    } = req.body;

    const workflowPresetInput = String(workflowHint || '').toLowerCase();
    let workflowPreset = 'i2v';
    if (workflowPresetInput.includes('portrait')) workflowPreset = 'portrait';
    else if (['t2v', 'realistic'].includes(workflowPresetInput)) workflowPreset = 'realistic';

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    // If no reference image is provided, fall back to T2V preset
    if (!imageUrl && workflowPreset !== 'realistic') {
      workflowPreset = 'realistic';
    }
    if (!imageUrl && workflowPreset !== 'realistic') {
      return res.status(400).json({ error: 'Image URL is required for I2V/portrait workflows' });
    }

    const clipDuration = Math.max(0.5, Number(duration) || 3);
    
    // Set defaults based on quality level
    let videoWidth, videoHeight, videoFps, videoSteps, videoCfg, frameCount;
    let presetDefaults = null;
    
    if (quality === 'high') {
      const selectedDefaults = {
        i2v: { width: 720, height: 1280, fps: 24, steps: 25, cfg: 6.5, maxFrames: 73, flow_shift: 7.0, strength: 0.7 },
        portrait: { width: 720, height: 1280, fps: 25, steps: 30, cfg: 6.0, maxFrames: 61 },
        realistic: { width: 720, height: 1280, fps: 24, steps: 25, cfg: 7.0, maxFrames: 73 }
      }[workflowPreset] || { width: 720, height: 1280, fps: 24, steps: 25, cfg: 6.5, maxFrames: 73 };

      presetDefaults = selectedDefaults;
      videoWidth = Number(width) || selectedDefaults.width;
      videoHeight = Number(height) || selectedDefaults.height;
      videoFps = Number(fps) || selectedDefaults.fps;
      videoSteps = Number(steps) || selectedDefaults.steps;
      videoCfg = Number(cfg) || selectedDefaults.cfg;
      frameCount = Math.min(selectedDefaults.maxFrames, Math.ceil(clipDuration * videoFps));
      console.log(`ComfyUI HunyuanVideo (${workflowPreset}): Generating ${clipDuration}s video (${frameCount} frames @ ${videoFps}fps, ${videoWidth}x${videoHeight})`);
    } else {
      // AnimateDiff draft quality defaults - improved for better quality
      videoWidth = Number(width) || 768;
      videoHeight = Number(height) || 512;
      videoFps = Number(fps) || 16;
      videoSteps = Number(steps) || 25;
      videoCfg = Number(cfg) || 7.5;
      frameCount = Math.ceil(clipDuration * videoFps);

      // AnimateDiff (mm_sd_v15_v2) without context window supports max 32 frames.
      // If requested frames exceed 32, reduce FPS to keep duration while staying within the limit.
      const AD_MAX_FRAMES = 32;
      if (frameCount > AD_MAX_FRAMES) {
        const cappedFps = Math.max(1, Math.floor(AD_MAX_FRAMES / clipDuration));
        if (cappedFps < videoFps) {
          console.warn(
            `AnimateDiff: capping to ${AD_MAX_FRAMES} frames. Adjusting fps from ${videoFps} to ${cappedFps} for duration ~${clipDuration}s.`
          );
          videoFps = cappedFps;
          frameCount = Math.min(AD_MAX_FRAMES, Math.ceil(clipDuration * videoFps));
        } else {
          // Fallback: hard cap frames if fps cannot be lowered further
          frameCount = AD_MAX_FRAMES;
        }
      }

      console.log(`ComfyUI AnimateDiff: Generating ${clipDuration}s video (${frameCount} frames @ ${videoFps}fps)`);
    }

    if (imageUrl) {
      console.log(`Using image: ${imageUrl.substring(0, 100)}...`);
    }
    console.log(`Prompt: ${prompt}`);

    // Upload image to ComfyUI (only when provided/required)
    let comfyImageName = null;
    if (imageUrl) {
      try {
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
        } else if (imageUrl.startsWith(`http://localhost:${PORT}/api/media/image/`)) {
          // Handle database image URL
          const imageId = imageUrl.split('/').pop();
          const imageData = db.getImageBinary(parseInt(imageId));
          if (!imageData?.binary_data) {
            return res.status(404).json({ error: 'Image not found in database' });
          }
          const base64 = `data:${imageData.mime_type};base64,${imageData.binary_data.toString('base64')}`;
          comfyImageName = await uploadImageToComfyUI(base64);
        } else if (imageUrl.startsWith('http://localhost')) {
          // Handle legacy local backend URL
          const filename = imageUrl.split('/').pop();
          const localPath = path.join('data/images', filename);
          const imageBuffer = await fs.readFile(localPath);
          const base64 = `data:image/png;base64,${imageBuffer.toString('base64')}`;
          comfyImageName = await uploadImageToComfyUI(base64);
        } else {
          return res.status(400).json({
            error: 'Unsupported image URL format',
            details: `Image URL must be a data URI, ComfyUI view URL, or localhost URL. Received: ${imageUrl.substring(0, 100)}`
          });
        }
      } catch (uploadError) {
        console.error('ComfyUI: Image upload failed:', uploadError);
        return res.status(500).json({
          error: 'Failed to upload image to ComfyUI',
          details: uploadError.message
        });
      }

      console.log(`ComfyUI: Image uploaded as ${comfyImageName}`);
    } else {
      console.log('ComfyUI: Skipping image upload (text-to-video preset selected).');
    }

    // Build workflow based on quality level
    let workflow;
    try {
      // Detect if VHS_VideoCombine exists; if not, we'll save frames and combine via ffmpeg
      let hasVHS = false;
      try {
        hasVHS = await comfyHasNode('VHS_VideoCombine');
      } catch (vhsError) {
        console.warn('ComfyUI: Failed to check for VHS_VideoCombine:', vhsError.message);
      }
      if (!hasVHS) {
        console.warn('ComfyUI: VHS_VideoCombine not found. Falling back to frames + ffmpeg.');
      }
      
      if (quality === 'high') {
        console.log('ComfyUI: Building HunyuanVideo workflow...');
        
        // Check if HunyuanVideo nodes are available
        const hasHunyuan = await comfyHasNode('HyVideoModelLoader');
        if (!hasHunyuan) {
          return res.status(503).json({
            error: 'HunyuanVideo not available',
            details: 'High-quality video generation requires HunyuanVideo nodes. Please install the HunyuanVideo custom nodes or use quality="draft" instead.',
            stage: 'node_check',
            suggestion: 'Switch to draft quality or install HunyuanVideo: https://github.com/kijai/ComfyUI-HunyuanVideoWrapper'
          });
        }
        
        const flowShift = presetDefaults?.flow_shift;
        const strength = Number.isFinite(Number(req.body?.strength))
          ? Number(req.body.strength)
          : presetDefaults?.strength;

        workflow = await buildHunyuanPresetWorkflow({
          preset: workflowPreset,
          prompt,
          negative_prompt,
          comfyImageName,
          width: videoWidth,
          height: videoHeight,
          frameCount,
          fps: videoFps,
          steps: videoSteps,
          cfg: videoCfg,
          seed: Number(seed) || -1,
          flow_shift: flowShift,
          strength,
          hasVHS,
          filenamePrefix: 'HunyuanVideo'
        });
      } else {
        console.log('ComfyUI: Building AnimateDiff workflow...');
        
        // Check if AnimateDiff nodes are available
        const hasAnimateDiff = await comfyHasNode('ADE_LoadAnimateDiffModel');
        if (!hasAnimateDiff) {
          return res.status(503).json({
            error: 'AnimateDiff not available',
            details: 'Draft video generation requires AnimateDiff-Evolved custom nodes. Please install them to enable video generation.',
            stage: 'node_check',
            instructions: [
              '1. Install AnimateDiff-Evolved: cd ComfyUI/custom_nodes && git clone https://github.com/Kosinkadink/ComfyUI-AnimateDiff-Evolved.git',
              '2. Install dependencies: cd ComfyUI-AnimateDiff-Evolved && pip install -r requirements.txt',
              '3. Download motion model: python download_models.py',
              '4. Restart ComfyUI',
              'See COMFYUI_ANIMATEDIFF_SETUP.md for detailed instructions'
            ]
          });
        }
        
        // AnimateDiff draft quality workflow (SD1.5 models only)
        workflow = createAnimateDiffWorkflow({
          prompt,
          negative_prompt,
          init_image: comfyImageName,
          width: videoWidth,
          height: videoHeight,
          steps: videoSteps,
          cfg: videoCfg,
          seed: Number(seed) || -1,
          denoise: Number(denoise) || 0.45,
          frame_count: frameCount,
          fps: videoFps,
          checkpoint: "realisticVisionV51_v51VAE.safetensors", // Must be SD1.5 model
          motion_model: "mm_sd_v15_v2.ckpt", // SD1.5 motion model
          use_vhs: hasVHS
        });
      }
      
      if (!workflow) {
        throw new Error('Workflow creation returned null or undefined');
      }
      
      console.log('ComfyUI: Workflow created successfully');
    } catch (workflowError) {
      console.error('ComfyUI: Workflow creation failed:', workflowError);
      const statusCode = workflowError?.message?.includes('reference image') ? 400 : 500;
      return res.status(statusCode).json({
        error: 'Failed to create ComfyUI workflow',
        details: workflowError.message,
        stage: 'workflow_creation'
      });
    }

    // Queue workflow
    console.log('ComfyUI: Queueing workflow...');
    console.log('Workflow JSON:', JSON.stringify(workflow, null, 2));
    
    let queueResponse;
    try {
      queueResponse = await fetch(`${COMFYUI_URL}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: workflow })
      });
    } catch (queueError) {
      console.error('ComfyUI queue connection error:', queueError);
      return res.status(503).json({
        error: 'Failed to connect to ComfyUI for workflow queuing',
        details: queueError.message
      });
    }

    if (!queueResponse.ok) {
      const errorBody = await queueResponse.text();
      console.error('ComfyUI queue error:', errorBody);
      return res.status(500).json({
        error: 'ComfyUI rejected workflow',
        details: `${queueResponse.statusText} - ${errorBody}`
      });
    }

    const queueResult = await queueResponse.json();
    const promptId = queueResult.prompt_id;
    
    if (!promptId) {
      console.error('ComfyUI: No prompt_id returned:', queueResult);
      return res.status(500).json({
        error: 'ComfyUI did not return a prompt ID',
        details: 'Workflow was submitted but no prompt_id was returned'
      });
    }
    
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
          console.warn(`ComfyUI: No video output found for prompt ${promptId}. Attempting frames fallback.`);
          // Try to assemble frames into a video if any SaveImage node produced images
          const framesNode = Object.keys(outputs || {}).find(
            (nodeId) => Array.isArray(outputs[nodeId]?.images) && outputs[nodeId].images.length > 0
          );
          const frames = framesNode ? (outputs[framesNode]?.images || []) : [];
          if (frames.length > 0) {
            const clipId = Date.now();
            const framesDir = path.join('data', 'videos', `frames_${clipId}`);
            await fs.mkdir(framesDir, { recursive: true });
            // Copy frames into a sequentially numbered pattern
            for (let i = 0; i < frames.length; i++) {
              const src = path.join(COMFYUI_OUTPUT_DIR, frames[i].filename);
              const dst = path.join(framesDir, `frame_${String(i + 1).padStart(5, '0')}.png`);
              try {
                await fs.copyFile(src, dst);
              } catch (copyErr) {
                console.error('Frame copy failed:', copyErr?.message || copyErr);
              }
            }

            // Assemble with ffmpeg
            const tempName = `temp_clip_${clipId}.mp4`;
            const tempVideoPath = path.join('data', 'videos', tempName);
            const ffmpegCmd = `ffmpeg -y -framerate ${videoFps} -i "${path.join(framesDir, 'frame_%05d.png')}" -c:v libx264 -pix_fmt yuv420p "${tempVideoPath}"`;
            try {
              await execAsync(ffmpegCmd);
              // Clean up frames directory
              try { await fs.rm(framesDir, { recursive: true, force: true }); } catch {}

              // Continue with database save pipeline by setting videoFilename to the produced file
              videoFilename = tempName; // mark as produced locally in data/videos
              // Since downstream expects file inside COMFYUI_OUTPUT_DIR, we'll handle via special path later
              // by bypassing sourceVideoPath copy if detected below.
              var __framesFallbackLocal = true;
            } catch (ffErr) {
              console.error('FFmpeg frames->video failed:', ffErr?.message || ffErr);
            }
          }
        }

        if (!videoFilename) {
          console.error(`ComfyUI: No video or frames-assembled output for prompt ${promptId}`);
          videoResults.set(promptId, { success: false, error: 'No video output produced by ComfyUI (VHS missing and frames fallback failed).', shotId });
          return;
        }

        console.log(`ComfyUI: Video generated: ${videoFilename}`);

        // Copy video to temp location first
        const clipId = Date.now();
        const sourceVideoPath = path.join(COMFYUI_OUTPUT_DIR, videoFilename);
        const tempVideoPath = path.join('data/videos', `temp_clip_${clipId}.mp4`);

        if (typeof __framesFallbackLocal !== 'undefined' && __framesFallbackLocal === true) {
          // Our tempName already points to data/videos; just rename to the expected temp path
          const producedPath = path.join('data', 'videos', videoFilename);
          try {
            await fs.rename(producedPath, tempVideoPath);
          } catch (rnErr) {
            // Fallback to copy if rename across volume boundaries fails
            await fs.copyFile(producedPath, tempVideoPath);
            try { await fs.unlink(producedPath); } catch {}
          }
        } else {
          await fs.copyFile(sourceVideoPath, tempVideoPath);
        }

        let finalVideoPath = tempVideoPath;

        // Optional lip-sync post-process hook (Wav2Lip/SadTalker integration)
        if (lipSync && audioUrl && typeof audioUrl === 'string') {
          try {
            console.log(`[LipSync] Requested for prompt ${promptId} using audio: ${audioUrl}`);
            // Resolve local audio path, trimming to clip duration to keep alignment
            let localAudioPath = null;
            if (audioUrl.startsWith(`http://localhost:${PORT}/api/media/audio/`)) {
              // Handle database audio URL
              const audioId = audioUrl.split('/').pop();
              const audioData = db.getAudioBinary(parseInt(audioId));
              if (audioData?.binary_data) {
                localAudioPath = path.join('data/videos', `temp_clip_${clipId}_audio.aac`);
                await fs.writeFile(localAudioPath, audioData.binary_data);
              }
            } else if (audioUrl.startsWith(`http://localhost:${PORT}/audio/`)) {
              // Handle legacy audio URL
              const audioFilename = audioUrl.split('/').pop();
              localAudioPath = path.join('data/audio', audioFilename);
            }
            if (localAudioPath) {
              const trimmedAudio = path.join('data/videos', `temp_clip_${clipId}_audio_trimmed.aac`);
              const trimCmd = `ffmpeg -y -i "${localAudioPath}" -t ${clipDuration} -c:a aac "${trimmedAudio}"`;
              await execAsync(trimCmd);

              const lipsyncedPath = path.join('data/videos', `temp_clip_${clipId}_lipsync.mp4`);
              try {
                await runLipSync({ videoPath: tempVideoPath, audioPath: trimmedAudio, outputPath: lipsyncedPath });
                finalVideoPath = lipsyncedPath;
              } catch (lipErr) {
                console.error('[LipSync] Engine failed, continuing with original video:', lipErr.message);
              }
              
              // Cleanup temp audio files
              try {
                if (localAudioPath.includes('temp_clip_')) await fs.unlink(localAudioPath);
                await fs.unlink(trimmedAudio);
              } catch {}
            } else {
              console.warn('[LipSync] Audio URL not local or missing; skipping lipsync');
            }
          } catch (e) {
            console.error('[LipSync] Post-process failed (continuing with original video):', e);
          }
        }

        // Store video in database
        const videoBinary = await fs.readFile(finalVideoPath);
        const result = db.insertVideo(
          null, // production_id (not assigned yet)
          `clip_${clipId}.mp4`,
          videoWidth,
          videoHeight,
          clipDuration,
          videoFps,
          'mp4',
          videoBinary.length,
          videoBinary,
          'video/mp4'
        );
        
        // Cleanup temp files
        try {
          await fs.unlink(tempVideoPath);
          if (finalVideoPath !== tempVideoPath) await fs.unlink(finalVideoPath);
        } catch {}

        // Store the result for retrieval via status endpoint
        const clipUrl = `http://localhost:${PORT}/api/media/video/${result.lastInsertRowid}`;
        videoResults.set(promptId, {
          success: true,
          clipUrl,
          duration: clipDuration,
          frameCount,
          fps: videoFps,
          comfyui_filename: videoFilename,
          shotId,
          videoId: result.lastInsertRowid
        });
        
        console.log(`ComfyUI: Video saved to database with ID ${result.lastInsertRowid}`);
                
                // Broadcast video availability via WebSocket
                const videoUrl = `http://${BACKEND_HOST}:${BACKEND_PORT}/api/media/video/${result.lastInsertRowid}`;
                if (global.broadcastToSubscribers) {
                  global.broadcastToSubscribers('video_generated', {
                    type: 'video_generated',
                    id: shotId || result.lastInsertRowid,
                    shotId,
                    videoId: result.lastInsertRowid,
                    url: videoUrl,
                    filename: videoFilename,
                    timestamp: Date.now()
                  });
                }
      } catch (error) {
        console.error(`ComfyUI: Background processing error for ${promptId}:`, error);
        videoResults.set(promptId, {
          success: false,
          error: error.message,
          shotId
        });
      }
    })();

  } catch (error) {
    console.error('Error generating video clip:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      error: 'Failed to generate video clip',
      details: error.message,
      stage: 'initialization'
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


// ==================== MEDIA LIBRARY ====================

app.get('/api/media/library', (req, res) => {
  console.log('API: Fetching media library');
  
  try {
    // Always use port 3002 for the backend media URLs
    const BACKEND_PORT = 3002;
    const BACKEND_HOST = 'localhost';
    
    const images = db.queries.getAllImagesUnfiltered.all();
    const videos = db.queries.getAllVideosUnfiltered.all();
    
    const imageList = images.map(img => ({
      id: img.id,
      type: 'image',
      url: `http://${BACKEND_HOST}:${BACKEND_PORT}/api/media/image/${img.id}`,
      filename: img.filename,
      width: img.width,
      height: img.height,
      size: img.size,
      created_at: img.created_at
    }));
    
    const videoList = videos.map(vid => ({
      id: vid.id,
      type: 'video',
      url: `http://${BACKEND_HOST}:${BACKEND_PORT}/api/media/video/${vid.id}`,
      filename: vid.filename,
      width: vid.width,
      height: vid.height,
      duration: vid.duration,
      size: vid.size,
      created_at: vid.created_at
    }));
    
    res.json({
      images: imageList,
      videos: videoList,
      total: imageList.length + videoList.length
    });
  } catch (error) {
    console.error('Error fetching media library:', error);
    res.status(500).json({ error: 'Failed to fetch media library' });
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

// ==================== COMFYUI PREFLIGHT ====================

// Verify ComfyUI is reachable and required nodes exist
app.get('/api/comfyui/preflight', async (req, res) => {
  try {
    // Quick availability check
    const healthResp = await fetch(`${COMFYUI_URL}/queue`).catch(() => null);
    if (!healthResp || !healthResp.ok) {
      return res.json({ ok: false, available: false, missingNodes: ['AnimateDiff', 'HunyuanVideo'], message: `Cannot reach ComfyUI at ${COMFYUI_URL}` });
    }

    // Try to list object info (available nodes)
    let nodes = {};
    try {
      const infoResp = await fetch(`${COMFYUI_URL}/object_info`);
      if (infoResp.ok) {
        const info = await infoResp.json();
        nodes = info?.nodes || info || {};
      }
    } catch (_) {}

    // Required node names to check (based on shipped workflows)
    const required = [
      // AnimateDiff
      'ADE_EmptyLatentImageLarge', // error shows this when missing
      // HunyuanVideo (actual node names from HunyuanVideoWrapper)
      'HyVideoModelLoader',
      'TextEncodeHunyuanVideo_ImageToVideo',
      'HunyuanImageToVideo',
      'HyVideoVAELoader',
    ];
    // Recommended but optional (we fall back to ffmpeg if not present)
    const recommended = [
      'VHS_VideoCombine'
    ];

    const availableNodeNames = Object.keys(nodes);
    const missingNodes = required.filter((name) => !availableNodeNames.includes(name));
    const missingRecommended = recommended.filter((name) => !availableNodeNames.includes(name));

    if (missingNodes.length > 0) {
      return res.json({
        ok: false,
        available: true,
        missingNodes,
        message: 'ComfyUI is up, but required custom nodes are missing.',
        docs: {
          animatediff: '/COMFYUI_ANIMATEDIFF_SETUP.md',
          hunyuan: '/COMFYUI_HUNYUANVIDEO_SETUP.md',
        },
        warnings: missingRecommended.length ? { missingRecommended } : undefined
      });
    }

    return res.json({ ok: true, available: true, missingNodes: [], warnings: missingRecommended.length ? { missingRecommended } : undefined });
  } catch (error) {
    console.error('Preflight error:', error);
    return res.json({ ok: false, available: false, missingNodes: ['AnimateDiff', 'HunyuanVideo'], message: error.message });
  }
});

// Start server
ensureDirectories().then(() => {
  const server = app.listen(PORT, () => {
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
  
  // Set up WebSocket server
  const wss = new WebSocketServer({ server });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (message) => {
      console.log('Received WebSocket message:', message);
      // Handle WebSocket messages here
      try {
        const msgData = JSON.parse(message.toString());
        
        if (msgData.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        } else if (msgData.type === 'subscribe') {
          console.log('Client subscribed to:', msgData.channel);
          // Store the subscription
          ws.subscriptions = ws.subscriptions || [];
          ws.subscriptions.push(msgData.channel);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
    
    // Initial connection message
    ws.send(JSON.stringify({ type: 'connection', message: 'Connected to AI Music Video Backend WebSocket server' }));
  });
  
  // Helper function to broadcast to all clients or specific subscriptions
  function broadcastToSubscribers(channel, data) {
    wss.clients.forEach(client => {
      if (client.readyState === 1 && client.subscriptions && client.subscriptions.includes(channel)) {
        client.send(JSON.stringify(data));
      }
    });
  }
  
  // Save the broadcast function globally so we can use it in other parts of the code
  global.broadcastToSubscribers = broadcastToSubscribers;
});
import { runLipSync } from './lipsync.js';
