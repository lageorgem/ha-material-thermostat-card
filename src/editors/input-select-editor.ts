import { LitElement, html, css, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import type { InputSelectFeatureConfig, OptionOverride } from '../types';
import { prettyLabel, orderValues } from '../theme';
import './display-toggle';
import './width-field';

/**
 * Editor for the `input_select` feature: entity picker, optional row label,
 * icon/dropdown display, and per-option label/icon/hide overrides sourced from
 * the selected entity's `options`.
 */
@customElement('mt-input-select-editor')
export class MtInputSelectEditor extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ attribute: false }) feature!: InputSelectFeatureConfig;

  /** Options exposed by the bound input_select entity. */
  private _values(): string[] {
    return this.hass?.states?.[this.feature.entity]?.attributes?.options ?? [];
  }

  /** The option values in their configured display order. */
  private _orderedValues(): string[] {
    return orderValues(this._values(), this.feature.order);
  }

  /**
   * Reorder the options after a drag and persist the new order.
   * @param e ha-sortable's item-moved event
   */
  private _moveOption(e: CustomEvent): void {
    // Nested inside the editor's features ha-sortable — stop the composed,
    // bubbling `item-moved` so it doesn't also reorder the outer feature.
    e.stopPropagation();
    const { oldIndex, newIndex } = e.detail;
    const order = this._orderedValues();
    const [moved] = order.splice(oldIndex, 1);
    order.splice(newIndex, 0, moved);
    this._emit({ order });
  }

  private _override(value: string): OptionOverride | undefined {
    return this.feature.options?.find((o) => o.value === value);
  }

  /**
   * Emit a patched feature config.
   * @param patch partial feature to merge
   */
  private _emit(patch: Partial<InputSelectFeatureConfig>): void {
    this.dispatchEvent(
      new CustomEvent('feature-changed', {
        detail: { feature: { ...this.feature, ...patch } },
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Apply (and prune) an override for one option value.
   * @param value the option value
   * @param patch the override fields
   */
  private _setOverride(value: string, patch: Partial<OptionOverride>): void {
    const options = [...(this.feature.options ?? [])];
    const idx = options.findIndex((o) => o.value === value);
    const merged: OptionOverride = { ...(idx >= 0 ? options[idx] : { value }), ...patch };
    if (merged.label === '') delete merged.label;
    if (merged.icon === '') delete merged.icon;
    if (!merged.hide) delete merged.hide;
    const meaningful = merged.label !== undefined || merged.icon !== undefined || !!merged.hide;
    if (idx >= 0) {
      if (meaningful) options[idx] = merged;
      else options.splice(idx, 1);
    } else if (meaningful) {
      options.push(merged);
    }
    this._emit({ options });
  }

  protected render(): TemplateResult {
    const values = this._values();
    const display = this.feature.display ?? 'icons';
    return html`
      <div class="editor">
        <ha-entity-picker
          .hass=${this.hass}
          .value=${this.feature.entity ?? ''}
          .includeDomains=${['input_select']}
          label="Input select entity"
          allow-custom-entity
          @value-changed=${(e: CustomEvent) => this._emit({ entity: e.detail.value })}
        ></ha-entity-picker>

        <ha-textfield
          label="Row label (optional)"
          .value=${this.feature.label ?? ''}
          @input=${(e: any) => this._emit({ label: e.target.value || undefined })}
        ></ha-textfield>

        <div class="field">
          <span class="field-label">Display</span>
          <mt-display-toggle
            .value=${display}
            @value-changed=${(e: CustomEvent) => this._emit({ display: e.detail.value })}
          ></mt-display-toggle>
        </div>

        <mt-width-field
          .hass=${this.hass}
          .value=${this.feature.width}
          @width-changed=${(e: CustomEvent) => this._emit({ width: e.detail.value })}
        ></mt-width-field>

        ${values.length === 0
          ? html`<p class="hint">Pick an input_select entity to customize its options.</p>`
          : html`<ha-sortable handle-selector=".handle" @item-moved=${this._moveOption}>
              <div class="options">
              ${this._orderedValues().map((value) => {
                const ov = this._override(value);
                const hidden = !!ov?.hide;
                return html`<div class="opt">
                  <div class="handle"><ha-icon icon="mdi:drag"></ha-icon></div>
                  <div class="opt-name" title=${value}>${prettyLabel(value)}</div>
                  <ha-textfield
                    label="Label"
                    .value=${ov?.label ?? ''}
                    .placeholder=${prettyLabel(value)}
                    @input=${(e: any) => this._setOverride(value, { label: e.target.value })}
                  ></ha-textfield>
                  <ha-icon-picker
                    .hass=${this.hass}
                    .value=${ov?.icon ?? ''}
                    @value-changed=${(e: CustomEvent) =>
                      this._setOverride(value, { icon: e.detail.value ?? '' })}
                  ></ha-icon-picker>
                  <button
                    class="opt-hide ${hidden ? 'on' : ''}"
                    title=${hidden ? 'Hidden' : 'Visible'}
                    @click=${() => this._setOverride(value, { hide: !hidden })}
                  >
                    <ha-icon icon=${hidden ? 'mdi:eye-off' : 'mdi:eye'}></ha-icon>
                  </button>
                </div>`;
              })}
              </div>
            </ha-sortable>`}
      </div>
    `;
  }

  static styles = css`
    .editor {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 4px 0;
    }
    ha-entity-picker,
    ha-textfield {
      width: 100%;
    }
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
    .options {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .opt {
      display: grid;
      grid-template-columns: auto minmax(60px, 1fr) 2fr auto auto;
      align-items: center;
      gap: 8px;
    }
    .handle {
      cursor: grab;
      color: var(--secondary-text-color);
      display: grid;
      place-items: center;
    }
    .handle ha-icon {
      --mdc-icon-size: 20px;
    }
    .opt-name {
      font-size: 13px;
      color: var(--secondary-text-color);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    ha-icon-picker {
      width: 56px;
    }
    .opt-hide {
      width: 40px;
      height: 40px;
      border: none;
      background: transparent;
      border-radius: 50%;
      color: var(--secondary-text-color);
      cursor: pointer;
    }
    .opt-hide.on {
      color: var(--error-color);
    }
    .hint {
      color: var(--secondary-text-color);
      font-size: 13px;
      margin: 0;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'mt-input-select-editor': MtInputSelectEditor;
  }
}
