import React, { useState, useEffect } from 'react';

interface GeneratedContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

export const GeneratedContentModal: React.FC<GeneratedContentModalProps> = ({ isOpen, onClose, title, content }) => {
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsCopied(false);
    }
  }, [isOpen]);
  
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 no-print"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="generated-content-title"
    >
      <div className="bg-brand-surface rounded-lg shadow-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <h2 id="generated-content-title" className="text-xl font-bold mb-4">{title}</h2>
        <div className="bg-brand-bg rounded-md p-4 max-h-96 overflow-y-auto mb-4">
          <pre className="text-sm text-brand-text-secondary whitespace-pre-wrap font-sans">{content}</pre>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={handleCopy}
            className={`px-4 py-2 rounded-md font-semibold transition-colors ${
                isCopied 
                ? 'bg-green-600 text-white' 
                : 'bg-brand-primary text-white hover:bg-brand-primary-hover'
            }`}
          >
            {isCopied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md font-semibold bg-brand-border hover:bg-brand-border/70"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
