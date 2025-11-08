import { Router } from 'express';
import { z } from 'zod';
import { generateContent } from '../services/genai';

const complianceSchema = z.object({ manuscript: z.string().min(50) });
const costPlanSchema = z.object({ manuscript: z.string().min(50), tier: z.string().min(3) });
const scenarioSchema = z.object({ manuscript: z.string().min(50), priority: z.enum(['speed', 'reach', 'budget']) });

const compliancePrompt = (text: string) => `Act as an IP and content compliance reviewer for publishing. Analyze the manuscript excerpt and flag potential issues (copyrighted references, trademark usage, culturally sensitive terms, or style guide conflicts). Return JSON with entries {"id","category","severity","excerpt","guidance"}.
TEXT:
${text.substring(0, 6000)}
`;

const costPlanPrompt = (text: string, tier: string) => `Estimate a production cost plan for the manuscript excerpt below. Assume audiobook, illustration, and marketing deliverables using the '${tier}' tier. Respond with JSON {"tier","totalBudget","estimatedTimeline","summary","costBreakdown":[{"label","amount"}],"notes":["..."]}.
TEXT:
${text.substring(0, 4000)}
`;

const scenarioPrompt = (text: string, priority: string) => `You are a publishing operations strategist. Using the manuscript excerpt below, generate three launch scenarios optimized for ${priority}. Each object must contain {"name","summary","tradeoffs":[...],"metrics":{"timeToMarket","budgetImpact","expectedReach"},"recommendations":[...] }.
TEXT:
${text.substring(0, 4500)}
`;

export const createAiRouter = () => {
  const router = Router();

  router.post('/ai/compliance', async (req, res) => {
    const parsed = complianceSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    try {
      const response = await generateContent('gemini-2.5-pro', compliancePrompt(parsed.data.manuscript));
      res.json({ issues: JSON.parse(response || '[]') });
    } catch (error) {
      console.error('Compliance scan failed', error);
      res.status(500).json({ error: 'Compliance scan failed.' });
    }
  });

  router.post('/ai/cost-plan', async (req, res) => {
    const parsed = costPlanSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    try {
      const response = await generateContent('gemini-2.5-pro', costPlanPrompt(parsed.data.manuscript, parsed.data.tier));
      res.json({ plan: JSON.parse(response || '{}') });
    } catch (error) {
      console.error('Cost plan failed', error);
      res.status(500).json({ error: 'Cost planning failed.' });
    }
  });

  router.post('/ai/scenario', async (req, res) => {
    const parsed = scenarioSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    try {
      const response = await generateContent('gemini-2.5-pro', scenarioPrompt(parsed.data.manuscript, parsed.data.priority));
      res.json({ scenarios: JSON.parse(response || '[]') });
    } catch (error) {
      console.error('Scenario simulation failed', error);
      res.status(500).json({ error: 'Scenario simulation failed.' });
    }
  });

  return router;
};
