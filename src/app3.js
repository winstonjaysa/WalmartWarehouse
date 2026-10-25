// ====================================================================== INTERIOR: racks, stored pallets, conveyors
const racks = new THREE.Group(); world.add(racks);
const RACK_ROWS = []; AISLES.forEach((a) => { RACK_ROWS.push({ x: a.x - 2.15, face: +1, aisle: a }); RACK_ROWS.push({ x: a.x + 2.15, face: -1, aisle: a }); });
{
  const parts = getRackBayParts({ levels: RACK_LV.slice(1), height: RACK_H, width: BAY_W, depth: 1.1, fill: false });
  const n = RACK_ROWS.length * BAYS, m = new THREE.Matrix4(), q = new THREE.Quaternion();
  for (const p of parts) {
    const im = new THREE.InstancedMesh(p.geometry, p.material, n); let i = 0;
    for (const r of RACK_ROWS) for (let b = 0; b < BAYS; b++) { q.setFromAxisAngle(V3(0, 1, 0), r.face * Math.PI / 2); m.compose(V3(sx(r.x), FLOOR, sz(bayY(b))), q, V3(1, 1, 1)); im.setMatrixAt(i++, m); }
    im.castShadow = im.receiveShadow = !p.material.transparent; racks.add(im);
  }
}
// Stored pallets: cheap instanced (pallet base + wrapped load), slot-tracked
const SLOTS = []; // single source of truth: every rack slot, exact world seat (X, Y = beam top, Z); state empty|reserved|occupied
const LVL = 'ABCDEF', LOC = new Map(); // LOC: every addressable location id -> {id, kind, X, Y, Z, ...}
RACK_ROWS.forEach((r, ri) => { for (let b = 0; b < BAYS; b++) for (let lv = 0; lv < 6; lv++) for (let p = 0; p < 2; p++) {
  const y = bayY(b) + (p ? 1 : -1) * (BAY_W / 4 + 0.02), bayNo = 2 * b + (r.face > 0 ? 1 : 2); // odd = west face, 001 at south end
  const sl = { id: `${r.aisle.id}-${String(bayNo).padStart(3, '0')}-${LVL[lv]}-${p + 1}`, kind: 'rack', row: r, aisle: r.aisle, bay: b, lv, x: r.x, y, X: sx(r.x), Z: sz(y), Y: FLOOR + RACK_LV[lv] + (lv ? 0.004 : 0), face: r.face, state: 'empty', occ: false, sku: null, res: null, pal: null };
  SLOTS.push(sl); LOC.set(sl.id, sl);
} });
const SLOT_RE = /^\d{2}-\d{3}-[A-H]-\d$/; if (SLOTS.some((s) => !SLOT_RE.test(s.id)) || LOC.size !== SLOTS.length) console.error('[slot-assert] rack slot ids not unique / not AA-BBB-L-P');
const palBase = getPalletGeometry('pine');
const loadGeo = rbox(1.0, 1.0, 1.2, 0.06, 2); loadGeo.translate(0, 0.5, 0); // origin at load base -> y-scale keeps it seated on the deck
const loadMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55 });
const imBase = new THREE.InstancedMesh(palBase.geometry, palBase.material, SLOTS.length), imLoad = new THREE.InstancedMesh(loadGeo, loadMat, SLOTS.length);
[imBase, imLoad].forEach((im) => { im.castShadow = im.receiveShadow = true; racks.add(im); });
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _c = new THREE.Color();
const LOAD_COLS = [0xc9a170, 0xd3b17f, 0xbf9363, 0xe6edf3, 0x2f6fb8, 0xd9c29a];
function setSlot(sl, occ, sku) {
  if (typeof RC !== 'undefined' && RC) { try { RC.setSlot(sl.id, !!occ && !sl.dyn); } catch (e) { /* keep sim going */ } }
  const i = SLOTS.indexOf(sl); sl.occ = occ; sl.state = occ ? 'occupied' : 'empty'; sl.sku = occ ? sku : null;
  const hh = occ ? (sl.lv === 5 ? 1.0 : 0.8 + ((i * 7) % 5) * 0.08) : 0;
  _q.setFromAxisAngle(V3(0, 1, 0), Math.PI / 2);
  _m.compose(V3(sl.X, sl.Y, sl.Z), _q, _s.set(occ ? 1 : 0, occ ? 1 : 0, occ ? 1 : 0)); imBase.setMatrixAt(i, _m);
  _m.compose(V3(sl.X, sl.Y + PALLET.h, sl.Z), _q, _s.set(occ ? 1 : 0, occ ? hh : 0, occ ? 1 : 0)); imLoad.setMatrixAt(i, _m);
  imLoad.setColorAt(i, _c.set(LOAD_COLS[(i * 13) % LOAD_COLS.length]));
  imBase.instanceMatrix.needsUpdate = imLoad.instanceMatrix.needsUpdate = true; if (imLoad.instanceColor) imLoad.instanceColor.needsUpdate = true;
}
SLOTS.forEach((s, i) => setSlot(s, rnd() < 0.78, 'SKU-' + (100000 + Math.floor(rnd() * 899999))));
imLoad.visible = false; // loads are individual cartons (below), not single blocks
imBase.computeBoundingSphere();
// ---------- cartons: every stored load is stacked cases (kraft with tape seams, some printed blue, some stretch-wrapped)
const cartonTex = canvasTexture(128, 128, (ctx, W, H) => {
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 300; i++) { ctx.fillStyle = `rgba(120,90,50,${0.03 + Math.random() * 0.04})`; ctx.fillRect(Math.random() * W, Math.random() * H, 2, 6); }
  ctx.fillStyle = 'rgba(255,248,225,0.95)'; ctx.fillRect(W / 2 - 9, 0, 18, H);          // tape seam
  ctx.strokeStyle = 'rgba(70,50,30,0.55)'; ctx.lineWidth = 4; ctx.strokeRect(2, 2, W - 4, H - 4); // box edges
  ctx.fillStyle = '#ffffff'; ctx.fillRect(12, 84, 36, 26); ctx.fillStyle = '#333'; for (let k = 0; k < 4; k++) ctx.fillRect(15, 88 + k * 5, 28 - k * 4, 2); // shipping label
}, { repeat: false });
const CW = 0.4, CD = 0.5, CH = 0.26, cartonGeo = new THREE.BoxGeometry(CW - 0.012, CH - 0.006, CD - 0.012); cartonGeo.translate(0, CH / 2, 0);
const cartonMat = new THREE.MeshStandardMaterial({ map: cartonTex, roughness: 0.85 });
const CARTON_COLS = [0xc49a64, 0xb98c57, 0xd1a874, 0xc7a06b, 0xbf9566], BLUE_CASE = 0x2a6ab4;
const cartonList = [], wrapList = [];
SLOTS.forEach((sl, i) => { if (!sl.occ) return; let r = (i * 9301 + 49297) % 233280 / 233280; const nxt = () => (r = (r * 9301 + 49297) % 233280 / 233280);
  const layers = 3 + Math.floor(nxt() * 2.99), blue = nxt() < 0.18, tone = CARTON_COLS[Math.floor(nxt() * CARTON_COLS.length)];
  for (let l = 0; l < layers; l++) for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) {
    if (l === layers - 1 && nxt() < 0.3) continue;
    cartonList.push([sl.X + (a - 1) * CW, sl.Y + PALLET.h + l * CH, sl.Z + (b - 0.5) * CD, blue && nxt() < 0.85 ? BLUE_CASE : tone, (nxt() - 0.5) * 0.04]); }
  if (nxt() < 0.4) wrapList.push([sl.X, sl.Y + PALLET.h, sl.Z, layers * CH]); });
