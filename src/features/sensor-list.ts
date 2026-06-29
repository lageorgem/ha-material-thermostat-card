import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import type { EntityItem } from '../types';
import { tokens } from '../theme';

/**
 * A read-only list of sensor rows — an optional icon, a (customizable) title and
 * the entity's current value — laid out like the Google Home app's sensor list.
 * A lighter alternative to a stack of entity tiles when you just want to read
 * several values. Each row falls back to the entity's friendly name / icon when
 * no override is given.
 */
@customElement('mt-sensor-list')
export class MtSensorList extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ attribute: false }) items: EntityItem[] = [];
  @property() label?: string;

  /**
   * The displayed value for an entity: its state plus unit, or an em-dash when
   * the entity is missing/unknown.
   * @param item the configured entity row
   */
  private _value(item: EntityItem): string {
    const state = this.hass?.states?.[item.entity];
    if (!state || state.state === 'unknown' || state.state === 'unavailable') return '—';
    const unit = state.attributes.unit_of_measurement;
    return unit ? `${state.state} ${unit}` : state.state;
  }

  protected render(): TemplateResult | typeof nothing {
    const items = (this.items ?? []).filter((i) => i.entity);
    if (!items.length) return nothing;
    return html`
      ${this.label ? html`<div class="label">${this.label}</div>` : nothing}
      <div class="list">
        ${items.map((item) => {
          const state = this.hass?.states?.[item.entity];
          const name = item.label ?? state?.attributes.friendly_name ?? item.entity;
          const icon = item.icon ?? state?.attributes.icon ?? 'mdi:gauge';
          return html`<div class="row">
            <div class="ic"><ha-icon icon=${icon}></ha-icon></div>
            <div class="title" title=${name}>${name}</div>
            <div class="val">${this._value(item)}</div>
          </div>`;
        })}
      </div>
    `;
  }

  static styles = [
    tokens,
    css`
      :host {
        display: block;
      }
      .label {
        color: var(--mt-on-surface-variant);
        font-size: var(--md-sys-typescale-label-large-size, 13px);
        font-weight: 500;
        padding: 0 4px 6px;
      }
      .list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 16px;
        border-radius: var(--mt-shape-chip-square);
        background: var(--mt-surface-container);
        color: var(--mt-on-surface);
        min-height: 52px;
      }
      .ic {
        flex: 0 0 auto;
        width: 36px;
        height: 36px;
        border-radius: var(--mt-shape-full);
        display: grid;
        place-items: center;
        background: color-mix(in srgb, var(--mt-on-surface-variant) 14%, transparent);
        color: var(--mt-on-surface-variant);
      }
      .ic ha-icon {
        --mdc-icon-size: 20px;
      }
      .title {
        flex: 1;
        min-width: 0;
        font-size: var(--md-sys-typescale-body-large-size, 16px);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .val {
        flex: 0 0 auto;
        color: var(--mt-on-surface-variant);
        font-size: var(--md-sys-typescale-body-medium-size, 14px);
        white-space: nowrap;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'mt-sensor-list': MtSensorList;
  }
}
