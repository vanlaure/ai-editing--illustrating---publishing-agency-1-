# Asset Database Schema

## Overview
SQLite database to track all generated assets (images, videos, audio) with metadata for organized browsing and retrieval.

## Tables

### productions
Stores complete music video projects/storyboards.

```sql
CREATE TABLE productions (
  id TEXT PRIMARY KEY,
  title TEXT,
  artist TEXT,
  audio_filename TEXT,
  audio_duration REAL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  status TEXT DEFAULT 'draft',  -- draft, generating, completed
  storyboard_json TEXT,  -- Full storyboard data
  settings_json TEXT     -- User settings/preferences
);
```

### images
Tracks all generated images (storyboard frames, reference images).

```sql
CREATE TABLE images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL UNIQUE,
  production_id TEXT,
  clip_id TEXT,
  image_type TEXT NOT NULL,  -- 'generated', 'reference', 'thumbnail'
  prompt TEXT,
  size TEXT,  -- '1024x576'
  mode TEXT,  -- 'txt2img', 'img2img'
  cfg REAL,
  steps INTEGER,
  created_at TEXT NOT NULL,
  file_size INTEGER,
  binary_data BLOB,  -- Actual image binary data
  mime_type TEXT,    -- 'image/png', 'image/jpeg', etc.
  FOREIGN KEY (production_id) REFERENCES productions(id) ON DELETE CASCADE
);

CREATE INDEX idx_images_production ON images(production_id);
CREATE INDEX idx_images_type ON images(image_type);
CREATE INDEX idx_images_created ON images(created_at);
```

### videos
Tracks all generated video clips.

```sql
CREATE TABLE videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL UNIQUE,
  production_id TEXT,
  clip_id TEXT,
  video_type TEXT NOT NULL,  -- 'clip', 'lipsync', 'final'
  duration REAL,
  resolution TEXT,  -- '720p', '1080p'
  fps INTEGER,
  source_image_filename TEXT,
  prompt TEXT,
  camera_control TEXT,
  created_at TEXT NOT NULL,
  file_size INTEGER,
  binary_data BLOB,  -- Actual video binary data
  mime_type TEXT,    -- 'video/mp4', 'video/webm', etc.
  FOREIGN KEY (production_id) REFERENCES productions(id) ON DELETE CASCADE
);

CREATE INDEX idx_videos_production ON videos(production_id);
CREATE INDEX idx_videos_type ON videos(video_type);
CREATE INDEX idx_videos_created ON videos(created_at);
```

### audio
Tracks uploaded and processed audio files.

```sql
CREATE TABLE audio (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL UNIQUE,
  production_id TEXT,
  audio_type TEXT NOT NULL,  -- 'original', 'processed', 'instrumental', 'vocals'
  duration REAL,
  sample_rate INTEGER,
  created_at TEXT NOT NULL,
  file_size INTEGER,
  binary_data BLOB,  -- Actual audio binary data
  mime_type TEXT,    -- 'audio/mpeg', 'audio/wav', etc.
  FOREIGN KEY (production_id) REFERENCES productions(id) ON DELETE CASCADE
);

CREATE INDEX idx_audio_production ON audio(production_id);
CREATE INDEX idx_audio_type ON audio(audio_type);
```

## Relationships

```
productions (1) --- (many) images
productions (1) --- (many) videos
productions (1) --- (many) audio
```

## API Endpoints

### Asset Browsing
- `GET /api/gallery/images?type=generated&limit=50&offset=0` - Browse images (metadata only)
- `GET /api/gallery/videos?type=clip&limit=50&offset=0` - Browse videos (metadata only)
- `GET /api/gallery/productions?status=completed&limit=50` - Browse projects

### Asset Details
- `GET /api/gallery/image/:id` - Image metadata + production link
- `GET /api/gallery/video/:id` - Video metadata + production link

### Media Serving (Binary Data)
- `GET /api/media/image/:id` - Serve actual image binary from database
- `GET /api/media/video/:id` - Serve actual video binary from database
- `GET /api/media/audio/:id` - Serve actual audio binary from database

### Statistics
- `GET /api/gallery/stats` - Total counts, storage usage, recent activity

### Search
- `GET /api/gallery/search?q=Van+Williams&type=images` - Search by prompt/title

## Migration Strategy

### From Filesystem to Database (Portability Mode)
1. Scan `data/images/`, `data/videos/`, `data/audio/` directories
2. Read binary content of each file
3. Store binary data in `binary_data` BLOB column
4. Populate metadata columns (filename, size, mime_type, etc.)
5. Link to existing production JSON files where possible
6. Once migrated, filesystem files can be deleted
7. System operates entirely from single `assets.db` file

### Hybrid Mode (Optional)
- Keep both filesystem and database storage
- Use filesystem for development, database for production/export
- `binary_data` column can be NULL to indicate filesystem storage

## Notes

### Portable Mode (Binary Storage)
- Database file: `server/data/assets.db`
- All media stored in BLOB columns
- Single file contains everything (metadata + binaries)
- Easy backup/transfer: copy one .db file
- May grow very large (GB+ for video projects)

### Performance Considerations
- SQLite handles BLOBs efficiently for files <100MB
- Video files may be large; consider streaming chunks
- Indexes on metadata enable fast browsing without loading BLOBs
- Use `SELECT` without binary_data for metadata queries

### Migration
- Existing filesystem assets can be migrated via import script
- `binary_data` NULL = file on disk, non-NULL = file in database
- Backwards compatible: check binary_data first, fall back to filesystem