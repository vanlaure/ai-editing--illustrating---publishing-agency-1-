import React from 'react';
import { HistoryItem } from '../types';
import { BotIcon, UserIcon } from './icons/IconDefs';

interface HistoryPanelProps {
  history: HistoryItem[];
}

const HistoryCard: React.FC<{ item: HistoryItem }> = ({ item }) => {
  const Icon = item.type === 'agent' ? BotIcon : UserIcon;
  const title = item.type === 'agent' ? 'AI Response' : 'Your Prompt';
  const contentPreview = item.content.length > 100 ? `${item.content.substring(0, 100)}...` : item.content;

  return (
    <div className="p-3 bg-brand-bg rounded-lg text-sm">
      <div className="flex items-center gap-2 mb-2 font-semibold">
        <Icon className="w-4 h-4 text-brand-primary" />
        <span className="truncate" title={item.prompt}>{title}: "{item.prompt}"</span>
      </div>
      <p className="text-brand-text-secondary pl-6 border-l-2 border-brand-border ml-2 text-xs" title={item.content}>
        {contentPreview}
      </p>
    </div>
  );
};

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ history }) => {
  const historyContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (historyContainerRef.current) {
        historyContainerRef.current.scrollTop = 0;
    }
  }, [history]);

  return (
    <div className="flex-shrink-0 border-t border-brand-border pt-4 flex flex-col space-y-2 overflow-hidden">
       <h3 className="text-base font-semibold px-2">History</h3>
       <div ref={historyContainerRef} className="flex-grow space-y-2 px-1 pb-2 overflow-y-auto max-h-64">
         {history.length === 0 ? (
           <p className="text-sm text-brand-text-secondary px-2">Your interactions with the AI will appear here.</p>
         ) : (
            history.map(item => <HistoryCard key={item.id} item={item} />)
         )}
       </div>
    </div>
  );
};