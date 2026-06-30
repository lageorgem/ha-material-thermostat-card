import { fixture, html, expect } from '@open-wc/testing';
import { makeHass, climateState, entityState, oncePromise } from '../helpers';
import type { TestHass } from '../helpers';

import '../../src/features/climate-selector';
import '../../src/features/input-select';
import '../../src/features/switch-group';
import '../../src/features/switch-list';
import '../../src/features/button-list';

import type { MtClimateSelector } from '../../src/features/climate-selector';
import type { MtInputSelect } from '../../src/features/input-select';
import type { MtSwitchGroup } from '../../src/features/switch-group';
import type { MtSwitchList } from '../../src/features/switch-list';
import type { MtButtonList } from '../../src/features/button-list';
import type { MtSelectorRow } from '../../src/features/selector-row';
import type { SelectorItem } from '../../src/types';

/** Grab the nested `mt-selector-row` rendered by a feature component. */
function selectorRow(el: HTMLElement): MtSelectorRow | null {
  return el.shadowRoot!.querySelector('mt-selector-row');
}

/** Read the `items` the feature handed to its `mt-selector-row`. */
function rowItems(el: HTMLElement): SelectorItem[] {
  const row = selectorRow(el);
  return (row?.items ?? []) as SelectorItem[];
}

/** The rendered `.chip` buttons inside the nested selector-row. */
function chips(el: HTMLElement): HTMLButtonElement[] {
  const row = selectorRow(el);
  if (!row) return [];
  return Array.from(row.shadowRoot!.querySelectorAll('.chip')) as HTMLButtonElement[];
}

/**
 * Trigger a selection by dispatching the nested row's `item-selected` event,
 * exactly as `mt-selector-row._select` does.
 */
function selectValue(el: HTMLElement, value: string): void {
  const row = selectorRow(el)!;
  row.dispatchEvent(
    new CustomEvent('item-selected', {
      detail: { value },
      bubbles: true,
      composed: true,
    })
  );
}

