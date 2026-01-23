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
    const { preferredCheckinDay, preferredCheckinTime } = body;

    // Validate inputs (optional - user can skip)
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    if (preferredCheckinDay && !validDays.includes(preferredCheckinDay)) {
      return NextResponse.json({ error: 'Invalid day' }, { status: 400 });
    }

    // Update user preferences (same as settings endpoint)
    const updateData: any = {};
    if (preferredCheckinDay) {
      updateData.preferred_checkin_day = preferredCheckinDay;
    }
    if (preferredCheckinTime) {
      updateData.preferred_checkin_time = preferredCheckinTime;
    }

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) {
        console.error('Error saving lock-in:', updateError);
        return NextResponse.json({ error: 'Failed to save commitment' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving lock-in:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
