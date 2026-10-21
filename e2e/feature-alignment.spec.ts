import { test, expect, type Locator, type Page } from '@playwright/test';

// Browser risks only: saved editor changes reach layout, forced-colors feedback,
// and narrow controls. The unit suite covers all feature types and packing cases.
// The harness stubs ha-icon: icon identity/accessibility, not glyph pixels, is tested.
const editorSelector = '#alignment-editor';
const rowSelector = '#wrap mt-feature-row';
const names = ['Align left', 'Align centre', 'Align right'] as const;
const picker = (page: Page) => page.locator(`${editorSelector} mt-alignment-toggle`);
const pill = (page: Page, name: (typeof names)[number]) =>
  picker(page).getByRole('button', { name, exact: true });

test.beforeEach(async ({ page }) => {
  await page.goto('/e2e/index.html');
  await page.waitForFunction(() => (window as any).__ready === true);
  await page.evaluate(async () => {
    const w = window as any;
    const card = w.__card;
    const config = {
      type: 'custom:material-thermostat-card',
      entity: 'climate.living_room',
      font: 'theme',
      features: [{ type: 'input-select', entity: 'input_select.mode', width: 50 }],
    };
    // Reuse the fixture's real mock hass shape and service recorder. No HA backend.
    const hass = {
      ...card.hass,
      states: {
        ...card.hass.states,
        'input_select.mode': {
          entity_id: 'input_select.mode',
          state: 'eco',
          attributes: { friendly_name: 'Mode', options: ['eco', 'boost'] },
        },
      },
    };
    document.getElementById('wrap')!.style.width = '420px';
    card.hass = hass;
    card.setConfig(config);
    const editor = await card.constructor.getConfigElement();
    editor.id = 'alignment-editor';
    editor.style.cssText = 'display:block;width:420px';
    editor.hass = hass;
    editor.setConfig(config);
    w.__alignmentConfig = config;
    w.__alignmentChanges = [];
    // Simulate Lovelace's public config-changed/save/preview feedback loop only.
    editor.addEventListener('config-changed', (event: CustomEvent) => {
      const saved = structuredClone(event.detail.config);
      w.__alignmentChanges.push(saved);
      w.__alignmentConfig = saved;
      card.setConfig(saved);
      editor.setConfig(saved);
    });
    document.body.appendChild(editor);
    await Promise.all([card.updateComplete, editor.updateComplete]);
  });
  await page.locator(editorSelector).getByRole('button', { name: 'Edit feature', exact: true }).click();
  await expect(pill(page, 'Align left')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#wrap mt-input-select mt-selector-row .chip')).toHaveCount(2);
  await expect(page.locator('#wrap mt-circular-dial svg')).toBeVisible();
});

async function geometry(page: Page) {
  return page.locator('#wrap .features').evaluate((grid) => {
    const area = grid.getBoundingClientRect();
    return {
      width: area.width,
      gap: parseFloat(getComputedStyle(grid).columnGap),
      rows: Array.from(grid.querySelectorAll('mt-feature-row')).map((row) => {
        const rect = row.getBoundingClientRect();
        return { x: rect.left - area.left, y: rect.top - area.top, width: rect.width };
      }),
    };
  });
}

async function expectPosition(page: Page, fraction: number, width: number) {
  await expect.poll(async () => {
    const { width: area, rows } = await geometry(page);
    return Math.abs(rows[0].x - (area - width) * fraction);
  }).toBeLessThan(1);
  await expect.poll(async () => (await geometry(page)).rows[0].width).toBeCloseTo(width, 1);
}

test('editor alignment moves a lone 50% host without resizing and does not move a shared row', async ({ page }) => {
  const area = await geometry(page);
  const half = (area.width - area.gap) / 2;
  await expectPosition(page, 0, half);

  for (const [name, fraction, alignment] of [
    ['Align centre', 0.5, 'center'],
    ['Align right', 1, 'right'],
    ['Align left', 0, undefined],
  ] as const) {
    await pill(page, name).click();
    await expect(pill(page, name)).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => page.evaluate(() => {
      const feature = (window as any).__alignmentChanges.at(-1)?.features[0];
      return { alignment: feature?.alignment, width: feature?.width, entity: feature?.entity };
    })).toEqual({ alignment, width: 50, entity: 'input_select.mode' });
    await expectPosition(page, fraction, half);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__alignmentChanges.length)).toBe(3);

  await page.evaluate(() => {
    const w = window as any;
    const config = structuredClone(w.__alignmentConfig);
    config.features.push({ ...config.features[0] });
    w.__alignmentConfig = config;
    w.__card.setConfig(config);
    (document.getElementById('alignment-editor') as any).setConfig(config);
  });
  await expect(page.locator(rowSelector)).toHaveCount(2);
  for (const name of ['Align centre', 'Align right', 'Align left'] as const) {
    await pill(page, name).click();
    await expect(pill(page, name)).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(async () => {
      const { rows, gap } = await geometry(page);
      return Math.max(
        Math.abs(rows[0].x),
        Math.abs(rows[1].x - half - gap),
        Math.abs(rows[0].y - rows[1].y),
        ...rows.map((row) => Math.abs(row.width - half))
      );
    }).toBeLessThan(1);
  }
  expect(await page.evaluate(() => (window as any).__calls)).toEqual([]);
});

