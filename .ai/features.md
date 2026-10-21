# Features

A "feature" is one configurable control rendered below/beside the dial. The
config schema is in `src/types.ts` (the source of truth). `mt-feature-row`
dispatches a `FeatureConfig` to the right element and applies grid placement.

## The 14 feature types

| `type`                           | Element                | Renders via    | Binds to                      | Selection behavior                                        |
| -------------------------------- | ---------------------- | -------------- | ----------------------------- | --------------------------------------------------------- |
| `climate-hvac-modes`             | `mt-climate-selector`  | `selector-row` | the card's climate entity     | `climate.set_hvac_mode`                                   |
| `climate-fan-modes`              | `mt-climate-selector`  | `selector-row` | the card's climate entity     | `climate.set_fan_mode`                                    |
| `climate-swing-modes`            | `mt-climate-selector`  | `selector-row` | the card's climate entity     | `climate.set_swing_mode`                                  |
| `climate-swing-horizontal-modes` | `mt-climate-selector`  | `selector-row` | the card's climate entity     | `climate.set_swing_horizontal_mode`                       |
| `climate-preset-modes`           | `mt-climate-selector`  | `selector-row` | the card's climate entity     | `climate.set_preset_mode`                                 |
| `water-heater-operation-modes`   | `mt-climate-selector`  | `selector-row` | the card's water heater       | `water_heater.set_operation_mode`                         |
| `water-heater-away-mode`         | `mt-water-heater-away` | `selector-row` | the card's water heater       | `water_heater.set_away_mode` (boolean payload)            |
| `input-select`                   | `mt-input-select`      | `selector-row` | an `input_select`             | `input_select.select_option`                              |
| `switch-group`                   | `mt-switch-group`      | `selector-row` | a list of switchables         | **mutually exclusive**: turn others off, then selected on |
| `switch-list`                    | `mt-switch-list`       | icon chips     | a list of switchables         | each toggles independently                                |
| `button-list`                    | `mt-button-list`       | icon chips     | buttons/scenes/scripts        | each pressed independently                                |
| `entity-tile`                    | `mt-entity-tile`       | rounded tile   | one entity                    | `tap_action`, else natural action                         |
| `sensor-list`                    | `mt-sensor-list`       | sensor rows    | `items` sensor entities       | read-only                                                 |
| `comfort`                        | `mt-comfort`           | status line    | the card's feels‑like sensors | read‑only; forecasts from history (**add once**)          |

### Shared config (`BaseSelectorFeature`)

`display?: 'icons' | 'dropdown' | 'tile'` and `width?: number` — but **only the
selector-style types** extend it (`climate-*`, `water-heater-operation-modes`,
`input-select`, `switch-group`). `water-heater-away-mode` has its own
`display?: 'icons' | 'tile'`, `label?` and `width?`; no dropdown or option overrides.
`switch-list`/`button-list` have **`width` but no `display`** (always icon rows).
`entity-tile` has its **own** `display?: 'icon' | 'tile'` (`EntityTileDisplay`,
default `tile`) — a _two_-value axis, not the selector's three. Don't assume the
selector `display` exists on every feature. The selector `tile` display is a
Google-Home-style card showing the current value (see the selector section
below) — distinct from the standalone `entity-tile` feature.

All feature types accept optional `alignment?: 'left' | 'center' | 'right'`,
default `left`, alongside `width`. This positions the **whole feature host** in
unused grid-row space only when it is the row's only visible feature. It does not
change width, text alignment, display mode or chip order. Shared rows (`50 + 50`
or `30 + 30`) ignore it and retain config order. Hidden comfort features are
excluded from packing. Full rows have no space to align; in wide mode the space
is relative to the sidebar, not the card (a lone widest feature fills it).
Width defaults remain 50 for entity tiles, 100 for all other types; see
[`layout.md`](layout.md) for packing and wide-mode rules.

### Per-option colors (`OptionOverride.color` / `EntityItem.color`)

