import { expect, test } from '@playwright/test';

type Marked = { __firstDraw?: number };

test('something paints (the loader) before the 3D layer draws its first frame', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const marked = window as unknown as Marked;
    const proto = WebGL2RenderingContext.prototype as unknown as Record<
      string,
      (...args: unknown[]) => unknown
    >;
    for (const name of [
      'drawElements',
      'drawArrays',
      'drawElementsInstanced',
      'drawArraysInstanced',
    ]) {
      const original = proto[name];
      proto[name] = function (this: unknown, ...args: unknown[]) {
        marked.__firstDraw ??= performance.now();

        return original.apply(this, args);
      };
    }
  });
  await page.goto('/');
  await expect
    .poll(() => page.evaluate(() => (window as unknown as Marked).__firstDraw ?? 0))
    .toBeGreaterThan(0);

  const paint = await page.evaluate(
    () =>
      new Promise<{ fcp: number; draw: number; lcpIsHeadline: boolean }>((resolve) => {
        new PerformanceObserver((list) => {
          const last = list.getEntries().at(-1) as PerformanceEntry & { element?: Element };
          const [fcp] = performance.getEntriesByName('first-contentful-paint');
          resolve({
            fcp: fcp.startTime,
            draw: (window as unknown as Marked).__firstDraw ?? 0,
            lcpIsHeadline: Boolean(last.element?.closest('.copy')),
          });
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      }),
  );

  expect(paint.fcp).toBeLessThan(paint.draw);
  expect(paint.lcpIsHeadline).toBe(true);
});

test('the 3D layer is not in the page: it is a chunk loaded after the first paint', async ({
  page,
}) => {
  const loaded: string[] = [];
  page.on('request', (request) => loaded.push(request.url()));

  await page.goto('/');
  await page.locator('#hero h1').waitFor();

  await expect.poll(() => loaded.some((url) => /\/assets\/three-/.test(url))).toBe(true); // it does arrive, afterwards
  const html = await (await page.request.get('/')).text();
  expect(html).not.toMatch(/\/assets\/(three|stage3d)-/);
});
