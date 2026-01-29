import { QuickPulseResponse, MicroAdjustment, DimensionName } from '@/types';

/**
 * Get a micro-adjustment suggestion based on Quick Pulse response
 * Maps response + context to actionable suggestion
 */
export function getMicroAdjustment(
  response: QuickPulseResponse,
  weakestDimension: DimensionName,
  currentScore: number
): MicroAdjustment {
  // Response: "good" - Keep it up, no action needed
  if (response === 'good') {
    return {
      message: "Great! Keep the momentum going.",
    };
  }

  // Response: "adjusting" - Gentle suggestion with optional action
  if (response === 'adjusting') {
    const adjustingSuggestions: Record<DimensionName, MicroAdjustment> = {
      energy: {
        message: "Protect tomorrow morning—no early commitments.",
        actionLabel: "View settings",
        actionLink: "/settings"
      },
      sleep: {
        message: "Set a sleep boundary tonight and honor it.",
        actionLabel: "View settings",
        actionLink: "/settings"
      },
      structure: {
        message: "Pick one anchor point for tomorrow (breakfast, walk, etc).",
      },
      initiation: {
        message: "Lower the bar on one task today—just start, don't finish.",
      },
      engagement: {
        message: "Shrink one task to 10 minutes only.",
      },
      sustainability: {
        message: "Drop one thing this week—not reschedule, actually drop.",
      }
    };

    return adjustingSuggestions[weakestDimension];
  }

  // Response: "struggling" - More direct intervention with action
  if (response === 'struggling') {
    const strugglingBase: Record<DimensionName, MicroAdjustment> = {
      energy: {
        message: "Cancel one thing today. Seriously.",
      },
      sleep: {
        message: "Reset tonight: No screens after 9pm, nothing urgent matters.",
      },
      structure: {
        message: "Tomorrow: Same wake time, same first action. Nothing else.",
      },
      initiation: {
        message: "Lower one expectation right now—make it stupidly easy.",
      },
      engagement: {
        message: "Cut this week's to-do list in half. Pick what stays.",
      },
      sustainability: {
        message: "This pace isn't sustainable. What are you protecting?",
      }
    };

    return strugglingBase[weakestDimension];
  }

  // Fallback
  return {
    message: "Take it one step at a time.",
  };
}

/**
 * Check if we're currently in mid-week window (2-5 days after last check-in)
 * This is when Quick Pulse should be shown to check in on progress
 */
export function isMiddleOfWeek(lastCheckinDate: Date | string | null | undefined): boolean {
  // Handle null/undefined input
  if (!lastCheckinDate) {
    return false;
  }

  try {
    // Parse the date if it's a string
    const checkinDate = typeof lastCheckinDate === 'string' 
      ? new Date(lastCheckinDate) 
      : lastCheckinDate;
    
    // Validate the date
    if (isNaN(checkinDate.getTime())) {
      console.warn('Invalid date passed to isMiddleOfWeek:', lastCheckinDate);
      return false;
    }

    const now = new Date();
    
    // Calculate the difference in milliseconds, then convert to days
    const diffMs = now.getTime() - checkinDate.getTime();
    
    // Handle edge case where checkin date is in the future (shouldn't happen but let's be safe)
    if (diffMs < 0) {
      return false;
    }
    
    // Calculate days since check-in (use floor to get complete days)
    const daysSinceCheckin = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // Show Quick Pulse 2-5 days after last check-in (mid-week window)
    return daysSinceCheckin >= 2 && daysSinceCheckin <= 5;
  } catch (error) {
    console.error('Error in isMiddleOfWeek:', error);
    return false;
  }
}

/**
 * Check if Quick Pulse was dismissed this week
 * Uses localStorage to persist dismissal across browser sessions
 */
export function wasQuickPulseDismissedThisWeek(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  try {
    const dismissedAt = localStorage.getItem('quickPulseDismissed');
    if (!dismissedAt) {
      return false;
    }

    const dismissedDate = new Date(dismissedAt);
    
    // Validate the date
    if (isNaN(dismissedDate.getTime())) {
      // Invalid date stored, clear it and return false
      localStorage.removeItem('quickPulseDismissed');
      return false;
    }
    
    const now = new Date();
    const daysSinceDismissed = Math.floor((now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Consider dismissed for 7 days
    if (daysSinceDismissed >= 7) {
      // Clear old dismissal
      localStorage.removeItem('quickPulseDismissed');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in wasQuickPulseDismissedThisWeek:', error);
    return false;
  }
}

/**
 * Mark Quick Pulse as dismissed
 */
export function dismissQuickPulse(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem('quickPulseDismissed', new Date().toISOString());
    } catch (error) {
      console.error('Error dismissing Quick Pulse:', error);
    }
  }
}
