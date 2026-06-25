import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { type HomeAssistant, type LovelaceCardEditor, fireEvent } from 'custom-card-helpers';
import { EDITOR_TYPE } from './const';
import type { FeatureConfig, FeatureType, MaterialThermostatCardConfig } from './types';
import './editors/climate-feature-editor';

interface FormSchemaItem {
  name: string;
  selector: Record<string, unknown>;
}

const BASE_SCHEMA: FormSchemaItem[] = [
  { name: 'entity', selector: { entity: { domain: 'climate' } } },
  { name: 'name', selector: { text: {} } },
  { name: 'theme', selector: { theme: {} } },
  { name: 'show_current_as_primary', selector: { boolean: {} } },
];

/** Feature types that can be added from the editor in this build. */
const ADDABLE_FEATURES: { type: FeatureType; label: string }[] = [
  { type: 'climate-hvac-modes', label: 'Climate HVAC modes' },
  { type: 'climate-fan-modes', label: 'Climate fan modes' },
  { type: 'climate-swing-modes', label: 'Climate swing modes' },
];

const FEATURE_LABELS: Record<FeatureType, string> = {
  'climate-hvac-modes': 'Climate HVAC modes',
  'climate-fan-modes': 'Climate fan modes',
  'climate-swing-modes': 'Climate swing modes',
  'input-select': 'Input select',
  'switch-group': 'Switch group',
  'switch-list': 'Switch list',
  'button-list': 'Button list',
  'entity-tile': 'Entity tile',
};

