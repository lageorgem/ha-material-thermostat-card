/*
 * Layout constants.
 *
 * Feature widths are expressed as a **percentage of the card** (10–100, in steps
 * of 10). A feature row is a 10-column CSS grid (each column = 10% of the row),
 * so a feature spans `width / 10` columns; the grid's auto-flow packs features
 * left to right and wraps to a new row when the next one doesn't fit. Unset =
 * full width (100%). In a wide (side-by-side) layout the feature area is the
 * widest feature's percentage and the fixed-size dial is centered in the rest.
 */
export const WIDTH_STEP = 10; // slider/percentage step
export const MIN_WIDTH_PCT = 10; // smallest feature width
export const MAX_WIDTH_PCT = 100; // full width
export const GRID_COLUMNS = 10; // columns in a full-width feature row (10% each)
export const TILE_DEFAULT_PCT = 50; // entity-tile default width when unset

export const DIAL_MAX_PX = 320; // dial never grows past this (matches .dial max-width)
export const DIAL_MIN_PX = 240; // dial needs at least this much room to sit beside features
export const WIDE_MIN_PX = 560; // card must be at least this wide to go side-by-side

/** Horizontal padding of `ha-card` (12px 16px → 32px total), for width math. */
export const CARD_PADDING_X = 32;

/**
 * Convert a width percentage to a column span in a {@link GRID_COLUMNS}-column row.
 * @param pct the width percentage (10–100)
 */
export function pctToSpan(pct: number): number {
  return Math.max(1, Math.min(GRID_COLUMNS, Math.round(pct / WIDTH_STEP)));
}
