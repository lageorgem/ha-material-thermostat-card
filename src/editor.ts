import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { type HomeAssistant, type LovelaceCardEditor, fireEvent } from 'custom-card-helpers';
import { EDITOR_TYPE } from './const';
import type { FeatureConfig, FeatureType, MaterialThermostatCardConfig } from './types';
import './editors/climate-feature-editor';
import './editors/input-select-editor';
import './editors/entity-list-editor';
import './editors/entity-tile-editor';
import './editors/comfort-editor';
import { ensureHaComponents } from './editors/load-ha';

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

/** "Feels like" sensors + dial-replacement toggle (card-level). */
const FEELS_LIKE_SCHEMA: FormSchemaItem[] = [
  { name: 'temperature', selector: { entity: { domain: 'sensor' } } },
  { name: 'humidity', selector: { entity: { domain: 'sensor' } } },
  { name: 'show_as_current', selector: { boolean: {} } },
];

/** Feature types that can be added from the editor. */
const ADDABLE_FEATURES: { type: FeatureType; label: string }[] = [
  { type: 'climate-hvac-modes', label: 'Climate HVAC modes' },
  { type: 'climate-fan-modes', label: 'Climate fan modes' },
  { type: 'climate-swing-modes', label: 'Climate swing modes' },
  { type: 'climate-preset-modes', label: 'Climate preset modes' },
  { type: 'comfort', label: 'Comfort & time to comfortable' },
  { type: 'input-select', label: 'Input select' },
  { type: 'switch-group', label: 'Switch group' },
  { type: 'switch-list', label: 'Switch list' },
  { type: 'button-list', label: 'Button list' },
  { type: 'entity-tile', label: 'Entity tile' },
  { type: 'sensor-list', label: 'Sensor list' },
];

/** The climate selector types and the entity attribute that exposes each. */
const CLIMATE_FEATURE_ATTR: Partial<Record<FeatureType, string>> = {
  'climate-hvac-modes': 'hvac_modes',
  'climate-fan-modes': 'fan_modes',
  'climate-swing-modes': 'swing_modes',
  'climate-preset-modes': 'preset_modes',
};

/** Custom feature types that may be added at most once. */
const SINGLETON_FEATURES = new Set<FeatureType>(['comfort']);

/**
 * Build a sensible default config for a newly added feature.
 * @param type the feature type
 */
function defaultFeature(type: FeatureType): FeatureConfig {
  switch (type) {
    case 'input-select':
      return { type, entity: '' };
    case 'switch-group':
    case 'switch-list':
      return { type, entities: [] };
    case 'button-list':
    case 'sensor-list':
      return { type, items: [] };
    case 'entity-tile':
      return { type, entity: '' };
    case 'comfort':
      return { type, show_target_eta: false };
    default:
      return { type } as FeatureConfig;
  }
}

const FEATURE_LABELS: Record<FeatureType, string> = {
  'climate-hvac-modes': 'Climate HVAC modes',
  'climate-fan-modes': 'Climate fan modes',
  'climate-swing-modes': 'Climate swing modes',
  'climate-preset-modes': 'Climate preset modes',
  comfort: 'Comfort & time to comfortable',
  'input-select': 'Input select',
  'switch-group': 'Switch group',
  'switch-list': 'Switch list',
  'button-list': 'Button list',
  'entity-tile': 'Entity tile',
  'sensor-list': 'Sensor list',
};

