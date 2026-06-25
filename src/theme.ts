import { css } from 'lit';

/**
 * Material 3 token aliases scoped to the card host. We read Nerwyn's
 * `material-you-theme` `--md-sys-*` tokens first, then fall back to standard
 * Home Assistant theme variables, then to hard defaults — so the card looks
 * correct under material-you-theme and degrades gracefully elsewhere.
 *
 * CSS custom properties inherit across shadow boundaries, so defining these on
 * the card host makes them available to every nested feature component.
 */
export const tokens = css`
  :host {
    --mt-primary: var(--md-sys-color-primary, var(--primary-color, #6750a4));
    --mt-on-primary: var(--md-sys-color-on-primary, #ffffff);
    --mt-primary-container: var(--md-sys-color-primary-container, rgba(103, 80, 164, 0.16));
    --mt-on-primary-container: var(--md-sys-color-on-primary-container, var(--primary-text-color, #21005d));

    --mt-surface: var(--md-sys-color-surface, var(--card-background-color, #fef7ff));
    --mt-surface-container: var(
      --md-sys-color-surface-container,
      var(--ha-card-background, var(--card-background-color, #f3edf7))
    );
    --mt-surface-container-high: var(--md-sys-color-surface-container-high, var(--mt-surface-container));
    --mt-surface-container-highest: var(
      --md-sys-color-surface-container-highest,
      var(--mt-surface-container-high)
    );

    --mt-on-surface: var(--md-sys-color-on-surface, var(--primary-text-color, #1c1b1f));
    --mt-on-surface-variant: var(--md-sys-color-on-surface-variant, var(--secondary-text-color, #49454f));

    --mt-secondary-container: var(--md-sys-color-secondary-container, rgba(103, 80, 164, 0.14));
    --mt-on-secondary-container: var(--md-sys-color-on-secondary-container, var(--primary-text-color, #1d192b));

    --mt-outline: var(--md-sys-color-outline, var(--divider-color, #79747e));
    --mt-outline-variant: var(--md-sys-color-outline-variant, var(--divider-color, #cac4d0));
    --mt-error: var(--md-sys-color-error, var(--error-color, #b3261e));

    /* Filled "selected" segment color (matches the stock card's accent). */
    --mt-selected-bg: var(--md-sys-color-primary, var(--primary-color, #6750a4));
    --mt-selected-fg: var(--md-sys-color-on-primary, #ffffff);

    --mt-shape-card: var(--md-sys-shape-corner-extra-large, 28px);
    --mt-shape-chip-square: var(--md-sys-shape-corner-large, 16px);
    --mt-shape-full: var(--md-sys-shape-corner-full, 9999px);

    /* State layer opacities per M3 spec. */
    --mt-state-hover: 0.08;
    --mt-state-pressed: 0.12;
  }
`;

/** Default MDI icons for HVAC modes, matching Home Assistant conventions. */
export const HVAC_MODE_ICONS: Record<string, string> = {
  off: 'mdi:power',
  heat: 'mdi:fire',
  cool: 'mdi:snowflake',
  heat_cool: 'mdi:sun-snowflake-variant',
  auto: 'mdi:thermostat-auto',
  dry: 'mdi:water-percent',
  fan_only: 'mdi:fan',
};

/** Color expression (CSS) for a climate HVAC mode. */
export function climateModeColor(mode: string | undefined): string {
  switch (mode) {
    case 'cool':
      return 'var(--state-climate-cool-color, #2b9af9)';
    case 'heat':
      return 'var(--state-climate-heat-color, #ff8100)';
    case 'heat_cool':
      return 'var(--state-climate-heat_cool-color, #009688)';
    case 'auto':
      return 'var(--state-climate-auto-color, #e5c454)';
    case 'dry':
      return 'var(--state-climate-dry-color, #efbd07)';
    case 'fan_only':
      return 'var(--state-climate-fan_only-color, #8a8a8a)';
    default:
      return 'var(--state-climate-off-color, var(--mt-on-surface-variant))';
  }
}

/** Heuristic icon for a fan mode value. */
export function fanIcon(value: string): string {
  const v = value.toLowerCase();
  if (v.includes('auto')) return 'mdi:fan-auto';
  if (v.includes('off') || v === '0') return 'mdi:fan-off';
  if (/(^|[^0-9])1([^0-9]|$)|low|min|quiet|silent/.test(v)) return 'mdi:fan-speed-1';
  if (/(^|[^0-9])2([^0-9]|$)|mid|med/.test(v)) return 'mdi:fan-speed-2';
  if (/(^|[^0-9])3([^0-9]|$)|high|max|strong|turbo/.test(v)) return 'mdi:fan-speed-3';
  return 'mdi:fan';
}

/** Heuristic icon for a swing mode value. */
export function swingIcon(value: string): string {
  const v = value.toLowerCase();
  if (v === 'off' || v === 'stop' || v === 'fixed') return 'mdi:arrow-expand-vertical';
  if (v === 'both' || v === 'on' || v === 'full') return 'mdi:arrow-all';
  if (v.includes('horizontal')) return 'mdi:arrow-left-right';
  if (v.includes('vertical')) return 'mdi:arrow-up-down';
  return 'mdi:swap-vertical';
}

/** Turn an entity option value into a human label ("fan_only" -> "Fan Only"). */
export function prettyLabel(value: string): string {
  if (value === 'heat_cool') return 'Heat/Cool';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
