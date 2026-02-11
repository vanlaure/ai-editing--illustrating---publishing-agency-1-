# ⚡ Quick Start Reference Card

## 🚀 **Individual Startup Commands**

### **Docker Services (AI Processing)**

#### ComfyUI (AI Video Generation)
```bash
docker-compose up -d comfyui
# Web Interface: http://localhost:8188
# Health Check: curl http://localhost:8188
```

#### Automatic1111 (AI Image Generation)  
```bash
docker-compose up -d automatic1111
# Web Interface: http://localhost:7860
# Health Check: curl http://localhost:7860
```

#### n8n (Workflow Automation) - Optional
```bash
docker-compose up -d n8n
# Web Interface: http://localhost:5678
# Health Check: curl http://localhost:5678/healthz
```

#### All Docker Services
```bash
docker-compose up -d
```

---

### **Backend Server (API & Database)**

#### Start Backend
```bash
cd server
set PORT=3002    # Windows
# export PORT=3002  # Mac/Linux
npm start
# API Base: http://localhost:3002
```

#### Health Check
```bash
curl http://localhost:3002/api/health
curl http://localhost:3002/api/comfyui/health
```

---

### **Frontend Application (User Interface)**

#### Start Frontend
```bash
npm run dev
# Web Interface: http://localhost:4001
```

#### Health Check
```bash
curl http://localhost:4001
```

---

## 🔄 **Starting Order**

### **Minimum Required (Core Functionality):**
1. `docker-compose up -d comfyui` ← AI Video Generation
2. `cd server && set PORT=3002 && npm start` ← API & Database  
3. `npm run dev` ← User Interface

### **Complete Setup (All Features):**
1. `docker-compose up -d` ← All AI Services
2. `cd server && set PORT=3002 && npm start` ← Backend API
3. `npm run dev` ← Frontend App (4001)
4. `npm --prefix stitchstream run dev -- --host --port 4100` ← StitchStream Studio (4100)

---

## 🛑 **Stop Commands**

### **Stop Individual Services:**
```bash
# Stop specific Docker service
docker-compose stop comfyui
docker-compose stop automatic1111
docker-compose stop n8n

# Stop all Docker services
docker-compose down

# Stop backend (Ctrl+C in terminal)

# Stop frontend (Ctrl+C in terminal)
```

### **Emergency Stop All:**
```bash
# Stop all services at once
docker-compose down
# Then close terminal windows or Ctrl+C
```

---

## 🌐 **Access URLs**

| Service | URL | Purpose |
|---------|-----|---------|
| **Main App** | http://localhost:4001 | User Interface |
| **Backend API** | http://localhost:3002/api/health | API Health |
| **ComfyUI** | http://localhost:8188 | AI Video Generation |
| **Automatic1111** | http://localhost:7860 | AI Image Generation |
| **n8n** | http://localhost:5678 | Workflow Automation |

---

## 🔧 **Troubleshooting Commands**

### **Check What's Running:**
```bash
# Check Docker containers
docker ps

# Check ports in use
netstat -ano | findstr :4001  # Windows
netstat -ano | findstr :3002
netstat -ano | findstr :8188

# Check Node.js processes
tasklist | findstr node  # Windows
ps aux | grep node       # Mac/Linux
```

### **Fix Common Issues:**
```bash
# Port already in use
taskkill /PID <process_id> /F  # Windows

# Clear npm cache
npm cache clean --force

# Restart Docker
docker-compose down
docker-compose up -d

# Check logs
docker-compose logs -f <service_name>
```

---

## 📋 **Prerequisites Check**

### **Required Software:**
```bash
# Check Docker
docker --version
docker-compose --version

# Check Node.js
node --version  # Should be 18+
npm --version

# Check available ports
netstat -ano | findstr :4001
netstat -ano | findstr :3002
netstat -ano | findstr :8188
netstat -ano | findstr :7860
netstat -ano | findstr :5678
```

---

## 💻 **One-File Startup**

### **Windows Batch:**
```cmd
# Double-click or run:
start_all.bat
```

### **Shell Script (Mac/Linux):**
```bash
# Make executable and run:
chmod +x start_all.sh
./start_all.sh
```

---

## 🎯 **Minimal Startup (3 Commands)**

```bash
# Command 1: Start AI Services
docker-compose up -d comfyui

# Command 2: Start Backend  
cd server && set PORT=3002 && npm start &

# Command 3: Start Frontend
npm run dev
```

**Result:** Full AI Music Video Generator at http://localhost:4001

---

*Quick Reference - AI Music Video Generator by Van-Williams*
