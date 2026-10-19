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
import './editors/entity-picker';
import { tokens } from './theme';
import { primaryDomain, supportsFeature, WaterHeaterEntityFeature } from './entity/adapter';

interface FormSchemaItem {
  name: string;
  selector?: Record<string, unknown>;
  type?: 'expandable';
  title?: string;
  icon?: string;
  flatten?: boolean;
  schema?: FormSchemaItem[];
}

/**
 * Build a dropdown selector.
 * @param options labelled selector values
 */
const select = (options: { value: string; label: string }[]) => ({
  select: { mode: 'dropdown', options },
});

const BASE_SCHEMA: FormSchemaItem[] = [
  { name: 'entity', selector: { entity: { domain: ['climate', 'water_heater'] } } },
  { name: 'name', selector: { text: {} } },
  { name: 'theme', selector: { theme: {} } },
  {
    name: '', type: 'expandable', title: 'Style', icon: 'mdi:palette-outline', flatten: true,
    schema: [
      { name: 'dial_style', selector: select([
        { value: 'halo', label: 'Halo' },
        { value: 'minimal', label: 'Minimal' },
        { value: 'google', label: 'Google Home' },
      ]) },
      { name: 'show_current_as_primary', selector: { boolean: {} } },
      { name: 'show_state_label', selector: { boolean: {} } },
      { name: 'font', selector: select([
        { value: 'rounded', label: 'Google Sans Flex (rounded)' },
        { value: 'theme', label: 'Theme font' },
      ]) },
    ],
  },
];

/** "Feels like" sensors + dial-replacement toggle (card-level). */
const FEELS_LIKE_SCHEMA: FormSchemaItem[] = [
  { name: 'show_as_current', selector: { boolean: {} } },
];

/** Feature types that can be added from the editor. */
const ADDABLE_FEATURES: { type: FeatureType; label: string; icon: string }[] = [
  { type: 'climate-hvac-modes', label: 'Climate HVAC modes', icon: 'mdi:thermostat' },
  { type: 'climate-fan-modes', label: 'Climate fan modes', icon: 'mdi:fan' },
  { type: 'climate-swing-modes', label: 'Climate swing modes', icon: 'mdi:arrow-oscillating' },
  { type: 'climate-swing-horizontal-modes', label: 'Climate horizontal swing modes', icon: 'mdi:arrow-left-right' },
  { type: 'climate-preset-modes', label: 'Climate preset modes', icon: 'mdi:leaf' },
  { type: 'comfort', label: 'Comfort & time to comfortable', icon: 'mdi:emoticon-happy-outline' },
  { type: 'water-heater-operation-modes', label: 'Water heater operation modes', icon: 'mdi:water-boiler' },
  { type: 'water-heater-away-mode', label: 'Water heater away mode', icon: 'mdi:account-arrow-right' },
  { type: 'input-select', label: 'Input select', icon: 'mdi:form-select' },
  { type: 'switch-group', label: 'Switch group', icon: 'mdi:toggle-switch-outline' },
  { type: 'switch-list', label: 'Switch list', icon: 'mdi:format-list-checks' },
  { type: 'button-list', label: 'Button list', icon: 'mdi:gesture-tap-button' },
  { type: 'entity-tile', label: 'Entity tile', icon: 'mdi:card-outline' },
  { type: 'sensor-list', label: 'Sensor list', icon: 'mdi:format-list-bulleted' },
];

