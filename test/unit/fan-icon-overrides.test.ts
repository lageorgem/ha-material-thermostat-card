import { fixture, fixtureCleanup, html, expect } from '@open-wc/testing';
import '../../src/material-thermostat-card';
import '../../src/editor';
import type { MaterialThermostatCard } from '../../src/material-thermostat-card';
import type { MaterialThermostatCardEditor } from '../../src/editor';
import type { MtSelectorRow } from '../../src/features/selector-row';
import type { MtDropdown } from '../../src/features/dropdown';
import type {
  ClimateFanFeatureConfig,
  MaterialThermostatCardConfig,
  OptionOverride,
} from '../../src/types';
import { climateState, makeHass, oncePromise } from '../helpers';
import type { TestHass } from '../helpers';

type Display = 'icons' | 'dropdown' | 'tile';

/** Fresh reporter-style stock syntax; the card must normalize fan_modes itself. */
function config(display: Display, options?: OptionOverride[], raw = 'quiet'): MaterialThermostatCardConfig {
  const feature: ClimateFanFeatureConfig & { fan_modes: string[] } = {
    type: 'climate-fan-modes',
    display,
    fan_modes: ['auto', 'low', 'medium', 'high', raw],
    options,
  };
  return {
    type: 'custom:material-thermostat-card',
    entity: 'climate.test',
    font: 'theme',
    features: [feature],
  };
}

/** No HA backend: every service invocation is recorded in a fixture-local hass. */
function fanHass(raw = 'quiet'): TestHass {
  return makeHass({
    'climate.test': climateState({
      // An entity-only value proves the stock allow-list was applied.
      fan_modes: ['auto', 'low', 'medium', 'high', raw, 'turbo'],
      fan_mode: raw,
    }),
  });
}

async function mount(saved: MaterialThermostatCardConfig, hass = fanHass()) {
  const card = await fixture<MaterialThermostatCard>(
    html`<material-thermostat-card></material-thermostat-card>`
  );
  card.setConfig(saved);
  card.hass = hass;
  return { card, hass, row: await renderedRow(card) };
}

/** Await each actual Lit boundary, as in the existing card parity tests. */
async function renderedRow(card: MaterialThermostatCard): Promise<MtSelectorRow> {
  await card.updateComplete;
  const feature = card.shadowRoot!.querySelector('mt-feature-row')!;
  expect(feature, 'card feature row').not.to.equal(null);
  await feature.updateComplete;
  const selector = feature.shadowRoot!.querySelector('mt-climate-selector')!;
  expect(selector, 'fan selector').not.to.equal(null);
  await selector.updateComplete;
  const row = selector.shadowRoot!.querySelector('mt-selector-row')!;
  expect(row, 'rendered selector row').not.to.equal(null);
  await row.updateComplete;
  return row;
}

/** Ignore dropdown chrome (chevron/check), not the selected option's icon. */
function expectModeIcon(control: Element, icon: string | undefined): void {
  const icons = Array.from(control.querySelectorAll('ha-icon:not(.chev):not(.check)'));
  expect(icons.map(node => node.getAttribute('icon'))).to.deep.equal(icon ? [icon] : []);
  if (icon === '') expect(control.querySelector('.dot, .chip-text')).not.to.equal(null);
}

/** Inspect both the active trigger and the real open option menu. */
async function quietControl(row: MtSelectorRow, display: Display, icon: string, label = 'Quiet') {
  if (display === 'icons') {
    const button = Array.from(row.shadowRoot!.querySelectorAll<HTMLButtonElement>('.chip'))
      .find(node => node.getAttribute('aria-label') === label)!;
    expect(button, 'quiet chip').not.to.equal(undefined);
    expect(button.getAttribute('aria-pressed')).to.equal('true');
    expectModeIcon(button, icon);
    if (!icon) expect(button.querySelector('.chip-text')!.textContent).to.equal(label);
    return button;
  }
  const dropdown = row.shadowRoot!.querySelector<MtDropdown>('mt-dropdown')!;
  await dropdown.updateComplete;
  const trigger = dropdown.shadowRoot!.querySelector<HTMLButtonElement>('[aria-haspopup="listbox"]')!;
  expectModeIcon(trigger, icon);
  expect(trigger.querySelector(display === 'tile' ? '.value' : '.label')!.textContent).to.equal(label);
  trigger.click();
  await dropdown.updateComplete;
  expect(trigger.getAttribute('aria-expanded')).to.equal('true');
  const option = Array.from(dropdown.shadowRoot!.querySelectorAll<HTMLButtonElement>('[role="option"]'))
    .find(node => node.querySelector('.label')!.textContent === label)!;
  expect(option, 'quiet menu option').not.to.equal(undefined);
  expect(option.getAttribute('aria-selected')).to.equal('true');
  expectModeIcon(option, icon);
  return option;
}

