import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MetricsCard } from './MetricsCard';
import { WritingProgressChart } from './WritingProgressChart';
import {
  FilePenIcon,
  BrainCircuitIcon,
  TrendingUpIcon,
  UsersIcon,
  TargetIcon,
  BarChartIcon,
} from '../icons/IconDefs';

const ClockIcon = TargetIcon;
const ZapIcon = BrainCircuitIcon;

// Mock data - in real implementation, this would come from API
const mockMetrics = {
  totalWords: 45280,
  wordsChange: { value: 12.5, period: 'last week', isPositive: true },
  aiSuggestions: 156,
  aiSuggestionsChange: { value: 8.2, period: 'last week', isPositive: true },
  collaborationHours: 24.5,
  collaborationChange: { value: -3.1, period: 'last week', isPositive: false },
  projectsCompleted: 3,
  projectsChange: { value: 50, period: 'last month', isPositive: true },
  aiEfficiency: 73,
  efficiencyChange: { value: 15.3, period: 'last week', isPositive: true },
};

const mockChartData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      label: 'Words Written',
      data: [1200, 1800, 1400, 2200, 1600, 800, 2000],
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true,
    },
    {
      label: 'AI Suggestions Applied',
      data: [15, 22, 18, 28, 20, 8, 25],
      borderColor: 'rgb(16, 185, 129)',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      tension: 0.4,
      fill: true,
    },
  ],
};

interface DashboardGridProps {
  className?: string;
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({ className = '' }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d'>('7d');

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Analytics Dashboard</h1>
          <p className="text-brand-text-secondary mt-1">
            Track your writing progress, AI efficiency, and collaboration metrics
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(['7d', '30d', '90d'] as const).map((timeframe) => (
            <button
              key={timeframe}
              onClick={() => setSelectedTimeframe(timeframe)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                selectedTimeframe === timeframe
                  ? 'bg-brand-primary text-white'
                  : 'bg-brand-surface text-brand-text-secondary hover:bg-brand-surface-hover'
              }`}
            >
              {timeframe === '7d' ? '7 Days' : timeframe === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <MetricsCard
          title="Total Words"
          value={mockMetrics.totalWords.toLocaleString()}
          change={mockMetrics.wordsChange}
          icon={<FilePenIcon className="w-6 h-6" />}
          color="primary"
        />

        <MetricsCard
          title="AI Suggestions"
          value={mockMetrics.aiSuggestions}
          change={mockMetrics.aiSuggestionsChange}
          icon={<BrainCircuitIcon className="w-6 h-6" />}
          color="success"
        />

        <MetricsCard
          title="Collaboration Hours"
          value={`${mockMetrics.collaborationHours}h`}
          change={mockMetrics.collaborationChange}
          icon={<UsersIcon className="w-6 h-6" />}
          color="warning"
        />

        <MetricsCard
          title="AI Efficiency"
          value={`${mockMetrics.aiEfficiency}%`}
          change={mockMetrics.efficiencyChange}
          icon={<ZapIcon className="w-6 h-6" />}
          color="success"
        />
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Writing Progress Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-brand-surface/80 border border-brand-border/80 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-brand-text">Writing Progress</h3>
            <TrendingUpIcon className="w-5 h-5 text-green-400" />
          </div>
          <WritingProgressChart
            data={mockChartData}
            title=""
            height={250}
          />
        </motion.div>

        {/* Project Status Overview */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-brand-surface/80 border border-brand-border/80 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-brand-text">Project Overview</h3>
            <TargetIcon className="w-5 h-5 text-brand-primary" />
          </div>

          <div className="space-y-4">
            {/* Project Progress Bars */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-brand-text-secondary">Fantasy Novel</span>
                <span className="text-brand-text">75%</span>
              </div>
              <div className="w-full bg-brand-border/40 rounded-full h-2">
                <div className="bg-brand-primary h-2 rounded-full w-3/4 transition-all duration-500" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-brand-text-secondary">Short Stories</span>
                <span className="text-brand-text">45%</span>
              </div>
              <div className="w-full bg-brand-border/40 rounded-full h-2">
                <div className="bg-brand-primary h-2 rounded-full w-2/4 transition-all duration-500" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-brand-text-secondary">Marketing Copy</span>
                <span className="text-brand-text">90%</span>
              </div>
              <div className="w-full bg-brand-border/40 rounded-full h-2">
                <div className="bg-brand-primary h-2 rounded-full w-9/10 transition-all duration-500" />
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 grid grid-cols-2 gap-4 pt-4 border-t border-brand-border/60">
            <div className="text-center">
              <div className="text-2xl font-bold text-brand-primary">3</div>
              <div className="text-xs text-brand-text-secondary">Active Projects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">12</div>
              <div className="text-xs text-brand-text-secondary">Days to Deadline</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Insights Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-gradient-to-r from-brand-primary/10 to-brand-primary/5 border border-brand-primary/20 rounded-xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <BrainCircuitIcon className="w-6 h-6 text-brand-primary" />
          <h3 className="text-lg font-semibold text-brand-text">AI Insights</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/50 dark:bg-brand-surface/50 rounded-lg p-4">
            <h4 className="font-medium text-brand-text mb-2">Writing Pattern</h4>
            <p className="text-sm text-brand-text-secondary">
              You write most productively between 9-11 AM. Consider scheduling deep work sessions during this time.
            </p>
          </div>

          <div className="bg-white/50 dark:bg-brand-surface/50 rounded-lg p-4">
            <h4 className="font-medium text-brand-text mb-2">Genre Trends</h4>
            <p className="text-sm text-brand-text-secondary">
              Fantasy novels with strong world-building are trending. Your current project aligns well with market demand.
            </p>
          </div>

          <div className="bg-white/50 dark:bg-brand-surface/50 rounded-lg p-4">
            <h4 className="font-medium text-brand-text mb-2">Collaboration</h4>
            <p className="text-sm text-brand-text-secondary">
              Your team collaboration has increased 15% this week. Consider more real-time editing sessions.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};