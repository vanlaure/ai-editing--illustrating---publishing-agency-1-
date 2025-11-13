# API Requirements for AI Editing, Illustrating & Publishing Agency

## Overview

This document outlines all the API endpoints and external services required for the full functionality of the application, based on the Settings page configuration and application features.

---

## 1. AI Text Generation APIs

### Primary Providers (Choose One)

#### **Google Gemini** (Default)
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta`
- **Required API Key**: `VITE_GEMINI_API_KEY` or configure in Settings
- **Models Used**:
  - `gemini-2.5-pro` - High-quality text generation
  - `gemini-2.5-flash` - Fast text generation
  - `text-embedding-004` - Semantic search and embeddings
- **Features**: Writing assistance, grammar checking, content generation, manuscript analysis
- **Documentation**: https://ai.google.dev/docs

#### **OpenAI** (Alternative)
- **Endpoint**: `https://api.openai.com/v1`
- **Required API Key**: Configure in Settings
- **Models Used**:
  - `gpt-4-turbo-preview` - High-quality text
  - `gpt-3.5-turbo` - Fast text
  - `text-embedding-3-small` - Embeddings
- **Documentation**: https://platform.openai.com/docs

#### **Anthropic Claude** (Alternative)
- **Endpoint**: `https://api.anthropic.com/v1`
- **Required API Key**: Configure in Settings
- **Models Used**:
  - `claude-3-opus-20240229` - High-quality
  - `claude-3-sonnet-20240229` - Fast
- **Documentation**: https://docs.anthropic.com/claude/reference

#### **OpenRouter** (Alternative)
- **Endpoint**: `https://openrouter.ai/api/v1`
- **Required API Key**: Configure in Settings
- **Models**: Various models through unified API
- **Documentation**: https://openrouter.ai/docs

#### **Groq** (Alternative)
- **Endpoint**: `https://api.groq.com/openai/v1`
- **Required API Key**: Configure in Settings
- **Models Used**:
  - `llama-3.3-70b-versatile` - High-quality
  - `llama-3.1-8b-instant` - Fast
- **Documentation**: https://console.groq.com/docs

#### **Custom Endpoint** (Self-hosted)
- **Endpoint**: User-configurable in Settings
- **Use Case**: Self-hosted LLMs, custom API gateways

---

## 2. Image Generation APIs

### Primary Providers (Choose One in Settings)

#### **Gemini Imagen** (Default)
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta`
- **Model**: `imagen-4.0-generate-001`
- **Required API Key**: Same as Gemini text API
- **Features**: Cover art, character concepts, mood boards, marketing images
- **Documentation**: https://ai.google.dev/api/imagen

#### **Pollinations.ai** (Free Alternative)
- **Endpoint**: `https://image.pollinations.ai`
- **Required API Key**: None (public service)
- **Features**: Free image generation, no authentication required
- **Use Case**: Development, testing, free tier alternative

#### **ComfyUI** (Self-hosted)
- **Endpoint**: User-configurable (default: `http://localhost:8188`)
- **Required Setup**: ComfyUI installation with Stable Diffusion
- **Features**: Local image generation, full control
- **Documentation**: https://github.com/comfyanonymous/ComfyUI

#### **FastSD CPU** (Self-hosted)
- **Endpoint**: User-configurable (default: `http://localhost:8000`)
- **Required Setup**: FastSD CPU installation
- **Features**: CPU-optimized Stable Diffusion
- **Directory**: `fastsdcpu/` in project root

---

## 3. Audio Generation APIs

### Voice/Narration Providers (Choose One in Settings)

#### **Google Gemini TTS** (Default)
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta`
- **Model**: `gemini-2.5-flash-preview-tts`
- **Required API Key**: Same as Gemini text API
- **Features**: Audiobook narration, voice cloning
- **Documentation**: https://ai.google.dev/api/audio

#### **OpenAI TTS** (Alternative)
- **Endpoint**: `https://api.openai.com/v1/audio/speech`
- **Model**: `tts-1` or `tts-1-hd`
- **Required API Key**: OpenAI API key
- **Features**: High-quality voice synthesis
- **Documentation**: https://platform.openai.com/docs/guides/text-to-speech

#### **Chatterbox** (Local/Self-hosted)
- **Type**: Local Python-based TTS
- **Required Setup**:
  - Installation path (e.g., `C:/chatterbox`)
  - Python executable path
  - Models directory path
- **Repository**: https://github.com/resemble-ai/chatterbox
- **Use Case**: Offline narration, no API costs

