import type { ActionConfig, LovelaceCardConfig } from 'custom-card-helpers';

/** How a selector feature is laid out. */
export type FeatureDisplay = 'icons' | 'dropdown';

export type FeatureType =
  | 'climate-hvac-modes'
  | 'climate-fan-modes'
  | 'climate-swing-modes'
  | 'input-select'
  | 'switch-group'
  | 'switch-list'
  | 'button-list'
  | 'entity-tile'
  | 'comfort';

/**
 * Per-option override for the built-in climate selectors and for input_select.
 * `value` keys the override to an underlying option; `label`/`icon` override
 * the displayed text/icon; `hide` removes the option from the row.
 */
export interface OptionOverride {
  value: string;
  label?: string;
  icon?: string;
  hide?: boolean;
}

/** A single entity entry for switch/button list-style features. */
export interface EntityItem {
  entity: string;
  label?: string;
  icon?: string;
}

interface BaseSelectorFeature {
  display?: FeatureDisplay;
  /** Width as a percentage of the card (10–100, steps of 10). Unset = full width. */
  width?: number;
}

/** Per-option overrides plus an optional explicit display order of values. */
interface OrderedOptions {
  options?: OptionOverride[];
  /** Explicit order of option values; unlisted values follow in their natural order. */
  order?: string[];
}

export interface ClimateModesFeatureConfig extends BaseSelectorFeature, OrderedOptions {
  type: 'climate-hvac-modes';
}

export interface ClimateFanFeatureConfig extends BaseSelectorFeature, OrderedOptions {
  type: 'climate-fan-modes';
}

export interface ClimateSwingFeatureConfig extends BaseSelectorFeature, OrderedOptions {
  type: 'climate-swing-modes';
}

export interface InputSelectFeatureConfig extends BaseSelectorFeature, OrderedOptions {
  type: 'input-select';
  entity: string;
  label?: string;
}

export interface SwitchGroupFeatureConfig extends BaseSelectorFeature {
  type: 'switch-group';
  label?: string;
  entities: EntityItem[];
}

export interface SwitchListFeatureConfig {
  type: 'switch-list';
  label?: string;
  entities: EntityItem[];
  /** Width as a percentage of the card (10–100, steps of 10). Unset = full width. */
  width?: number;
}

export interface ButtonListFeatureConfig {
  type: 'button-list';
  label?: string;
  items: EntityItem[];
  /** Width as a percentage of the card (10–100, steps of 10). Unset = full width. */
  width?: number;
}

export interface EntityTileFeatureConfig {
  type: 'entity-tile';
  entity: string;
  name?: string;
  icon?: string;
  tap_action?: ActionConfig;
  /** Compact variant: icon + value only (no title), for fitting many per row. */
  compact?: boolean;
  /** Width as a percentage of the card (10–100, steps of 10). Unset = 50%. */
  width?: number;
}

/**
 * The "comfort & time-to-comfortable" feature. Added at most once. Uses the
 * card-level {@link FeelsLikeConfig} sensors to judge comfort scientifically via
 * the ASHRAE 55 / ISO 7730 PMV model (clothing inferred from heating vs cooling)
 * and forecasts, from history since the climate turned on, how long until the
 * room feels comfortable — and, optionally, until the target temperature is
 * reached. Comfort is calculated, not configured.
 */
export interface ComfortFeatureConfig {
  type: 'comfort';
  /** Also show the time until the target temperature is reached. */
  show_target_eta?: boolean;
  /** History lookback window in hours (default 12). */
  lookback_hours?: number;
  /** Width as a percentage of the card (10–100, steps of 10). Unset = full width. */
  width?: number;
}

export type FeatureConfig =
  | ClimateModesFeatureConfig
  | ClimateFanFeatureConfig
  | ClimateSwingFeatureConfig
  | InputSelectFeatureConfig
  | SwitchGroupFeatureConfig
  | SwitchListFeatureConfig
  | ButtonListFeatureConfig
  | EntityTileFeatureConfig
  | ComfortFeatureConfig;

/**
 * Card-level "feels-like" sensors. The two sensors feed both the optional dial
 * replacement (`show_as_current`) and the comfort feature's heat-index/apparent-
 * temperature calculations.
 */
export interface FeelsLikeConfig {
  /** Temperature sensor entity id. */
  temperature?: string;
  /** Humidity sensor entity id (%). */
  humidity?: string;
  /** Replace the dial's current temperature with the computed feels-like value. */
  show_as_current?: boolean;
}

export interface MaterialThermostatCardConfig extends LovelaceCardConfig {
  type: string;
  entity: string;
  name?: string;
  theme?: string;
  /** Show the current room temperature as the large primary number. */
  show_current_as_primary?: boolean;
  /** "Feels-like" temperature/humidity sensors (shared by the comfort feature). */
  feels_like?: FeelsLikeConfig;
  features?: FeatureConfig[];
}

/** Item handed to the shared selector-row component. */
export interface SelectorItem {
  value: string;
  label: string;
  icon?: string;
  active?: boolean;
  disabled?: boolean;
}
