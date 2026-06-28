# Testing

The suite runs in a **real browser** (Chrome) — these are web components, so the
DOM APIs they use (shadow roots, pointer capture, SVG `getBBox`, the Web
Animations API, `ResizeObserver`, container queries) need a real engine. jsdom is
not used.

## Layout

```
web-test-runner.config.mjs   unit/component runner config (coverage + 100% threshold)
playwright.config.ts         e2e config (drives the built bundle)
test/
  helpers.ts                 makeHass / climateState / entityState / oncePromise / captureEvents
  unit/*.test.ts             one file per source cluster (Mocha BDD + @open-wc/testing)
e2e/
  index.html                 mock-hass harness that imports dist/material-thermostat-card.js
  card.spec.ts               Playwright user-journey specs
```

## Unit / component tests — `npm test`

- **`@web/test-runner`** + **`@open-wc/testing`** (`fixture`, `html`, `expect`), TypeScript +
  Lit decorators transpiled by **`@web/dev-server-esbuild`** (reads `tsconfig.json`, so
  `experimentalDecorators` + `useDefineForClassFields:false` are honored — required for Lit).
- **V8 coverage** mapped back to `.ts`. Gated at **100%** (statements/branches/functions/lines) in
  `coverageConfig.threshold`. Genuinely-unreachable defensive code is removed where safe, or marked
  with a justified `/* c8 ignore */` (module-init `CSS.registerProperty` catch; the `arcPath`
  large-arc helper whose sole caller always spans 270°; the ResizeObserver empty-entries guard).
- Run one file while iterating: `npx web-test-runner --files "test/unit/foo.test.ts" --config web-test-runner.config.mjs` (the global coverage % shown for a subset is meaningless — only the full run's number counts).
- Patterns (see `test/helpers.ts`):
  - Mount: `await fixture(html\`<mt-foo .prop=${x}></mt-foo>\`)`; import the module to register the tag.
  - `makeHass(states)` returns a hass whose `callService` records into `hass.__calls`.
  - Assert emitted events with `oncePromise(el, 'event')` / `captureEvents('event')`.
  - Private methods/state are exercised via `(el as any)._method(...)` where DOM simulation is
    impractical (this is intentional, for branch coverage).
  - The editors render HA elements that aren't defined in tests (`ha-form`, `ha-entity-picker`,
    `ha-icon-picker`, `ha-textfield`, `ha-sortable`, `ha-button`) — they render inert (no throw);
    drive their handlers by dispatching synthetic `value-changed`/`input`/`item-moved` events from
    those nodes, or call the handler directly.
  - Pointer-driven components (dial, grid-slider) compute client coords from the target's
    `getBoundingClientRect()` and stub `setPointerCapture`/`releasePointerCapture`.

## E2E tests — `npm run test:e2e` (build first)

- **Playwright** loads `e2e/index.html` (served by `python3 -m http.server`, wired via the config's
  `webServer`). That page stubs `ha-icon`/`ha-card`, imports the **built** `dist/` bundle, mounts the
  card with a mock `hass` whose `callService` pushes to `window.__calls`, and exposes `window.__card`.
- Specs assert full journeys: dial renders, mode chip → `set_hvac_mode`, dropdown select →
  `set_fan_mode`, `+` step → debounced `set_temperature`, switch group off-then-on, header more-info.
- Playwright CSS locators **pierce open shadow roots**, so `page.locator('.chip[title="Heat"]')`
  finds nodes across the nested shadow DOM.

## Browser selection (local vs CI)

Both runners use the **system Chrome channel locally** (no download) and **Playwright's bundled
chromium in CI** (`process.env.CI` switch in both configs; CI runs
`npx playwright install --with-deps chromium`).

## CI

`.github/workflows/test.yml` — a `unit` job (npm test → upload `coverage/lcov.info` to Codecov) and
an `e2e` job (build → Playwright, uploads the HTML report artifact). `validate.yml` still handles
lint/typecheck/build/HACS. The Codecov badge needs the repo enabled on Codecov (and `CODECOV_TOKEN`
secret if required); `fail_ci_if_error:false` keeps CI green until then.

## Notes / gotchas

- A genuine bug was found by the dial tests and fixed: `_onPointerDown` must read the displayed
  low/high **before** setting `_dragging` (the `_display*` getters switch to drag state once
  dragging), or the first dual-mode press seeds the handles from stale defaults.
- Lit logs "Lit is in dev mode" and occasionally "scheduled an update after an update completed"
  during tests — both benign (the latter from setting props post-`updateComplete` in tests).
