// Scratch stand-in scene for tour.js QA (not part of the product). Clay-ish stand-ins at each Explore stop.
import * as THREE from 'three';
import * as Wrapper from './wrapper.js';
const M = (c, r = 0.85) => new THREE.MeshStandardMaterial({ color: c, roughness: r });
const C = { blue: 0x0071ce, navy: 0x041e42, yel: 0xffc220, wall: 0xf2f3f5, steel: 0xb9c1cb, dark: 0x2f3542, card: 0xc0915a, white: 0xf4f6f8, skin: 0xe0b48f, orange: 0xe8590c, red: 0xe23b3b };
function box(parent, w, h, d, c, x, y, z) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof c === 'number' ? M(c) : c); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m; }
function cyl(parent, r, h, c, x, y, z) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 16), M(c)); m.position.set(x, y, z); parent.add(m); return m; }
export function person(vest = C.blue) { const g = new THREE.Group();
  box(g, 0.13, 0.82, 0.16, C.navy, -0.1, 0.41, 0); box(g, 0.13, 0.82, 0.16, C.navy, 0.1, 0.41, 0);
  box(g, 0.46, 0.6, 0.28, vest, 0, 1.12, 0); box(g, 0.47, 0.06, 0.29, C.yel, 0, 1.0, 0); box(g, 0.47, 0.06, 0.29, C.yel, 0, 1.22, 0);
  box(g, 0.1, 0.55, 0.12, 0xe9edf2, -0.29, 1.1, 0); box(g, 0.1, 0.55, 0.12, 0xe9edf2, 0.29, 1.1, 0);
  const h = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), M(C.skin)); h.position.y = 1.58; g.add(h); box(g, 0.27, 0.08, 0.27, C.navy, 0, 1.69, 0.02); return g; }
function palletLoad(parent, x, y, z, c = C.card, h = 1.2) { const g = new THREE.Group(); g.position.set(x, y, z); box(g, 1.2, 0.14, 1.0, 0xb08a5a, 0, 0.07, 0); box(g, 1.15, h, 0.95, c, 0, 0.14 + h / 2, 0); parent.add(g); return g; }
function forklift(withLoad = true) { const g = new THREE.Group(); box(g, 1.2, 1.0, 2.0, C.yel, 0, 0.7, 0); box(g, 1.1, 0.12, 1.3, C.dark, 0, 2.2, -0.1);
  for (const s of [-1, 1]) { box(g, 0.08, 2.0, 0.08, C.dark, s * 0.5, 1.2, 0.5); box(g, 0.08, 2.0, 0.08, C.dark, s * 0.5, 1.2, -0.7); box(g, 0.1, 2.4, 0.12, C.dark, s * 0.4, 1.3, 1.05); box(g, 0.12, 0.05, 1.1, C.dark, s * 0.3, 0.15, 1.65); }
  for (const [x, z] of [[-0.6, 0.6], [0.6, 0.6], [-0.6, -0.6], [0.6, -0.6]]) { const w = cyl(g, 0.28, 0.2, C.dark, x, 0.28, z); w.rotation.z = Math.PI / 2; }
  const p = person(); p.position.set(0, 0.55, -0.2); p.scale.setScalar(0.95); g.add(p); if (withLoad) palletLoad(g, 0, 0.12, 1.75, C.card, 1.0); return g; }
function reachTruck() { const g = new THREE.Group(); box(g, 1.1, 1.3, 1.4, C.blue, 0, 0.75, -0.4); box(g, 0.12, 6.5, 0.15, C.dark, -0.4, 3.3, 0.4); box(g, 0.12, 6.5, 0.15, C.dark, 0.4, 3.3, 0.4);
  for (const s of [-1, 1]) box(g, 0.14, 0.15, 1.5, C.dark, s * 0.5, 0.12, 0.9);
  const car = new THREE.Group(); car.position.set(0, 2.6, 0.7); g.add(car); box(car, 0.9, 0.1, 0.12, C.dark, 0, 0, 0); palletLoad(car, 0, 0, 0.6, C.card, 1.0); g.userData.carriage = car;
  const p = person(); p.position.set(0, 0.3, -0.6); g.add(p); return g; }
