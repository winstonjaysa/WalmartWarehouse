// Tall columns of light kraft cases (generic blue tape band, white shipping labels) on a pallet, or on a grey wire case cart.
// opts: {seed=1, height=1.8, cart=false, palletColor, labelRate=0.85}
// Draw calls: pallet mode 2 (pallet, cases); cart mode 3 (cases, wire cart frame, casters).
import { mergeGeos, box, cyl, rng } from './_merge.js';
import { palletGeo, PALLET } from './_pallet.js';
const KRAFT = ['#c79a68', '#bf9060', '#cda273', '#b98a5a', '#c49664', '#d1a87a'];
const CW = 0.40, CHh = 0.30, CD = 0.30;
export function build(THREE, mats, opts = {}) {
  const seed = opts.seed ?? 1, r = rng(seed * 4241 + 9), cart = !!opts.cart, g = new THREE.Group();
  const cbM = mats.cardboardVC || new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0 });
  const _c = new THREE.Color(), _h = {};
  const vary = (hex) => { _c.set(hex).getHSL(_h); _c.setHSL((_h.h + (r() - 0.5) * 0.024 + 1) % 1, _h.s * (0.94 + r() * 0.12), Math.min(1, _h.l * (0.94 + r() * 0.12))); return '#' + _c.getHexString(); };
  let y0, nx, nz, W, D, topLimit, calls = 2;
  if (!cart) {
    const pal = new THREE.Mesh(palletGeo(THREE, seed, undefined, opts.palletColor), mats.woodVC || new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82 }));
    pal.name = 'pallet'; pal.castShadow = pal.receiveShadow = true; g.add(pal);
    y0 = PALLET.h; nx = 3; nz = 3; W = 1.22; D = 1.02; topLimit = opts.height ?? 1.8;
  } else {
    // grey wire case cart: 1.24 × 0.66 deck at 0.24 m, corner posts to 1.86 m, wire side panels, push handle at -x end
    const L = 1.24, Dd = 0.66, deck = 0.24, PH = 1.86, F = [], GR = '#9aa0a6', GD = '#7e848a', U = { c: GR }, tube = 0.025, wire = 0.007;
    for (const sx of [1, -1]) for (const sz of [1, -1]) F.push(box(THREE, tube, PH - deck + 0.05, tube, sx * (L / 2 - tube / 2), (deck + PH) / 2 - 0.02, sz * (Dd / 2 - tube / 2), U));
    for (const s of [1, -1]) { F.push(box(THREE, L, 0.035, 0.03, 0, deck - 0.018, s * (Dd / 2 - 0.015), { c: GD }), box(THREE, 0.03, 0.035, Dd, s * (L / 2 - 0.015), deck - 0.018, 0, { c: GD })); }
    for (let i = 0; i < 15; i++) F.push(box(THREE, wire, wire, Dd - 0.03, -L / 2 + 0.05 + i * (L - 0.1) / 14, deck - 0.003, 0, U)); // wire deck
    for (let i = 0; i < 5; i++) F.push(box(THREE, L - 0.03, wire, wire, 0, deck - 0.006, -Dd / 2 + 0.05 + i * (Dd - 0.1) / 4, U));
    // side panels (long sides, both): horizontal rails + vertical wires; end panel at +x; open loading end at... both ends partly open
    for (const s of [1, -1]) {
      const z = s * (Dd / 2 - 0.004);
      for (const yy of [0.62, 1.02, 1.42, PH - 0.02]) F.push(box(THREE, L - 0.02, 0.016, 0.016, 0, yy, z, U));
      for (let i = 1; i < 12; i++) F.push(box(THREE, wire, PH - deck - 0.04, wire, -L / 2 + i * L / 12, (deck + PH) / 2, z, U));
    }
    for (const yy of [0.62, 1.22, PH - 0.02]) F.push(box(THREE, 0.016, 0.016, Dd - 0.02, L / 2 - 0.004, yy, 0, U));
    // push handle (-x end): two uprights + grip bar, slightly outboard
    for (const s of [1, -1]) F.push(box(THREE, 0.06, 0.022, 0.022, -L / 2 - 0.03, 1.12, s * 0.24, { c: GD }));
    F.push(cyl(THREE, 0.016, 0.016, 0.54, 10, -L / 2 - 0.06, 1.12, 0, { rx: Math.PI / 2, c: '#2a2a2c' }));
    const frame = new THREE.Mesh(mergeGeos(THREE, F), mats.vcMetal || new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.5 }));
    frame.name = 'cart'; frame.castShadow = frame.receiveShadow = true; g.add(frame);
    const C = [], RB = '#1c1c1e', ST = '#8e9398';
    for (const sx of [1, -1]) for (const sz of [1, -1]) {
      const x = sx * (L / 2 - 0.08), z = sz * (Dd / 2 - 0.08);
      C.push(box(THREE, 0.1, 0.01, 0.1, x, deck - 0.04, z, { c: ST }), cyl(THREE, 0.015, 0.015, 0.03, 8, x, deck - 0.06, z, { c: ST }));
      C.push(box(THREE, 0.008, 0.11, 0.07, x - 0.024, 0.12, z, { c: ST }), box(THREE, 0.008, 0.11, 0.07, x + 0.024, 0.12, z, { c: ST }), box(THREE, 0.056, 0.012, 0.07, x, 0.17, z, { c: ST }));
      C.push(cyl(THREE, 0.065, 0.065, 0.038, 16, x, 0.065, z, { rz: Math.PI / 2, c: RB }), cyl(THREE, 0.03, 0.03, 0.042, 10, x, 0.065, z, { rz: Math.PI / 2, c: '#c9ccd0' }));
    }
    const cas = new THREE.Mesh(mergeGeos(THREE, C), mats.vc || new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62 })); cas.name = 'casters'; cas.castShadow = true; g.add(cas);
    y0 = deck + 0.004; nx = 3; nz = 2; W = L + 0.1; D = Dd; topLimit = Math.min(opts.height ?? PH - 0.02, PH - 0.02); calls = 3;
  }
  // --- cases: columns nx × nz, layers to topLimit; each case jittered, kraft varied; blue tape band + white label(s) on outward faces
  const parts = [], LBL = { uv: [0.2, 0.2] }, layers = Math.max(1, cart ? Math.floor((topLimit - y0) / CHh + 0.02) : Math.round((topLimit - y0) / CHh));
  const pitchX = CW + 0.002, pitchZ = CD + 0.002, offX = -(nx - 1) * pitchX / 2, offZ = -(nz - 1) * pitchZ / 2;
  for (let a = 0; a < nx; a++) for (let b = 0; b < nz; b++) {
    const lean = (r() - 0.5) * 0.01; // columns lean a little
    for (let l = 0; l < layers; l++) {
      const w = CW - 0.004 - r() * 0.006, h = CHh - 0.002 - r() * 0.008, d = CD - 0.004 - r() * 0.006;
      const px = offX + a * pitchX + (r() - 0.5) * 0.012 + lean * l, pz = offZ + b * pitchZ + (r() - 0.5) * 0.012, py = y0 + l * CHh + h / 2, ry = (r() - 0.5) * 0.04;
      parts.push(box(THREE, w, h, d, px, py, pz, { ry, c: vary(KRAFT[Math.floor(r() * KRAFT.length)]) }));
      const cs = Math.cos(ry), sn = Math.sin(ry);
      const onFace = (fx, fy, fz, gw, gh, col, axis) => { // decal on the +z (axis 'z') or +x/-x (axis 'x') face, in case-local coords then rotated
        const lx = fx, lz = fz, wx = px + lx * cs + lz * sn, wz = pz - lx * sn + lz * cs;
        parts.push(axis === 'z' ? box(THREE, gw, gh, 0.002, wx, py + fy, wz, { ...LBL, ry, c: col }) : box(THREE, 0.002, gh, gw, wx, py + fy, wz, { ...LBL, ry, c: col }));
      };
      const blueCol = vary('#2f7fb8'), tapeAt = r() < 0.5 ? 1 : -1;
      const front = b === nz - 1, back = b === 0, right = a === nx - 1, left = a === 0;
      for (const [isOut, sgn, axis] of [[front, 1, 'z'], [back, -1, 'z'], [right, 1, 'x'], [left, -1, 'x']]) {
        if (!isOut) continue;
        const half = axis === 'z' ? d / 2 + 0.0012 : w / 2 + 0.0012, span = axis === 'z' ? w : d;
        const at = (t, fy, gw, gh, col) => axis === 'z' ? onFace(t, fy, sgn * half, gw, gh, col, 'z') : onFace(sgn * half, fy, t, gw, gh, col, 'x');
        at(tapeAt * (span / 2 - 0.03), 0, 0.036, h * 0.98, blueCol); // generic blue tape band, vertical near one edge
        if (r() < (opts.labelRate ?? 0.85)) {
          const lx = (r() - 0.5) * span * 0.3 - tapeAt * 0.03, ly = (r() - 0.5) * h * 0.25, lw = 0.13 + r() * 0.04, lh = 0.08 + r() * 0.025;
          at(lx, ly, lw, lh, '#f7f7f2');
          for (let i = 0; i < 5; i++) at(lx - lw * 0.25 + i * 0.006 * (i % 2 ? 1.4 : 1), ly - lh * 0.15, i % 2 ? 0.0025 : 0.0045, lh * 0.45, '#2a2a2a'); // barcode
          at(lx + lw * 0.2, ly + lh * 0.25, lw * 0.4, 0.006, '#555555'); at(lx + lw * 0.2, ly + lh * 0.08, lw * 0.35, 0.005, '#777777');
          if (r() < 0.25) at(lx + (r() - 0.5) * 0.1, ly + h * 0.3, 0.07, 0.045, '#fbfbf6');
        }
      }
    }
  }
  const cases = new THREE.Mesh(mergeGeos(THREE, parts), cbM); cases.name = 'cases'; cases.castShadow = cases.receiveShadow = true; g.add(cases);
  const H = cart ? 1.86 : y0 + layers * CHh;
  g.userData = { name: 'snackCaseStack', dims: { w: +W.toFixed(3), h: +H.toFixed(3), d: +D.toFixed(3) }, pivots: {}, drawCalls: calls, layers, cart, case: { w: CW, h: CHh, d: CD } };
  return g;
}
export default build;
