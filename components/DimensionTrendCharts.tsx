'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { DimensionTrendData, DimensionName } from '@/types';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import GlassCard from '@/components/GlassCard';
import SkeletonChart from '@/components/SkeletonChart';

// Dynamically import the dimension chart component with Chart.js registration
const DimensionChartInner = dynamic(
  () => import('./DimensionChartInner'),
  {
    ssr: false,
    loading: () => <SkeletonChart height="150px" />
  }
);

const DIMENSION_LABELS: Record<DimensionName, string> = {
  energy: 'Energy',
  sleep: 'Sleep consistency',
  structure: 'Daily structure',
  initiation: 'Task initiation',
  engagement: 'Engagement / follow-through',
  sustainability: 'Effort sustainability',
};

interface DimensionTrendChartsProps {
  trends: DimensionTrendData[];
}

export default function DimensionTrendCharts({ trends }: DimensionTrendChartsProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Load expansion state from localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('dimensionChartsExpanded');
      if (saved === 'true') {
        setIsExpanded(true);
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
                    label: DIMENSION_LABELS[trend.dimension],
                    data: trend.values.map((v) => v.value),
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    pointBackgroundColor: 'rgba(255, 255, 255, 0.6)',
                    pointBorderColor: '#050505',
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
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
                      color: 'rgba(255, 255, 255, 0.4)',
                    },
                    grid: {
                      color: 'rgba(255, 255, 255, 0.05)',
                    },
                  },
                  x: {
                    ticks: {
                      font: {
                        size: 10,
                      },
                      color: 'rgba(255, 255, 255, 0.4)',
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
              const chartDesc = `Line chart showing ${DIMENSION_LABELS[trend.dimension]} trends. Values range from ${Math.min(...dimensionValues)} to ${Math.max(...dimensionValues)} on a scale of 1 to 5.`;

              return (
                <div key={trend.dimension} className="space-y-2">
                  <h4 className="text-sm font-semibold text-text0">
                    {DIMENSION_LABELS[trend.dimension]}
                  </h4>
                  <div 
                    role="img" 
                    aria-label={chartDesc}
                    aria-describedby={`dimension-chart-${trend.dimension}-description`}
                    style={{ height: '150px' }}
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
