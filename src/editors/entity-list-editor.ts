import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import type { EntityItem, FeatureConfig } from '../types';
import './display-toggle';
import './width-field';
import './icon-field';

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
    // `undefined` = unset (use the default icon); '' = explicit "no icon" (kept).
    if (merged.icon === undefined) delete merged.icon;
    items[index] = merged;
    this._setItems(items);
  }

  private _addItem(): void {
    this._setItems([...this._items, { entity: '' }]);
  }

  /**
   * Reorder items after a drag.
   * @param e ha-sortable's item-moved event
   */
  private _moveItem(e: CustomEvent): void {
    // Nested inside the editor's features ha-sortable — stop the composed,
    // bubbling `item-moved` so it doesn't also reorder the outer feature.
    e.stopPropagation();
    const { oldIndex, newIndex } = e.detail;
    const items = [...this._items];
    const [moved] = items.splice(oldIndex, 1);
    items.splice(newIndex, 0, moved);
    this._setItems(items);
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
          .hass=${this.hass}
          .value=${(this.feature as { width?: number }).width}
          @width-changed=${(e: CustomEvent) => this._emit({ width: e.detail.value })}
        ></mt-width-field>

        <ha-sortable handle-selector=".handle" @item-moved=${this._moveItem}>
          <div class="items">
            ${this._items.map((item, index) => {
              const defaultIcon = this.hass?.states?.[item.entity]?.attributes?.icon;
              return html`<div class="item">
                <div class="handle"><ha-icon icon="mdi:drag"></ha-icon></div>
                <div class="body">
                  <ha-entity-picker
                    .hass=${this.hass}
                    .value=${item.entity ?? ''}
                    .includeDomains=${this.includeDomains}
                    allow-custom-entity
                    @value-changed=${(e: CustomEvent) =>
                      this._updateItem(index, { entity: e.detail.value })}
                  ></ha-entity-picker>
                  <div class="row2">
                    <mt-icon-field
                      .hass=${this.hass}
                      .value=${item.icon}
                      .defaultIcon=${defaultIcon}
                      @value-changed=${(e: CustomEvent) =>
                        this._updateItem(index, { icon: e.detail.value })}
                    ></mt-icon-field>
                    <ha-textfield
                      class="title-field"
                      label="Custom title"
                      .value=${item.label ?? ''}
                      @input=${(e: any) => this._updateItem(index, { label: e.target.value })}
                    ></ha-textfield>
                  </div>
                </div>
                <button class="del" title="Remove" @click=${() => this._removeItem(index)}>
                  <ha-icon icon="mdi:close"></ha-icon>
                </button>
              </div>`;
            })}
          </div>
        </ha-sortable>

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
      gap: 8px;
    }
    /* Two lines per item: entity picker on top, then the icon pill + custom
       title below. The drag handle and delete button flank both lines. */
    .item {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 8px;
      padding: 8px;
      border-radius: 12px;
      background: var(--md-sys-color-surface-container-high, var(--secondary-background-color));
    }
    .body {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 0;
    }
    .row2 {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .title-field {
      flex: 1;
      min-width: 0;
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