#### **ComfyUI/DiffRhythm** (Music Generation)
- **Endpoint**: User-configurable (default: `http://localhost:8188`)
- **Required Setup**: ComfyUI with DiffRhythm nodes
- **Features**: Background music generation
- **Workflow**: Optional custom workflow path

#### **ElevenLabs** (Premium Alternative)
- **Endpoint**: `https://api.elevenlabs.io/v1`
- **Required API Key**: Configure in Settings
- **Features**: High-quality voice cloning
- **Documentation**: https://elevenlabs.io/docs

#### **Azure Speech** (Enterprise)
- **Endpoint**: Azure region-specific
- **Required API Key**: Azure subscription key
- **Documentation**: https://docs.microsoft.com/azure/cognitive-services/speech

#### **AWS Polly** (Enterprise)
- **Endpoint**: AWS region-specific
- **Required API Key**: AWS credentials
- **Documentation**: https://docs.aws.amazon.com/polly

---

## 4. Video Generation API

#### **Veo 3.1** (Google)
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta`
- **Model**: `veo-3.1-fast`
- **Required API Key**: Gemini API key
- **Features**: Promotional video trailers
- **Documentation**: https://ai.google.dev/api/video

---

## 5. Backend Server APIs (Required for Advanced Features)

The application includes a backend server (`server/`) that provides these endpoints:

### Document Management
```
POST /api/documents/upload
GET  /api/documents/:id
PUT  /api/documents/:id
DELETE /api/documents/:id
GET  /api/documents/search
```

### RAG (Retrieval Augmented Generation)
```
POST /api/rag/index       # Index documents for search
POST /api/rag/search      # Semantic search
POST /api/rag/query       # RAG-enhanced queries
```

### Project Management
```
POST /api/projects
GET  /api/projects/:id
PUT  /api/projects/:id
DELETE /api/projects/:id
GET  /api/projects
```

### Image Processing
```
POST /api/images/generate
POST /api/images/edit
POST /api/images/upscale
GET  /api/images/:id
```

### AI Processing
```
POST /api/ai/complete      # Text completion
POST /api/ai/embed         # Generate embeddings
POST /api/ai/analyze       # Content analysis
```

### Editing Services
```
POST /api/editing/grammar
POST /api/editing/style
POST /api/editing/consistency
```

---

## 6. Analytics Dashboard APIs (NEW - Just Created)

These endpoints are required for the analytics dashboard functionality:

### Writing Metrics
```
GET /api/analytics/writing
```
**Response Schema**:
```typescript
{
  wordsWritten: number;
  sessionsCompleted: number;
  averageWordsPerSession: number;
  writingStreak: number;
  totalEditingTime: number;
  dailyGoalProgress: number;
  weeklyTrend: Array<{date: string, words: number}>;
  productivityScore: number;
}
```

### AI Usage Metrics
```
GET /api/analytics/ai
```
**Response Schema**:
```typescript
{
  totalRequests: number;
  successRate: number;
  averageResponseTime: number;
  costThisMonth: number;
  tokensUsed: number;
  mostUsedFeature: string;
  modelDistribution: Array<{model: string, usage: number}>;
  errorRate: number;
}
```

### Collaboration Metrics
```
GET /api/analytics/collaboration
```
**Response Schema**:
```typescript
{
  activeUsers: number;
  totalCollaborators: number;
  documentsShared: number;
  commentsThisWeek: number;
  realtimeEdits: number;
  averageResponseTime: number;
  topContributors: Array<{name: string, contributions: number}>;
}
```

### Business Metrics
```
GET /api/analytics/business
```
**Response Schema**:
```typescript
{
  totalRevenue: number;
  monthlyRecurring: number;
  conversionRate: number;
  customerLifetimeValue: number;
  churnRate: number;
  newCustomers: number;
  activeSubscriptions: number;
  revenueGrowth: number;
}
```

### Market Intelligence
```
GET /api/analytics/market
```
**Response Schema**:
```typescript
{
  trendingGenres: Array<{genre: string, popularity: number}>;
  marketSize: number;
  competitorCount: number;
  averageBookPrice: number;
  seasonalTrends: Array<{month: string, demand: number}>;
  emergingTopics: string[];
  genreGrowth: Array<{genre: string, growth: number}>;
}
```

### Predictive Insights
```
GET /api/analytics/insights
```
**Response Schema**:
```typescript
Array<{
  id: string;
  type: 'completion' | 'efficiency' | 'trend' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  data: any;
  actionable: boolean;
  suggestion?: string;
}>
```

### ROI Calculation
```
GET /api/analytics/roi
```
**Response Schema**:
```typescript
{
  totalCostSavings: number;
  timeSaved: number;
  productivityGain: number;
  qualityImprovement: number;
  breakdown: {
    aiAssistanceSavings: number;
    automationSavings: number;
    collaborationSavings: number;
    errorReductionSavings: number;
  };
  monthlyComparison: Array<{month: string, savings: number}>;
}
```

### WebSocket Events (Real-time Updates)
```
WS /analytics/live
```
**Client Events**:
- `subscribe` - Subscribe to metric updates
  ```typescript
  { metrics: ['writing', 'ai', 'collaboration', 'business'] }
  ```

**Server Events**:
- `metric_update` - Real-time metric update
  ```typescript
  {
    type: 'writing_metrics' | 'ai_usage' | 'collaboration' | 'business';
    timestamp: string;
    data: any;
  }
  ```
- `insight_generated` - New predictive insight
  ```typescript
  {
    insight: PredictiveInsight;
    timestamp: string;
  }
  ```

---

## 7. Environment Variables Required

### Frontend (`.env.local`)
```bash
# Primary AI Provider
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Backend API
VITE_API_BASE_URL=http://localhost:4000/api

