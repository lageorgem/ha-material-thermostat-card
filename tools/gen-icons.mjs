/*
 * Generates the AC swing icon set (filled + outlined) as single filled SVG
 * paths on a 24x24 grid, for Home Assistant's `window.customIcons` registry.
 *
 * Metaphor: an AC outlet (rounded bar) emitting airflow.
 *   - Vertical swing   = side view: outlet on the LEFT, air fans up/down.
 *   - Horizontal swing = top view:  outlet at the TOP, air fans left/right.
 *   - Fixed position    = a single arrow at one vane angle.
 *   - Swing             = two arrows bracketing the swept angular range.
 *   - Filled variant    = thick shafts + solid triangular heads.
 *   - Outlined variant  = thin shafts + open chevron heads.
 *
 * Run: node tools/gen-icons.mjs
 * Writes: src/icons.generated.ts and preview SVGs in icons/.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const f = (n) => {
  const r = Math.round(n * 100) / 100;
  return Object.is(r, -0) ? 0 : r;
};

/** Filled quad for a segment P1->P2 of width w (butt caps). */
function seg(x1, y1, x2, y2, w) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * (w / 2);
  const ny = (dx / len) * (w / 2);
  return (
    `M${f(x1 + nx)} ${f(y1 + ny)}` +
    `L${f(x2 + nx)} ${f(y2 + ny)}` +
    `L${f(x2 - nx)} ${f(y2 - ny)}` +
    `L${f(x1 - nx)} ${f(y1 - ny)}Z`
  );
}

/** An arrow from S to E. Filled => solid triangle head; else open chevron. */
function arrow(sx, sy, ex, ey, { w, headLen, headHalf, filled }) {
  const dx = ex - sx;
  const dy = ey - sy;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy;
  const ny = ux;
  const bx = ex - ux * headLen;
  const by = ey - uy * headLen;
  if (filled) {
    const c1x = bx + nx * headHalf;
    const c1y = by + ny * headHalf;
    const c2x = bx - nx * headHalf;
    const c2y = by - ny * headHalf;
    return seg(sx, sy, bx, by, w) + `M${f(ex)} ${f(ey)}L${f(c1x)} ${f(c1y)}L${f(c2x)} ${f(c2y)}Z`;
  }
  return (
    seg(sx, sy, ex, ey, w) +
    seg(bx + nx * headHalf, by + ny * headHalf, ex, ey, w) +
    seg(bx - nx * headHalf, by - ny * headHalf, ex, ey, w)
  );
}

/** Solid rounded rectangle. */
function roundRect(x, y, w, h, r) {
  return (
    `M${f(x + r)} ${f(y)}H${f(x + w - r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w)} ${f(y + r)}` +
    `V${f(y + h - r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w - r)} ${f(y + h)}` +
    `H${f(x + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x)} ${f(y + h - r)}` +
    `V${f(y + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + r)} ${f(y)}Z`
  );
}

/** Hollow rounded-rectangle frame (4 overlapping side bars). */
function frame(x, y, w, h, s) {
  return (
    seg(x, y + s / 2, x + w, y + s / 2, s) +
    seg(x + w - s / 2, y, x + w - s / 2, y + h, s) +
    seg(x, y + h - s / 2, x + w, y + h - s / 2, s) +
    seg(x + s / 2, y, x + s / 2, y + h, s)
  );
}

const STYLE = {
  // The small outlet stays solid in both; outline vs fill is conveyed by the
  // airflow arrows (thin + open chevron heads vs thick + solid triangle heads).
  filled: { w: 2.4, headLen: 4.2, headHalf: 3.3, filled: true, solidBar: true },
  outline: { w: 1.7, headLen: 4, headHalf: 2.9, filled: false, solidBar: true },
};

