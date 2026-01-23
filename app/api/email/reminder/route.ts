import { createClient } from '@/lib/supabase/server';
import { sendReminderEmail } from '@/lib/email';
import { sendReminderSMS } from '@/lib/sms';
import { sendWeeklyReminderPush } from '@/lib/push';
import { NextResponse } from 'next/server';

// Mark as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

/**
 * Send reminder emails and SMS to users who haven't checked in for 7+ days
 * This should be called by a cron job or scheduled task
 */
export async function POST(request: Request) {
  try {
    // Verify this is coming from a trusted source (e.g., cron secret)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();
    
    // Get all users with email, SMS, or push reminders enabled
    // Also check for legacy reminder_enabled field
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, email_reminder_enabled, sms_reminder_enabled, sms_phone_number, push_notification_enabled, push_notification_token, reminder_enabled, preferred_checkin_day, preferred_checkin_time')
      .or('email_reminder_enabled.eq.true,sms_reminder_enabled.eq.true,push_notification_enabled.eq.true,reminder_enabled.eq.true');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No users to notify' });
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    let emailSentCount = 0;
    let smsSentCount = 0;
    let pushSentCount = 0;
    let errorCount = 0;

    for (const user of users) {
      // Check if reminders should be sent based on preferred day/time
      const shouldSendBasedOnSchedule = checkReminderSchedule(
        user.preferred_checkin_day,
        user.preferred_checkin_time,
        now
      );

      // Check their last check-in
      const { data: lastCheckin } = await supabase
        .from('checkins')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const shouldSendReminder = !lastCheckin || 
        new Date(lastCheckin.created_at) < sevenDaysAgo;

      if (!shouldSendReminder) continue;

      // Determine which reminders are enabled (check both new and legacy fields)
      const emailReminderEnabled = user.email_reminder_enabled ?? user.reminder_enabled ?? false;
      const smsReminderEnabled = user.sms_reminder_enabled ?? false;
      const pushNotificationEnabled = user.push_notification_enabled ?? false;

      // Send email reminder
      if (emailReminderEnabled && user.email && shouldSendBasedOnSchedule) {
        try {
          await sendReminderEmail(user.email);
          emailSentCount++;
        } catch (error) {
          console.error(`Error sending email reminder to ${user.email}:`, error);
          errorCount++;
        }
      }

      // Send SMS reminder
      if (smsReminderEnabled && user.sms_phone_number && shouldSendBasedOnSchedule) {
        try {
          const message = "Weekly Check-in Reminder\n\nIt's been a week since your last check-in. Take 3 minutes to see where things stand.\n\nComplete your check-in: " + (process.env.NEXT_PUBLIC_APP_URL || '') + "/checkin";
          await sendReminderSMS(user.sms_phone_number, message);
          smsSentCount++;
        } catch (error: any) {
          console.error(`Error sending SMS reminder to ${user.sms_phone_number}:`, error);
          // Don't count SMS errors if service isn't configured
          if (!error?.message?.includes('not yet configured')) {
            errorCount++;
          }
        }
      }

      // Send push notification reminder
      if (pushNotificationEnabled && user.push_notification_token && shouldSendBasedOnSchedule) {
        try {
          await sendWeeklyReminderPush(user.push_notification_token);
          pushSentCount++;
        } catch (error: any) {
          console.error(`Error sending push reminder to ${user.push_notification_token}:`, error);
          // Don't count push errors if service isn't configured
          if (!error?.message?.includes('not yet configured')) {
            errorCount++;
          }
        }
      }
    }

    return NextResponse.json({
      message: 'Reminders processed',
      emailsSent: emailSentCount,
      smsSent: smsSentCount,
      pushSent: pushSentCount,
      errors: errorCount,
    });
  } catch (error: any) {
    console.error('Error processing reminders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Check if reminder should be sent based on preferred day and time
 * If day/time are not set, reminders are sent (backward compatibility)
 */
function checkReminderSchedule(
  preferredDay: string | null,
  preferredTime: string | null,
  now: Date
): boolean {
  // If no schedule is set, send reminders (backward compatibility)
  if (!preferredDay || !preferredTime) {
    return true;
  }

  // Get current day of week (0 = Sunday, 1 = Monday, etc.)
  const currentDay = now.getDay();
  const dayMap: Record<string, number> = {
    'Sunday': 0,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6,
  };

  const preferredDayNum = dayMap[preferredDay];
  if (preferredDayNum === undefined) {
    return true; // Invalid day, send anyway
  }

  // Check if today matches preferred day
  if (currentDay !== preferredDayNum) {
    return false;
  }

  // Check if current time matches preferred time (within 1 hour window)
  const [preferredHour, preferredMinute] = preferredTime.split(':').map(Number);
  const preferredTimeMinutes = preferredHour * 60 + preferredMinute;
  const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
  
  // Send if within 1 hour window (60 minutes)
  return Math.abs(currentTimeMinutes - preferredTimeMinutes) <= 60;
}
