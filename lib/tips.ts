import { DriftCategory, DimensionName, Tip } from '@/types';

/**
 * Tip feedback scoring system:
 * - "helpful" = +2 points
 * - "didn't try" = 0 points (neutral)
 * - "not relevant" = -1 point
 */
type TipFeedback = 'helpful' | 'didnt_try' | 'not_relevant';

interface TipFeedbackHistory {
  dimension: DimensionName;
  category: DriftCategory;
  feedback: TipFeedback;
  createdAt: string;
}

/**
 * Calculate weighted score for a tip based on feedback history
 * More recent feedback weighs more heavily
 */
function calculateTipScore(
  dimension: DimensionName,
  category: DriftCategory,
  feedbackHistory: TipFeedbackHistory[]
): number {
  const relevantFeedback = feedbackHistory.filter(
    f => f.dimension === dimension && f.category === category
  );

  if (relevantFeedback.length === 0) {
    return 0; // Neutral score if no feedback
  }

  // Sort by recency (most recent first)
  const sortedFeedback = relevantFeedback.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Calculate weighted score (more recent = higher weight)
  let totalScore = 0;
  let totalWeight = 0;

  sortedFeedback.forEach((feedback, index) => {
    const weight = 1 / (index + 1); // Decreasing weight: 1, 0.5, 0.33, etc.
    let score = 0;

    switch (feedback.feedback) {
      case 'helpful':
        score = 2;
        break;
      case 'didnt_try':
        score = 0;
        break;
      case 'not_relevant':
        score = -1;
        break;
    }

    totalScore += score * weight;
    totalWeight += weight;
  });

  return totalWeight > 0 ? totalScore / totalWeight : 0;
}

/**
 * Get all available tips for a dimension × category combination
 * Returns array of tips (for personalization selection)
 */
function getAllTipsForDimensionCategory(
  dimension: DimensionName,
  category: DriftCategory
): Tip[] {
  // For now, return single tip (can be expanded to have multiple options per combination)
  return [getTip(dimension, category)];
}

/**
 * Get personalized tip based on weakest dimension, drift category, and feedback history
 */
