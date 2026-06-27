import { LitElement, html, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import { MIN_FEATURE_UNITS, MAX_UNITS } from '../grid';

const SCHEMA = [
  {
    name: 'width',
    selector: { number: { min: MIN_FEATURE_UNITS, max: MAX_UNITS, step: 1, mode: 'box' } },
  },
];

/**
 * A small editor control for a feature's width, expressed in grid units
 * (1 unit ≈ 24px, min 2). Empty means "let the card decide" (a full row for
 * selector/list features, a sensible default for tiles). Built on `ha-form` so
 * it renders the same number box as Home Assistant's own selectors. Emits
 * `width-changed` with `{ value: number | undefined }`.
 */
@customElement('mt-width-field')
export class MtWidthField extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ type: Number }) value?: number;

  private _computeLabel = (): string => 'Width (grid units, ≈24px each, min 2)';

  /**
   * Re-emit the form's change as a `width-changed` event.
   * @param e ha-form's value-changed event
   */
  private _changed(e: CustomEvent): void {
    const v = e.detail.value?.width;
    this.dispatchEvent(
      new CustomEvent('width-changed', {
        detail: { value: typeof v === 'number' ? v : undefined },
        bubbles: true,
        composed: true,
      })
    );
  }

  protected render(): TemplateResult {
    return html`<ha-form
      .hass=${this.hass}
      .data=${{ width: this.value }}
      .schema=${SCHEMA}
      .computeLabel=${this._computeLabel}
      @value-changed=${this._changed}
    ></ha-form>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mt-width-field': MtWidthField;
  }
}
