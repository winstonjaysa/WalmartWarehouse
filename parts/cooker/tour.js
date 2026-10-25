/**
 * tour.js — camera director for the RDC-7041 Walmart DC dashboard (QA B17 / L13).
 * Standalone ES module: imports only 'three'. No side effects at import (no DOM, no listeners until start()).
 *
 * 1) Auto director tour (12 shots, no cuts, loops seamlessly):
 *      import * as Tour from './tour.js';
 *      Tour.start(camera, controls, (stage) => vec3OrObject3D, { ui, signs });
 *      Tour.onCaption(({stage, title, text, shotIndex}) => ...);
 *      per frame (after controls.update()): Tour.update(dt);   Tour.stop();
 *
 * 2) Scroll-driven Explore mode (one department per wheel gesture / swipe / key):
 *      Tour.explore.start(camera, controls, { getTarget, getFacts, signs, ui, container });
 *      per frame (after controls.update()): Tour.explore.update(dt);   Tour.explore.stop();
 *
 * Texts follow SIM_SPEC.md §B + SIM_SPEC_WALMART.md (Mode A, conventional RDC). All equipment is human-operated.
 * World frame = walmart-dc.html (X = x-50, Z = 31-y, floor at Y 1.2, south/east walls cut low, north/west full height).
 */
import * as THREE from 'three';

/* ------------------------------------------------------------------ math helpers */
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const easeInOutCubic = (x) => { x = clamp01(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const easeInOutSine = (x) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(x));
const DEG = Math.PI / 180;
const V = (a) => new THREE.Vector3().fromArray(a);
/** critically damped follow (SmoothDamp), per component; mutates cur & vel */
function smoothDamp(cur, vel, target, omega, dt) {
  const x = omega * dt, e = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  for (const k of ['x', 'y', 'z']) {
    const change = cur[k] - target[k], temp = (vel[k] + omega * change) * dt;
    vel[k] = (vel[k] - omega * temp) * e; cur[k] = target[k] + (change + temp) * e;
  }
}
const finite = (v) => Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z);

/* ------------------------------------------------------------------ stage anchors (fallback when getTarget returns nothing) */
export const STAGE_POS = {
  home: [-4, 0, 4], gate: [100, 0, 70], yard: [40, 0, 70], receiving: [-28, 1.2, 26], reserve: [-26, 1.2, 2],
  crossdock: [-2.5, 1.2, 0], replen: [3, 1.2, 4], pick: [11, 1.2, 4], sorter: [30, 6.2, -16.5], wrap: [32, 1.2, -24],
  shipping: [-10, 1.2, -26], depart: [40, 0, -55],
};
// tour stage names (original brief) <-> explore stop ids
const ALIAS = { unload: 'receiving', putaway: 'reserve', sort: 'sorter', load: 'shipping', receiving: 'unload', reserve: 'putaway', sorter: 'sort', shipping: 'load' };
export const SIGN_FOR = { gate: 'GATE', yard: 'YARD', receiving: 'RECEIVING', unload: 'RECEIVING', reserve: 'RESERVE STORAGE', putaway: 'RESERVE STORAGE',
  crossdock: 'CROSS-DOCK', replen: 'RESERVE STORAGE', pick: 'PICK MODULE', sorter: 'SORTER', sort: 'SORTER', wrap: 'PALLET BUILD',
  shipping: 'SHIPPING', load: 'SHIPPING', depart: 'GATE' };

function resolveTarget(getTarget, id, out) {
  let r = null;
  const tryId = (k) => { if (!getTarget || r) return; try { const v = getTarget(k); if (v) r = v; } catch (e) { /* ignore builder errors */ } };
  tryId(id); if (!r && ALIAS[id]) tryId(ALIAS[id]);
  if (r && r.isObject3D) { r.updateWorldMatrix(true, false); r.getWorldPosition(out); }
  else if (r && Number.isFinite(r.x) && Number.isFinite(r.y) && Number.isFinite(r.z)) out.set(r.x, r.y, r.z);
  else out.fromArray(STAGE_POS[id] || STAGE_POS[ALIAS[id]] || STAGE_POS.home);
  if (!finite(out)) out.fromArray(STAGE_POS[id] || STAGE_POS.home);
  return out;
}
function callHighlight(signs, name, k) { try { if (signs && typeof signs.highlight === 'function') signs.highlight(name, k); } catch (e) { /* ignore */ } }

