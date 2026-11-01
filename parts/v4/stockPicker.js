// stockPicker — Walmart Canada backroom MHE (low poly, r160). No brand text or logos.
import { mergeGeos, box, cyl, tint } from './_merge.js';
// --- inline low-poly kit (same in each day-2 vehicle module; no shared file) ---
const V3 = (THREE, a) => new THREE.Vector3(a[0], a[1], a[2]);
function rod(THREE, a, b, r, seg, c) {
  const A = V3(THREE, a), B = V3(THREE, b), d = B.clone().sub(A), L = d.length();
  const g = new THREE.CylinderGeometry(r, r, L, seg, 1); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()));
  const m = A.add(B).multiplyScalar(0.5); g.translate(m.x, m.y, m.z); return tint(THREE, g, c);
}
function bar(THREE, a, b, w, h, c) {
  const A = V3(THREE, a), B = V3(THREE, b), d = B.clone().sub(A), L = d.length();
  const g = new THREE.BoxGeometry(w, h, L); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), d.normalize()));
  const m = A.add(B).multiplyScalar(0.5); g.translate(m.x, m.y, m.z); return tint(THREE, g, c);
}
const B_ = (THREE, w, h, d, x, y, z, c, o = {}) => box(THREE, w, h, d, x, y, z, { ...o, c });
// wheel with axle along x
const wheel = (THREE, r, w, x, y, z, tyre, hub, seg = 14) => [cyl(THREE, r, r, w, seg, x, y, z, { rz: Math.PI / 2, c: tyre }), cyl(THREE, r * 0.6, r * 0.6, w + 0.004, 10, x, y, z, { rz: Math.PI / 2, c: hub })];
// half-round (rear) body: radius r, height h, centre (x,y0..y0+h,z), half toward -z
function halfRound(THREE, r, h, x, y0, z, c, seg = 10) {
  const g = new THREE.CylinderGeometry(r, r, h, seg, 1, false, Math.PI / 2, Math.PI); g.translate(x, y0 + h / 2, z); return tint(THREE, g, c);
}
function mesh(THREE, geos, mat, name) { const m = new THREE.Mesh(mergeGeos(THREE, geos), mat); m.name = name; m.castShadow = m.receiveShadow = true; return m; }
// rigid-skinned mesh: parts[i] = geometries bound to bones[i] (one draw call for many moving parts)
function skinned(THREE, parts, mat, name) {
  const geos = [], idx = [];
  parts.forEach((list, i) => { if (!list || !list.length) return; const m = mergeGeos(THREE, list); geos.push(m); idx.push([i, m.attributes.position.count]); });
  const geo = mergeGeos(THREE, geos), n = geo.attributes.position.count, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4); let o = 0;
  for (const [i, c] of idx) for (let k = 0; k < c; k++) { si[o * 4] = i; sw[o * 4] = 1; o++; }
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
  const m = new THREE.SkinnedMesh(geo, mat); m.name = name; m.castShadow = m.receiveShadow = true; m.frustumCulled = false; return m;
}
function matsOf(THREE, mats) {
  return {
    vc: mats.vc || new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.62, metalness: 0 }),
    vm: mats.vcMetal || new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.5, metalness: 0.5 }),
  };
}
const r3 = (v) => Math.round(v * 1000) / 1000;
// position of a marker in the model group's local space
function localOf(THREE, g, obj) { g.updateMatrixWorld(true); const p = obj.getWorldPosition(new THREE.Vector3()); return g.worldToLocal(p).toArray().map(r3); }
function stats(g) { let drawCalls = 0, verts = 0; g.traverse(o => { if (o.isMesh) { drawCalls++; verts += o.geometry.attributes.position.count; } }); return { drawCalls, verts }; }
function dimsOf(THREE, g) {
  g.updateMatrixWorld(true); g.traverse(o => { if (o.isSkinnedMesh) { o.skeleton.update(); o.boundingBox = null; o.boundingSphere = null; } });
  const bb = new THREE.Box3().setFromObject(g), s = bb.getSize(new THREE.Vector3());
  return { w: r3(s.x), h: r3(bb.max.y), d: r3(s.z) };
}
// --- end kit ---
// Order (stock) picker, plain yellow/grey, no text. Front (load deck + work tray) toward +z, operator platform at -z.
// Matches spec sheet: 1.50 L × 0.75 W, tray 1.26 m lowered, overall 1.74 m lowered, platform floor 0.30 → 3.00 m (max lift 118").
// pivots: platform (translates y, carries tray, guard rail, rear posts, canopy and inner mast stage), mastMid (middle telescoping stage, half speed).
// opts: lift 0..1. exports: build, setLift(group, 0..1).
const TRAVEL = 2.7, FLOOR0 = 0.30, TRAY0 = 1.26;
export function build(THREE, mats, opts = {}) {
  const g = new THREE.Group(), M = matsOf(THREE, mats);
  const Y = '#e3a71b', Yd = '#c98f12', G = '#5d6166', Gd = '#3c3f43', K = '#1d1e20', T = '#8a5a2e', H = '#6f7378';
  const L = 1.5, W = 0.75, mz = -0.1; // mast centre z
  const b = [], s = [], p = [];
  // chassis: grey lower body, yellow load tray at the front, yellow step cover at the rear
  b.push(B_(THREE, W - 0.04, 0.2, L - 0.08, 0, 0.16, 0, G), B_(THREE, W, 0.12, L, 0, 0.12, 0, G), B_(THREE, W - 0.1, 0.04, L - 0.2, 0, 0.04, 0, Gd));
  b.push(B_(THREE, W, 0.06, 0.78, 0, 0.29, 0.36, Y), B_(THREE, W - 0.08, 0.012, 0.66, 0, 0.326, 0.37, Yd));
  for (const sx of [-1, 1]) b.push(B_(THREE, 0.04, 0.05, 0.78, sx * (W / 2 - 0.02), 0.345, 0.36, Y));
  b.push(B_(THREE, W, 0.05, 0.04, 0, 0.345, 0.73, Y), B_(THREE, W, 0.05, 0.04, 0, 0.345, -0.01, Y));
  for (let i = 0; i < 6; i++) b.push(B_(THREE, W - 0.14, 0.006, 0.02, 0, 0.334, 0.12 + i * 0.1, Yd)); // deck ribs
  b.push(B_(THREE, W, 0.04, 0.6, 0, 0.255, -0.44, Y));
  for (const sx of [-1, 1]) { b.push(B_(THREE, 0.004, 0.035, 0.5, sx * (W / 2 + 0.002), 0.16, 0.12, Y, { rx: 0.08 })); for (let i = 0; i < 6; i++) b.push(B_(THREE, 0.004, 0.06, 0.012, sx * (W / 2 + 0.002), 0.17, -0.42 + i * 0.03, Gd)); }
  for (const sx of [-1, 1]) b.push(B_(THREE, 0.08, 0.04, 0.012, sx * 0.25, 0.17, L / 2 + 0.002, '#f2c46a')); // front lamps (plain)
  // wheels: rear drive pair, front casters
  for (const sx of [-1, 1]) { b.push(...wheel(THREE, 0.11, 0.06, sx * (W / 2 - 0.02), 0.11, -L / 2 + 0.16, T, H, 16)); b.push(...wheel(THREE, 0.05, 0.04, sx * (W / 2 - 0.1), 0.05, L / 2 - 0.1, T, H, 10)); }
  // mast: housing + fixed outer stage
  b.push(B_(THREE, 0.34, 0.26, 0.3, 0, 0.45, mz - 0.02, G), B_(THREE, 0.3, 0.04, 0.26, 0, 0.6, mz - 0.02, Gd));
  b.push(B_(THREE, 0.24, 1.36, 0.16, 0, 0.3 + 0.68, mz, G), B_(THREE, 0.26, 0.03, 0.18, 0, 1.66, mz, Gd));
  b.push(B_(THREE, 0.012, 1.3, 0.004, 0.08, 1.0, mz + 0.082, '#9ca1a6'), B_(THREE, 0.012, 1.3, 0.004, -0.08, 1.0, mz + 0.082, '#9ca1a6'));
  // middle stage (vcMetal), slides at half speed
  s.push(B_(THREE, 0.18, 1.5, 0.12, 0, 0.25 + 0.75, mz - 0.01, '#8a8f95'), B_(THREE, 0.2, 0.03, 0.14, 0, 1.75, mz - 0.01, '#6c7177'));
  const mid = new THREE.Object3D(); mid.name = 'mastMid'; g.add(mid); mid.add(mesh(THREE, s, M.vm, 'mastMid'));
  // platform assembly (positions authored at lowered height)
  const F = FLOOR0, pz = -0.5;
  p.push(B_(THREE, 0.13, 1.32, 0.09, 0, F + 0.04 + 0.66, mz - 0.01, '#9a9fa5'));                      // inner stage
  p.push(B_(THREE, 0.3, 1.0, 0.05, 0, F + 0.5, mz - 0.11, G), B_(THREE, 0.62, 0.04, 0.52, 0, F - 0.02, pz, Y), B_(THREE, 0.5, 0.006, 0.4, 0, F + 0.003, pz, K));
  p.push(B_(THREE, 0.62, 0.08, 0.04, 0, F - 0.03, pz - 0.26, Yd));
  // guard: side hoops and rear posts up to the canopy
  for (const sx of [-1, 1]) {
    const x = sx * 0.29;
    p.push(rod(THREE, [x, F, -0.3], [x, F + 0.98, -0.3], 0.017, 8, G), rod(THREE, [x, F + 0.98, -0.3], [x, F + 0.98, -0.66], 0.017, 8, G), rod(THREE, [x, F + 0.98, -0.66], [x, F, -0.72], 0.017, 8, G));
    p.push(rod(THREE, [x * 0.8, F, -0.74], [x * 0.8, F + 1.28, -0.7], 0.02, 8, Gd), rod(THREE, [x * 0.8, F + 1.28, -0.7], [x * 0.6, F + 1.34, mz - 0.1], 0.02, 8, Gd));
    p.push(B_(THREE, 0.18, 0.32, 0.05, sx * 0.13, F + 1.0, -0.68, K, { rx: -0.05 }));         // back pads
  }
  p.push(rod(THREE, [-0.29, F + 0.55, -0.72], [0.29, F + 0.55, -0.72], 0.014, 6, G));          // rear chain bar
  p.push(B_(THREE, 0.66, 0.06, 0.34, 0, F + 1.33, mz - 0.07, Gd), B_(THREE, 0.22, 0.08, 0.18, 0, F + 1.40, mz, Y));   // canopy + cap (top 1.74 lowered)
  // work tray in front of the mast, top at 1.26 lowered
  const ty = TRAY0, tz = mz + 0.42;
  p.push(B_(THREE, 0.62, 0.02, 0.52, 0, ty - 0.01, tz, Gd));
  for (const sx of [-1, 1]) p.push(B_(THREE, 0.02, 0.04, 0.52, sx * 0.3, ty + 0.01, tz, G));
  p.push(B_(THREE, 0.62, 0.04, 0.02, 0, ty + 0.01, tz + 0.25, G), B_(THREE, 0.26, 0.2, 0.06, 0, ty - 0.08, mz + 0.11, G));
  for (const sx of [-1, 1]) p.push(bar(THREE, [sx * 0.1, ty - 0.16, mz + 0.11], [sx * 0.22, ty - 0.03, tz + 0.18], 0.03, 0.03, G));
  const platform = new THREE.Object3D(); platform.name = 'platform'; g.add(platform); platform.add(mesh(THREE, p, M.vc, 'platform'));
  g.add(mesh(THREE, b, M.vc, 'base'));
  const op = new THREE.Object3D(); op.name = 'operatorPoint'; op.position.set(0, F + 0.006, pz); platform.add(op);
  const tp = new THREE.Object3D(); tp.name = 'trayPoint'; tp.position.set(0, ty, tz); platform.add(tp);
  const dimsLowered = dimsOf(THREE, g);
  g.userData = { name: 'stockPicker', dims: dimsLowered, dimsLowered, pivots: { platform, mastMid: mid }, ...stats(g), travel: TRAVEL, floorRange: [FLOOR0, FLOOR0 + TRAVEL], trayRange: [TRAY0, TRAY0 + TRAVEL], markers: { operator: op, tray: tp } };
  setLift(g, opts.lift ?? 0);
  return g;
}
export function setLift(g, t) {
  t = Math.min(1, Math.max(0, t)); const P = g.userData.pivots, THREE = { Vector3: g.position.constructor };
  P.platform.position.y = t * TRAVEL; P.mastMid.position.y = t * TRAVEL / 2;
  g.updateMatrixWorld(true);
  const loc = (o) => { const v = o.getWorldPosition(new THREE.Vector3()); return g.worldToLocal(v).toArray().map(r3); };
  g.userData.lift = t; g.userData.operatorPoint = loc(g.userData.markers.operator); g.userData.trayPoint = loc(g.userData.markers.tray);
  g.userData.platformHeight = r3(FLOOR0 + t * TRAVEL);
  return g;
}
