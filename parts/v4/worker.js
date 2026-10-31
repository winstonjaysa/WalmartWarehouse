// worker.js — stylised Walmart Canada associate (~1.75 m) with rigid-part rig. Three.js r160.
// ---- inline merge kit (self-contained; vertex-colour buckets, merged per material) ----
const _WUV = [0.01, 0.985];
function _prep(THREE, geo, col, mtx, keepUV) {
  let g = geo.index ? geo.toNonIndexed() : geo.clone();
  if (mtx) g.applyMatrix4(mtx);
  if (!g.attributes.normal) g.computeVertexNormals();
  const n = g.attributes.position.count, c = new Float32Array(n * 3), cc = new THREE.Color(col);
  for (let i = 0; i < n; i++) { c[i * 3] = cc.r; c[i * 3 + 1] = cc.g; c[i * 3 + 2] = cc.b; }
  const uv = new Float32Array(n * 2);
  if (keepUV && g.attributes.uv) uv.set(g.attributes.uv.array);
  else for (let i = 0; i < n; i++) { uv[i * 2] = _WUV[0]; uv[i * 2 + 1] = _WUV[1]; }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', g.attributes.position.clone());
  out.setAttribute('normal', g.attributes.normal.clone());
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return out;
}
function _merge(THREE, geos) {
  const keys = ['position', 'normal', 'uv', 'color'], out = new THREE.BufferGeometry();
  for (const k of keys) {
    const sz = geos[0].attributes[k].itemSize; let len = 0;
    for (const g of geos) len += g.attributes[k].array.length;
    const a = new Float32Array(len); let o = 0;
    for (const g of geos) { a.set(g.attributes[k].array, o); o += g.attributes[k].array.length; }
    out.setAttribute(k, new THREE.BufferAttribute(a, sz));
  }
  out.computeBoundingSphere(); out.computeBoundingBox();
  return out;
}
function _kit(THREE) {
  const B = {};
  const E = new THREE.Euler(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3();
  function add(key, geo, col, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1], keepUV = false) {
    const m = new THREE.Matrix4().compose(V.set(...pos), Q.setFromEuler(E.set(rot[0], rot[1], rot[2])), S.set(...scl));
    (B[key] = B[key] || []).push(_prep(THREE, geo, col, m, keepUV));
  }
  function mesh(key, mat, name) {
    if (!B[key] || !B[key].length) return null;
    const m = new THREE.Mesh(_merge(THREE, B[key]), mat); m.name = name || key;
    m.castShadow = true; m.receiveShadow = true; B[key] = []; return m;
  }
  const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  function rbox(w, h, d, r, seg = 2) {
    const b = Math.min(r, w / 2.2, h / 2.2, d / 2.2) * 0.9;
    const W = w - 2 * b, H = h - 2 * b, rr = Math.min(r * 0.6, W / 2.1, H / 2.1);
    const s = new THREE.Shape(), x = -W / 2, y = -H / 2;
    s.moveTo(x + rr, y); s.lineTo(x + W - rr, y); s.quadraticCurveTo(x + W, y, x + W, y + rr);
    s.lineTo(x + W, y + H - rr); s.quadraticCurveTo(x + W, y + H, x + W - rr, y + H);
    s.lineTo(x + rr, y + H); s.quadraticCurveTo(x, y + H, x, y + H - rr);
    s.lineTo(x, y + rr); s.quadraticCurveTo(x, y, x + rr, y);
    const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(d - 2 * b, 0.001), bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: seg, curveSegments: 3 });
    g.translate(0, 0, -(d - 2 * b) / 2); return g;
  }
  const cylX = (r, len, seg = 20, r2) => new THREE.CylinderGeometry(r, r2 ?? r, len, seg).rotateZ(Math.PI / 2);
  const cylZ = (r, len, seg = 20) => new THREE.CylinderGeometry(r, r, len, seg).rotateX(Math.PI / 2);
  return { B, add, mesh, box, rbox, cylX, cylZ };
}
function _vcMat(THREE, rough, metal, extra = {}) {
  return new THREE.MeshStandardMaterial(Object.assign({ color: 0xffffff, vertexColors: true, roughness: rough, metalness: metal }, extra));
}
// Wheel geometry (axis = x, outer face +x). dual => two tyres.
function _wheelGeo(THREE, r, w, dual) {
  const K = _kit(THREE), rimR = r * 0.56;
  const prof = [], sh = Math.min(0.07, w * 0.25);
  prof.push(new THREE.Vector2(rimR, -w / 2));
  for (let i = 0; i <= 4; i++) { const a = Math.PI / 2 * (i / 4); prof.push(new THREE.Vector2(r - sh + Math.sin(a) * sh, -w / 2 + sh - Math.cos(a) * sh)); }
  for (let i = 0; i <= 4; i++) { const a = Math.PI / 2 * (i / 4); prof.push(new THREE.Vector2(r - sh + Math.cos(a) * sh, w / 2 - sh + Math.sin(a) * sh)); }
  prof.push(new THREE.Vector2(rimR, w / 2));
  const tyre = new THREE.LatheGeometry(prof, 30).rotateZ(-Math.PI / 2);
  const offs = dual ? [-(w / 2 + 0.015), (w / 2 + 0.015)] : [0];
  offs.forEach((ox, i) => {
    K.add('w', tyre, 0x1b1b1d, [ox, 0, 0]);
    for (let g = 0; g < 3; g++) K.add('w', K.cylX(r + 0.004, 0.012, 30), 0x0e0e0f, [ox - w * 0.25 + g * w * 0.25, 0, 0]);
  });
  const outer = offs[offs.length - 1] + w / 2, inner = offs[0] - w / 2;
  K.add('w', K.cylX(rimR, outer - inner - 0.03, 24), 0x8e949b, [(outer + inner) / 2, 0, 0]);
  K.add('w', new THREE.TorusGeometry(rimR * 0.95, 0.018, 6, 24).rotateY(Math.PI / 2), 0xdfe3e7, [outer - 0.03, 0, 0]);
  K.add('w', K.cylX(rimR * 0.9, 0.02, 24), 0xc9ced4, [outer - 0.04, 0, 0]);
  K.add('w', K.cylX(rimR * 0.42, 0.06, 16, rimR * 0.5), 0xe6e9ec, [outer - 0.02, 0, 0]);
  K.add('w', K.cylX(rimR * 0.18, 0.05, 12), 0x55595e, [outer + 0.02, 0, 0]);
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; K.add('w', K.cylX(0.016, 0.04, 6), 0xf2f2f2, [outer + 0.01, Math.cos(a) * rimR * 0.33, Math.sin(a) * rimR * 0.33]); }
  for (let i = 0; i < 8; i++) { const a = (i + 0.5) / 8 * Math.PI * 2; K.add('w', K.cylX(0.028, 0.025, 8), 0x2a2d31, [outer - 0.03, Math.cos(a) * rimR * 0.68, Math.sin(a) * rimR * 0.68]); }
  return _merge(THREE, K.B.w);
}
function _placardCanvas(THREE, base, accent, txt = 'Beverage Vendor') {
  if (typeof document === 'undefined') return null;
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 512;
  const x = cv.getContext('2d');
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, 1024, 512);
  // placard region: rows 64..512 (v 0 .. 0.875)
  x.fillStyle = '#f7f7f4'; x.fillRect(0, 64, 1024, 448);
  x.strokeStyle = accent; x.lineWidth = 14; x.strokeRect(22, 86, 980, 404);
  x.fillStyle = accent; x.fillRect(22, 400, 980, 90);
  x.fillStyle = '#20242a'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = 'bold 116px "Helvetica Neue", Arial, sans-serif'; x.fillText(txt, 512, 240);
  x.fillStyle = '#ffffff'; x.font = 'bold 44px Arial, sans-serif'; x.fillText('DIRECT STORE DELIVERY', 512, 446);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
