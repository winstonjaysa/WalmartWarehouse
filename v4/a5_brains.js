// ======================= BRAINS (one generator per person) =======================
const HAND = [0, 1.1, 0.38];
function boxPos(b) {
  if (b.st === 'skid') { const sk = b.sk; const [x, z] = skidWorld(sk, b.lx, b.lz); return [x, sk.y + PAL_H + b.ly + b.h / 2, z, sk.ry + b.lry]; }
  if (b.st === 'roller') return [ROLLER.x, rollerY(b.rz) + b.h / 2 + 0.01, b.rz, 0];
  if (b.st === 'carry') { const w = b.carrier; const [fx, fz] = fwd(w.yaw); const up = w.pose === 'reachHi' ? 0.35 : (w.pose === 'bend' ? -0.45 : 0); return [w.x + fx * HAND[2], w.y + HAND[1] + up, w.z + fz * HAND[2], w.yaw]; }
  return [b.x, b.y, b.z, b.ry];
}
const caseM = () => ({ w: 0.36 + rnd() * 0.2, h: 0.24 + rnd() * 0.16, d: 0.42 + rnd() * 0.16 });
const caseS = () => ({ w: 0.26, h: 0.2 + rnd() * 0.1, d: 0.38, col: KRAFT[(rnd() * 6) | 0] });
const ALLD = WEST_DEPTS.map((d, i) => ({ d, side: 'W', i })).concat(EAST_DEPTS.map((d, i) => ({ d, side: 'E', i })));
let DSK = {}; // dept -> skid
function assignDept(b) { const t = ALLD[(rnd() * ALLD.length) | 0]; b.dept = t.d; const z = SKID_Z[t.i]; const st = t.side === 'W' ? (z > 1 ? 'WN' : 'WS') : (z > 1 ? 'EN' : 'ES'); b.stn = st; b.stop = STN[st].z; }
function toRoller(b, z) { assignDept(b); putOnRoller(b, z); }
function updateRoller() {
  const rb = BX.filter((b) => b.st === 'roller').sort((a, b) => a.rz - b.rz); let prev = null;
  for (const b of rb) { b.v = Math.min(0.8, b.v + 1.5 * DT); let t = b.rz - b.v * DT; let lim = ROLLER.zTail + 0.4;
    if (b.stop != null && b.rz >= b.stop - 0.001) lim = Math.max(lim, b.stop);
    if (prev) lim = Math.max(lim, prev.rz + (prev.d + b.d) / 2 + 0.04);
    if (t < lim) { t = Math.max(Math.min(b.rz, lim), Math.min(b.rz, t)); if (t <= lim) { t = Math.min(b.rz, lim); b.v = 0; } }
    b.rz = t; prev = b; }
}
const BRAINS = []; // [worker, generator]
function brain(w, g) { BRAINS.push({ w, g }); }
const ROLES = []; // html label targets {w, text}
function role(w, text) { ROLES.push({ w, text }); w.role = text; return w; }
let FLAGS = {}, NIGHTN = 0, PHSK = null, BEVCUR = null, MILKCUR = null;

