import React, { useState } from 'react';
import { X, TrendingUp, TrendingDown, Calendar, Filter, Download, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface Breadcrumb {
  label: string;
  level: number;
}

interface MetricDetail {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
}

interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

interface SegmentData {
  name: string;
  value: number;
  percentage: number;
  change?: number;
}

export interface DrillDownData {
  title: string;
  type: 'words' | 'time' | 'ai-usage' | 'collaboration' | 'productivity' | 'revenue' | 'generic';
  currentValue: string | number;
  change?: number;
  period: string;
  metrics: MetricDetail[];
  timeSeries: TimeSeriesData[];
  segments?: SegmentData[];
  insights?: string[];
}

interface DrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: DrillDownData | null;
}

const DrillDownModal: React.FC<DrillDownModalProps> = ({ isOpen, onClose, data }) => {
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([{ label: 'Overview', level: 0 }]);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  if (!data) return null;

  const handleSegmentClick = (segmentName: string) => {
    setSelectedSegment(segmentName);
    setBreadcrumbs([...breadcrumbs, { label: segmentName, level: breadcrumbs.length }]);
  };

  const handleBreadcrumbClick = (level: number) => {
    setBreadcrumbs(breadcrumbs.slice(0, level + 1));
    if (level === 0) setSelectedSegment(null);
  };

  const exportData = () => {
    const exportContent = {
      title: data.title,
      currentValue: data.currentValue,
      period: data.period,
      metrics: data.metrics,
      timeSeries: data.timeSeries,
      segments: data.segments,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportContent, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.title.toLowerCase().replace(/\s+/g, '-')}-analytics-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getTypeIcon = () => {
    const iconClass = "w-6 h-6";
    switch (data.type) {
      case 'words': return <span className="text-2xl">📝</span>;
      case 'time': return <span className="text-2xl">⏱️</span>;
      case 'ai-usage': return <span className="text-2xl">🤖</span>;
      case 'collaboration': return <span className="text-2xl">👥</span>;
      case 'productivity': return <span className="text-2xl">⚡</span>;
      case 'revenue': return <span className="text-2xl">💰</span>;
      default: return <TrendingUp className={iconClass} />;
    }
  };

  const renderTimeSeries = () => {
    if (!data.timeSeries.length) return null;

    const maxValue = Math.max(...data.timeSeries.map(d => d.value));
    const minValue = Math.min(...data.timeSeries.map(d => d.value));
    const range = maxValue - minValue || 1;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trend Analysis</h3>
          <div className="flex gap-2">
            {(['7d', '30d', '90d', '1y'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-brand-blue text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <div className="relative h-64 bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          <div className="absolute inset-0 p-4">
            <svg className="w-full h-full">
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map((percent) => (
                <line
                  key={percent}
                  x1="0"
                  y1={`${percent}%`}
                  x2="100%"
                  y2={`${percent}%`}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-gray-300 dark:text-gray-600"
                  strokeDasharray="4"
                />
              ))}

              {/* Line chart */}
              <polyline
                points={data.timeSeries
                  .map((d, i) => {
                    const x = (i / (data.timeSeries.length - 1)) * 100;
                    const y = 100 - ((d.value - minValue) / range) * 80;
                    return `${x}%,${y}%`;
                  })
                  .join(' ')}
                fill="none"
                stroke="rgb(59, 130, 246)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {data.timeSeries.map((d, i) => {
                const x = (i / (data.timeSeries.length - 1)) * 100;
                const y = 100 - ((d.value - minValue) / range) * 80;
                return (
                  <g key={i}>
                    <circle
                      cx={`${x}%`}
                      cy={`${y}%`}
                      r="4"
                      fill="rgb(59, 130, 246)"
                      className="hover:r-6 transition-all cursor-pointer"
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* X-axis labels */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4 pb-2 text-xs text-gray-600 dark:text-gray-400">
            {data.timeSeries.filter((_, i) => i % Math.ceil(data.timeSeries.length / 5) === 0).map((d, i) => (
              <span key={i}>{d.date}</span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderSegments = () => {
    if (!data.segments?.length) return null;

    const displaySegments = selectedSegment
      ? data.segments.filter(s => s.name === selectedSegment)
      : data.segments;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Breakdown by Category</h3>
        <div className="space-y-2">
          {displaySegments.map((segment) => (
            <div
              key={segment.name}
              className="group p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all cursor-pointer"
              onClick={() => !selectedSegment && handleSegmentClick(segment.name)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-900 dark:text-white">{segment.name}</span>
                  {!selectedSegment && (
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-brand-blue transition-colors" />
                  )}
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900 dark:text-white">{segment.value.toLocaleString()}</div>
                  {segment.change !== undefined && (
                    <div className={`text-sm flex items-center gap-1 ${
                      segment.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {segment.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(segment.change)}%
                    </div>
                  )}
                </div>
              </div>
              <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${segment.percentage}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-brand-blue to-brand-purple"
                />
              </div>
              <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">{segment.percentage}% of total</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-6xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getTypeIcon()}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{data.title}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{data.period}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={exportData}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-brand-blue dark:hover:text-brand-blue hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    title="Export data"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Breadcrumbs */}
              <div className="flex items-center gap-2 text-sm">
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
                    <button
                      onClick={() => handleBreadcrumbClick(crumb.level)}
                      className={`hover:text-brand-blue transition-colors ${
                        index === breadcrumbs.length - 1
                          ? 'text-gray-900 dark:text-white font-semibold'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {crumb.label}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
              <div className="space-y-8">
                {/* Current Value Highlight */}
                <div className="bg-gradient-to-br from-brand-blue/10 to-brand-purple/10 dark:from-brand-blue/20 dark:to-brand-purple/20 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Current Value</div>
                      <div className="text-4xl font-bold text-gray-900 dark:text-white">{data.currentValue}</div>
                    </div>
                    {data.change !== undefined && (
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                        data.change >= 0
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                        {data.change >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                        <span className="text-2xl font-bold">{Math.abs(data.change)}%</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.metrics.map((metric, index) => (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{metric.label}</div>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{metric.value}</div>
                        {metric.change !== undefined && (
                          <div className={`flex items-center gap-1 text-sm ${
                            metric.change >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {metric.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            {Math.abs(metric.change)}%
                          </div>
                        )}
                      </div>
                      {metric.trend && (
                        <div className="mt-2 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className={`h-full w-2/3 ${
                            metric.trend === 'up' ? 'bg-green-500' :
                            metric.trend === 'down' ? 'bg-red-500' :
                            'bg-gray-400'
                          }`} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Time Series Chart */}
                {renderTimeSeries()}

                {/* Segments Breakdown */}
                {renderSegments()}

                {/* Insights */}
                {data.insights && data.insights.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Key Insights</h3>
                    <div className="space-y-2">
                      {data.insights.map((insight, index) => (
                        <div key={index} className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                          <div className="flex-shrink-0 w-6 h-6 bg-brand-blue text-white rounded-full flex items-center justify-center text-sm font-semibold">
                            {index + 1}
                          </div>
                          <p className="text-gray-700 dark:text-gray-300">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DrillDownModal;