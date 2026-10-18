# The circular dial (`src/dial/circular-dial.ts`)

`<mt-circular-dial>` is the heart of the card: an SVG arc with HTML marker
overlays, drag/step/keyboard interaction, and the temperature-segment animations.
It's a controlled component — it emits `value-changing`/`value-changed` and never
calls services itself.

## Geometry

A fixed **320×320 viewBox**. The interactive range is a **306° near-full arc
with a 54° gap at the bottom** (Google-Home style, so mid-range values sit at the top).

```
VIEW   = 320,  CENTER = 160,  RADIUS = 130
ARC_START    = 207°   (clockwise from top → bottom-LEFT = min value, fraction 0)
SWEEP        = 306°
ARC_END_WRAP = 153°   ((ARC_START+SWEEP)%360; bottom-RIGHT = max, fraction 1)
```

- `polar(angleDeg, r)` — angle (0°=top, CW+) → `{x,y}`. **Note the −90 offset**:
  it maps 0° to the top of the circle.
- `arcPath(a0, a1, r)` — an SVG arc `M…A…` string (auto large-arc flag).
- `_angleOf(value)` / `_fracOf(value)` — value → angle / 0..1 fraction along the
  arc.
- The full ring path = `arcPath(ARC_START, ARC_START+SWEEP, RADIUS)`.
- `dialStyle: 'halo' | 'minimal' | 'google'` defaults to `'halo'`; unknown values
  resolve to halo. `.dial` carries the resolved `style-<value>` class in single
  and dual mode. Halo retains today's gradient (active opacity 1, off/idle 0.5),
  with no background disc. Minimal has no disc and glow opacity 0 in every state.
  Google paints `<circle class="disc" cx="160" cy="160" r="148.5"
  fill="var(--mt-surface-container-high)">` before the glow, with
  `pointer-events:none`; its glow also stays at opacity 0 in every state.

## Markers are HTML overlays, not SVG

Dots and labels (`setpoint` dot, `current` dot, mode icon, temperatures) are
**absolutely-positioned HTML divs that orbit** the center via CSS `rotate()`,
**not** SVG elements. Why: animating SVG `cx`/`cy` is unreliable in
Safari/WKWebView, and `rotate` of an HTML overlay rides the arc smoothly.

- `_dotOrbit(angle, cls)` — a `.orbit` div (inset:0, transform-origin 50% 50%)
  `rotate(angle)`, with a child dot pinned on the ring centerline
  (`top: 9.375%` = (160−130)/320 at rest, `10.469%` ≈ (160−126.5)/320
  while dragging). Invisible `.handle` targets follow the same centerline.
- `_labelOrbit(angle, content, iconLabel)` — same, but the label counter-rotates
  (`rotate(-angle)`) to stay upright. `data-angle` records the rendered label
  angle (including dual spreading), not necessarily its marker's angle.
  `_measureLabels()` runs after every render and on host ResizeObserver callbacks.
  It unions the label box with `sup` and `.mode-icon.inline` rectangles, relative
  to the in-flow label box's centre, converting CSS pixels with `320 / svg.width`.
  For direction `u = (sin θ, −cos θ)`, support `s = max(corner · u)` accounts
   for asymmetric superscript and merged-icon overhang. This is the support
   of the **enclosing union rectangle**, not just the separate child
   rectangles: a union corner can combine one child's right edge with another's
   top edge. Geometry tests must project those union corners too.
   Inline `--s` stores this
  support in viewBox units; writes occur only for changes >0.05u (or the initial
  measurement), without requesting a Lit update. Hidden zero-width dials wait
  for resize; the observer disconnects/reobserves with the host lifecycle.
  CSS sets `top:calc((160 - (var(--edge) - 5.5 - var(--s, 6))) / 320 * 100%)`.
   Plain-number `--edge` is 125 at rest and 116 dragging: radius is
  `edge − 5.5 − support`, default support 6 before measurement. All label types
  share this rule; `.icon-label` remains a semantic class, not a positioning rule.
    Labels move 9u inward during drag to clear the longer line tips;
    `top` retains the band's motion tokens.
   Geometry assertions disable motion **before** changing dial properties;
   otherwise they can observe the initial fallback radius during its transition.
