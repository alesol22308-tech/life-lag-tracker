/**
 * Tests for lib/export.ts
 * Tests exportToJSON, exportToCSV, and generateExportFilename
 */

import { exportToJSON, exportToCSV, generateExportFilename, ExportData } from '@/lib/export';
import { createExportData, createExportCheckin, createAnswers } from '../utils/test-helpers';

describe('exportToJSON', () => {
  describe('valid data structure', () => {
    it('should return valid JSON string', () => {
      const data = createExportData();
      const result = exportToJSON(data);
      
      expect(() => JSON.parse(result)).not.toThrow();
    });

    it('should preserve all data fields', () => {
      const data = createExportData({
        user_id: 'test-user-123',
        total_checkins: 5,
      });
      const result = exportToJSON(data);
      const parsed = JSON.parse(result);
      
      expect(parsed.user_id).toBe('test-user-123');
      expect(parsed.total_checkins).toBe(5);
      expect(parsed.checkins).toBeDefined();
      expect(Array.isArray(parsed.checkins)).toBe(true);
    });

    it('should include checkin details', () => {
      const checkin = createExportCheckin({
        lag_score: 42,
        drift_category: 'moderate',
        weakest_dimension: 'energy',
      });
      const data = createExportData({ checkins: [checkin] });
      const result = exportToJSON(data);
      const parsed = JSON.parse(result);
      
      expect(parsed.checkins[0].lag_score).toBe(42);
      expect(parsed.checkins[0].drift_category).toBe('moderate');
      expect(parsed.checkins[0].weakest_dimension).toBe('energy');
    });
  });

  describe('JSON formatting', () => {
    it('should be formatted with 2-space indentation', () => {
      const data = createExportData();
      const result = exportToJSON(data);
      
      // Check for indentation (should have newlines and spaces)
      expect(result).toContain('\n');
      expect(result).toContain('  ');
    });

    it('should be human-readable', () => {
      const data = createExportData();
      const result = exportToJSON(data);
      
      // Should have multiple lines
      const lines = result.split('\n');
      expect(lines.length).toBeGreaterThan(1);
    });
  });

  describe('answer values', () => {
    it('should include all 6 answer dimensions', () => {
      const answers = createAnswers({
        energy: 3,
        sleep: 4,
        structure: 2,
        initiation: 5,
        engagement: 1,
        sustainability: 3,
      });
      const checkin = createExportCheckin({ answers });
      const data = createExportData({ checkins: [checkin] });
      const result = exportToJSON(data);
      const parsed = JSON.parse(result);
      
      expect(parsed.checkins[0].answers.energy).toBe(3);
      expect(parsed.checkins[0].answers.sleep).toBe(4);
      expect(parsed.checkins[0].answers.structure).toBe(2);
      expect(parsed.checkins[0].answers.initiation).toBe(5);
      expect(parsed.checkins[0].answers.engagement).toBe(1);
      expect(parsed.checkins[0].answers.sustainability).toBe(3);
    });
  });
});

