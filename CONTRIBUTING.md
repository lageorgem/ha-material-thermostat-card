# Contributing

Thanks for helping improve Material Thermostat Card! Bug reports, focused fixes,
documentation and feature ideas are welcome.

## Choose a focused change

Search existing issues and the [README](README.md) first. Use the repository's
bug or feature issue form to share reproducible problems or ideas. Discuss new
features and changes to defaults in an issue before implementing them; small,
obvious bug fixes do not need advance approval.

Keep each PR about one underlying problem. Link the relevant issue or discussion
and leave unrelated cleanup for another PR.

## Set up locally

Use **Node.js 20+** and npm; CI runs Node 20. Install **Google Chrome** for local
unit/component and end-to-end tests. The e2e runner also needs **Python 3** on
`PATH` as `python3` to serve the harness.

From your local checkout:

```bash
npm ci
npm run build
```

The build writes `dist/material-thermostat-card.js`. Local test configurations
select system Chrome; CI installs and uses Playwright's bundled Chromium instead.
Downloading Chromium alone does not change the local Chrome selection.

## Develop and verify

- `npm run watch` — rebuild the bundle on changes.
- `npm run typecheck` — TypeScript checks without emitting files.
- `npm run lint` / `npm run lint:fix` — lint source / apply ESLint fixes.
- `npm run format` — format `src/**/*.ts` with Prettier.
- `npm test` — full unit/component suite with coverage in a real browser.
- `npm run test:watch` — unit/component tests in watch mode.
- `npm run build` — rebuild the distributable bundle.
- `npm run test:e2e` — Playwright journeys against the built bundle; build first.

For source changes, add or update regression tests and run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

`npm test` enforces **100% statements, branches, functions and lines** across the
source. A focused run is useful while iterating:

```bash
npx web-test-runner --files "test/unit/foo.test.ts" --config web-test-runner.config.mjs
```

Replace `foo.test.ts` with the relevant test file. A subset can fail the global
coverage gate even when its tests pass; only the full suite establishes coverage.
See [testing notes](.ai/testing.md) for runner details and test patterns.

For manual layout/interaction checks, serve the repository over HTTP, for example
with `python3 -m http.server 8000`, then visit `http://localhost:8000/dev/index.html`
after building. The harness stubs Home Assistant components: it can check layout
and interaction, but icons may render as dots and it cannot establish final visual
fidelity. For UI changes, check real Home Assistant when available and state any
remaining gaps. Read the [visual gotchas](.ai/gotchas.md) before debugging visuals.

A live Home Assistant instance or private credentials are **not required for every
PR**. The separate opt-in [live QA runbook](dev/qa/README.md) requires Node 24 and
additional services; it is not the local mock e2e suite.

## Open a reviewable PR

- Explain the problem, approach and related issue/discussion.
- Give exact verification commands and results, plus manual steps and observed
  behavior. For focused checks, identify the subset. State what was not tested and
  why; documentation-only changes do not need application tests.
- For UI changes, upload redacted before/after screenshots or recordings to the
  PR and identify the browser/device, theme and relevant layout. Do not commit
  PR-only evidence assets.
- **Rebuild with `npm run build` and include `dist/` for source changes.** The
  bundle is committed and CI rejects stale or missing build output.
- Do not bump versions, create tags or prepare releases unless the maintainer asks.
- Never include tokens, passwords, Home Assistant URLs containing credentials or
  private data in commits, reports, logs or screenshots. Share redacted examples,
  not access to your instance.

AI-assisted contributions are welcome. You may mention tools used or where review
would help; disclosure is optional. Review and verify the contribution yourself.
