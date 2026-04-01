# AI Music Video Generator — Architecture & Setup Documentation

### PROJECT OVERVIEW

**Project Name:** AI Music Video Generator  
**Platform:** Web-based React + TypeScript frontend, Node.js/Express backend  
**Purpose:** Automated end-to-end music video generation pipeline from song upload to final video export  
**Core Stack:**
- **Frontend:** React 18, TypeScript, Vite, TailwindCSS
- **Backend:** Express.js, Node.js, WebSocket support
- **Video Generation:** ComfyUI integration (local AI model inference)
- **AI Services:** Google Gemini API, OpenRouter, NVIDIA NIM, Ollama (configurable)
- **Media Storage:** SQLite database + filesystem hybrid
- **Video Editing:** FFmpeg integration
- **Related:** StitchStream (separate React app for video post-production)

---

## 1. PROJECT STRUCTURE

```
/d/ai_music_video/
├── App.tsx                          # Root React component
├── index.tsx                        # Entry point
├── types.ts                         # All TypeScript interfaces (676 lines)
├── constants.ts                     # Global constants & VFX presets
├── vite.config.ts                   # Vite build configuration
├── tsconfig.json                    # TypeScript config
├──
├── components/                      # React UI components (5,110 lines total)
│   ├── UploadStep.tsx              # Song upload interface
│   ├── ControlsStep.tsx            # Creative brief editor
│   ├── StoryboardStep.tsx          # Storyboard review & media generation
│   ├── ReviewStep.tsx              # Final review & export
│   ├── SettingsPage.tsx            # AI provider configuration
│   ├── StoryboardShot.tsx          # Individual shot editor
│   ├── StitchStreamStudio.tsx      # StitchStream integration UI
│   ├── BiblesDisplay.tsx           # Character/location bible viewer
│   ├── MediaLibraryModal.tsx       # Generated media browser
│   ├── ExportModal.tsx             # Export settings dialog
│   ├── HeaderActions.tsx           # Top navigation & actions
│   └── [Other: Modals, Visualizers, Spinners]
├──
├── services/                        # Business logic (7,643 lines total)
│   ├── aiService.ts                # Song analysis, storyboard generation, prompt engineering
│   ├── backendService.ts           # Frontend→backend API calls
│   ├── providerClient.ts           # OpenAI-compatible LLM client routing
│   ├── providerService.ts          # Model fetching from various providers
│   ├── visualAgentService.ts       # Visual continuity audit (QA)
│   ├── webSocketService.ts         # Real-time video generation status updates
│   ├── promptOptimizer.ts          # Model-specific prompt adaptation
│   ├── promptEngineeringKB.ts      # LLM-level knowledge base for different models
│   ├── vfxService.ts               # VFX effect processing
│   ├── musicEngineerService.ts     # Music analysis & beat detection
│   ├── ffmpegService.ts            # FFmpeg wrapper for video composition
│   ├── durationAdjustmentService.ts # Shot timing adjustment
│   ├── lyricAnimationService.ts    # Lyric animation generation
│   └── mockApiService.ts           # Test/demo API responses
├──
├── hooks/                           # Custom React hooks
│   └── useMusicVideoGenerator.ts   # Main state management hook (880+ lines)
├──
├── stores/                          # State stores
│   └── settingsStore.tsx           # AI provider settings (Context + Reducer)
├──
├── server/                          # Express backend (2,899 lines)
│   ├── index.js                    # API endpoints & WebSocket server
│   ├── db.js                       # SQLite database layer
│   └── lipsync.js                  # Lip-sync processing
├──
├── stitchstream/                    # StitchStream video editor (separate Vite app)
│   ├── App.tsx
│   ├── components/
│   │   ├── Player.tsx             # Video player with controls
│   │   ├── Timeline.tsx           # Timeline editor
│   │   └── VideoUploader.tsx      # File uploader
│   ├── services/
│   │   └── geminiService.ts       # AI analysis of montage/clips
│   └── utils/
│       ├── introOutroRenderer.ts  # Title/credit rendering
│       └── videoUtils.ts          # Video utility functions
├──
├── workflows/                       # ComfyUI workflow templates (JSON)
├── data/                            # Runtime data directories
│   ├── images/
│   ├── videos/
│   ├── audio/
│   └── productions/                # Saved production files
├──
└── [Config files: .env, .env.local, package.json, etc.]
```

---

## 2. THE COMPLETE MUSIC VIDEO GENERATION PIPELINE

### High-Level Flow

```
1. UPLOAD STEP
   ↓ (user uploads MP3/WAV)
2. SONG ANALYSIS
   ↓ (AI listens & analyzes: BPM, mood, structure, beats, lyrics)
3. CREATIVE BRIEF / CONTROLS STEP
   ↓ (user selects style, mood, video type, moodboard images)
4. GENERATION
   ├─→ Generate Bibles (character & location descriptions)
   ├─→ Generate Storyboard (shot plan with timing)
   ├─→ Generate Preview Images (for each shot)
   ├─→ Generate Video Clips (from images via ComfyUI)
   ├─→ Post-Production (VFX, color grading, stabilization)
   └─→ Assemble Final Video (FFmpeg composition)
5. REVIEW STEP
   ├─→ Visual Continuity Audit (QA agent checks consistency)
   └─→ Executive Producer Feedback (critical review)
6. EXPORT
   └─→ Final video download (1080p MP4 or 2160p options)
```

### Detailed Step Breakdown

#### **STEP 1: UPLOAD (`components/UploadStep.tsx`)**
- User uploads audio file + enters song title/artist/lyrics
- Selects singer gender (male/female/unspecified) for character generation
- **Handler:** `processSongUpload()` → calls `analyzeSong()`

#### **STEP 2: SONG ANALYSIS (`services/aiService.ts::analyzeSong`)**
Calls Gemini (or configured thinking LLM) with audio file + lyrics:

**Outputs:**
- **title, artist, bpm, genre, mood[]**
- **structure[]** - Sections: {name, start, end} (intro, verse, chorus, bridge, outro)
- **beats[]** - All beats with timestamps & energy levels (0-1)
- **instrumentation[]** - List of detected instruments
- **vocals** - Duet detection:
  - count (1, 2, 3+)
  - type: 'solo' | 'duet' | 'ensemble'
  - vocalists[]: {id, display_name, gender, role, segments[{start, end}]}
- **lyric_analysis** - Deep reading of lyrics:
  - primary_themes, narrative_structure, imagery_style
  - emotional_arc, key_visual_elements
  - character_insights (who are these people?), line_by_line_story
- **recommended_video_types** - {primary, alternatives[], reasoning}

#### **STEP 3: CONTROLS STEP (`components/ControlsStep.tsx`)**
User can:
- Refine song analysis (edit detected info)
- Upload moodboard images → AI suggests creative brief
- Set creative brief: {feel, style, mood[], videoType, lyricsOverlay, color_palette}
- **Handler:** `generateCreativeAssets()` → generates Bibles + Storyboard

#### **STEP 4A: GENERATE BIBLES (`services/aiService.ts::generateBibles`)**

**Characters Bible:**
For each character (or duet vocalists):
- **name** - e.g., "Protagonist", "Singer A"
- **role_in_story** - What they're doing in the video
- **physical_appearance** - ULTRA-DETAILED (10+ fields):
  - age_range, gender_presentation, ethnicity, body_type, skin_tone
  - face_shape, nose_description, lip_description, brow_description, jawline_description
  - key_facial_features (scars, dimples, moles)
  - hair_style_and_color, hair_texture, eye_color, eye_shape
