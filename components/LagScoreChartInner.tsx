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

interface LineChartProps {
  data: any;
  options: any;
  ariaLabel: string;
}

export default function LagScoreChartInner({ data, options, ariaLabel }: LineChartProps) {
  return <Line data={data} options={options} aria-label={ariaLabel} />;
}
