import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import type { HomeAssistant } from 'custom-card-helpers';
import './search-panel';
import type { SearchItem } from './search-panel';

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

/**
 * A compact, rounded entity picker that matches the editor's pill aesthetic
 * (same height/shape as {@link MtIconField}). Clicking the trigger opens a
 * single {@link MtSearchPanel} (search box + domain-filtered list from
 * `hass.states`) — no bulky stock combobox, no nested popups. Emits
 * `value-changed` (`{ value }`, bubbles+composed) like `ha-entity-picker`, so
 * editors swap it in with no other changes.
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
  /** Offer a separate action to remove the current selection. */
  @property({ type: Boolean }) clearable = false;

  @state() private _open = false;

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

  /** The icon for an entity: its own, else a domain default, else a generic tag. */
  private _iconFor(id: string, ownIcon?: string): string {
    return ownIcon ?? DOMAIN_ICON[id.split('.')[0]] ?? 'mdi:tag';
  }

  /** Candidate entities (filtered by domain), sorted by name, as search items. */
  private _items(): SearchItem[] {
    const states = this.hass?.states ?? {};
    return Object.keys(states)
      .filter((id) => !this.includeDomains || this.includeDomains.includes(id.split('.')[0]))
      .map((id) => {
        const a = states[id].attributes;
        return {
          value: id,
          primary: (a.friendly_name as string) ?? id,
          secondary: id,
          icon: this._iconFor(id, a.icon as string | undefined),
        };
      })
      .sort((x, y) => x.primary.localeCompare(y.primary));
  }

  /** The row shown in the (closed) trigger for the current value. */
  private _selected(): { name: string; icon: string } | undefined {
    if (!this.value) return undefined;
    const a = this.hass?.states?.[this.value]?.attributes;
    return {
      name: (a?.friendly_name as string) ?? this.value,
      icon: this._iconFor(this.value, a?.icon as string | undefined),
    };
  }

  /**
   * Toggle the dropdown.
   * @param e the click event
   */
  private _toggle(e: Event): void {
    e.stopPropagation();
    this._open = !this._open;
  }

  /**
   * Commit a selected value and close.
   * @param e the panel's pick event
   */
  private _onPick(e: CustomEvent): void {
    this._open = false;
    this.dispatchEvent(
      new CustomEvent('value-changed', {
        detail: { value: e.detail.value },
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Clear the selection without toggling the dropdown.
   * @param e the clear button's click event
   */
  private _clear(e: Event): void {
    e.stopPropagation();
    this._onPick(new CustomEvent('pick', { detail: { value: '' } }));
  }

  protected render(): TemplateResult {
    const sel = this._selected();
    return html`
      <div class=${classMap({ 'trigger-row': true, open: this._open })} @click=${this._toggle}>
      <button
        type="button"
        class="trigger"
        aria-label=${this.label || nothing}
        aria-haspopup="listbox"
        aria-expanded=${this._open ? 'true' : 'false'}
        @click=${this._toggle}
      >
        ${sel
          ? html`<ha-icon class="lead" icon=${sel.icon}></ha-icon>
              <span class="text">${sel.name}</span>`
          : html`<span class="text muted">${this.label}</span>`}
      </button>
      ${this.clearable && this.value
        ? html`<button type="button" class="clear" aria-label=${`Clear ${this.label}`} @click=${this._clear}>
            <ha-icon icon="mdi:close"></ha-icon>
          </button>`
        : nothing}
      <ha-icon class="chev" icon="mdi:chevron-down" aria-hidden="true"></ha-icon>
      </div>
      ${this._open
        ? html`<div class="panel">
            <mt-search-panel
              .items=${this._items()}
              .value=${this.value}
              .allowCustom=${this.allowCustom}
              placeholder="Search entities…"
              @pick=${this._onPick}
              @dismiss=${() => (this._open = false)}
            ></mt-search-panel>
          </div>`
        : nothing}
    `;
  }

  static styles = css`
    :host {
      display: block;
      position: relative;
    }
    .trigger-row {
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
    .trigger {
      display: flex;
      align-items: center;
      gap: inherit;
      flex: 1;
      min-width: 0;
      height: 100%;
      padding: 0;
      border: 0;
      background: transparent;
      color: inherit;
      font: inherit;
      cursor: pointer;
      border-radius: inherit;
    }
    .clear {
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 32px;
      height: 32px;
      padding: 0;
      border: 0;
      border-radius: var(--md-sys-shape-corner-full, 9999px);
      background: transparent;
      color: var(--md-sys-color-on-surface-variant, var(--secondary-text-color));
      cursor: pointer;
      --mdc-icon-size: 20px;
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
    .trigger-row .chev {
      flex: 0 0 auto;
      --mdc-icon-size: 20px;
      color: var(--md-sys-color-on-surface-variant, var(--secondary-text-color));
      transition: transform 150ms cubic-bezier(0.2, 0, 0, 1);
    }
    .trigger-row.open .chev {
      transform: rotate(180deg);
    }
    .panel {
      position: absolute;
      z-index: 30;
      top: calc(100% + 6px);
      left: 0;
      right: 0;
      padding: 8px;
      box-sizing: border-box;
      background: var(--md-sys-color-surface-container-high, var(--card-background-color, #fff));
      border: 1px solid var(--md-sys-color-outline-variant, var(--divider-color));
      border-radius: 16px;
      box-shadow:
        0 4px 12px rgba(0, 0, 0, 0.3),
        0 1px 3px rgba(0, 0, 0, 0.2);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'mt-entity-picker': MtEntityPicker;
  }
}
