#!/usr/bin/env node
// GateFlow browser smoke test.
// Usage: node qa/smoke.js <url-or-file> [--profile v4|v3] [--out dir] [--q high|low] [--spoof-gpu] [--only desktop|phone]
//   v4 (default): scroll-story checks: loader<=3s, frame changing, vehicles+workers move, step navigation (next/prev/wheel/touch),
//                 console errors, draws/frame<300, programs<25, longest task<500ms.
//   v3: legacy DC demo checks: loader<=10s, frame, vehicles, zoom +/- & Explore, console, programs<=60.
'use strict';
const path = require('path'), fs = require('fs'), zlib = require('zlib');
let puppeteer;
try { puppeteer = require('puppeteer-core'); } catch (e) { puppeteer = require(path.join(__dirname, 'tools/node_modules/puppeteer-core')); }

const args = process.argv.slice(2);
const VALOPTS = ['--out', '--q', '--only', '--profile', '--timeout'];
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const flag = (k) => args.includes(k);
let target = args.find((a, i) => !a.startsWith('--') && !(i > 0 && VALOPTS.includes(args[i - 1])));
if (!target) { console.error('usage: node qa/smoke.js <url-or-file-path> [--profile v4|v3] [--out dir] [--q high] [--spoof-gpu] [--only desktop|phone]'); process.exit(2); }
if (!/^[a-z]+:\/\//i.test(target)) target = 'file://' + path.resolve(target);
const PROFILE = opt('--profile', 'v4');
const Q = opt('--q', null);
if (Q) target += (target.includes('?') ? '&' : '?') + 'q=' + encodeURIComponent(Q);
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const OUT = path.resolve(opt('--out', path.join(__dirname, 'smoke_out', stamp)));
fs.mkdirSync(OUT, { recursive: true });
const HARD_TIMEOUT = +opt('--timeout', 60000);
const G = PROFILE === 'v3'
  ? { loaderMs: 10000, maxPrograms: 60, maxDraws: null, maxLongTask: null, checks: ['loader', 'frame', 'movers', 'buttons', 'console', 'programs'] }
  : { loaderMs: 3000, maxPrograms: 24, maxDraws: 299, maxLongTask: 499, checks: ['loader', 'frame', 'movers', 'nav', 'console', 'draws', 'programs', 'longtask'] };

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
  let lastTxt = null; const LSEL = '#gfLoad,[id*=loader i],[id*=loading i],[class*=loader i],[class*=loading i],[aria-busy=true]';
  const vis = (el) => { if (!el || !el.isConnected) return false; let e = el; while (e && e.nodeType === 1) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity <= 0.05) return false; e = e.parentElement; } const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  setInterval(() => { if (!document.body) return; let el = [...document.querySelectorAll(LSEL)].find(vis);
    if (!el) for (const e of document.body.querySelectorAll('div,section,p,span')) if (e.children.length < 4 && /compiling shaders|loading 3d|^\s*loading/i.test(e.textContent || '') && vis(e)) { el = e; break; }
    const txt = el ? ((el.textContent || '').trim().slice(0, 120) || '[' + (el.id || el.className) + ']') : '(gone)'; if (txt !== lastTxt) { lastTxt = txt; H.loader.push([+performance.now().toFixed(0), txt, H.shaders, H.programsLinked]); } }, 100);
};


