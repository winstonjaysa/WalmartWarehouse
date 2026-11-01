// electronicsWall — TV wall + black device display table + grey boxed-merch shelving (low poly, r160).
// Everything faces +z (shopper side). Wall along x (width), table in front at +z, merch gondola beside the wall at +x.
import { slab, B, jit, mesh, finish, matsOf, rng, PROD } from './_kit.js';
export function build(THREE, mats, opts = {}) {
  const g = new THREE.Group(), R = rng(opts.seed ?? 1), M = matsOf(THREE, mats);
  const W = opts.width ?? 6, WH = 2.6, P = [], S = [];
  // backboard: grey panel with dark lower counter-band and light upper header band (blank)
  P.push(slab(THREE, W, WH, 0.08, 0, WH / 2, 0, '#c9c3bb', 'yzxX'), slab(THREE, W, 0.3, 0.004, 0, WH - 0.2, 0.042, '#f0f0ec', 'z'));
  P.push(B(THREE, W, 0.95, 0.45, 0, 0.475, 0.265, '#e6e6e2'), slab(THREE, W, 0.84, 0.004, 0, 0.47, 0.492, '#d5d6d6', 'z'), slab(THREE, W, 0.09, 0.004, 0, 0.045, 0.492, '#2a2a2c', 'z')); // low merch base / kick
  // two rows of TVs, sizes 32–75" (16:9), thin black bezels; some screens faint blue
  const rowY = [1.35, 2.05];
  for (let ri = 0; ri < 2; ri++) {
    let x = -W / 2 + 0.08;
    while (true) {
      const sw = ri === 0 ? 0.7 + R() * 0.95 : 0.6 + R() * 0.7; if (x + sw > W / 2 - 0.06) break;
      const sh = sw * 9 / 16, cy = ri === 0 ? rowY[0] + 0.05 : Math.max(rowY[1], rowY[0] + 0.05 + 0.5 + sh / 2 + 0.05);
      const scr = R() < 0.4 ? jit(THREE, '#1b2a44', R, 0.2) : jit(THREE, '#121418', R, 0.2);
      P.push(slab(THREE, sw, sh, 0.035, x + sw / 2, cy, 0.06, '#0c0c0e', 'zyxX'), slab(THREE, sw - 0.025, sh - 0.025, 0.003, x + sw / 2, cy, 0.079, scr, 'z'));
      if (R() < 0.5) P.push(slab(THREE, sw * 0.5, sh * 0.25, 0.002, x + sw * (0.3 + R() * 0.2), cy + (R() - 0.5) * sh * 0.4, 0.0815, jit(THREE, '#2b4a78', R, 0.25), 'z')); // faint picture patch
      x += sw + 0.08 + R() * 0.1;
    }
  }
  // small coloured price slabs under row 1
  for (let i = 0; i < 6; i++) P.push(slab(THREE, 0.12, 0.06, 0.004, -W / 2 + 0.4 + i * (W - 0.8) / 5, 0.99, 0.492, i % 2 ? '#f4d23c' : '#f2f2ee', 'z'));
  // black display table in front: 2.4 × 0.9, top 0.92, white edge stripe; devices
  const tz = 1.9, TW = Math.min(2.4, W * 0.5), TD = 0.9, TY = 0.92;
  P.push(B(THREE, TW, 0.08, TD, 0, TY - 0.04, tz, '#18181a'), slab(THREE, TW - 0.06, 0.004, TD - 0.06, 0, TY + 0.002, tz, '#e9e9e6', 'y'));
  P.push(slab(THREE, TW - 0.2, 0.18, TD - 0.2, 0, TY - 0.17, tz, '#121214', 'zZxX'));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) P.push(slab(THREE, 0.09, TY - 0.08, 0.09, sx * (TW / 2 - 0.08), (TY - 0.08) / 2, tz + sz * (TD / 2 - 0.08), '#141416', 'xXzZ'));
  for (let i = 0; i < 9; i++) {
    const x = -TW / 2 + 0.2 + i * (TW - 0.4) / 8, k = (R() * 3) | 0, z = tz + (R() - 0.5) * 0.25;
    if (k === 0) { // phone on a tilted stand
      P.push(B(THREE, 0.08, 0.15, 0.01, x, TY + 0.1, z, '#0e0e10', { rx: -0.35 }), B(THREE, 0.04, 0.04, 0.06, x, TY + 0.02, z - 0.02, '#c4c6c8'));
    } else if (k === 1) { // tablet
      P.push(B(THREE, 0.24, 0.17, 0.012, x, TY + 0.1, z, '#151517', { rx: -0.5 }), B(THREE, 0.2, 0.135, 0.002, x, TY + 0.1 + 0.003, z + 0.007, jit(THREE, '#203458', R, 0.3), { rx: -0.5 }));
    } else { // speaker
      const c = jit(THREE, ['#2a2a2c', '#3a5a8a', '#b03a3a', '#d7d7d2'][(R() * 4) | 0], R);
      P.push(B(THREE, 0.1, 0.18, 0.1, x, TY + 0.09, z, c), slab(THREE, 0.07, 0.07, 0.002, x, TY + 0.1, z + 0.051, '#141414', 'z'));
    }
    P.push(slab(THREE, 0.08, 0.05, 0.002, x, TY + 0.003, tz + TD / 2 - 0.06, '#f4d23c', 'y')); // price tile
  }
  // grey merch shelving beside the wall at +x: 1.22 wide × 1.8 tall × 0.6, facing +z, 4 shelves of boxed product
  const mx = W / 2 + 0.7, mz = 0.4, MW = 1.22, MH = 1.8, MD = 0.6, gry = '#8f9499';
  S.push(slab(THREE, MW, MH, 0.03, mx, MH / 2, mz - MD / 2 + 0.015, '#a9adb1', 'zZyxX'));
  for (const sx of [-1, 1]) S.push(B(THREE, 0.04, MH, MD, mx + sx * (MW / 2 - 0.02), MH / 2, mz, gry));
  const lv = [0.12, 0.52, 0.9, 1.28];
  for (let li = 0; li < lv.length; li++) {
    const y = lv[li]; S.push(slab(THREE, MW - 0.08, 0.025, MD - 0.04, mx, y - 0.0125, mz + 0.01, gry, 'yYz'), slab(THREE, MW - 0.08, 0.035, 0.01, mx, y - 0.02, mz + MD / 2 - 0.02, '#d9dcdf', 'z'));
    const top = (lv[li + 1] ?? MH) - 0.04 - y; let x = mx - MW / 2 + 0.06;
    while (x < mx + MW / 2 - 0.12) {
      const w = Math.min(mx + MW / 2 - 0.06 - x, 0.12 + R() * 0.18), h = top * (0.5 + R() * 0.45), d = MD * 0.7;
      if (R() > 0.06) {
        const c = jit(THREE, PROD[(R() * PROD.length) | 0], R, 0.1);
        P.push(slab(THREE, w - 0.01, h, d, x + w / 2, y + h / 2, mz + MD / 2 - 0.03 - d / 2, c, 'zyxX'));
        P.push(slab(THREE, w - 0.012, h * 0.25, 0.003, x + w / 2, y + h * 0.75, mz + MD / 2 - 0.03 + 0.002, R() < 0.5 ? '#f2f2ee' : '#1e2a44', 'z'));
      }
      x += w;
    }
  }
  S.push(slab(THREE, MW, 0.1, 0.03, mx, 0.05, mz + MD / 2 - 0.015, '#5a5f64', 'z'));
  g.add(mesh(THREE, P, M.vc, 'wallTable'), mesh(THREE, S, M.vm, 'shelving'));
  return finish(THREE, g, 'electronicsWall', {}, { facing: '+z', tableTop: TY });
}
