// usage: node qa/v4_shots.js file [outprefix] [steps csv] ; captures eye-level stills per step
const puppeteer = require(__dirname + '/tools/node_modules/puppeteer-core'); const path = require('path');
(async () => {
  const file = path.resolve(process.argv[2]); const pre = process.argv[3] || 'preview/v4_'; const only = process.argv[4];
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-dev-shm-usage'] });
  const errs = [];
  for (const [vw, vh, mob, tag] of [[1280, 800, false, 'desktop'], [390, 844, true, 'phone']]) {
    const p = await b.newPage(); p.on('pageerror', (e) => errs.push(tag + ' ' + e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(tag + ' console ' + m.text()); });
    await p.setViewport({ width: vw, height: vh, deviceScaleFactor: 1, isMobile: mob, hasTouch: mob });
    await p.goto('file://' + file, { waitUntil: 'load' }); await p.waitForFunction('window.__ready', { timeout: 30000 }).catch(() => errs.push(tag + ' not ready'));
    await p.evaluate(() => window.__step && window.__step(40));
    await new Promise((r) => setTimeout(r, 1500));
    await p.screenshot({ path: pre + tag + '.png' });
    const info = await p.evaluate(() => { const r = window.__sim && window.__sim.renderer; return r ? { calls: r.info.render.calls, prog: r.info.programs.length, tris: r.info.render.triangles } : null; });
    console.log(tag, JSON.stringify(info));
    if (tag === 'desktop') {
      const n = await p.evaluate(() => document.querySelectorAll('.step').length);
      for (let i = 1; i < n; i++) { if (only && !only.split(',').includes(String(i))) continue;
        await p.evaluate((i) => { document.querySelectorAll('.step')[i].scrollIntoView({ block: 'center' }); window.__goStep(i, true); window.__step(i === 8 ? 25 : 6); }, i);
        await new Promise((r) => setTimeout(r, 900)); const id = await p.evaluate((i) => document.querySelectorAll('.step')[i].dataset.cam, i);
        await p.screenshot({ path: `${pre}${String(i).padStart(2, '0')}_${id}.png` }); }
    }
    await p.close();
  }
  console.log('errors:', errs.length ? errs.join('\n') : 'none'); await b.close();
})();
