import React, { useMemo, useState } from 'react';
import { AssetRightsRecord, AssetRightsStatus } from '../types';
import { XCircleIcon, SparklesIcon } from './icons/IconDefs';

interface RightsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  records: AssetRightsRecord[];
  filter: 'all' | 'illustration' | 'audio';
  onFilterChange: (next: 'all' | 'illustration' | 'audio') => void;
  onAddRecord: (record: Omit<AssetRightsRecord, 'id' | 'createdAt'>) => void;
  onUpdateStatus: (id: string, status: AssetRightsStatus) => void;
}

const statusColors: Record<AssetRightsStatus, string> = {
  clear: 'text-emerald-500 bg-emerald-500/10',
  pending: 'text-amber-500 bg-amber-500/10',
  restricted: 'text-red-500 bg-red-500/10',
};

export const RightsDrawer: React.FC<RightsDrawerProps> = ({
  isOpen,
  onClose,
  records,
  filter,
  onFilterChange,
  onAddRecord,
  onUpdateStatus,
}) => {
  const [assetName, setAssetName] = useState('');
  const [assetType, setAssetType] = useState<'illustration' | 'audio'>('illustration');
  const [licenseType, setLicenseType] = useState<'exclusive' | 'non-exclusive' | 'work-for-hire' | 'royalty-share'>('exclusive');
  const [expiresOn, setExpiresOn] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [notes, setNotes] = useState('');

  const filteredRecords = useMemo(() => {
    if (filter === 'all') return records;
    return records.filter((record) => record.assetType === filter);
  }, [records, filter]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!assetName.trim()) return;
    onAddRecord({
      assetName: assetName.trim(),
      assetType,
      licenseType,
      expiresOn: expiresOn || undefined,
      referenceUrl: referenceUrl || undefined,
      notes,
      status: 'pending',
    });
    setAssetName('');
    setNotes('');
    setExpiresOn('');
    setReferenceUrl('');
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <aside className="w-full sm:w-[28rem] h-full bg-brand-bg border-l border-brand-border flex flex-col">
        <header className="flex items-center justify-between px-4 py-3 border-b border-brand-border/70">
          <div>
            <h2 className="text-sm font-semibold text-brand-text">Rights & Licensing</h2>
            <p className="text-[11px] text-brand-text-muted">Track illustration + audio approvals.</p>
          </div>
          <button onClick={onClose} className="text-brand-text-secondary hover:text-brand-primary">
            <XCircleIcon className="w-5 h-5" />
          </button>
        </header>
        <div className="flex items-center gap-2 px-4 py-2 border-b border-brand-border/70 text-[11px]">
          {(['all', 'illustration', 'audio'] as const).map((option) => (
            <button
              key={option}
              onClick={() => onFilterChange(option)}
              className={`px-3 py-1 rounded-full border text-xs ${
                filter === option
                  ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                  : 'border-brand-border/60 text-brand-text-secondary'
              }`}
            >
              {option === 'all' ? 'All Assets' : option === 'illustration' ? 'Illustration' : 'Audio'}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          <div className="border border-brand-border/60 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <SparklesIcon className="w-4 h-4 text-brand-primary" />
              Log a new asset
            </div>
            <input
              className="w-full px-2 py-1.5 rounded-md bg-brand-bg border border-brand-border/70 text-sm"
              placeholder="Asset name (e.g., Prologue spread, Chapter 1 narration)"
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <label className="block text-brand-text-muted mb-1">Asset type</label>
                <select
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value as 'illustration' | 'audio')}
                  className="w-full px-2 py-1.5 rounded-md bg-brand-bg border border-brand-border/70"
                >
                  <option value="illustration">Illustration</option>
                  <option value="audio">Audio</option>
                </select>
              </div>
              <div>
                <label className="block text-brand-text-muted mb-1">License</label>
                <select
                  value={licenseType}
                  onChange={(e) => setLicenseType(e.target.value as any)}
                  className="w-full px-2 py-1.5 rounded-md bg-brand-bg border border-brand-border/70"
                >
                  <option value="exclusive">Exclusive</option>
                  <option value="non-exclusive">Non-exclusive</option>
                  <option value="work-for-hire">Work for hire</option>
                  <option value="royalty-share">Royalty share</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <label className="block text-brand-text-muted mb-1">Expires on</label>
                <input
                  type="date"
                  value={expiresOn}
                  onChange={(e) => setExpiresOn(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-md bg-brand-bg border border-brand-border/70"
                />
              </div>
              <div>
                <label className="block text-brand-text-muted mb-1">Reference URL</label>
                <input
                  type="url"
                  value={referenceUrl}
                  onChange={(e) => setReferenceUrl(e.target.value)}
                  placeholder="https://contract-link"
                  className="w-full px-2 py-1.5 rounded-md bg-brand-bg border border-brand-border/70"
                />
              </div>
            </div>
            <textarea
              className="w-full h-20 px-2 py-1.5 rounded-md bg-brand-bg border border-brand-border/70 text-sm"
              placeholder="Notes, usage restrictions, collaborators..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <button
              onClick={handleSubmit}
              disabled={!assetName.trim()}
              className="w-full px-3 py-1.5 rounded-md bg-brand-primary text-white text-sm font-semibold disabled:opacity-40"
            >
              Log rights record
            </button>
          </div>

          <div className="space-y-2">
            {filteredRecords.length === 0 && (
              <p className="text-[11px] text-brand-text-muted">
                No rights records yet. Add entries to keep legal approvals organized.
              </p>
            )}
            {filteredRecords.map((record) => (
              <div key={record.id} className="border border-brand-border/60 rounded-lg p-2 text-[11px] space-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-brand-text">{record.assetName}</p>
                    <p className="text-[10px] text-brand-text-muted capitalize">{record.assetType}</p>
                  </div>
                  <select
                    value={record.status}
                    onChange={(e) => onUpdateStatus(record.id, e.target.value as AssetRightsStatus)}
                    className={`px-2 py-1 rounded-full text-[10px] ${statusColors[record.status]}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="clear">Clear</option>
                    <option value="restricted">Restricted</option>
                  </select>
                </div>
                <p className="text-brand-text">License: {record.licenseType}</p>
                {record.expiresOn && (
                  <p className="text-brand-text-secondary">Expires: {record.expiresOn}</p>
                )}
                {record.referenceUrl && (
                  <a
                    href={record.referenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-primary underline"
                  >
                    View contract/reference
                  </a>
                )}
                {record.notes && <p className="text-brand-text-muted">{record.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
};
