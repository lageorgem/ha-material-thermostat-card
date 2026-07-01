import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

/**
 * A compact color picker shaped as a **half-pill** meant to attach to the left
 * of a title field (see {@link ../editors/text-field.MtTextField}'s `flatLeft`).
 * The swatch shows the effective color — the custom override, else the
 * {@link defaultColor} provided by the theme/feature — and opens a small popover
 * with a native color input plus a "Reset to default" action.
 *
 * Two values are emitted via `value-changed`:
 * - `undefined` — reset: the consumer falls back to its default color.
 * - a hex string — a custom color.
 */
@customElement('mt-color-field')
export class MtColorField extends LitElement {
  /** undefined = default (theme) · a hex string = custom color. */
  @property() value?: string;
  /** The default color shown (as a swatch) when no custom color is set. Any CSS
   * color, including a `var(--…)` expression — resolved to a hex to seed the
   * native picker. */
  @property() defaultColor = 'var(--md-sys-color-primary, var(--primary-color, #6750a4))';
  /** Accessible label / tooltip. */
  @property() label = 'Color';

  /** Whether the color popover is open. */
  @state() private _open = false;

  connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('click', this._onDocClick);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('click', this._onDocClick);
  }

  /** Close the popover when clicking anywhere outside this element. */
  private _onDocClick = (e: MouseEvent): void => {
    if (this._open && !e.composedPath().includes(this)) this._open = false;
  };

  /**
   * Emit the new value to the parent editor.
   * @param value undefined (reset to default) · a hex color string
   */
  private _emit(value: string | undefined): void {
    this.dispatchEvent(
      new CustomEvent('value-changed', { detail: { value }, bubbles: true, composed: true })
    );
  }

  /**
   * Toggle the color popover.
   * @param e the click event
   */
  private _toggle(e: Event): void {
    e.stopPropagation();
    this._open = !this._open;
  }

  /**
   * Commit a color from the native input.
   * @param e the input event
   */
  private _onInput(e: Event): void {
    e.stopPropagation();
    this._emit((e.target as HTMLInputElement).value);
  }

  /**
   * Reset to the default color and close.
   * @param e the click event
   */
  private _reset(e: Event): void {
    e.stopPropagation();
    this._open = false;
    this._emit(undefined);
  }

  /**
   * The current color resolved to a `#rrggbb` hex for the native input: the
   * custom value verbatim, else the default color resolved via the browser (so
   * a `var(--…)` default seeds the picker at the actual theme color).
   */
  private _resolveHex(): string {
    if (this.value) return this.value;
    const probe = document.createElement('span');
    probe.style.color = this.defaultColor;
    this.shadowRoot!.appendChild(probe);
    const rgb = getComputedStyle(probe).color;
    probe.remove();
    const m = rgb.match(/\d+/g);
    /* c8 ignore next -- getComputedStyle always yields an rgb(...) string in a browser */
    if (!m) return '#000000';
    return (
      '#' +
      m
        .slice(0, 3)
        .map((n) => Number(n).toString(16).padStart(2, '0'))
        .join('')
    );
  }

  protected render(): TemplateResult {
    return html`
      <button
        type="button"
        class="swatch"
        style=${`background: ${this.value ?? this.defaultColor}`}
        aria-haspopup="dialog"
        aria-expanded=${this._open ? 'true' : 'false'}
        title=${this.label}
        @click=${this._toggle}
      ></button>
      ${this._open
        ? html`<div class="popover" role="dialog">
            <input
              type="color"
              aria-label=${this.label}
              .value=${this._resolveHex()}
              @input=${this._onInput}
            />
            ${this.value
              ? html`<button type="button" class="reset" @click=${this._reset}>
                  Reset to default
                </button>`
              : nothing}
          </div>`
        : nothing}
    `;
  }

  static styles = css`
    :host {
      display: inline-block;
      position: relative;
    }
    /* Half-pill: rounded on the left, flat on the right so it butts against a
       flat-left title field into a single pill. */
    .swatch {
      width: 36px;
      height: 40px;
      padding: 0;
      border: 1px solid var(--md-sys-color-outline-variant, var(--divider-color));
      border-right: none;
      border-radius: var(--md-sys-shape-corner-full, 9999px) 0 0
        var(--md-sys-shape-corner-full, 9999px);
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .popover {
      position: absolute;
      z-index: 30;
      top: calc(100% + 6px);
      left: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 8px;
      background: var(--md-sys-color-surface-container-high, var(--card-background-color, #fff));
      border: 1px solid var(--md-sys-color-outline-variant, var(--divider-color));
      border-radius: 16px;
      box-shadow:
        0 4px 12px rgba(0, 0, 0, 0.3),
        0 1px 3px rgba(0, 0, 0, 0.2);
    }
    .popover input[type='color'] {
      width: 100%;
      height: 36px;
      border: none;
      background: none;
      cursor: pointer;
      padding: 0;
    }
    .reset {
      border: none;
      background: transparent;
      color: var(--md-sys-color-primary, var(--primary-color));
      cursor: pointer;
      font: inherit;
      font-size: 13px;
      padding: 4px;
      border-radius: 8px;
    }
    .reset:hover {
      background: color-mix(in srgb, currentColor 10%, transparent);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'mt-color-field': MtColorField;
  }
}
