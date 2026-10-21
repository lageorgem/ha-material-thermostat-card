import { expect, nextFrame } from '@open-wc/testing';
import '../../src/material-thermostat-card';
import type { MaterialThermostatCard } from '../../src/material-thermostat-card';
import type { MtFeatureRow } from '../../src/features/feature-row';
import type { FeatureAlignment, FeatureConfig, MaterialThermostatCardConfig } from '../../src/types';
import { FEATURE_GAP_PX, packFeatureRows } from '../../src/grid';
import { normalizeConfig } from '../../src/config/normalize';
import { climateState, entityState, makeHass } from '../helpers';
import type { TestHass } from '../helpers';

// Only the browser's benign resize-notification warning is suppressed.
function ignoreResizeObserverWarning(event: ErrorEvent): void {
  if (event.message === 'ResizeObserver loop completed with undelivered notifications.' ||
      event.message === 'ResizeObserver loop limit exceeded') {
    event.stopImmediatePropagation();
    event.preventDefault();
  }
}

// Register before WTR installs its error handler; keep real resize observations active.
window.addEventListener('error', ignoreResizeObserverWarning);

const selector = (width?: number, alignment?: FeatureAlignment): FeatureConfig => ({
  type: 'input-select', entity: 'input_select.test', display: 'dropdown', width, alignment,
});
const config = (features: FeatureConfig[]): MaterialThermostatCardConfig => ({
  type: 'custom:material-thermostat-card', entity: 'climate.test', font: 'theme', features,
  feels_like: { temperature: 'sensor.t', humidity: 'sensor.h' },
});
const states = (visible = false) => ({
  'climate.test': climateState({}, 'off'),
  'input_select.test': entityState('input_select.test', 'One', { options: ['One', 'Two'] }),
  'sensor.t': entityState('sensor.t', '24'),
  'sensor.h': entityState('sensor.h', visible ? '50' : 'unavailable'),
});

/** Flush the card, nested feature updates, and real browser layout. */
async function settle(card: MaterialThermostatCard): Promise<void> {
  for (let i = 0; i < 4; i++) {
    await card.updateComplete;
    await Promise.all(rows(card).map(async (row) => {
      await row.updateComplete;
      const child = row.shadowRoot!.firstElementChild as HTMLElement & { updateComplete?: Promise<boolean> };
      await child?.updateComplete;
    }));
    await nextFrame();
  }
}

function rows(card: MaterialThermostatCard): MtFeatureRow[] {
  return [...card.shadowRoot!.querySelectorAll<MtFeatureRow>('mt-feature-row')];
}
function grid(card: MaterialThermostatCard): DOMRect {
  return card.shadowRoot!.querySelector('.features')!.getBoundingClientRect();
}
function expectPosition(card: MaterialThermostatCard, index: number, span: number, columns: number, alignment: FeatureAlignment): void {
  const area = grid(card);
  const box = rows(card)[index].getBoundingClientRect();
  const width = (area.width + FEATURE_GAP_PX) * span / columns - FEATURE_GAP_PX;
  const offset = alignment === 'left' ? 0 : alignment === 'center' ? (area.width - width) / 2 : area.width - width;
  expect(box.width).to.be.closeTo(width, 1);
  expect(box.left).to.be.closeTo(area.left + offset, 1);
}

describe('feature row packing', () => {
  it('handles empty and entirely hidden inputs', () => {
    expect(packFeatureRows([], 10)).to.deep.equal([]);
    expect(packFeatureRows([undefined, undefined], 10)).to.deep.equal([undefined, undefined]);
  });
  it('packs sequentially, never densely, ignoring hidden hosts', () => {
    expect(packFeatureRows([undefined, 5, 6, undefined, 3, 10], 10)).to.deep.equal([
      undefined,
      { row: 1, column: 1, singleton: true },
      { row: 2, column: 1, singleton: false },
      undefined,
      { row: 2, column: 7, singleton: false },
      { row: 3, column: 1, singleton: true },
    ]);
    expect(packFeatureRows([3, 3, 3], 6)).to.deep.equal([
      { row: 1, column: 1, singleton: false },
      { row: 1, column: 4, singleton: false },
      { row: 2, column: 1, singleton: true },
    ]);
  });
});