describe('mt-climate-selector', () => {
  describe('_build / render early returns', () => {
    it('renders nothing when there is no state for entityId', async () => {
      const hass = makeHass({});
      const el = await fixture<MtClimateSelector>(
        html`<mt-climate-selector
          .hass=${hass}
          entityId="climate.missing"
          kind="hvac"
        ></mt-climate-selector>`
      );
      expect(selectorRow(el)).to.equal(null);
      expect(el.shadowRoot!.textContent!.trim()).to.equal('');
    });

    it('renders nothing when state exists but the mode list is empty', async () => {
      // hvac_modes explicitly empty -> values=[] -> items=[] -> nothing
      const hass = makeHass({ 'climate.test': climateState({ hvac_modes: [] }) });
      const el = await fixture<MtClimateSelector>(
        html`<mt-climate-selector
          .hass=${hass}
          entityId="climate.test"
          kind="hvac"
        ></mt-climate-selector>`
      );
      expect(selectorRow(el)).to.equal(null);
    });
  });

  describe('kind: hvac', () => {
    it('builds items from hvac_modes with state as active and default icons', async () => {
      const hass = makeHass({ 'climate.test': climateState({}, 'heat') });
      const el = await fixture<MtClimateSelector>(
        html`<mt-climate-selector
          .hass=${hass}
          entityId="climate.test"
          kind="hvac"
        ></mt-climate-selector>`
      );
      const items = rowItems(el);
      expect(items.map((i) => i.value)).to.deep.equal([
        'off',
        'cool',
        'heat',
        'heat_cool',
        'auto',
        'dry',
        'fan_only',
      ]);
      // active is the entity state
      expect(items.find((i) => i.value === 'heat')!.active).to.be.true;
      expect(items.find((i) => i.value === 'cool')!.active).to.be.false;
      // default icons from HVAC_MODE_ICONS
      expect(items.find((i) => i.value === 'off')!.icon).to.equal('mdi:power');
      expect(items.find((i) => i.value === 'cool')!.icon).to.equal('mdi:snowflake');
      expect(items.find((i) => i.value === 'heat_cool')!.icon).to.equal('mdi:sun-snowflake-variant');
      // pretty labels
      expect(items.find((i) => i.value === 'fan_only')!.label).to.equal('Fan Only');
      expect(items.find((i) => i.value === 'heat_cool')!.label).to.equal('Heat/Cool');
    });

    it('falls back to mdi:thermostat for an unknown hvac mode', async () => {
      const hass = makeHass({
        'climate.test': climateState({ hvac_modes: ['off', 'eco_unknown'] }),
      });
      const el = await fixture<MtClimateSelector>(
        html`<mt-climate-selector
          .hass=${hass}
          entityId="climate.test"
          kind="hvac"
        ></mt-climate-selector>`
      );
      const items = rowItems(el);
      expect(items.find((i) => i.value === 'eco_unknown')!.icon).to.equal('mdi:thermostat');
    });

    it('falls back to [] when hvac_modes attribute is missing', async () => {
      const hass = makeHass({ 'climate.test': climateState({ hvac_modes: undefined }) });
      const el = await fixture<MtClimateSelector>(
        html`<mt-climate-selector
          .hass=${hass}
          entityId="climate.test"
          kind="hvac"
        ></mt-climate-selector>`
      );
      expect(selectorRow(el)).to.equal(null);
    });

    it('_onSelect calls climate.set_hvac_mode', async () => {
      const hass = makeHass({ 'climate.test': climateState() });
      const el = await fixture<MtClimateSelector>(
        html`<mt-climate-selector
          .hass=${hass}
          entityId="climate.test"
          kind="hvac"
        ></mt-climate-selector>`
      );
      selectValue(el, 'heat');
      expect(hass.__calls).to.have.lengthOf(1);
      expect(hass.__calls[0]).to.deep.include({ domain: 'climate', service: 'set_hvac_mode' });
      expect(hass.__calls[0].data).to.deep.equal({ entity_id: 'climate.test', hvac_mode: 'heat' });
    });

    it('_onSelect via a real chip click calls the service', async () => {
      const hass = makeHass({ 'climate.test': climateState() });
      const el = await fixture<MtClimateSelector>(
        html`<mt-climate-selector
          .hass=${hass}
          entityId="climate.test"
          kind="hvac"
        ></mt-climate-selector>`
      );
      const buttons = chips(el);
      // index 1 is 'cool'
      buttons[1].click();
      expect(hass.__calls).to.have.lengthOf(1);
      expect(hass.__calls[0].data).to.deep.equal({ entity_id: 'climate.test', hvac_mode: 'cool' });
    });
  });

  describe('kind: fan', () => {
    it('builds items from fan_modes, active = fan_mode, fanIcon defaults', async () => {
      const hass = makeHass({ 'climate.test': climateState() });
      const el = await fixture<MtClimateSelector>(
        html`<mt-climate-selector
          .hass=${hass}
          entityId="climate.test"
          kind="fan"
        ></mt-climate-selector>`
      );
      const items = rowItems(el);
      expect(items.map((i) => i.value)).to.deep.equal(['auto', 'low', 'medium', 'high']);
      // fan_mode = 'low'
      expect(items.find((i) => i.value === 'low')!.active).to.be.true;
      expect(items.find((i) => i.value === 'auto')!.active).to.be.false;
      // fanIcon heuristics
      expect(items.find((i) => i.value === 'auto')!.icon).to.equal('mdi:fan-auto');
      expect(items.find((i) => i.value === 'low')!.icon).to.equal('mdi:fan-speed-1');
      expect(items.find((i) => i.value === 'medium')!.icon).to.equal('mdi:fan-speed-2');
      expect(items.find((i) => i.value === 'high')!.icon).to.equal('mdi:fan-speed-3');
    });

    it('falls back to [] when fan_modes is missing', async () => {
      const hass = makeHass({ 'climate.test': climateState({ fan_modes: undefined }) });
      const el = await fixture<MtClimateSelector>(
        html`<mt-climate-selector
          .hass=${hass}
          entityId="climate.test"
          kind="fan"
        ></mt-climate-selector>`
      );
      expect(selectorRow(el)).to.equal(null);
    });

    it('_onSelect calls climate.set_fan_mode', async () => {
      const hass = makeHass({ 'climate.test': climateState() });
      const el = await fixture<MtClimateSelector>(
        html`<mt-climate-selector
          .hass=${hass}
          entityId="climate.test"
          kind="fan"
        ></mt-climate-selector>`
      );
      selectValue(el, 'high');
      expect(hass.__calls).to.have.lengthOf(1);
      expect(hass.__calls[0]).to.deep.include({ domain: 'climate', service: 'set_fan_mode' });
      expect(hass.__calls[0].data).to.deep.equal({ entity_id: 'climate.test', fan_mode: 'high' });
    });
  });

  describe('kind: swing', () => {
    it('builds items from swing_modes, active = swing_mode, swingIcon defaults', async () => {
      const hass = makeHass({ 'climate.test': climateState() });
      const el = await fixture<MtClimateSelector>(
        html`<mt-climate-selector
          .hass=${hass}
          entityId="climate.test"
          kind="swing"
        ></mt-climate-selector>`
      );
      const items = rowItems(el);
      expect(items.map((i) => i.value)).to.deep.equal(['off', 'vertical', 'horizontal', 'both']);
      // swing_mode = 'vertical'
      expect(items.find((i) => i.value === 'vertical')!.active).to.be.true;
      expect(items.find((i) => i.value === 'off')!.active).to.be.false;
      // swingIcon heuristics
      expect(items.find((i) => i.value === 'off')!.icon).to.equal('mdi:arrow-expand-vertical');
      expect(items.find((i) => i.value === 'vertical')!.icon).to.equal('mdi:arrow-up-down');
      expect(items.find((i) => i.value === 'horizontal')!.icon).to.equal('mdi:arrow-left-right');
      expect(items.find((i) => i.value === 'both')!.icon).to.equal('mdi:arrow-all');
    });

    it('falls back to [] when swing_modes is missing', async () => {
      const hass = makeHass({ 'climate.test': climateState({ swing_modes: undefined }) });
      const el = await fixture<MtClimateSelector>(
        html`<mt-climate-selector
          .hass=${hass}
          entityId="climate.test"
          kind="swing"
        ></mt-climate-selector>`
      );
      expect(selectorRow(el)).to.equal(null);
    });

    it('_onSelect calls climate.set_swing_mode', async () => {
      const hass = makeHass({ 'climate.test': climateState() });
      const el = await fixture<MtClimateSelector>(
        html`<mt-climate-selector
          .hass=${hass}
          entityId="climate.test"
          kind="swing"
        ></mt-climate-selector>`
      );
      selectValue(el, 'both');
      expect(hass.__calls).to.have.lengthOf(1);
      expect(hass.__calls[0]).to.deep.include({ domain: 'climate', service: 'set_swing_mode' });
      expect(hass.__calls[0].data).to.deep.equal({ entity_id: 'climate.test', swing_mode: 'both' });
    });
  });

  describe('kind: preset', () => {
    it('builds items from preset_modes, active = preset_mode, presetIcon defaults', async () => {
      const hass = makeHass({
        'climate.test': climateState({
          preset_modes: ['none', 'eco', 'away', 'boost'],
          preset_mode: 'eco',
        }),
      });
      const el = await fixture<MtClimateSelector>(
        html`<mt-climate-selector
          .hass=${hass}
          entityId="climate.test"
          kind="preset"
        ></mt-climate-selector>`
      );
      const items = rowItems(el);
      expect(items.map((i) => i.value)).to.deep.equal(['none', 'eco', 'away', 'boost']);
      expect(items.find((i) => i.value === 'eco')!.active).to.be.true;
      expect(items.find((i) => i.value === 'none')!.active).to.be.false;
      // presetIcon heuristics
      expect(items.find((i) => i.value === 'none')!.icon).to.equal('mdi:cancel');
      expect(items.find((i) => i.value === 'eco')!.icon).to.equal('mdi:leaf');
      expect(items.find((i) => i.value === 'away')!.icon).to.equal('mdi:home-export-outline');
      expect(items.find((i) => i.value === 'boost')!.icon).to.equal('mdi:rocket-launch');
    });

    it('falls back to [] when preset_modes is missing', async () => {
      const hass = makeHass({ 'climate.test': climateState({ preset_modes: undefined }) });
      const el = await fixture<MtClimateSelector>(
        html`<mt-climate-selector
          .hass=${hass}
          entityId="climate.test"
          kind="preset"
        ></mt-climate-selector>`
      );
      expect(selectorRow(el)).to.equal(null);
    });

    it('_onSelect calls climate.set_preset_mode', async () => {
      const hass = makeHass({
        'climate.test': climateState({ preset_modes: ['none', 'eco'], preset_mode: 'none' }),
      });
      const el = await fixture<MtClimateSelector>(
        html`<mt-climate-selector
          .hass=${hass}
          entityId="climate.test"
          kind="preset"
        ></mt-climate-selector>`
      );
      selectValue(el, 'eco');
      expect(hass.__calls).to.have.lengthOf(1);
      expect(hass.__calls[0]).to.deep.include({ domain: 'climate', service: 'set_preset_mode' });
      expect(hass.__calls[0].data).to.deep.equal({ entity_id: 'climate.test', preset_mode: 'eco' });
    });
  });

  describe('overrides', () => {
    it('overrides label, overrides icon, and hides options', async () => {
      const hass = makeHass({ 'climate.test': climateState() });
      const el = await fixture<MtClimateSelector>(
        html`<mt-climate-selector
          .hass=${hass}
          entityId="climate.test"
          kind="hvac"
          .options=${[
            { value: 'cool', label: 'Chill' },
            { value: 'heat', icon: 'mdi:custom-heat' },
            { value: 'dry', hide: true },
          ]}
        ></mt-climate-selector>`
      );
      const items = rowItems(el);
      // 'dry' hidden
      expect(items.find((i) => i.value === 'dry')).to.equal(undefined);
      // label override
      expect(items.find((i) => i.value === 'cool')!.label).to.equal('Chill');
      // icon override
      expect(items.find((i) => i.value === 'heat')!.icon).to.equal('mdi:custom-heat');
      // unaffected option keeps defaults
      expect(items.find((i) => i.value === 'off')!.label).to.equal('Off');
      expect(items.find((i) => i.value === 'off')!.icon).to.equal('mdi:power');
    });

    it('an explicit "no icon" override (icon: "") suppresses the default → renders the label chip', async () => {
      const hass = makeHass({ 'climate.test': climateState() });
      const el = await fixture<MtClimateSelector>(
        html`<mt-climate-selector
          .hass=${hass}
          entityId="climate.test"
          kind="hvac"
          .options=${[{ value: 'cool', icon: '' }]}
        ></mt-climate-selector>`
      );
      // the item carries no icon...
      const cool = rowItems(el).find((i) => i.value === 'cool')!;
      expect(cool.icon).to.equal('');
      // ...so its chip shows the label text instead of an <ha-icon>
      const coolChip = chips(el).find((c) => c.getAttribute('aria-label') === 'Cool')!;
      expect(coolChip.querySelector('ha-icon')).to.equal(null);
      expect(coolChip.querySelector('.chip-text')!.textContent!.trim()).to.equal('Cool');
    });

    it('_overrideMap handles undefined options (?? [] fallback)', async () => {
      const hass = makeHass({ 'climate.test': climateState() });
      const el = await fixture<MtClimateSelector>(
        html`<mt-climate-selector
          .hass=${hass}
          entityId="climate.test"
          kind="hvac"
        ></mt-climate-selector>`
      );
      // No options set -> still builds full list
      expect(rowItems(el)).to.have.length(7);
    });
  });

  describe('_onSelect with no state', () => {
    it('does not call a service when state is missing', async () => {
      // Render with state so a selector-row exists, then remove the state.
      const hass = makeHass({ 'climate.test': climateState() });
      const el = await fixture<MtClimateSelector>(
        html`<mt-climate-selector
          .hass=${hass}
          entityId="climate.test"
          kind="hvac"
        ></mt-climate-selector>`
      );
      const row = selectorRow(el)!;
      // Drop the backing state -> _onSelect early-returns
      el.hass = makeHass({});
      await el.updateComplete;
      row.dispatchEvent(
        new CustomEvent('item-selected', {
          detail: { value: 'heat' },
          bubbles: true,
          composed: true,
        })
      );
      expect((el.hass as TestHass).__calls).to.have.lengthOf(0);
    });
  });

  it('forwards display to the selector-row', async () => {
    const hass = makeHass({ 'climate.test': climateState() });
    const el = await fixture<MtClimateSelector>(
      html`<mt-climate-selector
        .hass=${hass}
        entityId="climate.test"
        kind="hvac"
        display="dropdown"
      ></mt-climate-selector>`
    );
    expect(selectorRow(el)!.getAttribute('display')).to.equal('dropdown');
  });

  it('forwards a configured title (label) to the selector-row', async () => {
    const hass = makeHass({ 'climate.test': climateState() });
    const el = await fixture<MtClimateSelector>(
      html`<mt-climate-selector
        .hass=${hass}
        entityId="climate.test"
        kind="fan"
        .label=${'Fan speed'}
      ></mt-climate-selector>`
    );
    expect(selectorRow(el)!.label).to.equal('Fan speed');
  });

  describe('active-chip color (point 5)', () => {
    it('hvac selector colors the active chip with the active mode color (md-sys primary wins)', async () => {
      const hass = makeHass({ 'climate.test': climateState({}, 'heat') });
      const el = await fixture<MtClimateSelector>(
        html`<mt-climate-selector
          .hass=${hass}
          entityId="climate.test"
          kind="hvac"
        ></mt-climate-selector>`
      );
      const style = selectorRow(el)!.getAttribute('style') ?? '';
      expect(style).to.contain('--mt-selected-bg');
      // md-sys primary is preferred; the heat mode color is the fallback.
      expect(style).to.contain('var(--md-sys-color-primary');
      expect(style).to.contain('--state-climate-heat-color');
    });

    it('non-hvac selectors do not override the selected color', async () => {
      const hass = makeHass({ 'climate.test': climateState() });
      const el = await fixture<MtClimateSelector>(
        html`<mt-climate-selector
          .hass=${hass}
          entityId="climate.test"
          kind="fan"
        ></mt-climate-selector>`
      );
      expect(selectorRow(el)!.getAttribute('style')).to.equal(null);
    });
  });

  describe('tile display', () => {
    it('falls back to the per-kind title ("Mode") and sets the mode-color tile accent', async () => {
      const hass = makeHass({ 'climate.test': climateState({}, 'heat') });
      const el = await fixture<MtClimateSelector>(
        html`<mt-climate-selector
          .hass=${hass}
          entityId="climate.test"
          kind="hvac"
          display="tile"
        ></mt-climate-selector>`
      );
      // no configured label -> the default tile title for the hvac kind
      expect(selectorRow(el)!.label).to.equal('Mode');
      expect(selectorRow(el)!.getAttribute('display')).to.equal('tile');
      // the tile tint accent carries the active mode color
      const style = selectorRow(el)!.getAttribute('style') ?? '';
      expect(style).to.contain('--mt-tile-accent');
      expect(style).to.contain('--state-climate-heat-color');
    });

    it('uses the per-kind title for the fan selector', async () => {
      const hass = makeHass({ 'climate.test': climateState() });
      const el = await fixture<MtClimateSelector>(
        html`<mt-climate-selector
          .hass=${hass}
          entityId="climate.test"
          kind="fan"
          display="tile"
        ></mt-climate-selector>`
      );
      expect(selectorRow(el)!.label).to.equal('Fan');
    });

    it('a configured label wins over the per-kind default title', async () => {
      const hass = makeHass({ 'climate.test': climateState() });
      const el = await fixture<MtClimateSelector>(
        html`<mt-climate-selector
          .hass=${hass}
          entityId="climate.test"
          kind="hvac"
          display="tile"
          .label=${'Heating'}
        ></mt-climate-selector>`
      );
      expect(selectorRow(el)!.label).to.equal('Heating');
    });

    it('forces the off tile style on every climate tile when the mode is off', async () => {
      // A fan tile whose value is "auto" still reads as off when the unit is off.
      const hass = makeHass({ 'climate.test': climateState({}, 'off') });
      const el = await fixture<MtClimateSelector>(
        html`<mt-climate-selector
          .hass=${hass}
          entityId="climate.test"
          kind="fan"
          display="tile"
        ></mt-climate-selector>`
      );
      expect(selectorRow(el)!.forceOff).to.be.true;
    });

    it('does not force the off style when the mode is active', async () => {
      const hass = makeHass({ 'climate.test': climateState({}, 'cool') });
      const el = await fixture<MtClimateSelector>(
        html`<mt-climate-selector
          .hass=${hass}
          entityId="climate.test"
          kind="fan"
          display="tile"
        ></mt-climate-selector>`
      );
      expect(selectorRow(el)!.forceOff).to.be.false;
    });
  });

  describe('order', () => {
    it('respects an explicit order: listed values first, rest natural', async () => {
      const hass = makeHass({ 'climate.test': climateState() });
      const el = await fixture<MtClimateSelector>(
        html`<mt-climate-selector
          .hass=${hass}
          entityId="climate.test"
          kind="hvac"
          .order=${['heat', 'off']}
        ></mt-climate-selector>`
      );
      // heat, off first, then the remaining hvac_modes in their natural order.
      expect(rowItems(el).map((i) => i.value)).to.deep.equal([
        'heat',
        'off',
        'cool',
        'heat_cool',
        'auto',
        'dry',
        'fan_only',
      ]);
      // the rendered chips reflect the same order (title = label).
      expect(chips(el).map((c) => c.title)).to.deep.equal([
        'Heat',
        'Off',
        'Cool',
        'Heat/Cool',
        'Auto',
        'Dry',
        'Fan Only',
      ]);
    });

    it('falls back to the natural hvac_modes order without an order', async () => {
      const hass = makeHass({ 'climate.test': climateState() });
      const el = await fixture<MtClimateSelector>(
        html`<mt-climate-selector
          .hass=${hass}
          entityId="climate.test"
          kind="hvac"
        ></mt-climate-selector>`
      );
      expect(rowItems(el).map((i) => i.value)).to.deep.equal([
        'off',
        'cool',
        'heat',
        'heat_cool',
        'auto',
        'dry',
        'fan_only',
      ]);
    });
  });
});

