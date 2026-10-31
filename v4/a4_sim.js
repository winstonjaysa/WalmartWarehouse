// ======================= SIMULATION (real elapsed time, clamped dt) =======================
const NIGHT = 240;               // one "night" loop in sim seconds, then a fade and a fresh night
let T = 0, DT = 0, W = [], BX = [], SK = [], JK = [], CT = [], GA = [], OT = [], BR_ = [], VEH = [];
window.__sim = { get t() { return T; }, VEH };
const yawTo = (dx, dz) => Math.atan2(dx, dz);
const angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
const fwd = (yaw) => [Math.sin(yaw), Math.cos(yaw)];

// --- Departments (names only where research verified; Canada/US conflicts shown as number only) ---
const DEPT = { 1: 'Candy & Tobacco', 2: 'Health & Beauty', 4: 'Paper Goods', 7: 'Toys', 8: 'Pets', 9: 'Sporting Goods', 11: 'Hardware', 13: 'Household Chemicals', 14: 'Kitchen & Dining', 40: 'OTC Pharmacy', 46: 'Cosmetics', 72: 'Electronics', 92: 'Dry Grocery' };
const dname = (n) => DEPT[n] ? `Dept ${n} · ${DEPT[n]}` : `Dept ${n}`;
const SKID_Z = [7.5, 5, 2.5, 0, -2.5, -5];
const WEST_DEPTS = [46, 2, 13, 4, 8, 1], EAST_DEPTS = [92, 7, 14, 72, 11, 9];
const STN = { WN: { x: 7.0, z: 5.0 }, WS: { x: 7.0, z: -2.5 }, EN: { x: 9.0, z: 3.5 }, ES: { x: 9.0, z: -3.5 } };
const PCOL = [COL.blue, COL.red, COL.nat, COL.chep];
const KRAFT = ['#c79a62', '#b98a52', '#d2a774', '#c49a6c', '#e8e3d7', '#dcd3c0', '#efece4', '#d9cbb0', '#f3f1ea', '#ffffff', '#8e5b32'].map(C);

function mkWorker(o) { const w = Object.assign({ x: 0, z: 0, y: 0, yaw: 0, pose: 'idle', ph: rnd() * 6, carry: null, tool: false, sit: false, hide: false, torso: COL.st2, legs: COL.jeans, skin: COL.skin[(rnd() * 5) | 0], cap: null, tilt: 0 }, o); W.push(w); return w; }
function mkSkid(o) { const s = Object.assign({ x: 0, z: 0, y: 0, ry: 0, col: COL.blue, boxes: [], nx: 2, nz: 2, cells: null, wrapped: false, wrapH: 0, wrap0: 0, follow: null, grp: null, show: true }, o); s.cells = new Float32Array(s.nx * s.nz); SK.push(s); return s; }
function mkBox(o) { const b = Object.assign({ w: 0.45, h: 0.32, d: 0.55, col: KRAFT[(rnd() * KRAFT.length) | 0], st: 'free', sk: null, lx: 0, ly: 0, lz: 0, lry: 0, x: 0, y: 0, z: 0, ry: 0, rz: 0, v: 0, stop: null, dept: 0, carrier: null, tex: 0 }, o); BX.push(b); return b; }
// put box onto skid using the lowest cell
function skidCell(sk) { let ci = 0; for (let i = 1; i < sk.cells.length; i++) if (sk.cells[i] < sk.cells[ci] - 0.02) ci = i; const ix = ci % sk.nx, iz = (ci / sk.nx) | 0; return { ci, lx: (ix + 0.5) / sk.nx * 1.02 - 0.51, lz: (iz + 0.5) / sk.nz * 1.22 - 0.61, ly: sk.cells[ci] }; }
function attachToSkid(b, sk, jitter = 0.02) { const c = skidCell(sk); b.st = 'skid'; b.sk = sk; b.lx = c.lx + (rnd() - 0.5) * jitter; b.lz = c.lz + (rnd() - 0.5) * jitter; b.ly = c.ly; b.lry = (rnd() - 0.5) * 0.06; sk.cells[c.ci] += b.h; sk.boxes.push(b); b.carrier = null; }
function detachTop(sk) { if (!sk.boxes.length) return null; let bi = 0; for (let i = 1; i < sk.boxes.length; i++) if (sk.boxes[i].ly > sk.boxes[bi].ly) bi = i; const b = sk.boxes.splice(bi, 1)[0]; // recompute cell height
  const ix = Math.round(((b.lx + 0.51) / 1.02) * sk.nx - 0.5), iz = Math.round(((b.lz + 0.61) / 1.22) * sk.nz - 0.5); const ci = clamp(ix, 0, sk.nx - 1) + clamp(iz, 0, sk.nz - 1) * sk.nx; sk.cells[ci] = Math.max(0, sk.cells[ci] - b.h); return b; }
