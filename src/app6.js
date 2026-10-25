// ====================================================================== POPULATION (app6)
// Every machine has an operator (raptor B29 operators via ud.attachOperator), every worker has a job.
// Jobs are queues of bicycle-model drive legs + fork actions; pallets move only while attached to forks.
const HD = { N: Math.PI, S: 0, E: Math.PI / 2, W: -Math.PI / 2 };
const POP = { veh: [], peds: [], movers: [], conv: [] };
const _p6 = new THREE.Vector3(), _p6b = new THREE.Vector3();
const fwdOf = (th) => [Math.sin(th), Math.cos(th)];
function fmtId(n) { return String(n).padStart(2, '0'); }
// ---------------------------------------------------------------- generic MHE (material handling equipment)
function makeMHE(id, type, obj, X, Z, th, o = {}) {
  shadowAll(obj); const ud = obj.userData, k = ud.kin, P = ud.parts;
  const v = new Vehicle({ id, type, obj, R: o.R ?? 1.2, vmax: o.vmax ?? 1.6, acc: o.acc ?? 0.8, wb: k.L, x: X, z: Z, th });
  v.refZ = k.refZ; v.dmax = k.maxSteer * 0.92; v.steerRate = o.steerRate ?? 1.6; v.Lc = o.Lc ?? Math.max(0.6, k.L * 0.7);
  v.frontWheels = []; v.rearWheels = (P.wheels || []).slice(); v.rearWheels.forEach((w) => (w.rotation.order = 'YXZ'));
  if (P.load) { P.load.removeFromParent(); P.load = null; }
  v.lift = (h) => { v.q.push({ k: 'lift', h }); return v; };
  v.tilt = (r) => { if (ud.setMastTilt) v.q.push({ k: 'tilt', r }); return v; };
  v.liftTo = (fn) => { v.q.push({ k: 'liftTo', fn }); return v; };
  v.carry = null; v.kind = o.kind || 'mast'; v.walkBehind = !!o.walkBehind;
  if (ud.attachOperator && !ud.operator) ud.attachOperator();
  if (o.baseY !== undefined) { ud.baseY = o.baseY; v.yAt = () => o.baseY; }
  POP.veh.push(v); return v;
}
// fork geometry measured from the model: tine top above the carriage origin, fork heel ahead of it
function measureForks(v, flat) {
  const o = v.obj, P = o.userData.parts, c = carriageOf(v), sp = o.position.clone(), sr = o.rotation.clone();
  o.position.set(0, 0, 0); o.rotation.set(0, 0, 0); o.updateMatrixWorld(true);
  const cw = c.getWorldPosition(new THREE.Vector3()), b = new THREE.Box3();
  if (flat) { for (const f of P.forks || []) b.expandByObject(f); v.tine = b.max.y - cw.y; v.heel = (b.min.z - cw.z) + 0.03; }
  else { v.tine = 0.051; v.heel = 0; }
  o.position.copy(sp); o.rotation.copy(sr); o.updateMatrixWorld(true);
}
// hand pallet jack: lift = hydraulic pump strokes; lower = release valve (to 0)
function jackLiftAdapter(v) {
  const ud = v.obj.userData; ud.maxForkHeight = 0.12;
  ud.getForkHeight = () => ud.lift;
  ud.setForkHeight = (h) => { if (h > ud.lift + 2e-4) ud.pump(Math.max(1, Math.ceil((h - ud.lift) / 0.03)), h - ud.lift); else if (h < ud.lift - 2e-4) ud.release(); };
  v.isJack = true;
}
// electric rider: thumb-control lift at 0.08 m/s, exact landing
function riderLiftAdapter(v) {
  const ud = v.obj.userData; let h = 0, tgt = 0; ud.maxForkHeight = 0.12;
  ud.getForkHeight = () => h; ud.setForkHeight = (x) => { tgt = clamp(x, 0, 0.12); };
  const up = ud.update; ud.update = (dt, t) => { h = Math.abs(tgt - h) < 0.08 * dt ? tgt : h + Math.sign(tgt - h) * 0.08 * dt; ud.lift = ud.liftT = h / 0.12; up(dt, t); };
}
// ---------------------------------------------------------------- pallets
let PSEED = 900;
function newPallet(variant, wrapIt = true) {
  const p = createPalletLoad({ variant: variant || pick(['full', 'full', 'half', 'cases']), seed: PSEED++, wrap: wrapIt }); shadowAll(p); trackPal(p); world.add(p); return p;
}
function placePal(p, loc, yaw = 0) { p.position.set(loc.X, loc.Y, loc.Z); p.rotation.set(0, yaw, 0); p.updateMatrixWorld(true); }
// ---------------------------------------------------------------- generic fork moves (floor/rack/trailer locations {id,X,Y,Z})
const hEntry = (v, Y) => v.isJack || v.kind === 'rider' ? 0 : hFor(v, Y + ENTRY);
const hClear = (v) => v.isJack || v.kind === 'rider' ? 0.12 : v.obj.userData.getForkHeight() + CLEAR;
const hTravel = (v) => v.isJack || v.kind === 'rider' ? (v.carry ? 0.12 : 0) : hFor(v, FLOOR + TRAVEL);
function refFor(v, loc, th) { const RD = reachD(v), [fx, fz] = fwdOf(th); return { x: loc.X - fx * RD, z: loc.Z - fz * RD }; }
// pick: assumes v is at (or will drive to) the approach pose 'AP' metres behind the engage pose
function pickAt(v, pal, loc, th, o = {}) {
  const AP = o.AP ?? 0.8, [fx, fz] = fwdOf(th); let r;
  v.do(() => { r = refFor(v, loc, th); v.task = 'Approach ' + loc.id; });
  v.do(() => { v.q.unshift({ k: 'drive', X: r.x - fx * AP, Z: r.z - fz * AP, th, gear: 1, vmax: o.vmax ?? 1.2, R: o.R, label: 'Approach ' + loc.id, lead: o.lead }); });
  v.liftTo((f) => hEntry(f, loc.Y));
  v.do(() => { v.q.unshift({ k: 'drive', X: r.x, Z: r.z, th, gear: 1, vmax: 0.5, label: 'Forks into pockets', lead: AP }); });
  v.liftTo((f) => hFor(f, loc.Y + DECK_UNDER));
  v.do(() => { slotAssert('pickup', v, pal, loc); carriageOf(v).attach(pal); v.carry = pal; pal.userData.loc = v.id; v.state = 'Picking'; o.onPick && o.onPick(); });
  v.liftTo((f) => hClear(f));
  if (!o.stay) v.do(() => { v.q.unshift({ k: 'drive', X: r.x - fx * AP, Z: r.z - fz * AP, th, gear: -1, vmax: 0.7, label: 'Back out', lead: 0 }); });
  return v;
}
function dropAt(v, loc, th, o = {}) {
  const AP = o.AP ?? 0.8, [fx, fz] = fwdOf(th); let r, pal;
  v.do(() => { r = refFor(v, loc, th); pal = v.carry; });
  if (!o.noApproach) v.do(() => { v.q.unshift({ k: 'drive', X: r.x - fx * AP, Z: r.z - fz * AP, th, gear: 1, vmax: o.vmax ?? 1.2, R: o.R, label: 'To ' + loc.id, lead: o.lead }); });
  if (!v.isJack && v.kind !== 'rider') v.liftTo((f) => hFor(f, loc.Y + DECK_UNDER + CLEAR, r.z));   // B26: raise only at the destination
  v.do(() => { v.q.unshift({ k: 'drive', X: r.x, Z: r.z, th, gear: 1, vmax: 0.5, label: 'Place ' + loc.id, lead: AP }); });
  if (v.isJack) { // open the release valve; the pallet seats when the tines pass the deck underside
    v.do((f) => { f.obj.userData.release(); v.task = 'Lowering'; })
      .until((f) => tineTopY(f) <= loc.Y + DECK_UNDER + 0.0005 || !f.obj.userData.isPumping())
      .do(() => { slotAssert('drop', v, pal, loc); (o.parent || world).attach(pal); v.carry = null; pal.userData.loc = loc.id; o.onDrop && o.onDrop(pal); })
      .until((f) => !f.obj.userData.isPumping());
  } else {
    v.liftTo((f) => hFor(f, loc.Y + DECK_UNDER));
    v.do(() => { slotAssert('drop', v, pal, loc); (o.parent || world).attach(pal); v.carry = null; pal.userData.loc = loc.id; o.onDrop && o.onDrop(pal); });
    v.liftTo((f) => Math.max(0, hEntry(f, loc.Y)));
  }
  if (!o.stay) v.do(() => { v.q.unshift({ k: 'drive', X: r.x - fx * AP, Z: r.z - fz * AP, th, gear: -1, vmax: 0.7, label: 'Back out', lead: 0 }); });
  return v;
}
const go = (v, X, Z, th, gear, o = {}) => v.do(() => { v.q.unshift({ k: 'drive', X, Z, th, gear, vmax: o.vmax, R: o.R, label: o.label, lead: o.lead }); });
// ================================================================= RECEIVING: three counterbalance trucks unloading three trailers
const LANE2 = LANES['DR-002'], LANE7 = LANES['DR-007'];
const FK3 = (() => { const w = trailerMouth(T2), f = makeForklift('FL-03', w.x, sz(2.2), 0); f.obj.userData.setForkHeight(0.08, true); return f; })();
FK3.wait(1.5).do(() => scheduleUnload(FK3, T2, LANE2, sx(IN_DOORS[1].x)));
const FK9 = (() => { const w = trailerMouth(T4), f = makeForklift('FL-09', w.x, sz(2.2), 0); f.obj.userData.setForkHeight(0.08, true); return f; })();
FK9.wait(3).do(() => scheduleUnload(FK9, T4, LANE7, sx(IN_DOORS[6].x)));
// seed stage lanes from earlier unloading (shift started 06:00) so the downstream flow is busy from t=0
function seedLane(lane, ks) { for (const k of ks) { const sl = lane.slots[k], p = newPallet(); placePal(p, LOC.get(sl.id)); sl.state = 'occupied'; sl.pal = p; p.userData.loc = sl.id; } }
seedLane(LANE2, [0]); seedLane(LANE5, [0]); seedLane(LANE7, [0, 1]);
// ================================================================= P&D stations at the aisle mouths (reserve storage hand-off)
const PD = {}; for (const i of [3, 4, 5]) { const a = AISLES[i], id = 'PD-' + a.id; PD[a.id] = { id, a, X: sx(a.x), Y: FLOOR, Z: sz(15.6), state: 'empty', pal: null }; LOC.set(id, PD[a.id]); }
{ const m = new THREE.MeshBasicMaterial({ color: 0xffc220, transparent: true, opacity: 0.85, depthWrite: false }); // floor marking around each P&D
  for (const k in PD) { const p = PD[k]; for (const [w, d, dx, dz] of [[1.5, 0.06, 0, -0.85], [1.5, 0.06, 0, 0.85], [0.06, 1.7, -0.75, 0], [0.06, 1.7, 0.75, 0]]) { const s = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); s.rotation.x = -Math.PI / 2; s.position.set(p.X + dx, FLOOR + 0.006, p.Z + dz); world.add(s); } } }
