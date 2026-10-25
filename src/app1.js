// ======================================================================
// Gateflow · Demo RDC-7041 regional DC digital twin (concept demo, not affiliated)
// ======================================================================
const {
  PALETTE, rbox, roundCyl, mat, drawSpark, createTote, createPallet, createPalletInstanced, getPalletGeometry, bakeGroup,
  createSemiTruck, createYardTractor, createForklift, createAutoStacker, createPalletJack, createRiderPalletTruck,
  createAMR, createRobotArm, createWorker, createRackBay, getRackBayParts, createConveyor,
  createPalletLoad, createReachTruck, createTugTrain, createWalkieStacker, createOilDrum, createWireCage, createSackStack, createBollard, drive: mdlDrive, PALLET,
  createHandPalletJack, createOperator, isManned,
} = MODELS;

const QS = new URLSearchParams(location.search);
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const clamp = THREE.MathUtils.clamp, lerp = THREE.MathUtils.lerp;
const easeIO = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeOutBack = (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const dampV = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
const angDamp = (a, b, k, dt) => { let d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; return a + d * (1 - Math.exp(-k * dt)); };
let SEED = 7; const rnd = () => { SEED = (SEED * 16807) % 2147483647; return (SEED - 1) / 2147483646; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------------------------------------------------------------- constants / layout (SIM_SPEC §A, scaled section)
// Spec coords: x east 0..100, y north 0..62 (building). Three: X = x - 50, Z = 31 - y. 1 unit = 1 m.
const FLOOR = 1.2;                         // dock height floor
const BW = 100, BD = 62, ROOF_Y = FLOOR + 12;
const sx = (x) => x - 50, sz = (y) => 31 - y;
const SITE = { x0: -62, x1: 108, z0: -90, z1: 90 };
// ---------------------------------------------------------------- renderer / scene
const canvas = $('#gl');
// quality tier: ?q=low|high, else auto-detect software / weak GL (SwiftShader, llvmpipe, very small GPUs)
const GL_INFO = (() => { try { const c = document.createElement('canvas'), g = c.getContext('webgl2'); if (!g) return { weak: true, name: 'no webgl2' };
  const e = g.getExtension('WEBGL_debug_renderer_info'), name = e ? String(g.getParameter(e.UNMASKED_RENDERER_WEBGL)) : 'unknown', maxTex = g.getParameter(g.MAX_TEXTURE_SIZE);
  g.getExtension('WEBGL_lose_context')?.loseContext(); return { weak: /swiftshader|llvmpipe|softpipe|software|basic render|mali-4|adreno \(tm\) 3/i.test(name) || maxTex < 8192, name }; } catch (e) { return { weak: true, name: 'error' }; } })();
let __q0 = QS.get('q') || (GL_INFO.weak ? 'low' : 'high');
try { if (PFX && !QS.get('q')) __q0 = GL_INFO.weak ? 'low' : PFX.pickQuality(null); } catch (e) { console.warn('[gf] pickQuality', e && e.message); }
if (!QS.get('q') && GL_INFO.weak) __q0 = 'low';
const Q = __q0, LOW = Q === 'low', USE_FX = !!PFX && !LOW && !QS.has('nopost');
console.info(`[gateflow] GL: ${GL_INFO.name} -> quality ${Q}`);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !LOW && !USE_FX, powerPreference: 'high-performance', preserveDrawingBuffer: QS.has('capture') });
renderer.setPixelRatio(LOW || Q === 'med' ? 1 : Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = LOW ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
const DAY_BG = new THREE.Color(0xe9eef4), NIGHT_BG = new THREE.Color(0x060f22);
scene.background = DAY_BG.clone();
scene.fog = new THREE.Fog(DAY_BG.clone(), 380, 900);
const camera = new THREE.PerspectiveCamera(28, innerWidth / innerHeight, 1, 3000);
const HOME = { pos: V3(118, 150, 205), tgt: V3(-4, 0, 4) };
camera.position.copy(HOME.pos);
let CAMRIG = null;
if (CAMX && !QS.has('nocamrig')) { try { CAMRIG = CAMX.create({ camera, domElement: canvas, scene, syncView: false, home: { position: HOME.pos.clone(), target: HOME.tgt.clone() }, minDistance: 8, maxDistance: 600, maxPolarAngle: 1.32 }); } catch (e) { console.warn('[gf] camera.js skipped:', e && e.message); CAMRIG = null; } }
const controls = CAMRIG ? CAMRIG.controls : new OrbitControls(camera, canvas);
controls.target.copy(HOME.tgt);
controls.enableDamping = true; controls.dampingFactor = 0.07;
controls.maxPolarAngle = 1.32; controls.minDistance = 8; controls.maxDistance = 600;
controls.screenSpacePanning = false; if (!CAMRIG) controls.zoomSpeed = 0.9; controls.rotateSpeed = 0.6;
controls.update();

// lights
const hemi = new THREE.HemisphereLight(0xf4f8ff, 0xb9c3cf, 1.25); scene.add(hemi);
const amb = new THREE.AmbientLight(0xffffff, 0.25); scene.add(amb);
const sun = new THREE.DirectionalLight(0xfff3e2, 2.3);
sun.position.set(-70, 140, 90); sun.castShadow = true;
sun.shadow.mapSize.set(LOW ? 1024 : 4096, LOW ? 1024 : 4096);
Object.assign(sun.shadow.camera, { left: -125, right: 125, top: 100, bottom: -100, near: 10, far: 400 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04; sun.shadow.radius = 4;
scene.add(sun); scene.add(sun.target);
const fill = new THREE.DirectionalLight(0xdfe9ff, 0.45); fill.position.set(90, 60, -80); scene.add(fill);

// ---------------------------------------------------------------- helpers
function shadowAll(o, cast = true, recv = true) { o.traverse((m) => { if (m.isMesh) { m.castShadow = cast; m.receiveShadow = recv; } }); return o; }
function M(color, o = {}) { return new THREE.MeshStandardMaterial({ color, roughness: o.r ?? 0.85, metalness: 0, ...o.x }); }
function box(w, h, d, material, x = 0, y = 0, z = 0, parent, r = 0) {
  const g = r > 0 ? rbox(w, h, d, r, 2) : new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Mesh(g, material); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; if (parent) parent.add(m); return m;
}
function canvasTexture(w, h, draw, opts = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  if (opts.repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
function sparkPath(ctx, cx, cy, R, color = '#FFC220') { drawSpark(ctx, cx, cy, R, color); }
const pops = [];   // (no pop-in/out: every entity enters and leaves physically)
function updatePops(dt) {
  for (let i = pops.length - 1; i >= 0; i--) {
    const p = pops[i]; p.t += dt; const k = clamp(p.t / p.dur, 0, 1);
    if (p.t < 0) continue;
    if (p.out) { const s = p.target * (1 - easeIO(k)); p.obj.scale.setScalar(Math.max(0.0001, s)); }
    else p.obj.scale.setScalar(Math.max(0.0001, p.target * easeOutBack(k)));
    if (k >= 1) { pops.splice(i, 1); if (p.done) p.done(); }
  }
}

// ---------------------------------------------------------------- paths
class Path {
  constructor(pts, opts = {}) {             // pts: Vector3[] polyline (already smooth or with corners to round)
    const r = opts.round ?? 0; let P = pts;
    if (r > 0 && pts.length > 2) P = roundCorners(pts, r);
    const out = [P[0].clone()];
    for (let i = 1; i < P.length; i++) { const a = P[i - 1], b = P[i], n = Math.max(1, Math.ceil(a.distanceTo(b) / 0.4)); for (let k = 1; k <= n; k++) out.push(a.clone().lerp(b, k / n)); }
    this.p = out; this.c = [0];
    for (let i = 1; i < out.length; i++) this.c.push(this.c[i - 1] + out[i].distanceTo(out[i - 1]));
    this.L = this.c[this.c.length - 1];
  }
  at(s, out = new THREE.Vector3()) {
    const p = this.p, c = this.c;
    if (s <= 0) { const d = p[1].clone().sub(p[0]).normalize(); return out.copy(p[0]).addScaledVector(d, s); }
    if (s >= this.L) { const n = p.length; const d = p[n - 1].clone().sub(p[n - 2]).normalize(); return out.copy(p[n - 1]).addScaledVector(d, s - this.L); }
    let lo = 0, hi = c.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (c[m] <= s) lo = m; else hi = m; }
    const t = (s - c[lo]) / Math.max(1e-6, c[hi] - c[lo]); return out.copy(p[lo]).lerp(p[hi], t);
  }
  tangent(s, out = new THREE.Vector3()) { const a = this.at(s - 0.5), b = this.at(s + 0.5); return out.copy(b).sub(a).normalize(); }
  slice(s0, s1, step = 0.6) { const r = []; for (let s = s0; s < s1; s += step) r.push(this.at(s)); r.push(this.at(s1)); return r; }
}
function roundCorners(pts, R) {
  const out = [pts[0].clone()];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], b = pts[i], c = pts[i + 1];
    const d1 = a.distanceTo(b), d2 = b.distanceTo(c), r = Math.min(R, d1 * 0.45, d2 * 0.45);
    const p0 = b.clone().lerp(a, r / d1), p2 = b.clone().lerp(c, r / d2);
    const n = 8; for (let k = 0; k <= n; k++) { const t = k / n; const q = new THREE.Vector3().addScaledVector(p0, (1 - t) * (1 - t)).addScaledVector(b, 2 * (1 - t) * t).addScaledVector(p2, t * t); out.push(q); }
  }
  out.push(pts[pts.length - 1].clone()); return out;
}
function curvePts(pts, n = 80) { return new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5).getSpacedPoints(n); }
function bezier(p0, p1, p2, p3, n = 40) { return new THREE.CubicBezierCurve3(p0, p1, p2, p3).getSpacedPoints(n); }
