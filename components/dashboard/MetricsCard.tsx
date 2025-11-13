import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUpIcon } from '../icons/IconDefs';
import { ExternalLink } from 'lucide-react';

const TrendingDownIcon = TrendingUpIcon; // Placeholder

interface MetricsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    period: string;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
  onClick?: () => void;
  isDrillable?: boolean;
}

export const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  change,
  icon,
  trend = 'neutral',
  color = 'primary',
  className = '',
  onClick,
  isDrillable = false,
}) => {
  const colorClasses = {
    primary: 'border-brand-primary/20 bg-brand-primary/5',
    success: 'border-green-500/20 bg-green-500/5',
    warning: 'border-yellow-500/20 bg-yellow-500/5',
    danger: 'border-red-500/20 bg-red-500/5',
  };

  const valueColorClasses = {
    primary: 'text-brand-primary',
    success: 'text-green-400',
    warning: 'text-yellow-400',
    danger: 'text-red-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={isDrillable ? onClick : undefined}
      className={`relative overflow-hidden rounded-xl border p-6 ${colorClasses[color]} ${className} ${
        isDrillable ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200' : ''
      }`}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-current to-transparent" />
      </div>

      <div className="relative">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-brand-text-secondary">{title}</p>
              {isDrillable && (
                <ExternalLink className="w-3 h-3 text-brand-text-secondary opacity-50 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
            <div className={`mt-2 text-3xl font-bold ${valueColorClasses[color]}`}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
          </div>

          {icon && (
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${colorClasses[color].replace('border-', 'bg-').replace('/20', '/10')}`}>
              {icon}
            </div>
          )}
        </div>

        {change && (
          <div className="mt-4 flex items-center space-x-2">
            <div className={`flex items-center space-x-1 text-sm ${
              change.isPositive ? 'text-green-400' : 'text-red-400'
            }`}>
              {change.isPositive ? (
                <TrendingUpIcon className="h-4 w-4" />
              ) : (
                <TrendingDownIcon className="h-4 w-4" />
              )}
              <span className="font-medium">
                {change.isPositive ? '+' : ''}{change.value}%
              </span>
            </div>
            <span className="text-xs text-brand-text-secondary">
              vs {change.period}
            </span>
          </div>
        )}
      </div>

      {isDrillable && (
        <div className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity">
          <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse" />
        </div>
      )}
    </motion.div>
  );
};