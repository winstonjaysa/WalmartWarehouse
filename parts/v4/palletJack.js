// Yellow manual pallet jack. Forks along +z (1.22 m), grip ~1.2 m upright, userData.gripPoint = handle child 'grip', 0.685 m overall width. pivots: steer (rot y), handle (rot x). opts: {handleAngle, steerAngle, raised}
import { mergeGeos, box, cyl, tint } from './_merge.js';
export function build(THREE, mats, opts = {}) {
  const g = new THREE.Group(), vcM = mats.vc || new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55 });
  const Y = '#f0b90f', K = '#1c1c1c', C = '#c9ccd0', G = '#5a5a5a';
  const FL = 1.22, OW = 0.685, FW = 0.16, FH = 0.082, z0 = -0.38, zt = z0 + FL; // fork z range [z0, zt]
  const lift = opts.raised ? 0.11 : 0;
  const f = [];
  for (const s of [1, -1]) {
    const x = s * (OW / 2 - FW / 2);
    f.push(box(THREE, FW, 0.006, FL - 0.1, x, FH - 0.003 + lift, z0 + (FL - 0.1) / 2, { c: Y }));
    f.push(box(THREE, 0.006, FH - 0.012, FL - 0.1, x - FW / 2 + 0.003, (FH - 0.006) / 2 + 0.01 + lift, z0 + (FL - 0.1) / 2, { c: Y }), box(THREE, 0.006, FH - 0.012, FL - 0.1, x + FW / 2 - 0.003, (FH - 0.006) / 2 + 0.01 + lift, z0 + (FL - 0.1) / 2, { c: Y }));
    f.push(box(THREE, FW, 0.006, 0.12, x, FH - 0.025 + lift, zt - 0.055, { rx: 0.35, c: Y })); // tapered tip
    f.push(box(THREE, FW - 0.03, 0.03, 0.05, x, 0.045 + lift, zt - 0.03, { rx: 0.5, c: Y }));
    // load rollers (tandem) + link
    for (const dz of [-0.12, -0.04]) f.push(cyl(THREE, 0.036, 0.036, 0.07, 14, x, 0.036, zt + dz, { rz: Math.PI / 2, c: '#2a2a2a' }), cyl(THREE, 0.01, 0.01, FW - 0.01, 6, x, 0.036, zt + dz, { rz: Math.PI / 2, c: C }));
    f.push(box(THREE, 0.012, 0.05, 0.12, x, 0.05 + lift / 2, zt - 0.08, { rx: -0.4, c: G }));
    f.push(cyl(THREE, 0.008, 0.008, FL - 0.25, 6, x, 0.05, z0 + (FL - 0.25) / 2 + 0.05, { rx: Math.PI / 2, c: G })); // push rod
  }
  // chassis cross-member + fork-to-pump bridge
  f.push(box(THREE, OW, 0.11, 0.07, 0, 0.065 + lift, z0 + 0.03, { c: Y }), box(THREE, 0.24, 0.09, 0.14, 0, 0.12 + lift, z0 - 0.04, { c: Y }));
  f.push(box(THREE, 0.6, 0.012, 0.02, 0, 0.115 + lift, z0 + 0.07, { c: K }));
  const frame = new THREE.Mesh(mergeGeos(THREE, f), vcM); frame.name = 'frame'; frame.castShadow = frame.receiveShadow = true; g.add(frame);
  // steer assembly (pump + steer wheels) pivot
  const sz = z0 - 0.17, steer = new THREE.Object3D(); steer.name = 'steer'; steer.position.set(0, 0, sz); g.add(steer);
  const s = [];
  s.push(cyl(THREE, 0.085, 0.14, 0.24, 3, 0, 0.29 + lift, 0.0, { ry: Math.PI / 2, c: Y }), cyl(THREE, 0.03, 0.03, 0.06, 12, 0, 0.44 + lift, 0, { c: C }), box(THREE, 0.22, 0.03, 0.15, 0, 0.165 + lift, 0, { c: Y })); // triangular pump hood + ram
  for (const [x, z, w] of [[0.05, 0.06, 0.03], [-0.07, 0.02, 0.02], [0.02, -0.07, 0.025]]) s.push(box(THREE, w, w * 0.6, 0.002, x, 0.24 + lift, z > 0 ? 0.085 : -0.06, { c: '#8a7a4a' })); // scuffs
  s.push(box(THREE, 0.2, 0.03, 0.12, 0, 0.17, 0, { c: Y }), box(THREE, 0.012, 0.13, 0.1, 0.105, 0.1, 0, { c: Y }), box(THREE, 0.012, 0.13, 0.1, -0.105, 0.1, 0, { c: Y }));
  for (const x of [0.06, -0.06]) s.push(cyl(THREE, 0.09, 0.09, 0.05, 22, x, 0.09, 0, { rz: Math.PI / 2, c: K }), cyl(THREE, 0.05, 0.05, 0.052, 14, x, 0.09, 0, { rz: Math.PI / 2, c: C }));
  s.push(box(THREE, 0.16, 0.04, 0.06, 0, 0.47 + lift, 0, { c: Y })); // handle yoke
  const sm = new THREE.Mesh(mergeGeos(THREE, s), vcM); sm.name = 'steerBody'; sm.castShadow = true; steer.add(sm);
  // handle pivot at yoke
  const handle = new THREE.Object3D(); handle.name = 'handle'; handle.position.set(0, 0.47 + lift, 0); steer.add(handle);
  const h = [], HL = 0.53, LR = 0.1, GY = HL + 2 * LR - 0.012; // single tube + closed loop; grip at loop top
  h.push(cyl(THREE, 0.017, 0.017, HL + 0.02, 12, 0, HL / 2, 0, { c: Y }));
  { const t = new THREE.TorusGeometry(LR, 0.015, 8, 24); t.translate(0, HL + LR, 0); h.push(tint(THREE, t, Y)); }
  h.push(cyl(THREE, 0.021, 0.021, 0.13, 12, 0, GY, 0, { rz: Math.PI / 2, c: K })); // rubber grip on loop top
  h.push(box(THREE, 0.012, 0.06, 0.012, 0.045, HL + LR * 1.55, 0.02, { rz: -0.5, c: '#d42a1f' }), box(THREE, 0.03, 0.01, 0.02, 0.06, HL + LR * 1.85, 0.022, { c: '#d42a1f' })); // thumb lever
  h.push(cyl(THREE, 0.004, 0.004, HL - 0.05, 6, 0, HL / 2, 0.02, { c: G }));
  for (const yy of [0.18, 0.37]) h.push(box(THREE, 0.024, 0.01, 0.002, 0, yy, 0.0175, { c: '#8a7a4a' })); // worn paint
  const hm = new THREE.Mesh(mergeGeos(THREE, h), vcM); hm.name = 'handleBody'; hm.castShadow = true; handle.add(hm);
  const grip = new THREE.Object3D(); grip.name = 'grip'; grip.position.set(0, GY, 0); handle.add(grip);
  handle.rotation.x = opts.handleAngle ?? -0.12; steer.rotation.y = opts.steerAngle ?? 0;
  const zmin = sz - 0.1;
  // recentre footprint on origin
  const off = -(zmin + zt) / 2; frame.position.z = off; steer.position.z += off;
  g.userData = { name: 'palletJack', dims: { w: OW, h: +(0.47 + lift + GY * Math.cos(opts.handleAngle ?? -0.12) + 0.021).toFixed(3), d: +(zt - zmin).toFixed(3) }, pivots: { steer, handle, grip }, gripPoint: { object: grip, local: [0, GY, 0], parent: 'handle' }, gripHeightUpright: +(0.47 + lift + GY).toFixed(3), drawCalls: 3, forkTopY: FH + lift, forkAxis: '+z' };
  return g;
}