function initSim() {
  W.length = 0; BX.length = 0; SK.length = 0; CT.length = 0; GA.length = 0; OT.length = 0; BRAINS.length = 0; ROLES.length = 0; FLAGS = {}; T = 0; DSK = {};
  JK.length = 0; for (const h of HOLES) h.used = false; seed(7);
  // ---- department skids around the roller ----
  WEST_DEPTS.forEach((d, i) => { const s = mkSkid({ x: 5.6, z: SKID_Z[i], col: PCOL[i % 4], dept: d }); fillSkid(s, 3 + ((rnd() * 6) | 0), caseM); DSK[d] = s; });
  EAST_DEPTS.forEach((d, i) => { const s = mkSkid({ x: 10.4, z: SKID_Z[i], col: PCOL[(i + 1) % 4], dept: d }); fillSkid(s, 3 + ((rnd() * 6) | 0), caseM); DSK[d] = s; });
  // ---- trailer B: floor-loaded cases (hand-unloaded onto the roller head) ----
  const COLS = []; for (let r = 0; r < 10; r++) for (let c = 0; c < 4; c++) { const col = { x: DOORS.B.x - 0.84 + c * 0.56, z: 16.4 + r * 0.6, r, stack: [] }; let y = 0; const nh = r === 0 ? 3 : 6; for (let k = 0; k < nh; k++) { const sz = { w: 0.5, h: 0.3 + rnd() * 0.08, d: 0.54 }; const b = mkBox(Object.assign(sz, { x: col.x + (rnd() - 0.5) * 0.03, z: col.z, y: y + sz.h / 2, ry: (rnd() - 0.5) * 0.05 })); y += sz.h; col.stack.push(b); } COLS.push(col); }
  // ---- trailer A: wrapped mixed skids (~1.9 m) ----
  const wrapped = []; for (const [x, z] of [[-4.45, 13.5], [-4.45, 15.1], [-4.45, 16.7], [-4.45, 18.3], [-4.45, 19.9]]) { const s = mkSkid({ x, z, col: PCOL[(rnd() * 4) | 0], wrapped: true }); while (skidTopY(s) < 1.62) { const b = mkBox(caseM()); attachToSkid(b, s, 0.05); } s.wrapH = skidTopY(s) + 0.04; s.wrap0 = s.wrapH; { const wi = wrapped.length; s.inky = INKY_WR[wi] || (INKY_WR[wi] = buildWrapped(THREE, PM, { seed: 11 + wrapped.length * 7, height: 1.9, palletColor: s.col === COL.blue || s.col === COL.chep ? 'blue' : (s.col === COL.red ? 'red' : 'natural') })); if (!s.inky.parent) scene.add(s.inky); } wrapped.push(s); }
  // one skid already at breakdown spot 1 (wrap cut, being worked)
  const BD = [{ x: 4.6, z: 9.6 }, { x: 4.6, z: 11.0 }];
  const bd1 = mkSkid({ x: BD[0].x, z: BD[0].z, ry: Math.PI / 2, col: COL.blue }); fillSkid(bd1, 14, caseM);
  const empties = []; for (let i = 0; i < 3; i++) { const e = mkSkid({ x: -1.4, z: 10.6, y: i * PAL_H, ry: Math.PI / 2, col: i ? COL.chep : COL.red }); empties.push(e); }
  // ---- jacks ----
  const jPull = mkJack({ x: -2.4, z: 9.0, yaw: 0 }), jF1 = mkJack({ x: 13, z: -3.4, yaw: 0 }), jF2 = mkJack({ x: 15, z: -3.4, yaw: 0 }), jBev = mkJack({ x: -16.5, z: 10.6, yaw: Math.PI }), jSn = mkJack({ x: -11.5, z: 10.6, yaw: Math.PI });
  // (v4.3) no unattended spare jacks: every jack on screen has a person at its handle or gets stowed out of the way

  // ===== 1. UNLOADER (Stocking 2) — floor-loaded trailer B to the roller head =====
  const un = role(mkWorker({ x: DOORS.B.x, z: 15.6, yaw: 0, torso: COL.st2 }), 'Stocking 2 · unloading');
  brain(un, (function* () { for (;;) { let col = null, best = -1; for (const c of COLS) if (c.stack.length) { const sc = -c.r * 10 + c.stack.length; if (sc > best) { best = sc; col = c; } } if (!col) { yield* wait(un, 1); continue; }
    yield* walkTo(un, col.x, col.z - 0.72); const b = col.stack[col.stack.length - 1]; yield* pick(un, b, () => col.stack.pop());
    yield* walkTo(un, DOORS.B.x + 0.78, 15.4); yield* face(un, DOORS.B.x, 15.0); // beside the roller head, not on it yield* until(un, () => rollerFree(15.0, 0.6), 'carry');
    yield* placeAt(un, b, () => toRoller(b, 15.0), 0.84); } })());
  // ===== 2. PULLER (Stocking 2) — wrapped skids out of trailer A, cut wrap, clear empties =====
  const pu = role(mkWorker({ x: -2.4, z: 7.6, yaw: 0, torso: COL.st2 }), 'Stocking 2 · pulling skids');
  const bdSk = [bd1, null];
  brain(pu, (function* () { let wi = 0, emptyN = empties.length; yield* wait(pu, 11);
    for (;;) { // pick a free breakdown spot, clearing an empty pallet first if needed
      let si = bdSk.findIndex((s) => !s); if (si < 0) { const ei = bdSk.findIndex((s) => s && !s.boxes.length && !s.wrapped); if (ei < 0) { yield* wait(pu, 1); continue; }
        const e = bdSk[ei]; yield* jackFetch(pu, jPull, e, -Math.PI / 2, [[e.x - 3.2, e.z]]); yield* jackPull(pu, jPull, [[-0.2, e.z], [-0.6, 10.6]]);
        // set the empty pallet down onto the empties stack
        jPull.lift = 0; e.y = emptyN * PAL_H; syncJackSkid(jPull); const fe = jPull.skid; yield* jackRelease(pu, jPull); fe.y = emptyN * PAL_H; emptyN++; yield* jackBackOut(pu, jPull, 1.5); bdSk[ei] = null; si = ei; }
      if (wi >= wrapped.length) { yield* wait(pu, 2); continue; }
      const sk = wrapped[wi++]; const tz = BD[si].z;
      yield* jackFetch(pu, jPull, sk, Math.PI, [[sk.x, 9.0], [sk.x, 10.5]]);
      yield* jackPull(pu, jPull, [[sk.x, 10.2], [sk.x + 1.2, tz], [BD[si].x + 2.25, tz]]);
      yield* jackRelease(pu, jPull); yield* jackBackOut(pu, jPull, 1.4);
      // cut the stretch wrap: walk around the skid with the safety cutter while the film comes off
      bdSk[si] = sk; yield* jackStow(pu, jPull, [[1.6, tz], [-0.4, 9.0], [-2.4, 9.0]]); } })()); // (v4.4) the breakdown associate cuts the film while the puller goes back with the jack
  // ===== 3. BREAKDOWN (Stocking 2) — top cases off the skid onto the roller =====
  const bk = role(mkWorker({ x: 6.6, z: 9.6, yaw: Math.PI / 2, torso: COL.st2 }), 'Stocking 2 · breaking down');
  brain(bk, (function* () { for (;;) { const ws = bdSk.find((x) => x && x.wrapped);
    if (ws) { const R = 1.0; let a = 0; yield* walkTo(bk, ws.x + R, ws.z); while (a < Math.PI * 2.2) { a += DT * 0.55; bk.x = ws.x + Math.cos(a) * R; bk.z = ws.z + Math.sin(a) * R; bk.yaw = yawTo(ws.x - bk.x, ws.z - bk.z); bk.pose = 'cut'; bk.ph += DT * 3; ws.wrapH = a < Math.PI * 1.3 ? ws.wrap0 : Math.max(0, ws.wrap0 * (1 - (a - Math.PI * 1.3) / (Math.PI * 0.9))); yield; } ws.wrapped = false; continue; }
    const s = bdSk.filter((x) => x && !x.wrapped && x.boxes.length).sort((a, b) => a.boxes.length - b.boxes.length)[0]; if (!s) { yield* wait(bk, 1); continue; }
    yield* walkTo(bk, s.x + 0.98, s.z); let top = s.boxes.reduce((m, b) => b.ly > m.ly ? b : m, s.boxes[0]); yield* pick(bk, top, () => { detachTop(s); });
    const dz = clamp(s.z, 9.2, 11.2); yield* walkTo(bk, 7.15, dz); yield* face(bk, 8, dz); yield* until(bk, () => rollerFree(dz, 0.62), 'carry'); yield* placeAt(bk, top, () => toRoller(top, dz), 0.84); } })());
  // ===== 4. SORTERS (Stocking 2) — off the roller onto department skids =====
  for (const [k, st] of Object.entries(STN)) { const so = role(mkWorker({ x: st.x, z: st.z, yaw: st.x < 8 ? Math.PI / 2 : -Math.PI / 2, torso: COL.st2 }), k === 'WN' ? 'Stocking 2 · sorting by dept' : '');
    brain(so, (function* () { for (;;) { let b = null; yield* until(so, () => (b = BX.find((x) => x.st === 'roller' && x.stn === k && Math.abs(x.rz - st.z) < 0.05)));
      yield* pick(so, b); const sk = DSK[b.dept]; const ax = sk.x < 8 ? sk.x + 0.95 : sk.x - 0.95; yield* walkTo(so, ax, sk.z); yield* placeOnSkid(so, b, sk); yield* walkTo(so, st.x, st.z); yield* face(so, 8, st.z); } })()); }
  // ===== 5. SKIDS TO THE FLOOR (Stocking 3) — one person per skid, two for the big one =====
  const R46 = mkSkid({ x: 13, z: -6.5, col: COL.blue, dept: 46 }); fillSkid(R46, 9, caseS);
  const R92 = mkSkid({ x: 15, z: -6.5, col: COL.chep, dept: 92 }); fillSkid(R92, 22, caseM);
  const R13 = mkSkid({ x: 17, z: -6.5, col: COL.red, dept: 13 }); fillSkid(R13, 12, caseM);
  const f1 = role(mkWorker({ x: 13, z: -1.6, yaw: Math.PI, torso: COL.st3 }), 'Stocking 3 · Dept 46 skid (1 person)');
  brain(f1, (function* () { yield* wait(f1, 48); yield* jackFetch(f1, jF1, R46, 0); yield* jackPull(f1, jF1, [[13, -1.0], [16.5, 0], [21.5, 0], [24.2, -5.25], [32.0, -5.25]]); yield* jackRelease(f1, jF1); yield* jackBackOut(f1, jF1, 1.6); yield* jackStow(f1, jF1, [[25.0, -5.25], [21.5, 0], [19.2, 6.4]]);
    yield* stockLoop(f1, R46, -5.25); })());
  const f2 = role(mkWorker({ x: 15, z: -1.6, yaw: Math.PI, torso: COL.st3 }), 'Stocking 3 · Dept 92 (big skid, 2 people)');
  const f2h = role(mkWorker({ x: 16.2, z: -1.4, yaw: Math.PI, torso: COL.st3 }), '');
  brain(f2h, (function* () { yield* until(f2h, () => R92.jack); while (!FLAGS.r92done) { const [fx, fz] = fwd(R92.ry + Math.PI / 2); const tx = R92.x + fx * 0.95, tz = R92.z + fz * 0.95; const d = Math.hypot(tx - f2h.x, tz - f2h.z); if (d > 0.05) { const st = Math.min(d, 1.4 * DT); f2h.x += (tx - f2h.x) / d * st; f2h.z += (tz - f2h.z) / d * st; f2h.ph += st * 4.2; f2h.pose = 'push'; f2h.yaw = R92.ry + Math.PI; } else f2h.pose = 'push'; yield; } yield* stockLoop(f2h, R92, -5.25, 1); })());
  brain(f2, (function* () { yield* wait(f2, 9); yield* jackFetch(f2, jF2, R92, 0); yield* jackPull(f2, jF2, [[15, -1.0], [18.5, 0], [38.6, 0], [39.6, -5.25], [48.3, -5.25]], 0.8); FLAGS.r92done = true; yield* jackRelease(f2, jF2); yield* jackBackOut(f2, jF2, 1.6); yield* jackStow(f2, jF2, [[38.8, -3.0], [38.6, 0], [21.5, 0], [19.2, 7.9]]); yield* stockLoop(f2, R92, -5.25); })());
  // ===== 6. OVERNIGHT STOCKING (Stocking 3) — fill the holes on the shelves =====
  const S2 = mkSkid({ x: 30.0, z: 5.25, ry: Math.PI / 2, col: COL.blue, dept: 2 }); fillSkid(S2, 14, caseS);
  const S4 = mkSkid({ x: 46.0, z: 8.75, ry: Math.PI / 2, col: COL.red, dept: 4 }); fillSkid(S4, 14, caseS);
  const s1 = role(mkWorker({ x: 29, z: 4.6, yaw: 0, torso: COL.st3 }), 'Stocking 3 · overnight stocking'); brain(s1, (function* () { yield* wait(s1, 40); yield* stockLoop(s1, S2, 5.25); })());
  const s2 = role(mkWorker({ x: 45, z: 8.0, yaw: 0, torso: COL.st3 }), ''); brain(s2, stockLoop(s2, S4, 8.75));
  // ===== 7. DSD: beverage vendor + receiver check-in =====
  const recv = role(mkWorker({ x: -18.7, z: 7.6, yaw: -Math.PI / 2, torso: COL.dsd, tool: true }), 'DSD associate · receiving');
  const POPSK = POPS.map((g, i) => mkSkid({ x: DOORS.DSD.x, z: 13.0 + i * 1.3, y: 0.0, col: COL.blue, grp: g, pop: true }));
  const bev = role(mkWorker({ x: -16.5, z: 9.2, yaw: Math.PI, torso: COL.bev }), 'Beverage vendor');
  const checkQ = [];
  function* checkIn(w, sk, label, pose = 'idle') { const req = { sk, done: false, label }; checkQ.push(req); yield* until(w, () => req.done, pose); }
  brain(bev, (function* () { yield* wait(bev, 1.5);
    for (let i = 0; i < POPSK.length; i++) { const sk = POPSK[i]; yield* jackFetch(bev, jBev, sk, Math.PI, i ? [[DOORS.DSD.x, 10.8]] : []);
      yield* jackPull(bev, jBev, [[DOORS.DSD.x, 9.4], [-15.6, 6.2]]);
      yield* jackGrab(bev, jBev); yield* checkIn(bev, sk, 'pop', 'push'); // vendor keeps a hand on the jack while the skid is checked
      yield* jackPull(bev, jBev, [[-14.8, 4.2], [-13.6, 3.2 - i * 1.4]]); yield* jackRelease(bev, jBev); yield* jackBackOut(bev, jBev, 1.4); }
    yield* jackStow(bev, jBev, [[-15.0, 6.4], [-16.3, 9.2]]); for (;;) yield* wait(bev, 5, 'pull'); })());
  // ===== 8. SNACK vendor (reverses in, then pulls a skid) =====
  const SNK = mkSkid({ x: 0, z: 0, col: COL.nat, follow: SNACK.trailer, grp: SNACKS[0] }); const SNC = mkSkid({ x: 0, z: 0, col: COL.nat, follow: SNACK.trailer, flz: -5.4, grp: SNACKS[1] });
  const snd = mkWorker({ x: 0, z: 0, torso: COL.snk, sit: true }); snd.seatOf = SNACK.tractor; snd.seat = [0.55, 2.62, 1.9];
  const snv = role(mkWorker({ x: -11.5, z: 9.0, yaw: Math.PI, torso: COL.snk }), 'Snack vendor');
  brain(snv, (function* () { yield* until(snv, () => snackV.phase === 'docked' && snackV.doors >= 1);
    SNK.follow = null; yield* jackFetch(snv, jSn, SNK, Math.PI, []); yield* jackPull(snv, jSn, [[-11.5, 9.0], [-12.6, 6.6]]);
    yield* jackGrab(snv, jSn); yield* checkIn(snv, SNK, 'snack', 'push'); yield* jackPull(snv, jSn, [[-12.4, 3.2], [-11.0, 1.2]]); yield* jackRelease(snv, jSn); yield* jackBackOut(snv, jSn, 1.4); yield* jackStow(snv, jSn, [[-11.5, 6.0], [-11.5, 13.4]]);
    // second stack rides a wire case cart: wheel it out of the trailer and onto the sales floor
    yield* walkTo(snv, -11.5, 12.6); yield* walkTo(snv, SNC.x, SNC.z - 0.8); SNC.follow = null; SNC.y = 0; yield* pushCart(snv, SNC, [[-11.5, 9.0], [-12.0, -6.6], [-6.0, -7.9], [18.6, -7.9], [18.6, -1.2], [24.0, 0]]); yield* walkTo(snv, SNC.x - 1.2, SNC.z); for (;;) yield* wait(snv, 5); })());
  // ===== FDS milk: 5 crate skids deep in trailer A, jacked into the walk-in cooler once the wrapped skids are out =====
  const MSK = [[0.6, -16.0], [-0.8, -16.0], [-2.2, -16.0], [-1.6, 2.6], [0.3, 2.6], [-6.4, -16.0]].map(([x, z], i) => mkSkid({ x, z, col: COL.blue, grp: i < 5 ? MILK[i] : EGGS[0], milk: i < 5, eggs: i >= 5 }));
  const mk = role(mkWorker({ x: -3.0, z: 9.6, yaw: 0, torso: COL.st2 }), 'Stocking 2 · milk & eggs to cooler');
  const jMk = mkJack({ x: -2.2, z: 10.6, yaw: 0 });
  const CPARK = [0.6, -0.8, -2.2, -3.6, -5.0, -6.4];
  MILKCUR = MSK[3]; // earlier in the night: 3 milk skids + the egg pallet already parked in the cooler; the last 2 milk skids wait on the dock floor
  brain(mk, (function* () { yield* wait(mk, 40);
    for (const i of [3, 4]) { const sk = MSK[i], px = CPARK[i]; MILKCUR = sk;
      yield* jackFetch(mk, jMk, sk, Math.PI, i === 3 ? [[-3.0, 8.0], [-3.0, 0.2]] : [[-3.6, -9.0], [-3.6, 0.0]]);
      yield* jackPull(mk, jMk, [[sk.x, sk.z - 1.0], [-3.6, sk.z - 2.2], [-3.6, -11.2], [-3.6, -13.0], [px, -13.3], [px, -16.0]]); yield* jackRelease(mk, jMk); yield* jackBackOut(mk, jMk, 0.3);
      yield* walkTo(mk, px + (px < -3.6 ? 0.85 : -0.85), -16.1); yield* walkTo(mk, px + (px < -3.6 ? 0.85 : -0.85), -13.0); yield* walkTo(mk, -3.6, -11.0); }
    yield* jackGrab(mk, jMk); yield* jackStow(mk, jMk, [[-3.6, -12.2], [-3.6, -10.4], [-12.8, -10.6]]); yield* walkTo(mk, -3.0, 9.6); for (;;) yield* wait(mk, 5); })());
  // ===== 9. PHARMACY: wrapped McKesson tote pallet (2 or 3 layers, alternating nights). Jacked to the pharmacy, wrap cut, totes counted against the memo, signed =====
  NIGHTN = (NIGHTN | 0) + 1; for (const g of MCP) g.visible = false; const MG = MCP[NIGHTN % 2]; MG.visible = true; for (const m of MG.userData.wrap) { m.visible = true; m.scale.set(1, 1, 1); }
  const PH = mkSkid({ x: -17.6, z: 5.6, ry: Math.PI / 2, col: COL.blue, grp: MG, pharm: true });
  FLAGS.pharmSigned = true; PHSK = PH;
  brain(recv, (function* () {
    for (;;) { const qi = checkQ.findIndex((r) => r.sk.pop); const q = qi > 0 ? checkQ.splice(qi, 1)[0] : checkQ.shift(); if (!q) { yield* walkTo(recv, -18.75, 7.6); yield* face(recv, -19.6, 7.6); yield* wait(recv, 0.5, 'idle'); continue; }
      const s = q.sk; if (s.pop && s.grp && s.grp.userData.wrapped) { BEVCUR = s; const wm = s.grp.userData.wrap; const R = 1.05; let a = 0; yield* walkTo(recv, s.x + R, s.z); while (a < Math.PI * 2.1) { a += DT * 0.9; recv.x = s.x + Math.cos(a) * R; recv.z = s.z + Math.sin(a) * R; recv.yaw = yawTo(s.x - recv.x, s.z - recv.z); recv.pose = 'reach'; if (wm) wm.scale.y = Math.max(0.24, 1 - a / (Math.PI * 2.1)); yield; } bevSetWrapped(s.grp, false); if (wm) { wm.visible = true; wm.scale.y = 0.24; } FLAGS.bevUnwrapped = (FLAGS.bevUnwrapped | 0) + 1; }
      const p = approach(s, -18, s.z + 0.3, 1.0); yield* walkTo(recv, p[0], p[1]); yield* face(recv, s.x, s.z); recv.scanning = true; yield* wait(recv, 7, 'scan');
      const p2 = approach(s, s.x + 1, s.z - 1, 1.0); yield* walkTo(recv, p2[0], p2[1]); yield* face(recv, s.x, s.z); yield* wait(recv, 4, 'scan'); recv.scanning = false;
      yield* walkTo(recv, -18.75, 7.6); yield* face(recv, -19.6, 7.6); yield* wait(recv, 3, 'reach'); q.done = true; } })());
  const run = role(mkWorker({ x: -15.6, z: 4.2, yaw: Math.PI, torso: COL.st2 }), 'Pharmacy pallet · jack to pharmacy');
  const jPh = mkJack({ x: -15.2, z: 3.0, yaw: Math.PI / 2 });
  brain(run, (function* () { yield* wait(run, 3);
    yield* jackFetch(run, jPh, PH, Math.PI / 2); yield* jackPull(run, jPh, [[-17.0, -6.6], [-12, -7.9], [18.6, -7.9], [18.6, -1.2], [21.5, 0], [56, 0], [58.6, -10.4]], 0.9); yield* jackRelease(run, jPh); yield* jackBackOut(run, jPh, 1.4); yield* jackStow(run, jPh, [[57.4, -4.0], [56.0, 0.6], [53.8, 0.9]]);
    // cut the wrap first (walk round with the safety cutter), then count totes against the memo and sign
    const R = 1.05; let a = 0; yield* walkTo(run, PH.x + R, PH.z); while (a < Math.PI * 2.1) { a += DT * 0.9; run.x = PH.x + Math.cos(a) * R; run.z = PH.z + Math.sin(a) * R; run.yaw = yawTo(PH.x - run.x, PH.z - run.z); run.pose = 'reach'; const f = Math.max(0.02, 1 - a / (Math.PI * 2.1)); for (const m of MG.userData.wrap) m.scale.set(1, f, 1); yield; }
    for (const m of MG.userData.wrap) m.visible = false;
    yield* walkTo(run, PH.x + 0.95, PH.z + 0.3); yield* face(run, PH.x, PH.z); yield* wait(run, 4, 'scan'); yield* wait(run, 2, 'reach'); FLAGS.pharmCounted = true;
    for (;;) yield* wait(run, 5); })());
  // ===== 10. BALER (morning pre-op checks, then cardboard) =====
  const sheets = []; for (let i = 0; i < 10; i++) sheets.push(mkBox({ w: 1.0, h: 0.03, d: 0.72, x: -16.9, y: 1.02 + i * 0.031, z: -1.4, ry: (rnd() - 0.5) * 0.1, col: KRAFT[i % 3], flat: true }));
  const bal = role(mkWorker({ x: -16.0, z: -4.5, yaw: -Math.PI / 2, torso: COL.st2, tool: true }), 'Baler & compactor pre-op');
  brain(bal, (function* () { const door = BALER.userData.pivots.door, platen = BALER.userData.pivots.platen;
    yield* walkTo(bal, -17.6, -3.2); yield* face(bal, -19.4, -3.2); FLAGS.preop = 'baler'; yield* wait(bal, 4, 'scan');
    yield* walkTo(bal, -17.4, 1.2); yield* face(bal, -20, 1.2); FLAGS.preop = 'compactor'; yield* wait(bal, 4, 'scan'); FLAGS.preop = 'done';
    let n = 0; for (;;) { const sh = sheets.filter((s) => s.st === 'free').pop(); if (!sh) { yield* wait(bal, 2); continue; }
      yield* walkTo(bal, -16.9, -0.62); yield* face(bal, -16.9, -1.4); yield* pick(bal, sh); yield* walkTo(bal, -17.55, -3.2); yield* face(bal, -19.4, -3.2);
      if (n % 3 === 0) { let e = 0; while (e < 1) { e += DT; door.rotation.y = -1.5 * ease(Math.min(1, e)); bal.pose = 'reach'; yield; } }
      yield* placeAt(bal, sh, () => { sh.st = 'gone'; }, 1.0); n++;
      if (n % 3 === 0) { let e = 0; while (e < 1) { e += DT; door.rotation.y = -1.5 * (1 - ease(Math.min(1, e))); bal.pose = 'reach'; yield; } const r = BALER.userData.platenRange || [0, 1]; e = 0; while (e < 5) { e += DT; const k = Math.sin(Math.min(1, e / 5) * Math.PI); if (platen) platen.position.y = lerp(r[1] ?? 1, r[0] ?? 0, k); bal.pose = 'reach'; yield; } } } })());
  // ===== 11. OMNI (OGP) — staging picked totes =====
  const ocart = { x: 30, z: 1.4, yaw: -Math.PI / 2, kind: 'ogp' }; CT.push(ocart);
  const ogp = []; for (let i = 0; i < 4; i++) ogp.push({ on: ocart, lx: (i % 2 - 0.5) * 0.0, ly: 0.2 + ((i / 2) | 0) * 0.57, lz: (i % 2 - 0.5) * 0.5, st: 'cart', x: 0, y: 0, z: 0, ry: 0, ogp: true }); OT.push(...ogp);
  const shelfSlots = []; for (const x of [12.9, 13.6, 14.3, 15.0, 15.7, 16.4, 17.1, 17.8]) for (const y of [0.62, 1.17]) shelfSlots.push({ x, y, z: 11.45, used: false });
  const om = role(mkWorker({ x: 30 + 0.85, z: 1.4, yaw: -Math.PI / 2, torso: COL.omni, tool: true }), 'OMNI customer fulfillment');
  brain(om, (function* () { for (;;) { ocart.by = om; for (const p of [[22, 0.6], [18.6, 0.8], [16.0, 6.0], [15.4, 9.9]]) yield* cartPush(om, ocart, p); ocart.by = null;
      for (const t of ogp) { if (t.st !== 'cart') continue; yield* face(om, ocart.x, ocart.z); yield* wait(om, 0.5, 'reach'); t.st = 'carry'; t.carrier = om; om.carry = t; const sl = shelfSlots.find((s) => !s.used); if (!sl) break; sl.used = true; yield* walkTo(om, sl.x, 10.75); yield* face(om, sl.x, 12); yield* placeAt(om, t, () => { t.st = 'free'; t.x = sl.x; t.y = sl.y; t.z = sl.z - 0.15; t.ry = Math.PI / 2; }, sl.y); yield* walkTo(om, ocart.x - 0.6, ocart.z + 0.5); }
      yield* wait(om, 1); yield* walkTo(om, ocart.x + Math.sin(ocart.yaw + Math.PI) * -0.85, ocart.z + Math.cos(ocart.yaw + Math.PI) * -0.85); ocart.by = om;
      for (const p of [[16.0, 6.0], [18.6, 0.8], [22, 0.6], [34, 1.4]]) yield* cartPush(om, ocart, p); ocart.by = null; yield* wait(om, 3, 'reach'); for (const t of ogp) if (t.st === 'free') { /* stays staged */ }
      for (;;) yield* wait(om, 4, 'idle'); } })());
  // ===== 12. FASHION — hang garments on Z-racks =====
  const FC = mkSkid({ x: 13.4, z: -9.7, col: COL.blue, dept: 34 }); fillSkid(FC, 4, () => ({ w: 0.6, h: 0.42, d: 0.5 }));
  const hangs = []; for (const r of ZR) for (let i = 0; i < 18; i++) hangs.push({ x: r.x - 0.85 + i * 0.1, y: 1.72, z: r.z, used: i < 5 });
  for (const h of hangs) if (h.used) GA.push({ x: h.x, y: h.y, z: h.z, col: KRAFT[6 + ((rnd() * 4) | 0)], st: 'hung' });
  const fa = role(mkWorker({ x: 14.4, z: -9.7, yaw: -Math.PI / 2, torso: COL.omni }), 'Fashion · hanging apparel');
  brain(fa, (function* () { for (;;) { const h = hangs.find((x) => !x.used); if (!h) { yield* wait(fa, 3); continue; }
      yield* walkTo(fa, 14.35, -9.7); yield* face(fa, FC.x, FC.z); yield* wait(fa, 0.8, 'bend'); const g = { x: 0, y: 0, z: 0, col: [C('#c0392b'), C('#2e4053'), C('#f5f5f5'), C('#7d3c98'), C('#117a65')][(rnd() * 5) | 0], st: 'carry', carrier: fa }; GA.push(g); fa.carry = g;
      yield* walkTo(fa, h.x, h.z + (h.z < -9.7 ? 0.55 : -0.55)); yield* face(fa, h.x, h.z); yield* placeAt(fa, g, () => { g.st = 'hung'; g.x = h.x; g.y = h.y; g.z = h.z; h.used = true; }, 1.8); } })());
  // ===== 13. CLAIMS — damaged / returns into the cage =====
  const ccart = { x: -13.6, z: -9.8, yaw: 0, kind: 'claims' }; CT.push(ccart);
  const claimItems = []; for (let i = 0; i < 5; i++) { const b = mkBox({ w: 0.42, h: i === 4 ? 0.08 : 0.3, d: i === 4 ? 0.3 : 0.4, col: i === 4 ? C('#f2f2f2') : KRAFT[(i * 3) % 6], x: -13.6 + (i % 2 - 0.5) * 0.25, y: 0.95 + ((i / 2) | 0) * 0.31, z: -9.8 + ((i % 3) - 1) * 0.3, ry: (rnd() - 0.5) * 0.4, damaged: i < 3 }); claimItems.push(b); }
  const cl = role(mkWorker({ x: -13.6, z: -8.7, yaw: Math.PI, torso: COL.dsd, tool: true }), 'Claims & returns');
  brain(cl, (function* () { let k = 0; for (const b of claimItems) { yield* walkTo(cl, -13.6, -8.9); yield* pick(cl, b); yield* wait(cl, 1.6, 'scan'); yield* walkPath(cl, [[-15.85, -7.9], [-15.85, -9.0], [-18.6 + (k % 3) * 0.7, -10.8]]); yield* face(cl, cl.x, -12);
      const sx = -18.6 + (k % 3) * 0.7, sy = 0.5 + ((k / 3) | 0) * 0.5; yield* placeAt(cl, b, () => { b.st = 'free'; b.x = sx; b.y = sy + b.h / 2; b.z = -11.5; b.ry = 0; }, sy); k++; yield* walkPath(cl, [[-15.85, -9.0], [-15.85, -7.9]]); }
    for (;;) yield* wait(cl, 5, 'scan'); })());
  // ===== drivers =====
  for (const s of DRIVER_SEATS) mkWorker({ x: s.x, y: s.y, z: s.z, yaw: s.yaw, sit: true, torso: COL.black });
  const bdrv = mkWorker({ x: 0, z: 0, sit: true, torso: COL.bev }); bdrv.seatOf = BOXT; bdrv.seat = seatOf(BOXT, [0.5, 1.45, 2.45]);
  snackV.phase = 'approach'; snackV.s = 0; snackV.doors = 0; snackV.t0 = 4;
}
function seatOf(o, d) { const sp = o.userData && o.userData.seatPoint; if (sp && sp.object) return { obj: sp.object }; if (sp && sp.position) return [sp.position.x, sp.position.y, sp.position.z]; return Array.isArray(sp) ? sp : d; }
function* stockLoop(w, sk, az, side = 0) { // pick a case off the skid, fill the nearest empty slot facing this aisle
  for (;;) { if (!sk.boxes.length) { yield* wait(w, 3, 'idle'); continue; }
    const hs = HOLES.filter((h) => !h.used && Math.abs(h.z - az) < 1.6 && Math.abs(h.x - sk.x) < 6).sort((a, b) => Math.abs(a.x - sk.x) - Math.abs(b.x - sk.x)); const h = hs[side % Math.max(1, hs.length)] || hs[0]; if (!h) { yield* wait(w, 3, 'idle'); continue; }
    h.used = true; const p = approach(sk, sk.x + (side ? 1 : -1) * 0.2, az + (h.z > az ? 0.6 : -0.6), 0.92); yield* walkTo(w, p[0], p[1]); const top = sk.boxes.reduce((m, b) => b.ly > m.ly ? b : m, sk.boxes[0]); yield* pick(w, top, () => detachTop(sk));
    const sz = az + (h.z > az ? 1 : -1) * 0.95; yield* walkTo(w, h.x, sz); yield* face(w, h.x, h.z); yield* placeAt(w, top, () => { top.st = 'free'; top.x = h.x + 0.05; top.y = h.y + top.h / 2 + 0.02; top.z = h.z; top.ry = 0; }, h.y); }
}
function* cartPush(w, c, p, sp = 1.0) { for (;;) { const dx = p[0] - c.x, dz = p[1] - c.z, d = Math.hypot(dx, dz); if (d < 0.04) break; const ty = yawTo(dx, dz), da = angDiff(c.yaw, ty); c.yaw += clamp(da, -1.8 * DT, 1.8 * DT); const step = Math.min(d, sp * DT * (Math.abs(da) > 0.5 ? 0.3 : 1)); const [fx, fz] = fwd(c.yaw); c.x += fx * step; c.z += fz * step; w.x = c.x - fx * 0.85; w.z = c.z - fz * 0.85; w.yaw = c.yaw; w.ph += step * 4.2; w.pose = 'push'; yield; } }

