/**
 * Admin analytics functions
 * All functions return aggregate, anonymized data only - no individual user tracking
 */

import { DriftCategory, DimensionName } from '@/types';

// Types for analytics data
export interface AverageLagScoreData {
  period: string; // e.g., "2024-W01" for weekly, "2024-01" for monthly
  averageScore: number;
  checkinCount: number;
  minScore: number;
  maxScore: number;
}

export interface WeakestDimensionData {
  dimension: DimensionName;
  count: number;
  percentage: number;
}

export interface DriftCategoryData {
  category: DriftCategory;
  count: number;
  percentage: number;
}

export interface CheckinCompletionData {
  period: string;
  totalUsers: number;
  usersWithCheckins: number;
  completionRate: number;
}

export interface ReminderEffectivenessData {
  reminderType: 'email' | 'sms' | 'push';
  totalSent: number;
  convertedToCheckin: number;
  conversionRate: number;
}

export interface TipFeedbackData {
  dimension: DimensionName;
  category: DriftCategory;
  helpfulCount: number;
  didntTryCount: number;
  notRelevantCount: number;
  totalFeedback: number;
  helpfulRate: number;
}

export interface AnalyticsSummary {
  totalUsers: number;
  totalCheckins: number;
  averageLagScore: number;
  activeUsersLast30Days: number;
  checkinsLast7Days: number;
  mostCommonWeakestDimension: DimensionName | null;
  mostCommonDriftCategory: DriftCategory | null;
}

/**
 * Get average lag scores over time periods
 * Returns anonymized aggregate data
 */
export async function getAverageLagScores(
  supabase: any,
  periodType: 'daily' | 'weekly' | 'monthly' = 'weekly',
  limit: number = 12
): Promise<AverageLagScoreData[]> {
  // Use raw SQL for aggregation
  let dateFormat: string;
  switch (periodType) {
    case 'daily':
      dateFormat = 'YYYY-MM-DD';
      break;
    case 'weekly':
      dateFormat = 'IYYY-"W"IW';
      break;
    case 'monthly':
      dateFormat = 'YYYY-MM';
      break;
  }

  const { data, error } = await supabase.rpc('get_average_lag_scores', {
    date_format: dateFormat,
    result_limit: limit,
  });

  if (error) {
    console.error('Error fetching average lag scores:', error);
    // Fallback to basic query
    return getAverageLagScoresFallback(supabase, periodType, limit);
  }

  return data || [];
}

/**
 * Fallback function if RPC is not available
 */
async function getAverageLagScoresFallback(
  supabase: any,
  periodType: 'daily' | 'weekly' | 'monthly',
  limit: number
): Promise<AverageLagScoreData[]> {
  const { data: checkins, error } = await supabase
    .from('checkins')
    .select('lag_score, created_at')
    .order('created_at', { ascending: false })
    .limit(1000);

  if (error || !checkins) {
    console.error('Error in fallback query:', error);
    return [];
  }

  // Group by period in JavaScript
  const periodMap = new Map<string, number[]>();

  checkins.forEach((checkin: any) => {
    const date = new Date(checkin.created_at);
    let period: string;

    switch (periodType) {
      case 'daily':
        period = date.toISOString().split('T')[0];
        break;
      case 'weekly':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        period = `${weekStart.getFullYear()}-W${String(Math.ceil((weekStart.getDate() + 6) / 7)).padStart(2, '0')}`;
        break;
      case 'monthly':
        period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
    }

    if (!periodMap.has(period)) {
      periodMap.set(period, []);
    }
    periodMap.get(period)!.push(checkin.lag_score);
  });

  const results: AverageLagScoreData[] = [];
  const sortedPeriods = Array.from(periodMap.keys()).sort().reverse().slice(0, limit);

  for (const period of sortedPeriods) {
    const scores = periodMap.get(period)!;
    results.push({
      period,
      averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      checkinCount: scores.length,
      minScore: Math.min(...scores),
      maxScore: Math.max(...scores),
    });
  }

  return results;
}

/**
 * Get most common weakest dimensions (aggregate)
 */
export async function getWeakestDimensions(
  supabase: any,
  daysBack: number = 30
): Promise<WeakestDimensionData[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  const { data: checkins, error } = await supabase
    .from('checkins')
    .select('weakest_dimension')
    .gte('created_at', cutoffDate.toISOString());

  if (error || !checkins) {
    console.error('Error fetching weakest dimensions:', error);
    return [];
  }

  const dimensionCounts = new Map<string, number>();
  const totalCheckins = checkins.length;

  checkins.forEach((checkin: any) => {
    const dim = checkin.weakest_dimension;
    dimensionCounts.set(dim, (dimensionCounts.get(dim) || 0) + 1);
  });

  const results: WeakestDimensionData[] = [];
  dimensionCounts.forEach((count, dimension) => {
    results.push({
      dimension: dimension as DimensionName,
      count,
      percentage: totalCheckins > 0 ? Math.round((count / totalCheckins) * 100) : 0,
    });
  });

  return results.sort((a, b) => b.count - a.count);
}

