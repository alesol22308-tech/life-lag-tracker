import type { SupabaseClient } from '@supabase/supabase-js';
import { getCurrentWeekStart } from '@/lib/micro-goals';
import type { Answers, DimensionName } from '@/types';

const DIMENSION_NAMES: DimensionName[] = [
  'energy',
  'sleep',
  'structure',
  'initiation',
  'engagement',
  'sustainability',
];

export interface ChatUserContext {
  checkinCount: number;
  languagePreference: string | null;
  streakCount: number;
  lastCheckinAt: string | null;
  latestCheckin: {
    lagScore: number;
    driftCategory: string;
    weakestDimension: string;
    createdAt: string;
    scoreDelta?: number;
    narrativeSummary?: string;
    reflectionNote?: string;
  } | null;
  recentCheckins: Array<{
    lagScore: number;
    driftCategory: string;
    weakestDimension: string;
    createdAt: string;
  }>;
  dimensionSummaries: Array<{
    dimension: string;
    currentValue: number;
    trend: 'improved' | 'declined' | 'stable';
  }>;
  activeMicroGoal: { dimension: string; goalText: string } | null;
  recentMicroGoals: Array<{ dimension: string; goalText: string; completedAt: string | null; isActive: boolean }>;
}

/**
 * Fetches and builds user context for the AI chat system prompt.
 * Uses the same data sources as the home dashboard and micro-goals APIs.
 */
