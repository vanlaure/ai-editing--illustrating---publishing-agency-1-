import React, { useState, useEffect } from 'react';
import { dashboardService } from '../../services/dashboardService';
import type { WritingMetrics, AIMetrics, CollaborationMetrics, AnalyticsTimeframe } from '../../types/dashboard';

type ComparisonMode = 'period' | 'project' | 'benchmark';
type ComparisonPeriod = 'week' | 'month' | 'quarter' | 'year';
type MetricCategory = 'writing' | 'ai' | 'collaboration';
type TimeframePeriod = 'day' | 'week' | 'month' | 'quarter' | 'year';

interface ComparisonData {
  current: any;
  previous: any;
  percentChange: number;
  trend: 'up' | 'down' | 'neutral';
}

export const ComparisonView: React.FC = () => {
  const [mode, setMode] = useState<ComparisonMode>('period');
  const [period, setPeriod] = useState<ComparisonPeriod>('week');
  const [category, setCategory] = useState<MetricCategory>('writing');
  const [currentTimeframe, setCurrentTimeframe] = useState<TimeframePeriod>('week');
  const [comparisonData, setComparisonData] = useState<Record<string, ComparisonData>>({});
  const [loading, setLoading] = useState(true);

  const createTimeframe = (period: TimeframePeriod): AnalyticsTimeframe => {
    const end = new Date();
    const start = new Date();
    
    switch (period) {
      case 'day':
        start.setHours(0, 0, 0, 0);
        return { start, end, label: 'Today' };
      case 'week':
        start.setDate(end.getDate() - 7);
        return { start, end, label: 'This Week' };
      case 'month':
        start.setMonth(end.getMonth() - 1);
        return { start, end, label: 'This Month' };
      case 'quarter':
        start.setMonth(end.getMonth() - 3);
        return { start, end, label: 'This Quarter' };
      case 'year':
        start.setFullYear(end.getFullYear() - 1);
        return { start, end, label: 'This Year' };
    }
  };

  useEffect(() => {
    loadComparisonData();
  }, [mode, period, category, currentTimeframe]);

  const loadComparisonData = async () => {
    setLoading(true);
    try {
      if (mode === 'period') {
        await loadPeriodComparison();
      } else if (mode === 'project') {
        await loadProjectComparison();
      } else if (mode === 'benchmark') {
        await loadBenchmarkComparison();
      }
    } catch (error) {
      console.error('Failed to load comparison data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPeriodComparison = async () => {
    const timeframe = createTimeframe(currentTimeframe);
    const currentData = await fetchMetricData(timeframe);
    const previousData = await fetchMetricData(getPreviousTimeframe(timeframe));
    
    const comparisons: Record<string, ComparisonData> = {};
    Object.keys(currentData).forEach(key => {
      const current = currentData[key];
      const previous = previousData[key] || 0;
      const percentChange = previous !== 0 ? ((current - previous) / previous) * 100 : 0;
      
      comparisons[key] = {
        current,
        previous,
        percentChange,
        trend: percentChange > 0 ? 'up' : percentChange < 0 ? 'down' : 'neutral'
      };
    });
    
    setComparisonData(comparisons);
  };

  const loadProjectComparison = async () => {
    // Simulate project comparison data
    const timeframe = createTimeframe(currentTimeframe);
    const project1Data = await fetchMetricData(timeframe);
    const project2Data = generateProjectData();
    
    const comparisons: Record<string, ComparisonData> = {};
    Object.keys(project1Data).forEach(key => {
      const current = project1Data[key];
      const previous = project2Data[key] || 0;
      const percentChange = previous !== 0 ? ((current - previous) / previous) * 100 : 0;
      
      comparisons[key] = {
        current,
        previous,
        percentChange,
        trend: percentChange > 0 ? 'up' : percentChange < 0 ? 'down' : 'neutral'
      };
    });
    
    setComparisonData(comparisons);
  };

  const loadBenchmarkComparison = async () => {
    const timeframe = createTimeframe(currentTimeframe);
    const currentData = await fetchMetricData(timeframe);
    const benchmarks = generateBenchmarkData();
    
    const comparisons: Record<string, ComparisonData> = {};
    Object.keys(currentData).forEach(key => {
      const current = currentData[key];
      const benchmark = benchmarks[key] || 0;
      const percentChange = benchmark !== 0 ? ((current - benchmark) / benchmark) * 100 : 0;
      
      comparisons[key] = {
        current,
        previous: benchmark,
        percentChange,
        trend: percentChange > 0 ? 'up' : percentChange < 0 ? 'down' : 'neutral'
      };
    });
    
    setComparisonData(comparisons);
  };

  const fetchMetricData = async (timeframe: AnalyticsTimeframe): Promise<Record<string, number>> => {
    if (category === 'writing') {
      const metrics = await dashboardService.getWritingMetrics(timeframe);
      return {
        totalWords: metrics.totalWords,
        wordsToday: metrics.wordsToday,
        averageWordsPerDay: metrics.averageWordsPerDay,
        productivityScore: metrics.productivityScore
      };
    } else if (category === 'ai') {
      const metrics = await dashboardService.getAIMetrics(timeframe);
      return {
        totalSuggestions: metrics.totalSuggestions,
        acceptedSuggestions: metrics.acceptedSuggestions,
        acceptanceRate: metrics.acceptanceRate,
        aiUsageHours: metrics.aiUsageHours
      };
    } else {
      const metrics = await dashboardService.getCollaborationMetrics(timeframe);
      return {
        activeCollaborators: metrics.activeCollaborators,
        comments: metrics.comments,
        resolvedComments: metrics.resolvedComments,
        collaborationHours: metrics.collaborationHours
      };
    }
  };

  const getPreviousTimeframe = (timeframe: AnalyticsTimeframe): AnalyticsTimeframe => {
    const duration = timeframe.end.getTime() - timeframe.start.getTime();
    const previousEnd = new Date(timeframe.start.getTime());
    const previousStart = new Date(previousEnd.getTime() - duration);
    
    return {
      start: previousStart,
      end: previousEnd,
      label: `Previous ${timeframe.label}`
    };
  };

  const generateProjectData = (): Record<string, number> => {
    return {
      wordsWritten: Math.floor(Math.random() * 50000) + 10000,
      sessionsCompleted: Math.floor(Math.random() * 50) + 10,
      averageSessionLength: Math.floor(Math.random() * 60) + 30,
      productivity: Math.floor(Math.random() * 40) + 60,
      requestsCount: Math.floor(Math.random() * 500) + 100,
      tokensUsed: Math.floor(Math.random() * 100000) + 20000,
      averageLatency: Math.floor(Math.random() * 500) + 200,
      successRate: Math.floor(Math.random() * 20) + 80,
      activeCollaborators: Math.floor(Math.random() * 10) + 1,
      commentsCount: Math.floor(Math.random() * 100) + 20,
      resolvedIssues: Math.floor(Math.random() * 50) + 10,
      mergeConflicts: Math.floor(Math.random() * 10)
    };
  };

  const generateBenchmarkData = (): Record<string, number> => {
    return {
      wordsWritten: 30000,
      sessionsCompleted: 25,
      averageSessionLength: 45,
      productivity: 75,
      requestsCount: 300,
      tokensUsed: 50000,
      averageLatency: 350,
      successRate: 90,
      activeCollaborators: 5,
      commentsCount: 50,
      resolvedIssues: 30,
      mergeConflicts: 3
    };
  };

  const formatMetricName = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  const formatValue = (value: number, key: string): string => {
    if (key.includes('Rate') || key.includes('productivity')) {
      return `${value.toFixed(1)}%`;
    }
    if (key.includes('Latency') || key.includes('Length')) {
      return `${value.toFixed(0)}ms`;
    }
    return value.toLocaleString();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Comparison Analytics</h2>
        <div className="flex gap-2">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as ComparisonMode)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="period">Period Comparison</option>
            <option value="project">Project Comparison</option>
            <option value="benchmark">Benchmark Comparison</option>
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as MetricCategory)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="writing">Writing Metrics</option>
            <option value="ai">AI Metrics</option>
            <option value="collaboration">Collaboration Metrics</option>
          </select>
          <select
            value={currentTimeframe}
            onChange={(e) => setCurrentTimeframe(e.target.value as TimeframePeriod)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="day">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Comparison Mode Description */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          {mode === 'period' && 'Compare current period metrics with the previous period'}
          {mode === 'project' && 'Compare metrics between different projects'}
          {mode === 'benchmark' && 'Compare your metrics against industry benchmarks and averages'}
        </p>
      </div>

      {/* Comparison Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(comparisonData).map(([key, data]) => (
            <div
              key={key}
              className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {formatMetricName(key)}
                </h3>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    data.trend === 'up'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : data.trend === 'down'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}
                >
                  {data.trend === 'up' ? '↑' : data.trend === 'down' ? '↓' : '→'}{' '}
                  {Math.abs(data.percentChange).toFixed(1)}%
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatValue(data.current, key)}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {mode === 'period' && 'Previous'}
                    {mode === 'project' && 'Other Project'}
                    {mode === 'benchmark' && 'Benchmark'}
                  </div>
                  <div className="text-lg font-semibold text-gray-600 dark:text-gray-300">
                    {formatValue(data.previous, key)}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Difference</span>
                    <span
                      className={`font-medium ${
                        data.trend === 'up'
                          ? 'text-green-600 dark:text-green-400'
                          : data.trend === 'down'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {formatValue(Math.abs(data.current - data.previous), key)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Insights Section */}
      {!loading && Object.keys(comparisonData).length > 0 && (
        <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-3">
            Key Insights
          </h3>
          <ul className="space-y-2">
            {generateInsights().map((insight, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-purple-800 dark:text-purple-200">
                <span className="text-purple-500 dark:text-purple-400 mt-0.5">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  function generateInsights(): string[] {
    const insights: string[] = [];
    const positiveChanges = Object.entries(comparisonData).filter(([_, data]) => data.trend === 'up');
    const negativeChanges = Object.entries(comparisonData).filter(([_, data]) => data.trend === 'down');

    if (positiveChanges.length > 0) {
      const topImprovement = positiveChanges.sort((a, b) => b[1].percentChange - a[1].percentChange)[0];
      insights.push(
        `${formatMetricName(topImprovement[0])} showed the highest improvement at ${topImprovement[1].percentChange.toFixed(1)}%`
      );
    }

    if (negativeChanges.length > 0) {
      const topDecline = negativeChanges.sort((a, b) => a[1].percentChange - b[1].percentChange)[0];
      insights.push(
        `${formatMetricName(topDecline[0])} declined by ${Math.abs(topDecline[1].percentChange).toFixed(1)}% - consider reviewing this area`
      );
    }

    const avgChange = Object.values(comparisonData).reduce((sum, data) => sum + data.percentChange, 0) / Object.keys(comparisonData).length;
    if (avgChange > 0) {
      insights.push(`Overall performance improved by an average of ${avgChange.toFixed(1)}%`);
    } else if (avgChange < 0) {
      insights.push(`Overall performance declined by an average of ${Math.abs(avgChange).toFixed(1)}%`);
    } else {
      insights.push('Performance remained stable compared to the comparison baseline');
    }

    return insights;
  }
};