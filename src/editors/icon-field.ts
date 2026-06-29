import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import type { HomeAssistant } from 'custom-card-helpers';

/**
 * A compact icon control shaped like a **pill** with two mutually-exclusive
 * halves:
 *
 * - **left** — an icon picker. It shows the effective icon (the custom override,
 *   else the row's faded default) and opens a popover with `ha-icon-picker` so
 *   the user can choose a custom one.
 * - **right** — `mdi:cancel`, the "no icon" / disable toggle.
 *
 * Three values are emitted via `value-changed`, matching the rest of the editor:
 *
 * - `undefined` — unset: the consumer shows its **default** icon.
 * - `''` — **no icon**: the default is suppressed (the right half is active).
 * - a string — a **custom** icon (the left half is active).
 *
 * It lives in the card editor (not the card), so it styles itself from the
 * global Material You `--md-sys-*` tokens, falling back to Home Assistant theme
 * variables so it stays usable under the default theme.
 */
@customElement('mt-icon-field')
export class MtIconField extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  /** undefined = default · '' = no icon · string = custom icon. */
  @property() value?: string;
  @property() label = 'Icon';
  /** The consumer's default icon, previewed (faded) when no custom icon is set. */
  @property() defaultIcon?: string;

  /** Whether the icon-picker popover is open. */
  @state() private _open = false;

  /** Whether the explicit "no icon" state is selected. */
  private get _none(): boolean {
    return this.value === '';
  }

  /** Whether a custom icon is set. */
  private get _custom(): boolean {
    return !!this.value;
  }

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
   * @param value undefined (default) · '' (no icon) · a custom icon
   */
  private _emit(value: string | undefined): void {
    this.dispatchEvent(
      new CustomEvent('value-changed', { detail: { value }, bubbles: true, composed: true })
    );
  }

  /**
   * Toggle the icon picker. It's anchored right under the pill (absolute, within
   * this host's stacking context); the editor's feature cards use
   * `overflow: visible` so it isn't clipped. On open the picker's search box is
   * focused so the icon segment drops straight into searching (no extra click
   * into a nested field). HA bundles the icon list at build time, so we reuse its
   * picker rather than re-implementing the search.
   * @param e the click event
   */
  private _toggle(e: Event): void {
    e.stopPropagation();
    this._open = !this._open;
    if (this._open) {
      this.updateComplete.then(() => {
        const picker = this.shadowRoot?.querySelector('ha-icon-picker') as
          | (HTMLElement & { focus?: () => void })
          | null;
        picker?.focus?.();
      });
    }
  }

  /** Toggle the "no icon" state (off → '' , on → back to the default). */
  private _toggleNone(e: Event): void {
    e.stopPropagation();
    this._open = false;
    this._emit(this._none ? undefined : '');
  }

  protected render(): TemplateResult {
    const none = this._none;
    const custom = this._custom;
    const shownIcon = custom ? this.value! : (this.defaultIcon ?? 'mdi:image-plus');
    return html`
      <div class="pill">
        <button
          type="button"
          class=${classMap({ seg: true, icon: true, active: custom, preview: !custom })}
          aria-haspopup="dialog"
          aria-expanded=${this._open ? 'true' : 'false'}
          title=${this.label}
          @click=${this._toggle}
        >
          <ha-icon icon=${shownIcon}></ha-icon>
        </button>
        <button
          type="button"
          class=${classMap({ seg: true, cancel: true, active: none })}
          aria-pressed=${none ? 'true' : 'false'}
          title=${none ? 'No icon — click to use the default' : 'No icon'}
          @click=${this._toggleNone}
        >
          <ha-icon icon="mdi:cancel"></ha-icon>
        </button>
      </div>
      ${this._open
        ? html`<div class="popover" role="dialog">
            <ha-icon-picker
              .hass=${this.hass}
              .label=${this.label}
              .value=${this.value || ''}
              @value-changed=${(e: CustomEvent) => {
                // The picker's event is composed — stop it so the parent editor
                // only sees our normalized value (clearing the picker → default).
                e.stopPropagation();
                this._open = false;
                this._emit(e.detail.value || undefined);
              }}
            ></ha-icon-picker>
          </div>`
        : nothing}
    `;
  }

  static styles = css`
    :host {
      display: inline-block;
      position: relative;
    }
    .pill {
      display: inline-flex;
      height: 40px;
      border-radius: var(--md-sys-shape-corner-full, 9999px);
      background: var(--md-sys-color-surface-container-high, var(--secondary-background-color));
      border: 1px solid var(--md-sys-color-outline-variant, var(--divider-color));
      overflow: hidden;
    }
    .seg {
      width: 40px;
      height: 100%;
      padding: 0;
      display: grid;
      place-items: center;
      border: none;
      background: transparent;
      color: var(--md-sys-color-on-surface-variant, var(--secondary-text-color));
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition:
        background-color 150ms cubic-bezier(0.2, 0, 0, 1),
        color 150ms cubic-bezier(0.2, 0, 0, 1);
    }
    .seg + .seg {
      border-left: 1px solid var(--md-sys-color-outline-variant, var(--divider-color));
    }
    .seg:hover {
      background: color-mix(in srgb, currentColor 10%, transparent);
    }
    .seg.active {
      background: var(--md-sys-color-primary, var(--primary-color));
      color: var(--md-sys-color-on-primary, var(--text-primary-color, #fff));
    }
    /* The faded "this is just the default / add an icon" preview. */
    .seg.icon.preview:not(.active) ha-icon {
      opacity: 0.5;
    }
    .seg ha-icon {
      --mdc-icon-size: 20px;
    }
    /* Bare positioning wrapper — no box chrome, so clicking the icon shows just
       HA's icon picker (one combobox) directly under the pill, not a nested
       popup-with-a-dropdown. */
    .popover {
      position: absolute;
      z-index: 30;
      top: calc(100% + 6px);
      left: 0;
      width: 256px;
    }
    .popover ha-icon-picker {
      display: block;
      width: 100%;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'mt-icon-field': MtIconField;
  }
}
