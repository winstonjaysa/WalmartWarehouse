// Stretch-wrapped pallet of tall kraft 15-dozen egg cases (4×3 per layer, 6 layers ≈1.90 m incl. pallet).
// opts: {seed=1, layers=6 (5..6), handHoles=true, palletColor ('natural' default)}
// Draw calls: 3 = pallet (woodVC), cases + print + hand holes + eggs (cardboardVC), stretch wrap.
// Note: 4×3 cases of 0.30×0.40 cannot fit a 1.22×1.02 pallet (1.2×1.2), so the case footprint is 0.285 × 0.335 (4 along x, 3 along z).
import { mergeGeos, box, cyl, rng } from './_merge.js';
import { palletGeo, PALLET } from './_pallet.js';
const KRAFT = ['#7f6044', '#785a3f', '#846447', '#72553b', '#7c5d42']; // richer, less orange (reads brown under film)
export const EGG_CASE = { w: 0.285, d: 0.335, h: 0.286 };
export function build(THREE, mats, opts = {}) {
  const seed = opts.seed ?? 1, r = rng(seed * 6007 + 13), L = Math.max(5, Math.min(6, Math.round(opts.layers ?? 6))), holes = opts.handHoles !== false, g = new THREE.Group();
  const woodM = mats.woodVC || new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82 });
  const cbM = mats.cardboardVC || new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0 });
  const wrapM = mats.wrap || new THREE.MeshPhysicalMaterial({ color: 0xeef4f8, transparent: true, opacity: 0.35, roughness: 0.1, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide });
  const pallet = new THREE.Mesh(palletGeo(THREE, seed, undefined, opts.palletColor ?? 'natural'), woodM); pallet.name = 'pallet'; pallet.castShadow = pallet.receiveShadow = true; g.add(pallet);
  const _c = new THREE.Color(), _h = {};
  const vary = (hex) => { _c.set(hex).getHSL(_h); _c.setHSL((_h.h + (r() - 0.5) * 0.024 + 1) % 1, _h.s * (0.94 + r() * 0.12), Math.min(1, _h.l * (0.94 + r() * 0.12))); return '#' + _c.getHexString(); };
  const { w: CW, d: CD, h: CH } = EGG_CASE, NX = 4, NZ = 3, px0 = -(NX - 1) * (CW + 0.003) / 2, pz0 = -(NZ - 1) * (CD + 0.003) / 2, P = [], U = { uv: [0.2, 0.2] };
  const BLUE = '#2c5d9a', INK = '#2a3550';
  for (let l = 0; l < L; l++) for (let a = 0; a < NX; a++) for (let b = 0; b < NZ; b++) {
    const w = CW - r() * 0.005, d = CD - r() * 0.005, h = CH - 0.002 - r() * 0.004;
    const cx = px0 + a * (CW + 0.003) + (r() - 0.5) * 0.008, cz = pz0 + b * (CD + 0.003) + (r() - 0.5) * 0.008, cy = PALLET.h + l * CH + h / 2, ry = (r() - 0.5) * 0.025;
    const kraft = vary(KRAFT[Math.floor(r() * KRAFT.length)]); P.push(box(THREE, w, h, d, cx, cy, cz, { ry, c: kraft }));
    const cs = Math.cos(ry), sn = Math.sin(ry), blue = vary(BLUE);
    const put = (lx, ly, lz, gw, gh, col, axis, o = {}) => { const wx = cx + lx * cs + lz * sn, wz = cz - lx * sn + lz * cs; P.push(axis === 'z' ? box(THREE, gw, gh, o.t || 0.002, wx, cy + ly, wz, { ...U, ry, c: col }) : box(THREE, o.t || 0.002, gh, gw, wx, cy + ly, wz, { ...U, ry, c: col })); };
    for (const [out, s, axis] of [[b === NZ - 1, 1, 'z'], [b === 0, -1, 'z'], [a === NX - 1, 1, 'x'], [a === 0, -1, 'x']]) {
      if (!out) continue;
      const half = (axis === 'z' ? d : w) / 2 + 0.0012, span = axis === 'z' ? w : d;
      const at = (t, y, gw, gh, col, o) => axis === 'z' ? put(t, y, s * half, gw, gh, col, 'z', o) : put(s * half, y, t, gw, gh, col, 'x', o);
      const dir = axis === 'z' ? s : -s; // keep print reading left→right from outside
      at(0, h / 2 - 0.022, span * 0.92, 0.014, blue); // generic blue printed band under the top edge
      at(-dir * span * 0.24, h / 2 - 0.05, span * 0.3, 0.008, blue); at(-dir * span * 0.24, h / 2 - 0.064, span * 0.22, 0.005, blue); // blank print blocks (no text)
      // stacked barcode-style frames on the right half (ref: four boxed barcodes)
      for (let i = 0; i < 3; i++) {
        const fy = -0.035 - i * 0.05, fx = dir * span * 0.16, fw = span * 0.46;
        at(fx, fy, fw, 0.036, blue); at(fx, fy, fw - 0.008, 0.028, kraft, { t: 0.0026 });
        for (let k = 0; k < 7; k++) at(fx - fw * 0.38 + k * fw * 0.105, fy + 0.002, k % 3 ? 0.004 : 0.008, 0.018, INK, { t: 0.0032 });
        at(-dir * span * 0.3, fy, 0.018, 0.018, blue); at(-dir * span * 0.3, fy, 0.012, 0.012, kraft, { t: 0.0026 }); // tick box
      }
      if (holes && axis === 'x') { // hand-hole: dark oval opening with white eggs showing
        const hy = h / 2 - 0.105, hx = 0, ox = s * (w / 2 + 0.0006);
        const hole = cyl(THREE, 1, 1, 0.004, 16, 0, 0, 0, { rz: Math.PI / 2, c: '#3a2a1a' }); hole.scale(1, 0.022, 0.05); hole.rotateY(ry); hole.translate(cx + ox * cs + hx * sn, cy + hy, cz - ox * sn + hx * cs); P.push(hole);
        for (const e of [-0.022, 0.022]) { const egg = new THREE.SphereGeometry(1, 10, 8); egg.scale(0.016, 0.019, 0.02); const ex = s * (w / 2 - 0.012), ez = e; egg.rotateY(ry); egg.translate(cx + ex * cs + ez * sn, cy + hy - 0.004, cz - ex * sn + ez * cs); egg.deleteAttribute('uv'); const n = egg.attributes.position.count, ca = new Float32Array(n * 3).fill(0.95), ua = new Float32Array(n * 2).fill(0.2); egg.setAttribute('uv', new THREE.BufferAttribute(ua, 2)); egg.setAttribute('color', new THREE.BufferAttribute(ca, 3)); P.push(egg); }
      }
    }
    // tape strip across the top flaps (cardboard texture's centre tape runs along each face) + a second short strip
    if (l === L - 1) P.push(box(THREE, 0.05, 0.002, d * 0.98, cx, cy + h / 2 + 0.001, cz, { ry, c: vary('#c9a87c'), uv: [0.5, 0.5] }));
  }
  const cases = new THREE.Mesh(mergeGeos(THREE, P), cbM); cases.name = 'cases'; cases.castShadow = cases.receiveShadow = true; g.add(cases);
  // --- stretch wrap (same approach as wrappedSkid: bulged shell + overlapping bands, deck tail, bunched edges)
  const H = PALLET.h + L * CH + 0.01;
  const hw = 0.605, hd = 0.52, yb = 0.05;
  function bulge(geo, out) {
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), yy = p.getY(i), z = p.getZ(i);
      const t = Math.min(1, Math.max(0, (yy - yb) / (H - yb))), s = Math.sin(Math.PI * Math.min(1, t * 1.05)) ** 0.6;
      const nx = x / hw, nz = z / hd;
      if (yy < H - 0.001) { // sides: bow out at face centres, pull in at corners
        const cx = 1 - Math.min(1, nz * nz), cz = 1 - Math.min(1, nx * nx);
        if (Math.abs(nx) > 0.999) x += Math.sign(nx) * (0.004 + 0.022 * cx * s + out);
        if (Math.abs(nz) > 0.999) z += Math.sign(nz) * (0.004 + 0.022 * cz * s + out);
        if (Math.abs(nx) > 0.999 && Math.abs(nz) > 0.97) { x -= Math.sign(nx) * 0.012; z -= Math.sign(nz) * 0.012; }
      } else { yy += 0.012 * (1 - nx * nx) * (1 - nz * nz); x *= 0.985; z *= 0.985; }
      p.setXYZ(i, x, yy, z);
    }
    geo.computeVertexNormals(); return geo;
  }
  function sides(y1, y2, out, withTop) {
    const parts = [], h = y2 - y1, ym = (y1 + y2) / 2, segH = Math.max(2, Math.round(h / 0.1));
    const P = (w, rot, x, z) => { const q = new THREE.PlaneGeometry(w, h, 10, segH); q.rotateY(rot); q.translate(x, ym, z); return q; };
    parts.push(P(2 * hw, 0, 0, hd), P(2 * hw, Math.PI, 0, -hd), P(2 * hd, Math.PI / 2, hw, 0), P(2 * hd, -Math.PI / 2, -hw, 0));
    if (withTop) { const t = new THREE.PlaneGeometry(2 * hw, 2 * hd, 10, 10); t.rotateX(-Math.PI / 2); t.translate(0, H, 0); parts.push(t); }
    return parts.map(q => bulge(q, out));
  }
  const film = [...sides(yb, H, 0, true), ...sides(0.04, 0.32, 0.004), ...sides(0.85, 1.12, 0.004), ...sides(H - 0.36, H - 0.1, 0.005), ...sides(0.05, 0.2, 0.007)];
  // film tail: extra layers wrapping the pallet deck + rolled rope of film
  film.push(...sides(0.02, 0.17, 0.009), ...sides(0.06, 0.15, 0.011), ...sides(0.09, 0.14, 0.013));
  for (const [ax, az, len, ry] of [[0, hd + 0.03, 2 * hw, 0], [0, -hd - 0.03, 2 * hw, 0], [hw + 0.03, 0, 2 * hd, Math.PI / 2], [-hw - 0.03, 0, 2 * hd, Math.PI / 2]]) {
    const rope = new THREE.CylinderGeometry(0.012, 0.012, len, 8, 6); const rp = rope.attributes.position;
    for (let i = 0; i < rp.count; i++) rp.setX(i, rp.getX(i) + Math.sin(rp.getY(i) * 9) * 0.004);
    rope.rotateZ(Math.PI / 2); rope.rotateY(ry); rope.translate(ax, 0.125 + (r() - 0.5) * 0.02, az); film.push(rope);
  }
  // bunched-film lumps along top edges and vertical corners
  const lump = (x, yy, z, sx, sy, sz) => { const q = new THREE.SphereGeometry(1, 8, 6); q.scale(sx, sy, sz); q.translate(x, yy, z); film.push(q); };
  for (let i = 0; i < 9; i++) { const t = -0.9 + i * 0.225; lump(t * hw, H - 0.01, hd * 0.99, 0.07 + r() * 0.05, 0.02, 0.025); lump(t * hw, H - 0.01, -hd * 0.99, 0.07 + r() * 0.05, 0.02, 0.025); }
  for (let i = 0; i < 7; i++) { const t = -0.85 + i * 0.28; lump(hw * 0.99, H - 0.01, t * hd, 0.025, 0.02, 0.07 + r() * 0.05); lump(-hw * 0.99, H - 0.01, t * hd, 0.025, 0.02, 0.07 + r() * 0.05); }
  for (const sx of [1, -1]) for (const sz of [1, -1]) for (let i = 0; i < 6; i++) lump(sx * (hw - 0.008), Math.min(H - 0.1, 0.3 + i * (H - 0.45) / 5 + r() * 0.1), sz * (hd - 0.008), 0.022, 0.08 + r() * 0.06, 0.022);
  const wrap = new THREE.Mesh(mergeGeos(THREE, film), wrapM); wrap.name = 'wrap'; wrap.renderOrder = 2; g.add(wrap);
  g.userData = { name: 'eggPallet', dims: (() => { const bb = new THREE.Box3(); g.children.forEach(m => { m.geometry.computeBoundingBox(); bb.union(m.geometry.boundingBox); }); const z = bb.getSize(new THREE.Vector3()); return { w: +z.x.toFixed(3), h: +bb.max.y.toFixed(3), d: +z.z.toFixed(3) }; })(), pivots: {}, drawCalls: 3, layers: L, case: EGG_CASE };
  return g;
}
export default build;