describe('mt-input-select', () => {
  const isState = (options: string[], state = 'morning') =>
    entityState('input_select.mode', state, { options, friendly_name: 'Mode' });

  it('renders nothing when there is no state', async () => {
    const hass = makeHass({});
    const el = await fixture<MtInputSelect>(
      html`<mt-input-select .hass=${hass} entity="input_select.missing"></mt-input-select>`
    );
    expect(selectorRow(el)).to.equal(null);
  });

  it('renders nothing when options attribute is missing (?? [] fallback)', async () => {
    const hass = makeHass({
      'input_select.mode': entityState('input_select.mode', 'x', {}),
    });
    const el = await fixture<MtInputSelect>(
      html`<mt-input-select .hass=${hass} entity="input_select.mode"></mt-input-select>`
    );
    expect(selectorRow(el)).to.equal(null);
  });

  it('builds items from attributes.options with active = state.state', async () => {
    const hass = makeHass({
      'input_select.mode': isState(['morning', 'day', 'night'], 'day'),
    });
    const el = await fixture<MtInputSelect>(
      html`<mt-input-select .hass=${hass} entity="input_select.mode"></mt-input-select>`
    );
    const items = rowItems(el);
    expect(items.map((i) => i.value)).to.deep.equal(['morning', 'day', 'night']);
    expect(items.find((i) => i.value === 'day')!.active).to.be.true;
    expect(items.find((i) => i.value === 'morning')!.active).to.be.false;
    // default label = prettyLabel, default icon = undefined
    expect(items.find((i) => i.value === 'morning')!.label).to.equal('Morning');
    expect(items.find((i) => i.value === 'morning')!.icon).to.equal(undefined);
  });

  it('applies label/icon/hide overrides', async () => {
    const hass = makeHass({
      'input_select.mode': isState(['morning', 'day', 'night']),
    });
    const el = await fixture<MtInputSelect>(
      html`<mt-input-select
        .hass=${hass}
        entity="input_select.mode"
        .options=${[
          { value: 'morning', label: 'AM' },
          { value: 'day', icon: 'mdi:weather-sunny' },
          { value: 'night', hide: true },
        ]}
      ></mt-input-select>`
    );
    const items = rowItems(el);
    expect(items.find((i) => i.value === 'night')).to.equal(undefined);
    expect(items.find((i) => i.value === 'morning')!.label).to.equal('AM');
    expect(items.find((i) => i.value === 'day')!.icon).to.equal('mdi:weather-sunny');
  });

  it('_onSelect calls input_select.select_option', async () => {
    const hass = makeHass({
      'input_select.mode': isState(['morning', 'day', 'night']),
    });
    const el = await fixture<MtInputSelect>(
      html`<mt-input-select .hass=${hass} entity="input_select.mode"></mt-input-select>`
    );
    selectValue(el, 'night');
    expect(hass.__calls).to.have.lengthOf(1);
    expect(hass.__calls[0]).to.deep.include({ domain: 'input_select', service: 'select_option' });
    expect(hass.__calls[0].data).to.deep.equal({
      entity_id: 'input_select.mode',
      option: 'night',
    });
  });

  it('_onSelect does not call a service when state is missing', async () => {
    const hass = makeHass({
      'input_select.mode': isState(['morning', 'day']),
    });
    const el = await fixture<MtInputSelect>(
      html`<mt-input-select .hass=${hass} entity="input_select.mode"></mt-input-select>`
    );
    const row = selectorRow(el)!;
    el.hass = makeHass({});
    await el.updateComplete;
    row.dispatchEvent(
      new CustomEvent('item-selected', {
        detail: { value: 'day' },
        bubbles: true,
        composed: true,
      })
    );
    expect((el.hass as TestHass).__calls).to.have.lengthOf(0);
  });

  it('forwards the label to the selector-row', async () => {
    const hass = makeHass({
      'input_select.mode': isState(['morning', 'day']),
    });
    const el = await fixture<MtInputSelect>(
      html`<mt-input-select
        .hass=${hass}
        entity="input_select.mode"
        label="Scene"
      ></mt-input-select>`
    );
    expect(selectorRow(el)!.label).to.equal('Scene');
  });

  it('respects an explicit order: listed values first, rest natural', async () => {
    const hass = makeHass({
      'input_select.mode': isState(['morning', 'day', 'night'], 'day'),
    });
    const el = await fixture<MtInputSelect>(
      html`<mt-input-select
        .hass=${hass}
        entity="input_select.mode"
        .order=${['night', 'morning']}
      ></mt-input-select>`
    );
    expect(rowItems(el).map((i) => i.value)).to.deep.equal(['night', 'morning', 'day']);
    expect(chips(el).map((c) => c.title)).to.deep.equal(['Night', 'Morning', 'Day']);
  });
});

