// ====================================================================== ENVIRONMENT
// Layout (spec x,y; Three X=x-50, Z=31-y):
//  RCV y0-10 | MXA y10-15 | RES y15-45 (aisles 01-08, x 2-45) | XDK x45-50 | PM x50-72 | CNV x72-98 | NXA y45-50 (SRT1 +5m above) | OBS y50-62
const IN_DOORS = Array.from({ length: 8 }, (_, i) => ({ id: 'DR-' + String(i + 1).padStart(3, '0'), x: 10 + i * 4, side: 'S' }));
const OUT_DOORS = Array.from({ length: 8 }, (_, i) => ({ id: 'DS-' + (101 + i), x: 26 + i * 4, side: 'N' }));
const AISLES = Array.from({ length: 8 }, (_, i) => ({ id: String(i + 1).padStart(2, '0'), x: 3.6 + 5.4 * i, dir: i % 2 === 0 ? 'N' : 'S' }));
const RACK_LV = [0, 1.75, 3.5, 5.25, 7.0, 8.75], RACK_H = 10.0, BAYS = 11, BAY_W = 2.7, BAY_Y0 = 15.3;
const bayY = (b) => BAY_Y0 + BAY_W * (b + 0.5);
const world = new THREE.Group(); scene.add(world);
const MAT = {
  wall: M(0xf2f3f5), band: M(0x8f969f), lower: M(0xb9bec5), cut: M(0xd9dee4), blue: M(0x0071ce, { r: 0.6 }), navy: M(0x041e42),
  yellow: M(0xffc220, { r: 0.6 }), seal: M(0x2a2f36), door: M(0xe3e7ec), concrete: M(0xcfd3d8), column: M(0xe9ecef),
  glass: new THREE.MeshStandardMaterial({ color: 0x86b9df, roughness: 0.12, metalness: 0.3 }), green: M(0x3e8a58), grey: M(0x9aa3ae),
};
function hiCanvas(w, h, draw, opts = {}) { return canvasTexture(w, h, draw, opts); }
// ---------- ground texture (site) : 10 px/m
const GP = 10, GW = SITE.x1 - SITE.x0, GD = SITE.z1 - SITE.z0;
const groundTex = hiCanvas(GW * GP, GD * GP, (ctx, W, H) => {
  const X = (x) => (x - SITE.x0) * GP, Z = (z) => (z - SITE.z0) * GP;
  const rect = (x0, z0, x1, z1, c) => { ctx.fillStyle = c; ctx.fillRect(X(Math.min(x0, x1)), Z(Math.min(z0, z1)), Math.abs(x1 - x0) * GP, Math.abs(z1 - z0) * GP); };
  const line = (x0, z0, x1, z1, c, w, dash) => { ctx.strokeStyle = c; ctx.lineWidth = w * GP; ctx.setLineDash(dash ? dash.map((d) => d * GP) : []); ctx.beginPath(); ctx.moveTo(X(x0), Z(z0)); ctx.lineTo(X(x1), Z(z1)); ctx.stroke(); ctx.setLineDash([]); };
  rect(SITE.x0, SITE.z0, SITE.x1, SITE.z1, '#b8d59c');
  for (let i = 0; i < 3000; i++) { ctx.fillStyle = `rgba(${rnd() < 0.5 ? '96,146,74' : '232,242,205'},0.06)`; ctx.beginPath(); ctx.arc(rnd() * W, rnd() * H, 4 + rnd() * 26, 0, 7); ctx.fill(); }
  const asphalt = '#9298a0', court = '#c7cbd0';
  // perimeter one-way road (clockwise)
  rect(-58, -86, 104, -78, asphalt); rect(-58, 78, 104, 86, asphalt); rect(-58, -86, -50, 86, asphalt); rect(96, -86, 104, 86, asphalt);
  line(-54, -82, 100, -82, '#ffffff', 0.15, [3, 3]); line(-54, 82, 100, 82, '#ffffff', 0.15, [3, 3]); line(-54, -82, -54, 82, '#ffffff', 0.15, [3, 3]); line(100, -82, 100, 82, '#ffffff', 0.15, [3, 3]);
  for (const s of [1, -1]) {
    // truck court + yard
    rect(-50, s * 31, 96, s * 78, court);
    for (const d of (s > 0 ? IN_DOORS : OUT_DOORS)) { line(sx(d.x) - 2, s * 31, sx(d.x) - 2, s * 50, '#f2c230', 0.15); line(sx(d.x) + 2, s * 31, sx(d.x) + 2, s * 50, '#f2c230', 0.15); }
    line(-48, s * 53, 94, s * 53, '#d23b2f', 0.3);
    for (let i = 0; i <= 15; i++) line(-46 + i * 4, s * 60, -46 + i * 4, s * 77, '#f2c230', 0.14);
    line(-46, s * 60, 14, s * 60, '#f2c230', 0.14);
    for (let i = 0; i < 15; i++) { ctx.save(); ctx.translate(X(-44 + i * 4), Z(s * 74)); ctx.fillStyle = '#5d6670'; ctx.font = `700 ${1.2 * GP}px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText((s > 0 ? 'YA-' : 'YD-') + String(i + 1).padStart(2, '0'), 0, 0); ctx.restore(); }
    for (let x = -44; x < 94; x += 12) { ctx.fillStyle = '#ffffff'; ctx.save(); ctx.translate(X(x), Z(s * 56)); ctx.beginPath(); ctx.moveTo(-2.4 * GP, -0.35 * GP); ctx.lineTo(1.2 * GP, -0.35 * GP); ctx.lineTo(1.2 * GP, -0.9 * GP); ctx.lineTo(2.4 * GP, 0); ctx.lineTo(1.2 * GP, 0.9 * GP); ctx.lineTo(1.2 * GP, 0.35 * GP); ctx.lineTo(-2.4 * GP, 0.35 * GP); ctx.fill(); ctx.restore(); }
  }
  // building pad
  rect(-50.5, -31.5, 50.5, 31.5, '#d4d8dc');
  // office walk + parking (east)
  rect(50, -24, 62, 24, '#e2e4e6'); rect(64, -30, 94, 30, asphalt);
  for (const xr of [[65, 70.5], [77, 82.5], [84, 89.5]]) for (let z = -28; z <= 28; z += 2.7) line(xr[0], z, xr[1], z, '#f5f5f0', 0.12);
  for (const x of [76, 83.5]) rect(x - 0.6, -28, x + 0.6, 28, '#a6cc8c');
  for (let z = -2.5; z <= 2.5; z += 1.0) rect(62, z, 64, z + 0.5, '#f5f5f0');
});
groundTex.generateMipmaps = true; groundTex.minFilter = THREE.LinearMipmapLinearFilter;
const slab = new THREE.Group(); world.add(slab);
{
  const g = new THREE.Mesh(new THREE.PlaneGeometry(GW, GD), new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.95 }));
  g.rotation.x = -Math.PI / 2; g.position.set((SITE.x0 + SITE.x1) / 2, 0, 0); g.receiveShadow = true; slab.add(g);
  const cx = (SITE.x0 + SITE.x1) / 2;
  const base = new THREE.Mesh(rbox(GW, 5, GD, 1.0, 3), M(0xf4f6f9)); base.position.set(cx, -2.505, 0); base.receiveShadow = true; slab.add(base);
  const band = new THREE.Mesh(rbox(GW + 0.3, 1.1, GD + 0.3, 0.5, 2), M(0x0071ce, { r: 0.55 })); band.position.set(cx, -1.05, 0); slab.add(band);
  const band2 = new THREE.Mesh(rbox(GW + 0.36, 0.34, GD + 0.36, 0.16, 2), M(0xffc220, { r: 0.55 })); band2.position.set(cx, -1.85, 0); slab.add(band2);
  const st = hiCanvas(256, 256, (ctx, W) => { const gr = ctx.createRadialGradient(W / 2, W / 2, W * 0.18, W / 2, W / 2, W * 0.5); gr.addColorStop(0, 'rgba(20,40,70,0.28)'); gr.addColorStop(1, 'rgba(20,40,70,0)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, W); });
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(GW * 1.5, GD * 1.5), new THREE.MeshBasicMaterial({ map: st, transparent: true, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.position.set(cx, -5.2, 0); slab.add(sh);
}
// ---------- building shell
const bld = new THREE.Group(); world.add(bld);
const floorTex = hiCanvas(BW * 20, BD * 20, (ctx, W, H) => {
  const P = 20, X = (x) => x * P, Y = (y) => (BD - y) * P;
  ctx.fillStyle = '#d6dadf'; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 2600; i++) { ctx.fillStyle = `rgba(${rnd() < 0.5 ? '255,255,255' : '125,133,142'},0.03)`; ctx.beginPath(); ctx.arc(rnd() * W, rnd() * H, 5 + rnd() * 40, 0, 7); ctx.fill(); }
  ctx.strokeStyle = 'rgba(110,118,128,0.22)'; ctx.lineWidth = 1.5; for (let x = 0; x <= BW; x += 6) { ctx.beginPath(); ctx.moveTo(X(x), 0); ctx.lineTo(X(x), H); ctx.stroke(); } for (let y = 0; y <= BD; y += 6) { ctx.beginPath(); ctx.moveTo(0, Y(y)); ctx.lineTo(W, Y(y)); ctx.stroke(); }
  const ln = (x0, y0, x1, y1, c = '#f2c230', w = 0.12) => { ctx.strokeStyle = c; ctx.lineWidth = w * P; ctx.beginPath(); ctx.moveTo(X(x0), Y(y0)); ctx.lineTo(X(x1), Y(y1)); ctx.stroke(); };
  const rect = (x0, y0, x1, y1, c) => { ctx.fillStyle = c; ctx.fillRect(X(x0), Y(y1), (x1 - x0) * P, (y1 - y0) * P); };
  // MXA walkway (south edge) + NXA walkway (north edge) green with zebra crossings
  rect(0, 10, 100, 11.2, 'rgba(61,154,90,0.55)'); rect(0, 48.8, 100, 50, 'rgba(61,154,90,0.55)');
  for (const y of [11.2, 15, 45, 48.8]) ln(0, y, 100, y);
  ln(0, 13.1, 100, 13.1, '#ffffff', 0.08); ln(0, 46.9, 100, 46.9, '#ffffff', 0.08);
  for (const zx of [27, 47.5, 75]) for (let k = 0; k < 6; k++) { rect(zx - 1.5, 10 + k * 0.2 * 1, zx + 1.5, 10 + k * 0.2 + 0.1, '#f5f5f0'); }
  // door corridors + stage lanes (RCV) and OBS lanes
  for (const d of IN_DOORS) { ln(d.x - 1.15, 0, d.x - 1.15, 10); ln(d.x + 1.15, 0, d.x + 1.15, 10); rect(d.x + 1.25, 0.4, d.x + 2.75, 9.6, 'rgba(242,194,48,0.18)'); rect(d.x - 1.1, 0, d.x + 1.1, 1.6, 'rgba(61,154,90,0.85)'); }
  for (const d of OUT_DOORS) { ln(d.x - 1.15, 50, d.x - 1.15, 62); ln(d.x + 1.15, 50, d.x + 1.15, 62); rect(d.x + 1.25, 52.4, d.x + 2.75, 61.6, 'rgba(242,194,48,0.18)'); rect(d.x - 1.1, 60.4, d.x + 1.1, 62, 'rgba(61,154,90,0.85)'); }
  // XDK corridor with northbound arrows
  rect(45, 15, 50, 45, 'rgba(0,113,206,0.10)'); ln(45, 15, 45, 45); ln(50, 15, 50, 45);
  const arrow = (x, y, rot, c = 'rgba(255,255,255,0.9)') => { ctx.save(); ctx.translate(X(x), Y(y)); ctx.rotate(rot); ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, -1.2 * P); ctx.lineTo(0.7 * P, -0.2 * P); ctx.lineTo(0.25 * P, -0.2 * P); ctx.lineTo(0.25 * P, 1.0 * P); ctx.lineTo(-0.25 * P, 1.0 * P); ctx.lineTo(-0.25 * P, -0.2 * P); ctx.lineTo(-0.7 * P, -0.2 * P); ctx.fill(); ctx.restore(); };
  for (let y = 20; y < 44; y += 7) arrow(47.5, y, 0);
  for (const a of AISLES) for (const y of [17, 43]) arrow(a.x, y, a.dir === 'N' ? 0 : Math.PI, 'rgba(242,194,48,0.95)');
  for (let x = 6; x < 98; x += 12) { arrow(x, 12.15, Math.PI / 2); arrow(x + 6, 14.05, -Math.PI / 2); arrow(x, 46, Math.PI / 2); arrow(x + 6, 47.9, -Math.PI / 2); }
  ctx.font = `800 ${1.9 * P}px Inter, Arial`; ctx.fillStyle = 'rgba(4,30,66,0.5)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const lbl = (t, x, y, r = 0, s = 1) => { ctx.save(); ctx.translate(X(x), Y(y)); ctx.rotate(r); ctx.scale(s, s); ctx.fillText(t, 0, 0); ctx.restore(); };
  lbl('RECEIVING', 60, 5); lbl('MAIN CROSS-AISLE · MXA', 82, 12.6, 0, 0.55); lbl('NORTH CROSS-AISLE · NXA', 14, 47.4, 0, 0.55); lbl('SHIPPING · OBS', 68, 56); lbl('XDK ▲', 47.5, 44, 0, 0.6);
  lbl('CNV · INDUCT', 85, 40, 0, 0.8);
  for (const a of AISLES) lbl(a.id, a.x, 16.2, 0, 0.6);
});
floorTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
{
  const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.42, metalness: 0.0 });
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(BW, FLOOR, BD), [MAT.lower, MAT.lower, floorMat, MAT.lower, MAT.lower, MAT.lower]);
  plinth.position.set(0, FLOOR / 2, 0); plinth.receiveShadow = true; plinth.castShadow = true; bld.add(plinth);
}
const T = 0.4, DOOR_W = 3.0, DOOR_H = 3.2, LOW_H = FLOOR + DOOR_H + 1.3, FULL_H = ROOF_Y;
const doorPanels = {};
function dockWall(doors, zw, s, top) {   // s = +1 south (outside +Z), -1 north
  const xs = doors.map((d) => sx(d.x)); const edges = [-50, ...xs.flatMap((x) => [x - DOOR_W / 2, x + DOOR_W / 2]), 50];
  for (let i = 0; i < edges.length; i += 2) box(edges[i + 1] - edges[i], DOOR_H, T, MAT.wall, (edges[i] + edges[i + 1]) / 2, FLOOR + DOOR_H / 2, zw, bld);
  box(BW, top - FLOOR - DOOR_H, T, MAT.wall, 0, (top + FLOOR + DOOR_H) / 2, zw, bld);
  box(BW + 0.02, top < 8 ? 0.35 : 0.9, 0.04, top < 8 ? MAT.blue : MAT.band, 0, top - (top < 8 ? 0.4 : 1.4), zw + s * 0.22, bld);
  box(BW, 0.45, 0.04, MAT.blue, 0, FLOOR + DOOR_H + 0.55, zw - s * 0.22, bld); box(BW, 0.18, 0.04, MAT.yellow, 0, FLOOR + DOOR_H + 0.22, zw - s * 0.22, bld);
  box(BW + 0.02, 0.06, T + 0.04, MAT.cut, 0, top + 0.03, zw, bld);
  doors.forEach((d) => {
    const x = sx(d.x);
    for (const dx of [-1, 1]) box(0.3, DOOR_H + 0.3, 0.5, MAT.seal, x + dx * (DOOR_W / 2 + 0.1), FLOOR + DOOR_H / 2 - 0.05, zw + s * 0.42, bld);
    box(DOOR_W + 0.5, 0.35, 0.5, MAT.seal, x, FLOOR + DOOR_H + 0.12, zw + s * 0.42, bld);
    const dp = box(DOOR_W - 0.06, DOOR_H, 0.08, MAT.door, x, FLOOR + DOOR_H / 2, zw, bld); dp.castShadow = false;
    for (let k = 1; k < 8; k++) box(DOOR_W - 0.1, 0.03, 0.1, MAT.grey, 0, -DOOR_H / 2 + k * DOOR_H / 8, 0, dp);
    dp.userData = { open: 0, target: 0, x, zw }; doorPanels[d.id] = dp;
    const hz = new THREE.Mesh(new THREE.BoxGeometry(DOOR_W, 0.5, 0.2), new THREE.MeshStandardMaterial({ map: hazardTex(), roughness: 0.7 })); hz.position.set(x, FLOOR - 0.3, zw + s * 0.32); bld.add(hz);
    for (const dx of [-1.15, 1.15]) box(0.3, 0.42, 0.26, MAT.seal, x + dx, FLOOR - 0.28, zw + s * 0.52, bld);
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.56), new THREE.MeshBasicMaterial({ map: numTex(d.id), transparent: true }));
    plate.position.set(x, FLOOR + DOOR_H + 0.75, zw + s * 0.68); plate.rotation.y = s > 0 ? 0 : Math.PI; bld.add(plate);
    for (const dx of [-1.85, 1.85]) { const b = new THREE.Mesh(roundCyl(0.11, 1.1, 0.04, 16), MAT.yellow); b.position.set(x + dx, FLOOR + 0.55, zw - s * 0.5); b.castShadow = true; bld.add(b); }
    const lm = new THREE.MeshStandardMaterial({ color: 0x2ecc71, emissive: 0x2ecc71, emissiveIntensity: 1.4 });
    const dl = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 10), lm); dl.position.set(x + 2.0, FLOOR + DOOR_H + 0.2, zw + s * 0.3); bld.add(dl); dp.userData.lamp = lm;
    // yellow dock fan (inside, above door)
    const fan = new THREE.Mesh(roundCyl(0.45, 0.25, 0.08, 20, 'z'), MAT.yellow); fan.position.set(x - 2.0, FLOOR + DOOR_H + 1.6, zw - s * 0.5); bld.add(fan);
  });
}
function hazardTex() { if (hazardTex.t) return hazardTex.t; hazardTex.t = hiCanvas(512, 128, (ctx, W, H) => { ctx.fillStyle = '#ffc220'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#1b1f24'; for (let x = -128; x < W; x += 64) { ctx.beginPath(); ctx.moveTo(x, H); ctx.lineTo(x + 32, H); ctx.lineTo(x + 96, 0); ctx.lineTo(x + 64, 0); ctx.fill(); } }); return hazardTex.t; }
function numTex(t) { return hiCanvas(400, 160, (ctx, W, H) => { ctx.fillStyle = '#041e42'; ctx.beginPath(); ctx.roundRect(4, 4, W - 8, H - 8, 26); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = `800 ${H * 0.56}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t, W / 2, H / 2 + 4); }); }
dockWall(IN_DOORS, BD / 2, 1, LOW_H);       // south wall cut low (near side)
dockWall(OUT_DOORS, -BD / 2, -1, FULL_H);   // north wall full height
// west full, east cut low
box(T, FULL_H - FLOOR, BD, MAT.wall, -BW / 2, (FULL_H + FLOOR) / 2, 0, bld); box(0.04, 0.9, BD, MAT.band, -BW / 2 - 0.22, FULL_H - 1.4, 0, bld);
box(0.04, 0.45, BD, MAT.blue, -BW / 2 + 0.22, FLOOR + 3.75, 0, bld); box(0.04, 0.18, BD, MAT.yellow, -BW / 2 + 0.22, FLOOR + 3.42, 0, bld);
box(T + 0.04, 0.06, BD, MAT.cut, -BW / 2, FULL_H + 0.03, 0, bld);
box(T, LOW_H - FLOOR, BD, MAT.wall, BW / 2, (LOW_H + FLOOR) / 2, 0, bld); box(T + 0.04, 0.06, BD, MAT.cut, BW / 2, LOW_H + 0.03, 0, bld);
box(0.04, 0.35, BD, MAT.blue, BW / 2 + 0.22, LOW_H - 0.4, 0, bld);
// columns (grid avoiding aisles: along MXA south edge & NXA)
for (let x = 6; x < 100; x += 12) for (const y of [10.0, 50.0]) if (Math.abs(x - 47.5) > 3) box(0.45, FULL_H - FLOOR, 0.45, MAT.column, sx(x), (FULL_H + FLOOR) / 2, sz(y), bld);
// roof (toggle)
const roof = new THREE.Group(); world.add(roof); roof.visible = false;
box(BW + 0.8, 0.5, BD + 0.8, M(0xf6f7f8), 0, FULL_H + 0.25, 0, roof);
for (let i = 0; i < 16; i++) box(2.4, 1.1, 1.8, M(0xa9b0b8), -40 + (i % 8) * 11, FULL_H + 1.0, -14 + Math.floor(i / 8) * 26, roof, 0.12);
// high-bay lights (emissive discs under roof line, visible from cutaway)
const bayLightMat = new THREE.MeshStandardMaterial({ color: 0xf4f6f8, emissive: 0xfff3d6, emissiveIntensity: 0.25 });
{ const pts = []; for (let x = 4; x < 100; x += 8) for (let y = 4; y < 62; y += 8) pts.push([sx(x), sz(y)]);
  const im = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.35, 0.5, 0.35, 16), bayLightMat, pts.length); const m = new THREE.Matrix4();
  pts.forEach(([x, z], i) => { m.makeTranslation(x, ROOF_Y - 0.6, z); im.setMatrixAt(i, m); }); bld.add(im); }

