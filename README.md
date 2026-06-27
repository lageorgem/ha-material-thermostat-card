# Material Thermostat Card

A [Home Assistant](https://www.home-assistant.io/) Lovelace **thermostat card** built for
**Material 3 Expressive** — a draggable Google Home / Nest‑style temperature dial plus a fully
configurable stack of climate and custom‑entity controls. Designed to pair with
[Nerwyn's `material-you-theme`](https://github.com/Nerwyn/material-you-theme), and degrades
gracefully under any Home Assistant theme.

[![HACS Custom](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)
[![GitHub release](https://img.shields.io/github/v/release/lageorgem/ha-material-thermostat-card?display_name=tag)](https://github.com/lageorgem/ha-material-thermostat-card/releases)
[![Downloads](https://img.shields.io/github/downloads/lageorgem/ha-material-thermostat-card/total)](https://github.com/lageorgem/ha-material-thermostat-card/releases)
[![Validate](https://github.com/lageorgem/ha-material-thermostat-card/actions/workflows/validate.yml/badge.svg)](https://github.com/lageorgem/ha-material-thermostat-card/actions/workflows/validate.yml)
[![Tests](https://github.com/lageorgem/ha-material-thermostat-card/actions/workflows/test.yml/badge.svg)](https://github.com/lageorgem/ha-material-thermostat-card/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/lageorgem/ha-material-thermostat-card/branch/main/graph/badge.svg)](https://codecov.io/gh/lageorgem/ha-material-thermostat-card)
[![License: MIT](https://img.shields.io/github/license/lageorgem/ha-material-thermostat-card)](LICENSE)

[![Open your Home Assistant instance and open this repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=lageorgem&repository=ha-material-thermostat-card&category=dashboard)

<!-- 📸 Card screenshots go here. Swing-icon previews live in icons/. -->

---

## Table of contents

- [Highlights](#highlights)
- [Installation](#installation)
- [Quick start](#quick-start)
- [Card options](#card-options)
- [The dial](#the-dial)
- [Features](#features)
  - [Common feature options](#common-feature-options)
  - [Climate selectors](#climate-selectors-hvac--fan--swing)
  - [Option overrides](#option-overrides)
  - [`input-select`](#input-select)
  - [`switch-group`](#switch-group)
  - [`switch-list`](#switch-list)
  - [`button-list`](#button-list)
  - [`entity-tile`](#entity-tile)
- [Layout & responsiveness](#layout--responsiveness)
- [AC swing icons (`mt:`)](#ac-swing-icons-mt)
- [Theming](#theming)
- [Visual editor](#visual-editor)
- [Development](#development)
- [License](#license)

## Highlights

- 🎯 **Draggable circular dial** (custom SVG) — drag, tap, `+/−`, or keyboard; themed by HVAC mode/action.
- 🔀 **Dual setpoint** for `heat_cool` (two handles).
- 🌡️ Current‑temperature marker, with an optional **"show current as primary"** big number.
- ✨ **Animated** mode‑color cross‑fade and a sliding temperature segment.
- 🧩 Climate **HVAC / fan / swing** selectors as an **icon row** or **dropdown**.
- ✏️ Per‑option **label / icon / hide** overrides — from the visual editor.
- 🎛️ Custom‑entity controls: **`input_select`**, **switch group**, **switch list**, **button list**, **entity tiles**.
- 📐 **Relative, gap‑safe grid** layout that fills correctly at any card width, with a side‑by‑side wide mode.
- 🌬️ A bundled **`mt:` AC swing icon set**, searchable in the icon picker.
- 🎨 **Material 3** tokens with graceful Home Assistant theme fallbacks.
- 🛠️ A **visual editor** for every feature type.

## Installation

> Requires Home Assistant **2024.8.0** or newer.

### HACS (recommended)

1. Click the button above ⬆️ (**Open in HACS**), or in HACS go to **⋮ → Custom repositories**, add
   `https://github.com/lageorgem/ha-material-thermostat-card` with category **Dashboard** (Lovelace).
2. Install **Material Thermostat Card**.
3. Reload your browser (HACS adds the dashboard resource automatically).

### Manual

| Step | Action |
| --- | --- |
| 1 | Download `material-thermostat-card.js` from the [latest release](https://github.com/lageorgem/ha-material-thermostat-card/releases). |
| 2 | Copy it to `config/www/`. |
| 3 | Add a dashboard resource: **Settings → Dashboards → ⋮ → Resources → Add**, URL `/local/material-thermostat-card.js`, type **JavaScript Module**. |

```yaml
# or as YAML, under lovelace.resources:
url: /local/material-thermostat-card.js
type: module
```

## Quick start

```yaml
type: custom:material-thermostat-card
entity: climate.living_room
name: Living Room
features:
  - type: climate-hvac-modes
  - type: climate-fan-modes
  - type: climate-swing-modes
```

Add the card from the dashboard's **"Add card"** picker (it shows a live preview) and configure it
visually, or write the YAML directly.

## Card options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `type` | string | — | `custom:material-thermostat-card` **(required)** |
| `entity` | string | — | A `climate.*` entity **(required)** |
| `name` | string | entity name | Card title |
| `theme` | string | — | A Home Assistant theme to apply to this card |
| `show_current_as_primary` | boolean | `false` | Show the **current** temperature as the large number (instead of the target) |
| `features` | list | `[]` | Controls rendered below / beside the dial — see [Features](#features) |

## The dial

The dial mirrors the stock thermostat card's controls with a Nest‑style 270° arc (the gap sits at
the bottom, where the `+/−` live).

| Interaction | Behavior |
| --- | --- |
| **Drag** the ring | Set the target temperature; markers follow smoothly |
| **Tap** a point on the ring | Jump the setpoint there |
| **`+` / `−`** | Step by the entity's `target_temp_step` |
| **Arrow keys** (when focused) | Step the setpoint (single‑setpoint modes) |
| **`heat_cool`** | Two draggable handles for the low/high setpoints |
| **⋮** (top‑right) | Open the entity's more‑info dialog |

The dial, halo, and big number are **colored by the active HVAC action** (falling back to the mode),
and the colored segment between the **current** temperature and the **target** visualizes the gap.
Changes are **optimistic** (the UI updates immediately) and the `climate.set_temperature` call is
debounced so dragging doesn't spam the backend. Color changes **cross‑fade**, and the temperature
segment **slides in/out** on power changes and when switching between modes.

## Features

Add any number of rows under `features:`. Each entry has a `type` and type‑specific options.

| `type` | Controls | Selection behavior |
| --- | --- | --- |
| `climate-hvac-modes` | the card's climate entity | sets the **HVAC mode** |
| `climate-fan-modes` | the card's climate entity | sets the **fan mode** |
| `climate-swing-modes` | the card's climate entity | sets the **swing mode** |
| `input-select` | an `input_select` entity | selects an option |
| `switch-group` | a list of switches | **mutually exclusive** — turns the others **off**, then the chosen one **on** |
| `switch-list` | a list of switches | each toggles **independently** (several can be on) |
| `button-list` | buttons / scenes / scripts | each **pressed** independently |
| `entity-tile` | one sensor / switch / button | a rounded tile that runs a tap action |

### Common feature options

| Option | Applies to | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `display` | `climate-*`, `input-select`, `switch-group` | `icons` \| `dropdown` | `icons` | Render the selector as an icon row or a dropdown |
| `width` | **all** feature types | number `2`–`36` | full row (selectors/lists) · `6` (tiles, `4` if compact) | **Relative** width in grid units — see [Layout](#layout--responsiveness) |

### Climate selectors (HVAC / fan / swing)

```yaml
features:
  - type: climate-hvac-modes
    display: icons

  - type: climate-fan-modes
    display: dropdown
    options:
      - value: high
        label: Turbo
        icon: mdi:fan-chevron-up
      - value: auto
        icon: mdi:fan-auto

  - type: climate-swing-modes
    options:
      - value: 'off'
        label: Fixed
        icon: mt:swing-vertical-fixed-middle
      - value: vertical
        label: Swing
        icon: mt:swing-vertical-full
```

### Option overrides

`climate-*` and `input-select` accept an `options:` list to customize how each underlying value is
shown. Unlisted values keep their Home Assistant defaults.

| Key | Type | Description |
| --- | --- | --- |
| `value` | string | The underlying option value to override **(required)** |
| `label` | string | Replacement display label |
| `icon` | string | Replacement icon (`mdi:…` or `mt:…`) |
| `hide` | boolean | Remove this option from the row |

### `input-select`

```yaml
- type: input-select
  entity: input_select.ac_preset
  display: icons
  label: Preset
  options:
    - value: comfort
      label: Comfort
      icon: mdi:sofa
    - value: away
      icon: mdi:home-export-outline
```

### `switch-group`

Mutually‑exclusive switches that behave like a selector — picking one turns the others off first,
then turns on the chosen one. Items use the [`EntityItem`](#entityitem) shape.

```yaml
- type: switch-group
  label: Preset
  display: icons
  entities:
    - { entity: switch.eco, label: Eco, icon: mdi:leaf }
    - { entity: switch.boost, label: Boost, icon: mdi:rocket-launch }
```

### `switch-list`

Independent toggles in a row (multiple can be on at once).

```yaml
- type: switch-list
  entities:
    - { entity: switch.lamp, icon: mdi:lamp }
    - { entity: switch.purifier, icon: mdi:air-purifier }
```

### `button-list`

Independent presses for buttons, scenes, or scripts. **Note:** the key is `items` (not `entities`).

```yaml
- type: button-list
  items:
    - { entity: button.ac_restart, icon: mdi:restart }
    - { entity: scene.movie, label: Movie, icon: mdi:movie }
```

#### `EntityItem`

Used by `switch-group.entities`, `switch-list.entities`, and `button-list.items`:

| Key | Type | Default | Description |
| --- | --- | --- | --- |
| `entity` | string | — | Entity id **(required)** |
| `label` | string | friendly name | Display label |
| `icon` | string | entity / heuristic icon | Icon to show |

### `entity-tile`

A rounded tile (à la Google Home) showing an icon, title, and a secondary line (sensor value, or
on/off). Runs `tap_action` if set, otherwise the entity's natural action.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `entity` | string | — | The entity **(required)** |
| `name` | string | friendly name | Tile title |
| `icon` | string | entity / domain icon | Tile icon |
| `tap_action` | [action](https://www.home-assistant.io/dashboards/actions/) | natural action | Standard Lovelace action (`toggle`, `more-info`, `navigate`, `call-service`, `url`, `none`, …) |
| `compact` | boolean | `false` | Icon + value only (no title) — fits more per row |
| `width` | number | `6` (`4` if compact) | Relative width in grid units |

**Default tap action** (when `tap_action` is unset): press for `button`/`input_button`/`scene`/`script`,
toggle for `switch`/`light`/`fan`/`input_boolean`, and more‑info otherwise.

```yaml
- type: entity-tile
  entity: sensor.living_humidity
  name: Humidity
  icon: mdi:water-percent

- type: entity-tile
  entity: switch.fan_lamp
  tap_action:
    action: toggle

# Compact tiles — several fit per row
- type: entity-tile
  entity: sensor.living_humidity
  icon: mdi:water-percent
  compact: true
  width: 6
```

## Layout & responsiveness

Features lay out on a grid keyed to the Home Assistant sections grid, and the same config fills
correctly at **any** card size because widths are **relative fractions**, not fixed pixels.

| Concept | Behavior |
| --- | --- |
| **Grid unit** | 1 unit ≈ **24px** (one sections‑grid unit). A full‑width view ≈ **48 units**; an icon ≈ **2 units**. |
| **Relative widths** | Features sharing a row split it **in proportion** to their widths — two `width: 9` items are always **50/50**, regardless of the card's pixel size. |
| **Max feature width** | **36 units** (the region beside the 12‑unit dial) — a feature can fill that region edge to edge. |
| **Centering** | Rows narrower than the widest sized row are **centered**; a full‑row item (or a row that sums to the grid) spans edge to edge. |
| **Icon overflow** | Icon rows keep their icon size and **scroll horizontally** instead of squishing. |
| **Side‑by‑side (wide)** | At **≥ 24 units** (~50% width) the dial anchors in its fixed **12‑unit left corner** and the feature region **fills the rest**; below that, they **stack** with full‑width features. |
| **Tiles** | Pack several per row; use `compact` + `width` to fit more across. |

The `width` control in the visual editor is a slider (**2–36**). Leave `width` unset for a full row
(selectors/lists) or a sensible default (tiles).

## AC swing icons (`mt:`)

The card registers a set of **AC swing icons** with Home Assistant, usable anywhere an icon is
(this card's overrides, other cards, the icon picker) as `mt:<name>`. Preview the SVGs in
[`icons/`](icons/).

Each icon shows **five positions** (vertical cones top→bottom, or horizontal rays left→right). Active
positions are drawn solid (**dark**); the rest are dimmed (**gray**) for context — a **fixed**
position selects one, a **partial swing** selects three, and **full swing** selects all five.

| Group | Names |
| --- | --- |
| **Vertical — fixed** | `swing-vertical-fixed-top`, `swing-vertical-fixed-upper-middle`, `swing-vertical-fixed-middle`, `swing-vertical-fixed-lower-middle`, `swing-vertical-fixed-bottom` |
| **Vertical — swing** | `swing-vertical-top` (top 3), `swing-vertical-middle` (mid 3), `swing-vertical-bottom` (bottom 3), `swing-vertical-full` |
| **Horizontal — fixed** | `swing-horizontal-fixed-left`, `swing-horizontal-fixed-left-middle`, `swing-horizontal-fixed-middle`, `swing-horizontal-fixed-right-middle`, `swing-horizontal-fixed-right` |
| **Horizontal — swing** | `swing-horizontal-left` (left 3), `swing-horizontal-middle` (mid 3), `swing-horizontal-right` (right 3), `swing-horizontal-full` |

```yaml
- type: climate-swing-modes
  options:
    - value: vertical
      icon: mt:swing-vertical-full
    - value: 'off'
      icon: mt:swing-vertical-fixed-middle
```

> Searchable in the icon picker — type **`mt:`** (or `swing`, `ac`, `vane`). You can also just type
> the full `mt:…` name; the icons render anywhere `ha-icon` is used.

## Theming

The card reads Material 3 system tokens and falls back to standard Home Assistant theme variables,
so it looks native under `material-you-theme` and remains usable under any theme.

| Token (read) | Falls back to | Used for |
| --- | --- | --- |
| `--md-sys-color-primary` | `--primary-color` | Selected chips / accents |
| `--md-sys-color-surface-container` | `--ha-card-background` | Chip & tile backgrounds |
| `--md-sys-color-on-surface` | `--primary-text-color` | Primary text |
| `--md-sys-color-on-surface-variant` | `--secondary-text-color` | Secondary text & icons |
| `--md-sys-shape-corner-extra-large` | `28px` | Card corner radius |
| `--md-sys-motion-*` | M3 defaults | Animation timing / easing |
| `--state-climate-*-color` | HA state colors | Dial color per HVAC mode |

## Visual editor

Every option above is editable from the card's **visual editor**: a base form (entity, name, theme,
"show current as primary") plus a **drag‑sortable list of features**. Each feature row expands to its
own editor — per‑option label/icon/hide for selectors, entity pickers for lists, a `width` slider,
and an icons/dropdown toggle — and an **"Add feature"** menu inserts new rows.

## Development

| Command | Description |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run build` | Bundle to `dist/material-thermostat-card.js` |
| `npm run watch` | Rebuild on change |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` / `npm run lint:fix` | ESLint |
| `npm run format` | Prettier |
| `npm test` | Unit/component tests (real Chrome) with coverage |
| `npm run test:watch` | Unit tests in watch mode |
| `npm run test:e2e` | End-to-end tests against the built bundle (run `npm run build` first) |
| `node tools/gen-icons.mjs` | Regenerate the `mt:` icon set into `src/icons.generated.ts` |

### Testing

The suite runs in a real browser (Chrome) — web components need a real DOM (shadow roots,
pointer capture, SVG, the Web Animations API, `ResizeObserver`).

- **Unit / component tests** (`test/unit/`) use [`@web/test-runner`](https://modern-web.dev/docs/test-runner/overview/)
  + [`@open-wc/testing`](https://open-wc.org/docs/testing/testing-package/), with V8 coverage mapped back
  to the TypeScript sources. Coverage is gated at **95%** (statements / branches / functions / lines).
- **End-to-end tests** (`e2e/`) use [Playwright](https://playwright.dev/) to drive the **built bundle**
  (`dist/material-thermostat-card.js`) against a mock `hass`, exercising full user journeys (mode
  selection, dropdowns, the temperature dial, the switch group, more-info).

Both use the system Chrome locally (no browser download); CI installs Playwright's Chromium.
`npm run test:e2e:install` fetches it if you want to run e2e with the bundled browser.

`dist/` is committed and checked by CI — **run `npm run build` and commit the result** with any
source change. Open `dev/index.html` (after a build, served over HTTP) for a quick layout/interaction
harness — note that Home Assistant's web components are stubbed there, so icons render as dots; always
verify final fidelity inside Home Assistant.

> 🤖 **Working on this repo with an AI agent?** Start with [`.ai/`](.ai/) — it documents the
> architecture, the dial internals, the layout/grid system, the feature system, the icon generator,
> and the non‑obvious gotchas.

## License

[MIT](LICENSE)