function skidTopY(sk) { let m = 0; for (const c of sk.cells) m = Math.max(m, c); return m; }
function skidWorld(sk, lx, lz) { const c = Math.cos(sk.ry), s = Math.sin(sk.ry); return [sk.x + lx * c + lz * s, sk.z - lx * s + lz * c]; }
function fillSkid(sk, n, size) { for (let i = 0; i < n; i++) { const b = mkBox(size()); attachToSkid(b, sk); } }

// --- jacks (Inky's palletJack, flipped so forks point -z and the handle side is +z) ---
const JACK_GROUPS = [];
for (let i = 0; i < 10; i++) { const outer = new THREE.Group(); const j = buildJack(THREE, PM, {}); j.rotation.y = Math.PI; outer.add(j); outer.userData.handle = j.userData.pivots.handle; scene.add(outer); JACK_GROUPS.push(outer); }
const J_STEER = 0.61, J_PAL = -0.135, J_REACH = 1.45;
function mkJack(o) { const j = Object.assign({ x: 0, z: 0, yaw: 0, lift: 0, tilt: -0.15, skid: null, g: JACK_GROUPS[JK.length] }, o); JK.push(j); return j; }
function jackSteer(j) { const [fx, fz] = fwd(j.yaw); return [j.x + fx * J_STEER, j.z + fz * J_STEER]; }
function syncJackSkid(j) { if (!j.skid) return; const [fx, fz] = fwd(j.yaw); const s = j.skid; s.x = j.x + fx * J_PAL; s.z = j.z + fz * J_PAL; s.ry = j.yaw; s.y = j.lift + s.yBase; }
function setJackFromSteer(j, sx, sz, yaw) { const [fx, fz] = fwd(yaw); j.yaw = yaw; j.x = sx - fx * J_STEER; j.z = sz - fz * J_STEER; syncJackSkid(j); }

// ---------------- behaviour helpers (generators; one yield = one frame) ----------------
function* wait(w, t, pose = 'idle') { let e = 0; while (e < t) { if (w) w.pose = pose; e += DT; yield; } }
function* until(w, cond, pose = 'idle') { while (!cond()) { if (w) w.pose = pose; yield; } }
function* turnTo(w, yaw, rate = 4) { while (Math.abs(angDiff(w.yaw, yaw)) > 0.03) { const d = angDiff(w.yaw, yaw); w.yaw += clamp(d, -rate * DT, rate * DT); w.pose = w.carry ? 'carry' : 'walk'; w.ph += DT * 3; yield; } w.yaw = yaw; }
function* face(w, x, z) { yield* turnTo(w, yawTo(x - w.x, z - w.z)); }
function* walkTo(w, x, z, sp = 1.25, pose) {
  for (;;) { const dx = x - w.x, dz = z - w.z, d = Math.hypot(dx, dz); if (d < 0.02) break;
    const ty = yawTo(dx, dz), da = angDiff(w.yaw, ty); w.yaw += clamp(da, -5 * DT, 5 * DT);
    const step = Math.min(d, sp * DT * (Math.abs(da) > 1.2 ? 0.25 : 1)); w.x += dx / d * step; w.z += dz / d * step; w.ph += step * 4.2; w.pose = pose || (w.carry ? 'carry' : 'walk'); yield; }
}
function* walkPath(w, pts, sp, pose) { for (const p of pts) yield* walkTo(w, p[0], p[1], sp, pose); }
function* pick(w, b, take) { // bend or reach depending on height, then the box is in the hands
  const by = b.st === 'skid' ? b.sk.y + PAL_H + b.ly : b.y; const pose = by < 0.7 ? 'bend' : (by > 1.5 ? 'reachHi' : 'reach');
  const p = boxPos(b); yield* face(w, p[0], p[2]); yield* wait(w, 0.55, pose); if (take) take(); b.st = 'carry'; b.carrier = w; w.carry = b; yield* wait(w, 0.25, pose);
}
function* placeAt(w, b, fn, y) { const pose = y < 0.7 ? 'bend' : (y > 1.5 ? 'reachHi' : 'reach'); yield* wait(w, 0.5, pose); fn(); w.carry = null; yield* wait(w, 0.25, pose); }
function* placeOnSkid(w, b, sk) { const c = skidCell(sk); const [wx, wz] = skidWorld(sk, c.lx, c.lz); yield* face(w, wx, wz); yield* placeAt(w, b, () => attachToSkid(b, sk), sk.y + c.ly); }
function approach(sk, fromX, fromZ, r = 0.95) { const dx = fromX - sk.x, dz = fromZ - sk.z, d = Math.hypot(dx, dz) || 1; return [sk.x + dx / d * r, sk.z + dz / d * r]; }
function rollerFree(z, gap = 0.62) { for (const b of BX) if (b.st === 'roller' && Math.abs(b.rz - z) < gap) return false; return true; }
function putOnRoller(b, z) { b.st = 'roller'; b.rz = z; b.v = 0; b.carrier = null; b.sk = null; }

