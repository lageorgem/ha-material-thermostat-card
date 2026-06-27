/*
 * Generates the AC swing icon set as two-tone single-icon paths (primary +
 * secondary) for Home Assistant's `window.customIcons` registry. HA renders the
 * secondary path at 50% opacity, giving the dark-selected / gray-unselected look.
 *
 *   - Vertical swing   = corner (L) + a quarter fan of 5 cone wedges (top..bottom).
 *   - Horizontal swing = a vent bar + 5 fanned rays (left..right).
 *   - Selected positions are PRIMARY (dark); unselected are SECONDARY (gray).
 *   - Fixed = 1 selected; partial swing = 3 selected (top3/mid3/bottom3 …);
 *     full swing = all 5. Swings (both axes) also get an oscillation double-arrow;
 *     fixed cones extend further out (to the line ends) since they have no arrow.
 *
 * Run: node tools/gen-icons.mjs  -> src/icons.generated.ts + icons/ previews.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const f = (n) => {
  const r = Math.round(n * 1000) / 1000;
  return Object.is(r, -0) ? 0 : r;
};
const D = Math.PI / 180;
const dir = (deg) => [Math.cos(deg * D), Math.sin(deg * D)];

/** Round-capped line (capsule). */
function capsule(x1, y1, x2, y2, w) {
  const r = w / 2;
  let ux = x2 - x1;
  let uy = y2 - y1;
  const len = Math.hypot(ux, uy) || 1;
  ux /= len;
  uy /= len;
  const nx = -uy;
  const ny = ux;
  // sweep flag 0 → caps bulge OUTWARD (a clean pill); flag 1 dents them inward.
  return (
    `M${f(x1 + nx * r)} ${f(y1 + ny * r)}L${f(x2 + nx * r)} ${f(y2 + ny * r)}` +
    `A${f(r)} ${f(r)} 0 0 0 ${f(x2 - nx * r)} ${f(y2 - ny * r)}` +
    `L${f(x1 - nx * r)} ${f(y1 - ny * r)}A${f(r)} ${f(r)} 0 0 0 ${f(x1 + nx * r)} ${f(y1 + ny * r)}Z`
  );
}

/** A bar with independently round or flat (butt) ends — for sharp L-corners. */
function bar(x1, y1, x2, y2, w, roundStart, roundEnd) {
  const r = w / 2;
  let ux = x2 - x1;
  let uy = y2 - y1;
  const len = Math.hypot(ux, uy) || 1;
  ux /= len;
  uy /= len;
  const nx = -uy;
  const ny = ux;
  const A = [x1 + nx * r, y1 + ny * r];
  const B = [x2 + nx * r, y2 + ny * r];
  const C = [x2 - nx * r, y2 - ny * r];
  const E = [x1 - nx * r, y1 - ny * r];
  let d = `M${f(A[0])} ${f(A[1])}L${f(B[0])} ${f(B[1])}`;
  d += roundEnd ? `A${f(r)} ${f(r)} 0 0 0 ${f(C[0])} ${f(C[1])}` : `L${f(C[0])} ${f(C[1])}`;
  d += `L${f(E[0])} ${f(E[1])}`;
  d += roundStart ? `A${f(r)} ${f(r)} 0 0 0 ${f(A[0])} ${f(A[1])}` : `L${f(A[0])} ${f(A[1])}`;
  return d + 'Z';
}

