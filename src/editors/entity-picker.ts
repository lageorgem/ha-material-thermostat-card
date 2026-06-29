import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import type { HomeAssistant } from 'custom-card-helpers';

const MAX_RESULTS = 50;

/** Default leading glyph by domain, so each row reads at a glance. */
const DOMAIN_ICON: Record<string, string> = {
  sensor: 'mdi:gauge',
  binary_sensor: 'mdi:radiobox-marked',
  switch: 'mdi:toggle-switch-variant',
  light: 'mdi:lightbulb',
  fan: 'mdi:fan',
  input_boolean: 'mdi:toggle-switch',
  input_select: 'mdi:format-list-bulleted',
  button: 'mdi:gesture-tap-button',
  input_button: 'mdi:gesture-tap-button',
  scene: 'mdi:palette',
  script: 'mdi:script-text',
  climate: 'mdi:thermostat',
};

interface EntityRow {
  id: string;
  name: string;
  icon: string;
}

/**
 * A compact, rounded entity picker that matches the editor's pill aesthetic
 * (same height/shape as {@link MtIconField}). Clicking the trigger opens a
 * single dropdown panel with a search box on top and the matching entities
 * below — no big stock combobox, no nested popups. Emits `value-changed`
 * (`{ value }`, bubbles+composed) like `ha-entity-picker`, so editors swap it in
 * with no other changes.
 */