describe('mt-switch-group', () => {
  it('renders nothing when entities is empty', async () => {
    const hass = makeHass({});
    const el = await fixture<MtSwitchGroup>(
      html`<mt-switch-group .hass=${hass} .entities=${[]}></mt-switch-group>`
    );
    expect(selectorRow(el)).to.equal(null);
  });

  it('renders nothing when entities is undefined (?? [] fallback)', async () => {
    const hass = makeHass({});
    const el = await fixture<MtSwitchGroup>(
      html`<mt-switch-group .hass=${hass} .entities=${undefined}></mt-switch-group>`
    );
    expect(selectorRow(el)).to.equal(null);
  });

  it('filters out entries without an entity', async () => {
    const hass = makeHass({
      'switch.a': entityState('switch.a', 'on'),
      'switch.b': entityState('switch.b', 'off'),
    });
    const el = await fixture<MtSwitchGroup>(
      html`<mt-switch-group
        .hass=${hass}
        .entities=${[{ entity: 'switch.a' }, { entity: '' }, { entity: 'switch.b' }]}
      ></mt-switch-group>`
    );
    const items = rowItems(el);
    expect(items.map((i) => i.value)).to.deep.equal(['switch.a', 'switch.b']);
  });

  it('marks active when on, disabled when missing or unavailable', async () => {
    const hass = makeHass({
      'switch.on': entityState('switch.on', 'on'),
      'switch.off': entityState('switch.off', 'off'),
      'switch.un': entityState('switch.un', 'unavailable'),
      // switch.gone has no state
    });
    const el = await fixture<MtSwitchGroup>(
      html`<mt-switch-group
        .hass=${hass}
        .entities=${[
          { entity: 'switch.on' },
          { entity: 'switch.off' },
          { entity: 'switch.un' },
          { entity: 'switch.gone' },
        ]}
      ></mt-switch-group>`
    );
    const items = rowItems(el);
    const byId = (id: string) => items.find((i) => i.value === id)!;
    expect(byId('switch.on').active).to.be.true;
    expect(byId('switch.off').active).to.be.false;
    expect(byId('switch.on').disabled).to.be.false;
    expect(byId('switch.off').disabled).to.be.false;
    expect(byId('switch.un').disabled).to.be.true;
    expect(byId('switch.gone').disabled).to.be.true;
    expect(byId('switch.gone').active).to.be.false; // state?.state === 'on' is false
  });

  it('uses label/icon fallbacks (config -> friendly_name -> id; config -> attributes.icon)', async () => {
    const hass = makeHass({
      'switch.named': entityState('switch.named', 'off', {
        friendly_name: 'Pretty Name',
        icon: 'mdi:attr-icon',
      }),
      'switch.nofriendly': entityState('switch.nofriendly', 'off', {}),
    });
    const el = await fixture<MtSwitchGroup>(
      html`<mt-switch-group
        .hass=${hass}
        .entities=${[
          { entity: 'switch.named', label: 'Config Label', icon: 'mdi:config-icon' },
          { entity: 'switch.named' },
          { entity: 'switch.nofriendly' },
        ]}
      ></mt-switch-group>`
    );
    const items = rowItems(el);
    // [0] config label + config icon win
    expect(items[0].label).to.equal('Config Label');
    expect(items[0].icon).to.equal('mdi:config-icon');
    // [1] no config -> friendly_name + attributes.icon
    expect(items[1].label).to.equal('Pretty Name');
    expect(items[1].icon).to.equal('mdi:attr-icon');
    // [2] no friendly_name -> entity id; no icon -> undefined
    expect(items[2].label).to.equal('switch.nofriendly');
    expect(items[2].icon).to.equal(undefined);
  });

  it('falls back to entity id label when there is no state at all', async () => {
    const hass = makeHass({});
    const el = await fixture<MtSwitchGroup>(
      html`<mt-switch-group
        .hass=${hass}
        .entities=${[{ entity: 'switch.ghost' }]}
      ></mt-switch-group>`
    );
    const items = rowItems(el);
    expect(items[0].label).to.equal('switch.ghost');
    expect(items[0].icon).to.equal(undefined);
    expect(items[0].disabled).to.be.true;
  });

  it('_onSelect turns OFF other on-switches first, THEN turns on selected (order matters)', async () => {
    const hass = makeHass({
      'switch.a': entityState('switch.a', 'on'),
      'switch.b': entityState('switch.b', 'on'),
      'switch.c': entityState('switch.c', 'off'),
    });
    const el = await fixture<MtSwitchGroup>(
      html`<mt-switch-group
        .hass=${hass}
        .entities=${[{ entity: 'switch.a' }, { entity: 'switch.b' }, { entity: 'switch.c' }]}
      ></mt-switch-group>`
    );
    selectValue(el, 'switch.c');
    // Both calls are async; wait a tick for the awaited promises.
    await new Promise((r) => setTimeout(r, 0));
    expect(hass.__calls).to.have.lengthOf(2);
    // turn_off others (a, b) — c excluded (it's the selected) and only on-switches
    expect(hass.__calls[0]).to.deep.include({ domain: 'homeassistant', service: 'turn_off' });
    expect(hass.__calls[0].data).to.deep.equal({ entity_id: ['switch.a', 'switch.b'] });
    // then turn_on selected
    expect(hass.__calls[1]).to.deep.include({ domain: 'homeassistant', service: 'turn_on' });
    expect(hass.__calls[1].data).to.deep.equal({ entity_id: 'switch.c' });
  });

  it('_onSelect only turns on when no other switch is on', async () => {
    const hass = makeHass({
      'switch.a': entityState('switch.a', 'off'),
      'switch.b': entityState('switch.b', 'off'),
    });
    const el = await fixture<MtSwitchGroup>(
      html`<mt-switch-group
        .hass=${hass}
        .entities=${[{ entity: 'switch.a' }, { entity: 'switch.b' }]}
      ></mt-switch-group>`
    );
    selectValue(el, 'switch.a');
    await new Promise((r) => setTimeout(r, 0));
    expect(hass.__calls).to.have.lengthOf(1);
    expect(hass.__calls[0]).to.deep.include({ domain: 'homeassistant', service: 'turn_on' });
    expect(hass.__calls[0].data).to.deep.equal({ entity_id: 'switch.a' });
  });

  it('_onSelect excludes the selected switch from the others list even if it is on', async () => {
    // Selecting an already-on switch: it must not appear in turn_off list.
    const hass = makeHass({
      'switch.a': entityState('switch.a', 'on'),
      'switch.b': entityState('switch.b', 'off'),
    });
    const el = await fixture<MtSwitchGroup>(
      html`<mt-switch-group
        .hass=${hass}
        .entities=${[{ entity: 'switch.a' }, { entity: 'switch.b' }]}
      ></mt-switch-group>`
    );
    selectValue(el, 'switch.a');
    await new Promise((r) => setTimeout(r, 0));
    // No others on -> only turn_on
    expect(hass.__calls).to.have.lengthOf(1);
    expect(hass.__calls[0].data).to.deep.equal({ entity_id: 'switch.a' });
  });

  // Defensive-branch test (not a realistic state): render() returns nothing when
  // entities is empty, so the @item-selected listener can't normally fire with
  // entities undefined — this exists only to pin the `?? []` guard in _onSelect.
  it('_onSelect tolerates undefined entities (?? [] fallback) -> only turns on selected', async () => {
    const hass = makeHass({ 'switch.a': entityState('switch.a', 'on') });
    const el = await fixture<MtSwitchGroup>(
      html`<mt-switch-group
        .hass=${hass}
        .entities=${[{ entity: 'switch.a' }]}
      ></mt-switch-group>`
    );
    const row = selectorRow(el)!;
    // Clear entities at select time; the listener is still bound on the row.
    el.entities = undefined as unknown as [];
    row.dispatchEvent(
      new CustomEvent('item-selected', {
        detail: { value: 'switch.a' },
        bubbles: true,
        composed: true,
      })
    );
    await new Promise((r) => setTimeout(r, 0));
    // others list is empty -> only the turn_on call
    expect(hass.__calls).to.have.lengthOf(1);
    expect(hass.__calls[0]).to.deep.include({ domain: 'homeassistant', service: 'turn_on' });
    expect(hass.__calls[0].data).to.deep.equal({ entity_id: 'switch.a' });
  });

  it('forwards display and label to the selector-row', async () => {
    const hass = makeHass({ 'switch.a': entityState('switch.a', 'on') });
    const el = await fixture<MtSwitchGroup>(
      html`<mt-switch-group
        .hass=${hass}
        .entities=${[{ entity: 'switch.a' }]}
        display="dropdown"
        label="Zone"
      ></mt-switch-group>`
    );
    expect(selectorRow(el)!.getAttribute('display')).to.equal('dropdown');
    expect(selectorRow(el)!.label).to.equal('Zone');
  });
});

