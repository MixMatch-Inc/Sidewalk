import { test, expect } from '@playwright/test';
import { loginWithOTP } from '../../test-utils/auth.helper';
import { TEST_REPORT } from '../../test-utils/data.helper';

test('user can create report', async ({ page }) => {
  await loginWithOTP(page);

  await page.goto('/report/new');

  await page.fill('[data-testid=report-title]', TEST_REPORT.title);
  await page.selectOption('[data-testid=report-category]', TEST_REPORT.category);

  await page.click('[data-testid=submit-report]');

  await expect(page.getByText('Report submitted')).toBeVisible();
});