// ================================================================= RIDER PALLET TRUCKS: stage lane (north end) -> P&D
function makeRider(id, X, Z, th) {
  const v = makeMHE(id, 'Rider pallet truck', createRiderPalletTruck({}), X, Z, th, { R: 0.8, vmax: 1.7, kind: 'rider', steerRate: 2.0, Lc: 0.7 });
  riderLiftAdapter(v); measureForks(v, true); return v;
}
const Y_H = 12.2; // cross-aisle turning line (MXA)
function rpJob(v, lanes, pds) {
  let lane = null, k = -1;
  for (const L of lanes) { const kk = L.slots.findIndex((s) => s.state !== 'empty'); if (kk >= 0 && L.slots[kk].state === 'occupied' && !LOCKS[L.id]) { lane = L; k = kk; break; } }
  const pd = pds.find((p) => p.state === 'empty');
  if (!lane || !pd) { v.state = 'Waiting'; v.task = !pd ? 'P&D full · waiting for reach truck' : 'Waiting for staged pallet'; v.wait(1.2).do(() => rpJob(v, lanes, pds)); return; }
  const sl = lane.slots[k], pal = sl.pal, loc = LOC.get(sl.id), lx = sx(lane.x), dir = Math.sign(pd.X - lx) || 1;
  sl.state = 'reserved'; pd.state = 'reserved'; v.state = 'Moving'; v.task = `${sl.id} → ${pd.id}`;
  const RD = reachD(v), yAp = sl.y + RD + 0.5;
  lockQ(v, lane.id);
  go(v, lx, sz(yAp), HD.S, 1, { R: 0.8, lead: 0.3, label: 'To ' + sl.id, vmax: 1.5 });
  pickAt(v, pal, loc, HD.S, { AP: 0.5, onPick: () => { sl.state = 'empty'; sl.pal = null; } });
  go(v, lx - dir * 0.8, sz(Y_H), dir > 0 ? HD.E : HD.W, -1, { R: 0.8, lead: 0, label: 'Reverse turn' });
  unlockQ(v, lane.id);
  go(v, pd.X, sz(15.6 - RD - 0.5), HD.N, 1, { R: 0.8, lead: 0.4, label: 'To ' + pd.id, vmax: 1.6 });
  dropAt(v, pd, HD.N, { AP: 0.5, noApproach: true, onDrop: (p) => { pd.state = 'occupied'; pd.pal = p; log('MOVE', v.id, `${p.userData.lpn} staged at ${pd.id}`); } });
  v.do(() => { const nl = lanes[0], d2 = Math.sign(sx(nl.x) - pd.X) || -1; v.q.unshift({ k: 'drive', X: pd.X - d2 * 0.8, Z: sz(Y_H), th: d2 > 0 ? HD.E : HD.W, gear: -1, R: 0.8, lead: 0, label: 'Reverse turn' }); });
  v.do(() => rpJob(v, lanes, pds));
}
const RP1 = makeRider('RP-01', sx(22), sz(Y_H), HD.W), RP2 = makeRider('RP-02', sx(33), sz(Y_H), HD.E);
RP1.do(() => rpJob(RP1, [LANE2, LANE5], [PD['04'], PD['05']]));
RP2.wait(2).do(() => rpJob(RP2, [LANE7, LANE5], [PD['06'], PD['05']]));
// seed: one pallet already waiting on two P&Ds
for (const id of ['04', '06']) { const p = newPallet(); placePal(p, PD[id]); PD[id].state = 'occupied'; PD[id].pal = p; p.userData.loc = PD[id].id; }
// ================================================================= REACH TRUCKS: P&D -> rack slot (putaway) and rack -> rack (replenishment)
function makeReach(id, a) {
  const o = createReachTruck({ autoLift: false }); o.userData.setReach(1, true);
  const v = makeMHE(id, 'Reach truck', o, sx(a.x), sz(20), HD.S, { R: 0.6, vmax: 1.6, acc: 0.7, steerRate: 1.8, Lc: 0.7 });
  o.userData.setForkHeight(0.1, true); measureForks(v, false); v.aisle = a; v.own = []; return v;
}
const RT_R = 0.6;
function rtSlotPoses(v, sl) { const s = sl.face > 0 ? 1 : -1; // face>0: west row (truck faces west)
  const th = s > 0 ? HD.W : HD.E, RD = reachD(v), xr = sl.x + s * RD, xa = xr + s * 1.3;
  return { th, xa, P1: { x: xa + s * RT_R, y: sl.y - RT_R - 0.4 }, P2: { x: xa + s * RT_R, y: sl.y - RT_R } }; }
