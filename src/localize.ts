import type { HomeAssistant } from 'custom-card-helpers';
import type { HassEntity } from 'home-assistant-js-websocket';
import { prettyLabel } from './theme';

/** Structured or plain name config, as accepted by HA's `name:` card option. */
export type EntityNameConfig = string | Record<string, unknown> | Array<string | Record<string, unknown>>;

// Keep newer frontend APIs local: custom-card-helpers may describe an older HA.
type FormattingHass = {
  language?: string;
  locale?: { language?: string; number_format?: string };
  formatEntityState?: (stateObj: HassEntity, state?: string) => string;
  formatEntityAttributeValue?: (stateObj: HassEntity, attribute: string, value?: unknown) => string;
  formatEntityAttributeName?: (stateObj: HassEntity, attribute: string) => unknown;
  localize?: (key: string) => unknown;
  formatEntityName?: (stateObj: HassEntity, name?: EntityNameConfig) => unknown;
};

/**
 * Format an entity state using HA, with prettyLabel fallback when HA is absent
 * or returns the raw state unchanged (no translation).
 * @param hass the Home Assistant connection, if available
 * @param stateObj the entity whose state is being displayed
 * @param state an optional state override
 */
export function formatEntityState(hass: HomeAssistant | undefined, stateObj: HassEntity, state?: string): string {
  const formatter = hass as FormattingHass | undefined;
  if (typeof formatter?.formatEntityState === 'function') {
    const result = formatter.formatEntityState(stateObj, state);
    const raw = state ?? stateObj.state;
    return typeof result === 'string' && result === raw ? prettyLabel(raw) : result;
  }
  return prettyLabel(state ?? stateObj.state);
}

/**
 * Format an entity attribute value using HA, with prettyLabel fallback when HA
 * is absent or returns the raw value unchanged (no translation).
 * @param hass the Home Assistant connection, if available
 * @param stateObj the entity owning the attribute
 * @param attribute the attribute key
 * @param value an optional value override
 */
export function formatAttributeValue(hass: HomeAssistant | undefined, stateObj: HassEntity, attribute: string, value?: unknown): string {
  const formatter = hass as FormattingHass | undefined;
  if (typeof formatter?.formatEntityAttributeValue === 'function') {
    const result = formatter.formatEntityAttributeValue(stateObj, attribute, value);
    const raw = value === undefined ? stateObj.attributes[attribute] : value;
    return typeof result === 'string' && result === raw ? prettyLabel(result) : result;
  }
  return prettyLabel(String(value ?? stateObj.attributes[attribute] ?? ''));
}

/**
 * Format an attribute label using HA when a translation is available.
 * @param hass the Home Assistant connection, if available
 * @param stateObj the entity owning the attribute
 * @param attribute the attribute key
 * @param fallback the English label
 */
export function formatAttributeName(hass: HomeAssistant | undefined, stateObj: HassEntity, attribute: string, fallback: string): string {
  const formatter = hass as FormattingHass | undefined;
  if (typeof formatter?.formatEntityAttributeName === 'function') {
    const result = formatter.formatEntityAttributeName(stateObj, attribute);
    if (typeof result === 'string' && result) return result;
  }
  return fallback;
}

/**
 * Resolve an HA translation key or return its English fallback.
 * @param hass the Home Assistant connection, if available
 * @param key the frontend translation key
 * @param fallback the English text
 */
export function localizeKey(hass: HomeAssistant | undefined, key: string, fallback: string): string {
  const formatter = hass as FormattingHass | undefined;
  if (typeof formatter?.localize === 'function') {
    const result = formatter.localize(key);
    if (typeof result === 'string' && result) return result;
  }
  return fallback;
}

/**
 * Map HA number-format preferences to Intl locales.
 * @param hass the Home Assistant connection, if available
 */
export function numberLocale(hass: HomeAssistant | undefined): string | string[] | undefined {
  const formatter = hass as FormattingHass | undefined;
  switch (formatter?.locale?.number_format) {
    case 'system': return undefined;
    case 'comma_decimal': return ['en-US', 'en'];
    case 'decimal_comma': return ['de', 'es', 'it'];
    case 'space_comma': return ['fr', 'sv', 'cs'];
    case 'language':
    case 'none':
    default: return formatter?.locale?.language ?? formatter?.language;
  }
}

/**
 * Format a number with fixed precision and HA's decimal separator preference.
 * @param hass the Home Assistant connection, if available
 * @param value the numeric value
 * @param decimals the number of fractional digits
 */
export function formatNumber(hass: HomeAssistant | undefined, value: number, decimals: number): string {
  try {
    return new Intl.NumberFormat(numberLocale(hass), {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: false,
    }).format(value);
  } catch (error) {
    if (error instanceof RangeError) return value.toFixed(decimals);
    throw error;
  }
}

/**
 * Resolve a plain or structured entity name using HA when supported.
 * @param hass the Home Assistant connection, if available
 * @param stateObj the entity, if available
 * @param entityId the fallback entity ID
 * @param name the optional plain or structured name configuration
 */
export function entityDisplayName(hass: HomeAssistant | undefined, stateObj: HassEntity | undefined, entityId: string, name?: EntityNameConfig): string {
  if (typeof name === 'string') return name;
  const formatter = hass as FormattingHass | undefined;
  if (typeof formatter?.formatEntityName === 'function' && stateObj) {
    const result = formatter.formatEntityName(stateObj, name);
    if (typeof result === 'string' && result) return result;
  }
  return stateObj?.attributes.friendly_name ?? entityId;
}
