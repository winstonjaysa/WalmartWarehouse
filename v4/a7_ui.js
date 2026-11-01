// ======================= STORY / CAMERA / LABELS / LOOP =======================
// seat & grip points from Inky's parts when available
const STEPS = [...document.querySelectorAll('.step')].map((el) => ({ el, id: el.dataset.cam }));
const _tg = new THREE.Vector3(); function tgtOf(fw, c) { const b = c[4] || 0; return _tg.set(fw.x + (c[1][0] - fw.x) * b, 0.95 + (c[1][1] - 0.95) * b, fw.z + (c[1][2] - fw.z) * b); }
const CAMS = {
  hero: [[24, 31, 45], [-3.5, -2, 4]],
  truck: [[7.2, 3.2, 8.0], [8.2, 1.25, 17.5]],
  breakdown: [[2.6, 4.4, 2.6], [3.8, 0.8, 11.0]],
  roller: [[5.4, 2.7, 11.0], [8.8, 0.8, -5]],
  sort: [[13.4, 4.3, 5.4], [7.4, 0.4, 0.2]],
  floor: [[-14.2, 3.0, 8.4], [-21.5, 0.9, 3.8], 'Stocking 3 · skid to the sales floor', [4.2, 2.6, 3.2], 0, [[-16.0, 3.8, 10.8], [-20.2, -1.6, 2.6]]], // [5] = fixed phone view (doors + skid + jack above the caption card)
  stock: [[-31.4, 2.3, -2.6], [-38.0, 1.0, -5.8], 'Stocking 3 · overnight stocking', [4.4, 2.4, 2.4]],
  dsd: [[-19.8, 4.4, 1.6], [-15.4, 0.9, 8.6]],
  bev: [[-11.2, 3.0, 3.4], [-17.4, 0.9, 7.8]],
  milk: [[3.0, 3.0, -12.3], [-4.2, 0.3, -16.3]],
  snack: [[-22, 4.6, 42], [-15.8, 1.8, 27.3]],
  pharm: [[-14.6, 2.4, 8.6], [-18.2, 0.7, 5.2], '@pharm', [-2.6, 3.4, 2.6], 0, [[-24.0, 6.5, 2.0], [-31.0, -2.0, 12.5]]],
  baler: [[-12.4, 2.6, -1.4], [-19, 1.0, -4.0]],
  omni: [[17.6, 1.7, 5.6], [15.2, 0.9, 10.8]],
  fashion: [[11.9, 1.65, -5.6], [15.4, 1.2, -9.8]],
  claims: [[-12.0, 1.8, -5.6], [-17.2, 1.0, -10.8]],
  stockroom: [[22.8, 4.4, 1.6], [32.0, 1.4, -5.6]],
  picker: [[-3.0, 6.5, -2.4], [-6.0, 2.0, -5.9]],
  stacker: [[3.8, 3.4, 2.8], [-0.9, 1.4, -2.2]],
  ejack: [[-2.5, 3.6, 9.5], [-6.5, 0.6, 3.0]],
  salesmain: [[-27.5, 7.0, 12.5], [-44, 0.2, -2.5]],
  elevator: [[-12.5, 2.8, -7.5], [-9.6, 1.4, -11.6]],
  stairs: [[-24.5, 5.5, 17], [-21.2, 3.0, 8.6]],
  upstairs: [[-4, 27, 23], [-10, 7.6, 0]],
  floor2: [[-2, 33, 26], [-10, 13.0, 0]],
  overview: [[-30, 36, 48], [2, 2, 0]],
};
const LBL = { // fixed points of interest per step
  hero: [['Cooler', -3.6, 2.6, -11.8], ['Freezer', 3.0, 2.6, -11.8], ['Gravity roller', 8, 1.2, 2], ['Department skids', 5.6, 1.4, 0]],
  truck: [['Trailer · placard CP', 8, 2.9, 19.5], ['Roller head', 8, 1.15, 14.6]],
  breakdown: [['Wrapped mixed skid ≈ 1.9 m', -5.0, 2.2, 15.0], ['Breakdown spot', 4.6, 1.9, 9.6]],
  roller: [['Boxes roll by gravity', 8, 1.2, 6]],
  sort: [['Dept 46 · Cosmetics', 5.6, 1.6, 7.5], ['Dept 92 · Dry Grocery', 10.4, 1.6, 7.5], ['Dept 2 · Health & Beauty', 5.6, 1.6, 5]],
  floor: [['Through the doors to the sales floor', -23, 2.6, 4.3]],
  stock: [['Empty slots get filled', -39, 2.2, -7.4]],
  dsd: [['Beverage vendor truck', -16.5, 3.0, 15], ['Receiving desk', -19.3, 1.4, 7.6]],
  snack: [['Snack vendor truck', -11.5, 4.6, 24]],
  pharm: [['McKesson totes · wrapped pallet', -17.6, 1.6, 5.6]],
  baler: [['Baler', -19.4, 3.4, -3.2], ['Compactor', -19.6, 2.6, 1.2], ['Cardboard', -16.9, 1.4, -1.4]],
  omni: [['OGP staging shelves', 15.5, 2.0, 11.4], ['Chill / frozen', 13, 2.0, 6.4]],
  fashion: [['Yellow Z-racks', 15.5, 2.0, -9.7], ['Green racking · cartons above, garments below', 11.4, 3.9, -11.3]],
  stockroom: [['Backroom stocking area', 27.0, 4.8, -5.25], ['Wrapped pallets on top', 31.0, 4.5, -7.0], ['Keep-clear zone', 21.9, 0.8, 0]],
  picker: [['Stock picker', -5.6, 4.7, -5.85]],
  stacker: [['Walkie stacker', -0.6, 3.0, -1.4], ['Top rack level', -0.6, 3.9, -4.4]],
  ejack: [['Electric pallet jack', -6.5, 2.0, 3.0]],
  salesmain: [['Gondola aisles', -46, 2.4, -7.4], ['Produce', -53.3, 1.6, 6.2], ['Meat case', -44.5, 2.2, 13.2], ['Electronics', -31, 2.8, -12.4], ['Checkouts', -41.4, 1.6, 3.6], ['Pharmacy', -31.2, 3.7, 13.0]],
  elevator: [['Freight elevator', -9.8, 3.0, -11.0], ['Empty pallets', -7.3, 1.6, -10.5]],
  upstairs: [['1st floor (above the backroom)', -10, 9.2, -11.6]],
  floor2: [['2nd floor · coming soon', -10, 17.6, -11.6], ['1st floor', -10, 9.4, 11.6]],
  claims: [['Claims cage', -17.2, 2.6, -10.2]],
  overview: [],
};
const ROLE_STEPS = { picker: ['Stock picker operator'], stacker: ['Walkie stacker operator'], ejack: ['Electric pallet jack operator'], bev: ['DSD associate · receiving', 'Beverage vendor'], milk: ['Stocking 2 · milk & eggs to cooler'], hero: ['Stocking 2 · sorting by dept'], truck: ['Stocking 2 · unloading'], breakdown: ['Stocking 2 · pulling skids', 'Stocking 2 · breaking down'], roller: [], sort: ['Stocking 2 · sorting by dept'],
  floor: ['Stocking 3 · skid to the sales floor'], stock: ['Stocking 3 · overnight stocking', 'Stocking 3 · skid to the sales floor'], dsd: ['Beverage vendor', 'DSD associate · receiving'], snack: ['Snack vendor'],
  pharm: ['DSD associate · receiving', 'Pharmacy pallet · jack to pharmacy'], baler: ['Baler & compactor pre-op'], omni: ['OMNI customer fulfillment'], fashion: ['Fashion · hanging apparel'], claims: ['Claims & returns'], overview: [] };
