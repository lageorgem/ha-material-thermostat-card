import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import '../../src/material-thermostat-card';
import { MaterialThermostatCard } from '../../src/material-thermostat-card';
import type { CircularDial } from '../../src/dial/circular-dial';
import { makeHass, climateState, waterHeaterState } from '../helpers';

window.addEventListener('error', (event) => {
  if (/ResizeObserver loop/.test(event.message)) {
    event.stopImmediatePropagation();
    event.preventDefault();
  }
});

describe('card parity contracts', () => {
  let card: MaterialThermostatCard;
  let clock: sinon.SinonFakeTimers;

  beforeEach(async () => {
    card = document.createElement('material-thermostat-card');
    card.setConfig({ type: 'custom:material-thermostat-card', entity: 'climate.test', font: 'theme' });
    card.hass = makeHass({ 'climate.test': climateState() });
    document.body.append(card);
    await card.updateComplete;
    clock = sinon.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  });

  afterEach(() => { card.remove(); sinon.restore(); clock.restore(); });

  /** Send a dial event through the real card bindings.
   * @param detail optimistic temperatures
   * @param type dial event name
   */
  function change(detail: { value?: number; low?: number; high?: number }, type = 'value-changed'): void {
    card.shadowRoot!.querySelector('mt-circular-dial')!.dispatchEvent(new CustomEvent(type, { detail }));
  }

  /** Read the rendered dial.
   * @param none No parameters.
   */
  function dial(): CircularDial {
    return card.shadowRoot!.querySelector('mt-circular-dial')!;
  }

  /** Assert that no optimistic target survives cancellation.
   * @param none No parameters.
   */
  function expectCleared(): void {
    const selected = card as unknown as { _selectedTemp?: number; _selectedLow?: number; _selectedHigh?: number };
    expect(selected._selectedTemp).to.equal(undefined);
    expect(selected._selectedLow).to.equal(undefined);
    expect(selected._selectedHigh).to.equal(undefined);
  }

  for (const entity of ['climate.other', 'water_heater.test']) {
    it(`cancels pending targets and clears optimism when switching to ${entity}`, async () => {
      const service = sinon.spy(card.hass, 'callService');
      card.hass = { ...card.hass, states: { ...card.hass.states,
        [entity]: entity.startsWith('climate.') ? { ...climateState(), entity_id: entity } : waterHeaterState(),
      } };
      await card.updateComplete;
      change({ low: 19, high: 25 }, 'value-changing');
      change({ value: 22 });
      await clock.tickAsync(300);
      card.setConfig({ type: 'custom:material-thermostat-card', entity, font: 'theme' });
      expectCleared();
      await clock.tickAsync(3300);
      await card.updateComplete;
      expect(service.callCount).to.equal(0);
      expect(dial().value).to.equal(entity.startsWith('climate.') ? 21 : 55);
    });
  }

  it('keeps a pending single commit through an unrelated same-entity option change', async () => {
    const service = sinon.spy(card.hass, 'callService');
    change({ value: 22 });
    await clock.tickAsync(300);
    card.setConfig({ type: 'custom:material-thermostat-card', entity: 'climate.test', name: 'Renamed', font: 'theme' });
    await clock.tickAsync(300);
    expect(service.callCount).to.equal(1);
    expect(service.firstCall.args).to.deep.equal(['climate', 'set_temperature', { entity_id: 'climate.test', temperature: 22 }]);
  });

  it('does not reinterpret a pending range when the model becomes single', async () => {
    const range = { supported_features: 3, temperature: null, target_temp_low: 19, target_temp_high: 25 };
    card.hass = makeHass({ 'climate.test': climateState(range, 'heat_cool') });
    const service = sinon.spy(card.hass, 'callService');
    await card.updateComplete;
    change({ low: 20, high: 24 });
    card.hass = { ...card.hass, states: { 'climate.test': climateState({ ...range, temperature: 22 }, 'heat_cool') } };
    await clock.tickAsync(600);
    await card.updateComplete;
    expect(service.callCount).to.equal(0);
    expectCleared();
    expect(dial().value).to.equal(22);
    expect(dial().lowValue).to.equal(undefined);
    expect(dial().highValue).to.equal(undefined);
  });

  it('keeps normal range commit payloads unchanged', async () => {
    card.hass = makeHass({ 'climate.test': climateState({ supported_features: 3, temperature: null, target_temp_low: 19, target_temp_high: 25 }, 'heat_cool') });
    const service = sinon.spy(card.hass, 'callService');
    await card.updateComplete;
    change({ low: 20, high: 24 });
    await clock.tickAsync(600);
    expect(service.firstCall.args).to.deep.equal(['climate', 'set_temperature', { entity_id: 'climate.test', target_temp_low: 20, target_temp_high: 24 }]);
  });

  it('guards an already-queued callback against a changed configured entity', async () => {
    const timer = sinon.spy(window, 'setTimeout');
    const service = sinon.spy(card.hass, 'callService');
    change({ value: 22 });
    const callback = timer.getCalls().find((call) => call.args[1] === 600)!.args[0] as () => void;
    card.setConfig({ type: 'custom:material-thermostat-card', entity: 'water_heater.test', font: 'theme' });
    callback();
    expect(service.callCount).to.equal(0);
    expectCleared();
  });

  it('does not create a command from an interaction whose entity state was missing', async () => {
    const service = sinon.spy(card.hass, 'callService');
    card.hass = { ...card.hass, states: {} };
    change({ value: 22 });
    card.hass = { ...card.hass, states: { 'climate.test': climateState() } };
    await clock.tickAsync(600);
    expect(service.callCount).to.equal(0);
    expectCleared();
  });

  it('entity switches cancel resync deadlines and invalidate unresolved service results', async () => {
    let resolve!: () => void;
    sinon.stub(card.hass, 'callService').onFirstCall().resolves().onSecondCall().returns(new Promise<void>((done) => { resolve = done; }));
    change({ value: 22 });
    await clock.tickAsync(600);
    card.setConfig({ type: 'custom:material-thermostat-card', entity: 'water_heater.test', font: 'theme' });
    expectCleared();
    expect(clock.countTimers()).to.equal(0);
    card.setConfig({ type: 'custom:material-thermostat-card', entity: 'climate.test', font: 'theme' });
    await card.updateComplete;
    change({ value: 23 });
    await clock.tickAsync(600);
    card.setConfig({ type: 'custom:material-thermostat-card', entity: 'water_heater.test', font: 'theme' });
    resolve();
    await clock.tickAsync(0);
    expectCleared();
    expect(clock.countTimers()).to.equal(0);
  });

  it('rolls back rejected single values and warns once with the error message', async () => {
    sinon.stub(card.hass, 'callService').rejects(new Error('Denied'));
    const warn = sinon.stub(console, 'warn');
    change({ value: 23 });
    await clock.tickAsync(600);
    await card.updateComplete;
    expect(dial().value).to.equal(21);
    expect(warn.callCount).to.equal(1);
    expect(warn.firstCall.args.join(' ')).to.contain('Denied');
  });

  it('keeps resolved optimism for 3000 ms, then displays rounded server state', async () => {
    change({ value: 23.3 });
    await clock.tickAsync(600);
    card.hass = makeHass({ 'climate.test': climateState({ temperature: 23.5 }) });
    await card.updateComplete;
    await clock.tickAsync(2999);
    expect(dial().value).to.equal(23.3);
    await clock.tickAsync(1);
    await card.updateComplete;
    expect(dial().value).to.equal(23.5);
  });

  it('preserves a newer live change when an older timer would fire', async () => {
    change({ value: 23 });
    await clock.tickAsync(600);
    change({ value: 24 }, 'value-changing');
    await clock.tickAsync(3000);
    await card.updateComplete;
    expect(dial().value).to.equal(24);
  });

  it('ignores stale success and rejection after newer changes', async () => {
    let resolve!: () => void;
    let reject!: (error: unknown) => void;
    const service = sinon.stub(card.hass, 'callService');
    service.onFirstCall().returns(new Promise<void>((done) => { resolve = done; }));
    service.onSecondCall().returns(new Promise<void>((_done, fail) => { reject = fail; }));
    sinon.stub(console, 'warn');
    change({ value: 23 });
    await clock.tickAsync(600);
    change({ value: 24 });
    await clock.tickAsync(600);
    change({ value: 25 }, 'value-changing');
    resolve(); reject('Unavailable');
    await clock.tickAsync(4000);
    await card.updateComplete;
    expect(dial().value).to.equal(25);
  });

  it('exact confirmation clears immediately and its later timer is harmless', async () => {
    change({ value: 23 });
    await clock.tickAsync(600);
    card.hass = makeHass({ 'climate.test': climateState({ temperature: 23 }) });
    await card.updateComplete;
    card.hass = makeHass({ 'climate.test': climateState({ temperature: 22 }) });
    await card.updateComplete;
    expect(dial().value).to.equal(22);
    await clock.tickAsync(3000);
    expect(dial().value).to.equal(22);
  });

  it('rolls back dual targets for non-promise service mocks', async () => {
    card.hass = makeHass({ 'climate.test': climateState({ temperature: undefined, target_temp_low: 19, target_temp_high: 25 }, 'heat_cool') });
    sinon.stub(card.hass, 'callService').returns(undefined as never);
    await card.updateComplete;
    change({ low: 20, high: 24 });
    await clock.tickAsync(600);
    expect(dial().lowValue).to.equal(20);
    await clock.tickAsync(3000);
    await card.updateComplete;
    expect(dial().lowValue).to.equal(19);
    expect(dial().highValue).to.equal(25);
  });

  it('preserves a confirmed range endpoint while rolling back the other endpoint', async () => {
    card.hass = makeHass({ 'climate.test': climateState({ temperature: undefined, target_temp_low: 19, target_temp_high: 25 }) });
    await card.updateComplete;
    change({ low: 20, high: 24 });
    await clock.tickAsync(600);
    card.hass = makeHass({ 'climate.test': climateState({ temperature: undefined, target_temp_low: 20, target_temp_high: 26 }) });
    await card.updateComplete;
    await clock.tickAsync(3000);
    await card.updateComplete;
    expect(dial().lowValue).to.equal(20);
    expect(dial().highValue).to.equal(26);
  });

  it('a newer commit cancels an older timer and starts its own deadline', async () => {
    change({ value: 23 });
    await clock.tickAsync(600);
    change({ value: 24 });
    await clock.tickAsync(600);
    await clock.tickAsync(2400);
    expect(dial().value).to.equal(24);
    await clock.tickAsync(600);
    await card.updateComplete;
    expect(dial().value).to.equal(21);
  });

  it('reconnect displays rounded server state instead of a resolved optimistic target', async () => {
    const service = sinon.spy(card.hass, 'callService');
    change({ value: 23.3 });
    await clock.tickAsync(600);
    card.hass = { ...card.hass, states: { 'climate.test': climateState({ temperature: 23.5 }) } };
    await card.updateComplete;
    expect(dial().value).to.equal(23.3);
    card.remove();
    document.body.append(card);
    await card.updateComplete;
    expectCleared();
    expect(dial().value).to.equal(23.5);
    expect(clock.countTimers()).to.equal(0);
    await clock.tickAsync(4000);
    expect(dial().value).to.equal(23.5);
    expect(service.callCount).to.equal(1);
  });

  it('reconnect clears both optimistic range endpoints', async () => {
    card.hass = makeHass({ 'climate.test': climateState({ temperature: null, target_temp_low: 19, target_temp_high: 25 }, 'heat_cool') });
    const service = sinon.spy(card.hass, 'callService');
    await card.updateComplete;
    change({ low: 20, high: 24 });
    await clock.tickAsync(600);
    await card.updateComplete;
    expect(dial().lowValue).to.equal(20);
    expect(dial().highValue).to.equal(24);
    card.remove();
    document.body.append(card);
    await card.updateComplete;
    expectCleared();
    expect(dial().lowValue).to.equal(19);
    expect(dial().highValue).to.equal(25);
    await clock.tickAsync(4000);
    expect(service.callCount).to.equal(1);
  });

  it('disconnect during debounce drops the unsent commit and reconnect restores server state', async () => {
    const service = sinon.spy(card.hass, 'callService');
    change({ value: 23 });
    await card.updateComplete;
    expect(dial().value).to.equal(23);
    await clock.tickAsync(300);
    card.remove();
    await clock.tickAsync(600);
    expect(service.callCount).to.equal(0);
    document.body.append(card);
    await card.updateComplete;
    expectCleared();
    expect(dial().value).to.equal(21);
    await clock.tickAsync(4000);
    expect(service.callCount).to.equal(0);
  });

  it('reapplies a configured theme on a themes-only hass update', async () => {
    card.setConfig({ type: 'custom:material-thermostat-card', entity: 'climate.test', theme: 'parity', font: 'theme' });
    const theme = (color: string) => ({ default_theme: 'default', themes: { parity: { 'primary-color': color } } });
    card.hass = { ...card.hass, themes: theme('red') };
    await card.updateComplete;
    const updated = sinon.spy(card as unknown as { updated: (changed: unknown) => void }, 'updated');
    card.hass = { ...card.hass, themes: theme('blue') };
    await card.updateComplete;
    expect(updated.calledOnce).to.equal(true);
  });

  it('uses content-driven sections rows and a stable, per-instance group name', async () => {
    expect(card.getGridOptions()).to.deep.equal({ columns: 12, min_columns: 6, rows: 'auto' });
    const group = card.shadowRoot!.querySelector('ha-card')!;
    const name = card.shadowRoot!.querySelector('.name')!;
    expect(group.getAttribute('role')).to.equal('group');
    expect(group.getAttribute('aria-labelledby')).to.equal(name.id);
    expect(name.id).not.to.equal('');
    const other = document.createElement('material-thermostat-card');
    other.setConfig({ type: 'custom:material-thermostat-card', entity: 'climate.test' });
    other.hass = card.hass;
    document.body.append(other);
    try {
      await other.updateComplete;
      expect(other.shadowRoot!.querySelector('.name')!.id).not.to.equal(name.id);
    } finally { other.remove(); }
  });
});
