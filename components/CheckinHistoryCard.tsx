'use client';

import { motion } from 'framer-motion';
import { CheckinSummary, DriftCategory } from '@/types';

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
  const scoreDelta = checkin.scoreDelta;
  const hasDelta = scoreDelta !== undefined && scoreDelta !== null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="card card-hover"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-light text-gray-900">
              {checkin.lagScore}
            </div>
            <div className="px-3 py-1 bg-slate-50 rounded-md border border-slate-200">
              <span className="text-sm text-slate-700">
                {CATEGORY_LABELS[checkin.driftCategory]}
              </span>
            </div>
            {hasDelta && (
              <div className={`text-sm font-medium ${
                scoreDelta! < 0 ? 'text-emerald-600' : scoreDelta! > 0 ? 'text-amber-600' : 'text-gray-500'
              }`}>
                {scoreDelta! > 0 ? '+' : ''}{scoreDelta}
              </div>
            )}
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Focus</p>
            <p className="text-base text-gray-900">
              {DIMENSION_LABELS[checkin.weakestDimension] || checkin.weakestDimension}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-sm text-gray-500">
            {formatDate(checkin.createdAt)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
