'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { MicroGoalStatus, DimensionName } from '@/types';
import { getDimensionName } from '@/lib/i18n';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { enqueueAction } from '@/lib/offline-queue';
import GlassCard from './GlassCard';
import GhostButton from './GhostButton';

interface MicroGoalStatusCardProps {
  checkinId: string;
  focusDimension: DimensionName;
  microGoalText: string;
  initialStatus?: MicroGoalStatus;
}

export default function MicroGoalStatusCard({
  checkinId,
  focusDimension,
  microGoalText,
  initialStatus = 'not_started',
}: MicroGoalStatusCardProps) {
  const locale = useLocale();
  const prefersReducedMotion = useReducedMotion();
  const isOnline = useOnlineStatus();
  const [status, setStatus] = useState<MicroGoalStatus>(initialStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync with server status if it changes externally
  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  const handleStatusUpdate = async (newStatus: MicroGoalStatus) => {
    // Optimistic UI update
    setStatus(newStatus);
    setSaving(true);
    setError(null);

    // If offline, queue immediately
    if (!isOnline) {
      try {
        await enqueueAction(
          '/api/micro-goal-status',
          'POST',
          {
            checkinId,
            status: newStatus,
          }
        );
      } catch (queueError) {
        console.error('Error queueing status update:', queueError);
        setError('Will sync when online');
      } finally {
        setSaving(false);
      }
      return;
    }

    // If online, try to save directly
    try {
      const response = await fetch('/api/micro-goal-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkinId,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      // Queue for offline sync if request failed
      try {
        await enqueueAction(
          '/api/micro-goal-status',
          'POST',
          {
            checkinId,
            status: newStatus,
          }
        );
        setError('Will sync when online');
      } catch (queueError) {
        console.error('Error queueing status update:', queueError);
        setError('Failed to save');
        // Revert optimistic update on failure
        setStatus(initialStatus);
      }
    } finally {
      setSaving(false);
    }
  };

  const getStatusChip = () => {
    const baseClasses = 'text-xs px-2 py-1 rounded';
    switch (status) {
      case 'completed':
        return (
          <span className={`${baseClasses} bg-emerald-400/20 text-emerald-300`}>
            Completed
          </span>
        );
      case 'in_progress':
        return (
          <span className={`${baseClasses} bg-amber-400/20 text-amber-300`}>
            In Progress
          </span>
        );
      case 'skipped':
        return (
          <span className={`${baseClasses} bg-black/10 dark:bg-white/10 text-text2`}>
            Skipped
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-black/10 dark:bg-white/10 text-text2`}>
            Not Started
          </span>
        );
    }
  };

  return (
    <GlassCard>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center flex-wrap gap-2 mb-2">
              <span className="text-sm font-medium text-text0">
                Micro-Goal Status
              </span>
              <span className="text-xs px-2 py-1 bg-black/10 dark:bg-white/10 rounded text-text2">
                {getDimensionName(focusDimension, locale)}
              </span>
              {getStatusChip()}
            </div>
            <p className="text-sm text-text1 leading-relaxed">
              {microGoalText}
            </p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-xs text-red-300">{error}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-cardBorder">
          {status !== 'in_progress' && status !== 'completed' && (
            <GhostButton
              onClick={() => handleStatusUpdate('in_progress')}
              disabled={saving}
              className="text-xs px-3 py-1.5"
              aria-label="Mark as started"
            >
              Mark as started
            </GhostButton>
          )}
          {status !== 'completed' && (
            <GhostButton
              onClick={() => handleStatusUpdate('completed')}
              disabled={saving}
              className="text-xs px-3 py-1.5"
              aria-label="Mark as completed"
            >
              Mark as completed
            </GhostButton>
          )}
          {status !== 'skipped' && (
            <GhostButton
              onClick={() => handleStatusUpdate('skipped')}
              disabled={saving}
              className="text-xs px-3 py-1.5"
              aria-label="Skip"
            >
              Skip
            </GhostButton>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
