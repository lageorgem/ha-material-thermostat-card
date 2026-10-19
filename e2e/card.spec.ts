import { test, expect, type Page } from '@playwright/test';

/** The recorded mock-`hass` service calls. */
type Call = { domain: string; service: string; data?: any; target?: any };

const calls = (page: Page): Promise<Call[]> => page.evaluate(() => (window as any).__calls);

test.beforeEach(async ({ page }) => {
  await page.clock.install();
  await page.goto('/e2e/index.html');
  await page.waitForFunction(() => (window as any).__ready === true);
  // the dial waits a frame for ResizeObserver-driven layout
  await page.waitForSelector('#wrap material-thermostat-card mt-circular-dial svg');
  await page.waitForSelector('#wh material-thermostat-card mt-circular-dial svg');
});

test('renders the dial and all feature rows', async ({ page }) => {
  // Playwright CSS selectors pierce open shadow roots.
  await expect(page.locator('#wrap mt-circular-dial')).toBeVisible();
  // three climate selectors (hvac icons + fan dropdown + horizontal swing icons)
  await expect(page.locator('#wrap mt-climate-selector')).toHaveCount(3);
  await expect(page.locator('#wrap mt-switch-group')).toBeVisible();
  await expect(page.locator('#wrap mt-entity-tile')).toBeVisible();
  // the big center temperature shows the target (21): whole numbers have no decimal
  await expect(page.locator('#wrap mt-circular-dial .value-text')).toHaveText('21');
  await expect(page.locator('#wrap mt-circular-dial .value-text sup')).toHaveCount(0);
  // the entity tile shows its sensor value + unit
  await expect(page.locator('#wrap mt-entity-tile .value')).toHaveText('52 %');
});

test('selecting an HVAC mode chip calls climate.set_hvac_mode', async ({ page }) => {
  await page.locator('#wrap mt-climate-selector .chip[title="Heat"]').click();
  await expect
    .poll(async () => (await calls(page)).find((c) => c.service === 'set_hvac_mode'))
    .toMatchObject({ domain: 'climate', data: { hvac_mode: 'heat' } });
});

test('the fan dropdown opens and selecting an option calls set_fan_mode', async ({ page }) => {
  const dropdown = page.locator('#wrap mt-climate-selector mt-dropdown').nth(0);
  await expect(dropdown).toBeVisible();
  await dropdown.locator('.trigger').click();
  await expect(dropdown.locator('.menu')).toBeVisible();
  await dropdown.locator('.opt', { hasText: 'High' }).click();
  await expect
    .poll(async () => (await calls(page)).find((c) => c.service === 'set_fan_mode'))
    .toMatchObject({ domain: 'climate', data: { fan_mode: 'high' } });
});

test('the + step button commits a debounced set_temperature', async ({ page }) => {
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.locator('#wrap mt-circular-dial .step[aria-label="Increase temperature"]').click();
  // optimistic UI updates immediately: 21.5 renders as "21" + superscript "5"
  await expect(page.locator('#wrap mt-circular-dial .value-text sup')).toHaveText('5');
  await expect(page.locator('#wrap mt-circular-dial .value-text')).toHaveText('215');
  expect(await calls(page)).toEqual([]);
  await page.clock.runFor(599);
  expect(await calls(page)).toEqual([]);
  await page.clock.runFor(1);
  const expected = [
    expect.objectContaining({
      domain: 'climate',
      service: 'set_temperature',
      data: { entity_id: 'climate.living_room', temperature: 21.5 },
    }),
  ];
  expect(await calls(page)).toEqual(expected);
  // A second, delayed call must not escape the singleton assertion.
  await page.clock.runFor(600);
  expect(await calls(page)).toEqual(expected);
});

test('the switch group is mutually exclusive (off others, then on)', async ({ page }) => {
  // Eco is on, Boost is off — picking Boost turns Eco off then Boost on.
  await page.locator('#wrap mt-switch-group .chip[title="Boost"]').click();
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
  await page.locator('#wrap material-thermostat-card .more').click();
  await expect.poll(() => page.evaluate(() => (window as any).__moreInfo)).toBe('climate.living_room');
});

test('the comfort feature shows a verdict from the feels-like sensors', async ({ page }) => {
  // 24°C / 52% RH reads comfortable; the row renders synchronously from the
  // shared feels-like sensors (no recorder history needed for the verdict).
  const comfort = page.locator('#wrap mt-comfort');
  await expect(comfort).toBeVisible();
  // direct-child span only (avoid the ha-icon stub's nested span via shadow piercing)
  await expect(comfort.locator('.comfort > span')).toHaveText('Room feels comfortable');
  await expect(comfort.locator('.comfort ha-icon')).toHaveAttribute(
    'icon',
    'mdi:emoticon-happy-outline'
  );
});

test('the water heater + button commits one set_temperature with its target step', async ({ page }) => {
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  const card = page.locator('#wh material-thermostat-card');
  await card.getByRole('button', { name: 'Increase temperature', exact: true }).click();
  await expect(card.locator('mt-circular-dial .value-text')).toHaveText('555');
  await expect(card.locator('mt-circular-dial .value-text sup')).toHaveText('5');
  expect(await calls(page)).toEqual([]);
  await page.clock.runFor(599);
  expect(await calls(page)).toEqual([]);
  await page.clock.runFor(1);
  const expected = [
    expect.objectContaining({
      domain: 'water_heater',
      service: 'set_temperature',
      data: { entity_id: 'water_heater.boiler', temperature: 55.5 },
    }),
  ];
  expect(await calls(page)).toEqual(expected);
  await page.clock.runFor(600);
  expect(await calls(page)).toEqual(expected);
});

test('selecting Electric calls water_heater.set_operation_mode', async ({ page }) => {
  await page.locator('#wh material-thermostat-card .chip[title="Electric"]').click();
  await expect.poll(() => calls(page)).toEqual([
    expect.objectContaining({
      domain: 'water_heater',
      service: 'set_operation_mode',
      data: { entity_id: 'water_heater.boiler', operation_mode: 'electric' },
    }),
  ]);
});

test('selecting Away mode enables water heater away mode', async ({ page }) => {
  await page.locator('#wh material-thermostat-card .chip[title="Away mode"]').click();
  await expect.poll(() => calls(page)).toEqual([
    expect.objectContaining({
      domain: 'water_heater',
      service: 'set_away_mode',
      data: { entity_id: 'water_heater.boiler', away_mode: true },
    }),
  ]);
});

test('selecting Left calls climate.set_swing_horizontal_mode', async ({ page }) => {
  await page.locator('#wrap material-thermostat-card .chip[title="Left"]').click();
  await expect.poll(() => calls(page)).toEqual([
    expect.objectContaining({
      domain: 'climate',
      service: 'set_swing_horizontal_mode',
      data: { entity_id: 'climate.living_room', swing_horizontal_mode: 'left' },
    }),
  ]);
});