describe('singleton feature alignment geometry', () => {
  let card: MaterialThermostatCard;
  after(() => window.removeEventListener('error', ignoreResizeObserverWarning));
  afterEach(async () => {
    card?.remove();
    await nextFrame();
  });

  async function mount(features: FeatureConfig[], visible = false): Promise<void> {
    card = document.createElement('material-thermostat-card');
    card.style.width = '420px';
    card.setConfig(config(features));
    card.hass = makeHass(states(visible));
    document.body.append(card);
    await settle(card);
  }
  async function replace(features: FeatureConfig[]): Promise<void> {
    card.setConfig(config(features));
    await settle(card);
  }

  for (const width of [30, 50, 70, 100]) {
    it(`moves only the width-${width} host, with exact fractional centering`, async () => {
      await mount([selector(width)]);
      const row = rows(card)[0];
      const input = row.shadowRoot!.querySelector('mt-input-select')!;
      const original = row.getBoundingClientRect();
      const contents = input.shadowRoot!.innerHTML;
      const textAlign = getComputedStyle(input).textAlign;
      for (const alignment of ['left', 'center', 'right'] as const) {
        await replace([selector(width, alignment)]);
        expect(rows(card)[0]).to.equal(row);
        expect(row.shadowRoot!.querySelector('mt-input-select')).to.equal(input);
        expectPosition(card, 0, width / 10, 10, alignment);
        expect(row.getBoundingClientRect().top).to.be.closeTo(original.top, 1);
        expect(row.getBoundingClientRect().height).to.be.closeTo(original.height, 1);
        expect(input.shadowRoot!.innerHTML).to.equal(contents);
        expect(getComputedStyle(input).textAlign).to.equal(textAlign);
        expect(row.style.textAlign).to.equal('');
      }
      expect((card.hass as TestHass).__calls).to.have.length(0);
    });
  }

  for (const width of [30, 50]) {
    it(`ignores alignment for two width-${width} features, including partial rows`, async () => {
      await mount([selector(width), selector(width)]);
      const before = rows(card).map((row) => row.getBoundingClientRect());
      await replace([selector(width, 'right'), selector(width, 'center')]);
      rows(card).forEach((row, i) => {
        const box = row.getBoundingClientRect();
        expect(box.left).to.be.closeTo(before[i].left, 1);
        expect(box.width).to.be.closeTo(before[i].width, 1);
        expect(box.top).to.be.closeTo(before[0].top, 1);
        expect(row.style.width).to.equal('');
        expect(row.style.justifySelf).to.equal('');
      });
    });
  }

  it('wraps 50+60 and leaves the following full row in place, without dense backfill', async () => {
    await mount([selector(50), selector(60), selector(100)]);
    const before = rows(card).map((row) => row.getBoundingClientRect());
    await replace([selector(50, 'right'), selector(60, 'center'), selector(100, 'right')]);
    expectPosition(card, 0, 5, 10, 'right');
    expectPosition(card, 1, 6, 10, 'center');
    expectPosition(card, 2, 10, 10, 'right');
    rows(card).forEach((row, i) => expect(row.getBoundingClientRect().top).to.be.closeTo(before[i].top, 1));
    expect(before[1].top).to.be.closeTo(before[0].bottom + FEATURE_GAP_PX, 1);
    expect(before[2].top).to.be.closeTo(before[1].bottom + FEATURE_GAP_PX, 1);
  });

  it('defaults missing and invalid alignment to physical left, without mutating frozen YAML', async () => {
    await mount([selector(50)]);
    expectPosition(card, 0, 5, 10, 'left');
    const feature = Object.freeze({ ...selector(50), alignment: 'bogus' }) as unknown as FeatureConfig;
    const frozen = Object.freeze(config([feature]));
    card.setConfig(frozen);
    await settle(card);
    expectPosition(card, 0, 5, 10, 'left');
    expect(feature.alignment).to.equal('bogus');
    for (const alignment of ['left', 'center', 'right'] as const) {
      const source = Object.freeze(config([Object.freeze(selector(30, alignment))]));
      expect(normalizeConfig(source).features![0].alignment).to.equal(alignment);
    }
    card.dir = 'rtl';
    await replace([selector(50, 'left')]);
    expectPosition(card, 0, 5, 10, 'left');
    await replace([selector(50, 'right')]);
    expectPosition(card, 0, 5, 10, 'right');
  });

  it('preserves defaults and rounded widths', async () => {
    await mount([{ type: 'entity-tile', entity: 'sensor.t', alignment: 'right' }]);
    expectPosition(card, 0, 5, 10, 'right');
    await replace([selector()]);
    expectPosition(card, 0, 10, 10, 'left');
    for (const [width, span] of [[44, 4], [45, 5], [3, 1], [200, 10], [0, 10]]) {
      await replace([selector(width, 'center')]);
      expectPosition(card, 0, span, 10, 'center');
    }
  });

  it('preserves normal RTL order for shared rows', async () => {
    await mount([selector(30, 'right'), selector(30, 'left')]);
    card.dir = 'rtl';
    await settle(card);
    const [first, second] = rows(card).map((row) => row.getBoundingClientRect());
    expect(first.right).to.be.closeTo(grid(card).right, 1);
    expect(second.right).to.be.closeTo(first.left - FEATURE_GAP_PX, 1);
    expect(first.top).to.be.closeTo(second.top, 1);
    await replace([selector(30), selector(30)]);
    expect(rows(card)[0].getBoundingClientRect().left).to.be.closeTo(first.left, 1);
    expect(rows(card)[1].getBoundingClientRect().left).to.be.closeTo(second.left, 1);
  });

  it('skips hidden comfort before and among features; show/hide recomputes singleton decisions', async () => {
    const comfort: FeatureConfig = { type: 'comfort', width: 50, alignment: 'right' };
    const configurations = [[comfort, selector(50, 'center')], [selector(50, 'center'), comfort, selector(100)]];
    await mount(configurations[0]);
    for (const features of configurations) {
      await replace(features);
      const all = rows(card);
      const comfortIndex = features.indexOf(comfort);
      const selectIndex = comfortIndex === 0 ? 1 : 0;
      const child = all[comfortIndex].shadowRoot!.querySelector('mt-comfort');
      expect(all[comfortIndex].hidden).to.equal(true);
      expectPosition(card, selectIndex, 5, 10, 'center');
      expect(all[selectIndex].getBoundingClientRect().top).to.be.closeTo(grid(card).top, 1);
      card.hass = makeHass(states(true));
      await settle(card);
      expect(all[comfortIndex].hidden).to.equal(false);
      expect(all[selectIndex].getBoundingClientRect().top).to.be.closeTo(all[comfortIndex].getBoundingClientRect().top, 1);
      expect(all[selectIndex].style.width).to.equal('');
      card.hass = makeHass(states(false));
      await settle(card);
      expect(all[comfortIndex].shadowRoot!.querySelector('mt-comfort')).to.equal(child);
      expect(all[comfortIndex].hidden).to.equal(true);
      expectPosition(card, selectIndex, 5, 10, 'center');
      if (all.length === 3) {
        expect(all[2].getBoundingClientRect().top).to.be.closeTo(all[0].getBoundingClientRect().bottom + FEATURE_GAP_PX, 1);
      }
    }
  });

  it('resets config visibility on reorder/type replacement and re-reports reused comfort visibility', async () => {
    const comfort: FeatureConfig = { type: 'comfort', width: 50 };
    await mount([comfort, selector(50, 'right')], true);
    const child = rows(card)[0].shadowRoot!.querySelector('mt-comfort');
    await replace([comfort, selector(50, 'right')]);
    expect(rows(card)[0].shadowRoot!.querySelector('mt-comfort')).to.equal(child);
    expect(rows(card)[1].style.width).to.equal('');
    await replace([selector(50, 'right'), comfort]);
    expect(rows(card).every((row) => !row.hidden)).to.equal(true);
    card.hass = makeHass(states(false));
    await settle(card);
    expect(rows(card)[1].hidden).to.equal(true);
    expectPosition(card, 0, 5, 10, 'right');
    await replace([selector(50, 'right'), selector(50, 'left')]);
    expect(rows(card).every((row) => !row.hidden)).to.equal(true);
    expect(rows(card)[0].style.width).to.equal('');
    await replace([comfort, selector(50, 'right')]);
    expect(rows(card)[0].hidden).to.equal(true);
    expectPosition(card, 1, 5, 10, 'right');
  });

  it('clears stale placement across stacked-wide-stacked and singleton-multi transitions', async () => {
    await mount([selector(30, 'center'), selector(50, 'right')]);
    const originalRows = rows(card);
    expect(originalRows[0].style.width).to.equal('');
    card.style.width = '832px';
    await settle(card);
    expect(card.shadowRoot!.querySelector('.body')!.classList.contains('wide')).to.equal(true);
    expectPosition(card, 0, 3, 5, 'center');
    expectPosition(card, 1, 5, 5, 'right');
    card.style.width = '420px';
    await settle(card);
    expect(card.shadowRoot!.querySelector('.body')!.classList.contains('stacked')).to.equal(true);
    expect(rows(card)).to.deep.equal(originalRows);
    expect(originalRows[0].style.width).to.equal('');
    expect(originalRows[0].style.justifySelf).to.equal('');
    expect(originalRows[1].getBoundingClientRect().top).to.be.closeTo(originalRows[0].getBoundingClientRect().top, 1);
    await replace([selector(50, 'right')]);
    expectPosition(card, 0, 5, 10, 'right');
    card.style.width = '832px';
    await settle(card);
    expectPosition(card, 0, 5, 5, 'right');
  });

  it('ignores unrelated visibility events and duplicate comfort visibility notifications', async () => {
    await mount([selector(50, 'right'), { type: 'comfort', width: 50 }], true);
    const all = rows(card);
    all[0].dispatchEvent(new CustomEvent('feature-row-visibility', { detail: { visible: false } }));
    const comfort = all[1].shadowRoot!.querySelector('mt-comfort')!;
    all[1].dispatchEvent(new CustomEvent('feature-row-visibility', {
      detail: { feature: selector(), visible: false },
    }));
    for (let i = 0; i < 2; i++) {
      comfort.dispatchEvent(new CustomEvent('feature-visibility', { detail: { visible: true } }));
      all[1].dispatchEvent(new CustomEvent('feature-row-visibility', {
        detail: { feature: all[1].feature, visible: true },
      }));
    }
    await settle(card);
    expect(all[0].hidden).to.equal(false);
    expect(all[0].style.width).to.equal('');
    expect(all[1].hidden).to.equal(false);
  });
});
