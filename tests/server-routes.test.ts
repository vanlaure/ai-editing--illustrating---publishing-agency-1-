import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createEditingRouter } from '../server/src/routes/editing';
import { createProjectsRouter } from '../server/src/routes/projects';

const uuidState = vi.hoisted(() => ({ calls: 0 }));

vi.mock('uuid', () => ({
  v4: () => {
    uuidState.calls += 1;
    return `mock-uuid-${uuidState.calls}`;
  },
}));

describe('Server Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    uuidState.calls = 0;
    app = express();
    app.use(express.json());

    // Mount routers
    app.use('/api/projects', createProjectsRouter());
    app.use('/api/editing', createEditingRouter());
  });

  describe('Projects API', () => {
    it('should create a new project', async () => {
      const response = await request(app)
        .post('/api/projects')
        .send({
          clientName: 'Test Client',
          title: 'Test Project',
          services: ['editing'],
        });

      expect(response.status).toBe(201);
      expect(response.body.project).toBeDefined();
      expect(response.body.project.title).toBe('Test Project');
      expect(response.body.project.clientId).toBeDefined();
    });

    it('should list all projects', async () => {
      const response = await request(app).get('/api/projects');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.projects)).toBe(true);
    });

    it('should get project by ID', async () => {
      // First create a project
      const createResponse = await request(app)
        .post('/api/projects')
        .send({
          clientName: 'Test Client',
          title: 'Test Project',
          services: ['editing'],
        });

      const projectId = createResponse.body.project.id;

      const response = await request(app).get(`/api/projects/${projectId}`);
      expect(response.status).toBe(200);
      expect(response.body.project.id).toBe(projectId);
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app).get('/api/projects/non-existent-id');
      expect(response.status).toBe(404);
    });
  });

  describe('Editing API', () => {
    it('should upsert manuscript', async () => {
      const response = await request(app)
        .post('/api/editing/manuscripts')
        .send({
          content: 'Test manuscript content',
          requestId: 'test-request-1',
        });

      expect(response.status).toBe(200);
      expect(response.body.manuscriptId).toBeDefined();
      expect(response.body.updated).toBe(false);
    });

    it('should run compliance scan', async () => {
      const response = await request(app)
        .post('/api/editing/agents/compliance')
        .send({
          manuscriptId: 'test-ms-1',
          requestId: 'test-request-2',
        });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.result)).toBe(true);
    });

    it('should generate cost plan', async () => {
      const response = await request(app)
        .post('/api/editing/agents/cost-plan')
        .send({
          manuscriptId: 'test-ms-1',
          tier: 'starter',
          requestId: 'test-request-3',
        });

      expect(response.status).toBe(200);
      expect(response.body.plan).toBeDefined();
      expect(response.body.plan.tier).toBe('starter');
      expect(response.body.plan.totalBudget).toBeDefined();
    });

    it('should cleanup HTML', async () => {
      const response = await request(app)
        .post('/api/editing/agents/cleanup')
        .send({
          manuscriptId: 'test-ms-1',
          html: '<p>Test</p><p> </p><p>Content</p>',
          requestId: 'test-request-4',
        });

      expect(response.status).toBe(200);
      expect(response.body.cleanedHtml).toBeDefined();
      expect(response.body.cleanedHtml).not.toContain('<p> </p>');
    });

    it('should validate request schemas', async () => {
      const response = await request(app)
        .post('/api/editing/manuscripts')
        .send({
          // Missing required content field
          requestId: 'test-request-5',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });
});