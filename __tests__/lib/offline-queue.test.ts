/**
 * Tests for lib/offline-queue.ts
 * Tests enqueueCheckin, processQueue, getQueueCount, submitCheckin
 * Uses mocked IndexedDB via fake-indexeddb
 */

import 'fake-indexeddb/auto';
import { createAnswers, createMockResponse, createMockOfflineCheckin } from '../utils/test-helpers';

// Mock the indexeddb module
const mockAddOfflineCheckin = jest.fn();
const mockGetUnsyncedCheckins = jest.fn();
const mockDeleteOfflineCheckin = jest.fn();
const mockGetUnsyncedCount = jest.fn();

jest.mock('@/lib/indexeddb', () => ({
  addOfflineCheckin: (...args: unknown[]) => mockAddOfflineCheckin(...args),
  getUnsyncedCheckins: (...args: unknown[]) => mockGetUnsyncedCheckins(...args),
  deleteOfflineCheckin: (...args: unknown[]) => mockDeleteOfflineCheckin(...args),
  getUnsyncedCount: (...args: unknown[]) => mockGetUnsyncedCount(...args),
}));

// Import after mocking
import {
  enqueueCheckin,
  processQueue,
  getQueueCount,
  submitCheckin,
} from '@/lib/offline-queue';

describe('enqueueCheckin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('successful queueing', () => {
    it('should queue check-in with answers', async () => {
      const answers = createAnswers();
      const mockId = 'offline-123';
      mockAddOfflineCheckin.mockResolvedValue(mockId);

      const result = await enqueueCheckin(answers);

      expect(mockAddOfflineCheckin).toHaveBeenCalledWith(answers, undefined);
      expect(result).toBe(mockId);
    });

    it('should queue check-in with answers and reflection note', async () => {
      const answers = createAnswers();
      const reflectionNote = 'Feeling tired today';
      const mockId = 'offline-456';
      mockAddOfflineCheckin.mockResolvedValue(mockId);

      const result = await enqueueCheckin(answers, reflectionNote);

      expect(mockAddOfflineCheckin).toHaveBeenCalledWith(answers, reflectionNote);
      expect(result).toBe(mockId);
    });

    it('should return unique queue ID', async () => {
      const answers = createAnswers();
      mockAddOfflineCheckin.mockResolvedValueOnce('offline-001');
      mockAddOfflineCheckin.mockResolvedValueOnce('offline-002');

      const result1 = await enqueueCheckin(answers);
      const result2 = await enqueueCheckin(answers);

      expect(result1).not.toBe(result2);
    });
  });

  describe('error handling', () => {
    it('should throw error when queueing fails', async () => {
      const answers = createAnswers();
      mockAddOfflineCheckin.mockRejectedValue(new Error('IndexedDB error'));

      await expect(enqueueCheckin(answers)).rejects.toThrow('IndexedDB error');
    });
  });
});

