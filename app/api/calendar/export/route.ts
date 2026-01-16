import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/utils';
import { NextResponse } from 'next/server';
import { generateCheckinReminderICS, generateICSFilename } from '@/lib/ics';

export async function GET() {
  try {
    const supabase = createClient();
    
    // Authenticate user
    const { user, error: authError } = await requireAuth(supabase);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user preferences
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('preferred_checkin_day, preferred_checkin_time')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('Error fetching user preferences:', userError);
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
    }

    // Validate preferences
    if (!userData.preferred_checkin_day || !userData.preferred_checkin_time) {
      return NextResponse.json(
        { error: 'Please set your preferred check-in day and time in settings first' },
        { status: 400 }
      );
    }

    // Generate ICS file
    const icsContent = generateCheckinReminderICS(
      userData.preferred_checkin_day,
      userData.preferred_checkin_time
    );

    // Return ICS file with proper headers
    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${generateICSFilename()}"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating calendar file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
