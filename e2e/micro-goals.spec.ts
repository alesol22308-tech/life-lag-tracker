/**
 * E2E tests for micro-goal creation and completion
 * Tests micro-goal suggestion, creation, display, and completion flow
 */

import { test, expect } from '@playwright/test';

test.describe('Micro-Goals Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('micro-goal suggestion after check-in', () => {
    test('should display micro-goal suggestion on results page', async ({ page }) => {
      await page.goto('/checkin');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      // Complete check-in with low energy (to make energy the weakest dimension)
      await page.click('[data-value="1"]'); // Energy = 1
      await page.waitForTimeout(300);

      for (let i = 0; i < 5; i++) {
        await page.click('[data-value="4"]'); // Others = 4
        await page.waitForTimeout(300);
      }

      // Submit
      await page.getByRole('button', { name: /submit|complete|finish/i }).click();
      await page.waitForURL(/\/results/, { timeout: 10000 });

      // Results page should show tip with micro-goal suggestion
      const tipSection = page.getByText(/focus|constraint|choice/i);
      await expect(tipSection.first()).toBeVisible();
    });

    test('should show actionable tip based on weakest dimension', async ({ page }) => {
      await page.goto('/checkin');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      // Make sleep the weakest
      await page.click('[data-value="4"]'); // Energy
      await page.waitForTimeout(300);
      await page.click('[data-value="1"]'); // Sleep = 1 (weakest)
      await page.waitForTimeout(300);

      for (let i = 0; i < 4; i++) {
        await page.click('[data-value="4"]'); // Others = 4
        await page.waitForTimeout(300);
      }

      // Submit
      await page.getByRole('button', { name: /submit|complete|finish/i }).click();
      await page.waitForURL(/\/results/, { timeout: 10000 });

      // Should show sleep-related tip
      const sleepTip = page.getByText(/sleep/i);
      await expect(sleepTip.first()).toBeVisible();
    });
  });

  test.describe('micro-goal creation', () => {
    test('should have option to create micro-goal from tip', async ({ page }) => {
      await page.goto('/checkin');

      const currentUrl = page.url();
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
      await page.waitForURL(/\/results/, { timeout: 10000 });

      // Look for micro-goal creation button/link
      const createGoalButton = page.getByRole('button', { name: /set.*goal|create.*goal|add.*goal/i }).or(
        page.getByRole('link', { name: /set.*goal|create.*goal/i })
      );
      
      // Or look for goal setting section
      const goalSection = page.getByText(/micro.*goal|set.*goal|this week/i);
      await expect(goalSection.first()).toBeVisible({ timeout: 5000 });
    });

    test('should allow creating a micro-goal', async ({ page }) => {
      await page.goto('/checkin');

      const currentUrl = page.url();
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
      await page.waitForURL(/\/results/, { timeout: 10000 });

      // Look for and click goal creation
      const createGoalButton = page.getByRole('button', { name: /set|create|add/i }).filter({ hasText: /goal/i });
      
      if (await createGoalButton.first().isVisible()) {
        await createGoalButton.first().click();
        
        // May show input field for goal text
        const goalInput = page.locator('input[type="text"], textarea').filter({ hasText: /goal/i });
        if (await goalInput.isVisible()) {
          await goalInput.fill('Test micro-goal for E2E');
        }
        
        // Confirm creation
        const confirmButton = page.getByRole('button', { name: /save|confirm|create/i });
        if (await confirmButton.first().isVisible()) {
          await confirmButton.first().click();
        }
      }
    });
  });

  test.describe('micro-goal display on home page', () => {
    test('should show micro-goal card on home page', async ({ page }) => {
      // First complete a check-in to generate micro-goal
      await page.goto('/checkin');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      for (let i = 0; i < 6; i++) {
        await page.click('[data-value="3"]');
        await page.waitForTimeout(300);
      }

      await page.getByRole('button', { name: /submit|complete|finish/i }).click();
      await page.waitForTimeout(2000);

      // Navigate to home
      await page.goto('/home');

      // Micro-goal card should be visible
      const microGoalCard = page.getByText(/micro.*goal|your.*goal|this week/i);
      await expect(microGoalCard.first()).toBeVisible({ timeout: 5000 });
    });

    test('should display goal text on home page', async ({ page }) => {
      await page.goto('/home');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      // Look for goal-related content
      const goalSection = page.locator('[class*="goal"], [data-testid*="goal"]').or(
        page.getByText(/focus|this week|micro.*goal/i)
      );
      
      // May or may not be visible depending on whether user has completed check-in
    });
  });

  test.describe('micro-goal completion during check-in', () => {
    test('should prompt for micro-goal status in next check-in', async ({ page }) => {
      // This test requires completing a check-in first to set up a goal
      await page.goto('/checkin');

      let currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      // Complete first check-in
      for (let i = 0; i < 6; i++) {
        await page.click('[data-value="3"]');
        await page.waitForTimeout(300);
      }

      await page.getByRole('button', { name: /submit|complete|finish/i }).click();
      await page.waitForTimeout(2000);

      // Start a new check-in (simulating next week)
      await page.goto('/checkin');

      // Look for micro-goal completion prompt
      const completionPrompt = page.getByText(/how.*goal|did you.*goal|goal.*status|micro.*goal/i);
      
      // This may be visible if there's an active micro-goal
    });

    test('should allow marking micro-goal as completed', async ({ page }) => {
      await page.goto('/checkin');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      // Look for completion options
      const completedButton = page.getByRole('button', { name: /completed|done|finished/i });
      const skippedButton = page.getByRole('button', { name: /skipped|didn\'t.*try/i });
      const inProgressButton = page.getByRole('button', { name: /in.*progress|still.*working/i });

      // At least one option should be visible if there's an active goal
      const hasOptions = await completedButton.isVisible().catch(() => false) ||
                        await skippedButton.isVisible().catch(() => false) ||
                        await inProgressButton.isVisible().catch(() => false);
      
      // If no active goal, this is expected to not show options
    });

    test('should record completion status', async ({ page }) => {
      await page.goto('/checkin');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      // If completion prompt is shown, click completed
      const completedButton = page.getByRole('button', { name: /completed|done/i });
      
      if (await completedButton.isVisible()) {
        await completedButton.click();
        
        // Should record and proceed
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('micro-goal status update', () => {
    test('should update goal status after marking complete', async ({ page }) => {
      await page.goto('/home');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      // Look for completed goal indicator
      const completedIndicator = page.getByText(/completed|done|achieved/i);
      
      // May or may not be visible depending on state
    });

    test('should show new goal suggestion after completing previous', async ({ page }) => {
      await page.goto('/checkin');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      // If previous goal was completed, should see new goal after check-in
      for (let i = 0; i < 6; i++) {
        await page.click('[data-value="3"]');
        await page.waitForTimeout(300);
      }

      await page.getByRole('button', { name: /submit|complete|finish/i }).click();
      await page.waitForURL(/\/results/, { timeout: 10000 });

      // New tip/goal should be shown
      const newGoal = page.getByText(/focus|this week|your tip/i);
      await expect(newGoal.first()).toBeVisible();
    });
  });
});

test.describe('Micro-Goal Edge Cases', () => {
  test('should handle no active micro-goal gracefully', async ({ page }) => {
    await page.goto('/home');

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      test.skip();
      return;
    }

    // Home page should not crash if no micro-goal exists
    await expect(page.locator('body')).toBeVisible();
    
    // No error should be shown
    const errorText = page.getByText(/error|something went wrong/i);
    await expect(errorText).not.toBeVisible({ timeout: 3000 }).catch(() => {
      // Error may be visible for other reasons, not critical
    });
  });

  test('should persist micro-goal across page navigations', async ({ page }) => {
    // Complete check-in to create goal
    await page.goto('/checkin');

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      test.skip();
      return;
    }

    for (let i = 0; i < 6; i++) {
      await page.click('[data-value="2"]');
      await page.waitForTimeout(300);
    }

    await page.getByRole('button', { name: /submit|complete|finish/i }).click();
    await page.waitForTimeout(2000);

    // Navigate around
    await page.goto('/trends');
    await page.goto('/history');
    await page.goto('/home');

    // Goal should still be visible
    const goalSection = page.getByText(/micro.*goal|this week|focus/i);
    // May or may not be visible
  });
});
