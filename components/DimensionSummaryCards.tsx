'use client';

import { motion } from 'framer-motion';
import { DimensionSummary, DimensionName } from '@/types';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';

interface DimensionSummaryCardsProps {
  summaries: DimensionSummary[];
}

const DIMENSION_LABELS: Record<DimensionName, string> = {
  energy: 'Energy',
  sleep: 'Sleep consistency',
  structure: 'Daily structure',
  initiation: 'Task initiation',
  engagement: 'Engagement / follow-through',
  sustainability: 'Effort sustainability',
};

export default function DimensionSummaryCards({ summaries }: DimensionSummaryCardsProps) {
  const prefersReducedMotion = useReducedMotion();

  if (summaries.length === 0) {
    return null;
  }

  const getTrendColor = (trend: 'improved' | 'declined' | 'stable') => {
    switch (trend) {
      case 'improved':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'declined':
        return 'text-red-600 dark:text-red-400';
      case 'stable':
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getTrendBgColor = (trend: 'improved' | 'declined' | 'stable') => {
    switch (trend) {
      case 'improved':
        return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
      case 'declined':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'stable':
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  const formatTrendValue = (value: number) => {
    if (value === 0) return '—';
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}`;
  };

  const getTrendIcon = (trend: 'improved' | 'declined' | 'stable') => {
    switch (trend) {
      case 'improved':
        return '↑';
      case 'declined':
        return '↓';
      case 'stable':
        return '→';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
      className="space-y-4"
    >
      <h2 className="text-2xl font-light text-gray-900 dark:text-gray-100">Dimension Trends</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {summaries.map((summary, index) => (
          <motion.div
            key={summary.dimension}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: prefersReducedMotion ? 0 : 0.3, 
              delay: prefersReducedMotion ? 0 : index * 0.05 
            }}
            className={`card border-2 ${getTrendBgColor(summary.trend)}`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">
                  {DIMENSION_LABELS[summary.dimension]}
                </h3>
                <span className={`text-lg ${getTrendColor(summary.trend)}`}>
                  {getTrendIcon(summary.trend)}
                </span>
              </div>
              
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-2xl font-light text-gray-900 dark:text-gray-100">
                    {summary.currentValue}/5
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Current value
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-lg font-medium ${getTrendColor(summary.trend)}`}>
                    {formatTrendValue(summary.trendValue)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {summary.trend === 'improved' && 'Improved'}
                    {summary.trend === 'declined' && 'Declined'}
                    {summary.trend === 'stable' && 'Stable'}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
