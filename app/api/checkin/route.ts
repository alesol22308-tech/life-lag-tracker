import { createClient } from '@/lib/supabase/server';
import { requireAuth, ensureUserProfile } from '@/lib/utils';
import { calculateLagScore, getDriftCategory, getWeakestDimension } from '@/lib/calculations';
import { getTip } from '@/lib/tips';
import { Answers, CheckinResult } from '@/types';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    
    // Authenticate user
    const { user, error: authError } = await requireAuth(supabase);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure user profile exists
    const profileError = await ensureUserProfile(supabase, user.id, user.email!);
    if (profileError.error) {
      return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 });
    }

    // Get request body
    const body = await request.json();
    const answers: Answers = body.answers;

    // Validate answers
    const requiredKeys: (keyof Answers)[] = ['energy', 'sleep', 'structure', 'initiation', 'engagement', 'sustainability'];
    for (const key of requiredKeys) {
      if (typeof answers[key] !== 'number' || answers[key] < 1 || answers[key] > 5) {
        return NextResponse.json({ error: `Invalid answer for ${key}` }, { status: 400 });
      }
    }

    // Calculate results
    const lagScore = calculateLagScore(answers);
    const driftCategory = getDriftCategory(lagScore);
    const weakestDimension = getWeakestDimension(answers);
    const tip = getTip(weakestDimension, driftCategory);

    // Save to database
    const { error: insertError } = await supabase
      .from('checkins')
      .insert({
        user_id: user.id,
        answers,
        lag_score: lagScore,
        drift_category: driftCategory,
        weakest_dimension: weakestDimension,
      });

    if (insertError) {
      console.error('Error saving check-in:', insertError);
      return NextResponse.json({ error: 'Failed to save check-in' }, { status: 500 });
    }

    // Update streak
    const { data: streakData } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const now = new Date();
    const lastCheckinAt = streakData?.last_checkin_at ? new Date(streakData.last_checkin_at) : null;
    
    let newStreak = 1;
    if (lastCheckinAt) {
      const daysDiff = (now.getTime() - lastCheckinAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff <= 7) {
        newStreak = (streakData.current_streak || 0) + 1;
      }
    }

    const { error: streakError } = await supabase
      .from('streaks')
      .upsert({
        user_id: user.id,
        current_streak: newStreak,
        last_checkin_at: now.toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (streakError) {
      console.error('Error updating streak:', streakError);
      // Don't fail the request if streak update fails
    }

    const result: CheckinResult = {
      lagScore,
      driftCategory,
      weakestDimension,
      tip,
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error processing check-in:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
