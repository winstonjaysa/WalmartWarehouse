#!/usr/bin/env node
// GateFlow browser smoke test.  Usage: node qa/smoke.js <url-or-file> [--out dir] [--q high|low] [--spoof-gpu] [--only desktop|phone]
'use strict';
const path = require('path'), fs = require('fs'), zlib = require('zlib');
let puppeteer;
try { puppeteer = require('puppeteer-core'); } catch (e) { puppeteer = require(path.join(__dirname, 'tools/node_modules/puppeteer-core')); }

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const flag = (k) => args.includes(k);
let target = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--') && ['--out', '--q', '--only'].includes(args[i - 1])));
if (!target) { console.error('usage: node qa/smoke.js <url-or-file-path> [--out dir] [--q high] [--spoof-gpu]'); process.exit(2); }
if (!/^[a-z]+:\/\//i.test(target)) target = 'file://' + path.resolve(target);
const Q = opt('--q', null);
if (Q) target += (target.includes('?') ? '&' : '?') + 'q=' + encodeURIComponent(Q);
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const OUT = path.resolve(opt('--out', path.join(__dirname, 'smoke_out', stamp)));
fs.mkdirSync(OUT, { recursive: true });
const LOADER_DEADLINE = 10000, HARD_TIMEOUT = 60000, MAX_PROGRAMS = 60;

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  { name: 'phone', width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' },
].filter((v) => !opt('--only') || v.name === opt('--only'));

// ---------- tiny PNG decoder (8-bit, non-interlaced, RGB/RGBA) ----------
function decodePNG(buf) {
  let p = 8, w, h, ct, idat = [];
  while (p < buf.length) { const len = buf.readUInt32BE(p), type = buf.toString('ascii', p + 4, p + 8), d = buf.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); ct = d[9]; if (d[8] !== 8 || d[12]) throw new Error('png fmt'); }
    else if (type === 'IDAT') idat.push(d); else if (type === 'IEND') break; p += 12 + len; }
  const bpp = ct === 6 ? 4 : ct === 2 ? 3 : ct === 0 ? 1 : 4, raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * bpp, out = Buffer.alloc(w * h * 4);
  let prev = Buffer.alloc(stride), cur = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) { const f = raw[y * (stride + 1)]; raw.copy(cur, 0, y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) { const a = x >= bpp ? cur[x - bpp] : 0, b = prev[x], c = x >= bpp ? prev[x - bpp] : 0; let v = cur[x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      cur[x] = v & 255; }
    for (let x = 0; x < w; x++) { const o = (y * w + x) * 4; if (bpp === 1) { out[o] = out[o + 1] = out[o + 2] = cur[x]; out[o + 3] = 255; } else { out[o] = cur[x * bpp]; out[o + 1] = cur[x * bpp + 1]; out[o + 2] = cur[x * bpp + 2]; out[o + 3] = bpp === 4 ? cur[x * bpp + 3] : 255; } }
    [prev, cur] = [cur, prev]; }
  return { w, h, px: out };
}
function imgStats(img) { // uniformity: stddev of luma + #distinct coarse colours
  let s = 0, s2 = 0; const n = img.w * img.h, cols = new Set();
  for (let i = 0; i < n; i++) { const r = img.px[i * 4], g = img.px[i * 4 + 1], b = img.px[i * 4 + 2], l = 0.299 * r + 0.587 * g + 0.114 * b; s += l; s2 += l * l; if (cols.size < 500) cols.add((r >> 4) << 8 | (g >> 4) << 4 | (b >> 4)); }
  const mean = s / n, sd = Math.sqrt(Math.max(0, s2 / n - mean * mean));
  return { mean: +mean.toFixed(1), sd: +sd.toFixed(2), colours: cols.size, blank: sd < 2 || cols.size < 4 };
}
function imgDiff(a, b) { if (!a || !b || a.w !== b.w || a.h !== b.h) return { changedFrac: 1, meanAbs: 255 };
  let ch = 0, sum = 0; const n = a.w * a.h;
  for (let i = 0; i < n; i++) { const d = Math.max(Math.abs(a.px[i * 4] - b.px[i * 4]), Math.abs(a.px[i * 4 + 1] - b.px[i * 4 + 1]), Math.abs(a.px[i * 4 + 2] - b.px[i * 4 + 2])); sum += d; if (d > 10) ch++; }
  return { changedFrac: +(ch / n).toFixed(5), meanAbs: +(sum / n).toFixed(3) };
}
const withTimeout = (p, ms, what) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout: ' + what + ' >' + ms + 'ms')), ms))]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- injected before any page script ----------
const HOOK = (spoof) => {
  const H = window.__smoke = { t0: performance.now(), shaders: 0, programsLinked: 0, programsCreated: 0, compileStatusPolls: 0, draws: 0, raf: 0, frames: [], longTasks: [], loader: [], lastCompileAt: 0, lastLinkAt: 0, contexts: 0, parallelExt: false, linkFail: 0 };
  const wrap = (proto, name, fn) => { const o = proto && proto[name]; if (!o) return; proto[name] = function () { fn.call(this, arguments); return o.apply(this, arguments); }; };
  for (const C of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) { if (!C) continue; const P = C.prototype;
    wrap(P, 'compileShader', () => { H.shaders++; H.lastCompileAt = performance.now(); });
    wrap(P, 'createProgram', () => { H.programsCreated++; });
    wrap(P, 'linkProgram', () => { H.programsLinked++; H.lastLinkAt = performance.now(); });
    for (const d of ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced', 'drawRangeElements']) wrap(P, d, () => { H.draws++; });
    const gpp = P.getProgramParameter; P.getProgramParameter = function (p, k) { const v = gpp.call(this, p, k); if (k === 0x91B1) H.compileStatusPolls++; if (k === 0x8B82 && v === false) H.linkFail++; return v; };
    const ge = P.getExtension; P.getExtension = function (n) { const e = ge.call(this, n); if (/parallel_shader_compile/i.test(n) && e) H.parallelExt = true; return e; };
    if (spoof) { const gp = P.getParameter; P.getParameter = function (k) { if (k === 0x9246) return 'ANGLE (Apple, ANGLE Metal Renderer: Apple M2, Unspecified Version)'; if (k === 0x9245) return 'Google Inc. (Apple)'; if (k === 0x0D33) return Math.max(16384, gp.call(this, k)); return gp.call(this, k); }; }
  }
  const raf = window.requestAnimationFrame.bind(window); let lastDraws = 0;
  window.requestAnimationFrame = (cb) => raf((t) => { const before = H.draws; try { cb(t); } finally { const d = H.draws - before; if (d > 0) { H.raf++; if (H.frames.length < 4000) H.frames.push([+performance.now().toFixed(0), d]); } } });
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (H.longTasks.length < 500) H.longTasks.push([+e.startTime.toFixed(0), +e.duration.toFixed(0)]); }).observe({ entryTypes: ['longtask'] }); } catch (e) {}
  let lastTxt = null; setInterval(() => { const el = document.getElementById('gfLoad') || document.querySelector('[id*=load i],[class*=loader i],[class*=overlay i]');
    const txt = el ? (el.textContent || '').trim().slice(0, 120) : '(gone)'; if (txt !== lastTxt) { lastTxt = txt; H.loader.push([+performance.now().toFixed(0), txt, H.shaders, H.programsLinked]); } }, 100);
};

