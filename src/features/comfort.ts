import { LitElement, html, css, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import type { ComfortFeatureConfig } from '../types';
import { tokens, climateModeColor } from '../theme';
import { fetchHistory, numericSeries, OFF_STATES } from '../calc/history';
import {
  analyzeComfort,
  type ComfortResult,
  type ComfortStatus,
  type TS,
} from '../calc/comfort-analysis';

/** How often the displayed ETA is recomputed (drives the live countdown). */
const TICK_MS = 30_000;
/** How often fresh history is fetched (between ticks the ETA just counts down). */
const FETCH_MS = 60_000;
/**
 * Upper bound on how far back history is fetched — a query-cost guard, not a
 * "lookback". The forecast only ever uses data since the current session began
 * (see {@link MtComfort._sessionStartMs}); a session longer than this is already
 * at steady state, so the cap never discards a still-changing trend.
 */
const MAX_SESSION_MS = 24 * 3_600_000;

/** Climate states with no usable readings at all (vs. plain "off"). */
const DEAD_STATES = new Set(['unavailable', 'unknown', '']);

/** Icon + colour per comfort state. Warm reads in the heat colour, cool/humid in
 * the cool colour (the opposite of the mode you'd switch on), comfortable green. */
const STATUS_ICON: Record<ComfortStatus, string> = {
  comfortable: 'mdi:emoticon-happy-outline',
  warm: 'mdi:thermometer-high',
  cool: 'mdi:thermometer-low',
  humid: 'mdi:water-percent',
};
const STATUS_MODE: Record<ComfortStatus, string> = {
  comfortable: 'heat_cool',
  warm: 'heat',
  cool: 'cool',
  humid: 'cool',
};

/**
 * The "comfort & time-to-comfortable" feature row. Judges comfort from the
 * shared feels-like sensors via the ASHRAE 55 / ISO 7730 PMV model and always
 * shows a verdict ("Room feels comfortable/warm/cool/humid") whenever the sensors
 * read — including when the climate is **off** — upgrading the uncomfortable
 * verdict to "…X until room feels comfortable" once there's enough current-session
 * history to forecast it (only while running), and optionally appending the time
 * until the target is reached. Shows nothing (and asks its row to collapse) only
 * when the sensors are unset or the climate is unavailable/unknown.
 */
@customElement('mt-comfort')
export class MtComfort extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  /** The card's climate entity. */
  @property() entityId!: string;
  @property({ attribute: false }) feature!: ComfortFeatureConfig;
  /** Shared feels-like temperature sensor entity id. */
  @property({ attribute: false }) tempSensor?: string;
  /** Shared feels-like humidity sensor entity id. */
  @property({ attribute: false }) humiditySensor?: string;

  @state() private _result: ComfortResult = { visible: false, comfortable: false };

  private _timer?: number;
  private _fetching = false;
  private _lastFetchMs = 0;
  /** Last fetched history series, reused for cheap recomputes on hass updates. */
  private _cache?: { tempSeries: TS[]; rhSeries: TS[] };

  connectedCallback(): void {
    super.connectedCallback();
    this._timer = window.setInterval(() => void this._tick(), TICK_MS);
  }

  /** Recompute the (counting-down) ETA every tick; fetch fresh history less often. */
  private async _tick(): Promise<void> {
    this._recompute(); // cheap: re-evaluates the live countdown, no network
    if (Date.now() - this._lastFetchMs >= FETCH_MS) await this._refresh();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._timer) window.clearInterval(this._timer);
    this._timer = undefined;
  }

  protected updated(changed: PropertyValues): void {
    if (
      changed.has('entityId') ||
      changed.has('tempSensor') ||
      changed.has('humiditySensor') ||
      changed.has('feature')
    ) {
      void this._refresh();
    } else if (changed.has('hass')) {
      // Cheap: re-judge comfort from current readings using cached history.
      this._recompute();
    }
  }

  /** The backing climate state object. */
  private get _climate() {
    return this.hass?.states?.[this.entityId];
  }

  /**
   * Current temperature: feels-like sensor, falling back to the climate's own
   * `current_temperature` when the sensor reads non-numeric. Only ever called
   * once {@link _hasReadings} has confirmed `tempSensor` is set.
   */
  private _tempNow(): number {
    const v = parseFloat(String(this.hass?.states?.[this.tempSensor!]?.state));
    return isFinite(v) ? v : Number(this._climate?.attributes?.current_temperature);
  }

  /** Current humidity reading (%). Called only once `humiditySensor` is set. */
  private _rhNow(): number {
    return parseFloat(String(this.hass?.states?.[this.humiditySensor!]?.state));
  }

  /**
   * Minutes since the temperature reading last changed — the ETA's countdown
   * anchor (the forecast is relative to that last data point). 0 when unknown.
   */
  private _staleMin(): number {
    const lc = this.hass?.states?.[this.tempSensor!]?.last_changed;
    const ms = lc ? new Date(lc).getTime() : NaN;
    return isFinite(ms) ? Math.max(0, (Date.now() - ms) / 60000) : 0;
  }

  /**
   * Resolve the relevant target setpoint, or null when at/within the band. Only
   * called once {@link _hasReadings} has confirmed the climate entity exists.
   */
  private _target(tempNow: number): number | null {
    const a = this._climate!.attributes;
    if (
      this._climate!.state === 'heat_cool' &&
      a.target_temp_low != null &&
      a.target_temp_high != null
    ) {
      if (tempNow < a.target_temp_low) return Number(a.target_temp_low);
      if (tempNow > a.target_temp_high) return Number(a.target_temp_high);
      return null; // within band
    }
    const t = Number(a.temperature);
    return isFinite(t) ? t : null;
  }

  /**
   * Whether the comfort verdict can be evaluated at all: numeric sensors and a
   * climate entity that isn't unavailable/unknown. "off" still qualifies — the
   * verdict is shown even when the climate is off, just without a forecast.
   */
  private _hasReadings(): boolean {
    const c = this._climate;
    return !!(
      this.hass &&
      c &&
      !DEAD_STATES.has(c.state) &&
      this.tempSensor &&
      this.humiditySensor &&
      isFinite(this._tempNow()) &&
      isFinite(this._rhNow())
    );
  }

  /** Whether the climate is actively running (a session worth forecasting). */
  private _isRunning(): boolean {
    const c = this._climate;
    return !!(c && !OFF_STATES.has(c.state));
  }

  /** Recompute the status line from current readings + cached history. */
  private _recompute(): void {
    if (!this._hasReadings()) {
      this._set({ visible: false, comfortable: false });
      return;
    }
    const tempNow = this._tempNow();
    // Forecasts (time-to-comfortable, target ETA) only make sense while running;
    // when off, analyzeComfort shows the bare verdict from the current readings.
    const running = this._isRunning();
    this._set(
      analyzeComfort({
        tempNow,
        rhNow: this._rhNow(),
        tempSeries: running ? (this._cache?.tempSeries ?? []) : [],
        rhSeries: running ? (this._cache?.rhSeries ?? []) : [],
        target: running ? this._target(tempNow) : null,
        showTargetEta: running && (this.feature.show_target_eta ?? false),
        running,
        staleMin: this._staleMin(),
        unit: this.hass.config?.unit_system?.temperature ?? '°C',
      })
    );
  }

  /**
   * The epoch-ms at which the current heating/cooling session began: the climate
   * entity's `last_changed`, which resets whenever its hvac mode changes (turning
   * on, or switching heat↔cool). Forecasting only from this point keeps it to the
   * current session — earlier history may reflect different settings entirely.
   * Returns null when the timestamp is missing/unparseable.
   */
  private _sessionStartMs(): number | null {
    const lc = this._climate?.last_changed;
    if (!lc) return null;
    const ms = new Date(lc).getTime();
    return isFinite(ms) ? ms : null;
  }

  /** Fetch fresh history, then recompute. The verdict shows before the fetch. */
  private async _refresh(): Promise<void> {
    this._recompute(); // instant: the verdict needs no history
    if (this._fetching || !this._hasReadings() || !this._isRunning()) return;
    this._fetching = true;
    this._lastFetchMs = Date.now();
    try {
      const now = Date.now();
      // Only forecast from the current session (since the climate turned on),
      // capped so the query stays bounded for very long-running sessions.
      const start = Math.max(this._sessionStartMs() ?? 0, now - MAX_SESSION_MS);
      const ids = [this.tempSensor!, this.humiditySensor!];
      const hist = await fetchHistory(this.hass, ids, start, now);
      // fetchHistory always returns an array for every requested id (empty when
      // it has no data), so these lookups are never undefined.
      this._cache = {
        tempSeries: numericSeries(hist[this.tempSensor!], start, start),
        rhSeries: numericSeries(hist[this.humiditySensor!], start, start),
      };
      this._recompute();
    } catch {
      // Recorder unavailable — keep the instant comfort-now result, no forecast.
    } finally {
      this._fetching = false;
    }
  }

  /** Store a result and notify the row so it can collapse when not visible. */
  private _set(r: ComfortResult): void {
    this._result = r;
    this.dispatchEvent(
      new CustomEvent('feature-visibility', {
        detail: { visible: r.visible },
        bubbles: true,
        composed: true,
      })
    );
  }

  protected render(): TemplateResult | typeof nothing {
    const r = this._result;
    if (!r.visible || !r.line) return nothing;
    const status = r.status!; // analyzeComfort always sets a status alongside a visible line
    return html`<div class="comfort" role="status">
      <ha-icon
        icon=${STATUS_ICON[status]}
        style=${`color:${climateModeColor(STATUS_MODE[status])}`}
      ></ha-icon>
      <span>${r.line}</span>
    </div>`;
  }

  static styles = [
    tokens,
    css`
      :host {
        display: block;
      }
      .comfort {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 8px 12px;
        color: var(--mt-on-surface-variant);
        font-size: var(--md-sys-typescale-body-medium-size, 14px);
        line-height: 1.3;
        text-align: center;
      }
      .comfort ha-icon {
        flex: 0 0 auto;
        --mdc-icon-size: 18px;
        /* colour is set inline per comfort state (see render) */
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'mt-comfort': MtComfort;
  }
}
