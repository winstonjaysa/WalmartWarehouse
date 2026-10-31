// DSD soft-drink skid: mixed (default) or uniform stack of beverage goods on a CHEP-blue pallet, optional stretch wrap.
// opts: {seed=1, mix:'mixed'|'uniform', wrapped=true, palletColor='blue', detail:'low'|'high' (low default: ≤15k verts total, bottle tops only on visible faces, single-box cartons/crates with vertex-colour bands, coarse wrap)}
// Draw calls: pallet (woodVC) + opaque goods (vc: crates, cartons, trays, caps, label bands) + clear bottles/shrink film (vertex-colour physical) + wrap = 4 (3 unwrapped).
// No logos or brand text: plain colour bands only.
import { mergeGeos, box, cyl, rng } from './_merge.js';
import { palletGeo, PALLET } from './_pallet.js';
const _clear = new WeakMap(), _low = new WeakMap();
// low detail: 1×64 multiplier strip (v: bottom→top) = carton seam, darker same-hue band, white body; side faces tile it per carton
function lowMat(THREE, mats) { let m = _low.get(mats); if (m) return m; const N = 64, d = new Uint8Array(N * 4);
  for (let i = 0; i < N; i++) { const v = (i + 0.5) / N, k = v < 0.035 || v > 0.965 ? 0.5 : (v > 0.16 && v < 0.3 ? 0.62 : (v > 0.3 && v < 0.33 ? 0.9 : 1)); d.set([k * 255, k * 255, k * 255, 255], i * 4); }
  const t = new THREE.DataTexture(d, 1, N); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.needsUpdate = true;
  m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.58, metalness: 0, map: t }); _low.set(mats, m); return m; }
