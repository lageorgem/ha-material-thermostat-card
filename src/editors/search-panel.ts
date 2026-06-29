import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

const MAX_RESULTS = 50;

/** A selectable row for {@link MtSearchPanel}. */
export interface SearchItem {
  /** The value emitted when picked (entity id, `mdi:icon`, …). */
  value: string;
  /** Main label. */
  primary: string;
  /** Sub label (e.g. the entity id). */
  secondary?: string;
  /** Leading icon. */
  icon?: string;
  /** Extra search terms (not displayed). */
  keywords?: string[];
}

/**
 * The shared dropdown body used by {@link MtEntityPicker} and the icon field: a
 * search box on top and a filtered, scrollable list of {@link SearchItem}s
 * below — matching the card's rounded editor aesthetic. It does NOT manage its
 * own open/close or position; the parent renders it (absolutely positioned)
 * while open and listens for `pick` (`{ value }`) / `dismiss`.
 */
@customElement('mt-search-panel')
export class MtSearchPanel extends LitElement {
  @property({ attribute: false }) items: SearchItem[] = [];
  @property() value = '';
  @property() placeholder = 'Search…';
  /** Allow committing a typed value that isn't in the list. */
  @property({ type: Boolean }) allowCustom = false;
  /** Prefix applied to a bare typed value when committing custom (e.g. `mdi:`). */
  @property() customPrefix = '';

  @state() private _query = '';

  @query('.search') private _searchInput?: HTMLInputElement;

  protected firstUpdated(): void {
    /* c8 ignore next -- the search box is always in the panel's DOM */
    this._searchInput?.focus();
  }

  /** The candidates matching the current query (capped). */
  private _filtered(): SearchItem[] {
    const q = this._query.trim().toLowerCase();
    if (!q) return this.items.slice(0, MAX_RESULTS);
    return this.items
      .filter(
        (it) =>
          it.value.toLowerCase().includes(q) ||
          it.primary.toLowerCase().includes(q) ||
          (it.secondary?.toLowerCase().includes(q) ?? false) ||
          (it.keywords?.some((k) => k.toLowerCase().includes(q)) ?? false)
      )
      .slice(0, MAX_RESULTS);
  }

  /** The value a "use typed" row would commit. */
  private _customValue(): string {
    const q = this._query.trim();
    return this.customPrefix && !q.includes(':') ? this.customPrefix + q : q;
  }

  /**
   * Emit the chosen value to the parent.
   * @param value the picked value
   */
  private _pick(value: string): void {
    this.dispatchEvent(
      new CustomEvent('pick', { detail: { value }, bubbles: true, composed: true })
    );
  }

  /**
   * Escape closes; Enter commits a typed custom value when allowed.
   * @param e the keyboard event
   */
  private _onKey(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.stopPropagation();
      this.dispatchEvent(new CustomEvent('dismiss', { bubbles: true, composed: true }));
    } else if (e.key === 'Enter' && this.allowCustom && this._query.trim()) {
      this._pick(this._customValue());
    }
  }

  protected render(): TemplateResult {
    const results = this._filtered();
    const custom = this._customValue();
    const showCustom =
      this.allowCustom && this._query.trim().length > 0 && !results.some((r) => r.value === custom);
    return html`
      <input
        class="search"
        type="text"
        placeholder=${this.placeholder}
        .value=${this._query}
        @input=${(e: Event) => (this._query = (e.target as HTMLInputElement).value)}
        @keydown=${this._onKey}
      />
      <div class="results" role="listbox">
        ${results.map(
          (it) => html`<button
            type="button"
            class=${classMap({ opt: true, active: it.value === this.value })}
            role="option"
            @click=${() => this._pick(it.value)}
          >
            ${it.icon ? html`<ha-icon icon=${it.icon}></ha-icon>` : nothing}
            <span class="opt-text">
              <span class="opt-name">${it.primary}</span>
              ${it.secondary ? html`<span class="opt-sub">${it.secondary}</span>` : nothing}
            </span>
          </button>`
        )}
        ${showCustom
          ? html`<button type="button" class="opt custom" @click=${() => this._pick(custom)}>
              <ha-icon icon=${this.customPrefix ? custom : 'mdi:plus'}></ha-icon>
              <span class="opt-text"><span class="opt-name">Use “${custom}”</span></span>
            </button>`
          : nothing}
        ${results.length === 0 && !showCustom
          ? html`<div class="empty">No matches</div>`
          : nothing}
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }
    .search {
      width: 100%;
      box-sizing: border-box;
      height: 38px;
      padding: 0 12px;
      margin-bottom: 6px;
      border-radius: var(--md-sys-shape-corner-full, 9999px);
      border: 1px solid var(--md-sys-color-outline-variant, var(--divider-color));
      background: var(--md-sys-color-surface-container, var(--card-background-color));
      color: var(--md-sys-color-on-surface, var(--primary-text-color));
      font: inherit;
      font-size: 14px;
      outline: none;
    }
    .search:focus {
      border-color: var(--md-sys-color-primary, var(--primary-color));
    }
    .results {
      max-height: 240px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .opt {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 8px 10px;
      border: none;
      background: transparent;
      color: var(--md-sys-color-on-surface, var(--primary-text-color));
      border-radius: 10px;
      cursor: pointer;
      font: inherit;
      text-align: left;
    }
    .opt:hover {
      background: color-mix(in srgb, currentColor 8%, transparent);
    }
    .opt.active {
      background: var(--md-sys-color-secondary-container, rgba(127, 127, 127, 0.18));
    }
    .opt ha-icon {
      --mdc-icon-size: 20px;
      flex: 0 0 auto;
      color: var(--md-sys-color-on-surface-variant, var(--secondary-text-color));
    }
    .opt-text {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .opt-name {
      font-size: 14px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .opt-sub {
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant, var(--secondary-text-color));
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .empty {
      padding: 10px;
      color: var(--md-sys-color-on-surface-variant, var(--secondary-text-color));
      font-size: 13px;
      text-align: center;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'mt-search-panel': MtSearchPanel;
  }
}
