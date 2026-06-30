import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokens } from '../theme';
import type { SelectorItem } from '../types';

/**
 * A Material 3 styled dropdown used by selector features in `dropdown` and
 * `tile` mode. Fully self-contained (no dependency on HA's lazily-loaded
 * `ha-select`): a trigger showing the active option, opening a themed menu of
 * options. Emits a non-bubbling `item-selected` with `{ value }`.
 *
 * Two trigger shapes are supported via {@link variant}:
 * - `pill` — a compact rounded trigger (icon + current value + chevron).
 * - `tile` — a Google-Home-style tile (icon + {@link label} title + current
 *   value). The tile shows an "on" treatment — a tint of `--mt-tile-accent`
 *   (defaulting to the primary) and extra-rounded corners — whenever the active
 *   value is not a "turned off" state (`off`/`none`, case-insensitive).
 */
@customElement('mt-dropdown')
export class MtDropdown extends LitElement {
  @property({ attribute: false }) items: SelectorItem[] = [];
  @property() placeholder = '';
  /** Trigger shape: a compact `pill` (default) or a Google-Home-style `tile`. */
  @property() variant: 'pill' | 'tile' = 'pill';
  /** Title shown above the value in the `tile` variant. */
  @property() label = '';
  /** Force the tile's "off" treatment regardless of its value (e.g. the parent
   * climate is off, so its fan/preset tiles should read as off too). */
  @property({ type: Boolean }) forceOff = false;

  @state() private _open = false;
  @state() private _up = false;
  @state() private _alignRight = false;

  connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('click', this._onDocClick);
    document.addEventListener('mt-dropdown-open', this._onOtherOpen);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('click', this._onDocClick);
    document.removeEventListener('mt-dropdown-open', this._onOtherOpen);
  }

  /** Close the menu when clicking anywhere outside this element. */
  private _onDocClick = (e: MouseEvent): void => {
    if (this._open && !e.composedPath().includes(this)) this._open = false;
  };

  /** Close this menu when another dropdown opens (only one open at a time). */
  private _onOtherOpen = (e: Event): void => {
    if ((e as CustomEvent).detail !== this) this._open = false;
  };

  private get _active(): SelectorItem | undefined {
    return this.items.find((i) => i.active) ?? this.items[0];
  }

  /**
   * Whether the tile reads as "on": there is a genuinely active item and its
   * value is not a hardcoded "off" state (`off`/`none`, any case). Drives the
   * tile's accent tint and the extra-rounded corners.
   */
  private get _tileOn(): boolean {
    if (this.forceOff) return false;
    const sel = this.items.find((i) => i.active);
    if (!sel) return false;
    const v = sel.value.toLowerCase();
    return v !== 'off' && v !== 'none';
  }

  /**
   * Toggle the menu, choosing an upward opening direction when near the
   * bottom of the viewport.
   * @param e the click event
   */
  private _toggle(e: Event): void {
    e.stopPropagation();
    if (!this._open) {
      const r = this.getBoundingClientRect();
      this._up = r.bottom > window.innerHeight * 0.55;
      // The menu sizes to its content; anchor it to whichever edge keeps it on
      // screen — grow left when the trigger sits in the right half, else right.
      this._alignRight = r.left + r.width / 2 > window.innerWidth * 0.5;
      // Tell any other open dropdown to close (only one open at a time).
      document.dispatchEvent(new CustomEvent('mt-dropdown-open', { detail: this }));
    }
    this._open = !this._open;
  }

  /**
   * Select an option and close the menu.
   * @param e the click event
   * @param value the selected value
   */
  private _select(e: Event, value: string): void {
    e.stopPropagation();
    this._open = false;
    this.dispatchEvent(new CustomEvent('item-selected', { detail: { value } }));
  }

  protected render(): TemplateResult {
    const active = this._active;
    const trigger =
      this.variant === 'tile' ? this._renderTile(active) : this._renderPill(active);
    return html`${trigger}${this._open ? this._renderMenu() : nothing}`;
  }

  /**
   * The compact pill trigger: icon + current value + chevron.
   * @param active the currently active (or first) item
   */
  private _renderPill(active: SelectorItem | undefined): TemplateResult {
    return html`
      <button
        class=${classMap({ trigger: true, open: this._open })}
        aria-haspopup="listbox"
        aria-expanded=${this._open ? 'true' : 'false'}
        @click=${this._toggle}
      >
        ${active?.icon
          ? html`<ha-icon class="lead" icon=${active.icon}></ha-icon>`
          : html`<span class="dot"></span>`}
        <span class="label">${active?.label ?? this.placeholder}</span>
        <ha-icon class="chev" icon="mdi:chevron-down"></ha-icon>
      </button>
    `;
  }

  /**
   * The Google-Home-style tile trigger: an icon chip, the title, and the
   * current value. The `on` class drives the accent tint + extra-rounded
   * corners (see {@link _tileOn}).
   * @param active the currently active (or first) item
   */
  private _renderTile(active: SelectorItem | undefined): TemplateResult {
    return html`
      <button
        class=${classMap({ tile: true, on: this._tileOn, open: this._open })}
        aria-haspopup="listbox"
        aria-expanded=${this._open ? 'true' : 'false'}
        @click=${this._toggle}
      >
        <div class="ic">
          ${active?.icon
            ? html`<ha-icon icon=${active.icon}></ha-icon>`
            : html`<span class="dot"></span>`}
        </div>
        <div class="text">
          ${this.label ? html`<div class="title">${this.label}</div>` : nothing}
          <div class="value">${active?.label ?? this.placeholder}</div>
        </div>
      </button>
    `;
  }

  /** The shared option menu, anchored under whichever trigger is active. */
  private _renderMenu(): TemplateResult {
    return html`<div
      class=${classMap({ menu: true, up: this._up, right: this._alignRight })}
      role="listbox"
    >
      ${this.items.map(
        (it) => html`<button
          class=${classMap({ opt: true, active: !!it.active })}
          role="option"
          aria-selected=${it.active ? 'true' : 'false'}
          @click=${(e: Event) => this._select(e, it.value)}
        >
          ${it.icon
            ? html`<ha-icon icon=${it.icon}></ha-icon>`
            : html`<span class="dot"></span>`}
          <span class="label">${it.label}</span>
          ${it.active ? html`<ha-icon class="check" icon="mdi:check"></ha-icon>` : nothing}
        </button>`
      )}
    </div>`;
  }

  static styles = [
    tokens,
    css`
      :host {
        position: relative;
        display: block;
        width: 100%;
      }
      .trigger {
        width: 100%;
        height: 48px;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 0 16px;
        border: none;
        border-radius: var(--mt-shape-full);
        background: var(--mt-surface-container);
        color: var(--mt-on-surface);
        cursor: pointer;
        font: inherit;
        transition: background-color 180ms cubic-bezier(0.2, 0, 0, 1);
        -webkit-tap-highlight-color: transparent;
      }
      .trigger:hover {
        background: color-mix(in srgb, var(--mt-on-surface) 6%, var(--mt-surface-container));
      }
      .trigger .label {
        flex: 1;
        text-align: left;
        font-size: var(--md-sys-typescale-body-large-size, 16px);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .trigger .lead {
        --mdc-icon-size: 22px;
        color: var(--mt-on-surface-variant);
      }
      .trigger .chev {
        --mdc-icon-size: 24px;
        color: var(--mt-on-surface-variant);
        transition: transform 200ms cubic-bezier(0.2, 0, 0, 1);
      }
      .trigger.open .chev {
        transform: rotate(180deg);
      }
      /* Tile variant — a Google-Home-style card: icon chip + title over value. */
      .tile {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        min-height: 56px;
        box-sizing: border-box;
        border: none;
        /* "off" tiles are standard rounded rectangles; "on" tiles morph to the
           extra-rounded card shape (see the .tile.on rule below). */
        border-radius: var(--mt-shape-chip-square);
        background: var(--mt-surface-container);
        color: var(--mt-on-surface);
        cursor: pointer;
        font: inherit;
        text-align: left;
        transition:
          background-color 200ms cubic-bezier(0.2, 0, 0, 1),
          border-radius 260ms cubic-bezier(0.2, 0, 0, 1),
          color 200ms cubic-bezier(0.2, 0, 0, 1);
        -webkit-tap-highlight-color: transparent;
      }
      .tile:hover {
        background: color-mix(in srgb, var(--mt-on-surface) 6%, var(--mt-surface-container));
      }
      .tile:active {
        background: color-mix(in srgb, var(--mt-on-surface) 12%, var(--mt-surface-container));
      }
      .tile.on {
        /* extra-rounded corners + a soft tint of the accent (the HVAC mode color
           for the climate selector, else the primary). */
        border-radius: var(--mt-shape-card);
        background: color-mix(in srgb, var(--mt-tile-accent, var(--mt-primary)) 16%, var(--mt-surface-container));
        color: var(--mt-tile-accent, var(--mt-primary));
      }
      .tile.on:hover {
        background: color-mix(in srgb, var(--mt-tile-accent, var(--mt-primary)) 22%, var(--mt-surface-container));
      }
      .tile .ic {
        flex: 0 0 auto;
        width: 40px;
        height: 40px;
        border-radius: var(--mt-shape-full);
        display: grid;
        place-items: center;
        background: color-mix(in srgb, var(--mt-on-surface-variant) 14%, transparent);
        color: var(--mt-on-surface-variant);
        transition:
          background-color 200ms cubic-bezier(0.2, 0, 0, 1),
          color 200ms cubic-bezier(0.2, 0, 0, 1);
      }
      .tile.on .ic {
        background: color-mix(in srgb, var(--mt-tile-accent, var(--mt-primary)) 26%, transparent);
        color: var(--mt-tile-accent, var(--mt-primary));
      }
      .tile .ic ha-icon {
        --mdc-icon-size: 22px;
      }
      .tile .ic .dot {
        background: currentColor;
      }
      .tile .text {
        display: flex;
        flex-direction: column;
        min-width: 0;
        flex: 1;
      }
      .tile .title {
        font-size: var(--md-sys-typescale-label-medium-size, 13px);
        font-weight: 500;
        color: var(--mt-on-surface-variant);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .tile.on .title {
        color: currentColor;
      }
      .tile .value {
        font-size: var(--md-sys-typescale-body-large-size, 16px);
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--mt-on-surface-variant);
        flex: 0 0 auto;
      }
      .menu {
        position: absolute;
        left: 0;
        right: auto;
        top: calc(100% + 6px);
        z-index: 20;
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 6px;
        /* at least as wide as the trigger, but grow to fit the widest option
           (so long labels aren't clipped); capped so it stays on screen */
        min-width: 100%;
        width: max-content;
        max-width: min(360px, 85vw);
        background: var(--mt-surface-container-high);
        border-radius: 20px;
        box-shadow:
          0 4px 12px rgba(0, 0, 0, 0.3),
          0 1px 3px rgba(0, 0, 0, 0.2);
        max-height: 280px;
        overflow-y: auto;
        animation: mt-pop 130ms cubic-bezier(0.2, 0, 0, 1);
      }
      /* anchor to the right edge so a content-wide menu grows into the card */
      .menu.right {
        left: auto;
        right: 0;
      }
      .menu.up {
        top: auto;
        bottom: calc(100% + 6px);
      }
      .opt {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        padding: 10px 12px;
        border: none;
        background: transparent;
        color: var(--mt-on-surface);
        border-radius: var(--mt-shape-full);
        cursor: pointer;
        font: inherit;
        text-align: left;
      }
      .opt .label {
        flex: 1;
        white-space: nowrap;
      }
      .opt ha-icon {
        --mdc-icon-size: 22px;
      }
      .opt:hover {
        background: color-mix(in srgb, var(--mt-on-surface) 8%, transparent);
      }
      .opt.active {
        background: var(--mt-secondary-container);
        color: var(--mt-on-secondary-container);
      }
      .opt .check {
        --mdc-icon-size: 20px;
        color: var(--mt-on-secondary-container);
      }
      @keyframes mt-pop {
        from {
          opacity: 0;
          transform: translateY(-4px);
        }
        to {
          opacity: 1;
          transform: none;
        }
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'mt-dropdown': MtDropdown;
  }
}