/* ------------------------------------------------------------------ framing solver (keeps signs/walls out of the way) */
// Building shell of walmart-dc.html: north + west walls full height, south + east walls cut low (cutaway). opts.walls=false disables.
export const DEFAULT_WALLS = [
  [[-50.3, 0, -31.3], [50.3, 13.2, -30.7]], [[-50.3, 0, -31.3], [-49.7, 13.2, 31.3]],
  [[-50.3, 0, 30.7], [50.3, 5.7, 31.3]], [[49.7, 0, -31.3], [50.3, 5.7, 31.3]],
].map(([a, b]) => new THREE.Box3(new THREE.Vector3(...a), new THREE.Vector3(...b)));
const ZONE_SIGNS = ['GATE', 'YARD', 'RECEIVING', 'RESERVE STORAGE', 'CROSS-DOCK', 'PICK MODULE', 'SORTER', 'PALLET BUILD', 'SHIPPING'];
const _bx = new THREE.Box3(), _ray = new THREE.Ray(), _hit = new THREE.Vector3(), _pc = new THREE.Vector3(), _fcam = new THREE.PerspectiveCamera();
/** world boxes of every sign board (cables ignored) + extra opts.occluders (Object3D[]) */
export function collectSignBoxes(signs, extra) {
  const roots = [];
  if (signs) {
    let map = null; try { map = signs.getSigns?.(); } catch (e) { /* */ }
    if (map && typeof map.values === 'function') roots.push(...map.values());
    else if (typeof signs.getSign === 'function') for (const n of ZONE_SIGNS) { try { const g = signs.getSign(n); if (g) roots.push(g); } catch (e) { /* */ } }
  }
  if (Array.isArray(extra)) roots.push(...extra);
  const out = [];
  for (const r of roots) {
    if (!r || !r.isObject3D) continue; r.updateWorldMatrix(true, true); const b = new THREE.Box3();
    let named = false; r.traverse((o) => { if (o.isMesh && /^(board|face)/i.test(o.name)) named = true; });
    // signs.js boards: use the board + faces only (ceiling plates / cables would stretch the box up to the roof)
    r.traverse((o) => { if (o.isMesh && o.visible !== false && !/cable/i.test(o.name) && (!named || /^(board|face)/i.test(o.name)) && o.geometry) {
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); _bx.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); b.union(_bx); } });
    if (!b.isEmpty()) out.push(b);
  }
  return out;
}
function boxCoverage(b, cam) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, front = 0, behind = 0;
  for (let i = 0; i < 8; i++) {
    _pc.set(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z).applyMatrix4(cam.matrixWorldInverse);
    if (_pc.z > -cam.near) { behind++; continue; } front++;
    _pc.applyMatrix4(cam.projectionMatrix); x0 = Math.min(x0, _pc.x); x1 = Math.max(x1, _pc.x); y0 = Math.min(y0, _pc.y); y1 = Math.max(y1, _pc.y);
  }
  if (!front) return { cov: 0, central: 0 };
  if (behind && b.distanceToPoint(cam.position) < 10) return { cov: 1, central: 1 };
  const cx0 = Math.max(-1, x0), cx1 = Math.min(1, x1), cy0 = Math.max(-1, y0), cy1 = Math.min(1, y1);
  const cov = cx1 > cx0 && cy1 > cy0 ? ((cx1 - cx0) * (cy1 - cy0)) / 4 : 0;
  const kx0 = Math.max(-0.6, x0), kx1 = Math.min(0.6, x1), ky0 = Math.max(-0.6, y0), ky1 = Math.min(0.6, y1);
  const central = kx1 > kx0 && ky1 > ky0 ? ((kx1 - kx0) * (ky1 - ky0)) / 1.44 : 0;
  return { cov, central };
}
const _rc = new THREE.Raycaster();
const asList = (b) => (!b ? null : Array.isArray(b) ? b : [b]);
function targetObject(getTarget, id) { try { const o = typeof getTarget === 'function' ? getTarget(id) : null; return o && o.isObject3D ? o : null; } catch (e) { return null; } }
/** true if solid scene geometry (opts.blockers) sits on the line pos->pt. Ignores `skip` subtree, invisible / see-through meshes, sprites, lines. */
function lineBlocked(pos, pt, blockers, skip) {
  if (!blockers || !blockers.length) return false;
  const dir = pt.clone().sub(pos), dist = dir.length(); if (dist < 1e-3) return false; dir.normalize(); _rc.set(pos, dir); _rc.near = 0.2; _rc.far = dist - 0.6;
  for (const h of _rc.intersectObjects(blockers, true)) {
    const o = h.object; if (!o.isMesh) continue;
    let vis = true, own = false; for (let q = o; q; q = q.parent) { if (q.visible === false) vis = false; if (skip && q === skip) own = true; }
    const m = Array.isArray(o.material) ? o.material[0] : o.material;
    if (!vis || own || /cable/i.test(o.name) || (m && (m.visible === false || (m.transparent && m.opacity < 0.6)))) continue;
    return true;
  }
  return false;
}
/**
 * Framing check for one camera pose -> {ok, ndc:[x,y], centred, signCover, signCentral, occluded, blocked, inside, signDist}.
 * ok = target inside the central 60% of the frame, no sign/wall (boxes) and no solid blocker mesh on the camera->target line,
 *      camera not inside/at a sign (>3 m), and signs cover < 12% of the frame, or sit at its edge (< 3% of the central 60%, < 20% total).
 */
export function checkFraming(camera, pos, look, target, signBoxes, wallBoxes = [], blockers = null, skip = null) {
  _fcam.fov = camera.fov || 28; _fcam.aspect = camera.aspect || 16 / 9; _fcam.near = 0.5; _fcam.far = 5000;
  _fcam.position.copy(pos); _fcam.lookAt(look); _fcam.updateMatrixWorld(true); _fcam.updateProjectionMatrix();
  const t = target.clone().project(_fcam), centred = Math.abs(t.x) <= 0.6 && Math.abs(t.y) <= 0.6 && t.z < 1;
  const dir = target.clone().sub(pos), dist = dir.length(); dir.normalize(); _ray.set(pos, dir);
  let cov = 0, central = 0, occluded = false, inside = false, signDist = Infinity;
  const test = (b, pad) => { _bx.copy(b).expandByScalar(pad); if (_bx.containsPoint(pos)) inside = true;
    if (_ray.intersectBox(_bx, _hit) && _hit.distanceTo(pos) < dist - 0.5) occluded = true; };
  for (const b of signBoxes) { test(b, 0.3); signDist = Math.min(signDist, b.distanceToPoint(pos)); const c = boxCoverage(b, _fcam); cov += c.cov; central += c.central; }
  for (const b of wallBoxes) test(b, 0.2);
  const blocked = blockers ? lineBlocked(pos, look, blockers, skip) && lineBlocked(pos, target, blockers, skip) : false;
  const ok = centred && !occluded && !blocked && !inside && signDist > 3 && (cov < 0.12 || (central < 0.03 && cov < 0.2));
  return { ok, ndc: [+t.x.toFixed(3), +t.y.toFixed(3)], centred, signCover: +cov.toFixed(4), signCentral: +central.toFixed(4), occluded, blocked, inside, signDist: +signDist.toFixed(2) };
}
/** outdoor stages framed wider (20-50 m); everything else 10-25 m from the working equipment */
const WIDE_STAGES = new Set(['gate', 'yard', 'depart']);
const YAWS = [0, 15, -15, 30, -30, 45, -45, 60, -60, 75, -75, 90, -90, 105, -105, 120, -120, 135, -135, 150, -150, 165, -165, 180].map((d) => d * DEG);
const HS = [1, 0.8, 1.25, 0.6, 1.5, 1.9], DS = [1, 0.85, 1.2, 0.7, 0.6, 1.45], AMPS = [1, 0.5, 0.2];
/** offset transform: scale (d, h*d, d), then rotate by yaw about +Y */
function xformOffset(off, fr, extraYaw, out) {
  return out.set(off[0] * fr.d, off[1] * fr.h * fr.d, off[2] * fr.d).applyAxisAngle(THREE.Object3D.DEFAULT_UP, fr.yaw + extraYaw);
}
/**
 * Pick the (yaw, height, distance, orbit-amplitude) variant of the authored shot that frames the target cleanly at every probe
 * (orbit extremes for explore, dolly ends for the tour). Pass 1 scores all variants against sign + wall boxes (cheap); pass 2
 * line-of-sight raycasts the best 30 against `blockers` meshes (racks, mezzanines...). Penalised: occlusion, camera in/near
 * (< 5 m) a sign, target off-centre, signs big and central, distance outside [minD,maxD], elevation < 16 deg (OrbitControls limit).
 */
