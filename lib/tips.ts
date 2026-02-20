import { DriftCategory, DimensionName, Tip } from '@/types';
import { getDimensionName, type Locale } from '@/lib/i18n';

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
 * Count negative feedback instances for a dimension × category
 * Used to cycle through alternative tips
 */
function countNegativeFeedback(
  dimension: DimensionName,
  category: DriftCategory,
  feedbackHistory: TipFeedbackHistory[]
): number {
  return feedbackHistory.filter(
    f => f.dimension === dimension && 
         f.category === category && 
         f.feedback === 'not_relevant'
  ).length;
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

  // Primary tips for each dimension × category combination
  const primaryTipMap: Record<DimensionName, Record<DriftCategory, Tip>> = {
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

  // Alternative tips when primary tip receives negative feedback
  // These offer different approaches for the same dimension × category
  const alternativeTipMap: Record<DimensionName, Record<DriftCategory, Tip[]>> = {
    energy: {
      aligned: [],
      mild: [
        {
          focus: 'Energy boundaries',
          constraint: 'Say no to one low-priority request this week',
          choice: 'Identify what type of requests you\'ll decline',
        },
        {
          focus: 'Energy awareness',
          constraint: 'Track your energy levels at 3 points each day for 5 days',
          choice: 'Choose morning, midday, and evening check-in times',
        },
      ],
      moderate: [
        {
          focus: 'Energy pacing',
          constraint: 'Alternate high-energy tasks with 15-minute breaks for 3 days',
          choice: 'Decide which tasks need breaks after them',
        },
        {
          focus: 'Energy simplification',
          constraint: 'Delegate or eliminate one recurring task this week',
          choice: 'Choose what to hand off or stop doing entirely',
        },
      ],
      heavy: [
        {
          focus: 'Energy triage',
          constraint: 'Cancel two commitments this week, not reschedule',
          choice: 'Pick which ones matter least right now',
        },
      ],
      critical: [],
    },
    sleep: {
      aligned: [],
      mild: [
        {
          focus: 'Sleep environment',
          constraint: 'Make your bedroom darker or cooler for the next 3 nights',
          choice: 'Decide on one environmental change to try',
        },
        {
          focus: 'Sleep wind-down',
          constraint: 'Start a 30-minute wind-down routine before bed for 3 nights',
          choice: 'Choose calming activities for your routine',
        },
      ],
      moderate: [
        {
          focus: 'Screen boundaries',
          constraint: 'No screens 1 hour before bed for the next 5 nights',
          choice: 'Decide what you\'ll do instead during that hour',
        },
        {
          focus: 'Sleep schedule',
          constraint: 'Wake up at the same time for 5 consecutive days, regardless of when you slept',
          choice: 'Choose your wake time and stick to it',
        },
      ],
      heavy: [
        {
          focus: 'Sleep-first week',
          constraint: 'Make sleep your top priority over everything else for 7 days',
          choice: 'Identify what you\'ll sacrifice for sleep this week',
        },
      ],
      critical: [],
    },
    structure: {
      aligned: [],
      mild: [
        {
          focus: 'Morning anchor',
          constraint: 'Do the same first activity within 30 minutes of waking for 5 days',
          choice: 'Pick your morning anchor activity',
        },
        {
          focus: 'Evening bookend',
          constraint: 'End work at the same time for 5 consecutive days',
          choice: 'Set your hard stop time',
        },
      ],
      moderate: [
        {
          focus: 'Time blocking',
          constraint: 'Block out 3 specific hours for your most important work each day',
          choice: 'Choose which hours to protect',
        },
        {
          focus: 'Weekly planning',
          constraint: 'Spend 15 minutes every Sunday planning your week\'s priorities',
          choice: 'Decide what time Sunday works best',
        },
      ],
      heavy: [
        {
          focus: 'Minimal structure',
          constraint: 'Focus on just 2 things today: one morning task, one afternoon task',
          choice: 'Pick your two most important things',
        },
      ],
      critical: [],
    },
    initiation: {
      aligned: [],
      mild: [
        {
          focus: 'Tiny starts',
          constraint: 'Make your first step ridiculously small: 2 minutes max',
          choice: 'Identify the 2-minute version of your hardest task',
        },
        {
          focus: 'Trigger pairing',
          constraint: 'Attach one difficult task to something you already do',
          choice: 'Choose your trigger activity and the task to pair',
        },
      ],
      moderate: [
        {
          focus: 'Preparation setup',
          constraint: 'Set up everything you need for tomorrow\'s first task tonight',
          choice: 'Decide what to prepare before bed',
        },
        {
          focus: 'Accountability check',
          constraint: 'Tell one person what you\'ll start tomorrow and when',
          choice: 'Choose who to tell and what task',
        },
      ],
      heavy: [
        {
          focus: 'Remove friction',
          constraint: 'Eliminate one barrier to starting your hardest task',
          choice: 'Identify what\'s blocking you and remove it',
        },
      ],
      critical: [],
    },
    engagement: {
      aligned: [],
      mild: [
        {
          focus: 'Focused sprints',
          constraint: 'Work in 15-minute focused bursts with 5-minute breaks',
          choice: 'Choose which task to sprint on',
        },
        {
          focus: 'Progress tracking',
          constraint: 'Mark visible progress on one task each day',
          choice: 'Pick how you\'ll track progress visually',
        },
      ],
      moderate: [
        {
          focus: 'Single-tasking',
          constraint: 'Close all tabs and apps except what you need for one task',
          choice: 'Choose one task to single-focus on today',
        },
        {
          focus: 'Completion milestone',
          constraint: 'Break one big task into 3 checkpoints and celebrate each',
          choice: 'Define your checkpoints and mini-rewards',
        },
      ],
      heavy: [
        {
          focus: 'Minimum viable',
          constraint: 'Redefine "done" for one task to be 50% of original scope',
          choice: 'Decide what "done enough" looks like',
        },
      ],
      critical: [],
    },
    sustainability: {
      aligned: [],
      mild: [
        {
          focus: 'Buffer time',
          constraint: 'Add 30 minutes of unscheduled time between meetings or tasks',
          choice: 'Choose where to add buffer in your day',
        },
        {
          focus: 'Weekly off-time',
          constraint: 'Block 2 hours this week for complete rest, no work allowed',
          choice: 'Pick when your rest hours will be',
        },
      ],
      moderate: [
        {
          focus: 'Capacity limit',
          constraint: 'Set a maximum of 3 important tasks per day this week',
          choice: 'Decide which tasks make the cut each morning',
        },
        {
          focus: 'Saying no practice',
          constraint: 'Decline or defer 2 requests this week without guilt',
          choice: 'Identify what requests to turn down',
        },
      ],
      heavy: [
        {
          focus: 'Recovery mode',
          constraint: 'Operate at 60% capacity this week, intentionally',
          choice: 'Decide what 60% looks like for you',
        },
      ],
      critical: [],
    },
  };

  const baseTip = primaryTipMap[weakestDimension][category];

  // If no feedback history, return base tip
  if (!feedbackHistory || feedbackHistory.length === 0) {
    return baseTip;
  }

  // Calculate score for this dimension × category
  const score = calculateTipScore(weakestDimension, category, feedbackHistory);

  // If score is negative (not relevant feedback), try to find alternative
  if (score < -0.5) {
    const alternatives = alternativeTipMap[weakestDimension][category];
    
    if (alternatives && alternatives.length > 0) {
      // Count how many times user gave negative feedback to cycle through alternatives
      const negativeCount = countNegativeFeedback(weakestDimension, category, feedbackHistory);
      
      // Use modulo to cycle through alternatives
      const alternativeIndex = (negativeCount - 1) % alternatives.length;
      return alternatives[alternativeIndex];
    }
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

/**
 * Get adaptive tip message if user has repeatedly struggled with the same dimension
 * Returns acknowledgment message if dimension appears 2+ times in last 3-5 check-ins
 * @param locale - Optional locale for the dimension label (defaults to 'en')
 */
export function getAdaptiveTipMessage(
  weakestDimension: DimensionName,
  recentWeakestDimensions: DimensionName[],
  locale: Locale = 'en'
): string | null {
  if (recentWeakestDimensions.length === 0) {
    return null;
  }

  // Count occurrences of current weakest dimension in recent check-ins
  const occurrenceCount = recentWeakestDimensions.filter((dim) => dim === weakestDimension).length;

  // If appears 2+ times, generate acknowledgment message
  if (occurrenceCount >= 2) {
    const dimensionLabel = getDimensionName(weakestDimension, locale);
    return `Since ${dimensionLabel.toLowerCase()} has been your weakest dimension recently, consider focusing on it.`;
  }

  return null;
}