/** The climate selector types and the entity attribute that exposes each. */
const CLIMATE_FEATURE_ATTR: Partial<Record<FeatureType, string>> = {
  'climate-hvac-modes': 'hvac_modes',
  'climate-fan-modes': 'fan_modes',
  'climate-swing-modes': 'swing_modes',
  'climate-swing-horizontal-modes': 'swing_horizontal_modes',
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
  'climate-swing-horizontal-modes': 'Climate horizontal swing modes',
  'water-heater-operation-modes': 'Water heater operation modes',
  'water-heater-away-mode': 'Water heater away mode',
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

  /**
   * Data object handed to the base ha-form.
   * @param none No parameters; reads the current configuration.
   */
  private get _baseData() {
    return {
      entity: this._config.entity,
      name: this._config.name,
      theme: this._config.theme,
      dial_style: this._config.dial_style ?? 'halo',
      font: this._config.font ?? 'rounded',
      show_current_as_primary: this._config.show_current_as_primary ?? false,
      show_state_label: this._config.show_state_label ?? false,
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
        return 'Climate or water heater entity (required)';
      case 'name':
        return 'Name';
      case 'theme':
        return 'Theme';
      case 'dial_style':
        return 'Dial style';
      case 'font':
        return 'Font';
      case 'show_current_as_primary':
        return 'Show current temperature as primary information';
      case 'show_state_label':
        return 'Show HVAC action / state label';
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
   * Explain optional style settings.
   * @param s the schema item
   */
  private _computeHelper = (s: FormSchemaItem): string | undefined => {
    switch (s.name) {
      case 'dial_style':
        return 'Halo glows in the mode colour; Minimal has no glow; Google Home adds a flat dial background like the Google Home app.';
      case 'font':
        return "Rounded loads Google Sans Flex from Google Fonts; Theme font uses your Home Assistant theme's font.";
      default:
        return undefined;
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
      name: typeof this._config.name === 'string' || this._config.name === undefined
        ? data.name || undefined
        : this._config.name,
      theme: data.theme || undefined,
      dial_style: data.dial_style === 'halo' ? undefined : data.dial_style,
      font: data.font === 'rounded' ? undefined : data.font,
      show_current_as_primary: data.show_current_as_primary || undefined,
      show_state_label: data.show_state_label || undefined,
    };
    this._emit(config);
  }

  /**
   * Merge changes from the feels-like form into the nested config object.
   * @param e ha-form's value-changed event
   */
  private _feelsLikeChanged(e: CustomEvent): void {
    const data = { ...this._feelsLikeData, ...e.detail.value };
    const feels_like = {
      temperature: data.temperature || undefined,
      humidity: data.humidity || undefined,
      show_as_current: data.show_as_current || undefined,
    };
    const empty = !feels_like.temperature && !feels_like.humidity && !feels_like.show_as_current;
    this._emit({ ...this._config, feels_like: empty ? undefined : feels_like });
  }

  /**
   * Update one sensor without losing the other feels-like settings.
   * @param key sensor configuration key
   * @param e picker value change
   */
  private _feelsLikeSensorChanged(key: 'temperature' | 'humidity', e: CustomEvent<{ value: string }>): void {
    e.stopPropagation();
    this._feelsLikeChanged(new CustomEvent('value-changed', { detail: { value: { [key]: e.detail.value } } }));
  }

  /** The configured features. */
  private get _features(): FeatureConfig[] {
    return this._config.features ?? [];
  }

  /**
   * Offer domain-specific features only when supported and not already added.
   * Auxiliary features remain repeatable for either primary domain.
   * @param none No parameters; reads the configured entity and features.
   */
  private _addableFeatures(): typeof ADDABLE_FEATURES {
    const stateObj = this.hass?.states?.[this._config.entity];
    const attrs = stateObj?.attributes ?? {};
    const domain = primaryDomain(this._config.entity);
    const existing = new Set(this._features.map((f) => f.type));
    return ADDABLE_FEATURES.filter(({ type }) => {
      if (SINGLETON_FEATURES.has(type)) return domain === 'climate' && !existing.has(type);
      if (type === 'water-heater-away-mode') {
        return domain === 'water_heater' && !existing.has(type) && supportsFeature(stateObj, WaterHeaterEntityFeature.AWAY_MODE);
      }
      if (type === 'water-heater-operation-modes') {
        return domain === 'water_heater' && !existing.has(type) && Array.isArray(attrs.operation_list) && attrs.operation_list.length > 0;
      }
      const attr = CLIMATE_FEATURE_ATTR[type];
      if (!attr) return true; // custom feature → always addable, repeatable
      return domain === 'climate' && !existing.has(type) && Array.isArray(attrs[attr]) && attrs[attr].length > 0;
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
   * Reorder with arrow keys and retain focus on the moved feature.
   * @param index current feature index
   * @param e handle key event
   */
  private async _handleReorder(index: number, e: KeyboardEvent): Promise<void> {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    const newIndex = index + (e.key === 'ArrowUp' ? -1 : 1);
    if (newIndex < 0 || newIndex >= this._features.length) return;
    this._moveFeature(new CustomEvent('item-moved', { detail: { oldIndex: index, newIndex } }));
    await this.updateComplete;
    this.shadowRoot!.querySelectorAll<HTMLElement>('.handle')[newIndex].focus();
  }

  /**
   * Dismiss the add menu without losing keyboard position.
   * @param e menu key event
   */
  private _addMenuKeydown(e: KeyboardEvent): void {
    if (e.key !== 'Escape' || !this._addOpen) return;
    e.preventDefault();
    e.stopPropagation();
    this._addOpen = false;
    this.shadowRoot!.querySelector<HTMLButtonElement>('.add-btn')!.focus();
  }

  /**
   * Wrap a control in the sibling cards' labelled field layout.
   * @param label visible field label
   * @param control accessible labelled control
   */
  private _labeledField(label: string, control: TemplateResult): TemplateResult {
    return html`<div class="field-column"><span class="field-label">${label}</span>${control}</div>`;
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

  /**
   * Render supported visual fields without exposing structured YAML-only names.
   * @param none No parameters; uses the reactive editor state.
   */
  protected render(): TemplateResult {
    if (!this._config || !this.hass) return html``;
    return html`
      <div class="editor">
        <ha-form
          .hass=${this.hass}
          .data=${this._baseData}
          .schema=${BASE_SCHEMA.filter((field) => field.name !== 'name' || typeof this._config.name === 'string' || this._config.name === undefined)}
          .computeLabel=${this._computeLabel}
          .computeHelper=${this._computeHelper}
          @value-changed=${this._baseChanged}
        ></ha-form>

        ${primaryDomain(this._config.entity) === 'water_heater' ? nothing : html`<ha-expansion-panel outlined .hass=${this.hass}>
          <div slot="header" class="panel-header">
            <ha-icon icon="mdi:thermometer-water"></ha-icon>
            <span>Feels-like temperature</span>
          </div>
          <div class="fields">
            <div class="field-row halves">
              ${(['temperature', 'humidity'] as const).map((key) => {
                const label = this._computeLabel({ name: key });
                return this._labeledField(label, html`<mt-entity-picker
                  .hass=${this.hass}
                  .label=${label}
                  clearable
                  .includeDomains=${['sensor']}
                  .value=${this._feelsLikeData[key] ?? ''}
                  @value-changed=${(e: CustomEvent<{ value: string }>) => this._feelsLikeSensorChanged(key, e)}
                ></mt-entity-picker>`);
              })}
            </div>
        <ha-form
          .hass=${this.hass}
          .data=${this._feelsLikeData}
          .schema=${FEELS_LIKE_SCHEMA}
          .computeLabel=${this._computeLabel}
          @value-changed=${this._feelsLikeChanged}
        ></ha-form>
          </div>
        </ha-expansion-panel>`}

        <div class="features-header">
          <span>Features</span>
        </div>

        ${this._features.length ? nothing : html`<p class="hint">No features yet. Add a feature below.</p>`}
        <ha-sortable handle-selector=".handle" @item-moved=${this._moveFeature}>
          <div class="features">
            ${this._features.map((feature, index) => this._renderFeatureRow(feature, index))}
          </div>
        </ha-sortable>

        <div class="add" @keydown=${this._addMenuKeydown}>
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
                    <ha-icon icon=${f.icon}></ha-icon>${f.label}
                  </button>`
                )}
              </div>`
            : nothing}
        </div>
      </div>
    `;
  }

  /**
   * Summarize a feature without opening its editor.
   * @param feature the configured feature
   */
  private _summary(feature: FeatureConfig): string {
    if ('entities' in feature) return `${feature.entities.length} entities`;
    if ('items' in feature) return `${feature.items.length} entities`;
    if ('entity' in feature) return feature.entity || 'No entity selected';
    if (feature.type === 'comfort') return 'Comfort';
    if ('options' in feature && feature.options) return `${feature.options.length} modes`;
    return 'All modes';
  }

  /**
   * Render a single feature list entry plus its inline editor when expanded.
   * @param feature the feature config
   * @param index the feature index
   */
  private _renderFeatureRow(feature: FeatureConfig, index: number): TemplateResult {
    const expanded = this._editingIndex === index;
    const label = FEATURE_LABELS[feature.type] ?? feature.type;
    const info = ADDABLE_FEATURES.find((f) => f.type === feature.type);
    return html`
      <div class="feature">
        <div class="feature-head">
          <div class="handle" tabindex="0" role="button"
            aria-label=${`Reorder ${label}. Use up and down arrow keys.`}
            @keydown=${(e: KeyboardEvent) => this._handleReorder(index, e)}
          ><ha-icon icon="mdi:drag"></ha-icon></div>
          <ha-icon icon=${info?.icon ?? 'mdi:card-outline'}></ha-icon>
          <div class="feature-title"><div>${label}</div><div class="hint">${this._summary(feature)}</div></div>
          <button
            class="icon-btn"
            aria-label="Edit feature"
            aria-expanded=${String(expanded)}
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
      case 'climate-swing-horizontal-modes':
      case 'water-heater-operation-modes':
      case 'climate-preset-modes': {
        const kind =
          feature.type === 'climate-hvac-modes'
            ? 'hvac'
            : feature.type === 'climate-fan-modes'
              ? 'fan'
              : feature.type === 'climate-preset-modes'
                ? 'preset'
                 : feature.type === 'climate-swing-horizontal-modes'
                   ? 'swing-horizontal'
                   : feature.type === 'water-heater-operation-modes'
                     ? 'operation'
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
      case 'water-heater-away-mode':
        inner = html`
          <mt-text-field
            label="Title (optional)"
            .value=${feature.label ?? ''}
            @value-changed=${(e: CustomEvent<{ value: string }>) => onChange(new CustomEvent('feature-changed', { detail: { feature: { ...feature, label: e.detail.value || undefined } } }))}
          ></mt-text-field>
          ${this._labeledField('Display', html`<mt-display-toggle
            .value=${feature.display ?? 'icons'}
            .options=${[
              { value: 'icons', label: 'Icons', icon: 'mdi:dots-grid' },
              { value: 'tile', label: 'Tile', icon: 'mdi:card-text-outline' },
            ]}
            @value-changed=${(e: CustomEvent<{ value: 'icons' | 'tile' }>) => onChange(new CustomEvent('feature-changed', { detail: { feature: { ...feature, display: e.detail.value } } }))}
          ></mt-display-toggle>`)}
          <mt-width-field
            .hass=${this.hass}
            .value=${feature.width}
            @width-changed=${(e: CustomEvent<{ value: number | undefined }>) => onChange(new CustomEvent('feature-changed', { detail: { feature: { ...feature, width: e.detail.value } } }))}
          ></mt-width-field>
        `;
        break;
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

  static styles = [tokens, css`
    :host {
      display: block;
      container-type: inline-size;
    }
    ha-expansion-panel {
      --ha-card-border-radius: var(--ha-border-radius-lg, 12px);
      --expansion-panel-border-radius: var(--ha-border-radius-lg, 12px);
    }
    .panel-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .panel-header ha-icon {
      --mdc-icon-size: 24px;
    }
    .fields {
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-width: 0;
      padding: 12px;
    }
    .field-row {
      display: grid;
      gap: 12px;
      min-width: 0;
    }
    .field-column {
      display: flex;
      flex-direction: column;
      gap: 8px;
      color: var(--mt-on-surface-variant);
    }
    .field-row > * {
      min-width: 0;
    }
    .halves {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    @container (width < 480px) {
      .field-row {
        grid-template-columns: minmax(0, 1fr);
      }
    }
    .editor {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .features-header {
      font-weight: 500;
      color: var(--mt-on-surface);
    }
    .features {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .feature {
      border: 1px solid var(--mt-outline-variant);
      border-radius: var(--mt-shape-chip-square);
      /* visible (not hidden) so a feature's icon-picker popover can extend past
         the card edge instead of being clipped inside it */
      overflow: visible;
      background: var(--mt-surface-container);
    }
    .feature-head {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
    }
    .handle {
      cursor: grab;
      color: var(--mt-on-surface-variant);
      display: grid;
      place-items: center;
      min-width: 44px;
      min-height: 44px;
      flex-shrink: 0;
    }
    .feature-title {
      flex: 1;
      min-width: 0;
      color: var(--mt-on-surface);
      overflow-wrap: anywhere;
    }
    .icon-btn {
      width: 44px;
      height: 44px;
      flex-shrink: 0;
      border: none;
      background: transparent;
      border-radius: var(--mt-shape-full);
      color: var(--mt-on-surface-variant);
      cursor: pointer;
    }
    button {
      font: inherit;
    }
    button:hover {
      background: var(--mt-surface-container-highest);
    }
    button:focus-visible,
    .handle:focus-visible {
      outline: 2px solid var(--mt-primary);
      outline-offset: 2px;
    }
    .feature-editor {
      padding: 8px 12px 12px;
      border-top: 1px solid var(--mt-outline-variant);
    }
    .hint {
      color: var(--mt-on-surface-variant);
      font-size: 13px;
      margin: 0;
      overflow-wrap: anywhere;
    }
    .add {
      position: relative;
    }
    .add-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-height: 44px;
      padding: 10px 18px;
      border: none;
      border-radius: var(--mt-shape-full);
      background: var(--mt-primary);
      color: var(--mt-on-primary);
      cursor: pointer;
      font: inherit;
      font-weight: 500;
    }
    .add-btn:hover {
      background: var(--mt-primary);
      filter: brightness(0.95);
    }
    .add-btn ha-icon {
      --mdc-icon-size: 18px;
    }
    .add-menu {
      margin-top: 8px;
      display: flex;
      flex-direction: column;
      background: var(--mt-surface);
      border: 1px solid var(--mt-outline-variant);
      border-radius: var(--mt-shape-chip-square);
      overflow: hidden;
    }
    .add-opt {
      display: flex;
      align-items: center;
      gap: 8px;
      min-height: 44px;
      text-align: left;
      padding: 12px 16px;
      border: none;
      background: transparent;
      color: var(--mt-on-surface);
      cursor: pointer;
      font: inherit;
    }
  `];
}

declare global {
  interface HTMLElementTagNameMap {
    'material-thermostat-card-editor': MaterialThermostatCardEditor;
  }
}