- **costuming_and_props**:
  - outfit_style (ONE consistent outfit throughout)
  - specific_clothing_items[] (every item head-to-toe)
  - signature_props[]
- **performance_and_demeanor**:
  - emotional_arc, performance_style, gaze_direction
- **cinematic_style**:
  - camera_lenses, lighting_style, color_dominants_in_shots[]
- **source_images[]** - User can upload reference images

**Locations Bible:**
For each location (minimum 1):
- **name** - e.g., "Downtown Street", "Bedroom"
- **setting_type** - What kind of place
- **atmosphere_and_environment**:
  - time_of_day, weather, dominant_mood
- **architectural_and_natural_details**:
  - style (e.g., "Brutalist", "Urban")
  - key_features[]
- **sensory_details**:
  - textures[], environmental_effects[] (fog, dust, lens flare)
- **cinematic_style**:
  - lighting_style, color_palette[], camera_perspective
- **source_images[]**

#### **STEP 4B: GENERATE STORYBOARD (`services/aiService.ts::generateStoryboard`)**

For **each song section** (intro, verse, chorus, etc.):
- Calculate number of shots needed: (duration_in_seconds / 7) ≈ one 6-8s shot per clip
- Organize into **scenes** with transitions

**Each StoryboardShot contains:**
- **id** - "1-1", "1-2", etc.
- **start, end** - Timestamp in seconds (beat-aligned)
- **shot_type** - "Wide establishing", "Close-up", "Medium shot", etc.
- **camera_move** - Professional cinematography language:
  - DEPTH: "Slow push-in", "Dolly in/out", "Zoom in/out"
  - HORIZONTAL: "Pan left/right", "Tracking left/right", "Whip pan"
  - VERTICAL: "Tilt up/down", "Crane up/down"
  - ORBITAL: "Orbit left/right", "Arc shot"
  - SPECIALTY: "Rack focus", "Parallax", "Push-in with rotation"
  - STATIC: "Static tripod" (use sparingly)
- **composition** - Framing guidance (rule of thirds, centered, etc.)
- **subject** - What we're looking at
- **action** - CRITICAL: What character is doing (e.g., "smiling radiantly", "turning head slowly")
- **location_ref** - Reference to bible location name
- **character_refs[]** - References to bible character names
- **performer_refs[]** - Optional: vocalist IDs if concert/performance
- **lip_sync_hint** - true if vocals occur in this shot
- **lyric_overlay_v2** - Rich lyric display config:
  - text, timing (appear/disappear), animation (fade/slide/bounce/typewriter/zoom)
  - styling (font, size, color, shadow, 3D effects)
  - positioning (anchor point, offset, z-index)
- **preview_image_url** - Will be filled by image generation
- **clip_url** - Will be filled by video generation
- **cinematic_enhancements**:
  - lighting_style, camera_lens, camera_motion
- **design_agent_feedback**:
  - sync_score (1-10), cohesion_score (1-10), feedback text
- **vfx_stack[]** - Array of VFX effects with intensity
- **video_model** - Routing hint for ComfyUI (waver, animatediff_v3, wan2_2, etc.)
- **render_profile** - 'realism' | 'stylized' | 'plate' | 'portrait'
- **music_alignment** - Beat sync settings
- **duration_flexibility** - Dynamic timing (min/max/preferred seconds)

**Storyboard Post-Processing (`ensureStoryboardCoverage`):**
- Validates complete song coverage (no gaps)
- Aligns shot timing to beat grid
- Ensures each shot is 6-8 seconds (ComfyUI clip limit)

#### **STEP 4C: GENERATE PREVIEW IMAGES (`components/StoryboardStep.tsx`)**
For each shot:
1. Build optimized prompt via `getPromptForImageShot()` or `getOptimizedImagePrompt()`
2. Call `backendService.generateImageWithComfyUI()`
3. Returns **preview_image_url** (stored in shot)
4. User can **regenerate** or **edit** images in modal
5. Images used as reference for video generation

#### **STEP 4D: GENERATE VIDEO CLIPS (`backendService.ts::generateVideoClip`)**
For each shot with a preview image:
1. Select video model based on shot profile:
   - **waver** - Realistic, high-quality T2V/I2V
   - **animatediff_v3** - High-energy, controlled motion
   - **wan2_2** - Stylized, anime/surreal aesthetic
   - **step_video_ti2v** - Portrait/face-focused consistency
   - **videocrafter2** - Wide plates, efficient backgrounds
2. Build video prompt + negative prompt
3. Call `/api/comfyui/generate-video-clip` with:
   - imageUrl, prompt, duration (shot.end - shot.start)
   - video_model, render_profile, workflow hint
   - Optional: camera_motion, lipSync, audioUrl
   - fps, cfg, denoise parameters
4. Backend queues job, returns promptId
5. WebSocket listens for `video_generated` event
6. When complete: update shot.clip_url

#### **STEP 4E: POST-PRODUCTION**
- **VFX:** Apply effects (slow-motion, glitch, lens flare, etc.) per shot
- **Color Grading:** Unified color pass (via ffmpeg filters)
- **Stabilization:** Smoothing jitter/handheld camera work

#### **STEP 4F: ASSEMBLE FINAL VIDEO**
- Use FFmpeg to composite:
  - All clips in sequence
  - Audio track (original song)
  - Lyric overlays (animated text)
  - Intro overlay (title card) - optional
  - Outro overlay (credits) - optional
  - Cinematic effects (grain, light leaks, vignette)
- Output: 1080p MP4 or 2160p (configurable)

#### **STEP 5: REVIEW**

**5A: Visual Continuity Audit (`services/visualAgentService.ts`)**
- Runs `runVisualContinuityAudit()` on generated images/clips
- Gemini Vision reviews up to 12 assets (prioritizes video clips)
- Returns report with:
  - overallVerdict: 'pass' | 'warn' | 'fail'
  - overallScore: 0-100
  - checklist: characterConsistency, styleConsistency, continuity, visualQuality
  - issues[]: {shotId, severity, finding, recommendation}

**5B: Executive Producer Feedback**
- Optional AI review (Gemini) of storyboard pacing & narrative
- User can manually score: pacing_score, narrative_score, consistency_score
- Stored in storyboard.executive_producer_feedback

#### **STEP 6: EXPORT**
User chooses:
- **Resolution:** 720p, 1080p, 2160p
- **Aspect Ratio:** 16:9, 9:16, 1:1
- **Include Lyrics:** yes/no
- **Title Sequence:** None, Minimal Fade, Kinetic Glitch, Cinematic Reveal
- **Cinematic Overlay:** None, 8mm Film Grain, Subtle Light Leaks, Anamorphic Flares
- **Include Credits:** yes/no
- **Intro/Outro Config:** song_title, artist_name, duration, style, animation

Final video saved to `/data/videos/` and database, with shareable URL.

---

## 3. KEY SERVICES & EXPORTED FUNCTIONS

### **A. `aiService.ts` (4,000+ lines)**

**Core AI Generation Functions:**

1. **`analyzeSong(file, lyrics, title, artist, singerGender, providerSettings?)`**
   - Input: audio File, lyrics string, metadata
   - Output: {analysis: SongAnalysis, tokenUsage}
   - Flow: Gemini listens to audio + reads lyrics → JSON response
   - Detects: BPM, beats, structure, vocals, lyric themes, video type recommendations

2. **`analyzeSongEnhanced(audioBlob, progressCallback?)`**
   - Web Audio API beat detection (onset detection + spectral flux analysis)
   - Returns: EnhancedSongAnalysis with sub_beats, phrases, tempo_curve, energy_curve
   - Used for precise beat-locked shot timing

