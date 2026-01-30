import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/utils';
import { NextResponse } from 'next/server';

// Mark as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

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
      autoAdvanceEnabled,
      fontSizePreference,
      highContrastMode
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
    if (autoAdvanceEnabled !== undefined) {
      updateData.auto_advance_enabled = autoAdvanceEnabled;
    }
    if (fontSizePreference !== undefined) {
      const validSizes = ['default', 'large', 'extra-large'];
      if (!validSizes.includes(fontSizePreference)) {
        return NextResponse.json({ error: 'Invalid font size preference' }, { status: 400 });
      }
      updateData.font_size_preference = fontSizePreference;
    }
    if (highContrastMode !== undefined) {
      updateData.high_contrast_mode = highContrastMode;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: true });
    }

    // Try to update, but handle case where columns might not exist
    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating preferences:', updateError);
      
      // If error is about missing column, try updating without that column
      if (updateError.message?.includes('column') || updateError.code === '42703') {
        const missingColumn = updateError.message?.match(/column "([^"]+)"/)?.[1];
        console.warn(`Column ${missingColumn} may not exist. Trying to update without it.`);
        
        // Remove the problematic column and try again
        if (missingColumn && updateData[missingColumn]) {
          const { [missingColumn]: removed, ...remainingData } = updateData;
          if (Object.keys(remainingData).length > 0) {
            const { error: retryError } = await supabase
              .from('users')
              .update(remainingData)
              .eq('id', user.id);
            
            if (retryError) {
              return NextResponse.json({ 
                error: 'Failed to update preferences',
                details: retryError.message || String(retryError),
                code: retryError.code,
                hint: retryError.hint
              }, { status: 500 });
            }
            
            // Successfully updated other fields, but the missing column wasn't updated
            return NextResponse.json({ 
              success: true,
              warning: `Some preferences could not be saved (column ${missingColumn} does not exist)`
            });
          }
        }
      }
      
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
