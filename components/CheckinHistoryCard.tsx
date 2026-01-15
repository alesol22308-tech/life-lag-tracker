'use client';

import { motion } from 'framer-motion';
import { CheckinSummary, DriftCategory } from '@/types';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import GlassCard from '@/components/GlassCard';

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

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

interface CheckinHistoryCardProps {
  checkin: CheckinSummary;
  index: number;
}

export default function CheckinHistoryCard({ checkin, index }: CheckinHistoryCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const scoreDelta = checkin.scoreDelta;
  const hasDelta = scoreDelta !== undefined && scoreDelta !== null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : index * 0.05 }}
    >
      <GlassCard hover>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <div className="text-2xl font-light text-text0">
                {checkin.lagScore}
              </div>
              <div className="px-3 py-1 bg-white/5 rounded-md border border-cardBorder">
                <span className="text-sm text-text0">
                  {CATEGORY_LABELS[checkin.driftCategory]}
                </span>
              </div>
              {hasDelta && (
                <div className={`text-sm font-medium ${
                  scoreDelta! < 0 ? 'text-emerald-400' : scoreDelta! > 0 ? 'text-amber-400' : 'text-text2'
                }`}>
                  {scoreDelta! > 0 ? '+' : ''}{scoreDelta}
                </div>
              )}
            </div>
            
            <div>
              <p className="text-sm text-text2">Focus</p>
              <p className="text-base text-text0">
                {DIMENSION_LABELS[checkin.weakestDimension] || checkin.weakestDimension}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm text-text2">
              {formatDate(checkin.createdAt)}
            </p>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
