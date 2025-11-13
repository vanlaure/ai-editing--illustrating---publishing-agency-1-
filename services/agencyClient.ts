import { v4 as uuidv4 } from 'uuid';
import type {
  GrammarIssue,
  CostPlan,
  LaunchScenario,
} from '../types';

// Unified thin client for the 4-Agency backend.
// Frontend components should depend on this instead of calling models directly.

// Helpers
const rid = () => uuidv4();

// Project-aware wrapper: always include activeProjectId when present.
const withProject = (body: Record<string, unknown>, projectId?: string) =>
  projectId ? { ...body, projectId } : body;

 // Manuscript Editing Agency
 // Stable, typed client for /editing endpoints.
 // Per checklist: methods are strongly typed and use a shared HTTP helper.
export const EditingAgency = {
  async upsertManuscript(
    content: string,
    manuscriptId?: string,
    projectId?: string,
  ): Promise<{ manuscriptId: string; updated: boolean }> {
    return editingPost<{ manuscriptId: string; updated: boolean }>('/manuscripts', withProject({
      manuscriptId,
      content,
      requestId: rid(),
    }, projectId));
  },

  async runCompliance(manuscriptId: string, projectId?: string): Promise<GrammarIssue[]> {
    const data = await editingPost<{ result?: GrammarIssue[] }>(
      '/agents/compliance',
      withProject({ manuscriptId, requestId: rid() }, projectId),
    );
    return data.result || [];
  },

  async generateCostPlan(
    manuscriptId: string,
    tier: 'starter' | 'professional' | 'cinematic',
    projectId?: string,
  ): Promise<CostPlan> {
    const data = await editingPost<{ plan: CostPlan }>(
      '/agents/cost-plan',
      withProject({ manuscriptId, tier, requestId: rid() }, projectId),
    );
    return data.plan;
  },

  async cleanupHtml(manuscriptId: string, html: string, projectId?: string): Promise<{ cleanedHtml: string }> {
    return editingPost<{ cleanedHtml: string }>(
      '/agents/cleanup',
      withProject({ manuscriptId, html, requestId: rid() }, projectId),
    );
  },

  async seriesBible(manuscriptId: string, context: string, projectId?: string): Promise<{ seriesBible: unknown }> {
    return editingPost<{ seriesBible: unknown }>(
      '/agents/series-bible',
      withProject({ manuscriptId, context, requestId: rid() }, projectId),
    );
  },

  async runStructuralAnalysis(
    manuscriptId: string,
    analysisType: 'pacing' | 'characterArcs' | 'plotStructure' | 'all' = 'all',
    projectId?: string,
  ): Promise<{
    analysis: Array<{
      stage: number;
      agentName: string;
      issues: Array<{ type: string; description: string; location?: string; severity: string }>;
      confidenceScore: number;
      summary?: string;
    }>;
    summary: {
      analysisType: string;
      totalIssues: number;
      averageConfidence: number;
    };
  }> {
    return editingPost(
      '/agents/structural-analysis',
      withProject({ manuscriptId, analysisType, requestId: rid() }, projectId),
    );
  },

  async checkStyleCompliance(
    manuscriptId: string,
    styleGuide: 'chicago' | 'mla' | 'apa' | 'genre-specific' = 'chicago',
    genre?: string,
    projectId?: string,
  ): Promise<{
    compliance: {
      stage: number;
      agentName: string;
      issues: Array<{ type: string; description: string; location?: string; severity: string }>;
      confidenceScore: number;
      summary?: string;
    };
    summary: {
      styleGuide: string;
      genre?: string;
      issuesFound: number;
      confidenceScore: number;
    };
  }> {
    return editingPost(
      '/agents/style-compliance',
      withProject({ manuscriptId, styleGuide, genre, requestId: rid() }, projectId),
    );
  },

  async checkContinuity(
    manuscriptId: string,
    checkTypes: string[] = ['characters', 'timeline'],
    projectId?: string,
  ): Promise<{
    continuity: {
      stage: number;
      agentName: string;
      issues: Array<{ type: string; description: string; location?: string; severity: string }>;
      confidenceScore: number;
      summary?: string;
    };
    continuityData: {
      characters: Array<[string, { aliases: string[]; firstMention: string; lastMention: string }]>;
      locations: Array<[string, { firstMention: string; lastMention: string }]>;
      timeline: Array<{ event: string; chapter: string; timestamp?: string }>;
      terminology: Array<[string, { definition: string; usageCount: number }]>;
    };
    summary: {
      checkTypes: string[];
      issuesFound: number;
      charactersTracked: number;
      timelineEventsTracked: number;
    };
  }> {
    return editingPost(
      '/agents/continuity-check',
      withProject({ manuscriptId, checkTypes, requestId: rid() }, projectId),
    );
  },

  async optimizeReadability(
    manuscriptId: string,
    targetReadingLevel?: 'elementary' | 'middle-school' | 'high-school' | 'college' | 'professional',
    projectId?: string,
  ): Promise<{
    optimization: {
      stage: number;
      agentName: string;
      issues: Array<{ type: string; description: string; location?: string; severity: string }>;
      confidenceScore: number;
      summary?: string;
    };
    summary: {
      targetReadingLevel: string;
      issuesFound: number;
      confidenceScore: number;
    };
  }> {
    return editingPost(
      '/agents/readability-optimization',
      withProject({ manuscriptId, targetReadingLevel, requestId: rid() }, projectId),
    );
  },

  async runQualityAudit(
    manuscriptId: string,
    projectId?: string,
  ): Promise<{
    audit: {
      stage: number;
      agentName: string;
      issues: Array<{ type: string; description: string; location?: string; severity: string }>;
      confidenceScore: number;
      summary?: string;
    };
    qualityMetrics: {
      overallConfidence: number;
      needsReprocessing: boolean;
      lowConfidenceStages: number[];
      stageBreakdown: Array<{
        stage: number;
        agentName: string;
        confidenceScore: number;
        issueCount: number;
      }>;
    };
    recommendations: string[];
  }> {
    return editingPost(
      '/agents/quality-audit',
      withProject({ manuscriptId, requestId: rid() }, projectId),
    );
  },
};

 // Illustration, Publishing, Marketing agency clients are experimental and not used by current flows.
 // Keep them defined for future work but make them fail-fast to avoid accidental reliance.

