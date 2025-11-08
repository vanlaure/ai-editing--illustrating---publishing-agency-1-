import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  Collaborator,
  CollaborationPresence,
  CollaboratorPresenceState,
  CommentAnchor,
  CommentThread,
} from '../types';
import { realtimeCollabClient } from '../services/realtimeCollabClient';

const HEARTBEAT_INTERVAL = 5000;

export type UseCollaborativeDocumentReturn = {
  isConnected: boolean;
  collaboratorsOnline: number;
  presence: Record<string, CollaborationPresence>;
  commentThreads: CommentThread[];
  addThread: (anchor: CommentAnchor, content: string) => CommentThread | null;
  addReply: (threadId: string, content: string) => void;
  resolveThread: (threadId: string) => void;
  reopenThread: (threadId: string) => void;
  removeThread: (threadId: string) => void;
  broadcastPresence: (state: CollaboratorPresenceState, cursorPos: number) => void;
};

export const useCollaborativeDocument = (
  docId: string,
  currentUser: Collaborator,
): UseCollaborativeDocumentReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [presence, setPresence] = useState<Record<string, CollaborationPresence>>(() =>
    realtimeCollabClient.getPresenceSnapshot(docId),
  );
  const [commentThreads, setCommentThreads] = useState<CommentThread[]>(() =>
    realtimeCollabClient.getThreads(docId),
  );
  const heartbeatRef = useRef<number | null>(null);

  useEffect(() => {
    setIsConnected(true);
    const unsubscribePresence = realtimeCollabClient.subscribeToPresence(docId, (snapshot) => {
      setPresence(snapshot);
    });
    const unsubscribeThreads = realtimeCollabClient.subscribeToThreads(docId, (threads) => {
      setCommentThreads(threads);
    });

    const pushHeartbeat = () => {
      realtimeCollabClient.updatePresence(docId, currentUser, 'idle', 0);
    };

    pushHeartbeat();
    heartbeatRef.current = window.setInterval(pushHeartbeat, HEARTBEAT_INTERVAL);

    return () => {
      unsubscribePresence();
      unsubscribeThreads();
      if (heartbeatRef.current) {
        window.clearInterval(heartbeatRef.current);
      }
      realtimeCollabClient.removePresence(docId, currentUser.id);
    };
  }, [currentUser, docId]);

  const broadcastPresence = useCallback(
    (state: CollaboratorPresenceState, cursorPos: number) => {
      if (typeof window === 'undefined') return;
      const snapshot = realtimeCollabClient.updatePresence(docId, currentUser, state, cursorPos);
      setPresence(snapshot);
    },
    [currentUser, docId],
  );

  const addThread = useCallback(
    (anchor: CommentAnchor, content: string) => {
      if (!content.trim()) return null;
      const created = realtimeCollabClient.createThread(docId, anchor, currentUser, content.trim());
      setCommentThreads((prev) => [...prev, created]);
      return created;
    },
    [currentUser, docId],
  );

  const addReply = useCallback(
    (threadId: string, content: string) => {
      if (!content.trim()) return;
      const updated = realtimeCollabClient.addReply(docId, threadId, currentUser, content.trim());
      if (updated) {
        setCommentThreads((prev) => prev.map((thread) => (thread.id === updated.id ? updated : thread)));
      }
    },
    [currentUser, docId],
  );

  const resolveThread = useCallback(
    (threadId: string) => {
      const updated = realtimeCollabClient.updateThreadStatus(docId, threadId, 'resolved');
      if (updated) {
        setCommentThreads((prev) => prev.map((thread) => (thread.id === updated.id ? updated : thread)));
      }
    },
    [docId],
  );

  const reopenThread = useCallback(
    (threadId: string) => {
      const updated = realtimeCollabClient.updateThreadStatus(docId, threadId, 'open');
      if (updated) {
        setCommentThreads((prev) => prev.map((thread) => (thread.id === updated.id ? updated : thread)));
      }
    },
    [docId],
  );

  const removeThread = useCallback(
    (threadId: string) => {
      realtimeCollabClient.deleteThread(docId, threadId);
      setCommentThreads((prev) => prev.filter((thread) => thread.id !== threadId));
    },
    [docId],
  );

  const collaboratorsOnline = useMemo(() => Object.keys(presence).length, [presence]);

  return {
    isConnected,
    collaboratorsOnline,
    presence,
    commentThreads,
    addThread,
    addReply,
    resolveThread,
    reopenThread,
    removeThread,
    broadcastPresence,
  };
};
