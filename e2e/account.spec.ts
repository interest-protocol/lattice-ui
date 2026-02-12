import { expect, test } from '@playwright/test';

test.describe('Account Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock all API calls
    await page.route('**/api/**', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify({ data: {} }) })
    );
    await page.goto('/account');
  });

  test('account page loads at /account', async ({ page }) => {
    // Page heading should be visible
    const heading = page.getByRole('heading', { name: 'Account' });
    await expect(heading).toBeVisible();
  });

  test('Balances, Deposit, and Withdraw tabs render', async ({ page }) => {
    const balancesTab = page.locator('#account-tab-0');
    const depositTab = page.locator('#account-tab-1');
    const withdrawTab = page.locator('#account-tab-2');

    await expect(balancesTab).toBeVisible();
    await expect(depositTab).toBeVisible();
    await expect(withdrawTab).toBeVisible();
  });

  test('tab switching works', async ({ page }) => {
    const depositTab = page.locator('#account-tab-1');

    await depositTab.click();
    await expect(depositTab).toHaveAttribute('aria-selected', 'true');

    const withdrawTab = page.locator('#account-tab-2');
    await withdrawTab.click();
    await expect(withdrawTab).toHaveAttribute('aria-selected', 'true');
  });
});
