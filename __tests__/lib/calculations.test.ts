/**
 * Tests for lib/calculations.ts
 * Tests calculateLagScore, getDriftCategory, getWeakestDimension, shouldShowQuickPulse
 */

import {
  calculateLagScore,
  getDriftCategory,
  getWeakestDimension,
  shouldShowQuickPulse,
} from '@/lib/calculations';
import {
  createAnswers,
  createAnswersWithWeakest,
  createCheckinSummary,
  createWorseningTrend,
  createStableTrend,
  ALL_DIMENSIONS,
} from '../utils/test-helpers';
import { Answers, DriftCategory } from '@/types';

describe('calculateLagScore', () => {
  describe('edge cases', () => {
    it('should return 0 when all answers are 5 (maximum alignment)', () => {
      const answers = createAnswers({
        energy: 5,
        sleep: 5,
        structure: 5,
        initiation: 5,
        engagement: 5,
        sustainability: 5,
      });
      
      expect(calculateLagScore(answers)).toBe(0);
    });

    it('should return maximum score (80) when all answers are 1 (minimum alignment)', () => {
      const answers = createAnswers({
        energy: 1,
        sleep: 1,
        structure: 1,
        initiation: 1,
        engagement: 1,
        sustainability: 1,
      });
      
      // Formula: ((5-1)/4 = 1) * 100 * 0.8 = 80
      expect(calculateLagScore(answers)).toBe(80);
    });

    it('should return middle score when all answers are 3', () => {
      const answers = createAnswers({
        energy: 3,
        sleep: 3,
        structure: 3,
        initiation: 3,
        engagement: 3,
        sustainability: 3,
      });
      
      // Formula: ((5-3)/4 = 0.5) * 100 * 0.8 = 40
      expect(calculateLagScore(answers)).toBe(40);
    });
  });

  describe('mixed values', () => {
    it('should calculate correct score for mixed answers', () => {
      const answers = createAnswers({
        energy: 1,
        sleep: 5,
        structure: 3,
        initiation: 2,
        engagement: 4,
        sustainability: 3,
      });
      
      // Drift values: [1, 0, 0.5, 0.75, 0.25, 0.5]
      // Average: 3/6 = 0.5
      // Raw: 50, Softened: 40
      expect(calculateLagScore(answers)).toBe(40);
    });

    it('should handle asymmetric answers', () => {
      const answers = createAnswers({
        energy: 1,
        sleep: 1,
        structure: 5,
        initiation: 5,
        engagement: 5,
        sustainability: 5,
      });
      
      // Drift values: [1, 1, 0, 0, 0, 0]
      // Average: 2/6 = 0.333...
      // Raw: 33.33, Softened: 26.67 → rounded to 27
      expect(calculateLagScore(answers)).toBe(27);
    });
  });

  describe('boundary testing', () => {
    it('should clamp score to minimum of 0', () => {
      // All 5s should give 0, not negative
      const answers = createAnswers({
        energy: 5,
        sleep: 5,
        structure: 5,
        initiation: 5,
        engagement: 5,
        sustainability: 5,
      });
      
      const score = calculateLagScore(answers);
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should clamp score to maximum of 100', () => {
      // All 1s should give 80 (not exceed 100)
      const answers = createAnswers({
        energy: 1,
        sleep: 1,
        structure: 1,
        initiation: 1,
        engagement: 1,
        sustainability: 1,
      });
      
      const score = calculateLagScore(answers);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should round to nearest integer', () => {
      const answers = createAnswers({
        energy: 2,
        sleep: 3,
        structure: 4,
        initiation: 2,
        engagement: 3,
        sustainability: 4,
      });
      
      const score = calculateLagScore(answers);
      expect(Number.isInteger(score)).toBe(true);
    });
  });

  describe('softening factor', () => {
    it('should apply 0.8 softening factor correctly', () => {
      // With all 1s: raw score = 100, softened = 80
      const answers = createAnswers({
        energy: 1,
        sleep: 1,
        structure: 1,
        initiation: 1,
        engagement: 1,
        sustainability: 1,
      });
      
      expect(calculateLagScore(answers)).toBe(80);
    });
  });
});

