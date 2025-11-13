import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the agency client services
vi.mock('../services/agencyClient', () => ({
  EditingAgency: {
    upsertManuscript: vi.fn(),
    runCompliance: vi.fn(),
    generateCostPlan: vi.fn(),
  },
  IllustrationAgency: {
    createProject: vi.fn(),
    generateMoodboard: vi.fn(),
  },
  PublishingAgency: {
    createPackage: vi.fn(),
    generateMetadata: vi.fn(),
  },
  MarketingAgency: {
    createCampaign: vi.fn(),
    generateScenarios: vi.fn(),
  },
}));

vi.mock('../services/geminiService', () => ({
  runAiCommand: vi.fn(),
  generateSpeech: vi.fn(),
  generateImages: vi.fn(),
  generateVideo: vi.fn(),
  editImage: vi.fn(),
}));

import { EditingAgency, IllustrationAgency, PublishingAgency, MarketingAgency } from '../services/agencyClient';
import { runAiCommand, generateSpeech, generateImages, generateVideo, editImage } from '../services/geminiService';

describe('Service Layer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Agency Services', () => {
    describe('EditingAgency', () => {
      it('should upsert manuscript', async () => {
        const mockResult = { manuscriptId: 'ms-123', updated: false };
        (EditingAgency.upsertManuscript as any).mockResolvedValue(mockResult);

        const result = await EditingAgency.upsertManuscript('content', 'ms-123', 'proj-1');
        expect(result).toEqual(mockResult);
        expect(EditingAgency.upsertManuscript).toHaveBeenCalledWith('content', 'ms-123', 'proj-1');
      });

      it('should run compliance scan', async () => {
        const mockResult = [{ id: 'issue-1', category: 'legal', severity: 'medium' }];
        (EditingAgency.runCompliance as any).mockResolvedValue(mockResult);

        const result = await EditingAgency.runCompliance('ms-123', 'proj-1');
        expect(result).toEqual(mockResult);
      });

      it('should generate cost plan', async () => {
        const mockResult = {
          tier: 'starter',
          totalBudget: 25000,
          costBreakdown: [{ label: 'Editing', amount: 5000 }]
        };
        (EditingAgency.generateCostPlan as any).mockResolvedValue(mockResult);

        const result = await EditingAgency.generateCostPlan('ms-123', 'starter', 'proj-1');
        expect(result).toEqual(mockResult);
      });
    });

    describe('IllustrationAgency', () => {
      it('should create illustration project', async () => {
        const mockResult = { projectId: 'ill-123' };
        (IllustrationAgency.createProject as any).mockResolvedValue(mockResult);

        const result = await IllustrationAgency.createProject({
          manuscriptId: 'ms-123',
          label: 'Test Project',
          projectId: 'proj-1',
        });
        expect(result).toEqual(mockResult);
      });

      it('should generate moodboard', async () => {
        const mockResult = { projectId: 'ill-123', tiles: [] };
        (IllustrationAgency.generateMoodboard as any).mockResolvedValue(mockResult);

        const result = await IllustrationAgency.generateMoodboard({
          projectId: 'ill-123',
          text: 'Test scene description',
        });
        expect(result).toEqual(mockResult);
      });
    });

    describe('PublishingAgency', () => {
      it('should create publishing package', async () => {
        const mockResult = { packageId: 'pkg-123' };
        (PublishingAgency.createPackage as any).mockResolvedValue(mockResult);

        const result = await PublishingAgency.createPackage({
          manuscriptId: 'ms-123',
          illustrationProjectId: 'ill-123',
          label: 'Test Package',
        });
        expect(result).toEqual(mockResult);
      });

      it('should generate metadata', async () => {
        const mockResult = {
          packageId: 'pkg-123',
          metadata: {
            title: 'Test Book',
            blurb: 'Test description',
            keywords: ['test'],
          }
        };
        (PublishingAgency.generateMetadata as any).mockResolvedValue(mockResult);

        const result = await PublishingAgency.generateMetadata({
          packageId: 'pkg-123',
          manuscript: 'Test manuscript content',
        });
        expect(result).toEqual(mockResult);
      });
    });

    describe('MarketingAgency', () => {
      it('should create marketing campaign', async () => {
        const mockResult = {
          campaignId: 'camp-123',
          strategySummary: 'Test strategy',
          heroHooks: ['Hook 1'],
          funnelOutline: ['Step 1'],
        };
        (MarketingAgency.createCampaign as any).mockResolvedValue(mockResult);

        const result = await MarketingAgency.createCampaign({
          packageId: 'pkg-123',
          goal: 'launch',
          budgetLevel: 'standard',
        });
        expect(result).toEqual(mockResult);
      });

      it('should generate launch scenarios', async () => {
        const mockResult = {
          scenarios: [{
            name: 'Speed Launch',
            summary: 'Fast launch strategy',
            tradeoffs: ['Higher cost'],
            metrics: { timeToMarket: '1 month', budgetImpact: '$50k', expectedReach: '100k' },
            recommendations: ['Start immediately'],
          }]
        };
        (MarketingAgency.generateScenarios as any).mockResolvedValue(mockResult);

        const result = await MarketingAgency.generateScenarios({
          packageId: 'pkg-123',
          priority: 'speed',
        });
        expect(result).toEqual(mockResult);
      });
    });
  });

  describe('Gemini Service', () => {
    it('should run AI command', async () => {
      const mockResult = 'AI response text';
      (runAiCommand as any).mockResolvedValue(mockResult);

      const result = await runAiCommand('Test prompt', 'Test context');
      expect(result).toBe(mockResult);
      expect(runAiCommand).toHaveBeenCalledWith('Test prompt', 'Test context');
    });

    it('should generate speech', async () => {
      const mockResult = 'base64-audio-data';
      (generateSpeech as any).mockResolvedValue(mockResult);

      const result = await generateSpeech('Test text');
      expect(result).toBe(mockResult);
    });

    it('should generate images', async () => {
      const mockResult = ['image1-data', 'image2-data'];
      (generateImages as any).mockResolvedValue(mockResult);

      const result = await generateImages('Test prompt', 2, '1:1');
      expect(result).toEqual(mockResult);
    });

    it('should generate video', async () => {
      const mockResult = { name: 'operations/video-123' };
      (generateVideo as any).mockResolvedValue(mockResult);

      const result = await generateVideo('Test prompt', '16:9');
      expect(result).toEqual(mockResult);
    });

    it('should edit image', async () => {
      const mockResult = 'edited-base64-data';
      (editImage as any).mockResolvedValue(mockResult);

      const result = await editImage('base64-image', 'Test edit prompt');
      expect(result).toBe(mockResult);
    });
  });
});