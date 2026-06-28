/**
 * Format a forecast duration in minutes as a compact, glanceable label:
 * "7m", "50m", "1h", and "2hr+" for anything ~two hours or beyond (precision
 * past a couple of hours isn't useful for these estimates). Returns '' for a
 * non‑finite or negative input.
 * @param minutes the duration in minutes
 */
export function formatDuration(minutes: number): string {
  if (!isFinite(minutes) || minutes < 0) return '';
  const m = Math.round(minutes);
  if (m < 60) return `${Math.max(1, m)}m`;
  if (m < 120) return '1h';
  return '2hr+';
}
