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
    /* Surface containers. Under material-you-theme the real M3 tokens are used.
       Everywhere else we tint the card background toward the on-surface color so
       tiles/lists read as a distinct, slightly elevated surface instead of
       blending into the card (the tint darkens in light themes and lightens in
       dark themes — the right direction for elevation in both). The steps mirror
       M3's container / high / highest elevation ladder. */
    --mt-surface-bg: var(--ha-card-background, var(--card-background-color, #f3edf7));
    --mt-surface-container: var(
      --md-sys-color-surface-container,
      color-mix(in srgb, var(--mt-on-surface) 8%, var(--mt-surface-bg))
    );
    --mt-surface-container-high: var(
      --md-sys-color-surface-container-high,
      color-mix(in srgb, var(--mt-on-surface) 11%, var(--mt-surface-bg))
    );
    --mt-surface-container-highest: var(
      --md-sys-color-surface-container-highest,
      color-mix(in srgb, var(--mt-on-surface) 14%, var(--mt-surface-bg))
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

    /* Motion — prefer Material You theme motion tokens, fall back to M3 defaults. */
    --mt-motion-dur: var(--md-sys-motion-duration-medium2, 280ms);
    --mt-motion-ease: var(--md-sys-motion-easing-emphasized, cubic-bezier(0.2, 0, 0, 1));
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

/**
 * Default accent color for a climate preset value: green for "eco"-like presets,
 * blue for "sleep"-like ones, and undefined otherwise (so the theme's default
 * color applies). Overridable per option via the color picker.
 * @param value the preset value
 */
export function presetColor(value: string): string | undefined {
  const v = value.toLowerCase();
  if (v.includes('eco')) return '#4caf50';
  if (v.includes('sleep')) return '#2196f3';
  return undefined;
}

/** Heuristic icon for a climate preset value (eco/away/home/…). */
export function presetIcon(value: string): string {
  const v = value.toLowerCase();
  if (v === 'none' || v === 'off') return 'mdi:cancel';
  if (v.includes('eco')) return 'mdi:leaf';
  if (v.includes('away')) return 'mdi:home-export-outline';
  if (v.includes('home')) return 'mdi:home';
  if (v.includes('sleep') || v.includes('night')) return 'mdi:power-sleep';
  if (v.includes('boost') || v.includes('turbo')) return 'mdi:rocket-launch';
  if (v.includes('comfort')) return 'mdi:sofa';
  if (v.includes('activity')) return 'mdi:run-fast';
  return 'mdi:tune-variant';
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

/**
 * Order a list of values by an optional explicit order: values listed in `order`
 * come first (in that order, ignoring any no-longer-present), then the remaining
 * values in their original order.
 * @param all the available values (natural order)
 * @param order the desired explicit order, if any
 */
export function orderValues(all: string[], order?: string[]): string[] {
  if (!order?.length) return all;
  const available = new Set(all);
  const ordered = order.filter((v) => available.has(v));
  const seen = new Set(ordered);
  return [...ordered, ...all.filter((v) => !seen.has(v))];
}

/**
 * Whether a tile value/state reads as "off" (falsy), so the tile shows its
 * neutral, squarer treatment rather than the accent-tinted, extra-rounded "on"
 * treatment. Covers the explicit off states (`off`/`none`) plus the generically
 * falsy values (empty, `false`, `null`, `0`, `unavailable`, `unknown`), all
 * case-insensitive. Anything else is considered "on".
 * @param value the raw state/option value
 */
export function isOffValue(value: string): boolean {
  const v = value.trim().toLowerCase();
  return (
    v === '' ||
    v === 'off' ||
    v === 'none' ||
    v === 'false' ||
    v === 'null' ||
    v === '0' ||
    v === 'unavailable' ||
    v === 'unknown'
  );
}

/** Turn an entity option value into a human label ("fan_only" -> "Fan Only"). */
export function prettyLabel(value: string): string {
  if (value === 'heat_cool') return 'Heat/Cool';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
