# Changelog

All notable changes to the **Material Thermostat Card** are documented here. This
project adheres to [Semantic Versioning](https://semver.org/) and the format of
[Keep a Changelog](https://keepachangelog.com/).

## [1.10.0] — 2026-10-19

### Added

- **Water heaters** as primary entities (`water_heater.*`), using
  `water_heater.set_temperature`. Climate-only selectors, comfort and feels-like
  settings are ignored for water heaters; custom-entity controls still work.
- **Horizontal swing** (`climate-swing-horizontal-modes`) via
  `climate.set_swing_horizontal_mode`.
- **Water heater operation modes** (`water-heater-operation-modes`) via
  `water_heater.set_operation_mode`, with HA's canonical ordering and mode icons.
- **Water heater away toggle** (`water-heater-away-mode`) via
  `water_heater.set_away_mode`, with `display: icons|tile`; shown only when the
  entity supports away mode and reports a known on/off away state.
- **Selector allow-lists** (`include: [...]`): only listed available values are
  shown, in order, on climate/operation/input-select selectors.
- **Stock thermostat YAML compatibility**: change the card type to
  `custom:material-thermostat-card`; stock `style: icons|dropdown` and
  `hvac_modes`, `preset_modes`, `fan_modes`, `swing_modes`,
  `swing_horizontal_modes`, `operation_modes` are translated to `display` and
  `include`. Explicit custom keys take precedence.
- **Structured HA names** in `name:` (for example,
  `[{type: entity}, {type: device}]`), rendered through HA where supported;
  YAML-only, preserved by the visual editor, with entity-name fallback.
- **Optional state label** (`show_state_label: true`, default `false`) above the
  dial number: localized HVAC action or state. Deliberate stock differences remain:
  the arc fills from current to target rather than by mode, and the label is opt-in.
- **Sections sizing** via `getGridOptions`: 12 columns, minimum 6, auto rows.
- **Live-HA stock-parity QA harness** in `dev/qa/`, with paired stock/custom
  fixtures, service journeys and English/German checks; opt-in, not a CI gate.

### Changed

- **Capability-driven targets**: `TARGET_TEMPERATURE` and
  `TARGET_TEMPERATURE_RANGE` determine single versus dual controls, including
  dual setpoints in `auto`. A single target wins when both are available; entities
  without a settable target have a read-only dial.
- **HA-backed localization** for mode/preset/fan/swing/operation labels, state
  text and “Unavailable”; user label overrides still win. Numbers follow HA's
  number-format setting (including decimal commas). Editor strings remain English.
- **Domain-aware visual editor** accepts climate and water heater entities and
  offers their supported controls, including the state-label option.
- **Accessibility**: labelled card group, PageUp/PageDown/Home/End dial keys, and
  independently keyboard-operable dual handles.
- **Default step** is 1 °F or 0.5 °C when the entity reports no valid step.

### Fixed

- Entity selectors are disabled while their entity is unavailable.
- Rejected or ignored setpoint changes revert to the device value after about 3 s.
- Theme-only changes now apply without requiring an entity state update.

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

[1.10.0]: https://github.com/lageorgem/ha-material-thermostat-card/releases/tag/v1.10.0
[1.0.0]: https://github.com/lageorgem/ha-material-thermostat-card/releases/tag/v1.0.0
