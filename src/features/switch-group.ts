import { LitElement, html, nothing, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import type { EntityItem, FeatureDisplay, SelectorItem } from '../types';
import './selector-row';

/**
 * A mutually-exclusive group of switches that behaves like the climate
 * selectors: the currently-on switch is "selected". Picking another switch
 * turns the others off first, then turns on the selected one (off before on).
 */
@customElement('mt-switch-group')
export class MtSwitchGroup extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ attribute: false }) entities: EntityItem[] = [];
  @property() display: FeatureDisplay = 'icons';
  @property() label?: string;

  /** Build selector items from the configured switch entities. */
  private _build(): SelectorItem[] {
    return (this.entities ?? [])
      .filter((e) => e.entity)
      .map((e) => {
        const state = this.hass?.states?.[e.entity];
        return {
          value: e.entity,
          label: e.label ?? state?.attributes.friendly_name ?? e.entity,
          icon: e.icon ?? state?.attributes.icon,
          active: state?.state === 'on',
          disabled: !state || state.state === 'unavailable',
        };
      });
  }

  /**
   * Turn off every other on switch, then turn on the selected one.
   * @param e selector-row's item-selected event
   */
  private async _onSelect(e: CustomEvent): Promise<void> {
    const value = e.detail.value;
    const others = (this.entities ?? [])
      .map((en) => en.entity)
      .filter((id) => id && id !== value && this.hass.states[id]?.state === 'on');
    if (others.length) {
      await this.hass.callService('homeassistant', 'turn_off', { entity_id: others });
    }
    await this.hass.callService('homeassistant', 'turn_on', { entity_id: value });
  }

  protected render(): TemplateResult | typeof nothing {
    const items = this._build();
    if (!items.length) return nothing;
    return html`<mt-selector-row
      .items=${items}
      display=${this.display}
      .label=${this.label}
      @item-selected=${this._onSelect}
    ></mt-selector-row>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mt-switch-group': MtSwitchGroup;
  }
}
