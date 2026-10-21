# Changelog

All notable changes to the **Material Thermostat Card** are documented here. This
project adheres to [Semantic Versioning](https://semver.org/) and the format of
[Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

- **Feature row alignment**: a Left / Centre / Right icon pill beside each width
  control, with optional `alignment: left|center|right` (default `left`). Positions
  the whole feature in unused space only when it is alone on its visible row;
  shared rows, widths, text and chip order remain unchanged.

## [1.10.1] — 2026-10-20

### Added

- Guided bug-report and feature-request forms, a pull request template, and a
  CONTRIBUTING guide ([c256885](https://github.com/lageorgem/ha-material-thermostat-card/commit/c256885)).

### Changed

- Quiet/silent fan modes now default to `mdi:power-sleep`, distinct from the
  low-speed fan icon ([#1](https://github.com/lageorgem/ha-material-thermostat-card/issues/1)).
  Explicit per-option icon overrides still take precedence.

### Fixed

- Climate and water-heater selector editors now preview and edit the last
  duplicate option override, matching the card. Saving coalesces duplicates;
  resetting an icon no longer resurrects a shadowed override
  ([3125e3e](https://github.com/lageorgem/ha-material-thermostat-card/commit/3125e3e)).

## [1.10.0] — 2026-10-19

### Added

- **Water heaters** as primary entities (`water_heater.*`), using
  `water_heater.set_temperature`. Climate-only selectors, comfort and feels-like
  settings are ignored for water heaters; custom-entity controls still work.
- **Horizontal swing** (`climate-swing-horizontal-modes`) via
  `climate.set_swing_horizontal_mode`.
- **Water heater operation modes** (`water-heater-operation-modes`) via
  `water_heater.set_operation_mode`, with HA's canonical ordering and mode icons.
  Adding the feature also shows the active mode's icon under the temperature,
  like the climate preset icon, following per-option `icon`/`color` overrides
  (an empty `icon` hides it). Hidden when the heater is off, unavailable or unknown.
- **Water heater away toggle** (`water-heater-away-mode`) via
  `water_heater.set_away_mode`, with `display: icons|tile`; shown only when the
  entity supports away mode and reports a known on/off away state.
- **Selector allow-lists** (`include: [...]`): only listed available values are
  shown on climate HVAC/preset/fan/swing/horizontal-swing and water-heater
  operation-mode selectors, not `input-select`. `include: []` applies no filter;
  `order` takes precedence over the allow-list's display order.
- **Stock thermostat YAML compatibility**: change the card type to
  `custom:material-thermostat-card`; stock `style: icons|dropdown` and
  `hvac_modes`, `preset_modes`, `fan_modes`, `swing_modes`,
  `swing_horizontal_modes`, `operation_modes` are translated to `display` and
  `include`. Explicit custom keys take precedence. Stock YAML containing
  `show_state_label` still loads; the key is ignored. The dial stays free of mode
  or action text; its arc fills from current to target rather than by mode.
- **Structured HA names** in `name:` (for example,
  `[{type: entity}, {type: device}]`), rendered through HA where supported;
  YAML-only, preserved by the visual editor, with entity-name fallback.
- **Sections sizing** via `getGridOptions`: 12 columns, minimum 6, auto rows.
- **Live-HA stock-parity QA harness** in `dev/qa/`, with paired stock/custom
  fixtures, service journeys and English/German checks; opt-in, not a CI gate.

### Changed

- Swing selectors default to the bundled `mt:` AC swing icons, matched to the
  mode name; per-option `icon` overrides still take precedence.
- **Capability-driven targets**: `TARGET_TEMPERATURE` and
  `TARGET_TEMPERATURE_RANGE` determine single versus dual controls, including
  dual setpoints in `auto`. A single target wins when both are available; entities
  without a settable target have a read-only dial.
- **HA-backed localization** for mode/preset/fan/swing/operation labels, state
  text and “Unavailable”; user label overrides still win. Numbers follow HA's
  number-format setting (including decimal commas). Editor strings remain English.
- **Domain-aware visual editor** accepts climate and water heater entities and
  offers their supported controls.
- **Accessibility**: labelled card group, PageUp/PageDown/Home/End dial keys, and
  independently keyboard-operable dual handles.
- **Default step** is 1 °F or 0.5 °C when the entity reports no valid step.

### Fixed

- Dropdown menus line up exactly with the control they open from, and their
  corners match the highlighted option inside (rows stay pill-shaped with large text).
- The big temperature no longer shrinks on whole-number targets of entities with
  0.5° steps, so neighbouring dials match.
- The visual editor's colour pill lines up exactly with the title field it attaches to.
- Climate HVAC/preset/fan/swing/horizontal-swing and water-heater operation-mode
  selectors, plus the water-heater away control, are disabled while the card's
  main entity is unavailable; auxiliary controls such as `input-select` are not.
- Rejected or ignored setpoint changes revert to the device value after about 3 s.
- Theme-only changes now apply without requiring an entity state update.
- The per-card `theme:` option now actually applies its CSS variables (including
  light/dark `modes`); previously it had no effect.
- Labels HA has no translation for (e.g. MQTT horizontal swing "left") show in
  Title Case instead of raw lowercase.
- Labels, numbers and names refresh when HA's language, locale or translations
  change, not only on entity updates.
- A pending setpoint is never sent to a different entity, or as a different
  single/dual target kind, and is dropped when the card is detached.
- Malformed (non-numeric) temperature attributes no longer break the dial.
- Selector chips shrink to fit narrow cards (seven fit a ~170 px row, like the
  stock card) instead of being cut off; text-label chips ellipsize instead of
  overlapping, and the keyboard focus ring is visible on every chip.
- Switch-group chips fall back to a switch icon instead of showing long entity
  names.
- Entity tiles keep their value readable on narrow cards by hiding the icon chip.
- Dropdowns show an empty value instead of the first option when the active
  mode isn't listed.

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
