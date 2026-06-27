import { LitElement, html, css, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import type { EntityTileFeatureConfig } from '../types';
import { TILE_DEFAULT_PCT } from '../grid';
import './width-field';

interface FormSchemaItem {
  name: string;
  selector: Record<string, unknown>;
}

const SCHEMA: FormSchemaItem[] = [
  { name: 'entity', selector: { entity: {} } },
  { name: 'name', selector: { text: {} } },
  { name: 'icon', selector: { icon: {} } },
  { name: 'compact', selector: { boolean: {} } },
  { name: 'tap_action', selector: { ui_action: {} } },
];

/**
 * Editor for the entity-tile feature: entity, name, icon, tap action (via a
 * single `ha-form`), plus the shared width slider (`mt-width-field`).
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
      case 'tap_action':
        return 'Tap action';
      default:
        return s.name;
    }
  };

  /**
   * Emit a patched feature config.
   * @param patch fields to merge
   */
  private _emit(patch: Partial<EntityTileFeatureConfig>): void {
    this.dispatchEvent(
      new CustomEvent('feature-changed', {
        detail: { feature: { ...this.feature, ...patch } },
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Merge form changes into the feature config.
   * @param e ha-form's value-changed event
   */
  private _changed(e: CustomEvent): void {
    const d = e.detail.value;
    this._emit({
      entity: d.entity,
      name: d.name || undefined,
      icon: d.icon || undefined,
      compact: d.compact || undefined,
      tap_action: d.tap_action || undefined,
    });
  }

  protected render(): TemplateResult {
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${this._data}
        .schema=${SCHEMA}
        .computeLabel=${this._computeLabel}
        @value-changed=${this._changed}
      ></ha-form>
      <mt-width-field
        .hass=${this.hass}
        .value=${this.feature.width}
        .default=${TILE_DEFAULT_PCT}
        @width-changed=${(e: CustomEvent) => this._emit({ width: e.detail.value })}
      ></mt-width-field>
    `;
  }

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'mt-entity-tile-editor': MtEntityTileEditor;
  }
}
