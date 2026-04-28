import { test, expect } from '@playwright/test';
import { loginWithOTP } from '../../test-utils/auth.helper';

test('OTP login works', async ({ page }) => {
  await loginWithOTP(page);

  await expect(page).toHaveURL('/dashboard');
  await expect(page.getByText('Dashboard')).toBeVisible();
});