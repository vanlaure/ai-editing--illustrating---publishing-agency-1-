# ComfyUI AnimateDiff Setup Guide

## Overview
This guide covers setting up AnimateDiff in ComfyUI for video generation from storyboard images.

## Prerequisites
- ComfyUI installed and running (default: http://127.0.0.1:8188)
- Python environment with ComfyUI dependencies

## Required Components

### 1. AnimateDiff Custom Nodes
Install the AnimateDiff-Evolved custom nodes:

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/Kosinkadink/ComfyUI-AnimateDiff-Evolved.git
cd ComfyUI-AnimateDiff-Evolved
pip install -r requirements.txt
```

### 2. Video Helper Suite (VHS)
Install VHS for video output:

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite.git
cd ComfyUI-VideoHelperSuite
pip install -r requirements.txt
```

### 3. Motion Models
Download the AnimateDiff motion model:

**Option A: Automatic (recommended)**
```bash
cd ComfyUI/custom_nodes/ComfyUI-AnimateDiff-Evolved
python download_models.py
```

**Option B: Manual**
1. Download `mm_sd_v15_v2.ckpt` from:
   https://huggingface.co/guoyww/animatediff/tree/main
2. Place in: `ComfyUI/custom_nodes/ComfyUI-AnimateDiff-Evolved/models/`

### 4. Verify Installation
Restart ComfyUI and check the console for:
- `[AnimateDiff] Loaded`
- `[VideoHelperSuite] Loaded`

## Workflow Configuration

The application uses this AnimateDiff workflow:

```
CheckpointLoader → CLIP Encode (positive/negative)
        ↓
LoadImage → VAEEncode → AnimateDiff Motion → KSampler → VAEDecode → VideoCombine
```

### Key Parameters
- **Checkpoint**: `realisticVisionV51_v51VAE.safetensors`
- **Motion Model**: `mm_sd_v15_v2.ckpt`
- **Default FPS**: 8
- **Default Steps**: 20
- **Default CFG**: 7.0
- **Resolution**: 512x512 (adjustable)

## Testing the Setup

### 1. Verify ComfyUI API
```bash
curl http://127.0.0.1:8188/system_stats
```

### 2. Test Image Upload
```bash
curl -X POST -F "image=@test.png" http://127.0.0.1:8188/upload/image
```

### 3. Test Workflow
In the application:
1. Generate storyboard with images
2. Click "Generate Clip" on any shot
3. Monitor console for ComfyUI requests
4. Check `server/data/videos/job_*/` for output MP4

## Troubleshooting

### Error: "AnimateDiffLoader node not found"
**Cause**: Using incorrect node names from AnimateDiff-Evolved
**Solution**:
- Use Gen2 node names:
  - `ADE_LoadAnimateDiffModel` (not `AnimateDiffLoader`)
  - `ADE_ApplyAnimateDiffModelSimple` (not `AnimateDiffModelLoader`)
  - `ADE_UseEvolvedSampling` (not `AnimateDiffSampler`)
- Install AnimateDiff custom nodes (see step 1)
- Restart ComfyUI completely

### Error: "Motion model not found"
**Cause**: Motion model not downloaded or in wrong location
**Solution**:
- Download `mm_sd_v15_v2.ckpt` (see step 3)
- Verify path in Docker: `/app/ComfyUI/models/animatediff_models/mm_sd_v15_v2.ckpt`
- Verify path locally: `ComfyUI/models/animatediff_models/mm_sd_v15_v2.ckpt`

### Error: "VHS_VideoCombine node not found"
**Cause**: Video Helper Suite not installed or missing dependencies
**Solution**:
- Install Video Helper Suite (see step 2)
- Install system dependencies: `apt-get install ffmpeg libavcodec-extra`
- Restart ComfyUI

### Error: "VHS_VideoCombine missing required input"
**Cause**: Missing required parameters for VHS node
**Solution**: Ensure VHS_VideoCombine includes ALL parameters:
```javascript
{
  filename_prefix: "animatediff",
  images: ["11", 0],
  frame_rate: 8,          // Required
  loop_count: 0,          // Required
  pingpong: false,        // Required
  save_output: true,      // Required
  format: "video/h264-mp4" // Required
}
```

### Error: "Invalid seed value -1"
**Cause**: KSampler doesn't accept -1 for random seed
**Solution**: Convert -1 to random positive integer:
```javascript
seed: seed === -1 ? Math.floor(Math.random() * 4294967295) : seed
```

### Error: "COMFYUI_OUTPUT_DIR is not defined"
**Cause**: Environment variable not set correctly
**Solution**: Add to `.env.local`:
```bash
COMFYUI_OUTPUT_DIR=../outputs
```
For Docker: Use `outputs` (mapped to `./outputs:/app/ComfyUI/output`)
For local: Use relative path from server directory: `../outputs`

### Error: "ENOENT: no such file or directory" when copying video
**Cause**: Output directory path mismatch
**Solution**:
- Check Docker volume mapping in `docker-compose.yml`:
  ```yaml
  volumes:
    - ./outputs:/app/ComfyUI/output
  ```
- Set `COMFYUI_OUTPUT_DIR=../outputs` (relative to server directory)
- Verify files exist: `ls -la outputs/*.mp4`

### Videos are too short/long
Adjust in `hooks/useMusicVideoGenerator.ts`:
```typescript
fps: 8,  // Increase for smoother motion
steps: 20  // Increase for better quality
```

### Low quality output
Increase resolution in `hooks/useMusicVideoGenerator.ts`:
```typescript
width: 768,
height: 768,
steps: 30,
cfg: 8.0
```

### Workflow validation failed
**Cause**: Node configuration or connections invalid
**Solution**:
- Check node names match AnimateDiff-Evolved Gen2
- Verify all node inputs have valid connections
- Test workflow in ComfyUI web interface first
- Check ComfyUI console for detailed error messages

## Performance Notes

- **Frame count**: Calculated as `Math.ceil(duration * fps)`
- **Memory usage**: ~4-6GB VRAM for 512x512
- **Generation time**: ~30-60 seconds per clip (depends on GPU)
- **Batch processing**: Currently sequential (one clip at a time)

## Advanced Configuration

### Custom Motion Models
To use different motion models, edit `server/index.js:682`:
```javascript
motion_model: "mm_sd_v15_v2.ckpt"  // Change here
```

Available models:
- `mm_sd_v15_v2.ckpt` - Standard motion
- `mm_sd_v14.ckpt` - Older version
- Custom trained models

### Checkpoint Selection
Change the base model in `server/index.js:691`:
```javascript
"ckpt_name": "realisticVisionV51_v51VAE.safetensors"
```

## Integration Points

### Backend Endpoint
```
POST /api/comfyui/generate-video-clip
Body: {
  imageUrl: string,
  prompt: string,
  duration: number,
  negative_prompt?: string,
  width?: number,
  height?: number,
  fps?: number,
  steps?: number,
  cfg?: number,
  seed?: number
}
```

### Frontend Usage
```typescript
const { clipUrl } = await backendService.generateVideoClip({
  imageUrl: shot.preview_image_url,
  prompt: shot.prompt || shot.description,
  duration: shot.end_time - shot.start_time,
  width: 512,
  height: 512,
  fps: 8,
  steps: 20,
  cfg: 7.0
});
```

## Next Steps

After setup:
1. Test single clip generation
2. Monitor ComfyUI logs for errors
3. Adjust quality parameters as needed
4. Consider batch processing for multiple clips