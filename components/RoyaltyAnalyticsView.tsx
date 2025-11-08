import React, { useState } from 'react';
import { AudiobookProject, AudiobookAnalytics, ListeningMetrics, RevenueMetrics, PlatformMetrics, ChapterAnalytics } from '../types';

interface RoyaltyAnalyticsViewProps {
  projects: AudiobookProject[];
  onUpdateProject: (projectId: string, updates: Partial<AudiobookProject>) => void;
}

type DateRange = '7d' | '30d' | '90d' | '1y' | 'all' | 'custom';
type MetricView = 'revenue' | 'listening' | 'platforms' | 'chapters';

export const RoyaltyAnalyticsView: React.FC<RoyaltyAnalyticsViewProps> = ({ projects, onUpdateProject }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [activeMetric, setActiveMetric] = useState<MetricView>('revenue');
  const [customDateStart, setCustomDateStart] = useState('');
  const [customDateEnd, setCustomDateEnd] = useState('');

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const analytics = selectedProject?.analytics;

  const dateRangeOptions: { value: DateRange; label: string }[] = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' },
    { value: 'all', label: 'All Time' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes.toFixed(0)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins.toFixed(0)}m`;
  };

  const getRevenueGrowth = () => {
    // Simulated growth calculation - in production would compare against previous period
    return 12.5;
  };

  const getListeningGrowth = () => {
    // Simulated growth calculation
    return 8.3;
  };

  const getTopPlatform = () => {
    if (!analytics?.platformBreakdown || analytics.platformBreakdown.length === 0) return null;
    return analytics.platformBreakdown.reduce((top, current) => 
      current.revenue > top.revenue ? current : top
    );
  };

  const getTopChapter = () => {
    if (!analytics?.chapterAnalytics || analytics.chapterAnalytics.length === 0) return null;
    return analytics.chapterAnalytics.reduce((top, current) => 
      current.popularityScore > top.popularityScore ? current : top
    );
  };

  const calculateEngagementScore = (listeningMetrics: ListeningMetrics) => {
    // Weighted engagement score based on completion rate and session duration
    const completionWeight = 0.6;
    const sessionWeight = 0.4;
    const normalizedSession = Math.min(listeningMetrics.averageListeningSessionDuration / 60, 100);
    return (listeningMetrics.averageCompletionRate * completionWeight) + (normalizedSession * sessionWeight);
  };

  if (!selectedProject) {
    return (
      <div className="p-8 text-center text-gray-500">
        No audiobook projects available. Create a project first.
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Project List Sidebar */}
      <div className="w-64 border-r border-gray-200 p-4 overflow-y-auto">
        <h3 className="font-semibold mb-4">Audiobook Analytics</h3>
        <div className="space-y-2">
          {projects.map(project => (
            <button
              key={project.id}
              onClick={() => setSelectedProjectId(project.id)}
              className={`w-full text-left p-3 rounded transition-colors ${
                selectedProjectId === project.id
                  ? 'bg-blue-100 border-l-4 border-blue-600'
                  : 'hover:bg-gray-100'
              }`}
            >
              <div className="font-medium truncate">{project.title}</div>
              <div className="text-xs text-gray-500 mt-1">
                {project.distribution?.status === 'live' ? (
                  <span className="text-green-600">● Live</span>
                ) : (
                  <span className="text-gray-400">○ {project.status}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with Date Range Selector */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Royalty & Analytics Dashboard</h2>
            <div className="flex gap-2">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as DateRange)}
                className="border border-gray-300 rounded px-3 py-2 text-sm"
              >
                {dateRangeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {dateRange === 'custom' && (
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={customDateStart}
                    onChange={(e) => setCustomDateStart(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                  <input
                    type="date"
                    value={customDateEnd}
                    onChange={(e) => setCustomDateEnd(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Metric Navigation */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveMetric('revenue')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeMetric === 'revenue'
                  ? 'bg-green-100 text-green-700 border-2 border-green-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Revenue
            </button>
            <button
              onClick={() => setActiveMetric('listening')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeMetric === 'listening'
                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Listening
            </button>
            <button
              onClick={() => setActiveMetric('platforms')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeMetric === 'platforms'
                  ? 'bg-purple-100 text-purple-700 border-2 border-purple-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Platforms
            </button>
            <button
              onClick={() => setActiveMetric('chapters')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeMetric === 'chapters'
                  ? 'bg-orange-100 text-orange-700 border-2 border-orange-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Chapters
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {!analytics ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-gray-500 mb-2">No analytics data available yet</p>
              <p className="text-sm text-gray-400">Analytics will appear once your audiobook goes live and starts generating listens.</p>
            </div>
          ) : (
            <>
              {/* Revenue Metrics View */}
              {activeMetric === 'revenue' && analytics.revenueMetrics && (
                <div>
                  {/* Revenue Overview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-sm text-green-600 font-medium">Total Revenue</h3>
                        <span className="text-xs text-green-600 bg-green-200 px-2 py-1 rounded">
                          +{getRevenueGrowth()}%
                        </span>
                      </div>
                      <p className="text-3xl font-bold text-green-900">
                        {formatCurrency(analytics.revenueMetrics.totalRevenue, analytics.revenueMetrics.currency)}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-sm text-blue-600 font-medium">Royalty Earnings</h3>
                      </div>
                      <p className="text-3xl font-bold text-blue-900">
                        {formatCurrency(analytics.revenueMetrics.royaltyEarnings, analytics.revenueMetrics.currency)}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        {((analytics.revenueMetrics.royaltyEarnings / analytics.revenueMetrics.totalRevenue) * 100).toFixed(1)}% of total
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-sm text-orange-600 font-medium">Platform Fees</h3>
                      </div>
                      <p className="text-3xl font-bold text-orange-900">
                        {formatCurrency(analytics.revenueMetrics.platformFees, analytics.revenueMetrics.currency)}
                      </p>
                      <p className="text-xs text-orange-600 mt-1">
                        {((analytics.revenueMetrics.platformFees / analytics.revenueMetrics.totalRevenue) * 100).toFixed(1)}% of total
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-sm text-purple-600 font-medium">Net Profit</h3>
                      </div>
                      <p className="text-3xl font-bold text-purple-900">
                        {formatCurrency(analytics.revenueMetrics.netProfit, analytics.revenueMetrics.currency)}
                      </p>
                      <p className="text-xs text-purple-600 mt-1">
                        {((analytics.revenueMetrics.netProfit / analytics.revenueMetrics.totalRevenue) * 100).toFixed(1)}% margin
                      </p>
                    </div>
                  </div>

                  {/* Payout Schedule */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
                    <h3 className="font-semibold text-lg mb-4">Payout Schedule</h3>
                    {analytics.revenueMetrics.payoutSchedule && analytics.revenueMetrics.payoutSchedule.length > 0 ? (
                      <div className="space-y-3">
                        {analytics.revenueMetrics.payoutSchedule.map((date, idx) => {
                          const isPast = new Date(date) < new Date();
                          return (
                            <div key={idx} className={`flex justify-between items-center p-3 rounded ${
                              isPast ? 'bg-gray-50' : 'bg-green-50 border border-green-200'
                            }`}>
                              <div>
                                <div className="font-medium">
                                  {isPast ? 'Paid' : 'Upcoming Payment'}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {new Date(date).toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })}
                                </div>
                              </div>
                              <div className={`text-lg font-semibold ${isPast ? 'text-gray-600' : 'text-green-700'}`}>
                                {formatCurrency(analytics.revenueMetrics.royaltyEarnings / analytics.revenueMetrics.payoutSchedule.length, analytics.revenueMetrics.currency)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No payout schedule configured</p>
                    )}
                  </div>

                  {/* Revenue Breakdown Chart (Placeholder) */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold text-lg mb-4">Revenue Breakdown</h3>
                    <div className="h-64 flex items-center justify-center text-gray-400 border-2 border-dashed rounded">
                      Revenue trend chart would render here
                      <br />
                      (Integration with chart library like Chart.js or Recharts)
                    </div>
                  </div>
                </div>
              )}

              {/* Listening Metrics View */}
              {activeMetric === 'listening' && analytics.listeningMetrics && (
                <div>
                  {/* Listening Overview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-sm text-blue-600 font-medium">Total Listens</h3>
                        <span className="text-xs text-blue-600 bg-blue-200 px-2 py-1 rounded">
                          +{getListeningGrowth()}%
                        </span>
                      </div>
                      <p className="text-3xl font-bold text-blue-900">
                        {formatNumber(analytics.listeningMetrics.totalListens)}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
                      <h3 className="text-sm text-purple-600 font-medium mb-2">Listening Hours</h3>
                      <p className="text-3xl font-bold text-purple-900">
                        {formatNumber(analytics.listeningMetrics.totalListeningHours)}
                      </p>
                      <p className="text-xs text-purple-600 mt-1">
                        {formatDuration(analytics.listeningMetrics.totalListeningHours * 60)} total
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
                      <h3 className="text-sm text-green-600 font-medium mb-2">Completion Rate</h3>
                      <p className="text-3xl font-bold text-green-900">
                        {formatPercentage(analytics.listeningMetrics.averageCompletionRate)}
                      </p>
                      <p className="text-xs text-green-600 mt-1">Average listener completion</p>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
                      <h3 className="text-sm text-orange-600 font-medium mb-2">Avg. Session</h3>
                      <p className="text-3xl font-bold text-orange-900">
                        {formatDuration(analytics.listeningMetrics.averageListeningSessionDuration)}
                      </p>
                      <p className="text-xs text-orange-600 mt-1">Per listening session</p>
                    </div>
                  </div>

                  {/* Listener Insights */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="font-semibold text-lg mb-4">Listener Breakdown</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">New Listeners</span>
                          <div className="text-right">
                            <div className="font-semibold text-lg">{formatNumber(analytics.listeningMetrics.newListeners)}</div>
                            <div className="text-xs text-gray-500">
                              {((analytics.listeningMetrics.newListeners / analytics.listeningMetrics.totalListens) * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(analytics.listeningMetrics.newListeners / analytics.listeningMetrics.totalListens) * 100}%` }}
                          />
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Returning Listeners</span>
                          <div className="text-right">
                            <div className="font-semibold text-lg">{formatNumber(analytics.listeningMetrics.returningListeners)}</div>
                            <div className="text-xs text-gray-500">
                              {((analytics.listeningMetrics.returningListeners / analytics.listeningMetrics.totalListens) * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${(analytics.listeningMetrics.returningListeners / analytics.listeningMetrics.totalListens) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="font-semibold text-lg mb-4">Engagement Score</h3>
                      <div className="flex items-center justify-center h-32">
                        <div className="text-center">
                          <div className="text-5xl font-bold text-blue-600 mb-2">
                            {calculateEngagementScore(analytics.listeningMetrics).toFixed(1)}
                          </div>
                          <div className="text-sm text-gray-600">out of 100</div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-4">
                        Calculated from completion rate ({formatPercentage(analytics.listeningMetrics.averageCompletionRate)}) 
                        and session duration ({formatDuration(analytics.listeningMetrics.averageListeningSessionDuration)})
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Platform Breakdown View */}
              {activeMetric === 'platforms' && analytics.platformBreakdown && (
                <div>
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-2">Performance by Platform</h3>
                    <p className="text-sm text-gray-600">
                      Top Platform: {getTopPlatform()?.platform || 'N/A'} with {formatCurrency(getTopPlatform()?.revenue || 0, analytics.revenueMetrics.currency)}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analytics.platformBreakdown.map((platform, idx) => (
                      <div key={idx} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-lg capitalize">{platform.platform}</h3>
                            {platform.averageRating && (
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map(star => (
                                    <span key={star} className={star <= platform.averageRating! ? 'text-yellow-400' : 'text-gray-300'}>
                                      ★
                                    </span>
                                  ))}
                                </div>
                                <span className="text-sm text-gray-600">
                                  ({platform.reviewCount || 0} reviews)
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                              {formatCurrency(platform.revenue, analytics.revenueMetrics.currency)}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-gray-500">Listens</div>
                            <div className="font-semibold text-lg">{formatNumber(platform.listens)}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Revenue Share</div>
                            <div className="font-semibold text-lg">
                              {((platform.revenue / analytics.revenueMetrics.totalRevenue) * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-600 h-2 rounded-full" 
                              style={{ width: `${(platform.revenue / analytics.revenueMetrics.totalRevenue) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chapter Analytics View */}
              {activeMetric === 'chapters' && analytics.chapterAnalytics && (
                <div>
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-2">Chapter-by-Chapter Performance</h3>
                    <p className="text-sm text-gray-600">
                      Top Chapter: Chapter {getTopChapter()?.chapterNumber || 'N/A'} 
                      {getTopChapter() && ` (${formatPercentage(getTopChapter()!.completionRate)} completion)`}
                    </p>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chapter</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completion Rate</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg. Listen Time</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Skip Rate</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Replay Rate</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Popularity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {analytics.chapterAnalytics
                          .sort((a, b) => a.chapterNumber - b.chapterNumber)
                          .map((chapter) => (
                          <tr key={chapter.chapterNumber} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium">Chapter {chapter.chapterNumber}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      chapter.completionRate >= 80 ? 'bg-green-600' :
                                      chapter.completionRate >= 60 ? 'bg-yellow-600' :
                                      'bg-red-600'
                                    }`}
                                    style={{ width: `${chapter.completionRate}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium">{formatPercentage(chapter.completionRate)}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {formatDuration(chapter.averageListenTime)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`text-sm font-medium ${
                                chapter.skipRate < 10 ? 'text-green-600' :
                                chapter.skipRate < 20 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {formatPercentage(chapter.skipRate)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`text-sm font-medium ${
                                chapter.replayRate > 10 ? 'text-green-600' :
                                chapter.replayRate > 5 ? 'text-blue-600' :
                                'text-gray-600'
                              }`}>
                                {formatPercentage(chapter.replayRate)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                  <div 
                                    className="bg-purple-600 h-2 rounded-full"
                                    style={{ width: `${chapter.popularityScore}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium">{chapter.popularityScore.toFixed(0)}</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Chapter Insights */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-green-700 mb-2">Highest Completion</h4>
                      <div className="text-2xl font-bold text-green-900">
                        Chapter {analytics.chapterAnalytics.reduce((max, ch) => 
                          ch.completionRate > max.completionRate ? ch : max
                        ).chapterNumber}
                      </div>
                      <div className="text-sm text-green-600">
                        {formatPercentage(Math.max(...analytics.chapterAnalytics.map(ch => ch.completionRate)))}
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-yellow-700 mb-2">Most Replayed</h4>
                      <div className="text-2xl font-bold text-yellow-900">
                        Chapter {analytics.chapterAnalytics.reduce((max, ch) => 
                          ch.replayRate > max.replayRate ? ch : max
                        ).chapterNumber}
                      </div>
                      <div className="text-sm text-yellow-600">
                        {formatPercentage(Math.max(...analytics.chapterAnalytics.map(ch => ch.replayRate)))} replay rate
                      </div>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-red-700 mb-2">Highest Skip Rate</h4>
                      <div className="text-2xl font-bold text-red-900">
                        Chapter {analytics.chapterAnalytics.reduce((max, ch) => 
                          ch.skipRate > max.skipRate ? ch : max
                        ).chapterNumber}
                      </div>
                      <div className="text-sm text-red-600">
                        {formatPercentage(Math.max(...analytics.chapterAnalytics.map(ch => ch.skipRate)))} skip rate
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};