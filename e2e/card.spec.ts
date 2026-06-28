import { test, expect, type Page } from '@playwright/test';

/** The recorded mock-`hass` service calls. */
type Call = { domain: string; service: string; data?: any; target?: any };

const calls = (page: Page): Promise<Call[]> => page.evaluate(() => (window as any).__calls);

test.beforeEach(async ({ page }) => {
  await page.goto('/e2e/index.html');
  await page.waitForFunction(() => (window as any).__ready === true);
  // the dial waits a frame for ResizeObserver-driven layout
  await page.waitForSelector('material-thermostat-card mt-circular-dial svg');
});

test('renders the dial and all feature rows', async ({ page }) => {
  // Playwright CSS selectors pierce open shadow roots.
  await expect(page.locator('mt-circular-dial')).toBeVisible();
  // two climate selectors (hvac icons + fan dropdown)
  await expect(page.locator('mt-climate-selector')).toHaveCount(2);
  await expect(page.locator('mt-switch-group')).toBeVisible();
  await expect(page.locator('mt-entity-tile')).toBeVisible();
  // the big center temperature shows the target (21)
  await expect(page.locator('mt-circular-dial .value-text')).toHaveText('21.0');
  // the entity tile shows its sensor value + unit
  await expect(page.locator('mt-entity-tile .sub')).toHaveText('52 %');
});

test('selecting an HVAC mode chip calls climate.set_hvac_mode', async ({ page }) => {
  await page.locator('mt-climate-selector .chip[title="Heat"]').click();
  await expect
    .poll(async () => (await calls(page)).find((c) => c.service === 'set_hvac_mode'))
    .toMatchObject({ domain: 'climate', data: { hvac_mode: 'heat' } });
});

test('the fan dropdown opens and selecting an option calls set_fan_mode', async ({ page }) => {
  const dropdown = page.locator('mt-climate-selector mt-dropdown').nth(0);
  await expect(dropdown).toBeVisible();
  await dropdown.locator('.trigger').click();
  await expect(dropdown.locator('.menu')).toBeVisible();
  await dropdown.locator('.opt', { hasText: 'High' }).click();
  await expect
    .poll(async () => (await calls(page)).find((c) => c.service === 'set_fan_mode'))
    .toMatchObject({ domain: 'climate', data: { fan_mode: 'high' } });
});

test('the + step button commits a debounced set_temperature', async ({ page }) => {
  await page.locator('mt-circular-dial .step[aria-label="Increase temperature"]').click();
  // optimistic UI updates immediately
  await expect(page.locator('mt-circular-dial .value-text')).toHaveText('21.5');
  // and the service call lands after the 600ms debounce
  await expect
    .poll(async () => (await calls(page)).find((c) => c.service === 'set_temperature'), {
      timeout: 2000,
    })
    .toMatchObject({ domain: 'climate', data: { temperature: 21.5 } });
});

test('the switch group is mutually exclusive (off others, then on)', async ({ page }) => {
  // Eco is on, Boost is off — picking Boost turns Eco off then Boost on.
  await page.locator('mt-switch-group .chip[title="Boost"]').click();
  await expect
    .poll(async () => (await calls(page)).map((c) => `${c.domain}.${c.service}`))
    .toEqual(expect.arrayContaining(['homeassistant.turn_off', 'homeassistant.turn_on']));
  const recorded = await calls(page);
  const off = recorded.find((c) => c.service === 'turn_off');
  const on = recorded.find((c) => c.service === 'turn_on');
  expect(off?.data?.entity_id).toContain('switch.eco');
  expect(on?.data?.entity_id).toBe('switch.boost');
});

test('the header more-info button opens more-info for the entity', async ({ page }) => {
  await page.locator('material-thermostat-card .more').click();
  await expect.poll(() => page.evaluate(() => (window as any).__moreInfo)).toBe('climate.living_room');
});

test('the comfort feature shows a verdict from the feels-like sensors', async ({ page }) => {
  // 24°C / 52% RH reads comfortable; the row renders synchronously from the
  // shared feels-like sensors (no recorder history needed for the verdict).
  const comfort = page.locator('mt-comfort');
  await expect(comfort).toBeVisible();
  // direct-child span only (avoid the ha-icon stub's nested span via shadow piercing)
  await expect(comfort.locator('.comfort > span')).toHaveText('Room feels comfortable');
  await expect(comfort.locator('.comfort ha-icon')).toHaveAttribute(
    'icon',
    'mdi:emoticon-happy-outline'
  );
});