describe('getDriftCategory', () => {
  describe('boundary testing', () => {
    it('should return "aligned" for scores 0-19', () => {
      expect(getDriftCategory(0)).toBe('aligned');
      expect(getDriftCategory(10)).toBe('aligned');
      expect(getDriftCategory(19)).toBe('aligned');
    });

    it('should return "mild" for scores 20-34', () => {
      expect(getDriftCategory(20)).toBe('mild');
      expect(getDriftCategory(27)).toBe('mild');
      expect(getDriftCategory(34)).toBe('mild');
    });

    it('should return "moderate" for scores 35-54', () => {
      expect(getDriftCategory(35)).toBe('moderate');
      expect(getDriftCategory(45)).toBe('moderate');
      expect(getDriftCategory(54)).toBe('moderate');
    });

    it('should return "heavy" for scores 55-74', () => {
      expect(getDriftCategory(55)).toBe('heavy');
      expect(getDriftCategory(65)).toBe('heavy');
      expect(getDriftCategory(74)).toBe('heavy');
    });

    it('should return "critical" for scores 75-100', () => {
      expect(getDriftCategory(75)).toBe('critical');
      expect(getDriftCategory(85)).toBe('critical');
      expect(getDriftCategory(100)).toBe('critical');
    });
  });

  describe('edge cases at boundaries', () => {
    it('should correctly categorize at exact boundary of aligned/mild', () => {
      expect(getDriftCategory(19)).toBe('aligned');
      expect(getDriftCategory(20)).toBe('mild');
    });

    it('should correctly categorize at exact boundary of mild/moderate', () => {
      expect(getDriftCategory(34)).toBe('mild');
      expect(getDriftCategory(35)).toBe('moderate');
    });

    it('should correctly categorize at exact boundary of moderate/heavy', () => {
      expect(getDriftCategory(54)).toBe('moderate');
      expect(getDriftCategory(55)).toBe('heavy');
    });

    it('should correctly categorize at exact boundary of heavy/critical', () => {
      expect(getDriftCategory(74)).toBe('heavy');
      expect(getDriftCategory(75)).toBe('critical');
    });
  });

  describe('all possible categories', () => {
    const categoryTests: [number, DriftCategory][] = [
      [0, 'aligned'],
      [5, 'aligned'],
      [25, 'mild'],
      [40, 'moderate'],
      [60, 'heavy'],
      [90, 'critical'],
    ];

    test.each(categoryTests)('score %i should be categorized as %s', (score, expected) => {
      expect(getDriftCategory(score)).toBe(expected);
    });
  });
});

describe('getWeakestDimension', () => {
  describe('all dimensions as weakest', () => {
    it('should return "energy" when energy is lowest', () => {
      const answers = createAnswersWithWeakest('energy');
      expect(getWeakestDimension(answers)).toBe('energy');
    });

    it('should return "sleep" when sleep is lowest', () => {
      const answers = createAnswersWithWeakest('sleep');
      expect(getWeakestDimension(answers)).toBe('sleep');
    });

    it('should return "structure" when structure is lowest', () => {
      const answers = createAnswersWithWeakest('structure');
      expect(getWeakestDimension(answers)).toBe('structure');
    });

    it('should return "initiation" when initiation is lowest', () => {
      const answers = createAnswersWithWeakest('initiation');
      expect(getWeakestDimension(answers)).toBe('initiation');
    });

    it('should return "engagement" when engagement is lowest', () => {
      const answers = createAnswersWithWeakest('engagement');
      expect(getWeakestDimension(answers)).toBe('engagement');
    });

    it('should return "sustainability" when sustainability is lowest', () => {
      const answers = createAnswersWithWeakest('sustainability');
      expect(getWeakestDimension(answers)).toBe('sustainability');
    });
  });

  describe('tie handling', () => {
    it('should return first dimension in order when there is a tie', () => {
      // All equal - should return 'energy' as first in order
      const answers = createAnswers({
        energy: 3,
        sleep: 3,
        structure: 3,
        initiation: 3,
        engagement: 3,
        sustainability: 3,
      });
      
      expect(getWeakestDimension(answers)).toBe('energy');
    });

    it('should return first matching dimension when multiple have same lowest value', () => {
      const answers = createAnswers({
        energy: 2,
        sleep: 2,
        structure: 4,
        initiation: 4,
        engagement: 4,
        sustainability: 4,
      });
      
      // energy and sleep are tied at 2, should return energy (first in order)
      expect(getWeakestDimension(answers)).toBe('energy');
    });

    it('should return sleep when sleep is first tie', () => {
      const answers = createAnswers({
        energy: 4,
        sleep: 1,
        structure: 1,
        initiation: 4,
        engagement: 4,
        sustainability: 4,
      });
      
      // sleep and structure are tied at 1, should return sleep (first in order)
      expect(getWeakestDimension(answers)).toBe('sleep');
    });
  });

  describe('parametrized tests for all dimensions', () => {
    test.each(ALL_DIMENSIONS)('should correctly identify %s as weakest', (dimension) => {
      const answers = createAnswersWithWeakest(dimension);
      expect(getWeakestDimension(answers)).toBe(dimension);
    });
  });
});

