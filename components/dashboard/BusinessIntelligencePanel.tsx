import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MarketIntelligence, BusinessMetrics } from '../../types/dashboard';
import { dashboardService } from '../../services/dashboardService';
import {
  TrendingUpIcon,
  BarChartIcon,
  TargetIcon,
  UsersIcon,
} from '../icons/IconDefs';

export const BusinessIntelligencePanel: React.FC = () => {
  const [intelligence, setIntelligence] = useState<MarketIntelligence | null>(null);
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [marketData, businessData] = await Promise.all([
          dashboardService.getMarketIntelligence('Fantasy'),
          dashboardService.getBusinessMetrics(),
        ]);

        setIntelligence(marketData);
        setMetrics(businessData);
      } catch (error) {
        console.error('Failed to fetch business intelligence:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (!intelligence || !metrics) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-brand-text-secondary">Unable to load business intelligence</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="flex items-center gap-2 mb-4">
        <BarChartIcon className="w-5 h-5 text-brand-primary" />
        <h3 className="text-lg font-semibold text-brand-text">Business Intelligence</h3>
      </div>

      <div className="space-y-4 max-h-[calc(100%-60px)] overflow-y-auto pr-2">
        {/* Market Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-brand-primary/10 to-brand-primary/5 border border-brand-primary/20 rounded-lg p-4"
        >
          <h4 className="font-semibold text-brand-text mb-3 flex items-center gap-2">
            <TrendingUpIcon className="w-4 h-4" />
            Market Overview - {intelligence.genre}
          </h4>
          
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <p className="text-xs text-brand-text-secondary">Market Size</p>
              <p className="text-xl font-bold text-brand-primary">
                ${(intelligence.marketSize / 1000000000).toFixed(1)}B
              </p>
            </div>
            <div>
              <p className="text-xs text-brand-text-secondary">Growth Rate</p>
              <p className="text-xl font-bold text-green-400">
                +{intelligence.growthRate}%
              </p>
            </div>
          </div>

          <div className="text-xs text-brand-text-secondary">
            Year-over-year growth in the {intelligence.genre} genre
          </div>
        </motion.div>

        {/* Trending Topics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-brand-surface/80 border border-brand-border/80 rounded-lg p-4"
        >
          <h4 className="font-semibold text-brand-text mb-3">🔥 Trending Topics</h4>
          <div className="flex flex-wrap gap-2">
            {intelligence.trendingTopics.map((topic, index) => (
              <motion.span
                key={topic}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                className="px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-xs font-medium"
              >
                {topic}
              </motion.span>
            ))}
          </div>
        </motion.div>

        {/* Competitor Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-brand-surface/80 border border-brand-border/80 rounded-lg p-4"
        >
          <h4 className="font-semibold text-brand-text mb-3 flex items-center gap-2">
            <UsersIcon className="w-4 h-4" />
            Competitor Analysis
          </h4>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-brand-text-secondary">Avg. Price Point</span>
              <span className="font-medium text-brand-text">
                ${intelligence.competitorAnalysis.averagePrice}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-brand-text-secondary">Avg. Word Count</span>
              <span className="font-medium text-brand-text">
                {intelligence.competitorAnalysis.averageLength.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-brand-border/60">
            <p className="text-xs text-brand-text-secondary mb-2">Top Performers:</p>
            <div className="flex flex-wrap gap-1">
              {intelligence.competitorAnalysis.topPerformers.map((author) => (
                <span
                  key={author}
                  className="px-2 py-1 bg-green-500/10 text-green-400 rounded text-xs"
                >
                  {author}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Business Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-brand-surface/80 border border-brand-border/80 rounded-lg p-4"
        >
          <h4 className="font-semibold text-brand-text mb-3 flex items-center gap-2">
            <TargetIcon className="w-4 h-4" />
            Key Metrics
          </h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-brand-text-secondary mb-1">Conversion Rate</p>
              <p className="text-lg font-bold text-brand-primary">
                {metrics.conversionRate.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-brand-text-secondary mb-1">Marketing ROI</p>
              <p className="text-lg font-bold text-green-400">
                {metrics.marketingROI.toFixed(1)}x
              </p>
            </div>
            <div>
              <p className="text-xs text-brand-text-secondary mb-1">CAC</p>
              <p className="text-lg font-bold text-yellow-400">
                ${metrics.customerAcquisitionCost}
              </p>
            </div>
            <div>
              <p className="text-xs text-brand-text-secondary mb-1">LTV</p>
              <p className="text-lg font-bold text-purple-400">
                ${metrics.lifetimeValue}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-lg p-4"
        >
          <h4 className="font-semibold text-brand-text mb-3">💡 Strategic Recommendations</h4>
          <ul className="space-y-2">
            {intelligence.recommendations.map((rec, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="text-sm text-brand-text-secondary flex items-start gap-2"
              >
                <span className="text-purple-400 mt-0.5">▸</span>
                <span>{rec}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
};