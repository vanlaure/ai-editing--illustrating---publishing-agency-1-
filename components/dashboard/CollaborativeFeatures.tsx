import React, { useState } from 'react';
import {
  UsersIcon,
  MessageSquareIcon,
  ShareIcon,
  EyeIcon,
  EditIcon,
  LockIcon,
  UnlockIcon,
  BellIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserPlusIcon,
  MailIcon,
  CopyIcon,
  SettingsIcon
} from '../icons/IconDefs';

interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'owner' | 'editor' | 'viewer';
  status: 'active' | 'idle' | 'offline';
  lastSeen: string;
  cursorPosition?: { x: number; y: number; color: string };
}

interface Annotation {
  id: string;
  author: Collaborator;
  content: string;
  timestamp: string;
  position: { x: number; y: number };
  chartId: string;
  resolved: boolean;
  replies: Array<{
    id: string;
    author: Collaborator;
    content: string;
    timestamp: string;
  }>;
}

interface ActivityItem {
  id: string;
  type: 'join' | 'edit' | 'comment' | 'share' | 'export';
  user: Collaborator;
  timestamp: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const CollaborativeFeatures: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'collaborators' | 'annotations' | 'activity'>('collaborators');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [filterResolved, setFilterResolved] = useState(false);

  // Mock data
  const collaborators: Collaborator[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      avatar: '👩‍💼',
      role: 'owner',
      status: 'active',
      lastSeen: 'Now',
      cursorPosition: { x: 120, y: 340, color: '#3B82F6' }
    },
    {
      id: '2',
      name: 'Mike Chen',
      email: 'mike@example.com',
      avatar: '👨‍💻',
      role: 'editor',
      status: 'active',
      lastSeen: '2 min ago',
      cursorPosition: { x: 450, y: 200, color: '#10B981' }
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      email: 'emily@example.com',
      avatar: '👩‍🎨',
      role: 'editor',
      status: 'idle',
      lastSeen: '15 min ago'
    },
    {
      id: '4',
      name: 'David Kim',
      email: 'david@example.com',
      avatar: '👨‍🔬',
      role: 'viewer',
      status: 'offline',
      lastSeen: '2 hours ago'
    }
  ];

  const annotations: Annotation[] = [
    {
      id: '1',
      author: collaborators[1],
      content: 'This spike in writing activity correlates with the new AI features launch. Should we investigate the retention impact?',
      timestamp: '10 min ago',
      position: { x: 200, y: 150 },
      chartId: 'writing-progress',
      resolved: false,
      replies: [
        {
          id: '1-1',
          author: collaborators[0],
          content: 'Good catch! I\'ll add a retention metric to the next sprint.',
          timestamp: '5 min ago'
        }
      ]
    },
    {
      id: '2',
      author: collaborators[2],
      content: 'The AI usage drop on weekends is expected. Most users are hobbyists writing on weekdays.',
      timestamp: '1 hour ago',
      position: { x: 400, y: 300 },
      chartId: 'ai-usage',
      resolved: true,
      replies: []
    },
    {
      id: '3',
      author: collaborators[0],
      content: 'Can we get a breakdown of collaboration metrics by team size?',
      timestamp: '3 hours ago',
      position: { x: 350, y: 220 },
      chartId: 'collaboration',
      resolved: false,
      replies: []
    }
  ];

  const activities: ActivityItem[] = [
    {
      id: '1',
      type: 'join',
      user: collaborators[1],
      timestamp: '2 min ago',
      description: 'joined the dashboard',
      icon: UserPlusIcon
    },
    {
      id: '2',
      type: 'edit',
      user: collaborators[2],
      timestamp: '15 min ago',
      description: 'modified the ROI Calculator widget',
      icon: EditIcon
    },
    {
      id: '3',
      type: 'comment',
      user: collaborators[1],
      timestamp: '20 min ago',
      description: 'added a comment on Writing Progress chart',
      icon: MessageSquareIcon
    },
    {
      id: '4',
      type: 'share',
      user: collaborators[0],
      timestamp: '1 hour ago',
      description: 'shared the dashboard with 2 new users',
      icon: ShareIcon
    },
    {
      id: '5',
      type: 'export',
      user: collaborators[0],
      timestamp: '2 hours ago',
      description: 'exported analytics report (PDF)',
      icon: ShareIcon
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-600';
      case 'editor': return 'bg-blue-600';
      case 'viewer': return 'bg-gray-600';
      default: return 'bg-gray-600';
    }
  };

  const filteredAnnotations = filterResolved 
    ? annotations.filter(a => a.resolved)
    : annotations;

  return (
    <div className="h-full bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <UsersIcon className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold">Collaboration</h2>
          <span className="px-2 py-1 bg-green-600 text-xs rounded-full">
            {collaborators.filter(c => c.status === 'active').length} active
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowShareModal(true)}
            className="p-2 hover:bg-gray-800 rounded transition-colors"
            title="Share Dashboard"
          >
            <ShareIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors flex items-center gap-2"
          >
            <UserPlusIcon className="w-4 h-4" />
            Invite
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setSelectedTab('collaborators')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            selectedTab === 'collaborators'
              ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800/50'
              : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/30'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <UsersIcon className="w-4 h-4" />
            <span>Collaborators ({collaborators.length})</span>
          </div>
        </button>
        <button
          onClick={() => setSelectedTab('annotations')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            selectedTab === 'annotations'
              ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800/50'
              : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/30'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <MessageSquareIcon className="w-4 h-4" />
            <span>Annotations ({annotations.length})</span>
          </div>
        </button>
        <button
          onClick={() => setSelectedTab('activity')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            selectedTab === 'activity'
              ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800/50'
              : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/30'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <BellIcon className="w-4 h-4" />
            <span>Activity</span>
          </div>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {selectedTab === 'collaborators' && (
          <div className="space-y-3">
            {collaborators.map(collaborator => (
              <div
                key={collaborator.id}
                className="p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-xl">
                        {collaborator.avatar}
                      </div>
                      <div className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor(collaborator.status)} rounded-full border-2 border-gray-800`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{collaborator.name}</h3>
                        <span className={`px-2 py-0.5 ${getRoleBadgeColor(collaborator.role)} text-xs rounded uppercase`}>
                          {collaborator.role}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">{collaborator.email}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <ClockIcon className="w-3 h-3" />
                        <span>Last seen: {collaborator.lastSeen}</span>
                      </div>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-gray-700 rounded transition-colors">
                    <SettingsIcon className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                
                {collaborator.cursorPosition && (
                  <div className="mt-3 p-2 bg-gray-900 rounded text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: collaborator.cursorPosition.color }} />
                      <span className="text-gray-400">Currently viewing:</span>
                      <span className="text-blue-400">Writing Progress Chart</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {selectedTab === 'annotations' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setFilterResolved(!filterResolved)}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  filterResolved
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {filterResolved ? '✓ Showing resolved' : 'Show resolved only'}
              </button>
              <span className="text-sm text-gray-400">
                {filteredAnnotations.length} annotation{filteredAnnotations.length !== 1 ? 's' : ''}
              </span>
            </div>

            {filteredAnnotations.map(annotation => (
              <div
                key={annotation.id}
                className={`p-4 rounded-lg border-l-4 ${
                  annotation.resolved
                    ? 'bg-gray-800/50 border-green-600'
                    : 'bg-gray-800 border-blue-600'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm">
                      {annotation.author.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{annotation.author.name}</span>
                        {annotation.resolved && (
                          <CheckCircleIcon className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <span className="text-xs text-gray-400">{annotation.timestamp}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      className="p-1.5 hover:bg-gray-700 rounded transition-colors"
                      title={annotation.resolved ? 'Reopen' : 'Resolve'}
                    >
                      {annotation.resolved ? (
                        <XCircleIcon className="w-4 h-4 text-gray-400" />
                      ) : (
                        <CheckCircleIcon className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-sm text-gray-300 mb-2">{annotation.content}</p>

                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                  <MessageSquareIcon className="w-3 h-3" />
                  <span>On: {annotation.chartId}</span>
                </div>

                {annotation.replies.length > 0 && (
                  <div className="space-y-2 mt-3 pt-3 border-t border-gray-700">
                    {annotation.replies.map(reply => (
                      <div key={reply.id} className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs">
                          {reply.author.avatar}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium">{reply.author.name}</span>
                            <span className="text-xs text-gray-500">{reply.timestamp}</span>
                          </div>
                          <p className="text-xs text-gray-400">{reply.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button className="mt-3 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  <MessageSquareIcon className="w-3 h-3" />
                  Reply
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedTab === 'activity' && (
          <div className="space-y-2">
            {activities.map(activity => (
              <div
                key={activity.id}
                className="p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <activity.icon className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{activity.user.name}</span>
                      <span className="text-gray-400"> {activity.description}</span>
                    </p>
                    <span className="text-xs text-gray-500">{activity.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Invite Collaborators</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Email addresses (comma-separated)
                </label>
                <textarea
                  placeholder="john@example.com, jane@example.com"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white rounded focus:outline-none focus:border-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Permission Level
                </label>
                <select className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white rounded focus:outline-none focus:border-blue-500">
                  <option value="viewer">Viewer (Can view only)</option>
                  <option value="editor">Editor (Can edit dashboards)</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-gray-400">
                  <input type="checkbox" className="rounded bg-gray-900 border-gray-700" />
                  Send email notification
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              >
                Cancel
              </button>
              <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center justify-center gap-2">
                <MailIcon className="w-4 h-4" />
                Send Invites
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Share Dashboard</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Public Access
                </label>
                <div className="flex items-center gap-3">
                  <button className="flex-1 p-3 bg-gray-900 border border-gray-700 rounded hover:border-blue-500 transition-colors">
                    <LockIcon className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                    <div className="text-xs text-gray-300">Private</div>
                  </button>
                  <button className="flex-1 p-3 bg-gray-900 border border-blue-500 rounded transition-colors">
                    <UnlockIcon className="w-5 h-5 mx-auto mb-1 text-blue-400" />
                    <div className="text-xs text-gray-300">Anyone with link</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Share Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value="https://app.example.com/dashboard/abc123"
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 text-white rounded focus:outline-none"
                  />
                  <button className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors">
                    <CopyIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-gray-400">
                  <input type="checkbox" className="rounded bg-gray-900 border-gray-700" />
                  Allow viewers to download data
                </label>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-gray-400">
                  <input type="checkbox" className="rounded bg-gray-900 border-gray-700" defaultChecked />
                  Enable real-time collaboration
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowShareModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              >
                Close
              </button>
              <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors">
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollaborativeFeatures;