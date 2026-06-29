import { LitElement, html, css, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * A tiny text input styled as a **pill** to match {@link MtIconField} — same
 * height, fully-rounded shape, surface fill and outline. It exists because a
 * bare `<ha-textfield>` placed directly in a custom-card editor often never
 * upgrades (HA only preloads the picker/form stack, not the standalone
 * textfield), leaving the field invisible. A native input always renders and
 * lets the editor's title/label fields sit seamlessly next to the icon pill.
 *
 * Emits `value-changed` (`{ value }`, bubbles+composed) on every input.
 */
@customElement('mt-text-field')
export class MtTextField extends LitElement {
  @property() value = '';
  /** Placeholder + accessible name. */
  @property() label = '';

  /**
   * Emit the current input value to the parent editor.
   * @param e the input event
   */
  private _onInput(e: Event): void {
    const value = (e.target as HTMLInputElement).value;
    this.dispatchEvent(
      new CustomEvent('value-changed', { detail: { value }, bubbles: true, composed: true })
    );
  }

  protected render(): TemplateResult {
    return html`<input
      type="text"
      .value=${this.value ?? ''}
      placeholder=${this.label}
      aria-label=${this.label}
      @input=${this._onInput}
    />`;
  }

  static styles = css`
    :host {
      display: block;
      min-width: 0;
    }
    input {
      width: 100%;
      box-sizing: border-box;
      height: 40px;
      padding: 0 14px;
      border-radius: var(--md-sys-shape-corner-full, 9999px);
      border: 1px solid var(--md-sys-color-outline-variant, var(--divider-color));
      background: var(--md-sys-color-surface-container-high, var(--secondary-background-color));
      color: var(--md-sys-color-on-surface, var(--primary-text-color));
      font: inherit;
      font-size: 14px;
      outline: none;
      transition: border-color 150ms cubic-bezier(0.2, 0, 0, 1);
    }
    input::placeholder {
      color: var(--md-sys-color-on-surface-variant, var(--secondary-text-color));
    }
    input:focus {
      border-color: var(--md-sys-color-primary, var(--primary-color));
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'mt-text-field': MtTextField;
  }
}
