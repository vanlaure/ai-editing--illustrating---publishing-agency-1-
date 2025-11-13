import React, { useState } from 'react';
import {
  CloudIcon,
  DownloadIcon,
  LinkIcon,
  SettingsIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  RefreshCwIcon,
  XIcon,
  CopyIcon,
  ExternalLinkIcon,
  DatabaseIcon,
  FileTextIcon,
} from '../icons/IconDefs';

interface Integration {
  id: string;
  name: string;
  category: 'analytics' | 'storage' | 'export' | 'bi';
  description: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: Date;
  logo?: string;
}

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  status: 'active' | 'inactive';
  lastTriggered?: Date;
}

interface ExportFormat {
  id: string;
  name: string;
  format: 'csv' | 'json' | 'xlsx' | 'pdf';
  schedule?: 'daily' | 'weekly' | 'monthly' | 'manual';
}

export const ExternalIntegrations: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'storage' | 'export' | 'bi' | 'webhooks'>('analytics');
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [apiKey, setApiKey] = useState('');

  // Mock integration data
  const integrations: Integration[] = [
    {
      id: 'google-analytics',
      name: 'Google Analytics',
      category: 'analytics',
      description: 'Track user behavior and writing analytics',
      status: 'connected',
      lastSync: new Date(Date.now() - 3600000),
    },
    {
      id: 'mixpanel',
      name: 'Mixpanel',
      category: 'analytics',
      description: 'Advanced product analytics and user insights',
      status: 'disconnected',
    },
    {
      id: 'segment',
      name: 'Segment',
      category: 'analytics',
      description: 'Customer data platform and analytics hub',
      status: 'disconnected',
    },
    {
      id: 'google-drive',
      name: 'Google Drive',
      category: 'storage',
      description: 'Store and sync dashboard data',
      status: 'connected',
      lastSync: new Date(Date.now() - 1800000),
    },
    {
      id: 'dropbox',
      name: 'Dropbox',
      category: 'storage',
      description: 'Cloud storage for reports and exports',
      status: 'disconnected',
    },
    {
      id: 'onedrive',
      name: 'OneDrive',
      category: 'storage',
      description: 'Microsoft cloud storage integration',
      status: 'disconnected',
    },
    {
      id: 'aws-s3',
      name: 'AWS S3',
      category: 'storage',
      description: 'Scalable cloud object storage',
      status: 'error',
    },
    {
      id: 'tableau',
      name: 'Tableau',
      category: 'bi',
      description: 'Connect to Tableau for advanced visualizations',
      status: 'disconnected',
    },
    {
      id: 'power-bi',
      name: 'Power BI',
      category: 'bi',
      description: 'Microsoft business intelligence platform',
      status: 'disconnected',
    },
    {
      id: 'looker',
      name: 'Looker',
      category: 'bi',
      description: 'Google Cloud business intelligence',
      status: 'disconnected',
    },
  ];

  const exportFormats: ExportFormat[] = [
    { id: 'csv', name: 'CSV Export', format: 'csv', schedule: 'daily' },
    { id: 'json', name: 'JSON Export', format: 'json', schedule: 'manual' },
    { id: 'xlsx', name: 'Excel Export', format: 'xlsx', schedule: 'weekly' },
    { id: 'pdf', name: 'PDF Report', format: 'pdf', schedule: 'monthly' },
  ];

  const webhooks: WebhookConfig[] = [
    {
      id: 'webhook-1',
      name: 'Writing Progress Updates',
      url: 'https://api.example.com/webhooks/progress',
      events: ['word_count_milestone', 'chapter_complete'],
      status: 'active',
      lastTriggered: new Date(Date.now() - 7200000),
    },
    {
      id: 'webhook-2',
      name: 'Collaboration Events',
      url: 'https://api.example.com/webhooks/collab',
      events: ['user_joined', 'comment_added'],
      status: 'active',
      lastTriggered: new Date(Date.now() - 3600000),
    },
  ];

  const filteredIntegrations = integrations.filter(i => i.category === activeTab || activeTab === 'webhooks');

  const getStatusIcon = (status: Integration['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircleIcon className="w-5 h-5 text-green-400" />;
      case 'disconnected':
        return <XIcon className="w-5 h-5 text-gray-400" />;
      case 'error':
        return <AlertCircleIcon className="w-5 h-5 text-red-400" />;
    }
  };

  const getStatusBadge = (status: Integration['status']) => {
    const colors = {
      connected: 'bg-green-500/20 text-green-400',
      disconnected: 'bg-gray-500/20 text-gray-400',
      error: 'bg-red-500/20 text-red-400',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatLastSync = (date?: Date) => {
    if (!date) return 'Never';
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const handleConnect = (integration: Integration) => {
    setSelectedIntegration(integration);
    setShowConfigModal(true);
  };

  const handleDisconnect = (integrationId: string) => {
    console.log('Disconnecting:', integrationId);
  };

  const handleSync = (integrationId: string) => {
    console.log('Syncing:', integrationId);
  };

  const handleExport = (format: string) => {
    console.log('Exporting as:', format);
  };

  const handleWebhookTest = (webhookId: string) => {
    console.log('Testing webhook:', webhookId);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">External Integrations</h2>
          <p className="text-gray-400 text-sm mt-1">
            Connect external services, export data, and manage webhooks
          </p>
        </div>
        <button
          onClick={() => setShowWebhookModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <LinkIcon className="w-4 h-4" />
          Add Webhook
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800 overflow-x-auto">
        {[
          { id: 'analytics' as const, label: 'Analytics', count: 3 },
          { id: 'storage' as const, label: 'Cloud Storage', count: 4 },
          { id: 'bi' as const, label: 'BI Tools', count: 3 },
          { id: 'export' as const, label: 'Export', count: 4 },
          { id: 'webhooks' as const, label: 'Webhooks', count: 2 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab.label}
            <span className="ml-2 text-xs bg-gray-800 px-2 py-0.5 rounded-full">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'export' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exportFormats.map(format => (
            <div key={format.id} className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                    <FileTextIcon className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{format.name}</h3>
                    <p className="text-gray-400 text-sm">.{format.format}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleExport(format.format)}
                  className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
                >
                  <DownloadIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Schedule</span>
                  <select
                    value={format.schedule}
                    className="bg-gray-800 text-white px-3 py-1 rounded border border-gray-700"
                  >
                    <option value="manual">Manual</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Destination</span>
                  <select className="bg-gray-800 text-white px-3 py-1 rounded border border-gray-700">
                    <option>Local Download</option>
                    <option>Google Drive</option>
                    <option>Email</option>
                  </select>
                </div>
              </div>
              <button
                onClick={() => handleExport(format.format)}
                className="w-full mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                Export Now
              </button>
            </div>
          ))}
        </div>
      ) : activeTab === 'webhooks' ? (
        <div className="space-y-4">
          {webhooks.map(webhook => (
            <div key={webhook.id} className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-white font-medium">{webhook.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      webhook.status === 'active'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {webhook.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <code className="bg-gray-800 px-2 py-1 rounded">{webhook.url}</code>
                    <button
                      onClick={() => copyToClipboard(webhook.url)}
                      className="p-1 hover:bg-gray-800 rounded transition-colors"
                    >
                      <CopyIcon className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => handleWebhookTest(webhook.id)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                >
                  Test
                </button>
              </div>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-gray-400">Events: </span>
                  <span className="text-white">{webhook.events.join(', ')}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-400">Last triggered: </span>
                  <span className="text-white">{formatLastSync(webhook.lastTriggered)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIntegrations.map(integration => (
            <div key={integration.id} className="bg-gray-900 rounded-lg p-6 border border-gray-800 hover:border-gray-700 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                    {integration.category === 'analytics' && <DatabaseIcon className="w-6 h-6 text-blue-400" />}
                    {integration.category === 'storage' && <CloudIcon className="w-6 h-6 text-purple-400" />}
                    {integration.category === 'bi' && <BarChartIcon className="w-6 h-6 text-green-400" />}
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{integration.name}</h3>
                    {getStatusBadge(integration.status)}
                  </div>
                </div>
                {getStatusIcon(integration.status)}
              </div>
              
              <p className="text-gray-400 text-sm mb-4">{integration.description}</p>
              
              {integration.status === 'connected' && (
                <div className="text-sm text-gray-400 mb-4">
                  Last sync: {formatLastSync(integration.lastSync)}
                </div>
              )}
              
              <div className="flex gap-2">
                {integration.status === 'connected' ? (
                  <>
                    <button
                      onClick={() => handleSync(integration.id)}
                      className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center justify-center gap-2"
                    >
                      <RefreshCwIcon className="w-4 h-4" />
                      Sync
                    </button>
                    <button
                      onClick={() => handleDisconnect(integration.id)}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleConnect(integration)}
                    className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors flex items-center justify-center gap-2"
                  >
                    <LinkIcon className="w-4 h-4" />
                    Connect
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Config Modal */}
      {showConfigModal && selectedIntegration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-md w-full p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                Configure {selectedIntegration.name}
              </h3>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-2 hover:bg-gray-800 rounded transition-colors"
              >
                <XIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter API key"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Sync Frequency
                </label>
                <select className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded focus:outline-none focus:border-blue-500">
                  <option value="realtime">Real-time</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="manual">Manual only</option>
                </select>
              </div>
              
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-400">
                  <input type="checkbox" className="rounded bg-gray-800 border-gray-700" />
                  Enable automatic backups
                </label>
              </div>
              
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-400">
                  <input type="checkbox" className="rounded bg-gray-800 border-gray-700" />
                  Send notification on sync errors
                </label>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowConfigModal(false)}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors"
              >
                Cancel
              </button>
              <button
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                Connect
              </button>
            </div>
            
            <div className="mt-4 p-3 bg-blue-600/10 border border-blue-600/20 rounded">
              <p className="text-sm text-blue-400">
                <ExternalLinkIcon className="w-4 h-4 inline mr-1" />
                Need help? View integration guide
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Webhook Modal */}
      {showWebhookModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-md w-full p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Add Webhook</h3>
              <button
                onClick={() => setShowWebhookModal(false)}
                className="p-2 hover:bg-gray-800 rounded transition-colors"
              >
                <XIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Webhook Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Writing Progress Updates"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Webhook URL
                </label>
                <input
                  type="url"
                  placeholder="https://api.example.com/webhook"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Events to Subscribe
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {['word_count_milestone', 'chapter_complete', 'user_joined', 'comment_added', 'goal_achieved'].map(event => (
                    <label key={event} className="flex items-center gap-2 text-sm text-gray-300">
                      <input type="checkbox" className="rounded bg-gray-800 border-gray-700" />
                      {event}
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Secret Key (optional)
                </label>
                <input
                  type="password"
                  placeholder="For webhook signature verification"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowWebhookModal(false)}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors"
              >
                Cancel
              </button>
              <button
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                Create Webhook
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Add missing BarChartIcon import alias
const BarChartIcon = DatabaseIcon;

export default ExternalIntegrations;