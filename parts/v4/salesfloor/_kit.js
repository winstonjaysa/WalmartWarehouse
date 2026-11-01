// salesfloor shared low-poly kit (not an asset). Wraps ../_merge.js; adds face-culled boxes to save verts.
import { mergeGeos, box, cyl, tint, rng } from '../_merge.js';
export { mergeGeos, box, cyl, tint, rng };
// BoxGeometry face groups: 0 +x, 1 -x, 2 +y, 3 -y, 4 +z, 5 -z. faces: string of 'xXyYzZ' (upper = negative side)
const FACE = { x: 0, X: 1, y: 2, Y: 3, z: 4, Z: 5 };
export function slab(THREE, w, h, d, x, y, z, c, faces = 'xXyzZ', ry = 0) {
  const b = new THREE.BoxGeometry(w, h, d), idx = b.index.array, keep = [];
  for (const ch of faces) { const s = FACE[ch] * 6; for (let k = 0; k < 6; k++) keep.push(idx[s + k]); }
  const g = new THREE.BufferGeometry();
  for (const n of ['position', 'normal', 'uv']) { const a = b.attributes[n], sz = a.itemSize, arr = new Float32Array(keep.length * sz); keep.forEach((v, i) => { for (let k = 0; k < sz; k++) arr[i * sz + k] = a.array[v * sz + k]; }); g.setAttribute(n, new THREE.BufferAttribute(arr, sz)); }
  if (ry) g.rotateY(ry); g.translate(x, y, z); return tint(THREE, g, c);
}
export const B = (THREE, w, h, d, x, y, z, c, o = {}) => box(THREE, w, h, d, x, y, z, { ...o, c });
export function rod(THREE, a, b, r, seg, c) {
  const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), d = Bv.clone().sub(A), L = d.length();
  const g = new THREE.CylinderGeometry(r, r, L, seg, 1, true); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()));
  const m = A.add(Bv).multiplyScalar(0.5); g.translate(m.x, m.y, m.z); return tint(THREE, g, c);
}
// vary a hex colour's value by ±amt with slight hue shift
export function jit(THREE, hex, R, amt = 0.06) { const c = new THREE.Color(hex), hsl = {}; c.getHSL(hsl); c.setHSL((hsl.h + (R() - 0.5) * 0.02 + 1) % 1, hsl.s, Math.min(1, Math.max(0, hsl.l * (1 + (R() - 0.5) * 2 * amt)))); return c; }
export function mesh(THREE, geos, mat, name) { const m = new THREE.Mesh(mergeGeos(THREE, geos), mat); m.name = name; m.castShadow = m.receiveShadow = true; return m; }
export function finish(THREE, g, name, pivots, extra = {}) {
  const bb = new THREE.Box3().setFromObject(g), c = bb.getCenter(new THREE.Vector3());
  for (const ch of g.children) { ch.position.x -= c.x; ch.position.z -= c.z; }
  const s = bb.getSize(new THREE.Vector3()), r = (v) => Math.round(v * 1000) / 1000;
  let drawCalls = 0, verts = 0; g.traverse(o => { if (o.isMesh) { drawCalls++; verts += o.geometry.attributes.position.count; } });
  g.userData = { name, dims: { w: r(s.x), h: r(bb.max.y), d: r(s.z) }, pivots, drawCalls, verts, offset: [-c.x, 0, -c.z], ...extra };
  return g;
}
export function matsOf(THREE, mats = {}) {
  return {
    vc: mats.vc || new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.62, metalness: 0 }),
    vm: mats.vcMetal || new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.5, metalness: 0.5 }),
  };
}
// seeded retail product palette (generic packaging colours)
export const PROD = ['#c8302a', '#e0a020', '#2f6db5', '#f2f0e8', '#3b8a3e', '#7a3f9a', '#e86a1c', '#1e2a44', '#d7c7a0', '#b52b62', '#5ab0d8', '#f4d23c', '#8b5a2b', '#2a2a2c', '#e8e2d4'];
