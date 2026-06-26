import { LitElement, html, css, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import type { FeatureConfig } from '../types';
import { unitsToPx, TILE_DEFAULT_UNITS, TILE_COMPACT_UNITS } from '../grid';
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
   * Size the host as a flex item in the card's wrapping feature area. Widths are
   * expressed in internal grid units (1 unit = 1 icon), never pixels:
   *  - an explicit `width` (units) → the host is exactly that many units wide,
   *    so several features can share a row;
   *  - an entity tile with no width → a sensible default (compact packs tighter,
   *    a normal tile grows to fill the row);
   *  - any other feature with no width → a full row.
   * @param changed changed properties
   */
  protected willUpdate(changed: PropertyValues): void {
    if (!changed.has('feature') || !this.feature) return;
    const f = this.feature as FeatureConfig & { compact?: boolean; width?: number };
    const units = typeof f.width === 'number' && f.width > 0 ? f.width : undefined;
    if (units) {
      // Exact size (no grow/shrink) so features pack predictably and wrap rather
      // than squish; capped so they never exceed the bounded feature column.
      const px = unitsToPx(units);
      this.style.flex = `0 0 ${px}px`;
      this.style.maxWidth = '100%';
    } else if (f.type === 'entity-tile') {
      const basis = unitsToPx(f.compact ? TILE_COMPACT_UNITS : TILE_DEFAULT_UNITS);
      this.style.flex = `1 1 ${basis}px`;
      // Compact tiles stay small (pack many per row); normal tiles grow to fill.
      this.style.maxWidth = f.compact ? `${basis}px` : 'none';
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
