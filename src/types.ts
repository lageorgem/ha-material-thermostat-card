import type { ActionConfig, LovelaceCardConfig } from 'custom-card-helpers';

/** How a selector feature is laid out. */
export type FeatureDisplay = 'icons' | 'dropdown' | 'tile';

/** Physical placement within unused grid space; only applies to singleton rows. */
export type FeatureAlignment = 'left' | 'center' | 'right';

export interface FeatureLayout {
  /** Width as a percentage of the card (10–100, steps of 10). Entity tiles default to 50%; others to 100%. */
  width?: number;
  /** Move the feature host, not its contents. Unset = left. */
  alignment?: FeatureAlignment;
}

/** How an entity-tile is laid out: a bare icon chip, or a full tile with title + value. */
export type EntityTileDisplay = 'icon' | 'tile';

export type FeatureType =
  | 'climate-hvac-modes'
  | 'climate-fan-modes'
  | 'climate-swing-modes'
  | 'climate-swing-horizontal-modes'
  | 'water-heater-operation-modes'
  | 'water-heater-away-mode'
  | 'climate-preset-modes'
  | 'input-select'
  | 'switch-group'
  | 'switch-list'
  | 'button-list'
  | 'entity-tile'
  | 'sensor-list'
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
  /** Accent color override (hex). Unset = the theme/default color for the option. */
  color?: string;
}

/** A single entity entry for switch/button list-style features. */
export interface EntityItem {
  entity: string;
  label?: string;
  icon?: string;
  /** Accent color override (hex), applied to the tile in tile display. */
  color?: string;
}

interface BaseSelectorFeature extends FeatureLayout {
  display?: FeatureDisplay;
  /** Optional title rendered above the selector (e.g. "Fan speed"). */
  label?: string;
}

/** Per-option overrides plus an optional explicit display order of values. */
interface OrderedOptions {
  options?: OptionOverride[];
  /** Explicit order of option values; unlisted values follow in their natural order. */
  order?: string[];
  /** Allow-list: only these option values are shown, in this order (stock-card `hvac_modes`/`fan_modes`/… compatibility). Unset = all values. */
  include?: string[];
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

/** Horizontal swing selector configuration. */
export interface ClimateSwingHorizontalFeatureConfig extends BaseSelectorFeature, OrderedOptions {
  type: 'climate-swing-horizontal-modes';
}

/** Water heater operation selector configuration. */
export interface WaterHeaterOperationFeatureConfig extends BaseSelectorFeature, OrderedOptions {
  type: 'water-heater-operation-modes';
}

/** Water heater away-mode toggle configuration. */
export interface WaterHeaterAwayFeatureConfig extends FeatureLayout {
  type: 'water-heater-away-mode';
  display?: 'icons' | 'tile';
  label?: string;
}

export interface ClimatePresetFeatureConfig extends BaseSelectorFeature, OrderedOptions {
  type: 'climate-preset-modes';
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

export interface SwitchListFeatureConfig extends FeatureLayout {
  type: 'switch-list';
  label?: string;
  entities: EntityItem[];
}

export interface ButtonListFeatureConfig extends FeatureLayout {
  type: 'button-list';
  label?: string;
  items: EntityItem[];
}

/**
 * A list of sensor rows (icon + customizable title + current value), à la the
 * Google Home app. Lighter than {@link EntityTileFeatureConfig} when you just
 * want to read several values stacked in a list.
 */
export interface SensorListFeatureConfig extends FeatureLayout {
  type: 'sensor-list';
  label?: string;
  items: EntityItem[];
}

export interface EntityTileFeatureConfig extends FeatureLayout {
  type: 'entity-tile';
  entity: string;
  name?: string;
  icon?: string;
  /** Accent color override (hex), applied to the tile in `tile` display. */
  color?: string;
  /** Layout: a bare icon chip (`icon`) or the full tile with title + value (`tile`, default). */
  display?: EntityTileDisplay;
  tap_action?: ActionConfig;
  /** @deprecated Legacy flag replaced by `display: 'icon'`; still read for back-compat. */
  compact?: boolean;
}

/**
 * The "comfort & time-to-comfortable" feature. Added at most once. Uses the
 * card-level {@link FeelsLikeConfig} sensors to judge comfort scientifically via
 * the ASHRAE 55 / ISO 7730 PMV model (clothing inferred from the room
 * temperature, not the HVAC mode) and forecasts, from history since the climate
 * turned on, how long until the
 * room feels comfortable — and, optionally, until the target temperature is
 * reached. Comfort is calculated, not configured.
 */
export interface ComfortFeatureConfig extends FeatureLayout {
  type: 'comfort';
  /** Also show the time until the target temperature is reached. */
  show_target_eta?: boolean;
}

export type FeatureConfig =
  | ClimateModesFeatureConfig
  | ClimateFanFeatureConfig
  | ClimateSwingFeatureConfig
  | ClimateSwingHorizontalFeatureConfig
  | WaterHeaterOperationFeatureConfig
  | WaterHeaterAwayFeatureConfig
  | ClimatePresetFeatureConfig
  | InputSelectFeatureConfig
  | SwitchGroupFeatureConfig
  | SwitchListFeatureConfig
  | ButtonListFeatureConfig
  | EntityTileFeatureConfig
  | SensorListFeatureConfig
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

/** A literal name, a structured HA name config, or a sequence of either. */
export type EntityNameConfig = string | Record<string, unknown> | Array<string | Record<string, unknown>>;

export interface MaterialThermostatCardConfig extends LovelaceCardConfig {
  type: string;
  /** Primary climate.* or water_heater.* entity id. */
  entity: string;
  name?: EntityNameConfig;
  theme?: string;
  /** Dial appearance. Default: 'halo'. */
  dial_style?: 'halo' | 'minimal' | 'google';
  /**
   * Default: 'rounded' = Google Sans Flex rounded, loaded from Google Fonts.
   * 'theme' = inherit the Home Assistant theme font.
   */
  font?: 'rounded' | 'theme';
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
  /** Accent color (CSS) for this option — feeds the tile tint in tile display. */
  color?: string;
}
