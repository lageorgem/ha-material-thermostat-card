import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import type { HomeAssistant } from 'custom-card-helpers';
import type { EntityTileFeatureConfig } from '../types';
import { tokens, isOffValue } from '../theme';
import { tileStyles } from './tile-styles';
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
 * A Google-Home-style tile for a sensor, switch, or button. Shares its look with
 * the selector dropdown's tile variant (see {@link ../features/tile-styles}):
 * an icon chip with a small title over the value. The tile takes the accent
 * "on" treatment — soft tint + extra-rounded corners — whenever its value is
 * not falsy (off/none/false/null/0/unavailable/unknown), unless the card's
 * climate entity is off ({@link forceOff}), in which case it always reads as off.
 * Tapping runs a configurable tap action, else the entity's natural action.
 */
@customElement('mt-entity-tile')
export class MtEntityTile extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ attribute: false }) config!: EntityTileFeatureConfig;
  /** Force the "off" treatment regardless of value (e.g. the card's climate is off). */
  @property({ type: Boolean }) forceOff = false;

  private get _stateObj() {
    return this.hass?.states?.[this.config.entity];
  }

  /**
   * Whether the tile reads as "on": there is a state whose value is not falsy,
   * and the parent isn't forcing the off treatment. Drives the accent tint and
   * the extra-rounded corners.
   */
  private get _tileOn(): boolean {
    if (this.forceOff) return false;
    const state = this._stateObj;
    return !!state && !isOffValue(state.state);
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
      return state.state === 'on' ? 'On' : 'Off';
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
    const on = this._tileOn;

    // Narrow widths degrade gracefully: 1 unit = an icon-only chip; ≤ 2 units (or
    // an explicit `compact`) = a compact tile showing just the icon (no value).
    const w = this.config.width;
    const iconOnly = w === 1;
    const compact = this.config.compact || (typeof w === 'number' && w <= 2);

    if (iconOnly) {
      return html`
        <button
          class=${classMap({ tile: true, 'icon-only': true, on })}
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
        <button
          class=${classMap({ tile: true, compact: true, on })}
          @click=${this._tap}
          aria-label=${name}
          title=${name}
        >
          <div class="ic"><ha-icon icon=${icon}></ha-icon></div>
        </button>
      `;
    }

    return html`
      <button class=${classMap({ tile: true, on })} @click=${this._tap} aria-label=${name}>
        <div class="ic"><ha-icon icon=${icon}></ha-icon></div>
        <div class="text">
          <div class="title">${name}</div>
          ${secondary ? html`<div class="value">${secondary}</div>` : nothing}
        </div>
      </button>
    `;
  }

  static styles = [
    tokens,
    tileStyles,
    css`
      :host {
        display: block;
      }
      /* Icon-only (width 1): a single centered icon, like a mode chip. Always a
         full-round chip; muted when off, accent-colored (via .tile.on) when on. */
      .tile.icon-only {
        justify-content: center;
        gap: 0;
        padding: 0;
        min-height: 48px;
        height: 100%;
        border-radius: var(--mt-shape-full);
      }
      .tile.icon-only:not(.on) {
        color: var(--mt-on-surface-variant);
      }
      .tile.icon-only ha-icon {
        --mdc-icon-size: 24px;
      }
      /* Compact: just the icon chip, centered — no value under it. Still follows
         the tile roundness/color rules (squarer + neutral off, rounder + tinted
         on) via the shared .tile / .tile.on styles. */
      .tile.compact {
        justify-content: center;
        padding: 8px;
        min-height: 48px;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'mt-entity-tile': MtEntityTile;
  }
}
