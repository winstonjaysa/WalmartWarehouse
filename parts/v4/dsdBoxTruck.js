// dsdBoxTruck.js — red Class 6/7 straight box truck (DSD beverage delivery). Three.js r160.
// build(THREE, mats, opts) -> Group. Units m, y-up, origin floor centre, front = +z.
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
  const RED = opts.color ?? 0xc8102e, ALU = 0xbfc4ca, CHR = 0xdde1e5, DK = 0x1d1e21, GR = 0x55595f, BLK = 0x0f1012;
  const K = _kit(THREE), { add, box, rbox, cylX, cylZ } = K;
  const atlas = _placardCanvas(THREE, '#ffffff', '#c8102e');
  const gloss = _vcMat(THREE, 0.34, 0.12, atlas ? { map: atlas } : {});
  const matte = _vcMat(THREE, mats.black?.roughness ?? 0.82, 0.05);
  if (mats.metal?.envMap) gloss.envMap = mats.metal.envMap;
  const glass = new THREE.MeshStandardMaterial({ color: 0x8fa6b8, roughness: 0.1, metalness: 0.2, emissive: 0x24384a, emissiveIntensity: 0.55, envMapIntensity: 1.6, transparent: true, opacity: 0.85 });
  const G = new THREE.Group(); G.name = 'dsdBoxTruck';
  const pivots = {};
  // ---------- chassis ----------
  for (const s of [-1, 1]) add('m', box(0.09, 0.26, 7.9), DK, [s * 0.46, 0.78, 0.05]);
  for (let z = -3.9; z <= 3.9; z += 0.9) add('m', box(0.92, 0.1, 0.08), DK, [0, 0.8, z]);
  // ---------- cab: hood, fenders, grille, bumper, lights ----------
  add('g', rbox(1.86, 0.6, 1.3, 0.2, 3), RED, [0, 1.34, 3.62], [0.13, 0, 0]);                 // sloped hood
  add('g', rbox(1.7, 0.2, 0.9, 0.09, 3), RED, [0, 1.62, 3.4], [0.13, 0, 0]);                   // hood crown
  for (const s of [-1, 1]) {
    add('g', rbox(0.34, 0.5, 1.45, 0.14), RED, [s * 1.0, 1.28, 3.42], [0.05, 0, 0]);
    add('m', new THREE.TorusGeometry(0.56, 0.05, 6, 18, Math.PI).rotateY(Math.PI / 2), DK, [s * 1.0, 0.5, 3.25]); // wheel arch liner
    add('g', rbox(0.42, 0.17, 0.1, 0.06), CHR, [s * 0.68, 1.1, 4.22]);           // headlight bezel
    add('g', rbox(0.36, 0.12, 0.06, 0.05), 0xf3f6fb, [s * 0.68, 1.1, 4.27]);     // lens
    add('g', box(0.1, 0.06, 0.04), 0xff9a1a, [s * 0.98, 1.1, 4.12]);            // amber corner
    add('g', rbox(0.3, 0.06, 0.12, 0.03), CHR, [s * 0.55, 1.62, 3.85], [0.1, s * 0.3, 0]); // hood vent
  }
  add('g', rbox(2.36, 0.34, 0.3, 0.08), RED, [0, 0.58, 4.1]);                  // bumper (red, ref)
  add('m', box(1.0, 0.08, 0.04), BLK, [0, 0.55, 4.26]);                         // bumper slot
  add('g', rbox(0.92, 0.62, 0.08, 0.05), CHR, [0, 1.2, 4.27]);                  // grille surround
  add('m', box(0.8, 0.5, 0.04), BLK, [0, 1.2, 4.3]);
  for (let i = 0; i < 7; i++) add('g', box(0.8, 0.025, 0.03), CHR, [0, 1.0 + i * 0.066, 4.32]);
  add('g', rbox(0.18, 0.05, 0.02, 0.02), CHR, [0, 1.56, 4.31]);                // badge (blank)
  // cabin shell
  // hollow cab shell (doors form the sides) so the driver reads through the glass
  add('g', rbox(2.3, 0.8, 0.14, 0.06, 3), RED, [0, 1.58, 3.04]);                             // firewall / lower front
  add('g', rbox(2.3, 1.56, 0.12, 0.06, 3), RED, [0, 1.96, 1.75]);                            // cab back wall
  add('g', rbox(2.28, 0.1, 1.26, 0.05, 3), RED, [0, 2.71, 2.32]);                            // cab roof
  add('m', box(2.2, 0.05, 1.3), 0x26282c, [0, 1.245, 2.4]);                                  // cab floor
  add('m', rbox(2.16, 0.22, 0.4, 0.06), 0x2a2c30, [0, 2.04, 2.86], [0.25, 0, 0]);            // dashboard
  add('m', rbox(0.5, 0.12, 0.12, 0.03), 0x15161a, [0.5, 2.17, 2.72], [0.3, 0, 0]);            // gauge pod
  for (const [x, drv] of [[0.5, 1], [-0.5, 0]]) {                                            // seats (driver LHD = +x)
    add('m', rbox(0.48, 0.12, 0.48, 0.04), 0x1f2125, [x, 1.715, 2.1]);
    add('m', rbox(0.48, 0.72, 0.11, 0.04), 0x1f2125, [x, 2.13, 1.86], [-0.14, 0, 0]);
    add('m', rbox(0.28, 0.16, 0.08, 0.03), 0x1f2125, [x, 2.57, 1.8], [-0.14, 0, 0]);          // headrest
    add('m', box(0.3, 0.4, 0.3), 0x333539, [x, 1.46, 2.1]);                                   // pedestal
  }
  { // steering wheel + column, centred on driver's hands (seat + (0, 0.374, 0.49))
    const W = new THREE.TorusGeometry(0.2, 0.017, 6, 20).rotateX(Math.PI / 2).rotateX(-0.6);
    add('m', W, 0x141518, [0.5, 2.19, 2.57]);
    add('m', cylZ(0.042, 0.07, 10).rotateX(0.98), 0x141518, [0.5, 2.19, 2.57]);            // hub
    add('m', cylZ(0.03, 0.5, 8).rotateX(0.98), 0x222327, [0.5, 1.98, 2.71]);              // column
    for (const a of [Math.PI / 2, Math.PI * 7 / 6, -Math.PI / 6]) { const g = box(0.19, 0.02, 0.035); g.translate(0.095, 0, 0); g.rotateY(-a); g.rotateX(-0.6); add('m', g, 0x141518, [0.5, 2.19, 2.57]); } // spokes in wheel plane
  }
  add('g', rbox(2.24, 0.12, 1.36, 0.06), RED, [0, 2.8, 2.38]);                 // roof cap
  for (const x of [-0.5, 0, 0.5]) add('g', box(0.1, 0.05, 0.06), 0xffa020, [x, 2.88, 3.0]);
  add('m', box(2.31, 0.08, 1.43), DK, [0, 1.17, 2.4]);                          // rocker
  // windshield frame + glass
  { const th = -0.26, c = Math.cos(th), sn = Math.sin(th), at = (dy) => [2.31 + dy * c, 3.0 + dy * sn];   // raked A-frame as an open ring
    for (const dy of [-0.42, 0.42]) { const [y, z] = at(dy); add('g', rbox(2.22, 0.1, 0.2, 0.04), RED, [0, y, z], [th, 0, 0]); }
    for (const sx of [-1, 1]) add('g', rbox(0.13, 0.94, 0.2, 0.04), RED, [sx * 1.045, 2.31, 3.0], [th, 0, 0]); }
  add('x', box(1.98, 0.74, 0.03), 0, [0, 2.31, 3.065], [-0.26, 0, 0]);
  add('x', box(2.0, 0.55, 0.03), 0, [0, 2.32, 1.68]);                          // back window
  for (const s of [-1, 1]) {
    // west-coast mirror on cab + convex hood mirror
    add('g', cylZ(0.015, 0.35, 6), CHR, [s * 1.3, 2.1, 3.05]);
    add('g', cylX(0.015, 0.18, 6), CHR, [s * 1.22, 2.55, 3.05]);
    add('g', cylX(0.015, 0.18, 6), CHR, [s * 1.22, 1.75, 3.05]);
    add('g', new THREE.CylinderGeometry(0.015, 0.015, 0.8, 6), CHR, [s * 1.31, 2.15, 3.05]);
    add('m', rbox(0.06, 0.42, 0.2, 0.03), BLK, [s * 1.34, 2.2, 3.05]);
    add('g', new THREE.CylinderGeometry(0.008, 0.008, 0.62, 5), CHR, [s * 1.0, 1.95, 4.0], [0, 0, s * 0.25]);
    add('g', new THREE.SphereGeometry(0.075, 12, 8), CHR, [s * 1.1, 2.25, 4.0], [0, 0, 0], [0.5, 1, 1]);
    // grab handle, steps, fuel tank / battery box
    add('g', new THREE.CylinderGeometry(0.014, 0.014, 0.9, 6), CHR, [s * 1.17, 2.0, 1.72]);
    add('m', box(0.42, 0.04, 0.55), BLK, [s * 1.02, 0.42, 2.3]);
    add('m', box(0.06, 0.5, 0.55), DK, [s * 1.2, 0.62, 2.3]);
  }
  add('g', cylZ(0.3, 0.95, 20), CHR, [0.86, 0.68, 1.15]);                       // fuel tank (left)
  for (const z of [0.78, 1.52]) add('m', new THREE.TorusGeometry(0.305, 0.015, 4, 20), BLK, [0.86, 0.68, z]);
  add('m', box(0.5, 0.5, 0.8), DK, [-0.84, 0.7, 1.15]);                         // battery box (right)
  add('g', box(0.52, 0.04, 0.82), CHR, [-0.84, 0.96, 1.15]);
  // ---------- box body (hollow shell so rear door reveals interior) ----------
  const BZ0 = -4.2, BZ1 = 1.6, BL = BZ1 - BZ0, BC = (BZ0 + BZ1) / 2, Y0 = 1.15, Y1 = 3.6, BW = 2.5;
  for (const s of [-1, 1]) {
    add('g', box(0.035, Y1 - Y0 - 0.2, BL - 0.1), RED, [s * (BW / 2 - 0.02), (Y0 + Y1) / 2 + 0.02, BC]);
    add('m', box(0.02, Y1 - Y0 - 0.3, BL - 0.2), 0xd9d6cf, [s * (BW / 2 - 0.06), (Y0 + Y1) / 2, BC]);  // liner
    add('g', rbox(0.1, 0.1, BL, 0.03), ALU, [s * BW / 2, Y1 - 0.05, BC]);         // top rail
    add('g', rbox(0.08, 0.26, BL, 0.03), ALU, [s * (BW / 2 + 0.005), Y0 + 0.05, BC]); // bottom rail
    add('g', rbox(0.1, Y1 - Y0, 0.12, 0.03), ALU, [s * BW / 2, (Y0 + Y1) / 2, BZ1]);  // front post
    add('g', rbox(0.16, Y1 - Y0, 0.14, 0.03), ALU, [s * (BW / 2 - 0.05), (Y0 + Y1) / 2, BZ0]); // rear post
    for (let i = 0; i < 24; i++) add('g', box(0.012, 0.05, 0.12), i % 2 ? 0xffffff : 0xd0102a, [s * (BW / 2 + 0.05), Y0 + 0.12, BZ0 + 0.3 + i * 0.22]); // conspicuity tape
    for (let z = BZ0 + 0.6; z < BZ1; z += 0.6) add('g', box(0.012, Y1 - Y0 - 0.32, 0.03), 0xb50e29, [s * (BW / 2 + 0.002), (Y0 + Y1) / 2 + 0.02, z]); // logistic seams
    // placard (texture atlas region)
    add('g', _placardGeo(THREE, 2.9, 1.27).rotateY(s * Math.PI / 2), 0xffffff, [s * (BW / 2 + 0.012), 2.5, BC - 0.4], [0, 0, 0], [1, 1, 1], true);
    // tail lights + rear markers
    add('g', rbox(0.1, 0.24, 0.05, 0.02), 0xd31020, [s * 1.12, 1.4, BZ0 - 0.08]);
    add('g', rbox(0.1, 0.1, 0.05, 0.02), 0xff9a1a, [s * 1.12, 1.66, BZ0 - 0.08]);
    add('g', box(0.06, 0.05, 0.03), 0xd31020, [s * 0.9, Y1 - 0.06, BZ0 - 0.08]);
    // mudflaps
    add('m', box(0.5, 0.55, 0.02), BLK, [s * 0.88, 0.42, -3.15]);
  }
  add('g', box(BW - 0.04, 0.04, BL), 0xe9eaec, [0, Y1 - 0.02, BC]);             // roof (white translucent-look)
  add('g', rbox(BW, 0.08, 0.08, 0.03), ALU, [0, Y1 - 0.04, BZ1]);
  add('g', box(BW - 0.05, Y1 - Y0, 0.04), RED, [0, (Y0 + Y1) / 2, BZ1 - 0.02]);
  add('m', box(BW - 0.1, 0.06, BL), 0x8b6a45, [0, Y0 + 0.03, BC]);              // wood floor
  add('m', box(BW - 0.06, 0.1, BL), DK, [0, Y0 - 0.04, BC]);
  add('g', rbox(BW - 0.1, 0.3, 0.14, 0.03), ALU, [0, Y1 - 0.15, BZ0]);          // rear header
  add('g', rbox(BW - 0.1, 0.12, 0.16, 0.03), ALU, [0, Y0 + 0.02, BZ0]);         // rear sill
  for (let z = BZ0 + 0.3; z < BZ1; z += 0.45) add('m', box(2.3, 0.1, 0.07), DK, [0, Y0 - 0.12, z]); // crossmembers
  // rear bumper / underride + folded liftgate (ref)
  add('m', box(2.3, 0.16, 0.14), DK, [0, 0.62, BZ0 - 0.12]);
  for (const s of [-1, 1]) add('m', box(0.08, 0.45, 0.08), DK, [s * 0.8, 0.86, BZ0 - 0.06]);
  add('g', box(2.2, 0.06, 0.55), ALU, [0, 0.8, BZ0 + 0.25]);
  for (const s of [-1, 1]) add('g', rbox(0.08, 0.08, 0.7, 0.02), ALU, [s * 1.1, 0.9, BZ0 + 0.05], [0.5, 0, 0]);
  add('m', box(0.06, 0.06, 1.2), GR, [0, 0.62, -0.6]);                           // driveshaft
  add('m', box(0.5, 0.3, 0.3), DK, [0, 0.55, -2.5]);                             // diff
  add('m', box(0.6, 0.4, 0.8), DK, [0, 0.75, 3.1]);                              // engine sump
  // ---------- static meshes (3 calls) ----------
  const _static = () => { for (const [k, m] of [['g', gloss], ['m', matte], ['x', glass]]) { const ms = K.mesh(k, m, 'body_' + k); if (ms) G.add(ms); } };
  // ---------- cab doors (pivot at front hinge, rotation.y: L negative / R positive opens) ----------
  for (const [nm, s] of [['cabDoor_L', 1], ['cabDoor_R', -1]]) {
    const p = new THREE.Object3D(); p.name = nm; p.position.set(s * 1.16, 0, 3.08); G.add(p); pivots[nm] = p;
    add('d', rbox(0.06, 0.9, 1.26, 0.05), RED, [s * 0.02, 1.62, -0.65]);
    add('d', rbox(0.06, 0.07, 1.26, 0.03), RED, [s * 0.02, 2.69, -0.65]);        // window frame top
    add('d', rbox(0.06, 0.62, 0.07, 0.03), RED, [s * 0.02, 2.4, -0.04]);
    add('d', rbox(0.06, 0.62, 0.2, 0.03), RED, [s * 0.02, 2.4, -1.2]);
    add('dg', box(0.02, 0.6, 1.02), 0, [s * 0.02, 2.38, -0.6]);                  // door glass
    add('d', box(0.07, 0.04, 1.0), BLK, [s * 0.026, 2.08, -0.62]);
    add('d', rbox(0.04, 0.05, 0.16, 0.02), CHR, [s * 0.06, 1.85, -1.05]);
    add('d', box(0.066, 0.025, 1.24), 0x9c0c24, [s * 0.02, 1.25, -0.65]);
    p.add(K.mesh('d', gloss, nm + '_mesh')); p.add(K.mesh('dg', glass, nm + '_glass'));
  }
  // ---------- rear door: 3-section roll-up running in side tracks; sections TRANSLATE up and bend onto the roof track (no scale) ----------
  {
    const yt = Y1 - 0.3, z0 = BZ0 + 0.06, H = yt - (Y0 + 0.08), h = H / 3;
    const p = new THREE.Object3D(); p.name = 'rearDoor'; p.position.set(0, yt, z0); G.add(p); pivots.rearDoor = p;
    for (let k = 0; k < 3; k++) {
      for (let i = 0; i < 3; i++) {
        add('r', box(2.24, h / 3 - 0.012, 0.03), 0xeef0f2, [0, h / 2 - h / 3 * (i + 0.5), 0]);
        add('r', box(2.24, 0.016, 0.04), 0xaeb3b9, [0, h / 2 - h / 3 * (i + 1) + 0.006, 0]);
      }
      for (const sx of [-1, 1]) add('r', box(0.04, h - 0.02, 0.05), 0x9aa0a6, [sx * 1.1, 0, -0.01]);   // edge rollers/hinge strip
      if (k === 2) { add('r', box(0.32, 0.06, 0.06), 0x2b2d31, [0, -h / 2 + 0.25, -0.03]); add('r', box(2.24, 0.06, 0.05), 0x2b2d31, [0, -h / 2 + 0.03, 0]); }
      const sec = new THREE.Object3D(); sec.name = 'rearDoor_s' + k; sec.add(K.mesh('r', gloss, 'rearDoor_s' + k + '_mesh')); p.add(sec); pivots['rearDoor_s' + k] = sec;
    }
    for (const sx of [-1, 1]) { add('m', box(0.05, 0.06, 1.6), 0x6c7177, [sx * 1.13, Y1 - 0.12 + 0.0, BZ0 + 0.95]); }       // overhead tracks
    p.userData = { mode: 'track', H, h, r: 0.18, f: 0 };
    _rearDoorTrack(p, 0);
  }
  _static();
  // ---------- wheels ----------
  const fw = _wheelGeo(THREE, 0.5, 0.3, false), rw = _wheelGeo(THREE, 0.5, 0.27, true);
  const wmat = _vcMat(THREE, mats.rubber ? Math.min(mats.rubber.roughness, 0.7) : 0.62, 0.3);
  const mkW = (nm, geo, s) => { const p = new THREE.Object3D(); p.name = nm; const m = new THREE.Mesh(geo, wmat); m.castShadow = true; if (s < 0) m.rotation.y = Math.PI; p.add(m); pivots[nm] = p; return p; };
  for (const [s, L] of [[1, 'L'], [-1, 'R']]) {
    const st = new THREE.Object3D(); st.name = 'steer_' + L; st.position.set(s * 1.0, 0.5, 3.25); G.add(st); pivots['steer_' + L] = st;
    st.add(mkW('wheel_F' + L, fw, s));
    const rr = mkW('wheel_R' + L, rw, s); rr.position.set(s * 0.86, 0.5, -2.5); G.add(rr);
  }
  // ---------- driver seat point (hip point of a seated worker; facing +z) ----------
  const seat = new THREE.Object3D(); seat.name = 'seat'; seat.position.set(0.5, 1.82, 2.08); G.add(seat); pivots.seat = seat; seat.updateMatrix();
  let calls = 0; G.traverse((o) => { if (o.isMesh) calls++; });
  G.userData = { name: 'dsdBoxTruck', dims: { w: 2.5, h: 3.6, d: 8.6 }, pivots, drawCalls: calls,
    seatPoint: { position: seat.position.clone(), quaternion: seat.quaternion.clone(), facing: new THREE.Vector3(0, 0, 1), matrix: seat.matrix.clone(), object: seat },
    notes: 'wheel_* rotate x to roll; steer_* rotate y; cabDoor_L open rotation.y<0, cabDoor_R >0; rearDoor = 3 sections translating up a side track onto the roof track (setRearDoor 0..1, no scale); seat = driver hip point (use worker seatedDrivePose(w, truck.getObjectByName("seat")))' };
  return G;
}
// f: 0 closed .. 1 open
export function setRearDoor(group, f) { _rearDoorTrack(group.userData.pivots.rearDoor, f); }
function _rearDoorTrack(p, f) {
  const { H, h, r } = p.userData, q = Math.PI * r / 2; p.userData.f = f = Math.max(0, Math.min(1, f));
  p.children.forEach((sec, k) => {
    const s = -(k + 0.5) * h + f * (H + 0.02);
    if (s <= 0) { sec.position.set(0, s, 0); sec.rotation.x = 0; }
    else if (s < q) { const a = s / r; sec.position.set(0, r * Math.sin(a), r * (1 - Math.cos(a))); sec.rotation.x = a; }
    else { sec.position.set(0, r, r + (s - q)); sec.rotation.x = Math.PI / 2; }
  });
}
export default build;