describe('processQueue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  describe('empty queue', () => {
    it('should return zero counts when queue is empty', async () => {
      mockGetUnsyncedCheckins.mockResolvedValue([]);

      const result = await processQueue();

      expect(result).toEqual({ synced: 0, failed: 0 });
    });
  });

  describe('successful sync', () => {
    it('should sync queued check-ins successfully', async () => {
      const mockCheckins = [
        createMockOfflineCheckin({ id: 'offline-1' }),
        createMockOfflineCheckin({ id: 'offline-2' }),
      ];
      mockGetUnsyncedCheckins.mockResolvedValue(mockCheckins);
      mockDeleteOfflineCheckin.mockResolvedValue(undefined);
      (global.fetch as jest.Mock).mockResolvedValue(
        createMockResponse({ success: true }, { ok: true, status: 200 })
      );

      const result = await processQueue();

      expect(result.synced).toBe(2);
      expect(result.failed).toBe(0);
      expect(mockDeleteOfflineCheckin).toHaveBeenCalledTimes(2);
    });

    it('should delete check-in from queue after successful sync', async () => {
      const mockCheckin = createMockOfflineCheckin({ id: 'offline-123' });
      mockGetUnsyncedCheckins.mockResolvedValue([mockCheckin]);
      mockDeleteOfflineCheckin.mockResolvedValue(undefined);
      (global.fetch as jest.Mock).mockResolvedValue(
        createMockResponse({ success: true }, { ok: true })
      );

      await processQueue();

      expect(mockDeleteOfflineCheckin).toHaveBeenCalledWith('offline-123');
    });
  });

  describe('API failures', () => {
    it('should keep check-in in queue when API fails', async () => {
      const mockCheckin = createMockOfflineCheckin({ id: 'offline-fail' });
      mockGetUnsyncedCheckins.mockResolvedValue([mockCheckin]);
      (global.fetch as jest.Mock).mockResolvedValue(
        createMockResponse({ error: 'Server error' }, { ok: false, status: 500 })
      );

      const result = await processQueue();

      expect(result.synced).toBe(0);
      expect(result.failed).toBe(1);
      expect(mockDeleteOfflineCheckin).not.toHaveBeenCalled();
    });

    it('should handle mixed success and failure', async () => {
      const mockCheckins = [
        createMockOfflineCheckin({ id: 'offline-1' }),
        createMockOfflineCheckin({ id: 'offline-2' }),
        createMockOfflineCheckin({ id: 'offline-3' }),
      ];
      mockGetUnsyncedCheckins.mockResolvedValue(mockCheckins);
      
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse({ success: true }, { ok: true }))
        .mockResolvedValueOnce(createMockResponse({ error: 'Failed' }, { ok: false, status: 500 }))
        .mockResolvedValueOnce(createMockResponse({ success: true }, { ok: true }));
      
      mockDeleteOfflineCheckin.mockResolvedValue(undefined);

      const result = await processQueue();

      expect(result.synced).toBe(2);
      expect(result.failed).toBe(1);
      expect(mockDeleteOfflineCheckin).toHaveBeenCalledTimes(2);
    });
  });

  describe('return correct counts', () => {
    it('should return accurate synced count', async () => {
      const mockCheckins = Array(5).fill(null).map((_, i) => 
        createMockOfflineCheckin({ id: `offline-${i}` })
      );
      mockGetUnsyncedCheckins.mockResolvedValue(mockCheckins);
      mockDeleteOfflineCheckin.mockResolvedValue(undefined);
      (global.fetch as jest.Mock).mockResolvedValue(
        createMockResponse({ success: true }, { ok: true })
      );

      const result = await processQueue();

      expect(result.synced).toBe(5);
      expect(result.failed).toBe(0);
    });

    it('should return accurate failed count', async () => {
      const mockCheckins = Array(3).fill(null).map((_, i) => 
        createMockOfflineCheckin({ id: `offline-${i}` })
      );
      mockGetUnsyncedCheckins.mockResolvedValue(mockCheckins);
      (global.fetch as jest.Mock).mockResolvedValue(
        createMockResponse({ error: 'Failed' }, { ok: false, status: 500 })
      );

      const result = await processQueue();

      expect(result.synced).toBe(0);
      expect(result.failed).toBe(3);
    });
  });
});

describe('getQueueCount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('count retrieval', () => {
    it('should return correct count', async () => {
      mockGetUnsyncedCount.mockResolvedValue(5);

      const count = await getQueueCount();

      expect(count).toBe(5);
    });

    it('should return 0 when queue is empty', async () => {
      mockGetUnsyncedCount.mockResolvedValue(0);

      const count = await getQueueCount();

      expect(count).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should return 0 when error occurs', async () => {
      mockGetUnsyncedCount.mockRejectedValue(new Error('IndexedDB error'));

      const count = await getQueueCount();

      expect(count).toBe(0);
    });
  });
});

