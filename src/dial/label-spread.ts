/**
 * Pool-adjacent-violators: the nearest **non-decreasing** sequence to `values`
 * in the least-squares sense (isotonic regression). Each output value is the
 * mean of its pooled block, so it moves the inputs as little as possible while
 * enforcing monotonicity.
 * @param values the input sequence
 */
function isotonic(values: number[]): number[] {
  const means: number[] = [];
  const counts: number[] = [];
  for (const v of values) {
    means.push(v);
    counts.push(1);
    // Merge any trailing block that now violates monotonicity into its left
    // neighbour, replacing both with their weighted mean.
    while (means.length > 1 && means[means.length - 2] > means[means.length - 1]) {
      const v2 = means.pop()!;
      const c2 = counts.pop()!;
      const v1 = means.pop()!;
      const c1 = counts.pop()!;
      means.push((v1 * c1 + v2 * c2) / (c1 + c2));
      counts.push(c1 + c2);
    }
  }
  const out: number[] = [];
  means.forEach((m, k) => {
    for (let j = 0; j < counts[k]; j++) out.push(m);
  });
  return out;
}

/**
 * Spread a set of angles (degrees along the dial arc) so neighbours are at least
 * `minSep` degrees apart, moving each as little as possible. The marker DOTS
 * stay at their true angle; only the orbiting LABELS use these spread angles, so
 * a label may sit a little up or down the arc from its dot to avoid overlapping
 * a neighbour (instead of being pulled toward the centre). Well-separated labels
 * are left untouched.
 *
 * Implemented as L2-optimal isotonic regression: the constraint
 * `p[i+1] - p[i] >= minSep` becomes "non-decreasing" after subtracting
 * `k * minSep`, so pool-adjacent-violators gives the minimal-movement fit.
 *
 * @param angles the natural angles, in any order
 * @param minSep minimum angular gap to enforce between neighbours
 * @param lo optional lower bound to keep the spread labels within (degrees)
 * @param hi optional upper bound to keep the spread labels within (degrees)
 */
export function spreadAngles(angles: number[], minSep: number, lo?: number, hi?: number): number[] {
  const n = angles.length;
  if (n < 2) return angles.slice();

  const order = angles.map((_, i) => i).sort((a, b) => angles[a] - angles[b]);
  // Transform: q[k] = p[k] - k*minSep must be non-decreasing for p to keep the
  // minSep gap; fit q to the transformed naturals b[k] = angle[k] - k*minSep.
  const b = order.map((idx, k) => angles[idx] - k * minSep);
  const q = isotonic(b);

  const adjusted = new Array<number>(n);
  order.forEach((idx, k) => {
    adjusted[idx] = q[k] + k * minSep;
  });

  // Translate the whole (gap-preserving) group back inside [lo, hi] if asked.
  if (lo != null || hi != null) {
    const mn = Math.min(...adjusted);
    const mx = Math.max(...adjusted);
    let shift = 0;
    if (lo != null && mn < lo) shift = lo - mn;
    else if (hi != null && mx > hi) shift = hi - mx;
    if (shift !== 0) for (let i = 0; i < n; i++) adjusted[i] += shift;
  }
  return adjusted;
}