// pallet jack operations
function* jackGrab(w, j) { w.jack = j; const [sx, sz] = jackSteer(j); const [fx, fz] = fwd(j.yaw); yield* walkTo(w, sx + fx * 1.05, sz + fz * 1.05); yield* face(w, sx, sz); j.tilt = -0.55; }
function* jackPushIn(w, j, sk, yaw) { w.jack = j; // short positioning push: forks slide under the pallet (<=1.5 m)
  const [fx, fz] = fwd(yaw); const tx = sk.x - fx * J_PAL, tz = sk.z - fz * J_PAL; const sx0 = j.x, sz0 = j.z, y0 = j.yaw; let e = 0; const dur = 2.2;
  while (e < dur) { e += DT; const k = ease(Math.min(1, e / dur)); j.x = lerp(sx0, tx, k); j.z = lerp(sz0, tz, k); j.yaw = y0 + angDiff(y0, yaw) * k; const [sx, sz] = jackSteer(j); const [gx, gz] = fwd(j.yaw); w.x = sx + gx * 1.0; w.z = sz + gz * 1.0; w.yaw = j.yaw + Math.PI; w.pose = 'push'; w.ph += DT * 2; j.tilt = -0.55; yield; }
  sk.yBase = sk.y; j.skid = sk; sk.jack = j; }
function* jackPump(w, j, n = 3) { w.jack = j; for (let i = 0; i < n; i++) { let e = 0; while (e < 0.6) { e += DT; j.tilt = -0.55 + Math.sin(e / 0.6 * Math.PI) * 0.5; if (j.skid) { j.lift = Math.min(0.05, j.lift + DT * 0.03); syncJackSkid(j); } w.pose = 'pump'; yield; } } }
function* jackPull(w, j, pts, sp = 0.95) { w.jack = j; // worker walks ahead pulling; jack trails (tractor-trailer follow)
  { const [sx, sz] = jackSteer(j); yield* turnTo(w, yawTo(w.x - sx, w.z - sz)); }
  for (const p of pts) { for (;;) { const dx = p[0] - w.x, dz = p[1] - w.z, d = Math.hypot(dx, dz); if (d < 0.03) break;
    const ty = yawTo(dx, dz), da = angDiff(w.yaw, ty); w.yaw += clamp(da, -2.5 * DT, 2.5 * DT); const step = Math.min(d, sp * DT * (Math.abs(da) > 0.8 ? 0.3 : 1));
    const [fx, fz] = fwd(w.yaw); w.x += fx * step; w.z += fz * step; w.ph += step * 4.2; w.pose = 'pull';
    const [sx, sz] = jackSteer(j); const hx = w.x - fx * 0.35, hz = w.z - fz * 0.35; let ex = hx - sx, ez = hz - sz; const el = Math.hypot(ex, ez) || 1; ex /= el; ez /= el;
    setJackFromSteer(j, hx - ex * (J_REACH - 0.35), hz - ez * (J_REACH - 0.35), yawTo(ex, ez)); j.tilt = -0.82; yield; } }
}
function* jackRelease(w, j) { w.jack = j; let e = 0; yield* wait(w, 0.4, 'pull'); while (j.lift > 0) { j.lift = Math.max(0, j.lift - DT * 0.08); syncJackSkid(j); w.pose = 'pull'; yield; } if (j.skid) { j.skid.jack = null; j.skid = null; } }
function* jackBackOut(w, j, dist = 1.5) { w.jack = j; // pull the forks out of the pallet along the handle direction
  const [fx, fz] = fwd(j.yaw); const x0 = j.x, z0 = j.z; let e = 0; const dur = dist / 0.7;
  while (e < dur) { e += DT; const k = Math.min(1, e / dur); j.x = x0 + fx * dist * k; j.z = z0 + fz * dist * k; const [sx, sz] = jackSteer(j); w.x = sx + fx * (J_REACH - 0.35) + fx * 0.35; w.z = sz + fz * (J_REACH - 0.35) + fz * 0.35; w.yaw = j.yaw; w.pose = 'pull'; w.ph += DT * 3; yield; }
  j.tilt = -0.15; }
