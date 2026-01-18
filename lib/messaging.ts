import { DriftCategory } from '@/types';

/**
 * Context for message selection
 */
export interface MessageContext {
  checkinCount?: number;
  streakCount?: number;
  recentTrend?: 'improving' | 'declining' | 'stable';
  previousMessage?: string;
}

/**
 * Expanded reassurance message pool
 * Tone: Neutral, supportive, adult, one sentence
 */
const MESSAGE_POOL: Record<DriftCategory, string[]> = {
  aligned: [
    "You're maintaining well.",
    "You're in a good rhythm.",
    "Keep doing what's working.",
    "Your consistency is paying off.",
    "You're on track.",
    "This is sustainable.",
    "You've found your balance.",
    "You're managing well.",
    "Your approach is working.",
    "You're maintaining your baseline.",
    "This is steady progress.",
    "You're holding steady.",
    "Your routine is serving you.",
    "You're in a good place.",
    "This is maintenance, not measurement.",
    "You're doing the work.",
    "Your awareness is building.",
    "You're staying present to your needs.",
    "This is how maintenance looks.",
    "You're keeping things manageable.",
  ],
  mild: [
    "Small adjustments help.",
    "Minor shifts make a difference.",
    "Tiny changes compound.",
    "Small tweaks are enough.",
    "Little adjustments matter.",
    "Subtle shifts can help.",
    "Minor course corrections work.",
    "Small steps forward count.",
    "Tiny improvements add up.",
    "Little changes are meaningful.",
    "Small shifts compound over time.",
    "Minor adjustments are sufficient.",
    "Tiny tweaks can help.",
    "Small changes make a difference.",
    "Little shifts are enough.",
    "Minor modifications help.",
    "Small adjustments compound.",
    "Tiny changes matter.",
    "Little tweaks can help.",
    "Small shifts are meaningful.",
  ],
  moderate: [
    "This is a normal part of maintenance.",
    "Maintenance includes ups and downs.",
    "This is expected in the process.",
    "Variation is normal.",
    "This is part of the journey.",
    "Maintenance isn't linear.",
    "This is how it goes sometimes.",
    "Variation is part of the process.",
    "This is normal maintenance.",
    "Ups and downs are expected.",
    "This is part of staying aware.",
    "Maintenance includes fluctuations.",
    "This is normal in tracking.",
    "Variation is part of maintenance.",
    "This is expected variation.",
    "Maintenance has natural variation.",
    "This is part of the work.",
    "Ups and downs are normal.",
    "This is typical maintenance.",
    "Variation is expected.",
  ],
  heavy: [
    "Focus on one thing. That's enough.",
    "One change at a time is enough.",
    "Pick one thing. That's sufficient.",
    "Start with the smallest step.",
    "Simplify where you can.",
    "Less is more right now.",
    "Do the minimum viable thing.",
    "Rest counts as progress.",
    "Protect your energy today.",
    "You don't need to fix everything.",
    "Choose the path of least resistance.",
    "Basics first. Everything else can wait.",
    "Lower the bar temporarily.",
    "Good enough is good enough.",
    "Reduce your expectations for now.",
    "One foot in front of the other.",
    "Just the next step. Nothing more.",
    "Prioritize ruthlessly.",
    "Let go of what's not essential.",
    "This is a time for simplicity.",
  ],
  critical: [
    "Be gentle with yourself right now.",
    "This is data, not judgment.",
    "You showed up. That matters.",
    "Just notice. No fixing required today.",
    "Survival mode is valid.",
    "Take care of yourself first.",
    "This too is information.",
    "You're still here. That counts.",
    "Permission to do less granted.",
    "Self-compassion is the priority.",
    "This is temporary.",
    "Rest is productive right now.",
    "You don't have to solve this today.",
    "One breath at a time.",
    "Acknowledge where you are.",
    "This is awareness, not failure.",
    "Your wellbeing comes first.",
    "Showing up is the whole task.",
    "There's no wrong way to get through this.",
    "Just today. Just this moment.",
  ],
};

/**
 * Context-specific message pools
 */
const CONTEXT_MESSAGES: {
  week1: string[];
  week20Plus: string[];
  highStreak: string[];
  decliningTrend: string[];
} = {
  week1: [
    "You're building awareness. That's the first step.",
    "You're starting to notice patterns. That matters.",
    "Awareness is the foundation.",
    "You're learning what works for you.",
    "This is how you build the habit.",
  ],
  week20Plus: [
    "You've been tracking for a while. Patterns matter.",
    "Your data is telling a story.",
    "Long-term patterns are emerging.",
    "You're seeing the bigger picture now.",
    "Your consistency is building insights.",
  ],
  highStreak: [
    "Your consistency is paying off.",
    "You're building momentum.",
    "Your routine is becoming automatic.",
    "You're making this a habit.",
    "Your consistency is the work.",
  ],
  decliningTrend: [
    "Small shifts compound over time.",
    "Early detection helps.",
    "Noticing the shift is the first step.",
    "Awareness allows for adjustment.",
    "Catching drift early matters.",
  ],
};

/**
 * Get reassurance message based on drift category and context
 */
export function getReassuranceMessage(
  driftCategory: DriftCategory,
  context?: MessageContext
): string {
  const pool = MESSAGE_POOL[driftCategory];
  let availableMessages = [...pool];

  // Apply context-specific messages if applicable
  if (context) {
    if (context.checkinCount === 1) {
      // First check-in - use week1 messages
      availableMessages = [...CONTEXT_MESSAGES.week1, ...pool];
    } else if (context.checkinCount && context.checkinCount >= 20) {
      // Week 20+ - add week20Plus messages
      availableMessages = [...CONTEXT_MESSAGES.week20Plus, ...pool];
    }

    if (context.streakCount && context.streakCount >= 5) {
      // High streak - add highStreak messages
      availableMessages = [...CONTEXT_MESSAGES.highStreak, ...availableMessages];
    }

    if (context.recentTrend === 'declining') {
      // Declining trend - add decliningTrend messages
      availableMessages = [...CONTEXT_MESSAGES.decliningTrend, ...availableMessages];
    }

    // Avoid repetition - remove previous message if it exists
    if (context.previousMessage) {
      availableMessages = availableMessages.filter(msg => msg !== context.previousMessage);
    }
  }

  // If no messages available (shouldn't happen), return default
  if (availableMessages.length === 0) {
    return pool[0];
  }

  // Weighted random selection (prefer messages that haven't been shown recently)
  // For now, use simple random selection
  const randomIndex = Math.floor(Math.random() * availableMessages.length);
  return availableMessages[randomIndex];
}
