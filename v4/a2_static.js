// ======================= STATIC SCENE =======================
// Layout (metres, y up). Backroom x[-20,20] z[-12,12]. Dock wall = south (z=+12), trailers outside (z>12, ground y=-1.2).
// Cooler/freezer wall = north (z=-12). Sales floor east of x=20 (door at z=0).
const BR = { x0: -20, x1: 20, z0: -12, z1: 12, H: 7.4 };
const SF = { x0: 20, x1: 64, z0: -14, z1: 14 };
const GROUND = -1.2;
const DOORS = { DSD: { x: -16.5, w: 2.8 }, C: { x: -11.5, w: 3 }, A: { x: -5, w: 3 }, B: { x: 8, w: 3 } };
const ROLLER = { x: 8, zHead: 15.2, zTail: -6.6, w: 0.62 };
const rollerY = (z) => 0.84 - (ROLLER.zHead - z) * 0.0045; // gravity slope (top of wheels)
const S = new Builder();
const UP = new Builder(); const CUT = 3.4; // UP = everything above the diorama cut line (hidden in cutaway views)
function wallC(x0, z0, x1, z1, y0, y1, col, cut = CUT) { if (y1 <= cut) S.wall(x0, z0, x1, z1, y0, y1, col); else if (y0 >= cut) UP.wall(x0, z0, x1, z1, y0, y1, col); else { S.wall(x0, z0, x1, z1, y0, cut, col); UP.wall(x0, z0, x1, z1, cut, y1, col); } }
const WALL = '#efefec', WALL2 = '#e4e4e0', STEEL = '#9aa3ab', DARK = '#2b2f33', YEL = '#f2c200', BLK = '#1d1f22';

// floors
const floorBR = new THREE.Mesh(new THREE.PlaneGeometry(40, 24).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: concreteTex }));
concreteTex.repeat.set(8, 5); floorBR.position.set(0, 0, 0); floorBR.matrixAutoUpdate = false; floorBR.updateMatrix(); scene.add(floorBR);
S.add(new THREE.PlaneGeometry(44, 28).rotateX(-Math.PI / 2), '#e9e7e2', 42, 0.001, 0); // sales floor tile
for (let x = 21; x < 64; x += 2) S.box(0.02, 0.003, 28, x, 0.003, 0, '#dddad4');
for (let z = -13; z < 14; z += 2) S.box(44, 0.003, 0.02, 42, 0.003, z, '#dddad4');
S.add(new THREE.PlaneGeometry(200, 160).rotateX(-Math.PI / 2), '#b9bcc6', -10, GROUND, 60); // yard (light, diorama look)
S.box(200, 0.4, 0.3, -10, GROUND + 0.2, 12.2 + 0.0, '#6f7274'); // curb under dock wall
for (let x = -60; x < 60; x += 6) S.box(3, 0.01, 0.15, x, GROUND + 0.01, 39.5, '#e8e2c8'); // lane dashes
// yellow safety markings in the backroom
for (const d of Object.values(DOORS)) { S.box(d.w + 0.6, 0.004, 0.1, d.x, 0.004, 9.6, YEL); }
S.box(0.1, 0.004, 21, 3.6, 0.004, 0.5, YEL); S.box(0.1, 0.004, 21, 12.4, 0.004, 0.5, YEL);
for (let i = 0; i < 6; i++) S.add(new THREE.BoxGeometry(0.12, 0.004, 1.4), YEL, -17 + i * 0.5, 0.004, -11, 0.7); // hatched keep-clear by claims cage