const imCartons = new THREE.InstancedMesh(cartonGeo, cartonMat, cartonList.length);
cartonList.forEach(([x, y, z, c, yaw], k) => { _q.setFromAxisAngle(V3(0, 1, 0), yaw); _m.compose(V3(x, y, z), _q, _s.set(1, 1, 1)); imCartons.setMatrixAt(k, _m); imCartons.setColorAt(k, _c.set(c)); });
imCartons.castShadow = !LOW; imCartons.receiveShadow = true; imCartons.computeBoundingSphere(); racks.add(imCartons);
const wrapGeo = new THREE.BoxGeometry(1.24, 1, 1.03); wrapGeo.translate(0, 0.5, 0);
const imWrap = new THREE.InstancedMesh(wrapGeo, new THREE.MeshStandardMaterial({ color: 0xe8f2fb, transparent: true, opacity: 0.28, roughness: 0.15, depthWrite: false }), wrapList.length);
wrapList.forEach(([x, y, z, h], k) => { _m.compose(V3(x, y, z), _q.identity(), _s.set(1, h + 0.02, 1)); imWrap.setMatrixAt(k, _m); }); imWrap.computeBoundingSphere(); racks.add(imWrap);
let RC = null; // Inky rackCartons (instanced pallets + cartons + wrap); falls back to the built-in instancing
if (RACKC && !QS.has('norc')) { try {
  RC = RACKC.create({ scene: racks, quality: LOW ? 'low' : Q, slots: SLOTS.map((sl, i) => ({ id: sl.id, position: V3(sl.X, sl.Y, sl.Z), rotY: 0, w: 1.2, d: 1.0, h: sl.lv === 5 ? 1.15 : 1.45, seed: i, occupied: !!sl.occ && !sl.dyn })) });
  if (RC.group && !RC.group.parent) racks.add(RC.group);
  imBase.visible = false; imCartons.visible = false; imWrap.visible = false;
  console.info('[gf] rackCartons', JSON.stringify(RC.stats()));
} catch (e) { console.warn('[gf] rackCartons.js skipped:', e && e.message); RC = null; imBase.visible = true; imCartons.visible = true; imWrap.visible = true; } }
console.info('[gf] rack cartons', cartonList.length, 'slots occupied', SLOTS.filter((s) => s.occ).length, '/', SLOTS.length);
// stage-lane pallets (FIFO) inbound side: dynamic pallet objects
const LANES = {};
IN_DOORS.forEach((d) => { LANES[d.id] = { id: 'STG-' + d.id.replace('-', '') + '-1', x: d.x + 2, slots: [9.0, 7.6, 6.2, 4.8].map((y, k) => ({ id: `STG-${d.id.replace('-', '')}-1:${k + 1}`, y, state: 'empty', res: null, pal: null })), busy: null };
  for (const sl of LANES[d.id].slots) LOC.set(sl.id, { id: sl.id, kind: 'stage', X: sx(d.x + 2), Y: FLOOR, Z: sz(sl.y), slot: sl }); });