@customElement('mt-entity-picker')
export class MtEntityPicker extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property() value = '';
  @property() label = 'Entity';
  /** Restrict the candidates to these domains. */
  @property({ attribute: false }) includeDomains?: string[];
  /** Allow committing a typed value that isn't a known entity. */
  @property({ type: Boolean }) allowCustom = false;

  @state() private _open = false;
  @state() private _query = '';

  @query('.search') private _searchInput?: HTMLInputElement;

  connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('click', this._onDocClick);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('click', this._onDocClick);
  }

  /** Close when clicking anywhere outside this element. */
  private _onDocClick = (e: MouseEvent): void => {
    if (this._open && !e.composedPath().includes(this)) this._open = false;
  };

  /** Candidate entities (filtered by domain), sorted by name. */
  private _entities(): EntityRow[] {
    const states = this.hass?.states ?? {};
    return Object.keys(states)
      .filter((id) => !this.includeDomains || this.includeDomains.includes(id.split('.')[0]))
      .map((id) => {
        const a = states[id].attributes;
        return {
          id,
          name: (a.friendly_name as string) ?? id,
          icon: (a.icon as string) ?? DOMAIN_ICON[id.split('.')[0]] ?? 'mdi:tag',
        };
      })
      .sort((x, y) => x.name.localeCompare(y.name));
  }

  /** The candidates matching the current search query (capped). */
  private _filtered(): EntityRow[] {
    const q = this._query.trim().toLowerCase();
    const list = q
      ? this._entities().filter(
          (e) => e.id.toLowerCase().includes(q) || e.name.toLowerCase().includes(q)
        )
      : this._entities();
    return list.slice(0, MAX_RESULTS);
  }

  /** The row to render in the (closed) trigger for the current value. */
  private _selected(): EntityRow | undefined {
    if (!this.value) return undefined;
    const a = this.hass?.states?.[this.value]?.attributes;
    return {
      id: this.value,
      name: (a?.friendly_name as string) ?? this.value,
      icon: (a?.icon as string) ?? DOMAIN_ICON[this.value.split('.')[0]] ?? 'mdi:tag',
    };
  }

  /**
   * Toggle the dropdown; focus the search box when opening.
   * @param e the click event
   */
  private _toggle(e: Event): void {
    e.stopPropagation();
    this._open = !this._open;
    if (this._open) {
      this._query = '';
      this.updateComplete.then(() => {
        /* c8 ignore next -- the search box is always in the DOM once the panel opens */
        this._searchInput?.focus();
      });
    }
  }

  /**
   * Commit a selected value and close.
   * @param value the chosen entity id
   */
  private _pick(value: string): void {
    this._open = false;
    this.dispatchEvent(
      new CustomEvent('value-changed', { detail: { value }, bubbles: true, composed: true })
    );
  }

  /**
   * Search box keystrokes: Escape closes; Enter commits a typed value when
   * custom entities are allowed.
   * @param e the keyboard event
   */
  private _onKey(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.stopPropagation();
      this._open = false;
    } else if (e.key === 'Enter' && this.allowCustom && this._query.trim()) {
      this._pick(this._query.trim());
    }
  }

  protected render(): TemplateResult {
    const sel = this._selected();
    const q = this._query.trim();
    const results = this._filtered();
    const showCustom =
      this.allowCustom && q.length > 0 && !results.some((r) => r.id === q);
    return html`
      <button
        type="button"
        class=${classMap({ trigger: true, open: this._open })}
        aria-haspopup="listbox"
        aria-expanded=${this._open ? 'true' : 'false'}
        @click=${this._toggle}
      >
        ${sel
          ? html`<ha-icon class="lead" icon=${sel.icon}></ha-icon>
              <span class="text">${sel.name}</span>`
          : html`<span class="text muted">${this.label}</span>`}
        <ha-icon class="chev" icon="mdi:chevron-down"></ha-icon>
      </button>
      ${this._open
        ? html`<div class="panel" role="listbox">
            <input
              class="search"
              type="text"
              placeholder="Search entities…"
              .value=${this._query}
              @input=${(e: Event) => (this._query = (e.target as HTMLInputElement).value)}
              @keydown=${this._onKey}
            />
            <div class="results">
              ${results.map(
                (r) => html`<button
                  type="button"
                  class=${classMap({ opt: true, active: r.id === this.value })}
                  role="option"
                  @click=${() => this._pick(r.id)}
                >
                  <ha-icon icon=${r.icon}></ha-icon>
                  <span class="opt-text">
                    <span class="opt-name">${r.name}</span>
                    <span class="opt-id">${r.id}</span>
                  </span>
                </button>`
              )}
              ${showCustom
                ? html`<button type="button" class="opt custom" @click=${() => this._pick(q)}>
                    <ha-icon icon="mdi:plus"></ha-icon>
                    <span class="opt-text"><span class="opt-name">Use “${q}”</span></span>
                  </button>`
                : nothing}
              ${results.length === 0 && !showCustom
                ? html`<div class="empty">No matching entities</div>`
                : nothing}
            </div>
          </div>`
        : nothing}
    `;
  }

  static styles = css`
    :host {
      display: block;
      position: relative;
    }
    .trigger {
      width: 100%;
      box-sizing: border-box;
      height: 40px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 10px 0 14px;
      border-radius: var(--md-sys-shape-corner-full, 9999px);
      border: 1px solid var(--md-sys-color-outline-variant, var(--divider-color));
      background: var(--md-sys-color-surface-container-high, var(--secondary-background-color));
      color: var(--md-sys-color-on-surface, var(--primary-text-color));
      cursor: pointer;
      font: inherit;
      font-size: 14px;
      -webkit-tap-highlight-color: transparent;
    }
    .trigger .lead {
      --mdc-icon-size: 20px;
      flex: 0 0 auto;
      color: var(--md-sys-color-on-surface-variant, var(--secondary-text-color));
    }
    .trigger .text {
      flex: 1;
      text-align: left;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .trigger .text.muted {
      color: var(--md-sys-color-on-surface-variant, var(--secondary-text-color));
    }
    .trigger .chev {
      flex: 0 0 auto;
      --mdc-icon-size: 20px;
      color: var(--md-sys-color-on-surface-variant, var(--secondary-text-color));
      transition: transform 150ms cubic-bezier(0.2, 0, 0, 1);
    }
    .trigger.open .chev {
      transform: rotate(180deg);
    }
    .panel {
      position: absolute;
      z-index: 30;
      top: calc(100% + 6px);
      left: 0;
      right: 0;
      padding: 8px;
      background: var(--md-sys-color-surface-container-high, var(--card-background-color, #fff));
      border: 1px solid var(--md-sys-color-outline-variant, var(--divider-color));
      border-radius: 16px;
      box-shadow:
        0 4px 12px rgba(0, 0, 0, 0.3),
        0 1px 3px rgba(0, 0, 0, 0.2);
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
    .opt-id {
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
    'mt-entity-picker': MtEntityPicker;
  }
}