const labelsEl = document.getElementById('labels');
const LPOOL = []; for (let i = 0; i < 8; i++) { const d = document.createElement('div'); d.className = 'lbl'; labelsEl.appendChild(d); LPOOL.push(d); }
let cur = 0, camFrom = null, camT = 1, explore = false;
const camPos = new THREE.Vector3().fromArray(CAMS.hero[0]), camTgt = new THREE.Vector3().fromArray(CAMS.hero[1]);
const controls = new OrbitControls(camera, canvas); controls.enabled = false; controls.enableDamping = true; controls.maxPolarAngle = Math.PI * 0.495; controls.minDistance = 1.5; controls.maxDistance = 90;
function camFor(c) { if (c[5] && innerWidth / innerHeight < 0.8) return [new THREE.Vector3().fromArray(c[5][0]), new THREE.Vector3().fromArray(c[5][1])]; const p = new THREE.Vector3().fromArray(c[0]), t = new THREE.Vector3().fromArray(c[1]); if (innerWidth / innerHeight < 0.8) { const d = p.clone().sub(t), m = p.y > 6 ? 1.5 : (c[0][2] < -12 && Math.abs(c[0][0]) < 20 ? 1.0 : 1.12); const inBR = Math.abs(c[0][0]) < 20 && Math.abs(c[0][2]) < 12 && c[0][1] < 7.2; p.copy(t).addScaledVector(d, m); t.y -= d.length() * m * 0.16; if (inBR) { p.x = Math.max(-19.4, Math.min(19.4, p.x)); p.z = Math.max(-11.4, Math.min(11.4, p.z)); } } return [p, t]; }
function floorsFor(id) { const f1 = ['stairs', 'upstairs', 'floor2', 'overview'].includes(id), f2 = ['floor2', 'overview'].includes(id); F1G.visible = f1; F2G.visible = f2;
  const ex = id === 'overview' || id === 'floor2'; F1G.position.y = id === 'overview' ? 3.0 : 0; F2G.position.y = ex ? (id === 'overview' ? 7.5 : 4.5) : 0; }
