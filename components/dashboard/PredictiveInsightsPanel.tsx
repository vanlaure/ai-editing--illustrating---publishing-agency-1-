import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PredictiveInsight } from '../../types/dashboard';
import { dashboardService } from '../../services/dashboardService';
import {
  BrainCircuitIcon,
  TrendingUpIcon,
  AlertTriangleIcon,
  LightbulbIcon,
  TargetIcon,
} from '../icons/IconDefs';

const getInsightIcon = (type: PredictiveInsight['type']) => {
  switch (type) {
    case 'completion':
      return TargetIcon;
    case 'trend':
      return TrendingUpIcon;
    case 'recommendation':
      return LightbulbIcon;
    case 'alert':
      return AlertTriangleIcon;
    default:
      return BrainCircuitIcon;
  }
};

const getInsightColor = (impact: PredictiveInsight['impact']) => {
  switch (impact) {
    case 'high':
      return 'from-red-500/20 to-red-500/10 border-red-500/30 text-red-400';
    case 'medium':
      return 'from-yellow-500/20 to-yellow-500/10 border-yellow-500/30 text-yellow-400';
    case 'low':
      return 'from-blue-500/20 to-blue-500/10 border-blue-500/30 text-blue-400';
  }
};

export const PredictiveInsightsPanel: React.FC = () => {
  const [insights, setInsights] = useState<PredictiveInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const now = new Date();
        const timeframe = {
          start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          end: now,
          label: 'Last 7 Days',
        };

        const [writingMetrics, aiMetrics] = await Promise.all([
          dashboardService.getWritingMetrics(timeframe),
          dashboardService.getAIMetrics(timeframe),
        ]);

        const generatedInsights = await dashboardService.generatePredictiveInsights(
          writingMetrics,
          aiMetrics
        );

        setInsights(generatedInsights);
      } catch (error) {
        console.error('Failed to fetch insights:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsights();

    // Subscribe to real-time updates
    const unsubscribe = dashboardService.subscribe((event) => {
      if (event.type === 'INSIGHT_GENERATED') {
        setInsights(prev => [...prev, event.payload]);
      }
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <BrainCircuitIcon className="w-12 h-12 text-brand-text-secondary mb-4" />
        <p className="text-brand-text-secondary">
          No insights available yet. Keep writing to generate predictions!
        </p>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BrainCircuitIcon className="w-5 h-5 text-brand-primary" />
          <h3 className="text-lg font-semibold text-brand-text">AI Insights</h3>
        </div>
        <span className="text-xs text-brand-text-secondary">
          {insights.length} insights
        </span>
      </div>

      <div className="space-y-3 max-h-[calc(100%-60px)] overflow-y-auto pr-2">
        <AnimatePresence>
          {insights.map((insight, index) => {
            const IconComponent = getInsightIcon(insight.type);
            const colorClass = getInsightColor(insight.impact);
            const isExpanded = selectedInsight === insight.id;

            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-gradient-to-r ${colorClass} border rounded-lg p-4 cursor-pointer transition-all hover:scale-[1.02]`}
                onClick={() => setSelectedInsight(isExpanded ? null : insight.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 p-2 rounded-lg bg-current/10`}>
                    <IconComponent className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-brand-text truncate">
                        {insight.title}
                      </h4>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          insight.impact === 'high' ? 'bg-red-500/20' :
                          insight.impact === 'medium' ? 'bg-yellow-500/20' :
                          'bg-blue-500/20'
                        }`}>
                          {insight.impact}
                        </span>
                        <span className="text-xs text-brand-text-secondary">
                          {Math.round(insight.confidence * 100)}% sure
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-brand-text-secondary mb-2">
                      {insight.description}
                    </p>

                    <AnimatePresence>
                      {isExpanded && insight.suggestedActions && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 pt-3 border-t border-current/20"
                        >
                          <p className="text-xs font-semibold text-brand-text mb-2">
                            Suggested Actions:
                          </p>
                          <ul className="space-y-1">
                            {insight.suggestedActions.map((action, i) => (
                              <li key={i} className="text-xs text-brand-text-secondary flex items-start gap-2">
                                <span className="text-brand-primary mt-0.5">•</span>
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {insight.actionable && insight.suggestedActions && (
                      <button
                        className="mt-2 text-xs font-medium text-brand-primary hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedInsight(isExpanded ? null : insight.id);
                        }}
                      >
                        {isExpanded ? 'Show less' : 'View actions'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Confidence Bar */}
                <div className="mt-3">
                  <div className="w-full bg-brand-border/40 rounded-full h-1">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${insight.confidence * 100}%` }}
                      transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                      className="bg-current h-1 rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};