// full fetch. An EMPTY jack is pushed handle-first (normal practice), the forks slide in, then pump. Loaded = always pulled.
function* jackPushPath(w, j, pts, sp = 0.9) {
  for (const p of pts) { for (;;) { const dx = p[0] - w.x, dz = p[1] - w.z, d = Math.hypot(dx, dz); if (d < 0.03) break;
    const ty = yawTo(dx, dz), da = angDiff(w.yaw, ty); w.yaw += clamp(da, -2.2 * DT, 2.2 * DT); const step = Math.min(d, sp * DT * (Math.abs(da) > 0.6 ? 0.25 : 1));
    const [fx, fz] = fwd(w.yaw); w.x += fx * step; w.z += fz * step; w.ph += step * 4.2; w.pose = 'push';
    // the jack is ahead of the worker; its steer point trails toward the hands
    const hx = w.x + fx * 0.4, hz = w.z + fz * 0.4; const [sx, sz] = jackSteer(j); let ex = sx - hx, ez = sz - hz; const el = Math.hypot(ex, ez) || 1; ex /= el; ez /= el;
    const nsx = hx + ex * (J_REACH - 0.4 - 0.35), nsz = hz + ez * (J_REACH - 0.4 - 0.35); setJackFromSteer(j, nsx, nsz, yawTo(-ex, -ez)); j.tilt = -0.55; yield; } }
}
function* jackFetch(w, j, sk, yaw, via = []) {
  const [fx, fz] = fwd(yaw); const preX = sk.x - fx * J_PAL + fx * 1.3, preZ = sk.z - fz * J_PAL + fz * 1.3; // jack origin before insert
  yield* jackGrab(w, j);
  const tgt = [preX + fx * (J_STEER + 1.0), preZ + fz * (J_STEER + 1.0)];
  yield* jackPushPath(w, j, via.concat([tgt]), 0.9);
  let e = 0; const x0 = j.x, z0 = j.z, y0 = j.yaw; // final short alignment
  while (e < 1.0) { e += DT; const k = ease(Math.min(1, e)); j.x = lerp(x0, preX, k); j.z = lerp(z0, preZ, k); j.yaw = y0 + angDiff(y0, yaw) * k; const [sx, sz] = jackSteer(j); w.x = sx + fx * 1.0; w.z = sz + fz * 1.0; w.yaw = yaw + Math.PI; w.pose = 'push'; yield; }
  yield* jackPushIn(w, j, sk, yaw); yield* jackPump(w, j, 3);
}
// re-grab a jack that is still under a skid (after a check-in stop) and pump it back up
function* jackRegrab(w, j, sk) { yield* jackGrab(w, j); sk.yBase = sk.y; j.skid = sk; sk.jack = j; yield* jackPump(w, j, 3); }

// ---------------- vehicles ----------------
// Blue snack-vendor cab-over + curtain-side trailer (Inky's parts), driven by an exact no-slip reverse.
const SNACK = { tractor: buildTractor(THREE, PM, {}), trailer: buildTrailer(THREE, PM, {}) };
// Inky's tractor-trailer placard defaults to 'Beverage Vendor'; relabel it 'Snack Vendor' (same layout as parts/v4 _placardCanvas)
{ const seen = new Set(); for (const o of [SNACK.tractor, SNACK.trailer]) o.traverse((m) => { const ms = m.material ? (Array.isArray(m.material) ? m.material : [m.material]) : []; for (const mt of ms) { const t = mt.map; if (!t || seen.has(t) || !t.image || t.image.width !== 1024 || t.image.height !== 512) continue; seen.add(t);
  const x = t.image.getContext('2d'); x.fillStyle = '#f7f7f4'; x.fillRect(36, 100, 952, 296); x.fillStyle = '#20242a'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = 'bold 116px "Helvetica Neue", Arial, sans-serif'; x.fillText('Snack Vendor', 512, 240); t.needsUpdate = true; } }); }
