import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const uuidState = vi.hoisted(() => ({ calls: 0 }));

vi.mock('uuid', () => ({
  v4: () => {
    uuidState.calls += 1;
    return `mock-uuid-${uuidState.calls}`;
  },
}));

const geminiMocks = vi.hoisted(() => ({
  generateVideos: vi.fn(),
  generateContent: vi.fn(),
  generateImages: vi.fn(),
  getVideosOperation: vi.fn(),
}));

vi.mock('@google/genai', () => {
  const mocks = geminiMocks;

  class FakeGoogleGenAI {
    models = {
      generateVideos: mocks.generateVideos,
      generateContent: mocks.generateContent,
      generateImages: mocks.generateImages,
    };

    operations = {
      getVideosOperation: mocks.getVideosOperation,
    };

    constructor() {
      // no-op
    }
  }

  return {
    GoogleGenAI: FakeGoogleGenAI,
    Modality: { IMAGE: 'IMAGE', AUDIO: 'AUDIO' },
    Type: { ARRAY: 'ARRAY', STRING: 'STRING' },
  };
});

import { createWavBlobFromBase64 } from '../utils/audioUtils';
import { clampEvents, createDefaultTelemetry, loadTelemetry, persistTelemetry, TelemetryEvent } from '../utils/telemetry';
import { fetchRetailerRequirements, assembleRetailerSubmission } from '../services/publishingService';
import { loadRightsRecords, addRightsRecord, updateRightsStatus, replaceRightsRecords } from '../services/rightsService';
import { backendClient } from '../services/backendClient';
import { syncTelemetrySnapshot } from '../services/analyticsService';
import { realtimeCollabClient } from '../services/realtimeCollabClient';
import {
  generateVideo,
  getVideoOperationStatus,
  generateVideoPrompt,
  editImage,
  generateSpeech,
  generateAudiobook,
  generateImages,
  generateMoodboardPrompts,
} from '../services/geminiService';

type FetchMock = ReturnType<typeof vi.fn>;

describe('audio utilities', () => {
  it('creates WAV blobs with PCM payload', async () => {
    const base64 = Buffer.from([0, 1, 2, 3]).toString('base64');
    const blob = createWavBlobFromBase64(base64);
    expect(blob.type).toBe('audio/wav');
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect(bytes.byteLength).toBe(44 + 4);
    expect(bytes.slice(44)).toEqual(Uint8Array.from([0, 1, 2, 3]));
  });
});

describe('telemetry utils', () => {
  it('creates zeroed default telemetry snapshots', () => {
    const snapshot = createDefaultTelemetry();
    expect(snapshot.events).toEqual([]);
    expect(snapshot.counters.editing.wordsAuthored).toBe(0);
  });

  it('loads telemetry from storage, merges defaults, and clamps events', () => {
    const storedEvents: TelemetryEvent[] = Array.from({ length: 210 }, (_, idx) => ({
      id: `event-${idx}`,
      category: 'editing',
      action: 'test',
      timestamp: new Date().toISOString(),
    }));
    const stored = {
      counters: {
        editing: {
          wordsAuthored: 42,
        },
      },
      events: storedEvents,
      lastUpdated: '2024-01-01T00:00:00.000Z',
    };
    window.localStorage.setItem('ai-agency-telemetry', JSON.stringify(stored));
    const snapshot = loadTelemetry();
    expect(snapshot.counters.editing.wordsAuthored).toBe(42);
    expect(snapshot.counters.marketing.campaigns).toBe(0);
    expect(snapshot.events).toHaveLength(200);
  });

  it('persists telemetry snapshots to storage', () => {
    const snapshot = createDefaultTelemetry();
    snapshot.counters.editing.wordsAuthored = 5;
    persistTelemetry(snapshot);
    const stored = JSON.parse(window.localStorage.getItem('ai-agency-telemetry')!);
    expect(stored.counters.editing.wordsAuthored).toBe(5);
  });

  it('clamps event arrays to the configured limit', () => {
    const events: TelemetryEvent[] = Array.from({ length: 5 }, (_, idx) => ({
      id: `event-${idx}`,
      category: 'editing',
      action: 'demo',
      timestamp: new Date().toISOString(),
    }));
    expect(clampEvents(events)).toHaveLength(5);
    expect(clampEvents(events).map((event) => event.id)).toEqual(events.map((event) => event.id));
  });
});

