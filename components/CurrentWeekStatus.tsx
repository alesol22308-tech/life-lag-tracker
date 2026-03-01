'use client';

import { motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { CheckinSummary, DimensionName } from '@/types';
import Link from 'next/link';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import GlassCard from '@/components/GlassCard';
import PrimaryButton from '@/components/PrimaryButton';
import { getTip } from '@/lib/tips';
import { getDimensionName, getDriftCategoryName } from '@/lib/i18n';

interface CurrentWeekStatusProps {
  checkin: CheckinSummary | null;
}

export default function CurrentWeekStatus({ checkin }: CurrentWeekStatusProps) {
  const locale = useLocale();
  const prefersReducedMotion = useReducedMotion();
  const tHome = useTranslations('home');
  const tTime = useTranslations('time');

  function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return tTime('today');
    if (diffDays === 1) return tTime('yesterday');
    if (diffDays < 7) return tTime('daysAgo', { count: diffDays });
    if (diffDays < 14) return tTime('weekAgo');
    const weeks = Math.floor(diffDays / 7);
    return tTime('weeksAgo', { count: weeks });
  }

  if (!checkin) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
      >
        <GlassCard className="text-center space-y-4 py-8">
          <p className="text-lg text-text1">{tHome('noCheckinThisWeek')}</p>
          <Link href="/checkin">
            <PrimaryButton>
              {tHome('startCheckin')}
            </PrimaryButton>
          </Link>
        </GlassCard>
      </motion.div>
    );
  }

  // Get the tip of the week based on weakest dimension and drift category
  const weeklyTip = getTip(
    checkin.weakestDimension as DimensionName,
    checkin.driftCategory
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
    >
      <GlassCard>
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-medium text-text2 uppercase tracking-wide mb-2">
              This Week&apos;s Focus
            </h2>
            <p className="text-xl text-text0">
              {getDimensionName(checkin.weakestDimension, locale) || checkin.weakestDimension}
            </p>
          </div>

          <div className="flex items-baseline gap-4">
            <div>
              <div className="text-5xl font-light text-text0">
                {checkin.lagScore}
              </div>
              <div className="text-sm text-text2 mt-1">Lag Score</div>
            </div>
            <div className="flex-1">
              <div className="inline-block px-4 py-2 bg-black/5 dark:bg-white/5 rounded-lg border border-cardBorder">
                <span className="text-base text-text0">
                  {getDriftCategoryName(checkin.driftCategory, locale)}
                </span>
              </div>
            </div>
          </div>

          {/* Tip of the Week */}
          <div className="space-y-3 p-4 bg-black/5 dark:bg-white/5 rounded-lg border border-cardBorder">
            <div>
              <h3 className="text-xs font-medium text-text2 uppercase tracking-wide mb-1">
                💡 Tip of the Week
              </h3>
              <p className="text-sm font-medium text-text0">
                {weeklyTip.focus}
              </p>
            </div>
            <div className="space-y-2 text-sm text-text1">
              <p>
                <span className="font-medium text-text0">Constraint:</span> {weeklyTip.constraint}
              </p>
              <p>
                <span className="font-medium text-text0">Your choice:</span> {weeklyTip.choice}
              </p>
            </div>
          </div>

          {/* Narrative/Continuity Message */}
          {checkin.narrativeSummary && (
            <div className="pt-2">
              <p className="text-sm text-text1 italic">
                {checkin.narrativeSummary}
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-cardBorder">
            <p className="text-sm text-text2">
              Last check-in: {formatTimeAgo(checkin.createdAt)}
            </p>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
