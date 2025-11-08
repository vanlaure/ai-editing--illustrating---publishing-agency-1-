import React, { useState } from 'react';
import { 
  PlusIcon, 
  Trash2Icon, 
  CheckCircleIcon,
  MessageSquareIcon,
  HistoryIcon,
  AlertTriangleIcon
} from './icons/IconDefs';

interface RevisionFeedback {
  id: string;
  assetId: string;
  assetType: string;
  assetTitle?: string;
  comment: string;
  status: 'pending' | 'in-progress' | 'resolved';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  resolvedAt?: string;
  responses?: RevisionResponse[];
}

interface RevisionResponse {
  id: string;
  feedbackId: string;
  author: 'author' | 'artist';
  message: string;
  createdAt: string;
}

interface VersionHistory {
  id: string;
  assetId: string;
  assetType: string;
  assetTitle?: string;
  version: number;
  changes: string;
  imageUrl?: string;
  createdAt: string;
}

interface RevisionManagementViewProps {
  revisions?: RevisionFeedback[];
  versionHistory?: VersionHistory[];
  onCreateRevision?: (revision: Partial<RevisionFeedback>) => Promise<void>;
  onUpdateRevisionStatus?: (id: string, status: RevisionFeedback['status']) => Promise<void>;
  onAddResponse?: (feedbackId: string, message: string, author: 'author' | 'artist') => Promise<void>;
  onDeleteRevision?: (id: string) => Promise<void>;
}

