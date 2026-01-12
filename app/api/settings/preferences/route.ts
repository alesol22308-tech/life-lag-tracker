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
    const { preferredCheckinDay, preferredCheckinTime } = body;

    // Validate inputs
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    if (preferredCheckinDay && !validDays.includes(preferredCheckinDay)) {
      return NextResponse.json({ error: 'Invalid day' }, { status: 400 });
    }

    // Update user preferences
    const updateData: any = {};
    if (preferredCheckinDay !== undefined) {
      updateData.preferred_checkin_day = preferredCheckinDay || null;
    }
    if (preferredCheckinTime !== undefined) {
      updateData.preferred_checkin_time = preferredCheckinTime || null;
    }

    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating preferences:', updateError);
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
