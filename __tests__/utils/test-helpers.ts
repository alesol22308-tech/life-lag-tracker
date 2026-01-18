/**
 * Shared test utilities and mock data factories
 */

import { Answers, DriftCategory, DimensionName, CheckinSummary, Tip } from '@/types';
import { ExportData, ExportCheckin } from '@/lib/export';

// ============================================
// Mock Data Factories
// ============================================

/**
 * Create mock answers with optional overrides
 */
export function createAnswers(overrides: Partial<Answers> = {}): Answers {
  return {
    energy: 3,
    sleep: 3,
    structure: 3,
    initiation: 3,
    engagement: 3,
    sustainability: 3,
    ...overrides,
  };
}

/**
 * Create answers that will produce a specific lag score range
 */
export function createAnswersForScore(targetScore: 'low' | 'medium' | 'high' | 'critical'): Answers {
  switch (targetScore) {
    case 'low': // aligned (0-19)
      return createAnswers({ energy: 5, sleep: 5, structure: 5, initiation: 5, engagement: 5, sustainability: 5 });
    case 'medium': // mild-moderate (20-54)
      return createAnswers({ energy: 3, sleep: 3, structure: 3, initiation: 3, engagement: 3, sustainability: 3 });
    case 'high': // heavy (55-74)
      return createAnswers({ energy: 2, sleep: 2, structure: 2, initiation: 2, engagement: 2, sustainability: 2 });
    case 'critical': // critical (75-100)
      return createAnswers({ energy: 1, sleep: 1, structure: 1, initiation: 1, engagement: 1, sustainability: 1 });
  }
}

/**
 * Create answers with a specific weakest dimension
 */
export function createAnswersWithWeakest(weakest: DimensionName): Answers {
  const answers = createAnswers({
    energy: 4,
    sleep: 4,
    structure: 4,
    initiation: 4,
    engagement: 4,
    sustainability: 4,
  });
  answers[weakest] = 1;
  return answers;
}

/**
 * Create mock check-in summary
 */
export function createCheckinSummary(overrides: Partial<CheckinSummary> = {}): CheckinSummary {
  return {
    id: `checkin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    lagScore: 35,
    driftCategory: 'moderate',
    weakestDimension: 'energy',
    focusText: 'Energy restoration',
    createdAt: new Date().toISOString(),
    scoreDelta: undefined,
    narrativeSummary: undefined,
    reflectionNote: undefined,
    microGoalCompletionStatus: undefined,
    ...overrides,
  };
}

/**
 * Create a series of check-in summaries with worsening trend
 */
export function createWorseningTrend(): CheckinSummary[] {
  const now = new Date();
  return [
    createCheckinSummary({
      lagScore: 50,
      driftCategory: 'moderate',
      createdAt: now.toISOString(),
    }),
    createCheckinSummary({
      lagScore: 40,
      driftCategory: 'moderate',
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    }),
    createCheckinSummary({
      lagScore: 30,
      driftCategory: 'mild',
      createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    }),
  ];
}

/**
 * Create a series of check-in summaries with stable trend
 */
export function createStableTrend(): CheckinSummary[] {
  const now = new Date();
  return [
    createCheckinSummary({
      lagScore: 35,
      driftCategory: 'moderate',
      createdAt: now.toISOString(),
    }),
    createCheckinSummary({
      lagScore: 34,
      driftCategory: 'mild',
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    }),
    createCheckinSummary({
      lagScore: 36,
      driftCategory: 'moderate',
      createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    }),
  ];
}

/**
 * Create mock tip
 */
export function createTip(overrides: Partial<Tip> = {}): Tip {
  return {
    focus: 'Energy restoration',
    constraint: 'Reduce one high-energy-demand activity this week by 50%',
    choice: 'Select which activity, and how you\'ll scale it back',
    ...overrides,
  };
}

/**
 * Create mock export checkin
 */
export function createExportCheckin(overrides: Partial<ExportCheckin> = {}): ExportCheckin {
  return {
    id: `checkin-${Date.now()}`,
    created_at: new Date().toISOString(),
    lag_score: 35,
    drift_category: 'moderate',
    weakest_dimension: 'energy',
    answers: createAnswers(),
    reflection_notes: undefined,
    score_delta: undefined,
    narrative_summary: undefined,
    ...overrides,
  };
}

/**
 * Create mock export data
 */
export function createExportData(overrides: Partial<ExportData> = {}): ExportData {
  return {
    user_id: 'test-user-id',
    export_date: new Date().toISOString(),
    total_checkins: 1,
    checkins: [createExportCheckin()],
    ...overrides,
  };
}

// ============================================
// Mock IndexedDB Helpers
// ============================================

/**
 * Mock offline checkin stored in IndexedDB
 */
export interface MockOfflineCheckin {
  id: string;
  answers: Answers;
  reflectionNote?: string;
  timestamp: number;
  synced: boolean;
}

/**
 * Create mock offline checkin
 */
export function createMockOfflineCheckin(overrides: Partial<MockOfflineCheckin> = {}): MockOfflineCheckin {
  return {
    id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    answers: createAnswers(),
    reflectionNote: undefined,
    timestamp: Date.now(),
    synced: false,
    ...overrides,
  };
}

// ============================================
// Mock API Response Helpers
// ============================================

/**
 * Create mock fetch response
 */
export function createMockResponse<T>(data: T, options: { ok?: boolean; status?: number } = {}): Response {
  const { ok = true, status = 200 } = options;
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers(),
    redirected: false,
    type: 'basic',
    url: '',
    clone: () => createMockResponse(data, options),
    body: null,
    bodyUsed: false,
    arrayBuffer: async () => new ArrayBuffer(0),
    blob: async () => new Blob(),
    formData: async () => new FormData(),
    bytes: async () => new Uint8Array(),
  } as Response;
}

/**
 * Setup mock fetch with predefined responses
 */
export function setupMockFetch(responses: Record<string, { data: unknown; ok?: boolean; status?: number }>) {
  const mockFetch = jest.fn((url: string) => {
    const response = responses[url];
    if (response) {
      return Promise.resolve(createMockResponse(response.data, { ok: response.ok, status: response.status }));
    }
    return Promise.reject(new Error(`Unhandled fetch to ${url}`));
  });
  
  global.fetch = mockFetch;
  return mockFetch;
}

// ============================================
// Dimension and Category Lists
// ============================================

export const ALL_DIMENSIONS: DimensionName[] = [
  'energy',
  'sleep',
  'structure',
  'initiation',
  'engagement',
  'sustainability',
];

export const ALL_CATEGORIES: DriftCategory[] = [
  'aligned',
  'mild',
  'moderate',
  'heavy',
  'critical',
];

// ============================================
// Wait Helpers
// ============================================

/**
 * Wait for a specified time
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wait for next tick
 */
export function waitForNextTick(): Promise<void> {
  return new Promise((resolve) => process.nextTick(resolve));
}
