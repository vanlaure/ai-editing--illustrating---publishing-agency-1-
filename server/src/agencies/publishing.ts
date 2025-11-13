import { Router } from 'express';
import { z } from 'zod';
import { generateContent } from '../services/genai';
import { v4 as uuidv4 } from 'uuid';

// Publishing & Production Agency
// Focus: turn manuscript + art into deployable packages, structured metadata, and submission payloads.

// Schemas
const requestIdSchema = z.string().min(6);
const manuscriptIdSchema = z.string().min(1);
const projectIdSchema = z.string().min(1);

const createPackageSchema = z.object({
  manuscriptId: manuscriptIdSchema,
  illustrationProjectId: projectIdSchema.optional(),
  label: z.string().min(1).default('Publishing Package'),
  requestId: requestIdSchema,
});

const basePackageSchema = z.object({
  packageId: z.string().min(1),
});

const exportSchema = z.object({
  packageId: z.string().min(1),
  formats: z.array(z.enum(['txt', 'html'])).min(1),
  manuscript: z.string().min(50),
  requestId: requestIdSchema,
});

const localizationSchema = z.object({
  packageId: z.string().min(1),
  locales: z.array(z.string().min(2)).min(1),
  manuscript: z.string().min(50),
  requestId: requestIdSchema,
});

const metadataSchema = z.object({
  packageId: z.string().min(1),
  manuscript: z.string().min(50),
  genre: z.string().min(2).optional(),
  audience: z.string().min(2).optional(),
  requestId: requestIdSchema,
});

const costPlanSchema = z.object({
  packageId: z.string().min(1),
  manuscript: z.string().min(50),
  tier: z.enum(['starter', 'professional', 'cinematic']),
  requestId: requestIdSchema,
});

const submissionSchema = z.object({
  packageId: z.string().min(1),
  retailer: z.enum(['KDP', 'IngramSpark', 'Draft2Digital', 'Kobo', 'AppleBooks', 'GooglePlayBooks', 'Audible', 'ACX']),
  requestId: requestIdSchema,
});

// Types
type ExportRecord = {
  id: string;
  formats: ('txt' | 'html')[];
  assets: { format: string; url: string }[];
  createdAt: string;
};

type LocalizationPack = {
  locale: string;
  title: string;
  blurb: string;
  keywords: string[];
};

type MetadataPack = {
  title: string;
  subtitle?: string;
  blurb: string;
  keywords: string[];
  bisac: string[];
  audience: string;
};

type CostPlan = {
  tier: string;
  totalBudget: number;
  estimatedTimeline: string;
  summary: string;
  costBreakdown: { label: string; amount: number }[];
  notes: string[];
};

type SubmissionAsset = {
  label: string;
  status: 'ready' | 'pending';
};

type SubmissionPackage = {
  id: string;
  retailer: string;
  generatedAt: string;
  assets: SubmissionAsset[];
  priorityNotes: string;
};

type PublishingPackage = {
  id: string;
  manuscriptId: string;
  illustrationProjectId?: string;
  label: string;
  createdAt: string;
  exports: ExportRecord[];
  localizations: LocalizationPack[];
  metadata?: MetadataPack;
  costPlan?: CostPlan;
  submissions: SubmissionPackage[];
  lastRequestIds: Record<string, string>;
};

// In-memory store
const packages = new Map<string, PublishingPackage>();

// Helpers
const ensurePackage = (id: string): PublishingPackage => {
  const pkg = packages.get(id);
  if (!pkg) {
    const error: any = new Error('Publishing package not found');
    error.status = 404;
    throw error;
  }
  return pkg;
};

const isDuplicate = (pkg: PublishingPackage, key: string, requestId: string) =>
  pkg.lastRequestIds[key] === requestId;

