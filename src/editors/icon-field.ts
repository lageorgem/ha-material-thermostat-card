import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import type { HomeAssistant } from 'custom-card-helpers';
import './search-panel';
import type { SearchItem } from './search-panel';
import { loadIconItems } from './icon-list';

/**
 * A compact icon control shaped like a **pill** with two mutually-exclusive
 * halves:
 *
 * - **left** — the icon. It shows the effective icon (the custom override, else
 *   the row's faded default) and opens a rounded {@link MtSearchPanel} (search +
 *   browsable list) right under the pill — matching {@link MtEntityPicker}.
 * - **right** — `mdi:cancel`, the "no icon" / disable toggle.
 *
 * Three values are emitted via `value-changed`, matching the rest of the editor:
 *
 * - `undefined` — unset: the consumer shows its **default** icon.
 * - `''` — **no icon**: the default is suppressed (the right half is active).
 * - a string — a **custom** icon (the left half is active).
 *
 * The list browses a curated common set + any registered custom icon packs;
 * since HA bundles the full MDI list at build time (no runtime list), any other
 * icon is reachable by typing its full `mdi:<name>` in the search box.
 */
@customElement('mt-icon-field')
export class MtIconField extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  /** undefined = default · '' = no icon · string = custom icon. */
  @property() value?: string;
  @property() label = 'Icon';
  /** The consumer's default icon, previewed (faded) when no custom icon is set. */
  @property() defaultIcon?: string;

  /** Whether the icon search panel is open. */
  @state() private _open = false;
  /** Anchor the panel to its right edge (grow leftward) near the viewport edge. */
  @state() private _alignRight = false;
  /** The browsable icon list (lazy-loaded on first open). */
  @state() private _icons: SearchItem[] = [];

  /** The panel's width (keep in sync with `.panel { width }`). */
  private static readonly PANEL_WIDTH = 256;

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

  /** Close the panel when clicking anywhere outside this element. */
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
   * Toggle the icon search panel, lazy-loading the browsable list on first open.
   * The panel is anchored right under the pill (absolute); the editor's feature
   * cards use `overflow: visible` so it isn't clipped.
   * @param e the click event
   */
  private _toggle(e: Event): void {
    e.stopPropagation();
    if (!this._open) {
      // Left-align by default; flip to right-anchored (grow leftward) when a
      // left-anchored panel would spill past the viewport's right edge — which
      // in the narrow editor causes the whole dialog to scroll horizontally.
      const r = this.getBoundingClientRect();
      this._alignRight = r.left + MtIconField.PANEL_WIDTH > window.innerWidth - 8;
    }
    this._open = !this._open;
    if (this._open && this._icons.length === 0) {
      loadIconItems().then((items) => {
        this._icons = items;
      });
    }
  }

  /** Toggle the "no icon" state (off → '' , on → back to the default). */
  private _toggleNone(e: Event): void {
    e.stopPropagation();
    this._open = false;
    this._emit(this._none ? undefined : '');
  }

  /**
   * Commit a picked icon and close.
   * @param e the panel's pick event
   */
  private _onPick(e: CustomEvent): void {
    // The panel only ever picks a non-empty value (a list item or a typed custom
    // icon); "no icon" is the cancel segment's job.
    this._open = false;
    this._emit(e.detail.value);
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
          aria-haspopup="listbox"
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
        ? html`<div class=${classMap({ panel: true, right: this._alignRight })}>
            <mt-search-panel
              .items=${this._icons}
              .value=${this.value || ''}
              .allowCustom=${true}
              customPrefix="mdi:"
              placeholder="Search icons…"
              @pick=${this._onPick}
              @dismiss=${() => (this._open = false)}
            ></mt-search-panel>
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
    /* Rounded search panel anchored under the pill (matches mt-entity-picker). */
    .panel {
      position: absolute;
      z-index: 30;
      top: calc(100% + 6px);
      left: 0;
      width: 256px;
      box-sizing: border-box;
      padding: 8px;
      background: var(--md-sys-color-surface-container-high, var(--card-background-color, #fff));
      border: 1px solid var(--md-sys-color-outline-variant, var(--divider-color));
      border-radius: 16px;
      box-shadow:
        0 4px 12px rgba(0, 0, 0, 0.3),
        0 1px 3px rgba(0, 0, 0, 0.2);
    }
    /* Anchored to the right edge of the pill so it grows leftward (used near the
       viewport's right edge to avoid horizontal overflow/scroll). */
    .panel.right {
      left: auto;
      right: 0;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'mt-icon-field': MtIconField;
  }
}
