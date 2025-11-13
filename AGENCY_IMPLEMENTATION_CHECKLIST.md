# 4-Agency Implementation Checklist

Authoritative, step-by-step implementation playbook for wiring the 4-Agency architecture on the existing stack:
- React/TypeScript frontend
- Express/TypeScript backend
- Existing genai service, geminiService, backendClient, and agencyClient

All steps are concrete, repo-relative, and can be executed in order without external context.

---

## 1. Editing Agency

### 1.1 Backend routing

- [x] Ensure Editing routes exist:
  - [x] Route file present:
    - [`server/src/routes/editing.ts`](server/src/routes/editing.ts)
  - [x] Router mounted in server entrypoint:
    - In [`server/src/index.ts`](server/src/index.ts), confirm:
      - `[x]` `createEditingRouter()` (or equivalent) is imported from the Editing routes module.
      - `[x]` `app.use('/editing', createEditingRouter());` is registered once, before fallback/404 handlers.

### 1.2 EditingAgency client (services/agencyClient.ts)

Implement or confirm the following EditingAgency methods in [`services/agencyClient.ts`](services/agencyClient.ts) using `editingPost` helper with strict typings:

**Core Workflow Methods:**

- [x] `EditingAgency.upsertManuscript(content: string, manuscriptId?: string, projectId?: string)`
  - [x] Sends `POST /editing/manuscripts`
  - [x] Request body includes manuscript content, optional `manuscriptId`, and `projectId`
  - [x] Returns `{ manuscriptId: string; updated: boolean }`
- [x] `EditingAgency.runCompliance(manuscriptId: string, projectId?: string)`
  - [x] Sends `POST /editing/agents/compliance`
  - [x] Request body includes `manuscriptId`
  - [x] Returns array of `GrammarIssue[]` objects
  - [x] Executes full 10-stage editing workflow (Stages 1-10)
- [x] `EditingAgency.generateCostPlan(manuscriptId: string, tier: 'starter' | 'professional' | 'cinematic', projectId?: string)`
  - [x] Sends `POST /editing/agents/cost-plan`
  - [x] Request body includes `manuscriptId` and `tier`
  - [x] Returns `CostPlan`
- [x] `EditingAgency.cleanupHtml(manuscriptId: string, html: string, projectId?: string)`
  - [x] Sends `POST /editing/agents/cleanup`
  - [x] Request body includes `manuscriptId` and raw HTML string
  - [x] Returns `{ cleanedHtml: string }`
- [x] `EditingAgency.seriesBible(manuscriptId: string, context: string, projectId?: string)`
  - [x] Sends `POST /editing/agents/series-bible`
  - [x] Request body includes `manuscriptId` and contextual description
  - [x] Returns structured `{ seriesBible: unknown }` object

**Specialized Agent Methods (Isolated Stage Execution):**

- [x] `EditingAgency.runStructuralAnalysis(manuscriptId: string, analysisType: 'pacing' | 'characterArcs' | 'plotStructure' | 'all', projectId?: string)`
  - [x] Sends `POST /editing/agents/structural-analysis`
  - [x] Executes Stages 5-6 (Structure Agent + Arc Agent) in isolation
  - [x] Supports targeted analysis by type
  - [x] Returns analysis results with summary metrics
- [x] `EditingAgency.checkStyleCompliance(manuscriptId: string, styleGuide: 'chicago' | 'mla' | 'apa' | 'genre-specific', genre?: string, projectId?: string)`
  - [x] Sends `POST /editing/agents/style-compliance`
  - [x] Executes Stage 7 (Chicago/Style Agent) in isolation
  - [x] Supports multiple style guides (Chicago, MLA, APA, genre-specific)
  - [x] Returns compliance issues with confidence score
- [x] `EditingAgency.checkContinuity(manuscriptId: string, checkTypes: string[], projectId?: string)`
  - [x] Sends `POST /editing/agents/continuity-check`
  - [x] Executes Stage 8 (Continuity Agent) in isolation
  - [x] Tracks characters (with aliases), locations, timeline events, terminology
  - [x] Returns continuity issues and full continuityData snapshot