// ---- walls (single-sided, inward) ----
function wallWithDoors(isExterior) {
  // south dock wall z=12, inward normal -z  => run x from +20 to -20 ; exterior face normal +z => run -20..+20 at z=12.25
  const z = isExterior ? 12.25 : 12, col = isExterior ? '#d8d4cc' : WALL;
  const ds = Object.values(DOORS).sort((a, b) => a.x - b.x); let x = -20;
  const seg = (xa, xb, y0, y1) => isExterior ? wallC(xa, z, xb, z, y0, y1, col, 0.9) : wallC(xb, z, xa, z, y0, y1, col);
  for (const d of ds) { seg(x, d.x - d.w / 2, isExterior ? GROUND : 0, BR.H); seg(d.x - d.w / 2, d.x + d.w / 2, 3.0, BR.H); x = d.x + d.w / 2; }
  seg(x, 20, isExterior ? GROUND : 0, BR.H);
  if (isExterior) { UP.box(40, 0.6, 0.05, 0, 5.6, 12.3, '#0071ce'); UP.box(40, 0.12, 0.05, 0, 5.15, 12.3, '#ffc220'); S.box(40.6, 0.1, 0.36, 0, 0.95, 12.15, '#cfd5dc'); }
}
wallWithDoors(false); wallWithDoors(true);
wallC(-20, -12, -4.9, -12, 0, BR.H, '#f6f6f4'); wallC(-2.3, -12, 20, -12, 0, BR.H, '#f6f6f4'); wallC(-4.9, -12, -2.3, -12, 3.0, BR.H, '#f6f6f4'); // north (cooler wall) with the walk-in cooler doorway open
// walk-in cooler interior: stainless panels, sealed floor, strip curtain in the doorway
S.box(13.8, 0.04, 4.9, -3.6, 0.0, -14.45, '#c7ccd0');
wallC(-10.5, -12, -10.5, -16.9, 0, 3.2, '#b9c0c6'); wallC(-10.5, -16.9, 3.3, -16.9, 0, 3.2, '#c3c9ce'); wallC(3.3, -16.9, 3.3, -12, 0, 3.2, '#b9c0c6');
for (let x = -10; x < 3.3; x += 1.15) S.box(0.03, 3.1, 0.02, x, 1.55, -16.86, '#a9b0b6');
S.box(13.8, 0.12, 0.06, -3.6, 0.06, -16.85, '#8e959b'); S.cyl(0.14, 1.2, -9.9, 0.6, -12.6, YEL, 12);
for (let i = 0; i < 9; i++) S.box(0.24, 2.6, 0.012, -4.75 + 0.18 + i * 0.29, 1.65, -12.06 - (i % 2) * 0.02, i % 2 ? '#dfe9ee' : '#d3e0e7');
sign(SIGN.cooler, 1.0, 0.25, -3.6, 3.25, -11.89, 0);
wallC(-20, 12, -20, -12, 0, BR.H, WALL);                         // west
wallC(20, -12, 20, -1.6, 0, BR.H, WALL); wallC(20, 1.6, 20, 12, 0, BR.H, WALL); wallC(20, -1.6, 20, 1.6, 3.2, BR.H, WALL); // east (backroom side)
wallC(20, 12, 20, 1.6, 0, 5.5, '#f3f1ec'); wallC(20, -1.6, 20, -12, 0, 5.5, '#f3f1ec'); wallC(20, 1.6, 20, -1.6, 3.2, 5.5, '#f3f1ec'); // east wall, sales-floor side
UP.box(0.05, 0.9, 24, 20.03, 4.6, 0, '#0071ce');
wallC(64, -14, 20, -14, 0, 5.5, '#f3f1ec'); wallC(20, 14, 64, 14, 0, 5.5, '#f3f1ec'); wallC(64, 14, 64, -14, 0, 5.5, '#f3f1ec');
// panel seams on the cooler wall + wall base
for (let x = -19; x < 20; x += 1.2) S.box(0.02, CUT, 0.01, x, CUT / 2, -11.99, '#e1e2e0');
S.box(40, 0.25, 0.05, 0, 0.125, -11.97, '#c9cbc9');
// ceiling: black deck (faces down, invisible from above), black trusses, conduit, strip lights
UP.add(new THREE.PlaneGeometry(40, 24), '#16181b', 0, BR.H + 0.5, 0, 0, Math.PI / 2);
UP.add(new THREE.PlaneGeometry(44, 28), '#2a2d31', 42, 6.2, 0, 0, Math.PI / 2);
const tubes = new Builder();
for (let x = -18; x <= 18; x += 4) { UP.box(0.18, 0.5, 24, x, BR.H + 0.2, 0, '#1a1c1f'); for (let z = -11; z <= 11; z += 2.2) UP.add(new THREE.BoxGeometry(0.04, 0.6, 0.04), '#1a1c1f', x, BR.H - 0.25, z, 0, 0, 0.6); UP.box(0.06, 0.06, 24, x, BR.H - 0.55, 0, '#1a1c1f'); }
for (let z = -10; z <= 10; z += 5) UP.box(40, 0.04, 0.04, 0, BR.H - 0.1, z + 0.4, '#8a8f94');
for (let x = -16; x <= 16; x += 8) for (let z = -9; z <= 9; z += 6) { tubes.box(0.12, 0.05, 2.4, x, 5.7, z, '#ffffff'); UP.box(0.16, 0.06, 2.5, x, 5.76, z, '#cfd3d6'); UP.box(0.01, 1.6, 0.01, x, 6.6, z - 1, '#444'); UP.box(0.01, 1.6, 0.01, x, 6.6, z + 1, '#444'); }
for (let x = 24; x <= 60; x += 6) for (let z = -11; z <= 11; z += 5.5) { tubes.box(0.12, 0.05, 2.4, x, 5.5, z, '#ffffff'); }
// wall caps at the cut line (toy-diorama trim)
for (const [w, d, x, z] of [[40.4, 0.24, 0, -12.05], [0.24, 24.4, -20.05, 0], [0.24, 24.4, 20.05, 0], [0.24, 28, 64, 0], [44, 0.24, 42, -14], [44, 0.24, 42, 14]]) S.box(w, 0.08, d, x, CUT + 0.04, z, '#cfd5dc');
// vertical pipes / conduits on west wall corner like the refs
for (let i = 0; i < 4; i++) S.cyl(0.05, CUT, -19.85, CUT / 2, -11.6 + i * 0.16, '#e9e9e6', 8);
S.box(0.6, 0.8, 0.25, -6.5, 2.2, -11.85, '#c9cbcd'); S.box(0.5, 0.6, 0.2, 0.5, 2.0, -11.88, '#b9bcbf'); // electrical boxes
// EXIT sign mounted on the north wall (below the cut line)
S.box(0.42, 0.2, 0.06, -0.5, 3.05, -11.95, '#e8e8e8'); sign(SIGN.exit, 0.38, 0.18, -0.5, 3.05, -11.915, 0);

