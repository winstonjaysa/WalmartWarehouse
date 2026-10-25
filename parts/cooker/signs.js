/**
 * signs.js — Hanging double-sided zone signs + dock door number plates (QA L12).
 * Standalone ES module, imports only 'three' + three addons, no global side effects. 1 unit = 1 m.
 *
 *   import * as Signs from './signs.js';
 *   Signs.create(scene, { floorY: 1.2, ceiling: 12.6 });           // all defaults (walmart-dc.html layout)
 *   Signs.create(scene, { zones: { SORTER: { position:[35,9.8,-12], rotationY:0 } }, doors: {...} });
 *   Signs.addSign('RETURNS', [60,7,10], Math.PI/2, { sub: 'RTN' });
 *   Signs.getSign('PALLET BUILD')   -> THREE.Group (userData: { text, width, height, kind })
 *   Signs.update(dt)                -> tiny pendulum sway of cable-hung signs
 *
 * Boards: navy #041E42, white bold text, yellow 6-petal Walmart spark, CanvasTexture (toneMapped:false).
 * Both faces carry their own plane with the same texture, the back one rotated 180°, so text is never mirrored.
 * Positions are the sign CENTRE in world space. Cable-hung signs get two thin cables up to `ceiling` (world Y).
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const NAVY = '#041E42', BLUE = '#0071CE', YELLOW = '#FFC220';
const FONT = '"Bogle","Inter","Helvetica Neue","Arial",sans-serif';
const CAP = 0.72;                       // cap-height / font-size ratio (Inter/Arial bold)

/* Walmart layout used by walmart-dc.html (Three X = x-50, Z = 31-y). y values are relative to opts.floorY for indoor
   signs and to opts.groundY for outdoor (post-mounted) signs. */
export const DEFAULT_ZONES = {
  'GATE':            { position: [100, 5.2, 60.5], rotationY: 0, mount: 'posts', outdoor: true, sub: 'GTE · CHECK-IN / CHECK-OUT' },
  'YARD':            { position: [74, 5.2, 46], rotationY: Math.PI / 2, mount: 'posts', outdoor: true, sub: 'TRAILER SLOTS YA · YD' },
  'RECEIVING':       { position: [-26, 6, 25.5], rotationY: 0, sub: 'RCV · DOORS DR-001–008' },
  'RESERVE STORAGE': { position: [-26, 6, 18.2], rotationY: 0, sub: 'RES · AISLES 01–08' },
  'CROSS-DOCK':      { position: [-2.5, 6, 9], rotationY: Math.PI / 2, sub: 'XDK · STRAIGHT TO SHIPPING' },
  'PICK MODULE':     { position: [11, 6, 18.2], rotationY: 0, sub: 'PM · CASE PICK' },
  'SORTER':          { position: [35, 8.4, -11.5], rotationY: 0, sub: 'SRT1 · SCAN + DIVERT' },
  'PALLET BUILD':    { position: [32, 6, -21.5], rotationY: 0, sub: 'NCV · BUILD + WRAP' },
  'SHIPPING':        { position: [-10, 6, -21.5], rotationY: 0, sub: 'OBS · DOORS DS-101–108' },
};
export const DEFAULT_DOORS = (() => {
  const d = {};
  for (let i = 0; i < 8; i++) d['DR-' + String(i + 1).padStart(3, '0')] = { position: [-40 + 4 * i, 3.55, 30.72], rotationY: Math.PI };
  for (let i = 0; i < 8; i++) d['DS-' + (101 + i)] = { position: [-24 + 4 * i, 3.55, -30.72], rotationY: 0 };
  return d;
})();

