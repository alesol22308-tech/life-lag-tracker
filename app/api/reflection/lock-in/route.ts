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

    // Validate inputs (optional - user can skip; allow null to clear)
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    if (preferredCheckinDay != null && preferredCheckinDay !== '' && !validDays.includes(preferredCheckinDay)) {
      return NextResponse.json({ error: 'Invalid day' }, { status: 400 });
    }

    // Update user preferences (align with settings: support clearing via null)
    const updateData: Record<string, unknown> = {};
    if (preferredCheckinDay !== undefined) {
      updateData.preferred_checkin_day = preferredCheckinDay ?? null;
    }
    if (preferredCheckinTime !== undefined) {
      updateData.preferred_checkin_time = preferredCheckinTime ?? null;
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
  } catch (error: unknown) {
    console.error('Error saving lock-in:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