// ---- dock doors (rolled up), seals, levelers, bollards ----
for (const [k, d] of Object.entries(DOORS)) {
  S.box(d.w + 0.3, 0.5, 0.5, d.x, 3.3, 11.7, '#b8bec4');                       // roll-up drum hood
  S.box(0.12, 3.0, 0.12, d.x - d.w / 2 - 0.06, 1.5, 11.95, '#d7dadd'); S.box(0.12, 3.0, 0.12, d.x + d.w / 2 + 0.06, 1.5, 11.95, '#d7dadd');
  S.box(d.w - 0.2, 0.03, 2.2, d.x, 0.015, 10.9, '#7d8389');                     // dock leveler plate
  for (const s of [-1, 1]) { S.cyl(0.11, 1.2, d.x + s * (d.w / 2 + 0.45), 0.6, 11.4, YEL, 10); S.cyl(0.115, 0.04, d.x + s * (d.w / 2 + 0.45), 1.2, 11.4, '#222', 10); }
  // exterior seal pads + bumpers
  S.box(0.35, 3.4, 0.4, d.x - d.w / 2 - 0.2, 1.4, 12.45, BLK); S.box(0.35, 3.4, 0.4, d.x + d.w / 2 + 0.2, 1.4, 12.45, BLK); S.box(d.w + 0.75, 0.6, 0.4, d.x, 3.3, 12.45, BLK);
  S.box(0.3, 0.3, 0.2, d.x - 0.9, -0.2, 12.35, '#111'); S.box(0.3, 0.3, 0.2, d.x + 0.9, -0.2, 12.35, '#111');
  S.box(d.w + 1, GROUND * -1, 0.2, d.x, GROUND / 2, 12.3, '#8e8f8c'); // dock face concrete
}
// ---- cooler + freezer doors with yellow guard rails (north wall, like the refs) ----
function coldDoorRails(x) { for (const s of [-1, 1]) { S.cyl(0.05, 1.05, x + s * 3.0, 0.53, -10.9, YEL, 8); S.box(1.2, 0.06, 0.06, x + s * 2.4, 1.0, -10.9, YEL); S.box(1.2, 0.06, 0.06, x + s * 2.4, 0.55, -10.9, YEL); } S.cyl(0.14, 1.3, x - 2.0, 0.65, -10.3, YEL, 12); S.cyl(0.14, 1.3, x + 2.0, 0.65, -10.3, YEL, 12); }
function coldDoor(x, label) {
  S.box(2.7, 3.0, 0.08, x, 1.5, -11.95, '#d6dadc'); S.box(2.4, 2.75, 0.1, x, 1.4, -11.92, '#b4bbc0');
  for (let i = 0; i < 10; i++) S.box(2.38, 0.015, 0.105, x, 0.2 + i * 0.27, -11.91, '#a5acb2');
  sign(label, 1.0, 0.25, x, 3.25, -11.89, 0); sign(SIGN.caution, 0.5, 0.25, x - 0.95, 2.6, -11.89, 0);
  for (const s of [-1, 1]) { const px = x + s * 1.8; for (const pz of [-11.85, -10.9]) S.cyl(0.05, 1.05, px, 0.53, pz, YEL, 8); S.box(0.06, 0.06, 1.05, px, 1.0, -11.37, YEL); S.box(0.06, 0.06, 1.05, px, 0.55, -11.37, YEL);
    S.cyl(0.05, 1.05, x + s * 3.0, 0.53, -10.9, YEL, 8); S.box(1.2, 0.06, 0.06, x + s * 2.4, 1.0, -10.9, YEL); S.box(1.2, 0.06, 0.06, x + s * 2.4, 0.55, -10.9, YEL); }
  S.cyl(0.14, 1.3, x - 2.0, 0.65, -10.3, YEL, 12); S.cyl(0.14, 1.3, x + 2.0, 0.65, -10.3, YEL, 12);
}
coldDoorRails(-3.6); coldDoor(3.0, SIGN.freezer);