Per-option **`color?`** (hex) overrides the accent color. Editor UI: `mt-color-field`
(`editors/color-field.ts`) — a **half-pill swatch** attached to the left of the
title (`mt-text-field` gets `flatLeft`), aligned exactly with the title field,
opening a popover with a native color
input + **Reset to default**. The swatch's `defaultColor` (shown when unset) is
`climateModeColor(value)` for HVAC, `presetColor(value)` (eco→`#4caf50`,
sleep→`#2196f3`, `theme.ts`) for presets, else the theme primary. Visibility: HVAC
& preset in **any** display, every selector in **tile** display (switch-group among
entity lists, and the **entity-tile** in `tile` display — `EntityTileFeatureConfig.color`).
Where a color is applied at render time:

- **HVAC** — the card's `_hvacColors()` builds a `{mode: hex}` map → `mt-circular-dial.modeColors`; `_modeColor()` uses it for the halo/ring/number/mode-icon (+dual overshoot bands). Also the item `color` on the tile.
- **Preset** — the card's `_presetColor()` → `mt-circular-dial.presetIconColor` colors the preset icon under the number. Also the tile.
- **Water heater operation mode** — adding `water-heater-operation-modes` shows the active mode's icon under the number, like the climate preset icon (e.g. eco leaf or gas flame). It follows that feature's per-option `icon`/`color` overrides; an empty `icon` hides it. Not shown when the heater is off, unavailable or unknown. Color also applies to the tile.
- **Others** — only the tile: `mt-dropdown._renderTile` sets `--mt-tile-accent` from the active item's `color`.
  The features attach `color` to each `SelectorItem` (`climate-selector`/`input-select`
  build it from override+default; `switch-group` from `entity.color`).

### Per-option overrides (`OptionOverride`) + order

`{ value, label?, icon?, hide?, color? }` — supported by all five `climate-*` selectors,
`water-heater-operation-modes` and `input-select`. `value` keys to an underlying
option; `hide:true` removes it.

Vertical and horizontal swing selectors default to bundled `mt:` AC swing icons
matched to the mode name. Fixed positions (`Top`, `Fixed Top-Middle`, `Upper`,
`Lower`, `Bottom`, `Left`, `Center`, `Right`, etc.) use fixed-position icons;
partial ranges (`Swing Top`, `Swing Middle`, `Swing Left`, etc.) use range icons.
Full-swing names (`on`, `swing`, `full`, `auto`, `Full Swing`, `wide`, and HA's
standard `vertical`) use full-swing icons. HA's `horizontal` value in a vertical
list uses horizontal full swing. `off` and `both` retain their previous MDI
icons; unknown names retain the previous MDI fallbacks. Per-option `icon`
overrides take precedence.

Those features also accept **`order?: string[]`** (an explicit display order of
option values). The selectors apply it via `orderValues(all, order)` in
`theme.ts` (listed values first in order, the rest in natural order — robust to
the entity adding/removing options). The editors persist it by drag-reordering
the option rows (`ha-sortable` + a `.handle`, `_moveOption` → emit `{ order }`).

Only the five `climate-*` selectors and `water-heater-operation-modes` accept
`include?: string[]`, not `input-select`. A non-empty allow-list shows only listed
available values, initially in its order; unlisted values do not follow.
`include: []` applies no filter. `order` is applied afterward: listed allowed
values first, then remaining values in `include` order (or natural order without
a non-empty allow-list). `config/normalize.ts` translates stock `style: icons|dropdown`
and the corresponding `hvac_modes`/`preset_modes`/`fan_modes`/`swing_modes`/
`swing_horizontal_modes`/`operation_modes` list to `display`/`include`, without
mutating the input. Explicit custom keys win.

### Domain-specific controls and localization

`entity/adapter.ts` defines primary domains and capabilities. Climate selectors,
comfort and feels-like are ignored for water heaters; operation/away controls are
water-heater-only. Auxiliary controls work for either domain. Operation selectors
use HA canonical ordering and per-mode icons. Away renders only with away support
and a known `away_mode: on|off`; selection sends the opposite boolean. Missing
numeric capability metadata retains legacy attribute-based behavior.

