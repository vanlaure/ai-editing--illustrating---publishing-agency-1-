import { v4 as uuidv4 } from 'uuid';
import {
  AudiobookProject,
  AudiobookAnalytics,
  MarketingAsset,
  EmailSequence,
  Reviewer,
  AudiobookMarketingCampaign,
  DistributionPipeline,
  PlatformDistribution,
  RoyaltyConfiguration,
} from '../types';
import { TelemetryCategory } from './telemetry';

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

const createPlatform = (platform: PlatformDistribution['platform'], status: PlatformDistribution['status'], liveOffset = 0): PlatformDistribution => ({
  platform,
  status,
  uploadDate: daysAgo(14 - liveOffset),
  liveDate: status === 'live' ? daysAgo(liveOffset) : undefined,
  pricing: {
    currency: 'USD',
    retailPrice: 24.99,
  },
});

const createMarketingAsset = (overrides: Partial<MarketingAsset>): MarketingAsset => ({
  id: uuidv4(),
  type: 'waveform-video',
  title: 'Teaser',
  platform: 'instagram',
  assetUrl: '#',
  createdDate: daysAgo(3),
  duration: 30,
  performanceMetrics: {
    views: 12000,
    engagement: 1500,
    clicks: 640,
  },
  ...overrides,
});

const createEmailSequence = (overrides: Partial<EmailSequence>): EmailSequence => ({
  sequenceNumber: 1,
  subject: 'Launch update',
  content: 'Thanks for joining the prerelease list! ',
  sendDate: daysAgo(2),
  targetAudience: 'launch',
  ...overrides,
});

const createReviewer = (overrides: Partial<Reviewer>): Reviewer => ({
  name: 'Cass Review',
  platform: 'YouTube',
  email: 'press@cassreview.com',
  genre: ['Sci-Fi'],
  audienceSize: 120000,
  contacted: true,
  responded: true,
  ...overrides,
});

const createAnalytics = (audiobookId: string, listens: number, revenue: number): AudiobookAnalytics => ({
  audiobookId,
  period: {
    start: daysAgo(30),
    end: new Date(),
  },
  listeningMetrics: {
    totalListens: listens,
    totalListeningHours: listens * 1.4,
    averageCompletionRate: 74,
    averageListeningSessionDuration: 42,
    returningListeners: Math.round(listens * 0.42),
    newListeners: Math.round(listens * 0.58),
  },
  revenueMetrics: {
    totalRevenue: revenue,
    royaltyEarnings: revenue * 0.6,
    platformFees: revenue * 0.2,
    netProfit: revenue * 0.4,
    currency: 'USD',
    payoutSchedule: [daysAgo(7), daysAgo(37)],
  },
  platformBreakdown: [
    { platform: 'audible', listens: Math.round(listens * 0.5), revenue: revenue * 0.55 },
    { platform: 'spotify', listens: Math.round(listens * 0.25), revenue: revenue * 0.2 },
    { platform: 'apple', listens: Math.round(listens * 0.15), revenue: revenue * 0.15 },
    { platform: 'google', listens: Math.round(listens * 0.1), revenue: revenue * 0.1 },
  ],
  chapterAnalytics: Array.from({ length: 5 }).map((_, idx) => ({
    chapterNumber: idx + 1,
    completionRate: 70 + idx,
    averageListenTime: 18 + idx * 1.5,
    skipRate: 5 - idx,
    replayRate: 8 + idx,
    popularityScore: 80 - idx * 2,
  })),
});

const createDistribution = (audiobookId: string, status: DistributionPipeline['status']): DistributionPipeline => ({
  id: uuidv4(),
  audiobookId,
  status,
  platforms: [
    createPlatform('audible', status === 'live' ? 'live' : 'approved', status === 'live' ? 3 : 0),
    createPlatform('spotify', status === 'live' ? 'live' : 'processing', status === 'live' ? 2 : 0),
    createPlatform('apple', 'processing'),
  ],
  royaltyConfig: {
    model: 'exclusive',
    royaltyRate: 0.4,
  } as RoyaltyConfiguration,
  launchDate: status === 'live' ? daysAgo(5) : undefined,
});

