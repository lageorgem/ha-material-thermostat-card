import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokens } from '../theme';
import type { FeatureDisplay, SelectorItem } from '../types';
import './dropdown';

/**
 * Shared selector row. Renders a set of {@link SelectorItem}s either as a row
 * of Material 3 icon chips or as a themed dropdown, and emits `item-selected`
 * with `{ value }` when the user picks one. Used by every selector-style
 * feature (climate modes/fan/swing, input_select, switch group).
 */
@customElement('mt-selector-row')
export class MtSelectorRow extends LitElement {
  @property({ attribute: false }) items: SelectorItem[] = [];
  @property() display: FeatureDisplay = 'icons';
  @property() label?: string;
  /** Force the tile's "off" treatment (e.g. the parent climate mode is off). */
  @property({ type: Boolean }) forceOff = false;

  /**
   * Dispatch the selection to the parent feature component.
   * @param value the selected item's value
   */
  private _select(value: string): void {
    this.dispatchEvent(
      new CustomEvent('item-selected', { detail: { value }, bubbles: true, composed: true })
    );
  }

  protected render(): TemplateResult | typeof nothing {
    if (!this.items.length) return nothing;
    // The tile carries its own internal title (above its value), so it is
    // rendered on its own — without the leading row title used by icons/dropdown.
    if (this.display === 'tile') return this._renderTile();
    const body = this.display === 'dropdown' ? this._renderDropdown() : this._renderIcons();
    // An optional title rendered above the control, so a selector can read like
    // a labeled row ("Fan speed" over the chips/dropdown). Opt-in: shown only
    // when a label is configured.
    return html`${this.label ? html`<div class="title">${this.label}</div>` : nothing}${body}`;
  }

  /**
   * Render the items as a row of icon chips.
   */
  private _renderIcons(): TemplateResult {
    // Icons mode shows only the chips — no leading text label. (`label` is used
    // as the dropdown placeholder, and here as the chip group's aria-label.)
    return html`
      <div
        class="chips"
        style=${`--chip-count: ${this.items.length}`}
        role="group"
        aria-label=${this.label ?? 'options'}
      >
        ${this.items.map(
          (item) => html`
            <button
              class=${classMap({ chip: true, active: !!item.active })}
              ?disabled=${item.disabled}
              title=${item.label}
              aria-label=${item.label}
              aria-pressed=${item.active ? 'true' : 'false'}
              @click=${() => this._select(item.value)}
            >
              ${item.icon
                ? html`<ha-icon icon=${item.icon}></ha-icon>`
                : html`<span class="chip-text">${item.label}</span>`}
            </button>
          `
        )}
      </div>
    `;
  }

  /**
   * Render the items as a Home Assistant themed dropdown.
   */
  private _renderDropdown(): TemplateResult {
    return html`<mt-dropdown
      .items=${this.items}
      .placeholder=${this.label ?? ''}
      @item-selected=${(e: CustomEvent) => this._select(e.detail.value)}
    ></mt-dropdown>`;
  }

  /**
   * Render the items as a Google-Home-style tile showing the current value,
   * opening the same option menu when tapped. The `label` becomes the tile's
   * title.
   */
  private _renderTile(): TemplateResult {
    return html`<mt-dropdown
      variant="tile"
      .items=${this.items}
      .label=${this.label ?? ''}
      .forceOff=${this.forceOff}
      @item-selected=${(e: CustomEvent) => this._select(e.detail.value)}
    ></mt-dropdown>`;
  }

  static styles = [
    tokens,
    css`
      :host {
        display: block;
        width: 100%;
        min-width: 0;
      }
      .title {
        color: var(--mt-on-surface-variant);
        font-size: var(--md-sys-typescale-label-large-size, 13px);
        font-weight: 500;
        padding: 0 4px 6px;
      }
      .chips {
        display: flex;
        align-items: center;
        justify-content: safe center;
        /* Spend spare width on the original gap, then shrink equal chips.
           At seven options / 200px the gap reaches zero and each chip is 28px. */
        gap: clamp(
          0px,
          calc((100% - var(--chip-count) * 44px) / max(1, var(--chip-count) - 1)),
          4px
        );
        padding: 4px 2px;
        background: var(--mt-surface-container);
        border-radius: var(--mt-shape-full);
        /* Scroll only when the available width cannot hold 28px per chip. */
        min-width: 0;
        overflow-x: auto;
        overflow-y: hidden;
        scrollbar-width: none;
      }
      .chips::-webkit-scrollbar {
        display: none;
      }
      .chip {
        /* Footprint 44px + 4px gap = 48px per icon. Grow to fill, capped so
           icons never over-stretch when there is spare room. */
        flex: 1 1 44px;
        height: 44px;
        min-width: 28px;
        max-width: 120px;
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        place-items: center;
        container-type: inline-size;
        border: none;
        border-radius: var(--mt-shape-full);
        background: transparent;
        color: var(--mt-on-surface-variant);
        cursor: pointer;
        padding: 0 8px;
        transition:
          background-color 180ms cubic-bezier(0.2, 0, 0, 1),
          color 180ms cubic-bezier(0.2, 0, 0, 1);
        -webkit-tap-highlight-color: transparent;
      }
      .chip ha-icon {
        --mdc-icon-size: clamp(18px, 100cqi, 24px);
      }
      .chip-text {
        min-width: 0;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: var(--md-sys-typescale-label-large-size, 14px);
        font-weight: 500;
        white-space: nowrap;
      }
      .chip:hover:not(.active):not([disabled]) {
        background: color-mix(in srgb, var(--mt-on-surface) 8%, transparent);
      }
      .chip:active:not([disabled]) {
        background: color-mix(in srgb, var(--mt-on-surface) 12%, transparent);
      }
      .chip.active {
        background: var(--mt-selected-bg, var(--mt-primary));
        color: var(--mt-selected-fg, var(--mt-on-primary));
      }
      .chip[disabled] {
        opacity: 0.38;
        cursor: default;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'mt-selector-row': MtSelectorRow;
  }
}
