/**
 * GateFlow toy-style model library — Walmart DC (Three.js r160, plain ES module, no build step).
 *
 * IMPORT APPROACH
 *   THREE is imported from the full unpkg URL below. RoundedBoxGeometry.js (three/examples/jsm) itself does
 *   `import ... from 'three'`, so the host page MUST have an import map mapping "three" to the SAME URL:
 *     <script type="importmap">{"imports":{
 *        "three":"https://unpkg.com/three@0.160.0/build/three.module.js",
 *        "three/addons/":"https://unpkg.com/three@0.160.0/examples/jsm/"}}</script>
 *   Because ES modules are keyed by resolved URL, `import 'three'` (host) and the URL import here resolve to one
 *   module record -> a single THREE instance (no duplicate-instance warnings). If the host uses a different three
 *   URL/version, change the two import lines below to match it.
 *
 * CONVENTIONS
 *   Units are metres. Every factory returns a THREE.Group whose origin is at GROUND level, centred on the model's
 *   footprint. Models face +Z (vehicle front / rack aisle face / dock exterior / conveyor flow direction).
 *   Shadows: every mesh castShadow+receiveShadow (decal planes and wrap film: receive only).
 *   group.userData.parts  -> named meshes/groups (each also has .name)
 *   group.userData.update -> (dt, t) => void   idle animation; call every frame (dt,t in seconds)
 *   Geometries and static materials are cached/shared across instances; animated (emissive) materials are cloned
 *   per instance so lights can pulse independently.
 */
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { RoundedBoxGeometry } from 'https://unpkg.com/three@0.160.0/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'https://unpkg.com/three@0.160.0/examples/jsm/utils/BufferGeometryUtils.js';

export const PALETTE = {
  blue: 0x0071ce, navy: 0x041e42, spark: 0xffc220, white: 0xf4f5f7, offWhite: 0xe9ecf0,
  charcoal: 0x2f3542, darkGrey: 0x4a5260, midGrey: 0x8a94a3, lightGrey: 0xc9d0d8, steel: 0xb9c1cb,
  rackBlue: 0x1f5fbf, beamOrange: 0xf0731e, mustard: 0xe3a722, forkYellow: 0xf6b80e, stackerOrange: 0xf07a1a,
  cardboard: 0xc0915a, tape: 0xdcb87c, wood: 0xc99a62, green: 0x56b35a, mezzGreen: 0x3e8a58, skin: 0xf0c3a0,
  tire: 0x23272e, glass: 0x22395e, red: 0xe23b3b, amber: 0xffa21a, emerald: 0x22e07a,
};

/* ------------------------------------------------------------------ caches & tiny helpers */
const _geo = new Map(), _mat = new Map(), _tex = new Map();
const cached = (map, key, fn) => { let v = map.get(key); if (!v) { v = fn(); map.set(key, v); } return v; };
const r3 = (n) => Math.round(n * 1000) / 1000;

/** Rounded box (toy bevel). radius is clamped so it is always valid. */
export function rbox(w, h, d, r = 0.04, seg = 4) {
  const rr = Math.max(0.001, Math.min(r, Math.min(w, h, d) / 2 - 0.0005));
  return cached(_geo, `rb${r3(w)},${r3(h)},${r3(d)},${r3(rr)},${seg}`, () => new RoundedBoxGeometry(w, h, d, seg, rr));
}
const cyl = (rt, rb, h, s = 24) => cached(_geo, `cy${r3(rt)},${r3(rb)},${r3(h)},${s}`, () => new THREE.CylinderGeometry(rt, rb, h, s));
const sph = (r, ws = 24, hs = 16) => cached(_geo, `sp${r3(r)},${ws},${hs}`, () => new THREE.SphereGeometry(r, ws, hs));
const dome = (r) => cached(_geo, `dm${r3(r)}`, () => new THREE.SphereGeometry(r, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2));
const cap = (r, len, rs = 16) => cached(_geo, `ca${r3(r)},${r3(len)},${rs}`, () => new THREE.CapsuleGeometry(r, len, 6, rs));
const torus = (R, t, rs = 10, ts = 28) => cached(_geo, `to${r3(R)},${r3(t)},${rs},${ts}`, () => new THREE.TorusGeometry(R, t, rs, ts));
const plane = (w, h) => cached(_geo, `pl${r3(w)},${r3(h)}`, () => new THREE.PlaneGeometry(w, h));

/** Lathe cylinder with rounded edges (axis Y). axis:'x' rotates it to lie along X. */
export function roundCyl(r, h, b = Math.min(r, h) * 0.3, seg = 28, axis = 'y') {
  return cached(_geo, `rc${r3(r)},${r3(h)},${r3(b)},${seg},${axis}`, () => {
    const p = [new THREE.Vector2(0, -h / 2)], n = 5;
    for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + (i / n) * Math.PI / 2; p.push(new THREE.Vector2(r - b + Math.cos(a) * b, -h / 2 + b + Math.sin(a) * b)); }
    for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI / 2; p.push(new THREE.Vector2(r - b + Math.cos(a) * b, h / 2 - b + Math.sin(a) * b)); }
    p.push(new THREE.Vector2(0, h / 2));
    const g = new THREE.LatheGeometry(p, seg);
    if (axis === 'x') g.rotateZ(Math.PI / 2); else if (axis === 'z') g.rotateX(Math.PI / 2);
    return g;
  });
}
/** Rounded tyre ring (lathe), axis along X. */
function tireGeo(r, w) {
  return cached(_geo, `ti${r3(r)},${r3(w)}`, () => {
    const ri = r * 0.6, c = Math.min(w * 0.42, r * 0.25), n = 6, p = [new THREE.Vector2(ri, -w / 2)];
    for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + (i / n) * Math.PI / 2; p.push(new THREE.Vector2(r - c + Math.cos(a) * c, -w / 2 + c + Math.sin(a) * c)); }
    for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI / 2; p.push(new THREE.Vector2(r - c + Math.cos(a) * c, w / 2 - c + Math.sin(a) * c)); }
    p.push(new THREE.Vector2(ri, w / 2));
    const g = new THREE.LatheGeometry(p, 64); g.rotateZ(Math.PI / 2); return g;
  });
}

/** Shared matte material (roughness 0.85, metalness 0 by default). */
export function mat(color, o = {}) {
  // brand colours (#0071CE / #FFC220) + decals bypass ACES so they render true to the hex (QA B10/B11)
  const tm = o.brand ? false : (o.toneMapped ?? !(color === PALETTE.blue || color === PALETTE.spark));
  const key = color + JSON.stringify({ ...o, map: undefined, tm }) + (o.map ? o.map.uuid : '');
  return cached(_mat, key, () => new THREE.MeshStandardMaterial({ toneMapped: tm, color, roughness: o.roughness ?? 0.85, metalness: o.metalness ?? 0,
    emissive: o.emissive ?? 0x000000, emissiveIntensity: o.ei ?? 1, transparent: !!o.transparent, opacity: o.opacity ?? 1,
    depthWrite: o.depthWrite ?? true, side: o.side ?? THREE.FrontSide, map: o.map ?? null, alphaTest: o.alphaTest ?? 0,
    polygonOffset: !!o.po, polygonOffsetFactor: o.po ? -2 : 0, polygonOffsetUnits: o.po ? -2 : 0 }));
}
/** Per-instance emissive material (for pulsing lights). */
const glowMat = (color, ei = 1.2) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: ei, roughness: 0.5, metalness: 0 });

const M = {
  get tire() { return mat(PALETTE.tire, { roughness: 0.9 }); },
  get hub() { return mat(0xdfe3e8, { roughness: 0.6 }); },
  get charcoal() { return mat(PALETTE.charcoal); },
  get dark() { return mat(0x1c2028, { roughness: 0.8 }); },
  get glass() { return mat(PALETTE.glass, { roughness: 0.35 }); },
  get steel() { return mat(PALETTE.steel, { roughness: 0.55 }); },
  get light() { return mat(PALETTE.lightGrey); },
  get white() { return mat(PALETTE.white); },
  get navy() { return mat(PALETTE.navy); },
  get blue() { return mat(PALETTE.blue); },
  get yellow() { return mat(PALETTE.spark); },
  /** see-through cab glass so drivers are visible (shared, transparent, no depth write) */
  get glassClear() { return (_glassClear ??= Object.assign(new THREE.MeshStandardMaterial({ color: 0xa8cce8, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.3, depthWrite: false }), { name: 'glassClear' })); },
};
let _glassClear = null;
const clearGlass = (m) => { m.castShadow = false; return m; };

