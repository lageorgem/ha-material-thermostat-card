import { LitElement, html, css, svg, nothing, type TemplateResult } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { tokens, climateModeColor } from '../theme';

// Geometry: a 320x320 viewBox with the arc opening at the bottom (a "C").
const VIEW = 320;
const CENTER = VIEW / 2;
const RADIUS = 132;
const TRACK_WIDTH = 16;
const ARC_START = 225; // degrees, clockwise from top — bottom-left (= min)
const SWEEP = 270; // total degrees the arc spans
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
 * Build an SVG arc path between two angles (clockwise).
 * @param startAngle start angle in degrees
 * @param endAngle end angle in degrees
 * @param r radius
 */
function arcPath(startAngle: number, endAngle: number, r: number): string {
  const start = polar(startAngle, r);
  const end = polar(endAngle, r);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

/**
 * A draggable circular temperature dial styled for Material 3 Expressive,
 * inspired by the Google Home / Nest thermostat. Controlled component: it
 * renders `value`, emits `value-changing` during a drag and `value-changed`
 * when a change is committed (drag release, +/- button, or keyboard).
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

  @state() private _dragging = false;
  @state() private _dragValue = 0;

  @query('svg') private _svg!: SVGSVGElement;

  /** The value currently being shown (drag value while dragging). */
  private get _displayValue(): number {
    return this._dragging ? this._dragValue : this.value;
  }

  /** Decimal precision implied by the step (0 for integers, 1 for halves). */
  private get _precision(): number {
    return this.step < 1 ? 1 : 0;
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
   * Begin a drag interaction.
   * @param e pointer event
   */
  private _onPointerDown = (e: PointerEvent): void => {
    if (this.disabled) return;
    e.preventDefault();
    this._svg.setPointerCapture(e.pointerId);
    this._dragging = true;
    this._dragValue = this._valueFromPoint(e.clientX, e.clientY);
    this._emit('value-changing', this._dragValue);
  };

  /**
   * Update the value while dragging.
   * @param e pointer event
   */
  private _onPointerMove = (e: PointerEvent): void => {
    if (!this._dragging) return;
    const next = this._valueFromPoint(e.clientX, e.clientY);
    if (next !== this._dragValue) {
      this._dragValue = next;
      this._emit('value-changing', next);
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
    this._emit('value-changed', this._dragValue);
  };

  /**
   * Keyboard control for accessibility.
   * @param e keyboard event
   */
  private _onKeyDown = (e: KeyboardEvent): void => {
    if (this.disabled) return;
    let next: number | undefined;
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') next = this.value + this.step;
    else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') next = this.value - this.step;
    if (next === undefined) return;
    e.preventDefault();
    this._emit('value-changed', this._roundToStep(next));
  };

  /**
   * Step the target temperature by a number of steps.
   * @param delta number of steps (±1)
   */
  private _step(delta: number): void {
    if (this.disabled) return;
    this._emit('value-changed', this._roundToStep(this.value + delta * this.step));
  }

  /**
   * Dispatch a dial event.
   * @param type event name
   * @param value the new value
   */
  private _emit(type: 'value-changing' | 'value-changed', value: number): void {
    this.dispatchEvent(new CustomEvent(type, { detail: { value }, bubbles: true, composed: true }));
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

  protected render(): TemplateResult {
    const color = climateModeColor(this.mode);
    const target = this._displayValue;
    const handle = polar(this._angleOf(target), RADIUS);
    const big = this.showCurrentAsPrimary && this.current != null ? this.current : target;
    const sub = this.showCurrentAsPrimary ? target : this.current;
    const bigPrecision = this.showCurrentAsPrimary ? 1 : this._precision;
    const subPrecision = this.showCurrentAsPrimary ? this._precision : 1;
    const subIcon = this.showCurrentAsPrimary ? 'mdi:thermostat' : 'mdi:thermometer';

    const showCurrentDot =
      this.current != null && this.current >= this.min && this.current <= this.max;
    const currentDot = showCurrentDot ? polar(this._angleOf(this.current!), RADIUS) : null;

    return html`
      <div class="dial" style=${`--dial-color: ${color}`}>
        <svg
          viewBox="0 0 ${VIEW} ${VIEW}"
          role="slider"
          tabindex=${this.disabled ? -1 : 0}
          aria-valuemin=${this.min}
          aria-valuemax=${this.max}
          aria-valuenow=${target}
          aria-label="Target temperature"
          @pointerdown=${this._onPointerDown}
          @pointermove=${this._onPointerMove}
          @pointerup=${this._onPointerUp}
          @pointercancel=${this._onPointerUp}
          @keydown=${this._onKeyDown}
        >
          <path
            class="track"
            d=${arcPath(ARC_START, ARC_START + SWEEP, RADIUS)}
            stroke-width=${TRACK_WIDTH}
          />
          <path
            class="value"
            d=${arcPath(ARC_START, this._angleOf(target), RADIUS)}
            stroke-width=${TRACK_WIDTH}
          />
          ${currentDot
            ? svg`<circle class="current-dot" cx=${currentDot.x} cy=${currentDot.y} r="4" />`
            : nothing}
          <circle class="handle" cx=${handle.x} cy=${handle.y} r="13" />
        </svg>

        <div class="center">
          ${this.modeLabel ? html`<div class="mode">${this.modeLabel}</div>` : nothing}
          <div class="temp">
            <span class="value-text">${this._fmt(big, bigPrecision)}</span>
            <span class="unit">${this.unit}</span>
          </div>
          ${sub != null
            ? html`<div class="sub">
                <ha-icon icon=${subIcon}></ha-icon>
                <span>${this._fmt(sub, subPrecision)} ${this.unit}</span>
              </div>`
            : nothing}
        </div>

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
      svg:focus-visible .handle {
        stroke: var(--mt-on-surface);
        stroke-width: 3;
      }
      .track {
        fill: none;
        stroke: var(--mt-outline-variant);
        stroke-linecap: round;
        opacity: 0.5;
      }
      .value {
        fill: none;
        stroke: var(--dial-color);
        stroke-linecap: round;
        transition: stroke 240ms cubic-bezier(0.2, 0, 0, 1);
      }
      .current-dot {
        fill: var(--mt-on-surface-variant);
      }
      .handle {
        fill: #fff;
        stroke: var(--dial-color);
        stroke-width: 2;
        filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.3));
        cursor: grab;
        transition: stroke 240ms cubic-bezier(0.2, 0, 0, 1);
      }
      .center {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
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
      .value-text {
        font-size: var(--md-sys-typescale-display-large-size, 64px);
        font-weight: 400;
        letter-spacing: -0.02em;
      }
      .unit {
        font-size: var(--md-sys-typescale-title-large-size, 22px);
        margin-top: 0.4em;
        margin-left: 2px;
        color: var(--mt-on-surface-variant);
      }
      .sub {
        display: flex;
        align-items: center;
        gap: 4px;
        color: var(--mt-on-surface-variant);
        font-size: var(--md-sys-typescale-body-large-size, 16px);
      }
      .sub ha-icon {
        --mdc-icon-size: 18px;
      }
      .adjust {
        position: absolute;
        left: 50%;
        bottom: 6%;
        transform: translateX(-50%);
        display: flex;
        gap: 16px;
      }
      .step {
        width: 48px;
        height: 48px;
        border-radius: var(--mt-shape-full);
        border: none;
        background: var(--mt-surface-container-high);
        color: var(--mt-on-surface);
        display: grid;
        place-items: center;
        cursor: pointer;
        transition: background-color 180ms cubic-bezier(0.2, 0, 0, 1);
        -webkit-tap-highlight-color: transparent;
      }
      .step ha-icon {
        --mdc-icon-size: 24px;
      }
      .step:hover:not([disabled]) {
        background: color-mix(in srgb, var(--mt-on-surface) 8%, var(--mt-surface-container-high));
      }
      .step:active:not([disabled]) {
        background: color-mix(in srgb, var(--mt-on-surface) 12%, var(--mt-surface-container-high));
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
