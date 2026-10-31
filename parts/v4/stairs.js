// stairs — Walmart Canada 1st-floor staff area (low poly, r160). See userData for dims/pivots.
import { mergeGeos, box, cyl, tint, rng } from './_merge.js';
// --- inline low-poly kit (same in each floor-1 module; no shared file) ---
const V3 = (THREE, a) => new THREE.Vector3(a[0], a[1], a[2]);
// cylinder rod from a to b (radius r, seg sides), tinted c
function rod(THREE, a, b, r, seg, c) {
  const A = V3(THREE, a), B = V3(THREE, b), d = B.clone().sub(A), L = d.length();
  const g = new THREE.CylinderGeometry(r, r, L, seg, 1); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()));
  const m = A.add(B).multiplyScalar(0.5); g.translate(m.x, m.y, m.z); return tint(THREE, g, c);
}
// rectangular bar from a to b (w across, h up), tinted c; best for bars in a vertical plane
function bar(THREE, a, b, w, h, c) {
  const A = V3(THREE, a), B = V3(THREE, b), d = B.clone().sub(A), L = d.length();
  const g = new THREE.BoxGeometry(w, h, L); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), d.normalize()));
  const m = A.add(B).multiplyScalar(0.5); g.translate(m.x, m.y, m.z); return tint(THREE, g, c);
}
const B_ = (THREE, w, h, d, x, y, z, c, o = {}) => box(THREE, w, h, d, x, y, z, { ...o, c });
// rotate a list of geometries about y then move
function xf(list, ry, x, y, z) { for (const g of list) { if (ry) g.rotateY(ry); g.translate(x, y, z); } return list; }
function mesh(THREE, geos, mat, name) { const m = new THREE.Mesh(mergeGeos(THREE, geos), mat); m.name = name; m.castShadow = m.receiveShadow = true; return m; }
// centre footprint on origin (x/z), floor at y=0; fill userData
function finish(THREE, g, name, pivots, extra = {}) {
  const bb = new THREE.Box3().setFromObject(g), c = bb.getCenter(new THREE.Vector3());
  for (const ch of g.children) { ch.position.x -= c.x; ch.position.z -= c.z; }
  const s = bb.getSize(new THREE.Vector3()), r = (v) => Math.round(v * 1000) / 1000;
  let drawCalls = 0, verts = 0; g.traverse(o => { if (o.isMesh) { drawCalls++; verts += o.geometry.attributes.position.count; } });
  g.userData = { name, dims: { w: r(s.x), h: r(bb.max.y), d: r(s.z) }, pivots, drawCalls, verts, offset: [-c.x, 0, -c.z], ...extra };
  return g;
}
function matsOf(THREE, mats) {
  return {
    vc: mats.vc || new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.62, metalness: 0 }),
    vm: mats.vcMetal || new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.5, metalness: 0.5 }),
  };
}
// stacking chair, front faces +z, seat top 0.45 m
function chair(THREE, P, M, seatC, ry, x, z, legC = '#3a3d42') {
  const p = [], m = [];
  p.push(B_(THREE, 0.44, 0.035, 0.42, 0, 0.4325, 0.01, seatC), B_(THREE, 0.42, 0.26, 0.03, 0, 0.74, -0.205, seatC, { rx: -0.1 }));
  for (const sx of [-1, 1]) {
    m.push(rod(THREE, [sx * 0.2, 0, 0.19], [sx * 0.2, 0.415, 0.18], 0.011, 6, legC));
    m.push(rod(THREE, [sx * 0.2, 0, -0.2], [sx * 0.2, 0.86, -0.235], 0.011, 6, legC));
    m.push(bar(THREE, [sx * 0.2, 0.415, -0.2], [sx * 0.2, 0.415, 0.19], 0.02, 0.018, legC));
  }
  m.push(bar(THREE, [-0.2, 0.12, -0.2], [0.2, 0.12, -0.2], 0.016, 0.016, legC));
  P.push(...xf(p, ry, x, 0, z)); M.push(...xf(m, ry, x, 0, z));
}
// table, top surface 0.75 m
function table(THREE, P, M, w, d, x, z, topC, legC = '#45484d', edgeC = '#5b5d60') {
  const p = [B_(THREE, w, 0.026, d, 0, 0.737, 0, topC), B_(THREE, w - 0.04, 0.008, d - 0.04, 0, 0.72, 0, edgeC)], m = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) m.push(rod(THREE, [sx * (w / 2 - 0.06), 0, sz * (d / 2 - 0.06)], [sx * (w / 2 - 0.06), 0.716, sz * (d / 2 - 0.06)], 0.018, 8, legC));
  for (const sz of [-1, 1]) m.push(bar(THREE, [-w / 2 + 0.06, 0.69, sz * (d / 2 - 0.06)], [w / 2 - 0.06, 0.69, sz * (d / 2 - 0.06)], 0.025, 0.05, legC));
  for (const sx of [-1, 1]) m.push(bar(THREE, [sx * (w / 2 - 0.06), 0.69, -d / 2 + 0.06], [sx * (w / 2 - 0.06), 0.69, d / 2 - 0.06], 0.025, 0.05, legC));
  P.push(...xf(p, 0, x, 0, z)); M.push(...xf(m, 0, x, 0, z));
}
// --- end kit ---
// opts: rise (4.5), landing (true: U-turn switchback with mid landing; false: straight run), width (1.0), going (0.26)
export function build(THREE, mats, opts = {}) {
  const g = new THREE.Group(), M = matsOf(THREE, mats);
  const rise = opts.rise ?? 4.5, W = opts.width ?? 1.0, G = opts.going ?? 0.26, landing = opts.landing ?? true;
  const n = Math.max(2, Math.round(rise / 0.18)), h = rise / n;
  const F = [], Y = [], st = '#7b8086', dk = '#5e6369', tp = '#9ca1a6', yl = '#e3b21c';
  const gap = 0.12, LD = Math.max(1.1, W + 0.1);
  // flight: risers k0..k0+m-1 starting at bottom-riser z0 heading dir (+1/-1 in z), centre x
  function flight(x, z0, dir, y0, m, openTop) {
    const ang = Math.atan2(h, G), y1 = y0 + m * h, zEnd = z0 + dir * (m - 1) * G;
    for (let i = 0; i < m - 1; i++) { // treads (top riser lands on landing/floor)
      const y = y0 + (i + 1) * h, zc = z0 + dir * (i + 0.5) * G;
      F.push(B_(THREE, W - 0.02, 0.012, G + 0.02, x, y - 0.006, zc, tp, { sw: 1 }));
      for (let k = 0; k < 3; k++) F.push(B_(THREE, W - 0.06, 0.006, 0.012, x, y + 0.003, zc + dir * (-0.06 + k * 0.06), dk)); // diamond-plate ribs
      Y.push(B_(THREE, W - 0.02, 0.008, 0.04, x, y + 0.004, zc - dir * (G / 2 - 0.01), yl), B_(THREE, W - 0.02, 0.03, 0.006, x, y - 0.015, zc - dir * (G / 2 + 0.008), yl));
    }
    // stringers (channel 0.25 deep) and rails both sides
    const zA = z0 - dir * 0.05, zB = zEnd + dir * G * 0.9;
    for (const s of [-1, 1]) {
      const xs = x + s * (W / 2 + 0.03);
      F.push(bar(THREE, [xs, y0 + 0.13, zA], [xs, y1 - 0.12, zB], 0.012, 0.25, st), bar(THREE, [xs - s * 0.03, y0 + 0.14, zA], [xs - s * 0.03, y1, zB], 0.06, 0.012, st));
      const rx = x + s * (W / 2 + 0.05), b0 = [rx, y0 + 0.9, z0], b1 = [rx, y1 - h + 0.9, zEnd];
      {
        F.push(rod(THREE, [rx, y0 + 0.9, z0 - dir * 0.0], [rx, y1 - h + 0.9, zEnd], 0.021, 8, '#c9a017'));
        F.push(rod(THREE, [rx, y0 + 0.48, z0], [rx, y1 - h + 0.48, zEnd], 0.014, 6, st));
        const np = Math.max(2, Math.ceil((m - 1) * G / 1.2) + 1);
        for (let k = 0; k < np; k++) { const t = k / (np - 1), yy = y0 + t * (y1 - h - y0) + h * 0.5, zz = z0 + t * (zEnd - z0); F.push(bar(THREE, [rx, yy, zz], [rx, yy + 0.4, zz], 0.04, 0.04, st), bar(THREE, [rx, yy + 0.4, zz], [rx, yy + 0.9 - h * 0.5, zz], 0.04, 0.04, st)); }
      }
    }
    return { y1, zEnd };
  }
  const PT = (x, y, z) => [+x.toFixed(3), +y.toFixed(3), +z.toFixed(3)];
  let topPoint, bottomPoint, run, landingY = null;
  if (landing) {
    const n1 = Math.ceil(n / 2), n2 = n - n1, x1 = -(W + gap) / 2, x2 = (W + gap) / 2;
    run = (n1 - 1) * G + LD;
    const z0 = -run / 2;
    const f1 = flight(x1, z0, 1, 0, n1, false);
    const lz0 = f1.zEnd, ly = n1 * h; landingY = ly;
    // landing deck spanning both flights, frame + 4 posts to floor
    const LWd = 2 * W + gap + 0.12, lzc = lz0 + LD / 2;
    F.push(B_(THREE, LWd, 0.012, LD, 0, ly - 0.006, lzc, tp));
    for (let k = 0; k < 6; k++) F.push(B_(THREE, LWd - 0.06, 0.006, 0.012, 0, ly + 0.003, lz0 + 0.12 + k * (LD - 0.24) / 5, dk));
    for (const s of [-1, 1]) { F.push(B_(THREE, 0.06, 0.15, LD, s * LWd / 2, ly - 0.08, lzc, st), B_(THREE, LWd, 0.15, 0.06, 0, ly - 0.08, lzc + s * LD / 2, st)); }
    Y.push(B_(THREE, W - 0.02, 0.008, 0.04, x1, ly + 0.004, lz0 + 0.01, yl), B_(THREE, W - 0.02, 0.008, 0.04, x2, ly + 0.004, lz0 + 0.01, yl));
    for (const sx of [-1, 1]) for (const sz of [0, 1]) F.push(B_(THREE, 0.08, ly - 0.15, 0.08, sx * (LWd / 2 - 0.04), (ly - 0.15) / 2, lz0 + sz * LD - (sz ? 0.04 : -0.04), st), B_(THREE, 0.2, 0.01, 0.2, sx * (LWd / 2 - 0.04), 0.005, lz0 + sz * LD - (sz ? 0.04 : -0.04), dk));
    // landing guard rail on the three open sides
    const ry = ly + 1.0, e = LWd / 2;
    for (const [a, b] of [[[-e, ry, lz0 + LD], [e, ry, lz0 + LD]], [[-e, ry, lz0], [-e, ry, lz0 + LD]], [[e, ry, lz0], [e, ry, lz0 + LD]]]) {
      F.push(rod(THREE, a, b, 0.021, 8, '#c9a017'), rod(THREE, [a[0], ly + 0.5, a[2]], [b[0], ly + 0.5, b[2]], 0.014, 6, st));
      for (const p of [a, b]) F.push(bar(THREE, [p[0], ly, p[2]], [p[0], ry, p[2]], 0.04, 0.04, st));
    }
    F.push(B_(THREE, LWd, 0.1, 0.008, 0, ly + 0.05, lz0 + LD + 0.01, '#7b8086'));
    const f2 = flight(x2, lz0, -1, ly, n2, true);
    topPoint = PT(x2, rise, f2.zEnd - 0.3); bottomPoint = PT(x1, 0, z0 - 0.35);
  } else {
    run = (n - 1) * G; const z0 = -run / 2;
    const f = flight(0, z0, 1, 0, n, false);
    topPoint = PT(0, rise, f.zEnd + 0.3); bottomPoint = PT(0, 0, z0 - 0.35);
  }
  g.add(mesh(THREE, F, M.vm, 'steel'), mesh(THREE, Y, M.vc, 'nosing'));
  const tpO = new THREE.Object3D(); tpO.name = 'topPoint'; tpO.position.set(...topPoint); g.add(tpO);
  const bpO = new THREE.Object3D(); bpO.name = 'bottomPoint'; bpO.position.set(...bottomPoint); g.add(bpO);
  finish(THREE, g, 'stairs', { topPoint: tpO, bottomPoint: bpO }, { risers: n, riserHeight: +h.toFixed(4), going: G, run: +run.toFixed(3), landing, landingY: landingY && +landingY.toFixed(3), width: W });
  const off = g.userData.offset; g.userData.topPoint = PT(topPoint[0] + off[0], rise, topPoint[2] + off[2]); g.userData.bottomPoint = PT(bottomPoint[0] + off[0], 0, bottomPoint[2] + off[2]);
  return g;
}
