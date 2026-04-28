import { test, expect } from '@playwright/test';

test('public proof lookup works', async ({ page }) => {
  await page.goto('/proof/demo-proof-id');

  await expect(page.getByTestId('proof-status')).toBeVisible();
});