function solveFraming(camera, target, lookOff, offsets, orbitAmp, signBoxes, wallBoxes, range = [10, 25], blockers = null, skip = null, vel = null, current = null) {
  const P = new THREE.Vector3(), L = new THREE.Vector3(), lo = V(lookOff);
  // moving target: also probe where it will be / was ~2.5 s away (ping-pong motion), so the framing survives its travel
  // moving equipment: also score where the target will be / was ~2.5 s away along its current velocity (shuttle motion)
  const tps = [target.clone()]; if (vel && vel.lengthSq() > 0.09) { const dv = vel.clone().setY(0).multiplyScalar(2.5); tps.push(target.clone().add(dv), target.clone().sub(dv)); }
  const tw = 1 + 0.5 * (tps.length - 1);
  const authored = offsets.map((o) => Math.hypot(...o)).reduce((a, b) => a + b, 0) / offsets.length;
  const probesFor = (am) => { const A = orbitAmp * am; return A ? [-A, 0, A] : [0]; };
    const score = (fr, cap = Infinity) => {
    let pen = 0; const bias = Math.abs(fr.yaw) * 0.02 + Math.abs(fr.h - 1) * 0.05 + Math.abs(fr.d - 1) * 0.05 + (1 - fr.amp) * 0.3;
    for (let ti = 0; ti < tps.length; ti++) for (const off of offsets) for (const py of probesFor(fr.amp)) {
      const tp = tps[ti], wt = ti ? 0.5 : 1;
      if (pen / tw + bias > cap) return Infinity; // pruned
      xformOffset(off, fr, py, P).add(tp); L.copy(lo).add(tp);
      const elev = Math.atan2(P.y - L.y, Math.hypot(P.x - L.x, P.z - L.z));
      if (elev < 16 * DEG) { pen += 3 * wt; continue; }
      const r = checkFraming(camera, P, L, tp, signBoxes, wallBoxes);
      pen += wt * ((r.occluded ? 10 : 0) + (r.inside ? 20 : 0) + (r.centred ? 0 : 5) + (r.signDist > 5 ? 0 : 3) + ((r.signCover < 0.1 || (r.signCentral < 0.02 && r.signCover < 0.17)) ? 0 : 2 + r.signCover * 10));
    }
    return pen / tw + bias; // bias: prefer the authored shot + full orbit
  };
  const blockPen = (fr) => { // line-of-sight vs scene meshes at orbit centre + extremes (look point and target both hidden = blocked)
    if (!blockers || !blockers.length) return 0; let pen = 0; const pr = probesFor(fr.amp), use = pr.length > 1 ? [pr[0], 0, pr[pr.length - 1]] : pr;
    for (const off of offsets) for (const py of use) { xformOffset(off, fr, py, P).add(target); L.copy(lo).add(target); if (lineBlocked(P, L, blockers, skip) && lineBlocked(P, target, blockers, skip)) pen += 8; }
    return pen;
  };
  const cands = [];
  for (const amp of orbitAmp > 0 ? AMPS : [0]) for (const d of DS) {
    const dist = authored * d; if (dist < range[0] * 0.9 || dist > range[1] * 1.1) continue;
    for (const h of HS) for (const yaw of YAWS) { const fr = { yaw, h, d, amp }; fr.pen = score(fr, cands.length >= 12 ? cands[11].pen : Infinity); if (fr.pen < Infinity) { cands.push(fr); cands.sort((a, b) => a.pen - b.pen); if (cands.length > 12) cands.length = 12; } }
  }
  if (!cands.length) return current || { yaw: 0, h: 1, d: 1, amp: 1, pen: 0 };
  cands.sort((a, b) => a.pen - b.pen);
  let best = null;
  for (const c of cands.slice(0, blockers && blockers.length ? 12 : 1)) {
    const pen = c.pen + blockPen(c); if (!best || pen < best.pen) best = { ...c, pen }; if (pen < 1) break;
  }
  if (current) { const cp = score(current) + blockPen(current); if (cp <= best.pen + 1) return { ...current, pen: cp }; } // hysteresis: keep a framing that is still about as good
  return best;
}
/* ------------------------------------------------------------------ Explore stops (process order) */
export const DEFAULT_STOPS = [
  { id: 'gate', title: 'Gate', sign: 'GATE',
    what: 'Inbound trucks check in at the gatehouse. Cameras read the trailer ID, plate and seal and match them to the delivery appointment, then the trailer gets a yard slot; a gate clerk handles exceptions such as a missing appointment or a seal mismatch.',
    watch: 'Inbound road tractor checking in at the gate lane',
    shot: { offset: [-20, 15, 28], lookOffset: [0, 1.5, 0] } },
  { id: 'yard', title: 'Yard', sign: 'YARD',
    what: 'Loaded inbound trailers wait in the YA slots. When a receiving door frees up, a yard driver (spotter) hooks the trailer with the yard tractor, moves it to the assigned door, backs it in and unhooks.',
    watch: 'Yard tractor and its driver moving a trailer to a door',
    shot: { offset: [22, 17, 24], lookOffset: [0, 1.5, 0] } },
  { id: 'receiving', title: 'Receiving', sign: 'RECEIVING',
    what: 'The dock restraint locks the trailer before the door opens and the leveler drops. A receiver pulls the pallets to the stage lane with an electric pallet jack and scans each pallet against the supplier\u2019s advance ship notice, checking quantity and damage.',
    watch: 'Receiver unloading with an electric pallet jack',
    shot: { offset: [-12.5, 6.2, -3.4], lookOffset: [0, 1, 0], orbit: 0.5 } },
  { id: 'reserve', title: 'Reserve storage', sign: 'RESERVE STORAGE',
    what: 'The warehouse system picks a rack slot by sales velocity and zone. A power equipment operator on a reach truck carries the pallet into the narrow aisle (one truck per aisle), lifts it into the slot and scans the location to confirm the putaway.',
    watch: 'Reach truck putting a pallet away',
    shot: { offset: [0, 8.3, 14.5], lookOffset: [0, 1.5, 0], orbit: 0.15 } },
  { id: 'crossdock', title: 'Cross-dock', sign: 'CROSS-DOCK',
    what: 'Pallets already allocated to stores skip storage. A driver takes them straight across the one-way, northbound cross-dock lane from the receiving docks to the outbound lanes on the opposite side.',
    watch: 'Forklift carrying a cross-dock pallet',
    shot: { offset: [0, 6.6, -10.6], lookOffset: [0, 1, 0], orbit: 0.3 } },
  { id: 'replen', title: 'Replenishment', sign: 'RESERVE STORAGE',
    what: 'When a pick face falls to its minimum, the system raises a replenishment task. A reach truck operator lets a full pallet down from reserve and loads the flow lane from the replen aisle behind the pick face; upper tiers are refilled with an order picker.',
    watch: 'Reach truck on a replenishment run',
    shot: { offset: [10, 10, 14], lookOffset: [0, 1.8, 0] } },
  { id: 'pick', title: 'Pick module', sign: 'PICK MODULE',
    what: 'Order fillers working by voice or RF scanner pick full cases from the flow-rack faces on three tiers. Each case gets a store label, is scanned, and goes onto the takeaway conveyor.',
    watch: 'Order filler picking cases at a pick face',
    shot: { offset: [0, 4.4, -10.5], lookOffset: [0, 1.3, 0], orbit: 0.1 } },
  { id: 'sorter', title: 'Sorter', sign: 'SORTER',
    what: 'Conveyors merge cases from the pick module and the receiving conveyor. Each case is inducted, spaced and scanned, then the sliding-shoe sorter diverts it to its store\u2019s lane: one door per store. Unreadable cases go round again or to rework.',
    watch: 'Cases on sorter SRT1 diverting to store lanes',
    shot: { offset: [0, 7.9, -9.5], lookOffset: [0, 0.5, 0], orbit: 0.5 } },
  { id: 'wrap', title: 'Pallet build & wrap', sign: 'PALLET BUILD',
    what: 'Non-conveyable and full-pallet freight is built into store pallets here. The operator starts the turntable stretch-wrapper; film spirals up and back down the load, then is cut and wiped flat so the pallet travels safely.',
    watch: 'Stretch-wrapper and its operator',
    shot: { offset: [22.5, 9.2, 0], lookOffset: [0, 1, 0], orbit: 0.4 } },
  { id: 'shipping', title: 'Shipping', sign: 'SHIPPING',
    what: 'Each outbound door serves one store. Loaders stack cases from the lane wall by wall into the trailer and load mixed pallets, last stop first. The trailer stays at the door until it is full by space (cubed out) or by weight.',
    watch: 'Loader filling a store trailer',
    shot: { offset: [-10.5, 6.3, -2.8], lookOffset: [0, 1.2, 0], orbit: 0.5 } },
  { id: 'depart', title: 'Departure', sign: 'GATE',
    what: 'The full trailer is sealed, the restraint is released and the yard driver pulls it to a staged slot. A road driver hooks up and leaves through the gate, where the seal is checked on the way out.',
    watch: 'Loaded store trailer heading out through the gate',
    shot: { offset: [24, 18, 20], lookOffset: [0, 1.5, 0] } },
];

