/**
 * Humidity / "feels‑like" helpers derived from a dry‑bulb temperature and a
 * relative humidity. Temperatures are °C, humidity is a 0–100 percent.
 *
 *  - {@link heatIndexC} (NOAA Rothfusz) is the dial's "feels‑like" number — how
 *    hot it *feels* when warm/humid, reducing to ≈ air temperature when cool/dry
 *    (no wind sensor ⇒ no wind‑chill term).
 *  - {@link svpPa} / {@link humidityRatio} feed the PMV comfort model (`pmv.ts`)
 *    and the ASHRAE‑55 absolute‑humidity cap ({@link HUMIDITY_RATIO_MAX}).
 */

/** Standard sea‑level atmospheric pressure (Pa). */
const ATM_PRESSURE = 101325;
/**
 * ASHRAE 55 upper humidity limit as a humidity ratio (kg water / kg dry air);
 * above this a space is "too humid" even when the temperature is comfortable.
 */
export const HUMIDITY_RATIO_MAX = 0.012;

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
 * Saturation water‑vapour pressure (Pa) over liquid water at a temperature,
 * using the same expression as the ISO 7730 PMV program.
 * @param tempC temperature in °C
 */
export function svpPa(tempC: number): number {
  return 1000 * Math.exp(16.6536 - 4030.183 / (tempC + 235));
}

/**
 * Humidity ratio (kg water vapour / kg dry air) at sea level.
 * @param tempC dry‑bulb temperature in °C
 * @param rh relative humidity, 0–100
 */
export function humidityRatio(tempC: number, rh: number): number {
  const pw = (Math.max(0, Math.min(100, rh)) / 100) * svpPa(tempC);
  return (0.62198 * pw) / (ATM_PRESSURE - pw);
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
