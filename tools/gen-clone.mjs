/* Prototype: clone the reference AC swing icons. Renders SVGs for visual diff. */
import { writeFileSync, mkdirSync } from 'node:fs';

const f = (n) => {
  const r = Math.round(n * 1000) / 1000;
  return Object.is(r, -0) ? 0 : r;
};
const D = Math.PI / 180;
const dir = (deg) => [Math.cos(deg * D), Math.sin(deg * D)];

/** Round-capped line (capsule) from P1 to P2, width w. */
function capsule(x1, y1, x2, y2, w) {
  const r = w / 2;
  let ux = x2 - x1,
    uy = y2 - y1;
  const len = Math.hypot(ux, uy) || 1;
  ux /= len;
  uy /= len;
  const nx = -uy,
    ny = ux;
  const A = [x1 + nx * r, y1 + ny * r];
  const B = [x2 + nx * r, y2 + ny * r];
  const C = [x2 - nx * r, y2 - ny * r];
  const E = [x1 - nx * r, y1 - ny * r];
  return (
    `M${f(A[0])} ${f(A[1])}L${f(B[0])} ${f(B[1])}` +
    `A${f(r)} ${f(r)} 0 0 1 ${f(C[0])} ${f(C[1])}` +
    `L${f(E[0])} ${f(E[1])}A${f(r)} ${f(r)} 0 0 1 ${f(A[0])} ${f(A[1])}Z`
  );
}

/** Annular sector centered (cx,cy), radii r0<r1, angles a0<a1 (deg, screen). */
function annular(cx, cy, r0, r1, a0, a1) {
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

/** Triangular arrowhead, tip at (tx,ty) pointing dirDeg, length L, half-width hw. */
function head(tx, ty, dirDeg, L, hw) {
  const [ux, uy] = dir(dirDeg);
  const nx = -uy,
    ny = ux;
  const bx = tx - ux * L,
    by = ty - uy * L;
  return `M${f(tx)} ${f(ty)}L${f(bx + nx * hw)} ${f(by + ny * hw)}L${f(bx - nx * hw)} ${f(by - ny * hw)}Z`;
}

// ---------- LEFT icon: vertical full swing (corner + blade fan + oscillation) ----------
function leftIcon() {
  const O = [4.4, 4.4]; // fan apex at the corner
  let d = '';
  // corner frame (L)
  d += capsule(3.6, 3.2, 3.6, 20.8, 1.8);
  d += capsule(3.2, 3.2, 19.6, 3.2, 1.8);
  // blade fan: 5 wedges from the corner into the lower-right quadrant
  const a0 = -4,
    a1 = 86,
    N = 5,
    gap = 4;
  const wedge = (a1 - a0 - gap * (N - 1)) / N;
  for (let k = 0; k < N; k++) {
    const s = a0 + k * (wedge + gap);
    d += annular(O[0], O[1], 4, 15.2, s, s + wedge);
  }
  // oscillation double arrow, arc centered at the fan apex, wrapping the open side
  const R = 13.5;
  d += annular(O[0], O[1], R - 0.9, R + 0.9, 8, 74);
  // arrowheads at the two ends, tangent
  d += head(O[0] + (R + 2.6) * Math.cos(8 * D), O[1] + (R + 2.6) * Math.sin(8 * D), 8 - 90, 3.2, 2.4);
  d += head(
    O[0] + (R + 2.6) * Math.cos(74 * D),
    O[1] + (R + 2.6) * Math.sin(74 * D),
    74 + 90,
    3.2,
    2.4
  );
  return { path: d };
}

// ---------- RIGHT icon: vent bar + fanned rays (one bold, rest secondary) ----------
function rightIcon() {
  const bar = capsule(3, 7, 21, 7, 2);
  const rays = [
    { x0: 7.5, x1: 7.5 }, // leftmost, near vertical (primary/bold)
    { x0: 9.5, x1: 11 },
    { x0: 11.5, x1: 14.5 },
    { x0: 13.5, x1: 18 },
    { x0: 15.5, x1: 21 },
  ];
  const y0 = 9,
    y1 = 18.8;
  const primary = capsule(rays[0].x0, y0, rays[0].x1, y1, 2.4);
  let secondary = '';
  for (let k = 1; k < rays.length; k++) {
    secondary += capsule(rays[k].x0, y0, rays[k].x1, y1, 1.7);
  }
  return { path: bar + primary, secondaryPath: secondary };
}

const left = leftIcon();
const right = rightIcon();

mkdirSync('/tmp/clone', { recursive: true });
function svg(icon, file) {
  const sec = icon.secondaryPath
    ? `<path d="${icon.secondaryPath}" fill="#2b2b2b" opacity="0.45"/>`
    : '';
  writeFileSync(
    file,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="300" height="300">` +
      `<rect width="24" height="24" fill="#ece4d8"/>` +
      `<path d="${icon.path}" fill="#2b2b2b"/>${sec}</svg>`
  );
}
svg(left, '/tmp/clone/left.svg');
svg(right, '/tmp/clone/right.svg');
// combined
writeFileSync(
  '/tmp/clone/both.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 24" width="600" height="300">` +
    `<rect width="48" height="24" fill="#ece4d8"/>` +
    `<path d="${left.path}" fill="#2b2b2b"/>` +
    `<g transform="translate(24,0)"><path d="${right.path}" fill="#2b2b2b"/>` +
    `<path d="${right.secondaryPath}" fill="#2b2b2b" opacity="0.45"/></g></svg>`
);
console.log('wrote /tmp/clone/both.svg');