// Illustration & Design Studio Agency
// Aligned with backend routes in server/src/agencies/illustration.ts
export const IllustrationAgency = {
  async createProject(input: {
    manuscriptId?: string;
    label: string;
    projectId?: string;
  }): Promise<{ projectId: string }> {
    return illustrationPost<{ projectId: string }>('/projects', withProject(
      { manuscriptId: input.manuscriptId, label: input.label, requestId: rid() },
      input.projectId,
    ));
  },

  async seedFromManuscript(input: {
    projectId: string;
    manuscript: string;
  }): Promise<{ projectId: string; charactersSeeded: number; scenesSeeded: number; styleGuideCreated: boolean }> {
    return illustrationPost<{ projectId: string; charactersSeeded: number; scenesSeeded: number; styleGuideCreated: boolean }>(
      '/projects/seed-from-manuscript',
      { ...input, requestId: rid() },
    );
  },

  async generateMoodboard(input: {
    projectId: string;
    text: string;
  }): Promise<{ projectId: string; tiles: { id: string; prompt: string; imageHint: string }[] }> {
    return illustrationPost<{ projectId: string; tiles: { id: string; prompt: string; imageHint: string }[] }>(
      '/projects/moodboard',
      { ...input, requestId: rid() },
    );
  },

  async generateCharacterConcepts(input: {
    projectId: string;
    name: string;
    description: string;
  }): Promise<{ projectId: string; concept: { id: string; name: string; description: string; prompts: string[] } }> {
    return illustrationPost<{ projectId: string; concept: { id: string; name: string; description: string; prompts: string[] } }>(
      '/projects/characters/concepts',
      { ...input, requestId: rid() },
    );
  },

  async generateScene(input: {
    projectId: string;
    title: string;
    description: string;
    sceneType: 'interior' | 'exterior' | 'establishing' | 'action' | 'intimate' | 'other';
  }): Promise<{ projectId: string; scene: { id: string; title: string; description: string; sceneType: string; prompt: string } }> {
    return illustrationPost<{ projectId: string; scene: { id: string; title: string; description: string; sceneType: string; prompt: string } }>(
      '/projects/scenes',
      { ...input, requestId: rid() },
    );
  },

  async generateStyleGuide(input: {
    projectId: string;
    artStyle: string;
    lighting: string;
    linework: string;
    notes: string;
  }): Promise<{ projectId: string; styleGuide: { id: string; artStyle: string; lighting: string; linework: string; notes: string } }> {
    return illustrationPost<{ projectId: string; styleGuide: { id: string; artStyle: string; lighting: string; linework: string; notes: string } }>(
      '/projects/style-guide',
      { ...input, requestId: rid() },
    );
  },

  async generateCoverBrief(input: {
    projectId: string;
    prompt: string;
  }): Promise<{ projectId: string; cover: { id: string; prompt: string; notes: string } }> {
    return illustrationPost<{ projectId: string; cover: { id: string; prompt: string; notes: string } }>(
      '/projects/covers',
      { ...input, requestId: rid() },
    );
  },
};