@customElement(EDITOR_TYPE)
export class MaterialThermostatCardEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) hass!: HomeAssistant;
  @state() private _config!: MaterialThermostatCardConfig;
  @state() private _editingIndex: number | null = null;
  @state() private _addOpen = false;

  connectedCallback(): void {
    super.connectedCallback();
    // HA lazily loads its form components; make sure the pickers/forms used by
    // the feature sub-editors are registered, then re-render once they are.
    ensureHaComponents().then(() => this.requestUpdate());
  }

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

  /** Data object handed to the feels-like ha-form. */
  private get _feelsLikeData() {
    const fl = this._config.feels_like ?? {};
    return {
      temperature: fl.temperature,
      humidity: fl.humidity,
      show_as_current: fl.show_as_current ?? false,
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
      case 'temperature':
        return 'Temperature sensor';
      case 'humidity':
        return 'Humidity sensor';
      case 'show_as_current':
        return 'Show feels-like as the current temperature';
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

  /**
   * Merge changes from the feels-like form into the nested config object.
   * @param e ha-form's value-changed event
   */
  private _feelsLikeChanged(e: CustomEvent): void {
    const data = e.detail.value;
    const feels_like = {
      temperature: data.temperature || undefined,
      humidity: data.humidity || undefined,
      show_as_current: data.show_as_current || undefined,
    };
    const empty = !feels_like.temperature && !feels_like.humidity && !feels_like.show_as_current;
    this._emit({ ...this._config, feels_like: empty ? undefined : feels_like });
  }

  /** The configured features. */
  private get _features(): FeatureConfig[] {
    return this._config.features ?? [];
  }

  /**
   * The feature types offered in the "Add feature" menu: climate selectors only
   * when the entity actually exposes them and they aren't already added (each is
   * unique); custom features (input_select, switch/button lists, tiles) are
   * always available and repeatable.
   */
  private _addableFeatures(): { type: FeatureType; label: string }[] {
    const attrs = this.hass?.states?.[this._config.entity]?.attributes ?? {};
    const existing = new Set(this._features.map((f) => f.type));
    return ADDABLE_FEATURES.filter(({ type }) => {
      if (SINGLETON_FEATURES.has(type)) return !existing.has(type); // add-once custom feature
      const attr = CLIMATE_FEATURE_ATTR[type];
      if (!attr) return true; // custom feature → always addable, repeatable
      return !existing.has(type) && Array.isArray(attrs[attr]) && attrs[attr].length > 0;
    });
  }

  /**
   * Persist a new features array.
   * @param features the updated features
   */
  private _setFeatures(features: FeatureConfig[]): void {
    this._emit({ ...this._config, features });
  }

  /**
   * Add a feature of the chosen type and open its editor.
   * @param type the feature type
   */
  private _pickFeature(type: FeatureType): void {
    this._addOpen = false;
    const features = [...this._features, defaultFeature(type)];
    this._editingIndex = features.length - 1;
    this._setFeatures(features);
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
          <span>Feels-like temperature</span>
        </div>
        <ha-form
          .hass=${this.hass}
          .data=${this._feelsLikeData}
          .schema=${FEELS_LIKE_SCHEMA}
          .computeLabel=${this._computeLabel}
          @value-changed=${this._feelsLikeChanged}
        ></ha-form>

        <div class="features-header">
          <span>Features</span>
        </div>

        <ha-sortable handle-selector=".handle" @item-moved=${this._moveFeature}>
          <div class="features">
            ${this._features.map((feature, index) => this._renderFeatureRow(feature, index))}
          </div>
        </ha-sortable>

        <div class="add">
          <button
            class="add-btn"
            aria-expanded=${this._addOpen ? 'true' : 'false'}
            @click=${() => (this._addOpen = !this._addOpen)}
          >
            <ha-icon icon=${this._addOpen ? 'mdi:close' : 'mdi:plus'}></ha-icon>
            <span>Add feature</span>
          </button>
          ${this._addOpen
            ? html`<div class="add-menu">
                ${this._addableFeatures().map(
                  (f) => html`<button class="add-opt" @click=${() => this._pickFeature(f.type)}>
                    ${f.label}
                  </button>`
                )}
              </div>`
            : nothing}
        </div>
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
    const onChange = (e: CustomEvent) => this._featureChanged(index, e);
    let inner: TemplateResult;
    switch (feature.type) {
      case 'climate-hvac-modes':
      case 'climate-fan-modes':
      case 'climate-swing-modes':
      case 'climate-preset-modes': {
        const kind =
          feature.type === 'climate-hvac-modes'
            ? 'hvac'
            : feature.type === 'climate-fan-modes'
              ? 'fan'
              : feature.type === 'climate-preset-modes'
                ? 'preset'
                : 'swing';
        inner = html`<mt-climate-feature-editor
          .hass=${this.hass}
          .entityId=${this._config.entity}
          kind=${kind}
          .feature=${feature}
          @feature-changed=${onChange}
        ></mt-climate-feature-editor>`;
        break;
      }
      case 'input-select':
        inner = html`<mt-input-select-editor
          .hass=${this.hass}
          .feature=${feature}
          @feature-changed=${onChange}
        ></mt-input-select-editor>`;
        break;
      case 'switch-group':
        inner = html`<mt-entity-list-editor
          .hass=${this.hass}
          .feature=${feature}
          itemsKey="entities"
          .showDisplay=${true}
          .includeDomains=${['switch', 'input_boolean', 'light', 'fan']}
          @feature-changed=${onChange}
        ></mt-entity-list-editor>`;
        break;
      case 'switch-list':
        inner = html`<mt-entity-list-editor
          .hass=${this.hass}
          .feature=${feature}
          itemsKey="entities"
          .includeDomains=${['switch', 'input_boolean', 'light', 'fan']}
          @feature-changed=${onChange}
        ></mt-entity-list-editor>`;
        break;
      case 'button-list':
        inner = html`<mt-entity-list-editor
          .hass=${this.hass}
          .feature=${feature}
          itemsKey="items"
          .includeDomains=${['button', 'input_button', 'scene', 'script']}
          @feature-changed=${onChange}
        ></mt-entity-list-editor>`;
        break;
      case 'entity-tile':
        inner = html`<mt-entity-tile-editor
          .hass=${this.hass}
          .feature=${feature}
          @feature-changed=${onChange}
        ></mt-entity-tile-editor>`;
        break;
      case 'sensor-list':
        inner = html`<mt-entity-list-editor
          .hass=${this.hass}
          .feature=${feature}
          itemsKey="items"
          .includeDomains=${['sensor', 'binary_sensor']}
          @feature-changed=${onChange}
        ></mt-entity-list-editor>`;
        break;
      case 'comfort':
        inner = html`<mt-comfort-editor
          .hass=${this.hass}
          .feature=${feature}
          .feelsLikeConfigured=${!!(
            this._config.feels_like?.temperature && this._config.feels_like?.humidity
          )}
          @feature-changed=${onChange}
        ></mt-comfort-editor>`;
        break;
      default:
        inner = html`<p class="hint">No editor available.</p>`;
    }
    return html`<div class="feature-editor">${inner}</div>`;
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
    .add {
      position: relative;
    }
    .add-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border: none;
      border-radius: 999px;
      background: var(--primary-color);
      color: var(--text-primary-color, #fff);
      cursor: pointer;
      font: inherit;
      font-size: 14px;
      font-weight: 500;
    }
    .add-btn ha-icon {
      --mdc-icon-size: 18px;
    }
    .add-menu {
      margin-top: 8px;
      display: flex;
      flex-direction: column;
      background: var(--card-background-color, var(--secondary-background-color));
      border: 1px solid var(--divider-color);
      border-radius: 12px;
      overflow: hidden;
    }
    .add-opt {
      text-align: left;
      padding: 12px 16px;
      border: none;
      background: transparent;
      color: var(--primary-text-color);
      cursor: pointer;
      font: inherit;
      font-size: 14px;
    }
    .add-opt:hover {
      background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.08);
    }
    .add-opt:not(:last-child) {
      border-bottom: 1px solid var(--divider-color);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'material-thermostat-card-editor': MaterialThermostatCardEditor;
  }
}
