// ====================================================================== POST

let composer = null, outline = null, FX = null;
function setupPost() {
  if (LOW || QS.has('nopost')) return;
  if (USE_FX) { try { FX = PFX.create(renderer, scene, camera, { quality: Q, outlineObjects: VEH.map((v) => v.obj).filter(Boolean) }); console.info('[gf] postfx', Q); return; } catch (e) { console.warn('[gf] postfx.js skipped:', e && e.message); FX = null; } }
  const { EffectComposer, RenderPass, GTAOPass, OutlinePass, SMAAPass, OutputPass } = window.POST || {};
  if (!EffectComposer) return;
  const w = innerWidth, h = innerHeight, pr = renderer.getPixelRatio();
  const rt = new THREE.WebGLRenderTarget(w * pr, h * pr, { type: THREE.HalfFloatType, samples: 4 });
  composer = new EffectComposer(renderer, rt); composer.addPass(new RenderPass(scene, camera));
  if (GTAOPass && !QS.has('noao')) { const g = new GTAOPass(scene, camera, w, h); g.output = GTAOPass.OUTPUT.Default; g.blendIntensity = 0.75; g.updateGtaoMaterial({ radius: 1.6, distanceExponent: 1.4, thickness: 1.2, scale: 1.0, samples: 12 }); composer.addPass(g); }
  outline = new OutlinePass(new THREE.Vector2(w, h), scene, camera); outline.edgeStrength = 4; outline.edgeThickness = 1.2; outline.visibleEdgeColor.set(0x0071ce); outline.hiddenEdgeColor.set(0x0071ce); composer.addPass(outline);
  composer.addPass(new OutputPass());
  composer.addPass(new SMAAPass(w * pr, h * pr));
}
// ====================================================================== LOOP (fixed timestep 60 Hz, interpolated render)
const STEP = 1 / 60; let acc = 0, speed = 1, last = performance.now();
// ---------- UI driven by sim state (KPIs from sim counts, vehicle status, captions, camera tour)
let __uiT = -1;
const DOOR_IDS = Object.keys(doorPanels);
function uiTick() {
  if (!UIX || SIMT - __uiT < 2) return; __uiT = SIMT;
  const hrs = Math.max(SIMT, 60) / 3600, moved = COUNTS.received + COUNTS.putaway + COUNTS.shipped;
  const open = DOOR_IDS.filter((d) => doorPanels[d].userData.target > 0.5).length;
  const occ = SLOTS.filter((x) => x.state === 'occupied').length;
  const acc = ASSERT.ok + ASSERT.fail ? 100 * ASSERT.ok / (ASSERT.ok + ASSERT.fail) : 100;
  try {
    UIX.updateKPI('unitsPerHour', Math.round(moved * 48 / hrs), null, { push: false });
    UIX.updateKPI('doorUtil', 100 * open / Math.max(1, DOOR_IDS.length), null, { push: false });
    UIX.updateKPI('invAccuracy', acc, null, { push: false });
    UIX.updateKPI('onTimeDispatch', COUNTS.trucksOut ? 100 : 100, null, { push: false });
  } catch (e) { console.warn(e); }
  window.__kpi = { moved, open, doors: DOOR_IDS.length, rackOcc: occ, rackSlots: SLOTS.length, assert: { ...ASSERT } };
}
const CAP = null; let __capT = 0;
function caption(txt, dur = 5000) { const U = window.UI; if (U && U.setCaption) U.setCaption(txt, { duration: dur }); }
const TOUR = QS.has('tour') ? [
  { t: 0, p: [-20, 95, 150], q: [-14, 0, 22], c: 'Demo RDC-7041 · regional DC digital twin (concept)' },
  { t: 10, p: [60, 30, 120], q: [48, 0, 70], c: 'Gate & yard: inbound trailer checks in, then backs onto DR-003' },
  { t: 24, p: [10, 14, 52], q: [0, 1, 34], c: 'Receiving: FK-07 unloads TRL-48213 into stage lane STG-DR005-1' },
  { t: 40, p: [-24, 16, 18], q: [-30, 4, -4], c: 'Reserve storage: pallets seat on exact AA-BBB-L-P rack slots' },
  { t: 56, p: [-20, 95, 150], q: [-14, 0, 22], c: 'Overview' },
] : null;
const _tp = new THREE.Vector3(), _tq = new THREE.Vector3();
function tourTick(dt) {
  if (CAP && __capT && SIMT > __capT) { CAP.style.opacity = 0; __capT = 0; }
  if (!TOUR) return;
  let i = 0; while (i + 1 < TOUR.length && SIMT >= TOUR[i + 1].t) i++;
  const k = TOUR[i]; if (k.shown !== true) { k.shown = true; caption(k.c); }
  _tp.set(...k.p); _tq.set(...k.q); const a = 1 - Math.exp(-1.2 * dt);
  camera.position.lerp(_tp, a); controls.target.lerp(_tq, a);
}
function simStep(dt) {
  SIMT += dt;
  for (const v of VEH) { v.px = v.x; v.pz = v.z; v.pth = v.th; v.step(dt); v.obj.userData.update && v.obj.userData.update(dt, SIMT); }
  try { sorterTick(dt); } catch (e) { console.warn('[gf] sorter disabled:', e && e.message); if (SRT && SRT.group) SRT.group.visible = false; SRT = null; OLD_SORT.forEach((o) => { o.visible = true; }); }
  try { popStep(dt); if (SIGNS && SIGNS.update) SIGNS.update(dt); if (WRAP0() && WRAP0().update) WRAP0().update(dt); } catch (e) { if (!simStep.err) { simStep.err = 1; console.warn("[gf] popStep", e && e.message); } }
  updateDoors(dt); updateCases(dt); uiTick(); tourTick(dt);
  for (const a of AMRS) { a.u = (a.u + 1.1 * dt / a.L) % 1; }
  if (ARR.gateOpen !== undefined) { const arm = world.userData.gate.userData.arm; arm.rotation.x = dampV(arm.rotation.x, ARR.gateOpen && ARR.state !== 'Docked' ? -1.4 : 0, 2, dt); }
  if (scanBeam.userData.t > 0) { scanBeam.userData.t -= dt; scanBeam.material.opacity = Math.max(0, Math.sin(scanBeam.userData.t / 0.6 * Math.PI)) * 0.5; }
  W1.userData.update && W1.userData.update(dt, SIMT);
}
function render(alpha, draw = true) {
  for (const v of VEH) placeVehicle(v, alpha);
  for (const a of AMRS) { const p = a.c.getPointAt(a.u), t = a.c.getTangentAt(a.u); a.o.position.copy(p); a.o.rotation.y = Math.atan2(t.x, t.z); a.o.userData.setSpeed && a.o.userData.setSpeed(1.1); a.o.userData.update && a.o.userData.update(STEP, SIMT); }
  // forklift deck height (ramp onto trailer)
  for (const v of VEH) if (!v.isSemi) v.obj.position.y = deckYAt(v.obj.position.z);
  checkJumps(SIMT - (render.t ?? SIMT)); render.t = SIMT;
  if (!draw) return;
  if (FX) { try { FX.render(1 / 60); return; } catch (e) { console.warn('[gf] postfx render failed, direct:', e && e.message); FX = null; } }
  if (composer) composer.render(); else renderer.render(scene, camera);
}
function frame(now) {
  const dt = Math.min(0.5, (now - last) / 1000); // fixed-step accumulator: sim time tracks wall time, independent of render rate (M21)
  last = now; acc += dt * speed;
  let n = 0; while (acc >= STEP && n < 8) { simStep(STEP); acc -= STEP; n++; }
  if (n >= 8) acc = 0;
  if (CAMRIG) CAMRIG.update(dt); else controls.update();
  if (EXPLORE && EXPLORE.active) { try { EXPLORE.update(dt); } catch (e) { console.warn('[gf] explore stopped:', e && e.message); try { EXPLORE.stop(); } catch (_) {} EXPLORE = null; } }
  render(acc / STEP); if (!QS.has('capture')) requestAnimationFrame(frame);
}
// capture API: deterministic
window.__step = (dt) => { let k = Math.round(dt / STEP); while (k-- > 0) simStep(STEP); };
window.__place = () => render(1, false);
window.__render = () => { controls.update(); render(0); };
window.__cam = (px, py, pz, tx, ty, tz) => { camera.position.set(px, py, pz); controls.target.set(tx, ty, tz); controls.update(); };
function onResize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); if (composer) composer.setSize(w, h); if (FX) FX.setSize(w, h); }
addEventListener('resize', onResize);
camera.position.set(-20, 95, 150); controls.target.set(-14, 0, 22); controls.update();
try { if (PFX) PFX.markBrandDecals(scene); } catch (e) { console.warn('[gf] markBrandDecals', e && e.message); }
setupPost();
if (UIX) { try { UIX.stopDemo(); UIX.clearScenePlaceholder(); UIX.onViewChange((v) => {}); } catch (e) { console.error(e); } }
// shadow camera fitting to building + court
Object.assign(sun.shadow.camera, { left: -75, right: 75, top: 70, bottom: -70, near: 60, far: 330 }); sun.position.set(-60, 160, 110); sun.target.position.set(-5, 0, 10); sun.shadow.camera.updateProjectionMatrix(); fill.intensity = 0.2;
const __hideLoad = () => { const el = document.getElementById('gfLoad'); if (el) el.remove(); };
await __yield(90, 'compiling shaders');
try { await renderer.compileAsync(scene, camera); } catch (e) { console.warn('compileAsync', e); }
__hideLoad();
window.__sim = { VEH, PALS, SLOTS, LOC, COUNTS, ASSERT, get t() { return SIMT; } };
window.__quality = Q; window.__assert = ASSERT; window.__ready = true;
// Cooker tour.js Explore mode: one department per wheel gesture / swipe / arrow key, toggled from the dock
let EXPLORE = null;
if (TOURM && TOURM.explore) { try {
  const dock = document.querySelector('nav.dock');
  const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'gf-explore'; btn.textContent = 'Explore'; btn.setAttribute('aria-pressed', 'false'); btn.title = 'Explore the DC department by department';
  const stopX = () => { try { TOURM.explore.stop(); } catch (_) {} controls.enabled = true; btn.setAttribute('aria-pressed', 'false'); };
  btn.addEventListener('click', () => {
    if (TOURM.explore.active) { stopX(); return; }
    EXPLORE = TOURM.explore;
    EXPLORE.start(camera, controls, { signs: typeof SIGNS !== 'undefined' ? SIGNS : null, ui: window.UI || null, domElement: canvas, container: canvas.parentElement });
    btn.setAttribute('aria-pressed', 'true');
  });
  if (dock) { const sp = document.createElement('span'); sp.className = 'sep'; dock.insertBefore(btn, dock.querySelector('.sep')); }
  if (QS.has('explore')) btn.click();
} catch (e) { console.warn('[gf] tour.js Explore skipped:', e && e.message); EXPLORE = null; } }
requestAnimationFrame(frame);
window.__dbg = { docked, reachD, FK1, tineTopY, carriageOf, syncPose, placeVehicle, LANES, THREE };
