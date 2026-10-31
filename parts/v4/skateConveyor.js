// Expandable/flexible gravity skate-wheel conveyor along x (scissor X-lattice side frames, axle rows at the top pins).
// opts: {length=3.0 (fully extended length), compress=0 (0..1; X angle 35°->65°, length & wheel pitch follow),
//        width=0.6, height=0.75 (wheel top = userData.rollerTopY), wheelsPerAxle=10, link=0.16, standEvery=1.2}
import { mergeGeos, box, cyl, tint } from './_merge.js';
export function build(THREE, mats, opts = {}) {
  const Lx = opts.length ?? 3.0, W = opts.width ?? 0.6, TOP = opts.height ?? 0.75, nW = opts.wheelsPerAxle ?? opts.wheelsPerRow ?? 10;
  const c = Math.min(1, Math.max(0, opts.compress ?? 0)), ell = opts.link ?? 0.16;
  const th0 = THREE.MathUtils.degToRad(35), th = THREE.MathUtils.degToRad(35 + 30 * c);
  const N = Math.max(2, Math.round(Lx / (ell * Math.cos(th0)))), s = ell * Math.cos(th), hL = ell * Math.sin(th), L = N * s;
  const g = new THREE.Group();
  const frameM = mats.metal || mats.galv || new THREE.MeshStandardMaterial({ color: 0xc4c9cf, metalness: 0.7, roughness: 0.32 });
  const wheelM = mats.galv || frameM;
  const legM = mats.vcMetal || new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.5, roughness: 0.45 });
  const WR = 0.024, WT = 0.018, AY = TOP - WR, BY = AY - hL, x0 = -L / 2;
  const fr = [], BAR_H = 0.022, BAR_T = 0.004;
  // scissor lattice: each cell has a rising and a falling flat bar, on inner/outer planes, pinned at ends + crossing
  for (const sd of [1, -1]) {
    const zo = sd * (W / 2 + 0.012), zi = sd * (W / 2 + 0.004);
    for (let i = 0; i < N; i++) {
      const xm = x0 + (i + 0.5) * s, ym = (AY + BY) / 2;
      fr.push(box(THREE, ell + 0.02, BAR_H, BAR_T, xm, ym, zo, { rz: th }));   // rising
      fr.push(box(THREE, ell + 0.02, BAR_H, BAR_T, xm, ym, zi, { rz: -th }));  // falling
      fr.push(cyl(THREE, 0.007, 0.007, 0.026, 8, xm, ym, (zo + zi) / 2, { rx: Math.PI / 2 })); // crossing pin
    }
    for (let k = 0; k <= N; k++) { const x = x0 + k * s; fr.push(cyl(THREE, 0.008, 0.008, 0.03, 8, x, AY, (zo + zi) / 2, { rx: Math.PI / 2 }), cyl(THREE, 0.008, 0.008, 0.03, 8, x, BY, (zo + zi) / 2, { rx: Math.PI / 2 })); }
    // end caps
    for (const e of [-1, 1]) fr.push(box(THREE, 0.006, hL + 0.03, 0.03, e * (L / 2 + 0.008), (AY + BY) / 2, (zo + zi) / 2));
  }
  // axle rows at every top pin + tie rods at bottom pins
  for (let k = 0; k <= N; k++) { const x = x0 + k * s; fr.push(cyl(THREE, 0.004, 0.004, W + 0.03, 6, x, AY, 0, { rx: Math.PI / 2 })); fr.push(cyl(THREE, 0.005, 0.005, W + 0.03, 6, x, BY, 0, { rx: Math.PI / 2 })); }
  const frame = new THREE.Mesh(mergeGeos(THREE, fr), frameM); frame.name = 'lattice'; frame.castShadow = frame.receiveShadow = true;
  // skate wheels on the axles, staggered row to row
  const wg = new THREE.CylinderGeometry(WR, WR, WT, 14); wg.rotateX(Math.PI / 2);
  const hub = new THREE.CylinderGeometry(WR * 0.45, WR * 0.45, WT + 0.003, 10); hub.rotateX(Math.PI / 2);
  const span = W - 0.04, dz = span / nW, im = new THREE.InstancedMesh(mergeGeos(THREE, [wg, hub]), wheelM, (N + 1) * nW), m4 = new THREE.Matrix4(); let n = 0;
  for (let k = 0; k <= N; k++) { const off = (k % 2) * dz / 2; for (let j = 0; j < nW; j++) { const z = -span / 2 + dz * (j + 0.25) + off; m4.makeTranslation(x0 + k * s, AY, z); im.setMatrixAt(n++, m4); } }
  im.count = n; im.instanceMatrix.needsUpdate = true; im.castShadow = true; im.name = 'skateWheels';
  // telescoping leg stands with casters, attached at bottom pins
  const lg = [], GR = '#8d949b', DK = '#5d646b', K = '#1d1d1f', CR = 0.05, CTop = 2 * CR + 0.035;
  const nS = Math.max(2, Math.round(L / (opts.standEvery ?? 1.2)) + 1);
  for (let q = 0; q < nS; q++) {
    const k = Math.round(q * N / (nS - 1)), x = x0 + k * s, legTop = BY - 0.01, legH = legTop - CTop;
    for (const sd of [1, -1]) {
      const z = sd * (W / 2 + 0.008), lower = Math.min(0.42, legH * 0.6);
      lg.push(box(THREE, 0.036, lower, 0.036, x, CTop + lower / 2, z, { c: GR }));                 // outer tube
      lg.push(box(THREE, 0.026, legH - lower + 0.05, 0.026, x, CTop + lower + (legH - lower) / 2 - 0.02, z, { c: GR })); // inner tube
      lg.push(box(THREE, 0.046, 0.03, 0.046, x, CTop + lower, z, { c: DK }), box(THREE, 0.012, 0.012, 0.04, x, CTop + lower, z + sd * 0.035, { c: K })); // clamp collar + knob
      lg.push(box(THREE, 0.05, 0.02, 0.05, x, legTop, z, { c: DK }));                               // pin bracket
      lg.push(box(THREE, 0.07, 0.006, 0.07, x, CTop, z, { c: DK }));                                 // caster plate
      lg.push(box(THREE, 0.004, 0.075, 0.035, x - 0.022, CTop - 0.04, z, { c: DK }), box(THREE, 0.004, 0.075, 0.035, x + 0.022, CTop - 0.04, z, { c: DK }));
      lg.push(tint(THREE, (() => { const w = new THREE.CylinderGeometry(CR, CR, 0.03, 16); w.rotateZ(Math.PI / 2); w.rotateY(Math.PI / 2); w.translate(x, CR, z); return w; })(), K));
      lg.push(tint(THREE, (() => { const w = new THREE.CylinderGeometry(0.018, 0.018, 0.034, 10); w.rotateZ(Math.PI / 2); w.rotateY(Math.PI / 2); w.translate(x, CR, z); return w; })(), '#b9bec4'));
    }
    lg.push(box(THREE, 0.025, 0.025, W, x, CTop + 0.12, 0, { c: GR }));                              // lower cross brace
    const dl = Math.hypot(W, legTop - CTop - 0.14), a = Math.atan2(legTop - CTop - 0.14, W);
    lg.push(box(THREE, 0.018, 0.018, dl, x, (CTop + 0.12 + legTop - 0.02) / 2, 0, { rx: a, c: GR }));
  }
  const legs = new THREE.Mesh(mergeGeos(THREE, lg), legM); legs.name = 'legs'; legs.castShadow = true;
  g.add(frame, im, legs);
  g.userData = { name: 'skateConveyor', dims: { w: +(L + 0.03).toFixed(3), h: TOP, d: +(W + 0.04).toFixed(3) }, pivots: {}, drawCalls: 3, rollerTopY: TOP,
    wheelCount: n, axleRows: N + 1, pitch: +s.toFixed(4), links: N, extendedLength: Lx, compress: c, axis: 'x' };
  return g;
}
