/**
 * Tests for lib/tips.ts
 * Tests getTip for all dimension × category combinations and getAdaptiveTipMessage
 */

import { getTip, getAdaptiveTipMessage } from '@/lib/tips';
import { ALL_DIMENSIONS, ALL_CATEGORIES } from '../utils/test-helpers';
import { DimensionName, DriftCategory } from '@/types';

describe('getTip', () => {
  describe('tip structure', () => {
    it('should return a tip with focus, constraint, and choice properties', () => {
      const tip = getTip('energy', 'moderate');
      
      expect(tip).toHaveProperty('focus');
      expect(tip).toHaveProperty('constraint');
      expect(tip).toHaveProperty('choice');
      expect(typeof tip.focus).toBe('string');
      expect(typeof tip.constraint).toBe('string');
      expect(typeof tip.choice).toBe('string');
    });

    it('should return non-empty strings for all properties', () => {
      const tip = getTip('sleep', 'mild');
      
      expect(tip.focus.length).toBeGreaterThan(0);
      expect(tip.constraint.length).toBeGreaterThan(0);
      expect(tip.choice.length).toBeGreaterThan(0);
    });
  });

  describe('critical category special handling', () => {
    it('should return sleep restoration tip for sleep dimension in critical category', () => {
      const tip = getTip('sleep', 'critical');
      
      expect(tip.focus).toBe('Sleep restoration');
      expect(tip.constraint).toContain('7-9 hours of sleep');
    });

    it('should return load reduction tip for non-sleep dimensions in critical category', () => {
      const nonSleepDimensions: DimensionName[] = ['energy', 'structure', 'initiation', 'engagement', 'sustainability'];
      
      nonSleepDimensions.forEach((dimension) => {
        const tip = getTip(dimension, 'critical');
        
        expect(tip.focus).toBe('Immediate load reduction');
        expect(tip.constraint).toContain('pause or defer');
      });
    });
  });

  describe('all dimension × category combinations', () => {
    // Generate test cases for all 30 combinations (6 dimensions × 5 categories)
    const testCases: [DimensionName, DriftCategory][] = [];
    
    ALL_DIMENSIONS.forEach((dimension) => {
      ALL_CATEGORIES.forEach((category) => {
        testCases.push([dimension, category]);
      });
    });

    test.each(testCases)(
      'should return valid tip for %s dimension with %s category',
      (dimension, category) => {
        const tip = getTip(dimension, category);
        
        expect(tip).toBeDefined();
        expect(tip.focus).toBeDefined();
        expect(tip.constraint).toBeDefined();
        expect(tip.choice).toBeDefined();
      }
    );
  });

  describe('aligned category tips', () => {
    it('should return maintenance-focused tips for aligned category', () => {
      ALL_DIMENSIONS.forEach((dimension) => {
        const tip = getTip(dimension, 'aligned');
        
        expect(tip.focus.toLowerCase()).toContain('maintenance');
      });
    });
  });

  describe('mild category tips', () => {
    it('should return support or consistency focused tips for mild category', () => {
      const tip = getTip('energy', 'mild');
      expect(tip.focus).toContain('preservation');
      
      const sleepTip = getTip('sleep', 'mild');
      expect(sleepTip.focus).toContain('consistency');
    });
  });

  describe('moderate category tips', () => {
    it('should return restoration or rebuilding focused tips', () => {
      const tip = getTip('energy', 'moderate');
      expect(tip.focus).toContain('restoration');
      
      const structureTip = getTip('structure', 'moderate');
      expect(structureTip.focus).toContain('rebuilding');
    });
  });

  describe('heavy category tips', () => {
    it('should return recovery focused tips', () => {
      const tip = getTip('energy', 'heavy');
      expect(tip.focus).toContain('recovery');
    });
  });

  describe('dimension-specific tips', () => {
    it('should return energy-specific tips for energy dimension', () => {
      const tip = getTip('energy', 'moderate');
      expect(tip.focus.toLowerCase()).toContain('energy');
    });

    it('should return sleep-specific tips for sleep dimension', () => {
      const tip = getTip('sleep', 'moderate');
      expect(tip.focus.toLowerCase()).toContain('sleep');
    });

    it('should return structure-specific tips for structure dimension', () => {
      const tip = getTip('structure', 'moderate');
      expect(tip.focus.toLowerCase()).toContain('structure');
    });

    it('should return initiation-specific tips for initiation dimension', () => {
      const tip = getTip('initiation', 'moderate');
      expect(tip.focus.toLowerCase()).toContain('initiation');
    });

    it('should return engagement-specific tips for engagement dimension', () => {
      const tip = getTip('engagement', 'moderate');
      expect(tip.focus.toLowerCase()).toContain('engagement');
    });

    it('should return sustainability-specific tips for sustainability dimension', () => {
      const tip = getTip('sustainability', 'moderate');
      expect(tip.focus.toLowerCase()).toContain('sustainability');
    });
  });

  describe('feedback history (optional parameter)', () => {
    it('should return tip without feedback history', () => {
      const tip = getTip('energy', 'moderate');
      expect(tip).toBeDefined();
    });

    it('should return tip with empty feedback history', () => {
      const tip = getTip('energy', 'moderate', []);
      expect(tip).toBeDefined();
    });

    it('should handle feedback history with helpful feedback', () => {
      const feedbackHistory = [
        {
          dimension: 'energy' as DimensionName,
          category: 'moderate' as DriftCategory,
          feedback: 'helpful' as const,
          createdAt: new Date().toISOString(),
        },
      ];
      
      const tip = getTip('energy', 'moderate', feedbackHistory);
      expect(tip).toBeDefined();
    });

    it('should handle feedback history with not_relevant feedback', () => {
      const feedbackHistory = [
        {
          dimension: 'energy' as DimensionName,
          category: 'moderate' as DriftCategory,
          feedback: 'not_relevant' as const,
          createdAt: new Date().toISOString(),
        },
      ];
      
      const tip = getTip('energy', 'moderate', feedbackHistory);
      expect(tip).toBeDefined();
    });

    it('should handle feedback history for different dimension/category', () => {
      const feedbackHistory = [
        {
          dimension: 'sleep' as DimensionName,
          category: 'mild' as DriftCategory,
          feedback: 'helpful' as const,
          createdAt: new Date().toISOString(),
        },
      ];
      
      // Requesting tip for different dimension/category
      const tip = getTip('energy', 'moderate', feedbackHistory);
      expect(tip).toBeDefined();
    });
  });
});

