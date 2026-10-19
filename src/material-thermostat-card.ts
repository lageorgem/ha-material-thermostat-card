import { LitElement, html, css, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import {
  type HomeAssistant,
  type LovelaceCard,
  type LovelaceCardEditor,
  fireEvent,
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
import { tokens, climateModeColor, waterHeaterModeColor, presetIcon, presetColor } from './theme';
import { primaryDomain, targetModel, temperatureServiceCall, dialColorMode, hvacAction, isUnavailable } from './entity/adapter';
import { entityDisplayName, formatEntityState, formatAttributeValue, formatNumber, localizeKey } from './localize';
import { normalizeConfig } from './config/normalize';
import { applyCardTheme } from './apply-theme';
import type {
  ClimateModesFeatureConfig,
  ClimatePresetFeatureConfig,
  FeatureConfig,
  MaterialThermostatCardConfig,
} from './types';
import { feelsLikeC } from './calc/comfort-metrics';
import { parseReading, sensorTempUnit, systemTempUnit, toCelsius, fromCelsius } from './calc/units';
import { registerMtIcons } from './register-icons';
import { ensureGoogleSansFlex } from './font';
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
  // Suggest this card for supported entities in the "Suggested cards" picker
  // (Home Assistant 2026.6+; ignored on older versions).
  getEntitySuggestion: (_hass: HomeAssistant, entityId: string) =>
    primaryDomain(entityId)
      ? { config: { type: `custom:${CARD_TYPE}`, entity: entityId } }
      : null,
});

