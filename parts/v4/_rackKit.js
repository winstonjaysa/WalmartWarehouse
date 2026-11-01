// Shared helpers for day-2 pallet racking / backroom shelving (geometry pushers; all colours via vertex colour, constant UV for clean patches).
import { box } from './_merge.js';
export const U = { uv: [0.2, 0.2] };
const hex = (THREE, c, r, dl = 0.06, dh = 0.01) => { const k = new THREE.Color(c); k.offsetHSL((r() - 0.5) * dh, 0, (r() - 0.5) * dl); return '#' + k.getHexString(); };
export { hex as jitterHex };
// upright frame at x: 2 slotted posts (front/back), foot plates, horizontals + zig-zag diagonals; guard: yellow end guard on the floor
export function frame(THREE, S, x, D, H, col, { guard = 0, nd = 5 } = {}) {
  for (const z of [-D / 2 + 0.04, D / 2 - 0.04]) {
    S.push(box(THREE, 0.08, H, 0.075, x, H / 2, z, { c: col }));
    S.push(box(THREE, 0.022, H - 0.1, 0.004, x, H / 2, z + Math.sign(z) * 0.039, { c: '#7d9284' })); // slot strip (reads as punched holes)
    S.push(box(THREE, 0.14, 0.012, 0.14, x, 0.006, z, { c: '#4a4f4c' }));
  }
  const span = (H - 0.25) / nd;
  for (const y of [0.15, H - 0.1]) S.push(box(THREE, 0.04, 0.04, D - 0.12, x, y, 0, { c: col }));
  for (let i = 0; i < nd; i++) { const len = Math.hypot(span, D - 0.16), a = Math.atan2(D - 0.16, span) * (i % 2 ? 1 : -1); S.push(box(THREE, 0.035, len, 0.03, x, 0.15 + span * (i + 0.5), 0, { rx: a, c: col })); }
  if (guard) { S.push(box(THREE, 0.1, 0.32, D + 0.08, x + guard * 0.09, 0.16, 0, { c: '#e2b318' })); S.push(box(THREE, 0.12, 0.012, D + 0.12, x + guard * 0.09, 0.006, 0, { c: '#c99c12' })); }
}
// beam pair + wire deck at height y (top of deck at y)
export function level(THREE, S, cx, y, iw, D, col, deckCol = '#6f7a72') {
  for (const z of [-D / 2 + 0.04, D / 2 - 0.04]) S.push(box(THREE, iw, 0.12, 0.055, cx, y - 0.06, z, { c: col }));
  S.push(box(THREE, iw - 0.01, 0.01, D - 0.1, cx, y - 0.005, 0, { c: deckCol }));
  const nw = 3;
  for (let k = 0; k < nw; k++) S.push(box(THREE, 0.012, 0.035, D - 0.1, cx - iw / 2 + (k + 0.5) * iw / nw, y - 0.025, 0, { c: '#59625b' })); // deck support channels
  S.push(box(THREE, iw - 0.01, 0.006, 0.014, cx, y + 0.002, D / 2 - 0.09, { c: '#8a948b' }));
}
// simple pallet (top deck, 3 stringers, 2 bottom boards)
export function pallet(THREE, B, x, y, z, col, r, w = 1.2, d = 1.0) {
  B.push(box(THREE, w, 0.022, d, x, y + 0.133, z, { c: hex(THREE, col, r), ...U }));
  for (const k of [-1, 0, 1]) B.push(box(THREE, 0.09, 0.09, d, x + k * (w / 2 - 0.045), y + 0.077, z, { c: hex(THREE, col, r, 0.1), ...U }));
  for (const k of [-1, 1]) B.push(box(THREE, w, 0.02, 0.14, x, y + 0.01, z + k * (d / 2 - 0.07), { c: hex(THREE, col, r), ...U }));
}
// stretch-wrapped load: pallet + carton block (irregular top) + bulged film shell into W
export function wrappedLoad(THREE, B, W, r, x, y, z, h, { palletCol = '#2f62b8', kraft, w = 1.2, d = 1.0 } = {}) {
  pallet(THREE, B, x, y, z, palletCol, r, w, d);
  const y1 = y + 0.144, tops = [], nt = 2;
  for (const [i, j] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { // 2x2 columns, 2 tiers each (separate cartons → visible seams through the film)
    const hh = h * (0.86 + r() * 0.14); tops.push(hh); let yy = y1;
    for (let t = 0; t < nt; t++) { const th = t < nt - 1 ? hh * (0.45 + r() * 0.1) : y1 + hh - yy; B.push(box(THREE, w / 2 - 0.015, th - 0.006, d / 2 - 0.015, x + i * w / 4 + (r() - 0.5) * 0.01, yy + th / 2, z + j * d / 4, { c: hex(THREE, kraft[Math.floor(r() * kraft.length)], r, 0.1), ...U })); yy += th; }
  }
  const hh = Math.max(...tops) + 0.03, g = box(THREE, w + 0.03, hh, d + 0.03, x, y1 + hh / 2 - 0.05, z, { sw: 2, sh: 3, sd: 2, c: '#ffffff' });
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const px = p.getX(i) - x, py = p.getY(i), pz = p.getZ(i) - z, t = (py - y1) / hh, b = 1 + 0.025 * Math.sin(Math.PI * Math.min(1, Math.max(0, t))); p.setXYZ(i, x + px * b + (r() - 0.5) * 0.004, py, z + pz * b); }
  g.computeVertexNormals(); W.push(g);
  return y1 + hh;
}
// one shelf of cases: columns along x, 1-3 high, front + back rows; pick(r) -> colour hex
export function fillCases(THREE, B, r, xa, xb, y, D, clear, pick, { minW = 0.28, maxW = 0.5, gap = 0.012 } = {}) {
  let x = xa + 0.01;
  while (x < xb - minW) {
    const bw = Math.min(xb - x - 0.01, minW + r() * (maxW - minW)); if (bw < minW * 0.7) break;
    let yy = y; const bd = (D - 0.14) * (0.46 + r() * 0.06);
    const n = 1 + Math.floor(r() * 3);
    for (let k = 0; k < n; k++) { const bh = Math.min(clear - (yy - y) - 0.02, 0.18 + r() * 0.24); if (bh < 0.1) break; const w2 = bw * (k ? 0.85 + r() * 0.15 : 1); B.push(box(THREE, w2 - gap, bh, bd, x + bw / 2 + (r() - 0.5) * 0.02, yy + bh / 2, D / 2 - 0.07 - bd / 2 - r() * 0.03, { c: pick(r), ry: (r() - 0.5) * 0.05 })); yy += bh; }
    if (r() < 0.6) { const bh = Math.min(clear - 0.03, 0.3 + r() * 0.35); B.push(box(THREE, bw - gap, bh, bd, x + bw / 2, y + bh / 2, -D / 2 + 0.07 + bd / 2, { c: pick(r) })); }
    x += bw + 0.005 + r() * 0.02;
  }
}
