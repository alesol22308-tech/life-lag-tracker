/**
 * Recovery recognition: Detect when user stabilizes after drift period
 * Shows message when score improves from ≥35 to <35
 */

export function detectRecovery(
  currentScore: number,
  previousScore: number | null
): boolean {
  if (previousScore === null) {
    return false;
  }

  // Recovery: improved from ≥35 (moderate+ drift) to <35 (aligned/mild)
  return previousScore >= 35 && currentScore < 35;
}

export function getRecoveryMessage(): string {
  return "You stabilized after a drift period.";
}
