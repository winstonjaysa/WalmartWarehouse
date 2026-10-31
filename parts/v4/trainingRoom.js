// trainingRoom — Walmart Canada 1st-floor staff area (low poly, r160). See userData for dims/pivots.
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
  const g = new THREE.Group(), R = rng(opts.seed ?? 1), M = matsOf(THREE, mats), n = Math.max(1, opts.tables ?? 4);
  const P = [], S = [], E = [];
  const TW = 1.5, TD = 0.6, cols = 2, rows = Math.ceil(n / cols), dz = 1.7;
  const seatCols = ['#2e3e5c', '#33435f', '#2a3954', '#3a4560'];
  for (let i = 0; i < n; i++) {
    const c = i % cols, r = Math.floor(i / cols), x = (c - (cols - 1) / 2) * (TW + 0.45), z = r * dz;
    table(THREE, P, S, TW, TD, x, z, '#d9d2c3', '#4a4d52', '#8f8a80');
    for (const sx of [-0.38, 0.38]) chair(THREE, P, S, seatCols[(R() * 4) | 0], Math.PI + (R() - 0.5) * 0.25, x + sx + (R() - 0.5) * 0.06, z + 0.52 + R() * 0.08);
  }
  // free-standing wall panel with wall-mounted 75" screen, facing +z toward the tables
  const pz = -1.35, PW = 2.6, PH = 2.4;
  P.push(B_(THREE, PW, PH, 0.06, 0, PH / 2 + 0.05, pz, '#b9bcbf'), B_(THREE, PW + 0.02, 0.06, 0.08, 0, PH + 0.05, pz, '#8a8d91'));
  for (const sx of [-1, 1]) { P.push(B_(THREE, 0.06, PH, 0.08, sx * (PW / 2), PH / 2 + 0.05, pz, '#8a8d91')); S.push(B_(THREE, 0.08, 0.05, 0.7, sx * (PW / 2 - 0.15), 0.025, pz, '#55585d')); }
  const sy = 1.55, SW = 1.66, SH = 0.95;
  P.push(B_(THREE, SW + 0.03, SH + 0.03, 0.05, 0, sy, pz + 0.07, '#141416'), B_(THREE, 0.4, 0.3, 0.04, 0, sy, pz + 0.04, '#222'));
  E.push(B_(THREE, SW, SH, 0.004, 0, sy, pz + 0.097, '#ffffff'));
  g.add(mesh(THREE, P, M.vc, 'furniture'), mesh(THREE, S, M.vm, 'frames'));
  const sm = mats.screen ? mats.screen.clone() : new THREE.MeshStandardMaterial({ color: 0x0b0f16, roughness: 0.15 });
  sm.vertexColors = true; sm.emissive = new THREE.Color(0x3d5f8c); sm.emissiveIntensity = 0.8;
  const scr = mesh(THREE, E, sm, 'screen'); scr.castShadow = false; g.add(scr);
  const piv = new THREE.Object3D(); piv.name = 'screen'; piv.position.set(0, sy, pz + 0.1); g.add(piv);
  return finish(THREE, g, 'trainingRoom', { screen: piv }, { tables: n, chairs: n * 2, tableTop: 0.75, seatHeight: 0.45 });
}