/**
 * Get drift category distribution (aggregate)
 */
export async function getDriftCategoryDistribution(
  supabase: any,
  daysBack: number = 30
): Promise<DriftCategoryData[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  const { data: checkins, error } = await supabase
    .from('checkins')
    .select('drift_category')
    .gte('created_at', cutoffDate.toISOString());

  if (error || !checkins) {
    console.error('Error fetching drift categories:', error);
    return [];
  }

  const categoryCounts = new Map<string, number>();
  const totalCheckins = checkins.length;

  checkins.forEach((checkin: any) => {
    const cat = checkin.drift_category;
    categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
  });

  const categoryOrder: DriftCategory[] = ['aligned', 'mild', 'moderate', 'heavy', 'critical'];
  const results: DriftCategoryData[] = [];

  categoryOrder.forEach((category) => {
    const count = categoryCounts.get(category) || 0;
    results.push({
      category,
      count,
      percentage: totalCheckins > 0 ? Math.round((count / totalCheckins) * 100) : 0,
    });
  });

  return results;
}

/**
 * Get check-in completion rates over time
 */
export async function getCheckinCompletionRates(
  supabase: any,
  periodType: 'weekly' | 'monthly' = 'weekly',
  limit: number = 8
): Promise<CheckinCompletionData[]> {
  // Get total user count
  const { count: totalUsers, error: userError } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  if (userError) {
    console.error('Error counting users:', userError);
    return [];
  }

  // Get checkins grouped by user and period
  const { data: checkins, error: checkinError } = await supabase
    .from('checkins')
    .select('user_id, created_at')
    .order('created_at', { ascending: false })
    .limit(5000);

  if (checkinError || !checkins) {
    console.error('Error fetching checkins for completion rates:', checkinError);
    return [];
  }

  // Group by period and count unique users
  const periodUserMap = new Map<string, Set<string>>();

  checkins.forEach((checkin: any) => {
    const date = new Date(checkin.created_at);
    let period: string;

    if (periodType === 'weekly') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      period = `${weekStart.getFullYear()}-W${String(Math.ceil((weekStart.getDate() + 6) / 7)).padStart(2, '0')}`;
    } else {
      period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    if (!periodUserMap.has(period)) {
      periodUserMap.set(period, new Set());
    }
    periodUserMap.get(period)!.add(checkin.user_id);
  });

  const sortedPeriods = Array.from(periodUserMap.keys()).sort().reverse().slice(0, limit);
  const results: CheckinCompletionData[] = [];

  sortedPeriods.forEach((period) => {
    const usersWithCheckins = periodUserMap.get(period)!.size;
    results.push({
      period,
      totalUsers: totalUsers || 0,
      usersWithCheckins,
      completionRate: totalUsers ? Math.round((usersWithCheckins / totalUsers) * 100) : 0,
    });
  });

  return results;
}

/**
 * Get reminder effectiveness data (email vs SMS vs push)
 */
export async function getReminderEffectiveness(
  supabase: any,
  daysBack: number = 30
): Promise<ReminderEffectivenessData[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  const { data: logs, error } = await supabase
    .from('reminder_logs')
    .select('reminder_type, checkin_within_48h')
    .gte('sent_at', cutoffDate.toISOString());

  if (error) {
    console.error('Error fetching reminder logs:', error);
    // Return empty data if table doesn't exist yet
    return [
      { reminderType: 'email', totalSent: 0, convertedToCheckin: 0, conversionRate: 0 },
      { reminderType: 'sms', totalSent: 0, convertedToCheckin: 0, conversionRate: 0 },
      { reminderType: 'push', totalSent: 0, convertedToCheckin: 0, conversionRate: 0 },
    ];
  }

  const typeStats = new Map<string, { sent: number; converted: number }>();
  const reminderTypes: ('email' | 'sms' | 'push')[] = ['email', 'sms', 'push'];

  reminderTypes.forEach((type) => {
    typeStats.set(type, { sent: 0, converted: 0 });
  });

  (logs || []).forEach((log: any) => {
    const stats = typeStats.get(log.reminder_type);
    if (stats) {
      stats.sent++;
      if (log.checkin_within_48h) {
        stats.converted++;
      }
    }
  });

  return reminderTypes.map((type) => {
    const stats = typeStats.get(type)!;
    return {
      reminderType: type,
      totalSent: stats.sent,
      convertedToCheckin: stats.converted,
      conversionRate: stats.sent > 0 ? Math.round((stats.converted / stats.sent) * 100) : 0,
    };
  });
}

/**
 * Get tip feedback aggregation
 */
