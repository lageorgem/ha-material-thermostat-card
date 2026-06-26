import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import type { EntityTileFeatureConfig } from '../types';
import { tokens } from '../theme';
import { performTap } from '../actions';

const DOMAIN_ICONS: Record<string, string> = {
  sensor: 'mdi:gauge',
  binary_sensor: 'mdi:radiobox-marked',
  switch: 'mdi:toggle-switch-variant',
  light: 'mdi:lightbulb',
  fan: 'mdi:fan',
  button: 'mdi:gesture-tap-button',
  input_button: 'mdi:gesture-tap-button',
  scene: 'mdi:palette',
  script: 'mdi:script-text',
};

/**
 * A rounded tile (à la Google Home) for a sensor, switch, or button. Shows an
 * icon and title plus a secondary line (sensor value or on/off), and runs a
 * tap action (configurable, else the entity's natural action).
 */
@customElement('mt-entity-tile')
export class MtEntityTile extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ attribute: false }) config!: EntityTileFeatureConfig;

  private get _stateObj() {
    return this.hass?.states?.[this.config.entity];
  }

  /** Whether the entity is currently "on" (for the icon highlight). */
  private get _isOn(): boolean {
    return this._stateObj?.state === 'on';
  }

  /** Secondary line text for the tile. */
  private _secondary(): string | undefined {
    const state = this._stateObj;
    if (!state) return undefined;
    const domain = this.config.entity.split('.')[0];
    if (domain === 'sensor') {
      const unit = state.attributes.unit_of_measurement;
      return unit ? `${state.state} ${unit}` : state.state;
    }
    if (['switch', 'light', 'fan', 'input_boolean', 'binary_sensor'].includes(domain)) {
      return this._isOn ? 'On' : 'Off';
    }
    if (['button', 'input_button', 'scene', 'script'].includes(domain)) return undefined;
    return state.state;
  }

  /** Run the configured (or default) tap action. */
  private _tap = (): void => {
    if (!this.config.entity) return;
    performTap(this, this.hass, this.config.entity, this.config.tap_action);
  };

  protected render(): TemplateResult | typeof nothing {
    if (!this.config?.entity) return nothing;
    const state = this._stateObj;
    const domain = this.config.entity.split('.')[0];
    const name = this.config.name ?? state?.attributes.friendly_name ?? this.config.entity;
    const icon = this.config.icon ?? state?.attributes.icon ?? DOMAIN_ICONS[domain] ?? 'mdi:eye';
    const secondary = this._secondary();

    // Narrow widths degrade gracefully: 1 unit = an icon-only button (like a
    // mode chip), ≤ 2 units = compact (icon + value, no title).
    const w = this.config.width;
    const iconOnly = w === 1;
    const compact = this.config.compact || (typeof w === 'number' && w <= 2);

    if (iconOnly) {
      return html`
        <button
          class="tile icon-only ${this._isOn ? 'on' : ''}"
          @click=${this._tap}
          aria-label=${name}
          title=${name}
        >
          <ha-icon icon=${icon}></ha-icon>
        </button>
      `;
    }

    if (compact) {
      return html`
        <button class="tile compact" @click=${this._tap} aria-label=${name} title=${name}>
          <div class="ic ${this._isOn ? 'on' : ''}"><ha-icon icon=${icon}></ha-icon></div>
          ${secondary ? html`<div class="val">${secondary}</div>` : nothing}
        </button>
      `;
    }

    return html`
      <button class="tile" @click=${this._tap} aria-label=${name}>
        <div class="ic ${this._isOn ? 'on' : ''}"><ha-icon icon=${icon}></ha-icon></div>
        <div class="text">
          <div class="title">${name}</div>
          ${secondary ? html`<div class="sub">${secondary}</div>` : nothing}
        </div>
      </button>
    `;
  }

  static styles = [
    tokens,
    css`
      :host {
        display: block;
      }
      .tile {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        padding: 12px 16px;
        border: none;
        border-radius: var(--mt-shape-chip-square);
        background: var(--mt-surface-container);
        color: var(--mt-on-surface);
        cursor: pointer;
        text-align: left;
        min-height: 56px;
        transition: background-color 180ms cubic-bezier(0.2, 0, 0, 1);
        -webkit-tap-highlight-color: transparent;
      }
      .tile:hover {
        background: color-mix(in srgb, var(--mt-on-surface) 6%, var(--mt-surface-container));
      }
      /* Icon-only (width 1): a single centered icon, like a mode chip. */
      .tile.icon-only {
        justify-content: center;
        align-items: center;
        gap: 0;
        padding: 0;
        min-height: 48px;
        height: 100%;
        border-radius: var(--mt-shape-full);
        color: var(--mt-on-surface-variant);
      }
      .tile.icon-only ha-icon {
        --mdc-icon-size: 24px;
      }
      .tile.icon-only.on {
        background: var(--mt-selected-bg);
        color: var(--mt-selected-fg);
      }
      /* Compact: icon over value, no title — fits many per row. */
      .tile.compact {
        flex-direction: column;
        gap: 4px;
        padding: 10px 6px;
        min-height: 0;
        text-align: center;
      }
      .tile.compact .ic {
        width: 36px;
        height: 36px;
      }
      .tile.compact .val {
        font-size: var(--md-sys-typescale-label-large-size, 13px);
        color: var(--mt-on-surface);
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .tile:active {
        background: color-mix(in srgb, var(--mt-on-surface) 12%, var(--mt-surface-container));
      }
      .ic {
        flex: 0 0 auto;
        width: 40px;
        height: 40px;
        border-radius: var(--mt-shape-full);
        display: grid;
        place-items: center;
        background: color-mix(in srgb, var(--mt-on-surface-variant) 14%, transparent);
        color: var(--mt-on-surface-variant);
        transition:
          background-color 180ms cubic-bezier(0.2, 0, 0, 1),
          color 180ms cubic-bezier(0.2, 0, 0, 1);
      }
      .ic.on {
        background: var(--mt-selected-bg);
        color: var(--mt-selected-fg);
      }
      .ic ha-icon {
        --mdc-icon-size: 22px;
      }
      .text {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .title {
        font-size: var(--md-sys-typescale-body-large-size, 16px);
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .sub {
        font-size: var(--md-sys-typescale-body-medium-size, 14px);
        color: var(--mt-on-surface-variant);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'mt-entity-tile': MtEntityTile;
  }
}
