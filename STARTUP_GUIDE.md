# 🚀 AI Music Video Generator - Complete Startup Guide

## 📋 System Overview

The AI Music Video Generator is a **multi-service application** that combines:
- **AI Video Generation** (ComfyUI + Automatic1111)
- **Music Analysis & Video Assembly** (Main App + Backend)
- **Professional Editing** (StitchStream Studio)
- **Workflow Automation** (n8n)

## 🎯 Quick Start (Recommended)

### Windows:
```cmd
# Simply double-click or run:
start_all.bat
```

### Mac/Linux:
```bash
# Make executable and run:
chmod +x start_all.sh
./start_all.sh
```

## 🔧 Manual Startup Process

### **Step 1: Start Docker Services**
```bash
# From project root
docker-compose up -d
```

**Services Started:**
- 🖥️ **ComfyUI**: http://localhost:8188 (AI video generation)
- 🎨 **Automatic1111**: http://localhost:7860 (AI image generation)
- ⚙️ **n8n**: http://localhost:5678 (Workflow automation)

### **Step 2: Start Backend Server**
```bash
# New terminal
cd server
set PORT=3002  # Windows
# export PORT=3002  # Mac/Linux
npm start
```

**Backend Services:**
- 🗄️ **SQLite Database**: Media storage & metadata
- 🌐 **API Server**: http://localhost:3002
- 🔌 **WebSocket**: Real-time communication
- 📁 **File Storage**: Images, videos, audio

### **Step 3: Start Frontend Application**
```bash
# New terminal (from project root)
npm run dev
```

**Frontend Application:**
- 🎵 **Main App**: http://localhost:4001 (AI Music Video Generator)
- 🎬 **StitchStream**: Embedded in Export Modal (Professional editing)

## 🌐 Service Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| **Main Application** | http://localhost:4001 | User interface & AI generation |
| **ComfyUI** | http://localhost:8188 | AI video generation interface |
| **Backend API** | http://localhost:3002 | Database & file management |
| **Automatic1111** | http://localhost:7860 | AI image generation interface |
| **n8n** | http://localhost:5678 | Workflow automation (optional) |

## 🔍 Service Health Checks

Test if everything is running:

```bash
# Test main app
curl http://localhost:3001

# Test backend
curl http://localhost:3002/api/health

# Test ComfyUI
curl http://localhost:3002/api/comfyui/health
```

## 📊 Current Status

✅ **Currently Running Services:**
- Docker ComfyUI (port 8188) - Healthy
- Docker Automatic1111 (port 7860) - Starting
- Docker n8n (port 5678) - Starting
- Backend Server (port 3002) - Running
- Frontend App (port 4001) - Running

## 🛠️ Troubleshooting

### Docker Issues:
```bash
# Restart Docker services
docker-compose down
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Backend Issues:
```bash
# Check if port 3002 is available
netstat -ano | findstr :3002

# Kill existing process if needed
taskkill /PID <process_id> /F
```

### Frontend Issues:
```bash
# Check if port 4001 is available
netstat -ano | findstr :3001

# Restart with fresh dependencies
npm install
npm run dev
```

## 🎬 How It Works

1. **🎵 Upload Music**: Main app analyzes your audio file
2. **🎯 Generate Storyboard**: AI creates scenes based on music analysis
3. **🎨 Generate Videos**: ComfyUI creates video clips for each scene
4. **🎬 Edit & Assemble**: StitchStream Studio for professional final editing
5. **📹 Export**: High-quality music video output

## 🔒 Environment Setup

Ensure you have:
- **Docker Desktop** installed and running
- **Node.js** 18+ installed
- **NVIDIA GPU** (optional, for faster AI processing)
- **Sufficient disk space** (AI models and generated content)

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all ports are available
3. Ensure Docker has sufficient resources
4. Check terminal logs for error messages

---
*AI Music Video Generator by Van-Williams*