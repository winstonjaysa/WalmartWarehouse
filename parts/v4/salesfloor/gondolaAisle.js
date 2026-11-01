// gondolaAisle — Walmart Canada sales-floor double-sided grocery gondola run (low poly, r160).
// Long axis along x; shelves face +z and −z; end caps face ±x; blank blue aisle sign hangs above the +x end (faces ±x).
import { slab, B, rod, jit, mesh, finish, matsOf, rng, PROD } from './_kit.js';
export function build(THREE, mats, opts = {}) {
  const g = new THREE.Group(), R = rng(opts.seed ?? 1), M = matsOf(THREE, mats);
  const SEC = 1.22, n = Math.max(1, Math.round((opts.length ?? 8) / SEC)), L = n * SEC;
  const H = opts.height ?? 1.8, D = 0.5, BK = 0.04, gap = opts.gapRate ?? 0.07; // D = shelf depth per side
  const HS = opts.holeSecs || [], HOLES = []; // holeSecs: [{i, sz}] sections left empty on levels 1-3 (overnight stockers fill them)
  const S = [], P = [], steel = '#9ea3a8', dark = '#6d7277', deckC = '#8d9297';
  const ls = (H - 0.14) / 5, levels = [0, 1, 2, 3, 4].map(i => +(0.14 + i * ls).toFixed(3)); // base deck + 4 shelves (top of deck)
  // spine: backer panels (pegboard grey) + uprights
  S.push(slab(THREE, L, H - 0.1, BK, 0, 0.05 + (H - 0.1) / 2, 0, '#b3b7bb', 'yzZ'));
  for (let i = 0; i <= n; i++) S.push(B(THREE, 0.05, H, 0.08, -L / 2 + i * SEC, H / 2, 0, dark));
  S.push(slab(THREE, L + 0.02, 0.03, 0.1, 0, H - 0.015, 0, dark, 'yzZ'));
  for (const sz of [-1, 1]) {
    // base kick plate + deck
    S.push(slab(THREE, L, 0.12, 0.02, 0, 0.06, sz * (D + BK / 2), dark, sz > 0 ? 'zy' : 'Zy'));
    for (let li = 0; li < levels.length; li++) {
      const y = levels[li], dd = li === 0 ? D : D - 0.04;
      S.push(slab(THREE, L, 0.025, dd, 0, y - 0.0125, sz * (BK / 2 + dd / 2), li === 0 ? deckC : steel, sz > 0 ? 'yYz' : 'yYZ'));
      if (li) for (let i = 0; i <= n; i++) S.push(slab(THREE, 0.02, 0.06, dd - 0.02, -L / 2 + i * SEC, y - 0.04, sz * (BK / 2 + dd / 2), dark, 'xXY'));
      // shelf-edge price channel strip (light), occasional small coloured price slab
      S.push(slab(THREE, L, 0.035, 0.01, 0, y - 0.0175, sz * (BK / 2 + dd + 0.005), '#d9dcdf', sz > 0 ? 'z' : 'Z'));
      const top = (levels[li + 1] ?? H) - 0.035 - y;
      for (let i = 0; i < n; i++) {
        let x = -L / 2 + i * SEC + 0.03; const xe = x + SEC - 0.06;
        if (R() < 0.35) P.push(slab(THREE, 0.09, 0.03, 0.006, x + 0.2 + R() * 0.7, y - 0.018, sz * (BK / 2 + dd + 0.012), R() < 0.5 ? '#f4d23c' : '#2f6db5', sz > 0 ? 'z' : 'Z'));
        if (li >= 1 && li <= 3 && HS.some((q) => q.i === i && q.sz === sz)) { for (let hx = x + 0.15; hx < xe - 0.1; hx += 0.3) HOLES.push({ x: hx, y, z: sz * (BK / 2 + dd / 2), sz }); continue; }
        while (x < xe - 0.08) {
          const w = Math.min(xe - x, 0.14 + R() * 0.24);
          if (R() < gap) { x += w; continue; }
          const h = top * (0.55 + R() * 0.42), d = dd * (0.8 + R() * 0.17), c = jit(THREE, PROD[(R() * PROD.length) | 0], R, 0.08);
          P.push(slab(THREE, w - 0.012, h, d, x + w / 2, y + h / 2, sz * (BK / 2 + dd - d / 2 - 0.01), c, (sz > 0 ? 'z' : 'Z') + 'yxX'));
          // generic colour band across the facing (label stripe)
          if (R() < 0.6) P.push(slab(THREE, w - 0.014, h * 0.22, 0.004, x + w / 2, y + h * (0.35 + R() * 0.3), sz * (BK / 2 + dd - 0.01 + 0.002), jit(THREE, PROD[(R() * PROD.length) | 0], R), sz > 0 ? 'z' : 'Z'));
          x += w;
        }
      }
    }
  }
  // end caps at ±x: 1.0 wide (across z) × 0.45 deep shelf unit facing outward
  const EW = 2 * D + BK, ED = 0.45;
  for (const sx of [-1, 1]) {
    const cx = sx * (L / 2 + ED / 2), face = sx > 0 ? 'x' : 'X';
    S.push(slab(THREE, 0.04, H, EW, sx * (L / 2 + 0.02), H / 2, 0, '#b3b7bb', face + 'y'));
    for (const sz of [-1, 1]) S.push(B(THREE, ED, H, 0.04, cx, H / 2, sz * (EW / 2 - 0.02), dark));
    S.push(slab(THREE, 0.02, 0.12, EW, sx * (L / 2 + ED), 0.06, 0, dark, face + 'y'));
    const es = (H - 0.14) / 3.78, el = [0, 1, 2, 3].map(i => 0.14 + i * es);
    for (let li = 0; li < el.length; li++) {
      const y = el[li]; S.push(slab(THREE, ED - 0.04, 0.025, EW - 0.08, cx, y - 0.0125, 0, li ? steel : deckC, 'yY' + face));
      S.push(slab(THREE, 0.01, 0.035, EW - 0.08, sx * (L / 2 + ED + 0.005), y - 0.0175, 0, '#d9dcdf', face));
      const top = (el[li + 1] ?? H) - 0.04 - y; let z = -EW / 2 + 0.06;
      // end caps: blockier featured product (bigger cases, one colour family per level)
      const fam = PROD[(R() * PROD.length) | 0];
      while (z < EW / 2 - 0.14) {
        const w = Math.min(EW / 2 - 0.06 - z, 0.2 + R() * 0.15), h = top * (0.7 + R() * 0.28), d = ED - 0.08;
        if (R() > gap) P.push(slab(THREE, d, h, w - 0.012, cx + sx * 0.01, y + h / 2, z + w / 2, jit(THREE, R() < 0.7 ? fam : '#d7c7a0', R, 0.1), face + 'yzZ'));
        z += w;
      }
    }
  }
  // hanging blank blue aisle sign above +x end: panel 0.9 × 0.5, double-sided (faces ±x), white band at top, rods to y ≥3.4
  const sxp = L / 2 - 0.3, sy = Math.max(2.55, H + 0.75); // sign bottom ≥0.5 m above fixture top
  P.push(B(THREE, 0.03, 0.5, 0.9, sxp, sy, 0, '#1f5fb8'), B(THREE, 0.034, 0.1, 0.9, sxp, sy + 0.2, 0, '#f2f2ee'));
  for (const sz of [-1, 1]) S.push(rod(THREE, [sxp, sy + 0.25, sz * 0.38], [sxp, 3.4, sz * 0.38], 0.006, 4, '#8a8f94'));
  g.add(mesh(THREE, S, M.vm, 'gondola'), mesh(THREE, P, M.vc, 'products'));
  const out = finish(THREE, g, 'gondolaAisle', {}, { height: H, sections: n, length: L, shelfLevels: levels, facing: 'shelves ±z, end caps ±x, sign ±x' }); out.userData.holes = HOLES; return out;
}
