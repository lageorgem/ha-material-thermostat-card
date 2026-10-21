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
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/lageorgem/ha-material-thermostat-card/blob/main/LICENSE)

[![Open your Home Assistant instance and open this repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=lageorgem&repository=ha-material-thermostat-card&category=plugin)

<p align="center">
  <img src="https://raw.githubusercontent.com/lageorgem/ha-material-thermostat-card/main/assets/hero.png" alt="Bedroom AC cooling, with a mode tile, fan-speed dropdown and temperature/humidity tiles" width="420">
</p>

---

## Table of contents

- [Highlights](#highlights)
- [Installation](#installation)
- [Quick start](#quick-start)
- [Supported entities](#supported-entities)
- [Migrating from the stock thermostat card](#migrating-from-the-stock-thermostat-card)
- [Card options](#card-options)
  - [Theme font](#theme-font)
- [The dial](#the-dial)
  - [Dial styles](#dial-styles)
  - [Dial states](#dial-states)
  - [Dragging](#dragging)
- [Feels‑like temperature](#feels-like-temperature)
- [Features](#features)
  - [Common feature options](#common-feature-options)
  - [Climate selectors](#climate-selectors-hvac--fan--swing--preset)
    - [Fan, swing and preset modes](#fan-swing-and-preset-modes)
  - [Option overrides](#option-overrides)
  - [Water heater controls](#water-heater-controls)
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
- 🔀 **Capability-driven single or dual setpoints**, including dual handles in `auto` and `heat_cool`, with **+/− buttons** that adjust the selected setpoint (tap a handle to select; defaults to the one nearest the current temperature).
- 🚿 **Water heater support** — target temperature, operation modes and an away-mode toggle, when supported by the entity; the active operation-mode icon appears under the temperature when the operation-modes feature is added.
- 🌡️ Current‑temperature marker, with an optional **"show current as primary"** big number.
- 🥵 **"Feels‑like" temperature** from a temperature + humidity sensor (heat index), shown on the dial.
- ⏳ A **comfort** feature: tells you when the room **feels comfortable** and forecasts **time until comfortable** / **until the target is reached** from recent history.
- ✨ **Animated** mode‑color cross‑fade and a sliding temperature segment.
- 🏠 **Google‑Home‑style dial**: no mode label cluttering the number (the HVAC chips show the mode), and the active **preset icon** (e.g. the eco leaf) under the temperature when the preset‑modes feature is added.
- 🧩 Climate **HVAC / fan / swing / horizontal swing / preset** selectors as an **icon row**, a **dropdown**, or a **Google‑Home‑style tile** (icon + title + current value), each with an optional **title**.
- ✏️ Per‑option **label / icon / color / hide** overrides, and **drag‑to‑reorder** options & list items — from a compact visual editor (an icon **pill**: pick an icon or disable it, a **color pill** that defaults to the theme/mode color, plus a custom title).
- 🎛️ Custom‑entity controls: **`input_select`**, **switch group**, **switch list**, **button list**, **entity tiles**, **sensor list**.
- 💡 **Suggested for climate entities** in the card picker (Home Assistant 2026.6+).
- 📐 **Percentage widths** that fill and wrap correctly at any card size, with a side‑by‑side wide mode.
- 🌬️ A bundled **`mt:` AC swing icon set**, searchable in the icon picker.
- 🎨 **Material 3** tokens with graceful Home Assistant theme fallbacks — tiles/lists read as a distinct, slightly **elevated surface**, and on the default theme the HVAC chips take each **mode's own color** (cool→blue, heat→orange…).
- 🛠️ A **visual editor** for every feature type.

## Installation

> Requires Home Assistant **2024.8.0** or newer.

### HACS (recommended)

1. Click the button above ⬆️ (**Open in HACS**), or in HACS go to **⋮ → Custom repositories**, add
   `https://github.com/lageorgem/ha-material-thermostat-card` with category **Dashboard** (Lovelace).
2. Install **Material Thermostat Card**.
3. Reload your browser (HACS adds the dashboard resource automatically).

### Manual

| Step | Action                                                                                                                                           |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1    | Download `material-thermostat-card.js` from the [latest release](https://github.com/lageorgem/ha-material-thermostat-card/releases).             |
| 2    | Copy it to `config/www/`.                                                                                                                        |
| 3    | Add a dashboard resource: **Settings → Dashboards → ⋮ → Resources → Add**, URL `/local/material-thermostat-card.js`, type **JavaScript Module**. |

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

## Supported entities

The primary `entity` is required and must be `climate.*` or `water_heater.*`.
Climate selectors require the corresponding entity mode lists (`hvac_modes`, `fan_modes`,
`preset_modes`, `swing_modes`, or `swing_horizontal_modes`). Temperature controls follow
`supported_features` and the reported target values: a single target takes precedence over
a low/high range when both are available. Climate ranges also work in `auto`. An entity with
no settable target gets a read-only dial.

Water heaters use `water_heater.set_temperature` instead of `climate.set_temperature`.
Climate-only selectors, `comfort`, and `feels_like` are ignored for water heaters; auxiliary
controls such as sensor lists and entity tiles remain available.

```yaml
type: custom:material-thermostat-card
entity: water_heater.tank
name: Hot water
features:
  - type: water-heater-operation-modes
    display: dropdown
  - type: water-heater-away-mode
    display: tile
```

## Migrating from the stock thermostat card

Change `type: thermostat` to `type: custom:material-thermostat-card`; keep the entity and
stock feature syntax. For example:

```yaml
type: custom:material-thermostat-card # was: thermostat
entity: climate.living_room
features:
  - type: climate-hvac-modes
    style: dropdown
    hvac_modes: [heat, cool, 'off']
  - type: climate-preset-modes
    style: icons
    preset_modes: [eco, comfort]
```

Stock `style: icons|dropdown` maps to `display`. The lists `hvac_modes`, `preset_modes`,
`fan_modes`, `swing_modes`, `swing_horizontal_modes`, and `operation_modes` map to `include`
on their corresponding selector feature. Explicit `display` and `include` take precedence.
Only values offered by the entity are shown.

Two deliberate visual differences remain: our arc fills from **current to target** rather
than by mode, and no mode or action text clutters the dial number.

**Localization.** Mode, preset, fan, swing and operation labels, state text and “Unavailable”
use Home Assistant's translations. Numbers follow your Home Assistant number-format setting
(for example, a decimal comma with German formatting). User label overrides take precedence.
The visual editor's own strings remain English.

## Card options

| Option                    | Type                            | Default     | Description                                                                                                                                                                                                                     |
| ------------------------- | ------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`                    | string                          | —           | `custom:material-thermostat-card` **(required)**                                                                                                                                                                                |
| `entity`                  | string                          | —           | A `climate.*` or `water_heater.*` entity **(required)**                                                                                                                                                                         |
| `name`                    | string, object or list          | entity name | Card title; HA structured names (e.g. `[{type: entity}, {type: device}]`) are rendered by HA on versions that support them; otherwise falls back to the entity name. Structured names are YAML-only and preserved by the editor |
| `theme`                   | string                          | —           | A Home Assistant theme to apply to this card                                                                                                                                                                                    |
| `dial_style`              | `halo` \| `minimal` \| `google` | `halo`      | `halo`: mode‑coloured glow, dimmed when idle/off; `minimal`: no glow; `google`: flat Google Home look with a background disc and no glow                                                                                        |
| `font`                    | `rounded` \| `theme`            | `rounded`   | `rounded`: Google Sans Flex with its rounded axis; `theme`: use the Home Assistant theme's font without requesting a font from Google                                                                                           |
| `show_current_as_primary` | boolean                         | `false`     | Show the **current** temperature as the large centre number. The target then labels the setpoint marker on the ring and the current dot is left unlabelled (no duplicate reading)                                               |
| `feels_like`              | object                          | —           | "Feels‑like" temperature/humidity sensors — see [Feels‑like temperature](#feels-like-temperature)                                                                                                                               |
| `features`                | list                            | `[]`        | Controls rendered below / beside the dial — see [Features](#features)                                                                                                                                                           |

> **Font privacy & offline use.** With `font: rounded`, each browser fetches Google Sans Flex from
> Google Fonts (`fonts.googleapis.com` / `fonts.gstatic.com`). If Google Fonts is unreachable, the
> theme font is used. Choose `font: theme` to avoid this external request.

### Theme font

`font: theme` uses the Home Assistant theme font instead of the default Google Sans Flex rounded font.

<p align="center">
  <img src="https://raw.githubusercontent.com/lageorgem/ha-material-thermostat-card/main/assets/font-theme.png" alt="Heating dial using the Home Assistant theme font with font: theme" width="280">
</p>

## The dial

The dial mirrors the stock thermostat card's controls with a Google‑Home‑matched 306° arc (the gap
sits at the bottom, where the `+/−` live). While dragging, the band thickens **inward**, keeping its
outer edge fixed, and the dots become line markers. Ring labels show decimals as a small
superscript (**21⁵** for 21.5); the large centre number does the same in single‑setpoint modes,
without a degree sign or unit. Per‑mode **icon overrides** from the `climate-hvac-modes` feature
also appear on the dial.

<p align="center">
  <img src="https://raw.githubusercontent.com/lageorgem/ha-material-thermostat-card/main/assets/dial-heat-cool.png" alt="Idle heat_cool dial showing the low/high setpoint range" width="280">
  <img src="https://raw.githubusercontent.com/lageorgem/ha-material-thermostat-card/main/assets/show-current.png" alt="Heating dial with current temperature as the large primary number" width="280">
</p>

| Interaction                        | Behavior                                                                                                      |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Drag** the ring                  | Set the target temperature; markers follow smoothly                                                           |
| **Tap** a point on the ring        | Jump the setpoint there                                                                                       |
| **`+` / `−`**                      | Step by the entity's `target_temp_step`; defaults to 1 °F or 0.5 °C when none is reported                     |
| **Arrow keys** (when focused)      | Step the setpoint; each dual handle is independently keyboard-operable                                        |
| **PageUp / PageDown / Home / End** | Larger steps / jump to the allowed minimum or maximum                                                         |
| **Low/high range**                 | Two draggable handles when the entity supports a range and no single target is available, including in `auto` |
| **⋮** (top‑right)                  | Open the entity's more‑info dialog                                                                            |

In **heat/cool** modes, the dial and big number only light up in the mode colour while actively
heating/cooling: the card uses `hvac_action` when available, otherwise infers activity from the
setpoint versus the current temperature. The **halo** style adds a glow, dimmed when idle/off;
**minimal** removes it, and **google** adds a flat background disc without a glow.
The band between the **current** temperature and the **target** visualizes the gap. It and the mode
icon use the full mode colour whenever heating/cooling is demanded or reported, even if
`hvac_action` still reports idle; the halo and big number keep the activity rule above.
It is hidden when heating with the setpoint below room temperature, or cooling with the setpoint
above room temperature.

For **dual setpoints**, the active sub‑mode uses the reported heating/cooling action, falling back to
the current temperature versus the range: it fills **blue**
from the high setpoint up to the current temp when **cooling** (current above the range), **orange**
from the low setpoint down when **heating**. The band between the two setpoints uses the heat/cool
colour while idle and muted gray while active. The centre shows the **Heat/Cool range** while
dragging, for 5 seconds after a setpoint change, and while idle within the range; otherwise it
collapses to the single setpoint it's targeting, with the active mode icon on the ring.

Changes are **optimistic** (the UI updates immediately) and the domain's `set_temperature` call is
debounced so dragging doesn't spam the backend. Rejected or ignored changes revert to the device's
value after about **3 seconds**. The card is a labelled group for screen readers.
Color changes **cross‑fade**, and the temperature
segment **slides in/out** on power changes and when switching between modes.

### Dial styles

<table>
  <tr>
    <td align="center" width="34%"><code>dial_style: halo</code> (default)</td>
    <td align="center" width="33%"><code>dial_style: minimal</code></td>
    <td align="center" width="33%"><code>dial_style: google</code></td>
  </tr>
  <tr>
    <td align="center"><img src="https://raw.githubusercontent.com/lageorgem/ha-material-thermostat-card/main/assets/dial-halo-heat.png" alt="Active heating with the halo dial's orange glow" width="240"></td>
    <td align="center"><img src="https://raw.githubusercontent.com/lageorgem/ha-material-thermostat-card/main/assets/dial-minimal.png" alt="Active heating with the minimal dial, without a glow" width="240"></td>
    <td align="center"><img src="https://raw.githubusercontent.com/lageorgem/ha-material-thermostat-card/main/assets/dial-google.png" alt="Active heating with the flat Google-style background disc" width="240"></td>
  </tr>
</table>

### Dial states

<table>
  <tr>
    <td align="center" width="25%">Heating</td>
    <td align="center" width="25%">Cooling</td>
    <td align="center" width="25%">Idle</td>
    <td align="center" width="25%">Off</td>
  </tr>
  <tr>
    <td align="center"><img src="https://raw.githubusercontent.com/lageorgem/ha-material-thermostat-card/main/assets/dial-halo-heat.png" alt="Actively heating from 21 to 23 degrees with an orange halo" width="240"></td>
    <td align="center"><img src="https://raw.githubusercontent.com/lageorgem/ha-material-thermostat-card/main/assets/dial-halo-cool.png" alt="Actively cooling from 26.5 to 23 degrees with a blue halo" width="240"></td>
    <td align="center"><img src="https://raw.githubusercontent.com/lageorgem/ha-material-thermostat-card/main/assets/dial-idle.png" alt="Idle heating dial with a 20-degree target below the 22-degree room temperature and no gap band" width="240"></td>
    <td align="center"><img src="https://raw.githubusercontent.com/lageorgem/ha-material-thermostat-card/main/assets/dial-off.png" alt="Thermostat off with a neutral dial" width="240"></td>
  </tr>
  <tr>
    <td align="center">Halo and number light up orange only while actively heating.</td>
    <td align="center">Halo and number light up blue only while actively cooling.</td>
    <td align="center">Halo dims; the band hides when the setpoint is on the wrong side of room temperature.</td>
    <td align="center">The dial is neutral when off.</td>
  </tr>
</table>

### Dragging

While dragging, the band thickens inward without moving its outer edge, and dot markers become lines.

<table>
  <tr>
    <td align="center" width="34%">Single setpoint — halo</td>
    <td align="center" width="33%">Single setpoint — google</td>
    <td align="center" width="33%">Dual setpoint — high handle</td>
  </tr>
  <tr>
    <td align="center"><img src="https://raw.githubusercontent.com/lageorgem/ha-material-thermostat-card/main/assets/drag-single.png" alt="Halo heating dial being dragged to 24.5 degrees, with a thicker inward band and line markers" width="240"></td>
    <td align="center"><img src="https://raw.githubusercontent.com/lageorgem/ha-material-thermostat-card/main/assets/drag-google.png" alt="Google-style heating dial being dragged to 24.5 degrees with line markers" width="240"></td>
    <td align="center"><img src="https://raw.githubusercontent.com/lageorgem/ha-material-thermostat-card/main/assets/drag-heat-cool.png" alt="Dual-setpoint dial with the high handle dragged to 25.5 degrees and the low setpoint at 20" width="240"></td>
  </tr>
</table>

## Feels‑like temperature

Many climate entities only report dry‑bulb temperature, which ignores how humid air _feels_. Point
the card at a **temperature** and a **humidity** sensor and it computes the **heat index** ("feels
like"), and — with `show_as_current` — shows that in place of the climate entity's current
temperature on the dial. These same two sensors power the [`comfort`](#comfort) feature.

| Option            | Type    | Default | Description                                                          |
| ----------------- | ------- | ------- | -------------------------------------------------------------------- |
| `temperature`     | string  | —       | A temperature `sensor.*`                                             |
| `humidity`        | string  | —       | A relative‑humidity `sensor.*` (%)                                   |
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

> `feels_like.temperature` uses the sensor's `unit_of_measurement` (**°C, °F or K**). A sensor
> without a unit is assumed to use Home Assistant's temperature unit. The heat index is calculated
> in °C internally, then shown on the dial in **Home Assistant's temperature unit**, matching the
> setpoints.

## Features

Add any number of rows under `features:`. Each entry has a `type` and type‑specific options.

| `type`                           | Controls                     | Selection behavior                                                                                |
| -------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------- |
| `climate-hvac-modes`             | the card's climate entity    | sets the **HVAC mode**                                                                            |
| `climate-fan-modes`              | the card's climate entity    | sets the **fan mode**                                                                             |
| `climate-swing-modes`            | the card's climate entity    | sets the **swing mode**                                                                           |
| `climate-swing-horizontal-modes` | the card's climate entity    | calls `climate.set_swing_horizontal_mode`                                                         |
| `climate-preset-modes`           | the card's climate entity    | sets the **preset** (eco / away / …)                                                              |
| `water-heater-operation-modes`   | the card's water heater      | calls `water_heater.set_operation_mode`                                                           |
| `water-heater-away-mode`         | the card's water heater      | toggles `water_heater.set_away_mode` when supported                                               |
| `input-select`                   | an `input_select` entity     | selects an option                                                                                 |
| `switch-group`                   | a list of switches           | **mutually exclusive** — turns the others **off**, then the chosen one **on**                     |
| `switch-list`                    | a list of switches           | each toggles **independently** (several can be on)                                                |
| `button-list`                    | buttons / scenes / scripts   | each **pressed** independently                                                                    |
| `entity-tile`                    | one sensor / switch / button | a rounded tile that runs a tap action                                                             |
| `sensor-list`                    | a list of sensors            | read‑only rows of icon + title + value (à la the Google Home app)                                 |
| `comfort`                        | the feels‑like sensors       | a status line: comfort + time‑to‑comfortable / time‑to‑target (**add once in the visual editor**) |

### Common feature options

| Option      | Applies to                                                                        | Type                            | Default                                                                               | Description                                                                                                                                                                                          |
| ----------- | --------------------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `display`   | `climate-*`, `water-heater-operation-modes`, `input-select`, `switch-group`       | `icons` \| `dropdown` \| `tile` | `icons`                                                                               | Render the selector as an icon row, a dropdown, or a Google‑Home‑style **tile**                                                                                                                      |
| `display`   | `water-heater-away-mode`                                                          | `icons` \| `tile`               | `icons`                                                                               | Render the away toggle as an icon or tile; no dropdown                                                                                                                                               |
| `include`   | `climate-*`, `water-heater-operation-modes`                                       | list of strings                 | all available values                                                                  | Non-empty allow-list: show only these available values, in this order unless `order` overrides it. `[]` applies no filter                                                                            |
| `label`     | `climate-*`, `water-heater-*`, `input-select`, `switch-group/list`, `button-list` | string                          | —                                                                                     | Optional **title** — rendered above the control in `icons`/`dropdown` modes, and as the **tile's title line** in `tile` mode; mode-selector tile titles fall back to HA's translated attribute label |
| `width`     | **all** feature types                                                             | positive number                 | `50` (`entity-tile`, including `icon`) · `100` (all others, including selector tiles) | Optional percentage, e.g. `50`; rounded to the nearest 10, then clamped to 10–100. Non-positive/non-numeric uses the type's default — see [Layout](#layout--responsiveness)                          |
| `alignment` | **all** feature types                                                             | `left` \| `center` \| `right`   | `left`                                                                                | Position the whole feature in unused row space, only when it is the row's only visible feature. Does not change width, text alignment or chip order                                                  |

For example, center a half-width selector on its own row:

```yaml
type: custom:material-thermostat-card
entity: climate.living_room
features:
  - type: climate-hvac-modes # full-width row; keeps the layout stacked
  - type: input-select
    entity: input_select.ac_preset
    display: dropdown
    width: 50
    alignment: center
```

Use `alignment: right` to move it to the right instead; omit `alignment` for left.
Shared rows (including two `width: 50` features or `30 + 30`) ignore alignment and
keep their existing order, even when space remains.

### Climate selectors (HVAC / fan / swing / preset)

Every climate selector renders in three display modes. `climate-fan-modes`, `climate-swing-modes`
and `climate-preset-modes` behave identically, as does `climate-swing-horizontal-modes`
for horizontal swing — shown here with `climate-hvac-modes`. These five climate mode selectors,
the water-heater operation-mode selector and the water-heater away control are disabled
while the card's main entity is unavailable; this does not apply to auxiliary controls such as `input-select`:

<table>
  <tr>
    <td align="center" width="34%"><code>display: icons</code></td>
    <td align="center" width="33%"><code>display: dropdown</code></td>
    <td align="center" width="33%"><code>display: tile</code></td>
  </tr>
  <tr>
    <td align="center">
      <img src="https://raw.githubusercontent.com/lageorgem/ha-material-thermostat-card/main/assets/hvac-icons.png" alt="HVAC modes as an icon row" width="240">
    </td>
    <td align="center">
      <img src="https://raw.githubusercontent.com/lageorgem/ha-material-thermostat-card/main/assets/hvac-dropdown.png" alt="HVAC modes as a dropdown" width="240">
    </td>
    <td align="center">
      <img src="https://raw.githubusercontent.com/lageorgem/ha-material-thermostat-card/main/assets/hvac-tile.png" alt="HVAC modes as a Google-Home-style tile" width="240">
    </td>
  </tr>
</table>

```yaml
features:
  - type: climate-hvac-modes
    display: icons

  - type: climate-fan-modes
    display: dropdown
    label: Fan speed # optional title shown above the control
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

  - type: climate-hvac-modes
    display: tile # Google-Home-style tile showing the current mode
    label: Mode # optional — defaults to "Mode" for HVAC
```

> **Tile display.** `display: tile` renders the selector as a Google‑Home‑style card — an icon, the
> `label` as a title, and the current value below it — that opens the option menu when tapped. A tile
> shows an **"on" treatment** (a soft accent tint + full pill shape) whenever the current value
> isn't a turned‑off state (`off`, `none`, empty, `false`, `null`, `0`, `unavailable`, `unknown`,
> case-insensitive and trimmed); otherwise it stays a neutral, less‑rounded
> rectangle. **HVAC tiles tint with the active mode's color** (heat→orange, cool→blue…); other
> selectors tint with the theme primary. Pair with `width: 50` to sit two tiles side by side.
> Climate-selector tiles also use the off look whenever the card's climate entity is off.

#### Fan, swing and preset modes

The same display options apply to fan, swing and preset selectors; these examples show one of each.

Fan modes containing `quiet` or `silent` (case-insensitive) default to `mdi:power-sleep`,
distinct from `low` / `min` / `1` (`mdi:fan-speed-1`). Auto/off matches still take precedence.
To change an icon, use a per-option override with the **exact raw value** from the entity's
`fan_modes` attribute (including case), not its translated display label:

```yaml
- type: climate-fan-modes
  options:
    - value: quiet
      icon: mdi:weather-night
```

The stock feature key `fan_modes: [quiet, low]` is an allow-list (translated to `include`),
not a list of override objects; put icon overrides under `options` as above.

Vertical and horizontal swing selectors use the bundled [`mt:` AC swing icons](#ac-swing-icons-mt)
by default, matched to the mode name. Per-option `icon` overrides are only needed to change them.

<table>
  <tr>
    <td align="center" width="34%"><code>climate-fan-modes</code><br><code>display: icons</code></td>
    <td align="center" width="33%"><code>climate-swing-modes</code><br><code>display: dropdown</code></td>
    <td align="center" width="33%"><code>climate-preset-modes</code><br><code>display: tile</code></td>
  </tr>
  <tr>
    <td align="center"><img src="https://raw.githubusercontent.com/lageorgem/ha-material-thermostat-card/main/assets/fan-modes.png" alt="Fan-speed icon row with medium selected" width="240"></td>
    <td align="center"><img src="https://raw.githubusercontent.com/lageorgem/ha-material-thermostat-card/main/assets/swing-modes.png" alt="Swing dropdown with Full Swing selected" width="240"></td>
    <td align="center"><img src="https://raw.githubusercontent.com/lageorgem/ha-material-thermostat-card/main/assets/preset-modes.png" alt="Preset tile with eco selected and the preset leaf icon under the dial number" width="240"></td>
  </tr>
</table>

<table>
  <tr>
    <td align="center" width="50%"><code>climate-swing-modes</code> + <code>climate-swing-horizontal-modes</code><br><code>display: tile</code></td>
    <td align="center" width="50%">Default swing icons<br><code>display: icons</code></td>
  </tr>
  <tr>
    <td align="center"><img src="https://raw.githubusercontent.com/lageorgem/ha-material-thermostat-card/main/assets/swing-both.png" alt="Living Room AC cooling with an HVAC icon row and Vertical and Horizontal swing tiles side by side" width="320"></td>
    <td align="center"><img src="https://raw.githubusercontent.com/lageorgem/ha-material-thermostat-card/main/assets/swing-icons.png" alt="AC swing icon rows using default mt: icons: all nine vertical positions with Fixed Middle selected, and horizontal swing with Swing selected" width="320"></td>
  </tr>
</table>

### Water heater controls

`water-heater-operation-modes` uses the same display, label, width, include, order and
per-option overrides as climate selectors. Its default order follows Home Assistant's
canonical operation-mode order, with an icon for each mode.

<table>
  <tr>
    <td align="center" width="34%"><code>display: icons</code> + away tile</td>
    <td align="center" width="33%"><code>display: dropdown</code></td>
    <td align="center" width="33%"><code>display: tile</code></td>
  </tr>
  <tr>
    <td align="center"><img src="https://raw.githubusercontent.com/lageorgem/ha-material-thermostat-card/main/assets/water-heater.png" alt="Hot water tank in eco mode with a halo dial at target 55, current temperature 47.5, an eco leaf, operation-mode icons and an away tile" width="240"></td>
    <td align="center"><img src="https://raw.githubusercontent.com/lageorgem/ha-material-thermostat-card/main/assets/water-heater-gas.png" alt="Gas boiler heating with a Google-style dial at target 60, current temperature 44, a gas flame and a Mode dropdown" width="240"></td>
    <td align="center"><img src="https://raw.githubusercontent.com/lageorgem/ha-material-thermostat-card/main/assets/water-heater-tile.png" alt="Heat pump cylinder at target 50 with a neutral minimal dial, a Mode tile showing heat pump and an Away tile showing on" width="240"></td>
  </tr>
</table>

When this feature is added, the active operation-mode icon (e.g. an eco leaf or gas
flame) also appears under the temperature, like the climate preset icon. It follows
the feature's per-option `icon` and `color` overrides; an empty `icon` hides it.
It is not shown when the heater is off, unavailable or unknown.

`water-heater-away-mode` accepts only `display: icons|tile`, `label`, `width` and `alignment`.
It appears only when away mode is supported and `away_mode` is a known `on`/`off` value;
selection toggles that value using a boolean `away_mode` service payload. It is not an
operation-mode selector and does not accept `include`, `order` or `options`.

### Option overrides

`climate-*`, `water-heater-operation-modes` and `input-select` accept an `options:` list to customize how each underlying value is
shown. Unlisted values keep their defaults, including the bundled `mt:` icons for recognised swing modes.

| Feature key | Type            | Description                                                                                                                                                                                                                                        |
| ----------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `order`     | list of strings | Optional, e.g. `[heat, cool, 'off']`. Available values listed here come first in this order; unlisted values follow in their natural order. Unknown values are ignored. The visual editor saves this key when you drag options to reorder them     |
| `include`   | list of strings | Climate and water-heater operation-mode selectors only, not `input-select`. A non-empty list excludes unlisted values; `[]` applies no filter. `order` is applied afterward: listed allowed values first, then remaining values in `include` order |

```yaml
- type: climate-hvac-modes
  order: [heat, cool, 'off']
  options:
    - value: heat
      label: Heating
      color: '#ff8100'
```

| Key     | Type    | Description                                                                                            |
| ------- | ------- | ------------------------------------------------------------------------------------------------------ |
| `value` | string  | The underlying option value to override **(required)**                                                 |
| `label` | string  | Replacement display label                                                                              |
| `icon`  | string  | Replacement icon (`mdi:…` or `mt:…`)                                                                   |
| `hide`  | boolean | Remove this option from the row                                                                        |
| `color` | string  | Optional CSS accent color, e.g. `'#ff8100'` — see **Colors** below. Unset uses the theme/default color |

> **Colors.** In the visual editor a **color pill** attaches to the left of each option's title. It
> defaults to the color the theme would use — the **HVAC mode colors** (heat→orange, cool→blue…) are
> pre‑picked for HVAC modes, and **`eco`‑like presets are green / `sleep`‑like presets blue** — and
> can be reset back to that default at any time. Where a chosen color shows up:
>
> - **HVAC modes** — feeds the **dial** (halo, temperature, mode icon) for the active mode, and the tile tint in `tile` display.
> - **Preset modes** — feeds the **preset icon under the dial number**, and the tile tint in `tile` display.
> - **Water heater operation modes** — feeds the **operation-mode icon under the dial number**, and the tile tint in `tile` display.
> - **Any other selector** (fan/swing/`input-select`/`switch-group`) — applies to the **tile tint in `tile` display** only.
>
> The picker is shown for HVAC and preset modes in any display, and for every selector in `tile` display.
>
> All `color` keys (`options[].color`, `EntityItem.color`, and `entity-tile.color`) accept any CSS color:
> hex (`'#8e24aa'`), named (`purple`), `rgb(142, 36, 170)`, or `var(--primary-color)`. The editor writes hex.

<p align="center">
  <img src="https://raw.githubusercontent.com/lageorgem/ha-material-thermostat-card/main/assets/option-overrides.png" alt="HVAC label and color overrides, a fan-speed dropdown and custom swing icons with hidden options" width="400">
</p>

### `input-select`

An `input_select` entity as a selector — the same three display modes as the climate selectors:

<table>
  <tr>
    <td align="center" width="34%"><code>display: icons</code></td>
    <td align="center" width="33%"><code>display: dropdown</code></td>
    <td align="center" width="33%"><code>display: tile</code></td>
  </tr>
  <tr>
    <td align="center">
      <img src="https://raw.githubusercontent.com/lageorgem/ha-material-thermostat-card/main/assets/input-select-icons.png" alt="Fan-speed input_select as an icon row with medium selected" width="240">
    </td>
    <td align="center">
      <img src="https://raw.githubusercontent.com/lageorgem/ha-material-thermostat-card/main/assets/input-select-dropdown.png" alt="Fan-speed input_select as a dropdown with medium selected" width="240">
    </td>
    <td align="center">
      <img src="https://raw.githubusercontent.com/lageorgem/ha-material-thermostat-card/main/assets/input-select-tile.png" alt="Fan-speed input_select as a tile with medium selected" width="240">
    </td>
  </tr>
</table>

```yaml
- type: input-select
  entity: input_select.ac_preset
  display: icons
  order: [comfort, away]
  options:
    - value: comfort
      label: Comfort
      icon: mdi:sofa
    - value: away
      icon: mdi:home-export-outline
```

> A feature‑level `label` renders as a **title above the control** (in `icons`/`dropdown` modes) or as
> the **tile's title line** (in `tile` mode), and doubles as the control's accessible name; with
> `display: dropdown` it is also the dropdown's placeholder. Per‑option `label`s (in the `options:`
> list) rename individual values.

### `switch-group`

Mutually‑exclusive switches that behave like a selector — picking one turns the others off first, then turns on the
chosen one. Items use the [`EntityItem`](#entityitem) shape. Renders in the same three display modes as the selectors:

<table>
  <tr>
    <td align="center" width="34%"><code>display: icons</code></td>
    <td align="center" width="33%"><code>display: dropdown</code></td>
    <td align="center" width="33%"><code>display: tile</code></td>
  </tr>
  <tr>
    <td align="center">
      <img src="https://raw.githubusercontent.com/lageorgem/ha-material-thermostat-card/main/assets/switch-group-icons.png" alt="Eco, Boost and Lamp switch group as an icon row with Eco selected" width="240">
    </td>
    <td align="center">
      <img src="https://raw.githubusercontent.com/lageorgem/ha-material-thermostat-card/main/assets/switch-group-dropdown.png" alt="Switch group as a dropdown with Eco selected" width="240">
    </td>
    <td align="center">
      <img src="https://raw.githubusercontent.com/lageorgem/ha-material-thermostat-card/main/assets/switch-group-tile.png" alt="Switch group as a preset tile with Eco selected" width="240">
    </td>
  </tr>
</table>

```yaml
- type: switch-group
  display: icons
  entities:
    - { entity: switch.eco, label: Eco, icon: mdi:leaf }
    - { entity: switch.boost, label: Boost, icon: mdi:rocket-launch }
```

### `switch-list`

Independent toggles in a row (multiple can be on at once).

<p align="center">
  <img src="https://raw.githubusercontent.com/lageorgem/ha-material-thermostat-card/main/assets/switch-list.png" alt="Independent Eco, Boost and Lamp toggles, with Eco and Lamp on" width="400">
</p>

```yaml
- type: switch-list
  entities:
    - { entity: switch.lamp, icon: mdi:lamp }
    - { entity: switch.purifier, icon: mdi:air-purifier }
```

### `button-list`

Independent presses for buttons, scenes, or scripts. **Note:** the key is `items` (not `entities`).

<p align="center">
  <img src="https://raw.githubusercontent.com/lageorgem/ha-material-thermostat-card/main/assets/button-list.png" alt="Quick actions button list with a Restart action" width="400">
</p>

```yaml
- type: button-list
  items:
    - { entity: button.ac_restart, icon: mdi:restart }
    - { entity: scene.movie, label: Movie, icon: mdi:movie }
```

### `sensor-list`

Read‑only rows of an (optional) icon, a customizable title, and the entity's current value —
matching the Google Home app's sensor list. A lighter alternative to a stack of `entity-tile`s
when you just want to read several values. Uses `items` (not `entities`).

<p align="center">
  <img src="https://raw.githubusercontent.com/lageorgem/ha-material-thermostat-card/main/assets/sensor-list.png" alt="Read-only indoor temperature and humidity rows with icons and current values" width="400">
</p>

```yaml
- type: sensor-list
  label: Sensors
  items:
    - { entity: sensor.indoor_temperature, label: Indoor Temperature }
    - { entity: sensor.indoor_humidity, label: Indoor Humidity, icon: mdi:water-percent }
    - { entity: sensor.outdoor_temperature, label: Outdoor }
```

#### `EntityItem`

Used by `switch-group.entities`, `switch-list.entities`, `button-list.items`, and `sensor-list.items`:

| Key      | Type   | Default           | Description                                                                                                                                                                                                               |
| -------- | ------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `entity` | string | —                 | Entity id **(required)**                                                                                                                                                                                                  |
| `label`  | string | friendly name     | Display label                                                                                                                                                                                                             |
| `icon`   | string | varies by feature | Optional, e.g. `mdi:leaf`. `sensor-list`: no icon unless set; `switch-group`: explicit or entity icon; `switch-list`/`button-list`: explicit → entity icon → fixed `mdi:toggle-switch-variant` / `mdi:gesture-tap-button` |
| `color`  | string | theme accent      | Optional CSS color, e.g. `'#4caf50'`; accent of the selected switch in `switch-group` with `display: tile`. Ignored by `switch-list`, `button-list`, and `sensor-list`                                                    |

### `entity-tile`

A rounded tile (à la Google Home) showing an icon, title, and a secondary line (sensor value, or on/off). Runs
`tap_action` if set, otherwise the entity's natural action. Two display modes:

<table>
  <tr>
    <td align="center" width="50%"><code>display: tile</code></td>
    <td align="center" width="50%"><code>display: icon</code></td>
  </tr>
  <tr>
    <td align="center">
      <img src="https://raw.githubusercontent.com/lageorgem/ha-material-thermostat-card/main/assets/entity-tile-tile.png" alt="Temperature and humidity tiles showing icons, titles and values" width="240">
    </td>
    <td align="center">
      <img src="https://raw.githubusercontent.com/lageorgem/ha-material-thermostat-card/main/assets/entity-tile-icon.png" alt="Temperature and humidity tiles as bare centered icons" width="240">
    </td>
  </tr>
</table>

| Option       | Type             | Default              | Description                                                                                                                       |
| ------------ | ---------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `entity`     | string           | —                    | The entity **(required)**                                                                                                         |
| `name`       | string           | friendly name        | Tile title                                                                                                                        |
| `icon`       | string           | entity / domain icon | Tile icon                                                                                                                         |
| `color`      | string           | theme / on‑accent    | Optional CSS color, e.g. `'#8e24aa'`; **on-state** accent only in `tile` display. Does not change the off look or `display: icon` |
| `display`    | `tile` \| `icon` | `tile`               | `tile` shows icon + title + value; `icon` shows just a centered icon at the same height                                           |
| `tap_action` | object           | natural action       | Optional, e.g. `{ action: toggle }`; supported actions below (YAML-only)                                                          |
| `width`      | positive number  | `50` (both displays) | Optional percentage, e.g. `50`; rounded to the nearest 10, then clamped to 10–100. Non-positive/non-numeric uses `50`             |

> The legacy `compact: true` flag still works and maps to `display: icon`.

| `tap_action.action`                      | Supported fields / behavior                                                                                                                                                                                                 |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `none`                                   | No action                                                                                                                                                                                                                   |
| `more-info`                              | Open more-info; optional `entity` (string, e.g. `sensor.living_humidity`) opens a different entity                                                                                                                          |
| `toggle`                                 | Toggle the tile's entity                                                                                                                                                                                                    |
| `url`                                    | `url_path` (string, required to open a URL, e.g. `https://www.home-assistant.io`)                                                                                                                                           |
| `navigate`                               | `navigation_path` (string, required to navigate, e.g. `/lovelace/climate`)                                                                                                                                                  |
| `perform-action` / legacy `call-service` | `perform_action` or legacy `service` (string, required, e.g. `light.turn_on`); optional `data` or legacy `service_data` (object, e.g. `{ brightness: 128 }`) and `target` (object, e.g. `{ entity_id: light.living_room }`) |
| `default` / omitted `tap_action`         | The entity's natural action below                                                                                                                                                                                           |

> `tap_action` is YAML-only, not available in the visual editor. `confirmation`, `url_target`,
> `navigation_replace`, hold actions, and double-tap actions are not supported.
> Entity tiles use the same [off-state values](#climate-selectors-hvac--fan--swing--preset) as selector tiles,
> and are forced to the off look when the card's climate entity is off.

**Default tap action** (when `tap_action` is unset or `action: default`): press for `button`/`input_button`/`scene`/`script`,
toggle for `switch`/`light`/`fan`/`input_boolean`, and more‑info otherwise.

```yaml
- type: entity-tile
  entity: sensor.living_humidity
  name: Humidity
  icon: mdi:water-percent

- type: entity-tile
  entity: switch.fan_lamp
  color: '#8e24aa'
  tap_action:
    action: toggle

# Icon-only tiles — two per row at 50% each
- type: entity-tile
  entity: sensor.living_humidity
  icon: mdi:water-percent
  display: icon
  width: 50
```

### `comfort`

A single status line that answers two questions: **does the room feel comfortable right now**, and
**how long until it does** — then, once it is comfortable, **how long until the target temperature is
reached**. It reuses the [feels‑like sensors](#feels-like-temperature) (no pickers of its own) and can
be added **only once in the visual editor**. YAML does not enforce uniqueness.

<p align="center">
  <img src="https://raw.githubusercontent.com/lageorgem/ha-material-thermostat-card/main/assets/comfort.png" alt="Cooling dial with HVAC controls and a comfort forecast based on temperature and humidity history" width="400">
</p>

#### How comfort is determined

Comfort is **calculated, not configured** — there's no `comfort_min`/`comfort_max`. The card uses the
building‑science standard, the **ASHRAE 55 / ISO 7730 PMV model** (Fanger's _Predicted Mean Vote_),
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

| Option            | Type            | Default | Description                                                                                                             |
| ----------------- | --------------- | ------- | ----------------------------------------------------------------------------------------------------------------------- |
| `show_target_eta` | boolean         | `false` | When comfortable, also show the time until the target temperature is reached                                            |
| `width`           | positive number | `100`   | Optional percentage, e.g. `100`; rounded to the nearest 10, then clamped to 10–100. Non-positive/non-numeric uses `100` |

```yaml
feels_like:
  temperature: sensor.living_room_temperature
  humidity: sensor.living_room_humidity
features:
  - type: comfort
    show_target_eta: true
```

> The row shows a verdict **whenever the sensors read — including when the climate is off** (just
> without a forecast). It is hidden when the feels‑like sensors aren't set, the climate entity is
> missing or its state is empty/unavailable/unknown, humidity has no reading, or neither the
> temperature sensor nor the climate's `current_temperature` has a reading. **`null`, empty/blank
> and non‑numeric values mean “no reading”, never 0**, for sensor readings, `current_temperature`
> and target temperatures. If the temperature sensor has no reading, the row uses the climate's
> `current_temperature` when available.
>
> The temperature sensor's current reading and recorder history use its `unit_of_measurement`
> (**°C, °F or K**); without a unit, they use Home Assistant's temperature unit. History is assumed
> to use the sensor's **current unit**. The climate's `current_temperature` fallback and targets
> (`temperature`, `target_temp_low` and `target_temp_high`) use Home Assistant's temperature unit.
> All comfort calculations run in °C internally; **target and plateau temperatures in the comfort
> text use Home Assistant's temperature unit** (the examples above show a Celsius installation).

## Layout & responsiveness

In Sections view the card reports `getGridOptions`: **12 columns**, **6 minimum columns**,
and **auto rows**.

Feature `width` is a **percentage of the card**. YAML accepts any positive number, rounds it to the
nearest 10, then clamps it to 10–100 (e.g. `width: 46` becomes `50`). Non-positive/non-numeric
values use the type's default. The same config works
in both **sections** and **masonry** views, since sizing is measured from the card's actual width.

| Concept                           | Behavior                                                                                                                                                                                                                                                                                                  |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Width = % of the card**         | `width: 50` is half the card; unset = `50` for `entity-tile` (including `icon`), `100` for all others (including selector `display: tile`).                                                                                                                                                               |
| **Rows fill, and wrap by width**  | Features pack left to right; two `width: 50` fill a row **50/50**, and the next feature **wraps** to a new row when it doesn't fit (e.g. `50 + 60` → the `60` drops down).                                                                                                                                |
| **A narrow feature stays narrow** | A `width: 30` feature is 30% of the card — it doesn't stretch to fill its row.                                                                                                                                                                                                                            |
| **Side‑by‑side (wide)**           | On a wide card where every feature is **< 100%**, the feature area takes the **widest feature's %** on the right and the **fixed‑size dial is centered** in the space on the left. Otherwise the card **stacks** (dial on top). Give your features explicit `width < 100` to get the side‑by‑side layout. |
| **Icon overflow**                 | Icon rows keep their icon size and **scroll horizontally** instead of squishing.                                                                                                                                                                                                                          |

The `width` control in the visual editor is a slider (**10–100%**, dots on the tens). Leave it unset
for full width (all types except `entity-tile`) or the 50% default (`entity-tile`, both displays).
Beside it, a **Left / Centre / Right** pill uses familiar text-alignment icons to position
the **whole feature**, not its text or chips. YAML uses `alignment: left|center|right`.

Alignment uses unused space in the current feature-grid row without changing width or
reordering features. Only rows with **one visible feature** use it; hidden comfort
features do not occupy a place in row packing. A `width: 100` feature has no spare
space, so alignment has no effect. Wide side-by-side behavior is unchanged:
alignment is relative to the **feature sidebar**, not the whole card. A lone feature
with the widest configured width fills that sidebar, leaving no space to align within.

<p align="center">
  <img src="https://raw.githubusercontent.com/lageorgem/ha-material-thermostat-card/main/assets/wide.png" alt="Wide layout with the dial on the left and HVAC, fan, swing and preset controls on the right, each configured at 50% width" width="760">
</p>

On a wide card, features with explicit widths below 100% sit beside the dial instead of below it.

## AC swing icons (`mt:`)

The card registers a set of **AC swing icons** with Home Assistant, usable anywhere an icon is
(this card's overrides, other cards, the icon picker) as `mt:<name>`. Preview the SVGs in
[`icons/`](https://github.com/lageorgem/ha-material-thermostat-card/tree/main/icons/).

These are the **default icons** for vertical and horizontal swing selectors, chosen from the
mode name without configuration:

- Fixed positions (`Top`, `Fixed Top-Middle`, `Upper`, `Lower`, `Bottom`, `Left`, `Center`,
  `Right`, etc.) use the matching fixed-position icon.
- Partial ranges (`Swing Top`, `Swing Middle`, `Swing Left`, etc.) use the matching range icon.
- Full swing (`on`, `swing`, `full`, `auto`, `Full Swing`, `wide`, or HA's standard `vertical`)
  uses the full-swing icon. HA's `horizontal` value in a vertical list uses horizontal full swing.
- `off` and `both` keep their previous MDI icons; unrecognised names keep the previous MDI fallbacks.

Each icon shows **five positions** (vertical cones top→bottom, or horizontal rays left→right). Active
positions are drawn solid (**dark**); the rest are dimmed (**gray**) for context — a **fixed**
position selects one, a **partial swing** selects three, and **full swing** selects all five.

| Group                  | Names                                                                                                                                                                       |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vertical — fixed**   | `swing-vertical-fixed-top`, `swing-vertical-fixed-upper-middle`, `swing-vertical-fixed-middle`, `swing-vertical-fixed-lower-middle`, `swing-vertical-fixed-bottom`          |
| **Vertical — swing**   | `swing-vertical-top` (top 3), `swing-vertical-middle` (mid 3), `swing-vertical-bottom` (bottom 3), `swing-vertical-full`                                                    |
| **Horizontal — fixed** | `swing-horizontal-fixed-left`, `swing-horizontal-fixed-left-middle`, `swing-horizontal-fixed-middle`, `swing-horizontal-fixed-right-middle`, `swing-horizontal-fixed-right` |
| **Horizontal — swing** | `swing-horizontal-left` (left 3), `swing-horizontal-middle` (mid 3), `swing-horizontal-right` (right 3), `swing-horizontal-full`                                            |

Per-option `icon` overrides still win. Use them only to change a default — for example,
to show a fixed-middle icon for `off` instead of its MDI icon:

```yaml
- type: climate-swing-modes
  options:
    - value: 'off'
      icon: mt:swing-vertical-fixed-middle
```

> Searchable in the icon picker — type **`mt:`** (or `swing`, `ac`, `vane`). You can also just type
> the full `mt:…` name; the icons render anywhere `ha-icon` is used.

## Theming

The card reads Material 3 system tokens and falls back to standard Home Assistant theme variables,
so it looks native under `material-you-theme` and remains usable under any theme.
Theme-only changes apply even when no entity state changes.

| Token (read)                            | Falls back to                                                                                                                                       | Used for                                               |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `--md-sys-color-primary`                | `--primary-color`                                                                                                                                   | Selected chips / accents                               |
| `--md-sys-color-on-primary`             | `#fff`                                                                                                                                              | Selected chip foreground                               |
| `--md-sys-color-surface-container`      | 8% on-surface mixed into card background¹                                                                                                           | Chip & tile backgrounds                                |
| `--md-sys-color-surface-container-high` | 11% on-surface mixed into card background¹                                                                                                          | Dropdown menus                                         |
| `--md-sys-color-secondary-container`    | `rgba(103, 80, 164, 0.14)`                                                                                                                          | Selected dropdown option background                    |
| `--md-sys-color-on-secondary-container` | `--primary-text-color` → `#1d192b`                                                                                                                  | Selected dropdown option foreground                    |
| `--md-sys-color-on-surface`             | `--primary-text-color`                                                                                                                              | Primary text                                           |
| `--md-sys-color-on-surface-variant`     | `--secondary-text-color`                                                                                                                            | Secondary text & icons                                 |
| `--md-sys-color-error`                  | `--error-color` → `#b3261e`                                                                                                                         | Error color                                            |
| `--md-sys-shape-corner-extra-large`     | `28px`                                                                                                                                              | Card corner radius                                     |
| `--md-sys-shape-corner-large`           | `16px`                                                                                                                                              | Off-tile corners                                       |
| `--md-sys-shape-corner-full`            | `9999px`                                                                                                                                            | Pills / chips                                          |
| `--md-sys-typescale-title-large-size`   | `20px` (card title); `22px` (dial temperature unit max)                                                                                             | Card title / dial temperature unit                     |
| `--md-sys-typescale-title-medium-size`  | `16px`                                                                                                                                              | Dial mode label / marker & range labels (maximum size) |
| `--md-sys-typescale-display-large-size` | `64px`                                                                                                                                              | Dial number (maximum size)                             |
| `--md-sys-typescale-label-large-size`   | `13px` (section labels); `14px` (chips)                                                                                                             | Selector / sensor-list headings and chip text          |
| `--md-sys-typescale-label-medium-size`  | `13px`                                                                                                                                              | Tile title                                             |
| `--md-sys-typescale-body-large-size`    | `16px`                                                                                                                                              | Tile value / dropdown text                             |
| `--md-sys-typescale-body-medium-size`   | `14px`                                                                                                                                              | Sensor list / comfort text                             |
| `--md-sys-motion-*`                     | M3 defaults                                                                                                                                         | Animation timing / easing                              |
| `--state-climate-*-color`               | `cool`: `#2b9af9`; `heat`: `#ff8100`; `heat_cool`: `#009688`; `auto`: `#e5c454`; `dry`: `#efbd07`; `fan_only`: `#8a8a8a`; `off`: on-surface-variant | Dial color per HVAC mode                               |

> ¹ Card background: `--ha-card-background` → `--card-background-color` → `#f3edf7`.
> On-surface: `--md-sys-color-on-surface` → `--primary-text-color` → `#1c1b1f`.

## Visual editor

Most options above are editable from the card's **visual editor** (`tap_action` and structured names are YAML-only): a base
form (entity, name, theme), two collapsible sections, and a **drag‑sortable list of features**:

- **Style** — dial style, "show current temperature as primary", and font.
- **Feels-like temperature** — labelled, clearable temperature and humidity sensor pickers, plus
  the option to show the computed [feels‑like](#feels-like-temperature) value as the current temperature.

Each feature row expands to its own editor — per‑option **label / icon / color / hide** for selectors,
entity pickers for lists, a `width` slider, and an icons / dropdown / tile display toggle. **Options and list items are
drag‑to‑reorder** too (the order is saved to the config), so you control the order icons appear in. The **"Add
feature"** menu offers controls for the selected domain: climate selectors the entity exposes,
or water-heater operation/away controls when supported. Each domain-specific control can be added
once. `comfort` and feels-like settings are climate-only. These uniqueness limits (including
`comfort`) apply only to the visual editor, not YAML. Existing structured names are preserved.

The editor uses **custom rounded search pickers** that match the card's aesthetic rather than Home Assistant's stock
combobox:

- an **entity picker** — a pill that opens one searchable, domain‑filtered dropdown;
- an **icon picker** — the same searchable panel over a curated MDI set **plus every registered custom icon pack**
  (including this card's [`mt:` swing icons](#ac-swing-icons-mt)), with free‑text
  `mdi:<name>` entry for the long tail, and a **"No icon"** option;
- a **color pill** that previews the current accent and resets to the theme/mode default.

## Development

See [Contributing](CONTRIBUTING.md) for local setup, verification and PR guidance.

| Command                             | Description                                                                                                                                                 |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm install`                       | Install dependencies                                                                                                                                        |
| `npm run build`                     | Bundle to `dist/material-thermostat-card.js`                                                                                                                |
| `npm run watch`                     | Rebuild on change                                                                                                                                           |
| `npm run typecheck`                 | `tsc --noEmit`                                                                                                                                              |
| `npm run lint` / `npm run lint:fix` | ESLint                                                                                                                                                      |
| `npm run format`                    | Prettier                                                                                                                                                    |
| `npm test`                          | Unit/component tests (real Chrome) with coverage                                                                                                            |
| `npm run test:watch`                | Unit tests in watch mode                                                                                                                                    |
| `npm run test:e2e`                  | End-to-end tests against the built bundle (run `npm run build` first)                                                                                       |
| `node tools/gen-icons.mjs`          | Regenerate the `mt:` icon set into `src/icons.generated.ts`                                                                                                 |
| `node dev/push-dashboard.mjs`       | Publish the showcase cards (`dev/showcase.mjs`) to a `material-thermostat` dashboard on your HA (needs `HA_URL`, `HA_TOKEN`; `--dry-run` prints the config) |
| `node dev/ha-shots.mjs`             | Regenerate README screenshots from `dev/showcase.mjs` (needs `npm run build`, `HA_URL`, `HA_TOKEN`)                                                         |

### Testing

The suite runs in a real browser (Chrome) — web components need a real DOM (shadow roots,
pointer capture, SVG, the Web Animations API, `ResizeObserver`).

- **Unit / component tests** (`test/unit/`) use [`@web/test-runner`](https://modern-web.dev/docs/test-runner/overview/)
  - [`@open-wc/testing`](https://open-wc.org/docs/testing/testing-package/), with V8 coverage mapped back
    to the TypeScript sources. Coverage is gated at **100%** (statements / branches / functions / lines).
- **End-to-end tests** (`e2e/`) use [Playwright](https://playwright.dev/) to drive the **built bundle**
  (`dist/material-thermostat-card.js`) against a mock `hass`, exercising full user journeys (mode
  selection, dropdowns, the temperature dial, the switch group, more-info).

Both use the system Chrome locally (no browser download); CI installs Playwright's Chromium.
`npm run test:e2e:install` fetches it if you want to run e2e with the bundled browser.

`dist/` is committed and checked by CI — **run `npm run build` and commit the result** with any
source change. Open `dev/index.html` (after a build, served over HTTP) for a quick layout/interaction
harness — note that Home Assistant's web components are stubbed there, so icons render as dots; always
verify final fidelity inside Home Assistant.

> 🤖 **Working on this repo with an AI agent?** Start with [`.ai/`](https://github.com/lageorgem/ha-material-thermostat-card/tree/main/.ai/) — it documents the
> architecture, the dial internals, the layout/grid system, the feature system, the icon generator,
> and the non‑obvious gotchas.

## License

[MIT](https://github.com/lageorgem/ha-material-thermostat-card/blob/main/LICENSE)
