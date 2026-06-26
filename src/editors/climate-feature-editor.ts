import { LitElement, html, css, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import type {
  ClimateFanFeatureConfig,
  ClimateModesFeatureConfig,
  ClimateSwingFeatureConfig,
  OptionOverride,
} from '../types';
import { prettyLabel } from '../theme';
import './display-toggle';
import './width-field';

type ClimateFeature =
  | ClimateModesFeatureConfig
  | ClimateFanFeatureConfig
  | ClimateSwingFeatureConfig;

/**
 * Per-option editor for the climate selectors. Lets the user override the
 * label and icon of each mode/fan/swing option, hide options, and switch the
 * row between icon and dropdown display. Emits `feature-changed`.
 */
@customElement('mt-climate-feature-editor')
export class MtClimateFeatureEditor extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property() entityId!: string;
  @property() kind!: 'hvac' | 'fan' | 'swing';
  @property({ attribute: false }) feature!: ClimateFeature;

  /** The underlying option values from the entity attributes. */
  private _values(): string[] {
    const a = this.hass?.states?.[this.entityId]?.attributes;
    if (!a) return [];
    if (this.kind === 'hvac') return a.hvac_modes ?? [];
    if (this.kind === 'fan') return a.fan_modes ?? [];
    return a.swing_modes ?? [];
  }

  /** The existing override for a value, if any. */
  private _override(value: string): OptionOverride | undefined {
    return this.feature.options?.find((o) => o.value === value);
  }

  /**
   * Emit a patched feature config to the parent editor.
   * @param patch partial feature config to merge
   */
  private _emit(patch: Partial<ClimateFeature>): void {
    this.dispatchEvent(
      new CustomEvent('feature-changed', {
        detail: { feature: { ...this.feature, ...patch } },
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Apply an override patch for one option value, pruning empty overrides.
   * @param value the option value
   * @param patch the override fields to set
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
        <div class="field">
          <span class="field-label">Display</span>
          <mt-display-toggle
            .value=${display}
            @value-changed=${(e: CustomEvent) => this._emit({ display: e.detail.value })}
          ></mt-display-toggle>
        </div>

        <mt-width-field
          .value=${this.feature.width}
          @width-changed=${(e: CustomEvent) => this._emit({ width: e.detail.value })}
        ></mt-width-field>

        ${values.length === 0
          ? html`<p class="hint">
              Pick a climate entity that exposes ${this.kind} options to customize them.
            </p>`
          : html`<div class="options">
              ${values.map((value) => this._renderOption(value))}
            </div>`}
      </div>
    `;
  }

  /**
   * Render the override controls for a single option.
   * @param value the option value
   */
  private _renderOption(value: string): TemplateResult {
    const ov = this._override(value);
    const hidden = !!ov?.hide;
    return html`
      <div class="opt">
        <div class="opt-name" title=${value}>${prettyLabel(value)}</div>
        <ha-textfield
          class="opt-label"
          label="Label"
          .value=${ov?.label ?? ''}
          .placeholder=${prettyLabel(value)}
          @input=${(e: any) => this._setOverride(value, { label: e.target.value })}
        ></ha-textfield>
        <ha-icon-picker
          class="opt-icon"
          .hass=${this.hass}
          .value=${ov?.icon ?? ''}
          @value-changed=${(e: CustomEvent) =>
            this._setOverride(value, { icon: e.detail.value ?? '' })}
        ></ha-icon-picker>
        <button
          class="opt-hide ${hidden ? 'on' : ''}"
          aria-label=${hidden ? 'Show option' : 'Hide option'}
          title=${hidden ? 'Hidden' : 'Visible'}
          @click=${() => this._setOverride(value, { hide: !hidden })}
        >
          <ha-icon icon=${hidden ? 'mdi:eye-off' : 'mdi:eye'}></ha-icon>
        </button>
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
      grid-template-columns: minmax(70px, 1fr) 2fr auto auto;
      align-items: center;
      gap: 8px;
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
    'mt-climate-feature-editor': MtClimateFeatureEditor;
  }
}
