/**
 * wrapper.js — Pallet build station + turntable stretch-wrapper (QA B15 / L8).
 * Standalone ES module. Imports only 'three' + three addons. No global side effects.
 * 1 unit = 1 m. Clay/toy look (MeshStandardMaterial, high roughness, rounded parts). Walmart palette.
 *
 *   import * as Wrapper from './wrapper.js';
 *   const w = Wrapper.create(scene, { position:[x,y,z], rotationY:0, duration:32 });
 *   pallet.position.copy(w.getTurntableWorld());           // caller places the pallet (origin = bottom centre)
 *   await w.wrap(pallet);                                    // pallet spins, film spirals up/down, cut + wipe
 *   // film mesh is now a child of `pallet` (pallet.userData.wrapFilm) and travels with it.
 *   per frame: Wrapper.update(dt)  (or w.update(dt))
 *
 * Local frame of the station (before opts.rotationY): turntable centre at (0,0,0); mast on +X;
 * pallet staging spot at (-3.3,0,0.15); case stack area at (-3.3,0,-2.1). Pallet enters/leaves over the -X ramp.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const COL = { blue: 0x0071ce, navy: 0x041e42, yellow: 0xffc220, steel: 0xb9c1cb, dark: 0x2f3542, card: 0xc0915a, tape: 0xdcb87c };
const TAU = Math.PI * 2;
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const sstep = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
const s5 = (x) => { x = clamp01(x); return x * x * x * (x * (x * 6 - 15) + 10); };
const lerp = (a, b, t) => a + (b - a) * t;

const TT_BASE_H = 0.07, TT_DISC_H = 0.05, TT_TOP = TT_BASE_H + TT_DISC_H, TT_R = 1.0;
const MAST_X = 1.75, MAST_H = 3.1;
const FILM_W = 0.5;                // 20" film web
const EXIT = new THREE.Vector3(-0.40, 0, -0.17); // film exit (pre-stretch roller) relative to carriage
const ARM_PIVOT = new THREE.Vector3(1.30, 0, -0.98), ARM_L = 0.75, ARM_PARK = Math.PI / 2;

let _last = null;

class StretchWrapper {
  constructor(scene, opts = {}) {
    this.opts = Object.assign({ duration: 32, rpm: 11, filmColor: 0xdfeefa, filmOpacity: 0.3, caseStack: true, name: 'palletBuildWrap' }, opts);
    this._mats = []; this._geos = [];
    const root = this.root = new THREE.Group(); root.name = this.opts.name;
    const p = this.opts.position; if (p) Array.isArray(p) ? root.position.fromArray(p) : root.position.copy(p);
    root.rotation.y = this.opts.rotationY || 0;
    (this.opts.parent || scene).add(root);
    this._queue = Promise.resolve(); this._job = null; this._t = 0;
    this._build();
    root.traverse((o) => { if (o.isMesh && !o.userData.noShadow) { o.castShadow = true; o.receiveShadow = true; } });
  }

  /* ---------------------------------------------------------------- helpers */
  _m(color, o = {}) {
    const m = new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.85, metalness: 0 }, o)); this._mats.push(m); return m;
  }
  _rb(w, h, d, r = 0.03, seg = 3) { const g = new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3)); this._geos.push(g); return g; }
  _cyl(rt, rb, h, seg = 28) { const g = new THREE.CylinderGeometry(rt, rb, h, seg); this._geos.push(g); return g; }
  _add(parent, geo, mat, x = 0, y = 0, z = 0, name = '') { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.name = name; parent.add(m); return m; }

  /* ---------------------------------------------------------------- build */
  _build() {
    const R = this.root, M = this.M = {
      navy: this._m(COL.navy), blue: this._m(COL.blue, { roughness: 0.6 }), yellow: this._m(COL.yellow, { roughness: 0.6 }),
      steel: this._m(COL.steel, { roughness: 0.5 }), dark: this._m(COL.dark), rubber: this._m(0x1c2028, { roughness: 0.95 }),
      core: this._m(0xb38a5a), white: this._m(0xf4f5f7),
      filmRoll: this._m(0xe6f1fa, { roughness: 0.25, transparent: true, opacity: 0.85 }),
      beacon: this._m(0xffa21a, { emissive: 0xffa21a, emissiveIntensity: 0.15, roughness: 0.4 }),
      green: this._m(0x22e07a, { emissive: 0x22e07a, emissiveIntensity: 0.6 }),
    };
    // ---- floor paint (one decal for the whole station)
    this._floorDecal();
    // ---- turntable base + ramp
    this._add(R, this._rb(2.3, TT_BASE_H, 2.3, 0.03), M.navy, 0, TT_BASE_H / 2, 0, 'ttBase');
    const rampShape = new THREE.Shape(); rampShape.moveTo(0, 0); rampShape.lineTo(0.55, 0); rampShape.lineTo(0.55, TT_BASE_H); rampShape.lineTo(0, 0.004); rampShape.closePath();
    const rampGeo = new THREE.ExtrudeGeometry(rampShape, { depth: 1.6, bevelEnabled: false }); this._geos.push(rampGeo);
    const ramp = this._add(R, rampGeo, M.dark, -1.15 - 0.55, 0, -0.8, 'ramp');
    for (let i = 0; i < 5; i++) this._add(ramp, this._rb(0.05, 0.012, 1.5, 0.004, 1), M.yellow, 0.08 + i * 0.1, 0.007 + (0.08 + i * 0.1) / 0.55 * TT_BASE_H, 0.8, 'rampStripe');
    // ---- rotating disc
    const disc = this.disc = new THREE.Group(); disc.name = 'turntable'; disc.position.y = TT_BASE_H; R.add(disc);
    const dg = this._cyl(TT_R, TT_R, TT_DISC_H, 48); this._add(disc, dg, M.dark, 0, TT_DISC_H / 2, 0, 'disc');
    const tor = new THREE.TorusGeometry(TT_R - 0.012, 0.018, 8, 64); this._geos.push(tor);
    const ring = this._add(disc, tor, M.yellow, 0, TT_DISC_H - 0.004, 0, 'rimRing'); ring.rotation.x = Math.PI / 2;
    for (let i = 0; i < 12; i++) { // rim dashes outside the pallet footprint so rotation reads clearly
      const a = (i / 12) * TAU, d = this._add(disc, this._rb(0.14, 0.008, 0.05, 0.003, 1), i % 3 === 0 ? M.white : M.yellow, Math.cos(a) * 0.9, TT_DISC_H + 0.002, -Math.sin(a) * 0.9, 'rimDash');
      d.rotation.y = a;
    }
    // ---- mast + pedestal + control box + beacon
    this._add(R, this._rb(0.7, 0.14, 0.7, 0.04), M.navy, MAST_X, 0.07, 0, 'pedestal');
    this._add(R, this._rb(0.22, MAST_H, 0.22, 0.05), M.blue, MAST_X, 0.14 + MAST_H / 2, 0, 'mast');
    this._add(R, this._rb(0.3, 0.1, 0.3, 0.04), M.yellow, MAST_X, 0.14 + MAST_H + 0.05, 0, 'mastCap');
    this._add(R, this._cyl(0.06, 0.06, 0.12, 16), M.dark, MAST_X, 0.14 + MAST_H + 0.16, 0, 'beaconBase');
    this.beacon = this._add(R, this._cyl(0.055, 0.065, 0.12, 16), M.beacon, MAST_X, 0.14 + MAST_H + 0.28, 0, 'beacon');
    const panel = this._add(R, this._rb(0.34, 0.5, 0.18, 0.04), M.navy, MAST_X + 0.05, 1.15, 0.24, 'controlBox');
    this._add(panel, this._rb(0.06, 0.06, 0.03, 0.01), M.green, -0.07, 0.12, 0.09, 'lampRun');
    this._add(panel, this._cyl(0.035, 0.035, 0.03, 16), this._m(0xe23b3b), 0.07, 0.12, 0.09, 'estop').rotation.x = Math.PI / 2;
    this._add(panel, this._rb(0.24, 0.14, 0.02, 0.01), this._m(0x22395e, { roughness: 0.35 }), 0, -0.07, 0.09, 'hmi');
    // ---- carriage (rides on mast)
    const car = this.carriage = new THREE.Group(); car.name = 'filmCarriage'; car.position.set(MAST_X, 0.6, 0); R.add(car);
    this._add(car, this._rb(0.34, 0.74, 0.36, 0.05), M.yellow, 0.0, 0, 0, 'carriageBody');
    for (const y of [-0.33, 0.33]) this._add(car, this._rb(0.52, 0.05, 0.42, 0.02), M.yellow, -0.3, y, -0.02, 'carriageArm');
    this._add(car, this._rb(0.04, 0.6, 0.04, 0.015), M.steel, -0.53, 0, 0.18, 'guard');
    this.rollCore = this._add(car, this._cyl(0.04, 0.04, 0.62, 16), M.core, -0.36, 0, 0.08, 'rollCore');
    this.roll = this._add(car, this._cyl(0.12, 0.12, FILM_W, 32), M.filmRoll, -0.36, 0, 0.08, 'filmRoll');
    this.rollers = [this._add(car, this._cyl(0.035, 0.035, 0.6, 16), M.steel, -0.42, 0, -0.1, 'prestretchA'),
      this._add(car, this._cyl(0.035, 0.035, 0.6, 16), M.steel, EXIT.x, 0, EXIT.z, 'prestretchB')];
    // stripes on rollers so their spin reads
    for (const r of this.rollers) this._add(r, this._rb(0.012, 0.58, 0.075, 0.004, 1), M.dark, 0.0, 0, 0, 'rollerMark');
    this._add(this.roll, this._rb(0.02, FILM_W + 0.004, 0.245, 0.005, 1), this._m(0x0071ce, { transparent: true, opacity: 0.45, roughness: 0.4 }), 0, 0, 0, 'rollLabel');
    // ---- cut / clamp / wipe arm
    const arm = this.arm = new THREE.Group(); arm.name = 'cutArm'; arm.position.copy(ARM_PIVOT); R.add(arm);
    this._add(R, this._rb(0.24, 0.06, 0.24, 0.02), M.navy, ARM_PIVOT.x, 0.03, ARM_PIVOT.z, 'armFoot');
    this.armPost = this._add(R, this._rb(0.09, 1, 0.09, 0.03), M.yellow, ARM_PIVOT.x, 0.5, ARM_PIVOT.z, 'armPost');
    const swing = this.armSwing = new THREE.Group(); arm.add(swing);
    this._add(swing, this._rb(ARM_L, 0.06, 0.06, 0.02), M.yellow, ARM_L / 2, 0, 0, 'armBeam');
    const head = this.armHead = new THREE.Group(); head.position.x = ARM_L; swing.add(head);
    this._add(head, this._rb(0.08, 0.58, 0.08, 0.03), M.navy, 0, 0, 0, 'clampBar');
    this.jaw = this._add(head, this._rb(0.03, 0.54, 0.05, 0.01), M.steel, -0.05, 0, 0.03, 'clampJaw');
    this.brush = this._add(head, this._rb(0.08, 0.5, 0.05, 0.02), this._m(0x2b2f36, { roughness: 1 }), 0.0, 0, -0.06, 'wipeBrush');
    this._armTheta = ARM_PARK; this._armY = 0.55; this._applyArm();
    // ---- bollards guarding the mast side
    for (const z of [-1.45, 1.45]) { this._add(R, this._cyl(0.08, 0.08, 1.0, 20), M.yellow, MAST_X + 0.55, 0.5, z, 'bollard'); this._add(R, this._cyl(0.085, 0.085, 0.06, 20), M.navy, MAST_X + 0.55, 0.85, z, 'bollardBand'); }
    // ---- case stack area (static cases that can be taken one by one by the builder)
    this.caseStack = new THREE.Group(); this.caseStack.name = 'caseStack'; this.caseStack.position.set(-3.3, 0, -2.1); R.add(this.caseStack);
    this.cases = [];
    if (this.opts.caseStack) {
      const tones = [0xc0915a, 0xb3834d, 0xd0a56e, 0xc89c66];
      let k = 0;
      for (let l = 0; l < 3; l++) for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
        if (l === 2 && i === 1 && j === 1) continue;
        const c = this._makeCase(0.48, 0.3, 0.38, tones[(k++ * 7) % 4]);
        c.position.set(-0.25 + i * 0.5, l * 0.3, -0.2 + j * 0.4); c.rotation.y = ((k * 37) % 7 - 3) * 0.008; this.caseStack.add(c); this.cases.push(c);
      }
    }
    // ---- film web (roll -> load) and ribbon state
    const webGeo = new THREE.BufferGeometry(); webGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(4 * 3), 3));
    webGeo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(4 * 3), 3)); webGeo.setIndex([0, 1, 2, 2, 1, 3]); this._geos.push(webGeo);
    this.filmMat = this._m(this.opts.filmColor, { roughness: 0.22, transparent: true, opacity: this.opts.filmOpacity, side: THREE.DoubleSide, depthWrite: false });
    this.webMat = this._m(this.opts.filmColor, { roughness: 0.22, transparent: true, opacity: Math.min(0.55, this.opts.filmOpacity * 1.6), side: THREE.DoubleSide, depthWrite: false });
    this.web = new THREE.Mesh(webGeo, this.webMat); this.web.name = 'filmWeb'; this.web.frustumCulled = false; this.web.userData.noShadow = true; this.web.renderOrder = 3; R.add(this.web);
    this._webEnd = new THREE.Vector3(); this._headWorldLocal(this._webEnd); this._setWeb(this._webEnd, 0.5);
    this.carriage.position.y = this._carY = 0.6;
  }

  _makeCase(w, h, d, color) {
    const g = new THREE.Group(); g.name = 'case';
    this._add(g, this._rb(w, h, d, 0.025, 2), this._m(color), 0, h / 2, 0, 'caseBody');
    const tm = this.M.tapeM || (this.M.tapeM = this._m(COL.tape, { roughness: 0.6 }));
    this._add(g, this._rb(0.07, 0.006, d + 0.004, 0.002, 1), tm, 0, h + 0.001, 0, 'tape');
    this._add(g, this._rb(0.07, h * 0.3, d + 0.006, 0.002, 1), tm, 0, h * 0.85, 0, 'tapeSide');
    this._add(g, this._rb(w * 0.3, h * 0.22, 0.006, 0.002, 1), this.M.white, w * 0.18, h * 0.45, d / 2 + 0.002, 'label');
    return g;
  }

  _floorDecal() {
    const W = 8.4, D = 6.0, PX = 64, cx = -1.2, cz = -0.6; // decal covers x -5.4..3.0, z -3.6..2.4
    const cv = document.createElement('canvas'); cv.width = W * PX; cv.height = D * PX; const c = cv.getContext('2d');
    const X = (x) => (x - (cx - W / 2)) * PX, Z = (z) => (z - (cz - D / 2)) * PX;
    c.clearRect(0, 0, cv.width, cv.height);
    c.lineJoin = 'round';
    const rect = (x, z, w, d, col, lw, dash) => { c.strokeStyle = col; c.lineWidth = lw * PX; c.setLineDash(dash ? dash.map((v) => v * PX) : []); c.strokeRect(X(x - w / 2), Z(z - d / 2), w * PX, d * PX); c.setLineDash([]); };
    // hazard ring around the turntable
    c.strokeStyle = '#FFC220'; c.lineWidth = 0.1 * PX; c.setLineDash([0.35 * PX, 0.25 * PX]); c.beginPath(); c.arc(X(0), Z(0), 1.45 * PX, 0, TAU); c.stroke(); c.setLineDash([]);
    // staging spot + case stack area outlines
    rect(-3.3, 0.15, 1.45, 1.65, '#FFC220', 0.08);
    rect(-3.3, -2.1, 1.45, 1.25, '#FFFFFF', 0.06, [0.25, 0.15]);
    // corner ticks for the pallet spot
    c.fillStyle = 'rgba(4,30,66,0.85)'; c.font = `800 ${0.28 * PX}px "Bogle","Inter","Arial",sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('PALLET BUILD', X(-3.3), Z(1.25)); c.font = `800 ${0.22 * PX}px "Bogle","Inter","Arial",sans-serif`; c.fillText('CASES', X(-3.3), Z(-2.95));
    c.fillText('WRAP', X(0), Z(1.75));
    // arrow staging -> turntable
    c.fillStyle = 'rgba(0,113,206,0.85)'; c.beginPath(); const ay = Z(0.15), ax0 = X(-2.35), ax1 = X(-1.85);
    c.moveTo(ax0, ay - 0.08 * PX); c.lineTo(ax1, ay - 0.08 * PX); c.lineTo(ax1, ay - 0.2 * PX); c.lineTo(ax1 + 0.25 * PX, ay); c.lineTo(ax1, ay + 0.2 * PX); c.lineTo(ax1, ay + 0.08 * PX); c.lineTo(ax0, ay + 0.08 * PX); c.closePath(); c.fill();
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; this._tex = tex;
    const g = new THREE.PlaneGeometry(W, D); this._geos.push(g);
    const m = this._m(0xffffff, { map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, roughness: 0.9 });
    const mesh = this._add(this.root, g, m, cx, 0.004, cz, 'floorPaint'); mesh.rotation.x = -Math.PI / 2; mesh.userData.noShadow = true; mesh.renderOrder = 1;
  }

  /* ---------------------------------------------------------------- public API */
  getTurntableWorld(target = new THREE.Vector3()) { this.root.updateMatrixWorld(true); return this.root.localToWorld(target.set(0, TT_TOP, 0)); }
  getStagingWorld(target = new THREE.Vector3()) { this.root.updateMatrixWorld(true); return this.root.localToWorld(target.set(-3.3, 0, 0.15)); }
  getCaseStackWorld(target = new THREE.Vector3()) { this.root.updateMatrixWorld(true); return this.root.localToWorld(target.set(-3.3, 0, -2.1)); }
  /** World yaw of the station (pallet long axis = local Z). */
  getYaw() { const q = new THREE.Quaternion(); this.root.getWorldQuaternion(q); return new THREE.Euler().setFromQuaternion(q, 'YXZ').y; }
  /** Detach the top case from the case stack (world transform kept, re-parented to `newParent` or the scene root). */
  takeCase(newParent) {
    const c = this.cases.pop(); if (!c) return null;
    let top = this.root; while (top.parent) top = top.parent; (newParent || top).attach(c); return c;
  }
  isBusy() { return !!this._job; }
  getState() { return this._job ? this._job.phase : 'idle'; }
  /** Progress 0..1 of the current wrap (0 when idle). */
  getProgress() { return this._job ? clamp01(this._job.t / this._job.D) : 0; }

  /**
   * wrap(pallet, {duration}) -> Promise<pallet>. Pallet = Object3D whose origin sits on getTurntableWorld().
   * Queued if a wrap is already running.
   */
  wrap(pallet, o = {}) {
    const p = this._queue.then(() => new Promise((resolve) => this._begin(pallet, o, resolve)));
    this._queue = p.catch(() => {}); return p;
  }

  _begin(pallet, o, resolve) {
    const D = Math.max(18, o.duration ?? this.opts.duration);
    const disc = this.disc; disc.rotation.y = 0; this.root.updateMatrixWorld(true);
    const origParent = pallet.parent || this.root.parent;
    disc.attach(pallet); disc.updateMatrixWorld(true);
    // bounding box of the load in disc space
    const inv = new THREE.Matrix4().copy(disc.matrixWorld).invert(), box = new THREE.Box3(), tmp = new THREE.Box3(), m4 = new THREE.Matrix4();
    pallet.updateMatrixWorld(true);
    pallet.traverse((ob) => { if (ob.isMesh && ob.visible && ob.geometry && !ob.userData.isWrapFilm) { if (!ob.geometry.boundingBox) ob.geometry.computeBoundingBox(); tmp.copy(ob.geometry.boundingBox).applyMatrix4(m4.multiplyMatrices(inv, ob.matrixWorld)); box.union(tmp); } });
    if (box.isEmpty()) box.set(new THREE.Vector3(-0.51, 0, -0.61), new THREE.Vector3(0.51, 1.5, 0.61));
    const cx = (box.min.x + box.max.x) / 2, cz = (box.min.z + box.max.z) / 2, a = (box.max.x - box.min.x) / 2, b = (box.max.z - box.min.z) / 2;
    const yMin = box.min.y, yMax = Math.min(box.max.y, MAST_H - 0.4);
    const hb = yMin + 0.05 + FILM_W / 2 + TT_BASE_H;                           // band centre at bottom (root space)
    const ht = Math.max(hb, yMax - FILM_W / 2 + 0.015 + TT_BASE_H);            // band top edge ~flush with the load top
    const Tpre = 1.6, Tpost = 5.0, Trot = D - Tpre - Tpost, Tr = 2.6;
    const wT = (this.opts.rpm * TAU) / 60;
    const N = Math.max(3, Math.round((wT * (Trot - Tr)) / TAU)), wMax = (N * TAU) / (Trot - Tr), PHI = N * TAU;
    const SEG = 120, maxSamples = N * SEG + 4, TAILN = 8;
    const nV = (maxSamples + TAILN + 2) * 2;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nV * 3), 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(nV * 3), 3).setUsage(THREE.DynamicDrawUsage));
    const idx = new (nV > 65535 ? Uint32Array : Uint16Array)((nV / 2 - 1) * 6);
    for (let i = 0; i < nV / 2 - 1; i++) { const v = i * 2; idx.set([v, v + 1, v + 2, v + 2, v + 1, v + 3], i * 6); }
    geo.setIndex(new THREE.BufferAttribute(idx, 1)); geo.setDrawRange(0, 0);
    const film = new THREE.Mesh(geo, this.filmMat); film.name = 'stretchFilm'; film.frustumCulled = false; film.renderOrder = 2;
    film.userData.isWrapFilm = true; film.userData.noShadow = true; disc.add(film);
    const lead = 0.75;
    const J = this._job = { pallet, origParent, resolve, D, Tpre, Tpost, Trot, Tr, wMax, PHI, N, SEG, cx, cz, a, b, hb, ht, film, geo, lead, t: 0, written: 0, phase: 'present', tailN: TAILN, nSamples: 0, cut: null, armY0: this._armY };
    J.start = this._perim(J, lead, 0, new THREE.Vector3());
    J.webFrom = this._webEnd.clone();
    this._carY0 = this._carY;
  }

  /* rounded-rect perimeter around the load, parameterised by angle t (t increases CCW seen from +Y, t=0 at +X face).
     off = film offset (grows per layer so layers never clip each other or the cases). Returns disc-space XZ in out. */
  _perim(J, t, off, out) {
    const A = J.a + 0.03 + off, B = J.b + 0.03 + off, r = 0.08;
    const sx = A - r, sz = B - r, L1 = sz, Lq = (Math.PI / 2) * r, P = 4 * (sx + sz + Lq);
    let s = (((t / TAU) % 1) + 1) % 1 * P;
    // walk: start (A,0) -> -Z along +X face ... quarter-symmetric pieces
    const pieces = [
      ['l', A, 0, 0, -1, L1], ['a', sx, -sz, 0], ['l', sx, -B, -1, 0, 2 * sx], ['a', -sx, -sz, 1],
      ['l', -A, -sz, 0, 1, 2 * sz], ['a', -sx, sz, 2], ['l', -sx, B, 1, 0, 2 * sx], ['a', sx, sz, 3], ['l', A, sz, 0, -1, L1],
    ];
    for (const pc of pieces) {
      const len = pc[0] === 'l' ? pc[5] : Lq;
      if (s <= len || pc === pieces[pieces.length - 1]) {
        if (pc[0] === 'l') out.set(pc[1] + pc[3] * s, 0, pc[2] + pc[4] * s);
        else { const ang = pc[3] * (Math.PI / 2) + s / r; out.set(pc[1] + Math.cos(ang) * r, 0, pc[2] - Math.sin(ang) * r); }
        out.x += J.cx; out.z += J.cz; return out;
      }
      s -= len;
    }
    return out;
  }
  _angleAt(J, t) { // turntable angle profile (analytic, eased ramp up/down, ends at exactly N revolutions)
    const { Trot, Tr, wMax, PHI } = J;
    if (t <= 0) return 0; if (t >= Trot) return PHI;
    const ramp = (x) => Tr * (x * x * x - (x * x * x * x) / 2);
    if (t < Tr) return wMax * ramp(t / Tr);
    if (t > Trot - Tr) return PHI - wMax * ramp((Trot - t) / Tr);
    return wMax * (Tr / 2 + (t - Tr));
  }
  _heightAt(J, u) { // carriage band centre vs wrap progress u (0..1): bottom wraps, up, top wraps, down, bottom
    const { hb, ht } = J;
    if (u < 0.18) return hb; if (u < 0.58) return lerp(hb, ht, s5((u - 0.18) / 0.4));
    if (u < 0.70) return ht; if (u < 0.95) return lerp(ht, hb, s5((u - 0.70) / 0.25)); return hb;
  }
  _writePair(J, i, tAng, off, h, p) { // write vertex pair i of the ribbon (disc space)
    const pos = J.geo.attributes.position.array, nor = J.geo.attributes.normal.array;
    this._perim(J, tAng, off, p);
    const y = h - TT_BASE_H, k = i * 6;
    pos[k] = p.x; pos[k + 1] = y - FILM_W / 2; pos[k + 2] = p.z; pos[k + 3] = p.x; pos[k + 4] = y + FILM_W / 2; pos[k + 5] = p.z;
    let nx = p.x - J.cx, nz = p.z - J.cz; const l = Math.hypot(nx, nz) || 1; nx /= l; nz /= l;
    nor[k] = nx; nor[k + 1] = 0; nor[k + 2] = nz; nor[k + 3] = nx; nor[k + 4] = 0; nor[k + 5] = nz;
  }
  _discToRoot(v, out) { const c = Math.cos(this.disc.rotation.y), s = Math.sin(this.disc.rotation.y); return out.set(v.x * c + v.z * s, v.y + TT_BASE_H, -v.x * s + v.z * c); }
  _headWorldLocal(out) { const th = this._armTheta; return out.set(ARM_PIVOT.x + Math.cos(th) * ARM_L, this._armY, ARM_PIVOT.z - Math.sin(th) * ARM_L); }
  _applyArm() { this.armSwing.rotation.y = this._armTheta; this.arm.position.y = this._armY; this.armPost.scale.y = Math.max(0.2, this._armY + 0.05); this.armPost.position.y = (this._armY + 0.05) / 2; }
  _setWeb(end, h, endH) { // web quad from the carriage exit roller to `end` (root space). end.y ignored; heights centred at h
    const e = this._exitPoint(new THREE.Vector3());
    const pos = this.web.geometry.attributes.position.array, nor = this.web.geometry.attributes.normal.array;
    const he = endH ?? h, w2 = FILM_W / 2, wEnd = Math.min(w2, (endH !== undefined ? 0.26 : w2));
    pos.set([e.x, h - w2, e.z, e.x, h + w2, e.z, end.x, he - wEnd, end.z, end.x, he + wEnd, end.z]);
    let nx = -(end.z - e.z), nz = end.x - e.x; const l = Math.hypot(nx, nz) || 1; nx /= l; nz /= l;
    for (let i = 0; i < 4; i++) nor.set([nx, 0, nz], i * 3);
    this.web.geometry.attributes.position.needsUpdate = true; this.web.geometry.attributes.normal.needsUpdate = true;
    this.web.geometry.computeBoundingSphere();
  }
  _exitPoint(out) { return out.set(MAST_X + EXIT.x, this._carY, EXIT.z); }
  _armAngleTo(q) { return Math.atan2(-(q.z - ARM_PIVOT.z), q.x - ARM_PIVOT.x); }
  _unwrapNear(th, ref) { while (th - ref > Math.PI) th -= TAU; while (th - ref < -Math.PI) th += TAU; return th; }

  /* ---------------------------------------------------------------- per-frame */
  update(dt) {
    dt = Math.min(Math.max(dt || 0, 0), 0.1); this._t += dt;
    const J = this._job;
    if (!J) { this.beacon.material.emissiveIntensity = 0.15; return; }
    const prevT = J.t; J.t += dt; const t = J.t;
    const v = new THREE.Vector3(), w = new THREE.Vector3();
    this.beacon.material.emissiveIntensity = 0.5 + 0.9 * (0.5 + 0.5 * Math.sin(this._t * 7));
    const tr = t - J.Tpre;
    // ---------- 1) present: arm (clamp holds film tail) swings toward the load corner, film end transfers to the load
    if (t < J.Tpre) {
      J.phase = 'present';
      const k = s5(t / J.Tpre);
      const thPresent = this._unwrapNear(this._armAngleTo(J.start), ARM_PARK) ; // reachable angle toward the load corner
      this._armTheta = lerp(ARM_PARK, thPresent, Math.min(1, k * 1.25));
      this._carY = lerp(this._carY0, J.hb, k); this._armY = lerp(J.armY0, J.hb, k);
      const head = this._headWorldLocal(new THREE.Vector3()), st = this._discToRoot(J.start, w);
      this._webEnd.lerpVectors(head, st, sstep((k - 0.55) / 0.45));
      this._setWeb(this._webEnd, this._carY);
    } else if (tr < J.Trot) {
      // ---------- 2) rotate + wind film along the helix
      J.phase = 'wrapping';
      const phi = this._angleAt(J, tr), u = phi / J.PHI;
      this.disc.rotation.y = phi;
      // arm returns to park during spin-up
      const kb = s5(tr / 1.6); const thPresent = this._unwrapNear(this._armAngleTo(J.start), ARM_PARK);
      this._armTheta = lerp(thPresent, ARM_PARK, kb);
      this._carY = this._heightAt(J, u);
      // arm height follows to final band height in the last quarter (ready to cut)
      this._armY = J.hb;
      // samples up to phi
      const nFull = Math.min(Math.floor((phi / J.PHI) * J.N * J.SEG), J.N * J.SEG);
      for (let i = J.written; i <= nFull; i++) {
        const tau = (i / J.SEG) * TAU, uu = tau / J.PHI;
        this._writePair(J, i, J.lead - tau, 0.004 * (tau / TAU), this._heightAt(J, uu), v);
      }
      J.written = Math.max(J.written, nFull + 1);
      // moving end vertex exactly at phi
      this._writePair(J, J.written, J.lead - phi, 0.004 * (phi / TAU), this._carY, v);
      J.nSamples = J.written + 1;
      J.geo.setDrawRange(0, Math.max(0, (J.nSamples - 1) * 6)); J.geo.attributes.position.needsUpdate = true; J.geo.attributes.normal.needsUpdate = true;
      v.y = 0; this._discToRoot(v, this._webEnd);
      this._setWeb(this._webEnd, this._carY);
      // spinning film roll + rollers (surface speed ~ omega * 0.75 m)
      const dphi = phi - this._angleAt(J, Math.max(0, prevT - J.Tpre)), sv = dphi * 0.75;
      this.roll.rotation.y -= sv / 0.12; this.rollCore.rotation.y = this.roll.rotation.y; this.rollers[0].rotation.y += sv / 0.035; this.rollers[1].rotation.y -= sv / 0.035 * 1.6;
      // the roll gets very slightly thinner as film is paid out (persisted across wraps, floor at 60 %)
      const rr = Math.max(0.6, (this._rollR ?? 1) - 0.004 * (phi / TAU)); this.roll.scale.set(rr, 1, rr);
      if (tr >= J.Trot - 1e-6 || tr + dt >= J.Trot) J.rollEnd = Math.max(0.6, (this._rollR ?? 1) - 0.004 * J.N);
    } else {
      // ---------- 3) cut + wipe + park
      const tp = tr - J.Trot; this.disc.rotation.y = J.PHI;
      if (!J.cut) J.cut = this._planCut(J);
      const C = J.cut;
      if (tp < 1.3) { // swing in to the web
        J.phase = 'cutting';
        this._armTheta = lerp(ARM_PARK, C.thCut, s5(tp / 1.3));
        this._setWeb(C.P, this._carY);
        this.jaw.position.x = -0.05;
      } else if (tp < 1.55) { // clamp + cut
        this._armTheta = C.thCut; this.jaw.position.x = lerp(-0.05, -0.015, s5((tp - 1.3) / 0.15));
        if (!C.done) { C.done = true; }
        this._writeTail(J, C, 0);
        this._setWeb(this._headWorldLocal(w), this._carY, this._carY);
      } else if (tp < 3.3) { // wipe tail flat
        J.phase = 'wiping';
        const k = s5((tp - 1.55) / 1.75);
        this._armTheta = lerp(C.thCut, C.thWipe, Math.sin(k * Math.PI) * 0.8 + k * 0.2);
        this._writeTail(J, C, k);
        this._setWeb(this._headWorldLocal(w), this._carY, this._carY);
      } else { // park; clamp keeps the film stub
        J.phase = 'parking';
        const k = s5((tp - 3.3) / Math.max(0.5, J.Tpost - 3.3));
        this._armTheta = lerp(C.thEnd, ARM_PARK + 0 * TAU, k);
        this._writeTail(J, C, 1);
        this._setWeb(this._headWorldLocal(w), this._carY, this._carY);
        if (tp >= J.Tpost) this._finish(J);
      }
      if (J.phase === 'wiping' && tp >= 3.3 - 1e-6) C.thEnd = this._armTheta;
      if (C.thEnd === undefined) C.thEnd = C.thWipe * 0.2 + C.thCut * 0.8;
    }
    this.carriage.position.y = this._carY; this._applyArm();
  }

  _planCut(J) {
    // web segment E->P in root space; find where the arm circle crosses it (prefer ~45% from P)
    const E = this._exitPoint(new THREE.Vector3()), P = this._webEnd.clone();
    let best = null;
    for (let i = 0; i <= 60; i++) { const f = i / 60, q = new THREE.Vector3().lerpVectors(P, E, f); const d = Math.abs(Math.hypot(q.x - ARM_PIVOT.x, q.z - ARM_PIVOT.z) - ARM_L); if (!best || d < best.d - 1e-4 || (Math.abs(d - best.d) < 0.01 && Math.abs(f - 0.45) < Math.abs(best.f - 0.45))) best = { d, f, q }; }
    const thCut = this._unwrapNear(this._armAngleTo(best.q), ARM_PARK + Math.PI * 0.9);
    // tail: from P (contact) to the cut point, then pressed flat along the perimeter onto the next face
    const phi = J.PHI, Lt = best.q.distanceTo(P);
    const dT = Lt / (J.a + J.b + 0.1); // approx angle per metre on this rounded rect
    const thWipe = this._unwrapNear(this._armAngleTo(this._discToRoot(this._perim(J, J.lead - phi - dT * 0.6, 0.004 * J.N + 0.004, new THREE.Vector3()), new THREE.Vector3())), thCut);
    return { thCut, thWipe, cutPt: best.q.clone(), P, Lt, dT, done: false };
  }
  _writeTail(J, C, k) {
    // tail pairs follow the last ribbon pair: straight (P -> cut point) when k=0, laid flat on the load when k=1.
    // vertices nearer the load flatten first (as if the brush sweeps from the corner outwards).
    const base = J.nSamples - 1, n = J.tailN, v = new THREE.Vector3(), s = new THREE.Vector3(), cutDisc = new THREE.Vector3();
    // cut point to disc space (disc at PHI == identity rotation)
    const c = Math.cos(-this.disc.rotation.y), sn = Math.sin(-this.disc.rotation.y), cp = C.cutPt;
    cutDisc.set(cp.x * c + cp.z * sn, 0, -cp.x * sn + cp.z * c);
    const Pd = new THREE.Vector3(); { const P = C.P; Pd.set(P.x * c + P.z * sn, 0, -P.x * sn + P.z * c); }
    const pos = J.geo.attributes.position.array, nor = J.geo.attributes.normal.array, off = 0.004 * J.N + 0.006;
    for (let j = 1; j <= n; j++) {
      const f = j / n;
      s.lerpVectors(Pd, cutDisc, f); // straight
      this._perim(J, J.lead - J.PHI - C.dT * f, off, v); // flat
      const kk = clamp01(k * 1.6 - f * 0.6), e = s5(kk);
      const x = lerp(s.x, v.x, e), z = lerp(s.z, v.z, e), i = (base + j) * 6;
      const y = this._carY - TT_BASE_H, wv = FILM_W / 2 * lerp(1 - f * 0.48, 1, e);
      pos[i] = x; pos[i + 1] = y - wv; pos[i + 2] = z; pos[i + 3] = x; pos[i + 4] = y + wv; pos[i + 5] = z;
      let nx = x - J.cx, nz = z - J.cz; const l = Math.hypot(nx, nz) || 1; nor.set([nx / l, 0, nz / l, nx / l, 0, nz / l], i);
    }
    J.geo.setDrawRange(0, (J.nSamples - 1 + n) * 6); J.geo.attributes.position.needsUpdate = true; J.geo.attributes.normal.needsUpdate = true;
  }
  _finish(J) {
    J.geo.computeBoundingSphere(); J.geo.computeBoundingBox();
    this.disc.rotation.y = J.PHI; this.disc.updateMatrixWorld(true);
    J.pallet.attach(J.film);                       // film travels with the pallet from now on
    J.origParent.attach(J.pallet);
    this.disc.rotation.y = 0;                     // N whole turns: identical pose, no visual change
    J.pallet.userData.wrapFilm = J.film; J.pallet.userData.wrapped = true;
    if (J.rollEnd !== undefined) this._rollR = J.rollEnd;
    this._job = null; this.jaw.position.x = -0.05;
    J.resolve(J.pallet);
  }

  dispose() {
    this.root.removeFromParent(); for (const g of this._geos) g.dispose(); for (const m of this._mats) m.dispose(); if (this._tex) this._tex.dispose();
  }
}

export function create(scene, opts = {}) { _last = new StretchWrapper(scene, opts); return _last; }
export function update(dt) { if (_last) _last.update(dt); }
export function wrap(pallet, o) { return _last ? _last.wrap(pallet, o) : Promise.reject(new Error('wrapper: create() first')); }
export function getTurntableWorld(target) { return _last ? _last.getTurntableWorld(target) : (target || new THREE.Vector3()).set(0, TT_TOP, 0); }
export function getStagingWorld(target) { return _last ? _last.getStagingWorld(target) : null; }
export function getCaseStackWorld(target) { return _last ? _last.getCaseStackWorld(target) : null; }
export function takeCase(p) { return _last ? _last.takeCase(p) : null; }
export function isBusy() { return _last ? _last.isBusy() : false; }
export function getState() { return _last ? _last.getState() : 'idle'; }
export const TURNTABLE_TOP = TT_TOP;
export { StretchWrapper };
