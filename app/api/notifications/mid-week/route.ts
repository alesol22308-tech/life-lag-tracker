import { createClient } from '@/lib/supabase/server';
import { sendMidWeekCheckEmail } from '@/lib/email';
import { sendMidWeekCheckPush } from '@/lib/push';
import { NextResponse } from 'next/server';

// Mark as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

/**
 * Send mid-week check notifications to users who have checked in this week
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
    
    // Get all users with mid-week check enabled
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, email_reminder_enabled, push_notification_enabled, push_notification_token, mid_week_check_enabled')
      .eq('mid_week_check_enabled', true);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No users to notify' });
    }

    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
    
    let emailSentCount = 0;
    let pushSentCount = 0;
    let errorCount = 0;

    for (const user of users) {
      // Check if user has checked in this week (within last 4 days)
      const { data: lastCheckin } = await supabase
        .from('checkins')
        .select('created_at')
        .eq('user_id', user.id)
        .gte('created_at', fourDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Only send if user has checked in this week
      if (!lastCheckin) continue;

      // Check if notification was sent 3-4 days after check-in
      const checkinDate = new Date(lastCheckin.created_at);
      const daysSinceCheckin = (now.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24);
      
      // Send notification if 3-4 days have passed since check-in
      if (daysSinceCheckin < 3 || daysSinceCheckin > 4) continue;

      const emailReminderEnabled = user.email_reminder_enabled ?? false;
      const pushNotificationEnabled = user.push_notification_enabled ?? true;

      // Send email notification
      if (emailReminderEnabled && user.email) {
        try {
          await sendMidWeekCheckEmail(user.email);
          emailSentCount++;
        } catch (error) {
          console.error(`Error sending mid-week email to ${user.email}:`, error);
          errorCount++;
        }
      }

      // Send push notification
      if (pushNotificationEnabled && user.push_notification_token) {
        try {
          await sendMidWeekCheckPush(user.push_notification_token);
          pushSentCount++;
        } catch (error: any) {
          console.error(`Error sending mid-week push to ${user.push_notification_token}:`, error);
          // Don't count push errors if service isn't configured
          if (!error?.message?.includes('not yet configured')) {
            errorCount++;
          }
        }
      }
    }

    return NextResponse.json({
      message: 'Mid-week notifications processed',
      emailsSent: emailSentCount,
      pushSent: pushSentCount,
      errors: errorCount,
    });
  } catch (error: any) {
    console.error('Error processing mid-week notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
