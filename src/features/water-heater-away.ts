import { LitElement, html, nothing, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import { supportsFeature, isUnavailable, WaterHeaterEntityFeature } from '../entity/adapter';
import { formatAttributeName } from '../localize';
import { WATER_HEATER_AWAY_ICON } from '../theme';
import './selector-row';

/** Water-heater away-mode control, delegated to the shared selector. */
@customElement('mt-water-heater-away')
export class MtWaterHeaterAway extends LitElement {
  /** HA connection. @param hass current Home Assistant instance */
  @property({ attribute: false }) hass!: HomeAssistant;
  /** Target entity. @param entityId water-heater entity ID */
  @property() entityId!: string;
  /** Control layout. @param display icons or tile */
  @property() display: 'icons' | 'tile' = 'icons';
  /** Optional title. @param label configured title */
  @property() label?: string;

  /** Toggle the latest away state. @param this control instance */
  private _onSelect(): void {
    const s = this.hass?.states?.[this.entityId];
    if (isUnavailable(s) || !supportsFeature(s, WaterHeaterEntityFeature.AWAY_MODE) ||
      (s.attributes.away_mode !== 'on' && s.attributes.away_mode !== 'off')) return;
    this.hass.callService('water_heater', 'set_away_mode', {
      entity_id: this.entityId,
      away_mode: s.attributes.away_mode !== 'on',
    });
  }

  /** Render only supported, known away states. @param this control instance */
  protected render(): TemplateResult | typeof nothing {
    const s = this.hass?.states?.[this.entityId];
    if (!s || !supportsFeature(s, WaterHeaterEntityFeature.AWAY_MODE) ||
      (s.attributes.away_mode !== 'on' && s.attributes.away_mode !== 'off')) return nothing;
    return html`<mt-selector-row
      .items=${[{
        value: 'away',
        label: formatAttributeName(this.hass, s, 'away_mode', 'Away mode'),
        icon: WATER_HEATER_AWAY_ICON,
        active: s.attributes.away_mode === 'on',
        disabled: isUnavailable(s),
      }]}
      display=${this.display}
      .label=${this.label}
      @item-selected=${this._onSelect}
    ></mt-selector-row>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mt-water-heater-away': MtWaterHeaterAway;
  }
}