function goStep(i, instant) { i = clamp(i, 0, STEPS.length - 1); if (i === cur && !instant && camT >= 1) return; cur = i; floorsFor(STEPS[i].id); STEPS.forEach((s, k) => s.el.classList.toggle('on', k === i)); document.querySelectorAll('.dots button').forEach((d, k) => d.classList.toggle('on', k === i));
  camFrom = [camera.position.clone(), camTgt.clone()]; camT = instant ? 1 : 0; const c = CAMS[STEPS[i].id] || CAMS.hero; const cf = camFor(c); camPos.copy(cf[0]); { const fw = followRole(c); if (fw) { camPos.set(fw.x + c[3][0], c[3][1], fw.z + c[3][2]); } } if (instant) { camera.position.copy(camPos); camTgt.copy(cf[1]); const fw = followRole(c); if (fw) camTgt.copy(tgtOf(fw, c)); } { const fw = followRole(c); camFrom.push(fw ? tgtOf(fw, c).clone() : cf[1].clone()); } if (explore) setExplore(false); }
window.__goStep = goStep;
function stepFromScroll() { const mid = innerHeight * 0.5; let best = 0, bd = 1e9; STEPS.forEach((s, k) => { const r = s.el.getBoundingClientRect(); const d = Math.abs((r.top + r.bottom) / 2 - mid); if (d < bd) { bd = d; best = k; } }); return best; }
addEventListener('scroll', () => { const k = stepFromScroll(); if (k !== cur) goStep(k); }, { passive: true });
function scrollToStep(i) { i = clamp(i, 0, STEPS.length - 1); STEPS[i].el.scrollIntoView({ behavior: 'smooth', block: 'center' }); goStep(i); }
document.getElementById('next').onclick = () => scrollToStep(cur + 1); document.getElementById('prev').onclick = () => scrollToStep(cur - 1);
{ const dots = document.querySelector('.dots'); STEPS.forEach((s, k) => { const b = document.createElement('button'); b.dataset.step = k; b.setAttribute('aria-label', 'Go to step ' + (k + 1)); b.onclick = () => scrollToStep(k); dots.appendChild(b); }); }
addEventListener('keydown', (e) => { if (e.key === 'ArrowRight' || e.key === 'PageDown') { scrollToStep(cur + 1); e.preventDefault(); } if (e.key === 'ArrowLeft' || e.key === 'PageUp') { scrollToStep(cur - 1); e.preventDefault(); } });
function setExplore(on) { explore = on; document.body.classList.toggle('explore', on); controls.enabled = on; document.getElementById('explore').textContent = on ? 'Back to story' : 'Explore 3D'; if (on) { controls.target.copy(camTgt); controls.update(); } }
document.getElementById('explore').onclick = () => setExplore(!explore);
for (const b of document.querySelectorAll('[data-zoom]')) b.onclick = () => { const f = b.dataset.zoom === 'in' ? 0.8 : 1.25; if (!explore) setExplore(true); const d = camera.position.clone().sub(controls.target).multiplyScalar(f); if (d.length() > 1.5 && d.length() < 90) camera.position.copy(controls.target).add(d); controls.update(); };
// view offset: keep the subject clear of the caption card
// resize: assigning canvas.width (even to the same value) reallocates the WebGL drawing buffer, which blocks the main thread until the
// GPU drains its queue (0.5-1.4 s on software GL). Spurious resize events (screenshots, mobile URL bar) were the nav long task.
// So: coalesce to one per frame and skip entirely when the backing size is unchanged.
let __rsKey = '', __rsPending = false; function resize() { if (__rsPending) return; __rsPending = true; requestAnimationFrame(__doResize); }
function __doResize() { __rsPending = false; const w = innerWidth, h = innerHeight, key = w + 'x' + h + '@' + renderer.getPixelRatio(); if (key === __rsKey) return; __rsKey = key; renderer.setSize(w, h, false); camera.aspect = w / h; camera.clearViewOffset(); camera.updateProjectionMatrix(); }
let cutaway = null;
function camLook() { // fov: narrow (iso-like) when high, wide at eye level; cutaway hides walls above 3.4 m + roof
  const y = camera.position.y, k = clamp((y - 3) / 12, 0, 1), base = innerWidth / innerHeight < 0.8 ? 14 : 0;
  const fov = 50 + base - k * 18; if (Math.abs(camera.fov - fov) > 0.05) { camera.fov = fov; camera.updateProjectionMatrix(); }
  const cut = y > 4.6; if (cut !== cutaway) { cutaway = cut; UPPER.visible = !cut; LIGHTS_MESH.visible = !cut; } }
