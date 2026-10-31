import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeMats } from '../parts/v4/materials.js';
import { build as buildConveyor } from '../parts/v4/skateConveyor.js';
import { build as buildBaler } from '../parts/v4/baler.js';
import { build as buildCompactor } from '../parts/v4/compactor.js';
import { build as buildBoxTruck, setRearDoor } from '../parts/v4/dsdBoxTruck.js';
import { buildTractor, buildTrailer } from '../parts/v4/dsdTractorTrailer.js';
import { build as buildMcK } from '../parts/v4/mckessonTote.js';
import { build as buildJack } from '../parts/v4/palletJack.js';
import { build as buildPopSkid } from '../parts/v4/popSkid.js';
import { build as buildZebra } from '../parts/v4/zebraHandheld.js';
import { palletGeo as inkyPalletGeo } from '../parts/v4/_pallet.js';
import { build as buildWorkerI, restPose as wRest, walkPose as wWalk, jackPullPose as wPull, seatedDrivePose as wSeat, attachHandsTo as wHands } from '../parts/v4/worker.js';
import { build as buildWrapped } from '../parts/v4/wrappedSkid.js';

// ---------------- quality / renderer ----------------
const QS = new URLSearchParams(location.search);
const IS_TOUCH = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
const IS_PHONE = IS_TOUCH && Math.min(screen.width, screen.height) < 600;
let QUALITY = QS.get('q') || 'auto';
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: QUALITY !== 'low', powerPreference: 'high-performance', stencil: false });
const gl = renderer.getContext();
let gpu = '';
try { const ext = gl.getExtension('WEBGL_debug_renderer_info'); gpu = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : ''; } catch (e) {}
if (QUALITY === 'auto') QUALITY = /swiftshader|llvmpipe|software/i.test(gpu) ? 'low' : 'high';
window.__quality = QUALITY;
const DPR_CAP = QUALITY === 'low' ? 1 : (IS_PHONE ? 1.25 : 1.5);
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, DPR_CAP));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.shadowMap.enabled = false;

const scene = new THREE.Scene();
// chunked build: yield to the browser between builders so no single task blocks for long
const __yield = (l) => new Promise((r) => requestAnimationFrame(() => setTimeout(() => { __mark(l || 'y'); r(); }, 0)));
window.__yt = []; const __mark = (l) => window.__yt.push([l, Math.round(performance.now())]);
const __done = new Set();
async function __compile(ms) { const t00 = performance.now(); const list = [], vis = new Map(); scene.traverse((o) => { vis.set(o, o.visible); if (!o.isMesh && !o.isSprite && !o.isPoints && !o.isLine) return; const ms_ = Array.isArray(o.material) ? o.material : [o.material]; for (const m of ms_) { if (!m) continue; const k = m.uuid + (o.isInstancedMesh ? 'i' : '') + (o.isSprite ? 's' : '') + (o.isSkinnedMesh ? 'k' : ''); if (__done.has(k)) continue; __done.add(k); list.push(o); break; } });
  // link programs a few at a time: render only the representative object of each new material, yield between slices
  for (const o of vis.keys()) if (!o.isLight && o !== scene) o.visible = false;
  let t0 = performance.now(), n = 0;
  for (const o of list) { const chain = []; for (let q = o; q && q !== scene; q = q.parent) { chain.push(q); q.visible = true; } const fc = o.frustumCulled; o.frustumCulled = false;
    try { renderer.render(scene, camera); } catch (e) {} o.frustumCulled = fc; for (const q of chain) q.visible = false; n++;
    if (performance.now() - t0 > 70) { await new Promise((r) => setTimeout(r, 0)); t0 = performance.now(); }
    if (performance.now() - t00 > ms) break; }
  for (const [o, v] of vis) o.visible = v;
  __mark('compile ' + n + '/' + list.length + ' ' + Math.round(performance.now() - t00)); }
function __earlyPaint() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.position.set(24, 31, 45); camera.lookAt(-3.5, -2, 4); camera.updateProjectionMatrix(); renderer.render(scene, camera); const l = document.getElementById('gfLoad'); if (l) l.remove(); }
scene.background = new THREE.Color('#eef0f6');
scene.fog = new THREE.Fog('#eef0f6', 110, 260);
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 400);
camera.position.set(-2, 1.65, 18);
window.__R = { renderer, scene, camera };

scene.add(new THREE.HemisphereLight('#f4f7ff', '#8a8a86', 1.55));
const sun = new THREE.DirectionalLight('#ffffff', 1.25); sun.position.set(-20, 40, 25); scene.add(sun);
const fill = new THREE.DirectionalLight('#dfe9ff', 0.45); fill.position.set(30, 20, -30); scene.add(fill);

// ---------------- shared material cache ----------------
const PM = makeMats(THREE); // Inky's shared part materials (one cache for every imported model)
const MAT = {};
MAT.v = new THREE.MeshLambertMaterial({ vertexColors: true });                    // static merged geometry
MAT.e = new THREE.MeshBasicMaterial({ vertexColors: true });                      // emissive (tubes, exit sign body)
MAT.iv = new THREE.MeshLambertMaterial({ vertexColors: true });                   // every instanced untextured mesh
const C = (h) => new THREE.Color(h);
let _rs = 1234567; const seed = (v) => { _rs = v; }; const rnd = () => ((_rs = (_rs * 16807) % 2147483647) / 2147483647);
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

