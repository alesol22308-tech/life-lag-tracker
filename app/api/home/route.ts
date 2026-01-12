import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/utils';
import { NextResponse } from 'next/server';
import { DashboardData, CheckinSummary } from '@/types';

export async function GET() {
  try {
    const supabase = createClient();
    
    const { user, error: authError } = await requireAuth(supabase);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all check-ins for the user, ordered by date descending
    const { data: checkins, error: checkinsError } = await supabase
      .from('checkins')
      .select('id, lag_score, drift_category, weakest_dimension, created_at, score_delta')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (checkinsError) {
      console.error('Error fetching check-ins:', checkinsError);
      return NextResponse.json({ error: 'Failed to fetch check-ins' }, { status: 500 });
    }

    // Fetch user streak info
    const { data: streakData, error: streakError } = await supabase
      .from('streaks')
      .select('current_streak, last_checkin_at')
      .eq('user_id', user.id)
      .single();

    const streakCount = streakData?.current_streak || 0;
    const lastCheckinAt = streakData?.last_checkin_at || null;

    // Transform check-ins to CheckinSummary format
    const checkinHistory: CheckinSummary[] = (checkins || []).map((checkin) => ({
      id: checkin.id,
      lagScore: checkin.lag_score,
      driftCategory: checkin.drift_category as any,
      weakestDimension: checkin.weakest_dimension,
      createdAt: checkin.created_at,
      scoreDelta: checkin.score_delta || undefined,
    }));

    // Latest check-in is the first one (since we ordered descending)
    const latestCheckin = checkinHistory.length > 0 ? checkinHistory[0] : null;

    // Fetch tip for latest check-in if it exists
    if (latestCheckin) {
      // We need to get the tip from the check-in's weakest dimension
      // For now, we'll just use the weakest dimension as the focus
      // In a full implementation, we might want to store the tip text in the checkin
      latestCheckin.focusText = latestCheckin.weakestDimension;
    }

    const dashboardData: DashboardData = {
      latestCheckin,
      checkinHistory,
      streakCount,
      lastCheckinAt,
    };

    return NextResponse.json(dashboardData);
  } catch (error: any) {
    console.error('Error in home API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