// placard plane uv -> placard region of atlas
function _placardGeo(THREE, w, h) {
  const g = new THREE.PlaneGeometry(w, h), uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i), uv.getY(i) * 0.86 + 0.005);
  return g;
}
// ---- end kit ----
export function build(THREE, mats = {}, opts = {}) {
  let seed = (opts.seed ?? 1) * 9301 + 49297; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const SKINS = [0xf1c7a5, 0xe0ac85, 0xc68a62, 0x9a6440, 0x6e4529], HAIRS = [0x1d1612, 0x3b2516, 0x6b4426, 0xa8763e, 0x2a2a2a];
  const skin = opts.skin ?? SKINS[Math.floor(rnd() * SKINS.length)], hair = opts.hair ?? HAIRS[Math.floor(rnd() * HAIRS.length)];
  const pants = opts.pants ?? (rnd() < 0.5 ? 0xb39b72 : 0x25272c), SHIRT = 0x1c2a4a, SLEEVE = 0x141f38, VEST = 0x0071ce, VEST_D = 0x005aa8, BAND = 0xffc220, SHOE = 0x2a221c, SOLE = 0x111113;
  const sc = opts.height ? opts.height / 1.75 : 0.97 + rnd() * 0.06;
  const mat = _vcMat(THREE, 0.72, 0.0, { flatShading: false });
  const K = _kit(THREE), { add, rbox } = K;
  const sph = (r, ws = 12, hs = 10, ...a) => new THREE.SphereGeometry(r, ws, hs, ...a);
  const tcyl = (rt, rb, h, seg = 10) => new THREE.CylinderGeometry(rt, rb, h, seg);
  const lathe = (pts, seg = 10, ps = 0, pl = Math.PI * 2) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg, ps, pl);
  const seg = (a, b, r, col, k = 'chest') => { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), g = tcyl(r, r, d.length(), 5);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize())); const m = A.add(B).multiplyScalar(0.5); add(k, g, col, [m.x, m.y, m.z]); };
  const G = new THREE.Group(); G.name = 'worker'; const pivots = {};
  const P = (nm, parent, x, y, z) => { const o = new THREE.Object3D(); o.name = nm; o.position.set(x, y, z); parent.add(o); pivots[nm] = o; return o; };
  const root = new THREE.Object3D(); root.name = 'root'; root.scale.setScalar(sc); G.add(root);
  const hips = P('hips', root, 0, 0.95, 0), spine = P('spine', hips, 0, 0.08, 0), neck = P('neck', spine, 0, 0.44, 0.0);
  const shL = P('shoulder_L', spine, 0.2, 0.37, 0), shR = P('shoulder_R', spine, -0.2, 0.37, 0);
  const elL = P('elbow_L', shL, 0, -0.28, 0), elR = P('elbow_R', shR, 0, -0.28, 0);
  const hpL = P('hip_L', hips, 0.092, -0.04, 0), hpR = P('hip_R', hips, -0.092, -0.04, 0);
  const knL = P('knee_L', hpL, 0, -0.43, 0), knR = P('knee_R', hpR, 0, -0.43, 0);
  const hdL = P('hand_L', elL, -0.006, -0.29, 0.008), hdR = P('hand_R', elR, 0.006, -0.29, 0.008);
  const put = (k, parent) => { const m = K.mesh(k, mat, k); if (m) parent.add(m); };
  // torso profile r(y), spine-local (waist at 0, shoulders ~0.37)
  const TP = [[0.0, -0.02], [0.142, -0.02], [0.146, 0.06], [0.162, 0.16], [0.183, 0.26], [0.192, 0.33], [0.182, 0.38], [0.14, 0.42], [0.07, 0.45], [0.0, 0.455]];
  const rAt = (y) => { for (let i = 1; i < TP.length; i++) if (y <= TP[i][1]) { const [r0, y0] = TP[i - 1], [r1, y1] = TP[i]; return r0 + (r1 - r0) * (y - y0) / ((y1 - y0) || 1); } return 0; };
  const ZS = 0.62;
  // pelvis
  add('pelvis', lathe([[0, 0.1], [0.14, 0.1], [0.152, 0.02], [0.146, -0.045], [0.11, -0.08], [0, -0.088]], 10), pants, [0, 0, 0], [0, 0, 0], [1, 1, 0.68]);
  add('pelvis', lathe([[0.145, 0.06], [0.152, 0.06], [0.152, 0.1], [0.145, 0.1]], 12), 0x151515, [0, 0, 0], [0, 0, 0], [1, 1, 0.69]);
  add('pelvis', rbox(0.05, 0.035, 0.015, 0.006), 0xb8b8b8, [0, 0.08, 0.104]);
  add('pelvis', rbox(0.034, 0.13, 0.085, 0.01), 0x1a1a1c, [-0.157, -0.005, 0.01], [0, 0, 0.06]);   // holster (right hip)
  add('pelvis', rbox(0.04, 0.03, 0.035, 0.006), 0x1a1a1c, [-0.15, 0.065, 0.01]);                     // belt loop clip
  add('pelvis', rbox(0.024, 0.07, 0.074, 0.01), 0x2c2f33, [-0.16, 0.075, 0.01], [0, 0, 0.06]);       // handheld scanner (top)
  add('pelvis', rbox(0.003, 0.05, 0.058, 0.002), 0x3c5a6e, [-0.174, 0.085, 0.01], [0, 0, 0.06]);    // screen sliver
  put('pelvis', hips);
  // chest: tapered lathe torso + chest-forward bulge
  add('chest', lathe(TP, 10), SHIRT, [0, 0, 0], [0, 0, 0], [1, 1, ZS]);
  add('chest', sph(0.15, 10, 8).scale(1, 0.62, 0.5), SHIRT, [0, 0.27, 0.035]);
  // vest: wraps torso (open front), bevel via darker hems
  const gap = 0.3, VP = [];
  for (let y = 0.0; y <= 0.385; y += 0.035) VP.push([rAt(y) + 0.012, y]);
  add('chest', lathe(VP, 16, gap, Math.PI * 2 - 2 * gap), VEST, [0, 0, 0], [0, 0, 0], [1, 1, ZS + 0.02]);
  add('chest', sph(0.12, 10, 6).scale(1, 0.55, 0.48), VEST, [0, 0.285, 0.05]);  // vest over chest front
  const ring = (y0, y1, off, col) => add('chest', lathe([[rAt(y0) + off, y0], [rAt((y0 + y1) / 2) + off + 0.003, (y0 + y1) / 2], [rAt(y1) + off, y1]], 16, gap, Math.PI * 2 - 2 * gap), col, [0, 0, 0], [0, 0, 0], [1, 1, ZS + 0.02]);
  ring(-0.005, 0.02, 0.016, VEST_D);                 // bottom hem
  ring(0.06, 0.1, 0.017, BAND); ring(0.075, 0.085, 0.02, 0xe8ecef);  // waist band + reflective core
  ring(0.17, 0.205, 0.017, BAND);
  for (const s of [-1, 1]) {
    // shoulder straps with yellow band arcing over the shoulder (front to back)
    add('chest', rbox(0.07, 0.03, 0.2, 0.012), VEST, [s * 0.115, 0.392, -0.005], [0, 0, -s * 0.32]);        // vest shoulder yoke (flat, follows shoulder)
    // lanyard: neck to badge clip
    seg([s * 0.052, 0.43, 0.045], [-0.095 + s * 0.012, 0.3, 0.128], 0.0035, 0x1b3f8a);
    add('chest', rbox(0.022, 0.3, 0.014, 0.006), VEST_D, [s * 0.058, 0.19, rAt(0.19) * ZS + 0.012], [0, s * 0.35, 0]);   // front edge piping
  }
  add('chest', new THREE.TorusGeometry(0.062, 0.0035, 4, 16), 0x1b3f8a, [0, 0.43, 0.0], [Math.PI / 2 - 0.35, 0, 0], [1, 1.25, 1]); // lanyard neck loop
  add('chest', rbox(0.012, 0.012, 0.01, 0.003), 0x9a9a9a, [-0.095, 0.297, 0.128]);
  add('chest', rbox(0.07, 0.042, 0.008, 0.005), 0xffffff, [-0.095, 0.27, 0.125], [0, -0.4, 0]);   // name badge
  add('chest', rbox(0.056, 0.01, 0.004, 0.002), VEST, [-0.095, 0.282, 0.1295], [0, -0.4, 0]);
  add('chest', rbox(0.04, 0.005, 0.004, 0.002), 0x444444, [-0.095, 0.266, 0.1295], [0, -0.4, 0]);
  add('chest', lathe([[0.072, 0.4], [0.068, 0.445], [0.056, 0.465]], 10), SHIRT, [0, 0, 0.0]);        // collar
  for (const s of [-1, 1]) add('chest', sph(0.062, 10, 8), SLEEVE, [s * 0.19, 0.37, 0]);                // deltoid
  put('chest', spine);
  // head
  add('head', tcyl(0.04, 0.046, 0.11, 8), skin, [0, 0.035, 0.003]);
  add('head', sph(0.1, 12, 10), skin, [0, 0.165, 0.004], [0.12, 0, 0], [0.9, 1.1, 0.98]);           // egg skull
  add('head', sph(0.062, 12, 8), skin, [0, 0.108, 0.03], [0, 0, 0], [1.15, 0.78, 1.05]);           // jaw
  add('head', sph(0.022, 8, 6), skin, [0, 0.083, 0.072], [0, 0, 0], [1.3, 0.8, 0.9]);              // chin
  add('head', sph(0.104, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), hair, [0, 0.176, -0.008], [-0.18, 0, 0], [0.97, 1.04, 1.05]); // hair cap
  add('head', sph(0.07, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.4), hair, [0.012, 0.205, 0.045], [0.55, 0, 0.18], [1.15, 0.55, 0.9]); // fringe
  for (const s of [-1, 1]) {
    add('head', sph(0.022, 8, 6), skin, [s * 0.09, 0.152, -0.004], [0, 0, 0], [0.45, 1, 0.8]);       // ears
    add('head', sph(0.017, 8, 6), new THREE.Color(skin).multiplyScalar(0.82).getHex(), [s * 0.034, 0.163, 0.082], [0, 0, 0], [1.3, 0.75, 0.5]); // soft eye socket shade
    add('head', sph(0.02, 8, 6), skin, [s * 0.034, 0.18, 0.083], [0, 0, -s * 0.15], [1.4, 0.45, 0.6]);  // brow ridge
  }
  add('head', sph(0.014, 8, 6), skin, [0, 0.145, 0.098], [-0.3, 0, 0], [0.8, 1.3, 0.9]);                       // nose bump
  put('head', neck);
  // arms (upper thicker than forearm), mitten hands
  for (const [s, sh, el] of [[1, shL, elL], [-1, shR, elR]]) {
    const k = 'uarm' + s, f = 'farm' + s;
    add(k, sph(0.05, 10, 8), SLEEVE, [0, 0, 0]);
    add(k, tcyl(0.062, 0.056, 0.15, 10), SLEEVE, [0, -0.065, 0]);
    add(k, tcyl(0.046, 0.039, 0.17, 10), skin, [0, -0.19, 0]);
    put(k, sh);
    add(f, sph(0.0385, 10, 8), skin, [0, 0, 0]);                                              // elbow (inside limb radius)
    add(f, tcyl(0.039, 0.029, 0.22, 10), skin, [0, -0.115, 0]);
    add(f, sph(0.028, 8, 6), skin, [0, -0.225, 0.004], [0, 0, 0], [0.85, 1, 1.25]);             // wrist
    add(f, rbox(0.028, 0.08, 0.07, 0.012, 2), skin, [-s * 0.002, -0.262, 0.006]);              // palm
    for (let i = 0; i < 4; i++) {                                                               // 4 fingers, slightly curled
      const z = 0.006 + (i - 1.5) * 0.0165, ln = [0.052, 0.062, 0.058, 0.046][i];
      add(f, tcyl(0.0082, 0.0068, ln, 6), skin, [-s * 0.009, -0.3 - ln / 2 + 0.006, z], [0, 0, -s * 0.32]);
    }
    add(f, tcyl(0.0095, 0.0075, 0.048, 6), skin, [-s * 0.014, -0.258, 0.044], [0.75, 0, -s * 0.45]); // thumb
    add(f, tcyl(0.031, 0.031, 0.016, 10), 0x2a2a2a, [0, -0.205, 0]);
    put(f, el);
  }
  // legs (thigh thicker than calf), work shoes
  for (const [s, hp, kn] of [[1, hpL, knL], [-1, hpR, knR]]) {
    const k = 'thigh' + s, f = 'shin' + s;
    add(k, sph(0.068, 10, 8), pants, [0, 0, 0]);
    add(k, tcyl(0.072, 0.055, 0.43, 10), pants, [0, -0.215, 0]);
    put(k, hp);
    add(f, sph(0.054, 10, 8), pants, [0, 0, 0]);
    add(f, tcyl(0.055, 0.044, 0.38, 10), pants, [0, -0.19, 0]);
    add(f, tcyl(0.047, 0.05, 0.04, 10), pants, [0, -0.37, 0]);                               // hem
    add(f, rbox(0.1, 0.095, 0.2, 0.035, 2), SHOE, [0, -0.422, 0.0]);                      // shoe upper / heel counter
    add(f, sph(0.05, 10, 8), SHOE, [0, -0.437, 0.1], [0, 0, 0], [0.98, 0.78, 1.45]);          // toe box (blends into upper)
    add(f, rbox(0.097, 0.024, 0.262, 0.011), SOLE, [0, -0.463, 0.03]);                      // sole, inset in shoe outline
    add(f, rbox(0.07, 0.006, 0.08, 0.003), 0x55504a, [0, -0.37, 0.055], [0.35, 0, 0]);        // laces
    put(f, kn);
  }
  let n = 0; G.traverse((o) => { if (o.isMesh) n++; });
  G.userData = { name: 'worker', dims: { w: 0.5, h: +(1.75 * sc).toFixed(3), d: 0.32 }, pivots, drawCalls: n, skin, hair, pants, hipHeight: 0.95 * sc,
    handPoint_L: hdL, handPoint_R: hdR, handOffset: { L: hdL.position.clone(), R: hdR.position.clone(), parent: 'elbow_L / elbow_R' } };
  restPose(G);
  return G;
}
const _rz = (g) => { const P = g.userData.pivots; for (const p of Object.values(P)) p.rotation.set(0, 0, 0); P.hips.position.y = 0.95; };
// natural stance: arms ~8° out (hands stay inside ~0.25 m of centre), elbows ~10°, slight contrapposto, chest forward
export function restPose(group) {
  const P = group.userData.pivots; _rz(group);
  P.shoulder_L.rotation.z = 0.075; P.shoulder_R.rotation.z = -0.07; P.shoulder_L.rotation.x = 0.04; P.shoulder_R.rotation.x = -0.02;
  P.shoulder_L.rotation.y = -0.12; P.shoulder_R.rotation.y = 0.12;
  P.elbow_L.rotation.x = P.elbow_R.rotation.x = -0.18;
  P.hips.rotation.z = 0.03; P.spine.rotation.z = -0.04; P.spine.rotation.x = 0.03; P.neck.rotation.x = -0.02; P.neck.rotation.z = 0.02;
  P.hip_L.rotation.z = -0.03; P.hip_R.rotation.z = -0.045; P.hip_R.rotation.x = -0.06; P.knee_R.rotation.x = 0.12;
  P.hips.position.y = 0.945;
}
// 2-bone arm IK: put hand_<side> on a world-space point (elbow bends down/out/back)
function _ik(group, side, wp) {
  const P = group.userData.pivots, sh = P['shoulder_' + side], el = P['elbow_' + side], hd = P['hand_' + side];
  const V = wp.constructor, M4 = group.matrixWorld.constructor, Q = sh.quaternion.constructor;
  group.updateMatrixWorld(true);
  const t = wp.clone().applyMatrix4(new M4().copy(sh.parent.matrixWorld).invert()), d = t.sub(sh.position);
  const a = Math.abs(el.position.y), b = hd.position.length(), cl = (v) => Math.max(-1, Math.min(1, v));
  const L = Math.max(Math.abs(a - b) + 1e-3, Math.min(d.length(), (a + b) * 0.995)), dh = d.clone().normalize();
  const al = Math.acos(cl((a * a + L * L - b * b) / (2 * a * L)));
  const pole = new V(side === 'L' ? 0.45 : -0.45, -0.5, -0.6); pole.sub(dh.clone().multiplyScalar(pole.dot(dh))).normalize();
  const u = dh.clone().multiplyScalar(Math.cos(al)).add(pole.multiplyScalar(Math.sin(al)));
  const Y = u.clone().negate(), Z = dh.clone().sub(u.clone().multiplyScalar(dh.dot(u))).normalize(), X = new V().crossVectors(Y, Z);
  sh.quaternion.setFromRotationMatrix(new M4().makeBasis(X, Y, Z));
  el.rotation.set(-(Math.PI - Math.acos(cl((a * a + b * b - L * L) / (2 * a * b)))), 0, 0);
  group.updateMatrixWorld(true);
}
// attachHandsTo(g, point)            -> both hands, spread ±0.19 m along the worker's own x axis
// attachHandsTo(g, {L: v3, R: v3})   -> each hand to its own world point;  attachHandsTo(g, v3, 'R') -> one hand
export function attachHandsTo(group, wp, side = 'both', spread = 0.38) {
  if (wp.L || wp.R) { if (wp.L) _ik(group, 'L', wp.L); if (wp.R) _ik(group, 'R', wp.R); return group; }
  if (side !== 'both') { _ik(group, side, wp); return group; }
  group.updateMatrixWorld(true);
  const ax = new wp.constructor(1, 0, 0).transformDirection(group.matrixWorld).multiplyScalar(spread / 2);
  _ik(group, 'L', wp.clone().add(ax)); _ik(group, 'R', wp.clone().sub(ax)); return group;
}
// hand world positions (call after posing)
export function handWorld(group) { group.updateMatrixWorld(true); const P = group.userData.pivots, V = group.position.constructor; return { L: P.hand_L.getWorldPosition(new V()), R: P.hand_R.getWorldPosition(new V()) }; }
// Seated driver. Hips pivot = seat point: if `seat` (Object3D, e.g. truck.getObjectByName('seat')) is given,
// the worker is parented to it and offset so its hips land exactly on the seat origin (facing seat +z).
export function seatedDrivePose(group, seat) {
  const P = group.userData.pivots; _rz(group);
  P.hip_L.rotation.x = P.hip_R.rotation.x = -1.5; P.hip_L.rotation.z = 0.06; P.hip_R.rotation.z = -0.06;
  P.knee_L.rotation.x = P.knee_R.rotation.x = 1.42;
  P.spine.rotation.x = -0.14; P.neck.rotation.x = 0.12;
  P.shoulder_L.rotation.x = P.shoulder_R.rotation.x = -0.95; P.shoulder_L.rotation.z = 0.1; P.shoulder_R.rotation.z = -0.1;
  P.shoulder_L.rotation.y = -0.15; P.shoulder_R.rotation.y = 0.15;
  P.elbow_L.rotation.x = P.elbow_R.rotation.x = -0.62;
  if (seat) { seat.add(group); group.position.set(0, -group.userData.hipHeight, 0); group.rotation.set(0, 0, 0); }
  return group;
}
// Pulling a pallet jack behind: right hand back/down on the handle (default ~1.0 m high, ~0.33 m behind),
// torso leaning forward, mid-stride. handle: optional world point for the grip (solved with IK).
export function jackPullPose(group, handle) {
  const P = group.userData.pivots; walkPose(group, 0.14);
  P.spine.rotation.x = 0.2; P.hips.rotation.x = 0.08; P.neck.rotation.x = -0.18; P.spine.rotation.y = 0.12; P.hips.rotation.y = 0.05;
  P.shoulder_L.rotation.set(-0.35, 0, 0.1); P.elbow_L.rotation.x = -0.55;
  group.updateMatrixWorld(true);
  const V = group.position.constructor, h = handle || new V(-0.2, 1.02, -0.33).applyMatrix4(group.matrixWorld);
  _ik(group, 'R', h); group.userData.gripTarget = h.clone(); return group;
}
// t: phase 0..1 of a full stride (two steps)
export function walkPose(group, t) {
  const P = group.userData.pivots; _rz(group); const a = t * Math.PI * 2, s = Math.sin(a), c = Math.cos(a);
  P.hip_L.rotation.x = -0.45 * s; P.hip_R.rotation.x = 0.45 * s;
  P.knee_L.rotation.x = 0.12 + 0.55 * Math.max(0, Math.sin(a + 1.3)); P.knee_R.rotation.x = 0.12 + 0.55 * Math.max(0, Math.sin(a + 1.3 + Math.PI));
  P.shoulder_L.rotation.x = 0.38 * s; P.shoulder_R.rotation.x = -0.38 * s;
  P.shoulder_L.rotation.z = 0.12; P.shoulder_R.rotation.z = -0.12;
  P.elbow_L.rotation.x = -0.25 - 0.2 * Math.max(0, s); P.elbow_R.rotation.x = -0.25 - 0.2 * Math.max(0, -s);
  P.hips.position.y = 0.95 + 0.018 * Math.abs(c) - 0.009; P.hips.rotation.y = 0.07 * s; P.spine.rotation.y = -0.12 * s; P.spine.rotation.x = -0.02;
  P.neck.rotation.y = 0.05 * s;
}
export function carryPose(group) {
  const P = group.userData.pivots; _rz(group);
  P.shoulder_L.rotation.x = P.shoulder_R.rotation.x = -0.75; P.shoulder_L.rotation.z = -0.12; P.shoulder_R.rotation.z = 0.12;
  P.elbow_L.rotation.x = P.elbow_R.rotation.x = -0.75; P.spine.rotation.x = -0.06; P.neck.rotation.x = 0.12;
  P.knee_L.rotation.x = P.knee_R.rotation.x = 0.05;
}
export default build;
