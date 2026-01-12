import { DriftCategory } from '@/types';

/**
 * Generate reassurance messages based on drift category
 * Tone: Neutral, supportive, adult, one sentence
 */

export function getReassuranceMessage(driftCategory: DriftCategory): string {
  switch (driftCategory) {
    case 'aligned':
      return "You're maintaining well.";

    case 'mild':
      return "Small adjustments help.";

    case 'moderate':
      return "This is a normal part of maintenance.";

    case 'heavy':
      return "Focus on one thing. That's enough.";

    case 'critical':
      return "Focus on one thing. That's enough.";

    default:
      return "This is maintenance, not measurement.";
  }
}
