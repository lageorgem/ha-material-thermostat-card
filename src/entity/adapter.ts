import type { HassEntity } from 'home-assistant-js-websocket';

export type PrimaryDomain = 'climate' | 'water_heater';

/**
 * Domains accepted as the card's primary entity.
 * @param none No parameters; this is a constant.
 */
export const PRIMARY_DOMAINS: readonly PrimaryDomain[] = ['climate', 'water_heater'];

/**
 * Home Assistant climate capability bits.
 * @param none No parameters; this is a constant.
 */
export const ClimateEntityFeature = {
  TARGET_TEMPERATURE: 1,
  TARGET_TEMPERATURE_RANGE: 2,
  TARGET_HUMIDITY: 4,
  FAN_MODE: 8,
  PRESET_MODE: 16,
  SWING_MODE: 32,
  TURN_OFF: 128,
  TURN_ON: 256,
  SWING_HORIZONTAL_MODE: 512,
} as const;

/**
 * Home Assistant water heater capability bits.
 * @param none No parameters; this is a constant.
 */
export const WaterHeaterEntityFeature = {
  TARGET_TEMPERATURE: 1,
  OPERATION_MODE: 2,
  AWAY_MODE: 4,
  ON_OFF: 8,
} as const;

/**
 * Identify a supported primary domain; unsupported ids return undefined.
 * @param entityId the entity id, if present
 */
export function primaryDomain(entityId: string | undefined): PrimaryDomain | undefined {
  if (entityId?.startsWith('climate.')) return 'climate';
  if (entityId?.startsWith('water_heater.')) return 'water_heater';
  return undefined;
}

/**
 * Check a feature bit, permitting legacy entities without numeric capabilities.
 * @param stateObj the entity state, if present
 * @param bit the capability bit to check
 */
export function supportsFeature(stateObj: HassEntity | undefined, bit: number): boolean {
  const features = stateObj?.attributes.supported_features;
  return typeof features !== 'number' || (features & bit) !== 0;
}

/**
 * Whether the primary entity is missing or unavailable.
 * @param stateObj the entity state, if present
 */
export function isUnavailable(stateObj: HassEntity | undefined): boolean {
  return !stateObj || stateObj.state === 'unavailable' || stateObj.state === 'unknown';
}

export interface TargetModel {
  kind: 'single' | 'dual' | 'none';
  value?: number;
  low?: number;
  high?: number;
  min: number;
  max: number;
  step: number;
}

/**
 * Read stock-compatible target controls and domain-specific limits.
 * @param stateObj the primary entity state
 * @param unit the HA system temperature unit ('°C' or '°F')
 */
export function targetModel(stateObj: HassEntity, unit: string): TargetModel {
  const a = stateObj.attributes;
  const waterHeater = primaryDomain(stateObj.entity_id) === 'water_heater';
  const fahrenheit = unit === '°F';
  const defaultMin = waterHeater ? (fahrenheit ? 110 : 43) : fahrenheit ? 45 : 7;
  const defaultMax = waterHeater ? (fahrenheit ? 140 : 60) : fahrenheit ? 95 : 35;
  const limits = {
    min: typeof a.min_temp === 'number' && Number.isFinite(a.min_temp) ? a.min_temp : defaultMin,
    max: typeof a.max_temp === 'number' && Number.isFinite(a.max_temp) ? a.max_temp : defaultMax,
    step:
      typeof a.target_temp_step === 'number' && Number.isFinite(a.target_temp_step) && a.target_temp_step > 0
        ? a.target_temp_step
        : fahrenheit
          ? 1
          : 0.5,
  };
  // Both domains use bit 1 for their single target temperature capability.
  if (supportsFeature(stateObj, ClimateEntityFeature.TARGET_TEMPERATURE) && typeof a.temperature === 'number' && Number.isFinite(a.temperature)) {
    return { kind: 'single', value: a.temperature, ...limits };
  }
  if (
    !waterHeater &&
    supportsFeature(stateObj, ClimateEntityFeature.TARGET_TEMPERATURE_RANGE) &&
    typeof a.target_temp_low === 'number' && Number.isFinite(a.target_temp_low) &&
    typeof a.target_temp_high === 'number' && Number.isFinite(a.target_temp_high)
  ) {
    return { kind: 'dual', low: a.target_temp_low, high: a.target_temp_high, ...limits };
  }
  return { kind: 'none', ...limits };
}

export interface ServiceCall {
  domain: PrimaryDomain;
  service: 'set_temperature';
  data: Record<string, unknown>;
}

/**
 * Build a temperature command without invoking Home Assistant.
 * @param stateObj the primary entity state
 * @param kind the selected target control kind
 * @param target the requested target values
 */
export function temperatureServiceCall(
  stateObj: HassEntity,
  kind: 'single' | 'dual',
  target: { value?: number; low?: number; high?: number }
): ServiceCall {
  const domain = primaryDomain(stateObj.entity_id) ?? 'climate';
  const data: Record<string, unknown> = { entity_id: stateObj.entity_id };
  if (domain === 'climate' && kind === 'dual') {
    data.target_temp_low = target.low;
    data.target_temp_high = target.high;
  } else {
    data.temperature = target.value;
  }
  return { domain, service: 'set_temperature', data };
}

/**
 * Read a climate action; water heaters have no HVAC action.
 * @param stateObj the primary entity state
 */
export function hvacAction(stateObj: HassEntity): string | undefined {
  return primaryDomain(stateObj.entity_id) === 'water_heater'
    ? undefined
    : stateObj.attributes.hvac_action;
}

/**
 * Select the dial's climate-mode-like color basis.
 * @param stateObj the primary entity state
 */
export function dialColorMode(stateObj: HassEntity): string {
  if (primaryDomain(stateObj.entity_id) === 'water_heater') {
    return stateObj.state === 'off' || isUnavailable(stateObj) ? 'off' : 'heat';
  }
  switch (hvacAction(stateObj)) {
    case 'cooling':
      return 'cool';
    case 'heating':
      return 'heat';
    case 'drying':
      return 'dry';
    case 'fan':
      return 'fan_only';
    default:
      return stateObj.state;
  }
}