describe('mt-switch-list', () => {
  it('renders nothing when entities is empty', async () => {
    const hass = makeHass({});
    const el = await fixture<MtSwitchList>(
      html`<mt-switch-list .hass=${hass} .entities=${[]}></mt-switch-list>`
    );
    expect(selectorRow(el)).to.equal(null);
  });

  it('renders nothing when entities is undefined (?? [] fallback)', async () => {
    const hass = makeHass({});
    const el = await fixture<MtSwitchList>(
      html`<mt-switch-list .hass=${hass} .entities=${undefined}></mt-switch-list>`
    );
    expect(selectorRow(el)).to.equal(null);
  });

  it('filters out entries without an entity', async () => {
    const hass = makeHass({
      'switch.a': entityState('switch.a', 'on'),
      'switch.b': entityState('switch.b', 'off'),
    });
    const el = await fixture<MtSwitchList>(
      html`<mt-switch-list
        .hass=${hass}
        .entities=${[{ entity: 'switch.a' }, { entity: '' }, { entity: 'switch.b' }]}
      ></mt-switch-list>`
    );
    expect(rowItems(el).map((i) => i.value)).to.deep.equal(['switch.a', 'switch.b']);
  });

  it('marks active when on and disabled when missing/unavailable', async () => {
    const hass = makeHass({
      'switch.on': entityState('switch.on', 'on'),
      'switch.off': entityState('switch.off', 'off'),
      'switch.un': entityState('switch.un', 'unavailable'),
    });
    const el = await fixture<MtSwitchList>(
      html`<mt-switch-list
        .hass=${hass}
        .entities=${[
          { entity: 'switch.on' },
          { entity: 'switch.off' },
          { entity: 'switch.un' },
          { entity: 'switch.gone' },
        ]}
      ></mt-switch-list>`
    );
    const items = rowItems(el);
    const byId = (id: string) => items.find((i) => i.value === id)!;
    expect(byId('switch.on').active).to.be.true;
    expect(byId('switch.off').active).to.be.false;
    expect(byId('switch.gone').active).to.be.false;
    expect(byId('switch.off').disabled).to.be.false;
    expect(byId('switch.un').disabled).to.be.true;
    expect(byId('switch.gone').disabled).to.be.true;
  });

  it('uses default icon and label/icon fallbacks', async () => {
    const hass = makeHass({
      'switch.named': entityState('switch.named', 'on', {
        friendly_name: 'Friendly',
        icon: 'mdi:attr-icon',
      }),
      'switch.bare': entityState('switch.bare', 'off', {}),
    });
    const el = await fixture<MtSwitchList>(
      html`<mt-switch-list
        .hass=${hass}
        .entities=${[
          { entity: 'switch.named', label: 'Cfg', icon: 'mdi:cfg' },
          { entity: 'switch.named' },
          { entity: 'switch.bare' },
        ]}
      ></mt-switch-list>`
    );
    const items = rowItems(el);
    // config wins
    expect(items[0].label).to.equal('Cfg');
    expect(items[0].icon).to.equal('mdi:cfg');
    // friendly_name + attributes.icon
    expect(items[1].label).to.equal('Friendly');
    expect(items[1].icon).to.equal('mdi:attr-icon');
    // id label + default icon
    expect(items[2].label).to.equal('switch.bare');
    expect(items[2].icon).to.equal('mdi:toggle-switch-variant');
  });

  it('default icon when there is no state', async () => {
    const hass = makeHass({});
    const el = await fixture<MtSwitchList>(
      html`<mt-switch-list
        .hass=${hass}
        .entities=${[{ entity: 'switch.ghost' }]}
      ></mt-switch-list>`
    );
    expect(rowItems(el)[0].icon).to.equal('mdi:toggle-switch-variant');
  });

  it('_onSelect toggles the clicked switch independently', async () => {
    const hass = makeHass({
      'switch.a': entityState('switch.a', 'on'),
      'switch.b': entityState('switch.b', 'off'),
    });
    const el = await fixture<MtSwitchList>(
      html`<mt-switch-list
        .hass=${hass}
        .entities=${[{ entity: 'switch.a' }, { entity: 'switch.b' }]}
      ></mt-switch-list>`
    );
    selectValue(el, 'switch.b');
    expect(hass.__calls).to.have.lengthOf(1);
    expect(hass.__calls[0]).to.deep.include({ domain: 'homeassistant', service: 'toggle' });
    expect(hass.__calls[0].data).to.deep.equal({ entity_id: 'switch.b' });
  });

  it('forwards label and always renders display="icons"', async () => {
    const hass = makeHass({ 'switch.a': entityState('switch.a', 'on') });
    const el = await fixture<MtSwitchList>(
      html`<mt-switch-list
        .hass=${hass}
        .entities=${[{ entity: 'switch.a' }]}
        label="Lights"
      ></mt-switch-list>`
    );
    expect(selectorRow(el)!.label).to.equal('Lights');
    expect(selectorRow(el)!.getAttribute('display')).to.equal('icons');
  });
});

