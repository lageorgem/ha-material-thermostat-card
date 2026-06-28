import { expect } from '@open-wc/testing';
import {
  heatIndexC,
  feelsLikeC,
  svpPa,
  humidityRatio,
  HUMIDITY_RATIO_MAX,
} from '../../src/calc/comfort-metrics';
import { pmv, cloForTemp, PMV_COMFORT_LIMIT } from '../../src/calc/pmv';
import {
  linregress,
  newtonFit,
  etaToThreshold,
  reachable,
  type Sample,
} from '../../src/calc/forecast';
import { formatDuration } from '../../src/calc/duration';
import { fetchHistory, numericSeries, mergeOnLeft, OFF_STATES } from '../../src/calc/history';
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

  it('feelsLikeC is the heat index', () => {
    expect(feelsLikeC(31, 65)).to.equal(heatIndexC(31, 65));
  });

  describe('svpPa / humidityRatio', () => {
    it('saturation vapour pressure matches known values', () => {
      expect(svpPa(22)).to.be.closeTo(2645, 30); // ≈ 2.64 kPa at 22°C
      expect(svpPa(0)).to.be.closeTo(611, 30); // ≈ 0.61 kPa at 0°C
    });

    it('humidity ratio rises with humidity and crosses the ASHRAE cap', () => {
      expect(humidityRatio(24, 30)).to.be.lessThan(humidityRatio(24, 80));
      // 26°C / 60% ≈ 0.0126 kg/kg → above the 0.012 comfort cap.
      expect(humidityRatio(26, 60)).to.be.greaterThan(HUMIDITY_RATIO_MAX);
      // 22°C / 40% is comfortably dry.
      expect(humidityRatio(22, 40)).to.be.lessThan(HUMIDITY_RATIO_MAX);
    });
  });
});