describe('rights service', () => {
  beforeEach(() => {
    uuidState.calls = 0;
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-02-01T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds, loads, and updates rights records', () => {
    expect(loadRightsRecords()).toEqual([]);
    const record = addRightsRecord({
      assetName: 'Key Art',
      assetType: 'illustration',
      licenseType: 'exclusive',
      status: 'pending',
      notes: 'Awaiting contract',
    });
    expect(record.id).toBe('mock-uuid-1');
    expect(record.createdAt).toBe('2024-02-01T00:00:00.000Z');

    const updated = updateRightsStatus(record.id, 'restricted');
    expect(updated?.status).toBe('restricted');
    expect(loadRightsRecords()).toHaveLength(1);
  });

  it('replaces records wholesale', () => {
    addRightsRecord({
      assetName: 'Audio Master',
      assetType: 'audio',
      licenseType: 'work-for-hire',
      status: 'pending',
      notes: 'Original',
    });
    replaceRightsRecords([
      {
        id: 'external',
        assetName: 'Injected',
        assetType: 'illustration',
        licenseType: 'exclusive',
        status: 'clear',
        notes: 'Replaced',
        createdAt: '2023-01-01T00:00:00.000Z',
      },
    ]);
    expect(loadRightsRecords()).toEqual([
      {
        id: 'external',
        assetName: 'Injected',
        assetType: 'illustration',
        licenseType: 'exclusive',
        status: 'clear',
        notes: 'Replaced',
        createdAt: '2023-01-01T00:00:00.000Z',
      },
    ]);
  });
});

describe('publishing service', () => {
  it('clones base retailer requirements', () => {
    const first = fetchRetailerRequirements();
    first[0].status = 'ready';
    const second = fetchRetailerRequirements();
    expect(second[0].status).toBe('pending');
    expect(first).toHaveLength(5);
  });

  it('assembles retailer submissions and reports missing assets', () => {
    const submission = assembleRetailerSubmission('Amazon KDP', {
      manuscript: 'a'.repeat(400),
      blurb: '',
      keywords: ['one'],
      coverArt: null,
    });
    expect(submission.retailer).toBe('Amazon KDP');
    const missing = submission.assets.filter((asset) => asset.status === 'missing');
    expect(missing).toHaveLength(6);
    expect(submission.priorityNotes).toContain('Need 6 more assets');
  });
});

describe('backend client', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn() as unknown as typeof fetch;
  });

  it('posts manuscript sync payloads', async () => {
    const response = {
      ok: true,
      json: vi.fn().mockResolvedValue({ documentId: 'doc-1', segments: [] }),
    };
    (globalThis.fetch as unknown as FetchMock).mockResolvedValue(response as unknown as Response);

    const result = await backendClient.syncIndex('doc-1', 'hello world');
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/documents', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId: 'doc-1', text: 'hello world' }),
    }));
    expect(result.documentId).toBe('doc-1');
  });

  it('surfaces API errors with useful context', async () => {
    const response = {
      ok: false,
      json: vi.fn().mockResolvedValue({ error: 'Nope' }),
    };
    (globalThis.fetch as unknown as FetchMock).mockResolvedValue(response as unknown as Response);

    await expect(backendClient.runComplianceScan('text')).rejects.toThrow(/Nope/);
  });
});