const markRequest = (pkg: PublishingPackage, key: string, requestId: string) => {
  pkg.lastRequestIds[key] = requestId;
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
const localizationPrompt = (manuscript: string, locales: string[]) => `
You are a publishing localization specialist.
For locales: ${locales.join(', ')},
Return ONLY JSON:
[
  {
    "locale": "xx-XX",
    "title": "Localized title",
    "blurb": "Localized blurb (2-3 paragraphs)",
    "keywords": ["k1","k2","k3"]
  }
]
Use only information from the text.
TEXT:
${manuscript.substring(0, 8000)}
`;

const metadataPrompt = (manuscript: string, genre?: string, audience?: string) => `
You are a metadata strategist.
Based on the manuscript, return ONLY JSON:
{
  "title": "",
  "subtitle": "",
  "blurb": "",
  "keywords": ["..."],
  "bisac": ["..."],
  "audience": ""
}
If genre/audience hints are given, align to them.
GENRE_HINT: ${genre || ''}
AUDIENCE_HINT: ${audience || ''}
TEXT:
${manuscript.substring(0, 8000)}
`;

const costPlanPrompt = (manuscript: string, tier: string) => `
Estimate production cost plan for tier "${tier}" covering:
- editing polish, illustration, cover, audiobook, marketing.
Return ONLY JSON:
{
  "tier":"",
  "totalBudget":0,
  "estimatedTimeline":"",
  "summary":"",
  "costBreakdown":[{"label":"","amount":0}],
  "notes":["..."]
}
TEXT:
${manuscript.substring(0, 6000)}
`;

const submissionPrompt = (retailer: string, pkg: PublishingPackage) => `
You are a publishing operations specialist.
For retailer "${retailer}", using the publishing package data, construct a checklist of assets.
Return ONLY JSON:
{
  "assets":[
    {"label":"Interior file (EPUB/HTML/TXT)", "status":"ready"|"pending"},
    {"label":"Cover (front/spine/back)", "status":"ready"|"pending"},
    {"label":"Metadata & keywords", "status":"ready"|"pending"},
    {"label":"Localization packs (if applicable)", "status":"ready"|"pending"}
  ],
  "priorityNotes":"..."
}
PACKAGE_SNAPSHOT:
${JSON.stringify({
  hasExports: pkg.exports.length > 0,
  hasMetadata: !!pkg.metadata,
  hasLocalizations: pkg.localizations.length > 0,
  hasCover: true,
})}
`;

// Router
export const createPublishingRouter = () => {
  const router = Router();

  // Create publishing package
  router.post('/packages', (req, res) => {
    const parsed = createPackageSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { manuscriptId, illustrationProjectId, label, requestId } = parsed.data;
    const id = uuidv4();

    const pkg: PublishingPackage = {
      id,
      manuscriptId,
      illustrationProjectId,
      label,
      createdAt: new Date().toISOString(),
      exports: [],
      localizations: [],
      submissions: [],
      lastRequestIds: { create: requestId },
    };

    packages.set(id, pkg);
    return res.json({ packageId: id });
  });

  // Get package snapshot
  router.get('/packages/:packageId', (req, res) => {
    const parsed = basePackageSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    try {
      const pkg = ensurePackage(parsed.data.packageId);
      return res.json({ package: pkg });
    } catch (error: any) {
      return res.status(error.status || 500).json({ error: error.message || 'Failed to load publishing package.' });
    }
  });

  // Export formats (txt/html) — server-side deterministic export descriptors
  router.post('/packages/exports', async (req, res) => {
    const parsed = exportSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { packageId, formats, manuscript, requestId } = parsed.data;
    try {
      const pkg = ensurePackage(packageId);
      if (isDuplicate(pkg, `export-${requestId}`, requestId)) {
        return res.json({ packageId, export: pkg.exports[pkg.exports.length - 1] });
      }

      const id = uuidv4();
      const createdAt = new Date().toISOString();

      const assets = formats.map((format) => ({
        format,
        // Placeholder URLs: in real impl, these point to generated assets (S3, etc.).
        url: `https://assets.example.com/publishing/${packageId}/${id}.${format}`,
      }));

      const record: ExportRecord = {
        id,
        formats,
        assets,
        createdAt,
      };

      pkg.exports.push(record);
      markRequest(pkg, `export-${requestId}`, requestId);

      return res.json({ packageId, export: record });
    } catch (error) {
      console.error('Export generation failed', error);
      return res.status(500).json({ error: 'Failed to generate exports.' });
    }
  });

  // Localization packs
  router.post('/packages/localization', async (req, res) => {
    const parsed = localizationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { packageId, locales, manuscript, requestId } = parsed.data;
    try {
      const pkg = ensurePackage(packageId);
      if (isDuplicate(pkg, `loc-${requestId}`, requestId)) {
        return res.json({ packageId, localizations: pkg.localizations });
      }

      const raw = await generateContent('gemini-2.5-pro', localizationPrompt(manuscript, locales));
      const packs = safeJson<LocalizationPack[]>(raw, []);

      // Merge/append
      packs.forEach((p) => {
        if (p && p.locale) {
          const existingIndex = pkg.localizations.findIndex((x) => x.locale === p.locale);
          if (existingIndex >= 0) {
            pkg.localizations[existingIndex] = p;
          } else {
            pkg.localizations.push(p);
          }
        }
      });

      markRequest(pkg, `loc-${requestId}`, requestId);
      return res.json({ packageId, localizations: pkg.localizations });
    } catch (error) {
      console.error('Localization generation failed', error);
      return res.status(500).json({ error: 'Failed to generate localization packs.' });
    }
  });

  // Metadata pack
  router.post('/packages/metadata', async (req, res) => {
    const parsed = metadataSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { packageId, manuscript, genre, audience, requestId } = parsed.data;
    try {
      const pkg = ensurePackage(packageId);
      if (isDuplicate(pkg, 'metadata', requestId) && pkg.metadata) {
        return res.json({ packageId, metadata: pkg.metadata });
      }

      const raw = await generateContent('gemini-2.5-pro', metadataPrompt(manuscript, genre, audience));
      const meta = safeJson<MetadataPack>(raw, {
        title: 'Untitled',
        blurb: '',
        keywords: [],
        bisac: [],
        audience: audience || '',
      });

      pkg.metadata = meta;
      markRequest(pkg, 'metadata', requestId);

      return res.json({ packageId, metadata: meta });
    } catch (error) {
      console.error('Metadata generation failed', error);
      return res.status(500).json({ error: 'Failed to generate metadata.' });
    }
  });

  // Cost plan
  router.post('/packages/cost-plan', async (req, res) => {
    const parsed = costPlanSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { packageId, manuscript, tier, requestId } = parsed.data;
    try {
      const pkg = ensurePackage(packageId);
      if (isDuplicate(pkg, `cost-${tier}`, requestId) && pkg.costPlan) {
        return res.json({ packageId, plan: pkg.costPlan });
      }

      const raw = await generateContent('gemini-2.5-pro', costPlanPrompt(manuscript, tier));
      const plan = safeJson<CostPlan>(raw, {
        tier,
        totalBudget: 0,
        estimatedTimeline: '',
        summary: '',
        costBreakdown: [],
        notes: [],
      });

      pkg.costPlan = plan;
      markRequest(pkg, `cost-${tier}`, requestId);

      return res.json({ packageId, plan });
    } catch (error) {
      console.error('Cost plan generation failed', error);
      return res.status(500).json({ error: 'Failed to generate cost plan.' });
    }
  });

  // Submission package (retailer-specific)
  router.post('/packages/submissions', async (req, res) => {
    const parsed = submissionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { packageId, retailer, requestId } = parsed.data;
    try {
      const pkg = ensurePackage(packageId);
      const key = `sub-${retailer}`;
      if (isDuplicate(pkg, key, requestId)) {
        const existing = pkg.submissions.find((s) => s.retailer === retailer);
        return res.json({ packageId, submission: existing });
      }

      const raw = await generateContent('gemini-2.5-pro', submissionPrompt(retailer, pkg));
      const parsedJson = safeJson<{
        assets?: { label: string; status: 'ready' | 'pending' }[];
        priorityNotes?: string;
      }>(raw, {});

      const submission: SubmissionPackage = {
        id: uuidv4(),
        retailer,
        generatedAt: new Date().toISOString(),
        assets: (parsedJson.assets || []).map((a) => ({
          label: a.label,
          status: a.status === 'ready' ? 'ready' : 'pending',
        })),
        priorityNotes:
          parsedJson.priorityNotes ||
          'Verify all assets before upload. Use retailer portal to finalize submission.',
      };

      pkg.submissions = pkg.submissions.filter((s) => s.retailer !== retailer);
      pkg.submissions.push(submission);
      markRequest(pkg, key, requestId);

      return res.json({ packageId, submission });
    } catch (error) {
      console.error('Submission package generation failed', error);
      return res.status(500).json({ error: 'Failed to generate submission package.' });
    }
  });

  return router;
};