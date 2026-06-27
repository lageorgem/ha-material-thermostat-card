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

## Misc env

- `rsvg-convert` is installed for rasterizing icon SVGs; ImageMagick `montage` is
  **not** — composite multiple SVGs into one, then `rsvg-convert` → PNG.
- While in plan mode once, an unfindable PreToolUse hook blocked
  Write/Bash/ExitPlanMode; the maintainer had to exit plan mode manually.
