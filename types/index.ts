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
};

export type DashboardData = {
  latestCheckin: CheckinSummary | null;
  checkinHistory: CheckinSummary[];
  streakCount: number;
  lastCheckinAt: string | null;
};