addEventListener('resize', resize);
const _lv = new THREE.Vector3();
const _cabV = new THREE.Vector3();
function followRole(c) { if (!c[2] || (c[5] && innerWidth / innerHeight < 0.8)) return null; if (c[2] === '@pharm') return PHSK; if (c[2] === '@bev') return BEVCUR; if (c[2] === '@milk') return MILKCUR; if (c[2] === '@snackcab') { const sp = SNACK.tractor.userData.seatPoint; if (sp && sp.object) return sp.object.getWorldPosition(_cabV); return SNACK.tractor.localToWorld(_cabV.set(0.55, 1.95, 2.2)); } const r = ROLES.find((r) => r.text === c[2]); return r ? r.w : null; }
function updLabels() { const id = STEPS[cur].id; const items = (LBL[id] || []).map((l) => ({ t: l[0], x: l[1], y: l[2], z: l[3], k: 'poi' }));
  if (!explore) for (const r of ROLES) if (r.text && (ROLE_STEPS[id] || []).includes(r.text)) { const js = r.w.jack && r.w.jack.skid; items.push({ t: r.text, x: js ? js.x : r.w.x, y: 2.05 + (r.w.y || 0), z: js ? js.z : r.w.z, k: 'who' }); }
  const W_ = innerWidth, H_ = innerHeight; let n = 0; const cel = STEPS[cur].el.querySelector('.card'); let cardR = cel && cel.getBoundingClientRect(); if (cardR && (cardR.bottom < 0 || cardR.top > H_)) cardR = null;
  const placed = []; for (const it of items) { if (n >= LPOOL.length) break; _lv.set(it.x, it.y, it.z).project(camera); if (_lv.z > 1 || Math.abs(_lv.x) > 1.05 || Math.abs(_lv.y) > 1.05) continue; const sx = (_lv.x + 1) / 2 * W_, sy = (1 - _lv.y) / 2 * H_; if (cardR && sx > cardR.left - 80 && sx < cardR.right + 80 && sy > cardR.top - 10 && sy < cardR.bottom + 40) continue; const lw = it.t.length * 7.4 + 18, lh = 24; let px = Math.min(W_ - lw / 2 - 8, Math.max(lw / 2 + 8, sx)), py = Math.min(H_ - 40, Math.max(lh + 50, sy)); for (let g = 0; g < 6; g++) { const hit = placed.find((q) => Math.abs(q[0] - px) < (q[2] + lw) / 2 + 4 && Math.abs(q[1] - py) < lh + 2); if (!hit) break; py = hit[1] - lh - 4; if (py < lh + 50) { py = hit[1] + lh + 4; } } placed.push([px, py, lw]); const d = LPOOL[n++]; d.textContent = it.t; d.className = 'lbl ' + it.k; d.style.transform = `translate(${px.toFixed(0)}px,${py.toFixed(0)}px) translate(-50%,-100%)`; d.style.display = 'block'; }
  for (; n < LPOOL.length; n++) LPOOL[n].style.display = 'none'; }
