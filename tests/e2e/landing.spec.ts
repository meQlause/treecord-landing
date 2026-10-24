import { expect, test } from '@playwright/test';

test('the stage mounts with a 3D canvas and the first beat, without console errors', async ({
  page,
}) => {
  const problems: string[] = [];
  page.on('pageerror', (error) => problems.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      problems.push(message.text());
    }
  });

  await page.goto('/');

  await expect(page.locator('#stage .gl canvas')).toHaveCount(1);
  await expect(page.locator('#hero')).toBeVisible();
  expect(problems).toEqual([]);
});
