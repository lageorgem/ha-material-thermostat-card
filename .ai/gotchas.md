# Gotchas — read before debugging anything visual

Every item here cost real time. They're ordered roughly by how much.

## 1. `svg\`…\`` vs `html\`…\`` for SVG fragments (THE big one, ~2h)

A nested ``html`<path/>`​`` (or any SVG node built with Lit's `html` tag) renders
in the **HTML namespace**, not SVG. It has no `getBBox`, is not a real SVG
element, and **silently never paints**. Symptoms: overlays/segments that are in
the DOM but invisible; `ov.getBBox is not a function`.

**Fix:** import `svg` from `lit` and build SVG fragments with `svg\`…\``. The
mode-change wipe overlay in `circular-dial.ts` does this. Every overlay approach
(clipPath rect, CSS mask on `<g>`, ring overlay) failed until this was found —
the approaches weren't wrong, the namespace was.

Related SVG facts learned the hard way:
- CSS-animating a `<rect>`'s geometry inside a `<clipPath>` does **not** update
  the clip in Chrome.
- CSS `mask` on an SVG `<g>` was unreliable.
- **Driving real SVG paths with the Web Animations API is the robust path** for
  segment animations.
- Never CSS-transition an SVG path's `d` between arcs with different large-arc
  flags — the arc balloons/bends. Dash the path instead (`stroke-dasharray` /
  `-dashoffset` with `pathLength="1000"`).

## 2. A custom `shouldUpdate` must whitelist EVERY render-affecting `@state`

`material-thermostat-card.ts` has a `shouldUpdate`. When wide-mode "never worked"
despite a correct layout, the cause was `shouldUpdate` returning false for
`_widthPx` changes — the `ResizeObserver` updated width but the card never
re-rendered, so it stayed stuck in its initial `stacked(width=0)` state. Any
optimistic/observer-driven `@state` (`_widthPx`, `_selectedLow/High`, …) must be
in the whitelist or its updates silently no-op.

## 3. Observe the HOST for width, not an inner element

`ResizeObserver` must observe `this` (the host, always present), not the inner
`ha-card` — which doesn't exist until both `hass` and `config` are set (early
`render()` returns empty `html\`\``). Observing the inner element means the
observer never attaches and `_widthPx` stays 0 → always stacked. Inner width =
host `contentRect.width − CARD_PADDING_X`. Host needs `:host{display:block}` to
have a real width. Attach in `connectedCallback` (idempotent, re-attaches on
reconnect).

## 4. `container-type: inline-size` has ZERO intrinsic width

An element with `container-type: inline-size` reports no intrinsic width. The
`.dial` uses it (for `cqi` text scaling), so without a definite width from its
parent it shrink-to-fits to ~0 and the dial vanishes. Fix: `:host{width:100%}` on
`mt-circular-dial` so the container has a definite width. **Rule:** a
`container-type` element's parent must give it a definite width — don't let a
shrink-to-fit flex/inline-block/float ancestor size it.

## 5. HA web components are inert inside a custom card editor

HA lazily registers `ha-select`, `ha-button-menu`, pickers, etc. In a custom card
editor they may not be registered → render as nothing. Either force-load them
(`ensureHaComponents()` in `editors/load-ha.ts`, then `requestUpdate()`) or build
self-contained widgets (we built `mt-dropdown`, `mt-display-toggle`,
`mt-width-field`). Sub-editors must also pass `.hass` to any `ha-form` they use.

## 6. CSS grid, not flex, for side-by-side features

A flex `gap` between two `width:50%` items pushes the total over 100% and forces a
wrap. The feature area is a **CSS grid** (`repeat(cols, minmax(0,1fr))`, each item
`grid-column: N / span W`); the grid absorbs the gap so halves truly sit side by
side. Don't revert to flex basis-px.

## 7. SVG markers as HTML overlays (Safari)

Dial dots/labels are HTML overlays that orbit via `rotate()`, **not** SVG
elements, because animating SVG `cx`/`cy` is unreliable in Safari/WKWebView. The
backdrop `<svg>` must be `display:block` or its baseline gap offsets the overlay
coordinate space (worst at the arc extremes).

## 8. Zero-length dash + round linecap = stray dot

A `.value` segment of length 0 with `stroke-linecap:round` paints a small dot.
Hide the segment with `opacity:0` when there's nothing to show.

## 9. `touch-action` on the dial — let the page scroll over it (mobile)

The dial fills a lot of phone height; with `touch-action: none` on the whole
`<svg>`, a vertical swipe *anywhere* on it was swallowed and the dashboard
couldn't scroll. Fix: `svg { touch-action: pan-y }` (browser handles vertical
pan = page scroll) and `.hit { touch-action: none }` on just the ring band (so
dragging the ring to set the temperature still works). Where SVG `touch-action`
is honoured the ring drags in any direction; where it isn't, side-of-ring
vertical drags fall back to scrolling — the top of the arc and the +/- buttons
still adjust. Don't put `touch-action: none` back on the whole svg.

