# Hunyuan Workflows (ComfyUI)

This folder mirrors the optimization guide and gives the AI agent clear rules on when to load each workflow JSON for best realism.

## Files
- `hunyuan_i2v_optimized.json` — Image-to-Video (V2 replace) with reference image; best overall realism.
- `hunyuan_portrait_ultra_realistic.json` — Portrait / talking-head focus; minimal motion; strongest face realism.
- `hunyuan_realistic_optimized.json` — Text-to-Video general 720p; balanced quality/perf when no reference image.

## Selection logic
- If a reference image is available and realism is top priority → use `hunyuan_i2v_optimized.json`.
- If the subject is a close-up/talking head with minimal motion → use `hunyuan_portrait_ultra_realistic.json`.
- Otherwise, for generic T2V generation → use `hunyuan_realistic_optimized.json`.
- Backend hint: pass `workflow: 'i2v' | 'portrait' | 'realistic'` to `/api/comfyui/generate-video-clip` (quality=`high`). If no image is provided, the backend automatically falls back to `realistic` (T2V).

## Shared assumptions
- Required models exist:
  - Text encoders: `models/text_encoders/clip_l.safetensors`, `models/text_encoders/llava_llama3_fp8_scaled.safetensors`
  - VAE: `models/vae/hunyuan_video_vae_bf16.safetensors`
  - Diffusion:
    - T2V: `models/diffusion_models/hunyuan_video_t2v_720p_bf16.safetensors`
    - I2V: `models/diffusion_models/hunyuan_video_v2_replace_image_to_video_720p_bf16.safetensors`
  - Vision encoder (I2V only): `models/clip_vision/llava_llama3_vision.safetensors`
- Default resolution: 720x1280, batch_size=1; reduce to 544p/49 frames if VRAM <50GB.
- Use FP8 (`weight_dtype: fp8_e4m3fn`) for mem efficiency; bf16 VAE.

## Parameter guidelines
- Sampler: `dpmpp_2m` with `scheduler: karras`.
- CFG: 6.0–6.5 for realism (Portr.: 6.0; I2V: 6.5 recommended; T2V: up to 7.0 if detail needed).
- Steps: 25–30 (Portr.: 30; I2V: 25; T2V: 25).
- Flow/stability: set `flow_shift: 7.0` on I2V; keep prompts concise; avoid verbose motion descriptions.
- Prompting: subject + core action + setting + quality; negatives stay short (cartoon/anime/illustration/plastic skin/distorted face).

## Switching hints
- To switch workflows, load the corresponding JSON and keep the key params above; only adjust prompt and seed unless VRAM requires lowering resolution or steps.
