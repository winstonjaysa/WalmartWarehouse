// Tiny inline BufferGeometry merge + primitive helpers (no three/addons import).
export function mergeGeos(THREE, geos) {
  const list = geos.filter(Boolean).map(g => (g.index ? g.toNonIndexed() : g));
  if (!list.length) return new THREE.BufferGeometry();
  const names = ['position', 'normal', 'uv', 'color'].filter(n => list.every(g => g.attributes[n]));
  let count = 0; list.forEach(g => (count += g.attributes.position.count));
  const out = new THREE.BufferGeometry();
  for (const n of names) {
    const sz = list[0].attributes[n].itemSize, arr = new Float32Array(count * sz); let o = 0;
    for (const g of list) { const a = g.attributes[n]; for (let i = 0; i < a.count; i++) for (let k = 0; k < sz; k++) arr[o++] = a.array[i * sz + k] ?? 0; }
    out.setAttribute(n, new THREE.BufferAttribute(arr, sz));
  }
  out.computeBoundingBox(); out.computeBoundingSphere();
  return out;
}
export function tint(THREE, g, hex) {
  const c = new THREE.Color(hex), n = g.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g;
}
function place(THREE, g, x, y, z, o) {
  if (o.rx) g.rotateX(o.rx); if (o.rz) g.rotateZ(o.rz); if (o.ry) g.rotateY(o.ry);
  g.translate(x, y, z);
  if (o.uv) { const u = g.attributes.uv; for (let i = 0; i < u.count; i++) u.setXY(i, o.uv[0], o.uv[1]); }
  if (o.c !== undefined) tint(THREE, g, o.c);
  return g;
}
// box centred at x,y,z
export function box(THREE, w, h, d, x = 0, y = 0, z = 0, o = {}) { return place(THREE, new THREE.BoxGeometry(w, h, d, o.sw || 1, o.sh || 1, o.sd || 1), x, y, z, o); }
// cylinder centred at x,y,z (axis y before rotation)
export function cyl(THREE, rt, rb, h, seg, x = 0, y = 0, z = 0, o = {}) { return place(THREE, new THREE.CylinderGeometry(rt, rb, h, seg, 1, !!o.open), x, y, z, o); }
export function flat(g) { const n = g.index ? g.toNonIndexed() : g; n.computeVertexNormals(); return n; }
export function rng(seed = 1) { let a = (seed >>> 0) || 1; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
