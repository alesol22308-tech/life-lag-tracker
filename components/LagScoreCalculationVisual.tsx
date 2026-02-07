'use client';

import { DimensionName, Answers } from '@/types';
import { calculateLagScore } from '@/lib/calculations';

const DIMENSION_LABELS: Record<DimensionName, string> = {
  energy: 'Energy',
  sleep: 'Sleep consistency',
  structure: 'Daily structure',
  initiation: 'Starting tasks',
  engagement: 'Engagement / follow-through',
  sustainability: 'Sustainable pace',
};

const DIMENSION_KEYS: DimensionName[] = ['energy', 'sleep', 'structure', 'initiation', 'engagement', 'sustainability'];

interface LagScoreCalculationVisualProps {
  className?: string;
}

export default function LagScoreCalculationVisual({ className = '' }: LagScoreCalculationVisualProps) {
  // Example baseline week (good state - all dimensions at 4-5)
  const baselineAnswers: Answers = {
    energy: 4,
    sleep: 5,
    structure: 4,
    initiation: 4,
    engagement: 5,
    sustainability: 4,
  };

  // Example current week (with drift - some dimensions lower)
  const currentAnswers: Answers = {
    energy: 3,
    sleep: 4,
    structure: 2,
    initiation: 3,
    engagement: 4,
    sustainability: 3,
  };

  const baselineScore = calculateLagScore(baselineAnswers);
  const currentScore = calculateLagScore(currentAnswers);

  // Calculate drift values for visualization
  const calculateDriftValue = (value: number) => (5 - value) / 4;
  const calculateDriftValues = (answers: Answers) =>
    DIMENSION_KEYS.map((key) => calculateDriftValue(answers[key]));

  const baselineDrifts = calculateDriftValues(baselineAnswers);
  const currentDrifts = calculateDriftValues(currentAnswers);
  const baselineAverage = baselineDrifts.reduce((a, b) => a + b, 0) / 6;
  const currentAverage = currentDrifts.reduce((a, b) => a + b, 0) / 6;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Comparison Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Baseline Week */}
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-text0 mb-1">Baseline Week</h4>
            <p className="text-xs text-text2">Typical/good state</p>
          </div>
          <div className="space-y-3">
            {DIMENSION_KEYS.map((dimension, index) => {
              const value = baselineAnswers[dimension];
              const drift = baselineDrifts[index];
              return (
                <div key={dimension} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text2">{DIMENSION_LABELS[dimension]}</span>
                    <span className="text-text0 font-medium">{value}/5</span>
                  </div>
                  <div className="relative h-2 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-black/20 dark:bg-white/20 rounded-full"
                      style={{ width: `${(value / 5) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-text2">
                    Drift: {(drift * 100).toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
          <div className="pt-2 border-t border-cardBorder">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text2">Lag Score</span>
              <span className="text-lg font-light text-text0">{baselineScore}</span>
            </div>
          </div>
        </div>

        {/* Current Week */}
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-text0 mb-1">Current Week</h4>
            <p className="text-xs text-text2">With drift</p>
          </div>
          <div className="space-y-3">
            {DIMENSION_KEYS.map((dimension, index) => {
              const value = currentAnswers[dimension];
              const drift = currentDrifts[index];
              const baselineValue = baselineAnswers[dimension];
              const isLower = value < baselineValue;
              return (
                <div key={dimension} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text2">{DIMENSION_LABELS[dimension]}</span>
                    <span className={`font-medium ${isLower ? 'text-amber-600 dark:text-amber-400' : 'text-text0'}`}>
                      {value}/5 {isLower && `↓${baselineValue - value}`}
                    </span>
                  </div>
                  <div className="relative h-2 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`absolute top-0 left-0 h-full rounded-full ${isLower ? 'bg-amber-500 dark:bg-amber-400' : 'bg-black/20 dark:bg-white/20'}`}
                      style={{ width: `${(value / 5) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-text2">
                    Drift: {(drift * 100).toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
          <div className="pt-2 border-t border-cardBorder">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text2">Lag Score</span>
              <span className="text-lg font-light text-text0">{currentScore}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
