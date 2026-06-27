import { expect, aTimeout } from '@open-wc/testing';
import sinon from 'sinon';
import '../../src/features/comfort';
import { MtComfort } from '../../src/features/comfort';
import { makeHass, climateState, entityState } from '../helpers';
import type { ComfortFeatureConfig } from '../../src/types';

const CLIMATE = 'climate.x';
const T_SENSOR = 'sensor.t';
const H_SENSOR = 'sensor.h';

/** Build compact websocket history points from values at 2-minute steps. */
function pts(values: number[] | string[], baseSec: number): { s: string; lu: number }[] {
  return values.map((v, i) => ({ s: String(v), lu: baseSec + i * 120 }));
}

interface MountOpts {
  feature?: Partial<ComfortFeatureConfig>;
  climateStateStr?: string;
  tempNow?: string;
  rhNow?: string;
  history?: Record<string, { s: string; lu: number }[]>;
  noSensors?: boolean;
  /** Epoch-seconds for the climate's last_changed (session start). */
  sessionStartSec?: number;
}

describe('mt-comfort', () => {
  let mounted: MtComfort[] = [];
  const baseSec = Math.floor(Date.now() / 1000) - 30 * 60;
  let lastCallWS: sinon.SinonStub;

  afterEach(() => {
    for (const el of mounted) el.remove();
    mounted = [];
    sinon.restore();
  });

  /** Mount mt-comfort and let its async history fetch settle. */
  async function mount(opts: MountOpts = {}): Promise<MtComfort> {
    const climate = climateState(
      { current_temperature: Number(opts.tempNow ?? 25), temperature: 21 },
      opts.climateStateStr ?? 'cool'
    );
    // The session anchors on the climate's last_changed (since it turned on).
    (climate as any).last_changed = new Date((opts.sessionStartSec ?? baseSec) * 1000).toISOString();
    const states: Record<string, any> = {
      [CLIMATE]: climate,
      [T_SENSOR]: entityState(T_SENSOR, opts.tempNow ?? '25'),
      [H_SENSOR]: entityState(H_SENSOR, opts.rhNow ?? '50'),
    };
    const callWS = sinon.stub().resolves(opts.history ?? {});
    lastCallWS = callWS;
    const el = document.createElement('mt-comfort') as MtComfort;
    el.entityId = CLIMATE;
    el.feature = { type: 'comfort', ...opts.feature };
    if (!opts.noSensors) {
      el.tempSensor = T_SENSOR;
      el.humiditySensor = H_SENSOR;
    }
    el.hass = makeHass(states, { callWS });
    document.body.appendChild(el);
    mounted.push(el);
    await el.updateComplete;
    await aTimeout(10); // let _refresh()'s awaited callWS resolve
    await el.updateComplete;
    return el;
  }

  /** The rendered status text, or null when the row is collapsed. */
  function line(el: MtComfort): string | null {
    const node = el.shadowRoot!.querySelector('.comfort span');
    return node ? node.textContent!.trim() : null;
  }

  it('shows "Room feels comfortable" immediately (no history needed)', async () => {
    const el = await mount({ tempNow: '25', rhNow: '50' });
    expect(line(el)).to.equal('Room feels comfortable');
  });

  it('is hidden when the climate is off', async () => {
    const el = await mount({ climateStateStr: 'off', tempNow: '25' });
    expect(el.shadowRoot!.querySelector('.comfort')).to.equal(null);
  });

  it('is hidden when the sensors are not configured', async () => {
    const el = await mount({ noSensors: true });
    expect(el.shadowRoot!.querySelector('.comfort')).to.equal(null);
  });

  it('shows a static verdict when uncomfortable but there is no history to forecast', async () => {
    const el = await mount({ tempNow: '34', rhNow: '60', history: {} });
    expect(line(el)).to.equal('Room feels warm');
  });

  it('forecasts time until comfortable from cooling history', async () => {
    // Room cooling 36→27°C at 30% RH, currently 32°C → PMV well above +0.5.
    const temps: number[] = [];
    for (let i = 0; i < 16; i++) temps.push(24 + 12 * Math.exp(-0.05 * i * 2));
    const el = await mount({
      tempNow: '32',
      rhNow: '30',
      history: {
        [CLIMATE]: pts(Array(16).fill('cool'), baseSec),
        [T_SENSOR]: pts(temps, baseSec),
        [H_SENSOR]: pts(Array(16).fill(30), baseSec),
      },
    });
    expect(line(el)).to.match(/until room feels comfortable$/);
  });

  it('appends the target ETA when enabled', async () => {
    const temps: number[] = [];
    for (let i = 0; i < 16; i++) temps.push(20 + 5 * Math.exp(-0.05 * i * 2)); // → 20
    const el = await mount({
      tempNow: '25',
      rhNow: '45',
      feature: { show_target_eta: true },
      history: {
        [CLIMATE]: pts(Array(16).fill('cool'), baseSec),
        [T_SENSOR]: pts(temps, baseSec),
        [H_SENSOR]: pts(Array(16).fill(45), baseSec),
      },
    });
    // climate target is 21 (from climateState helper); 25°C now, comfortable.
    expect(line(el)).to.match(/^Room feels comfortable, .*target temperature/);
  });

  it('fetches only the current session (from last_changed) and only the sensors', async () => {
    const sessionStartSec = Math.floor(Date.now() / 1000) - 20 * 60; // 20 min ago
    await mount({ tempNow: '25', sessionStartSec });
    expect(lastCallWS.called).to.equal(true);
    const msg = lastCallWS.firstCall.args[0];
    expect(msg.type).to.equal('history/history_during_period');
    // Window starts at the session boundary, not a fixed lookback.
    expect(new Date(msg.start_time).getTime()).to.be.closeTo(sessionStartSec * 1000, 2000);
    // The climate entity is no longer fetched — only the two sensors.
    expect(msg.entity_ids).to.have.members([T_SENSOR, H_SENSOR]);
    expect(msg.entity_ids).to.not.include(CLIMATE);
  });

  it('dispatches feature-visibility and cleans up its timer on disconnect', async () => {
    const events: boolean[] = [];
    const el = await mount({ tempNow: '25' });
    el.addEventListener('feature-visibility', (e) => events.push((e as CustomEvent).detail.visible));
    el.hass = makeHass(
      {
        [CLIMATE]: climateState({ current_temperature: 25 }, 'cool'),
        [T_SENSOR]: entityState(T_SENSOR, '25'),
        [H_SENSOR]: entityState(H_SENSOR, '50'),
      },
      { callWS: sinon.stub().resolves({}) }
    );
    await el.updateComplete;
    await aTimeout(10);
    expect(events.some((v) => v === true)).to.equal(true);

    el.disconnectedCallback();
    expect((el as any)._timer).to.equal(undefined);
  });
});
