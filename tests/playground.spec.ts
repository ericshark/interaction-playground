import { expect, test, type Page } from '@playwright/test';

const demo = (page: Page, name: string) =>
  page.locator(`[data-demo="${name}"]`);
const canvasData = (page: Page, name: string) =>
  demo(page, name)
    .locator('canvas')
    .evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('all 25 demos render with local assets and no page errors or horizontal overflow', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.reload();
  await expect(page.locator('[data-demo]')).toHaveCount(25);
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
  await section
    .getByRole('button', { name: 'Next stacked photograph', exact: true })
    .click();
  await expect(section.getByText('02 / 05')).toBeVisible();
  await section
    .getByRole('button', { name: 'Previous stacked photograph', exact: true })
    .click();
  await expect(section.getByText('01 / 05')).toBeVisible();
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

test('3D gallery changes its focused image', async ({ page }) => {
  const section = demo(page, '3d-gallery-carousel');
  await section
    .getByRole('button', { name: 'Next gallery image', exact: true })
    .click();
  await expect(
    section.getByRole('button', { name: 'View gallery photograph 2' }),
  ).toHaveAttribute('aria-pressed', 'true');
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
  await section.getByLabel('Voice provider').selectOption('Claude');
  await section.getByRole('button', { name: 'Start voice preview' }).click();
  await expect(
    section.getByRole('button', { name: 'Stop listening' }),
  ).toHaveAttribute('aria-pressed', 'true');
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
  await section.getByRole('button', { name: 'Select image 1' }).click();
  await section.getByRole('button', { name: 'Select image 3' }).click();
  await section.getByRole('button', { name: 'Send 2 images' }).click();
  await expect(section.getByText('Delivered.')).toBeVisible();
  await section.getByRole('button', { name: 'Send more images' }).click();
  await expect(
    section.getByRole('button', { name: 'Select image 1' }),
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

test('time-zone widgets change format, reorder, edit, add, and remove', async ({
  page,
}) => {
  const section = demo(page, 'time-zones');
  await section.getByRole('button', { name: '24', exact: true }).click();
  await expect(section.locator('.clock-timeline').first()).not.toContainText(
    /AM|PM/,
  );
  await section
    .getByRole('button', { name: 'Move San Francisco clock left' })
    .focus();
  await page.keyboard.press('Enter');
  await expect(section.locator('.clock-widget').first()).toContainText(
    'San Francisco',
  );
  await section
    .getByRole('button', { name: 'Edit San Francisco clock' })
    .click();
  await section.getByLabel('Clock city').selectOption('5');
  await expect(
    section.getByRole('button', { name: 'Edit Kathmandu clock' }),
  ).toBeVisible();
  await section.getByRole('button', { name: 'Add clock widget' }).click();
  await expect(section.locator('.clock-widget')).toHaveCount(3);
  await section.getByRole('button', { name: 'Remove Kathmandu clock' }).click();
  await expect(section.locator('.clock-widget')).toHaveCount(2);
});

test('time-zone widgets can be dragged into a new order', async ({ page }) => {
  const section = demo(page, 'time-zones');
  await section.scrollIntoViewIfNeeded();
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
  await page.mouse.move(target.x, target.y, { steps: 15 });
  await page.mouse.up();
  await expect(section.locator('.clock-widget').first()).toContainText(
    'San Francisco',
  );
});

test('Dynamic Island morphs between its four modes', async ({ page }) => {
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
  await section.getByRole('button', { name: 'Calendar', exact: true }).click();
  await expect(section.getByText('Make something good.')).toBeVisible();
  await section.getByRole('button', { name: 'Default', exact: true }).click();
  await expect(section.getByText('Explore', { exact: true })).toBeVisible();
});

test('logo paths and loading characters animate', async ({ page }) => {
  const logo = demo(page, 'slightly-animated-v0-logo');
  await logo.scrollIntoViewIfNeeded();
  await expect(logo.getByRole('img')).toBeVisible();
  await expect(logo.locator('.logo-tracer')).toHaveCSS(
    'animation-name',
    'trace',
  );
  const loading = demo(page, 'loading-text');
  await loading.scrollIntoViewIfNeeded();
  await expect(loading.getByRole('status')).toHaveAttribute(
    'aria-label',
    'Scanning web for insights',
  );
  await expect(loading.getByRole('status')).toHaveAttribute(
    'aria-label',
    'Thinking through the details',
    { timeout: 7000 },
  );
});

test('search filters commands, supports keyboard selection, and Escape dismissal', async ({
  page,
}) => {
  const section = demo(page, 'slim-dropdown');
  await section.getByRole('button', { name: 'Search', exact: true }).click();
  await section.getByRole('combobox').fill('settings');
  await expect(section.getByRole('option')).toHaveCount(1);
  await section.getByRole('combobox').press('Enter');
  await expect(section.getByRole('status')).toHaveText('Settings');
  await section.getByRole('button', { name: 'Search', exact: true }).click();
  await section.getByRole('combobox').fill('no results for this');
  await expect(
    section.getByText('No matches. Try another search.'),
  ).toBeVisible();
  await section.getByRole('combobox').press('Escape');
  await expect(section.getByRole('listbox')).toHaveCount(0);
});

test('category filters can be selected, removed, and dismissed', async ({
  page,
}) => {
  const section = demo(page, 'filter-dropdown');
  await section.getByRole('button', { name: 'Design', exact: true }).click();
  await expect(
    section.getByRole('button', { name: 'Remove Design filter' }),
  ).toBeVisible();
  await section.getByRole('button', { name: 'Remove Design filter' }).click();
  await expect(
    section.getByRole('button', { name: 'Design', exact: true }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(
    section.getByRole('button', { name: 'Select filter' }),
  ).toHaveAttribute('aria-expanded', 'false');
});

test('expanded search menu stays inside its demo section', async ({ page }) => {
  const section = demo(page, 'slim-dropdown');
  await section.getByRole('button', { name: 'Search', exact: true }).click();
  await expect
    .poll(async () => {
      const bounds = await section.boundingBox();
      const menu = await section.getByRole('listbox').boundingBox();
      return Boolean(
        bounds &&
        menu &&
        menu.y >= bounds.y &&
        menu.y + menu.height <= bounds.y + bounds.height,
      );
    })
    .toBe(true);
});

test('calendar expands and tracks completed tasks', async ({ page }) => {
  const section = demo(page, 'calendar-block');
  await section.getByRole('button', { name: /Today's Tasks/ }).click();
  await section
    .getByRole('checkbox', { name: 'Explore a new direction' })
    .check();
  await expect(
    section.getByRole('button', { name: /Today's Tasks/ }),
  ).toContainText('3 tasks');
  await page.keyboard.press('Escape');
  await expect(section.getByRole('checkbox')).toHaveCount(0);
});

test('info carousel supports manual navigation', async ({ page }) => {
  const section = demo(page, 'info-carousel');
  await section
    .getByRole('button', { name: 'Show slide 2: Design Inspiration' })
    .click();
  await expect(
    section.getByRole('button', { name: 'Show slide 2: Design Inspiration' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(section.locator('.info-slide[aria-hidden=false]')).toContainText(
    'Soothing Pastels',
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

test('reduced motion freezes loops while manual canvas controls still redraw', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  const section = demo(page, 'ascii-logos');
  await section.scrollIntoViewIfNeeded();
  await expect(section).toHaveAttribute('data-active', 'true');
  const initial = await canvasData(page, 'ascii-logos');
  await page.waitForTimeout(200);
  expect(await canvasData(page, 'ascii-logos')).toEqual(initial);
  await section.getByRole('button', { name: 'Next logo' }).click();
  expect(await canvasData(page, 'ascii-logos')).not.toEqual(initial);
  const logo = demo(page, 'slightly-animated-v0-logo');
  await logo.scrollIntoViewIfNeeded();
  await expect(logo.locator('.logo-tracer')).toHaveCSS(
    'animation-name',
    'none',
  );
});
