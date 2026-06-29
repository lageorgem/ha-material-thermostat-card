import { LitElement, html, css, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import type { HomeAssistant } from 'custom-card-helpers';

/**
 * An icon picker with an explicit **No icon** toggle — the "None" affordance the
 * bare `ha-icon-picker` lacks. Three states are emitted via `value-changed`:
 *
 * - `undefined` — unset: the consumer shows its **default** icon.
 * - `''` — **no icon**: the default is suppressed (the "remove the icon
 *   completely" case; the toggle is on).
 * - a string — a **custom** icon.
 *
 * Clearing the picker reverts to the default (`undefined`); the toggle is the
 * only way to choose "no icon".
 */
@customElement('mt-icon-field')
export class MtIconField extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  /** undefined = default · '' = no icon · string = custom icon. */
  @property() value?: string;
  @property() label = 'Icon';

  /** Whether the explicit "no icon" state is selected. */
  private get _none(): boolean {
    return this.value === '';
  }

  /**
   * Emit the new value to the parent editor.
   * @param value undefined (default) · '' (no icon) · a custom icon
   */
  private _emit(value: string | undefined): void {
    this.dispatchEvent(
      new CustomEvent('value-changed', { detail: { value }, bubbles: true, composed: true })
    );
  }

  protected render(): TemplateResult {
    const none = this._none;
    return html`
      <ha-icon-picker
        .hass=${this.hass}
        .label=${this.label}
        .value=${this.value || ''}
        .disabled=${none}
        @value-changed=${(e: CustomEvent) => {
          // The picker's event is composed — stop it so the parent editor only
          // sees our normalized value (clearing the picker → default, not '').
          e.stopPropagation();
          this._emit(e.detail.value || undefined);
        }}
      ></ha-icon-picker>
      <button
        type="button"
        class=${classMap({ none: true, active: none })}
        aria-pressed=${none ? 'true' : 'false'}
        title=${none ? 'No icon — click to use the default' : 'No icon'}
        @click=${() => this._emit(none ? undefined : '')}
      >
        <ha-icon icon="mdi:image-off"></ha-icon>
      </button>
    `;
  }

  static styles = css`
    :host {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    ha-icon-picker {
      flex: 1;
      min-width: 0;
    }
    .none {
      flex: 0 0 auto;
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 50%;
      background: transparent;
      color: var(--secondary-text-color);
      cursor: pointer;
    }
    .none:hover {
      background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.08);
    }
    .none.active {
      color: var(--primary-color);
      background: rgba(var(--rgb-primary-color, 103, 80, 164), 0.12);
    }
    .none ha-icon {
      --mdc-icon-size: 20px;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'mt-icon-field': MtIconField;
  }
}
