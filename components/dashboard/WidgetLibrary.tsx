import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardWidget } from '../../types/dashboard';
import {
  PlusIcon,
  XIcon,
  TrendingUpIcon,
  BarChartIcon,
  ActivityIcon,
  DollarSignIcon,
  BrainIcon,
  TargetIcon,
  UsersIcon,
  ZapIcon,
} from '../icons/IconDefs';

interface WidgetTemplate {
  id: string;
  type: DashboardWidget['type'];
  title: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  defaultSize: { w: number; h: number };
  category: 'metrics' | 'charts' | 'insights' | 'tools';
  config?: Record<string, any>;
}

interface WidgetLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWidget: (template: WidgetTemplate) => void;
}

const widgetTemplates: WidgetTemplate[] = [
  // Metrics
  {
    id: 'metric-words',
    type: 'metric',
    title: 'Word Count',
    description: 'Track total words written',
    icon: TrendingUpIcon,
    defaultSize: { w: 3, h: 2 },
    category: 'metrics',
    config: { metricKey: 'totalWords', color: 'primary' },
  },
  {
    id: 'metric-efficiency',
    type: 'metric',
    title: 'AI Efficiency',
    description: 'Monitor AI usage efficiency',
    icon: ZapIcon,
    defaultSize: { w: 3, h: 2 },
    category: 'metrics',
    config: { metricKey: 'aiEfficiency', color: 'success' },
  },
  {
    id: 'metric-productivity',
    type: 'metric',
    title: 'Productivity Score',
    description: 'Overall productivity metrics',
    icon: ActivityIcon,
    defaultSize: { w: 3, h: 2 },
    category: 'metrics',
    config: { metricKey: 'productivity', color: 'info' },
  },
  {
    id: 'metric-revenue',
    type: 'metric',
    title: 'Revenue',
    description: 'Total revenue and earnings',
    icon: DollarSignIcon,
    defaultSize: { w: 3, h: 2 },
    category: 'metrics',
    config: { metricKey: 'revenue', color: 'warning' },
  },
  
  // Charts
  {
    id: 'chart-writing-progress',
    type: 'chart',
    title: 'Writing Progress',
    description: 'Line chart showing writing progress over time',
    icon: BarChartIcon,
    defaultSize: { w: 6, h: 4 },
    category: 'charts',
    config: { chartType: 'line' },
  },
  {
    id: 'chart-ai-usage',
    type: 'chart',
    title: 'AI Usage',
    description: 'Bar chart tracking AI tool usage',
    icon: BarChartIcon,
    defaultSize: { w: 6, h: 4 },
    category: 'charts',
    config: { chartType: 'bar' },
  },
  {
    id: 'chart-performance',
    type: 'chart',
    title: 'Performance Trends',
    description: 'Area chart showing performance metrics',
    icon: TrendingUpIcon,
    defaultSize: { w: 6, h: 4 },
    category: 'charts',
    config: { chartType: 'area' },
  },
  
  // Insights
  {
    id: 'insights-predictive',
    type: 'insight',
    title: 'Predictive Insights',
    description: 'AI-powered predictions and recommendations',
    icon: BrainIcon,
    defaultSize: { w: 6, h: 6 },
    category: 'insights',
    config: {},
  },
  {
    id: 'insights-goals',
    type: 'custom',
    title: 'Goals Tracker',
    description: 'Track and manage your writing goals',
    icon: TargetIcon,
    defaultSize: { w: 6, h: 5 },
    category: 'insights',
    config: { component: 'goals' },
  },
  
  // Tools
  {
    id: 'tool-roi',
    type: 'roi',
    title: 'ROI Calculator',
    description: 'Calculate return on investment',
    icon: DollarSignIcon,
    defaultSize: { w: 6, h: 4 },
    category: 'tools',
    config: {},
  },
  {
    id: 'tool-bi',
    type: 'custom',
    title: 'Business Intelligence',
    description: 'Market insights and analytics',
    icon: UsersIcon,
    defaultSize: { w: 6, h: 4 },
    category: 'tools',
    config: { component: 'business-intelligence' },
  },
];

export const WidgetLibrary: React.FC<WidgetLibraryProps> = ({
  isOpen,
  onClose,
  onAddWidget,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', label: 'All Widgets', count: widgetTemplates.length },
    { id: 'metrics', label: 'Metrics', count: widgetTemplates.filter(w => w.category === 'metrics').length },
    { id: 'charts', label: 'Charts', count: widgetTemplates.filter(w => w.category === 'charts').length },
    { id: 'insights', label: 'Insights', count: widgetTemplates.filter(w => w.category === 'insights').length },
    { id: 'tools', label: 'Tools', count: widgetTemplates.filter(w => w.category === 'tools').length },
  ];

  const filteredWidgets = widgetTemplates.filter(widget => {
    const matchesCategory = selectedCategory === 'all' || widget.category === selectedCategory;
    const matchesSearch = widget.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         widget.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddWidget = (template: WidgetTemplate) => {
    onAddWidget(template);
    // Don't close automatically - allow adding multiple widgets
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-brand-surface border border-brand-border rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border/60">
                <div>
                  <h2 className="text-2xl font-bold text-brand-text">Widget Library</h2>
                  <p className="text-sm text-brand-text-secondary mt-1">
                    Choose widgets to add to your dashboard
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-brand-surface-hover rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <XIcon className="w-5 h-5 text-brand-text-secondary" />
                </button>
              </div>

              {/* Search */}
              <div className="px-6 py-4 border-b border-brand-border/60">
                <input
                  type="text"
                  placeholder="Search widgets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 bg-brand-bg border border-brand-border rounded-lg text-brand-text placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              {/* Categories */}
              <div className="px-6 py-3 border-b border-brand-border/60 bg-brand-bg/50">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-brand-primary text-white'
                          : 'bg-brand-surface text-brand-text hover:bg-brand-surface-hover'
                      }`}
                    >
                      {category.label}
                      <span className="ml-2 opacity-60">({category.count})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Widget Grid */}
              <div className="flex-1 overflow-y-auto p-6">
                {filteredWidgets.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-brand-text-secondary">No widgets found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredWidgets.map((widget) => {
                      const IconComponent = widget.icon;
                      return (
                        <motion.div
                          key={widget.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="bg-brand-bg border border-brand-border rounded-xl p-4 hover:border-brand-primary/50 transition-all cursor-pointer group"
                          onClick={() => handleAddWidget(widget)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="p-2 bg-brand-primary/10 rounded-lg group-hover:bg-brand-primary/20 transition-colors">
                              <IconComponent className="w-6 h-6 text-brand-primary" />
                            </div>
                            <button
                              className="p-1.5 bg-brand-primary/10 rounded-lg hover:bg-brand-primary/20 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddWidget(widget);
                              }}
                              aria-label="Add widget"
                            >
                              <PlusIcon className="w-4 h-4 text-brand-primary" />
                            </button>
                          </div>
                          
                          <h3 className="text-lg font-semibold text-brand-text mb-1">
                            {widget.title}
                          </h3>
                          <p className="text-sm text-brand-text-secondary mb-3">
                            {widget.description}
                          </p>
                          
                          <div className="flex items-center justify-between text-xs text-brand-text-secondary">
                            <span className="capitalize">{widget.category}</span>
                            <span>{widget.defaultSize.w}×{widget.defaultSize.h} grid</span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-brand-border/60 bg-brand-bg/50">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-brand-text-secondary">
                    {filteredWidgets.length} widget{filteredWidgets.length !== 1 ? 's' : ''} available
                  </p>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover transition-colors font-medium"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};