// ---------- loop: real elapsed time, clamped dt ----------
let last = performance.now(), fadeT = -1, frames = 0;
// dynamic resolution: if the GPU (or a software rasteriser) needs >90 ms per frame, step the pixel ratio down so one heavy view cannot block the page for a second
// (no dynamic resolution: changing the pixel ratio reallocates the drawing buffer = the same main-thread GPU stall)
const fadeEl = document.getElementById('fade');
function advance(dt) { DT = Math.min(0.1, dt); simStep(); if (T > NIGHT && fadeT < 0) { fadeT = 0; fadeEl.classList.add('on'); } }
window.__step = (sec) => { let s = sec; while (s > 0) { advance(Math.min(0.1, s)); s -= 0.1; } };
const __FS = window.__frameSpikes = []; let __fsInfo = [0, 0, 0];
function frame(now) { requestAnimationFrame(frame); const _f0 = performance.now(); const dt = (now - last) / 1000; last = now; advance(Math.max(0, dt)); const _f1 = performance.now();
  if (fadeT >= 0) { fadeT += Math.min(0.1, dt); if (fadeT > 1.2 && !fadeT._done) { initSim(); initMachines(); resetVehicles(); fadeT = 2.0; fadeEl.classList.remove('on'); fadeT = -1; } }
  if (!explore) { { const c = CAMS[STEPS[cur].id]; const fw = followRole(c); if (fw) { const k = 1 - Math.exp(-Math.min(0.1, dt) * (camT < 1 ? 20 : 2.5)); camPos.lerp(_lv.set(fw.x + c[3][0], c[3][1], fw.z + c[3][2]), k); if (camT < 1) camFrom[2].copy(tgtOf(fw, c)); else camTgt.lerp(tgtOf(fw, c), k); } }
    if (camT < 1) { camT = Math.min(1, camT + Math.min(0.1, dt) / 1.6); const k = ease(camT); camera.position.lerpVectors(camFrom[0], camPos, k); camTgt.lerpVectors(camFrom[1], camFrom[2], k); } else { const sway = Math.sin(now / 4000) * 0.12; camera.position.set(camPos.x + sway, camPos.y, camPos.z); } camera.lookAt(camTgt); } else controls.update();
  if (window.__camOverride) { const v = window.__camOverride; camera.position.fromArray(v[0]); camera.up.set(0, v[4] ? 1 : 0, v[4] ? 0 : -1); camera.lookAt(v[1][0], v[1][1], v[1][2]); camera.fov = v[2]; camera.updateProjectionMatrix(); }
  camLook(); const _f2 = performance.now(); render3d(); const r0 = performance.now(); renderer.render(scene, camera); const r1 = performance.now();  updLabels(); frames++; const _f3 = performance.now();
  { const I = renderer.info, inf = [I.memory.geometries, I.memory.textures, I.programs ? I.programs.length : 0]; if (_f3 - _f0 > 200 && __FS.length < 40) __FS.push({ at: Math.round(_f0), step: STEPS[cur].id, camT: +camT.toFixed(2), sim: +T.toFixed(1), adv: Math.round(_f1 - _f0), pre: Math.round(r0 - _f1), render: Math.round(r1 - r0), lbl: Math.round(_f3 - r1), geoNew: inf[0] - __fsInfo[0], texNew: inf[1] - __fsInfo[1], progNew: inf[2] - __fsInfo[2], calls: I.render.calls }); __fsInfo = inf; }
  if (frames === 2) { window.__ready = true; const l = document.getElementById('gfLoad'); if (l) l.remove(); } }
