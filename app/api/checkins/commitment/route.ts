import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/utils';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Update micro-goal commitment for a check-in
 * POST /api/checkins/commitment
 * Body: { checkinId: string, commitment: 'tomorrow' | 'later_this_week' | 'not_sure' }
 */
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    
    const { user, error: authError } = await requireAuth(supabase);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { checkinId, commitment } = body;

    if (!checkinId || typeof checkinId !== 'string') {
      return NextResponse.json({ error: 'checkinId is required' }, { status: 400 });
    }

    if (commitment && !['tomorrow', 'later_this_week', 'not_sure'].includes(commitment)) {
      return NextResponse.json({ error: 'Invalid commitment value' }, { status: 400 });
    }

    // Verify the check-in belongs to the user
    const { data: checkin, error: checkinError } = await supabase
      .from('checkins')
      .select('id, user_id')
      .eq('id', checkinId)
      .eq('user_id', user.id)
      .single();

    if (checkinError || !checkin) {
      return NextResponse.json({ error: 'Check-in not found' }, { status: 404 });
    }

    // Update the commitment
    const { error: updateError } = await supabase
      .from('checkins')
      .update({ micro_goal_commitment: commitment || null })
      .eq('id', checkinId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating commitment:', updateError);
      return NextResponse.json({ error: 'Failed to update commitment' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in commitment API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 });
  }
}
