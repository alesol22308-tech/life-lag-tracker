/**
 * Soft streak logic: Streak continues only if Lag Score < 35 (Aligned or Mild Drift)
 * Neutral, non-pressured messaging
 */

// Constants
const STREAK_SCORE_THRESHOLD = 35; // Below this score = good (Aligned or Mild Drift)
const MAX_DAYS_BETWEEN_CHECKINS = 7;
const GRACE_PERIOD_HOURS = 12; // Allow 12 hours grace period
const MIN_VISIBLE_STREAK = 2;
const WEEKS_PER_MONTH = 4;
const WEEKS_IN_YEAR = 52;

export function calculateSoftStreak(
  currentScore: number,
  lastStreakCount: number,
  lastCheckinAt: Date | null,
  currentDate: Date = new Date()
): number {
  // Validate inputs
  if (typeof currentScore !== 'number' || isNaN(currentScore)) {
    console.warn('Invalid current score, resetting streak');
    return 0;
  }

  if (typeof lastStreakCount !== 'number' || isNaN(lastStreakCount) || lastStreakCount < 0) {
    console.warn('Invalid last streak count, starting fresh');
    lastStreakCount = 0;
  }

  // Handle invalid dates
  if (lastCheckinAt && isNaN(lastCheckinAt.getTime())) {
    console.warn('Invalid lastCheckinAt date, treating as first check-in');
    lastCheckinAt = null;
  }

  // Prevent future dates (clock skew protection)
  if (lastCheckinAt && lastCheckinAt.getTime() > currentDate.getTime()) {
    console.warn('Last check-in is in the future, treating as same-day check-in');
    lastCheckinAt = currentDate;
  }

  // First check-in - start streak if score is low
  if (!lastCheckinAt) {
    return currentScore < STREAK_SCORE_THRESHOLD ? 1 : 0;
  }

  // Calculate time difference
  const timeDiff = currentDate.getTime() - lastCheckinAt.getTime();
  const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
  const maxAllowedDays = MAX_DAYS_BETWEEN_CHECKINS + (GRACE_PERIOD_HOURS / 24);
  
  // Gap too long - reset streak
  if (daysDiff > maxAllowedDays) {
    return currentScore < STREAK_SCORE_THRESHOLD ? 1 : 0;
  }

  // Prevent multiple check-ins on same day from inflating streak
  if (daysDiff < 1) {
    // Same day check-in - maintain current streak but don't increment
    if (currentScore < STREAK_SCORE_THRESHOLD) {
      return lastStreakCount; // Don't increment
    } else {
      return 0; // Break streak
    }
  }

  // Within allowed time - check score threshold
  if (currentScore < STREAK_SCORE_THRESHOLD) {
    return (lastStreakCount || 0) + 1;
  } else {
    return 0;
  }
}

export function formatStreakMessage(streakCount: number): string | null {
  // Only show if streak is 2 or more
  if (streakCount < MIN_VISIBLE_STREAK) {
    return null;
  }

  // Early milestones
  if (streakCount === 2) {
    return "2-week maintenance streak";
  }
  
  if (streakCount === 3) {
    return "3-week maintenance streak";
  }
  
  if (streakCount === 4) {
    return "1-month maintenance streak";
  }

  // Weekly milestones (5-7 weeks)
  if (streakCount < 8) {
    return `${streakCount}-week maintenance streak`;
  }
  
  // Monthly format for 8+ weeks (2+ months)
  if (streakCount < WEEKS_IN_YEAR) {
    const months = Math.floor(streakCount / WEEKS_PER_MONTH);
    const remainingWeeks = streakCount % WEEKS_PER_MONTH;
    
    if (remainingWeeks === 0) {
      return `${months}-month maintenance streak`;
    } else {
      return `${months}+ month maintenance streak`;
    }
  }

  // Yearly format for 52+ weeks
  const years = Math.floor(streakCount / WEEKS_IN_YEAR);
  const remainingWeeks = streakCount % WEEKS_IN_YEAR;
  const months = Math.floor(remainingWeeks / WEEKS_PER_MONTH);
  
  if (years === 1 && months === 0) {
    return "1-year maintenance streak 🎯";
  }
  
  if (years === 1) {
    return `1+ year maintenance streak`;
  }
  
  return `${years}+ year maintenance streak`;
}

/**
 * Optional: Get rich streak information including metadata
 */
export interface StreakInfo {
  count: number;
  message: string | null;
  isActive: boolean;
  wasJustBroken: boolean;
  daysUntilReset: number | null;
}

export function getStreakInfo(
  currentScore: number,
  lastStreakCount: number,
  lastCheckinAt: Date | null,
  currentDate: Date = new Date()
): StreakInfo {
  const newCount = calculateSoftStreak(currentScore, lastStreakCount, lastCheckinAt, currentDate);
  const wasJustBroken = lastStreakCount > 0 && newCount === 0;
  const isActive = newCount > 0;
  
  let daysUntilReset: number | null = null;
  if (lastCheckinAt && isActive) {
    const daysSinceLastCheckin = (currentDate.getTime() - lastCheckinAt.getTime()) / (1000 * 60 * 60 * 24);
    daysUntilReset = Math.max(0, MAX_DAYS_BETWEEN_CHECKINS - Math.floor(daysSinceLastCheckin));
  }
  
  return {
    count: newCount,
    message: formatStreakMessage(newCount),
    isActive,
    wasJustBroken,
    daysUntilReset,
  };
}
