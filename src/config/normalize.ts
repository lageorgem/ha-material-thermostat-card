import type { MaterialThermostatCardConfig } from '../types';

const stockListKeys = new Map([
  ['climate-hvac-modes', 'hvac_modes'],
  ['climate-preset-modes', 'preset_modes'],
  ['climate-fan-modes', 'fan_modes'],
  ['climate-swing-modes', 'swing_modes'],
  ['climate-swing-horizontal-modes', 'swing_horizontal_modes'],
  ['water-heater-operation-modes', 'operation_modes'],
]);

type StockSelector = {
  type: string;
  style?: unknown;
  display?: unknown;
  include?: unknown;
  [key: string]: unknown;
};

/**
 * Return a new config with stock thermostat selector keys translated, without mutating input.
 * @param config Card configuration, which may be deeply frozen.
 */
export function normalizeConfig(
  config: MaterialThermostatCardConfig,
): MaterialThermostatCardConfig {
  const result = { ...config };
  if (config.features === undefined) return result;

  result.features = config.features.map((feature) => {
    const stockKey = stockListKeys.get(feature.type);
    if (stockKey === undefined) return feature;

    const normalized = { ...feature } as StockSelector;
    if (
      normalized.display === undefined &&
      (normalized.style === 'icons' || normalized.style === 'dropdown')
    ) {
      normalized.display = normalized.style;
    }
    if (normalized.include === undefined && Array.isArray(normalized[stockKey])) {
      normalized.include = normalized[stockKey];
    }
    delete normalized.style;
    delete normalized[stockKey];
    return normalized as typeof feature;
  });
  return result;
}
