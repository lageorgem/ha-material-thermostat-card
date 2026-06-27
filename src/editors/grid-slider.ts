import { LitElement, html, css, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

type TooltipMode = 'never' | 'always' | 'interaction';

const A11Y_KEYS = new Set([
  'ArrowRight',
  'ArrowUp',
  'ArrowLeft',
  'ArrowDown',
  'PageUp',
  'PageDown',
  'Home',
  'End',
]);

/**
 * A self-contained re-implementation of Home Assistant's internal
 * `ha-grid-layout-slider` (the dotted-track slider used in the card "Layout"
 * editor): a rounded track with step dots, a bar handle, and a floating value
 * tooltip. Ported to native Pointer Events (no hammerjs) and styled with the
 * same HA theme variables (with fallbacks) so it matches the stock control while
 * staying independent of HA's lazily-loaded editor modules.
 *
 * Emits `value-changed` (`{ value }`) on commit (tap / drag end / key) and
 * `slider-moved` (`{ value }`) live during a drag.
 */
@customElement('mt-grid-slider')
export class MtGridSlider extends LitElement {
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Number }) value?: number;
  @property({ type: Number }) step = 1;
  @property({ type: Number }) min = 1;
  @property({ type: Number }) max = 4;
  /** Visual full-scale of the track (defaults to `max`). */
  @property({ type: Number }) range?: number;
  @property({ attribute: 'tooltip-mode' }) tooltipMode: TooltipMode = 'interaction';

  @state() private _pressed = false;
  @state() private _tooltipVisible = false;

  @query('#slider') private _slider!: HTMLElement;

  /** The track's full-scale value (the `range`, or `max`). */
  private get _range(): number {
    return this.range ?? this.max;
  }

  /** Clamp a value into `[min, max]`. */
  private _bounded(v: number): number {
    return Math.min(Math.max(v, this.min), this.max);
  }

  /** Snap a value to the configured step. */
  private _stepped(v: number): number {
    return Math.round(v / this.step) * this.step;
  }

  /** Value → 0..1 position along the track. */
  private _valueToPct(v: number): number {
    return this._bounded(v) / this._range;
  }

  /** A client X coordinate → 0..1 position along the track. */
  private _pctFromX(clientX: number): number {
    const rect = this._slider.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }

  protected updated(changed: PropertyValues<this>): void {
    if (changed.has('value')) {
      const now = this._stepped(this.value ?? 0).toString();
      this.setAttribute('aria-valuenow', now);
      this.setAttribute('aria-valuetext', now);
    }
    if (changed.has('min')) this.setAttribute('aria-valuemin', this.min.toString());
    if (changed.has('max')) this.setAttribute('aria-valuemax', this.max.toString());
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('role', 'slider');
    if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '0');
    this.setAttribute('aria-orientation', 'horizontal');
    this.addEventListener('keydown', this._onKeyDown);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this._onKeyDown);
  }

  /**
   * Begin a press: capture the pointer and jump the value to it.
   * @param e pointer event
   */
  private _onPointerDown = (e: PointerEvent): void => {
    if (this.disabled) return;
    e.preventDefault();
    this._slider.setPointerCapture(e.pointerId);
    this._pressed = true;
    this._tooltipVisible = true;
    this.value = this._range * this._pctFromX(e.clientX);
  };

  /**
   * Drag: follow the pointer and emit a live `slider-moved`.
   * @param e pointer event
   */
  private _onPointerMove = (e: PointerEvent): void => {
    if (!this._pressed || this.disabled) return;
    this.value = this._range * this._pctFromX(e.clientX);
    this._emit('slider-moved', this._stepped(this._bounded(this.value)));
  };

  /**
   * Commit on release.
   * @param e pointer event
   */
  private _onPointerUp = (e: PointerEvent): void => {
    if (!this._pressed) return;
    this._slider.releasePointerCapture(e.pointerId);
    this._pressed = false;
    this._tooltipVisible = false;
    this.value = this._stepped(this._bounded(this._range * this._pctFromX(e.clientX)));
    this._emit('value-changed', this.value);
  };

  /** Ten-percent jump for PageUp/PageDown. */
  private get _bigStep(): number {
    return Math.max(this.step, (this.max - this.min) / 10);
  }

  /**
   * Keyboard control (matches HA's grid slider).
   * @param e keyboard event
   */
  private _onKeyDown = (e: KeyboardEvent): void => {
    if (this.disabled || !A11Y_KEYS.has(e.key)) return;
    e.preventDefault();
    const v = this.value ?? this.min;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        this.value = this._bounded(v + this.step);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        this.value = this._bounded(v - this.step);
        break;
      case 'PageUp':
        this.value = this._stepped(this._bounded(v + this._bigStep));
        break;
      case 'PageDown':
        this.value = this._stepped(this._bounded(v - this._bigStep));
        break;
      case 'Home':
        this.value = this.min;
        break;
      case 'End':
        this.value = this.max;
        break;
    }
    this._emit('value-changed', this.value);
  };

  /**
   * Dispatch a slider event.
   * @param type the event name
   * @param value the value payload
   */
  private _emit(type: 'value-changed' | 'slider-moved', value: number | undefined): void {
    this.dispatchEvent(new CustomEvent(type, { detail: { value }, bubbles: true, composed: true }));
  }

  /** The floating value bubble. */
  private _renderTooltip(): TemplateResult | typeof nothing {
    if (this.tooltipMode === 'never') return nothing;
    const visible =
      this.tooltipMode === 'always' || (this._tooltipVisible && this.tooltipMode === 'interaction');
    const value = this._bounded(this._stepped(this.value ?? 0));
    return html`<span aria-hidden="true" class=${classMap({ tooltip: true, visible })}
      >${value}</span
    >`;
  }

  protected render(): TemplateResult {
    const dotCount = Math.round(this._range / this.step);
    return html`
      <div class=${classMap({ container: true, pressed: this._pressed })}
        style=${styleMap({ '--value': `${this._valueToPct(this.value ?? 0)}` })}>
        <div
          id="slider"
          class="slider"
          @pointerdown=${this._onPointerDown}
          @pointermove=${this._onPointerMove}
          @pointerup=${this._onPointerUp}
          @pointercancel=${this._onPointerUp}
        >
          <div class="track">
            <div class="background"></div>
            <div
              class="active"
              style=${styleMap({
                '--min': `${this.min / this._range}`,
                '--max': `${1 - this.max / this._range}`,
              })}
            ></div>
          </div>
          ${Array(dotCount)
            .fill(0)
            .map((_, i) => {
              const pct = i / dotCount;
              if (this.min >= i * this.step || i * this.step > this.max) return nothing;
              return html`<div class="dot" style=${styleMap({ '--value': `${pct}` })}></div>`;
            })}
          ${this.value !== undefined ? html`<div class="handle"></div>` : nothing}
          ${this._renderTooltip()}
        </div>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      height: 36px;
      width: 100%;
      outline: none;
      transition: box-shadow 180ms ease-in-out;
    }
    :host(:focus-visible) {
      box-shadow: 0 0 0 2px var(--primary-color);
    }
    .container {
      position: relative;
      height: 100%;
      width: 100%;
    }
    .slider {
      position: relative;
      height: 100%;
      width: 100%;
      transform: translateZ(0);
      overflow: visible;
      cursor: pointer;
      touch-action: pan-y;
    }
    .slider * {
      pointer-events: none;
      user-select: none;
    }
    .track {
      position: absolute;
      inset: 0;
      margin: auto;
      height: 16px;
      width: 100%;
      border-radius: var(--ha-border-radius-md, 8px);
      overflow: hidden;
    }
    .background {
      position: absolute;
      inset: 0;
      background: var(--disabled-color, #bdbdbd);
      opacity: 0.4;
    }
    .active {
      position: absolute;
      background: var(--primary-color, #6750a4);
      top: 0;
      right: calc(var(--max) * 100%);
      bottom: 0;
      left: calc(var(--min) * 100%);
    }
    .handle {
      position: absolute;
      top: 0;
      height: 100%;
      width: 16px;
      transform: translate(-50%, 0);
      background: var(--card-background-color, #1c1b22);
      left: calc(var(--value, 0) * 100%);
      transition: left 180ms ease-in-out;
    }
    .handle::after {
      position: absolute;
      inset: 0;
      width: 4px;
      border-radius: 2px;
      height: 100%;
      margin: auto;
      background: var(--primary-color, #6750a4);
      content: '';
    }
    .dot {
      position: absolute;
      top: 0;
      bottom: 0;
      opacity: 0.6;
      margin: auto;
      width: 4px;
      height: 4px;
      flex-shrink: 0;
      transform: translate(-50%, 0);
      background: var(--card-background-color, #1c1b22);
      left: calc(var(--value, 0) * 100%);
      border-radius: 2px;
    }
    :host([disabled]) .slider {
      cursor: not-allowed;
    }
    :host([disabled]) .track {
      opacity: 0.5;
    }
    :host([disabled]) .handle::after,
    :host([disabled]) .active {
      background: var(--disabled-color, #bdbdbd);
    }
    .tooltip {
      position: absolute;
      top: 0;
      left: calc(min(max(var(--value) * 100%, 0%), 100%));
      transform: translate3d(-50%, calc(-100% - 4px), 0);
      background-color: var(--clear-background-color, var(--card-background-color, #2b2933));
      color: var(--primary-text-color, #e6e1e9);
      font-size: var(--control-slider-tooltip-font-size, 14px);
      border-radius: var(--ha-border-radius-lg, 12px);
      padding: 0.2em 0.4em;
      opacity: 0;
      white-space: nowrap;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      pointer-events: none;
      transition:
        opacity 180ms ease-in-out,
        left 180ms ease-in-out;
    }
    .tooltip.visible {
      opacity: 1;
    }
    .pressed .handle {
      transition: none;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'mt-grid-slider': MtGridSlider;
  }
}
