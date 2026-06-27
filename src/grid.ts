/*
 * Grid system.
 *
 * The card lays its content out on a grid whose unit is the Home Assistant
 * sections-grid unit (~24px); a full-width view is 48 units across. Every
 * feature width is expressed directly in these units — no internal 2:1
 * conversion — so two items "side by side" on an N-unit row are simply N/2 units
 * each (e.g. an 18-unit row → 9 + 9). Each feature is at least 2 units wide
 * (one icon ≈ 48px = 2 units), and the feature area is a CSS grid, so the gap
 * between items never forces a wrap.
 */
export const UNIT_PX = 24; // one sections-grid unit
export const MIN_FEATURE_UNITS = 2; // floor for any feature (one icon ≈ 2 units)
export const MAX_UNITS = 36; // cap (wide format spans up to 36 units)
export const DIAL_UNITS = 12; // circular controls footprint
export const SIDE_BY_SIDE_MIN_UNITS = 24; // ≥ 50% of the grid → controls beside features
export const TILE_DEFAULT_UNITS = 6; // entity-tile default
export const TILE_COMPACT_UNITS = 4; // compact entity-tile default

/** Horizontal padding of `ha-card` (12px 16px 20px → 32px total), for width math. */
export const CARD_PADDING_X = 32;

/**
 * Convert a width in grid units to pixels.
 * @param units width in grid units
 */
export function unitsToPx(units: number): number {
  return units * UNIT_PX;
}
