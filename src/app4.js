// ====================================================================== KINEMATICS (bicycle model, Dubins paths)
// World plane: (X, Z). Model heading th: forward = (sin th, cos th). Dubins frame phi = atan2(dz, dx).
const TAU = Math.PI * 2, mod2 = (a) => ((a % TAU) + TAU) % TAU;
function dubinsWords(a, b, d) {
  const sa = Math.sin(a), sb = Math.sin(b), ca = Math.cos(a), cb = Math.cos(b), cab = Math.cos(a - b), W = [];
  let p2 = 2 + d * d - 2 * cab + 2 * d * (sa - sb); if (p2 >= -1e-9) { p2 = Math.max(0, p2); const tmp = Math.atan2(cb - ca, d + sa - sb); W.push(['LSL', mod2(-a + tmp), Math.sqrt(p2), mod2(b - tmp)]); }
  p2 = 2 + d * d - 2 * cab + 2 * d * (sb - sa); if (p2 >= -1e-9) { p2 = Math.max(0, p2); const tmp = Math.atan2(ca - cb, d - sa + sb); W.push(['RSR', mod2(a - tmp), Math.sqrt(p2), mod2(-b + tmp)]); }
  p2 = -2 + d * d + 2 * cab + 2 * d * (sa + sb); if (p2 >= -1e-9) { p2 = Math.max(0, p2); const p = Math.sqrt(p2), tmp = Math.atan2(-ca - cb, d + sa + sb) - Math.atan2(-2, p); W.push(['LSR', mod2(-a + tmp), p, mod2(-mod2(b) + tmp)]); }
  p2 = d * d - 2 + 2 * cab - 2 * d * (sa + sb); if (p2 >= -1e-9) { p2 = Math.max(0, p2); const p = Math.sqrt(p2), tmp = Math.atan2(ca + cb, d - sa - sb) - Math.atan2(2, p); W.push(['RSL', mod2(a - tmp), p, mod2(b - tmp)]); }
  let t = (6 - d * d + 2 * cab + 2 * d * (sa - sb)) / 8; if (Math.abs(t) <= 1) { const p = mod2(TAU - Math.acos(t)), tt = mod2(a - Math.atan2(ca - cb, d - sa + sb) + p / 2); W.push(['RLR', tt, p, mod2(a - b - tt + p)]); }
  t = (6 - d * d + 2 * cab + 2 * d * (-sa + sb)) / 8; if (Math.abs(t) <= 1) { const p = mod2(TAU - Math.acos(t)), tt = mod2(-a - Math.atan2(ca - cb, d + sa - sb) + p / 2); W.push(['LRL', tt, p, mod2(mod2(b) - a - tt + p)]); }
  return W;
}
function simDubins(x, y, phi, word, segs, R, step) {
  const pts = [[x, y, phi]];
  for (let k = 0; k < 3; k++) { const ty = word[k], L = segs[k] * R; const n = Math.max(1, Math.ceil(L / step));
    for (let i = 0; i < n; i++) { const ds = L / n;
      if (ty === 'S') { x += Math.cos(phi) * ds; y += Math.sin(phi) * ds; }
      else { const s = ty === 'L' ? 1 : -1, dphi = s * ds / R; x += R * s * (Math.sin(phi + dphi) - Math.sin(phi)); y += -R * s * (Math.cos(phi + dphi) - Math.cos(phi)); phi += dphi; }
      pts.push([x, y, phi]); } }
  return pts;
}
// plan from pose (X,Z,th) to pose; returns Vector3 points (y=0) or null
function dubins(X0, Z0, th0, X1, Z1, th1, R, step = 0.1) {
  const p0 = Math.PI / 2 - th0, p1 = Math.PI / 2 - th1, dx = X1 - X0, dz = Z1 - Z0, D = Math.hypot(dx, dz) / R, th = Math.atan2(dz, dx);
  const a = mod2(p0 - th), b = mod2(p1 - th); let best = null;
  for (const w of dubinsWords(a, b, D)) { const L = w[1] + w[2] + w[3]; if (best && L >= best.L) continue;
    const pts = simDubins(X0, Z0, p0, w[0], [w[1], w[2], w[3]], R, step), e = pts[pts.length - 1]; if (Math.hypot(e[0] - X1, e[1] - Z1) > 0.05) continue; best = { L, pts }; }
  if (!best) return null; return best.pts.map((p) => new THREE.Vector3(p[0], 0, p[1]));
}
class Track { // arc-length polyline with motion heading th[] and curvature k[] (+ = left) per sample
  static prep(t) { const p = t.p, n = p.length; t.h = new Array(n); t.k = new Array(n).fill(0);
    for (let i = 0; i < n; i++) { const a = p[Math.max(0, i - 1)], b = p[Math.min(n - 1, i + 1)]; t.h[i] = Math.atan2(b.x - a.x, b.z - a.z); }
    for (let i = 1; i < n - 1; i++) { const ds = t.c[i + 1] - t.c[i - 1]; if (ds > 1e-6) t.k[i] = Math.atan2(Math.sin(t.h[i + 1] - t.h[i - 1]), Math.cos(t.h[i + 1] - t.h[i - 1])) / ds; }
    if (n > 2) { t.k[0] = t.k[1]; t.k[n - 1] = t.k[n - 2]; } }
  // nearest point to (x,z) searching around segment index i0; returns {s, i, px, pz, h, k}
  project(x, z, i0 = 0) { const p = this.p; let best = null;
    for (let i = Math.max(0, i0 - 4); i < Math.min(p.length - 1, i0 + 30); i++) { const a = p[i], b = p[i + 1], ex = b.x - a.x, ez = b.z - a.z, L2 = ex * ex + ez * ez;
      const u = L2 > 1e-12 ? clamp(((x - a.x) * ex + (z - a.z) * ez) / L2, 0, 1) : 0, px = a.x + ex * u, pz = a.z + ez * u, d = (x - px) ** 2 + (z - pz) ** 2;
      if (!best || d < best.d) best = { d, i, u, px, pz }; }
    const i = best.i, u = best.u; best.s = this.c[i] + u * (this.c[i + 1] - this.c[i]);
    const hd = Math.atan2(Math.sin(this.h[i + 1] - this.h[i]), Math.cos(this.h[i + 1] - this.h[i])); best.h = this.h[i] + hd * u; best.k = this.k[i] + (this.k[i + 1] - this.k[i]) * u; return best; }