`localize.ts` supplies HA state/attribute translations for mode values and tile
titles, with English fallbacks. Explicit option labels win. Climate HVAC/preset/
fan/swing/horizontal-swing and water-heater operation-mode selectors, plus the
water-heater away control, disable items and guard service calls while the card's
main entity is unavailable. This does not apply to auxiliary controls such as
`input-select`. Card state text and
“Unavailable” are localized; numbers follow HA number-format preferences.
The editor's own strings remain English.

### List items (`EntityItem`)

`{ entity, label?, icon?, color? }` — `switch-group.entities`, `switch-list.entities`,
`button-list.items` (note the **`items`** key for button-list, **`entities`** for
the others — the shared editor takes an `itemsKey` prop to handle this). The
shared editor's rows are **drag-reorderable** (`ha-sortable` + `.handle`,
`_moveItem` reorders the array — the card renders items in array order).

### Entity tile specifics (`entity-tile.ts` + `actions.ts`)

`{ entity, name?, icon?, color?, display?, tap_action?, compact?, width?, alignment? }`.

- Default tap (`pressOrToggle`): press for button/input_button/scene/script,
  toggle for switch/light/fan/input_boolean, more-info otherwise.
- `tap_action` (standard Lovelace `ActionConfig`) overrides: supports `none`,
  `more-info`, `toggle`, `url`, `navigate`, `call-service`/`perform-action`,
  `default`.
- **Layout by `display`** (`EntityTileDisplay = 'icon' | 'tile'`, default `tile`):
  `tile` = full tile (icon chip + title + value); `icon` = a bare centered icon
  (no `.ic` chip) at the same height. Resolution: `display ?? (compact ? 'icon' : 'tile')`
  — the legacy `compact` boolean still maps to the icon layout. There is **no
  more width-based degradation** (width is a % of the card; the user picks the layout).
- `color?` (hex) → `--mt-tile-accent` on the tile button, **only in `tile` display**
  (icon display falls back to the primary when on). Editor gates the color pill
  the same way (`showColor = display === 'tile'`).
- Shares its look with the selector dropdown's tile variant via
  `features/tile-styles.ts` (`tileStyles`, `.tile` min-height **64px** + capped
  title/value line-heights so every tile variant lines up). The tile takes the
  accent "on" treatment (soft tint + fully rounded pill corners) when its value is
  **not falsy** (`isOffValue` in `theme.ts`: off/none/false/null/0/unavailable/
  unknown, else on), and is forced to the off treatment via `forceOff` (threaded
  from `feature-row`) when the card's **climate entity is off**.
- Editor `mt-entity-tile-editor` mirrors the climate/list editors: an Icon/Tile
  `mt-display-toggle` (its new `options` prop takes a custom `DisplayOption[]`),
  the width slider, then a single item row — styled `mt-entity-picker` +
  (`mt-color-field` in tile display) + `mt-text-field` (title) + `mt-icon-field`.
  No `tap_action` control in the UI (still honored from YAML; preserved on edit).

### Feels‑like + the comfort feature (`calc/`, `features/comfort.ts`)

Card‑level `feels_like: { temperature?, humidity?, show_as_current? }` (in
`types.ts`) names a temperature + humidity sensor. The card computes the **heat
index** (`calc/comfort-metrics.heatIndexC`, NOAA Rothfusz) via `_displayCurrent()`
and, when `show_as_current`, passes it as the dial's `current`. Those two sensors
are threaded through `mt-feature-row` (`feelsLikeTemp`/`feelsLikeHumidity`) to the
**`comfort`** feature — it has **no own pickers** (shares the card‑level sensors).