describe('analytics service', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_ANALYTICS_ENDPOINT', 'https://example.com/analytics');
    vi.stubEnv('VITE_STUDIO_ID', 'studio-abc');
    globalThis.fetch = vi.fn() as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('skips sync when endpoint is missing', async () => {
    vi.stubEnv('VITE_ANALYTICS_ENDPOINT', '');
    await syncTelemetrySnapshot(createDefaultTelemetry());
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('sends telemetry snapshots to the configured endpoint', async () => {
    (globalThis.fetch as unknown as FetchMock).mockResolvedValue({ ok: true } as unknown as Response);
    await syncTelemetrySnapshot(createDefaultTelemetry());
    expect(globalThis.fetch).toHaveBeenCalledWith('https://example.com/analytics', expect.objectContaining({
      method: 'POST',
    }));
  });
});

describe('realtime collaboration client', () => {
  const docId = 'doc-1';
  const anchor = { from: 0, to: 5, excerpt: 'Hello' };
  const collaborator = { id: 'c1', name: 'Ava' };

  beforeEach(() => {
    uuidState.calls = 0;
    window.localStorage.clear();
  });

  it('supports subscription-driven thread updates', () => {
    const received: any[] = [];
    const unsubscribe = realtimeCollabClient.subscribeToThreads(docId, (threads) => {
      received.push(threads);
    });
    expect(received[0]).toEqual([]);
    const thread = realtimeCollabClient.createThread(docId, anchor, collaborator, 'First message');
    expect(received.at(-1)?.[0]?.id).toBe(thread.id);
    unsubscribe();
  });

  it('manages comment thread lifecycle', () => {
    const thread = realtimeCollabClient.createThread(docId, anchor, collaborator, 'Discuss');
    const reply = realtimeCollabClient.addReply(docId, thread.id, collaborator, 'Reply');
    expect(reply?.messages).toHaveLength(2);
    const updated = realtimeCollabClient.updateThreadStatus(docId, thread.id, 'resolved');
    expect(updated?.status).toBe('resolved');
    realtimeCollabClient.deleteThread(docId, thread.id);
    expect(realtimeCollabClient.getThreads(docId)).toEqual([]);
  });

  it('tracks and prunes collaborator presence', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-03-01T00:00:00.000Z'));
    realtimeCollabClient.updatePresence(docId, collaborator, 'editing', 10);
    expect(Object.keys(realtimeCollabClient.getPresenceSnapshot(docId))).toContain('c1');
    vi.advanceTimersByTime(20_000);
    expect(realtimeCollabClient.getPresenceSnapshot(docId)).toEqual({});
    vi.useRealTimers();
  });
});

describe('gemini service', () => {
  beforeEach(() => {
    geminiMocks.generateVideos.mockReset();
    geminiMocks.generateContent.mockReset();
    geminiMocks.generateImages.mockReset();
    geminiMocks.getVideosOperation.mockReset();
  });

  it('kicks off video generation jobs', async () => {
    geminiMocks.generateVideos.mockResolvedValue({ name: 'operations/123' });
    const result = await generateVideo('prompt', '16:9');
    expect(result).toEqual({ name: 'operations/123' });
    expect(geminiMocks.generateVideos).toHaveBeenCalledWith(expect.objectContaining({
      model: 'veo-3.1-fast-generate-preview',
    }));
  });

  it('polls video operation status', async () => {
    geminiMocks.getVideosOperation.mockResolvedValue({ done: true });
    const result = await getVideoOperationStatus('operations/123');
    expect(result.done).toBe(true);
  });

  it('creates video prompts from manuscripts', async () => {
    geminiMocks.generateContent.mockResolvedValue({ text: 'Cinematic prompt' });
    await expect(generateVideoPrompt('manuscript text')).resolves.toBe('Cinematic prompt');
  });

  it('edits images and returns inline data payloads', async () => {
    geminiMocks.generateContent.mockResolvedValue({
      candidates: [
        {
          content: {
            parts: [
              { inlineData: { data: 'base64-image' } },
            ],
          },
        },
      ],
    });
    await expect(editImage('img', 'prompt')).resolves.toBe('base64-image');
  });

  it('generates speech and audiobook clips', async () => {
    const payload = {
      candidates: [
        {
          content: {
            parts: [{ inlineData: { data: 'audio-bytes' } }],
          },
        },
      ],
    };
    geminiMocks.generateContent.mockResolvedValue(payload);
    expect(await generateSpeech('hello')).toBe('audio-bytes');

    geminiMocks.generateContent.mockResolvedValue(payload);
    expect(await generateAudiobook('hello', 'narration')).toBe('audio-bytes');
  });

  it('generates images', async () => {
    geminiMocks.generateImages.mockResolvedValue({
      generatedImages: [{ image: { imageBytes: 'img-1' } }, { image: { imageBytes: 'img-2' } }],
    });
    const images = await generateImages('prompt', 2, '1:1');
    expect(images).toEqual(['img-1', 'img-2']);
  });

  it('produces structured moodboard prompts', async () => {
    geminiMocks.generateContent.mockResolvedValue({
      text: '["one","two"]',
    });
    const prompts = await generateMoodboardPrompts('scene');
    expect(prompts).toEqual(['one', 'two']);
  });
});