/* ------------------------------------------------------------------ Auto tour shots (stage ids per original brief) */
// Each shot dollies its camera offset from `from` to `to` (relative to the live, smoothed target) over `dur` s;
// shot changes blend from the current camera pose (easeInOutCubic) — no cuts, including the loop back to home.
export const SHOTS = [
  { stage: 'home', title: 'RDC-7041 at a glance', text: 'A regional Walmart DC: trucks arrive at the south docks, freight flows north through storage, picking and sortation, and leaves from the north docks.', dur: 10, from: [120, 128, 182], to: [96, 104, 156], look: [0, 0, 0] },
  { stage: 'gate', title: 'Gate check-in', text: 'Trailer ID, plate and seal are matched to the appointment; the trailer gets a yard slot.', dur: 10, from: [-26, 17, 32], to: [-18, 13, 25], look: [0, 1.5, 0] },
  { stage: 'yard', title: 'Yard move', text: 'A yard driver hooks the trailer and backs it onto its receiving door.', dur: 10, from: [26, 18, 26], to: [18, 14, 22], look: [0, 1.5, 0] },
  { stage: 'unload', title: 'Unload & receive', text: 'Restraint on, door up, leveler down: pallets come off on an electric pallet jack and are scanned against the ASN.', dur: 11, from: [12, 13, 18], to: [7, 10, 14], look: [0, 1, 0] },
  { stage: 'putaway', title: 'Putaway', text: 'A reach truck operator lifts the pallet into its reserve slot and scans the location.', dur: 11, from: [8, 14, 20], to: [4, 11, 15], look: [0, 1.5, 0] },
  { stage: 'replen', title: 'Replenishment', text: 'A pick face hit its minimum: a full pallet comes down from reserve into the flow lane behind it.', dur: 10, from: [13, 12, 17], to: [9, 9, 13], look: [0, 1.8, 0] },
  { stage: 'pick', title: 'Case picking', text: 'Order fillers pick by voice, label each case and send it down the takeaway conveyor.', dur: 11, from: [13, 11, 16], to: [9, 8, 12], look: [0, 1.5, 0] },
  { stage: 'sort', title: 'Sortation', text: 'Cases are scanned and the sliding-shoe sorter pushes each one into its store\u2019s lane.', dur: 11, from: [13, 10, 18], to: [9, 7, 13], look: [0, 0.5, 0] },
  { stage: 'wrap', title: 'Pallet build & wrap', text: 'The operator starts the stretch-wrapper; film spirals up and down the load, then is cut and wiped.', dur: 12, from: [11, 7, 11], to: [8, 5.5, 8], look: [0, 1, 0] },
  { stage: 'load', title: 'Trailer loading', text: 'Loaders build the store trailer wall by wall, last stop first, until it cubes or weighs out.', dur: 11, from: [13, 11, 13], to: [9, 8, 10], look: [0, 1.2, 0] },
  { stage: 'depart', title: 'Departure', text: 'Sealed and released, the loaded trailer heads for the gate and its store.', dur: 11, from: [28, 20, 24], to: [22, 16, 20], look: [0, 1.5, 0] },
  { stage: 'home', title: 'Around the clock', text: 'Every move here is made by people driving trucks, jacks and wrappers, shift after shift.', dur: 10, from: [-70, 120, 175], to: [100, 122, 170], look: [0, 0, 0] },
];

/* ------------------------------------------------------------------ shared camera rig */
class Rig {
  constructor() { this.pos = new THREE.Vector3(); this.look = new THREE.Vector3(); this.fov = 50;
    this.oPos = new THREE.Vector3(); this.oLook = new THREE.Vector3(); this.vPos = new THREE.Vector3(); this.vLook = new THREE.Vector3(); }
  /** reset the output spring to the current camera (zero velocity) */
  resetOut() { this.oPos.copy(this.pos); this.oLook.copy(this.look); this.vPos.set(0, 0, 0); this.vLook.set(0, 0, 0); }
  capture(camera, controls) {
    this.pos.copy(camera.position);
    if (controls && controls.target) this.look.copy(controls.target);
    else { camera.getWorldDirection(this.look); this.look.multiplyScalar(20).add(camera.position); }
    this.fov = camera.fov;
  }
  /** critically damped output stage (omega ~10/s): removes velocity kinks when a move is retargeted mid-flight */
  apply(camera, controls, dt) {
    smoothDamp(this.oPos, this.vPos, this.pos, 10, dt); smoothDamp(this.oLook, this.vLook, this.look, 10, dt);
    camera.position.copy(this.oPos); camera.lookAt(this.oLook);
    if (controls && controls.target) controls.target.copy(this.oLook);
    if (camera.isPerspectiveCamera && Math.abs(camera.fov - this.fov) > 1e-4) { camera.fov = this.fov; camera.updateProjectionMatrix(); }
  }
}
function blendPose(rig, from, P, L, F, e) {
  const d = from.pos.distanceTo(P), hop = Math.min(12, d * 0.12) * Math.sin(Math.PI * e);
  rig.pos.lerpVectors(from.pos, P, e); rig.pos.y += hop;
  rig.look.lerpVectors(from.look, L, e); rig.fov = from.fov + (F - from.fov) * e;
}