// in-page probes
const PROBE_LOADER = () => {
  const cands = []; const g = document.getElementById('gfLoad'); if (g) cands.push(g);
  for (const el of document.querySelectorAll('[id*=load i],[class*=loader i],[class*=overlay i],[id*=overlay i],[class*=loading i]')) if (!cands.includes(el)) cands.push(el);
  for (const el of document.querySelectorAll('body *')) if (el.children.length < 4 && /compiling shaders|loading 3d/i.test(el.textContent || '') && !cands.includes(el)) cands.push(el);
  const vis = (el) => { if (!el.isConnected) return false; let e = el; while (e && e.nodeType === 1) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity <= 0.05) return false; e = e.parentElement; } const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const res = cands.slice(0, 10).map((el) => ({ sel: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''), visible: vis(el), text: (el.textContent || '').trim().slice(0, 100) }));
  // only treat loader-ish ones as loader (gfLoad / text match / loader class), skip generic overlays that are not visible
  const loaderish = res.filter((r) => /gfLoad|loader|loading/i.test(r.sel) || /compiling shaders|loading 3d/i.test(r.text));
  return { found: loaderish, anyVisible: loaderish.some((r) => r.visible), gfLoadInDom: !!document.getElementById('gfLoad') };
};
const PROBE_CANVAS = () => { let best = null, ba = 0; for (const c of document.querySelectorAll('canvas')) { const r = c.getBoundingClientRect(); const a = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0)) * Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0)); if (a > ba) { ba = a; best = { id: c.id, x: Math.max(r.left, 0), y: Math.max(r.top, 0), w: Math.min(r.right, innerWidth) - Math.max(r.left, 0), h: Math.min(r.bottom, innerHeight) - Math.max(r.top, 0) }; } } return best; };
const PROBE_STATE = () => {
  const H = window.__smoke || {}; const out = { hooks: { shaders: H.shaders, programsLinked: H.programsLinked, programsCreated: H.programsCreated, draws: H.draws, raf: H.raf, compileStatusPolls: H.compileStatusPolls, parallelExt: H.parallelExt, linkFail: H.linkFail, lastCompileAt: +H.lastCompileAt.toFixed(0), lastLinkAt: +H.lastLinkAt.toFixed(0), firstDrawFrameAt: H.frames.length ? H.frames[0][0] : null, framesWithDraws: H.raf } };
  const R = window.__R || (window.app && window.app.renderer ? window.app : null) || (window.renderer ? { renderer: window.renderer, scene: window.scene, camera: window.camera } : null);
  out.globals = ['__R', '__sim', '__ents', '__dbg', '__ready', '__quality', 'scene', 'renderer', 'camera', 'THREE', 'app', 'UI'].filter((k) => window[k] !== undefined);
  out.ready = !!window.__ready; out.quality = window.__quality; out.aq = window.__aq;
  if (R && R.renderer) { const i = R.renderer.info; out.renderer = { programs: i.programs ? i.programs.length : null, calls: i.render.calls, triangles: i.render.triangles, frame: i.render.frame, geometries: i.memory.geometries, textures: i.memory.textures, autoReset: i.autoReset }; }
  if (R && R.camera) { const c = R.camera; out.camera = { p: c.position.toArray().map((v) => +v.toFixed(3)), q: c.quaternion.toArray().map((v) => +v.toFixed(4)), zoom: c.zoom, fov: c.fov }; }
  return out;
};
const PROBE_VEH = () => {
  const out = []; const W = (o) => { o.updateWorldMatrix && o.updateWorldMatrix(true, false); const e = o.matrixWorld.elements; return [+e[12].toFixed(3), +e[13].toFixed(3), +e[14].toFixed(3)]; };
  if (window.__sim && window.__sim.VEH) for (const v of window.__sim.VEH.slice(0, 40)) if (v.obj) out.push({ id: v.id, type: v.type, src: '__sim.VEH', p: W(v.obj) });
  if (!out.length && typeof window.__ents === 'function') for (const e of window.__ents().slice(0, 40)) if (e.obj) out.push({ id: e.id, type: e.type, src: '__ents', p: W(e.obj) });
  const sc = (window.__R && window.__R.scene) || window.scene;
  if (!out.length && sc) sc.traverse((o) => { if (out.length < 40 && /truck|forklift|amr|tug|agv|reach|semi|vehicle/i.test(o.name)) out.push({ id: o.name, type: 'named', src: 'scene.traverse', p: W(o) }); });
  return out;
};
const PROBE_BUTTONS = () => {
  const els = [...document.querySelectorAll('button,[role=button],a,[onclick]')];
  const vis = (el) => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const key = (el) => [el.textContent, el.getAttribute('aria-label'), el.title, el.id, el.dataset ? JSON.stringify(el.dataset) : ''].join(' | ').replace(/\s+/g, ' ').trim();
  const pick = (re) => { const m = els.filter((el) => re.test(key(el))); const v = m.filter(vis); const el = v[0] || m[0]; if (!el) return null; el.setAttribute('data-smoke', re.source.slice(0, 12)); const r = el.getBoundingClientRect(); return { key: key(el).slice(0, 120), visible: vis(el), x: r.left + r.width / 2, y: r.top + r.height / 2, sel: '[data-smoke="' + re.source.slice(0, 12) + '"]' }; };
  return { zoomIn: pick(/zoom[\s_-]*in|^\s*\+\s*(\||$)|\bzoomin\b|data-zoom":"(in|\+|1)"/i), zoomOut: pick(/zoom[\s_-]*out|^\s*[-−–]\s*(\||$)|\bzoomout\b|data-zoom":"(out|-|-1)"/i), explore: pick(/explore/i) };
};

