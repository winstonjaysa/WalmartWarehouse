// Shared 48x40 in GMA stringer pallet geometry (1.22 x 0.144 x 1.02 m), vertex-coloured, wood-grain UVs.
// palletGeo(THREE, seed, tones?, paint?) paint: 'blue' (CHEP-style painted blue, white stencil, worn top boards) |
// 'red' (plain painted red, PECO-like) | 'natural'. If paint is omitted it is chosen from the seed (~40% blue, 15% red, 45% natural).
import { box, mergeGeos, rng } from './_merge.js';
export const PALLET = { w: 1.22, d: 1.02, h: 0.144 };
export function palletPaint(seed = 7, override) {
  if (override === 'blue' || override === 'red' || override === 'natural') return override;
  const u = rng((seed >>> 0) * 2654435761 + 97)(); return u < 0.4 ? 'blue' : u < 0.55 ? 'red' : 'natural';
}
function jitter(THREE, hex, r, v = 0.06, hue = 0.012) {
  const c = new THREE.Color(hex), hsl = {}; c.getHSL(hsl);
  c.setHSL((hsl.h + (r() - 0.5) * 2 * hue + 1) % 1, hsl.s, Math.min(1, Math.max(0, hsl.l * (1 + (r() - 0.5) * 2 * v))));
  return '#' + c.getHexString();
}
export function palletGeo(THREE, seed = 7, tones, paint) {
  const r = rng(seed), g = [], tb = 0.022, sh = 0.1, bb = 0.022;
  const P = palletPaint(seed, paint);
  const NAT = tones && P === 'natural' ? tones : ['#c9a06a', '#b98e5a', '#d4ad78', '#a98250', '#c29662'];
  const BASE = P === 'blue' ? ['#2c5a94', '#28528a', '#31609c'] : P === 'red' ? ['#a3302a', '#9a2b26', '#ad3730'] : NAT;
  const pick = () => jitter(THREE, BASE[Math.floor(r() * BASE.length)], r);
  const wood = () => jitter(THREE, NAT[Math.floor(r() * NAT.length)], r, 0.08);
  // stringers along x (48")
  const zs = [-0.471, 0, 0.471];
  for (const z of zs) g.push(box(THREE, 1.22, sh, 0.038, 0, bb + sh / 2, z, { c: pick() }));
  // stringer notches (dark recesses for fork entry, look-through)
  for (const z of [-0.471, 0.471]) for (const x of [-0.3, 0.3]) g.push(box(THREE, 0.23, 0.035, 0.04, x, bb + 0.0175, z, { c: '#3a2a18' }));
  // top deck boards along z (40"), 7 boards
  const tw = [0.14, 0.09, 0.09, 0.14, 0.09, 0.09, 0.14];
  const xs = [-0.54, -0.36, -0.18, 0, 0.18, 0.36, 0.54];
  xs.forEach((x, i) => {
    const xx = x + (r() - 0.5) * 0.006;
    g.push(box(THREE, 1.02, tb, tw[i] - 0.004, xx, bb + sh + tb / 2, 0, { ry: Math.PI / 2, c: pick() }));
    // paint wear: bare wood scuffed through on top-board centres (fork/forklift traffic)
    if (P !== 'natural' && r() < 0.75) { const L = 0.25 + r() * 0.45; g.push(box(THREE, L, 0.0012, (tw[i] - 0.004) * (0.4 + r() * 0.5), xx, bb + sh + tb + 0.0006, (r() - 0.5) * (1.0 - L) * 0.8, { ry: Math.PI / 2, c: wood() })); }
  });
  // bottom boards, 5
  for (const x of [-0.54, -0.27, 0, 0.27, 0.54]) g.push(box(THREE, 1.02, bb, 0.14, x, bb / 2, 0, { ry: Math.PI / 2, c: pick() }));
  // nail heads
  for (const x of xs) for (const z of zs) g.push(box(THREE, 0.012, 0.002, 0.012, x + 0.02, bb + sh + tb + 0.0014, z, { c: '#555555', uv: [0.5, 0.5] }));
  if (P === 'blue') {
    // white stencil blocks on stringer ends + side "CHEP"-like stencil bars (no real logo text)
    for (const z of zs) for (const e of [-1, 1]) {
      g.push(box(THREE, 0.002, 0.03, 0.03, e * 0.6105, bb + sh * 0.62, z, { c: '#f2f2ee', uv: [0.5, 0.5] }));
      g.push(box(THREE, 0.002, 0.008, 0.032, e * 0.6105, bb + sh * 0.3, z, { c: '#e8e8e2', uv: [0.5, 0.5] }));
    }
    for (const e of [-1, 1]) for (let k = 0; k < 4; k++) g.push(box(THREE, 0.035 + (k % 2) * 0.02, 0.028, 0.002, -0.08 + k * 0.055, bb + sh * 0.62, e * 0.4911, { c: '#f2f2ee', uv: [0.5, 0.5] }));
  }
  const geo = mergeGeos(THREE, g); geo.userData = { paint: P }; return geo;
}