const SERVICE_DEBOUNCE_MS = 600;
const RESYNC_MS = 3000;
/** HA presentation dependencies, including frontend APIs absent from older helper types. */
const HASS_PRESENTATION_KEYS = [
  'language', 'locale', 'localize', 'formatEntityState',
  'formatEntityAttributeValue', 'formatEntityAttributeName', 'formatEntityName',
] as const;
type PresentationHass = HomeAssistant & Partial<Record<typeof HASS_PRESENTATION_KEYS[number], unknown>>;
let nextNameId = 0;
/** Fraction of halo/minimal dial height safe to crop below +/- (bottom edge ~93.5%). */
const DIAL_BOTTOM_GAP = 0.065;
/** Fraction safe to crop below the google dial's disc (bottom edge ~96.4%). */
const DIAL_BOTTOM_GAP_DISC = 0.035;

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
  private _resyncTimer?: number;
  private _commitVersion = 0;
  private readonly _nameId = `mt-name-${++nextNameId}`;
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
    const entities = Object.keys(hass.states);
    const entity = entities.find((e) => e.startsWith('climate.')) ??
      entities.find((e) => e.startsWith('water_heater.')) ?? '';
    return {
      type: `custom:${CARD_TYPE}`,
      entity,
      features: [{ type: primaryDomain(entity) === 'water_heater' ? 'water-heater-operation-modes' : 'climate-hvac-modes' }],
    };
  }

  /**
   * Validate and store the card configuration.
   * @param config the Lovelace card config
   */
  public setConfig(config: MaterialThermostatCardConfig): void {
    if (!primaryDomain(config.entity)) {
      throw new Error('Specify an entity from within the climate or water_heater domain');
    }
    if (this._config?.entity !== config.entity) this._clearPendingTarget();
    this._config = normalizeConfig(config);
    if (config.font !== 'theme') ensureGoogleSansFlex();
  }

  /** Estimate height using only domain-compatible features.
   * @param none No parameters.
   */
  public getCardSize(): number {
    return 7 + this._features.length;
  }

  /** Let sections measure the content instead of allocating fixed-height rows.
   * @param none No parameters.
   */
  public getGridOptions(): { columns: number; min_columns: number; rows: 'auto' } {
    return { columns: 12, min_columns: 6, rows: 'auto' };
  }

  /** Features compatible with the configured primary domain.
   * @param none No parameters.
   */
  private get _features(): FeatureConfig[] {
    const domain = primaryDomain(this._config?.entity);
    return (this._config?.features ?? []).filter((feature) => {
      if (feature.type.startsWith('climate-') || feature.type === 'comfort') return domain === 'climate';
      if (feature.type.startsWith('water-heater-')) return domain === 'water_heater';
      return true;
    });
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
   * value in the system unit when enabled and both sensors read numerically,
   * else the climate's own
   * `current_temperature`.
   * @param fallback the climate entity's current_temperature
   */
  private _displayCurrent(fallback: number | undefined): number | undefined {
    const fl = this._config.feels_like;
    if (primaryDomain(this._config.entity) === 'water_heater' || !fl?.show_as_current || !fl.temperature || !fl.humidity) return fallback;
    const t = parseReading(this.hass?.states?.[fl.temperature]?.state);
    const rh = parseReading(this.hass?.states?.[fl.humidity]?.state);
    if (t === undefined || rh === undefined) return fallback;
    const tC = toCelsius(t, sensorTempUnit(this.hass, fl.temperature));
    return fromCelsius(feelsLikeC(tC, rh), systemTempUnit(this.hass));
  }

  /** Update for tracked entities, local state, the configured theme, or changed
   * HA language, locale, translation/formatter functions, and unit-system identities.
   * Unrelated entity updates with unchanged presentation dependencies stay skipped.
   * @param changed previous reactive property values
   */
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
      if (HASS_PRESENTATION_KEYS.some((key) => (old as PresentationHass)[key] !== (this.hass as PresentationHass)[key])) return true;
      if (old.config?.unit_system !== this.hass.config?.unit_system) return true;
      if (this._config.theme && old.themes !== this.hass.themes) return true;
      return this._trackedEntityIds().some((id) => old.states[id] !== this.hass.states[id]);
    }
    return false;
  }

  protected updated(changed: PropertyValues): void {
    if (changed.has('hass') || changed.has('_config')) {
      const old = changed.get('hass') as HomeAssistant | undefined;
      if (
        (this._config?.theme || changed.has('_config')) &&
        (!old || old.themes !== this.hass.themes || changed.has('_config'))
      ) {
        applyCardTheme(this, this.hass?.themes, this._config?.theme);
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
     * @param none No parameters.
   */
  private _layout(): {
    wide: boolean;
    dialStyle: StyleInfo;
    featureStyle: StyleInfo;
    gridCols: number;
  } {
    const feats = this._features;
    const cardPx = this._widthPx;
    const maxPct = feats.length ? Math.max(...feats.map((f) => this._featureWidthPct(f))) : 100;
    // Wide only when the features don't need the full width AND the leftover
    // space can still hold the dial at a sensible size.
    const leftoverPx = (cardPx * (100 - maxPct)) / 100;
    const wide =
      feats.length > 0 && maxPct < 100 && cardPx >= WIDE_MIN_PX && leftoverPx >= DIAL_MIN_PX;

    if (!wide) {
      // Crop only the empty bottom band, preserving the google style's disc.
      const dialPx = Math.min(cardPx, DIAL_MAX_PX);
      const gap = this._config.dial_style === 'google' ? DIAL_BOTTOM_GAP_DISC : DIAL_BOTTOM_GAP;
      const crop = Math.round(gap * dialPx);
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

  /**
    * Bind the dial interaction to its entity and target kind before debouncing.
   * @param none No parameters.
   */
  private _scheduleCommit(): void {
    this._cancelResync();
    if (this._debounceTimer) window.clearTimeout(this._debounceTimer);
    const entityId = this._config.entity;
    const origin = this.hass.states[entityId];
    const kind = origin && targetModel(origin, this.hass.config?.unit_system?.temperature ?? '°C').kind;
    this._debounceTimer = window.setTimeout(() => {
      this._debounceTimer = undefined;
      const stateObj = this.hass.states[entityId];
      if (this._config.entity !== entityId || !stateObj) {
        this._clearPendingTarget();
        return;
      }
      const model = targetModel(stateObj, this.hass.config?.unit_system?.temperature ?? '°C');
      if (kind === 'none' || model.kind !== kind) {
        this._clearPendingTarget();
        return;
      }
      const call = temperatureServiceCall(stateObj, kind, {
        value: this._selectedTemp ?? model.value,
        low: this._selectedLow ?? model.low,
        high: this._selectedHigh ?? model.high,
      });
      const version = this._commitVersion;
      const sent = kind === 'dual'
        ? { _selectedLow: this._selectedLow, _selectedHigh: this._selectedHigh }
        : { _selectedTemp: this._selectedTemp };
      const rollback = (): void => {
        if (version !== this._commitVersion) return;
        for (const key of Object.keys(sent) as (keyof typeof sent)[]) {
          if (this[key] === sent[key]) this[key] = undefined;
        }
      };
      Promise.resolve(this.hass.callService(call.domain, call.service, call.data)).then(
        () => {
          if (version !== this._commitVersion) return;
          this._resyncTimer = window.setTimeout(rollback, RESYNC_MS);
        },
        (error: unknown) => {
          rollback();
          console.warn('Temperature update failed:', error instanceof Error ? error.message : String(error));
        }
      );
    }, SERVICE_DEBOUNCE_MS);
  }

  /** Cancel pending temperature work and clear every optimistic target.
   * @param none No parameters.
   */
  private _clearPendingTarget(): void {
    window.clearTimeout(this._debounceTimer);
    this._debounceTimer = undefined;
    this._cancelResync();
    this._selectedTemp = undefined;
    this._selectedLow = undefined;
    this._selectedHigh = undefined;
  }

  /** Invalidate older service results and cancel their resync deadline.
   * @param none No parameters.
   */
  private _cancelResync(): void {
    this._commitVersion++;
    window.clearTimeout(this._resyncTimer);
    this._resyncTimer = undefined;
  }

  /**
   * Handle live drag updates (optimistic, no service call yet).
   * @param e the dial's value-changing event
   */
  private _onChanging(e: CustomEvent): void {
    this._cancelResync();
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
     * @param none No parameters.
   */
  private _presetIcon(): string | undefined {
    const feat = this._features.find((f) => f.type === 'climate-preset-modes') as
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
     * @param none No parameters.
   */
  private _hvacColors(): Record<string, string> {
    const feat = this._features.find((f) => f.type === 'climate-hvac-modes') as
      | ClimateModesFeatureConfig
      | undefined;
    const map: Record<string, string> = {};
    for (const o of feat?.options ?? []) {
      if (o.color) map[o.value] = o.color;
    }
    return map;
  }

  /**
   * Per-mode icon overrides from the HVAC modes feature for the dial markers.
   * The last option for a value wins, matching the selector; missing or empty
     * icons leave the dial's built-in default in place.
     * @param none No parameters.
   */
  private _hvacIcons(): Record<string, string> {
    const feat = this._features.find((f) => f.type === 'climate-hvac-modes') as
      | ClimateModesFeatureConfig
      | undefined;
    const map: Record<string, string> = {};
    for (const o of feat?.options ?? []) {
      if (o.icon) map[o.value] = o.icon;
      else delete map[o.value];
    }
    return map;
  }

  /**
   * The color for the active preset icon under the dial number: the per-option
   * override, else the preset special-case color (eco→green, sleep→blue). Mirrors
     * {@link _presetIcon} — undefined when no preset icon is shown or no color applies.
     * @param none No parameters.
   */
  private _presetColor(): string | undefined {
    const feat = this._features.find((f) => f.type === 'climate-preset-modes') as
      | ClimatePresetFeatureConfig
      | undefined;
    if (!feat) return undefined;
    const preset = this._stateObj?.attributes.preset_mode;
    if (!preset || preset === 'none' || preset === 'off') return undefined;
    const override = feat.options?.find((o) => o.value === preset);
    return override?.color ?? presetColor(preset);
  }

  /** Render the normalized config and primary entity model.
   * @param none No parameters.
   */
  protected render(): TemplateResult {
    if (!this._config || !this.hass) return html``;
    const fontClass = this._config.font === 'theme' ? '' : 'font-rounded';
    const state = this._stateObj;
    if (!state) {
      return html`<ha-card class=${fontClass}
        ><div class="error">${this.hass.localize?.('ui.panel.lovelace.warning.entity_not_found', 'entity', this._config.entity) || `Entity not found: ${this._config.entity}`}</div></ha-card
      >`;
    }

    const a = state.attributes;
    const name = entityDisplayName(this.hass, state, this._config.entity, this._config.name);
    const unavailable = isUnavailable(state);
    const unit = this.hass.config?.unit_system?.temperature ?? '°C';
    const model = targetModel(state, unit);
    const colorMode = dialColorMode(state);
    const waterHeater = primaryDomain(this._config.entity) === 'water_heater';
    const operationFeature = this._features.find((f) => f.type === 'water-heater-operation-modes');
    const activeColor = waterHeater
      ? operationFeature?.options?.find((o) => o.value === state.state)?.color ?? waterHeaterModeColor(state.state)
      : climateModeColor(colorMode);
    const modeColors = waterHeater ? { heat: activeColor } : this._hvacColors();
    const action = hvacAction(state);
    const modeLabel = formatEntityState(this.hass, state);
    const stateLabel = this._config.show_state_label
      ? action && action !== 'off' ? formatAttributeValue(this.hass, state, 'hvac_action') : modeLabel
      : undefined;
    const features = this._features;
    const layout = this._layout();

    return html`
      <ha-card role="group" aria-labelledby=${this._nameId} class=${fontClass} style=${`--mt-active-color: ${activeColor}`}>
        <div class="header">
          <div class="name" id=${this._nameId} title=${name}>${name}</div>
          <button class="more" aria-label=${localizeKey(this.hass, 'ui.panel.lovelace.cards.show_more_info', 'More information')} @click=${this._showMoreInfo}>
            <ha-icon icon="mdi:dots-vertical"></ha-icon>
          </button>
        </div>

        <div class=${`body ${layout.wide ? 'wide' : 'stacked'}`}>
          <div class="dial-wrap" style=${styleMap(layout.dialStyle)}>
            <mt-circular-dial
              .dialStyle=${this._config.dial_style ?? 'halo'}
              .value=${this._selectedTemp ?? model.value ?? model.min}
              .min=${model.min}
              .max=${model.max}
              .step=${model.step}
              .current=${this._displayCurrent(a.current_temperature)}
              .mode=${colorMode}
              .hvacAction=${action}
              .modeLabel=${modeLabel}
              .stateLabel=${stateLabel}
              .formatNumber=${(value: number, decimals: number) => formatNumber(this.hass, value, decimals)}
              .presetIcon=${this._presetIcon()}
              .presetIconColor=${this._presetColor()}
              .modeColors=${modeColors}
              .modeIcons=${this._hvacIcons()}
              .unit=${unit}
              .dual=${model.kind === 'dual'}
              .readonly=${model.kind === 'none'}
              .lowValue=${this._selectedLow ?? model.low}
              .highValue=${this._selectedHigh ?? model.high}
              .showCurrentAsPrimary=${this._config.show_current_as_primary ?? false}
              .disabled=${unavailable}
              @value-changing=${this._onChanging}
              @value-changed=${this._onChanged}
            ></mt-circular-dial>
          </div>

          ${features.length
            ? html`<div
                class="features"
                style=${styleMap({
                  ...layout.featureStyle,
                  gridTemplateColumns: `repeat(${layout.gridCols}, minmax(0, 1fr))`,
                })}
              >
                ${features.map(
                  (feature: FeatureConfig) =>
                    html`<mt-feature-row
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
      .font-rounded {
        --mt-centre-weight: 450;
        --mt-centre-axes: "ROND" 100, "opsz" 14;
        --mt-label-weight: 400;
        font-family:
          'Google Sans Flex',
          var(--ha-font-family-body, var(--primary-font-family, Roboto, Noto, sans-serif));
        font-variation-settings: 'ROND' 100;
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

  /** Release observers, drop unsent commits, and clear optimistic targets before reconnect.
   * @param none No parameters.
   */
  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._clearPendingTarget();
    this._resizeObserver?.disconnect();
    this._resizeObserver = undefined;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'material-thermostat-card': MaterialThermostatCard;
  }
}