`mt-comfort` is the card's only **async** element. On a 60s interval (+ on
sensor/entity change) it fetches recorder history via
`hass.callWS({ type: 'history/history_during_period', minimal_response, no_attributes })`
(`calc/history.ts`), scoped to "since the climate last turned on" via the climate's
`last_changed` (`mt-comfort._sessionStartMs`), and judges comfort **scientifically** with the ASHRAE 55 /
ISO 7730 **PMV model** (`calc/pmv.ts`, Fanger's equation — validated against the
ISO 7730 Annex D table): comfortable = −0.5 < PMV < +0.5, plus an absolute‑humidity
cap (`HUMIDITY_RATIO_MAX` 0.012). Clothing is **inferred from the room temperature**
(`cloForTemp`: dynamic clothing, 1.0 clo at ≤20°C easing to 0.5 clo at ≥27°C),
**not the HVAC mode** — so the verdict is identical whether heating or cooling at a
given temperature (band ≈ 21–27°C). It forecasts the binding axis (the PMV series
toward ±0.5, or the humidity‑ratio series toward the cap) with a **first‑order
(Newton's‑law) fit recovered by integration** (`calc/forecast.ts`: `newtonFit`
regresses `v−v₀` on `[∫v dτ, t]` → `{k, asymptote}` — integration is robust to the
coarse quantized steps real recorders log, where differencing was pure noise;
`etaToThreshold` is the closed‑form ETA, `null` when the target is beyond the
plateau). The forecast uses **only the current session** — history since the
climate's `last_changed` (`mt-comfort._sessionStartMs`), not a fixed lookback.
**Gating is by time coverage** (`MIN_SPAN_MIN` 6, not sample count) so it adapts to
the sensor; below it the row shows the plain verdict (no "calculating…"), above it
shows the accurate integral fit or a rough `linearEta` fallback (early estimate from
a coarse sensor / the transient, refining over time). Uncomfortable → "{t} until
comfortable"; once comfortable → the Nest-style time to the setpoint ("{t} until
cooled to 24°C" / "heated to 26°C", gated by `show_target_eta`). Times are compact
via `formatDuration` ("7m" / "1h" / "2hr+") and **count down between readings** —
the component passes `staleMin` (since the temp sensor's `last_changed`) and
`analyzeComfort` shows `eta − staleMin`, resolving to "…soon" / "Almost at {target}"
near zero (a 30 s tick drives it; history is fetched ~60 s). Forecast only when
`running` (off → bare verdict). `analyzeComfort` (`calc/comfort-analysis.ts`, **pure** — all
logic is unit‑tested without Lit/hass) returns `{ line, status }` where `status` ∈
`comfortable|warm|cool|humid` drives the row's icon + colour (warm→heat colour,
cool/humid→cool colour, comfortable→green). **Comfort is calculated, not configured**
(no comfort*min/max, no lookback_hours). **The row always shows a verdict whenever
the sensors read — including when the climate is OFF** (just without a forecast) —
upgrading the uncomfortable verdict to *"…X until room feels comfortable"_ only with
a confident forecast (a guessed \_time_ is the inaccurate data avoided, not the
verdict). It hides (renders `nothing`, and asks `mt-feature-row` to collapse via a
`feature-visibility` event → host `[hidden]`) **only** when the sensors are
unset/non‑numeric or the climate is unavailable/unknown. The `calc/` modules are the
source of truth — extend/test those, keep the component thin.

## Shared selector row (`selector-row.ts`)

Everything selector-like funnels through `mt-selector-row`, which takes
`SelectorItem[]` (`{ value, label, icon?, active?, disabled? }`) and renders
**M3 icon chips**, an **`mt-dropdown`** (`display: dropdown`), or a tile
(`display: tile` → `mt-dropdown variant="tile"`), emitting `item-selected`
(`{value}`, bubbles+composed). Each feature element just builds the
`SelectorItem[]` from HA state and handles `item-selected`.

The **tile** variant of `mt-dropdown` is a Google-Home-style card: an icon chip,
the `label` as a title line, and the active item's label as the value, opening the
same shared option menu when tapped. It reads as **"on"** (accent tint +
fully rounded `--mt-shape-full` pill corners) when the active value is **not** a
hardcoded off state (`off`/`none`, case-insensitive via `_tileOn`); otherwise it's
a neutral, less-rounded (`--mt-shape-chip-square`) rectangle. The tint color is
`--mt-tile-accent` (default `--mt-primary`); the **HVAC** selector sets it to the
active mode color so heat tiles tint orange, cool blue, etc. `climate-selector`
also supplies a per-kind default title (`Mode`/`Fan`/`Swing`/`Preset`) for tiles
without a configured `label`.

