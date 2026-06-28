/**
 * Pure comfort analysis: turns parsed sensor readings + recent history into the
 * status line shown by the comfort feature. Kept free of Lit/hass so it can be
 * unit-tested directly.
 *
 * Comfort is judged scientifically with Fanger's PMV model (ASHRAE 55 / ISO
 * 7730): comfortable when −0.5 < PMV < +0.5, with an additional absolute-humidity
 * cap (ASHRAE's 0.012 humidity ratio). Clothing is inferred from the room
 * temperature ({@link cloForTemp}), not the HVAC mode, so the verdict is the same
 * whether the thermostat is set to heat or cool. PMV is one scalar covering hot
 * *and* cold, so the "time until comfortable" forecast fits the PMV series toward
 * the ±0.5 boundary (or the humidity-ratio series toward the cap when only
 * humidity is out of range).
 *
 * Forecast gating is by **time coverage**, not sample count: once the series
 * spans `MIN_SPAN_MIN` it shows an ETA — the accurate integral fit when it
 * converges, otherwise a rough linear extrapolation of the real trend (early /
 * coarse sensor). Until the span is covered it reports "calculating…".
 */
import { humidityRatio, HUMIDITY_RATIO_MAX } from './comfort-metrics';
import { pmv, cloForTemp, PMV_COMFORT_LIMIT } from './pmv';
import { newtonFit, etaToThreshold, linearEta, MIN_SPAN_MIN } from './forecast';
import { formatDuration } from './duration';
import { mergeOnLeft } from './history';

/** A numeric time series sample (minutes / value). */
export interface TS {
  t: number;
  v: number;
}

/** The room's current comfort state. */
export type ComfortStatus = 'comfortable' | 'warm' | 'cool' | 'humid';

/** Inputs to {@link analyzeComfort}. */
export interface ComfortInput {
  /** Current temperature reading (°C). */
  tempNow: number;
  /** Current humidity reading (%). */
  rhNow: number;
  /** Temperature history since the climate turned on (minutes / °C). */
  tempSeries: TS[];
  /** Humidity history since the climate turned on (minutes / %). */
  rhSeries: TS[];
  /** Resolved target temperature (°C), or null when none / already in band. */
  target: number | null;
  /** Whether to append the target-temperature ETA clause. */
  showTargetEta: boolean;
  /** Whether the climate is actively running (forecast only makes sense then). */
  running: boolean;
  /** Temperature unit symbol for messages, e.g. '°C'. */
  unit: string;
}

/** Result of {@link analyzeComfort}. */
export interface ComfortResult {
  /** Whether the status row should be shown at all. */
  visible: boolean;
  /** Whether the room currently feels comfortable. */
  comfortable: boolean;
  /** The full status line (present iff `visible`). */
  line?: string;
  /** The comfort state, which drives the row's icon + colour (iff `visible`). */
  status?: ComfortStatus;
  /** True while gathering data for the "time until comfortable" forecast. */
  calculating?: boolean;
}

const HIDDEN: ComfortResult = { visible: false, comfortable: false };

/** Below this gap the target is treated as already reached (no ETA clause). */
const TARGET_REACHED_EPS = 0.25;

/**
 * Build the optional "…until target temperature is reached" / "won't go
 * below/above N°" clause, or undefined when the data is insufficient.
 * @param i the comfort input
 */
function targetClause(i: ComfortInput): string | undefined {
  if (!i.showTargetEta || i.target == null) return undefined;
  if (Math.abs(i.tempNow - i.target) < TARGET_REACHED_EPS) return undefined;

  const fit = newtonFit(i.tempSeries);
  if (!fit) return undefined;

  const eta = etaToThreshold(i.tempNow, i.target, fit);
  if (eta != null) return `${formatDuration(eta)} until target temperature is reached`;

  // Unreachable: report the plateau, but only when the room is actually moving
  // toward (not away from) the target.
  const towardTarget = (i.target - i.tempNow) * (fit.asymptote - i.tempNow) > 0;
  if (!towardTarget) return undefined;
  const plateau = Math.round(fit.asymptote);
  const verb = i.target < i.tempNow ? "won't go below" : "won't go above";
  return `temperature ${verb} ${plateau}${i.unit}`;
}