describe('exportToCSV', () => {
  describe('valid CSV format', () => {
    it('should include headers row', () => {
      const data = createExportData();
      const result = exportToCSV(data);
      const lines = result.split('\n');
      
      expect(lines[0]).toContain('Date');
      expect(lines[0]).toContain('Lag Score');
      expect(lines[0]).toContain('Drift Category');
    });

    it('should have correct number of columns in header', () => {
      const data = createExportData();
      const result = exportToCSV(data);
      const lines = result.split('\n');
      const headerColumns = lines[0].split(',');
      
      // Expected columns: Date, Lag Score, Drift Category, Weakest Dimension,
      // Energy, Sleep, Structure, Initiation, Engagement, Sustainability,
      // Score Delta, Reflection Note
      expect(headerColumns.length).toBe(12);
    });

    it('should include data rows for each checkin', () => {
      const data = createExportData({
        checkins: [
          createExportCheckin({ lag_score: 30 }),
          createExportCheckin({ lag_score: 40 }),
        ],
        total_checkins: 2,
      });
      const result = exportToCSV(data);
      const lines = result.split('\n');
      
      // Header + 2 data rows
      expect(lines.length).toBe(3);
    });
  });

  describe('field escaping', () => {
    it('should escape fields containing commas', () => {
      const checkin = createExportCheckin({
        reflection_notes: 'First thought, second thought',
      });
      const data = createExportData({ checkins: [checkin] });
      const result = exportToCSV(data);
      
      // Field with comma should be wrapped in quotes
      expect(result).toContain('"First thought, second thought"');
    });

    it('should escape fields containing quotes', () => {
      const checkin = createExportCheckin({
        reflection_notes: 'She said "hello"',
      });
      const data = createExportData({ checkins: [checkin] });
      const result = exportToCSV(data);
      
      // Quotes should be doubled and field wrapped
      expect(result).toContain('"She said ""hello"""');
    });

    it('should escape fields containing newlines', () => {
      const checkin = createExportCheckin({
        reflection_notes: 'Line 1\nLine 2',
      });
      const data = createExportData({ checkins: [checkin] });
      const result = exportToCSV(data);
      
      // Field with newline should be wrapped in quotes
      expect(result).toContain('"Line 1\nLine 2"');
    });

    it('should handle complex escaping scenarios', () => {
      const checkin = createExportCheckin({
        reflection_notes: 'She said, "Let\'s go"\nAnd we went',
      });
      const data = createExportData({ checkins: [checkin] });
      const result = exportToCSV(data);
      
      // Should be properly escaped
      expect(result).toContain('"She said, ""Let\'s go""\nAnd we went"');
    });
  });

  describe('multiple checkins', () => {
    it('should export all checkins correctly', () => {
      const checkins = [
        createExportCheckin({ lag_score: 25, drift_category: 'mild' }),
        createExportCheckin({ lag_score: 45, drift_category: 'moderate' }),
        createExportCheckin({ lag_score: 65, drift_category: 'heavy' }),
      ];
      const data = createExportData({ checkins, total_checkins: 3 });
      const result = exportToCSV(data);
      const lines = result.split('\n');
      
      expect(lines.length).toBe(4); // Header + 3 rows
      expect(lines[1]).toContain('25');
      expect(lines[2]).toContain('45');
      expect(lines[3]).toContain('65');
    });
  });

  describe('missing optional fields', () => {
    it('should handle missing score_delta', () => {
      const checkin = createExportCheckin({ score_delta: undefined });
      const data = createExportData({ checkins: [checkin] });
      const result = exportToCSV(data);
      
      // Should not throw
      expect(result).toBeDefined();
      // The empty field should result in empty value in CSV
      const lines = result.split('\n');
      expect(lines.length).toBe(2);
    });

    it('should handle missing reflection_notes', () => {
      const checkin = createExportCheckin({ reflection_notes: undefined });
      const data = createExportData({ checkins: [checkin] });
      const result = exportToCSV(data);
      
      expect(result).toBeDefined();
    });

    it('should handle empty reflection_notes', () => {
      const checkin = createExportCheckin({ reflection_notes: '' });
      const data = createExportData({ checkins: [checkin] });
      const result = exportToCSV(data);
      
      expect(result).toBeDefined();
    });
  });

  describe('answer values in CSV', () => {
    it('should include all dimension values', () => {
      const answers = createAnswers({
        energy: 1,
        sleep: 2,
        structure: 3,
        initiation: 4,
        engagement: 5,
        sustainability: 3,
      });
      const checkin = createExportCheckin({ answers });
      const data = createExportData({ checkins: [checkin] });
      const result = exportToCSV(data);
      const lines = result.split('\n');
      const dataRow = lines[1];
      
      // Should contain the answer values
      expect(dataRow).toContain('1');
      expect(dataRow).toContain('2');
      expect(dataRow).toContain('3');
      expect(dataRow).toContain('4');
      expect(dataRow).toContain('5');
    });
  });
});

describe('generateExportFilename', () => {
  describe('JSON format', () => {
    it('should generate filename with json extension', () => {
      const filename = generateExportFilename('json');
      
      expect(filename.endsWith('.json')).toBe(true);
    });

    it('should include lifelag-data prefix', () => {
      const filename = generateExportFilename('json');
      
      expect(filename.startsWith('lifelag-data-')).toBe(true);
    });

    it('should include date in YYYY-MM-DD format', () => {
      const filename = generateExportFilename('json');
      const datePattern = /lifelag-data-\d{4}-\d{2}-\d{2}\.json/;
      
      expect(filename).toMatch(datePattern);
    });
  });

  describe('CSV format', () => {
    it('should generate filename with csv extension', () => {
      const filename = generateExportFilename('csv');
      
      expect(filename.endsWith('.csv')).toBe(true);
    });

    it('should include lifelag-data prefix', () => {
      const filename = generateExportFilename('csv');
      
      expect(filename.startsWith('lifelag-data-')).toBe(true);
    });

    it('should include date in YYYY-MM-DD format', () => {
      const filename = generateExportFilename('csv');
      const datePattern = /lifelag-data-\d{4}-\d{2}-\d{2}\.csv/;
      
      expect(filename).toMatch(datePattern);
    });
  });

  describe('date format validation', () => {
    it('should use current date', () => {
      const filename = generateExportFilename('json');
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      expect(filename).toContain(today);
    });
  });
});