---

# Dev & verification tooling

The dev harness is in `dev/`. **It stubs HA components, so icons render as dots —
it proves layout/interaction, not pixel fidelity. Verify the final look in real
Home Assistant.** "The math is correct" has repeatedly NOT meant "it works."

## Files

- `dev/index.html` — interactive harness (a card + a width slider 300–1400px).
- `dev/layout-test.html` — focused cases at exact unit widths
  (`px = units*24 + 32`), with a realistic `ha-card` stub (shadow DOM + `<slot>`)
  so padding/box metrics match real HA.
- `dev/shot.mjs` — Playwright-core screenshot helper driving **system Chrome**
  (`chromium.launch({ channel: 'chrome' })`, no browser download):
  `node dev/shot.mjs <url> <outfile> [widthPx]`.

## Harness rules (these bit us)

- **Stubs must render into `attachShadow`, never light-DOM `innerHTML`.** Setting
  an element's light DOM in `connectedCallback` corrupts Lit's part markers during
  the card's render (the body lost its class, `.features` nested into the dial).
- **Serve over HTTP** (`python3 -m http.server`), not `file://` — ES module CORS
  blocks the dynamic `import('../dist/...')`.
- **Use Playwright with real waits**, not headless `--virtual-time-budget` — the
  latter collapses `container-type`/`aspect-ratio` layout and the dial renders
  tiny/blank.

## Capturing a mid-animation frame

```js
// in page context, on a FRESH page load (forwards-filled animations accumulate)
const dial = card.shadowRoot.querySelector('mt-circular-dial');
dial.shadowRoot.getAnimations({ subtree: true }).forEach(a => {
  a.pause();
  a.currentTime = 460 * fraction;   // 460ms = wipe duration
});
```

`document.getAnimations()` does **not** descend into shadow DOM in Chrome — call
`getAnimations()` on the dial's shadow root (or the element subtree).

## Nested `ha-sortable` — stop the inner `item-moved`

The editor nests sortables: the **features** list is an `ha-sortable`, and each
expanded climate/input_select/list sub-editor has its **own** `ha-sortable` for
its options/items. `ha-sortable`'s `item-moved` is dispatched **composed +
bubbling**, so an inner option drag bubbles up to the outer features sortable and
reorders the **feature** (and collapses the panel, since `_moveFeature` clears
`_editingIndex`) instead of the options — the preview then doesn't change. Fix:
every inner move handler (`_moveOption`/`_moveItem`) must call
`e.stopPropagation()` **first**. (The inner `.handle` elements are safe from the
outer SortableJS because they live in the sub-editor's shadow DOM; only the event
leaks.) Tests that call these handlers directly must pass a real `CustomEvent` —
a plain `{detail}` object has no `stopPropagation`.

## Comfort feature: async history, forecasting, self-collapse

- **History via `callWS`.** `mt-comfort` is the only async element. It calls
  `hass.callWS({ type: 'history/history_during_period', start_time, end_time,
  entity_ids, minimal_response: true, no_attributes: true })`. The response is
  **compact**: per-entity arrays of `{ s: state, lu: last_updated, lc: last_changed }`
  (epoch **seconds**, sometimes only `lc`). `fetchHistory` tolerates both compact
  and verbose key spellings. Needs HA's **recorder**; on error it shows the
  verdict only (no forecast).
- **Current session only — anchor on `climate.last_changed`, not a lookback.**
  The forecast must use only data since the climate turned on (earlier history may
  reflect totally different settings). `_sessionStartMs()` reads the climate
  entity's `last_changed` (it resets when the hvac mode changes, i.e. on turn-on
  or heat↔cool), and history is fetched from there (capped at `MAX_SESSION_MS`
  purely to bound the query). There is **no** `lookback_hours` config and we no
  longer fetch the climate entity's history (so `lastTurnedOnMs` is gone).
