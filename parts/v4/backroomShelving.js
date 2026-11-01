// Tall dark-green steel backroom shelving (pallet-rack style uprights + beams + wire decks), 3 decks + floor level on blue pallets,
// mixed kraft + colourful cases (plain colour / light bands, no text or logos), stretch-wrapped pallets on top.
// opts: {seed=1, bays=3}. Bays along x (2.44 m each), depth 0.92 m, uprights 2.9 m, top loads to ≈4 m. Draw calls: 3 (steel vcMetal, goods cardboardVC, wrap).
import { mergeGeos, box, rng } from './_merge.js';
import { U, frame, level, fillCases, wrappedLoad, pallet, jitterHex } from './_rackKit.js';
const GREEN = '#22402e', KRAFT = ['#a57b52', '#9c744c', '#ae8558', '#94704b', '#b08a5e', '#8c6a46'];
const COLOR = ['#eeece5', '#e6e4dc', '#f1efe8', '#2d5ea8', '#a8302f', '#d39a2a', '#c8602e', '#2f6e4a', '#e9e6dc'];
export function build(THREE, mats, opts = {}) {
  const seed = opts.seed ?? 1, r = rng(seed * 7919 + 11), nb = Math.max(1, Math.round(opts.bays ?? 3)), BW = 2.44, D = 0.92, H = 2.9, W = nb * BW, x0 = -W / 2;
  const S = [], G = [], Wr = [], g = new THREE.Group(), LV = [0.98, 1.78, 2.62], colRate = 0.16 + r() * 0.12;
  const pick = (rr) => { if (rr() < colRate) { return jitterHex(THREE, COLOR[Math.floor(rr() * COLOR.length)], rr, 0.04); } return jitterHex(THREE, KRAFT[Math.floor(rr() * KRAFT.length)], rr, 0.07); };
  for (let f = 0; f <= nb; f++) frame(THREE, S, x0 + f * BW, D, H, GREEN, { nd: 5 });
  let topH = H;
  for (let b = 0; b < nb; b++) {
    const cx = x0 + (b + 0.5) * BW, iw = BW - 0.08, xa = cx - iw / 2, xb = cx + iw / 2;
    for (const y of LV) level(THREE, S, cx, y, iw, D, GREEN, '#5f6a62');
    // floor level: 2 blue pallets (slightly proud of the front) carrying cases
    for (const s of [-1, 1]) { const px = cx + s * (iw / 4 + 0.005); pallet(THREE, G, px, 0, 0.04, '#2f62b8', r, 1.14, 0.94); fillCases(THREE, G, r, px - 0.56, px + 0.56, 0.144, D, LV[0] - 0.144 - 0.16, pick, { minW: 0.3, maxW: 0.55 }); }
    for (let li = 0; li < 2; li++) fillCases(THREE, G, r, xa, xb, LV[li], D, LV[li + 1] - LV[li] - 0.14, pick, { minW: 0.26, maxW: 0.5 });
    // a few light cases with a plain coloured band (paper-towel / chip style, no print)
    for (let k = 0; k < 2; k++) { const li = Math.floor(r() * 2), x = xa + 0.25 + r() * (iw - 0.5), bh = 0.3; G.push(box(THREE, 0.4, bh, 0.38, x, LV[li] + bh / 2, D / 2 - 0.27, { c: '#f2f1ec', ...U })); G.push(box(THREE, 0.402, 0.1, 0.382, x, LV[li] + bh * 0.55, D / 2 - 0.27, { c: r() < 0.5 ? '#2a5fb8' : '#c0262d', ...U })); }
    // top: wrapped pallets
    for (const s of [-1, 1]) { const hh = 0.85 + r() * 0.45; topH = Math.max(topH, wrappedLoad(THREE, G, Wr, r, cx + s * (iw / 4 + 0.005), LV[2], 0, hh, { kraft: KRAFT, w: 1.14, d: 0.9 })); }
  }
  const steel = new THREE.Mesh(mergeGeos(THREE, S), mats.vcMetal || new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.4 })); steel.name = 'steel';
  const goods = new THREE.Mesh(mergeGeos(THREE, G), mats.cardboardVC || new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 })); goods.name = 'goods';
  const wrap = new THREE.Mesh(mergeGeos(THREE, Wr), mats.wrap || new THREE.MeshPhysicalMaterial({ color: 0xeef4f8, transparent: true, opacity: 0.35, roughness: 0.1, depthWrite: false, side: THREE.DoubleSide })); wrap.name = 'wrap'; wrap.renderOrder = 2;
  for (const m of [steel, goods]) { m.castShadow = m.receiveShadow = true; g.add(m); } wrap.castShadow = true; g.add(wrap);
  const bb = new THREE.Box3(); for (const m of g.children) { m.geometry.computeBoundingBox(); bb.union(m.geometry.boundingBox); } const sz = bb.getSize(new THREE.Vector3());
  const verts = {}; let tot = 0; for (const m of g.children) { verts[m.name] = m.geometry.attributes.position.count; tot += verts[m.name]; } verts.total = tot;
  g.userData = { name: 'backroomShelving', dims: { w: +sz.x.toFixed(3), h: +sz.y.toFixed(3), d: +sz.z.toFixed(3) }, rackDims: { w: +(W + 0.08).toFixed(3), h: H, d: D }, pivots: { levels: LV, floorPallets: 0 }, drawCalls: 3, verts, bays: nb };
  return g;
}
export default build;