3. **`generateBibles(analysis, brief, singerGender, providerSettings?)`**
   - Input: SongAnalysis, CreativeBrief, singer gender
   - Output: {bibles: {characters[], locations[]}, tokenUsage}
   - Creates ultra-detailed character & location descriptions grounded in lyrics

4. **`generateStoryboard(analysis, brief, bibles, providerSettings?)`**
   - Input: SongAnalysis, CreativeBrief, Bibles
   - Output: {storyboard: Storyboard, tokenUsage}
   - Plans all shots with beat-aligned timing (6-8s clips)
   - Post-processes via `ensureStoryboardCoverage()` to guarantee full song coverage

5. **`researchModelPromptStyle(modelId, outputType, providerSettings?)`**
   - Async research: asks thinking LLM about unknown image/video models
   - Caches result in memory for subsequent prompts
   - Used by prompt optimization to auto-adapt to new models

**Prompt Generation Functions:**

6. **`getPromptForImageShot(shot, bibles, brief)`** → string
   - Builds detailed natural-language prompt for image generation
   - Includes character identity lock + location + cinematic details
   - For UI display in shot editor

7. **`getPromptForClipShot(shot, bibles, brief, useDetailedPrompt?)`** → string
   - Video clip prompt (6-8 second animation)
   - Chooses detailed or concise format based on model
   - Includes consistency instructions to prevent face morphing

8. **`getOptimizedImagePrompt(shot, bibles, brief, settings?)`** → {prompt, negativePrompt}
   - Model-aware optimization via promptOptimizer
   - Falls back to legacy prompt if no settings

9. **`getOptimizedVideoPrompt(shot, bibles, brief, settings?)`** → {prompt, negativePrompt}
   - Model-aware optimization for video (waver, animatediff, wan, etc.)

10. **`getPromptEngineeringKnowledge(settings?)`** → string
    - System prompt injection for thinking LLMs
    - Teaches AI about selected image/video models' optimal prompt formats

**Video Model Routing:**

11. **`chooseVideoModel(shot, section, brief)`**
    - Internal: selects video_model + render_profile for a shot
    - Logic: portrait shots → step_video_ti2v, stylized → wan2_2, plates → videocrafter2, etc.
    - Returns: {video_model, render_profile, video_model_reason, workflow_hint}

**Internal Helpers:**

12. **`buildCharacterIdentityBlock(char, level?)`** → string
    - Full or concise character description for prompt injection
    - Ensures visual consistency (same face, outfit across frames)

13. **`getEnhancedPromptForComfyUI(shot, bibles, brief)`** → string
    - ComfyUI-optimized prompt with quality tags
    - "photorealistic, 8k uhd, RAW photo..." + character details

14. **Beat Detection Functions:**
    - `detectBeatsAndSubBeats()` - Onset detection using spectral flux
    - `estimateTempo()` - BPM estimation via autocorrelation
    - `classifyBeatType()` - Identifies kick, snare, hi-hat, cymbal
    - `analyzeEnergyAndMeasures()` - Energy curve + bar detection

---

### **B. `providerClient.ts` (235 lines)**

**LLM Routing for Multiple Backends:**

1. **`generateWithProvider(provider, options)`** → Promise<{text, tokenUsage}>
   - Sends prompt to OpenAI-compatible endpoint (OpenRouter, NVIDIA NIM, Ollama, etc.)
   - Handles structured output (JSON Schema), multimodal images, temperature
   - Strips thinking tags, extracts JSON from response
   - **Endpoint logic:**
     - Ollama: `/api/chat`
     - Others: `/chat/completions`

2. **`generateThinking(settings, options)`** → Promise<GenerateResult | null>
   - Convenience wrapper: generates with thinking provider from settings
   - Returns null if not configured (fallback to Gemini)

3. **`hasThinkingProvider(settings?)`** → boolean
   - Checks if a thinking provider is properly configured

**Helper Functions:**

4. **`geminiSchemaToJsonSchema(schema)`** → any
   - Converts Gemini Type enum schemas to standard JSON Schema
   - Ensures strict mode compatibility (additionalProperties: false)

---

### **C. `providerService.ts` (361 lines)**

**Model Discovery for Multiple Backends:**

1. **`fetchModels(provider)`** → Promise<AIProviderModel[]>
   - Dispatcher: routes to correct provider's model list endpoint
   - Handles OpenRouter (665-model catalog), NVIDIA NIM, Ollama, ComfyUI, HuggingFace, custom

2. **OpenRouter Model Fetching:**
   - `fetchOpenRouterModels()` - Tries proxy backend for full catalog, falls back to /v1/models
   - Categorizes by modality (video, image, audio, text)
   - Calculates pricing per million tokens

3. **Provider-Specific Fetchers:**
   - `fetchNvidiaModels()` - NVIDIA's model endpoint
   - `fetchOllamaModels()` - Ollama's `/api/tags`
   - `fetchComfyUIModels()` - ComfyUI checkpoint loader
   - `fetchHuggingFaceModels()` - HuggingFace inference API
   - `fetchOpenAICompatibleModels()` - Generic OpenAI-compatible

4. **`testConnection(provider)`** → Promise<{ok, latencyMs, error?}>
   - Health check for each provider type
   - Timeout: 10 seconds

5. **`getModelCategories(models)`** → string[]
   - Extracts unique categories from model list for UI filtering

---

### **D. `backendService.ts` (350+ lines)**

**Frontend-to-Backend API Communication:**

**Media Upload:**
1. `uploadImage(file)` → {imageUrl, filename}
2. `uploadImages(files[])` → {imageUrls}
3. `uploadAudio(file)` → {audioUrl, filename}
4. `uploadVideo(file)` → {videoUrl, filename}

**Production Management:**
5. `saveProduction(data)` → {id}
6. `loadProduction(id)` → ProductionData
7. `deleteProduction(id)` → {success}

**ComfyUI Integration:**
8. `generateImageWithComfyUI(params)` → {imageUrl}
   - params: prompt, negative_prompt, width, height, steps, cfg_scale, init_image, reference_face_image, ipadapter_weight
   - Returns immediately with imageUrl (async processing via WebSocket)

9. `generateBatchImagesWithComfyUI(prompts[])`  → {imageUrls}
   - Batch image generation

10. `generateVideoClip(params)` → {promptId, message}
    - params: imageUrl, prompt, duration, quality, workflow, fps, cfg, seed, denoise, camera_motion, lipSync, audioUrl, shotId, video_model, render_profile
    - Returns promptId for status polling

11. `getImageByShotId(shotId)` → {imageUrl, id} | null
    - Retrieves previously generated image for a shot

12. `recoverImages(shotIds[])` → {recovered, missing}
    - Recovers images from database if lost (useful after server restart)

**Health Checks:**
13. `checkComfyUIHealth()` → {available}
14. `checkStitchStreamHealth()` → {available}

**Constants:**
- `BACKEND_URL` - From env or defaults to localhost:3002
- `STITCHSTREAM_URL` - From env or defaults to localhost:4100

---

### **E. `visualAgentService.ts` (200+ lines)**

**Visual QA Agent:**

1. **`runVisualContinuityAudit(storyboard, bibles, brief)`** → Promise<{report, tokenUsage}>
   - Uses Gemini Vision to review generated images/video clips
   - Checks: character consistency, style consistency, continuity, visual quality
   - Returns report with pass/warn/fail verdict + detailed issues
   - Caps to 12 assets (prioritizes final video clips over preview images)

**Internal Helpers:**
2. `captureVideoFrame(url)` → Promise<inlineData>
   - Extracts a representative frame from video clip for review
3. `fetchAsInlineData(url, mimeType)` → Promise<inlineData>
   - Converts remote asset to inline Gemini-compatible format