// Publishing & Production Agency
// Aligned with backend routes in server/src/agencies/publishing.ts
export const PublishingAgency = {
  async createPackage(input: {
    manuscriptId: string;
    illustrationProjectId?: string;
    label: string;
  }): Promise<{ packageId: string }> {
    return publishingPost<{ packageId: string }>(
      '/packages',
      { ...input, requestId: rid() },
    );
  },

  async generateExports(input: {
    packageId: string;
    formats: ('txt' | 'html')[];
    manuscript: string;
  }): Promise<{ packageId: string; export: { id: string; formats: ('txt' | 'html')[]; assets: { format: string; url: string }[]; createdAt: string } }> {
    return publishingPost<{ packageId: string; export: { id: string; formats: ('txt' | 'html')[]; assets: { format: string; url: string }[]; createdAt: string } }>(
      '/packages/exports',
      { ...input, requestId: rid() },
    );
  },

  async generateLocalization(input: {
    packageId: string;
    locales: string[];
    manuscript: string;
  }): Promise<{ packageId: string; localizations: { locale: string; title: string; blurb: string; keywords: string[] }[] }> {
    return publishingPost<{ packageId: string; localizations: { locale: string; title: string; blurb: string; keywords: string[] }[] }>(
      '/packages/localization',
      { ...input, requestId: rid() },
    );
  },

  async generateMetadata(input: {
    packageId: string;
    manuscript: string;
    genre?: string;
    audience?: string;
  }): Promise<{ packageId: string; metadata: { title: string; subtitle?: string; blurb: string; keywords: string[]; bisac: string[]; audience: string } }> {
    return publishingPost<{ packageId: string; metadata: { title: string; subtitle?: string; blurb: string; keywords: string[]; bisac: string[]; audience: string } }>(
      '/packages/metadata',
      { ...input, requestId: rid() },
    );
  },

  async generateCostPlan(input: {
    packageId: string;
    manuscript: string;
    tier: 'starter' | 'professional' | 'cinematic';
  }): Promise<{ packageId: string; plan: { tier: string; totalBudget: number; estimatedTimeline: string; summary: string; costBreakdown: { label: string; amount: number }[]; notes: string[] } }> {
    return publishingPost<{ packageId: string; plan: { tier: string; totalBudget: number; estimatedTimeline: string; summary: string; costBreakdown: { label: string; amount: number }[]; notes: string[] } }>(
      '/packages/cost-plan',
      { ...input, requestId: rid() },
    );
  },

  async generateSubmission(input: {
    packageId: string;
    retailer: 'KDP' | 'IngramSpark' | 'Draft2Digital' | 'Kobo' | 'AppleBooks' | 'GooglePlayBooks' | 'Audible' | 'ACX';
  }): Promise<{ packageId: string; submission: { id: string; retailer: string; generatedAt: string; assets: { label: string; status: 'ready' | 'pending' }[]; priorityNotes: string } }> {
    return publishingPost<{ packageId: string; submission: { id: string; retailer: string; generatedAt: string; assets: { label: string; status: 'ready' | 'pending' }[]; priorityNotes: string } }>(
      '/packages/submissions',
      { ...input, requestId: rid() },
    );
  },
};