  constructor(pts) { this.p = pts; this.c = [0]; for (let i = 1; i < pts.length; i++) this.c.push(this.c[i - 1] + pts[i].distanceTo(pts[i - 1])); this.L = this.c[this.c.length - 1]; Track.prep(this); }
  kAt(s) { const c = this.c; s = clamp(s, 0, this.L); let lo = 0, hi = c.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (c[m] <= s) lo = m; else hi = m; } return this.k[lo]; }
  at(s, out) { const p = this.p, c = this.c; s = clamp(s, 0, this.L); let lo = 0, hi = c.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (c[m] <= s) lo = m; else hi = m; } const t = (s - c[lo]) / Math.max(1e-6, c[hi] - c[lo]); return out.copy(p[lo]).lerp(p[hi], t); }
}
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _d = new THREE.Vector3();
// ---------------------------------------------------------------- generic vehicle with action queue
const VEH = []; let SIMT = 0;
class Vehicle {
  constructor(o) { Object.assign(this, { id: o.id, type: o.type, obj: o.obj, R: o.R, vmax: o.vmax, acc: o.acc || 1.2, wb: o.wb, q: [], state: 'Idle', task: '—', x: o.x, z: o.z, th: o.th, v: 0, steer: 0, cur: null, pitch: 0, roll: 0, gear: 1, odo: 0 });
    this.px = this.x; this.pz = this.z; this.pth = this.th; world.add(o.obj); VEH.push(this); }
  push(...a) { this.q.push(...a); return this; }
  // plan a drive leg to pose; gear +1 forward, -1 reverse
  drive(X, Z, th, gear = 1, o = {}) { this.q.push({ k: 'drive', X, Z, th, gear, vmax: o.vmax, R: o.R, label: o.label, lead: o.lead }); return this; }
  do(fn) { this.q.push({ k: 'fn', fn }); return this; }
  wait(t) { this.q.push({ k: 'wait', t }); return this; }
  until(cond, label) { this.q.push({ k: 'until', cond, label }); return this; }
  step(dt) {
    this.ds = 0; this.curv = 0; let a = this.cur;
    if (!a) { a = this.cur = this.q.shift(); if (!a) { this.v = 0; this.onIdle && this.onIdle(); return; } this.begin(a); }
    if (a.k === 'fn') { a.fn(this); this.cur = null; return; }
    if (a.k === 'wait') { a.t -= dt; if (a.t <= 0) this.cur = null; return; }
    if (a.k === 'until') { if (a.cond(this)) this.cur = null; return; }
    if (a.k === 'lift') { const h = this.obj.userData.getForkHeight(); if (Math.abs(h - a.h) < 0.0005) this.cur = null; return; }
    if (a.k === 'tilt') { const u = this.obj.userData; if (u.tilt === undefined || Math.abs(u.tilt - u.tiltTarget) < 1e-5) this.cur = null; return; }
    if (a.k === 'drive') {
      if (!a.tr) { this.cur = null; return; }
      // ---- bicycle model: pose comes ONLY from integrating (v, delta); the path is a reference for the steering controller
      const g = a.gear, wb = this.wb, Lc = this.Lc ?? Math.max(0.8, wb * 0.7), dmax = this.dmax ?? 0.6, rate = this.steerRate ?? 0.8;
      const pr = a.tr.project(this.x, this.z, a.i || 0); a.i = pr.i; a.s = Math.max(a.s, pr.s);
      const phiM = this.th + (g < 0 ? Math.PI : 0), psi = Math.atan2(Math.sin(pr.h - phiM), Math.cos(pr.h - phiM));
      const e = (this.x - pr.px) * Math.cos(pr.h) - (this.z - pr.pz) * Math.sin(pr.h); // + = vehicle left of path (motion frame)
      const kff = a.tr.kAt(pr.s + Math.abs(this.v) * (0.25 + 0.6 / rate) * 0.5), kcmd = kff + (2 / Lc) * psi - (1 / (Lc * Lc)) * e; // curvature preview covers steer-rate lag
      const dT = clamp(Math.atan(wb * kcmd * g), -dmax, dmax);
      this.steer = this.steer + clamp(dT - this.steer, -rate * dt, rate * dt);
      const rem = a.tr.L - a.s, lag = Math.abs(dT - this.steer);
      if (a.pre) { if (lag < 0.01) a.pre = false; else { this.v = 0; this.sv = 0; return; } } // steer at standstill before moving off
      const vmax = a.vmax ?? this.vmax, vcurve = Math.sqrt(1.2 / Math.max(1e-3, Math.abs(Math.tan(this.steer) / wb)));
      const vt = Math.min(vmax, vcurve, vmax * Math.max(0.15, 1 - lag / 0.4), Math.sqrt(2 * this.acc * Math.max(0, rem)));
      const dv = clamp(vt - this.v, -this.acc * 1.4 * dt, this.acc * dt); this.v = Math.max(rem > 0.004 ? 0.04 : 0, this.v + dv); this.accel = dv / dt;
      const sd = g * Math.min(this.v * dt, rem + 0.002), kv = Math.tan(this.steer) / wb, dth = sd * kv, thm = this.th + dth / 2;
      this.x += Math.sin(thm) * sd; this.z += Math.cos(thm) * sd; this.th += dth;
      this.curv = kv; this.gear = g; this.sv = g * this.v; this.ds = sd; this.odo += Math.abs(sd);
      const pe = a.tr.project(this.x, this.z, a.i); a.s = Math.max(a.s, pe.s);
      if (a.tr.L - a.s <= 0.003) { const ep = Math.hypot(this.x - a.X, this.z - a.Z), eh = Math.abs(Math.atan2(Math.sin(a.th - this.th), Math.cos(a.th - this.th)));
        if (ep > 0.02 || eh > 0.02) console.warn(`[ASSERT] path end ${this.id}: pos err ${(ep * 100).toFixed(1)} cm, heading err ${(eh * 57.3).toFixed(1)} deg`);
        this.endErr = ep; this.cur = null; this.v = 0; this.sv = 0; }
    }
  }
  begin(a) {
    if (a.label) this.task = a.label;
    if (a.k === 'liftTo') { a.k = 'lift'; a.h = a.fn(this); const mx = this.obj.userData.maxForkHeight ?? 9; if (a.h > mx + 1e-6 || a.h < -1e-6) console.error(`[slot-assert] ${this.id} fork target ${a.h.toFixed(3)} m outside 0..${mx}`); }
    if (a.k === 'lift') { this.obj.userData.setForkHeight(a.h); }
    if (a.k === 'tilt') { this.obj.userData.setMastTilt(a.r); }
    if (a.k === 'drive') { const R = a.R ?? this.R; let pts;
      if (Math.hypot(a.X - this.x, a.Z - this.z) < 1e-3 && Math.abs(Math.sin((a.th - this.th) / 2)) < 1e-3) { a.tr = null; return; }
      const Rr = Math.max(R, this.dmax ? 1.08 * this.wb / Math.tan(this.dmax) : 0), md0 = this.th + (a.gear > 0 ? 0 : Math.PI), md1 = a.th + (a.gear > 0 ? 0 : Math.PI);
      // straight run-in before the goal so the steer settles to zero and the vehicle converges on the line (no arc ends exactly at the goal)
      let lead = a.lead ?? Math.min(this.isSemi ? 8 : 1.6, Math.max(0, Math.hypot(a.X - this.x, a.Z - this.z) - 2 * Rr));
      const LX = a.X - Math.sin(md1) * lead, LZ = a.Z - Math.cos(md1) * lead;
      pts = dubins(this.x, this.z, md0, LX, LZ, md1, Rr);
      if (pts && lead > 0) { const n = Math.ceil(lead / 0.1); for (let i = 1; i <= n; i++) pts.push(new THREE.Vector3(LX + Math.sin(md1) * lead * i / n, 0, LZ + Math.cos(md1) * lead * i / n)); }
      if (!pts) { console.warn('no path', this.id); a.tr = null; return; } a.tr = new Track(pts); a.s = 0; a.i = 0; a.pre = true; }
  }
}
// ---------------------------------------------------------------- forklift (rear-wheel steer, reference = front drive axle)
const FK_WB = 1.26;
function makeForklift(id, x, z, th, opts = {}) {
  const obj = createForklift({ autoLift: false, ...opts }); shadowAll(obj);
  if (opts.reach) { obj.userData.reach = true; }
  const v = new Vehicle({ id, type: opts.reach ? 'Reach truck' : 'Counterbalance forklift', obj, R: 1.5, vmax: opts.vmax ?? 2.2, acc: 0.9, wb: FK_WB, x, z, th });
  { const k = obj.userData.kin; v.refZ = k ? k.refZ : 0; if (k) v.wb = k.L; v.dmax = k ? k.maxSteer : 0.75; } v.steerRate = 1.4; v.Lc = 0.9;
  if (obj.userData.parts.load) { obj.userData.parts.load.removeFromParent(); obj.userData.parts.load = null; } // the only pallets on a carriage are real, tracked pallet entities
  const P = obj.userData.parts; v.rearWheels = P.wheels.filter((w) => w.name === 'wheelRear' || /Rear/.test(w.name)); v.frontWheels = P.wheels.filter((w) => !v.rearWheels.includes(w));
  if (!v.rearWheels.length) { v.rearWheels = P.wheels.slice(2); v.frontWheels = P.wheels.slice(0, 2); }
  [...v.rearWheels, ...v.frontWheels].forEach((w) => (w.rotation.order = 'YXZ'));
  obj.userData.setForkHeight(0.08);
  v.lift = (h) => { v.q.push({ k: 'lift', h }); return v; };
  v.tilt = (r) => { v.q.push({ k: 'tilt', r }); return v; };
  v.liftTo = (fn) => { v.q.push({ k: 'liftTo', fn }); return v; };
  v.carry = null;
  return v;
}
// ---------------------------------------------------------------- semi (tractor rear axle at kingpin z=4.9; front axle 9.75; trailer bogie -8.9)
const KP = 4.9, TR_WB = 4.85, TL_L = 13.8;
function makeSemi(id, x, z, th, opts = {}) {
  const obj = createSemiTruck(opts); shadowAll(obj);
  const v = new Vehicle({ id, type: 'Road tractor + 53\' trailer', obj, R: 12.5, vmax: opts.vmax ?? 6, acc: 0.7, wb: TR_WB, x, z, th });
  v.dmax = 0.6; v.steerRate = 0.5; v.Lc = 4;
  v.tth = th; // trailer heading
  const P = obj.userData.parts; v.P = P; [...P.frontWheels].forEach((w) => (w.rotation.order = 'YXZ'));
  v.isSemi = true; v.rev = null; // in reverse, path drives the trailer axle
  return v;
}
// reverse leg for semi: path for trailer axle point
function semiReverse(v, X, Z, th, label) { v.q.push({ k: 'srev', X, Z, th, label }); return v; }
const _origStep = Vehicle.prototype.step;
Vehicle.prototype.step = function (dt) {
  if (!this.isSemi) return _origStep.call(this, dt);
  const a0 = this.cur;
  if (a0 && a0.k === 'srev' && !a0.tr) { // plan for trailer axle (heading = trailer heading)
    const ax = this.x - Math.sin(this.tth) * TL_L, az = this.z - Math.cos(this.tth) * TL_L;
    const pts = dubins(ax, az, this.tth + Math.PI, a0.X, a0.Z, a0.th + Math.PI, 13);
    a0.tr = pts ? new Track(pts) : null; a0.s = 0; a0.k2 = true; a0.k = 'drive'; a0.gear = -1; a0.semiRev = true; if (!a0.tr) { this.cur = null; return; }
    this.ax = ax; this.az = az;
  }
  const prevK = [this.x, this.z];
  if (this.cur && this.cur.semiRev) {
    // move trailer axle along path; kingpin from trailer heading; tractor drags (front follows kingpin)
    const a = this.cur; const tmp = { x: this.ax, z: this.az, th: this.tth };
    const sv = [this.x, this.z, this.th]; this.x = tmp.x; this.z = tmp.z; this.th = tmp.th; this.gear = -1;
    const svS = this.steer, svW = this.wb, svL = this.Lc, svD = this.dmax, svR = this.steerRate; this.steer = this.vsteer || 0; this.wb = TL_L; this.Lc = 6; this.dmax = 1.0; this.steerRate = 0.5;
    _origStep.call(this, dt);
    this.vsteer = this.steer; this.steer = svS; this.wb = svW; this.Lc = svL; this.dmax = svD; this.steerRate = svR;
    const ax = this.x, az = this.z, tth = this.th; this.ax = ax; this.az = az; this.tth = tth;
    const kx = ax + Math.sin(tth) * TL_L, kz = az + Math.cos(tth) * TL_L;
    const fx = sv[0] + Math.sin(sv[2]) * TR_WB, fz = sv[1] + Math.cos(sv[2]) * TR_WB; // old front axle
    const nth = Math.atan2(fx - kx, fz - kz); this.curv = 0; this.x = kx; this.z = kz; this.th = nth;
    { const sdT = -Math.max(1e-4, Math.hypot(kx - sv[0], kz - sv[1])), tgt = clamp(Math.atan(TR_WB * Math.atan2(Math.sin(nth - sv[2]), Math.cos(nth - sv[2])) / sdT), -0.6, 0.6); this.steer += clamp(tgt - this.steer, -0.6 * dt, 0.6 * dt); }
    if (!this.cur) { this.v = 0; }
    return;
  }
  _origStep.call(this, dt);
  // forward: trailer axle dragged by kingpin
  const ax = this.x - Math.sin(this.tth) * TL_L, az = this.z - Math.cos(this.tth) * TL_L;
  if (this.ds) { const ox = prevK[0] - Math.sin(this.tth) * TL_L, oz = prevK[1] - Math.cos(this.tth) * TL_L; this.tth = Math.atan2(this.x - ox, this.z - oz); }
};
// ---------------------------------------------------------------- apply transforms (with interpolation alpha)
function placeVehicle(v, alpha) {
  const x = lerp(v.px, v.x, alpha), z = lerp(v.pz, v.z, alpha), th = v.pth + Math.atan2(Math.sin(v.th - v.pth), Math.cos(v.th - v.pth)) * alpha;
  const o = v.obj, dt = 1 / 60, ud = o.userData;
  // steering from curvature: delta = atan(wb * kappa) (sign: + = left)
  const tS = Math.tan(v.steer || 0), ack = (yw) => Math.atan2(v.wb * tS, v.wb - yw * tS); // Ackermann: each steered wheel aims at the common turn centre
  v.pitch = dampV(v.pitch, clamp(-(v.accel || 0) * 0.012, -0.02, 0.02), 6, dt);
  v.roll = dampV(v.roll, clamp((v.curv || 0) * (v.v || 0) * (v.v || 0) * 0.004, -0.03, 0.03), 6, dt);
  if (v.isSemi) {
    o.position.set(0, 0, 0); o.rotation.set(0, 0, 0);
    const T = v.P.tractor, L = v.P.trailer;
    T.rotation.set(0, th, 0); T.position.set(x - Math.sin(th) * KP, 0, z - Math.cos(th) * KP);
    T.rotation.x = v.pitch * 0.6;
    L.rotation.set(0, v.tth, 0); L.position.set(x - Math.sin(v.tth) * KP, 0, z - Math.cos(v.tth) * KP);
    if (ud.setSteer) ud.setSteer(v.steer, true); else for (const w of v.P.frontWheels) w.rotation.y = ack(w.position.x);
    const ds = v.ds || 0; [...v.P.frontWheels, ...v.P.driveWheels, ...v.P.trailerWheels].forEach((w) => { w.rotation.x += ds / w.userData.radius; });
    ud.setBraking && ud.setBraking((v.accel || 0) < -0.2);
  } else {
    // forklift: reference = front (drive) axle at origin; rear wheels steer (counterweight swings out)
    const rz = v.refZ || 0; o.position.set(x - Math.sin(th) * rz, (o.userData.baseY ?? FLOOR), z - Math.cos(th) * rz); o.rotation.set(v.pitch, th, v.roll, 'YXZ');
    if (o.userData.setSteer) o.userData.setSteer(v.steer, true); else for (const w of v.rearWheels) w.rotation.y = -ack(w.position.x);
    // per-wheel roll distance: inner/outer track = ds * (1 -/+ k*halfTrack)
    const ds = v.ds || 0, k = v.curv || 0;
    for (const w of [...v.frontWheels, ...v.rearWheels]) { const kp = w.userData._kp || w.position; w.rotation.x += ds * Math.hypot(1 - k * kp.x, k * (kp.z - (v.refZ || 0))) / (w.userData.radius || 0.3); }
  }
}
