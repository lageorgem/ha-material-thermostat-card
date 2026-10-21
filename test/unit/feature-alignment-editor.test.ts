import { fixture, html, expect } from '@open-wc/testing';
import type { LitElement } from 'lit';
import { makeHass, climateState, waterHeaterState } from '../helpers';
import type { TestHass } from '../helpers';
import type { FeatureAlignment, FeatureConfig, MaterialThermostatCardConfig } from '../../src/types';
import type { MaterialThermostatCardEditor } from '../../src/editor';
import type { MtWidthField } from '../../src/editors/width-field';
import type { MtAlignmentToggle } from '../../src/editors/alignment-toggle';
import '../../src/editor';

const options = [{ value: 'eco', label: 'Custom eco', icon: 'mdi:leaf', hide: true }];
const items = [{ entity: 'switch.test', label: 'Custom switch', icon: 'mdi:power' }];
const features: FeatureConfig[] = [
  { type: 'climate-hvac-modes', options, order: ['eco'], include: ['eco'] },
  { type: 'climate-fan-modes', options, order: ['eco'], include: ['eco'] },
  { type: 'climate-swing-modes', options, order: ['eco'], include: ['eco'] },
  { type: 'climate-swing-horizontal-modes', options, order: ['eco'], include: ['eco'] },
  { type: 'climate-preset-modes', options, order: ['eco'], include: ['eco'] },
  { type: 'water-heater-operation-modes', options, order: ['eco'], include: ['eco'] },
  { type: 'water-heater-away-mode', label: 'Holiday', display: 'tile' },
  { type: 'input-select', entity: 'input_select.test', options, order: ['eco'], display: 'tile' },
  { type: 'switch-group', entities: items, display: 'dropdown', label: 'Group' },
  { type: 'switch-list', entities: items, label: 'Switches' },
  { type: 'button-list', items: [{ entity: 'button.test', label: 'Press' }] },
  { type: 'sensor-list', items: [{ entity: 'sensor.test', label: 'Reading' }] },
  { type: 'entity-tile', entity: 'switch.test', name: 'Tile', tap_action: { action: 'more-info' } },
  { type: 'comfort', show_target_eta: true },
];

/** Open the actual parent editor through its public configuration and edit button. */
async function mount(feature: FeatureConfig): Promise<MaterialThermostatCardEditor> {
  const el = await fixture<MaterialThermostatCardEditor>(
    html`<material-thermostat-card-editor></material-thermostat-card-editor>`
  );
  el.hass = makeHass({
    'climate.test': climateState(),
    'water_heater.test': waterHeaterState(),
  });
  el.setConfig({
    type: 'custom:material-thermostat-card',
    entity: feature.type.startsWith('water-heater-') ? 'water_heater.test' : 'climate.test',
    name: 'Preserved card name',
    features: [{ type: 'entity-tile', entity: 'sensor.sibling', alignment: 'right' }, feature],
  });
  await el.updateComplete;
  el.shadowRoot!.querySelectorAll<HTMLButtonElement>('[aria-label="Edit feature"]')[1].click();
  await el.updateComplete;
  return el;
}

/** Resolve the nested control after parent and sub-editor renders have settled. */
async function widthField(el: MaterialThermostatCardEditor): Promise<MtWidthField> {
  await el.updateComplete;
  const panel = el.shadowRoot!.querySelector('.feature-editor')!;
  const child = panel.querySelector<LitElement>(
    'mt-climate-feature-editor, mt-input-select-editor, mt-entity-list-editor, mt-entity-tile-editor, mt-comfort-editor'
  );
  if (child) await child.updateComplete;
  const field = (child?.shadowRoot ?? panel).querySelector<MtWidthField>('mt-width-field')!;
  await field.updateComplete;
  return field;
}

/** Use native alignment buttons, rather than synthesizing the editor's output event. */
async function alignmentButton(field: MtWidthField, value: FeatureAlignment): Promise<HTMLButtonElement> {
  const toggle = field.shadowRoot!.querySelector<MtAlignmentToggle>('mt-alignment-toggle')!;
  await toggle.updateComplete;
  const label = value === 'center' ? 'centre' : value;
  return toggle.shadowRoot!.querySelector<HTMLButtonElement>(`[aria-label="Align ${label}"]`)!;
}

describe('feature alignment editor persistence', () => {
  for (const feature of features) {
    for (const savedAlignment of ['center', 'right'] as const) {
      it(`${feature.type}: loads ${savedAlignment}, saves alignment/width independently, and clears left`, async () => {
        const original: FeatureConfig = { ...feature, width: 40, alignment: savedAlignment };
        const snapshot = JSON.stringify(original);
        const el = await mount(original);
        const events: CustomEvent<{ config: MaterialThermostatCardConfig }>[] = [];
        el.addEventListener('config-changed', (event) => {
          events.push(event as CustomEvent<{ config: MaterialThermostatCardConfig }>);
        });
        let field = await widthField(el);
        expect(field.alignment).to.equal(savedAlignment);
        expect((await alignmentButton(field, savedAlignment)).getAttribute('aria-pressed')).to.equal('true');
        let expected = original;

        // Every save is serialized and reloaded through setConfig, as Lovelace does.
        async function save(action: () => void, patch: Partial<FeatureConfig>): Promise<void> {
          const before = events.length;
          action();
          expect(events.length).to.equal(before + 1);
          expected = { ...expected, ...patch } as FeatureConfig;
          const config = events[before].detail.config;
          expect(config.features![1]).to.deep.equal(expected);
          expect(config.features![0]).to.deep.equal({
            type: 'entity-tile', entity: 'sensor.sibling', alignment: 'right',
          });
          expect(config.name).to.equal('Preserved card name');
          expect(JSON.stringify(original)).to.equal(snapshot);
          el.setConfig(JSON.parse(JSON.stringify(config)) as MaterialThermostatCardConfig);
          field = await widthField(el);
          expect(field.value).to.equal(expected.width);
          expect(field.alignment).to.equal(expected.alignment);
          const selected = expected.alignment ?? 'left';
          expect((await alignmentButton(field, selected)).getAttribute('aria-pressed')).to.equal('true');
          expected = JSON.parse(JSON.stringify(expected)) as FeatureConfig;
        }

        const next = savedAlignment === 'center' ? 'right' : 'center';
        const button = await alignmentButton(field, next);
        await save(() => button.click(), { alignment: next });
        await save(() => {
          field.shadowRoot!.querySelector('mt-grid-slider')!.dispatchEvent(new CustomEvent('value-changed', {
            detail: { value: 60 }, bubbles: true, composed: true,
          }));
        }, { width: 60 });
        await save(() => field.shadowRoot!.querySelector<HTMLButtonElement>('.reset')!.click(), { width: undefined });
        expect(field.default).to.equal(feature.type === 'entity-tile' ? 50 : 100);
        expect(field.shadowRoot!.querySelector('mt-grid-slider')!.value).to.equal(field.default);
        const left = await alignmentButton(field, 'left');
        await save(() => left.click(), { alignment: undefined });
        const serialized = JSON.parse(JSON.stringify(events[events.length - 1].detail.config)) as MaterialThermostatCardConfig;
        expect(serialized.features![1]).to.not.have.property('alignment');
        expect(serialized.features![1]).to.not.have.property('width');
        expect((el.hass as TestHass).__calls).to.deep.equal([]);
      });
    }
  }
});
