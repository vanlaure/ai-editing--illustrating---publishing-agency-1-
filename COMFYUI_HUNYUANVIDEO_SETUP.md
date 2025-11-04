# ComfyUI HunyuanVideo I2V Setup Guide

## Overview
HunyuanVideo is a high-quality image-to-video (I2V) model that supports 720p output with camera controls. This guide covers setting up HunyuanVideo in ComfyUI for generating video clips from storyboard images.

## Prerequisites
- ComfyUI installed and running
- NVIDIA GPU with at least 16GB VRAM (24GB recommended for 720p)
- Python environment with ComfyUI dependencies
- ~50GB free disk space for model files

## Required Components

### 1. ComfyUI-HunyuanVideoWrapper Custom Nodes
Install the wrapper nodes:

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/kijai/ComfyUI-HunyuanVideoWrapper.git
cd ComfyUI-HunyuanVideoWrapper
pip install -r requirements.txt
```

### 2. Video Helper Suite (VHS)
Already installed for AnimateDiff, but verify:

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite.git
cd ComfyUI-VideoHelperSuite
pip install -r requirements.txt
```

### 3. Required Models

#### Transformer Model (Main Model)
**Option A: FP8 Scaled (Recommended for Quality)**
- File: `hunyuan-video-t2v-720p/transformers/mp_rank_00_model_states_fp8.pt`
- Download: https://huggingface.co/tencent/HunyuanVideo/blob/main/hunyuan-video-t2v-720p/transformers/mp_rank_00_model_states_fp8.pt
- Size: ~12GB
- Location: `ComfyUI/models/diffusion_models/`
- **Note**: Highest quality, requires `fp8_scaled` quantization option

**Option B: Regular FP8 (Faster)**
- File: `hunyuan_video_720_fp8_e4m3fn.safetensors`
- Download: https://huggingface.co/Kijai/HunyuanVideo_comfy/blob/main/hunyuan_video_720_fp8_e4m3fn.safetensors
- Size: ~12GB
- Location: `ComfyUI/models/diffusion_models/`

#### VAE (Video Autoencoder)
- File: `hunyuan_video_vae_fp16.safetensors`
- Download: https://huggingface.co/Kijai/HunyuanVideo_comfy/blob/main/hunyuan_video_vae_fp16.safetensors
- Size: ~1.2GB
- Location: `ComfyUI/models/vae/`

#### Text Encoder - LLM (LLaVA)
**Option 1: Text-only encoder (Recommended for I2V)**
- Files: Download entire folder
- Source: https://huggingface.co/Kijai/llava-llama-3-8b-text-encoder-tokenizer
- Location: `ComfyUI/models/LLM/llava-llama-3-8b-text-encoder-tokenizer/`
- **Auto-download available**: Set path in loader node, will download automatically

**Option 2: Full LLaVA with vision (For IP2V - Image Prompting)**
- Files: Download entire folder
- Source: https://huggingface.co/xtuner/llava-llama-3-8b-v1_1-transformers
- Location: `ComfyUI/models/LLM/llava-llama-3-8b-v1_1-transformers/`
- **Only needed if using image prompting feature**

#### CLIP Text Encoder
**Option 1: Use ComfyUI's built-in CLIP**
- Any CLIP-L model in `ComfyUI/models/clip/`
- Disable `clip_model` in text encoder loader
- Connect ClipLoader node to text encoder

**Option 2: Download original CLIP**
- Files: Download from https://huggingface.co/openai/clip-vit-large-patch14
- Location: `ComfyUI/models/clip/clip-vit-large-patch14/`
- **Auto-download available**

## Installation Steps

### 1. Clone Custom Nodes
```bash
cd ComfyUI/custom_nodes
git clone https://github.com/kijai/ComfyUI-HunyuanVideoWrapper.git
cd ComfyUI-HunyuanVideoWrapper
pip install -r requirements.txt
```

