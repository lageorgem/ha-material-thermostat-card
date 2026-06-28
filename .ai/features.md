# Features

A "feature" is one configurable control rendered below/beside the dial. The
config schema is in `src/types.ts` (the source of truth). `mt-feature-row`
dispatches a `FeatureConfig` to the right element and applies grid placement.

## The 9 feature types

| `type` | Element | Renders via | Binds to | Selection behavior |
| --- | --- | --- | --- | --- |
| `climate-hvac-modes` | `mt-climate-selector` | `selector-row` | the card's climate entity | `climate.set_hvac_mode` |
| `climate-fan-modes` | `mt-climate-selector` | `selector-row` | the card's climate entity | `climate.set_fan_mode` |
| `climate-swing-modes` | `mt-climate-selector` | `selector-row` | the card's climate entity | `climate.set_swing_mode` |
| `input-select` | `mt-input-select` | `selector-row` | an `input_select` | `input_select.select_option` |
| `switch-group` | `mt-switch-group` | `selector-row` | a list of switchables | **mutually exclusive**: turn others off, then selected on |
| `switch-list` | `mt-switch-list` | icon chips | a list of switchables | each toggles independently |
| `button-list` | `mt-button-list` | icon chips | buttons/scenes/scripts | each pressed independently |
| `entity-tile` | `mt-entity-tile` | rounded tile | one entity | `tap_action`, else natural action |
| `comfort` | `mt-comfort` | status line | the card's feels‑like sensors | read‑only; forecasts from history (**add once**) |

### Shared config (`BaseSelectorFeature`)
`display?: 'icons' | 'dropdown'` and `width?: number` — but **only the
selector-style types** extend it (`climate-*`, `input-select`, `switch-group`).
`switch-list`/`button-list`/`entity-tile` have **`width` but no `display`** (lists
are always icon rows; the tile is always a tile). Don't assume `display` exists
on every feature.

### Per-option overrides (`OptionOverride`) + order
`{ value, label?, icon?, hide? }` — supported by the three `climate-*` selectors
and `input-select`. `value` keys to an underlying option; `hide:true` removes it.
Those features also accept **`order?: string[]`** (an explicit display order of
option values). The selectors apply it via `orderValues(all, order)` in
`theme.ts` (listed values first in order, the rest in natural order — robust to
the entity adding/removing options). The editors persist it by drag-reordering
the option rows (`ha-sortable` + a `.handle`, `_moveOption` → emit `{ order }`).

### List items (`EntityItem`)
`{ entity, label?, icon? }` — `switch-group.entities`, `switch-list.entities`,
`button-list.items` (note the **`items`** key for button-list, **`entities`** for
the others — the shared editor takes an `itemsKey` prop to handle this). The
shared editor's rows are **drag-reorderable** (`ha-sortable` + `.handle`,
`_moveItem` reorders the array — the card renders items in array order).

### Entity tile specifics (`entity-tile.ts` + `actions.ts`)
`{ entity, name?, icon?, tap_action?, compact?, width? }`.
- Default tap (`pressOrToggle`): press for button/input_button/scene/script,
  toggle for switch/light/fan/input_boolean, more-info otherwise.
- `tap_action` (standard Lovelace `ActionConfig`) overrides: supports `none`,
  `more-info`, `toggle`, `url`, `navigate`, `call-service`/`perform-action`,
  `default`.
- Degradation by width: `width:1` → icon-only pill; `compact:true` **or**
  `width ≤ 2` → icon + value (no title); else full tile (icon + title + value).

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
climate's `last_changed` (`mt-comfort._sessionStartMs`), not a fixed lookback, with
~10 min minimum span. `analyzeComfort` (`calc/comfort-analysis.ts`, **pure** — all
logic is unit‑tested without Lit/hass) returns `{ line, status }` where `status` ∈
`comfortable|warm|cool|humid` drives the row's icon + colour (warm→heat colour,
cool/humid→cool colour, comfortable→green). **Comfort is calculated, not configured**
(no comfort_min/max, no lookback_hours). **The row always shows a verdict whenever
the sensors read — including when the climate is OFF** (just without a forecast) —
upgrading the uncomfortable verdict to *"…X until room feels comfortable"* only with
a confident forecast (a guessed *time* is the inaccurate data avoided, not the
verdict). It hides (renders `nothing`, and asks `mt-feature-row` to collapse via a
`feature-visibility` event → host `[hidden]`) **only** when the sensors are
unset/non‑numeric or the climate is unavailable/unknown. The `calc/` modules are the
source of truth — extend/test those, keep the component thin.

## Shared selector row (`selector-row.ts`)

Everything selector-like funnels through `mt-selector-row`, which takes
`SelectorItem[]` (`{ value, label, icon?, active?, disabled? }`) and renders
either **M3 icon chips** or an **`mt-dropdown`**, emitting `item-selected`
(`{value}`, bubbles+composed). Each feature element just builds the
`SelectorItem[]` from HA state and handles `item-selected`.

`mt-dropdown` (`dropdown.ts`) is **self-contained** — built deliberately to avoid
HA's lazily-loaded `ha-select` (which is inert inside a custom card). It sizes to
content (`width:max-content`), anchors to whichever edge keeps it on screen
(`_alignRight`/`_up`), and coordinates "only one open at a time" via a
document-level `mt-dropdown-open` event.

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

- Base form is an `ha-form` (entity/name/theme/show_current_as_primary).
- Features are a drag-sortable list (`ha-sortable`, `handle-selector=".handle"`);
  each row expands to its sub-editor; an "Add feature" menu appends a
  `defaultFeature(type)` and opens it.
- **Add-menu filtering** (`_addableFeatures()`): climate selectors are offered
  only when the entity exposes the matching attribute (`CLIMATE_FEATURE_ATTR`:
  hvac_modes/fan_modes/swing_modes) AND aren't already added (each climate
  selector is unique). Custom features (input_select, lists, tile) are always
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