- [x] `EditingAgency.optimizeReadability(manuscriptId: string, targetReadingLevel?: string, projectId?: string)`
  - [x] Sends `POST /editing/agents/readability-optimization`
  - [x] Executes Stage 9 (Readability Agent) in isolation
  - [x] Supports target reading levels: elementary, middle-school, high-school, college, professional
  - [x] Returns readability metrics and optimization suggestions
- [x] `EditingAgency.runQualityAudit(manuscriptId: string, projectId?: string)`
  - [x] Sends `POST /editing/agents/quality-audit`
  - [x] Executes Stage 10 (QA Agent) with full quality analysis
  - [x] Requires previous agent results to exist
  - [x] Returns overall confidence score, low-confidence stages, and reprocessing recommendations
  - [x] Uses weighted confidence scoring (threshold: 0.85)

**Implementation Architecture:**

- [x] **11-Stage Sequential Workflow** (server/src/agencies/editing.ts):
  1. Intake & Pre-Processing (text parsing, genre detection)
  2. Grammar & Mechanics (LanguageTool + AI)
  3. Syntax & Parallelism (sentence structure analysis)
  4. Tense & Voice Consistency (temporal analysis)
  5. Structural Editing (chapter organization, pacing)
  6. Character Arc Analysis (development tracking)
  7. Chicago Manual & Genre Style (style guide compliance)
  8. Continuity Cross-Check (entity tracking across chapters)
  9. Readability & Flow Optimization (metrics analysis)
  10. Final Proofing & Audit (quality gates)
  11. Human-in-the-Loop Approval (version control, change review)

- [x] **Quality Control Logic**:
  - [x] Weighted confidence scoring per stage (0-1 scale)
  - [x] Stage-specific weights (Grammar: 0.15, Style: 0.15, Structure: 0.12, etc.)
  - [x] Overall confidence threshold: 0.85
  - [x] Automatic reprocessing recommendations for low-confidence stages
  - [x] Request deduplication via UUID-based requestId tracking

- [x] **Continuity Tracking System**:
  - [x] Character tracking with alias support
  - [x] Location tracking with first/last mention
  - [x] Timeline event tracking with chapter references
  - [x] Terminology glossary with usage counts

- [x] **Tech Stack**:
  - [x] Express/TypeScript backend with Zod validation
  - [x] Google Gemini AI (gemini-2.5-pro) for analysis
  - [x] In-memory storage with Map-based state management
  - [x] Strong typing throughout with TypeScript interfaces

Checklist for implementation quality:

- [x] All methods are exported from the central `EditingAgency` within [`services/agencyClient.ts`](services/agencyClient.ts).
- [x] All methods use `editingPost` helper (strongly typed, centralized error handling).
- [x] All responses are strongly typed and validated at the boundary.
- [x] Request deduplication prevents duplicate processing via `requestId`.
- [x] Project-aware operations via optional `projectId` parameter.

### 1.3 Frontend wiring: use EditingAgency

In [`App.tsx`](App.tsx) and any related components that currently call `geminiService` or `backendClient` directly for editing concerns:

**Core Workflow Integration:**

- [ ] **Manuscript Management**:
  - [ ] Call `EditingAgency.upsertManuscript(content, manuscriptId?, projectId?)` on manuscript save/update.
  - [ ] Store returned `manuscriptId` in component state for subsequent agent operations.
  - [ ] Track manuscript state across editing sessions.

- [ ] **Compliance Scan**:
  - [ ] Replace direct calls with `EditingAgency.runCompliance(manuscriptId, projectId?)`.
  - [ ] Use `manuscriptId` from prior `upsertManuscript()` call.
  - [ ] Display all 10-stage results with confidence scores.
  - [ ] Show stage-by-stage breakdown with individual metrics.

- [ ] **Cost Planning**:
  - [ ] Replace with `EditingAgency.generateCostPlan(manuscriptId, tier, projectId?)`.
  - [ ] Support tier selection: 'starter', 'professional', 'cinematic'.
  - [ ] Display cost breakdown with timeline estimates.

