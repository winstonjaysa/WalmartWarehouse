// produceTable — Walmart Canada produce bin/table with heaped fruit (low poly, r160).
// Front (price board side) faces +z. Bin 1.22 × 1.0, rim top 0.76, fruit dome to ≈1.0, price board to ≈1.32.
import { slab, B, rod, jit, mesh, finish, matsOf, rng } from './_kit.js';
const VAR = { // colour(s), fruit radius
  apple: [['#b3202a', '#c8342a', '#8e1a22', '#d0482e'], 0.042], orange: [['#ee8a1c', '#f29a24', '#e47a14'], 0.045],
  lemon: [['#f2d53a', '#e8c82a'], 0.038], lime: [['#5fa83a', '#4c9a2e', '#6cb444'], 0.034], melon: [['#d9c48a', '#cdb878', '#e2cf98'], 0.085],
  avocado: [['#2f3a1e', '#3c4a22'], 0.04], greenApple: [['#8cc43c', '#9ccf4a'], 0.042],
};
export function build(THREE, mats, opts = {}) {
  const g = new THREE.Group(), R = rng(opts.seed ?? 1), M = matsOf(THREE, mats);
  const vk = opts.variety ?? 'orange', v = VAR[vk] || VAR.orange, cols = opts.fruitColor ? [opts.fruitColor] : v[0], fr = opts.fruitRadius ?? v[1];
  const W = 1.22, D = 1.0, H = 0.76, P = [], S = [], blk = '#1c1c1e', yel = '#e3b21c';
  // bin box with open top: walls, inner floor (false bottom at 0.5), yellow trim band on rim + vertical corner trims
  P.push(slab(THREE, W, H - 0.08, D, 0, 0.08 + (H - 0.08) / 2, 0, blk, 'xXzZ'), slab(THREE, W - 0.04, 0.02, D - 0.04, 0, 0.5, 0, '#121214', 'y'));
  for (const sz of [-1, 1]) P.push(B(THREE, W + 0.02, 0.06, 0.05, 0, H - 0.03, sz * (D / 2 - 0.015), yel));
  for (const sx of [-1, 1]) P.push(B(THREE, 0.05, 0.06, D - 0.08, sx * (W / 2 - 0.015), H - 0.03, 0, yel));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) P.push(B(THREE, 0.05, H - 0.14, 0.05, sx * (W / 2 - 0.015), 0.08 + (H - 0.14) / 2, sz * (D / 2 - 0.015), yel));
  P.push(slab(THREE, W - 0.08, 0.08, D - 0.08, 0, 0.04, 0, '#0e0e10', 'xXzZ')); // recessed plinth
  // fruit mound: low-poly dome core + icosahedron fruit scattered over a spherical cap
  const capH = opts.mound ?? 0.26, a = Math.min(W, D) / 2 - 0.05, Rs = (a * a + capH * capH) / (2 * capH), y0 = H - 0.04;
  const core = new THREE.SphereGeometry(Rs, 12, 6, 0, Math.PI * 2, 0, Math.asin(a / Rs));
  core.scale((W / 2 - 0.05) / a, 1, 1); core.translate(0, y0 - (Rs - capH) - fr * 0.6, 0);
  { const c = new THREE.Color(cols[0]).multiplyScalar(0.55), n = core.attributes.position.count, arr = new Float32Array(n * 3); for (let i = 0; i < n; i++) c.toArray(arr, i * 3); core.setAttribute('color', new THREE.BufferAttribute(arr, 3)); P.push(core); }
  const step = fr * 1.9, base = new THREE.IcosahedronGeometry(fr, fr > 0.06 ? 1 : 0);
  for (let x = -W / 2 + 0.05 + fr; x <= W / 2 - 0.05 - fr; x += step) for (let z = -D / 2 + 0.05 + fr; z <= D / 2 - 0.05 - fr; z += step * 0.87) {
    const jx = x + (R() - 0.5) * fr * 0.5 + ((Math.round((z + D) / (step * 0.87)) % 2) ? step / 2 : 0), jz = z + (R() - 0.5) * fr * 0.5;
    if (Math.abs(jx) > W / 2 - 0.05 - fr * 0.8) continue;
    const ex = jx / (W / 2 - 0.05), ez = jz / (D / 2 - 0.05), r2 = Math.min(1, ex * ex * 0.9 + ez * ez * 0.9);
    const y = y0 + capH * (1 - r2) + fr * 0.2 + (R() - 0.5) * fr * 0.3;
    const f = base.clone(); f.scale(1, vk === 'melon' ? 0.9 : vk === 'lemon' ? 0.85 : 0.92, vk === 'lemon' ? 1.25 : 1); f.rotateY(R() * 6.28); f.rotateX((R() - 0.5) * 0.8); f.translate(jx, y, jz);
    const c = jit(THREE, cols[(R() * cols.length) | 0], R, 0.1), n = f.attributes.position.count, arr = new Float32Array(n * 3); for (let i = 0; i < n; i++) c.toArray(arr, i * 3);
    f.setAttribute('color', new THREE.BufferAttribute(arr, 3)); f.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2)); P.push(f);
  }
  // price board on a post at the front: black board 0.5 × 0.34, blue header band, small yellow price block (no text)
  const pz = D / 2 + 0.03, by = 1.12;
  S.push(rod(THREE, [0, 0.1, pz], [0, by - 0.17, pz], 0.012, 6, '#2a2b2e'));
  S.push(B(THREE, 0.05, 0.03, 0.03, 0, 0.62, pz - 0.015, '#2a2b2e')); // clamp to bin front
  P.push(B(THREE, 0.5, 0.34, 0.02, 0, by, pz, blk), slab(THREE, 0.5, 0.08, 0.004, 0, by + 0.12, pz + 0.012, '#1f5fb8', 'z'));
  P.push(slab(THREE, 0.26, 0.11, 0.004, 0.04, by - 0.05, pz + 0.012, '#f2f2ee', 'z'), slab(THREE, 0.06, 0.04, 0.004, -0.19, by - 0.02, pz + 0.012, '#f4d23c', 'z'));
  // front-face board on the bin (blue header + black panel), like the refs
  P.push(slab(THREE, 0.7, 0.07, 0.006, 0, H - 0.12, D / 2 + 0.004, '#1f5fb8', 'z'), slab(THREE, 0.7, 0.22, 0.006, 0, H - 0.275, D / 2 + 0.004, '#2a2a2c', 'z'));
  g.add(mesh(THREE, P, M.vc, 'binFruit'), mesh(THREE, S, M.vm, 'post'));
  return finish(THREE, g, 'produceTable', {}, { variety: vk, rimY: H, facing: '+z' });
}
