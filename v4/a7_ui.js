// ======================= STORY / CAMERA / LABELS / LOOP =======================
// seat & grip points from Inky's parts when available
const STEPS = [...document.querySelectorAll('.step')].map((el) => ({ el, id: el.dataset.cam }));
const CAMS = {
  hero: [[24, 31, 45], [-3.5, -2, 4]],
  truck: [[7.2, 3.2, 8.0], [8.2, 1.25, 17.5]],
  breakdown: [[-0.8, 3.3, 6.6], [4.0, 0.7, 10.4]],
  roller: [[5.4, 2.7, 11.0], [8.8, 0.8, -5]],
  sort: [[13.4, 4.3, 5.4], [7.4, 0.4, 0.2]],
  floor: [[20.5, 2.4, -1.2], [30, 0.8, -5.2], 'Stocking 3 · Dept 46 skid (1 person)', [3.2, 1.7, 1.6]],
  stock: [[25.4, 1.65, 6.6], [31.5, 1.0, 5.0], 'Stocking 3 · Dept 46 skid (1 person)', [-3.0, 4.9, 2.8]],
  dsd: [[-10.4, 1.75, 3.6], [-16.2, 0.9, 9.6]],
  bev: [[-13.0, 3.2, 10.4], [-16.3, 0.8, 7.0], '@bev', [2.6, 2.9, 2.4]],
  milk: [[3.0, 3.0, -12.3], [-4.2, 0.3, -16.3]],
  snack: [[3, 8.5, 37], [-11.5, 0, 22], '@snackcab', [-4.6, 1.6, 1.6]],
  pharm: [[-14.6, 2.4, 8.6], [-18.2, 0.7, 5.2], '@pharm', [-2.6, 3.4, 2.6]],
  baler: [[-12.4, 2.6, -1.4], [-19, 1.0, -4.0]],
  omni: [[17.6, 1.7, 5.6], [15.2, 0.9, 10.8]],
  fashion: [[11.9, 1.65, -5.6], [15.4, 1.2, -9.8]],
  claims: [[-12.0, 1.8, -5.6], [-17.2, 1.0, -10.8]],
  stairs: [[-13.5, 6.5, 16.5], [-21.2, 2.4, 8.6]],
  upstairs: [[-29, 23, 23], [-34.5, 4.2, 0]],
  overview: [[-26, 30, 40], [6, -1, 2]],
};
const LBL = { // fixed points of interest per step
  hero: [['Cooler', -3.6, 2.6, -11.8], ['Freezer', 3.0, 2.6, -11.8], ['Gravity roller', 8, 1.2, 2], ['Department skids', 5.6, 1.4, 0]],
  truck: [['Walmart trailer · placard CP', 8, 2.9, 19.5], ['Roller head', 8, 1.15, 14.6]],
  breakdown: [['Wrapped mixed skid ≈ 1.9 m', -5.0, 2.2, 15.0], ['Breakdown spot', 4.6, 1.9, 9.6]],
  roller: [['Boxes roll by gravity', 8, 1.2, 6]],
  sort: [['Dept 46 · Cosmetics', 5.6, 1.6, 7.5], ['Dept 92 · Dry Grocery', 10.4, 1.6, 7.5], ['Dept 2 · Health & Beauty', 5.6, 1.6, 5]],
  floor: [['To the sales floor', 24, 1.9, 0]],
  stock: [['Empty slots get filled', 30, 1.8, 3.6]],
  dsd: [['Beverage Vendor truck', -16.5, 3.0, 15], ['Receiving desk', -19.3, 1.4, 7.6]],
  snack: [['Snack Vendor reversing to door', -11.5, 4.6, 24]],
  pharm: [['McKesson totes · wrapped pallet', -17.6, 1.6, 5.6]],
  baler: [['Baler', -19.4, 3.4, -3.2], ['Compactor', -19.6, 2.6, 1.2], ['Cardboard', -16.9, 1.4, -1.4]],
  omni: [['OGP staging shelves', 15.5, 2.0, 11.4], ['Chill / frozen', 13, 2.0, 6.4]],
  fashion: [['Z-racks', 15.5, 2.0, -9.7]],
  claims: [['Claims cage', -17.2, 2.6, -10.2]],
  overview: [],
};
const ROLE_STEPS = { bev: ['DSD associate · receiving', 'Beverage vendor'], milk: ['Stocking 2 · milk & eggs to cooler'], hero: ['Stocking 2 · sorting by dept'], truck: ['Stocking 2 · unloading'], breakdown: ['Stocking 2 · pulling skids', 'Stocking 2 · breaking down'], roller: [], sort: ['Stocking 2 · sorting by dept'],
  floor: ['Stocking 3 · Dept 46 skid (1 person)', 'Stocking 3 · Dept 92 (big skid, 2 people)'], stock: ['Stocking 3 · Dept 46 skid (1 person)', 'Stocking 3 · overnight stocking'], dsd: ['Beverage vendor', 'DSD associate · receiving'], snack: ['Snack vendor'],
  pharm: ['DSD associate · receiving', 'Pharmacy pallet · jack to pharmacy'], baler: ['Baler & compactor pre-op'], omni: ['OMNI customer fulfillment'], fashion: ['Fashion · hanging apparel'], claims: ['Claims & returns'], overview: [] };
