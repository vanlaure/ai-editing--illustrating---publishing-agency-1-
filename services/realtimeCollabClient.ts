import { CommentThread, CommentAnchor, Collaborator, CollaborationPresence, CommentMessage } from '../types';

type PresenceSnapshot = Record<string, CollaborationPresence>;

const THREADS_KEY = (docId: string) => `realtime:threads:${docId}`;
const PRESENCE_KEY = (docId: string) => `realtime:presence:${docId}`;
const PRESENCE_TTL = 15_000;

type ChannelListener = (payload: any) => void;

const listeners = new Map<string, Set<ChannelListener>>();

const getBroadcastChannel = (name: string) => {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
    return null;
  }
  const channel = new BroadcastChannel(name);
  channel.onmessage = (event) => {
    emitLocal(name, event.data);
  };
  return channel;
};

const channelRegistry: Record<string, BroadcastChannel | null> = {};

const ensureChannel = (name: string) => {
  if (!channelRegistry[name]) {
    channelRegistry[name] = getBroadcastChannel(name);
  }
  return channelRegistry[name];
};

const emitLocal = (name: string, payload: any) => {
  const localSet = listeners.get(name);
  if (!localSet) return;
  localSet.forEach((listener) => listener(payload));
};

const postMessage = (name: string, payload: any) => {
  ensureChannel(name)?.postMessage(payload);
  emitLocal(name, payload);
};

const subscribe = (name: string, listener: ChannelListener) => {
  if (!listeners.has(name)) {
    listeners.set(name, new Set());
  }
  listeners.get(name)!.add(listener);
  return () => {
    listeners.get(name)?.delete(listener);
  };
};

const readThreads = (docId: string): CommentThread[] => {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(THREADS_KEY(docId));
  if (!raw) return [];
  try {
    return JSON.parse(raw) as CommentThread[];
  } catch (error) {
    console.warn('Failed to parse threads payload', error);
    return [];
  }
};

const writeThreads = (docId: string, threads: CommentThread[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(THREADS_KEY(docId), JSON.stringify(threads));
  postMessage(`threads:${docId}`, { docId, threads });
};

const prunePresence = (snapshot: PresenceSnapshot): PresenceSnapshot => {
  const now = Date.now();
  return Object.fromEntries(
    Object.entries(snapshot).filter(([, presence]) => now - presence.lastHeartbeat < PRESENCE_TTL)
  );
};

const readPresence = (docId: string): PresenceSnapshot => {
  if (typeof window === 'undefined') return {};
  const raw = localStorage.getItem(PRESENCE_KEY(docId));
  if (!raw) return {};
  try {
    return prunePresence(JSON.parse(raw) as PresenceSnapshot);
  } catch (error) {
    console.warn('Failed to parse presence payload', error);
    return {};
  }
};

const writePresence = (docId: string, snapshot: PresenceSnapshot) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PRESENCE_KEY(docId), JSON.stringify(snapshot));
  postMessage(`presence:${docId}`, { docId, snapshot });
};

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

const upsertThread = (
  docId: string,
  mutator: (threads: CommentThread[]) => CommentThread[],
): CommentThread[] => {
  const current = readThreads(docId);
  const next = mutator(current);
  writeThreads(docId, next);
  return next;
};

export const realtimeCollabClient = {
  subscribeToThreads(docId: string, callback: (threads: CommentThread[]) => void) {
    callback(readThreads(docId));
    return subscribe(`threads:${docId}`, (payload) => {
      if (payload?.docId !== docId) return;
      callback(payload.threads as CommentThread[]);
    });
  },
  getThreads: readThreads,
  createThread(docId: string, anchor: CommentAnchor, author: Collaborator, content: string) {
    const now = new Date().toISOString();
    let newThread: CommentThread;
    upsertThread(docId, (threads) => {
      newThread = {
        id: createId(),
        anchor,
        status: 'open',
        messages: [
          {
            id: createId(),
            author,
            content,
            createdAt: now,
          },
        ],
        createdAt: now,
        updatedAt: now,
      };
      return [...threads, newThread!];
    });
    // @ts-ignore - defined before return
    return newThread!;
  },
  addReply(docId: string, threadId: string, author: Collaborator, content: string) {
    let updated: CommentThread | null = null;
    upsertThread(docId, (threads) =>
      threads.map((thread) => {
        if (thread.id !== threadId) return thread;
        const message: CommentMessage = {
          id: createId(),
          author,
          content,
          createdAt: new Date().toISOString(),
        };
        updated = {
          ...thread,
          messages: [...thread.messages, message],
          updatedAt: message.createdAt,
        };
        return updated!;
      }),
    );
    return updated;
  },
  updateThreadStatus(docId: string, threadId: string, status: CommentThread['status']) {
    let updated: CommentThread | null = null;
    upsertThread(docId, (threads) =>
      threads.map((thread) => {
        if (thread.id !== threadId) return thread;
        updated = { ...thread, status, updatedAt: new Date().toISOString() };
        return updated!;
      }),
    );
    return updated;
  },
  deleteThread(docId: string, threadId: string) {
    upsertThread(docId, (threads) => threads.filter((thread) => thread.id !== threadId));
  },
  subscribeToPresence(docId: string, callback: (snapshot: PresenceSnapshot) => void) {
    callback(readPresence(docId));
    return subscribe(`presence:${docId}`, (payload) => {
      if (payload?.docId !== docId) return;
      callback(prunePresence(payload.snapshot as PresenceSnapshot));
    });
  },
  getPresenceSnapshot: readPresence,
  updatePresence(docId: string, collaborator: Collaborator, state: CollaborationPresence['state'], cursorPos: number) {
    const snapshot = prunePresence(readPresence(docId));
    snapshot[collaborator.id] = {
      collaborator,
      cursorPos,
      state,
      lastHeartbeat: Date.now(),
    };
    writePresence(docId, snapshot);
    return snapshot;
  },
  removePresence(docId: string, collaboratorId: string) {
    const snapshot = readPresence(docId);
    delete snapshot[collaboratorId];
    writePresence(docId, snapshot);
  },
};
