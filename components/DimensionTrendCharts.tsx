'use client';

import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { motion } from 'framer-motion';
import { DimensionTrendData, DimensionName } from '@/types';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
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
      className="card"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Dimension Trends</h3>
        <button
          onClick={toggleExpanded}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Hide dimension trend charts' : 'Show dimension trend charts'}
          className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
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
                    borderColor: 'rgb(100, 116, 139)', // slate-500
                    backgroundColor: 'rgba(100, 116, 139, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    pointBackgroundColor: 'rgb(100, 116, 139)',
                    pointBorderColor: '#fff',
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
                      color: '#64748b',
                    },
                    grid: {
                      color: 'rgba(0, 0, 0, 0.05)',
                    },
                  },
                  x: {
                    ticks: {
                      font: {
                        size: 10,
                      },
                      color: '#64748b',
                      maxRotation: 45,
                      minRotation: 45,
                    },
                    grid: {
                      display: false,
                    },
                  },
                },
              };

              return (
                <div key={trend.dimension} className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {DIMENSION_LABELS[trend.dimension]}
                  </h4>
                  <div style={{ height: '150px' }}>
                    <Line data={data} options={options} />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
