// electricPalletJack — Walmart Canada backroom MHE (low poly, r160). No brand text or logos.
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
// Walkie electric pallet jack, plain red + black, no text. Forks (black, 1.2 m) along +z, operator at -z.
// pivots: forks (translates y 0..0.1: forks, fork frame and tall load-backrest grille), tiller (rot x; negative tilts back toward the operator).
// opts: forkLift (0..0.1), tiller (rad, -0.12). exports: build, setForkLift(g, 0..0.1), setTiller(g, a), getHandlePoint(g), getForkPoint(g).
export function build(THREE, mats, opts = {}) {
  const g = new THREE.Group(), body = new THREE.Group(), M = matsOf(THREE, mats);
  const R = '#c3171d', Rd = '#9e1217', K = '#1c1d1f', Kg = '#2c2e31', S = '#55595e';
  const PW = 0.72, FL = 1.2, FW = 0.17, FX = 0.265, FH = 0.08, z0 = 0.04;
  const b = [], f = [], t = [];
  // power unit: red box + half-round rear, deep black bumper, black front frame panel
  b.push(B_(THREE, PW, 0.5, 0.3, 0, 0.3 + 0.25, -0.17, R), halfRound(THREE, PW / 2, 0.5, 0, 0.3, -0.32, R, 12));
  b.push(B_(THREE, PW + 0.02, 0.26, 0.32, 0, 0.04 + 0.13, -0.17, K), halfRound(THREE, PW / 2 + 0.01, 0.26, 0, 0.04, -0.32, K, 12));
  b.push(B_(THREE, PW + 0.03, 0.012, 0.3, 0, 0.2, -0.17, Kg), B_(THREE, PW - 0.04, 0.02, 0.28, 0, 0.8, -0.16, Kg), halfRound(THREE, PW / 2 - 0.02, 0.02, 0, 0.79, -0.32, Kg, 12));
  b.push(B_(THREE, 0.3, 0.1, 0.04, 0, 0.42, -0.69, K, { rx: -0.3 })); // rear grille
  for (let i = 0; i < 3; i++) b.push(B_(THREE, 0.26, 0.008, 0.02, 0, 0.39 + i * 0.03, -0.71, Kg, { rx: -0.3 }));
  b.push(B_(THREE, 0.22, 0.16, 0.16, 0, 0.36, -0.6, K)); // tiller mount
  b.push(B_(THREE, 0.16, 0.05, 0.18, -0.16, 0.835, -0.2, Rd)); // battery lid hump
  b.push(...wheel(THREE, 0.115, 0.08, 0.06, 0.115, -0.38, K, S, 14), ...wheel(THREE, 0.05, 0.05, -0.27, 0.05, -0.5, K, S, 10));
  // fork frame (lifts): black front panel, forks with load rollers, tall backrest grille
  f.push(B_(THREE, PW + 0.02, 0.8, 0.05, 0, 0.42, z0 - 0.02, K), B_(THREE, PW + 0.02, 0.06, 0.12, 0, 0.11, z0 + 0.02, K));
  for (const sx of [-1, 1]) {
    const x = sx * FX;
    f.push(B_(THREE, FW, 0.012, FL, x, FH - 0.006, z0 + FL / 2, K), B_(THREE, 0.008, FH - 0.02, FL, x - FW / 2 + 0.004, (FH - 0.012) / 2 + 0.01, z0 + FL / 2, K), B_(THREE, 0.008, FH - 0.02, FL, x + FW / 2 - 0.004, (FH - 0.012) / 2 + 0.01, z0 + FL / 2, K));
    f.push(B_(THREE, FW, 0.012, 0.12, x, FH - 0.025, z0 + FL - 0.05, K, { rx: 0.3 }));
    for (const dz of [0.25, 0.75]) f.push(B_(THREE, 0.05, 0.002, 0.03, x, FH + 0.001, z0 + dz, '#0c0c0d'));
    for (const dz of [-0.13, -0.05]) f.push(...wheel(THREE, 0.034, 0.07, x, 0.034, z0 + FL + dz, Kg, S, 10));
    f.push(B_(THREE, 0.06, 0.02, 0.03, x, FH + 0.005, z0 + FL - 0.015, Rd)); // tip reflector
    // backrest uprights curving over at the top
    f.push(B_(THREE, 0.035, 1.12, 0.035, sx * 0.35, 0.82 + 0.56 - 0.38, z0 + 0.01, K), bar(THREE, [sx * 0.35, 1.5, z0 + 0.01], [sx * 0.3, 1.56, z0 + 0.01], 0.035, 0.035, K));
  }
  f.push(B_(THREE, 0.62, 0.035, 0.035, 0, 1.56, z0 + 0.01, K), B_(THREE, 0.7, 0.035, 0.035, 0, 1.06, z0 + 0.01, K), B_(THREE, 0.7, 0.05, 0.05, 0, 1.14, z0 + 0.01, K));
  for (let i = 0; i < 3; i++) f.push(B_(THREE, 0.025, 0.5, 0.025, -0.15 + i * 0.15, 1.31, z0 + 0.01, K));
  // tiller: hub, curved arm (two bars), head with horns and red cap (authored upright at the pivot)
  const tY = 0.42, tZ = -0.58;
  t.push(cyl(THREE, 0.055, 0.055, 0.2, 10, 0, tY, tZ, { rz: Math.PI / 2, c: Kg }));
  t.push(bar(THREE, [0, tY, tZ], [0, tY + 0.5, tZ + 0.02], 0.06, 0.045, K), bar(THREE, [0, tY + 0.5, tZ + 0.02], [0, tY + 0.78, tZ - 0.08], 0.06, 0.045, K));
  const hy = tY + 0.84, hz = tZ - 0.12;
  t.push(B_(THREE, 0.12, 0.09, 0.12, 0, hy, hz, K), B_(THREE, 0.09, 0.05, 0.1, 0, hy + 0.06, hz - 0.01, R));
  for (const sx of [-1, 1]) t.push(bar(THREE, [sx * 0.06, hy, hz], [sx * 0.15, hy - 0.01, hz - 0.08], 0.035, 0.035, K), bar(THREE, [sx * 0.15, hy - 0.01, hz - 0.08], [sx * 0.12, hy - 0.03, hz - 0.18], 0.035, 0.035, K));
  t.push(bar(THREE, [-0.12, hy - 0.03, hz - 0.18], [0.12, hy - 0.03, hz - 0.18], 0.03, 0.03, K));
  const forks = new THREE.Object3D(); forks.name = 'forks'; forks.add(mesh(THREE, f, M.vc, 'forks'));
  const tiller = new THREE.Object3D(); tiller.name = 'tiller'; tiller.position.set(0, tY, tZ); const tm = mesh(THREE, t, M.vc, 'tiller'); tm.position.set(0, -tY, -tZ); tiller.add(tm);
  body.add(mesh(THREE, b, M.vc, 'body'), forks, tiller); g.add(body); body.position.z = -(z0 + FL - 0.68) / 2;
  const hp = new THREE.Object3D(); hp.name = 'handlePoint'; hp.position.set(0, hy - 0.03 - tY, hz - 0.18 - tZ); tiller.add(hp);
  const fp = new THREE.Object3D(); fp.name = 'forkPoint'; fp.position.set(0, FH, z0 + FL / 2); forks.add(fp);
  g.userData = { name: 'electricPalletJack', pivots: { forks, tiller }, ...stats(g), forkLiftRange: [0, 0.1], forkTopLowered: FH, markers: { handle: hp, fork: fp } };
  setForkLift(g, 0); setTiller(g, -0.12); g.userData.dims = dimsOf(THREE, g);
  setForkLift(g, opts.forkLift ?? 0); setTiller(g, opts.tiller ?? -0.12);
  return g;
}
function refresh(g) {
  g.updateMatrixWorld(true); const u = g.userData, V3c = g.position.constructor;
  const loc = (o) => g.worldToLocal(o.getWorldPosition(new V3c())).toArray().map(r3);
  u.handlePoint = loc(u.markers.handle); u.forkPoint = loc(u.markers.fork);
}
export function setForkLift(g, m) { const h = Math.min(0.1, Math.max(0, m)); g.userData.pivots.forks.position.y = h; g.userData.forkLift = r3(h); refresh(g); return g; }
export function setTiller(g, a) { g.userData.pivots.tiller.rotation.x = Math.max(-1.35, Math.min(0.2, a)); g.userData.tiller = a; refresh(g); return g; }
export function getHandlePoint(g) { refresh(g); return g.userData.handlePoint; }
export function getForkPoint(g) { refresh(g); return g.userData.forkPoint; }
