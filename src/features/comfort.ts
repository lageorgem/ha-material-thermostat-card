import { LitElement, html, css, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import type { ComfortFeatureConfig } from '../types';
import { tokens } from '../theme';
import { fetchHistory, numericSeries, OFF_STATES } from '../calc/history';
import { analyzeComfort, type ComfortResult, type TS } from '../calc/comfort-analysis';

/** How often the history forecast is refreshed. */
const REFRESH_MS = 60_000;
/**
 * Upper bound on how far back history is fetched — a query-cost guard, not a
 * "lookback". The forecast only ever uses data since the current session began
 * (see {@link MtComfort._sessionStartMs}); a session longer than this is already
 * at steady state, so the cap never discards a still-changing trend.
 */
const MAX_SESSION_MS = 24 * 3_600_000;

/**
 * The "comfort & time-to-comfortable" feature row. Judges comfort from the
 * shared feels-like sensors via the ASHRAE 55 / ISO 7730 PMV model and always
 * shows a verdict while the climate is on ("Room feels comfortable/warm/cool/
 * humid"), upgrading the uncomfortable verdict to "…X until room feels
 * comfortable" once there's enough current-session history to forecast it — and
 * optionally appending the time until the target is reached. Shows nothing (and
 * asks its row to collapse) only when the climate is off or the sensors are unset.
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
  /** Last fetched history series, reused for cheap recomputes on hass updates. */
  private _cache?: { tempSeries: TS[]; rhSeries: TS[] };

  connectedCallback(): void {
    super.connectedCallback();
    this._timer = window.setInterval(() => void this._refresh(), REFRESH_MS);
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

  /** Current temperature: feels-like sensor, falling back to climate's own. */
  private _tempNow(): number {
    const raw = this.tempSensor ? this.hass?.states?.[this.tempSensor]?.state : undefined;
    const v = parseFloat(String(raw));
    return isFinite(v) ? v : Number(this._climate?.attributes?.current_temperature);
  }

  /** Current humidity reading (%). */
  private _rhNow(): number {
    const raw = this.humiditySensor ? this.hass?.states?.[this.humiditySensor]?.state : undefined;
    return parseFloat(String(raw));
  }

  /** Resolve the relevant target setpoint, or null when at/within the band. */
  private _target(tempNow: number): number | null {
    const a = this._climate?.attributes ?? {};
    if (
      this._climate?.state === 'heat_cool' &&
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

  /** Whether comfort can be evaluated at all (on, with numeric sensors). */
  private _ready(): boolean {
    const c = this._climate;
    return !!(
      this.hass &&
      c &&
      !OFF_STATES.has(c.state) &&
      this.tempSensor &&
      this.humiditySensor &&
      isFinite(this._tempNow()) &&
      isFinite(this._rhNow())
    );
  }

  /** Recompute the status line from current readings + cached history. */
  private _recompute(): void {
    if (!this._ready()) {
      this._set({ visible: false, comfortable: false });
      return;
    }
    const climate = this._climate!;
    const tempNow = this._tempNow();
    this._set(
      analyzeComfort({
        mode: climate.state,
        action: climate.attributes?.hvac_action,
        tempNow,
        rhNow: this._rhNow(),
        tempSeries: this._cache?.tempSeries ?? [],
        rhSeries: this._cache?.rhSeries ?? [],
        target: this._target(tempNow),
        showTargetEta: this.feature.show_target_eta ?? false,
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

  /** Fetch fresh history, then recompute. Comfort-now shows before the fetch. */
  private async _refresh(): Promise<void> {
    this._recompute(); // instant: comfortable needs no history
    if (this._fetching || !this._ready()) return;
    this._fetching = true;
    try {
      const now = Date.now();
      // Only forecast from the current session (since the climate turned on),
      // capped so the query stays bounded for very long-running sessions.
      const start = Math.max(this._sessionStartMs() ?? 0, now - MAX_SESSION_MS);
      const ids = [this.tempSensor!, this.humiditySensor!];
      const hist = await fetchHistory(this.hass, ids, start, now);
      this._cache = {
        tempSeries: numericSeries(hist[this.tempSensor!] ?? [], start, start),
        rhSeries: numericSeries(hist[this.humiditySensor!] ?? [], start, start),
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
    return html`<div class="comfort" role="status">
      <ha-icon icon=${r.icon ?? 'mdi:thermometer'}></ha-icon>
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
        color: var(--mt-active-color, var(--mt-on-surface-variant));
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'mt-comfort': MtComfort;
  }
}
