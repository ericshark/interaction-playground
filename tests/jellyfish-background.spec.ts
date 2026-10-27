import { expect, test } from '@playwright/test';

// These checks exercise the desktop decoration independently of the demo suite.
test.use({
  viewport: { width: 1440, height: 1000 },
  isMobile: false,
  hasTouch: false,
});

async function freezeTime(page: import('@playwright/test').Page) {
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.goto('/');
  await page.clock.runFor(100);
}

const frameData = (canvas: import('@playwright/test').Locator) =>
  canvas.evaluate((element: HTMLCanvasElement) => element.toDataURL());

const brightestPixel = (canvas: import('@playwright/test').Locator) =>
  canvas.evaluate((element: HTMLCanvasElement) => {
    const pixels = element
      .getContext('2d')!
      .getImageData(0, 0, element.width, element.height).data;
    let brightest = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] > 40) brightest = Math.max(brightest, pixels[i]);
    }
    return brightest;
  });

test('jellyfish animate in reduced motion, follow the theme, and allow navigation', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await freezeTime(page);
  const canvas = page.locator('.jellyfish-background');
  await expect(canvas).toHaveAttribute('aria-hidden', 'true');
  await expect(canvas).toHaveCSS('pointer-events', 'none');
  const first = await frameData(canvas);
  await page.clock.runFor(1000);
  expect(await frameData(canvas)).not.toBe(first);
  const light = await brightestPixel(canvas);
  expect(light).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Night mode' }).click();
  await page.clock.runFor(100);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await brightestPixel(canvas)).toBeGreaterThan(light);
  await page.getByRole('link', { name: /^Widgets/ }).click();
  await page.clock.runFor(1500);
  await expect(page).toHaveURL(/#widgets$/);
});

for (const theme of ['light', 'dark']) {
  test(`the full center column occludes the canvas at the top and bottom in ${theme} mode`, async ({
    page,
  }) => {
    await freezeTime(page);
    const canvas = page.locator('.jellyfish-background');
    if (theme === 'dark')
      await page.getByRole('button', { name: 'Night mode' }).click();
    for (const bottom of [false, true]) {
      await page.evaluate(
        (atBottom) =>
          window.scrollTo({
            top: atBottom ? document.documentElement.scrollHeight : 0,
            behavior: 'instant',
          }),
        bottom,
      );
      await page.clock.runFor(300);
      const bounds = await page.locator('main').boundingBox();
      if (!bounds) throw new Error('Missing content column');
      const clip = {
        x: Math.ceil(bounds.x),
        y: 0,
        width: Math.floor(bounds.width),
        height: 1000,
      };
      const before = await page.screenshot({ clip, animations: 'disabled' });
      // A diagnostic fill reveals even a small gap in the opaque center surface.
      await canvas.evaluate((element: HTMLCanvasElement) => {
        const context = element.getContext('2d')!;
        context.fillStyle = '#ff00ff';
        context.fillRect(0, 0, element.width, element.height);
      });
      expect(await page.screenshot({ clip, animations: 'disabled' })).toEqual(
        before,
      );
    }
  });
}

test('mobile releases the canvas and resizing across the desktop breakpoint restarts it', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const canvas = page.locator('.jellyfish-background');
  for (const width of [390, 1024, 1023, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(canvas).toHaveJSProperty('width', width >= 1024 ? width : 0);
    await expect(canvas).toHaveJSProperty('height', width >= 1024 ? 844 : 0);
    if (width >= 1024) {
      await expect(canvas).toBeVisible();
      const initial = await frameData(canvas);
      await expect.poll(() => frameData(canvas)).not.toBe(initial);
    } else await expect(canvas).toBeHidden();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test('pixel density is capped at twice the viewport', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 3,
  });
  try {
    const page = await context.newPage();
    await page.goto('/');
    const canvas = page.locator('.jellyfish-background');
    await expect(canvas).toHaveJSProperty('width', 2880);
    await expect(canvas).toHaveJSProperty('height', 2000);
  } finally {
    await context.close();
  }
});

test('page controls remain usable without a background canvas context', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      ...args: Parameters<typeof original>
    ) {
      if (this.classList.contains('jellyfish-background')) return null;
      return original.apply(this, args);
    } as typeof original;
  });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Night mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(errors).toEqual([]);
});