4. `buildShotDescriptor(shot, section)` → string
   - Creates human-readable shot identifier for audit report

---

### **F. `webSocketService.ts` (128 lines)**

**Real-Time Video Generation Status:**

1. **`WebSocketService` (singleton class):**
   - Constructor: auto-connects to backend WebSocket
   - Methods:
     - `connect()` - Establish WS connection (auto-reconnect on close)
     - `on(event, callback)` - Register listener for event type
     - `off(event, callback)` - Unregister listener
     - `close()` - Disconnect and cleanup

2. **Event Handling:**
   - Subscribes to 'video_generated' channel
   - Triggers listeners on message arrival
   - Supports shot-specific listeners (e.g., 'video_generated_shot-1-2')

3. **Usage in Hook:**
   - Hooked in `useMusicVideoGenerator.ts` to listen for clip completion
   - Updates shot.clip_url when generation finishes
   - Updates progress UI in real-time

---

### **G. `promptOptimizer.ts` (248 lines)**

**Model-Specific Prompt Adaptation:**

1. **`getProfileForModel(modelId, type)`** → ModelPromptProfile | null
   - Checks built-in KB, then research cache, then generic match
   - Falls back to null if unknown

2. **`cacheResearchedProfile(modelId, type, profile)`**
   - Stores dynamically-researched profile in runtime cache

3. **`parseResearchResponse(modelId, jsonStr)`** → ModelPromptProfile | null
   - Parses JSON from thinking LLM research into profile object

4. **`adaptPromptForModel(ctx, profile)`** → {prompt, negativePrompt}
   - Core adapter: reformats raw prompt to match model's optimal format
   - Builds character block in format model prefers (weighted or natural language)
   - Fills model's prompt template with variables
   - Enforces max prompt length
   - Adds consistency instructions if model doesn't handle natively

5. **`buildThinkingModelKnowledge(settings)`** → string
   - System prompt injection teaching thinking LLM about selected image/video models
   - Helps LLM generate optimal prompts during storyboard creation

6. **`buildResearchPrompt()`** → exported from promptEngineeringKB

---

### **H. `promptEngineeringKB.ts`**

**Knowledge Base of Model Prompt Styles:**

1. **`findImageProfile(modelId)`** → ModelPromptProfile | null
2. **`findVideoProfile(modelId)`** → ModelPromptProfile | null
3. **`findPromptProfile(modelId)`** → ModelPromptProfile | null - Generic match

4. **`buildPromptEngineeringSystemPrompt(profile)`** → string
   - System prompt for thinking LLM about this model

5. **`buildResearchPrompt(modelId, outputType)`** → string
   - Prompt to send to thinking LLM to research an unknown model

**Profile Structure (ModelPromptProfile):**
```typescript
{
  match: RegExp,               // Model ID pattern
  family: string,              // e.g., "FLUX", "Stable Diffusion", "Waver"
  format: PromptFormat,        // 'natural' | 'weighted' | 'csv' | 'json'
  maxPromptLength: number,     // Token limit
  supportsNegative: boolean,
  supportsWeights: boolean,    // (tag:1.3) format
  qualityPrefix: string,       // e.g., "masterpiece, best quality,"
  negativePrompt: string,      // Default negative for this model
  promptTemplate: string,      // e.g., "{characters} {action}. {location}..."
  tips: string,                // Usage tips
  modelTags: string,           // Required tags (e.g., for FLUX: "turbo mode")
  nativeConsistency: boolean,  // Model handles face consistency natively
  outputType: 'image' | 'video' | 'both'
}
```

---

### **I. Additional Services**

**`ffmpegService.ts`** - FFmpeg wrapper
- Compose video clips with audio & overlays

**`musicEngineerService.ts`** - Music processing
- Beat analysis, stem separation (if applicable)

**`vfxService.ts`** - VFX effect processing
- Apply Slow Motion, Speed Ramp, Lens Flare, Glitch, Vintage Film Grain

**`lyricAnimationService.ts`** - Lyric overlay generation
- Render animated text overlays for shots

**`durationAdjustmentService.ts`** - Shot timing
- Adjust clip durations to fit song sections
- Handle stretch/compression for exact fit

---

## 4. ALL COMPONENTS & THEIR ROLES

### **Layout/Navigation:**

1. **`App.tsx` (420 lines)**
   - Root component, step routing (Upload → Controls → Storyboard → Review)
   - Auto-save to localStorage (debounced)
   - Restore from session storage on load
   - Global modals (restart, settings, error)

2. **`Stepper.tsx` (70 lines)**
   - Visual progress indicator showing current step

3. **`HeaderActions.tsx` (340 lines)**
   - Top navigation bar with:
     - Step indicators
     - Save/Load buttons
     - Settings toggle
     - Token counter
     - System status badge

### **Step Components:**

4. **`UploadStep.tsx` (400 lines)**
   - Song upload form
   - Fields: audio file, title, artist, lyrics textarea, singer gender dropdown
   - Load production file from JSON
   - Shows song duration + waveform preview
   - Submits to `processSongUpload()`

5. **`ControlsStep.tsx` (700+ lines)**
   - Creative brief editor:
     - Style text input, Feel input, Mood checkboxes
     - Video type dropdown
     - Color palette picker
     - User notes textarea
   - Moodboard uploader (image references)
   - Buttons:
     - "Analyze Moodboard" → AI suggests brief
     - "Get Director Suggestions" → auto-fills brief
     - "Next: Generate" → `generateCreativeAssets()`

6. **`StoryboardStep.tsx` (1,400+ lines)**
   - Main production interface:
     - Storyboard scenes in accordion
     - Shot cards with preview images, clip thumbnails
     - For each shot:
       - Edit button → shot editor modal
       - Regenerate image button
       - Edit image button
       - Generate clip button (with progress)
       - Delete/reorder
     - Bulk actions:
       - "Generate All Images" → batch preview generation
       - "Generate All Clips" → queues all videos
       - "Post-Production" → VFX, color, stabilization
     - "Next: Review" button

7. **`ReviewStep.tsx` (700+ lines)**
   - Final review before export:
     - Song metadata + analysis summary
     - Full storyboard preview (read-only)
     - All generated clips in timeline view
     - Executive Producer Feedback display (if run)
     - Visual Continuity Audit report (if run)
     - Buttons:
       - "Run Visual QA" → `runVisualQaReview()`
       - "Export" → ExportModal
       - "Restart" → Reset to Upload

### **Editors & Modals:**

8. **`StoryboardShot.tsx` (component within Storyboard)**
   - Individual shot editor:
     - Edit subject, action, shot_type, composition
     - Camera move picker, cinematic enhancements
     - Character/location reference selectors
     - Lyric overlay text input + animation style
     - VFX effect picker
     - Feedback score display

9. **`ImageEditorModal.tsx` (180 lines)**
   - In-browser image editing canvas:
     - Load preview image
     - Draw/paint tools
     - Text overlay
     - Filters
     - Save edited → upload back to backend

10. **`ExportModal.tsx` (100 lines)**
    - Export settings:
      - Resolution (720p, 1080p, 2160p)
      - Aspect ratio (16:9, 9:16, 1:1)
      - Include lyrics: yes/no
      - Title sequence style
      - Cinematic overlay
      - Intro/outro config (song title, duration, style)
    - Download button → triggers final composition

11. **`BiblesDisplay.tsx` (500 lines)**
    - Read-only viewer for characters & locations
    - Character cards: photo, name, role, appearance details
    - Location cards: photo, setting, atmosphere
    - Edit button → open image selector modal
    - Upload reference images per character/location

