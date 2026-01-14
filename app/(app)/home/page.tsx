'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { DashboardData } from '@/types';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import CurrentWeekStatus from '@/components/CurrentWeekStatus';
import CheckinHistoryCard from '@/components/CheckinHistoryCard';
import MidWeekCheck from '@/components/MidWeekCheck';

// Lazy-load chart components (heavy Chart.js library)
const LagScoreChart = dynamic(() => import('@/components/LagScoreChart'), {
  ssr: false,
  loading: () => (
    <div className="card">
      <div className="text-center py-12 text-gray-500">
        <p>Loading chart...</p>
      </div>
    </div>
  ),
});

const DimensionTrendCharts = dynamic(() => import('@/components/DimensionTrendCharts'), {
  ssr: false,
});

export default function HomePage() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chartRange, setChartRange] = useState<4 | 12 | 24>(12);

  useEffect(() => {
    // Load chart range preference from localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedRange = localStorage.getItem('chartRange');
      if (savedRange && ['4', '12', '24'].includes(savedRange)) {
        setChartRange(parseInt(savedRange, 10) as 4 | 12 | 24);
      }
    }
  }, []);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        const response = await fetch('/api/home');
        if (!response.ok) {
          throw new Error('Failed to load dashboard');
        }

        const data: DashboardData = await response.json();
        setDashboardData(data);
      } catch (err: any) {
        console.error('Error loading dashboard:', err);
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  const handleChartRangeChange = (range: 4 | 12 | 24) => {
    setChartRange(range);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('chartRange', range.toString());
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-900">
        <div className="text-center space-y-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-slate-700 dark:bg-slate-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  if (!dashboardData) {
    return null;
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:py-12 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
          className="space-y-4"
        >
          <h1 className="text-4xl sm:text-5xl font-light text-gray-900 dark:text-gray-100">Life-Lag</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Weekly life drift detection and calibration
          </p>
        </motion.div>

        {/* Primary CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.1 }}
        >
          <Link
            href="/checkin"
            className="block w-full px-8 py-6 bg-slate-700 dark:bg-slate-600 text-white text-xl font-medium rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors duration-200 text-center shadow-soft-md"
          >
            Start Weekly Check-In
          </Link>
        </motion.div>

        {/* Current Week Status */}
        <CurrentWeekStatus checkin={dashboardData.latestCheckin} />

        {/* Mid-Week Check */}
        {dashboardData.latestCheckin && (
          <MidWeekCheck 
            hasCheckinThisWeek={(() => {
              // Check if latest check-in is within the last 7 days
              const latestDate = new Date(dashboardData.latestCheckin.createdAt);
              const now = new Date();
              const daysDiff = (now.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24);
              return daysDiff <= 7;
            })()}
          />
        )}

        {/* Chart */}
        {dashboardData.checkinHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-light text-gray-900 dark:text-gray-100">Trend Over Time</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Range:</span>
                <div className="flex gap-1 border border-gray-300 dark:border-gray-600 rounded-lg p-1">
                  {([4, 12, 24] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => handleChartRangeChange(range)}
                      className={`px-3 py-1 text-sm rounded transition-colors duration-200 ${
                        chartRange === range
                          ? 'bg-slate-700 dark:bg-slate-600 text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      {range}w
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <LagScoreChart checkins={dashboardData.checkinHistory} range={chartRange} />
          </motion.div>
        )}

        {/* Dimension Trends */}
        {dashboardData.dimensionTrends && dashboardData.dimensionTrends.length > 0 && (
          <DimensionTrendCharts trends={dashboardData.dimensionTrends} />
        )}

        {/* History Section */}
        {dashboardData.checkinHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.3 }}
            className="space-y-4"
          >
            <h2 className="text-2xl font-light text-gray-900 dark:text-gray-100">Weekly History</h2>
            <div className="space-y-3">
              {dashboardData.checkinHistory.map((checkin, index) => (
                <CheckinHistoryCard key={checkin.id} checkin={checkin} index={index} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {dashboardData.checkinHistory.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.3 }}
            className="card text-center py-12"
          >
            <p className="text-gray-600 dark:text-gray-400 mb-4">No check-ins yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Complete your first weekly check-in to start tracking your baseline
            </p>
          </motion.div>
        )}

        {/* Settings Link */}
        <div className="pt-8 text-center space-y-2">
          <Link
            href="/settings"
            className="block text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 underline"
          >
            Settings
          </Link>
          <Link
            href="/science"
            className="block text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 underline"
          >
            Science
          </Link>
        </div>
      </div>
    </main>
  );
}
