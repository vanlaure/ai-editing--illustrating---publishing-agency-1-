# Automatic1111 Docker Setup for AI Music Video Generator

This guide explains how to set up and use Automatic1111 (Stable Diffusion) in Docker for local image generation.

## Prerequisites

- Docker and Docker Compose installed
- NVIDIA GPU with CUDA support (for GPU acceleration)
- NVIDIA Container Toolkit installed

## Quick Start

1. **Start Automatic1111 container:**
   ```bash
   docker-compose up -d
   ```

2. **Wait for initialization** (first run downloads models, ~10-15 minutes):
   ```bash
   docker-compose logs -f automatic1111
   ```

3. **Verify it's running:**
   - Web UI: http://localhost:7860
   - API: http://localhost:7860/docs

4. **Update .env.local** with A1111 configuration:
   ```env
   USE_A1111=true
   A1111_API_URL=http://localhost:7860
   ```

## Directory Structure

```
.
├── models/              # Stable Diffusion models
│   ├── Stable-diffusion/
│   └── VAE/
├── outputs/             # Generated images
└── docker-compose.yml
```

## Using CPU (No GPU)

If you don't have a GPU, modify `docker-compose.yml`:

1. Remove the `deploy.resources` section
2. Add `--skip-torch-cuda-test --no-half` to CLI_ARGS

## Commands

- **Start:** `docker-compose up -d`
- **Stop:** `docker-compose down`
- **Restart:** `docker-compose restart`
- **View logs:** `docker-compose logs -f automatic1111`
- **Check status:** `docker-compose ps`

## Models

The container uses the default SD 1.5 model. To add custom models:

1. Download model (`.safetensors` or `.ckpt`) files
2. Place in `./models/Stable-diffusion/`
3. Restart container: `docker-compose restart automatic1111`

## Troubleshooting

### Container won't start
- Check GPU drivers: `nvidia-smi`
- Verify NVIDIA Container Toolkit: `docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi`

### Out of memory errors
- Reduce image resolution in app settings
- Use `--medvram` or `--lowvram` in CLI_ARGS

### API not responding
- Check health: `curl http://localhost:7860/internal/ping`
- View logs: `docker-compose logs automatic1111`

## Performance

- **GPU (RTX 3060):** ~5-10s per image (512x512)
- **CPU:** ~2-5 minutes per image
- **First generation:** Slower due to model loading

## Integration

The app automatically detects A1111 when `USE_A1111=true` and falls back to Google Imagen if unavailable.