// (aisle y grows north; trucks travel facing south (th 0) along the aisle, so 'north of the slot' means smaller Z)
function rtFreeSlot(v, minB = 3) {
  const c = SLOTS.filter((s) => s.aisle === v.aisle && s.state === 'empty' && s.bay >= minB && s.lv <= 3);
  return c.length ? c[Math.floor(rnd() * c.length)] : null;
}
function rtGoSlot(v, sl, p) { // from wherever in the aisle (facing S) to the slot approach (facing the rack)
  const ys = sl.y; // P1 is north of the slot by R+0.4 (y larger)
  v.do(() => { const yP = ys + RT_R + 0.4, g = sz(yP) < v.z - 0.3 ? -1 : 1; v.q.unshift({ k: 'drive', X: sx(p.P1.x), Z: sz(yP), th: HD.S, gear: g, R: RT_R, label: 'To ' + sl.id, vmax: 1.6 }); });
  go(v, sx(p.xa), sl.Z, p.th, 1, { R: RT_R, lead: 0, label: 'Turn into ' + sl.id });
}
function rtLeaveSlot(v, sl, p) { go(v, sx(p.P2.x), sz(sl.y + RT_R), HD.S, -1, { R: RT_R, lead: 0, label: 'Reverse out' }); }
function rtJob(v) {
  const pd = PD[v.aisle.id];
  if (pd.state === 'occupied' && pd.pal) { // ---- putaway
    const sl = rtFreeSlot(v); if (!sl) { v.wait(2).do(() => rtJob(v)); return; }
    pd.state = 'reserved'; sl.state = 'reserved'; const pal = pd.pal; v.state = 'Putaway'; v.task = `${pd.id} → ${sl.id}`;
    const RD = reachD(v); go(v, pd.X, sz(15.6 + RD + 0.8), HD.S, 1, { R: RT_R, label: 'To ' + pd.id, vmax: 1.6 });
    pickAt(v, pal, pd, HD.S, { AP: 0.8, lead: 0.8, onPick: () => { pd.state = 'empty'; pd.pal = null; } });
    v.liftTo((f) => hTravel(f));
    const p = rtSlotPoses(v, sl); rtGoSlot(v, sl, p);
    v.liftTo((f) => hFor(f, sl.Y + DECK_UNDER + CLEAR));
    v.do(() => { const s = sl.face > 0 ? 1 : -1; v.q.unshift({ k: 'drive', X: sx(p.xa - s * 1.3), Z: sl.Z, th: p.th, gear: 1, vmax: 0.4, label: 'Into ' + sl.id, lead: 1.3 }); });
    v.liftTo((f) => hFor(f, sl.Y + DECK_UNDER));
    v.do(() => { slotAssert('drop', v, pal, sl); world.attach(pal); v.carry = null; sl.state = 'occupied'; sl.dyn = pal; pal.userData.loc = sl.id; v.own.push(sl); COUNTS.putaway++; log('PUT', v.id, `${pal.userData.lpn} put away at ${sl.id}`, 'success'); });
    v.liftTo((f) => hFor(f, sl.Y + ENTRY));
    go(v, sx(p.xa), sl.Z, p.th, -1, { vmax: 0.4, lead: 0, label: 'Withdraw forks' });
    v.liftTo((f) => hTravel(f)); rtLeaveSlot(v, sl, p);
    v.do(() => rtJob(v)); return;
  }
  if (v.own.length && rnd() < 0.7) { // ---- replenishment: move one of this truck's pallets to a pick-level slot
    const from = v.own[Math.floor(rnd() * v.own.length)], to = SLOTS.filter((s) => s.aisle === v.aisle && s.state === 'empty' && s.bay >= 3 && Math.abs(s.y - from.y) > 3 && s.lv !== from.lv && s.lv <= 2);
    if (from.state === 'occupied' && from.dyn && to.length) {
      const sl = to[Math.floor(rnd() * to.length)], pal = from.dyn; from.state = 'reserved'; sl.state = 'reserved'; v.state = 'Replenishment'; v.task = `${from.id} → ${sl.id}`;
      const p0 = rtSlotPoses(v, from), s0 = from.face > 0 ? 1 : -1; rtGoSlot(v, from, p0);
      v.liftTo((f) => hFor(f, from.Y + ENTRY));
      v.do(() => { v.q.unshift({ k: 'drive', X: sx(p0.xa - s0 * 1.3), Z: from.Z, th: p0.th, gear: 1, vmax: 0.4, label: 'Forks into ' + from.id, lead: 1.3 }); });
      v.liftTo((f) => hFor(f, from.Y + DECK_UNDER));
      v.do(() => { slotAssert('pickup', v, pal, from); carriageOf(v).attach(pal); v.carry = pal; from.state = 'empty'; from.dyn = null; v.own.splice(v.own.indexOf(from), 1); pal.userData.loc = v.id; });
      v.liftTo((f) => f.obj.userData.getForkHeight() + CLEAR);
      go(v, sx(p0.xa), from.Z, p0.th, -1, { vmax: 0.4, lead: 0, label: 'Withdraw' });
      v.liftTo((f) => hTravel(f)); rtLeaveSlot(v, from, p0);
      const p = rtSlotPoses(v, sl), s = sl.face > 0 ? 1 : -1; rtGoSlot(v, sl, p);
      v.liftTo((f) => hFor(f, sl.Y + DECK_UNDER + CLEAR));
      v.do(() => { v.q.unshift({ k: 'drive', X: sx(p.xa - s * 1.3), Z: sl.Z, th: p.th, gear: 1, vmax: 0.4, label: 'Into ' + sl.id, lead: 1.3 }); });
      v.liftTo((f) => hFor(f, sl.Y + DECK_UNDER));
      v.do(() => { slotAssert('drop', v, pal, sl); world.attach(pal); v.carry = null; sl.state = 'occupied'; sl.dyn = pal; pal.userData.loc = sl.id; v.own.push(sl); COUNTS.putaway++; log('REPL', v.id, `${pal.userData.lpn} ${from.id} → ${sl.id}`); });
      v.liftTo((f) => hFor(f, sl.Y + ENTRY));
      go(v, sx(p.xa), sl.Z, p.th, -1, { vmax: 0.4, lead: 0, label: 'Withdraw' });
      v.liftTo((f) => hTravel(f)); rtLeaveSlot(v, sl, p);
      v.do(() => rtJob(v)); return;
    }
  }
  v.state = 'Waiting'; v.task = 'Waiting at ' + pd.id; v.wait(1.5).do(() => rtJob(v));
}
const RT = [makeReach('RT-04', AISLES[3]), makeReach('RT-05', AISLES[4]), makeReach('RT-06', AISLES[5])];
RT.forEach((v, i) => v.wait(0.5 + i).do(() => rtJob(v)));
// ================================================================= SHIPPING: outbound lanes -> trailers (deep rows first)
const OUTL = {}; for (const d of OUT_DOORS) { OUTL[d.id] = { id: 'OB-' + d.id, x: d.x + 2, slots: [58.6, 57.2, 55.8, 54.4].map((y, k) => ({ id: `OB-${d.id.replace('-', '')}:${k + 1}`, y, state: 'empty', pal: null })) };
  for (const sl of OUTL[d.id].slots) LOC.set(sl.id, { id: sl.id, kind: 'stage', X: sx(d.x + 2), Y: FLOOR, Z: sz(sl.y), slot: sl }); }