const createMarketing = (audiobookId: string): AudiobookMarketingCampaign => ({
  id: uuidv4(),
  audiobookId,
  launchDate: daysAgo(4),
  assets: [
    createMarketingAsset({ type: 'waveform-video', title: 'Neon skyline teaser', platform: 'tiktok', performanceMetrics: { views: 42000, engagement: 5800, clicks: 2200 } }),
    createMarketingAsset({ type: 'visual-quote', title: 'Quote card', platform: 'instagram', performanceMetrics: { views: 12000, engagement: 1800, clicks: 620 } }),
    createMarketingAsset({ type: 'trailer', title: 'Cinematic trailer', platform: 'youtube', performanceMetrics: { views: 38000, engagement: 4200, clicks: 3100 } }),
  ],
  emailCampaign: {
    sequences: [
      createEmailSequence({ sequenceNumber: 1, targetAudience: 'pre-order', subject: 'Secure your galactic ticket', sendDate: daysAgo(9) }),
      createEmailSequence({ sequenceNumber: 2, targetAudience: 'launch', subject: 'The Syndicate is live', sendDate: daysAgo(2) }),
    ],
    recipientLists: ['Launch VIP', 'Sci-Fi newsletter'],
    trackingEnabled: true,
  },
  reviewerOutreach: {
    targetReviewers: [createReviewer({ name: 'Orbit Reads', genre: ['Sci-Fi', 'Thriller'], audienceSize: 88000 }), createReviewer({ name: 'SFX Radio', platform: 'Podcast', audienceSize: 45000 })],
    pitchTemplate: 'Hi {name}, sharing advance access to {title}.',
    reviewCopiesSent: 6,
    reviewsReceived: 4,
  },
  analyticsTracking: {
    campaignId: uuidv4(),
    impressions: 165000,
    clicks: 12800,
    conversions: 1800,
    costPerAcquisition: 5.4,
    returnOnInvestment: 3.1,
  },
});

export const getDemoProjects = (): AudiobookProject[] => {
  const projectAId = uuidv4();
  const projectBId = uuidv4();
  const projectCId = uuidv4();

  return [
    {
      id: projectAId,
      title: 'Lunar Syndicate',
      author: 'Mira Cole',
      recordingSessions: [],
      editingProjects: [],
      outputs: [],
      pricing: 'professional',
      status: 'editing',
      distribution: createDistribution(projectAId, 'review'),
      marketing: createMarketing(projectAId),
      analytics: createAnalytics(projectAId, 54000, 68000),
      createdAt: daysAgo(45),
      updatedAt: daysAgo(1),
    },
    {
      id: projectBId,
      title: 'Mythweaver Protocol',
      author: 'Elias Noor',
      recordingSessions: [],
      editingProjects: [],
      outputs: [],
      pricing: 'cinematic',
      status: 'recording',
      distribution: createDistribution(projectBId, 'uploading'),
      marketing: createMarketing(projectBId),
      analytics: createAnalytics(projectBId, 36000, 52000),
      createdAt: daysAgo(52),
      updatedAt: daysAgo(4),
    },
    {
      id: projectCId,
      title: 'Gilded Spire Diaries',
      author: 'Aiden Locke',
      recordingSessions: [],
      editingProjects: [],
      outputs: [],
      pricing: 'starter',
      status: 'live',
      distribution: createDistribution(projectCId, 'live'),
      marketing: createMarketing(projectCId),
      analytics: createAnalytics(projectCId, 72000, 82000),
      createdAt: daysAgo(80),
      updatedAt: daysAgo(2),
    },
  ];
};

export interface TelemetrySeed {
  category: TelemetryCategory;
  metric: string;
  value: number;
  detail?: string;
}

export const demoTelemetrySeeds: TelemetrySeed[] = [
  { category: 'editing', metric: 'wordsAuthored', value: 18500, detail: 'Imported manuscripts' },
  { category: 'editing', metric: 'aiCommands', value: 14, detail: 'AI drafting passes' },
  { category: 'editing', metric: 'grammarChecks', value: 6, detail: 'Chapter QA sweeps' },
  { category: 'editing', metric: 'factChecks', value: 3, detail: 'Lore and timeline checks' },
  { category: 'editing', metric: 'consistencyAudits', value: 2, detail: 'POV review' },
  { category: 'editing', metric: 'sensitivityPasses', value: 1, detail: 'Content review' },
  { category: 'editing', metric: 'dialogueAudits', value: 2, detail: 'Scene polish' },
  { category: 'illustration', metric: 'moodboards', value: 4, detail: 'Visual exploration' },
  { category: 'illustration', metric: 'characterConcepts', value: 9, detail: 'Hero + companions' },
  { category: 'illustration', metric: 'scenes', value: 6, detail: 'Key panel renders' },
  { category: 'illustration', metric: 'palettes', value: 3, detail: 'Palette studies' },
  { category: 'marketing', metric: 'assets', value: 12, detail: 'Campaign kit ready' },
  { category: 'marketing', metric: 'campaigns', value: 2, detail: 'Genre playbooks' },
  { category: 'quality', metric: 'revisionsLogged', value: 11, detail: 'Art + audio notes' },
  { category: 'quality', metric: 'revisionsResolved', value: 8, detail: 'Addressed items' },
];
