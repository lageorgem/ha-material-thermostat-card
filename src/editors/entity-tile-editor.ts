import { LitElement, html, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import type { EntityTileFeatureConfig } from '../types';

interface FormSchemaItem {
  name: string;
  selector: Record<string, unknown>;
}

const SCHEMA: FormSchemaItem[] = [
  { name: 'entity', selector: { entity: {} } },
  { name: 'name', selector: { text: {} } },
  { name: 'icon', selector: { icon: {} } },
  { name: 'compact', selector: { boolean: {} } },
  {
    name: 'width',
    selector: { number: { min: 60, max: 400, step: 10, mode: 'slider', unit_of_measurement: 'px' } },
  },
  { name: 'tap_action', selector: { ui_action: {} } },
];

/**
 * Editor for the entity-tile feature: entity, name, icon, and tap action,
 * rendered with a single `ha-form` (using HA's built-in icon and action
 * selectors).
 */
@customElement('mt-entity-tile-editor')
export class MtEntityTileEditor extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ attribute: false }) feature!: EntityTileFeatureConfig;

  private get _data() {
    return {
      entity: this.feature.entity,
      name: this.feature.name,
      icon: this.feature.icon,
      compact: this.feature.compact ?? false,
      width: this.feature.width,
      tap_action: this.feature.tap_action,
    };
  }

  /**
   * Field label resolver for the form.
   * @param s the schema item
   */
  private _computeLabel = (s: FormSchemaItem): string => {
    switch (s.name) {
      case 'entity':
        return 'Entity';
      case 'name':
        return 'Name (optional)';
      case 'icon':
        return 'Icon (optional)';
      case 'compact':
        return 'Compact (icon + value only)';
      case 'width':
        return 'Max width';
      case 'tap_action':
        return 'Tap action';
      default:
        return s.name;
    }
  };

  /**
   * Merge form changes into the feature config.
   * @param e ha-form's value-changed event
   */
  private _changed(e: CustomEvent): void {
    const d = e.detail.value;
    this.dispatchEvent(
      new CustomEvent('feature-changed', {
        detail: {
          feature: {
            type: 'entity-tile',
            entity: d.entity,
            name: d.name || undefined,
            icon: d.icon || undefined,
            compact: d.compact || undefined,
            width: d.width || undefined,
            tap_action: d.tap_action || undefined,
          } as EntityTileFeatureConfig,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  protected render(): TemplateResult {
    return html`<ha-form
      .hass=${this.hass}
      .data=${this._data}
      .schema=${SCHEMA}
      .computeLabel=${this._computeLabel}
      @value-changed=${this._changed}
    ></ha-form>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mt-entity-tile-editor': MtEntityTileEditor;
  }
}
