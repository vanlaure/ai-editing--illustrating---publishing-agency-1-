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

  router.post('/world/extract', async (req, res) => {
    const schema = z.object({
      context: z.string().min(200, 'Provide at least a few hundred characters of context to extract a Series Bible.'),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.flatten() });
    }

    const { context } = parsed.data;

    const prompt = `
You are a senior fiction development editor and continuity specialist.

You will be given long-form narrative context from one or more books in a series.
Your task is to extract a clean, compact "Series Bible" as STRICT JSON.

Rules:
- Output ONLY valid JSON. No markdown, no comments, no explanations.
- Do not invent details; only include what is strongly implied or stated.
- Deduplicate entries (same character/place/item should appear once with merged notes).
- Where possible, tag entries with "bookTags" like ["Book One"], ["Book Two"].
- Keep summaries concise but specific enough for downstream AI agents.

JSON schema:
{
  "characters": [
    {
      "id": "stable-id-string",
      "name": "Full Name",
      "aliases": ["Alias1", "Alias2"],
      "role": "their narrative role or function",
      "bookTags": ["Book One"],
      "description": "1-3 sentence overview",
      "traits": ["key trait 1", "key trait 2"],
      "relationships": ["Brother of X", "Enemy of Y"]
    }
  ],
  "settings": [
    {
      "id": "stable-id-string",
      "name": "Place or Realm",
      "type": "city|kingdom|ship|school|dimension|other",
      "bookTags": ["Book One"],
      "description": "1-3 sentence description",
      "rules": ["notable world/setting rules relevant to continuity"]
    }
  ],
  "factions": [
    {
      "id": "stable-id-string",
      "name": "Group/Order/House",
      "type": "faction|guild|government|other",
      "description": "who they are and what they want",
      "allies": ["Name or id of allied groups/characters"],
      "enemies": ["Name or id of opposed groups/characters"]
    }
  ],
  "items": [
    {
      "id": "stable-id-string",
      "name": "Notable item or artifact",
      "type": "weapon|relic|tech|other",
      "description": "what it is and why it matters",
      "properties": ["rules, powers, constraints"]
    }
  ],
  "timeline": [
    {
      "id": "stable-id-string",
      "label": "Event name",
      "book": "Book One",
      "sequence": 1,
      "summary": "short description of the event",
      "involvedCharacters": ["Character Name or id"],
      "location": "Setting name"
    }
  ],
  "styleGuidelines": {
    "tone": "overall tone if clearly defined",
    "pov": "dominant point of view style if clear",
    "tense": "narrative tense if stable",
    "voiceNotes": ["bulleted notes that capture the voice"],
    "tabooContent": ["things that must not change or be broken"],
    "mustMatchExamples": ["very short quoted snippets that define style"]
  }
}

Now read the following source material and emit ONLY JSON:

${context}
    `.trim();

    try {
      const raw = await generateContent('gemini-2.5-pro', prompt);

      let parsed: any = null;
      try {
        parsed = JSON.parse(raw || '{}');
      } catch {
        const match = (raw || '').match(/\{[\s\S]*\}/);
        if (match) {
          try {
            parsed = JSON.parse(match[0]);
          } catch {
            parsed = null;
          }
        }
      }

      if (!parsed || !Array.isArray(parsed.characters) || !Array.isArray(parsed.settings)) {
        return res.status(502).json({
          success: false,
          message: 'AI did not return a valid Series Bible JSON payload.',
          raw,
        });
      }

      return res.json({
        success: true,
        seriesBible: parsed,
      });
    } catch (error) {
      console.error('Series Bible extraction failed', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to extract series bible.',
      });
    }
  });

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
