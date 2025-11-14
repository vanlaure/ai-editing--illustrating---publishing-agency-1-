# Image-to-Video Denoise Fix

## Problem
Videos were only showing minimal movement (hair, background) instead of full character motion, and character scene bibles weren't being properly preserved in the generated videos.

## Root Cause
The system IS using image-to-video generation (not text-to-video), but the denoise values were too high:

- **AnimateDiff**: `denoise = 0.8` (too high)
- **HunyuanVideo**: `denoise = 0.85` (too high)

### What Denoise Does in Image-to-Video

In image-to-video generation:
- **High denoise (0.7-1.0)**: Model heavily modifies the input image → essentially becomes text-to-video
- **Low denoise (0.3-0.6)**: Model preserves input image features while adding motion → true image-to-video

With high denoise, the model was ignoring most of the reference image and generating new content based primarily on the text prompt, losing:
- Character features from scene bibles
- Composition and framing from reference images
- Visual consistency across shots

## Solution
Reduced denoise values to preserve image features while generating motion:

### AnimateDiff (Draft Quality)
- **Before**: `denoise = 0.8`
- **After**: `denoise = 0.55`
- **Result**: Preserves 45% of input image structure, adds controlled motion

### HunyuanVideo (High Quality)  
- **Before**: `denoise = 0.85`
- **After**: `denoise = 0.6`
- **Result**: Preserves 40% of input image, adds smooth motion

## Technical Details

### AnimateDiff Workflow (server/index.js:1040-1150)
```javascript
createAnimateDiffWorkflow({
  denoise = 0.55,  // Was 0.8
  // ...
  "4": LoadImage → "5": VAEEncode → "6": RepeatLatentBatch
  // Input image is encoded and repeated for all frames
})
```

### HunyuanVideo Workflow (server/index.js:1170-1280)
```javascript
createHunyuanVideoWorkflow({
  denoise = 0.6,  // Was 0.85
  // ...
  "2": LoadImage → CLIPVisionEncode → TextEncodeHunyuanVideo_ImageToVideo
  // Image features guide video generation
})
```

## How to Test

1. **Restart the server** for changes to take effect:
   ```bash
   # Stop current server (Ctrl+C)
   cd server && npm start
   ```

2. **Generate a video** with a character scene bible:
   - Use a reference image showing a clear character pose
   - Generate a video clip
   - Check if character features are preserved
   - Verify there's more than just hair/background movement

3. **Compare results**:
   - **Before**: Character barely recognizable, minimal motion
   - **After**: Character preserved, visible body/face movements

## Expected Behavior

With these settings, videos should:
- ✅ Preserve character features from scene bibles
- ✅ Show full body/face movements (not just hair)
- ✅ Maintain composition and framing
- ✅ Have consistent motion throughout
- ✅ Match the reference image style

## Further Tuning

If needed, denoise can be adjusted per-shot:
- **More preservation**: Lower denoise (0.4-0.5)
- **More motion**: Higher denoise (0.6-0.7)
- **Sweet spot**: 0.55 for AnimateDiff, 0.6 for HunyuanVideo

## Related Files
- `server/index.js:1041` - AnimateDiff denoise default
- `server/index.js:1175` - HunyuanVideo denoise default
- `server/index.js:1937` - AnimateDiff API endpoint default
- `server/index.js:1903` - HunyuanVideo API endpoint default