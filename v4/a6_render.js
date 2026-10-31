// ======================= RENDER =======================
const _M0 = new THREE.Matrix4(), _M1 = new THREE.Matrix4(), _R = new THREE.Matrix4(), _P = new THREE.Vector3();
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
function part(pool, ox, oy, oz, rx, col, sx = 1, sy = 1, sz = 1) { _M1.makeTranslation(ox, oy, oz); _R.makeRotationX(rx); _M1.multiply(_R); if (sx !== 1 || sy !== 1 || sz !== 1) _M1.multiply(_R.makeScale(sx, sy, sz)); _M1.premultiply(_M0); pool.put(_M1, col); }
const WOBJ = []; // dummy Object3Ds so tools can read worker positions
// ---- Inky's worker.js: 3 looks, each part one InstancedMesh; every sim worker gets a bone-only rig posed with Inky's pose functions ----
const WVAR = []; for (const pl of [LEG, ARM, TOR, HEAD, CAP]) pl.mesh.visible = false;
function mkVariant(opts, recol) { const g = buildWorkerI(THREE, PM, opts); g.updateMatrixWorld(true); const parts = [];
  g.traverse((o) => { if (o.isMesh) parts.push({ pn: o.parent.name, m: o.matrix.clone(), geo: o.geometry, mat: o.material }); });
  const pools = parts.map((pt) => { let geo = pt.geo; if (recol) { geo = geo.clone(); const c = geo.attributes.color; for (let k = 0; k < c.count; k++) for (const [from, to] of recol) { if (Math.abs(c.getX(k) - from.r) + Math.abs(c.getY(k) - from.g) + Math.abs(c.getZ(k) - from.b) < 0.02) { c.setXYZ(k, to.r, to.g, to.b); break; } } }
    const im = new THREE.InstancedMesh(geo, pt.mat, 48); im.count = 0; im.frustumCulled = false; scene.add(im); return im; });
  return { g, parts, pools, n: 0 }; }
WVAR.push(mkVariant({ seed: 2, height: 1.75 }), mkVariant({ seed: 7, height: 1.75 }),
  mkVariant({ seed: 4, height: 1.75 }, [[new THREE.Color(0x0071ce), new THREE.Color(0x3b4049)], [new THREE.Color(0x005aa8), new THREE.Color(0x2c3037)], [new THREE.Color(0xffc220), new THREE.Color(0x8a8f96)]]));
function cloneRig(src) { const map = {}; const rec = (o) => { const c = new THREE.Object3D(); c.name = o.name; c.position.copy(o.position); c.quaternion.copy(o.quaternion); c.scale.copy(o.scale); map[o.name] = c; for (const ch of o.children) if (!ch.isMesh) c.add(rec(ch)); return c; };
  const G = rec(src); const piv = {}; for (const k of Object.keys(src.userData.pivots)) piv[k] = map[k]; G.userData = { pivots: piv, hipHeight: src.userData.hipHeight }; return { G, map }; }
