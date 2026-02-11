# 🔧 Individual Component Startup Guide

This guide explains how to start each component of the AI Music Video Generator **separately**, including dependencies, ports, and troubleshooting for each service.

## 📋 **Component Overview**

| Component | Purpose | Port | Required | Optional |
|-----------|---------|------|----------|----------|
| **ComfyUI** | AI Video Generation | 8188 | ✅ Yes | - |
| **Automatic1111** | AI Image Generation | 7860 | ✅ Yes | - |
| **n8n** | Workflow Automation | 5678 | ❌ No | ✅ Optional |
| **Backend Server** | API & Database | 3002 | ✅ Yes | - |
| **Frontend App** | User Interface | 4001 | ✅ Yes | - |

---

## 🐳 **1. Docker Services**

### **Prerequisites:**
- Docker Desktop installed and running
- NVIDIA GPU drivers (for AI acceleration)
- 8GB+ available RAM
- 20GB+ available disk space

### **1.1 ComfyUI (AI Video Generation)**
```bash
# Start only ComfyUI
docker-compose up -d comfyui

# Or start all Docker services
docker-compose up -d
```

**Details:**
- **Container**: `comfyui-music-video`
- **Port**: 8188 → 8188
- **Volume Mounts**:
  - `./models:/app/ComfyUI/models` (AI models)
  - `./outputs:/app/ComfyUI/output` (Generated content)
  - `./data/images:/app/ComfyUI/input` (Input images)
  - `./ComfyUI/custom_nodes:/app/ComfyUI/custom_nodes` (Extensions)
- **Health Check**: `curl http://localhost:8188`
- **Web Interface**: http://localhost:8188
- **GPU Required**: Yes (NVIDIA)

**Troubleshooting:**
```bash
# Check if GPU is available
nvidia-smi

# View ComfyUI logs
docker-compose logs -f comfyui

# Restart ComfyUI
docker-compose restart comfyui

# Check container status
docker ps | grep comfyui
```

### **1.2 Automatic1111 (AI Image Generation)**
```bash
# Start only Automatic1111
docker-compose up -d automatic1111

# Or start all Docker services  
docker-compose up -d
```

**Details:**
- **Container**: `a1111-music-video`
- **Port**: 7860 → 8080
- **Volume Mounts**:
  - `./models:/stable-diffusion-webui/models` (Models)
  - `./outputs:/stable-diffusion-webui/outputs` (Generated images)
- **Command Args**: `--api --listen --port 8080 --xformers`
- **Health Check**: `curl http://localhost:7860`
- **Web Interface**: http://localhost:7860
- **API Docs**: http://localhost:7860/docs
- **GPU Required**: Yes (NVIDIA)

**Troubleshooting:**
```bash
# Check Automatic1111 logs
docker-compose logs -f automatic1111

# Restart Automatic1111
docker-compose restart automatic1111

# Test API connection
curl http://localhost:7860/internal/ping
```

### **1.3 n8n (Workflow Automation) - OPTIONAL**
```bash
# Start only n8n
docker-compose up -d n8n

# Or skip if not needed
```

**Details:**
- **Container**: `n8n`
- **Port**: 5678 → 5678
- **Volume Mounts**: `./n8n_data:/home/node/.n8n`
- **Environment**:
  - `N8N_BASIC_AUTH_ACTIVE=true`
  - Default credentials: admin/changeme
- **Health Check**: `curl http://localhost:5678/healthz`
- **Web Interface**: http://localhost:5678
- **GPU Required**: No

**Troubleshooting:**
```bash
# Check n8n logs
docker-compose logs -f n8n

# Reset n8n data (if needed)
docker-compose down n8n
docker volume rm ai_music_video_n8n_data
```

---

## 🗄️ **2. Backend Server (Node.js)**

### **Prerequisites:**
- Node.js 18+ installed
- npm or yarn package manager
- Ports 3002 available

### **2.1 Backend Server**
```bash
# Navigate to server directory
cd server

# Install dependencies (first time only)
npm install

# Set environment variables
set PORT=3002  # Windows
# export PORT=3002  # Mac/Linux

# Start the server
npm start

# Or for development with auto-reload
npm run dev
```

**Details:**
- **Port**: 3002 (configurable)
- **Process**: Node.js application
- **Database**: SQLite at `./server/data/media.db`
- **File Storage**: 
  - `./data/images/` - Uploaded images
  - `./data/videos/` - Generated videos
  - `./data/audio/` - Audio files
  - `./data/productions/` - Project data
- **API Base**: http://localhost:3002
- **WebSocket**: Same port (port 3002)
- **GPU Required**: No

**Key Endpoints:**
- `GET /api/health` - Health check
- `GET /api/comfyui/health` - ComfyUI status
- `GET /api/comfyui/preflight` - Node availability
- `POST /api/comfyui/generate` - Generate images
- `POST /api/comfyui/generate-video-clip` - Generate videos