scene.add(SNACK.tractor, SNACK.trailer);
const TR_FW = -1.65, TR_STEER = 1.95, TL_KING = 7.2, TL_AXLE = -6.3, LT = TL_KING - TL_AXLE, WB = TR_STEER - TR_FW;
const SNACK_FINAL = { x: DOORS.C.x, z: 12.3 + 8.1 }; // trailer origin when docked (rear at z=12.3)
const AXLE_FINAL_Z = SNACK_FINAL.z + TL_AXLE;
const LANE_Z = 38.5;
const BZ = [[-27, LANE_Z], [-17.5, LANE_Z], [DOORS.C.x, AXLE_FINAL_Z + 10.5], [DOORS.C.x, AXLE_FINAL_Z]];
function bez(t) { const u = 1 - t; const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t; return [a * BZ[0][0] + b * BZ[1][0] + c * BZ[2][0] + d * BZ[3][0], a * BZ[0][1] + b * BZ[1][1] + c * BZ[2][1] + d * BZ[3][1]]; }
// precompute reverse path samples: axle pos, trailer heading, kingpin, tractor heading (arc-length param)
const REV = (() => { const N = 400, out = []; let prev = bez(0), s = 0; for (let i = 0; i <= N; i++) { const t = i / N, p = bez(t), q = bez(Math.min(1, t + 0.002)), q0 = bez(Math.max(0, t - 0.002)); let mx = q[0] - q0[0], mz = q[1] - q0[1]; const ml = Math.hypot(mx, mz); mx /= ml; mz /= ml; // motion dir (reversing)
    s += Math.hypot(p[0] - prev[0], p[1] - prev[1]); prev = p; const yT = yawTo(-mx, -mz); const kx = p[0] - mx * LT, kz = p[1] - mz * LT; out.push({ s, ax: p[0], az: p[1], yT, kx, kz }); }
  for (let i = 0; i < out.length; i++) { const a = out[Math.max(0, i - 1)], b = out[Math.min(out.length - 1, i + 1)]; let vx = b.kx - a.kx, vz = b.kz - a.kz; out[i].yC = yawTo(-vx, -vz); }
  // smooth tractor heading + compute steer angle from curvature
  for (let i = 0; i < out.length; i++) { const a = out[Math.max(0, i - 2)], b = out[Math.min(out.length - 1, i + 2)]; const ds = Math.max(1e-3, Math.hypot(b.kx - a.kx, b.kz - a.kz)); out[i].steer = clamp(Math.atan(WB * angDiff(a.yC, b.yC) / ds), -0.6, 0.6) * -1; }
  return out; })();