describe('submitCheckin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  describe('online submission', () => {
    it('should submit directly when online', async () => {
      const answers = createAnswers();
      const mockResult = {
        lagScore: 35,
        driftCategory: 'moderate',
        weakestDimension: 'energy',
      };
      (global.fetch as jest.Mock).mockResolvedValue(
        createMockResponse(mockResult, { ok: true })
      );

      const result = await submitCheckin(answers, true);

      expect(result.queued).toBeUndefined();
      expect(result.result).toBeDefined();
      expect(fetch).toHaveBeenCalledWith('/api/checkin', expect.any(Object));
    });

    it('should include answers in request body', async () => {
      const answers = createAnswers({ energy: 2, sleep: 4 });
      (global.fetch as jest.Mock).mockResolvedValue(
        createMockResponse({ lagScore: 30 }, { ok: true })
      );

      await submitCheckin(answers, true);

      expect(fetch).toHaveBeenCalledWith(
        '/api/checkin',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"energy":2'),
        })
      );
    });

    it('should include reflection note when provided', async () => {
      const answers = createAnswers();
      const reflectionNote = 'Good week overall';
      (global.fetch as jest.Mock).mockResolvedValue(
        createMockResponse({ lagScore: 30 }, { ok: true })
      );

      await submitCheckin(answers, true, reflectionNote);

      expect(fetch).toHaveBeenCalledWith(
        '/api/checkin',
        expect.objectContaining({
          body: expect.stringContaining('Good week overall'),
        })
      );
    });
  });

  describe('offline queueing', () => {
    it('should queue when offline', async () => {
      const answers = createAnswers();
      const mockQueueId = 'offline-queued-123';
      mockAddOfflineCheckin.mockResolvedValue(mockQueueId);

      const result = await submitCheckin(answers, false);

      expect(result.queued).toBe(true);
      expect(result.queueId).toBe(mockQueueId);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should queue with reflection note when offline', async () => {
      const answers = createAnswers();
      const reflectionNote = 'Test note';
      const mockQueueId = 'offline-456';
      mockAddOfflineCheckin.mockResolvedValue(mockQueueId);

      await submitCheckin(answers, false, reflectionNote);

      expect(mockAddOfflineCheckin).toHaveBeenCalledWith(answers, reflectionNote);
    });
  });

  describe('network error fallback', () => {
    it('should queue when fetch throws network error', async () => {
      const answers = createAnswers();
      const mockQueueId = 'offline-network-error';
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      mockAddOfflineCheckin.mockResolvedValue(mockQueueId);

      const result = await submitCheckin(answers, true);

      expect(result.queued).toBe(true);
      expect(result.queueId).toBe(mockQueueId);
    });
  });

  describe('500 error fallback', () => {
    it('should queue when server returns 500 error', async () => {
      const answers = createAnswers();
      const mockQueueId = 'offline-500-error';
      (global.fetch as jest.Mock).mockResolvedValue(
        createMockResponse({ error: 'Server error' }, { ok: false, status: 500 })
      );
      mockAddOfflineCheckin.mockResolvedValue(mockQueueId);

      const result = await submitCheckin(answers, true);

      expect(result.queued).toBe(true);
      expect(result.queueId).toBe(mockQueueId);
    });

    it('should queue when server returns 503 error', async () => {
      const answers = createAnswers();
      const mockQueueId = 'offline-503-error';
      (global.fetch as jest.Mock).mockResolvedValue(
        createMockResponse({ error: 'Service unavailable' }, { ok: false, status: 503 })
      );
      mockAddOfflineCheckin.mockResolvedValue(mockQueueId);

      const result = await submitCheckin(answers, true);

      expect(result.queued).toBe(true);
    });
  });

  describe('client error handling', () => {
    it('should queue even for 400 status due to error handling', async () => {
      // Note: The current implementation catches all errors in the try/catch
      // and queues them. This test documents the actual behavior.
      // If you want 400 errors to throw, the catch block needs to be updated.
      const answers = createAnswers();
      const mockQueueId = 'offline-400-error';
      (global.fetch as jest.Mock).mockResolvedValue(
        createMockResponse({ error: 'Bad request' }, { ok: false, status: 400 })
      );
      mockAddOfflineCheckin.mockResolvedValue(mockQueueId);

      // Due to the catch block, 400 errors get queued as well
      const result = await submitCheckin(answers, true);
      
      expect(result.queued).toBe(true);
    });
  });
});