The row's own **`label`** (distinct from the per-item labels) renders as an
optional **title** above the control in icons/dropdown modes (`.title`) — and as
the tile's title line in tile mode — and is still the chip group's `aria-label` /
the dropdown placeholder. Feature configs carry it on `BaseSelectorFeature.label`;
`feature-row` forwards it. The **HVAC** selector also sets an inline
`--mt-selected-bg: var(--md-sys-color-primary, <modeColor>)` (plus
`--mt-tile-accent: <modeColor>`) on the row so the active chip/tile uses the
active mode's color when the Material You primary token is absent (default theme);
other selectors keep the accent. Surface containers
(`--mt-surface-container[-high/-highest]`) fall back to a `color-mix` elevation
tint over the card background so tiles/lists don't blend in.

**`mt-search-panel`** (`editors/`) is the shared dropdown body: a search box +
filtered, scrollable list of `SearchItem`s (`{value, primary, secondary?, icon?,
keywords?}`). It self-focuses, caps to 50 results, supports `allowCustom` +
`customPrefix` (a "Use …" row / Enter for free-text values), and emits
`pick`/`dismiss`. It does NOT manage open/close or position — the parent renders
it (absolutely positioned) while open. Both pickers below use it, so they look
and behave identically. ALWAYS prefer this over HA's stock combobox/pickers.

**`mt-entity-picker`** (`editors/`): a rounded pill trigger + `mt-search-panel`
fed from `hass.states` (domain-filtered, reliable). Drop-in for
`ha-entity-picker` (emits `value-changed {value}`); `allowCustom` permits typed
ids.

**`mt-icon-field`** (`editors/`): the two-half pill — left opens an
`mt-search-panel` of icons right under the pill (`position: absolute`; the
feature card uses `overflow: visible` so it isn't clipped — do NOT use
`position: fixed`, HA's editor dialog has a transformed ancestor that breaks
viewport coords); right is `mdi:cancel` ("no icon"). Three-state contract:
`undefined` = default · `''` = no icon · string = custom; pass `defaultIcon` for
the faded preview. The browsable list (`icon-list.ts` → `loadIconItems`) is a
**curated common MDI set + every registered custom icon pack** (enumerated via
`window.customIcons[prefix].getIconList()`, which is how our `mt:` icons show
up). HA bundles the full MDI list at build time (`import("../../build/mdi/iconList.json")`)
— no runtime URL — so anything not curated is reached by typing its full
`mdi:<name>` (free text via `allowCustom`/`customPrefix="mdi:"`).

Title/label inputs use **`mt-text-field`** (a native `<input>` styled as a pill),
NOT a bare `<ha-textfield>` — a standalone `ha-textfield` placed directly in a
custom-card editor often never upgrades (HA only preloads the picker/form stack),
so it renders invisible. List items are laid out on two lines: `mt-entity-picker`
on top, then the icon pill + title input.

`mt-dropdown` (`dropdown.ts`) is **self-contained** — built deliberately to avoid
HA's lazily-loaded `ha-select` (which is inert inside a custom card). It sizes to
content (`width:max-content`), anchors to whichever edge keeps it on screen
(`_alignRight`/`_up`), and coordinates "only one open at a time" via a
document-level `mt-dropdown-open` event.

The open menu lines up exactly with its trigger control. Its corners match the
highlighted option inside; rows remain pill-shaped with large text.

## Adding a new feature type

1. **`types.ts`** — add a `…FeatureConfig` interface (extend `BaseSelectorFeature`
   only if it should have `display`); add it to the `FeatureType` union and the
   `FeatureConfig` union.
2. **Renderer** — `features/my-thing.ts`, a Lit element. If it's selector-like,
   build `SelectorItem[]` and delegate to `<mt-selector-row>`; otherwise render
   directly. `declare global` its tag.
