// Backroom fashion storage: green steel pallet racking (uprights + beams + wire decks), kraft cartons + blue totes on the decks,
// stretch-wrapped pallets on top, and a hang bar of muted garments under the first deck. No text/logos.
// opts: {seed=1, bays=2, zrack=false}. zrack adds a yellow rolling Z-rack of garments beside the rack (also: buildZRack()).
// Bays along x (2.75 m each), depth z 1.07 m, uprights 3.65 m, wrapped loads to ≈5 m. Draw calls: 3 (steel vcMetal, goods cardboardVC, wrap).
import { mergeGeos, box, rng } from './_merge.js';
import { U, frame, level, fillCases, wrappedLoad, jitterHex } from './_rackKit.js';
const GREEN = '#2f5a3c', KRAFT = ['#a57b52', '#9c744c', '#ae8558', '#94704b', '#b08a5e'];
const CLOTH = ['#2b2f3a', '#3a3f4a', '#1f2a44', '#4a3a33', '#5c4a3c', '#6d6a64', '#8b8f96', '#2c2c2e', '#5a2b33', '#6b6550', '#7e8796', '#3c4a5c', '#a7adb6', '#8e7b62', '#262a33'];
// garments hanging from a bar along x at height yb, centre z, from xa..xb; pushes into G (goods) and S (hangers on steel)
function garments(THREE, G, r, xa, xb, yb, z, { pitch = 0.075, fill = 0.92, maxL = 1.25 } = {}) {
  let x = xa + 0.03; const end = xa + (xb - xa) * fill;
  while (x < end) {
    const t = 0.03 + r() * 0.035, L = 0.65 + r() * (maxL - 0.65), wz = 0.4 + r() * 0.1, c = CLOTH[Math.floor(r() * CLOTH.length)];
    const q = box(THREE, t, L, wz, 0, -L / 2, 0, { c: jitterHex(THREE, c, r, 0.05), ...U });
    const p = q.attributes.position; for (let i = 0; i < p.count; i++) { const py = p.getY(i); if (py > -0.02) p.setZ(i, p.getZ(i) * 0.72); else if (py < -L + 0.01) p.setZ(i, p.getZ(i) * (0.9 + r() * 0.15)); }
    q.computeVertexNormals(); q.rotateZ((r() - 0.5) * 0.06); q.rotateY((r() - 0.5) * 0.25); q.translate(x, yb - 0.07, z); G.push(q);
    G.push(box(THREE, 0.008, 0.012, wz * 0.75, x, yb - 0.055, z, { c: r() < 0.7 ? '#1c1c1e' : '#e8e8e4', ...U })); // hanger
    x += pitch * (0.7 + r() * 0.7) + t * 0.5;
  }
}
// Z-rack geometry (yellow frame into S, garments into G), centred at x,z, footprint along x
function zrackGeo(THREE, S, G, r, x = 0, z = 0, len = 1.5) {
  const Y = '#e0b21a', hb = 1.68, hw = len / 2;
  S.push(box(THREE, len, 0.04, 0.04, x, 0.1, z - 0.3, { c: Y })); S.push(box(THREE, len, 0.04, 0.04, x, 0.1, z + 0.3, { c: Y }));
  const dl = Math.hypot(0.6, 0.35); S.push(box(THREE, 0.04, 0.04, dl, x - hw + 0.35 / 2 - 0.02, 0.1, z, { c: Y, ry: Math.atan2(0.35, 0.6) })); // Z diagonal (one end)
  S.push(box(THREE, 0.04, 0.04, dl, x + hw - 0.35 / 2 + 0.02, 0.1, z, { c: Y, ry: Math.atan2(0.35, 0.6) }));
  for (const s of [-1, 1]) {
    S.push(box(THREE, 0.04, hb - 0.1, 0.04, x + s * (hw - 0.02), 0.1 + (hb - 0.1) / 2, z - 0.3, { c: Y }));
    for (const zz of [-0.3, 0.3]) for (const xx of [s * (hw - 0.03), s * (hw - 0.38)]) { S.push(box(THREE, 0.05, 0.06, 0.03, x + xx, 0.045, z + zz, { c: '#2a2a2c' })); S.push(box(THREE, 0.04, 0.03, 0.04, x + xx, 0.09, z + zz, { c: '#8f949a' })); }
  }
  S.push(box(THREE, len + 0.04, 0.03, 0.03, x, hb, z - 0.3, { c: '#c9ccd0' })); // chrome hang bar
  garments(THREE, G, r, x - hw + 0.03, x + hw - 0.03, hb, z - 0.3, { pitch: 0.06, fill: 0.96, maxL: 1.3 });
}
export function buildZRack(THREE, mats, opts = {}) {
  const r = rng((opts.seed ?? 1) * 911 + 5), S = [], G = [], g = new THREE.Group(); zrackGeo(THREE, S, G, r, 0, 0.3, opts.length ?? 1.5);
  const st = new THREE.Mesh(mergeGeos(THREE, S), mats.vcMetal || new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5 })); st.name = 'frame';
  const gm = new THREE.Mesh(mergeGeos(THREE, G), mats.cardboardVC || mats.vc || new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 })); gm.name = 'garments';
  for (const m of [st, gm]) { m.castShadow = m.receiveShadow = true; g.add(m); }
  g.userData = { name: 'zRack', dims: { w: (opts.length ?? 1.5) + 0.04, h: 1.7, d: 0.68 }, pivots: { hangBar: [0, 1.68, 0] }, drawCalls: 2, verts: { frame: st.geometry.attributes.position.count, garments: gm.geometry.attributes.position.count } };
  return g;
}
export function build(THREE, mats, opts = {}) {
  const seed = opts.seed ?? 1, r = rng(seed * 6173 + 3), nb = Math.max(1, Math.round(opts.bays ?? 2)), BW = 2.75, D = 1.07, H = 3.65, W = nb * BW, x0 = -W / 2;
  const S = [], G = [], Wr = [], g = new THREE.Group(), L1 = 1.95, L2 = 2.8, L3 = 3.6;
  const kraft = (rr) => jitterHex(THREE, KRAFT[Math.floor(rr() * KRAFT.length)], rr, 0.07);
  for (let f = 0; f <= nb; f++) frame(THREE, S, x0 + f * BW, D, H, GREEN, { guard: f === nb ? 1 : f === 0 ? -1 : 0, nd: 6 });
  let topH = H;
  for (let b = 0; b < nb; b++) {
    const cx = x0 + (b + 0.5) * BW, iw = BW - 0.08, xa = cx - iw / 2, xb = cx + iw / 2;
    for (const y of [L1, L2, L3]) level(THREE, S, cx, y, iw, D, GREEN);
    // hang bar under deck 1 (drop brackets off the front beam) + garments
    const yb = L1 - 0.2, zb = 0.12;
    S.push(box(THREE, iw, 0.03, 0.03, cx, yb, zb, { c: '#b9bdc2' }));
    for (const k of [-0.42, 0, 0.42]) S.push(box(THREE, 0.025, 0.09, 0.025, cx + k * iw, yb + 0.05, zb, { c: '#b9bdc2' }));
    garments(THREE, G, r, xa, xb, yb, zb);
    // decks 1 & 2: kraft cartons, a few blue totes (deck 1), a blue label holder on the beam
    fillCases(THREE, G, r, xa, xb, L1, D, L2 - L1 - 0.14, kraft, { minW: 0.3, maxW: 0.48 });
    for (let t = 0; t < 1 + Math.floor(r() * 2); t++) { const tx = xa + 0.3 + r() * (iw - 0.6); G.push(box(THREE, 0.42, 0.26, 0.58, tx, L1 + 0.14, 0.2, { c: '#1f5fbf', ...U })); G.push(box(THREE, 0.44, 0.03, 0.6, tx, L1 + 0.27, 0.2, { c: '#1a4f9f', ...U })); }
    fillCases(THREE, G, r, xa, xb, L2, D, L3 - L2 - 0.14, kraft, { minW: 0.3, maxW: 0.48 });
    S.push(box(THREE, 0.2, 0.09, 0.01, xb - 0.35, L1 - 0.06, D / 2 - 0.005, { c: '#2f6fd0' })); // blue location sign (blank)
    // top: 2 wrapped pallets per bay on blue pallets
    for (const s of [-1, 1]) { const hh = 1.0 + r() * 0.35; topH = Math.max(topH, wrappedLoad(THREE, G, Wr, r, cx + s * (iw / 4 + 0.01), L3, 0, hh, { kraft: KRAFT, w: 1.2, d: 1.0 })); }
  }
  let zr = null;
  if (opts.zrack) { zr = { x: x0 - 1.05 + (opts.zrackOffset ?? 0), z: 1.25 }; zrackGeo(THREE, S, G, r, zr.x, zr.z, 1.5); }
  const steel = new THREE.Mesh(mergeGeos(THREE, S), mats.vcMetal || new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.4 })); steel.name = 'steel';
  const goods = new THREE.Mesh(mergeGeos(THREE, G), mats.cardboardVC || new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 })); goods.name = 'goods';
  const wrap = new THREE.Mesh(mergeGeos(THREE, Wr), mats.wrap || new THREE.MeshPhysicalMaterial({ color: 0xeef4f8, transparent: true, opacity: 0.35, roughness: 0.1, depthWrite: false, side: THREE.DoubleSide })); wrap.name = 'wrap'; wrap.renderOrder = 2;
  for (const m of [steel, goods]) { m.castShadow = m.receiveShadow = true; g.add(m); } wrap.castShadow = true; g.add(wrap);
  const bb = new THREE.Box3(); for (const m of g.children) { m.geometry.computeBoundingBox(); bb.union(m.geometry.boundingBox); } const sz = bb.getSize(new THREE.Vector3());
  const verts = {}; let tot = 0; for (const m of g.children) { verts[m.name] = m.geometry.attributes.position.count; tot += verts[m.name]; } verts.total = tot;
  g.userData = { name: 'fashionRack', dims: { w: +sz.x.toFixed(3), h: +sz.y.toFixed(3), d: +sz.z.toFixed(3) }, rackDims: { w: +(W + 0.08).toFixed(3), h: H, d: D }, pivots: { levels: [L1, L2, L3], hangBar: [0, L1 - 0.2, 0.12], zrack: zr && [zr.x, 0, zr.z] }, drawCalls: 3, verts, bays: nb };
  return g;
}
export default build;
