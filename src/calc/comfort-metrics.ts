/**
 * Human‑comfort temperature metrics derived from a dry‑bulb temperature and a
 * relative humidity. All functions take/return °C and a 0–100 humidity percent.
 *
 * We have no wind sensor, so there is no wind‑chill term:
 *  - {@link heatIndexC} (NOAA Rothfusz) models how hot it *feels* when warm/humid
 *    and gracefully reduces to ≈ air temperature in cool/dry conditions — this is
 *    the "feels‑like" used for the dial and the cooling‑comfort decision.
 *  - {@link apparentTempC} (Australian BOM apparent temperature, still air) is
 *    humidity‑aware across the whole range and is used as the heating‑comfort
 *    metric, where the heat index is not meaningful.
 */

/** °C → °F. */
function cToF(c: number): number {
  return (c * 9) / 5 + 32;
}

/** °F → °C. */
function fToC(f: number): number {
  return ((f - 32) * 5) / 9;
}

/**
 * NOAA Heat Index ("feels like" when warm) for a temperature and humidity.
 * Uses the simple formula below ~80 °F and the full Rothfusz regression (with
 * the low/high‑humidity adjustments) above it, so the result is continuous and
 * ≈ the air temperature in cool/dry conditions.
 * @param tempC dry‑bulb temperature in °C
 * @param rh relative humidity, 0–100
 */
export function heatIndexC(tempC: number, rh: number): number {
  const T = cToF(tempC);
  const R = Math.max(0, Math.min(100, rh));

  // Simple (Steadman) estimate; below 80 °F it is the accepted value.
  const simple = 0.5 * (T + 61.0 + (T - 68.0) * 1.2 + R * 0.094);
  if ((simple + T) / 2 < 80) return fToC(simple);

  // Full Rothfusz regression.
  let hi =
    -42.379 +
    2.04901523 * T +
    10.14333127 * R -
    0.22475541 * T * R -
    0.00683783 * T * T -
    0.05481717 * R * R +
    0.00122874 * T * T * R +
    0.00085282 * T * R * R -
    0.00000199 * T * T * R * R;

  // Adjustments at the humidity extremes.
  if (R < 13 && T >= 80 && T <= 112) {
    hi -= ((13 - R) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
  } else if (R > 85 && T >= 80 && T <= 87) {
    hi += ((R - 85) / 10) * ((87 - T) / 5);
  }

  return fToC(hi);
}

/**
 * Australian BOM apparent temperature in still air (no wind term): how cold/warm
 * it *feels* accounting for humidity. Used as the heating‑comfort metric.
 * @param tempC dry‑bulb temperature in °C
 * @param rh relative humidity, 0–100
 */
export function apparentTempC(tempC: number, rh: number): number {
  const R = Math.max(0, Math.min(100, rh));
  // Water‑vapour pressure (hPa).
  const e = (R / 100) * 6.105 * Math.exp((17.27 * tempC) / (237.7 + tempC));
  return tempC + 0.33 * e - 4.0;
}

/**
 * The "feels‑like" temperature shown on the dial. Canonically the heat index,
 * which equals ≈ the air temperature in cool conditions and rises with humidity
 * when warm. (No wind sensor ⇒ no wind‑chill branch.)
 * @param tempC dry‑bulb temperature in °C
 * @param rh relative humidity, 0–100
 */
export function feelsLikeC(tempC: number, rh: number): number {
  return heatIndexC(tempC, rh);
}
