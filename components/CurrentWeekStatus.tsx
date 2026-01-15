'use client';

import { motion } from 'framer-motion';
import { CheckinSummary, DriftCategory } from '@/types';
import Link from 'next/link';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import GlassCard from '@/components/GlassCard';
import PrimaryButton from '@/components/PrimaryButton';

const CATEGORY_LABELS: Record<DriftCategory, string> = {
  aligned: 'Aligned',
  mild: 'Mild Drift',
  moderate: 'Moderate Drift',
  heavy: 'Heavy Drift',
  critical: 'Critical Drift',
};

const DIMENSION_LABELS: Record<string, string> = {
  energy: 'Energy',
  sleep: 'Sleep consistency',
  structure: 'Daily structure',
  initiation: 'Task initiation',
  engagement: 'Engagement / follow-through',
  sustainability: 'Effort sustainability',
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 14) {
    return '1 week ago';
  } else {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  }
}

interface CurrentWeekStatusProps {
  checkin: CheckinSummary | null;
}

export default function CurrentWeekStatus({ checkin }: CurrentWeekStatusProps) {
  const prefersReducedMotion = useReducedMotion();
  
  if (!checkin) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
      >
        <GlassCard className="text-center space-y-4 py-8">
          <p className="text-lg text-text1">No check-in yet this week</p>
          <Link href="/checkin">
            <PrimaryButton>
              Start Weekly Check-In
            </PrimaryButton>
          </Link>
        </GlassCard>
      </motion.div>
    );
  }

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
              {DIMENSION_LABELS[checkin.weakestDimension] || checkin.weakestDimension}
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
              <div className="inline-block px-4 py-2 bg-white/5 rounded-lg border border-cardBorder">
                <span className="text-base text-text0">
                  {CATEGORY_LABELS[checkin.driftCategory]}
                </span>
              </div>
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
