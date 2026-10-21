import { expect, test, type Locator, type Page } from '@playwright/test';

const demo = (page: Page, name: string) =>
  page.locator(`[data-demo="${name}"]`);
const canvasData = (page: Page, name: string) =>
  demo(page, name)
    .locator('canvas')
    .evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
const pressedIndex = (cards: Locator) =>
  cards.evaluateAll((elements) =>
    elements.findIndex(
      (element) => element.getAttribute('aria-pressed') === 'true',
    ),
  );

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('all 20 demos render with local assets and no page errors or horizontal overflow', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.reload();
  await expect(page.locator('[data-demo]')).toHaveCount(20);
  await expect(page.locator('body')).toHaveCSS(
    'background-color',
    'rgba(0, 0, 0, 0)',
  );
  await expect(page.locator('html')).toHaveCSS(
    'background-color',
    'rgb(255, 255, 255)',
  );
  for (const section of await page.locator('[data-demo]').all()) {
    await section.scrollIntoViewIfNeeded();
    await expect(section.getByRole('heading', { level: 2 })).toBeVisible();
    await expect
      .poll(() =>
        section
          .locator('img')
          .evaluateAll((images) =>
            images.every((image) => image.complete && image.naturalWidth > 0),
          ),
      )
      .toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
  const external = await page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .filter(
        (entry) =>
          !entry.name.startsWith(location.origin) &&
          !entry.name.startsWith('data:'),
      )
      .map((entry) => entry.name),
  );
  expect(external).toEqual([]);
});

test('sound and motion preferences toggle and persist across reloads', async ({
  page,
}) => {
  const sound = page.getByRole('button', { name: 'Sound effects' });
  const motion = page.getByRole('button', { name: 'Reduce motion' });
  await expect(sound).toHaveAttribute('aria-pressed', 'true');
  await expect(motion).toHaveAttribute('aria-pressed', 'false');
  await sound.click();
  await motion.click();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
  await page.reload();
  await expect(sound).toHaveAttribute('aria-pressed', 'false');
  await expect(motion).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
});

test('animations keep running when the OS asks for reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  const section = demo(page, 'ascii-logos');
  await section.scrollIntoViewIfNeeded();
  await expect(section).toHaveAttribute('data-active', 'true');
  const initial = await canvasData(page, 'ascii-logos');
  await expect
    .poll(() => canvasData(page, 'ascii-logos'), { timeout: 3000 })
    .not.toEqual(initial);
});

test('the Reduce motion toggle freezes loops while manual canvas controls still redraw', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Reduce motion' }).click();
  const section = demo(page, 'ascii-logos');
  await section.scrollIntoViewIfNeeded();
  await expect(section).toHaveAttribute('data-active', 'true');
  const initial = await canvasData(page, 'ascii-logos');
  await page.waitForTimeout(200);
  expect(await canvasData(page, 'ascii-logos')).toEqual(initial);
  await section.getByRole('button', { name: 'Next logo' }).click();
  expect(await canvasData(page, 'ascii-logos')).not.toEqual(initial);
});

test('ASCII logo navigation changes the drawing and wraps in both directions', async ({
  page,
}) => {
  const section = demo(page, 'ascii-logos');
  await section.scrollIntoViewIfNeeded();
  await section.getByRole('button', { name: 'Next logo' }).click();
  await expect(section.locator('canvas')).toHaveAttribute(
    'aria-label',
    'Animated ASCII Vercel logo',
  );
  await section.getByRole('button', { name: 'Previous logo' }).click();
  await section.getByRole('button', { name: 'Previous logo' }).click();
  await expect(section.locator('canvas')).toHaveAttribute(
    'aria-label',
    'Animated ASCII Zo logo',
  );
});

