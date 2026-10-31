// dsdTractorTrailer.js — blue cab-over day-cab tractor + 53 ft curtain-side trailer. Three.js r160.
// build(THREE, mats, opts) -> Group (front +z, origin floor centre of combined footprint).
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
// opts.detached: trailer only. Also exports buildTractor / buildTrailer.
const BLUE = 0x1f4fc8, DBLUE = 0x163a94, ALU = 0xbfc4ca, CHR = 0xdde1e5, DK = 0x1d1e21, GR = 0x4a4e54, BLK = 0x0f1012;
function _mats(THREE, mats, color) {
  if (mats.__gfTT) return mats.__gfTT;
  const atlas = _placardCanvas(THREE, '#ffffff', '#1f4fc8');
  const r = {
    gloss: _vcMat(THREE, 0.32, 0.14, atlas ? { map: atlas } : {}),
    matte: _vcMat(THREE, mats.black?.roughness ?? 0.82, 0.05),
    black: mats.black || _vcMat(THREE, 0.7, 0.1),
    glass: new THREE.MeshStandardMaterial({ color: 0x8fa6b8, roughness: 0.1, metalness: 0.2, emissive: 0x24384a, emissiveIntensity: 0.55, envMapIntensity: 1.6, transparent: true, opacity: 0.85 }),
    wheel: _vcMat(THREE, mats.rubber ? Math.min(mats.rubber.roughness, 0.7) : 0.62, 0.3),
    curtain: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.62, metalness: 0.0, side: THREE.DoubleSide }),
  };
  r.curtain.roughness = 0.74;
  if (typeof document !== 'undefined') {
    // tarp texture spans the whole curtain (u 0..1 = front..rear as seen from outside, v 0..1 = bottom..top)
    const CW = 4096, CH = 640, cv = document.createElement('canvas'); cv.width = CW; cv.height = CH; const x = cv.getContext('2d');
    x.fillStyle = '#' + new THREE.Color(color).getHexString(); x.fillRect(0, 0, CW, CH);
    const sag = x.createLinearGradient(0, 0, 0, CH); sag.addColorStop(0, 'rgba(0,0,0,0.18)'); sag.addColorStop(0.12, 'rgba(255,255,255,0.05)'); sag.addColorStop(0.6, 'rgba(0,0,0,0.0)'); sag.addColorStop(1, 'rgba(0,0,0,0.22)');
    x.fillStyle = sag; x.fillRect(0, 0, CW, CH);
    const pxm = CW / 15.88;
    for (let z = 0.3; z < 15.88; z += 0.6) {                     // soft strap lines every 0.6 m + buckles
      const X = z * pxm; x.fillStyle = 'rgba(0,0,0,0.28)'; x.fillRect(X - 3, 0, 6, CH);
      x.fillStyle = 'rgba(255,255,255,0.07)'; x.fillRect(X + 3, 0, 3, CH);
      x.fillStyle = '#1b1d22'; x.fillRect(X - 9, CH - 70, 18, 46); x.fillStyle = '#8d939b'; x.fillRect(X - 7, CH - 64, 14, 8);
    }
    for (let i = 0; i < 90; i++) { const X = (i * 7919) % CW, Y = (i * 104729) % CH; x.fillStyle = 'rgba(0,0,0,0.05)'; x.fillRect(X, Y, 60 + (i % 5) * 30, 3); }
    x.fillStyle = 'rgba(0,0,0,0.3)'; x.fillRect(0, 0, CW, 14); x.fillRect(0, CH - 18, CW, 18);
    if (atlas) { const pw = 4.6 * pxm, ph = 1.42 / 2.55 * CH, cy = (3.97 - 2.75) / 2.55 * CH;   // placard printed on the cloth (slides with it)
      x.drawImage(atlas.image, 0, 64, 1024, 448, CW / 2 - pw / 2, cy - ph / 2, pw, ph); }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; r.curtain.map = t;
  } else r.curtain.color.set(color);
  Object.defineProperty(mats, '__gfTT', { value: r, enumerable: false, configurable: true });
  return r;
}
function _wheel(THREE, M, nm, geo, s, pos, pivots, parent) {
  const p = new THREE.Object3D(); p.name = nm; p.position.set(...pos);
  const m = new THREE.Mesh(geo, M.wheel); m.castShadow = true; if (s < 0) m.rotation.y = Math.PI; p.add(m);
  parent.add(p); pivots[nm] = p; return p;
}
// Tractor: local origin = floor centre of its 6.5 m footprint; fifth-wheel at (0, 1.22, -1.65)
export function buildTractor(THREE, mats = {}, opts = {}) {
  const C = opts.color ?? BLUE, M = _mats(THREE, mats, C), K = _kit(THREE), { add, box, rbox, cylX, cylZ } = K;
  const T = new THREE.Group(); T.name = 'tractor'; const pivots = {};
  for (const s of [-1, 1]) add('m', box(0.1, 0.28, 6.1), DK, [s * 0.45, 0.82, -0.1]);
  for (let z = -3.0; z <= 2.8; z += 0.8) add('m', box(0.9, 0.1, 0.08), DK, [0, 0.84, z]);
  // cab-over cab (z 1.0 .. 3.25)
  add('g', rbox(2.48, 0.57, 2.2, 0.16), C, [0, 1.355, 2.13]);                    // cab floor tub (floor y 1.64)
  add('g', rbox(2.48, 0.8, 0.22, 0.08), C, [0, 1.98, 3.12]);                      // lower front wall
  for (const s of [-1, 1]) add('g', rbox(0.1, 0.8, 2.2, 0.04), C, [s * 1.19, 1.98, 2.13]); // lower side walls (doors)
  add('g', rbox(2.44, 0.1, 2.05, 0.05), C, [0, 3.79, 2.05]);                     // cab roof (hollow cab)
  add('g', rbox(2.44, 2.2, 0.1, 0.05), C, [0, 2.73, 1.08]);                     // cab back wall
  add('g', rbox(2.44, 0.36, 0.14, 0.06), C, [0, 2.45, 3.0]);                     // below windshield
  add('g', rbox(2.44, 0.2, 0.14, 0.06), C, [0, 3.66, 3.02]);                     // above windshield
  // interior: dash, seats, steering wheel (driver = +x)
  add('m', rbox(2.2, 0.28, 0.45, 0.06), 0x2a2c30, [0, 2.62, 2.8], [0.2, 0, 0]);
  add('m', rbox(0.5, 0.12, 0.12, 0.03), 0x15161a, [0.55, 2.7, 2.66], [0.3, 0, 0]);
  for (const x of [0.55, -0.55]) {
    add('m', rbox(0.5, 0.12, 0.5, 0.04), 0x1f2125, [x, 2.07, 1.58]);
    add('m', rbox(0.5, 0.76, 0.11, 0.04), 0x1f2125, [x, 2.5, 1.32], [-0.14, 0, 0]);
    add('m', rbox(0.28, 0.16, 0.08, 0.03), 0x1f2125, [x, 2.94, 1.26], [-0.14, 0, 0]);
    add('m', box(0.3, 0.38, 0.3), 0x333539, [x, 1.83, 1.58]);
  }
  add('m', new THREE.TorusGeometry(0.2, 0.017, 6, 20).rotateX(Math.PI / 2).rotateX(-0.6), 0x141518, [0.55, 2.574, 2.04]);
  add('m', cylZ(0.042, 0.07, 10).rotateX(0.98), 0x141518, [0.55, 2.574, 2.04]);
  add('m', cylZ(0.03, 0.6, 8).rotateX(0.98), 0x222327, [0.55, 2.32, 2.21]);
  for (const a of [Math.PI / 2, Math.PI * 7 / 6, -Math.PI / 6]) { const g = box(0.19, 0.02, 0.035); g.translate(0.095, 0, 0); g.rotateY(-a); g.rotateX(-0.6); add('m', g, 0x141518, [0.55, 2.574, 2.04]); }
  add('g', rbox(2.3, 0.3, 1.5, 0.15, 3), C, [0, 3.92, 1.82]);                    // roof fairing
  add('g', rbox(2.24, 0.26, 0.7, 0.13, 3), C, [0, 3.86, 2.68], [0.45, 0, 0]);     // chamfered fairing nose
  for (const s of [-1, 1]) {                                                       // cab sides framing the side windows
    add('g', rbox(0.14, 0.42, 2.0, 0.06, 3), C, [s * 1.18, 2.47, 2.03]);
    add('g', rbox(0.14, 0.34, 2.0, 0.06, 3), C, [s * 1.18, 3.6, 2.03]);
    add('g', rbox(0.14, 0.8, 0.56, 0.05, 3), C, [s * 1.18, 3.05, 1.35]);
  }
  add('m', rbox(2.36, 0.16, 0.22, 0.05), BLK, [0, 3.72, 3.08]);                   // sun visor
  add('m', rbox(2.24, 0.07, 0.07, 0.03), 0x2a2d32, [0, 3.53, 3.06]);              // windshield frame (open ring)
  add('m', rbox(2.24, 0.07, 0.07, 0.03), 0x2a2d32, [0, 2.62, 3.12]);
  add('x', box(2.0, 0.86, 0.03), 0, [0, 3.07, 3.11], [-0.06, 0, 0]);
  for (const s of [-1, 1]) {
    add('x', box(0.26, 0.84, 0.03), 0, [s * 1.12, 3.07, 3.02], [-0.06, s * 0.7, 0]);   // wraparound corner glass
    add('m', rbox(0.06, 0.95, 0.07, 0.025), BLK, [s * 1.01, 3.07, 3.1], [-0.06, 0, 0]); // A-pillar
    add('m', rbox(0.06, 0.95, 0.07, 0.025), BLK, [s * 1.215, 3.07, 2.9]);               // B-pillar
    add('g', cylZ(0.06, 0.05, 14), 0xf4f6fa, [s * 0.6, 0.9, 3.27]);                    // fog light
    add('m', new THREE.TorusGeometry(0.065, 0.015, 6, 14), 0x15171a, [s * 0.6, 0.9, 3.27]);
    add('m', rbox(0.05, 0.08, 0.6, 0.02), BLK, [s * 1.2, 1.0, 2.0]);                   // step treads
    add('m', rbox(0.05, 0.08, 0.6, 0.02), BLK, [s * 1.18, 0.62, 2.0]);
    add('g', rbox(0.06, 0.55, 1.25, 0.05, 3), C, [s * 1.2, 0.72, 0.3]);                // side skirt over tanks
    add('g', box(0.02, 0.04, 1.2), 0xd8dce2, [s * 1.235, 0.95, 0.3]);
  }
  add('m', rbox(2.2, 0.58, 0.06, 0.06), 0x15171a, [0, 1.62, 3.24]);               // grille
  for (let i = 0; i < 9; i++) add('g', rbox(1.96, 0.03, 0.04, 0.012), i % 2 ? 0x2a2d32 : 0x6b7078, [0, 1.38 + i * 0.058, 3.275]);
  add('m', rbox(0.9, 0.18, 0.06, 0.05), BLK, [0, 2.1, 3.24]);
  add('g', rbox(2.5, 0.42, 0.3, 0.1), C, [0, 0.98, 3.1]);                         // bumper
  add('m', box(2.1, 0.12, 0.05), BLK, [0, 0.85, 3.26]);
  for (const s of [-1, 1]) {
    add('g', box(0.9, 0.025, 0.02), 0xf4f8ff, [s * 0.62, 1.33, 3.27]);            // LED strip
    add('g', box(0.025, 0.3, 0.02), 0xf4f8ff, [s * 1.07, 1.18, 3.27]);
    add('m', rbox(0.28, 0.2, 0.06, 0.04), 0x15171a, [s * 0.9, 1.0, 3.25]);
    add('g', rbox(0.22, 0.12, 0.03, 0.03), 0xeef3fb, [s * 0.9, 1.0, 3.28]);       // headlamp
    add('x', box(0.03, 0.75, 1.2), 0, [s * 1.225, 3.05, 2.25]);                   // side windows
    add('m', box(0.03, 0.05, 1.25), BLK, [s * 1.23, 2.66, 2.25]);
    add('g', box(0.02, 1.2, 0.02), 0x14347f, [s * 1.245, 2.35, 1.6]);             // door shut line
    add('g', rbox(0.04, 0.05, 0.18, 0.02), CHR, [s * 1.25, 2.55, 1.75]);
    add('m', cylX(0.02, 0.3, 6), BLK, [s * 1.36, 3.1, 3.0]);                      // mirror arm
    add('m', rbox(0.1, 0.42, 0.2, 0.04), BLK, [s * 1.5, 3.0, 2.95]);
    add('m', rbox(0.16, 0.5, 1.0, 0.05), DK, [s * 1.12, 0.62, 2.2]);              // steps
    add('g', box(0.02, 0.03, 0.9), 0xc0c4c9, [s * 1.2, 0.85, 2.2]);
    add('m', new THREE.TorusGeometry(0.6, 0.06, 6, 18, Math.PI).rotateY(Math.PI / 2), DK, [s * 1.0, 0.52, 1.95]);
    add('g', cylZ(0.32, 1.1, 22), ALU, [s * 0.86, 0.72, 0.3]);                    // fuel / battery
    add('m', box(0.06, 0.66, 1.0), DK, [s * 1.12, 0.72, 0.3]);
    for (const z of [-1.0, -2.3]) add('m', new THREE.CylinderGeometry(0.62, 0.62, 0.62, 16, 1, true, 0, Math.PI).rotateZ(Math.PI / 2).rotateX(Math.PI / 2), BLK, [s * 0.86, 0.55, z], [0, 0, 0], [1, 1, 1]);
    add('m', box(0.55, 0.5, 0.02), BLK, [s * 0.86, 0.45, -3.0]);                  // mudflap
    add('g', rbox(0.1, 0.12, 0.04, 0.02), 0xd31020, [s * 0.75, 0.85, -3.15]);
  }
  add('m', box(2.3, 0.08, 0.3), DK, [0, 0.78, -3.1]);
  add('m', box(2.0, 1.2, 0.25), DK, [0, 2.4, 0.95]);                              // cab back / fairing support
  add('m', box(1.2, 0.05, 0.9), 0x2e3136, [0, 1.0, 0.3]);                          // deck plate
  add('m', new THREE.CylinderGeometry(0.45, 0.45, 0.06, 20), 0x2e3136, [0, 1.2, -1.65]);  // fifth wheel
  add('m', box(0.8, 0.22, 0.6), DK, [0, 1.06, -1.65]);
  for (const s of [-1, 1]) add('m', box(0.3, 0.05, 0.12), 0xd8b020, [s * 0.32, 1.235, -1.85]);
  add('m', box(0.5, 0.3, 2.2), DK, [0, 0.55, -1.65]);
  for (const [k, m] of [['g', M.gloss], ['m', M.matte], ['x', M.glass]]) { const ms = K.mesh(k, m, 'tractor_' + k); if (ms) T.add(ms); }
  const fw = _wheelGeo(THREE, 0.52, 0.32, false), dw = _wheelGeo(THREE, 0.52, 0.28, true);
  for (const [s, L] of [[1, 'L'], [-1, 'R']]) {
    const st = new THREE.Object3D(); st.name = 'steer_' + L; st.position.set(s * 1.0, 0.52, 1.95); T.add(st); pivots['steer_' + L] = st;
    _wheel(THREE, M, 'wheel_F' + L, fw, s, [0, 0, 0], pivots, st);
    _wheel(THREE, M, 'wheel_D1' + L, dw, s, [s * 0.86, 0.52, -1.0], pivots, T);
    _wheel(THREE, M, 'wheel_D2' + L, dw, s, [s * 0.86, 0.52, -2.3], pivots, T);
  }
  const seat = new THREE.Object3D(); seat.name = 'seat'; seat.position.set(0.55, 2.2, 1.55); T.add(seat); pivots.seat = seat; seat.updateMatrix();
  let dc = 0; T.traverse((o) => { if (o.isMesh) dc++; });
  T.userData = { name: 'tractor', dims: { w: 2.5, h: 4.06, d: 6.5 }, pivots, drawCalls: dc, fifthWheel: new THREE.Vector3(0, 1.22, -1.65),
    seatPoint: { position: seat.position.clone(), quaternion: seat.quaternion.clone(), facing: new THREE.Vector3(0, 0, 1), matrix: seat.matrix.clone(), object: seat } };
  return T;
}
// Trailer: local origin = floor centre of 16.2 m footprint; kingpin at (0, 1.22, 7.2)
export function buildTrailer(THREE, mats = {}, opts = {}) {
  const C = opts.color ?? BLUE, M = _mats(THREE, mats, C), K = _kit(THREE), { add, box, rbox, cylX, cylZ } = K;
  const R = new THREE.Group(); R.name = 'trailer'; const pivots = {};
  const L = 16.2, Z1 = L / 2, Z0 = -L / 2, W = 2.6, Y0 = 1.25, Y1 = 4.1;
  add('m', box(W - 0.04, 0.12, L - 0.1), DK, [0, Y0 - 0.02, 0]);
  add('m', box(W - 0.12, 0.03, L - 0.3), 0x8b6a45, [0, Y0 + 0.06, 0]);           // wood floor
  for (const s of [-1, 1]) {
    add('g', rbox(0.08, 0.24, L, 0.03), DBLUE, [s * (W / 2 - 0.02), Y0 + 0.08, 0]);      // bottom rail
    add('g', rbox(0.09, 0.18, L, 0.03), C, [s * (W / 2 - 0.02), Y1 - 0.09, 0]);          // top rail
    for (let z = Z0 + 0.8; z < Z1 - 0.3; z += 1.2) add('g', box(0.012, 0.03, 0.08), 0xff9a1a, [s * (W / 2 + 0.03), Y0 + 0.1, z]); // markers
    add('m', box(0.03, 0.62, 8.6), 0x2c3036, [s * 1.22, 0.8, 0.45]);             // side skirt / cabinets
    add('m', box(0.06, 0.06, 8.6), DK, [s * 1.2, 1.12, 0.45]);
    add('g', rbox(0.18, Y1 - Y0, 0.16, 0.03), DBLUE, [s * (W / 2 - 0.07), (Y0 + Y1) / 2, Z0 + 0.06]);  // rear posts
    add('g', rbox(0.1, Y1 - Y0, 0.12, 0.03), C, [s * (W / 2 - 0.03), (Y0 + Y1) / 2, Z1 - 0.06]);
    add('g', rbox(0.16, 0.12, 0.05, 0.02), 0xd31020, [s * 0.95, 1.0, Z0 - 0.08]);
    add('g', rbox(0.12, 0.12, 0.05, 0.02), 0xff9a1a, [s * 0.72, 1.0, Z0 - 0.08]);
    add('m', box(0.6, 0.55, 0.02), BLK, [s * 0.86, 0.42, -8.0]);
    add('m', box(0.08, 0.5, 0.08), DK, [s * 0.6, 0.85, Z0 + 0.05]);
  }
  add('g', rbox(W, 0.06, L, 0.02), 0xc9d3e6, [0, Y1 - 0.02, 0]);                 // roof
  for (const s of [-1, 1]) for (const z of [4.2, 0.6, -3.0, -6.0]) add('g', rbox(0.07, Y1 - Y0 - 0.2, 0.11, 0.02), DBLUE, [s * (W / 2 - 0.07), (Y0 + Y1) / 2, z]); // side posts
  add('g', rbox(W, Y1 - Y0, 0.08, 0.04), C, [0, (Y0 + Y1) / 2, Z1 - 0.04]);       // front wall
  add('m', box(W - 0.2, Y1 - Y0 - 0.2, 0.02), 0xcfd2d6, [0, (Y0 + Y1) / 2, Z1 - 0.1]);
  add('m', rbox(0.4, 0.3, 0.08, 0.04), DK, [0, 3.4, Z1 + 0.02]);                  // reefer-less front box
  add('g', rbox(W - 0.1, 0.3, 0.16, 0.04), DBLUE, [0, Y1 - 0.15, Z0 + 0.06]);    // rear header
  add('g', rbox(W - 0.1, 0.2, 0.18, 0.04), 0x3a3e44, [0, Y0 + 0.02, Z0 + 0.06]);
  add('m', box(2.4, 0.16, 0.16), 0x2a2d31, [0, 0.62, Z0 - 0.04]);                 // ICC bumper
  add('g', box(2.36, 0.04, 0.012), 0xffffff, [0, 0.62, Z0 - 0.125]);
  for (let z = Z0 + 0.4; z < Z1; z += 0.5) add('m', box(2.2, 0.12, 0.07), DK, [0, Y0 - 0.14, z]);
  for (const s of [-1, 1]) add('m', box(0.12, 0.42, L - 1.2), DK, [s * 0.5, Y0 - 0.3, -0.4]);   // main beams
  add('m', box(1.4, 0.05, 1.4), 0x2e3136, [0, 1.2, 7.2]);                         // upper coupler
  add('m', new THREE.CylinderGeometry(0.045, 0.045, 0.1, 10), CHR, [0, 1.15, 7.2]); // kingpin
  add('m', box(1.3, 0.25, 3.9), DK, [0, 0.82, -6.3]);                             // slider
  for (const z of [-5.05, -6.3, -7.55]) add('m', cylX(0.07, 2.0, 10), GR, [0, 0.52, z]);
  for (const [k, m] of [['g', M.gloss], ['m', M.matte]]) { const ms = K.mesh(k, m, 'trailer_' + k); if (ms) R.add(ms); }
  // curtains: pleated cloth hung from the top rail. Pleats keep their width; opening compresses their spacing
  // toward the front post (accordion), so the printed placard travels with the cloth. Pivot at front corner, local +x rearward.
  for (const [nm, s] of [['curtain_L', 1], ['curtain_R', -1]]) {
    const p = new THREE.Object3D(); p.name = nm; p.position.set(s * (W / 2 + 0.03), 0, Z1 - 0.13); p.rotation.y = Math.PI / 2; R.add(p); pivots[nm] = p;
    const m = new THREE.Mesh(_curtainGeo(THREE, L - 0.32, Y0 + 0.17, Y1 - 0.13, s), M.curtain); m.name = nm + '_mesh'; m.castShadow = true; p.add(m);
    p.userData = { mode: 'pleat-slide', f: 0 }; _curtainSet(m, 0);
  }
  // rear swing doors: hinge at outer rear corner. L opens rotation.y -> -2.6 ; R -> +2.6
  for (const [nm, s] of [['rearDoor_L', 1], ['rearDoor_R', -1]]) {
    const p = new THREE.Object3D(); p.name = nm; p.position.set(s * (W / 2 - 0.02), 0, Z0 - 0.03); R.add(p); pivots[nm] = p;
    const dw = W / 2 - 0.04;
    add('d', rbox(dw, Y1 - Y0 - 0.32, 0.05, 0.03), C, [-s * dw / 2, (Y0 + Y1) / 2, 0]);
    add('d', box(dw - 0.05, 0.03, 0.06), DBLUE, [-s * dw / 2, Y0 + 0.9, 0]);
    add('d', box(dw - 0.05, 0.03, 0.06), DBLUE, [-s * dw / 2, Y1 - 0.9, 0]);
    for (const f of [0.3, 0.75]) {
      add('d', new THREE.CylinderGeometry(0.018, 0.018, Y1 - Y0 - 0.2, 6), CHR, [-s * dw * f, (Y0 + Y1) / 2, -0.05]);
      add('d', box(0.05, 0.05, 0.05), DK, [-s * dw * f, Y0 + 0.3, -0.06]);
      add('d', box(0.05, 0.05, 0.05), DK, [-s * dw * f, Y1 - 0.3, -0.06]);
    }
    add('d', box(0.03, 0.26, 0.03), CHR, [-s * dw * 0.75, 2.0, -0.09]);
    for (const y of [1.6, 2.6, 3.6]) add('d', box(0.08, 0.1, 0.06), DK, [-s * 0.03, y, 0]);
    p.add(K.mesh('d', M.gloss, nm + '_mesh'));
  }
  // landing gear: inner legs telescope (translate y 0 = down .. 0.26 = cranked up; setLandingGear)
  {
    const p = new THREE.Object3D(); p.name = 'landingGear'; p.position.set(0, Y0 - 0.15, 5.6); R.add(p); pivots.landingGear = p;
    for (const s of [-1, 1]) {
      add('l', box(0.14, 0.55, 0.14), DK, [s * 0.7, -0.27, 0]);
      add('li', box(0.1, 0.55, 0.1), GR, [s * 0.7, -0.75, 0]);
      add('li', box(0.3, 0.05, 0.3), DK, [s * 0.7, -1.06, 0]);
      add('l', box(0.06, 0.7, 0.06), DK, [s * 0.35, -0.3, 0.3], [0, 0, s * 0.6]);
    }
    add('l', cylX(0.025, 1.4, 6), GR, [0, -0.35, 0]);
    add('l', box(0.08, 0.08, 0.08), DK, [1.0, -0.4, 0]);
    p.add(K.mesh('l', M.black, 'landingGear_mesh'));
    const inner = new THREE.Object3D(); inner.name = 'landingGear_inner'; inner.add(K.mesh('li', M.black, 'landingGear_inner_mesh')); p.add(inner); pivots.landingGear_inner = inner;
  }
  const tw = _wheelGeo(THREE, 0.52, 0.28, true);
  for (const [s, Lr] of [[1, 'L'], [-1, 'R']]) {
    _wheel(THREE, M, 'wheel_T1' + Lr, tw, s, [s * 0.86, 0.52, -5.05], pivots, R);
    _wheel(THREE, M, 'wheel_T2' + Lr, tw, s, [s * 0.86, 0.52, -6.3], pivots, R);
    _wheel(THREE, M, 'wheel_T3' + Lr, tw, s, [s * 0.86, 0.52, -7.55], pivots, R);
  }
  const hitch = new THREE.Object3D(); hitch.name = 'kingpin'; hitch.position.set(0, 1.22, 7.2); R.add(hitch); pivots.kingpin = hitch;
  let dc = 0; R.traverse((o) => { if (o.isMesh) dc++; });
  R.userData = { name: 'trailer', dims: { w: W, h: Y1, d: L }, pivots, drawCalls: dc };
  return R;
}
export function build(THREE, mats = {}, opts = {}) {
  if (opts.detached) { const t = buildTrailer(THREE, mats, opts); t.userData.name = 'dsdTrailerDetached'; return t; }
  const G = new THREE.Group(); G.name = 'dsdTractorTrailer';
  const tr = buildTractor(THREE, mats, opts), tl = buildTrailer(THREE, mats, opts);
  const TZ = 10.1 - 3.25; tr.position.z = TZ; G.add(tr);
  const hitch = new THREE.Object3D(); hitch.name = 'hitch'; hitch.position.set(0, 1.22, TZ - 1.65); G.add(hitch);
  tl.position.set(0, -1.22, -7.2); hitch.add(tl);
  setLandingGear(tl, 1);                                                              // cranked up when coupled
  const pivots = Object.assign({}, tr.userData.pivots, tl.userData.pivots, { hitch });
  const sp = tr.userData.seatPoint, sm = new THREE.Matrix4().makeTranslation(0, 0, TZ).multiply(sp.matrix);
  G.userData = { name: 'dsdTractorTrailer', dims: { w: 2.6, h: 4.1, d: 20.2 }, pivots, parts: { tractor: tr, trailer: tl, hitch },
    seatPoint: { position: sp.position.clone().add(new THREE.Vector3(0, 0, TZ)), quaternion: sp.quaternion.clone(), facing: sp.facing.clone(), matrix: sm, object: sp.object, tractorLocal: sp },
    drawCalls: tr.userData.drawCalls + tl.userData.drawCalls,
    notes: 'hitch.rotation.y articulates trailer about kingpin; steer_* rotation.y; wheel_* rotation.x; rearDoor_L open rot.y<0 / R >0; curtain_* pleated cloth: setCurtain bunches pleats toward front (no scale; placard printed on cloth slides with it); landingGear_inner translates y (setLandingGear); seat Object3D = driver hip point (seatPoint)' };
  return G;
}
// f: 0 closed .. 1 open (pleats bunch toward the front post; each pleat keeps its width, nothing scales)
export function setCurtain(group, side, f) { const p = group.userData.pivots['curtain_' + side]; p.userData.f = f; _curtainSet(p.children[0], f); }
// f: 0 down .. 1 cranked up (inner legs slide up inside the outer legs)
export function setLandingGear(group, f) { group.userData.pivots.landingGear_inner.position.y = 0.26 * f; }
const PLEAT = 0.1, PMIN = 0.0165, ROWS = 6;
function _curtainGeo(THREE, len, y0, y1, s) {
  const N = Math.round(len / PLEAT), g = new THREE.BufferGeometry(), pos = new Float32Array((N + 1) * (ROWS + 1) * 3), uv = new Float32Array((N + 1) * (ROWS + 1) * 2), idx = [];
  for (let k = 0; k <= N; k++) for (let r = 0; r <= ROWS; r++) { const i = k * (ROWS + 1) + r; uv[i * 2] = s > 0 ? k / N : 1 - k / N; uv[i * 2 + 1] = r / ROWS; }
  for (let k = 0; k < N; k++) for (let r = 0; r < ROWS; r++) { const a = k * (ROWS + 1) + r, b = a + ROWS + 1;
    if (s > 0) idx.push(a, b, a + 1, b, b + 1, a + 1); else idx.push(a, a + 1, b, b, a + 1, b + 1); }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
  g.userData = { N, len, w: len / N, y0, y1, s }; return g;
}
function _curtainSet(mesh, f) {
  const g = mesh.geometry, { N, w, y0, y1, s } = g.userData, P = g.attributes.position.array; f = Math.max(0, Math.min(1, f));
  const p = w * 0.985 - f * (w * 0.985 - PMIN), d = Math.sqrt(Math.max(0, w * w - p * p));
  for (let k = 0; k <= N; k++) for (let r = 0; r <= ROWS; r++) {
    const i = (k * (ROWS + 1) + r) * 3, v = r / ROWS, bow = Math.sin(Math.PI * v) * 0.014 * (1 - f);
    P[i] = k * p; P[i + 1] = y0 + (y1 - y0) * v; P[i + 2] = s * ((k % 2 ? d / 2 : -d / 2) + bow);
  }
  g.attributes.position.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingSphere(); g.computeBoundingBox();
}
export default build;
