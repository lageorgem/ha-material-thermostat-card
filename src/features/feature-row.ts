import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import type { FeatureConfig } from '../types';
import './climate-selector';

/**
 * Dispatches a single feature config to its renderer. Climate selectors are
 * implemented in this phase; the custom-entity features (input_select, switch
 * group/list, button list, entity tile) land in later phases and currently
 * render nothing so an in-progress config never breaks the card.
 */
@customElement('mt-feature-row')
export class MtFeatureRow extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  /** The card's climate entity (used by the climate selectors). */
  @property() entityId!: string;
  @property({ attribute: false }) feature!: FeatureConfig;

  protected render(): TemplateResult | typeof nothing {
    const feature = this.feature;
    switch (feature.type) {
      case 'climate-hvac-modes':
        return html`<mt-climate-selector
          .hass=${this.hass}
          entityId=${this.entityId}
          kind="hvac"
          display=${feature.display ?? 'icons'}
          .options=${feature.options}
        ></mt-climate-selector>`;
      case 'climate-fan-modes':
        return html`<mt-climate-selector
          .hass=${this.hass}
          entityId=${this.entityId}
          kind="fan"
          display=${feature.display ?? 'icons'}
          .options=${feature.options}
        ></mt-climate-selector>`;
      case 'climate-swing-modes':
        return html`<mt-climate-selector
          .hass=${this.hass}
          entityId=${this.entityId}
          kind="swing"
          display=${feature.display ?? 'icons'}
          .options=${feature.options}
        ></mt-climate-selector>`;
      default:
        return nothing;
    }
  }

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'mt-feature-row': MtFeatureRow;
  }
}