const OL3 = OUTL['DS-103'], OL5 = OUTL['DS-105'];
function seedOut(L, ks) { for (const k of ks) { const sl = L.slots[k], p = newPallet(); placePal(p, LOC.get(sl.id)); sl.state = 'occupied'; sl.pal = p; p.userData.loc = sl.id; } }
seedOut(OL3, [1, 2, 3]); seedOut(OL5, [2, 3]);
const OZ = 52.0;
function shipJob(v, trl, L) {
  const used = new Set(trl.pallets.map((p) => p.userData.k)); let kt = -1; for (let k = TRL_ROWS * 2 - 1; k >= 0; k--) if (!used.has(k)) { kt = k; break; }
  let k = -1; for (let i = 3; i >= 0; i--) { if (L.slots[i].state === 'occupied') { k = i; break; } if (L.slots[i].state !== 'empty') break; }
  if (kt < 0) { v.state = 'Idle'; v.task = `${trl.id} loaded · awaiting yard swap`; v.wait(5).do(() => shipJob(v, trl, L)); return; }
  if (k < 0 || LOCKS[L.id]) { v.state = 'Waiting'; v.task = 'Waiting for wrapped pallet'; v.wait(1.5).do(() => shipJob(v, trl, L)); return; }
  const sl = L.slots[k], pal = sl.pal, loc = LOC.get(sl.id), lx = sx(L.x); sl.state = 'reserved'; v.state = 'Loading'; v.task = `${sl.id} → ${trl.id}`;
  lockQ(v, L.id);
  go(v, lx, sz(OZ), HD.N, 1, { R: 1.5, label: 'To ' + L.id, vmax: 1.6 });
  v.liftTo((f) => hFor(f, FLOOR + ENTRY));
  pickAt(v, pal, loc, HD.N, { AP: 0.8, stay: true, onPick: () => { sl.state = 'empty'; sl.pal = null; } });
  v.tilt(0.05);
  go(v, lx, sz(OZ), HD.N, -1, { lead: 0, label: 'Reverse out', vmax: 0.9 });
  unlockQ(v, L.id);
  v.liftTo((f) => hTravel(f));
  let dst; v.do(() => { placeVehicle(trl, 1); trl.obj.updateMatrixWorld(true); const w = trl.P.trailer.localToWorld(trlPos(kt)); dst = { id: `${trl.id}/P${fmtId(kt + 1)}`, X: w.x, Y: w.y, Z: w.z }; });
  v.do(() => { const RD = reachD(v); v.q.unshift({ k: 'drive', X: dst.X, Z: dst.Z + RD + 1.0, th: HD.N, gear: 1, R: 1.6, vmax: 1.6, label: 'Into ' + trl.id }); });
  v.tilt(0);
  v.liftTo((f) => hFor(f, dst.Y + DECK_UNDER + 0.05, f.z));
  v.do(() => { const RD = reachD(v); v.q.unshift({ k: 'drive', X: dst.X, Z: dst.Z + RD, th: HD.N, gear: 1, vmax: 0.5, label: 'Place ' + dst.id, lead: 1.0 }); });
  v.liftTo((f) => hFor(f, dst.Y + DECK_UNDER));
  v.do(() => { slotAssert('drop', v, pal, dst); trl.P.trailer.attach(pal); pal.userData.k = kt; pal.userData.loc = dst.id; trl.pallets.push(pal); v.carry = null; COUNTS.shipped++; log('LOAD', v.id, `${pal.userData.lpn} loaded on ${trl.id} (${dst.id})`, 'success'); });
  v.liftTo((f) => hFor(f, dst.Y + ENTRY));
  v.do(() => { const RD = reachD(v); v.q.unshift({ k: 'drive', X: dst.X, Z: dst.Z + RD + 1.2, th: HD.N, gear: -1, vmax: 0.8, label: 'Back out', lead: 0 }); });
  v.liftTo((f) => hFor(f, FLOOR + TRAVEL - 0.08, sz(OZ)));
  go(v, lx, sz(OZ), HD.N, -1, { R: 1.6, label: 'Return to ' + L.id, vmax: 1.4 });
  v.do(() => shipJob(v, trl, L));
}
const FK11 = makeForklift('FL-11', sx(OL3.x), sz(OZ), HD.N), FK12 = makeForklift('FL-12', sx(OL5.x), sz(OZ), HD.N);
FK11.obj.userData.setForkHeight(0.08, true); FK12.obj.userData.setForkHeight(0.08, true);
FK11.do(() => shipJob(FK11, T3, OL3)); FK12.wait(2).do(() => shipJob(FK12, T5, OL5));
// ================================================================= PALLET BUILD + STRETCH WRAP + HAND PALLET JACKS
const WR = { x: 66, y: 56.5 };
let WRAP = null; try { WRAP = COOKER_WRAPPER.create(world, { position: [sx(WR.x), FLOOR, sz(WR.y)], rotationY: 0, duration: 22, caseStack: true }); } catch (e) { console.warn('[gf] wrapper', e); }
const TT = WRAP ? WRAP.getTurntableWorld(new THREE.Vector3()) : V3(sx(WR.x), FLOOR + 0.12, sz(WR.y));
const TTLOC = { id: 'WRAP-01', X: TT.x, Y: TT.y, Z: TT.z };
// build spots: pallets are built case by case by two builders, then pulled to the wrapper
const BS = [{ id: 'BLD-01', x: 56, y: 53.0 }, { id: 'BLD-02', x: 59.5, y: 53.0 }].map((b) => ({ ...b, X: sx(b.x), Y: FLOOR, Z: sz(b.y), pal: null, n: 0, state: 'building' }));
BS.forEach((b) => LOC.set(b.id, b));
const CASE_W = 0.5, CASE_D = 0.4, CASE_H = 0.26, CASES_PER = 18;
function caseMesh() { const m = new THREE.Mesh(new THREE.BoxGeometry(CASE_D, CASE_H, CASE_W), cartonMat); m.castShadow = true; return m; }
function casePos(i) { const l = Math.floor(i / 6), j = i % 6; return V3((j % 2 ? 0.25 : -0.25) * 0.98, PALLET.h + CASE_H / 2 + l * CASE_H, (Math.floor(j / 2) - 1) * 0.405); }
function startBuild(b, n0 = 0) { const p = createPallet({ variant: 'pine', seed: PSEED++, wrap: false, maxHeight: 0.001 }); shadowAll(p); for (const c of [...p.children]) if (c.name && /load|case|wrap/i.test(c.name)) p.remove(c);
  trackPal(p); world.add(p); placePal(p, b); b.pal = p; b.n = 0; b.state = 'building'; for (let i = 0; i < n0; i++) addCase(b); }