IN_DOORS.forEach((d) => LOC.set(d.id, { id: d.id, kind: 'door', X: sx(d.x), Y: FLOOR, Z: sz(0) }));
OUT_DOORS.forEach((d) => LOC.set(d.id, { id: d.id, kind: 'door', X: sx(d.x), Y: FLOOR, Z: sz(62) }));
function makePalletObj(seed) { const p = createPallet({ variant: 'pine', seed, maxHeight: 1.1, wrap: true }); shadowAll(p); return p; }
// conveyors (pick module takeaway + sorter loop elevated on NXA) – visual belts with UV scroll
const belts = [];
function conveyorRun(x0, y0, x1, y1, h) {
  const L = Math.hypot(x1 - x0, y1 - y0), c = createConveyor({ length: L, height: h, width: 0.8 });
  c.position.set(sx((x0 + x1) / 2), FLOOR, sz((y0 + y1) / 2)); c.rotation.y = Math.atan2(x1 - x0, -(y1 - y0)); shadowAll(c); world.add(c); belts.push(c); return c;
}
conveyorRun(74, 16, 74, 44, 0.85); conveyorRun(80, 44, 96, 44, 0.85);
conveyorRun(52, 16, 52, 44, 0.85); conveyorRun(70, 16, 70, 44, 0.85);
// pick module: 3-tier steel mezzanine (L1 / L2 +5.0 / MEZZ +8.5)
{ const steel = M(0x5f87b5, { r: 0.6 }), deck = M(0xc9ced6, { r: 0.8 }), rail = M(0xffc220, { r: 0.6 });
  for (const h of [5.0, 8.5]) { box(18, 0.18, 28, deck, sx(61), FLOOR + h, sz(30), world); box(18, 0.06, 0.06, rail, sx(61), FLOOR + h + 1.05, sz(16.05), world); box(18, 0.06, 0.06, rail, sx(61), FLOOR + h + 1.05, sz(43.95), world); }
  for (let x = 52.5; x <= 69.6; x += 4.25) for (let y = 16.2; y <= 44; y += 4.6) box(0.2, 8.5, 0.2, steel, sx(x), FLOOR + 4.25, sz(y), world);
  // flow rack faces on L1
  const fr = getRackBayParts({ levels: [1.2, 2.4], height: 3.4, width: 2.7, depth: 1.4, fill: true, seed: 5 });
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(); const pts = [];
  for (const x of [57, 65]) for (let b = 0; b < 9; b++) for (const f of [1, -1]) pts.push([x + f * 1.9, 17.6 + b * 2.9, f]);
  for (const p of fr) { const im = new THREE.InstancedMesh(p.geometry, p.material, pts.length); pts.forEach(([x, y, f], i) => { q.setFromAxisAngle(V3(0, 1, 0), f * Math.PI / 2); m.compose(V3(sx(x), FLOOR, sz(y)), q, V3(1, 1, 1)); im.setMatrixAt(i, m); }); im.castShadow = im.receiveShadow = true; world.add(im); }
}
// sorter loop SRT1 (elevated +5 over NXA) as a tube + cases
const __ws0 = world.children.length;
const sorterCurve = new THREE.CatmullRomCurve3([V3(sx(22), 0, sz(46.5)), V3(sx(96), 0, sz(46.5)), V3(sx(97.5), 0, sz(47.5)), V3(sx(96), 0, sz(48.5)), V3(sx(22), 0, sz(48.5)), V3(sx(20.5), 0, sz(47.5))], true, 'catmullrom', 0.2);
{ const sh = new THREE.Shape(); sh.moveTo(-0.45, -0.12); sh.lineTo(0.45, -0.12); sh.lineTo(0.45, 0.12); sh.lineTo(-0.45, 0.12); sh.closePath();
  const pts = sorterCurve.getSpacedPoints(400).map((p) => p.clone().setY(FLOOR + 5.0));
  const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 600, 0.42, 4, true), M(0x2b3039, { r: 0.5 })); tube.scale.y = 1; tube.castShadow = true; world.add(tube);
  for (let i = 0; i < 40; i++) { const p = sorterCurve.getPointAt(i / 40); box(0.12, 5.0, 0.12, M(0x8a94a3), p.x, FLOOR + 2.5, p.z, world); } }