const labelsEl = document.getElementById('labels');
const LPOOL = []; for (let i = 0; i < 8; i++) { const d = document.createElement('div'); d.className = 'lbl'; labelsEl.appendChild(d); LPOOL.push(d); }
let cur = 0, camFrom = null, camT = 1, explore = false;
const camPos = new THREE.Vector3().fromArray(CAMS.hero[0]), camTgt = new THREE.Vector3().fromArray(CAMS.hero[1]);
const controls = new OrbitControls(camera, canvas); controls.enabled = false; controls.enableDamping = true; controls.maxPolarAngle = Math.PI * 0.495; controls.minDistance = 1.5; controls.maxDistance = 90;
function camFor(c) { const p = new THREE.Vector3().fromArray(c[0]), t = new THREE.Vector3().fromArray(c[1]); if (innerWidth / innerHeight < 0.8) { const d = p.clone().sub(t), m = p.y > 6 ? 1.5 : 1.12; p.copy(t).addScaledVector(d, m); t.y -= d.length() * m * 0.16; } return [p, t]; }
function goStep(i, instant) { i = clamp(i, 0, STEPS.length - 1); if (i === cur && !instant && camT >= 1) return; cur = i; STEPS.forEach((s, k) => s.el.classList.toggle('on', k === i)); document.querySelectorAll('.dots button').forEach((d, k) => d.classList.toggle('on', k === i));
  camFrom = [camera.position.clone(), camTgt.clone()]; camT = instant ? 1 : 0; const c = CAMS[STEPS[i].id] || CAMS.hero; const cf = camFor(c); camPos.copy(cf[0]); { const fw = followRole(c); if (fw) { camPos.set(fw.x + c[3][0], c[3][1], fw.z + c[3][2]); } } if (instant) { camera.position.copy(camPos); camTgt.copy(cf[1]); const fw = followRole(c); if (fw) camTgt.set(fw.x, 0.95, fw.z); } { const fw = followRole(c); camFrom.push(fw ? new THREE.Vector3(fw.x, 0.95, fw.z) : cf[1].clone()); } if (explore) setExplore(false); }
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
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.clearViewOffset(); camera.updateProjectionMatrix(); }
let cutaway = null;
function camLook() { // fov: narrow (iso-like) when high, wide at eye level; cutaway hides walls above 3.4 m + roof
  const y = camera.position.y, k = clamp((y - 3) / 12, 0, 1), base = innerWidth / innerHeight < 0.8 ? 14 : 0;
  const fov = 50 + base - k * 18; if (Math.abs(camera.fov - fov) > 0.05) { camera.fov = fov; camera.updateProjectionMatrix(); }
  const cut = y > 4.6; if (cut !== cutaway) { cutaway = cut; UPPER.visible = !cut; LIGHTS_MESH.visible = !cut; } }
addEventListener('resize', resize);
const _lv = new THREE.Vector3();
const _cabV = new THREE.Vector3();
function followRole(c) { if (!c[2]) return null; if (c[2] === '@pharm') return PHSK; if (c[2] === '@bev') return BEVCUR; if (c[2] === '@milk') return MILKCUR; if (c[2] === '@snackcab') { const sp = SNACK.tractor.userData.seatPoint; if (sp && sp.object) return sp.object.getWorldPosition(_cabV); return SNACK.tractor.localToWorld(_cabV.set(0.55, 1.95, 2.2)); } const r = ROLES.find((r) => r.text === c[2]); return r ? r.w : null; }
function updLabels() { const id = STEPS[cur].id; const items = (LBL[id] || []).map((l) => ({ t: l[0], x: l[1], y: l[2], z: l[3], k: 'poi' }));
  if (!explore) for (const r of ROLES) if (r.text && (ROLE_STEPS[id] || []).includes(r.text)) { const js = r.w.jack && r.w.jack.skid; items.push({ t: r.text, x: js ? js.x : r.w.x, y: 2.05, z: js ? js.z : r.w.z, k: 'who' }); }
  const W_ = innerWidth, H_ = innerHeight; let n = 0; const cel = STEPS[cur].el.querySelector('.card'); let cardR = cel && cel.getBoundingClientRect(); if (cardR && (cardR.bottom < 0 || cardR.top > H_)) cardR = null;
  for (const it of items) { if (n >= LPOOL.length) break; _lv.set(it.x, it.y, it.z).project(camera); if (_lv.z > 1 || Math.abs(_lv.x) > 1.05 || Math.abs(_lv.y) > 1.05) continue; const sx = (_lv.x + 1) / 2 * W_, sy = (1 - _lv.y) / 2 * H_; if (cardR && sx > cardR.left - 80 && sx < cardR.right + 80 && sy > cardR.top - 10 && sy < cardR.bottom + 40) continue; const d = LPOOL[n++]; d.textContent = it.t; d.className = 'lbl ' + it.k; d.style.transform = `translate(${((_lv.x + 1) / 2 * W_).toFixed(0)}px,${((1 - _lv.y) / 2 * H_).toFixed(0)}px) translate(-50%,-100%)`; d.style.display = 'block'; }
  for (; n < LPOOL.length; n++) LPOOL[n].style.display = 'none'; }
