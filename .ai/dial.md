# The circular dial (`src/dial/circular-dial.ts`)

`<mt-circular-dial>` is the heart of the card: an SVG arc with HTML marker
overlays, drag/step/keyboard interaction, and the temperature-segment animations.
It's a controlled component — it emits `value-changing`/`value-changed` and never
calls services itself.

## Geometry

A fixed **320×320 viewBox**. The interactive range is a **270° arc with a gap at
the bottom** (Nest/Google-Home style, so mid-range values sit at the top).

```
VIEW   = 320,  CENTER = 160,  RADIUS = 130
ARC_START = 225°   (clockwise from top → bottom-LEFT = min value, fraction 0)
SWEEP     = 270°
ARC_END   = 135°   (bottom-RIGHT = max value, fraction 1)
```

- `polar(angleDeg, r)` — angle (0°=top, CW+) → `{x,y}`. **Note the −90 offset**:
  it maps 0° to the top of the circle.
- `arcPath(a0, a1, r)` — an SVG arc `M…A…` string (auto large-arc flag).
- `_angleOf(value)` / `_fracOf(value)` — value → angle / 0..1 fraction along the
  arc.
- The full ring path = `arcPath(ARC_START, ARC_START+SWEEP, RADIUS)`.

## Markers are HTML overlays, not SVG

Dots and labels (`setpoint` dot, `current` dot, mode icon, temperatures) are
**absolutely-positioned HTML divs that orbit** the center via CSS `rotate()`,
**not** SVG elements. Why: animating SVG `cx`/`cy` is unreliable in
Safari/WKWebView, and `rotate` of an HTML overlay rides the arc smoothly.

- `_dotOrbit(angle, cls)` — a `.orbit` div (inset:0, transform-origin 50% 50%)
  `rotate(angle)`, with a child dot pinned on the ring centerline
  (`top: 9.375%` = (160−130)/320).
- `_labelOrbit(angle, content)` — same, but the label counter-rotates
  (`rotate(-angle)`) to stay upright; pinned at `top: 18.75%` (just inside ring).