describe('mt-button-list', () => {
  it('renders nothing when items is empty', async () => {
    const hass = makeHass({});
    const el = await fixture<MtButtonList>(
      html`<mt-button-list .hass=${hass} .items=${[]}></mt-button-list>`
    );
    expect(selectorRow(el)).to.equal(null);
  });

  it('renders nothing when items is undefined (?? [] fallback)', async () => {
    const hass = makeHass({});
    const el = await fixture<MtButtonList>(
      html`<mt-button-list .hass=${hass} .items=${undefined}></mt-button-list>`
    );
    expect(selectorRow(el)).to.equal(null);
  });

  it('filters out entries without an entity', async () => {
    const hass = makeHass({
      'button.a': entityState('button.a', 'unknown'),
      'scene.b': entityState('scene.b', 'unknown'),
    });
    const el = await fixture<MtButtonList>(
      html`<mt-button-list
        .hass=${hass}
        .items=${[{ entity: 'button.a' }, { entity: '' }, { entity: 'scene.b' }]}
      ></mt-button-list>`
    );
    expect(rowItems(el).map((i) => i.value)).to.deep.equal(['button.a', 'scene.b']);
  });

  it('builds items that are always active:false with default icon and disabled handling', async () => {
    const hass = makeHass({
      'button.a': entityState('button.a', 'unknown'),
      'button.un': entityState('button.un', 'unavailable'),
      // button.gone has no state
    });
    const el = await fixture<MtButtonList>(
      html`<mt-button-list
        .hass=${hass}
        .items=${[{ entity: 'button.a' }, { entity: 'button.un' }, { entity: 'button.gone' }]}
      ></mt-button-list>`
    );
    const items = rowItems(el);
    expect(items.every((i) => i.active === false)).to.be.true;
    // default icon
    expect(items.find((i) => i.value === 'button.a')!.icon).to.equal('mdi:gesture-tap-button');
    // disabled rules
    expect(items.find((i) => i.value === 'button.a')!.disabled).to.be.false;
    expect(items.find((i) => i.value === 'button.un')!.disabled).to.be.true;
    expect(items.find((i) => i.value === 'button.gone')!.disabled).to.be.true;
  });

  it('uses label/icon fallbacks (config -> friendly_name -> id; config -> attributes.icon -> default)', async () => {
    const hass = makeHass({
      'button.named': entityState('button.named', 'unknown', {
        friendly_name: 'Doorbell',
        icon: 'mdi:bell',
      }),
      'button.bare': entityState('button.bare', 'unknown', {}),
    });
    const el = await fixture<MtButtonList>(
      html`<mt-button-list
        .hass=${hass}
        .items=${[
          { entity: 'button.named', label: 'Cfg', icon: 'mdi:cfg' },
          { entity: 'button.named' },
          { entity: 'button.bare' },
        ]}
      ></mt-button-list>`
    );
    const items = rowItems(el);
    expect(items[0].label).to.equal('Cfg');
    expect(items[0].icon).to.equal('mdi:cfg');
    expect(items[1].label).to.equal('Doorbell');
    expect(items[1].icon).to.equal('mdi:bell');
    expect(items[2].label).to.equal('button.bare');
    expect(items[2].icon).to.equal('mdi:gesture-tap-button');
  });

  it('_onSelect presses a button.* entity (button.press)', async () => {
    const hass = makeHass({ 'button.a': entityState('button.a', 'unknown') });
    const el = await fixture<MtButtonList>(
      html`<mt-button-list .hass=${hass} .items=${[{ entity: 'button.a' }]}></mt-button-list>`
    );
    selectValue(el, 'button.a');
    expect(hass.__calls).to.have.lengthOf(1);
    expect(hass.__calls[0]).to.deep.include({ domain: 'button', service: 'press' });
    expect(hass.__calls[0].data).to.deep.equal({ entity_id: 'button.a' });
  });

  it('_onSelect turns on a scene.* entity (scene.turn_on)', async () => {
    const hass = makeHass({ 'scene.b': entityState('scene.b', 'unknown') });
    const el = await fixture<MtButtonList>(
      html`<mt-button-list .hass=${hass} .items=${[{ entity: 'scene.b' }]}></mt-button-list>`
    );
    selectValue(el, 'scene.b');
    expect(hass.__calls).to.have.lengthOf(1);
    expect(hass.__calls[0]).to.deep.include({ domain: 'scene', service: 'turn_on' });
    expect(hass.__calls[0].data).to.deep.equal({ entity_id: 'scene.b' });
  });

  it('_onSelect fires hass-more-info for an unknown domain (pressOrToggle default)', async () => {
    const hass = makeHass({
      'sensor.x': entityState('sensor.x', '42'),
    });
    const el = await fixture<MtButtonList>(
      html`<mt-button-list .hass=${hass} .items=${[{ entity: 'sensor.x' }]}></mt-button-list>`
    );
    const moreInfo = oncePromise(document, 'hass-more-info');
    selectValue(el, 'sensor.x');
    const ev = await moreInfo;
    expect(ev.detail).to.deep.equal({ entityId: 'sensor.x' });
    // no service call for the default branch
    expect(hass.__calls).to.have.lengthOf(0);
  });

  it('forwards label and always renders display="icons"', async () => {
    const hass = makeHass({ 'button.a': entityState('button.a', 'unknown') });
    const el = await fixture<MtButtonList>(
      html`<mt-button-list
        .hass=${hass}
        .items=${[{ entity: 'button.a' }]}
        label="Actions"
      ></mt-button-list>`
    );
    expect(selectorRow(el)!.label).to.equal('Actions');
    expect(selectorRow(el)!.getAttribute('display')).to.equal('icons');
  });
});
