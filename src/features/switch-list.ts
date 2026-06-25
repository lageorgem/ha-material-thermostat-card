import { LitElement, html, nothing, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import type { EntityItem, SelectorItem } from '../types';
import './selector-row';

/**
 * A row of independent switches shown like the climate selectors (icon mode),
 * but each chip reflects and toggles its own switch — multiple can be on at
 * once. Unlike the group, switches are toggled independently.
 */
@customElement('mt-switch-list')
export class MtSwitchList extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ attribute: false }) entities: EntityItem[] = [];
  @property() label?: string;

  /** Build a chip per switch, active when that switch is on. */
  private _build(): SelectorItem[] {
    return (this.entities ?? [])
      .filter((e) => e.entity)
      .map((e) => {
        const state = this.hass?.states?.[e.entity];
        return {
          value: e.entity,
          label: e.label ?? state?.attributes.friendly_name ?? e.entity,
          icon: e.icon ?? state?.attributes.icon ?? 'mdi:toggle-switch-variant',
          active: state?.state === 'on',
          disabled: !state || state.state === 'unavailable',
        };
      });
  }

  /**
   * Toggle the clicked switch independently.
   * @param e selector-row's item-selected event
   */
  private _onSelect(e: CustomEvent): void {
    this.hass.callService('homeassistant', 'toggle', { entity_id: e.detail.value });
  }

  protected render(): TemplateResult | typeof nothing {
    const items = this._build();
    if (!items.length) return nothing;
    return html`<mt-selector-row
      .items=${items}
      display="icons"
      .label=${this.label}
      @item-selected=${this._onSelect}
    ></mt-selector-row>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mt-switch-list': MtSwitchList;
  }
}
