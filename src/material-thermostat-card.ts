import { LitElement, html, css, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import {
  type HomeAssistant,
  type LovelaceCard,
  type LovelaceCardEditor,
  fireEvent,
  applyThemesOnElement,
} from 'custom-card-helpers';
import { styleMap, type StyleInfo } from 'lit/directives/style-map.js';
import { CARD_TYPE, EDITOR_TYPE, CARD_NAME, CARD_DESCRIPTION, CARD_VERSION } from './const';
import {
  SECTION_UNIT_PX,
  INTERNAL_UNIT_PX,
  MAX_INTERNAL_UNITS,
  DIAL_INTERNAL_UNITS,
  SIDE_BY_SIDE_MIN_UNITS,
  DROPDOWN_UNITS,
  TILE_UNITS,
  CARD_PADDING_X,
  unitsToPx,
} from './grid';
import { tokens, climateModeColor, prettyLabel } from './theme';
import type { FeatureConfig, MaterialThermostatCardConfig, OptionOverride } from './types';
import './dial/circular-dial';
import './features/feature-row';

console.info(
  `%c MATERIAL-THERMOSTAT-CARD %c v${CARD_VERSION} `,
  'color: white; background: #6750a4; font-weight: 700;',
  'color: #6750a4; background: white; font-weight: 700;'
);

// Register the card in the Lovelace "add card" picker.
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: CARD_TYPE,
  name: CARD_NAME,
  description: CARD_DESCRIPTION,
  preview: true,
  documentationURL: 'https://github.com/lageorgem/ha-material-thermostat-card',
});

const SERVICE_DEBOUNCE_MS = 600;

@customElement(CARD_TYPE)
export class MaterialThermostatCard extends LitElement implements LovelaceCard {
  @property({ attribute: false }) hass!: HomeAssistant;
  @state() private _config!: MaterialThermostatCardConfig;
  /** Optimistic target temperature(s) while a service call is in flight. */
  @state() private _selectedTemp?: number;
  @state() private _selectedLow?: number;
  @state() private _selectedHigh?: number;
  /** The card's inner content width in px (measured), for the internal grid. */
  @state() private _widthPx = 0;

  private _debounceTimer?: number;
  private _resizeObserver?: ResizeObserver;

