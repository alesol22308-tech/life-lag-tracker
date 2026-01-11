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

export type CheckinResult = {
  lagScore: number;
  driftCategory: DriftCategory;
  weakestDimension: string;
  tip: Tip;
};

export type DimensionName = 'energy' | 'sleep' | 'structure' | 'initiation' | 'engagement' | 'sustainability';