// ---- roller conveyor: Inky's skate-wheel line (parts/v4/skateConveyor.js), runs along z from inside trailer B to the sort area ----
{ const cv = buildConveyor(THREE, PM, { length: ROLLER.zHead - ROLLER.zTail, height: 0.84 }); cv.rotation.y = Math.PI / 2; cv.position.set(ROLLER.x, 0, (ROLLER.zHead + ROLLER.zTail) / 2); scene.add(cv); }
await __yield();
// ---- Sales floor gondolas (static stock, with gaps where overnight stockers fill) ----
const GOND = []; // {x0,x1,z}  double-sided, depth 1.2
const SHELF_Y = [0.12, 0.55, 0.98, 1.41];
const prodCols = ['#d64541', '#2e86de', '#f5b041', '#27ae60', '#8e44ad', '#ecf0f1', '#e67e22', '#16a085', '#f1c40f', '#c0392b', '#3498db', '#fdfefe'];
for (const z of [-10.5, -7, -3.5, 3.5, 7, 10.5]) for (const [x0, x1] of [[25, 37], [41, 53]]) GOND.push({ x0, x1, z });
const HOLES = []; // empty shelf slots to be filled by stockers: {x,y,z,face,used}
for (const g of GOND) {
  const L = g.x1 - g.x0, cx = (g.x0 + g.x1) / 2;
  S.box(L, 1.8, 0.08, cx, 0.9, g.z, '#c9ccd0'); S.box(L, 0.12, 1.2, cx, 0.06, g.z, '#b5b9bd');
  for (let x = g.x0; x <= g.x1 + 0.01; x += 1.2) S.box(0.05, 1.9, 1.2, x, 0.95, g.z, '#aeb3b8');
  for (const y of SHELF_Y.slice(1)) S.box(L, 0.03, 1.15, cx, y - 0.015, g.z, '#d9dcdf');
  S.box(L, 0.04, 0.04, cx, 1.86, g.z, '#b5b9bd');
  for (const face of [-1, 1]) for (const y of SHELF_Y) for (let x = g.x0 + 0.1; x < g.x1 - 0.25; x += 0.3) {
    const zz = g.z + face * 0.33;
    const isHole = (x > g.x0 + 3 && x < g.x0 + 7.5 && rnd() < 0.55);
    if (isHole) { HOLES.push({ x: x + 0.14, y, z: zz, face, used: false, gz: g.z }); continue; }
    const h = 0.22 + rnd() * 0.16, col = prodCols[(rnd() * prodCols.length) | 0];
    S.box(0.27, h, 0.48, x + 0.14, y + h / 2, zz, col);
  }
}
// Sales-floor department header signs (only verified names next to numbers)
const AISLE_SIGNS = [
  { x: 31, z: -5.25, l: ['Dept 46 · Cosmetics', 'Beauty / cosmetics'] }, { x: 31, z: 5.25, l: ['Dept 2 · Health & Beauty', 'Personal care'] },
  { x: 47, z: -5.25, l: ['Dept 92 · Dry Grocery', 'Grocery'] }, { x: 47, z: 8.75, l: ['Dept 4 · Paper Goods', 'Household paper'] },
  { x: 31, z: -8.75, l: ['Dept 13 · Household Chemicals', 'Cleaning'] }, { x: 47, z: 5.25, l: ['Dept 1 · Candy & Tobacco', ''] },
  { x: 31, z: 8.75, l: ['Dept 8 · Pets & Supplies', ''] }, { x: 47, z: -8.75, l: ['Dept 40 · OTC Pharmacy', 'Pharmacy over-the-counter'] },
];
for (const a of AISLE_SIGNS) { const c = textSign(a.l[1] ? a.l : [a.l[0]], { w: 768, h: 160, size: 0.4 }); S.box(0.02, 1.2, 0.02, a.x, 3.4, a.z, '#555'); sign(c, 3.0, 0.62, a.x - 0.0, 2.75, a.z + 0.011, 0); sign(c, 3.0, 0.62, a.x, 2.75, a.z - 0.011, Math.PI); }
// Pharmacy counter (sales floor, far corner)
S.box(6, 1.1, 1, 59, 0.55, -12.5, '#e8e8e8'); S.box(6, 2.6, 0.1, 59, 2.4, -13.9, '#0071ce');
sign(textSign(['Pharmacy', 'Dept 38 Rx · Dept 40 OTC'], { w: 768, h: 192 }), 3.2, 0.8, 59, 3.1, -13.84, 0);
// Fashion floor racks (sales floor east end)
for (let i = 0; i < 4; i++) { S.cyl(0.6, 0.04, 58 + (i % 2) * 2.5, 1.4, 4 + (i >> 1) * 4, '#9aa0a6', 16); S.cyl(0.03, 1.4, 58 + (i % 2) * 2.5, 0.7, 4 + (i >> 1) * 4, '#9aa0a6', 6); for (let k = 0; k < 18; k++) { const a = k / 18 * Math.PI * 2; S.box(0.05, 0.75, 0.3, 58 + (i % 2) * 2.5 + Math.cos(a) * 0.6, 1.0, 4 + (i >> 1) * 4 + Math.sin(a) * 0.6, ['#2e4053', '#922b21', '#d4ac0d', '#1f618d', '#f0f3f4', '#6c3483'][(k + i) % 6], -a); } }
sign(textSign(['Fashion', 'Apparel · Depts 23–36'], { w: 768, h: 192 }), 3.2, 0.8, 59.2, 3.4, 13.89, Math.PI);

