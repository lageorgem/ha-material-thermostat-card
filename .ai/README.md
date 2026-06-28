# `.ai/` — context for AI agents working on this repo

These docs persist the hard-won knowledge about this codebase so a model picking
it up cold can be productive immediately. **Read this file first, then the doc
matching your task.** They are written for an LLM, not an end user — the
end-user docs live in the root [`README.md`](../README.md).

## What this project is

**Material Thermostat Card** — a single-file Home Assistant Lovelace custom card
(a draggable Material 3 / Nest-style thermostat dial + a configurable stack of
selector/list/tile "features"). TypeScript + **Lit 3**, bundled with Rollup to
`dist/material-thermostat-card.js`. No backend, no tests (yet) — it's a frontend
web component.

## Doc map

| Doc | Read it when you're… |
| --- | --- |
| [`architecture.md`](architecture.md) | getting oriented — file map, component tree, data flow, build/release/CI |
| [`dial.md`](dial.md) | touching the circular dial: geometry, markers, the value segment, or the animations |
| [`layout.md`](layout.md) | changing how features are sized/placed, the grid, or responsiveness |
| [`features.md`](features.md) | adding/changing a feature type or its visual editor |
| [`icons.md`](icons.md) | working on the `mt:` AC-swing icon set or its generator |
| [`testing.md`](testing.md) | writing/running tests — the unit (`@web/test-runner`) + e2e (Playwright) setup, patterns, coverage gate, CI |
| [`gotchas.md`](gotchas.md) | **before debugging anything visual** — the non-obvious traps that cost hours |

## Golden rules (read before you commit)

1. **`dist/` is committed and CI-enforced.** `npm run build` after any `src/`
   change and commit the result, or the `validate.yml` "Ensure dist is committed"
   step fails the build. The bundle is the published artifact.
2. **Bump the version in two places** for a release: `CARD_VERSION` in
   `src/const.ts` **and** `version` in `package.json` (keep them identical).
3. **JSDoc every public method/class with `@param` lines** — the surrounding code
   does this consistently; match it.
4. **Verify visuals in real Home Assistant**, not just the dev harness. The
   harness stubs HA components (icons render as dots) and has bitten us with
   false greens — see [`gotchas.md`](gotchas.md). The math being provably correct
   is not evidence the card works.
5. **Don't create branches.** The maintainer manages branches; commit to the
   branch you're on (usually `main` for this side project).
6. **`svg\`…\`` not `html\`…\`` for SVG fragments.** A nested `html` template for
   an SVG node renders in the HTML namespace and silently never paints. This is
   the single most expensive trap in the repo — see [`gotchas.md`](gotchas.md).

## Quick commands

```bash
npm run build      # rollup -> dist/material-thermostat-card.js (MUST commit dist)
npm run watch      # rebuild on change
npm run typecheck  # tsc --noEmit
npm run lint       # eslint src/**/*.ts
npm run lint:fix   # eslint --fix
npm run format     # prettier --write
npm test           # unit/component tests (real Chrome) + coverage (100% gate)
npm run test:e2e   # Playwright e2e against the built bundle (build first)
node tools/gen-icons.mjs   # regenerate the mt: icon set into src/icons.generated.ts
# Regenerate README screenshots against a real HA instance (token via env):
HA_URL=https://your.ui.nabu.casa HA_TOKEN=<long-lived-token> node dev/ha-shots.mjs
```

Quality gates: `lint`, `typecheck`, `build` + dist-up-to-date, HACS validation
(`validate.yml`), and the unit + e2e suites with a 100% coverage gate
(`test.yml`). See [`testing.md`](testing.md).
