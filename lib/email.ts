import { Resend } from 'resend';
import { CheckinResult } from '@/types';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || 'Life Lag <checkin@lifelag.app>';

/**
 * Format drift category for display
 */
function formatCategory(category: string): string {
  const categoryMap: Record<string, string> = {
    aligned: 'Aligned',
    mild: 'Mild Drift',
    moderate: 'Moderate Drift',
    heavy: 'Heavy Drift',
    critical: 'Critical Drift',
  };
  return categoryMap[category] || category;
}

/**
 * Format dimension name for display
 */
function formatDimension(dimension: string): string {
  const dimensionMap: Record<string, string> = {
    energy: 'Energy',
    sleep: 'Sleep consistency',
    structure: 'Daily structure',
    initiation: 'Task initiation',
    engagement: 'Engagement / follow-through',
    sustainability: 'Effort sustainability',
  };
  return dimensionMap[dimension] || dimension;
}

/**
 * Send check-in result email
 */
export async function sendCheckinEmail(userEmail: string, result: CheckinResult): Promise<void> {
  const categoryText = formatCategory(result.driftCategory);
  const dimensionText = formatDimension(result.weakestDimension);

  const emailBody = `Your Weekly Check-in

Lag Score: ${result.lagScore}/100
Drift Category: ${categoryText}
Focus Area: ${dimensionText}

Your Tip:

${result.tip.focus}

${result.tip.constraint}

${result.tip.choice}

---

This is a maintenance check-in, not a judgment. Use this information to tune your baseline.

Reply to this email if you want to acknowledge taking action—no pressure, just accountability if it helps.

Life Lag
`;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: `Your Life Lag Check-in: ${categoryText}`,
      text: emailBody,
    });
  } catch (error) {
    console.error('Error sending check-in email:', error);
    throw error;
  }
}

/**
 * Send weekly reminder email
 */
export async function sendReminderEmail(userEmail: string): Promise<void> {
  const emailBody = `Weekly Check-in Reminder

It's been a week since your last check-in. Take 3 minutes to see where things stand.

Complete your check-in: ${process.env.NEXT_PUBLIC_APP_URL}/checkin

This is maintenance, not measurement. Keep tuning your baseline.

Life Lag
`;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: 'Time for your weekly check-in',
      text: emailBody,
    });
  } catch (error) {
    console.error('Error sending reminder email:', error);
    throw error;
  }
}