/** Annular sector (cone wedge): radii r0<r1, angles a0<a1 (deg, screen). */
function wedge(cx, cy, r0, r1, a0, a1) {
  const [c0, s0] = dir(a0);
  const [c1, s1] = dir(a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return (
    `M${f(cx + r1 * c0)} ${f(cy + r1 * s0)}` +
    `A${f(r1)} ${f(r1)} 0 ${large} 1 ${f(cx + r1 * c1)} ${f(cy + r1 * s1)}` +
    `L${f(cx + r0 * c1)} ${f(cy + r0 * s1)}` +
    `A${f(r0)} ${f(r0)} 0 ${large} 0 ${f(cx + r0 * c0)} ${f(cy + r0 * s0)}Z`
  );
}

/** Triangular arrowhead: tip at (tx,ty), pointing dirDeg, length L, half-width hw. */
function head(tx, ty, dirDeg, L, hw) {
  const [ux, uy] = dir(dirDeg);
  const nx = -uy;
  const ny = ux;
  const bx = tx - ux * L;
  const by = ty - uy * L;
  return `M${f(tx)} ${f(ty)}L${f(bx + nx * hw)} ${f(by + ny * hw)}L${f(bx - nx * hw)} ${f(by - ny * hw)}Z`;
}

// ----- vertical: corner + 5 cone wedges (index 0 = top .. 4 = bottom) -----
// a0/span inset the fan off the top and left bars so it isn't crowding them.
// r1 is the swing outer radius (leaves room for the arrow); r1Fixed is longer so
// the fixed cones reach out to the ends of the corner lines (no arrow there).
const V = { O: [4.6, 4.6], r0: 4.8, r1: 12.6, r1Fixed: 16, arrowR: 15.3, a0: 8, span: 72, gap: 4.5, N: 5 };
V.wedgeW = (V.span - V.gap * (V.N - 1)) / V.N;
function vConeAngles(k) {
  const s = V.a0 + k * (V.wedgeW + V.gap);
  return [s, s + V.wedgeW];
}
function vCorner() {
  // Flat ends meet at the corner (sharp right angle); round caps on the free
  // ends. The flat top (y 2.4) aligns with the horizontal bar's top edge, and
  // the flat left (x 2.8) aligns with the vertical bar's left edge.
  return bar(3.7, 2.4, 3.7, 20.9, 1.8, false, true) + bar(2.8, 3.3, 20.2, 3.3, 1.8, false, true);
}
/**
 * Oscillation double-arrow as an arc band at radius R between the cone-fan edges
 * [loEdge, hiEdge] (deg, loEdge < hiEdge). The band is pulled in by one
 * head-length at each end so the arrowhead TIPS land exactly on those edges —
 * the arrow never extends past the cone boundaries.
 */
function arrowBand(cx, cy, R, loEdge, hiEdge) {
  const hl = 2.6;
  const hw = 2.2;
  const degHl = (hl / R) * (180 / Math.PI); // a head-length as an arc angle at R
  const a0 = loEdge + degHl;
  const a1 = hiEdge - degHl;
  let d = wedge(cx, cy, R - 0.8, R + 0.8, a0, a1);
  const p0 = [cx + R * Math.cos(a0 * D), cy + R * Math.sin(a0 * D)];
  const p1 = [cx + R * Math.cos(a1 * D), cy + R * Math.sin(a1 * D)];
  // low-edge head continues toward decreasing angle; high-edge head toward increasing.
  d += head(p0[0] + Math.cos((a0 - 90) * D) * hl, p0[1] + Math.sin((a0 - 90) * D) * hl, a0 - 90, hl, hw);
  d += head(p1[0] + Math.cos((a1 + 90) * D) * hl, p1[1] + Math.sin((a1 + 90) * D) * hl, a1 + 90, hl, hw);
  return d;
}
/** Vertical oscillation arrow spanning the swept cones [kmin..kmax]. */
function vArrow(kmin, kmax) {
  return arrowBand(V.O[0], V.O[1], V.arrowR, vConeAngles(kmin)[0], vConeAngles(kmax)[1]);
}
function vertical(selected, arrow) {
  let primary = vCorner();
  let secondary = '';
  // Fixed cones (no arrow) extend out to the line ends; swing cones stop short
  // so the oscillation arrow has clear space beyond them.
  const r1 = arrow ? V.r1 : V.r1Fixed;
  for (let k = 0; k < V.N; k++) {
    const [a, b] = vConeAngles(k);
    const slice = wedge(V.O[0], V.O[1], V.r0, r1, a, b);
    if (selected.includes(k)) primary += slice;
    else secondary += slice;
  }
  if (arrow) primary += vArrow(Math.min(...selected), Math.max(...selected));
  return { path: primary, secondary };
}

// ----- horizontal: vent bar + 5 cone wedges fanning DOWN (index 0 = left .. 4 = right) -----
// Mirrors the vertical fan, rotated to point straight down and centred on x=12:
// same span/radii/arrow so the fixed/swing sizing (and 1:1 aspect) match vertical.
// The fan is centred on 90° (straight down); aLeft (= 90 + span/2) is the leftmost
// (largest-angle) edge, and cone angles decrease with k toward the right.
const H = { O: [12, 5], r0: 4, r1: 12.6, r1Fixed: 16, arrowR: 15.3, span: 72, gap: 4.5, N: 5 };
H.wedgeW = (H.span - H.gap * (H.N - 1)) / H.N;
H.aLeft = 90 + H.span / 2; // 126° — leftmost cone edge (down-left)
function hConeAngles(k) {
  const aHigh = H.aLeft - k * (H.wedgeW + H.gap); // k=0 leftmost (down-left)
  return [aHigh - H.wedgeW, aHigh];
}
/** Horizontal oscillation arrow spanning the swept cones [kmin..kmax]. */
function hArrow(kmin, kmax) {
  // Angles decrease with k: kmax is the right (smaller-angle) edge, kmin the left.
  return arrowBand(H.O[0], H.O[1], H.arrowR, hConeAngles(kmax)[0], hConeAngles(kmin)[1]);
}
function horizontal(selected, arrow) {
  let primary = capsule(3.6, H.O[1], 20.4, H.O[1], 2); // vent bar across the apex
  let secondary = '';
  // Fixed cones (no arrow) extend down to the swing arrow's reach; swing cones
  // stop short so the oscillation arrow has clear space beyond them.
  const r1 = arrow ? H.r1 : H.r1Fixed;
  for (let k = 0; k < H.N; k++) {
    const [a, b] = hConeAngles(k);
    const slice = wedge(H.O[0], H.O[1], H.r0, r1, a, b);
    if (selected.includes(k)) primary += slice;
    else secondary += slice;
  }
  if (arrow) primary += hArrow(Math.min(...selected), Math.max(...selected));
  return { path: primary, secondary };
}

const TOP3 = [0, 1, 2];
const MID3 = [1, 2, 3];
const BOT3 = [2, 3, 4];
const ALL = [0, 1, 2, 3, 4];

const icons = {
  'swing-vertical-fixed-top': vertical([0], false),
  'swing-vertical-fixed-upper-middle': vertical([1], false),
  'swing-vertical-fixed-middle': vertical([2], false),
  'swing-vertical-fixed-lower-middle': vertical([3], false),
  'swing-vertical-fixed-bottom': vertical([4], false),
  'swing-vertical-top': vertical(TOP3, true),
  'swing-vertical-middle': vertical(MID3, true),
  'swing-vertical-bottom': vertical(BOT3, true),
  'swing-vertical-full': vertical(ALL, true),
  'swing-horizontal-fixed-left': horizontal([0], false),
  'swing-horizontal-fixed-left-middle': horizontal([1], false),
  'swing-horizontal-fixed-middle': horizontal([2], false),
  'swing-horizontal-fixed-right-middle': horizontal([3], false),
  'swing-horizontal-fixed-right': horizontal([4], false),
  'swing-horizontal-left': horizontal(TOP3, true),
  'swing-horizontal-middle': horizontal(MID3, true),
  'swing-horizontal-right': horizontal(BOT3, true),
  'swing-horizontal-full': horizontal(ALL, true),
};

// ----- emit TS -----
const entries = Object.entries(icons).map(([k, v]) => {
  const sec = v.secondary ? `, secondary: '${v.secondary}'` : '';
  return `  '${k}': { path: '${v.path}'${sec} },`;
});
writeFileSync(
  join(ROOT, 'src/icons.generated.ts'),
  `/* AUTO-GENERATED by tools/gen-icons.mjs — do not edit by hand. */\n\n` +
    `/** AC swing icons (primary = selected, secondary = gray/unselected). */\n` +
    `export const MT_ICONS: Record<string, { path: string; secondary?: string }> = {\n` +
    entries.join('\n') +
    `\n};\n`
);

// ----- previews -----
const previewDir = join(ROOT, 'icons');
mkdirSync(previewDir, { recursive: true });
const cells = [];
for (const [k, v] of Object.entries(icons)) {
  const sec = v.secondary ? `<path d="${v.secondary}" fill="#1c1b22" opacity="0.5"/>` : '';
  const inner = `<path d="${v.path}" fill="#1c1b22"/>${sec}`;
  writeFileSync(
    join(previewDir, `${k}.svg`),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="96" height="96">` +
      `<rect width="24" height="24" fill="#ece4d8"/>${inner}</svg>`
  );
  cells.push({ k, inner });
}
const cols = 5;
const cell = 120;
const labelH = 22;
const rows = Math.ceil(cells.length / cols);
let body = '';
cells.forEach((c, i) => {
  const x = (i % cols) * cell;
  const y = Math.floor(i / cols) * (cell + labelH);
  const s = (cell - 20) / 24;
  body +=
    `<g transform="translate(${x},${y})"><rect width="${cell}" height="${cell}" fill="#ece4d8"/>` +
    `<g transform="translate(10,10) scale(${s})">${c.inner}</g>` +
    `<text x="${cell / 2}" y="${cell + 14}" fill="#bbb" font-family="monospace" font-size="8" text-anchor="middle">${c.k.replace('swing-', '')}</text></g>`;
});
const W = cols * cell;
const Hh = rows * (cell + labelH);
const sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${Hh}" viewBox="0 0 ${W} ${Hh}"><rect width="${W}" height="${Hh}" fill="#0e0d12"/>${body}</svg>`;
writeFileSync('/tmp/sheet.svg', sheet);
writeFileSync(join(previewDir, 'preview.svg'), sheet);

// Self-contained HTML gallery (inline SVGs) for quick verification in a browser.
const tiles = cells
  .map(
    (c) =>
      `<figure><svg viewBox="0 0 24 24" width="120" height="120">${c.inner}</svg>` +
      `<figcaption>${c.k}</figcaption></figure>`
  )
  .join('');
writeFileSync(
  join(previewDir, 'preview.html'),
  `<!doctype html><meta charset="utf-8"><title>mt swing icons</title>` +
    `<style>body{background:#ece4d8;margin:0;padding:24px;font-family:system-ui}` +
    `main{display:flex;flex-wrap:wrap;gap:16px}figure{margin:0;background:#fff;border-radius:12px;` +
    `padding:8px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.15)}` +
    `figcaption{font:11px/1.4 monospace;color:#555;margin-top:4px;max-width:120px}</style>` +
    `<h2>Material Thermostat — AC swing icons</h2><main>${tiles}</main>`
);
console.log(`Generated ${cells.length} icons + icons/preview.html + icons/preview.svg`);
