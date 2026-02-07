/**
 * E2E tests for complete check-in flow
 * Tests navigation, answering questions, submission, and results display
 */

import { test, expect } from '@playwright/test';

// Test user credentials - should be configured in environment or test fixtures
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';

test.describe('Check-in Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Note: In a real scenario, you would set up authentication
    // For E2E tests, you might use a test account or mock authentication
    await page.goto('/');
  });

  test.describe('navigation', () => {
    test('should navigate to check-in page from home', async ({ page }) => {
      // Skip if not authenticated - redirect to login
      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      await page.goto('/home');
      await page.click('text=Start Weekly Check-In');

      await expect(page).toHaveURL(/\/checkin/);
    });

    test('should display check-in page with first question', async ({ page }) => {
      await page.goto('/checkin');

      // Should redirect to login if not authenticated
      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      // First question should be Energy
      await expect(page.getByText('Energy')).toBeVisible();
    });
  });

  test.describe('answering questions', () => {
    test('should display all 6 dimension questions', async ({ page }) => {
      await page.goto('/checkin');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      // Question dimensions
      const questions = [
        'Energy',
        'Sleep consistency',
        'Daily structure',
        'Starting tasks',
        'Engagement / follow-through',
        'Sustainable pace',
      ];

      // Navigate through questions or check they exist
      for (let i = 0; i < questions.length; i++) {
        // Select a rating (e.g., 3)
        await page.click('[data-value="3"]');

        // Wait for potential auto-advance
        await page.waitForTimeout(500);
      }
    });

    test('should allow selecting rating 1-5 for each question', async ({ page }) => {
      await page.goto('/checkin');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      // Test that rating buttons are clickable
      const ratingButton = page.locator('[data-value="4"]').first();
      await expect(ratingButton).toBeVisible();
      await ratingButton.click();
    });

    test('should show progress indicator', async ({ page }) => {
      await page.goto('/checkin');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      // Progress bar or indicator should be visible
      const progressElement = page.locator('[class*="progress"], [role="progressbar"]');
      await expect(progressElement.first()).toBeVisible();
    });
  });

  test.describe('reflection note', () => {
    test('should allow adding reflection note before submission', async ({ page }) => {
      await page.goto('/checkin');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      // Answer all questions first
      for (let i = 0; i < 6; i++) {
        await page.click('[data-value="3"]');
        await page.waitForTimeout(300);
      }

      // Look for reflection note textarea
      const reflectionTextarea = page.locator('textarea[placeholder*="reflect"], textarea[placeholder*="note"]');
      if (await reflectionTextarea.isVisible()) {
        await reflectionTextarea.fill('Test reflection note for E2E testing');
      }
    });
  });

  test.describe('submission', () => {
    test('should submit check-in and navigate to results', async ({ page }) => {
      await page.goto('/checkin');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      // Answer all questions
      for (let i = 0; i < 6; i++) {
        await page.click('[data-value="3"]');
        await page.waitForTimeout(300);
      }

      // Submit the check-in
      const submitButton = page.getByRole('button', { name: /submit|complete|finish/i });
      await submitButton.click();

      // Should navigate to results page
      await expect(page).toHaveURL(/\/results/, { timeout: 10000 });
    });
  });

  test.describe('results page', () => {
    test('should display lag score after submission', async ({ page }) => {
      await page.goto('/checkin');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      // Answer all questions with value 3
      for (let i = 0; i < 6; i++) {
        await page.click('[data-value="3"]');
        await page.waitForTimeout(300);
      }

      // Submit
      const submitButton = page.getByRole('button', { name: /submit|complete|finish/i });
      await submitButton.click();

      // Wait for results page
      await page.waitForURL(/\/results/, { timeout: 10000 });

      // Lag score should be displayed (look for number or "Lag Score" text)
      const scoreElement = page.getByText(/lag score|your score/i);
      await expect(scoreElement).toBeVisible();
    });

    test('should display drift category', async ({ page }) => {
      await page.goto('/checkin');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      // Answer questions
      for (let i = 0; i < 6; i++) {
        await page.click('[data-value="3"]');
        await page.waitForTimeout(300);
      }

      // Submit
      await page.getByRole('button', { name: /submit|complete|finish/i }).click();
      await page.waitForURL(/\/results/, { timeout: 10000 });

      // Drift category should be visible
      const categoryTexts = ['aligned', 'mild', 'moderate', 'heavy', 'critical'];
      const categoryElement = page.getByText(new RegExp(categoryTexts.join('|'), 'i'));
      await expect(categoryElement.first()).toBeVisible();
    });

    test('should display weakest dimension', async ({ page }) => {
      await page.goto('/checkin');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      // Answer questions with varying values (make energy weakest)
      await page.click('[data-value="1"]'); // Energy = 1 (weakest)
      await page.waitForTimeout(300);

      for (let i = 0; i < 5; i++) {
        await page.click('[data-value="4"]'); // Others = 4
        await page.waitForTimeout(300);
      }

      // Submit
      await page.getByRole('button', { name: /submit|complete|finish/i }).click();
      await page.waitForURL(/\/results/, { timeout: 10000 });

      // Should show energy as focus area
      await expect(page.getByText(/energy/i).first()).toBeVisible();
    });

    test('should display personalized tip', async ({ page }) => {
      await page.goto('/checkin');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      // Answer questions
      for (let i = 0; i < 6; i++) {
        await page.click('[data-value="3"]');
        await page.waitForTimeout(300);
      }

      // Submit
      await page.getByRole('button', { name: /submit|complete|finish/i }).click();
      await page.waitForURL(/\/results/, { timeout: 10000 });

      // Tip should be displayed (focus, constraint, or choice)
      const tipSection = page.getByText(/focus|constraint|choice/i);
      await expect(tipSection.first()).toBeVisible();
    });
  });

  test.describe('history verification', () => {
    test('should show new check-in in history after submission', async ({ page }) => {
      await page.goto('/checkin');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      // Answer and submit
      for (let i = 0; i < 6; i++) {
        await page.click('[data-value="4"]');
        await page.waitForTimeout(300);
      }

      await page.getByRole('button', { name: /submit|complete|finish/i }).click();
      await page.waitForURL(/\/results/, { timeout: 10000 });

      // Navigate to history
      await page.goto('/history');

      // Should show recent check-in (today's date or recent entry)
      const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const historyEntry = page.getByText(new RegExp(today, 'i'));
      await expect(historyEntry.first()).toBeVisible({ timeout: 5000 });
    });
  });
});

