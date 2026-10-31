// cleaningRoom — Walmart Canada 1st-floor staff area (low poly, r160). See userData for dims/pivots.
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
  const g = new THREE.Group(), R = rng(opts.seed ?? 1), M = matsOf(THREE, mats);
  const P = [], S = [], Mp = [];
  // --- mop sink: 0.61 x 0.61 floor basin (curb 0.3), splash plate + faucet with hose
  const bx = -1.1, bz = -0.2, BW = 0.61, BH = 0.3, t = 0.06, bc = '#d4d2cc';
  P.push(B_(THREE, BW, 0.05, BW, bx, 0.025, bz, '#bdbab3'));
  for (const s of [-1, 1]) { P.push(B_(THREE, BW, BH, t, bx, BH / 2, bz + s * (BW / 2 - t / 2), bc), B_(THREE, t, BH, BW - 2 * t, bx + s * (BW / 2 - t / 2), BH / 2, bz, bc)); }
  P.push(cyl(THREE, 0.04, 0.04, 0.006, 10, bx, 0.053, bz, { c: '#5a5c5f' }));
  const pz = bz - BW / 2 + 0.02;
  S.push(B_(THREE, BW, 0.5, 0.012, bx, BH + 0.25, pz - 0.01, '#b8bcc0'));
  const fy = 0.92, fz = pz + 0.04, pc = '#c3c7cb';
  for (const s of [-1, 1]) { S.push(rod(THREE, [bx + s * 0.1, BH, fz], [bx + s * 0.1, fy, fz], 0.012, 8, pc), cyl(THREE, 0.02, 0.02, 0.05, 6, bx + s * 0.1, fy + 0.02, fz + 0.03, { rx: Math.PI / 2, c: '#2f63b0' })); }
  S[S.length - 1] = tint(THREE, S[S.length - 1], '#b0302c');
  S.push(rod(THREE, [bx - 0.1, fy - 0.08, fz], [bx + 0.1, fy - 0.08, fz], 0.016, 8, pc), rod(THREE, [bx, fy - 0.08, fz], [bx, fy - 0.08, fz + 0.16], 0.013, 8, pc));
  S.push(rod(THREE, [bx, fy - 0.08, fz + 0.16], [bx, fy - 0.2, fz + 0.17], 0.013, 8, pc), cyl(THREE, 0.008, 0.008, 0.22, 6, bx + 0.1, fy + 0.16, fz + 0.01, { c: pc }));
  // hose looped from the spout into the basin
  P.push(rod(THREE, [bx, fy - 0.2, fz + 0.17], [bx + 0.05, 0.35, bz + 0.05], 0.012, 6, '#2b2c2e'), rod(THREE, [bx + 0.05, 0.35, bz + 0.05], [bx + 0.12, 0.1, bz + 0.12], 0.012, 6, '#2b2c2e'));
  // --- janitor cart: 1.2 x 0.55, grey (opts.cartColor 'grey'|'yellow'), shelves at one end, yellow vinyl bag at the other
  const cc = opts.cartColor === 'yellow' ? '#d9ab1e' : '#6a6e73', cx = 0.35, cz = -0.25, CW = 1.15, CD = 0.52;
  P.push(B_(THREE, CW, 0.08, CD, cx, 0.17, cz, cc));                       // base tray
  const sx = cx + CW / 2 - 0.25;
  for (const s of [-1, 1]) P.push(B_(THREE, 0.5, 0.9, 0.03, sx, 0.21 + 0.45, cz + s * (CD / 2 - 0.015), cc));
  P.push(B_(THREE, 0.03, 0.9, CD, sx + 0.235, 0.66, cz, cc));
  for (const y of [0.6, 1.1]) P.push(B_(THREE, 0.5, 0.04, CD, sx, y, cz, cc));
  // caddies / bins on the shelves
  const bins = ['#2a5aa6', '#8c1c22', '#e0e0dc', '#2f7a45'];
  P.push(B_(THREE, 0.36, 0.2, 0.26, sx, 1.22, cz - 0.1, bins[(R() * 4) | 0]), B_(THREE, 0.02, 0.1, 0.24, sx, 1.37, cz - 0.1, '#333'));
  P.push(B_(THREE, 0.42, 0.24, 0.36, sx, 0.74, cz + 0.02, bins[(R() * 4) | 0]), B_(THREE, 0.42, 0.22, 0.36, sx, 0.33, cz, '#4b4e52'));
  for (let i = 0; i < 3; i++) P.push(cyl(THREE, 0.035, 0.04, 0.24, 8, sx - 0.12 + i * 0.12, 1.24, cz + 0.13, { c: ['#3b8fd8', '#e7d34a', '#d2463e'][i] }), cyl(THREE, 0.018, 0.018, 0.05, 6, sx - 0.12 + i * 0.12, 1.38, cz + 0.13, { c: '#f1f1ee' }));
  // bag frame + yellow vinyl bag + push handle
  const hx = cx - CW / 2 + 0.28;
  S.push(bar(THREE, [hx - 0.25, 1.02, cz - CD / 2 + 0.02], [hx - 0.25, 1.02, cz + CD / 2 - 0.02], 0.025, 0.025, '#7d8287'));
  for (const s of [-1, 1]) S.push(bar(THREE, [hx - 0.25, 1.02, cz + s * (CD / 2 - 0.02)], [sx - 0.25, 1.02, cz + s * (CD / 2 - 0.02)], 0.025, 0.025, '#7d8287'), rod(THREE, [hx - 0.25, 0.21, cz + s * (CD / 2 - 0.02)], [hx - 0.25, 1.02, cz + s * (CD / 2 - 0.02)], 0.012, 6, '#7d8287'));
  P.push(B_(THREE, 0.5, 0.78, CD - 0.06, hx, 0.62, cz, '#d9ab1e', { sh: 2 }));
  S.push(rod(THREE, [cx - CW / 2 - 0.02, 0.21, cz - 0.2], [cx - CW / 2 - 0.08, 1.0, cz - 0.2], 0.014, 6, '#7d8287'), rod(THREE, [cx - CW / 2 - 0.02, 0.21, cz + 0.2], [cx - CW / 2 - 0.08, 1.0, cz + 0.2], 0.014, 6, '#7d8287'), rod(THREE, [cx - CW / 2 - 0.08, 1.0, cz - 0.2], [cx - CW / 2 - 0.08, 1.0, cz + 0.2], 0.016, 6, '#2b2c2e'));
  for (const [wx, r] of [[cx - CW / 2 + 0.14, 0.1], [cx + CW / 2 - 0.14, 0.1], [cx - 0.05, 0.065]]) for (const s of [-1, 1]) P.push(cyl(THREE, r, r, 0.05, 12, wx, r, cz + s * (CD / 2 - 0.025), { rx: Math.PI / 2, c: '#1e1e20' }));
  // --- yellow mop bucket (≈0.6 x 0.4) with side-press wringer and a mop standing in it
  const kx = 0.2, kz = 0.6, KL = 0.56, KW = 0.38, KH = 0.36, yc = '#e2b417';
  const tub = new THREE.CylinderGeometry(Math.SQRT1_2, Math.SQRT1_2 * 0.86, 1, 4, 1, false); tub.rotateY(Math.PI / 4); tub.scale(KL, KH, KW); tub.translate(kx, 0.07 + KH / 2, kz);
  P.push(tint(THREE, tub, yc), B_(THREE, KL + 0.03, 0.03, KW + 0.03, kx, 0.07 + KH, kz, '#d4a812'));
  P.push(B_(THREE, KL * 0.86, 0.01, KW * 0.86, kx, 0.07 + KH * 0.72, kz, '#6e7a72')); // dirty water
  for (const s of [-1, 1]) for (const q of [-1, 1]) P.push(cyl(THREE, 0.035, 0.035, 0.03, 8, kx + s * (KL / 2 - 0.05), 0.035, kz + q * (KW / 2 - 0.05), { rx: Math.PI / 2, c: '#1e1e20' }));
  const wx = kx + KL / 2 - 0.12, wy = 0.07 + KH;
  P.push(B_(THREE, 0.22, 0.22, KW - 0.04, wx, wy + 0.11, kz, '#3f4246'), B_(THREE, 0.2, 0.04, KW, wx, wy + 0.2, kz, yc));
  S.push(rod(THREE, [wx + 0.08, wy + 0.2, kz - 0.12], [wx + 0.12, 1.05, kz - 0.12], 0.014, 6, '#a9adb1'), rod(THREE, [wx + 0.08, wy + 0.2, kz + 0.12], [wx + 0.12, 1.05, kz + 0.12], 0.014, 6, '#a9adb1'));
  P.push(rod(THREE, [wx + 0.12, 1.05, kz - 0.14], [wx + 0.12, 1.05, kz + 0.14], 0.02, 8, '#1e1e20'));
  S.push(rod(THREE, [kx - KL / 2 + 0.04, wy + 0.05, kz], [kx - KL / 2 + 0.04, wy + 0.2, kz], 0.008, 6, '#a9adb1')); // bail
  // mop (pivot 'mop' at the head in the bucket)
  const mop = new THREE.Object3D(); mop.name = 'mop'; mop.position.set(kx - 0.08, 0.12, kz); mop.rotation.z = 0.18; g.add(mop);
  Mp.push(cyl(THREE, 0.012, 0.012, 1.45, 6, 0, 0.78, 0, { c: '#2f63b0' }), cyl(THREE, 0.03, 0.025, 0.08, 8, 0, 0.06, 0, { c: '#d9ab1e' }));
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, r = 0.06 + R() * 0.03; Mp.push(rod(THREE, [0, 0.05, 0], [Math.cos(a) * r, -0.05, Math.sin(a) * r], 0.012, 4, '#ecebe4')); }
  mop.add(mesh(THREE, Mp, M.vc, 'mopMesh'));
  g.add(mesh(THREE, P, M.vc, 'plastic'), mesh(THREE, S, M.vm, 'steel'));
  return finish(THREE, g, 'cleaningRoom', { mop }, { sinkCurb: BH });
}
