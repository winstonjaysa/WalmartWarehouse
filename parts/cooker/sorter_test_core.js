// Shared headless test core for sorter.js (used by sorter_test.html and the node runner). Test-only.
export function runTest(THREE, Sorter, scene, { check = true, shotAt = null, log = () => {}, colors = null } = {}) {
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647); 
const srt = Sorter.create(scene, { lanes: 8, speed: 2.0 });
const arrived = []; srt.onCaseArrived((m, lane) => arrived.push({ id: m.userData.id, lane, want: m.userData.lane, t: srt.time }));
for (let i = 0; i < 40; i++) { const L = 0.4 + rnd() * 0.25, H = 0.22 + rnd() * 0.25, W = 0.3 + rnd() * 0.2;
  const m = new THREE.Mesh(new THREE.BoxGeometry(L, H, W), colors ? new THREE.MeshStandardMaterial({ color: colors[i % colors.length], roughness: 0.85 }) : undefined); m.castShadow = true; m.userData = { id: i, lane: (i * 3) % 8, L, H, W }; srt.addCase(m, m.userData.lane); }
srt.group.updateMatrixWorld(true);
const statics = []; if (check) 
for (const o of [...srt.surfaces, srt.bed?.shoes].filter(Boolean)) {
  if (o.isInstancedMesh) { statics.push(o); continue; }
  const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry, p = g.attributes.position.array, CH = 300 * 9;
  for (let i = 0; i < p.length; i += CH) { const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.BufferAttribute(p.slice(i, i + CH), 3));
    const cm = new THREE.Mesh(cg, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })); cm.name = o.name; cm.matrixAutoUpdate = false; cm.matrix.copy(o.matrixWorld); cm.matrixWorld.copy(o.matrixWorld); cg.computeBoundingSphere(); cg.computeBoundingBox(); statics.push(cm); } }
log('statics', statics.length, statics.map(o=>o.name).join(','));
const ray = new THREE.Raycaster(), v = new THREE.Vector3(), dn = new THREE.Vector3(0, -1, 0), up = new THREE.Vector3(0,1,0);
const R = { maxPen: 0, at: null, maxHover: 0, overlaps: 0, worst: 0 };
function checkPen() { for (const c of srt.cases) { if (c.where === 'pending') continue; const m = c.mesh; m.updateMatrixWorld(); const { L, H, W } = m.userData, off = Math.min(0.2, H * 0.9);
  for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) { v.set(a / 2 * L / 2, -H / 2, b / 2 * W / 2).applyMatrix4(m.matrixWorld);
    ray.set(v.clone().addScaledVector(up, off), dn); ray.far = off + 0.3; const h = ray.intersectObjects(statics, false)[0]; if (!h) continue; const pen = off - h.distance;
    if (pen > R.maxPen) { R.maxPen = pen; R.at = { where: c.where, s: +c.s.toFixed(2), obj: h.object.name, id: m.userData.id, t: +srt.time.toFixed(2), a, b }; }
    if (a === 0 && b === 0 && -pen > R.maxHover) { R.maxHover = -pen; R.hovAt = { where: c.where, s: +c.s.toFixed(2), obj: h.object.name, id: m.userData.id, lift: c.lift }; } } } }
function obb(m) { m.updateMatrixWorld(); const e = m.matrixWorld.elements; const { L, H, W } = m.userData;
  return { c: new THREE.Vector3(e[12], e[13], e[14]), a: [new THREE.Vector3(e[0], e[1], e[2]).normalize(), new THREE.Vector3(e[4], e[5], e[6]).normalize(), new THREE.Vector3(e[8], e[9], e[10]).normalize()], h: [L / 2, H / 2, W / 2], id: m.userData.id }; }
function sat(A, B) { if (A.c.distanceTo(B.c) > 1.2) return 0; const axes = [...A.a, ...B.a]; for (const x of A.a) for (const y of B.a) { const z = x.clone().cross(y); if (z.lengthSq() > 1e-8) axes.push(z.normalize()); }
  const d = B.c.clone().sub(A.c); let mn = Infinity; for (const ax of axes) { const ra = A.h.reduce((s, h, i) => s + h * Math.abs(A.a[i].dot(ax)), 0), rb = B.h.reduce((s, h, i) => s + h * Math.abs(B.a[i].dot(ax)), 0);
    const o = ra + rb - Math.abs(d.dot(ax)); if (o <= 0) return 0; mn = Math.min(mn, o); } return mn; }
function checkOv() { const live = srt.cases.filter((c) => c.where !== 'pending').map((c) => obb(c.mesh));
  for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) { const o = sat(live[i], live[j]); if (o > 0.001) { R.overlaps++; if (o > R.worst) { R.worst = o; R.ovAt = [live[i].id, live[j].id, srt.time.toFixed(2)]; } } } }
let steps = 0; const t0 = Date.now(); 
while (srt.time < (shotAt ?? 900) && (shotAt != null || arrived.length < 40)) { srt.update(1 / 60); steps++; if (check && steps % 12 === 0) { checkPen(); checkOv(); }
  if (steps % 1800 === 0) { const w = {}; srt.cases.forEach(c => w[c.where] = (w[c.where] || 0) + 1); log('t', srt.time.toFixed(0), 'arr', arrived.length, JSON.stringify(w), JSON.stringify(srt.stats), 'pen', R.maxPen.toFixed(4), 'ov', R.overlaps, JSON.stringify(R.at), ((Date.now() - t0) / 1000).toFixed(1) + 's'); } }
return { ...R, arrived: arrived.length, wrong: arrived.filter(a => a.lane !== a.want).length, simTime: +srt.time.toFixed(1), stats: srt.stats, srt };
}
