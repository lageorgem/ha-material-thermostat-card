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

## Width sizing — proportional rows, lone items stay small

Two rules the user explicitly wanted (and which earlier models each got half of):

- **Features that share a row fill it, split in proportion to their widths** —
  two `width: 8` are 50/50 *edge to edge*, two `width: 9` are 50/50, a `6 + 12`
  is 1/3 + 2/3. The exact card pixel-width is irrelevant (flex distributes it).
- **A lone sized feature does NOT stretch** — it's `width / budget` of the card
  (a `width: 3` stays a small ~3-unit pill), centered.

This is implemented with **per-row flexbox**, not a CSS grid. (History: v0.6.0
used a CSS grid with `cols = widest sized row` → a lone item always filled;
v0.8.4 used `cols = budget` → a lone item was a fraction but shared rows left a
gap / wrapped a unit early. The flex model satisfies both. Don't go back to a
grid.)

### `_featureSpan(f, budget)` — units a feature wants
- explicit `width` → clamp to `[MIN_FEATURE_UNITS, budget]`;
- `entity-tile` → `TILE_COMPACT_UNITS` / `TILE_DEFAULT_UNITS`;
- anything else → **`null`** = flexible = its own full-width row.

### `_packRows(budget)` — features → flex rows
1. Walk features in order. A `null` (flexible) feature flushes the current row and
   takes a row of its own. Sized features pack greedily with **overflow**: the
   item that crosses `budget` still joins the row, *then* a new row starts. (This
   keeps a pair together even when the measured unit-width is a unit short — e.g.
   `9 + 9 = 18` on a 17-unit masonry column — flex then shrinks them to fit.)
2. Compute each item's flex shorthand:
   - flexible single item → `flex: 1 1 auto` (fills the row).
   - lone sized item → `flex: 0 0 ${round(width/budget*100)}%`, row
     `justify-content: center` (a fixed fraction, centered, not stretched).
   - shared-row sized items → `flex: ${width} 1 0` (grow weight = width, 0 basis)
     → the row fills, split by width ratio.
3. Returns `Array<{ justify?, items: [{ idx, flex }] }>`.

`render()` renders `.features` (a flex column) → one `.frow` (flex row, optional
`justify-content`) per row → an `<mt-feature-row .flex=…>` per item.
`mt-feature-row.willUpdate` applies `this.style.flex`. `avail` uses `Math.round`
(not floor) to reduce off-by-one wraps. **`flex: N 1 0` serializes to `N 1 0px`
in the DOM** — assert via `style.flexGrow`/`flexBasis` in tests, not `style.flex`.

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
