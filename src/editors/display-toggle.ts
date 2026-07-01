import { LitElement, html, css, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/** One segment of the toggle: its config value, its label and its glyph. */
export interface DisplayOption {
  value: string;
  label: string;
  icon: string;
}

/** The default segments: the three selector display modes. */
const DEFAULT_OPTIONS: DisplayOption[] = [
  { value: 'icons', label: 'Icons', icon: 'mdi:dots-grid' },
  { value: 'dropdown', label: 'Dropdown', icon: 'mdi:form-dropdown' },
  { value: 'tile', label: 'Tile', icon: 'mdi:card-text-outline' },
];

/**
 * A small segmented control for choosing a display mode in the feature editors.
 * Defaults to the three selector modes (`icons`/`dropdown`/`tile`) but accepts a
 * custom {@link DisplayOption} set (e.g. the entity tile's `icon`/`tile`).
 * Self-contained (no `ha-select` dependency); emits `value-changed` with `{ value }`.
 */
@customElement('mt-display-toggle')
export class MtDisplayToggle extends LitElement {
  @property() value = 'icons';
  /** The segments to render. Defaults to the three selector display modes. */
  @property({ attribute: false }) options: DisplayOption[] = DEFAULT_OPTIONS;

  /**
   * Emit the chosen display mode.
   * @param value the new display mode
   */
  private _set(value: string): void {
    if (value === this.value) return;
    this.dispatchEvent(
      new CustomEvent('value-changed', { detail: { value }, bubbles: true, composed: true })
    );
  }

  protected render(): TemplateResult {
    return html`
      <div class="seg">
        ${this.options.map(
          (o) => html`<button
            class=${this.value === o.value ? 'on' : ''}
            @click=${() => this._set(o.value)}
          >
            <ha-icon icon=${o.icon}></ha-icon><span>${o.label}</span>
          </button>`
        )}
      </div>
    `;
  }

  static styles = css`
    .seg {
      display: inline-flex;
      border: 1px solid var(--divider-color);
      border-radius: 999px;
      overflow: hidden;
    }
    button {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border: none;
      background: transparent;
      color: var(--secondary-text-color);
      cursor: pointer;
      font: inherit;
      font-size: 14px;
    }
    button + button {
      border-left: 1px solid var(--divider-color);
    }
    button.on {
      background: var(--primary-color);
      color: var(--text-primary-color, #fff);
    }
    ha-icon {
      --mdc-icon-size: 18px;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'mt-display-toggle': MtDisplayToggle;
  }
}
