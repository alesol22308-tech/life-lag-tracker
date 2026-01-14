import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/utils';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    
    // Authenticate user
    const { user, error: authError } = await requireAuth(supabase);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { 
      preferredCheckinDay, 
      preferredCheckinTime,
      emailReminderEnabled,
      smsReminderEnabled,
      smsPhoneNumber,
      pushNotificationEnabled,
      midWeekCheckEnabled,
      darkModeEnabled
    } = body;

    // Validate inputs
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    if (preferredCheckinDay && !validDays.includes(preferredCheckinDay)) {
      return NextResponse.json({ error: 'Invalid day' }, { status: 400 });
    }

    // Validate phone number format if SMS is enabled
    if (smsReminderEnabled && smsPhoneNumber) {
      // Basic phone validation: digits, spaces, dashes, parentheses, plus sign
      const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
      if (!phoneRegex.test(smsPhoneNumber.replace(/\s/g, ''))) {
        return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
      }
    }

    // Update user preferences
    const updateData: any = {};
    if (preferredCheckinDay !== undefined) {
      updateData.preferred_checkin_day = preferredCheckinDay || null;
    }
    if (preferredCheckinTime !== undefined) {
      updateData.preferred_checkin_time = preferredCheckinTime || null;
    }
    if (emailReminderEnabled !== undefined) {
      updateData.email_reminder_enabled = emailReminderEnabled;
    }
    if (smsReminderEnabled !== undefined) {
      updateData.sms_reminder_enabled = smsReminderEnabled;
    }
    if (smsPhoneNumber !== undefined) {
      updateData.sms_phone_number = smsPhoneNumber || null;
    }
    if (pushNotificationEnabled !== undefined) {
      updateData.push_notification_enabled = pushNotificationEnabled;
    }
    if (midWeekCheckEnabled !== undefined) {
      updateData.mid_week_check_enabled = midWeekCheckEnabled;
    }
    if (darkModeEnabled !== undefined) {
      updateData.dark_mode_enabled = darkModeEnabled;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: true });
    }

    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating preferences:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update preferences',
        details: updateError.message || String(updateError),
        code: updateError.code,
        hint: updateError.hint
      }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
