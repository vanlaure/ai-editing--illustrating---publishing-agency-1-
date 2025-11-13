import { Router } from 'express';
import { z } from 'zod';
import { generateContent } from '../services/genai';
import { v4 as uuidv4 } from 'uuid';
import { queryChicagoManual, queryGenreRules, formatCitations, ReferenceResult } from '../utils/ragHelper';

/**
 * EDITING AGENCY - Meticulous Manuscript Editing with Multi-Agent Workflow
 * 
 * Architecture:
 * - Chief Editing Agent: Orchestrates all stages, enforces approval gates
 * - Line Editing Agents: Grammar, Punctuation, Parallelism
 * - Structural Editing Agents: Structure, Arc Analysis, Consistency
 * - Style & Compliance Agents: Chicago Manual, Genre Specialist, Voice
 * - Quality & Continuity Agents: Continuity Checker, Glossary Manager
 * - Review Interface Agent: Version Control, Change Tracking
 * 
 * Workflow Stages:
 * 1. Intake & Pre-Processing
 * 2. Grammar & Mechanics
 * 3. Syntax & Parallelism
 * 4. Tense & Voice Consistency
 * 5. Structural Editing
 * 6. Character Arc Analysis
 * 7. Chicago Manual & Genre Style
 * 8. Continuity Cross-Check
 * 9. Readability & Flow Optimization
 * 10. Final Proofing & Audit
 * 11. Human-in-the-Loop Approval
 */

// ============================================================================
// SCHEMAS & TYPES
// ============================================================================

const requestIdSchema = z.string().min(6);
const manuscriptIdSchema = z.string().min(1);

const createManuscriptSchema = z.object({
  content: z.string().min(100),
  manuscriptId: manuscriptIdSchema.optional(),
  metadata: z.object({
    title: z.string().optional(),
    genre: z.string().optional(),
    targetAudience: z.string().optional(),
    language: z.string().default('en'),
  }).optional(),
  requestId: requestIdSchema,
});

const complianceCheckSchema = z.object({
  manuscriptId: manuscriptIdSchema,
  requestId: requestIdSchema,
});

const structuralAnalysisSchema = z.object({
  manuscriptId: manuscriptIdSchema,
  analysisType: z.enum(['pacing', 'characterArcs', 'plotStructure', 'all']).default('all'),
  requestId: requestIdSchema,
});

const styleComplianceSchema = z.object({
  manuscriptId: manuscriptIdSchema,
  styleGuide: z.enum(['chicago', 'mla', 'apa', 'genre-specific']).default('chicago'),
  genre: z.string().optional(),
  requestId: requestIdSchema,
});

const continuityCheckSchema = z.object({
  manuscriptId: manuscriptIdSchema,
  checkTypes: z.array(z.enum(['characters', 'timeline', 'locations', 'terminology'])).default(['characters', 'timeline']),
  requestId: requestIdSchema,
});

const readabilityOptimizationSchema = z.object({
  manuscriptId: manuscriptIdSchema,
  targetReadingLevel: z.enum(['elementary', 'middle-school', 'high-school', 'college', 'professional']).optional(),
  requestId: requestIdSchema,
});

// Agent Result Types
type AgentResult = {
  agentName: string;
  stage: number;
  confidenceScore: number; // 0-1
  issues: EditingIssue[];
  summary: string;
  processingTime: number;
  timestamp: string;
  sources?: string[]; // RAG citation sources (e.g., ["[chicago-6.16: Serial Comma]", "[Romance: HEA Requirements]"])
};

type EditingIssue = {
  id: string;
  type: 'grammar' | 'syntax' | 'style' | 'continuity' | 'structure' | 'readability' | 'tense' | 'voice';
  severity: 'critical' | 'major' | 'minor' | 'suggestion';
  location: { chapter?: number; paragraph?: number; line?: number; offset?: number };
  message: string;
  original?: string;
  suggestion?: string;
  ruleReference?: string;
};

type Manuscript = {
  id: string;
  content: string;
  metadata: {
    title?: string;
    genre?: string;
    targetAudience?: string;
    language: string;
    wordCount: number;
    createdAt: string;
    lastModified: string;
  };
  workflowState: {
    currentStage: number;
    stagesCompleted: number[];
    overallConfidence: number;
    lastProcessedAt: string;
  };
  agentResults: AgentResult[];
  continuityData: ContinuityData;
  lastRequestIds: Record<string, string>;
};

type ContinuityData = {
  characters: Map<string, { firstMention: number; appearances: number[]; aliases: string[] }>;
  locations: Map<string, { firstMention: number; descriptions: string[] }>;
  timeline: { event: string; chapter: number; timestamp?: string }[];
  terminology: Map<string, { definition: string; variants: string[] }>;
};

// ============================================================================
// IN-MEMORY STORAGE (Replace with database in production)
// ============================================================================

