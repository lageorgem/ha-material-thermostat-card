import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import type { ComfortFeatureConfig } from '../types';
import './width-field';

interface FormSchemaItem {
  name: string;
  selector: Record<string, unknown>;
}

const SCHEMA: FormSchemaItem[] = [
  { name: 'show_target_eta', selector: { boolean: {} } },
  {
    name: 'lookback_hours',
    selector: { number: { min: 1, max: 72, step: 1, mode: 'box', unit_of_measurement: 'h' } },
  },
];

const DEFAULTS = { lookback_hours: 12 };

/**
 * Editor for the comfort feature: the optional target ETA and the history
 * lookback window — plus the shared width slider. Comfort itself is calculated
 * (ASHRAE 55 PMV), not configured. Warns when the card's feels-like sensors
 * aren't configured (the feature needs them).
 */
@customElement('mt-comfort-editor')
export class MtComfortEditor extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ attribute: false }) feature!: ComfortFeatureConfig;
  /** Whether the card-level feels-like sensors are both set. */
  @property({ type: Boolean }) feelsLikeConfigured = false;

  private get _data() {
    return {
      show_target_eta: this.feature.show_target_eta ?? false,
      lookback_hours: this.feature.lookback_hours ?? DEFAULTS.lookback_hours,
    };
  }

  /**
   * Field label resolver for the form.
   * @param s the schema item
   */
  private _computeLabel = (s: FormSchemaItem): string => {
    switch (s.name) {
      case 'show_target_eta':
        return 'Also show time until target temperature';
      case 'lookback_hours':
        return 'History lookback (hours)';
      default:
        return s.name;
    }
  };

  /**
   * Emit a patched feature config.
   * @param patch fields to merge
   */
  private _emit(patch: Partial<ComfortFeatureConfig>): void {
    this.dispatchEvent(
      new CustomEvent('feature-changed', {
        detail: { feature: { ...this.feature, ...patch } },
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Merge form changes into the feature config.
   * @param e ha-form's value-changed event
   */
  private _changed(e: CustomEvent): void {
    const d = e.detail.value;
    this._emit({
      show_target_eta: d.show_target_eta || undefined,
      lookback_hours: d.lookback_hours,
    });
  }

  protected render(): TemplateResult {
    return html`
      ${this.feelsLikeConfigured
        ? nothing
        : html`<p class="warn">
            Set the temperature and humidity sensors in the “Feels-like temperature” section above
            — this feature needs them.
          </p>`}
      <ha-form
        .hass=${this.hass}
        .data=${this._data}
        .schema=${SCHEMA}
        .computeLabel=${this._computeLabel}
        @value-changed=${this._changed}
      ></ha-form>
      <mt-width-field
        .hass=${this.hass}
        .value=${this.feature.width}
        @width-changed=${(e: CustomEvent) => this._emit({ width: e.detail.value })}
      ></mt-width-field>
    `;
  }

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .warn {
      margin: 0;
      padding: 8px 12px;
      border-radius: 8px;
      background: color-mix(in srgb, var(--warning-color, #ffa600) 14%, transparent);
      color: var(--primary-text-color);
      font-size: 13px;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'mt-comfort-editor': MtComfortEditor;
  }
}
