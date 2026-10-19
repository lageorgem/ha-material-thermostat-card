# Live stock-parity QA

Runs against a **real admin HA session**. Reserved scope: MQTT device `mtqa`,
entities `climate.mtqa_*` / `water_heater.mtqa_*`, topics `mtqa/*` and discovery
`homeassistant/{climate,water_heater}/mtqa_*/config`, dashboard `/mt-parity-qa/0`.
Do not attach automations to these entities. No physical devices are controlled by
this harness; check that reserved IDs are unused before first seed.

## Run

From this worktree, Node 24, installed project dependencies, system Chrome:

```sh
# Supply HA_URL and HA_TOKEN through your environment/secret manager.
# HA_URL: HA origin (HTTPS preferred; HTTP only for trusted local networks).
# HA_TOKEN: long-lived admin access token. Never put it in tracked files.
node dev/qa/seed.mjs
node dev/qa/push-dashboard.mjs
npm run build
node dev/qa/run-qa.mjs
node dev/qa/seed.mjs                  # restore repeatable initial values
node dev/qa/run-qa.mjs --lang de
node dev/qa/run-qa.mjs --only full-icons,reject --headed
```

`seed` and `push-dashboard` are idempotent. Seed resets optimistic entities using
HA services after MQTT discovery; no MQTT command echo process is needed. Reject
has separate retained server state and deliberately no echo. REST-only entities
are display fixtures: service journeys assert outgoing frames, not state changes.
Seed before every full run (away starts on; target values must be fractional).
MQTT integration and `mqtt.publish` must exist. English/German translations are
loaded by the real frontend, not mocked. `--only` runs checks for selected cases;
use both `heat,full-icons` for both German localization checks.

Every CLI supports `--dry-run`: no credentials, network, browser or dist required.
It prints complete request/config/check payloads. The dry-run dashboard omits the
unknown server theme; live publishing uses the first `frontend/get_themes` name.
All REST/WS requests and browser operations have 30-second timeouts; state
assertions use 5 seconds, rollback 8 seconds. Negative/duplicate checks observe
for 1.2 seconds after the expected action (longer than the 600 ms debounce).

## Cases and checks

| Case | Coverage |
| --- | --- |
| full-icons | J1 HVAC round trip + restore; J2 preset/fan/swing/horizontal round trips; J3 one temperature frame, +0.5 |
| full-dropdown | All supported climate selectors rendered as dropdowns |
| full-tile | Tile selectors; Google dial |
| stock-yaml | J11 stock-style dropdown syntax restricts offered HVAC modes to heat/cool/off; preset/horizontal includes |
| range-auto | J5 two sliders in auto, current temperature primary |
| range-mqtt | J4 heat_cool increment sends both bounds; empty preset feature safe |
| heat | Structured name + first available server theme; J13 German fractional target comma |
| reject | J6 optimistic display moves, frame sent, server target restored within 8 s |
| fan-readonly | J7 no target slider/increment, HVAC/fan rows |
| off | Off rendering |
| climate-unavailable | J10 localized unavailable label and inert mode chips |
| wh-tank | J8 +0.5 temperature frame and Eco operation round trip |
| wh-tank-dropdown | Stock operation_modes include syntax, dropdown |
| wh-away | J9 away-off boolean frame; operation tile |
| wh-basic | Minimal water heater rendering |
| wh-readonly | J7 no target slider/increment |
| wh-unavailable | J10 localized unavailable label and inert operation chips |
| wh-with-aux | Water heater plus existing `sensor.tmp_1_temperature` sensor-list |

Every case: visible ha-card + dial, no missing-entity text, paired section PNG,
J12 bounds don't overlap stock and ha-card isn't vertically clipped. Each section
has `QA:<case-id>` heading; no card_mod. Stock tile equivalent is dropdown (stock
has no tile style); sensor-list is custom-only and omitted from stock config.
There are **five** climate selector types in the supplied schema (HVAC, preset,
fan, swing, horizontal swing); all five are included in full cases.

Risk focus: service payloads and HA state convergence (medium likelihood/high
impact); rejection/read-only/unavailable guards. Dropdown/tile exhaustive option
permutations and pixel-perfect stock comparison are intentionally manual: lower
risk, expensive brittle automation. PNGs support side-by-side review; they are
not a visual-diff pass claim. J13 also checks German HVAC labels in full-icons.

## Evidence and cleanup

`dev/qa/out/<lang>/`: section PNGs and `report.json` (case/check evidence, only
outgoing call_service frames, bundle-related console errors). Any FAIL exits 1.
The local dist bundle is intercepted over the installed HACS resource URL; a
never-hit route fails rather than silently testing HACS. Selectors are centralized
at the top of `run-qa.mjs`; localized chip titles come from rendered row items.
Credentials are injected in browser localStorage only, never written to reports,
traces, storage-state files or logs. No browser tracing/video enabled.

```sh
node dev/qa/push-dashboard.mjs --delete
node dev/qa/seed.mjs --cleanup
```

Cleanup clears **every** retained discovery and state publication in the manifest
and deletes all six REST entities. It can be repeated safely. It does not delete
unrelated dashboards/resources or force-remove HA's MQTT entity/device registry
history. If interrupted, rerun cleanup. Local evidence remains in ignored `out/`.
These are opt-in live QA scripts, not an unattended CI gate; never supply real HA
credentials to untrusted PR builds. Offline verification:

```sh
for f in dev/qa/*.mjs; do node --check "$f"; done
node dev/qa/seed.mjs --dry-run
node dev/qa/push-dashboard.mjs --dry-run
node dev/qa/run-qa.mjs --dry-run
```