function addCase(b, m) { m = m || caseMesh(); b.pal.attach(m); m.position.copy(casePos(b.n)); m.rotation.set(0, 0, 0); b.n++; if (b.n >= CASES_PER) { b.state = 'ready'; log('BUILD', b.id, `${b.pal.userData.lpn} built · ${CASES_PER} cases`); } }
startBuild(BS[0], 18); startBuild(BS[1], 9);
function makeJack(id, X, Z, th) {
  const v = makeMHE(id, 'Hand pallet jack', createHandPalletJack({}), X, Z, th, { R: 0.9, vmax: 1.05, acc: 0.6, kind: 'jack', walkBehind: true, steerRate: 2.2, Lc: 0.6 });
  jackLiftAdapter(v); measureForks(v, true); v.obj.userData.setHandleAngle(-0.28); return v;
}
// "pull then push": travel handle-first (operator in front, pulling), then square up and push into the pallet
function jackApproach(v, loc, th, AP = 0.9) {
  let r; v.do(() => { r = refFor(v, loc, th); const [fx, fz] = fwdOf(th), Bx = r.x - fx * (AP + 2.6), Bz = r.z - fz * (AP + 2.6);
    v.q.unshift({ k: 'drive', X: Bx, Z: Bz, th, gear: -1, vmax: 1.05, R: 0.9, label: 'Pulling to ' + loc.id, lead: 1.0 }, { k: 'drive', X: r.x - fx * AP, Z: r.z - fz * AP, th, gear: 1, vmax: 0.7, label: 'Pushing to ' + loc.id, lead: 1.2 }); });
}
// turntable ramp: the jack rides up the 0.12 m disc (Cooker's station has a -X ramp)
function wrapRampY(v) { const d = Math.hypot(v.x - TT.x, v.z - TT.z); return FLOOR + clamp((1.75 - d) / 0.6, 0, 1) * (TT.y - FLOOR); }
function jackJob(v, b, lane) {
  if (b.state !== 'ready' || LOCKS.WRAP && LOCKS.WRAP !== v.id) { v.state = 'Waiting'; v.task = b.state === 'ready' ? 'Waiting for wrapper' : `${b.id} building (${b.n}/${CASES_PER})`; v.wait(1.5).do(() => jackJob(v, b, lane)); return; }
  const pal = b.pal; b.state = 'moving'; v.state = 'Moving'; v.task = `${b.id} → WRAP-01`;
  lockQ(v, 'WRAP');
  jackApproach(v, b, HD.E); pickAt(v, pal, b, HD.E, { AP: 0.9, onPick: () => { b.pal = null; b.state = 'empty'; } });
  jackApproach(v, TTLOC, HD.E, 1.0);
  dropAt(v, TTLOC, HD.E, { AP: 1.0, noApproach: true });
  v.do(() => { v.state = 'Wrapping'; v.task = 'Stretch wrap ' + pal.userData.lpn; pal.userData.wrapping = true;
    const done = () => { pal.userData.wrapping = false; pal.userData.wrapped = true; log('WRAP', 'WRAP-01', `${pal.userData.lpn} wrapped`, 'success'); };
    if (WRAP) WRAP.wrap(pal, { duration: 20 }).then(done, done); else setTimeout(done, 100); })
    .until(() => !pal.userData.wrapping, 'Stretch wrapping');
  v.do(() => { world.attach(pal); });
  pickAt(v, pal, TTLOC, HD.E, { AP: 1.0, stay: true });
  go(v, TTLOC.X - 2.9, TTLOC.Z, HD.E, -1, { vmax: 0.6, lead: 1.4, label: 'Pull off turntable' });
  unlockQ(v, 'WRAP');
  // outbound lane: drop at the north-most slot reachable from the south
  let sl; v.do(() => { let k = -1; for (let i = 3; i >= 0 && lane.slots[i].state === 'empty'; i--) k = i; if (k < 0) { v.q.unshift({ k: 'wait', t: 2 }); } sl = k >= 0 ? lane.slots[k] : null; if (sl) sl.state = 'reserved'; v.task = `${pal.userData.lpn} → ${sl ? sl.id : lane.id}`; });
  v.until(() => sl || (() => { let k = -1; for (let i = 3; i >= 0 && lane.slots[i].state === 'empty'; i--) k = i; if (k >= 0) { sl = lane.slots[k]; sl.state = 'reserved'; } return !!sl; })(), 'Waiting for lane space');
  lockQ(v, lane.id);
  v.do(() => { const loc = LOC.get(sl.id); jackApproachNow(v, loc, HD.N, 0.9); });
  v.do(() => { const loc = LOC.get(sl.id); dropNow(v, loc); });
}
function jackApproachNow(v, loc, th, AP) { const r = refFor(v, loc, th), [fx, fz] = fwdOf(th); const By = Math.max(sz(50.4), r.z - fz * (AP + 2.6));
  v.q.unshift({ k: 'drive', X: r.x - fx * AP, Z: By, th, gear: -1, vmax: 1.05, R: 0.9, label: 'Pulling to ' + loc.id, lead: 1.0 }, { k: 'drive', X: r.x - fx * AP, Z: r.z - fz * AP, th, gear: 1, vmax: 0.7, label: 'Pushing to ' + loc.id, lead: 0.8 }); }
function dropNow(v, loc) { // builds the drop sequence for the current carry and inserts it at the front of the queue
  const q0 = v.q; v.q = []; const pal = v.carry, sl = loc.slot, lane = v.lane;
  dropAt(v, loc, HD.N, { AP: 0.9, noApproach: true, onDrop: (p) => { sl.state = 'occupied'; sl.pal = p; log('STAGE', v.id, `${p.userData.lpn} staged at ${sl.id}`); } });
  unlockQ(v, lane.id); jackPark(v); v.do(() => jackJob(v, v.bs, lane));
  v.q.push(...q0); }
// park in the marked bay, release the tiller (springs upright), operator walks off for the next pallet paperwork
function jackPark(v) {
  const pk = v.park; go(v, pk.X, pk.Z, pk.th, -1, { vmax: 0.8, R: 0.9, label: 'Park' });
  v.do(() => { v.state = 'Parked'; v.task = 'Parked · operator scanning labels'; v.obj.userData.setHandleAngle(0); const op = v.obj.userData.detachOperator(); if (op) { world.attach(op); v.offOp = op; op.userData.detachHands && op.userData.detachHands(); walkOff(op, v); } })
    .until(() => !v.offOp, 'Operator away')
    .do(() => { v.obj.userData.setHandleAngle(-0.28); v.state = 'Moving'; });
}
const HJ = [makeJack('HJ-01', sx(54), sz(51.2), HD.E), makeJack('HJ-02', sx(57.5), sz(51.2), HD.E)];
HJ[0].bs = BS[0]; HJ[0].lane = OL5; HJ[0].park = { X: sx(54), Z: sz(50.9), th: HD.E };
HJ[1].bs = BS[1]; HJ[1].lane = OL3; HJ[1].park = { X: sx(57.5), Z: sz(50.9), th: HD.E };
HJ.forEach((v, i) => v.wait(0.5 + i * 3).do(() => jackJob(v, v.bs, v.lane)));
// receiving hand jack: moves short-shipped / overflow pallets from lane DR-008 area to the QA hold bay
const QA_A = { id: 'HOLD-01', X: sx(41.5), Y: FLOOR, Z: sz(4.6) }, QA_B = { id: 'HOLD-02', X: sx(41.5), Y: FLOOR, Z: sz(9.4) };
LOC.set(QA_A.id, QA_A); LOC.set(QA_B.id, QA_B);
const HJ3 = makeJack('HJ-03', sx(43.6), sz(7.0), HD.N); HJ3.park = { X: sx(43.6), Z: sz(7.0), th: HD.N };
{ const p = newPallet('half'); placePal(p, QA_A); QA_A.pal = p; }
function hj3Job(v) { const [A, B] = QA_A.pal ? [QA_A, QA_B] : [QA_B, QA_A], pal = A.pal; v.state = 'Moving'; v.task = `${A.id} → ${B.id}`;
  const th = B.Z < A.Z ? HD.N : HD.S; // pull-first travel needs the pallet picked facing away from the target
  const thPick = th === HD.N ? HD.S : HD.N;
  jackApproach(v, A, thPick); pickAt(v, pal, A, thPick, { AP: 0.9, onPick: () => { A.pal = null; } });
  v.do(() => { const r = refFor(v, B, thPick); const [fx, fz] = fwdOf(thPick); v.q.unshift({ k: 'drive', X: r.x - fx * 0.0, Z: r.z, th: thPick, gear: -1, vmax: 0.9, label: 'Pulling to ' + B.id, lead: 2 }); });
  v.do((f) => { f.obj.userData.release(); }).until((f) => tineTopY(f) <= B.Y + DECK_UNDER + 0.0005 || !f.obj.userData.isPumping())
    .do(() => { slotAssert('drop', v, pal, B); world.attach(pal); v.carry = null; B.pal = pal; pal.userData.loc = B.id; }).until((f) => !f.obj.userData.isPumping());
  v.do(() => { const r = refFor(v, B, thPick), [fx, fz] = fwdOf(thPick); v.q.unshift({ k: 'drive', X: r.x - fx * 0.9, Z: r.z - fz * 0.9, th: thPick, gear: -1, vmax: 0.6, label: 'Back out', lead: 0 }); });
  jackPark(v); v.do(() => hj3Job(v)); }
