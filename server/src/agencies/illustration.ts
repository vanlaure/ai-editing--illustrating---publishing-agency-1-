import { Router } from 'express';
import { z } from 'zod';
import { generateContent } from '../services/genai';
import { v4 as uuidv4 } from 'uuid';

// This agency encapsulates all illustration-side automation:
// moodboards, character concepts, scenes, panels, style guides, covers, production QC.

// Core schemas
const requestIdSchema = z.string().min(6);
const manuscriptIdSchema = z.string().min(1);

const baseProjectSchema = z.object({
  projectId: z.string().min(1),
});

const createProjectSchema = z.object({
  manuscriptId: manuscriptIdSchema.optional(),
  label: z.string().min(1).default('Illustration Project'),
  requestId: requestIdSchema,
});

const seedFromManuscriptSchema = z.object({
  projectId: z.string().min(1),
  manuscript: z.string().min(200),
  requestId: requestIdSchema,
});

const moodboardSchema = z.object({
  projectId: z.string().min(1),
  text: z.string().min(40),
  requestId: requestIdSchema,
});

const characterConceptSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(2),
  description: z.string().min(10),
  requestId: requestIdSchema,
});

const sceneSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(2),
  description: z.string().min(20),
  sceneType: z.enum(['interior', 'exterior', 'establishing', 'action', 'intimate', 'other']).default('other'),
  requestId: requestIdSchema,
});

const styleGuideSchema = z.object({
  projectId: z.string().min(1),
  artStyle: z.string().min(2),
  lighting: z.string().min(2),
  linework: z.string().min(2),
  notes: z.string().min(2),
  requestId: requestIdSchema,
});

const coverBriefSchema = z.object({
  projectId: z.string().min(1),
  prompt: z.string().min(10),
  requestId: requestIdSchema,
});

// Types for responses (simplified for backend-frontend contract)
type MoodboardTile = {
  id: string;
  prompt: string;
  imageHint: string;
};

type CharacterConcept = {
  id: string;
  name: string;
  description: string;
  prompts: string[];
};

type SceneIllustration = {
  id: string;
  title: string;
  description: string;
  sceneType: string;
  prompt: string;
};

type StyleGuide = {
  id: string;
  artStyle: string;
  lighting: string;
  linework: string;
  notes: string;
};

type CoverConcept = {
  id: string;
  prompt: string;
  notes: string;
};

type IllustrationProject = {
  id: string;
  manuscriptId?: string;
  label: string;
  createdAt: string;
  moodboards: MoodboardTile[];
  characters: CharacterConcept[];
  scenes: SceneIllustration[];
  styleGuide?: StyleGuide;
  covers: CoverConcept[];
  lastRequestIds: Record<string, string>;
};

// In-memory store (swap with DB later)
const projects = new Map<string, IllustrationProject>();

// Helpers
const ensureProject = (id: string): IllustrationProject => {
  const project = projects.get(id);
  if (!project) {
    const error: any = new Error('Illustration project not found');
    error.status = 404;
    throw error;
  }
  return project;
};

const isDuplicate = (project: IllustrationProject, key: string, requestId: string): boolean => {
  return project.lastRequestIds[key] === requestId;
};

const markRequest = (project: IllustrationProject, key: string, requestId: string) => {
  project.lastRequestIds[key] = requestId;
};

// Prompt helpers (text-only; image generation done client-side or by a dedicated image service)
const moodboardPrompt = (text: string) => `
You are an Art Director.
From the manuscript excerpt, generate 6-9 short visual prompts for a mood board.
Return ONLY JSON array:
[{"label","prompt","imageHint"}]
TEXT:
${text.substring(0, 8000)}
`;

const characterPrompt = (name: string, description: string) => `
You are a Character Design Director.
Create 4 concept prompts for "${name}" based on:
${description}
Return ONLY JSON array of prompts: ["..."].
`;

const scenePrompt = (title: string, description: string, sceneType: string) => `
You are a Scene Illustration Director.
Create a single detailed illustration prompt for this scene.
Return ONLY JSON: {"prompt": "..."}.
TITLE: ${title}
TYPE: ${sceneType}
DESCRIPTION: ${description}
`;

const styleGuidePrompt = (artStyle: string, lighting: string, linework: string, notes: string) => `
You are creating a unified illustration style guide.
Summarize into a compact JSON:
{
  "artStyle": "",
  "lighting": "",
  "linework": "",
  "notes": ""
}
Constraints:
- No prose outside JSON.
`;

