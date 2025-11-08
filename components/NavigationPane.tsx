import React, { useMemo } from 'react';
import { Editor } from '@tiptap/core';
import { OutlineItem, PacingBeat, ContinuityEvent, ManuscriptSegment } from '../types';
import { PanelLeftIcon, Loader2Icon } from './icons/IconDefs';

const PacingChart: React.FC<{ beats: PacingBeat[] }> = ({ beats }) => {
  const points = useMemo(() => {
    if (!beats.length) return '';
    const width = 200;
    const height = 60;
    const safeBeats = beats.slice(0, 12);
    return safeBeats
      .map((beat, index) => {
        const x = (index / (safeBeats.length - 1 || 1)) * width;
        const y = height - (Math.min(Math.max(beat.intensity, 0), 100) / 100) * height;
        return `${x},${y}`;
      })
      .join(' ');
  }, [beats]);

  if (!beats.length) {
    return <p className="text-xs text-brand-text-muted">Run the pacing agent to visualize beats.</p>;
  }

  return (
    <div className="space-y-1">
      <svg viewBox="0 0 200 60" className="w-full h-16 text-brand-primary/80">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
      <div className="flex flex-wrap gap-1 text-[10px] text-brand-text-secondary">
        {beats.slice(0, 4).map((beat) => (
          <span key={beat.id} className="px-2 py-0.5 rounded-full bg-brand-border/30">
            {beat.beatType}: {beat.intensity}%
          </span>
        ))}
      </div>
    </div>
  );
};

const MiniTimeline: React.FC<{ events: ContinuityEvent[] }> = ({ events }) => {
  if (!events.length) {
    return <p className="text-xs text-brand-text-muted">Run the timeline agent to catch continuity drift.</p>;
  }
  return (
    <div className="space-y-3">
      {events.slice(0, 4).map((event) => (
        <div key={event.id} className="flex gap-2">
          <div className="flex flex-col items-center">
            <span
              className={`w-2 h-2 rounded-full ${
                event.risk === 'high'
                  ? 'bg-red-500'
                  : event.risk === 'medium'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
            />
            <span className="flex-1 w-px bg-brand-border/60" />
          </div>
          <div className="flex-1 text-xs space-y-0.5">
            <p className="font-semibold text-brand-text">{event.label}</p>
            <p className="text-brand-text-muted leading-snug">{event.summary}</p>
            <p className="text-[10px] text-brand-text-secondary">{event.recommendation}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

interface NavigationPaneProps {
  isOpen: boolean;
  outline: OutlineItem[];
  editor: Editor | null;
  pacingBeats: PacingBeat[];
  timelineEvents: ContinuityEvent[];
  onRunPacing: () => void;
  onRunTimeline: () => void;
  isAnalyzingPacing: boolean;
  isBuildingTimeline: boolean;
  manuscriptIndex: ManuscriptSegment[];
  onSyncIndex: () => void;
  isIndexingIndex: boolean;
  lastIndexedAt: string | null;
}

export const NavigationPane: React.FC<NavigationPaneProps> = ({ isOpen, outline, editor, pacingBeats, timelineEvents, onRunPacing, onRunTimeline, isAnalyzingPacing, isBuildingTimeline, manuscriptIndex, onSyncIndex, isIndexingIndex, lastIndexedAt }) => {
  if (!isOpen) {
    return null;
  }

  const handleItemClick = (pos: number) => {
    if (!editor) return;
    editor.commands.focus();
    // Set the selection at the start of the heading node
    editor.commands.setTextSelection(pos + 1);
    editor.commands.scrollIntoView();
  };

  return (
    <div className="w-64 bg-brand-surface flex-shrink-0 flex flex-col no-print no-focus border-r border-brand-border">
      <div className="p-4 border-b border-brand-border flex items-center gap-3">
        <PanelLeftIcon className="w-6 h-6 text-brand-primary" />
        <h2 className="text-lg font-bold">Document Outline</h2>
      </div>
      <div className="flex-grow overflow-y-auto space-y-4">
        <div>
          {outline.length > 0 ? (
            <ul className="p-2 space-y-1">
              {outline.map(item => (
                <li key={item.id}>
                  <button
                    onClick={() => handleItemClick(item.pos)}
                    className={`w-full text-left text-sm px-2 py-1.5 rounded-md hover:bg-brand-border transition-colors truncate ${item.level === 2 ? 'pl-6' : 'font-semibold'}`}
                    title={item.text}
                  >
                    {item.text || "Untitled Heading"}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-center text-brand-text-secondary p-4">
              No headings found. Add H1 or H2 headings to your document to build an outline.
            </p>
          )}
        </div>
        <div className="border-t border-brand-border/70 px-4 pt-4 pb-3 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-brand-text">Knowledge Index</p>
              <p className="text-[11px] text-brand-text-muted">
                {manuscriptIndex.length} segments synced
                {lastIndexedAt && (
                  <span className="block">Last sync: {new Date(lastIndexedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                )}
              </p>
            </div>
            <button
              onClick={onSyncIndex}
              disabled={isIndexingIndex}
              className="text-xs px-2 py-1 rounded-md border border-brand-border/70 hover:border-brand-primary disabled:opacity-50"
            >
              {isIndexingIndex ? 'Syncing…' : 'Sync'}
            </button>
          </div>
          <div className="space-y-1 text-[11px] text-brand-text-secondary max-h-24 overflow-y-auto pr-1">
            {manuscriptIndex.slice(0, 3).map((segment) => (
              <div key={segment.id} className="border border-brand-border/40 rounded-md px-2 py-1">
                <p className="font-semibold text-brand-text text-xs truncate">{segment.heading}</p>
                <p className="truncate">{segment.summary}</p>
              </div>
            ))}
            {manuscriptIndex.length === 0 && (
              <p>No segments yet. Sync to index the manuscript for smarter chat answers.</p>
            )}
          </div>
        </div>
        <div className="border-t border-brand-border/70 px-4 pt-4 pb-3 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-brand-text">Story Pacing</p>
              <p className="text-[11px] text-brand-text-muted">Map intensity across beats</p>
            </div>
            <button
              onClick={onRunPacing}
              disabled={isAnalyzingPacing}
              className="text-xs px-2 py-1 rounded-md border border-brand-border/70 hover:border-brand-primary disabled:opacity-50"
            >
              {isAnalyzingPacing ? (
                <span className="inline-flex items-center gap-1"><Loader2Icon className="w-3 h-3 animate-spin" /> Analyzing</span>
              ) : 'Refresh'}
            </button>
          </div>
          <PacingChart beats={pacingBeats} />
        </div>
        <div className="border-t border-brand-border/70 px-4 pt-4 pb-3 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-brand-text">Continuity Timeline</p>
              <p className="text-[11px] text-brand-text-muted">Track chronology + risks</p>
            </div>
            <button
              onClick={onRunTimeline}
              disabled={isBuildingTimeline}
              className="text-xs px-2 py-1 rounded-md border border-brand-border/70 hover:border-brand-primary disabled:opacity-50"
            >
              {isBuildingTimeline ? (
                <span className="inline-flex items-center gap-1"><Loader2Icon className="w-3 h-3 animate-spin" /> Building</span>
              ) : 'Refresh'}
            </button>
          </div>
          <MiniTimeline events={timelineEvents} />
        </div>
      </div>
    </div>
  );
};
