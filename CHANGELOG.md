# Changelog

All notable changes to the **Material Thermostat Card** are documented here. This
project adheres to [Semantic Versioning](https://semver.org/) and the format of
[Keep a Changelog](https://keepachangelog.com/).

## [1.0.0] — 2026-06-28

First stable release. A Material 3 Expressive thermostat card for Home Assistant —
a draggable Google Home / Nest‑style dial plus a fully configurable stack of
climate and custom‑entity controls, designed to pair with `material-you-theme` and
to degrade gracefully under any Home Assistant theme.

### The dial

- **Draggable circular dial** (custom SVG, 270° Nest‑style arc): drag the ring,
  tap a point, use `+/−`, or arrow keys; exposed as an ARIA `slider`.
- **Dual setpoint** for `heat_cool` — two independent low/high handles with a
  range band.
- **Current‑temperature marker** on the ring, with an optional **"show current as
  primary"** mode that makes the current reading the large centre number and moves
  the target onto the setpoint marker.
- **Action‑accurate colouring**: the dial, halo, and number are coloured by the
  active `hvac_action` (falling back to the mode); the fill only takes the mode
  colour when the system is actually heating/cooling, and stays neutral grey when
  idle. Colours **cross‑fade** and the temperature segment **slides** on mode and
  power changes.
- **Optimistic, debounced** `climate.set_temperature` so dragging never spams the
  backend.

### Feels‑like temperature

- Point the card at a **temperature** + **humidity** sensor to compute the
  **heat index** ("feels like"); with `show_as_current` it replaces the dial's
  current temperature. These sensors are shared with the comfort feature.

### Comfort & time‑to‑comfortable

- A read‑once **`comfort`** feature that judges the room with the building‑science
  standard — the **ASHRAE 55 / ISO 7730 PMV model** (Fanger), validated against
  the ISO 7730 Annex D table — so the verdict accounts for temperature, humidity,
  clothing, and activity, plus an absolute‑humidity cap for muggy rooms.
- **Clothing is inferred from the room temperature** (dynamic clothing), not the
  HVAC mode, so the verdict doesn't flip between heating and cooling at the same
  temperature (comfort band ≈ 21–27 °C).
- **Forecasts time‑to‑comfortable** from the current heating/cooling session only
  (history since the climate's `last_changed`), using a Newton's‑law curve fit
  recovered by integration (robust to coarse recorder data). It honestly reports a
  target it **won't reach**, and once comfortable switches to a Nest‑style time to
  the setpoint ("15m until cooled to 24 °C").
- ETAs are compact (`7m` / `1h` / `2hr+`) and **count down between sensor updates**,
  resolving to "Room should be comfortable soon" near zero. The verdict shows even
  when the climate is **off** (just without a forecast).

### Configurable feature rows

- Nine feature types: **HVAC / fan / swing** climate selectors, **`input_select`**,
  **switch group** (mutually exclusive), **switch list**, **button list**,
  **entity tile**, and **comfort**.
- Selectors render as **M3 icon chips** or a self‑contained **dropdown**.
- **Per‑option label / icon / hide** overrides and **drag‑to‑reorder** for options
  and list items, all from the visual editor.

### Layout, theming & icons

- **Percentage widths** (10–100%) that fill and wrap correctly at any card size,
  with an automatic **side‑by‑side** wide layout.
- **Material 3** design tokens with graceful Home Assistant theme fallbacks.
- A bundled **`mt:` AC swing icon set**, searchable in the icon picker.
- **Suggested for climate entities** in the card picker (Home Assistant 2026.6+).

### Visual editor

- A drag‑sortable feature list, per‑feature sub‑editors, a width slider
  (`mt-grid-slider`), and an icons/dropdown toggle. The "Add feature" menu only
  offers selectors the entity exposes, and add‑once features once.

### Quality

- **100% test coverage** (statements / branches / functions / lines), gated in CI,
  across a real‑Chrome unit/component suite plus Playwright e2e against the built
  bundle.

[1.0.0]: https://github.com/lageorgem/ha-material-thermostat-card/releases/tag/v1.0.0
