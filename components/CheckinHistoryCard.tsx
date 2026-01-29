'use client';

import { useState } from 'react';
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
  const hasReflection = checkin.reflectionNote && checkin.reflectionNote.trim().length > 0;
  // Show reflections expanded by default so users can easily see past reflections
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : index * 0.05 }}
    >
      <GlassCard hover>
        <div className="space-y-3">
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

            <div className="text-right space-y-1">
              <p className="text-sm text-text2">
                {formatDate(checkin.createdAt)}
              </p>
              {hasReflection && (
                <span className="inline-flex items-center gap-1 text-xs text-text2">
                  <span className="w-1.5 h-1.5 bg-emerald-400/60 rounded-full"></span>
                  Reflection
                </span>
              )}
            </div>
          </div>

          {/* Reflection Note - Always visible when exists, collapsible for space */}
          {hasReflection && (
            <div className="pt-3 border-t border-cardBorder">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full text-left flex items-center justify-between gap-2 text-sm text-text2 hover:text-text1 transition-colors duration-200"
                aria-expanded={isExpanded}
                aria-label={isExpanded ? 'Hide reflection note' : 'Show reflection note'}
              >
                <span className="font-medium flex items-center gap-2">
                  <span className="text-emerald-400">✎</span>
                  Your Reflection
                </span>
                <span className="text-xs">{isExpanded ? '−' : '+'}</span>
              </button>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                  className="mt-3"
                >
                  <div className="bg-white/5 rounded-lg p-3 border border-cardBorder/50">
                    <p className="text-sm text-text1 italic leading-relaxed">
                      &quot;{checkin.reflectionNote}&quot;
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}
