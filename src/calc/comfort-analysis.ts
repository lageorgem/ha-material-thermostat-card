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
 * coarse sensor). Until then it shows the plain verdict. While the room is
 * comfortable it switches to the time until the target setpoint is reached
 * (Nest-style: "15m until cooled to 24°C").
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
}

const HIDDEN: ComfortResult = { visible: false, comfortable: false };

/** Below this gap the target is treated as already reached (no ETA clause). */
const TARGET_REACHED_EPS = 0.25;

/**
 * The Nest-style time-to-target line shown while the room is comfortable:
 * "15m until cooled to 24°C" / "50m until heated to 26°C", or "won't go
 * below/above N°" when the room plateaus short of the setpoint. Undefined when
 * disabled, already at the target, or there's no confident temperature fit.
 * Uses the accurate fit only (no rough fallback) — an aggressive setpoint
 * shouldn't be claimed reachable on a straight-line guess.
 * @param i the comfort input
 */
function targetEta(i: ComfortInput): string | undefined {
  if (!i.showTargetEta || i.target == null) return undefined;
  if (Math.abs(i.tempNow - i.target) < TARGET_REACHED_EPS) return undefined;

  const fit = newtonFit(i.tempSeries);
  if (!fit) return undefined;

  const cooling = i.target < i.tempNow;
  const eta = etaToThreshold(i.tempNow, i.target, fit);
  if (eta != null) {
    return `${formatDuration(eta)} until ${cooling ? 'cooled' : 'heated'} to ${i.target}${i.unit}`;
  }

  // Unreachable: report the plateau, but only when actually moving toward it.
  const towardTarget = (i.target - i.tempNow) * (fit.asymptote - i.tempNow) > 0;
  if (!towardTarget) return undefined;
  const plateau = Math.round(fit.asymptote);
  return `won't go ${cooling ? 'below' : 'above'} ${plateau}${i.unit}`;
}

/**
 * Analyze comfort + ETAs into a renderable status line. Always returns a visible
 * verdict for finite readings — "Room feels comfortable/warm/cool/humid".
 *
 * - **Uncomfortable + running:** once the history covers `MIN_SPAN_MIN` it shows
 *   "{time} until comfortable" — the accurate integral fit, or a rough linear
 *   extrapolation of the real trend when the fit hasn't converged yet (turn-on
 *   transient / coarse sensor). Below that coverage it shows the plain verdict.
 * - **Comfortable + running:** switches to the time until the target setpoint is
 *   reached ("15m until cooled to 24°C"), when enabled and forecastable.
 * - **Not running (climate off):** the plain verdict, no forecast.
 *
 * Only non-numeric readings hide the row here; the sensors-unset /
 * climate-unavailable cases are gated by the caller.
 * @param i the comfort input
 */
export function analyzeComfort(i: ComfortInput): ComfortResult {
  if (!isFinite(i.tempNow) || !isFinite(i.rhNow)) return HIDDEN;

  const pmvNow = pmv(i.tempNow, i.rhNow, { clo: cloForTemp(i.tempNow) });
  const wNow = humidityRatio(i.tempNow, i.rhNow);

  const tooWarm = pmvNow > PMV_COMFORT_LIMIT;
  const tooCold = pmvNow < -PMV_COMFORT_LIMIT;
  const tooHumid = wNow > HUMIDITY_RATIO_MAX;

  // Comfortable: show the time until the target setpoint is reached, else the
  // plain verdict. (The target ETA only makes sense while actively running.)
  if (!tooWarm && !tooCold && !tooHumid) {
    const target = i.running ? targetEta(i) : undefined;
    return {
      visible: true,
      comfortable: true,
      line: target ?? 'Room feels comfortable',
      status: 'comfortable',
    };
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

  // Not running, or not enough time coverage yet: just the verdict.
  const span = series.length ? series[series.length - 1].t - series[0].t : 0;
  if (!i.running || series.length < 2 || span < MIN_SPAN_MIN) {
    return { visible: true, comfortable: false, line: verdict, status };
  }

  // Enough coverage: the accurate integral fit if it converges, else a rough
  // linear extrapolation of the (real) trend.
  const fit = newtonFit(series);
  const eta = (fit ? etaToThreshold(metricNow, threshold, fit) : null) ?? linearEta(series, threshold);
  const line = eta != null ? `${formatDuration(eta)} until comfortable` : verdict;
  return { visible: true, comfortable: false, line, status };
}