  /**
   * Lazily load and return the card's visual editor element.
   */
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import('./editor');
    return document.createElement(EDITOR_TYPE) as LovelaceCardEditor;
  }

  /**
   * Provide a starter config when the card is added from the picker.
   * @param hass the Home Assistant connection
   */
  public static getStubConfig(hass: HomeAssistant): MaterialThermostatCardConfig {
    const entity = Object.keys(hass.states).find((e) => e.startsWith('climate.')) ?? '';
    return {
      type: `custom:${CARD_TYPE}`,
      entity,
      features: [{ type: 'climate-hvac-modes' }],
    };
  }

  /**
   * Validate and store the card configuration.
   * @param config the Lovelace card config
   */
  public setConfig(config: MaterialThermostatCardConfig): void {
    if (!config.entity || config.entity.split('.')[0] !== 'climate') {
      throw new Error('You must specify a climate entity.');
    }
    this._config = config;
  }

  public getCardSize(): number {
    return 7 + (this._config?.features?.length ?? 0);
  }

  /** The backing climate state object. */
  private get _stateObj() {
    return this.hass?.states?.[this._config?.entity];
  }

  /** Entities that should trigger a re-render when their state changes. */
  private _trackedEntityIds(): string[] {
    const ids = new Set<string>([this._config.entity]);
    for (const f of this._config.features ?? []) {
      if ('entity' in f && f.entity) ids.add(f.entity);
      if ('entities' in f) f.entities?.forEach((e) => ids.add(e.entity));
      if ('items' in f) f.items?.forEach((e) => ids.add(e.entity));
    }
    return [...ids];
  }

  protected shouldUpdate(changed: PropertyValues): boolean {
    if (changed.has('_config') || changed.has('_selectedTemp')) return true;
    if (!this._config) return false;
    if (changed.has('hass')) {
      const old = changed.get('hass') as HomeAssistant | undefined;
      if (!old) return true;
      return this._trackedEntityIds().some((id) => old.states[id] !== this.hass.states[id]);
    }
    return false;
  }

  protected updated(changed: PropertyValues): void {
    if (changed.has('hass') || changed.has('_config')) {
      const old = changed.get('hass') as HomeAssistant | undefined;
      if (
        this._config?.theme &&
        (!old || old.themes !== this.hass.themes || changed.has('_config'))
      ) {
        applyThemesOnElement(this, this.hass.themes, this._config.theme);
      }
    }
    // Drop optimistic values once the server confirms them.
    if (changed.has('hass')) {
      const a = this._stateObj?.attributes;
      if (this._selectedTemp != null && a?.temperature === this._selectedTemp)
        this._selectedTemp = undefined;
      if (this._selectedLow != null && a?.target_temp_low === this._selectedLow)
        this._selectedLow = undefined;
      if (this._selectedHigh != null && a?.target_temp_high === this._selectedHigh)
        this._selectedHigh = undefined;
    }
  }

  /**
   * Observe the card's width so the internal grid can recompute on resize.
   * We observe the host (which always exists), not the inner `ha-card` (absent
   * until both hass and config are set) — the inner content width is the host
   * width minus the card padding. Idempotent across disconnect/reconnect.
   */
  private _observeWidth(): void {
    if (this._resizeObserver || typeof ResizeObserver === 'undefined') return;
    this._resizeObserver = new ResizeObserver((entries) => {
      const outer = entries[0]?.contentRect.width ?? 0;
      const inner = Math.max(0, outer - CARD_PADDING_X);
      if (Math.abs(inner - this._widthPx) >= 1) this._widthPx = inner;
    });
    this._resizeObserver.observe(this);
  }

  connectedCallback(): void {
    super.connectedCallback();
    this._observeWidth();
  }

  /**
   * Count the visible options of a selector (entity values minus hidden ones).
   * @param values the underlying option values from the entity
   * @param overrides per-option config overrides (a `hide` removes the option)
   */
  private _visibleCount(values: string[] | undefined, overrides?: OptionOverride[]): number {
    if (!values?.length) return 0;
    if (!overrides?.length) return values.length;
    const hidden = new Set(overrides.filter((o) => o.hide).map((o) => o.value));
    return values.filter((v) => !hidden.has(v)).length;
  }

  /**
   * How many internal grid units a feature wants — one unit per icon for icon
   * rows, a fixed sane width for dropdowns/tiles.
   * @param f the feature config
   */
  private _featureUnits(f: FeatureConfig): number {
    // An explicit width (in internal units) wins over the icon-count estimate.
    if ('width' in f && typeof f.width === 'number' && f.width > 0) return f.width;
    const a = this._stateObj?.attributes;
    switch (f.type) {
      case 'climate-hvac-modes':
        return f.display === 'dropdown'
          ? DROPDOWN_UNITS
          : this._visibleCount(a?.hvac_modes, f.options);
      case 'climate-fan-modes':
        return f.display === 'dropdown'
          ? DROPDOWN_UNITS
          : this._visibleCount(a?.fan_modes, f.options);
      case 'climate-swing-modes':
        return f.display === 'dropdown'
          ? DROPDOWN_UNITS
          : this._visibleCount(a?.swing_modes, f.options);
      case 'input-select':
        return f.display === 'dropdown'
          ? DROPDOWN_UNITS
          : this._visibleCount(this.hass.states[f.entity]?.attributes?.options, f.options);
      case 'switch-group':
        return f.display === 'dropdown' ? DROPDOWN_UNITS : (f.entities?.length ?? 0);
      case 'switch-list':
        return f.entities?.length ?? 0;
      case 'button-list':
        return f.items?.length ?? 0;
      case 'entity-tile':
        return TILE_UNITS;
      default:
        return 0;
    }
  }

  /** The widest internal-unit demand across all feature rows. */
  private _maxFeatureUnits(): number {
    const feats = this._config.features ?? [];
    if (!feats.length) return 0;
    return Math.max(1, ...feats.map((f) => this._featureUnits(f)));
  }

  /**
   * Resolve the internal-grid layout for the current width: stacked (narrow) or
   * side-by-side (wide). In the wide format the circular controls keep a fixed
   * 12-sections-grid footprint and any surplus from a wider side-control column
   * is distributed as padding around them, so they never appear stretched.
   */
  private _layout(): { wide: boolean; dialStyle: StyleInfo; featureStyle: StyleInfo } {
    const feats = this._config.features ?? [];
    const avail = Math.min(
      MAX_INTERNAL_UNITS,
      Math.max(1, Math.floor(this._widthPx / INTERNAL_UNIT_PX))
    );
    const wide = this._widthPx > 0 && feats.length > 0 && avail >= SIDE_BY_SIDE_MIN_UNITS;
    if (!wide) return { wide: false, dialStyle: {}, featureStyle: {} };

    // Side controls want one unit per icon (capped at half the max grid); the
    // dial column grows to match a wider feature column, padding the dial.
    let featureUnits = Math.min(this._maxFeatureUnits(), MAX_INTERNAL_UNITS / 2);
    let dialUnits = Math.max(DIAL_INTERNAL_UNITS, featureUnits);
    while (dialUnits + featureUnits > avail && featureUnits > 1) {
      featureUnits -= 1;
      dialUnits = Math.max(DIAL_INTERNAL_UNITS, featureUnits);
    }
    // Feature-3 spacing: (side-control units × 2) − 12 sections-grid units, split
    // either side of the fixed-width circular controls.
    const padPx = (dialUnits - DIAL_INTERNAL_UNITS) * SECTION_UNIT_PX;
    return {
      wide: true,
      dialStyle: { flex: `0 0 ${unitsToPx(dialUnits)}px`, paddingInline: `${padPx}px` },
      featureStyle: { flex: `0 0 ${unitsToPx(featureUnits)}px` },
    };
  }

  /** Whether the entity is using dual (heat_cool) setpoints. */
  private get _isDual(): boolean {
    const a = this._stateObj?.attributes;
    return (
      this._stateObj?.state === 'heat_cool' &&
      a?.target_temp_low != null &&
      a?.target_temp_high != null
    );
  }

  /** Current single target temperature (optimistic value wins). */
  private get _targetTemp(): number | undefined {
    return this._selectedTemp ?? this._stateObj?.attributes.temperature;
  }

  /** Current low setpoint (optimistic value wins). */
  private get _targetLow(): number | undefined {
    return this._selectedLow ?? this._stateObj?.attributes.target_temp_low;
  }

  /** Current high setpoint (optimistic value wins). */
  private get _targetHigh(): number | undefined {
    return this._selectedHigh ?? this._stateObj?.attributes.target_temp_high;
  }

  /**
   * Debounce a climate.set_temperature call using the current optimistic values.
   */
  private _scheduleCommit(): void {
    if (this._debounceTimer) window.clearTimeout(this._debounceTimer);
    this._debounceTimer = window.setTimeout(() => {
      const data: Record<string, unknown> = { entity_id: this._config.entity };
      if (this._isDual) {
        data.target_temp_low = this._targetLow;
        data.target_temp_high = this._targetHigh;
      } else {
        data.temperature = this._targetTemp;
      }
      this.hass.callService('climate', 'set_temperature', data);
    }, SERVICE_DEBOUNCE_MS);
  }

  /**
   * Handle live drag updates (optimistic, no service call yet).
   * @param e the dial's value-changing event
   */
  private _onChanging(e: CustomEvent): void {
    const { value, low, high } = e.detail;
    if (low != null || high != null) {
      this._selectedLow = low;
      this._selectedHigh = high;
    } else {
      this._selectedTemp = value;
    }
  }

  /**
   * Handle a committed temperature change.
   * @param e the dial's value-changed event
   */
  private _onChanged(e: CustomEvent): void {
    this._onChanging(e);
    this._scheduleCommit();
  }

  /** Open the entity's more-info dialog. */
  private _showMoreInfo(): void {
    fireEvent(this, 'hass-more-info', { entityId: this._config.entity });
  }

  /** Color basis for the dial: prefer the active HVAC action, else the mode. */
  private _colorMode(): string {
    const a = this._stateObj?.attributes;
    switch (a?.hvac_action) {
      case 'cooling':
        return 'cool';
      case 'heating':
        return 'heat';
      case 'drying':
        return 'dry';
      case 'fan':
        return 'fan_only';
      default:
        return this._stateObj?.state ?? 'off';
    }
  }

  protected render(): TemplateResult {
    if (!this._config || !this.hass) return html``;
    const state = this._stateObj;
    if (!state) {
      return html`<ha-card
        ><div class="error">Entity not found: ${this._config.entity}</div></ha-card
      >`;
    }

    const a = state.attributes;
    const name = this._config.name ?? a.friendly_name ?? this._config.entity;
    const unavailable = state.state === 'unavailable' || state.state === 'unknown';
    const unit = this.hass.config?.unit_system?.temperature ?? '°C';
    const colorMode = this._colorMode();
    const layout = this._layout();

    return html`
      <ha-card style=${`--mt-active-color: ${climateModeColor(colorMode)}`}>
        <div class="header">
          <div class="name" title=${name}>${name}</div>
          <button class="more" aria-label="More information" @click=${this._showMoreInfo}>
            <ha-icon icon="mdi:dots-vertical"></ha-icon>
          </button>
        </div>

        <div class=${`body ${layout.wide ? 'wide' : 'stacked'}`}>
          <div class="dial-wrap" style=${styleMap(layout.dialStyle)}>
            <mt-circular-dial
              .value=${this._targetTemp ?? a.min_temp ?? 20}
              .min=${a.min_temp ?? 7}
              .max=${a.max_temp ?? 35}
              .step=${a.target_temp_step ?? 0.5}
              .current=${a.current_temperature}
              .mode=${colorMode}
              .modeLabel=${unavailable ? 'Unavailable' : prettyLabel(state.state)}
              .unit=${unit}
              .dual=${this._isDual}
              .lowValue=${this._targetLow}
              .highValue=${this._targetHigh}
              .showCurrentAsPrimary=${this._config.show_current_as_primary ?? false}
              .disabled=${unavailable}
              @value-changing=${this._onChanging}
              @value-changed=${this._onChanged}
            ></mt-circular-dial>
          </div>

          ${this._config.features?.length
            ? html`<div class="features" style=${styleMap(layout.featureStyle)}>
                ${this._config.features.map(
                  (feature: FeatureConfig) => html`<mt-feature-row
                    .hass=${this.hass}
                    .entityId=${this._config.entity}
                    .feature=${feature}
                  ></mt-feature-row>`
                )}
              </div>`
            : nothing}
        </div>
      </ha-card>
    `;
  }

  static styles = [
    tokens,
    css`
      :host {
        display: block;
      }
      ha-card {
        padding: 12px 16px 20px;
        border-radius: var(--mt-shape-card);
        /* visible so an open dropdown menu can extend past the card edge */
        overflow: visible;
      }
      .header {
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: center;
        min-height: 36px;
      }
      .name {
        grid-column: 1 / -1;
        grid-row: 1;
        text-align: center;
        font-size: var(--md-sys-typescale-title-large-size, 20px);
        color: var(--mt-on-surface);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        padding: 0 36px;
      }
      .more {
        grid-column: 2;
        grid-row: 1;
        z-index: 1;
        width: 36px;
        height: 36px;
        border: none;
        border-radius: var(--mt-shape-full);
        background: transparent;
        color: var(--mt-on-surface-variant);
        display: grid;
        place-items: center;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .more:hover {
        background: color-mix(in srgb, var(--mt-on-surface) 8%, transparent);
      }
      .body {
        display: flex;
        margin-top: 8px;
      }
      /* Stacked (narrow): controls above a full-width feature area. */
      .body.stacked {
        flex-direction: column;
        gap: 16px;
      }
      /* Side-by-side (wide): dial and feature columns, centered as a block so
         neither over-stretches; column widths are set inline in internal units. */
      .body.wide {
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 24px;
      }
      .dial-wrap {
        box-sizing: border-box;
        display: flex;
        justify-content: center;
        min-width: 0;
      }
      .features {
        box-sizing: border-box;
        display: flex;
        flex-wrap: wrap;
        align-content: flex-start;
        gap: 10px;
        min-width: 0;
      }
      .error {
        padding: 24px;
        text-align: center;
        color: var(--mt-error);
      }
    `,
  ];

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._debounceTimer) window.clearTimeout(this._debounceTimer);
    this._resizeObserver?.disconnect();
    this._resizeObserver = undefined;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'material-thermostat-card': MaterialThermostatCard;
  }
}
