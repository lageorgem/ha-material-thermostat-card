import { fixture, html, expect } from '@open-wc/testing';
import { makeHass, entityState } from '../helpers';
import '../../src/features/sensor-list';
import type { MtSensorList } from '../../src/features/sensor-list';
import type { EntityItem } from '../../src/types';

/**
 * Mount mt-sensor-list with the given items and entity states.
 * @param items the configured rows
 * @param states the hass states map
 * @param label optional list label
 */
async function mount(
  items: EntityItem[],
  states: Record<string, any> = {},
  label?: string
): Promise<MtSensorList> {
  const el = await fixture<MtSensorList>(
    html`<mt-sensor-list .hass=${makeHass(states)} .items=${items} .label=${label}></mt-sensor-list>`
  );
  await el.updateComplete;
  return el;
}

/** The rendered row elements. */
function rows(el: MtSensorList): HTMLElement[] {
  return Array.from(el.shadowRoot!.querySelectorAll('.row'));
}

describe('mt-sensor-list', () => {
  it('renders nothing when there are no (non-empty) items', async () => {
    const empty = await mount([]);
    expect(empty.shadowRoot!.querySelector('.card')).to.equal(null);
    const blank = await mount([{ entity: '' }]);
    expect(blank.shadowRoot!.querySelector('.card')).to.equal(null);
    // a missing items list (undefined) is treated as empty (the `?? []` guard)
    const missing = await mount(undefined as unknown as EntityItem[]);
    expect(missing.shadowRoot!.querySelector('.card')).to.equal(null);
  });

  it('renders all sensors inside a SINGLE container (not a tile each)', async () => {
    const states = {
      'sensor.a': entityState('sensor.a', '1'),
      'sensor.b': entityState('sensor.b', '2'),
    };
    const el = await mount([{ entity: 'sensor.a' }, { entity: 'sensor.b' }], states);
    expect(el.shadowRoot!.querySelectorAll('.card').length).to.equal(1);
    expect(rows(el).length).to.equal(2);
  });

  it('shows the title (custom label → friendly_name → entity id) and the value with unit', async () => {
    const states = {
      'sensor.temp': entityState('sensor.temp', '21.4', {
        friendly_name: 'Indoor Temperature',
        unit_of_measurement: '°C',
      }),
      'sensor.named': entityState('sensor.named', '17.8', {
        friendly_name: 'Vaughan Temperature',
        unit_of_measurement: '°C',
      }),
      'sensor.hum': entityState('sensor.hum', '52', { unit_of_measurement: '%' }),
      'sensor.bare': entityState('sensor.bare', 'open'),
    };
    const el = await mount(
      [
        { entity: 'sensor.temp', label: 'Living Room' }, // custom label wins
        { entity: 'sensor.named' }, // no label → friendly_name
        { entity: 'sensor.hum' }, // no label/friendly_name → entity id
        { entity: 'sensor.bare' }, // no unit → bare state
      ],
      states
    );
    const r = rows(el);
    expect(r.length).to.equal(4);
    expect(r[0].querySelector('.title')!.textContent!.trim()).to.equal('Living Room');
    expect(r[0].querySelector('.val')!.textContent!.trim()).to.equal('21.4 °C');
    expect(r[1].querySelector('.title')!.textContent!.trim()).to.equal('Vaughan Temperature');
    expect(r[2].querySelector('.title')!.textContent!.trim()).to.equal('sensor.hum');
    expect(r[2].querySelector('.val')!.textContent!.trim()).to.equal('52 %');
    expect(r[3].querySelector('.val')!.textContent!.trim()).to.equal('open');
  });

  it('shows an icon only when one is configured (opt-in, inline — no default fallback)', async () => {
    const states = {
      'sensor.a': entityState('sensor.a', '1', { icon: 'mdi:thermometer' }),
      'sensor.b': entityState('sensor.b', '2'),
    };
    const el = await mount(
      [
        { entity: 'sensor.a', icon: 'mdi:leaf' }, // configured icon renders inline
        { entity: 'sensor.a' }, // entity has its own icon, but icons are opt-in → none
        { entity: 'sensor.b' }, // no icon configured → none
      ],
      states
    );
    const r = rows(el);
    expect(r[0].querySelector('ha-icon.icon')!.getAttribute('icon')).to.equal('mdi:leaf');
    expect(r[1].querySelector('ha-icon')).to.equal(null);
    expect(r[2].querySelector('ha-icon')).to.equal(null);
  });

  it('shows an em-dash for missing / unknown / unavailable entities', async () => {
    const states = {
      'sensor.unknown': entityState('sensor.unknown', 'unknown'),
      'sensor.unavail': entityState('sensor.unavail', 'unavailable'),
    };
    const el = await mount(
      [{ entity: 'sensor.missing' }, { entity: 'sensor.unknown' }, { entity: 'sensor.unavail' }],
      states
    );
    const r = rows(el);
    expect(r[0].querySelector('.val')!.textContent!.trim()).to.equal('—');
    expect(r[1].querySelector('.val')!.textContent!.trim()).to.equal('—');
    expect(r[2].querySelector('.val')!.textContent!.trim()).to.equal('—');
  });

  it('renders the optional label header only when set', async () => {
    const states = { 'sensor.a': entityState('sensor.a', '1') };
    const withLabel = await mount([{ entity: 'sensor.a' }], states, 'Sensors');
    expect(withLabel.shadowRoot!.querySelector('.label')!.textContent!.trim()).to.equal('Sensors');
    const without = await mount([{ entity: 'sensor.a' }], states);
    expect(without.shadowRoot!.querySelector('.label')).to.equal(null);
  });
});
