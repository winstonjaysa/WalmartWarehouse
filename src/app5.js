const PALS = [];
// ====================================================================== SCENARIO + LOOP
const COUNTS = { received: 0, putaway: 0, shipped: 0, trucksIn: 0, trucksOut: 0 };
const UIX = window.UI || null;
const log = (src, ent, msg, level = 'info') => { const ts = simClock(); if (UIX) UIX.pushLog({ ts, level, source: src, entity: ent, msg }); };
function simClock() { const t = 6 * 3600 + 12 * 60 + SIMT; const h = Math.floor(t / 3600) % 24, m = Math.floor(t / 60) % 60, s = Math.floor(t) % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`; }
const DOCK_Z = BD / 2 + 0.4;   // trailer rear at dock bumper face
const TRL_REAR = -10.8;
function trailerPose(doorX, side = 1) { return { X: doorX, Z: side * (DOCK_Z - TRL_REAR), th: side > 0 ? 0 : Math.PI }; }
// ---------- docked trailers (initial state: already at doors, restraint engaged, doors up)
const docked = {};
const TRL_ROWS = 11; // 22 pallet positions, two wide
function trlPos(k) { return new THREE.Vector3(k % 2 ? 0.56 : -0.56, 1.30, -9.95 + Math.floor(k / 2) * 1.3); }
function dockedSemi(id, door, side, fill) {
  const d = (side > 0 ? IN_DOORS : OUT_DOORS).find((q) => q.id === door), X = sx(d.x);
  const p = trailerPose(X, side), kx = p.X + Math.sin(p.th) * (KP + 0) , kz = p.Z;
  const v = makeSemi(id, X + Math.sin(p.th) * KP * 0, p.Z + Math.cos(p.th) * KP, p.th);
  v.tth = p.th; v.door = door; v.pallets = []; docked[door] = v;
  const tl = v.P.trailer; if (v.P.rearDoors) { v.P.rearDoors.left.rotation.y = 3 * Math.PI / 2 * 0.98; v.P.rearDoors.right.rotation.y = -3 * Math.PI / 2 * 0.98; }
  doorPanels[door].userData.target = 1;
  for (let k0 = 0; k0 < fill; k0++) { const k = side > 0 ? k0 : TRL_ROWS * 2 - 1 - k0; const pal = makePalletObj(100 + k + door.length * 7); pal.position.set((k % 2 ? 0.56 : -0.56), 1.30 - 0.0, -9.95 + Math.floor(k / 2) * 1.3); pal.userData.k = k; tl.add(pal); trackPal(pal); pal.userData.loc = `${id}/P${String(k + 1).padStart(2, '0')}`; v.pallets.push(pal); }
  placeVehicle(v, 1); v.obj.updateMatrixWorld(true);
  return v;
}
// Kingpin position of a docked trailer: trailer origin pos = K - rot*(0,0,KP); trailer origin at rear+10.8 => K = rear + 10.8 + 4.9
const T1 = dockedSemi('TRL-48213', 'DR-005', 1, 10);
const T2 = dockedSemi('TRL-50177', 'DR-002', 1, 6);
const T3 = dockedSemi('TRL-71540', 'DS-103', -1, 4);
const T4 = dockedSemi('TRL-53390', 'DR-007', 1, 10);
const T5 = dockedSemi('TRL-66102', 'DS-105', -1, 0);
// ---------- inbound truck arriving through the gate and backing into DR-003
const ARR = makeSemi('TRL-50311', 100, 92, Math.PI, { vmax: 7 });
ARR.state = 'Arriving'; ARR.task = 'Gate → DR-003';
{
  const dX = sx(IN_DOORS[2].x);
  ARR.drive(100, 72, Math.PI, 1, { label: 'Gate check-in', vmax: 4 })
    .do((v) => { v.state = 'At gate'; world.userData.gate.userData.arm.rotation.x = 0; log('GATE', v.id, 'Checked in at gatehouse · seal 7731042 verified'); })
    .wait(4).do((v) => { v.gateOpen = 1; v.state = 'Moving to door'; })
    .drive(dX + 26.8 + 6, 51, Math.PI / 2 + Math.PI, 1, { label: 'Court approach', vmax: 5 })
    .drive(dX + 26.8, 51, -Math.PI / 2, 1, { vmax: 2.5 })
    .do((v) => { v.state = 'Reversing to DR-003'; log('YARD', v.id, 'Reversing to DR-003'); });
  semiReverse(ARR, dX, DOCK_Z - TRL_REAR + (-8.9 + 10.8) , 0, 'Reverse to DR-003');
  ARR.do((v) => { v.state = 'Docked'; COUNTS.trucksIn++; log('DOCK', 'DR-003', `${v.id} docked · restraint engaged`, 'success'); doorPanels['DR-003'].userData.target = 1; UIX && UIX.showToast('TRL-50311 docked at DR-003 · door opening', 'success', { title: 'Dock event', duration: 4000 }); });
}
// ---------- forklift FK-07 unloading TRL-48213 at DR-005 into lane STG-DR005-1
const D5 = IN_DOORS[4], X5 = sx(D5.x), LANE5 = LANES['DR-005'];
function deckYAt(Z) { const a = Math.abs(Z); return a > BD / 2 + 0.2 ? 1.30 : FLOOR + (a > BD / 2 - 0.4 ? (a - (BD / 2 - 0.4)) / 0.6 * (1.30 - FLOOR) : 0); }
// ---------- slot-exact handling: fork heights are computed from the target seat, never hardcoded
const TINE = 0.048, DECK_UNDER = 0.122, ENTRY = 0.080, CLEAR = 0.10, TRAVEL = 0.20; // TRAVEL: tine top above floor while driving loaded (B26: <= 0.3 m) // tine top above fork heel; pallet top-deck underside; pocket entry; lift-off
const _w = new THREE.Vector3(), ASSERT = { ok: 0, fail: 0, jumps: 0 };
function syncPose(fk) { const rz = fk.refZ || 0; fk.obj.position.set(fk.x - Math.sin(fk.th) * rz, deckYAt(fk.z), fk.z - Math.cos(fk.th) * rz); fk.obj.rotation.set(0, fk.th, 0); fk.obj.updateMatrixWorld(true); }
function carriageOf(fk) { const P = fk.obj.userData.parts; return P.carriage || P.liftFrame || P.forks[0].parent; }
function tineTopY(fk) { syncPose(fk); carriageOf(fk).getWorldPosition(_w); return _w.y + (fk.tine ?? TINE); }
// mast height that puts the tine top at world y once the truck stands at Z
function hFor(fk, y, atZ = fk.z) { return fk.obj.userData.getForkHeight() + (y - (tineTopY(fk) + deckYAt(atZ) - deckYAt(fk.z))); }
// fixed-axle centre -> pallet centre when the pallet sits fully on the forks (heel contact + 2 cm)
function reachD(fk) { syncPose(fk); carriageOf(fk).getWorldPosition(_w); return (_w.x - fk.x) * Math.sin(fk.th) + (_w.z - fk.z) * Math.cos(fk.th) + (fk.heel ?? 0) + PALLET.d / 2 + 0.02; }
function palY(pal) { syncAll(); pal.getWorldPosition(_w); return _w.y; }
function syncAll() { for (const v of VEH) if (!v.isSemi) syncPose(v); }
function slotAssert(kind, fk, pal, loc) {
  syncPose(fk); pal.updateMatrixWorld(true); const seat = tineTopY(fk) - DECK_UNDER; pal.getWorldPosition(_w); // B23/B24: read the pallet AFTER tineTopY (shared temp vector)
  const dy = Math.abs(seat - loc.Y), dxz = Math.hypot(_w.x - loc.X, _w.z - loc.Z), dp = Math.abs(_w.y - loc.Y);
  if (dy > 0.02 || dxz > 0.02 || dp > 0.02) { ASSERT.fail++; console.warn(`[ASSERT] fork-to-slot FAIL ${kind} ${fk.id} @ ${loc.id}: fork-seat dy=${(dy * 100).toFixed(1)}cm pallet dxz=${(dxz * 100).toFixed(1)}cm dy=${(dp * 100).toFixed(1)}cm`); }
  else { ASSERT.ok++; console.info(`[ASSERT] fork-to-slot ok ${kind} ${fk.id} @ ${loc.id}: seat err ${(dy * 100).toFixed(2)} cm, xz err ${(dxz * 100).toFixed(2)} cm`); }
}
// every physical pallet entity is tracked; a world-position jump > 5 cm per 1/60 s is an error
// PALS declared at top of app5
function trackPal(p) { p.userData.lpn = p.userData.lpn || 'LPN-00' + (100345 + PALS.length); PALS.push(p); p.userData.lp = null; return p; }
function checkJumps(simDt) {
  const lim = 0.05 * Math.max(1, Math.round(simDt / STEP));
  for (const p of PALS) { p.updateMatrixWorld(true); p.getWorldPosition(_w); const l = p.userData.lp;
    if (l && l.distanceTo(_w) > lim) { ASSERT.jumps++; console.warn(`[ASSERT] pallet jump ${p.userData.lpn} ${(l.distanceTo(_w) * 100).toFixed(1)}cm in one frame`); }
    (p.userData.lp ||= new THREE.Vector3()).copy(_w); }
}
// reservation locks (lane / P&D / wrapper): a vehicle queues until(free) then owns the key
const LOCKS = {};
function lockQ(v, key) { return v.until(() => !LOCKS[key] || LOCKS[key] === v.id, 'Waiting for ' + key).do(() => { LOCKS[key] = v.id; }); }
function unlockQ(v, key) { return v.do(() => { if (LOCKS[key] === v.id) delete LOCKS[key]; }); }
function scheduleUnload(fk, trl, lane, doorX) {
  const next = trl.pallets.find((p) => !p.userData.taken);
  if (!next) { fk.state = 'Idle'; fk.task = 'Trailer empty'; return; }
  // FL enters from the south: deepest reachable empty slot = lowest k in the contiguous empty run from k=3
  let si = -1; for (let k = lane.slots.length - 1; k >= 0 && lane.slots[k].state === 'empty'; k--) si = k; if (si < 0) { fk.wait(2).do(() => scheduleUnload(fk, trl, lane, doorX)); return; }
  if (!lane.slots.some((s) => s.state !== 'empty') && false) {}
  const slot = lane.slots[si]; next.userData.taken = true; slot.state = 'reserved'; slot.res = fk.id;
  const wp = new THREE.Vector3(); if (trl.isSemi) placeVehicle(trl, 1); trl.obj.updateMatrixWorld(true); next.getWorldPosition(wp); // B23: trailer must be posed before reading its pallets
  const src = { id: next.userData.loc, X: wp.x, Y: wp.y, Z: wp.z }, lx = sx(lane.x), EZ = sz(2.2), diam = lx - wp.x, RD = reachD(fk);
  const dst = LOC.get(slot.id);
  fk.state = 'Unloading'; fk.task = `${src.id} → ${slot.id}`;
  if (Math.abs(fk.x - wp.x) > 0.01 || Math.abs(Math.sin(fk.th)) > 0.01 || Math.cos(fk.th) < 0) fk.drive(wp.x, EZ, 0, 1, { label: 'U-turn to trailer', vmax: 1.1, R: Math.max(1.5, diam / 2) });
  fk.liftTo((f) => hFor(f, src.Y + ENTRY, wp.z - RD))
    .drive(wp.x, wp.z - RD - 1.0, 0, 1, { label: 'Into trailer', vmax: 1.3, lead: 0.6 })
    .drive(wp.x, wp.z - RD, 0, 1, { label: 'Creep into pallet pockets', vmax: 0.6 })
    .liftTo((f) => hFor(f, src.Y + DECK_UNDER))
    .do(() => { slotAssert('pickup', fk, next, src); carriageOf(fk).attach(next); fk.carry = next; fk.state = 'Picking'; next.userData.loc = fk.id; })
    .liftTo((f) => f.obj.userData.getForkHeight() + CLEAR).tilt(0.05)
    .drive(wp.x, EZ, 0, -1, { label: 'Reverse out of trailer', vmax: 0.9, lead: 0 })
    .liftTo((f) => hFor(f, FLOOR + TRAVEL, f.z))
    .drive(lx, EZ, Math.PI, -1, { label: 'Reverse turn', vmax: 1.3, R: Math.max(1.5, diam / 2) });
  lockQ(fk, lane.id).drive(lx, dst.Z + RD, Math.PI, 1, { label: 'To ' + slot.id, vmax: 1.4 })
    .tilt(0)
    .liftTo((f) => hFor(f, dst.Y + DECK_UNDER, f.z))
    .do(() => { slotAssert('drop', fk, next, dst); world.attach(next); slot.state = 'occupied'; slot.pal = next; slot.res = null; next.userData.loc = slot.id; COUNTS.received++; fk.carry = null; fk.state = 'Staged';
      flashScan(next); log('RCV', fk.id, `${next.userData.lpn} staged at ${slot.id}`, 'info'); })
    .liftTo((f) => hFor(f, dst.Y + ENTRY))
    .drive(lx, EZ, Math.PI, -1, { label: 'Back out', vmax: 1.1, lead: 0 });
  unlockQ(fk, lane.id).liftTo((f) => hFor(f, FLOOR + TRAVEL - 0.08))
    .do(() => scheduleUnload(fk, trl, lane, doorX));
}
function trailerMouth(trl) { const p = trl.pallets.find((q) => !q.userData.taken), w = new THREE.Vector3(); trl.obj.updateMatrixWorld(true); p.getWorldPosition(w); return w; }
const FK1 = (() => { const w = trailerMouth(T1), f = makeForklift('FL-07', w.x, sz(2.2), 0); f.obj.userData.setForkHeight(0.08, true); return f; })();
FK1.do(() => scheduleUnload(FK1, T1, LANE5, X5));
// scan worker beside the lane
const W1 = createWorker({}); shadowAll(W1); W1.position.set(sx(LANE5.x + 1.4), FLOOR, sz(6.5)); W1.rotation.y = -Math.PI / 2; world.add(W1);
const scanBeam = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.6, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0xff3b3b, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
scanBeam.rotation.z = Math.PI / 2; world.add(scanBeam);
function flashScan(pal) { const p = new THREE.Vector3(); pal.getWorldPosition(p); scanBeam.position.set(p.x + 1.0, FLOOR + 1.1, p.z); scanBeam.userData.t = 0.6; W1.position.z = p.z; }
// ---------- AMRs: Mode B only (?amr=1); spec Mode A default has none
const AMRS = [];
for (let i = 0; i < (QS.get('amr') === '1' ? 4 : 0); i++) { const o = createAMR({ carrying: i % 2 === 0, withPod: i % 2 === 0 }); shadowAll(o); world.add(o);
  const c = new THREE.CatmullRomCurve3([V3(sx(78), FLOOR, sz(18)), V3(sx(94), FLOOR, sz(18)), V3(sx(94), FLOOR, sz(30)), V3(sx(78), FLOOR, sz(30))], true, 'catmullrom', 0.0);
  AMRS.push({ o, c, u: i / 4, L: c.getLength() }); }
// ---------- doors animation + misc
function updateDoors(dt) { for (const id in doorPanels) { const d = doorPanels[id], u = d.userData; u.open = dampV(u.open, u.target, 1.6, dt); d.position.y = FLOOR + DOOR_H / 2 + u.open * (DOOR_H - 0.25); d.scale.y = 1 - u.open * 0.92; d.position.y = FLOOR + DOOR_H - (DOOR_H * d.scale.y) / 2; u.lamp.color.set(u.target ? 0xffb020 : 0x2ecc71); u.lamp.emissive.set(u.target ? 0xffb020 : 0x2ecc71); } }
