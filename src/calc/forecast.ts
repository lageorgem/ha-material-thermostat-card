/**
 * Statistical forecasting for the comfort feature.
 *
 * A heating/cooling room approaches a steady temperature roughly per Newton's
 * law of cooling: `dv/dt = -k·(v - A)`, where `A` is the plateau the room is
 * heading toward and `k > 0` the rate constant. Both are recovered with a single
 * linear regression of the (value, rate‑of‑change) cloud — no nonlinear solver —
 * which also yields an honest "won't reach, plateaus at A" result and ETAs that
 * correctly slow as the room nears its plateau.
 */

/** A time/value sample. `t` is in minutes (monotonic, any origin). */
export interface Sample {
  t: number;
  v: number;
}

/** Least‑squares line plus goodness of fit. */
export interface LinFit {
  slope: number;
  intercept: number;
  n: number;
  r2: number;
}

/** A converged first‑order (Newton's‑law) fit. */
export interface NewtonFit {
  /** Rate constant (per minute), always > 0. */
  k: number;
  /** The steady value the series is heading toward. */
  asymptote: number;
  /** Goodness of fit of the rate‑vs‑value regression, 0–1. */
  r2: number;
}

/** Minimum samples required before any forecast is attempted. */
export const MIN_SAMPLES = 5;
/** Minimum time span (minutes) the samples must cover. */
export const MIN_SPAN_MIN = 10;
/** Minimum rate‑vs‑value fit quality to trust a Newton fit. */
export const MIN_FIT_R2 = 0.2;

/**
 * Ordinary least‑squares fit of `v = slope·t + intercept`.
 * @param pts the samples (need ≥ 2 with distinct `t`)
 */
export function linregress(pts: Sample[]): LinFit | null {
  const n = pts.length;
  if (n < 2) return null;
  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  for (const p of pts) {
    sx += p.t;
    sy += p.v;
    sxx += p.t * p.t;
    sxy += p.t * p.v;
    syy += p.v * p.v;
  }
  const dxx = n * sxx - sx * sx;
  if (dxx === 0) return null;
  const cov = n * sxy - sx * sy;
  const slope = cov / dxx;
  const intercept = (sy - slope * sx) / n;
  const dyy = n * syy - sy * sy;
  const r2 = dyy === 0 ? 1 : (cov * cov) / (dxx * dyy);
  return { slope, intercept, n, r2 };
}

/** Smooth a series with a centered moving average of the given odd window. */
function movingAverage(sorted: Sample[], window: number): Sample[] {
  const half = Math.floor(window / 2);
  const out: Sample[] = [];
  for (let i = 0; i < sorted.length; i++) {
    let sum = 0;
    let count = 0;
    for (let j = Math.max(0, i - half); j <= Math.min(sorted.length - 1, i + half); j++) {
      sum += sorted[j].v;
      count++;
    }
    out.push({ t: sorted[i].t, v: sum / count });
  }
  return out;
}

/**
 * Fit Newton's law of cooling/heating to a series and recover its plateau and
 * rate constant. Returns `null` when there is not enough data, the data is too
 * noisy, or the series is not converging (k ≤ 0). Callers should treat `null` as
 * "not enough confident data" — i.e. show nothing rather than a guess.
 * @param samples the time/value series (minutes / value)
 */
export function newtonFit(samples: Sample[]): NewtonFit | null {
  if (samples.length < MIN_SAMPLES) return null;
  const sorted = [...samples].sort((a, b) => a.t - b.t);
  const span = sorted[sorted.length - 1].t - sorted[0].t;
  if (span < MIN_SPAN_MIN) return null;

  // Light smoothing tames sensor quantization before differencing.
  const smooth = movingAverage(sorted, 3);

  // Build the (value, rate‑of‑change) cloud from consecutive samples.
  const cloud: Sample[] = [];
  for (let i = 1; i < smooth.length; i++) {
    const dt = smooth[i].t - smooth[i - 1].t;
    if (dt <= 0) continue;
    cloud.push({
      t: (smooth[i].v + smooth[i - 1].v) / 2, // value (midpoint)
      v: (smooth[i].v - smooth[i - 1].v) / dt, // dv/dt
    });
  }
  if (cloud.length < 3) return null;

  // dv/dt = a·value + b  ⇒  k = -a,  A = b / k.
  const fit = linregress(cloud);
  if (!fit || fit.r2 < MIN_FIT_R2) return null;
  const k = -fit.slope;
  if (!(k > 1e-6)) return null; // flat or diverging → no usable forecast
  const asymptote = fit.intercept / k;
  return { k, asymptote, r2: fit.r2 };
}

/**
 * Whether a series currently at `v0` will pass through `target` on its way to the
 * fitted plateau `asymptote` (strictly between the two ⇒ reached in finite time).
 * @param v0 the current value
 * @param target the threshold of interest
 * @param asymptote the fitted plateau
 */
export function reachable(v0: number, target: number, asymptote: number): boolean {
  if (v0 < asymptote) return target > v0 && target < asymptote;
  if (v0 > asymptote) return target < v0 && target > asymptote;
  return false;
}

/**
 * Minutes until a Newton‑law series at `v0` reaches `target`, or `null` if the
 * target lies beyond the fitted plateau (never reached).
 * @param v0 the current value
 * @param target the threshold to reach
 * @param fit the converged Newton fit
 */
export function etaToThreshold(v0: number, target: number, fit: NewtonFit): number | null {
  const { k, asymptote: A } = fit;
  if (!reachable(v0, target, A)) return null;
  const ratio = (v0 - A) / (target - A);
  if (!(ratio > 0)) return null;
  const t = Math.log(ratio) / k;
  return t > 0 ? t : null;
}