export function setWrapped(group, on) { const u = group?.userData, w = u?.wrap; if (!w) return; w.visible = !!on; u.drawCalls = group.children.filter(c => c.visible).length; u.wrapped = !!on; if (u.dimsWrapped) u.dims = { ...(on ? u.dimsWrapped : u.dimsBare) }; }
export function build(THREE, mats, opts = {}) {
  const seed = opts.seed ?? 1, r = rng(seed * 7919 + 3), mix = opts.mix === 'uniform' ? 'uniform' : 'mixed', lo = opts.detail !== 'high', g = new THREE.Group();
  const woodM = mats.woodVC || new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82 });
  const vcM = mats.vc || new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62 });
  let clearM = _clear.get(mats); if (!clearM) { clearM = new THREE.MeshPhysicalMaterial({ vertexColors: true, transparent: true, opacity: 0.8, roughness: 0.12, metalness: 0, clearcoat: 1, depthWrite: false }); _clear.set(mats, clearM); }
  const wrapM = mats.wrap || new THREE.MeshPhysicalMaterial({ color: 0xeef4f8, transparent: true, opacity: 0.35, roughness: 0.1, depthWrite: false, side: THREE.DoubleSide });
  const pallet = new THREE.Mesh(palletGeo(THREE, seed, undefined, opts.palletColor ?? 'blue'), woodM); pallet.name = 'pallet'; pallet.castShadow = pallet.receiveShadow = true; g.add(pallet);
  const O = [], C = [], pick = a => a[Math.floor(r() * a.length)];
  // ---- unit builders: each fills a cell (x,z centre, w along x, d along z) from y0; returns its height
  const texBox = (w, h, d, x, y, z, c, rep = 1) => { const q = new THREE.BoxGeometry(w, h, d), n = q.attributes.normal, uv = q.attributes.uv, ca = new Float32Array(n.count * 3), A = new THREE.Color(c);
    for (let i = 0; i < n.count; i++) { ca.set([A.r, A.g, A.b], i * 3); if (Math.abs(n.getY(i)) > 0.5) uv.setXY(i, 0.5, 0.6); else uv.setY(i, uv.getY(i) * rep); }
    q.setAttribute('color', new THREE.BufferAttribute(ca, 3)); q.translate(x, y, z); return q; };
  const topG = (bx, y, bz, rr, hh, liq, cap) => { const q = new THREE.CylinderGeometry(rr * 0.38, rr, hh, 5, 1, true), p = q.attributes.position, n = p.count, col = new Float32Array(n * 3), A = new THREE.Color(liq), B = new THREE.Color(cap);
    for (let i = 0; i < n; i++) { const k = p.getY(i) > 0 ? B : A; col.set([k.r, k.g, k.b], i * 3); } q.setAttribute('color', new THREE.BufferAttribute(col, 3)); for (let i = 0; i < n; i++) q.attributes.uv.setXY(i, 0.5, 0.6); q.translate(bx, y, bz); q.userData.top = true; return q; };
  let CELL = { ci: 1, ri: 1, rows: 3, top: true }; // set per cell by layer(); used by low-detail visibility
  const CARTON = ['#c8202a', '#1f4fb4', '#b9bec4', '#1f8a3a', '#f2f2ee', '#d6461f', '#7a1c2c', '#e9c21a'];
  const carton = (x, y0, z, w, d, col, two = true, bandU) => { // 12-can fridge pack(s), plain colour bands
    const h = 0.128, n = two ? 2 : 1;
    if (lo) { const H2 = n * (h + 0.002) - 0.002; O.push(texBox(w - 0.006, H2, d - 0.006, x, y0 + H2 / 2, z, col || pick(CARTON), n)); return n * (h + 0.002); } // one box, texture bands per carton
    for (let k = 0; k < n; k++) {
      const cw = w - 0.006, cd = d - 0.006, y = y0 + k * (h + 0.002) + h / 2, c = col || pick(CARTON), band = bandU || (c === '#f2f2ee' || c === '#b9bec4' ? pick(['#c8202a', '#1f4fb4', '#1f8a3a']) : (r() < 0.5 ? '#f4f4f0' : '#b9bec4'));
      O.push(box(THREE, cw, h, cd, x, y, z, { c }));
      O.push(box(THREE, cw + 0.002, 0.022, cd + 0.002, x, y - h * 0.18, z, { c: band })); // wrap-around colour band
      O.push(box(THREE, cw * 0.18, h * 0.5, cd + 0.003, x - cw * 0.3, y + 0.012, z, { c: '#c9ced3' })); // can-end window (silver)
      O.push(box(THREE, cw * 0.18, h * 0.5, 0.003, x - cw * 0.3, y + 0.012, z, { c: '#c9ced3' }));
    }
    return n * (h + 0.002);
  };
  const bottles = (x, y0, z, w, d, nx, nz, bh, liquid, capC, bandC, tray) => { // nx×nz grid; bodies only on the outer ring
    const sx = w / nx, sz = d / nz, rr = Math.min(sx, sz) * 0.46;
    if (lo) { // tray/body shell as one box + tops only for bottles on the skid's outer faces (all ring on the top layer)
      if (tray) O.push(box(THREE, w - 0.004, 0.045, d - 0.004, x, y0 + 0.0225, z, { c: tray }));
      const { ci, ri, rows, top } = CELL;
      for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
        const ring = i === 0 || j === 0 || i === nx - 1 || j === nz - 1, outer = (ci === 0 && i === 0) || (ci === 2 && i === nx - 1) || (ri === 0 && j === 0) || (ri === rows - 1 && j === nz - 1);
        if (!((outer || (top && ring)) && (i + j) % 2 === 0)) continue; // staggered tops keep the bottle rhythm at half the cost
        O.push(topG(x - w / 2 + sx * (i + 0.5), y0 + bh * 0.84, z - d / 2 + sz * (j + 0.5), rr, bh * 0.3, liquid, capC));
      }
      if (!tray) return bh; // crate: no body band
      return bh;
    }
    if (tray) O.push(box(THREE, w - 0.004, 0.045, d - 0.004, x, y0 + 0.0225, z, { c: tray }));
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const bx = x - w / 2 + sx * (i + 0.5), bz = z - d / 2 + sz * (j + 0.5), ring = i === 0 || j === 0 || i === nx - 1 || j === nz - 1;
      if (ring) { C.push(cyl(THREE, rr, rr, bh * 0.72, 6, bx, y0 + bh * 0.36 + 0.002, bz, { c: liquid })); C.push(cyl(THREE, rr * 0.34, rr, bh * 0.2, 6, bx, y0 + bh * 0.82, bz, { c: liquid })); }
      else C.push(cyl(THREE, rr * 0.34, rr, bh * 0.2, 5, bx, y0 + bh * 0.82, bz, { c: liquid, open: true }));
      O.push(cyl(THREE, rr * 0.36, rr * 0.36, bh * 0.07, 6, bx, y0 + bh * 0.955, bz, { c: capC }));
      if (bandC && ring) O.push(cyl(THREE, rr * 1.03, rr * 1.03, bh * 0.22, 6, bx, y0 + bh * 0.42, bz, { c: bandC }));
    }
    return bh;
  };
  const shrink = (x, y0, z, w, d, h) => { if (lo) return; for (const s of [-1, 1]) O.push(box(THREE, w - 0.01, 0.012, 0.003, x, y0 + h * 0.62, z + s * (d / 2 - 0.004), { c: '#e8eef2' })); }; // shrink-film seam (clear film itself is implied by the bottles)
  const SPORT = [['#f07a1a', '#f07a1a'], ['#2a7fd8', '#1d4fa8'], ['#d3253a', '#a81a2a'], ['#7cc63a', '#3d8a22'], ['#9a3fc8', '#6a2a98']];
  const SODA = [['#2a1408', '#c8202a'], ['#2a1408', '#1f4fb4'], ['#c9e88a', '#1f8a3a'], ['#3a1a10', '#7a1c2c'], ['#f2c21a', '#e06a14']];
  const UNITS = {
    crate: { h: 0.245, rows: 3, f(x, y0, z, w, d) { const c = pick(['#16181c', '#16181c', '#1a3d8c', '#1d2f6e']), cw = w - 0.008, cd = d - 0.008, wh = 0.16, t = 0.012, [liq, band] = pick(SODA);
      if (lo) { O.push(box(THREE, cw, 0.16, cd, x, y0 + 0.08, z, { c })); bottles(x, y0 + 0.012, z, cw - 0.03, cd - 0.03, 6, 4, 0.23, liq, band, band); return 0.245; }
      O.push(box(THREE, cw, 0.012, cd, x, y0 + 0.006, z, { c })); for (const s of [-1, 1]) { O.push(box(THREE, cw, wh, t, x, y0 + wh / 2, z + s * (cd / 2 - t / 2), { c })); O.push(box(THREE, t, wh, cd, x + s * (cw / 2 - t / 2), y0 + wh / 2, z, { c })); }
      O.push(box(THREE, cw * 0.98, 0.05, cd + 0.004, x, y0 + 0.035, z, { c })); // solid lower band
      bottles(x, y0 + 0.012, z, cw - 0.03, cd - 0.03, 6, 4, 0.23, liq, band, band); return 0.245; } },
    tray: { h: 0.24, rows: 4, f(x, y0, z, w, d) { const [liq, cap] = pick(SPORT); if (lo) O.push(texBox(w - 0.01, 0.17, d - 0.01, x, y0 + 0.13, z, liq)); const hh = bottles(x, y0, z, w - 0.006, d - 0.006, 6, 4, 0.235, liq, cap, r() < 0.25 ? '#f4f4f0' : cap, r() < 0.3 ? '#f2f2ee' : '#a88458'); shrink(x, y0, z, w, d, hh); return hh + 0.004; } },
    water: { h: 0.225, rows: 4, f(x, y0, z, w, d) { if (lo) O.push(texBox(w - 0.01, 0.16, d - 0.01, x, y0 + 0.125, z, '#cfe6f4')); const hh = bottles(x, y0, z, w - 0.006, d - 0.006, 6, 4, 0.22, '#bfe0f2', pick(['#2a6fd0', '#e8eef2', '#1d4fa8']), r() < 0.6 ? '#3a86d8' : null, '#f2f2ee'); shrink(x, y0, z, w, d, hh); return hh + 0.004; } },
    carton: { h: 0.26, rows: 4, f(x, y0, z, w, d) { return carton(x, y0, z, w, d); } },
    jug: { h: 0.29, rows: 4, f(x, y0, z, w, d) { const liq = pick(['#d8ecf6', '#e8eef0', '#f3c25a']); // two 4 L jugs per cell
      for (const s of [-1, 1]) { const jx = x + s * w / 4; C.push(box(THREE, w / 2 - 0.02, 0.24, d - 0.02, jx, y0 + 0.12, z, { c: liq })); C.push(cyl(THREE, 0.025, (d - 0.02) * 0.45, 0.04, 6, jx, y0 + 0.26, z, { c: liq })); O.push(cyl(THREE, 0.022, 0.022, 0.022, 8, jx, y0 + 0.288, z, { c: pick(['#2a6fd0', '#f4f4f0', '#1f8a3a']) })); if (!lo) { O.push(box(THREE, 0.025, 0.06, 0.06, jx + s * 0.05, y0 + 0.225, z, { c: liq })); O.push(box(THREE, w / 2 - 0.018, 0.06, d - 0.018, jx, y0 + 0.14, z, { c: pick(['#f4f4f0', '#2a6fd0', '#1f8a3a']) })); } }
      return 0.29; } },
  };
  // ---- layers: 3 columns along x (0.40) × rows along z (cell depth from unit)
  const W = 1.2, D = 1.02, colW = W / 3; let y = PALLET.h;
  const layer = (types, partial, dx, dz) => { // types: per column unit type
    let top = 0;
    for (let ci = 0; ci < 3; ci++) { const u = UNITS[types[ci]], rows = u.rows, rd = D / rows, x = -W / 2 + colW * (ci + 0.5) + dx + (r() - 0.5) * 0.012;
      for (let ri = 0; ri < rows; ri++) { if (partial && r() < 0.4) continue; CELL = { ci, ri, rows, top: partial }; if (lo && !partial && ci === 1 && ri > 0 && ri < rows - 1) { top = Math.max(top, u.h); continue; } const z = -D / 2 + rd * (ri + 0.5) + dz + (r() - 0.5) * 0.012; top = Math.max(top, u.f(x, y, z, colW, rd)); } }
    y += top + 0.003;
  };
  if (mix === 'uniform') {
    if (lo) { // one box per column, 13 carton rows: vertex-colour seams/bands per row; interior columns skipped
      for (let ci = 0; ci < 3; ci++) for (let ri = 0; ri < 4; ri++) { if (ci === 1 && (ri === 1 || ri === 2)) continue;
        const Hc = 13 * 0.132; O.push(texBox(colW - 0.006, Hc, 0.244, -W / 2 + colW * (ci + 0.5), y + Hc / 2, -0.5 + 0.25 * (ri + 0.5), '#1d47b0', 13)); }
    } else
    for (let l = 0; l < 13; l++) for (let ci = 0; ci < 3; ci++) for (let ri = 0; ri < 4; ri++) carton(-W / 2 + colW * (ci + 0.5), y + l * 0.132, -0.5 + 0.25 * (ri + 0.5), colW, 0.25, '#1d47b0', false, '#3d6fd8');
    y += 13 * 0.132;
  } else {
    const nCr = 1 + Math.floor(r() * 2); for (let i = 0; i < nCr; i++) layer(['crate', 'crate', 'crate'], false, (r() - 0.5) * 0.02, (r() - 0.5) * 0.02);
    const pool = ['tray', 'carton', 'water', 'tray', 'carton', 'carton'];
    while (y < 1.52) { const t = pick(pool), split = r() < 0.4 ? pick(pool) : t, side = Math.floor(r() * 3); layer([0, 1, 2].map(i => i === side ? split : t), false, (r() - 0.5) * 0.05, (r() - 0.5) * 0.04); }
    const need = 1.8 - y, cand = Object.keys(UNITS).filter(k => k !== 'crate' && UNITS[k].h >= need).sort((a, b) => UNITS[a].h - UNITS[b].h), tt = cand.length ? cand[Math.floor(r() * Math.min(2, cand.length))] : 'jug';
    layer([0, 1, 2].map(() => (r() < 0.35 ? 'jug' : tt)), true, (r() - 0.5) * 0.04, (r() - 0.5) * 0.04);
  }
  if (lo) { // hard budget: ≤15k verts total (wrap ≈1.7k) – thin out bottle tops evenly if a seed overshoots
    const vc = q => (q.index ? q.index.count : q.attributes.position.count), WRAPV = 1800, BUDGET = 15000 - WRAPV - pallet.geometry.attributes.position.count;
    let tot = [...O, ...C].reduce((a, q) => a + vc(q), 0); const T = O.filter(q => q.userData.top);
    for (let step = 3; tot > BUDGET && T.length; ) { for (let i = T.length - 1; i >= 0 && tot > BUDGET; i -= step) { const q = T[i]; O.splice(O.indexOf(q), 1); T.splice(i, 1); tot -= vc(q); } }
  }
  const goods = new THREE.Mesh(mergeGeos(THREE, O), lo ? lowMat(THREE, mats) : vcM); goods.name = 'goods'; goods.castShadow = goods.receiveShadow = true; g.add(goods);
  const clear = new THREE.Mesh(mergeGeos(THREE, C.length ? C : [box(THREE, 0.001, 0.001, 0.001, 0, 0.1, 0, { c: '#ffffff' })]), clearM); clear.name = 'bottlesFilm'; clear.renderOrder = 1; clear.castShadow = true; if (C.length) g.add(clear);
  const H = y + 0.012;
  const hw = 0.625, hd = 0.535, yb = 0.05;
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
    const parts = [], h = y2 - y1, ym = (y1 + y2) / 2, segH = Math.max(lo ? 1 : 2, Math.round(h / (lo ? 0.45 : 0.1))), SG = lo ? 4 : 10;
    const P = (w, rot, x, z) => { const q = new THREE.PlaneGeometry(w, h, SG, segH); q.rotateY(rot); q.translate(x, ym, z); return q; };
    parts.push(P(2 * hw, 0, 0, hd), P(2 * hw, Math.PI, 0, -hd), P(2 * hd, Math.PI / 2, hw, 0), P(2 * hd, -Math.PI / 2, -hw, 0));
    if (withTop) { const t = new THREE.PlaneGeometry(2 * hw, 2 * hd, SG, SG); t.rotateX(-Math.PI / 2); t.translate(0, H, 0); parts.push(t); }
    return parts.map(q => bulge(q, out));
  }
  const film = lo ? [...sides(yb, H, 0, true), ...sides(0.04, 0.32, 0.004), ...sides(H - 0.36, H - 0.1, 0.005)] : [...sides(yb, H, 0, true), ...sides(0.04, 0.32, 0.004), ...sides(0.85, 1.12, 0.004), ...sides(H - 0.36, H - 0.1, 0.005), ...sides(0.05, 0.2, 0.007)];
  // film tail: extra layers wrapping the pallet deck + rolled rope of film
  film.push(...(lo ? sides(0.02, 0.17, 0.009) : [...sides(0.02, 0.17, 0.009), ...sides(0.06, 0.15, 0.011), ...sides(0.09, 0.14, 0.013)]));
  for (const [ax, az, len, ry] of [[0, hd + 0.03, 2 * hw, 0], [0, -hd - 0.03, 2 * hw, 0], [hw + 0.03, 0, 2 * hd, Math.PI / 2], [-hw - 0.03, 0, 2 * hd, Math.PI / 2]]) {
    const rope = new THREE.CylinderGeometry(0.012, 0.012, len, lo ? 4 : 8, lo ? 2 : 6); const rp = rope.attributes.position;
    for (let i = 0; i < rp.count; i++) rp.setX(i, rp.getX(i) + Math.sin(rp.getY(i) * 9) * 0.004);
    rope.rotateZ(Math.PI / 2); rope.rotateY(ry); rope.translate(ax, 0.125 + (r() - 0.5) * 0.02, az); film.push(rope);
  }
  // bunched-film lumps along top edges and vertical corners
  const lump = (x, yy, z, sx, sy, sz) => { const q = new THREE.SphereGeometry(1, lo ? 4 : 8, lo ? 2 : 6); q.scale(sx, sy, sz); q.translate(x, yy, z); film.push(q); };
  for (let i = 0, N = lo ? 4 : 9; i < N; i++) { const t = -0.9 + i * 1.8 / (N - 1); lump(t * hw, H - 0.01, hd * 0.99, 0.07 + r() * 0.05, 0.02, 0.025); lump(t * hw, H - 0.01, -hd * 0.99, 0.07 + r() * 0.05, 0.02, 0.025); }
  for (let i = 0, N = lo ? 3 : 7; i < N; i++) { const t = -0.85 + i * 1.7 / (N - 1); lump(hw * 0.99, H - 0.01, t * hd, 0.025, 0.02, 0.07 + r() * 0.05); lump(-hw * 0.99, H - 0.01, t * hd, 0.025, 0.02, 0.07 + r() * 0.05); }
  for (const sx of [1, -1]) for (const sz of [1, -1]) for (let i = 0; i < (lo ? 3 : 6); i++) lump(sx * (hw - 0.008), Math.min(H - 0.1, 0.3 + i * (H - 0.45) / 5 + r() * 0.1), sz * (hd - 0.008), 0.022, 0.08 + r() * 0.06, 0.022);
  const wrap = new THREE.Mesh(mergeGeos(THREE, film), wrapM); wrap.name = 'wrap'; wrap.renderOrder = 2; g.add(wrap);
  const dimsOf = ms => { const bb = new THREE.Box3(); for (const m of ms) { m.geometry.computeBoundingBox(); bb.union(m.geometry.boundingBox); } const sz = bb.getSize(new THREE.Vector3()); return { w: +sz.x.toFixed(3), h: +bb.max.y.toFixed(3), d: +sz.z.toFixed(3) }; };
  const dimsWrapped = dimsOf(g.children), dimsBare = dimsOf(g.children.filter(m => m !== wrap));
  const verts = {}; for (const m of g.children) verts[m.name] = m.geometry.attributes.position.count;
  g.userData = { name: 'beverageSkid', dims: { ...dimsWrapped }, dimsWrapped, dimsBare, pivots: {}, drawCalls: g.children.length, wrap, mix, detail: lo ? 'low' : 'high', verts, wrapped: true };
  setWrapped(g, opts.wrapped !== false);
  return g;
}
export default build;
