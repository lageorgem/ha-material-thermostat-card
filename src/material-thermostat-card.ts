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
  GRID_COLUMNS,
  MIN_WIDTH_PCT,
  MAX_WIDTH_PCT,
  TILE_DEFAULT_PCT,
  DIAL_MAX_PX,
  DIAL_MIN_PX,
  WIDE_MIN_PX,
  CARD_PADDING_X,
  pctToSpan,
} from './grid';
import { tokens, climateModeColor, prettyLabel, presetIcon, presetColor } from './theme';
import type {
  ClimateModesFeatureConfig,
  ClimatePresetFeatureConfig,
  FeatureConfig,
  MaterialThermostatCardConfig,
} from './types';
import { feelsLikeC } from './calc/comfort-metrics';
import { registerMtIcons } from './register-icons';
import './dial/circular-dial';
import './features/feature-row';

// Make the `mt:` AC swing icons available to Home Assistant as early as possible.
registerMtIcons();

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
  // Suggest this card for climate entities in the "Suggested cards" picker
  // (Home Assistant 2026.6+; ignored on older versions).
  getEntitySuggestion: (_hass: HomeAssistant, entityId: string) =>
    entityId.split('.')[0] === 'climate'
      ? { config: { type: `custom:${CARD_TYPE}`, entity: entityId } }
      : null,
});

const SERVICE_DEBOUNCE_MS = 600;
/** Fraction of the dial height left empty below the +/- by the ring's bottom gap. */
const DIAL_BOTTOM_GAP = 0.147;

