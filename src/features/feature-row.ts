import { LitElement, html, css, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import type { FeatureConfig } from '../types';
import './climate-selector';
import './input-select';
import './switch-group';
import './switch-list';
import './button-list';
import './entity-tile';
import './sensor-list';
import './comfort';

/**
 * Dispatches a single feature config to its renderer.
 */
@customElement('mt-feature-row')
export class MtFeatureRow extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  /** The card's climate entity (used by the climate selectors). */
  @property() entityId!: string;
  @property({ attribute: false }) feature!: FeatureConfig;
  /** Column span within the card's feature grid (1–10, computed by the card). */
  @property({ type: Number }) span = 10;
  /** Shared feels-like sensors (consumed by the comfort feature). */
  @property({ attribute: false }) feelsLikeTemp?: string;
  @property({ attribute: false }) feelsLikeHumidity?: string;

  /** Whether the comfort feature currently has something to show. */
  @state() private _comfortVisible = false;

  /**
   * Size the host to its column span. The card's feature grid auto-flows these,
   * wrapping to a new row when a feature's span doesn't fit in the remaining
   * columns. The comfort row collapses (host hidden) until it has trustworthy
   * data to show.
   * @param changed changed properties
   */
  protected willUpdate(changed: PropertyValues): void {
    if (changed.has('span')) this.style.gridColumn = `span ${Math.max(1, this.span)}`;
    this.toggleAttribute('hidden', this.feature?.type === 'comfort' && !this._comfortVisible);
  }

  /**
   * Track the comfort feature's self-reported visibility so the row can collapse.
   * @param e the comfort feature's feature-visibility event
   */
  private _onComfortVisibility = (e: CustomEvent): void => {
    this._comfortVisible = !!e.detail.visible;
  };

  protected render(): TemplateResult | typeof nothing {
    const feature = this.feature;
    switch (feature.type) {
      case 'climate-hvac-modes':
      case 'climate-fan-modes':
      case 'climate-swing-modes':
      case 'climate-preset-modes': {
        const kind =
          feature.type === 'climate-hvac-modes'
            ? 'hvac'
            : feature.type === 'climate-fan-modes'
              ? 'fan'
              : feature.type === 'climate-preset-modes'
                ? 'preset'
                : 'swing';
        return html`<mt-climate-selector
          .hass=${this.hass}
          entityId=${this.entityId}
          kind=${kind}
          display=${feature.display ?? 'icons'}
          .label=${feature.label}
          .options=${feature.options}
          .order=${feature.order}
        ></mt-climate-selector>`;
      }
      case 'input-select':
        return html`<mt-input-select
          .hass=${this.hass}
          entity=${feature.entity}
          display=${feature.display ?? 'icons'}
          .label=${feature.label}
          .options=${feature.options}
          .order=${feature.order}
        ></mt-input-select>`;
      case 'switch-group':
        return html`<mt-switch-group
          .hass=${this.hass}
          .entities=${feature.entities}
          display=${feature.display ?? 'icons'}
          .label=${feature.label}
        ></mt-switch-group>`;
      case 'switch-list':
        return html`<mt-switch-list
          .hass=${this.hass}
          .entities=${feature.entities}
          .label=${feature.label}
        ></mt-switch-list>`;
      case 'button-list':
        return html`<mt-button-list
          .hass=${this.hass}
          .items=${feature.items}
          .label=${feature.label}
        ></mt-button-list>`;
      case 'entity-tile':
        return html`<mt-entity-tile .hass=${this.hass} .config=${feature}></mt-entity-tile>`;
      case 'sensor-list':
        return html`<mt-sensor-list
          .hass=${this.hass}
          .items=${feature.items}
          .label=${feature.label}
        ></mt-sensor-list>`;
      case 'comfort':
        return html`<mt-comfort
          .hass=${this.hass}
          entityId=${this.entityId}
          .feature=${feature}
          .tempSensor=${this.feelsLikeTemp}
          .humiditySensor=${this.feelsLikeHumidity}
          @feature-visibility=${this._onComfortVisibility}
        ></mt-comfort>`;
      default:
        return nothing;
    }
  }

  static styles = css`
    :host {
      display: block;
      /* allow shrinking below content so a wide icon list wraps/scrolls inside
         its column instead of overflowing the card */
      min-width: 0;
    }
    :host([hidden]) {
      display: none;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'mt-feature-row': MtFeatureRow;
  }
}
