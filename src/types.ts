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
  | 'entity-tile';

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
  /** Width in internal grid units (1 unit = 1 icon). Unset = full row. */
  width?: number;
}

export interface ClimateModesFeatureConfig extends BaseSelectorFeature {
  type: 'climate-hvac-modes';
  options?: OptionOverride[];
}

export interface ClimateFanFeatureConfig extends BaseSelectorFeature {
  type: 'climate-fan-modes';
  options?: OptionOverride[];
}

export interface ClimateSwingFeatureConfig extends BaseSelectorFeature {
  type: 'climate-swing-modes';
  options?: OptionOverride[];
}

export interface InputSelectFeatureConfig extends BaseSelectorFeature {
  type: 'input-select';
  entity: string;
  label?: string;
  options?: OptionOverride[];
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
  /** Width in internal grid units (1 unit = 1 icon). Unset = full row. */
  width?: number;
}

export interface ButtonListFeatureConfig {
  type: 'button-list';
  label?: string;
  items: EntityItem[];
  /** Width in internal grid units (1 unit = 1 icon). Unset = full row. */
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
  /** Width in internal grid units (1 unit = 1 icon). Unset = a sensible default. */
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
  | EntityTileFeatureConfig;

export interface MaterialThermostatCardConfig extends LovelaceCardConfig {
  type: string;
  entity: string;
  name?: string;
  theme?: string;
  /** Show the current room temperature as the large primary number. */
  show_current_as_primary?: boolean;
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
