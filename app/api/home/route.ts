import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/utils';
import { NextResponse } from 'next/server';
import { DashboardData, CheckinSummary, DimensionSummary, DimensionTrendData, Answers, DimensionName } from '@/types';

export async function GET() {
  try {
    const supabase = createClient();
    
    const { user, error: authError } = await requireAuth(supabase);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch check-ins for the user, ordered by date descending
    // Fetch up to 24 weeks (168 days) to support chart range customization
    const twentyFourWeeksAgo = new Date();
    twentyFourWeeksAgo.setDate(twentyFourWeeksAgo.getDate() - 168);
    
    // Fetch check-ins - try with optional columns first, fallback to base columns if they don't exist
    let checkins: any[] = [];
    let checkinsError: any = null;
    
    // First try with all columns (including optional ones from migrations and answers for dimension tracking)
    const { data: checkinsWithOptional, error: errorWithOptional } = await supabase
      .from('checkins')
      .select('id, lag_score, drift_category, weakest_dimension, created_at, score_delta, narrative_summary, answers, reflection_notes, micro_goal_completion_status')
      .eq('user_id', user.id)
      .gte('created_at', twentyFourWeeksAgo.toISOString())
      .order('created_at', { ascending: false });

    if (errorWithOptional) {
      // If error is about missing columns, try without optional columns
      if (errorWithOptional.message?.includes('column') || errorWithOptional.code === 'PGRST116') {
        console.log('Optional columns not available, fetching base columns only');
        const { data: checkinsBase, error: errorBase } = await supabase
          .from('checkins')
          .select('id, lag_score, drift_category, weakest_dimension, created_at, answers')
          .eq('user_id', user.id)
          .gte('created_at', twentyFourWeeksAgo.toISOString())
          .order('created_at', { ascending: false });
        
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
      reflectionNote: checkin.reflection_notes || undefined,
      microGoalCompletionStatus: checkin.micro_goal_completion_status || undefined,
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

    // Calculate dimension summaries
    const dimensionSummaries: DimensionSummary[] = [];
    const dimensions: DimensionName[] = ['energy', 'sleep', 'structure', 'initiation', 'engagement', 'sustainability'];
    
    if (checkins.length >= 2 && checkins[0]?.answers) {
      const latestAnswers = checkins[0].answers as Answers;
      const previousAnswers = checkins[1].answers as Answers;
      
      if (latestAnswers && previousAnswers) {
        for (const dimension of dimensions) {
          const currentValue = latestAnswers[dimension];
          const previousValue = previousAnswers[dimension];
          const trendValue = currentValue - previousValue;
          
          let trend: 'improved' | 'declined' | 'stable';
          if (trendValue > 0.2) {
            trend = 'improved';
          } else if (trendValue < -0.2) {
            trend = 'declined';
          } else {
            trend = 'stable';
          }
          
          dimensionSummaries.push({
            dimension,
            currentValue,
            trend,
            trendValue,
          });
        }
      }
    } else if (checkins.length === 1 && checkins[0]?.answers) {
      // If only one check-in, show current values with stable trend
      const latestAnswers = checkins[0].answers as Answers;
      if (latestAnswers) {
        for (const dimension of dimensions) {
          dimensionSummaries.push({
            dimension,
            currentValue: latestAnswers[dimension],
            trend: 'stable',
            trendValue: 0,
          });
        }
      }
    }

    // Calculate dimension trends (for charts)
    const dimensionTrends: DimensionTrendData[] = [];
    // Reverse check-ins to chronological order (oldest to newest)
    const sortedCheckins = [...checkins].reverse();
    
    if (sortedCheckins.length > 0) {
      for (const dimension of dimensions) {
        const values = sortedCheckins
          .filter(checkin => checkin.answers)
          .map(checkin => {
            const answers = checkin.answers as Answers;
            return {
              date: checkin.created_at,
              value: answers[dimension],
            };
          });
        
        if (values.length > 0) {
          dimensionTrends.push({
            dimension,
            values,
          });
        }
      }
    }

    const dashboardData: DashboardData = {
      latestCheckin,
      checkinHistory,
      streakCount,
      lastCheckinAt,
      dimensionSummaries: dimensionSummaries.length > 0 ? dimensionSummaries : undefined,
      dimensionTrends: dimensionTrends.length > 0 ? dimensionTrends : undefined,
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