**Troubleshooting:**
```bash
# Check if port 3002 is available
netstat -ano | findstr :3002  # Windows
lsof -i :3002  # Mac/Linux

# Check Node.js version
node --version

# View backend logs
# Check terminal where npm start is running

# Test API connection
curl http://localhost:3002/api/health

# Reset database (if needed)
rm server/data/media.db
```

---

## 🌐 **3. Frontend Application**

### **Prerequisites:**
- Node.js 18+ installed
- npm or yarn package manager
- Port 4001 available
- Backend server running on port 3002

### **3.1 Frontend Application**
```bash
# From project root directory
npm install  # First time only

# Start development server
npm run dev

# Or build for production
npm run build
npm run preview
```

**Details:**
- **Port**: 4001 (configurable in vite.config.ts)
- **Framework**: React + Vite + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **API Connection**: http://localhost:3002
- **Web Interface**: http://localhost:3001
- **GPU Required**: No

**Key Features:**
- AI Music Video Generator
- Storyboard Creation
- ComfyUI Integration
- StitchStream Studio (embedded)
- File Upload & Management
- Real-time Progress Updates

**Environment Configuration:**
```bash
# Frontend looks for these environment variables:
VITE_BACKEND_URL=http://localhost:3002
VITE_GEMINI_API_KEY=your_gemini_key  # For StitchStream AI features
```

**Troubleshooting:**
```bash
# Check if port 3001 is available
netstat -ano | findstr :4001  # Windows
lsof -i :3001  # Mac/Linux

# Clear Vite cache
rm -rf node_modules/.vite

# Check for dependency issues
npm audit
npm install

# Test frontend loads
curl http://localhost:3001

# Check browser console for errors
# Open http://localhost:3001 in browser and check DevTools
```

---

## 🔄 **Starting Order & Dependencies**

### **Critical Path (Must Start in Order):**
1. **Docker Services** (ComfyUI + Automatic1111)
2. **Backend Server** (Depends on Docker services for AI functionality)
3. **Frontend Application** (Depends on Backend API)

### **Optional Services:**
- **n8n** (Can start anytime, independent)

### **Dependency Chain:**
```
Frontend (3001) 
    ↓ API calls
Backend (3002)
    ↓ HTTP requests
ComfyUI (8188) + Automatic1111 (7860)
    ↓ Docker network
n8n (5678) - Independent
```

---

## 🚫 **What Happens if Components Are Missing**

### **Without ComfyUI:**
- Video generation fails
- Main app shows "ComfyUI unavailable"
- Can still upload images and create storyboards

### **Without Automatic1111:**
- Image generation limited
- Some workflows may not work
- ComfyUI can handle most image tasks

### **Without Backend:**
- Frontend cannot function
- No data persistence
- No file uploads
- No API communication

### **Without Frontend:**
- Cannot access user interface
- All functionality unavailable
- API endpoints still work for programmatic access

### **Without n8n:**
- No workflow automation
- Manual processes still work
- Core functionality unaffected

---

## 🔧 **Port Reference**

| Service | Internal Port | External Port | Protocol |
|---------|---------------|---------------|----------|
| ComfyUI | 8188 | 8188 | HTTP |
| Automatic1111 | 8080 | 7860 | HTTP |
| n8n | 5678 | 5678 | HTTP |
| Backend | 3002 | 3002 | HTTP + WebSocket |
| Frontend | 4001 | 4001 | HTTP |

---

## 🛠️ **Development vs Production**

### **Development Mode:**
```bash
# All services run with hot reload
npm run dev          # Frontend
npm run dev          # Backend (in server directory)
docker-compose up    # Docker services
```

### **Production Mode:**
```bash
# Build and serve production files
npm run build        # Frontend build
npm run preview      # Frontend preview
npm start           # Backend production
docker-compose up -d # Docker services
```

---

## 📊 **System Requirements by Component**

### **ComfyUI:**
- **RAM**: 4GB minimum, 8GB recommended
- **GPU**: NVIDIA GTX 1060+ (6GB VRAM)
- **Storage**: 5GB for models, 10GB+ for outputs

### **Automatic1111:**
- **RAM**: 4GB minimum, 6GB recommended  
- **GPU**: NVIDIA GTX 1060+ (6GB VRAM)
- **Storage**: 3GB for models, 5GB+ for outputs

### **Backend Server:**
- **RAM**: 1GB minimum, 2GB recommended
- **CPU**: 2 cores minimum
- **Storage**: 1GB for database, depends on media files

### **Frontend Application:**
- **RAM**: 512MB minimum, 1GB recommended
- **CPU**: 1 core minimum
- **Storage**: 100MB for build files

### **n8n:**
- **RAM**: 512MB minimum, 1GB recommended
- **CPU**: 1 core minimum
- **Storage**: 500MB for data

---

*Individual Component Startup Guide - AI Music Video Generator by Van-Williams*