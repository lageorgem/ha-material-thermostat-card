import { LitElement, html, css, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { FeatureAlignment } from '../types';

const OPTIONS: ReadonlyArray<{ value: FeatureAlignment; label: string; icon: string }> = [
  { value: 'left', label: 'Align left', icon: 'mdi:format-align-left' },
  { value: 'center', label: 'Align centre', icon: 'mdi:format-align-center' },
  { value: 'right', label: 'Align right', icon: 'mdi:format-align-right' },
];

/** Controlled row-alignment picker. Emits only `alignment-changed` with `{ value }`. */
@customElement('mt-alignment-toggle')
export class MtAlignmentToggle extends LitElement {
  @property() value?: FeatureAlignment;

  /** Unset and unrecognized configuration values use the default left alignment. */
  private get _selected(): FeatureAlignment {
    return this.value === 'center' || this.value === 'right' ? this.value : 'left';
  }

  /** Notify the owner without mutating its configuration. */
  private _set(value: FeatureAlignment): void {
    if (value === this._selected) return;
    this.dispatchEvent(
      new CustomEvent('alignment-changed', { detail: { value }, bubbles: true, composed: true })
    );
  }

  protected render(): TemplateResult {
    return html`
      <div class="seg" role="group" aria-label="Feature alignment" aria-describedby="help">
        ${OPTIONS.map(
          (option) => html`<button
            type="button"
            class=${this._selected === option.value ? 'on' : ''}
            aria-label=${option.label}
            aria-pressed=${this._selected === option.value ? 'true' : 'false'}
            @click=${() => this._set(option.value)}
          >
            <ha-icon icon=${option.icon} aria-hidden="true"></ha-icon>
          </button>`
        )}
      </div>
      <span id="help" class="sr-only">
        Alignment applies only when this feature is alone on its row.
      </span>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }
    .seg {
      display: inline-flex;
      border: 1px solid var(--divider-color);
      border-radius: 999px;
      overflow: hidden;
    }
    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 8px 16px;
      min-height: 44px;
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
    button:focus-visible {
      outline: 2px solid currentColor;
      outline-offset: -4px;
    }
    ha-icon {
      display: inline-flex;
      width: 18px;
      height: 18px;
      --mdc-icon-size: 18px;
    }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
      border: 0;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'mt-alignment-toggle': MtAlignmentToggle;
  }
}
