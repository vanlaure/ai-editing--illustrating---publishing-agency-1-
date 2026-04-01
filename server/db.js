import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'data', 'media.db');

const ensureDbDir = () => {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

ensureDbDir();
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');

const initializeDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS productions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      artist TEXT,
      audio_id INTEGER,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (audio_id) REFERENCES audio(id)
    );

    CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      production_id TEXT,
      filename TEXT NOT NULL,
      width INTEGER,
      height INTEGER,
      format TEXT,
      size INTEGER,
      binary_data BLOB,
      mime_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (production_id) REFERENCES productions(id)
    );

    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      production_id TEXT,
      filename TEXT NOT NULL,
      width INTEGER,
      height INTEGER,
      duration REAL,
      fps INTEGER,
      format TEXT,
      size INTEGER,
      binary_data BLOB,
      mime_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (production_id) REFERENCES productions(id)
    );

    CREATE TABLE IF NOT EXISTS audio (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      production_id TEXT,
      filename TEXT NOT NULL,
      duration REAL,
      format TEXT,
      size INTEGER,
      binary_data BLOB,
      mime_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (production_id) REFERENCES productions(id)
    );

    CREATE INDEX IF NOT EXISTS idx_images_production ON images(production_id);
    CREATE INDEX IF NOT EXISTS idx_videos_production ON videos(production_id);
    CREATE INDEX IF NOT EXISTS idx_audio_production ON audio(production_id);

    -- Shot tracking columns for ComfyUI sync (added idempotently)
  `);

  // Add shot_id and comfyui_prompt_id columns if they don't exist
  const imageColumns = db.pragma('table_info(images)').map(c => c.name);
  if (!imageColumns.includes('shot_id')) {
    db.exec(`ALTER TABLE images ADD COLUMN shot_id TEXT`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_images_shot ON images(shot_id)`);
  }
  if (!imageColumns.includes('comfyui_prompt_id')) {
    db.exec(`ALTER TABLE images ADD COLUMN comfyui_prompt_id TEXT`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_images_comfyui ON images(comfyui_prompt_id)`);
  }
  if (!imageColumns.includes('generation_type')) {
    db.exec(`ALTER TABLE images ADD COLUMN generation_type TEXT DEFAULT 'shot'`);
  }

  console.log('Database initialized successfully at:', DB_PATH);
};

initializeDatabase();

const queries = {
  insertImage: db.prepare(`
    INSERT INTO images (production_id, filename, width, height, format, size, binary_data, mime_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `),
  
  getImage: db.prepare(`
    SELECT * FROM images WHERE id = ?
  `),
  
  getImageBinary: db.prepare(`
    SELECT binary_data, mime_type, filename FROM images WHERE id = ?
  `),
  
  getAllImages: db.prepare(`
    SELECT id, production_id, filename, width, height, format, size, mime_type, created_at
    FROM images WHERE production_id = ?
  `),
  
  getAllImagesUnfiltered: db.prepare(`
    SELECT id, production_id, filename, width, height, format, size, mime_type, shot_id, comfyui_prompt_id, generation_type, created_at
    FROM images ORDER BY created_at DESC
  `),

  getImageByShotId: db.prepare(`
    SELECT id, production_id, filename, width, height, format, size, mime_type, shot_id, comfyui_prompt_id, generation_type, created_at
    FROM images WHERE shot_id = ? ORDER BY created_at DESC LIMIT 1
  `),

  getImageByPromptId: db.prepare(`
    SELECT id, production_id, filename, width, height, format, size, mime_type, shot_id, comfyui_prompt_id, generation_type, created_at
    FROM images WHERE comfyui_prompt_id = ? ORDER BY created_at DESC LIMIT 1
  `),

  getImagesByShotIds: db.prepare(`
    SELECT id, shot_id, comfyui_prompt_id, generation_type, created_at
    FROM images WHERE shot_id IN (SELECT value FROM json_each(?)) ORDER BY created_at DESC
  `),

  insertImageTracked: db.prepare(`
    INSERT INTO images (production_id, filename, width, height, format, size, binary_data, mime_type, shot_id, comfyui_prompt_id, generation_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  
  insertVideo: db.prepare(`
    INSERT INTO videos (production_id, filename, width, height, duration, fps, format, size, binary_data, mime_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  
  getVideo: db.prepare(`
    SELECT * FROM videos WHERE id = ?
  `),
  
  getVideoBinary: db.prepare(`
    SELECT binary_data, mime_type, filename FROM videos WHERE id = ?
  `),
  
  getAllVideos: db.prepare(`
    SELECT id, production_id, filename, width, height, duration, fps, format, size, mime_type, created_at
    FROM videos WHERE production_id = ?
  `),
  
  getAllVideosUnfiltered: db.prepare(`
    SELECT id, production_id, filename, width, height, duration, fps, format, size, mime_type, created_at
    FROM videos ORDER BY created_at DESC
  `),
  
  insertAudio: db.prepare(`
    INSERT INTO audio (production_id, filename, duration, format, size, binary_data, mime_type)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),
  
  getAudio: db.prepare(`
    SELECT * FROM audio WHERE id = ?
  `),
  
  getAudioBinary: db.prepare(`
    SELECT binary_data, mime_type, filename FROM audio WHERE id = ?
  `),
  
  getAllAudio: db.prepare(`
    SELECT id, production_id, filename, duration, format, size, mime_type, created_at 
    FROM audio WHERE production_id = ?
  `),
  
  insertProduction: db.prepare(`
    INSERT INTO productions (id, title, artist, audio_id, metadata, updated_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET 
      title = excluded.title,
      artist = excluded.artist,
      audio_id = excluded.audio_id,
      metadata = excluded.metadata,
      updated_at = CURRENT_TIMESTAMP
  `),
  
  getProduction: db.prepare(`
    SELECT * FROM productions WHERE id = ?
  `),
  
  getAllProductions: db.prepare(`
    SELECT * FROM productions ORDER BY updated_at DESC
  `),
  
  deleteProduction: db.prepare(`
    DELETE FROM productions WHERE id = ?
  `),
  
  deleteImage: db.prepare(`
    DELETE FROM images WHERE id = ?
  `),
  
  deleteVideo: db.prepare(`
    DELETE FROM videos WHERE id = ?
  `),
  
  deleteAudio: db.prepare(`
    DELETE FROM audio WHERE id = ?
  `),
};

// Export wrapper methods for convenient access
const insertImage = (productionId, filename, width, height, format, size, binaryData, mimeType) =>
  queries.insertImage.run(productionId, filename, width, height, format, size, binaryData, mimeType);

const getImage = (id) => queries.getImage.get(id);
const getImageBinary = (id) => queries.getImageBinary.get(id);
const getAllImages = (productionId) => queries.getAllImages.all(productionId);
const getAllImagesUnfiltered = () => queries.getAllImagesUnfiltered.all();
const getImageByShotId = (shotId) => queries.getImageByShotId.get(shotId);
const getImageByPromptId = (promptId) => queries.getImageByPromptId.get(promptId);
const getImagesByShotIds = (shotIds) => queries.getImagesByShotIds.all(JSON.stringify(shotIds));
const insertImageTracked = (productionId, filename, width, height, format, size, binaryData, mimeType, shotId, comfyuiPromptId, generationType) =>
  queries.insertImageTracked.run(productionId, filename, width, height, format, size, binaryData, mimeType, shotId, comfyuiPromptId, generationType);

const insertVideo = (productionId, filename, width, height, duration, fps, format, size, binaryData, mimeType) =>
  queries.insertVideo.run(productionId, filename, width, height, duration, fps, format, size, binaryData, mimeType);

const getVideo = (id) => queries.getVideo.get(id);
const getVideoBinary = (id) => queries.getVideoBinary.get(id);
const getAllVideos = (productionId) => queries.getAllVideos.all(productionId);
const getAllVideosUnfiltered = () => queries.getAllVideosUnfiltered.all();

const insertAudio = (productionId, filename, duration, format, size, binaryData, mimeType) =>
  queries.insertAudio.run(productionId, filename, duration, format, size, binaryData, mimeType);

const getAudio = (id) => queries.getAudio.get(id);
const getAudioBinary = (id) => queries.getAudioBinary.get(id);
const getAllAudio = (productionId) => queries.getAllAudio.all(productionId);

const insertProduction = (id, title, artist, audioId, metadata) =>
  queries.insertProduction.run(id, title, artist, audioId, metadata);

const getProduction = (id) => queries.getProduction.get(id);
const getAllProductions = () => queries.getAllProductions.all();
const deleteProduction = (id) => queries.deleteProduction.run(id);

const deleteImage = (id) => queries.deleteImage.run(id);
const deleteVideo = (id) => queries.deleteVideo.run(id);
const deleteAudio = (id) => queries.deleteAudio.run(id);

export {
  db,
  queries,
  DB_PATH,
  // Export wrapper methods
  insertImage,
  getImage,
  getImageBinary,
  getAllImages,
  getAllImagesUnfiltered,
  getImageByShotId,
  getImageByPromptId,
  getImagesByShotIds,
  insertImageTracked,
  insertVideo,
  getVideo,
  getVideoBinary,
  getAllVideos,
  getAllVideosUnfiltered,
  insertAudio,
  getAudio,
  getAudioBinary,
  getAllAudio,
  insertProduction,
  getProduction,
  getAllProductions,
  deleteProduction,
  deleteImage,
  deleteVideo,
  deleteAudio
};