### 2. Create Model Directories
```bash
mkdir -p ComfyUI/models/LLM
mkdir -p ComfyUI/models/diffusion_models
mkdir -p ComfyUI/models/vae
```

### 3. Download Models
Use HuggingFace CLI for easier downloads:

```bash
pip install huggingface-hub

# Download Transformer (choose one)
huggingface-cli download Kijai/HunyuanVideo_comfy hunyuan_video_720_fp8_e4m3fn.safetensors --local-dir ComfyUI/models/diffusion_models

# Download VAE
huggingface-cli download Kijai/HunyuanVideo_comfy hunyuan_video_vae_fp16.safetensors --local-dir ComfyUI/models/vae

# Download LLM (text encoder)
huggingface-cli download Kijai/llava-llama-3-8b-text-encoder-tokenizer --local-dir ComfyUI/models/LLM/llava-llama-3-8b-text-encoder-tokenizer
```

### 4. Verify Installation
Restart ComfyUI and check console for:
- `[HunyuanVideoWrapper] Loaded`
- `[VideoHelperSuite] Loaded`

Test the nodes appear in ComfyUI web interface under:
- `HunyuanVideoWrapper` category

## Workflow Configuration

### Basic I2V Workflow Structure
```
LoadImage → HunyuanVideoI2VLoader → HunyuanVideoTextEncode
                                            ↓
                              HunyuanVideoSampler → HunyuanVideoDecode
                                                           ↓
                                                    VHS_VideoCombine → MP4
```

### Key Nodes

#### 1. HunyuanVideoI2VLoader
- Loads the main transformer model
- Options:
  - `model`: Select `.safetensors` or `.pt` file
  - `quantization`: `fp8`, `fp8_scaled`, `bf16`
  - `enable_i2v`: `true` (for image-to-video)

#### 2. HunyuanVideoTextEncode
- Encodes text prompts
- Inputs:
  - `prompt`: Text description
  - `llm_model`: Path to LLM text encoder
  - `clip_model`: Path to CLIP or connect ClipLoader

#### 3. HunyuanVideoSampler
- Main sampling node
- Parameters:
  - `steps`: 20-50 (higher = better quality, slower)
  - `cfg`: 7.0-9.0 (guidance scale)
  - `denoise`: 0.8-1.0 (for I2V, use 0.8-0.9)
  - `seed`: Random seed
  - `frames`: Number of frames (24-120)
  - `width`: 1280 (720p standard)
  - `height`: 720
  - `fps`: 24-30

#### 4. Camera Controls (Optional)
For I2V with camera motion:
- `camera_motion`: Options like `zoom_in`, `zoom_out`, `pan_left`, `pan_right`, `static`

## Memory Requirements

### Resolution vs VRAM
- **480p (848x480)**: ~10GB VRAM
- **720p (1280x720)**: ~16GB VRAM (recommended 20GB)
- **1080p (1920x1080)**: ~24GB+ VRAM

### Optimization Tips
1. **Use FP8 quantization** for lower VRAM
2. **Offload text encoders** to CPU if needed
3. **Reduce frame count** (24-48 frames for testing)
4. **Lower resolution** (480p for prototyping)
5. **Enable memory efficient attention** in ComfyUI settings

## API Parameters

### `/api/comfyui/generate-video-clip` Endpoint

When `quality: 'high'` is specified:

```json
{
  "imageUrl": "string",
  "prompt": "string",
  "duration": "number (seconds)",
  "quality": "high",
  "width": 1280,
  "height": 720,
  "fps": 24,
  "steps": 30,
  "cfg": 8.0,
  "denoise": 0.85,
  "camera_motion": "static",
  "seed": -1
}
```

### Quality Presets

**High Quality (720p)**
```typescript
{
  width: 1280,
  height: 720,
  fps: 24,
  steps: 30,
  cfg: 8.0,
  denoise: 0.85
}
```

