import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/GridPlay/);
  });

  test('should display hero section', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('GridPlay');
  });

  test('should navigate to create board page', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Create Board');
    await expect(page).toHaveURL(/\/board\/create/);
  });

  test('should navigate to join board page', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Join Board');
    await expect(page).toHaveURL(/\/board\/join/);
  });
});

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1, h2')).toContainText(/Log/i);
  });

  test('should display signup page', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('h1, h2')).toContainText(/Sign/i);
  });
});

test.describe('Board Pages', () => {
  test('should display create board form', async ({ page }) => {
    await page.goto('/board/create');
    await expect(page.locator('form')).toBeVisible();
  });

  test('should display join board form', async ({ page }) => {
    await page.goto('/board/join');
    await expect(page.locator('form')).toBeVisible();
  });
});

test.describe('Mobile Responsiveness', () => {
  test('should display mobile menu on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Mobile menu button should be visible
    const menuButton = page.locator('button[aria-label="Toggle menu"]');
    await expect(menuButton).toBeVisible();
  });

  test('should toggle mobile menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const menuButton = page.locator('button[aria-label="Toggle menu"]');
    await menuButton.click();
    
    // Mobile menu should be visible after clicking
    await expect(page.locator('text=Create Board')).toBeVisible();
  });
});