const _GW = new THREE.Vector3();
function gripOf(j) { if (!j || !j.g) return null; if (!j.grip) j.grip = j.g.getObjectByName('grip'); return j.grip ? j.grip.getWorldPosition(_GW) : null; }
function drawWorker(w, i) {
  let x = w.x, y = w.y, z = w.z, yaw = w.yaw;
  if (!w.rig) { const v = (w.sit || w.torso === COL.bev || w.torso === COL.snk || w.torso === COL.black) ? 2 : (i % 2); const { G, map } = cloneRig(WVAR[v].g); w.rig = G; w.vi = v; w.rp = WVAR[v].parts.map((pt) => map[pt.pn]); }
  const R = w.rig, P = R.userData.pivots, V = WVAR[w.vi];
  const moving = w.ph !== w._lph; w._lph = w.ph; const p = w.pose, ph = ((w.ph / (Math.PI * 2)) % 1 + 1) % 1;
  if (w.sit) {
    if (w.seat && w.seat.obj) wSeat(R, w.seat.obj);
    else { if (w.seatOf) { const o = w.seatOf; _P.set(w.seat[0], w.seat[1], w.seat[2]); o.localToWorld(_P); x = _P.x; y = _P.y; z = _P.z; yaw = o.rotation.y; }
      if (R.parent) R.parent.remove(R); wSeat(R); R.position.set(x, y - R.userData.hipHeight, z); R.rotation.set(0, yaw, 0); }
  } else {
    R.position.set(x, y, z); R.rotation.set(0, yaw, 0);
    const gw = (p === 'pull' || p === 'push') ? gripOf(w.jack) : null;
    if (p === 'pull') { R.updateMatrixWorld(true); wPull(R, gw ? gw.clone() : undefined); if (moving) { const a = ph * Math.PI * 2; P.hip_L.rotation.x = -0.4 * Math.sin(a); P.hip_R.rotation.x = 0.4 * Math.sin(a); } }
    else { if (moving) wWalk(R, ph); else wRest(R);
      const arm = (l, r, el = -0.3) => { P.shoulder_L.rotation.x = l; P.shoulder_R.rotation.x = r; P.elbow_L.rotation.x = P.elbow_R.rotation.x = el; };
      if (p === 'carry') { arm(-0.75, -0.75, -0.75); P.shoulder_L.rotation.z = -0.12; P.shoulder_R.rotation.z = 0.12; }
      else if (p === 'push') { P.spine.rotation.x = 0.22; if (gw) { R.updateMatrixWorld(true); wHands(R, gw.clone(), 'both', 0.3); } else arm(-1.15, -1.15); }
      else if (p === 'pump') { P.spine.rotation.x = 0.18; if (gw) { R.updateMatrixWorld(true); wHands(R, gw.clone(), 'R'); } else arm(0.1, -0.9 + Math.sin(T * 10) * 0.45); }
      else if (p === 'bend') { P.spine.rotation.x = 0.7; P.hips.rotation.x = 0.2; P.hip_L.rotation.x = P.hip_R.rotation.x = -0.35; P.knee_L.rotation.x = P.knee_R.rotation.x = 0.55; P.hips.position.y = 0.86; arm(-1.25, -1.25, -0.4); }
      else if (p === 'reach') arm(-1.35, -1.35, -0.25);
      else if (p === 'reachHi') arm(-2.6, -2.6, -0.15);
      else if (p === 'scan') { P.shoulder_R.rotation.x = -1.0; P.elbow_R.rotation.x = -0.9; P.shoulder_L.rotation.x = -0.7; P.elbow_L.rotation.x = -0.9; } }
  }
  R.updateMatrixWorld(true);
  for (let k = 0; k < V.parts.length; k++) { const pool = V.pools[k]; if (pool.count >= 48) continue; _M1.multiplyMatrices(w.rp[k].matrixWorld, V.parts[k].m); pool.setMatrixAt(pool.count++, _M1); }
  if (w.tool && (p === 'scan' || p === 'idle' || p === 'walk')) { _M0.makeTranslation(x, y, z); _M0.multiply(_R.makeRotationY(yaw)); const sc = p === 'scan'; part(DEV, -0.2, sc ? 1.22 : 0.9, sc ? 0.42 : 0.1, sc ? -0.5 : 0, COL.dev); }
  // contact shadow
  if (!w.sit) BLOB.put(TRS(x, 0.006, z, 0, 0.75, 1, 0.75));
  const o = WOBJ[i] || (WOBJ[i] = new THREE.Object3D()); o.position.set(x, y, z); o.name = 'worker'; o.updateMatrixWorld(); w.obj = o;
}
const _hp = (w) => { const [fx, fz] = fwd(w.yaw); return [w.x + fx * HAND[2], w.y + HAND[1], w.z + fz * HAND[2]]; };
function render3d() {
  for (const p of [PAL, CART, WRAP, BLOB, TOTE, DEV, CARTS, GARM]) p.begin();
  // jacks
  JK.forEach((j, i) => { const g = j.g; if (!g) return; g.visible = true; g.position.set(j.x, 0, j.z); g.rotation.y = j.yaw; if (g.userData.handle) g.userData.handle.rotation.x = j.tilt; g.updateMatrixWorld(true); BLOB.put(TRS(j.x, 0.006, j.z - 0, j.yaw, 0.7, 1, 1.6)); });
  for (let i = JK.length; i < JACK_GROUPS.length; i++) JACK_GROUPS[i].visible = false;
  for (const v of WVAR) for (const pl of v.pools) pl.count = 0;
  W.forEach(drawWorker);
  for (const v of WVAR) for (const pl of v.pools) pl.instanceMatrix.needsUpdate = true;
  // skids
  for (const s of SK) { if (s.inky) { s.inkyOn = s.show && s.wrapped && s.wrapH >= s.wrap0 - 0.002; s.inky.visible = s.inkyOn; if (s.inkyOn) { s.inky.position.set(s.x, s.y, s.z); s.inky.rotation.y = s.ry + Math.PI / 2; if (s.y < 0.2) BLOB.put(TRS(s.x, 0.008, s.z, s.ry, 1.35, 1, 1.55)); continue; } }
    if (!s.show) continue; const shadowY = s.y > -0.5 ? 0.007 : GROUND + 0.007;
    if (s.grp) { s.grp.position.set(s.x, s.y, s.z); s.grp.rotation.y = s.ry + Math.PI / 2; }
    else PAL.put(TRS(s.x, s.y, s.z, s.ry), s.col);
    if (s.y < 0.2) BLOB.put(TRS(s.x, shadowY + 0.001, s.z, s.ry, 1.35, 1, 1.55));
    if (s.wrapped || s.wrapH > 0.01) WRAP.put(TRS(s.x, s.y + PAL_H, s.z, s.ry, 1.07, Math.max(0.01, s.wrapH), 1.27)); }
  for (const b of BX) { if (b.st === 'gone' || (b.st === 'skid' && b.sk && b.sk.inkyOn)) continue; const [x, y, z, ry] = boxPos(b); CART.put(TRS(x, y, z, ry, b.w, b.h, b.d, b.damaged ? 0.12 : 0), b.col); }
  // carts / dolly
  for (const c of CT) { CARTS.put(TRS(c.x, 0, c.z, c.yaw), c.kind === 'dolly' ? COL.maroon : (c.kind === 'ogp' ? COL.omni : COL.cart)); BLOB.put(TRS(c.x, 0.006, c.z, c.yaw, 0.8, 1, 1.3)); }
  // totes (OGP instanced, pharmacy = Inky's McKesson groups)
  for (const t of OT) { let x, y, z, ry; if (t.st === 'cart') { const c = t.on; const [fx, fz] = fwd(c.yaw); x = c.x + fx * t.lz + fz * t.lx; z = c.z + fz * t.lz - fx * t.lx; y = t.ly; ry = c.yaw + Math.PI / 2; } else if (t.st === 'carry') { [x, y, z] = _hp(t.carrier); y -= 0.12; ry = t.carrier.yaw + Math.PI / 2; } else { x = t.x; y = t.y; z = t.z; ry = t.ry; }
    if (t.g) { t.g.position.set(x, y, z); t.g.rotation.y = ry; } else TOTE.put(TRS(x, y, z, ry), COL.ogp); }
  for (const g of GA) { if (g.st === 'carry') { const [x, y, z] = _hp(g.carrier); GARM.put(TRS(x, y + 0.45, z, g.carrier.yaw + Math.PI / 2), g.col); } else GARM.put(TRS(g.x, g.y, g.z, 0), g.col); }
  // Zebra handhelds: one in the receiver's hand while scanning, one riding on top of the first pop skid
  { const r = W.find((w) => w.torso === COL.dsd && w.tool); if (r && r.pose === 'scan') { const [x, y, z] = _hp(r); ZEBRA.visible = true; ZEBRA.position.set(x, y + 0.1, z); ZEBRA.rotation.set(-0.9, r.yaw, 0, 'YXZ'); } else ZEBRA.visible = false;
    const ps = SK.find((s) => s.pop); if (ps) { ZEBRA2.position.set(ps.x + 0.1, ps.y + 0.5, ps.z + 0.15); ZEBRA2.rotation.set(-Math.PI / 2, ps.ry + 0.4, 0, 'YXZ'); } }
  for (const p of [PAL, CART, WRAP, BLOB, TOTE, DEV, CARTS, GARM]) p.end();
}
window.__sim = { get t() { return T; }, get JK() { return JK; }, get W() { return W; }, VEH, renderer, camera, scene, get workers() { return W.filter((w) => !w.sit).map((w) => ({ id: 'worker', type: 'associate', obj: w.obj })); } };
