# AI Music Video Backend Server

Backend server for the AI Music Video Generator with file storage and FFmpeg video processing.

## Features

- **Production Storage**: Save, load, and manage complete production data (character bibles, visual bibles, scripts, storyboards)
- **Image Management**: Upload single or multiple images, stored in organized directories
- **Audio Upload**: Upload and serve audio files
- **Video Generation**: Server-side FFmpeg processing to generate video previews and exports
- **File-based Storage**: Simple JSON file storage for productions (easily upgradeable to database)

## Prerequisites

- **Node.js** (v14 or higher)
- **FFmpeg** must be installed on your system
  - Windows: Download from https://ffmpeg.org/download.html
  - Mac: `brew install ffmpeg`
  - Linux: `sudo apt-get install ffmpeg`

## Installation

```bash
cd server
npm install
```

## Running the Server

```bash
npm start
```

Server will run on http://localhost:3002

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### Productions

- `GET /api/productions` - Get all productions
- `GET /api/productions/:id` - Get single production
- `POST /api/productions` - Save/update production
- `DELETE /api/productions/:id` - Delete production

### Images

- `POST /api/images/upload` - Upload single image (multipart/form-data with 'image' field)
- `POST /api/images/upload-batch` - Upload multiple images (multipart/form-data with 'images' field)

### Audio

- `POST /api/audio/upload` - Upload audio file (multipart/form-data with 'audio' field)

### Video

- `POST /api/video/generate` - Generate video from storyboard scenes
  - Body: `{ scenes, audioUrl, title, artist }`

### Health

- `GET /api/health` - Check server status and FFmpeg availability

## Directory Structure

```
server/
├── data/
│   ├── productions/    # JSON files for each production
│   ├── images/         # Generated and uploaded images
│   ├── audio/          # Uploaded audio files
│   └── videos/         # Generated video files
├── uploads/            # Temporary upload directory
├── index.js
├── package.json
└── README.md
```

## Environment Variables

No environment variables required. Server uses default settings:
- Port: 3002
- File upload limit: 100MB
- CORS: Enabled for all origins

## Testing

Check server health:
```bash
curl http://localhost:3002/api/health
```

Upload an image:
```bash
curl -X POST -F "image=@path/to/image.png" http://localhost:3002/api/images/upload
```

## Integration with Frontend

The frontend should update the following:
1. Replace browser-based FFmpeg with backend API calls
2. Use backend for production save/load instead of localStorage
3. Upload images to backend and use returned URLs
4. Upload audio to backend and use returned URLs

## Troubleshooting

**FFmpeg not found:**
- Install FFmpeg and ensure it's in your system PATH
- Verify with: `ffmpeg -version`

**Port 3002 already in use:**
- Change `PORT` variable in `index.js`

**File upload fails:**
- Check file size is under 100MB limit
- Verify uploads/ directory exists and is writable

## Future Enhancements

- Database integration (MongoDB, PostgreSQL)
- User authentication
- Cloud storage (AWS S3, Google Cloud Storage)
- Webhook notifications for video processing
- Job queue for batch processing