/* ================================================================== Auto tour */
class TourDirector {
  constructor() { this.active = false; this._capCbs = new Set(); this.rig = new Rig(); this.from = new Rig(); this._raw = new THREE.Vector3(); this._tS = new THREE.Vector3(); this._tV = new THREE.Vector3(); }
  start(camera, controls, getTarget, opts = {}) {
    if (this.active) this.stop();
    if (explore.active) explore.stop();
    Object.assign(this, { camera, controls, getTarget, opts, shots: opts.shots || SHOTS, active: true, _hl: new Map() });
    this._ctrlEnabled = controls ? controls.enabled : undefined; if (controls) controls.enabled = false;
    this._fov0 = camera.fov; this.rig.capture(camera, controls); this.rig.resetOut();
    this._begin(Math.max(0, Math.min(this.shots.length - 1, opts.startShot ?? 0)));
    return this;
  }
  _begin(i) {
    const s = this.shots[i]; this.i = i; this.t = 0;
    this.from.pos.copy(this.rig.pos); this.from.look.copy(this.rig.look); this.from.fov = this.rig.fov;
    this.blendD = Math.min(3.4, s.dur * 0.36);
    resolveTarget(this.getTarget, s.stage, this._raw); this._tS.copy(this._raw); this._tV.set(0, 0, 0);
    if (this.opts.autoFrame === false || s.stage === 'home') this._fr = { yaw: 0, h: 1, d: 1 };
    else this._fr = solveFraming(this.camera, this._raw, s.look, [s.from, s.to], 0, collectSignBoxes(this.opts.signs, this.opts.occluders), this.opts.walls === false ? [] : (this.opts.walls || DEFAULT_WALLS), s.range || (WIDE_STAGES.has(s.stage) ? [20, 50] : [10, 25]), asList(this.opts.blockers), targetObject(this.getTarget, s.stage));
    const cap = { stage: s.stage, title: s.title, text: s.text, shotIndex: i };
    for (const cb of this._capCbs) { try { cb(cap); } catch (e) { console.error(e); } }
    try { this.opts.ui?.setCaption?.(`${s.title} \u2014 ${s.text}`); } catch (e) { /* ignore */ }
  }
  update(dt) {
    if (!this.active) return;
    dt = Math.min(Math.max(dt || 0, 0), 0.1);
    let s = this.shots[this.i];
    this.t += dt; if (this.t >= s.dur) { this._begin((this.i + 1) % this.shots.length); s = this.shots[this.i]; }
    resolveTarget(this.getTarget, s.stage, this._raw); smoothDamp(this._tS, this._tV, this._raw, 2.2, dt);
    const k = easeInOutSine(this.t / s.dur), off = new THREE.Vector3().lerpVectors(xformOffset(s.from, this._fr, 0, new THREE.Vector3()), xformOffset(s.to, this._fr, 0, new THREE.Vector3()), k);
    const P = off.add(this._tS), L = V(s.look).add(this._tS), F = s.fov ?? this._fov0;
    if (this.t < this.blendD) blendPose(this.rig, this.from, P, L, F, easeInOutCubic(this.t / this.blendD));
    else { this.rig.pos.copy(P); this.rig.look.copy(L); this.rig.fov = F; }
    this.rig.apply(this.camera, this.controls, dt);
    // optional sign highlight
    if (this.opts.signs) { const want = SIGN_FOR[s.stage];
      for (const n of new Set([...this._hl.keys(), want].filter(Boolean))) { const c = this._hl.get(n) || 0, tgt = n === want ? 1 : 0, nk = c + Math.sign(tgt - c) * Math.min(Math.abs(tgt - c), dt / 0.6);
        if (nk !== c) { this._hl.set(n, nk); callHighlight(this.opts.signs, n, nk); } } }
  }
  stop() {
    if (!this.active) return; this.active = false;
    if (this.controls) { if (this.controls.target) this.controls.target.copy(this.rig.oLook); if (this._ctrlEnabled !== undefined) this.controls.enabled = this._ctrlEnabled; }
    for (const n of this._hl.keys()) callHighlight(this.opts.signs, n, 0); this._hl.clear();
    try { this.opts.ui?.setCaption?.(''); } catch (e) { /* ignore */ }
  }
  onCaption(cb) { this._capCbs.add(cb); return () => this._capCbs.delete(cb); }
  isActive() { return this.active; }
  getShotIndex() { return this.active ? this.i : -1; }
}

/* ================================================================== Explore mode */
const NAVY = '#041E42', SPARK = '#FFC220', BLUE = '#0071CE';
const FONT = '"Bogle","Inter","Helvetica Neue",Arial,sans-serif';
class ExploreMode {
  constructor() { this.active = false; this._stopCbs = new Set(); this._chgCbs = new Set(); this.rig = new Rig(); this.from = new Rig();
    this._raw = new THREE.Vector3(); this._tS = new THREE.Vector3(); this._tV = new THREE.Vector3(); }

  start(camera, controls, opts = {}) {
    if (this.active) this.stop();
    if (tour.active) tour.stop();
    this.camera = camera; this.controls = controls; this.opts = opts;
    this.stops = (opts.stops || DEFAULT_STOPS).map((s) => ({ ...s, shot: { offset: [10, 10, 16], lookOffset: [0, 1, 0], ...(s.shot || {}) } }));
    this.D = opts.duration ?? 1.2; this.orbitDeg = opts.orbitDegPerSec ?? 3; this.orbitAmp = (opts.orbitAmplitudeDeg ?? 18) * DEG;
    this.active = true; this.engaged = false; this.released = null; this.index = -1; this.trans = null;
    this._ctrlEnabled = controls ? controls.enabled : true; this._fov0 = camera.fov; this._hl = new Map(); this._factT = 0; this._time = 0;
    this.rig.capture(camera, controls);
    const dom = opts.domElement || controls?.domElement || null;
    this.container = opts.container || dom?.parentElement || document.body;
    this._buildDom(); this._listen();
    let i = 0; if (opts.startAt !== undefined) { i = typeof opts.startAt === 'number' ? opts.startAt : this.stops.findIndex((s) => s.id === opts.startAt); if (i < 0) i = 0; }
    this._engage(i);
    return this;
  }

