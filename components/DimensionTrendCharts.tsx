'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { useLocale } from 'next-intl';
import { DimensionTrendData } from '@/types';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { useTheme } from '@/lib/hooks/useTheme';
import GlassCard from '@/components/GlassCard';
import SkeletonChart from '@/components/SkeletonChart';
import { getDimensionName } from '@/lib/i18n';

// Dynamically import the dimension chart component with Chart.js registration
const DimensionChartInner = dynamic(
  () => import('./DimensionChartInner'),
  {
    ssr: false,
    loading: () => <SkeletonChart height="180px" />
  }
);

interface DimensionTrendChartsProps {
  trends: DimensionTrendData[];
}

export default function DimensionTrendCharts({ trends }: DimensionTrendChartsProps) {
  const locale = useLocale();
  const prefersReducedMotion = useReducedMotion();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [isExpanded, setIsExpanded] = useState(true);

  const chartColors = isDark
    ? {
        borderColor: 'rgba(255, 255, 255, 0.4)',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        pointBackgroundColor: 'rgba(255, 255, 255, 0.6)',
        pointBorderColor: '#050505',
        tickColor: 'rgba(255, 255, 255, 0.4)',
        gridColor: 'rgba(255, 255, 255, 0.05)',
        tooltipBg: 'rgba(0, 0, 0, 0.8)',
      }
    : {
        borderColor: 'rgba(0, 0, 0, 0.3)',
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        pointBackgroundColor: 'rgba(0, 0, 0, 0.5)',
        pointBorderColor: '#ffffff',
        tickColor: 'rgba(0, 0, 0, 0.5)',
        gridColor: 'rgba(0, 0, 0, 0.08)',
        tooltipBg: 'rgba(0, 0, 0, 0.85)',
      };

  useEffect(() => {
    // Load expansion state from localStorage (default is expanded)
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('dimensionChartsExpanded');
      if (saved === 'false') {
        setIsExpanded(false);
      }
    }
  }, []);

  if (!trends || trends.length === 0) {
    return null;
  }

  const toggleExpanded = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    // Store expansion state in localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('dimensionChartsExpanded', newExpanded.toString());
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
    >
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text0">Dimension Trends</h3>
          <button
            onClick={toggleExpanded}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Hide dimension trend charts' : 'Show dimension trend charts'}
            className="text-sm text-text2 hover:text-text1 transition-colors"
          >
            {isExpanded ? 'Hide' : 'Show'} charts
          </button>
        </div>

      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
          className="overflow-hidden"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trends.map((trend) => {
              const labels = trend.values.map((v) => {
                const date = new Date(v.date);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              });

              const data = {
                labels,
                datasets: [
                  {
                    label: getDimensionName(trend.dimension, locale),
                    data: trend.values.map((v) => v.value),
                    borderColor: chartColors.borderColor,
                    backgroundColor: chartColors.backgroundColor,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: chartColors.pointBackgroundColor,
                    pointBorderColor: chartColors.pointBorderColor,
                    pointBorderWidth: 1,
                  },
                ],
              };

              const options = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    backgroundColor: chartColors.tooltipBg,
                    padding: 8,
                    titleFont: {
                      size: 12,
                      weight: 'normal' as const,
                    },
                    bodyFont: {
                      size: 14,
                      weight: 'normal' as const,
                    },
                    callbacks: {
                      label: (context: any) => `${context.parsed.y}`,
                    },
                  },
                },
                scales: {
                  y: {
                    beginAtZero: false,
                    min: 1,
                    max: 5,
                    ticks: {
                      stepSize: 1,
                      font: {
                        size: 10,
                      },
                      color: chartColors.tickColor,
                    },
                    grid: {
                      color: chartColors.gridColor,
                    },
                  },
                  x: {
                    ticks: {
                      font: {
                        size: 10,
                      },
                      color: chartColors.tickColor,
                      maxRotation: 45,
                      minRotation: 45,
                    },
                    grid: {
                      display: false,
                    },
                  },
                },
              };

              // Generate descriptive text for screen readers
              const dimensionValues = trend.values.map((v) => v.value);
              const dimensionLabels = trend.values.map((v) => {
                const date = new Date(v.date);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              });
              const chartDesc = `Line chart showing ${getDimensionName(trend.dimension, locale)} trends. Values range from ${Math.min(...dimensionValues)} to ${Math.max(...dimensionValues)} on a scale of 1 to 5.`;

              return (
                <div key={trend.dimension} className="space-y-2">
                  <h4 className="text-sm font-semibold text-text0">
                    {getDimensionName(trend.dimension, locale)}
                  </h4>
                  <div 
                    role="img" 
                    aria-label={chartDesc}
                    aria-describedby={`dimension-chart-${trend.dimension}-description`}
                    style={{ height: '180px' }}
                  >
                    <p id={`dimension-chart-${trend.dimension}-description`} className="sr-only">
                      {chartDesc} Data points: {dimensionLabels.map((label, i) => `${label}: ${dimensionValues[i]}`).join(', ')}
                    </p>
                    <DimensionChartInner data={data} options={options} ariaLabel={chartDesc} />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
      </GlassCard>
    </motion.div>
  );
}
