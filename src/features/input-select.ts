import { LitElement, html, nothing, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import type { FeatureDisplay, OptionOverride, SelectorItem } from '../types';
import { prettyLabel } from '../theme';
import './selector-row';

/**
 * A selector bound to an `input_select` entity. Options come from the entity's
 * `options` attribute; per-option label/icon/hide overrides come from config.
 * Selecting an option calls `input_select.select_option`.
 */
@customElement('mt-input-select')
export class MtInputSelect extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property() entity!: string;
  @property() display: FeatureDisplay = 'icons';
  @property() label?: string;
  @property({ attribute: false }) options?: OptionOverride[];

  private get _stateObj() {
    return this.hass?.states?.[this.entity];
  }

  /** Lookup of per-option overrides keyed by value. */
  private _overrideMap(): Map<string, OptionOverride> {
    const map = new Map<string, OptionOverride>();
    (this.options ?? []).forEach((o) => map.set(o.value, o));
    return map;
  }

  /** Build selector items from the entity's options + overrides. */
  private _build(): SelectorItem[] {
    const state = this._stateObj;
    if (!state) return [];
    const overrides = this._overrideMap();
    const options: string[] = state.attributes.options ?? [];
    return options
      .filter((v) => !overrides.get(v)?.hide)
      .map((v) => ({
        value: v,
        label: overrides.get(v)?.label ?? prettyLabel(v),
        icon: overrides.get(v)?.icon,
        active: v === state.state,
      }));
  }

  /**
   * Select the chosen option.
   * @param e selector-row's item-selected event
   */
  private _onSelect(e: CustomEvent): void {
    if (!this._stateObj) return;
    this.hass.callService('input_select', 'select_option', {
      entity_id: this.entity,
      option: e.detail.value,
    });
  }

  protected render(): TemplateResult | typeof nothing {
    const items = this._build();
    if (!items.length) return nothing;
    return html`<mt-selector-row
      .items=${items}
      display=${this.display}
      .label=${this.label}
      @item-selected=${this._onSelect}
    ></mt-selector-row>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mt-input-select': MtInputSelect;
  }
}
