// checkoutLane — staffed checkout counter (low poly, r160). Lane runs along x: customer enters at −x (belt), exits at +x (bagging).
// Cashier side is −z; customer/aisle side is +z. Lane light pole at the −x end, impulse rack at the −x end on the +z side.
import { slab, B, rod, jit, mesh, finish, matsOf, rng, PROD } from './_kit.js';
export function build(THREE, mats, opts = {}) {
  const g = new THREE.Group(), R = rng(opts.seed ?? 1), M = matsOf(THREE, mats), P = [], S = [];
  const CW = 0.75, CH = 0.86, body = '#d9dadb', blu = opts.lightColor ?? '#1f5fb8';
  // belt counter (−x) 2.2 long, scanner bed, bagging carousel area (+x) 1.2 long
  P.push(B(THREE, 2.2, CH, CW, -1.1, CH / 2, 0, body), slab(THREE, 2.2, 0.08, 0.004, -1.1, 0.04, CW / 2 + 0.002, '#2a2a2c', 'z'));
  P.push(slab(THREE, 2.0, 0.02, 0.48, -1.15, CH + 0.01, -0.02, '#18181a', 'yzZ'), slab(THREE, 2.0, 0.025, 0.02, -1.15, CH + 0.012, 0.24, '#9aa0a6', 'yz'));
  P.push(slab(THREE, 2.2, 0.06, 0.004, -1.1, CH - 0.09, CW / 2 + 0.002, blu, 'z'));
  P.push(B(THREE, 0.5, 0.04, 0.5, 0.25, CH + 0.02, 0, '#3a3c40'), slab(THREE, 0.3, 0.004, 0.3, 0.25, CH + 0.042, 0, '#7a2a2a', 'y')); // scanner bed
  P.push(B(THREE, 1.2, CH - 0.06, CW, 1.1, (CH - 0.06) / 2, 0, body), slab(THREE, 1.1, 0.02, 0.6, 1.1, CH - 0.05, 0, '#b8bbbe', 'y'));
  // bag racks: rods + white bags
  for (const bx of [0.8, 1.4]) { S.push(rod(THREE, [bx, CH - 0.05, -0.2], [bx, CH + 0.45, -0.2], 0.01, 5, '#9aa0a6'), rod(THREE, [bx - 0.15, CH + 0.45, -0.2], [bx + 0.15, CH + 0.45, -0.2], 0.008, 4, '#9aa0a6')); P.push(B(THREE, 0.28, 0.4, 0.22, bx, CH + 0.24, -0.08, '#f2f2ee')); }
  // register/POS: cash drawer block, customer PIN pad on post, cashier screen on pole
  P.push(B(THREE, 0.45, 0.12, 0.4, 0.3, CH + 0.06, -0.55, '#2a2a2c'), B(THREE, 0.4, 0.04, 0.25, 0.3, CH + 0.14, -0.55, '#1a1a1c'));
  S.push(rod(THREE, [0.3, CH + 0.12, -0.6], [0.3, CH + 0.45, -0.6], 0.02, 6, '#4a4d52'));
  P.push(B(THREE, 0.38, 0.26, 0.04, 0.3, CH + 0.55, -0.58, '#141416', { rx: 0.25 }), B(THREE, 0.34, 0.21, 0.004, 0.3, CH + 0.55, -0.558, '#26406a', { rx: 0.25 }));
  P.push(B(THREE, 0.5, CH, 0.4, 0.3, CH / 2, -0.55, body)); // register stand
  S.push(rod(THREE, [-0.1, CH, 0.3], [-0.1, CH + 0.3, 0.3], 0.012, 5, '#4a4d52')); P.push(B(THREE, 0.1, 0.16, 0.04, -0.1, CH + 0.36, 0.3, '#1a1a1c', { rx: -0.4 }));
  // lane light pole at −x end with small coloured light box (no number)
  const px = -2.15, pz = -0.3; S.push(rod(THREE, [px, CH, pz], [px, 2.35, pz], 0.025, 8, '#8a8f94'));
  P.push(B(THREE, 0.32, 0.22, 0.12, px, 2.45, pz, blu), slab(THREE, 0.24, 0.12, 0.003, px, 2.45, pz + 0.062, '#f2f2ee', 'z'), slab(THREE, 0.24, 0.12, 0.003, px, 2.45, pz - 0.062, '#f2f2ee', 'Z'), B(THREE, 0.08, 0.06, 0.08, px, 2.59, pz, '#e8e04a'));
  // candy / impulse rack on the customer side at the −x end: 0.9 wide × 1.4 tall, faces +z
  const rx = -1.3, rz = CW / 2 + 0.3, RW = 0.9, RH = 1.4, RD = 0.3;
  S.push(slab(THREE, RW, RH, 0.02, rx, RH / 2, rz - RD / 2, '#3c3f44', 'zZy'));
  for (const sx of [-1, 1]) S.push(B(THREE, 0.03, RH, RD, rx + sx * RW / 2, RH / 2, rz, '#3c3f44'));
  for (let li = 0; li < 5; li++) {
    const y = 0.15 + li * 0.25; S.push(slab(THREE, RW, 0.02, RD, rx, y, rz, '#55595e', 'yYz'));
    let x = rx - RW / 2 + 0.03;
    while (x < rx + RW / 2 - 0.08) { const w = 0.06 + R() * 0.08, h = 0.08 + R() * 0.12; P.push(slab(THREE, w - 0.006, h, RD - 0.06, x + w / 2, y + 0.01 + h / 2, rz + 0.01, jit(THREE, PROD[(R() * PROD.length) | 0], R, 0.1), 'zyxX')); x += w; }
  }
  g.add(mesh(THREE, P, M.vc, 'counter'), mesh(THREE, S, M.vm, 'steel'));
  return finish(THREE, g, 'checkoutLane', {}, { facing: 'customer side +z, cashier −z, flow −x→+x', counterTop: CH });
}
