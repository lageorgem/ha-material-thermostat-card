import { fixture, html, expect } from '@open-wc/testing';
import { makeHass, entityState, oncePromise } from '../helpers';
import type { TestHass } from '../helpers';
import '../../src/features/entity-tile';
import type { MtEntityTile } from '../../src/features/entity-tile';
import type { EntityTileFeatureConfig } from '../../src/types';

/**
 * Mount an mt-entity-tile with the given hass + config.
 * @param hass the fake hass
 * @param config the tile feature config
 */
async function mount(hass: TestHass, config: EntityTileFeatureConfig): Promise<MtEntityTile> {
  return fixture<MtEntityTile>(
    html`<mt-entity-tile .hass=${hass} .config=${config}></mt-entity-tile>`
  );
}

describe('mt-entity-tile', () => {
  describe('no entity', () => {
    it('renders nothing when config.entity is empty', async () => {
      const hass = makeHass({});
      const el = await mount(hass, { type: 'entity-tile', entity: '' });
      // nothing -> empty shadow root (no button)
      expect(el.shadowRoot!.querySelector('.tile')).to.equal(null);
      expect(el.shadowRoot!.querySelector('button')).to.equal(null);
    });
  });

  describe('_secondary()', () => {
    it('returns undefined (no .sub) when there is no state', async () => {
      const hass = makeHass({});
      const el = await mount(hass, { type: 'entity-tile', entity: 'sensor.missing' });
      expect(el.shadowRoot!.querySelector('.value')).to.equal(null);
    });

    it('sensor with unit_of_measurement -> "value unit"', async () => {
      const hass = makeHass({
        'sensor.temp': entityState('sensor.temp', '21', { unit_of_measurement: '°C' }),
      });
      const el = await mount(hass, { type: 'entity-tile', entity: 'sensor.temp' });
      const sub = el.shadowRoot!.querySelector('.value');
      expect(sub).to.not.equal(null);
      expect(sub!.textContent).to.equal('21 °C');
    });

    it('sensor without unit -> bare state', async () => {
      const hass = makeHass({
        'sensor.mode': entityState('sensor.mode', 'idle'),
      });
      const el = await mount(hass, { type: 'entity-tile', entity: 'sensor.mode' });
      const sub = el.shadowRoot!.querySelector('.value');
      expect(sub).to.not.equal(null);
      expect(sub!.textContent).to.equal('idle');
    });

    const onOffDomains = ['switch', 'light', 'fan', 'input_boolean', 'binary_sensor'];
    onOffDomains.forEach((domain) => {
      it(`${domain} on -> "On"`, async () => {
        const id = `${domain}.x`;
        const hass = makeHass({ [id]: entityState(id, 'on') });
        const el = await mount(hass, { type: 'entity-tile', entity: id });
        const sub = el.shadowRoot!.querySelector('.value');
        expect(sub).to.not.equal(null);
        expect(sub!.textContent).to.equal('On');
      });

      it(`${domain} off -> "Off"`, async () => {
        const id = `${domain}.x`;
        const hass = makeHass({ [id]: entityState(id, 'off') });
        const el = await mount(hass, { type: 'entity-tile', entity: id });
        const sub = el.shadowRoot!.querySelector('.value');
        expect(sub).to.not.equal(null);
        expect(sub!.textContent).to.equal('Off');
      });
    });

    const noSecondaryDomains = ['button', 'input_button', 'scene', 'script'];
    noSecondaryDomains.forEach((domain) => {
      it(`${domain} -> no secondary line`, async () => {
        const id = `${domain}.x`;
        const hass = makeHass({ [id]: entityState(id, 'whatever') });
        const el = await mount(hass, { type: 'entity-tile', entity: id });
        expect(el.shadowRoot!.querySelector('.value')).to.equal(null);
      });
    });

    it('any other domain (climate) -> its state string', async () => {
      const hass = makeHass({
        'climate.ac': entityState('climate.ac', 'cool'),
      });
      const el = await mount(hass, { type: 'entity-tile', entity: 'climate.ac' });
      const sub = el.shadowRoot!.querySelector('.value');
      expect(sub).to.not.equal(null);
      expect(sub!.textContent).to.equal('cool');
    });
  });

  describe('icon resolution', () => {
    it('config.icon wins over everything', async () => {
      const hass = makeHass({
        'sensor.temp': entityState('sensor.temp', '21', { icon: 'mdi:attr' }),
      });
      const el = await mount(hass, {
        type: 'entity-tile',
        entity: 'sensor.temp',
        icon: 'mdi:config',
      });
      const icon = el.shadowRoot!.querySelector('ha-icon');
      expect(icon!.getAttribute('icon')).to.equal('mdi:config');
    });

    it('state.attributes.icon wins when no config.icon', async () => {
      const hass = makeHass({
        'sensor.temp': entityState('sensor.temp', '21', { icon: 'mdi:attr' }),
      });
      const el = await mount(hass, { type: 'entity-tile', entity: 'sensor.temp' });
      const icon = el.shadowRoot!.querySelector('ha-icon');
      expect(icon!.getAttribute('icon')).to.equal('mdi:attr');
    });

    it('DOMAIN_ICONS[domain] when no config/attr icon', async () => {
      const hass = makeHass({
        'sensor.temp': entityState('sensor.temp', '21'),
      });
      const el = await mount(hass, { type: 'entity-tile', entity: 'sensor.temp' });
      const icon = el.shadowRoot!.querySelector('ha-icon');
      // DOMAIN_ICONS.sensor === 'mdi:gauge'
      expect(icon!.getAttribute('icon')).to.equal('mdi:gauge');
    });

    it("falls back to 'mdi:eye' for an unknown domain", async () => {
      const hass = makeHass({
        'weather.home': entityState('weather.home', 'sunny'),
      });
      const el = await mount(hass, { type: 'entity-tile', entity: 'weather.home' });
      const icon = el.shadowRoot!.querySelector('ha-icon');
      expect(icon!.getAttribute('icon')).to.equal('mdi:eye');
    });
  });

  describe('name resolution', () => {
    it('config.name wins', async () => {
      const hass = makeHass({
        'sensor.temp': entityState('sensor.temp', '21', { friendly_name: 'Friendly' }),
      });
      const el = await mount(hass, {
        type: 'entity-tile',
        entity: 'sensor.temp',
        name: 'Custom Name',
      });
      const title = el.shadowRoot!.querySelector('.title');
      expect(title!.textContent).to.equal('Custom Name');
    });

    it('friendly_name when no config.name', async () => {
      const hass = makeHass({
        'sensor.temp': entityState('sensor.temp', '21', { friendly_name: 'Friendly' }),
      });
      const el = await mount(hass, { type: 'entity-tile', entity: 'sensor.temp' });
      const title = el.shadowRoot!.querySelector('.title');
      expect(title!.textContent).to.equal('Friendly');
    });

    it('entity id when no config.name and no friendly_name', async () => {
      const hass = makeHass({
        'sensor.temp': entityState('sensor.temp', '21'),
      });
      const el = await mount(hass, { type: 'entity-tile', entity: 'sensor.temp' });
      const title = el.shadowRoot!.querySelector('.title');
      expect(title!.textContent).to.equal('sensor.temp');
    });

    it('falls back to entity id when there is no state at all', async () => {
      const hass = makeHass({});
      const el = await mount(hass, { type: 'entity-tile', entity: 'sensor.gone' });
      const title = el.shadowRoot!.querySelector('.title');
      expect(title!.textContent).to.equal('sensor.gone');
    });
  });

  describe('variants by width / compact', () => {
    it('width===1 -> .tile.icon-only (single ha-icon, no text)', async () => {
      const hass = makeHass({
        'switch.x': entityState('switch.x', 'off'),
      });
      const el = await mount(hass, { type: 'entity-tile', entity: 'switch.x', width: 1 });
      const tile = el.shadowRoot!.querySelector('.tile');
      expect(tile).to.not.equal(null);
      expect(tile!.classList.contains('icon-only')).to.be.true;
      expect(tile!.querySelector('ha-icon')).to.not.equal(null);
      expect(el.shadowRoot!.querySelector('.title')).to.equal(null);
      expect(el.shadowRoot!.querySelector('.value')).to.equal(null);
      expect(el.shadowRoot!.querySelector('.ic')).to.equal(null);
    });

    it('compact:true -> .tile.compact showing only a bare centered icon (no circle, no value/title)', async () => {
      const hass = makeHass({
        'sensor.temp': entityState('sensor.temp', '21', { unit_of_measurement: '°C' }),
      });
      const el = await mount(hass, {
        type: 'entity-tile',
        entity: 'sensor.temp',
        compact: true,
      });
      const tile = el.shadowRoot!.querySelector('.tile');
      expect(tile!.classList.contains('compact')).to.be.true;
      // the icon is rendered directly on the tile — no .ic circle chip
      expect(el.shadowRoot!.querySelector('.ic')).to.equal(null);
      expect(tile!.querySelector('ha-icon')).to.not.equal(null);
      // compact shows only the icon — no value line and no title
      expect(el.shadowRoot!.querySelector('.value')).to.equal(null);
      expect(el.shadowRoot!.querySelector('.title')).to.equal(null);
      expect(el.shadowRoot!.querySelector('.text')).to.equal(null);
    });

    it('width<=2 -> .tile.compact', async () => {
      const hass = makeHass({
        'sensor.temp': entityState('sensor.temp', '21'),
      });
      const el = await mount(hass, { type: 'entity-tile', entity: 'sensor.temp', width: 2 });
      const tile = el.shadowRoot!.querySelector('.tile');
      expect(tile!.classList.contains('compact')).to.be.true;
      // still icon-only even though the sensor has a value
      expect(el.shadowRoot!.querySelector('.value')).to.equal(null);
    });

    it('otherwise -> full .tile with .title and .value (when secondary)', async () => {
      const hass = makeHass({
        'sensor.temp': entityState('sensor.temp', '21', {
          unit_of_measurement: '°C',
          friendly_name: 'Temp',
        }),
      });
      const el = await mount(hass, { type: 'entity-tile', entity: 'sensor.temp', width: 3 });
      const tile = el.shadowRoot!.querySelector('.tile');
      expect(tile).to.not.equal(null);
      expect(tile!.classList.contains('compact')).to.be.false;
      expect(tile!.classList.contains('icon-only')).to.be.false;
      expect(el.shadowRoot!.querySelector('.ic')).to.not.equal(null);
      expect(el.shadowRoot!.querySelector('.title')!.textContent).to.equal('Temp');
      expect(el.shadowRoot!.querySelector('.value')!.textContent).to.equal('21 °C');
    });

    it('full .tile with no secondary renders no .value', async () => {
      // button -> no secondary
      const hass = makeHass({
        'button.x': entityState('button.x', 'unknown', { friendly_name: 'Press Me' }),
      });
      const el = await mount(hass, { type: 'entity-tile', entity: 'button.x' });
      expect(el.shadowRoot!.querySelector('.title')!.textContent).to.equal('Press Me');
      expect(el.shadowRoot!.querySelector('.value')).to.equal(null);
    });
  });

  describe('tile "on" treatment (color + roundness)', () => {
    /** The rendered `.tile` button. */
    const tileOf = (el: MtEntityTile) => el.shadowRoot!.querySelector('.tile')!;

    it('icon-only tile gets `on` class when the value is not falsy', async () => {
      const hass = makeHass({ 'switch.x': entityState('switch.x', 'on') });
      const el = await mount(hass, { type: 'entity-tile', entity: 'switch.x', width: 1 });
      expect(tileOf(el).classList.contains('on')).to.be.true;
    });

    it('icon-only tile lacks `on` class when the value is falsy', async () => {
      const hass = makeHass({ 'switch.x': entityState('switch.x', 'off') });
      const el = await mount(hass, { type: 'entity-tile', entity: 'switch.x', width: 1 });
      expect(tileOf(el).classList.contains('on')).to.be.false;
    });

    it('compact tile gets `on` class when the value is not falsy', async () => {
      const hass = makeHass({ 'switch.x': entityState('switch.x', 'on') });
      const el = await mount(hass, { type: 'entity-tile', entity: 'switch.x', compact: true });
      expect(tileOf(el).classList.contains('on')).to.be.true;
    });

    it('full tile gets `on` class when the value is not falsy', async () => {
      const hass = makeHass({ 'switch.x': entityState('switch.x', 'on') });
      const el = await mount(hass, { type: 'entity-tile', entity: 'switch.x', width: 3 });
      expect(tileOf(el).classList.contains('on')).to.be.true;
    });

    it('full tile lacks `on` class when the value is falsy', async () => {
      const hass = makeHass({ 'switch.x': entityState('switch.x', 'off') });
      const el = await mount(hass, { type: 'entity-tile', entity: 'switch.x', width: 3 });
      expect(tileOf(el).classList.contains('on')).to.be.false;
    });

    it('a sensor with a real value reads as "on" (colored)', async () => {
      const hass = makeHass({ 'sensor.temp': entityState('sensor.temp', '21') });
      const el = await mount(hass, { type: 'entity-tile', entity: 'sensor.temp', width: 3 });
      expect(tileOf(el).classList.contains('on')).to.be.true;
    });

    const falsyStates = ['off', 'none', 'false', 'null', '0', 'unavailable', 'unknown', ''];
    falsyStates.forEach((s) => {
      it(`treats "${s || '(empty)'}" as off (no accent)`, async () => {
        const hass = makeHass({ 'sensor.x': entityState('sensor.x', s) });
        const el = await mount(hass, { type: 'entity-tile', entity: 'sensor.x', width: 3 });
        expect(tileOf(el).classList.contains('on')).to.be.false;
      });
    });

    it('is off when there is no state at all', async () => {
      const hass = makeHass({});
      const el = await mount(hass, { type: 'entity-tile', entity: 'sensor.gone', width: 3 });
      expect(tileOf(el).classList.contains('on')).to.be.false;
    });

    it('forceOff overrides an otherwise "on" value (climate is off)', async () => {
      const hass = makeHass({ 'switch.x': entityState('switch.x', 'on') });
      const el = await fixture<MtEntityTile>(
        html`<mt-entity-tile
          .hass=${hass}
          .config=${{ type: 'entity-tile', entity: 'switch.x', width: 3 } as EntityTileFeatureConfig}
          .forceOff=${true}
        ></mt-entity-tile>`
      );
      expect(tileOf(el).classList.contains('on')).to.be.false;
    });
  });

  describe('tap', () => {
    it('no tap_action + switch -> callService(homeassistant, toggle)', async () => {
      const hass = makeHass({ 'switch.x': entityState('switch.x', 'off') });
      const el = await mount(hass, { type: 'entity-tile', entity: 'switch.x', width: 3 });
      const tile = el.shadowRoot!.querySelector('.tile') as HTMLButtonElement;
      tile.click();
      expect(hass.__calls.length).to.equal(1);
      expect(hass.__calls[0].domain).to.equal('homeassistant');
      expect(hass.__calls[0].service).to.equal('toggle');
      expect(hass.__calls[0].data).to.deep.equal({ entity_id: 'switch.x' });
    });

    it('tap_action {action:more-info} -> fires hass-more-info', async () => {
      const hass = makeHass({ 'sensor.temp': entityState('sensor.temp', '21') });
      const el = await mount(hass, {
        type: 'entity-tile',
        entity: 'sensor.temp',
        tap_action: { action: 'more-info' },
      });
      const tile = el.shadowRoot!.querySelector('.tile') as HTMLButtonElement;
      const listener = oncePromise(el, 'hass-more-info');
      tile.click();
      const ev = await listener;
      expect((ev.detail as { entityId: string }).entityId).to.equal('sensor.temp');
      // and no service was called
      expect(hass.__calls.length).to.equal(0);
    });

    it('clicking an icon-only tile also runs the tap action', async () => {
      const hass = makeHass({ 'switch.x': entityState('switch.x', 'on') });
      const el = await mount(hass, { type: 'entity-tile', entity: 'switch.x', width: 1 });
      const tile = el.shadowRoot!.querySelector('.tile') as HTMLButtonElement;
      tile.click();
      expect(hass.__calls.length).to.equal(1);
      expect(hass.__calls[0].service).to.equal('toggle');
    });

    it('_tap early-returns (no service) when config.entity is empty', async () => {
      const hass = makeHass({ 'switch.x': entityState('switch.x', 'on') });
      const el = await mount(hass, { type: 'entity-tile', entity: 'switch.x' });
      // Force the guard: an empty entity means _tap should no-op.
      el.config = { type: 'entity-tile', entity: '' };
      await el.updateComplete;
      (el as unknown as { _tap: () => void })._tap();
      expect(hass.__calls.length).to.equal(0);
    });
  });
});