/** Walmart 6-petal spark (same construction as parts/models.js drawSpark). */
export function drawSpark(ctx, cx, cy, R, color = YELLOW) {
  ctx.save(); ctx.translate(cx, cy); ctx.fillStyle = color;
  const r0 = R * 0.30, w = R * 0.30;
  for (let i = 0; i < 6; i++) {
    ctx.save(); ctx.rotate(-Math.PI / 2 + i * Math.PI / 3);
    ctx.beginPath(); ctx.ellipse(r0 + (R - r0) / 2, 0, (R - r0) / 2, w / 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

const v3 = (p, out = new THREE.Vector3()) => (p ? (Array.isArray(p) ? out.fromArray(p) : out.copy(p)) : out.set(0, 0, 0));
let _last = null;

class SignSystem {
  constructor(scene, opts = {}) {
    const floorY = opts.floorY ?? 0;
    this.opts = Object.assign({ floorY, groundY: 0, ceiling: floorY + 10, capHeight: 1.2, doorCapHeight: 0.34, subtitles: true, sway: true, swayAmp: 0.0045, emissive: 0.55 }, opts);
    this.root = new THREE.Group(); this.root.name = 'signs'; (opts.parent || scene).add(this.root);
    this.signs = new Map(); this._sway = []; this._t = 0; this._geos = []; this._mats = []; this._texs = [];
    this.M = {
      navy: this._m(0x041e42, { roughness: 0.7 }), cable: this._m(0x3a4250, { roughness: 0.5, metalness: 0.3 }),
      steel: this._m(0x9aa3ae, { roughness: 0.55 }), yellow: this._m(0xffc220, { roughness: 0.6 }), blue: this._m(0x0071ce, { roughness: 0.6 }),
    };
    const zones = opts.zones === false ? {} : (opts.zones || DEFAULT_ZONES);
    for (const [name, z0] of Object.entries(zones)) {
      const d = DEFAULT_ZONES[name] || {}, z = Object.assign({}, d, z0 || {});
      const given = z0 && z0.position;
      const pos = v3(z.position || [0, 6, 0]);
      if (!given) pos.y += d.outdoor ? this.opts.groundY : this.opts.floorY; // defaults are floor/ground relative
      this.addSign(name, pos, z.rotationY ?? 0, z);
    }
    const doors = opts.doors === false ? {} : (opts.doors || DEFAULT_DOORS);
    for (const [name, d0] of Object.entries(doors)) {
      const d = Object.assign({}, DEFAULT_DOORS[name] || {}, d0 || {});
      const pos = v3(d.position || [0, 4.75, 0]); if (!(d0 && d0.position)) pos.y += this.opts.floorY;
      this.addSign(name, pos, d.rotationY ?? 0, Object.assign({ kind: 'door', mount: 'wall', capHeight: this.opts.doorCapHeight, spark: false, bg: BLUE, sub: null }, d));
    }
  }
  _m(color, o = {}) { const m = new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.85, metalness: 0 }, o)); this._mats.push(m); return m; }
  _g(g) { this._geos.push(g); return g; }

  _texture(text, sub, o) {
    const cap = o.capHeight, hasSub = !!sub;
    const fontPx0 = 200, mc = document.createElement('canvas').getContext('2d');
    mc.font = `800 ${fontPx0}px ${FONT}`; const tw0 = mc.measureText(text).width / fontPx0;  // width per 1 px font
    const fontM = cap / CAP, textW = tw0 * fontM;
    let subW = 0, subFontM = fontM * 0.36;
    if (hasSub) { mc.font = `700 ${fontPx0}px ${FONT}`; subW = (mc.measureText(sub).width / fontPx0) * subFontM; }
    const pad = cap * (o.kind === 'door' ? 0.42 : 0.55);
    const H = cap * (o.kind === 'door' ? 1.85 : 1.95) + (hasSub ? subFontM * 1.25 : 0);
    const sparkD = o.spark === false ? 0 : cap * 1.45, gap = sparkD ? cap * 0.38 : 0;
    const W = pad * 2 + sparkD + gap + Math.max(textW, subW);
    let ppm = Math.min(170, 4096 / W, 2048 / H);
    const cw = Math.round(W * ppm), ch = Math.round(H * ppm); ppm = cw / W;
    const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch; const c = cv.getContext('2d');
    c.fillStyle = o.bg || NAVY; c.fillRect(0, 0, cw, ch);
    // inner keyline (blue on navy, white on blue) + yellow foot stripe
    c.strokeStyle = o.kind === 'door' ? 'rgba(255,255,255,0.85)' : 'rgba(0,113,206,0.95)'; c.lineWidth = Math.max(3, 0.05 * ppm);
    const ins = 0.09 * ppm; c.strokeRect(ins, ins, cw - 2 * ins, ch - 2 * ins);
    if (o.kind !== 'door') { c.fillStyle = YELLOW; c.fillRect(ins + c.lineWidth, ch - ins - c.lineWidth / 2 - 0.07 * ppm, cw - 2 * (ins + c.lineWidth), 0.07 * ppm); }
    const textX = (pad + sparkD + gap) * ppm;
    const blockH = cap + (hasSub ? subFontM * 1.25 : 0);
    const capTop = (H - blockH) / 2 * ppm - (o.kind === 'door' ? 0 : 0.03 * ppm);
    if (sparkD) drawSpark(c, (pad + sparkD / 2) * ppm, (capTop + cap * ppm / 2 + (hasSub ? subFontM * 0.62 * ppm : 0)), sparkD / 2 * ppm, YELLOW);
    c.fillStyle = '#FFFFFF'; c.textBaseline = 'alphabetic'; c.textAlign = sparkD ? 'left' : 'center';
    c.font = `800 ${fontM * ppm}px ${FONT}`;
    const tx = sparkD ? textX : cw / 2;
    c.fillText(text, tx, capTop + cap * ppm);
    if (hasSub) { c.font = `700 ${subFontM * ppm}px ${FONT}`; c.fillStyle = YELLOW; c.fillText(sub, tx, capTop + cap * ppm + subFontM * 1.18 * ppm); }
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter;
    this._texs.push(tex);
    return { tex, W, H };
  }

  /**
   * addSign(text, pos, rotY=0, opts) -> THREE.Group (centre of board at pos, board faces ±local Z)
   * opts: { sub, capHeight (1.2 zone / 0.34 door), mount:'cables'|'posts'|'wall', ceiling, groundY, spark:true,
   *         bg:'#041E42', name, kind:'zone'|'door', sway:true, depth }
   */
  addSign(text, pos, rotY = 0, o = {}) {
    o = Object.assign({ capHeight: this.opts.capHeight, mount: 'cables', kind: 'zone', spark: true }, o);
    const sub = this.opts.subtitles && o.kind !== 'door' ? o.sub : null;
    const name = o.name || text;
    if (this.signs.has(name)) this.removeSign(name);
    const { tex, W, H } = this._texture(text, sub, o);
    const P = v3(pos), T = o.depth ?? (o.kind === 'door' ? 0.05 : 0.1);
    const g = new THREE.Group(); g.name = 'sign:' + name; g.position.copy(P); g.rotation.y = rotY;
    const swing = new THREE.Group(); g.add(swing);
    const board = new THREE.Group(); swing.add(board);
    const bodyMat = o.bg && o.bg !== NAVY ? this._m(new THREE.Color(o.bg).getHex(), { roughness: 0.7 }) : this.M.navy;
    const body = new THREE.Mesh(this._g(new RoundedBoxGeometry(W + 0.06, H + 0.06, T, 3, Math.min(0.04, T / 2 - 0.005))), bodyMat); body.name = 'board'; board.add(body);
    const faceMat = this._m(0xffffff, { map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: this.opts.emissive, roughness: 0.75, toneMapped: false });
    const fg = this._g(new THREE.PlaneGeometry(W, H));
    const front = new THREE.Mesh(fg, faceMat); front.position.z = T / 2 + 0.002; front.name = 'faceFront'; board.add(front);
    const back = new THREE.Mesh(fg, faceMat); back.position.z = -T / 2 - 0.002; back.rotation.y = Math.PI; back.name = 'faceBack'; board.add(back);
    let swayLen = 0;
    if (o.mount === 'cables') {
      const ceil = o.ceiling ?? this.opts.ceiling, top = P.y + H / 2 + 0.03, L = Math.max(0.05, ceil - top);
      // pivot at the ceiling: move the swing group up so rotations swing about the anchor
      swing.position.y = L + H / 2; board.position.y = -(L + H / 2);
      const cx = W / 2 - Math.min(0.7, W * 0.18), cg = this._g(new THREE.CylinderGeometry(0.009, 0.009, L, 6));
      for (const s of [-1, 1]) {
        const cab = new THREE.Mesh(cg, this.M.cable); cab.position.set(s * cx, H / 2 + 0.03 + L / 2, 0); cab.name = 'cable'; board.add(cab);
        const clip = new THREE.Mesh(this._g(new RoundedBoxGeometry(0.08, 0.07, T + 0.04, 2, 0.015)), this.M.steel); clip.position.set(s * cx, H / 2 + 0.03, 0); board.add(clip);
        const plate = new THREE.Mesh(this._g(new RoundedBoxGeometry(0.2, 0.04, 0.2, 2, 0.012)), this.M.steel); plate.position.set(s * cx, H / 2 + 0.03 + L + 0.02, 0); board.add(plate);
      }
      swayLen = L + H / 2;
    } else if (o.mount === 'posts') {
      const gy = o.groundY ?? this.opts.groundY, top = P.y + H / 2 + 0.15, Hp = top - gy, px = W / 2 + 0.28;
      const pg = this._g(new RoundedBoxGeometry(0.24, Hp, 0.24, 2, 0.05));
      for (const s of [-1, 1]) {
        const post = new THREE.Mesh(pg, this.M.steel); post.position.set(s * px, gy - P.y + Hp / 2, 0); board.add(post);
        const sleeve = new THREE.Mesh(this._g(new RoundedBoxGeometry(0.32, 1.0, 0.32, 2, 0.06)), this.M.yellow); sleeve.position.set(s * px, gy - P.y + 0.5, 0); board.add(sleeve);
        const foot = new THREE.Mesh(this._g(new RoundedBoxGeometry(0.6, 0.12, 0.6, 2, 0.04)), this.M.steel); foot.position.set(s * px, gy - P.y + 0.06, 0); board.add(foot);
      }
      const beam = new THREE.Mesh(this._g(new RoundedBoxGeometry(2 * px + 0.24, 0.2, 0.2, 2, 0.05)), this.M.blue); beam.position.set(0, H / 2 + 0.15, 0); board.add(beam);
    } else if (o.mount === 'wall') {
      for (const s of [-1, 1]) { const st = new THREE.Mesh(this._g(new RoundedBoxGeometry(0.06, 0.06, 0.1, 1, 0.01)), this.M.steel); st.position.set(s * (W / 2 - 0.12), 0, -T / 2 - 0.05); board.add(st); }
    }
    g.traverse((ob) => { if (ob.isMesh) { ob.castShadow = ob.name !== 'faceFront' && ob.name !== 'faceBack'; ob.receiveShadow = false; } });
    g.userData = { text, sub, width: W, height: H, kind: o.kind, mount: o.mount, faceMat, board, swing };
    this.root.add(g); this.signs.set(name, g);
    if (o.mount === 'cables' && (o.sway ?? this.opts.sway)) {
      let h = 0; for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
      const w = Math.sqrt(9.81 / Math.max(0.5, swayLen));
      this._sway.push({ swing, w, ph: (h % 628) / 100, ph2: (h % 377) / 60, a: this.opts.swayAmp * (0.7 + (h % 7) / 20) });
    }
    return g;
  }
  getSign(name) { return this.signs.get(name) || null; }
  getSigns() { return this.signs; }
  /** Brighten a sign (0..1), e.g. while the tour is on that zone. */
  highlight(name, k = 1) { const s = this.signs.get(name); if (s) s.userData.faceMat.emissiveIntensity = this.opts.emissive + 0.45 * k; }
  removeSign(name) { const s = this.signs.get(name); if (!s) return; s.removeFromParent(); this.signs.delete(name); this._sway = this._sway.filter((e) => e.swing !== s.userData.swing); }
  update(dt) {
    this._t += Math.min(Math.max(dt || 0, 0), 0.1);
    for (const e of this._sway) { e.swing.rotation.z = e.a * Math.sin(this._t * e.w + e.ph); e.swing.rotation.x = e.a * 0.5 * Math.sin(this._t * e.w * 0.93 + e.ph2); }
  }
  dispose() { this.root.removeFromParent(); for (const g of this._geos) g.dispose(); for (const m of this._mats) m.dispose(); for (const t of this._texs) t.dispose(); }
}

export function create(scene, opts) { _last = new SignSystem(scene, opts); return _last; }
export function update(dt) { if (_last) _last.update(dt); }
export function addSign(text, pos, rotY, opts) { if (!_last) throw new Error('signs: create() first'); return _last.addSign(text, pos, rotY, opts); }
export function getSign(name) { return _last ? _last.getSign(name) : null; }
export function highlight(name, k) { if (_last) _last.highlight(name, k); }
export { SignSystem };