  /* ---------- navigation */
  next() { this.step(1); }
  prev() { this.step(-1); }
  step(dir) {
    if (!this.active) return;
    if (this._pendRel) { if ((this._pendRel === 'start') !== (dir < 0)) this._pendRel = null; return; } // release queued behind a moving camera: opposite input cancels it
    if (!this.engaged) { // re-enter from the released end
      if (this.released === 'end' && dir < 0) this._engage(this.stops.length - 1);
      else if (this.released === 'start' && dir > 0) this._engage(0);
      return;
    }
    const j = this.index + dir;
    if (j < 0 || j >= this.stops.length) { const end = j < 0 ? 'start' : 'end'; if (this.trans) { this._pendRel = end; this._pendT = 0; } else this._release(end); } else this._go(j);
  }
  goTo(id) {
    if (!this.active) return;
    const i = typeof id === 'number' ? id : this.stops.findIndex((s) => s.id === id); if (i < 0 || i >= this.stops.length) return;
    if (!this.engaged) this._engage(i); else this._go(i);
  }
  _engage(i) {
    this.engaged = true; this.released = null;
    if (this.controls) this.controls.enabled = false;
    this.rig.capture(this.camera, this.controls); this.rig.resetOut(); // continue from wherever free orbit left the camera
    this.index = -1; this._go(i);
  }
  _release(end) {
    this._pendRel = null; this.engaged = false; this.released = end; this.trans = null;
    if (this.controls) { if (this.controls.target) this.controls.target.copy(this.rig.oLook); this.controls.enabled = true; }
    this._setPanelVisible(false); this._renderRail();
    try { this.opts.ui?.setCaption?.(''); } catch (e) { /* ignore */ }
    this._emit({ id: null, index: -1, stop: null, released: end });
  }
  _go(i) {
    this._pendRel = null;
    if (i === this.index && this.engaged) return;
    const s = this.stops[i];
    this.from.pos.copy(this.rig.pos); this.from.look.copy(this.rig.look); this.from.fov = this.rig.fov;
    this.index = i; this._orbitT = 0;
    resolveTarget(this.opts.getTarget, s.id, this._raw); this._tS.copy(this._raw); this._tV.set(0, 0, 0);
    this._fr = this._solve(s); this._frS = { ...this._fr }; this._reT = 0; this._bad = 0; this._parkT = 0;
    this.trans = { t: 0, D: this.D * Math.min(2, Math.max(1, this.from.pos.distanceTo(xformOffset(s.shot.offset, this._fr, 0, new THREE.Vector3()).add(this._raw)) / 60)) };
    this._fillPanel(s); this._setPanelVisible(true); this._renderRail(); this._factT = 0; this._refreshFacts();
    try { this.opts.ui?.setCaption?.(`${s.title} \u2014 ${s.watch}`); } catch (e) { /* ignore */ }
    this._emit({ id: s.id, index: i, stop: s });
  }
  _solve(s, current = null) {
    if (this.opts.autoFrame === false) return { yaw: 0, h: 1, d: 1, amp: 1, report: null };
    const signs = collectSignBoxes(this.opts.signs, this.opts.occluders), walls = this.opts.walls === false ? [] : (this.opts.walls || DEFAULT_WALLS);
    return solveFraming(this.camera, this._raw, s.shot.lookOffset || [0, 1, 0], [s.shot.offset], this.orbitAmp * (s.shot.orbit ?? 1), signs, walls, s.range || (WIDE_STAGES.has(s.id) ? [20, 50] : [10, 25]), asList(this.opts.blockers), targetObject(this.opts.getTarget, s.id), this._tV, current);
  }
  /** framing check of the CURRENT camera pose vs the current stop target (for QA) */
  checkFraming() {
    if (!this.active || !this.engaged) return null; const s = this.stops[this.index];
    const signs = collectSignBoxes(this.opts.signs, this.opts.occluders), walls = this.opts.walls === false ? [] : (this.opts.walls || DEFAULT_WALLS);
    return { id: s.id, solved: this._fr && { yaw: +(this._fr.yaw / DEG).toFixed(0), h: this._fr.h, d: this._fr.d, orbit: this._fr.amp }, ...checkFraming(this.camera, this.camera.position, this.rig.oLook, this._tS, signs, walls, asList(this.opts.blockers), targetObject(this.opts.getTarget, s.id)) };
  }
  _emit(ev) { for (const cb of this._chgCbs) { try { cb(ev); } catch (e) { console.error(e); } } }

  /* ---------- per frame */
  update(dt) {
    if (!this.active) return;
    dt = Math.min(Math.max(dt || 0, 0), 0.1); this._time += dt;
    // sign highlight easing (current in, others out)
    const want = this.engaged ? this.stops[this.index]?.sign : null;
    for (const n of new Set([...this._hl.keys(), want].filter(Boolean))) {
      const c = this._hl.get(n) || 0, tgt = n === want ? 1 : 0, nk = c + Math.sign(tgt - c) * Math.min(Math.abs(tgt - c), dt / 0.6);
      if (nk !== c) { this._hl.set(n, nk); callHighlight(this.opts.signs, n, nk); }
    }
    if (!this.engaged) { // free orbit: only ease the FOV back to what the app had
      if (this.camera.isPerspectiveCamera && Math.abs(this.camera.fov - this._fov0) > 1e-3) { this.camera.fov += (this._fov0 - this.camera.fov) * Math.min(1, dt * 3); this.camera.updateProjectionMatrix(); }
      this.rig.capture(this.camera, this.controls); this.rig.resetOut(); return;
    }
    this._factT += dt; if (this._factT >= 0.5) { this._factT = 0; this._refreshFacts(); }
    const s = this.stops[this.index];
    resolveTarget(this.opts.getTarget, s.id, this._raw); smoothDamp(this._tS, this._tV, this._raw, 2.2, dt);
    this._orbitT += dt;
    // moving targets: re-check the live framing every 0.5 s while parked; if a sign/wall gets in the way, re-solve and glide (never jump) to the new framing
    if (!this.trans && this.opts.autoFrame !== false && (this._reT += dt) >= 0.5) {
      this._reT = 0; this._parkT = (this._parkT || 0) + 0.5;
      if (this._parkT === 1 && this._tV.lengthSq() > 0.09) { const prev = this._raw.clone(); this._raw.copy(this._tS); this._fr = this._solve(s, this._fr); this._raw.copy(prev); } // moving target: account for its travel
      const f = this.checkFraming(); this._bad = f && !f.ok ? (this._bad || 0) + 1 : 0;
      if (this._bad >= 6) { this._bad = -12; const prev = this._raw.clone(); this._raw.copy(this._tS); this._fr = this._solve(s, this._fr); this._raw.copy(prev); } // 3 s bad -> re-solve (then 6 s grace)
    }
    const fs = this._frS || (this._frS = { ...this._fr }), fk = 1 - Math.exp(-dt * 1.2), dy = Math.atan2(Math.sin(this._fr.yaw - fs.yaw), Math.cos(this._fr.yaw - fs.yaw));
    fs.yaw += Math.sign(dy) * Math.min(Math.abs(dy) * fk, 30 * DEG * dt); fs.h += (this._fr.h - fs.h) * fk; fs.d += (this._fr.d - fs.d) * fk; fs.amp += (this._fr.amp - fs.amp) * fk;
    const amp = this.orbitAmp * (s.shot.orbit ?? 1) * fs.amp, w = this.orbitAmp > 0 ? (this.orbitDeg * DEG) / this.orbitAmp : 0, ang = amp * Math.sin(this._orbitT * w);
    const P = xformOffset(s.shot.offset, fs, ang, new THREE.Vector3()).add(this._tS), L = V(s.shot.lookOffset || [0, 1, 0]).add(this._tS), F = s.shot.fov ?? this._fov0;
    if (this.trans) {
      this.trans.t += dt; const k = clamp01(this.trans.t / this.trans.D);
      blendPose(this.rig, this.from, P, L, F, easeInOutCubic(k)); if (k >= 1) this.trans = null;
    } else { this.rig.pos.copy(P); this.rig.look.copy(L); this.rig.fov = F; }
    this.rig.apply(this.camera, this.controls, dt);
    if (this._pendRel && !this.trans && (this._pendT += dt) > 0.35) this._release(this._pendRel); // hand over to OrbitControls only once the camera has come to rest
  }

