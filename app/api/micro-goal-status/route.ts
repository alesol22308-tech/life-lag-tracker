import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/utils';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Get micro-goal status for a check-in
 * GET /api/micro-goal-status?checkinId=xxx
 * If no checkinId, returns status for latest check-in
 */
export async function GET(request: Request) {
  try {
    const supabase = createClient();
    
    const { user, error: authError } = await requireAuth(supabase);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const checkinId = searchParams.get('checkinId');

    let targetCheckinId: string | null = null;

    if (checkinId) {
      // Verify the check-in belongs to the user
      const { data: checkin } = await supabase
        .from('checkins')
        .select('id')
        .eq('id', checkinId)
        .eq('user_id', user.id)
        .single();

      if (checkin) {
        targetCheckinId = checkinId;
      }
    } else {
      // Get latest check-in
      const { data: latestCheckin } = await supabase
        .from('checkins')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (latestCheckin) {
        targetCheckinId = latestCheckin.id;
      }
    }

    if (!targetCheckinId) {
      return NextResponse.json({ status: null });
    }

    // Get status for this check-in
    const { data: status, error: statusError } = await supabase
      .from('micro_goal_status')
      .select('status, updated_at')
      .eq('user_id', user.id)
      .eq('checkin_id', targetCheckinId)
      .single();

    if (statusError && statusError.code !== 'PGRST116') {
      console.error('Error fetching status:', statusError);
      return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
    }

    return NextResponse.json({ 
      status: status?.status || 'not_started',
      updatedAt: status?.updated_at || null
    });
  } catch (error: any) {
    console.error('Error in micro-goal-status GET:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 });
  }
}

/**
 * Upsert micro-goal status for a check-in
 * POST /api/micro-goal-status
 * Body: { checkinId: string, status: 'not_started' | 'in_progress' | 'completed' | 'skipped' }
 */
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    
    const { user, error: authError } = await requireAuth(supabase);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { checkinId, status } = body;

    if (!checkinId || typeof checkinId !== 'string') {
      return NextResponse.json({ error: 'checkinId is required' }, { status: 400 });
    }

    if (!status || !['not_started', 'in_progress', 'completed', 'skipped'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
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

    // Upsert the status
    const { error: upsertError } = await supabase
      .from('micro_goal_status')
      .upsert({
        user_id: user.id,
        checkin_id: checkinId,
        status,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,checkin_id'
      });

    if (upsertError) {
      console.error('Error upserting status:', upsertError);
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }

    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    console.error('Error in micro-goal-status POST:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 });
  }
}
