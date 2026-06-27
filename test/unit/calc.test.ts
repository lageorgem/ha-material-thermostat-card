import { expect } from '@open-wc/testing';
import { heatIndexC, apparentTempC, feelsLikeC } from '../../src/calc/comfort-metrics';
import {
  linregress,
  newtonFit,
  etaToThreshold,
  reachable,
  type Sample,
} from '../../src/calc/forecast';
import { formatDuration } from '../../src/calc/duration';
import {
  fetchHistory,
  lastTurnedOnMs,
  numericSeries,
  mergeOnLeft,
  OFF_STATES,
} from '../../src/calc/history';
import { analyzeComfort, type ComfortInput } from '../../src/calc/comfort-analysis';

/** Build an exponential approach series: v(t) = A + (v0 - A)·e^(-k·t). */
function genExp(A: number, v0: number, k: number, n = 21, step = 1): Sample[] {
  const out: Sample[] = [];
  for (let i = 0; i < n; i++) {
    const t = i * step;
    out.push({ t, v: A + (v0 - A) * Math.exp(-k * t) });
  }
  return out;
}

describe('calc/comfort-metrics', () => {
  describe('heatIndexC', () => {
    it('≈ air temperature in cool/dry conditions (below the 80°F threshold)', () => {
      expect(heatIndexC(22, 40)).to.be.closeTo(22, 1.5);
      expect(heatIndexC(18, 30)).to.be.closeTo(18, 1.5);
    });

    it('exceeds the air temperature when hot and humid', () => {
      expect(heatIndexC(32, 70)).to.be.greaterThan(32);
      expect(heatIndexC(35, 60)).to.be.greaterThan(35);
    });

    it('applies the low-humidity adjustment (RH < 13, warm)', () => {
      const hi = heatIndexC(35, 10); // 95°F, 10% → adjustment subtracts
      expect(hi).to.be.a('number');
      expect(hi).to.be.greaterThan(28).and.lessThan(40);
    });

    it('applies the high-humidity adjustment (RH > 85, 80–87°F)', () => {
      const hi = heatIndexC(30, 90); // 86°F, 90% → adjustment adds
      expect(hi).to.be.greaterThan(30);
    });

    it('clamps out-of-range humidity', () => {
      expect(heatIndexC(25, 150)).to.equal(heatIndexC(25, 100));
      expect(heatIndexC(25, -10)).to.equal(heatIndexC(25, 0));
    });
  });

  describe('apparentTempC', () => {
    it('lowers the felt temperature in dry still air', () => {
      // 20°C/50% ≈ 19.8°C apparent (humidity small, -4 still-air offset).
      expect(apparentTempC(20, 50)).to.be.closeTo(19.8, 0.6);
    });

    it('rises with humidity (less evaporative cooling)', () => {
      expect(apparentTempC(20, 90)).to.be.greaterThan(apparentTempC(20, 30));
    });
  });

  it('feelsLikeC is the heat index', () => {
    expect(feelsLikeC(31, 65)).to.equal(heatIndexC(31, 65));
  });
});

