import { expect, aTimeout } from '@open-wc/testing';
import sinon from 'sinon';
import '../../src/features/comfort';
import { MtComfort } from '../../src/features/comfort';
import { makeHass, climateState, entityState } from '../helpers';
import { climateModeColor } from '../../src/theme';
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
  /** Seconds ago the temperature reading last changed (ETA countdown anchor). */
  tStaleSec?: number;
  /** Extra climate attributes (e.g. heat_cool target_temp_low/high). */
  climateAttrs?: Record<string, any>;
  /** Make the recorder fetch reject (simulates the recorder being unavailable). */
  wsRejects?: boolean;
  /** Override hass.config (e.g. to drop unit_system). */
  config?: any;
  /** Don't set the climate's last_changed (no resolvable session start). */
  noSessionStart?: boolean;
  /** Set the climate's last_changed to a raw string (e.g. an invalid date). */
  sessionStartRaw?: string;
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
      { current_temperature: Number(opts.tempNow ?? 25), temperature: 21, ...(opts.climateAttrs ?? {}) },
      opts.climateStateStr ?? 'cool'
    );
    // The session anchors on the climate's last_changed (since it turned on).
    if (opts.sessionStartRaw !== undefined) {
      (climate as any).last_changed = opts.sessionStartRaw;
    } else if (!opts.noSessionStart) {
      (climate as any).last_changed = new Date((opts.sessionStartSec ?? baseSec) * 1000).toISOString();
    }
    const tSensor = entityState(T_SENSOR, opts.tempNow ?? '25');
    if (opts.tStaleSec != null) {
      (tSensor as any).last_changed = new Date(Date.now() - opts.tStaleSec * 1000).toISOString();
    }
    const states: Record<string, any> = {
      [CLIMATE]: climate,
      [T_SENSOR]: tSensor,
      [H_SENSOR]: entityState(H_SENSOR, opts.rhNow ?? '50'),
    };
    const callWS = opts.wsRejects
      ? sinon.stub().rejects(new Error('recorder unavailable'))
      : sinon.stub().resolves(opts.history ?? {});
    lastCallWS = callWS;
    const el = document.createElement('mt-comfort') as MtComfort;
    el.entityId = CLIMATE;
    el.feature = { type: 'comfort', ...opts.feature };
    if (!opts.noSensors) {
      el.tempSensor = T_SENSOR;
      el.humiditySensor = H_SENSOR;
    }
    el.hass = makeHass(states, {
      callWS,
      ...(opts.config !== undefined ? { config: opts.config } : {}),
    });
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

  /** The rendered status icon element, or null. */
  function icon(el: MtComfort): Element | null {
    return el.shadowRoot!.querySelector('.comfort ha-icon');
  }

  it('shows the per-status icon and colour — warm/cool reversed from the mode', async () => {
    // warm → thermometer-HIGH in the HEAT colour (the reverse of what you'd switch on).
    const warm = await mount({ climateStateStr: 'off', tempNow: '33', rhNow: '45' });
    expect(icon(warm)!.getAttribute('icon')).to.equal('mdi:thermometer-high');
    expect(icon(warm)!.getAttribute('style')).to.contain(climateModeColor('heat'));

    // cool → thermometer-LOW in the COOL colour.
    const cool = await mount({ climateStateStr: 'off', tempNow: '17', rhNow: '40' });
    expect(icon(cool)!.getAttribute('icon')).to.equal('mdi:thermometer-low');
    expect(icon(cool)!.getAttribute('style')).to.contain(climateModeColor('cool'));

    // humid → water-percent in the COOL colour.
    const humid = await mount({ climateStateStr: 'off', tempNow: '24', rhNow: '85' });
    expect(icon(humid)!.getAttribute('icon')).to.equal('mdi:water-percent');
    expect(icon(humid)!.getAttribute('style')).to.contain(climateModeColor('cool'));

    // comfortable → happy face in the neutral heat_cool (green) colour.
    const comf = await mount({ climateStateStr: 'off', tempNow: '24', rhNow: '45' });
    expect(icon(comf)!.getAttribute('icon')).to.equal('mdi:emoticon-happy-outline');
    expect(icon(comf)!.getAttribute('style')).to.contain(climateModeColor('heat_cool'));
  });

  it('shows "Room feels comfortable" immediately (no history needed)', async () => {
    const el = await mount({ tempNow: '25', rhNow: '50' });
    expect(line(el)).to.equal('Room feels comfortable');
  });

  it('still shows the verdict when the climate is off (no forecast)', async () => {
    const el = await mount({ climateStateStr: 'off', tempNow: '25', rhNow: '50' });
    expect(line(el)).to.equal('Room feels comfortable');
  });

  it('shows the bare verdict when off and uncomfortable, never an ETA', async () => {
    // Off + warm + plenty of "history": still no forecast, just the verdict.
    const temps = Array.from({ length: 16 }, (_, i) => 24 + 10 * Math.exp(-0.05 * i * 2));
    const el = await mount({
      climateStateStr: 'off',
      tempNow: '33',
      rhNow: '45',
      history: { [T_SENSOR]: pts(temps, baseSec), [H_SENSOR]: pts(Array(16).fill(45), baseSec) },
    });
    expect(line(el)).to.equal('Room feels warm');
    // No history is fetched while off.
    expect(lastCallWS.called).to.equal(false);
  });

  it('is hidden when the climate is unavailable', async () => {
    const el = await mount({ climateStateStr: 'unavailable', tempNow: '25' });
    expect(el.shadowRoot!.querySelector('.comfort')).to.equal(null);
  });

  it('is hidden when the sensors are not configured', async () => {
    const el = await mount({ noSensors: true });
    expect(el.shadowRoot!.querySelector('.comfort')).to.equal(null);
  });

  it('shows the plain verdict (no "calculating") while uncomfortable with no history yet', async () => {
    const el = await mount({ tempNow: '34', rhNow: '60', history: {} });
    expect(line(el)).to.equal('Room feels warm');
  });

  it('forecasts "{time} until comfortable" from cooling history', async () => {
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
    expect(line(el)).to.match(/until comfortable$/);
  });

  it('shows "comfortable soon" when the ETA has counted down past a very stale reading', async () => {
    // Cooling history gives an ETA of a few minutes, but the reading is an hour
    // old → the counted-down ETA is well past zero.
    const temps: number[] = [];
    for (let i = 0; i < 16; i++) temps.push(24 + 12 * Math.exp(-0.05 * i * 2));
    const el = await mount({
      tempNow: '32',
      rhNow: '30',
      tStaleSec: 60 * 60,
      history: {
        [CLIMATE]: pts(Array(16).fill('cool'), baseSec),
        [T_SENSOR]: pts(temps, baseSec),
        [H_SENSOR]: pts(Array(16).fill(30), baseSec),
      },
    });
    expect(line(el)).to.equal('Room should be comfortable soon');
  });

  it('comfortable: shows the Nest-style time until cooled to the target', async () => {
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
    expect(line(el)).to.match(/until cooled to 21°C$/);
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

  // --- Target resolution from the climate entity (the component's _target) ---

  it('heat_cool above the high setpoint → "until cooled to {high}"', async () => {
    // 25°C is comfortable and above target_temp_high (22) → cool toward 22.
    const temps = Array.from({ length: 16 }, (_, i) => 20 + 6 * Math.exp(-0.05 * i * 2)); // → 20
    const el = await mount({
      climateStateStr: 'heat_cool',
      climateAttrs: { target_temp_low: 18, target_temp_high: 22 },
      tempNow: '25',
      rhNow: '45',
      feature: { show_target_eta: true },
      history: { [T_SENSOR]: pts(temps, baseSec), [H_SENSOR]: pts(Array(16).fill(45), baseSec) },
    });
    expect(line(el)).to.match(/until cooled to 22°C$/);
  });

  it('heat_cool below the low setpoint → "until heated to {low}"', async () => {
    // 22°C is comfortable but below target_temp_low (24) → heat toward 24.
    const temps = Array.from({ length: 16 }, (_, i) => 26 - 5 * Math.exp(-0.05 * i * 2)); // → 26
    const el = await mount({
      climateStateStr: 'heat_cool',
      climateAttrs: { target_temp_low: 24, target_temp_high: 28 },
      tempNow: '22',
      rhNow: '45',
      feature: { show_target_eta: true },
      history: { [T_SENSOR]: pts(temps, baseSec), [H_SENSOR]: pts(Array(16).fill(45), baseSec) },
    });
    expect(line(el)).to.match(/until heated to 24°C$/);
  });

  it('heat_cool within the band → no target ETA, just the verdict', async () => {
    const el = await mount({
      climateStateStr: 'heat_cool',
      climateAttrs: { target_temp_low: 20, target_temp_high: 27 },
      tempNow: '24',
      rhNow: '45',
      feature: { show_target_eta: true },
      history: { [T_SENSOR]: pts(Array(16).fill(24), baseSec), [H_SENSOR]: pts(Array(16).fill(45), baseSec) },
    });
    expect(line(el)).to.equal('Room feels comfortable');
  });

  it('heat_cool without low/high setpoints falls back to the single `temperature`', async () => {
    // A malformed heat_cool entity (no target_temp_low/high) → _target() drops to
    // the single setpoint (climateState default 21).
    const temps = Array.from({ length: 16 }, (_, i) => 20 + 6 * Math.exp(-0.05 * i * 2));
    const el = await mount({
      climateStateStr: 'heat_cool',
      tempNow: '24',
      rhNow: '45',
      feature: { show_target_eta: true },
      history: { [T_SENSOR]: pts(temps, baseSec), [H_SENSOR]: pts(Array(16).fill(45), baseSec) },
    });
    expect(line(el)).to.match(/until cooled to 21°C$/);
  });

  it('single-setpoint with no `temperature` attribute → no target ETA clause', async () => {
    // A cool entity with no setpoint reported → _target() resolves to null.
    const el = await mount({
      tempNow: '24',
      rhNow: '45',
      climateAttrs: { temperature: undefined },
      feature: { show_target_eta: true },
      history: { [T_SENSOR]: pts(Array(16).fill(24), baseSec), [H_SENSOR]: pts(Array(16).fill(45), baseSec) },
    });
    expect(line(el)).to.equal('Room feels comfortable');
  });

  it('cool with the setpoint above the current temp → no target ETA (nothing to cool toward)', async () => {
    // Comfortable at 24°C, cool mode, setpoint 26 (above current) → no cooling
    // demand, so it must NOT flip to a nonsensical "won't go above 26°C".
    const el = await mount({
      climateStateStr: 'cool',
      tempNow: '24',
      rhNow: '45',
      climateAttrs: { temperature: 26 },
      feature: { show_target_eta: true },
      history: { [T_SENSOR]: pts(Array(16).fill(24), baseSec), [H_SENSOR]: pts(Array(16).fill(45), baseSec) },
    });
    expect(line(el)).to.equal('Room feels comfortable');
  });

  it('heat with the setpoint below the current temp → no target ETA (nothing to heat toward)', async () => {
    const el = await mount({
      climateStateStr: 'heat',
      tempNow: '24',
      rhNow: '45',
      climateAttrs: { temperature: 22 },
      feature: { show_target_eta: true },
      history: { [T_SENSOR]: pts(Array(16).fill(24), baseSec), [H_SENSOR]: pts(Array(16).fill(45), baseSec) },
    });
    expect(line(el)).to.equal('Room feels comfortable');
  });

  it('heat with the setpoint above the current temp → "until heated to {target}"', async () => {
    // 24°C comfortable, heat mode, heating toward 30 → forecast reaching 26 en route.
    const temps = Array.from({ length: 16 }, (_, i) => 30 - 6 * Math.exp(-0.05 * i * 2)); // 24 → 30
    const el = await mount({
      climateStateStr: 'heat',
      tempNow: '24',
      rhNow: '45',
      climateAttrs: { temperature: 26 },
      feature: { show_target_eta: true },
      history: { [T_SENSOR]: pts(temps, baseSec), [H_SENSOR]: pts(Array(16).fill(45), baseSec) },
    });
    expect(line(el)).to.match(/until heated to 26°C$/);
  });

  it('falls back to the climate current_temperature when the sensor is non-numeric', async () => {
    // The temperature sensor reads "unknown"; the climate reports 25°C → still
    // judged comfortable from the fallback reading (no crash, row visible).
    const el = await mount({ tempNow: 'unknown', rhNow: '45' });
    (el.hass.states[CLIMATE] as any).attributes.current_temperature = 25;
    (el as any)._recompute();
    await el.updateComplete;
    expect(line(el)).to.equal('Room feels comfortable');
  });

  // --- Tick / fetch throttle + error handling ---

  it('recomputes every tick but only refetches past the fetch interval', async () => {
    const el = await mount({ tempNow: '25', rhNow: '45' });
    const after = lastCallWS.callCount;
    // A tick immediately after a fetch: recompute only, no new network call.
    await (el as any)._tick();
    expect(lastCallWS.callCount).to.equal(after);
    // Once the fetch window has elapsed, the next tick refetches.
    (el as any)._lastFetchMs = Date.now() - 70_000;
    await (el as any)._tick();
    expect(lastCallWS.callCount).to.equal(after + 1);
  });

  it('keeps the instant verdict when the recorder fetch fails', async () => {
    // callWS rejects (recorder unavailable) → the catch swallows it and the
    // comfort-now verdict is still shown, just without a forecast.
    const el = await mount({ tempNow: '33', rhNow: '45', wsRejects: true });
    expect(lastCallWS.called).to.equal(true);
    expect(line(el)).to.equal('Room feels warm');
  });

  it('uses °C when hass.config has no unit_system', async () => {
    const temps = Array.from({ length: 16 }, (_, i) => 20 + 6 * Math.exp(-0.05 * i * 2));
    const el = await mount({
      tempNow: '25',
      rhNow: '45',
      config: {},
      feature: { show_target_eta: true },
      history: { [T_SENSOR]: pts(temps, baseSec), [H_SENSOR]: pts(Array(16).fill(45), baseSec) },
    });
    expect(line(el)).to.match(/until cooled to 21°C$/); // °C fallback applied
  });

  // --- Session-start parsing robustness ---

  it('fetches a bounded window when the climate has no last_changed', async () => {
    await mount({ tempNow: '25', noSessionStart: true });
    expect(lastCallWS.called).to.equal(true);
    const msg = lastCallWS.firstCall.args[0];
    // Falls back to the MAX_SESSION_MS cap (≈24h) rather than crashing.
    const span = new Date(msg.end_time).getTime() - new Date(msg.start_time).getTime();
    expect(span).to.be.closeTo(24 * 3_600_000, 5000);
  });

  it('tolerates an unparseable last_changed (treated as no session start)', async () => {
    await mount({ tempNow: '25', sessionStartRaw: 'not-a-date' });
    expect(lastCallWS.called).to.equal(true);
    const msg = lastCallWS.firstCall.args[0];
    const span = new Date(msg.end_time).getTime() - new Date(msg.start_time).getTime();
    expect(span).to.be.closeTo(24 * 3_600_000, 5000);
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
