'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocale } from 'next-intl';
import { CheckinSummary } from '@/types';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import GlassCard from '@/components/GlassCard';
import { getDimensionName, getDriftCategoryName, type Locale } from '@/lib/i18n';

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
  isLatest?: boolean;
}

export default function CheckinHistoryCard({ checkin, index, isLatest = false }: CheckinHistoryCardProps) {
  const locale = useLocale();
  const prefersReducedMotion = useReducedMotion();
  const scoreDelta = checkin.scoreDelta;
  const hasDelta = scoreDelta !== undefined && scoreDelta !== null;
  const hasReflection = checkin.reflectionNote && checkin.reflectionNote.trim().length > 0;
  const microGoalStatus = checkin.microGoalCompletionStatus
    ? (Object.values(checkin.microGoalCompletionStatus)[0] as 'completed' | 'skipped' | 'in_progress' | undefined)
    : undefined;
  const hasMicroGoal = microGoalStatus != null;
  // Show reflections and micro-goal expanded by default so users can easily see past entries
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMicroGoalExpanded, setIsMicroGoalExpanded] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : index * 0.05 }}
    >
      <GlassCard hover className={isLatest ? 'ring-2 ring-cardBorder' : ''}>
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <div className="text-2xl font-light text-text0">
                  {checkin.lagScore}
                </div>
                <div className="px-3 py-1 bg-black/5 dark:bg-white/5 rounded-md border border-cardBorder">
                  <span className="text-sm text-text0">
                    {getDriftCategoryName(checkin.driftCategory, locale as Locale)}
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
                  {getDimensionName(checkin.weakestDimension, locale as Locale) || checkin.weakestDimension}
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
              {hasMicroGoal && (
                <span className="inline-flex items-center gap-1 text-xs text-text2">
                  <span className="w-1.5 h-1.5 bg-amber-400/60 rounded-full"></span>
                  Micro-Goal
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
                  <div className="bg-black/5 dark:bg-white/5 rounded-lg p-3 border border-cardBorder/50">
                    <p className="text-sm text-text1 italic leading-relaxed">
                      &quot;{checkin.reflectionNote}&quot;
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Micro-Goal Status - Same pattern as reflection, collapsible */}
          {hasMicroGoal && (
            <div className="pt-3 border-t border-cardBorder">
              <button
                onClick={() => setIsMicroGoalExpanded(!isMicroGoalExpanded)}
                className="w-full text-left flex items-center justify-between gap-2 text-sm text-text2 hover:text-text1 transition-colors duration-200"
                aria-expanded={isMicroGoalExpanded}
                aria-label={isMicroGoalExpanded ? 'Hide micro-goal status' : 'Show micro-goal status'}
              >
                <span className="font-medium flex items-center gap-2">
                  <span className="text-amber-400">◎</span>
                  Micro-Goal
                </span>
                <span className="text-xs">{isMicroGoalExpanded ? '−' : '+'}</span>
              </button>
              {isMicroGoalExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                  className="mt-3"
                >
                  <div className="bg-black/5 dark:bg-white/5 rounded-lg p-3 border border-cardBorder/50 space-y-2">
                    {checkin.microGoalText && (
                      <p className="text-sm text-text1">
                        &quot;{checkin.microGoalText}&quot;
                      </p>
                    )}
                    {microGoalStatus === 'completed' && (
                      <span className="text-sm text-emerald-400 font-medium flex items-center gap-2">
                        <span>✓</span> Completed
                      </span>
                    )}
                    {microGoalStatus === 'in_progress' && (
                      <span className="text-sm text-amber-400 font-medium flex items-center gap-2">
                        In progress
                      </span>
                    )}
                    {microGoalStatus === 'skipped' && (
                      <span className="text-sm text-text2 font-medium flex items-center gap-2">
                        Skipped
                      </span>
                    )}
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
