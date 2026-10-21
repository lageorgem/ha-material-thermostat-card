# Layout & responsiveness

How the card sizes and places features. Lives in `material-thermostat-card.ts`
(`_featureWidthPct`, `_featureSpan`, `_layout`, render) + `grid.ts` (constants) +
`feature-row.ts` (applies the column span to each host).

## The model: width is a PERCENTAGE of the card

A feature's `width` config is a **percentage (10–100, steps of 10)**. Unset =
100% (full width); an `entity-tile` unset = 50% (`TILE_DEFAULT_PCT`). This is the
deliberately-simple model the maintainer asked for (it replaced several
unit/flex experiments — don't reintroduce custom "grid units").

```
WIDTH_STEP    = 10    slider/percentage step
MIN_WIDTH_PCT = 10    smallest feature width
MAX_WIDTH_PCT = 100   full width
GRID_COLUMNS  = 10    columns in a full-width feature row (10% each)
TILE_DEFAULT_PCT = 50 entity-tile default width
DIAL_MAX_PX   = 320   dial never grows past this
DIAL_MIN_PX   = 240   dial needs ≥ this much room to sit beside features (wide)
WIDE_MIN_PX   = 560   card must be ≥ this wide to go side-by-side
CARD_PADDING_X= 32    ha-card horizontal padding (host width − this = content width)
pctToSpan(pct)= clamp(round(pct/10), 1, 10)
```

## Packing, wrapping & singleton alignment

The feature area is **one CSS grid**, `grid-template-columns: repeat(gridCols,
minmax(0,1fr))`. Feature spans remain `pct/10`. Packing follows config order,
left to right, wrapping before a feature that does not fit the remaining columns:

- two `width: 50` → span 5 + span 5 → fill one row (gap handled by the grid).
- `50 + 60` → span 5 then span 6; 6 doesn't fit in the remaining 5 columns → it
  **wraps** to the next row. (This is req "line-break based on width".)
- a lone `width: 30` → span 3, left-aligned by default (stays small).
- unset (100) → span 10 → full row.

Optional `alignment: left|center|right` (default `left`) positions the whole
feature host in unused space **only on singleton visible rows**. It never changes
the span, text alignment or internal chip order. Shared rows, including `50 + 50`
and partially filled `30 + 30`, ignore alignment and retain their order. Full-width
features have no spare space. Hidden comfort hosts are excluded from packing.

The placement contract is deterministic: pack visible spans against the current
grid column count first, then align singleton rows without changing row membership.
Use config, current layout and feature visibility, not DOM geometry; no new
observers are needed for alignment. Keep the CSS grid and integer spans, not
flexbox basis-px, custom unit grids or per-row flex.

`_featureWidthPct(f)`: explicit `width` → `clamp(round(width/10)*10, 10, 100)`;
`entity-tile` → 50; else 100. `_featureSpan(f)` = `pctToSpan(pct)` (1–10).

## Stacked vs wide

`_layout()` reads measured `_widthPx` (= host − `CARD_PADDING_X`) and
`maxPct` = the widest feature's percentage:

```
wide = features.length > 0
     && maxPct < 100
     && cardPx >= WIDE_MIN_PX
     && cardPx * (100 - maxPct) / 100 >= DIAL_MIN_PX
```

- **Stacked** (the default, incl. any config with a full-width/100% feature):
  dial on top, the feature grid full width below (`gridCols = 10`). The dial gets
  a negative bottom-margin crop (see below).
- **Wide**: dial + feature area side by side.
  - feature area = `maxPct%` of the card, on the **right**
    (`.features { flex: 0 0 ${maxPct}% }`, `gridCols = maxPct/10`). Each grid
    column is still 10% of the card, so every feature stays `width%` of the card.
  - the dial-wrap fills the rest (`flex: 1 1 auto`) and **centers** the
    fixed-size dial (`.dial` `max-width: 320px`, centered). → req: "dial keeps
    fixed size; if max width < 100%, the dial is centered in the remainder."

So wide only happens when features are narrower than the card (so there's room
for the dial) AND the leftover is ≥ `DIAL_MIN_PX`. A config of plain selectors
(all 100%) is always stacked — give features explicit `width < 100` to get the
side-by-side layout.

Alignment is relative to this feature sidebar's grid, **not the whole card**.
A lone feature at `maxPct` fills the sidebar and cannot visibly move. Alignment
does not alter wide-mode eligibility, sidebar width or dial placement.

## The dial bottom-gap crop (stacked mode)

The dial is square; stacked layout crops its empty bottom band with
`marginBottom: -Math.round(gap × min(_widthPx, DIAL_MAX_PX))px`.
The card passes `dial_style` to the dial (default `halo`) and selects the gap:

- `halo` / `minimal`: `DIAL_BOTTOM_GAP = 0.065`, below the +/- controls
  (bottom edge ~93.5%); 20px crop for a 300px dial.
- `google`: `DIAL_BOTTOM_GAP_DISC = 0.035`, preserving the background disc
  (bottom edge ~96.4%); 11px crop for a 300px dial.

Wide layout has no crop. `.body.stacked` gap, `.features` grid gap, and `ha-card`
padding-bottom remain 12px.

## Icon-row scrolling

Selector/list icon rows (`selector-row.ts`) keep each icon ~44px
(`flex: 1 1 44px; min-width:44px; max-width:120px`). When they don't all fit,
`.chips` **scrolls horizontally** (clipped to the rounded pill) rather than
squishing.

## Test gotchas

- `style.gridTemplateColumns` reads back with `minmax(0px, 1fr)` (0 → 0px).
- Check feature spans and singleton positioning separately; shared rows must keep
  their original placement even when alignment is configured.
- `_widthPx` is set directly in tests (`(el as any)._widthPx = px; requestUpdate;
  await updateComplete`) — there's no real ResizeObserver in jsdom-style mounts.