const REV_LEN = REV[REV.length - 1].s;
function placeTruck(kx, kz, yC, yT, steer, roll) {
  const [cf, cz] = fwd(yC); const tr = SNACK.tractor; tr.position.set(kx - cf * TR_FW, GROUND, kz - cz * TR_FW); tr.rotation.y = yC;
  const [tf, tz] = fwd(yT); const tl = SNACK.trailer; tl.position.set(kx - tf * TL_KING, GROUND, kz - tz * TL_KING); tl.rotation.y = yT;
  const pv = tr.userData.pivots; if (pv.steer_L) { pv.steer_L.rotation.y = steer; pv.steer_R.rotation.y = steer; }
  for (const k in pv) if (k.startsWith('wheel_')) pv[k].rotation.x = roll; for (const k in tl.userData.pivots) if (k.startsWith('wheel_')) tl.userData.pivots[k].rotation.x = roll;
}
const snackV = { id: 'snack-vendor-tractor-trailer', type: 'tractor-trailer', obj: SNACK.tractor, phase: 'approach', s: 0, roll: 0, x: 0, z: 0, yC: 0, yT: 0, steer: 0 };
const snackTrailerV = { id: 'snack-vendor-trailer', type: 'trailer', obj: SNACK.trailer };
// Red beverage-vendor box truck parked at the DSD door (rear door rolled up), driver in the cab.
const BOXT = buildBoxTruck(THREE, PM, {}); BOXT.position.set(DOORS.DSD.x, GROUND, 12.3 + 4.3); setRearDoor(BOXT, 1); scene.add(BOXT);
// pop skids (Inky) and pharmacy totes (Inky), handheld scanner (Inky)
const POPS = [buildPopSkid(THREE, PM, { seed: 3 }), buildPopSkid(THREE, PM, { seed: 8 })]; for (const p of POPS) scene.add(p);
// McKesson pharmacy pallet: 3 sealed totes per layer (2 or 3 layers by seed), 2-4 cartons on top, whole stack stretch-wrapped, delivery memo on top of the film
const MEMO_CELL = textSign(['DELIVERY MEMO', 'count totes · sign'], { w: 384, h: 256, bg: '#fbfbf7', fg: '#222', sub: '#555', border: '#9aa', size: 0.42 }); atlasTex.needsUpdate = true;
function mkMcPallet(layers, seedN) { const G = new THREE.Group(); const r = (() => { let q = seedN * 7919 + 13; return () => ((q = (q * 9301 + 49297) % 233280) / 233280); })();
  G.add(new THREE.Mesh(inkyPalletGeo(THREE, seedN, undefined, seedN % 2 ? 'blue' : 'natural'), PM.woodVC));
  const tote = buildMcK(THREE, PM, { open: 0 }); tote.updateMatrixWorld(true); const meshes = []; tote.traverse((o) => { if (o.isMesh) meshes.push(o); });
  const mats = []; for (let L = 0; L < layers; L++) for (let i = 0; i < 3; i++) { const m = new THREE.Matrix4().makeRotationY(Math.PI / 2); m.setPosition((i - 1) * 0.405, 0.146 + L * 0.302, 0); mats.push(m); }
  for (const me of meshes) { const im = new THREE.InstancedMesh(me.geometry, me.material, mats.length); mats.forEach((m, k) => im.setMatrixAt(k, new THREE.Matrix4().multiplyMatrices(m, me.matrixWorld))); G.add(im); }
  const top = 0.146 + layers * 0.302, nC = 2 + Math.floor(r() * 3), cg = [];
  for (let i = 0; i < nC; i++) { const w = 0.5, d = 0.42, h = 0.22 + r() * 0.12; const b = new THREE.BoxGeometry(w * (0.8 + r() * 0.2), h, d * (0.85 + r() * 0.15)); b.translate(((i % 2) - 0.5) * 0.56, top + h / 2, (((i / 2) | 0) - 0.5) * (nC > 2 ? 0.46 : 0) + (nC > 2 ? 0 : (i - 0.5) * 0.08)); cg.push(paint(b, KRAFT[(r() * 4) | 0])); }
  G.add(new THREE.Mesh(mergeGeometries(cg, false), PM.cardboardVC));
  const H = top + 0.36, ws = buildWrapped(THREE, PM, { seed: seedN, height: H }); const wrapMs = []; for (const c of [...ws.children]) if (c.name !== 'pallet' && c.name !== 'cartons') { G.add(c); wrapMs.push(c); }
  const pg = new THREE.PlaneGeometry(0.3, 0.2); const uv = pg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (MEMO_CELL.x + uv.getX(i) * MEMO_CELL.w) / ATL, 1 - (MEMO_CELL.y + (1 - uv.getY(i)) * MEMO_CELL.h) / ATL);
  pg.rotateX(-Math.PI / 2); pg.translate(0.12, H + 0.03, 0.05); const memo = new THREE.Mesh(norm(paint(pg, '#ffffff')), MAT.sign); G.add(memo);
  G.userData = { wrap: wrapMs, memo, H, layers, totes: layers * 3 }; G.visible = false; scene.add(G); return G; }
const MCP = [mkMcPallet(2, 3), mkMcPallet(3, 8)];
const INKY_WR = [];
const ZEBRA = buildZebra(THREE, PM, { screen: 'scan' }); ZEBRA.scale.setScalar(1.6); scene.add(ZEBRA); const ZEBRA2 = buildZebra(THREE, PM, { screen: 'list' }); ZEBRA2.scale.setScalar(1.6); scene.add(ZEBRA2);
