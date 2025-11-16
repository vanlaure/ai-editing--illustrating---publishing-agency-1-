# HunyuanVideo ComfyUI Optimization Guide for Realistic Video Generation

## Executive Summary
Based on official Tencent documentation and ComfyUI best practices, this guide provides 4 optimized workflow configurations to maximize realistic video output quality.

## Key Optimization Factors

### 1. Text Encoder Configuration
- **Model**: LLaVA-LLaMA-3-8B (llava_llama3_fp8_scaled.safetensors)
- **Context Window**: 8192 tokens
- **Optimal Prompt Length**: 512-1024 tokens
- **Problem**: Verbose motion descriptions dilute core action
- **Solution**: Concise prompts with structure: [Subject] + [Core Action] + [Setting] + [Quality]

### 2. Memory and Performance Settings
- **720p (720x1280)**: Requires 60GB VRAM minimum
- **544p (544x960)**: Requires 45GB VRAM minimum
- **Recommended**: Use FP8 weights (fp8_e4m3fn) for memory efficiency
- **Frame Count**: 73 frames max for 720p, 49 frames for 544p

### 3. Sampling Parameters for Realism
- **CFG Scale**: 6.0-7.0 (lower values often better for realism)
- **Steps**: 20-30 (sweet spot for quality/speed)
- **Sampler**: DPM++ 2M Karras or Euler Ancestral
- **Scheduler**: Karras for better motion consistency

### 4. Stability Enhancements
- **Flow Shift**: 7.0 for more stable video generation
- **I2V Stability**: Enable for image-to-video workflows
- **Camera Motion**: Minimal for portraits, specify when needed

## Workflow Rankings & Use Cases

### 🥇 #1: Image-to-Video Workflow (Best Overall Realism)
**File**: `hunyuan_i2v_optimized.json`
**Why It's Best**:
- Starts with high-quality reference image
- Uses V2 "replace" model for better image adherence
- Flow shift 7.0 for stability
- Strength 0.7 for good motion while preserving quality

**Use When**: You have a good reference image and want maximum realism

### 🥈 #2: Portrait Ultra-Realistic Workflow
**File**: `hunyuan_portrait_ultra_realistic.json`
**Why It's Second**:
- Optimized specifically for facial realism
- Lower CFG (6.0) reduces artifacts
- 30 steps for maximum quality
- Strong negative prompts for realism

**Use When**: Creating talking head videos or portrait content

### 🥉 #3: Standard 720p Optimized Workflow
**File**: `hunyuan_realistic_optimized.json`
**Why It's Third**:
- Good balance of quality and resources
- FP8 optimization for memory efficiency
- Standard settings work for most content

**Use When**: General realistic video generation with sufficient VRAM

### #4: Low VRAM Workflow
**File**: `hunyuan_low_vram_optimized.json`
**Why It's Last**:
- Sacrifices resolution for compatibility
- Shorter frame count (49 frames)
- Lower steps (20) for speed

**Use When**: Limited to <50GB VRAM

## Optimal Prompt Strategies

### ✅ GOOD Prompt Examples:
```
"Professional businesswoman walking confidently, modern office, natural lighting, photorealistic"

"Close-up portrait, subtle head movement, direct eye contact, soft studio lighting, 8K quality"

"Man speaking naturally, business setting, minimal motion, realistic skin texture"
```

### ❌ AVOID These Prompt Patterns:
```
"A professional businesswoman with flowing hair gracefully walking through a large modern office building with glass windows and contemporary furniture while making subtle gestures and maintaining perfect posture..."
```

### Essential Negative Prompts:
```
"cartoon, anime, illustration, painting, artificial, blurry, low quality, distorted face, oversaturated, plastic skin"
```

## Camera Motion Keywords (When Needed):
- `zoom in` / `zoom out`
- `pan left` / `pan right`
- `pan up` / `pan down`
- `tilt left` / `tilt right`
- `static shot` (for minimal motion)
- `handheld shot` (for natural camera shake)

## Model File Requirements

### Essential Files:
1. **Text Encoders** (`models/text_encoders/`):
   - `clip_l.safetensors`
   - `llava_llama3_fp8_scaled.safetensors`

2. **VAE** (`models/vae/`):
   - `hunyuan_video_vae_bf16.safetensors`

3. **Diffusion Models** (`models/diffusion_models/`):
   - Text-to-Video: `hunyuan_video_t2v_720p_bf16.safetensors`
   - Image-to-Video V2: `hunyuan_video_v2_replace_image_to_video_720p_bf16.safetensors`

4. **Vision Encoder** (`models/clip_vision/`) - For I2V:
   - `llava_llama3_vision.safetensors`

## Troubleshooting Common Issues

### Problem: Unrealistic/Cartoon-like Results
**Solutions**:
- Lower CFG scale to 6.0-6.5
- Add "photorealistic, natural lighting, real person" to positive prompt
- Strengthen negative prompts with "cartoon, anime, illustration"
- Use FP8 weights instead of BF16

### Problem: Poor Motion Quality
**Solutions**:
- Reduce motion strength if using I2V
- Use flow_shift 7.0 for stability
- Keep prompts concise, avoid verbose motion descriptions
- Try static shot or minimal motion keywords

### Problem: VRAM Out of Memory
**Solutions**:
- Use 544p resolution instead of 720p
- Enable FP8 weight_dtype
- Reduce frame count (49 instead of 73)
- Lower batch_size to 1

### Problem: Blurry or Low Quality
**Solutions**:
- Increase steps to 25-30
- Add quality modifiers: "4K quality", "8K quality", "sharp"
- Use DPM++ 2M Karras sampler
- Check that you're using the bf16 VAE model

## Hardware Recommendations

### Minimum Setup:
- GPU: 45GB VRAM (RTX A6000, A100 40GB + CPU offloading)
- Settings: 544p, FP8 weights, 20 steps, 49 frames

### Recommended Setup:
- GPU: 60GB+ VRAM (A100 80GB, H100)
- Settings: 720p, FP8 weights, 25-30 steps, 73 frames

### Optimal Setup:
- GPU: 80GB+ VRAM (H100, multiple GPUs)
- Settings: 720p, BF16 weights, 30 steps, 129 frames

## Next Steps for Implementation

1. **Test the I2V workflow first** - Usually produces best results
2. **Start with concise prompts** - Build complexity gradually
3. **Monitor VRAM usage** - Adjust resolution if needed
4. **Compare outputs** - Test different CFG scales (6.0-7.5)
5. **Fine-tune based on results** - Adjust steps and sampler as needed

This optimization guide is based on official Tencent HunyuanVideo documentation and ComfyUI community best practices as of November 2025.
