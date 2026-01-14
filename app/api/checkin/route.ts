import { createClient } from '@/lib/supabase/server';
import { requireAuth, ensureUserProfile } from '@/lib/utils';
import { calculateLagScore, getDriftCategory, getWeakestDimension } from '@/lib/calculations';
import { getTip, getAdaptiveTipMessage } from '@/lib/tips';
import { generateContinuityMessage } from '@/lib/continuity';
import { calculateSoftStreak } from '@/lib/streaks';
import { checkNewMilestones, formatMilestoneMessage } from '@/lib/milestones';
import { getReassuranceMessage } from '@/lib/messaging';
import { detectRecovery, getRecoveryMessage } from '@/lib/recovery';
import { Answers, CheckinResult, Milestone, DimensionName } from '@/types';
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
    const reassuranceMessage = getReassuranceMessage(driftCategory);

    // Fetch previous check-in for continuity
    const { data: previousCheckin } = await supabase
      .from('checkins')
      .select('lag_score')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const previousScore = previousCheckin?.lag_score || null;
    const scoreDelta = previousScore !== null ? lagScore - previousScore : null;
    const continuityMessage = generateContinuityMessage(lagScore, previousScore, scoreDelta);
    
    // Detect recovery (≥35 → <35)
    const isRecovery = detectRecovery(lagScore, previousScore);
    const recoveryMessage = isRecovery ? getRecoveryMessage() : undefined;

    // Get user data and streak data
    const { data: userData } = await supabase
      .from('users')
      .select('checkin_count, first_checkin_at')
      .eq('id', user.id)
      .maybeSingle(); // Use maybeSingle() to handle missing records

    const { data: streakData } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    const now = new Date();
    const lastCheckinAt = streakData?.last_checkin_at ? new Date(streakData.last_checkin_at) : null;
    const currentStreakCount = streakData?.current_streak || 0;

    // Calculate soft streak (score-based)
    const newStreakCount = calculateSoftStreak(lagScore, currentStreakCount, lastCheckinAt, now);

    // Update streak in database
    const { error: streakError } = await supabase
      .from('streaks')
      .upsert({
        user_id: user.id,
        current_streak: newStreakCount,
        last_checkin_at: now.toISOString(),
        streak_type: 'maintenance',
      }, {
        onConflict: 'user_id',
      });

    if (streakError) {
      console.error('Error updating streak:', streakError);
      // Don't fail the request if streak update fails
    }

    // Increment check-in count and track first check-in
    const newCheckinCount = (userData?.checkin_count || 0) + 1;
    const firstCheckinAt = userData?.first_checkin_at || now.toISOString();

    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        checkin_count: newCheckinCount,
        first_checkin_at: firstCheckinAt,
      })
      .eq('id', user.id);

    if (userUpdateError) {
      console.error('Error updating user count:', userUpdateError);
      // Don't fail the request if user update fails
    }

    // Fetch recent check-ins for milestone detection and adaptive tip
    const { data: recentCheckins } = await supabase
      .from('checkins')
      .select('lag_score, weakest_dimension')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    const recentScores = recentCheckins?.map(c => c.lag_score) || [];
    const recentWeakestDimensions: DimensionName[] = (recentCheckins || [])
      .map(c => c.weakest_dimension as DimensionName)
      .filter((dim): dim is DimensionName => typeof dim === 'string');

    // Get adaptive tip message if user has repeatedly struggled with same dimension
    const adaptiveTipMessage = getAdaptiveTipMessage(weakestDimension, recentWeakestDimensions);

    // Fetch existing milestones
    const { data: existingMilestonesData } = await supabase
      .from('milestones')
      .select('*')
      .eq('user_id', user.id);

    const existingMilestones: Milestone[] = (existingMilestonesData || []).map(m => ({
      id: m.id,
      milestoneType: m.milestone_type,
      milestoneValue: m.milestone_value,
      achievedAt: m.achieved_at,
    }));

    // Check for new milestones
    const newMilestones = checkNewMilestones(existingMilestones, newCheckinCount, newStreakCount, recentScores);

    // Save new milestones to database
    let milestoneToReturn: Milestone | undefined;
    if (newMilestones.length > 0) {
      // Only return the first new milestone
      const firstMilestone = newMilestones[0];
      const { data: insertedMilestone, error: milestoneError } = await supabase
        .from('milestones')
        .insert({
          user_id: user.id,
          milestone_type: firstMilestone.type,
          milestone_value: firstMilestone.value,
        })
        .select()
        .single();

      if (!milestoneError && insertedMilestone) {
        milestoneToReturn = {
          id: insertedMilestone.id,
          milestoneType: insertedMilestone.milestone_type,
          milestoneValue: insertedMilestone.milestone_value,
          achievedAt: insertedMilestone.achieved_at,
        };
      }
    }

    // Save check-in to database
    // Build insert data - start with required columns
    const checkinData: any = {
      user_id: user.id,
      answers,
      lag_score: lagScore,
      drift_category: driftCategory,
      weakest_dimension: weakestDimension,
    };

    let insertedCheckinId: string | null = null;

    // Try to insert with optional columns first (from migrations 002 and 003)
    const { data: insertedCheckin, error: insertError } = await supabase
      .from('checkins')
      .insert({
        ...checkinData,
        previous_score: previousScore,
        score_delta: scoreDelta,
        narrative_summary: continuityMessage || null,
      })
      .select('id')
      .single();

    if (insertError) {
      // If error is about missing columns, try without optional columns
      if (insertError.message?.includes('column') || insertError.code === '42703' || insertError.code === 'PGRST116') {
        console.log('Optional columns not available, inserting base columns only');
        const { data: baseInsertedCheckin, error: baseInsertError } = await supabase
          .from('checkins')
          .insert(checkinData)
          .select('id')
          .single();

        if (baseInsertError) {
          console.error('Error saving check-in (base columns):', baseInsertError);
          return NextResponse.json({ 
            error: 'Failed to save check-in',
            details: process.env.NODE_ENV === 'development' ? baseInsertError.message : undefined
          }, { status: 500 });
        }
        
        insertedCheckinId = baseInsertedCheckin?.id || null;
      } else {
        console.error('Error saving check-in:', insertError);
        return NextResponse.json({ 
          error: 'Failed to save check-in',
          details: process.env.NODE_ENV === 'development' ? insertError.message : undefined
        }, { status: 500 });
      }
    } else {
      insertedCheckinId = insertedCheckin?.id || null;
    }

    // Build enhanced result
    const result: CheckinResult = {
      lagScore,
      driftCategory,
      weakestDimension,
      tip,
      continuityMessage: continuityMessage || undefined,
      previousScore: previousScore || undefined,
      scoreDelta: scoreDelta || undefined,
      streakCount: newStreakCount,
      checkinCount: newCheckinCount,
      milestone: milestoneToReturn,
      reassuranceMessage,
      recoveryMessage,
      adaptiveTipMessage: adaptiveTipMessage || undefined,
    };

    // Save result_data to database (if check-in was inserted successfully)
    if (insertedCheckinId) {
      const { error: updateResultError } = await supabase
        .from('checkins')
        .update({ result_data: result })
        .eq('id', insertedCheckinId);

      if (updateResultError) {
        console.error('Error saving result data:', updateResultError);
        // Don't fail the request if result_data update fails - result is still returned
      }
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error processing check-in:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
