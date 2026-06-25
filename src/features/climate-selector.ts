import { LitElement, html, nothing, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import type { FeatureDisplay, OptionOverride, SelectorItem } from '../types';
import { HVAC_MODE_ICONS, fanIcon, swingIcon, prettyLabel } from '../theme';
import './selector-row';

export type ClimateSelectorKind = 'hvac' | 'fan' | 'swing';

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
  @property({ attribute: false }) options?: OptionOverride[];

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

    if (this.kind === 'hvac') {
      values = state.attributes.hvac_modes ?? [];
      active = state.state;
      defaultIcon = (v) => HVAC_MODE_ICONS[v] ?? 'mdi:thermostat';
    } else if (this.kind === 'fan') {
      values = state.attributes.fan_modes ?? [];
      active = state.attributes.fan_mode;
      defaultIcon = (v) => fanIcon(v);
    } else {
      values = state.attributes.swing_modes ?? [];
      active = state.attributes.swing_mode;
      defaultIcon = (v) => swingIcon(v);
    }

    return values
      .filter((v) => !overrides.get(v)?.hide)
      .map((v) => ({
        value: v,
        label: overrides.get(v)?.label ?? prettyLabel(v),
        icon: overrides.get(v)?.icon ?? defaultIcon(v),
        active: v === active,
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
    } else {
      this.hass.callService('climate', 'set_swing_mode', { entity_id, swing_mode: value });
    }
  }

  protected render(): TemplateResult | typeof nothing {
    const items = this._build();
    if (!items.length) return nothing;
    return html`
      <mt-selector-row
        .items=${items}
        display=${this.display}
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
