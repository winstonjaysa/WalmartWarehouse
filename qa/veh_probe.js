// Vehicle-motion investigation: sample __sim.t, VEH positions/state over ~20 s wall after load.  node qa/veh_probe.js <url|file> [--q low|high]
const path = require('path'); const puppeteer = require(path.join(__dirname, 'tools/node_modules/puppeteer-core'));
let url = process.argv[2]; if (!/^[a-z]+:\/\//.test(url)) url = 'file://' + path.resolve(url); const qi = process.argv.indexOf('--q'); if (qi > 0) url += '?q=' + process.argv[qi + 1];
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage(); await p.setViewport({ width: 1440, height: 900 });
  await p.evaluateOnNewDocument(() => { window.__rafN = 0; const r = requestAnimationFrame.bind(window); window.requestAnimationFrame = (cb) => r((t) => { window.__rafN++; cb(t); }); });
  await p.goto(url, { waitUntil: 'domcontentloaded' }); const t0 = Date.now();
  await p.waitForFunction(() => window.__ready, { timeout: 60000, polling: 500 });
  const S = () => p.evaluate(() => ({ simT: +window.__sim.t.toFixed(3), raf: window.__rafN, onScreen: typeof __onScreen === 'undefined' ? 'n/a' : 'x', veh: window.__sim.VEH.map((v) => ({ id: v.id, type: v.type, state: v.state, task: v.task, ds: v.ds, x: +v.obj.position.x.toFixed(3), z: +v.obj.position.z.toFixed(3), vx: v.x, vz: v.z })) }));
  const out = []; for (let i = 0; i < 5; i++) { out.push({ wall: (Date.now() - t0) / 1000, ...(await S()) }); await new Promise((r) => setTimeout(r, 5000)); }
  const a = out[0], z = out[out.length - 1];
  console.log('readyAt(s)=', a.wall, ' samples (wall s, sim s, rAF):', out.map((o) => [o.wall, o.simT, o.raf]));
  const mv = a.veh.map((v, i) => ({ id: v.id, type: v.type, state0: v.state, state1: z.veh[i].state, task: v.task, d: +Math.hypot(z.veh[i].x - v.x, z.veh[i].z - v.z).toFixed(3) }));
  console.log('moved over window:', mv.filter((m) => m.d > 0.05).length, '/', mv.length); console.log(JSON.stringify(mv));
  // deterministic sim advance
  const s0 = await S(); await p.evaluate(() => window.__step(10)); const s1 = await S();
  console.log('__step(10): sim', s0.simT, '->', s1.simT, ' moved:', s0.veh.filter((v, i) => Math.hypot(s1.veh[i].x - v.x, s1.veh[i].z - v.z) > 0.05).length, '/', s0.veh.length,
    ' states:', JSON.stringify([...new Set(s1.veh.map((v) => v.state))]));
  require('fs').writeFileSync(path.join(__dirname, 'smoke_out', 'veh_probe_' + Date.now() + '.json'), JSON.stringify({ url, out, s0, s1 }, null, 1));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