HJ3.wait(2).do(() => hj3Job(HJ3));
// ================================================================= PICK MODULE: two walkie stackers replenishing pick faces
function makeWalkie(id, x, y0, y1) {
  const v = makeMHE(id, 'Walkie stacker', createWalkieStacker({ autoLift: false }), sx(x), sz(y1 + 3.2), HD.S, { R: 0.9, vmax: 1.1, acc: 0.6, walkBehind: true, steerRate: 2.0, Lc: 0.6 });
  v.obj.userData.setForkHeight(0.06, true); measureForks(v, false); v.obj.userData.setTiller && v.obj.userData.setTiller(-0.9);
  v.A = { id: id + '-A', X: sx(x), Y: FLOOR, Z: sz(y0) }; v.B = { id: id + '-B', X: sx(x), Y: FLOOR, Z: sz(y1) }; LOC.set(v.A.id, v.A); LOC.set(v.B.id, v.B); return v;
}
function wsJob(v) { // forks face south; the operator pulls north (handle first) and pushes into position
  const full = v.A.pal ? v.A : v.B, empty = full === v.A ? v.B : v.A, pal = full.pal; v.state = 'Replenishment'; v.task = `${full.id} → ${empty.id}`;
  pickAt(v, pal, full, HD.S, { AP: 0.9, onPick: () => { full.pal = null; } }); v.liftTo((f) => hTravel(f));
  v.do(() => { const r = refFor(v, empty, HD.S); v.q.unshift({ k: 'drive', X: r.x, Z: r.z - 0.9, th: HD.S, gear: Math.sign(v.z - (r.z - 0.9)) < 0 ? 1 : -1, vmax: 1.0, label: 'To ' + empty.id, lead: 3 }); });
  dropAt(v, empty, HD.S, { AP: 0.9, noApproach: true, onDrop: (p) => { empty.pal = p; } }); v.liftTo((f) => hFor(f, FLOOR + 0.06));
  v.wait(4).do(() => wsJob(v)); }
const WS = [makeWalkie('WS-01', 60.25, 19.0, 41.0), makeWalkie('WS-02', 61.75, 41.0, 19.0)];
WS.forEach((v, i) => { const p = newPallet(i ? 'half' : 'full'); placePal(p, v.B); v.B.pal = p; v.wait(i * 2).do(() => wsJob(v)); });
// ================================================================= TUGGER TRAIN: tote loop around the cross-dock
const TUG = (() => { const o = createTugTrain({}); shadowAll(o); world.add(o); const ud = o.userData; if (ud.attachOperator && !ud.operator) ud.attachOperator();
  const P = ud.parts; (P.carts || []).forEach((c, i) => { for (let j = 0; j < 4; j++) { const t = createTote({ color: j % 2 ? 0x2a6ab4 : 0x1f2833 }); t.scale.setScalar(0.9); t.position.set((j % 2 ? 0.22 : -0.22), 0.55 + Math.floor(j / 2) * 0.3, 0); (c.body || c.pivot).add(t); } });
  const pts = []; const R = 1.9, xL = 45.6, xR = 49.4, y0 = 13.5 + R, y1 = 42.5 - R, cx = (xL + xR) / 2;
  for (let y = y0; y <= y1; y += 0.5) pts.push([xR, y]); for (let a = 0; a <= Math.PI; a += 0.1) pts.push([cx + R * Math.cos(a), y1 + R * Math.sin(a)]);
  for (let y = y1; y >= y0; y -= 0.5) pts.push([xL, y]); for (let a = Math.PI; a <= 2 * Math.PI; a += 0.1) pts.push([cx + R * Math.cos(a), y0 + R * Math.sin(a)]);
  const path = pts.map(([x, y]) => V3(sx(x), 0, sz(y)));
  o.position.set(sx(xR), FLOOR, sz(24) + 0.55); o.rotation.y = HD.N;
  return { id: 'TUG-01', type: 'Tugger train', obj: o, path, i: 0, v: 0, stopT: 0, stops: [V3(sx(xR), 0, sz(20)), V3(sx(xL), 0, sz(36))], state: 'Tote run', task: 'XDK loop · 8 totes' }; })();
POP.movers.push(TUG);
function purePursuit(m, dt, vmax, look = 2.2) {
  const o = m.obj, k = o.userData.kin, th = o.rotation.y, rx = o.position.x + Math.sin(th) * k.refZ, rz = o.position.z + Math.cos(th) * k.refZ;
  let best = m.i, bd = 1e9; for (let j = 0; j < 30; j++) { const q = m.path[(m.i + j) % m.path.length], d = (q.x - rx) ** 2 + (q.z - rz) ** 2; if (d < bd) { bd = d; best = (m.i + j) % m.path.length; } } m.i = best;
  let tj = best; for (let j = 0; j < m.path.length; j++) { const q = m.path[(best + j) % m.path.length]; if (Math.hypot(q.x - rx, q.z - rz) >= look) { tj = (best + j) % m.path.length; break; } }
  const q = m.path[tj], ang = Math.atan2(q.x - rx, q.z - rz) - th, a = Math.atan2(Math.sin(ang), Math.cos(ang)), Ld = Math.hypot(q.x - rx, q.z - rz);
  const steer = Math.atan(2 * k.L * Math.sin(a) / Math.max(0.5, Ld));
  m.v = m.hold ? Math.max(0, m.v - 1.6 * dt) : m.v + clamp(vmax - m.v, -1.2 * dt, 0.6 * dt);
  const p0x = o.position.x, p0z = o.position.z; mdlDrive(o, dt, m.v, steer); m.ds = Math.hypot(o.position.x - p0x, o.position.z - p0z);
  m.x = rx; m.z = rz;
}
function tugStep(dt) { const m = TUG; let vmax = 1.5;
  if (m.stopT > 0) { m.stopT -= dt; vmax = 0; m.state = 'Tote transfer'; } else { m.state = 'Tote run'; for (const s of m.stops) { const d = Math.hypot(m.obj.position.x - s.x, m.obj.position.z - s.z); if (d < 0.25 && !m.atStop) { m.stopT = 7; m.atStop = s; } if (m.atStop === s && d > 2) m.atStop = null; if (d < 3 && !m.atStop) vmax = Math.min(vmax, 0.3 + d * 0.35); } }
  purePursuit(m, dt, vmax); }
