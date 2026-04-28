import { test, expect } from '@playwright/test';
import { loginWithOTP } from '../../test-utils/auth.helper';

test('agency can approve report', async ({ page }) => {
  await loginWithOTP(page);

  await page.goto('/agency/queue');

  await page.click('[data-testid=approve-button]');

  await expect(page.getByText('Approved')).toBeVisible();
});