test('toolbar modes expand and demonstrate analytics, errors, and a local upgrade', async ({
  page,
}) => {
  const section = demo(page, 'toolbar');
  await section.getByRole('button', { name: 'Analytics', exact: true }).click();
  await section.getByRole('button', { name: /45 active users/ }).click();
  await expect(section.getByText('1,284')).toBeVisible();
  await section.getByRole('button', { name: 'Commit', exact: true }).click();
  await section.getByRole('button', { name: /f4a9c7b/ }).click();
  await expect(
    section.getByText('Missing return statement', { exact: false }),
  ).toBeVisible();
  await section.getByRole('button', { name: 'Upgrade', exact: true }).click();
  await section.getByRole('button', { name: /Unlock more/ }).click();
  await section.getByRole('button', { name: 'Try Pro' }).click();
  await expect(
    section.getByRole('button', { name: 'Pro enabled' }),
  ).toBeVisible();
});

test('infinite photographs advance and reverse', async ({ page }) => {
  const section = demo(page, 'infinite-cards');
  const counter = section.locator('.gallery-navigation .rolling');
  await section
    .getByRole('button', { name: 'Next stacked photograph', exact: true })
    .click();
  await expect(counter).toHaveText('02 / 05');
  await section
    .getByRole('button', { name: 'Previous stacked photograph', exact: true })
    .click();
  await expect(counter).toHaveText('01 / 05');
});

test('one wheel notch over the infinite stack moves exactly one photograph without scrolling the page', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Wheel input is desktop-only');
  const section = demo(page, 'infinite-cards');
  const counter = section.locator('.gallery-navigation .rolling');
  await section.scrollIntoViewIfNeeded();
  await section.locator('.infinite-stack').hover();
  await expect(counter).toHaveText('01 / 05');
  const scrollY = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 120);
  await page.mouse.wheel(0, 120);
  await expect(counter).toHaveText('02 / 05');
  await page.waitForTimeout(500);
  await expect(counter).toHaveText('02 / 05');
  expect(await page.evaluate(() => scrollY)).toBe(scrollY);
  await page.waitForTimeout(200);
  await page.mouse.wheel(0, -120);
  await expect(counter).toHaveText('01 / 05');
});

test('spatial cards can be brought forward with the keyboard', async ({
  page,
}) => {
  const button = demo(page, 'stacked-cards').getByRole('button', {
    name: 'Show Messages card',
  });
  await button.focus();
  await button.press('Enter');
  await expect(button).toHaveAttribute('aria-pressed', 'true');
});

test('3D gallery rotates on its own, even with OS reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  const section = demo(page, '3d-gallery-carousel');
  await section.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  const cards = section.locator('.ring-card');
  const start = await pressedIndex(cards);
  await expect
    .poll(() => pressedIndex(cards), { timeout: 9000 })
    .not.toBe(start);
});

test('3D gallery steps to the next image', async ({ page }) => {
  const section = demo(page, '3d-gallery-carousel');
  const cards = section.locator('.ring-card');
  const next = section.getByRole('button', {
    name: 'Next gallery image',
    exact: true,
  });
  await next.click();
  await page.waitForTimeout(1200);
  const current = await pressedIndex(cards);
  await next.click();
  await expect.poll(() => pressedIndex(cards)).toBe((current + 1) % 8);
});

test('notifications support selection and repeated replay', async ({
  page,
}) => {
  const section = demo(page, 'notification-cards');
  const first = section.getByRole('button', {
    name: 'Inspect Deploy failed notification',
  });
  await first.focus();
  await first.press('Enter');
  await expect(first).toHaveAttribute('aria-pressed', 'true');
  for (let i = 0; i < 2; i++) {
    await section.getByRole('button', { name: 'Replay animation' }).click();
    await expect(
      section.getByRole('button', { name: 'Inspect Cancelled notification' }),
    ).toHaveAttribute('aria-pressed', 'true');
  }
});

