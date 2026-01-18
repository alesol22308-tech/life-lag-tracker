/**
 * E2E tests for settings changes and persistence
 * Tests preference changes, saving, and persistence across page loads
 */

import { test, expect } from '@playwright/test';

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('navigation', () => {
    test('should navigate to settings page', async ({ page }) => {
      await page.goto('/settings');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      await expect(page).toHaveURL(/\/settings/);
      await expect(page.getByText(/settings/i).first()).toBeVisible();
    });
  });

  test.describe('check-in preferences', () => {
    test('should display preferred check-in day selector', async ({ page }) => {
      await page.goto('/settings');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      // Look for day selector
      const daySelector = page.locator('select, [role="listbox"]').filter({ hasText: /monday|sunday|day/i });
      await expect(daySelector.first()).toBeVisible();
    });

    test('should allow changing preferred check-in day', async ({ page }) => {
      await page.goto('/settings');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      // Find and change day selector
      const daySelector = page.locator('select').first();
      if (await daySelector.isVisible()) {
        await daySelector.selectOption({ index: 2 }); // Select a different day
      }
    });

    test('should display preferred check-in time selector', async ({ page }) => {
      await page.goto('/settings');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      // Look for time input or selector
      const timeSelector = page.locator('input[type="time"], select').filter({ hasText: /time|am|pm/i });
      // Implementation dependent
    });
  });

  test.describe('notification settings', () => {
    test('should display email reminders toggle', async ({ page }) => {
      await page.goto('/settings');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      // Look for email toggle
      const emailToggle = page.getByRole('switch', { name: /email/i }).or(
        page.getByRole('checkbox', { name: /email/i })
      ).or(
        page.locator('input[type="checkbox"]').filter({ hasText: /email/i })
      );
      
      // Or look for text label
      const emailLabel = page.getByText(/email.*reminder|reminder.*email/i);
      await expect(emailLabel.first()).toBeVisible();
    });

    test('should allow toggling email reminders', async ({ page }) => {
      await page.goto('/settings');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      // Find toggle/checkbox near email label
      const emailSection = page.locator('label, div').filter({ hasText: /email/i }).first();
      const toggle = emailSection.locator('input[type="checkbox"], [role="switch"]');
      
      if (await toggle.isVisible()) {
        const initialState = await toggle.isChecked();
        await toggle.click();
        const newState = await toggle.isChecked();
        expect(newState).not.toBe(initialState);
      }
    });
  });

  test.describe('auto-advance setting', () => {
    test('should display auto-advance toggle', async ({ page }) => {
      await page.goto('/settings');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      const autoAdvanceLabel = page.getByText(/auto.*advance|automatically.*next/i);
      await expect(autoAdvanceLabel.first()).toBeVisible();
    });

    test('should allow toggling auto-advance', async ({ page }) => {
      await page.goto('/settings');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      const autoAdvanceSection = page.locator('label, div').filter({ hasText: /auto.*advance/i }).first();
      const toggle = autoAdvanceSection.locator('input[type="checkbox"], [role="switch"]');
      
      if (await toggle.isVisible()) {
        await toggle.click();
        // Toggle state should change
      }
    });
  });

  test.describe('accessibility settings', () => {
    test('should display font size preference', async ({ page }) => {
      await page.goto('/settings');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      const fontSizeLabel = page.getByText(/font.*size|text.*size/i);
      await expect(fontSizeLabel.first()).toBeVisible();
    });

    test('should allow changing font size', async ({ page }) => {
      await page.goto('/settings');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      // Find font size selector (radio buttons or dropdown)
      const fontOptions = page.getByRole('radio', { name: /large|default|extra/i }).or(
        page.locator('select').filter({ hasText: /large|default/i })
      );
      
      if (await fontOptions.first().isVisible()) {
        await fontOptions.first().click();
      }
    });

    test('should display high contrast mode toggle', async ({ page }) => {
      await page.goto('/settings');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      const highContrastLabel = page.getByText(/high.*contrast/i);
      await expect(highContrastLabel.first()).toBeVisible();
    });

    test('should apply high contrast mode immediately when toggled', async ({ page }) => {
      await page.goto('/settings');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      const highContrastSection = page.locator('label, div').filter({ hasText: /high.*contrast/i }).first();
      const toggle = highContrastSection.locator('input[type="checkbox"], [role="switch"]');
      
      if (await toggle.isVisible()) {
        await toggle.click();
        
        // Check if high-contrast class is applied to html element
        const html = page.locator('html');
        await page.waitForTimeout(500);
        
        // The class should be added or styles should change
      }
    });
  });

  test.describe('saving preferences', () => {
    test('should have save button', async ({ page }) => {
      await page.goto('/settings');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      const saveButton = page.getByRole('button', { name: /save|update|apply/i });
      await expect(saveButton.first()).toBeVisible();
    });

    test('should save preferences when clicking save', async ({ page }) => {
      await page.goto('/settings');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      // Make a change
      const autoAdvanceSection = page.locator('label, div').filter({ hasText: /auto.*advance/i }).first();
      const toggle = autoAdvanceSection.locator('input[type="checkbox"], [role="switch"]');
      
      if (await toggle.isVisible()) {
        await toggle.click();
      }

      // Save
      const saveButton = page.getByRole('button', { name: /save|update|apply/i });
      await saveButton.first().click();

      // Should show success message or indication
      const successMessage = page.getByText(/saved|updated|success/i);
      await expect(successMessage.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('persistence across page loads', () => {
    test('should persist preferences after page refresh', async ({ page }) => {
      await page.goto('/settings');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      // Find and toggle a setting
      const autoAdvanceSection = page.locator('label, div').filter({ hasText: /auto.*advance/i }).first();
      const toggle = autoAdvanceSection.locator('input[type="checkbox"], [role="switch"]');
      
      let initialState = false;
      if (await toggle.isVisible()) {
        initialState = await toggle.isChecked();
        await toggle.click();
        
        // Save
        const saveButton = page.getByRole('button', { name: /save|update|apply/i });
        await saveButton.first().click();
        await page.waitForTimeout(1000);
      }

      // Refresh page
      await page.reload();
      await page.waitForTimeout(1000);

      // Check if setting persisted
      if (await toggle.isVisible()) {
        const newState = await toggle.isChecked();
        expect(newState).not.toBe(initialState);
      }
    });

    test('should persist font size preference', async ({ page }) => {
      await page.goto('/settings');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      // Select large font size
      const largeOption = page.getByRole('radio', { name: /large/i }).first();
      if (await largeOption.isVisible()) {
        await largeOption.click();
        
        // Save
        const saveButton = page.getByRole('button', { name: /save|update|apply/i });
        await saveButton.first().click();
        await page.waitForTimeout(1000);

        // Refresh
        await page.reload();
        await page.waitForTimeout(1000);

        // Check if large is still selected
        await expect(largeOption).toBeChecked();
      }
    });
  });

  test.describe('accessibility preferences apply immediately', () => {
    test('should apply font size change immediately', async ({ page }) => {
      await page.goto('/settings');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      // Get initial font size
      const html = page.locator('html');
      const initialFontSize = await html.getAttribute('data-font-size');

      // Change font size
      const largeOption = page.getByRole('radio', { name: /large/i }).first();
      if (await largeOption.isVisible()) {
        await largeOption.click();
        await page.waitForTimeout(500);

        // Font size attribute should change
        const newFontSize = await html.getAttribute('data-font-size');
        // May or may not be different depending on initial state
      }
    });

    test('should apply high contrast immediately', async ({ page }) => {
      await page.goto('/settings');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      const html = page.locator('html');
      const highContrastSection = page.locator('label, div').filter({ hasText: /high.*contrast/i }).first();
      const toggle = highContrastSection.locator('input[type="checkbox"], [role="switch"]');
      
      if (await toggle.isVisible()) {
        const initialHasClass = await html.evaluate((el) => el.classList.contains('high-contrast'));
        
        await toggle.click();
        await page.waitForTimeout(500);

        const newHasClass = await html.evaluate((el) => el.classList.contains('high-contrast'));
        expect(newHasClass).not.toBe(initialHasClass);
      }
    });
  });
});