  stop() {
    if (!this.active) return; this.active = false;
    this._unlisten();
    if (this.controls) { if (this.controls.target) this.controls.target.copy(this.rig.oLook); this.controls.enabled = this._ctrlEnabled; }
    for (const n of this._hl.keys()) callHighlight(this.opts.signs, n, 0); this._hl.clear();
    try { this.opts.ui?.setCaption?.(''); } catch (e) { /* ignore */ }
    this._root?.remove(); this._root = null;
    if (this._posPatched) { this.container.style.position = this._posPatched.prev; this._posPatched = null; }
    for (const cb of this._stopCbs) { try { cb(); } catch (e) { console.error(e); } }
  }
  onStop(cb) { this._stopCbs.add(cb); return () => this._stopCbs.delete(cb); }
  onChange(cb) { this._chgCbs.add(cb); return () => this._chgCbs.delete(cb); }
  isActive() { return this.active; }
  isEngaged() { return this.active && this.engaged; }
  getState() { return { active: this.active, engaged: this.engaged, released: this.released, index: this.index, id: this.engaged ? this.stops[this.index]?.id : null, transitioning: !!this.trans, pendingRelease: this._pendRel || null, camera: this.rig.oPos.toArray(), look: this.rig.oLook.toArray() }; }

  /* ---------- input */
  _listen() {
    const C = this.container; this._lastWheel = -1e9; this._gestureUsed = false;
    this._onWheel = (e) => {
      const now = performance.now(); if (now - this._lastWheel > 260) this._gestureUsed = false; this._lastWheel = now;
      const dir = Math.sign(e.deltaY || 0); if (!dir) return;
      if (this.engaged) { e.preventDefault(); e.stopPropagation(); if (!this._gestureUsed) { this._gestureUsed = true; this.step(dir); } return; }
      // released: normal zoom, unless a fresh gesture points back into range
      if (this._gestureUsed) return;
      if ((this.released === 'end' && dir < 0) || (this.released === 'start' && dir > 0)) { e.preventDefault(); e.stopPropagation(); this._gestureUsed = true; this.step(dir); }
    };
    this._onKey = (e) => {
      const tg = e.target; if (tg && (tg.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName))) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      let dir = 0; if (['ArrowDown', 'ArrowRight', 'PageDown', ' ', 'Spacebar'].includes(e.key)) dir = 1; else if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) dir = -1;
      if (!dir) return;
      if (!this.engaged && !((this.released === 'end' && dir < 0) || (this.released === 'start' && dir > 0))) return; // free orbit: let keys through
      e.preventDefault(); if (!e.repeat) this.step(dir);
    };
    this._onTouchStart = (e) => { if (e.touches.length !== 1) { this._touch = null; return; } const t = e.touches[0]; this._touch = { x: t.clientX, y: t.clientY }; };
    this._onTouchMove = (e) => { if (this.engaged && this._touch) e.preventDefault(); };
    this._onTouchEnd = (e) => {
      if (!this._touch) return; const t = e.changedTouches[0], dx = t.clientX - this._touch.x, dy = t.clientY - this._touch.y; this._touch = null;
      if (Math.abs(dy) < 50 || Math.abs(dy) < Math.abs(dx) * 1.2) return;
      const dir = dy < 0 ? 1 : -1; // swipe up = next (like scrolling down)
      if (this.engaged || (this.released === 'end' && dir < 0) || (this.released === 'start' && dir > 0)) this.step(dir);
    };
    C.addEventListener('wheel', this._onWheel, { capture: true, passive: false });
    window.addEventListener('keydown', this._onKey, { capture: true });
    C.addEventListener('touchstart', this._onTouchStart, { capture: true, passive: true });
    C.addEventListener('touchmove', this._onTouchMove, { capture: true, passive: false });
    C.addEventListener('touchend', this._onTouchEnd, { capture: true, passive: true });
  }
  _unlisten() {
    const C = this.container; if (!C) return;
    C.removeEventListener('wheel', this._onWheel, { capture: true });
    window.removeEventListener('keydown', this._onKey, { capture: true });
    C.removeEventListener('touchstart', this._onTouchStart, { capture: true });
    C.removeEventListener('touchmove', this._onTouchMove, { capture: true });
    C.removeEventListener('touchend', this._onTouchEnd, { capture: true });
  }

  /* ---------- DOM: panel + rail */
  _el(tag, css, parent, text) { const e = document.createElement(tag); if (css) e.style.cssText = css; if (text !== undefined) e.textContent = text; if (parent) parent.appendChild(e); return e; }
  _buildDom() {
    const C = this.container, fixed = C === document.body || C === document.documentElement;
    if (!fixed && getComputedStyle(C).position === 'static') { this._posPatched = { prev: C.style.position }; C.style.position = 'relative'; }
    const pos = fixed ? 'fixed' : 'absolute';
    const root = this._root = this._el('div', `position:${pos};inset:0;pointer-events:none;z-index:${this.opts.zIndex ?? 30};font-family:${FONT};`, C);
    root.className = 'gf-explore';
    const top = (this.opts.panelPosition || 'bottom-left') === 'top-left', inset = this.opts.panelInset ?? 18;
    const p = this._panel = this._el('div', `position:absolute;left:${inset}px;${top ? 'top' : 'bottom'}:${inset}px;width:min(360px,calc(100% - ${inset * 2 + 56}px));box-sizing:border-box;` +
      `background:rgba(4,30,66,0.93);color:#fff;border-radius:16px;padding:14px 16px 13px;box-shadow:0 8px 28px rgba(4,30,66,0.35);border:1px solid rgba(255,255,255,0.10);` +
      `pointer-events:auto;transition:opacity .35s ease, transform .35s ease;opacity:0;transform:translateY(${top ? -8 : 8}px);`, root);
    const head = this._el('div', 'display:flex;align-items:center;gap:10px;margin-bottom:6px;', p);
    this._spark = this._el('div', `flex:none;width:26px;height:26px;`, head); this._spark.innerHTML = sparkSVG(SPARK);
    const hcol = this._el('div', 'flex:1;min-width:0;', head);
    this._step = this._el('div', `font-size:11px;font-weight:700;letter-spacing:.08em;color:${SPARK};text-transform:uppercase;`, hcol);
    this._title = this._el('div', 'font-size:20px;font-weight:800;line-height:1.15;', hcol);
    this._el('div', 'font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.62);margin:8px 0 3px;', p, 'What happens here');
    this._what = this._el('div', 'font-size:13.5px;line-height:1.42;color:rgba(255,255,255,.94);', p);
    this._facts = this._el('div', 'display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin:11px 0 10px;', p);
    const wr = this._el('div', `display:flex;gap:8px;align-items:baseline;border-top:1px solid rgba(255,255,255,.14);padding-top:9px;font-size:13px;`, p);
    this._el('span', `flex:none;font-weight:800;color:${SPARK};`, wr, 'Watch:'); this._watch = this._el('span', 'color:#fff;', wr);
    this._el('div', 'margin-top:8px;font-size:11px;color:rgba(255,255,255,.55);', p, 'Scroll, swipe or \u2191 \u2193 to move between departments');
    // rail
    const rail = this._rail = this._el('div', 'position:absolute;right:14px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:9px;pointer-events:auto;padding:8px 6px;border-radius:14px;background:rgba(4,30,66,0.38);', root);
    this._dots = this.stops.map((s, i) => {
      const d = this._el('button', 'all:unset;position:relative;display:block;width:12px;height:12px;border-radius:50%;cursor:pointer;box-sizing:border-box;transition:all .25s ease;', rail);
      d.setAttribute('aria-label', s.title); d.title = '';
      const lab = this._el('span', `position:absolute;right:22px;top:50%;transform:translateY(-50%);white-space:nowrap;background:${NAVY};color:#fff;font:700 12px ${FONT};padding:4px 8px;border-radius:8px;opacity:0;pointer-events:none;transition:opacity .15s;box-shadow:0 2px 8px rgba(0,0,0,.25);`, d, s.title);
      d.addEventListener('mouseenter', () => { lab.style.opacity = '1'; }); d.addEventListener('mouseleave', () => { lab.style.opacity = '0'; });
      d.addEventListener('focus', () => { lab.style.opacity = '1'; }); d.addEventListener('blur', () => { lab.style.opacity = '0'; });
      d.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); this.goTo(s.id); });
      return d;
    });
    this._renderRail();
  }
  _renderRail() {
    if (!this._dots) return;
    this._dots.forEach((d, i) => { const cur = this.engaged && i === this.index;
      d.style.background = cur ? SPARK : 'rgba(255,255,255,0.85)'; d.style.border = cur ? `2px solid ${NAVY}` : `2px solid ${BLUE}`;
      d.style.transform = cur ? 'scale(1.45)' : 'scale(1)'; d.style.boxShadow = cur ? '0 0 0 3px rgba(255,194,32,.35)' : 'none'; d.setAttribute('aria-current', cur ? 'step' : 'false'); });
  }
  _setPanelVisible(v) { if (!this._panel) return; this._panel.style.opacity = v ? '1' : '0'; this._panel.style.transform = v ? 'translateY(0)' : `translateY(${(this.opts.panelPosition === 'top-left') ? -8 : 8}px)`; this._panel.style.pointerEvents = v ? 'auto' : 'none'; }
  _fillPanel(s) {
    this._step.textContent = `Stop ${this.index + 1} of ${this.stops.length}`; this._title.textContent = s.title; this._what.textContent = s.what;
    let w = s.watch; try { const o = this.opts.getWatch?.(s.id); if (o) w = o; } catch (e) { /* ignore */ }
    this._watch.textContent = w;
  }
  _refreshFacts() {
    if (!this._facts || !this.engaged) return;
    const s = this.stops[this.index]; let facts = [];
    try { facts = (this.opts.getFacts && this.opts.getFacts(s.id)) || []; } catch (e) { facts = []; }
    if (!Array.isArray(facts)) facts = [];
    facts = facts.slice(0, 3);
    const key = JSON.stringify(facts); if (key === this._factKey) return; this._factKey = key;
    this._facts.replaceChildren(); this._facts.style.display = facts.length ? 'grid' : 'none';
    this._facts.style.gridTemplateColumns = `repeat(${Math.max(1, facts.length)},minmax(0,1fr))`;
    for (const f of facts) {
      const c = this._el('div', 'background:rgba(255,255,255,0.08);border-radius:10px;padding:6px 8px;min-width:0;', this._facts);
      this._el('div', 'font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:rgba(255,255,255,.62);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;', c, String(f.label ?? ''));
      this._el('div', `font-size:16px;font-weight:800;color:${SPARK};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`, c, String(f.value ?? '\u2014'));
    }
  }
}
function sparkSVG(col) {
  let s = '<svg viewBox="-10 -10 20 20" width="26" height="26" aria-hidden="true">';
  for (let i = 0; i < 6; i++) s += `<ellipse cx="0" cy="-5.6" rx="1.55" ry="3.4" fill="${col}" transform="rotate(${i * 60})"/>`;
  return s + '</svg>';
}

/* ------------------------------------------------------------------ singletons + module API */
const tour = new TourDirector();
export const explore = new ExploreMode();
/** Auto tour: start(camera, controls, getTarget(stage) -> Vector3|Object3D, opts?{ui, signs, shots, startShot}) */
export function start(camera, controls, getTarget, opts) { return tour.start(camera, controls, getTarget, opts); }
export function stop() { tour.stop(); }
export function update(dt) { tour.update(dt); }
export function onCaption(cb) { return tour.onCaption(cb); }
export function isActive() { return tour.active; }
export function getShotIndex() { return tour.getShotIndex(); }
export { TourDirector, ExploreMode };