function semi(trailerLen = 14, cab = C.blue) { const g = new THREE.Group(); const tr = box(g, 2.6, 2.9, trailerLen, C.white, 0, 2.6, 0); box(g, 2.62, 0.5, trailerLen * 0.98, C.blue, 0, 3.4, 0);
  for (const z of [-trailerLen / 2 + 1.2, -trailerLen / 2 + 2.4]) for (const s of [-1, 1]) { const w = cyl(g, 0.5, 0.35, C.dark, s * 1.05, 0.5, z); w.rotation.z = Math.PI / 2; }
  const c = new THREE.Group(); c.position.z = trailerLen / 2 + 2.2; g.add(c); box(c, 2.5, 2.6, 2.6, cab, 0, 2.2, 0.4); box(c, 2.3, 1.0, 2.0, C.dark, 0, 0.9, -1.2);
  for (const s of [-1, 1]) for (const z of [1.1, -1.3]) { const w = cyl(c, 0.5, 0.35, C.dark, s * 1.05, 0.5, z); w.rotation.z = Math.PI / 2; }
  return g; }
function yardTractor() { const g = new THREE.Group(); box(g, 2.2, 2.3, 2.2, C.yel, 0, 1.9, 1.0); box(g, 2.0, 0.8, 4.2, C.dark, 0, 0.9, 0); const b = cyl(g, 0.12, 0.2, 0xff9900, 0, 3.2, 1.0);
  for (const s of [-1, 1]) for (const z of [1.3, -1.3]) { const w = cyl(g, 0.5, 0.35, C.dark, s * 1.0, 0.5, z); w.rotation.z = Math.PI / 2; } const p = person(); p.position.set(0, 1.0, 1.1); p.scale.setScalar(0.9); g.add(p); return g; }