test('hovering a notification lifts it and clicking brings it forward', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Hover is desktop-only');
  const section = demo(page, 'notification-cards');
  await section.scrollIntoViewIfNeeded();
  const card = section.getByRole('button', {
    name: 'Inspect Deployed notification',
  });
  await page.waitForTimeout(1500);
  const resting = await card.evaluate((element) => element.style.transform);
  const box = await card.boundingBox();
  if (!box) throw new Error('Notification card was not rendered');
  await page.mouse.move(box.x + box.width / 2, box.y + 30);
  await expect
    .poll(() => card.evaluate((element) => element.style.transform))
    .not.toBe(resting);
  await page.mouse.down();
  await page.mouse.up();
  await expect(card).toHaveAttribute('aria-pressed', 'true');
});

test('agent cards select and replay', async ({ page }) => {
  const section = demo(page, 'agent-cards');
  await section.getByRole('button', { name: 'Select Sage, Oracle' }).click();
  await expect(
    section.getByText('Sage is ready. What are we making?'),
  ).toBeVisible();
  await section.getByRole('button', { name: 'Replay animation' }).click();
  await expect(
    section.getByRole('button', { name: 'Select Sage, Oracle' }),
  ).toHaveAttribute('aria-pressed', 'false');
});

test('information sheets reveal the selected stage', async ({ page }) => {
  const section = demo(page, 'info-reveal');
  const publishing = section.getByRole('button', {
    name: 'Stage 1: Publishing',
  });
  await publishing.focus();
  await publishing.press('Enter');
  await expect(
    section.getByText('Preparing and releasing the book to the public.'),
  ).toBeVisible();
});

test('hold-to-delete cancels early, completes a sustained hold, and resets', async ({
  page,
}) => {
  const section = demo(page, 'hold-to-delete');
  const track = section.getByRole('button', { name: 'Hold to delete Saku' });
  await track.focus();
  await page.keyboard.down('Space');
  await page.waitForTimeout(150);
  await page.keyboard.up('Space');
  await expect(track).toBeVisible();
  await track.hover();
  await page.mouse.down();
  await expect(track).toHaveCount(0, { timeout: 3000 });
  await page.mouse.up();
  await expect(section.getByRole('status')).toHaveText('Saku removed');
  await section.getByRole('button', { name: 'Reset playlist' }).click();
  await expect(section.locator('.track')).toHaveCount(3);
});

