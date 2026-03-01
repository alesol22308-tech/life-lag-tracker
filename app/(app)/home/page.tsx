'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { DashboardData, MicroGoalStatus } from '@/types';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { shouldShowQuickPulse } from '@/lib/calculations';
import { isMiddleOfWeek, wasQuickPulseDismissedThisWeek } from '@/lib/quickPulse';
import { getTrendReinforcement } from '@/lib/trendReinforcement';
import AppShell from '@/components/AppShell';
import PrimaryButton from '@/components/PrimaryButton';
import GlassCard from '@/components/GlassCard';
import CurrentWeekStatus from '@/components/CurrentWeekStatus';
import QuickPulse from '@/components/QuickPulse';
import MicroGoalCard from '@/components/MicroGoalCard';
import MicroGoalStatusCard from '@/components/MicroGoalStatusCard';
import SkeletonCard from '@/components/SkeletonCard';

export default function HomePage() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const t = useTranslations('home');
  const tCommon = useTranslations('common');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [microGoalStatus, setMicroGoalStatus] = useState<MicroGoalStatus | null>(null);
  const [microGoalFeedbackSubmitted, setMicroGoalFeedbackSubmitted] = useState<Set<string>>(new Set());

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

        // Read localStorage for micro-goal quick feedback (Tried it / Not yet)
        if (typeof window !== 'undefined' && window.localStorage && data.latestCheckin?.id) {
          const key = `microGoalQuickFeedback_${data.latestCheckin.id}`;
          if (window.localStorage.getItem(key)) {
            setMicroGoalFeedbackSubmitted((prev) => new Set(prev).add(data.latestCheckin!.id));
          }
        }

        // Fetch micro-goal status if latest check-in has a micro-goal
        if (data.latestCheckin?.microGoalText && data.latestCheckin.id) {
          try {
            const statusResponse = await fetch(`/api/micro-goal-status?checkinId=${data.latestCheckin.id}`);
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              setMicroGoalStatus(statusData.status || 'not_started');
            }
          } catch (err) {
            console.error('Error fetching micro-goal status:', err);
            // Default to not_started if fetch fails
            setMicroGoalStatus('not_started');
          }
        }
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
        <div className="space-y-8">
          {/* Header skeleton */}
          <div className="space-y-3">
            <div className="h-12 bg-black/10 dark:bg-white/10 rounded-lg w-48 animate-pulse" />
            <div className="h-6 bg-black/10 dark:bg-white/10 rounded-lg w-64 animate-pulse" />
          </div>

          {/* Button skeleton */}
          <div className="h-14 bg-black/10 dark:bg-white/10 rounded-lg w-full animate-pulse" />

          {/* Card skeletons */}
          <SkeletonCard height="200px" lines={4} />
          <SkeletonCard height="150px" lines={3} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SkeletonCard height="120px" lines={2} />
            <SkeletonCard height="120px" lines={2} />
          </div>
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
              {tCommon('retry')}
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
          className="space-y-4 pb-6 border-b border-cardBorder/50"
        >
          <h1 className="text-4xl sm:text-5xl font-semibold text-text0">{tCommon('appName')}</h1>
          <p className="text-lg text-text1">
            {t('tagline')}
          </p>
        </motion.div>

        {/* Primary CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.1 }}
        >
          <Link href="/checkin" className="block w-full">
            <PrimaryButton className="w-full text-xl py-6 shadow-glowSm">
              {t('startCheckin')}
            </PrimaryButton>
          </Link>
        </motion.div>

        {/* Micro-goal visibility card (localStorage only): Tried it / Not yet */}
        {dashboardData.latestCheckin?.microGoalText &&
          dashboardData.latestCheckin.id &&
          !microGoalFeedbackSubmitted.has(dashboardData.latestCheckin.id) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.15 }}
          >
            <GlassCard className="space-y-4">
              <p className="text-xs font-medium text-text2 uppercase tracking-wide">
                {t('thisWeeksFocus')}
              </p>
              <p className="text-lg text-text0">
                {dashboardData.latestCheckin.microGoalText}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const id = dashboardData.latestCheckin!.id;
                    if (typeof window !== 'undefined' && window.localStorage) {
                      window.localStorage.setItem(`microGoalQuickFeedback_${id}`, 'tried');
                    }
                    setMicroGoalFeedbackSubmitted((prev) => new Set(prev).add(id));
                  }}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-cardBorder bg-black/5 dark:bg-white/5 text-text0 hover:border-black/20 dark:hover:border-white/20 transition-colors"
                >
                  {t('microGoalTriedIt')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const id = dashboardData.latestCheckin!.id;
                    if (typeof window !== 'undefined' && window.localStorage) {
                      window.localStorage.setItem(`microGoalQuickFeedback_${id}`, 'not_yet');
                    }
                    setMicroGoalFeedbackSubmitted((prev) => new Set(prev).add(id));
                  }}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-cardBorder bg-transparent text-text1 hover:border-black/20 dark:hover:border-white/20 transition-colors"
                >
                  {t('microGoalNotYet')}
                </button>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Current Week Status, Micro-Goal, Quick Pulse - with breathing room */}
        <div className="space-y-6">
          <CurrentWeekStatus
            checkin={dashboardData.latestCheckin}
            trendLine={
              dashboardData.checkinHistory.length >= 3
                ? (() => {
                    const trend = getTrendReinforcement(dashboardData.checkinHistory);
                    if (!trend) return null;
                    if (trend.type === 'weeks') return t('trendShownUpWeeks', { count: trend.count });
                    if (trend.type === 'improved') return t('trendImproved');
                    if (trend.type === 'stable') return t('trendStable');
                    return null;
                  })()
                : null
            }
          />
          {/* Show MicroGoalStatusCard if there's a micro-goal from latest check-in */}
          {dashboardData.latestCheckin?.microGoalText && 
           dashboardData.latestCheckin.id && (
            <MicroGoalStatusCard
              checkinId={dashboardData.latestCheckin.id}
              focusDimension={dashboardData.latestCheckin.weakestDimension as any}
              microGoalText={dashboardData.latestCheckin.microGoalText}
              initialStatus={microGoalStatus || 'not_started'}
            />
          )}
          {/* Show MicroGoalCard only if there's no status card (no micro-goal from latest check-in) */}
          {!dashboardData.latestCheckin?.microGoalText && 
           dashboardData.latestCheckin?.weakestDimension && (
            <MicroGoalCard 
              weakestDimension={dashboardData.latestCheckin.weakestDimension as any}
            />
          )}
          {dashboardData.latestCheckin && 
           dashboardData.checkinHistory.length >= 1 &&
           shouldShowQuickPulse(dashboardData.checkinHistory) &&
           isMiddleOfWeek(dashboardData.latestCheckin.createdAt) &&
           !wasQuickPulseDismissedThisWeek() && (
            <QuickPulse 
              weakestDimension={dashboardData.latestCheckin.weakestDimension as any}
              currentScore={dashboardData.latestCheckin.lagScore}
            />
          )}
        </div>

        {/* Quick Links to Trends and History */}
        {dashboardData.checkinHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <Link href="/trends">
              <GlassCard className="text-center py-8 hover:border-black/20 dark:hover:border-white/20 transition-colors cursor-pointer border-l-4 border-l-cardBorder">
                <div className="mb-2 flex justify-center" aria-hidden="true">
                  <svg className="w-8 h-8 text-text2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-text0 mb-2">{t('viewTrends')}</h3>
                <p className="text-sm text-text2">{t('trendsDescription')}</p>
              </GlassCard>
            </Link>
            <Link href="/history">
              <GlassCard className="text-center py-8 hover:border-black/20 dark:hover:border-white/20 transition-colors cursor-pointer">
                <div className="mb-2 flex justify-center" aria-hidden="true">
                  <svg className="w-8 h-8 text-text2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-text0 mb-2">{t('viewHistory')}</h3>
                <p className="text-sm text-text2">{t('historyDescription')}</p>
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
            <GlassCard className="text-center py-12 px-6">
              <div className="mb-4 flex justify-center" aria-hidden="true">
                <svg className="w-12 h-12 text-text2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-text0 mb-3">
                {t('emptyStateHeadline')}
              </h2>
              <p className="text-text1 mb-6 max-w-md mx-auto">
                {t('emptyStateBody')}
              </p>
              <Link href="/checkin">
                <PrimaryButton className="text-lg py-4 px-8 shadow-glowSm">
                  {t('emptyStateCta')}
                </PrimaryButton>
              </Link>
              <p className="text-sm text-text2 mt-6">
                {t('emptyStateReassurance')}
              </p>
            </GlassCard>
          </motion.div>
        )}

      </div>
    </AppShell>
  );
}
