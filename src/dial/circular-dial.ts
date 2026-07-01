import { LitElement, html, svg, css, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokens, climateModeColor, HVAC_MODE_ICONS } from '../theme';
import { spreadAngles } from './label-spread';

// Register --dial-color as an animatable <color> so the halo/ring/number can
// cross-fade between mode colors (a plain custom property would jump).
try {
  (CSS as any).registerProperty?.({
    name: '--dial-color',
    syntax: '<color>',
    inherits: true,
    initialValue: 'transparent',
  });
  // registerProperty succeeds in supported browsers; the catch below only fires
  // on older engines or on a duplicate registration.
  /* c8 ignore next 3 */
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
const SIDE_GUARD_DEG = 26; // a numeric marker this close to 3/9 o'clock crowds the centre readout
const TAP_SLOP_PX = 10; // movement past this turns a ring press from a tap into a scroll/scrub
const LABEL_SEP_DEG = 24; // min angular gap kept between orbiting labels (slide along the arc)

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
  /* c8 ignore next -- the sole caller spans the full 270° ring, always > 180° */
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
  /** Optional preset icon shown under the temperature (e.g. the eco leaf). */
  @property() presetIcon?: string;
  /** Optional color for the preset icon (defaults to the muted variant). */
  @property() presetIconColor?: string;
  /** Per-mode color overrides (from the HVAC modes feature). Falls back to the
   * built-in mode color for any mode not listed. Feeds the halo/ring/number. */
  @property({ attribute: false }) modeColors: Record<string, string> = {};
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
  /** Dual mode: which setpoint the +/- buttons adjust (null → nearest to current). */
  @state() private _selected: 'low' | 'high' | null = null;
  /** Ring-tap tracking: the press origin and whether it may still resolve to a tap. */
  private _pressX = 0;
  private _pressY = 0;
  private _tapArmed = false;
  /** While a mode-color change wipes across the ring: the outgoing color. */
  @state() private _wipeFrom: string | null = null;
  /** Tracks the last applied dial color to detect mode-color changes. */
  private _prevColor?: string;
  /** Whether the previous mode was an off/uncolored mode. */
  private _prevOff = false;
  /** Dual mode: show the "Heat/Cool" range (just after a setpoint change). */
  @state() private _showRangeTimer = false;
  private _rangeTimer?: number;
  private _prevLow?: number;
  private _prevHigh?: number;

  @query('svg') private _svg!: SVGSVGElement;

  /** The neutral gray used for an inactive range / a demand that makes no sense. */
  private static readonly IDLE_COLOR = 'var(--mt-on-surface-variant)';

  /**
   * Dual mode only: the active sub-mode derived from the CURRENT temperature vs
   * the setpoints — cooling above the high setpoint, heating below the low one,
   * otherwise idle (within range).
   */
  private get _dualActive(): 'cool' | 'heat' | null {
    if (!this.dual) return null;
    // Prefer the real HVAC action (passed in as `mode`): a unit that reports it's
    // cooling/heating wins over the current-vs-setpoint inference, so the dial
    // reflects what it's actually doing even when the temp sits inside the band.
    if (this.mode === 'cool') return 'cool';
    if (this.mode === 'heat') return 'heat';
    if (this.current == null) return null;
    if (this.current > this._displayHigh) return 'cool';
    if (this.current < this._displayLow) return 'heat';
    return null;
  }

  /**
   * Dual mode: the setpoint the +/- buttons adjust — the explicitly selected one,
   * else the setpoint nearest the current temperature (the sensible default).
   */
  private get _selSide(): 'low' | 'high' {
    if (this._selected) return this._selected;
    if (this.current == null) return 'low';
    return Math.abs(this.current - this._displayLow) <= Math.abs(this.current - this._displayHigh)
      ? 'low'
      : 'high';
  }

  /** The mode that drives the dial's color (the active sub-mode in dual). */
  private get _effectiveMode(): string {
    if (this.dual) return this._dualActive ?? 'heat_cool';
    return this.mode;
  }

  /**
   * Whether a single-mode demand direction is meaningful (cooling needs the
   * current temp above the setpoint, heating below) — otherwise the segment is
   * drawn gray since nothing is being heated/cooled.
   */
  private get _demandSensible(): boolean {
    if (this.current == null) return false;
    if (this.mode === 'cool') return this.current > this._displayValue;
    if (this.mode === 'heat') return this.current < this._displayValue;
    return true; // auto / dry / fan_only keep their own color
  }

  /**
   * The color for a mode: an explicit per-mode override (from the HVAC feature),
   * else the built-in semantic mode color.
   * @param mode the climate mode
   */
  private _modeColor(mode: string): string {
    return this.modeColors[mode] ?? climateModeColor(mode);
  }

  /** The dial's mode color (off / idle modes use the neutral variant). */
  private get _dialColor(): string {
    return COLORED_MODES.includes(this._effectiveMode)
      ? this._modeColor(this._effectiveMode)
      : MtCircularDial.IDLE_COLOR;
  }

  /** Show the "Heat/Cool" range readout (vs. the collapsed active-mode readout). */
  private get _showRange(): boolean {
    return this._dragging || this._showRangeTimer || this._dualActive === null;
  }

  /**
   * Whether a numeric marker sits near the 3 or 9 o'clock position, where it
   * would crowd the (horizontally widest) centre readout. When true the centre
   * shrinks and wraps so the setpoint/current labels don't overlap the value or
   * unit (only the current dot carries a number in single mode; both setpoints
   * and the current dot do in dual).
   */
  private get _centerTight(): boolean {
    const near = (v?: number): boolean => {
      if (v == null) return false;
      const a = ((this._angleOf(v) % 360) + 360) % 360;
      return Math.min(Math.abs(a - 90), Math.abs(a - 270)) <= SIDE_GUARD_DEG;
    };
    // With show_current_as_primary the current dot carries no label, while the
    // setpoint(s) do — so the marker that can crowd the centre flips.
    if (this.dual)
      return (
        near(this._displayLow) ||
        near(this._displayHigh) ||
        (!this.showCurrentAsPrimary && near(this.current))
      );
    // Single mode: shrink ONLY when the centre number is wide enough (≥ 4 chars,
    // e.g. "26.4") to actually collide with a marker near the 3/9 o'clock axis.
    // A short setpoint ("24") never collides, so it keeps the full size — this is
    // what keeps the number a consistent size across cards regardless of where a
    // given entity's markers happen to fall.
    return (
      near(this.showCurrentAsPrimary ? this._displayValue : this.current) &&
      this._singleReadoutWide
    );
  }

  /**
   * Whether the single-mode centre number is wide enough (≥ 4 characters, e.g.
   * "26.4") to risk overlapping a marker near the 3/9 o'clock axis. Mirrors the
   * big-number choice in {@link _renderSingleCenter}.
   */
  private get _singleReadoutWide(): boolean {
    const big =
      this.showCurrentAsPrimary && this.current != null ? this.current : this._displayValue;
    const precision = this.showCurrentAsPrimary ? 1 : this._precision;
    return this._fmt(big, precision).length >= 4;
  }

  /** Show the range for 5s after a setpoint change, then collapse to the mode. */
  private _bumpRangeDisplay(): void {
    this._showRangeTimer = true;
    if (this._rangeTimer) clearTimeout(this._rangeTimer);
    this._rangeTimer = window.setTimeout(() => {
      this._showRangeTimer = false;
    }, 5000);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._rangeTimer) clearTimeout(this._rangeTimer);
  }

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
   * Begin a press on the ring. On touch we only ARM a tap and let the gesture
   * bubble (so a swipe scrolls the page) — the dial is scrubbed by dragging a
   * setpoint handle, or set directly by a tap. Mouse/pen has no scroll gesture
   * to honor, so a ring press scrubs immediately.
   * @param e pointer event
   */
  private _onPointerDown = (e: PointerEvent): void => {
    if (this.disabled || !this._isRingHit(e.clientX, e.clientY)) return;
    this._pressX = e.clientX;
    this._pressY = e.clientY;
    if (e.pointerType === 'touch') {
      this._tapArmed = true;
      return;
    }
    this._beginDrag(e, null);
    this._emitFromValue(this._valueFromPoint(e.clientX, e.clientY));
  };

  /**
   * Track the press: cancel a pending tap once it moves past the slop (it's a
   * scroll/scrub, not a tap), and feed live values while dragging.
   * @param e pointer event
   */
  private _onPointerMove = (e: PointerEvent): void => {
    if (this._tapArmed && this._movedPastSlop(e)) this._tapArmed = false;
    if (!this._dragging) return;
    this._emitFromValue(this._valueFromPoint(e.clientX, e.clientY));
  };

  /**
   * Commit the interaction: a clean tap sets the temperature at that point; a
   * drag commits its final value.
   * @param e pointer event
   */
  private _onPointerUp = (e: PointerEvent): void => {
    if (this._tapArmed) {
      this._tapArmed = false;
      this._commitTap(e);
      return;
    }
    if (!this._dragging) return;
    this._endDrag(e);
  };

  /**
   * The browser took the gesture over (e.g. to scroll the page): it was never a
   * tap, so disarm — and end any in-progress drag at its last (already
   * optimistically shown) value.
   * @param e pointer event
   */
  private _onPointerCancel = (e: PointerEvent): void => {
    this._tapArmed = false;
    if (this._dragging) this._endDrag(e);
  };

  /**
   * Whether the pointer has moved beyond the tap slop since the press began.
   * @param e pointer event
   */
  private _movedPastSlop(e: PointerEvent): boolean {
    return Math.hypot(e.clientX - this._pressX, e.clientY - this._pressY) > TAP_SLOP_PX;
  }

  /**
   * Begin a drag — a ring scrub (mouse/pen) or a setpoint-handle grab. Claims
   * the pointer so it tracks the finger anywhere on the dial, and seeds the drag
   * state from the values shown BEFORE flipping `_dragging` (the `_display*`
   * getters switch to the drag state once dragging).
   * @param e pointer event
   * @param handle the dual setpoint to drag, or null to pick the nearest
   */
  private _beginDrag(e: PointerEvent, handle: 'low' | 'high' | null): void {
    e.preventDefault();
    this._svg.setPointerCapture(e.pointerId);
    this._tapArmed = false;
    const startLow = this._displayLow;
    const startHigh = this._displayHigh;
    const startValue = this._displayValue;
    this._dragging = true;
    if (this.dual) {
      this._dragLow = startLow;
      this._dragHigh = startHigh;
      if (handle) {
        this._activeHandle = handle;
      } else {
        const v = this._valueFromPoint(e.clientX, e.clientY);
        this._activeHandle =
          Math.abs(v - this._dragLow) <= Math.abs(v - this._dragHigh) ? 'low' : 'high';
      }
      this._selected = this._activeHandle; // grabbing a handle selects it for +/-
    } else {
      this._dragValue = startValue;
    }
  }

  /**
   * Commit and clear a drag.
   * @param e pointer event
   */
  private _endDrag(e: PointerEvent): void {
    this._svg.releasePointerCapture(e.pointerId);
    this._dragging = false;
    if (this.dual) {
      this._emit('value-changed', { low: this._dragLow, high: this._dragHigh });
      this._activeHandle = null;
    } else {
      this._emit('value-changed', { value: this._dragValue });
    }
  }

  /**
   * Set the temperature from a tap on the ring: the single setpoint, or the
   * nearer of the two dual setpoints (kept on its side of the other by a step).
   * @param e pointer event
   */
  private _commitTap(e: PointerEvent): void {
    const v = this._valueFromPoint(e.clientX, e.clientY);
    if (this.dual) {
      const lo = this._displayLow;
      const hi = this._displayHigh;
      if (Math.abs(v - lo) <= Math.abs(v - hi)) {
        this._selected = 'low'; // tapping near a setpoint selects it for +/-
        this._emit('value-changed', { low: Math.min(v, hi - this.step), high: hi });
      } else {
        this._selected = 'high';
        this._emit('value-changed', { low: lo, high: Math.max(v, lo + this.step) });
      }
    } else {
      this._emit('value-changed', { value: v });
    }
  }

  /**
   * Begin dragging a setpoint handle. Stops the press from also arming a ring
   * tap, then starts a drag of that setpoint (grabbing it doesn't change the
   * value — the first move does).
   * @param e pointer event
   * @param handle the dual setpoint to drag, or null in single mode
   */
  private _onHandlePointerDown(e: PointerEvent, handle: 'low' | 'high' | null): void {
    if (this.disabled) return;
    e.stopPropagation();
    this._beginDrag(e, handle);
  }

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
   * Step the target temperature. In dual mode this nudges the selected setpoint
   * (kept on its side of the other by a step); otherwise the single target.
   * @param delta number of steps (±1)
   */
  private _step(delta: number): void {
    if (this.disabled) return;
    if (this.dual) {
      if (this._selSide === 'low') {
        const low = Math.min(
          this._roundToStep(this._displayLow + delta * this.step),
          this._displayHigh - this.step
        );
        this._emit('value-changed', { low, high: this._displayHigh });
      } else {
        const high = Math.max(
          this._roundToStep(this._displayHigh + delta * this.step),
          this._displayLow + this.step
        );
        this._emit('value-changed', { low: this._displayLow, high });
      }
      return;
    }
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
  private _fmtCompact(value: number | undefined): string {
    if (value == null || Number.isNaN(value)) return '—';
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
   * A label that orbits to its angle but stays upright (counter-rotated). The
   * angle may differ slightly from the marker's true angle when labels are
   * de-overlapped along the arc; the `.orbit` transform transition then slides
   * the label into place (and labels cross/swap smoothly as setpoints pass).
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

  /**
   * An invisible, generously-sized drag target that orbits to a setpoint's
   * angle. Grabbing it is the only way touch scrubs the dial (a swipe anywhere
   * else scrolls the page); it `touch-action: none`s the gesture so the drag is
   * never interrupted by a scroll.
   * @param angle angle in degrees
   * @param handle the dual setpoint this grabs (null in single mode)
   */
  private _handleOrbit(angle: number, handle: 'low' | 'high' | null): TemplateResult {
    return html`<div class="orbit" style=${`transform: rotate(${angle}deg)`}>
      <div
        class="handle"
        @pointerdown=${(e: PointerEvent) => this._onHandlePointerDown(e, handle)}
      ></div>
    </div>`;
  }

  /**
   * Detect a mode-color change and kick off the left-to-right wipe: the new
   * color (base segment) slides in from the left exactly like the turn-on
   * animation, while an overlay of the old color slides out through the right
   * end of the arc — so the boundary sweeps from old to new.
   * @param changed changed properties
   */
  protected updated(changed: PropertyValues): void {
    // Dual mode: show the "Heat/Cool" range for 5s after a setpoint changes
    // (skip the initial set, when there's no previous value to compare).
    if (this.dual && (changed.has('lowValue') || changed.has('highValue'))) {
      if (
        (this._prevLow !== undefined && this._prevLow !== this.lowValue) ||
        (this._prevHigh !== undefined && this._prevHigh !== this.highValue)
      ) {
        this._bumpRangeDisplay();
      }
      this._prevLow = this.lowValue;
      this._prevHigh = this.highValue;
    }

    if (!changed.has('mode')) return;
    const color = this._dialColor;
    const off = !COLORED_MODES.includes(this.mode);
    // The wipe is for single colored→colored mode changes; dual recolors via the
    // CSS stroke transition (its segments and colors are temperature-derived).
    if (
      !this.dual &&
      this._prevColor !== undefined &&
      this._prevColor !== color &&
      !off &&
      !this._prevOff
    ) {
      // Render the old-color overlay (sets _wipeFrom), then animate it once the
      // overlay is in the DOM. _runWipe clears _wipeFrom when the wipe finishes.
      this._wipeFrom = this._prevColor;
      void this.updateComplete.then(() => this._runWipe());
    }
    this._prevColor = color;
    this._prevOff = off;
  }

  /**
   * Animate the mode-color change as a left-to-right wipe along the value arc.
   * The new color (base segment) replays the turn-on animation — sliding in
   * from the arc start — while the old color (overlay segment) keeps its length
   * and slides out through the right end of the arc. Driven by the Web
   * Animations API so the keyframes can use the live segment geometry.
   */
  private _runWipe(): void {
    const newSeg = this.renderRoot.querySelector('.value:not(.wipe-value)') as SVGElement | null;
    const oldSeg = this.renderRoot.querySelector('.wipe-value') as SVGElement | null;
    const done = (): void => {
      this._wipeFrom = null;
    };
    if (!newSeg || !oldSeg) return done();
    // The rendered segment always carries both dash attributes (set in render),
    // and we've already returned above when newSeg is absent.
    const segLen = parseFloat(newSeg.getAttribute('stroke-dasharray')!);
    const segStart = -parseFloat(newSeg.getAttribute('stroke-dashoffset')!); // segS × 1000
    if (segLen <= 0) return done();
    const opts: KeyframeAnimationOptions = { duration: 460, easing: 'cubic-bezier(0.2, 0, 0, 1)' };
    // New: the exact turn-on draw — the dash grows from zero at the arc start
    // while its origin travels to the segment's resting position (slide in from
    // the left).
    newSeg.animate(
      [
        { strokeDasharray: `0 1000`, strokeDashoffset: `0` },
        { strokeDasharray: `${segLen} 1000`, strokeDashoffset: `${-segStart}` },
      ],
      opts
    );
    // Old (painted on top): keep the segment's length and translate its origin
    // to the path end, so the whole band slides out past frac 1.0 (exits through
    // the right) and reveals the incoming new color behind it.
    const old = oldSeg.animate(
      [
        { strokeDasharray: `${segLen} 1000`, strokeDashoffset: `${-segStart}` },
        { strokeDasharray: `${segLen} 1000`, strokeDashoffset: `-1000` },
      ],
      { ...opts, fill: 'forwards' }
    );
    old.finished.then(done, done);
  }

  protected render(): TemplateResult {
    const isOff = !COLORED_MODES.includes(this.mode);
    const color = this._dialColor;
    const modeIcon = HVAC_MODE_ICONS[this.mode] ?? 'mdi:thermostat';

    const showCurrent =
      this.current != null && this.current >= this.min && this.current <= this.max;
    const spAngle = this._angleOf(this._displayValue);
    const curAngle = showCurrent ? this._angleOf(this.current!) : 0;
    const overlap = !this.dual && showCurrent && !isOff && Math.abs(spAngle - curAngle) < OVERLAP_DEG;

    // Dual marker geometry + the +/- selection.
    const lowAngle = this._angleOf(this._displayLow);
    const highAngle = this._angleOf(this._displayHigh);
    const selSide = this.dual ? this._selSide : null;

    const ringPath = arcPath(ARC_START, ARC_START + SWEEP, RADIUS);

    // Single-mode demand segment: between the setpoint and the current temp. It's
    // a persistent path (so it animates on turn on/off and during the mode wipe);
    // grayed when the demand direction makes no sense (see _demandSensible).
    let segS = 0;
    let segE = 0;
    let showSeg = false;
    let segColor = color;
    if (!this.dual && showCurrent && !isOff) {
      segS = Math.min(this._fracOf(this._displayValue), this._fracOf(this.current!));
      segE = Math.max(this._fracOf(this._displayValue), this._fracOf(this.current!));
      showSeg = true;
      segColor = this._demandSensible ? color : MtCircularDial.IDLE_COLOR;
    }
    const dashArray = `${((segE - segS) * 1000).toFixed(2)} 1000`;
    const dashOffset = (-segS * 1000).toFixed(2);

    // Dual-mode segments: a comfort "range" band between the two setpoints plus a
    // "demand" overshoot band — BOTH always rendered (the demand is opacity 0
    // when idle) so they cross-fade as the sub-mode changes instead of popping.
    const dualSegs: Array<{ from: number; to: number; color: string; opacity: number; cls: string }> =
      [];
    if (this.dual) {
      const lo = this._fracOf(this._displayLow);
      const hi = this._fracOf(this._displayHigh);
      const active = this._dualActive;
      // Comfort range: heat_cool color (green) when the current temp is within it
      // (idle), muted gray while actively heating/cooling the overshoot.
      dualSegs.push({
        from: lo,
        to: hi,
        color: active === null ? color : MtCircularDial.IDLE_COLOR,
        opacity: active === null ? 1 : 0.5,
        cls: 'range',
      });
      // Demand overshoot: cooling above the high setpoint (blue) / heating below
      // the low one (orange). Geometry is continuous across the boundary (it
      // shrinks to zero as a setpoint meets the current temp), so toggling its
      // opacity cross-fades it cleanly instead of popping in/out.
      const cur = showCurrent ? this._fracOf(this.current!) : hi;
      const coolSide =
        this.current != null && this.current >= (this._displayLow + this._displayHigh) / 2;
      dualSegs.push({
        from: coolSide ? hi : Math.min(lo, cur),
        to: coolSide ? Math.max(hi, cur) : lo,
        color: coolSide ? this._modeColor('cool') : this._modeColor('heat'),
        opacity: active === null ? 0 : 1,
        cls: 'demand',
      });
    }

    // Collapsed dual: the targeted setpoint marker shows the active sub-mode icon
    // (like single mode), so the icon sits at the setpoint, not in the centre.
    const dualActive = this._dualActive;
    const collapsedDual = this.dual && !this._showRange;
    const currentLabel = html`<span class="num current">${this._fmtCompact(this.current!)}°</span>`;
    const modeIconEl = html`<ha-icon class="mode-icon" icon=${modeIcon}></ha-icon>`;
    const dualSetIconEl = html`<ha-icon
      class="mode-icon"
      icon=${HVAC_MODE_ICONS[dualActive === 'cool' ? 'cool' : 'heat']}
    ></ha-icon>`;

    // Dual labels: low, high and (optionally) the current temp can cluster — most
    // obviously in heat_cool. Keep each at the ring radius but spread their angles
    // along the arc so they don't overlap, instead of pulling one toward the
    // centre. The dots stay at their true angle; labels slide (and cross) via the
    // .orbit transform transition when a setpoint passes another point.
    const showCurLabel = this.dual && showCurrent && !this.showCurrentAsPrimary;
    const lowLabel =
      collapsedDual && dualActive === 'heat' && !this.showCurrentAsPrimary
        ? dualSetIconEl
        : html`<span class="num ${selSide === 'low' ? 'sel' : ''}"
            >${this._fmtCompact(this._displayLow)}°</span
          >`;
    const highLabel =
      collapsedDual && dualActive === 'cool' && !this.showCurrentAsPrimary
        ? dualSetIconEl
        : html`<span class="num ${selSide === 'high' ? 'sel' : ''}"
            >${this._fmtCompact(this._displayHigh)}°</span
          >`;
    const dualLabelAngles = showCurLabel
      ? [lowAngle, highAngle, curAngle]
      : [lowAngle, highAngle];
    const dualLabelSpread = this.dual
      ? spreadAngles(dualLabelAngles, LABEL_SEP_DEG, ARC_START, ARC_START + SWEEP)
      : [];

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
          @pointercancel=${this._onPointerCancel}
          @keydown=${this._onKeyDown}
        >
          <defs>
            <!-- Soft halo: full color at the center easing smoothly out to fully
                 transparent at the perimeter (no hard edge / residual disc). -->
            <radialGradient id="mt-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="var(--dial-color)" stop-opacity="0.38" />
              <stop offset="20%" stop-color="var(--dial-color)" stop-opacity="0.3" />
              <stop offset="40%" stop-color="var(--dial-color)" stop-opacity="0.2" />
              <stop offset="60%" stop-color="var(--dial-color)" stop-opacity="0.11" />
              <stop offset="80%" stop-color="var(--dial-color)" stop-opacity="0.04" />
              <stop offset="100%" stop-color="var(--dial-color)" stop-opacity="0" />
            </radialGradient>
          </defs>
          <circle class="glow" cx=${CENTER} cy=${CENTER} r="150" fill="url(#mt-glow)" />
          <path class="ring" d=${ringPath} />
          ${this.dual
            ? dualSegs.map(
                (seg) => svg`<path
                  class=${`value ${seg.cls}`}
                  d=${ringPath}
                  pathLength="1000"
                  stroke-dasharray=${`${(Math.max(0, seg.to - seg.from) * 1000).toFixed(2)} 1000`}
                  stroke-dashoffset=${(-seg.from * 1000).toFixed(2)}
                  style=${`opacity:${seg.opacity};stroke:${seg.color}`}
                />`
              )
            : svg`<path
                class="value"
                d=${ringPath}
                pathLength="1000"
                stroke-dasharray=${dashArray}
                stroke-dashoffset=${dashOffset}
                style=${`opacity:${showSeg ? 1 : 0};stroke:${segColor}`}
              />`}
          <path class="hit" d=${ringPath} />
          ${!this.dual && this._wipeFrom && showSeg
            ? svg`<path
                class="value wipe-value"
                d=${ringPath}
                pathLength="1000"
                stroke-dasharray=${dashArray}
                stroke-dashoffset=${dashOffset}
                style=${`stroke:${this._wipeFrom};opacity:1`}
              />`
            : nothing}
        </svg>

        <div class="markers">
          ${this.dual
            ? html`
                ${this._dotOrbit(lowAngle, `setpoint${selSide === 'low' ? ' sel' : ''}`)}
                ${this._dotOrbit(highAngle, `setpoint${selSide === 'high' ? ' sel' : ''}`)}
                ${showCurrent ? this._dotOrbit(curAngle, 'current') : nothing}
                ${this._labelOrbit(dualLabelSpread[0], lowLabel)}
                ${this._labelOrbit(dualLabelSpread[1], highLabel)}
                ${showCurLabel ? this._labelOrbit(dualLabelSpread[2], currentLabel) : nothing}
                ${this._handleOrbit(lowAngle, 'low')}
                ${this._handleOrbit(highAngle, 'high')}
              `
            : html`
                ${this._dotOrbit(spAngle, 'setpoint')}
                ${showCurrent ? this._dotOrbit(curAngle, 'current') : nothing}
                ${this.showCurrentAsPrimary
                  ? // Current is the big centre number, so the setpoint marker
                    // carries the target value and the current dot stays bare.
                    this._labelOrbit(
                      spAngle,
                      html`<span class="num">${this._fmtCompact(this._displayValue)}°</span>`
                    )
                  : overlap
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
                ${this._handleOrbit(spAngle, null)}
              `}
        </div>

        ${this.dual ? this._renderDualCenter() : this._renderSingleCenter()}
        ${this._renderPresetIcon()} ${this._renderAdjust()}
      </div>
    `;
  }

  /**
   * The mode/status line above the number. The HVAC mode chips already show the
   * mode (à la Google Home), so this is shown only to surface an
   * unavailable/disabled state — never the normal "Cool"/"Heat"/"Dry" label.
   */
  private _renderStatus(): TemplateResult | typeof nothing {
    return this.disabled && this.modeLabel
      ? html`<div class="mode">${this.modeLabel}</div>`
      : nothing;
  }

  /**
   * The preset icon (e.g. the eco leaf), if configured. Positioned absolutely
   * just above the +/- controls and horizontally centered — like Google Home —
   * so it doesn't shift the centered temperature off the dial's true center.
   */
  private _renderPresetIcon(): TemplateResult | typeof nothing {
    return this.presetIcon
      ? html`<ha-icon
          class="preset-icon"
          icon=${this.presetIcon}
          style=${this.presetIconColor ? `color: ${this.presetIconColor}` : nothing}
        ></ha-icon>`
      : nothing;
  }

  /** Center readout for single mode. */
  private _renderSingleCenter(): TemplateResult {
    const target = this._displayValue;
    const big = this.showCurrentAsPrimary && this.current != null ? this.current : target;
    const bigPrecision = this.showCurrentAsPrimary ? 1 : this._precision;
    return html`
      <div class=${classMap({ center: true, tight: this._centerTight })}>
        ${this._renderStatus()}
        <div class="temp">
          <span class="value-text">${this._fmt(big, bigPrecision)}</span>
          <span class="unit">${this.unit}</span>
        </div>
      </div>
    `;
  }

  /**
   * Center readout for dual mode. Shows the "Heat/Cool" range while dragging and
   * for 5s after a setpoint changes (or while idle within the range), then
   * collapses to the active sub-mode + the single setpoint being targeted
   * (the high setpoint while cooling, the low setpoint while heating).
   */
  private _renderDualCenter(): TemplateResult {
    if (this._showRange) {
      // While actively changing (dragging or the 5s post-change window) the range
      // is shown at the larger dynamic size; once it settles it shrinks back so it
      // isn't oversized at rest.
      const emphasized = this._dragging || this._showRangeTimer;
      return html`
        <div class=${classMap({ center: true, tight: this._centerTight })}>
          ${this._renderStatus()}
          <div class=${classMap({ temp: true, dual: true, settled: !emphasized })}>
            <span class="value-text">${this._fmt(this._displayLow, this._precision)}</span>
            <span class="dash">–</span>
            <span class="value-text">${this._fmt(this._displayHigh, this._precision)}</span>
            <span class="unit">${this.unit}</span>
          </div>
        </div>
      `;
    }
    const active = this._dualActive;
    const target = active === 'cool' ? this._displayHigh : this._displayLow;
    // Honor show_current_as_primary: the big number is the current temperature
    // (the targeted setpoint is shown by the mode-icon marker on the ring).
    const big = this.showCurrentAsPrimary && this.current != null ? this.current : target;
    const bigPrecision = this.showCurrentAsPrimary ? 1 : this._precision;
    return html`
      <div class=${classMap({ center: true, tight: this._centerTight })}>
        ${this._renderStatus()}
        <div class="temp">
          <span class="value-text">${this._fmt(big, bigPrecision)}</span>
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
        /* no grey flash when a tap lands on the dial (mobile WebKit/Blink) */
        -webkit-tap-highlight-color: transparent;
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
        /* The orbiting marker layers are full-size squares rotated to ride the
           arc; a rotated square's corners poke past the dial box. Clip them here
           so they don't add page-level horizontal overflow on mobile (the corners
           are empty, so nothing visible is lost). */
        overflow: hidden;
      }
      svg {
        display: block; /* avoid inline baseline gap that offsets the SVG vs marker overlays */
        width: 100%;
        height: 100%;
        /* A swipe over the dial scrolls the page; a tap on the ring sets the
           temperature; scrubbing is done by dragging a setpoint handle (which
           claims its own gesture). */
        touch-action: pan-y;
        outline: none;
        /* the dial is tap/drag controlled — no text selection or grey tap flash */
        -webkit-tap-highlight-color: transparent;
        -webkit-user-select: none;
        user-select: none;
        -webkit-touch-callout: none;
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
        /* a swipe here scrolls the page (pan-y); a tap sets the temperature —
           the gesture is only swallowed when dragging a setpoint handle */
        touch-action: pan-y;
        cursor: pointer;
      }
      .dial.disabled .hit {
        cursor: default;
      }
      /* Invisible, finger-sized drag target centered on a setpoint dot. It rides
         the ring via the same orbit/rotate as the markers. Dragging it scrubs
         the dial; touch-action:none keeps a scroll from interrupting the drag. */
      .handle {
        position: absolute;
        left: 50%;
        top: 9.375%; /* on the ring centerline, like .o-dot */
        width: clamp(34px, 16cqi, 48px);
        height: clamp(34px, 16cqi, 48px);
        transform: translate(-50%, -50%);
        border-radius: 50%;
        pointer-events: auto;
        touch-action: none;
        cursor: grab;
        -webkit-tap-highlight-color: transparent;
      }
      .handle:active {
        cursor: grabbing;
      }
      .dial.disabled .handle {
        pointer-events: none;
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
          stroke var(--mt-motion-dur) var(--mt-motion-ease),
          opacity var(--mt-motion-dur) var(--mt-motion-ease);
      }
      .glow {
        transition: opacity var(--mt-motion-dur) var(--mt-motion-ease);
      }
      .dial.off .glow {
        opacity: 0.5;
      }
      /* Mode-change wipe: an overlay of the OLD color value segment is laid over
         the dial — now painted in the NEW color — and slides out through the
         right end of the arc (driven by the Web Animations API in _runWipe),
         while the new color slides in from the left behind it. */
      .wipe-value {
        pointer-events: none;
        transition: none;
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
        transition:
          box-shadow var(--mt-motion-dur) var(--mt-motion-ease),
          transform var(--mt-motion-dur) var(--mt-motion-ease);
      }
      /* The setpoint the +/- buttons act on (dual mode): a ring in the dial color
         around the dot makes the active handle obvious. */
      .o-dot.setpoint.sel {
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--dial-color) 70%, transparent);
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
      /* The selected setpoint's number, tinted to match its highlighted dot. */
      .o-label .num.sel {
        color: var(--dial-color);
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
      /* Preset icon (à la Google Home's eco leaf) — pinned just above the +/-
         controls and horizontally centered, so it never shifts the temperature
         off the dial's true center. */
      .preset-icon {
        position: absolute;
        left: 50%;
        top: 70%;
        transform: translate(-50%, -50%);
        --mdc-icon-size: clamp(14px, 7cqi, 22px);
        color: var(--mt-on-surface-variant);
        pointer-events: none;
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
      /* The heat/cool range packs two numbers + a dash + unit across the dial, so
         it is sized well below the single-mode hero number — even while being
         actively changed — and shrinks a touch more once it settles. */
      .temp.dual .value-text {
        font-size: clamp(13px, 7cqi, 24px);
      }
      .temp.dual .dash {
        font-size: clamp(13px, 7cqi, 24px);
        color: var(--mt-on-surface-variant);
      }
      /* At rest (not dragging / >5s after a change) the range shrinks so it isn't
         oversized when it's just sitting there idle. */
      .temp.dual.settled .value-text,
      .temp.dual.settled .dash {
        font-size: clamp(12px, 5.5cqi, 20px);
      }
      /* A numeric marker near 3/9 o'clock crowds the centre readout — shrink and
         allow the value/unit to wrap so the orbiting labels don't overlap it. */
      .center.tight .temp {
        max-width: 46%;
        flex-wrap: wrap;
        justify-content: center;
      }
      .center.tight .value-text {
        font-size: clamp(13px, 14cqi, 46px);
      }
      .center.tight .unit {
        font-size: clamp(9px, 5cqi, 16px);
      }
      .center.tight .temp.dual .value-text,
      .center.tight .temp.dual .dash {
        font-size: clamp(12px, 7cqi, 22px);
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
