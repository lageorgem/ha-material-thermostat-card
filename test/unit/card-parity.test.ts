import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import '../../src/material-thermostat-card';
import { MaterialThermostatCard } from '../../src/material-thermostat-card';
import type { CircularDial } from '../../src/dial/circular-dial';
import { makeHass, climateState } from '../helpers';

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

  it('disconnect cancels the deadline and invalidates pending service results', async () => {
    change({ value: 23 });
    await clock.tickAsync(600);
    card.remove();
    await clock.tickAsync(3000);
    expect(dial().value).to.equal(23);
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
