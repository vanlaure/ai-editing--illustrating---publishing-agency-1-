import React from 'react';
import type { Storyboard, CreativeBrief, SongAnalysis } from '../types';
import StitchStreamStudio from './StitchStreamStudio';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyboard: Storyboard | null;
  songFile: File | null;
  audioUrl?: string | null;
  creativeBrief?: CreativeBrief | null;
  songAnalysis?: SongAnalysis | null;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, storyboard, songFile, audioUrl, creativeBrief, songAnalysis }) => {
  if (!isOpen || !storyboard) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start md:items-center justify-center z-50 overflow-y-auto"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-brand-gray border border-brand-light-gray/30 shadow-2xl shadow-black/50 rounded-2xl w-full max-w-6xl m-6 p-6 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-brand-light-gray/80">Final Assembly</p>
            <h2 className="text-2xl font-bold text-white">StitchStream AI Director Studio</h2>
            <p className="text-sm text-gray-300">
              Drag clips, apply Gemini-powered color and transitions, preview VFX, and record the final cut to WebM.
            </p>
          </div>
          <button
            onClick={onClose}
            className="self-start md:self-auto text-gray-400 hover:text-white transition-colors"
            aria-label="Close export"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <StitchStreamStudio
          storyboard={storyboard}
          songFile={songFile}
          audioUrl={audioUrl || undefined}
          creativeBrief={creativeBrief || undefined}
          songAnalysis={songAnalysis || undefined}
        />
      </div>
    </div>
  );
};

export default ExportModal;
