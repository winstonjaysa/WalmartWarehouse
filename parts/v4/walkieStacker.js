// walkieStacker — Walmart Canada backroom MHE (low poly, r160). No brand text or logos.
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
// Walk-behind pallet stacker, plain red body + black mast (~2.1 m lowered), no text. Forks along +z, operator at -z.
// One rigid-skinned mesh per material: pivots are Bones (translate/rotate only): mastInner (y, half speed), carriage (y, child of mastInner), tiller (rot x; negative tilts back toward the operator), platform (rot x; 'up' folded).
// opts: forkHeight (fork top above floor, 0.09..3.0), tiller (rad, -0.1), platform ('up'|'down'). exports: build, setForkHeight(g, m), setTiller(g, a), setPlatform(g, 'up'|'down').
const FORK0 = 0.09, FORKMAX = 3.0;
export function build(THREE, mats, opts = {}) {
  const g = new THREE.Group(), body = new THREE.Group(), M = matsOf(THREE, mats);
  const R = '#c3171d', Rd = '#9e1217', K = '#1c1d1f', Kg = '#2c2e31', S = '#55595e', Wt = '#d9d9d6';
  const PW = 0.8, PL = 0.72, FL = 1.07, FW = 0.1, FX = 0.29;
  // bones: 0 root, 1 mastInner, 2 carriage, 3 tiller, 4 platform
  const bones = [0, 1, 2, 3, 4].map(() => new THREE.Bone());
  ['root', 'mastInner', 'carriage', 'tiller', 'platform'].forEach((n, i) => (bones[i].name = n));
  const tY = 0.86, tZ = -0.5, hZ = -PL - 0.06, hY = 0.11;
  bones[0].add(bones[1], bones[3], bones[4]); bones[1].add(bones[2]);
  bones[3].position.set(0, tY, tZ); bones[4].position.set(0, hY, hZ);
  const V = [[], [], [], [], []], Mt = [[], [], [], [], []]; // vc / vcMetal parts per bone
  // power unit: red box + half-round rear, black skirt, dark lid; black battery compartment beside the mast
  V[0].push(B_(THREE, PW, 0.7, 0.36, 0, 0.13 + 0.35, -0.18, R), halfRound(THREE, PW / 2, 0.7, 0, 0.13, -0.36, R, 12));
  V[0].push(B_(THREE, PW + 0.02, 0.12, 0.38, 0, 0.09, -0.18, K), halfRound(THREE, PW / 2 + 0.01, 0.12, 0, 0.03, -0.36, K, 12));
  V[0].push(B_(THREE, PW - 0.04, 0.02, 0.34, 0, 0.84, -0.17, Kg), halfRound(THREE, PW / 2 - 0.02, 0.02, 0, 0.83, -0.36, Kg, 12));
  V[0].push(B_(THREE, PW + 0.004, 0.05, 0.3, 0, 0.36, -0.18, Rd));
  V[0].push(B_(THREE, 0.34, 0.12, 0.2, 0, 0.9, -0.5, K), B_(THREE, 0.2, 0.04, 0.12, 0.22, 0.86, -0.12, K), rod(THREE, [0.22, 0.88, -0.12], [0.22, 1.02, -0.1], 0.012, 6, K));
  V[0].push(B_(THREE, 0.5, 0.02, 0.2, -0.05, 0.86, -0.2, Kg));
  // base legs + load wheels under the forks
  for (const sx of [-1, 1]) {
    V[0].push(B_(THREE, 0.12, 0.085, 0.95, sx * FX, 0.0425, 0.5, R), B_(THREE, 0.12, 0.04, 0.08, sx * FX, 0.06, 0.99, R, { rx: 0.4 }));
    V[0].push(...wheel(THREE, 0.04, 0.07, sx * FX, 0.04, 0.9, K, S, 10));
  }
  V[0].push(...wheel(THREE, 0.11, 0.07, 0.1, 0.11, -0.35, K, S, 14), ...wheel(THREE, 0.05, 0.05, -0.28, 0.05, -0.55, K, S, 10));
  // outer mast (fixed): two channels, top cross-head, bottom tie, mesh guard
  for (const sx of [-1, 1]) Mt[0].push(B_(THREE, 0.07, 2.04, 0.11, sx * 0.34, 0.05 + 1.02, 0.07, K));
  Mt[0].push(B_(THREE, 0.76, 0.1, 0.13, 0, 2.05, 0.07, K), B_(THREE, 0.76, 0.12, 0.13, 0, 0.12, 0.07, K));
  for (let i = 0; i < 8; i++) Mt[0].push(B_(THREE, 0.006, 1.0, 0.006, -0.28 + i * 0.08, 1.48, 0.0, Kg));
  for (let i = 0; i < 9; i++) Mt[0].push(B_(THREE, 0.6, 0.006, 0.006, 0, 0.98 + i * 0.12, 0.0, Kg));
  // inner mast stage (bone 1, slides at half fork lift)
  for (const sx of [-1, 1]) Mt[1].push(B_(THREE, 0.06, 1.96, 0.08, sx * 0.27, 0.1 + 0.98, 0.09, Kg));
  Mt[1].push(B_(THREE, 0.6, 0.06, 0.08, 0, 2.06, 0.09, Kg), B_(THREE, 0.6, 0.06, 0.08, 0, 0.2, 0.09, Kg));
  Mt[1].push(rod(THREE, [0, 0.25, 0.1], [0, 1.4, 0.1], 0.03, 8, S)); // lift cylinder
  // carriage (bone 2): plate, forks, load backrest grille
  const fy = FORK0;
  Mt[2].push(B_(THREE, 0.72, 0.3, 0.04, 0, fy + 0.12, 0.17, K));
  for (const sx of [-1, 1]) {
    Mt[2].push(B_(THREE, FW, 0.04, FL, sx * FX, fy - 0.02, 0.19 + FL / 2, Kg), B_(THREE, FW, 0.32, 0.04, sx * FX, fy + 0.14, 0.17, Kg));
    Mt[2].push(B_(THREE, FW, 0.02, 0.1, sx * FX, fy - 0.03, 0.19 + FL - 0.03, Kg, { rx: 0.18 }));
    Mt[2].push(B_(THREE, 0.03, 1.0, 0.03, sx * 0.34, fy + 0.3 + 0.5, 0.17, K));
  }
  Mt[2].push(B_(THREE, 0.71, 0.03, 0.03, 0, fy + 1.29, 0.17, K), B_(THREE, 0.71, 0.03, 0.03, 0, fy + 0.8, 0.17, K));
  for (let i = 0; i < 4; i++) Mt[2].push(B_(THREE, 0.018, 0.97, 0.018, -0.21 + i * 0.14, fy + 0.8, 0.17, K));
  // tiller (bone 3): pivot hub, arm, head with handle horns and red cap (authored upright at the bone)
  V[3].push(cyl(THREE, 0.06, 0.06, 0.16, 10, 0, tY, tZ, { rz: Math.PI / 2, c: Kg }));
  V[3].push(bar(THREE, [0, tY, tZ], [0, tY + 0.62, tZ - 0.05], 0.06, 0.045, K), bar(THREE, [0, tY + 0.62, tZ - 0.05], [0, tY + 0.78, tZ - 0.13], 0.07, 0.05, K));
  const hy = tY + 0.82, hz = tZ - 0.16;
  V[3].push(B_(THREE, 0.14, 0.08, 0.1, 0, hy, hz, K), B_(THREE, 0.08, 0.025, 0.06, 0, hy + 0.05, hz - 0.01, R));
  for (const sx of [-1, 1]) V[3].push(bar(THREE, [sx * 0.07, hy, hz], [sx * 0.16, hy - 0.02, hz - 0.08], 0.035, 0.035, K), bar(THREE, [sx * 0.16, hy - 0.02, hz - 0.08], [sx * 0.14, hy - 0.04, hz - 0.18], 0.035, 0.035, K));
  V[3].push(bar(THREE, [-0.14, hy - 0.04, hz - 0.18], [0.14, hy - 0.04, hz - 0.18], 0.03, 0.03, K), B_(THREE, 0.03, 0.03, 0.03, 0.06, hy + 0.04, hz - 0.03, '#e88a1c'));
  // fold-down rider platform (bone 4), authored down (horizontal, extending to -z from the hinge)
  V[4].push(B_(THREE, 0.56, 0.04, 0.38, 0, hY, hZ - 0.19, K), B_(THREE, 0.5, 0.008, 0.32, 0, hY + 0.024, hZ - 0.19, Kg));
  for (let i = 0; i < 4; i++) V[4].push(B_(THREE, 0.46, 0.006, 0.02, 0, hY + 0.03, hZ - 0.07 - i * 0.08, S));
  V[4].push(cyl(THREE, 0.025, 0.025, 0.5, 8, 0, hY, hZ, { rz: Math.PI / 2, c: S }));
  const mV = skinned(THREE, V, M.vc, 'body'), mM = skinned(THREE, Mt, M.vm, 'mast');
  body.add(bones[0], mV, mM); g.add(body); body.position.z = -0.25; // centre the footprint
  // markers on bones
  const hp = new THREE.Object3D(); hp.name = 'handlePoint'; hp.position.set(0, hy - 0.04, hz - 0.18); bones[3].add(hp); hp.position.sub(bones[3].position);
  const fp = new THREE.Object3D(); fp.name = 'forkPoint'; fp.position.set(0, fy, 0.19 + FL / 2); bones[2].add(fp);
  g.updateMatrixWorld(true);
  const sk = new THREE.Skeleton(bones); mV.bind(sk); mM.bind(sk);
  g.userData = { name: 'walkieStacker', pivots: { mastInner: bones[1], carriage: bones[2], tiller: bones[3], platform: bones[4] }, ...stats(g), forkRange: [FORK0, FORKMAX], markers: { handle: hp, fork: fp }, skeleton: sk };
  setPlatform(g, opts.platform ?? 'up'); setForkHeight(g, opts.forkHeight ?? FORK0); setTiller(g, opts.tiller ?? -0.1);
  const lift = g.userData.forkHeight; setForkHeight(g, FORK0); const t = g.userData.tiller; setTiller(g, -0.1);
  g.userData.dims = dimsOf(THREE, g); setForkHeight(g, lift); setTiller(g, t);
  return g;
}
function refresh(g) {
  g.updateMatrixWorld(true); const u = g.userData, V3c = g.position.constructor;
  const loc = (o) => g.worldToLocal(o.getWorldPosition(new V3c())).toArray().map(r3);
  u.handlePoint = loc(u.markers.handle); u.forkPoint = loc(u.markers.fork);
  g.traverse(o => { if (o.isSkinnedMesh) { o.skeleton.update(); o.boundingBox = null; o.boundingSphere = null; } });
}
export function setForkHeight(g, m) {
  const u = g.userData, h = Math.min(FORKMAX, Math.max(FORK0, m)), lift = h - FORK0;
  u.pivots.mastInner.position.y = lift / 2; u.pivots.carriage.position.y = lift / 2; u.forkHeight = r3(h); refresh(g); return g;
}
export function setTiller(g, a) { g.userData.pivots.tiller.rotation.x = Math.max(-1.35, Math.min(0.2, a)); g.userData.tiller = a; refresh(g); return g; }
export function setPlatform(g, s) { g.userData.pivots.platform.rotation.x = s === 'down' ? 0 : Math.PI / 2; g.userData.platform = s === 'down' ? 'down' : 'up'; refresh(g); return g; }
export function getHandlePoint(g) { refresh(g); return g.userData.handlePoint; }
export function getForkPoint(g) { refresh(g); return g.userData.forkPoint; }
