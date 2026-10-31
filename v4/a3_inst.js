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
