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
import { build as buildMilk } from '../parts/v4/milkCrateSkid.js';
import { build as buildSnackStack } from '../parts/v4/snackCaseStack.js';
import { build as buildEggs } from '../parts/v4/eggPallet.js';
import { build as buildDiv } from '../parts/v4/divShelving.js';
import { build as buildOffice } from '../parts/v4/officeKit.js';
import { build as buildTraining } from '../parts/v4/trainingRoom.js';
import { build as buildLunch } from '../parts/v4/lunchRoom.js';
import { build as buildSick } from '../parts/v4/sickRoom.js';
import { build as buildCleaning } from '../parts/v4/cleaningRoom.js';
import { build as buildBale } from '../parts/v4/cardboardBale.js';
import { build as buildStairs } from '../parts/v4/stairs.js';
import { build as buildBev, setWrapped as bevSetWrapped } from '../parts/v4/beverageSkid.js';

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
const ATL = 2048, ATLH = 3072; const atlasCv = document.createElement('canvas'); atlasCv.width = ATL; atlasCv.height = ATLH; const AG = atlasCv.getContext('2d');
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
function sign(cell, w, h, x, y, z, ry = 0, rx = 0) { const g = new THREE.PlaneGeometry(w, h); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) { uv.setXY(i, (cell.x + uv.getX(i) * cell.w) / ATL, 1 - (cell.y + (1 - uv.getY(i)) * cell.h) / ATLH); } if (rx) g.rotateX(rx); g.rotateY(ry); g.translate(x, y, z); signGeos.push(norm(paint(g, '#ffffff'))); }
