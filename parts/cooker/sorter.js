/**
 * GateFlow — SRT1 sliding-shoe sortation loop (Three.js r160, ES module, no global side effects).
 *
 *   import * as Sorter from './parts/cooker/sorter.js';
 *   const srt = Sorter.create(scene, { position:[x,y,z], rotation: 0, lanes: 8, speed: 2.0 });
 *   srt.addCase(boxMesh, laneId)            // mesh: centred Box geometry; local +X = travel direction
 *   srt.onCaseArrived((mesh, laneId) => {}) // fired once when the case comes to rest at the lane end
 *   srt.update(dt)                          // every frame (seconds)
 *   srt.getLaneEndWorld(laneId)             // Vector3: centre of the belt top at the lane end (world)
 * Module-level update/addCase/onCaseArrived/getLaneEndWorld delegate to the last created instance.
 *
 * Local frame (before opts.position/rotation/scale): origin on the FLOOR (y=0) at the loop centre.
 * 1 unit = 1 m. Loop runs east (+X) on the south straight (z=+2) and west (-X) on the north straight (z=-2).
 * Takeaways enter from the south (+Z), lanes leave to the north (-Z) down spiral conveyors.
 * Every case moves by arc length s along a path; transfers keep s-continuity (takeaway end == loop point,
 * loop point == divert start).  Case bottom rests on the belt top (with a curvature lift so no corner sinks).
 */
import * as THREE from 'three';

const C = { blue: 0x0071ce, navy: 0x041e42, spark: 0xffc220, belt: 0x2b3039, steel: 0xc9d0d8, grey: 0x8a94a3 };
const UP = new THREE.Vector3(0, 1, 0);

/* ---------------------------------------------------------------- path (dense arc-length table) */
class Path {
  constructor(closed = false) { this.closed = closed; this.raw = []; }
  static turtle(x, y, z, psi) { const p = new Path(); p._t = { x, y, z, psi }; p.raw.push(new THREE.Vector3(x, y, z)); return p; }
  _ramp(dy, r, n, i) { // eased height profile: trapezoid slope (zero slope at both ends when r>0)
    if (!dy) return 0; const t = i / n; if (r <= 0) return dy * t;
    const G = t < r ? t * t / (2 * r) : t > 1 - r ? (1 - r) - (1 - t) * (1 - t) / (2 * r) : r / 2 + (t - r);
    return dy * G / (1 - r);
  }
  straight(len, dy = 0, r = 0.25) {
    const t = this._t, n = Math.max(2, Math.ceil(len / 0.05)), y0 = t.y;
    for (let i = 1; i <= n; i++) { const d = len * i / n; this.raw.push(new THREE.Vector3(t.x + Math.cos(t.psi) * d, y0 + this._ramp(dy, r, n, i), t.z + Math.sin(t.psi) * d)); }
    t.x += Math.cos(t.psi) * len; t.z += Math.sin(t.psi) * len; t.y = y0 + dy; return this;
  }
  arc(R, delta, dy = 0, r = 0.12) {
    const t = this._t, sg = Math.sign(delta), n = Math.max(4, Math.ceil(Math.abs(delta) * R / 0.05)), y0 = t.y;
    const cx = t.x + R * -Math.sin(t.psi) * sg, cz = t.z + R * Math.cos(t.psi) * sg;
    for (let i = 1; i <= n; i++) { const ps = t.psi + delta * i / n;
      this.raw.push(new THREE.Vector3(cx - R * sg * -Math.sin(ps), y0 + this._ramp(dy, r, n, i), cz - R * sg * Math.cos(ps))); }
    t.psi += delta; t.x = cx - R * sg * -Math.sin(t.psi); t.z = cz - R * sg * Math.cos(t.psi); t.y = y0 + dy;
    this.centre = this.centre || []; this.centre.push(new THREE.Vector3(cx, 0, cz)); return this;
  }
  finish(closed = false) {
    this.closed = closed; let P = this.raw;
    if (closed && P[0].distanceTo(P[P.length - 1]) < 1e-3) P = P.slice(0, -1);
    const n = P.length; this.P = P; this.S = new Float64Array(n); this.T = []; this.N = []; this.L = [];
    for (let i = 1; i < n; i++) this.S[i] = this.S[i - 1] + P[i].distanceTo(P[i - 1]);
    this.len = this.S[n - 1] + (closed ? P[n - 1].distanceTo(P[0]) : 0);
    for (let i = 0; i < n; i++) {
      const a = P[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], b = P[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
      const T = b.clone().sub(a).normalize(), L = T.clone().cross(UP).normalize(), N = L.clone().cross(T).normalize();
      this.T.push(T); this.N.push(N); this.L.push(L);
    }
    delete this._t; return this;
  }
  /** frame at arc length s (clamped/extrapolated on open paths, wrapped on closed) */
  frame(s, P, T, N, L) {
    const S = this.S, n = S.length; let i0, i1, f;
    if (this.closed) { s = ((s % this.len) + this.len) % this.len;
      if (s >= S[n - 1]) { i0 = n - 1; i1 = 0; f = (s - S[n - 1]) / (this.len - S[n - 1]); } }
    if (i0 === undefined) {
      if (s <= 0 && !this.closed) { i0 = 0; i1 = 1; f = s / (S[1] - S[0]); }
      else if (s >= S[n - 1]) { i0 = n - 2; i1 = n - 1; f = 1 + (s - S[n - 1]) / (S[n - 1] - S[n - 2]); }
      else { let lo = 0, hi = n - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (S[m] <= s) lo = m; else hi = m; } i0 = lo; i1 = hi; f = (s - S[lo]) / (S[hi] - S[lo]); }
    }
    if (P) P.lerpVectors(this.P[i0], this.P[i1], f);
    const g = Math.min(1, Math.max(0, f));
    if (T) T.lerpVectors(this.T[i0], this.T[i1], g).normalize();
    if (L) L.lerpVectors(this.L[i0], this.L[i1], g).normalize();
    if (N && T && L) N.crossVectors(L, T).normalize(); else if (N) N.lerpVectors(this.N[i0], this.N[i1], g).normalize();
    return P;
  }
}

