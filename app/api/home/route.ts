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

    // Fetch check-ins for the user, ordered by date descending
    // Limit to last 6 weeks (42 days) for homepage display
    const sixWeeksAgo = new Date();
    sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42);
    
    // Fetch check-ins - try with optional columns first, fallback to base columns if they don't exist
    let checkins: any[] = [];
    let checkinsError: any = null;
    
    // First try with all columns (including optional ones from migrations)
    const { data: checkinsWithOptional, error: errorWithOptional } = await supabase
      .from('checkins')
      .select('id, lag_score, drift_category, weakest_dimension, created_at, score_delta, narrative_summary')
      .eq('user_id', user.id)
      .gte('created_at', sixWeeksAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(6);

    if (errorWithOptional) {
      // If error is about missing columns, try without optional columns
      if (errorWithOptional.message?.includes('column') || errorWithOptional.code === 'PGRST116') {
        console.log('Optional columns not available, fetching base columns only');
        const { data: checkinsBase, error: errorBase } = await supabase
          .from('checkins')
          .select('id, lag_score, drift_category, weakest_dimension, created_at')
          .eq('user_id', user.id)
          .gte('created_at', sixWeeksAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(6);
        
        if (errorBase) {
          checkinsError = errorBase;
        } else {
          checkins = checkinsBase || [];
        }
      } else {
        checkinsError = errorWithOptional;
      }
    } else {
      checkins = checkinsWithOptional || [];
    }

    if (checkinsError) {
      console.error('Error fetching check-ins:', checkinsError);
      return NextResponse.json({ error: 'Failed to fetch check-ins' }, { status: 500 });
    }

    // Fetch user streak info (may not exist for new users)
    const { data: streakData, error: streakError } = await supabase
      .from('streaks')
      .select('current_streak, last_checkin_at')
      .eq('user_id', user.id)
      .maybeSingle(); // Use maybeSingle() instead of single() to handle missing records

    // If there's an error and it's not a "not found" error, log it
    if (streakError && streakError.code !== 'PGRST116') {
      console.error('Error fetching streak:', streakError);
    }

    const streakCount = streakData?.current_streak || 0;
    const lastCheckinAt = streakData?.last_checkin_at || null;

    // Transform check-ins to CheckinSummary format
    const checkinHistory: CheckinSummary[] = checkins.map((checkin) => ({
      id: checkin.id,
      lagScore: checkin.lag_score,
      driftCategory: checkin.drift_category as any,
      weakestDimension: checkin.weakest_dimension,
      createdAt: checkin.created_at,
      scoreDelta: checkin.score_delta || undefined,
      narrativeSummary: checkin.narrative_summary || undefined,
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
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    });
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 });
  }
}