- Every orbit number uses `_fmtLabel`: integer part with the first decimal digit
  in `<sup>` only when fractional, and no degree sign (`22`, `20<sup>8</sup>`,
  `-1<sup>5</sup>`). A relative inline-block `.label-number` wrapper keeps only
  the integer in flow, so the superscript cannot grow the label's layout box or
   shift its centring. Superscripts use `position:absolute; left:100%; top:0.085em;
   font-size:0.56em; line-height:1; margin-left:0.05em`.
  Current, setpoint, dual low/high and merged labels share this format.
   Orbit numbers use `clamp(8px, 4.77cqi, 15.3px)` (15.264px at a 320px dial),
  independent of HA's title-medium token. Current numbers use `var(--mt-on-surface)`,
  matching unselected setpoint numbers.
  `_fmtCompact` is unchanged; single-mode centre formatting is described below.
- **`<svg>` must be `display:block`** so its coordinate box aligns with the
  absolutely-positioned overlays (an inline SVG's baseline gap offsets them).
- When the setpoint icon and current-temp label are within `OVERLAP_DEG` (18°)
  they merge into one marker (icon sits `position:absolute; right:100%` of the
  temp) — **single mode only**. The icon stays left of the integer-only box,
  independent of the out-of-flow superscript.
- **Dual label de-overlap (`label-spread.ts`)** — low/high/current can cluster
  (worst in heat_cool). `spreadAngles(angles, LABEL_SEP_DEG=24, ARC_START,
  ARC_START+SWEEP)` nudges each LABEL along the arc (keeping it on the ring; the
  DOTS stay at their true angle) so neighbours are ≥ 24° apart, moving each as
  little as possible (L2-optimal isotonic regression / PAVA). No more pulling a
  label toward the centre. Because the labels are rendered in a stable order
  (low, high, current), the `.orbit` transform transition slides them — so they
  **cross/swap smoothly** when a setpoint passes another point.

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
frac(current))` to `max(...)`. It keeps the same geometry when activity changes;
its stroke uses the full mode color whenever `_demandColored` is true, otherwise
the dial color (neutral when inactive).
For single heat/cool, `_singleSegVisible` hides the path with **opacity 0** when
`_demandSensible` is false: heat current ≥ setpoint, cool current ≤ setpoint, or
missing current. Reported activity does not override this visibility rule.
The node and its correct dash geometry stay in place, so visibility fades rather
than replaying the turn-on slide. Out-of-range/missing current and off mode still
hide the segment as before; auto/dry/fan_only and dual behavior are unchanged.

**Demand-or-reported dial lighting is single-setpoint heat/cool ONLY.** The card passes raw
`hvac_action` as `.hvacAction`; `_singleActive` is false for uncolored modes,
otherwise a nonempty `hvacAction` wins: anything except `'idle'`/`'off'` is active.
Absent/empty action falls back to `_demandSensible`: no current → false;
cool needs current > setpoint, heat needs current < setpoint; other colored modes
are true when current is present. `_dialLit` lights heat/cool when either
`_singleActive` or `_demandSensible` is true: heating/cooling demand lights the dial
even with reported idle/off. Other colored modes follow `_singleActive` only:
reported activity wins, with inference only when the action is absent/empty;
reported idle/off keeps auto/dry/fan_only neutral even with current present.
Otherwise `_dialColor`/`--dial-color` is `IDLE_COLOR` (`var(--mt-on-surface-variant)`),
neutralizing ring and big number; `.dial.idle` dims the halo to opacity 0.5.
`--mode-light = color-mix(in srgb, <mode color> 20%,
var(--mt-on-surface))` tints single colored-mode setpoint markers at rest and drag.
Off/dual setpoint markers stay `var(--mt-on-surface)`; current markers always use
that bright color at opacity 1. Independently, `_demandColored` is true for colored
modes when either `_singleActive` or `_demandSensible` is true. The band and mode icon
(`--mode-tint`) then use the full mode color, even with reported idle/off;
otherwise the icon uses the `--mode-light` mix. Its size is `clamp(11px, 5cqi, 16px)`.
Setpoint markers retain `--mode-light`, independent of demand coloring.
`_singleSegColor` and wipe tracking retain the actually rendered band color.
Dual (heat_cool) does NOT use this single-mode activity rule (see below).

## Dual (heat_cool): temperature-derived sub-mode

In dual mode the dial does NOT just fill between the two setpoints. It derives
the **active sub-mode** (`_dualActive`): `mode === 'cool'`/`'heat'` wins (the card
maps reported cooling/heating to `mode`); otherwise temperature decides:
`current > _displayHigh` → `'cool'`, `current < _displayLow` → `'heat'`, else
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

**Mode/preset readout.** The normal HVAC mode label is **not** shown above the
number (the HVAC chips already show it, à la Google Home) — `_renderStatus()`
emits the `.mode` line **only when `disabled`** (to surface "Unavailable").
`_renderPresetIcon()` shows the `presetIcon` prop (the active preset's glyph, e.g.
the eco leaf) under the number; the card computes it from the configured
`climate-preset-modes` feature (override icon wins, `''` suppresses, else the
`presetIcon()` heuristic) and only for a meaningful preset (not none/off).

**Center readout** (`_renderDualCenter` gated by `_showRange`): shows the
range (low – high) while dragging, for **5s after a setpoint
changes** (`_bumpRangeDisplay` 5s timer, armed in `updated()` — guarded by
`_prevLow/_prevHigh` so the initial set doesn't arm it), or while idle. Otherwise
it **collapses** to the targeted setpoint value (no "Cooling"/"Heating" label —
removed; the chips show the mode), **and the active setpoint's ring marker shows
the sub-mode icon** (`dualSetIconEl`, like single mode — the icon is at the
SETPOINT, not in the centre text). `show_current_as_primary` makes the collapsed
big number the **current temperature** (the setpoint is then shown only by the
icon marker), mirroring single mode. The range font is the larger dynamic size
only while **emphasized** (`_dragging || _showRangeTimer`); once it settles
(idle, >5s) the `.settled` class shrinks it so it isn't oversized at rest.

**Crowding guard (`_centerTight`)** — the orbiting setpoint/current number labels
use measured, angle-dependent radii and can collide with the (horizontally widest) centre readout
when a marker lands near 3 or 9 o'clock. `_centerTight` is true when any numeric
marker is within `SIDE_GUARD_DEG` (26°) of 90°/270° (dual: low/high/current;
single: current only — the single setpoint marker is a small icon). When true the
`.center` gets a `tight` class that shrinks the value/unit and lets `.temp` wrap
(`max-width: 46%`), so the readout stays clear of the labels. Base dual-range font
is also smaller than single (two numbers + dash). ⚠️ Don't widen the centre past
~46% when tight or the °C overlaps the right-hand markers again (the original bug).

## Interaction

- **Drag**: `_onPointerDown` gates on `_isRingHit`: viewBox-scaled distance band
  `[RADIUS−32, RADIUS+22]` **and** angle ≥ `ARC_START` (207°) or ≤ `ARC_END_WRAP`
  (153°), excluding the open bottom gap (153°, 207°). Mouse/pen ring presses
  begin dragging immediately; touch ring presses only arm a tap so swipes scroll.
  Touch scrubbing starts on a `.handle` (`_onHandlePointerDown`, `touch-action:none`).
  `_beginDrag` sets `_dragging=true`; markers follow smoothly and emit
  `value-changing` live. Dual ring scrubs pick the nearer handle.
- **Tap-to-set**: touch ring taps commit via `_commitTap` if movement stays within
  `TAP_SLOP_PX` (10px); mouse/pen use the short-drag path. Emits `value-changed`.
- **Dragging visuals**: `_dragging` adds `.dial.dragging` in single and dual mode.
  `.ring`, `.value` and `.wipe-value` grow **inward only** from 10 to 17 viewBox
  units. The outer edge stays at radius 135: drag centerline = 135 − 17/2 = 126.5,
  inner edge = 118. CSS `transform:scale(126.5/130)` (≈0.973077) with pre-scale
  `stroke-width:17.470356` (= 17 / scale) implements this without changing `d`.
  Base paths set `transform-box:view-box; transform-origin:160px 160px`;
  `.hit` and `.glow` are not scaled. `pathLength=1000` keeps dash geometry stable.
  `.o-dot.setpoint` becomes a
   radial pill (`width:clamp(3px, 1.75cqi, 6px)`, `height:8.125cqi`, 5.6×26 units);
  `.o-dot.current` a thinner pill (`width:clamp(2px, 1.2cqi, 4px)`,
   `height:7.5cqi`, 3.84×24 units). Both use `border-radius:999px`.
   Rounded caps sit fully outside the 17u band, with straight-section margins
   of about 1.7u (setpoint) and 1.6u (current) at a 320px dial.
   Outer tips reach radii 139.5 and 138.5, safely inside the clipped 320u dial box.
  Markers and handles move to `top:10.469%` (radius 126.5).
  Every `.o-label` uses its measured whole-box support to keep a 5.5u radial
   support gap from `--edge` (125 at rest, 116 dragging, just inside the line tips).
   The radius moves 9u inward during drag,
  rather than using fixed radii for numbers versus standalone icons.
  Path transform/stroke width, marker top/width/height/radius and
  label top all transition via `--mt-motion-dur`/`--mt-motion-ease`, including release.
- **+/− step buttons** (`.adjust`, single and dual) sit in the bottom gap:
  `top:87.9%`, a centered 34%-wide two-column grid puts their centers at 41.5%/58.5%
  width. Color `var(--mt-on-surface)`; icon size `clamp(12px, 6.25cqi, 20px)`.
  `pointer-events:none` on the container with the buttons re-enabled.
- **Keyboard** (single mode): arrows step by `step`; emits `value-changed`.
- Sizes scale with the dial via **container queries**: `.dial` has
  `container-type: inline-size` and inner text/dots/buttons use `clamp(min, Ncqi,
  max)`. ⚠️ A `container-type` element reports **zero intrinsic width** — the host
  has `width:100%` so the dial doesn't collapse (see [`gotchas.md`](gotchas.md)).

## Color & the `--dial-color` custom property

`--dial-color` is registered via `CSS.registerProperty` as an **animatable
`<color>`** (syntax `<color>`), so the halo gradient, ring and big number
**cross-fade** between mode/neutral colors instead of jumping. `_dialColor` sets
it inline on `.dial`; CSS transitions it. `_modeColor` uses `modeColors` overrides,
else `climateModeColor`. `--mode-tint` and `--mode-light` are also registered
animatable `<color>` properties and transition on `.dial`; single mode sets both
inline (see above). The single `.value` stroke transitions
separately; `.mode-icon` reads `var(--mode-tint, var(--dial-color))`.
Off/uncolored modes use `IDLE_COLOR` and `.dial.off` dims the halo to opacity 0.5;
they are distinct from `.dial.idle` and hide the single value segment.
`modeIcons`, alongside `modeColors`, overrides single/merged and dual sub-mode marker icons; missing/empty HVAC option icons keep the built-in default.
`COLORED_MODES = ['cool','heat','heat_cool','auto','dry','fan_only']`.

Single centre numbers (excluding `.center.tight`) use `clamp(23px, 21.2cqi, 67.84px)`,
independent of HA's display-large token. All dial text inherits `font-family`.
The rounded card supplies `--mt-centre-weight:450`,
`--mt-centre-axes:"ROND" 100, "opsz" 14`, and `--mt-label-weight:400`.
Every `.value-text` (including dual) consumes the centre weight/axes with fallbacks
`400`/`normal`; orbit numbers consume label weight with fallback `500`.
`font-optical-sizing:auto` remains explicit on centre numbers: the rounded
`opsz` axis overrides it, while theme mode keeps automatic optical sizing.
Other text retains inherited axes. Dual and tight centre sizes are unchanged.

### Measured Google Home typography targets

Measurements compare Google Home against Google Sans Flex with `ROND` 100.
Here 1u = 1cqi (3.2px at a 320px dial).

| Element | Rounded implementation | Measured target |
| --- | --- | --- |
| Single centre “15” | 21.2cqi, capped at 67.84px; weight 450; opsz 14 | Digit height 49.9u; stems ~7.0u; live HA render within ±3% of Google on height, widths, gap and stroke thickness |
| Ring “22” | 4.77cqi (15.264px at 320px); weight 400; automatic opsz | ~4% smaller and ~15% lighter than previous 4.95cqi / 500 |
| Ring superscript | 0.56em; top 0.085em of the superscript itself | Sup/digit ink-height ratio 0.562; aligned ink tops |
| Theme mode | Centre weight 400, axes normal; ring weight 500 | Previous theme weights preserved |

Label radii continue to use measured label boxes; geometry constants are unchanged.

Single-mode `_fmtCenter(value, precision)` retains the existing rounding rules
(setpoint step precision; current-primary precision 1, including missing-current
fallback), then renders the integer plus a superscript first decimal digit only
when nonzero. Examples: `21.1` → `21<sup>1</sup>`, `22` → `22`,
`-1.5` → `-1<sup>5</sup>` (minus retained, including `-0.5`). The integer is the
only in-flow content of relative `.value-text`; the centre-specific sup uses
`position:absolute; left:100%; top:-0.1em; font-size:0.4em; line-height:1;
margin-left:0.05em`, so decimals cannot shift the integer's centring.
Dual range and collapsed dual keep their existing `_fmt` decimal readouts.
Color still follows the dial (neutral when idle). Single centre units are hidden;
dual units remain visible, including collapsed dual readouts. `.dial.dual` keeps
single-only typography rules from affecting those collapsed readouts.
The ring retains its 10-unit rest stroke and opacity 0.18.

Activity-only changes cross-fade without a wipe or off/on segment slide.
Tests of these changes settle the initial off→colored slide first, then allow
only opacity/stroke CSS transitions on the segment (no dash transitions or WAAPI wipe).
`updated()` gates `_runWipe()` on a `mode` change between colored modes with a
changed color **and both previous/new single segments visible**;
`hvacAction`/temperature changes alone do not trigger it. `_prevSegVisible` is
updated alongside `_prevSegColor` every `updated()`, including activity-only and
temperature-only changes. Hidden→visible does not paint an old overlay;
visible→hidden does not run a new-band slide. These use CSS opacity/stroke
transitions instead.

The halo (`#mt-glow` radialGradient) has a **fuller 7-stop falloff**:
0% → 0.38, 25% → 0.35, 45% → 0.3, 65% → 0.21, 80% → 0.12,
92% → 0.04, 100% → 0. Color persists farther toward the ring; ending at
opacity 0 avoids a faint hard edge. In halo style, active opacity is 1 and
off/idle dims to 0.5; minimal/google override both to 0.
It's a **plain gradient with no dither filter**: dark 8-bit radial
gradients band into faint "rings" on some platforms (Chromium on Windows/Android
don't dither; macOS does), but both attempted fixes — a masked `mix-blend-mode`
noise overlay, then an in-filter `feTurbulence` perturbation baked into the glow
— either had no effect on Android or introduced *more* visible rings on macOS, so
they were reverted. Treat this as a known platform limitation; don't re-add a
dither without verifying on both macOS and Android.

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
by `_prevSegColor`/`_prevOff` so off↔on keeps animations 1/2, and by
`_prevSegVisible`/`_singleSegVisible` so both segments must be visible). It paints the **new**
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
