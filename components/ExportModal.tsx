import React from 'react';
import { DownloadIcon, PrinterIcon, WandIcon } from './icons/IconDefs';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'txt' | 'html') => void;
  onPrint: () => void;
  onCleanup: () => void;
  isCleaningUp: boolean;
}

const ExportButton: React.FC<{label: string, description: string, onClick: () => void, disabled?: boolean}> = 
  ({label, description, onClick, disabled}) => (
      <button
          onClick={onClick}
          disabled={disabled}
          className="w-full text-left p-4 rounded-lg bg-brand-bg hover:bg-brand-border transition-colors disabled:opacity-50 disabled:hover:bg-brand-bg"
      >
          <p className="font-semibold">{label}</p>
          <p className="text-xs text-brand-text-secondary">{description}</p>
      </button>
);

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport, onPrint, onCleanup, isCleaningUp }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 no-print" onClick={onClose}>
      <div className="bg-brand-surface rounded-lg shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-brand-border">
          <div className="flex items-center gap-3">
            <DownloadIcon className="w-8 h-8 text-brand-primary" />
            <div>
              <h2 className="text-xl font-bold">Export Manuscript</h2>
              <p className="text-sm text-brand-text-secondary">Finalize and save your work.</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-3">
          <button
              onClick={onCleanup}
              disabled={isCleaningUp}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 transition-colors disabled:opacity-50"
            >
              {isCleaningUp ? (
                <><svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> Tidying up...</>
              ) : (
                <><WandIcon className="w-5 h-5" /> Pre-submission Clean-Up</>
              )}
            </button>
            <div className="h-px bg-brand-border"></div>
          <ExportButton 
            label="Export as Plain Text (.txt)"
            description="A simple text file with no formatting. Ideal for compatibility."
            onClick={() => onExport('txt')}
          />
          <ExportButton 
            label="Export as HTML (.html)"
            description="A web page file that preserves formatting like bold, italics, and headings."
            onClick={() => onExport('html')}
          />
          <ExportButton 
            label="Export as EPUB (Coming Soon)"
            description="The standard format for ebooks on most platforms like KDP and Apple Books."
            onClick={() => {}}
            disabled
          />
          <ExportButton 
            label="Export as Print-Ready PDF (Coming Soon)"
            description="A formatted PDF ready for print-on-demand services."
            onClick={() => {}}
            disabled
          />
        </div>
        <div className="p-6 border-t border-brand-border">
             <button
                onClick={onPrint}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-brand-bg hover:bg-brand-border transition-colors"
            >
                <PrinterIcon className="w-5 h-5" />
                <span>Print to Physical or PDF</span>
            </button>
        </div>
      </div>
    </div>
  );
};