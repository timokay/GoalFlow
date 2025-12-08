import { test, expect } from '@playwright/test';

test.describe('Goals Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
  });

  test('should create a new goal', async ({ page }) => {
    await page.goto('/goals/new');
    
    // Fill form
    await page.fill('input[name="title"]', 'E2E Test Goal');
    await page.selectOption('select[name="type"]', 'QUARTERLY');
    await page.fill('input[name="startDate"]', '2024-01-01');
    await page.fill('input[name="endDate"]', '2024-03-31');
    await page.click('button[type="submit"]');

    // Should redirect to goals list
    await expect(page).toHaveURL(/\/goals/);
    await expect(page.locator('text=E2E Test Goal')).toBeVisible();
  });

  test('should view goal details', async ({ page }) => {
    await page.goto('/goals');
    
    // Click on first goal
    const firstGoal = page.locator('[data-testid="goal-card"]').first();
    if (await firstGoal.count() > 0) {
      await firstGoal.click();
      await expect(page).toHaveURL(/\/goals\/[a-z0-9]+/);
    }
  });

  test('should search for goals', async ({ page }) => {
    await page.goto('/goals');
    
    // Switch to search tab
    await page.click('text=Поиск');
    
    // Enter search query
    await page.fill('input[placeholder*="Поиск"]', 'Test');
    await page.waitForTimeout(600); // Wait for debounce
    
    // Should show search results
    await expect(page.locator('text=Найдено целей')).toBeVisible();
  });
});

