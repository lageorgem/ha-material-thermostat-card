import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import { MIN_FEATURE_UNITS, MAX_FEATURE_UNITS } from '../grid';
import './grid-slider';

/**
 * A small editor control for a feature's width, expressed in grid units
 * (1 unit ≈ 24px, min 2). Empty (unset) means "let the card decide" — a full
 * row for selector/list features, a sensible default for tiles. Renders Home
 * Assistant's grid-layout-style slider (via the self-contained `mt-grid-slider`)
 * plus a reset button that clears the width back to auto. Emits `width-changed`
 * with `{ value: number | undefined }`.
 */
@customElement('mt-width-field')
export class MtWidthField extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ type: Number }) value?: number;

  /**
   * Re-emit a width value.
   * @param value the new width in grid units, or undefined for auto
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
    return html`
      <div class="label">Width (grid units, ≈24px each, min ${MIN_FEATURE_UNITS})</div>
      <div class="control">
        <button
          class="reset"
          aria-label="Reset width to auto"
          title="Reset to auto"
          ?disabled=${!set}
          @click=${this._reset}
        >
          <ha-icon icon="mdi:restore"></ha-icon>
        </button>
        <mt-grid-slider
          .value=${this.value}
          .min=${MIN_FEATURE_UNITS}
          .max=${MAX_FEATURE_UNITS}
          .step=${1}
          tooltip-mode=${set ? 'always' : 'interaction'}
          @value-changed=${this._onChanged}
        ></mt-grid-slider>
      </div>
      ${set ? nothing : html`<div class="hint">Auto — tap the track to set a width.</div>`}
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
