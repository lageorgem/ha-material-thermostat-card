# Live full-combination QA

Opt-in QA against a **real HA admin session**, not an unattended CI gate. Use only
the reserved `mtqa` fixtures; never connect physical devices or automations to
them. Supply `HA_URL` and `HA_TOKEN` through the environment/secret manager, never
tracked files. Do not give real HA credentials to untrusted PR builds.

## Run

From this worktree, with Node 24, installed project dependencies and system Chrome:

```sh
node dev/qa/seed.mjs
node dev/qa/push-dashboard.mjs
npm run build
node dev/qa/run-qa.mjs --dry-run
node dev/qa/run-qa.mjs
node dev/qa/run-qa.mjs --lang de --scheme dark
node dev/qa/run-qa.mjs --only features-climate,features-wh --quick --headed
```

Seed before each full run. MQTT fixtures must have initialized target/mode
attributes. If a value cannot be restored, its journey fails before mutation.
`matrix.mjs` declares entity oracles; `cases.mjs` supplies all configurations and
per-card expectations; `dashboard.mjs` supplies the dashboard URL. No fixed case
list is duplicated in the runner. Every declared view is visited, including stock
cards. The runner serves **this worktree's local `dist` build** by intercepting
the HACS resource request; a never-hit route fails. **Opening the dashboard by
hand shows the HACS-installed version**, not the intercepted local build.

| Flag | Behaviour |
| --- | --- |
| `--lang <code>` | Optional in-session `_selectLanguage(code, false)`; never changes the user's profile. Omit to retain the user's language. |
| `--scheme light\|dark` | Playwright `colorScheme`; default light. |
| `--only <view,…>` | Restrict by **view path**, not case ID; unknown paths fail. |
| `--quick` | First non-active option per selector journey instead of every option. All card invariants still run. |
| `--headed` | Show Chrome. |
| `--dry-run` | Offline plan: views, case IDs/counts, invariant counts, each journey and totals. No credentials, build, browser or network needed. |

The live plan resolves the first server theme, matching dashboard publishing;
offline plans omit that unknown theme's additional cases.

## Check catalogue

Each view checks all declared `qa_id` cards, nested `hui-error-card` messages
(including section), and icon SVG readiness. Every section gets a PNG. Stock
cards are render-only; no brittle pixel-diff or stock implementation assertions.

Every custom case gets checks named `<case id>: <check>`:

| Check | Assertion |
| --- | --- |
| `sliders` | Exact dial slider count: 0/1/2. |
| `plus-minus` | Both temperature step buttons present iff declared. |
| `unavailable` | Dial and selector/away control disabled state matches oracle. |
| `state-label` | Zero visible dial status lines on available cards; unavailable/unknown retain their disabled label. |
| `mode-icon` | Water heaters: operation-feature icon below the number, with active-mode icon/color overrides or theme defaults; none without feature, for off/unavailable/unknown, or an empty icon override. Climate preset behaviour unchanged. |
| `selectors` | Feature/display, offered values (set or explicit order), DOM options, overrides, active markers and disabled controls; no unexpected feature family. Disabled dropdowns cannot open: verify item model + disabled trigger. |
| `labels` | No unoverridden raw lowercase/snake_case option labels. |
| `away` | Presence, display, pressed state, disabled state, configured label (including Holiday). |
| `aux` | Each declared auxiliary feature has rendered content/controls; icon-only tiles may render a visible ha-icon without text. |
| `text` | Deep shadow/light DOM text excludes NaN, undefined, null and object-string artefacts. |
| `layout` | No visible descendant outside ha-card by >2 px on any side; no neighbouring card overlap. Floating menus/popovers and orbit wrapper boxes excluded; orbit children checked. Horizontally scrolling chips WARN (known), not FAIL. |
| `values` | Single target or dual low/high aria values; current-temperature visibility/value (read-only uses primary number). Digits normalize split superscripts and locale separators; absent or “—” means no current value. |

## Journeys

Risk priority: incorrect writes and failed restoration have high impact. Real
module/UI/HA integration gets exhaustive selector payload/state round trips;
cosmetic pixel equality is deliberately not tested (low impact, high upkeep).