describe('shouldShowQuickPulse', () => {
  describe('trigger 1: score ≥45', () => {
    it('should return true when latest score is 45', () => {
      const checkins = [createCheckinSummary({ lagScore: 45 })];
      expect(shouldShowQuickPulse(checkins)).toBe(true);
    });

    it('should return true when latest score is above 45', () => {
      const checkins = [createCheckinSummary({ lagScore: 60 })];
      expect(shouldShowQuickPulse(checkins)).toBe(true);
    });

    it('should return false when latest score is 44', () => {
      const checkins = [createCheckinSummary({ lagScore: 44 })];
      expect(shouldShowQuickPulse(checkins)).toBe(false);
    });

    it('should return false when latest score is low', () => {
      const checkins = [createCheckinSummary({ lagScore: 20 })];
      expect(shouldShowQuickPulse(checkins)).toBe(false);
    });
  });

  describe('trigger 2: worsening trend (2 consecutive increases)', () => {
    it('should return true when scores worsen for 2 consecutive weeks', () => {
      const checkins = createWorseningTrend();
      expect(shouldShowQuickPulse(checkins)).toBe(true);
    });

    it('should return false when trend is stable', () => {
      const checkins = createStableTrend();
      expect(shouldShowQuickPulse(checkins)).toBe(false);
    });

    it('should return false when scores improve', () => {
      const now = new Date();
      const checkins = [
        createCheckinSummary({ lagScore: 25, createdAt: now.toISOString() }),
        createCheckinSummary({ lagScore: 35, createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString() }),
        createCheckinSummary({ lagScore: 45, createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString() }),
      ];
      
      expect(shouldShowQuickPulse(checkins)).toBe(false);
    });
  });

  describe('trigger 2: category worsening', () => {
    it('should return true when categories worsen for 2 consecutive weeks', () => {
      const now = new Date();
      const checkins = [
        createCheckinSummary({ 
          lagScore: 40, // Doesn't trigger score threshold
          driftCategory: 'moderate',
          createdAt: now.toISOString(),
        }),
        createCheckinSummary({
          lagScore: 30,
          driftCategory: 'mild',
          createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        }),
        createCheckinSummary({
          lagScore: 15,
          driftCategory: 'aligned',
          createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      ];
      
      expect(shouldShowQuickPulse(checkins)).toBe(true);
    });
  });

  describe('empty/insufficient history', () => {
    it('should return false for empty array', () => {
      expect(shouldShowQuickPulse([])).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(shouldShowQuickPulse(null as unknown as [])).toBe(false);
      expect(shouldShowQuickPulse(undefined as unknown as [])).toBe(false);
    });

    it('should not trigger worsening trend with only 1 check-in', () => {
      const checkins = [createCheckinSummary({ lagScore: 30 })];
      expect(shouldShowQuickPulse(checkins)).toBe(false);
    });

    it('should not trigger worsening trend with only 2 check-ins', () => {
      const now = new Date();
      const checkins = [
        createCheckinSummary({ lagScore: 40, createdAt: now.toISOString() }),
        createCheckinSummary({ lagScore: 30, createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString() }),
      ];
      
      // Score is below 45 and not enough history for trend
      expect(shouldShowQuickPulse(checkins)).toBe(false);
    });
  });

  describe('combined triggers', () => {
    it('should return true when score triggers but trend does not', () => {
      const checkins = [
        createCheckinSummary({ lagScore: 50 }),
        createCheckinSummary({ lagScore: 60 }),
        createCheckinSummary({ lagScore: 70 }),
      ];
      
      expect(shouldShowQuickPulse(checkins)).toBe(true);
    });

    it('should return true when trend triggers but score does not', () => {
      const checkins = createWorseningTrend().map((c, i) => ({
        ...c,
        lagScore: 30 + i * 5, // 30, 35, 40 - worsening but all below 45
      }));
      
      // Wait, this still has scores above 45? Let me recalculate
      // Actually createWorseningTrend returns [50, 40, 30] which are newest to oldest
      // So the trend shows 30 → 40 → 50 (worsening)
      // Latest is 50 which is ≥45, so it would trigger anyway
      
      // Let me create a proper test case
      const now = new Date();
      const properCheckins = [
        createCheckinSummary({ lagScore: 42, createdAt: now.toISOString() }),
        createCheckinSummary({ lagScore: 35, createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString() }),
        createCheckinSummary({ lagScore: 28, createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString() }),
      ];
      
      // 28 → 35 → 42: worsening trend, but 42 < 45
      expect(shouldShowQuickPulse(properCheckins)).toBe(true);
    });
  });
});