export function getTip(
  weakestDimension: DimensionName,
  category: DriftCategory,
  feedbackHistory?: TipFeedbackHistory[]
): Tip {
  // Critical Drift: Only sleep or load reduction tips
  if (category === 'critical') {
    if (weakestDimension === 'sleep') {
      return {
        focus: 'Sleep restoration',
        constraint: 'Protect 7-9 hours of sleep for the next 3 nights, even if it means saying no to other commitments',
        choice: 'Choose which 3 nights this week, and what you\'ll postpone to make room',
      };
    }
    // For critical drift, default to load reduction
    return {
      focus: 'Immediate load reduction',
      constraint: 'Identify one recurring commitment or task you can pause or defer for the next 7 days',
      choice: 'Decide which one, and communicate the pause clearly to anyone affected',
    };
  }

  // Tips for each dimension × category combination
  const tipMap: Record<DimensionName, Record<DriftCategory, Tip>> = {
    energy: {
      aligned: {
        focus: 'Energy maintenance',
        constraint: 'Keep your current rhythm for the next week',
        choice: 'Notice what\'s working and continue it',
      },
      mild: {
        focus: 'Energy preservation',
        constraint: 'Protect one 30-minute block daily for rest or low-demand activity',
        choice: 'Choose the time of day that feels most important to protect',
      },
      moderate: {
        focus: 'Energy restoration',
        constraint: 'Reduce one high-energy-demand activity this week by 50%',
        choice: 'Select which activity, and how you\'ll scale it back',
      },
      heavy: {
        focus: 'Energy recovery',
        constraint: 'Remove one recurring commitment for the next 7 days',
        choice: 'Choose which one, and communicate the pause clearly',
      },
      critical: {
        focus: 'Immediate load reduction',
        constraint: 'Identify one recurring commitment or task you can pause or defer for the next 7 days',
        choice: 'Decide which one, and communicate the pause clearly to anyone affected',
      },
    },
    sleep: {
      aligned: {
        focus: 'Sleep maintenance',
        constraint: 'Keep your current sleep schedule for the next week',
        choice: 'Continue what\'s working',
      },
      mild: {
        focus: 'Sleep consistency',
        constraint: 'Go to bed within a 30-minute window for the next 3 nights',
        choice: 'Choose your target bedtime',
      },
      moderate: {
        focus: 'Sleep protection',
        constraint: 'Protect 7-8 hours of sleep for the next 5 nights, even if it means reducing evening activities',
        choice: 'Decide which evening activities you\'ll scale back',
      },
      heavy: {
        focus: 'Sleep restoration',
        constraint: 'Prioritize 7-9 hours of sleep for the next 7 nights, adjusting other commitments as needed',
        choice: 'Identify what you\'ll adjust to make room',
      },
      critical: {
        focus: 'Sleep restoration',
        constraint: 'Protect 7-9 hours of sleep for the next 3 nights, even if it means saying no to other commitments',
        choice: 'Choose which 3 nights this week, and what you\'ll postpone to make room',
      },
    },
    structure: {
      aligned: {
        focus: 'Structure maintenance',
        constraint: 'Continue your current daily structure',
        choice: 'Keep doing what works',
      },
      mild: {
        focus: 'Structure reinforcement',
        constraint: 'Establish one fixed anchor point in your day (same time, same activity) for the next week',
        choice: 'Choose which anchor point works best for you',
      },
      moderate: {
        focus: 'Structure rebuilding',
        constraint: 'Create a simple 3-item daily checklist for the next 5 days',
        choice: 'Decide what those 3 items will be',
      },
      heavy: {
        focus: 'Structure recovery',
        constraint: 'Set one non-negotiable start time for your day, and protect it for the next week',
        choice: 'Choose the time and one thing you\'ll do at that time consistently',
      },
      critical: {
        focus: 'Immediate load reduction',
        constraint: 'Identify one recurring commitment or task you can pause or defer for the next 7 days',
        choice: 'Decide which one, and communicate the pause clearly to anyone affected',
      },
    },
    initiation: {
      aligned: {
        focus: 'Initiation maintenance',
        constraint: 'Keep your current approach to starting tasks',
        choice: 'Continue what\'s working',
      },
      mild: {
        focus: 'Initiation support',
        constraint: 'For one task each day, commit to just 5 minutes of starting it',
        choice: 'Choose which task each day',
      },
      moderate: {
        focus: 'Initiation practice',
        constraint: 'Pick one recurring task and start it at the same time each day for the next 5 days',
        choice: 'Select the task and time',
      },
      heavy: {
        focus: 'Initiation recovery',
        constraint: 'Reduce one task\'s scope by 50% this week to make starting easier',
        choice: 'Choose which task and how you\'ll scale it back',
      },
      critical: {
        focus: 'Immediate load reduction',
        constraint: 'Identify one recurring commitment or task you can pause or defer for the next 7 days',
        choice: 'Decide which one, and communicate the pause clearly to anyone affected',
      },
    },
    engagement: {
      aligned: {
        focus: 'Engagement maintenance',
        constraint: 'Continue your current approach to staying engaged',
        choice: 'Keep doing what works',
      },
      mild: {
        focus: 'Engagement support',
        constraint: 'For one task this week, commit to completing it in smaller chunks',
        choice: 'Choose the task and how you\'ll break it down',
      },
      moderate: {
        focus: 'Engagement practice',
        constraint: 'Pick one task and set a 25-minute focused session to work on it',
        choice: 'Select the task and when you\'ll do it',
      },
      heavy: {
        focus: 'Engagement recovery',
        constraint: 'Reduce expectations on one task by 50% to make follow-through achievable',
        choice: 'Choose which task and how you\'ll adjust expectations',
      },
      critical: {
        focus: 'Immediate load reduction',
        constraint: 'Identify one recurring commitment or task you can pause or defer for the next 7 days',
        choice: 'Decide which one, and communicate the pause clearly to anyone affected',
      },
    },
    sustainability: {
      aligned: {
        focus: 'Sustainability maintenance',
        constraint: 'Continue your current pace',
        choice: 'Keep what\'s working',
      },
      mild: {
        focus: 'Sustainability support',
        constraint: 'Reduce effort on one activity by 20% this week',
        choice: 'Choose which activity and how you\'ll scale back',
      },
      moderate: {
        focus: 'Sustainability practice',
        constraint: 'Identify one area where you\'re overextending and reduce it by 30% for the next 5 days',
        choice: 'Select the area and how you\'ll adjust',
      },
      heavy: {
        focus: 'Sustainability recovery',
        constraint: 'Remove one source of ongoing effort for the next 7 days',
        choice: 'Choose which one and communicate the pause',
      },
      critical: {
        focus: 'Immediate load reduction',
        constraint: 'Identify one recurring commitment or task you can pause or defer for the next 7 days',
        choice: 'Decide which one, and communicate the pause clearly to anyone affected',
      },
    },
  };

  const baseTip = tipMap[weakestDimension][category];

  // If no feedback history, return base tip
  if (!feedbackHistory || feedbackHistory.length === 0) {
    return baseTip;
  }

  // Calculate score for this tip
  const score = calculateTipScore(weakestDimension, category, feedbackHistory);

  // If score is negative (not relevant feedback), try to find alternative
  // For now, we return the base tip but could expand to have alternatives
  if (score < -0.5) {
    // Strong negative feedback - still return tip but could be enhanced with alternatives
    return baseTip;
  }

  return baseTip;
}

/**
 * Get personalized tip with feedback history consideration
 * This is the main function to use when feedback history is available
 */
export function getPersonalizedTip(
  weakestDimension: DimensionName,
  category: DriftCategory,
  feedbackHistory: TipFeedbackHistory[]
): Tip {
  return getTip(weakestDimension, category, feedbackHistory);
}

const DIMENSION_LABELS: Record<DimensionName, string> = {
  energy: 'Energy',
  sleep: 'Sleep consistency',
  structure: 'Daily structure',
  initiation: 'Task initiation',
  engagement: 'Engagement / follow-through',
  sustainability: 'Effort sustainability',
};

/**
 * Get adaptive tip message if user has repeatedly struggled with the same dimension
 * Returns acknowledgment message if dimension appears 2+ times in last 3-5 check-ins
 */
export function getAdaptiveTipMessage(
  weakestDimension: DimensionName,
  recentWeakestDimensions: DimensionName[]
): string | null {
  if (recentWeakestDimensions.length === 0) {
    return null;
  }

  // Count occurrences of current weakest dimension in recent check-ins
  const occurrenceCount = recentWeakestDimensions.filter((dim) => dim === weakestDimension).length;

  // If appears 2+ times, generate acknowledgment message
  if (occurrenceCount >= 2) {
    const dimensionLabel = DIMENSION_LABELS[weakestDimension];
    return `Since ${dimensionLabel.toLowerCase()} has been your weakest dimension recently, consider focusing on it.`;
  }

  return null;
}
