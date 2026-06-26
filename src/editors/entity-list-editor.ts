import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import type { EntityItem, FeatureConfig } from '../types';
import './display-toggle';
import './width-field';

/**
 * Shared editor for features backed by a list of entities: switch group,
 * switch list, and button list. Edits a `label`, an optional `display`
 * (groups only), and a list of `{ entity, label?, icon? }` rows.
 */
@customElement('mt-entity-list-editor')
export class MtEntityListEditor extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ attribute: false }) feature!: FeatureConfig;
  /** Which config key holds the list ('entities' or 'items'). */
  @property() itemsKey: 'entities' | 'items' = 'entities';
  /** Whether to show the icon/dropdown display toggle (switch group only). */
  @property({ type: Boolean }) showDisplay = false;
  /** Domains to restrict the entity pickers to. */
  @property({ attribute: false }) includeDomains?: string[];

  private get _items(): EntityItem[] {
    return ((this.feature as any)[this.itemsKey] as EntityItem[]) ?? [];
  }

  /**
   * Emit a patched feature config.
   * @param patch partial feature to merge
   */
  private _emit(patch: Record<string, unknown>): void {
    this.dispatchEvent(
      new CustomEvent('feature-changed', {
        detail: { feature: { ...this.feature, ...patch } },
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Persist the list of items.
   * @param items the updated items
   */
  private _setItems(items: EntityItem[]): void {
    this._emit({ [this.itemsKey]: items });
  }

  /**
   * Update one item, pruning empty label/icon.
   * @param index the item index
   * @param patch fields to set
   */
  private _updateItem(index: number, patch: Partial<EntityItem>): void {
    const items = [...this._items];
    const merged: EntityItem = { ...items[index], ...patch };
    if (merged.label === '') delete merged.label;
    if (merged.icon === '') delete merged.icon;
    items[index] = merged;
    this._setItems(items);
  }

  private _addItem(): void {
    this._setItems([...this._items, { entity: '' }]);
  }

  /**
   * Remove an item.
   * @param index the item index
   */
  private _removeItem(index: number): void {
    const items = [...this._items];
    items.splice(index, 1);
    this._setItems(items);
  }

  protected render(): TemplateResult {
    const display = (this.feature as any).display ?? 'icons';
    return html`
      <div class="editor">
        <ha-textfield
          label="Row label (optional)"
          .value=${(this.feature as any).label ?? ''}
          @input=${(e: any) => this._emit({ label: e.target.value || undefined })}
        ></ha-textfield>

        ${this.showDisplay
          ? html`<div class="field">
              <span class="field-label">Display</span>
              <mt-display-toggle
                .value=${display}
                @value-changed=${(e: CustomEvent) => this._emit({ display: e.detail.value })}
              ></mt-display-toggle>
            </div>`
          : nothing}

        <mt-width-field
          .value=${(this.feature as { width?: number }).width}
          @width-changed=${(e: CustomEvent) => this._emit({ width: e.detail.value })}
        ></mt-width-field>

        <div class="items">
          ${this._items.map(
            (item, index) => html`<div class="item">
              <ha-entity-picker
                .hass=${this.hass}
                .value=${item.entity ?? ''}
                .includeDomains=${this.includeDomains}
                allow-custom-entity
                @value-changed=${(e: CustomEvent) =>
                  this._updateItem(index, { entity: e.detail.value })}
              ></ha-entity-picker>
              <ha-textfield
                label="Label"
                .value=${item.label ?? ''}
                @input=${(e: any) => this._updateItem(index, { label: e.target.value })}
              ></ha-textfield>
              <ha-icon-picker
                .hass=${this.hass}
                .value=${item.icon ?? ''}
                @value-changed=${(e: CustomEvent) =>
                  this._updateItem(index, { icon: e.detail.value ?? '' })}
              ></ha-icon-picker>
              <button class="del" title="Remove" @click=${() => this._removeItem(index)}>
                <ha-icon icon="mdi:close"></ha-icon>
              </button>
            </div>`
          )}
        </div>

        <ha-button @click=${this._addItem}>
          <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
          Add entity
        </ha-button>
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
    .items {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .item {
      display: grid;
      grid-template-columns: 2fr 1.4fr auto auto;
      align-items: center;
      gap: 8px;
    }
    ha-icon-picker {
      width: 56px;
    }
    .del {
      width: 40px;
      height: 40px;
      border: none;
      background: transparent;
      border-radius: 50%;
      color: var(--secondary-text-color);
      cursor: pointer;
    }
    .del:hover {
      color: var(--error-color);
    }
    ha-button {
      align-self: flex-start;
      --mdc-theme-primary: var(--primary-color);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'mt-entity-list-editor': MtEntityListEditor;
  }
}
