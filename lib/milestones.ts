import { Milestone } from '@/types';

export type MilestoneCheck = {
  checkinCount: number;
  streakCount: number;
  recentScores: number[]; // Last 2-3 scores for recovery detection
};

/**
 * Check-in count milestones: 4, 8, 12, 24, 52
 */
const CHECKIN_COUNT_MILESTONES = [4, 8, 12, 24, 52];

/**
 * Streak milestones: 4, 8, 12 weeks (16, 32, 48 weeks)
 */
const STREAK_MILESTONES = [4, 8, 12, 16, 32, 48];

/**
 * Check for new milestones based on current state
 */
export function checkNewMilestones(
  existingMilestones: Milestone[],
  checkinCount: number,
  streakCount: number,
  recentScores: number[]
): Array<{ type: 'checkin_count' | 'streak' | 'recovery'; value: number }> {
  const newMilestones: Array<{ type: 'checkin_count' | 'streak' | 'recovery'; value: number }> = [];

  // Check check-in count milestones
  for (const milestoneValue of CHECKIN_COUNT_MILESTONES) {
    if (checkinCount === milestoneValue) {
      const exists = existingMilestones.some(
        m => m.milestoneType === 'checkin_count' && m.milestoneValue === milestoneValue
      );
      if (!exists) {
        newMilestones.push({ type: 'checkin_count', value: milestoneValue });
      }
    }
  }

  // Check streak milestones
  for (const milestoneValue of STREAK_MILESTONES) {
    if (streakCount === milestoneValue) {
      const exists = existingMilestones.some(
        m => m.milestoneType === 'streak' && m.milestoneValue === milestoneValue
      );
      if (!exists) {
        newMilestones.push({ type: 'streak', value: milestoneValue });
      }
    }
  }

  // Check recovery milestone (score improved from >50 to <35)
  if (recentScores.length >= 2) {
    const previousScore = recentScores[recentScores.length - 2];
    const currentScore = recentScores[recentScores.length - 1];
    
    if (previousScore > 50 && currentScore < 35) {
      const exists = existingMilestones.some(
        m => m.milestoneType === 'recovery' && m.milestoneValue === 1
      );
      if (!exists) {
        newMilestones.push({ type: 'recovery', value: 1 });
      }
    }
  }

  return newMilestones;
}

/**
 * Format milestone message - neutral, factual, no gamification
 */
export function formatMilestoneMessage(
  milestoneType: 'checkin_count' | 'streak' | 'recovery',
  milestoneValue: number
): string {
  switch (milestoneType) {
    case 'checkin_count':
      if (milestoneValue === 4) {
        return "4 check-ins completed";
      } else if (milestoneValue === 8) {
        return "2 months of self-maintenance";
      } else if (milestoneValue === 12) {
        return "3 months of self-maintenance";
      } else if (milestoneValue === 24) {
        return "6 months of self-maintenance";
      } else if (milestoneValue === 52) {
        return "1 year of self-maintenance";
      }
      return `${milestoneValue} check-ins completed`;

    case 'streak':
      if (milestoneValue === 4) {
        return "1 month maintenance streak";
      } else if (milestoneValue === 8) {
        return "2 months maintenance streak";
      } else if (milestoneValue === 12) {
        return "3 months maintenance streak";
      } else if (milestoneValue === 16) {
        return "4 months maintenance streak";
      } else if (milestoneValue === 32) {
        return "8 months maintenance streak";
      } else if (milestoneValue === 48) {
        return "1 year maintenance streak";
      }
      return `${milestoneValue}-week maintenance streak`;

    case 'recovery':
      return "Recovered from drift";

    default:
      return "";
  }
}