initSim(); initMachines(); __doResize(); goStep(0, true); camera.lookAt(camTgt);
await __yield(); await __compile(1500); await __yield();
setTimeout(() => { const l = document.getElementById('gfLoad'); if (l) l.remove(); }, 2800);
requestAnimationFrame(frame);
// ---------- news strip: baked headlines, optional live refresh (silent fallback) ----------
(function news() { const el = document.getElementById('newsList'), meta = document.getElementById('newsMeta'); let data = null; try { data = JSON.parse(document.getElementById('newsData').textContent); } catch (e) {}
  const show = (d, live) => { if (!d || !d.items || !d.items.length) { el.innerHTML = '<li class="ph">Live data coming soon</li>'; meta.textContent = 'Source: Google News · Walmart Canada'; return; } const ln = document.getElementById('newsLine'); if (ln) ln.textContent = d.items[0].title + ' — Google News, ' + d.date; el.innerHTML = ''; for (const it of d.items.slice(0, 5)) { const li = document.createElement('li'); const a = document.createElement('a'); a.href = it.link; a.target = '_blank'; a.rel = 'noopener'; a.textContent = it.title; li.appendChild(a); el.appendChild(li); } meta.textContent = `Source: Google News (search “Walmart Canada”) · ${live ? 'live, ' : 'fetched '}${d.date}`; };
  show(data, false);
  if (location.protocol === 'https:') try { const ctl = new AbortController(); setTimeout(() => ctl.abort(), 5000); fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent('https://news.google.com/rss/search?q=Walmart+Canada&hl=en-CA&gl=CA&ceid=CA:en'), { signal: ctl.signal }).then((r) => r.ok ? r.text() : Promise.reject()).then((x) => { const doc = new DOMParser().parseFromString(x, 'text/xml'); const items = [...doc.querySelectorAll('item')].slice(0, 5).map((i) => ({ title: i.querySelector('title')?.textContent || '', link: i.querySelector('link')?.textContent || '' })).filter((i) => i.title && /^https:\/\//.test(i.link)); if (items.length) show({ items, date: new Date().toISOString().slice(0, 10) }, true); }).catch(() => {}); } catch (e) {}
})();
// QA probe: run the sim headless for `sec` seconds and report the minimum pairwise distance between walking/standing associates
window.__sim.minPair = function (sec = 60, from = 0) { const save = DT; DT = 1 / 30; let best = 1e9, who = null, at = 0; const nm = (w) => { const r = ROLES.find((r) => r.w === w); return r ? r.text : 'w' + W.indexOf(w); };
  for (let i = 0; i < sec * 30; i++) { simStep(); if (T < from) continue; const L = W.filter((w) => !w.sit && !w.hide);
    for (let a = 0; a < L.length; a++) for (let b = a + 1; b < L.length; b++) { const p = L[a], q = L[b]; if (Math.abs((p.y || 0) - (q.y || 0)) > 1.5) continue; const d = Math.hypot(p.x - q.x, p.z - q.z); if (d < best) { best = d; who = [nm(p), nm(q)]; at = T; } } }
  DT = save; return { min: +best.toFixed(3), who, at: +at.toFixed(1), n: W.length }; };
window.__sim.footprint = function () { const r={};const save=DT;DT=1/30;const M=window.__mach;const ops=[M.pkOp,M.wsOp,M.ejOp];for(let i=0;i<150*30;i++){simStep();for(const w of W){if(w.sit||w.hide||ops.includes(w))continue;const nm=(ROLES.find(q=>q.w===w)||{}).text||('w'+W.indexOf(w));
if(Math.abs(w.x+0.6)<1.4&&Math.abs(w.z+4.4)<0.65){r['rack:'+nm]=r['rack:'+nm]||T.toFixed(1)}
for(const [k,g] of [['pk',M.PK],['ws',M.WS],['ej',M.EJ]]){if(Math.hypot(w.x-g.position.x,w.z-g.position.z)<0.9){r[k+':'+nm]=r[k+':'+nm]||T.toFixed(1)}}}}DT=save;return r };
window.__sim.track = function (sec, names, from = 0) { const save = DT; DT = 1 / 30; const out = []; for (let i = 0; i < sec * 30; i++) { simStep(); if (T < from || i % 15) continue; const row = [+T.toFixed(1)]; for (const n of names) { const r = ROLES.find((q) => q.text === n); row.push(r ? [+r.w.x.toFixed(2), +r.w.z.toFixed(2)] : null); } out.push(row); } DT = save; return out; };
