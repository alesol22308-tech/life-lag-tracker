import { DimensionName, MicroGoal } from '@/types';

/**
 * Generate micro-goal suggestion based on weakest dimension
 */
export function generateMicroGoalSuggestion(weakestDimension: DimensionName): string {
  const suggestions: Record<DimensionName, string[]> = {
    energy: [
      'Protect one 30-minute rest block each day',
      'Reduce one high-energy activity by 50% this week',
      'Say no to one new commitment this week',
    ],
    sleep: [
      'Go to bed within a 30-minute window for the next 3 nights',
      'Protect 7-8 hours of sleep for the next 5 nights',
      'Remove one evening activity to make room for sleep',
    ],
    structure: [
      'Create a simple 3-item daily checklist for the next 5 days',
      'Set one non-negotiable start time for your day',
      'Establish one fixed anchor point in your day (same time, same activity)',
    ],
    initiation: [
      'For one task each day, commit to just 5 minutes of starting it',
      'Pick one recurring task and start it at the same time each day',
      'Reduce one task\'s scope by 50% to make starting easier',
    ],
    engagement: [
      'For one task this week, commit to completing it in smaller chunks',
      'Pick one task and set a 25-minute focused session to work on it',
      'Reduce expectations on one task by 50% to make follow-through achievable',
    ],
    sustainability: [
      'Reduce effort on one activity by 20% this week',
      'Identify one area where you\'re overextending and reduce it by 30%',
      'Remove one source of ongoing effort for the next 7 days',
    ],
  };

  const options = suggestions[weakestDimension];
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Get the current week start date (Monday)
 */
export function getCurrentWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(now.setDate(diff));
}

/**
 * Check if a micro-goal belongs to the current week
 */
export function isCurrentWeekGoal(goal: MicroGoal): boolean {
  const goalDate = new Date(goal.createdAt);
  const weekStart = getCurrentWeekStart();
  return goalDate >= weekStart;
}