// Marketing & Growth Agency
// Aligned with backend routes in server/src/agencies/marketing.ts
export const MarketingAgency = {
  async createCampaign(input: {
    packageId: string;
    goal: 'launch' | 'evergreen' | 'relaunch';
    budgetLevel: 'lean' | 'standard' | 'aggressive';
  }): Promise<{ campaignId: string; strategySummary: string; heroHooks: string[]; funnelOutline: string[] }> {
    return marketingPost<{ campaignId: string; strategySummary: string; heroHooks: string[]; funnelOutline: string[] }>(
      '/campaigns',
      { ...input, requestId: rid() },
    );
  },

  async generateCampaignAssets(input: {
    campaignId: string;
    channels: ('email' | 'twitter' | 'tiktok' | 'instagram' | 'facebook' | 'youtube' | 'blog')[];
  }): Promise<{ campaignId: string; assets: { id: string; channel: string; type: string; title: string; content: string }[] }> {
    return marketingPost<{ campaignId: string; assets: { id: string; channel: string; type: string; title: string; content: string }[] }>(
      '/campaigns/assets',
      { ...input, requestId: rid() },
    );
  },

  async generateScenarios(input: {
    packageId: string;
    priority: 'speed' | 'reach' | 'budget';
  }): Promise<{ scenarios: { name: string; summary: string; tradeoffs: string[]; metrics: { timeToMarket: string; budgetImpact: string; expectedReach: string }; recommendations: string[] }[] }> {
    return marketingPost<{ scenarios: { name: string; summary: string; tradeoffs: string[]; metrics: { timeToMarket: string; budgetImpact: string; expectedReach: string }; recommendations: string[] }[] }>(
      '/scenarios',
      { ...input, requestId: rid() },
    );
  },

  async summarizeAnalytics(input: {
    events: { category: string; metric: string; value: number }[];
  }): Promise<{ summary: { id: string; createdAt: string; highlights: string[]; recommendations: string[] } }> {
    return marketingPost<{ summary: { id: string; createdAt: string; highlights: string[]; recommendations: string[] } }>(
      '/analytics/summary',
      input,
    );
  },
};
 
// Shared helper for EditingAgency to call backend /editing endpoints consistently.
// This centralizes error handling and keeps strong typing at the boundary.
async function editingPost<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(`/api/editing${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error((error as any).error || `Request to /api/editing${path} failed`);
  }

  return (response.json() as Promise<T>);
}

// Shared helper for IllustrationAgency
 async function illustrationPost<T>(
   path: string,
   body: Record<string, unknown>,
 ): Promise<T> {
   const response = await fetch(`/api/illustration${path}`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(body),
   });
 
   if (!response.ok) {
     const error = await response.json().catch(() => ({}));
     throw new Error((error as any).error || `Request to /api/illustration${path} failed`);
   }
 
   return (response.json() as Promise<T>);
 }
 
 // Shared helper for PublishingAgency
 async function publishingPost<T>(
   path: string,
   body: Record<string, unknown>,
 ): Promise<T> {
   const response = await fetch(`/api/publishing${path}`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(body),
   });
 
   if (!response.ok) {
     const error = await response.json().catch(() => ({}));
     throw new Error((error as any).error || `Request to /api/publishing${path} failed`);
   }
 
   return (response.json() as Promise<T>);
 }
 
 // Shared helper for MarketingAgency
 async function marketingPost<T>(
   path: string,
   body: Record<string, unknown>,
 ): Promise<T> {
   const response = await fetch(`/api/marketing${path}`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(body),
   });
 
   if (!response.ok) {
     const error = await response.json().catch(() => ({}));
     throw new Error((error as any).error || `Request to /api/marketing${path} failed`);
   }
 
   return (response.json() as Promise<T>);
 }
