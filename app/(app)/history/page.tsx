'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { DashboardData, CheckinSummary } from '@/types';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { getDimensionName } from '@/lib/i18n';
import AppShell from '@/components/AppShell';
import PrimaryButton from '@/components/PrimaryButton';
import GlassCard from '@/components/GlassCard';
import CheckinHistoryCard from '@/components/CheckinHistoryCard';
import SkeletonCard from '@/components/SkeletonCard';

export type MicroGoalListItem = {
  id: string;
  goal_text: string;
  dimension: string;
  created_at: string;
  completed_at: string | null;
  is_active: boolean;
};

export default function HistoryPage() {
  const router = useRouter();
  const locale = useLocale();
  const prefersReducedMotion = useReducedMotion();
  const t = useTranslations('history');
  const tMicro = useTranslations('microGoals');
  const tHome = useTranslations('home');
  const tCommon = useTranslations('common');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [microGoalsList, setMicroGoalsList] = useState<MicroGoalListItem[]>([]);
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

        const [homeResponse, goalsResponse] = await Promise.all([
          fetch('/api/home'),
          fetch('/api/micro-goals?list=recent'),
        ]);

        if (!homeResponse.ok) {
          throw new Error('Failed to load dashboard');
        }

        const data: DashboardData = await homeResponse.json();
        setDashboardData(data);

        if (goalsResponse.ok) {
          const goalsData = await goalsResponse.json();
          setMicroGoalsList(goalsData.goals ?? []);
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
            <div className="h-12 bg-black/10 dark:bg-white/10 rounded-lg w-56 animate-pulse" />
            <div className="h-6 bg-black/10 dark:bg-white/10 rounded-lg w-48 animate-pulse" />
          </div>

          {/* History card skeletons */}
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCard key={i} height="120px" lines={3} />
            ))}
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

  type PeriodKey = 'thisMonth' | 'lastMonth' | 'older';
  const bucketByMonth = (history: CheckinSummary[]): Record<PeriodKey, CheckinSummary[]> => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    const buckets: Record<PeriodKey, CheckinSummary[]> = {
      thisMonth: [],
      lastMonth: [],
      older: [],
    };
    for (const checkin of history) {
      const d = new Date(checkin.createdAt);
      const m = d.getMonth();
      const y = d.getFullYear();
      if (y === thisYear && m === thisMonth) buckets.thisMonth.push(checkin);
      else if (y === lastMonthYear && m === lastMonth) buckets.lastMonth.push(checkin);
      else buckets.older.push(checkin);
    }
    return buckets;
  };

  const buckets = bucketByMonth(dashboardData.checkinHistory);
  const sectionConfig: { key: PeriodKey; title: string }[] = [
    { key: 'thisMonth', title: t('thisMonth') },
    { key: 'lastMonth', title: t('lastMonth') },
    { key: 'older', title: t('older') },
  ];

  type GoalPeriodKey = 'thisMonth' | 'lastMonth' | 'older';
  const bucketGoalsByMonth = (goals: MicroGoalListItem[]): Record<GoalPeriodKey, MicroGoalListItem[]> => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
    const result: Record<GoalPeriodKey, MicroGoalListItem[]> = {
      thisMonth: [],
      lastMonth: [],
      older: [],
    };
    for (const goal of goals) {
      const d = new Date(goal.created_at);
      const m = d.getMonth();
      const y = d.getFullYear();
      if (y === thisYear && m === thisMonth) result.thisMonth.push(goal);
      else if (y === lastMonthYear && m === lastMonth) result.lastMonth.push(goal);
      else result.older.push(goal);
    }
    return result;
  };
  const goalBuckets = bucketGoalsByMonth(microGoalsList);

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
          <h1 className="text-4xl sm:text-5xl font-semibold text-text0">{t('title')}</h1>
          <p className="text-lg text-text1">
            {t('subtitle')}
          </p>
          <p className="text-sm text-text2">
            {t('cardsNote')}
          </p>
        </motion.div>

        {/* History Section - grouped by period */}
        {dashboardData.checkinHistory.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.1 }}
            className="space-y-8"
          >
            {sectionConfig.map(({ key, title }) => {
              const items = buckets[key];
              if (items.length === 0) return null;
              let globalIndex = 0;
              for (const s of sectionConfig) {
                if (s.key === key) break;
                globalIndex += buckets[s.key].length;
              }
              return (
                <div key={key} className="space-y-4">
                  <h2 className="text-base sm:text-lg font-semibold text-text0 pb-2 mb-4 border-b border-cardBorder">{title}</h2>
                  <div className="space-y-4">
                    {items.map((checkin, i) => (
                      <CheckinHistoryCard
                        key={checkin.id}
                        checkin={checkin}
                        index={globalIndex + i}
                        isLatest={globalIndex + i === 0}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </motion.div>
        ) : null}

        {/* Your micro-goals section */}
        {microGoalsList.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.15 }}
            className="space-y-8"
          >
            <h2 className="text-base sm:text-lg font-semibold text-text0 pb-2 border-b border-cardBorder">
              {t('yourMicroGoals')}
            </h2>
            {(['thisMonth', 'lastMonth', 'older'] as const).map((key) => {
              const items = goalBuckets[key];
              if (items.length === 0) return null;
              return (
                <div key={key} className="space-y-4">
                  <h3 className="text-sm font-medium text-text2">{sectionConfig.find((s) => s.key === key)?.title}</h3>
                  <div className="space-y-3">
                    {items.map((goal) => (
                      <GlassCard key={goal.id} className="p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="text-sm text-text1 flex-1 min-w-0">&quot;{goal.goal_text}&quot;</p>
                          <span className="text-xs px-2 py-1 bg-black/10 dark:bg-white/10 rounded text-text2 shrink-0">
                            {getDimensionName(goal.dimension as any, locale)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-text2">
                          <span>
                            {new Date(goal.created_at).toLocaleDateString(locale, { month: 'short', day: 'numeric' })}
                          </span>
                          {goal.completed_at ? (
                            <span className="text-emerald-400">{tMicro('completed')}</span>
                          ) : goal.is_active ? (
                            <span className="text-amber-400">{tMicro('inProgress')}</span>
                          ) : (
                            <span>{tMicro('skip')}</span>
                          )}
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {dashboardData.checkinHistory.length === 0 && !(microGoalsList.length > 0) ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.1 }}
          >
            <GlassCard className="text-center py-12">
              <div className="mb-4 flex justify-center" aria-hidden="true">
                <svg className="w-12 h-12 text-text2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-text1 mb-2">{t('noHistory')}</p>
              <p className="text-sm text-text2 mb-6">
                {t('startFirst')}
              </p>
              <Link href="/checkin">
                <PrimaryButton className="text-lg py-4 px-8 shadow-glowSm">
                  {tHome('startCheckin')}
                </PrimaryButton>
              </Link>
            </GlassCard>
          </motion.div>
        ) : null}
      </div>
    </AppShell>
  );
}
