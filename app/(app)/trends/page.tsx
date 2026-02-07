'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { DashboardData, DimensionTrendData } from '@/types';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import AppShell from '@/components/AppShell';
import PrimaryButton from '@/components/PrimaryButton';
import GlassCard from '@/components/GlassCard';
import SkeletonChart from '@/components/SkeletonChart';

// Lazy-load chart components (heavy Chart.js library)
const LagScoreChart = dynamic(() => import('@/components/LagScoreChart'), {
  ssr: false,
  loading: () => <SkeletonChart height="400px" />,
});

const DimensionTrendCharts = dynamic(() => import('@/components/DimensionTrendCharts'), {
  ssr: false,
});

export default function TrendsPage() {
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
      <AppShell>
        <div className="space-y-8">
          {/* Header skeleton */}
          <div className="space-y-3">
            <div className="h-12 bg-black/10 dark:bg-white/10 rounded-lg w-40 animate-pulse" />
            <div className="h-6 bg-black/10 dark:bg-white/10 rounded-lg w-56 animate-pulse" />
          </div>

          {/* Chart skeleton */}
          <SkeletonChart height="400px" />
          <SkeletonChart height="300px" />
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <p className="text-red-400">{error}</p>
            <PrimaryButton onClick={() => window.location.reload()}>
              Retry
            </PrimaryButton>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!dashboardData) {
    return null;
  }

  // Slice dimension trends to match chart range so both charts use the same time window
  const dimensionTrendsInRange: DimensionTrendData[] =
    dashboardData.dimensionTrends?.map((trend) => ({
      dimension: trend.dimension,
      values: trend.values.slice(-chartRange),
    })) ?? [];

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
          className="space-y-4 pb-6 border-b border-cardBorder/50"
        >
          <h1 className="text-4xl sm:text-5xl font-semibold text-text0">Trends</h1>
          <p className="text-lg text-text1">
            Track your progress over time
          </p>
        </motion.div>

        {/* Chart */}
        {dashboardData.checkinHistory.length > 0 ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.1 }}
            >
              <GlassCard className="overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-cardBorder mb-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-semibold text-text0">Lag Score Over Time</h2>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm text-text2">Range:</span>
                    <div className="flex gap-1 border border-cardBorder rounded-20 p-1 bg-black/5 dark:bg-white/5">
                      {([4, 12, 24] as const).map((range) => (
                        <button
                          key={range}
                          onClick={() => handleChartRangeChange(range)}
                          className={`px-3 py-1 text-sm rounded-lg transition-colors duration-200 ${
                            chartRange === range
                              ? 'bg-black/10 dark:bg-white/10 text-text0 border border-cardBorder'
                              : 'text-text2 hover:text-text1 hover:bg-black/5 dark:hover:bg-white/5'
                          }`}
                        >
                          {range}w
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <LagScoreChart checkins={dashboardData.checkinHistory} range={chartRange} wrapInCard={false} />
              </GlassCard>
            </motion.div>

            {/* Dimension Trends */}
            {dashboardData.dimensionTrends && dashboardData.dimensionTrends.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.2 }}
              >
                <DimensionTrendCharts trends={dimensionTrendsInRange} />
              </motion.div>
            )}
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.1 }}
          >
            <GlassCard className="text-center py-12">
              <div className="mb-4 flex justify-center" aria-hidden="true">
                <svg className="w-12 h-12 text-text2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-text1 mb-2">No check-ins yet</p>
              <p className="text-sm text-text2 mb-6">
                Start tracking your baseline in under 2 minutes
              </p>
              <Link href="/checkin">
                <PrimaryButton className="text-lg py-4 px-8 shadow-glowSm">
                  Start Weekly Check-In
                </PrimaryButton>
              </Link>
            </GlassCard>
          </motion.div>
        )}
      </div>
    </AppShell>
  );
}
