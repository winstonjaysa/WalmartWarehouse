// Office kit: desk + task chair + monitor(s) + keyboard + 4-drawer filing cabinet (one group, low detail).
// opts: {variant:'manager'|'personnel'|'upc'|'storeManager' (manager), seed=1}
//   storeManager: bigger desk + 2 monitors; upc: label printer + handheld scanner on desk; personnel: guest chair.
// Desk faces -z (monitor at back edge, user sits at +z). userData.seatPoint = chair seat top centre (world-in-group), facing -z.
// Draw calls: 2 (vc: laminate, plastics, screens, fabric; vcMetal: legs, chair base, cabinet). No text/logos.
import { mergeGeos, box, cyl, rng } from './_merge.js';
export function build(THREE, mats, opts = {}) {
  const v = ['manager', 'personnel', 'upc', 'storeManager'].includes(opts.variant) ? opts.variant : 'manager', r = rng((opts.seed ?? 1) * 911 + 5), g = new THREE.Group();
  const vcM = mats.vc || new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62 });
  const mtM = mats.vcMetal || new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.5 });
  const P = [], M = [], big = v === 'storeManager';
  const DW = big ? 1.8 : 1.5, DD = big ? 0.9 : 0.75, DH = 0.74, TOP = big ? '#6e4b33' : '#b49a78', FR = '#3d4146', DARK = '#1e2124';
  // desk: top, metal end frames, modesty panel, drawer pedestal (right)
  P.push(box(THREE, DW, 0.03, DD, 0, DH - 0.015, 0, { c: TOP }));
  for (const s of [-1, 1]) { M.push(box(THREE, 0.05, DH - 0.03, 0.05, s * (DW / 2 - 0.05), (DH - 0.03) / 2, -DD / 2 + 0.06, { c: FR })); M.push(box(THREE, 0.05, DH - 0.03, 0.05, s * (DW / 2 - 0.05), (DH - 0.03) / 2, DD / 2 - 0.06, { c: FR })); M.push(box(THREE, 0.04, 0.03, DD - 0.1, s * (DW / 2 - 0.05), 0.015, 0, { c: FR })); M.push(box(THREE, 0.04, 0.04, DD - 0.1, s * (DW / 2 - 0.05), DH - 0.05, 0, { c: FR })); }
  P.push(box(THREE, DW - 0.14, 0.38, 0.015, 0, DH - 0.25, -DD / 2 + 0.04, { c: TOP }));
  const pw = 0.42, px = DW / 2 - 0.1 - pw / 2; P.push(box(THREE, pw, DH - 0.06, DD - 0.12, px, (DH - 0.06) / 2 + 0.005, 0, { c: big ? '#5a3d2a' : '#a08868' }));
  for (let i = 0; i < 3; i++) { const y = 0.12 + i * 0.22; P.push(box(THREE, pw - 0.03, 0.005, 0.004, px, y + 0.1, DD / 2 - 0.058, { c: '#2a2c2f' })); M.push(box(THREE, 0.12, 0.014, 0.02, px, y + 0.03, DD / 2 - 0.05, { c: '#b9bec4' })); }
  // monitors + keyboard + mouse
  const monitor = (x, ry) => { const W = 0.56, H = 0.34; const s = new THREE.Group();
    const parts = [box(THREE, W, H, 0.025, 0, DH + 0.13 + H / 2, 0, { c: DARK }), box(THREE, W - 0.03, H - 0.03, 0.002, 0, DH + 0.13 + H / 2, 0.013, { c: '#253447' }), box(THREE, 0.05, 0.14, 0.03, 0, DH + 0.07, -0.03, { c: DARK }), box(THREE, 0.22, 0.012, 0.17, 0, DH + 0.006, -0.03, { c: DARK })];
    for (const q of parts) { q.rotateY(ry); q.translate(x, 0, -DD / 2 + 0.2); P.push(q); } };
  if (big) { monitor(-0.3, 0.18); monitor(0.3, -0.18); } else monitor(0, 0);
  P.push(box(THREE, 0.44, 0.02, 0.14, 0, DH + 0.01, 0.08, { c: '#2b2e32' }), box(THREE, 0.42, 0.004, 0.12, 0, DH + 0.022, 0.08, { c: '#4a4e54' }), box(THREE, 0.06, 0.018, 0.1, 0.32, DH + 0.009, 0.1, { c: '#2b2e32' }));
  // paperwork
  for (let i = 0; i < 2; i++) P.push(box(THREE, 0.22, 0.012 + r() * 0.02, 0.3, -DW / 2 + 0.25 + i * 0.05, DH + 0.012, 0.05 + (r() - 0.5) * 0.08, { c: '#f2f0ea', ry: (r() - 0.5) * 0.3 }));
  if (v === 'upc') { // thermal label printer + handheld scanner in cradle
    const lx = -DW / 2 + 0.3, lz = -DD / 2 + 0.22;
    P.push(box(THREE, 0.2, 0.17, 0.26, lx, DH + 0.085, lz, { c: '#d7d9db' }), box(THREE, 0.2, 0.03, 0.24, lx, DH + 0.185, lz - 0.005, { c: '#2f3236' }), box(THREE, 0.12, 0.006, 0.012, lx, DH + 0.13, lz + 0.131, { c: DARK }), box(THREE, 0.1, 0.002, 0.08, lx, DH + 0.125, lz + 0.17, { c: '#ffffff', rx: 0.3 }));
    const sx = 0.5, sz = 0.05; P.push(box(THREE, 0.1, 0.03, 0.12, sx, DH + 0.015, sz, { c: DARK }));
    const head = box(THREE, 0.07, 0.06, 0.1, 0, 0.09, 0, { c: '#e2b21a' }), grip = box(THREE, 0.04, 0.12, 0.045, 0, 0.03, 0.03, { c: DARK, rx: 0.35 });
    for (const q of [head, grip]) { q.rotateX(-0.25); q.translate(sx, DH + 0.03, sz); P.push(q); }
  }
  // task chair (5-star base, gas column, seat, back, arms)
  const chair = (cx, cz, ry, guest) => { const parts = [], mparts = [];
    if (guest) { // sled-base guest chair
      for (const s of [-1, 1]) { mparts.push(box(THREE, 0.025, 0.025, 0.5, s * 0.24, 0.0125, 0, { c: FR }), box(THREE, 0.025, 0.45, 0.025, s * 0.24, 0.225, -0.22, { c: FR }), box(THREE, 0.025, 0.45, 0.025, s * 0.24, 0.225, 0.22, { c: FR }), box(THREE, 0.025, 0.025, 0.42, s * 0.24, 0.66, 0.0, { c: FR })); }
      parts.push(box(THREE, 0.5, 0.06, 0.48, 0, 0.47, 0, { c: '#3b4a5c' }), box(THREE, 0.48, 0.4, 0.05, 0, 0.75, 0.24, { c: '#3b4a5c', rx: -0.08 }));
    } else {
      for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5 + 0.3, sp = box(THREE, 0.3, 0.03, 0.04, 0.15, 0.07, 0, { c: '#26292d' }); sp.rotateY(a); mparts.push(sp); const cs = cyl(THREE, 0.025, 0.025, 0.04, 6, Math.cos(a) * 0.3, 0.03, -Math.sin(a) * 0.3, { c: '#1a1c1f', rz: Math.PI / 2 }); mparts.push(cs); }
      mparts.push(cyl(THREE, 0.025, 0.025, 0.3, 6, 0, 0.24, 0, { c: '#888d93' }));
      parts.push(box(THREE, 0.5, 0.08, 0.48, 0, 0.46, 0, { c: '#24272b' }), box(THREE, 0.46, 0.5, 0.06, 0, 0.8, 0.25, { c: '#24272b', rx: -0.1 }), box(THREE, 0.06, 0.24, 0.05, 0, 0.55, 0.26, { c: '#2e3136' }));
      for (const s of [-1, 1]) parts.push(box(THREE, 0.05, 0.03, 0.26, s * 0.27, 0.66, 0.02, { c: '#2e3136' }), box(THREE, 0.03, 0.16, 0.03, s * 0.27, 0.57, 0.08, { c: '#2e3136' }));
    }
    for (const q of parts) { q.rotateY(ry); q.translate(cx, 0, cz); P.push(q); } for (const q of mparts) { q.rotateY(ry); q.translate(cx, 0, cz); M.push(q); }
  };
  const chX = -0.1, chZ = DD / 2 + 0.25, chRy = (r() - 0.5) * 0.4; chair(chX, chZ, chRy, false);
  if (v === 'personnel') chair(-0.15, -DD / 2 - 0.55, Math.PI + (r() - 0.5) * 0.3, true);
  // 4-drawer vertical filing cabinet to the right of the desk
  const fx = DW / 2 + 0.3, fz = -DD / 2 + 0.33, FC = '#b8bcc0';
  M.push(box(THREE, 0.46, 1.32, 0.64, fx, 0.66, fz, { c: FC }));
  for (let i = 0; i < 4; i++) { const y = 0.17 + i * 0.32; M.push(box(THREE, 0.42, 0.29, 0.012, fx, y, fz + 0.322, { c: '#c4c8cc' }), box(THREE, 0.14, 0.022, 0.03, fx, y + 0.08, fz + 0.335, { c: '#6e7378' }), box(THREE, 0.06, 0.03, 0.004, fx, y + 0.115, fz + 0.33, { c: '#f4f4f0' })); }
  const plastic = new THREE.Mesh(mergeGeos(THREE, P), vcM); plastic.name = 'desk'; plastic.castShadow = plastic.receiveShadow = true; g.add(plastic);
  const metal = new THREE.Mesh(mergeGeos(THREE, M), mtM); metal.name = 'metal'; metal.castShadow = metal.receiveShadow = true; g.add(metal);
  const bb = new THREE.Box3(); for (const m of g.children) { m.geometry.computeBoundingBox(); bb.union(m.geometry.boundingBox); } const sz = bb.getSize(new THREE.Vector3());
  const verts = { desk: plastic.geometry.attributes.position.count, metal: metal.geometry.attributes.position.count };
  g.userData = { name: 'officeKit', variant: v, dims: { w: +sz.x.toFixed(3), h: +bb.max.y.toFixed(3), d: +sz.z.toFixed(3) }, bboxCenter: bb.getCenter(new THREE.Vector3()).toArray().map(n => +n.toFixed(3)), drawCalls: 2, verts,
    seatPoint: { x: chX, y: 0.5, z: chZ, ry: chRy, facing: [0, 0, -1] }, pivots: { seat: [chX, 0.5, chZ], deskTop: [0, DH, 0], monitor: [0, DH + 0.3, -DD / 2 + 0.2], cabinet: [fx, 0, fz] } };
  return g;
}
export default build;
