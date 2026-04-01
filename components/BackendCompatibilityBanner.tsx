import React from 'react';
import type { BackendMeta } from '../services/backendService';

interface BackendCompatibilityBannerProps {
  message: string;
  meta?: BackendMeta;
  onRefresh: () => void;
  onDismiss: () => void;
}

const BackendCompatibilityBanner: React.FC<BackendCompatibilityBannerProps> = ({ message, meta, onRefresh, onDismiss }) => {
  return (
    <div className="mx-auto mb-6 max-w-7xl rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-amber-50 shadow-lg shadow-black/10">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-amber-200">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400" />
            Backend Compatibility Warning
          </div>
          <p className="text-sm text-amber-50">{message}</p>
          {meta && (
            <p className="mt-2 text-xs text-amber-200/80">
              Running backend started at {new Date(meta.startedAt).toLocaleString()} on port {meta.port}.
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={onRefresh}
            className="rounded-lg border border-amber-300/30 bg-black/20 px-3 py-1.5 text-xs font-medium text-amber-100 transition-colors hover:bg-black/30"
          >
            Check Again
          </button>
          <button
            onClick={onDismiss}
            className="rounded-lg border border-transparent px-2 py-1.5 text-xs font-medium text-amber-100/80 transition-colors hover:bg-black/20 hover:text-amber-50"
            aria-label="Dismiss backend compatibility warning"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackendCompatibilityBanner;
