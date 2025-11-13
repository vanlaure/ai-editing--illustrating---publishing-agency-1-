import { Router } from 'express';
import { z } from 'zod';
import { generateContent } from '../services/genai';
import { v4 as uuidv4 } from 'uuid';

// Marketing & Growth Agency
// Focus: campaigns, creative assets, scenarios, analytics-friendly summaries.

// Schemas
const requestIdSchema = z.string().min(6);
const packageIdSchema = z.string().min(1);

const createCampaignSchema = z.object({
  packageId: packageIdSchema,
  goal: z.enum(['launch', 'evergreen', 'relaunch']).default('launch'),
  budgetLevel: z.enum(['lean', 'standard', 'aggressive']).default('standard'),
  requestId: requestIdSchema,
});

const creativeAssetsSchema = z.object({
  campaignId: z.string().min(1),
  channels: z
    .array(
      z.enum([
        'email',
        'twitter',
        'tiktok',
        'instagram',
        'facebook',
        'youtube',
        'blog',
      ]),
    )
    .min(1),
  requestId: requestIdSchema,
});

const scenariosSchema = z.object({
  packageId: packageIdSchema,
  priority: z.enum(['speed', 'reach', 'budget']),
  requestId: requestIdSchema,
});

const analyticsSchema = z.object({
  // Snapshot of telemetry or metrics pushed from frontend/other services
  events: z
    .array(
      z.object({
        category: z.string(),
        metric: z.string(),
        value: z.number(),
      }),
    )
    .min(1),
});

// Types
type Scenario = {
  name: string;
  summary: string;
  tradeoffs: string[];
  metrics: {
    timeToMarket: string;
    budgetImpact: string;
    expectedReach: string;
  };
  recommendations: string[];
};

type CreativeAsset = {
  id: string;
  channel: string;
  type: string;
  title: string;
  content: string;
};

type Campaign = {
  id: string;
  packageId: string;
  goal: string;
  budgetLevel: string;
  createdAt: string;
  strategySummary: string;
  heroHooks: string[];
  funnelOutline: string[];
  assets: CreativeAsset[];
  lastRequestIds: Record<string, string>;
};

type AnalyticsSummary = {
  id: string;
  createdAt: string;
  highlights: string[];
  recommendations: string[];
};

// In-memory store
const campaigns = new Map<string, Campaign>();
const analyticsSummaries: AnalyticsSummary[] = [];

// Helpers
const ensureCampaign = (id: string): Campaign => {
  const c = campaigns.get(id);
  if (!c) {
    const error: any = new Error('Campaign not found');
    error.status = 404;
    throw error;
  }
  return c;
};

const isDuplicate = (entity: { lastRequestIds: Record<string, string> }, key: string, requestId: string) =>
  entity.lastRequestIds[key] === requestId;

const markRequest = (entity: { lastRequestIds: Record<string, string> }, key: string, requestId: string) => {
  entity.lastRequestIds[key] = requestId;
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

// Prompt helpers
const campaignPrompt = (goal: string, budgetLevel: string) => `
You are a book launch marketing strategist.
Design a strategy for goal "${goal}" with budget level "${budgetLevel}".
Return ONLY JSON:
{
  "strategySummary": "",
  "heroHooks": ["..."],
  "funnelOutline": ["Top-of-funnel step","Mid-funnel step","Bottom-funnel step"]
}
`;

const creativePrompt = (channels: string[], campaign: Campaign) => `
You are a creative director generating assets for a book campaign.
Channels: ${channels.join(', ')}.
Use this context:
Strategy: ${campaign.strategySummary}
Hooks: ${campaign.heroHooks.join(' | ')}
Return ONLY JSON array:
[
  {
    "channel":"tiktok",
    "type":"short-form-script",
    "title":"...",
    "content":"..."
  }
]
`;

const scenariosPrompt = (priority: string) => `
You are a publishing strategist.
Generate three launch scenarios optimized for "${priority}".
Return ONLY JSON array:
[
  {
    "name":"",
    "summary":"",
    "tradeoffs":[""],
    "metrics":{
      "timeToMarket":"",
      "budgetImpact":"",
      "expectedReach":""
    },
    "recommendations":[""]
  }
]
`;

const analyticsPrompt = (events: { category: string; metric: string; value: number }[]) => `
You are a growth analyst.
Given these metrics:
${JSON.stringify(events)}
Return ONLY JSON:
{
  "highlights":["..."],
  "recommendations":["..."]
}
`;

// Router
export const createMarketingRouter = () => {
  const router = Router();

  // Create campaign (bound to publishing package)
  router.post('/campaigns', async (req, res) => {
    const parsed = createCampaignSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { packageId, goal, budgetLevel, requestId } = parsed.data;

    const id = uuidv4();

    // Generate initial strategy server-side
    try {
      const raw = await generateContent('gemini-2.5-pro', campaignPrompt(goal, budgetLevel));
      const strategy = safeJson<{
        strategySummary?: string;
        heroHooks?: string[];
        funnelOutline?: string[];
      }>(raw, {});

      const campaign: Campaign = {
        id,
        packageId,
        goal,
        budgetLevel,
        createdAt: new Date().toISOString(),
        strategySummary: strategy.strategySummary || 'No summary provided.',
        heroHooks: strategy.heroHooks || [],
        funnelOutline: strategy.funnelOutline || [],
        assets: [],
        lastRequestIds: { create: requestId },
      };

      campaigns.set(id, campaign);

      return res.json({ campaignId: id, strategySummary: campaign.strategySummary, heroHooks: campaign.heroHooks, funnelOutline: campaign.funnelOutline });
    } catch (error) {
      console.error('Campaign creation failed', error);
      return res.status(500).json({ error: 'Failed to generate campaign strategy.' });
    }
  });

  // Get campaign snapshot
  router.get('/campaigns/:campaignId', (req, res) => {
    try {
      const campaign = ensureCampaign(req.params.campaignId);
      return res.json({ campaign });
    } catch (error: any) {
      return res.status(error.status || 500).json({ error: error.message || 'Failed to load campaign.' });
    }
  });

  // Generate creative assets for specified channels
  router.post('/campaigns/assets', async (req, res) => {
    const parsed = creativeAssetsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { campaignId, channels, requestId } = parsed.data;
    try {
      const campaign = ensureCampaign(campaignId);
      if (isDuplicate(campaign, `assets-${channels.sort().join('-')}`, requestId)) {
        return res.json({ campaignId, assets: campaign.assets });
      }

      const raw = await generateContent('gemini-2.5-pro', creativePrompt(channels, campaign));
      const list = safeJson<
        {
          channel: string;
          type: string;
          title: string;
          content: string;
        }[]
      >(raw, []);

      const assets: CreativeAsset[] = list.map((a) => ({
        id: uuidv4(),
        channel: a.channel,
        type: a.type,
        title: a.title,
        content: a.content,
      }));

      campaign.assets.push(...assets);
      markRequest(campaign, `assets-${channels.sort().join('-')}`, requestId);

      return res.json({ campaignId, assets });
    } catch (error) {
      console.error('Creative assets generation failed', error);
      return res.status(500).json({ error: 'Failed to generate creative assets.' });
    }
  });

  // Launch scenarios (cross-agency planning)
  router.post('/scenarios', async (req, res) => {
    const parsed = scenariosSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { priority } = parsed.data;
    try {
      const raw = await generateContent('gemini-2.5-pro', scenariosPrompt(priority));
      const scenarios = safeJson<Scenario[]>(raw, []);
      return res.json({ scenarios });
    } catch (error) {
      console.error('Scenario generation failed', error);
      return res.status(500).json({ error: 'Failed to generate scenarios.' });
    }
  });

  // Analytics summaries
  router.post('/analytics/summary', async (req, res) => {
    const parsed = analyticsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    try {
      // parsed.data.events is fully typed; cast explicitly for analyticsPrompt
      const raw = await generateContent(
        'gemini-2.5-pro',
        analyticsPrompt(parsed.data.events as { category: string; metric: string; value: number }[]),
      );
      const summary = safeJson<{ highlights?: string[]; recommendations?: string[] }>(raw, {});
      const record: AnalyticsSummary = {
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        highlights: summary.highlights || [],
        recommendations: summary.recommendations || [],
      };
      analyticsSummaries.unshift(record);
      return res.json({ summary: record });
    } catch (error) {
      console.error('Analytics summary failed', error);
      return res.status(500).json({ error: 'Failed to generate analytics summary.' });
    }
  });

  // Get recent analytics summaries
  router.get('/analytics/summary', (_req, res) => {
    return res.json({ summaries: analyticsSummaries.slice(0, 20) });
  });

  return router;
};