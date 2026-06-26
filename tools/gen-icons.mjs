/*
 * Generates the AC swing icon set as two-tone single-icon paths (primary +
 * secondary) for Home Assistant's `window.customIcons` registry. HA renders the
 * secondary path at 50% opacity, giving the dark-selected / gray-unselected look.
 *
 *   - Vertical swing   = corner (L) + a quarter fan of 5 cone wedges (top..bottom).
 *   - Horizontal swing = a vent bar + 5 fanned rays (left..right).
 *   - Selected positions are PRIMARY (dark); unselected are SECONDARY (gray).
 *   - Fixed = 1 selected; partial swing = 3 selected (top3/mid3/bottom3 …);
 *     full swing = all 5. Vertical swings also get an oscillation double-arrow.
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
const V = { O: [4.6, 4.6], r0: 4.3, r1: 12.6, a0: -2, span: 90, gap: 4.6, N: 5 };
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
 * Oscillation double-arrow that only spans the swept cones [kmin..kmax], set at
 * a radius clear of the cone fan (and inset from the ends so the heads don't
 * touch the corner frame).
 */
function vArrow(kmin, kmax) {
  const [cx, cy] = V.O;
  const R = 15.3;
  const hl = 2.6;
  const hw = 2.2;
  // Span the swept range, but clamp the ends so the heads clear the top bar
  // (>= 15°) and the left bar (<= 76°).
  const a0 = Math.max(vConeAngles(kmin)[0] + 3, 15);
  const a1 = Math.min(vConeAngles(kmax)[1] - 3, 76);
  let d = wedge(cx, cy, R - 0.8, R + 0.8, a0, a1);
  const p0 = [cx + R * Math.cos(a0 * D), cy + R * Math.sin(a0 * D)];
  const p1 = [cx + R * Math.cos(a1 * D), cy + R * Math.sin(a1 * D)];
  // start head continues "up" (decreasing-angle tangent); end head continues "down"
  d += head(p0[0] + Math.cos((a0 - 90) * D) * hl, p0[1] + Math.sin((a0 - 90) * D) * hl, a0 - 90, hl, hw);
  d += head(p1[0] + Math.cos((a1 + 90) * D) * hl, p1[1] + Math.sin((a1 + 90) * D) * hl, a1 + 90, hl, hw);
  return d;
}
function vertical(selected, arrow) {
  let primary = vCorner();
  let secondary = '';
  for (let k = 0; k < V.N; k++) {
    const [a, b] = vConeAngles(k);
    const slice = wedge(V.O[0], V.O[1], V.r0, V.r1, a, b);
    if (selected.includes(k)) primary += slice;
    else secondary += slice;
  }
  if (arrow) primary += vArrow(Math.min(...selected), Math.max(...selected));
  return { path: primary, secondary };
}

// ----- horizontal: vent bar + 5 perspective slats (index 0 = left .. 4 = right) -----
// Each slat is a parallelogram with flat horizontal top/bottom edges, slanted to
// fan symmetrically (left tilts left, centre vertical, right tilts right) so the
// row reads as louvres viewed at an angle (3D depth).
const H = {
  topY: 9,
  botY: 19.2,
  topX: [6.4, 9.2, 12, 14.8, 17.6],
  botX: [4.4, 8.2, 12, 15.8, 19.6],
};
/** Parallelogram slat: top edge at topY (centre txc), bottom edge at botY (centre bxc). */
function slat(txc, bxc, hw) {
  return (
    `M${f(txc - hw)} ${f(H.topY)}L${f(txc + hw)} ${f(H.topY)}` +
    `L${f(bxc + hw)} ${f(H.botY)}L${f(bxc - hw)} ${f(H.botY)}Z`
  );
}
function horizontal(selected) {
  let primary = capsule(3, 6.6, 21, 6.6, 2);
  let secondary = '';
  for (let k = 0; k < 5; k++) {
    if (selected.includes(k)) primary += slat(H.topX[k], H.botX[k], 0.9);
    else secondary += slat(H.topX[k], H.botX[k], 0.72);
  }
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
  'swing-horizontal-fixed-left': horizontal([0]),
  'swing-horizontal-fixed-left-middle': horizontal([1]),
  'swing-horizontal-fixed-middle': horizontal([2]),
  'swing-horizontal-fixed-right-middle': horizontal([3]),
  'swing-horizontal-fixed-right': horizontal([4]),
  'swing-horizontal-left': horizontal(TOP3),
  'swing-horizontal-middle': horizontal(MID3),
  'swing-horizontal-right': horizontal(BOT3),
  'swing-horizontal-full': horizontal(ALL),
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
writeFileSync(
  '/tmp/sheet.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${Hh}" viewBox="0 0 ${W} ${Hh}"><rect width="${W}" height="${Hh}" fill="#0e0d12"/>${body}</svg>`
);
console.log(`Generated ${cells.length} icons + /tmp/sheet.svg`);
