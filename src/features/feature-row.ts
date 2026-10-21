import { LitElement, html, css, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import type { FeatureConfig } from '../types';
import { FEATURE_GAP_PX, GRID_COLUMNS, type FeaturePlacement } from '../grid';
import './climate-selector';
import './input-select';
import './switch-group';
import './switch-list';
import './button-list';
import './entity-tile';
import './sensor-list';
import './comfort';
import './water-heater-away';

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
  /** Optional explicit placement. Unset preserves standalone auto-flow behavior. */
  @property({ attribute: false }) placement?: FeaturePlacement;
  @property({ type: Number }) gridColumns = GRID_COLUMNS;
  /** Re-report visibility after setConfig, including unchanged config identities. */
  @property({ type: Number }) visibilityRevision = 0;
  /** Shared feels-like sensors (consumed by the comfort feature). */
  @property({ attribute: false }) feelsLikeTemp?: string;
  @property({ attribute: false }) feelsLikeHumidity?: string;

  /** Whether the comfort feature currently has something to show. */
  @state() private _comfortVisible = false;

  /**
   * Whether the card's climate entity is off — so entity tiles read as off too
   * (matching the climate selectors' `forceOff` behavior).
   */
  private get _climateOff(): boolean {
    return this.hass?.states?.[this.entityId]?.state === 'off';
  }

  /**
   * Apply the card's packed placement, or a legacy auto-flow span when standalone.
   * Singleton grid areas span the row, while the host retains its original track
   * width. Comfort collapses (host hidden) until it has trustworthy data to show.
   * @param changed changed properties
   */
  protected willUpdate(changed: PropertyValues): void {
    if (changed.has('feature') && (changed.get('feature') as FeatureConfig | undefined)?.type !== 'comfort') {
      this._comfortVisible = false;
    }
    if (changed.has('span') || changed.has('placement') || changed.has('gridColumns') || changed.has('feature')) {
      const placement = this.placement;
      const singleton = placement?.singleton;
      this.style.gridColumn = placement
        ? `${singleton ? 1 : placement.column} / span ${singleton ? this.gridColumns : this.span}`
        : `span ${Math.max(1, this.span)}`;
      this.style.gridRow = placement ? `${placement.row}` : '';
      this.style.width = singleton
        ? `calc(${100 * this.span / this.gridColumns}% - ${FEATURE_GAP_PX * (1 - this.span / this.gridColumns)}px)`
        : '';
      const alignment = this.feature.alignment;
      this.style.justifySelf = singleton
        ? alignment === 'center' || alignment === 'right' ? alignment : 'left'
        : '';
    }
    this.toggleAttribute('hidden', this.feature?.type === 'comfort' && !this._comfortVisible);
  }

  /** Re-report current visibility on config replacement, even when the child is reused.
   * @param changed previous reactive property values
   */
  protected updated(changed: PropertyValues): void {
    if (this.feature.type === 'comfort' && (
      changed.has('feature') || changed.has('_comfortVisible') || changed.has('visibilityRevision')
    )) {
      this.dispatchEvent(new CustomEvent('feature-row-visibility', {
        detail: { feature: this.feature, visible: this._comfortVisible },
      }));
    }
  }

  /**
   * Track the comfort feature's self-reported visibility so the row can collapse.
   * @param e the comfort feature's feature-visibility event
   */
  private _onComfortVisibility = (e: CustomEvent<{ visible: boolean }>): void => {
    this._comfortVisible = e.detail.visible;
  };

  /** Route feature configuration to its renderer. @param this feature row */
  protected render(): TemplateResult | typeof nothing {
    const feature = this.feature;
    switch (feature.type) {
      case 'climate-hvac-modes':
      case 'climate-fan-modes':
      case 'climate-swing-modes':
      case 'climate-swing-horizontal-modes':
      case 'water-heater-operation-modes':
      case 'climate-preset-modes': {
        const kind =
          feature.type === 'climate-hvac-modes'
            ? 'hvac'
            : feature.type === 'climate-fan-modes'
              ? 'fan'
              : feature.type === 'climate-preset-modes'
                ? 'preset'
                 : feature.type === 'climate-swing-horizontal-modes'
                   ? 'swing_horizontal'
                   : feature.type === 'water-heater-operation-modes'
                     ? 'operation'
                     : 'swing';
        return html`<mt-climate-selector
          .hass=${this.hass}
          entityId=${this.entityId}
          kind=${kind}
          display=${feature.display ?? 'icons'}
          .label=${feature.label}
          .options=${feature.options}
          .order=${feature.order}
          .include=${feature.include}
        ></mt-climate-selector>`;
      }
      case 'water-heater-away-mode':
        return html`<mt-water-heater-away
          .hass=${this.hass}
          entityId=${this.entityId}
          display=${feature.display ?? 'icons'}
          .label=${feature.label}
        ></mt-water-heater-away>`;
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
        return html`<mt-entity-tile
          .hass=${this.hass}
          .config=${feature}
          .forceOff=${this._climateOff}
        ></mt-entity-tile>`;
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
