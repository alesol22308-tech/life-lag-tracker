'use client';

import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { MicroGoal, DimensionName } from '@/types';
import { generateMicroGoalSuggestion } from '@/lib/micro-goals';
import { getDimensionName } from '@/lib/i18n';
import GlassCard from './GlassCard';
import PrimaryButton from './PrimaryButton';
import GhostButton from './GhostButton';

interface MicroGoalCardProps {
  weakestDimension: DimensionName;
  onGoalSet?: (goal: MicroGoal) => void;
  onGoalDismiss?: () => void;
}

// Helper to normalize API response (snake_case) to TypeScript type (camelCase)
function normalizeMicroGoal(goal: any): MicroGoal | null {
  if (!goal) return null;
  return {
    id: goal.id,
    dimension: goal.dimension,
    goalText: goal.goal_text || goal.goalText,
    createdAt: goal.created_at || goal.createdAt,
    completedAt: goal.completed_at || goal.completedAt,
    isActive: goal.is_active !== undefined ? goal.is_active : goal.isActive,
  };
}

export default function MicroGoalCard({ weakestDimension, onGoalSet, onGoalDismiss }: MicroGoalCardProps) {
  const locale = useLocale();
  const t = useTranslations('microGoals');
  const tCommon = useTranslations('common');
  const [activeGoal, setActiveGoal] = useState<MicroGoal | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [customGoalText, setCustomGoalText] = useState('');
  const [suggestedGoal, setSuggestedGoal] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editGoalText, setEditGoalText] = useState('');

  // Load active micro-goal
  useEffect(() => {
    async function loadActiveGoal() {
      try {
        const response = await fetch('/api/micro-goals');
        if (response.ok) {
          const data = await response.json();
          setActiveGoal(normalizeMicroGoal(data.goal));
        } else {
          console.error('Failed to load micro-goal, status:', response.status);
        }
      } catch (err) {
        console.error('Error loading micro-goal:', err);
      } finally {
        setLoading(false);
      }
    }

    loadActiveGoal();
    setSuggestedGoal(generateMicroGoalSuggestion(weakestDimension));
  }, [weakestDimension]);

  const handleCreateGoal = async (goalText: string) => {
    // Validate goal text
    const trimmedText = goalText.trim();
    if (!trimmedText) {
      setError(t('pleaseEnterGoal'));
      return;
    }

    if (trimmedText.length > 500) {
      setError(t('goalMaxLength'));
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/micro-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dimension: weakestDimension,
          goalText: trimmedText,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || t('failedToSave'));
      }

      const data = await response.json();
      const normalizedGoal = normalizeMicroGoal(data.goal);
      
      if (!normalizedGoal) {
        throw new Error('Invalid response from server');
      }

      // Update state immediately
      setActiveGoal(normalizedGoal);
      setCustomGoalText('');
      setShowCustomInput(false);
      setSuccessMessage(t('goalSaved'));
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
      
      onGoalSet?.(normalizedGoal);
    } catch (err: any) {
      console.error('Error creating micro-goal:', err);
      setError(err.message || t('failedToSave'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateGoal = async () => {
    if (!activeGoal) return;
    const trimmedText = editGoalText.trim();
    if (!trimmedText) {
      setError(t('pleaseEnterGoal'));
      return;
    }
    if (trimmedText.length > 500) {
      setError(t('goalMaxLength'));
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/micro-goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activeGoal.id, goalText: trimmedText }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || t('failedToSave'));
      }
      const data = await response.json();
      const normalizedGoal = normalizeMicroGoal(data.goal);
      if (normalizedGoal) {
        setActiveGoal(normalizedGoal);
        setIsEditing(false);
        setEditGoalText('');
        setSuccessMessage(t('goalSaved'));
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err: any) {
      console.error('Error updating micro-goal:', err);
      setError(err.message || t('failedToSave'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGoal = async () => {
    if (!activeGoal) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/micro-goals?id=${activeGoal.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete micro-goal');
      }

      setActiveGoal(null);
      onGoalDismiss?.();
    } catch (err: any) {
      console.error('Error deleting micro-goal:', err);
      setError(err.message || 'Failed to delete micro-goal. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <GlassCard>
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-black/10 dark:bg-white/10 rounded w-1/3"></div>
          <div className="h-4 bg-black/10 dark:bg-white/10 rounded w-2/3"></div>
        </div>
      </GlassCard>
    );
  }

  // If user has an active goal, show it
  if (activeGoal) {
    const isCompleted = !!activeGoal.completedAt;
    const isInProgress = activeGoal.isActive && !isCompleted;

    if (isEditing) {
      return (
        <GlassCard>
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}
            <div>
              <label htmlFor="edit-micro-goal" className="block text-sm font-medium text-text1 mb-2">
                {t('weeklyMicroGoal')}
              </label>
              <textarea
                id="edit-micro-goal"
                value={editGoalText}
                onChange={(e) => {
                  setEditGoalText(e.target.value);
                  setError(null);
                }}
                placeholder={t('placeholder')}
                rows={3}
                maxLength={500}
                disabled={isSaving}
                className="w-full px-4 py-3 border border-cardBorder rounded-lg bg-black/5 dark:bg-white/5 text-text0 placeholder:text-text2 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-transparent resize-none disabled:opacity-50"
              />
              <p className="text-xs text-text2 mt-1 text-right">
                {editGoalText.length}/500
              </p>
            </div>
            <div className="flex gap-2">
              <PrimaryButton
                onClick={handleUpdateGoal}
                disabled={!editGoalText.trim() || isSaving}
                className="text-sm px-4 py-2"
                aria-label={t('saveGoal')}
              >
                {isSaving ? t('saveGoal') + '...' : t('saveGoal')}
              </PrimaryButton>
              <GhostButton
                onClick={() => {
                  setIsEditing(false);
                  setEditGoalText('');
                  setError(null);
                }}
                disabled={isSaving}
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
          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}
          {successMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <p className="text-sm text-emerald-300">{successMessage}</p>
            </div>
          )}
          
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center flex-wrap gap-2 mb-2">
                <span className="text-sm font-medium text-text0">
                  {t('weeklyMicroGoal')}
                </span>
                <span className="text-xs px-2 py-1 bg-black/10 dark:bg-white/10 rounded text-text2">
                  {getDimensionName(activeGoal.dimension, locale)}
                </span>
                {isCompleted && (
                  <span className="text-xs px-2 py-1 bg-emerald-400/20 text-emerald-300 rounded flex items-center gap-1">
                    <span>✓</span>
                    <span>{t('completed')}</span>
                  </span>
                )}
                {isInProgress && (
                  <span className="text-xs px-2 py-1 bg-amber-400/20 text-amber-300 rounded">
                    {t('inProgress')}
                  </span>
                )}
              </div>
              <p className="text-sm text-text1 leading-relaxed">
                {activeGoal.goalText}
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => {
                  setEditGoalText(activeGoal.goalText);
                  setIsEditing(true);
                  setError(null);
                }}
                disabled={isSaving}
                aria-label={t('edit')}
                className="text-text2 hover:text-text1 transition-colors focus:outline-none focus:ring-2 focus:ring-black/30 dark:focus:ring-white/30 rounded p-1 disabled:opacity-50"
              >
                ✎
              </button>
              <button
                onClick={handleDeleteGoal}
                disabled={isSaving}
                aria-label={t('remove')}
                className="text-text2 hover:text-text1 transition-colors focus:outline-none focus:ring-2 focus:ring-black/30 dark:focus:ring-white/30 rounded p-1 disabled:opacity-50"
              >
                {isSaving ? '...' : '✕'}
              </button>
            </div>
          </div>
        </div>
      </GlassCard>
    );
  }

  // Show prompt to create a micro-goal
  return (
    <GlassCard>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-text0 mb-2">
            {t('setWeeklyGoal')}
          </h3>
          <p className="text-sm text-text2 mb-3">
            {t('sinceWeakest')}: {getDimensionName(weakestDimension, locale)}
          </p>
          <div className="p-3 bg-black/5 dark:bg-white/5 rounded-lg border border-cardBorder mb-4">
            <p className="text-sm text-text1 italic">&quot;{suggestedGoal}&quot;</p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Success message */}
        {successMessage && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <p className="text-sm text-emerald-300">{successMessage}</p>
          </div>
        )}

        {!showCustomInput ? (
          <div className="flex gap-2">
            <PrimaryButton
              onClick={() => handleCreateGoal(suggestedGoal)}
              disabled={isSaving || !suggestedGoal}
              className="flex-1 text-sm px-4 py-2"
              aria-label="Create suggested micro-goal"
            >
              {isSaving ? t('saveGoal') + '...' : t('useSuggestion')}
            </PrimaryButton>
            <GhostButton
              onClick={() => {
                setShowCustomInput(true);
                setError(null);
              }}
              disabled={isSaving}
              className="flex-1 text-sm px-4 py-2"
              aria-label={t('customGoal')}
            >
              {t('customGoal')}
            </GhostButton>
            {onGoalDismiss && (
              <button
                onClick={onGoalDismiss}
                disabled={isSaving}
                className="text-sm text-text2 hover:text-text1 transition-colors px-3 focus:outline-none focus:ring-2 focus:ring-black/30 dark:focus:ring-white/30 rounded disabled:opacity-50"
                aria-label={t('dismiss')}
              >
                {t('dismiss')}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <textarea
                value={customGoalText}
                onChange={(e) => {
                  setCustomGoalText(e.target.value);
                  setError(null);
                }}
                placeholder={t('placeholder')}
                rows={3}
                maxLength={500}
                disabled={isSaving}
                className="w-full px-4 py-3 border border-cardBorder rounded-lg bg-black/5 dark:bg-white/5 text-text0 placeholder:text-text2 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-transparent resize-none disabled:opacity-50"
              />
              <p className="text-xs text-text2 mt-1 text-right">
                {customGoalText.length}/500
              </p>
            </div>
            <div className="flex gap-2">
              <PrimaryButton
                onClick={() => handleCreateGoal(customGoalText)}
                disabled={!customGoalText.trim() || isSaving}
                className="flex-1 text-sm px-4 py-2"
                aria-label="Save custom micro-goal"
              >
                {isSaving ? t('saveGoal') + '...' : t('saveGoal')}
              </PrimaryButton>
              <GhostButton
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomGoalText('');
                  setError(null);
                }}
                disabled={isSaving}
                className="text-sm px-4 py-2"
                aria-label={tCommon('cancel')}
              >
                {tCommon('cancel')}
              </GhostButton>
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
