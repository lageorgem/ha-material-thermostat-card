import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import { MIN_WIDTH_PCT, MAX_WIDTH_PCT, WIDTH_STEP } from '../grid';
import './grid-slider';

/**
 * A small editor control for a feature's width, expressed as a **percentage of
 * the card** (10–100, in steps of 10). Empty (unset) means full width. Renders
 * a grid-layout-style slider (the self-contained `mt-grid-slider`, with dots on
 * the tens) plus a reset button that clears the width back to auto. Emits
 * `width-changed` with `{ value: number | undefined }`.
 */
@customElement('mt-width-field')
export class MtWidthField extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ type: Number }) value?: number;
  /** The width used when unset (shown as the handle position + hint). */
  @property({ type: Number }) default = MAX_WIDTH_PCT;

  /**
   * Re-emit a width value.
   * @param value the new width percentage, or undefined for full width
   */
  private _emit(value: number | undefined): void {
    this.dispatchEvent(
      new CustomEvent('width-changed', {
        detail: { value },
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Handle the slider commit.
   * @param e the slider's value-changed event
   */
  private _onChanged(e: CustomEvent): void {
    const v = e.detail?.value;
    this._emit(typeof v === 'number' ? v : undefined);
  }

  /** Clear the width back to auto. */
  private _reset(): void {
    if (this.value != null) this._emit(undefined);
  }

  protected render(): TemplateResult {
    const set = this.value != null;
    // Unset = the feature's default width — show the handle there so the default
    // reads correctly (100% for selectors, 50% for tiles), not the slider min.
    const display = this.value ?? this.default;
    return html`
      <div class="label">Width (% of card)</div>
      <div class="control">
        <button
          class="reset"
          aria-label="Reset width to full"
          title="Reset to full width"
          ?disabled=${!set}
          @click=${this._reset}
        >
          <ha-icon icon="mdi:restore"></ha-icon>
        </button>
        <mt-grid-slider
          .value=${display}
          .min=${MIN_WIDTH_PCT}
          .max=${MAX_WIDTH_PCT}
          .step=${WIDTH_STEP}
          tooltip-mode="always"
          @value-changed=${this._onChanged}
        ></mt-grid-slider>
      </div>
      ${set
        ? nothing
        : html`<div class="hint">
            Default — ${this.default === MAX_WIDTH_PCT ? 'full width' : `${this.default}%`}.
          </div>`}
    `;
  }

  static styles = css`
    :host {
      display: block;
    }
    .label {
      color: var(--secondary-text-color);
      font-size: 0.85rem;
      margin-bottom: 4px;
    }
    .control {
      display: flex;
      align-items: center;
      gap: 8px;
      /* room above the slider for the floating value tooltip */
      padding-top: 20px;
    }
    .reset {
      flex: 0 0 auto;
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 50%;
      background: transparent;
      color: var(--secondary-text-color);
      cursor: pointer;
      display: grid;
      place-items: center;
      -webkit-tap-highlight-color: transparent;
    }
    .reset:hover:not([disabled]) {
      background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.08);
    }
    .reset[disabled] {
      opacity: 0.38;
      cursor: default;
    }
    .reset ha-icon {
      --mdc-icon-size: 20px;
    }
    mt-grid-slider {
      flex: 1 1 auto;
      min-width: 0;
    }
    .hint {
      color: var(--secondary-text-color);
      font-size: 0.78rem;
      margin-top: 4px;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'mt-width-field': MtWidthField;
  }
}