export async function getTipFeedbackAggregation(
  supabase: any,
  daysBack: number = 90
): Promise<TipFeedbackData[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  const { data: checkins, error } = await supabase
    .from('checkins')
    .select('tip_feedback, weakest_dimension, drift_category')
    .not('tip_feedback', 'is', null)
    .gte('created_at', cutoffDate.toISOString());

  if (error || !checkins) {
    console.error('Error fetching tip feedback:', error);
    return [];
  }

  const feedbackMap = new Map<string, {
    dimension: DimensionName;
    category: DriftCategory;
    helpful: number;
    didntTry: number;
    notRelevant: number;
  }>();

  checkins.forEach((checkin: any) => {
    const feedback = checkin.tip_feedback;
    if (!feedback || typeof feedback !== 'object') return;

    const key = `${checkin.weakest_dimension}-${checkin.drift_category}`;
    
    if (!feedbackMap.has(key)) {
      feedbackMap.set(key, {
        dimension: checkin.weakest_dimension as DimensionName,
        category: checkin.drift_category as DriftCategory,
        helpful: 0,
        didntTry: 0,
        notRelevant: 0,
      });
    }

    const stats = feedbackMap.get(key)!;
    const feedbackValue = feedback.feedback || (feedback.helpful ? 'helpful' : feedback.used === false ? 'not_relevant' : 'didnt_try');

    switch (feedbackValue) {
      case 'helpful':
        stats.helpful++;
        break;
      case 'didnt_try':
        stats.didntTry++;
        break;
      case 'not_relevant':
        stats.notRelevant++;
        break;
    }
  });

  const results: TipFeedbackData[] = [];
  feedbackMap.forEach((stats) => {
    const total = stats.helpful + stats.didntTry + stats.notRelevant;
    results.push({
      dimension: stats.dimension,
      category: stats.category,
      helpfulCount: stats.helpful,
      didntTryCount: stats.didntTry,
      notRelevantCount: stats.notRelevant,
      totalFeedback: total,
      helpfulRate: total > 0 ? Math.round((stats.helpful / total) * 100) : 0,
    });
  });

  return results.sort((a, b) => b.totalFeedback - a.totalFeedback);
}

/**
 * Get analytics summary
 */
export async function getAnalyticsSummary(supabase: any): Promise<AnalyticsSummary> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Get total users
  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  // Get total checkins
  const { count: totalCheckins } = await supabase
    .from('checkins')
    .select('*', { count: 'exact', head: true });

  // Get average lag score
  const { data: avgData } = await supabase
    .from('checkins')
    .select('lag_score');

  const averageLagScore = avgData && avgData.length > 0
    ? Math.round(avgData.reduce((sum: number, c: any) => sum + c.lag_score, 0) / avgData.length)
    : 0;

  // Get active users last 30 days
  const { data: activeUsersData } = await supabase
    .from('checkins')
    .select('user_id')
    .gte('created_at', thirtyDaysAgo.toISOString());

  const activeUsersLast30Days = new Set((activeUsersData || []).map((c: any) => c.user_id)).size;

  // Get checkins last 7 days
  const { count: checkinsLast7Days } = await supabase
    .from('checkins')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', sevenDaysAgo.toISOString());

  // Get most common weakest dimension
  const weakestDimensions = await getWeakestDimensions(supabase, 30);
  const mostCommonWeakestDimension = weakestDimensions.length > 0 ? weakestDimensions[0].dimension : null;

  // Get most common drift category
  const driftCategories = await getDriftCategoryDistribution(supabase, 30);
  const mostCommonDriftCategory = driftCategories.length > 0 
    ? driftCategories.reduce((max, c) => c.count > max.count ? c : max).category 
    : null;

  return {
    totalUsers: totalUsers || 0,
    totalCheckins: totalCheckins || 0,
    averageLagScore,
    activeUsersLast30Days,
    checkinsLast7Days: checkinsLast7Days || 0,
    mostCommonWeakestDimension,
    mostCommonDriftCategory,
  };
}

/**
 * Export analytics data as JSON for product decisions
 */
export async function exportAnalyticsData(supabase: any): Promise<object> {
  const [
    summary,
    avgScores,
    weakestDimensions,
    driftCategories,
    completionRates,
    reminderEffectiveness,
    tipFeedback,
  ] = await Promise.all([
    getAnalyticsSummary(supabase),
    getAverageLagScores(supabase, 'weekly', 12),
    getWeakestDimensions(supabase, 90),
    getDriftCategoryDistribution(supabase, 90),
    getCheckinCompletionRates(supabase, 'weekly', 12),
    getReminderEffectiveness(supabase, 90),
    getTipFeedbackAggregation(supabase, 90),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    privacyNote: 'All data is anonymized and aggregated. No individual user data is included.',
    summary,
    trends: {
      averageLagScores: avgScores,
      completionRates,
    },
    distributions: {
      weakestDimensions,
      driftCategories,
    },
    effectiveness: {
      reminders: reminderEffectiveness,
      tipFeedback,
    },
  };
}