// ---- Backroom zones ----
// Receiving desk (west wall near DSD door)
S.box(0.8, 0.9, 2.2, -19.4, 0.45, 7.6, '#5d6d7e'); S.box(0.9, 0.04, 2.3, -19.4, 0.92, 7.6, '#d5d8dc');
S.box(0.4, 0.3, 0.05, -19.5, 1.15, 7.2, '#222'); S.box(0.3, 0.2, 0.3, -19.4, 1.04, 8.2, '#ecf0f1'); // monitor + label printer
sign(textSign(['Receiving', 'Check-in · invoices · memos'], { w: 768, h: 192 }), 2.6, 0.65, -19.95, 3.0, 7.6, Math.PI / 2);
// Claims & returns cage (north-west corner)
{ const x0 = -19.9, x1 = -14.5, z0 = -11.9, z1 = -8.4;
  for (let x = x0; x <= x1 + 0.01; x += 0.9) if (x < -16.7 || x > -15.0) S.box(0.04, 2.4, 0.04, x, 1.2, z1, '#7f8c8d');
  S.box(0.06, 2.4, 0.06, -16.55, 1.2, z1, '#7f8c8d'); S.box(0.06, 2.4, 0.06, -15.15, 1.2, z1, '#7f8c8d'); S.box(1.4, 0.06, 0.06, -15.85, 2.37, z1, '#7f8c8d'); // open gate
  for (let z = z0; z <= z1 + 0.01; z += 0.9) S.box(0.04, 2.4, 0.04, x1, 1.2, z, '#7f8c8d');
  for (let y = 0.3; y < 2.4; y += 0.3) { S.box(-16.55 - x0, 0.015, 0.015, (x0 - 16.55) / 2, y, z1, '#95a5a6'); S.box(x1 + 15.15, 0.015, 0.015, (x1 - 15.15) / 2, y, z1, '#95a5a6'); S.box(0.015, 0.015, z1 - z0, x1, y, (z0 + z1) / 2, '#95a5a6'); }
  for (const y of [0.05, 0.9, 1.6]) S.box(3.6, 0.04, 0.7, -17.9, y, -11.5, '#8c97a1');
  sign(textSign(['Claims & Returns', 'Damages · RTV · return mailers'], { w: 768, h: 192 }), 2.4, 0.6, (x0 + x1) / 2, 2.75, z1 + 0.02, 0); }
await __yield();
// Baler + compactor (west wall) — Inky's models
const BALER = buildBaler(THREE, PM, { doorOpen: 0, platenY: 1, fill: 0.35 }); BALER.rotation.y = Math.PI / 2; BALER.position.set(-19.4, 0, -3.2); scene.add(BALER);
// finished OCC bales on pallets beside the baler (Inky cardboardBale.js)
for (const [z, sd] of [[-5.4, 2], [-6.8, 5], [-8.2, 9]]) { const b = buildBale(THREE, PM, { seed: sd, pallet: true, straps: 5 }); b.position.set(-19.25, 0, z); b.rotation.y = Math.PI / 2 + (sd % 3 - 1) * 0.04; scene.add(b); }
sign(textSign(['Cardboard baler'], { w: 512, h: 96, size: 0.46 }), 1.8, 0.34, -19.97, 3.6, -3.2, Math.PI / 2);
const COMPACTOR = buildCompactor(THREE, PM, { wall: true }); COMPACTOR.rotation.y = Math.PI; COMPACTOR.position.set(-20 - COMPACTOR.userData.wallX, 0, 1.2); scene.add(COMPACTOR);
S.box(4.2, -GROUND, 2.6, -22.3, GROUND / 2, 1.2, '#8e8f8c'); // exterior concrete pad under the compactor body
sign(textSign(['Trash compactor'], { w: 512, h: 96, size: 0.46 }), 1.8, 0.34, -19.97, 3.0, 1.2, Math.PI / 2);
S.box(1.1, 1.0, 0.8, -16.9, 0.5, -1.4, '#a0784c'); // cardboard cart (flattened boxes waiting)
// Omni / online grocery staging (south-east): tote shelving + carts
for (const [x, z, ry] of [[14, 11.4, 0], [17.5, 11.4, 0]]) { for (const y of [0.05, 0.6, 1.15, 1.7]) S.box(3.2, 0.03, 0.75, x, y, z, '#99a3a4'); for (const sx of [-1.58, 1.58]) for (const sz of [-0.35, 0.35]) S.box(0.04, 2.0, 0.04, x + sx, 1.0, z + sz, '#7f8c8d'); }
for (const [x, z] of [[19.4, 7.5], [19.4, 4.5]]) { for (const y of [0.05, 0.6, 1.15, 1.7]) S.box(0.75, 0.03, 2.6, x, y, z, '#99a3a4'); }
sign(textSign(['OMNI · Online Grocery', 'Pickup & delivery staging'], { w: 768, h: 192 }), 2.8, 0.7, 16, 2.75, 11.6, Math.PI);
S.box(1.5, 1.9, 0.9, 13.0, 0.95, 7.0, '#3a6ea5'); S.box(1.5, 1.9, 0.9, 13.0, 0.95, 5.8, '#a93226'); // chill / frozen pick cabinets
sign(textSign(['Chill'], { w: 256, h: 96, bg: '#fff', fg: '#3a6ea5' }), 0.8, 0.3, 13.76, 1.6, 7.0, Math.PI / 2); sign(textSign(['Frozen'], { w: 256, h: 96, bg: '#fff', fg: '#a93226' }), 0.8, 0.3, 13.76, 1.6, 5.8, Math.PI / 2);
// Fashion processing (north-east): Z-racks
const ZR = [{ x: 15.5, z: -10.6 }, { x: 15.5, z: -8.9 }];
for (const r of ZR) { S.box(2.0, 0.04, 0.04, r.x, 1.75, r.z, '#bdc3c7'); for (const s of [-1, 1]) { S.box(0.04, 1.75, 0.04, r.x + s, 0.88, r.z, '#bdc3c7'); S.box(0.04, 0.04, 0.7, r.x + s, 0.1, r.z, '#bdc3c7'); S.cyl(0.04, 0.05, r.x + s, 0.04, r.z - 0.3, '#222', 8, 0, Math.PI / 2); S.cyl(0.04, 0.05, r.x + s, 0.04, r.z + 0.3, '#222', 8, 0, Math.PI / 2); } }
sign(textSign(['Fashion processing', 'Hang · tag · size'], { w: 768, h: 192 }), 2.6, 0.65, 15.5, 3.0, -11.92, 0);
sign(textSign(['Sales floor'], { w: 512, h: 128, size: 0.45 }), 2.0, 0.5, 19.97, 3.6, 0, -Math.PI / 2);
// Pallet return stack area marker
sign(textSign(['Empty pallets'], { w: 512, h: 96, size: 0.45, bg: '#ffffff', fg: '#0b3d91', border: '#0b3d91' }), 1.4, 0.26, -0.5, 1.9, 11.92, Math.PI);

// ---- Vehicles (static bodies merged; animated ones built separately) ----
// Walmart 53' trailer: rear at z0, extends +z by 16 m (dir=+1). cutaway roof when docked
function trailer(B, x, z0, { roof = true, placard = null, docked = true } = {}) {
  const L = 16, W = 2.6, H = 2.75, y0 = docked ? 0 : 0; // floor at dock height
  const zc = z0 + L / 2;
  B.box(W, 0.12, L, x, y0 - 0.06, zc, '#cfd4d8');                                   // floor
  B.box(0.04, H, L, x - W / 2, y0 + H / 2, zc, '#f4f5f6'); B.box(0.04, H, L, x + W / 2, y0 + H / 2, zc, '#f4f5f6');
  B.inner(W - 0.1, H - 0.02, L - 0.1, x, y0 + H / 2, zc, '#7c8288');
  B.box(W, H, 0.05, x, y0 + H / 2, z0 + L, '#f4f5f6');
  if (roof) B.box(W, 0.06, L, x, y0 + H + 0.03, zc, '#e8eaec'); else { B.box(0.08, 0.08, L, x - W / 2, y0 + H, zc, '#c4c9ce'); B.box(0.08, 0.08, L, x + W / 2, y0 + H, zc, '#c4c9ce'); for (let k = 1; k < 8; k++) B.box(W, 0.05, 0.05, x, y0 + H, z0 + k * 2, '#c4c9ce'); }
  B.box(W + 0.02, 0.25, 0.06, x, y0 + 0.02, z0 - 0.02, '#c0392b'); // ICC bar / rear sill
  for (const s of [-1, 1]) { B.box(0.06, H, 0.08, x + s * (W / 2 - 0.03), y0 + H / 2, z0, '#b0b6bb'); }
  // swing doors open against the sides
  B.box(0.04, H - 0.1, W / 2, x - W / 2 - 0.05, y0 + H / 2, z0 + W / 4, '#e9ebed'); B.box(0.04, H - 0.1, W / 2, x + W / 2 + 0.05, y0 + H / 2, z0 + W / 4, '#e9ebed');
  // running gear (tandem at rear) + landing gear
  for (const az of [z0 + 1.6, z0 + 2.9]) for (const s of [-1, 1]) B.cyl(0.5, 0.55, x + s * 0.95, GROUND + 0.5, az, '#1b1b1b', 14, 0, Math.PI / 2);
  B.box(2.0, 0.3, 3.2, x, GROUND + 0.95, z0 + 2.25, '#555');
  B.box(0.1, 1.2, 0.1, x - 0.9, GROUND + 0.6, z0 + 11.5, '#555'); B.box(0.1, 1.2, 0.1, x + 0.9, GROUND + 0.6, z0 + 11.5, '#555');
  B.box(W - 0.2, 0.3, L - 3.5, x, y0 - 0.25, zc + 1.5, '#4a4f54');
  sign(SIGN.walmart, 9, 2.25, x - W / 2 - 0.03, y0 + 1.45, zc + 0.5, -Math.PI / 2); sign(SIGN.walmart, 9, 2.25, x + W / 2 + 0.03, y0 + 1.45, zc + 0.5, Math.PI / 2);
  if (placard) { sign(SIGN['pl_' + placard], 0.8, 0.5, x + W / 2 + 0.031, y0 + 2.35, z0 + 1.2, Math.PI / 2); sign(SIGN['pl_' + placard], 0.8, 0.5, x - W / 2 - 0.031, y0 + 2.35, z0 + 1.2, -Math.PI / 2); sign(SIGN['pl_' + placard], 0.7, 0.44, x + 0.75, y0 + 2.4, z0 + L + 0.03, 0); }
}
// day-cab tractor at kingpin (x,zk) facing +z (away from dock)
function tractorBody(B, x, zk, col = '#0b3d91', ox = 0, oz = 0) { // body in local coords: rear axle at z=0, front at +z
  const g0 = B.g.length;
  B.box(2.4, 0.35, 6.3, 0, -0.55, 1.6, '#333'); B.box(2.3, 0.12, 1.4, 0, -0.32, -0.2, '#555');      // frame + fifth wheel deck
  B.box(2.45, 0.95, 2.1, 0, 0.0, 3.6, col); B.box(2.45, 0.9, 1.1, 0, 0.0, 5.05, col);                // cab lower body + hood
  B.box(2.45, 0.25, 2.1, 0, 2.05, 3.6, col); B.box(2.45, 0.8, 0.12, 0, 1.33, 2.6, col);               // roof cap + back wall (open glazing so the seated driver is visible)
  for (const sx of [-1.2, 1.2]) for (const sz of [2.6, 4.6]) B.box(0.08, 1.4, 0.08, sx, 1.25, sz, col);
  B.box(2.0, 0.6, 0.08, 0, -0.1, 5.62, '#c9ced2'); B.box(0.45, 0.06, 0.06, 0.55, 1.0, 4.2, '#222');  // grille, steering wheel
  for (const s of [-1, 1]) { B.box(0.08, 0.15, 0.4, s * 1.3, 1.05, 4.5, '#222'); B.box(0.6, 0.25, 0.4, s * 0.9, -0.5, 1.2, '#999'); B.cyl(0.33, 1.2, s * 1.15, 0.2, 2.2, '#c0c4c8', 10); }
  for (const [az, w] of [[0, 0.9], [4.6, 0.32]]) for (const s of [-1, 1]) B.cyl(0.52, w, s * 1.0, -0.68, az, '#1b1b1b', 14, 0, Math.PI / 2);
  for (let i = g0; i < B.g.length; i++) B.g[i].translate(x + ox, GROUND + 1.2, zk + oz);
  sign(SIGN.walmartCab, 1.2, 0.3, x + 1.255, GROUND + 1.45, zk + 3.6, Math.PI / 2); sign(SIGN.walmartCab, 1.2, 0.3, x - 1.255, GROUND + 1.45, zk + 3.6, -Math.PI / 2);
}
await __yield();
trailer(S, DOORS.A.x, 12.3, { roof: false, placard: 'FDS' }); tractorBody(S, DOORS.A.x, 12.3 + 15);
trailer(S, DOORS.B.x, 12.3, { roof: false, placard: 'CP' }); tractorBody(S, DOORS.B.x, 12.3 + 15);
// two more Walmart trucks waiting in the yard (ADS, MP), heading west on the yard lane
function xform(fn, m) { const s0 = signGeos.length, g0 = S.g.length; fn(); for (let i = g0; i < S.g.length; i++) S.g[i].applyMatrix4(m); for (let i = s0; i < signGeos.length; i++) signGeos[i].applyMatrix4(m); }
const YARD = [{ x: -22, z: 47, pl: 'ADS' }, { x: 6, z: 47, pl: 'MP' }];
for (const y of YARD) xform(() => { trailer(S, 0, 0, { roof: true, placard: y.pl }); tractorBody(S, 0, 15); }, new THREE.Matrix4().makeTranslation(y.x, 0, y.z).multiply(new THREE.Matrix4().makeRotationY(-Math.PI / 2)));

