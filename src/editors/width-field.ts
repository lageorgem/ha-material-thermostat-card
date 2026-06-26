import { LitElement, html, css, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { MAX_INTERNAL_UNITS } from '../grid';

/**
 * A small editor control for a feature's width, expressed in internal grid
 * units (1 unit = one icon). Empty means "let the card decide" (a full row for
 * selector/list features, a sensible default for tiles). Emits `width-changed`
 * with `{ value: number | undefined }`.
 */
@customElement('mt-width-field')
export class MtWidthField extends LitElement {
  @property({ type: Number }) value?: number;

  /**
   * Normalize and emit the new width.
   * @param e the textfield input event
   */
  private _onInput(e: Event): void {
    const raw = (e.target as HTMLInputElement).value;
    let next: number | undefined;
    if (raw !== '') {
      next = Math.max(1, Math.min(MAX_INTERNAL_UNITS, Math.round(Number(raw))));
    }
    this.dispatchEvent(
      new CustomEvent('width-changed', { detail: { value: next }, bubbles: true, composed: true })
    );
  }

  protected render(): TemplateResult {
    return html`
      <div class="field">
        <span class="field-label">Width</span>
        <ha-textfield
          type="number"
          min="1"
          max=${MAX_INTERNAL_UNITS}
          step="1"
          .value=${this.value != null ? String(this.value) : ''}
          placeholder="Full row"
          @input=${this._onInput}
        ></ha-textfield>
        <span class="hint">grid units (1 = one icon); empty = full row</span>
      </div>
    `;
  }

  static styles = css`
    .field {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .field-label {
      color: var(--secondary-text-color);
      font-size: 14px;
    }
    ha-textfield {
      width: 96px;
    }
    .hint {
      color: var(--secondary-text-color);
      font-size: 12px;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'mt-width-field': MtWidthField;
  }
}
