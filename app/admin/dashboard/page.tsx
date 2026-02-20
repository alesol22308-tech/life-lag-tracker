'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import GlassCard from '@/components/GlassCard';
import PrimaryButton from '@/components/PrimaryButton';
import GhostButton from '@/components/GhostButton';
import {
  AnalyticsSummary,
  AverageLagScoreData,
  WeakestDimensionData,
  DriftCategoryData,
  CheckinCompletionData,
  ReminderEffectivenessData,
  TipFeedbackData,
  getAnalyticsSummary,
  getAverageLagScores,
  getWeakestDimensions,
  getDriftCategoryDistribution,
  getCheckinCompletionRates,
  getReminderEffectiveness,
  getTipFeedbackAggregation,
  exportAnalyticsData,
} from '@/lib/admin-analytics';
import { isAdmin } from '@/lib/admin-auth';
import { useLocale } from 'next-intl';
import { getDimensionName, type Locale } from '@/lib/i18n';

// Drift category colors
const DRIFT_COLORS: Record<string, string> = {
  aligned: 'bg-emerald-500',
  mild: 'bg-lime-500',
  moderate: 'bg-amber-500',
  heavy: 'bg-orange-500',
  critical: 'bg-red-500',
};

export default function AdminDashboard() {
  const locale = useLocale();
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [avgScores, setAvgScores] = useState<AverageLagScoreData[]>([]);
  const [weakestDimensions, setWeakestDimensions] = useState<WeakestDimensionData[]>([]);
  const [driftCategories, setDriftCategories] = useState<DriftCategoryData[]>([]);
  const [completionRates, setCompletionRates] = useState<CheckinCompletionData[]>([]);
  const [reminderEffectiveness, setReminderEffectiveness] = useState<ReminderEffectivenessData[]>([]);
  const [tipFeedback, setTipFeedback] = useState<TipFeedbackData[]>([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function checkAdminAccess() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      const adminStatus = await isAdmin(supabase, user.id);
      if (!adminStatus) {
        router.push('/home');
        return;
      }

      setAuthorized(true);
      
      // Load analytics after authorization
      try {
        const [
          summaryData,
          avgScoresData,
          weakestDimensionsData,
          driftCategoriesData,
          completionRatesData,
          reminderEffectivenessData,
          tipFeedbackData,
        ] = await Promise.all([
          getAnalyticsSummary(supabase),
          getAverageLagScores(supabase, 'weekly', 12),
          getWeakestDimensions(supabase, 30),
          getDriftCategoryDistribution(supabase, 30),
          getCheckinCompletionRates(supabase, 'weekly', 8),
          getReminderEffectiveness(supabase, 30),
          getTipFeedbackAggregation(supabase, 90),
        ]);

        setSummary(summaryData);
        setAvgScores(avgScoresData);
        setWeakestDimensions(weakestDimensionsData);
        setDriftCategories(driftCategoriesData);
        setCompletionRates(completionRatesData);
        setReminderEffectiveness(reminderEffectivenessData);
        setTipFeedback(tipFeedbackData);
      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setLoading(false);
      }
    }

    checkAdminAccess();
  }, [supabase, router]);

  async function handleExport() {
    setExporting(true);
    try {
      const data = await exportAnalyticsData(supabase);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lifelag-analytics-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting analytics:', error);
      alert('Failed to export analytics data');
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg0 flex items-center justify-center">
        <div className="text-text1">Loading admin dashboard...</div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-bg0 flex items-center justify-center">
        <div className="text-text1">Checking authorization...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg0 text-text0">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-text0">Admin Analytics</h1>
            <p className="text-text2 mt-1">Anonymized, aggregate insights for product decisions</p>
          </div>
          <div className="flex gap-3">
            <GhostButton onClick={handleExport} disabled={exporting}>
              {exporting ? 'Exporting...' : 'Export JSON'}
            </GhostButton>
            <Link href="/home">
              <PrimaryButton>Back to Dashboard</PrimaryButton>
            </Link>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-8">
          <p className="text-sm text-blue-300">
            <strong>Privacy Notice:</strong> All data shown here is anonymized and aggregated. 
            No individual user data is displayed or exported. This dashboard is for product insights only.
          </p>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <GlassCard className="text-center">
              <div className="text-3xl font-bold text-text0">{summary.totalUsers}</div>
              <div className="text-sm text-text2">Total Users</div>
            </GlassCard>
            <GlassCard className="text-center">
              <div className="text-3xl font-bold text-text0">{summary.totalCheckins}</div>
              <div className="text-sm text-text2">Total Check-ins</div>
            </GlassCard>
            <GlassCard className="text-center">
              <div className="text-3xl font-bold text-text0">{summary.averageLagScore}</div>
              <div className="text-sm text-text2">Avg Lag Score</div>
            </GlassCard>
            <GlassCard className="text-center">
              <div className="text-3xl font-bold text-text0">{summary.activeUsersLast30Days}</div>
              <div className="text-sm text-text2">Active (30d)</div>
            </GlassCard>
            <GlassCard className="text-center">
              <div className="text-3xl font-bold text-text0">{summary.checkinsLast7Days}</div>
              <div className="text-sm text-text2">Check-ins (7d)</div>
            </GlassCard>
            <GlassCard className="text-center">
              <div className="text-3xl font-bold text-text0 capitalize">
                {summary.mostCommonWeakestDimension || '-'}
              </div>
              <div className="text-sm text-text2">Top Weakness</div>
            </GlassCard>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Average Lag Scores Over Time */}
          <GlassCard>
            <h2 className="text-xl font-semibold text-text0 mb-4">Lag Score Trend (Weekly)</h2>
            {avgScores.length > 0 ? (
              <div className="space-y-2">
                {avgScores.slice(0, 8).reverse().map((period) => (
                  <div key={period.period} className="flex items-center gap-3">
                    <div className="w-20 text-sm text-text2 font-mono">{period.period}</div>
                    <div className="flex-1 bg-white/5 rounded-full h-4 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-amber-500"
                        style={{ width: `${period.averageScore}%` }}
                      />
                    </div>
                    <div className="w-12 text-sm text-text1 text-right">{period.averageScore}</div>
                    <div className="w-12 text-xs text-text2 text-right">({period.checkinCount})</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text2">No data available</p>
            )}
          </GlassCard>

          {/* Drift Category Distribution */}
          <GlassCard>
            <h2 className="text-xl font-semibold text-text0 mb-4">Drift Category Distribution (30d)</h2>
            {driftCategories.length > 0 ? (
              <div className="space-y-3">
                {driftCategories.map((cat) => (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-text1 capitalize">{cat.category}</span>
                      <span className="text-text2">{cat.percentage}% ({cat.count})</span>
                    </div>
                    <div className="bg-white/5 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full ${DRIFT_COLORS[cat.category]}`}
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text2">No data available</p>
            )}
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Weakest Dimensions */}
          <GlassCard>
            <h2 className="text-xl font-semibold text-text0 mb-4">Most Common Weakest Dimensions (30d)</h2>
            {weakestDimensions.length > 0 ? (
              <div className="space-y-3">
                {weakestDimensions.map((dim) => (
                  <div key={dim.dimension} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-text1">{getDimensionName(dim.dimension, locale as Locale) || dim.dimension}</span>
                      <span className="text-text2">{dim.percentage}% ({dim.count})</span>
                    </div>
                    <div className="bg-white/5 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-violet-500"
                        style={{ width: `${dim.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text2">No data available</p>
            )}
          </GlassCard>

          {/* Completion Rates */}
          <GlassCard>
            <h2 className="text-xl font-semibold text-text0 mb-4">Check-in Completion Rate (Weekly)</h2>
            {completionRates.length > 0 ? (
              <div className="space-y-2">
                {completionRates.slice(0, 8).reverse().map((period) => (
                  <div key={period.period} className="flex items-center gap-3">
                    <div className="w-20 text-sm text-text2 font-mono">{period.period}</div>
                    <div className="flex-1 bg-white/5 rounded-full h-4 overflow-hidden">
                      <div
                        className="h-full bg-cyan-500"
                        style={{ width: `${period.completionRate}%` }}
                      />
                    </div>
                    <div className="w-12 text-sm text-text1 text-right">{period.completionRate}%</div>
                    <div className="w-20 text-xs text-text2 text-right">
                      {period.usersWithCheckins}/{period.totalUsers}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text2">No data available</p>
            )}
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Reminder Effectiveness */}
          <GlassCard>
            <h2 className="text-xl font-semibold text-text0 mb-4">Reminder Effectiveness (30d)</h2>
            {reminderEffectiveness.length > 0 ? (
              <div className="space-y-4">
                {reminderEffectiveness.map((reminder) => (
                  <div key={reminder.reminderType} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-text1 capitalize font-medium">{reminder.reminderType}</span>
                      <span className="text-sm text-text2">
                        {reminder.convertedToCheckin}/{reminder.totalSent} converted
                      </span>
                    </div>
                    <div className="bg-white/5 rounded-full h-4 overflow-hidden">
                      <div
                        className={`h-full ${
                          reminder.reminderType === 'email' ? 'bg-blue-500' :
                          reminder.reminderType === 'sms' ? 'bg-green-500' : 'bg-purple-500'
                        }`}
                        style={{ width: `${reminder.conversionRate}%` }}
                      />
                    </div>
                    <div className="text-sm text-text2 text-right">
                      {reminder.conversionRate}% conversion rate
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text2">No reminder data available yet</p>
            )}
          </GlassCard>

          {/* Tip Feedback */}
          <GlassCard>
            <h2 className="text-xl font-semibold text-text0 mb-4">Tip Feedback Summary (90d)</h2>
            {tipFeedback.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {tipFeedback.slice(0, 10).map((tip, idx) => (
                  <div key={idx} className="p-3 bg-white/5 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-text1 font-medium">
                          {getDimensionName(tip.dimension, locale as Locale) || tip.dimension}
                        </span>
                        <span className="text-text2 text-sm ml-2 capitalize">({tip.category})</span>
                      </div>
                      <span className="text-sm text-emerald-400">{tip.helpfulRate}% helpful</span>
                    </div>
                    <div className="flex gap-4 text-xs text-text2">
                      <span>👍 {tip.helpfulCount}</span>
                      <span>🤷 {tip.didntTryCount}</span>
                      <span>👎 {tip.notRelevantCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text2">No tip feedback available yet</p>
            )}
          </GlassCard>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-text2 mt-12">
          <p>
            Data refreshes on page load. Last updated: {new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
