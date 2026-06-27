/**
 * Fanger's PMV (Predicted Mean Vote) thermal-comfort model — the scientific basis
 * of ASHRAE Standard 55 / ISO 7730. PMV is a single number on the ASHRAE thermal
 * sensation scale (−3 cold … 0 neutral … +3 hot); a space is comfortable when
 * −0.5 < PMV < +0.5 (≈ 80% of occupants satisfied, PPD ≤ 10%).
 *
 * One scalar folds in temperature, humidity (as water-vapour pressure), clothing,
 * and activity — so it judges hot *and* cold comfort correctly, unlike a fixed
 * temperature band. Implementation is the iterative algorithm from ISO 7730:2005
 * Annex D (validated against that standard's example table in the unit tests).
 */
import { svpPa } from './comfort-metrics';

/** Comfortable when |PMV| is within this bound (ASHRAE 55, 80% acceptability). */
export const PMV_COMFORT_LIMIT = 0.5;
/** Default sedentary metabolic rate (met) for a home occupant. */
export const DEFAULT_MET = 1.1;
/** Default still-air indoor velocity (m/s). */
export const DEFAULT_VEL = 0.1;

/** Optional environmental/personal overrides for {@link pmv}. */
export interface PmvOptions {
  /** Mean radiant temperature (°C); defaults to the air temperature. */
  tr?: number;
  /** Air velocity (m/s). */
  vel?: number;
  /** Metabolic rate (met). */
  met?: number;
  /** Clothing insulation (clo). */
  clo?: number;
}

/**
 * Predicted Mean Vote for an air temperature + relative humidity.
 * @param ta air (dry-bulb) temperature in °C
 * @param rh relative humidity, 0–100
 * @param opts mean radiant temp / air velocity / met / clo overrides
 */
export function pmv(ta: number, rh: number, opts: PmvOptions = {}): number {
  const tr = opts.tr ?? ta;
  const vel = opts.vel ?? DEFAULT_VEL;
  const met = opts.met ?? DEFAULT_MET;
  const clo = opts.clo ?? 0.6;

  const pa = (rh / 100) * svpPa(ta); // water-vapour partial pressure, Pa
  const icl = 0.155 * clo; // clothing insulation, m²·K/W
  const m = met * 58.15; // metabolic rate, W/m²
  const mw = m; // external work assumed zero

  const fcl = icl <= 0.078 ? 1.0 + 1.29 * icl : 1.05 + 0.645 * icl;
  const hcf = 12.1 * Math.sqrt(vel);
  const taa = ta + 273.0;
  const tra = tr + 273.0;

  // Iteratively solve for the clothing surface temperature.
  const tcla = taa + (35.5 - ta) / (3.5 * icl + 0.1);
  const p1 = icl * fcl;
  const p2 = p1 * 3.96;
  const p3 = p1 * 100.0;
  const p4 = p1 * taa;
  const p5 = 308.7 - 0.028 * mw + p2 * (tra / 100.0) ** 4;
  let xn = tcla / 100.0;
  let xf = xn;
  let hc = hcf;
  for (let n = 0; n < 150; n++) {
    xf = (xf + xn) / 2.0;
    const hcn = 2.38 * Math.abs(100.0 * xf - taa) ** 0.25;
    hc = hcf > hcn ? hcf : hcn;
    xn = (p5 + p4 * hc - p2 * xf ** 4) / (100.0 + p3 * hc);
    if (Math.abs(xn - xf) <= 0.00015) break;
  }
  const tcl = 100.0 * xn - 273.0;

  // Heat-loss components (W/m²).
  const hlSkin = 3.05 * 0.001 * (5733.0 - 6.99 * mw - pa);
  const hlSweat = mw > 58.15 ? 0.42 * (mw - 58.15) : 0.0;
  const hlLatentResp = 1.7 * 0.00001 * m * (5867.0 - pa);
  const hlDryResp = 0.0014 * m * (34.0 - ta);
  const hlRad = 3.96 * fcl * (xn ** 4 - (tra / 100.0) ** 4);
  const hlConv = fcl * hc * (tcl - ta);

  const ts = 0.303 * Math.exp(-0.036 * m) + 0.028;
  return ts * (mw - hlSkin - hlSweat - hlLatentResp - hlDryResp - hlRad - hlConv);
}

/**
 * Clothing insulation (clo) inferred from what the climate is doing — matching
 * ASHRAE 55's two comfort zones: cooling ⇒ summer dress (0.5 clo), heating ⇒
 * winter dress (1.0 clo), otherwise a mid value.
 * @param mode the climate hvac mode (entity state)
 * @param action the climate hvac_action, if any
 */
export function cloForClimate(mode: string, action?: string): number {
  const heating = action === 'heating' || (!action && mode === 'heat');
  const cooling =
    action === 'cooling' || (!action && (mode === 'cool' || mode === 'dry' || mode === 'fan_only'));
  if (heating) return 1.0;
  if (cooling) return 0.5;
  return 0.7;
}
