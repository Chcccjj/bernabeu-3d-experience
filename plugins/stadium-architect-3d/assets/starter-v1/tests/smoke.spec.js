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
  await expect(page.locator('[data-mode=\"night\"]')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('[data-view=\"pitch\"]')).toHaveAttribute('aria-pressed','true');
  await expect(page.getByRole('heading', {name:'Stadium Preview'})).toBeVisible();
  await expect(page.getByText(/精修版|STADIUM ATLAS|S\/A|V2/)).toHaveCount(0);
  await page.getByRole('button',{name:'关于场景'}).click();
  await expect(page.locator('#about-panel')).toBeVisible();
  expect(errors).toEqual([]);
});

test('mobile dock has reachable controls without horizontal overflow', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await expect(page.locator('.dock')).toBeVisible();
  await expect(page.getByRole('button',{name:'夜间'})).toBeVisible();
  const box=await page.locator('.dock').boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x+box.width).toBeLessThanOrEqual(390);
});
