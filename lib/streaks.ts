/**
 * Soft streak logic: Streak continues only if Lag Score < 35 (Aligned or Mild Drift)
 * Neutral, non-pressured messaging
 */

export function calculateSoftStreak(
  currentScore: number,
  lastStreakCount: number,
  lastCheckinAt: Date | null,
  currentDate: Date = new Date()
): number {
  // First check-in - start streak if score is low
  if (!lastCheckinAt) {
    return currentScore < 35 ? 1 : 0;
  }

  // Check time gap (7 days)
  const daysDiff = (currentDate.getTime() - lastCheckinAt.getTime()) / (1000 * 60 * 60 * 24);
  
  // Gap too long - reset streak
  if (daysDiff > 7) {
    return currentScore < 35 ? 1 : 0;
  }

  // Within 7 days - check score threshold
  if (currentScore < 35) {
    // Score is good - continue streak
    return (lastStreakCount || 0) + 1;
  } else {
    // Score too high - reset streak silently
    return 0;
  }
}

export function formatStreakMessage(streakCount: number): string | null {
  // Only show if streak is 2 or more
  if (streakCount < 2) {
    return null;
  }

  if (streakCount === 2) {
    return "2-week maintenance streak";
  }

  if (streakCount < 52) {
    return `${streakCount}-week maintenance streak`;
  }

  // For 52+ weeks, show in months
  const months = Math.floor(streakCount / 4);
  return `${months}-month maintenance streak`;
}