export async function getChatContext(
  supabase: SupabaseClient,
  userId: string
): Promise<ChatUserContext> {
  const [
    userRow,
    checkinsResult,
    streakResult,
    activeGoalResult,
    recentGoalsResult,
  ] = await Promise.all([
    supabase
      .from('users')
      .select('checkin_count, language_preference')
      .eq('id', userId)
      .single(),
    supabase
      .from('checkins')
      .select('id, lag_score, drift_category, weakest_dimension, created_at, score_delta, narrative_summary, reflection_notes, answers')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('streaks')
      .select('current_streak, last_checkin_at')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('micro_goals')
      .select('dimension, goal_text')
      .eq('user_id', userId)
      .eq('is_active', true)
      .gte('created_at', getCurrentWeekStart().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('micro_goals')
      .select('dimension, goal_text, completed_at, is_active')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 168 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const checkins = checkinsResult.data ?? [];
  const streak = streakResult.data;
  const activeGoal = activeGoalResult.data;
  const recentGoals = recentGoalsResult.data ?? [];

  const latest = checkins[0];
  const latestCheckin = latest
    ? {
        lagScore: latest.lag_score,
        driftCategory: latest.drift_category ?? 'aligned',
        weakestDimension: latest.weakest_dimension ?? '',
        createdAt: latest.created_at,
        scoreDelta: latest.score_delta ?? undefined,
        narrativeSummary: latest.narrative_summary ?? undefined,
        reflectionNote: latest.reflection_notes ?? undefined,
      }
    : null;

  const recentCheckins = checkins.slice(0, 5).map((c) => ({
    lagScore: c.lag_score,
    driftCategory: c.drift_category ?? 'aligned',
    weakestDimension: c.weakest_dimension ?? '',
    createdAt: c.created_at,
  }));

  let dimensionSummaries: ChatUserContext['dimensionSummaries'] = [];
  if (checkins.length >= 2 && checkins[0]?.answers && checkins[1]?.answers) {
    const latestAnswers = checkins[0].answers as Answers;
    const previousAnswers = checkins[1].answers as Answers;
    for (const dim of DIMENSION_NAMES) {
      const current = latestAnswers[dim];
      const previous = previousAnswers[dim];
      const trendValue = current - previous;
      let trend: 'improved' | 'declined' | 'stable' =
        trendValue > 0.2 ? 'improved' : trendValue < -0.2 ? 'declined' : 'stable';
      dimensionSummaries.push({
        dimension: dim,
        currentValue: current,
        trend,
      });
    }
  } else if (checkins.length === 1 && checkins[0]?.answers) {
    const latestAnswers = checkins[0].answers as Answers;
    for (const dim of DIMENSION_NAMES) {
      dimensionSummaries.push({
        dimension: dim,
        currentValue: latestAnswers[dim],
        trend: 'stable' as const,
      });
    }
  }

  const activeMicroGoal = activeGoal
    ? { dimension: activeGoal.dimension, goalText: activeGoal.goal_text }
    : null;

  const recentMicroGoals = recentGoals.map((g) => ({
    dimension: g.dimension,
    goalText: g.goal_text,
    completedAt: g.completed_at ?? null,
    isActive: g.is_active ?? false,
  }));

  const userData = userRow.data;
  const checkinCount =
    userData?.checkin_count != null ? Number(userData.checkin_count) : 0;
  const languagePreference =
    userData?.language_preference != null
      ? String(userData.language_preference)
      : null;

  return {
    checkinCount,
    languagePreference,
    streakCount: streak?.current_streak ?? 0,
    lastCheckinAt: streak?.last_checkin_at ?? null,
    latestCheckin,
    recentCheckins,
    dimensionSummaries,
    activeMicroGoal,
    recentMicroGoals,
  };
}

/**
 * Formats user context into a string for the AI system prompt.
 * No PII (e.g. email) is included.
 */
export function formatChatContextForPrompt(ctx: ChatUserContext): string {
  const lines: string[] = [
    '## User progress summary (use this to personalize tips and answers)',
    `- Total check-ins: ${ctx.checkinCount}`,
    `- Current streak: ${ctx.streakCount} check-ins`,
    `- Last check-in: ${ctx.lastCheckinAt ?? 'Never'}`,
  ];

  if (ctx.languagePreference) {
    lines.push(`- Preferred response language: ${ctx.languagePreference}`);
  }

  if (ctx.latestCheckin) {
    const c = ctx.latestCheckin;
    lines.push(
      '',
      '### Latest check-in',
      `- Lag score: ${c.lagScore} (drift: ${c.driftCategory})`,
      `- Weakest dimension: ${c.weakestDimension}`,
      `- Date: ${c.createdAt}`
    );
    if (c.scoreDelta != null) {
      lines.push(`- Score change from previous: ${c.scoreDelta > 0 ? '+' : ''}${c.scoreDelta}`);
    }
    if (c.narrativeSummary) {
      lines.push(`- Summary: ${c.narrativeSummary}`);
    }
    if (c.reflectionNote) {
      lines.push(`- Reflection: ${c.reflectionNote}`);
    }
  }

  if (ctx.recentCheckins.length > 0) {
    lines.push('', '### Recent check-ins (oldest to newest in time)');
    for (const c of [...ctx.recentCheckins].reverse()) {
      lines.push(
        `- ${c.createdAt}: lag ${c.lagScore}, drift ${c.driftCategory}, weakest ${c.weakestDimension}`
      );
    }
  }

  if (ctx.dimensionSummaries.length > 0) {
    lines.push('', '### Dimension summaries (1-5 scale, trend vs previous check-in)');
    for (const d of ctx.dimensionSummaries) {
      lines.push(`- ${d.dimension}: ${d.currentValue} (${d.trend})`);
    }
  }

  if (ctx.activeMicroGoal) {
    lines.push(
      '',
      '### Active micro-goal this week',
      `- Dimension: ${ctx.activeMicroGoal.dimension}`,
      `- Goal: ${ctx.activeMicroGoal.goalText}`
    );
  }

  if (ctx.recentMicroGoals.length > 0) {
    lines.push('', '### Recent micro-goals');
    for (const g of ctx.recentMicroGoals.slice(0, 5)) {
      const status = g.isActive ? 'active' : g.completedAt ? 'completed' : 'inactive';
      lines.push(`- [${g.dimension}] ${g.goalText} (${status})`);
    }
  }

  return lines.join('\n');
}