/** Curve view of a path range for ExtrudeGeometry (arc-length parametrised, flat-belt frames). */
class SubCurve extends THREE.Curve {
  constructor(path, s0, s1) { super(); this.path = path; this.s0 = s0; this.s1 = s1; }
  getPoint(t, target = new THREE.Vector3()) { return this.path.frame(this.s0 + (this.s1 - this.s0) * t, target); }
  getPointAt(u, target) { return this.getPoint(u, target); }
  computeFrenetFrames(segments) { // shape.x -> -lateral, shape.y -> belt normal (up); right-handed with tangent
    const tangents = [], normals = [], binormals = [];
    for (let i = 0; i <= segments; i++) { const T = new THREE.Vector3(), N = new THREE.Vector3(), L = new THREE.Vector3();
      this.path.frame(this.s0 + (this.s1 - this.s0) * i / segments, null, T, N, L); tangents.push(T); normals.push(L.negate()); binormals.push(N); }
    return { tangents, normals, binormals };
  }
}
function rrShape(x0, x1, y0, y1, r = 0.0) {
  const s = new THREE.Shape(); r = Math.min(r, (x1 - x0) / 2 - 1e-4, (y1 - y0) / 2 - 1e-4);
  if (r <= 0) { s.moveTo(x0, y0); s.lineTo(x1, y0); s.lineTo(x1, y1); s.lineTo(x0, y1); s.closePath(); return s; }
  s.moveTo(x0 + r, y0); s.lineTo(x1 - r, y0); s.quadraticCurveTo(x1, y0, x1, y0 + r); s.lineTo(x1, y1 - r); s.quadraticCurveTo(x1, y1, x1 - r, y1);
  s.lineTo(x0 + r, y1); s.quadraticCurveTo(x0, y1, x0, y1 - r); s.lineTo(x0, y0 + r); s.quadraticCurveTo(x0, y0, x0 + r, y0); return s;
}
function polyShape(pts) { const s = new THREE.Shape(); s.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]); s.closePath(); return s; }
const beltShape = (W) => rrShape(-W / 2, W / 2, -0.04, 0, 0.012);
const frameShape = (W, depth = 0.24) => { const a = W / 2 + 0.06, b = W / 2 + 0.006;
  return polyShape([[-a, -depth], [a, -depth], [a, -0.004], [b, -0.004], [b, -0.05], [-b, -0.05], [-b, -0.004], [-a, -0.004]]); };
// guard rail on lateral side sg (+1/-1). shape.x = -lateral
const railShape = (W, sg, h = 0.13) => { const x0 = W / 2 + 0.012, x1 = W / 2 + 0.05; return sg > 0 ? rrShape(-x1, -x0, -0.004, h, 0.012) : rrShape(x0, x1, -0.004, h, 0.012); };
function extrude(path, s0, s1, shape, stepLen = 0.25) {
  const steps = Math.max(1, Math.ceil(Math.abs(s1 - s0) / stepLen));
  const g = new THREE.ExtrudeGeometry(shape, { steps, bevelEnabled: false, extrudePath: new SubCurve(path, s0, s1), curveSegments: 3 });
  g.computeVertexNormals(); return g;
}
function mergeGeos(geos) { // tiny position/normal(/uv) merge, avoids an addons dependency
  let n = 0; for (const g of geos) n += g.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3); let o = 0;
  for (const g of geos) { const gg = g.index ? g.toNonIndexed() : g; pos.set(gg.attributes.position.array, o * 3); nor.set(gg.attributes.normal.array, o * 3); o += gg.attributes.position.count; g.dispose(); }
  const m = new THREE.BufferGeometry(); m.setAttribute('position', new THREE.BufferAttribute(pos, 3)); m.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  m.computeBoundingSphere(); m.computeBoundingBox(); return m;
}
const smat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: o.r ?? 0.85, metalness: o.m ?? 0, ...(o.extra || {}) });

