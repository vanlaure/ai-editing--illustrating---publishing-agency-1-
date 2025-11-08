export type TelemetryCategory = 'editing' | 'illustration' | 'audiobooks' | 'marketing' | 'quality';

export interface TelemetryEvent {
  id: string;
  category: TelemetryCategory;
  action: string;
  detail?: string;
  value?: number;
  timestamp: string;
}

export interface TelemetryCounters {
  editing: Record<string, number>;
  illustration: Record<string, number>;
  audiobooks: Record<string, number>;
  marketing: Record<string, number>;
  quality: Record<string, number>;
}

export interface TelemetrySnapshot {
  counters: TelemetryCounters;
  events: TelemetryEvent[];
  lastUpdated: string;
}

const STORAGE_KEY = 'ai-agency-telemetry';
const EVENT_LIMIT = 200;

export const createDefaultTelemetry = (): TelemetrySnapshot => ({
  counters: {
    editing: {
      wordsAuthored: 0,
      aiCommands: 0,
      grammarChecks: 0,
      factChecks: 0,
      consistencyAudits: 0,
      sensitivityPasses: 0,
      dialogueAudits: 0,
      structureAudits: 0,
      cleanupRuns: 0,
    },
    illustration: {
      moodboards: 0,
      characterConcepts: 0,
      expressions: 0,
      poses: 0,
      variations: 0,
      turnarounds: 0,
      scenes: 0,
      panels: 0,
      palettes: 0,
      styleGuides: 0,
    },
    audiobooks: {
      projectsCreated: 0,
      stageTransitions: 0,
      distributions: 0,
    },
    marketing: {
      campaigns: 0,
      assets: 0,
      reviewers: 0,
      emailSequences: 0,
    },
    quality: {
      revisionsLogged: 0,
      revisionsResolved: 0,
    },
  },
  events: [],
  lastUpdated: new Date().toISOString(),
});

export const loadTelemetry = (): TelemetrySnapshot => {
  if (typeof window === 'undefined') {
    return createDefaultTelemetry();
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return createDefaultTelemetry();
    const parsed = JSON.parse(stored) as TelemetrySnapshot;
    return {
      ...createDefaultTelemetry(),
      ...parsed,
      counters: {
        editing: { ...createDefaultTelemetry().counters.editing, ...parsed.counters?.editing },
        illustration: { ...createDefaultTelemetry().counters.illustration, ...parsed.counters?.illustration },
        audiobooks: { ...createDefaultTelemetry().counters.audiobooks, ...parsed.counters?.audiobooks },
        marketing: { ...createDefaultTelemetry().counters.marketing, ...parsed.counters?.marketing },
        quality: { ...createDefaultTelemetry().counters.quality, ...parsed.counters?.quality },
      },
      events: parsed.events?.slice(0, EVENT_LIMIT) || [],
    };
  } catch (error) {
    console.warn('Failed to load telemetry snapshot', error);
    return createDefaultTelemetry();
  }
};

export const persistTelemetry = (snapshot: TelemetrySnapshot) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch (error) {
    console.warn('Failed to persist telemetry snapshot', error);
  }
};

export const clampEvents = (events: TelemetryEvent[]): TelemetryEvent[] =>
  events.slice(0, EVENT_LIMIT);
