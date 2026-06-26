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

  /**
   * Size the host as a flex item in the card's wrapping feature area: entity
   * tiles take a bounded width (so several share a row), everything else takes
   * a full row.
   * @param changed changed properties
   */
  protected willUpdate(changed: PropertyValues): void {
    if (!changed.has('feature') || !this.feature) return;
    const f = this.feature as FeatureConfig & { compact?: boolean; width?: number };
    if (f.type === 'entity-tile') {
      this.style.flex = `1 1 ${f.compact ? '76px' : '150px'}`;
      this.style.maxWidth = f.width ? `${f.width}px` : f.compact ? '120px' : 'none';
    } else {
      this.style.flex = '1 1 100%';
      this.style.maxWidth = 'none';
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
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'mt-feature-row': MtFeatureRow;
  }
}