@customElement(CARD_TYPE)
export class MaterialThermostatCard extends LitElement implements LovelaceCard {
  @property({ attribute: false }) hass!: HomeAssistant;
  @state() private _config!: MaterialThermostatCardConfig;
  /** Optimistic target temperature(s) while a service call is in flight. */
  @state() private _selectedTemp?: number;
  @state() private _selectedLow?: number;
  @state() private _selectedHigh?: number;
  /** The card's inner content width in px (measured), for the grid. */
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
    const fl = this._config.feels_like;
    if (fl?.temperature) ids.add(fl.temperature);
    if (fl?.humidity) ids.add(fl.humidity);
    for (const f of this._config.features ?? []) {
      if ('entity' in f && f.entity) ids.add(f.entity);
      if ('entities' in f) f.entities?.forEach((e) => ids.add(e.entity));
      if ('items' in f) f.items?.forEach((e) => ids.add(e.entity));
    }
    return [...ids];
  }

  /**
   * The current temperature to display on the dial: the computed feels-like
   * value when enabled and both sensors read numerically, else the climate's own
   * `current_temperature`.
   * @param fallback the climate entity's current_temperature
   */
  private _displayCurrent(fallback: number | undefined): number | undefined {
    const fl = this._config.feels_like;
    if (!fl?.show_as_current || !fl.temperature || !fl.humidity) return fallback;
    const t = parseFloat(String(this.hass?.states?.[fl.temperature]?.state));
    const rh = parseFloat(String(this.hass?.states?.[fl.humidity]?.state));
    if (!isFinite(t) || !isFinite(rh)) return fallback;
    return feelsLikeC(t, rh);
  }

  protected shouldUpdate(changed: PropertyValues): boolean {
    if (
      changed.has('_config') ||
      changed.has('_selectedTemp') ||
      changed.has('_selectedLow') ||
      changed.has('_selectedHigh') ||
      changed.has('_widthPx')
    )
      return true;
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
   * Observe the card's width so the grid can recompute on resize.
   * We observe the host (which always exists), not the inner `ha-card` (absent
   * until both hass and config are set) — the inner content width is the host
   * width minus the card padding. Idempotent across disconnect/reconnect.
   */
  private _observeWidth(): void {
    if (this._resizeObserver || typeof ResizeObserver === 'undefined') return;
    this._resizeObserver = new ResizeObserver((entries) => {
      /* c8 ignore next -- ResizeObserver always delivers the observed entry */
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
   * A feature's width as a percentage of the card (10–100):
   *  - an explicit `width` wins (clamped to `[MIN_WIDTH_PCT, MAX_WIDTH_PCT]`);
   *  - an entity tile defaults to {@link TILE_DEFAULT_PCT};
   *  - any other feature (selectors, lists) defaults to full width (100%).
   * @param f the feature config
   */
  private _featureWidthPct(f: FeatureConfig): number {
    if ('width' in f && typeof f.width === 'number' && f.width > 0) {
      return Math.max(MIN_WIDTH_PCT, Math.min(MAX_WIDTH_PCT, Math.round(f.width / 10) * 10));
    }
    if (f.type === 'entity-tile') return TILE_DEFAULT_PCT;
    return MAX_WIDTH_PCT;
  }

  /** A feature's column span within a 10-column feature row (1–10). */
  private _featureSpan(f: FeatureConfig): number {
    return pctToSpan(this._featureWidthPct(f));
  }

  /**
   * Resolve the layout for the current width: stacked (narrow) or side-by-side
   * (wide). The feature area is a CSS grid whose auto-flow packs features and
   * wraps a row when the next feature's width doesn't fit. In a wide layout the
   * feature area is the widest feature's percentage (right) and the fixed-size
   * dial is centered in the remaining space (left).
   */
  private _layout(): {
    wide: boolean;
    dialStyle: StyleInfo;
    featureStyle: StyleInfo;
    gridCols: number;
  } {
    const feats = this._config.features ?? [];
    const cardPx = this._widthPx;
    const maxPct = feats.length ? Math.max(...feats.map((f) => this._featureWidthPct(f))) : 100;
    // Wide only when the features don't need the full width AND the leftover
    // space can still hold the dial at a sensible size.
    const leftoverPx = (cardPx * (100 - maxPct)) / 100;
    const wide =
      feats.length > 0 && maxPct < 100 && cardPx >= WIDE_MIN_PX && leftoverPx >= DIAL_MIN_PX;

    if (!wide) {
      // The dial is a square but its ring leaves a ~15% empty band at the bottom
      // (the 270° gap, where the +/- sit). Crop it with a negative margin so the
      // gap from the controls to the feature rows matches the inter-row gap.
      const dialPx = Math.min(cardPx, DIAL_MAX_PX);
      const crop = Math.round(DIAL_BOTTOM_GAP * dialPx);
      return {
        wide: false,
        dialStyle: { marginBottom: `-${crop}px` },
        featureStyle: {},
        gridCols: GRID_COLUMNS,
      };
    }
    // Feature area = the widest feature's percentage; the dial-wrap fills the
    // rest and centers the fixed-size dial. The grid has maxPct/10 columns, each
    // still 10% of the card, so every feature stays width% of the card.
    return {
      wide: true,
      dialStyle: { flex: '1 1 auto' },
      featureStyle: { flex: `0 0 ${maxPct}%` },
      gridCols: Math.max(1, maxPct / 10),
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

  /**
   * The icon for the active climate preset, shown under the dial number (à la
   * Google Home's eco leaf) — but only when the **preset modes** feature is
   * configured and a meaningful preset is active. A per-option icon override
   * wins; an explicit "no icon" override ('') suppresses it; otherwise the
   * heuristic {@link presetIcon} is used. Returns undefined when there's nothing
   * worth showing.
   */
  private _presetIcon(): string | undefined {
    const feat = this._config.features?.find((f) => f.type === 'climate-preset-modes') as
      | ClimatePresetFeatureConfig
      | undefined;
    if (!feat) return undefined;
    const preset = this._stateObj?.attributes.preset_mode;
    if (!preset || preset === 'none' || preset === 'off') return undefined;
    const override = feat.options?.find((o) => o.value === preset);
    if (override?.icon !== undefined) return override.icon || undefined;
    return presetIcon(preset);
  }

  /**
   * Per-mode color overrides configured on the HVAC modes feature — fed to the
   * dial so a custom mode color drives the halo, temperature and mode icon.
   * Empty when there is no HVAC feature or no color overrides.
   */
  private _hvacColors(): Record<string, string> {
    const feat = this._config.features?.find((f) => f.type === 'climate-hvac-modes') as
      | ClimateModesFeatureConfig
      | undefined;
    const map: Record<string, string> = {};
    for (const o of feat?.options ?? []) {
      if (o.color) map[o.value] = o.color;
    }
    return map;
  }

  /**
   * The color for the active preset icon under the dial number: the per-option
   * override, else the preset special-case color (eco→green, sleep→blue). Mirrors
   * {@link _presetIcon} — undefined when no preset icon is shown or no color applies.
   */
  private _presetColor(): string | undefined {
    const feat = this._config.features?.find((f) => f.type === 'climate-preset-modes') as
      | ClimatePresetFeatureConfig
      | undefined;
    if (!feat) return undefined;
    const preset = this._stateObj?.attributes.preset_mode;
    if (!preset || preset === 'none' || preset === 'off') return undefined;
    const override = feat.options?.find((o) => o.value === preset);
    return override?.color ?? presetColor(preset);
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
              .current=${this._displayCurrent(a.current_temperature)}
              .mode=${colorMode}
              .modeLabel=${unavailable ? 'Unavailable' : prettyLabel(state.state)}
              .presetIcon=${this._presetIcon()}
              .presetIconColor=${this._presetColor()}
              .modeColors=${this._hvacColors()}
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
            ? html`<div
                class="features"
                style=${styleMap({
                  ...layout.featureStyle,
                  gridTemplateColumns: `repeat(${layout.gridCols}, minmax(0, 1fr))`,
                })}
              >
                ${this._config.features.map(
                  (feature: FeatureConfig) => html`<mt-feature-row
                    .hass=${this.hass}
                    .entityId=${this._config.entity}
                    .feature=${feature}
                    .span=${this._featureSpan(feature)}
                    .feelsLikeTemp=${this._config.feels_like?.temperature}
                    .feelsLikeHumidity=${this._config.feels_like?.humidity}
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
        /* bottom padding equals the inter-control gap (see .body.stacked) */
        padding: 12px 16px 12px;
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
      /* Stacked (narrow): controls above a full-width feature area. The gap here
         (dial → first control row) matches the inter-row gap and bottom padding
         so the spacing below the dial is even. */
      .body.stacked {
        flex-direction: column;
        gap: 12px;
      }
      /* Side-by-side (wide): the feature area takes the widest feature's % on the
         right; the dial-wrap fills the rest and centers the fixed-size dial. */
      .body.wide {
        flex-direction: row;
        align-items: center;
        gap: 16px;
      }
      .dial-wrap {
        box-sizing: border-box;
        display: flex;
        justify-content: center;
        min-width: 0;
      }
      /* Feature area: a 10-column grid (each column = 10% of the row). A feature
         spans width/10 columns; the grid's auto-flow packs them and wraps a row
         when the next feature's span doesn't fit. */
      .features {
        box-sizing: border-box;
        display: grid;
        align-content: flex-start;
        gap: 12px;
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