describe('calc/forecast', () => {
  describe('linregress', () => {
    it('fits a clean line', () => {
      const fit = linregress([
        { t: 0, v: 1 },
        { t: 1, v: 3 },
        { t: 2, v: 5 },
      ]);
      expect(fit!.slope).to.be.closeTo(2, 1e-9);
      expect(fit!.intercept).to.be.closeTo(1, 1e-9);
      expect(fit!.r2).to.be.closeTo(1, 1e-9);
    });

    it('returns null for < 2 points', () => {
      expect(linregress([{ t: 0, v: 1 }])).to.equal(null);
    });

    it('returns null when all timestamps are identical (no x-variance)', () => {
      expect(
        linregress([
          { t: 5, v: 1 },
          { t: 5, v: 2 },
        ])
      ).to.equal(null);
    });

    it('r2 = 1 when all values are identical (no y-variance)', () => {
      const fit = linregress([
        { t: 0, v: 5 },
        { t: 1, v: 5 },
      ]);
      expect(fit!.slope).to.be.closeTo(0, 1e-9);
      expect(fit!.r2).to.equal(1);
    });
  });

  describe('newtonFit', () => {
    it('recovers the rate constant and asymptote of an exponential', () => {
      const fit = newtonFit(genExp(24, 30, 0.1));
      expect(fit).to.not.equal(null);
      expect(fit!.asymptote).to.be.closeTo(24, 1.0);
      expect(fit!.k).to.be.greaterThan(0.06).and.lessThan(0.13);
    });

    it('returns null with too few samples', () => {
      expect(newtonFit(genExp(24, 30, 0.1, 4))).to.equal(null);
    });

    it('returns null when the time span is too short', () => {
      // 6 samples but only 3 minutes of span (< MIN_SPAN_MIN).
      expect(newtonFit(genExp(24, 30, 0.1, 6, 0.5))).to.equal(null);
    });

    it('returns null for a flat / non-converging series (k ≤ 0)', () => {
      const linear: Sample[] = [];
      for (let t = 0; t <= 20; t++) linear.push({ t, v: 20 + t }); // steady rise, no plateau
      expect(newtonFit(linear)).to.equal(null);
    });

    it('returns null for noisy data with a poor rate-vs-value fit', () => {
      const noisy: Sample[] = [];
      for (let t = 0; t <= 20; t++) noisy.push({ t, v: t % 2 === 0 ? 20 : 25 });
      expect(newtonFit(noisy)).to.equal(null);
    });

    it('skips zero/negative dt pairs and bails when too few pairs remain', () => {
      // 3 samples share t=0, leaving < 3 usable consecutive pairs.
      const dup: Sample[] = [
        { t: 0, v: 30 },
        { t: 0, v: 30 },
        { t: 0, v: 30 },
        { t: 10, v: 27 },
        { t: 20, v: 25 },
      ];
      expect(newtonFit(dup)).to.equal(null);
    });
  });

  describe('reachable / etaToThreshold', () => {
    const fit = newtonFit(genExp(24, 30, 0.1))!;

    it('reaches a target between the current value and the plateau', () => {
      const eta = etaToThreshold(30, 26, fit);
      expect(eta).to.be.a('number');
      expect(eta!).to.be.greaterThan(0);
    });

    it('returns null when the target lies beyond the plateau', () => {
      // Plateau ≈ 24; target 22 is below it → never reached while cooling to 24.
      expect(etaToThreshold(30, 22, fit)).to.equal(null);
    });

    it('reachable() direction logic', () => {
      expect(reachable(30, 26, 24)).to.equal(true); // cooling toward 24, passes 26
      expect(reachable(30, 23, 24)).to.equal(false); // 23 is below the plateau
      expect(reachable(20, 24, 28)).to.equal(true); // heating toward 28, passes 24
      expect(reachable(20, 30, 28)).to.equal(false); // 30 is above the plateau
      expect(reachable(24, 24, 24)).to.equal(false); // already at plateau
    });

    it('returns null when the ratio is non-positive', () => {
      // target on the far side of v0 from the plateau → unreachable.
      expect(etaToThreshold(25, 31, fit)).to.equal(null);
    });
  });
});

describe('calc/duration', () => {
  it('formats minutes, hours and days', () => {
    expect(formatDuration(0.3)).to.equal('less than a minute');
    expect(formatDuration(1)).to.equal('1 minute');
    expect(formatDuration(15)).to.equal('15 minutes');
    expect(formatDuration(60)).to.equal('1 hour');
    expect(formatDuration(120)).to.equal('2 hours');
    expect(formatDuration(130)).to.equal('2h 10m');
    expect(formatDuration(60 * 5 + 10)).to.equal('about 5 hours');
    expect(formatDuration(60 * 25)).to.equal('1 day');
    expect(formatDuration(60 * 50)).to.equal('2 days');
  });

  it('returns empty for invalid input', () => {
    expect(formatDuration(NaN)).to.equal('');
    expect(formatDuration(-5)).to.equal('');
    expect(formatDuration(Infinity)).to.equal('');
  });
});

