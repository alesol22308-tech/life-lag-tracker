'use client';

import dynamic from 'next/dynamic';
import { CheckinSummary } from '@/types';
import GlassCard from '@/components/GlassCard';
import WhyThisWorksLink from '@/components/WhyThisWorksLink';
import SkeletonChart from '@/components/SkeletonChart';
import { useTheme } from '@/lib/hooks/useTheme';

// Dynamically import the Line chart component with Chart.js registration
const LineChart = dynamic(
  () => import('./LagScoreChartInner'),
  {
    ssr: false,
    loading: () => <SkeletonChart height="300px" />
  }
);

interface LagScoreChartProps {
  checkins: CheckinSummary[];
  range?: 4 | 12 | 24; // Weeks
}

export default function LagScoreChart({ checkins, range = 12 }: LagScoreChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  if (checkins.length === 0) {
    return (
      <GlassCard>
        <div className="text-center py-12 text-text2">
          <p>Complete your first check-in to see your trend</p>
        </div>
      </GlassCard>
    );
  }

  // Reverse to show chronological order (oldest to newest)
  const sortedCheckins = [...checkins].reverse();
  
  // Limit to selected range (number of check-ins, not weeks)
  // Since we're limited by data, show last N check-ins where N matches typical weeks
  // For 4 weeks: ~4 check-ins, 12 weeks: ~12 check-ins, 24 weeks: ~24 check-ins
  const recentCheckins = sortedCheckins.slice(-range);

  if (recentCheckins.length === 0) {
    return (
      <GlassCard>
        <div className="text-center py-12 text-text2">
          <p>No data for the selected range</p>
        </div>
      </GlassCard>
    );
  }

  const labels = recentCheckins.map((checkin) => {
    const date = new Date(checkin.createdAt);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const scores = recentCheckins.map((checkin) => checkin.lagScore);

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

  const data = {
    labels,
    datasets: [
      {
        label: 'Lag Score',
        data: scores,
        borderColor: chartColors.borderColor,
        backgroundColor: chartColors.backgroundColor,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: chartColors.pointBackgroundColor,
        pointBorderColor: chartColors.pointBorderColor,
        pointBorderWidth: 2,
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
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'normal' as const,
        },
        bodyFont: {
          size: 16,
          weight: 'normal' as const,
        },
        callbacks: {
          title: (items: any[]) => {
            if (items.length > 0 && items[0].dataIndex >= 0 && recentCheckins[items[0].dataIndex]) {
              const d = new Date(recentCheckins[items[0].dataIndex].createdAt);
              return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
            }
            return items.length > 0 ? labels[items[0].dataIndex] : '';
          },
          label: (context: any) => `Score: ${context.parsed.y}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
          font: {
            size: 12,
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
            size: 12,
          },
          color: chartColors.tickColor,
        },
        grid: {
          display: false,
        },
      },
    },
  };

  // Generate descriptive text for screen readers
  const chartDescription = recentCheckins.length > 0
    ? `Line chart showing Lag Score trends over ${recentCheckins.length} check-ins. Scores range from ${Math.min(...scores)} to ${Math.max(...scores)}, with an average of ${Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)}.`
    : 'No check-in data available to display.';

  return (
    <GlassCard>
      <div className="mb-4">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-lg font-semibold text-text0">Trend Over Time</h3>
          <WhyThisWorksLink href="/science#why-trends" className="shrink-0" />
        </div>
        <p className="text-sm text-text2 mt-1">
          Your Lag Score over the past {recentCheckins.length} check-in{recentCheckins.length !== 1 ? 's' : ''}
        </p>
      </div>
      <div 
        role="img" 
        aria-label={chartDescription}
        aria-describedby="lag-score-chart-description"
        style={{ height: '300px' }}
      >
        <p id="lag-score-chart-description" className="sr-only">
          {chartDescription} Data points: {labels.map((label, i) => `${label}: ${scores[i]}`).join(', ')}
        </p>
        <LineChart data={data} options={options} ariaLabel={chartDescription} />
      </div>
    </GlassCard>
  );
}