async function marker(button: Locator) {
  return button.evaluate((element) => {
    const style = getComputedStyle(element, '::after');
    return {
      content: style.content,
      width: parseFloat(style.width),
      border: parseFloat(style.borderBottomWidth),
      borderStyle: style.borderBottomStyle,
      borderColor: style.borderBottomColor,
      color: style.color,
    };
  });
}

async function expectMarker(button: Locator) {
  const style = await marker(button);
  expect(style.content).not.toBe('none');
  expect(style.width).toBeGreaterThan(0);
  expect(style.border).toBeGreaterThan(0);
  expect(style.borderStyle).toBe('solid');
  expect(style.borderColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(style.borderColor).toBe(style.color);
}

test('forced colors retain the selected underline independently of keyboard focus', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(true);
  const left = pill(page, 'Align left');
  const centre = pill(page, 'Align centre');
  const right = pill(page, 'Align right');
  await expectMarker(left);

  // Native Tab must reach a different pill without moving selection.
  await left.focus();
  await page.keyboard.press('Tab');
  await expect(centre).toBeFocused();
  await expect(left).toHaveAttribute('aria-pressed', 'true');
  await expect(centre).toHaveAttribute('aria-pressed', 'false');
  await expectMarker(left);
  const focus = await centre.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      visible: element.matches(':focus-visible'),
      width: parseFloat(style.outlineWidth),
      style: style.outlineStyle,
      offset: parseFloat(style.outlineOffset),
      color: style.outlineColor,
    };
  });
  expect(focus.visible).toBe(true);
  expect(focus.width).toBeGreaterThan(0);
  expect(focus.style).toBe('solid');
  expect(focus.offset).toBeLessThan(0);
  expect(focus.color).not.toBe('rgba(0, 0, 0, 0)');
  expect((await marker(centre)).content).toBe('none');

  await page.keyboard.press('Enter');
  await expect(centre).toHaveAttribute('aria-pressed', 'true');
  await expect(left).toHaveAttribute('aria-pressed', 'false');
  await expectMarker(centre);
  await right.click();
  await expect(right).toHaveAttribute('aria-pressed', 'true');
  await expect(centre).toHaveAttribute('aria-pressed', 'false');
  await expectMarker(right);
  // Re-open from the emitted config: selection is saved, not transient focus state.
  const edit = page.locator(editorSelector).getByRole('button', { name: 'Edit feature', exact: true });
  await edit.click();
  await expect(picker(page)).toHaveCount(0);
  await edit.click();
  await expect(right).toHaveAttribute('aria-pressed', 'true');
  await expectMarker(right);
  await expectPosition(page, 1, ((await geometry(page)).width - (await geometry(page)).gap) / 2);
});

test('320px editor keeps width controls contained and exposes named alignment icons', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.evaluate(() => {
    // The fixture adds 24px body padding; fit both public hosts to the viewport.
    document.body.style.padding = '0';
    document.getElementById('wrap')!.style.width = '320px';
    document.getElementById('alignment-editor')!.style.width = '320px';
  });
  const field = page.locator(`${editorSelector} mt-width-field`);
  await expect(field).toBeVisible();
  await expect.poll(() => field.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const root = element.shadowRoot!;
    const controls = [root.querySelector('.width-controls')!, root.querySelector('mt-grid-slider')!, root.querySelector('mt-alignment-toggle')!];
    return Math.max(
      element.scrollWidth - element.clientWidth,
      ...controls.flatMap((control) => {
        const rect = control.getBoundingClientRect();
        return [bounds.left - rect.left, rect.right - bounds.right, -rect.width];
      })
    );
  })).toBeLessThanOrEqual(1);
  await expect(picker(page).getByRole('group', { name: 'Feature alignment' })).toBeVisible();
  for (const [index, name] of names.entries()) {
    const button = pill(page, name);
    await expect(button).toBeVisible();
    await expect(button).toHaveAccessibleName(name);
    await expect(button.locator('ha-icon')).toHaveAttribute('icon', [
      'mdi:format-align-left', 'mdi:format-align-center', 'mdi:format-align-right',
    ][index]);
    await expect(button.locator('ha-icon')).toHaveAttribute('aria-hidden', 'true');
  }
  await pill(page, 'Align right').click();
  await expect(pill(page, 'Align right')).toHaveAttribute('aria-pressed', 'true');
  const { width, gap } = await geometry(page);
  await expectPosition(page, 1, (width - gap) / 2);
});