const coverPrompt = (prompt: string) => `
You are a Cover Art Director.
Transform this idea into a production-ready cover brief.
Return ONLY JSON:
{"prompt": "...", "notes": "..."}
SOURCE:
${prompt}
`;

// Safe JSON parse helper
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

export const createIllustrationRouter = () => {
  const router = Router();

  // Create project
  router.post('/projects', (req, res) => {
    const parsed = createProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { manuscriptId, label, requestId } = parsed.data;
    const id = uuidv4();

    const project: IllustrationProject = {
      id,
      manuscriptId,
      label,
      createdAt: new Date().toISOString(),
      moodboards: [],
      characters: [],
      scenes: [],
      covers: [],
      lastRequestIds: { create: requestId },
    };

    projects.set(id, project);
    return res.json({ projectId: id });
  });

  // Get project snapshot
  router.get('/projects/:projectId', (req, res) => {
    const parsed = baseProjectSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    try {
      const project = ensureProject(parsed.data.projectId);
      return res.json({ project });
    } catch (error: any) {
      return res.status(error.status || 500).json({ error: error.message || 'Failed to load project.' });
    }
  });

  // Seed from manuscript: generate candidate characters, scenes, and style hooks
  router.post('/projects/seed-from-manuscript', async (req, res) => {
    const parsed = seedFromManuscriptSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { projectId, manuscript, requestId } = parsed.data;

    try {
      const project = ensureProject(projectId);
      if (isDuplicate(project, 'seed-from-ms', requestId)) {
        return res.json({ projectId, seeded: false });
      }

      const prompt = `
You are an Illustration Lead reviewing a novel.
From the text, extract:
- 3-5 key characters with brief physical notes
- 3-5 scene ideas
- 1-2 style hooks
Return ONLY JSON:
{
  "characters":[{"name","description"}],
  "scenes":[{"title","description"}],
  "style":{"artStyle","lighting","linework","notes"}
}
TEXT:
${manuscript.substring(0, 9000)}
      `;
      const raw = await generateContent('gemini-2.5-pro', prompt);
      const result = safeJson<{
        characters?: { name: string; description: string }[];
        scenes?: { title: string; description: string }[];
        style?: { artStyle: string; lighting: string; linework: string; notes: string };
      }>(raw, {});

      if (result.characters) {
        result.characters.forEach((c) => {
          const concept: CharacterConcept = {
            id: uuidv4(),
            name: c.name,
            description: c.description,
            prompts: [],
          };
          project.characters.push(concept);
        });
      }

      if (result.scenes) {
        result.scenes.forEach((s) => {
          const scene: SceneIllustration = {
            id: uuidv4(),
            title: s.title,
            description: s.description,
            sceneType: 'other',
            prompt: '',
          };
          project.scenes.push(scene);
        });
      }

      if (result.style && !project.styleGuide) {
        project.styleGuide = {
          id: uuidv4(),
          artStyle: result.style.artStyle || 'Unspecified',
          lighting: result.style.lighting || 'Unspecified',
          linework: result.style.linework || 'Unspecified',
          notes: result.style.notes || '',
        };
      }

      markRequest(project, 'seed-from-ms', requestId);
      return res.json({
        projectId,
        charactersSeeded: result.characters?.length || 0,
        scenesSeeded: result.scenes?.length || 0,
        styleGuideCreated: !!result.style,
      });
    } catch (error) {
      console.error('Seed-from-manuscript failed', error);
      return res.status(500).json({ error: 'Failed to seed illustration project from manuscript.' });
    }
  });

  // Generate moodboard prompts
  router.post('/projects/moodboard', async (req, res) => {
    const parsed = moodboardSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { projectId, text, requestId } = parsed.data;
    try {
      const project = ensureProject(projectId);
      if (isDuplicate(project, `moodboard-${requestId}`, requestId)) {
        return res.json({ projectId, tiles: project.moodboards });
      }

      const raw = await generateContent('gemini-2.5-pro', moodboardPrompt(text));
      const tiles = safeJson<{ label: string; prompt: string; imageHint: string }[]>(raw, []).map((t) => ({
        id: uuidv4(),
        prompt: t.prompt,
        imageHint: t.imageHint || t.label,
      })) as MoodboardTile[];

      project.moodboards.push(...tiles);
      markRequest(project, `moodboard-${requestId}`, requestId);

      return res.json({ projectId, tiles });
    } catch (error) {
      console.error('Moodboard agent failed', error);
      return res.status(500).json({ error: 'Failed to generate moodboard prompts.' });
    }
  });

  // Character concept prompts
  router.post('/projects/characters/concepts', async (req, res) => {
    const parsed = characterConceptSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { projectId, name, description, requestId } = parsed.data;
    try {
      const project = ensureProject(projectId);
      if (isDuplicate(project, `char-${name}-${requestId}`, requestId)) {
        const existing = project.characters.find((c) => c.name === name);
        return res.json({ projectId, concept: existing });
      }

      const raw = await generateContent('gemini-2.5-pro', characterPrompt(name, description));
      const prompts = safeJson<string[]>(raw, []);
      const concept: CharacterConcept = {
        id: uuidv4(),
        name,
        description,
        prompts,
      };
      project.characters.push(concept);
      markRequest(project, `char-${name}-${requestId}`, requestId);

      return res.json({ projectId, concept });
    } catch (error) {
      console.error('Character concept agent failed', error);
      return res.status(500).json({ error: 'Failed to generate character concepts.' });
    }
  });

  // Scene illustration prompt
  router.post('/projects/scenes', async (req, res) => {
    const parsed = sceneSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { projectId, title, description, sceneType, requestId } = parsed.data;
    try {
      const project = ensureProject(projectId);
      if (isDuplicate(project, `scene-${title}-${requestId}`, requestId)) {
        const existing = project.scenes.find((s) => s.title === title);
        return res.json({ projectId, scene: existing });
      }

      const raw = await generateContent('gemini-2.5-pro', scenePrompt(title, description, sceneType));
      const parsedJson = safeJson<{ prompt?: string }>(raw, { prompt: '' });

      const scene: SceneIllustration = {
        id: uuidv4(),
        title,
        description,
        sceneType,
        prompt: parsedJson.prompt || '',
      };

      project.scenes.push(scene);
      markRequest(project, `scene-${title}-${requestId}`, requestId);

      return res.json({ projectId, scene });
    } catch (error) {
      console.error('Scene agent failed', error);
      return res.status(500).json({ error: 'Failed to generate scene prompt.' });
    }
  });

  // Style guide generation
  router.post('/projects/style-guide', async (req, res) => {
    const parsed = styleGuideSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { projectId, artStyle, lighting, linework, notes, requestId } = parsed.data;
    try {
      const project = ensureProject(projectId);
      if (isDuplicate(project, 'style-guide', requestId) && project.styleGuide) {
        return res.json({ projectId, styleGuide: project.styleGuide });
      }

      const raw = await generateContent('gemini-2.5-pro', styleGuidePrompt(artStyle, lighting, linework, notes));
      const sg = safeJson<StyleGuide>(raw, {
        id: uuidv4(),
        artStyle,
        lighting,
        linework,
        notes,
      });

      const styleGuide: StyleGuide = {
        id: sg.id || uuidv4(),
        artStyle: sg.artStyle || artStyle,
        lighting: sg.lighting || lighting,
        linework: sg.linework || linework,
        notes: sg.notes || notes,
      };

      project.styleGuide = styleGuide;
      markRequest(project, 'style-guide', requestId);

      return res.json({ projectId, styleGuide });
    } catch (error) {
      console.error('Style guide agent failed', error);
      return res.status(500).json({ error: 'Failed to generate style guide.' });
    }
  });

  // Cover brief
  router.post('/projects/covers', async (req, res) => {
    const parsed = coverBriefSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { projectId, prompt, requestId } = parsed.data;
    try {
      const project = ensureProject(projectId);
      if (isDuplicate(project, `cover-${requestId}`, requestId)) {
        return res.json({ projectId, covers: project.covers });
      }

      const raw = await generateContent('gemini-2.5-pro', coverPrompt(prompt));
      const brief = safeJson<{ prompt?: string; notes?: string }>(raw, {});

      const cover: CoverConcept = {
        id: uuidv4(),
        prompt: brief.prompt || prompt,
        notes: brief.notes || '',
      };

      project.covers.push(cover);
      markRequest(project, `cover-${requestId}`, requestId);

      return res.json({ projectId, cover });
    } catch (error) {
      console.error('Cover agent failed', error);
      return res.status(500).json({ error: 'Failed to generate cover brief.' });
    }
  });

  return router;
};