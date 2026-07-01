import { LitElement, html, nothing, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import type { FeatureDisplay, OptionOverride, SelectorItem } from '../types';
import {
  HVAC_MODE_ICONS,
  fanIcon,
  swingIcon,
  presetIcon,
  prettyLabel,
  orderValues,
  climateModeColor,
  presetColor,
} from '../theme';
import './selector-row';

export type ClimateSelectorKind = 'hvac' | 'fan' | 'swing' | 'preset';

/** Default tile title per selector kind (used in `tile` display when unlabeled). */
const TILE_TITLE: Record<ClimateSelectorKind, string> = {
  hvac: 'Mode',
  fan: 'Fan',
  swing: 'Swing',
  preset: 'Preset',
};

/**
 * Renders the climate HVAC / fan / swing selector. The available options come
 * from the entity's attributes; per-option label/icon/hide overrides come from
 * config. Selecting an option calls the matching `climate.set_*` service.
 */
@customElement('mt-climate-selector')
export class MtClimateSelector extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property() entityId!: string;
  @property() kind: ClimateSelectorKind = 'hvac';
  @property() display: FeatureDisplay = 'icons';
  /** Optional title rendered above the selector. */
  @property() label?: string;
  @property({ attribute: false }) options?: OptionOverride[];
  /** Explicit display order of option values (unlisted values follow naturally). */
  @property({ attribute: false }) order?: string[];

  /** The backing climate state object, if present. */
  private get _stateObj() {
    return this.hass?.states?.[this.entityId];
  }

  /**
   * Build a lookup of per-option overrides keyed by their value.
   */
  private _overrideMap(): Map<string, OptionOverride> {
    const map = new Map<string, OptionOverride>();
    (this.options ?? []).forEach((o) => map.set(o.value, o));
    return map;
  }

  /**
   * Build the selector items from entity attributes + config overrides.
   */
  private _build(): SelectorItem[] {
    const state = this._stateObj;
    if (!state) return [];
    const overrides = this._overrideMap();

    let values: string[] = [];
    let active: string | undefined;
    let defaultIcon: (v: string) => string | undefined;
    // Default accent per option: HVAC modes carry their mode color, presets the
    // eco/sleep special-case color, fan/swing none (theme default). An explicit
    // per-option `color` override always wins.
    let defaultColor: (v: string) => string | undefined;

    if (this.kind === 'hvac') {
      values = state.attributes.hvac_modes ?? [];
      active = state.state;
      defaultIcon = (v) => HVAC_MODE_ICONS[v] ?? 'mdi:thermostat';
      defaultColor = (v) => climateModeColor(v);
    } else if (this.kind === 'fan') {
      values = state.attributes.fan_modes ?? [];
      active = state.attributes.fan_mode;
      defaultIcon = (v) => fanIcon(v);
      defaultColor = () => undefined;
    } else if (this.kind === 'preset') {
      values = state.attributes.preset_modes ?? [];
      active = state.attributes.preset_mode;
      defaultIcon = (v) => presetIcon(v);
      defaultColor = (v) => presetColor(v);
    } else {
      values = state.attributes.swing_modes ?? [];
      active = state.attributes.swing_mode;
      defaultIcon = (v) => swingIcon(v);
      defaultColor = () => undefined;
    }

    return orderValues(values, this.order)
      .filter((v) => !overrides.get(v)?.hide)
      .map((v) => ({
        value: v,
        label: overrides.get(v)?.label ?? prettyLabel(v),
        icon: overrides.get(v)?.icon ?? defaultIcon(v),
        active: v === active,
        color: overrides.get(v)?.color ?? defaultColor(v),
      }));
  }

  /**
   * Call the appropriate climate service for the selected option.
   * @param e selector-row's `item-selected` event
   */
  private _onSelect(e: CustomEvent): void {
    const value = e.detail.value;
    if (!this._stateObj) return;
    const entity_id = this.entityId;
    if (this.kind === 'hvac') {
      this.hass.callService('climate', 'set_hvac_mode', { entity_id, hvac_mode: value });
    } else if (this.kind === 'fan') {
      this.hass.callService('climate', 'set_fan_mode', { entity_id, fan_mode: value });
    } else if (this.kind === 'preset') {
      this.hass.callService('climate', 'set_preset_mode', { entity_id, preset_mode: value });
    } else {
      this.hass.callService('climate', 'set_swing_mode', { entity_id, swing_mode: value });
    }
  }

  protected render(): TemplateResult | typeof nothing {
    const items = this._build();
    if (!items.length) return nothing;
    // For the HVAC mode selector, color the active chip with the active mode's
    // semantic color (cool→blue, heat→orange, …) when the Material You primary
    // token is absent — so on the default theme the modes aren't all the theme's
    // generic accent. With material-you-theme present, the M3 primary wins.
    // (The tile tint comes from each item's `color`, applied by mt-dropdown.)
    const styleOverride =
      this.kind === 'hvac'
        ? `--mt-selected-bg: var(--md-sys-color-primary, ${climateModeColor(
            this._stateObj?.state
          )}); --mt-selected-fg: var(--md-sys-color-on-primary, #fff);`
        : nothing;
    // In tile display, fall back to a sensible per-kind title ("Mode", "Fan", …)
    // so the tile reads like Google Home even without a configured label.
    const label = this.label ?? (this.display === 'tile' ? TILE_TITLE[this.kind] : undefined);
    // When the climate is off, every climate tile (fan/preset/swing too) reads as
    // off — otherwise an active fan/preset would still look "on" while the unit
    // is powered down. (items are non-empty only when the state exists.)
    const forceOff = this._stateObj!.state === 'off';
    return html`
      <mt-selector-row
        .items=${items}
        display=${this.display}
        .label=${label}
        .forceOff=${forceOff}
        style=${styleOverride}
        @item-selected=${this._onSelect}
      ></mt-selector-row>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mt-climate-selector': MtClimateSelector;
  }
}
