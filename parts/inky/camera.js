// camera.js — smooth orbit / dolly-to-cursor / fly-to camera rig for the GateFlow DC dashboard.
// Standalone ES module (three r160). No side effects at import time.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const instances = new Set();
const STYLE_ID = 'gf-cam-style';
let styleRefs = 0;

const CSS = `
.gf-cam{display:inline-flex;align-items:center;gap:2px;padding:3px;border-radius:10px;
  background:var(--panel-inset,rgba(4,30,66,.04));border:1px solid var(--border,rgba(4,30,66,.09));
  font-family:var(--font,system-ui,sans-serif)}
.gf-cam.gf-cam-float{position:fixed;right:16px;bottom:16px;z-index:10;padding:4px;border-radius:12px;
  background:var(--panel,rgba(255,255,255,.72));-webkit-backdrop-filter:var(--blur,saturate(170%) blur(18px));
  backdrop-filter:var(--blur,saturate(170%) blur(18px));box-shadow:var(--shadow,0 8px 24px -6px rgba(4,30,66,.12))}
.gf-cam button{all:unset;box-sizing:border-box;width:30px;height:30px;border-radius:7px;display:grid;place-items:center;
  cursor:pointer;color:var(--text-2,#4a5568);
  transition:background var(--t-fast,140ms),color var(--t-fast,140ms),transform var(--t-fast,140ms)}
.gf-cam button:hover{background:var(--muted-bg,rgba(4,30,66,.06));color:var(--text,#0b1526)}
.gf-cam button:active{transform:scale(.92)}
.gf-cam button:focus-visible{box-shadow:var(--focus,0 0 0 3px rgba(0,113,206,.32));outline:none}
.gf-cam svg{width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.gf-cam-sep{width:1px;height:24px;background:var(--border,rgba(4,30,66,.09))}
@media (prefers-reduced-motion:reduce){.gf-cam button{transition:none}}
`;
const ICONS = {
  in: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  out: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>',
  home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>',
};

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const isTyping = (el) => !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function update(dt) { for (const inst of instances) inst.update(dt); }

