
import React, { useState } from 'react';
import { HistoryIcon, SaveIcon } from './icons/IconDefs';

type Snapshot = {
  id: string;
  name: string;
  timestamp: string;
  content: string;
};

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  snapshots: Snapshot[];
  onSaveSnapshot: (name: string) => void;
  onRestoreSnapshot: (content: string) => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  snapshots,
  onSaveSnapshot,
  onRestoreSnapshot,
}) => {
  const [snapshotName, setSnapshotName] = useState('');
  const [previewContent, setPreviewContent] = useState<string | null>(null);

  const handleSave = () => {
    if (snapshotName.trim()) {
      onSaveSnapshot(snapshotName.trim());
      setSnapshotName('');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 no-print"
      onClick={onClose}
    >
      <div
        className="bg-brand-surface rounded-lg shadow-2xl w-full max-w-3xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ height: '80vh' }}
      >
        <div className="p-6 border-b border-brand-border">
          <div className="flex items-center gap-3">
            <HistoryIcon className="w-8 h-8 text-brand-primary" />
            <div>
              <h2 className="text-xl font-bold">Version History</h2>
              <p className="text-sm text-brand-text-secondary">Save and restore snapshots of your manuscript.</p>
            </div>
          </div>
        </div>
        <div className="flex-grow flex overflow-hidden">
          <div className="w-1/3 border-r border-brand-border p-4 flex flex-col">
            <div className="mb-4">
              <label htmlFor="snapshot-name" className="text-sm font-medium text-brand-text-secondary mb-1 block">
                New Snapshot Name
              </label>
              <div className="flex gap-2">
                <input
                  id="snapshot-name"
                  type="text"
                  value={snapshotName}
                  onChange={(e) => setSnapshotName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  placeholder="e.g., Chapter 3 Draft"
                  className="flex-grow p-2 border border-brand-border rounded-md bg-brand-bg"
                />
                <button
                  onClick={handleSave}
                  disabled={!snapshotName.trim()}
                  className="p-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary-hover disabled:bg-gray-500"
                >
                  <SaveIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-grow overflow-y-auto space-y-2">
              {snapshots.length === 0 ? (
                <p className="text-sm text-center text-brand-text-secondary pt-8">No snapshots saved yet.</p>
              ) : (
                snapshots.map((snapshot) => (
                  <div key={snapshot.id} className="bg-brand-bg p-3 rounded-md">
                    <p className="font-semibold text-sm truncate">{snapshot.name}</p>
                    <p className="text-xs text-brand-text-secondary">
                      {new Date(snapshot.timestamp).toLocaleString()}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => setPreviewContent(snapshot.content)}
                        className="text-xs px-2 py-1 rounded bg-brand-border/50 hover:bg-brand-border"
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => onRestoreSnapshot(snapshot.content)}
                        className="text-xs px-2 py-1 rounded bg-brand-primary text-white hover:bg-brand-primary-hover"
                      >
                        Restore
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="w-2/3 p-4 overflow-y-auto">
            <h3 className="font-bold mb-2">Preview</h3>
            <div className="bg-brand-bg rounded-md p-4 border border-brand-border h-full">
              {previewContent ? (
                <div
                  className="prose dark:prose-invert prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: previewContent }}
                />
              ) : (
                <p className="text-sm text-brand-text-secondary">Select a snapshot to preview its content here.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
