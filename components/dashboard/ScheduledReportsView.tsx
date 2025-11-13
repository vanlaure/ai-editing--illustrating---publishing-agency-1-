import React, { useState } from 'react';
import { Calendar, Clock, Mail, FileText, Download, Trash2, Edit, Check, X } from 'lucide-react';

interface ReportRecipient {
  email: string;
  name: string;
}

interface ScheduledReport {
  id: string;
  name: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  recipients: ReportRecipient[];
  format: 'pdf' | 'excel' | 'csv';
  template: string;
  status: 'active' | 'paused';
  lastSent?: string;
  nextScheduled: string;
  metrics: string[];
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  metrics: string[];
}

const ScheduledReportsView: React.FC = () => {
  const [reports, setReports] = useState<ScheduledReport[]>([
    {
      id: 'report-001',
      name: 'Weekly Performance Summary',
      description: 'Comprehensive overview of writing and AI metrics',
      frequency: 'weekly',
      time: '09:00',
      dayOfWeek: 1, // Monday
      recipients: [
        { email: 'manager@example.com', name: 'Project Manager' },
        { email: 'team@example.com', name: 'Team Lead' }
      ],
      format: 'pdf',
      template: 'performance-summary',
      status: 'active',
      lastSent: '2025-11-04',
      nextScheduled: '2025-11-11',
      metrics: ['words', 'ai-usage', 'collaboration', 'goals']
    },
    {
      id: 'report-002',
      name: 'Daily Writing Progress',
      description: 'Daily snapshot of writing activity',
      frequency: 'daily',
      time: '18:00',
      recipients: [
        { email: 'writer@example.com', name: 'Writer' }
      ],
      format: 'excel',
      template: 'daily-progress',
      status: 'active',
      lastSent: '2025-11-11',
      nextScheduled: '2025-11-12',
      metrics: ['words', 'sessions', 'time']
    },
    {
      id: 'report-003',
      name: 'Monthly Analytics Report',
      description: 'Detailed monthly analytics and insights',
      frequency: 'monthly',
      time: '08:00',
      dayOfMonth: 1,
      recipients: [
        { email: 'admin@example.com', name: 'Administrator' },
        { email: 'analytics@example.com', name: 'Analytics Team' }
      ],
      format: 'pdf',
      template: 'monthly-analytics',
      status: 'active',
      lastSent: '2025-11-01',
      nextScheduled: '2025-12-01',
      metrics: ['all']
    }
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingReport, setEditingReport] = useState<ScheduledReport | null>(null);
  const [selectedReport, setSelectedReport] = useState<string>('');

  const templates: ReportTemplate[] = [
    {
      id: 'performance-summary',
      name: 'Performance Summary',
      description: 'Overview of key performance metrics',
      metrics: ['words', 'ai-usage', 'collaboration', 'goals', 'productivity']
    },
    {
      id: 'daily-progress',
      name: 'Daily Progress',
      description: 'Daily writing activity snapshot',
      metrics: ['words', 'sessions', 'time', 'goals']
    },
    {
      id: 'monthly-analytics',
      name: 'Monthly Analytics',
      description: 'Comprehensive monthly report',
      metrics: ['all']
    },
    {
      id: 'ai-insights',
      name: 'AI Insights',
      description: 'Focus on AI usage and efficiency',
      metrics: ['ai-usage', 'ai-suggestions', 'ai-cost']
    },
    {
      id: 'team-collaboration',
      name: 'Team Collaboration',
      description: 'Collaboration metrics and activity',
      metrics: ['collaboration', 'comments', 'changes']
    }
  ];

  const [newReport, setNewReport] = useState<Partial<ScheduledReport>>({
    name: '',
    description: '',
    frequency: 'weekly',
    time: '09:00',
    dayOfWeek: 1,
    recipients: [],
    format: 'pdf',
    template: 'performance-summary',
    status: 'active',
    metrics: []
  });

  const [newRecipient, setNewRecipient] = useState({ email: '', name: '' });

  const handleToggleStatus = (reportId: string) => {
    setReports(reports.map(report =>
      report.id === reportId
        ? { ...report, status: report.status === 'active' ? 'paused' : 'active' }
        : report
    ));
  };

  const handleDeleteReport = (reportId: string) => {
    if (window.confirm('Are you sure you want to delete this scheduled report?')) {
      setReports(reports.filter(report => report.id !== reportId));
    }
  };

  const handleAddRecipient = () => {
    if (newRecipient.email && newRecipient.name) {
      setNewReport({
        ...newReport,
        recipients: [...(newReport.recipients || []), newRecipient]
      });
      setNewRecipient({ email: '', name: '' });
    }
  };

  const handleRemoveRecipient = (email: string) => {
    setNewReport({
      ...newReport,
      recipients: (newReport.recipients || []).filter(r => r.email !== email)
    });
  };

  const handleCreateReport = () => {
    if (!newReport.name || !newReport.recipients?.length) {
      alert('Please fill in report name and add at least one recipient');
      return;
    }

    const report: ScheduledReport = {
      id: `report-${Date.now()}`,
      name: newReport.name,
      description: newReport.description || '',
      frequency: newReport.frequency || 'weekly',
      time: newReport.time || '09:00',
      dayOfWeek: newReport.frequency === 'weekly' ? newReport.dayOfWeek : undefined,
      dayOfMonth: newReport.frequency === 'monthly' ? newReport.dayOfMonth : undefined,
      recipients: newReport.recipients || [],
      format: newReport.format || 'pdf',
      template: newReport.template || 'performance-summary',
      status: 'active',
      nextScheduled: calculateNextScheduled(newReport.frequency || 'weekly', newReport.time || '09:00'),
      metrics: newReport.metrics || []
    };

    setReports([...reports, report]);
    setShowCreateModal(false);
    setNewReport({
      name: '',
      description: '',
      frequency: 'weekly',
      time: '09:00',
      dayOfWeek: 1,
      recipients: [],
      format: 'pdf',
      template: 'performance-summary',
      status: 'active',
      metrics: []
    });
  };

  const calculateNextScheduled = (frequency: string, time: string): string => {
    const now = new Date();
    const next = new Date(now);
    
    switch (frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
    }
    
    return next.toISOString().split('T')[0];
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'weekly': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'monthly': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active'
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
  };

  const getDayName = (day: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Scheduled Reports
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Automate report generation and delivery to your team
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create New Report
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 dark:text-gray-400">Active Reports</span>
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {reports.filter(r => r.status === 'active').length}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 dark:text-gray-400">Total Recipients</span>
            <Mail className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {reports.reduce((acc, r) => acc + r.recipients.length, 0)}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 dark:text-gray-400">Reports Sent</span>
            <Download className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {reports.filter(r => r.lastSent).length}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 dark:text-gray-400">Next Scheduled</span>
            <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {reports.filter(r => r.status === 'active').length > 0
              ? new Date(
                  Math.min(...reports
                    .filter(r => r.status === 'active')
                    .map(r => new Date(r.nextScheduled).getTime()))
                ).toLocaleDateString()
              : 'N/A'
            }
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Scheduled Reports
          </h2>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {reports.map(report => (
            <div key={report.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {report.name}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getFrequencyColor(report.frequency)}`}>
                      {report.frequency}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                      {report.status}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                    {report.description}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Schedule:</span>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {report.frequency === 'weekly' && report.dayOfWeek !== undefined && (
                          <span>{getDayName(report.dayOfWeek)} at {report.time}</span>
                        )}
                        {report.frequency === 'monthly' && report.dayOfMonth && (
                          <span>Day {report.dayOfMonth} at {report.time}</span>
                        )}
                        {report.frequency === 'daily' && (
                          <span>Daily at {report.time}</span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Format:</span>
                      <div className="font-medium text-gray-900 dark:text-white uppercase">
                        {report.format}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Last Sent:</span>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {report.lastSent ? new Date(report.lastSent).toLocaleDateString() : 'Never'}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Next Scheduled:</span>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {new Date(report.nextScheduled).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">Recipients:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {report.recipients.map((recipient, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                        >
                          {recipient.name} ({recipient.email})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleToggleStatus(report.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      report.status === 'active'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200'
                    }`}
                    title={report.status === 'active' ? 'Pause' : 'Resume'}
                  >
                    {report.status === 'active' ? <X className="w-5 h-5" /> : <Check className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => setEditingReport(report)}
                    className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteReport(report.id)}
                    className="p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Report Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Create Scheduled Report
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Report Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Report Name *
                </label>
                <input
                  type="text"
                  value={newReport.name}
                  onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., Weekly Team Report"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={newReport.description}
                  onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                  placeholder="Brief description of the report"
                />
              </div>

              {/* Template */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Report Template
                </label>
                <select
                  value={newReport.template}
                  onChange={(e) => setNewReport({ ...newReport, template: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name} - {template.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Frequency */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Frequency
                  </label>
                  <select
                    value={newReport.frequency}
                    onChange={(e) => setNewReport({ ...newReport, frequency: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={newReport.time}
                    onChange={(e) => setNewReport({ ...newReport, time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Day of Week (for weekly) */}
              {newReport.frequency === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Day of Week
                  </label>
                  <select
                    value={newReport.dayOfWeek}
                    onChange={(e) => setNewReport({ ...newReport, dayOfWeek: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value={0}>Sunday</option>
                    <option value={1}>Monday</option>
                    <option value={2}>Tuesday</option>
                    <option value={3}>Wednesday</option>
                    <option value={4}>Thursday</option>
                    <option value={5}>Friday</option>
                    <option value={6}>Saturday</option>
                  </select>
                </div>
              )}

              {/* Day of Month (for monthly) */}
              {newReport.frequency === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Day of Month
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={newReport.dayOfMonth}
                    onChange={(e) => setNewReport({ ...newReport, dayOfMonth: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              )}

              {/* Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Export Format
                </label>
                <select
                  value={newReport.format}
                  onChange={(e) => setNewReport({ ...newReport, format: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel (XLSX)</option>
                  <option value="csv">CSV</option>
                </select>
              </div>

              {/* Recipients */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Recipients *
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Name"
                    value={newRecipient.name}
                    onChange={(e) => setNewRecipient({ ...newRecipient, name: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={newRecipient.email}
                    onChange={(e) => setNewRecipient({ ...newRecipient, email: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={handleAddRecipient}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {newReport.recipients?.map((recipient, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm flex items-center gap-2"
                    >
                      {recipient.name} ({recipient.email})
                      <button
                        onClick={() => handleRemoveRecipient(recipient.email)}
                        className="hover:text-red-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-gray-800">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateReport}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduledReportsView;