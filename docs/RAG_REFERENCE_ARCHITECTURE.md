# RAG Reference System Architecture

## Overview
The RAG (Retrieval-Augmented Generation) reference system provides editing agents with authoritative style guide rules, genre conventions, and writing best practices through semantic search.

## Existing Infrastructure (Leveraged)

### 1. FileVectorStore (`server/src/vectorStore/fileStore.ts`)
- **Storage**: JSON file at `data/vector-store.json`
- **Methods**:
  - `upsertDocument(documentId, title, chunks, embeddings)` - Store reference content
  - `getDocument(documentId)` - Retrieve full document
  - `query(documentId, queryEmbedding, topK)` - Semantic search with cosine similarity
- **Chunk Structure**:
  ```typescript
  {
    id: string;           // Unique chunk ID
    heading: string;      // Section heading
    summary: string;      // Brief summary
    content: string;      // Full rule text
    quote?: string;       // Preview snippet
    embedding: number[];  // 768-dim vector (Gemini text-embedding-004)
  }
  ```

### 2. Embedding Service (`server/src/services/genai.ts`)
- **Model**: Google Gemini `text-embedding-004` (768 dimensions)
- **Function**: `getEmbedding(text: string): Promise<number[]>`
- **Usage**: Convert queries and reference content to vector embeddings

### 3. RAG Query Endpoint (`server/src/routes/rag.ts`)
- **Route**: `POST /api/rag/query`
- **Input**: `{ documentId, query, topK }`
- **Output**: Scored chunks with relevance scores

---

## Reference Document Structure

### Document IDs
- `chicago-manual-punctuation` - Chicago Manual punctuation rules (Ch. 6)
- `chicago-manual-grammar` - Chicago Manual grammar rules (Ch. 5)
- `chicago-manual-numbers` - Chicago Manual number formatting (Ch. 9)
- `chicago-manual-citations` - Chicago Manual citation styles (Ch. 14-15)
- `genre-romance` - Romance genre conventions
- `genre-thriller` - Thriller genre conventions
- `genre-scifi` - Science Fiction genre conventions
- `genre-fantasy` - Fantasy genre conventions
- `genre-mystery` - Mystery genre conventions
- `genre-literary` - Literary Fiction conventions

### Chunk Format (JSON)
Each reference document contains multiple chunks with:

```json
{
  "documentId": "chicago-manual-punctuation",
  "title": "Chicago Manual of Style - Punctuation",
  "chunks": [
    {
      "id": "chicago-6.8",
      "heading": "Commas with Coordinate Adjectives",
      "summary": "Use commas between coordinate adjectives not joined by 'and'",
      "content": "When two or more adjectives precede a noun and each modifies the noun separately, they are called coordinate adjectives and should be separated by commas. Test: if 'and' can be inserted between them or their order reversed, use commas. Example: 'a concise, coherent essay' vs 'a dark brown coat' (no comma).",
      "quote": "Use commas between coordinate adjectives...",
      "ruleNumber": "6.8",
      "category": "punctuation",
      "section": "commas",
      "examples": [
        "Correct: a concise, coherent essay",
        "Correct: an expensive, ill-advised campaign",
        "Incorrect: a dark, brown coat",
        "Correct: a dark brown coat"
      ]
    }
  ]
}
```

### Genre Template Format
```json
{
  "documentId": "genre-romance",
  "title": "Romance Genre Conventions",
  "chunks": [
    {
      "id": "romance-pov",
      "heading": "Point of View Standards",
      "summary": "Romance typically uses deep POV with emotional interiority",
      "content": "Romance novels commonly employ close third-person or first-person POV to emphasize emotional connection. Deep POV techniques include filtering out 'he felt' and 'she thought' for immediate emotional experience. Multi-POV alternates between hero and heroine perspectives, with clear chapter or scene breaks between shifts.",
      "category": "narrative-technique",
      "section": "pov",
      "conventions": ["close-third-person", "deep-pov", "dual-pov-hero-heroine"]
    }
  ]
}
```

---

## RAG Helper Utility

**File**: `server/src/utils/ragHelper.ts`

### Purpose
Wrap vector store queries with agent-specific logic:
- Query multiple reference documents simultaneously
- Filter by relevance threshold
- Format citations for agent responses
- Cache frequent queries (optional)

