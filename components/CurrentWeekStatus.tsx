'use client';

import { motion } from 'framer-motion';
import { CheckinSummary, DriftCategory } from '@/types';
import Link from 'next/link';

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
  if (!checkin) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="card"
      >
        <div className="text-center space-y-4 py-8">
          <p className="text-lg text-gray-600">No check-in yet this week</p>
          <Link
            href="/checkin"
            className="inline-block px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors duration-200 font-medium"
          >
            Start Weekly Check-In
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="card"
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
            This Week&apos;s Focus
          </h2>
          <p className="text-xl text-gray-900">
            {DIMENSION_LABELS[checkin.weakestDimension] || checkin.weakestDimension}
          </p>
        </div>

        <div className="flex items-baseline gap-4">
          <div>
            <div className="text-5xl font-light text-gray-900">
              {checkin.lagScore}
            </div>
            <div className="text-sm text-gray-500 mt-1">Lag Score</div>
          </div>
          <div className="flex-1">
            <div className="inline-block px-4 py-2 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-base text-slate-700">
                {CATEGORY_LABELS[checkin.driftCategory]}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Last check-in: {formatTimeAgo(checkin.createdAt)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
