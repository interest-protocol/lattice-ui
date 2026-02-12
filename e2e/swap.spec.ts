import { expect, test } from '@playwright/test';

test.describe('Swap Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock all API calls
    await page.route('**/api/**', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify({ data: {} }) })
    );
    await page.goto('/');
  });

  test('Swap and Bridge tabs render and are clickable', async ({ page }) => {
    const swapTab = page.locator('#swap-tab-0');
    const bridgeTab = page.locator('#swap-tab-1');

    await expect(swapTab).toBeVisible();
    await expect(bridgeTab).toBeVisible();

    // Swap tab is active by default
    await expect(swapTab).toHaveAttribute('aria-selected', 'true');
  });

  test('tab switching shows correct panel', async ({ page }) => {
    const bridgeTab = page.locator('#swap-tab-1');
    const swapPanel = page.locator('#swap-tabpanel-0');
    const bridgePanel = page.locator('#swap-tabpanel-1');

    // Initially swap panel is visible
    await expect(swapPanel).not.toHaveAttribute('hidden', '');

    // Click bridge tab
    await bridgeTab.click();
    await expect(bridgeTab).toHaveAttribute('aria-selected', 'true');

    // Bridge panel should now be visible
    await expect(bridgePanel).not.toHaveAttribute('hidden', '');
  });

  test('input field accepts numeric input', async ({ page }) => {
    const input = page.locator('#input-from');
    await expect(input).toBeVisible();

    await input.fill('0.5');
    await expect(input).toHaveValue('0.5');
  });

  test('flip button is present with correct aria-label', async ({ page }) => {
    const flipButton = page.getByLabel('Reverse swap direction');
    await expect(flipButton).toBeVisible();
  });

  test('Login button visible when unauthenticated', async ({ page }) => {
    const loginButton = page.getByText('Login');
    await expect(loginButton).toBeVisible();
  });
});