// ---------- loop: real elapsed time, clamped dt ----------
let last = performance.now(), fadeT = -1, frames = 0;
const fadeEl = document.getElementById('fade');
function advance(dt) { DT = Math.min(0.1, dt); simStep(); if (T > NIGHT && fadeT < 0) { fadeT = 0; fadeEl.classList.add('on'); } }
window.__step = (sec) => { let s = sec; while (s > 0) { advance(Math.min(0.1, s)); s -= 0.1; } };
function frame(now) { requestAnimationFrame(frame); const dt = (now - last) / 1000; last = now; advance(Math.max(0, dt));
  if (fadeT >= 0) { fadeT += Math.min(0.1, dt); if (fadeT > 1.2 && !fadeT._done) { initSim(); resetVehicles(); fadeT = 2.0; fadeEl.classList.remove('on'); fadeT = -1; } }
  if (!explore) { { const c = CAMS[STEPS[cur].id]; const fw = followRole(c); if (fw) { const k = 1 - Math.exp(-Math.min(0.1, dt) * (camT < 1 ? 20 : 2.5)); camPos.lerp(_lv.set(fw.x + c[3][0], c[3][1], fw.z + c[3][2]), k); if (camT < 1) camFrom[2].set(fw.x, 0.95, fw.z); else camTgt.lerp(_lv.set(fw.x, 0.95, fw.z), k); } }
    if (camT < 1) { camT = Math.min(1, camT + Math.min(0.1, dt) / 1.6); const k = ease(camT); camera.position.lerpVectors(camFrom[0], camPos, k); camTgt.lerpVectors(camFrom[1], camFrom[2], k); } else { const sway = Math.sin(now / 4000) * 0.12; camera.position.set(camPos.x + sway, camPos.y, camPos.z); } camera.lookAt(camTgt); } else controls.update();
  camLook(); render3d(); renderer.render(scene, camera); updLabels(); frames++;
  if (frames === 2) { window.__ready = true; const l = document.getElementById('gfLoad'); if (l) l.remove(); } }
initSim(); resize(); goStep(0, true); camera.lookAt(camTgt);
await __yield(); await __compile(1500); await __yield();
setTimeout(() => { const l = document.getElementById('gfLoad'); if (l) l.remove(); }, 2800);
requestAnimationFrame(frame);
// ---------- news strip: baked headlines, optional live refresh (silent fallback) ----------
(function news() { const el = document.getElementById('newsList'), meta = document.getElementById('newsMeta'); let data = null; try { data = JSON.parse(document.getElementById('newsData').textContent); } catch (e) {}
  const show = (d, live) => { if (!d || !d.items || !d.items.length) { el.innerHTML = '<li class="ph">Live data coming soon</li>'; meta.textContent = 'Source: Google News · Walmart Canada'; return; } const ln = document.getElementById('newsLine'); if (ln) ln.textContent = d.items[0].title + ' — Google News, ' + d.date; el.innerHTML = ''; for (const it of d.items.slice(0, 5)) { const li = document.createElement('li'); const a = document.createElement('a'); a.href = it.link; a.target = '_blank'; a.rel = 'noopener'; a.textContent = it.title; li.appendChild(a); el.appendChild(li); } meta.textContent = `Source: Google News (search “Walmart Canada”) · ${live ? 'live, ' : 'fetched '}${d.date}`; };
  show(data, false);
  if (location.protocol === 'https:') try { const ctl = new AbortController(); setTimeout(() => ctl.abort(), 5000); fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent('https://news.google.com/rss/search?q=Walmart+Canada&hl=en-CA&gl=CA&ceid=CA:en'), { signal: ctl.signal }).then((r) => r.ok ? r.text() : Promise.reject()).then((x) => { const doc = new DOMParser().parseFromString(x, 'text/xml'); const items = [...doc.querySelectorAll('item')].slice(0, 5).map((i) => ({ title: i.querySelector('title')?.textContent || '', link: i.querySelector('link')?.textContent || '' })).filter((i) => i.title && /^https:\/\//.test(i.link)); if (items.length) show({ items, date: new Date().toISOString().slice(0, 10) }, true); }).catch(() => {}); } catch (e) {}
})();