- [ ] **Series Bible**:
  - [ ] Replace with `EditingAgency.seriesBible(manuscriptId, context, projectId?)`.
  - [ ] Provide manuscript context for better bible generation.
  - [ ] Display structured bible data (characters, locations, themes).

- [ ] **HTML Cleanup**:
  - [ ] Replace with `EditingAgency.cleanupHtml(manuscriptId, html, projectId?)`.
  - [ ] Show before/after preview of cleaned HTML.

**Specialized Agent Workflows (Optional UI Enhancements):**

- [ ] **Structural Analysis Panel**:
  - [ ] Add UI to trigger `EditingAgency.runStructuralAnalysis(manuscriptId, analysisType, projectId?)`.
  - [ ] Support analysis types: 'pacing', 'characterArcs', 'plotStructure', 'all'.
  - [ ] Display:
    - [ ] Pacing metrics per chapter/scene
    - [ ] Character arc development summaries
    - [ ] Plot structure visualization (three-act, hero's journey, etc.)
  - [ ] Provide actionable recommendations for improvements.

- [ ] **Style Compliance Checker**:
  - [ ] Add UI to trigger `EditingAgency.checkStyleCompliance(manuscriptId, styleGuide, genre?, projectId?)`.
  - [ ] Support style guides: 'chicago', 'mla', 'apa', 'genre-specific'.
  - [ ] Display:
    - [ ] Compliance issues with line numbers and context
    - [ ] Specific style rule violations
    - [ ] Suggested corrections
    - [ ] Overall compliance score

- [ ] **Continuity Dashboard**:
  - [ ] Add UI to trigger `EditingAgency.checkContinuity(manuscriptId, checkTypes, projectId?)`.
  - [ ] Display:
    - [ ] Character tracking table (with aliases, first/last appearance)
    - [ ] Location tracking timeline
    - [ ] Timeline events chronology
    - [ ] Terminology glossary with usage counts
  - [ ] Highlight inconsistencies and missing references.
  - [ ] Provide navigation to problematic passages.

- [ ] **Readability Optimizer**:
  - [ ] Add UI to trigger `EditingAgency.optimizeReadability(manuscriptId, targetReadingLevel?, projectId?)`.
  - [ ] Support reading levels: 'elementary', 'middle-school', 'high-school', 'college', 'professional'.
  - [ ] Display:
    - [ ] Flesch-Kincaid Grade Level metrics
    - [ ] Flesch Reading Ease score
    - [ ] Average sentence length distribution
    - [ ] Sentence variety analysis
    - [ ] Optimization suggestions with specific examples
  - [ ] Provide inline editing suggestions.

- [ ] **Quality Audit Report**:
  - [ ] Add UI to trigger `EditingAgency.runQualityAudit(manuscriptId, projectId?)`.
  - [ ] Display:
    - [ ] Overall confidence score (0-1 scale)
    - [ ] Stage-by-stage confidence breakdown
    - [ ] Low-confidence stages highlighted (< 0.85 threshold)
    - [ ] Specific reprocessing recommendations
  - [ ] Provide one-click reprocessing for flagged stages.
  - [ ] Track quality improvements over time.

**Error Handling & User Feedback:**

- [ ] Ensure all EditingAgency calls:
  - [ ] Handle errors gracefully with user-friendly messages.
  - [ ] Display loading states during processing.
  - [ ] Show progress indicators for long-running operations.
  - [ ] Provide retry mechanisms for failed requests.
  - [ ] Log errors for debugging (client-side).

**State Management:**

- [ ] Track:
  - [ ] Current `manuscriptId` per project.
  - [ ] Latest agent results per stage.
  - [ ] Quality audit history.
  - [ ] Pending reprocessing recommendations.

Constraints:

- [ ] Keep all Illustration, Publishing, and Marketing features using existing `geminiService`/`backendClient` until their agencies are implemented.
- [ ] Do not change their flows in this step.
- [ ] Maintain backward compatibility with existing editing workflows during migration.

---

## 1.4 RAG-Enhanced Editing (Retrieval-Augmented Generation)

The Editing Agency uses RAG to ground its agents in authoritative references from the Chicago Manual of Style and genre-specific conventions.

### 1.4.1 RAG Architecture

**Vector Store:**
- [x] JSON-based file storage (`server/src/vectorStore/fileStore.ts`)
- [x] Provider-agnostic embedding service with support for:
  - [x] **Ollama** (default) - Local inference with nomic-embed-text model
  - [x] **Gemini** - text-embedding-004 for 768-dimensional embeddings
- [x] Cosine similarity search with configurable threshold (default: 0.7)
- [x] Persistent storage in `server/data/vector-store/`
- [x] Environment-based provider selection via `EMBEDDING_PROVIDER`

**Reference Document Structure:**
- [x] Chicago Manual of Style:
  - [x] Punctuation rules (`server/data/references/chicago-punctuation.md`) - 20 rules
  - [x] Grammar rules (`server/data/references/chicago-grammar.md`) - 19 rules
- [x] Genre-specific conventions (15 rules each):
  - [x] Romance (`server/data/references/genre-romance.md`)
  - [x] Thriller (`server/data/references/genre-thriller.md`)
  - [x] Science Fiction (`server/data/references/genre-scifi.md`)
  - [x] Fantasy (`server/data/references/genre-fantasy.md`)
  - [x] Mystery (`server/data/references/genre-mystery.md`)
  - [x] Literary Fiction (`server/data/references/genre-literary.md`)

**RAG Helper Utility (`server/src/utils/ragHelper.ts`):**
- [x] `queryChicagoManual(query, options?)` - Search Chicago Manual rules
- [x] `queryGenreRules(genre, query, options?)` - Search genre-specific rules
- [x] `formatCitations(results)` - Format results as citation strings
- [x] `ReferenceResult` interface with citation, score, content, and metadata
- [x] `QueryOptions` interface with topK, threshold, includeContent

### 1.4.2 Agent Integration

**Grammar Agent (Stage 2) - RAG Integration:**
- [x] Queries Chicago Manual grammar rules before processing
- [x] Uses topK: 5, threshold: 0.7 for retrieval
- [x] Injects RAG context into agent prompt
- [x] Extracts citations and adds to `AgentResult.sources`
- [x] Example query: "grammar punctuation capitalization spelling rules for: [content preview]"

**Chicago/Style Agent (Stage 7) - RAG Integration:**
- [x] Dual RAG queries:
  - Chicago Manual style rules (topK: 3)
  - Genre-specific conventions if genre provided (topK: 3)
- [x] Combined citation formatting for prompt context
- [x] Comprehensive style guide compliance checking
- [x] Example queries:
  - "style guide rules punctuation dialogue formatting for: [content preview]"
  - "[genre] genre conventions style requirements for: [content preview]"

**Citation Format Examples:**
- `[chicago-6.16: Serial Comma]`
- `[chicago-5.220: Subject-Verb Agreement]`
- `[Romance: HEA Requirements]`
- `[Thriller: Chapter-Ending Hooks]`

### 1.4.3 Reference Document Format

Each reference document follows this structure:

```markdown
# [Document Title]

## Overview
- Brief description of the rules/conventions covered
- Target audience and use cases

## Rules

### Rule [Number]: [Rule Title]
**Category:** [grammar|punctuation|style|convention]
**Summary:** Brief one-sentence description

**Detailed Explanation:**
Full explanation with context and rationale

**Examples:**
- Correct: [Example]
- Incorrect: [Example]

**Related Rules:**
- [References to related rules]
```

### 1.4.4 Setup and Ingestion

**Prerequisites:**

**Option A: Using Ollama (Recommended - Default)**
1. Install and start Ollama:
   ```bash
   # Install Ollama from https://ollama.ai
   # Start Ollama service (runs on http://localhost:11434 by default)
   
   # Pull the embedding model
   ollama pull nomic-embed-text
   ```

2. Configure environment variables in `server/.env`:
   ```bash
   EMBEDDING_PROVIDER=ollama
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_EMBEDDING_MODEL=nomic-embed-text
   ```

3. Install dependencies:
   ```bash
   cd server
   npm install
   ```

**Option B: Using Gemini**
1. Get Gemini API key from Google AI Studio

2. Configure environment variables in `server/.env`:
   ```bash
   EMBEDDING_PROVIDER=gemini
   GEMINI_API_KEY=your_api_key_here
   ```

3. Install dependencies:
   ```bash
   cd server
   npm install
   ```

**Ingestion Process:**
1. Ensure your chosen embedding provider is running:
   ```bash
   # For Ollama: Verify it's running
   curl http://localhost:11434/api/tags
   
   # For Gemini: Verify API key is set
   echo $GEMINI_API_KEY
   ```

2. Run the ingestion script:
   ```bash
   cd server
   npx tsx src/scripts/ingestReferences.ts
   ```

3. Expected output:
   - **Ollama**: `ℹ️  Using Ollama at http://localhost:11434 with model nomic-embed-text`
   - **Gemini**: `ℹ️  Using Gemini text-embedding-004`
   - `🚀 Starting reference corpus ingestion...`
   - Creates vector embeddings for all reference documents
   - Stores embeddings in `server/data/vector-store/`
   - Reports ingestion statistics (8 documents, chunks, total embeddings)
   - `✅ All documents ingested successfully!`

3. Verify ingestion:
   ```bash
   # Check that vector-store directory contains embeddings
   ls -la server/data/vector-store/
   ```

**Testing RAG Retrieval:**
1. Run the test script:
   ```bash
   cd server
   npx tsx src/scripts/testRagRetrieval.ts
   ```

2. Test coverage:
   - Chicago Manual: Serial comma, dialogue punctuation, grammar rules
   - Romance genre: HEA requirements
   - Thriller genre: Pacing rules
   - Sci-Fi genre: World-building conventions

3. Expected results:
   - 6 total tests
   - Each test returns relevant citations with confidence scores
   - Citations formatted as `[source: Title]`
   - Detailed result summaries with scores (0-1 scale)

### 1.4.5 Extending RAG References

**Adding New Genre Conventions:**
1. Create new reference file:
   ```bash
   # Create server/data/references/genre-[genre].md
   # Follow the standard rule format
   ```

2. Update `ingestReferences.ts`:
   ```typescript
   // Add to REFERENCE_FILES array
   { path: 'genre-[genre].md', category: 'genre-[genre]' }
   ```

3. Re-run ingestion to add new embeddings

**Adding New Chicago Manual Rules:**
1. Edit existing files:
   - `chicago-punctuation.md` for punctuation rules
   - `chicago-grammar.md` for grammar rules

2. Follow rule numbering convention (e.g., 6.16, 5.220)

3. Re-run ingestion to update embeddings

### 1.4.6 Embedding Provider Configuration

**Switching Between Providers:**

To switch from Ollama to Gemini (or vice versa):
1. Update `EMBEDDING_PROVIDER` in `server/.env`
2. Ensure the new provider is configured (API key or local service)
3. **Re-run ingestion** to regenerate embeddings with new provider
   ```bash
   cd server
   npx tsx src/scripts/ingestReferences.ts
   ```

**Provider Characteristics:**

| Feature | Ollama (nomic-embed-text) | Gemini (text-embedding-004) |
|---------|---------------------------|------------------------------|
| **Hosting** | Local inference | Cloud API |
| **Cost** | Free (local compute) | Pay-per-use |
| **Privacy** | Full data privacy | Data sent to Google |
| **Latency** | Low (local) | Network-dependent |
| **Dimensions** | 768 | 768 |
| **Setup** | Requires Ollama install | Requires API key |

**Performance Notes:**
- Vector dimensions may vary between Ollama models
- Re-ingestion required when switching providers
- Embeddings are not compatible across providers
- Consider using Ollama for development, Gemini for production (if needed)

### 1.4.7 RAG Performance Tuning

**Retrieval Parameters:**
- `topK`: Number of results to return (default: 3-5)
  - Higher values provide more context but may dilute relevance
  - Lower values provide focused, highly relevant rules
- `threshold`: Minimum similarity score (default: 0.7)
  - Higher values (0.8-0.9) ensure high relevance
  - Lower values (0.5-0.6) cast wider net but may include less relevant results
- `includeContent`: Whether to include full rule content (default: true)
  - Set to false for citation-only mode (saves tokens)

**Optimization Strategies:**
1. **Query Tuning:**
   - Use specific keywords from the content being analyzed
   - Include context (e.g., genre, document type)
   - Balance between specificity and generality

2. **Embedding Quality:**
   - Keep reference documents focused and well-structured
   - Use clear headings and consistent formatting
   - Include diverse examples for better semantic matching

3. **Caching:**
   - Consider caching frequent queries in Redis
   - Implement query normalization for better cache hits

### 1.4.8 Monitoring and Debugging

**RAG Query Logging:**
- All RAG queries log to console in development mode
- Includes query text, result count, and top scores
- Review logs to identify low-quality retrievals

**Common Issues:**
1. **No results returned:**
   - Check that vector store is populated (run ingestion)
   - Lower threshold parameter
   - Broaden query terms

2. **Irrelevant results:**
   - Increase threshold parameter
   - Make query more specific
   - Review reference document quality

3. **Slow performance:**
   - Reduce topK parameter
   - Optimize reference document chunking
   - Consider pgvector migration for production

### 1.4.9 Future Enhancements

Planned improvements to RAG system:
- [ ] Migration to PostgreSQL + pgvector for production scalability
- [ ] Integration with additional agents (Continuity, Readability)
- [ ] User-customizable style guide uploads
- [ ] Multi-lingual reference support
- [ ] Real-time rule conflict detection
- [ ] Citation visualization in UI
- [ ] A/B testing of RAG parameters
- [ ] Feedback loop for improving rule relevance

---

## 2. Illustration Agency

### 2.1 Backend routing

Create and wire Illustration routes:

- [ ] Create route file:
  - [ ] [`server/src/routes/illustration.ts`](server/src/routes/illustration.ts) exists.
  - [ ] It defines and exports `createIllustrationRouter()` (or equivalent).
  - [ ] It exposes the following POST endpoints:
    - [ ] `POST /illustration/projects`
    - [ ] `POST /illustration/agents/moodboard`
    - [ ] `POST /illustration/agents/characters`
    - [ ] `POST /illustration/agents/scenes`
    - [ ] `POST /illustration/agents/style-guide`
    - [ ] `POST /illustration/agents/covers`
- [ ] Mount router:
  - [ ] In [`server/src/index.ts`](server/src/index.ts):
    - [ ] Import the Illustration router factory.
    - [ ] Add `app.use('/illustration', createIllustrationRouter());`

### 2.2 IllustrationAgency client (services/agencyClient.ts)

Add strongly-typed methods that call the `/illustration/*` routes via `backendClient`:

In [`services/agencyClient.ts`](services/agencyClient.ts):

- [ ] `IllustrationAgency.createProject(...)`
  - [ ] Calls `POST /illustration/projects`
  - [ ] Accepts required project metadata (e.g. manuscriptId, scope, style preferences).
- [ ] `IllustrationAgency.generateMoodboard(...)`
  - [ ] Calls `POST /illustration/agents/moodboard`
- [ ] `IllustrationAgency.generateCharacterConcepts(...)`
  - [ ] Calls `POST /illustration/agents/characters`
- [ ] `IllustrationAgency.generateScenePrompt(...)`
  - [ ] Calls `POST /illustration/agents/scenes`
- [ ] `IllustrationAgency.generateStyleGuide(...)`
  - [ ] Calls `POST /illustration/agents/style-guide`
- [ ] `IllustrationAgency.generateCoverBrief(...)`
  - [ ] Calls `POST /illustration/agents/covers`

Implementation checklist:

- [ ] All methods use `backendClient` (no ad-hoc fetch).
- [ ] Request/response shapes are defined as TypeScript types/interfaces.
- [ ] Errors are handled at the client boundary (typed results or exceptions).

### 2.3 Frontend wiring: use IllustrationAgency

In [`components/IllustrationView.tsx`](components/IllustrationView.tsx) and any related illustration components:

- [ ] Replace direct `geminiService` or low-level calls with corresponding `IllustrationAgency` methods for:
  - [ ] Moodboard generation
  - [ ] Character concepts
  - [ ] Scene prompts
  - [ ] Illustration style guide
  - [ ] Cover briefs
- [ ] Keep non-illustration flows on their existing services.

---

## 3. Publishing Agency

### 3.1 Backend routing

Create and wire Publishing routes:

- [ ] Create route file:
  - [ ] [`server/src/routes/publishing.ts`](server/src/routes/publishing.ts) exists.
  - [ ] It defines and exports `createPublishingRouter()` (or equivalent).
  - [ ] It exposes endpoints under `/publishing`:
    - [ ] `/publishing/packages`
    - [ ] `/publishing/agents/exports`
    - [ ] `/publishing/agents/localization`
    - [ ] `/publishing/agents/metadata`
    - [ ] `/publishing/agents/cost-plan`
    - [ ] `/publishing/agents/submissions`
- [ ] Mount router:
  - [ ] In [`server/src/index.ts`](server/src/index.ts):
    - [ ] Import Publishing router factory.
    - [ ] Add `app.use('/publishing', createPublishingRouter());`

### 3.2 PublishingAgency client (services/agencyClient.ts)

In [`services/agencyClient.ts`](services/agencyClient.ts), implement:

- [ ] `PublishingAgency.createPackage(...)`
  - [ ] Calls `/publishing/packages` to create a package.
- [ ] `PublishingAgency.getPackage(...)`
  - [ ] Calls `/publishing/packages` (or sub-route) to retrieve package details.
- [ ] `PublishingAgency.generateExports(...)`
  - [ ] Calls `/publishing/agents/exports`.
- [ ] `PublishingAgency.generateLocalization(...)`
  - [ ] Calls `/publishing/agents/localization`.
- [ ] `PublishingAgency.generateMetadata(...)`
  - [ ] Calls `/publishing/agents/metadata`.
- [ ] `PublishingAgency.generateCostPlan(...)`
  - [ ] Calls `/publishing/agents/cost-plan`.
- [ ] `PublishingAgency.generateSubmission(...)`
  - [ ] Calls `/publishing/agents/submissions`.

Implementation checklist:

- [ ] All methods are exported from a coherent `PublishingAgency` namespace/object.
- [ ] All calls use `backendClient` with strict typing.
- [ ] No extra endpoints beyond those listed above are referenced.

### 3.3 Frontend wiring: use PublishingAgency

In [`components/PublishingView.tsx`](components/PublishingView.tsx) and related publishing components:

- [ ] Refactor publishing workflows to depend on `PublishingAgency` methods instead of:
  - Raw `geminiService` calls
  - Direct `backendClient` calls for publishing concerns
- [ ] Confirm:
  - [ ] Package creation, inspection, and updates use PublishingAgency.
  - [ ] Export, localization, metadata, cost plan, and submission flows route through PublishingAgency.

---

## 4. Marketing Agency

### 4.1 Backend routing

Create and wire Marketing routes:

- [ ] Create route file:
  - [ ] [`server/src/routes/marketing.ts`](server/src/routes/marketing.ts) exists.
  - [ ] It defines and exports `createMarketingRouter()` (or equivalent).
  - [ ] It exposes endpoints under `/marketing`:
    - [ ] `/marketing/campaigns`
    - [ ] `/marketing/campaigns/assets`
    - [ ] `/marketing/scenarios`
    - [ ] `/marketing/analytics/summary`
- [ ] Mount router:
  - [ ] In [`server/src/index.ts`](server/src/index.ts):
    - [ ] Import Marketing router factory.
    - [ ] Add `app.use('/marketing', createMarketingRouter());`

### 4.2 MarketingAgency client (services/agencyClient.ts)

In [`services/agencyClient.ts`](services/agencyClient.ts), implement:

- [ ] `MarketingAgency.createCampaign(...)`
  - [ ] Calls `/marketing/campaigns`.
- [ ] `MarketingAgency.getCampaign(...)`
  - [ ] Calls `/marketing/campaigns` (or sub-route) to fetch campaign details.
- [ ] `MarketingAgency.generateCampaignAssets(...)`
  - [ ] Calls `/marketing/campaigns/assets`.
- [ ] `MarketingAgency.generateScenarios(...)`
  - [ ] Calls `/marketing/scenarios`.
- [ ] `MarketingAgency.summarizeAnalytics(...)`
  - [ ] Calls `/marketing/analytics/summary`.
- [ ] `MarketingAgency.getAnalyticsSummaries(...)`
  - [ ] Calls `/marketing/analytics/summary` with appropriate query/filtering if needed.

Implementation checklist:

- [ ] All methods are grouped under `MarketingAgency` within [`services/agencyClient.ts`](services/agencyClient.ts).
- [ ] All calls go through `backendClient` with strongly typed request/response contracts.

### 4.3 Frontend wiring: use MarketingAgency

For marketing and analytics-related components (e.g. dashboards, campaign tools):

- [ ] Update components that manage campaigns, assets, marketing scenarios, and analytics to call `MarketingAgency`:
  - [ ] Campaign creation and retrieval use `MarketingAgency.createCampaign` / `MarketingAgency.getCampaign`.
  - [ ] Asset generation uses `MarketingAgency.generateCampaignAssets`.
  - [ ] Scenario generation uses `MarketingAgency.generateScenarios`.
  - [ ] Analytics summaries use `MarketingAgency.summarizeAnalytics` / `MarketingAgency.getAnalyticsSummaries`.
- [ ] Remove direct coupling to `geminiService` or raw `backendClient` for these marketing capabilities once the agency methods are in place.

---

## 5. Verification Checklist (Per Agency)

Repeat the following verification steps after completing wiring for each agency (Editing, Illustration, Publishing, Marketing):

### 5.1 Type and build checks

- [ ] Run TypeScript and test suite at repo root:
  - [ ] `npm test` and/or `npm run test` pass (if configured).
  - [ ] `tsc` (or `npm run build` / `npm run typecheck`) passes for:
    - [ ] Frontend
    - [ ] Server
- [ ] Fix any type errors introduced by new agency methods or route handlers.

### 5.2 Runtime verification with dev servers

With dev servers running (frontend and backend):

- [ ] Editing Agency:
  - [ ] Trigger Editing-related UI flows from [`App.tsx`](App.tsx) and related components.
  - [ ] Confirm network calls hit `/editing/*` endpoints.
  - [ ] Confirm behavior matches or improves upon previous Editing functionality.
- [ ] Illustration Agency:
  - [ ] In [`components/IllustrationView.tsx`](components/IllustrationView.tsx), run moodboard/character/scene/style-guide/cover flows.
  - [ ] Confirm network calls hit `/illustration/*` endpoints.
- [ ] Publishing Agency:
  - [ ] In [`components/PublishingView.tsx`](components/PublishingView.tsx), run publishing flows.
  - [ ] Confirm network calls hit `/publishing/*` endpoints.
- [ ] Marketing Agency:
  - [ ] In marketing/statistics-related components, trigger campaign and analytics flows.
  - [ ] Confirm network calls hit `/marketing/*` endpoints.

### 5.3 Consistency and boundaries

- [ ] Ensure UI does not call `geminiService` or `backendClient` directly for features covered by an Agency once that Agency is implemented.
- [ ] Ensure each Agency method aligns with exactly one backend route from this checklist (no undocumented endpoints).
- [ ] Ensure error handling paths are implemented and surfaced clearly in the UI.

---

This checklist is the authoritative implementation guide for the 4-Agency architecture in this repository. Follow sections 1–5 sequentially to migrate and verify each Agency.