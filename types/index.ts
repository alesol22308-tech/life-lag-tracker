export type Answers = {
  energy: number; // 1-5
  sleep: number; // 1-5
  structure: number; // 1-5
  initiation: number; // 1-5
  engagement: number; // 1-5
  sustainability: number; // 1-5
};

export type DriftCategory = 'aligned' | 'mild' | 'moderate' | 'heavy' | 'critical';

export type Tip = {
  focus: string;
  constraint: string;
  choice: string;
};

export type Milestone = {
  id: string;
  milestoneType: 'checkin_count' | 'streak' | 'recovery';
  milestoneValue: number;
  achievedAt: string;
};

export type CheckinResult = {
  lagScore: number;
  driftCategory: DriftCategory;
  weakestDimension: string;
  tip: Tip;
  continuityMessage?: string;
  previousScore?: number;
  scoreDelta?: number;
  streakCount: number;
  checkinCount: number;
  milestone?: Milestone;
  reassuranceMessage: string;
  recoveryMessage?: string;
  adaptiveTipMessage?: string;
  checkinId?: string; // ID of the check-in record in database
};

export type DimensionName = 'energy' | 'sleep' | 'structure' | 'initiation' | 'engagement' | 'sustainability';

export type CheckinSummary = {
  id: string;
  lagScore: number;
  driftCategory: DriftCategory;
  weakestDimension: string;
  focusText?: string;
  createdAt: string;
  scoreDelta?: number;
  narrativeSummary?: string;
  reflectionNote?: string;
  microGoalCompletionStatus?: Record<string, 'completed' | 'skipped' | 'in_progress'>;
  /** Goal text for the micro-goal recorded on this check-in (when present) */
  microGoalText?: string;
};

export type MicroGoalStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped';

export type MicroGoalCommitment = 'tomorrow' | 'later_this_week' | 'not_sure';

export type DimensionSummary = {
  dimension: DimensionName;
  currentValue: number; // 1-5 from latest check-in
  trend: 'improved' | 'declined' | 'stable';
  trendValue: number; // Change from previous period (positive = improved, negative = declined)
};

export type DimensionTrendData = {
  dimension: DimensionName;
  values: Array<{ date: string; value: number }>; // value is 1-5
};

export type DashboardData = {
  latestCheckin: CheckinSummary | null;
  checkinHistory: CheckinSummary[];
  streakCount: number;
  lastCheckinAt: string | null;
  dimensionSummaries?: DimensionSummary[];
  dimensionTrends?: DimensionTrendData[];
};

export type MicroGoal = {
  id: string;
  dimension: DimensionName;
  goalText: string;
  createdAt: string;
  completedAt?: string;
  isActive: boolean;
};

export type QuickPulseResponse = 'good' | 'adjusting' | 'struggling';

export type MicroAdjustment = {
  message: string;
  actionLabel?: string;
  actionLink?: string;
};
