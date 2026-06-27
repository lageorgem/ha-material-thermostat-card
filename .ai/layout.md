# Layout & responsiveness

How the card sizes and places features. All of this lives in
`material-thermostat-card.ts` (`_featureSpan`, `_packLayout`, `_layout`) plus
`grid.ts` (constants) and `feature-row.ts` (applies placement to each host).

## The unit

**1 grid unit = 1 Home Assistant sections-grid unit ≈ 24px** (`UNIT_PX = 24`).
There is **no** internal 2:1 conversion (an earlier version had one — don't
reintroduce it). Feature widths in config are in these units directly.

```
UNIT_PX               = 24
MIN_FEATURE_UNITS     = 2    floor for any feature (one icon ≈ 48px ≈ 2 units)
MAX_UNITS             = 48   a full-width HA sections view
DIAL_UNITS            = 12   fixed footprint of the circular controls
MAX_FEATURE_UNITS     = 36   = MAX_UNITS - DIAL_UNITS (a feature can fill the region beside the dial)
SIDE_BY_SIDE_MIN_UNITS= 24   ≥ 50% of the grid → dial beside features (wide mode)
TILE_DEFAULT_UNITS    = 6    entity-tile default span
TILE_COMPACT_UNITS    = 4    compact entity-tile default span
CARD_PADDING_X        = 32   ha-card horizontal padding (for width math)
```

## Stacked vs wide

`_layout()` reads measured `_widthPx`, computes `avail = clamp(floor(px/24), 1,
48)`:

- **Stacked** (`avail < 24`): dial on top, feature grid full width below. The
  feature `budget` = `avail`. The dial gets a negative bottom margin to crop the
  ring's empty bottom band (see below).
- **Wide** (`avail ≥ 24` and there are features): dial anchored in a fixed
  `DIAL_UNITS`(12)-wide **left corner** (`flex: 0 0 288px`); the feature region
  `flex: 1 1 0` fills the rest. `.body.wide` is `justify-content: flex-start`
  (not centered) so the feature area truly fills the remaining width. Feature
  `budget` = `avail − DIAL_UNITS`.

## Width is RELATIVE, not pixels

This is the key idea (and the fix for a class of real-HA bugs): a feature's
`width` is a **fraction of its grid**, resolved by CSS grid columns — never a
pixel value. So a `9 + 9` row is always 50/50 regardless of HA's actual grid
pitch.

### `_featureSpan(f, budget)` — units a feature wants
- explicit `width` → clamp to `[MIN_FEATURE_UNITS, budget]`;
- `entity-tile` → `TILE_COMPACT_UNITS` / `TILE_DEFAULT_UNITS`;
- anything else → **`null`** = flexible = its own full-width row.

### `_packLayout(budget)` — rows → grid
1. Walk features in order, greedily packing sized items into rows until a row
   would exceed `budget`; a `null` (flexible) feature flushes the current row and
   takes a full-width row of its own.
2. **`cols` = the widest *sized* row's sum** (clamped `[MIN, budget]`). Flexible
   rows just fill `cols`. This is what makes widths relative: a `9+9` row sets
   `cols=18`, and each item spans 9 of 18 = 50%.
3. Each row is **centered**: `colStart = floor((cols − rowSum)/2)`. A row that
   sums to `cols` (or a full-row item) spans edge to edge; narrower rows sit
   centered.
4. Returns `{ cols, place[] }` where `place[i] = {row, colStart(1-based), span}`.

`render()` sets the `.features` grid to `repeat(cols, minmax(0, 1fr))` and passes
`row/colStart/span` to each `<mt-feature-row>`, whose `willUpdate` sets
`style.gridRow` and `style.gridColumn = "${colStart} / span ${span}"`.

**Why CSS grid, not flexbox:** a flex `gap` between two `width:50%` items pushes
the total past 100% and forces a wrap. CSS grid handles the gap within the track
sizing, so two half-width items genuinely sit side by side. Don't go back to
flex basis-px for the feature row.

## Icon-row scrolling

Selector/list icon rows (`selector-row.ts`) keep each icon at ~2 units
(`flex: 1 1 44px; min-width:44px; max-width:120px`, 44px + 4px gap ≈ 48px ≈ 2
units). When the row's icons don't all fit, `.chips` **scrolls horizontally**
(`overflow-x:auto; scrollbar-width:none`, clipped to the rounded pill) rather
than squishing the icons. `justify-content: safe center` keeps them centered when
they do fit.

## The dial bottom-gap crop (stacked mode)

The dial is a square, but the 270° ring leaves a ~14.7% empty band at the bottom
(where the +/− live). To make the spacing below the dial match the inter-row gap,
stacked layout applies `marginBottom: -(DIAL_BOTTOM_GAP × min(_widthPx, 320))px`
(`DIAL_BOTTOM_GAP = 0.147`, `DIAL_MAX_PX = 320`). Combined with `.body.stacked`
gap 12px, `.features` gap 12px, and `ha-card` padding-bottom 12px, the rhythm
(dial→controls, between rows, after the last row) is an even 12px — matching the
stock thermostat card.

## Tuning knobs

If side-by-side flips too early/late, adjust `SIDE_BY_SIDE_MIN_UNITS`. If 50/50
items don't pack right, look at `cols` derivation in `_packLayout` or the
`.features` grid `gap` (12px, which slightly narrows bare 2-unit items). If
`UNIT_PX` doesn't map cleanly to real HA column widths, that one constant is the
lever — but **verify in real HA**, the dev harness can't prove grid pitch.