12. **`MediaLibraryModal.tsx` (300 lines)**
    - Browse all generated images/videos from this production
    - Grid view with thumbnails
    - Copy URL, download, delete buttons
    - Filter by type (image/video)

13. **`SettingsPage.tsx` (1,000 lines)**
    - Provider configuration interface:
      - Thinking model (OpenRouter, NVIDIA, Ollama, etc.)
      - Image generation model
      - Video generation model
    - For each:
      - Preset dropdown (switch provider)
      - API key input
      - Base URL override
      - Model selector (fetches from provider)
      - Test connection button (latency check)
    - Settings persist to localStorage

### **Information Display:**

14. **`TokenCounter.tsx` (100 lines)**
    - Shows cumulative tokens used:
      - Analysis, Bibles, Storyboard, Image Gen, Video Gen, etc.
      - Estimated cost USD
      - Performance metrics

15. **`AgentSystemStatus.tsx` (80 lines)**
    - Visual status board:
      - Music Analyst: done
      - Creative Director: working
      - Location Scout: idle
      - Casting Director: idle

16. **`ExecutiveProducerFeedbackDisplay.tsx` (80 lines)**
    - Shows scores: pacing (1-10), narrative (1-10), consistency (1-10)
    - Final notes text

17. **`BeatTimelineVisualizer.tsx` (150 lines)**
    - Draws beat waveform visualization
    - Shows energy levels over time
    - Highlights sections (verse, chorus, etc.)

### **Utilities:**

18. **`ApiErrorModal.tsx` (80 lines)**
    - Error dialog with details
    - Close button clears error

19. **`ConfirmationModal.tsx` (50 lines)**
    - Generic confirm/cancel dialog

20. **`AutosaveIndicator.tsx` (50 lines)**
    - Small status badge: "Saving...", "Saved", "Idle"

21. **`Spinner.tsx` (20 lines)**
    - Loading spinner animation

22. **`StitchStreamStudio.tsx` (900 lines)**
    - Embedded iframe to StitchStream video editor
    - Sends clips via postMessage
    - Receives back edited + composed video

---

## 5. STATE MANAGEMENT

### **Main Hook: `useMusicVideoGenerator.ts` (880+ lines)**

**State (via useReducer):**
```typescript
{
  currentStep: Step,
  songFile: File | null,
  audioUrl: string | null,
  singerGender: 'male' | 'female' | 'unspecified',
  
  songAnalysis: SongAnalysis | null,
  creativeBrief: CreativeBrief,
  bibles: Bibles | null,
  storyboard: Storyboard | null,
  
  isProcessing: boolean,
  error: string | null,
  apiError: string | null,
  tokenUsage: TokenUsage,
  postProductionTasks: {vfx, color, stabilization: 'idle' | 'processing' | 'done'},
  
  moodboardImages: File[],
  isAnalyzingMoodboard: boolean,
  isSuggestingBrief: boolean,
  
  isReviewing: boolean,
  executiveProducerFeedback: ExecutiveProducerFeedback | null,
  
  isVisualReviewing: boolean,
  visualContinuityReport: VisualContinuityReport | null,
}
```

**Key Dispatch Actions:**
- `SET_SONG_FILE`, `SET_ANALYSIS`, `SET_BIBLES`, `SET_STORYBOARD`
- `UPDATE_CREATIVE_BRIEF`, `UPDATE_SHOT`, `UPDATE_SHOT_MEDIA`
- `SET_STEP`, `START_PROCESSING`, `SET_ERROR`
- `UPDATE_TOKEN_USAGE`
- `SET_POST_PRODUCTION_STATUS`
- `START_MOODBOARD_ANALYSIS`, `FINISH_MOODBOARD_ANALYSIS`
- `START_REVIEW`, `SET_EXECUTIVE_PRODUCER_FEEDBACK`
- `START_VISUAL_REVIEW`, `SET_VISUAL_REVIEW_RESULT`

**Public Methods (returned to components):**

**Upload & Analysis:**
- `processSongUpload(file, lyrics, title, artist, singerGender)` → Analyzes song
- `loadProductionFile(file)` → Loads saved production JSON

**Creative Direction:**
- `updateCreativeBrief(updates)` → Merge brief
- `generateCreativeAssets()` → Generate bibles + storyboard
- `analyzeMoodboard(files[])` → AI suggests brief from images
- `getDirectorSuggestions()` → Auto-fill brief recommendations

**Media Generation:**
- `generateAllImages()` → Batch generate preview images
- `regenerateImage(shotId)` → Regenerate one preview
- `editImage(shotId)` → Open image editor modal
- `generateClip(shotId)` → Generate one video clip
- `generateStoryboardBatch()` → Queue all video generation

**Post-Production:**
- `setVfxForShot(shotId, vfx)` → Set VFX effect stack
- `suggestAndApplyBeatSyncedVfx()` → AI suggests VFX based on beat energy
- `applyPostProductionEnhancement(type: 'color' | 'stabilization')`

**Review:**
- `runVisualQaReview()` → Run visual continuity audit
- `goToReview()` → Skip to review step

**Navigation & Export:**
- `goToStep(step)` → Manual step navigation
- `downloadProduction()` → Save production to JSON
- `exportFinalVideo(exportOptions)` → Compose final video

**Upload Handlers:**
- `updateShotWithFileUpload(shotId, file, type: 'image'|'video')` → Upload replacement media
- `regenerateBibleImage(type: 'character'|'location', name)` → Regenerate reference image

---

### **Settings Store: `settingsStore.tsx` (188 lines)**

**Context-based state for AI provider configuration:**

**State Structure:**
```typescript
{
  thinking: AIProvider,    // For LLM text generation
  image: AIProvider,       // For image generation
  video: AIProvider,       // For video generation
}

// AIProvider:
{
  id: string,              // 'openrouter', 'ollama', 'comfyui', etc.
  name: string,
  baseUrl: string,
  apiKey: string,
  models: AIProviderModel[],  // {id, name, description, category, ...}
  selectedModel: string,
  enabled: boolean,
}
```

