'use client';

import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { MicroGoalStatus, DimensionName } from '@/types';
import { getDimensionName } from '@/lib/i18n';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { enqueueAction } from '@/lib/offline-queue';
import GlassCard from './GlassCard';
import GhostButton from './GhostButton';
import PrimaryButton from './PrimaryButton';

interface MicroGoalStatusCardProps {
  checkinId: string;
  focusDimension: DimensionName;
  microGoalText: string;
  initialStatus?: MicroGoalStatus;
  /** When provided, enables Edit and Remove for the goal */
  goalId?: string;
  /** Goal text from active micro_goal; used when editing */
  goalText?: string;
  onGoalRemoved?: () => void;
  onGoalUpdated?: (newText: string) => void;
}

export default function MicroGoalStatusCard({
  checkinId,
  focusDimension,
  microGoalText,
  initialStatus = 'not_started',
  goalId,
  goalText,
  onGoalRemoved,
  onGoalUpdated,
}: MicroGoalStatusCardProps) {
  const locale = useLocale();
  const t = useTranslations('microGoals');
  const tCommon = useTranslations('common');
  const isOnline = useOnlineStatus();
  const [status, setStatus] = useState<MicroGoalStatus>(initialStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editGoalText, setEditGoalText] = useState(goalText ?? microGoalText);

  // Sync with server status if it changes externally
  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    setEditGoalText(goalText ?? microGoalText);
  }, [goalText, microGoalText]);

  const handleUpdateGoal = async () => {
    if (!goalId) return;
    const trimmedText = editGoalText.trim();
    if (!trimmedText) return;
    if (trimmedText.length > 500) {
      setError(t('goalMaxLength'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/micro-goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: goalId, goalText: trimmedText }),
      });
      if (!response.ok) throw new Error('Failed to update');
      setIsEditing(false);
      onGoalUpdated?.(trimmedText);
    } catch (err) {
      console.error('Error updating micro-goal:', err);
      setError(t('failedToSave'));
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveGoal = async () => {
    if (!goalId) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/micro-goals?id=${goalId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to remove');
      onGoalRemoved?.();
    } catch (err) {
      console.error('Error removing micro-goal:', err);
      setError(t('failedToSave'));
    } finally {
      setSaving(false);
    }
  };

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
        setError(t('willSyncWhenOnline'));
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
        setError(t('willSyncWhenOnline'));
      } catch (queueError) {
        console.error('Error queueing status update:', queueError);
        setError(t('failedToSave'));
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
            {t('completed')}
          </span>
        );
      case 'in_progress':
        return (
          <span className={`${baseClasses} bg-amber-400/20 text-amber-300`}>
            {t('inProgress')}
          </span>
        );
      case 'skipped':
        return (
          <span className={`${baseClasses} bg-black/10 dark:bg-white/10 text-text2`}>
            {t('skip')}
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-black/10 dark:bg-white/10 text-text2`}>
            {t('notStarted')}
          </span>
        );
    }
  };

  const displayText = isEditing ? editGoalText : (goalText ?? microGoalText);

  if (isEditing && goalId) {
    return (
      <GlassCard>
        <div className="space-y-4">
          {error && (
            <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}
          <div>
            <label htmlFor="edit-status-micro-goal" className="block text-sm font-medium text-text1 mb-2">
              {t('weeklyMicroGoal')}
            </label>
            <textarea
              id="edit-status-micro-goal"
              value={editGoalText}
              onChange={(e) => {
                setEditGoalText(e.target.value);
                setError(null);
              }}
              placeholder={t('placeholder')}
              rows={3}
              maxLength={500}
              disabled={saving}
              className="w-full px-4 py-3 border border-cardBorder rounded-lg bg-black/5 dark:bg-white/5 text-text0 placeholder:text-text2 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-transparent resize-none disabled:opacity-50"
            />
            <p className="text-xs text-text2 mt-1 text-right">
              {editGoalText.length}/500
            </p>
          </div>
          <div className="flex gap-2">
            <PrimaryButton
              onClick={handleUpdateGoal}
              disabled={!editGoalText.trim() || saving}
              className="text-sm px-4 py-2"
              aria-label={t('saveGoal')}
            >
              {saving ? t('saveGoal') + '...' : t('saveGoal')}
            </PrimaryButton>
            <GhostButton
              onClick={() => {
                setIsEditing(false);
                setEditGoalText(goalText ?? microGoalText);
                setError(null);
              }}
              disabled={saving}
              className="text-sm px-4 py-2"
              aria-label={tCommon('cancel')}
            >
              {tCommon('cancel')}
            </GhostButton>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2 mb-2">
              <span className="text-sm font-medium text-text0">
                {t('microGoalStatus')}
              </span>
              <span className="text-xs px-2 py-1 bg-black/10 dark:bg-white/10 rounded text-text2">
                {getDimensionName(focusDimension, locale)}
              </span>
              {getStatusChip()}
            </div>
            <p className="text-sm text-text1 leading-relaxed">
              {displayText}
            </p>
          </div>
          {goalId && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => {
                  setEditGoalText(goalText ?? microGoalText);
                  setIsEditing(true);
                  setError(null);
                }}
                disabled={saving}
                aria-label={t('edit')}
                className="text-text2 hover:text-text1 transition-colors focus:outline-none focus:ring-2 focus:ring-black/30 dark:focus:ring-white/30 rounded p-1 disabled:opacity-50"
              >
                ✎
              </button>
              <button
                onClick={handleRemoveGoal}
                disabled={saving}
                aria-label={t('remove')}
                className="text-text2 hover:text-text1 transition-colors focus:outline-none focus:ring-2 focus:ring-black/30 dark:focus:ring-white/30 rounded p-1 disabled:opacity-50"
              >
                {saving ? '...' : '✕'}
              </button>
            </div>
          )}
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
              aria-label={t('markStarted')}
            >
              {t('markStarted')}
            </GhostButton>
          )}
          {status !== 'completed' && (
            <GhostButton
              onClick={() => handleStatusUpdate('completed')}
              disabled={saving}
              className="text-xs px-3 py-1.5"
              aria-label={t('markCompleted')}
            >
              {t('markCompleted')}
            </GhostButton>
          )}
          {status !== 'skipped' && (
            <GhostButton
              onClick={() => handleStatusUpdate('skipped')}
              disabled={saving}
              className="text-xs px-3 py-1.5"
              aria-label={t('skip')}
            >
              {t('skip')}
            </GhostButton>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
