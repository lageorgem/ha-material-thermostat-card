import { LitElement, css, html, nothing, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import { isUnavailable } from '../entity/adapter';
import { formatAttributeName, formatAttributeValue } from '../localize';
import { WATER_HEATER_AWAY_ICON } from '../theme';
import { tileStyles } from './tile-styles';
import './selector-row';

/**
 * Require the entity's explicit AWAY_MODE capability.
 * @param supportedFeatures integration-provided capability mask
 */
function supportsAway(supportedFeatures: unknown): boolean {
  return typeof supportedFeatures === 'number' && (supportedFeatures & 4) !== 0;
}

/** Water-heater away-mode toggle, rendered as an icon chip or native tile. */
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
    if (isUnavailable(s) || !supportsAway(s.attributes.supported_features) ||
      (s.attributes.away_mode !== 'on' && s.attributes.away_mode !== 'off')) return;
    this.hass.callService('water_heater', 'set_away_mode', {
      entity_id: this.entityId,
      away_mode: s.attributes.away_mode !== 'on',
    });
  }

  /** Render only supported, known away states. @param this control instance */
  protected render(): TemplateResult | typeof nothing {
    const s = this.hass?.states?.[this.entityId];
    if (!s || !supportsAway(s.attributes.supported_features) ||
      (s.attributes.away_mode !== 'on' && s.attributes.away_mode !== 'off')) return nothing;
    if (this.display === 'tile') {
      const on = s.attributes.away_mode === 'on';
      return html`<button
        type="button"
        class=${on ? 'tile on' : 'tile'}
        aria-pressed=${String(on)}
        ?disabled=${isUnavailable(s)}
        @click=${this._onSelect}
      >
        <span class="ic" aria-hidden="true"><ha-icon icon=${WATER_HEATER_AWAY_ICON}></ha-icon></span>
        <span class="text">
          <span class="title">${this.label ?? formatAttributeName(this.hass, s, 'away_mode', 'Away mode')}</span>
          <span class="value">${formatAttributeValue(this.hass, s, 'away_mode')}</span>
        </span>
      </button>`;
    }
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

  static styles = [tileStyles, css`
    :host { display: block; }
    .tile:disabled { cursor: default; opacity: 0.5; }
    .tile:focus-visible { outline: 2px solid var(--mt-primary); outline-offset: 2px; }
    @media (prefers-reduced-motion: reduce) {
      .tile, .tile .ic { transition: none; }
    }
  `];
}

declare global {
  interface HTMLElementTagNameMap {
    'mt-water-heater-away': MtWaterHeaterAway;
  }
}
