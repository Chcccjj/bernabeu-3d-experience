import { test, expect } from '@playwright/test';

test('scene visible and controls update', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('#scene-state')).toHaveText('ready');
  await page.getByRole('button', {name:'夜间'}).click();
  await expect(page.locator('#mode')).toHaveText('NIGHT');
  await page.getByRole('button', {name:'球场内'}).click();
  await expect(page.locator('#camera-mode')).toHaveText('PITCH');
  expect(errors).toEqual([]);
});
