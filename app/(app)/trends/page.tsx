'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { DashboardData } from '@/types';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import AppShell from '@/components/AppShell';
import PrimaryButton from '@/components/PrimaryButton';
import GlassCard from '@/components/GlassCard';

// Lazy-load chart components (heavy Chart.js library)
const LagScoreChart = dynamic(() => import('@/components/LagScoreChart'), {
  ssr: false,
  loading: () => (
    <GlassCard>
      <div className="text-center py-12 text-text2">
        <p>Loading chart...</p>
      </div>
    </GlassCard>
  ),
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
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-text1">Loading...</div>
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

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
          className="space-y-3"
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
              className="space-y-4"
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-semibold text-text0">Lag Score Over Time</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text2">Range:</span>
                  <div className="flex gap-1 border border-cardBorder rounded-lg p-1 bg-white/5">
                    {([4, 12, 24] as const).map((range) => (
                      <button
                        key={range}
                        onClick={() => handleChartRangeChange(range)}
                        className={`px-3 py-1 text-sm rounded transition-colors duration-200 ${
                          chartRange === range
                            ? 'bg-white/10 text-text0 border border-cardBorder'
                            : 'text-text2 hover:text-text1 hover:bg-white/5'
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

            {/* Dimension Trends */}
            {dashboardData.dimensionTrends && dashboardData.dimensionTrends.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.2 }}
              >
                <DimensionTrendCharts trends={dashboardData.dimensionTrends} />
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
              <p className="text-text1 mb-4">No check-ins yet</p>
              <p className="text-sm text-text2">
                Complete your first weekly check-in to start tracking your trends
              </p>
            </GlassCard>
          </motion.div>
        )}
      </div>
    </AppShell>
  );
}
