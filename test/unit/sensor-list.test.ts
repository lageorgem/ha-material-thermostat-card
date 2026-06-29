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
    expect(empty.shadowRoot!.querySelector('.list')).to.equal(null);
    const blank = await mount([{ entity: '' }]);
    expect(blank.shadowRoot!.querySelector('.list')).to.equal(null);
    // a missing items list (undefined) is treated as empty (the `?? []` guard)
    const missing = await mount(undefined as unknown as EntityItem[]);
    expect(missing.shadowRoot!.querySelector('.list')).to.equal(null);
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

  it('uses the configured icon, else the entity icon, else a gauge fallback', async () => {
    const states = {
      'sensor.a': entityState('sensor.a', '1', { icon: 'mdi:thermometer' }),
      'sensor.b': entityState('sensor.b', '2'),
    };
    const el = await mount(
      [
        { entity: 'sensor.a', icon: 'mdi:leaf' }, // configured icon wins
        { entity: 'sensor.b' }, // no config/state icon → fallback
      ],
      states
    );
    const r = rows(el);
    expect(r[0].querySelector('ha-icon')!.getAttribute('icon')).to.equal('mdi:leaf');
    // state icon used when no override
    const stateIcon = await mount([{ entity: 'sensor.a' }], states);
    expect(rows(stateIcon)[0].querySelector('ha-icon')!.getAttribute('icon')).to.equal(
      'mdi:thermometer'
    );
    expect(r[1].querySelector('ha-icon')!.getAttribute('icon')).to.equal('mdi:gauge');
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