| Journey | Coverage |
| --- | --- |
| `J-select` | Every selector in features-climate/features-wh: all non-active options through icons/dropdown/tile; exactly one matching domain/service/entity/payload frame; live state/attribute convergence within 5 s; finally restore and assert. |
| `J-dial` | Three dial styles for full/range/tank Options with current-primary false: ± debounce (no call before 600 ms), ArrowUp, PageUp (+10 steps), Home/End clamping; both dual handles independently; exactly one expected temperature frame and live state; finally restore. |
| `J-away` | REST away-on/off cases: boolean set_away_mode frame only; disabled emits nothing. Verify REST fixture remains unchanged. |
| `J-unavailable` | Dispatch clicks to disabled selector/away controls; no service frame. |
| `J-reject` | Reject halo Options: prove optimistic movement, outgoing temperature frame, return to server value within 8 s. |
| `J-aux` | REST-only input-select options assert `input_select.select_option` frames only, without convergence/restore. Switch group expects `homeassistant.turn_off` for the other entities then `homeassistant.turn_on` for the selected entity; switch list expects `homeassistant.toggle`. Assert MQTT convergence and restore switch originals using `homeassistant.turn_on/turn_off`. Button-list expects `button.press`; presses cannot be undone. Entity targets may be strings or lists. |
| `J-locale` | Non-en/en-GB, scenario views (`s-*`) only: fractional aria-valuetext decimal separator, HVAC/operation labels compared with translated stock options in the same view. Other views skip this journey. Missing scenario stock counterparts or unusable translation evidence FAIL rather than claiming parity. |

REST-away/unavailable and reject are intentional guarded/non-echo exceptions to
the `interactive` flag. Read-only aux sensors/comfort do not get mutation journeys.

## Evidence, bounds and safety

`dev/qa/out/<actual-language>-<scheme>/<view>/<section-slug>.png` and
`report.json` contain cases, checks, outgoing call_service frames, console errors,
route-hit count, restores and screenshot paths. Summary: per-view PASS/FAIL/WARN,
all FAIL lines, totals. Any FAIL exits 1. Bundle-related console errors fail;
unrelated frontend console errors remain in report evidence.

Credentials enter localStorage only in the top frame at `new URL(HA_URL).origin`.
Unexpected top-level origins abort and close the browser context. Tokens are
redacted from errors, frames and reports; authentication frames are not retained.
No storage-state files, traces or video. Every component-internal CSS selector
lives in the runner's `S` constants block.

Evaluation/action deadlines: 30 s; navigation: 60 s; readiness: 30 s;
state/frame polls: 5 s; rollback: 8 s. Each journey has a 60 s deadline
(dial: 120 s); views have finite budgets proportional to declared case/journey
counts. Deadline expiry closes the context, including wedged evaluations.
Fatal view/journey errors record FAIL for the affected view, abandon its remaining
checks and continue with the next view in a fresh context. Recovery re-injects
the guarded token, reapplies the session language and requires a fresh local-bundle
route hit. Cancelled view work cannot resume frontend actions in a later context.
Only an origin violation or missing credentials aborts the whole run.
Duplicate/negative assertions use a bounded 1.2 s observation window, not a
readiness sleep. Context/browser shutdown: 10 s each. Before a reversible mutation,
a Node-side journal records its domain/service/data and expected state. Every
journey's `finally`, view recovery and final shutdown drain the journal through
independently bounded REST service POSTs (30 s per request), then REST state reads
until convergence (5 s polling window; an in-flight read still has a 30 s bound).
Each journal drain allows up to three transient-error retries per restore entry,
shared across its service POST and verification reads, after 1 s, 3 s and 6 s.
Network failures/timeouts and HTTP 429/502/503/504 are retryable; other HTTP
errors (including other 4xx) fail immediately. Each request retains its 30 s bound.
Successful retries still require restored-state verification and do not emit FAIL.
Restore evidence records `retries` (retry count) and `lastError` (last redacted
request error, or null), including on successful restoration.
Restoration never uses the page, so a closed context or fatal frontend timeout
cannot prevent sending it. Every entry is attempted even if another restore fails;
failures report `FAIL restore: <entity>` and remain queued for retry at subsequent
drains, including shutdown. Pending restores block further mutations of that entity.
Restoration attempts and results are recorded in `report.json`, not WebSocket frames.
Hard process termination or an unreachable HA can still prevent restoration:
**reseed before retrying**. The journal is in memory, not persisted to disk.
Button presses cannot be undone; use only the dedicated fixture buttons.

```sh
# Offline runner verification; live execution is explicitly maintainer-run.
node --check dev/qa/run-qa.mjs
node dev/qa/run-qa.mjs --dry-run | tail -15
# Cleanup fixtures/dashboard; report evidence remains in ignored out/.
node dev/qa/push-dashboard.mjs --delete
node dev/qa/seed.mjs --cleanup
```
