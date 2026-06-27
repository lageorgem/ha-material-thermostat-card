/**
 * Pure comfort analysis: turns parsed sensor readings + recent history into the
 * status line shown by the comfort feature. Kept free of Lit/hass so it can be
 * unit‑tested directly.
 *
 * Comfort metric depends on what the climate is doing: cooling (AC) uses the
 * heat index (upper bound), heating uses the apparent temperature (lower bound),
 * since the heat index is not meaningful in cool conditions.
 */
import { heatIndexC, apparentTempC } from './comfort-metrics';
import { newtonFit, etaToThreshold } from './forecast';
import { formatDuration } from './duration';
import { mergeOnLeft } from './history';

/** A numeric time series sample (minutes / value). */
export interface TS {
  t: number;
  v: number;
}

/** Inputs to {@link analyzeComfort}. */
export interface ComfortInput {
  /** Climate hvac mode (entity state), e.g. 'cool' | 'heat' | 'heat_cool'. */
  mode: string;
  /** Climate hvac_action, e.g. 'cooling' | 'heating' | 'idle'. */
  action?: string;
  /** Current temperature reading (°C). */
  tempNow: number;
  /** Current humidity reading (%). */
  rhNow: number;
  /** Temperature history since the climate turned on (minutes / °C). */
  tempSeries: TS[];
  /** Humidity history since the climate turned on (minutes / %). */
  rhSeries: TS[];
  /** Comfortable heat‑index/apparent‑temp band (°C). */
  comfortMin: number;
  comfortMax: number;
  /** Resolved target temperature (°C), or null when none / already in band. */
  target: number | null;
  /** Whether to append the target‑temperature ETA clause. */
  showTargetEta: boolean;
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
}

const HIDDEN: ComfortResult = { visible: false, comfortable: false };

/** Below this gap the target is treated as already reached (no ETA clause). */
const TARGET_REACHED_EPS = 0.25;

/**
 * Decide which side of comfort is violated, if any, honoring the active mode.
 * @param i the comfort input
 * @param hi the current heat index
 * @param at the current apparent temperature
 */
function pickSide(i: ComfortInput, hi: number, at: number): 'hot' | 'cold' | null {
  const tooHot = hi > i.comfortMax;
  const tooCold = at < i.comfortMin;
  const heating = i.action === 'heating' || (!i.action && i.mode === 'heat');
  const cooling =
    i.action === 'cooling' ||
    (!i.action && (i.mode === 'cool' || i.mode === 'dry' || i.mode === 'fan_only'));
  if (heating) return tooCold ? 'cold' : null;
  if (cooling) return tooHot ? 'hot' : null;
  // heat_cool / auto (or no decisive mode): whichever bound is breached.
  if (tooHot) return 'hot';
  if (tooCold) return 'cold';
  return null;
}

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
 * Analyze comfort + ETAs into a renderable status line. Returns `{visible:false}`
 * when nothing trustworthy can be shown (uncomfortable but not enough history to
 * forecast when it will be comfortable).
 * @param i the comfort input
 */
export function analyzeComfort(i: ComfortInput): ComfortResult {
  if (!isFinite(i.tempNow) || !isFinite(i.rhNow)) return HIDDEN;

  const hi = heatIndexC(i.tempNow, i.rhNow);
  const at = apparentTempC(i.tempNow, i.rhNow);
  const side = pickSide(i, hi, at);
  const target = targetClause(i);

  // Comfortable: a direct reading, shown immediately (target clause optional).
  if (side === null) {
    const line = target ? `Room feels comfortable, ${target}` : 'Room feels comfortable';
    return { visible: true, comfortable: true, line };
  }

  // Uncomfortable: needs a confident forecast of when it'll be comfortable.
  const metricFn = side === 'hot' ? heatIndexC : apparentTempC;
  const threshold = side === 'hot' ? i.comfortMax : i.comfortMin;
  const metricNow = side === 'hot' ? hi : at;
  const series = mergeOnLeft(i.tempSeries, i.rhSeries).map((p) => ({
    t: p.t,
    v: metricFn(p.l, p.r),
  }));

  const fit = newtonFit(series);
  if (!fit) return HIDDEN;
  const eta = etaToThreshold(metricNow, threshold, fit);
  if (eta == null) return HIDDEN;

  const comfort = `${formatDuration(eta)} until room feels comfortable`;
  const line = target ? `${comfort}. ${target}` : comfort;
  return { visible: true, comfortable: false, line };
}
