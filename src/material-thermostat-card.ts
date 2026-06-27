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
  UNIT_PX,
  MIN_FEATURE_UNITS,
  MAX_UNITS,
  DIAL_UNITS,
  SIDE_BY_SIDE_MIN_UNITS,
  TILE_DEFAULT_UNITS,
  TILE_COMPACT_UNITS,
  CARD_PADDING_X,
  unitsToPx,
} from './grid';
import { tokens, climateModeColor, prettyLabel } from './theme';
import type { FeatureConfig, MaterialThermostatCardConfig } from './types';
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
});

const SERVICE_DEBOUNCE_MS = 600;
/** The dial's max rendered size (matches `.dial` max-width in the dial component). */
const DIAL_MAX_PX = 320;
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
    for (const f of this._config.features ?? []) {
      if ('entity' in f && f.entity) ids.add(f.entity);
      if ('entities' in f) f.entities?.forEach((e) => ids.add(e.entity));
      if ('items' in f) f.items?.forEach((e) => ids.add(e.entity));
    }
    return [...ids];
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
   * The span a feature wants, in grid units, capped at `budget`:
   *  - an explicit `width` wins (clamped to `[2, budget]`);
   *  - an entity tile defaults to a compact/normal footprint;
   *  - any other feature (selectors, lists) is flexible → `null` (a full row).
   * @param f the feature config
   * @param budget the available grid width, in units
   */
  private _featureSpan(f: FeatureConfig, budget: number): number | null {
    const clamp = (n: number): number =>
      Math.max(MIN_FEATURE_UNITS, Math.min(budget, Math.round(n)));
    if ('width' in f && typeof f.width === 'number' && f.width > 0) return clamp(f.width);
    if (f.type === 'entity-tile') return clamp(f.compact ? TILE_COMPACT_UNITS : TILE_DEFAULT_UNITS);
    return null; // flexible: spans the full row
  }

  /**
   * Pack the features into rows and compute each one's flex sizing. The rule:
   *  - a **flexible** feature (selector/list, no explicit width) takes its own
   *    row and fills it;
   *  - **sized** features pack greedily into a row until it's full, then the row
   *    fills the card width with each item growing in proportion to its `width`
   *    (so two `width: 8` items are 50/50 and two `width: 9` are 50/50 — equal,
   *    edge to edge, regardless of the card's exact pixel width);
   *  - a **lone** sized feature does NOT stretch — it's `width / budget` of the
   *    card (a `width: 3` feature stays small), centered.
   * Greedy-overflow packing (the item that crosses `budget` still joins the row,
   * then a new row starts) keeps a pair together even when their nominal widths
   * slightly exceed the measured unit-width — flex then shrinks them to fit.
   * @param budget the available width, in grid units
   */
  private _packRows(budget: number): Array<{
    justify?: string;
    items: Array<{ idx: number; flex: string }>;
  }> {
    const feats = this._config.features ?? [];
    type Item = { idx: number; width: number; flexible: boolean };
    type Row = { items: Item[]; sum: number };
    const rows: Row[] = [];
    let cur: Row | null = null;
    const flush = (): void => {
      if (cur && cur.items.length) rows.push(cur);
      cur = null;
    };
    feats.forEach((f, idx) => {
      const span = this._featureSpan(f, budget);
      if (span == null) {
        flush();
        rows.push({ items: [{ idx, width: budget, flexible: true }], sum: budget });
      } else {
        if (cur && cur.sum >= budget) flush(); // current row already full
        if (!cur) cur = { items: [], sum: 0 };
        cur.items.push({ idx, width: span, flexible: false });
        cur.sum += span;
      }
    });
    flush();

    return rows.map((r) => {
      if (r.items.length === 1) {
        const it = r.items[0];
        if (it.flexible) return { items: [{ idx: it.idx, flex: '1 1 auto' }] };
        // Lone sized feature → a fraction of the card, centered (not stretched).
        const pct = Math.min(100, Math.max(1, Math.round((it.width / Math.max(1, budget)) * 100)));
        return { justify: 'center', items: [{ idx: it.idx, flex: `0 0 ${pct}%` }] };
      }
      // Shared row → each item grows in proportion to its width and fills the row.
      return { items: r.items.map((it) => ({ idx: it.idx, flex: `${it.width} 1 0` })) };
    });
  }

  /**
   * Resolve the layout for the current width: stacked (narrow) or side-by-side
   * (wide). In the wide format the circular controls stay anchored in their
   * fixed-width left corner and the feature area expands to fill the rest of the
   * card. Feature rows are flex rows whose items fill in proportion to their
   * widths (see {@link _packRows}).
   */
  private _layout(): {
    wide: boolean;
    dialStyle: StyleInfo;
    featureStyle: StyleInfo;
    rows: Array<{ justify?: string; items: Array<{ idx: number; flex: string }> }>;
  } {
    const feats = this._config.features ?? [];
    const avail = Math.min(MAX_UNITS, Math.max(1, Math.round(this._widthPx / UNIT_PX)));
    const wide = this._widthPx > 0 && feats.length > 0 && avail >= SIDE_BY_SIDE_MIN_UNITS;
    // Stacked: features span the full width. Wide: the dial keeps its fixed
    // corner footprint and the feature region fills the rest of the card.
    const budget = wide ? Math.max(MIN_FEATURE_UNITS, avail - DIAL_UNITS) : Math.max(1, avail);
    const rows = this._packRows(budget);
    if (!wide) {
      // The dial is a square but its ring leaves a ~15% empty band at the bottom
      // (the 270° gap, where the +/- sit). Crop it with a negative margin so the
      // gap from the controls to the feature rows matches the inter-row gap.
      const dialPx = Math.min(this._widthPx, DIAL_MAX_PX);
      const crop = Math.round(DIAL_BOTTOM_GAP * dialPx);
      return { wide: false, dialStyle: { marginBottom: `-${crop}px` }, featureStyle: {}, rows };
    }
    return {
      wide: true,
      dialStyle: { flex: `0 0 ${unitsToPx(DIAL_UNITS)}px` },
      featureStyle: { flex: '1 1 0' },
      rows,
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
                ${layout.rows.map(
                  (row) => html`<div
                    class="frow"
                    style=${styleMap(row.justify ? { justifyContent: row.justify } : {})}
                  >
                    ${row.items.map(
                      (it) => html`<mt-feature-row
                        .hass=${this.hass}
                        .entityId=${this._config.entity}
                        .feature=${this._config.features![it.idx]}
                        .flex=${it.flex}
                      ></mt-feature-row>`
                    )}
                  </div>`
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
      /* Side-by-side (wide): the dial stays anchored in its fixed-width left
         corner and the feature region (flex:1) fills the rest of the card. */
      .body.wide {
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        gap: 16px;
      }
      .dial-wrap {
        box-sizing: border-box;
        display: flex;
        justify-content: center;
        min-width: 0;
      }
      /* Feature area: a column of flex rows. Within a row, items grow in
         proportion to their width (flex-grow with a 0 basis), so a shared row
         fills the card and equal items split it evenly; a lone sized item gets a
         fixed fraction basis instead (set inline by _packRows). */
      .features {
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 12px;
        min-width: 0;
      }
      .frow {
        display: flex;
        align-items: center;
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
