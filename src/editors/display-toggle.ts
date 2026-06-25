import { LitElement, html, css, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { FeatureDisplay } from '../types';

/**
 * A small segmented control for choosing between `icons` and `dropdown`
 * display in the feature editors. Self-contained (no `ha-select` dependency)
 * and emits `value-changed` with `{ value }`.
 */
@customElement('mt-display-toggle')
export class MtDisplayToggle extends LitElement {
  @property() value: FeatureDisplay = 'icons';

  /**
   * Emit the chosen display mode.
   * @param value the new display mode
   */
  private _set(value: FeatureDisplay): void {
    if (value === this.value) return;
    this.dispatchEvent(
      new CustomEvent('value-changed', { detail: { value }, bubbles: true, composed: true })
    );
  }

  protected render(): TemplateResult {
    return html`
      <div class="seg">
        <button class=${this.value === 'icons' ? 'on' : ''} @click=${() => this._set('icons')}>
          <ha-icon icon="mdi:dots-grid"></ha-icon><span>Icons</span>
        </button>
        <button
          class=${this.value === 'dropdown' ? 'on' : ''}
          @click=${() => this._set('dropdown')}
        >
          <ha-icon icon="mdi:form-dropdown"></ha-icon><span>Dropdown</span>
        </button>
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