/**
 * Analyze comfort + ETAs into a renderable status line. Always returns a visible
 * verdict for finite readings — "Room feels comfortable/warm/cool/humid". When
 * the climate is running and the room is uncomfortable it forecasts the time
 * until comfortable, gating on **time coverage** (`MIN_SPAN_MIN`): below that it
 * reports "calculating…"; above it shows the accurate integral fit, or a rough
 * linear extrapolation of the real trend when the fit hasn't converged yet (e.g.
 * the turn-on transient or a coarse sensor). Only non-numeric readings hide the
 * row here; the sensors-unset / climate-unavailable cases are gated by the caller.
 * @param i the comfort input
 */
export function analyzeComfort(i: ComfortInput): ComfortResult {
  if (!isFinite(i.tempNow) || !isFinite(i.rhNow)) return HIDDEN;

  const pmvNow = pmv(i.tempNow, i.rhNow, { clo: cloForTemp(i.tempNow) });
  const wNow = humidityRatio(i.tempNow, i.rhNow);
  const target = targetClause(i);

  const tooWarm = pmvNow > PMV_COMFORT_LIMIT;
  const tooCold = pmvNow < -PMV_COMFORT_LIMIT;
  const tooHumid = wNow > HUMIDITY_RATIO_MAX;

  // Comfortable: a direct reading, shown immediately (target clause optional).
  if (!tooWarm && !tooCold && !tooHumid) {
    const line = target ? `Room feels comfortable, ${target}` : 'Room feels comfortable';
    return { visible: true, comfortable: true, line, status: 'comfortable' };
  }

  // Uncomfortable: pick the binding axis. Warmth / cold are temperature-driven
  // (PMV series, each point's clothing from its own temperature); a humidity-only
  // excess forecasts the humidity ratio toward the cap.
  const merged = mergeOnLeft(i.tempSeries, i.rhSeries);
  let series: TS[];
  let metricNow: number;
  let threshold: number;
  let status: ComfortStatus;
  if (tooWarm) {
    series = merged.map((p) => ({ t: p.t, v: pmv(p.l, p.r, { clo: cloForTemp(p.l) }) }));
    metricNow = pmvNow;
    threshold = PMV_COMFORT_LIMIT;
    status = 'warm';
  } else if (tooCold) {
    series = merged.map((p) => ({ t: p.t, v: pmv(p.l, p.r, { clo: cloForTemp(p.l) }) }));
    metricNow = pmvNow;
    threshold = -PMV_COMFORT_LIMIT;
    status = 'cool';
  } else {
    series = merged.map((p) => ({ t: p.t, v: humidityRatio(p.l, p.r) }));
    metricNow = wNow;
    threshold = HUMIDITY_RATIO_MAX;
    status = 'humid';
  }

  const verdict = `Room feels ${status}`;
  const withTarget = (base: string): string => (target ? `${base}. ${target}` : base);

  // Not running (e.g. climate off): a bare verdict, no forecast.
  if (!i.running) return { visible: true, comfortable: false, line: withTarget(verdict), status };

  // Running: gate the forecast on time coverage, not sample count.
  const span = series.length ? series[series.length - 1].t - series[0].t : 0;
  if (series.length < 2 || span < MIN_SPAN_MIN) {
    return { visible: true, comfortable: false, line: `${verdict}, calculating…`, status, calculating: true };
  }

  // Enough coverage: the accurate integral fit if it converges, else a rough
  // linear extrapolation of the (real) trend.
  const fit = newtonFit(series);
  const eta = (fit ? etaToThreshold(metricNow, threshold, fit) : null) ?? linearEta(series, threshold);
  if (eta != null) {
    return {
      visible: true,
      comfortable: false,
      line: withTarget(`${formatDuration(eta)} until room feels comfortable`),
      status,
    };
  }

  // Enough data, but the room isn't heading toward comfort → just the verdict.
  return { visible: true, comfortable: false, line: withTarget(verdict), status };
}
