# Material Thermostat Card

A Material 3 Expressive thermostat card for Home Assistant — a draggable Google Home / Nest‑style
temperature dial for `climate.*` and `water_heater.*`, plus a configurable stack of entity controls. Pairs with
`material-you-theme` and degrades gracefully under any theme.

- Draggable circular dial (drag / tap / `+−` / keyboard), capability-driven single/dual targets
  (including dual in `auto`), read-only when no target is settable, animated
  mode‑color cross‑fade and sliding temperature segment
- Climate **HVAC / fan / swing / horizontal swing / preset** selectors as icons, dropdowns or
  tiles, with per-option label/icon/color/hide overrides and `include` allow-lists
  (`[]` applies no filter; `order` takes precedence over allow-list ordering)
- Water heater **operation modes** and **away mode** (icons or tile when supported);
  climate-only selectors, comfort and feels-like settings are ignored for water heaters
- Drop-in stock thermostat feature YAML: change the card type; stock `style` and mode lists work
- HA-translated labels/state text, user number formatting, structured HA names (YAML-only),
  and opt-in `show_state_label` (default false); editor strings remain English
- Climate HVAC/preset/fan/swing/horizontal-swing and water-heater operation-mode selectors,
  plus the water-heater away control, are disabled while the card's main entity is unavailable;
  auxiliary controls such as `input-select` are not
- Rejected setpoints revert after about 3 s;
  default step is 1 °F / 0.5 °C; labelled card group and keyboard-operable dual handles
- Custom‑entity controls: **input_select**, **switch group**, **switch list**, **button list**,
  **entity tiles**, **sensor lists**; climate-only **feels-like** and **comfort** forecasts
- Relative, gap‑safe grid layout with a side‑by‑side wide mode
- A bundled **`mt:` AC swing icon set** (searchable in the icon picker)
- A visual editor for every feature type
- Sections sizing (12 columns, minimum 6, auto rows) and live theme-only updates

Unlike the stock card, the dial arc fills from current to target, and the state label is opt-in.

See the [README](https://github.com/lageorgem/ha-material-thermostat-card) for full configuration,
examples, and the icon reference.
