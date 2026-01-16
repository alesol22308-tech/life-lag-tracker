/**
 * Data Export Utilities
 * Handles exporting user data to JSON and CSV formats
 */

import { Answers } from '@/types';

export interface ExportCheckin {
  id: string;
  created_at: string;
  lag_score: number;
  drift_category: string;
  weakest_dimension: string;
  answers: Answers;
  reflection_notes?: string;
  score_delta?: number;
  narrative_summary?: string;
}

export interface ExportData {
  user_id: string;
  export_date: string;
  total_checkins: number;
  checkins: ExportCheckin[];
}

/**
 * Export data as JSON
 */
export function exportToJSON(data: ExportData): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Export data as CSV
 * Creates a flattened view of check-ins with all answers as separate columns
 */
export function exportToCSV(data: ExportData): string {
  const headers = [
    'Date',
    'Lag Score',
    'Drift Category',
    'Weakest Dimension',
    'Energy',
    'Sleep',
    'Structure',
    'Initiation',
    'Engagement',
    'Sustainability',
    'Score Delta',
    'Reflection Note',
  ];

  const rows = data.checkins.map((checkin) => {
    return [
      new Date(checkin.created_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      checkin.lag_score.toString(),
      checkin.drift_category,
      checkin.weakest_dimension,
      checkin.answers.energy.toString(),
      checkin.answers.sleep.toString(),
      checkin.answers.structure.toString(),
      checkin.answers.initiation.toString(),
      checkin.answers.engagement.toString(),
      checkin.answers.sustainability.toString(),
      checkin.score_delta?.toString() || '',
      escapeCSVField(checkin.reflection_notes || ''),
    ];
  });

  // Combine headers and rows
  const csvLines = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ];

  return csvLines.join('\n');
}

/**
 * Escape CSV field values that contain commas, quotes, or newlines
 */
function escapeCSVField(field: string): string {
  if (!field) return '';
  
  // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  
  return field;
}

/**
 * Generate filename for export
 */
export function generateExportFilename(format: 'json' | 'csv'): string {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `lifelag-data-${date}.${format}`;
}
