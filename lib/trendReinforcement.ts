import { CheckinSummary } from '@/types';

export type TrendReinforcement =
  | { type: 'weeks'; count: number }
  | { type: 'improved' }
  | { type: 'stable' };

/**
 * Simple heuristic for narrative reinforcement under Lag Score on home.
 * Returns one message type when checkinHistory has 3+ entries.
 */
export function getTrendReinforcement(checkinHistory: CheckinSummary[]): TrendReinforcement | null {
  if (!checkinHistory || checkinHistory.length < 3) return null;

  const recent = checkinHistory.slice(0, 3);
  const scores = recent.map((c) => c.lagScore);

  // Improvement: latest score is lower (better) than 2 weeks ago
  if (scores.length >= 2 && scores[0] < scores[scores.length - 1]) {
    return { type: 'improved' };
  }

  // Stable: scores within ~5 points
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  if (max - min <= 5) return { type: 'stable' };

  // Default: weeks in a row (use history length as proxy for consecutive participation)
  return { type: 'weeks', count: checkinHistory.length };
}