**Medium Quality (540p)**
```typescript
{
  width: 960,
  height: 540,
  fps: 24,
  steps: 25,
  cfg: 7.5,
  denoise: 0.8
}
```

**Draft Quality (480p)**
```typescript
{
  width: 848,
  height: 480,
  fps: 24,
  steps: 20,
  cfg: 7.0,
  denoise: 0.75
}
```

## Troubleshooting

### Out of Memory Errors
**Cause**: Insufficient VRAM
**Solutions**:
- Use FP8 quantization: `fp8` or `fp8_scaled`
- Reduce resolution (start with 480p)
- Lower frame count
- Enable `--lowvram` or `--novram` in ComfyUI startup
- Offload text encoders to CPU

### Model Loading Errors
**Cause**: Missing model files or incorrect paths
**Solutions**:
- Verify all model files exist in correct directories
- Check file sizes match expected (no partial downloads)
- Use auto-download feature by setting correct paths
- Check console for specific error messages

### Slow Generation Speed
**Cause**: Large model, high resolution
**Solutions**:
- Use regular FP8 instead of FP8 scaled
- Enable SageAttention (if available)
- Reduce steps (20-25 for testing)
- Use lower resolution for prototyping

### Poor Quality Output
**Cause**: Low denoise, insufficient steps, or poor prompt
**Solutions**:
- Increase `denoise` to 0.85-0.9
- Increase `steps` to 30-40
- Use FP8 scaled weights for better quality
- Improve prompt with more detail
- Add negative prompts for unwanted elements

### Camera Controls Not Working
**Cause**: I2V mode not enabled or unsupported in model
**Solutions**:
- Ensure `enable_i2v: true` in model loader
- Use official I2V checkpoint
- Check HunyuanVideoWrapper version supports I2V

## Performance Notes

- **Frame count**: Calculated as `Math.ceil(duration * fps)`
- **Memory usage**: 
  - 480p: ~10-12GB VRAM
  - 720p: ~16-20GB VRAM
  - 1080p: ~24GB+ VRAM
- **Generation time**:
  - 480p: ~60-90 seconds per clip (24 frames)
  - 720p: ~120-180 seconds per clip (24 frames)
  - Scales with frame count and steps

## Advanced Features

### IP2V - Image Prompting to Video
Use images as part of the prompt (like IP-Adapter):
1. Load image with `LoadImage`
2. Connect to `HunyuanVideoTextEncode` (supports up to 2 images)
3. Reference in prompt: `"Describe this <image> in great detail"`
4. Requires full LLaVA model with vision tower

### Enhance-A-Video
Near-free quality boost with minimal speed impact:
- Enable in workflow for improved detail
- No additional VRAM cost
- Slight inference time increase (~5-10%)

### Context Windowing
For longer videos beyond standard frame limits:
- Available in wrapper nodes
- Not in native implementation yet

## Comparison: AnimateDiff vs HunyuanVideo

| Feature | AnimateDiff | HunyuanVideo |
|---------|-------------|--------------|
| Resolution | 512x512 | 720p-1080p |
| Quality | Medium | High |
| Speed | Fast (~30-60s) | Slower (~120-180s) |
| VRAM | 4-6GB | 16-24GB |
| I2V Support | Limited | Excellent |
| Camera Controls | No | Yes |
| Use Case | Quick drafts | Final quality |

## Next Steps

After setup:
1. Test single clip generation with sample image
2. Verify output quality at different resolutions
3. Benchmark generation time on your hardware
4. Test camera controls with storyboard images
5. Integrate into music video generation pipeline

## References

- GitHub: https://github.com/kijai/ComfyUI-HunyuanVideoWrapper
- Models: https://huggingface.co/Kijai/HunyuanVideo_comfy
- Text Encoder: https://huggingface.co/Kijai/llava-llama-3-8b-text-encoder-tokenizer
- Official Tencent Repo: https://huggingface.co/tencent/HunyuanVideo