### Interface
```typescript
interface RagQuery {
  query: string;           // User's editing question
  documentIds: string[];   // Which references to search
  topK?: number;           // Results per document (default: 3)
  minScore?: number;       // Minimum relevance (default: 0.7)
}

interface RagResult {
  ruleNumber?: string;     // e.g., "Chicago 6.8"
  source: string;          // Document title
  content: string;         // Rule text
  score: number;           // Relevance score (0-1)
  examples?: string[];     // Usage examples
}

async function queryReferences(
  vectorStore: FileVectorStore,
  query: RagQuery
): Promise<RagResult[]>
```

### Usage in Agents
```typescript
// Stage 2: Grammar Agent
const punctuationRules = await queryReferences(vectorStore, {
  query: "comma usage with coordinate adjectives",
  documentIds: ["chicago-manual-punctuation"],
  topK: 3,
  minScore: 0.75
});

// Include in prompt:
const prompt = `
You are the Grammar Agent. Fix spelling, grammar, punctuation.

Relevant Style Rules:
${punctuationRules.map(r => `- [${r.ruleNumber || r.source}] ${r.content}`).join('\n')}

Text to edit:
${text}
`;
```

---

## Agent Integration Points

### Stage 2: Grammar Agent
**References**: `chicago-manual-punctuation`, `chicago-manual-grammar`
**Queries**:
- "comma rules for compound sentences"
- "semicolon usage between clauses"
- "apostrophe possessive rules"
- "hyphenation of compound modifiers"

### Stage 7: Chicago/Style Agent
**References**: `chicago-manual-*`, `genre-{genre}`
**Queries**:
- "dialogue punctuation in American English"
- "em dash usage in narrative"
- "capitalization of titles"
- "{genre} dialogue conventions"
- "{genre} pacing standards"

### Stage 3: Syntax Agent (Optional Enhancement)
**References**: `genre-{genre}`
**Queries**:
- "{genre} sentence rhythm patterns"
- "parallel structure in lists"

### Stage 9: Readability Agent (Optional Enhancement)
**References**: `genre-{genre}`
**Queries**:
- "{genre} target reading level"
- "sentence length guidelines for {genre}"

---

## Citation Format

### In Agent Responses
Agents should cite sources in their `message` field:

```typescript
{
  "stageNumber": 2,
  "stageName": "Grammar & Mechanics",
  "confidenceScore": 0.95,
  "issues": [
    {
      "severity": "major",
      "location": { "paragraph": 1, "offset": 42 },
      "message": "Missing comma between coordinate adjectives 'dark' and 'stormy'. [Chicago 6.8: Use commas between coordinate adjectives]",
      "original": "It was a dark stormy night",
      "suggested": "It was a dark, stormy night",
      "sources": ["Chicago 6.8"]
    }
  ]
}
```

### Extended AgentResult Interface
Update `server/src/agencies/editing.ts`:

```typescript
interface Issue {
  severity: 'critical' | 'major' | 'minor' | 'suggestion';
  location: { chapter?: number; paragraph?: number; line?: number; offset?: number };
  message: string;
  original?: string;
  suggested?: string;
  sources?: string[];  // NEW: Rule citations
}
```

---

## Implementation Plan

### Phase 1: Reference Content Creation ✅ Next
1. Create `server/data/references/chicago-manual-punctuation.json`
2. Create `server/data/references/chicago-manual-grammar.json`
3. Create `server/data/references/genre-romance.json`
4. Create 5 more genre files (thriller, sci-fi, fantasy, mystery, literary)

### Phase 2: Ingestion Script
**File**: `server/src/scripts/ingestReferences.ts`
```typescript
// Read all JSON files from data/references/
// For each file:
//   - Parse JSON
//   - Generate embeddings for each chunk
//   - Upsert to FileVectorStore
// Usage: npm run ingest-references
```

### Phase 3: RAG Helper
**File**: `server/src/utils/ragHelper.ts`
- Implement `queryReferences()` function
- Add relevance filtering
- Format citations

### Phase 4: Agent Integration
- Update Stage 2 (Grammar) prompt to include RAG results
- Update Stage 7 (Chicago/Style) prompt to include RAG results
- Extend `Issue` interface with `sources?: string[]`

### Phase 5: Testing & Documentation
- Test with sample queries
- Measure retrieval accuracy
- Update `AGENCY_IMPLEMENTATION_CHECKLIST.md` with RAG section

---

## Technical Considerations

