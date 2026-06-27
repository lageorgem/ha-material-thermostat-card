import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokens } from '../theme';
import type { SelectorItem } from '../types';

/**
 * A Material 3 styled dropdown used by selector features in `dropdown` mode.
 * Fully self-contained (no dependency on HA's lazily-loaded `ha-select`): a
 * rounded trigger showing the active option's icon + label, opening a themed
 * menu of options. Emits a non-bubbling `item-selected` with `{ value }`.
 */
@customElement('mt-dropdown')
export class MtDropdown extends LitElement {
  @property({ attribute: false }) items: SelectorItem[] = [];
  @property() placeholder = '';

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
      ${this._open
        ? html`<div
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
          </div>`
        : nothing}
    `;
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
