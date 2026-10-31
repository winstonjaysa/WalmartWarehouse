// Compressed OCC cardboard bale (≈1.2 W × 0.95 H × 1.0 D) on a weathered natural pallet, low detail.
// opts: {seed=1, pallet=true, straps=5}
// Bale = stacked crushed-board slabs (per-layer jitter/inset, noise-ragged edges, mid bulge, rounded corners) + protruding flaps,
// coloured scraps (no text/logos), dark hand holes and white poly straps (front↔back over the top), all one cardboardVC mesh.
// Draw calls: 2 (pallet woodVC + bale cardboardVC), 1 without pallet.
import { mergeGeos, box, rng } from './_merge.js';
import { palletGeo, PALLET } from './_pallet.js';
const KRAFT = ['#a88458', '#9b7a50', '#b38e60', '#8e6f48', '#a07c52', '#b69468', '#94754e', '#7f6444'];
const WEATHER = ['#a39272', '#978667', '#ab9a79', '#8b7b5f', '#9d8c6c'];
const hash = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
export function build(THREE, mats, opts = {}) {
  const seed = opts.seed ?? 1, r = rng(seed * 3301 + 17), withPallet = opts.pallet !== false, nStr = Math.max(0, Math.round(opts.straps ?? 5)), g = new THREE.Group();
  const cbM = mats.cardboardVC || new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88 });
  const woodM = mats.woodVC || new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 });
  if (withPallet) { const p = new THREE.Mesh(palletGeo(THREE, seed, WEATHER, 'natural'), woodM); p.name = 'pallet'; p.castShadow = p.receiveShadow = true; g.add(p); }
  const y0 = withPallet ? PALLET.h : 0, BW = 1.2, BD = 1.0, Hb = 0.92 + r() * 0.08, hw = BW / 2, hd = BD / 2, G = [], U = { uv: [0.2, 0.2] };
  const col = new THREE.Color(), tmp = new THREE.Color();
  // ---- slabs
  let y = y0;
  while (y < y0 + Hb - 0.012) {
    const t = Math.min(y0 + Hb - y, 0.018 + r() * 0.03), w = BW - r() * 0.07, d = BD - r() * 0.06, ox = (r() - 0.5) * 0.035, oz = (r() - 0.5) * 0.03, ry = (r() - 0.5) * 0.012;
    const q = new THREE.BoxGeometry(w, t, d, 3, 1, 3); q.rotateY(ry); q.translate(ox, y + t / 2, oz);
    const base = new THREE.Color(KRAFT[Math.floor(r() * KRAFT.length)]), p = q.attributes.position, n = p.count, ca = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      let px = p.getX(i), py = p.getY(i), pz = p.getZ(i);
      const tt = (py - y0) / Hb, bul = 1 + 0.035 * Math.sin(Math.PI * Math.min(1, Math.max(0, tt))), nx = px / hw, nz = pz / hd;
      const corner = Math.max(0, Math.abs(nx) - 0.75) * Math.max(0, Math.abs(nz) - 0.75) * 16; // 0..1 near corners → round them in
      const rag = (hash(px * 9, py * 3, pz * 9) - 0.5) * 0.03;
      px = px * bul * (1 - 0.05 * corner) + Math.sign(px) * rag; pz = pz * bul * (1 - 0.05 * corner) + Math.sign(pz) * rag * 0.8; py += (hash(px * 5, py, pz * 5) - 0.5) * 0.008;
      p.setXYZ(i, px, py, pz);
      const k = 0.86 + hash(px * 3.1, py * 40, pz * 3.1) * 0.26; col.copy(base).multiplyScalar(k); ca.set([col.r, col.g, col.b], i * 3);
    }
    q.setAttribute('color', new THREE.BufferAttribute(ca, 3)); const uv = q.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, 0.2, 0.2);
    q.computeVertexNormals(); G.push(q); y += t;
  }
  const top = y, edge = (s, axis, bulge = 1.035) => (axis === 'x' ? hw : hd) * bulge;
  // ---- protruding flaps, scraps, hand holes on the 4 sides + top
  const side = () => { const k = Math.floor(r() * 4); return k; };
  const onSide = (k, along, yy, out) => { // returns [x,z,ry] on side k
    if (k === 0) return [along * hw, edge(0, 'z') + out, 0]; if (k === 1) return [along * hw, -edge(0, 'z') - out, Math.PI];
    if (k === 2) return [edge(0, 'x') + out, along * hd, Math.PI / 2]; return [-edge(0, 'x') - out, along * hd, -Math.PI / 2]; };
  for (let i = 0; i < 40; i++) { // flaps: thin boards sticking out of the layering, mostly bent down
    const k = side(), yy = y0 + 0.03 + r() * (Hb - 0.05), [x, z, ry] = onSide(k, (r() - 0.5) * 1.8, yy, -0.01), w = 0.07 + r() * 0.18, l = 0.025 + r() * 0.05;
    const c = '#' + tmp.set(KRAFT[Math.floor(r() * KRAFT.length)]).multiplyScalar(0.92 + r() * 0.15).getHexString();
    const f = box(THREE, w, 0.004, l, 0, 0, l / 2, { c, ...U }); f.rotateX(r() < 0.75 ? 0.5 + r() * 0.9 : -(0.2 + r() * 0.5)); f.rotateY(ry); f.translate(x, yy, z); G.push(f);
  }
  const SCRAP = ['#2f7d3a', '#b3202c', '#f2efe6', '#e8e4da', '#1f4fa8', '#3d9a4a', '#d9a21e'];
  for (let i = 0; i < 26; i++) { // coloured/printed scraps (plain colour, no text)
    const c = SCRAP[Math.floor(r() * SCRAP.length)];
    if (r() < 0.35) { G.push(box(THREE, 0.06 + r() * 0.14, 0.004, 0.04 + r() * 0.1, (r() - 0.5) * 1.05, top + 0.002, (r() - 0.5) * 0.85, { c, ...U, ry: r() * 3 })); continue; }
    const k = side(), yy = y0 + 0.04 + r() * (Hb - 0.08), [x, z, ry] = onSide(k, (r() - 0.5) * 1.7, yy, 0.004), s = box(THREE, 0.05 + r() * 0.12, 0.012 + r() * 0.02, 0.004, 0, 0, 0, { c, ...U }); s.rotateY(ry); s.translate(x, yy, z); G.push(s);
  }
  for (let i = 0; i < 7; i++) { // hand holes (dark slots) on the sides
    const k = side(), yy = y0 + 0.15 + r() * (Hb - 0.3), [x, z, ry] = onSide(k, (r() - 0.5) * 1.5, yy, 0.003), h = box(THREE, 0.09, 0.022, 0.004, 0, 0, 0, { c: '#2a1f14', ...U }); h.rotateY(ry); h.translate(x, yy, z); G.push(h);
  }
  for (let i = 0; i < 3; i++) { // big flattened box sides lying against a face (like the ref's front panel), slightly tilted
    const k = side(), ph = 0.25 + r() * 0.35, pw = 0.3 + r() * 0.4, yy = y0 + 0.05 + ph / 2 + r() * (Hb - ph - 0.1), [x, z, ry] = onSide(k, (r() - 0.5) * 0.9, yy, 0.002), c = '#' + tmp.set(KRAFT[Math.floor(r() * KRAFT.length)]).multiplyScalar(1.05).getHexString();
    const b = box(THREE, pw, ph, 0.006, 0, 0, 0, { c, ...U }); b.rotateX((r() - 0.5) * 0.12); b.rotateZ((r() - 0.5) * 0.08); b.rotateY(ry); b.translate(x, yy, z); G.push(b);
  }
  // top layer ragged overhanging boards
  for (let i = 0; i < 10; i++) { const w = 0.25 + r() * 0.45, d = 0.15 + r() * 0.35, c = '#' + tmp.set(KRAFT[Math.floor(r() * KRAFT.length)]).getHexString(); const b = box(THREE, w, 0.008, d, (r() - 0.5) * (BW - w), top + 0.004 + r() * 0.006, (r() - 0.5) * (BD - d), { c, ...U, ry: (r() - 0.5) * 0.3 }); G.push(b); }
  // ---- straps: white poly bands front↔back (around the y-z section) at evenly spaced x
  const sw = 0.016, so = 0.012;
  for (let i = 0; i < nStr; i++) {
    const x = -hw * 0.8 + (nStr > 1 ? i * 1.6 * hw / (nStr - 1) : 0.8 * hw) + (r() - 0.5) * 0.04, zf = hd * 1.035 + so, yt = top + 0.012, c = '#ecebe6';
    G.push(box(THREE, sw, 0.004, 2 * zf, x, yt, 0, { c, ...U }));
    for (const s of [-1, 1]) { // down the side with a slight bow following the bulge (2 segments)
      const ym = y0 + Hb * 0.5, zb = s * (zf + 0.012);
      const a = new THREE.Vector3(x, yt, s * zf), m = new THREE.Vector3(x, ym, zb), bt = new THREE.Vector3(x, y0 + 0.01, s * zf);
      for (const [p0, p1] of [[a, m], [m, bt]]) { const len = p0.distanceTo(p1), q = box(THREE, sw, len, 0.004, 0, 0, 0, { c, ...U }); q.rotateX(Math.atan2(p1.z - p0.z, p0.y - p1.y) * -1); q.translate((p0.x + p1.x) / 2, (p0.y + p1.y) / 2, (p0.z + p1.z) / 2); G.push(q); }
    }
    G.push(box(THREE, sw, 0.004, 2 * zf, x, y0 + 0.006, 0, { c, ...U })); // under the bale (visible through pallet gaps)
  }
  const bale = new THREE.Mesh(mergeGeos(THREE, G), cbM); bale.name = 'bale'; bale.castShadow = bale.receiveShadow = true; g.add(bale);
  const bb = new THREE.Box3(); for (const m of g.children) { m.geometry.computeBoundingBox(); bb.union(m.geometry.boundingBox); } const sz = bb.getSize(new THREE.Vector3());
  const verts = {}; for (const m of g.children) verts[m.name] = m.geometry.attributes.position.count;
  g.userData = { name: 'cardboardBale', dims: { w: +sz.x.toFixed(3), h: +bb.max.y.toFixed(3), d: +sz.z.toFixed(3) }, pivots: { baleBottom: [0, y0, 0], baleTop: [0, +top.toFixed(3), 0] }, drawCalls: g.children.length, verts, baleH: +(top - y0).toFixed(3) };
  return g;
}
export default build;
