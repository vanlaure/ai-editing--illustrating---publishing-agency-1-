import { Router } from 'express';
import { z } from 'zod';
import { AgencyClient, Project, ServiceLine, ServiceLineStatus } from '../types';

const clients = new Map<string, AgencyClient>();
const projects = new Map<string, Project>();

const nanoid = () => Math.random().toString(36).slice(2, 10);

const serviceLinesSchema = z.array(z.custom<ServiceLine>((val) =>
  val === 'editing' || val === 'illustration' || val === 'audiobook' || val === 'marketing',
));

const statusSchema = z.custom<ServiceLineStatus>((val) =>
  val === 'not_started' ||
  val === 'intake' ||
  val === 'in_progress' ||
  val === 'awaiting_internal_review' ||
  val === 'awaiting_client_review' ||
  val === 'approved' ||
  val === 'on_hold',
);

const createProjectSchema = z.object({
  clientName: z.string().min(1),
  title: z.string().min(1),
  seriesName: z.string().optional(),
  genre: z.string().optional(),
  services: serviceLinesSchema.default(['editing']),
});

const updateProjectSchema = z.object({
  title: z.string().min(1).optional(),
  seriesName: z.string().optional(),
  genre: z.string().optional(),
  services: serviceLinesSchema.optional(),
  editingStatus: statusSchema.optional(),
  illustrationStatus: statusSchema.optional(),
  audiobookStatus: statusSchema.optional(),
  marketingStatus: statusSchema.optional(),
});

const toClient = (name: string): AgencyClient => {
  const existing = Array.from(clients.values()).find((c) => c.name === name);
  if (existing) return existing;

  const id = `client_${nanoid()}`;
  const now = new Date().toISOString();
  const client: AgencyClient = {
    id,
    name,
    createdAt: now,
    updatedAt: now,
  };
  clients.set(id, client);
  return client;
};

const createProject = (input: z.infer<typeof createProjectSchema>): Project => {
  const client = toClient(input.clientName);
  const id = `proj_${nanoid()}`;
  const now = new Date().toISOString();

  const project: Project = {
    id,
    clientId: client.id,
    code: `${client.name.substring(0, 3).toUpperCase()}-${nanoid()}`,
    title: input.title,
    seriesName: input.seriesName,
    genre: input.genre,
    services: input.services,
    editingStatus: 'intake',
    illustrationStatus: 'not_started',
    audiobookStatus: 'not_started',
    marketingStatus: 'not_started',
    createdAt: now,
    updatedAt: now,
  };

  projects.set(id, project);
  return project;
};

const updateProject = (project: Project, updates: z.infer<typeof updateProjectSchema>): Project => {
  const next: Project = {
    ...project,
    ...updates,
    services: updates.services ?? project.services,
    editingStatus: (updates.editingStatus as ServiceLineStatus | undefined) ?? project.editingStatus,
    illustrationStatus: (updates.illustrationStatus as ServiceLineStatus | undefined) ?? project.illustrationStatus,
    audiobookStatus: (updates.audiobookStatus as ServiceLineStatus | undefined) ?? project.audiobookStatus,
    marketingStatus: (updates.marketingStatus as ServiceLineStatus | undefined) ?? project.marketingStatus,
    updatedAt: new Date().toISOString(),
  };
  projects.set(next.id, next);
  return next;
};

export const createProjectsRouter = () => {
  const router = Router();

  router.get('/projects', (_req, res) => {
    const list = Array.from(projects.values());
    res.json({ projects: list });
  });

  router.post('/projects', (req, res) => {
    const parsed = createProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const project = createProject(parsed.data);
    res.status(201).json({ project });
  });

  router.get('/projects/:projectId', (req, res) => {
    const project = projects.get(req.params.projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ project });
  });

  router.patch('/projects/:projectId', (req, res) => {
    const project = projects.get(req.params.projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const parsed = updateProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const updated = updateProject(project, parsed.data);
    res.json({ project: updated });
  });

  return router;
};

export const assertProjectId = (projectId?: string) => {
  if (!projectId) {
    throw new Error('projectId is required for this operation');
  }
  const project = projects.get(projectId);
  if (!project) {
    throw new Error('Unknown projectId');
  }
  return project;
};