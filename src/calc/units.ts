/** Supported absolute temperature units. */
export type TempUnit = '°C' | '°F' | 'K';

type TemperatureSystem = {
  config?: { unit_system?: { temperature?: string } };
};

type TemperatureSensors = TemperatureSystem & {
  states?: Record<string, { attributes?: { unit_of_measurement?: unknown } }>;
};

/**
 * Parse a finite reading, accepting numeric prefixes in trimmed strings.
 * @param value raw sensor reading
 */
export function parseReading(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value !== 'string') return undefined;
  const reading = parseFloat(value.trim());
  return Number.isFinite(reading) ? reading : undefined;
}

/**
 * Normalize a temperature unit alias, ignoring case and surrounding whitespace.
 * @param unit raw temperature unit
 */
export function normalizeTempUnit(unit: unknown): TempUnit | undefined {
  if (typeof unit !== 'string') return undefined;
  switch (unit.trim().toLowerCase()) {
    case '°c':
    case 'c':
    case '℃':
    case 'celsius':
      return '°C';
    case '°f':
    case 'f':
    case '℉':
    case 'fahrenheit':
      return '°F';
    case 'k':
    case 'kelvin':
      return 'K';
    default:
      return undefined;
  }
}

/**
 * Resolve the Home Assistant temperature unit, defaulting to Celsius.
 * @param hass Home Assistant configuration, if available
 */
export function systemTempUnit(hass: TemperatureSystem | undefined | null): TempUnit {
  return normalizeTempUnit(hass?.config?.unit_system?.temperature) ?? '°C';
}

/**
 * Resolve a sensor's temperature unit, falling back to the system unit.
 * @param hass Home Assistant configuration and states, if available
 * @param entityId temperature sensor entity ID
 */
export function sensorTempUnit(
  hass: TemperatureSensors | undefined | null,
  entityId: string
): TempUnit {
  const unit = normalizeTempUnit(hass?.states?.[entityId]?.attributes?.unit_of_measurement);
  return unit ?? systemTempUnit(hass);
}

/**
 * Convert an absolute temperature to Celsius.
 * @param value absolute temperature in the supplied unit
 * @param unit source temperature unit
 */
export function toCelsius(value: number, unit: TempUnit): number {
  if (unit === '°F') return ((value - 32) * 5) / 9;
  if (unit === 'K') return value - 273.15;
  return value;
}

/**
 * Convert Celsius to an absolute temperature in the supplied unit.
 * @param celsius absolute temperature in Celsius
 * @param unit target temperature unit
 */
export function fromCelsius(celsius: number, unit: TempUnit): number {
  if (unit === '°F') return (celsius * 9) / 5 + 32;
  if (unit === 'K') return celsius + 273.15;
  return celsius;
}
