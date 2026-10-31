// Red hinged-lid (attached-lid) distribution tote ~0.60x0.40x0.30 m, tapered ribbed walls, 2 interleaved lid flaps.
// opts: {open:0..1 lid opening}
import { mergeGeos, box, cyl, flat } from './_merge.js';
function memoTexture(THREE) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 200; const x = c.getContext('2d');
  x.fillStyle = '#fbfbf8'; x.fillRect(0, 0, 256, 200);
  x.fillStyle = '#222'; x.font = 'bold 14px sans-serif'; x.fillText('SHIPPING MEMO', 12, 22); x.font = '9px sans-serif'; x.fillText('STORE  /  DEPT  /  TOTE', 12, 36);
  for (let i = 0; i < 40; i++) x.fillRect(176 + i * 2 + (i % 3), 10, i % 4 ? 1 : 2, 26);
  x.strokeStyle = '#555'; x.lineWidth = 0.7; for (let i = 0; i < 9; i++) { x.beginPath(); x.moveTo(12, 52 + i * 14); x.lineTo(244, 52 + i * 14); x.stroke(); }
  for (const cx of [70, 140, 190]) { x.beginPath(); x.moveTo(cx, 52); x.lineTo(cx, 164); x.stroke(); }
  x.fillStyle = '#666'; for (let i = 0; i < 8; i++) x.fillRect(16, 56 + i * 14, 30 + (i * 37) % 40, 4);
  x.strokeStyle = '#2742a0'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(150, 120); x.bezierCurveTo(170, 100, 180, 140, 210, 110); x.stroke();
  x.fillStyle = '#222'; for (let i = 0; i < 30; i++) x.fillRect(20 + i * 3, 174, i % 3 ? 1 : 2, 18);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function build(THREE, mats, opts = {}) {
  const g = new THREE.Group();
  const red = mats.plasticRed || new THREE.MeshStandardMaterial({ color: 0x52101c, roughness: 0.6 });
  const W = 0.6, D = 0.4, BH = 0.27, bw = 0.54, bd = 0.35;
  const body = [];
  // tapered shell (frustum), flat-shaded
  const sh = new THREE.CylinderGeometry(Math.SQRT1_2, Math.SQRT1_2, 1, 4, 1, false); sh.rotateY(Math.PI / 4);
  const p = sh.attributes.position; for (let i = 0; i < p.count; i++) { const t = p.getY(i) + 0.5, k = 1; const sx = (bw + (W - 0.012 - bw) * t), sz = (bd + (D - 0.012 - bd) * t); p.setXYZ(i, p.getX(i) * sx * k, t * (BH - 0.03), p.getZ(i) * sz); }
  body.push(flat(sh));
  // top stacking rim + lip
  body.push(box(THREE, W, 0.03, 0.022, 0, BH - 0.015, D / 2 - 0.011), box(THREE, W, 0.03, 0.022, 0, BH - 0.015, -D / 2 + 0.011));
  body.push(box(THREE, 0.022, 0.03, D, W / 2 - 0.011, BH - 0.015, 0), box(THREE, 0.022, 0.03, D, -W / 2 + 0.011, BH - 0.015, 0));
  body.push(box(THREE, W + 0.008, 0.008, D + 0.008, 0, BH - 0.06, 0));
  // vertical ribs following the taper
  const azL = Math.atan(((D - bd) / 2) / BH), axS = Math.atan(((W - bw) / 2) / BH);
  for (let i = 0; i < 7; i++) {
    const x = -0.24 + i * 0.08;
    for (const s of [1, -1]) body.push(box(THREE, 0.014, BH - 0.07, 0.012, x * (0.95), (BH - 0.07) / 2 + 0.005, s * ((bd + D) / 4 + 0.004), { rx: s * azL }));
  }
  for (let i = 0; i < 4; i++) {
    const z = -0.12 + i * 0.08;
    for (const s of [1, -1]) { if (i === 1 || i === 2) continue; body.push(box(THREE, 0.012, BH - 0.07, 0.014, s * ((bw + W) / 4 + 0.004), (BH - 0.07) / 2 + 0.005, z, { rz: -s * axS })); }
  }
  // hand-hold recesses on short ends (dark) + bottom foot ring
  for (const s of [1, -1]) body.push(box(THREE, 0.006, 0.04, 0.13, s * (W / 2 - 0.016), BH - 0.07, 0, { c: undefined }));
  body.push(box(THREE, bw + 0.01, 0.012, bd + 0.01, 0, 0.006, 0));
  // hinge knuckles along both long edges
  for (let i = 0; i < 6; i++) for (const s of [1, -1]) body.push(box(THREE, 0.04, 0.022, 0.02, -0.25 + i * 0.1, BH + 0.004, s * (D / 2 - 0.004)));
  const bm = new THREE.Mesh(mergeGeos(THREE, body), red); bm.name = 'body'; bm.castShadow = bm.receiveShadow = true; g.add(bm);
  // handle-hold darkness (inner) - small black plate in same mesh would need vc; skip
  // lid flaps: hinged at z=+-D/2, each spans to centre seam with interleaved tabs
  function flap(s) {
    const parts = [], hd = D / 2 - 0.02;
    parts.push(box(THREE, W - 0.01, 0.018, hd, 0, 0.009, -s * (hd / 2 + 0.002)));
    for (let i = 0; i < 6; i++) if ((i % 2 === 0) === (s > 0)) parts.push(box(THREE, 0.085, 0.022, 0.05, -0.25 + i * 0.1, 0.011, -s * (hd + 0.02)));
    // raised stiffening ribs on lid
    parts.push(box(THREE, W - 0.08, 0.008, 0.012, 0, 0.022, -s * hd * 0.3), box(THREE, W - 0.08, 0.008, 0.012, 0, 0.022, -s * hd * 0.85));
    for (const x of [-0.25, -0.1, 0.1, 0.25]) parts.push(box(THREE, 0.012, 0.008, hd * 0.6, x, 0.022, -s * hd * 0.57));
    const piv = new THREE.Object3D(); piv.position.set(0, BH, s * (D / 2 - 0.004)); piv.name = s > 0 ? 'lidB' : 'lid';
    const m = new THREE.Mesh(mergeGeos(THREE, parts), red); m.castShadow = true; m.name = 'flap' + (s > 0 ? 'B' : 'A'); piv.add(m); g.add(piv); return piv;
  }
  const lidA = flap(-1), lidB = flap(1);
  // memo sheet + zip tie (white tie loop through centre tab holes) on lid A
  const memoM = new THREE.MeshStandardMaterial({ map: memoTexture(THREE), roughness: 0.75, vertexColors: true });
  // letter-size memo (0.279 x 0.216) rotated so its long side runs along the tote, centred across the lid seam
  const seamZ = D / 2 - 0.004, memo = [box(THREE, 0.279, 0.0015, 0.216, 0.0, 0.0285, seamZ, { ry: 0.015, c: '#ffffff' })];
  const T = { uv: [0.95, 0.98], c: '#f4f4f0' }, M = { uv: [0.95, 0.98], c: '#8c9196' }, sx = -W / 2 + 0.6 * W;
  // full-width white plastic strap over the memo, wrapping down the long walls; metal hinge pins along both edges
  const tie = [box(THREE, 0.024, 0.002, D + 0.012, sx, 0.0305, seamZ, T),
    box(THREE, 0.024, 0.06, 0.002, sx, 0.0, -0.007, T), box(THREE, 0.024, 0.06, 0.002, sx, 0.0, D - 0.001, T),
    box(THREE, 0.03, 0.012, 0.006, sx, 0.034, seamZ + 0.05, { ...T, c: '#dcdcd6' }),
    cyl(THREE, 0.004, 0.004, W - 0.03, 8, 0, 0.002, -0.002, { rz: Math.PI / 2, ...M }), cyl(THREE, 0.004, 0.004, W - 0.03, 8, 0, 0.002, D - 0.006, { rz: Math.PI / 2, ...M })];
  const mm = new THREE.Mesh(mergeGeos(THREE, [...memo, ...tie]), memoM); mm.name = 'memo'; lidA.add(mm);
  const open = opts.open || 0; lidA.rotation.x = -open * 2.0; lidB.rotation.x = open * 2.0;
  g.userData = { name: 'mckessonTote', dims: { w: W, h: 0.30, d: D }, pivots: { lid: lidA, lidB }, drawCalls: 4 };
  return g;
}