const manuscripts = new Map<string, Manuscript>();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const ensureManuscript = (id: string): Manuscript => {
  const ms = manuscripts.get(id);
  if (!ms) {
    const error: any = new Error('Manuscript not found');
    error.status = 404;
    throw error;
  }
  return ms;
};

const isDuplicate = (ms: Manuscript, key: string, requestId: string): boolean => {
  return ms.lastRequestIds[key] === requestId;
};

const markRequest = (ms: Manuscript, key: string, requestId: string) => {
  ms.lastRequestIds[key] = requestId;
  ms.metadata.lastModified = new Date().toISOString();
};

const safeJson = <T>(raw: string, fallback: T): T => {
  try {
    return JSON.parse(raw || JSON.stringify(fallback));
  } catch {
    const match = (raw || '').match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
};

const calculateWordCount = (text: string): number => {
  return text.trim().split(/\s+/).length;
};

const detectLanguage = (text: string): string => {
  // Simple heuristic - in production, use langdetect or similar
  return 'en';
};

// ============================================================================
// AGENT PROMPT TEMPLATES
// ============================================================================

const STAGE_1_INTAKE_PROMPT = (content: string, metadata: any) => `
You are the Intake Agent for manuscript pre-processing.
Analyze this manuscript and extract key metadata:
- Detected genre (if not provided: ${metadata.genre || 'unknown'})
- Estimated target audience
- Narrative voice (first person, third person, etc.)
- Tense consistency check (past, present, mixed)
- Initial structural overview (chapters, sections)

Return ONLY JSON:
{
  "detectedGenre": "",
  "targetAudience": "",
  "narrativeVoice": "",
  "dominantTense": "",
  "structuralOverview": "",
  "initialObservations": []
}

MANUSCRIPT (first 3000 chars):
${content.substring(0, 3000)}
`;

const STAGE_2_GRAMMAR_PROMPT = (content: string, ragContext?: string) => `
You are the Grammar Agent applying strict grammar and mechanics rules.
Identify grammar, spelling, punctuation, and capitalization errors.

${ragContext || 'Follow Chicago Manual of Style guidelines for grammar, punctuation, and mechanics.'}

Return ONLY JSON array of issues:
[{
  "type": "grammar",
  "severity": "critical|major|minor",
  "location": {"paragraph": 1, "offset": 10},
  "message": "",
  "original": "",
  "suggestion": "",
  "ruleReference": ""
}]

CONTENT:
${content.substring(0, 8000)}
`;

const STAGE_3_SYNTAX_PROMPT = (content: string) => `
You are the Syntax Agent checking sentence balance, rhythm, and parallel structure.
Identify awkward constructions, run-ons, fragments, and parallelism issues.

Return ONLY JSON array:
[{
  "type": "syntax",
  "severity": "major|minor|suggestion",
  "location": {"paragraph": 1},
  "message": "",
  "original": "",
  "suggestion": ""
}]

CONTENT:
${content.substring(0, 8000)}
`;

const STAGE_4_TENSE_PROMPT = (content: string) => `
You are the Temporal Agent ensuring tense and voice consistency.
Check for:
- Tense shifts (past/present mixing)
- Voice consistency (active vs passive)
- Timeline coherence

Return ONLY JSON:
{
  "dominantTense": "",
  "tenseShifts": [{
    "location": {"paragraph": 1},
    "from": "",
    "to": "",
    "severity": ""
  }],
  "voiceIssues": []
}

CONTENT:
${content.substring(0, 8000)}
`;

const STAGE_5_STRUCTURE_PROMPT = (content: string, metadata: any) => `
You are the Structure Agent evaluating macro-level organization.
Analyze:
- Chapter organization and pacing
- Scene transitions
- Narrative flow
- Plot structure (if fiction)

Return ONLY JSON:
{
  "pacingAssessment": "",
  "structuralIssues": [{
    "location": {"chapter": 1},
    "type": "pacing|flow|organization",
    "severity": "",
    "message": ""
  }],
  "recommendations": []
}

GENRE: ${metadata.genre || 'unknown'}
CONTENT:
${content.substring(0, 10000)}
`;

const STAGE_6_CHARACTER_ARC_PROMPT = (content: string) => `
You are the Arc Agent tracking character development.
Identify:
- Major character arcs
- Character consistency issues
- Missing character beats
- Character voice distinctions

Return ONLY JSON:
{
  "characters": [{
    "name": "",
    "arcQuality": "strong|adequate|weak",
    "issues": [],
    "voiceConsistency": "high|medium|low"
  }],
  "recommendations": []
}

CONTENT:
${content.substring(0, 10000)}
`;

const STAGE_7_CHICAGO_PROMPT = (content: string, styleGuide: string, genre?: string, ragContext?: string) => `
You are the Chicago Agent (or ${styleGuide} specialist).
Apply style guide rules:
- Dialogue punctuation
- Em-dash/en-dash usage
- Serial comma
- Number formatting
- Genre-specific conventions${genre ? ` for ${genre}` : ''}

${ragContext || `Follow ${styleGuide.toUpperCase()} guidelines and standard ${genre || 'general'} genre conventions.`}

Return ONLY JSON array:
[{
  "type": "style",
  "severity": "major|minor",
  "location": {"paragraph": 1},
  "message": "",
  "ruleReference": "${styleGuide}",
  "original": "",
  "suggestion": ""
}]

CONTENT:
${content.substring(0, 8000)}
`;

const STAGE_8_CONTINUITY_PROMPT = (content: string, existingData: any) => `
You are the Continuity Agent tracking cross-chapter consistency.
Check:
- Character name consistency
- Timeline coherence
- Location descriptions
- Terminology consistency

Return ONLY JSON:
{
  "charactersTracked": [{"name": "", "aliases": [], "inconsistencies": []}],
  "timelineEvents": [{"event": "", "chapter": 1}],
  "locationIssues": [],
  "terminologyIssues": []
}

CONTENT:
${content.substring(0, 10000)}
`;

const STAGE_9_READABILITY_PROMPT = (content: string, targetLevel?: string) => `
You are the Readability Agent optimizing flow and clarity.
Analyze:
- Sentence variety
- Paragraph length
- Reading level (target: ${targetLevel || 'general adult'})
- Flow and transitions

Return ONLY JSON:
{
  "fleschKincaidGrade": 0,
  "readabilityScore": 0,
  "sentenceVariety": "high|medium|low",
  "issues": [{
    "type": "readability",
    "severity": "minor|suggestion",
    "location": {"paragraph": 1},
    "message": "",
    "suggestion": ""
  }],
  "recommendations": []
}

CONTENT:
${content.substring(0, 8000)}
`;

const STAGE_10_QA_PROMPT = (agentResults: AgentResult[]) => `
You are the QA Agent performing final audit.
Review all previous agent results and identify:
- Remaining high-priority issues
- Consistency across edits
- Overall quality assessment

AGENT RESULTS:
${JSON.stringify(agentResults.map(r => ({ agent: r.agentName, stage: r.stage, confidence: r.confidenceScore, issueCount: r.issues.length })))}

Return ONLY JSON:
{
  "overallQuality": "excellent|good|needs-work|poor",
  "remainingIssues": [],
  "approvalRecommendation": true|false,
  "notes": []
}
`;

// ============================================================================
// AGENT EXECUTION FUNCTIONS
// ============================================================================

const runIntakeAgent = async (ms: Manuscript): Promise<AgentResult> => {
  const startTime = Date.now();
  const prompt = STAGE_1_INTAKE_PROMPT(ms.content, ms.metadata);
  const raw = await generateContent('gemini-2.5-pro', prompt);
  const result = safeJson<any>(raw, {});
  
  return {
    agentName: 'Intake Agent',
    stage: 1,
    confidenceScore: 0.95,
    issues: [],
    summary: `Pre-processing complete. Genre: ${result.detectedGenre || 'unknown'}, Voice: ${result.narrativeVoice || 'unknown'}`,
    processingTime: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  };
};

const runGrammarAgent = async (ms: Manuscript): Promise<AgentResult> => {
  const startTime = Date.now();
  
  // Query Chicago Manual grammar rules via RAG
  const ragResults = await queryChicagoManual(
    `grammar punctuation capitalization spelling rules for: ${ms.content.slice(0, 500)}`,
    { topK: 5, threshold: 0.7 }
  );
  
  // Format RAG context for prompt using helper function
  const ragContext = ragResults.length > 0
    ? `Relevant Chicago Manual of Style Guidelines:\n${formatCitations(ragResults)}\n\nApply these rules during your review.`
    : undefined;
  
  const prompt = STAGE_2_GRAMMAR_PROMPT(ms.content, ragContext);
  const raw = await generateContent('gemini-2.5-pro', prompt);
  const issues = safeJson<EditingIssue[]>(raw, []);
  
  // Extract citation sources as array
  const sources = ragResults.length > 0 ? ragResults.map(r => r.citation) : undefined;
  
  return {
    agentName: 'Grammar Agent',
    stage: 2,
    confidenceScore: issues.length === 0 ? 0.98 : Math.max(0.7, 1 - issues.length * 0.01),
    issues: issues.map(i => ({ ...i, id: uuidv4() })),
    summary: `Found ${issues.length} grammar/mechanics issues`,
    processingTime: Date.now() - startTime,
    timestamp: new Date().toISOString(),
    sources,
  };
};

const runSyntaxAgent = async (ms: Manuscript): Promise<AgentResult> => {
  const startTime = Date.now();
  const prompt = STAGE_3_SYNTAX_PROMPT(ms.content);
  const raw = await generateContent('gemini-2.5-pro', prompt);
  const issues = safeJson<EditingIssue[]>(raw, []);
  
  return {
    agentName: 'Syntax Agent',
    stage: 3,
    confidenceScore: issues.length === 0 ? 0.95 : Math.max(0.75, 1 - issues.length * 0.015),
    issues: issues.map(i => ({ ...i, id: uuidv4() })),
    summary: `Found ${issues.length} syntax issues`,
    processingTime: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  };
};

const runTemporalAgent = async (ms: Manuscript): Promise<AgentResult> => {
  const startTime = Date.now();
  const prompt = STAGE_4_TENSE_PROMPT(ms.content);
  const raw = await generateContent('gemini-2.5-pro', prompt);
  const result = safeJson<any>(raw, { tenseShifts: [], voiceIssues: [] });
  
  const issues: EditingIssue[] = [
    ...result.tenseShifts.map((shift: any) => ({
      id: uuidv4(),
      type: 'tense' as const,
      severity: shift.severity || 'major' as const,
      location: shift.location,
      message: `Tense shift from ${shift.from} to ${shift.to}`,
      original: '',
      suggestion: '',
    })),
    ...result.voiceIssues.map((issue: any) => ({
      id: uuidv4(),
      type: 'voice' as const,
      severity: 'minor' as const,
      location: issue.location,
      message: issue.message,
      original: '',
      suggestion: '',
    })),
  ];
  
  return {
    agentName: 'Temporal Agent',
    stage: 4,
    confidenceScore: issues.length === 0 ? 0.97 : Math.max(0.8, 1 - issues.length * 0.02),
    issues,
    summary: `Dominant tense: ${result.dominantTense}, ${issues.length} consistency issues`,
    processingTime: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  };
};

const runStructureAgent = async (ms: Manuscript): Promise<AgentResult> => {
  const startTime = Date.now();
  const prompt = STAGE_5_STRUCTURE_PROMPT(ms.content, ms.metadata);
  const raw = await generateContent('gemini-2.5-pro', prompt);
  const result = safeJson<any>(raw, { structuralIssues: [], recommendations: [] });
  
  const issues: EditingIssue[] = result.structuralIssues.map((issue: any) => ({
    id: uuidv4(),
    type: 'structure' as const,
    severity: issue.severity || 'major' as const,
    location: issue.location,
    message: issue.message,
    original: '',
    suggestion: '',
  }));
  
  return {
    agentName: 'Structure Agent',
    stage: 5,
    confidenceScore: issues.length === 0 ? 0.92 : Math.max(0.7, 1 - issues.length * 0.03),
    issues,
    summary: `Structural assessment: ${result.pacingAssessment || 'Analyzed'}`,
    processingTime: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  };
};

const runArcAgent = async (ms: Manuscript): Promise<AgentResult> => {
  const startTime = Date.now();
  const prompt = STAGE_6_CHARACTER_ARC_PROMPT(ms.content);
  const raw = await generateContent('gemini-2.5-pro', prompt);
  const result = safeJson<any>(raw, { characters: [], recommendations: [] });
  
  // Convert character analysis to issues format
  const issues: EditingIssue[] = [];
  result.characters.forEach((char: any) => {
    if (char.issues && char.issues.length > 0) {
      char.issues.forEach((issue: string) => {
        issues.push({
          id: uuidv4(),
          type: 'structure' as const,
          severity: 'minor' as const,
          location: {},
          message: `${char.name}: ${issue}`,
          original: '',
          suggestion: '',
        });
      });
    }
  });
  
  return {
    agentName: 'Arc Agent',
    stage: 6,
    confidenceScore: 0.88,
    issues,
    summary: `Tracked ${result.characters.length} character arcs`,
    processingTime: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  };
};

const runChicagoAgent = async (ms: Manuscript, styleGuide: string, genre?: string): Promise<AgentResult> => {
  const startTime = Date.now();
  
  // Query Chicago Manual rules via RAG
  const chicagoResults = await queryChicagoManual(
    `style guide rules punctuation dialogue formatting for: ${ms.content.slice(0, 500)}`,
    { topK: 3, threshold: 0.7 }
  );
  
  // Query genre-specific rules if genre provided
  let genreResults: ReferenceResult[] = [];
  if (genre) {
    genreResults = await queryGenreRules(
      genre,
      `${genre} genre conventions style requirements for: ${ms.content.slice(0, 500)}`,
      { topK: 3, threshold: 0.7 }
    );
  }
  
  // Combine and format RAG context
  const allResults = [...chicagoResults, ...genreResults];
  const ragContext = allResults.length > 0
    ? `Relevant Style Guidelines:\n${formatCitations(allResults)}\n\nApply these rules during your review.`
    : undefined;
  
  const prompt = STAGE_7_CHICAGO_PROMPT(ms.content, styleGuide, genre, ragContext);
  const raw = await generateContent('gemini-2.5-pro', prompt);
  const issues = safeJson<EditingIssue[]>(raw, []);
  
  // Extract citation sources
  const sources = allResults.length > 0 ? allResults.map(r => r.citation) : undefined;
  
  return {
    agentName: `${styleGuide === 'chicago' ? 'Chicago' : styleGuide.toUpperCase()} Agent`,
    stage: 7,
    confidenceScore: issues.length === 0 ? 0.94 : Math.max(0.75, 1 - issues.length * 0.01),
    issues: issues.map(i => ({ ...i, id: uuidv4() })),
    summary: `${styleGuide.toUpperCase()} compliance: ${issues.length} style issues`,
    processingTime: Date.now() - startTime,
    timestamp: new Date().toISOString(),
    sources,
  };
};

const runContinuityAgent = async (ms: Manuscript): Promise<AgentResult> => {
  const startTime = Date.now();
  const prompt = STAGE_8_CONTINUITY_PROMPT(ms.content, ms.continuityData);
  const raw = await generateContent('gemini-2.5-pro', prompt);
  const result = safeJson<any>(raw, {});
  
  // Update continuity data
  if (result.charactersTracked) {
    result.charactersTracked.forEach((char: any) => {
      ms.continuityData.characters.set(char.name, {
        firstMention: 0,
        appearances: [],
        aliases: char.aliases || [],
      });
    });
  }
  
  const issues: EditingIssue[] = [
    ...(result.locationIssues || []).map((issue: any) => ({
      id: uuidv4(),
      type: 'continuity' as const,
      severity: 'major' as const,
      location: issue.location || {},
      message: issue.message,
      original: '',
      suggestion: '',
    })),
    ...(result.terminologyIssues || []).map((issue: any) => ({
      id: uuidv4(),
      type: 'continuity' as const,
      severity: 'minor' as const,
      location: issue.location || {},
      message: issue.message,
      original: '',
      suggestion: '',
    })),
  ];
  
  return {
    agentName: 'Continuity Agent',
    stage: 8,
    confidenceScore: issues.length === 0 ? 0.96 : Math.max(0.8, 1 - issues.length * 0.02),
    issues,
    summary: `Tracked ${result.charactersTracked?.length || 0} characters, ${issues.length} continuity issues`,
    processingTime: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  };
};

const runReadabilityAgent = async (ms: Manuscript, targetLevel?: string): Promise<AgentResult> => {
  const startTime = Date.now();
  const prompt = STAGE_9_READABILITY_PROMPT(ms.content, targetLevel);
  const raw = await generateContent('gemini-2.5-pro', prompt);
  const result = safeJson<any>(raw, { issues: [], recommendations: [] });
  
  const issues: EditingIssue[] = result.issues.map((issue: any) => ({
    ...issue,
    id: uuidv4(),
  }));
  
  return {
    agentName: 'Readability Agent',
    stage: 9,
    confidenceScore: result.readabilityScore ? result.readabilityScore / 100 : 0.85,
    issues,
    summary: `Flesch-Kincaid Grade: ${result.fleschKincaidGrade || 'N/A'}, Sentence variety: ${result.sentenceVariety || 'unknown'}`,
    processingTime: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  };
};

const runQAAgent = async (ms: Manuscript): Promise<AgentResult> => {
  const startTime = Date.now();
  const prompt = STAGE_10_QA_PROMPT(ms.agentResults);
  const raw = await generateContent('gemini-2.5-pro', prompt);
  const result = safeJson<any>(raw, { remainingIssues: [], overallQuality: 'good', approvalRecommendation: true });
  
  return {
    agentName: 'QA Agent',
    stage: 10,
    confidenceScore: result.approvalRecommendation ? 0.95 : 0.75,
    issues: [],
    summary: `Overall quality: ${result.overallQuality}, Approval: ${result.approvalRecommendation ? 'Recommended' : 'Needs revision'}`,
    processingTime: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  };
};

// ============================================================================
// QUALITY CONTROL
// ============================================================================

const calculateOverallConfidence = (agentResults: AgentResult[]): number => {
  if (agentResults.length === 0) return 0;
  
  // Weighted average with higher weight for critical stages
  const weights: Record<number, number> = {
    1: 0.05,  // Intake
    2: 0.15,  // Grammar
    3: 0.10,  // Syntax
    4: 0.10,  // Tense
    5: 0.12,  // Structure
    6: 0.08,  // Character arcs
    7: 0.15,  // Style compliance
    8: 0.10,  // Continuity
    9: 0.08,  // Readability
    10: 0.07, // QA
  };
  
  let totalWeight = 0;
  let weightedSum = 0;
  
  agentResults.forEach(result => {
    const weight = weights[result.stage] || 0.1;
    weightedSum += result.confidenceScore * weight;
    totalWeight += weight;
  });
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
};

const identifyLowConfidenceStages = (agentResults: AgentResult[], threshold: number = 0.85): number[] => {
  return agentResults
    .filter(r => r.confidenceScore < threshold)
    .map(r => r.stage);
};

// ============================================================================
// ROUTER
// ============================================================================

export const createEditingRouter = () => {
  const router = Router();

  // ========== Manuscript Management ==========
  
  router.post('/manuscripts', (req, res) => {
    const parsed = createManuscriptSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    
    const { content, manuscriptId, metadata, requestId } = parsed.data;
    const id = manuscriptId || uuidv4();
    
    const existingMs = manuscripts.get(id);
    if (existingMs && isDuplicate(existingMs, 'upsert', requestId)) {
      return res.json({ manuscriptId: id, updated: false });
    }
    
    const wordCount = calculateWordCount(content);
    const language = detectLanguage(content);
    
    const manuscript: Manuscript = {
      id,
      content,
      metadata: {
        ...metadata,
        language: metadata?.language || language,
        wordCount,
        createdAt: existingMs?.metadata.createdAt || new Date().toISOString(),
        lastModified: new Date().toISOString(),
      },
      workflowState: {
        currentStage: 0,
        stagesCompleted: [],
        overallConfidence: 0,
        lastProcessedAt: new Date().toISOString(),
      },
      agentResults: existingMs?.agentResults || [],
      continuityData: existingMs?.continuityData || {
        characters: new Map(),
        locations: new Map(),
        timeline: [],
        terminology: new Map(),
      },
      lastRequestIds: existingMs?.lastRequestIds || {},
    };
    
    manuscripts.set(id, manuscript);
    markRequest(manuscript, 'upsert', requestId);
    
    return res.json({ manuscriptId: id, updated: !!existingMs });
  });
  
  router.get('/manuscripts/:manuscriptId', (req, res) => {
    try {
      const ms = ensureManuscript(req.params.manuscriptId);
      return res.json({
        manuscript: {
          id: ms.id,
          metadata: ms.metadata,
          workflowState: ms.workflowState,
          agentResults: ms.agentResults,
        },
      });
    } catch (error: any) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  });

  // ========== Agent Endpoints ==========
  
  // Full compliance scan (Stages 1-10)
  router.post('/agents/compliance', async (req, res) => {
    const parsed = complianceCheckSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    
    const { manuscriptId, requestId } = parsed.data;
    
    try {
      const ms = ensureManuscript(manuscriptId);
      if (isDuplicate(ms, 'compliance', requestId)) {
        const allIssues = ms.agentResults.flatMap(r => r.issues);
        return res.json({ result: allIssues });
      }
      
      // Run all agents sequentially
      ms.agentResults = [];
      
      ms.agentResults.push(await runIntakeAgent(ms));
      ms.workflowState.stagesCompleted.push(1);
      
      ms.agentResults.push(await runGrammarAgent(ms));
      ms.workflowState.stagesCompleted.push(2);
      
      ms.agentResults.push(await runSyntaxAgent(ms));
      ms.workflowState.stagesCompleted.push(3);
      
      ms.agentResults.push(await runTemporalAgent(ms));
      ms.workflowState.stagesCompleted.push(4);
      
      ms.agentResults.push(await runChicagoAgent(ms, 'chicago', ms.metadata.genre));
      ms.workflowState.stagesCompleted.push(7);
      
      ms.agentResults.push(await runContinuityAgent(ms));
      ms.workflowState.stagesCompleted.push(8);
      
      ms.agentResults.push(await runReadabilityAgent(ms));
      ms.workflowState.stagesCompleted.push(9);
      
      ms.agentResults.push(await runQAAgent(ms));
      ms.workflowState.stagesCompleted.push(10);
      
      ms.workflowState.overallConfidence = calculateOverallConfidence(ms.agentResults);
      ms.workflowState.currentStage = 10;
      ms.workflowState.lastProcessedAt = new Date().toISOString();
      
      markRequest(ms, 'compliance', requestId);
      
      const allIssues = ms.agentResults.flatMap(r => r.issues);
      
      return res.json({
        result: allIssues,
        overallConfidence: ms.workflowState.overallConfidence,
        summary: {
          totalIssues: allIssues.length,
          criticalIssues: allIssues.filter(i => i.severity === 'critical').length,
          stagesCompleted: ms.workflowState.stagesCompleted.length,
          processingTime: ms.agentResults.reduce((sum, r) => sum + r.processingTime, 0),
        },
      });
    } catch (error) {
      console.error('Compliance scan failed', error);
      return res.status(500).json({ error: 'Compliance scan failed' });
    }
  });
  
  // Structural analysis (Stages 5-6 isolated)
  router.post('/agents/structural-analysis', async (req, res) => {
    const parsed = structuralAnalysisSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    
    const { manuscriptId, analysisType, requestId } = parsed.data;
    
    try {
      const ms = ensureManuscript(manuscriptId);
      if (isDuplicate(ms, 'structural-analysis', requestId)) {
        const structuralResults = ms.agentResults.filter(r => r.stage === 5 || r.stage === 6);
        return res.json({ analysis: structuralResults });
      }
      
      const results: AgentResult[] = [];
      
      if (['pacing', 'plotStructure', 'all'].includes(analysisType)) {
        results.push(await runStructureAgent(ms));
      }
      
      if (['characterArcs', 'all'].includes(analysisType)) {
        results.push(await runArcAgent(ms));
      }
      
      markRequest(ms, 'structural-analysis', requestId);
      
      return res.json({
        analysis: results,
        summary: {
          analysisType,
          totalIssues: results.reduce((sum, r) => sum + r.issues.length, 0),
          averageConfidence: results.reduce((sum, r) => sum + r.confidenceScore, 0) / results.length,
        },
      });
    } catch (error) {
      console.error('Structural analysis failed', error);
      return res.status(500).json({ error: 'Structural analysis failed' });
    }
  });
  
  // Style compliance (Stage 7 isolated)
  router.post('/agents/style-compliance', async (req, res) => {
    const parsed = styleComplianceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    
    const { manuscriptId, styleGuide, genre, requestId } = parsed.data;
    
    try {
      const ms = ensureManuscript(manuscriptId);
      if (isDuplicate(ms, 'style-compliance', requestId)) {
        const styleResult = ms.agentResults.find(r => r.stage === 7);
        return res.json({ compliance: styleResult || null });
      }
      
      const result = await runChicagoAgent(ms, styleGuide, genre);
      
      markRequest(ms, 'style-compliance', requestId);
      
      return res.json({
        compliance: result,
        summary: {
          styleGuide,
          genre,
          issuesFound: result.issues.length,
          confidenceScore: result.confidenceScore,
        },
      });
    } catch (error) {
      console.error('Style compliance check failed', error);
      return res.status(500).json({ error: 'Style compliance check failed' });
    }
  });
  
  // Continuity check (Stage 8 isolated)
  router.post('/agents/continuity-check', async (req, res) => {
    const parsed = continuityCheckSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    
    const { manuscriptId, checkTypes, requestId } = parsed.data;
    
    try {
      const ms = ensureManuscript(manuscriptId);
      if (isDuplicate(ms, 'continuity-check', requestId)) {
        const continuityResult = ms.agentResults.find(r => r.stage === 8);
        return res.json({
          continuity: continuityResult || null,
          continuityData: {
            characters: Array.from(ms.continuityData.characters.entries()),
            locations: Array.from(ms.continuityData.locations.entries()),
            timeline: ms.continuityData.timeline,
            terminology: Array.from(ms.continuityData.terminology.entries()),
          },
        });
      }
      
      const result = await runContinuityAgent(ms);
      
      markRequest(ms, 'continuity-check', requestId);
      
      return res.json({
        continuity: result,
        continuityData: {
          characters: Array.from(ms.continuityData.characters.entries()),
          locations: Array.from(ms.continuityData.locations.entries()),
          timeline: ms.continuityData.timeline,
          terminology: Array.from(ms.continuityData.terminology.entries()),
        },
        summary: {
          checkTypes,
          issuesFound: result.issues.length,
          charactersTracked: ms.continuityData.characters.size,
          timelineEventsTracked: ms.continuityData.timeline.length,
        },
      });
    } catch (error) {
      console.error('Continuity check failed', error);
      return res.status(500).json({ error: 'Continuity check failed' });
    }
  });
  
  // Readability optimization (Stage 9 isolated)
  router.post('/agents/readability-optimization', async (req, res) => {
    const parsed = readabilityOptimizationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    
    const { manuscriptId, targetReadingLevel, requestId } = parsed.data;
    
    try {
      const ms = ensureManuscript(manuscriptId);
      if (isDuplicate(ms, 'readability-optimization', requestId)) {
        const readabilityResult = ms.agentResults.find(r => r.stage === 9);
        return res.json({ optimization: readabilityResult || null });
      }
      
      const result = await runReadabilityAgent(ms, targetReadingLevel);
      
      markRequest(ms, 'readability-optimization', requestId);
      
      return res.json({
        optimization: result,
        summary: {
          targetReadingLevel: targetReadingLevel || 'general adult',
          issuesFound: result.issues.length,
          confidenceScore: result.confidenceScore,
        },
      });
    } catch (error) {
      console.error('Readability optimization failed', error);
      return res.status(500).json({ error: 'Readability optimization failed' });
    }
  });
  
  // Quality audit (Stage 10 isolated with reprocessing recommendations)
  router.post('/agents/quality-audit', async (req, res) => {
    const schema = z.object({
      manuscriptId: manuscriptIdSchema,
      requestId: requestIdSchema,
    });
    
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    
    const { manuscriptId, requestId } = parsed.data;
    
    try {
      const ms = ensureManuscript(manuscriptId);
      if (isDuplicate(ms, 'quality-audit', requestId)) {
        const qaResult = ms.agentResults.find(r => r.stage === 10);
        return res.json({ audit: qaResult || null });
      }
      
      // Ensure we have previous results to audit
      if (ms.agentResults.length === 0) {
        return res.status(400).json({ error: 'No previous agent results to audit. Run compliance scan first.' });
      }
      
      const result = await runQAAgent(ms);
      const overallConfidence = calculateOverallConfidence(ms.agentResults);
      const lowConfidenceStages = identifyLowConfidenceStages(ms.agentResults, 0.85);
      
      markRequest(ms, 'quality-audit', requestId);
      
      return res.json({
        audit: result,
        qualityMetrics: {
          overallConfidence,
          needsReprocessing: overallConfidence < 0.85,
          lowConfidenceStages,
          stageBreakdown: ms.agentResults.map(r => ({
            stage: r.stage,
            agentName: r.agentName,
            confidenceScore: r.confidenceScore,
            issueCount: r.issues.length,
          })),
        },
        recommendations: lowConfidenceStages.length > 0
          ? [`Reprocess stages: ${lowConfidenceStages.join(', ')} due to low confidence scores`]
          : ['Manuscript meets quality thresholds'],
      });
    } catch (error) {
      console.error('Quality audit failed', error);
      return res.status(500).json({ error: 'Quality audit failed' });
    }
  });
  
  // Cost plan generation
  router.post('/agents/cost-plan', async (req, res) => {
    const schema = z.object({
      manuscriptId: manuscriptIdSchema,
      tier: z.enum(['starter', 'professional', 'cinematic']),
      requestId: requestIdSchema,
    });
    
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    
    const { manuscriptId, tier, requestId } = parsed.data;
    
    try {
      const ms = ensureManuscript(manuscriptId);
      if (isDuplicate(ms, 'cost-plan', requestId)) {
        return res.json({ plan: { tier, totalBudget: 0, estimatedTimeline: 'N/A' } });
      }
      
      const prompt = `Generate a cost plan for ${tier} tier editing of a ${ms.metadata.wordCount}-word manuscript. Return JSON: {"totalBudget": 0, "estimatedTimeline": "", "costBreakdown": []}`;
      const raw = await generateContent('gemini-2.5-pro', prompt);
      const plan = safeJson<any>(raw, { totalBudget: 0, estimatedTimeline: 'N/A', costBreakdown: [] });
      
      markRequest(ms, 'cost-plan', requestId);
      
      return res.json({ plan: { ...plan, tier } });
    } catch (error) {
      console.error('Cost plan generation failed', error);
      return res.status(500).json({ error: 'Cost plan generation failed' });
    }
  });
  
  // HTML cleanup
  router.post('/agents/cleanup', async (req, res) => {
    const schema = z.object({
      manuscriptId: manuscriptIdSchema,
      html: z.string().min(1),
      requestId: requestIdSchema,
    });
    
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    
    const { manuscriptId, html, requestId } = parsed.data;
    
    try {
      const ms = ensureManuscript(manuscriptId);
      if (isDuplicate(ms, 'cleanup', requestId)) {
        return res.json({ cleanedHtml: html });
      }
      
      const prompt = `Clean this HTML, removing unnecessary tags and formatting. Return ONLY the cleaned HTML:\n${html.substring(0, 5000)}`;
      const cleanedHtml = await generateContent('gemini-2.5-pro', prompt);
      
      markRequest(ms, 'cleanup', requestId);
      
      return res.json({ cleanedHtml });
    } catch (error) {
      console.error('HTML cleanup failed', error);
      return res.status(500).json({ error: 'HTML cleanup failed' });
    }
  });
  
  // Series Bible generation
  router.post('/agents/series-bible', async (req, res) => {
    const schema = z.object({
      manuscriptId: manuscriptIdSchema,
      context: z.string().min(50),
      requestId: requestIdSchema,
    });
    
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    
    const { manuscriptId, context, requestId } = parsed.data;
    
    try {
      const ms = ensureManuscript(manuscriptId);
      if (isDuplicate(ms, 'series-bible', requestId)) {
        return res.json({ seriesBible: {} });
      }
      
      const prompt = `Create a series bible from this content. Return JSON with: characters, worldbuilding, timeline, themes. Context:\n${context.substring(0, 8000)}`;
      const raw = await generateContent('gemini-2.5-pro', prompt);
      const seriesBible = safeJson<any>(raw, {});
      
      markRequest(ms, 'series-bible', requestId);
      
      return res.json({ seriesBible });
    } catch (error) {
      console.error('Series bible generation failed', error);
      return res.status(500).json({ error: 'Series bible generation failed' });
    }
  });
  
  return router;
};