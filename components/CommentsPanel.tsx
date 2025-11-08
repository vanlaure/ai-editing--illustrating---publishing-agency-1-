import React, { useMemo, useState } from 'react';
import type { CommentThread } from '../types';
import { XCircleIcon, SendIcon, CheckCircleIcon, UndoIcon, Trash2Icon } from './icons/IconDefs';

interface CommentsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  threads: CommentThread[];
  collaboratorsOnline: number;
  onCreateThread: (content: string) => void;
  onReply: (threadId: string, content: string) => void;
  onResolve: (threadId: string) => void;
  onReopen: (threadId: string) => void;
  onDelete: (threadId: string) => void;
  selectionAvailable: boolean;
}

const ThreadCard: React.FC<{
  thread: CommentThread;
  onReply: (content: string) => void;
  onResolve: () => void;
  onReopen: () => void;
  onDelete: () => void;
}> = ({ thread, onReply, onResolve, onReopen, onDelete }) => {
  const [reply, setReply] = useState('');

  const handleSubmit = () => {
    if (!reply.trim()) return;
    onReply(reply.trim());
    setReply('');
  };

  return (
    <div className="border border-brand-border/70 rounded-lg p-3 space-y-2 bg-brand-surface/80">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-brand-text-secondary uppercase tracking-wide">Selection</p>
          <p className="text-sm text-brand-text line-clamp-2">{thread.anchor.excerpt}</p>
        </div>
        <button
          className="text-brand-text-muted hover:text-brand-primary"
          onClick={onDelete}
          aria-label="Delete thread"
        >
          <Trash2Icon className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
        {thread.messages.map((message) => (
          <div key={message.id} className="rounded-md bg-brand-elevated/70 px-2 py-1">
            <div className="text-[11px] font-semibold text-brand-text">
              {message.author.name}
              <span className="ml-2 text-[10px] text-brand-text-muted">
                {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-xs text-brand-text-secondary whitespace-pre-wrap">{message.content}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 text-xs">
        {thread.status === 'open' ? (
          <button className="inline-flex items-center gap-1 text-green-500" onClick={onResolve}>
            <CheckCircleIcon className="w-3.5 h-3.5" /> Resolve
          </button>
        ) : (
          <button className="inline-flex items-center gap-1 text-brand-primary" onClick={onReopen}>
            <UndoIcon className="w-3.5 h-3.5" /> Reopen
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Reply..."
          className="flex-1 rounded-md bg-brand-bg border border-brand-border/70 px-2 py-1 text-sm"
        />
        <button
          onClick={handleSubmit}
          className="px-2 py-1 rounded-md bg-brand-primary text-white text-xs"
        >
          <SendIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export const CommentsPanel: React.FC<CommentsPanelProps> = ({
  isOpen,
  onClose,
  threads,
  collaboratorsOnline,
  onCreateThread,
  onReply,
  onResolve,
  onReopen,
  onDelete,
  selectionAvailable,
}) => {
  const [newComment, setNewComment] = useState('');

  const openThreads = useMemo(() => threads.filter((thread) => thread.status === 'open'), [threads]);

  if (!isOpen) return null;

  const handleCreate = () => {
    if (!newComment.trim()) return;
    onCreateThread(newComment.trim());
    setNewComment('');
  };

  return (
    <div className="fixed right-4 top-20 w-96 max-h-[80vh] rounded-xl border border-brand-border/70 bg-brand-surface/95 backdrop-blur-md shadow-2xl z-40 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border/70">
        <div>
          <h2 className="text-sm font-semibold text-brand-text">Comments</h2>
          <p className="text-[11px] text-brand-text-secondary">
            {openThreads.length} open • {collaboratorsOnline} active collaborators
          </p>
        </div>
        <button onClick={onClose} aria-label="Close comments" className="text-brand-text-secondary hover:text-brand-primary">
          <XCircleIcon className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4 space-y-3 overflow-y-auto flex-1">
        {threads.length === 0 && (
          <p className="text-sm text-brand-text-muted">
            No comment threads yet. Select text in the editor to anchor a new note.
          </p>
        )}
        {threads.map((thread) => (
          <ThreadCard
            key={thread.id}
            thread={thread}
            onReply={(content) => onReply(thread.id, content)}
            onResolve={() => onResolve(thread.id)}
            onReopen={() => onReopen(thread.id)}
            onDelete={() => onDelete(thread.id)}
          />
        ))}
      </div>
      <div className="border-t border-brand-border/70 p-4 space-y-2">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={selectionAvailable ? 'Add a comment to the selected text...' : 'Select text to add a comment'}
          className="w-full h-20 rounded-lg bg-brand-bg border border-brand-border/70 px-3 py-2 text-sm"
        />
        <button
          onClick={handleCreate}
          disabled={!selectionAvailable || !newComment.trim()}
          className="w-full py-2 rounded-lg bg-brand-primary text-white text-sm font-medium disabled:opacity-50"
        >
          Add Comment
        </button>
      </div>
    </div>
  );
};