### Embedding Costs
- **Gemini text-embedding-004**: Free tier includes 1,500 requests/day
- **Reference ingestion**: One-time cost (~50-100 chunks × 7-10 documents = 500-1000 embeddings)
- **Query embeddings**: 1 embedding per agent query (minimal cost)

### Storage
- **Vector store file**: JSON format, ~500KB-2MB estimated
- **Backup**: Keep reference JSON files separate from vector store for re-ingestion

### Performance
- **Query latency**: <100ms for semantic search (in-memory cosine similarity)
- **Caching**: Consider Redis cache for frequent queries (optional optimization)

### Extensibility
- Users can add custom style guides by creating new JSON files
- Re-run ingestion script to update vector store
- Document template format in user documentation

---

## Example Reference Content

### Chicago Manual - Punctuation (Sample)
```json
{
  "documentId": "chicago-manual-punctuation",
  "title": "Chicago Manual of Style - Punctuation",
  "chunks": [
    {
      "id": "chicago-6.16",
      "heading": "Comma Before 'And' in Series",
      "summary": "Use serial comma before 'and' in list of three or more items",
      "content": "Chicago style requires a comma before the conjunction in a series of three or more items. This is known as the serial comma or Oxford comma. Example: 'red, white, and blue' not 'red, white and blue'.",
      "ruleNumber": "6.16",
      "category": "punctuation",
      "section": "commas",
      "examples": [
        "Correct: We need eggs, milk, and bread.",
        "Incorrect: We need eggs, milk and bread."
      ]
    },
    {
      "id": "chicago-6.85",
      "heading": "Em Dash Usage",
      "summary": "Em dashes set off amplifying or digressive elements",
      "content": "An em dash—like this—sets off an amplifying or digressive element. Use em dashes sparingly. Do not put spaces around em dashes. For sudden breaks in thought or speech, a single em dash may be used.",
      "ruleNumber": "6.85",
      "category": "punctuation",
      "section": "dashes",
      "examples": [
        "Correct: The package arrived—finally—after two weeks.",
        "Correct: She opened the door and—",
        "Incorrect: The package arrived — finally — after two weeks."
      ]
    }
  ]
}
```

### Genre - Romance (Sample)
```json
{
  "documentId": "genre-romance",
  "title": "Romance Genre Conventions",
  "chunks": [
    {
      "id": "romance-ending",
      "heading": "Happily Ever After (HEA) Requirement",
      "summary": "Romance must end with emotionally satisfying HEA or HFN",
      "content": "Romance novels must conclude with an emotionally satisfying ending where the central love story is resolved. This can be a Happily Ever After (HEA) where the couple commits to a permanent relationship, or a Happy For Now (HFN) where the relationship is promising but not yet permanent. The ending must feel earned through character growth and conflict resolution.",
      "category": "plot-structure",
      "section": "endings",
      "conventions": ["HEA-required", "emotional-satisfaction", "earned-resolution"]
    }
  ]
}
```

---

## Maintenance

### Updating References
1. Edit JSON file in `server/data/references/`
2. Run `npm run ingest-references` to re-embed
3. Vector store automatically updates

### Adding New References
1. Create new JSON file following chunk format
2. Run ingestion script
3. Update `documentIds` list in relevant agents

### Version Control
- Track reference JSON files in Git
- Exclude `data/vector-store.json` (regenerate from sources)
- Include ingestion script in repository

---

## Future Enhancements

1. **User-Uploaded Style Guides**: Allow users to upload custom style PDFs, auto-chunk and embed
2. **Multi-Language Support**: Add style guides for British English, other languages
3. **Learning System**: Track which rules are most frequently violated, surface to users
4. **Confidence Weighting**: Boost agent confidence when high-relevance rules are found
5. **Interactive Citation**: Click citation in UI to view full rule text
6. **Rule Conflict Detection**: Warn when Chicago and genre conventions conflict

---

## Success Metrics

- **Retrieval Accuracy**: >80% of queries return relevant rules (human evaluation)
- **Citation Coverage**: >50% of critical/major issues include rule citations
- **Agent Confidence**: Average confidence increases by 5-10% with RAG
- **User Satisfaction**: Feedback on helpfulness of cited rules

---

## Documentation References

- [Chicago Manual of Style Online](https://www.chicagomanualofstyle.org/)
- [Romance Writers of America - Genre Standards](https://www.rwa.org/)
- [pgvector Documentation](https://github.com/pgvector/pgvector) (future migration)
- [Gemini Embedding API](https://ai.google.dev/docs/embeddings_guide)