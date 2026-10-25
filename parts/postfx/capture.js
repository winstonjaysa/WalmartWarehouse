// node parts/postfx/capture.js  -> before.png / after*.png + samples.json (run from /workspace/gateflow with http.server on :8977)
const puppeteer = require('/workspace/gateflow/qa/tools/node_modules/puppeteer-core'); const fs = require('fs');
const OUT = '/workspace/gateflow/parts/postfx/';
const RUNS = [['before', 'mode=before'], ['after', 'mode=after&q=high'], ['after_med', 'mode=after&q=med'], ['after_low', 'mode=after&q=low'], ['after_auto', 'mode=after']];
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const res = {};
  for (const [tag, qs] of RUNS) {
    const p = await b.newPage(); const log = [];
    p.on('console', m => log.push(m.type() + ' ' + m.text())); p.on('pageerror', e => log.push('pageerror ' + e.message));
    await p.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
    p.goto('http://127.0.0.1:8977/parts/postfx/test.html?' + qs, { waitUntil: 'load', timeout: 0 }).catch(() => {});
    try { await p.waitForFunction('window.__ready', { timeout: 400000, polling: 2000 }); } catch (e) { log.push('TIMEOUT'); }
    const info = await p.evaluate(() => window.__info);
    await p.screenshot({ path: OUT + tag + '.png' });
    res[tag] = { info, log: log.filter(l => !/GPU stall|Automatic fallback/.test(l)).slice(0, 15) }; console.log(tag, JSON.stringify(res[tag]));
    await p.close();
  }
  fs.writeFileSync(OUT + 'runs.json', JSON.stringify(res, null, 1)); await b.close();
})().catch(e => { console.error(e); process.exit(1); });
