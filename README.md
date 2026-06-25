# Material Thermostat Card

A [Home Assistant](https://www.home-assistant.io/) Lovelace **thermostat card** built for
**Material 3 Expressive**, designed to pair with
[Nerwyn's `material-you-theme`](https://github.com/Nerwyn/material-you-theme) and inspired by the
Google Home / Nest thermostat UI.

It does everything the stock thermostat card does — a draggable temperature dial, current
temperature, mode/fan/swing selectors — and adds **customizable labels & icons** per option plus
**custom-entity selectors** (input_select, switch group/list, button list, entity tiles).

> **Status: early bootstrap (v0.1).** The base card and climate HVAC/fan/swing selectors with
> label/icon customization are implemented. The custom-entity feature types are on the roadmap
> below.

## Features

- 🎯 Draggable circular temperature dial (custom SVG, themed by HVAC mode/action)
- 🌡️ Current temperature display, with an optional "show current as primary" mode
- ➕➖ Step buttons, keyboard-accessible
- 🎨 Material 3 Expressive styling via `--md-sys-*` tokens (graceful fallback to HA theme vars)
- 🧩 Climate **HVAC / fan / swing** selectors as an **icon row** or **dropdown**
- ✏️ Per-option **label and icon** overrides, plus hide options — all from the visual editor

### Roadmap

- [ ] `input_select` selector (icons or dropdown)
- [ ] Switch **group** (mutually exclusive; switches off others, then on the selected — off before on)
- [ ] Switch **list** (independent toggles in a row)
- [ ] Button **list** (independent `button.press`)
- [ ] Entity **tiles** (rounded cards for sensor / switch / button)
- [ ] Visual editors for each of the above
- [ ] Dual setpoint (`heat_cool`) support
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