// ================================================================= YARD TRACTORS (shunters) looping the yard
function makeYard(id, zA, zB) { const o = createYardTractor({}); shadowAll(o); world.add(o); const ud = o.userData; if (ud.attachOperator && !ud.operator) ud.attachOperator();
  const R = (zB - zA) / 2, xa = -40, xb = 14, cz = (zA + zB) / 2, pts = [];
  for (let x = xa; x <= xb; x += 1) pts.push([x, zA]); for (let a = -Math.PI / 2; a <= Math.PI / 2; a += 0.08) pts.push([xb + R * Math.cos(a), cz + R * Math.sin(a)]);
  for (let x = xb; x >= xa; x -= 1) pts.push([x, zB]); for (let a = Math.PI / 2; a <= 1.5 * Math.PI; a += 0.08) pts.push([xa + R * Math.cos(a), cz + R * Math.sin(a)]);
  const path = pts.map(([x, z]) => V3(x, 0, z)); o.position.set(-10, 0, zA); o.rotation.y = HD.E;
  const m = { id, type: 'Yard tractor', obj: o, path, i: 0, v: 0, state: 'Yard move', task: 'Shunting · yard loop', yard: true }; POP.movers.push(m); return m; }
const YT = [makeYard('YT-01', 57, 69), makeYard('YT-02', -69, -57)];
// ================================================================= WORKERS (walk, pause for vehicles, carry cases)
function makePed(id, role, o = {}) { const w = createWorker({ vest: o.vest ?? 'yellow', hardHat: o.hardHat ?? true, seed: PSEED++ }); shadowAll(w); world.add(w);
  const p = { id, role, o: w, route: o.route, i: 0, wait: 0, speed: o.speed ?? 1.15, task: o.task || role, state: 'Walking', carry: null, onArrive: o.onArrive };
  const [x, y] = o.route[0]; w.position.set(sx(x), FLOOR, sz(y)); POP.peds.push(p); return p; }
