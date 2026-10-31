// Store backroom steel bay shelving (teardrop-style uprights + step beams + wire decks), loaded with kraft cases and a few coloured chocolate cases.
// opts: {seed=1, bays=3, colorRate=0.1, levels (4|5, default by seed), frame:'orange'|'grey' (default by seed)}
// Bays run along x (≈1.2 m each), depth along z (0.61 m), 2.4 m uprights. Draw calls: 2 (steel vcMetal, boxes cardboardVC). No text/logos.
import { mergeGeos, box, rng } from './_merge.js';
const KRAFT = ['#a57b52', '#9c744c', '#ae8558', '#94704b', '#a98056'];
const CHOC = ['#5b2a86', '#b3202c', '#d9a21e', '#1f4fa8', '#6b3a1e', '#2f7d3a'];
export function build(THREE, mats, opts = {}) {
  const seed = opts.seed ?? 1, r = rng(seed * 4241 + 7), nb = Math.max(1, Math.round(opts.bays ?? 3)), cRate = opts.colorRate ?? 0.1;
  const L = opts.levels ?? (r() < 0.5 ? 4 : 5), frameCol = opts.frame ?? (r() < 0.6 ? 'orange' : 'grey');
  const UP = frameCol === 'grey' ? '#7d838a' : '#ee8416', BEAM = frameCol === 'grey' ? '#8b9198' : '#f48e1a', DECK = '#9aa0a6';
  const BW = 1.22, D = 0.61, H = 2.4, W = nb * BW, x0 = -W / 2, g = new THREE.Group(), S = [], B = [];
  const metalM = mats.vcMetal || new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.5 });
  const cbM = mats.cardboardVC || new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 });
  // upright frames (one per bay edge): 2 posts, foot plates, horizontal + diagonal bracing on the end
  for (let f = 0; f <= nb; f++) {
    const x = x0 + f * BW;
    for (const z of [-D / 2 + 0.035, D / 2 - 0.035]) { S.push(box(THREE, 0.075, H, 0.07, x, H / 2, z, { c: UP })); S.push(box(THREE, 0.12, 0.01, 0.12, x, 0.005, z, { c: '#5d6166' })); }
    for (const y of [0.12, H - 0.08]) S.push(box(THREE, 0.04, 0.035, D - 0.1, x, y, 0, { c: UP }));
    const nd = 4, span = (H - 0.2) / nd;
    for (let i = 0; i < nd; i++) { const len = Math.hypot(span, D - 0.14), a = Math.atan2(D - 0.14, span) * (i % 2 ? 1 : -1); S.push(box(THREE, 0.03, len, 0.025, x, 0.12 + span * (i + 0.5), 0, { rx: a, c: UP })); }
  }
  const ys = Array.from({ length: L }, (_, i) => 0.14 + i * (H - 0.34) / (L - 1));
  for (let b = 0; b < nb; b++) {
    const cx = x0 + (b + 0.5) * BW, iw = BW - 0.08;
    for (let li = 0; li < L; li++) {
      const y = ys[li];
      for (const z of [-D / 2 + 0.035, D / 2 - 0.035]) S.push(box(THREE, iw, 0.11, 0.05, cx, y - 0.055, z, { c: BEAM }));
      S.push(box(THREE, iw - 0.01, 0.012, D - 0.08, cx, y + 0.006, 0, { c: DECK })); // wire deck (flat)
      for (const k of [-0.33, 0, 0.33]) S.push(box(THREE, 0.02, 0.03, D - 0.1, cx + k * iw, y - 0.01, 0, { c: '#7a7f85' })); // deck channels
      // load: rows of cases along x, sometimes stacked 2 high, clearance below next level
      const clear = li < L - 1 ? ys[li + 1] - y - 0.13 : 0.42; if (r() < 0.04) continue; // rare empty shelf
      let x = cx - iw / 2 + 0.01, fill = 0.82 + r() * 0.18;
      while (x < cx - iw / 2 + iw * fill) {
        const bw = 0.24 + r() * 0.2; if (x + bw > cx + iw / 2 - 0.01) break;
        const choc = r() < cRate, bh = Math.min(clear - 0.02, choc ? 0.16 + r() * 0.08 : 0.24 + r() * 0.22), bd = D - 0.08 - r() * 0.08;
        const zz = (D - 0.1 - bd) / 2 * (r() < 0.6 ? 1 : -1) * 0.9, col = () => { const c = new THREE.Color(choc ? CHOC[Math.floor(r() * CHOC.length)] : KRAFT[Math.floor(r() * KRAFT.length)]); c.offsetHSL((r() - 0.5) * 0.02, 0, (r() - 0.5) * 0.05); return '#' + c.getHexString(); };
        const c1 = col(); B.push(box(THREE, bw - 0.012, bh, bd, x + bw / 2, y + 0.012 + bh / 2, zz, { c: c1, ry: (r() - 0.5) * 0.06 }));
        if (choc) B.push(box(THREE, bw - 0.01, bh * 0.22, bd + 0.002, x + bw / 2, y + 0.012 + bh * 0.62, zz, { c: '#f1ece0', uv: [0.2, 0.2], ry: 0 })); // plain light band
        if (clear - bh > 0.16 && r() < 0.7) { const bh2 = Math.min(clear - bh - 0.03, 0.14 + r() * 0.2), w2 = bw * (0.7 + r() * 0.28); B.push(box(THREE, w2 - 0.012, bh2, bd * (0.75 + r() * 0.25), x + bw / 2 + (r() - 0.5) * 0.03, y + 0.012 + bh + bh2 / 2, zz, { c: col(), ry: (r() - 0.5) * 0.1 })); }
        x += bw + r() * 0.01;
      }
    }
  }
  const steel = new THREE.Mesh(mergeGeos(THREE, S), metalM); steel.name = 'steel'; steel.castShadow = steel.receiveShadow = true; g.add(steel);
  const boxes = new THREE.Mesh(mergeGeos(THREE, B), cbM); boxes.name = 'boxes'; boxes.castShadow = boxes.receiveShadow = true; g.add(boxes);
  const verts = { steel: steel.geometry.attributes.position.count, boxes: boxes.geometry.attributes.position.count };
  g.userData = { name: 'divShelving', dims: { w: +(W + 0.075).toFixed(3), h: H, d: D }, pivots: { shelfLevels: ys.map(v => +v.toFixed(3)) }, drawCalls: 2, verts, bays: nb, levels: L, frame: frameCol };
  return g;
}
export default build;
