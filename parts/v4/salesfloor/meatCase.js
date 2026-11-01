// meatCase — open multideck refrigerated meat case (low poly, r160). Open front faces +z; length along x.
import { slab, B, jit, mesh, finish, matsOf, rng } from './_kit.js';
export function build(THREE, mats, opts = {}) {
  const g = new THREE.Group(), R = rng(opts.seed ?? 1), M = matsOf(THREE, mats);
  const L = opts.length ?? 3.7, D = 1.1, H = 2.05, B_ = [], T = [], body = '#d4d7da', inner = '#2b2e33', fas = '#2a2d33';
  const zb = -D / 2; // back
  // carcass: back wall, top canopy, end panels, base kick + front well lip
  B_.push(slab(THREE, L, H, 0.06, 0, H / 2, zb + 0.03, body, 'yZz'));
  B_.push(slab(THREE, L, 0.02, D - 0.12, 0, 0.62, zb + 0.06 + (D - 0.12) / 2, inner, 'y')); // well floor
  B_.push(slab(THREE, L, 1.45, 0.02, 0, 0.62 + 0.725, zb + 0.07, inner, 'z')); // dark interior back
  B_.push(slab(THREE, L, 0.55, 0.06, 0, 0.275 + 0.1, D / 2 - 0.03, body, 'zyZ'), slab(THREE, L, 0.1, 0.05, 0, 0.05, D / 2 - 0.08, '#3a3c40', 'zy')); // front base + kick
  B_.push(slab(THREE, L, 0.2, 0.06, 0, 0.75, D / 2 - 0.03, '#e8eaec', 'zyYZ')); // well front lip (raised)
  B_.push(slab(THREE, L, 0.03, 0.06, 0, 0.865, D / 2 - 0.03, '#9aa0a6', 'zy')); // bumper rail
  B_.push(B(THREE, L, 0.08, 0.62, 0, H - 0.04, zb + 0.31, body)); // canopy
  B_.push(slab(THREE, L, 0.28, 0.04, 0, H - 0.14, zb + 0.62, fas, 'zyY')); // dark top fascia (blank)
  B_.push(slab(THREE, L - 0.02, 0.025, 0.5, 0, H - 0.0925, zb + 0.32, '#f4f6f6', 'Y')); // light strip under canopy
  for (const sx of [-1, 1]) B_.push(slab(THREE, 0.05, H, D, sx * (L / 2 + 0.025), H / 2, 0, body, sx > 0 ? 'xyzZ' : 'XyzZ'));
  // 4 shelves stepping out toward the bottom; tray rows packed on each, plus well
  const shelves = [[1.68, 0.38], [1.42, 0.44], [1.16, 0.5], [0.92, 0.56]];
  const tray = (x, y, z, w, d) => {
    const meat = jit(THREE, R() < 0.5 ? '#b8333c' : R() < 0.6 ? '#d0606a' : '#9c2830', R, 0.12);
    T.push(slab(THREE, w, 0.03, d, x, y + 0.015, z, '#eef0f0', 'yzxX'), slab(THREE, w - 0.03, 0.022, d - 0.03, x, y + 0.04, z, meat, 'yz'));
  };
  for (const [y, sd] of shelves) {
    const z0 = zb + 0.08;
    B_.push(slab(THREE, L, 0.02, sd, 0, y - 0.01, z0 + sd / 2, '#3a3e44', 'yY'), slab(THREE, L, 0.045, 0.01, 0, y - 0.01, z0 + sd + 0.005, '#e9ecee', 'z'));
    let x = -L / 2 + 0.04;
    while (x < L / 2 - 0.2) {
      const w = 0.17 + R() * 0.07; if (R() < 0.05) { x += w; continue; }
      const rows = Math.floor(sd / 0.18); for (let r = 0; r < rows; r++) if (r === rows - 1 || R() < 0.8) tray(x + w / 2, y, z0 + sd - 0.09 - r * 0.18, w - 0.015, 0.155);
      x += w;
    }
  }
  // bottom well: trays tilted up toward the shopper (3 rows, front row lower)
  { let x = -L / 2 + 0.04; while (x < L / 2 - 0.2) { const w = 0.17 + R() * 0.07; for (let r = 0; r < 3; r++) tray(x + w / 2, 0.63 + r * 0.03, D / 2 - 0.18 - r * 0.2, w - 0.015, 0.17); x += w; } }
  // occasional small coloured price slabs on shelf edges
  for (const [y, sd] of shelves) for (let i = 0; i < 6; i++) T.push(slab(THREE, 0.06, 0.03, 0.004, -L / 2 + 0.3 + R() * (L - 0.6), y - 0.012, zb + 0.08 + sd + 0.012, R() < 0.5 ? '#f4d23c' : '#f2f2ee', 'z'));
  g.add(mesh(THREE, B_, M.vm, 'case'), mesh(THREE, T, M.vc, 'trays'));
  return finish(THREE, g, 'meatCase', {}, { facing: '+z', shelfLevels: shelves.map(s => s[0]), wellY: 0.62 });
}