- **ETA gating is by TIME COVERAGE, not sample count, + a rough fallback.** The gate
  is `MIN_SPAN_MIN` (6 min): it adapts to the sensor (a coarse sensor qualifies with
  2–3 readings, a fast one needs many — a 2-min blip from a wifi sensor doesn't).
  Below the span → just the plain verdict ("Room feels warm"); **there is no
  "calculating…"** (the user found it noise — don't reintroduce it). Once covered, it
  shows the **accurate** integral `newtonFit` ETA if it converges, else a **rough
  `linearEta`** (straight-line extrapolation of the real trend, works from 2 points)
  so a coarse sensor / the turn-on transient still gets an early estimate that refines
  over time. `linearEta` self-rejects when moving away / flat (capped at 12 h).
  Forecast only when `running` (passed into `ComfortInput`); off → bare verdict.
- **Two ETA phases + COMPACT time format.** Uncomfortable → "{t} until comfortable";
  once comfortable → the Nest-style time to the SETPOINT: "{t} until cooled to 24°C"
  / "{t} until heated to 26°C" (or "won't go below/above N°C" when plateauing short),
  gated by `show_target_eta` and using the accurate fit only (no rough fallback for an
  aggressive setpoint). `formatDuration` is now COMPACT: "7m" / "1h" / "2hr+" (caps at
  ~2 h — precision past that isn't useful). Don't restore the verbose "15 minutes"
  form or append the target clause while uncomfortable.
- **Forecast by INTEGRATION, not differencing (the big issue-4 fix).** Real
  recorders log coarse 0.2–0.3° steps at irregular intervals; estimating `dv/dt`
  by differencing consecutive samples turns that quantization into pure noise
  (r² ≈ 0.05 on real data → `newtonFit` never converged → no ETA ever). `newtonFit`
  now integrates the first-order ODE instead: `v−v₀ = −k·∫v dτ + kA·t`, a 2-var
  regression of `y=v−v₀` on `[∫v dτ, t]`. Integration averages noise out (r² ≈ 0.99
  on the same data). Gates: `MIN_SAMPLES` 4, `MIN_SPAN_MIN` 10, k > 0, `MIN_FIT_R2`
  0.5. **Don't go back to a dv/dt cloud / moving-average.**
- **`Date.now()` / `new Date()` are fine here** — that ban is only for Workflow
  scripts, not card runtime or the web-test-runner browser tests.
- **Verdict always shows (even when OFF); only the *forecast* is gated.** Whenever
  the sensors read, the row shows a comfort verdict — "Room feels comfortable /
  warm / cool / humid" (a direct reading) — **including when the climate is off**
  (the verdict is mode-independent, see below). It upgrades the uncomfortable
  verdict to "…X until room feels comfortable" **only** while running and with a
  confident `newtonFit`. `_hasReadings()` gates the verdict (climate not
  unavailable/unknown + numeric sensors; **off is allowed**); `_isRunning()`
  (not in `OFF_STATES`) additionally gates the forecast/target. The row collapses
  (`nothing` + `feature-visibility`) only when the sensors are unset or the climate
  is unavailable/unknown.
- **Icon + colour come from `result.status`** (`comfortable|warm|cool|humid`), set
  inline in `render()` via `climateModeColor`: warm → heat colour, cool/humid →
  cool colour (the *opposite* of the mode you'd switch on), comfortable → green
  (heat_cool). Don't colour the icon with the dial's active mode colour (it was
  confusing — an orange "warm" thermometer in heat mode).
- **Self-collapse via an event, not just `display:none`.** A hidden `mt-comfort`
  still occupies a grid cell (its `mt-feature-row` host), leaving a stray gap. So
  `mt-comfort` dispatches `feature-visibility {visible}` and `mt-feature-row`
  toggles its **own** `[hidden]` attribute (`:host([hidden]){display:none}`). The
  row starts hidden for `comfort` until told otherwise.
- **Keep logic in `calc/`.** `analyzeComfort` and the forecast math are pure and
  unit-tested without Lit/hass (`calc.test.ts`). The Lit component just parses
  `hass`, calls them, and renders. Extend/test the `calc/` modules, not the widget.
- **Comfort is the PMV model, calculated not configured — clothing from TEMP, not
  mode.** `calc/pmv.ts` is the verbatim ISO 7730 Annex D / ASHRAE 55 Fanger
  algorithm (validated against the standard's table); comfortable = −0.5 < PMV <
  +0.5 plus an absolute‑humidity cap (`HUMIDITY_RATIO_MAX` 0.012). Clothing is
  inferred from the **room temperature** (`cloForTemp`: dynamic clothing,
  `0.95 − 0.075·(T−21)` clamped to [0.5, 1.0] → 1.0 clo at ≤20°C, 0.5 at ≥27°C),
  **NOT the HVAC mode**. The earlier mode-based `cloForClimate` made the *same* room
  temp flip between "comfortable" (cooling) and "warm" (heating) when you switched
  the thermostat — the user rejected that. Temp-based clothing is mode-independent
  and gives a ~21–27°C band. The heat index (`heatIndexC`) is now **only** the
  dial's "feels‑like" number, not the comfort decision. **Don't reintroduce
  comfort_min/max or mode-based clothing** — comfort must be scientific AND
  mode-independent.

## Misc env

- `rsvg-convert` is installed for rasterizing icon SVGs; ImageMagick `montage` is
  **not** — composite multiple SVGs into one, then `rsvg-convert` → PNG.
- While in plan mode once, an unfindable PreToolUse hook blocked
  Write/Bash/ExitPlanMode; the maintainer had to exit plan mode manually.