function expectQuietCall(hass: TestHass, raw = 'quiet'): void {
  expect(hass.__calls).to.have.length(1);
  expect(hass.__calls[0]).to.deep.include({ domain: 'climate', service: 'set_fan_mode' });
  expect(hass.__calls[0].data).to.deep.equal({ entity_id: 'climate.test', fan_mode: raw });
}

describe('issue #1: fan icon overrides through the public card configuration', () => {
  afterEach(() => fixtureCleanup());

  for (const display of ['icons', 'dropdown', 'tile'] as const) {
    it(`renders the quiet override and selects its raw value in ${display}`, async () => {
      const saved = config(display, [{ value: 'quiet', label: 'Whisper', icon: 'mdi:leaf' }]);
      const { hass, row } = await mount(saved);
      expect(row.items.map(item => item.value)).to.deep.equal(['auto', 'low', 'medium', 'high', 'quiet']);
      expect(saved.features![0]).to.have.property('fan_modes');
      expect(saved.features![0]).not.to.have.property('include');
      const button = await quietControl(row, display, 'mdi:leaf', 'Whisper');
      button.click();
      expectQuietCall(hass);
    });

    it(`renders the quiet sleep default without an override in ${display}`, async () => {
      const { row } = await mount(config(display));
      await quietControl(row, display, 'mdi:power-sleep');
    });

    it(`preserves explicit no-icon overrides in ${display}, including menu chrome`, async () => {
      const { hass, row } = await mount(config(display, [{ value: 'quiet', icon: '' }]));
      const button = await quietControl(row, display, '');
      button.click();
      expectQuietCall(hass);
    });

    it(`matches the exact Quiet override without lowercasing the ${display} service value`, async () => {
      const { hass, row } = await mount(config(display, [
        { value: 'Quiet', icon: 'mdi:leaf' },
        { value: 'quiet', icon: 'mdi:star' },
      ], 'Quiet'), fanHass('Quiet'));
      const button = await quietControl(row, display, 'mdi:leaf');
      button.click();
      expectQuietCall(hass, 'Quiet');
    });

    it(`saves and resets a per-option icon through the parent editor into ${display}`, async () => {
      const saved = config(display);
      const hass = fanHass();
      const editor = await fixture<MaterialThermostatCardEditor>(
        html`<material-thermostat-card-editor></material-thermostat-card-editor>`
      );
      editor.hass = hass;
      editor.setConfig(saved);
      await editor.updateComplete;
      editor.shadowRoot!.querySelector<HTMLButtonElement>('[aria-label="Edit feature"]')!.click();
      await editor.updateComplete;

      const iconField = async () => {
        const featureEditor = editor.shadowRoot!.querySelector('mt-climate-feature-editor')!;
        expect(featureEditor, 'parent-owned fan editor').not.to.equal(null);
        await featureEditor.updateComplete;
        const name = featureEditor.shadowRoot!.querySelector('.opt-name[title="quiet"]')!;
        expect(name, 'raw quiet editor option').not.to.equal(null);
        const field = name.parentElement!.querySelector('mt-icon-field')!;
        expect(field, 'quiet icon field').not.to.equal(null);
        return field;
      };

      const changeIcon = async (value: string | undefined) => {
        const field = await iconField();
        const changed = oncePromise<{ config: MaterialThermostatCardConfig }>(editor, 'config-changed');
        // HA/custom-field boundary event, not a call to a private editor method.
        field.dispatchEvent(new CustomEvent('value-changed', {
          detail: { value }, bubbles: true, composed: true,
        }));
        const event = await changed;
        await editor.updateComplete;
        // Emulate saving/reloading Lovelace YAML, not shared mutable config state.
        return JSON.parse(JSON.stringify(event.detail.config)) as MaterialThermostatCardConfig;
      };

      const customized = await changeIcon('mdi:leaf');
      expect(customized.features![0]).to.include({ type: 'climate-fan-modes', display });
      expect(customized.features![0]).to.have.property('include').that.deep.equals(['auto', 'low', 'medium', 'high', 'quiet']);
      expect(customized.features![0]).not.to.have.property('fan_modes');
      expect((customized.features![0] as ClimateFanFeatureConfig).options)
        .to.deep.equal([{ value: 'quiet', icon: 'mdi:leaf' }]);
      const { card, row } = await mount(customized, hass);
      (await quietControl(row, display, 'mdi:leaf')).click();
      expectQuietCall(hass);

      const reset = await changeIcon(undefined);
      expect((reset.features![0] as ClimateFanFeatureConfig).options).to.deep.equal([]);
      card.setConfig(reset);
      await quietControl(await renderedRow(card), display, 'mdi:power-sleep');
    });
  }

  it('uses the last duplicate quiet override rather than the first', async () => {
    const { row } = await mount(config('icons', [
      { value: 'quiet', icon: 'mdi:star' },
      { value: 'quiet', icon: 'mdi:leaf' },
    ]));
    await quietControl(row, 'icons', 'mdi:leaf');
  });
});