describe('getAdaptiveTipMessage', () => {
  describe('pattern detection', () => {
    it('should return message when dimension appears 2+ times in recent check-ins', () => {
      const message = getAdaptiveTipMessage('energy', ['energy', 'energy', 'sleep']);
      
      expect(message).not.toBeNull();
      expect(message).toContain('energy');
    });

    it('should return message when dimension appears exactly 2 times', () => {
      const message = getAdaptiveTipMessage('sleep', ['energy', 'sleep', 'sleep']);
      
      expect(message).not.toBeNull();
      expect(message?.toLowerCase()).toContain('sleep');
    });

    it('should return message when dimension appears 3+ times', () => {
      const message = getAdaptiveTipMessage('structure', ['structure', 'structure', 'structure']);
      
      expect(message).not.toBeNull();
      expect(message?.toLowerCase()).toContain('structure');
    });
  });

  describe('no pattern detection', () => {
    it('should return null when dimension appears only once', () => {
      const message = getAdaptiveTipMessage('energy', ['energy', 'sleep', 'structure']);
      
      expect(message).toBeNull();
    });

    it('should return null when dimension does not appear in history', () => {
      const message = getAdaptiveTipMessage('energy', ['sleep', 'structure', 'initiation']);
      
      expect(message).toBeNull();
    });
  });

  describe('empty history', () => {
    it('should return null for empty array', () => {
      const message = getAdaptiveTipMessage('energy', []);
      
      expect(message).toBeNull();
    });
  });

  describe('all dimensions pattern detection', () => {
    test.each(ALL_DIMENSIONS)('should detect pattern for %s dimension', (dimension) => {
      const recentDimensions = [dimension, dimension, 'sleep' as DimensionName];
      const message = getAdaptiveTipMessage(dimension, recentDimensions);
      
      expect(message).not.toBeNull();
    });
  });

  describe('message content', () => {
    it('should include dimension label in message', () => {
      const message = getAdaptiveTipMessage('energy', ['energy', 'energy']);
      
      expect(message).toContain('energy');
    });

    it('should include "weakest dimension" language', () => {
      const message = getAdaptiveTipMessage('sleep', ['sleep', 'sleep', 'sleep']);
      
      expect(message?.toLowerCase()).toContain('weakest dimension');
    });

    it('should suggest focusing on the dimension', () => {
      const message = getAdaptiveTipMessage('initiation', ['initiation', 'initiation']);
      
      expect(message?.toLowerCase()).toContain('focusing');
    });
  });

  describe('dimension label formatting', () => {
    it('should use proper label for task initiation', () => {
      const message = getAdaptiveTipMessage('initiation', ['initiation', 'initiation']);
      
      // The label should be "task initiation" (lowercase in message)
      expect(message?.toLowerCase()).toContain('task initiation');
    });

    it('should use proper label for engagement', () => {
      const message = getAdaptiveTipMessage('engagement', ['engagement', 'engagement']);
      
      // The label should be "engagement / follow-through" (lowercase)
      expect(message?.toLowerCase()).toContain('engagement');
    });

    it('should use proper label for sustainability', () => {
      const message = getAdaptiveTipMessage('sustainability', ['sustainability', 'sustainability']);
      
      expect(message?.toLowerCase()).toContain('effort sustainability');
    });
  });
});
