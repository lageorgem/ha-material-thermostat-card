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
- A `circle.disc` at `(160,160)`, radius **148.5**, filled with
  `var(--mt-surface-container-high)` paints first, below the halo and paths, in
  every mode (single and dual). It has `pointer-events:none`.

## Markers are HTML overlays, not SVG

Dots and labels (`setpoint` dot, `current` dot, mode icon, temperatures) are
**absolutely-positioned HTML divs that orbit** the center via CSS `rotate()`,
**not** SVG elements. Why: animating SVG `cx`/`cy` is unreliable in
Safari/WKWebView, and `rotate` of an HTML overlay rides the arc smoothly.

- `_dotOrbit(angle, cls)` — a `.orbit` div (inset:0, transform-origin 50% 50%)
  `rotate(angle)`, with a child dot pinned on the ring centerline
  (`top: 9.375%` = (160−130)/320 at rest, `10.469%` ≈ (160−126.5)/320
  while dragging). Invisible `.handle` targets follow the same centerline.
- `_labelOrbit(angle, content)` — same, but the label counter-rotates
  (`rotate(-angle)`) to stay upright; `top: 17.5%` (radius 104) at rest AND
  while dragging; the top transition remains harmless.
- Every orbit number uses `_fmtLabel`: integer part with the first decimal digit
  in `<sup>` only when fractional, and no degree sign (`22`, `20<sup>8</sup>`,
  `-1<sup>5</sup>`). Superscripts use `0.6em`, `vertical-align:super`, line-height 0.
  Current, setpoint, dual low/high and merged labels share this format.
  `_fmtCompact` and centre formatting are unchanged.
- **`<svg>` must be `display:block`** so its coordinate box aligns with the
  absolutely-positioned overlays (an inline SVG's baseline gap offsets them).
- When the setpoint icon and current-temp label are within `OVERLAP_DEG` (18°)
  they merge into one marker (icon sits `position:absolute; right:100%` of the
  temp) — **single mode only**.
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
its active stroke is the dial color; inactive stroke reads `--seg-muted`.
For single heat/cool, `_singleSegVisible` hides the path with **opacity 0** when
`_demandSensible` is false: heat current ≥ setpoint, cool current ≤ setpoint, or
missing current. Reported activity does not override this visibility rule.
The node and its correct dash geometry stay in place, so visibility fades rather
than replaying the turn-on slide. Out-of-range/missing current and off mode still
hide the segment as before; auto/dry/fan_only and dual behavior are unchanged.

**Active-only lighting is single-setpoint ONLY.** The card passes raw
`hvac_action` as `.hvacAction`; `_singleActive` is false for uncolored modes,
otherwise a nonempty `hvacAction` wins: anything except `'idle'`/`'off'` is active.
Absent/empty action falls back to `_demandSensible`: no current → false;
cool needs current > setpoint, heat needs current < setpoint; other colored modes
are true when current is present. Active → full mode color. Inactive colored mode
→ `_dialColor`/`--dial-color` is `IDLE_COLOR` (`var(--mt-on-surface-variant)`),
neutralizing ring and big number; `.dial.idle` hides the halo (opacity 0).
The disc stays flat. `--mode-light = color-mix(in srgb, <mode color> 20%,
var(--mt-on-surface))` tints single colored-mode setpoint markers at rest and drag.
Off/dual setpoint markers stay `var(--mt-on-surface)`; current markers always use
that bright color at opacity 1. The mode icon reads `--mode-tint`: inactive =
`--mode-light` mix, active = dial color. Its size is `clamp(11px, 5cqi, 16px)`.
Only the inactive segment reads `--seg-muted = color-mix(in srgb, <mode color>
50%, var(--mt-on-surface-variant))`; a sensible demand with reported idle/off still
shows this band. `_singleSegColor` and wipe tracking retain this rendered band color,
not the icon tint.
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
sit at radius 104 and can collide with the (horizontally widest) centre readout
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
  `.hit`, `.disc` and `.glow` are not scaled. `pathLength=1000` keeps dash geometry stable.
  `.o-dot.setpoint` becomes a
  radial pill (`width:clamp(3px, 1.875cqi, 6px)`, `height:6.875cqi`, 6×22 units);
  `.o-dot.current` a thinner pill (`width:clamp(2px, 1.25cqi, 4px)`,
  `height:5.9375cqi`, 4×19 units). Both use `border-radius:999px`.
  Markers and handles move to `top:10.469%` (radius 126.5).
  `.o-label` stays at radius 104. Path transform/stroke width, marker top/width/height/radius and
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
inline alongside `--seg-muted` (see above). The single `.value` stroke transitions
separately; `.mode-icon` reads `var(--mode-tint, var(--dial-color))`.
Off/uncolored modes use `IDLE_COLOR` and `.dial.off` hides the halo (opacity 0);
they are distinct from `.dial.idle` and hide the single value segment.
`modeIcons`, alongside `modeColors`, overrides single/merged and dual sub-mode marker icons; missing/empty HVAC option icons keep the built-in default.
`COLORED_MODES = ['cool','heat','heat_cool','auto','dry','fan_only']`.

Single centre numbers (excluding `.center.tight`) use `clamp(24px, 22cqi, 70px)`
and `font-variation-settings:'ROND' 100`, independent of HA's display-large token.
Color still follows the dial (neutral when idle). Single centre units are hidden;
dual units remain visible, including collapsed dual readouts. `.dial.dual` keeps
single-only typography rules from affecting those collapsed readouts.
The ring retains its 10-unit rest stroke and opacity 0.18 over the new disc.

Activity-only changes cross-fade without a wipe or off/on segment slide.
`updated()` gates `_runWipe()` on a `mode` change between colored modes with a
changed color **and both previous/new single segments visible**;
`hvacAction`/temperature changes alone do not trigger it. `_prevSegVisible` is
updated alongside `_prevSegColor` every `updated()`, including activity-only and
temperature-only changes. Hidden→visible does not paint an old overlay;
visible→hidden does not run a new-band slide. These use CSS opacity/stroke
transitions instead.

The halo (`#mt-glow` radialGradient) is a **6-stop falloff from 0.38 at center to
opacity 0 at the perimeter** — ending at 0 (not 0.02) avoids a faint hard-edged
disc. It's a **plain gradient with no dither filter**: dark 8-bit radial
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