describe('calc/history', () => {
  it('parses the compact websocket response into chronological points', async () => {
    const hass = {
      callWS: () =>
        Promise.resolve({
          'sensor.t': [
            { s: '21', lu: 1060 },
            { s: '20', lu: 1000 }, // out of order on purpose
          ],
          'climate.x': [{ s: 'cool', lc: 1000 }], // only lc present
        }),
    } as any;
    const res = await fetchHistory(hass, ['sensor.t', 'climate.x', 'sensor.missing'], 0, 9e12);
    expect(res['sensor.t']).to.deep.equal([
      { state: '20', t: 1000000 },
      { state: '21', t: 1060000 },
    ]);
    expect(res['climate.x']).to.deep.equal([{ state: 'cool', t: 1000000 }]);
    expect(res['sensor.missing']).to.deep.equal([]);
  });

  describe('lastTurnedOnMs', () => {
    const pt = (state: string, tSec: number) => ({ state, t: tSec * 1000 });

    it('finds the latest off→on transition', () => {
      const pts = [pt('off', 0), pt('cool', 100), pt('off', 200), pt('cool', 300)];
      expect(lastTurnedOnMs(pts)).to.equal(300_000);
    });

    it('uses the earliest point when on for the whole window', () => {
      const pts = [pt('cool', 50), pt('cool', 100)];
      expect(lastTurnedOnMs(pts)).to.equal(50_000);
    });

    it('returns null when currently off or empty', () => {
      expect(lastTurnedOnMs([pt('cool', 0), pt('off', 100)])).to.equal(null);
      expect(lastTurnedOnMs([])).to.equal(null);
    });

    it('OFF_STATES covers the not-running states', () => {
      ['off', 'unavailable', 'unknown', ''].forEach((s) => expect(OFF_STATES.has(s)).to.equal(true));
    });
  });

  describe('numericSeries', () => {
    it('drops pre-window and non-numeric points, mapping time to minutes', () => {
      const pts = [
        { state: '19', t: 0 },
        { state: '20', t: 60_000 },
        { state: 'unavailable', t: 120_000 },
        { state: '22', t: 180_000 },
      ];
      expect(numericSeries(pts, 60_000, 60_000)).to.deep.equal([
        { t: 0, v: 20 },
        { t: 2, v: 22 },
      ]);
    });
  });

  describe('mergeOnLeft', () => {
    it('attaches the most recent right value at/before each left time', () => {
      const left = [
        { t: 0, v: 20 },
        { t: 1, v: 21 },
      ];
      const right = [
        { t: -1, v: 50 },
        { t: 0.5, v: 55 },
      ];
      expect(mergeOnLeft(left, right)).to.deep.equal([
        { t: 0, l: 20, r: 50 },
        { t: 1, l: 21, r: 55 },
      ]);
    });

    it('drops left points with no prior right value', () => {
      expect(mergeOnLeft([{ t: 0, v: 1 }], [{ t: 5, v: 9 }])).to.deep.equal([]);
    });
  });
});

