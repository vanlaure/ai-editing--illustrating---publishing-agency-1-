import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ROICalculation } from '../../types/dashboard';
import { dashboardService } from '../../services/dashboardService';
import {
  TargetIcon,
  TrendingUpIcon,
  BrainCircuitIcon,
  SparklesIcon,
} from '../icons/IconDefs';

export const ROICalculator: React.FC = () => {
  const [roiData, setRoiData] = useState<ROICalculation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchROI = async () => {
      try {
        const now = new Date();
        const timeframe = {
          start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          end: now,
          label: 'Last 30 Days',
        };
        
        const data = await dashboardService.calculateROI(timeframe);
        setRoiData(data);
      } catch (error) {
        console.error('Failed to fetch ROI data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchROI();
  }, []);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (!roiData) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-brand-text-secondary">Unable to calculate ROI</p>
      </div>
    );
  }

  const breakdown = [
    { label: 'AI Assistance', value: roiData.breakdown.aiAssistance, color: 'bg-blue-500' },
    { label: 'Automation', value: roiData.breakdown.automation, color: 'bg-green-500' },
    { label: 'Collaboration', value: roiData.breakdown.collaboration, color: 'bg-purple-500' },
    { label: 'Other Tools', value: roiData.breakdown.otherTools, color: 'bg-yellow-500' },
  ];

  const maxValue = Math.max(...breakdown.map(b => b.value));

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-brand-text">ROI Calculator</h3>
        <div className="text-sm text-brand-text-secondary">{roiData.period}</div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-lg p-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <SparklesIcon className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-brand-text-secondary">Cost Saved</p>
              <p className="text-2xl font-bold text-green-400">
                ${roiData.costSaved.toLocaleString()}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-lg p-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <TargetIcon className="w-5 h-5 text-brand-primary" />
            </div>
            <div>
              <p className="text-sm text-brand-text-secondary">Time Saved</p>
              <p className="text-2xl font-bold text-brand-primary">
                {roiData.timeSaved}h
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-lg p-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <TrendingUpIcon className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-brand-text-secondary">Productivity Gain</p>
              <p className="text-2xl font-bold text-purple-400">
                +{roiData.productivityGain}%
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20 rounded-lg p-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <BrainCircuitIcon className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-brand-text-secondary">Quality Improvement</p>
              <p className="text-2xl font-bold text-yellow-400">
                +{roiData.qualityImprovement}%
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Time Saved Breakdown */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-brand-text mb-3">
          Time Savings Breakdown
        </h4>
        <div className="space-y-3">
          {breakdown.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-brand-text-secondary">{item.label}</span>
                <span className="text-brand-text font-medium">{item.value}h</span>
              </div>
              <div className="w-full bg-brand-border/40 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.value / maxValue) * 100}%` }}
                  transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                  className={`${item.color} h-2 rounded-full`}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ROI Summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-6 p-4 bg-gradient-to-r from-brand-primary/10 to-brand-primary/5 border border-brand-primary/20 rounded-lg"
      >
        <p className="text-sm text-brand-text-secondary mb-2">
          Total Value Generated
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-brand-primary">
            ${(roiData.costSaved + roiData.timeSaved * 50).toLocaleString()}
          </span>
          <span className="text-sm text-brand-text-secondary">
            in {roiData.period.toLowerCase()}
          </span>
        </div>
        <p className="text-xs text-brand-text-secondary mt-2">
          Based on estimated hourly rate of $50/hr and measured productivity improvements
        </p>
      </motion.div>
    </div>
  );
};