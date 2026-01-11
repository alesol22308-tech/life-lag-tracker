import { createClient } from '@/lib/supabase/server';
import { sendReminderEmail } from '@/lib/email';
import { NextResponse } from 'next/server';

/**
 * Send reminder emails to users who haven't checked in for 7+ days
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
    
    // Get all users with reminder_enabled = true
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .eq('reminder_enabled', true);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No users to notify' });
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    let sentCount = 0;
    let errorCount = 0;

    for (const user of users) {
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

      if (shouldSendReminder && user.email) {
        try {
          await sendReminderEmail(user.email);
          sentCount++;
        } catch (error) {
          console.error(`Error sending reminder to ${user.email}:`, error);
          errorCount++;
        }
      }
    }

    return NextResponse.json({
      message: 'Reminder emails processed',
      sent: sentCount,
      errors: errorCount,
    });
  } catch (error: any) {
    console.error('Error processing reminders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
