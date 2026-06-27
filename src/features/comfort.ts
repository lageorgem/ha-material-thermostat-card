import { LitElement, html, css, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import type { ComfortFeatureConfig } from '../types';
import { tokens } from '../theme';
import { fetchHistory, lastTurnedOnMs, numericSeries, OFF_STATES } from '../calc/history';
import { analyzeComfort, type ComfortResult, type TS } from '../calc/comfort-analysis';

/** How often the history forecast is refreshed. */
const REFRESH_MS = 60_000;
const DEFAULT_LOOKBACK_HOURS = 12;
const DEFAULT_COMFORT_MIN = 20;
const DEFAULT_COMFORT_MAX = 26;

/**
 * The "comfort & time-to-comfortable" feature row. Judges comfort from the
 * shared feels-like sensors (heat index when cooling, apparent temperature when
 * heating) and forecasts, from recorder history since the climate turned on, how
 * long until the room feels comfortable — and optionally until the target is
 * reached. Shows nothing (and asks its row to collapse) when the climate is off,
 * the sensors are unset, or there isn't yet enough history to forecast.
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
        comfortMin: this.feature.comfort_min ?? DEFAULT_COMFORT_MIN,
        comfortMax: this.feature.comfort_max ?? DEFAULT_COMFORT_MAX,
        target: this._target(tempNow),
        showTargetEta: this.feature.show_target_eta ?? false,
        unit: this.hass.config?.unit_system?.temperature ?? '°C',
      })
    );
  }

  /** Fetch fresh history, then recompute. Comfort-now shows before the fetch. */
  private async _refresh(): Promise<void> {
    this._recompute(); // instant: comfortable needs no history
    if (this._fetching || !this._ready()) return;
    this._fetching = true;
    try {
      const now = Date.now();
      const lookbackH = this.feature.lookback_hours ?? DEFAULT_LOOKBACK_HOURS;
      const start = now - lookbackH * 3_600_000;
      const ids = [this.entityId, this.tempSensor!, this.humiditySensor!];
      const hist = await fetchHistory(this.hass, ids, start, now);
      const onMs = lastTurnedOnMs(hist[this.entityId] ?? []) ?? start;
      this._cache = {
        tempSeries: numericSeries(hist[this.tempSensor!] ?? [], onMs, onMs),
        rhSeries: numericSeries(hist[this.humiditySensor!] ?? [], onMs, onMs),
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
      <ha-icon icon=${r.comfortable ? 'mdi:emoticon-happy-outline' : 'mdi:timer-sand'}></ha-icon>
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
