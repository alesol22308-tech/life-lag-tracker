import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { validateApiKey, extractApiKey, hasScope } from '@/lib/api-auth';
import { applyRateLimit } from '@/lib/rate-limit';
import { DimensionName } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/stats
 * Get user's statistics and trends
 */
export async function GET(request: Request) {
  try {
    const supabase = createClient();

    // Extract and validate API key
    const apiKey = extractApiKey(request);
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing API key. Use Authorization: Bearer <key> or X-API-Key header.' },
        { status: 401 }
      );
    }

    const validation = await validateApiKey(supabase, apiKey);
    if (!validation.valid || !validation.user) {
      return NextResponse.json(
        { error: validation.error || 'Invalid API key' },
        { status: 401 }
      );
    }

    // Check scope
    if (!hasScope(validation.user.scopes, 'read:stats')) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Required scope: read:stats' },
        { status: 403 }
      );
    }

    // Apply rate limiting
    const rateLimit = applyRateLimit(validation.user.keyId, validation.user.tier);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: rateLimit.error?.message },
        { status: 429, headers: rateLimit.headers }
      );
    }

    const userId = validation.user.userId;

    // Get check-in count and totals
    const { count: totalCheckins } = await supabase
      .from('checkins')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get recent check-ins for calculations
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentCheckins } = await supabase
      .from('checkins')
      .select('lag_score, drift_category, weakest_dimension, answers, created_at')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    // Get streak info
    const { data: streakData } = await supabase
      .from('streaks')
      .select('current_streak, last_checkin_at')
      .eq('user_id', userId)
      .single();

    // Calculate statistics
    const checkins = recentCheckins || [];
    const currentStreak = streakData?.current_streak || 0;
    const lastCheckinAt = streakData?.last_checkin_at || null;

    // Average lag score (last 30 days)
    const averageLagScore = checkins.length > 0
      ? Math.round(checkins.reduce((sum, c) => sum + c.lag_score, 0) / checkins.length)
      : null;

    // Drift category breakdown
    const driftCategories: Record<string, number> = {};
    checkins.forEach((c) => {
      driftCategories[c.drift_category] = (driftCategories[c.drift_category] || 0) + 1;
    });

    // Weakest dimensions breakdown
    const weakestDimensions: Record<string, number> = {};
    checkins.forEach((c) => {
      weakestDimensions[c.weakest_dimension] = (weakestDimensions[c.weakest_dimension] || 0) + 1;
    });

    // Most common weakest dimension
    const mostCommonWeakness = Object.entries(weakestDimensions)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    // Dimension averages (from answers)
    const dimensionTotals: Record<DimensionName, number[]> = {
      energy: [],
      sleep: [],
      structure: [],
      initiation: [],
      engagement: [],
      sustainability: [],
    };

    checkins.forEach((c) => {
      if (c.answers) {
        Object.keys(dimensionTotals).forEach((dim) => {
          if (c.answers[dim] !== undefined) {
            dimensionTotals[dim as DimensionName].push(c.answers[dim]);
          }
        });
      }
    });

    const dimensionAverages: Record<string, number | null> = {};
    Object.entries(dimensionTotals).forEach(([dim, values]) => {
      dimensionAverages[dim] = values.length > 0
        ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
        : null;
    });

    // Score trend (comparing first half to second half of period)
    let scoreTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (checkins.length >= 4) {
      const midpoint = Math.floor(checkins.length / 2);
      const recentHalf = checkins.slice(0, midpoint);
      const olderHalf = checkins.slice(midpoint);

      const recentAvg = recentHalf.reduce((sum, c) => sum + c.lag_score, 0) / recentHalf.length;
      const olderAvg = olderHalf.reduce((sum, c) => sum + c.lag_score, 0) / olderHalf.length;

      const diff = olderAvg - recentAvg; // Positive means improving (lower recent score)
      if (diff > 5) scoreTrend = 'improving';
      else if (diff < -5) scoreTrend = 'declining';
    }

    // Weekly check-in history (last 8 weeks)
    const weeklyHistory: Array<{ week: string; count: number; averageScore: number | null }> = [];
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

    const { data: weeklyCheckins } = await supabase
      .from('checkins')
      .select('lag_score, created_at')
      .eq('user_id', userId)
      .gte('created_at', eightWeeksAgo.toISOString())
      .order('created_at', { ascending: true });

    if (weeklyCheckins) {
      // Group by week
      const weekMap = new Map<string, number[]>();
      weeklyCheckins.forEach((c) => {
        const date = new Date(c.created_at);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!weekMap.has(weekKey)) {
          weekMap.set(weekKey, []);
        }
        weekMap.get(weekKey)!.push(c.lag_score);
      });

      // Convert to array
      Array.from(weekMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([week, scores]) => {
          weeklyHistory.push({
            week,
            count: scores.length,
            averageScore: scores.length > 0
              ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
              : null,
          });
        });
    }

    const response = {
      summary: {
        totalCheckins: totalCheckins || 0,
        checkinsLast30Days: checkins.length,
        averageLagScore,
        currentStreak,
        lastCheckinAt,
        scoreTrend,
        mostCommonWeakness,
      },
      dimensions: {
        averages: dimensionAverages,
        weakestBreakdown: weakestDimensions,
      },
      driftCategories,
      weeklyHistory,
    };

    return NextResponse.json(response, { headers: rateLimit.headers });
  } catch (error: any) {
    console.error('Error in GET /api/v1/stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