const RevisionManagementView: React.FC<RevisionManagementViewProps> = ({
  revisions = [],
  versionHistory = [],
  onCreateRevision,
  onUpdateRevisionStatus,
  onAddResponse,
  onDeleteRevision,
}) => {
  const [activeTab, setActiveTab] = useState<'revisions' | 'history'>('revisions');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in-progress' | 'resolved'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const [selectedRevision, setSelectedRevision] = useState<string | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Revision Form State
  const [newRevision, setNewRevision] = useState({
    assetId: '',
    assetType: 'illustration',
    assetTitle: '',
    comment: '',
    priority: 'medium' as RevisionFeedback['priority']
  });

  const handleCreateRevision = async () => {
    if (!newRevision.comment || !newRevision.assetId) return;
    setIsSubmitting(true);
    try {
      await onCreateRevision?.({
        ...newRevision,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      setNewRevision({
        assetId: '',
        assetType: 'illustration',
        assetTitle: '',
        comment: '',
        priority: 'medium'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: RevisionFeedback['status']) => {
    setIsSubmitting(true);
    try {
      await onUpdateRevisionStatus?.(id, status);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddResponse = async (feedbackId: string) => {
    if (!responseMessage.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddResponse?.(feedbackId, responseMessage, 'artist');
      setResponseMessage('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRevisions = revisions.filter(rev => {
    if (statusFilter !== 'all' && rev.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && rev.priority !== priorityFilter) return false;
    return true;
  });

  const pendingCount = revisions.filter(r => r.status === 'pending').length;
  const inProgressCount = revisions.filter(r => r.status === 'in-progress').length;
  const resolvedCount = revisions.filter(r => r.status === 'resolved').length;

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'critical': return 'text-red-500 bg-red-500/10 border-red-500';
      case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500';
      case 'low': return 'text-blue-500 bg-blue-500/10 border-blue-500';
      default: return 'text-brand-text-secondary bg-brand-surface border-brand-border';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-500 bg-yellow-500/10';
      case 'in-progress': return 'text-blue-500 bg-blue-500/10';
      case 'resolved': return 'text-green-500 bg-green-500/10';
      default: return 'text-brand-text-secondary bg-brand-surface';
    }
  };

  const tabs = [
    { id: 'revisions' as const, label: 'Revision Feedback', icon: MessageSquareIcon, badge: pendingCount },
    { id: 'history' as const, label: 'Version History', icon: HistoryIcon, badge: versionHistory.length },
  ];

  return (
    <div className="h-full flex flex-col bg-brand-bg">
      {/* Tab Navigation */}
      <div className="flex border-b border-brand-border bg-brand-surface">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-brand-primary text-brand-text-primary bg-brand-bg'
                  : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-bg/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.badge > 0 && (
                <span className="bg-brand-primary text-white text-xs px-1.5 py-0.5 rounded-full">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'revisions' && (
          <div className="grid xl:grid-cols-2 gap-6">
            {/* Creation Panel */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-brand-text-primary flex items-center gap-2">
                <MessageSquareIcon className="w-5 h-5" />
                Create Revision Feedback
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-brand-text-primary mb-1">
                    Asset Type
                  </label>
                  <select
                    value={newRevision.assetType}
                    onChange={(e) => setNewRevision({ ...newRevision, assetType: e.target.value })}
                    className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  >
                    <option value="illustration">Illustration</option>
                    <option value="character">Character Sheet</option>
                    <option value="scene">Scene</option>
                    <option value="panel">Panel Layout</option>
                    <option value="cover">Cover Design</option>
                    <option value="map">Map</option>
                    <option value="symbol">Symbol/Emblem</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-text-primary mb-1">
                    Asset ID
                  </label>
                  <input
                    type="text"
                    value={newRevision.assetId}
                    onChange={(e) => setNewRevision({ ...newRevision, assetId: e.target.value })}
                    placeholder="e.g., char-001, scene-hero-battle"
                    className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded text-brand-text-primary placeholder-brand-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-text-primary mb-1">
                    Asset Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={newRevision.assetTitle}
                    onChange={(e) => setNewRevision({ ...newRevision, assetTitle: e.target.value })}
                    placeholder="e.g., Hero Character Portrait"
                    className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded text-brand-text-primary placeholder-brand-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-text-primary mb-1">
                    Priority
                  </label>
                  <select
                    value={newRevision.priority}
                    onChange={(e) => setNewRevision({ ...newRevision, priority: e.target.value as RevisionFeedback['priority'] })}
                    className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-text-primary mb-1">
                    Feedback Comment
                  </label>
                  <textarea
                    value={newRevision.comment}
                    onChange={(e) => setNewRevision({ ...newRevision, comment: e.target.value })}
                    placeholder="Describe the revision needed..."
                    rows={6}
                    className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded text-brand-text-primary placeholder-brand-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                  />
                </div>

                <button
                  onClick={handleCreateRevision}
                  disabled={!newRevision.comment || !newRevision.assetId || isSubmitting}
                  className="w-full bg-brand-primary hover:bg-brand-primary/90 disabled:bg-brand-primary/50 text-white px-4 py-2 rounded font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <PlusIcon className="w-4 h-4" />
                  Submit Feedback
                </button>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-brand-border">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-500">{pendingCount}</div>
                  <div className="text-xs text-brand-text-secondary">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">{inProgressCount}</div>
                  <div className="text-xs text-brand-text-secondary">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">{resolvedCount}</div>
                  <div className="text-xs text-brand-text-secondary">Resolved</div>
                </div>
              </div>
            </div>

            {/* Revision List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-brand-text-primary">
                  Revisions ({filteredRevisions.length})
                </h3>
                <div className="flex gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                    className="px-3 py-1 text-sm bg-brand-surface border border-brand-border rounded text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value as typeof priorityFilter)}
                    className="px-3 py-1 text-sm bg-brand-surface border border-brand-border rounded text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  >
                    <option value="all">All Priority</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-3 max-h-[700px] overflow-y-auto">
                {filteredRevisions.map((revision) => (
                  <div
                    key={revision.id}
                    className="bg-brand-surface border border-brand-border rounded p-4 hover:border-brand-primary transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-brand-text-primary">
                            {revision.assetTitle || `Asset: ${revision.assetId}`}
                          </h4>
                          <span className={`text-xs px-2 py-0.5 rounded border ${getPriorityColor(revision.priority)}`}>
                            {revision.priority}
                          </span>
                        </div>
                        <p className="text-xs text-brand-text-secondary">
                          {revision.assetType} • {new Date(revision.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => onDeleteRevision?.(revision.id)}
                        className="text-red-500 hover:text-red-600 p-1"
                      >
                        <Trash2Icon className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <p className="text-sm text-brand-text-primary mb-3">{revision.comment}</p>
                    
                    {/* Status Controls */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs text-brand-text-secondary">Status:</span>
                      <button
                        onClick={() => handleUpdateStatus(revision.id, 'pending')}
                        className={`text-xs px-2 py-1 rounded ${getStatusColor('pending')} ${revision.status === 'pending' ? 'ring-2 ring-yellow-500' : ''}`}
                      >
                        Pending
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(revision.id, 'in-progress')}
                        className={`text-xs px-2 py-1 rounded ${getStatusColor('in-progress')} ${revision.status === 'in-progress' ? 'ring-2 ring-blue-500' : ''}`}
                      >
                        In Progress
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(revision.id, 'resolved')}
                        className={`text-xs px-2 py-1 rounded ${getStatusColor('resolved')} ${revision.status === 'resolved' ? 'ring-2 ring-green-500' : ''}`}
                      >
                        Resolved
                      </button>
                    </div>

                    {/* Responses Thread */}
                    {revision.responses && revision.responses.length > 0 && (
                      <div className="space-y-2 mb-3 pl-4 border-l-2 border-brand-border">
                        {revision.responses.map((response) => (
                          <div key={response.id} className="text-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-medium ${response.author === 'author' ? 'text-brand-primary' : 'text-green-500'}`}>
                                {response.author === 'author' ? 'Author' : 'Artist'}
                              </span>
                              <span className="text-xs text-brand-text-secondary">
                                {new Date(response.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-brand-text-secondary">{response.message}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Response Input (only for non-resolved) */}
                    {revision.status !== 'resolved' && selectedRevision === revision.id && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={responseMessage}
                          onChange={(e) => setResponseMessage(e.target.value)}
                          placeholder="Add a response..."
                          className="flex-1 px-3 py-1 text-sm bg-brand-bg border border-brand-border rounded text-brand-text-primary placeholder-brand-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleAddResponse(revision.id);
                            }
                          }}
                        />
                        <button
                          onClick={() => handleAddResponse(revision.id)}
                          disabled={!responseMessage.trim() || isSubmitting}
                          className="px-3 py-1 text-sm bg-brand-primary hover:bg-brand-primary/90 disabled:bg-brand-primary/50 text-white rounded"
                        >
                          Send
                        </button>
                      </div>
                    )}
                    
                    {revision.status !== 'resolved' && selectedRevision !== revision.id && (
                      <button
                        onClick={() => setSelectedRevision(revision.id)}
                        className="text-xs text-brand-primary hover:text-brand-primary/80"
                      >
                        Add response...
                      </button>
                    )}

                    {revision.resolvedAt && (
                      <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
                        <CheckCircleIcon className="w-3 h-3" />
                        Resolved on {new Date(revision.resolvedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
                
                {filteredRevisions.length === 0 && (
                  <div className="text-center py-12 text-brand-text-secondary">
                    <MessageSquareIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No revisions match the current filters</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-brand-text-primary flex items-center gap-2">
              <HistoryIcon className="w-5 h-5" />
              Version History ({versionHistory.length})
            </h3>
            
            <div className="space-y-3">
              {versionHistory.map((version) => (
                <div
                  key={version.id}
                  className="bg-brand-surface border border-brand-border rounded p-4 hover:border-brand-primary transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {version.imageUrl && (
                      <div className="w-24 h-24 bg-brand-bg border border-brand-border rounded overflow-hidden flex-shrink-0">
                        <img 
                          src={version.imageUrl} 
                          alt={`Version ${version.version}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-brand-text-primary">
                            {version.assetTitle || `Asset: ${version.assetId}`}
                          </h4>
                          <p className="text-xs text-brand-text-secondary mt-1">
                            Version {version.version} • {version.assetType} • {new Date(version.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <span className="text-xs bg-brand-primary/10 text-brand-primary px-2 py-1 rounded">
                          v{version.version}
                        </span>
                      </div>
                      <p className="text-sm text-brand-text-secondary">{version.changes}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {versionHistory.length === 0 && (
                <div className="text-center py-12 text-brand-text-secondary">
                  <HistoryIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No version history available</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RevisionManagementView;