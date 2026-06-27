/**
 * Thin client + parsers for Home Assistant recorder history, used by the comfort
 * feature to forecast from recent sensor/climate trends.
 *
 * The card has not needed async hass access before; we use the websocket command
 * `history/history_during_period` (minimal, no attributes) and normalize its
 * compact response into numeric time series.
 */
import type { HomeAssistant } from 'custom-card-helpers';

/** A single recorded state: raw state string + epoch‑ms timestamp. */
export interface RawPoint {
  state: string;
  t: number;
}

/** States that count as "the climate is not running". */
export const OFF_STATES = new Set(['off', 'unavailable', 'unknown', '']);

/**
 * Fetch recorder history for several entities over a window. Returns a map of
 * entity id → chronological {@link RawPoint}s (empty arrays for entities with no
 * data). Tolerates the compact (`s`/`lu`/`lc`) and verbose key spellings.
 * @param hass the Home Assistant connection
 * @param ids the entity ids to fetch
 * @param startMs window start (epoch ms)
 * @param endMs window end (epoch ms)
 */
export async function fetchHistory(
  hass: HomeAssistant,
  ids: string[],
  startMs: number,
  endMs: number
): Promise<Record<string, RawPoint[]>> {
  const res = await hass.callWS<Record<string, any[]>>({
    type: 'history/history_during_period',
    start_time: new Date(startMs).toISOString(),
    end_time: new Date(endMs).toISOString(),
    entity_ids: ids,
    minimal_response: true,
    no_attributes: true,
  });

  const out: Record<string, RawPoint[]> = {};
  for (const id of ids) {
    const arr = Array.isArray(res?.[id]) ? res[id] : [];
    out[id] = arr
      .map((p) => {
        const tsSec = p.lu ?? p.lc ?? p.last_updated ?? p.last_changed ?? 0;
        return { state: String(p.s ?? p.state ?? ''), t: Number(tsSec) * 1000 };
      })
      .filter((p) => p.t > 0)
      .sort((a, b) => a.t - b.t);
  }
  return out;
}

/**
 * The epoch‑ms timestamp at which the climate most recently turned on, by
 * scanning its history for the latest off→on transition. Falls back to the first
 * sample's time when it was already on for the whole window, or `null` when it is
 * currently off / has no usable history.
 * @param points the climate entity's history (chronological)
 */
export function lastTurnedOnMs(points: RawPoint[]): number | null {
  if (!points.length) return null;
  // Currently off ⇒ nothing to forecast.
  if (OFF_STATES.has(points[points.length - 1].state)) return null;
  for (let i = points.length - 1; i > 0; i--) {
    if (!OFF_STATES.has(points[i].state) && OFF_STATES.has(points[i - 1].state)) {
      return points[i].t;
    }
  }
  // On for the whole window: use the earliest known point.
  return points[0].t;
}

/**
 * Convert raw history points to numeric samples (minutes since `originMs`),
 * dropping non‑numeric states and anything before `sinceMs`.
 * @param points the raw history points (chronological)
 * @param sinceMs only keep points at/after this epoch‑ms
 * @param originMs the epoch‑ms mapped to t = 0 minutes
 */
export function numericSeries(
  points: RawPoint[],
  sinceMs: number,
  originMs: number
): { t: number; v: number }[] {
  const out: { t: number; v: number }[] = [];
  for (const p of points) {
    if (p.t < sinceMs) continue;
    const v = parseFloat(p.state);
    if (!isFinite(v)) continue;
    out.push({ t: (p.t - originMs) / 60000, v });
  }
  return out;
}

/**
 * Merge two numeric series onto the timestamps of the left one, attaching the
 * most recent right‑value at or before each left timestamp (step interpolation).
 * Left points with no prior right value are dropped.
 * @param left the driving series (e.g. temperature)
 * @param right the series to sample (e.g. humidity)
 */
export function mergeOnLeft(
  left: { t: number; v: number }[],
  right: { t: number; v: number }[]
): { t: number; l: number; r: number }[] {
  const out: { t: number; l: number; r: number }[] = [];
  let j = 0;
  let last: number | undefined;
  for (const p of left) {
    while (j < right.length && right[j].t <= p.t) {
      last = right[j].v;
      j++;
    }
    if (last !== undefined) out.push({ t: p.t, l: p.v, r: last });
  }
  return out;
}