test('voice orb switches provider and listening state', async ({ page }) => {
  const section = demo(page, 'chat-orb');
  const claude = section
    .getByRole('group', { name: 'Voice provider' })
    .getByRole('button', { name: 'Claude' });
  await claude.click();
  await expect(claude).toHaveAttribute('aria-pressed', 'true');
  await section.getByRole('button', { name: 'Start voice preview' }).click();
  await expect(
    section.getByRole('button', { name: 'Stop listening' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(section.getByRole('status')).toContainText('Listening');
});

test('artwork transitions through list, card, and pack layouts', async ({
  page,
}) => {
  const section = demo(page, 'switch-layout');
  for (const [label, className] of [
    ['Card view', 'card-view'],
    ['Pack view', 'pack-view'],
    ['List view', 'list-view'],
  ]) {
    await section.getByRole('button', { name: label, exact: true }).click();
    await expect(section.locator('.artworks')).toHaveClass(
      new RegExp(className),
    );
  }
  await section.getByRole('button', { name: 'Select Ripple artwork' }).click();
  await expect(section.getByText('Saved')).toBeVisible();
});

test('database form validates and creates a local region-specific preview', async ({
  page,
}) => {
  const section = demo(page, 'interactive-location-selector');
  await section.getByLabel('Project name').fill(' ');
  await expect(
    section.getByRole('button', { name: 'Create database' }),
  ).toBeDisabled();
  await section.getByLabel('Project name').fill('Playground');
  await section.getByLabel('Database location').selectOption('Singapore');
  await expect(section.getByRole('img')).toHaveAttribute(
    'aria-label',
    'Selected database region: Singapore',
  );
  await section.getByRole('button', { name: 'Create database' }).click();
  await expect(
    section.getByText('Playground is ready in Singapore.'),
  ).toBeVisible();
  await section.getByRole('button', { name: 'Create another' }).click();
  await expect(section.getByLabel('Project name')).toHaveValue('CircuitHub');
});

test('selected images send and can be sent again', async ({ page }) => {
  const section = demo(page, 'image-send');
  await section.getByRole('button', { name: 'Open image picker' }).click();
  await expect(
    section.getByRole('button', { name: 'Send images' }),
  ).toBeDisabled();
  await section.getByRole('button', { name: 'Select image 1' }).click();
  await section.getByRole('button', { name: 'Select image 3' }).click();
  await section.getByRole('button', { name: 'Send 2 images' }).click();
  await expect(section.getByText('Delivered.')).toBeVisible({ timeout: 4000 });
  await section.getByRole('button', { name: 'Send more images' }).click();
  await expect(
    section.getByRole('button', { name: 'Select image 1' }),
  ).toHaveAttribute('aria-pressed', 'false');
  await page.keyboard.press('Escape');
  await expect(
    section.getByRole('button', { name: 'Open image picker' }),
  ).toBeVisible();
});

test('transaction queue expands, pauses, finishes, and replays', async ({
  page,
}) => {
  const section = demo(page, 'transactions-pending');
  await section.getByRole('button', { name: 'Process queue' }).click();
  await expect(section.locator('.transaction-card')).toHaveCount(3);
  await section.getByRole('button', { name: 'Pause processing' }).click();
  await page.waitForTimeout(1900);
  await expect(section.locator('.transaction-card')).toHaveCount(3);
  await section.getByRole('button', { name: 'Process queue' }).click();
  await expect(section.getByText('All caught up.')).toBeVisible({
    timeout: 7500,
  });
  await section.getByRole('button', { name: 'Replay transactions' }).click();
  await expect(section.locator('.transaction-card')).toHaveCount(4);
});

test('floral gallery expands a photograph and dismisses with Escape', async ({
  page,
}) => {
  const section = demo(page, 'image-gallery');
  await section
    .getByRole('button', { name: 'Expand floral photograph 2' })
    .click();
  await expect(
    section.getByRole('button', { name: 'Close floral photograph 2' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  await expect(
    section.getByRole('button', { name: 'Expand floral photograph 2' }),
  ).toHaveAttribute('aria-pressed', 'false');
});

test('world clocks change format, reorder, change city, add, and remove', async ({
  page,
}) => {
  const section = demo(page, 'time-zones');
  await section.getByRole('button', { name: '24', exact: true }).click();
  await expect(section.locator('.clock-time').first()).not.toContainText(
    /AM|PM/,
  );
  await section
    .getByRole('button', { name: 'Move San Francisco clock up' })
    .focus();
  await page.keyboard.press('Enter');
  await expect(section.locator('.clock-widget').first()).toContainText(
    'San Francisco',
  );
  await section
    .getByRole('button', { name: 'Change San Francisco city' })
    .click();
  await section.getByRole('option', { name: /^Kathmandu/ }).click();
  await expect(
    section.getByRole('button', { name: 'Change Kathmandu city' }),
  ).toBeAttached();
  await section.getByRole('button', { name: 'Add clock' }).click();
  await section.getByRole('option', { name: /^Tokyo/ }).click();
  await expect(section.locator('.clock-widget')).toHaveCount(3);
  await section.getByRole('button', { name: 'Remove Kathmandu clock' }).click();
  await expect(section.locator('.clock-widget')).toHaveCount(2);
});

test('world clocks can be dragged into a new order', async ({ page }) => {
  const section = demo(page, 'time-zones');
  await section.scrollIntoViewIfNeeded();
  await section.locator('.clock-widget').last().hover();
  const source = await section
    .getByRole('button', { name: 'Drag San Francisco clock' })
    .boundingBox();
  const target = await section
    .getByRole('button', { name: 'Drag New York clock' })
    .boundingBox();
  if (!source || !target)
    throw new Error('Clock drag handles were not rendered');
  await page.mouse.move(
    source.x + source.width / 2,
    source.y + source.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(target.x + target.width / 2, target.y - 30, {
    steps: 15,
  });
  await page.mouse.up();
  await expect(section.locator('.clock-widget').first()).toContainText(
    'San Francisco',
  );
});

test('Dynamic Island morphs between its modes and collapses', async ({
  page,
}) => {
  const section = demo(page, 'dynamic-island');
  await section.getByRole('button', { name: 'Music', exact: true }).click();
  await expect(section.getByText('Saku', { exact: true })).toBeVisible();
  await section.getByRole('button', { name: 'Pause music preview' }).click();
  await expect(
    section.getByRole('button', { name: 'Play music preview' }),
  ).toBeVisible();
  await section.getByRole('button', { name: 'Call', exact: true }).click();
  await expect(section.getByText('00:01')).toBeVisible();
  await section.getByRole('button', { name: 'End call' }).click();
  await expect(section.getByText('Call ended')).toBeVisible();
  await section.getByRole('button', { name: 'Collapse Call activity' }).click();
  await expect(
    section.getByRole('button', { name: 'Expand Call activity' }),
  ).toHaveAttribute('aria-expanded', 'false');
  await section.getByRole('button', { name: 'Timer', exact: true }).click();
  await expect(section.getByText(/^0[45]:\d\d$/)).toBeVisible();
  await section.getByRole('button', { name: 'Calendar', exact: true }).click();
  await expect(section.getByText('Make something good.')).toBeVisible();
  await section.getByRole('button', { name: 'Idle', exact: true }).click();
  await expect(
    section.getByRole('button', { name: 'Dynamic Island' }),
  ).toBeVisible();
});

test('info carousel advances on its own and supports manual navigation', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  const section = demo(page, 'info-carousel');
  await section.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  const second = section.getByRole('button', {
    name: 'Show slide 2: Design Inspiration',
  });
  await expect(second).toHaveAttribute('aria-pressed', 'true', {
    timeout: 7000,
  });
  await section
    .getByRole('button', { name: 'Show slide 1: Color Trends' })
    .click();
  await expect(section.locator('.info-slide[aria-hidden=false]')).toContainText(
    'Vibrant Gradients',
  );
});

test('Matrix can pause and stops drawing outside the viewport', async ({
  page,
}) => {
  const section = demo(page, 'matrix');
  await section.scrollIntoViewIfNeeded();
  const canvas = section.getByRole('button', {
    name: 'Pause matrix animation',
  });
  const running = await canvasData(page, 'matrix');
  await expect.poll(() => canvasData(page, 'matrix')).not.toEqual(running);
  await canvas.click();
  await expect(
    section.getByRole('button', { name: 'Resume matrix animation' }),
  ).toHaveAttribute('aria-pressed', 'true');
  const paused = await canvasData(page, 'matrix');
  await page.waitForTimeout(200);
  expect(await canvasData(page, 'matrix')).toEqual(paused);
  await section
    .getByRole('button', { name: 'Resume matrix animation' })
    .click();
  await demo(page, 'ascii-logos').scrollIntoViewIfNeeded();
  await expect(section).toHaveAttribute('data-active', 'false');
  const inactive = await canvasData(page, 'matrix');
  await page.waitForTimeout(200);
  expect(await canvasData(page, 'matrix')).toEqual(inactive);
});

test('rotating grid geometry and glyph controls change its output', async ({
  page,
}) => {
  const section = demo(page, 'rotating-objects-in-a-grid');
  await section
    .getByRole('spinbutton', { name: 'Cols', exact: true })
    .fill('24');
  await section
    .getByRole('spinbutton', { name: 'H-Sep', exact: true })
    .fill('8');
  await section.getByRole('button', { name: 'Use ☆ symbol' }).click();
  await expect(section.locator('canvas')).toHaveAttribute(
    'aria-label',
    'Rotating grid of ☆ symbols, 20 rows and 24 columns',
  );
});