describe('calc/pmv', () => {
  // ISO 7730:2005 Annex D validation table (met = 1.2). Accuracy is ±0.1 PMV.
  const ROWS = [
    { ta: 22.0, tr: 22.0, vel: 0.1, rh: 60, clo: 0.5, pmv: -0.75 },
    { ta: 27.0, tr: 27.0, vel: 0.1, rh: 60, clo: 0.5, pmv: 0.77 },
    { ta: 27.0, tr: 27.0, vel: 0.3, rh: 60, clo: 0.5, pmv: 0.44 },
    { ta: 23.5, tr: 25.5, vel: 0.1, rh: 60, clo: 0.5, pmv: -0.01 },
    { ta: 23.5, tr: 25.5, vel: 0.3, rh: 60, clo: 0.5, pmv: -0.55 },
    { ta: 19.0, tr: 19.0, vel: 0.1, rh: 40, clo: 1.0, pmv: -0.6 },
    { ta: 23.5, tr: 23.5, vel: 0.1, rh: 40, clo: 1.0, pmv: 0.5 },
    { ta: 23.5, tr: 23.5, vel: 0.3, rh: 40, clo: 1.0, pmv: 0.12 },
    { ta: 23.0, tr: 21.0, vel: 0.1, rh: 40, clo: 1.0, pmv: 0.05 },
    { ta: 23.0, tr: 21.0, vel: 0.3, rh: 40, clo: 1.0, pmv: -0.16 },
  ];

  // Our port is the verbatim ISO 7730 Annex D algorithm. The standard states the
  // table's own accuracy is ~0.1 PMV; the reference values here are transcribed
  // from the standard, so we assert ±0.15 (in practice most match within ~0.05).
  ROWS.forEach((r, idx) => {
    it(`matches ISO 7730 Annex D row ${idx + 1} (PMV ${r.pmv})`, () => {
      const got = pmv(r.ta, r.rh, { tr: r.tr, vel: r.vel, met: 1.2, clo: r.clo });
      expect(got).to.be.closeTo(r.pmv, 0.15);
    });
  });

  it('neutral temperature (PMV≈0) lands where ASHRAE 55 expects per clothing', () => {
    // Summer dress (0.5 clo) ⇒ neutral ~24.5–25.5°C; winter dress (1.0 clo) ⇒ ~22°C.
    expect(pmv(25, 50, { clo: 0.5, met: 1.1 })).to.be.closeTo(0, 0.5);
    expect(pmv(22, 50, { clo: 1.0, met: 1.1 })).to.be.closeTo(0, 0.5);
  });

  it('is monotonically increasing in temperature', () => {
    const cold = pmv(18, 50, { clo: 0.6 });
    const warm = pmv(26, 50, { clo: 0.6 });
    expect(cold).to.be.lessThan(-PMV_COMFORT_LIMIT);
    expect(warm).to.be.greaterThan(cold);
  });

  it('defaults tr to the air temperature and applies default met/vel/clo', () => {
    expect(pmv(24, 50)).to.equal(pmv(24, 50, { tr: 24 }));
  });

  describe('cloForTemp', () => {
    it('infers dynamic clothing from the room temperature, clamped to 0.5–1.0', () => {
      expect(cloForTemp(15)).to.equal(1.0); // cold → winter dress (capped)
      expect(cloForTemp(20)).to.equal(1.0);
      expect(cloForTemp(21)).to.be.closeTo(0.95, 1e-9);
      expect(cloForTemp(24)).to.be.closeTo(0.725, 1e-9);
      expect(cloForTemp(27)).to.equal(0.5); // warm → summer dress (capped)
      expect(cloForTemp(32)).to.equal(0.5);
    });

    it('decreases monotonically as the room warms (mode-independent)', () => {
      for (let t = 16; t < 30; t++) {
        expect(cloForTemp(t + 1)).to.be.at.most(cloForTemp(t));
      }
    });
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

    it('fits coarse, quantized step data (the integral method, not differencing)', () => {
      // The real recorder records sparse 0.2–0.3° steps; differencing those is
      // pure noise. Reconstruct a cooling curve like that and confirm it fits.
      const stepped: Sample[] = [
        { t: 0, v: 28.8 },
        { t: 5, v: 28.5 },
        { t: 9, v: 28.2 },
        { t: 16, v: 27.8 },
        { t: 21, v: 27.55 },
        { t: 28, v: 27.25 },
        { t: 37, v: 26.9 },
      ];
      const fit = newtonFit(stepped);
      expect(fit).to.not.equal(null);
      expect(fit!.k).to.be.greaterThan(0);
      expect(fit!.asymptote).to.be.lessThan(27); // still cooling past the data
      expect(fit!.r2).to.be.greaterThan(0.9);
    });

    it('fits a confident short span (no fixed 10-minute floor)', () => {
      // 4 clean samples over 6 minutes — appears well under 10 min when the data
      // is trustworthy (MIN_SPAN_MIN is a small floor, not a delay).
      const fit = newtonFit(genExp(24, 30, 0.1, 4, 2));
      expect(fit).to.not.equal(null);
      expect(fit!.k).to.be.greaterThan(0);
    });

    it('returns null with too few samples', () => {
      // 3 samples spanning 12 min: enough span, but below MIN_SAMPLES (4).
      expect(newtonFit(genExp(24, 30, 0.1, 3, 6))).to.equal(null);
    });

    it('returns null when the time span is too short', () => {
      // 6 samples but only 2.5 minutes of span (< MIN_SPAN_MIN).
      expect(newtonFit(genExp(24, 30, 0.1, 6, 0.5))).to.equal(null);
    });

    it('returns null for a flat / non-converging series (k ≤ 0)', () => {
      const linear: Sample[] = [];
      for (let t = 0; t <= 20; t++) linear.push({ t, v: 20 + t }); // steady rise, no plateau
      expect(newtonFit(linear)).to.equal(null);
    });

    it('returns null for noisy data with a poor fit', () => {
      const noisy: Sample[] = [];
      for (let t = 0; t <= 20; t++) noisy.push({ t, v: t % 2 === 0 ? 20 : 25 });
      expect(newtonFit(noisy)).to.equal(null);
    });

    it('tolerates duplicate timestamps without crashing', () => {
      const dup: Sample[] = [
        { t: 0, v: 30 },
        { t: 0, v: 30 },
        { t: 10, v: 27 },
        { t: 20, v: 25.5 },
        { t: 30, v: 24.8 },
      ];
      // Should not throw; returns either a converging fit or null.
      const fit = newtonFit(dup);
      if (fit) expect(fit.k).to.be.greaterThan(0);
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

  it('OFF_STATES covers the not-running states', () => {
    ['off', 'unavailable', 'unknown', ''].forEach((s) => expect(OFF_STATES.has(s)).to.equal(true));
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
  /** Constant-value series helper at the given times. */
  function flat(v: number, n = 16, step = 2): Sample[] {
    return Array.from({ length: n }, (_, i) => ({ t: i * step, v }));
  }
  /** Exponential-approach series. */
  function exp(A: number, v0: number, k: number, n = 16, step = 2): Sample[] {
    return genExp(A, v0, k, n, step);
  }

  const base: ComfortInput = {
    tempNow: 25,
    rhNow: 50,
    tempSeries: [],
    rhSeries: [],
    target: null,
    showTargetEta: false,
    unit: '°C',
  };

  it('hides when readings are non-numeric', () => {
    expect(analyzeComfort({ ...base, tempNow: NaN }).visible).to.equal(false);
    expect(analyzeComfort({ ...base, rhNow: NaN }).visible).to.equal(false);
  });

  it('reports comfortable immediately, no history needed (~25°C)', () => {
    const r = analyzeComfort({ ...base, tempNow: 25, rhNow: 50 });
    expect(r).to.deep.include({
      visible: true,
      comfortable: true,
      line: 'Room feels comfortable',
      status: 'comfortable',
    });
  });

  it('gives the same verdict regardless of heating vs cooling (clothing from temp)', () => {
    // 26.9°C reads comfortable whether the thermostat is heating or cooling —
    // the verdict depends only on the readings, not the mode (the old mode-based
    // clothing flipped this to "warm" on heat).
    const r = analyzeComfort({ ...base, tempNow: 26.9, rhNow: 47 });
    expect(r.comfortable).to.equal(true);
  });

  it('flags a cold room as not comfortable (PMV < −0.5)', () => {
    // 19°C ⇒ winter dress (1.0 clo) but still too cold per PMV.
    expect(analyzeComfort({ ...base, tempNow: 19, rhNow: 45 }).comfortable).to.equal(false);
  });

  it('shows a static verdict when uncomfortable but there is no history to forecast', () => {
    const warm = analyzeComfort({ ...base, tempNow: 33, rhNow: 50 });
    expect(warm).to.deep.include({ visible: true, comfortable: false, line: 'Room feels warm' });
    expect(warm.status).to.equal('warm');

    const cool = analyzeComfort({ ...base, tempNow: 18, rhNow: 40 });
    expect(cool).to.deep.include({ visible: true, comfortable: false, line: 'Room feels cool' });
    expect(cool.status).to.equal('cool');

    // Comfortable temperature but muggy (humidity ratio over the cap).
    const humid = analyzeComfort({ ...base, tempNow: 24, rhNow: 85 });
    expect(humid).to.deep.include({ visible: true, comfortable: false, line: 'Room feels humid' });
    expect(humid.status).to.equal('humid');
  });

  it('cooling: forecasts time until comfortable (PMV → +0.5)', () => {
    const r = analyzeComfort({
      ...base,
      tempNow: 33,
      rhNow: 50,
      tempSeries: exp(24, 33, 0.06),
      rhSeries: flat(50),
    });
    expect(r.visible).to.equal(true);
    expect(r.comfortable).to.equal(false);
    expect(r.status).to.equal('warm');
    expect(r.line).to.match(/until room feels comfortable$/);
  });

  it('heating: forecasts upward toward comfort (PMV → −0.5)', () => {
    const r = analyzeComfort({
      ...base,
      tempNow: 14,
      rhNow: 40,
      tempSeries: exp(23, 14, 0.06), // warming toward 23
      rhSeries: flat(40),
    });
    expect(r.visible).to.equal(true);
    expect(r.comfortable).to.equal(false);
    expect(r.status).to.equal('cool');
    expect(r.line).to.match(/until room feels comfortable$/);
  });

  it('too humid (PMV ok) forecasts the humidity ratio toward the cap', () => {
    // 23°C is comfortable by PMV, but 80% → humidity ratio is above 0.012.
    const r = analyzeComfort({
      ...base,
      tempNow: 23,
      rhNow: 80,
      tempSeries: flat(23),
      rhSeries: exp(50, 85, 0.06), // drying out toward 50%
    });
    expect(r.comfortable).to.equal(false);
    expect(r.status).to.equal('humid');
    expect(r.visible).to.equal(true);
    expect(r.line).to.match(/until room feels comfortable$/);
  });

  it('comfortable + target ETA, joined with a comma', () => {
    const r = analyzeComfort({
      ...base,
      tempNow: 25,
      rhNow: 45,
      target: 21,
      showTargetEta: true,
      tempSeries: exp(20, 25, 0.05), // heading to 20, passes 21
      rhSeries: flat(45),
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
      tempSeries: exp(24, 28, 0.08), // plateaus at ~24, never reaches 21
      rhSeries: flat(45),
    });
    expect(r.comfortable).to.equal(true);
    expect(r.line).to.match(/^Room feels comfortable, temperature won't go below 2[34]°C$/);
  });

  it("comfortable + target unreachable → won't go above the plateau", () => {
    // Comfortable now (22.5°C, below the plateau) but the heater plateaus at
    // ~23°C and the target setpoint is 25°C → "won't go above 23°C".
    const r = analyzeComfort({
      ...base,
      tempNow: 22.5,
      rhNow: 45,
      target: 25,
      showTargetEta: true,
      tempSeries: exp(23, 21, 0.08), // warms toward ~23, never reaches 25
      rhSeries: flat(45),
    });
    expect(r.comfortable).to.equal(true);
    expect(r.line).to.match(/^Room feels comfortable, temperature won't go above 2[234]°C$/);
  });

  it('omits the target clause when its data is insufficient (row still shown)', () => {
    const r = analyzeComfort({
      ...base,
      tempNow: 25,
      rhNow: 45,
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
      tempNow: 25.1,
      rhNow: 45,
      target: 25,
      showTargetEta: true,
      tempSeries: exp(24, 28, 0.05),
      rhSeries: flat(45),
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
      tempSeries: exp(24, 28, 0.08),
      rhSeries: flat(45),
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
      tempSeries: exp(24, 33, 0.06),
      rhSeries: flat(50),
    });
    expect(r.line).to.match(/until room feels comfortable\. .*until target temperature is reached$/);
  });

  it('mid-range temperature reads comfortable', () => {
    const r = analyzeComfort({ ...base, tempNow: 23, rhNow: 45 });
    expect(r.comfortable).to.equal(true);
  });
});