**Provider Presets** (`PROVIDER_PRESETS`):
- OpenRouter (https://openrouter.ai/api/v1)
- NVIDIA NIM (https://integrate.api.nvidia.com/v1)
- Ollama (http://localhost:11434)
- ComfyUI image (http://localhost:8188)
- ComfyUI video (http://127.0.0.1:8189)
- HuggingFace (https://api-inference.huggingface.co)

**API Key Resolution:**
- Checks environment variables first (OPENROUTER_API_KEY, NVIDIA_API_KEY, etc.)
- Falls back to localStorage
- Persists user settings to localStorage (SETTINGS_KEY)

**Context Methods:**
- `setPreset(role, preset)` - Switch provider
- `updateField(role, field, value)` - Update provider config
- `setModels(role, models)` - Set available models from API

---

## 6. BACKEND SERVER: `server/index.js` (2,899 lines)

### **Architecture**

Express.js server with:
- RESTful API for media uploads & processing
- WebSocket server for real-time progress updates
- SQLite database for media storage (hybrid: DB + filesystem)
- FFmpeg integration for video composition
- ComfyUI client for image/video generation

### **API ENDPOINTS**

**PORT:** Default 3002 (overridable via PORT or BACKEND_PORT env var)

#### **PRODUCTION MANAGEMENT**

- `GET /api/productions` - List all productions
- `GET /api/productions/:id` - Load production by ID
- `POST /api/productions` - Save/update production
- `DELETE /api/productions/:id` - Delete production

#### **MEDIA UPLOAD & SERVING**

**Upload:**
- `POST /api/images/upload` - Single image upload → database
- `POST /api/images/upload-batch` - Multiple images → database
- `POST /api/audio/upload` - Audio file upload
- `POST /api/videos/upload` - Video file upload

**Serving (from DB + filesystem):**
- `GET /api/media/image/:id` - Serve image by ID (supports binary DB storage or FS fallback)
- `GET /api/media/video/:id` - Serve video by ID (with Range request support for streaming)
- `GET /api/media/audio/:id` - Serve audio by ID
- `GET /api/media/library` - List all media in library

**Static serving:**
- `/images/*` - Static directory serving
- `/videos/*` - Static directory serving
- `/audio/*` - Static directory serving

#### **IMAGE GENERATION (ComfyUI)**

- `POST /api/comfyui/generate` - Generate single image
  - Request: {prompt, negative_prompt, width, height, steps, cfg_scale, init_image, denoising_strength, reference_face_image, ipadapter_weight, shotId, generationType}
  - Response: {imageUrl}
  - Uses ComfyUI workflow, stores image in DB

- `POST /api/comfyui/generate-batch` - Generate multiple images
  - Request: {images: [{prompt, negative_prompt, ...}]}
  - Response: {images: [{imageUrl}]}

- `GET /api/comfyui/image-by-shot/:shotId` - Retrieve previously generated image
  - Response: {success, imageUrl, id}

- `POST /api/comfyui/recover-images` - Recover images from DB if lost
  - Request: {shotIds: []}
  - Response: {recovered: {shotId: {imageUrl, id}}, missing: []}

- `GET /api/comfyui/progress/:promptId` - Poll image generation progress
  - Response: {status, progress_percent}

- `POST /api/comfyui/preflight` - Pre-flight check for ComfyUI availability
  - Response: {available, system_stats}

#### **VIDEO GENERATION (ComfyUI)**

- `POST /api/comfyui/generate-video-clip` - Generate video from image
  - Request: {
      imageUrl, prompt, duration, quality, workflow,
      negative_prompt, width, height, fps, steps, cfg, seed, denoise,
      camera_motion, lipSync, audioUrl, shotId, video_model, render_profile
    }
  - Response: {promptId, message}
  - Queues ComfyUI workflow asynchronously
  - Emits WebSocket event when complete

- `GET /api/comfyui/video-status/:promptId` - Poll video generation status
  - Response: {status, progress, error}

#### **VIDEO COMPOSITION**

- `POST /api/video/generate` - Composite multiple clips into final video
  - Request: {
      scenes: [{imageUrl, duration, description}],
      audioUrl, outputFormat, width, height, fps,
      intro: IntroOverlayConfig, outro: OutroOverlayConfig
    }
  - Response: {success, videoUrl}
  - Uses FFmpeg to compose, add audio, overlays

#### **PROVIDER MODELS**

- `GET /api/providers/models?provider=<preset>` - Fetch models from provider
  - Supports: 'openrouter', 'openrouter-full' (full 665-model catalog via proxy), 'nvidia', 'ollama', 'comfyui', 'huggingface'
  - Response: {data: [{id, name, description, ...}]}

#### **EXTERNAL API PROXIES** (for ComfyUI fallbacks)

- `GET /api/a1111/health` - Check A1111 Stable Diffusion API
- `POST /api/a1111/generate` - Fallback image generation via A1111
- `POST /api/a1111/generate-batch` - Batch A1111 generation

#### **HEALTH/STATUS**

- `GET /api/health` - Server health check
  - Response: {status, uptime, comfyui_status, database_status}

- `GET /api/comfyui/health` - ComfyUI availability
  - Response: {available}

### **DATABASE (SQLite)**

**Tables:**
- `images` - {id, production_id, filename, width, height, format, size, binary_data, mime_type}
- `videos` - {id, production_id, filename, duration, size, binary_data, mime_type}
- `audio` - {id, production_id, filename, duration, size, binary_data, mime_type}

**Operations (in db.js):**
- `insertImage(productionId, filename, width, height, format, size, binaryData, mimeType)`
- `getImageBinary(id)` - Retrieve image with binary data
- `insertVideo()`, `getVideoBinary()`, etc.

### **WEBSOCKET SERVER**

**Features:**
- Runs on same port as Express (HTTP upgrade)
- Handles `video_generated` events
- Broadcasts to connected clients when video generation completes

**Event Flow:**
1. Client queue video generation via POST `/api/comfyui/generate-video-clip`
2. Backend returns promptId
3. ComfyUI processes asynchronously
4. When complete, backend emits WebSocket event: `{type: 'video_generated', shotId, videoUrl, promptId}`
5. Client's `webSocketService` listener receives → updates shot.clip_url

### **COMFYUI WORKFLOW INTEGRATION**

**How Image Generation Works:**
1. Frontend sends image prompt + parameters to `/api/comfyui/generate`
2. Backend builds ComfyUI workflow JSON:
   - `CheckpointLoaderSimple` → Load base model
   - `CLIPTextEncode` → Prompt encoding
   - `KSampler` → Diffusion sampling
   - `VAEDecode` → Output image
3. Posts to ComfyUI server (`http://localhost:8188/prompt`)
4. ComfyUI returns promptId (execution tracking)
5. Backend polls for completion
6. Saves image to DB + filesystem
7. Returns imageUrl

**How Video Generation Works:**
1. Image generation produces preview_image_url
2. Frontend sends to `/api/comfyui/generate-video-clip` with video_model routing hint
3. Backend selects workflow based on video_model (waver, animatediff, wan2_2, etc.)
4. Workflow typically:
   - Load image as init frame
   - Encode prompt + negative prompt
   - Run video generation sampler (different for each model)
   - Export video sequence
5. Composite frames into MP4
6. Return clip_url via WebSocket

---

## 7. STITCHSTREAM: EMBEDDED VIDEO EDITOR

**Location:** `/d/ai_music_video/stitchstream/` (separate Vite app)

**Purpose:** Post-production video composition & styling (optional workflow)

**Key Components:**
1. **`App.tsx`** - Main editor
2. **`Player.tsx`** - Video playback with controls
3. **`Timeline.tsx`** - Clip reordering via drag-drop
4. **`VideoUploader.tsx`** - Upload video clips

**Features:**
- Clip import (via postMessage from main app)
- Visual timeline with clip ordering
- AI analysis for:
  - Color grading suggestions
  - Transition recommendations
  - Title design suggestions
  - Closing credits templates
  - Cinematic effects (grain, vignette, letterbox)
- Clip filtering & transitions
- Export final video

**AI Analysis via Gemini:**
- `geminiService.ts::analyzeMontage()` - Analyzes clip sequence for cohesion
- Returns: directorNotes with colorGrade, transition, titleDesign, closingCredits, cinematicEffects

**Integration with Main App:**
- Main app sends clips via postMessage: `{type: 'MVG_SYNC_CLIPS', clips: [...]}`
- StitchStream receives, loads into timeline
- User edits, exports
- Can send back composed video

---

## 8. TYPES & INTERFACES (`types.ts`)

### **Core Domain Types**

**Song Analysis:**
- `SongAnalysis` - Basic: bpm, mood[], genre, structure[], beats[], vocals?, lyric_analysis?
- `EnhancedSongAnalysis` - Extended with sub_beats, phrases, tempo_curve, measures, energy_curve
- `Beat` - {time, energy, confidence?, is_downbeat?, type?}
- `VideoType` - 10 types: Concert Performance, Story Narrative, Animated/Cartoon, etc.

**Visual Direction:**
- `Bibles` - {characters: CharacterBible[], locations: LocationBible[]}
- `CharacterBible` - Ultra-detailed character (15+ appearance fields, costuming, performance)
- `LocationBible` - Detailed location (setting, atmosphere, architectural details, cinematic style)
- `CreativeBrief` - {feel, style, mood[], videoType, lyricsOverlay, user_notes, color_palette}

**Storyboarding:**
- `Storyboard` - {id, title, artist, scenes: StoryboardScene[]}
- `StoryboardScene` - {id, section, start, end, shots[], transitions[], narrative_beats, description}
- `StoryboardShot` - 30+ properties (id, timing, camera, composition, subject, action, location, characters, lyric overlay, VFX, video_model, etc.)
- `Transition` - {type, duration, description}

**VFX & Styling:**
- `VFXEffect` - {category, name, intensity, parameters}
- `LyricOverlay` - Rich lyric config (timing, animation, styling, positioning, karaoke support)
- `DurationFlexibility` - {min_duration, max_duration, preferred_duration}
- `MusicAlignment` - {align_start_to_beat, align_end_to_beat, extend_to_complete_phrase}

**Export:**
- `ExportOptions` - {resolution, aspectRatio, includeLyrics, titleSequenceStyle, cinematicOverlay, intro?, outro?}
- `IntroOverlayConfig` - {enabled, duration, song_title, artist_name, style, animation, background}
- `OutroOverlayConfig` - {enabled, duration, credits, style, animation, include_social_media}

**AI Provider Settings:**
- `AIProvider` - {id, name, baseUrl, apiKey, models[], selectedModel, enabled}
- `AIProviderModel` - {id, name, description?, modality?, contextLength?, pricing}
- `AIProviderSettings` - {thinking: AIProvider, image: AIProvider, video: AIProvider}
- `ProviderPreset` - Enum: 'openrouter', 'nvidia', 'ollama', 'comfyui', 'huggingface', 'comfyui-video', 'custom'

**QA & Feedback:**
- `VisualContinuityReport` - {summary, overallVerdict, issues[], checklist}
- `ExecutiveProducerFeedback` - {pacing_score, narrative_score, consistency_score, final_notes}

**Token Tracking:**
- `TokenUsage` - {analysis, bibles, storyboard, transitions, imageGeneration, videoGeneration, estimated_cost_usd, performance}

**Enums:**
- `Step` - Upload, Plan, Controls, Storyboard, Review
- `VideoGenerationModel` - waver, step_video_ti2v, animatediff_v3, wan2_2, videocrafter2
- `RenderProfile` - realism, stylized, plate, portrait

---

## 9. DATA FLOW DIAGRAM

```
USER UPLOADS SONG
    ↓
analyzeSong()
    ├─ Listens to audio (Gemini)
    ├─ Analyzes lyrics
    ├─ Detects: BPM, structure, beats, vocals, themes
    └─ Returns: SongAnalysis
    ↓
USER CONFIGURES BRIEF
    (moodboard images → AI suggestions)
    ├─ Select: style, feel, mood, videoType, color_palette
    └─ Returns: CreativeBrief
    ↓
generateBibles()
    ├─ Gemini generates character descriptions (grounded in lyrics)
    ├─ Creates location descriptions
    └─ Returns: Bibles {characters[], locations[]}
    ↓
generateStoryboard()
    ├─ Gemini plans shots (beat-aligned)
    ├─ Assigns: subject, action, camera, composition, transitions
    ├─ Routes video_models (waver, animatediff, wan2_2, etc.)
    └─ Returns: Storyboard with ~15-30 shots
    ↓
FOR EACH SHOT:
    ├─ generateImage()
    │   ├─ Build prompt: characters + location + action + cinematics
    │   ├─ POST → ComfyUI
    │   ├─ ComfyUI: SDXL/FLUX model → PNG
    │   └─ Return: preview_image_url
    │   ↓
    └─ generateVideoClip()
        ├─ Build video prompt (model-specific)
        ├─ POST → ComfyUI with video_model routing
        ├─ ComfyUI: waver/animatediff/wan2_2 model
        ├─ Animation: 6-8 seconds @ model's FPS
        ├─ Composite to MP4
        └─ Return: clip_url (via WebSocket)
    ↓
OPTIONAL: POST-PRODUCTION
    ├─ Apply VFX (per-shot effects)
    ├─ Color grading (unified)
    └─ Stabilization (smoothing)
    ↓
OPTIONAL: VISUAL QA REVIEW
    ├─ Run visualContinuityAudit()
    ├─ Gemini Vision reviews up to 12 assets
    └─ Return: report with issues + recommendations
    ↓
EXPORT
    ├─ User chooses: resolution, aspect ratio, intro/outro
    ├─ FFmpeg composes:
    │   ├─ All video clips (in sequence)
    │   ├─ Audio track (original song)
    │   ├─ Lyric overlays (animated text)
    │   ├─ Title card (optional)
    │   ├─ Credits (optional)
    │   └─ Cinematic effects (grain, flares)
    └─ Return: final_video_url (1080p or 2160p MP4)
```

---

## 10. CONFIGURATION

### **Environment Variables (`.env` / `.env.local`)**

```bash
# API Keys
API_KEY=<Gemini API key>                          # Required for Gemini
OPENROUTER_API_KEY=<optional>
NVIDIA_API_KEY=<optional>
HUGGINGFACE_API_KEY=<optional>

# Backend
PORT=3002                                          # Optional: backend port
BACKEND_PORT=3002
A1111_API_URL=http://localhost:7860               # Fallback A1111 API

# Frontend
VITE_BACKEND_URL=http://localhost:3002
VITE_STITCHSTREAM_URL=http://localhost:4100

# Database
DATABASE_URL=./data/db.sqlite                      # Optional: SQLite path
```

### **Vite Configuration (`vite.config.ts`)**

```typescript
{
  plugins: [react()],
  define: {
    'import.meta.env.VITE_BACKEND_URL': JSON.stringify(process.env.VITE_BACKEND_URL),
    'import.meta.env.VITE_STITCHSTREAM_URL': JSON.stringify(process.env.VITE_STITCHSTREAM_URL),
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3002',             // Dev server proxies API to backend
    }
  }
}
```

### **Provider Presets & Model Discovery**

Configured in `settingsStore.tsx`:
- OpenRouter: Dynamically fetch 665+ models via `/api/frontend/models` proxy or `/v1/models` fallback
- NVIDIA NIM: Fetch from `/v1/models`
- Ollama: Fetch from `/api/tags`
- ComfyUI: Fetch checkpoints from `/object_info/CheckpointLoaderSimple`
- HuggingFace: Query API for text-to-image, image-to-video, text-to-video models

---

## 11. KEY ALGORITHMS & LOGIC

### **A. Video Model Routing (`chooseVideoModel` in aiService)**

**Decision Tree:**
1. If portrait (close-up, face-focused) & realistic → **step_video_ti2v** (best face consistency)
2. If portrait & stylized → **wan2_2** (anime/surreal aesthetic)
3. If wide/establishing & no character → **videocrafter2** (efficient background plate)
4. If chorus/high-energy & stylized → **wan2_2** (punchy, vibrant motion)
5. If chorus/high-energy & realistic → **animatediff_v3** (controlled motion)
6. Default → **waver** (balanced realism, best quality T2V/I2V)

**Output:**
- video_model, render_profile, video_model_reason (for user transparency)

### **B. Beat Detection (`detectBeatsAndSubBeats`)**

**Steps:**
1. Compute spectral flux using FFT on audio frames
2. Find peaks in spectral flux (onset detection)
3. Estimate tempo via autocorrelation of onset intervals
4. Quantize onsets to nearest beat (based on estimated tempo)
5. Classify beat type (kick, snare, hi-hat, cymbal) based on frequency content
6. Generate sub-beats (eighth notes) between main beats
7. Calculate energy at each beat time
8. Return: beats[] + sub_beats[]

### **C. Storyboard Coverage Enforcement (`ensureStoryboardCoverage`)**

**Problem:** AI might generate shots that don't fully cover the song duration or have gaps.

**Solution:**
1. Calculate total shot duration (sum of end - start for all shots)
2. If < song duration: insert filler shots in large gaps (aim for 6-8s each)
3. If > song duration: compress shots proportionally
4. Ensure all shots align to beat grid
5. Verify no shot exceeds 8 seconds (ComfyUI limit)

### **D. Prompt Optimization (`adaptPromptForModel`)**

**Handles Model-Specific Formats:**
- **Weighted** (SDXL, ComfyUI): `(tag:1.3)` format with weights
- **Natural** (Waver, etc.): Natural language prose
- **CSV/JSON**: Format-specific tags

**Template Filling:**
- Input: {shot, bibles, brief, characterBlock, locationBlock} + ModelPromptProfile
- Output: prompt string filled from template: `"{characters} {action}. {location}. {camera}. {lighting}. {style}."`
- Enforces max prompt length
- Adds model-specific quality prefixes + tags
- Injects consistency instructions if model doesn't handle natively

---

## 12. EXTERNAL INTEGRATIONS

### **ComfyUI**
- **Purpose:** Image + video generation via open-source diffusion models
- **Protocol:** HTTP REST API + WebSocket (optional)
- **Workflows:** Custom JSON workflows for different models
- **Models:** SDXL, FLUX, Waver, AnimateDiff, Wan, VideoCrafter, Step-Video
- **Integration:** Backend sends workflow → ComfyUI processes → returns image/video URLs

### **Google Gemini API**
- **Purpose:** Song analysis, storyboard generation, visual QA, lyric analysis
- **Features:** Audio input (for song analysis), multimodal (vision for QA)
- **Fallback:** When no thinking provider configured

### **OpenRouter / NVIDIA NIM / Ollama**
- **Purpose:** Thinking LLM for storyboard generation (if not using Gemini)
- **Protocol:** OpenAI-compatible API
- **Models:** Any LLM available on these platforms

### **FFmpeg**
- **Purpose:** Video composition, format conversion, audio sync
- **Usage:** Composite clips + audio + overlays → final MP4
- **Bundled:** Via `@ffmpeg-installer/ffmpeg` NPM package

---

## 13. EXTENSION POINTS & CUSTOMIZATION

### **How to Add a New Video Model**

1. **Define in types.ts:**
   ```typescript
   type VideoGenerationModel = '...' | 'my_new_model';
   ```

2. **Add routing logic in `chooseVideoModel()`:**
   ```typescript
   if (/* conditions */) {
     video_model = 'my_new_model';
     render_profile = '...';
   }
   ```

3. **Add prompt profile in `promptEngineeringKB.ts`:**
   ```typescript
   { match: /my_new_model/i, family: '...', format: 'weighted', ...}
   ```

4. **Add ComfyUI workflow in `/workflows/`:**
   Create JSON workflow file for backend to use

5. **Update backend `/api/comfyui/generate-video-clip`:**
   Add workflow selection logic based on video_model

### **How to Add a New VFX Effect**

1. **Define in types.ts:**
   ```typescript
   type VFX_PRESET = '...' | 'My New Effect';
   ```

2. **Add to constants.ts `VFX_PRESETS`:**
   ```typescript
   export const VFX_PRESETS = [
     { name: 'My New Effect', category: 'motion', description: '...', ... }
   ];
   ```

3. **Implement in `vfxService.ts`:**
   ```typescript
   export async function applyMyNewEffect(videoUrl, intensity) { ... }
   ```

4. **Wire in StoryboardStep component:**
   Add to VFX picker UI

### **How to Add a New Provider**

1. **Add preset in `settingsStore.tsx` `PROVIDER_PRESETS`:**
   ```typescript
   { id: 'myprovider', name: 'My Provider', defaultBaseUrl: '...', roles: [...], ... }
   ```

2. **Implement model fetcher in `providerService.ts`:**
   ```typescript
   async function fetchMyProviderModels(provider) { ... }
   ```

3. **Add case in `fetchModels()` dispatcher**

4. **Test connection in `testConnection()`**

---

## 14. PERFORMANCE CONSIDERATIONS

### **Token Usage Tracking**
- Each major AI call increments token counts
- Estimated cost calculated (based on model pricing)
- Displayed to user in real-time

### **Async Processing**
- Image/video generation queued asynchronously
- WebSocket notifications for real-time status
- Long-running operations don't block UI

### **Caching**
- Storyboard shots cached to avoid re-analysis
- Researched model profiles cached in memory (promptOptimizer)
- localStorage auto-save for session recovery

### **Database Storage**
- Hybrid approach: binary data in SQLite + filesystem fallback
- Range request support for video streaming (efficient playback)
- Media library cleanup (optional deletion)

### **ComfyUI Workflow Optimization**
- Reuses loaded models across requests
- Batch image generation for speed
- Video generation FPS capped per model to respect VRAM

---

## 15. SECURITY & BEST PRACTICES

### **API Key Management**
- Never commit `.env` files
- API keys resolved from environment variables (priority) → localStorage (fallback)
- Keys not exposed in localStorage by default (can be changed)
- OpenRouter API key includes `Referer` header for safety

### **CORS Configuration**
- Allows only localhost origins (localhost:*, 127.0.0.1:*)
- Blocks cross-origin requests from external domains

### **File Upload Limits**
- 100MB max file size (multer config)
- File type validation (MIME type checks)
- Temp files cleaned up after database insertion

### **Database Security**
- SQLite (local, single-user) — suitable for local development
- For production: upgrade to PostgreSQL + user authentication

---

## 16. KNOWN LIMITATIONS & FUTURE IMPROVEMENTS

### **Current Limitations**
1. **ComfyUI dependency:** Requires local ComfyUI instance for image/video generation
2. **Storyboard coverage:** Shot timing auto-adjusted, but may not align perfectly with musical intent
3. **Duet handling:** Limited to 2 vocalists in current implementation (architecture supports N)
4. **Lip-sync:** Hint-based (LipSync boolean) rather than actual mouth tracking
5. **Video model selection:** Heuristic-based (could be ML-based)

### **Potential Enhancements**
1. **Multi-model ensemble:** Generate multiple storyboards, blend via voting
2. **Lip-sync enhancement:** Integrate Wav2Lip or similar for actual mouth sync
3. **Interactive refinement loop:** User feedback → AI refinement → re-generation
4. **Batch export:** Multiple resolutions/formats in single job
5. **Real-time preview:** Streaming video playback during generation
6. **Collaborative editing:** Multi-user storyboard editing
7. **Template library:** Pre-built creative briefs for common genres
8. **AI director comments:** Real-time feedback as shots are generated

---

## SUMMARY

This is a **sophisticated, full-stack music video generation system** with:
- **Frontend:** React UI for creative direction + storyboarding
- **Backend:** Express API + ComfyUI orchestration + WebSocket real-time updates
- **AI Integration:** Multi-provider LLM routing + prompt optimization + visual QA
- **Pipeline:** Song → Analysis → Creative Direction → Storyboard → Image Gen → Video Gen → Post-Production → Export
- **Extensibility:** Easy to add new models, providers, effects, components

The architecture prioritizes **flexibility** (swappable AI providers, models), **transparency** (token tracking, detailed feedback), and **user control** (editable at every step) while automating the complex creative workflow.
