'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { DashboardData } from '@/types';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { shouldShowQuickPulse } from '@/lib/calculations';
import { isMiddleOfWeek, wasQuickPulseDismissedThisWeek } from '@/lib/quickPulse';
import AppShell from '@/components/AppShell';
import PrimaryButton from '@/components/PrimaryButton';
import GlassCard from '@/components/GlassCard';
import CurrentWeekStatus from '@/components/CurrentWeekStatus';
import QuickPulse from '@/components/QuickPulse';

export default function HomePage() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

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
          <h1 className="text-4xl sm:text-5xl font-semibold text-text0">Life-Lag</h1>
          <p className="text-lg text-text1">
            Weekly life drift detection and calibration
          </p>
        </motion.div>

        {/* Primary CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.1 }}
        >
          <Link href="/checkin" className="block w-full">
            <PrimaryButton className="w-full text-xl py-6">
              Start Weekly Check-In
            </PrimaryButton>
          </Link>
        </motion.div>

        {/* Current Week Status */}
        <CurrentWeekStatus checkin={dashboardData.latestCheckin} />

        {/* Quick Pulse - Only show when intervention is needed */}
        {dashboardData.latestCheckin && 
         dashboardData.checkinHistory.length >= 1 &&
         shouldShowQuickPulse(dashboardData.checkinHistory) &&
         isMiddleOfWeek(new Date(dashboardData.latestCheckin.createdAt)) &&
         !wasQuickPulseDismissedThisWeek() && (
          <QuickPulse 
            weakestDimension={dashboardData.latestCheckin.weakestDimension as any}
            currentScore={dashboardData.latestCheckin.lagScore}
          />
        )}

        {/* Quick Links to Trends and History */}
        {dashboardData.checkinHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <Link href="/trends">
              <GlassCard className="text-center py-8 hover:border-white/20 transition-colors cursor-pointer">
                <h3 className="text-xl font-semibold text-text0 mb-2">View Trends</h3>
                <p className="text-sm text-text2">Track your progress over time</p>
              </GlassCard>
            </Link>
            <Link href="/history">
              <GlassCard className="text-center py-8 hover:border-white/20 transition-colors cursor-pointer">
                <h3 className="text-xl font-semibold text-text0 mb-2">View History</h3>
                <p className="text-sm text-text2">Review your past check-ins</p>
              </GlassCard>
            </Link>
          </motion.div>
        )}

        {/* Empty State */}
        {dashboardData.checkinHistory.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.2 }}
          >
            <GlassCard className="text-center py-12">
              <p className="text-text1 mb-4">No check-ins yet</p>
              <p className="text-sm text-text2">
                Complete your first weekly check-in to start tracking your baseline
              </p>
            </GlassCard>
          </motion.div>
        )}

      </div>
    </AppShell>
  );
}