const PICK_FACES_W = [19.1, 22, 24.9, 27.8, 30.7, 33.6, 36.5, 39.4], PICK_FACES_E = PICK_FACES_W;
function pickerRoute(xFace, xConv, ys) { const r = []; for (const y of ys) { r.push([xFace, y, 3.5, 'pick']); r.push([xConv, y + 0.4, 1.2, 'place']); } return r; }
const PEDS = [
  makePed('PK-11', 'Picker', { route: pickerRoute(53.9, 52.9, [19.1, 24.9, 30.7, 36.5]), task: 'Case pick · face 57W → takeaway C-52' }),
  makePed('PK-12', 'Picker', { route: pickerRoute(53.9, 52.9, [39.4, 33.6, 27.8, 22.0]), task: 'Case pick · face 57W → takeaway C-52' }),
  makePed('PK-21', 'Picker', { route: pickerRoute(68.0, 69.2, [20.0, 26.0, 32.0, 38.0]), vest: 'blue', task: 'Pick-to-tote · face 65E → C-70' }),
  makePed('PK-22', 'Picker', { route: pickerRoute(68.0, 69.2, [41.0, 35.0, 29.0, 23.0]), vest: 'blue', task: 'Pick-to-tote · face 65E → C-70' }),
  makePed('BL-01', 'Pallet builder', { route: [[56.6, 49.9, 2.5, 'take'], [56.0, 51.9, 1.6, 'stack:0']], task: 'Build BLD-01 from sorter chute 7' }),
  makePed('BL-02', 'Pallet builder', { route: [[59.0, 49.9, 2.5, 'take'], [59.5, 51.9, 1.6, 'stack:1']], task: 'Build BLD-02 from sorter chute 8' }),
  makePed('WR-01', 'Wrap operator', { route: [[63.4, 58.6, 6, ''], [64.2, 58.2, 4, '']], task: 'Stretch wrapper WRAP-01' }),
  makePed('RF-02', 'Receiver (RF)', { route: [[17.3, 9.4, 4, 'scan'], [17.3, 5.0, 4, 'scan']], task: 'Receive & label STG-DR002' }),
  makePed('RF-07', 'Receiver (RF)', { route: [[37.3, 5.0, 4, 'scan'], [37.3, 9.4, 4, 'scan']], task: 'Receive & label STG-DR007' }),
  makePed('DC-01', 'Dock checker', { route: [[12.2, 1.2, 5, 'scan'], [20.5, 1.2, 5, 'scan']], task: 'Seal & temp check DR-002 / DR-005' }),
  makePed('DC-02', 'Dock checker', { route: [[30.5, 60.6, 5, 'scan'], [39.5, 60.6, 5, 'scan']], task: 'Load audit DS-103 / DS-105' }),
  makePed('IC-01', 'Inventory control', { route: [[22.1, 17, 3, 'scan'], [22.1, 30, 3, 'scan'], [22.1, 42, 3, 'scan']], vest: 'blue', task: 'Cycle count aisle 04/05 faces' }),
  makePed('GU-01', 'Gate guard', { route: [[149.5, 38.5, 6, ''], [147.6, 38.0, 5, '']], vest: 'orange', hardHat: false, task: 'Gatehouse · seal checks' }),
  makePed('SP-01', 'Shipping lead', { route: [[45.5, 53.0, 4, 'scan'], [47.5, 58.0, 4, 'scan'], [41.2, 52.4, 3, 'scan']], task: 'Wave 14 · DS-103/105 loads' }),
];
// gate guard coordinates are in world X/Z (gatehouse is outside the plan grid): convert back
{ const g = PEDS.find((p) => p.id === 'GU-01'); g.route = [[100 + 50 - 1.5, 31 - 70 - 1.0 + 0.0, 6, ''], [100 + 50 + 1.0, 31 - 70 + 3.2, 5, '']]; const [x, y] = g.route[0]; g.o.position.set(sx(x), 0, sz(y)); g.floor = 0; }
// conveyor items (cases + totes) placed by pickers ride the takeaway belts to the sorter induct
function convAdd(mesh, x, y) { mesh.position.set(sx(x), FLOOR + 0.85 + 0.17, sz(y)); world.add(mesh); POP.conv.push({ m: mesh, x }); }
const TOTE_COLORS = [0x2a6ab4, 0x1f2833];
function pedArrive(p, act) {
  const w = p.o, ud = w.userData;
  if (act === 'pick' || act === 'take') { if (!p.carry) { p.carry = caseMesh(); p.carry.position.set(0, 1.05, 0.34); w.add(p.carry); } }
  else if (act === 'place' && p.carry) { const m = p.carry; p.carry = null; const xc = p.route[p.i][0] < 60 ? 52 : 70; world.attach(m); m.rotation.set(0, 0, 0); convAdd(m, xc, sz(m.position.z) === undefined ? 0 : 31 - m.position.z);
    if (xc === 70 && rnd() < 0.5) { const t = createTote({ color: pick(TOTE_COLORS) }); shadowAll(t); t.scale.setScalar(0.9); convAdd(t, 70, 31 - m.position.z - 0.7); } }
  else if (act && act.startsWith('stack') && p.carry) { const b = BS[+act.split(':')[1]]; if (b.pal && b.state === 'building') { const m = p.carry; p.carry = null; addCase(b, m); } }
}
function pedStep(p, dt) {
  const w = p.o, ud = w.userData, r = p.route[p.i], tx = sx(r[0]), tz = sz(r[1]), dx = tx - w.position.x, dz = tz - w.position.z, d = Math.hypot(dx, dz);
  if (p.wait > 0) { p.wait -= dt; ud.setWalking && ud.setWalking(false); p.state = r[3] === 'scan' ? 'Scanning' : r[3] === 'pick' ? 'Picking' : 'Working';
    if (r[3] === 'scan' || r[3] === 'pick') { ud.parts.armRight.rotation.x = -1.1; }
    if (p.wait <= 0) { p.i = (p.i + 1) % p.route.length; } return; }
  if (d < 0.05) { p.wait = r[2]; pedArrive(p, r[3]); return; }
  // yield: stop if a moving vehicle is within 2.6 m and closing
  let yieldTo = null; for (const v of ALLMOVERS()) { const vx = v.obj.position.x, vz = v.obj.position.z, dd = Math.hypot(vx - w.position.x, vz - w.position.z); if (dd < 2.6 && Math.abs(v.v || 0) > 0.05) { const ahead = (vx - w.position.x) * dx + (vz - w.position.z) * dz; if (ahead > 0) { yieldTo = v; break; } } }
  if (yieldTo) { ud.setWalking && ud.setWalking(false); p.state = 'Yielding to ' + yieldTo.id; return; }
  const s = Math.min(d, p.speed * dt); w.position.x += dx / d * s; w.position.z += dz / d * s; p.state = 'Walking';
  const yaw = Math.atan2(dx, dz); w.rotation.y += Math.atan2(Math.sin(yaw - w.rotation.y), Math.cos(yaw - w.rotation.y)) * Math.min(1, dt * 8);
  if (ud.setWalking) ud.setWalking(true); ud.walkSpeed = p.speed;
}
function postPedPose(p) { const P = p.o.userData.parts; if (p.carry) { P.armLeft.rotation.x = P.armRight.rotation.x = -1.15; } }
// walk-off: a detached jack operator walks to the label printer and back
function walkOff(op, v) {
  const home = op.position.clone(), away = home.clone().add(V3(Math.cos(v.th) * 3.5, 0, -Math.sin(v.th) * 3.5));
  op.userData.setPose && op.userData.setPose('walking-tiller');
  const p = { id: v.id + '-OP', role: 'Jack operator', o: op, phase: 0, t: 0, home, away, v };
  p.step = (dt) => { const tgt = p.phase === 0 ? away : p.phase === 2 ? home : null;
    if (p.phase === 1) { p.t += dt; if (p.t > 4) p.phase = 2; return; }
    const d = tgt.clone().sub(op.position); d.y = 0; const L = d.length();
    if (L < 0.05) { if (p.phase === 0) { p.phase = 1; p.t = 0; } else { // re-attach to the tiller
        POP.walkers.splice(POP.walkers.indexOf(p), 1); v.obj.userData.attachOperator(op); v.offOp = null; } return; }
    const s = Math.min(L, 1.1 * dt); op.position.addScaledVector(d.normalize(), s); const yaw = Math.atan2(d.x, d.z); op.rotation.y = yaw; };
  (POP.walkers ||= []).push(p);
}
POP.walkers = POP.walkers || [];
// ================================================================= proximity holds (reservation-based right of way)
const ALLMOVERS = () => [...VEH.filter((v) => !v.isSemi), ...POP.movers];
function proximityHolds() {
  const L = ALLMOVERS();
  for (const v of L) { v.hold = false; const sp = v.sv ?? v.v ?? 0; if (Math.abs(sp) < 0.02 && !(v.cur && v.cur.k === 'drive')) continue;
    const th = v.obj.rotation.y + ((v.sv ?? 1) < 0 ? Math.PI : 0), fx = Math.sin(th), fz = Math.cos(th), px = v.obj.position.x, pz = v.obj.position.z;
    for (const u of L) { if (u === v) continue; const dx = u.obj.position.x - px, dz = u.obj.position.z - pz, along = dx * fx + dz * fz, lat = Math.abs(dx * fz - dz * fx);
      if (along > 0.5 && along < 3.2 && lat < 1.3 && (u.id > v.id || Math.abs(u.sv ?? u.v ?? 0) < 0.02)) { v.hold = true; break; } }
    if (!v.hold) for (const p of POP.peds) { const dx = p.o.position.x - px, dz = p.o.position.z - pz, along = dx * fx + dz * fz, lat = Math.abs(dx * fz - dz * fx); if (along > 0.3 && along < 2.4 && lat < 0.9) { v.hold = true; break; } }
    if (v.hold) { v.holdT = (v.holdT || 0) + STEP_POP; if (v.holdT > 5) { v.hold = false; v.holdT = 0; } } else v.holdT = 0; }
}
const STEP_POP = 1 / 60;
// ================================================================= walk-behind operators: pull in front when travelling, push when positioning
function walkBehindPose(v) {
  const op = v.obj.userData.operator; if (!op) return; const pulling = (v.sv || 0) < -0.05;
  const tgt = pulling ? Math.PI : 0; op.rotation.y += Math.atan2(Math.sin(tgt - op.rotation.y), Math.cos(tgt - op.rotation.y)) * 0.12;
  op.position.z += ((pulling ? -0.35 : 0) - op.position.z) * 0.12;
  const ud = v.obj.userData; if (v.isJack && !ud.isPumping()) ud.setHandleAngle(Math.abs(v.sv || 0) > 0.05 ? -0.55 : -0.28);
  if (ud.setTiller) ud.setTiller(Math.abs(v.sv || 0) > 0.05 ? -0.95 : -0.7);
}
// ================================================================= per-step update
function popStep(dt) {
  proximityHolds();
  tugStep(dt); for (const m of YT) purePursuit(m, dt, 3.2, 4.5);
  for (const m of POP.movers) m.obj.userData.update && m.obj.userData.update(dt, SIMT);
  for (const v of POP.veh) if (v.walkBehind) walkBehindPose(v);
  for (const p of POP.peds) { pedStep(p, dt); p.o.userData.update && p.o.userData.update(dt, SIMT); postPedPose(p); }
  for (const p of POP.walkers.slice()) { p.step(dt); }
  for (let i = POP.conv.length - 1; i >= 0; i--) { const c = POP.conv[i]; c.m.position.z -= 0.6 * dt; const y = 31 - c.m.position.z; if (y > 43.6) { c.m.position.y -= 0.6 * dt; if (y > 44.2) { world.remove(c.m); POP.conv.splice(i, 1); } } }
  // B29: nothing moves without a person driving it
  for (const m of POP.movers) if (m.ds > 1e-5 && !isManned(m.obj)) { ASSERT.unmanned = (ASSERT.unmanned || 0) + 1; console.warn('[ASSERT] unmanned-motion ' + m.id); }
  for (const v of VEH) if (Math.abs(v.ds || 0) > 1e-5 && !isManned(v.obj)) { ASSERT.unmanned = (ASSERT.unmanned || 0) + 1; console.warn('[ASSERT] unmanned-motion ' + v.id); }
}
// entity registry for the UI (missions / alerts / inspector come from these live objects)
const ENTITIES = () => [...VEH.map((v) => ({ id: v.id, type: v.type, state: v.state, task: v.task, obj: v.obj })), ...POP.movers.map((m) => ({ id: m.id, type: m.type, state: m.state, task: m.task, obj: m.obj })), ...POP.peds.map((p) => ({ id: p.id, type: p.role, state: p.state, task: p.task, obj: p.o }))];
window.__ents = ENTITIES;
console.info('[gf] population', { vehicles: VEH.length, movers: POP.movers.length, workers: POP.peds.length });
