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

## Dual (heat_cool): temperature-derived sub-mode

In dual mode the dial does NOT just fill between the two setpoints. It derives
the **active sub-mode from the current temperature** (`_dualActive`):
`current > displayHigh` → `'cool'`, `current < displayLow` → `'heat'`, else
`null` (idle, in range). Then it renders **two** bands (each a `.value` path):

- a muted **gray "range" band** between the setpoints (`.value.idle`, opacity
  0.5) — always present, so the range is never empty.
- a **colored demand band** from the active setpoint to the current temp: cooling
  → `[high, current]` in the cool color; heating → `[current, low]` in heat;
  idle → none.

`_effectiveMode`/`_dialColor` follow the sub-mode (cool/heat/heat_cool), so the
halo + big number recolor too. The mode **wipe is skipped for dual** (colors
change via the CSS `stroke` transition, not the slide).

**Center readout** (`_renderDualCenter` gated by `_showRange`): shows the
"Heat/Cool" **range** (low – high) while dragging, for **5s after a setpoint
changes** (`_bumpRangeDisplay` 5s timer, armed in `updated()` — guarded by
`_prevLow/_prevHigh` so the initial set doesn't arm it), or while idle. Otherwise
it **collapses** to the active sub-mode label ("Cooling"/"Heating") + the single
setpoint being targeted (high while cooling, low while heating).

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
