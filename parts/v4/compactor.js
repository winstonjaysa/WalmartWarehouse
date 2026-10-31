// Stationary compactor + receiver container through a wall, ~6.0 m long along x. Indoor chute at -x, wall plane at x = wallX.
// opts: {wall:true (draw wall collar slab), chuteOpen:0..1}. pivots: chuteDoor (rot x)
import { mergeGeos, box, cyl, rng } from './_merge.js';
export function build(THREE, mats, opts = {}) {
  const g = new THREE.Group(), vcM = mats.vc || new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 });
  const GR = '#2f4a3a', GD = '#243a2d', GY = '#5d6368', K = '#151515', YL = '#f4c20d', X0 = -3.0, wallX = -2.2;
  const P = [];
  // indoor chute/hopper (x -3.0 .. -2.2): frame with door opening at ~1.0 m
  P.push(box(THREE, 0.8, 0.12, 1.5, X0 + 0.4, 0.06, 0, { c: GD }));
  P.push(box(THREE, 0.06, 1.9, 1.5, X0 + 0.03, 1.05, 0, { c: GR }), box(THREE, 0.8, 0.08, 1.5, X0 + 0.4, 2.0, 0, { c: GD }));
  for (const s of [1, -1]) P.push(box(THREE, 0.8, 1.95, 0.06, X0 + 0.4, 1.0, s * 0.72, { c: GR }));
  P.push(box(THREE, 0.08, 0.06, 1.3, X0 - 0.01, 0.98, 0, { c: YL }), box(THREE, 0.08, 0.06, 1.3, X0 - 0.01, 1.82, 0, { c: YL }));
  // control panel (indoors, beside chute)
  P.push(box(THREE, 0.14, 0.5, 0.38, X0 + 0.05, 1.35, -1.05, { c: '#d8dadc' }), box(THREE, 0.04, 0.04, 0.04, X0 - 0.03, 1.48, -0.98, { c: '#2e9e44' }), box(THREE, 0.05, 0.05, 0.05, X0 - 0.03, 1.38, -0.98, { c: '#d42a1f' }), box(THREE, 0.03, 0.12, 0.12, X0 - 0.03, 1.25, -1.1, { c: '#ffcc00' }), box(THREE, 0.004, 0.06, 0.2, X0 - 0.022, 1.55, -1.1, { c: '#111' }));
  // wall collar (masonry opening framing) at wallX
  if (opts.wall !== false) { P.push(box(THREE, 0.2, 0.25, 1.9, wallX, 2.2, 0, { c: '#c9c6bf' }), box(THREE, 0.2, 2.3, 0.2, wallX, 1.15, 1.05, { c: '#c9c6bf' }), box(THREE, 0.2, 2.3, 0.2, wallX, 1.15, -1.05, { c: '#c9c6bf' })); }
  // compactor body (outdoors) x -2.2 .. -0.4 : ram housing + hopper
  P.push(box(THREE, 1.8, 1.15, 1.6, -1.3, 0.62, 0, { c: GR }), box(THREE, 1.8, 0.1, 1.7, -1.3, 0.05, 0, { c: GD }));
  P.push(box(THREE, 1.1, 0.75, 1.6, -1.0, 1.55, 0, { c: GR }), box(THREE, 1.12, 0.05, 1.64, -1.0, 1.95, 0, { c: GD })); // hopper
  for (const s of [1, -1]) for (const x of [-2.0, -1.5, -1.0, -0.55]) P.push(box(THREE, 0.06, 1.1, 0.05, x, 0.62, s * 0.82, { c: GD }));
  P.push(cyl(THREE, 0.09, 0.09, 1.2, 14, -1.45, 0.55, 0.86, { rz: Math.PI / 2, c: GY })); // hydraulic cylinder
  P.push(box(THREE, 0.5, 0.55, 0.45, -1.85, 0.4, 1.12, { c: GD }), box(THREE, 0.3, 0.2, 0.3, -1.85, 0.78, 1.12, { c: GY })); // power unit
  for (let i = 0; i < 8; i++) P.push(box(THREE, 0.12, 0.08, 0.004, -2.1 + i * 0.2, 1.14, 0.802, { rx: 0, rz: 0.6, c: i % 2 ? K : YL }));
  // receiver container x -0.4 .. 3.0 (3.4 m, 2.5 h, 2.0 w) on rails, ribbed
  const cx0 = -0.4, cx1 = 3.0, CL = cx1 - cx0, CM = (cx0 + cx1) / 2;
  P.push(box(THREE, CL, 0.15, 1.6, CM, 0.12, 0, { c: K }));
  P.push(box(THREE, CL, 2.05, 2.0, CM, 1.245, 0, { c: GR }));
  const roof = new THREE.CylinderGeometry(1.0, 1.0, CL, 24, 1, false, 0, Math.PI); roof.rotateZ(Math.PI / 2); roof.scale(1, 0.22, 1); roof.translate(CM, 2.27, 0); P.push(roof);
  const rc = new THREE.Color(GD), ca = new Float32Array(roof.attributes.position.count * 3); for (let i = 0; i < ca.length; i += 3) { ca[i] = rc.r; ca[i + 1] = rc.g; ca[i + 2] = rc.b; } roof.setAttribute('color', new THREE.BufferAttribute(ca, 3));
  for (let i = 0; i < 7; i++) for (const s of [1, -1]) P.push(box(THREE, 0.08, 2.0, 0.06, cx0 + 0.3 + i * 0.5, 1.245, s * 1.02, { c: GD }));
  P.push(box(THREE, 0.05, 2.05, 2.04, cx1, 1.245, 0, { c: GD })); // rear doors
  for (const z of [0.5, -0.5]) P.push(box(THREE, 0.03, 1.8, 0.05, cx1 + 0.04, 1.245, z, { c: GY }));
  P.push(box(THREE, 0.04, 0.05, 1.9, cx1 + 0.04, 0.6, 0, { c: GY }), box(THREE, 0.04, 0.05, 1.9, cx1 + 0.04, 1.9, 0, { c: GY }));
  for (const z of [0.7, -0.7]) P.push(cyl(THREE, 0.1, 0.1, 0.12, 16, cx1 - 0.1, 0.1, z, { rx: Math.PI / 2, c: K }));
  P.push(box(THREE, 0.2, 0.25, 0.4, cx0 - 0.05, 0.4, 0, { c: GY })); // coupling
  for (let i = 0; i < 6; i++) P.push(box(THREE, 0.2, 0.1, 0.004, cx0 + 0.4 + i * 0.35, 0.35, 1.051, { rz: 0.6, c: i % 2 ? K : YL }));
  P.push(box(THREE, 0.8, 0.35, 0.004, CM, 1.5, 1.051, { c: '#e9e9e4' }), box(THREE, 0.7, 0.06, 0.005, CM, 1.58, 1.053, { c: '#333' }));
  // light rust: thin vertex-colour decals (streaks under seams/ribs, patches on bottom edges, rings round bolts)
  const R = rng(opts.seed ?? 11), RU = ['#6f4426', '#7d4c2b', '#5e3a22', '#86552f', '#4f3a2a'], ru = () => RU[Math.floor(R() * RU.length)];
  for (const s of [1, -1]) {
    const zf = s * 1.0015;
    for (let i = 0; i < 7; i++) { const x = cx0 + 0.3 + i * 0.5 + (R() - 0.5) * 0.06; if (R() < 0.8) P.push(box(THREE, 0.02 + R() * 0.02, 0.2 + R() * 0.4, 0.002, x + 0.055, 0.36 + R() * 0.12, zf, { c: ru() })); }
    for (let i = 0; i < 9; i++) { const w = 0.12 + R() * 0.35; P.push(box(THREE, w, 0.04 + R() * 0.07, 0.002, cx0 + 0.2 + R() * (CL - 0.4), 0.24 + R() * 0.03, zf, { c: ru() })); }
    for (let i = 0; i < 4; i++) P.push(box(THREE, 0.01 + R() * 0.01, 0.08 + R() * 0.2, 0.002, cx0 + 0.3 + R() * (CL - 0.6), 2.12 - R() * 0.15, zf, { c: ru() }));
    for (const x of [-2.0, -1.5, -1.0, -0.55]) if (R() < 0.7) P.push(box(THREE, 0.012, 0.1 + R() * 0.25, 0.002, x + 0.035, 0.22 + R() * 0.1, s * 0.8015, { c: ru() }));
    for (let i = 0; i < 5; i++) P.push(box(THREE, 0.06 + R() * 0.2, 0.02 + R() * 0.03, 0.002, -2.1 + R() * 1.6, 0.13 + R() * 0.05, s * 0.8015, { c: ru() }));
    for (const x of [cx0 + 0.12, cx1 - 0.12]) for (const y of [0.4, 1.245, 2.05]) { P.push(box(THREE, 0.05, 0.05, 0.002, x, y, zf, { c: ru() }), box(THREE, 0.022, 0.022, 0.012, x, y, s * 1.005, { c: '#3a3a36' })); }
  }
  for (const z of [0.6, -0.6, 0.15]) P.push(box(THREE, 0.002, 0.15 + R() * 0.35, 0.015 + R() * 0.012, cx1 + 0.0265, 0.45 + R() * 0.2, z, { c: ru() }));
  const body = new THREE.Mesh(mergeGeos(THREE, P), vcM); body.name = 'body'; body.castShadow = body.receiveShadow = true; g.add(body);
  const chuteDoor = new THREE.Object3D(); chuteDoor.name = 'chuteDoor'; chuteDoor.position.set(X0 - 0.01, 1.8, 0); g.add(chuteDoor);
  const dm = new THREE.Mesh(mergeGeos(THREE, [box(THREE, 0.04, 0.8, 1.26, 0, -0.4, 0, { c: GY }), box(THREE, 0.05, 0.06, 0.5, -0.03, -0.72, 0, { c: K }), box(THREE, 0.005, 0.25, 0.4, -0.023, -0.35, 0, { c: YL })]), vcM);
  dm.castShadow = true; chuteDoor.add(dm); chuteDoor.rotation.z = -(opts.chuteOpen ?? 0) * 1.4;
  g.userData = { name: 'compactor', dims: { w: 6.05, h: 2.5, d: 2.2 }, pivots: { chuteDoor }, wallX, drawCalls: 2 };
  return g;
}
