// sickRoom — Walmart Canada 1st-floor staff area (low poly, r160). See userData for dims/pivots.
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
  const P = [], S = [];
  // first-aid cot along x: steel tube frame, vinyl mattress (top ≈0.62), raised head section at -x
  const L = 1.9, W = 0.72, fy = 0.5, cz = 0.15, fc = '#b9bdc1';
  for (const sz of [-1, 1]) S.push(bar(THREE, [-L / 2, fy, cz + sz * W / 2], [L / 2, fy, cz + sz * W / 2], 0.035, 0.05, fc));
  for (const sx of [-1, 1]) S.push(bar(THREE, [sx * L / 2, fy, cz - W / 2], [sx * L / 2, fy, cz + W / 2], 0.035, 0.05, fc));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    S.push(rod(THREE, [sx * (L / 2 - 0.03), 0.06, cz + sz * (W / 2 - 0.02)], [sx * (L / 2 - 0.03), fy, cz + sz * (W / 2 - 0.02)], 0.016, 8, fc));
    S.push(cyl(THREE, 0.03, 0.03, 0.06, 8, sx * (L / 2 - 0.03), 0.03, cz + sz * (W / 2 - 0.02), { c: '#2a2a2c' }));
  }
  S.push(bar(THREE, [-L / 2 + 0.03, 0.18, cz], [L / 2 - 0.03, 0.18, cz], 0.03, 0.03, fc));
  for (const sx of [-1, 1]) S.push(bar(THREE, [sx * (L / 2 - 0.03), 0.18, cz - W / 2 + 0.02], [sx * (L / 2 - 0.03), 0.18, cz + W / 2 - 0.02], 0.03, 0.03, fc));
  const vin = '#2d5f6e', hl = 0.62, ang = 0.42;
  P.push(B_(THREE, L - hl - 0.01, 0.09, W - 0.02, hl / 2, fy + 0.07, cz, vin), B_(THREE, L - 0.02, 0.025, W, 0, fy + 0.0375, cz, '#d6d9dc'));
  // head section hinged at the flat mattress end, rising toward -x; pillow on it
  const head = [B_(THREE, hl, 0.09, W - 0.02, -hl / 2, 0.045, 0, vin), B_(THREE, 0.34, 0.08, 0.5, -hl + 0.22, 0.125, 0, '#f2f2ee'), B_(THREE, 0.03, 0.03, W, -hl * 0.6, -0.03, 0, fc)];
  for (const h of head) { h.rotateZ(-ang); h.translate(-L / 2 + hl, fy + 0.025, cz); }
  P.push(head[0], head[1]); S.push(head[2]);
  P.push(B_(THREE, L - hl - 0.05, 0.004, W - 0.06, hl / 2, fy + 0.116, cz, '#e8ecee')); // paper roll sheet
  // small white supply cabinet with two doors and a green kit case on top
  const kx = 0.55, kz = -0.75, KW = 0.6, KH = 0.9, KD = 0.4;
  S.push(B_(THREE, KW, KH, KD, kx, KH / 2, kz, '#e6e7e5'), B_(THREE, KW - 0.04, 0.05, KD - 0.04, kx, 0.025, kz + 0.01, '#3a3b3d'));
  for (const s of [-1, 1]) { S.push(B_(THREE, KW / 2 - 0.015, KH - 0.1, 0.012, kx + s * KW / 4, KH / 2 + 0.03, kz + KD / 2 + 0.005, '#f1f2f0'), B_(THREE, 0.014, 0.12, 0.022, kx + s * 0.035, KH * 0.6, kz + KD / 2 + 0.014, '#7d8287')); }
  P.push(B_(THREE, 0.36, 0.14, 0.24, kx - 0.08, KH + 0.07, kz, '#2f7a45'), B_(THREE, 0.12, 0.03, 0.03, kx - 0.08, KH + 0.155, kz, '#1c1c1e'));
  P.push(cyl(THREE, 0.04, 0.04, 0.16, 8, kx + 0.2, KH + 0.08, kz + 0.05, { c: '#f4f4f0' }));
  // chair beside the cot head, and a small step-on waste bin
  chair(THREE, P, S, '#4a5058', -0.5 + (R() - 0.5) * 0.2, -0.45, -0.75);
  P.push(cyl(THREE, 0.13, 0.12, 0.36, 10, 1.15, 0.18, -0.78, { c: '#d9dbdb' }), cyl(THREE, 0.135, 0.135, 0.03, 10, 1.15, 0.375, -0.78, { c: '#c7c9ca' }));
  g.add(mesh(THREE, P, M.vc, 'soft'), mesh(THREE, S, M.vm, 'steel'));
  return finish(THREE, g, 'sickRoom', {}, { cotTop: +(fy + 0.115).toFixed(3), seatHeight: 0.45 });
}
