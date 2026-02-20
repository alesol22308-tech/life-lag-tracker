import { Resend } from 'resend';
import { CheckinResult } from '@/types';
import { getDimensionName, getDriftCategoryName, type Locale } from '@/lib/i18n';

let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

const FROM_EMAIL = process.env.FROM_EMAIL || 'Life-Lag <checkin@lifelag.app>';

/**
 * Send check-in result email
 * @param locale - Optional locale for dimension/category labels (defaults to 'en')
 */
export async function sendCheckinEmail(
  userEmail: string,
  result: CheckinResult,
  locale: Locale = 'en'
): Promise<void> {
  const categoryText = getDriftCategoryName(result.driftCategory, locale);
  const dimensionText = getDimensionName(result.weakestDimension, locale);

  const emailBody = `Your Weekly Check-in

Lag Score: ${result.lagScore}/100
Drift Category: ${categoryText}
${result.continuityMessage ? `${result.continuityMessage}\n` : ''}Focus Area: ${dimensionText}

Your Tip:

${result.tip.focus}

${result.tip.constraint}

${result.tip.choice}

---

This is a maintenance check-in, not a judgment. Use this information to tune your baseline.

Reply to this email if you want to acknowledge taking action—no pressure, just accountability if it helps.

Life-Lag
`;

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: `Your Life-Lag Check-in: ${categoryText}`,
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

Life-Lag
`;

  try {
    await getResend().emails.send({
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

/**
 * Send mid-week check email
 */
export async function sendMidWeekCheckEmail(userEmail: string): Promise<void> {
  const emailBody = `Mid-Week Check

How's your week feeling? Take a quick mid-week check to see where things stand.

Complete your check-in: ${process.env.NEXT_PUBLIC_APP_URL}/checkin

This is maintenance, not measurement. Keep tuning your baseline.

Life-Lag
`;

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: "How's your week feeling?",
      text: emailBody,
    });
  } catch (error) {
    console.error('Error sending mid-week check email:', error);
    throw error;
  }
}

/**
 * Send account deletion confirmation email (immediate)
 */
export async function sendAccountDeletionEmail(userEmail: string): Promise<void> {
  const emailBody = `Account Deletion Confirmation

Your Life-Lag account has been permanently deleted.

All your data, including:
- Check-ins and scores
- Reflection notes
- Account preferences
- Streak data and milestones

has been removed from our systems.

We're sorry to see you go. If you decide to come back in the future, you can always create a new account.

Life-Lag
`;

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: 'Your Life-Lag account has been deleted',
      text: emailBody,
    });
  } catch (error) {
    console.error('Error sending deletion confirmation email:', error);
    throw error;
  }
}

/**
 * Send scheduled deletion confirmation email (30-day grace period)
 */
export async function sendScheduledDeletionEmail(userEmail: string, scheduledDate: Date): Promise<void> {
  const formattedDate = scheduledDate.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const emailBody = `Account Deletion Scheduled

Your Life-Lag account is scheduled for deletion on ${formattedDate}.

You have 30 days to cancel this request if you change your mind.

To cancel the deletion:
1. Sign in to your account at ${process.env.NEXT_PUBLIC_APP_URL}/login
2. Go to Settings
3. Look for the "Cancel Deletion" option

If you don't cancel by ${formattedDate}, your account and all associated data will be permanently deleted, including:
- All check-ins and scores
- Reflection notes
- Account preferences
- Streak data and milestones

We're sorry to see you go, but we understand. If you have any feedback, feel free to reply to this email.

Life-Lag
`;

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: 'Your Life-Lag account deletion is scheduled',
      text: emailBody,
    });
  } catch (error) {
    console.error('Error sending scheduled deletion email:', error);
    throw error;
  }
}
