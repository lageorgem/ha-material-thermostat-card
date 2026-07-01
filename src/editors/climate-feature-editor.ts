import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import type {
  ClimateFanFeatureConfig,
  ClimateModesFeatureConfig,
  ClimatePresetFeatureConfig,
  ClimateSwingFeatureConfig,
  OptionOverride,
} from '../types';
import {
  prettyLabel,
  orderValues,
  HVAC_MODE_ICONS,
  fanIcon,
  swingIcon,
  presetIcon,
  climateModeColor,
  presetColor,
} from '../theme';
import './display-toggle';
import './width-field';
import './icon-field';
import './text-field';
import './color-field';

/** Theme primary color expression used as the default swatch when unset. */
const THEME_PRIMARY = 'var(--md-sys-color-primary, var(--primary-color, #6750a4))';

type ClimateFeature =
  | ClimateModesFeatureConfig
  | ClimateFanFeatureConfig
  | ClimateSwingFeatureConfig
  | ClimatePresetFeatureConfig;

/**
 * Per-option editor for the climate selectors. Lets the user override the
 * label and icon of each mode/fan/swing option, hide options, and switch the
 * row between icon and dropdown display. Emits `feature-changed`.
 */
@customElement('mt-climate-feature-editor')
export class MtClimateFeatureEditor extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property() entityId!: string;
  @property() kind!: 'hvac' | 'fan' | 'swing' | 'preset';
  @property({ attribute: false }) feature!: ClimateFeature;

  /** The underlying option values from the entity attributes. */
  private _values(): string[] {
    const a = this.hass?.states?.[this.entityId]?.attributes;
    if (!a) return [];
    if (this.kind === 'hvac') return a.hvac_modes ?? [];
    if (this.kind === 'fan') return a.fan_modes ?? [];
    if (this.kind === 'preset') return a.preset_modes ?? [];
    return a.swing_modes ?? [];
  }

  /** The option values in their configured display order. */
  private _orderedValues(): string[] {
    return orderValues(this._values(), this.feature.order);
  }

  /**
   * The default icon for an option value (the icon shown when no override is
   * set), used to preview the would-be icon in the option's icon pill.
   * @param value the option value
   */
  private _defaultIcon(value: string): string {
    if (this.kind === 'hvac') return HVAC_MODE_ICONS[value] ?? 'mdi:thermostat';
    if (this.kind === 'fan') return fanIcon(value);
    if (this.kind === 'preset') return presetIcon(value);
    return swingIcon(value);
  }

  /**
   * The default swatch color for an option (before any override): the HVAC mode
   * color, the preset special-case color (eco→green, sleep→blue), else the theme
   * primary — matching what the rendered feature falls back to.
   * @param value the option value
   */
  private _defaultColor(value: string): string {
    if (this.kind === 'hvac') return climateModeColor(value);
    if (this.kind === 'preset') return presetColor(value) ?? THEME_PRIMARY;
    return THEME_PRIMARY;
  }

  /**
   * Reorder the options after a drag and persist the new order.
   * @param e ha-sortable's item-moved event
   */
  private _moveOption(e: CustomEvent): void {
    // This list is nested inside the editor's features ha-sortable; ha-sortable's
    // `item-moved` is composed+bubbling, so without this it would also reach the
    // outer features sortable and reorder the FEATURE instead of the options.
    e.stopPropagation();
    const { oldIndex, newIndex } = e.detail;
    const order = this._orderedValues();
    const [moved] = order.splice(oldIndex, 1);
    order.splice(newIndex, 0, moved);
    this._emit({ order });
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
    // `undefined` = unset (use the default icon); '' = explicit "no icon" (kept).
    if (merged.icon === undefined) delete merged.icon;
    if (!merged.hide) delete merged.hide;
    // undefined/'' color = reset to the default (theme/mode) color.
    if (!merged.color) delete merged.color;

    const meaningful =
      merged.label !== undefined || merged.icon !== undefined || !!merged.hide || !!merged.color;
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
    // The color picker is offered for HVAC and preset modes in any display (their
    // colors feed the dial), and for every selector in tile display (the tile
    // accent). Fan/swing in icon/dropdown display have no place for a color.
    const showColor = this.kind === 'hvac' || this.kind === 'preset' || display === 'tile';
    return html`
      <div class="editor">
        <mt-text-field
          label="Title (optional)"
          .value=${this.feature.label ?? ''}
          @value-changed=${(e: CustomEvent) => this._emit({ label: e.detail.value || undefined })}
        ></mt-text-field>

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
          ? html`<p class="hint">
              Pick a climate entity that exposes ${this.kind} options to customize them.
            </p>`
          : html`<ha-sortable handle-selector=".handle" @item-moved=${this._moveOption}>
              <div class="options">
                ${this._orderedValues().map((value) => this._renderOption(value, showColor))}
              </div>
            </ha-sortable>`}
      </div>
    `;
  }

  /**
   * Render the override controls for a single option.
   * @param value the option value
   * @param showColor whether to show the color picker attached to the title
   */
  private _renderOption(value: string, showColor: boolean): TemplateResult {
    const ov = this._override(value);
    const hidden = !!ov?.hide;
    return html`
      <div class="opt">
        <div class="handle"><ha-icon icon="mdi:drag"></ha-icon></div>
        <div class="opt-name" title=${value}>${prettyLabel(value)}</div>
        <div class="title-group">
          ${showColor
            ? html`<mt-color-field
                .value=${ov?.color}
                .defaultColor=${this._defaultColor(value)}
                @value-changed=${(e: CustomEvent) =>
                  this._setOverride(value, { color: e.detail.value })}
              ></mt-color-field>`
            : nothing}
          <mt-text-field
            class="opt-label"
            label=${prettyLabel(value)}
            .flatLeft=${showColor}
            .value=${ov?.label ?? ''}
            @value-changed=${(e: CustomEvent) =>
              this._setOverride(value, { label: e.detail.value })}
          ></mt-text-field>
        </div>
        <mt-icon-field
          class="opt-icon"
          .hass=${this.hass}
          .value=${ov?.icon}
          .defaultIcon=${this._defaultIcon(value)}
          @value-changed=${(e: CustomEvent) =>
            this._setOverride(value, { icon: e.detail.value })}
        ></mt-icon-field>
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
    /* The color pill + title field form a single attached pill. */
    .title-group {
      display: flex;
      align-items: center;
      min-width: 0;
    }
    .title-group mt-text-field {
      flex: 1;
      min-width: 0;
    }
    .opt-icon {
      min-width: 0;
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