@customElement(EDITOR_TYPE)
export class MaterialThermostatCardEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) hass!: HomeAssistant;
  @state() private _config!: MaterialThermostatCardConfig;
  @state() private _editingIndex: number | null = null;

  /**
   * Receive the current card configuration.
   * @param config the Lovelace card config
   */
  public setConfig(config: MaterialThermostatCardConfig): void {
    this._config = config;
  }

  /** Data object handed to the base ha-form. */
  private get _baseData() {
    return {
      entity: this._config.entity,
      name: this._config.name,
      theme: this._config.theme,
      show_current_as_primary: this._config.show_current_as_primary ?? false,
    };
  }

  /**
   * Emit a new configuration to Lovelace.
   * @param config the updated config
   */
  private _emit(config: MaterialThermostatCardConfig): void {
    this._config = config;
    fireEvent(this, 'config-changed', { config });
  }

  /**
   * Field label resolver for the base form.
   * @param s the schema item
   */
  private _computeLabel = (s: FormSchemaItem): string => {
    switch (s.name) {
      case 'entity':
        return 'Climate entity (required)';
      case 'name':
        return 'Name';
      case 'theme':
        return 'Theme';
      case 'show_current_as_primary':
        return 'Show current temperature as primary information';
      default:
        return s.name;
    }
  };

  /**
   * Merge changes from the base form into the config.
   * @param e ha-form's value-changed event
   */
  private _baseChanged(e: CustomEvent): void {
    const data = e.detail.value;
    const config: MaterialThermostatCardConfig = {
      ...this._config,
      entity: data.entity,
      name: data.name || undefined,
      theme: data.theme || undefined,
      show_current_as_primary: data.show_current_as_primary || undefined,
    };
    this._emit(config);
  }

  /** The configured features. */
  private get _features(): FeatureConfig[] {
    return this._config.features ?? [];
  }

  /**
   * Persist a new features array.
   * @param features the updated features
   */
  private _setFeatures(features: FeatureConfig[]): void {
    this._emit({ ...this._config, features });
  }

  /**
   * Add a feature of the chosen type.
   * @param e ha-button-menu's action event
   */
  private _addFeature(e: CustomEvent): void {
    const type = ADDABLE_FEATURES[e.detail.index]?.type;
    if (!type) return;
    const feature = { type } as FeatureConfig;
    this._setFeatures([...this._features, feature]);
    this._editingIndex = this._features.length; // open the new one
  }

  /**
   * Delete a feature.
   * @param index the feature index
   */
  private _removeFeature(index: number): void {
    const features = [...this._features];
    features.splice(index, 1);
    this._editingIndex = null;
    this._setFeatures(features);
  }

  /**
   * Reorder a feature after a drag.
   * @param e ha-sortable's item-moved event
   */
  private _moveFeature(e: CustomEvent): void {
    const { oldIndex, newIndex } = e.detail;
    const features = [...this._features];
    const [moved] = features.splice(oldIndex, 1);
    features.splice(newIndex, 0, moved);
    this._editingIndex = null;
    this._setFeatures(features);
  }

  /**
   * Replace a feature with its edited version.
   * @param index the feature index
   * @param e the sub-editor's feature-changed event
   */
  private _featureChanged(index: number, e: CustomEvent): void {
    const features = [...this._features];
    features[index] = e.detail.feature;
    this._setFeatures(features);
  }

  protected render(): TemplateResult {
    if (!this._config || !this.hass) return html``;
    return html`
      <div class="editor">
        <ha-form
          .hass=${this.hass}
          .data=${this._baseData}
          .schema=${BASE_SCHEMA}
          .computeLabel=${this._computeLabel}
          @value-changed=${this._baseChanged}
        ></ha-form>

        <div class="features-header">
          <span>Features</span>
        </div>

        <ha-sortable handle-selector=".handle" @item-moved=${this._moveFeature}>
          <div class="features">
            ${this._features.map((feature, index) => this._renderFeatureRow(feature, index))}
          </div>
        </ha-sortable>

        <ha-button-menu fixed @action=${this._addFeature}>
          <ha-button slot="trigger">
            <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
            Add feature
          </ha-button>
          ${ADDABLE_FEATURES.map(
            (f) => html`<ha-list-item .value=${f.type}>${f.label}</ha-list-item>`
          )}
        </ha-button-menu>
      </div>
    `;
  }

  /**
   * Render a single feature list entry plus its inline editor when expanded.
   * @param feature the feature config
   * @param index the feature index
   */
  private _renderFeatureRow(feature: FeatureConfig, index: number): TemplateResult {
    const expanded = this._editingIndex === index;
    return html`
      <div class="feature">
        <div class="feature-head">
          <div class="handle"><ha-icon icon="mdi:drag"></ha-icon></div>
          <div class="feature-title">${FEATURE_LABELS[feature.type] ?? feature.type}</div>
          <button
            class="icon-btn"
            aria-label="Edit feature"
            @click=${() => (this._editingIndex = expanded ? null : index)}
          >
            <ha-icon icon=${expanded ? 'mdi:chevron-up' : 'mdi:pencil'}></ha-icon>
          </button>
          <button
            class="icon-btn"
            aria-label="Delete feature"
            @click=${() => this._removeFeature(index)}
          >
            <ha-icon icon="mdi:delete"></ha-icon>
          </button>
        </div>
        ${expanded ? this._renderFeatureEditor(feature, index) : nothing}
      </div>
    `;
  }

  /**
   * Render the appropriate sub-editor for a feature.
   * @param feature the feature config
   * @param index the feature index
   */
  private _renderFeatureEditor(feature: FeatureConfig, index: number): TemplateResult {
    const kind =
      feature.type === 'climate-hvac-modes'
        ? 'hvac'
        : feature.type === 'climate-fan-modes'
          ? 'fan'
          : feature.type === 'climate-swing-modes'
            ? 'swing'
            : null;
    if (kind) {
      return html`<div class="feature-editor">
        <mt-climate-feature-editor
          .hass=${this.hass}
          .entityId=${this._config.entity}
          kind=${kind}
          .feature=${feature}
          @feature-changed=${(e: CustomEvent) => this._featureChanged(index, e)}
        ></mt-climate-feature-editor>
      </div>`;
    }
    return html`<div class="feature-editor">
      <p class="hint">This feature type has no visual editor yet — coming in a later release.</p>
    </div>`;
  }

  static styles = css`
    .editor {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .features-header {
      font-weight: 500;
      color: var(--primary-text-color);
    }
    .features {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .feature {
      border: 1px solid var(--divider-color);
      border-radius: 12px;
      overflow: hidden;
      background: var(--secondary-background-color);
    }
    .feature-head {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 8px 8px 4px;
    }
    .handle {
      cursor: grab;
      color: var(--secondary-text-color);
      display: grid;
      place-items: center;
    }
    .feature-title {
      flex: 1;
      color: var(--primary-text-color);
    }
    .icon-btn {
      width: 36px;
      height: 36px;
      border: none;
      background: transparent;
      border-radius: 50%;
      color: var(--secondary-text-color);
      cursor: pointer;
    }
    .icon-btn:hover {
      background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.08);
    }
    .feature-editor {
      padding: 8px 12px 12px;
      border-top: 1px solid var(--divider-color);
    }
    .hint {
      color: var(--secondary-text-color);
      font-size: 13px;
      margin: 0;
    }
    ha-button-menu ha-button {
      --mdc-theme-primary: var(--primary-color);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'material-thermostat-card-editor': MaterialThermostatCardEditor;
  }
}
