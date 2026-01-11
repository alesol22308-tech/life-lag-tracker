import { Answers, DriftCategory, DimensionName } from '@/types';

/**
 * Calculate lag score from answers
 * Formula: (5 - value) / 4 for each answer, average, multiply by 100, apply 0.8 softening
 */
export function calculateLagScore(answers: Answers): number {
  const driftValues = [
    (5 - answers.energy) / 4,
    (5 - answers.sleep) / 4,
    (5 - answers.structure) / 4,
    (5 - answers.initiation) / 4,
    (5 - answers.engagement) / 4,
    (5 - answers.sustainability) / 4,
  ];
  
  const average = driftValues.reduce((a, b) => a + b, 0) / 6;
  const rawScore = average * 100;
  const softenedScore = rawScore * 0.8;
  
  return Math.round(Math.max(0, Math.min(100, softenedScore)));
}

/**
 * Get drift category from lag score
 */
export function getDriftCategory(score: number): DriftCategory {
  if (score >= 0 && score <= 19) return 'aligned';
  if (score >= 20 && score <= 34) return 'mild';
  if (score >= 35 && score <= 54) return 'moderate';
  if (score >= 55 && score <= 74) return 'heavy';
  return 'critical';
}

/**
 * Get the weakest dimension (lowest scoring question)
 */
export function getWeakestDimension(answers: Answers): DimensionName {
  const dimensions: DimensionName[] = ['energy', 'sleep', 'structure', 'initiation', 'engagement', 'sustainability'];
  const values = [
    answers.energy,
    answers.sleep,
    answers.structure,
    answers.initiation,
    answers.engagement,
    answers.sustainability,
  ];
  
  const minValue = Math.min(...values);
  const minIndex = values.indexOf(minValue);
  
  return dimensions[minIndex];
}
