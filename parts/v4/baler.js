// Vertical cardboard baler 1.8 w x 1.1 d x 3.2 h. Front = +z. pivots: door (rot y, hinge at left), platen (position.y travel).
// opts: {doorOpen:0..1, platenY (0..1, 1 = top), fill (0..1 bale height fraction)}
import { mergeGeos, box, cyl, rng } from './_merge.js';
export function build(THREE, mats, opts = {}) {
  const g = new THREE.Group(), vcM = mats.vc || new THREE.MeshStandardMaterial({ vertexColors: true }), metM = mats.vcMetal || vcM;
  const cbM = mats.cardboardVC || new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.9 });
  const W = 1.8, D = 1.1, H = 3.2, B = '#2d5d8a', Bd = '#244a70', K = '#151515', Yl = '#f4c20d', Gy = '#6b7178';
  const P = [], ch0 = 0.12, ch1 = 1.95; // chamber y span
  // base skid + corner columns + rear/side walls
  P.push(box(THREE, W, 0.12, D, 0, 0.06, 0, { c: '#333a40' }));
  for (const sx of [1, -1]) for (const sz of [1, -1]) P.push(box(THREE, 0.12, H - 0.3, 0.12, sx * (W / 2 - 0.06), 0.12 + (H - 0.42) / 2, sz * (D / 2 - 0.06), { c: Bd }));
  P.push(box(THREE, W - 0.2, ch1 - ch0, 0.03, 0, (ch0 + ch1) / 2, -D / 2 + 0.03, { c: B }));
  for (const sx of [1, -1]) P.push(box(THREE, 0.03, ch1 - ch0 + 0.7, D - 0.2, sx * (W / 2 - 0.03), (ch0 + ch1 + 0.7) / 2, 0, { c: B }));
  // stiffener ribs on sides
  for (const sx of [1, -1]) for (const y of [0.5, 1.0, 1.5, 2.1]) P.push(box(THREE, 0.04, 0.06, D - 0.2, sx * (W / 2 - 0.0), y, 0, { c: Bd }));
  // upper housing (cylinder tower) + top header
  P.push(box(THREE, W - 0.2, 0.12, D - 0.2, 0, ch1 + 0.66, 0, { c: Bd }));
  P.push(box(THREE, W, 0.3, D, 0, H - 0.15, 0, { c: B }), box(THREE, W + 0.02, 0.04, D + 0.02, 0, H - 0.3, 0, { c: Bd }));
  P.push(cyl(THREE, 0.11, 0.11, 0.72, 18, 0, H - 0.66, 0, { c: '#8a9198' }));
  // front frame around loading aperture (y 1.3-1.95) with gate bar
  P.push(box(THREE, W - 0.2, 0.08, 0.06, 0, ch1 + 0.04, D / 2 - 0.03, { c: Bd }), box(THREE, W - 0.2, 0.7, 0.04, 0, ch1 + 0.43, D / 2 - 0.02, { c: B }));
  P.push(box(THREE, W - 0.24, 0.035, 0.035, 0, 1.62, D / 2 + 0.02, { c: Yl }));
  for (let i = 0; i < 9; i++) P.push(box(THREE, 0.012, 0.6, 0.012, -0.72 + i * 0.18, 1.64, D / 2 + 0.03, { c: Gy })); // mesh gate rods
  // control box on right column
  P.push(box(THREE, 0.32, 0.45, 0.16, W / 2 + 0.06, 1.55, D / 2 - 0.25, { c: '#d8dadc' }));
  P.push(cyl(THREE, 0.03, 0.03, 0.03, 14, W / 2 + 0.22, 1.66, D / 2 - 0.25, { rz: Math.PI / 2, c: '#2e9e44' }), cyl(THREE, 0.035, 0.035, 0.035, 14, W / 2 + 0.22, 1.56, D / 2 - 0.25, { rz: Math.PI / 2, c: '#d42a1f' }), box(THREE, 0.02, 0.06, 0.06, W / 2 + 0.225, 1.44, D / 2 - 0.25, { c: '#ffcc00' }));
  P.push(box(THREE, 0.06, 0.6, 0.04, W / 2 + 0.03, 1.1, D / 2 - 0.25, { c: '#444' })); // conduit
  // warning stickers (yellow/black)
  const sticker = (x, y, z, w, h) => { P.push(box(THREE, w, h, 0.004, x, y, z, { c: Yl })); P.push(box(THREE, w * 0.82, h * 0.18, 0.005, x, y + h * 0.28, z, { c: K })); P.push(box(THREE, w * 0.15, h * 0.32, 0.005, x, y - h * 0.12, z, { c: K })); };
  sticker(-0.55, 2.35, D / 2 + 0.003, 0.28, 0.2); sticker(0.55, 2.35, D / 2 + 0.003, 0.28, 0.2); sticker(0, 2.35, D / 2 + 0.003, 0.5, 0.14);
  // hazard stripe at base
  for (let i = 0; i < 12; i++) P.push(box(THREE, 0.08, 0.1, 0.004, -0.83 + i * 0.15, 0.06, D / 2 + 0.002, { rz: 0.6, c: i % 2 ? K : Yl }));
  const bodyM = new THREE.Mesh(mergeGeos(THREE, P), vcM); bodyM.name = 'body'; bodyM.castShadow = bodyM.receiveShadow = true; g.add(bodyM);
  // chamber door: hinged at left front column, covers y ch0..1.28
  const door = new THREE.Object3D(); door.name = 'door'; door.position.set(-W / 2 + 0.12, 0, D / 2 - 0.0); g.add(door);
  const dW = W - 0.24, Dp = [box(THREE, dW, 1.16, 0.05, dW / 2, 0.71, 0.025, { c: B })];
  for (const y of [0.3, 0.7, 1.1]) Dp.push(box(THREE, dW - 0.1, 0.05, 0.03, dW / 2, y, 0.065, { c: Bd }));
  for (const y of [0.35, 1.05]) Dp.push(box(THREE, 0.1, 0.14, 0.06, 0.0, y, 0.03, { c: K })); // hinges
  Dp.push(box(THREE, 0.06, 0.4, 0.08, dW - 0.08, 0.7, 0.09, { c: K }), box(THREE, 0.03, 0.3, 0.04, dW - 0.08, 0.7, 0.15, { c: '#d42a1f' })); // latch wheel/lever
  Dp.push(box(THREE, 0.45, 0.3, 0.004, dW / 2, 0.95, 0.083, { c: Yl }), box(THREE, 0.38, 0.06, 0.005, dW / 2, 1.02, 0.085, { c: K }), box(THREE, 0.38, 0.03, 0.005, dW / 2, 0.88, 0.085, { c: K }));
  const dm = new THREE.Mesh(mergeGeos(THREE, Dp), vcM); dm.name = 'doorPanel'; dm.castShadow = true; door.add(dm);
  door.rotation.y = -(opts.doorOpen ?? 0) * 1.9;
  // platen + ram rod (moves in y)
  const platen = new THREE.Object3D(); platen.name = 'platen'; const pTop = 1.95, pBot = 0.6;
  platen.position.y = pBot + (pTop - pBot) * (opts.platenY ?? 1); g.add(platen);
  const Pp = [box(THREE, W - 0.26, 0.16, D - 0.26, 0, 0.08, 0, { c: '#7b838b' }), box(THREE, W - 0.4, 0.05, D - 0.4, 0, 0.185, 0, { c: '#5b636b' }), cyl(THREE, 0.06, 0.06, 1.2, 16, 0, 0.8, 0, { c: '#d9dde1' })];
  for (let i = 0; i < 5; i++) Pp.push(box(THREE, 0.04, 0.025, D - 0.3, -0.6 + i * 0.3, -0.01, 0, { c: '#555c63' }));
  const pm = new THREE.Mesh(mergeGeos(THREE, Pp), metM); pm.name = 'platenBody'; pm.castShadow = true; platen.add(pm);
  // half-loaded bale of flattened cardboard
  const r = rng(77), bale = [], top = ch0 + (1.25 - ch0) * (opts.fill ?? 1);
  let y = ch0;
  const KR = ['#c49a6c', '#b88d5c', '#d0a978', '#a97f52', '#ad8b62', '#e2dccf'];
  // dense compressed corrugated block: core + many thin wavy-edged sheets, print scraps, 5 horizontal straps
  const CW = 1.5, CD = 0.82, y0 = ch0;
  bale.push(box(THREE, CW - 0.06, top - y0, CD - 0.06, 0, (y0 + top) / 2, 0, { c: '#8f6c46', uv: [0.2, 0.3] }));
  while (y < top) { const th = 0.008 + r() * 0.014; const c = r() < 0.08 ? ['#e2dccf', '#3b5f8a', '#b8312f', '#ffffff'][Math.floor(r() * 4)] : KR[Math.floor(r() * KR.length)];
    bale.push(box(THREE, CW + (r() - 0.5) * 0.05, th, CD + (r() - 0.5) * 0.05, (r() - 0.5) * 0.025, y + th / 2, (r() - 0.5) * 0.02, { ry: (r() - 0.5) * 0.02, rz: (r() - 0.5) * 0.015, c, uv: [0.1 + r() * 0.25, 0.2 + r() * 0.5] })); y += th * 0.95; }
  for (let i = 0; i < 5; i++) { const sy = y0 + (top - y0) * (0.12 + i * 0.19); bale.push(box(THREE, CW + 0.04, 0.012, 0.006, 0, sy, CD / 2 + 0.02, { c: '#1d1d1f', uv: [0.2, 0.3] }), box(THREE, 0.006, 0.012, CD + 0.04, CW / 2 + 0.02, sy, 0, { c: '#1d1d1f', uv: [0.2, 0.3] }), box(THREE, 0.006, 0.012, CD + 0.04, -CW / 2 - 0.02, sy, 0, { c: '#1d1d1f', uv: [0.2, 0.3] })); }
  for (let i = 0; i < 6; i++) bale.push(box(THREE, 0.5 + r() * 0.4, 0.02, 0.4, (r() - 0.5) * 0.5, top + 0.08 + i * 0.04, (r() - 0.5) * 0.3, { rx: (r() - 0.5) * 0.5, rz: (r() - 0.5) * 0.6, c: KR[i % 5] }));
  const balem = new THREE.Mesh(mergeGeos(THREE, bale), cbM); balem.name = 'bale'; balem.castShadow = balem.receiveShadow = true; g.add(balem);
  g.userData = { name: 'baler', dims: { w: W + 0.12, h: H, d: D }, pivots: { door, platen }, platenRange: [pBot, pTop], drawCalls: 4 };
  return g;
}
