import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BellIcon, XIcon, CheckIcon, AlertCircleIcon, InfoIcon } from '../icons/IconDefs';

interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionLabel?: string;
  actionUrl?: string;
}

const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'warning',
    title: 'Writing Goal at Risk',
    message: 'You\'re 30% behind your daily writing goal. Need 500 more words to stay on track.',
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    read: false,
    actionLabel: 'Start Writing',
    actionUrl: '/editor'
  },
  {
    id: '2',
    type: 'success',
    title: 'Milestone Achieved!',
    message: 'Congratulations! You\'ve completed 50,000 words on your novel.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    read: false,
    actionLabel: 'View Progress',
    actionUrl: '/analytics'
  },
  {
    id: '3',
    type: 'info',
    title: 'AI Usage Summary',
    message: 'You\'ve saved 12 hours this week using AI assistance. Your productivity is up 45%.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    read: true,
    actionLabel: 'View Details',
    actionUrl: '/roi'
  },
  {
    id: '4',
    type: 'error',
    title: 'Export Failed',
    message: 'Failed to export your manuscript. Please check your internet connection and try again.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    read: true,
    actionLabel: 'Retry Export',
    actionUrl: '/export'
  },
  {
    id: '5',
    type: 'info',
    title: 'New Feature Available',
    message: 'Try our new AI-powered character consistency checker in the editing panel.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    read: true,
    actionLabel: 'Learn More',
    actionUrl: '/features'
  }
];

export const AlertsPanel: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [filter, setFilter] = useState<'all' | 'unread' | 'info' | 'warning' | 'error' | 'success'>('all');

  const unreadCount = alerts.filter(a => !a.read).length;

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !alert.read;
    return alert.type === filter;
  });

  const markAsRead = (id: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, read: true } : alert
    ));
  };

  const markAllAsRead = () => {
    setAlerts(alerts.map(alert => ({ ...alert, read: true })));
  };

  const dismissAlert = (id: string) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'info':
        return <InfoIcon className="w-5 h-5 text-blue-500" />;
      case 'success':
        return <CheckIcon className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircleIcon className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertCircleIcon className="w-5 h-5 text-red-500" />;
    }
  };

  const getAlertBorderColor = (type: Alert['type']) => {
    switch (type) {
      case 'info':
        return 'border-blue-500/30';
      case 'success':
        return 'border-green-500/30';
      case 'warning':
        return 'border-yellow-500/30';
      case 'error':
        return 'border-red-500/30';
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <BellIcon className="w-6 h-6 text-brand-text-primary" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-accent text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-brand-text-primary">Alerts & Notifications</h2>
        </div>
        
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-3 py-1.5 text-sm bg-brand-surface-hover hover:bg-brand-accent/20 text-brand-text-secondary hover:text-brand-accent rounded-lg transition-colors"
            >
              Mark all read
            </button>
          )}
          {alerts.length > 0 && (
            <button
              onClick={clearAllAlerts}
              className="px-3 py-1.5 text-sm bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {[
          { value: 'all', label: 'All', count: alerts.length },
          { value: 'unread', label: 'Unread', count: unreadCount },
          { value: 'info', label: 'Info', count: alerts.filter(a => a.type === 'info').length },
          { value: 'success', label: 'Success', count: alerts.filter(a => a.type === 'success').length },
          { value: 'warning', label: 'Warning', count: alerts.filter(a => a.type === 'warning').length },
          { value: 'error', label: 'Error', count: alerts.filter(a => a.type === 'error').length }
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              filter === tab.value
                ? 'bg-brand-accent text-white'
                : 'bg-brand-surface-secondary text-brand-text-secondary hover:bg-brand-surface-hover'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                filter === tab.value
                  ? 'bg-white/20'
                  : 'bg-brand-surface-hover'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredAlerts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <BellIcon className="w-16 h-16 text-brand-text-tertiary mx-auto mb-4" />
              <p className="text-brand-text-secondary">
                {filter === 'unread' ? 'No unread alerts' : 'No alerts to display'}
              </p>
            </motion.div>
          ) : (
            filteredAlerts.map(alert => (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`relative bg-brand-surface-secondary rounded-xl p-4 border-l-4 ${getAlertBorderColor(alert.type)} ${
                  !alert.read ? 'ring-2 ring-brand-accent/20' : ''
                }`}
              >
                {/* Unread Indicator */}
                {!alert.read && (
                  <div className="absolute top-4 right-4">
                    <div className="w-2 h-2 bg-brand-accent rounded-full" />
                  </div>
                )}

                {/* Alert Content */}
                <div className="flex gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getAlertIcon(alert.type)}
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="font-semibold text-brand-text-primary">
                        {alert.title}
                      </h3>
                      <span className="text-xs text-brand-text-tertiary whitespace-nowrap">
                        {formatTimestamp(alert.timestamp)}
                      </span>
                    </div>

                    <p className="text-sm text-brand-text-secondary mb-3">
                      {alert.message}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {alert.actionLabel && (
                        <button className="px-3 py-1.5 text-sm bg-brand-accent hover:bg-brand-accent/80 text-white rounded-lg transition-colors">
                          {alert.actionLabel}
                        </button>
                      )}
                      {!alert.read && (
                        <button
                          onClick={() => markAsRead(alert.id)}
                          className="px-3 py-1.5 text-sm bg-brand-surface-hover hover:bg-brand-accent/20 text-brand-text-secondary hover:text-brand-accent rounded-lg transition-colors"
                        >
                          Mark as read
                        </button>
                      )}
                      <button
                        onClick={() => dismissAlert(alert.id)}
                        className="ml-auto p-1.5 hover:bg-red-500/10 text-brand-text-tertiary hover:text-red-500 rounded-lg transition-colors"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Statistics */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-brand-border">
          <div className="text-center">
            <div className="text-2xl font-bold text-brand-text-primary">
              {alerts.length}
            </div>
            <div className="text-sm text-brand-text-secondary">Total Alerts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">
              {alerts.filter(a => a.type === 'info').length}
            </div>
            <div className="text-sm text-brand-text-secondary">Info</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-500">
              {alerts.filter(a => a.type === 'warning').length}
            </div>
            <div className="text-sm text-brand-text-secondary">Warnings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">
              {alerts.filter(a => a.type === 'error').length}
            </div>
            <div className="text-sm text-brand-text-secondary">Errors</div>
          </div>
        </div>
      )}
    </div>
  );
};