export function create(opts = {}) {
  const { camera, domElement, scene } = opts;
  if (!camera || !domElement) throw new Error('camera.create: camera and domElement are required');
  const minDistance = opts.minDistance ?? 3;
  const maxDistance = opts.maxDistance ?? 150;
  const minZoom = opts.minZoom ?? 0.25, maxZoom = opts.maxZoom ?? 40; // orthographic only
  const isOrtho = !!camera.isOrthographicCamera;
  const pickables = opts.pickables || null;
  const K = opts.dollySharpness ?? 12;          // lerp rate for smooth dolly
  const WHEEL_SPEED = opts.wheelSpeed ?? 0.0015;
  const PINCH_EXP = opts.pinchSpeed ?? 0.9;      // <1 = slightly gentler than 1:1
  const POLAR_3D_MAX = opts.maxPolarAngle ?? Math.PI * 0.47;

  const controls = new OrbitControls(camera, domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enableZoom = false;                  // we own wheel + pinch
  controls.screenSpacePanning = false;
  controls.minDistance = minDistance;
  controls.maxDistance = maxDistance;
  controls.maxPolarAngle = POLAR_3D_MAX;
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
  if (opts.home?.target) controls.target.copy(opts.home.target);
  if (opts.home?.position) camera.position.copy(opts.home.position);
  controls.update();

  const home = { position: camera.position.clone(), target: controls.target.clone(), zoom: camera.zoom };
  let mode = '3d', enabled = true, last3dOffset = null;
  const dolly = { active: false, target: 0, anchor: null };
  let tween = null;
  const ray = new THREE.Raycaster();
  const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const tmpV = new THREE.Vector3(), tmpV2 = new THREE.Vector3(), ndc = new THREE.Vector2();
  let lastT = performance.now();

  const dist = () => camera.position.distanceTo(controls.target);
  const clampD = (d) => THREE.MathUtils.clamp(d, minDistance, maxDistance);
  const clampZ = (z) => THREE.MathUtils.clamp(z, minZoom, maxZoom);
  const dur = (s) => (reducedMotion() ? Math.min(s, 0.25) * 0.6 : s);

  function setNDC(clientX, clientY) {
    const r = domElement.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
  }
  function pickHit() {
    const list = pickables && pickables.length ? pickables : (scene ? scene.children : []);
    const hits = ray.intersectObjects(list, true);
    return hits.find((h) => h.object.visible && !h.object.isLine && !h.object.isPoints && !h.object.isSprite && !h.object.userData.noFocus) || null;
  }
  function pointUnder(clientX, clientY) {
    setNDC(clientX, clientY);
    const h = pickHit();
    if (h) return h.point.clone();
    return ray.ray.intersectPlane(ground, new THREE.Vector3());
  }

  // ---- dolly ----
  function beginDolly() {
    if (tween) cancelTween();
    if (!dolly.active) { dolly.active = true; dolly.target = isOrtho ? camera.zoom : dist(); }
  }
  // factor > 1 zooms in
  function dollyBy(factor, anchor) {
    beginDolly();
    dolly.target = isOrtho ? clampZ(dolly.target * factor) : clampD(dolly.target / factor);
    dolly.anchor = anchor || null;
  }
  function stepDolly(dt) {
    if (!dolly.active) return;
    const a = 1 - Math.exp(-K * dt);
    if (isOrtho) {
      const z0 = camera.zoom, z1 = z0 + (dolly.target - z0) * a;
      camera.zoom = z1; camera.updateProjectionMatrix();
      if (dolly.anchor) { tmpV.subVectors(dolly.anchor, controls.target).multiplyScalar(1 - z0 / z1); controls.target.add(tmpV); camera.position.add(tmpV); }
      if (Math.abs(z1 - dolly.target) < 1e-4 * dolly.target) { camera.zoom = dolly.target; camera.updateProjectionMatrix(); dolly.active = false; }
      return;
    }
    const d0 = dist();
    let d1 = clampD(d0 + (dolly.target - d0) * a);
    if (Math.abs(d1 - dolly.target) < 1e-3 * dolly.target) { d1 = dolly.target; dolly.active = false; }
    const dir = tmpV2.subVectors(camera.position, controls.target).normalize();
    if (dolly.anchor) { tmpV.subVectors(dolly.anchor, controls.target).multiplyScalar(1 - d1 / d0); if (mode === '2d') tmpV.y = 0; controls.target.add(tmpV); }
    camera.position.copy(controls.target).addScaledVector(dir, d1);
  }

  // ---- tweens ----
  function cancelTween() { if (!tween) return; const t = tween; tween = null; t.done(false); }
  function startTween(toPos, toTgt, seconds, toZoom) {
    cancelTween(); dolly.active = false;
    return new Promise((resolve) => {
      const d = dur(seconds ?? 0.9);
      const t = { fromPos: camera.position.clone(), toPos: toPos.clone(), fromTgt: controls.target.clone(), toTgt: toTgt.clone(),
        fromZoom: camera.zoom, toZoom: toZoom ?? camera.zoom, t: 0, d, done: (ok) => resolve(ok) };
      if (d <= 0) { applyTween(t, 1); controls.update(); resolve(true); return; }
      tween = t;
    });
  }
  function applyTween(t, k) {
    const e = easeInOutCubic(k);
    controls.target.lerpVectors(t.fromTgt, t.toTgt, e);
    camera.position.lerpVectors(t.fromPos, t.toPos, e);
    if (isOrtho && t.fromZoom !== t.toZoom) { camera.zoom = t.fromZoom + (t.toZoom - t.fromZoom) * e; camera.updateProjectionMatrix(); }
  }
  function stepTween(dt) {
    if (!tween) return;
    tween.t += dt;
    const k = Math.min(1, tween.t / tween.d);
    applyTween(tween, k);
    if (k >= 1) { const t = tween; tween = null; t.done(true); }
  }

  function resolveTarget(target) {
    const sphere = new THREE.Sphere();
    if (target?.isVector3) sphere.set(target.clone(), 0);
    else if (target?.isBox3) target.getBoundingSphere(sphere);
    else if (target?.isObject3D) { const b = new THREE.Box3().setFromObject(target); if (b.isEmpty()) target.getWorldPosition(sphere.center); else b.getBoundingSphere(sphere); }
    else throw new Error('flyTo: target must be Vector3, Object3D or Box3');
    return sphere;
  }
  function flyTo(target, distance, duration = 0.9) {
    const s = resolveTarget(target);
    const dir = new THREE.Vector3().subVectors(camera.position, controls.target);
    if (dir.lengthSq() < 1e-8) dir.set(0, 1, 1);
    dir.normalize();
    let d, zoom;
    if (isOrtho) {
      d = dist();
      if (distance == null && s.radius > 0) zoom = clampZ((camera.top - camera.bottom) / (s.radius * 2.6));
      else if (distance != null) zoom = clampZ(home.zoom * (dist() / distance));
    } else if (distance != null) d = clampD(distance);
    else if (s.radius > 0) { const half = THREE.MathUtils.degToRad(camera.fov) / 2; const fit = Math.min(half, Math.atan(Math.tan(half) * camera.aspect)); d = clampD((s.radius / Math.sin(fit)) * 1.15); }
    else d = dist();
    const toPos = s.center.clone().addScaledVector(dir, d);
    return startTween(toPos, s.center, duration, zoom);
  }
  function topDownOffset(d) {
    // keep current azimuth; tiny polar so OrbitControls keeps orientation stable
    const off = new THREE.Vector3().subVectors(camera.position, controls.target);
    const az = Math.atan2(off.x, off.z), p = 1e-4;
    return new THREE.Vector3(Math.sin(p) * Math.sin(az), Math.cos(p), Math.sin(p) * Math.cos(az)).multiplyScalar(d);
  }
  function goHome(duration = 0.9) {
    if (mode === '2d') {
      const d = home.position.distanceTo(home.target);
      return startTween(home.target.clone().add(topDownOffset(d)), home.target, duration, home.zoom);
    }
    return startTween(home.position, home.target, duration, home.zoom);
  }
  function zoomBy(factor) { if (factor > 0 && isFinite(factor)) dollyBy(factor, null); }

  function apply2DLimits(on) {
    if (on) {
      controls.minPolarAngle = 0; controls.maxPolarAngle = 0;          // azimuth-only rotation
      controls.mouseButtons.LEFT = THREE.MOUSE.PAN; controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE;
      controls.touches.ONE = THREE.TOUCH.PAN;
    } else {
      controls.minPolarAngle = 0; controls.maxPolarAngle = POLAR_3D_MAX;
      controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE; controls.mouseButtons.RIGHT = THREE.MOUSE.PAN;
      controls.touches.ONE = THREE.TOUCH.ROTATE;
    }
  }
  function setMode(m, duration = 0.7) {
    m = String(m).toLowerCase();
    if ((m !== '2d' && m !== '3d') || m === mode) return Promise.resolve(false);
    mode = m;
    if (m === '2d') {
      last3dOffset = new THREE.Vector3().subVectors(camera.position, controls.target);
      const to = controls.target.clone().add(topDownOffset(dist()));
      return startTween(to, controls.target, duration).then((ok) => { if (mode === '2d') apply2DLimits(true); return ok; });
    }
    apply2DLimits(false);
    const off = last3dOffset ? last3dOffset.clone().setLength(dist()) : home.position.clone().sub(home.target).setLength(dist());
    return startTween(controls.target.clone().add(off), controls.target, duration);
  }

  // ---- input ----
  const onWheel = (e) => {
    if (!enabled) return;
    e.preventDefault();
    const scale = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
    const dy = THREE.MathUtils.clamp(e.deltaY * scale, -300, 300);
    dollyBy(Math.exp(-dy * WHEEL_SPEED), pointUnder(e.clientX, e.clientY));
  };
  const touches = new Map(); let pinchSpan = 0;
  const span = () => { const [a, b] = [...touches.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
  const onPointerDown = (e) => {
    cancelTween();
    if (e.pointerType !== 'touch') return;
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touches.size === 2) pinchSpan = span();
  };
  const onPointerMove = (e) => {
    if (!touches.has(e.pointerId)) return;
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touches.size !== 2 || !enabled) return;
    const s = span();
    if (pinchSpan > 0 && s > 0) {
      const [a, b] = [...touches.values()];
      dollyBy(Math.pow(s / pinchSpan, PINCH_EXP), pointUnder((a.x + b.x) / 2, (a.y + b.y) / 2));
    }
    pinchSpan = s;
  };
  const onPointerUp = (e) => { touches.delete(e.pointerId); pinchSpan = touches.size === 2 ? span() : 0; };
  const onDblClick = (e) => {
    if (!enabled) return;
    setNDC(e.clientX, e.clientY);
    const h = pickHit();
    if (!h) return;
    let obj = h.object;
    if (pickables && pickables.length) { const set = new Set(pickables); let o = obj; while (o && !set.has(o)) o = o.parent; obj = o || obj; }
    else if (scene) { while (obj.parent && obj.parent !== scene) obj = obj.parent; }
    const r = new THREE.Box3().setFromObject(obj).getBoundingSphere(new THREE.Sphere()).radius;
    if (!(r > 0) || r > maxDistance * 0.4) { flyTo(h.point, Math.max(minDistance, dist() * 0.45)); return; } // ground / huge
    flyTo(obj);
  };
  const onKey = (e) => {
    if (e.key !== 'Escape' || !enabled || e.defaultPrevented) return;
    if (isTyping(document.activeElement)) return;
    goHome();
  };
  domElement.addEventListener('wheel', onWheel, { passive: false });
  domElement.addEventListener('pointerdown', onPointerDown);
  domElement.addEventListener('pointermove', onPointerMove);
  domElement.addEventListener('pointerup', onPointerUp);
  domElement.addEventListener('pointercancel', onPointerUp);
  domElement.addEventListener('dblclick', onDblClick);
  window.addEventListener('keydown', onKey);

  // ---- buttons ----
  let style = document.getElementById(STYLE_ID);
  if (!style) { style = document.createElement('style'); style.id = STYLE_ID; style.textContent = CSS; document.head.appendChild(style); }
  styleRefs++;
  let container = opts.container === undefined
    ? (document.querySelector('#viewDock') || document.querySelector('nav.dock[aria-label="View controls"], .dock'))
    : opts.container;
  const group = document.createElement('div');
  group.className = 'gf-cam'; group.setAttribute('role', 'group'); group.setAttribute('aria-label', 'Camera zoom');
  const mk = (cls, label, title, icon, fn) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = cls;
    b.setAttribute('aria-label', label); b.title = title; b.innerHTML = icon; b.addEventListener('click', fn); group.appendChild(b); return b;
  };
  const STEP = opts.buttonStep ?? 1.5;
  mk('gf-cam-in', 'Zoom in', 'Zoom in (+)', ICONS.in, () => zoomBy(STEP));
  mk('gf-cam-out', 'Zoom out', 'Zoom out (−)', ICONS.out, () => zoomBy(1 / STEP));
  mk('gf-cam-home', 'Reset view', 'Reset view (Esc)', ICONS.home, () => goHome());
  let sep = null;
  if (container) {
    if (container.children.length) { sep = document.createElement('span'); sep.className = 'sep gf-cam-sep'; sep.setAttribute('aria-hidden', 'true'); container.appendChild(sep); }
    container.appendChild(group);
  } else { group.classList.add('gf-cam-float'); document.body.appendChild(group); }

  // ---- optional chrome sync ----
  let unsubView = null;
  const UI = typeof window !== 'undefined' ? window.UI : null;
  if (UI && typeof UI.onViewChange === 'function' && opts.syncView !== false) {
    const u = UI.onViewChange((v) => setMode(v));
    if (typeof u === 'function') unsubView = u;
    if (typeof UI.getView === 'function' && UI.getView() === '2d') setMode('2d', 0);
  }

  const inst = {
    controls,
    update(dt) {
      const now = performance.now();
      if (dt == null) dt = (now - lastT) / 1000;
      lastT = now;
      dt = Math.min(Math.max(dt, 0), 0.1);
      if (tween) stepTween(dt); else stepDolly(dt);
      controls.update();
    },
    flyTo, goHome, zoomBy, setMode,
    setEnabled(on) { enabled = !!on; controls.enabled = enabled; if (!enabled) { dolly.active = false; cancelTween(); } group.hidden = !enabled; },
    getMode: () => mode,
    getDistance: () => (isOrtho ? camera.zoom : dist()),
    setHome(position, target) { home.position.copy(position); home.target.copy(target); home.zoom = camera.zoom; },
    dispose() {
      cancelTween(); instances.delete(inst);
      domElement.removeEventListener('wheel', onWheel);
      domElement.removeEventListener('pointerdown', onPointerDown);
      domElement.removeEventListener('pointermove', onPointerMove);
      domElement.removeEventListener('pointerup', onPointerUp);
      domElement.removeEventListener('pointercancel', onPointerUp);
      domElement.removeEventListener('dblclick', onDblClick);
      window.removeEventListener('keydown', onKey);
      if (unsubView) unsubView();
      group.remove(); if (sep) sep.remove();
      if (--styleRefs <= 0) { styleRefs = 0; document.getElementById(STYLE_ID)?.remove(); }
      controls.dispose();
    },
  };
  instances.add(inst);
  return inst;
}

export default { create, update };