/* ---------------------------------------------------------------- SorterInstance */
class SorterInstance {
  constructor(scene, opts = {}) {
    const o = this.opts = {
      lanes: 8, speed: 2.0, elevation: 5.0, laneHeight: 0.9, laneLength: 8, laneSpacing: 4, takeaways: 3, takeawayLength: 6,
      loopWidth: 1.0, beltWidth: 0.8, gap: 0.6, laneGap: 0.12, accel: 3.0, decel: 1.6, noReadRate: 0, spiralTurns: 4, spiralRadius: 1.3,
      straight: 0, turnRadius: 2.0, divertRadius: 2.5, chuteLength: 1.0, ...opts };
    this.v = o.speed; this.cbs = []; this.cases = []; this.rr = 0; this.time = 0; this.stats = { inducted: 0, sorted: 0, recirc: 0, arrived: 0, noRead: 0 };
    const H = o.elevation, NL = o.lanes, Rt = o.turnRadius, Rd = o.divertRadius, Wl = o.loopWidth, Wb = o.beltWidth;
    const Ls = this.Ls = o.straight || Math.max(20, 3 + (NL - 1) * o.laneSpacing + 4);
    const xW = -Ls / 2, xE = Ls / 2;
    this.group = new THREE.Group(); this.group.name = 'SRT1_sorter';
    if (o.position) Array.isArray(o.position) ? this.group.position.fromArray(o.position) : this.group.position.copy(o.position);
    if (o.rotation !== undefined) typeof o.rotation === 'number' ? (this.group.rotation.y = o.rotation) : this.group.rotation.copy(o.rotation);
    if (o.scale) this.group.scale.setScalar(o.scale);
    this.caseRoot = new THREE.Group(); this.caseRoot.name = 'sorterCases'; this.group.add(this.caseRoot);

    /* ---- paths */
    this.loop = Path.turtle(xW, H, Rt, 0).straight(Ls).arc(Rt, -Math.PI).straight(Ls).arc(Rt, -Math.PI).finish(true);
    this.sBed0 = Ls + Math.PI * Rt; this.sBed1 = 2 * Ls + Math.PI * Rt; // north straight = slat bed
    this.take = [];
    for (let j = 0; j < o.takeaways; j++) {
      const Rm = 2.5, xm = xW + 4 + Rm + 5 * j - 2.5 + 2.5; // merge point x
      const p = Path.turtle(xm - Rm, H, Rt + Rm + o.takeawayLength, -Math.PI / 2).straight(o.takeawayLength).arc(Rm, Math.PI / 2).finish(false);
      this.take.push({ i: j, path: p, sMerge: xm - xW, sHold: o.takeawayLength - 0.45, cases: [], pending: [], inflight: null, xm, Rm });
    }
    this.sScan = this.take[this.take.length - 1].xm - xW + 4.0;
    this.lanes = [];
    for (let k = 0; k < NL; k++) {
      const xd = xE - 3 - k * o.laneSpacing, sD = this.sBed0 + (xE - xd);
      const drop = H - o.laneHeight, Rh = o.spiralRadius, turns = o.spiralTurns;
      const p = Path.turtle(xd, H, -Rt, Math.PI).arc(Rd, Math.PI / 2).straight(o.chuteLength).arc(Rh, turns * 2 * Math.PI, -drop, 0.06).straight(o.laneLength).finish(false);
      const sSp0 = Rd * Math.PI / 2 + o.chuteLength, sSp1 = p.len - o.laneLength;
      this.lanes.push({ k, path: p, sD, sDec: sD - 1.2, sSpiral0: sSp0, sSpiral1: sSp1, cases: [], last: null, x: xd - Rd,
        spiralCentre: p.centre[1], name: (o.laneNames && o.laneNames[k]) || ('SRT1-L' + String(k + 1).padStart(3, '0')) });
    }
    this._build(scene);
    scene.add(this.group);
  }

