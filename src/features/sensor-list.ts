import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import type { EntityItem } from '../types';
import { tokens } from '../theme';

/**
 * A read-only sensor list rendered like the Google Home app: ONE rounded
 * container holding a row per sensor — a (customizable) title and the entity's
 * current value, with the value bolder than the title and both in a compact
 * size. An icon is optional and opt-in: when set it sits inline, the same height
 * as the text, with no circle/padding/outline.
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
      <div class="card">
        ${items.map((item) => {
          const state = this.hass?.states?.[item.entity];
          const name = item.label ?? state?.attributes.friendly_name ?? item.entity;
          return html`<div class="row">
            ${item.icon
              ? html`<ha-icon class="icon" icon=${item.icon}></ha-icon>`
              : nothing}
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
      /* One container for all sensors (à la Google Home), large M3 radius. */
      .card {
        background: var(--mt-surface-container);
        border-radius: var(--mt-shape-card);
        padding: 6px 0;
        overflow: hidden;
      }
      .row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 20px;
      }
      .icon {
        flex: 0 0 auto;
        /* same height as the text, no circle/padding/outline */
        --mdc-icon-size: 18px;
        color: var(--mt-on-surface-variant);
        display: inline-flex;
        align-items: center;
      }
      .title {
        flex: 1;
        min-width: 0;
        font-size: var(--md-sys-typescale-body-medium-size, 14px);
        font-weight: 400;
        color: var(--mt-on-surface-variant);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .val {
        flex: 0 0 auto;
        font-size: var(--md-sys-typescale-body-medium-size, 14px);
        font-weight: 700;
        color: var(--mt-on-surface);
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
