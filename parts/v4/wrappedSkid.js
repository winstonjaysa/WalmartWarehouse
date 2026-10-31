// Stretch-wrapped mixed-carton skid on a 48x40 pallet, ~1.9 m tall. opts: {seed, height}
import { mergeGeos, box, rng } from './_merge.js';
import { palletGeo, PALLET } from './_pallet.js';
const KRAFT = ['#b8865a', '#a97a4c', '#c4966a', '#9a6e44', '#bb8d5e', '#b07f50', '#c9a070'];
export function build(THREE, mats, opts = {}) {
  const seed = opts.seed ?? 1, H = opts.height ?? 1.9, r = rng(seed * 9973 + 17);
  const g = new THREE.Group();
  const woodM = mats.woodVC || new THREE.MeshStandardMaterial({ color: 0xc49a66, vertexColors: true, roughness: 0.9 });
  const cbM = mats.cardboardVC || new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.9 });
  const wrapM = mats.wrap || new THREE.MeshPhysicalMaterial({ color: 0xeef4f8, transparent: true, opacity: 0.35, roughness: 0.1, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide });
  const pallet = new THREE.Mesh(palletGeo(THREE, seed, undefined, opts.palletColor), woodM); pallet.name = 'pallet'; pallet.castShadow = pallet.receiveShadow = true; g.add(pallet);

  // --- cartons: layers, each footprint split by random guillotine cuts
  const LW = 1.2, LD = 1.0, y0 = PALLET.h, cartons = [];
  const PRINT = ['#c8102e', '#1d4f91', '#2e7d32', '#f2a900', '#222222', '#6a1b9a', '#e65100'];
  const _c = new THREE.Color(), _h = {};
  const vary = (hex) => { _c.set(hex).getHSL(_h); _c.setHSL((_h.h + (r() - 0.5) * 0.024 + 1) % 1, _h.s * (0.94 + r() * 0.12), Math.min(1, _h.l * (0.94 + r() * 0.12))); return '#' + _c.getHexString(); }; // ±6% value, slight hue shift per carton
  const colour = () => vary(r() < 0.16 ? '#e8e6e0' : r() < 0.06 ? '#9c4a3a' : KRAFT[Math.floor(r() * KRAFT.length)]);
  function split(x, z, w, d, depth, out) {
    const minS = 0.22;
    if (depth <= 0 || (w < minS * 2 && d < minS * 2) || (depth < 2 && r() < 0.25)) { out.push([x, z, w, d]); return; }
    const alongX = w / d > 1.25 ? true : d / w > 1.25 ? false : r() < 0.5;
    const L = alongX ? w : d; if (L < minS * 2) { out.push([x, z, w, d]); return; }
    const t = minS + r() * (L - 2 * minS);
    if (alongX) { split(x, z, t, d, depth - 1, out); split(x + t, z, w - t, d, depth - 1, out); }
    else { split(x, z, w, t, depth - 1, out); split(x, z + t, w, d - t, depth - 1, out); }
  }
  let y = y0; const top = H - 0.012;
  while (y < top - 0.05) {
    let lh = 0.24 + r() * 0.24; if (top - y - lh < 0.18) lh = top - y;
    const cells = []; split(-LW / 2, -LD / 2, LW, LD, 3, cells);
    for (const [cx, cz, cw, cd] of cells) {
      const stackN = lh > 0.36 && r() < 0.35 ? 2 : 1;
      for (let s = 0; s < stackN; s++) {
        const hh = lh / stackN, gap = 0.006 + r() * 0.012;
        const w = cw - gap, d = cd - gap, h = hh - 0.003 - (r() < 0.2 ? r() * 0.03 : 0);
        const px = cx + cw / 2 + (r() - 0.5) * 0.008, pz = cz + cd / 2 + (r() - 0.5) * 0.008, py = y + s * hh + h / 2;
        const ry = (r() - 0.5) * 0.03;
        cartons.push(box(THREE, w, h, d, px, py, pz, { ry, c: colour() }));
        // printed case look (~20%): colour band + generic logo block on outward faces
        if (r() < 0.22) {
          const pc = PRINT[Math.floor(r() * PRINT.length)], bh = h * (0.18 + r() * 0.12), by = py + h * (r() < 0.5 ? 0.25 : -0.25), U = { uv: [0.2, 0.2] };
          if (pz + d / 2 > LD / 2 - 0.05) { cartons.push(box(THREE, w * 0.98, bh, 0.002, px, by, pz + d / 2 + 0.0012, { ...U, c: pc }), box(THREE, w * 0.3, h * 0.22, 0.002, px - w * 0.2, py - (by - py) * 0.6, pz + d / 2 + 0.0012, { ...U, c: r() < 0.5 ? pc : '#ffffff' }), box(THREE, w * 0.4, h * 0.05, 0.002, px + w * 0.15, py - (by - py) * 0.6, pz + d / 2 + 0.0013, { ...U, c: '#333333' })); }
          if (px + w / 2 > LW / 2 - 0.05) { cartons.push(box(THREE, 0.002, bh, d * 0.98, px + w / 2 + 0.0012, by, pz, { ...U, c: pc }), box(THREE, 0.002, h * 0.22, d * 0.3, px + w / 2 + 0.0012, py - (by - py) * 0.6, pz - d * 0.2, { ...U, c: '#ffffff' })); }
        }
        // shipping label on outward faces
        if (r() < 0.45) {
          const lw = 0.1, lhh = 0.15;
          if (pz + d / 2 > LD / 2 - 0.05) cartons.push(box(THREE, Math.min(lw, w * 0.6), Math.min(lhh, h * 0.6), 0.002, px + (r() - 0.5) * w * 0.3, py, pz + d / 2 + 0.001, { c: '#fbfbf7', uv: [0.2, 0.2] }));
          else if (px + w / 2 > LW / 2 - 0.05) cartons.push(box(THREE, 0.002, Math.min(lhh, h * 0.6), Math.min(lw, d * 0.6), px + w / 2 + 0.001, py, pz + (r() - 0.5) * d * 0.3, { c: '#fbfbf7', uv: [0.2, 0.2] }));
        }
      }
    }
    y += lh;
  }
  // pallet label sheet (letter size) outside the film, front face, plus black barcode stripes
  const lz = LD / 2 + 0.03, ly = 1.15;
  cartons.push(box(THREE, 0.216, 0.279, 0.003, 0.2, ly, lz, { c: '#ffffff', uv: [0.2, 0.2] }));
  for (let i = 0; i < 9; i++) cartons.push(box(THREE, 0.16, i % 3 ? 0.006 : 0.014, 0.001, 0.2, ly + 0.11 - i * 0.022, lz + 0.002, { c: i < 3 ? '#222222' : '#777777', uv: [0.2, 0.2] }));
  cartons.push(box(THREE, 0.18, 0.05, 0.001, 0.2, ly - 0.09, lz + 0.002, { c: '#111111', uv: [0.2, 0.2] }));
  const load = new THREE.Mesh(mergeGeos(THREE, cartons), cbM); load.name = 'cartons'; load.castShadow = load.receiveShadow = true; g.add(load);

  // --- stretch wrap shell: bulged box (no bottom) + overlapping bands for extra opacity
  const hw = 0.615, hd = 0.515, yb = 0.05;
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
  const film = [...sides(yb, H, 0, true), ...sides(0.04, 0.32, 0.004), ...sides(0.85, 1.12, 0.004), ...sides(1.55, 1.8, 0.005), ...sides(0.05, 0.2, 0.007)];
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
  for (const sx of [1, -1]) for (const sz of [1, -1]) for (let i = 0; i < 6; i++) lump(sx * (hw - 0.008), 0.3 + i * 0.27 + r() * 0.1, sz * (hd - 0.008), 0.022, 0.08 + r() * 0.06, 0.022);
  const wrap = new THREE.Mesh(mergeGeos(THREE, film), wrapM); wrap.name = 'wrap'; wrap.renderOrder = 2; g.add(wrap);

  g.userData = { name: 'wrappedSkid', dims: { w: 1.27, h: H + 0.01, d: 1.07 }, pivots: {}, drawCalls: 3, seed };
  return g;
}