async function runViewport(browser, vp) {
  const r = { viewport: vp.name, url: target, checks: {}, metrics: {}, console: [], pageErrors: [], notes: [] };
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  const shots = {}; const dir = path.join(OUT, vp.name); fs.mkdirSync(dir, { recursive: true });
  let bodyDone = false;
  try {
    await Promise.race([(async () => {
    if (vp.ua) await page.setUserAgent(vp.ua);
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: vp.deviceScaleFactor, isMobile: vp.isMobile, hasTouch: vp.hasTouch });
    await page.evaluateOnNewDocument(HOOK, flag('--spoof-gpu'));
    page.on('console', (m) => { const t = m.type(), loc = m.location() || {}; const e = { t: +((Date.now() - r._nav) / 1000).toFixed(2), type: t, text: m.text().slice(0, 500), url: loc.url };
      if (t === 'error') { if (/favicon/i.test(e.text + ' ' + (e.url || '')) || /ethicalads\.io/i.test(e.url || '')) return; r.console.push(e); } else if (r.notes.length < 0) {} if (t !== 'error' && (r._info = r._info || []).length < 60) r._info.push(e); });
    page.on('pageerror', (err) => r.pageErrors.push({ t: +((Date.now() - r._nav) / 1000).toFixed(2), text: String(err && err.stack || err).slice(0, 800) }));
    page.on('requestfailed', (q) => { if (!/favicon/i.test(q.url())) (r.failedRequests = r.failedRequests || []).push(q.url() + ' ' + (q.failure() || {}).errorText); });
    r._nav = Date.now();
    await withTimeout(page.goto(target, { waitUntil: 'domcontentloaded', timeout: 30000 }), 31000, 'goto');
    // githack/rawgit interstitial ("One more step" -> "Open the page"): click through, restart the clock at the real navigation
    const inter = await page.evaluate(() => /One more step|rawgit\.hack/i.test(document.body ? document.body.innerText : '')).catch(() => false);
    if (inter) { r.notes.push('githack interstitial detected; clicked "Open the page" (console/requests from the interstitial discarded: ' + r.console.length + ')'); r.console.length = 0; r.pageErrors.length = 0; r.failedRequests = [];
      const h = await page.evaluateHandle(() => [...document.querySelectorAll('a,button')].find((a) => /open the page/i.test(a.textContent)));
      r._nav = Date.now(); await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }), h.asElement().click()]); r._nav = Date.now() - (await page.evaluate(() => performance.now())); }
    const since = () => Date.now() - r._nav;
    // ---- TTFF polling (every ~250 ms, until 10 s) ----
    const snap = async (scale = 0.5, file) => { const c = await withTimeout(page.evaluate(PROBE_CANVAS), 4000, 'canvas probe'); if (!c || c.w < 2) return null;
      const buf = await withTimeout(page.screenshot({ type: 'png', clip: { x: c.x, y: c.y, width: c.w, height: c.h, scale } }), 8000, 'screenshot'); if (file) fs.writeFileSync(path.join(dir, file), buf); return decodePNG(buf); };
    let ttff = null, firstImg = null, polls = 0, pollErr = null;
    while (since() < LOADER_DEADLINE) { polls++;
      try { const img = await snap(0.25); if (img) { const st = imgStats(img); if (!st.blank) { if (!firstImg) firstImg = img; else if (ttff == null && imgDiff(firstImg, img).changedFrac > 0) {} if (ttff == null) ttff = since(); } } } catch (e) { pollErr = e.message; }
      await sleep(Math.max(0, 250 - (since() % 250))); }
    r.metrics.ttffScreenshotNonBlankMs = ttff; r.metrics.ttffPolls = polls; if (pollErr) r.notes.push('poll error: ' + pollErr);
    // ---- 1. loader at t=10 s ----
    let ld; try { ld = await withTimeout(page.evaluate(PROBE_LOADER), 12000, 'loader probe'); } catch (e) { ld = { anyVisible: true, found: [{ visible: true, text: 'MAIN THREAD UNRESPONSIVE at 10 s (' + e.message + ')' }] }; }
    const st10 = await withTimeout(page.evaluate(PROBE_STATE), 12000, 'state probe').catch((e) => ({ hooks: {}, err: e.message }));
    const H10 = await withTimeout(page.evaluate(() => ({ loader: window.__smoke.loader, longTasks: window.__smoke.longTasks.slice(0, 60), frames: window.__smoke.frames.slice(0, 5) })), 12000, 'hook dump').catch(() => ({ loader: [], longTasks: [], frames: [] }));
    await withTimeout(page.screenshot({ path: path.join(dir, 't10s.png') }), 15000, 'screenshot t10').catch((e) => r.notes.push('t10 screenshot: ' + e.message));
    const seenIdx = H10.loader.findIndex((x) => x[1] !== '(gone)'); const gone = seenIdx >= 0 ? H10.loader.slice(seenIdx).find((x) => x[1] === '(gone)') : null;
    
    r.metrics.loaderProbeAtMs = since(); const booted = st10.err ? true : (st10.ready || (st10.hooks && st10.hooks.draws > 0));
    r.checks.loader = { pass: !ld.anyVisible && booted && (seenIdx < 0 || !!gone), detail: ld.anyVisible ? 'loader still visible at ' + (since() / 1000).toFixed(1) + 's: "' + (ld.found.find((f) => f.visible) || {}).text + '"' : !booted ? 'app never booted (no __ready, no draw calls) by 10 s' : (gone ? 'loader removed at ' + gone[0] + 'ms' : 'no visible loader'), found: ld.found };
    r.state10 = st10;
    const over = () => since() > HARD_TIMEOUT - 6000;
    const btnsEarly = await withTimeout(page.evaluate(PROBE_BUTTONS), 10000, 'buttons').catch(() => null);
    if (btnsEarly && !btnsEarly.zoomIn && !btnsEarly.zoomOut && !btnsEarly.explore) r.checks.buttons = { pass: false, detail: 'zoomIn, zoomOut, explore: NOT FOUND in DOM (no matching button/aria-label/title/id)', found: btnsEarly };
    // ---- 2. frame rendered & changing ----
    const a = await snap(0.5, 'canvas_a.png').catch((e) => (r.notes.push('snap a: ' + e.message), null)); await sleep(1000);
    const b = await snap(0.5, 'canvas_b.png').catch((e) => (r.notes.push('snap b: ' + e.message), null));
    const sa = a && imgStats(a), dab = imgDiff(a, b);
    r.checks.frame = { pass: !!(a && b && !sa.blank && !imgStats(b).blank && dab.changedFrac > 0.0002), detail: a ? `stats ${JSON.stringify(sa)} diff1s ${JSON.stringify(dab)}` + (b ? '' : ' (2nd capture failed)') : 'canvas capture failed/timed out (main thread blocked?): ' + r.notes.filter((n) => /^snap/.test(n)).join('; '), ttffMs: ttff };
    // ---- 3. vehicles move ----
    if (over()) throw new Error('viewport budget 60s exceeded before vehicle check');
    // Vehicles: the page's frame() caps catch-up at 2 sim steps (2/60 s) per rendered frame, so at <1 fps the sim clock
    // barely advances in wall time. Judge motion against SIM time: sample positions + __sim.t over a 2 s wall window; if
    // the sim clock advanced < 1 s, advance the sim deterministically with window.__step(5) and resample.
    const simT = () => withTimeout(page.evaluate(() => window.__sim ? +window.__sim.t.toFixed(3) : null), 10000, 'simT').catch(() => null);
    const vstate = () => withTimeout(page.evaluate(() => window.__sim ? window.__sim.VEH.slice(0, 40).map((v) => ({ id: v.id, state: v.state, task: v.task, ds: v.ds })) : null), 10000, 'vstate').catch(() => null);
    const moved = (A, B) => A.map((x) => { const y = B.find((z) => z.id === x.id); return { id: x.id, type: x.type, d: y ? +Math.hypot(y.p[0] - x.p[0], y.p[1] - x.p[1], y.p[2] - x.p[2]).toFixed(3) : null }; });
    const t1 = await simT(); const w1 = since();
    const v1 = await withTimeout(page.evaluate(PROBE_VEH), 10000, 'veh').catch(() => []); const vimgA = b; await sleep(2000);
    const v2 = await withTimeout(page.evaluate(PROBE_VEH), 10000, 'veh').catch(() => []); const t2 = await simT(); const w2 = since();
    if (v1.length) { const mv = moved(v1, v2); const mvN = mv.filter((m) => m.d > 0.05).length;
      const simRate = t1 != null && t2 != null ? +((t2 - t1) / ((w2 - w1) / 1000)).toFixed(3) : null;
      const vc = r.checks.vehicles = { pass: mvN >= 1, method: 'world positions via ' + v1[0].src, wall: { movedN: mvN, of: mv.length, simT: [t1, t2], simSecondsPerWallSecond: simRate, maxD: Math.max(0, ...mv.map((m) => m.d || 0)) }, sample: mv.slice(0, 8), states: await vstate() };
      r.metrics.simSecondsPerWallSecond = simRate;
      if (!vc.pass && t1 != null && t2 - t1 < 1) { // sim clock starved by low fps -> sim-time based check
        const hasStep = await page.evaluate(() => typeof window.__step === 'function').catch(() => false);
        if (hasStep) { const s0 = await simT(); const p0 = await withTimeout(page.evaluate(PROBE_VEH), 10000, 'veh').catch(() => []);
          await withTimeout(page.evaluate(() => window.__step(5)), 20000, '__step').catch((e) => r.notes.push('__step: ' + e.message));
          const s1 = await simT(); const p1 = await withTimeout(page.evaluate(PROBE_VEH), 10000, 'veh').catch(() => []);
          const m3 = moved(p0, p1); const n3 = m3.filter((m) => m.d > 0.05).length;
          vc.sim = { simT: [s0, s1], movedN: n3, of: m3.length, maxD: Math.max(0, ...m3.map((m) => m.d || 0)), sample: m3.slice(0, 8) };
          vc.pass = n3 >= 1; vc.method += ' + window.__step(5) sim-time fallback'; }
      }
      vc.detail = `wall 2s: ${mvN}/${mv.length} moved, sim clock ${t1}->${t2} (${simRate} sim-s/wall-s)` + (vc.sim ? `; after __step(5) sim ${vc.sim.simT[0]}->${vc.sim.simT[1]}: ${vc.sim.movedN}/${vc.sim.of} moved, max ${vc.sim.maxD}m` : ''); }
    else { const vimgB = await snap(0.5).catch(() => null); const d = imgDiff(vimgA, vimgB); r.checks.vehicles = { pass: !!(vimgA && vimgB) && d.changedFrac > 0.0005, method: 'screenshot diff fallback (no vehicle globals)', detail: JSON.stringify(d) }; }
    // ---- 4. buttons ----
    if (!r.checks.buttons) { if (over()) throw new Error('viewport budget 60s exceeded before button check');
    const btns = await withTimeout(page.evaluate(PROBE_BUTTONS), 10000, 'buttons');
    r.checks.buttons = { pass: true, detail: [], found: btns };
    for (const k of ['zoomIn', 'zoomOut', 'explore']) { const bt = btns[k];
      if (!bt) { r.checks.buttons.pass = false; r.checks.buttons.detail.push(k + ': NOT FOUND in DOM'); continue; }
      const c0 = (await withTimeout(page.evaluate(PROBE_STATE), 10000, 'cam')).camera; const i0 = await snap(0.5, `before_${k}.png`).catch(() => null);
      try { await withTimeout(page.click(bt.sel), 4000, 'click ' + k); } catch (e) { try { await page.mouse.click(bt.x, bt.y); } catch (e2) {} r.notes.push(k + ' click: ' + e.message); }
      await sleep(1500);
      const c1 = (await withTimeout(page.evaluate(PROBE_STATE), 10000, 'cam')).camera; const i1 = await snap(0.5, `after_${k}.png`).catch(() => null);
      const camD = c0 && c1 ? Math.hypot(...c0.p.map((v, i) => v - c1.p[i])) + Math.abs(c0.zoom - c1.zoom) + 10 * Math.hypot(...c0.q.map((v, i) => v - c1.q[i])) : null;
      const d = imgDiff(i0, i1); const ok = camD != null ? camD > 0.05 : d.changedFrac > 0.05;
      if (!ok) r.checks.buttons.pass = false;
      r.checks.buttons.detail.push(`${k} ("${bt.key.slice(0, 40)}"): ${ok ? 'changed' : 'NO CHANGE'} camDelta=${camD == null ? 'n/a' : camD.toFixed(3)} imgDiff=${d.changedFrac}`);
      if (k === 'explore') try { await page.keyboard.press('Escape'); } catch (e) {} }
    r.checks.buttons.detail = r.checks.buttons.detail.join('; '); }
    // ---- fps / draw calls over a 10 s window (starting now) ----
    if (over()) throw new Error('viewport budget 60s exceeded before fps window');
    const f0 = await withTimeout(page.evaluate(() => ({ raf: window.__smoke.raf, draws: window.__smoke.draws, t: performance.now(), rf: window.__R ? window.__R.renderer.info.render.frame : null })), 10000, 'fps0');
    const winMs = Math.max(3000, Math.min(10000, HARD_TIMEOUT - 15000 - since())); await sleep(winMs);
    const f1 = await withTimeout(page.evaluate(() => ({ raf: window.__smoke.raf, draws: window.__smoke.draws, t: performance.now(), rf: window.__R ? window.__R.renderer.info.render.frame : null })), 12000, 'fps1');
    const secs = (f1.t - f0.t) / 1000, nf = f1.raf - f0.raf;
    r.metrics.fpsWindowS = +secs.toFixed(1); r.metrics.avgFps = +(nf / secs).toFixed(2); r.metrics.rendererFrameFps = f0.rf != null ? +((f1.rf - f0.rf) / secs).toFixed(2) : null;
    r.metrics.drawCallsPerFrameHooked = nf ? +((f1.draws - f0.draws) / nf).toFixed(1) : null;
    const stE = await withTimeout(page.evaluate(PROBE_STATE), 10000, 'stateEnd'); r.stateEnd = stE;
    r.metrics.drawCallsRendererInfo = stE.renderer ? stE.renderer.calls : null; r.metrics.programsRendererInfo = stE.renderer ? stE.renderer.programs : null;
    r.metrics.programsLinkedHook = stE.hooks.programsLinked; r.metrics.shadersCompiledHook = stE.hooks.shaders; r.metrics.quality = stE.quality;
    // ---- 6. programs ----
    const progs = stE.renderer && stE.renderer.programs != null ? stE.renderer.programs : null;
    r.checks.programs = { pass: progs != null ? progs <= MAX_PROGRAMS : stE.hooks.programsLinked <= MAX_PROGRAMS, detail: progs != null ? `renderer.info.programs.length=${progs} (limit ${MAX_PROGRAMS}); hooked linkProgram=${stE.hooks.programsLinked}, compileShader=${stE.hooks.shaders}` : `renderer not accessible (unknown); hooked linkProgram=${stE.hooks.programsLinked}` };
    await page.screenshot({ path: path.join(dir, 'end.png') }).catch(() => {});
    })(), (async () => { while (!r._nav || Date.now() - r._nav < HARD_TIMEOUT) { if (bodyDone) return; await sleep(250); } throw new Error('viewport hard timeout ' + HARD_TIMEOUT + 'ms (page hang / main thread blocked)'); })()]);
    bodyDone = true;
  } catch (e) {
    bodyDone = true; r.fatal = e.message; r.notes.push('FATAL: ' + e.message);
    try { r.hangDump = await withTimeout(page.evaluate(() => ({ smoke: window.__smoke && { ...window.__smoke, frames: undefined }, ready: window.__ready })), 3000, 'hang dump'); } catch (e2) { r.hangDump = 'page unresponsive: ' + e2.message; }
  } finally {
    try { const d = await withTimeout(page.evaluate(() => { const H = window.__smoke; return { shaders: H.shaders, programsLinked: H.programsLinked, draws: H.draws, framesWithDraws: H.raf, firstDrawFrameAt: H.frames.length ? H.frames[0][0] : null, frames: H.frames.slice(0, 40), loader: H.loader, longTasks: H.longTasks, lastCompileAt: +H.lastCompileAt.toFixed(0), parallelExt: H.parallelExt, linkFail: H.linkFail, ready: !!window.__ready, programsInfo: window.__R ? window.__R.renderer.info.programs.length : null, quality: window.__quality, aq: window.__aq, now: +performance.now().toFixed(0) }; }), 15000, 'final dump');
      r.final = d; r.metrics.ttffMs = d.firstDrawFrameAt; r.metrics.loaderTimeline = d.loader; r.metrics.longTasks = d.longTasks; r.metrics.longestTaskMs = d.longTasks.reduce((m, x) => Math.max(m, x[1]), 0);
      const si = d.loader.findIndex((x) => x[1] !== '(gone)'); const g = si >= 0 ? d.loader.slice(si).find((x) => x[1] === '(gone)') : null; r.metrics.loaderGoneMs = g ? g[0] : null;
      if (r.metrics.programsLinkedHook == null) { r.metrics.programsLinkedHook = d.programsLinked; r.metrics.shadersCompiledHook = d.shaders; r.metrics.programsRendererInfo = d.programsInfo; r.metrics.quality = d.quality; }
      if (!r.metrics.drawCallsPerFrameHooked && d.frames.length) r.metrics.drawCallsPerFrameHooked = +(d.frames.reduce((s, f) => s + f[1], 0) / d.frames.length).toFixed(1);
      if (r.metrics.avgFps == null && d.frames.length > 1) r.metrics.avgFps = +((d.frames.length - 1) / ((d.frames[d.frames.length - 1][0] - d.frames[0][0]) / 1000)).toFixed(2);
      // loader verdict from the in-page timeline (the t=10 s probe itself can be delayed by a blocked main thread)
      if (r.checks.loader && r.checks.loader.pass && (r.metrics.loaderGoneMs == null ? si >= 0 : r.metrics.loaderGoneMs > LOADER_DEADLINE)) r.checks.loader = { pass: false, detail: `loader removed at ${r.metrics.loaderGoneMs}ms (> ${LOADER_DEADLINE}ms; t=10 s probe was delayed by a blocked main thread)` };
      if (!r.checks.loader) r.checks.loader = { pass: r.metrics.loaderGoneMs != null && r.metrics.loaderGoneMs <= LOADER_DEADLINE, detail: 'from in-page timeline: loader removed at ' + r.metrics.loaderGoneMs + 'ms' };
      if (!r.checks.programs) { const n = d.programsInfo != null ? d.programsInfo : d.programsLinked; r.checks.programs = { pass: n <= MAX_PROGRAMS, detail: `${d.programsInfo != null ? 'renderer.info.programs.length' : 'hooked linkProgram'}=${n} (limit ${MAX_PROGRAMS}); compileShader=${d.shaders} [from final dump]` }; }
    } catch (e) { r.notes.push('final dump failed: ' + e.message);
      if (r.checks.loader && r.checks.loader.pass && r.metrics.loaderProbeAtMs > LOADER_DEADLINE + 2000) r.checks.loader = { pass: false, detail: `cannot verify: t=10 s probe only returned at ${r.metrics.loaderProbeAtMs}ms and page timeline unreadable (main thread blocked)` }; }
    // ---- 5. console ----
    r.checks.console = { pass: r.console.length === 0 && r.pageErrors.length === 0, detail: `${r.console.length} console.error, ${r.pageErrors.length} pageerror` };
    for (const k of ['loader', 'frame', 'vehicles', 'buttons', 'programs']) if (!r.checks[k]) r.checks[k] = { pass: false, detail: 'not reached (' + (r.fatal || 'aborted') + ')' };
    r.infoLog = r._info; delete r._info; delete r._nav;
    r.pass = Object.values(r.checks).every((c) => c.pass) && !r.fatal;
    fs.writeFileSync(path.join(dir, 'result.json'), JSON.stringify(r, null, 2));
    ctx.close().catch(() => {});
  }
  return r;
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', headless: 'new',
    args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-dev-shm-usage', '--no-first-run'] });
  const results = [];
  for (const vp of VIEWPORTS) {
    let res; let killed = false;
    const p = runViewport(browser, vp);
    res = await Promise.race([p, sleep(HARD_TIMEOUT + 45000).then(() => (killed = true, null))]);
    if (killed) res = { viewport: vp.name, pass: false, fatal: 'outer hard timeout ' + (HARD_TIMEOUT + 45000) + 'ms (hang)', checks: { loader: { pass: false, detail: 'hang: viewport did not finish within hard timeout (page/main thread unresponsive)' }, frame: { pass: false, detail: 'hang' }, vehicles: { pass: false, detail: 'hang' }, buttons: { pass: false, detail: 'hang' }, console: { pass: false, detail: 'hang' }, programs: { pass: false, detail: 'hang' } }, metrics: {} };
    if (killed) { fs.mkdirSync(path.join(OUT, vp.name), { recursive: true }); fs.writeFileSync(path.join(OUT, vp.name, 'result_hang.json'), JSON.stringify(res, null, 2)); }
    results.push(res);
  }
  await browser.close().catch(() => {});
  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(results.map((r) => ({ viewport: r.viewport, pass: r.pass, checks: Object.fromEntries(Object.entries(r.checks).map(([k, v]) => [k, v.pass])), metrics: r.metrics })), null, 2));
  const C = ['loader', 'frame', 'vehicles', 'buttons', 'console', 'programs'];
  console.log('\nURL: ' + target + '\nOUT: ' + OUT + '\n');
  console.log('viewport | ' + C.join(' | ') + ' | RESULT');
  for (const r of results) console.log(r.viewport.padEnd(8) + ' | ' + C.map((k) => (r.checks[k] ? (r.checks[k].pass ? 'PASS' : 'FAIL') : '-').padEnd(k.length)).join(' | ') + ' | ' + (r.pass ? 'PASS' : 'FAIL'));
  for (const r of results) { const m = r.metrics || {};
    console.log(`\n[${r.viewport}] TTFF(first GL frame)=${m.ttffMs}ms screenshotNonBlank=${m.ttffScreenshotNonBlankMs}ms loaderGone=${m.loaderGoneMs}ms avgFps=${m.avgFps} (renderer.frame ${m.rendererFrameFps}) draws/frame=${m.drawCallsPerFrameHooked} (info.calls ${m.drawCallsRendererInfo}) programs=${m.programsRendererInfo} linked=${m.programsLinkedHook} shaders=${m.shadersCompiledHook} quality=${m.quality} longest task=${m.longestTaskMs}ms simRate=${m.simSecondsPerWallSecond}`);
    for (const [k, v] of Object.entries(r.checks)) console.log(`  ${k}: ${v.pass ? 'PASS' : 'FAIL'} - ${typeof v.detail === 'string' ? v.detail.slice(0, 300) : ''}`);
    for (const e of [...(r.console || []), ...(r.pageErrors || [])].slice(0, 5)) console.log('  ERR: ' + e.text.slice(0, 300));
    if (r.fatal) console.log('  FATAL: ' + r.fatal); }
  process.exit(results.every((r) => r.pass) ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(3); });
