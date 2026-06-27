# The `mt:` AC-swing icon set

The card ships a custom Home Assistant icon set under the `mt:` prefix (AC
vane/swing positions), usable anywhere an icon is — this card's option overrides,
other cards, the icon picker — as `mt:<name>` (e.g. `mt:swing-vertical-full`).

## How it's wired

- `tools/gen-icons.mjs` **generates** SVG path data into
  `src/icons.generated.ts` (`MT_ICONS: Record<string, {path, secondary?}>`) and
  preview SVGs/PNGs into `icons/`. **Edit the generator, not the output.** Run
  `node tools/gen-icons.mjs`.
- `src/register-icons.ts` (`registerMtIcons()`, called at module load in the card
  entry) installs `window.customIcons['mt']` with:
  - `getIcon(name)` → `{ path, secondaryPath? }` (throws on unknown name);
  - `getIconList()` → names + keywords (`ac`, `swing`, `vane`, `louver`,
    `climate`, `airflow`, plus the name parts) so the icon picker can search them.

## HA custom-icon API facts (verified against HA source)

- The registry is `window.customIcons[prefix] = { getIcon, getIconList? }`,
  referenced as `prefix:name`.
- `getIcon` returns `CustomIcon { path, secondaryPath?, viewBox? }`. `ha-svg-icon`
  renders `path` at `currentColor` and `secondaryPath` at **opacity 0.5** (via
  `--icon-secondary-color`). We use this two-tone: **selected blades = primary
  (solid), unselected = secondary (dimmed gray)**.
- Icons are **single filled paths** (no stroke — `fill: currentColor`). So lines
  must be filled capsules, arrowheads filled triangles. Default viewBox 24×24.
- Some HA versions don't list custom sets in the picker dropdown, but the name
  still resolves if typed.

## The icon design

Each icon shows **five positions** and encodes state by how many are "selected"
(primary vs. secondary):

- **Vertical**: a corner-L frame + a quarter-fan of 5 cone wedges (top→bottom);
  swing variants also carry an oscillation double-arrow.
- **Horizontal**: mirrors the vertical layout (a downward 72° fan centered on
  90°) for a square 1:1 footprint; same fixed-bigger / swing-smaller cone sizing.
- **Selection encodes the mode**: `fixed` = 1 selected, `partial swing` (top3 /
  middle3 / bottom3, or left3/middle3/right3) = 3, `full` = 5.
- Generator details: fixed cones are larger (`r1Fixed`) to reach the line ends;
  swing cones are smaller (`r1`). A shared `arrowBand(cx,cy,R,loEdge,hiEdge)`
  pulls the arrow band in by one head-length so the **arrow tips land exactly on
  the swept cone edges** (no overshoot), on both axes.

## The 18 names

```
swing-vertical-fixed-top, -fixed-upper-middle, -fixed-middle, -fixed-lower-middle, -fixed-bottom
swing-vertical-top (top 3), -middle (mid 3), -bottom (bottom 3), -full
swing-horizontal-fixed-left, -fixed-left-middle, -fixed-middle, -fixed-right-middle, -fixed-right
swing-horizontal-left (left 3), -middle (mid 3), -right (right 3), -full
```

(If you change/add icons, keep these names stable — they're referenced in user
configs and the README icon table.)

## Verification workflow

`node tools/gen-icons.mjs` writes preview SVGs to `icons/`; `rsvg-convert` (no
ImageMagick `montage` available — composite into one SVG, then `rsvg-convert`
→ PNG) gives a contact sheet you can `Read` to eyeball them. There's also a
committed `icons/preview.html`.
