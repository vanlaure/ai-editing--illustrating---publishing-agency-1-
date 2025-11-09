import React, { useLayoutEffect, useState } from 'react';
import { EditorView } from '@tiptap/pm/view';
import { ManuscriptSuggestion } from '../types';
import { CheckCircleIcon } from './icons/IconDefs';

interface SuggestionBubbleProps {
  issue: ManuscriptSuggestion;
  onAccept: () => void;
  onReject: () => void;
  onClose: () => void;
  editorView: EditorView;
}

export const SuggestionBubble: React.FC<SuggestionBubbleProps> = ({ issue, onAccept, onReject, onClose, editorView }) => {
  const [style, setStyle] = useState<React.CSSProperties>({
    opacity: 0,
    position: 'absolute',
  });

  useLayoutEffect(() => {
    const { from } = editorView.state.selection;
    const { top, left, height } = editorView.coordsAtPos(from);
    const editorBoundaries = editorView.dom.getBoundingClientRect();
    
    setStyle({
      opacity: 1,
      position: 'absolute',
      top: top - editorBoundaries.top + height + 5,
      left: left - editorBoundaries.left,
      transform: 'translateX(-50%)',
    });
  }, [issue, editorView]);


  const typeColor = ({
    spelling: 'border-red-500 bg-red-500/10 text-red-400',
    grammar: 'border-blue-500 bg-blue-500/10 text-blue-400',
    style: 'border-green-500 bg-green-500/10 text-green-400',
    narrative: 'border-amber-500 bg-amber-500/10 text-amber-400',
    polish: 'border-purple-500 bg-purple-500/10 text-purple-400',
    sensitivity: 'border-pink-500 bg-pink-500/10 text-pink-400',
  } as const)[issue.type] || 'border-brand-border bg-brand-border/10 text-brand-text-secondary';

  return (
    <div
      className="z-10 bg-brand-surface border border-brand-border rounded-lg shadow-2xl p-3 w-72 transition-opacity"
      style={style}
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="flex justify-between items-start mb-2">
        <p className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${typeColor}`}>
          {issue.type}
        </p>
        <button onClick={onClose} className="text-brand-text-secondary hover:text-brand-text text-xl leading-none">&times;</button>
      </div>
      <p className="text-sm text-brand-text-secondary mb-2">{issue.explanation}</p>
      
      <div className="bg-brand-bg/50 p-2 rounded-md">
        <p className="text-xs text-brand-text-secondary line-through">{issue.original}</p>
        <p className="text-sm text-brand-text font-semibold">{issue.suggestion}</p>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={onReject}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 font-semibold border border-brand-border rounded-md hover:bg-brand-border/60 transition-colors text-sm"
        >
          Reject
        </button>
        <button
          onClick={onAccept}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 font-semibold bg-brand-primary text-white rounded-md hover:bg-brand-primary-hover transition-colors text-sm"
        >
          <CheckCircleIcon className="w-4 h-4" />
          Accept
        </button>
      </div>
    </div>
  );
};
