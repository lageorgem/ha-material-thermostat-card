import { LitElement, html, css, svg, nothing, type TemplateResult } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { tokens, climateModeColor, HVAC_MODE_ICONS } from '../theme';

// Geometry: a 320x320 viewBox. The draggable range spans 270° with a gap at
// the bottom, so mid-range values sit near the top (à la Google Home / Nest).
const VIEW = 320;
const CENTER = VIEW / 2;
const RADIUS = 130; // ring / marker-dot radius
const LABEL_RADIUS = 100; // radius for the icon/number that sit inside a dot
const ARC_START = 225; // degrees, clockwise from top — bottom-left (= min)
const SWEEP = 270; // total degrees the range spans
const ARC_END_WRAP = (ARC_START + SWEEP) % 360; // 135 — bottom-right (= max)

/**
 * Convert a polar angle (0° = top, increasing clockwise) to an SVG point.
 * @param angleDeg angle in degrees
 * @param r radius
 */
function polar(angleDeg: number, r: number): { x: number; y: number } {
  const t = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CENTER + r * Math.cos(t), y: CENTER + r * Math.sin(t) };
}

/**
 * A circular temperature dial inspired by the Google Home / Nest thermostat:
 * a mode-colored radial halo, a faint ring, and dot markers for the setpoint
 * (with the mode icon) and the current temperature (with its value). Controlled
 * component: emits `value-changing` during a drag and `value-changed` when
 * committed. Single mode emits `{ value }`; dual (heat_cool) emits `{ low, high }`.
 */
@customElement('mt-circular-dial')
export class MtCircularDial extends LitElement {
  @property({ type: Number }) value = 20;
  @property({ type: Number }) min = 7;
  @property({ type: Number }) max = 35;
  @property({ type: Number }) step = 0.5;
  @property({ type: Number }) current?: number;
  @property() mode = 'off';
  @property() modeLabel = '';
  @property() unit = '°C';
  @property({ type: Boolean }) showCurrentAsPrimary = false;
  @property({ type: Boolean }) disabled = false;

  // Dual setpoint (heat_cool) support.
  @property({ type: Boolean }) dual = false;
  @property({ type: Number }) lowValue?: number;
  @property({ type: Number }) highValue?: number;

  @state() private _dragging = false;
  @state() private _dragValue = 0;
  @state() private _dragLow = 0;
  @state() private _dragHigh = 0;
  @state() private _activeHandle: 'low' | 'high' | null = null;

  @query('svg') private _svg!: SVGSVGElement;

  /** Decimal precision implied by the step (0 for integers, 1 for halves). */
  private get _precision(): number {
    return this.step < 1 ? 1 : 0;
  }

  /** Value shown for single mode (drag value while dragging). */
  private get _displayValue(): number {
    return this._dragging ? this._dragValue : this.value;
  }

  /** Low setpoint shown (drag value while dragging). */
  private get _displayLow(): number {
    return this._dragging ? this._dragLow : (this.lowValue ?? this.min);
  }

  /** High setpoint shown (drag value while dragging). */
  private get _displayHigh(): number {
    return this._dragging ? this._dragHigh : (this.highValue ?? this.max);
  }

  /** Map a value to its angle on the arc. */
  private _angleOf(value: number): number {
    const frac = (value - this.min) / (this.max - this.min || 1);
    return ARC_START + Math.min(1, Math.max(0, frac)) * SWEEP;
  }

  /** Round a raw value to the configured step, clamped to [min, max]. */
  private _roundToStep(raw: number): number {
    const clamped = Math.min(this.max, Math.max(this.min, raw));
    const snapped = Math.round(clamped / this.step) * this.step;
    return parseFloat(snapped.toFixed(this._precision));
  }