export function build(scene) {
  const T = {}, movers = [], blockers = [];
  const bl = new THREE.Group(); scene.add(bl); const sceneAdd = scene; scene = bl; // everything solid goes under `bl` (= line-of-sight blockers)
  blockers.push(bl);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), M(0xc9ced4)); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; sceneAdd.add(ground);
  box(scene, 100, 1.2, 62, 0xdfe3e8, 0, 0.6, 0);
  // shell: north/west full height, south/east cut low (as walmart-dc.html)
  box(scene, 100, 12, 0.4, C.wall, 0, 7.2, -31); box(scene, 0.4, 12, 62, C.wall, -50, 7.2, 0); box(scene, 100, 4.5, 0.4, C.wall, 0, 3.45, 31); box(scene, 0.4, 4.5, 62, C.wall, 50, 3.45, 0);
  for (let i = 0; i < 8; i++) { box(scene, 3.0, 3.2, 0.1, 0x8f969f, -40 + 4 * i, 2.8, 31.25); box(scene, 3.0, 3.2, 0.1, 0x8f969f, -24 + 4 * i, 2.8, -31.25); }
  // reserve racking: rows N-S, aisles 3 m
  const rackMat = M(C.blue), beamMat = M(C.orange);
  for (let r = 0; r < 8; r++) { const x = -46 + r * 5.4; for (const s of [-1, 1]) { const rx = x + s * 0.75;
    for (let z = -12; z <= 14; z += 2.7) box(scene, 0.1, 10, 0.1, rackMat, rx, 6.2, z);
    for (let lv = 0; lv < 6; lv++) { box(scene, 0.12, 0.12, 27, beamMat, rx, 1.2 + lv * 1.75 + 0.1, 1);
      if (lv > 0) for (let z = -11; z <= 13; z += 2.7) if (((r * 7 + lv * 3 + z) | 0) % 3) palletLoad(scene, rx, 1.2 + lv * 1.75 + 0.16, z + 0.65, [C.card, 0x9db6cf, 0xd9c38f][(lv + r) % 3], 1.1).rotation.y = Math.PI / 2; } } }
  // pick module (X 0..22): flow racks + mezzanine decks + takeaway conveyors
  for (const deck of [6.2, 9.7]) { const d = box(scene, 22, 0.2, 26, M(0x8f969f), 11, deck, 3); d.material.transparent = true; d.material.opacity = 0.35; }
  for (let a = 0; a < 4; a++) { const x = 2.5 + a * 5.5; for (const s of [-1, 1]) for (const tier of [1.2, 6.3]) { const fr = box(scene, 1.2, 2.2, 22, M(0x9aa5b1), x + s * 1.6, tier + 1.1, 3);
      for (let z = -7; z <= 13; z += 1.4) box(scene, 0.5, 0.4, 0.55, C.card, x + s * 1.1, tier + 0.9 + ((z * 3) % 2) * 0.6, z); }
    box(scene, 0.7, 0.15, 24, C.dark, x, 2.0, 3); }
  // sorter: elevated belt X 20..48 at +5 m (stand-in; sorter.READY not present)
  box(scene, 28, 0.35, 1.4, C.dark, 34, 6.0, -16.5); box(scene, 28, 0.08, 1.2, 0x56606c, 34, 6.2, -16.5);
  for (let x = 21; x <= 47; x += 3) { box(scene, 0.15, 4.8, 0.15, C.steel, x, 3.6, -15.9); box(scene, 0.15, 4.8, 0.15, C.steel, x, 3.6, -17.1); }
  for (let i = 0; i < 6; i++) { const ch = box(scene, 1.1, 0.2, 4, C.steel, 24 + i * 4, 4.6, -19.2); ch.rotation.x = -0.45; }
  const cases = []; for (let i = 0; i < 9; i++) { const c = box(scene, 0.6, 0.4, 0.5, C.card, 20 + i * 3, 6.45, -16.5); cases.push(c); }
  const sortT = new THREE.Group(); scene.add(sortT); T.sorter = sortT;
  movers.push((t) => { cases.forEach((c, i) => { c.position.x = 20.5 + ((i * 3 + t * 2.4) % 27); }); sortT.position.set(30 + 3 * Math.sin(t * 0.3), 6.2, -16.5); });
  // gate: booth + barrier + truck
  box(scene, 3, 3, 3, C.white, 104, 1.5, 70); box(scene, 3.2, 0.3, 3.2, C.blue, 104, 3.1, 70); box(scene, 6, 0.15, 0.15, C.red, 100, 1.1, 66);
  const gt = semi(13); gt.position.set(99, 0, 74); scene.add(gt); T.gate = gt; movers.push((t) => { gt.position.z = 76 - 3 * (0.5 + 0.5 * Math.sin(t * 0.25)); });
  // yard: slots + tractor pulling a trailer along X
  for (let i = 0; i < 6; i++) { const tr = semi(13); tr.children.slice(-1)[0].visible = false; tr.position.set(10 + i * 4.5, 0, 82); scene.add(tr); }
  const yt = new THREE.Group(); const ytr = yardTractor(); yt.add(ytr); const ytl = semi(13); ytl.children.slice(-1)[0].visible = false; ytl.position.z = -8.5; yt.add(ytl); yt.rotation.y = Math.PI / 2; yt.position.set(40, 0, 66); scene.add(yt); T.yard = ytr;
  movers.push((t) => { yt.position.x = 40 + 6 * Math.sin(t * 0.2); });
  // receiving: trailer at DR-004 (X -28) + forklift unloading
  const rt = semi(13); rt.position.set(-28, 0.2, 39.2); rt.rotation.y = 0; scene.add(rt);
  const rf = forklift(); rf.position.set(-28, 1.2, 26); scene.add(rf); T.receiving = rf; movers.push((t) => { rf.position.z = 26 + 2.5 * Math.sin(t * 0.5); rf.rotation.y = Math.PI; });
  for (let i = 0; i < 4; i++) palletLoad(scene, -30.5, 1.2, 25 - i * 1.4);
  // reserve: reach truck in aisle between rows 3 & 4 (X ~ -26)
  const rr = reachTruck(); rr.position.set(-27.1, 1.2, 0); rr.rotation.y = Math.PI / 2; scene.add(rr); T.reserve = rr;
  movers.push((t) => { rr.position.z = 4 * Math.sin(t * 0.25); rr.userData.carriage.position.y = 2.6 + 2.0 * (0.5 + 0.5 * Math.sin(t * 0.6)); });
  // cross-dock: forklift going north along X -2.5
  const xf = forklift(); xf.position.set(-2.5, 1.2, 0); xf.rotation.y = Math.PI; scene.add(xf); T.crossdock = xf; movers.push((t) => { xf.position.z = -1 + 7 * Math.sin(t * 0.2); xf.rotation.y = Math.cos(t * 0.2) > 0 ? 0 : Math.PI; });
  // replen: reach truck behind the flow racks (X ~3)
  const rp = reachTruck(); rp.position.set(-1.2, 1.2, 4); rp.rotation.y = Math.PI / 2; scene.add(rp); T.replen = rp;
  movers.push((t) => { rp.position.z = 4 + 3 * Math.sin(t * 0.3); rp.userData.carriage.position.y = 2.2 + 1.2 * (0.5 + 0.5 * Math.sin(t * 0.5)); });
  // pick: order filler in pick aisle X 8 walking + takeaway case
  const pk = person(); pk.position.set(8, 1.2, 4); scene.add(pk); T.pick = pk; movers.push((t) => { pk.position.z = 4 + 3 * Math.sin(t * 0.35); pk.rotation.y = Math.cos(t * 0.35) > 0 ? 0 : Math.PI; });
  // wrap: wrapper.js station + stand-in operator at the control panel
  const w = Wrapper.create(sceneAdd, { position: [32, 1.2, -24], rotationY: 0 });
  const op = person(); w.root.add(op); op.position.set(1.62, 0, 0.66); op.rotation.y = Math.PI;
  const wrapT = new THREE.Group(); w.root.add(wrapT); T.wrap = wrapT; // turntable centre
  const pal = new THREE.Group(); scene.add(pal); box(pal, 1.2, 0.14, 1.0, 0xb08a5a, 0, 0.07, 0); box(pal, 1.15, 1.4, 0.95, C.card, 0, 0.84, 0);
  pal.position.copy(w.getTurntableWorld(new THREE.Vector3()));
  const loop = () => w.wrap(pal).then(loop).catch(() => {}); loop();
  movers.push((t, dt) => Wrapper.update(dt));
  // shipping: trailer at DS-104 (X -12) + pallet jack + loader
  const st = semi(13); st.position.set(-12, 0.2, -39.2); st.rotation.y = Math.PI; scene.add(st);
  const sj = forklift(); sj.position.set(-10, 1.2, -26); scene.add(sj); T.shipping = sj; movers.push((t) => { sj.position.z = -25 - 2.5 * (0.5 + 0.5 * Math.sin(t * 0.5)); sj.position.x = -10 - 2 * (0.5 + 0.5 * Math.sin(t * 0.5)); });
  for (let i = 0; i < 5; i++) palletLoad(scene, -8, 1.2, -20 - i * 1.4, 0x9db6cf);
  // depart: loaded trailer leaving east along the north court
  const dp = semi(13); dp.rotation.y = Math.PI / 2; dp.position.set(40, 0, -55); scene.add(dp); T.depart = dp; movers.push((t) => { dp.position.x = 40 + 8 * Math.sin(t * 0.12); });
  return { blockers, targets: T, update: (t, dt) => movers.forEach((f) => f(t, dt)), wrapper: w };
}
