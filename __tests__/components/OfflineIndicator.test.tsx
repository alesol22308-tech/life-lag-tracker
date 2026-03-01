/**
 * Tests for components/OfflineIndicator.tsx
 * Tests online/offline states, queue count, and toast notifications
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

// Mock next-intl (ESM) so Jest can run the test
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    const messages: Record<string, string> = {
      message: "Check-ins will be saved and synced when you're back online",
      backOnline: 'Back online. Syncing...',
      changesSync: "You're offline. Changes will sync when online.",
      pending: 'pending check-in',
      pendingPlural: 'pending check-ins',
      syncingQueued: values?.count != null ? `Syncing ${values.count} queued check-in(s)...` : 'Syncing queued check-in(s)...',
    };
    return messages[key] ?? key;
  },
}));

// Mock hooks and functions before importing component
let mockIsOnline = true;
let mockQueueCount = 0;

jest.mock('@/lib/hooks/useOnlineStatus', () => ({
  useOnlineStatus: () => mockIsOnline,
}));

jest.mock('@/lib/offline-queue', () => ({
  getQueueCount: jest.fn(() => Promise.resolve(mockQueueCount)),
}));

import OfflineIndicator from '@/components/OfflineIndicator';

describe('OfflineIndicator', () => {
  beforeEach(() => {
    mockIsOnline = true;
    mockQueueCount = 0;
    jest.clearAllMocks();
  });

  describe('offline state', () => {
    it('should show offline message when offline', async () => {
      mockIsOnline = false;
      mockQueueCount = 0;

      render(<OfflineIndicator />);

      // Wait for the specific persistent offline message to appear
      await waitFor(() => {
        expect(screen.getByText(/Check-ins will be saved/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should show queue count in offline message when items queued', async () => {
      mockIsOnline = false;
      mockQueueCount = 3;

      render(<OfflineIndicator />);

      // Wait for queue count to be displayed (UI shows "3 pending check-ins")
      await waitFor(() => {
        expect(screen.getByText(/3 pending check-ins/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('online with queued items', () => {
    it('should show syncing message when online with queued items', async () => {
      mockIsOnline = true;
      mockQueueCount = 2;

      render(<OfflineIndicator />);

      // Wait for syncing message
      await waitFor(() => {
        expect(screen.getByText(/syncing 2 queued/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('online with no queue', () => {
    it('should not show persistent offline message when online and no queue', async () => {
      mockIsOnline = true;
      mockQueueCount = 0;

      render(<OfflineIndicator />);

      // Wait a bit for async state updates
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should not show the persistent offline message
      expect(screen.queryByText(/Check-ins will be saved/i)).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper accessibility attributes when showing offline indicator', async () => {
      mockIsOnline = false;
      mockQueueCount = 0;

      render(<OfflineIndicator />);

      // Wait for the indicator to appear
      await waitFor(() => {
        expect(screen.getByText(/Check-ins will be saved/i)).toBeInTheDocument();
      }, { timeout: 3000 });

      // Check for role and aria-live
      const statusElements = screen.getAllByRole('status');
      expect(statusElements.length).toBeGreaterThan(0);
      
      // At least one should have aria-live
      const hasAriaLive = statusElements.some(el => el.getAttribute('aria-live') === 'polite');
      expect(hasAriaLive).toBe(true);
    });
  });
});
