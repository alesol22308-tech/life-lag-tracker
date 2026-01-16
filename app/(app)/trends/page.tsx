'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { DashboardData, DimensionName } from '@/types';
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
            <div className="h-12 bg-white/10 rounded-lg w-40 animate-pulse" />
            <div className="h-6 bg-white/10 rounded-lg w-56 animate-pulse" />
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

            {/* Micro-Goal Completion History */}
            {dashboardData.checkinHistory.some(c => c.microGoalCompletionStatus) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.3 }}
                className="space-y-4"
              >
                <h2 className="text-2xl font-semibold text-text0">Micro-Goal Completion History</h2>
                <GlassCard>
                  <div className="space-y-3">
                    {dashboardData.checkinHistory
                      .filter(c => c.microGoalCompletionStatus)
                      .slice(0, 12)
                      .map((checkin) => {
                        const completion = checkin.microGoalCompletionStatus;
                        const status = completion ? Object.values(completion)[0] : null;
                        const date = new Date(checkin.createdAt);
                        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        
                        return (
                          <div key={checkin.id} className="flex items-center justify-between py-2 border-b border-cardBorder last:border-0">
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-text2">{dateStr}</span>
                              {status === 'completed' && (
                                <span className="text-xs px-2 py-1 bg-emerald-400/20 text-emerald-300 rounded flex items-center gap-1">
                                  <span>✓</span>
                                  <span>Completed</span>
                                </span>
                              )}
                              {status === 'in_progress' && (
                                <span className="text-xs px-2 py-1 bg-amber-400/20 text-amber-300 rounded">
                                  In Progress
                                </span>
                              )}
                              {status === 'skipped' && (
                                <span className="text-xs px-2 py-1 bg-text2/20 text-text2 rounded">
                                  Skipped
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-text2 capitalize">
                              {checkin.weakestDimension.replace('_', ' ')}
                            </span>
                          </div>
                        );
                      })}
                    {dashboardData.checkinHistory.filter(c => c.microGoalCompletionStatus).length === 0 && (
                      <p className="text-sm text-text2 text-center py-4">
                        No micro-goal completions yet. Set a micro-goal to start tracking!
                      </p>
                    )}
                  </div>
                </GlassCard>
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
