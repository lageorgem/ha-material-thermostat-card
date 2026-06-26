/*
 * Internal grid system.
 *
 * The card lays its content out on an internal grid whose unit is one icon.
 * Per the Home Assistant sections grid (48 units full width):
 *   1 internal unit  =  1 icon  =  2 sections-grid units  (~48px)
 * A half-width card (24 sections-grid units) is therefore 12 internal units —
 * 6 for the circular controls and 6 for a 6-icon list. The wide format spans up
 * to 36 sections-grid units → 18 internal units, hence the cap.
 *
 * Every card feature width is expressed in these internal units, never in px.
 */
export const SECTION_UNIT_PX = 24; // ~1 sections-grid unit
export const INTERNAL_UNIT_PX = SECTION_UNIT_PX * 2; // 48px — 1 internal unit = 1 icon
export const MAX_INTERNAL_UNITS = 18; // cap (36 sections-grid units, wide format)
export const DIAL_INTERNAL_UNITS = 6; // circular controls = 12 sections-grid units
export const SIDE_BY_SIDE_MIN_UNITS = 12; // ≥ 50% of the grid → controls beside features
export const DROPDOWN_UNITS = 4; // a dropdown row is icon-less; give it a sane width
export const TILE_UNITS = 6; // entity-tile area default when it drives the column

/** Default internal-unit width for an entity tile with no explicit `width`. */
export const TILE_DEFAULT_UNITS = 3;
export const TILE_COMPACT_UNITS = 2;

/** Horizontal padding of `ha-card` (12px 16px 20px → 32px total), for width math. */
export const CARD_PADDING_X = 32;

/**
 * Convert a width in internal grid units to pixels.
 * @param units width in internal grid units
 */
export function unitsToPx(units: number): number {
  return units * INTERNAL_UNIT_PX;
}
