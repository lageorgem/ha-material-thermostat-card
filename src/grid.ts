/*
 * Layout constants.
 *
 * Feature widths are expressed as a **percentage of the card** (10–100, in steps
 * of 10). A feature row is a 10-column CSS grid (each column = 10% of the row),
 * so a feature spans `width / 10` columns; packing follows sparse grid auto-flow
 * and wraps to a new row when the next one doesn't fit. Unset =
 * full width (100%). In a wide (side-by-side) layout the feature area is the
 * widest feature's percentage and the fixed-size dial is centered in the rest.
 */
export const WIDTH_STEP = 10; // slider/percentage step
export const MIN_WIDTH_PCT = 10; // smallest feature width
export const MAX_WIDTH_PCT = 100; // full width
export const GRID_COLUMNS = 10; // columns in a full-width feature row (10% each)
export const TILE_DEFAULT_PCT = 50; // entity-tile default width when unset
export const FEATURE_GAP_PX = 12; // shared by grid tracks and singleton width math

export interface FeaturePlacement {
  row: number;
  column: number;
  singleton: boolean;
}

/**
 * Pack resolved spans in sparse CSS-grid order, independently of alignment.
 * Hidden hosts have undefined spans and retain undefined placements.
 * @param spans visible spans (1..columns), or undefined for hidden hosts
 * @param columns the current stacked or sidebar column count
 */
export function packFeatureRows(
  spans: readonly (number | undefined)[],
  columns: number
): (FeaturePlacement | undefined)[] {
  const rows: { index: number; span: number }[][] = [];
  let used = columns;
  spans.forEach((span, index) => {
    if (span === undefined) return;
    if (used + span > columns) {
      rows.push([]);
      used = 0;
    }
    rows[rows.length - 1].push({ index, span });
    used += span;
  });
  const placements: (FeaturePlacement | undefined)[] = spans.map(() => undefined);
  rows.forEach((entries, row) => {
    let column = 1;
    entries.forEach(({ index, span }) => {
      placements[index] = { row: row + 1, column, singleton: entries.length === 1 };
      column += span;
    });
  });
  return placements;
}

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
