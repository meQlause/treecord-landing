import { expect, test } from '@playwright/test';
import { COPY } from '../../../src/features/landing/landing.copy';
import { LINKS } from '../../../src/features/landing/landing.links';
import { parseRich } from '../../../src/features/landing/words/rich.rules';

// Every headline as a reader sees it: marks stripped, in story order.
const plain = (big: string) =>
  parseRich(big)
    .map((piece) => {
      if (piece.kind === 'swap') {
        return `${piece.was} ${piece.now}`;
      }

      return piece.text;
    })
    .join('');
const headlines = [
  ...COPY.hero.hook,
  COPY.hero.tagline,
  ...COPY.seedling.says,
  ...COPY.problems.panels.flat(),
  ...COPY.proof.says,
  ...COPY.pipeline.says,
  ...COPY.survival.says,
  ...COPY.carbon.says,
  COPY.roles.title,
].map((say) => plain(say.big));

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the beats read top to bottom as an article with the same text', async ({ page }) => {
    await page.goto('/');
    const text = (await page.locator('main').innerText()).replace(/\s+/g, ' ');
    let from = 0;

    for (const line of headlines) {
      const found = text.indexOf(line, from);
      expect(found, line).toBeGreaterThanOrEqual(from);
      from = found + line.length;
    }
    for (const item of COPY.roles.items) {
      expect(text).toContain(plain(item.line));
    }
  });

  test('the calls to action and the footer are there, and the page does not scroll sideways', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(page.locator('a.btn')).toHaveCount(2);
    expect(
      await page
        .locator('a.btn')
        .evaluateAll((links) => links.map((link) => link.getAttribute('href'))),
    ).toEqual([LINKS.fund, LINKS.becomePlanter]);
    await expect(page.locator('footer')).toHaveText(COPY.shell.name + COPY.shell.footer);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
});

test.describe('with JavaScript', () => {
  test('the client takes over from the prerendered article and pins the story', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(page.locator('#stage')).toHaveAttribute('data-motion', '');
    await expect(page.locator('#stage .gl canvas')).toHaveCount(1);
    await page.locator('.pin-spacer').waitFor({ state: 'attached' });
  });

  test('the review jump ?at= is ignored by the production build', async ({ page }) => {
    await page.goto('/?at=survival,0.5');
    await page.locator('.pin-spacer').waitFor({ state: 'attached' });

    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await expect(page.locator('#hero')).toBeVisible();
  });
});