# Analytics Dashboard
VITE_WS_ENDPOINT=ws://localhost:8080
VITE_ANALYTICS_ENDPOINT=http://localhost:4000/api/analytics
VITE_STUDIO_ID=your-studio-id

# Optional: Force specific image backend
VITE_IMAGE_BACKEND=pollinations  # or gemini, comfyui, fastsdcpu
```

### Backend (`server/.env`)
```bash
# Primary API Key
GEMINI_API_KEY=your_google_gemini_key

# Server Configuration
PORT=4000
NODE_ENV=development

# Image Generation (if using proxy)
POLLINATIONS_BASE_URL=https://image.pollinations.ai/prompt/

# Database (if needed for analytics)
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname

# Redis (for caching and real-time)
REDIS_URL=redis://localhost:6379

# WebSocket Server
WS_PORT=8080
```

---

## 8. Optional External Services

### Analytics & Monitoring
- **Google Analytics**: Web analytics
- **Sentry**: Error tracking
- **LogRocket**: Session replay

### Cloud Storage
- **Google Cloud Storage**: Document/media storage
- **AWS S3**: Alternative storage
- **Azure Blob Storage**: Enterprise storage

### Real-time Collaboration
- **Yjs WebSocket Server**: Document collaboration
- **Socket.io**: Real-time updates

### Payment Processing (if applicable)
- **Stripe**: Subscription management
- **PayPal**: Alternative payment

---

## 9. Development vs Production

### Development Setup
- Use Pollinations for free image generation
- Use local audio providers (Chatterbox, ComfyUI)
- Mock analytics data in `dashboardService.ts`
- Use local WebSocket server

### Production Setup
- Use paid AI providers (Gemini, OpenAI)
- Implement all analytics API endpoints
- Set up proper WebSocket infrastructure
- Configure CDN for media assets
- Implement rate limiting and authentication

---

## 10. API Rate Limits & Costs

### Google Gemini (as of 2024)
- Free tier: Limited requests per minute
- Paid tier: Higher limits, pay per use
- Check: https://ai.google.dev/pricing

### OpenAI
- Organization-based rate limits
- Varies by model and tier
- Check: https://platform.openai.com/account/rate-limits

### Self-hosted Solutions
- No API limits
- Hardware/hosting costs instead
- Full control and privacy

---

## Implementation Priority

### Phase 1 (MVP - Current)
✅ Text generation API (Gemini)
✅ Basic image generation (Pollinations fallback)
✅ Frontend dashboard with mock data
⚠️ Backend server (documents, projects)

### Phase 2 (Analytics)
🔲 Implement all analytics API endpoints
🔲 Set up WebSocket server for real-time updates
🔲 Configure database for metrics storage
🔲 Add authentication/authorization

### Phase 3 (Production)
🔲 Paid AI provider integration
🔲 CDN setup for media
🔲 Monitoring and logging
🔲 Load balancing and scaling

---

## Testing

### API Testing Checklist
- [ ] Test all AI providers in Settings
- [ ] Verify image generation backends
- [ ] Test audio provider configurations
- [ ] Validate analytics endpoints
- [ ] Test WebSocket connections
- [ ] Verify error handling and fallbacks

### Mock Data
The dashboard currently works with mock data in `services/dashboardService.ts` until backend APIs are implemented.

---

## Support & Documentation

- **Google AI**: https://ai.google.dev/docs
- **OpenAI**: https://platform.openai.com/docs
- **Anthropic**: https://docs.anthropic.com
- **ComfyUI**: https://github.com/comfyanonymous/ComfyUI
- **FastSD CPU**: See `fastsdcpu/Readme.md`

---

Last Updated: 2025-11-12