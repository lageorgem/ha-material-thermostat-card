/**
 * Statistical forecasting for the comfort feature.
 *
 * A heating/cooling room approaches a steady temperature roughly per Newton's
 * law of cooling: `dv/dt = -k·(v - A)`, where `A` is the plateau the room is
 * heading toward and `k > 0` the rate constant. Rather than estimate `dv/dt` by
 * differencing consecutive samples — which amplifies sensor quantization (coarse
 * 0.2–0.3° steps) into pure noise — we recover `k` and `A` by **integrating** the
 * ODE: `v(t) − v₀ = −k·∫v dτ + k·A·t`, a two‑variable linear regression of
 * `y = v − v₀` on `[∫v dτ, t]`. Integration averages the noise out, so the fit is
 * stable on real recorder data. This still yields an honest "won't reach,
 * plateaus at A" result and ETAs that correctly slow near the plateau.
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
export const MIN_SAMPLES = 4;
/** Minimum time span (minutes) the samples must cover. */
export const MIN_SPAN_MIN = 10;
/** Minimum fit quality (R² of the integral regression) to trust a fit. */
export const MIN_FIT_R2 = 0.5;

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

/**
 * Fit Newton's law of cooling/heating to a series and recover its plateau and
 * rate constant, using the integral form (see the module comment) so coarse
 * sensor quantization doesn't wreck the fit. Returns `null` when there is not
 * enough data, the data is too noisy, or the series is not converging (k ≤ 0).
 * Callers should treat `null` as "not enough confident data" — i.e. show nothing
 * rather than a guess.
 * @param samples the time/value series (minutes / value)
 */
export function newtonFit(samples: Sample[]): NewtonFit | null {
  if (samples.length < MIN_SAMPLES) return null;
  const sorted = [...samples].sort((a, b) => a.t - b.t);
  const t0 = sorted[0].t;
  const v0 = sorted[0].v;
  const span = sorted[sorted.length - 1].t - t0;
  if (span < MIN_SPAN_MIN) return null;

  // y = v − v₀ regressed on x1 = ∫v dτ (cumulative trapezoid) and x2 = t − t₀,
  // through the origin (the relation holds exactly at t₀: y = x1 = x2 = 0).
  let area = 0;
  let prevT = t0;
  let prevV = v0;
  let a11 = 0;
  let a12 = 0;
  let a22 = 0;
  let c1 = 0;
  let c2 = 0;
  const rows: Array<{ x1: number; x2: number; y: number }> = [];
  for (const p of sorted) {
    area += ((p.v + prevV) / 2) * (p.t - prevT);
    prevT = p.t;
    prevV = p.v;
    const x1 = area;
    const x2 = p.t - t0;
    const y = p.v - v0;
    rows.push({ x1, x2, y });
    a11 += x1 * x1;
    a12 += x1 * x2;
    a22 += x2 * x2;
    c1 += x1 * y;
    c2 += x2 * y;
  }
  const det = a11 * a22 - a12 * a12;
  if (Math.abs(det) < 1e-12) return null;
  const b1 = (c1 * a22 - c2 * a12) / det; // = −k
  const b2 = (a11 * c2 - a12 * c1) / det; // = k·A
  const k = -b1;
  if (!(k > 1e-6)) return null; // flat or diverging → no usable forecast
  const asymptote = b2 / k;

  // R² of the integral regression (high for a genuine first‑order approach).
  let ssr = 0;
  let sst = 0;
  const meanY = rows.reduce((acc, r) => acc + r.y, 0) / rows.length;
  for (const r of rows) {
    const yh = b1 * r.x1 + b2 * r.x2;
    ssr += (r.y - yh) ** 2;
    sst += (r.y - meanY) ** 2;
  }
  const r2 = sst === 0 ? 1 : 1 - ssr / sst;
  if (r2 < MIN_FIT_R2) return null;
  return { k, asymptote, r2 };
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
