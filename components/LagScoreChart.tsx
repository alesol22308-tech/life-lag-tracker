'use client';

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
import { CheckinSummary } from '@/types';
import GlassCard from '@/components/GlassCard';
import WhyThisWorksLink from '@/components/WhyThisWorksLink';

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

interface LagScoreChartProps {
  checkins: CheckinSummary[];
  range?: 4 | 12 | 24; // Weeks
}

export default function LagScoreChart({ checkins, range = 12 }: LagScoreChartProps) {
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

  const labels = recentCheckins.map((checkin) => {
    const date = new Date(checkin.createdAt);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const scores = recentCheckins.map((checkin) => checkin.lagScore);

  const data = {
    labels,
    datasets: [
      {
        label: 'Lag Score',
        data: scores,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgba(255, 255, 255, 0.6)',
        pointBorderColor: '#050505',
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
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
          color: 'rgba(255, 255, 255, 0.4)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
      },
      x: {
        ticks: {
          font: {
            size: 12,
          },
          color: 'rgba(255, 255, 255, 0.4)',
        },
        grid: {
          display: false,
        },
      },
    },
  };

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
      <div style={{ height: '300px' }}>
        <Line data={data} options={options} />
      </div>
    </GlassCard>
  );
}
