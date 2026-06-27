# Material Thermostat Card

A [Home Assistant](https://www.home-assistant.io/) Lovelace **thermostat card** built for
**Material 3 Expressive**, designed to pair with
[Nerwyn's `material-you-theme`](https://github.com/Nerwyn/material-you-theme) and inspired by the
Google Home / Nest thermostat UI.

It does everything the stock thermostat card does — a draggable temperature dial, current
temperature, mode/fan/swing selectors — and adds **customizable labels & icons** per option plus
**custom-entity selectors** (input_select, switch group/list, button list, entity tiles).

> **Status: v0.1.1.** Base card, climate selectors with label/icon customization, all custom-entity
> feature types, dual setpoint, and visual editors are implemented.

## Features

- 🎯 Draggable circular temperature dial (custom SVG, themed by HVAC mode/action)
- 🔀 Dual setpoint support for `heat_cool` (two draggable handles)
- 🌡️ Current temperature display, with an optional "show current as primary" mode
- ➕➖ Step buttons, keyboard-accessible
- 🎨 Material 3 Expressive styling via `--md-sys-*` tokens (graceful fallback to HA theme vars)
- 🧩 Climate **HVAC / fan / swing** selectors as an **icon row** or **dropdown**
- ✏️ Per-option **label and icon** overrides, plus hide options — all from the visual editor
- 🎛️ Custom-entity selectors: **input_select**, **switch group**, **switch list**, **button list**
- 🟦 **Entity tiles** (rounded cards) for sensor / switch / button with a configurable tap action
- 🛠️ Visual editor for every feature type

### Roadmap

- [x] `input_select` selector (icons or dropdown)
- [x] Switch **group** (mutually exclusive; switches off others, then on the selected — off before on)
- [x] Switch **list** (independent toggles in a row)
- [x] Button **list** (independent `button.press`)
- [x] Entity **tiles** (rounded cards for sensor / switch / button)
- [x] Visual editors for each of the above
- [x] Dual setpoint (`heat_cool`) support
- [ ] Motion / shape polish and gallery screenshots

## Installation

### HACS (custom repository)

1. HACS → ⋮ → **Custom repositories**
2. Add `https://github.com/lageorgem/ha-material-thermostat-card`, category **Lovelace**
3. Install **Material Thermostat Card** and reload your browser.

### Manual

Copy `dist/material-thermostat-card.js` to `config/www/` and add it as a dashboard resource:

```yaml
url: /local/material-thermostat-card.js
type: module
```

## Configuration

| Option                     | Type      | Default     | Description                                          |
| -------------------------- | --------- | ----------- | ---------------------------------------------------- |
| `type`                     | string    | —           | `custom:material-thermostat-card`                    |
| `entity`                   | string    | —           | A `climate.*` entity (required)                      |
| `name`                     | string    | entity name | Card title                                           |
| `theme`                    | string    | —           | Theme to apply to the card                           |
| `show_current_as_primary`  | boolean   | `false`     | Show current temperature as the large number         |
| `features`                 | list      | `[]`        | Selector rows below the dial (see below)             |

### Example

```yaml
type: custom:material-thermostat-card
entity: climate.living_room
name: Living AC
features:
  - type: climate-hvac-modes
  - type: climate-fan-modes
    display: icons
    options:
      - value: high
        label: Turbo
        icon: mdi:fan-chevron-up
      - value: auto
        icon: mdi:fan-auto
  - type: climate-swing-modes
    display: dropdown
    options:
      - value: 'off'
        label: Fixed
      - value: vertical
        label: Swing Top
```

Each climate feature accepts `display: icons | dropdown` and an `options` list of per-value
overrides: `{ value, label?, icon?, hide? }`. Unset options use Home Assistant's defaults.

## Feature types

Add any number of feature rows under `features:`. All selectors render as an icon row or a
dropdown (`display: icons | dropdown`); the lists and tile render as icon rows / tiles.

| Type                  | Controls                                   | Selection behavior                                            |
| --------------------- | ------------------------------------------ | ------------------------------------------------------------ |
| `climate-hvac-modes`  | the card's climate entity                  | sets HVAC mode                                               |
| `climate-fan-modes`   | the card's climate entity                  | sets fan mode                                               |
| `climate-swing-modes` | the card's climate entity                  | sets swing mode                                             |
| `input-select`        | an `input_select` entity                   | selects an option                                           |
| `switch-group`        | a list of switches                         | mutually exclusive — turns others **off**, then selected on |
| `switch-list`         | a list of switches                         | each toggles independently (multiple can be on)             |
| `button-list`         | a list of buttons/scenes/scripts           | each pressed independently                                  |
| `entity-tile`         | one sensor / switch / button               | rounded tile, runs `tap_action` (else the natural action)   |

```yaml
features:
  # Bind an input_select; override option labels/icons
  - type: input-select
    entity: input_select.ac_preset
    display: icons
    options:
      - value: comfort
        label: Comfort
        icon: mdi:sofa

  # Mutually exclusive switches (turns the others off first, then the chosen one on)
  - type: switch-group
    label: Preset
    entities:
      - { entity: switch.eco, label: Eco, icon: mdi:leaf }
      - { entity: switch.boost, label: Boost, icon: mdi:rocket-launch }

  # Independent toggles
  - type: switch-list
    entities:
      - { entity: switch.lamp, icon: mdi:lamp }
      - { entity: switch.purifier, icon: mdi:air-purifier }

  # Independent presses
  - type: button-list
    items:
      - { entity: button.restart, icon: mdi:restart }
      - { entity: scene.movie, label: Movie, icon: mdi:movie }

  # Rounded tiles (à la Google Home)
  - type: entity-tile
    entity: sensor.living_humidity
    name: Humidity
    icon: mdi:water-percent
  - type: entity-tile
    entity: switch.fan_lamp
    tap_action:
      action: toggle

  # Compact tiles (icon + value only) — several fit per row
  - type: entity-tile
    entity: sensor.living_humidity
    icon: mdi:water-percent
    compact: true
    width: 4 # grid units (≈24px each; an icon ≈ 2 units)
```

**Width** — every feature accepts an optional `width` in **grid units** (a slider in the editor,
**2–36**). Widths are **relative**: features sharing a row split it in proportion to their widths,
so two equal-width dropdowns are always 50/50 regardless of the card's pixel size. The widest sized
row sets the grid; narrower rows are **centered**, and a feature as wide as its area fills it edge to
edge. Leave `width` unset for a full row (selectors/lists) or a sensible default (tiles).
`switch-group`, `switch-list`, and `button-list` items accept `{ entity, label?, icon? }`. The
entity tile additionally accepts `name`, `icon`, a standard Lovelace `tap_action` (defaults to
toggle for switches, press for buttons, more-info otherwise), and `compact: true` (icon + value
only, no title).

## Responsiveness

The card lays its content out on a **grid** keyed to the Home Assistant sections grid (48 units
across a full-width view):

- **1 grid unit ≈ 1 sections-grid unit (~24px); an icon ≈ 2 units.** A full-width view is **48
  units**; a single feature can be up to **36 units** (the region beside the 12-unit dial). Feature
  widths are **relative fractions**, not fixed pixels, so the same config fills correctly at any
  card size.
- **Relative, gap-safe rows.** Features are laid out with **CSS grid**: items sharing a row split it
  in proportion to their widths (two `width: 9` items → 50/50), the grid gap never forces a wrap,
  and rows narrower than the widest sized row are **centered**.
- **Scrollable icon rows.** Each icon claims ≈2 units. When the space per icon drops too low, icons
  keep their size and the row **scrolls horizontally** instead of squishing.
- **Side-by-side at ≥ 50% width.** At 24 units and up, the circular controls stay anchored in their
  fixed 12-unit **left corner** and the feature region **fills the rest of the card**; below that
  they stack with the feature area full width.
- Entity tiles pack several per row; use `compact` + `width` to fit more across.

## AC swing icons (`mt:` icon set)

The card registers a set of **AC swing icons** with Home Assistant, so they're usable anywhere an
icon is (this card's option overrides, other cards, etc.) as `mt:<name>`. Preview the SVGs in
[`icons/`](icons/).

Each icon shows **five positions** (vertical cones, top→bottom; or horizontal rays, left→right).
The active ones are drawn solid (**dark**); the rest are dimmed (**gray**, via HA's secondary-icon
opacity) for context — a **fixed** position selects one, a **partial swing** selects three, and
**full swing** selects all five. Vertical swings also carry an oscillation arrow.

| Group | Names |
| --- | --- |
| **Vertical — fixed** | `swing-vertical-fixed-top`, `swing-vertical-fixed-upper-middle`, `swing-vertical-fixed-middle`, `swing-vertical-fixed-lower-middle`, `swing-vertical-fixed-bottom` |
| **Vertical — swing** | `swing-vertical-top` (top 3), `swing-vertical-middle` (middle 3), `swing-vertical-bottom` (bottom 3), `swing-vertical-full` |
| **Horizontal — fixed** | `swing-horizontal-fixed-left`, `swing-horizontal-fixed-left-middle`, `swing-horizontal-fixed-middle`, `swing-horizontal-fixed-right-middle`, `swing-horizontal-fixed-right` |
| **Horizontal — swing** | `swing-horizontal-left` (left 3), `swing-horizontal-middle` (middle 3), `swing-horizontal-right` (right 3), `swing-horizontal-full` |

```yaml
- type: climate-swing-modes
  options:
    - value: vertical
      icon: mt:swing-vertical-full
    - value: 'off'
      icon: mt:swing-vertical-fixed-middle
```

> Searchable in the icon picker — type **`mt:`** (or `swing`, `ac`, `vane`) to list them. You can
> also just type the full `mt:…` name; the icons render anywhere `ha-icon` is used.

The icons are generated from `tools/gen-icons.mjs` (`node tools/gen-icons.mjs`) into
`src/icons.generated.ts` — edit the generator, not the output.

## Theming

The card reads Material 3 system tokens (`--md-sys-color-*`, `--md-sys-typescale-*`,
`--md-sys-shape-corner-*`) and falls back to standard Home Assistant theme variables, so it looks
native under `material-you-theme` and remains usable under any theme. Cards use the
`extra-large` (28px) corner radius to match the theme.

## Development

```bash
npm install
npm run build      # bundle to dist/material-thermostat-card.js
npm run watch      # rebuild on change
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```

Open `dev/index.html` (after a build) for a quick layout/interaction harness — note that HA's web
components are stubbed there, so icons render as dots; verify final fidelity inside Home Assistant.

## License

MIT
