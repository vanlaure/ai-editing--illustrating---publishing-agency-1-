import React from 'react';
import { PlayIcon, PauseIcon, XCircleIcon, UsersIcon, MessageSquareIcon } from './icons/IconDefs';

export type TtsStatus = 'idle' | 'generating' | 'playing' | 'paused';

interface StatusBarProps {
  wordCount: { total: number, selection: number };
  charCount: { total: number, selection: number };
  writingGoal: number;
  ttsStatus: TtsStatus;
  onTtsPlayPause: () => void;
  onTtsStop: () => void;
  collaboratorsOnline?: number;
  openCommentCount?: number;
  onOpenComments?: () => void;
}

const AudioPlayer: React.FC<Pick<StatusBarProps, 'ttsStatus' | 'onTtsPlayPause' | 'onTtsStop'>> = ({ ttsStatus, onTtsPlayPause, onTtsStop }) => {
    if (ttsStatus === 'idle') return null;

    const statusText = {
        generating: 'Generating audio...',
        playing: 'Playing audio...',
        paused: 'Audio paused',
    }[ttsStatus];

    return (
        <div className="flex items-center gap-2 text-brand-text">
            <span>{statusText}</span>
            <div className="w-px h-4 bg-brand-border"></div>
            {ttsStatus !== 'generating' && (
                <button onClick={onTtsPlayPause} className="hover:text-brand-primary">
                    {ttsStatus === 'playing' ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
                </button>
            )}
            <button onClick={onTtsStop} className="hover:text-brand-primary">
                <XCircleIcon className="w-4 h-4" />
            </button>
        </div>
    );
};

export const StatusBar: React.FC<StatusBarProps> = ({ wordCount, charCount, writingGoal, ttsStatus, onTtsPlayPause, onTtsStop, collaboratorsOnline, openCommentCount, onOpenComments }) => {
  const progress = writingGoal > 0 ? Math.min((wordCount.total / writingGoal) * 100, 100) : 0;

  const wordDisplay = wordCount.selection > 0 ? `${wordCount.selection} / ${wordCount.total}` : wordCount.total;
  const charDisplay = charCount.selection > 0 ? `${charCount.selection} / ${charCount.total}` : charCount.total;

  return (
    <div className="bg-brand-surface px-4 py-1 flex items-center justify-between text-xs text-brand-text-secondary no-print border-t border-brand-border">
      <div className="flex items-center gap-4">
        <span>Words: {wordDisplay}</span>
        <span>Characters: {charDisplay}</span>
      </div>
      <div className="flex items-center gap-4">
        {typeof collaboratorsOnline === 'number' && (
          <div className="inline-flex items-center gap-1 text-brand-text">
            <UsersIcon className="w-3.5 h-3.5" />
            <span>{collaboratorsOnline} online</span>
          </div>
        )}
        {typeof openCommentCount === 'number' && (
          <button
            onClick={onOpenComments}
            className="inline-flex items-center gap-1 text-brand-text hover:text-brand-primary"
          >
            <MessageSquareIcon className="w-3.5 h-3.5" />
            <span>{openCommentCount} comments</span>
          </button>
        )}
        {writingGoal > 0 && (
            <div className="flex items-center gap-2 w-48">
            <span>Goal:</span>
            <div className="w-full bg-brand-border rounded-full h-1.5">
                <div
                className="bg-brand-primary h-1.5 rounded-full"
                style={{ width: `${progress}%` }}
                ></div>
            </div>
            <span>{Math.round(progress)}%</span>
            </div>
        )}
        <AudioPlayer ttsStatus={ttsStatus} onTtsPlayPause={onTtsPlayPause} onTtsStop={onTtsStop} />
      </div>
    </div>
  );
};