- **`<svg>` must be `display:block`** so its coordinate box aligns with the
  absolutely-positioned overlays (an inline SVG's baseline gap offsets them).
- When the setpoint icon and current-temp label are within `OVERLAP_DEG` (18°)
  they merge into one marker (icon sits `position:absolute; right:100%` of the
  temp).

## The value segment

The colored arc between setpoint↔current (single) or low↔high (dual) is **one SVG
path dashed open** — never a separately-computed `d` (animating `d` between arcs
with different large-arc flags makes the arc balloon/bend; avoid it entirely):

- `path.value` uses `pathLength="1000"` so the geometry is normalized to 1000
  units regardless of radius.
- `stroke-dasharray = "${(segE-segS)*1000} 1000"` (a single dash = the segment,
  then a 1000-unit gap so nothing repeats).
- `stroke-dashoffset = "${-segS*1000}"` shifts the dash so it **starts at
  fraction `segS`**. (Negative offset moves the dash forward toward the arc end.)
- When there's no segment (off mode), opacity is 0. A zero-length dash + round
  linecap would otherwise leave a stray dot.

`segS/segE` are fractions. **Single mode** renders ONE persistent `.value` path
(so it animates on turn-on/off + during the wipe) from `min(frac(value),
frac(current))` to `max(...)`, colored by `_demandSensible` — the demand color
when the direction is meaningful (cool needs current > setpoint, heat needs
current < setpoint), else `IDLE_COLOR` gray (e.g. cool mode but already below the
setpoint → gray, "not cooling anything").

**Gray-when-no-sense is single-setpoint ONLY, and only the segment grays.** The
halo, ring, mode icon, and big number all read from `--dial-color`, which is
`_dialColor`/`_effectiveMode` (mode-derived) and is **never** affected by
`_demandSensible` — so an inactive heater/cooler still glows its mode color, only
the arc segment goes gray. Dual (heat_cool) does NOT use this rule at all (see
below).

## Dual (heat_cool): temperature-derived sub-mode

In dual mode the dial does NOT just fill between the two setpoints. It derives
the **active sub-mode from the current temperature** (`_dualActive`):
`current > displayHigh` → `'cool'`, `current < displayLow` → `'heat'`, else
`null` (idle, in range). It renders **two persistent bands** (both `.value`
paths, classes `range` + `demand`) — ALWAYS both, so they **cross-fade** as the
sub-mode changes instead of popping (see below):

- the **range band** `.value.range` `[low, high]`:
  - **idle (current in range)** → the **heat_cool mode color** (= `--dial-color`,
    green), full opacity (matches the halo — the whole comfort range glows).
  - **actively heating/cooling** → muted **gray** (`IDLE_COLOR`, opacity 0.5),
    so the demand band reads as the active one.
- the **demand band** `.value.demand`: the overshoot from the crossed setpoint to
  the current temp — cooling → `[high, current]` (cool color); heating →
  `[current, low]` (heat color); **idle → opacity 0** (faded out, NOT removed).
  Side (cool/heat) is picked by `current` vs the setpoint midpoint, and the
  geometry is **continuous across the boundary** (shrinks to zero as a setpoint
  meets current), so toggling opacity fades it cleanly.

⚠️ Do NOT make the range band gray when idle, and do NOT remove the demand band
when idle (rebuild from the array each render reused these by position — keep BOTH
pushed so Lit reuses the same nodes and the opacity/stroke transitions fire).

`_effectiveMode`/`_dialColor` follow the sub-mode (cool/heat/heat_cool). The
**cross-fade** works because `--dial-color` is a registered animatable `<color>`
on `.dial`: the halo, ring, and big number (`color: var(--dial-color)`) all
interpolate with it — even the centre `.value-text`, which is re-created on the
collapsed↔range flip, picks up the *currently animating* inherited value. The
range band stroke (gray↔green) and the demand band opacity (1↔0) transition via
the `.value` CSS transition. The mode **wipe is skipped for dual**.

**Center readout** (`_renderDualCenter` gated by `_showRange`): shows the
"Heat/Cool" **range** (low – high) while dragging, for **5s after a setpoint
changes** (`_bumpRangeDisplay` 5s timer, armed in `updated()` — guarded by
`_prevLow/_prevHigh` so the initial set doesn't arm it), or while idle. Otherwise
it **collapses** to the active sub-mode label ("Cooling"/"Heating") + the
targeted setpoint value, **and the active setpoint's ring marker shows the
sub-mode icon** (`dualSetIconEl`, like single mode — the icon is at the SETPOINT,
not in the centre text). `show_current_as_primary` makes the collapsed big number
the **current temperature** (the setpoint is then shown only by the icon marker),
mirroring single mode.

**Crowding guard (`_centerTight`)** — the orbiting setpoint/current number labels
sit at radius ~100 and can collide with the (horizontally widest) centre readout
when a marker lands near 3 or 9 o'clock. `_centerTight` is true when any numeric
marker is within `SIDE_GUARD_DEG` (26°) of 90°/270° (dual: low/high/current;
single: current only — the single setpoint marker is a small icon). When true the
`.center` gets a `tight` class that shrinks the value/unit and lets `.temp` wrap
(`max-width: 46%`), so the readout stays clear of the labels. Base dual-range font
is also smaller than single (two numbers + dash). ⚠️ Don't widen the centre past
~46% when tight or the °C overlaps the right-hand markers again (the original bug).

## Interaction

- **Drag**: `_onPointerDown` gates on `_isRingHit` (distance band
  `[RADIUS−32, RADIUS+22]` **and** not in the bottom gap) so taps in the
  center/gap/outside don't jump the setpoint. A press sets `_dragging=true` and
  markers animate toward the pointer (smooth follow). Dual mode picks the nearer
  handle. Emits `value-changing` live.
- **Tap-to-set** is just a short drag — same path, animated.
- **+/− step buttons** (`.adjust`, single mode only) sit in the bottom gap
  (`top:80%`), `pointer-events:none` on the container with the buttons re-enabled.
- **Keyboard** (single mode): arrows step by `step`; emits `value-changed`.
- Sizes scale with the dial via **container queries**: `.dial` has
  `container-type: inline-size` and inner text/dots/buttons use `clamp(min, Ncqi,
  max)`. ⚠️ A `container-type` element reports **zero intrinsic width** — the host
  has `width:100%` so the dial doesn't collapse (see [`gotchas.md`](gotchas.md)).

## Color & the `--dial-color` custom property

`--dial-color` is registered via `CSS.registerProperty` as an **animatable
`<color>`** (syntax `<color>`), so the halo gradient, ring, value, and big number
**cross-fade** between mode colors instead of jumping. It's set inline on `.dial`
and transitioned in CSS. Off/uncolored modes use `--mt-on-surface-variant` and a
dimmed halo. `COLORED_MODES = ['cool','heat','heat_cool','auto','dry','fan_only']`.

The halo (`#mt-glow` radialGradient) is a **6-stop falloff from 0.38 at center to
opacity 0 at the perimeter** — ending at 0 (not 0.02) avoids a faint hard-edged
disc.

## Animations

There are three distinct value-segment animations. **Keep the first two as-is.**

### 1. Turn-on (off → colored mode) — CSS transition
The segment appears: `stroke-dasharray` grows `0 1000 → ${len} 1000` and
`stroke-dashoffset` shifts `0 → -segStart` (both transitioned via `--mt-motion-*`
on `.value`). Visually the band **slides in from the arc start (bottom-left)** and
settles between setpoint and current.

### 2. Turn-off (colored → off) — CSS transition
The reverse: the band **slides back out to the left** and fades.

### 3. Mode change (colored → colored) — Web Animations API, `_runWipe()`
Triggered from `updated()` when `mode` changes between two colored modes (guarded
by `_prevColor`/`_prevOff` so off↔on keeps animations 1/2). It paints the **new**
color on the base `.value` path and overlays an **old-color** copy
(`.wipe-value`), then animates both:

- **New** replays the exact turn-on keyframes (slides in from the left):
  `{dasharray:'0 1000', dashoffset:'0'} → {dasharray:'${segLen} 1000',
  dashoffset:'${-segStart}'}` (no fill — lands on its natural CSS state).
- **Old** keeps its length and translates its origin off the arc's far end
  (slides out right): `{… dashoffset:'${-segStart}'} → {… dashoffset:'-1000'}`,
  `fill: 'forwards'`, cleared when `.finished` resolves (`_wipeFrom = null` →
  overlay removed).

Both run 460 ms, `cubic-bezier(0.2, 0, 0, 1)`.

**Implementation notes / traps:**
- The overlay path **must** be built with Lit's `svg\`…\`` tag, **not**
  `html\`…\``. A nested `html` SVG node renders in the HTML namespace, has no
  `getBBox`, and **never paints** — this silently defeated every overlay approach
  (clipPath, CSS mask, ring overlay) for hours. See [`gotchas.md`](gotchas.md).
- `_runWipe` runs after `updateComplete` so the overlay is in the DOM, and reads
  the **live** segment geometry from the base path's
  `stroke-dasharray`/`-dashoffset` (`segLen`, `segStart`).
- Driving real SVG paths with WAAPI is robust; CSS-animating `<rect>` geometry
  inside a `<clipPath>` does **not** update the clip in Chrome, and CSS `mask` on
  an SVG `<g>` was unreliable.

**Known tradeoff of animation #3 (documented, shipped per maintainer's explicit
request):** because the old band exits the *far-right* arc end while the new band
enters the *far-left* end, when the value band rests **mid-arc** (e.g. current
21°, target 22°) the two colors diverge and briefly show empty ring track across
the top (~50% of the timeline). It looks gapless only when the band sits at an
extreme (`segStart ≈ 0`). The maintainer was offered a gapless "boundary sweep"
alternative (new regrows in place from `segStart`, old recedes toward `segEnd` —
this was the v0.8.0 behavior) and chose the literal slide anyway. **If asked to
fix the gap, revert `_runWipe` to that boundary-sweep keyframe pair.**

## Verifying animations

Use Playwright-core driving system Chrome (see [`gotchas.md`](gotchas.md)). To
capture a mid-animation still, pause WAAPI and seek:
`dialEl.shadowRoot.getAnimations({subtree:true}).forEach(a => { a.pause();
a.currentTime = 460 * fraction; })`. Use **a fresh page per frame** — animations
(esp. `fill:'forwards'` ones) accumulate across triggers and corrupt later
frames. `document.getAnimations()` does **not** reach into shadow DOM in Chrome;
call `getAnimations()` on the dial's shadow root.