3. **`feature-row.ts`** — import the element and add a `case` in `render()`
   passing the needed props.
4. **Editor** — `editors/my-thing-editor.ts` emitting `feature-changed`
   (`{ feature }`). Reuse `mt-entity-list-editor` (pass `itemsKey`),
   `mt-width-field`, `mt-display-toggle` where they fit.
5. **`editor.ts`** — add to `ADDABLE_FEATURES`, `FEATURE_LABELS`,
   `defaultFeature()`, and a `case` in `_renderFeatureEditor()`.
6. **`material-thermostat-card.ts`** — if it has a default footprint, handle it in
   `_featureSpan()`; if it binds entities, make sure `_trackedEntityIds()` picks
   them up (it already scans `entity`, `entities[]`, `items[]`).
7. Document it in the root `README.md` feature table + `types.ts` JSDoc.

## The visual editor (`editor.ts`)

- Base `ha-form` keeps entity/name/theme at top level; expandable **Style** groups
  dial_style (halo/minimal/google), show_current_as_primary,
  and font (rounded/theme). Structured `name` configs are YAML-only and preserved
  when the base form changes; rendering delegates them to HA where supported.
  Defaults halo/rounded/false are omitted from saved YAML. Font helper discloses Google Fonts loading.
- Outlined **Feels-like temperature** expansion uses labelled sensor-only
  `mt-entity-picker`s and a boolean form; edits preserve sibling fields and an empty config is pruned.
- Features use token-styled icon/summary rows with 44px controls and an empty state.
  They are a drag-sortable list (`ha-sortable`, `handle-selector=".handle"`);
  focused handles also reorder with Up/Down, retaining focus. Escape dismisses
  the icon-labelled add menu and returns focus to Add feature;
  each row expands to its sub-editor; an "Add feature" menu appends a
  `defaultFeature(type)` and opens it.
- **Add-menu filtering** (`_addableFeatures()`): climate selectors are offered
  only for climate entities exposing the matching attribute (`CLIMATE_FEATURE_ATTR`:
  hvac_modes/fan_modes/preset_modes/swing_modes/swing_horizontal_modes) AND aren't
  already added. Water heaters offer operation modes when operation_list exists
  and away mode when supported; each is add-once. Comfort/feels-like are climate-only.
  Custom features (input_select, lists, tile) are always
  offered and repeatable — **except** types in `SINGLETON_FEATURES` (currently
  `comfort`), which are add‑once: offered only while not already present.
- ⚠️ HA lazily registers its form components — `ensureHaComponents()`
  (`editors/load-ha.ts`) force-loads them in `connectedCallback`, then
  `requestUpdate()`. Pickers/sliders are **inert in a custom card editor** unless
  you do this, or you build self-contained widgets (we did both:
  `mt-display-toggle`, `mt-width-field`, `mt-dropdown`). See
  [`gotchas.md`](gotchas.md).
- Sub-editors always pass `.hass` down (the `ha-form` number/entity selectors
  need it to render).
- **Width control** is `mt-width-field`, which renders **`mt-grid-slider`**
  (`editors/grid-slider.ts`) — a self-contained port of HA's internal
  `ha-grid-layout-slider` (dotted track + bar handle + floating value tooltip),
  using native Pointer Events (no hammerjs). We re-implemented it rather than use
  HA's element because `ha-grid-layout-slider` lives in HA's lazily-loaded card
  layout-editor modules and isn't reliably registered inside a custom card editor
  (the recurring "HA components are inert in a custom editor" trap). Source
  reference: `home-assistant/frontend` →
  `src/panels/lovelace/editor/card-editor/ha-grid-layout-slider.ts`. The field
   has a **reset** button to clear width back to auto (unset); when unset the
   slider shows no handle (tap the track to set one).
- **Alignment control** sits beside width for every feature type: a labelled
  Left / Centre / Right pill using `mdi:format-align-left`,
  `mdi:format-align-center` and `mdi:format-align-right`. Despite the familiar
  text-alignment icons, it moves the feature host, not its contents. YAML uses
  `center`, not `centre`; omitted alignment means `left`.
