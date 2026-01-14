'use client';

import { DimensionName, Answers } from '@/types';
import { calculateLagScore } from '@/lib/calculations';

const DIMENSION_LABELS: Record<DimensionName, string> = {
  energy: 'Energy',
  sleep: 'Sleep consistency',
  structure: 'Daily structure',
  initiation: 'Task initiation',
  engagement: 'Engagement / follow-through',
  sustainability: 'Effort sustainability',
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
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Baseline Week</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">Typical/good state</p>
          </div>
          <div className="space-y-3">
            {DIMENSION_KEYS.map((dimension, index) => {
              const value = baselineAnswers[dimension];
              const drift = baselineDrifts[index];
              return (
                <div key={dimension} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">{DIMENSION_LABELS[dimension]}</span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">{value}/5</span>
                  </div>
                  <div className="relative h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-slate-400 dark:bg-slate-500 rounded-full"
                      style={{ width: `${(value / 5) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Drift: {(drift * 100).toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Lag Score</span>
              <span className="text-lg font-light text-gray-900 dark:text-gray-100">{baselineScore}</span>
            </div>
          </div>
        </div>

        {/* Current Week */}
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Week</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">With drift</p>
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
                    <span className="text-gray-600 dark:text-gray-400">{DIMENSION_LABELS[dimension]}</span>
                    <span className={`font-medium ${isLower ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-gray-100'}`}>
                      {value}/5 {isLower && `↓${baselineValue - value}`}
                    </span>
                  </div>
                  <div className="relative h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`absolute top-0 left-0 h-full rounded-full ${isLower ? 'bg-amber-500 dark:bg-amber-400' : 'bg-slate-400 dark:bg-slate-500'}`}
                      style={{ width: `${(value / 5) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Drift: {(drift * 100).toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Lag Score</span>
              <span className="text-lg font-light text-gray-900 dark:text-gray-100">{currentScore}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
