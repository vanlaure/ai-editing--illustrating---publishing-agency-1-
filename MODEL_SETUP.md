# Automatic1111 Model Setup for Ultra-Realistic Images

This guide provides instructions for setting up the optimal models, LoRAs, and VAE for generating ultra-realistic images with maximum speed.

## 🎯 Recommended Configuration

### Base Model
**Realistic Vision V5.1**
- File: `realisticVisionV51_v51VAE.safetensors`
- Download: https://civitai.com/models/4201/realistic-vision-v51
- Size: ~2.1GB
- **Why**: Industry-leading photorealistic model with built-in VAE, optimized for speed and quality

### VAE (Variational Autoencoder)
**MSE 840000 EMA Pruned**
- File: `vae-ft-mse-840000-ema-pruned.safetensors`
- Download: https://huggingface.co/stabilityai/sd-vae-ft-mse-original/blob/main/vae-ft-mse-840000-ema-pruned.safetensors
- Size: ~334MB
- **Why**: Best color accuracy and detail retention for realistic images

### LoRAs (Low-Rank Adaptations)
1. **Add Detail LoRA**
   - File: `add_detail.safetensors`
   - Download: https://civitai.com/models/82098/add-more-details-detail-enhancer-tweaker-lora
   - Weight: 0.7
   - **Why**: Enhances fine details without artifacts

2. **More Details LoRA**
   - File: `more_details.safetensors`
   - Download: https://civitai.com/models/87153/detail-tweaker-lora
   - Weight: 0.5
   - **Why**: Additional detail enhancement, works well with add_detail

## 📁 Installation

1. **Create directory structure in your project:**
   ```
   models/
   ├── Stable-diffusion/
   │   └── realisticVisionV51_v51VAE.safetensors
   ├── VAE/
   │   └── vae-ft-mse-840000-ema-pruned.safetensors
   └── Lora/
       ├── add_detail.safetensors
       └── more_details.safetensors
   ```

2. **Download models to respective folders:**
   - Place main model in `models/Stable-diffusion/`
   - Place VAE in `models/VAE/`
   - Place LoRAs in `models/Lora/`

3. **Restart Docker container:**
   ```bash
   docker-compose restart automatic1111
   ```

## ⚡ Speed Optimization Settings

### Current Configuration (Pre-configured in app):
```json
{
  "model": "realisticVisionV51_v51VAE.safetensors",
  "vae": "vae-ft-mse-840000-ema-pruned.safetensors",
  "lora": "add_detail:0.7,more_details:0.5",
  "sampler": "DPM++ 2M Karras",
  "steps": 20,
  "cfg_scale": 7,
  "width": 512,
  "height": 512
}
```

### Why These Settings Are Fast:
- **DPM++ 2M Karras**: One of the fastest high-quality samplers (20 steps = ~3-5 seconds per image)
- **20 Steps**: Optimal balance between speed and quality
- **512x512 Base**: Faster generation, upscaled later if needed
- **CFG Scale 7**: Prevents over-processing

### Docker Optimizations:
```yaml
CLI_ARGS: 
  --xformers              # Memory-efficient attention (30% faster)
  --opt-sdp-attention     # Optimized attention mechanism
  --no-half-vae           # Better VAE quality without slowdown
  
COMMANDLINE_ARGS:
  --medvram              # Optimized VRAM usage
  --opt-split-attention  # Split attention for speed
```

## 🚀 Performance Expectations

### Generation Times (RTX 3060 12GB):
- **Single Image (512x512)**: ~3-5 seconds
- **Single Image (1024x576)**: ~8-12 seconds
- **Batch of 10 images (parallel)**: ~30-45 seconds

### Memory Usage:
- **Base Model**: ~2GB VRAM
- **With LoRAs**: ~2.5GB VRAM
- **Peak During Generation**: ~4-5GB VRAM

## 🎨 Quality Settings by Use Case

### Storyboard Shots (16:9)
```javascript
{
  width: 1024,
  height: 576,
  steps: 20,
  cfg_scale: 7
}
```
**Result**: Cinema-quality frames in ~8 seconds

### Character References (3:4)
```javascript
{
  width: 768,
  height: 1024,
  steps: 20,
  cfg_scale: 7
}
```
**Result**: Detailed character portraits in ~10 seconds

### Location Shots (16:9)
```javascript
{
  width: 1024,
  height: 576,
  steps: 20,
  cfg_scale: 7
}
```
**Result**: Wide environment shots in ~8 seconds

## 🔧 Alternative Models (If Needed)

### For Even Faster Generation:
**SDXL Turbo**
- Steps: 4-8 only
- Speed: 1-2 seconds per image
- Quality: Good but less detailed

### For Maximum Quality (Slower):
**SDXL 1.0**
- Steps: 30-50
- Speed: 15-25 seconds per image
- Quality: Exceptional detail

## 📊 Monitoring Performance

The app automatically logs generation times:
```
AI Service: Generating image for shot with A1111... shot_001
[A1111] Image generated in 4.2 seconds
```

## 🛠️ Troubleshooting

### Model Not Found
- Ensure model file is in `models/Stable-diffusion/`
- Check exact filename matches configuration
- Restart Docker container

### Slow Generation
- Check GPU utilization with `nvidia-smi`
- Reduce image size (512x512 instead of 1024x1024)
- Use fewer LoRAs
- Decrease steps to 15

### Out of Memory
- Enable `--lowvram` in docker-compose.yml
- Reduce batch size
- Use smaller image dimensions

## 🎯 Prompt Engineering Tips

The app automatically enhances prompts with:
- LoRA triggers: `<lora:add_detail:0.7,more_details:0.5>`
- Negative prompts: `blurry, low quality, worst quality, bad anatomy, extra limbs, watermark, text`

For best results:
- Be specific about lighting and composition
- Mention camera angles and focal lengths
- Include style keywords (cinematic, photorealistic, 8k uhd)

## 📈 Batch Generation

The app supports parallel batch generation for speed:
```javascript
// Generate 10 images in parallel (~30 seconds total)
const results = await backendService.generateBatchImagesWithA1111([
  { prompt: "scene 1" },
  { prompt: "scene 2" },
  // ... 8 more
]);
```

This is **10x faster** than generating sequentially!

## ✅ Verification Checklist

- [ ] Models downloaded and placed in correct folders
- [ ] Docker container restarted
- [ ] A1111 accessible at http://localhost:7860
- [ ] `USE_A1111=true` in .env.local
- [ ] App restarted after configuration changes
- [ ] First test image generated successfully

## 🔗 Useful Links

- **CivitAI**: https://civitai.com/ (Model repository)
- **Hugging Face**: https://huggingface.co/ (VAE and additional models)
- **A1111 Wiki**: https://github.com/AUTOMATIC1111/stable-diffusion-webui/wiki
- **Sampler Comparison**: https://stable-diffusion-art.com/samplers/