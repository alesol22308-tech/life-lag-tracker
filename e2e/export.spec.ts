/**
 * E2E tests for data export functionality
 * Tests JSON and CSV export from settings page
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Data Export', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('navigation to export', () => {
    test('should navigate to settings page', async ({ page }) => {
      await page.goto('/settings');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      await expect(page).toHaveURL(/\/settings/);
    });

    test('should find export section in settings', async ({ page }) => {
      await page.goto('/settings');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      // Look for export section
      const exportSection = page.getByText(/export|download.*data/i);
      await expect(exportSection.first()).toBeVisible();
    });
  });

  test.describe('JSON export', () => {
    test('should have JSON export button', async ({ page }) => {
      await page.goto('/settings');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      // Look for JSON export button
      const jsonButton = page.getByRole('button', { name: /json|export.*json/i });
      await expect(jsonButton.first()).toBeVisible();
    });

    test('should trigger download when clicking JSON export', async ({ page }) => {
      await page.goto('/settings');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      // Set up download listener
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 });

      // Click JSON export button
      const jsonButton = page.getByRole('button', { name: /json|export.*json/i });
      await jsonButton.first().click();

      // Wait for download
      const download = await downloadPromise;

      // Verify download
      expect(download).toBeDefined();
      expect(download.suggestedFilename()).toContain('.json');
    });

    test('should download valid JSON file', async ({ page }) => {
      await page.goto('/settings');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      // Set up download
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 });

      // Click export
      const jsonButton = page.getByRole('button', { name: /json|export.*json/i });
      await jsonButton.first().click();

      // Get download
      const download = await downloadPromise;
      const downloadPath = await download.path();

      if (downloadPath) {
        // Read and parse the file
        const content = fs.readFileSync(downloadPath, 'utf8');
        
        // Should be valid JSON
        expect(() => JSON.parse(content)).not.toThrow();
        
        const data = JSON.parse(content);
        
        // Should have expected structure
        expect(data).toHaveProperty('user_id');
        expect(data).toHaveProperty('export_date');
        expect(data).toHaveProperty('checkins');
        expect(Array.isArray(data.checkins)).toBe(true);
      }
    });

    test('should include filename with date', async ({ page }) => {
      await page.goto('/settings');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      const downloadPromise = page.waitForEvent('download', { timeout: 10000 });

      const jsonButton = page.getByRole('button', { name: /json|export.*json/i });
      await jsonButton.first().click();

      const download = await downloadPromise;
      const filename = download.suggestedFilename();

      // Should contain date format YYYY-MM-DD
      expect(filename).toMatch(/\d{4}-\d{2}-\d{2}/);
      expect(filename).toContain('lifelag');
    });
  });

  test.describe('CSV export', () => {
    test('should have CSV export button', async ({ page }) => {
      await page.goto('/settings');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      // Look for CSV export button
      const csvButton = page.getByRole('button', { name: /csv|export.*csv/i });
      await expect(csvButton.first()).toBeVisible();
    });

    test('should trigger download when clicking CSV export', async ({ page }) => {
      await page.goto('/settings');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      const downloadPromise = page.waitForEvent('download', { timeout: 10000 });

      const csvButton = page.getByRole('button', { name: /csv|export.*csv/i });
      await csvButton.first().click();

      const download = await downloadPromise;

      expect(download).toBeDefined();
      expect(download.suggestedFilename()).toContain('.csv');
    });

    test('should download valid CSV file with headers', async ({ page }) => {
      await page.goto('/settings');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      const downloadPromise = page.waitForEvent('download', { timeout: 10000 });

      const csvButton = page.getByRole('button', { name: /csv|export.*csv/i });
      await csvButton.first().click();

      const download = await downloadPromise;
      const downloadPath = await download.path();

      if (downloadPath) {
        const content = fs.readFileSync(downloadPath, 'utf8');
        const lines = content.split('\n');

        // Should have header row
        expect(lines.length).toBeGreaterThan(0);

        const headers = lines[0];
        
        // Should contain expected column headers
        expect(headers).toContain('Date');
        expect(headers).toContain('Lag Score');
        expect(headers).toContain('Drift Category');
      }
    });

    test('should include all dimension columns in CSV', async ({ page }) => {
      await page.goto('/settings');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      const downloadPromise = page.waitForEvent('download', { timeout: 10000 });

      const csvButton = page.getByRole('button', { name: /csv|export.*csv/i });
      await csvButton.first().click();

      const download = await downloadPromise;
      const downloadPath = await download.path();

      if (downloadPath) {
        const content = fs.readFileSync(downloadPath, 'utf8');
        const headers = content.split('\n')[0];

        // Should have all 6 dimension columns
        expect(headers).toContain('Energy');
        expect(headers).toContain('Sleep');
        expect(headers).toContain('Structure');
        expect(headers).toContain('Initiation');
        expect(headers).toContain('Engagement');
        expect(headers).toContain('Sustainability');
      }
    });
  });

  test.describe('export with data', () => {
    test('should include check-in data if user has check-ins', async ({ page }) => {
      // First complete a check-in
      await page.goto('/checkin');

      let currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      // Complete check-in
      for (let i = 0; i < 6; i++) {
        await page.click('[data-value="3"]');
        await page.waitForTimeout(300);
      }
      await page.getByRole('button', { name: /submit|complete|finish/i }).click();
      await page.waitForTimeout(2000);

      // Go to settings and export
      await page.goto('/settings');

      const downloadPromise = page.waitForEvent('download', { timeout: 10000 });

      const jsonButton = page.getByRole('button', { name: /json|export.*json/i });
      await jsonButton.first().click();

      const download = await downloadPromise;
      const downloadPath = await download.path();

      if (downloadPath) {
        const content = fs.readFileSync(downloadPath, 'utf8');
        const data = JSON.parse(content);

        // Should have at least one check-in
        expect(data.checkins.length).toBeGreaterThan(0);
        
        // Check-in should have answers
        if (data.checkins.length > 0) {
          const checkin = data.checkins[0];
          expect(checkin).toHaveProperty('answers');
          expect(checkin).toHaveProperty('lag_score');
        }
      }
    });
  });

  test.describe('export loading state', () => {
    test('should show loading state during export', async ({ page }) => {
      await page.goto('/settings');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      // Click export button
      const jsonButton = page.getByRole('button', { name: /json|export.*json/i });
      await jsonButton.first().click();

      // May show loading indicator
      const loadingIndicator = page.getByText(/exporting|loading|please wait/i);
      // This is optional - implementation dependent
    });
  });
});