// ---------------- canvas textures ----------------
function canvasTex(w, h, draw, repeat) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
const concreteTex = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#9a9c9c'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) { const v = 130 + rnd() * 50 | 0; g.fillStyle = `rgba(${v},${v},${v - 2},${0.08 + rnd() * 0.1})`; const r = 1 + rnd() * 6; g.fillRect(rnd() * w, rnd() * h, r, r); }
  for (let i = 0; i < 14; i++) { const x = rnd() * w, y = rnd() * h, r = 20 + rnd() * 70; const gr = g.createRadialGradient(x, y, 1, x, y, r); gr.addColorStop(0, 'rgba(60,60,58,0.18)'); gr.addColorStop(1, 'rgba(60,60,58,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
  g.strokeStyle = 'rgba(70,70,70,0.35)'; g.lineWidth = 1.2; for (let i = 0; i < 3; i++) { g.beginPath(); let x = rnd() * w, y = rnd() * h; g.moveTo(x, y); for (let k = 0; k < 8; k++) { x += (rnd() - 0.5) * 60; y += rnd() * 40; g.lineTo(x, y); } g.stroke(); }
  g.strokeStyle = 'rgba(90,90,90,0.5)'; g.lineWidth = 2; g.strokeRect(0, 0, w, h); // saw-cut joints
}, [1, 1]);
const cartonTex = canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 200; i++) { g.fillStyle = `rgba(120,90,50,${rnd() * 0.06})`; g.fillRect(0, rnd() * h, w, 1); }
  g.fillStyle = 'rgba(205,180,130,0.55)'; g.fillRect(w * 0.44, 0, w * 0.12, h);           // tape
  g.fillStyle = '#f7f7f2'; g.fillRect(w * 0.12, h * 0.6, w * 0.26, h * 0.2);               // label
  g.fillStyle = '#333'; for (let i = 0; i < 9; i++) g.fillRect(w * 0.14 + i * 3, h * 0.63, 1.5, h * 0.1);
  g.strokeStyle = 'rgba(90,60,30,0.35)'; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2);
});
MAT.carton = new THREE.MeshLambertMaterial({ map: cartonTex });
MAT.wrap = new THREE.MeshLambertMaterial({ color: '#eef4f8', transparent: true, opacity: 0.42, depthWrite: false, emissive: '#30363c' });
const blobTex = canvasTex(64, 64, (g, w, h) => { const gr = g.createRadialGradient(32, 32, 2, 32, 32, 31); gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(0.6, 'rgba(0,0,0,0.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
MAT.blob = new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, color: '#ffffff' });

// ---------------- sign atlas (one texture, one draw call for every sign / decal) ----------------
const ATL = 2048; const atlasCv = document.createElement('canvas'); atlasCv.width = atlasCv.height = ATL; const AG = atlasCv.getContext('2d');
let ax = 0, ay = 0, arow = 0;
function atlasCell(w, h, draw) { if (ax + w > ATL) { ax = 0; ay += arow + 2; arow = 0; } const r = { x: ax, y: ay, w, h }; AG.save(); AG.translate(ax, ay); AG.beginPath(); AG.rect(0, 0, w, h); AG.clip(); draw(AG, w, h); AG.restore(); ax += w + 2; arow = Math.max(arow, h); return r; }
const FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif';
function sparkPath(g, cx, cy, r) { g.save(); g.translate(cx, cy); for (let i = 0; i < 6; i++) { g.rotate(Math.PI / 3); g.beginPath(); g.ellipse(0, -r * 0.62, r * 0.17, r * 0.36, 0, 0, 7); g.fill(); } g.restore(); }
function textSign(lines, { w = 512, h = 128, bg = '#0071ce', fg = '#fff', sub = '#cfe6ff', border = null, size = 0.5, spark = false } = {}) {
  return atlasCell(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h); if (border) { g.strokeStyle = border; g.lineWidth = h * 0.06; g.strokeRect(g.lineWidth / 2, g.lineWidth / 2, w - g.lineWidth, h - g.lineWidth); }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    let x0 = w / 2; if (spark) { g.fillStyle = '#ffc220'; sparkPath(g, h * 0.55, h / 2, h * 0.36); x0 = w / 2 + h * 0.3; }
    if (lines.length === 1) { g.fillStyle = fg; g.font = `bold ${h * size}px ${FONT}`; g.fillText(lines[0], x0, h * 0.53, w * 0.9 - (spark ? h : 0)); }
    else { g.fillStyle = fg; g.font = `bold ${h * 0.42}px ${FONT}`; g.fillText(lines[0], x0, h * 0.36, w * 0.9 - (spark ? h : 0)); g.fillStyle = sub; g.font = `600 ${h * 0.24}px ${FONT}`; g.fillText(lines[1], x0, h * 0.76, w * 0.9 - (spark ? h : 0)); }
  });
}
const SIGN = {};
SIGN.walmart = atlasCell(1024, 256, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.fillStyle = '#0071ce'; g.font = `bold ${h * 0.5}px ${FONT}`; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText('Walmart', w * 0.12, h * 0.52); const tw = g.measureText('Walmart').width; g.fillStyle = '#ffc220'; sparkPath(g, w * 0.12 + tw + h * 0.32, h * 0.45, h * 0.28); g.fillStyle = '#0071ce'; g.fillRect(0, h * 0.86, w, h * 0.08); });
SIGN.walmartCab = atlasCell(256, 64, (g, w, h) => { g.fillStyle = '#0071ce'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = `bold ${h * 0.55}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Walmart', w * 0.45, h * 0.55); g.fillStyle = '#ffc220'; sparkPath(g, w * 0.86, h / 2, h * 0.34); });
for (const k of ['FDS', 'CP', 'ADS', 'MP']) SIGN['pl_' + k] = textSign([k], { w: 256, h: 160, bg: '#ffffff', fg: '#111', border: '#111', size: 0.62 });
SIGN.bev = textSign(['Beverage Vendor', 'Direct store delivery'], { w: 1024, h: 256, bg: '#c8102e', fg: '#fff', sub: '#ffe0e0' });
SIGN.snack = textSign(['Snack Vendor', 'Direct store delivery'], { w: 1024, h: 256, bg: '#1c4fa8', fg: '#fff', sub: '#d9e6ff' });
SIGN.exit = atlasCell(192, 96, (g, w, h) => { g.fillStyle = '#0a8f3c'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.fillRect(w * 0.1, h * 0.2, w * 0.28, h * 0.6); g.fillStyle = '#0a8f3c'; g.beginPath(); g.arc(w * 0.24, h * 0.33, h * 0.07, 0, 7); g.fill(); g.fillRect(w * 0.2, h * 0.42, w * 0.08, h * 0.25); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(w * 0.5, h * 0.5); g.lineTo(w * 0.65, h * 0.25); g.lineTo(w * 0.65, h * 0.4); g.lineTo(w * 0.88, h * 0.4); g.lineTo(w * 0.88, h * 0.6); g.lineTo(w * 0.65, h * 0.6); g.lineTo(w * 0.65, h * 0.75); g.closePath(); g.fill(); });
SIGN.memo = atlasCell(128, 160, (g, w, h) => { g.fillStyle = '#fbfbf7'; g.fillRect(0, 0, w, h); g.fillStyle = '#222'; g.fillRect(8, 8, 50, 8); for (let i = 0; i < 14; i++) g.fillRect(8, 26 + i * 9, 30 + (i * 37 % 70), 2); g.fillRect(90, 10, 3, 30); g.fillRect(96, 10, 2, 30); g.fillRect(101, 10, 4, 30); g.strokeStyle = '#2a4ab0'; g.lineWidth = 2; g.beginPath(); g.moveTo(60, 140); g.bezierCurveTo(70, 125, 80, 150, 100, 132); g.stroke(); });
SIGN.cooler = textSign(['COOLER'], { w: 384, h: 96, bg: '#ffffff', fg: '#0b3d91', border: '#0b3d91', size: 0.5 });
SIGN.freezer = textSign(['FREEZER'], { w: 384, h: 96, bg: '#ffffff', fg: '#0b3d91', border: '#0b3d91', size: 0.5 });
SIGN.caution = atlasCell(256, 128, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#c8102e'; g.fillRect(0, 0, w, h * 0.3); g.fillStyle = '#fff'; g.font = `bold ${h * 0.2}px ${FONT}`; g.textAlign = 'center'; g.fillText('CAUTION', w / 2, h * 0.22); g.fillStyle = '#333'; for (let i = 0; i < 5; i++) g.fillRect(w * 0.1, h * (0.42 + i * 0.1), w * (0.5 + (i % 3) * 0.12), h * 0.04); });
const atlasTex = new THREE.CanvasTexture(atlasCv); atlasTex.colorSpace = THREE.SRGBColorSpace; atlasTex.anisotropy = 8;
MAT.sign = new THREE.MeshBasicMaterial({ map: atlasTex });

// ---------------- static geometry builder ----------------
function paint(g, col) { const c = C(col), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; }
function norm(g) { if (g.index) g = g.toNonIndexed(); for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(k)) g.deleteAttribute(k); if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); return g; }
class Builder {
  constructor() { this.g = []; }
  add(geo, col, x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0) { if (rx) geo.rotateX(rx); if (rz) geo.rotateZ(rz); if (ry) geo.rotateY(ry); geo.translate(x, y, z); if (col) paint(geo, col); this.g.push(norm(geo)); return this; }
  box(w, h, d, x, y, z, col, ry = 0) { return this.add(new THREE.BoxGeometry(w, h, d), col, x, y, z, ry); }
  boxB(x0, y0, z0, x1, y1, z1, col) { return this.box(x1 - x0, y1 - y0, z1 - z0, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, col); }
  cyl(r, h, x, y, z, col, seg = 10, rx = 0, rz = 0, r2) { return this.add(new THREE.CylinderGeometry(r2 ?? r, r, h, seg), col, x, y, z, 0, rx, rz); }
  inner(w, h, d, x, y, z, col) { const g = new THREE.BoxGeometry(w, h, d); const ix = g.index.array; for (let i = 0; i < ix.length; i += 3) { const t = ix[i]; ix[i] = ix[i + 2]; ix[i + 2] = t; } const n = g.attributes.normal.array; for (let i = 0; i < n.length; i++) n[i] = -n[i]; return this.add(g, col, x, y, z); }
  // single-sided quad facing direction (nx,nz) — used for cutaway walls (invisible from outside)
  wall(x0, z0, x1, z1, y0, y1, col) { const len = Math.hypot(x1 - x0, z1 - z0); const g = new THREE.PlaneGeometry(len, y1 - y0); const ang = Math.atan2(x1 - x0, z1 - z0); g.rotateY(ang - Math.PI / 2); return this.add(g, col, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); }
  merge(mat, name) { const m = new THREE.Mesh(mergeGeometries(this.g, false), mat); m.name = name || ''; m.matrixAutoUpdate = false; this.g.length = 0; return m; }
}
// sign quads -> atlas UVs
const signGeos = [];
function sign(cell, w, h, x, y, z, ry = 0, rx = 0) { const g = new THREE.PlaneGeometry(w, h); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) { uv.setXY(i, (cell.x + uv.getX(i) * cell.w) / ATL, 1 - (cell.y + (1 - uv.getY(i)) * cell.h) / ATL); } if (rx) g.rotateX(rx); g.rotateY(ry); g.translate(x, y, z); signGeos.push(norm(paint(g, '#ffffff'))); }

await __yield("a1");
// ======================= STATIC SCENE =======================
// Layout (metres, y up). Backroom x[-20,20] z[-12,12]. Dock wall = south (z=+12), trailers outside (z>12, ground y=-1.2).
// Cooler/freezer wall = north (z=-12). Sales floor east of x=20 (door at z=0).
const BR = { x0: -20, x1: 20, z0: -12, z1: 12, H: 7.4 };
const SF = { x0: 20, x1: 64, z0: -14, z1: 14 };
const GROUND = -1.2;
const DOORS = { DSD: { x: -16.5, w: 2.8 }, C: { x: -11.5, w: 3 }, A: { x: -5, w: 3 }, B: { x: 8, w: 3 } };
const ROLLER = { x: 8, zHead: 15.2, zTail: -6.6, w: 0.62 };
const rollerY = (z) => 0.84 - (ROLLER.zHead - z) * 0.0045; // gravity slope (top of wheels)
const S = new Builder();
const UP = new Builder(); const CUT = 3.4; // UP = everything above the diorama cut line (hidden in cutaway views)
function wallC(x0, z0, x1, z1, y0, y1, col, cut = CUT) { if (y1 <= cut) S.wall(x0, z0, x1, z1, y0, y1, col); else if (y0 >= cut) UP.wall(x0, z0, x1, z1, y0, y1, col); else { S.wall(x0, z0, x1, z1, y0, cut, col); UP.wall(x0, z0, x1, z1, cut, y1, col); } }
const WALL = '#efefec', WALL2 = '#e4e4e0', STEEL = '#9aa3ab', DARK = '#2b2f33', YEL = '#f2c200', BLK = '#1d1f22';

// floors
const floorBR = new THREE.Mesh(new THREE.PlaneGeometry(40, 24).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: concreteTex }));
concreteTex.repeat.set(8, 5); floorBR.position.set(0, 0, 0); floorBR.matrixAutoUpdate = false; floorBR.updateMatrix(); scene.add(floorBR);
S.add(new THREE.PlaneGeometry(44, 28).rotateX(-Math.PI / 2), '#e9e7e2', 42, 0.001, 0); // sales floor tile
for (let x = 21; x < 64; x += 2) S.box(0.02, 0.003, 28, x, 0.003, 0, '#dddad4');
for (let z = -13; z < 14; z += 2) S.box(44, 0.003, 0.02, 42, 0.003, z, '#dddad4');
S.add(new THREE.PlaneGeometry(200, 160).rotateX(-Math.PI / 2), '#b9bcc6', -10, GROUND, 60); // yard (light, diorama look)
S.box(200, 0.4, 0.3, -10, GROUND + 0.2, 12.2 + 0.0, '#6f7274'); // curb under dock wall
for (let x = -60; x < 60; x += 6) S.box(3, 0.01, 0.15, x, GROUND + 0.01, 39.5, '#e8e2c8'); // lane dashes
// yellow safety markings in the backroom
for (const d of Object.values(DOORS)) { S.box(d.w + 0.6, 0.004, 0.1, d.x, 0.004, 9.6, YEL); }
S.box(0.1, 0.004, 21, 3.6, 0.004, 0.5, YEL); S.box(0.1, 0.004, 21, 12.4, 0.004, 0.5, YEL);
for (let i = 0; i < 6; i++) S.add(new THREE.BoxGeometry(0.12, 0.004, 1.4), YEL, -17 + i * 0.5, 0.004, -11, 0.7); // hatched keep-clear by claims cage

// ---- walls (single-sided, inward) ----
function wallWithDoors(isExterior) {
  // south dock wall z=12, inward normal -z  => run x from +20 to -20 ; exterior face normal +z => run -20..+20 at z=12.25
  const z = isExterior ? 12.25 : 12, col = isExterior ? '#d8d4cc' : WALL;
  const ds = Object.values(DOORS).sort((a, b) => a.x - b.x); let x = -20;
  const seg = (xa, xb, y0, y1) => isExterior ? wallC(xa, z, xb, z, y0, y1, col, 0.9) : wallC(xb, z, xa, z, y0, y1, col);
  for (const d of ds) { seg(x, d.x - d.w / 2, isExterior ? GROUND : 0, BR.H); seg(d.x - d.w / 2, d.x + d.w / 2, 3.0, BR.H); x = d.x + d.w / 2; }
  seg(x, 20, isExterior ? GROUND : 0, BR.H);
  if (isExterior) { UP.box(40, 0.6, 0.05, 0, 5.6, 12.3, '#0071ce'); UP.box(40, 0.12, 0.05, 0, 5.15, 12.3, '#ffc220'); S.box(40.6, 0.1, 0.36, 0, 0.95, 12.15, '#cfd5dc'); }
}
wallWithDoors(false); wallWithDoors(true);
wallC(-20, -12, 20, -12, 0, BR.H, '#f6f6f4');                  // north (cooler wall, insulated panel white)
wallC(-20, 12, -20, -12, 0, BR.H, WALL);                         // west
wallC(20, -12, 20, -1.6, 0, BR.H, WALL); wallC(20, 1.6, 20, 12, 0, BR.H, WALL); wallC(20, -1.6, 20, 1.6, 3.2, BR.H, WALL); // east (backroom side)
wallC(20, 12, 20, 1.6, 0, 5.5, '#f3f1ec'); wallC(20, -1.6, 20, -12, 0, 5.5, '#f3f1ec'); wallC(20, 1.6, 20, -1.6, 3.2, 5.5, '#f3f1ec'); // east wall, sales-floor side
UP.box(0.05, 0.9, 24, 20.03, 4.6, 0, '#0071ce');
wallC(64, -14, 20, -14, 0, 5.5, '#f3f1ec'); wallC(20, 14, 64, 14, 0, 5.5, '#f3f1ec'); wallC(64, 14, 64, -14, 0, 5.5, '#f3f1ec');
// panel seams on the cooler wall + wall base
for (let x = -19; x < 20; x += 1.2) S.box(0.02, CUT, 0.01, x, CUT / 2, -11.99, '#e1e2e0');
S.box(40, 0.25, 0.05, 0, 0.125, -11.97, '#c9cbc9');
// ceiling: black deck (faces down, invisible from above), black trusses, conduit, strip lights
UP.add(new THREE.PlaneGeometry(40, 24), '#16181b', 0, BR.H + 0.5, 0, 0, Math.PI / 2);
UP.add(new THREE.PlaneGeometry(44, 28), '#2a2d31', 42, 6.2, 0, 0, Math.PI / 2);
const tubes = new Builder();
for (let x = -18; x <= 18; x += 4) { UP.box(0.18, 0.5, 24, x, BR.H + 0.2, 0, '#1a1c1f'); for (let z = -11; z <= 11; z += 2.2) UP.add(new THREE.BoxGeometry(0.04, 0.6, 0.04), '#1a1c1f', x, BR.H - 0.25, z, 0, 0, 0.6); UP.box(0.06, 0.06, 24, x, BR.H - 0.55, 0, '#1a1c1f'); }
for (let z = -10; z <= 10; z += 5) UP.box(40, 0.04, 0.04, 0, BR.H - 0.1, z + 0.4, '#8a8f94');
for (let x = -16; x <= 16; x += 8) for (let z = -9; z <= 9; z += 6) { tubes.box(0.12, 0.05, 2.4, x, 5.7, z, '#ffffff'); UP.box(0.16, 0.06, 2.5, x, 5.76, z, '#cfd3d6'); UP.box(0.01, 1.6, 0.01, x, 6.6, z - 1, '#444'); UP.box(0.01, 1.6, 0.01, x, 6.6, z + 1, '#444'); }
for (let x = 24; x <= 60; x += 6) for (let z = -11; z <= 11; z += 5.5) { tubes.box(0.12, 0.05, 2.4, x, 5.5, z, '#ffffff'); }
// wall caps at the cut line (toy-diorama trim)
for (const [w, d, x, z] of [[40.4, 0.24, 0, -12.05], [0.24, 24.4, -20.05, 0], [0.24, 24.4, 20.05, 0], [0.24, 28, 64, 0], [44, 0.24, 42, -14], [44, 0.24, 42, 14]]) S.box(w, 0.08, d, x, CUT + 0.04, z, '#cfd5dc');
// vertical pipes / conduits on west wall corner like the refs
for (let i = 0; i < 4; i++) S.cyl(0.05, CUT, -19.85, CUT / 2, -11.6 + i * 0.16, '#e9e9e6', 8);
S.box(0.6, 0.8, 0.25, -6.5, 2.2, -11.85, '#c9cbcd'); S.box(0.5, 0.6, 0.2, 0.5, 2.0, -11.88, '#b9bcbf'); // electrical boxes
// EXIT sign mounted on the north wall (below the cut line)
S.box(0.42, 0.2, 0.06, -0.5, 3.05, -11.95, '#e8e8e8'); sign(SIGN.exit, 0.38, 0.18, -0.5, 3.05, -11.915, 0);

// ---- dock doors (rolled up), seals, levelers, bollards ----
for (const [k, d] of Object.entries(DOORS)) {
  S.box(d.w + 0.3, 0.5, 0.5, d.x, 3.3, 11.7, '#b8bec4');                       // roll-up drum hood
  S.box(0.12, 3.0, 0.12, d.x - d.w / 2 - 0.06, 1.5, 11.95, '#d7dadd'); S.box(0.12, 3.0, 0.12, d.x + d.w / 2 + 0.06, 1.5, 11.95, '#d7dadd');
  S.box(d.w - 0.2, 0.03, 2.2, d.x, 0.015, 10.9, '#7d8389');                     // dock leveler plate
  for (const s of [-1, 1]) { S.cyl(0.11, 1.2, d.x + s * (d.w / 2 + 0.45), 0.6, 11.4, YEL, 10); S.cyl(0.115, 0.04, d.x + s * (d.w / 2 + 0.45), 1.2, 11.4, '#222', 10); }
  // exterior seal pads + bumpers
  S.box(0.35, 3.4, 0.4, d.x - d.w / 2 - 0.2, 1.4, 12.45, BLK); S.box(0.35, 3.4, 0.4, d.x + d.w / 2 + 0.2, 1.4, 12.45, BLK); S.box(d.w + 0.75, 0.6, 0.4, d.x, 3.3, 12.45, BLK);
  S.box(0.3, 0.3, 0.2, d.x - 0.9, -0.2, 12.35, '#111'); S.box(0.3, 0.3, 0.2, d.x + 0.9, -0.2, 12.35, '#111');
  S.box(d.w + 1, GROUND * -1, 0.2, d.x, GROUND / 2, 12.3, '#8e8f8c'); // dock face concrete
}
// ---- cooler + freezer doors with yellow guard rails (north wall, like the refs) ----
function coldDoor(x, label) {
  S.box(2.7, 3.0, 0.08, x, 1.5, -11.95, '#d6dadc'); S.box(2.4, 2.75, 0.1, x, 1.4, -11.92, '#b4bbc0');
  for (let i = 0; i < 10; i++) S.box(2.38, 0.015, 0.105, x, 0.2 + i * 0.27, -11.91, '#a5acb2');
  sign(label, 1.0, 0.25, x, 3.25, -11.89, 0); sign(SIGN.caution, 0.5, 0.25, x - 0.95, 2.6, -11.89, 0);
  for (const s of [-1, 1]) { const px = x + s * 1.8; for (const pz of [-11.85, -10.9]) S.cyl(0.05, 1.05, px, 0.53, pz, YEL, 8); S.box(0.06, 0.06, 1.05, px, 1.0, -11.37, YEL); S.box(0.06, 0.06, 1.05, px, 0.55, -11.37, YEL);
    S.cyl(0.05, 1.05, x + s * 3.0, 0.53, -10.9, YEL, 8); S.box(1.2, 0.06, 0.06, x + s * 2.4, 1.0, -10.9, YEL); S.box(1.2, 0.06, 0.06, x + s * 2.4, 0.55, -10.9, YEL); }
  S.cyl(0.14, 1.3, x - 2.0, 0.65, -10.3, YEL, 12); S.cyl(0.14, 1.3, x + 2.0, 0.65, -10.3, YEL, 12);
}
coldDoor(-3.6, SIGN.cooler); coldDoor(3.0, SIGN.freezer);

// ---- roller conveyor: Inky's skate-wheel line (parts/v4/skateConveyor.js), runs along z from inside trailer B to the sort area ----
{ const cv = buildConveyor(THREE, PM, { length: ROLLER.zHead - ROLLER.zTail, height: 0.84 }); cv.rotation.y = Math.PI / 2; cv.position.set(ROLLER.x, 0, (ROLLER.zHead + ROLLER.zTail) / 2); scene.add(cv); }
await __yield();
// ---- Sales floor gondolas (static stock, with gaps where overnight stockers fill) ----
const GOND = []; // {x0,x1,z}  double-sided, depth 1.2
const SHELF_Y = [0.12, 0.55, 0.98, 1.41];
const prodCols = ['#d64541', '#2e86de', '#f5b041', '#27ae60', '#8e44ad', '#ecf0f1', '#e67e22', '#16a085', '#f1c40f', '#c0392b', '#3498db', '#fdfefe'];
for (const z of [-10.5, -7, -3.5, 3.5, 7, 10.5]) for (const [x0, x1] of [[25, 37], [41, 53]]) GOND.push({ x0, x1, z });
const HOLES = []; // empty shelf slots to be filled by stockers: {x,y,z,face,used}
for (const g of GOND) {
  const L = g.x1 - g.x0, cx = (g.x0 + g.x1) / 2;
  S.box(L, 1.8, 0.08, cx, 0.9, g.z, '#c9ccd0'); S.box(L, 0.12, 1.2, cx, 0.06, g.z, '#b5b9bd');
  for (let x = g.x0; x <= g.x1 + 0.01; x += 1.2) S.box(0.05, 1.9, 1.2, x, 0.95, g.z, '#aeb3b8');
  for (const y of SHELF_Y.slice(1)) S.box(L, 0.03, 1.15, cx, y - 0.015, g.z, '#d9dcdf');
  S.box(L, 0.04, 0.04, cx, 1.86, g.z, '#b5b9bd');
  for (const face of [-1, 1]) for (const y of SHELF_Y) for (let x = g.x0 + 0.1; x < g.x1 - 0.25; x += 0.3) {
    const zz = g.z + face * 0.33;
    const isHole = (x > g.x0 + 3 && x < g.x0 + 7.5 && rnd() < 0.55);
    if (isHole) { HOLES.push({ x: x + 0.14, y, z: zz, face, used: false, gz: g.z }); continue; }
    const h = 0.22 + rnd() * 0.16, col = prodCols[(rnd() * prodCols.length) | 0];
    S.box(0.27, h, 0.48, x + 0.14, y + h / 2, zz, col);
  }
}
// Sales-floor department header signs (only verified names next to numbers)
const AISLE_SIGNS = [
  { x: 31, z: -5.25, l: ['Dept 46 · Cosmetics', 'Beauty / cosmetics'] }, { x: 31, z: 5.25, l: ['Dept 2 · Health & Beauty', 'Personal care'] },
  { x: 47, z: -5.25, l: ['Dept 92 · Dry Grocery', 'Grocery'] }, { x: 47, z: 8.75, l: ['Dept 4 · Paper Goods', 'Household paper'] },
  { x: 31, z: -8.75, l: ['Dept 13 · Household Chemicals', 'Cleaning'] }, { x: 47, z: 5.25, l: ['Dept 1 · Candy & Tobacco', ''] },
  { x: 31, z: 8.75, l: ['Dept 8 · Pets & Supplies', ''] }, { x: 47, z: -8.75, l: ['Dept 40 · OTC Pharmacy', 'Pharmacy over-the-counter'] },
];
for (const a of AISLE_SIGNS) { const c = textSign(a.l[1] ? a.l : [a.l[0]], { w: 768, h: 160, size: 0.4 }); S.box(0.02, 1.2, 0.02, a.x, 3.4, a.z, '#555'); sign(c, 3.0, 0.62, a.x - 0.0, 2.75, a.z + 0.011, 0); sign(c, 3.0, 0.62, a.x, 2.75, a.z - 0.011, Math.PI); }
// Pharmacy counter (sales floor, far corner)
S.box(6, 1.1, 1, 59, 0.55, -12.5, '#e8e8e8'); S.box(6, 2.6, 0.1, 59, 2.4, -13.9, '#0071ce');
sign(textSign(['Pharmacy', 'Dept 38 Rx · Dept 40 OTC'], { w: 768, h: 192 }), 3.2, 0.8, 59, 3.1, -13.84, 0);
// Fashion floor racks (sales floor east end)
for (let i = 0; i < 4; i++) { S.cyl(0.6, 0.04, 58 + (i % 2) * 2.5, 1.4, 4 + (i >> 1) * 4, '#9aa0a6', 16); S.cyl(0.03, 1.4, 58 + (i % 2) * 2.5, 0.7, 4 + (i >> 1) * 4, '#9aa0a6', 6); for (let k = 0; k < 18; k++) { const a = k / 18 * Math.PI * 2; S.box(0.05, 0.75, 0.3, 58 + (i % 2) * 2.5 + Math.cos(a) * 0.6, 1.0, 4 + (i >> 1) * 4 + Math.sin(a) * 0.6, ['#2e4053', '#922b21', '#d4ac0d', '#1f618d', '#f0f3f4', '#6c3483'][(k + i) % 6], -a); } }
sign(textSign(['Fashion', 'Apparel · Depts 23–36'], { w: 768, h: 192 }), 3.2, 0.8, 59.2, 3.4, 13.89, Math.PI);

// ---- Backroom zones ----
// Receiving desk (west wall near DSD door)
S.box(0.8, 0.9, 2.2, -19.4, 0.45, 7.6, '#5d6d7e'); S.box(0.9, 0.04, 2.3, -19.4, 0.92, 7.6, '#d5d8dc');
S.box(0.4, 0.3, 0.05, -19.5, 1.15, 7.2, '#222'); S.box(0.3, 0.2, 0.3, -19.4, 1.04, 8.2, '#ecf0f1'); // monitor + label printer
sign(textSign(['Receiving', 'Check-in · invoices · memos'], { w: 768, h: 192 }), 2.6, 0.65, -19.95, 3.0, 7.6, Math.PI / 2);
// Claims & returns cage (north-west corner)
{ const x0 = -19.9, x1 = -14.5, z0 = -11.9, z1 = -8.4;
  for (let x = x0; x <= x1 + 0.01; x += 0.9) if (x < -16.7 || x > -15.0) S.box(0.04, 2.4, 0.04, x, 1.2, z1, '#7f8c8d');
  S.box(0.06, 2.4, 0.06, -16.55, 1.2, z1, '#7f8c8d'); S.box(0.06, 2.4, 0.06, -15.15, 1.2, z1, '#7f8c8d'); S.box(1.4, 0.06, 0.06, -15.85, 2.37, z1, '#7f8c8d'); // open gate
  for (let z = z0; z <= z1 + 0.01; z += 0.9) S.box(0.04, 2.4, 0.04, x1, 1.2, z, '#7f8c8d');
  for (let y = 0.3; y < 2.4; y += 0.3) { S.box(-16.55 - x0, 0.015, 0.015, (x0 - 16.55) / 2, y, z1, '#95a5a6'); S.box(x1 + 15.15, 0.015, 0.015, (x1 - 15.15) / 2, y, z1, '#95a5a6'); S.box(0.015, 0.015, z1 - z0, x1, y, (z0 + z1) / 2, '#95a5a6'); }
  for (const y of [0.05, 0.9, 1.6]) S.box(3.6, 0.04, 0.7, -17.9, y, -11.5, '#8c97a1');
  sign(textSign(['Claims & Returns', 'Damages · RTV · return mailers'], { w: 768, h: 192 }), 2.4, 0.6, (x0 + x1) / 2, 2.75, z1 + 0.02, 0); }
await __yield();
// Baler + compactor (west wall) — Inky's models
const BALER = buildBaler(THREE, PM, { doorOpen: 0, platenY: 1, fill: 0.35 }); BALER.rotation.y = Math.PI / 2; BALER.position.set(-19.4, 0, -3.2); scene.add(BALER);
sign(textSign(['Cardboard baler'], { w: 512, h: 96, size: 0.46 }), 1.8, 0.34, -19.97, 3.6, -3.2, Math.PI / 2);
const COMPACTOR = buildCompactor(THREE, PM, { wall: true }); COMPACTOR.rotation.y = Math.PI; COMPACTOR.position.set(-20 - COMPACTOR.userData.wallX, 0, 1.2); scene.add(COMPACTOR);
S.box(4.2, -GROUND, 2.6, -22.3, GROUND / 2, 1.2, '#8e8f8c'); // exterior concrete pad under the compactor body
sign(textSign(['Trash compactor'], { w: 512, h: 96, size: 0.46 }), 1.8, 0.34, -19.97, 3.0, 1.2, Math.PI / 2);
S.box(1.1, 1.0, 0.8, -16.9, 0.5, -1.4, '#a0784c'); // cardboard cart (flattened boxes waiting)
// Omni / online grocery staging (south-east): tote shelving + carts
for (const [x, z, ry] of [[14, 11.4, 0], [17.5, 11.4, 0]]) { for (const y of [0.05, 0.6, 1.15, 1.7]) S.box(3.2, 0.03, 0.75, x, y, z, '#99a3a4'); for (const sx of [-1.58, 1.58]) for (const sz of [-0.35, 0.35]) S.box(0.04, 2.0, 0.04, x + sx, 1.0, z + sz, '#7f8c8d'); }
for (const [x, z] of [[19.4, 7.5], [19.4, 4.5]]) { for (const y of [0.05, 0.6, 1.15, 1.7]) S.box(0.75, 0.03, 2.6, x, y, z, '#99a3a4'); }
sign(textSign(['OMNI · Online Grocery', 'Pickup & delivery staging'], { w: 768, h: 192 }), 2.8, 0.7, 16, 2.75, 11.6, Math.PI);
S.box(1.5, 1.9, 0.9, 13.0, 0.95, 7.0, '#3a6ea5'); S.box(1.5, 1.9, 0.9, 13.0, 0.95, 5.8, '#a93226'); // chill / frozen pick cabinets
sign(textSign(['Chill'], { w: 256, h: 96, bg: '#fff', fg: '#3a6ea5' }), 0.8, 0.3, 13.76, 1.6, 7.0, Math.PI / 2); sign(textSign(['Frozen'], { w: 256, h: 96, bg: '#fff', fg: '#a93226' }), 0.8, 0.3, 13.76, 1.6, 5.8, Math.PI / 2);
// Fashion processing (north-east): Z-racks
const ZR = [{ x: 15.5, z: -10.6 }, { x: 15.5, z: -8.9 }];
for (const r of ZR) { S.box(2.0, 0.04, 0.04, r.x, 1.75, r.z, '#bdc3c7'); for (const s of [-1, 1]) { S.box(0.04, 1.75, 0.04, r.x + s, 0.88, r.z, '#bdc3c7'); S.box(0.04, 0.04, 0.7, r.x + s, 0.1, r.z, '#bdc3c7'); S.cyl(0.04, 0.05, r.x + s, 0.04, r.z - 0.3, '#222', 8, 0, Math.PI / 2); S.cyl(0.04, 0.05, r.x + s, 0.04, r.z + 0.3, '#222', 8, 0, Math.PI / 2); } }
sign(textSign(['Fashion processing', 'Hang · tag · size'], { w: 768, h: 192 }), 2.6, 0.65, 15.5, 3.0, -11.92, 0);
sign(textSign(['Sales floor'], { w: 512, h: 128, size: 0.45 }), 2.0, 0.5, 19.97, 3.6, 0, -Math.PI / 2);
// Pallet return stack area marker
sign(textSign(['Empty pallets'], { w: 512, h: 96, size: 0.45, bg: '#ffffff', fg: '#0b3d91', border: '#0b3d91' }), 1.4, 0.26, -0.5, 1.9, 11.92, Math.PI);

// ---- Vehicles (static bodies merged; animated ones built separately) ----
// Walmart 53' trailer: rear at z0, extends +z by 16 m (dir=+1). cutaway roof when docked
function trailer(B, x, z0, { roof = true, placard = null, docked = true } = {}) {
  const L = 16, W = 2.6, H = 2.75, y0 = docked ? 0 : 0; // floor at dock height
  const zc = z0 + L / 2;
  B.box(W, 0.12, L, x, y0 - 0.06, zc, '#cfd4d8');                                   // floor
  B.box(0.04, H, L, x - W / 2, y0 + H / 2, zc, '#f4f5f6'); B.box(0.04, H, L, x + W / 2, y0 + H / 2, zc, '#f4f5f6');
  B.inner(W - 0.1, H - 0.02, L - 0.1, x, y0 + H / 2, zc, '#7c8288');
  B.box(W, H, 0.05, x, y0 + H / 2, z0 + L, '#f4f5f6');
  if (roof) B.box(W, 0.06, L, x, y0 + H + 0.03, zc, '#e8eaec'); else { B.box(0.08, 0.08, L, x - W / 2, y0 + H, zc, '#c4c9ce'); B.box(0.08, 0.08, L, x + W / 2, y0 + H, zc, '#c4c9ce'); for (let k = 1; k < 8; k++) B.box(W, 0.05, 0.05, x, y0 + H, z0 + k * 2, '#c4c9ce'); }
  B.box(W + 0.02, 0.25, 0.06, x, y0 + 0.02, z0 - 0.02, '#c0392b'); // ICC bar / rear sill
  for (const s of [-1, 1]) { B.box(0.06, H, 0.08, x + s * (W / 2 - 0.03), y0 + H / 2, z0, '#b0b6bb'); }
  // swing doors open against the sides
  B.box(0.04, H - 0.1, W / 2, x - W / 2 - 0.05, y0 + H / 2, z0 + W / 4, '#e9ebed'); B.box(0.04, H - 0.1, W / 2, x + W / 2 + 0.05, y0 + H / 2, z0 + W / 4, '#e9ebed');
  // running gear (tandem at rear) + landing gear
  for (const az of [z0 + 1.6, z0 + 2.9]) for (const s of [-1, 1]) B.cyl(0.5, 0.55, x + s * 0.95, GROUND + 0.5, az, '#1b1b1b', 14, 0, Math.PI / 2);
  B.box(2.0, 0.3, 3.2, x, GROUND + 0.95, z0 + 2.25, '#555');
  B.box(0.1, 1.2, 0.1, x - 0.9, GROUND + 0.6, z0 + 11.5, '#555'); B.box(0.1, 1.2, 0.1, x + 0.9, GROUND + 0.6, z0 + 11.5, '#555');
  B.box(W - 0.2, 0.3, L - 3.5, x, y0 - 0.25, zc + 1.5, '#4a4f54');
  sign(SIGN.walmart, 9, 2.25, x - W / 2 - 0.03, y0 + 1.45, zc + 0.5, -Math.PI / 2); sign(SIGN.walmart, 9, 2.25, x + W / 2 + 0.03, y0 + 1.45, zc + 0.5, Math.PI / 2);
  if (placard) { sign(SIGN['pl_' + placard], 0.8, 0.5, x + W / 2 + 0.031, y0 + 2.35, z0 + 1.2, Math.PI / 2); sign(SIGN['pl_' + placard], 0.8, 0.5, x - W / 2 - 0.031, y0 + 2.35, z0 + 1.2, -Math.PI / 2); sign(SIGN['pl_' + placard], 0.7, 0.44, x + 0.75, y0 + 2.4, z0 + L + 0.03, 0); }
}
// day-cab tractor at kingpin (x,zk) facing +z (away from dock)
function tractorBody(B, x, zk, col = '#0b3d91', ox = 0, oz = 0) { // body in local coords: rear axle at z=0, front at +z
  const g0 = B.g.length;
  B.box(2.4, 0.35, 6.3, 0, -0.55, 1.6, '#333'); B.box(2.3, 0.12, 1.4, 0, -0.32, -0.2, '#555');      // frame + fifth wheel deck
  B.box(2.45, 0.95, 2.1, 0, 0.0, 3.6, col); B.box(2.45, 0.9, 1.1, 0, 0.0, 5.05, col);                // cab lower body + hood
  B.box(2.45, 0.25, 2.1, 0, 2.05, 3.6, col); B.box(2.45, 0.8, 0.12, 0, 1.33, 2.6, col);               // roof cap + back wall (open glazing so the seated driver is visible)
  for (const sx of [-1.2, 1.2]) for (const sz of [2.6, 4.6]) B.box(0.08, 1.4, 0.08, sx, 1.25, sz, col);
  B.box(2.0, 0.6, 0.08, 0, -0.1, 5.62, '#c9ced2'); B.box(0.45, 0.06, 0.06, 0.55, 1.0, 4.2, '#222');  // grille, steering wheel
  for (const s of [-1, 1]) { B.box(0.08, 0.15, 0.4, s * 1.3, 1.05, 4.5, '#222'); B.box(0.6, 0.25, 0.4, s * 0.9, -0.5, 1.2, '#999'); B.cyl(0.33, 1.2, s * 1.15, 0.2, 2.2, '#c0c4c8', 10); }
  for (const [az, w] of [[0, 0.9], [4.6, 0.32]]) for (const s of [-1, 1]) B.cyl(0.52, w, s * 1.0, -0.68, az, '#1b1b1b', 14, 0, Math.PI / 2);
  for (let i = g0; i < B.g.length; i++) B.g[i].translate(x + ox, GROUND + 1.2, zk + oz);
  sign(SIGN.walmartCab, 1.2, 0.3, x + 1.255, GROUND + 1.45, zk + 3.6, Math.PI / 2); sign(SIGN.walmartCab, 1.2, 0.3, x - 1.255, GROUND + 1.45, zk + 3.6, -Math.PI / 2);
}
await __yield();
trailer(S, DOORS.A.x, 12.3, { roof: false, placard: 'FDS' }); tractorBody(S, DOORS.A.x, 12.3 + 15);
trailer(S, DOORS.B.x, 12.3, { roof: false, placard: 'CP' }); tractorBody(S, DOORS.B.x, 12.3 + 15);
// two more Walmart trucks waiting in the yard (ADS, MP), heading west on the yard lane
function xform(fn, m) { const s0 = signGeos.length, g0 = S.g.length; fn(); for (let i = g0; i < S.g.length; i++) S.g[i].applyMatrix4(m); for (let i = s0; i < signGeos.length; i++) signGeos[i].applyMatrix4(m); }
const YARD = [{ x: -22, z: 47, pl: 'ADS' }, { x: 6, z: 47, pl: 'MP' }];
for (const y of YARD) xform(() => { trailer(S, 0, 0, { roof: true, placard: y.pl }); tractorBody(S, 0, 15); }, new THREE.Matrix4().makeTranslation(y.x, 0, y.z).multiply(new THREE.Matrix4().makeRotationY(-Math.PI / 2)));

// static scene meshes
scene.add(S.merge(MAT.v, 'static'));
const LIGHTS_MESH = tubes.merge(MAT.e, 'lights'); scene.add(LIGHTS_MESH);
const UPPER = UP.merge(MAT.v, 'upper'); scene.add(UPPER);
// seated driver seats for static tractors (world coords) — filled in by the sim
const DRIVER_SEATS = [];
for (const d of [DOORS.A, DOORS.B]) DRIVER_SEATS.push({ x: d.x + 0.55, y: GROUND + 1.2 + 0.05, z: 12.3 + 15 + 3.5, yaw: 0 });
for (const y of YARD) DRIVER_SEATS.push({ x: y.x - 15 - 3.5, y: GROUND + 1.2 + 0.05, z: y.z + 0.55, yaw: -Math.PI / 2 });
{ const sm = new THREE.Mesh(mergeGeometries(signGeos, false), MAT.sign); sm.name = 'signs'; sm.matrixAutoUpdate = false; scene.add(sm); atlasTex.needsUpdate = true; }

await __yield("a2"); await __compile(2500); __earlyPaint(); __mark("paint"); await __yield("p");
// ======================= INSTANCED SYSTEMS =======================
const _m = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _v = new THREE.Vector3(), _s = new THREE.Vector3(), _e = new THREE.Euler(), _c = new THREE.Color();
class Pool {
  constructor(geo, mat, max, name) { if (!geo.attributes.color) paint(geo, '#ffffff'); this.mesh = new THREE.InstancedMesh(geo, mat, max); this.mesh.name = name; this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.mesh.frustumCulled = false; this.max = max; this.n = 0; for (let i = 0; i < max; i++) this.mesh.setColorAt(i, _c.set('#ffffff')); scene.add(this.mesh); }
  begin() { this.n = 0; }
  put(m, col) { if (this.n >= this.max) return -1; const i = this.n++; this.mesh.setMatrixAt(i, m); if (col !== undefined) { this.mesh.setColorAt(i, col); this.dirtyC = true; } return i; }
  end() { this.mesh.count = this.n; this.mesh.visible = this.n > 0; this.mesh.instanceMatrix.needsUpdate = true; if (this.dirtyC) { this.mesh.instanceColor.needsUpdate = true; this.dirtyC = false; } }
}
function TRS(x, y, z, ry = 0, sx = 1, sy = 1, sz = 1, rx = 0) { _e.set(rx, ry, 0, 'YXZ'); _q.setFromEuler(_e); return _m.compose(_v.set(x, y, z), _q, _s.set(sx, sy, sz)); }

// pallet geometry: long axis along z (1.22), 1.02 wide (x), 0.15 tall. Instance colour = pallet colour.
function palletGeo() {
  const B = new Builder();
  for (let i = 0; i < 7; i++) B.box(0.14, 0.02, 1.22, -0.44 + i * 0.1467, 0.14, 0, i % 2 ? '#f2f2f2' : '#ffffff');
  for (const x of [-0.45, 0, 0.45]) B.box(0.09, 0.09, 1.22, x, 0.085, 0, '#d9d9d9');
  for (const x of [-0.42, 0, 0.42]) B.box(0.14, 0.02, 1.22, x, 0.01, 0, '#e6e6e6');
  return mergeGeometries(B.g);
}
const PAL = new Pool(inkyPalletGeo(THREE, 3, ['#ffffff', '#f1f1f1', '#e6e6e6', '#f7f7f7']).rotateY(Math.PI / 2), PM.woodVC, 90, 'pallets'); // Inky's 48x40 stringer pallet, tinted per instance
const PAL_H = 0.144;
const CART = new Pool(new THREE.BoxGeometry(1, 1, 1), MAT.carton, 1400, 'cartons');
const WRAP = new Pool(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), PM.wrap, 16, 'wrap'); WRAP.mesh.renderOrder = 2;
const BLOB = new Pool(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), MAT.blob, 160, 'blobs'); BLOB.mesh.renderOrder = 1;
function toteGeo() { const B = new Builder(); B.box(0.6, 0.28, 0.4, 0, 0.14, 0, '#ffffff'); B.box(0.62, 0.03, 0.2, 0, 0.295, -0.1, '#e8e8e8'); B.box(0.62, 0.03, 0.2, 0, 0.295, 0.1, '#e0e0e0'); B.box(0.005, 0.035, 0.42, 0, 0.3, 0, '#888'); B.box(0.02, 0.06, 0.02, 0.24, 0.31, 0, '#f5f5f5'); B.box(0.22, 0.14, 0.004, -0.12, 0.16, 0.202, '#ffffff'); return mergeGeometries(B.g); }
const TOTE = new Pool(toteGeo(), MAT.iv, 40, 'totes');
// worker parts (pivot at top of limbs)
const legG = new THREE.CapsuleGeometry(0.075, 0.71, 3, 8).translate(0, -0.43, 0);
const armG = new THREE.CapsuleGeometry(0.055, 0.55, 3, 8).translate(0, -0.33, 0);
const torG = new THREE.CapsuleGeometry(0.17, 0.4, 3, 10).scale(1, 1, 0.65);
const headG = new THREE.SphereGeometry(0.11, 12, 8);
const capG = new THREE.SphereGeometry(0.118, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2).translate(0, 0.01, 0);
const LEG = new Pool(legG, MAT.iv, 80, 'legs'), ARM = new Pool(armG, MAT.iv, 80, 'arms'), TOR = new Pool(torG, MAT.iv, 40, 'torsos'), HEAD = new Pool(headG, MAT.iv, 40, 'heads'), CAP = new Pool(capG, MAT.iv, 40, 'caps');
const DEV = new Pool(new THREE.BoxGeometry(0.075, 0.03, 0.16), MAT.iv, 20, 'scanners'); // Zebra-style handhelds
// pallet jack: body + forks (local forks along -z), handle separate
function jackGeo() { const B = new Builder(); for (const x of [-0.27, 0.27]) { B.box(0.16, 0.06, 1.15, x, 0.05, -0.575, '#ffffff'); B.cyl(0.035, 0.07, x, 0.035, -1.08, '#333', 8, 0, Math.PI / 2); }
  B.box(0.7, 0.12, 0.2, 0, 0.1, 0.05, '#ffffff'); B.cyl(0.07, 0.36, 0, 0.3, 0.16, '#ffffff', 10); B.cyl(0.09, 0.1, 0, 0.09, 0.22, '#222', 12, 0, Math.PI / 2); return mergeGeometries(B.g); }
function handleGeo() { const B = new Builder(); B.box(0.04, 1.1, 0.04, 0, 0.55, 0, '#ffffff'); B.box(0.36, 0.05, 0.05, 0, 1.12, 0, '#222'); B.box(0.05, 0.05, 0.12, 0.12, 1.05, 0.04, '#c0392b'); return mergeGeometries(B.g); }

// carts: OGP tote cart / pharmacy dolly / garment rack bits
function cartGeo() { const B = new Builder(); B.box(0.6, 0.04, 1.1, 0, 0.18, 0, '#ffffff'); for (const sx of [-0.28, 0.28]) for (const sz of [-0.5, 0.5]) { B.cyl(0.06, 0.04, sx, 0.06, sz, '#222', 10, 0, Math.PI / 2); B.box(0.03, 1.1, 0.03, sx, 0.7, sz, '#dddddd'); } B.box(0.6, 0.03, 1.1, 0, 0.75, 0, '#eeeeee'); B.box(0.6, 0.03, 0.03, 0, 1.0, 0.55, '#dddddd'); return mergeGeometries(B.g); }
const CARTS = new Pool(cartGeo(), MAT.iv, 8, 'carts');
const GARM = new Pool(new THREE.BoxGeometry(0.06, 0.8, 0.42).translate(0, -0.42, 0), MAT.iv, 80, 'garments');

const COL = { blue: C('#2d6db5'), chep: C('#1f5fa8'), red: C('#b8312f'), nat: C('#c9a16b'), jack: C('#f2c200'), handle: C('#f2c200'),
  kraft: C('#c79a62'), kraft2: C('#b98a52'), white: C('#e9e6dd'), skin: [C('#f1c9a5'), C('#c68c63'), C('#8d5a3b'), C('#e0ac69'), C('#5c3a24')],
  st2: C('#f4d03f'), st3: C('#0b3d91'), omni: C('#0071ce'), dsd: C('#5d6d7e'), bev: C('#c8102e'), snk: C('#1c4fa8'), jeans: C('#2c3e50'), khaki: C('#6e6253'), black: C('#222222'),
  maroon: C('#7b1e2b'), ogp: C('#2e7d32'), dev: C('#1b1b1b'), cart: C('#8c99a6') };

await __yield("a3");
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

await __yield("a4");
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
function role(w, text) { ROLES.push({ w, text }); return w; }
let FLAGS = {}, NIGHTN = 0, PHSK = null;

function initSim() {
  W.length = 0; BX.length = 0; SK.length = 0; CT.length = 0; GA.length = 0; OT.length = 0; BRAINS.length = 0; ROLES.length = 0; FLAGS = {}; T = 0; DSK = {};
  JK.length = 0; for (const h of HOLES) h.used = false; seed(7);
  // ---- department skids around the roller ----
  WEST_DEPTS.forEach((d, i) => { const s = mkSkid({ x: 5.6, z: SKID_Z[i], col: PCOL[i % 4], dept: d }); fillSkid(s, 3 + ((rnd() * 6) | 0), caseM); DSK[d] = s; });
  EAST_DEPTS.forEach((d, i) => { const s = mkSkid({ x: 10.4, z: SKID_Z[i], col: PCOL[(i + 1) % 4], dept: d }); fillSkid(s, 3 + ((rnd() * 6) | 0), caseM); DSK[d] = s; });
  // ---- trailer B: floor-loaded cases (hand-unloaded onto the roller head) ----
  const COLS = []; for (let r = 0; r < 10; r++) for (let c = 0; c < 4; c++) { const col = { x: DOORS.B.x - 0.84 + c * 0.56, z: 16.4 + r * 0.6, r, stack: [] }; let y = 0; const nh = r === 0 ? 3 : 6; for (let k = 0; k < nh; k++) { const sz = { w: 0.5, h: 0.3 + rnd() * 0.08, d: 0.54 }; const b = mkBox(Object.assign(sz, { x: col.x + (rnd() - 0.5) * 0.03, z: col.z, y: y + sz.h / 2, ry: (rnd() - 0.5) * 0.05 })); y += sz.h; col.stack.push(b); } COLS.push(col); }
  // ---- trailer A: wrapped mixed skids (~1.9 m) ----
  const wrapped = []; for (const [x, z] of [[-5.55, 13.5], [-4.45, 13.5], [-5.0, 15.0], [-5.55, 16.6], [-4.45, 16.6]]) { const s = mkSkid({ x, z, col: PCOL[(rnd() * 4) | 0], wrapped: true }); while (skidTopY(s) < 1.62) { const b = mkBox(caseM()); attachToSkid(b, s, 0.05); } s.wrapH = skidTopY(s) + 0.04; s.wrap0 = s.wrapH; { const wi = wrapped.length; s.inky = INKY_WR[wi] || (INKY_WR[wi] = buildWrapped(THREE, PM, { seed: 11 + wrapped.length * 7, height: 1.9, palletColor: s.col === COL.blue || s.col === COL.chep ? 'blue' : (s.col === COL.red ? 'red' : 'natural') })); if (!s.inky.parent) scene.add(s.inky); } wrapped.push(s); }
  // one skid already at breakdown spot 1 (wrap cut, being worked)
  const BD = [{ x: 4.6, z: 9.6 }, { x: 4.6, z: 11.0 }];
  const bd1 = mkSkid({ x: BD[0].x, z: BD[0].z, ry: Math.PI / 2, col: COL.blue }); fillSkid(bd1, 14, caseM);
  const empties = []; for (let i = 0; i < 3; i++) { const e = mkSkid({ x: -1.4, z: 10.6, y: i * PAL_H, ry: Math.PI / 2, col: i ? COL.chep : COL.red }); empties.push(e); }
  // ---- jacks ----
  const jPull = mkJack({ x: -2.4, z: 9.0, yaw: 0 }), jF1 = mkJack({ x: 13, z: -3.4, yaw: 0 }), jF2 = mkJack({ x: 15, z: -3.4, yaw: 0 }), jBev = mkJack({ x: -16.5, z: 10.6, yaw: Math.PI }), jSn = mkJack({ x: -11.5, z: 10.6, yaw: Math.PI });
  const jS1 = mkJack({ x: 31.6, z: 5.25, yaw: -Math.PI / 2 }), jS2 = mkJack({ x: 47.6, z: 8.75, yaw: -Math.PI / 2 }), jSpare = mkJack({ x: 17.6, z: -2.6, yaw: Math.PI / 2 }), jSpare2 = mkJack({ x: -8.5, z: 9.0, yaw: Math.PI / 2 });

  // ===== 1. UNLOADER (Stocking 2) — floor-loaded trailer B to the roller head =====
  const un = role(mkWorker({ x: DOORS.B.x, z: 15.6, yaw: 0, torso: COL.st2 }), 'Stocking 2 · unloading');
  brain(un, (function* () { for (;;) { let col = null, best = -1; for (const c of COLS) if (c.stack.length) { const sc = -c.r * 10 + c.stack.length; if (sc > best) { best = sc; col = c; } } if (!col) { yield* wait(un, 1); continue; }
    yield* walkTo(un, col.x, col.z - 0.72); const b = col.stack[col.stack.length - 1]; yield* pick(un, b, () => col.stack.pop());
    yield* walkTo(un, DOORS.B.x - 0.05, 15.7); yield* face(un, DOORS.B.x, 14.0); yield* until(un, () => rollerFree(15.0, 0.6), 'carry');
    yield* placeAt(un, b, () => toRoller(b, 15.0), 0.84); } })());
  // ===== 2. PULLER (Stocking 2) — wrapped skids out of trailer A, cut wrap, clear empties =====
  const pu = role(mkWorker({ x: -2.4, z: 7.6, yaw: 0, torso: COL.st2 }), 'Stocking 2 · pulling skids');
  const bdSk = [bd1, null];
  brain(pu, (function* () { let wi = 0, emptyN = empties.length;
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
      const R = 1.05; let a = 0; yield* walkTo(pu, sk.x + R, sk.z); while (a < Math.PI * 2.2) { a += DT * 0.9; pu.x = sk.x + Math.cos(a) * R; pu.z = sk.z + Math.sin(a) * R; pu.yaw = yawTo(sk.x - pu.x, sk.z - pu.z); pu.pose = 'reach'; sk.wrapH = Math.max(0, sk.wrap0 * (1 - a / (Math.PI * 2.2))); yield; }
      sk.wrapped = false; bdSk[si] = sk; yield* walkTo(pu, -2.4, 8.0); } })());
  // ===== 3. BREAKDOWN (Stocking 2) — top cases off the skid onto the roller =====
  const bk = role(mkWorker({ x: 6.6, z: 9.6, yaw: Math.PI / 2, torso: COL.st2 }), 'Stocking 2 · breaking down');
  brain(bk, (function* () { for (;;) { const s = bdSk.filter((x) => x && !x.wrapped && x.boxes.length).sort((a, b) => a.boxes.length - b.boxes.length)[0]; if (!s) { yield* wait(bk, 1); continue; }
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
  brain(f1, (function* () { yield* wait(f1, 2); yield* jackFetch(f1, jF1, R46, 0); yield* jackPull(f1, jF1, [[13, -1.0], [16.5, 0], [21.5, 0], [24.2, -5.25], [32.0, -5.25]]); yield* jackRelease(f1, jF1); yield* jackBackOut(f1, jF1, 1.6);
    yield* stockLoop(f1, R46, -5.25); })());
  const f2 = role(mkWorker({ x: 15, z: -1.6, yaw: Math.PI, torso: COL.st3 }), 'Stocking 3 · Dept 92 (big skid, 2 people)');
  const f2h = role(mkWorker({ x: 16.2, z: -1.4, yaw: Math.PI, torso: COL.st3 }), '');
  brain(f2h, (function* () { yield* until(f2h, () => R92.jack); while (!FLAGS.r92done) { const [fx, fz] = fwd(R92.ry + Math.PI / 2); const tx = R92.x + fx * 0.95, tz = R92.z + fz * 0.95; const d = Math.hypot(tx - f2h.x, tz - f2h.z); if (d > 0.05) { const st = Math.min(d, 1.4 * DT); f2h.x += (tx - f2h.x) / d * st; f2h.z += (tz - f2h.z) / d * st; f2h.ph += st * 4.2; f2h.pose = 'push'; f2h.yaw = R92.ry + Math.PI; } else f2h.pose = 'push'; yield; } yield* stockLoop(f2h, R92, -5.25, 1); })());
  brain(f2, (function* () { yield* wait(f2, 9); yield* jackFetch(f2, jF2, R92, 0); yield* jackPull(f2, jF2, [[15, -1.0], [18.5, 0], [38.6, 0], [39.6, -5.25], [48.3, -5.25]], 0.8); FLAGS.r92done = true; yield* jackRelease(f2, jF2); yield* jackBackOut(f2, jF2, 1.6); yield* stockLoop(f2, R92, -5.25); })());
  // ===== 6. OVERNIGHT STOCKING (Stocking 3) — fill the holes on the shelves =====
  const S2 = mkSkid({ x: 30.0, z: 5.25, ry: Math.PI / 2, col: COL.blue, dept: 2 }); fillSkid(S2, 14, caseS); jS1.x = 30.0 + 0.135 + 0.0; jS1.yaw = Math.PI / 2; jS1.x = S2.x - fwd(Math.PI / 2)[0] * J_PAL; jS1.z = S2.z;
  const S4 = mkSkid({ x: 46.0, z: 8.75, ry: Math.PI / 2, col: COL.red, dept: 4 }); fillSkid(S4, 14, caseS); jS2.yaw = Math.PI / 2; jS2.x = S4.x - fwd(Math.PI / 2)[0] * J_PAL; jS2.z = S4.z;
  const s1 = role(mkWorker({ x: 29, z: 4.6, yaw: 0, torso: COL.st3 }), 'Stocking 3 · overnight stocking'); brain(s1, stockLoop(s1, S2, 5.25));
  const s2 = role(mkWorker({ x: 45, z: 8.0, yaw: 0, torso: COL.st3 }), ''); brain(s2, stockLoop(s2, S4, 8.75));
  // ===== 7. DSD: beverage vendor + receiver check-in =====
  const recv = role(mkWorker({ x: -18.7, z: 7.6, yaw: -Math.PI / 2, torso: COL.dsd, tool: true }), 'DSD associate · receiving');
  const POPSK = POPS.map((g, i) => mkSkid({ x: DOORS.DSD.x, z: 13.2 + i * 1.45, y: 0.0, col: COL.red, grp: g, pop: true }));
  const bev = role(mkWorker({ x: -16.5, z: 9.2, yaw: Math.PI, torso: COL.bev }), 'Beverage vendor');
  const checkQ = [];
  function* checkIn(w, sk, label) { const req = { sk, done: false, label }; checkQ.push(req); yield* until(w, () => req.done, 'idle'); }
  brain(bev, (function* () { yield* wait(bev, 1.5);
    for (let i = 0; i < 2; i++) { const sk = POPSK[i]; yield* jackFetch(bev, jBev, sk, Math.PI, i ? [[DOORS.DSD.x, 10.8]] : []);
      yield* jackPull(bev, jBev, [[DOORS.DSD.x, 9.4], [-15.6, 6.2]]); yield* jackRelease(bev, jBev); yield* walkTo(bev, -14.2, 7.2); yield* face(bev, sk.x, sk.z);
      yield* checkIn(bev, sk, 'pop');
      yield* jackRegrab(bev, jBev, sk); yield* jackPull(bev, jBev, [[-14.8, 4.2], [-13.6, 3.2 - i * 1.5]]); yield* jackRelease(bev, jBev); yield* jackBackOut(bev, jBev, 1.4); }
    yield* walkTo(bev, -16.3, 9.0); for (;;) yield* wait(bev, 5, 'idle'); })());
  // ===== 8. SNACK vendor (reverses in, then pulls a skid) =====
  const SNK = mkSkid({ x: 0, z: 0, col: COL.nat, follow: SNACK.trailer }); fillSkid(SNK, 16, () => ({ w: 0.5, h: 0.3, d: 0.4, col: KRAFT[(rnd() * 4) | 0] }));
  const snd = mkWorker({ x: 0, z: 0, torso: COL.snk, sit: true }); snd.seatOf = SNACK.tractor; snd.seat = seatOf(SNACK.tractor, [0.55, 1.95, 2.2]);
  const snv = role(mkWorker({ x: -11.5, z: 9.0, yaw: Math.PI, torso: COL.snk }), 'Snack vendor');
  brain(snv, (function* () { yield* until(snv, () => snackV.phase === 'docked' && snackV.doors >= 1);
    SNK.follow = null; yield* jackFetch(snv, jSn, SNK, Math.PI, []); yield* jackPull(snv, jSn, [[-11.5, 9.0], [-12.6, 6.6]]); yield* jackRelease(snv, jSn); yield* walkTo(snv, -13.6, 8.3); yield* face(snv, SNK.x, SNK.z);
    yield* checkIn(snv, SNK, 'snack'); yield* jackRegrab(snv, jSn, SNK); yield* jackPull(snv, jSn, [[-12.4, 3.2], [-11.0, 1.2]]); yield* jackRelease(snv, jSn); yield* jackBackOut(snv, jSn, 1.4); for (;;) yield* wait(snv, 5); })());
  // ===== 9. PHARMACY: wrapped McKesson tote pallet (2 or 3 layers, alternating nights). Jacked to the pharmacy, wrap cut, totes counted against the memo, signed =====
  NIGHTN = (NIGHTN | 0) + 1; for (const g of MCP) g.visible = false; const MG = MCP[NIGHTN % 2]; MG.visible = true; for (const m of MG.userData.wrap) { m.visible = true; m.scale.set(1, 1, 1); }
  const PH = mkSkid({ x: -17.6, z: 5.6, ry: Math.PI / 2, col: COL.blue, grp: MG, pharm: true });
  FLAGS.pharmSigned = true; PHSK = PH;
  brain(recv, (function* () {
    for (;;) { const q = checkQ.shift(); if (!q) { yield* walkTo(recv, -18.75, 7.6); yield* face(recv, -19.6, 7.6); yield* wait(recv, 0.5, 'idle'); continue; }
      const s = q.sk; const p = approach(s, -18, s.z + 0.3, 1.0); yield* walkTo(recv, p[0], p[1]); yield* face(recv, s.x, s.z); recv.scanning = true; yield* wait(recv, 3.5, 'scan');
      const p2 = approach(s, s.x + 1, s.z - 1, 1.0); yield* walkTo(recv, p2[0], p2[1]); yield* face(recv, s.x, s.z); yield* wait(recv, 2.5, 'scan'); recv.scanning = false;
      yield* walkTo(recv, -18.75, 7.6); yield* face(recv, -19.6, 7.6); yield* wait(recv, 3, 'reach'); q.done = true; } })());
  const run = role(mkWorker({ x: -15.6, z: 4.2, yaw: Math.PI, torso: COL.st2 }), 'Pharmacy pallet · jack to pharmacy');
  const jPh = mkJack({ x: -15.2, z: 3.0, yaw: Math.PI / 2 });
  brain(run, (function* () { yield* wait(run, 3);
    yield* jackFetch(run, jPh, PH, Math.PI / 2); yield* jackPull(run, jPh, [[-17.0, -6.6], [-12, -7.9], [18.6, -7.9], [18.6, -1.2], [21.5, 0], [56, 0], [58.6, -10.4]], 0.9); yield* jackRelease(run, jPh); yield* jackBackOut(run, jPh, 1.4);
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
  for (const s of SK) if (s.follow) { const o = s.follow; const [fx, fz] = fwd(o.rotation.y); const lz = -8.1 + 1.0; s.x = o.position.x + fx * lz; s.z = o.position.z + fz * lz; s.y = o.position.y + 1.25; s.ry = o.rotation.y; }
}
function resetVehicles() { const pv = SNACK.trailer.userData.pivots; if (pv.rearDoor_L) { pv.rearDoor_L.rotation.y = 0; pv.rearDoor_R.rotation.y = 0; } snackV.lastEk = 0; snackV.lastS = 0; snackV.roll = 0; BALER.userData.pivots.door.rotation.y = 0; }
VEH.push(snackV, snackTrailerV, { id: 'beverage-vendor-box-truck', type: 'box-truck', obj: BOXT }, { id: 'walmart-trailer-A', type: 'tractor-trailer', placard: 'FDS' }, { id: 'walmart-trailer-B', type: 'tractor-trailer', placard: 'CP' }, ...YARD.map((y) => ({ id: 'yard-' + y.pl, type: 'tractor-trailer', placard: y.pl })));
function simStep() { updateVehicles(); for (const b of BRAINS) b.g.next(); updateRoller(); T += DT; }

await __yield("a5");
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

await __yield("a6");
// ======================= STORY / CAMERA / LABELS / LOOP =======================
// seat & grip points from Inky's parts when available
const STEPS = [...document.querySelectorAll('.step')].map((el) => ({ el, id: el.dataset.cam }));
const CAMS = {
  hero: [[24, 31, 45], [-3.5, -2, 4]],
  truck: [[7.2, 1.6, 8.6], [8.2, 1.25, 17.5]],
  breakdown: [[0.4, 1.7, 6.4], [4.8, 1.0, 10.4]],
  roller: [[6.0, 1.65, 11.4], [8.8, 1.0, -5]],
  sort: [[13.6, 3.6, 7.4], [7.6, 0.4, 0.8]],
  floor: [[20.5, 2.4, -1.2], [30, 0.8, -5.2], 'Stocking 3 · Dept 46 skid (1 person)', [-3.5, 5.2, 3.5]],
  stock: [[25.4, 1.65, 6.6], [31.5, 1.0, 5.0], 'Stocking 3 · Dept 46 skid (1 person)', [-3.0, 4.9, 2.8]],
  dsd: [[-10.4, 1.75, 3.6], [-16.2, 0.9, 9.6]],
  snack: [[3, 8.5, 37], [-11.5, 0, 22]],
  pharm: [[-14.6, 2.4, 8.6], [-18.2, 0.7, 5.2], '@pharm', [-2.6, 3.4, 2.6]],
  baler: [[-13.0, 1.8, -5.4], [-19, 1.3, -1.6]],
  omni: [[17.6, 1.7, 5.6], [15.2, 0.9, 10.8]],
  fashion: [[11.9, 1.65, -5.6], [15.4, 1.2, -9.8]],
  claims: [[-12.0, 1.8, -5.6], [-17.2, 1.0, -10.8]],
  overview: [[-26, 30, 40], [6, -1, 2]],
};
const LBL = { // fixed points of interest per step
  hero: [['Cooler', -3.6, 2.6, -11.8], ['Freezer', 3.0, 2.6, -11.8], ['Gravity roller', 8, 1.2, 2], ['Department skids', 5.6, 1.4, 0]],
  truck: [['Walmart trailer · placard CP', 8, 2.9, 19.5], ['Roller head', 8, 1.15, 14.6]],
  breakdown: [['Wrapped mixed skid ≈ 1.9 m', -5.0, 2.2, 15.0], ['Breakdown spot', 4.6, 1.9, 9.6]],
  roller: [['Boxes roll by gravity', 8, 1.2, 6]],
  sort: [['Dept 46 · Cosmetics', 5.6, 1.6, 7.5], ['Dept 92 · Dry Grocery', 10.4, 1.6, 7.5], ['Dept 2 · Health & Beauty', 5.6, 1.6, 5]],
  floor: [['To the sales floor', 24, 1.9, 0]],
  stock: [['Empty slots get filled', 30, 1.8, 3.6]],
  dsd: [['Beverage Vendor truck', -16.5, 3.0, 15], ['Receiving desk', -19.3, 1.4, 7.6]],
  snack: [['Snack Vendor reversing to door', -11.5, 4.6, 24]],
  pharm: [['McKesson totes · wrapped pallet', -17.6, 1.6, 5.6]],
  baler: [['Baler', -19.4, 3.4, -3.2], ['Compactor', -19.6, 2.6, 1.2], ['Cardboard', -16.9, 1.4, -1.4]],
  omni: [['OGP staging shelves', 15.5, 2.0, 11.4], ['Chill / frozen', 13, 2.0, 6.4]],
  fashion: [['Z-racks', 15.5, 2.0, -9.7]],
  claims: [['Claims cage', -17.2, 2.6, -10.2]],
  overview: [],
};
const ROLE_STEPS = { hero: ['Stocking 2 · sorting by dept'], truck: ['Stocking 2 · unloading'], breakdown: ['Stocking 2 · pulling skids', 'Stocking 2 · breaking down'], roller: [], sort: ['Stocking 2 · sorting by dept'],
  floor: ['Stocking 3 · Dept 46 skid (1 person)', 'Stocking 3 · Dept 92 (big skid, 2 people)'], stock: ['Stocking 3 · Dept 46 skid (1 person)', 'Stocking 3 · overnight stocking'], dsd: ['Beverage vendor', 'DSD associate · receiving'], snack: ['Snack vendor'],
  pharm: ['DSD associate · receiving', 'Pharmacy pallet · jack to pharmacy'], baler: ['Baler & compactor pre-op'], omni: ['OMNI customer fulfillment'], fashion: ['Fashion · hanging apparel'], claims: ['Claims & returns'], overview: [] };
const labelsEl = document.getElementById('labels');
const LPOOL = []; for (let i = 0; i < 8; i++) { const d = document.createElement('div'); d.className = 'lbl'; labelsEl.appendChild(d); LPOOL.push(d); }
let cur = 0, camFrom = null, camT = 1, explore = false;
const camPos = new THREE.Vector3().fromArray(CAMS.hero[0]), camTgt = new THREE.Vector3().fromArray(CAMS.hero[1]);
const controls = new OrbitControls(camera, canvas); controls.enabled = false; controls.enableDamping = true; controls.maxPolarAngle = Math.PI * 0.495; controls.minDistance = 1.5; controls.maxDistance = 90;
function camFor(c) { const p = new THREE.Vector3().fromArray(c[0]), t = new THREE.Vector3().fromArray(c[1]); if (innerWidth / innerHeight < 0.8) { const d = p.clone().sub(t), m = p.y > 6 ? 1.5 : 1.12; p.copy(t).addScaledVector(d, m); t.y -= d.length() * m * 0.16; } return [p, t]; }
function goStep(i, instant) { i = clamp(i, 0, STEPS.length - 1); if (i === cur && !instant && camT >= 1) return; cur = i; STEPS.forEach((s, k) => s.el.classList.toggle('on', k === i)); document.querySelectorAll('.dots button').forEach((d, k) => d.classList.toggle('on', k === i));
  camFrom = [camera.position.clone(), camTgt.clone()]; camT = instant ? 1 : 0; const c = CAMS[STEPS[i].id] || CAMS.hero; const cf = camFor(c); camPos.copy(cf[0]); { const fw = followRole(c); if (fw) { camPos.set(fw.x + c[3][0], c[3][1], fw.z + c[3][2]); } } if (instant) { camera.position.copy(camPos); camTgt.copy(cf[1]); const fw = followRole(c); if (fw) camTgt.set(fw.x, 0.95, fw.z); } { const fw = followRole(c); camFrom.push(fw ? new THREE.Vector3(fw.x, 0.95, fw.z) : cf[1].clone()); } if (explore) setExplore(false); }
window.__goStep = goStep;
function stepFromScroll() { const mid = innerHeight * 0.5; let best = 0, bd = 1e9; STEPS.forEach((s, k) => { const r = s.el.getBoundingClientRect(); const d = Math.abs((r.top + r.bottom) / 2 - mid); if (d < bd) { bd = d; best = k; } }); return best; }
addEventListener('scroll', () => { const k = stepFromScroll(); if (k !== cur) goStep(k); }, { passive: true });
function scrollToStep(i) { i = clamp(i, 0, STEPS.length - 1); STEPS[i].el.scrollIntoView({ behavior: 'smooth', block: 'center' }); goStep(i); }
document.getElementById('next').onclick = () => scrollToStep(cur + 1); document.getElementById('prev').onclick = () => scrollToStep(cur - 1);
{ const dots = document.querySelector('.dots'); STEPS.forEach((s, k) => { const b = document.createElement('button'); b.dataset.step = k; b.setAttribute('aria-label', 'Go to step ' + (k + 1)); b.onclick = () => scrollToStep(k); dots.appendChild(b); }); }
addEventListener('keydown', (e) => { if (e.key === 'ArrowRight' || e.key === 'PageDown') { scrollToStep(cur + 1); e.preventDefault(); } if (e.key === 'ArrowLeft' || e.key === 'PageUp') { scrollToStep(cur - 1); e.preventDefault(); } });
function setExplore(on) { explore = on; document.body.classList.toggle('explore', on); controls.enabled = on; document.getElementById('explore').textContent = on ? 'Back to story' : 'Explore 3D'; if (on) { controls.target.copy(camTgt); controls.update(); } }
document.getElementById('explore').onclick = () => setExplore(!explore);
for (const b of document.querySelectorAll('[data-zoom]')) b.onclick = () => { const f = b.dataset.zoom === 'in' ? 0.8 : 1.25; if (!explore) setExplore(true); const d = camera.position.clone().sub(controls.target).multiplyScalar(f); if (d.length() > 1.5 && d.length() < 90) camera.position.copy(controls.target).add(d); controls.update(); };
// view offset: keep the subject clear of the caption card
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.clearViewOffset(); camera.updateProjectionMatrix(); }
let cutaway = null;
function camLook() { // fov: narrow (iso-like) when high, wide at eye level; cutaway hides walls above 3.4 m + roof
  const y = camera.position.y, k = clamp((y - 3) / 12, 0, 1), base = innerWidth / innerHeight < 0.8 ? 14 : 0;
  const fov = 50 + base - k * 18; if (Math.abs(camera.fov - fov) > 0.05) { camera.fov = fov; camera.updateProjectionMatrix(); }
  const cut = y > 4.6; if (cut !== cutaway) { cutaway = cut; UPPER.visible = !cut; LIGHTS_MESH.visible = !cut; } }
addEventListener('resize', resize);
const _lv = new THREE.Vector3();
function followRole(c) { if (!c[2]) return null; if (c[2] === '@pharm') return PHSK; const r = ROLES.find((r) => r.text === c[2]); return r ? r.w : null; }
function updLabels() { const id = STEPS[cur].id; const items = (LBL[id] || []).map((l) => ({ t: l[0], x: l[1], y: l[2], z: l[3], k: 'poi' }));
  if (!explore) for (const r of ROLES) if (r.text && (ROLE_STEPS[id] || []).includes(r.text)) items.push({ t: r.text, x: r.w.x, y: 2.05, z: r.w.z, k: 'who' });
  const W_ = innerWidth, H_ = innerHeight; let n = 0; const cel = STEPS[cur].el.querySelector('.card'); let cardR = cel && cel.getBoundingClientRect(); if (cardR && (cardR.bottom < 0 || cardR.top > H_)) cardR = null;
  for (const it of items) { if (n >= LPOOL.length) break; _lv.set(it.x, it.y, it.z).project(camera); if (_lv.z > 1 || Math.abs(_lv.x) > 1.05 || Math.abs(_lv.y) > 1.05) continue; const sx = (_lv.x + 1) / 2 * W_, sy = (1 - _lv.y) / 2 * H_; if (cardR && sx > cardR.left - 80 && sx < cardR.right + 80 && sy > cardR.top - 10 && sy < cardR.bottom + 40) continue; const d = LPOOL[n++]; d.textContent = it.t; d.className = 'lbl ' + it.k; d.style.transform = `translate(${((_lv.x + 1) / 2 * W_).toFixed(0)}px,${((1 - _lv.y) / 2 * H_).toFixed(0)}px) translate(-50%,-100%)`; d.style.display = 'block'; }
  for (; n < LPOOL.length; n++) LPOOL[n].style.display = 'none'; }
// ---------- loop: real elapsed time, clamped dt ----------
let last = performance.now(), fadeT = -1, frames = 0;
const fadeEl = document.getElementById('fade');
function advance(dt) { DT = Math.min(0.1, dt); simStep(); if (T > NIGHT && fadeT < 0) { fadeT = 0; fadeEl.classList.add('on'); } }
window.__step = (sec) => { let s = sec; while (s > 0) { advance(Math.min(0.1, s)); s -= 0.1; } };
function frame(now) { requestAnimationFrame(frame); const dt = (now - last) / 1000; last = now; advance(Math.max(0, dt));
  if (fadeT >= 0) { fadeT += Math.min(0.1, dt); if (fadeT > 1.2 && !fadeT._done) { initSim(); resetVehicles(); fadeT = 2.0; fadeEl.classList.remove('on'); fadeT = -1; } }
  if (!explore) { { const c = CAMS[STEPS[cur].id]; const fw = followRole(c); if (fw) { const k = 1 - Math.exp(-Math.min(0.1, dt) * (camT < 1 ? 20 : 2.5)); camPos.lerp(_lv.set(fw.x + c[3][0], c[3][1], fw.z + c[3][2]), k); if (camT < 1) camFrom[2].set(fw.x, 0.95, fw.z); else camTgt.lerp(_lv.set(fw.x, 0.95, fw.z), k); } }
    if (camT < 1) { camT = Math.min(1, camT + Math.min(0.1, dt) / 1.6); const k = ease(camT); camera.position.lerpVectors(camFrom[0], camPos, k); camTgt.lerpVectors(camFrom[1], camFrom[2], k); } else { const sway = Math.sin(now / 4000) * 0.12; camera.position.set(camPos.x + sway, camPos.y, camPos.z); } camera.lookAt(camTgt); } else controls.update();
  camLook(); render3d(); renderer.render(scene, camera); updLabels(); frames++;
  if (frames === 2) { window.__ready = true; const l = document.getElementById('gfLoad'); if (l) l.remove(); } }
initSim(); resize(); goStep(0, true); camera.lookAt(camTgt);
await __yield(); await __compile(1500); await __yield();
setTimeout(() => { const l = document.getElementById('gfLoad'); if (l) l.remove(); }, 2800);
requestAnimationFrame(frame);
// ---------- news strip: baked headlines, optional live refresh (silent fallback) ----------
(function news() { const el = document.getElementById('newsList'), meta = document.getElementById('newsMeta'); let data = null; try { data = JSON.parse(document.getElementById('newsData').textContent); } catch (e) {}
  const show = (d, live) => { if (!d || !d.items || !d.items.length) { el.innerHTML = '<li class="ph">Live data coming soon</li>'; meta.textContent = 'Source: Google News · Walmart Canada'; return; } const ln = document.getElementById('newsLine'); if (ln) ln.textContent = d.items[0].title + ' — Google News, ' + d.date; el.innerHTML = ''; for (const it of d.items.slice(0, 5)) { const li = document.createElement('li'); const a = document.createElement('a'); a.href = it.link; a.target = '_blank'; a.rel = 'noopener'; a.textContent = it.title; li.appendChild(a); el.appendChild(li); } meta.textContent = `Source: Google News (search “Walmart Canada”) · ${live ? 'live, ' : 'fetched '}${d.date}`; };
  show(data, false);
  if (location.protocol === 'https:') try { const ctl = new AbortController(); setTimeout(() => ctl.abort(), 5000); fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent('https://news.google.com/rss/search?q=Walmart+Canada&hl=en-CA&gl=CA&ceid=CA:en'), { signal: ctl.signal }).then((r) => r.ok ? r.text() : Promise.reject()).then((x) => { const doc = new DOMParser().parseFromString(x, 'text/xml'); const items = [...doc.querySelectorAll('item')].slice(0, 5).map((i) => ({ title: i.querySelector('title')?.textContent || '', link: i.querySelector('link')?.textContent || '' })).filter((i) => i.title && /^https:\/\//.test(i.link)); if (items.length) show({ items, date: new Date().toISOString().slice(0, 10) }, true); }).catch(() => {}); } catch (e) {}
})();

await __yield("a7");