// Vane angles, degrees. Vertical: + = up. Horizontal: + = right.
const FIXED = {
  // vertical fixed
  'vertical-fixed-top': { axis: 'v', angles: [40] },
  'vertical-fixed-upper-middle': { axis: 'v', angles: [20] },
  'vertical-fixed-middle': { axis: 'v', angles: [0] },
  'vertical-fixed-lower-middle': { axis: 'v', angles: [-20] },
  'vertical-fixed-bottom': { axis: 'v', angles: [-40] },
  // vertical swing (two bracketing arrows)
  'vertical-top': { axis: 'v', angles: [40, 12] },
  'vertical-middle': { axis: 'v', angles: [20, -20] },
  'vertical-bottom': { axis: 'v', angles: [-12, -40] },
  'vertical-full': { axis: 'v', angles: [40, -40] },
  // horizontal fixed
  'horizontal-fixed-left': { axis: 'h', angles: [-40] },
  'horizontal-fixed-left-middle': { axis: 'h', angles: [-20] },
  'horizontal-fixed-middle': { axis: 'h', angles: [0] },
  'horizontal-fixed-right-middle': { axis: 'h', angles: [20] },
  'horizontal-fixed-right': { axis: 'h', angles: [40] },
  // horizontal swing
  'horizontal-left': { axis: 'h', angles: [-40, -12] },
  'horizontal-middle': { axis: 'h', angles: [-20, 20] },
  'horizontal-right': { axis: 'h', angles: [12, 40] },
  'horizontal-full': { axis: 'h', angles: [-40, 40] },
};

const D2R = Math.PI / 180;

/** Build one icon path for the given spec + style. */
function build(spec, st) {
  const single = spec.angles.length === 1;
  const L = single ? 12.6 : 11.6;
  let d = '';
  if (spec.axis === 'v') {
    // outlet bar on the left (side view)
    d += st.solidBar ? roundRect(3, 4.5, 3.3, 15, 1.2) : frame(3, 4.5, 3.3, 15, st.barStroke);
    const sx = 6.7;
    const sy = 12;
    for (const a of spec.angles) {
      const r = a * D2R;
      d += arrow(sx, sy, sx + Math.cos(r) * L, sy - Math.sin(r) * L, st);
    }
  } else {
    // outlet bar on top (top view)
    d += st.solidBar ? roundRect(4.5, 3, 15, 3.3, 1.2) : frame(4.5, 3, 15, 3.3, st.barStroke);
    const sx = 12;
    const sy = 6.7;
    for (const a of spec.angles) {
      const r = a * D2R;
      d += arrow(sx, sy, sx + Math.sin(r) * L, sy + Math.cos(r) * L, st);
    }
  }
  return d;
}

const icons = {};
for (const [name, spec] of Object.entries(FIXED)) {
  icons[`swing-${name}`] = build(spec, STYLE.filled);
  icons[`swing-${name}-outline`] = build(spec, STYLE.outline);
}

// --- write the TS module ---
const lines = Object.entries(icons).map(([k, v]) => `  '${k}': '${v}',`);
const ts =
  `/* AUTO-GENERATED by tools/gen-icons.mjs — do not edit by hand. */\n\n` +
  `/** AC swing icons, keyed by name. Registered as the \`mt:\` icon set. */\n` +
  `export const MT_ICONS: Record<string, string> = {\n${lines.join('\n')}\n};\n`;
writeFileSync(join(ROOT, 'src/icons.generated.ts'), ts);

// --- write preview SVGs ---
const previewDir = join(ROOT, 'icons');
mkdirSync(previewDir, { recursive: true });
const index = [];
for (const [k, v] of Object.entries(icons)) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="96" height="96">` +
    `<rect width="24" height="24" fill="#1c1b22"/>` +
    `<path d="${v}" fill="#e3e3e3"/></svg>`;
  writeFileSync(join(previewDir, `${k}.svg`), svg);
  index.push(
    `<figure style="margin:0;text-align:center"><img src="${k}.svg" width="72" height="72"><figcaption style="font:11px monospace;color:#ccc">${k}</figcaption></figure>`
  );
}
writeFileSync(
  join(previewDir, 'index.html'),
  `<!doctype html><meta charset=utf-8><title>mt icons</title>` +
    `<body style="background:#0e0d12;display:flex;flex-wrap:wrap;gap:16px;padding:16px">` +
    index.join('') +
    `</body>`
);

console.log(`Generated ${Object.keys(icons).length} icons -> src/icons.generated.ts + icons/*.svg`);