  /** Compute a value from a client (x, y) pointer position over the dial. */
  private _valueFromPoint(clientX: number, clientY: number): number {
    const rect = this._svg.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const deg = (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI; // 0 = right, CW+
    let a = deg + 90; // 0 = top
    a = ((a % 360) + 360) % 360;

    let p: number;
    if (a >= ARC_START) p = a - ARC_START;
    else if (a <= ARC_END_WRAP) p = a + 360 - ARC_START;
    else p = a < 180 ? SWEEP : 0; // inside the bottom gap -> snap to nearer end

    const frac = Math.min(1, Math.max(0, p / SWEEP));
    return this._roundToStep(this.min + frac * (this.max - this.min));
  }

  /**
   * Apply a value to the active dual handle, keeping low < high by one step.
   * @param v the candidate value
   */
  private _applyDual(v: number): void {
    if (this._activeHandle === 'low') {
      this._dragLow = Math.min(v, this._dragHigh - this.step);
    } else {
      this._dragHigh = Math.max(v, this._dragLow + this.step);
    }
  }

  /**
   * Begin a drag interaction.
   * @param e pointer event
   */
  private _onPointerDown = (e: PointerEvent): void => {
    if (this.disabled) return;
    e.preventDefault();
    this._svg.setPointerCapture(e.pointerId);
    this._dragging = true;
    const v = this._valueFromPoint(e.clientX, e.clientY);
    if (this.dual) {
      this._dragLow = this._displayLow;
      this._dragHigh = this._displayHigh;
      this._activeHandle =
        Math.abs(v - this._dragLow) <= Math.abs(v - this._dragHigh) ? 'low' : 'high';
      this._applyDual(v);
      this._emit('value-changing', { low: this._dragLow, high: this._dragHigh });
    } else {
      this._dragValue = v;
      this._emit('value-changing', { value: v });
    }
  };

  /**
   * Update the value while dragging.
   * @param e pointer event
   */
  private _onPointerMove = (e: PointerEvent): void => {
    if (!this._dragging) return;
    const v = this._valueFromPoint(e.clientX, e.clientY);
    if (this.dual) {
      this._applyDual(v);
      this._emit('value-changing', { low: this._dragLow, high: this._dragHigh });
    } else if (v !== this._dragValue) {
      this._dragValue = v;
      this._emit('value-changing', { value: v });
    }
  };

  /**
   * Commit the drag interaction.
   * @param e pointer event
   */
  private _onPointerUp = (e: PointerEvent): void => {
    if (!this._dragging) return;
    this._svg.releasePointerCapture(e.pointerId);
    this._dragging = false;
    if (this.dual) {
      this._emit('value-changed', { low: this._dragLow, high: this._dragHigh });
      this._activeHandle = null;
    } else {
      this._emit('value-changed', { value: this._dragValue });
    }
  };

  /**
   * Keyboard control for accessibility (single mode only).
   * @param e keyboard event
   */
  private _onKeyDown = (e: KeyboardEvent): void => {
    if (this.disabled || this.dual) return;
    let next: number | undefined;
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') next = this.value + this.step;
    else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') next = this.value - this.step;
    if (next === undefined) return;
    e.preventDefault();
    this._emit('value-changed', { value: this._roundToStep(next) });
  };

  /**
   * Step the single target temperature.
   * @param delta number of steps (±1)
   */
  private _step(delta: number): void {
    if (this.disabled) return;
    this._emit('value-changed', { value: this._roundToStep(this.value + delta * this.step) });
  }

  /**
   * Dispatch a dial event.
   * @param type event name
   * @param detail the value payload
   */
  private _emit(
    type: 'value-changing' | 'value-changed',
    detail: { value?: number; low?: number; high?: number }
  ): void {
    this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
  }

  /**
   * Format a temperature for display.
   * @param value the temperature
   * @param precision decimals to show
   */
  private _fmt(value: number | undefined, precision: number): string {
    if (value === undefined || value === null || Number.isNaN(value)) return '—';
    return value.toFixed(precision);
  }

  /**
   * Compact temperature for a marker (no trailing ".0").
   * @param value the temperature
   */
  private _fmtCompact(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }

  /**
   * Inline style placing an overlay at a polar position within the dial box.
   * @param angle angle in degrees
   * @param r radius
   */
  private _at(angle: number, r: number): string {
    const p = polar(angle, r);
    return `left:${(p.x / VIEW) * 100}%; top:${(p.y / VIEW) * 100}%;`;
  }

  /**
   * A small dot marker on the ring.
   * @param angle angle in degrees
   * @param cls CSS class for the dot
   * @param r dot radius
   */
  private _dot(angle: number, cls: string, r = 7): TemplateResult {
    const p = polar(angle, RADIUS);
    return svg`<circle class=${cls} cx=${p.x} cy=${p.y} r=${r} />`;
  }

  protected render(): TemplateResult {
    const color = climateModeColor(this.mode);
    const modeIcon = HVAC_MODE_ICONS[this.mode] ?? 'mdi:thermostat';

    const showCurrent =
      this.current != null && this.current >= this.min && this.current <= this.max;
    const curAngle = showCurrent ? this._angleOf(this.current!) : 0;

    return html`
      <div class="dial" style=${`--dial-color: ${color}`}>
        <svg
          viewBox="0 0 ${VIEW} ${VIEW}"
          role="slider"
          tabindex=${this.disabled ? -1 : 0}
          aria-valuemin=${this.min}
          aria-valuemax=${this.max}
          aria-valuenow=${this.dual ? this._displayHigh : this._displayValue}
          aria-label="Target temperature"
          @pointerdown=${this._onPointerDown}
          @pointermove=${this._onPointerMove}
          @pointerup=${this._onPointerUp}
          @pointercancel=${this._onPointerUp}
          @keydown=${this._onKeyDown}
        >
          <defs>
            <radialGradient id="mt-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="var(--dial-color)" stop-opacity="0.38" />
              <stop offset="58%" stop-color="var(--dial-color)" stop-opacity="0.13" />
              <stop offset="100%" stop-color="var(--dial-color)" stop-opacity="0.02" />
            </radialGradient>
          </defs>
          <circle class="glow" cx=${CENTER} cy=${CENTER} r="150" fill="url(#mt-glow)" />
          <circle class="ring" cx=${CENTER} cy=${CENTER} r=${RADIUS} />
          ${this.dual
            ? html`${this._dot(this._angleOf(this._displayLow), 'dot setpoint')}
              ${this._dot(this._angleOf(this._displayHigh), 'dot setpoint')}`
            : this._dot(this._angleOf(this._displayValue), 'dot setpoint')}
          ${showCurrent ? this._dot(curAngle, 'dot current', 5) : nothing}
        </svg>

        <div class="markers">
          ${this.dual
            ? html`<div class="marker num" style=${this._at(this._angleOf(this._displayLow), LABEL_RADIUS)}>
                  ${this._fmtCompact(this._displayLow)}°
                </div>
                <div
                  class="marker num"
                  style=${this._at(this._angleOf(this._displayHigh), LABEL_RADIUS)}
                >
                  ${this._fmtCompact(this._displayHigh)}°
                </div>`
            : html`<div
                class="marker icon"
                style=${this._at(this._angleOf(this._displayValue), LABEL_RADIUS)}
              >
                <ha-icon icon=${modeIcon}></ha-icon>
              </div>`}
          ${showCurrent
            ? html`<div class="marker num current" style=${this._at(curAngle, LABEL_RADIUS)}>
                ${this._fmtCompact(this.current!)}°
              </div>`
            : nothing}
        </div>

        ${this.dual ? this._renderDualCenter() : this._renderSingleCenter()}
        ${this.dual ? nothing : this._renderAdjust()}
      </div>
    `;
  }

  /** Center readout for single mode. */
  private _renderSingleCenter(): TemplateResult {
    const target = this._displayValue;
    const big = this.showCurrentAsPrimary && this.current != null ? this.current : target;
    const bigPrecision = this.showCurrentAsPrimary ? 1 : this._precision;
    return html`
      <div class="center">
        ${this.modeLabel ? html`<div class="mode">${this.modeLabel}</div>` : nothing}
        <div class="temp">
          <span class="value-text">${this._fmt(big, bigPrecision)}</span>
          <span class="unit">${this.unit}</span>
        </div>
      </div>
    `;
  }

  /** Center readout for dual mode. */
  private _renderDualCenter(): TemplateResult {
    return html`
      <div class="center">
        ${this.modeLabel ? html`<div class="mode">${this.modeLabel}</div>` : nothing}
        <div class="temp dual">
          <span class="value-text">${this._fmt(this._displayLow, this._precision)}</span>
          <span class="dash">–</span>
          <span class="value-text">${this._fmt(this._displayHigh, this._precision)}</span>
          <span class="unit">${this.unit}</span>
        </div>
      </div>
    `;
  }

  /** The +/- step buttons (single mode). */
  private _renderAdjust(): TemplateResult {
    return html`
      <div class="adjust">
        <button
          class="step"
          aria-label="Decrease temperature"
          ?disabled=${this.disabled}
          @click=${() => this._step(-1)}
        >
          <ha-icon icon="mdi:minus"></ha-icon>
        </button>
        <button
          class="step"
          aria-label="Increase temperature"
          ?disabled=${this.disabled}
          @click=${() => this._step(1)}
        >
          <ha-icon icon="mdi:plus"></ha-icon>
        </button>
      </div>
    `;
  }

  static styles = [
    tokens,
    css`
      :host {
        display: block;
      }
      .dial {
        position: relative;
        width: 100%;
        max-width: 320px;
        margin: 0 auto;
        aspect-ratio: 1 / 1;
      }
      svg {
        width: 100%;
        height: 100%;
        touch-action: none;
        outline: none;
      }
      .ring {
        fill: none;
        stroke: var(--dial-color);
        stroke-width: 10;
        opacity: 0.18;
        transition: stroke 280ms cubic-bezier(0.2, 0, 0, 1);
      }
      .glow {
        transition: opacity 280ms cubic-bezier(0.2, 0, 0, 1);
      }
      .dot {
        transition: fill 280ms cubic-bezier(0.2, 0, 0, 1);
      }
      .dot.setpoint {
        fill: var(--mt-on-surface);
      }
      .dot.current {
        fill: var(--mt-on-surface);
        opacity: 0.55;
      }
      svg:focus-visible .dot.setpoint {
        stroke: var(--mt-on-surface);
        stroke-width: 3;
      }
      .markers {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }
      .marker {
        position: absolute;
        transform: translate(-50%, -50%);
        display: flex;
        align-items: center;
        justify-content: center;
        white-space: nowrap;
      }
      .marker.icon {
        color: var(--dial-color);
        transition: color 280ms cubic-bezier(0.2, 0, 0, 1);
      }
      .marker.icon ha-icon {
        --mdc-icon-size: 26px;
      }
      .marker.num {
        font-size: var(--md-sys-typescale-title-medium-size, 16px);
        font-weight: 500;
        color: var(--mt-on-surface);
      }
      .marker.num.current {
        color: var(--mt-on-surface-variant);
      }
      .center {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        pointer-events: none;
        color: var(--mt-on-surface);
      }
      .mode {
        font-size: var(--md-sys-typescale-title-medium-size, 16px);
        color: var(--mt-on-surface-variant);
        font-weight: 500;
      }
      .temp {
        display: flex;
        align-items: flex-start;
        line-height: 1;
      }
      .temp.dual {
        align-items: center;
        gap: 6px;
      }
      .temp.dual .value-text {
        font-size: var(--md-sys-typescale-display-small-size, 40px);
      }
      .temp.dual .dash {
        font-size: var(--md-sys-typescale-display-small-size, 40px);
        color: var(--mt-on-surface-variant);
      }
      .value-text {
        font-size: var(--md-sys-typescale-display-large-size, 64px);
        font-weight: 400;
        letter-spacing: -0.02em;
        color: var(--dial-color);
        transition: color 280ms cubic-bezier(0.2, 0, 0, 1);
      }
      .unit {
        font-size: var(--md-sys-typescale-title-large-size, 22px);
        margin-top: 0.4em;
        margin-left: 2px;
        color: var(--mt-on-surface-variant);
      }
      .temp.dual .unit {
        margin-top: 0;
        align-self: center;
      }
      .adjust {
        position: absolute;
        left: 50%;
        bottom: 9%;
        transform: translateX(-50%);
        display: flex;
        gap: 24px;
      }
      .step {
        width: 44px;
        height: 44px;
        border-radius: var(--mt-shape-full);
        border: none;
        background: transparent;
        color: var(--mt-on-surface-variant);
        display: grid;
        place-items: center;
        cursor: pointer;
        transition:
          background-color 180ms cubic-bezier(0.2, 0, 0, 1),
          transform 120ms cubic-bezier(0.2, 0, 0, 1);
        -webkit-tap-highlight-color: transparent;
      }
      .step ha-icon {
        --mdc-icon-size: 26px;
      }
      .step:hover:not([disabled]) {
        background: color-mix(in srgb, var(--mt-on-surface) 8%, transparent);
      }
      .step:active:not([disabled]) {
        transform: scale(0.92);
      }
      .step[disabled] {
        opacity: 0.38;
        cursor: default;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'mt-circular-dial': MtCircularDial;
  }
}
