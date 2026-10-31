// lunchRoom — Walmart Canada 1st-floor staff area (low poly, r160). See userData for dims/pivots.
import { mergeGeos, box, cyl, tint, rng } from './_merge.js';
// --- inline low-poly kit (same in each floor-1 module; no shared file) ---
const V3 = (THREE, a) => new THREE.Vector3(a[0], a[1], a[2]);
// cylinder rod from a to b (radius r, seg sides), tinted c
function rod(THREE, a, b, r, seg, c) {
  const A = V3(THREE, a), B = V3(THREE, b), d = B.clone().sub(A), L = d.length();
  const g = new THREE.CylinderGeometry(r, r, L, seg, 1); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()));
  const m = A.add(B).multiplyScalar(0.5); g.translate(m.x, m.y, m.z); return tint(THREE, g, c);
}
// rectangular bar from a to b (w across, h up), tinted c; best for bars in a vertical plane
function bar(THREE, a, b, w, h, c) {
  const A = V3(THREE, a), B = V3(THREE, b), d = B.clone().sub(A), L = d.length();
  const g = new THREE.BoxGeometry(w, h, L); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), d.normalize()));
  const m = A.add(B).multiplyScalar(0.5); g.translate(m.x, m.y, m.z); return tint(THREE, g, c);
}
const B_ = (THREE, w, h, d, x, y, z, c, o = {}) => box(THREE, w, h, d, x, y, z, { ...o, c });
// rotate a list of geometries about y then move
function xf(list, ry, x, y, z) { for (const g of list) { if (ry) g.rotateY(ry); g.translate(x, y, z); } return list; }
function mesh(THREE, geos, mat, name) { const m = new THREE.Mesh(mergeGeos(THREE, geos), mat); m.name = name; m.castShadow = m.receiveShadow = true; return m; }
// centre footprint on origin (x/z), floor at y=0; fill userData
function finish(THREE, g, name, pivots, extra = {}) {
  const bb = new THREE.Box3().setFromObject(g), c = bb.getCenter(new THREE.Vector3());
  for (const ch of g.children) { ch.position.x -= c.x; ch.position.z -= c.z; }
  const s = bb.getSize(new THREE.Vector3()), r = (v) => Math.round(v * 1000) / 1000;
  let drawCalls = 0, verts = 0; g.traverse(o => { if (o.isMesh) { drawCalls++; verts += o.geometry.attributes.position.count; } });
  g.userData = { name, dims: { w: r(s.x), h: r(bb.max.y), d: r(s.z) }, pivots, drawCalls, verts, offset: [-c.x, 0, -c.z], ...extra };
  return g;
}
function matsOf(THREE, mats) {
  return {
    vc: mats.vc || new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.62, metalness: 0 }),
    vm: mats.vcMetal || new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.5, metalness: 0.5 }),
  };
}
// stacking chair, front faces +z, seat top 0.45 m
function chair(THREE, P, M, seatC, ry, x, z, legC = '#3a3d42') {
  const p = [], m = [];
  p.push(B_(THREE, 0.44, 0.035, 0.42, 0, 0.4325, 0.01, seatC), B_(THREE, 0.42, 0.26, 0.03, 0, 0.74, -0.205, seatC, { rx: -0.1 }));
  for (const sx of [-1, 1]) {
    m.push(rod(THREE, [sx * 0.2, 0, 0.19], [sx * 0.2, 0.415, 0.18], 0.011, 6, legC));
    m.push(rod(THREE, [sx * 0.2, 0, -0.2], [sx * 0.2, 0.86, -0.235], 0.011, 6, legC));
    m.push(bar(THREE, [sx * 0.2, 0.415, -0.2], [sx * 0.2, 0.415, 0.19], 0.02, 0.018, legC));
  }
  m.push(bar(THREE, [-0.2, 0.12, -0.2], [0.2, 0.12, -0.2], 0.016, 0.016, legC));
  P.push(...xf(p, ry, x, 0, z)); M.push(...xf(m, ry, x, 0, z));
}
// table, top surface 0.75 m
function table(THREE, P, M, w, d, x, z, topC, legC = '#45484d', edgeC = '#5b5d60') {
  const p = [B_(THREE, w, 0.026, d, 0, 0.737, 0, topC), B_(THREE, w - 0.04, 0.008, d - 0.04, 0, 0.72, 0, edgeC)], m = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) m.push(rod(THREE, [sx * (w / 2 - 0.06), 0, sz * (d / 2 - 0.06)], [sx * (w / 2 - 0.06), 0.716, sz * (d / 2 - 0.06)], 0.018, 8, legC));
  for (const sz of [-1, 1]) m.push(bar(THREE, [-w / 2 + 0.06, 0.69, sz * (d / 2 - 0.06)], [w / 2 - 0.06, 0.69, sz * (d / 2 - 0.06)], 0.025, 0.05, legC));
  for (const sx of [-1, 1]) m.push(bar(THREE, [sx * (w / 2 - 0.06), 0.69, -d / 2 + 0.06], [sx * (w / 2 - 0.06), 0.69, d / 2 - 0.06], 0.025, 0.05, legC));
  P.push(...xf(p, 0, x, 0, z)); M.push(...xf(m, 0, x, 0, z));
}
// --- end kit ---
export function build(THREE, mats, opts = {}) {
  const g = new THREE.Group(), R = rng(opts.seed ?? 1), M = matsOf(THREE, mats), n = Math.max(1, opts.tables ?? 3);
  const P = [], S = [], D = [];
  const TW = 1.2, TD = 0.8, cols = Math.min(n, 3), dx = 1.75;
  const seatCols = ['#7a1f24', '#6e1c22', '#84252a'];
  for (let i = 0; i < n; i++) {
    const c = i % cols, r = Math.floor(i / cols), x = (c - (cols - 1) / 2) * dx, z = 0.4 + r * 1.9;
    table(THREE, P, S, TW, TD, x, z, '#e3ddd0', '#55585c', '#9a958b');
    for (const sz of [-1, 1]) for (const sx of [-0.3, 0.3]) chair(THREE, P, S, seatCols[(R() * 3) | 0], (sz > 0 ? Math.PI : 0) + (R() - 0.5) * 0.3, x + sx + (R() - 0.5) * 0.05, z + sz * (0.5 + R() * 0.1));
  }
  // base-cabinet counter along the back (front faces +z)
  const CL = 3.0, CD = 0.62, cz = -1.6, cx = -0.45, CH = 0.91;
  P.push(B_(THREE, CL, 0.1, CD - 0.08, cx, 0.05, cz - 0.04, '#2b2b2d'), B_(THREE, CL, CH - 0.14, CD - 0.02, cx, 0.1 + (CH - 0.14) / 2, cz - 0.01, '#d8d4cb'));
  P.push(B_(THREE, CL + 0.03, 0.04, CD + 0.02, cx, CH - 0.02, cz, '#6f6a62'), B_(THREE, CL + 0.03, 0.1, 0.02, cx, CH + 0.05, cz - CD / 2, '#6f6a62'));
  const nd = 5, dw = CL / nd;
  for (let i = 0; i < nd; i++) {
    const x = cx - CL / 2 + dw * (i + 0.5);
    P.push(B_(THREE, dw - 0.012, 0.16, 0.02, x, CH - 0.13, cz + CD / 2, '#ece8df'), B_(THREE, dw - 0.012, 0.56, 0.02, x, 0.42, cz + CD / 2, '#ece8df'));
    S.push(B_(THREE, 0.12, 0.012, 0.018, x, CH - 0.15, cz + CD / 2 + 0.018, '#9da2a7'), B_(THREE, 0.012, 0.12, 0.018, x + (i % 2 ? -1 : 1) * (dw / 2 - 0.06), 0.6, cz + CD / 2 + 0.018, '#9da2a7'));
  }
  // sink + faucet at the left end
  const sx0 = cx - CL / 2 + 0.55;
  S.push(B_(THREE, 0.5, 0.012, 0.38, sx0, CH + 0.001, cz, '#a9aeb3'), B_(THREE, 0.44, 0.01, 0.32, sx0, CH + 0.002, cz, '#6d7277'));
  S.push(rod(THREE, [sx0, CH, cz - 0.24], [sx0, CH + 0.3, cz - 0.24], 0.014, 8, '#c4c8cc'), rod(THREE, [sx0, CH + 0.3, cz - 0.24], [sx0, CH + 0.28, cz - 0.08], 0.012, 8, '#c4c8cc'));
  // 2 microwaves on the counter
  for (const [mx, col] of [[cx + 0.15, '#1c1c1e'], [cx + 0.75, '#b6babd']]) {
    const y0 = CH, W = 0.5, H = 0.29, Dp = 0.38, z = cz - 0.03;
    P.push(B_(THREE, W, H, Dp, mx, y0 + H / 2 + 0.008, z, col), B_(THREE, W * 0.62, H * 0.7, 0.008, mx - W * 0.13, y0 + H / 2 + 0.008, z + Dp / 2 + 0.003, '#0d0f12'));
    P.push(B_(THREE, W * 0.22, H * 0.8, 0.006, mx + W * 0.34, y0 + H / 2 + 0.008, z + Dp / 2 + 0.002, '#2a2c30'), B_(THREE, 0.06, 0.03, 0.03, mx + W * 0.34, y0 + H * 0.25, z + Dp / 2 + 0.01, '#55585c'));
    for (const fx of [-1, 1]) for (const fz of [-1, 1]) P.push(B_(THREE, 0.03, 0.008, 0.03, mx + fx * (W / 2 - 0.04), y0 + 0.004, z + fz * (Dp / 2 - 0.04), '#111'));
  }
  // fridge to the right of the counter, door hinged on its left edge
  const FW = 0.76, FH = 1.72, FD = 0.72, fx = cx + CL / 2 + 0.06 + FW / 2, fz = cz - CD / 2 + FD / 2;
  S.push(B_(THREE, FW, FH - 0.04, FD - 0.06, fx, 0.04 + (FH - 0.04) / 2, fz - 0.03, '#c9cdd1'), B_(THREE, FW - 0.1, 0.04, FD - 0.1, fx, 0.02, fz, '#222'));
  S.push(B_(THREE, FW - 0.01, 0.48, 0.05, fx, FH - 0.24, fz + FD / 2 - 0.035, '#d3d7da'), rod(THREE, [fx - FW / 2 + 0.06, FH - 0.42, fz + FD / 2 + 0.03], [fx - FW / 2 + 0.06, FH - 0.08, fz + FD / 2 + 0.03], 0.012, 6, '#8a8f94'));
  const door = new THREE.Object3D(); door.name = 'fridgeDoor'; door.position.set(fx + FW / 2 - 0.005, 0, fz + FD / 2 - 0.01);
  D.push(B_(THREE, FW - 0.01, FH - 0.55, 0.05, -FW / 2 + 0.005, 0.06 + (FH - 0.55) / 2, -0.025, '#d3d7da'), rod(THREE, [-FW + 0.065, 0.55, 0.03], [-FW + 0.065, 1.05, 0.03], 0.012, 6, '#8a8f94'));
  for (const yy of [0.55, 1.05]) D.push(B_(THREE, 0.03, 0.02, 0.04, -FW + 0.065, yy, 0.012, '#8a8f94'));
  // hinge on the +x edge; opts.fridgeOpen 0..1 swings it out (rot y > 0)
  door.add(mesh(THREE, D, M.vm, 'fridgeDoorMesh')); door.rotation.y = (opts.fridgeOpen ?? 0) * 1.6; g.add(door);
  g.add(mesh(THREE, P, M.vc, 'furniture'), mesh(THREE, S, M.vm, 'steel'));
  return finish(THREE, g, 'lunchRoom', { fridgeDoor: door }, { tables: n, chairs: n * 4, tableTop: 0.75, seatHeight: 0.45, counterTop: CH });
}
