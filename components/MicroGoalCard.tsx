'use client';

import { useState, useEffect } from 'react';
import { MicroGoal, DimensionName } from '@/types';
import { generateMicroGoalSuggestion } from '@/lib/micro-goals';
import GlassCard from './GlassCard';
import PrimaryButton from './PrimaryButton';
import GhostButton from './GhostButton';

const DIMENSION_LABELS: Record<DimensionName, string> = {
  energy: 'Energy',
  sleep: 'Sleep consistency',
  structure: 'Daily structure',
  initiation: 'Task initiation',
  engagement: 'Engagement / follow-through',
  sustainability: 'Effort sustainability',
};

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
  const [activeGoal, setActiveGoal] = useState<MicroGoal | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [customGoalText, setCustomGoalText] = useState('');
  const [suggestedGoal, setSuggestedGoal] = useState('');
  const [loading, setLoading] = useState(true);

  // Load active micro-goal
  useEffect(() => {
    async function loadActiveGoal() {
      try {
        const response = await fetch('/api/micro-goals');
        if (response.ok) {
          const data = await response.json();
          setActiveGoal(normalizeMicroGoal(data.goal));
        }
      } catch (error) {
        console.error('Error loading micro-goal:', error);
      } finally {
        setLoading(false);
      }
    }

    loadActiveGoal();
    setSuggestedGoal(generateMicroGoalSuggestion(weakestDimension));
  }, [weakestDimension]);

  const handleCreateGoal = async (goalText: string) => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/micro-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dimension: weakestDimension,
          goalText,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create micro-goal');
      }

      const data = await response.json();
      const normalizedGoal = normalizeMicroGoal(data.goal);
      setActiveGoal(normalizedGoal);
      setCustomGoalText('');
      setIsCreating(false);
      onGoalSet?.(normalizedGoal!);
    } catch (error) {
      console.error('Error creating micro-goal:', error);
      alert('Failed to create micro-goal. Please try again.');
      setIsCreating(false);
    }
  };

  const handleDeleteGoal = async () => {
    if (!activeGoal) return;

    try {
      const response = await fetch(`/api/micro-goals?id=${activeGoal.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete micro-goal');
      }

      setActiveGoal(null);
      onGoalDismiss?.();
    } catch (error) {
      console.error('Error deleting micro-goal:', error);
      alert('Failed to delete micro-goal. Please try again.');
    }
  };

  if (loading) {
    return null;
  }

  // If user has an active goal, show it
  if (activeGoal) {
    const isCompleted = !!activeGoal.completedAt;
    const isInProgress = activeGoal.isActive && !isCompleted;
    
    return (
      <GlassCard>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-text0">
                  Weekly Micro-Goal
                </span>
                <span className="text-xs px-2 py-1 bg-white/10 rounded text-text2">
                  {DIMENSION_LABELS[activeGoal.dimension as DimensionName]}
                </span>
                {isCompleted && (
                  <span className="text-xs px-2 py-1 bg-emerald-400/20 text-emerald-300 rounded flex items-center gap-1">
                    <span>✓</span>
                    <span>Completed</span>
                  </span>
                )}
                {isInProgress && (
                  <span className="text-xs px-2 py-1 bg-amber-400/20 text-amber-300 rounded">
                    In Progress
                  </span>
                )}
              </div>
              <p className="text-sm text-text1 leading-relaxed">
                {activeGoal.goalText}
              </p>
            </div>
            <button
              onClick={handleDeleteGoal}
              aria-label="Dismiss micro-goal"
              className="text-text2 hover:text-text1 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30 rounded p-1"
            >
              ✕
            </button>
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
            Set a Weekly Micro-Goal
          </h3>
          <p className="text-sm text-text2 mb-3">
            Since {DIMENSION_LABELS[weakestDimension].toLowerCase()} was your weakest dimension, here&apos;s a suggested micro-goal:
          </p>
          <div className="p-3 bg-white/5 rounded-lg border border-cardBorder mb-4">
            <p className="text-sm text-text1 italic">&quot;{suggestedGoal}&quot;</p>
          </div>
        </div>

        {!isCreating ? (
          <div className="flex gap-2">
            <PrimaryButton
              onClick={() => handleCreateGoal(suggestedGoal)}
              className="flex-1 text-sm px-4 py-2"
              aria-label="Create suggested micro-goal"
            >
              Use Suggestion
            </PrimaryButton>
            <GhostButton
              onClick={() => setIsCreating(true)}
              className="flex-1 text-sm px-4 py-2"
              aria-label="Create custom micro-goal"
            >
              Custom Goal
            </GhostButton>
            {onGoalDismiss && (
              <button
                onClick={onGoalDismiss}
                className="text-sm text-text2 hover:text-text1 transition-colors px-3 focus:outline-none focus:ring-2 focus:ring-white/30 rounded"
                aria-label="Dismiss micro-goal prompt"
              >
                Dismiss
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              value={customGoalText}
              onChange={(e) => setCustomGoalText(e.target.value)}
              placeholder="Enter your custom micro-goal..."
              rows={3}
              maxLength={500}
              className="w-full px-4 py-3 border border-cardBorder rounded-lg bg-white/5 text-text0 placeholder:text-text2 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent resize-none"
            />
            <div className="flex gap-2">
              <PrimaryButton
                onClick={() => handleCreateGoal(customGoalText.trim())}
                disabled={!customGoalText.trim() || isCreating}
                className="flex-1 text-sm px-4 py-2"
                aria-label="Save custom micro-goal"
              >
                Save Goal
              </PrimaryButton>
              <GhostButton
                onClick={() => {
                  setIsCreating(false);
                  setCustomGoalText('');
                }}
                className="text-sm px-4 py-2"
                aria-label="Cancel custom goal"
              >
                Cancel
              </GhostButton>
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