// ---------------- vehicles ----------------
function updateVehicles() {
  const v = snackV; v.roll += 0;
  if (v.phase === 'approach') { const t = Math.max(0, T - v.t0); const D = 70, dur = 18; const k = Math.min(1, t / dur); const ek = 1 - (1 - k) * (1 - k); const x0 = REV[0].kx + D; const kx = x0 - D * ek; const dx = D * (ek - (v.lastEk || 0)); v.lastEk = ek; v.roll -= dx / 0.5;
    placeTruck(kx, REV[0].kz, -Math.PI / 2, -Math.PI / 2, 0, v.roll); if (k >= 1) { v.phase = 'pause'; v.tp = T; } }
  else if (v.phase === 'pause') { if (T - v.tp > 2) { v.phase = 'reverse'; v.tr = T; } placeTruck(REV[0].kx, REV[0].kz, -Math.PI / 2, -Math.PI / 2, 0, v.roll); }
  else if (v.phase === 'reverse') { const dur = 26; const k = Math.min(1, (T - v.tr) / dur); const ek = k * k * (3 - 2 * k); const s = ek * REV_LEN; let i = 0; while (i < REV.length - 1 && REV[i + 1].s < s) i++; const a = REV[i], b = REV[Math.min(REV.length - 1, i + 1)]; const f = b.s > a.s ? (s - a.s) / (b.s - a.s) : 0;
    const ds = s - (v.lastS || 0); v.lastS = s; v.roll += ds / 0.5;
    placeTruck(lerp(a.kx, b.kx, f), lerp(a.kz, b.kz, f), a.yC + angDiff(a.yC, b.yC) * f, a.yT + angDiff(a.yT, b.yT) * f, lerp(a.steer, b.steer, f), v.roll); if (k >= 1) { v.phase = 'docked'; v.td = T; } }
  else if (v.phase === 'docked') { v.doors = Math.min(1, (T - v.td - 1) / 2.5); const pv = SNACK.trailer.userData.pivots; const a = Math.max(0, v.doors) * 2.55; if (pv.rearDoor_L) { pv.rearDoor_L.rotation.y = -a; pv.rearDoor_R.rotation.y = a; } }
  for (const s of SK) if (s.follow) { const o = s.follow; const [fx, fz] = fwd(o.rotation.y); const lz = s.flz ?? -7.1; s.x = o.position.x + fx * lz; s.z = o.position.z + fz * lz; s.y = o.position.y + 1.25; s.ry = o.rotation.y; }
}
function resetVehicles() { const pv = SNACK.trailer.userData.pivots; if (pv.rearDoor_L) { pv.rearDoor_L.rotation.y = 0; pv.rearDoor_R.rotation.y = 0; } snackV.lastEk = 0; snackV.lastS = 0; snackV.roll = 0; BALER.userData.pivots.door.rotation.y = 0; }
VEH.push(snackV, snackTrailerV, { id: 'beverage-vendor-box-truck', type: 'box-truck', obj: BOXT }, { id: 'walmart-trailer-A', type: 'tractor-trailer', placard: 'FDS' }, { id: 'walmart-trailer-B', type: 'tractor-trailer', placard: 'CP' }, ...YARD.map((y) => ({ id: 'yard-' + y.pl, type: 'tractor-trailer', placard: y.pl })));
function simStep() { updateVehicles(); for (const b of BRAINS) b.g.next(); updateRoller(); T += DT; }
