/**
 * Generate continuity messages to connect current check-in with previous one
 * Tone: Neutral, factual, one sentence max
 */

export function generateContinuityMessage(
  currentScore: number,
  previousScore: number | null,
  delta: number | null
): string | null {
  // No previous check-in - no continuity message
  if (previousScore === null || delta === null) {
    return null;
  }

  const absDelta = Math.abs(delta);
  
  // Very stable (within 3 points)
  if (absDelta <= 3) {
    return "Similar to last week.";
  }

  // Improvement (score decreased)
  if (delta < 0) {
    if (absDelta <= 8) {
      return "Slight improvement from last week.";
    } else if (absDelta <= 15) {
      return "Noticeable improvement from last week.";
    } else {
      return "Significant improvement from last week.";
    }
  }

  // Drift increased (score increased)
  if (delta > 0) {
    if (absDelta <= 8) {
      return "Drift increased slightly.";
    } else if (absDelta <= 15) {
      return "Drift increased compared to last week.";
    } else {
      return "Drift increased significantly.";
    }
  }

  return "Similar to last week.";
}
