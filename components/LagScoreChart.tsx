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
}

export default function LagScoreChart({ checkins }: LagScoreChartProps) {
  if (checkins.length === 0) {
    return (
      <div className="card">
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>Complete your first check-in to see your trend</p>
        </div>
      </div>
    );
  }

  // Reverse to show chronological order (oldest to newest)
  const sortedCheckins = [...checkins].reverse();
  
  // Limit to last 12 weeks for readability
  const recentCheckins = sortedCheckins.slice(-12);

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
        borderColor: 'rgb(100, 116, 139)', // slate-500
        backgroundColor: 'rgba(100, 116, 139, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(100, 116, 139)',
        pointBorderColor: '#fff',
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
          color: '#64748b',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        ticks: {
          font: {
            size: 12,
          },
          color: '#64748b',
        },
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="card">
      <div className="mb-4">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Trend Over Time</h3>
          <WhyThisWorksLink href="/science#why-trends" className="shrink-0" />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Your Lag Score over the past {recentCheckins.length} check-in{recentCheckins.length !== 1 ? 's' : ''}
        </p>
      </div>
      <div style={{ height: '300px' }}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
