import React from 'react';

interface ApiErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: string | null;
}

const ApiErrorModal: React.FC<ApiErrorModalProps> = ({ isOpen, onClose, error }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300"
      onClick={onClose}
      aria-modal="true"
      role="alertdialog"
    >
      <div
        className="bg-brand-gray p-8 rounded-xl shadow-2xl shadow-black/30 border border-brand-magenta/50 w-full max-w-lg m-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full bg-brand-magenta/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-magenta" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            <div className="flex-1">
                <h2 className="text-xl font-bold text-white mb-2">An API Error Occurred</h2>
                <p className="text-gray-300 bg-brand-dark p-3 rounded-md font-mono text-sm mb-4">
                    {error}
                </p>
                <div className="text-xs text-gray-400 space-y-1">
                    <p>This may be due to API rate limits or billing issues.</p>
                    <p>
                        Please check your plan details and usage quotas. For more information, visit:
                        <a href="https://ai.google.dev/gemini-api/docs/rate-limits" target="_blank" rel="noopener noreferrer" className="text-brand-cyan hover:underline ml-1">Rate Limits</a> or 
                        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-brand-cyan hover:underline ml-1">Billing Docs</a>.
                    </p>
                </div>
            </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-brand-magenta text-white font-bold py-2 px-6 rounded-lg transition-all hover:opacity-80"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiErrorModal;