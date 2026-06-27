/**
 * Format a duration in minutes as a short, human phrase: "less than a minute",
 * "15 minutes", "1 hour", "2h 10m", "about 5 hours", "1 day". Returns '' for a
 * non‑finite or negative input.
 * @param minutes the duration in minutes
 */
export function formatDuration(minutes: number): string {
  if (!isFinite(minutes) || minutes < 0) return '';
  const m = Math.round(minutes);
  if (m < 1) return 'less than a minute';
  if (m < 60) return `${m} minute${m === 1 ? '' : 's'}`;

  const hours = Math.floor(m / 60);
  const rem = m % 60;
  if (m < 60 * 24) {
    if (rem === 0) return `${hours} hour${hours === 1 ? '' : 's'}`;
    // Beyond a few hours the minute precision is spurious — round to "about N".
    if (hours >= 4) return `about ${hours} hours`;
    return `${hours}h ${rem}m`;
  }

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'}`;
}
