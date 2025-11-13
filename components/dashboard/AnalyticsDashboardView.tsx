import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardGrid } from './DashboardGrid';
import { ROICalculator } from './ROICalculator';
import { PredictiveInsightsPanel } from './PredictiveInsightsPanel';
import { BusinessIntelligencePanel } from './BusinessIntelligencePanel';
import { InteractiveChart } from './InteractiveChart';
import { MetricsCard } from './MetricsCard';
import { ExportModal } from './ExportModal';
import { DateRangeFilter } from './DateRangeFilter';
import { dashboardService } from '../../services/dashboardService';
import {
  BarChartIcon,
  TrendingUpIcon,
  BrainCircuitIcon,
  TargetIcon,
  FilePenIcon,
  UsersIcon,
  DownloadIcon,
} from '../icons/IconDefs';

type DashboardView = 'overview' | 'analytics' | 'insights' | 'business' | 'roi';

export const AnalyticsDashboardView: React.FC = () => {
  const [activeView, setActiveView] = useState<DashboardView>('overview');
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [dateRange, setDateRange] = useState('last7');
  const [customDateRange, setCustomDateRange] = useState<{ start?: Date; end?: Date }>({});

  const getTimeframeFromRange = (rangeId: string, customStart?: Date, customEnd?: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (rangeId) {
      case 'today':
        return { start: today, end: now, label: 'Today' };
      case 'yesterday': {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return { start: yesterday, end: today, label: 'Yesterday' };
      }
      case 'last7':
        return { start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), end: now, label: 'Last 7 Days' };
      case 'last30':
        return { start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), end: now, label: 'Last 30 Days' };
      case 'last90':
        return { start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), end: now, label: 'Last 90 Days' };
      case 'thisWeek': {
        const firstDay = new Date(today);
        firstDay.setDate(today.getDate() - today.getDay() + 1);
        return { start: firstDay, end: now, label: 'This Week' };
      }
      case 'lastWeek': {
        const lastWeekEnd = new Date(today);
        lastWeekEnd.setDate(today.getDate() - today.getDay());
        const lastWeekStart = new Date(lastWeekEnd);
        lastWeekStart.setDate(lastWeekEnd.getDate() - 6);
        return { start: lastWeekStart, end: lastWeekEnd, label: 'Last Week' };
      }
      case 'thisMonth':
        return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now, label: 'This Month' };
      case 'lastMonth': {
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        return { start: lastMonthStart, end: lastMonthEnd, label: 'Last Month' };
      }
      case 'thisQuarter': {
        const quarter = Math.floor(now.getMonth() / 3);
        const quarterStart = new Date(now.getFullYear(), quarter * 3, 1);
        return { start: quarterStart, end: now, label: 'This Quarter' };
      }
      case 'lastQuarter': {
        const quarter = Math.floor(now.getMonth() / 3);
        const lastQuarterStart = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
        const lastQuarterEnd = new Date(now.getFullYear(), quarter * 3, 0);
        return { start: lastQuarterStart, end: lastQuarterEnd, label: 'Last Quarter' };
      }
      case 'thisYear':
        return { start: new Date(now.getFullYear(), 0, 1), end: now, label: 'This Year' };
      case 'lastYear':
        return {
          start: new Date(now.getFullYear() - 1, 0, 1),
          end: new Date(now.getFullYear() - 1, 11, 31),
          label: 'Last Year'
        };
      case 'all':
        return { start: new Date(2020, 0, 1), end: now, label: 'All Time' };
      case 'custom':
        return {
          start: customStart || new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          end: customEnd || now,
          label: 'Custom Range'
        };
      default:
        return { start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), end: now, label: 'Last 7 Days' };
    }
  };

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const timeframe = getTimeframeFromRange(dateRange, customDateRange.start, customDateRange.end);

        const [writing, ai, collab] = await Promise.all([
          dashboardService.getWritingMetrics(timeframe),
          dashboardService.getAIMetrics(timeframe),
          dashboardService.getCollaborationMetrics(timeframe),
        ]);

        setMetrics({ writing, ai, collab });
      } catch (error) {
        console.error('Failed to load metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMetrics();

    // Subscribe to real-time updates
    const unsubscribe = dashboardService.subscribe((event) => {
      if (event.type === 'DATA_REFRESH') {
        loadMetrics();
      }
    });

    return () => unsubscribe();
  }, [dateRange, customDateRange]);

  const handleDateRangeChange = (range: string, customStart?: Date, customEnd?: Date) => {
    setDateRange(range);
    if (range === 'custom' && customStart && customEnd) {
      setCustomDateRange({ start: customStart, end: customEnd });
    }
  };

  const views = [
    { id: 'overview', label: 'Overview', icon: BarChartIcon },
    { id: 'analytics', label: 'Analytics', icon: TrendingUpIcon },
    { id: 'insights', label: 'AI Insights', icon: BrainCircuitIcon },
    { id: 'business', label: 'Business', icon: TargetIcon },
    { id: 'roi', label: 'ROI', icon: FilePenIcon },
  ] as const;

  return (
    <div className="flex flex-col h-full bg-brand-bg">
      {/* Header with View Selector */}
      <div className="flex-shrink-0 bg-brand-surface/50 border-b border-brand-border/60 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-text flex items-center gap-2">
              <BarChartIcon className="w-6 h-6" />
              Data Visualization Dashboard
            </h1>
            <p className="text-sm text-brand-text-secondary mt-1">
              Real-time analytics, predictive insights, and business intelligence
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <DateRangeFilter
              value={dateRange}
              onChange={handleDateRangeChange}
            />
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-lg font-medium transition-all shadow-sm"
            >
              <DownloadIcon className="w-4 h-4" />
              Export Report
            </button>
            <div className="flex items-center gap-2 px-3 py-2 bg-brand-surface rounded-lg">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-brand-text-secondary">Live</span>
            </div>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex gap-2">
          {views.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveView(id as DashboardView)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeView === id
                  ? 'bg-brand-primary text-white shadow-lg'
                  : 'bg-brand-surface/80 text-brand-text-secondary hover:bg-brand-surface-hover'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-6">
        <AnimatePresence mode="wait">
          {activeView === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
                </div>
              ) : (
                <DashboardGrid />
              )}
            </motion.div>
          )}

          {activeView === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="w-full">
                {/* Key Metrics */}
                {!isLoading && metrics && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricsCard
                      title="Total Words"
                      value={metrics.writing.totalWords.toLocaleString()}
                      change={{
                        value: 12.5,
                        period: 'last week',
                        isPositive: true,
                      }}
                      icon={<FilePenIcon className="w-6 h-6" />}
                      color="primary"
                    />
                    <MetricsCard
                      title="AI Efficiency"
                      value={`${metrics.ai.acceptanceRate}%`}
                      change={{
                        value: 8.2,
                        period: 'last week',
                        isPositive: true,
                      }}
                      icon={<BrainCircuitIcon className="w-6 h-6" />}
                      color="success"
                    />
                    <MetricsCard
                      title="Active Collaborators"
                      value={metrics.collab.activeCollaborators}
                      icon={<UsersIcon className="w-6 h-6" />}
                      color="warning"
                    />
                    <MetricsCard
                      title="Projects"
                      value={metrics.writing.activeProjects}
                      icon={<TargetIcon className="w-6 h-6" />}
                      color="primary"
                    />
                  </div>
                )}

                {/* Charts Grid */}
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="w-full bg-brand-surface/80 border border-brand-border/80 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-brand-text mb-4">
                      Writing Progress
                    </h3>
                    <InteractiveChart type="line" height={300} />
                  </div>

                  <div className="w-full bg-brand-surface/80 border border-brand-border/80 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-brand-text mb-4">
                      Time Distribution
                    </h3>
                    <InteractiveChart type="doughnut" height={300} />
                  </div>

                  <div className="w-full bg-brand-surface/80 border border-brand-border/80 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-brand-text mb-4">
                      Weekly Activity
                    </h3>
                    <InteractiveChart type="bar" height={300} />
                  </div>

                  <div className="w-full bg-brand-surface/80 border border-brand-border/80 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-brand-text mb-4">
                      Performance Metrics
                    </h3>
                    <InteractiveChart type="radar" height={300} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeView === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-brand-surface/80 border border-brand-border/80 rounded-xl p-6">
                <PredictiveInsightsPanel />
              </div>
            </motion.div>
          )}

          {activeView === 'business' && (
            <motion.div
              key="business"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-brand-surface/80 border border-brand-border/80 rounded-xl p-6">
                <BusinessIntelligencePanel />
              </div>
            </motion.div>
          )}

          {activeView === 'roi' && (
            <motion.div
              key="roi"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-brand-surface/80 border border-brand-border/80 rounded-xl p-6">
                <ROICalculator />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        dashboardData={metrics}
        currentView={activeView}
      />
    </div>
  );
};