// ---------- office annex + Supercentre-style facade (east short side)
const office = new THREE.Group(); world.add(office);
{
  const beige = M(0xe9ddc7), blueP = M(0x0071ce, { r: 0.55 });
  const O = (x, y, z, w, h, d, m, r = 0) => box(w, h, d, m, x, y, z, office, r);
  O(54, 3.5, 0, 8, 7, 30, M(0xeef0f2)); O(54, 6.8, 0, 8.2, 0.7, 30.2, blueP);
  O(57.9, 2.6, -9, 0.3, 5.2, 10, beige); O(57.9, 2.6, 9, 0.3, 5.2, 10, beige);
  O(58.05, 1.8, 0, 0.2, 3.6, 7, MAT.glass); for (let z = -3; z <= 3; z += 1.5) O(58.15, 1.8, z, 0.12, 3.6, 0.1, MAT.navy);
  O(59.6, 4.0, 0, 3.2, 0.35, 10, M(0xf5f6f7));
  // parapet with angled peak
  const sh = new THREE.Shape(); sh.moveTo(-7, 0); sh.lineTo(7, 0); sh.lineTo(7, 10); sh.lineTo(0, 11.8); sh.lineTo(-7, 10); sh.closePath();
  const par = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 1.2, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.12, bevelSegments: 3 }), blueP);
  par.rotation.y = Math.PI / 2; par.position.set(57.4, 0, 0); par.castShadow = par.receiveShadow = true; office.add(par);
  const signTex = hiCanvas(2048, 1024, (ctx, W, H) => { ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.font = `700 ${H * 0.36}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Walmart', W / 2 - W * 0.07, H / 2 + 20); drawSpark(ctx, W * 0.86, H / 2 - H * 0.08, H * 0.17); });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), new THREE.MeshStandardMaterial({ map: signTex, transparent: true, roughness: 0.6, emissive: 0xffffff, emissiveMap: signTex, emissiveIntensity: 0.08, polygonOffset: true, polygonOffsetFactor: -2 }));
  sign.rotation.y = Math.PI / 2; sign.position.set(58.75, 7.6, 0); office.add(sign); office.userData.signMat = sign.material;
  const sub = hiCanvas(1024, 160, (ctx, W, H) => { ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.font = `600 ${H * 0.5}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Demo RDC-7041 · Distribution Center', W / 2, H / 2); });
  const sb = new THREE.Mesh(new THREE.PlaneGeometry(11, 1.7), new THREE.MeshBasicMaterial({ map: sub, transparent: true })); sb.rotation.y = Math.PI / 2; sb.position.set(58.75, 3.2, 0); office.add(sb);
  for (let z = -13; z <= 13; z += 2) if (Math.abs(z) > 4) { const b = new THREE.Mesh(roundCyl(0.14, 1.0, 0.05, 16), blueP); b.position.set(61, 0.5, z); b.castShadow = true; office.add(b); }
  for (const z of [-10, -3.5, 3.5, 10]) O(53, 7.6, z, 2, 0.9, 1.6, M(0xa9b0b8), 0.08);
  // spark on the warehouse NE corner panel
  O(49.0, (FULL_H + 2) / 2, -31.5, 0.6, FULL_H + 2, 0.6, blueP);
}
// ---------- trees, cars, poles, gatehouse
const crownGeo = new THREE.IcosahedronGeometry(2, 3), trunkGeo = new THREE.CylinderGeometry(0.22, 0.3, 2.2, 10);
const treePts = [];
for (let z = -76; z <= 76; z += 6) { treePts.push([-60 + rnd(), z + rnd()]); treePts.push([106 + rnd(), z + rnd()]); }
for (let x = -46; x < 96; x += 7) { treePts.push([x + rnd(), -88.5]); treePts.push([x + rnd(), 88.5]); }
for (let z = -28; z <= 28; z += 8) { treePts.push([76, z]); treePts.push([83.5, z + 4]); }
for (const z of [-28, -18, 18, 28]) treePts.push([62.5, z]);
const trunks = new THREE.InstancedMesh(trunkGeo, M(0x8a6a4a), treePts.length), crowns = new THREE.InstancedMesh(crownGeo, M(0xffffff), treePts.length);
{ const m = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color();
  treePts.forEach(([x, z], i) => { const s = 0.75 + rnd() * 0.45; m.compose(V3(x, 1.1 * s, z), q, V3(s, s, s)); trunks.setMatrixAt(i, m); m.compose(V3(x, 3.7 * s, z), q, V3(s, s * 1.1, s)); crowns.setMatrixAt(i, m); crowns.setColorAt(i, c.setHSL(0.26 + rnd() * 0.07, 0.42, 0.42 + rnd() * 0.1)); });
  [trunks, crowns].forEach((im) => { im.castShadow = im.receiveShadow = true; world.add(im); }); }
{ const cars = []; for (const xr of [67.7, 79.7, 86.7]) for (let z = -26.65; z <= 26.65; z += 2.7) if (rnd() < 0.6) cars.push([xr, z]);
  const body = rbox(4.3, 0.8, 1.8, 0.33, 3), top = rbox(2.3, 0.62, 1.56, 0.26, 3);
  const ib = new THREE.InstancedMesh(body, M(0xffffff, { r: 0.45 }), cars.length), it = new THREE.InstancedMesh(top, M(0x27303b, { r: 0.3 }), cars.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color(), cols = [0xf2f3f5, 0xc8ccd2, 0x2f3540, 0x0071ce, 0xd84a3a, 0x6c7a89, 0x1d2a44, 0xe9e2d0];
  cars.forEach(([x, z], i) => { m.compose(V3(x, 0.62, z), q, V3(1, 1, 1)); ib.setMatrixAt(i, m); m.compose(V3(x - 0.2, 1.3, z), q, V3(1, 1, 1)); it.setMatrixAt(i, m); ib.setColorAt(i, c.set(pick(cols))); });
  [ib, it].forEach((im) => { im.castShadow = im.receiveShadow = true; world.add(im); }); }
const poleHeads = [];
for (const [x, z] of [[73, -20], [73, 0], [73, 20], [90, -10], [90, 10], [-20, 56], [20, 56], [60, 56], [-20, -56], [20, -56], [60, -56]]) {
  const g = new THREE.Group(); g.position.set(x, 0, z); world.add(g);
  box(0.24, 9, 0.24, M(0x6b7480), 0, 4.5, 0, g); box(2.6, 0.14, 0.2, M(0x6b7480), 0, 9, 0, g);
  const hm = new THREE.MeshStandardMaterial({ color: 0xf6f3ea, emissive: 0xffe2a0, emissiveIntensity: 0.15 }); poleHeads.push(hm);
  for (const dx of [-1.2, 1.2]) box(0.75, 0.22, 0.42, hm, dx, 8.88, 0, g);
}
// gatehouse at SE (in-lanes on perimeter road)
{ const g = new THREE.Group(); g.position.set(100, 0, 70); world.add(g);
  box(3.2, 3.0, 4.2, M(0xf2f3f5), 0, 1.5, 0, g, 0.1); box(3.8, 0.3, 4.8, MAT.blue, 0, 3.15, 0, g);
  box(1.2, 1.4, 0.06, MAT.glass, 1.62, 1.8, 0, g);
  const arm = new THREE.Group(); arm.position.set(-2.2, 1.0, -2.5); g.add(arm); box(0.3, 1.0, 0.3, MAT.yellow, 0, -0.5, 0, arm); const bar = box(0.1, 0.1, 3.4, M(0xd23b2f), 0, 0, -1.7, arm); g.userData.arm = arm; world.userData.gate = g; }