  /* ---------------------------------------------------------------- geometry */
  _build() {
    const o = this.opts, H = o.elevation, Wl = o.loopWidth, Wb = o.beltWidth, g = this.group;
    const M = this.mats = { belt: smat(C.belt, { r: 0.9 }), frame: smat(C.blue, { r: 0.7 }), rail: smat(C.spark, { r: 0.6 }), navy: smat(C.navy, { r: 0.8 }),
      steel: smat(C.steel, { r: 0.55, m: 0.15 }), slat: smat(0xd9dee5, { r: 0.5, m: 0.2, extra: { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 } }),
      loopBelt: smat(C.belt, { r: 0.9, extra: { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 } }), shoe: smat(C.spark, { r: 0.6 }) };
    this.surfaces = []; // belt-top meshes (for QA raycasts)
    const frames = [], rails = [];
    const addBelt = (path, s0, s1, W, m = M.belt) => { const mesh = new THREE.Mesh(extrude(path, s0, s1, beltShape(W)), m); mesh.castShadow = mesh.receiveShadow = true; mesh.name = 'belt'; g.add(mesh); this.surfaces.push(mesh); return mesh; };
    const railRanges = (path, sA, sB, W, sg, gaps = [], h) => { // rails with gaps [[a,b],...]
      let s = sA; for (const [a, b] of gaps.sort((p, q) => p[0] - q[0])) { if (a > s + 0.05) rails.push(extrude(path, s, a, railShape(W, sg, h))); s = Math.max(s, b); }
      if (sB > s + 0.05) rails.push(extrude(path, s, sB, railShape(W, sg, h))); };
    // which lateral sign points to -Z / +Z on the straights
    const tmpT = new THREE.Vector3(), tmpL = new THREE.Vector3(), tmpP = new THREE.Vector3(), tmpN = new THREE.Vector3();
    this.loop.frame(1, tmpP, tmpT, tmpN, tmpL); const sgSouthOnSouth = Math.sign(tmpL.z); // lateral toward +Z on south straight
    this.loop.frame(this.sBed0 + 1, tmpP, tmpT, tmpN, tmpL); const sgNorthOnNorth = -Math.sign(tmpL.z);
    // loop belt (everything except the slat bed) + frames
    const Lp = this.loop.len;
    addBelt(this.loop, this.sBed1, this.sBed0 + Lp, Wl, M.loopBelt);
    frames.push(extrude(this.loop, this.sBed1, this.sBed0 + Lp, frameShape(Wl)));
    frames.push(extrude(this.loop, this.sBed0, this.sBed1, frameShape(Wl, 0.36)));
    // loop rails: outer + inner, gaps at merges (south side of south straight) and diverts (north side of north straight)
    const mergeGaps = this.take.map((t) => [t.sMerge - t.Rm - 0.1, t.sMerge + 0.35]);
    const divGaps = this.lanes.map((l) => [l.sD - 0.25, l.sD + 2.4]);
    if (sgNorthOnNorth !== sgSouthOnSouth) throw new Error('sorter: outer-rail side mismatch');
    railRanges(this.loop, 0, Lp, Wl, sgSouthOnSouth, [...mergeGaps, ...divGaps]); // outer rail (gaps at merges + diverts)
    railRanges(this.loop, 0, Lp, Wl, -sgSouthOnSouth, []);                       // inner rail, continuous
    // takeaways
    for (const t of this.take) {
      const p = t.path; let sEndRail = p.len; // rails stop before entering the loop footprint
      for (let s = 0; s < p.len; s += 0.02) { p.frame(s, tmpP, tmpT, tmpN, tmpL);
        const ok = [-1, 1].every((sg) => Math.abs(tmpP.z + tmpL.z * sg * (Wb / 2 + 0.06) - o.turnRadius) > Wl / 2 + 0.07); if (!ok) { sEndRail = s; break; } }
      let sEndBelt = p.len; for (let s = 0; s < p.len; s += 0.02) { p.frame(s, tmpP); if (Math.abs(tmpP.z - o.turnRadius) < 0.15) { sEndBelt = s; break; } }
      addBelt(p, 0, p.len, Wb); frames.push(extrude(p, 0, sEndBelt, frameShape(Wb)));
      rails.push(extrude(p, 0, sEndRail, railShape(Wb, 1)), extrude(p, 0, sEndRail, railShape(Wb, -1)));
      t.sEndRail = sEndRail;
    }
    // lanes: divert takeaway + chute + spiral + lane run
    for (const l of this.lanes) {
      const p = l.path; let sOut = 0, sRail = 0;
      for (let s = 0; s < p.len; s += 0.02) { p.frame(s, tmpP); if (Math.abs(tmpP.z + o.turnRadius) > 0.28) { sOut = s; break; } }
      for (let s = 0; s < p.len; s += 0.02) { p.frame(s, tmpP, tmpT, tmpN, tmpL);
        const ok = [-1, 1].every((sg) => Math.abs(tmpP.z + tmpL.z * sg * (Wb / 2 + 0.06) + o.turnRadius) > Wl / 2 + 0.07); if (ok) { sRail = s; break; } }
      l.sBeltStart = sOut;
      addBelt(p, sOut, p.len, Wb); frames.push(extrude(p, sOut, p.len, frameShape(Wb)));
      // spiral: inner rail normal, outer rail taller; lateral sign toward centre
      const mid = (l.sSpiral0 + l.sSpiral1) / 2; p.frame(mid, tmpP, tmpT, tmpN, tmpL); const c = l.spiralCentre;
      const sgIn = Math.sign((c.x - tmpP.x) * tmpL.x + (c.z - tmpP.z) * tmpL.z);
      rails.push(extrude(p, sRail, l.sSpiral0, railShape(Wb, 1)), extrude(p, sRail, l.sSpiral0, railShape(Wb, -1)));
      rails.push(extrude(p, l.sSpiral0, l.sSpiral1, railShape(Wb, sgIn, 0.1)), extrude(p, l.sSpiral0, l.sSpiral1, railShape(Wb, -sgIn, 0.3)));
      rails.push(extrude(p, l.sSpiral1, p.len, railShape(Wb, 1)), extrude(p, l.sSpiral1, p.len, railShape(Wb, -1)));
    }
    const fm = new THREE.Mesh(mergeGeos(frames), M.frame); fm.castShadow = fm.receiveShadow = true; fm.name = 'frames'; g.add(fm);
    const rm = new THREE.Mesh(mergeGeos(rails), M.rail); rm.castShadow = true; rm.name = 'guardRails'; g.add(rm);
    this._buildSupports(); this._buildBed(); this._buildArch(); this._buildEnds();
  }
  _buildSupports() {
    const o = this.opts, g = this.group, posts = [], arms = []; const P = new THREE.Vector3(), T = new THREE.Vector3(), N = new THREE.Vector3(), L = new THREE.Vector3();
    const alongPath = (path, s0, s1, step, W) => { for (let s = s0; s <= s1 + 1e-6; s += step) { path.frame(s, P, T, N, L); const top = P.y - 0.24; if (top < 0.3) continue;
      posts.push([P.x, top, P.z]); arms.push([P.x, top - 0.04, P.z, Math.atan2(T.z, T.x), W + 0.14]); } };
    alongPath(this.loop, 0, this.loop.len - 1, 3.4, o.loopWidth);
    for (const t of this.take) alongPath(t.path, 0.6, t.path.len - 1.5, 3.0, o.beltWidth);
    for (const l of this.lanes) { alongPath(l.path, 2.6, l.sSpiral0, 3, o.beltWidth); alongPath(l.path, l.sSpiral1 + 0.6, l.path.len - 0.3, 2.5, o.beltWidth); }
    // spiral columns + radial arms every quarter turn
    const cols = [], spArms = [];
    for (const l of this.lanes) { const c = l.spiralCentre; cols.push(c);
      const nq = Math.round(o.spiralTurns * 4); for (let q = 1; q < nq; q++) { const s = l.sSpiral0 + (l.sSpiral1 - l.sSpiral0) * q / nq; l.path.frame(s, P);
        const dx = P.x - c.x, dz = P.z - c.z, r = Math.hypot(dx, dz) + o.beltWidth / 2 + 0.06; spArms.push([c.x + dx / Math.hypot(dx, dz) * r / 2, P.y - 0.27, c.z + dz / Math.hypot(dx, dz) * r / 2, Math.atan2(dz, dx), r]); } }
    const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
    const postGeo = new THREE.CylinderGeometry(0.07, 0.07, 1, 12).translate(0, 0.5, 0), armGeo = new THREE.BoxGeometry(1, 0.08, 0.12);
    const ip = new THREE.InstancedMesh(postGeo, this.mats.navy, posts.length + cols.length);
    posts.forEach((p, i) => { m4.compose(ps.set(p[0], 0, p[2]), q4.identity(), sc.set(1, p[1], 1)); ip.setMatrixAt(i, m4); });
    cols.forEach((c, i) => { m4.compose(ps.set(c.x, 0, c.z), q4.identity(), sc.set(2.6, o.elevation + 0.2, 2.6)); ip.setMatrixAt(posts.length + i, m4); });
    const ia = new THREE.InstancedMesh(armGeo, this.mats.navy, arms.length + spArms.length);
    [...arms.map((a) => [a[0], a[1], a[2], a[3] + Math.PI / 2, a[4]]), ...spArms].forEach((a, i) => { q4.setFromAxisAngle(UP, -a[3]); m4.compose(ps.set(a[0], a[1], a[2]), q4, sc.set(a[4], 1, 1)); ia.setMatrixAt(i, m4); });
    for (const im of [ip, ia]) { im.castShadow = im.receiveShadow = true; g.add(im); } ip.name = 'posts'; ia.name = 'crossArms';
  }
  _buildBed() { // sliding-shoe slat chain over the north straight
    const o = this.opts, W = o.loopWidth, P = new THREE.Vector3(), T = new THREE.Vector3(), N = new THREE.Vector3(), L = new THREE.Vector3();
    const P1 = new THREE.Vector3(); this.loop.frame(this.sBed1, P1, T, N, L); this.loop.frame(this.sBed0, P, T, N, L);
    T.subVectors(P1, P).setY(0).normalize(); // exact chord direction (avoids drift from a finite-difference tangent)
    const bed = this.bed = { O: P.clone(), T: T.clone(), D: new THREE.Vector3().crossVectors(T, UP).normalize(), Lb: this.sBed1 - this.sBed0, rD: 0.09, home: -(W / 2 - 0.05), far: W / 2 - 0.05 };
    if (bed.D.z > 0) bed.D.negate(); // divert side = -Z (north)
    bed.perim = 2 * bed.Lb + 2 * Math.PI * bed.rD; bed.n = Math.round(bed.perim / 0.155); bed.pitch = bed.perim / bed.n; bed.q0 = 0;
    bed.lat = new Float32Array(bed.n).fill(bed.home); bed.top = new Float32Array(bed.n).fill(bed.home); bed.who = new Array(bed.n).fill(null);
    bed.slats = new THREE.InstancedMesh(new THREE.BoxGeometry(0.13, 0.02, W - 0.03), this.mats.slat, bed.n);
    bed.shoes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 0.035, 0.05), this.mats.shoe, bed.n);
    bed.slats.name = 'slats'; bed.shoes.name = 'shoes'; bed.slats.receiveShadow = true; bed.shoes.castShadow = true;
    bed.slats.frustumCulled = bed.shoes.frustumCulled = false;
    bed.base = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(bed.T, UP, bed.D));
    this.group.add(bed.slats, bed.shoes); this.surfaces.push(bed.slats); this._updateBed(0);
  }
  _buildArch() {
    const o = this.opts, g = this.group, P = new THREE.Vector3(), W = o.loopWidth; this.loop.frame(this.sScan, P);
    const arch = this.arch = new THREE.Group(); arch.position.copy(P); arch.name = 'scanArch'; g.add(arch);
    const hIn = 1.0, half = W / 2 + 0.22;
    for (const sz of [-1, 1]) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, hIn + 0.34, 0.5), this.mats.navy); post.position.set(0, (hIn + 0.34) / 2 - 0.3, sz * half); arch.add(post); }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 2 * half + 0.16), this.mats.navy); beam.position.set(0, hIn + 0.1, 0); arch.add(beam);
    this.archMat = new THREE.MeshStandardMaterial({ color: C.blue, emissive: C.blue, emissiveIntensity: 0.25, roughness: 0.4, toneMapped: false });
    this.archSpark = new THREE.MeshStandardMaterial({ color: C.spark, emissive: C.spark, emissiveIntensity: 0.2, roughness: 0.4, toneMapped: false });
    const ring = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.05, 2 * half - 0.1), this.archMat); ring.position.set(0, hIn - 0.02, 0); arch.add(ring);
    for (const sz of [-1, 1]) { const bar = new THREE.Mesh(new THREE.BoxGeometry(0.06, hIn - 0.1, 0.06), this.archSpark); bar.position.set(-0.2, hIn / 2, sz * (half - 0.11)); arch.add(bar); }
    arch.traverse((m) => { if (m.isMesh) m.castShadow = true; }); this.pulse = 0;
  }
  _buildEnds() { // end stops at lane ends
    const P = new THREE.Vector3(), T = new THREE.Vector3(), N = new THREE.Vector3(), L = new THREE.Vector3();
    for (const l of this.lanes) { l.path.frame(l.path.len, P, T, N, L);
      const stop = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, this.opts.beltWidth + 0.1), this.mats.rail);
      stop.position.copy(P).addScaledVector(T, 0.04).addScaledVector(N, 0.05); stop.rotation.y = -Math.atan2(T.z, T.x); stop.castShadow = true; stop.name = 'endStop_' + l.name; this.group.add(stop); }
  }

  /* ---------------------------------------------------------------- API */
  addCase(mesh, laneId, o = {}) {
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    const bb = mesh.geometry.boundingBox, s = mesh.scale;
    const c = { mesh, lane: laneId, hl: (bb.max.x - bb.min.x) * s.x / 2, hh: (bb.max.y - bb.min.y) * s.y / 2, hw: (bb.max.z - bb.min.z) * s.z / 2,
      cy: (bb.max.y + bb.min.y) / 2 * s.y, where: 'pending', s: 0, u: 0, laps: 0, scanned: false, decided: -1, arrived: false };
    const j = o.takeaway ?? (this.rr++ % this.take.length); c.t = this.take[j]; c.t.pending.push(c); this.cases.push(c); return c;
  }
  onCaseArrived(cb) { this.cbs.push(cb); return () => { this.cbs = this.cbs.filter((f) => f !== cb); }; }
  removeCase(mesh) { const c = this.cases.find((k) => k.mesh === mesh); if (c) this._drop(c); }
  getLaneEndWorld(laneId, target = new THREE.Vector3()) { const l = this.lanes[laneId]; l.path.frame(l.path.len, target); this.group.updateMatrixWorld(); return this.group.localToWorld(target); }
  getCaseRestWorld(laneId, mesh, target = new THREE.Vector3()) { const l = this.lanes[laneId]; const bb = mesh.geometry.boundingBox || (mesh.geometry.computeBoundingBox(), mesh.geometry.boundingBox);
    const hl = (bb.max.x - bb.min.x) * mesh.scale.x / 2, hh = (bb.max.y - bb.min.y) * mesh.scale.y / 2; l.path.frame(l.path.len - hl - 0.05, target); target.y += hh; return this.group.localToWorld(target); }
  getInductStartWorld(i = 0, target = new THREE.Vector3()) { this.take[i].path.frame(0, target); this.group.updateMatrixWorld(); return this.group.localToWorld(target); }
  get laneNames() { return this.lanes.map((l) => l.name); }

  /* ---------------------------------------------------------------- simulation */
  update(dt) { if (!(dt > 0)) return; dt = Math.min(dt, 0.25); const n = Math.ceil(dt / (1 / 60)); for (let i = 0; i < n; i++) this._step(dt / n); }
  _drop(c) { for (const list of [c.t.cases, c.t.pending, ...this.lanes.map((l) => l.cases)]) { const i = list.indexOf(c); if (i >= 0) list.splice(i, 1); }
    if (this.loopCases) { const i = this.loopCases.indexOf(c); if (i >= 0) this.loopCases.splice(i, 1); }
    if (c.t.inflight === c) c.t.inflight = null; for (const l of this.lanes) if (l.last === c) l.last = null;
    const i = this.cases.indexOf(c); if (i >= 0) this.cases.splice(i, 1); c.where = 'removed'; }
  _spacing(a, b, gap) { return a.hl + b.hl + gap; }
  _speed(c, stopS, dt) { // accel-limited approach to a stop point (smooth)
    const o = this.opts; const vt = Math.min(this.v, Math.sqrt(2 * o.decel * Math.max(0, stopS - c.s)));
    c.u = Math.min(vt, c.u + o.accel * dt); if (c.u < 0) c.u = 0; c.s = Math.min(c.s + c.u * dt, Math.max(c.s, stopS));
  }
  _arrivalTime(c, d) { const a = this.opts.accel, v = this.v; const t1 = (v - c.u) / a, d1 = (v * v - c.u * c.u) / (2 * a); return d >= d1 ? t1 + (d - d1) / v : (-c.u + Math.sqrt(c.u * c.u + 2 * a * d)) / a; }
  _step(dt) {
    const o = this.opts, v = this.v, Lp = this.loop.len; this.time += dt; this.loopCases = this.loopCases || [];
    for (const c of [...this.cases]) if (c.where !== 'pending' && c.mesh.parent !== this.caseRoot) this._drop(c); // caller took it
    // 1. entries at takeaway starts (only when the start is clear)
    for (const t of this.take) { const c = t.pending[0]; if (!c) continue; const last = t.cases[t.cases.length - 1];
      if (!last || last.s - c.hl - 0.02 >= this._spacing(last, c, 0.15)) { t.pending.shift(); this.caseRoot.add(c.mesh); c.where = 'take'; c.s = c.hl + 0.02; c.u = 0; t.cases.push(c); this.stats.inducted++; } }
    // 2. takeaways with metered release into the loop
    for (const t of this.take) {
      for (let i = 0; i < t.cases.length; i++) { const c = t.cases[i], lead = t.cases[i - 1]; let stop = lead ? lead.s - this._spacing(lead, c, 0.15) : Infinity;
        if (!c.released) { if (!lead && !t.inflight && this._canRelease(t, c)) { c.released = true; t.inflight = c; c.tArr = this.time + this._arrivalTime(c, t.path.len - c.s); } else stop = Math.min(stop, t.sHold); }
        this._speed(c, stop, dt); }
      const f = t.cases[0]; if (f && f.s >= t.path.len) { t.cases.shift(); t.inflight = null; f.where = 'loop'; f.s = t.sMerge + (f.s - t.path.len); this.loopCases.push(f); }
    }
    // 3. loop (constant speed, scan, divert decisions, transfers)
    for (const c of [...this.loopCases]) { const s0 = c.s; c.u = Math.min(v, c.u + o.accel * dt); c.s += c.u * dt; const ds = c.s - s0, crossed = (x) => { const d = ((x - s0) % Lp + Lp) % Lp; return d < ds; };
      if (crossed(this.sScan)) { this.pulse = 1; c.scanned = Math.random() >= o.noReadRate; if (!c.scanned) this.stats.noRead++; c.decided = -1; }
      for (const l of this.lanes) {
        if (crossed(l.sDec) && c.scanned && c.lane === l.k && c.decided < 0) {
          if (this._laneFree(l, c)) { c.decided = l.k; l.last = c; this._assignShoes(c); } else { c.decided = -2; } }
        if (crossed(l.sD) && c.decided === l.k) { c.where = 'lane'; c.s = ((c.s - l.sD) % Lp + Lp) % Lp; l.cases.push(c); this.loopCases.splice(this.loopCases.indexOf(c), 1); this.stats.sorted++; c.lnRef = l; break; }
      }
      if (c.where === 'loop' && crossed(0)) { c.laps++; if (c.scanned) this.stats.recirc++; }
      if (c.where === 'loop') c.s = ((c.s % Lp) + Lp) % Lp;
    }
    // 4. lanes: divert → chute → spiral → accumulate at the lane end
    for (const l of this.lanes) for (let i = 0; i < l.cases.length; i++) { const c = l.cases[i], lead = l.cases[i - 1];
      const stop = lead ? lead.s - this._spacing(lead, c, o.laneGap) : l.path.len - c.hl - 0.04;
      this._speed(c, stop, dt);
      if (!c.arrived && (!lead || lead.arrived) && c.s >= stop - 0.005 && c.u < 1e-3 && c.s > l.path.len - o.laneLength) { c.arrived = true; this.stats.arrived++; this._pose(c); for (const cb of this.cbs) cb(c.mesh, l.k); } }
    for (const c of this.cases) if (c.where !== 'pending' && c.where !== 'removed') this._pose(c);
    this._updateBed(dt);
    this.pulse *= Math.exp(-dt * 5); this.archMat.emissiveIntensity = 0.25 + 3.0 * this.pulse; this.archSpark.emissiveIntensity = 0.2 + 2.2 * this.pulse;
  }
  _canRelease(t, c) { // predicted loop occupancy at the merge point when this case gets there
    if (c.s < t.sHold - 3) return false; const Lp = this.loop.len, T = this._arrivalTime(c, t.path.len - c.s), g = this.opts.gap + 0.15;
    for (const k of this.loopCases) { let d = ((k.s + this.v * T - t.sMerge) % Lp + Lp) % Lp; if (d > Lp / 2) d -= Lp; if (Math.abs(d) < this._spacing(k, c, g)) return false; }
    for (const t2 of this.take) { const k = t2.inflight; if (!k || t2 === t) continue; let d = ((t2.sMerge + this.v * (this.time + T - k.tArr) - t.sMerge) % Lp + Lp) % Lp; if (d > Lp / 2) d -= Lp; if (Math.abs(d) < this._spacing(k, c, g)) return false; }
    return true;
  }
  _laneFree(l, c) { const o = this.opts, cap = o.laneLength - 1.6; let used = c.hl * 2 + o.laneGap;
    for (const k of l.cases) used += k.hl * 2 + o.laneGap; if (used > cap) return false;
    const L = l.last; if (L && L.where !== 'removed') { const sEq = L.where === 'lane' ? L.s : (((L.s - l.sD) % this.loop.len) - this.loop.len) % this.loop.len; const me = ((c.s - l.sD) % this.loop.len - this.loop.len) % this.loop.len;
      if (sEq - me < this._spacing(L, c, o.gap)) return false; }
    return true; }
  _assignShoes(c) { const b = this.bed, uc = c.s - this.sBed0; for (let i = 0; i < b.n; i++) { const q = ((b.q0 + i * b.pitch) % b.perim + b.perim) % b.perim; if (q <= b.Lb && Math.abs(q - uc) <= c.hl + 0.03) b.who[i] = c; } }

  _pose(c) {
    const path = c.where === 'take' ? c.t.path : c.where === 'loop' ? this.loop : c.lnRef.path;
    const P = _v[0], T = _v[1], N = _v[2], L = _v[3]; path.frame(c.s, P, T, N, L);
    let lift = 0; const P2 = _v[4], T2 = _v[5], N2 = _v[6], L2 = _v[7], cc = _v[8], sf = _v[9];
    for (const [a, b] of CORNERS) { cc.copy(P).addScaledVector(T, a * c.hl).addScaledVector(L, b * c.hw);
      let s2 = c.s + a * c.hl; for (let it = 0; it < 2; it++) { path.frame(s2, P2, T2, N2, L2); s2 += sf.subVectors(cc, P2).dot(T2); }
      path.frame(s2, P2, T2, N2, L2); sf.copy(P2).addScaledVector(L2, sf.subVectors(cc, P2).dot(L2));
      const pen = sf.sub(cc).dot(N2); if (pen > lift) lift = pen; }
    if (lift > 0.001) lift = lift * 1.12 + 0.004; // margin for sampled-surface curvature between probe points (helix inner edge)
    c.lift = lift; const m = c.mesh;
    m.position.copy(P).addScaledVector(N, c.hh + lift + 0.0005 - c.cy);
    _m4.makeBasis(T, N, L); m.quaternion.setFromRotationMatrix(_m4);
  }
  _updateBed(dt) {
    const b = this.bed; b.q0 = (b.q0 + this.v * dt) % b.perim; const pos = _v[0], up = _v[1], qq = new THREE.Quaternion(), rot = new THREE.Quaternion(), sc = _v[2].set(1, 1, 1);
    const cp = _v[3]; const rD = b.rD, Lb = b.Lb, perim = b.perim;
    for (let i = 0; i < b.n; i++) { const q = ((b.q0 + i * b.pitch) % perim + perim) % perim; let u, y, ang;
      if (q <= Lb) { u = q; y = -0.01; ang = 0; }
      else if (q <= Lb + Math.PI * rD) { ang = (q - Lb) / rD; u = Lb + rD * Math.sin(ang); y = -0.01 - rD * (1 - Math.cos(ang)); }
      else if (q <= 2 * Lb + Math.PI * rD) { ang = Math.PI; u = Lb - (q - Lb - Math.PI * rD); y = -0.01 - 2 * rD; }
      else { ang = Math.PI + (q - 2 * Lb - Math.PI * rD) / rD; u = -rD * Math.sin(ang - Math.PI); y = -0.01 - rD * (1 + Math.cos(ang - Math.PI)); }
      if (ang > 0) y -= Math.min(0.03, 0.08 * Math.min(ang, 2 * Math.PI - ang)); // dip on drums so slat corners never rise above the belt plane
      pos.copy(b.O).addScaledVector(b.T, u); pos.y += y;
      rot.setFromAxisAngle(_Z, -ang); qq.copy(b.base).multiply(rot);
      _m4.compose(pos, qq, sc); b.slats.setMatrixAt(i, _m4);
      // shoe lateral
      if (q <= Lb) { const c = b.who[i];
        if (c && c.where !== 'removed') { const w = this._southSpan(c, u, 0.055); if (w !== null) b.lat[i] = Math.min(b.far, Math.max(b.home, w - 0.03)); }
        b.top[i] = b.lat[i]; }
      else { b.who[i] = null; const f = Math.min(1, (q - Lb) / (perim - Lb)); const e = f * f * (3 - 2 * f); b.lat[i] = b.top[i] + (b.home - b.top[i]) * e; if (f >= 1) b.lat[i] = b.home; }
      if (q > perim - 0.2) b.lat[i] = b.home;
      up.set(0, 1, 0).applyQuaternion(rot); // in bed basis
      cp.set(0, 0.01 + 0.0175, 0).applyQuaternion(rot); cp.z += b.lat[i]; cp.applyQuaternion(b.base); cp.add(pos);
      _m4.compose(cp, qq, sc); b.shoes.setMatrixAt(i, _m4);
    }
    b.slats.instanceMatrix.needsUpdate = b.shoes.instanceMatrix.needsUpdate = true;
  }
  _southSpan(c, u, hu) { // lowest case-footprint lateral over the shoe's along-belt extent [u-hu, u+hu]
    let best = null; for (let k = -4; k <= 4; k++) { const w = this._southEdge(c, u + hu * k / 4); if (w !== null && (best === null || w < best)) best = w; }
    if (best !== null) for (const p of this._pts) if (p[0] >= u - hu && p[0] <= u + hu && p[1] < best) best = p[1];
    return best;
  }
  _southEdge(c, u) { // lowest lateral (bed w) of the case footprint at along-position u (null if outside)
    const b = this.bed, m = c.mesh, rel = _v[4].copy(m.position).sub(b.O), uc = rel.dot(b.T), wc = rel.dot(b.D);
    const ax = _v[5].set(1, 0, 0).applyQuaternion(m.quaternion), th = Math.atan2(ax.dot(b.D), ax.dot(b.T)); const ct = Math.cos(th), st = Math.sin(th);
    const pts = [[1, 1], [1, -1], [-1, -1], [-1, 1]].map(([a, bb]) => [uc + a * c.hl * ct - bb * c.hw * st, wc + a * c.hl * st + bb * c.hw * ct]);
    this._pts = pts; let best = null; for (let i = 0; i < 4; i++) { const p = pts[i], q = pts[(i + 1) % 4]; if ((u - p[0]) * (u - q[0]) > 0 || p[0] === q[0]) continue;
      const w = p[1] + (q[1] - p[1]) * (u - p[0]) / (q[0] - p[0]); if (best === null || w < best) best = w; }
    return best;
  }
}
const CORNERS = [[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]];
const _v = Array.from({ length: 10 }, () => new THREE.Vector3()), _m4 = new THREE.Matrix4(), _Z = new THREE.Vector3(0, 0, 1);

/* ---------------------------------------------------------------- module-level facade */
let last = null;
export function create(scene, opts = {}) { last = new SorterInstance(scene, opts); return last; }
export function update(dt) { if (last) last.update(dt); }
export function addCase(mesh, laneId, o) { return last ? last.addCase(mesh, laneId, o) : null; }
export function onCaseArrived(cb) { return last ? last.onCaseArrived(cb) : null; }
export function getLaneEndWorld(laneId, target) { return last ? last.getLaneEndWorld(laneId, target) : null; }
export function getInstance() { return last; }
export { SorterInstance };