// static scene meshes
// ---------------- 1st floor (upstairs) shell: room walls, labels, simple box placeholders ----------------
// Inky models: divShelving, officeKit (manager, personnel, upc, storeManager), trainingRoom, lunchRoom, sickRoom, cleaningRoom, stairs (U-turn).
const UPF = { x0: -46, x1: -22, z0: -12, z1: 12, y: 4.2, wh: 1.3 };
{ const F = UPF.y, WC = '#e9e7e2', ROOMS = [];
  for (const [x, z] of [[-45.6, -11.6], [-22.4, -11.6], [-45.6, 11.6], [-22.4, 11.6], [-34, -11.6], [-34, 11.6], [-45.6, 0], [-22.4, 0]]) S.box(0.35, F, 0.35, x, F / 2, z, '#9aa0a6');
  S.box(24, 0.25, 24, -34, F - 0.125, 0, '#bfc3c7'); S.box(24, 0.02, 24, -34, F + 0.01, 0, '#d9d6cf');
  const wall = (x0, z0, x1, z1) => S.wall(x0, z0, x1, z1, F, F + UPF.wh, WC);
  wall(-46, -12, -22, -12); wall(-46, 12, -22, 12); wall(-46, -12, -46, 12);
  wall(-22, -12, -22, 6.4); // stair landing opening on the backroom side
  const ROW = [[-46, -38, 'Training room', 'trainingRoom'], [-38, -30, 'Lunch room', 'lunchRoom'], [-30, -26, 'Sick room', 'sickRoom'], [-26, -22, 'Cleaning', 'cleaningRoom']];
  const ROW2 = [[-46, -40.5, 'Store manager', 'officeKit'], [-40.5, -35.5, 'Personnel', 'officeKit'], [-35.5, -31, 'UPC office', 'officeKit'], [-31, -26.5, 'Variants manager', 'officeKit'], [-26.5, -24.6, 'Div shelving', 'divShelving']];
  for (const [rz0, rz1, list] of [[-12, -1, ROW], [1, 12, ROW2]]) { const zc = rz1 > 0 ? 1 : -1; // corridor walls with a door gap per room
    for (const [a, b, name] of list) { const m = (a + b) / 2; wall(a, zc, m - 0.5, zc); wall(m + 0.5, zc, b, zc); if (b < -22.1) wall(b, rz0, b, rz1);
      ROOMS.push([name, m, (rz0 + rz1) / 2]); sign(textSign([name], { w: 512, h: 96, bg: '#041e42', fg: '#fff', size: 0.5 }), Math.min(2.6, b - a - 0.4), 0.42, m, F + UPF.wh + 0.3, zc + (zc > 0 ? -0.07 : 0.07) * -1, zc > 0 ? Math.PI : 0); } }
  // Inky's floor-1 models (parts/v4/*.js, shared PM materials so no new programs)
  const put = (g, x, z, ry = 0) => { g.position.set(x, F, z); g.rotation.y = ry; scene.add(g); return g; };
  put(buildTraining(THREE, PM, { seed: 3, tables: 4 }), -42, -6.6);
  put(buildLunch(THREE, PM, { seed: 4, tables: 3, fridgeOpen: 0 }), -34, -6.6);
  put(buildSick(THREE, PM, { seed: 5 }), -28, -7.0);
  put(buildCleaning(THREE, PM, { seed: 6, cartColor: 'yellow' }), -24, -7.0);
  for (const [name, v, sd] of [['Store manager', 'storeManager', 1], ['Personnel', 'personnel', 2], ['UPC office', 'upc', 3], ['Variants manager', 'manager', 4]]) { const r = ROOMS.find((q) => q[0] === name); put(buildOffice(THREE, PM, { variant: v, seed: sd }), r[1], 7.2); }
  for (const [z, sd] of [[4.0, 11], [8.6, 12]]) put(buildDiv(THREE, PM, { seed: sd, bays: 3, colorRate: 0.1 }), -25.55, z, Math.PI / 2);
  // U-turn stairs from the backroom floor up to the 1st-floor opening (west side)
  const ST = buildStairs(THREE, PM, { rise: F, landing: true }); ST.position.set(-21.2, 0, 8.6); ST.rotation.y = 0; scene.add(ST); window.__stairs = ST;
  sign(textSign(['1st floor · offices & staff rooms'], { w: 1024, h: 128, bg: '#0071ce', fg: '#fff', size: 0.46 }), 6, 0.75, -34, F + UPF.wh + 1.2, 12.05, 0);
}
scene.add(S.merge(MAT.v, 'static'));
const LIGHTS_MESH = tubes.merge(MAT.e, 'lights'); scene.add(LIGHTS_MESH);
const UPPER = UP.merge(MAT.v, 'upper'); scene.add(UPPER);
// seated driver seats for static tractors (world coords) — filled in by the sim
const DRIVER_SEATS = [];
for (const d of [DOORS.A, DOORS.B]) DRIVER_SEATS.push({ x: d.x + 0.55, y: GROUND + 1.2 + 0.05, z: 12.3 + 15 + 3.5, yaw: 0 });
for (const y of YARD) DRIVER_SEATS.push({ x: y.x - 15 - 3.5, y: GROUND + 1.2 + 0.05, z: y.z + 0.55, yaw: -Math.PI / 2 });
{ const sm = new THREE.Mesh(mergeGeometries(signGeos, false), MAT.sign); sm.name = 'signs'; sm.matrixAutoUpdate = false; scene.add(sm); atlasTex.needsUpdate = true; }
