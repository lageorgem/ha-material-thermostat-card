import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokens, climateModeColor, HVAC_MODE_ICONS } from '../theme';

// Register --dial-color as an animatable <color> so the halo/ring/number can
// cross-fade between mode colors (a plain custom property would jump).
try {
  (CSS as any).registerProperty?.({
    name: '--dial-color',
    syntax: '<color>',
    inherits: true,
    initialValue: 'transparent',
  });
} catch {
  // already registered or unsupported — degrades to an instant color change
}

/** HVAC modes that carry a color (everything else is treated as "off"). */
const COLORED_MODES = ['cool', 'heat', 'heat_cool', 'auto', 'dry', 'fan_only'];

// Geometry: a 320x320 viewBox. The draggable range spans 270° with a gap at
// the bottom, so mid-range values sit near the top (à la Google Home / Nest).
const VIEW = 320;
const CENTER = VIEW / 2;
const RADIUS = 130; // ring / marker-dot radius
const ARC_START = 225; // degrees, clockwise from top — bottom-left (= min)
const SWEEP = 270; // total degrees the range spans
const ARC_END_WRAP = (ARC_START + SWEEP) % 360; // 135 — bottom-right (= max)
const OVERLAP_DEG = 18; // angular gap under which setpoint icon + current temp merge

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
 * A circular temperature dial inspired by the Google Home / Nest thermostat.
 * Markers (dots, mode icon, temperatures) are HTML overlays that orbit the
 * center via rotation, so they always sit exactly on the ring and animate
 * along the arc. Controlled component: emits `value-changing` during a drag
 * and `value-changed` when committed. Single mode emits `{ value }`; dual
 * (heat_cool) emits `{ low, high }`.
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

  /** Map a value to its fraction (0..1) along the ring path. */
  private _fracOf(value: number): number {
    return (this._angleOf(value) - ARC_START) / SWEEP;
  }

  /** Round a raw value to the configured step, clamped to [min, max]. */
  private _roundToStep(raw: number): number {
    const clamped = Math.min(this.max, Math.max(this.min, raw));
    const snapped = Math.round(clamped / this.step) * this.step;
    return parseFloat(snapped.toFixed(this._precision));
  }

  /** Whether a client point lands on the interactive ring (not center/gap/outside). */
  private _isRingHit(clientX: number, clientY: number): boolean {
    const rect = this._svg.getBoundingClientRect();
    const scale = rect.width / VIEW || 1;
    const dx = clientX - (rect.left + rect.width / 2);
    const dy = clientY - (rect.top + rect.height / 2);
    const dist = Math.hypot(dx, dy) / scale;
    if (dist < RADIUS - 32 || dist > RADIUS + 22) return false;
    let a = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    a = ((a % 360) + 360) % 360;
    return a >= ARC_START || a <= ARC_END_WRAP; // exclude the bottom gap
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
   * Push the pointer's value out as a live change.
   * @param v the value at the pointer
   */
  private _emitFromValue(v: number): void {
    if (this.dual) {
      this._applyDual(v);
      this._emit('value-changing', { low: this._dragLow, high: this._dragHigh });
    } else {
      this._dragValue = v;
      this._emit('value-changing', { value: v });
    }
  }

  /**
   * Begin a press on the ring. The markers animate toward the pointer (the
   * same easing as +/- and taps), giving a smooth follow during a drag.
   * @param e pointer event
   */
  private _onPointerDown = (e: PointerEvent): void => {
    if (this.disabled || !this._isRingHit(e.clientX, e.clientY)) return;
    e.preventDefault();
    this._svg.setPointerCapture(e.pointerId);
    this._dragging = true;
    const v = this._valueFromPoint(e.clientX, e.clientY);
    if (this.dual) {
      this._dragLow = this._displayLow;
      this._dragHigh = this._displayHigh;
      this._activeHandle =
        Math.abs(v - this._dragLow) <= Math.abs(v - this._dragHigh) ? 'low' : 'high';
    }
    this._emitFromValue(v);
  };

  /**
   * Update the value while pressed.
   * @param e pointer event
   */
  private _onPointerMove = (e: PointerEvent): void => {
    if (!this._dragging) return;
    this._emitFromValue(this._valueFromPoint(e.clientX, e.clientY));
  };

  /**
   * Commit the interaction.
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
   * A dot that orbits the center to its angle.
   * @param angle angle in degrees
   * @param cls extra dot class (setpoint|current)
   */
  private _dotOrbit(angle: number, cls: string): TemplateResult {
    return html`<div class="orbit" style=${`transform: rotate(${angle}deg)`}>
      <div class="o-dot ${cls}"></div>
    </div>`;
  }

  /**
   * A label that orbits to its angle but stays upright (counter-rotated).
   * @param angle angle in degrees
   * @param content the label content
   */
  private _labelOrbit(angle: number, content: TemplateResult): TemplateResult {
    return html`<div class="orbit" style=${`transform: rotate(${angle}deg)`}>
      <div class="o-label" style=${`transform: translate(-50%, -50%) rotate(${-angle}deg)`}>
        ${content}
      </div>
    </div>`;
  }

  protected render(): TemplateResult {
    const isOff = !COLORED_MODES.includes(this.mode);
    const color = isOff ? 'var(--mt-on-surface-variant)' : climateModeColor(this.mode);
    const modeIcon = HVAC_MODE_ICONS[this.mode] ?? 'mdi:thermostat';

    const showCurrent =
      this.current != null && this.current >= this.min && this.current <= this.max;
    const spAngle = this._angleOf(this._displayValue);
    const curAngle = showCurrent ? this._angleOf(this.current!) : 0;
    const overlap = !this.dual && showCurrent && !isOff && Math.abs(spAngle - curAngle) < OVERLAP_DEG;

    // Colored segment: between the two setpoints (dual) or between the setpoint
    // and the current temperature (single). Drawn by dashing the ring path.
    let segS = 0;
    let segE = 0;
    let showSeg = false;
    if (this.dual) {
      segS = this._fracOf(this._displayLow);
      segE = this._fracOf(this._displayHigh);
      showSeg = true;
    } else if (showCurrent && !isOff) {
      segS = Math.min(this._fracOf(this._displayValue), this._fracOf(this.current!));
      segE = Math.max(this._fracOf(this._displayValue), this._fracOf(this.current!));
      showSeg = true;
    }
    const ringPath = arcPath(ARC_START, ARC_START + SWEEP, RADIUS);
    const dashArray = `${((segE - segS) * 1000).toFixed(2)} 1000`;
    const dashOffset = (-segS * 1000).toFixed(2);

    const currentLabel = html`<span class="num current">${this._fmtCompact(this.current!)}°</span>`;
    const modeIconEl = html`<ha-icon class="mode-icon" icon=${modeIcon}></ha-icon>`;

    return html`
      <div
        class=${classMap({ dial: true, off: isOff, disabled: this.disabled })}
        style=${`--dial-color: ${color}`}
      >
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
          <path class="ring" d=${ringPath} />
          <path
            class="value"
            d=${ringPath}
            pathLength="1000"
            stroke-dasharray=${dashArray}
            stroke-dashoffset=${dashOffset}
            style=${`opacity:${showSeg ? 1 : 0}`}
          />
          <path class="hit" d=${ringPath} />
        </svg>

        <div class="markers">
          ${this.dual
            ? html`
                ${this._dotOrbit(this._angleOf(this._displayLow), 'setpoint')}
                ${this._dotOrbit(this._angleOf(this._displayHigh), 'setpoint')}
                ${showCurrent ? this._dotOrbit(curAngle, 'current') : nothing}
                ${this._labelOrbit(
                  this._angleOf(this._displayLow),
                  html`<span class="num">${this._fmtCompact(this._displayLow)}°</span>`
                )}
                ${this._labelOrbit(
                  this._angleOf(this._displayHigh),
                  html`<span class="num">${this._fmtCompact(this._displayHigh)}°</span>`
                )}
                ${showCurrent ? this._labelOrbit(curAngle, currentLabel) : nothing}
              `
            : html`
                ${this._dotOrbit(spAngle, 'setpoint')}
                ${showCurrent ? this._dotOrbit(curAngle, 'current') : nothing}
                ${overlap
                  ? this._labelOrbit(
                      curAngle,
                      html`<span class="num current with-icon"
                        ><ha-icon class="mode-icon inline" icon=${modeIcon}></ha-icon
                        >${this._fmtCompact(this.current!)}°</span
                      >`
                    )
                  : html`
                      ${isOff ? nothing : this._labelOrbit(spAngle, modeIconEl)}
                      ${showCurrent ? this._labelOrbit(curAngle, currentLabel) : nothing}
                    `}
              `}
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
        /* Fill the wrapper so the dial has a DEFINITE width. A container
           (container-type below) reports zero intrinsic width, so without this
           the shrink-to-fit host would collapse to ~0 and the dial vanishes. */
        width: 100%;
      }
      .dial {
        position: relative;
        width: 100%;
        max-width: 320px;
        margin: 0 auto;
        aspect-ratio: 1 / 1;
        transition: --dial-color var(--mt-motion-dur) var(--mt-motion-ease);
        /* let inner text/markers scale with the dial via cqi units */
        container-type: inline-size;
      }
      svg {
        display: block; /* avoid inline baseline gap that offsets the SVG vs marker overlays */
        width: 100%;
        height: 100%;
        touch-action: none;
        outline: none;
      }
      .glow,
      .ring,
      .value {
        pointer-events: none;
      }
      .hit {
        fill: none;
        stroke: transparent;
        stroke-width: 50;
        stroke-linecap: butt;
        pointer-events: stroke;
        cursor: pointer;
      }
      .dial.disabled .hit {
        cursor: default;
      }
      .ring {
        fill: none;
        stroke: var(--dial-color);
        stroke-width: 10;
        stroke-linecap: round;
        opacity: 0.18;
      }
      .value {
        fill: none;
        stroke: var(--dial-color);
        stroke-width: 10;
        stroke-linecap: round;
        transition:
          stroke-dasharray var(--mt-motion-dur) var(--mt-motion-ease),
          stroke-dashoffset var(--mt-motion-dur) var(--mt-motion-ease),
          opacity var(--mt-motion-dur) var(--mt-motion-ease);
      }
      .glow {
        transition: opacity var(--mt-motion-dur) var(--mt-motion-ease);
      }
      .dial.off .glow {
        opacity: 0.5;
      }

      /* Markers orbit the center so they ride the arc and stay on the ring. */
      .markers {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }
      .orbit {
        position: absolute;
        inset: 0;
        transform-origin: 50% 50%;
        transition: transform var(--mt-motion-dur) var(--mt-motion-ease);
      }
      .o-dot {
        position: absolute;
        left: 50%;
        top: 9.375%; /* (160-130)/320 — on the ring centerline */
        transform: translate(-50%, -50%);
        border-radius: 50%;
        background: var(--mt-on-surface);
      }
      .o-dot.setpoint {
        width: clamp(9px, 4.4cqi, 14px);
        height: clamp(9px, 4.4cqi, 14px);
      }
      .o-dot.current {
        width: clamp(7px, 3.1cqi, 10px);
        height: clamp(7px, 3.1cqi, 10px);
        opacity: 0.55;
      }
      .o-label {
        position: absolute;
        left: 50%;
        top: 18.75%; /* (160-100)/320 — just inside the ring */
        transition: transform var(--mt-motion-dur) var(--mt-motion-ease);
      }
      .o-label .num {
        font-size: clamp(8px, 4.6cqi, var(--md-sys-typescale-title-medium-size, 16px));
        font-weight: 500;
        line-height: 1;
        color: var(--mt-on-surface);
        white-space: nowrap;
      }
      .o-label .num.current {
        color: var(--mt-on-surface-variant);
      }
      /* Merged marker: temperature stays anchored at its angle; the mode icon
         hangs to its left, vertically centered. */
      .o-label .num.with-icon {
        position: relative;
      }
      .mode-icon {
        --mdc-icon-size: clamp(13px, 6.25cqi, 20px);
        color: var(--dial-color);
      }
      .mode-icon.inline {
        position: absolute;
        right: 100%;
        top: 50%;
        transform: translateY(-50%);
        margin-right: 4px;
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
        font-size: clamp(10px, 5cqi, var(--md-sys-typescale-title-medium-size, 16px));
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
        font-size: clamp(15px, 12.5cqi, var(--md-sys-typescale-display-small-size, 40px));
      }
      .temp.dual .dash {
        font-size: clamp(15px, 12.5cqi, var(--md-sys-typescale-display-small-size, 40px));
        color: var(--mt-on-surface-variant);
      }
      .value-text {
        font-size: clamp(22px, 20cqi, var(--md-sys-typescale-display-large-size, 64px));
        font-weight: 400;
        letter-spacing: -0.02em;
        color: var(--dial-color);
      }
      .unit {
        font-size: clamp(11px, 7cqi, var(--md-sys-typescale-title-large-size, 22px));
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
        top: 80%;
        transform: translate(-50%, -50%);
        display: flex;
        /* gap scales with the dial (low floor) so +/- track the circle's size */
        gap: clamp(10px, 8.5cqi, 30px);
        pointer-events: none;
      }
      .step {
        /* scale with the dial; low floor so the buttons shrink with the circle
           (not pinned large) at small sizes */
        width: clamp(22px, 11cqi, 38px);
        height: clamp(22px, 11cqi, 38px);
        border-radius: var(--mt-shape-full);
        border: none;
        background: transparent;
        color: var(--mt-on-surface-variant);
        display: grid;
        place-items: center;
        cursor: pointer;
        pointer-events: auto;
        transition:
          background-color 180ms var(--mt-motion-ease),
          transform 120ms var(--mt-motion-ease);
        -webkit-tap-highlight-color: transparent;
      }
      .step ha-icon {
        --mdc-icon-size: clamp(12px, 6cqi, 22px);
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