describe('calc/comfort-analysis', () => {
  /** Constant-humidity series helper at the given times. */
  function rhFlat(rh: number, n = 16, step = 2): Sample[] {
    return Array.from({ length: n }, (_, i) => ({ t: i * step, v: rh }));
  }
  /** Temperature exponential-approach series. */
  function tempExp(A: number, v0: number, k: number, n = 16, step = 2): Sample[] {
    return genExp(A, v0, k, n, step);
  }

  const base: ComfortInput = {
    mode: 'cool',
    action: 'cooling',
    tempNow: 22,
    rhNow: 50,
    tempSeries: [],
    rhSeries: [],
    comfortMin: 20,
    comfortMax: 26,
    target: null,
    showTargetEta: false,
    unit: '°C',
  };

  it('hides when readings are non-numeric', () => {
    expect(analyzeComfort({ ...base, tempNow: NaN }).visible).to.equal(false);
    expect(analyzeComfort({ ...base, rhNow: NaN }).visible).to.equal(false);
  });

  it('reports comfortable immediately, no history needed', () => {
    const r = analyzeComfort({ ...base, tempNow: 22, rhNow: 50 });
    expect(r).to.deep.include({ visible: true, comfortable: true, line: 'Room feels comfortable' });
  });

  it('hides when uncomfortable but there is not enough history to forecast', () => {
    const r = analyzeComfort({ ...base, tempNow: 33, rhNow: 60 });
    expect(r.visible).to.equal(false);
  });

  it('cooling: forecasts time until comfortable', () => {
    const r = analyzeComfort({
      ...base,
      tempNow: 33,
      rhNow: 50,
      tempSeries: tempExp(24, 33, 0.06),
      rhSeries: rhFlat(50),
    });
    expect(r.visible).to.equal(true);
    expect(r.comfortable).to.equal(false);
    expect(r.line).to.match(/until room feels comfortable$/);
  });

  it('heating: uses apparent temperature and forecasts upward', () => {
    const r = analyzeComfort({
      ...base,
      mode: 'heat',
      action: 'heating',
      tempNow: 14,
      rhNow: 40,
      comfortMin: 20,
      comfortMax: 26,
      tempSeries: tempExp(24, 14, 0.06), // warming toward 24
      rhSeries: rhFlat(40),
    });
    expect(r.visible).to.equal(true);
    expect(r.comfortable).to.equal(false);
    expect(r.line).to.match(/until room feels comfortable$/);
  });

  it('comfortable + target ETA, joined with a comma', () => {
    const r = analyzeComfort({
      ...base,
      tempNow: 25,
      rhNow: 45,
      target: 21,
      showTargetEta: true,
      tempSeries: tempExp(20, 25, 0.05), // heading to 20, passes 21
      rhSeries: rhFlat(45),
    });
    expect(r.comfortable).to.equal(true);
    expect(r.line).to.match(/^Room feels comfortable, .*until target temperature is reached$/);
  });

  it("comfortable + target unreachable → won't go below the plateau", () => {
    const r = analyzeComfort({
      ...base,
      tempNow: 25,
      rhNow: 45,
      target: 21,
      showTargetEta: true,
      tempSeries: tempExp(24, 28, 0.08), // plateaus at ~24, never reaches 21
      rhSeries: rhFlat(45),
    });
    expect(r.comfortable).to.equal(true);
    expect(r.line).to.match(/^Room feels comfortable, temperature won't go below 2[34]°C$/);
  });

  it("heating + target unreachable → won't go above the plateau", () => {
    // Comfortable now (apparent temp in band) but the heater plateaus at ~22°C
    // and the target setpoint is 25°C → "won't go above 22°C".
    const r = analyzeComfort({
      ...base,
      mode: 'heat',
      action: 'heating',
      tempNow: 21,
      rhNow: 40,
      target: 25,
      showTargetEta: true,
      tempSeries: tempExp(22, 20, 0.08), // plateaus at ~22, never reaches 25
      rhSeries: rhFlat(40),
    });
    expect(r.comfortable).to.equal(true);
    expect(r.line).to.match(/^Room feels comfortable, temperature won't go above 2[12]°C$/);
  });

  it('omits the target clause when its data is insufficient (row still shown)', () => {
    const r = analyzeComfort({
      ...base,
      tempNow: 22,
      rhNow: 50,
      target: 19,
      showTargetEta: true,
      tempSeries: [], // no history → no target forecast
      rhSeries: [],
    });
    expect(r.line).to.equal('Room feels comfortable');
  });

  it('omits the target clause when already at the target', () => {
    const r = analyzeComfort({
      ...base,
      tempNow: 21.1,
      rhNow: 50,
      target: 21,
      showTargetEta: true,
      tempSeries: tempExp(20, 25, 0.05),
      rhSeries: rhFlat(50),
    });
    expect(r.line).to.equal('Room feels comfortable');
  });

  it('omits the target clause when moving away from the target', () => {
    const r = analyzeComfort({
      ...base,
      tempNow: 25,
      rhNow: 45,
      target: 30, // want warmer, but the room is cooling toward 24
      showTargetEta: true,
      tempSeries: tempExp(24, 28, 0.08),
      rhSeries: rhFlat(45),
    });
    expect(r.line).to.equal('Room feels comfortable');
  });

  it('uncomfortable + target ETA joined with a period', () => {
    const r = analyzeComfort({
      ...base,
      tempNow: 33,
      rhNow: 50,
      target: 25,
      showTargetEta: true,
      tempSeries: tempExp(24, 33, 0.06),
      rhSeries: rhFlat(50),
    });
    expect(r.line).to.match(
      /until room feels comfortable\. .*until target temperature is reached$/
    );
  });

  describe('pickSide via mode/action', () => {
    it('heat_cool picks the breached bound', () => {
      const hot = analyzeComfort({
        ...base,
        mode: 'heat_cool',
        action: 'idle',
        tempNow: 33,
        rhNow: 50,
        tempSeries: tempExp(24, 33, 0.06),
        rhSeries: rhFlat(50),
      });
      expect(hot.comfortable).to.equal(false);
      expect(hot.visible).to.equal(true);
    });

    it('a running mode whose bound is not breached reads as comfortable', () => {
      // Cooling but the room is on the cold side → cooling can't fix it → comfortable.
      const r = analyzeComfort({ ...base, mode: 'cool', action: 'cooling', tempNow: 15, rhNow: 40 });
      expect(r.comfortable).to.equal(true);
    });
  });
});
