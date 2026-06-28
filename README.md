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
- [Feels‑like temperature](#feels-like-temperature)
- [Features](#features)
  - [Common feature options](#common-feature-options)
  - [Climate selectors](#climate-selectors-hvac--fan--swing)
  - [Option overrides](#option-overrides)
  - [`input-select`](#input-select)
  - [`switch-group`](#switch-group)
  - [`switch-list`](#switch-list)
  - [`button-list`](#button-list)
  - [`entity-tile`](#entity-tile)
  - [`comfort`](#comfort)
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
- 🥵 **"Feels‑like" temperature** from a temperature + humidity sensor (heat index), shown on the dial.
- ⏳ A **comfort** feature: tells you when the room **feels comfortable** and forecasts **time until comfortable** / **until the target is reached** from recent history.
- ✨ **Animated** mode‑color cross‑fade and a sliding temperature segment.
- 🧩 Climate **HVAC / fan / swing** selectors as an **icon row** or **dropdown**.
- ✏️ Per‑option **label / icon / hide** overrides, and **drag‑to‑reorder** options & list items — from the visual editor.
- 🎛️ Custom‑entity controls: **`input_select`**, **switch group**, **switch list**, **button list**, **entity tiles**.
- 💡 **Suggested for climate entities** in the card picker (Home Assistant 2026.6+).
- 📐 **Percentage widths** that fill and wrap correctly at any card size, with a side‑by‑side wide mode.
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
| `show_current_as_primary` | boolean | `false` | Show the **current** temperature as the large centre number. The target then labels the setpoint marker on the ring and the current dot is left unlabelled (no duplicate reading) |
| `feels_like` | object | — | "Feels‑like" temperature/humidity sensors — see [Feels‑like temperature](#feels-like-temperature) |
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
The fill only takes the mode color when it's actually doing something — e.g. in **cool** mode it's
gray (not blue) when the room is already below the setpoint.

For **`heat_cool`**, the active sub‑mode is derived from the current temperature: it fills **blue**
from the high setpoint up to the current temp when **cooling** (current above the range), **orange**
from the low setpoint down when **heating**, and shows a gray band between the two setpoints. The
center shows the **Heat/Cool range** for 5 seconds after a setpoint change, then collapses to the
active mode (e.g. "Cooling") and the single setpoint it's targeting.

Changes are **optimistic** (the UI updates immediately) and the `climate.set_temperature` call is
debounced so dragging doesn't spam the backend. Color changes **cross‑fade**, and the temperature
segment **slides in/out** on power changes and when switching between modes.

## Feels‑like temperature

Many climate entities only report dry‑bulb temperature, which ignores how humid air *feels*. Point
the card at a **temperature** and a **humidity** sensor and it computes the **heat index** ("feels
like"), and — with `show_as_current` — shows that in place of the climate entity's current
temperature on the dial. These same two sensors power the [`comfort`](#comfort) feature.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `temperature` | string | — | A temperature `sensor.*` |
| `humidity` | string | — | A relative‑humidity `sensor.*` (%) |
| `show_as_current` | boolean | `false` | Show the computed feels‑like value as the dial's current temperature |

```yaml
type: custom:material-thermostat-card
entity: climate.living_room
feels_like:
  temperature: sensor.living_room_temperature
  humidity: sensor.living_room_humidity
  show_as_current: true
```

> The heat index reduces to ≈ the air temperature in cool, dry conditions; there's no wind‑chill term
> (no indoor wind sensor). If a sensor is missing or non‑numeric, the card falls back to the climate
> entity's own `current_temperature`.

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
| `comfort` | the feels‑like sensors | a status line: comfort + time‑to‑comfortable / time‑to‑target (**add once**) |

### Common feature options

| Option | Applies to | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `display` | `climate-*`, `input-select`, `switch-group` | `icons` \| `dropdown` | `icons` | Render the selector as an icon row or a dropdown |
| `width` | **all** feature types | number `10`–`100` (step 10) | `100` (selectors/lists) · `50` (tiles) | Width as a **percentage of the card** — see [Layout](#layout--responsiveness) |

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
| `width` | number `10`–`100` | `50` | Width as a percentage of the card |

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

# Compact tiles — two per row at 50% each
- type: entity-tile
  entity: sensor.living_humidity
  icon: mdi:water-percent
  compact: true
  width: 50
```

### `comfort`

A single status line that answers two questions: **does the room feel comfortable right now**, and
**how long until it does** — then, once it is comfortable, **how long until the target temperature is
reached**. It reuses the [feels‑like sensors](#feels-like-temperature) (no pickers of its own) and can
be added **only once**.

#### How comfort is determined

Comfort is **calculated, not configured** — there's no `comfort_min`/`comfort_max`. The card uses the
building‑science standard, the **ASHRAE 55 / ISO 7730 PMV model** (Fanger's *Predicted Mean Vote*),
which folds **temperature, humidity, clothing, and activity** into one number on the −3 (cold) … 0
(neutral) … +3 (hot) scale. The room is comfortable when **−0.5 < PMV < +0.5** (≈ 80% of people
satisfied).

- **Clothing is inferred from the room temperature itself** — "dynamic clothing": people dress lighter
  as a space warms (heavy dress ~1.0 clo at ≤ 20 °C easing to light dress ~0.5 clo at ≥ 27 °C) — **not
  the thermostat mode**. So the verdict is identical whether you're heating or cooling at a given
  temperature (an idle heater on a mild day won't make the room read "warm"). The result is a comfort
  band of roughly **21–27 °C**.
- An **absolute‑humidity cap** (ASHRAE's 0.012 humidity ratio) additionally flags a muggy room as
  `humid` even when the temperature itself is fine.

The verdict is one of **comfortable / warm / cool / humid**, which also drives the line's icon and
colour (warm → heat colour, cool & humid → cool colour, comfortable → green).

#### How the time‑to‑comfortable ETA is calculated

While the room is uncomfortable, the card forecasts when it will become comfortable from the **current
session's history only** — readings since the climate last turned on (its `last_changed`), because
older data may reflect entirely different settings.

- It fits a **Newton's‑law heating/cooling curve** to the binding axis (the PMV series heading toward
  the ±0.5 boundary, or the humidity‑ratio series toward the cap). The fit is recovered by
  **integration** rather than by differencing consecutive readings, which makes it robust to the coarse,
  quantized steps real sensors record. Because the model knows the room **slows as it nears its
  plateau**, the estimate is realistic — and it can honestly report a target it **won't reach**.
- The forecast is gated on **time coverage, not sample count**, so it adapts to the sensor — a coarse
  sensor qualifies on 2–3 readings, a fast one needs more. Once history spans **~6 minutes** it shows a
  **rough early estimate** from the real trend (a straight‑line extrapolation), refining to the accurate
  curve fit as it converges. Below that coverage it just shows the plain verdict — never a fabricated
  number.
- Times are **compact** (`7m`, `1h`, `2hr+`), and the ETA is **anchored to the last reading and counts
  down between updates** (`7m → 6m → 5m`) so it doesn't sit frozen on a sensor that only reports every
  few minutes. Near zero it resolves to **"Room should be comfortable soon"**.

This needs Home Assistant's **recorder** to be keeping history for the sensors.

#### Switching to "time until target"

Once the room **is** comfortable, the line switches from time‑to‑comfortable to a Nest‑style **time
until the target temperature is reached** (enabled with `show_target_eta`). It applies the same
Newton's‑law fit to the **temperature** series — but the **accurate fit only**, no rough straight‑line
fallback, because an aggressive setpoint shouldn't be claimed reachable on a guess:

- reachable → **"34m until cooled to 16 °C"** / **"14m until heated to 26 °C"** (also counting down,
  resolving to **"Almost at 16 °C"** near zero);
- the room plateaus short of the setpoint → **"won't go below 24 °C"** / **"won't go above …"**;
- already at the target → the clause is dropped (back to "Room feels comfortable").

Example lines across the lifecycle:

- `Room feels warm` — uncomfortable, not yet ~6 min of session history to forecast a time
- `18m until comfortable` — warming/cooling toward the comfort band
- `Room feels comfortable` — in the band (target ETA off, or already reached)
- `34m until cooled to 16°C` — comfortable, heading to the setpoint
- `won't go below 24°C` — comfortable, but the room plateaus short of the setpoint

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `show_target_eta` | boolean | `false` | When comfortable, also show the time until the target temperature is reached |
| `width` | number `10`–`100` | `100` | Width as a percentage of the card |

```yaml
feels_like:
  temperature: sensor.living_room_temperature
  humidity: sensor.living_room_humidity
features:
  - type: comfort
    show_target_eta: true
```

> The row shows a verdict **whenever the sensors read — including when the climate is off** (just
> without a forecast). It is hidden only when the feels‑like sensors aren't set or the climate entity is
> unavailable/unknown.

## Layout & responsiveness

Feature `width` is a **percentage of the card** (10–100, in steps of 10). The same config works
in both **sections** and **masonry** views, since sizing is measured from the card's actual width.

| Concept | Behavior |
| --- | --- |
| **Width = % of the card** | `width: 50` is half the card; unset = full width (`100`). |
| **Rows fill, and wrap by width** | Features pack left to right; two `width: 50` fill a row **50/50**, and the next feature **wraps** to a new row when it doesn't fit (e.g. `50 + 60` → the `60` drops down). |
| **A narrow feature stays narrow** | A `width: 30` feature is 30% of the card — it doesn't stretch to fill its row. |
| **Side‑by‑side (wide)** | On a wide card where every feature is **< 100%**, the feature area takes the **widest feature's %** on the right and the **fixed‑size dial is centered** in the space on the left. Otherwise the card **stacks** (dial on top). Give your features explicit `width < 100` to get the side‑by‑side layout. |
| **Icon overflow** | Icon rows keep their icon size and **scroll horizontally** instead of squishing. |

The `width` control in the visual editor is a slider (**10–100%**, dots on the tens). Leave it unset
for full width (selectors/lists) or the 50% default (tiles).

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
and an icons/dropdown toggle. **Options and list items are drag‑to‑reorder** too (the order is saved
to the config), so you control the order icons appear in. The **"Add feature"** menu only offers the
climate selectors the entity actually exposes, and each climate selector can be added once.

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
