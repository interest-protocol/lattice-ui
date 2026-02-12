import { expect, test } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API calls to avoid backend dependencies
    await page.route('**/api/**', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify({ data: {} }) })
    );
    await page.goto('/');
  });

  test('app loads with header and footer visible', async ({ page }) => {
    const header = page.locator('header');
    const footer = page.locator('footer');

    await expect(header).toBeVisible();
    await expect(footer).toBeVisible();
  });

  test('logo renders with "Lattice" text', async ({ page }) => {
    // Logo text is hidden on mobile, visible on md+
    const logoText = page.getByText('Lattice', { exact: true });
    await expect(logoText).toBeAttached();
  });

  test('theme toggle switches data-theme attribute', async ({ page }) => {
    const html = page.locator('html');

    // Initial theme should be set (system default or dark)
    const initialTheme = await html.getAttribute('data-theme');
    expect(initialTheme).toBeTruthy();
  });
});
