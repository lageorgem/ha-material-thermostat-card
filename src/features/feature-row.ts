import { LitElement, html, css, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import type { FeatureConfig } from '../types';
import './climate-selector';
import './input-select';
import './switch-group';
import './switch-list';
import './button-list';
import './entity-tile';

/**
 * Dispatches a single feature config to its renderer.
 */
@customElement('mt-feature-row')
export class MtFeatureRow extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  /** The card's climate entity (used by the climate selectors). */
  @property() entityId!: string;
  @property({ attribute: false }) feature!: FeatureConfig;
  /** Grid row this feature occupies (computed by the card). */
  @property({ type: Number }) row = 1;
  /** 1-based grid column this feature starts at (computed by the card). */
  @property({ type: Number }) colStart = 1;
  /** How many grid columns (units) this feature spans (computed by the card). */
  @property({ type: Number }) span = 1;

  /**
   * Place the host in the card's feature grid: an explicit row + column start +
   * span. The card centers each row (via colStart), so several sized features
   * share a row and narrower rows sit centered without the grid gap forcing a
   * wrap.
   * @param changed changed properties
   */
  protected willUpdate(changed: PropertyValues): void {
    if (changed.has('row') || changed.has('colStart') || changed.has('span')) {
      this.style.gridRow = String(Math.max(1, this.row));
      this.style.gridColumn = `${Math.max(1, this.colStart)} / span ${Math.max(1, this.span)}`;
    }
  }

  protected render(): TemplateResult | typeof nothing {
    const feature = this.feature;
    switch (feature.type) {
      case 'climate-hvac-modes':
      case 'climate-fan-modes':
      case 'climate-swing-modes': {
        const kind =
          feature.type === 'climate-hvac-modes'
            ? 'hvac'
            : feature.type === 'climate-fan-modes'
              ? 'fan'
              : 'swing';
        return html`<mt-climate-selector
          .hass=${this.hass}
          entityId=${this.entityId}
          kind=${kind}
          display=${feature.display ?? 'icons'}
          .options=${feature.options}
        ></mt-climate-selector>`;
      }
      case 'input-select':
        return html`<mt-input-select
          .hass=${this.hass}
          entity=${feature.entity}
          display=${feature.display ?? 'icons'}
          .label=${feature.label}
          .options=${feature.options}
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
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'mt-feature-row': MtFeatureRow;
  }
}