const caseGeo = new THREE.BoxGeometry(0.5, 0.32, 0.4), caseMat = cartonMat;
const NCASE = LOW ? 30 : 90, cases = new THREE.InstancedMesh(caseGeo, caseMat, NCASE); cases.castShadow = true; world.add(cases);
const OLD_SORT = world.children.slice(__ws0);
let SRT = null, __srtT = 0, __srtN = 0; // Cooker sorter.js (sliding-shoe loop) replaces the tube stand-in when it builds cleanly
if (SORTERM && !QS.has('nosorter')) { try {
  SRT = SORTERM.create(world, { position: [sx(59), FLOOR, sz(47.5)], rotation: 0, lanes: 8, speed: 1.8, straight: 72, turnRadius: 1.0, laneLength: 3, elevation: 5.0 });
  OLD_SORT.forEach((o) => { o.visible = false; });
  SRT.onCaseArrived((mesh) => { if (mesh.parent) mesh.parent.remove(mesh); });
  console.info('[gf] sorter.js SRT1 built');
} catch (e) { console.warn('[gf] sorter.js skipped:', e && e.message); try { if (SRT && SRT.group) SRT.group.removeFromParent(); } catch (_) {} SRT = null; OLD_SORT.forEach((o) => { o.visible = true; }); } }
const __srtGeo = new THREE.BoxGeometry(0.5, 0.32, 0.4), __srtCols = [0xc9a170, 0xd8b483, 0x2f6fb8, 0xbf9363].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 }));
function sorterTick(dt) {
  if (!SRT) return;
  __srtT += dt; if (__srtT > (LOW ? 1.6 : 0.9)) { __srtT = 0; const m = new THREE.Mesh(__srtGeo, __srtCols[__srtN % 4]); m.castShadow = !LOW; SRT.addCase(m, __srtN % 8); __srtN++; }
  SRT.update(dt);
}
const caseU = Array.from({ length: NCASE }, (_, i) => i / NCASE + rnd() * 0.004);
for (let i = 0; i < NCASE; i++) cases.setColorAt(i, _c.set(pick([0xc9a170, 0xd8b483, 0x2f6fb8, 0x1f2833])));
function updateCases(dt) {
  const v = 1.8 / sorterCurve.getLength();
  for (let i = 0; i < NCASE; i++) { caseU[i] = (caseU[i] + v * dt) % 1; const p = sorterCurve.getPointAt(caseU[i]), t = sorterCurve.getTangentAt(caseU[i]);
    _q.setFromAxisAngle(V3(0, 1, 0), Math.atan2(t.x, t.z)); _m.compose(V3(p.x, FLOOR + 5.0 + 0.12 + 0.16, p.z), _q, _s.set(1, 1, 1)); cases.setMatrixAt(i, _m); }
  cases.instanceMatrix.needsUpdate = true;
  for (const b of belts) { const bt = b.userData.parts && b.userData.parts.belt; if (bt && bt.material.map) bt.material.map.offset.y -= dt * 0.9; }
}