// ---------------- in-page probes ----------------
const PROBE_CANVAS = () => { let best = null, ba = 0; for (const c of document.querySelectorAll('canvas')) { const r = c.getBoundingClientRect(); const a = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0)) * Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0)); if (a > ba) { ba = a; best = { id: c.id, x: Math.max(r.left, 0), y: Math.max(r.top, 0), w: Math.min(r.right, innerWidth) - Math.max(r.left, 0), h: Math.min(r.bottom, innerHeight) - Math.max(r.top, 0) }; } } return best; };
// discover renderer / camera / scene from globals (records which global was used)
const PROBE_STATE = () => {
  const H = window.__smoke || {}; const found = {};
  const scan = (pred) => { const direct = ['__R', '__story', '__app', 'app', 'story', 'viewer', '__dbg', '__sim', 'world']; for (const k of direct) { try { const v = window[k]; if (v && pred(v)) return [k, v]; if (v && typeof v === 'object') for (const kk of ['renderer', 'camera', 'scene']) if (v[kk] && pred(v[kk])) return [k + '.' + kk, v[kk]]; } catch (e) {} }
    for (const k of Object.keys(window)) { try { const v = window[k]; if (v && typeof v === 'object' && pred(v)) return [k, v]; } catch (e) {} } return [null, null]; };
  const [rk, R] = scan((v) => v.isWebGLRenderer);
  const [ck, C] = scan((v) => v.isCamera); const [sk, S] = scan((v) => v.isScene);
  const out = { globals: { renderer: rk, camera: ck, scene: sk }, hooks: { shaders: H.shaders, programsLinked: H.programsLinked, draws: H.draws, framesWithDraws: H.raf, firstDrawFrameAt: H.frames && H.frames.length ? H.frames[0][0] : null } };
  out.windowGlobals = Object.keys(window).filter((k) => /^__|^(app|story|scene|renderer|camera|THREE|sim|world)$/i.test(k) && k !== '__smoke').slice(0, 40);
  out.ready = !!window.__ready; out.quality = window.__quality;
  if (R) { const i = R.info; out.renderer = { programs: i.programs ? i.programs.length : null, calls: i.render.calls, triangles: i.render.triangles, frame: i.render.frame, geometries: i.memory.geometries, textures: i.memory.textures }; }
  if (C) { out.camera = { p: C.position.toArray().map((v) => +v.toFixed(3)), q: C.quaternion.toArray().map((v) => +v.toFixed(4)), zoom: C.zoom, fov: C.fov }; }
  return out;
};
// vehicles + workers: __sim arrays (VEH/workers/people...), __ents(), then scene names
const PROBE_MOVERS = () => {
  const out = [], seen = new Set();
  const isW = (s) => /worker|person|people|ped|associate|staff|picker|human|employee|stocker|cashier|crew|operator|walker|char/i.test(s);
  const W = (o) => { o.updateWorldMatrix && o.updateWorldMatrix(true, false); const e = o.matrixWorld.elements; return [+e[12].toFixed(3), +e[13].toFixed(3), +e[14].toFixed(3)]; };
  const objOf = (x) => x && (x.isObject3D ? x : (x.obj || x.o || x.mesh || x.group || x.root || x.object || x.model));
  const add = (id, type, o, src) => { if (!o || !o.isObject3D || seen.has(o)) return; seen.add(o); const t = String(type || ''); out.push({ id: String(id), type: t.slice(0, 40), kind: isW(id + ' ' + t + ' ' + (o.name || '') + ' ' + src) ? 'worker' : 'vehicle', src, p: W(o) }); };
  for (const sk of ['__sim', '__story', '__world', 'sim']) { const sim = window[sk]; if (!sim || typeof sim !== 'object') continue;
    for (const k of Object.keys(sim)) { if (!/veh|fleet|mover|worker|people|ped|crew|agent|actor|staff|associate|bot|truck|forklift|cart|char/i.test(k)) continue; let v; try { v = sim[k]; } catch (e) { continue; }
      if (typeof v === 'function') { try { v = v(); } catch (e) { continue; } } if (!Array.isArray(v)) continue;
      v.slice(0, 80).forEach((e, i) => { const o = objOf(e); if (o) add(k + '[' + i + ']:' + (e.id || e.name || o.name || ''), e.type || e.role || e.kind || k, o, sk + '.' + k); }); } }
  if (typeof window.__ents === 'function') try { for (const e of window.__ents().slice(0, 120)) add(e.id, e.type, objOf(e), '__ents()'); } catch (e) {}
  const R = window.__R; const sc = (R && R.scene) || window.scene;
  if (sc && out.length < 3) sc.traverse((o) => { if (out.length < 80 && /truck|forklift|amr|tug|agv|reach|vehicle|cart|pallet.?jack|worker|person|ped|associate|staff|picker|human/i.test(o.name || '') && !(o.parent && seen.has(o.parent))) add(o.name, 'named', o, 'scene.traverse'); });
  return out;
};
const SIM_CLOCK = () => { const s = window.__sim || window.__story || {}; let t = null; try { t = s.t ?? s.time ?? s.simT ?? window.__simT ?? null; } catch (e) {} return t == null ? null : +(+t).toFixed(3); };
const SIM_STEP = (sec) => { const f = window.__step || (window.__sim && window.__sim.step); if (typeof f !== 'function') return false; f(sec); return true; };
// v3: zoom / explore buttons
const PROBE_BUTTONS = () => {
  const els = [...document.querySelectorAll('button,[role=button],a,[onclick]')];
  const vis = (el) => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const key = (el) => [el.textContent, el.getAttribute('aria-label'), el.title, el.id, el.dataset ? JSON.stringify(el.dataset) : ''].join(' | ').replace(/\s+/g, ' ').trim();
  const pick = (re, tag) => { const m = els.filter((el) => re.test(key(el))); const v = m.filter(vis); const el = v[0] || m[0]; if (!el) return null; el.setAttribute('data-smoke', tag); return { key: key(el).slice(0, 120), visible: vis(el), sel: '[data-smoke="' + tag + '"]' }; };
  return { zoomIn: pick(/zoom[\s_-]*in|^\s*\+\s*(\||$)|\bzoomin\b|data-zoom":"(in|\+|1)"/i, 'zin'), zoomOut: pick(/zoom[\s_-]*out|^\s*[-−–]\s*(\||$)|\bzoomout\b|data-zoom":"(out|-|-1)"/i, 'zout'), explore: pick(/explore/i, 'explore') };
};
// v4: step navigation controls
const PROBE_NAV = () => {
  const els = [...document.querySelectorAll('button,[role=button],a,[onclick],[tabindex]')].filter((el) => !(el.tagName === 'A' && el.getAttribute('href') && !/^(#|javascript:)/i.test(el.getAttribute('href')) && !el.onclick));
  const vis = (el) => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.05; };
  const key = (el) => [(el.textContent || '').trim().length <= 24 ? el.textContent : '', el.getAttribute('aria-label'), el.title, el.id, typeof el.className === 'string' ? el.className : '', el.dataset ? JSON.stringify(el.dataset) : '', (el.innerHTML || '').match(/#[\w-]*(chevron|arrow)[\w-]*/i)?.[0] || ''].join(' | ').replace(/\s+/g, ' ').trim();
  const pick = (re, not, tag) => { const m = els.filter((el) => re.test(key(el)) && !(not && not.test(key(el)))); const v = m.filter(vis); const el = v[0] || m[0]; if (!el) return null; el.setAttribute('data-smoke', tag); return { key: key(el).slice(0, 120), visible: vis(el), sel: '[data-smoke="' + tag + '"]', n: m.length }; };
  const next = pick(/\bnext\b|›|→|»|chevron[-_ ]?(right|down)|arrow[-_ ]?(right|down)|\bforward\b|data-dir":"(next|1|\+1)"/i, /prev/i, 'next');
  const prev = pick(/\bprev(ious)?\b|‹|←|«|chevron[-_ ]?(left|up)|arrow[-_ ]?(left|up)|\bback\b|data-dir":"(prev|-1)"/i, null, 'prev');
  const dots = [...document.querySelectorAll('[class*=dot i],[class*=pip i],[class*=bullet i],[role=tab],[data-step],[class*=step-nav i] > *')].filter((e) => e.tagName !== 'svg' && vis(e));
  dots.forEach((d, i) => d.setAttribute('data-smoke-dot', i));
  return { next, prev, dots: dots.length, dotKeys: dots.slice(0, 3).map((d) => key(d).slice(0, 60)) };
};
// step caption: visible-in-viewport caption/step headings
const PROBE_CAPTION = () => {
  const inView = (el) => { const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.3) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; };
  const sels = ['[id*=caption i]', '[class*=caption i]', '[class*=step i] h1', '[class*=step i] h2', '[class*=step i] h3', '[id*=step i]', '[class*=chapter i]', '[class*=beat i]', '[aria-live]', '[class*=story i] h2', '[class*=story i] h3', 'h1', 'h2', 'h3'];
  const res = []; const seen = new Set();
  for (const s of sels) for (const el of document.querySelectorAll(s)) { if (seen.has(el) || !inView(el)) continue; seen.add(el); const t = (el.innerText || '').trim().replace(/\s+/g, ' '); if (t && t.length < 400) res.push({ sel: s, text: t.slice(0, 140) }); if (res.length >= 8) break; }
  return { sig: res.map((r) => r.text).join(' ¦ '), items: res, scrollY: Math.round(scrollY) };
};

async function runViewport(browser, vp) {
  const r = { viewport: vp.name, profile: PROFILE, url: target, checks: {}, metrics: {}, console: [], pageErrors: [], notes: [] };
  const ctx = await browser.createBrowserContext(); const page = await ctx.newPage();
  const dir = path.join(OUT, vp.name); fs.mkdirSync(dir, { recursive: true });
  let bodyDone = false, aborted = false;
  const since = () => Date.now() - r._nav;
  const ev = (fn, ms, what, ...a) => withTimeout(page.evaluate(fn, ...a), ms, what);
  const snap = async (scale = 0.5, file) => { const c = await ev(PROBE_CANVAS, 6000, 'canvas probe'); if (!c || c.w < 2) return null;
    const buf = await withTimeout(page.screenshot({ type: 'png', clip: { x: c.x, y: c.y, width: c.w, height: c.h, scale } }), 10000, 'screenshot'); if (file) fs.writeFileSync(path.join(dir, file), buf); return decodePNG(buf); };
  try {
    await Promise.race([(async () => {
      if (vp.ua) await page.setUserAgent(vp.ua);
      await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: vp.deviceScaleFactor, isMobile: vp.isMobile, hasTouch: vp.hasTouch });
      await page.evaluateOnNewDocument(HOOK, flag('--spoof-gpu'));
      page.on('console', (m) => { const t = m.type(), loc = m.location() || {}; const e = { t: +(since() / 1000).toFixed(2), type: t, text: m.text().slice(0, 500), url: loc.url };
        if (t === 'error') { if (/favicon/i.test(e.text + ' ' + (e.url || '')) || /ethicalads\.io/i.test(e.url || '')) return; r.console.push(e); } else if ((r._info = r._info || []).length < 60) r._info.push(e); });
      page.on('pageerror', (err) => r.pageErrors.push({ t: +(since() / 1000).toFixed(2), text: String(err && err.stack || err).slice(0, 800) }));
      page.on('requestfailed', (q) => { if (!/favicon|ethicalads/i.test(q.url())) (r.failedRequests = r.failedRequests || []).push(q.url() + ' ' + (q.failure() || {}).errorText); });
      r._nav = Date.now();
      await withTimeout(page.goto(target, { waitUntil: 'domcontentloaded', timeout: 30000 }), 31000, 'goto');
      if (await page.evaluate(() => /One more step|rawgit\.hack/i.test(document.body ? document.body.innerText : '')).catch(() => false)) {
        r.notes.push('githack interstitial: clicked "Open the page"; interstitial console discarded (' + r.console.length + ')'); r.console.length = 0; r.pageErrors.length = 0; r.failedRequests = [];
        const h = await page.evaluateHandle(() => [...document.querySelectorAll('a,button')].find((a) => /open the page/i.test(a.textContent)));
        await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }), h.asElement().click()]); r._nav = Date.now() - (await page.evaluate(() => performance.now())); }
      // ---- TTFF screenshot polling (~250 ms) until loader gone + first non-blank, cap 10 s ----
      let ttffShot = null, pollErr = null;
      while (since() < 10000) {
        try { const img = await snap(0.25); if (img && !imgStats(img).blank && ttffShot == null) ttffShot = since(); } catch (e) { pollErr = e.message; }
        if (ttffShot != null && since() > G.loaderMs + 500) { const tl = await ev(() => { const L = window.__smoke.loader; return L.length ? L[L.length - 1][1] : '(gone)'; }, 5000, 'tl').catch(() => null); if (tl === '(gone)') break; }
        await sleep(Math.max(0, 250 - (since() % 250))); }
      r.metrics.ttffScreenshotNonBlankMs = ttffShot; if (pollErr) r.notes.push('poll: ' + pollErr);
      const st0 = await ev(PROBE_STATE, 12000, 'state').catch((e) => ({ err: e.message })); r.state0 = st0;
      await withTimeout(page.screenshot({ path: path.join(dir, 'loaded.png') }), 15000, 'shot').catch((e) => r.notes.push('loaded shot: ' + e.message));
      // ---- frame rendered & changing ----
      const a = await snap(0.5, 'canvas_a.png').catch((e) => (r.notes.push('snap a: ' + e.message), null)); await sleep(1000);
      const b = await snap(0.5, 'canvas_b.png').catch((e) => (r.notes.push('snap b: ' + e.message), null));
      const sa = a && imgStats(a), dab = imgDiff(a, b);
      r.checks.frame = { pass: !!(a && b && !sa.blank && !imgStats(b).blank && dab.changedFrac > 0.0002), detail: a && b ? `stats ${JSON.stringify(sa)}; 1 s diff ${JSON.stringify(dab)}` : 'canvas capture failed/timed out: ' + r.notes.filter((n) => /^snap/.test(n)).join('; ') };
      // ---- movers (vehicles + workers), sim-clock aware ----
      const m1 = await ev(PROBE_MOVERS, 10000, 'movers').catch(() => []); const t1 = await ev(SIM_CLOCK, 8000, 'clk').catch(() => null); const w1 = since();
      await sleep(2000);
      const m2 = await ev(PROBE_MOVERS, 10000, 'movers').catch(() => []); const t2 = await ev(SIM_CLOCK, 8000, 'clk').catch(() => null); const w2 = since();
      const cmp = (A, B) => A.map((x) => { const y = B.find((z) => z.id === x.id && z.src === x.src); return { id: x.id, kind: x.kind, d: y ? +Math.hypot(y.p[0] - x.p[0], y.p[1] - x.p[1], y.p[2] - x.p[2]).toFixed(3) : null }; });
      const tally = (mv) => ({ vehicles: `${mv.filter((m) => m.kind === 'vehicle' && m.d > 0.05).length}/${mv.filter((m) => m.kind === 'vehicle').length}`, workers: `${mv.filter((m) => m.kind === 'worker' && m.d > 0.05).length}/${mv.filter((m) => m.kind === 'worker').length}`, any: mv.some((m) => m.d > 0.05) });
      if (m1.length) {
        const mv = cmp(m1, m2), T = tally(mv); const rate = t1 != null && t2 != null ? +((t2 - t1) / ((w2 - w1) / 1000)).toFixed(3) : null; r.metrics.simSecondsPerWallSecond = rate;
        const mc = r.checks.movers = { pass: T.any, sources: [...new Set(m1.map((m) => m.src))], wall: { ...T, simT: [t1, t2], rate }, sample: mv.slice(0, 10) };
        if (!T.any && (t1 == null || t2 - t1 < 1)) {
          const s0 = await ev(SIM_CLOCK, 8000, 'clk').catch(() => null); const p0 = await ev(PROBE_MOVERS, 10000, 'movers').catch(() => []);
          const stepped = await ev(SIM_STEP, 25000, 'step', 5).catch((e) => (r.notes.push('step: ' + e.message), null));
          const s1 = await ev(SIM_CLOCK, 8000, 'clk').catch(() => null); const p1 = await ev(PROBE_MOVERS, 10000, 'movers').catch(() => []);
          if (stepped && p0.length && p1.length) { const T2 = tally(cmp(p0, p1)); mc.sim = { simT: [s0, s1], ...T2 }; mc.pass = T2.any; }
          else if (!stepped) { const d3 = await sleep(6000).then(() => ev(PROBE_MOVERS, 10000, 'movers')).catch(() => []); const T3 = tally(cmp(m2, d3)); mc.long = T3; mc.pass = T3.any; } }
        mc.detail = `2 s wall: vehicles ${T.vehicles}, workers ${T.workers} moved; sim ${t1}->${t2} (${rate} sim-s/wall-s)` + (mc.sim ? `; after __step(5) sim ${mc.sim.simT[0]}->${mc.sim.simT[1]}: vehicles ${mc.sim.vehicles}, workers ${mc.sim.workers}` : '') + (mc.long ? `; +6 s wall: vehicles ${mc.long.vehicles}, workers ${mc.long.workers}` : '');
        if (mc.sim && (mc.sim.simT[0] == null)) mc.detail += ' [sim fallback inconclusive: page unresponsive]';
      } else { await sleep(2000); const c2 = await snap(0.5).catch(() => null); const d = imgDiff(b, c2); r.checks.movers = { pass: !!(b && c2) && d.changedFrac > 0.0005, sources: ['screenshot diff fallback (no vehicle/worker globals)'], detail: JSON.stringify(d) }; }
      // ---- navigation (v4) / zoom-explore (v3) ----
      const camOf = () => ev(PROBE_STATE, 10000, 'cam').then((s) => s.camera).catch(() => null);
      const camDelta = (c0, c1) => c0 && c1 ? +(Math.hypot(...c0.p.map((v, i) => v - c1.p[i])) + Math.abs((c0.zoom || 1) - (c1.zoom || 1)) + 10 * Math.hypot(...c0.q.map((v, i) => v - c1.q[i]))).toFixed(3) : null;
      const tryInput = async (name, act) => {
        if (aborted) throw new Error('aborted (hard timeout)');
        const k0 = await ev(PROBE_CAPTION, 8000, 'cap').catch(() => null), c0 = await camOf(), i0 = await snap(0.25, `nav_${name}_before.png`).catch(() => null);
        let err = null; try { await act(); } catch (e) { err = e.message; }
        let k1 = k0; const tEnd = Date.now() + 4000; while (Date.now() < tEnd) { await sleep(400); k1 = await ev(PROBE_CAPTION, 8000, 'cap').catch(() => k1); if (k0 && k1 && k1.sig !== k0.sig) break; }
        await sleep(800); const c1 = await camOf(), i1 = await snap(0.25, `nav_${name}_after.png`).catch(() => null);
        const cd = camDelta(c0, c1), id = imgDiff(i0, i1); const capChanged = !!(k0 && k1 && k1.sig !== k0.sig); const camMoved = cd != null ? cd > 0.05 : id.changedFrac > 0.05;
        return { input: name, ok: capChanged && camMoved && !err, captionChanged: capChanged, cameraMoved: camMoved, camDelta: cd, imgDiff: id.changedFrac, captionBefore: k0 && k0.sig.slice(0, 160), captionAfter: k1 && k1.sig.slice(0, 160), scrollY: [k0 && k0.scrollY, k1 && k1.scrollY], err };
      };
      if (PROFILE === 'v3') {
        const btns = await ev(PROBE_BUTTONS, 10000, 'buttons'); const res = [];
        for (const k of ['zoomIn', 'zoomOut', 'explore']) { if (!btns[k]) { res.push({ input: k, ok: false, err: 'NOT FOUND' }); continue; }
          const c0 = await camOf(); await page.click(btns[k].sel).catch(() => {}); await sleep(1500); const cd = camDelta(c0, await camOf()); res.push({ input: k, ok: cd != null && cd > 0.05, camDelta: cd }); }
        r.checks.buttons = { pass: res.every((x) => x.ok), found: btns, inputs: res, detail: res.map((x) => `${x.input}:${x.ok ? 'ok' : 'FAIL'}${x.err ? ' ' + x.err : ''} cam=${x.camDelta}`).join('; ') };
      } else {
        const nav = await ev(PROBE_NAV, 10000, 'nav').catch((e) => ({ err: e.message })); const res = []; r.navControls = nav;
        const center = { x: vp.width / 2, y: vp.height / 2 };
        if (nav.next) res.push(await tryInput('next', () => page.click(nav.next.sel))); else res.push({ input: 'next', ok: false, err: 'next control NOT FOUND' });
        if (nav.prev) res.push(await tryInput('prev', () => page.click(nav.prev.sel))); else res.push({ input: 'prev', ok: false, err: 'prev control NOT FOUND' });
        if (nav.dots >= 2) res.push(await tryInput('dot', () => page.click('[data-smoke-dot="' + Math.min(2, nav.dots - 1) + '"]')));
        // wheel/touch: try forward first; if nothing changed (e.g. already at the last step) try backward
        const both = async (name, mk) => { let x = await tryInput(name + '(fwd)', mk(1)); if (!x.ok && !x.err) { const y = await tryInput(name + '(back)', mk(-1)); if (y.ok) x = y; else x.alsoTriedBack = y; } x.input = name + (x.input.endsWith('(back)') ? '(back)' : ''); x.method = name; return x; };
        res.push(await both('wheel', (dir) => async () => { await page.mouse.move(center.x, center.y); for (let i = 0; i < 3; i++) { await page.mouse.wheel({ deltaY: 400 * dir }); await sleep(120); } }));
        if (vp.hasTouch) {
          const cdp = await page.createCDPSession();
          res.push(await both('touch-swipe', (dir) => async () => { const x = center.x, y0 = vp.height * (dir > 0 ? 0.8 : 0.2), y1 = vp.height * (dir > 0 ? 0.2 : 0.8);
            await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0 }] });
            for (let i = 1; i <= 8; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y0 + (y1 - y0) * i / 8 }] }); await sleep(16); }
            await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }));
          res.push(await both('scrollBy', (dir) => () => page.evaluate((d) => window.scrollBy(0, d * innerHeight), dir)));
        }
        const by = Object.fromEntries(res.map((x) => [x.method || x.input, x.ok]));
        const required = ['next', 'prev', vp.hasTouch ? 'touch-swipe' : 'wheel'];
        r.checks.nav = { pass: required.every((k) => by[k]), required, controls: nav, inputs: res,
          detail: res.map((x) => `${x.input}:${x.ok ? 'ok' : 'FAIL'}${x.err ? ' (' + x.err + ')' : ''} caption ${x.captionChanged ? 'changed' : 'same'}, cam ${x.camDelta ?? 'n/a'}${x.camDelta == null ? ' img ' + x.imgDiff : ''}`).join('; ') };
      }
      // ---- fps / draws window ----
      const fpsProbe = () => ({ raf: window.__smoke.raf, draws: window.__smoke.draws, t: performance.now() });
      const f0 = await ev(fpsProbe, 10000, 'fps0'); const winMs = Math.max(2000, Math.min(10000, HARD_TIMEOUT - 12000 - since())); await sleep(winMs);
      const f1 = await ev(fpsProbe, 12000, 'fps1'); const secs = (f1.t - f0.t) / 1000, nf = f1.raf - f0.raf;
      r.metrics.fpsWindowS = +secs.toFixed(1); r.metrics.avgFps = +(nf / secs).toFixed(2); r.metrics.drawsPerFrameHookWindow = nf ? +((f1.draws - f0.draws) / nf).toFixed(1) : null;
      await withTimeout(page.screenshot({ path: path.join(dir, 'end.png') }), 10000, 'end').catch(() => {});
      bodyDone = true;
    })(), (async () => { while (!r._nav || since() < HARD_TIMEOUT) { if (bodyDone) return; await sleep(250); } throw new Error('viewport hard timeout ' + HARD_TIMEOUT + 'ms (page hang / main thread blocked)'); })()]);
  } catch (e) { r.fatal = e.message; r.notes.push('FATAL: ' + e.message); }
  bodyDone = true; aborted = true; const checksAtAbort = new Set(Object.keys(r.checks));
  // ---- final dump + gates (from in-page data) ----
  try {
    const d = await ev(() => { const H = window.__smoke; return { shaders: H.shaders, programsLinked: H.programsLinked, draws: H.draws, framesWithDraws: H.raf, frames: H.frames.slice(-300), firstFrame: H.frames.length ? H.frames[0][0] : null, loader: H.loader, longTasks: H.longTasks, now: +performance.now().toFixed(0) }; }, 15000, 'final dump');
    const st = await ev(PROBE_STATE, 10000, 'state').catch(() => ({})); r.stateEnd = st;
    const m = r.metrics; m.ttffMs = d.firstFrame; m.shaders = d.shaders; m.programsHook = d.programsLinked; m.programsPage = st.renderer ? st.renderer.programs : null; m.drawsPerFramePage = st.renderer ? st.renderer.calls : null;
    const fr = d.frames.slice(1); m.drawsPerFrameHook = fr.length ? +(fr.reduce((s, f) => s + f[1], 0) / fr.length).toFixed(1) : (d.frames[0] ? d.frames[0][1] : null);
    if (m.avgFps == null && d.frames.length > 2) m.avgFps = +((d.frames.length - 1) / ((d.frames[d.frames.length - 1][0] - d.frames[0][0]) / 1000)).toFixed(2);
    const lt = [...d.longTasks].sort((x, y) => y[1] - x[1]); m.longestTaskMs = lt.length ? lt[0][1] : 0; m.top3LongTasks = lt.slice(0, 3).map(([at, dur]) => `${dur}ms @${at}ms`); m.longTaskCount = lt.length;
    m.loaderTimeline = d.loader; const si = d.loader.findIndex((x) => x[1] !== '(gone)'); const g = si >= 0 ? d.loader.slice(si).find((x) => x[1] === '(gone)') : null; m.loaderGoneMs = g ? g[0] : null; m.loaderSeen = si >= 0;
    m.globals = st.globals; m.windowGlobals = st.windowGlobals; m.quality = st.quality;
    r.checks.loader = si < 0 ? { pass: true, detail: 'no loader element ever seen (noted)' } : { pass: !!g && g[0] <= G.loaderMs, detail: g ? `loader gone at ${g[0]} ms (limit ${G.loaderMs}); last text "${d.loader[si][1]}"` : `loader still showing "${d.loader[d.loader.length - 1][1]}" at ${d.now} ms` };
    const progs = m.programsPage != null ? m.programsPage : m.programsHook;
    r.checks.programs = { pass: progs <= G.maxPrograms, detail: `renderer.info.programs=${m.programsPage ?? 'n/a'}, GL hook linkProgram=${m.programsHook}, shaders=${m.shaders} (limit <${G.maxPrograms + 1})` };
    if (G.maxDraws != null) r.checks.draws = { pass: m.drawsPerFrameHook != null && m.drawsPerFrameHook <= G.maxDraws, detail: `GL hook ${m.drawsPerFrameHook}/frame (window avg ${m.drawsPerFrameHookWindow ?? 'n/a'}), page renderer.info.render.calls ${m.drawsPerFramePage ?? 'n/a'} (limit <${G.maxDraws + 1})` };
    if (G.maxLongTask != null) r.checks.longtask = { pass: m.longestTaskMs <= G.maxLongTask, detail: `longest ${m.longestTaskMs} ms (limit <${G.maxLongTask + 1}); top3 ${m.top3LongTasks.join(', ')}; ${m.longTaskCount} long tasks` };
  } catch (e) { r.notes.push('final dump failed: ' + e.message); }
  r.checks.console = { pass: r.console.length === 0 && r.pageErrors.length === 0, detail: `${r.console.length} console.error, ${r.pageErrors.length} pageerror` };
  for (const k of G.checks) if (!r.checks[k] || (r.fatal && !checksAtAbort.has(k) && !['loader','programs','draws','longtask','console'].includes(k))) r.checks[k] = { pass: false, detail: 'not reached / unverifiable (' + (r.fatal || 'aborted') + ')' + (k === 'nav' && r.navControls ? '; controls found: ' + JSON.stringify(r.navControls).slice(0, 300) : '') };
  r.checks = Object.freeze(JSON.parse(JSON.stringify(r.checks)));
  r.infoLog = r._info; delete r._info; delete r._nav;
  r.pass = G.checks.every((k) => r.checks[k].pass);
  fs.writeFileSync(path.join(dir, 'result.json'), JSON.stringify(r, null, 2));
  ctx.close().catch(() => {});
  return r;
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', headless: 'new',
    args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-dev-shm-usage', '--no-first-run'] });
  const results = [];
  for (const vp of VIEWPORTS) {
    let killed = false; let res = await Promise.race([runViewport(browser, vp), sleep(HARD_TIMEOUT + 60000).then(() => (killed = true, null))]);
    if (killed) { res = { viewport: vp.name, pass: false, fatal: 'outer hard timeout (harness could not even read page state)', checks: Object.fromEntries(G.checks.map((k) => [k, { pass: false, detail: 'hang' }])), metrics: {}, console: [], pageErrors: [] };
      fs.mkdirSync(path.join(OUT, vp.name), { recursive: true }); fs.writeFileSync(path.join(OUT, vp.name, 'result_hang.json'), JSON.stringify(res, null, 2)); }
    results.push(res);
  }
  await browser.close().catch(() => {});
  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(results.map((r) => ({ viewport: r.viewport, pass: r.pass, checks: Object.fromEntries(Object.entries(r.checks).map(([k, v]) => [k, v.pass])), metrics: r.metrics })), null, 2));
  console.log(`\nPROFILE ${PROFILE}  URL ${target}\nOUT ${OUT}\n`);
  console.log('viewport | ' + G.checks.join(' | ') + ' | RESULT');
  for (const r of results) console.log(r.viewport.padEnd(8) + ' | ' + G.checks.map((k) => (r.checks[k].pass ? 'PASS' : 'FAIL').padEnd(k.length)).join(' | ') + ' | ' + (r.pass ? 'PASS' : 'FAIL'));
  for (const r of results) { const m = r.metrics || {};
    console.log(`\n[${r.viewport}] TTFF=${m.ttffMs}ms loaderGone=${m.loaderGoneMs}ms fps=${m.avgFps} draws/frame hook=${m.drawsPerFrameHook} page=${m.drawsPerFramePage} programs page=${m.programsPage} hook=${m.programsHook} shaders=${m.shaders} longest=${m.longestTaskMs}ms top3=[${(m.top3LongTasks || []).join(', ')}] quality=${m.quality} globals=${JSON.stringify(m.globals)}`);
    for (const k of G.checks) console.log(`  ${k}: ${r.checks[k].pass ? 'PASS' : 'FAIL'} - ${String(r.checks[k].detail || '').slice(0, 400)}`);
    for (const e of [...(r.console || []), ...(r.pageErrors || [])].slice(0, 5)) console.log('  ERR: ' + e.text.slice(0, 300));
    if (r.fatal) console.log('  FATAL: ' + r.fatal); }
  process.exit(results.every((r) => r.pass) ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(3); });