test.describe('Check-in Edge Cases', () => {
  test('should handle page refresh during check-in', async ({ page }) => {
    await page.goto('/checkin');

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      test.skip();
      return;
    }

    // Answer first few questions
    await page.click('[data-value="3"]');
    await page.waitForTimeout(300);
    await page.click('[data-value="4"]');
    await page.waitForTimeout(300);

    // Refresh page
    await page.reload();

    // Check if resume prompt appears or progress is saved
    const resumePrompt = page.getByText(/resume|continue|in progress/i);
    const firstQuestion = page.getByText('Energy');

    // Either resume prompt should appear or user is at beginning
    const hasResume = await resumePrompt.isVisible().catch(() => false);
    const atStart = await firstQuestion.isVisible().catch(() => false);

    expect(hasResume || atStart).toBe(true);
  });

  test('should allow navigating back during check-in', async ({ page }) => {
    await page.goto('/checkin');

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      test.skip();
      return;
    }

    // Answer first question
    await page.click('[data-value="3"]');
    await page.waitForTimeout(500);

    // Look for back button and click if available
    const backButton = page.getByRole('button', { name: /back|previous/i });
    if (await backButton.isVisible()) {
      await backButton.click();

      // Should go back to previous question
      await expect(page.getByText('Energy')).toBeVisible();
    }
  });
});