/** Create + place a shadowed mesh. */
function add(parent, geo, material, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, name) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
  m.castShadow = true; m.receiveShadow = true;
  if (name) m.name = name;
  parent.add(m); return m;
}
function grp(parent, name, x = 0, y = 0, z = 0) { const g = new THREE.Group(); g.name = name || ''; g.position.set(x, y, z); if (parent) parent.add(g); return g; }
/** Box spanning two points (for diagonal braces / rails). */
function strut(parent, a, b, t, material, name) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), len = A.distanceTo(B);
  const m = add(parent, rbox(t, len, t, t * 0.35, 2), material, 0, 0, 0, 0, 0, 0, name);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  return m;
}
function rng(seed = 1) { let s = seed >>> 0; return () => { s += 0x6d2b79f5; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const ease = (x) => x * x * (3 - 2 * x);
const damp = (cur, target, k, dt) => cur + (target - cur) * (1 - Math.exp(-k * dt));
// userData IS the factory's state object (not a copy), so drive()/getters and the update closure see the same fields
function finish(g, parts, update, extra = {}) {
  for (const k in g.userData) if (!(k in extra)) extra[k] = g.userData[k];
  extra.parts = parts; extra.update = update || (() => {}); g.userData = extra;
  if (typeof extra.setSteer === 'function' && !extra.setSteerNow) addSteerApi(extra, parts);
  if (extra.operatorCfg) installOperator(g, extra);
  return g;
}
/**
 * B25 steering API (every model with setSteer). setSteer(delta, snap=false) sets the steer TARGET; the wheels slew
 * toward it at userData.steerRate (rad/s) inside update(dt) or drive(dt). snap=true applies instantly (scripted
 * playback). setSteerNow(delta) = old immediate behaviour. Per-wheel angles are true Ackermann (each wheel's own
 * steer-axis lateral offset vs the ICR on the fixed axle): ackermann(delta) -> {inner, outer, angles[]},
 * getWheelSteer() -> angles[] (one per userData.parts.steer group), setWheelSteer(angles[]) sets wheels directly.
 * rearSteer (bool) says whether the steered wheels are behind the fixed axle (forklift, reach, stackers, jacks).
 */
/**
 * B29 operator API, installed by finish() on every vehicle that declares ud.operatorCfg:
 *   anchors.{seat|stand|platform, steerGrip|tillerGrip|...}  Object3Ds (facing +Z of the anchor = operator forward)
 *   attachOperator(op = createOperator({pose})) parents op to the anchor, sets its pose and puts both hands on the grip
 *     (they follow the steering wheel / tiller every frame); returns op.  detachOperator() -> op.  operator (current).
 *   Option {operator:true} on the vehicle factory attaches one at creation. The vehicle's update(dt,t) also updates it.
 */
/** B29 assert helper for the app: true when a vehicle may move (it has an operator, or is driverless such as the autoStacker / AMR).
 *  Usage: if (speed > 0 && !isManned(v)) console.error('[ASSERT] unmanned-motion', v.name). */
export function isManned(v) { const ud = v?.userData || {}; return !!ud.operator || !ud.attachOperator; }
function installOperator(g, ud) {
  const cfg = ud.operatorCfg, base = ud.update;
  ud.anchors = { ...(ud.anchors || {}), ...cfg.anchors }; ud.operatorPose = cfg.pose; ud.operator = null;
  ud.attachOperator = (op) => {
    op = op || createOperator({ pose: cfg.pose, hardHat: cfg.hardHat ?? true, vest: cfg.vest, seed: cfg.seed });
    if (ud.operator && ud.operator !== op) ud.detachOperator();
    cfg.anchor.add(op); op.position.set(0, 0, 0); op.rotation.set(0, 0, 0);
    if (op.userData.setPose) op.userData.setPose(cfg.pose, { lean: cfg.lean });
    if (op.userData.attachHandsTo) op.userData.attachHandsTo(cfg.grip, cfg.spread ?? 0.08, cfg.one ?? null);
    ud.operator = op; op.userData.update(0, 0); return op;
  };
  ud.detachOperator = () => { const op = ud.operator; if (op) { if (op.parent) op.parent.remove(op); if (op.userData.detachHands) op.userData.detachHands(); } ud.operator = null; return op; };
  if (cfg.pose === 'walking-tiller') {   // tiller trucks: auto PULL when travelling tiller-first (-Z), PUSH when forks-first (+Z)
    const par = cfg.anchor.parent, gp = new THREE.Vector3(); g.updateMatrixWorld(true); cfg.grip.getWorldPosition(gp); par.worldToLocal(gp);
    const pullA = grp(par, 'anchorPull', gp.x + 0.235, cfg.anchor.position.y, gp.z - (cfg.pullReach ?? 0.32)); pullA.rotation.y = Math.PI; ud.anchors.pull = pullA;
    let mode = null, vz = 0; const prev = new THREE.Vector3(), cur = new THREE.Vector3(), fz = new THREE.Vector3(); let has = false;
    ud.operatorMode = cfg.mode || 'auto';
    ud.setOperatorMode = (m) => { ud.operatorMode = m; if (m !== 'auto') applyMode(m); };
    const applyMode = (m) => { const op = ud.operator; if (!op || m === mode) return; mode = m;
      const A = m === 'pull' ? pullA : cfg.anchor; A.add(op); op.position.set(0, 0, 0); op.rotation.set(0, 0, 0);
      op.userData.setPose(m === 'pull' ? 'walking-tiller' : 'pushing-tiller'); op.userData.attachHandsTo(cfg.grip, cfg.spread ?? 0.08, m === 'pull' ? 1 : null); };
    const att = ud.attachOperator; ud.attachOperator = (op) => { op = att(op); mode = null; applyMode(ud.operatorMode === 'auto' ? 'push' : ud.operatorMode); return op; };
    ud.getOperatorMode = () => mode;
    ud.update = (dt, t) => { base(dt, t); g.updateWorldMatrix(true, false); cur.setFromMatrixPosition(g.matrixWorld);
      if (has && dt > 0) { fz.set(0, 0, 1).transformDirection(g.matrixWorld); vz = damp(vz, cur.clone().sub(prev).dot(fz) / dt, 6, dt); } prev.copy(cur); has = has || dt > 0;
      if (ud.operatorMode === 'auto') { if (vz < -0.08) applyMode('pull'); else if (vz > 0.08) applyMode('push'); }
      if (ud.operator) ud.operator.userData.update(dt, t); };
  } else ud.update = (dt, t) => { base(dt, t); if (ud.operator) ud.operator.userData.update(dt, t); };
  if (cfg.auto) ud.attachOperator();
}
function addSteerApi(ud, parts) {
  const raw = ud.setSteer, max = ud.kin?.maxSteer ?? Infinity;
  ud.setSteerNow = raw; ud.steer = ud.steer ?? 0; ud.steerTarget = ud.steer; ud.steerRate = ud.steerRate ?? 1.5;
  ud.setSteer = (r, snap = false) => { ud.steerTarget = THREE.MathUtils.clamp(r, -max, max); if (snap || !(ud.steerRate > 0)) raw(ud.steerTarget); };
  ud.stepSteer = (dt) => { const d = ud.steerTarget - ud.steer; if (Math.abs(d) < 1e-7) return; const st = ud.steerRate * dt; raw(Math.abs(d) <= st ? ud.steerTarget : ud.steer + Math.sign(d) * st); };
  const steerGroups = () => parts.steer || [];
  ud.ackermann = (delta) => {
    const L = ud.kin?.L ?? 1, flip = ud.rearSteer ? -1 : 1, gs = steerGroups();
    const angles = gs.map((s) => { if (Math.abs(delta) < 1e-5) return 0; const R = Math.abs(L) / Math.tan(delta); const x = s.position.x + (s.userData.wheel ? s.userData.wheel.position.x : 0); return flip * Math.atan(Math.abs(L) / (R - x)); });
    const mags = angles.map(Math.abs); return { inner: mags.length ? Math.max(...mags) * Math.sign(delta) * flip : 0, outer: mags.length ? Math.min(...mags) * Math.sign(delta) * flip : 0, angles };
  };
  ud.getWheelSteer = () => steerGroups().map((s) => s.rotation.y);
  ud.setWheelSteer = (angles) => { steerGroups().forEach((s, i) => { if (angles[i] != null) s.rotation.y = angles[i]; }); };
  const inner = ud.update;
  ud.update = (dt, t) => { if (!ud._driven) ud.stepSteer(dt); return inner(dt, t); };
}
/**
 * B21/B23 fork API for every mast truck. Heights in WORLD metres (vehicle position, mast root offset and floor included):
 *   getForkBottomY() tine underside (heel), getForkTopY() tine top surface (what the pallet deck rests on),
 *   setForkBottomY(y, snap) / setForkTopY(y, snap) command the mast so the tine underside / top lands at y,
 *   forkHeightFor(bottomY) -> setForkHeight() argument, getForkPocketY(pallet) -> tine-underside Y for a clean entry
 *   (pallet bottom + 0.022 + 0.03 clearance; the 0.057 m tine's top is then 0.013 below the deck underside),
 *   seatForkTopY(slotY) -> tine-top Y at which a carried pallet's bottom sits exactly on slotY (= slotY + 0.122, the top-deck underside).
 *   forkPocketY (0.052 above pallet base) / palletPocket {lo, hi} constants, isForkSettled(), forkSpeed (m/s, max 0.5).
 */
// fork pocket at the tine positions (x = +-0.25, entering along Z): bottom-board top 0.022 .. top-deck underside 0.122. The 3 stringer
// boards run along Z on the block rows (x = 0, +-0.44) so nothing crosses the pocket below 0.122 (verified by ray in check_qa.html).
const PALLET_POCKET = { lo: 0.022, hi: 0.122 }, FORK_ENTRY_CLEAR = 0.03;
function addForkApi(g, ud, mast) {
  const car = mast.carriage, v = new THREE.Vector3();
  const wy = (y) => { g.updateWorldMatrix(true, true); return car.localToWorld(v.set(0, y, FORK_LEN * 0.5)).y; };
  ud.forkThickness = FORK_TOP - FORK_BOT; ud.palletPocket = PALLET_POCKET; ud.forkPocketY = PALLET_POCKET.lo + FORK_ENTRY_CLEAR;
  ud.getForkBottomY = () => wy(FORK_BOT); ud.getForkTopY = () => wy(FORK_TOP);
  ud.forkHeightFor = (bottomY) => mast.st.h + (bottomY - ud.getForkBottomY());
  ud.setForkBottomY = (y, snap = false) => ud.setForkHeight(ud.forkHeightFor(y), snap);
  ud.setForkTopY = (y, snap = false) => ud.setForkBottomY(y - (FORK_TOP - FORK_BOT), snap);
  ud.getForkPocketY = (pallet) => { const p = new THREE.Vector3(); (pallet?.isObject3D ? pallet.getWorldPosition(p) : p.set(0, typeof pallet === 'number' ? pallet : 0, 0)); return p.y + ud.forkPocketY; };
  ud.seatForkTopY = (slotY) => slotY + PALLET_POCKET.hi;
  ud.isForkSettled = () => mast.st.h === mast.st.target && mast.st.v === 0;
  ud.setForkSpeed = (vmax) => { mast.st.vmax = THREE.MathUtils.clamp(vmax, 0.05, FORK_VMAX); }; ud.forkSpeed = FORK_VMAX;
  ud.getForkTarget = () => mast.st.target;
}
/** idle demo cycle (autoLift): rise to hi at the capped speed, dwell, lower, dwell. Never exceeds the trapezoid profile. */
function autoCycle(ud, mast, hi, dt, onTop) {
  const a = ud._al || (ud._al = { up: true, wait: 0.8 });
  if (mast.st.h === mast.st.target && mast.st.v === 0) { a.wait -= dt; if (a.wait <= 0) { a.up = !a.up; a.wait = 1.5; mast.set(a.up ? hi : 0); } }
  onTop?.(mast.st.h > hi - 0.05 && mast.st.target === hi);
}

/* ------------------------------------------------------------------ canvas textures */
const hasDOM = typeof document !== 'undefined';
function canvasTex(key, w, h, draw, opts = {}) {
  return cached(_tex, key, () => {
    if (!hasDOM) return null;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    if (opts.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
    return t;
  });
}
const FONT = '"Helvetica Neue", Helvetica, Arial, "Noto Sans", "DejaVu Sans", sans-serif';
/** Walmart six-ray spark. */
export function drawSpark(ctx, cx, cy, R, color = '#FFC220') {
  ctx.save(); ctx.translate(cx, cy); ctx.fillStyle = color;
  const r0 = R * 0.30, w = R * 0.30;
  for (let i = 0; i < 6; i++) {
    ctx.save(); ctx.rotate(-Math.PI / 2 + i * Math.PI / 3);
    ctx.beginPath(); ctx.ellipse(r0 + (R - r0) / 2, 0, (R - r0) / 2, w / 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}
function trailerSideTex() {
  return canvasTex('trailerSide', 2048, 384, (ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    ctx.textBaseline = 'alphabetic';
    const size = 250; ctx.font = `bold ${size}px ${FONT}`;
    const w1 = ctx.measureText('Walmart').width, w2 = ctx.measureText('com').width, R = 120, gap = 26;
    let total = w1 + gap * 2 + R * 2 + w2; const s = Math.min(1, (W * 0.94) / total);
    ctx.save(); ctx.translate(W / 2, 0); ctx.scale(s, s); ctx.translate(-total / 2, 0);
    const base = (H * 0.66) / s;
    ctx.fillStyle = '#0071CE'; ctx.fillText('Walmart', 0, base);
    drawSpark(ctx, w1 + gap + R, base - size * 0.36, R);
    ctx.fillText('com', w1 + gap * 2 + R * 2, base);
    ctx.restore();
  });
}
function trailerRearTex() {
  return canvasTex('trailerRear', 512, 512, (ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0071CE'; ctx.font = `bold 46px ${FONT}`; ctx.textAlign = 'left';
    ctx.fillText('Walmart', 300, 70); drawSpark(ctx, 488, 56, 16);
    ctx.font = `bold 30px ${FONT}`; ctx.fillText('.com', 380, 104);
    ctx.fillStyle = '#041E42'; ctx.font = `bold 44px ${FONT}`; ctx.fillText("53'", 420, 470);
    ctx.font = `bold 22px ${FONT}`; ctx.fillText('WMT 53082', 300, 140);
  });
}
function cabWordmarkTex() {
  return canvasTex('cabWordmark', 1024, 256, (ctx, W, H) => {
    ctx.clearRect(0, 0, W, H); ctx.textBaseline = 'alphabetic'; ctx.font = `bold 170px ${FONT}`;
    const w1 = ctx.measureText('Walmart').width, R = 82, total = w1 + 24 + R * 2, x0 = (W - total) / 2;
    ctx.fillStyle = '#ffffff'; ctx.fillText('Walmart', x0, 182); drawSpark(ctx, x0 + w1 + 24 + R, 122, R);
  });
}
function sparkTex() { return canvasTex('spark', 256, 256, (ctx, W) => { ctx.clearRect(0, 0, W, W); drawSpark(ctx, W / 2, W / 2, W * 0.46); }); }
function beltTex() {
  return canvasTex('belt', 128, 128, (ctx, W, H) => {
    ctx.fillStyle = '#2b3039'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#3d4450'; ctx.lineWidth = 10; ctx.lineCap = 'round';
    for (let k = 0; k < 2; k++) { const y = k * 64 + 20; ctx.beginPath(); ctx.moveTo(14, y + 22); ctx.lineTo(64, y); ctx.lineTo(114, y + 22); ctx.stroke(); }
  }, { repeat: true });
}
function wireDeckTex() {
  return canvasTex('wire', 256, 256, (ctx, W) => {
    ctx.clearRect(0, 0, W, W); ctx.strokeStyle = '#d5dbe2'; ctx.lineWidth = 7;
    for (let i = 0; i <= 8; i++) { const p = i * W / 8; ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, W); ctx.stroke(); }
    ctx.lineWidth = 5; for (let i = 0; i <= 16; i++) { const p = i * W / 16; ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(W, p); ctx.stroke(); }
  }, { repeat: true });
}
function labelTex(text, bg = '#0071CE', fg = '#ffffff') {
  return canvasTex('lbl' + text + bg + fg, 256, 128, (ctx, W, H) => {
    ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(4, 4, W - 8, H - 8, 22); ctx.fill();
    ctx.fillStyle = fg; ctx.font = `bold 78px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, W / 2, H / 2 + 4);
  });
}
function decal(parent, tex, w, h, x, y, z, ry = 0, name) {
  if (!tex) return null;
  const m = new THREE.Mesh(plane(w, h), mat(0xffffff, { map: tex, transparent: true, roughness: 0.8, po: true, depthWrite: false, brand: true }));
  m.position.set(x, y, z); m.rotation.y = ry; m.receiveShadow = true; if (name) m.name = name; parent.add(m); return m;
}

/* ------------------------------------------------------------------ shared sub-assemblies */
/** Wheel: rounded tyre + hub disc + hub cap + lug nuts. side=+1 outer face toward +X, -1 toward -X. */
function makeWheel(r, w, { side = 1, dual = false, hubColor = 0xdfe3e8, name = 'wheel' } = {}) {
  const g = grp(null, name), hubM = mat(hubColor, { roughness: 0.6 });
  const offs = dual ? [-side * (w / 2 + 0.012), side * (w / 2 + 0.012)] : [0];
  for (const o of offs) add(g, tireGeo(r, w), M.tire, o);
  const xo = offs[offs.length - 1], ri = r * 0.6;
  add(g, roundCyl(ri * 1.02, w * 0.8, w * 0.12, 28, 'x'), hubM, xo + side * w * 0.06);
  add(g, roundCyl(ri * 0.42, w * 0.2, w * 0.06, 20, 'x'), mat(0x9aa3ae, { roughness: 0.5 }), xo + side * (w * 0.46));
  const nut = sph(ri * 0.075, 8, 6);
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; add(g, nut, M.charcoal, xo + side * w * 0.47, Math.cos(a) * ri * 0.66, Math.sin(a) * ri * 0.66); }
  g.userData.radius = r; return g;
}
function makeBeacon(color = PALETTE.amber, s = 1) {
  const g = grp(null, 'beacon'), m = glowMat(color, 1.0);
  add(g, roundCyl(0.075 * s, 0.05 * s, 0.015, 20), M.charcoal, 0, 0.025 * s);
  const d = add(g, dome(0.065 * s), m, 0, 0.05 * s, 0, 0, 0, 0, 'beaconDome'); d.castShadow = false;
  g.userData.mat = m; return g;
}
const flash = (t, f = 1.6, phase = 0) => 0.25 + 2.2 * Math.pow(Math.max(0, Math.sin((t + phase) * Math.PI * 2 * f)), 6);

/** Cardboard carton with tape + label. */
function makeCarton(parent, w, h, d, x, y, z, tone = 0, ry = 0) {
  const tones = [0xc0915a, 0xb3834d, 0xd0a56e, 0xc89c66, 0xe6d5b8];
  const g = grp(parent, 'carton', x, y, z); g.rotation.y = ry;
  add(g, rbox(w, h, d, Math.min(0.025, h * 0.12), 2), mat(tones[tone % tones.length]), 0, h / 2, 0);
  const tm = mat(PALETTE.tape, { roughness: 0.6 });
  add(g, rbox(Math.min(0.07, w * 0.25), 0.006, d + 0.004, 0.002, 1), tm, 0, h + 0.001, 0);
  add(g, rbox(Math.min(0.07, w * 0.25), h * 0.3, d + 0.006, 0.002, 1), tm, 0, h * 0.85, 0);
  if (w > 0.25 && h > 0.18) add(g, rbox(w * 0.3, h * 0.22, 0.006, 0.002, 1), mat(0xf7f7f2), w * 0.18, h * 0.45, d / 2 + 0.002);
  return g;
}

/* ------------------------------------------------------------------ geometry merging (instancing helpers) */
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3(1, 1, 1);
const mtx = (x, y, z, rx = 0, ry = 0, rz = 0) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), _q.clone().setFromEuler(_e.set(rx, ry, rz)), _s);
function cleanAttrs(g) { for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(k)) g.deleteAttribute(k); return g; }
/** Merge [{geo, m:Matrix4, color:hex|THREE.Color, grain?:number}] into one non-indexed geometry with vertex colours. */
function mergeColored(pieces) {
  const out = pieces.map((p) => {
    const g = cleanAttrs(p.geo.index ? p.geo.toNonIndexed() : p.geo.clone());
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    const pos = g.attributes.position, n = pos.count, col = new Float32Array(n * 3), base = new THREE.Color(p.color);
    for (let i = 0; i < n; i++) {
      let k = 1;
      if (p.grain) { const a = pos.getX(i) * 23 + pos.getZ(i) * 31 + p.grain * 7.1; k = 1 + 0.05 * Math.sin(a) + 0.03 * Math.sin(a * 3.7 + 1.3); }
      col[i * 3] = base.r * k; col[i * 3 + 1] = base.g * k; col[i * 3 + 2] = base.b * k;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.applyMatrix4(p.m); return g;
  });
  return mergeGeometries(out, false);
}
/** Bake any Group into [{geometry, material}] (one merged geometry per material) in the group's local space. */
export function bakeGroup(root) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), buckets = new Map();
  root.traverse((o) => {
    if (!o.isMesh || !o.visible) return;
    let vis = true; for (let p = o; p && p !== root; p = p.parent) if (!p.visible) vis = false;
    if (!vis) return;
    const g = cleanAttrs(o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone());
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    g.applyMatrix4(_m4.multiplyMatrices(inv, o.matrixWorld));
    const has = !!g.attributes.color;
    const key = o.material.uuid + (has ? 'c' : '');
    if (!buckets.has(key)) buckets.set(key, { material: o.material, geos: [], color: has });
    buckets.get(key).geos.push(g);
  });
  return [...buckets.values()].map((b) => ({ geometry: mergeGeometries(b.geos, false), material: b.material }));
}
/** Turn baked parts into InstancedMeshes. Returns a Group with userData.meshes / setMatrixAt(i, m) / commit(). */
function instancedFrom(parts, count, name) {
  const g = grp(null, name); const meshes = parts.map((p) => {
    const im = new THREE.InstancedMesh(p.geometry, p.material, count); im.castShadow = im.receiveShadow = !p.material.transparent; g.add(im); return im; });
  g.userData.meshes = meshes; g.userData.count = count;
  g.userData.setMatrixAt = (i, m) => meshes.forEach((im) => im.setMatrixAt(i, m));
  g.userData.commit = () => meshes.forEach((im) => { im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); });
  g.userData.update = () => {};
  return g;
}

/* ------------------------------------------------------------------ pallets */
// GMA-ish 1.02 m (X) x 1.22 m (Z) x 0.144 m, 4-way entry. Forks slide in along Z between the block columns (x≈±0.24).
export const PALLET = { w: 1.02, d: 1.22, h: 0.144 };
const _palletGeo = {};
const pineMap = () => canvasTex('pine', 256, 256, (ctx, W) => {
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, W); const r = rng(9);
  for (let i = 0; i < 70; i++) { const x = r() * W; ctx.strokeStyle = `rgba(120,80,40,${0.05 + r() * 0.08})`; ctx.lineWidth = 1 + r() * 3;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.bezierCurveTo(x + r() * 10 - 5, W * 0.3, x + r() * 10 - 5, W * 0.7, x + r() * 8 - 4, W); ctx.stroke(); }
  for (let i = 0; i < 3; i++) { ctx.fillStyle = 'rgba(110,70,35,0.18)'; ctx.beginPath(); ctx.ellipse(r() * W, r() * W, 5, 9, 0, 0, 7); ctx.fill(); }
}, { repeat: true });
/** {geometry, material} for one pallet variant ('pine' | 'blueWood' | 'steel'), origin at ground centre — use with InstancedMesh. */
export function getPalletGeometry(variant = 'pine') {
  if (_palletGeo[variant]) return _palletGeo[variant];
  const P = [], r = rng(variant.length * 17 + 3);
  const jit = (hex, amt) => { const c = new THREE.Color(hex); const k = 1 + (r() - 0.5) * amt; c.r *= k; c.g *= k * (1 + (r() - 0.5) * amt * 0.3); c.b *= k; return c; };
  const { w, d } = PALLET;
  if (variant === 'steel') {
    const col = 0x2f86d8, t = 0.004;
    // slotted top deck: 9 channel slats along Z with a raised rib each
    for (let i = 0; i < 9; i++) { const x = -0.45 + i * 0.1125;
      P.push({ geo: rbox(0.085, 0.022, d, 0.008, 2), m: mtx(x, 0.133, 0), color: jit(col, 0.05) });
      P.push({ geo: rbox(0.012, 0.01, d - 0.02, 0.004, 1), m: mtx(x, 0.147, 0), color: jit(0x4a9ae6, 0.04) }); }
    // perimeter frame
    for (const s of [-1, 1]) { P.push({ geo: rbox(w, 0.022, 0.03, 0.008, 2), m: mtx(0, 0.133, s * (d / 2 - 0.015)), color: col });
      P.push({ geo: rbox(0.03, 0.03, d, 0.008, 2), m: mtx(s * (w / 2 - 0.015), 0.125, 0), color: col }); }
    // 3 cross beams (box section) under deck
    for (const x of [-0.44, 0, 0.44]) P.push({ geo: rbox(0.12, 0.02, d, 0.006, 2), m: mtx(x, 0.102, 0), color: jit(col, 0.06) });  // beams along Z on the block rows: fork pockets open to the deck
    // 9 hollow box-section blocks (open along X so the tube reads) + 3 bottom runners along Z
    for (const x of [-0.44, 0, 0.44]) for (const z of [-0.54, 0, 0.54]) {
      const bw = 0.13, bh = 0.072, bd = 0.13;
      P.push({ geo: rbox(bw, 0.012, bd, 0.004, 1), m: mtx(x, 0.086, z), color: col });
      P.push({ geo: rbox(bw, 0.012, bd, 0.004, 1), m: mtx(x, 0.026, z), color: col });
      for (const s of [-1, 1]) P.push({ geo: rbox(bw, bh, 0.012, 0.004, 1), m: mtx(x, 0.056, z + s * (bd / 2 - 0.006)), color: jit(col, 0.06) });
    }
    for (const x of [-0.44, 0, 0.44]) P.push({ geo: rbox(0.13, 0.02, d, 0.006, 2), m: mtx(x, 0.01, 0), color: jit(col, 0.05) });
  } else {
    const wood = variant === 'blueWood' ? 0x1f6fd1 : 0xd6ad78, blk = variant === 'blueWood' ? 0x1a5fb5 : 0xc39662;
    const amt = variant === 'blueWood' ? 0.12 : 0.16, grain = variant === 'pine';
    for (const x of [-0.44, 0, 0.44]) P.push({ geo: rbox(0.14, 0.022, d, 0.008, 2), m: mtx(x, 0.011, 0), color: jit(wood, amt), grain: grain ? r() * 10 : 0 });   // bottom boards
    for (const x of [-0.44, 0, 0.44]) for (const z of [-0.535, 0, 0.535]) P.push({ geo: rbox(x === 0 ? 0.12 : 0.14, 0.078, z === 0 ? 0.14 : 0.15, 0.012, 2), m: mtx(x, 0.061, z), color: jit(blk, amt) });  // 9 blocks
    for (const x of [-0.44, 0, 0.44]) P.push({ geo: rbox(x === 0 ? 0.12 : 0.14, 0.022, d, 0.008, 2), m: mtx(x, 0.111, 0), color: jit(wood, amt), grain: grain ? r() * 10 : 0 });  // stringer boards along Z on the block rows (fork pockets stay open up to the deck)
    const zs = [-0.545, -0.36, -0.18, 0, 0.18, 0.36, 0.545];
    zs.forEach((z, i) => P.push({ geo: rbox(w, 0.022, i === 0 || i === 6 ? 0.13 : i === 3 ? 0.14 : 0.1, 0.008, 2), m: mtx(0, 0.133, z), color: jit(wood, amt), grain: grain ? r() * 10 : 0 }));  // top deck boards across the stringers, with gaps
  }
  const material = variant === 'steel' ? new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0 })
    : new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, metalness: 0, map: variant === 'pine' ? pineMap() : null });
  material.name = 'pallet_' + variant;
  return (_palletGeo[variant] = { geometry: mergeColored(P), material });
}

/** Stack of cartons on a 1.02 x 1.22 footprint. Returns height. */
function stackCartons(parent, seed = 1, maxH = 1.2, wf = 1.0, df = 1.2) {
  const r = rng(seed); let y = 0; const g = grp(parent, 'cartons');
  const sizes = [[0.5, 0.4], [0.33, 0.4], [0.5, 0.6], [0.25, 0.3], [0.5, 0.3]];
  while (true) {
    const [cw, cd] = sizes[Math.floor(r() * sizes.length)], rem = maxH - y; let ch = 0.2 + r() * 0.14;
    if (rem - ch < 0.2 && rem >= 0.15) ch = Math.min(rem, 0.4);   // last layer sized to land on the target height
    if (y + ch > maxH + 1e-6) break;
    const nx = Math.floor(wf / cw), nz = Math.floor(df / cd), tone = Math.floor(r() * 4), last = y + ch * 2 > maxH;
    for (let i = 0; i < nx; i++) for (let k = 0; k < nz; k++) {
      if (last && r() < 0.3) continue;
      makeCarton(g, cw - 0.012, ch, cd - 0.012, -wf / 2 + cw * (i + 0.5), y, -df / 2 + cd * (k + 0.5), r() < 0.8 ? tone : Math.floor(r() * 5));
    }
    y += ch;
  }
  return y;
}
/** Stretch-wrap film around a load. */
function addWrap(parent, w, h, d, y0) {
  const film = mat(0xffffff, { roughness: 0.15, transparent: true, opacity: 0.22, depthWrite: false });
  const band = mat(0xf2f6fa, { roughness: 0.2, transparent: true, opacity: 0.4, depthWrite: false });
  const g = grp(parent, 'wrap');
  const a = add(g, rbox(w + 0.03, h, d + 0.03, 0.05, 3), film, 0, y0 + h / 2); a.castShadow = false;
  for (const f of [0.08, 0.5, 0.9]) { const b = add(g, rbox(w + 0.036, h * 0.09, d + 0.036, 0.03, 2), band, 0, y0 + h * f); b.castShadow = false; }
  return g;
}

/* ------------------------------------------------------------------ tote */
const TOTE_COLORS = { blue: 0x1f72d6, black: 0x262a31, grey: 0x7d8794 };
/* ------------------------------------------------------------------ heavy-duty tote (ref imgref/19) */
/** Clone `geo` and taper it: x/z scale goes linearly from (kx, kz) at its lowest vertex to 1 at its highest. */
function taperGeo(geo, kx, kz) {
  const g = geo.clone(), p = g.attributes.position; let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < p.count; i++) { lo = Math.min(lo, p.getY(i)); hi = Math.max(hi, p.getY(i)); }
  for (let i = 0; i < p.count; i++) { const t = (p.getY(i) - lo) / (hi - lo); p.setX(i, p.getX(i) * (kx + (1 - kx) * t)); p.setZ(i, p.getZ(i) * (kz + (1 - kz) * t)); }
  g.computeVertexNormals(); return g;
}
/** Drop every triangle whose 3 vertices are all above yCut (opens the top of a solid box). Returns non-indexed geometry. */
function openTop(geo, yCut) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone(), keep = [], A = g.attributes;
  for (let t = 0; t < A.position.count; t += 3) if (!(A.position.getY(t) > yCut && A.position.getY(t + 1) > yCut && A.position.getY(t + 2) > yCut)) keep.push(t);
  const out = new THREE.BufferGeometry();
  for (const k of ['position', 'normal', 'uv']) { const a = A[k]; if (!a) continue; const arr = new Float32Array(keep.length * 3 * a.itemSize);
    keep.forEach((t, j) => { for (let v = 0; v < 3; v++) for (let c = 0; c < a.itemSize; c++) arr[(j * 3 + v) * a.itemSize + c] = a.array[(t + v) * a.itemSize + c]; });
    out.setAttribute(k, new THREE.BufferAttribute(arr, a.itemSize)); }
  return out;
}
export const TOTE = { w: 0.45, d: 0.68, h: 0.379, bodyH: 0.345, nestPitch: 0.09, lidColor: 0xe8a818 };
const _toteGeo = {};
/**
 * getToteGeometry({color, lidColor}) -> { body, cavity, lid, parts } each {geometry, material}, merged + cached per colour
 * (one draw call per part; vertex colours). parts = [body, cavity] ; add lid for a lidded instance. Origin: floor centre.
 */
export function getToteGeometry(opts = {}) {
  const col = typeof opts.color === 'number' ? opts.color : ({ black: 0x23262b, blue: 0x1f5fb4, grey: 0x6f7884 })[opts.color || 'black'] ?? 0x23262b;
  const lc = opts.lidColor ?? TOTE.lidColor, key = col + ':' + lc;
  if (_toteGeo[key]) return _toteGeo[key];
  const { w, d, bodyH: H } = TOTE, kx = 0.87, kz = 0.9, rimH = 0.034, top = H - rimH;
  const ax = Math.atan((w / 2 - 0.006) * (1 - kx) / top), az = Math.atan((d / 2 - 0.006) * (1 - kz) / top);
  const sAt = (y, k) => k + (1 - k) * (y / top);
  const B = [], dark = new THREE.Color(col).multiplyScalar(0.55), P = (geo, m, color = col) => B.push({ geo, m, color });
  // tapered shell (open top), flat 3 cm floor pad so the bottom is exactly flat at y = 0 (conveyor-ready)
  const shell = cached(_geo, 'toteShell', () => { const g = taperGeo(rbox(w - 0.012, top + 0.02, d - 0.012, 0.035, 3), kx, kz); g.translate(0, (top + 0.02) / 2, 0); return openTop(g, top - 0.004); });
  P(shell, mtx(0, 0, 0)); P(rbox((w - 0.012) * kx - 0.04, 0.012, (d - 0.012) * kz - 0.04, 0.005, 2), mtx(0, 0.006, 0));
  // rim lip (4 bars) with the handle slots on the short ends
  for (const s of [-1, 1]) { P(rbox(0.034, rimH, d, 0.012, 2), mtx(s * (w / 2 - 0.017), top + rimH / 2, 0)); P(rbox(w - 0.06, rimH, 0.034, 0.012, 2), mtx(0, top + rimH / 2, s * (d / 2 - 0.017)));
    P(rbox(0.16, 0.034, 0.03, 0.014, 2), mtx(0, top - 0.035, s * (sAt(top - 0.035, kz) * (d / 2 - 0.006) + 0.004)), 0x0b0c0e); }  // handle slot recess
  // corner lugs + vertical ribs framing the recess panels (they lean with the tapered walls)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const y = top * 0.5;
    P(rbox(0.05, top - 0.03, 0.05, 0.016, 2), mtx(sx * (sAt(y, kx) * (w / 2 - 0.006) - 0.012), y, sz * (sAt(y, kz) * (d / 2 - 0.006) - 0.012), sz * az, 0, -sx * ax)); }
  for (const s of [-1, 1]) {
    for (const z of [-0.235, -0.105, 0.105, 0.235]) { const y = top * 0.47; P(rbox(0.016, top - 0.07, 0.03, 0.007, 2), mtx(s * (sAt(y, kx) * (w / 2 - 0.006) + 0.004), y, z * sAt(y, kz), 0, 0, -s * ax)); }
    for (const x of [-0.1, 0.1]) { const y = top * 0.47; P(rbox(0.03, top - 0.07, 0.016, 0.007, 2), mtx(x * sAt(y, kx), y, s * (sAt(y, kz) * (d / 2 - 0.006) + 0.004), s * az, 0, 0)); }
    // darker recess panels between the ribs (read as moulded rib recesses)
    P(rbox(0.006, top - 0.12, 0.1, 0.003, 1), mtx(s * (sAt(top * 0.45, kx) * (w / 2 - 0.006) + 0.001), top * 0.45, 0, 0, 0, -s * ax), dark);
    P(rbox(0.12, top - 0.12, 0.006, 0.003, 1), mtx(0, top * 0.45, s * (sAt(top * 0.45, kz) * (d / 2 - 0.006) + 0.001), s * az, 0, 0), dark);
  }
  const bodyMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0 }); bodyMat.name = 'tote_body';
  const cavMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(col).multiplyScalar(0.8), roughness: 0.9, metalness: 0, side: THREE.BackSide }); cavMat.name = 'tote_cavity';
  const cav = cached(_geo, 'toteCavity', () => { const hc = top - 0.02; const g = taperGeo(rbox(w - 0.07, hc + 0.02, d - 0.07, 0.03, 3), kx, kz); g.translate(0, 0.012 + (hc + 0.02) / 2, 0); return openTop(g, 0.012 + hc - 0.004); });
  // lid: plate, raised border, 5 x 7 raised grid, snap slots, stacking corner pads
  const L = [], lid = (geo, m, color = lc) => L.push({ geo, m, color }), lt = 0.026, ly = H;
  lid(rbox(w + 0.012, lt, d + 0.012, 0.01, 2), mtx(0, ly + lt / 2, 0));
  lid(rbox(w - 0.02, 0.016, d - 0.02, 0.006, 1), mtx(0, ly - 0.006, 0));                        // under-skirt locating into the rim
  const fw = w - 0.07, fd = d - 0.07, rb = 0.008, ry = ly + lt + rb / 2 - 0.001;
  for (const s of [-1, 1]) { lid(rbox(0.014, rb, fd, 0.004, 1), mtx(s * fw / 2, ry, 0)); lid(rbox(fw, rb, 0.014, 0.004, 1), mtx(0, ry, s * fd / 2)); }
  const nx = 5, nz = 7, cw = (fw - 0.03) / nx, cd = (fd - 0.03) / nz;
  for (let i = 0; i < nx; i++) for (let k = 0; k < nz; k++) lid(rbox(cw - 0.011, rb, cd - 0.011, 0.004, 1), mtx(-fw / 2 + 0.015 + cw * (i + 0.5), ry, -fd / 2 + 0.015 + cd * (k + 0.5)), new THREE.Color(lc).multiplyScalar(1.04));
  const slot = new THREE.Color(lc).multiplyScalar(0.35);
  for (const s of [-1, 1]) { for (const z of [-0.26, -0.09, 0.09, 0.26]) lid(rbox(0.007, 0.003, 0.04, 0.0015, 1), mtx(s * (w / 2 - 0.006), ly + lt + 0.0005, z), slot);
    for (const x of [-0.12, 0.12]) lid(rbox(0.04, 0.003, 0.007, 0.0015, 1), mtx(x, ly + lt + 0.0005, s * (d / 2 - 0.006)), slot); }
  const lidMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0 }); lidMat.name = 'tote_lid';
  const r = { body: { geometry: mergeColored(B), material: bodyMat }, cavity: { geometry: cav, material: cavMat }, lid: { geometry: mergeColored(L), material: lidMat } };
  r.parts = [r.body, r.cavity]; return (_toteGeo[key] = r);
}
/** Instanced heavy totes: InstancedMesh group (userData.setMatrixAt/commit); lid:true adds the lid mesh. */
export function createToteInstanced(count, opts = {}) { const G = getToteGeometry(opts); return instancedFrom(opts.lid === false ? G.parts : [...G.parts, G.lid], count, 'totes'); }
/**
 * createTote({variant:'heavy'|'crate', lid, color, lidColor, contents})
 *   'heavy' (default, ref imgref/19): 0.46 x 0.38 x 0.69 m (X,Y,Z incl. lid) black tapered tote with rib recesses, corner lugs,
 *           handle slots and a #E8A818 snap lid with raised grid. lid defaults to true. Flat bottom at y = 0 (conveyor-ready).
 *   'crate' (legacy 0.43 x 0.30 x 0.63 open crate, options color:'blue'|'black'|'grey'|hex, lid:false) = createCrateTote().
 * parts: body, cavity, lid ; userData: variant, size, stackHeight (put the next tote at y += stackHeight; 0.379 lidded),
 *        nestPitch (0.09: lid-less totes nest, each adds 0.09), setLid(bool), hasLid
 */
export function createTote(opts = {}) {
  if ((opts.variant ?? 'heavy') === 'crate') return createCrateTote(opts);
  const G = getToteGeometry(opts), g = grp(null, 'tote'), P = {};
  P.body = add(g, G.body.geometry, G.body.material, 0, 0, 0, 0, 0, 0, 'body');
  P.cavity = add(g, G.cavity.geometry, G.cavity.material, 0, 0, 0, 0, 0, 0, 'cavity'); P.cavity.castShadow = false;
  P.lid = add(g, G.lid.geometry, G.lid.material, 0, 0, 0, 0, 0, 0, 'lid');
  if (opts.contents) { const c = grp(g, 'contents'); makeCarton(c, 0.2, 0.16, 0.24, -0.07, 0.012, -0.13, 2); makeCarton(c, 0.16, 0.2, 0.22, 0.08, 0.012, 0.14, 0); P.contents = c; }
  const ud = { variant: 'heavy', nestPitch: TOTE.nestPitch };
  ud.setLid = (v) => { P.lid.visible = !!v; ud.hasLid = !!v; ud.stackHeight = v ? TOTE.h : TOTE.bodyH; ud.size = { x: TOTE.w + 0.012, y: ud.stackHeight, z: TOTE.d + 0.012 }; };
  ud.setLid(opts.lid ?? true);
  return finish(g, P, null, ud);
}
/**
 * createCrateTote({color:'blue'|'black'|'grey'|hex, lid:false, contents:false})  legacy open crate 0.43 x 0.30 x 0.63 m (X,Y,Z); = createTote({variant:'crate'}).
 */
export function createCrateTote(opts = {}) {
  const col = typeof opts.color === 'number' ? opts.color : TOTE_COLORS[opts.color || 'blue'];
  const g = grp(null, 'tote'), m = mat(col, { roughness: 0.7 }), slot = mat(0x111419), H = 0.3;
  add(g, rbox(0.36, 0.025, 0.56, 0.01, 2), m, 0, 0.0125, 0, 0, 0, 0, 'floor');
  for (const s of [-1, 1]) {
    add(g, rbox(0.022, H - 0.02, 0.58, 0.009, 2), m, s * 0.188, H / 2 - 0.01, 0, 0, 0, s * 0.03);
    add(g, rbox(0.4, H - 0.02, 0.022, 0.009, 2), m, 0, H / 2 - 0.01, s * 0.288, s * -0.03, 0, 0);
    add(g, rbox(0.03, 0.03, 0.62, 0.012, 2), m, s * 0.198, H - 0.012, 0);           // rim lip
    add(g, rbox(0.43, 0.03, 0.03, 0.012, 2), m, 0, H - 0.012, s * 0.298);
    add(g, rbox(0.13, 0.04, 0.02, 0.016, 2), slot, 0, H - 0.07, s * 0.302);        // handle cut-out
    for (const z of [-0.18, 0, 0.18]) add(g, rbox(0.012, H - 0.08, 0.025, 0.005, 1), m, s * 0.203, H / 2 - 0.02, z); // ribs
  }
  add(g, rbox(0.12, 0.06, 0.006, 0.004, 1), mat(0xf7f7f2), 0.1, H * 0.55, 0.305, 0, 0, 0, 'label');
  const parts = {};
  if (opts.lid) parts.lid = add(g, rbox(0.43, 0.025, 0.63, 0.012, 2), m, 0, H + 0.01, 0, 0, 0, 0, 'lid');
  if (opts.contents) { const c = grp(g, 'contents'); makeCarton(c, 0.16, 0.14, 0.2, -0.07, 0.025, -0.1, 2); makeCarton(c, 0.14, 0.18, 0.18, 0.08, 0.025, 0.12, 0); parts.contents = c; }
  return finish(g, parts, null, { variant: 'crate', size: { x: 0.43, y: H, z: 0.63 }, stackHeight: H + (opts.lid ? 0.023 : 0) });
}

/**
 * createPallet({variant:'pine'|'blueWood'|'steel', load:'cartons'|'totes'|'none', wrap:true, seed:1, maxHeight:1.25, toteColor})
 * Legacy: {boxes:true} == load:'cartons'. Pallet deck top at y=0.144. Load sits in userData.parts.load.
 */
export function createPallet(opts = {}) {
  const variant = opts.variant || 'pine', load = opts.load ?? (opts.boxes === false ? 'none' : 'cartons');
  const g = grp(null, 'pallet'), { geometry, material } = getPalletGeometry(variant);
  const base = add(g, geometry, material, 0, 0, 0, 0, 0, 0, 'palletBase');
  const parts = { base };
  if (load === 'cartons') {
    const L = grp(g, 'load', 0, PALLET.h, 0); const h = stackCartons(L, opts.seed ?? 1, opts.maxHeight ?? 1.336);
    if (opts.wrap !== false && h > 0.3) parts.wrap = addWrap(L, 1.0, h + 0.02, 1.2, 0);
    parts.load = L;
  } else if (load === 'totes') {
    const L = grp(g, 'load', 0, PALLET.h, 0), rows = Math.max(1, Math.floor((opts.maxHeight ?? 1.25) / 0.3));
    for (let l = 0; l < rows; l++) for (const x of [-0.25, 0.25]) for (const z of [-0.31, 0.31]) {
      const t = createCrateTote({ color: opts.toteColor || 'blue', lid: l === rows - 1 }); t.position.set(x, l * 0.3, z); L.add(t); }
    parts.load = L;
  }
  return finish(g, parts, null, { variant });
}
/** Instanced pallets: returns Group with InstancedMesh (userData.setMatrixAt/commit). */
/**
 * createPalletLoad({variant, palletType, height, seed, wrap})  real-scale unit loads on a 1.22 x 1.02 x 0.144 m pallet.
 *   variant: 'full'    cartons to `height` (default 1.5 m total incl. pallet), stretch-wrapped
 *            'half'    cartons to ~0.75 m total, wrapped
 *            'partial' uneven columns, missing cartons (picked-from pallet), not wrapped
 *            'cases'   loose stacked cases straight on the floor (no pallet), 3-4 layers
 *            'few'     2-6 loose cases on the floor (no pallet)
 *   palletType: 'pine' | 'blueWood' | 'steel'.   Origin: ground centre, +Z = pallet long (1.22 m, fork-entry) axis.
 * parts: base (pallet mesh, absent for cases/few), load, cartons ; userData: variant, palletType, height (m, total)
 */
export function createPalletLoad(opts = {}) {
  const variant = opts.variant || 'full', pt = opts.palletType || 'pine', r = rng(opts.seed ?? 3);
  if (variant === 'full' || variant === 'half') {
    const H = opts.height ?? (variant === 'full' ? 1.5 : 0.75);
    const g = createPallet({ variant: pt, load: 'cartons', seed: opts.seed ?? 3, maxHeight: H - PALLET.h - ((opts.wrap ?? true) ? 0.02 : 0), wrap: opts.wrap ?? true });
    g.name = 'palletLoad'; Object.assign(g.userData, { variant, palletType: pt, height: new THREE.Box3().setFromObject(g, true).max.y }); return g;
  }
  const g = grp(null, 'palletLoad'), P = {};
  const onPallet = variant === 'partial';
  if (onPallet) { const { geometry, material } = getPalletGeometry(pt); P.base = add(g, geometry, material, 0, 0, 0, 0, 0, 0, 'palletBase'); }
  const L = P.load = grp(g, 'load', 0, onPallet ? PALLET.h : 0, 0), C = P.cartons = grp(L, 'cartons');
  const cw = 0.5, cd = 0.4, ch = 0.26, tone = Math.floor(r() * 4);
  if (variant === 'partial') {
    const maxL = Math.max(1, Math.floor(((opts.height ?? 1.3) - PALLET.h) / ch));
    for (let i = 0; i < 2; i++) for (let k = 0; k < 3; k++) {
      const n = Math.floor(r() * (maxL + 1)); if (i === 0 && k === 0 && n === 0) continue;
      for (let l = 0; l < n; l++) makeCarton(C, cw - 0.012, ch - 0.004, cd - 0.012, -0.25 + i * cw, l * ch, -0.4 + k * cd, r() < 0.85 ? tone : 4, (r() - 0.5) * 0.04);
    }
  } else if (variant === 'cases') {
    const layers = Math.max(1, Math.min(6, Math.round((opts.height ?? 0.95) / ch)));
    for (let l = 0; l < layers; l++) for (let i = 0; i < 2; i++) for (let k = 0; k < 3; k++) {
      if (l === layers - 1 && r() < 0.35) continue;
      makeCarton(C, cw - 0.012, ch - 0.004, cd - 0.012, -0.25 + i * cw + (r() - 0.5) * 0.03, l * ch, -0.4 + k * cd + (r() - 0.5) * 0.03, r() < 0.8 ? tone : 4, (r() - 0.5) * 0.08);
    }
  } else { // few
    const n = 2 + Math.floor(r() * 5), spots = [[-0.25, 0, -0.4], [0.25, 0, -0.4], [-0.25, 0, 0], [0.25, 0, 0.05], [-0.25, ch, -0.4], [0.25, ch, -0.4]];
    for (let j = 0; j < n; j++) { const [x, y, z] = spots[j]; makeCarton(C, cw - 0.012, ch - 0.004, cd - 0.012, x + (r() - 0.5) * 0.06, y, z + (r() - 0.5) * 0.06, r() < 0.7 ? tone : 4, (r() - 0.5) * (y ? 0.25 : 0.5)); }
  }
  const out = finish(g, P, null, { variant, palletType: onPallet ? pt : null });
  out.userData.height = new THREE.Box3().setFromObject(out, true).max.y; return out;
}
/**
 * B31: rack loads as instanced case grids (one draw call per part for ALL loads, no solid blocks).
 * createRackLoadInstanced(count, {maxLayers=5, palletType='pine', seed}) -> Group with
 *   userData.setLoadAt(i, matrix4, layers=4)  pallet + 2x3 cartons per layer at a slot (matrix = slot pose, origin = pallet bottom centre)
 *   userData.hideLoad(i), userData.commit()  (call commit after a batch), userData.casesPerLoad(layers), userData.count
 * Cartons are 0.5 x 0.4 x 0.26 m (same as createPalletLoad), kraft tones via instanceColor, taped top; top layer randomly gapped.
 */
export function createRackLoadInstanced(count, opts = {}) {
  const maxL = opts.maxLayers ?? 5, per = 6 * maxL, r = rng(opts.seed ?? 11), cw = 0.488, ch = 0.256, cd = 0.388;
  const pal = getPalletGeometry(opts.palletType || 'pine');
  const boxG = rbox(cw, ch, cd, 0.02, 2), tapeG = rbox(0.07, 0.006, cd + 0.004, 0.002, 1);
  const g = instancedFrom([{ geometry: pal.geometry, material: pal.material }], count, 'rackLoads'), ud = g.userData, palIM = ud.meshes[0];
  const cases = new THREE.InstancedMesh(boxG, mat(0xffffff), count * per), tape = new THREE.InstancedMesh(tapeG, mat(PALETTE.tape, { roughness: 0.6 }), count * per);
  for (const im of [cases, tape]) { im.castShadow = im.receiveShadow = true; g.add(im); } cases.name = 'rackLoadCases'; tape.name = 'rackLoadTape';
  const tones = [0xc0915a, 0xb3834d, 0xd0a56e, 0xc89c66, 0xe6d5b8].map((h) => new THREE.Color(h)), Z = new THREE.Matrix4().makeScale(0, 0, 0), m = new THREE.Matrix4(), l = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
  for (let i = 0; i < count * per; i++) { cases.setMatrixAt(i, Z); tape.setMatrixAt(i, Z); cases.setColorAt(i, tones[Math.floor(r() * 4)]); }
  for (let i = 0; i < count; i++) palIM.setMatrixAt(i, Z);
  ud.meshes.push(cases, tape); ud.casesPerLoad = (layers) => 6 * Math.min(layers, maxL);
  ud.setLoadAt = (i, M, layers = 4) => { palIM.setMatrixAt(i, M); const L = Math.min(maxL, layers), tone = Math.floor(r() * 4);
    for (let k = 0; k < per; k++) { const j = i * per + k, lay = Math.floor(k / 6), c = k % 6, ix = c % 2, iz = Math.floor(c / 2);
      if (lay >= L || (lay === L - 1 && r() < 0.3)) { cases.setMatrixAt(j, Z); tape.setMatrixAt(j, Z); continue; }
      v.set(-0.25 + ix * 0.5 + (r() - 0.5) * 0.02, PALLET.h + lay * 0.26 + ch / 2, -0.4 + iz * 0.4 + (r() - 0.5) * 0.02); q.setFromEuler(e.set(0, (r() - 0.5) * 0.06, 0));
      l.compose(v, q, one); m.multiplyMatrices(M, l); cases.setMatrixAt(j, m); m.multiply(l.makeTranslation(0, ch / 2 + 0.001, 0)); tape.setMatrixAt(j, m);
      cases.setColorAt(j, tones[r() < 0.85 ? tone : 4]); } };
  ud.hideLoad = (i) => { palIM.setMatrixAt(i, Z); for (let k = 0; k < per; k++) { cases.setMatrixAt(i * per + k, Z); tape.setMatrixAt(i * per + k, Z); } };
  const baseCommit = ud.commit; ud.commit = () => { baseCommit(); if (cases.instanceColor) cases.instanceColor.needsUpdate = true; };
  return g;
}
export function createPalletInstanced(count, variant = 'pine') { const { geometry, material } = getPalletGeometry(variant); return instancedFrom([{ geometry, material }], count, 'pallets_' + variant); }

/* ------------------------------------------------------------------ helpers for wheels */
function wheelSet(parent, list) { // list: [{x,y,z,r,w,dual,side,hub,name}]
  return list.map((o) => { const wh = makeWheel(o.r, o.w, { side: o.side ?? Math.sign(o.x || 1), dual: o.dual, hubColor: o.hub, name: o.name }); wh.position.set(o.x, o.y ?? o.r, o.z); parent.add(wh); return wh; });
}
const spinWheels = (wheels, speed, dt) => { for (const w of wheels) w.rotation.x += (speed * dt) / w.userData.radius; };
/** Steerable wheels: a 'steerLeft'/'steerRight' group whose origin is the kingpin (inboard of the tyre by `inset`, at
 *  axle height) yawing about +Y; the spinning wheel is its child, offset outboard so its origin is the axle centre. */
function steerWheelSet(parent, list, inset = 0.1) {
  const steer = [], wheels = [];
  for (const o of list) { const side = Math.sign(o.x || 1), sg = grp(parent, side > 0 ? 'steerLeft' : 'steerRight', o.x - side * inset, o.r, o.z);
    const wh = makeWheel(o.r, o.w, { side, dual: o.dual, hubColor: o.hub, name: o.name }); wh.position.set(side * inset, 0, 0); sg.add(wh);
    add(sg, cyl(0.035, 0.035, Math.min(0.3, o.r * 0.7), 10), M.steel, 0, 0, 0, 0, 0, 0, 'kingpin');
    sg.userData.wheel = wh; steer.push(sg); wheels.push(wh); }
  return { steer, wheels };
}
/** Ackermann: each steer group gets its own angle so all wheel axes meet at one turn centre (ICR).
 *  cmd = bicycle-model angle (+ = turn left, toward +X). L = signed distance from the fixed axle to the steer axle. */
function applyAckermann(steerGroups, cmd, L, refZ, flip = 1) {
  if (Math.abs(cmd) < 1e-5) { for (const s of steerGroups) s.rotation.y = 0; return; }
  const R = Math.abs(L) / Math.tan(cmd);                                         // ICR x on the fixed axle line
  for (const s of steerGroups) { const x = s.position.x + (s.userData.wheel ? s.userData.wheel.position.x : 0); // steer-axis lateral position
    s.rotation.y = flip * Math.atan(Math.abs(L) / (R - x)); }
}
const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3();
/**
 * drive(model, dt, speed, steer)  simple kinematic driving for rigs exposing userData.kin
 * (semiTruck / forklift). Moves + yaws the model ROOT on the ground plane (root must sit in an unrotated/unscaled
 * parent, e.g. the scene), steers wheels (Ackermann), spins every wheel by distance/radius (per-wheel distance about
 * the turn centre, so inner/outer wheels differ) and, for the truck, articulates the trailer about the kingpin with a
 * tractrix (trailer axle is dragged toward the hitch).  speed m/s (+ forward along +Z), steer rad (+ = turn left).
 *   front-steer (truck): reference = drive-axle centre, yawRate = v*tan(steer)/L
 *   rear-steer (forklift): reference = front (drive) axle, rear wheels turn opposite to `steer`.
 */
export function drive(model, dt, speed, steer = 0) {
  const ud = model.userData, k = ud.kin; if (!k) { ud.setSpeed?.(speed); return; }
  steer = THREE.MathUtils.clamp(steer, -k.maxSteer, k.maxSteer); ud.setSteer(steer);
  if (ud.stepSteer) { ud.stepSteer(dt); steer = ud.steer; }                      // B25: wheels slew at steerRate; path follows the ACTUAL wheel angle
  const yaw0 = model.rotation.y, ds = speed * dt;
  const w = speed * Math.tan(steer) / k.L;                                        // yaw rate (rad/s)
  // reference point (fixed axle centre) moves along heading; root re-derived from it
  const ref = _v1.set(Math.sin(yaw0) * k.refZ, 0, Math.cos(yaw0) * k.refZ).add(model.position);
  const yaw1 = yaw0 + w * dt, ym = (yaw0 + yaw1) / 2;
  ref.x += Math.sin(ym) * ds; ref.z += Math.cos(ym) * ds;
  model.rotation.y = yaw1; model.position.set(ref.x - Math.sin(yaw1) * k.refZ, model.position.y, ref.z - Math.cos(yaw1) * k.refZ);
  // per-wheel rolling distance = |omega| * distance to ICR (falls back to ds when straight)
  const R = Math.abs(steer) < 1e-5 ? Infinity : k.L / Math.tan(steer);
  for (const wh of k.tractorWheels) { const p = wh.userData._kp; const d = R === Infinity ? ds : ds * Math.hypot(R - p.x, p.z - k.refZ) / Math.abs(R);
    wh.rotation.x += d / wh.userData.radius; }
  if (k.trailer) {                                                                 // tractrix articulation
    const tl = k.trailer, hitch = _v2.set(Math.sin(yaw1) * k.hitchZ, 0, Math.cos(yaw1) * k.hitchZ).add(model.position);
    if (!k.axle) { const a = yaw0 + tl.rotation.y; k.axle = new THREE.Vector3(hitch.x - Math.sin(a) * k.trailerL, 0, hitch.z - Math.cos(a) * k.trailerL); }
    const old = k.axle.clone(); let dx = hitch.x - k.axle.x, dz = hitch.z - k.axle.z; const n = Math.hypot(dx, dz) || 1;
    k.axle.set(hitch.x - dx / n * k.trailerL, 0, hitch.z - dz / n * k.trailerL);
    const trYaw = Math.atan2(dx, dz); let rel = trYaw - yaw1; rel = Math.atan2(Math.sin(rel), Math.cos(rel));
    ud.setTrailerAngle(THREE.MathUtils.clamp(rel, -k.maxArt, k.maxArt), true);
    const dTr = Math.sign(speed) * old.distanceTo(k.axle); for (const wh of k.trailerWheels) wh.rotation.x += dTr / wh.userData.radius;
  }
  if (k.chain) {                                                                   // cart train: tractrix per cart, pin-to-pin
    let hx = model.position.x + Math.sin(yaw1) * k.hitchZ, hz = model.position.z + Math.cos(yaw1) * k.hitchZ, pyaw = yaw1;
    for (const c of k.chain) {
      if (!c.axle) { const a0 = pyaw + c.pivot.rotation.y; c.axle = new THREE.Vector3(hx - Math.sin(a0) * c.L, 0, hz - Math.cos(a0) * c.L); }
      const ox = c.axle.x, oz = c.axle.z; let dx = hx - ox, dz = hz - oz; const n = Math.hypot(dx, dz) || 1;
      c.axle.set(hx - dx / n * c.L, 0, hz - dz / n * c.L); const cy = Math.atan2(dx, dz);
      let rel = cy - pyaw; rel = Math.atan2(Math.sin(rel), Math.cos(rel)); c.pivot.rotation.y = THREE.MathUtils.clamp(rel, -1.4, 1.4);
      const dd = Math.sign(speed) * Math.hypot(c.axle.x - ox, c.axle.z - oz); for (const w of c.axleWheels) w.rotation.x += dd / w.userData.radius;
      pyaw = pyaw + c.pivot.rotation.y; hx -= Math.sin(pyaw) * c.rear; hz -= Math.cos(pyaw) * c.rear;
    }
  }
  ud.speed = speed; ud._driven = true;
}
function kinWheels(g, wheels) { g.updateMatrixWorld(true); const inv = g.matrixWorld.clone().invert();
  for (const w of wheels) w.userData._kp = w.getWorldPosition(new THREE.Vector3()).applyMatrix4(inv); return wheels; }

/* ------------------------------------------------------------------ reach truck */
/**
 * createReachTruck({load:false, autoLift:true, reach})  stand-up narrow-aisle reach truck (Raymond/Crown style).
 * Triplex mast (2.9 m lowered, 6.5 m fork height) on the chassis nose; pantograph (scissor) reach moves the carriage
 * 0..0.6 m forward between the outriggers; operator compartment at the rear (side-stance) under an overhead guard.
 * Rear drive/steer wheel (rear-steer, fixed load-wheel axle in the outrigger noses). Forks 1.07 m toward +Z.
 * parts: chassis, mast/outerMast, innerMast, innerMast2, reach, pantograph, carriage, forks[], outriggers[],
 *        loadWheels[], steer[], driveWheel, casters[], overheadGuard, compartment
 * userData: setForkHeight(h, snap), setReach(0..1, snap), setSteer(rad, snap), setSpeed, setLoad, kin, maxForkHeight 9.2 (triplex)
 */
export function createReachTruck(opts = {}) {
  const g = grp(null, 'reachTruck'), P = { outriggers: [], loadWheels: [], casters: [] };
  const Y = mat(PALETTE.spark), K = M.charcoal, D = M.dark, Gr = mat(0x5a6372);
  const ch = P.chassis = grp(g, 'chassis');
  // power unit / battery box (rear) + nose that carries the mast
  add(ch, rbox(1.22, 0.95, 0.55, 0.12), Y, 0, 0.56, -0.36, 0, 0, 0, 'powerUnit');          // battery / drive cabinet
  add(ch, rbox(1.24, 0.12, 0.57, 0.05), K, 0, 0.1, -0.36, 0, 0, 0, 'bumperSkirt');
  add(ch, rbox(1.22, 0.22, 0.62, 0.06), K, 0, 0.13, -0.93, 0, 0, 0, 'compartmentBase');    // drive unit housing under the floor
  add(ch, rbox(0.08, 0.85, 0.62, 0.03), Y, -0.57, 0.66, -0.93, 0, 0, 0, 'compartmentWall');
  add(ch, rbox(1.22, 0.5, 0.07, 0.03), Y, 0, 0.48, -1.205, 0, 0, 0, 'rearWall');
  add(ch, rbox(1.0, 0.5, 0.36, 0.08), K, 0, 0.33, 0.05, 0, 0, 0, 'nose');
  add(ch, rbox(0.9, 0.03, 0.4, 0.012), mat(0x1c2028, { roughness: 0.9 }), 0.0, 1.045, -0.36, 0, 0, 0, 'batteryLid');
  decal(ch, sparkTex(), 0.3, 0.3, 0.612, 0.62, -0.36, Math.PI / 2, 'sideSpark'); decal(ch, sparkTex(), 0.3, 0.3, -0.612, 0.62, -0.36, -Math.PI / 2);
  // outriggers (base legs) with load wheels in the noses
  for (const s of [-1, 1]) {
    const o = add(ch, rbox(0.13, 0.2, 1.5, 0.04), K, s * 0.57, 0.17, 0.62, 0, 0, 0, 'outrigger'); P.outriggers.push(o);
    add(ch, rbox(0.135, 0.06, 0.25, 0.02), Y, s * 0.57, 0.3, 1.25, 0, 0, 0, 'outriggerToe');
  }
  P.loadWheels = wheelSet(ch, [-1, 1].map((s) => ({ x: s * 0.57, z: 1.2, r: 0.075, w: 0.1, hub: 0x8a94a3, name: 'loadWheel' })));
  // rear drive/steer unit (offset to one side) + castor on the other
  const sd = grp(ch, 'steerDrive', 0.25, 0.17, -0.95); const dw = makeWheel(0.17, 0.14, { side: 1, hubColor: 0x8a94a3, name: 'driveWheel' }); sd.add(dw);
  add(sd, cyl(0.035, 0.035, 0.12, 10), M.steel, 0, 0.12, 0, 0, 0, 0, 'kingpin'); sd.userData.wheel = null; P.driveWheel = dw; P.steer = [sd];
  const cs = grp(ch, 'caster', -0.36, 0.09, -1.0); const cw = makeWheel(0.06, 0.06, { side: -1, name: 'casterWheel' }); cw.position.set(0, -0.03, -0.035); cs.add(cw);
  add(cs, rbox(0.1, 0.1, 0.06, 0.02), M.steel, 0, 0.03, 0, 0, 0, 0, 'casterFork'); P.casters.push(cs);
  // operator compartment (rear-left, side stance) + overhead guard
  const cp = P.compartment = grp(ch, 'compartment', 0, 0, -0.93);                  // side-stance operator bay
  add(cp, rbox(1.0, 0.03, 0.5, 0.012), mat(0x1c2028, { roughness: 0.95 }), 0.04, 0.255, 0, 0, 0, 0, 'floorMat');
  add(cp, rbox(0.5, 0.14, 0.3, 0.05), K, 0.25, 1.12, 0.2, -0.25, 0, 0, 'controlConsole');
  add(cp, roundCyl(0.035, 0.12, 0.01, 12), M.red, 0.3, 1.24, 0.22, 0, 0, 0, 'multiTask');
  add(cp, rbox(0.42, 0.4, 0.08, 0.05), mat(0x1c2028), 0, 1.15, -0.2, 0, 0, 0, 'backPad');
  add(cp, rbox(0.06, 0.3, 0.34, 0.03), mat(0x1c2028), -0.5, 1.2, 0, 0, 0, 0, 'sidePad');
  const og = P.overheadGuard = grp(cp, 'overheadGuard');
  for (const [x, z] of [[-0.58, -0.25], [0.58, -0.25], [-0.58, 0.95], [0.58, 0.95]]) add(og, rbox(0.06, 2.06, 0.06, 0.02), K, x, 1.33, z, 0, 0, 0, 'guardPost');
  add(og, rbox(1.24, 0.06, 1.3, 0.03), K, 0, 2.36, 0.35, 0, 0, 0, 'guardFrame');
  for (let i = 0; i < 5; i++) add(og, rbox(0.04, 0.04, 1.22, 0.012), K, -0.5 + i * 0.25, 2.4, 0.35);
  const bc = makeBeacon(PALETTE.amber, 1.0); bc.position.set(0.45, 2.39, -0.15); og.add(bc); P.beacon = bc;
  // B29 side-stance operator: stands facing +X (back to the side pad), right hand on the steer knob, left on the multi-task lever
  add(cp, cyl(0.02, 0.02, 0.94, 8), K, 0.2, 0.77, -0.1, 0, 0, 0, 'steerColumn');
  const knobA = grp(cp, 'anchorSteerKnob', 0.2, 1.24, -0.1); add(knobA, roundCyl(0.05, 0.03, 0.008, 16), M.dark, 0, 0, 0, 0, 0, 0, 'steerKnob');
  const standA = grp(cp, 'anchorStand', -0.05, 0.27, 0.02); standA.rotation.y = Math.PI / 2; const mtA = grp(cp, 'anchorMultiTask', 0.26, 1.32, 0.17);
  // triplex mast on the nose
  const mast = makeMast({ H0: 4.0, half: 0.36, maxH: opts.maxForkHeight ?? 9.2, backrest: 1.2, forkSpread: 0.25, drop: 0.012 }); // B19: triplex, 9.2 m lift (RES beams 7.00 / 8.75)
  mast.root.position.set(0, 0.12, 0.3); ch.add(mast.root);
  P.mast = P.outerMast = mast.root; P.innerMast = mast.inner; P.innerStages = mast.inners;
  // pantograph reach between innermost stage and the carriage
  const top = mast.inners[mast.inners.length - 1], car = P.carriage = P.forks = mast.carriage, cz0 = car.position.z;
  const reach = P.reach = grp(top, 'reach', 0, 0, 0); reach.add(car);
  const pg = P.pantograph = grp(top, 'pantograph', 0, 0, 0.04), LL = 0.75, links = [];
  for (const s of [-1, 1]) for (const k of [-1, 1]) links.push(add(pg, rbox(0.035, 0.05, LL, 0.015), mat(0x3d4552), s * 0.2 + k * 0.02, 0, 0, 0, 0, 0, 'scissorLink'));
  const pinM = M.steel; const pins = [0, 1, 2, 3].map(() => add(pg, roundCyl(0.03, 0.46, 0.008, 12, 'x'), pinM, 0, 0, 0, 0, 0, 0, 'scissorPin'));
  const loadG = createPallet({ variant: 'pine', seed: 12, maxHeight: 1.0 }); loadG.position.set(0, LOAD_SEAT_Y, 0.64); car.add(loadG); P.load = loadG; loadG.visible = !!opts.load;
  const ud = { autoLift: opts.autoLift ?? true, speed: 0, steer: 0, reach: opts.reach ?? 0, reachT: opts.reach ?? 0, maxForkHeight: mast.maxH };
  const REACH = 0.6, dMin = 0.12;
  const applyReach = () => {
    const d = dMin + ud.reach * REACH, a = Math.sqrt(Math.max(1e-4, LL * LL - d * d)) / 2, ang = Math.atan2(2 * a, d);
    reach.position.z = ud.reach * REACH; const yc = car.position.y + 0.3; pg.position.y = yc;
    links.forEach((l, i) => { const up = i % 2 ? 1 : -1; l.position.set(l.position.x, 0, d / 2); l.rotation.x = up * ang; });
    pins[0].position.set(0, a, 0); pins[1].position.set(0, -a, 0); pins[2].position.set(0, a, d); pins[3].position.set(0, -a, d);
  };
  // carriage hangs from the pantograph nose: plate back face on the nose pins
  car.position.z = cz0 + dMin + 0.04; applyReach();
  ud.setForkHeight = (h, snap = false) => { ud.autoLift = false; mast.set(h); if (snap) { mast.snap(); applyReach(); } };
  ud.getForkHeight = () => mast.st.h;
  ud.setReach = (v, snap = false) => { ud.reachT = THREE.MathUtils.clamp(v, 0, 1); if (snap) { ud.reach = ud.reachT; applyReach(); } };
  ud.setSpeed = (v) => { ud.speed = v; }; ud.setLoad = (v) => { loadG.visible = !!v; mast.st.minH = v ? LOAD_MIN_H : 0; if (mast.st.target < mast.st.minH) { mast.set(mast.st.minH); mast.snap(); } };
  const WB = 1.2 - -0.95;                                                         // load-wheel axle -> drive wheel
  P.wheels = [...P.loadWheels, dw];
  ud.rearSteer = true; ud.steerRate = 1.5; ud.setSteer = (r) => { ud.steer = THREE.MathUtils.clamp(r, -1.3, 1.3); applyAckermann(P.steer, ud.steer, WB, 1.2, -1); cs.rotation.y = -ud.steer * 0.6; };
  ud.kin = { refZ: 1.2, L: WB, maxSteer: 1.3, tractorWheels: kinWheels(g, P.wheels) };
  ud.operatorCfg = { anchor: standA, grip: [knobA, mtA], pose: 'standing', auto: opts.operator, anchors: { stand: standA, steerKnob: knobA, multiTask: mtA } };
  addForkApi(g, ud, mast); if (!ud.getForkHeight) ud.getForkHeight = () => mast.st.h; if (ud.setLoad) ud.setLoad(!!opts.load);
  return finish(g, P, (dt, t) => {
    if (ud.autoLift) autoCycle(ud, mast, 5.0, dt, (top) => { ud.reachT = top ? 1 : 0; });
    mast.step(dt); ud.reach = damp(ud.reach, ud.reachT, 3, dt); applyReach();
    if (!ud._driven) spinWheels(P.wheels, ud.speed, dt); ud._driven = false; bc.userData.mat.emissiveIntensity = flash(t, 1.7);
  }, ud);
}

/* ------------------------------------------------------------------ tug + cart train */
/**
 * createTugTrain({carts:3, load:true})  electric tow tractor pulling linked 4-wheel carts.
 * Tug: front Ackermann steer, rear drive axle, rear tow hitch. Each cart is a rigid trailer whose pivot node
 * ('cartHitch1'..) sits exactly on the hitch pin of the unit in front (yaw relative to it); fixed rear axle,
 * swivel castors up front that trail their own velocity. drive() articulates the chain with a tractrix per cart.
 * parts: tug, steer[], wheels[], carts[{pivot, body, axleWheels, casters}], hitches[]
 */
export function createTugTrain(opts = {}) {
  const g = grp(null, 'tugTrain'), P = { carts: [], hitches: [] }, B = M.blue, N = M.navy, K = M.charcoal, Y = M.yellow;
  const tug = P.tug = grp(g, 'tug');
  add(tug, rbox(1.0, 0.55, 1.75, 0.12), B, 0, 0.5, 0.0, 0, 0, 0, 'tugBody');
  add(tug, rbox(1.02, 0.1, 1.77, 0.04), N, 0, 0.2, 0.0, 0, 0, 0, 'tugSkirt');
  add(tug, rbox(0.9, 0.42, 0.55, 0.12), B, 0, 0.96, 0.55, -0.15, 0, 0, 'hoodCowl');
  add(tug, rbox(0.82, 0.06, 0.04, 0.02), Y, 0, 0.62, 0.888, 0, 0, 0, 'frontStripe');
  for (const s of [-1, 1]) add(tug, rbox(0.14, 0.08, 0.04, 0.03), glowMat(0xfff4d6, 0.9), s * 0.33, 0.55, 0.885, 0, 0, 0, 'headlight');
  add(tug, rbox(0.52, 0.12, 0.45, 0.05), mat(0x1c2028), 0, 0.86, -0.42, 0, 0, 0, 'seat');
  add(tug, rbox(0.52, 0.45, 0.1, 0.05), mat(0x1c2028), 0, 1.12, -0.66, -0.12, 0, 0, 'seatBack');
  const sw = P.steeringWheel = grp(tug, 'steeringWheel', 0, 1.22, 0.3); sw.rotation.x = -0.9;
  add(sw, torus(0.15, 0.018, 8, 24), K, 0, 0, 0, 0, 0, 0, 'wheelRim'); add(tug, cyl(0.025, 0.025, 0.4, 8), K, 0, 1.06, 0.38, 0.65);
  for (const [x, z] of [[-0.46, -0.78], [0.46, -0.78], [-0.46, 0.62], [0.46, 0.62]]) add(tug, rbox(0.05, 1.3, 0.05, 0.02), K, x, 1.4, z, z > 0 ? -0.06 : 0, 0, 0, 'guardPost');
  add(tug, rbox(1.0, 0.05, 1.52, 0.02), K, 0, 2.06, -0.05, 0, 0, 0, 'guardRoof');
  decal(tug, sparkTex(), 0.3, 0.3, 0.502, 0.52, 0.2, Math.PI / 2, 'tugSpark'); decal(tug, sparkTex(), 0.3, 0.3, -0.502, 0.52, 0.2, -Math.PI / 2);
  const bc = makeBeacon(PALETTE.amber, 1.0); bc.position.set(0, 2.085, -0.6); tug.add(bc); P.beacon = bc;
  const fs = steerWheelSet(tug, [-1, 1].map((s) => ({ x: s * 0.44, z: 0.6, r: 0.2, w: 0.14, name: 'wheelFront' })), 0.06);
  const rw = wheelSet(tug, [-1, 1].map((s) => ({ x: s * 0.44, z: -0.55, r: 0.22, w: 0.16, name: 'wheelRear' })));
  P.steer = fs.steer; P.wheels = [...fs.wheels, ...rw];
  const HY = 0.36; add(tug, rbox(0.2, 0.08, 0.3, 0.02), K, 0, HY - 0.06, -0.98, 0, 0, 0, 'hitchPlate');
  add(tug, cyl(0.02, 0.02, 0.14, 10), M.steel, 0, HY, -1.05, 0, 0, 0, 'hitchPin');
  // carts
  const nC = opts.carts ?? 3, HZ = 1.25, RZ = -0.95, AX = -0.35;             // body-local: hitch pin z, rear hitch z, fixed axle z
  let parent = tug, pz = -1.05; const deckM = mat(0x9aa3ad, { roughness: 0.8 }), frM = mat(0x3d4552);
  for (let i = 0; i < nC; i++) {
    const pv = grp(parent, 'cartHitch' + (i + 1), 0, i === 0 ? HY : 0, pz), body = grp(pv, 'cartBody', 0, -HY, -HZ);
    add(body, rbox(1.0, 0.06, 1.6, 0.02), deckM, 0, 0.42, 0, 0, 0, 0, 'cartDeck');
    for (const s of [-1, 1]) { add(body, rbox(0.06, 0.1, 1.6, 0.02), frM, s * 0.5, 0.36, 0, 0, 0, 0, 'cartRail');
      add(body, rbox(0.04, 0.5, 0.04, 0.012), frM, s * 0.48, 0.7, 0.78, 0, 0, 0, 'cartPost'); add(body, rbox(0.04, 0.5, 0.04, 0.012), frM, s * 0.48, 0.7, -0.78); }
    add(body, rbox(1.0, 0.04, 0.04, 0.012), frM, 0, 0.95, 0.78, 0, 0, 0, 'cartTopRail'); add(body, rbox(1.0, 0.04, 0.04, 0.012), frM, 0, 0.95, -0.78);
    add(body, rbox(0.12, 0.05, HZ - 0.8, 0.015), K, 0, HY, 0.8 + (HZ - 0.8) / 2, 0, 0, 0, 'drawbar');
    add(body, roundCyl(0.05, 0.03, 0.008, 14), M.steel, 0, HY, HZ, 0, 0, 0, 'drawbarEye');
    add(body, rbox(0.18, 0.06, 0.2, 0.02), K, 0, HY - 0.05, RZ + 0.08, 0, 0, 0, 'rearHitch'); add(body, cyl(0.02, 0.02, 0.14, 10), M.steel, 0, HY, RZ, 0, 0, 0, 'hitchPin');
    const axleWheels = wheelSet(body, [-1, 1].map((s) => ({ x: s * 0.43, z: AX, r: 0.13, w: 0.08, hub: 0x8a94a3, name: 'cartWheel' })));
    add(body, rbox(0.8, 0.06, 0.06, 0.02), M.steel, 0, 0.13, AX, 0, 0, 0, 'cartAxle');
    const casters = [-1, 1].map((s) => { const c = grp(body, 'cartCaster', s * 0.38, 0.32, 0.55); add(c, rbox(0.08, 0.06, 0.08, 0.015), M.steel, 0, 0.06, 0, 0, 0, 0, 'casterPlate');
      add(c, rbox(0.07, 0.2, 0.03, 0.01), M.steel, 0, -0.08, -0.03); const w = makeWheel(0.1, 0.06, { side: s, name: 'casterWheel' }); w.position.set(0, -0.22, -0.05); c.add(w); return c; });
    if (opts.load !== false) { const L = grp(body, 'cartLoad', 0, 0.45, 0); stackCartons(L, 30 + i, 0.4 + (i % 2) * 0.25, 0.95, 1.5); }
    P.carts.push({ pivot: pv, body, axleWheels, casters }); P.hitches.push(pv);
    parent = pv; pz = RZ - HZ;                                                      // next pin, in this pivot's frame
  }
  const ud = { speed: opts.speed ?? 0, steer: 0 };
  ud.rearSteer = false; ud.steerRate = 1.5; ud.setSteer = (r) => { ud.steer = THREE.MathUtils.clamp(r, -0.6, 0.6); applyAckermann(P.steer, ud.steer, 1.15, -0.55); sw.rotation.z = ud.steer * 3; };
  const seatT = grp(tug, 'anchorSeat', 0, 0.92, -0.34), swA = grp(tug, 'anchorSteerGrip', 0, 1.22, 0.3); swA.rotation.x = -0.9;   // B29 seated driver
  ud.operatorCfg = { anchor: seatT, grip: swA, spread: 0.13, pose: 'seated', lean: 0.4, auto: opts.operator, anchors: { seat: seatT, steerGrip: swA } };
  ud.setSpeed = (v) => { ud.speed = v; };
  ud.kin = { refZ: -0.55, L: 1.15, maxSteer: 0.6, tractorWheels: kinWheels(g, P.wheels), chain: P.carts.map((c, i) => ({ ...c, L: HZ - AX, rear: HZ - RZ, first: i === 0 })), hitchZ: -1.05 };
  const _p = new THREE.Vector3(), _q = new THREE.Vector3(), _m = new THREE.Matrix4();
  ud._casterUpdate = (dt) => {                                                      // castors trail their own velocity
    for (const c of P.carts) for (const cs of c.casters) { cs.updateWorldMatrix(true, false); const wp = _p.setFromMatrixPosition(cs.matrixWorld);
      if (cs.userData.prev) { const dv = _q.copy(wp).sub(cs.userData.prev); const dist = dv.length();
        if (dist > 1e-5) { _m.copy(cs.parent.matrixWorld).invert(); dv.transformDirection(_m); const want = Math.atan2(dv.x, dv.z);
          let d = want - cs.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); cs.rotation.y += d * Math.min(1, dt * 8); cs.children[2].rotation.x += dist / 0.1; } }
      (cs.userData.prev ||= new THREE.Vector3()).copy(wp); }
  };
  return finish(g, P, (dt, t) => { if (!ud._driven) spinWheels(P.wheels, ud.speed, dt); ud._driven = false; ud._casterUpdate(dt); bc.userData.mat.emissiveIntensity = flash(t, 1.5); }, ud);
}

/* ------------------------------------------------------------------ semi truck */
/**
 * Rig: steer[] (kingpin pivots, setSteer(rad, + = left, Ackermann)), trailer (pivot = kingpin, setTrailerAngle(rad)),
 *   landingGear (setLandingGear(0 raised..1 down)), kin (for drive()).
 * createSemiTruck({speed:0})  Blue Walmart day-cab/sleeper + white 53' trailer. ~22 m long, 2.6 m wide, 4.15 m tall.
 * parts: tractor, trailer, cab, wheels[], frontWheels[], driveWheels[], trailerWheels[], headlights[], tailLights[],
 *        markerLights[], beacon (amber cab roof), rearDoors{left,right}, logoLeft, logoRight
 * userData: speed (m/s, drives wheel spin), setSpeed(v), setHazards(bool), setBraking(bool)
 */
export function createSemiTruck(opts = {}) {
  const g = grp(null, 'semiTruck'), P = { headlights: [], tailLights: [], markerLights: [] };
  const tr = P.tractor = grp(g, 'tractor'), cab = P.cab = grp(tr, 'cab');
  const blue = M.blue, navy = M.navy, chrome = mat(0xd5dbe2, { roughness: 0.45 }), grille = mat(0x2a313c);
  // chassis
  for (const s of [-1, 1]) add(tr, rbox(0.2, 0.3, 7.2, 0.06), navy, s * 0.45, 0.78, 7.1);
  add(tr, rbox(2.5, 0.42, 0.38, 0.16), chrome, 0, 0.62, 10.98, 0, 0, 0, 'bumper');
  // hood + fenders + grille + lights
  add(cab, rbox(2.25, 1.05, 2.05, 0.32), blue, 0, 1.56, 9.95, 0.05, 0, 0, 'hood');
  for (const s of [-1, 1]) add(cab, rbox(0.46, 0.2, 1.35, 0.09), blue, s * 1.05, 1.14, 9.75);
  add(cab, rbox(1.5, 1.0, 0.07, 0.04), chrome, 0, 1.52, 10.96, 0.05);
  add(cab, rbox(1.32, 0.84, 0.08, 0.04), grille, 0, 1.52, 10.98, 0.05, 0, 0, 'grille');
  for (let i = 0; i < 6; i++) add(cab, rbox(1.2, 0.045, 0.05, 0.02, 2), chrome, 0, 1.2 + i * 0.13, 11.02 - i * 0.006, 0.05);
  const hl = glowMat(0xfff4d6, 0.9);
  for (const s of [-1, 1]) { P.headlights.push(add(cab, rbox(0.34, 0.2, 0.08, 0.05), hl, s * 0.86, 1.22, 10.96, 0, 0, 0, 'headlight'));
    add(cab, rbox(0.12, 0.08, 0.05, 0.03), glowMat(PALETTE.amber, 0.7), s * 1.0, 0.9, 11.15); }
  decal(cab, sparkTex(), 0.32, 0.32, 0, 2.07, 10.72, 0, 'hoodSpark').rotation.x = -0.55;
  // cab
  // B29: cab shell is open inside (lower tub, dash, side walls, roof) so the driver shows through the clear windshield
  add(cab, rbox(2.45, 0.42, 2.0, 0.2), blue, 0, 1.41, 7.95, 0, 0, 0, 'cabBody');
  add(cab, rbox(2.45, 0.78, 0.14, 0.06), blue, 0, 1.98, 8.88, 0, 0, 0, 'cabFront');
  for (const s of [-1, 1]) { add(cab, rbox(0.1, 1.42, 2.0, 0.05), blue, s * 1.175, 2.3, 7.95, 0, 0, 0, 'cabSide'); add(cab, rbox(0.14, 0.82, 0.12, 0.04), blue, s * 1.12, 2.72, 8.9, -0.06, 0, 0, 'aPillar'); }
  add(cab, rbox(2.45, 0.22, 2.0, 0.12), blue, 0, 3.09, 7.95, 0, 0, 0, 'cabRoof');
  add(cab, rbox(2.25, 0.05, 1.9, 0.02), M.dark, 0, 1.63, 7.95, 0, 0, 0, 'cabFloor');
  add(cab, rbox(2.2, 0.22, 0.4, 0.08), M.dark, 0, 2.3, 8.66, 0, 0, 0, 'dash');
  for (const x of [0.55, -0.55]) { const st = grp(cab, x > 0 ? 'driverSeat' : 'passengerSeat', x, 0, 7.9);
    add(st, rbox(0.5, 0.12, 0.5, 0.05), M.dark, 0, 1.89, 0); add(st, rbox(0.5, 0.7, 0.12, 0.05), M.dark, 0, 2.3, -0.3, -0.12); add(st, rbox(0.16, 0.24, 0.14, 0.05), M.dark, 0, 1.75, 0); }
  const swS = P.steeringWheel = grp(cab, 'steeringWheel', 0.55, 2.42, 8.45); swS.rotation.x = -1.2;
  add(swS, torus(0.21, 0.025, 8, 28), M.dark, 0, 0, 0, 0, 0, 0, 'wheelRim'); add(cab, cyl(0.03, 0.03, 0.4, 8), M.dark, 0.55, 2.33, 8.6, 0.35, 0, 0, 'steerColumn');
  const seatS = grp(cab, 'anchorSeat', 0.55, 1.95, 7.88), swSA = grp(cab, 'anchorSteerGrip', 0.55, 2.42, 8.45); swSA.rotation.x = -1.2;
  clearGlass(add(cab, rbox(2.1, 0.78, 0.06, 0.06), M.glassClear, 0, 2.72, 8.95, -0.06, 0, 0, 'windshield'));
  add(cab, rbox(0.06, 0.82, 0.06, 0.02), blue, 0, 2.72, 8.98, -0.06);
  for (const s of [-1, 1]) {
    clearGlass(add(cab, rbox(0.06, 0.66, 0.95, 0.06), M.glassClear, s * 1.225, 2.7, 8.35, 0, 0, 0, 'sideWindow'));
    add(cab, rbox(0.03, 1.55, 0.03, 0.01), navy, s * 1.235, 2.05, 7.72);                    // door seam
    add(cab, rbox(0.05, 0.05, 0.2, 0.02), chrome, s * 1.25, 2.0, 7.95, 0, 0, 0, 'doorHandle');
    decal(cab, sparkTex(), 0.5, 0.5, s * 1.232, 1.62, 8.32, s * Math.PI / 2, 'doorSpark');                 // B11: spark + wordmark on both doors
    decal(cab, cabWordmarkTex(), 0.96, 0.24, s * 1.232, 2.1, 8.32, s * Math.PI / 2, 'doorWordmark');
    decal(cab, cabWordmarkTex(), 1.36, 0.34, s * 1.232, 2.95, 6.2, s * Math.PI / 2, 'cabWordmark');       // Walmart livery on sleeper side
    add(cab, rbox(0.012, 0.05, 3.1, 0.006), M.yellow, s * 1.229, 2.22, 7.15, 0, 0, 0, 'sparkPinstripe');
    // mirrors
    add(cab, rbox(0.34, 0.04, 0.04, 0.015), chrome, s * 1.38, 2.55, 8.92);
    add(cab, rbox(0.08, 0.48, 0.22, 0.04), M.charcoal, s * 1.56, 2.6, 8.92, 0, 0, 0, 'mirror');
    add(cab, rbox(0.12, 0.1, 0.1, 0.04), M.charcoal, s * 1.15, 2.08, 10.7);                  // hood mirror
    // steps + fuel tank
    add(tr, roundCyl(0.32, 1.25, 0.08, 24, 'z'), chrome, s * 1.02, 0.72, 7.75, 0, 0, 0, 'fuelTank');
    for (const zz of [7.25, 8.25]) add(tr, rbox(0.16, 0.66, 0.06, 0.02), M.charcoal, s * 1.02, 0.72, zz);
    // exhaust stacks
    add(tr, cyl(0.085, 0.085, 2.4, 16), chrome, s * 1.33, 2.85, 5.55, 0, 0, 0, 'exhaust');
    add(tr, cyl(0.11, 0.11, 0.6, 16), mat(0x9aa3ae, { roughness: 0.6 }), s * 1.33, 2.2, 5.55);
    // fenders over drive axles + mudflaps
    add(tr, rbox(0.72, 0.08, 2.5, 0.03), mat(0x9aa3ae, { roughness: 0.6 }), s * 0.98, 1.12, 4.95);
    add(tr, rbox(0.62, 0.62, 0.04, 0.02), M.dark, s * 0.98, 0.58, 3.62, 0, 0, 0, 'mudflap');
  }
  // sleeper + roof fairing
  add(cab, rbox(2.45, 2.5, 1.62, 0.26), blue, 0, 2.45, 6.15, 0, 0, 0, 'sleeper');
  add(cab, rbox(2.36, 0.6, 1.6, 0.26), blue, 0, 3.37, 7.62, 0.3, 0, 0, 'fairing');
  add(cab, rbox(2.46, 0.14, 3.6, 0.06), navy, 0, 1.24, 7.15);                                 // rocker panel
  const amber = glowMat(PALETTE.amber, 0.8);
  for (let i = 0; i < 5; i++) P.markerLights.push(add(cab, rbox(0.12, 0.06, 0.08, 0.025), amber, -0.5 + i * 0.25, 3.25, 8.85, 0, 0, 0, 'markerLight'));
  const bc = makeBeacon(PALETTE.amber, 1.4); bc.position.set(0, 3.7, 6.1); cab.add(bc); P.beacon = bc;
  add(tr, rbox(1.2, 0.12, 1.1, 0.04), M.charcoal, 0, 1.1, 4.9, 0, 0, 0, 'fifthWheel');
  const fs = steerWheelSet(tr, [-1, 1].map((s) => ({ x: s * 1.05, z: 9.75, r: 0.52, w: 0.3, name: 'wheelFront' })), 0.12);
  P.frontWheels = fs.wheels; P.steer = fs.steer;
  for (const s of [-1, 1]) add(tr, rbox(0.12, 0.14, 0.9, 0.04), navy, s * 0.45, 0.6, 9.75, 0, 0, 0, 'frontAxleBeam');
  add(tr, rbox(1.7, 0.12, 0.14, 0.05), navy, 0, 0.52, 9.75, 0, 0, 0, 'frontAxle');
  P.driveWheels = wheelSet(tr, [5.6, 4.3].flatMap((z) => [-1, 1].map((s) => ({ x: s * 0.95, z, r: 0.52, w: 0.28, dual: true, name: 'wheelDrive' }))));
  // trailer
  // trailer: node origin = kingpin on the fifth-wheel plate (yaw about +Y relative to the tractor)
  const KP = { y: 1.16, z: 4.9 };
  const tlPivot = P.trailer = grp(g, 'trailer', 0, KP.y, KP.z), tl = P.trailerBody = grp(tlPivot, 'trailerBody', 0, -KP.y, -KP.z);
  add(tlPivot, cyl(0.045, 0.045, 0.1, 12), M.steel, 0, 0.05, 0, 0, 0, 0, 'kingpinPin');
  add(tlPivot, rbox(1.3, 0.06, 1.3, 0.02), M.charcoal, 0, 0.13, 0, 0, 0, 0, 'upperCoupler');
  const white = M.white, rail = mat(0xb8c0ca, { roughness: 0.7 });
  add(tl, rbox(2.6, 2.8, 16.1, 0.12), white, 0, 2.75, -2.75, 0, 0, 0, 'trailerBox');
  add(tl, rbox(2.64, 0.16, 16.12, 0.05), rail, 0, 1.4, -2.75);
  add(tl, rbox(2.62, 0.08, 16.12, 0.04), rail, 0, 4.12, -2.75);
  for (let i = 0; i < 24; i++) add(tl, rbox(1.9, 0.12, 0.08, 0.02), M.charcoal, 0, 1.27, 4.9 - i * 0.62);   // crossmembers
  for (const s of [-1, 1]) {
    add(tl, rbox(0.04, 0.62, 6.4, 0.02), mat(0xdfe3e8), s * 1.24, 0.98, -2.6, 0, 0, 0, 'sideSkirt');
    for (let i = 0; i < 5; i++) P.markerLights.push(add(tl, rbox(0.03, 0.06, 0.1, 0.01), amber, s * 1.325, 1.4, 4.8 - i * 3.6));
    add(tl, rbox(0.13, 0.6, 0.13, 0.03), M.steel, s * 0.85, 0.98, 3.2, 0, 0, 0, 'landingGearSleeve');
  }
  // telescoping inner legs + sand shoes: one node, origin at the leg tops; setLandingGear(1) puts the shoes on y=0
  const lg = P.landingGear = grp(tl, 'landingGear', 0, 0, 3.2);
  for (const s of [-1, 1]) { add(lg, rbox(0.09, 0.72, 0.09, 0.025), mat(0x9aa3ae, { roughness: 0.6 }), s * 0.85, 0.7, 0, 0, 0, 0, 'landingLeg');
    add(lg, rbox(0.26, 0.04, 0.26, 0.015), M.charcoal, s * 0.85, 0.32, 0, 0, 0, 0, 'sandShoe'); }
  add(tl, rbox(1.6, 0.08, 0.08, 0.03), M.steel, 0, 1.0, 3.2, 0, 0, 0, 'crossShaft');
  const crank = grp(tl, 'crank', 1.0, 0.95, 3.2); add(crank, rbox(0.06, 0.04, 0.04, 0.012), M.steel, -0.04, 0, 0);
  add(crank, rbox(0.03, 0.3, 0.03, 0.01), M.steel, 0, -0.15, 0); add(crank, cyl(0.02, 0.02, 0.12, 8), M.charcoal, 0.06, -0.3, 0, 0, 0, Math.PI / 2);
  P.logoRight = decal(tl, trailerSideTex(), 13.4, 2.5, 1.306, 2.75, -2.7, Math.PI / 2, 'logoRight');
  P.logoLeft = decal(tl, trailerSideTex(), 13.4, 2.5, -1.306, 2.75, -2.7, -Math.PI / 2, 'logoLeft');
  // rear frame + doors
  const zR = -10.8, door = mat(0xeef1f4), hw = mat(0x9aa3ae, { roughness: 0.55 });
  for (const s of [-1, 1]) add(tl, rbox(0.12, 2.85, 0.14, 0.03), rail, s * 1.25, 2.75, zR);
  add(tl, rbox(2.62, 0.18, 0.14, 0.04), rail, 0, 4.07, zR);
  add(tl, rbox(2.62, 0.18, 0.16, 0.04), rail, 0, 1.43, zR);
  P.rearDoors = {};
  for (const s of [-1, 1]) {
    const d = grp(tl, s < 0 ? 'rearDoorLeft' : 'rearDoorRight', s * 1.2, 0, zR - 0.05);
    add(d, rbox(1.17, 2.5, 0.05, 0.03), door, -s * 0.595, 2.75, 0);
    for (const x of [0.3, 0.9]) {
      add(d, cyl(0.022, 0.022, 2.42, 10), hw, -s * x, 2.75, -0.05, 0, 0, 0, 'lockRod');
      add(d, rbox(0.04, 0.34, 0.05, 0.018), hw, -s * x, 2.2, -0.08, 0, 0, s * 0.25, 'handle');
      for (const y of [1.7, 3.8]) add(d, rbox(0.08, 0.05, 0.06, 0.02), hw, -s * x, y, -0.05);
    }
    for (const y of [1.8, 2.45, 3.1, 3.7]) add(d, rbox(0.18, 0.09, 0.05, 0.02), hw, -s * 0.02, y, -0.03, 0, 0, 0, 'hinge');
    P.rearDoors[s < 0 ? 'left' : 'right'] = d;
  }
  add(tl, rbox(0.025, 2.5, 0.03, 0.01), M.charcoal, 0, 2.75, zR - 0.08, 0, 0, 0, 'doorSeam');
  decal(tl, trailerRearTex(), 2.4, 2.4, 0, 2.75, zR - 0.111, Math.PI, 'rearDecal');
  const red = glowMat(PALETTE.red, 0.8);
  for (const s of [-1, 1]) { P.tailLights.push(add(tl, rbox(0.12, 0.24, 0.05, 0.03), red, s * 1.08, 1.43, zR - 0.09, 0, 0, 0, 'tailLight'));
    P.markerLights.push(add(tl, rbox(0.1, 0.05, 0.04, 0.015), red, s * 1.1, 4.07, zR - 0.08)); }
  add(tl, rbox(2.3, 0.14, 0.14, 0.05), M.steel, 0, 0.62, zR + 0.15, 0, 0, 0, 'iccBumper');
  for (const s of [-1, 1]) add(tl, rbox(0.1, 0.65, 0.1, 0.03), M.steel, s * 0.8, 0.95, zR + 0.25);
  add(tl, rbox(1.7, 0.28, 2.6, 0.06), navy, 0, 1.18, -8.95, 0, 0, 0, 'bogie');
  P.trailerWheels = wheelSet(tl, [-8.3, -9.55].flatMap((z) => [-1, 1].map((s) => ({ x: s * 0.95, z, r: 0.52, w: 0.28, dual: true, name: 'wheelTrailer' }))));
  for (const s of [-1, 1]) add(tl, rbox(0.62, 0.55, 0.04, 0.02), M.dark, s * 0.95, 0.55, -10.25, 0, 0, 0, 'mudflap');
  P.wheels = [...P.frontWheels, ...P.driveWheels, ...P.trailerWheels];
  const ud = { speed: opts.speed ?? 0, hazards: false, braking: false, steer: 0, trailerAngle: 0, gear: 0, gearCur: 0 };
  ud.setSpeed = (v) => { ud.speed = v; }; ud.setHazards = (b) => { ud.hazards = b; }; ud.setBraking = (b) => { ud.braking = b; };
  const WB = 9.75 - 4.95;                                                          // wheelbase: steer axle -> drive-tandem centre
  ud.rearSteer = false; ud.steerRate = 0.6; ud.setSteer = (r) => { ud.steer = THREE.MathUtils.clamp(r, -0.6, 0.6); applyAckermann(P.steer, ud.steer, WB, 4.95); };
  ud.setTrailerAngle = (r, fromDrive) => { ud.trailerAngle = THREE.MathUtils.clamp(r, -1.4, 1.4); tlPivot.rotation.y = ud.trailerAngle; if (!fromDrive && ud.kin) ud.kin.axle = null; };
  ud.setLandingGear = (v) => { ud.gear = THREE.MathUtils.clamp(v, 0, 1); };       // 0 raised (travel), 1 lowered to ground
  ud.kin = { refZ: 4.95, L: WB, maxSteer: 0.6, hitchZ: KP.z, trailerL: KP.z - (-8.925), maxArt: 1.4, trailer: tlPivot,
    tractorWheels: kinWheels(g, [...P.frontWheels, ...P.driveWheels]), trailerWheels: P.trailerWheels, axle: null };
  ud.operatorCfg = { anchor: seatS, grip: swSA, spread: 0.19, pose: 'seated', lean: 0.12, hardHat: false, vest: 'blue', auto: opts.operator, anchors: { seat: seatS, steerGrip: swSA } };
  return finish(g, P, (dt, t) => {
    if (!ud._driven) spinWheels(P.wheels, ud.speed, dt); ud._driven = false;
    const pg = ud.gearCur; ud.gearCur = damp(ud.gearCur, ud.gear, 1.6, dt); lg.position.y = -0.3 * ease(ud.gearCur); crank.rotation.x += (ud.gearCur - pg) * 60;
    cab.position.y = Math.abs(ud.speed) < 0.05 ? Math.sin(t * 38) * 0.004 : 0;          // idle engine shiver
    bc.userData.mat.emissiveIntensity = flash(t, 1.4);
    const hz = ud.hazards ? (Math.sin(t * 9) > 0 ? 2.2 : 0.2) : 0.8; amber.emissiveIntensity = hz;
    red.emissiveIntensity = ud.braking ? 2.4 : 0.8;
  }, ud);
}

/* ------------------------------------------------------------------ yard tractor */
/**
 * createYardTractor({speed:0})  terminal / shunt tractor ("yard dog"), ~5.6 m long.
 * parts: cab, wheels[], fifthWheel, liftArms, beacon, airHoses ; userData: speed, setSpeed(v), setFifthWheelLift(0..1)
 */
export function createYardTractor(opts = {}) {
  const g = grp(null, 'yardTractor'), P = {}, white = M.white, blue = M.blue, navy = M.navy, steel = mat(0x9aa3ae, { roughness: 0.6 });
  add(g, rbox(1.3, 0.38, 5.2, 0.08), navy, 0, 0.78, 0, 0, 0, 0, 'chassis');
  add(g, rbox(2.45, 0.36, 0.32, 0.14), mat(0xd5dbe2, { roughness: 0.45 }), 0, 0.62, 2.82, 0, 0, 0, 'bumper');
  add(g, rbox(1.2, 1.05, 1.7, 0.2), blue, 0.6, 1.5, 1.95, 0, 0, 0, 'engineHood');
  for (let i = 0; i < 5; i++) add(g, rbox(0.9, 0.04, 0.04, 0.015), navy, 0.6, 1.2 + i * 0.13, 2.81);
  for (const s of [-1, 1]) add(g, rbox(0.55, 0.16, 1.25, 0.07), blue, s * 1.02, 1.12, 1.95);
  const hl = glowMat(0xfff4d6, 0.9); for (const x of [-0.95, 0.95]) add(g, rbox(0.26, 0.16, 0.06, 0.04), hl, x, 0.95, 2.98, 0, 0, 0, 'headlight');
  // offset cab with wrap-around glass
  const cab = P.cab = grp(g, 'cab', -0.55, 0, 1.65);
  add(cab, rbox(1.25, 0.6, 1.6, 0.2), white, 0, 1.345, 0, 0, 0, 0, 'cabBody');                       // B29: open cab, driver visible
  add(cab, rbox(1.25, 0.36, 0.1, 0.05), white, 0, 1.79, 0.75, 0, 0, 0, 'cabFront'); add(cab, rbox(1.25, 0.5, 0.1, 0.05), white, 0, 1.86, -0.75, 0, 0, 0, 'cabRear');
  for (const s of [-1, 1]) add(cab, rbox(0.1, 0.36, 1.6, 0.05), white, s * 0.575, 1.79, 0, 0, 0, 0, 'cabSide');
  for (const [x, z] of [[-0.585, -0.765], [0.585, -0.765], [-0.585, 0.765], [0.585, 0.765]]) add(cab, rbox(0.08, 1.1, 0.08, 0.03), white, x, 2.42, z, 0, 0, 0, 'cabPillar');
  add(cab, rbox(1.25, 0.2, 1.6, 0.08), white, 0, 2.87, 0, 0, 0, 0, 'cabRoof');
  add(cab, rbox(1.0, 0.18, 0.3, 0.06), M.dark, 0, 1.97, 0.55, 0, 0, 0, 'dash');
  { const st = grp(cab, 'driverSeat', 0, 0, -0.25); add(st, rbox(0.48, 0.12, 0.46, 0.05), M.dark, 0, 1.59, 0); add(st, rbox(0.48, 0.66, 0.12, 0.05), M.dark, 0, 1.98, -0.28, -0.12); }
  const swY = P.steeringWheel = grp(cab, 'steeringWheel', 0, 2.06, 0.36); swY.rotation.x = -1.1; add(swY, torus(0.18, 0.022, 8, 26), M.dark, 0, 0, 0, 0, 0, 0, 'wheelRim');
  add(cab, cyl(0.025, 0.025, 0.3, 8), M.dark, 0, 1.98, 0.48, 0.45, 0, 0, 'steerColumn');
  const seatY = grp(cab, 'anchorSeat', 0, 1.65, -0.22), swYA = grp(cab, 'anchorSteerGrip', 0, 2.06, 0.36); swYA.rotation.x = -1.1;
  clearGlass(add(cab, rbox(1.05, 0.85, 0.06, 0.05), M.glassClear, 0, 2.38, 0.8, 0, 0, 0, 'windshield'));
  clearGlass(add(cab, rbox(1.05, 0.7, 0.06, 0.05), M.glassClear, 0, 2.45, -0.8, 0, 0, 0, 'rearWindow'));
  for (const s of [-1, 1]) clearGlass(add(cab, rbox(0.06, 0.85, 1.3, 0.05), M.glassClear, s * 0.625, 2.38, 0.0, 0, 0, 0, 'sideWindow'));
  add(cab, rbox(1.3, 0.1, 1.66, 0.05), navy, 0, 3.02, 0);
  add(cab, rbox(1.27, 0.22, 1.62, 0.08), blue, 0, 1.18, 0);
  add(cab, rbox(0.04, 0.05, 0.18, 0.02), steel, -0.65, 1.9, 0.2, 0, 0, 0, 'doorHandle');
  add(cab, rbox(0.28, 0.05, 0.22, 0.02), M.charcoal, -0.72, 0.62, 0.3, 0, 0, 0, 'step');
  for (const s of [-1, 1]) { add(cab, rbox(0.25, 0.035, 0.035, 0.012), steel, s * 0.75, 2.5, 0.75); add(cab, rbox(0.06, 0.36, 0.18, 0.03), M.charcoal, s * 0.88, 2.5, 0.75, 0, 0, 0, 'mirror'); }
  const bc = makeBeacon(PALETTE.amber, 1.3); bc.position.set(0, 3.07, 0); cab.add(bc); P.beacon = bc;
  add(g, cyl(0.07, 0.07, 1.9, 14), steel, 1.05, 2.0, 1.2, 0, 0, 0, 'exhaust');
  // deck, fifth wheel, lift arms, air hoses
  add(g, rbox(2.0, 0.08, 1.15, 0.03), mat(0xaab2bc, { roughness: 0.7 }), 0, 1.06, 0.15, 0, 0, 0, 'deckPlate');
  const fw = P.fifthWheel = grp(g, 'fifthWheel', 0, 1.2, -1.35);
  add(fw, rbox(1.35, 0.14, 1.2, 0.05), M.charcoal, 0, 0, 0);
  add(fw, rbox(0.16, 0.15, 0.55, 0.05), M.dark, 0, 0.01, -0.35);
  P.liftArms = [-1, 1].map((s) => strut(g, [s * 0.4, 0.8, -0.4], [s * 0.4, 1.15, -1.2], 0.09, mat(0xd5dbe2, { roughness: 0.45 }), 'liftArm'));
  P.airHoses = [0xe23b3b, 0x1f72d6].map((c, i) => add(g, torus(0.13, 0.02), mat(c), -0.75 + i * 0.4, 1.95, 0.8));
  for (const s of [-1, 1]) add(g, rbox(0.7, 0.06, 1.3, 0.03), mat(0xaab2bc, { roughness: 0.7 }), s * 1.0, 1.1, -1.35, 0, 0, 0, 'rearFender');
  const red = glowMat(PALETTE.red, 0.8); for (const s of [-1, 1]) add(g, rbox(0.14, 0.12, 0.05, 0.03), red, s * 0.55, 0.9, -2.62, 0, 0, 0, 'tailLight');
  const fsw = steerWheelSet(g, [-1, 1].map((s) => ({ x: s * 1.02, z: 1.95, r: 0.5, w: 0.3, name: 'wheelFront' })), 0.12);
  P.steer = fsw.steer; P.frontWheels = fsw.wheels;
  P.wheels = [...fsw.wheels, ...wheelSet(g, [-1, 1].map((s) => ({ x: s * 0.92, z: -1.35, r: 0.5, w: 0.28, dual: true, name: 'wheelRear' })))];
  const ud = { speed: opts.speed ?? 0, lift: 0, liftTarget: 0, steer: 0 };
  ud.rearSteer = false; ud.steerRate = 0.6; ud.setSteer = (r) => { ud.steer = THREE.MathUtils.clamp(r, -0.65, 0.65); applyAckermann(P.steer, ud.steer, 3.3, -1.35); };
  ud.kin = { refZ: -1.35, L: 3.3, maxSteer: 0.65, tractorWheels: kinWheels(g, P.wheels) };
  ud.setSpeed = (v) => { ud.speed = v; }; ud.setFifthWheelLift = (v) => { ud.liftTarget = THREE.MathUtils.clamp(v, 0, 1); };
  ud.operatorCfg = { anchor: seatY, grip: swYA, spread: 0.16, pose: 'seated', lean: 0.15, auto: opts.operator, anchors: { seat: seatY, steerGrip: swYA } };
  return finish(g, P, (dt, t) => {
    if (!ud._driven) spinWheels(P.wheels, ud.speed, dt); ud._driven = false; bc.userData.mat.emissiveIntensity = flash(t, 1.6);
    ud.lift = damp(ud.lift, ud.liftTarget, 4, dt); fw.position.y = 1.2 + ud.lift * 0.35; fw.rotation.x = -ud.lift * 0.08;
  }, ud);
}

/* ------------------------------------------------------------------ mast (shared by forklift / stacker / walkie) */
const FORK_LEN = 1.07; // one fork length for every mast truck (QA M1)
const FORK_T = 0.045, FORK_BEVEL = 0.006, FORK_TOP = FORK_T + FORK_BEVEL, FORK_BOT = -FORK_BEVEL; // tine blade: flat 45 mm top, 180 mm tip taper (carriage-local y)
const FORK_VMAX = 0.5, FORK_ACC = 0.5; // B20 lift profile: m/s, m/s^2 (trapezoid, exact landing)
const LOAD_SEAT_Y = FORK_TOP - PALLET_POCKET.hi, LOAD_MIN_H = 0.1; // carried pallet origin (bottom of bottom boards) in carriage space: deck underside rests on tine tops
function forkGeo(L = FORK_LEN, H = 0.55, w = 0.1) {
  return cached(_geo, `fork${L},${H},${w}`, () => {
    const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(L, 0); s.lineTo(L, 0.012); s.lineTo(L - 0.18, FORK_T); s.lineTo(0.055, FORK_T);
    s.lineTo(0.055, H); s.lineTo(0, H); s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2, curveSegments: 4 });
    geo.translate(0, 0, -w / 2); geo.rotateY(-Math.PI / 2); return geo;
  });
}
const _boxUnit = () => cached(_geo, 'unitBox', () => new THREE.BoxGeometry(1, 1, 1));
/**
 * Telescoping mast. root = outer (fixed) stage; `stages` inner channels nest inside it (duplex = 1, triplex = 2, quad = 3;
 * auto-chosen so every stage keeps >= OVERLAP of rail inside the stage below at full lift). The carriage (origin = fork heel)
 * rides the innermost stage. Free lift first (carriage climbs the stationary mast until the backrest reaches the
 * crosshead), then the inner stages extend together, eased by step(dt). Carriage always stays inside its rails.
 */
const OVERLAP = 0.4;
function makeMast({ H0 = 2.1, half = 0.33, forkLen = FORK_LEN, forkSpread = 0.25, maxH = 3.0, backrest = 1.15, color = PALETTE.charcoal, forkColor = 0x3a404b, stages, drop = 0 } = {}) {
  const m = mat(color), chrome = mat(0xd5dbe2, { roughness: 0.4 }), root = grp(null, 'mast'), chain = mat(0x15181d, { roughness: 0.7 }), stM = mat(0x3d4552);
  const free = H0 - backrest - 0.05, E = Math.max(0, maxH - free);                 // free lift, total extension needed
  const n = stages ?? Math.max(1, Math.ceil(E / (H0 - OVERLAP)));
  for (const s of [-1, 1]) add(root, rbox(0.09, H0, 0.13, 0.025), m, s * half, H0 / 2, 0, 0, 0, 0, 'outerRail');
  add(root, rbox(half * 2 + 0.1, 0.08, 0.1, 0.03), m, 0, H0 - 0.04, -0.01, 0, 0, 0, 'outerCrosshead'); add(root, rbox(half * 2 + 0.1, 0.1, 0.1, 0.03), m, 0, 0.2, -0.01);
  add(root, cyl(0.048, 0.048, H0 * 0.85, 16), m, 0, H0 * 0.43, -0.08, 0, 0, 0, 'liftCylinder');
  const inners = []; let par = root;
  for (let k = 0; k < n; k++) {                                                     // each stage: narrower rails, one channel forward
    const st = grp(par, k ? 'innerMast' + (k + 1) : 'innerMast', 0, 0, k ? 0.06 : 0.07), hx = half - 0.085 - k * 0.07;
    for (const s of [-1, 1]) add(st, rbox(0.07, H0, 0.08, 0.02), stM, s * hx, H0 / 2, 0, 0, 0, 0, 'innerRail');
    add(st, rbox(hx * 2 + 0.08, 0.08, 0.08, 0.03), stM, 0, H0 - 0.05, 0, 0, 0, 0, 'crosshead');
    add(st, rbox(hx * 2 + 0.08, 0.07, 0.07, 0.025), stM, 0, 0.12, 0, 0, 0, 0, 'stageTie');
    inners.push(st); par = st;
  }
  const inner = inners[0], top = inners[n - 1], zIn = 0.07 + (n - 1) * 0.06;
  for (const s of [-1, 1]) add(top, roundCyl(0.06, 0.05, 0.015, 16, 'x'), chrome, s * 0.14, H0 - 0.05, 0.04, 0, 0, 0, 'sheave');
  add(inner, cyl(0.03, 0.03, H0 * 0.8, 12), chrome, 0, H0 * 0.55, -0.15, 0, 0, 0, 'liftRam');
  const car = grp(top, 'carriage', 0, 0, 0.17 - zIn); // origin = fork heel (underside of tines at the carriage face); world z 0.17 ahead of the outer rails
  add(car, rbox(half * 2 + 0.14, 0.38, 0.06, 0.03), m, 0, 0.3, -0.03, 0, 0, 0, 'carriagePlate');
  const br = grp(car, 'backrest');
  for (let i = 0; i < 6; i++) add(br, rbox(0.035, backrest - 0.45, 0.03, 0.012), m, -half + (i * (half * 2)) / 5, 0.45 + (backrest - 0.45) / 2, -0.02);
  add(br, rbox(half * 2 + 0.1, 0.05, 0.04, 0.02), m, 0, backrest, -0.02); add(br, rbox(half * 2 + 0.1, 0.05, 0.04, 0.02), m, 0, 0.78, -0.02);
  const forks = [-1, 1].map((s) => add(car, forkGeo(forkLen), mat(forkColor, { roughness: 0.5 }), s * forkSpread, 0.0, 0.0, 0, 0, 0, s < 0 ? 'forkLeft' : 'forkRight'));
  const chains = [-1, 1].map((s) => add(root, _boxUnit(), chain, s * 0.14, 1, 0.115, 0, 0, 0, 'chain'));
  const st = { h: 0, target: 0, v: 0, vmax: FORK_VMAX, acc: FORK_ACC, minH: 0 };
  const apply = () => {
    const ext = Math.max(0, st.h - free), e1 = ext / n;                              // free lift first, then all stages share the extension
    for (const s of inners) s.position.y = e1; car.position.y = st.h - ext - drop;      // drop: carriage hangs below the rail foot so lowered tines touch the floor
    const tp = ext + H0 - 0.05, bot = st.h - drop + 0.48; for (const c of chains) { c.scale.set(0.03, Math.max(0.01, tp - bot), 0.02); c.position.y = (tp + bot) / 2; }
  };
  apply();
  return { root, outer: root, inner, inners, stages: n, carriage: car, forks, chains, st, maxH, free, H0, backrest, apply,
    set(h) { st.target = THREE.MathUtils.clamp(h, st.minH, maxH); },
    snap() { st.h = st.target; st.v = 0; apply(); },
    // B20: speed-capped trapezoid (|v| <= vmax, |a| <= acc, decel on the sqrt(2*a*d) braking curve), lands EXACTLY on target
    step(dt) {
      const d = st.target - st.h, ad = Math.abs(d);
      if (ad <= 1e-3 && Math.abs(st.v) <= st.acc * dt * 2) { if (st.h !== st.target) { st.h = st.target; apply(); } st.v = 0; return; }
      // discrete-time braking curve: the largest v from which constant |a| <= acc stops exactly at the target at this dt
      const aT = st.acc * dt, vB = Math.sqrt(2 * st.acc * ad + 0.25 * aT * aT) - 0.5 * aT;
      const vDes = Math.sign(d) * Math.min(st.vmax, vB);
      st.v += THREE.MathUtils.clamp(vDes - st.v, -aT, aT);
      const dh = st.v * dt; if (Math.sign(dh) === Math.sign(d) && Math.abs(dh) >= ad) { st.h = st.target; st.v = 0; } else st.h += dh;
      apply();
    } };
}

/* ------------------------------------------------------------------ yellow counterbalance forklift */
/**
 * createForklift({load:false, autoLift:true, speed:0})  LPG counterbalance truck (ref imgref/13), ~3.3 m incl. forks, 2.2 m tall.
 * parts: body, mast, innerMast, carriage (=forks group), forks[], chains[], wheels[], overheadGuard, seat, steeringWheel,
 *        propaneTank, beacon, mirrors[], load (pallet)
 * userData: setForkHeight(h 0..3 m), setMastTilt(rad; + = back, clamp -0.1..0.17), setSpeed(v m/s), setLoad(bool), autoLift (idle demo cycle)
 */
export function createForklift(opts = {}) {
  const g = grp(null, 'forklift'), b = grp(g, 'body', 0, 0, -0.45), P = { body: b };
  const Y = mat(PALETTE.forkYellow, { roughness: 0.75 }), C = mat(0x3d4552), K = mat(0x1c2028);
  add(b, rbox(1.1, 0.5, 1.55, 0.14), Y, 0, 0.5, -0.2, 0, 0, 0, 'chassis');
  add(b, rbox(1.14, 0.78, 0.46, 0.22), Y, 0, 0.72, -0.95, 0, 0, 0, 'counterweight');
  add(b, rbox(1.0, 0.42, 0.36, 0.12), C, 0, 0.92, 0.48, 0, 0, 0, 'cowl');
  add(b, rbox(0.86, 0.06, 0.5, 0.03), C, 0, 0.77, 0.12, 0, 0, 0, 'floorPlate');
  add(b, rbox(1.02, 0.3, 0.78, 0.12), C, 0, 0.88, -0.45, 0, 0, 0, 'engineCover');
  add(b, rbox(0.26, 0.05, 0.3, 0.02), K, -0.6, 0.42, 0.15, 0, 0, 0, 'step');
  add(b, rbox(0.26, 0.08, 0.06, 0.02), Y, -0.6, 0.45, 0.31);
  for (const s of [-1, 1]) add(b, rbox(0.3, 0.09, 0.7, 0.04), C, s * 0.58, 0.72, 0.48, 0, 0, 0, 'fender');
  const tail = glowMat(PALETTE.red, 0.8); for (const s of [-1, 1]) add(b, rbox(0.1, 0.08, 0.04, 0.02), tail, s * 0.4, 0.95, -1.19, 0, 0, 0, 'tailLight');
  add(b, cyl(0.04, 0.04, 0.12, 10), K, 0, 0.45, -1.2, Math.PI / 2, 0, 0, 'towPin');
  // seat, steering
  const seat = P.seat = grp(b, 'seat', 0, 0, -0.42);
  add(seat, rbox(0.5, 0.12, 0.48, 0.06), K, 0, 1.1, 0);
  add(seat, rbox(0.5, 0.56, 0.13, 0.06), K, 0, 1.42, -0.26, -0.15);
  for (const s of [-1, 1]) add(seat, rbox(0.06, 0.18, 0.42, 0.03), K, s * 0.25, 1.2, 0.0);
  add(b, cyl(0.03, 0.03, 0.5, 10), K, 0, 1.2, 0.42, -0.4, 0, 0, 'steeringColumn');
  P.steeringWheel = add(b, torus(0.16, 0.024), K, 0, 1.43, 0.33, -1.97, 0, 0, 'steeringWheel');
  add(b, sph(0.03, 10, 8), mat(PALETTE.red), 0.12, 1.47, 0.36, 0, 0, 0, 'knob');
  for (const x of [0.2, 0.28]) add(b, cyl(0.012, 0.012, 0.3, 8), K, x, 1.15, 0.6, -0.3, 0, 0, 'lever');
  // overhead guard
  const og = P.overheadGuard = grp(b, 'overheadGuard');
  for (const s of [-1, 1]) {
    strut(og, [s * 0.48, 0.95, 0.62], [s * 0.46, 2.12, 0.38], 0.07, C, 'guardPostFront');
    strut(og, [s * 0.5, 1.08, -0.86], [s * 0.47, 2.12, -0.78], 0.07, C, 'guardPostRear');
    add(og, rbox(0.07, 0.07, 1.25, 0.03), C, s * 0.47, 2.14, -0.2);
  }
  for (const z of [0.38, -0.78]) add(og, rbox(1.0, 0.07, 0.07, 0.03), C, 0, 2.14, z);
  for (let i = 0; i < 5; i++) add(og, rbox(0.9, 0.035, 0.1, 0.015), C, 0, 2.16, 0.22 - i * 0.2, 0, 0, 0, 'roofSlat');
  P.mirrors = [-1, 1].map((s) => { strut(og, [s * 0.46, 1.95, 0.4], [s * 0.62, 2.0, 0.42], 0.025, K); return add(og, rbox(0.06, 0.12, 0.16, 0.03), K, s * 0.65, 2.02, 0.42, 0, 0, 0, 'mirror'); });
  const hl = glowMat(0xfff4d6, 0.9); for (const s of [-1, 1]) add(og, rbox(0.1, 0.09, 0.06, 0.03), hl, s * 0.47, 1.75, 0.5, 0, 0, 0, 'headlight');
  const bc = P.beacon = makeBeacon(0xff7a1a, 1.1); bc.position.set(0.3, 2.18, -0.78); og.add(bc);
  // propane tank (red, rear)
  const tank = P.propaneTank = grp(b, 'propaneTank', 0, 1.3, -0.98); tank.rotation.x = 0.12;
  add(tank, cap(0.16, 0.5, 18), mat(0xd93636, { roughness: 0.6 }), 0, 0, 0, 0, 0, Math.PI / 2);
  add(tank, cyl(0.03, 0.03, 0.08, 10), M.steel, 0.36, 0.08, 0); add(tank, torus(0.04, 0.012), M.steel, 0.36, 0.13, 0, Math.PI / 2);
  for (const x of [-0.22, 0.22]) add(tank, torus(0.165, 0.015), C, x, 0, 0, 0, Math.PI / 2);
  // wheels: chunky black tyres, yellow rims
  const fw = wheelSet(b, [-1, 1].map((s) => ({ x: s * 0.6, z: 0.48, r: 0.33, w: 0.26, hub: PALETTE.forkYellow, name: 'wheelFront' })));
  const rs = steerWheelSet(b, [-1, 1].map((s) => ({ x: s * 0.5, z: -0.78, r: 0.26, w: 0.2, hub: PALETTE.forkYellow, name: 'wheelRear' })), 0.08);
  add(b, rbox(0.84, 0.1, 0.12, 0.04), C, 0, 0.26, -0.78, 0, 0, 0, 'steerAxle');
  P.wheels = [...fw, ...rs.wheels]; P.frontWheels = fw; P.rearWheels = rs.wheels; P.steer = rs.steer;
  // mast + tilt cylinders
  const mast = makeMast({ H0: 2.1, half: 0.33, maxH: 3.0, drop: 0.105 });
  const mp = grp(b, 'mastPivot', 0, 0.12, 0.88); mp.add(mast.root); // tilt pin at the mast base (bottom of the outer rails)
  P.mast = P.outerMast = mast.root; P.innerMast = mast.inner; P.carriage = P.forks = mast.carriage; P.forkTines = mast.forks; P.chains = mast.chains;
  for (const s of [-1, 1]) strut(b, [s * 0.42, 0.9, 0.62], [s * 0.4, 1.05, 0.84], 0.06, mat(0xd5dbe2, { roughness: 0.4 }), 'tiltCylinder');
  // optional pallet load on forks
  const loadG = createPallet({ variant: 'pine', seed: 7, maxHeight: 0.9 }); loadG.position.set(0, LOAD_SEAT_Y, 0.64); mast.carriage.add(loadG); P.load = loadG;
  const ud = { autoLift: opts.autoLift ?? true, speed: opts.speed ?? 0, tilt: 0, tiltTarget: 0 };
  loadG.visible = !!opts.load;
  ud.setForkHeight = (h, snap = false) => { ud.autoLift = false; mast.set(h); if (snap) mast.snap(); };  // snap: no easing (scripted motion)
  ud.setMastTilt = (r, snap = false) => { ud.tiltTarget = THREE.MathUtils.clamp(r, -0.1, 0.17); if (snap) { ud.tilt = ud.tiltTarget; mp.rotation.x = -ud.tilt; } };
  ud.setSpeed = (v) => { ud.speed = v; };
  ud.setLoad = (v) => { loadG.visible = !!v; mast.st.minH = v ? LOAD_MIN_H : 0; if (mast.st.target < mast.st.minH) { mast.set(mast.st.minH); mast.snap(); } };
  ud.getForkHeight = () => mast.st.h; ud.maxForkHeight = 3.0; ud.steer = 0;
  const WB = 0.48 - -0.78;                                                         // drive axle -> steer axle (m)
  ud.rearSteer = true; ud.steerRate = 1.5; ud.setSteer = (r) => { ud.steer = THREE.MathUtils.clamp(r, -0.75, 0.75); applyAckermann(P.steer, ud.steer, WB, 0.03, -1); }; // rear wheels turn opposite
  ud.kin = { refZ: 0.03, L: WB, maxSteer: 0.75, tractorWheels: kinWheels(g, P.wheels) };
  const seatF = grp(b, 'anchorSeat', 0, 1.16, -0.33), swF = grp(b, 'anchorSteerGrip', 0, 1.43, 0.33); swF.rotation.x = -1.97;   // B29 seated, hands on the wheel
  ud.operatorCfg = { anchor: seatF, grip: swF, spread: 0.14, pose: 'seated', lean: 0.44, auto: opts.operator, anchors: { seat: seatF, steerGrip: swF } };
  addForkApi(g, ud, mast); if (!ud.getForkHeight) ud.getForkHeight = () => mast.st.h; if (ud.setLoad) ud.setLoad(!!opts.load);
  return finish(g, P, (dt, t) => {
    if (ud.autoLift) { autoCycle(ud, mast, 2.6, dt); ud.tiltTarget = ud._al.up ? 0.06 : 0.0; }
    mast.step(dt); ud.tilt = damp(ud.tilt, ud.tiltTarget, 3, dt); mp.rotation.x = -ud.tilt;
    if (!ud._driven) spinWheels(P.wheels, ud.speed, dt); ud._driven = false; P.steeringWheel.rotation.z = ud.steer * 5;
    bc.userData.mat.emissiveIntensity = flash(t, 1.8);
  }, ud);
}

/* ------------------------------------------------------------------ autonomous pallet stacker (orange/charcoal) */
/**
 * createAutoStacker({load:false, autoLift:true, speed:0})  driverless pallet-stacking forklift (ref imgref/01).
 * parts: body, mast, innerMast, carriage, forks[], wheels[], sensorMast, lidar, screen, statusLight, scanner
 * userData: setForkHeight(h), setSpeed(v), setLoad(bool), setStatus('ok'|'busy'|'fault')
 */
export function createAutoStacker(opts = {}) {
  const g = grp(null, 'autoStacker'), b = grp(g, 'body', 0, 0, -0.35), P = { body: b };
  const O = mat(PALETTE.stackerOrange, { roughness: 0.75 }), C = M.charcoal, K = mat(0x1c2028);
  add(b, rbox(1.0, 0.34, 1.35, 0.1), C, 0, 0.24, -0.35, 0, 0, 0, 'chassis');
  add(b, rbox(0.94, 0.95, 1.05, 0.16), O, 0, 0.86, -0.42, 0, 0, 0, 'cover');
  add(b, rbox(0.96, 0.28, 1.07, 0.1), C, 0, 0.5, -0.42, 0, 0, 0, 'lowerBand');
  add(b, rbox(0.98, 0.12, 1.1, 0.05), C, 0, 1.36, -0.42, 0, 0, 0, 'topCap');
  add(b, rbox(0.7, 0.5, 0.06, 0.05), C, 0, 0.95, 0.12, 0, 0, 0, 'frontFace');
  add(b, rbox(1.02, 0.22, 0.12, 0.06), K, 0, 0.25, -1.05, 0, 0, 0, 'rearBumper');
  for (const s of [-1, 1]) { decal(b, sparkTex(), 0.26, 0.26, s * 0.472, 1.0, -0.3, s * Math.PI / 2); add(b, rbox(0.02, 0.06, 0.5, 0.01), mat(0x1c2028), s * 0.475, 1.18, -0.42); }
  const strip = glowMat(0x2a8cff, 1.2); add(b, rbox(0.985, 0.03, 1.09, 0.012), strip, 0, 0.66, -0.42, 0, 0, 0, 'lightStrip');
  const scan = glowMat(0xff3344, 0.8); P.scanner = add(b, rbox(0.3, 0.08, 0.06, 0.03), K, 0, 0.3, 0.33, 0, 0, 0, 'scanner');
  add(b, rbox(0.24, 0.015, 0.02, 0.006), scan, 0, 0.3, 0.365);
  const sm = P.sensorMast = grp(b, 'sensorMast', -0.36, 0, -0.85);
  add(sm, rbox(0.08, 0.9, 0.08, 0.03), K, 0, 1.85, 0);
  P.lidar = add(sm, roundCyl(0.08, 0.08, 0.02, 20), K, 0, 2.34, 0, 0, 0, 0, 'lidar');
  add(sm, roundCyl(0.06, 0.03, 0.01, 20), mat(0x5a6372), 0, 2.4, 0);
  add(sm, rbox(0.16, 0.08, 0.08, 0.03), K, 0, 2.2, 0.06, 0, 0, 0, 'camera');
  add(sm, sph(0.025, 10, 8), mat(0x223355, { roughness: 0.3 }), 0, 2.2, 0.1);
  const status = glowMat(0x2a8cff, 1.4); P.statusLight = add(sm, cyl(0.05, 0.05, 0.06, 16), status, 0, 2.47, 0, 0, 0, 0, 'statusLight');
  const scr = grp(b, 'screen', 0.36, 1.5, 0.0); add(scr, rbox(0.03, 0.4, 0.03, 0.01), K, 0, 0, 0);
  add(scr, rbox(0.26, 0.18, 0.03, 0.02), K, 0, 0.22, 0.02, -0.3); add(scr, rbox(0.22, 0.14, 0.01, 0.01), glowMat(0x7fc4ff, 0.7), 0, 0.22, 0.037, -0.3); P.screen = scr;
  const asf = wheelSet(b, [-1, 1].map((s) => ({ x: s * 0.42, z: 0.15, r: 0.2, w: 0.16, hub: PALETTE.stackerOrange, name: 'wheelFront' })));
  const asr = steerWheelSet(b, [-1, 1].map((s) => ({ x: s * 0.42, z: -0.8, r: 0.18, w: 0.14, hub: 0x5a6372, name: 'wheelRear' })), 0.07);
  P.wheels = [...asf, ...asr.wheels]; P.steer = asr.steer;
  const mast = makeMast({ H0: 2.0, half: 0.3, maxH: 2.6, backrest: 1.0, forkSpread: 0.24, drop: 0.045 });
  const mp = grp(b, 'mastPivot', 0, 0.06, 0.32); mp.add(mast.root);
  P.mast = mast.root; P.innerMast = mast.inner; P.carriage = mast.carriage; P.forks = mast.forks;
  const loadG = createPallet({ variant: 'blueWood', seed: 4, maxHeight: 1.0 }); loadG.position.set(0, LOAD_SEAT_Y, 0.62); mast.carriage.add(loadG); P.load = loadG; loadG.visible = !!opts.load;
  const ud = { autoLift: opts.autoLift ?? true, speed: opts.speed ?? 0, status: 'ok', steer: 0, maxForkHeight: 2.6 };
  ud.rearSteer = true; ud.steerRate = 1.5; ud.setSteer = (r) => { ud.steer = THREE.MathUtils.clamp(r, -0.7, 0.7); applyAckermann(P.steer, ud.steer, 0.95, -0.2, -1); }; // rear-wheel steer
  ud.kin = { refZ: -0.2, L: 0.95, maxSteer: 0.7, tractorWheels: kinWheels(g, P.wheels) };
  ud.setForkHeight = (h, snap = false) => { ud.autoLift = false; mast.set(h); if (snap) mast.snap(); }; ud.setSpeed = (v) => { ud.speed = v; };
  ud.setLoad = (v) => { loadG.visible = !!v; mast.st.minH = v ? LOAD_MIN_H : 0; if (mast.st.target < mast.st.minH) { mast.set(mast.st.minH); mast.snap(); } };
  ud.setStatus = (s) => { ud.status = s; const c = s === 'fault' ? 0xff3344 : s === 'busy' ? 0xffa21a : 0x2a8cff; status.color.set(c); status.emissive.set(c); strip.color.set(c); strip.emissive.set(c); };
  addForkApi(g, ud, mast); if (!ud.getForkHeight) ud.getForkHeight = () => mast.st.h; if (ud.setLoad) ud.setLoad(!!opts.load);
  return finish(g, P, (dt, t) => {
    if (ud.autoLift) autoCycle(ud, mast, 1.6, dt);
    mast.step(dt); if (!ud._driven) spinWheels(P.wheels, ud.speed, dt); ud._driven = false;
    P.lidar.rotation.y += dt * 6; status.emissiveIntensity = 0.8 + 0.8 * Math.sin(t * 4) ** 2; strip.emissiveIntensity = 0.7 + 0.5 * Math.sin(t * 2.2) ** 2;
    scan.emissiveIntensity = 0.6 + 0.6 * Math.sin(t * 10) ** 2;
  }, ud);
}

/* ------------------------------------------------------------------ manual hand pallet jack / pump truck (ref imgref/20) */
const HPJ = { forkLen: 1.15, forkW: 0.16, forkT: 0.052, lowTop: 0.085, maxLift: 0.12, forkX: 0.19, steerZ: -0.5, rollerZ: 0.66, rollerR: 0.04, tipZ: 0.8 };
/** fork blade: plan shape with chamfered tip and the load-roller window, extruded down by forkT (top at y = 0). */
function handJackForkGeo() {
  return cached(_geo, 'hpjFork', () => {
    const { forkW: w, forkT: t, tipZ, rollerZ } = HPJ, z0 = tipZ - HPJ.forkLen, h = w / 2, s = new THREE.Shape();
    // shape space (x, y) = (x, -z)
    s.moveTo(-h, -z0); s.lineTo(h, -z0); s.lineTo(h, -(tipZ - 0.06)); s.lineTo(h - 0.035, -tipZ); s.lineTo(-h + 0.035, -tipZ); s.lineTo(-h, -(tipZ - 0.06)); s.closePath();
    const win = new THREE.Path(), wx = 0.05, wz0 = rollerZ - 0.065, wz1 = rollerZ + 0.055, rr = 0.012;
    win.moveTo(-wx + rr, -wz0); win.lineTo(wx - rr, -wz0); win.quadraticCurveTo(wx, -wz0, wx, -wz0 - rr); win.lineTo(wx, -wz1 + rr); win.quadraticCurveTo(wx, -wz1, wx - rr, -wz1);
    win.lineTo(-wx + rr, -wz1); win.quadraticCurveTo(-wx, -wz1, -wx, -wz1 + rr); win.lineTo(-wx, -wz0 - rr); win.quadraticCurveTo(-wx, -wz0, -wx + rr, -wz0); s.holes.push(win);
    const g = new THREE.ExtrudeGeometry(s, { depth: t - 0.008, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 6 });
    g.rotateX(-Math.PI / 2); g.translate(0, -t + 0.004, 0); return g;                       // top face at y = 0, underside at -t
  });
}
/**
 * createHandPalletJack({color, lift:0, operator})  manual hand pallet truck (pump truck), forks toward +Z, 1.15 m forks
 * (tips at z = +0.80), 0.54 m wide, lowered fork top 0.085 m, +0.12 m max lift. Tiller and steer wheels at the rear (z = -0.5).
 * parts: liftFrame (forks + housing; rises), forks[], forkWindows, housing, crossbar, tillerSteer (=steer pivot, vertical axis: tiller
 *        + steer wheels + pump), pumpHead (rides up with the frame), tiller (=handle; pitch pivot), grip, liftLever, steerWheels[],
 *        loadRollers[], rollerLinks[], tillerGrip (Object3D anchor)
 * userData:
 *   setSteer(rad)/setSteerNow, steer      tiller + steer wheels yaw together (rear steer, rate-limited like every vehicle)
 *   pump(n = 3, total = 0.1)              n handle strokes (down/up, ~0.8 s each) raising the forks `total` m (0.08-0.12 sensible)
 *   release()                             lift lever squeezed, forks lower to 0 at 0.1 m/s, lever springs back
 *   setLift(0..1), getLift() (m above lowered), isPumping(), setHandleAngle(rad) (tiller pitch; + = toward the forks)
 *   setSpeed(v) (wheel + load-roller spin; drive() does it from motion), gripAnchor = anchors.tillerGrip (Object3D at the loop grip,
 *   +X along the grip bar, +Y along the tiller, +Z pointing away from the jack, i.e. where the operator's chest is), getForkTopY()
 */
export function createHandPalletJack(opts = {}) {
  const g = grp(null, opts.name ?? 'handPalletJack'), P = {}, Y = mat(opts.color ?? PALETTE.forkYellow, { roughness: 0.72 }), K = mat(0x1b1e23, { roughness: 0.7 });
  const chrome = mat(0xd5dbe2, { roughness: 0.38 }), Dk = mat(0x2a2f36), { forkT, lowTop, forkX, steerZ, rollerZ, rollerR, tipZ } = HPJ;
  const lift = P.liftFrame = grp(g, 'liftFrame');
  P.forks = [-1, 1].map((s) => { const f = add(lift, handJackForkGeo(), Y, s * forkX, lowTop, 0, 0, 0, 0, 'fork');
    add(f, rbox(HPJ.forkW - 0.03, 0.01, 0.34, 0.004, 1), Dk, 0, -forkT + 0.006, tipZ - HPJ.forkLen + 0.2, 0, 0, 0, 'forkUnderRib'); return f; });
  // rear frame: cross plate tying the forks, wedge housing (front view trapezoid) over the steer unit, cheek plates
  const z0 = tipZ - HPJ.forkLen;
  P.crossbar = add(lift, rbox(forkX * 2 + HPJ.forkW, 0.07, 0.1, 0.02, 2), Y, 0, lowTop - 0.03, z0 + 0.03, 0, 0, 0, 'crossbar');
  add(lift, rbox(forkX * 2 + HPJ.forkW - 0.02, 0.05, 0.03, 0.012, 2), Y, 0, lowTop + 0.04, z0 + 0.065, -0.5, 0, 0, 'crossbarLip');
  const hg = cached(_geo, 'hpjHousing', () => { const q = taperGeo(rbox(0.36, 0.3, 0.24, 0.035, 3), 1, 1); const p = q.attributes.position;
    for (let i = 0; i < p.count; i++) { const t = (p.getY(i) + 0.15) / 0.3; p.setX(i, p.getX(i) * (1 - 0.5 * t)); p.setZ(i, p.getZ(i) * (1 - 0.25 * t) + 0.03 * t); } q.computeVertexNormals(); return q; });
  P.housing = add(lift, hg, Y, 0, 0.2 + 0.15, steerZ + 0.02, 0, 0, 0, 'housing');
  for (const s of [-1, 1]) add(lift, rbox(0.03, 0.16, 0.24, 0.01, 2), Y, s * 0.155, 0.135, steerZ + 0.02, 0, 0, 0, 'housingCheek');
  add(lift, rbox(0.012, 0.06, 0.06, 0.004, 1), chrome, 0.158, 0.27, steerZ + 0.02, 0, 0, 0, 'reliefValve');
  decal(lift, labelTex('2500 kg', '#041E42', '#FFC220'), 0.12, 0.06, 0, 0.3, steerZ + 0.146, 0, 'capacityPlate');
  // fork-tip load rollers (ground) with the push-rod linkage up into the fork window
  P.rollerLinks = []; P.loadRollers = [-1, 1].map((s) => { const m = add(g, roundCyl(rollerR, 0.085, 0.008, 16, 'x'), chrome, s * forkX, rollerR, rollerZ, 0, 0, 0, 'loadRoller'); m.userData.radius = rollerR;
    add(m, cyl(0.009, 0.009, 0.1, 8), Dk, 0, 0, 0, 0, 0, Math.PI / 2, 'rollerAxle');
    const ln = add(g, rbox(0.012, 1, 0.026, 0.004, 1), Dk, s * forkX + 0.046, 0, rollerZ, 0, 0, 0, 'rollerLink'); P.rollerLinks.push(ln); return m; });
  for (const s of [-1, 1]) add(lift, rbox(0.022, 0.022, HPJ.forkLen - 0.36, 0.008, 1), Dk, s * forkX, lowTop - forkT - 0.002, z0 + 0.18 + (HPJ.forkLen - 0.36) / 2, 0, 0, 0, 'pushRod');
  // steer unit: yaws about the vertical axis through the steer axle; wheels, yoke, pump cylinder, tiller
  const ts = P.tillerSteer = grp(g, 'steerTiller', 0, 0.08, steerZ); ts.userData.wheel = null; P.steer = [ts];
  P.steerWheels = wheelSet(ts, [-1, 1].map((s) => ({ x: s * 0.06, y: 0, z: 0, r: 0.08, w: 0.05, hub: 0xd5dbe2, name: 'steerWheel' })));
  for (const s of [-1, 1]) add(ts, rbox(0.016, 0.1, 0.07, 0.006, 1), K, s * 0.1, 0.03, 0, 0, 0, 0, 'steerYoke');
  add(ts, rbox(0.216, 0.02, 0.07, 0.008, 1), K, 0, 0.095, 0, 0, 0, 0, 'steerYokeTop');
  P.pumpCylinder = add(ts, roundCyl(0.034, 0.3, 0.01, 18), chrome, 0, 0.25, 0, 0, 0, 0, 'pumpCylinder');
  const ph = P.pumpHead = grp(ts, 'pumpHead', 0, 0.42, 0);            // rides up with the frame (pump piston)
  add(ph, rbox(0.11, 0.06, 0.1, 0.025, 2), Y, 0, 0, 0, 0, 0, 0, 'pumpCap');
  const hd = P.tiller = P.handle = grp(ph, 'tiller', 0, 0.02, 0);      // pitch pivot
  add(hd, rbox(0.1, 0.05, 0.05, 0.018, 2), K, 0, 0.0, 0, 0, 0, 0, 'tillerYoke');
  add(hd, roundCyl(0.021, 0.5, 0.006, 14), K, 0, 0.27, 0, 0, 0, 0, 'tillerShaft');
  add(hd, roundCyl(0.03, 0.1, 0.01, 14), K, 0, 0.47, 0, 0, 0, 0, 'tillerCollar');
  // loop handle: rounded "D" in the X-Y plane above the shaft, grip bar across its top
  const loop = grp(hd, 'loopHandle', 0, 0.56, 0), lr = 0.016;
  const lg = cached(_geo, 'hpjLoop', () => { const c = new THREE.CatmullRomCurve3([[-0.03, -0.06], [-0.13, 0.03], [-0.15, 0.13], [-0.1, 0.19], [0, 0.2], [0.1, 0.19], [0.15, 0.13], [0.13, 0.03], [0.03, -0.06]].map(([x, y]) => new THREE.Vector3(x, y, 0)), false, 'catmullrom', 0.5);
    return new THREE.TubeGeometry(c, 40, lr, 10, false); });
  add(loop, lg, K, 0, 0, 0, 0, 0, 0, 'loop');
  P.grip = add(loop, roundCyl(0.024, 0.16, 0.008, 14, 'x'), mat(0x2b2f35, { roughness: 0.9 }), 0, 0.19, 0, 0, 0, 0, 'grip');
  const lv = P.liftLever = grp(loop, 'liftLever', 0.04, 0.03, 0.02);  // pivot; rotation.z squeezes it toward the grip
  add(lv, rbox(0.014, 0.12, 0.014, 0.005, 1), K, 0.0, 0.06, 0, 0, 0, -0.5, 'leverArm'); add(lv, rbox(0.04, 0.016, 0.016, 0.006, 1), mat(PALETTE.red), 0.03, 0.115, 0, 0, 0, 0, 'leverTip');
  const anchor = P.tillerGrip = new THREE.Object3D(); anchor.name = 'tillerGrip'; anchor.position.set(0, 0.19, 0); anchor.rotation.y = Math.PI; loop.add(anchor);
  // state
  const REST = -0.28, ud = { lift: 0, liftT: 0, ang: REST, angT: REST, steer: 0, speed: 0, restAngle: REST, maxLift: HPJ.maxLift, _pump: null, _rel: 0 };
  ud.gripAnchor = anchor; ud.anchors = { tillerGrip: anchor };
  ud.setLift = (v) => { ud.liftT = THREE.MathUtils.clamp(v, 0, 1) * HPJ.maxLift; ud._pump = null; };
  ud.getLift = () => ud.lift; ud.setHandleAngle = (r) => { ud.angT = r; }; ud.isPumping = () => !!ud._pump || ud._rel > 0;
  ud.pump = (n = 3, total = 0.1) => { n = Math.max(1, Math.round(n)); ud._pump = { n, k: 0, t: 0, per: Math.min(total, HPJ.maxLift - ud.liftT) / n, T: 0.8, base: ud.liftT }; };
  ud.release = () => { ud._pump = null; ud._rel = 1; };
  ud.getForkTopY = () => { g.updateMatrixWorld(true); return P.forks[0].localToWorld(new THREE.Vector3(0, 0, 0)).y; };
  ud.setSpeed = (v) => { ud.speed = v; };
  P.wheels = [...P.steerWheels, ...P.loadRollers];
  ud.rearSteer = true; ud.steerRate = 2.5; ud.setSteer = (r) => { ud.steer = THREE.MathUtils.clamp(r, -1.2, 1.2); applyAckermann(P.steer, ud.steer, rollerZ - steerZ, rollerZ, -1); };
  ud.kin = { refZ: rollerZ, L: rollerZ - steerZ, maxSteer: 1.2, tractorWheels: kinWheels(g, P.wheels) };
  const apply = () => { lift.position.y = ud.lift; ph.position.y = 0.42 + ud.lift; P.rollerLinks.forEach((l) => { const yb = rollerR, yt = lowTop - forkT + ud.lift + 0.004; l.scale.y = Math.max(0.004, yt - yb); l.position.y = (yt + yb) / 2; }); hd.rotation.x = ud.ang; };
  if (opts.lift) { ud.lift = ud.liftT = THREE.MathUtils.clamp(opts.lift, 0, HPJ.maxLift); }
  const standJ = grp(ts, 'anchorStand', 0, -0.08, -0.72);   // B29 walking operator behind the tiller (child of the steer pivot, so it follows steer)
  ud.operatorCfg = { anchor: standJ, grip: anchor, spread: 0.07, pose: 'walking-tiller', auto: opts.operator, anchors: { stand: standJ, tillerGrip: anchor } };
  apply();
  return finish(g, P, (dt, t) => {
    if (!ud._driven) spinWheels(P.wheels, ud.speed, dt); ud._driven = false;
    const pu = ud._pump;
    if (pu) { pu.t += dt; const ph01 = Math.min(1, pu.t / pu.T); ud.ang = ud.restAngle - 0.95 * Math.sin(Math.PI * ph01);   // stroke: handle pulled down toward the operator, then back up
      if (ph01 < 0.5) ud.lift = Math.min(HPJ.maxLift, pu.base + pu.per * (pu.k + ph01 * 2)); else ud.lift = pu.base + pu.per * (pu.k + 1);
      if (ph01 >= 1) { pu.k++; pu.t = 0; if (pu.k >= pu.n) { ud.liftT = ud.lift; ud._pump = null; } } }
    else if (ud._rel > 0) { lv.rotation.z = damp(lv.rotation.z, 0.45, 12, dt); ud.lift = Math.max(0, ud.lift - 0.1 * dt); ud.liftT = ud.lift; if (ud.lift <= 0) { ud._rel = 0; } }
    else { ud.lift = damp(ud.lift, ud.liftT, 4, dt); ud.ang = damp(ud.ang, ud.angT, 3, dt); }
    if (!ud._rel) lv.rotation.z = damp(lv.rotation.z, 0, 8, dt);
    apply();
  }, ud);
}
/** createPalletJack(opts): alias of createHandPalletJack (name 'palletJack'); the old API (setLift, setHandleAngle, parts.handle/pump/forks/steerWheels/loadRollers) is kept. */
export function createPalletJack(opts = {}) { const g = createHandPalletJack({ name: 'palletJack', ...opts }); g.userData.parts.pump = g.userData.parts.pumpCylinder; return g; }

/* ------------------------------------------------------------------ ride-on electric pallet truck */
/**
 * createRiderPalletTruck({speed:0})  electric rider pallet truck with seat (ref imgref/14). Forks toward +Z.
 * parts: forks[], powerUnit, seat, tiller, wheels[], beacon ; userData: setLift(0..1), setSpeed(v)
 */
export function createRiderPalletTruck(opts = {}) {
  const g = grp(null, 'riderPalletTruck'), P = {}, Y = mat(PALETTE.forkYellow, { roughness: 0.75 }), K = mat(0x1c2028), C = M.charcoal;
  const lift = grp(g, 'liftFrame');
  P.forks = [-1, 1].map((s) => add(lift, rbox(0.17, 0.07, 1.15, 0.025), C, s * 0.2, 0.07, 0.45, 0, 0, 0, 'fork'));
  add(lift, rbox(0.62, 0.3, 0.1, 0.04), C, 0, 0.17, -0.15, 0, 0, 0, 'forkHeel');
  const pu = P.powerUnit = grp(g, 'powerUnit', 0, 0, -0.65);
  add(pu, rbox(0.78, 0.85, 0.9, 0.16), Y, 0, 0.52, 0, 0, 0, 0, 'housing');
  add(pu, rbox(0.8, 0.12, 0.92, 0.05), C, 0, 0.14, 0, 0, 0, 0, 'skirt');
  add(pu, rbox(0.6, 0.06, 0.4, 0.03), C, 0, 0.98, -0.2, 0, 0, 0, 'batteryLid');
  const seat = P.seat = grp(pu, 'seat', 0, 0.95, 0.15);
  add(seat, rbox(0.42, 0.1, 0.38, 0.05), K, 0, 0.06, 0); add(seat, rbox(0.42, 0.38, 0.1, 0.05), K, 0, 0.28, -0.2, -0.15);
  add(seat, rbox(0.08, 0.06, 0.3, 0.03), K, -0.24, 0.2, 0); add(seat, rbox(0.08, 0.06, 0.3, 0.03), K, 0.24, 0.2, 0);
  const rst = grp(pu, 'steerTiller', 0, 0.13, 0.3); rst.userData.wheel = null; P.steer = [rst];          // drive/steer unit pivot (vertical axis through drive-wheel axle)
  add(rst, roundCyl(0.2, 0.06, 0.02, 24), C, 0, 0.78, 0, 0, 0, 0, 'steerHousingTop');
  const til = P.tiller = grp(rst, 'tiller', 0, 0.82, 0.08); add(til, cyl(0.03, 0.03, 0.35, 10), C, 0, 0.17, 0, 0.2);
  add(til, torus(0.1, 0.02), K, 0, 0.36, 0.04, -1.3);
  add(pu, rbox(0.62, 0.05, 0.44, 0.02), C, 0, 0.12, -0.64, 0, 0, 0, 'riderPlatform');                   // deck top y 0.145, z -0.86..-0.42
  add(pu, rbox(0.58, 0.006, 0.4, 0.003), mat(0x2b2f36, { roughness: 1 }), 0, 0.148, -0.64, 0, 0, 0, 'antiSlipMat');
  for (const s of [-1, 1]) { add(pu, rbox(0.035, 0.95, 0.035, 0.012), K, s * 0.3, 0.62, -0.84, 0, 0, 0, 'guardPost');        // side guards + backrest
    add(pu, rbox(0.035, 0.035, 0.4, 0.012), K, s * 0.3, 1.08, -0.65, 0, 0, 0, 'sideGuardRail'); add(pu, rbox(0.035, 0.035, 0.4, 0.012), K, s * 0.3, 0.6, -0.65, 0, 0, 0, 'sideGuardRail'); }
  add(pu, rbox(0.4, 0.3, 0.07, 0.03), mat(0x1c2028, { roughness: 0.9 }), 0, 1.0, -0.82, 0, 0, 0, 'backrestPad');
  add(pu, rbox(0.635, 0.035, 0.035, 0.012), K, 0, 1.0, -0.86, 0, 0, 0, 'backrestBar'); add(pu, rbox(0.635, 0.035, 0.035, 0.012), K, 0, 0.6, -0.86, 0, 0, 0, 'guardBar');
  add(pu, rbox(0.5, 0.06, 0.04, 0.02), Y, 0, 0.16, -0.78);
  const bc = P.beacon = makeBeacon(0xff7a1a, 0.9); bc.position.set(-0.3, 0.95, -0.35); pu.add(bc);
  decal(pu, sparkTex(), 0.25, 0.25, 0.392, 0.6, 0.1, Math.PI / 2); decal(pu, sparkTex(), 0.25, 0.25, -0.392, 0.6, 0.1, -Math.PI / 2);
  const dw = wheelSet(rst, [{ x: 0, y: 0, z: 0, r: 0.13, w: 0.1, hub: 0x8a94a3, name: 'driveWheel' }]);
  P.loadRollers = [-1, 1].map((s) => { const m = add(g, roundCyl(0.04, 0.1, 0.01, 14, 'x'), mat(0x8a94a3), s * 0.2, 0.04, 0.9, 0, 0, 0, 'loadRoller'); m.userData.radius = 0.04; return m; });
  P.wheels = [...dw, ...P.loadRollers];
  const ud = { speed: opts.speed ?? 0, lift: 0, liftT: 0, steer: 0 };
  ud.rearSteer = true; ud.steerRate = 2.5; ud.setSteer = (r) => { ud.steer = THREE.MathUtils.clamp(r, -1.2, 1.2); applyAckermann(P.steer, ud.steer, 1.25, 0.9, -1); };
  ud.kin = { refZ: 0.9, L: 1.25, maxSteer: 1.2, tractorWheels: kinWheels(g, P.wheels) };
  ud.setLift = (v) => { ud.liftT = THREE.MathUtils.clamp(v, 0, 1); }; ud.setSpeed = (v) => { ud.speed = v; };
  for (const s of [-1, 1]) add(pu, rbox(0.04, 0.2, 0.04, 0.015), C, s * 0.2, 1.025, -0.44, 0, 0, 0, 'grabPost');
  add(pu, rbox(0.46, 0.045, 0.045, 0.02), K, 0, 1.12, -0.44, 0, 0, 0, 'grabBar');
  const platA = grp(pu, 'anchorPlatform', 0, 0.151, -0.63), gripR = grp(pu, 'anchorGrabBar', 0, 1.12, -0.44);   // B29 operator stands on the platform
  ud.operatorCfg = { anchor: platA, grip: gripR, spread: 0.16, pose: 'standing', auto: opts.operator, anchors: { platform: platA, stand: platA, grabBar: gripR } };
  return finish(g, P, (dt, t) => { ud.lift = damp(ud.lift, ud.liftT, 4, dt); lift.position.y = ud.lift * 0.12; if (!ud._driven) spinWheels(P.wheels, ud.speed, dt); ud._driven = false; bc.userData.mat.emissiveIntensity = flash(t, 1.5); }, ud);
}

/* ------------------------------------------------------------------ walkie stacker */
/**
 * createWalkieStacker({autoLift:true})  pedestrian stacker with straddle legs + tiller (ref imgref/15). Forks toward +Z.
 * parts: mast, innerMast, carriage, forks[], tiller, powerUnit, wheels[], legs[] ; userData: setForkHeight(h 0..1.8), setTiller(rad)
 */
export function createWalkieStacker(opts = {}) {
  const g = grp(null, 'walkieStacker'), b = grp(g, 'body', 0, 0, -0.35), P = {}, Y = mat(PALETTE.forkYellow, { roughness: 0.75 }), K = mat(0x1c2028), C = M.charcoal;
  const pu = P.powerUnit = grp(b, 'powerUnit', 0, 0, -0.3);
  add(pu, rbox(0.8, 0.95, 0.55, 0.14), Y, 0, 0.55, 0, 0, 0, 0, 'housing');
  add(pu, rbox(0.82, 0.12, 0.57, 0.05), C, 0, 0.12, 0); add(pu, rbox(0.6, 0.05, 0.4, 0.02), C, 0, 1.04, 0, 0, 0, 0, 'lid');
  add(pu, rbox(0.3, 0.16, 0.03, 0.02), glowMat(0x7fc4ff, 0.6), 0, 0.85, -0.28, 0, 0, 0, 'display');
  P.loadRollers = []; P.legs = [-1, 1].map((s) => { const l = add(b, rbox(0.14, 0.09, 1.05, 0.03), Y, s * 0.4, 0.07, 0.55, 0, 0, 0, 'straddleLeg'); const rl = add(b, roundCyl(0.045, 0.08, 0.01, 12, 'x'), mat(0x8a94a3), s * 0.4, 0.045, 0.98, 0, 0, 0, 'loadRoller'); rl.userData.radius = 0.045; P.loadRollers.push(rl); return l; });
  const wst = grp(b, 'steerTiller', 0, 0.12, -0.5); wst.userData.wheel = null; P.steer = [wst];          // tiller + drive wheel yaw together
  const til = P.tiller = grp(wst, 'tiller', 0, 0.63, -0.08); til.rotation.x = -0.5;
  add(til, rbox(0.06, 0.75, 0.06, 0.025), C, 0, 0.37, 0); add(til, rbox(0.4, 0.08, 0.12, 0.04), K, 0, 0.78, 0, 0, 0, 0, 'tillerHead');
  for (const s of [-1, 1]) add(til, torus(0.05, 0.015), K, s * 0.22, 0.78, 0, 0, Math.PI / 2);
  add(til, sph(0.03, 10, 8), mat(PALETTE.red), 0, 0.84, 0.04, 0, 0, 0, 'emergencyButton');
  const wdw = wheelSet(wst, [{ x: 0, y: 0, z: 0, r: 0.12, w: 0.08, hub: 0x8a94a3, name: 'driveWheel' }]);
  const mast = makeMast({ H0: 1.75, half: 0.3, maxH: 1.8, backrest: 0.95, forkSpread: 0.22 });
  const mp = grp(b, 'mastPivot', 0, 0.02, 0.0); mp.add(mast.root);
  P.mast = mast.root; P.innerMast = mast.inner; P.carriage = mast.carriage; P.forks = mast.forks;
  P.wheels = [...wdw, ...P.loadRollers];
  const ud = { autoLift: opts.autoLift ?? true, tiller: -0.5, steer: 0, speed: 0, maxForkHeight: 1.8 };
  ud.setForkHeight = (h, snap = false) => { ud.autoLift = false; mast.set(h); if (snap) mast.snap(); }; ud.setTiller = (r) => { ud.tiller = r; };
  ud.rearSteer = true; ud.steerRate = 2.5; ud.setSteer = (r) => { ud.steer = THREE.MathUtils.clamp(r, -1.2, 1.2); applyAckermann(P.steer, ud.steer, 1.48, 0.63, -1); }; ud.setSpeed = (v) => { ud.speed = v; };
  ud.kin = { refZ: 0.63, L: 1.48, maxSteer: 1.2, tractorWheels: kinWheels(g, P.wheels) };
  const gripW = grp(til, 'tillerGrip', 0, 0.78, 0); gripW.rotation.y = Math.PI; const standW = grp(wst, 'anchorStand', 0, -0.12, -1.0);   // B29 walking operator, follows steer
  ud.operatorCfg = { anchor: standW, grip: gripW, spread: 0.22, pose: 'walking-tiller', auto: opts.operator, anchors: { stand: standW, tillerGrip: gripW } };
  addForkApi(g, ud, mast); if (!ud.getForkHeight) ud.getForkHeight = () => mast.st.h; if (ud.setLoad) ud.setLoad(!!opts.load);
  return finish(g, P, (dt, t) => { if (ud.autoLift) autoCycle(ud, mast, 1.4, dt); mast.step(dt);
    if (!ud._driven) spinWheels(P.wheels, ud.speed, dt); ud._driven = false; til.rotation.x = damp(til.rotation.x, ud.tiller, 3, dt); }, ud);
}

/* ------------------------------------------------------------------ AMR (goods-to-person robot) */
/**
 * createAMR({withPod:false, carrying:false, podSeed})  low charcoal drive unit 0.76 x 0.33 x 0.9 m with green light strip.
 * parts: body, lightStrip, liftPlate, turntable, wheels[], sensor, statusLed, pod (if withPod)
 * userData: setCarrying(bool) (raises lift plate +5 cm and the pod with it), setSpeed(v), setStripColor(hex)
 */
export function createAMR(opts = {}) {
  const g = grp(null, 'amr'), P = {}, C = M.charcoal, K = mat(0x1c2028);
  P.body = add(g, rbox(0.76, 0.24, 0.9, 0.07), C, 0, 0.16, 0, 0, 0, 0, 'body');
  add(g, rbox(0.78, 0.07, 0.92, 0.03), K, 0, 0.065, 0, 0, 0, 0, 'bumper');
  const strip = glowMat(PALETTE.emerald, 1.2); P.lightStrip = add(g, rbox(0.786, 0.028, 0.926, 0.014), strip, 0, 0.205, 0, 0, 0, 0, 'lightStrip');
  add(g, rbox(0.68, 0.03, 0.82, 0.015), mat(0x4a5260), 0, 0.29, 0, 0, 0, 0, 'topDeck');
  const lp = P.liftPlate = grp(g, 'liftPlate', 0, 0.3, 0);
  P.turntable = add(lp, roundCyl(0.26, 0.04, 0.012, 32), mat(0x8a94a3, { roughness: 0.7 }), 0, 0.02, 0, 0, 0, 0, 'turntable');
  add(lp, torus(0.2, 0.008, 6, 32), mat(PALETTE.spark), 0, 0.041, 0, Math.PI / 2, 0, 0, 'turntableRing');
  add(lp, rbox(0.04, 0.008, 0.12, 0.003), mat(PALETTE.spark), 0, 0.043, 0.1);
  P.sensor = add(g, rbox(0.42, 0.07, 0.02, 0.02), mat(0x0d1015, { roughness: 0.3 }), 0, 0.15, 0.455, 0, 0, 0, 'sensor');
  for (const s of [-1, 1]) add(g, sph(0.018, 10, 8), glowMat(0x7fe7ff, 1.0), s * 0.12, 0.15, 0.465, 0, 0, 0, 'eye');
  const led = glowMat(PALETTE.emerald, 1.5); P.statusLed = add(g, sph(0.022, 10, 8), led, 0.3, 0.29, 0.38, 0, 0, 0, 'statusLed');
  decal(g, sparkTex(), 0.14, 0.14, -0.22, 0.306, 0.3, 0).rotation.x = -Math.PI / 2;
  P.wheels = wheelSet(g, [-1, 1].map((s) => ({ x: s * 0.39, z: 0, r: 0.075, w: 0.05, hub: 0x5a6372, name: 'driveWheel' })));
  for (const x of [-0.28, 0.28]) for (const z of [-0.36, 0.36]) add(g, sph(0.03, 10, 8), K, x, 0.03, z, 0, 0, 0, 'caster');
  if (opts.withPod) {
    const pod = P.pod = grp(g, 'pod', 0, 0, 0); const S = mat(0x9aa3ad), fr = mat(0x3d4552), r = rng(opts.podSeed ?? 3);
    const binCols = [0x0071ce, 0x4f9be6, PALETTE.spark, 0x7fb6ee];
    for (const x of [-0.47, 0.47]) for (const z of [-0.47, 0.47]) add(pod, rbox(0.05, 2.0, 0.05, 0.015), fr, x, 1.0, z, 0, 0, 0, 'podLeg');
    add(pod, rbox(0.96, 0.05, 0.96, 0.02), fr, 0, 0.37, 0, 0, 0, 0, 'podBase');
    for (let l = 0; l < 4; l++) {
      const y = 0.4 + l * 0.4; add(pod, rbox(0.96, 0.025, 0.96, 0.01), S, 0, y, 0, 0, 0, 0, 'podShelf');
      const n = 2 + Math.floor(r() * 2), w = 0.9 / n;
      for (let i = 0; i < n; i++) for (const z of [-0.23, 0.23]) {
        const c = binCols[Math.floor(r() * binCols.length)], h = 0.22 + r() * 0.1;
        add(pod, rbox(w - 0.03, h, 0.44, 0.03), mat(c, { roughness: 0.85 }), -0.45 + w * (i + 0.5), y + 0.0125 + h / 2, z);
        add(pod, rbox(w * 0.4, 0.05, 0.01, 0.004), mat(0xf7f7f2), -0.45 + w * (i + 0.5), y + h * 0.7, z + 0.225);
      }
    }
    add(pod, rbox(0.96, 0.025, 0.96, 0.01), S, 0, 2.0, 0);
  }
  const ud = { carrying: !!opts.carrying, lift: opts.carrying ? 1 : 0, speed: 0 };
  ud.setCarrying = (b) => { ud.carrying = !!b; }; ud.setSpeed = (v) => { ud.speed = v; };
  ud.setStripColor = (c) => { strip.color.set(c); strip.emissive.set(c); led.color.set(c); led.emissive.set(c); };
  return finish(g, P, (dt, t) => {
    ud.lift = damp(ud.lift, ud.carrying ? 1 : 0, 5, dt); lp.position.y = 0.3 + ud.lift * 0.05; if (P.pod) P.pod.position.y = ud.lift * 0.05;
    if (!ud.carrying) P.turntable.rotation.y += dt * 0.8;
    strip.emissiveIntensity = 0.6 + 0.9 * (0.5 + 0.5 * Math.sin(t * 3)); led.emissiveIntensity = Math.sin(t * 5) > 0 ? 2 : 0.4;
    spinWheels(P.wheels, ud.speed, dt);
  }, ud);
}

/* ------------------------------------------------------------------ robot arm */
/**
 * createRobotArm({autoPick:true})  6-axis-style industrial arm (shown as base yaw + shoulder + elbow + wrist + gripper), ~1.9 m tall.
 * parts: base, baseYaw (joint), shoulder (joint), elbow (joint), wrist (joint), gripper, fingerLeft, fingerRight, payload
 * userData: setPose({yaw, shoulder, elbow, wrist, grip}) (disables autoPick), autoPick, reach (IK helper reachTo(r, h) -> angles)
 */
export function createRobotArm(opts = {}) {
  const g = grp(null, 'robotArm'), P = {}, Y = mat(PALETTE.mustard, { roughness: 0.75 }), C = M.charcoal, K = mat(0x1c2028);
  P.base = grp(g, 'base');
  add(P.base, rbox(0.75, 0.06, 0.75, 0.03), K, 0, 0.03, 0); add(P.base, roundCyl(0.34, 0.12, 0.04, 32), C, 0, 0.12, 0);
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; add(P.base, sph(0.025, 8, 6), M.steel, Math.cos(a) * 0.3, 0.07, Math.sin(a) * 0.3); }
  const yaw = P.baseYaw = grp(g, 'baseYaw', 0, 0.18, 0);
  add(yaw, roundCyl(0.27, 0.3, 0.06, 32), Y, 0, 0.15, 0, 0, 0, 0, 'turret');
  add(yaw, rbox(0.46, 0.34, 0.4, 0.13), Y, 0, 0.42, -0.02, 0, 0, 0, 'shoulderHousing');
  add(yaw, rbox(0.2, 0.18, 0.12, 0.05), C, 0, 0.3, -0.22, 0, 0, 0, 'motorPack');
  const sh = P.shoulder = grp(yaw, 'shoulder', 0, 0.5, 0);
  add(sh, roundCyl(0.17, 0.5, 0.05, 28, 'x'), C, 0, 0, 0, 0, 0, 0, 'shoulderJoint');
  add(sh, roundCyl(0.08, 0.52, 0.02, 20, 'x'), mat(PALETTE.spark), 0, 0, 0);
  const L1 = 0.9, L2 = 0.78, LG = 0.3;
  add(sh, rbox(0.24, L1, 0.26, 0.11), Y, 0, L1 / 2, 0, 0, 0, 0, 'upperArm');
  add(sh, rbox(0.25, 0.05, 0.27, 0.02), C, 0, L1 * 0.55, 0);
  const el = P.elbow = grp(sh, 'elbow', 0, L1, 0);
  add(el, roundCyl(0.13, 0.36, 0.04, 24, 'x'), C, 0, 0, 0, 0, 0, 0, 'elbowJoint');
  add(el, rbox(0.18, L2, 0.2, 0.085), Y, 0, L2 / 2, 0, 0, 0, 0, 'forearm');
  add(el, cyl(0.02, 0.02, L2 * 0.7, 8), K, 0.1, L2 * 0.45, 0, 0, 0, 0, 'cable');
  const wr = P.wrist = grp(el, 'wrist', 0, L2, 0);
  add(wr, roundCyl(0.085, 0.24, 0.025, 20, 'x'), C, 0, 0, 0, 0, 0, 0, 'wristJoint');
  add(wr, roundCyl(0.07, 0.08, 0.02, 20), Y, 0, 0.08, 0);
  const gr = P.gripper = grp(wr, 'gripper', 0, 0.13, 0);
  add(gr, rbox(0.26, 0.07, 0.12, 0.03), C, 0, 0.0, 0, 0, 0, 0, 'palm');
  P.fingerLeft = add(gr, rbox(0.035, 0.16, 0.09, 0.012), M.steel, -0.08, 0.11, 0, 0, 0, 0, 'fingerLeft');
  P.fingerRight = add(gr, rbox(0.035, 0.16, 0.09, 0.012), M.steel, 0.08, 0.11, 0, 0, 0, 0, 'fingerRight');
  P.payload = makeCarton(gr, 0.13, 0.12, 0.13, 0, 0.1, 0, 2); P.payload.rotation.x = Math.PI; P.payload.position.y = 0.22; P.payload.visible = false; P.payload.name = 'payload';
  const statusL = glowMat(PALETTE.emerald, 1.2); add(yaw, sph(0.03, 10, 8), statusL, 0.16, 0.62, 0.17, 0, 0, 0, 'statusLight');
  const ud = { autoPick: opts.autoPick ?? true, L1, L2: L2 + 0.13 + LG };
  /** 2-link IK in the arm plane: r forward, h height (of gripper tip) relative to ground. */
  ud.reachTo = (r, h) => {
    const hs = 0.68, dz = r, dy = h + ud.L2 * 0 - hs; // wrist target = tip + gripper length (gripper points down)
    const wy = dy + LG + 0.13, d = Math.min(Math.hypot(dz, wy), L1 + L2 - 1e-3);
    const beta = Math.acos(THREE.MathUtils.clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1));
    const gamma = Math.atan2(dz, wy), alpha = Math.acos(THREE.MathUtils.clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
    const s = gamma - alpha, e = Math.PI - beta; return { shoulder: s, elbow: e, wrist: Math.PI - s - e };
  };
  const pose = (p) => { if (p.yaw !== undefined) yaw.rotation.y = p.yaw; if (p.shoulder !== undefined) sh.rotation.x = p.shoulder; if (p.elbow !== undefined) el.rotation.x = p.elbow;
    if (p.wrist !== undefined) wr.rotation.x = p.wrist; if (p.grip !== undefined) { const o = 0.05 + 0.05 * (1 - p.grip); P.fingerLeft.position.x = -o - 0.015; P.fingerRight.position.x = o + 0.015; } };
  ud.setPose = (p) => { ud.autoPick = false; pose(p); };
  // keyframes: [time, yaw, r, h, grip, payloadVisible]
  const K_ = [[0, -0.9, 0.9, 0.75, 0], [1.0, -0.9, 0.95, 0.3, 0], [1.5, -0.9, 0.95, 0.3, 1], [2.3, -0.9, 0.8, 0.8, 1], [3.6, 0.9, 0.85, 0.8, 1], [4.4, 0.9, 0.95, 0.35, 1], [4.9, 0.9, 0.95, 0.35, 0], [5.7, 0.9, 0.8, 0.8, 0], [7.0, -0.9, 0.9, 0.75, 0]];
  pose({ yaw: -0.9, ...ud.reachTo(0.9, 0.75), grip: 0 });
  return finish(g, P, (dt, t) => {
    statusL.emissiveIntensity = 0.8 + 0.6 * Math.sin(t * 3) ** 2;
    if (!ud.autoPick) return;
    const T = t % 7; let i = 0; while (i < K_.length - 2 && T > K_[i + 1][0]) i++;
    const a = K_[i], b = K_[i + 1], f = ease(THREE.MathUtils.clamp((T - a[0]) / (b[0] - a[0]), 0, 1)), lerp = (k) => a[k] + (b[k] - a[k]) * f;
    const ik = ud.reachTo(lerp(2), lerp(3)); pose({ yaw: lerp(1), ...ik, grip: lerp(4) });
    P.payload.visible = (T > 1.45 && T < 4.85);
  }, ud);
}

/* ------------------------------------------------------------------ worker */
/**
 * createWorker({vest:'yellow'|'blue', hardHat:true, walking:false, walkSpeed:1.3, seed})  1.75 m capsule person.
 * parts: body (bobbing root), torso, vest, head, hardHat, armLeft, armRight, legLeft, legRight (pivot groups at shoulder/hip)
 * userData: setWalking(bool), walkSpeed (m/s, sets cadence), walkCycle(phase) (pose at phase radians), setWave(bool)
 */
const UPPER = 0.27, FORE = 0.29;   // arm bones (shoulder->elbow, elbow->hand), total reach 0.56 m
export function createWorker(opts = {}) {
  const vestC = opts.vest === 'blue' ? PALETTE.blue : 0xd8ef1f, shirt = opts.vest === 'blue' ? 0xe4e8ee : 0x2a3f63, pants = 0x1f2f4f;
  const g = grp(null, 'worker'), P = {}, body = P.body = grp(g, 'body'), skin = mat(PALETTE.skin, { roughness: 0.8 });
  const r = rng(opts.seed ?? 5), skinTones = [0xf0c3a0, 0xd9a27c, 0xa8714f, 0x7a4f35]; const sk = mat(skinTones[Math.floor(r() * 4)], { roughness: 0.8 });
  const shoes = [], legs = [-1, 1].map((s) => { const hip = grp(body, s < 0 ? 'legLeft' : 'legRight', s * 0.095, 0.9, 0);
    add(hip, cap(0.07, 0.72, 14), mat(pants), 0, -0.43, 0);
    shoes.push(add(hip, rbox(0.12, 0.08, 0.25, 0.035), mat(0x1c2028), 0, -0.86, 0.04, 0, 0, 0, 'shoe')); return hip; });
  P.legLeft = legs[0]; P.legRight = legs[1];
  add(body, rbox(0.32, 0.18, 0.2, 0.08), mat(pants), 0, 0.96, 0, 0, 0, 0, 'pelvis');
  P.torso = add(body, rbox(0.36, 0.52, 0.22, 0.1), mat(shirt), 0, 1.24, 0, 0, 0, 0, 'torso');
  const vest = P.vest = grp(body, 'vest'); const vm = mat(vestC, { roughness: 0.8 }), refl = mat(0xe8edf2, { roughness: 0.4, emissive: 0x666a70, ei: 0.4 });
  add(vest, rbox(0.39, 0.44, 0.25, 0.11), vm, 0, 1.22, 0);
  for (const y of [1.08, 1.17]) add(vest, rbox(0.396, 0.03, 0.256, 0.012), refl, 0, y, 0, 0, 0, 0, 'reflectiveStripe');
  for (const s of [-1, 1]) add(vest, rbox(0.035, 0.44, 0.258, 0.012), refl, s * 0.09, 1.23, 0, 0, 0, 0, 'reflectiveStrap');
  add(vest, rbox(0.02, 0.38, 0.01, 0.005), mat(0x777f88), 0, 1.22, 0.127, 0, 0, 0, 'zip');
  add(body, cyl(0.045, 0.05, 0.08, 12), sk, 0, 1.52, 0, 0, 0, 0, 'neck');
  const head = P.head = grp(body, 'head', 0, 1.66, 0);
  add(head, sph(0.12, 24, 18), sk, 0, 0, 0, 0, 0, 0, 'face');
  // toy face: two dark eyes with a tiny catch-light, and a small smile arc; all sit just proud of the 0.12 m head sphere (no z-fighting)
  for (const s of [-1, 1]) { add(head, sph(0.019, 12, 8), mat(0x1c2028, { roughness: 0.5 }), s * 0.042, 0.012, 0.106, 0, 0, 0, 'eye').scale.set(1, 1.15, 0.6);
    add(head, sph(0.0055, 6, 4), mat(0xffffff), s * 0.042 + 0.006, 0.019, 0.1175, 0, 0, 0, 'eyeGlint'); }
  add(head, cached(_geo, 'smile', () => new THREE.TorusGeometry(0.03, 0.0065, 6, 14, Math.PI * 0.8)), mat(0x7a3b2e, { roughness: 0.7 }), 0, -0.028, 0.104, -0.28, 0, Math.PI * 1.1, 'smile');
  add(head, sph(0.03, 8, 6), sk, 0, -0.01, 0.115).scale.set(0.8, 0.7, 0.6);
  if (opts.hardHat !== false) { const hat = P.hardHat = grp(head, 'hardHat', 0, 0.035, 0); const hm = mat(opts.vest === 'blue' ? PALETTE.spark : 0xf4f5f7, { roughness: 0.6 });
    add(hat, dome(0.132), hm, 0, 0, 0); add(hat, roundCyl(0.15, 0.02, 0.008, 28), hm, 0, 0.005, 0.02); add(hat, rbox(0.03, 0.03, 0.22, 0.012), hm, 0, 0.125, 0, 0, 0, 0, 'ridge'); }
  else add(head, dome(0.125), mat(0x3a2a1e), 0, 0.02, -0.01, -0.25, 0, 0, 'hair');
  const arms = [-1, 1].map((s) => { const sp = grp(body, s < 0 ? 'armLeft' : 'armRight', s * 0.235, 1.44, 0); sp.rotation.z = s * 0.08;
    add(sp, cap(0.058, 0.22, 12), vm, 0, -0.13, 0, 0, 0, 0, 'sleeve');
    const el = grp(sp, 'elbow', 0, -UPPER, 0); sp.userData.elbow = el;                                  // two-bone arm: shoulder -> elbow -> hand
    add(el, cap(0.05, 0.3, 12), mat(shirt), 0, -0.06, 0, 0, 0, 0, 'forearm');
    sp.userData.hand = add(el, sph(0.055, 12, 10), sk, 0, -FORE, 0, 0, 0, 0, 'hand'); return sp; });
  P.armLeft = arms[0]; P.armRight = arms[1];
  const ud = { walking: !!opts.walking, walkSpeed: opts.walkSpeed ?? 1.3, phase: r() * 6, w: opts.walking ? 1 : 0, wave: false };
  ud.walkCycle = (ph, k = 1) => {
    const s = Math.sin(ph), kl = k * (ud.stride ?? 1); legs[0].rotation.x = s * 0.5 * kl; legs[1].rotation.x = -s * 0.5 * kl;
    arms[0].rotation.x = -s * 0.45 * k; arms[1].rotation.x = s * 0.45 * k;
    for (const a of arms) a.userData.elbow.rotation.set(-0.15 - 0.15 * k * (1 + Math.sin(ph)) * 0.5, 0, 0);
    body.position.y = 0; body.rotation.x = ud.lean || 0; body.rotation.y = s * 0.06 * k; head.rotation.y = -s * 0.04 * k; plant();
  };
  // keep the lowest sole exactly on y=0 (stance foot planted; gives a natural bob)
  const _inv = new THREE.Matrix4(), _mm = new THREE.Matrix4(), _p = new THREE.Vector3();
  function plant() { body.position.y = 0; g.updateMatrixWorld(true); _inv.copy(g.matrixWorld).invert(); let lo = Infinity;
    for (const sh of shoes) { _mm.multiplyMatrices(_inv, sh.matrixWorld); const pos = sh.geometry.attributes.position;
      for (let i = 0; i < pos.count; i += 3) { _p.fromBufferAttribute(pos, i).applyMatrix4(_mm); if (_p.y < lo) lo = _p.y; } }
    body.position.y = -lo; }
  ud.setWalking = (b) => { ud.walking = !!b; }; ud.setWave = (b) => { ud.wave = !!b; };
  // hands rig: attachHandsTo(obj, spread) puts the hands at obj's local (+-spread, 0, 0) (e.g. anchors.tillerGrip / a
  // steering-wheel anchor); attachHandsTo([objA, objB]) puts one hand on each. Arms aim (and stretch slightly) every frame.
  const _hv = new THREE.Vector3(), _hs = [new THREE.Vector3(), new THREE.Vector3()], _bi = new THREE.Matrix4(), _q = new THREE.Quaternion(), _dn = new THREE.Vector3(0, -1, 0);
  ud.hands = null;
  // one: 0|1 -> only that arm grips (at the grip centre), the other swings free.  Two-bone IK, elbow pole = down/out/back;
  // if the grip is beyond full reach the arm straightens and stretches (ud.armStretch = distance / 0.56 reported per arm).
  ud.attachHandsTo = (obj, spread = 0.08, one = null) => { ud.hands = obj ? { objs: Array.isArray(obj) ? obj : [obj], spread, one } : null;
    arms.forEach((a, i) => { a.scale.set(1, 1, 1); a.rotation.set(0, 0, i ? 0.08 : -0.08); a.userData.elbow.rotation.set(-0.15, 0, 0); }); return g; };
  const _e = new THREE.Vector3(), _pl = new THREE.Vector3(), _f = new THREE.Vector3(), _qi = new THREE.Quaternion(); ud.armStretch = [1, 1];
  const ik = (a, i, tgt) => { _hv.copy(tgt).sub(a.position); const d = _hv.length(), R = UPPER + FORE, dc = THREE.MathUtils.clamp(d, 0.12, R - 1e-4); ud.armStretch[i] = d / R;
    const dir = _hv.normalize(); _pl.set((i ? 1 : -1) * 0.55, -1, -0.45); _pl.addScaledVector(dir, -_pl.dot(dir)); if (_pl.lengthSq() < 1e-6) _pl.set(0, 0, -1); _pl.normalize();
    const cA = THREE.MathUtils.clamp((UPPER * UPPER + dc * dc - FORE * FORE) / (2 * UPPER * dc), -1, 1), sA = Math.sqrt(1 - cA * cA);
    _e.copy(dir).multiplyScalar(cA * UPPER).addScaledVector(_pl, sA * UPPER);                                  // elbow in body space (rel. shoulder)
    _q.setFromUnitVectors(_dn, _f.copy(_e).normalize()); a.quaternion.copy(_q); const st = Math.max(1, d / R); a.scale.set(1, st, 1);
    _f.copy(dir).multiplyScalar(dc).sub(_e).normalize().applyQuaternion(_qi.copy(_q).invert()); a.userData.elbow.quaternion.setFromUnitVectors(_dn, _f); };
  ud.detachHands = () => ud.attachHandsTo(null);
  ud.aimHands = () => { const h = ud.hands; if (!h) return; const o = h.objs;
    o.forEach((x) => x.updateWorldMatrix(true, false)); body.updateWorldMatrix(true, false); _bi.copy(body.matrixWorld).invert();
    if (o.length === 1) { _hs[0].set(-h.spread, 0, 0).applyMatrix4(o[0].matrixWorld); _hs[1].set(h.spread, 0, 0).applyMatrix4(o[0].matrixWorld); }
    else { _hs[0].setFromMatrixPosition(o[0].matrixWorld); _hs[1].setFromMatrixPosition(o[1].matrixWorld); }
    _hs[0].applyMatrix4(_bi); _hs[1].applyMatrix4(_bi);
    if (h.one != null) { _hs[0].add(_hs[1]).multiplyScalar(0.5); ik(arms[h.one], h.one, _hs[0]); return; }
    const lo = _hs[0].x <= _hs[1].x ? 0 : 1; arms.forEach((a, i) => ik(a, i, _hs[i === 0 ? lo : 1 - lo]));
  };
  ud.getHandPositions = () => arms.map((a) => a.userData.hand.getWorldPosition(new THREE.Vector3()));
  return finish(g, P, (dt, t) => {
    ud.w = damp(ud.w, ud.walking ? 1 : 0, 6, dt); ud.phase += dt * (ud.walkSpeed / 0.75) * Math.PI * ud.w;
    ud.walkCycle(ud.phase, ud.w);
    if (ud.w < 0.99) { const k = 1 - ud.w; P.torso.scale.y = 1 + Math.sin(t * 1.8) * 0.01 * k; arms[0].rotation.x += Math.sin(t * 1.1) * 0.05 * k; }
    if (ud.wave) { arms[1].rotation.x = -2.6; arms[1].rotation.z = 0.3 + Math.sin(t * 8) * 0.3; } else arms[1].rotation.z = 0.08;
    if (ud.hands) ud.aimHands();
  }, ud);
}

/**
 * createOperator({pose:'seated'|'standing'|'walking-tiller'|'pushing-tiller', vest, hardHat, seed})
 * walking-tiller = PULLING (walks ahead of the truck facing away from it, one hand behind on the tiller, leans away from the
 * load in proportion to speed); pushing-tiller = faces the truck, both hands on the handle, short shuffle steps.  vehicle operator in the worker style
 * (hi-vis vest, hard hat). Origin: standing = between the soles; seated = seat-cushion contact point (hip joints 8 cm above),
 * facing +Z. 'walking-tiller' runs the walk cycle from the figure's own world motion (cadence follows speed, stops when the
 * truck stops). Same parts/API as createWorker plus: setPose(pose, {lean}), pose, motionSpeed, attachHandsTo(obj|[a,b], spread),
 * detachHands(), getHandPositions(). Normally attached with vehicle.userData.attachOperator(op).
 */
export function createOperator(opts = {}) {
  const w = createWorker({ vest: opts.vest ?? 'yellow', hardHat: opts.hardHat ?? true, seed: opts.seed ?? 7 });
  w.name = 'operator'; const ud = w.userData, P = ud.parts, body = P.body, baseUpdate = ud.update, pm = mat(0x1f2f4f), hips = [P.legLeft, P.legRight];
  const standKids = hips.map((h) => [...h.children]).flat();
  const seatLegs = hips.map((hip) => { const sl = grp(hip, 'seatedLeg'); add(sl, cap(0.075, 0.36, 12), pm, 0, 0, 0.2, Math.PI / 2, 0, 0, 'thigh');
    const knee = grp(sl, 'knee', 0, 0, 0.42); add(knee, cap(0.065, 0.34, 12), pm, 0, -0.22, 0, 0, 0, 0, 'shin'); add(knee, rbox(0.12, 0.08, 0.25, 0.035), mat(0x1c2028), 0, -0.44, 0.06, 0, 0, 0, 'shoe'); return sl; });
  const HIP = 0.9, SEAT_H = 0.08; let lean = 0;
  const sitPose = () => { body.rotation.set(lean, 0, 0); body.position.set(0, SEAT_H - HIP * Math.cos(lean), -HIP * Math.sin(lean)); hips.forEach((h) => h.rotation.set(-lean, 0, 0)); };
  ud.setPose = (p, o = {}) => { ud.pose = p; const sit = p === 'seated'; lean = sit ? (o.lean ?? 0.15) : 0;
    seatLegs.forEach((x) => { x.visible = sit; }); standKids.forEach((c) => { c.visible = !sit; });
    if (sit) sitPose(); else { body.rotation.set(0, 0, 0); hips.forEach((h) => h.rotation.set(0, 0, 0)); } ud.stride = 1; return w; };
  const prev = new THREE.Vector3(), cur = new THREE.Vector3(), fwd = new THREE.Vector3(); let has = false; ud.motionSpeed = 0;
  ud.update = (dt, t) => {
    if (ud.pose === 'seated') { sitPose(); P.torso.scale.y = 1 + Math.sin(t * 1.8) * 0.008; P.head.rotation.y = Math.sin(t * 0.4) * 0.2;
      if (ud.hands) ud.aimHands(); else P.armLeft.rotation.x = P.armRight.rotation.x = -0.8; return; }
    w.updateWorldMatrix(true, false); cur.setFromMatrixPosition(w.matrixWorld);
    if (has && dt > 0) { fwd.set(0, 0, 1).transformDirection(w.matrixWorld); const v = prev.sub(cur).multiplyScalar(-1).dot(fwd) / dt; ud.motionSpeed = damp(ud.motionSpeed, v, 8, dt); }
    prev.copy(cur); has = dt > 0 || has;
    const a = Math.abs(ud.motionSpeed);
    if (ud.pose === 'walking-tiller') { ud.walking = a > 0.05; ud.walkSpeed = Math.max(0.5, a); ud.stride = 1; ud.lean = damp(ud.lean || 0, Math.min(0.12, 0.1 * a), 4, dt); }        // pulling: lean away from the load
    else if (ud.pose === 'pushing-tiller') { ud.walking = a > 0.05; ud.walkSpeed = Math.max(0.6, a) * 1.7; ud.stride = 0.5; ud.lean = damp(ud.lean || 0, Math.min(0.1, 0.08 * a), 4, dt); } // short shuffle steps, lean in
    else { ud.walking = false; ud.lean = damp(ud.lean || 0, 0, 4, dt); }
    baseUpdate(dt, t);
  };
  ud.setPose(opts.pose ?? 'standing'); return w;
}

/* ------------------------------------------------------------------ pallet rack bay */
/**
 * createRackBay({levels:[1.55,3.1,4.65,6.2], height:7.0, width:2.7, depth:1.1, fill:true, seed, frames:'both'|'left'})
 * Blue uprights with diagonal bracing, orange step beams, wire decks, mixed loads (wrapped cartons, blue/black totes, pallet variants).
 * Origin ground centre, aisle (beam face) toward +Z. parts: uprights[], beams[], decks[], loads[]
 */
export function createRackBay(opts = {}) {
  const W = opts.width ?? 2.7, D = opts.depth ?? 1.1, H = opts.height ?? 7.0, levels = opts.levels ?? [1.55, 3.1, 4.65, 6.2];
  const g = grp(null, 'rackBay'), P = { uprights: [], beams: [], decks: [], loads: [] };
  const U = mat(PALETTE.rackBlue, { roughness: 0.7 }), O = mat(PALETTE.beamOrange, { roughness: 0.7 }), Gr = mat(0xaab2bc, { roughness: 0.6 });
  const wire = mat(0xffffff, { map: wireDeckTex(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6 });
  const frames = opts.frames === 'left' ? [-1] : [-1, 1];
  for (const s of frames) {
    const x = s * (W / 2 + 0.05), fr = grp(g, 'upright'); P.uprights.push(fr);
    for (const z of [-D / 2, D / 2]) { add(fr, rbox(0.09, H, 0.075, 0.02), U, x, H / 2, z, 0, 0, 0, 'post'); add(fr, rbox(0.16, 0.015, 0.14, 0.005), Gr, x, 0.008, z, 0, 0, 0, 'basePlate'); }
    add(fr, rbox(0.12, 0.32, 0.1, 0.03), mat(PALETTE.spark), x, 0.17, D / 2 + 0.02, 0, 0, 0, 'postGuard');
    const n = Math.round(H / 1.0); for (let i = 0; i <= n; i++) { const y = 0.15 + i * (H - 0.3) / n;
      add(fr, rbox(0.035, 0.035, D, 0.012), U, x, y, 0);
      if (i < n) { const y2 = 0.15 + (i + 1) * (H - 0.3) / n; strut(fr, [x, y, (i % 2 ? 1 : -1) * D / 2], [x, y2, (i % 2 ? -1 : 1) * D / 2], 0.03, U, 'brace'); } }
  }
  const r = rng(opts.seed ?? 11), tags = labelTex('A-01', '#ffffff', '#041E42');
  const loadAt = (y, maxH) => {
    for (const x of [-W / 4 - 0.02, W / 4 + 0.02]) {
      const kind = r(); if (kind < 0.12 && opts.fill !== false) continue;
      if (opts.fill === false) continue;
      const variant = r() < 0.6 ? 'pine' : r() < 0.7 ? 'blueWood' : 'steel';
      const L = kind < 0.62 ? createPallet({ variant, load: 'cartons', wrap: r() < 0.6, seed: Math.floor(r() * 1e6), maxHeight: maxH })
        : createPallet({ variant, load: 'totes', toteColor: r() < 0.55 ? 'blue' : 'black', maxHeight: maxH });
      L.position.set(x, y > 0 ? y + 0.006 : 0, 0); g.add(L); P.loads.push(L);
    }
  };
  loadAt(0, Math.min(1.3, levels[0] - 0.4));
  levels.forEach((y, li) => {
    for (const z of [-D / 2, D / 2]) { add(g, rbox(W + 0.02, 0.13, 0.055, 0.02), O, 0, y - 0.065, z, 0, 0, 0, 'beam'); P.beams.push(g.children[g.children.length - 1]); }
    for (const s of frames) for (const z of [-D / 2, D / 2]) add(g, rbox(0.06, 0.18, 0.07, 0.015), O, s * (W / 2 + 0.01), y - 0.07, z, 0, 0, 0, 'beamConnector');
    for (let k = 0; k < 3; k++) add(g, rbox(0.03, 0.04, D, 0.01), Gr, -W / 3 + k * W / 3, y - 0.026, 0, 0, 0, 0, 'deckSupport');
    const dk = new THREE.Mesh(plane(W, D), wire); dk.rotation.x = -Math.PI / 2; dk.position.set(0, y + 0.004, 0); dk.name = 'wireDeck'; dk.receiveShadow = dk.castShadow = true; g.add(dk); P.decks.push(dk);
    for (const x of [-W / 4, W / 4]) decal(g, tags, 0.2, 0.1, x, y - 0.07, D / 2 + 0.03, 0, 'locationLabel');
    const next = levels[li + 1] ?? (H + 0.6); loadAt(y, Math.min(1.3, next - y - 0.35));
  });
  return finish(g, P, null, { size: { x: W + 0.2, y: H, z: D } });
}
/** Baked rack bay: [{geometry, material}] merged by material (bay-local space) — feed into InstancedMesh yourself. */
export function getRackBayParts(opts = {}) { return bakeGroup(createRackBay(opts)); }
/**
 * createRackBayInstanced(count, {spacing:2.8, ...rackOpts})  count bays as InstancedMeshes (~20 draw calls total).
 * Default layout: a row along +X starting at x=0. Override with userData.setMatrixAt(i, m4) then userData.commit().
 */
export function createRackBayInstanced(count = 6, opts = {}) {
  const g = instancedFrom(getRackBayParts(opts), count, 'rackBayInstanced'), sp = opts.spacing ?? (opts.width ?? 2.7) + 0.1;
  for (let i = 0; i < count; i++) g.userData.setMatrixAt(i, mtx((i - (count - 1) / 2) * sp, 0, 0));
  g.userData.commit(); return g;
}

/* ------------------------------------------------------------------ conveyor */
/**
 * createConveyor({length:4, width:0.7, height:0.85, speed:0.5, totes:0})  belt conveyor running along Z, flow toward +Z.
 * parts: belt (textured), frame, rollers[], legs[], motor, estop ; userData: speed (m/s; scrolls belt + spins end drums), setSpeed(v)
 */
export function createConveyor(opts = {}) {
  const L = opts.length ?? 4, W = opts.width ?? 0.7, H = opts.height ?? 0.85, g = grp(null, 'conveyor'), P = { rollers: [], legs: [] };
  const F = mat(0xc9d1db, { roughness: 0.6 }), C = M.charcoal;
  for (const s of [-1, 1]) { add(g, rbox(0.08, 0.18, L, 0.03), F, s * (W / 2 + 0.05), H - 0.04, 0, 0, 0, 0, 'sideFrame');
    add(g, rbox(0.035, 0.05, L - 0.1, 0.015), mat(PALETTE.spark), s * (W / 2 + 0.07), H + 0.12, 0, 0, 0, 0, 'guideRail');
    for (let i = 0; i <= Math.round(L / 1.0); i++) add(g, rbox(0.025, 0.12, 0.025, 0.008), F, s * (W / 2 + 0.07), H + 0.06, -L / 2 + 0.1 + i * (L - 0.2) / Math.round(L / 1.0)); }
  const tex = beltTex() ? beltTex().clone() : null; if (tex) { tex.needsUpdate = true; tex.repeat.set(1, L / 0.5); }
  const beltM = new THREE.MeshStandardMaterial({ color: 0xffffff, map: tex, roughness: 0.85, metalness: 0 });
  add(g, rbox(W, 0.05, L, 0.02), mat(0x2b3039), 0, H - 0.03, 0, 0, 0, 0, 'beltBody');
  const belt = P.belt = new THREE.Mesh(plane(W - 0.02, L - 0.04), beltM); belt.rotation.x = -Math.PI / 2; belt.position.y = H - 0.004; belt.receiveShadow = true; belt.name = 'belt'; g.add(belt);
  for (const s of [-1, 1]) P.rollers.push(add(g, roundCyl(0.055, W, 0.01, 18, 'x'), mat(0x5a6372, { roughness: 0.6 }), 0, H - 0.03, s * (L / 2 - 0.02), 0, 0, 0, 'endDrum'));
  for (let z = -L / 2 + 0.3; z < L / 2 - 0.2; z += 0.45) P.rollers.push(add(g, roundCyl(0.03, W - 0.04, 0.006, 12, 'x'), M.steel, 0, H - 0.15, z, 0, 0, 0, 'returnRoller'));
  const nLeg = Math.max(2, Math.ceil(L / 1.6) + 1);
  for (let i = 0; i < nLeg; i++) { const z = -L / 2 + 0.2 + i * (L - 0.4) / (nLeg - 1);
    for (const s of [-1, 1]) { P.legs.push(add(g, rbox(0.06, H - 0.12, 0.06, 0.02), C, s * (W / 2 - 0.02), (H - 0.12) / 2, z, 0, 0, 0, 'leg')); add(g, rbox(0.12, 0.02, 0.12, 0.008), C, s * (W / 2 - 0.02), 0.01, z, 0, 0, 0, 'foot'); }
    add(g, rbox(W - 0.02, 0.05, 0.05, 0.015), C, 0, 0.25, z, 0, 0, 0, 'legBrace'); }
  P.motor = grp(g, 'motor', W / 2 + 0.15, H - 0.2, -L / 2 + 0.35); add(P.motor, rbox(0.2, 0.22, 0.3, 0.06), M.blue, 0, 0, 0); add(P.motor, roundCyl(0.08, 0.12, 0.02, 16, 'x'), M.charcoal, -0.13, 0, 0);
  P.estop = grp(g, 'estop', W / 2 + 0.1, H - 0.02, L / 2 - 0.4); add(P.estop, rbox(0.06, 0.1, 0.1, 0.02), mat(PALETTE.spark), 0, 0, 0); add(P.estop, roundCyl(0.03, 0.03, 0.01, 14, 'x'), mat(PALETTE.red), 0.04, 0, 0);
  P.totes = [];
  for (let i = 0; i < (opts.totes ?? 0); i++) { const t = createTote({ color: i % 2 ? 'blue' : 'black', lid: i % 2 === 0, contents: true }); t.position.set(0, H, -L / 2 + 0.5 + i * 1.0); g.add(t); P.totes.push(t); }
  const ud = { speed: opts.speed ?? 0.5 }; ud.setSpeed = (v) => { ud.speed = v; };
  return finish(g, P, (dt) => {
    if (tex) tex.offset.y += (ud.speed * dt) / 0.5;
    for (const r of P.rollers) r.rotation.x += (ud.speed * dt) / 0.05;
    for (const t of P.totes) { t.position.z += ud.speed * dt; if (t.position.z > L / 2 - 0.3) t.position.z -= L - 0.6; }
  }, ud);
}

/* ------------------------------------------------------------------ extra textures */
function hazardTex() { return canvasTex('hazard', 128, 128, (ctx, W) => { ctx.fillStyle = '#FFC220'; ctx.fillRect(0, 0, W, W); ctx.fillStyle = '#1c2028';
  for (let i = -2; i < 4; i++) { ctx.beginPath(); ctx.moveTo(i * 64, 0); ctx.lineTo(i * 64 + 32, 0); ctx.lineTo(i * 64 + 32 + W, W); ctx.lineTo(i * 64 + W, W); ctx.fill(); } }, { repeat: true }); }
function hazardMat(rx, ry) { const t = hazardTex(); if (!t) return mat(PALETTE.spark);
  return cached(_mat, `hz${rx},${ry}`, () => { const c = t.clone(); c.needsUpdate = true; c.repeat.set(rx, ry); return new THREE.MeshStandardMaterial({ map: c, roughness: 0.8, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); }); }
function meshTex() { return canvasTex('mesh', 256, 256, (ctx, W) => { ctx.clearRect(0, 0, W, W); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5;
  for (let i = 0; i <= 8; i++) { const p = i * W / 8; ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, W); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(W, p); ctx.stroke(); } }, { repeat: true }); }
function wordmarkTex(sub) { return canvasTex('wordmark' + (sub || ''), 1024, 288, (ctx, W, H) => { ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#ffffff'; ctx.font = `bold 190px ${FONT}`; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; const tw = ctx.measureText('Walmart').width;
  const x0 = (W - tw - 190) / 2; ctx.fillText('Walmart', x0, H * (sub ? 0.4 : 0.52)); drawSpark(ctx, x0 + tw + 105, H * (sub ? 0.36 : 0.48), 80);
  if (sub) { ctx.fillStyle = '#FFC220'; ctx.font = `600 64px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText(sub, W / 2, H * 0.85); } }); }

/* ------------------------------------------------------------------ dock door */
/**
 * createDockDoor({open:0, label:'D12', doorColor:0xdfe3e8, signal:'red'})  roll-up dock door bay in a wall section.
 * Opening 2.7 m wide x 3.0 m tall, sill at dock height 1.22 m. Wall plane at z=0 (exterior/yard toward +Z, dock floor toward -Z).
 * Exterior: dark seal with hazard-striped pads, bumpers, signal light, dock lamp, label. Interior: platform, leveler, green mat, yellow bollards, yellow dock fan.
 * parts: wall, curtain, slats[], seal, bumpers[], leveler, mat, bollards[], fan, fanBlades, signalRed, signalGreen
 * userData: setOpen(0..1) (rolls slats up into the drum, eased), getOpen(), setSignal('red'|'green')
 */
export function createDockDoor(opts = {}) {
  const OW = 2.7, OH = 3.0, DH = 1.22, WW = 4.2, WH = 5.4, T = 0.3;
  const g = grp(null, 'dockDoor'), P = { slats: [], bumpers: [], bollards: [] }, wallM = mat(0xdcd6c8), conc = mat(0xb9bcc1);
  const wall = P.wall = grp(g, 'wall'), sideW = (WW - OW) / 2;
  for (const s of [-1, 1]) add(wall, rbox(sideW, WH, T, 0.03), wallM, s * (OW / 2 + sideW / 2), WH / 2, 0);
  add(wall, rbox(OW, WH - DH - OH, T, 0.03), wallM, 0, DH + OH + (WH - DH - OH) / 2, 0);
  add(wall, rbox(WW, DH, T, 0.03), conc, 0, DH / 2, 0);
  for (const x of [-WW / 2 + 0.02, WW / 2 - 0.02]) add(wall, rbox(0.04, WH, T + 0.02, 0.01), mat(0xa9a395), x, WH / 2, 0, 0, 0, 0, 'panelSeam');
  add(wall, rbox(WW, 0.12, T + 0.04, 0.03), mat(PALETTE.blue), 0, WH - 0.06, 0, 0, 0, 0, 'coping');
  // exterior seal
  const seal = P.seal = grp(g, 'seal'), sm = mat(0x24282f, { roughness: 0.95 });
  for (const s of [-1, 1]) { add(seal, rbox(0.32, OH + 0.4, 0.36, 0.06), sm, s * (OW / 2 + 0.12), DH + (OH + 0.4) / 2, T / 2 + 0.18, 0, 0, 0, 'sidePad');
    const hz = new THREE.Mesh(plane(0.14, OH * 0.7), hazardMat(1, 8)); hz.position.set(s * (OW / 2 + 0.12), DH + OH * 0.4, T / 2 + 0.362); seal.add(hz); hz.name = 'hazardStripe'; }
  add(seal, rbox(OW + 0.6, 0.55, 0.42, 0.08), sm, 0, DH + OH + 0.25, T / 2 + 0.21, 0, 0, 0, 'headPad');
  for (const s of [-1, 1]) { const b = add(g, rbox(0.26, 0.46, 0.13, 0.04), mat(0x1c2028), s * 1.05, DH - 0.3, T / 2 + 0.065, 0, 0, 0, 'bumper'); P.bumpers.push(b);
    const hz = new THREE.Mesh(plane(0.2, 0.38), hazardMat(1, 2)); hz.position.set(s * 1.05, DH - 0.3, T / 2 + 0.132); g.add(hz); }
  const edge = new THREE.Mesh(plane(OW + 0.6, 0.12), hazardMat(8, 0.5)); edge.position.set(0, DH - 0.06, T / 2 + 0.005); g.add(edge); edge.name = 'edgeStripe';
  add(g, rbox(OW + 1, 0.02, 3.0, 0.01), mat(0x8e949c), 0, 0.01, T / 2 + 1.5, 0, 0, 0, 'apron');
  // signal + lamp + label (exterior)
  const sig = grp(g, 'signal', -OW / 2 - 0.62, 2.6, T / 2 + 0.05); add(sig, rbox(0.18, 0.4, 0.1, 0.04), M.dark, 0, 0, 0);
  const red = glowMat(PALETTE.red, 1.6), green = glowMat(PALETTE.emerald, 0.15);
  P.signalRed = add(sig, sph(0.055, 14, 10), red, 0, 0.09, 0.05, 0, 0, 0, 'signalRed'); P.signalGreen = add(sig, sph(0.055, 14, 10), green, 0, -0.09, 0.05, 0, 0, 0, 'signalGreen');
  const lamp = grp(g, 'dockLamp', OW / 2 + 0.6, DH + OH + 0.1, T / 2); strut(lamp, [0, 0, 0], [-0.3, 0.05, 0.6], 0.04, M.charcoal); add(lamp, roundCyl(0.11, 0.18, 0.03, 18, 'z'), M.charcoal, -0.3, 0.05, 0.65);
  add(lamp, roundCyl(0.085, 0.01, 0.003, 18, 'z'), glowMat(0xfff2c8, 0.8), -0.3, 0.05, 0.745);
  decal(g, labelTex(opts.label || 'D12', '#0071CE', '#ffffff'), 0.7, 0.35, 0, DH + OH + 0.95, T / 2 + 0.425, 0, 'label');
  // curtain (roll-up slats behind the opening)
  const cur = P.curtain = grp(g, 'curtain', 0, 0, -T / 2 - 0.06), dc = opts.doorColor ?? 0xdfe3e8, n = 15, sh = OH / n;
  for (let i = 0; i < n; i++) P.slats.push(add(cur, rbox(OW + 0.1, sh - 0.012, 0.05, 0.018, 2), mat(i === 0 ? 0x5a6372 : (i === 7 ? PALETTE.blue : dc), { roughness: 0.7 }), 0, 0, 0, 0, 0, 0, 'slat'));
  add(cur, rbox(0.3, 0.05, 0.06, 0.02), M.charcoal, 0, 0, 0.03, 0, 0, 0, 'pullHandle').userData.isHandle = true;
  const handle = cur.children[cur.children.length - 1];
  for (const s of [-1, 1]) add(cur, rbox(0.07, OH + 0.4, 0.1, 0.02), mat(0x9aa3ad), s * (OW / 2 + 0.08), DH + (OH + 0.4) / 2, 0, 0, 0, 0, 'guideTrack');
  const roller = P.roller = grp(cur, 'roller', 0, DH + OH + 0.4, -0.2); // pivot exactly on the drum axle
  add(roller, roundCyl(0.24, OW + 0.1, 0.03, 28, 'x'), mat(dc, { roughness: 0.7 }), 0, 0, 0, 0, 0, 0, 'coil');
  for (const s of [-1, 1]) { add(roller, roundCyl(0.27, 0.03, 0.01, 28, 'x'), M.charcoal, s * (OW / 2 + 0.07), 0, 0, 0, 0, 0, 'flange');
    for (let k = 0; k < 3; k++) add(roller, rbox(0.035, 0.44, 0.04, 0.012), M.steel, s * (OW / 2 + 0.095), 0, 0, k * Math.PI / 3, 0, 0, 'spoke'); }
  add(cur, roundCyl(0.035, OW + 0.5, 0.01, 14, 'x'), M.steel, 0, DH + OH + 0.4, -0.2, 0, 0, 0, 'axle');
  const hood = grp(cur, 'hood', 0, DH + OH + 0.4, -0.2);
  add(hood, rbox(OW + 0.4, 0.06, 0.66, 0.025), mat(PALETTE.navy), 0, 0.33, -0.03, 0, 0, 0, 'hoodTop');
  add(hood, rbox(OW + 0.4, 0.5, 0.05, 0.02), mat(PALETTE.navy), 0, 0.1, -0.36, 0, 0, 0, 'hoodBack');
  add(cur, rbox(0.25, 0.3, 0.25, 0.05), M.charcoal, OW / 2 + 0.35, DH + OH + 0.4, -0.2, 0, 0, 0, 'motor');
  // interior dock
  add(g, rbox(WW, DH, 3.4, 0.04), conc, 0, DH / 2, -T / 2 - 1.7, 0, 0, 0, 'platform');
  P.leveler = add(g, rbox(2.2, 0.04, 2.0, 0.015), mat(0x8a929c, { roughness: 0.6 }), 0, DH + 0.02, -T / 2 - 1.0, 0, 0, 0, 'leveler');
  for (const s of [-1, 1]) { const h = new THREE.Mesh(plane(0.12, 2.0), hazardMat(0.5, 8)); h.rotation.x = -Math.PI / 2; h.position.set(s * 1.16, DH + 0.005, -T / 2 - 1.0); g.add(h); }
  P.mat = add(g, rbox(2.6, 0.015, 1.0, 0.006), mat(0x3f9a4f, { roughness: 0.95 }), 0, DH + 0.008, -T / 2 - 2.6, 0, 0, 0, 'floorMat');
  for (const s of [-1, 1]) { const b = createBollard({ color: 'yellow', height: 1.0, radius: 0.085 }); b.position.set(s * 1.75, DH, -T / 2 - 0.5); g.add(b); P.bollards.push(b); }
  const fan = P.fan = grp(g, 'dockFan', 1.6, DH + OH - 0.2, -T / 2 - 0.55); fan.rotation.set(-0.5, -0.55, 0);
  strut(g, [1.95, DH + OH - 0.05, -T / 2 - 0.02], [1.75, DH + OH - 0.15, -T / 2 - 0.45], 0.06, M.charcoal, 'fanArm');
  const fy = mat(PALETTE.spark, { roughness: 0.7 });
  add(fan, torus(0.3, 0.05, 10, 32), fy, 0, 0, 0, 0, 0, 0, 'fanRing'); add(fan, roundCyl(0.32, 0.14, 0.02, 32, 'z'), fy, 0, 0, -0.05, 0, 0, 0, 'fanShroud').scale.set(1, 1, 1);
  add(fan, roundCyl(0.1, 0.18, 0.04, 16, 'z'), M.charcoal, 0, 0, -0.15, 0, 0, 0, 'fanMotor');
  const blades = P.fanBlades = grp(fan, 'fanBlades', 0, 0, 0.03); for (let i = 0; i < 4; i++) add(blades, rbox(0.08, 0.26, 0.012, 0.004), M.dark, Math.cos(i * Math.PI / 2) * 0.14, Math.sin(i * Math.PI / 2) * 0.14, 0, 0, 0.3, i * Math.PI / 2 + Math.PI / 2);
  for (let i = -3; i <= 3; i++) add(fan, rbox(0.006, 0.6, 0.006, 0.002), M.charcoal, i * 0.08, 0, 0.07);
  // state
  const ud = { open: opts.open ?? 0, cur: opts.open ?? 0 };
  const layout = () => { const off = ease(ud.cur) * OH;
    P.slats.forEach((s, i) => { const y = DH + sh / 2 + i * sh + off; s.position.y = y; s.visible = y < DH + OH + 0.05; });
    handle.position.y = DH + 0.2 + off; handle.visible = handle.position.y < DH + OH; };
  ud.setOpen = (v) => { ud.open = THREE.MathUtils.clamp(v, 0, 1); }; ud.getOpen = () => ud.cur;
  ud.setSignal = (c) => { red.emissiveIntensity = c === 'red' ? 1.6 : 0.12; green.emissiveIntensity = c === 'green' ? 1.6 : 0.12; };
  ud.setSignal(opts.signal || 'red'); layout();
  return finish(g, P, (dt, t) => { const prev = ud.cur; ud.cur = damp(ud.cur, ud.open, 2.2, dt); roller.rotation.x -= (ease(ud.cur) - ease(prev)) * OH / 0.24; layout(); blades.rotation.z += dt * 14; }, ud);
}

/* ------------------------------------------------------------------ bollard */
/** createBollard({color:'yellow'|'blue', height:1.1, radius:0.11})  steel pipe bollard with domed cap + reflective bands, base plate. */
export function createBollard(opts = {}) {
  const h = opts.height ?? 1.1, r = opts.radius ?? 0.11, c = opts.color === 'blue' ? PALETTE.blue : (typeof opts.color === 'number' ? opts.color : PALETTE.spark);
  const g = grp(null, 'bollard'), m = mat(c, { roughness: 0.7 }), refl = mat(0xeef2f6, { roughness: 0.35, emissive: 0x555a60, ei: 0.4 });
  add(g, roundCyl(r * 1.6, 0.03, 0.01, 24), M.steel, 0, 0.015, 0, 0, 0, 0, 'basePlate');
  add(g, roundCyl(r, h - r, r * 0.2, 28), m, 0, 0.03 + (h - r) / 2, 0, 0, 0, 0, 'pipe');
  add(g, dome(r), m, 0, h - r + 0.03 - 0.005, 0, 0, 0, 0, 'cap');
  for (const f of [0.62, 0.78]) add(g, roundCyl(r * 1.015, 0.05, 0.005, 28), refl, 0, h * f, 0, 0, 0, 0, 'reflectiveBand');
  return finish(g, {}, null);
}

/* ------------------------------------------------------------------ tree */
/** createTree({seed, height:4.5})  toy sphere tree; gently sways. parts: trunk, crown */
export function createTree(opts = {}) {
  const r = rng(opts.seed ?? 2), H = opts.height ?? 4.5, g = grp(null, 'tree'), P = {};
  P.trunk = add(g, roundCyl(0.14, H * 0.45, 0.05, 16), mat(0x8a5a3b), 0, H * 0.225, 0, 0, 0, 0, 'trunk');
  const crown = P.crown = grp(g, 'crown', 0, H * 0.42, 0), greens = [0x4fae5a, 0x5dbb63, 0x43a04f];
  [[0, H * 0.3, 0, H * 0.3], [H * 0.16, H * 0.18, 0.1, H * 0.2], [-H * 0.15, H * 0.2, -0.1, H * 0.21], [0.05, H * 0.47, 0.05, H * 0.18]].forEach(([x, y, z, s], i) =>
    add(crown, sph(s, 24, 16), mat(greens[i % 3]), x, y, z, 0, 0, 0, 'crownBall'));
  const ph = r() * 6; return finish(g, P, (dt, t) => { crown.rotation.z = Math.sin(t * 0.9 + ph) * 0.025; crown.rotation.x = Math.cos(t * 0.7 + ph) * 0.02; });
}

/* ------------------------------------------------------------------ mezzanine */
/**
 * createMezzanine({width:6, depth:4, deckHeight:3.0})  green steel platform, yellow stair (+X side) with treads + handrails, guardrails, yellow pallet gate.
 * parts: posts[], deck, stair, guardrails, gate ; size ~ (width+3.6) x 4.1 x depth
 */
export function createMezzanine(opts = {}) {
  const W = opts.width ?? 6, D = opts.depth ?? 4, H = opts.deckHeight ?? 3.0, g = grp(null, 'mezzanine'), P = { posts: [] };
  const run = H / 0.2 * 0.25, root = grp(g, 'frame', -run / 2, 0, 0);
  const Gn = mat(PALETTE.mezzGreen, { roughness: 0.75 }), Y = mat(PALETTE.spark, { roughness: 0.7 }), deckM = mat(0x9aa3ad, { roughness: 0.8 });
  for (let i = 0; i < 3; i++) for (let k = 0; k < 2; k++) { const x = -W / 2 + 0.1 + i * (W - 0.2) / 2, z = -D / 2 + 0.1 + k * (D - 0.2);
    P.posts.push(add(root, rbox(0.16, H - 0.1, 0.16, 0.03), Gn, x, (H - 0.1) / 2, z, 0, 0, 0, 'post')); add(root, rbox(0.3, 0.02, 0.3, 0.01), M.steel, x, 0.01, z, 0, 0, 0, 'basePlate'); }
  for (const z of [-D / 2 + 0.1, D / 2 - 0.1]) add(root, rbox(W, 0.28, 0.12, 0.03), Gn, 0, H - 0.24, z, 0, 0, 0, 'mainBeam');
  for (let i = 0; i < 6; i++) add(root, rbox(0.08, 0.2, D - 0.2, 0.02), Gn, -W / 2 + 0.1 + i * (W - 0.2) / 5, H - 0.2, 0, 0, 0, 0, 'joist');
  P.deck = add(root, rbox(W + 0.04, 0.06, D + 0.04, 0.02), deckM, 0, H - 0.07, 0, 0, 0, 0, 'deck');
  add(root, rbox(W + 0.06, 0.12, 0.03, 0.01), Y, 0, H - 0.02, D / 2 + 0.035, 0, 0, 0, 'kickPlate');
  // guardrails: front (+Z), back, left; right side open for stair + gate
  const rails = P.guardrails = grp(root, 'guardrails');
  const rail = (a, b) => { for (const y of [0.5, 1.05]) strut(rails, [a[0], H + y, a[1]], [b[0], H + y, b[1]], 0.05, Gn, 'rail');
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / 1.5));
    for (let i = 0; i <= n; i++) { const f = i / n; add(rails, rbox(0.06, 1.08, 0.06, 0.015), Gn, a[0] + (b[0] - a[0]) * f, H + 0.54, a[1] + (b[1] - a[1]) * f, 0, 0, 0, 'railPost'); } };
  rail([-W / 2, D / 2], [W / 2, D / 2]); rail([-W / 2, -D / 2], [W / 2, -D / 2]); rail([-W / 2, -D / 2], [-W / 2, D / 2]); rail([W / 2, -D / 2], [W / 2, -D / 2 + 0.95]);
  const gate = P.gate = grp(root, 'palletGate', W / 2, H, -0.3); for (const y of [0.5, 1.05]) add(gate, rbox(0.05, 0.05, 1.5, 0.015), Y, 0, y, 0);
  for (const z of [-0.75, 0.75]) add(gate, rbox(0.06, 1.1, 0.06, 0.015), Y, 0, 0.55, z); add(gate, rbox(0.1, 0.1, 0.1, 0.02), M.charcoal, 0, 0.3, -0.75);
  // stair (+X side, climbing toward -X), at z = D/2 - 0.6
  const st = P.stair = grp(root, 'stair', W / 2, 0, D / 2 - 0.65), sw = 1.0, n = Math.round(H / 0.2), ang = Math.atan2(H, run), L = Math.hypot(H, run);
  for (const s of [-1, 1]) { const sg = add(st, rbox(L, 0.22, 0.06, 0.02), Y, run / 2, H / 2, s * sw / 2, 0, 0, -ang + Math.PI, 'stringer'); sg.rotation.z = -ang; sg.position.set(run / 2, H / 2 + 0.11 * Math.cos(ang) + 0.001, s * sw / 2);
    strut(st, [run, 1.0, s * sw / 2], [0, H + 1.0, s * sw / 2], 0.05, Y, 'handrail');
    for (let i = 0; i <= 3; i++) { const f = i / 3; add(st, rbox(0.05, 1.0, 0.05, 0.015), Y, run * (1 - f), H * f + 0.5, s * sw / 2, 0, 0, 0, 'handrailPost'); } }
  for (let i = 1; i < n; i++) { const f = i / n; add(st, rbox(0.28, 0.035, sw - 0.06, 0.012), mat(0x8a929c), run * (1 - f) + 0.02, H * f, 0, 0, 0, 0, 'tread');
    add(st, rbox(0.04, 0.02, sw - 0.06, 0.006), Y, run * (1 - f) - 0.1, H * f + 0.02, 0, 0, 0, 0, 'nosing'); }
  // a pallet + worker-scale props on deck
  const pal = createPallet({ variant: 'blueWood', load: 'cartons', seed: 21, maxHeight: 0.9 }); pal.position.set(-W / 4, H - 0.04, -0.3); root.add(pal);
  return finish(g, P, null);
}

/* ------------------------------------------------------------------ rooftop HVAC */
/** createHVAC({fans:2})  rooftop package unit 3.2 x 1.45 x 1.6 m: louvered side panels, service doors, spinning condenser fans with grilles. parts: fans[] */
export function createHVAC(opts = {}) {
  const g = grp(null, 'hvac'), P = { fans: [] }, L = 3.2, H = 1.3, D = 1.6, B = mat(0xd5dae0, { roughness: 0.75 }), Dk = mat(0x5a6372);
  add(g, rbox(L + 0.1, 0.12, D + 0.1, 0.03), Dk, 0, 0.06, 0, 0, 0, 0, 'curb');
  add(g, rbox(L, H, D, 0.06), B, 0, 0.12 + H / 2, 0, 0, 0, 0, 'cabinet');
  add(g, rbox(L + 0.04, 0.06, D + 0.04, 0.03), mat(0xc2c8cf), 0, 0.12 + H, 0, 0, 0, 0, 'lid');
  for (const s of [-1, 1]) { // louvers on long sides, condenser half (x>0)
    for (let i = 0; i < 9; i++) add(g, rbox(1.4, 0.035, 0.05, 0.012), Dk, 0.7, 0.3 + i * 0.11, s * (D / 2 + 0.01), s * 0.5, 0, 0, 'louver');
    add(g, rbox(1.5, 1.1, 0.02, 0.01), mat(0x3d4552), 0.7, 0.75, s * (D / 2 - 0.005), 0, 0, 0, 'louverBack');
    for (const x of [-1.25, -0.6]) { add(g, rbox(0.58, 1.0, 0.02, 0.01), mat(0xe6eaee), x, 0.72, s * (D / 2 + 0.008), 0, 0, 0, 'serviceDoor');
      add(g, rbox(0.03, 0.12, 0.03, 0.01), M.charcoal, x + 0.22, 0.72, s * (D / 2 + 0.03), 0, 0, 0, 'handle'); }
  }
  for (let i = 0; i < 5; i++) add(g, rbox(0.035, 0.6, 0.05, 0.012), Dk, -L / 2 - 0.01, 0.5 + i * 0.12 - 0.15, 0, 0, 0, 0.0, 'endLouver').scale.set(1, 0.01 / 0.6 * 60 / 60, 1);
  for (const [i, x] of [[0, 0.45], [1, 1.15]].slice(0, opts.fans ?? 2)) {
    const f = grp(g, 'fan', x, 0.12 + H + 0.03, 0); add(f, roundCyl(0.36, 0.12, 0.03, 32), Dk, 0, 0.04, 0, 0, 0, 0, 'fanShroud');
    add(f, roundCyl(0.3, 0.02, 0.005, 28), mat(0x1c2028), 0, 0.1, 0);
    const bl = grp(f, 'blades', 0, 0.11, 0); for (let k = 0; k < 4; k++) add(bl, rbox(0.26, 0.012, 0.09, 0.005), mat(0x7d8794), Math.cos(k * Math.PI / 2) * 0.14, 0, Math.sin(k * Math.PI / 2) * 0.14, 0.35, -k * Math.PI / 2, 0);
    add(bl, roundCyl(0.05, 0.05, 0.01, 14), M.charcoal, 0, 0.02, 0);
    add(f, torus(0.33, 0.012, 6, 32), M.steel, 0, 0.16, 0, Math.PI / 2, 0, 0, 'grilleRing'); add(f, torus(0.2, 0.01, 6, 28), M.steel, 0, 0.16, 0, Math.PI / 2, 0, 0, 'grilleRing');
    for (let k = 0; k < 4; k++) add(f, rbox(0.66, 0.012, 0.012, 0.004), M.steel, 0, 0.165, 0, 0, k * Math.PI / 4, 0, 'grilleSpoke');
    P.fans.push(bl);
  }
  for (const z of [-0.3, 0.3]) { add(g, roundCyl(0.04, 0.8, 0.01, 12, 'x'), M.steel, -L / 2 - 0.3, 0.3, z, 0, 0, 0, 'pipe'); add(g, roundCyl(0.04, 0.3, 0.01, 12), M.steel, -L / 2 - 0.7, 0.15, z); }
  return finish(g, P, (dt) => { P.fans.forEach((b, i) => b.rotation.y += dt * (9 + i * 1.3)); });
}

/* ------------------------------------------------------------------ light pole */
/** createLightPole({heads:1|2, height:9})  tapered pole on concrete base, shoebox LED heads on arms (emissive lenses). parts: pole, heads[] */
export function createLightPole(opts = {}) {
  const H = opts.height ?? 9, n = opts.heads === 2 ? 2 : 1, g = grp(null, 'lightPole'), P = { heads: [] }, Gm = mat(0x6f7884, { roughness: 0.6 });
  add(g, roundCyl(0.32, 0.6, 0.08, 24), mat(0xb9bcc1), 0, 0.3, 0, 0, 0, 0, 'base');
  add(g, roundCyl(0.2, 0.04, 0.01, 20), Gm, 0, 0.62, 0, 0, 0, 0, 'flange');
  P.pole = add(g, cyl(0.07, 0.12, H - 0.6, 20), Gm, 0, 0.6 + (H - 0.6) / 2, 0, 0, 0, 0, 'pole');
  add(g, dome(0.07), Gm, 0, H, 0);
  const dirs = n === 2 ? [-1, 1] : [1];
  for (const s of dirs) { const tip = [0, H - 0.3, s * 1.3]; strut(g, [0, H - 0.6, 0], tip, 0.06, Gm, 'arm');
    const head = grp(g, 'head', 0, H - 0.34, s * 1.55); head.rotation.x = s * 0.08; add(head, rbox(0.42, 0.13, 0.75, 0.05), mat(0x4a5260), 0, 0, 0, 0, 0, 0, 'housing');
    const lens = add(head, rbox(0.34, 0.02, 0.62, 0.008), glowMat(0xfff4d6, 1.4), 0, -0.07, 0, 0, 0, 0, 'lens'); lens.castShadow = false;
    for (let i = 0; i < 5; i++) add(head, rbox(0.38, 0.02, 0.025, 0.006), mat(0x3d4552), 0, 0.075, -0.28 + i * 0.14, 0, 0, 0, 'fin');
    P.heads.push(head); }
  add(g, rbox(0.12, 0.25, 0.08, 0.02), Gm, 0, 1.2, 0.1, 0, 0, 0, 'handhole');
  return finish(g, P, null);
}

/* ------------------------------------------------------------------ oil drum */
const DRUM_COLORS = { blue: 0x1f5fbf, green: 0x2f8a4c, yellow: 0xf2b51c, red: 0xd63a32, black: 0x262a31 };
/** createOilDrum({color:'blue'|'green'|'yellow'|'red'|'black'|hex, bands:true})  205 L drum 0.585 m dia x 0.88 m with rolling hoops, red bands, chime + bungs. */
export function createOilDrum(opts = {}) {
  const c = typeof opts.color === 'number' ? opts.color : DRUM_COLORS[opts.color || 'blue'], g = grp(null, 'oilDrum'), R = 0.2925, H = 0.88, m = mat(c, { roughness: 0.65 });
  add(g, roundCyl(R, H - 0.02, 0.025, 36), m, 0, (H - 0.02) / 2, 0, 0, 0, 0, 'body');
  for (const y of [H * 0.33, H * 0.66]) add(g, torus(R + 0.003, 0.012, 8, 40), m, 0, y, 0, Math.PI / 2, 0, 0, 'rollingHoop');
  if (opts.bands !== false) for (const y of [0.09, H - 0.11]) add(g, roundCyl(R + 0.004, 0.08, 0.006, 36), mat(PALETTE.red, { roughness: 0.65 }), 0, y, 0, 0, 0, 0, 'redBand');
  for (const y of [0.014, H - 0.014]) add(g, torus(R - 0.012, 0.014, 8, 40), mat(c, { roughness: 0.55 }), 0, y, 0, Math.PI / 2, 0, 0, 'chime');
  add(g, roundCyl(R - 0.02, 0.012, 0.004, 36), mat(c, { roughness: 0.55 }), 0, H - 0.02, 0, 0, 0, 0, 'lid');
  add(g, roundCyl(0.035, 0.022, 0.006, 14), M.steel, R * 0.55, H - 0.004, 0, 0, 0, 0, 'bung');
  add(g, roundCyl(0.022, 0.022, 0.005, 12), M.steel, -R * 0.6, H - 0.004, 0.05, 0, 0, 0, 'vent');
  add(g, rbox(0.22, 0.16, 0.01, 0.004), mat(0xf7f7f2), 0, H * 0.5, R - 0.004, 0, 0, 0, 'label').rotation.y = 0;
  return finish(g, {}, null);
}

/* ------------------------------------------------------------------ wire mesh cage */
/** createWireCage({contents:true, seed})  stackable wire mesh pallet cage 1.2 x 1.0 x 1.0 m with feet, drop-gate, mesh panels. parts: frame, panels[], gate, contents */
export function createWireCage(opts = {}) {
  const g = grp(null, 'wireCage'), P = { panels: [] }, W = 1.0, D = 1.2, H = 0.95, F = mat(0x9aa3ad, { roughness: 0.55 });
  const mesh = mat(0xd5dbe2, { map: meshTex(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.55 });
  const fr = P.frame = grp(g, 'frame', 0, 0.12, 0);
  for (const x of [-W / 2, W / 2]) for (const z of [-D / 2, D / 2]) { add(fr, rbox(0.04, H, 0.04, 0.012), F, x, H / 2, z, 0, 0, 0, 'post'); add(g, rbox(0.08, 0.12, 0.08, 0.02), F, x, 0.06, z, 0, 0, 0, 'foot'); }
  for (const y of [0, H]) { for (const z of [-D / 2, D / 2]) add(fr, rbox(W, 0.035, 0.035, 0.01), F, 0, y, z); for (const x of [-W / 2, W / 2]) add(fr, rbox(0.035, 0.035, D, 0.01), F, x, y, 0); }
  add(fr, rbox(W, 0.02, D, 0.008), mat(0x8a929c), 0, 0.01, 0, 0, 0, 0, 'floor');
  const pan = (w, h, x, y, z, ry, name = 'meshPanel') => { const p = new THREE.Mesh(plane(w, h), mesh); p.position.set(x, y, z); p.rotation.y = ry; p.castShadow = p.receiveShadow = true; p.name = name; fr.add(p); P.panels.push(p);
    p.material = mesh; if (mesh.map) { /* tile density */ } return p; };
  pan(W, H, 0, H / 2, -D / 2, 0); pan(D, H, -W / 2, H / 2, 0, Math.PI / 2); pan(D, H, W / 2, H / 2, 0, Math.PI / 2);
  P.gate = grp(fr, 'dropGate', 0, 0, D / 2); pan(W, H / 2, 0, H * 0.75, D / 2, 0, 'gateUpper'); const low = pan(W, H / 2, 0, H * 0.25, D / 2, 0, 'gateLower'); fr.remove(low); P.gate.add(low); low.position.set(0, H * 0.25, 0);
  add(P.gate, rbox(W, 0.03, 0.03, 0.01), F, 0, H / 2, 0);
  add(fr, rbox(0.18, 0.1, 0.006, 0.004), mat(PALETTE.spark), 0.3, H * 0.85, D / 2 + 0.01, 0, 0, 0, 'tag');
  if (opts.contents !== false) { const c = P.contents = grp(fr, 'contents', 0, 0.02, 0); stackCartons(c, opts.seed ?? 4, 0.7, 0.95, 1.15); }
  return finish(g, P, null);
}

/* ------------------------------------------------------------------ sack stack */
/** createSackStack({color:'white'|'kraft'|'green', layers:6, seed, variant:'pine'})  interlocked 25 kg sacks (5 per layer) on a pallet; red print bands. parts: pallet, sacks[] */
export function createSackStack(opts = {}) {
  const g = grp(null, 'sackStack'), P = { sacks: [] }, layers = opts.layers ?? 6, r = rng(opts.seed ?? 8);
  const cols = { white: [0xf1efe8, PALETTE.red], kraft: [0xcfae7c, PALETTE.blue], green: [0x5f9a55, 0xf4f5f7] }[opts.color || 'white'];
  P.pallet = createPallet({ variant: opts.variant || 'pine', load: 'none' }); g.add(P.pallet);
  const bag = mat(cols[0], { roughness: 0.9 }), print = mat(cols[1], { roughness: 0.85 }), bh = 0.13;
  for (let l = 0; l < layers; l++) {
    const y = PALLET.h + l * (bh - 0.012), flip = l % 2;
    // 3 bags along X (0.4 x 0.6) + 2 bags along Z, interlocked pattern
    const spots = [[-0.33, -0.3, 0], [0, -0.3, 0], [0.33, -0.3, 0], [-0.2, 0.32, 1], [0.2, 0.32, 1]].map(([x, z, rot]) => flip ? [x, -z, rot] : [x, z, rot]);
    for (const [x, z, rot] of spots) { const s = grp(g, 'sack', x + (r() - 0.5) * 0.02, y, z + (r() - 0.5) * 0.02); s.rotation.y = (rot ? Math.PI / 2 : 0) + (r() - 0.5) * 0.06;
      const w = rot ? 0.6 : 0.33, d = rot ? 0.4 : 0.6; // local: x across, z along
      add(s, rbox(rot ? 0.6 : 0.33, bh, rot ? 0.4 : 0.6, bh * 0.48, 4), bag, 0, bh / 2, 0).scale.set(1, 1, 1);
      add(s, rbox(rot ? 0.12 : 0.335, bh * 0.82, rot ? 0.405 : 0.12, bh * 0.4, 3), print, 0, bh / 2, 0, 0, 0, 0, 'printBand');
      s.rotation.y = (r() - 0.5) * 0.06; P.sacks.push(s); void w; void d; }
  }
  return finish(g, P, null);
}

/* ------------------------------------------------------------------ Walmart facade */
/**
 * createFacade({width:30, sub:'Supercenter'})  storefront slice facing +Z: beige seamed panel walls, tall blue parapet with angled peak,
 * white "Walmart" + yellow spark wordmark (CanvasTexture), glass entrance with mullions + sliding doors, canopy, blue bollards. Depth 2.5 m (a wall slice).
 * parts: walls, parapet, wordmark, entrance, doors[], canopy, bollards[]
 */
export function createFacade(opts = {}) {
  const W = opts.width ?? 30, g = grp(null, 'facade'), P = { doors: [], bollards: [] }, beige = mat(0xd9ccb2), beige2 = mat(0xcbbd9f), blue = mat(PALETTE.blue, { roughness: 0.8 }), cap = mat(0xb9c1cb);
  const WH = 8, BW = 13, BH = 11.2, PK = 12.6, depth = 1.0;
  const walls = P.walls = grp(g, 'walls', 0, 0, -0.75);
  add(walls, rbox(W, WH, 1.5, 0.08), beige, 0, WH / 2, 0);
  add(walls, rbox(W + 0.1, 0.25, 1.6, 0.06), cap, 0, WH + 0.1, 0, 0, 0, 0, 'coping');
  for (let x = -W / 2 + 3; x < W / 2 - 0.5; x += 3) if (Math.abs(x) > BW / 2 + 0.2) add(walls, rbox(0.05, WH - 0.4, 0.04, 0.01), beige2, x, WH / 2 - 0.1, 0.76, 0, 0, 0, 0, 'panelSeam');
  for (const s of [-1, 1]) add(walls, rbox((W - BW) / 2 - 0.2, 0.05, 0.04, 0.01), beige2, s * (W / 4 + BW / 4), 3.2, 0.76, 0, 0, 0, 0, 'panelSeamH');
  add(walls, rbox(W, 0.7, 1.56, 0.05), mat(0x8e949c), 0, 0.35, 0, 0, 0, 0, 'plinth');
  // blue parapet with angled peak (extruded pentagon)
  const shp = new THREE.Shape(); shp.moveTo(-BW / 2, 0); shp.lineTo(BW / 2, 0); shp.lineTo(BW / 2, BH); shp.lineTo(0, PK); shp.lineTo(-BW / 2, BH); shp.lineTo(-BW / 2, 0);
  const pg = cached(_geo, `parapet${BW},${BH},${PK}`, () => { const e = new THREE.ExtrudeGeometry(shp, { depth, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 3, curveSegments: 1 }); e.translate(0, 0.08, -depth / 2); return e; });
  P.parapet = add(g, pg, blue, 0, 0, 0.1, 0, 0, 0, 'parapet');
  const capShape = (a, b) => strut(g, [a[0], a[1], 0.1], [b[0], b[1], 0.1], 0.0001, cap);
  void capShape;
  const ang = Math.atan2(PK - BH, BW / 2), L = Math.hypot(BW / 2, PK - BH) + 0.25;
  for (const s of [-1, 1]) { const c = add(g, rbox(L, 0.3, depth + 0.35, 0.08), cap, s * BW / 4, (BH + PK) / 2 + 0.12, 0.1, 0, 0, -s * ang, 'peakCap'); void c; }
  for (const s of [-1, 1]) add(g, rbox(0.3, BH, depth + 0.3, 0.08), mat(0x005bb0), s * (BW / 2 + 0.05), BH / 2, 0.1, 0, 0, 0, 'pilaster');
  P.wordmark = decal(g, wordmarkTex(opts.sub ?? 'Supercenter'), 9.5, 2.67, 0, 8.7, 0.1 + depth / 2 + 0.1, 0, 'wordmark');
  // entrance
  const ent = P.entrance = grp(g, 'entrance', 0, 0, 0.65), EW = 9, EH = 4.6, fm = mat(0x3d4552, { roughness: 0.6 }), gl = mat(0x9ec3e6, { roughness: 0.15, transparent: true, opacity: 0.55, depthWrite: false });
  add(ent, rbox(EW + 0.4, EH + 0.3, 0.2, 0.05), fm, 0, (EH + 0.3) / 2, -0.1, 0, 0, 0, 'surround');
  add(ent, rbox(EW, EH, 0.04, 0.01), mat(0x2b3a52, { roughness: 0.3 }), 0, EH / 2, 0.0, 0, 0, 0, 'interiorDark');
  const glass = new THREE.Mesh(plane(EW, EH), gl); glass.position.set(0, EH / 2, 0.06); glass.name = 'glass'; ent.add(glass);
  for (let i = 0; i <= 6; i++) add(ent, rbox(0.1, EH, 0.12, 0.02), fm, -EW / 2 + i * EW / 6, EH / 2, 0.08, 0, 0, 0, 'mullion');
  for (const y of [0.05, 2.7, EH - 0.05]) add(ent, rbox(EW, 0.1, 0.12, 0.02), fm, 0, y, 0.08, 0, 0, 0, 'transom');
  for (const s of [-1, 1]) { const d = grp(ent, 'slidingDoor', s * 0.75, 0, 0.14); add(d, rbox(1.45, 2.6, 0.06, 0.02), fm, 0, 1.33, 0); const dg = new THREE.Mesh(plane(1.25, 2.4), gl); dg.position.set(0, 1.33, 0.035); d.add(dg);
    add(d, rbox(0.04, 0.8, 0.05, 0.015), M.steel, -s * 0.6, 1.2, 0.05); P.doors.push(d); }
  P.canopy = add(g, rbox(EW + 2, 0.45, 3.0, 0.08), mat(0xf0f2f5), 0, EH + 0.55, 1.9, 0, 0, 0, 'canopy');
  add(g, rbox(EW + 2.04, 0.18, 3.04, 0.04), blue, 0, EH + 0.4, 1.9, 0, 0, 0, 'canopyBand');
  for (const s of [-1, 1]) { add(g, roundCyl(0.12, EH + 0.3, 0.03, 18), fm, s * (EW / 2 + 0.6), (EH + 0.3) / 2, 3.1, 0, 0, 0, 'canopyColumn'); }
  decal(g, labelTex('Pickup', '#0071CE', '#ffffff'), 2.2, 1.1, W / 2 - 4, 5.5, 0.03, 0, 'pickupSign');
  for (let i = 0; i < 6; i++) { const b = createBollard({ color: 'blue', height: 1.0, radius: 0.1 }); b.position.set(-EW / 2 - 0.5 + i * (EW + 1) / 5, 0, 4.0); g.add(b); P.bollards.push(b); }
  add(g, rbox(W, 0.15, 5, 0.04), mat(0xc4c8cd), 0, 0.075, 2.2, 0, 0, 0, 'sidewalk');
  return finish(g, P, null);
}

/* ------------------------------------------------------------------ registry */
const v = (f, d) => (o = {}) => f({ ...d, ...o });
/** name -> factory(opts). Variant entries pre-fill options (still overridable). */
export const MODELS = {
  reachTruck: (o = {}) => createReachTruck({ load: true, ...o }),
  tugTrain: (o = {}) => createTugTrain(o),
  palletLoadFull: (o = {}) => createPalletLoad({ variant: 'full', ...o }),
  palletLoadHalf: (o = {}) => createPalletLoad({ variant: 'half', palletType: 'blueWood', ...o }),
  palletLoadPartial: (o = {}) => createPalletLoad({ variant: 'partial', seed: 5, ...o }),
  caseStack: (o = {}) => createPalletLoad({ variant: 'cases', seed: 8, ...o }),
  caseFew: (o = {}) => createPalletLoad({ variant: 'few', seed: 2, ...o }),
  semiTruck: createSemiTruck, yardTractor: createYardTractor,
  forklift: createForklift, autoStacker: createAutoStacker,
  palletJack: createPalletJack, handPalletJack: createHandPalletJack, handPalletJackRaised: v(createHandPalletJack, { lift: 0.1 }), riderPalletTruck: createRiderPalletTruck, walkieStacker: createWalkieStacker,
  amr: createAMR, amrPod: v(createAMR, { withPod: true, carrying: true }), robotArm: createRobotArm,
  worker: createWorker, workerBlue: v(createWorker, { vest: 'blue', hardHat: false, seed: 9 }),
  rackBay: createRackBay, conveyor: createConveyor,
  pallet: createPallet,
  palletPine: v(createPallet, { variant: 'pine', load: 'none' }), palletBlueWood: v(createPallet, { variant: 'blueWood', load: 'none' }), palletSteel: v(createPallet, { variant: 'steel', load: 'none' }),
  palletWrapped: v(createPallet, { variant: 'blueWood', load: 'cartons', wrap: true, seed: 7 }), palletTotes: v(createPallet, { variant: 'pine', load: 'totes', toteColor: 'black', maxHeight: 0.9 }),
  tote: createTote, toteOpen: v(createTote, { lid: false, contents: true }), toteCrate: v(createTote, { variant: 'crate' }), sackStack: createSackStack, wireCage: createWireCage,
  oilDrum: createOilDrum, oilDrumGreen: v(createOilDrum, { color: 'green' }), oilDrumYellow: v(createOilDrum, { color: 'yellow' }),
  dockDoor: createDockDoor, bollard: v(createBollard, { color: 'yellow' }), bollardBlue: v(createBollard, { color: 'blue' }),
  mezzanine: createMezzanine, hvac: createHVAC, lightPole: createLightPole, lightPoleDouble: v(createLightPole, { heads: 2 }),
  tree: createTree, facade: createFacade,
};
/**
 * Nominal bounding sizes in metres {x: width, y: height, z: length/depth} at default options (measured from the built models,
 * incl. mirrors/hard hats/bevels; generated by parts/check.html). Vehicles: z = length along facing (+Z). Rest pose, default options.
 */
export const SIZES = {
  semiTruck: { x: 3.2, y: 4.175, z: 22.13 }, // tractor + 53' trailer; trailer box 2.6 x 2.8 x 16.1 m on a 1.35 m deck
  yardTractor: { x: 2.81, y: 3.2195, z: 5.655 },
  forklift: { x: 1.4912, y: 2.3065, z: 3.568 }, // incl. 1.07 m forks; overhead guard 2.2 m
  autoStacker: { x: 1.036, y: 2.5, z: 2.838 },
  palletJack: { x: 0.548, y: 1.2665, z: 1.5349 },
  riderPalletTruck: { x: 0.8, y: 1.4183, z: 2.475 },
  walkieStacker: { x: 0.94, y: 1.78, z: 2.2649 },
  amr: { x: 0.836, y: 0.3479, z: 0.9451 },
  amrPod: { x: 0.99, y: 2.0125, z: 0.99 },
  robotArm: { x: 1.211, y: 1.6838, z: 1.0711 },
  worker: { x: 0.6692, y: 1.835, z: 0.302 }, // 1.75 m person + hard hat
  workerBlue: { x: 0.6692, y: 1.8047, z: 0.2997 },
  rackBay: { x: 2.96, y: 7.2725, z: 1.25 }, // 2.7 m beam, 1.1 m frame depth, 7.0 m uprights + top loads
  conveyor: { x: 1.04, y: 1.228, z: 4.07 },
  pallet: { x: 1.036, y: 1.5, z: 1.236 }, // generic entry = pine pallet + wrapped cartons
  palletPine: { x: 1.02, y: 0.144, z: 1.22 }, // 48x40 in GMA pallet
  palletBlueWood: { x: 1.02, y: 0.144, z: 1.22 },
  palletSteel: { x: 1.02, y: 0.152, z: 1.22 },
  palletWrapped: { x: 1.036, y: 1.5, z: 1.236 },
  palletTotes: { x: 1.02, y: 1.0665, z: 1.25 },
  tote: { x: 0.462, y: 0.378, z: 0.6985 },
  sackStack: { x: 1.0223, y: 0.864, z: 1.2213 },
  wireCage: { x: 1.08, y: 1.0875, z: 1.28 },
  oilDrum: { x: 0.615, y: 0.887, z: 0.615 }, // 205 L drum: 0.585 m body dia (hoops/chimes add ~3 cm)
  oilDrumGreen: { x: 0.615, y: 0.887, z: 0.615 },
  oilDrumYellow: { x: 0.615, y: 0.887, z: 0.615 },
  dockDoor: { x: 4.2, y: 5.4, z: 6.7 }, // opening 2.7 x 3.0 m, sill at 1.22 m; wall plane at z=0
  bollard: { x: 0.352, y: 1.125, z: 0.352 },
  bollardBlue: { x: 0.352, y: 1.125, z: 0.352 },
  mezzanine: { x: 9.8606, y: 4.1, z: 4.1 },
  hvac: { x: 3.99, y: 1.621, z: 1.7 },
  lightPole: { x: 0.64, y: 9.07, z: 2.245 },
  lightPoleDouble: { x: 0.64, y: 9.07, z: 3.85 },
  tree: { x: 3.24, y: 4.815, z: 2.7 },
  facade: { x: 30.1, y: 12.8779, z: 6.25 }, // storefront slice; parapet peak 12.6 m + cap
  palletLoadFull: { x: 1.036, y: 1.5, z: 1.236 }, // createPalletLoad full: ~1.5 m total
  palletLoadHalf: { x: 1.036, y: 0.75, z: 1.236 }, // half-height load ~0.75 m
  palletLoadPartial: { x: 1.02, y: 1.184, z: 1.22 }, // picked-from pallet, uneven columns
  caseStack: { x: 1.019, y: 1.04, z: 1.2239 }, // loose cases, no pallet
  caseFew: { x: 1.0392, y: 0.26, z: 0.8509 }, // 2-6 loose cases
  reachTruck: { x: 1.275, y: 4.13, z: 3.128 },
  tugTrain: { x: 1.06, y: 2.2, z: 8.578 },
  handPalletJack: { x: 0.548, y: 1.2665, z: 1.5349 },
  handPalletJackRaised: { x: 0.548, y: 1.3665, z: 1.5349 },
  toteOpen: { x: 0.458, y: 0.345, z: 0.6985 },
  toteCrate: { x: 0.43, y: 0.303, z: 0.626 },
};
