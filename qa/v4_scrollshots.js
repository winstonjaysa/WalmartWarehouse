// usage: node qa/v4_scrollshots.js file outprefix [steps csv] ; real scroll (no instant cut), desktop + phone
const puppeteer = require(__dirname + '/tools/node_modules/puppeteer-core'); const path = require('path');
(async () => {
  const file = path.resolve(process.argv[2]); const pre = process.argv[3]; const only = process.argv[4];
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errs = [];
  for (const [vw, vh, mob, tag] of [[1280, 800, false, 'd'], [390, 844, true, 'p']]) {
    const p = await b.newPage(); p.on('pageerror', (e) => errs.push(tag + ' ' + e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(tag + ' console ' + m.text()); });
    await p.setViewport({ width: vw, height: vh, deviceScaleFactor: 1, isMobile: mob, hasTouch: mob });
    await p.goto('file://' + file, { waitUntil: 'load' }); await p.waitForFunction('window.__ready', { timeout: 30000 });
    const n = await p.evaluate(() => document.querySelectorAll('.step').length);
    for (let i = 1; i < n; i++) { if (only && !only.split(',').includes(String(i))) continue;
      await p.evaluate((i) => { document.querySelectorAll('.step')[i].scrollIntoView({ block: 'center' }); }, i);
      await new Promise((r) => setTimeout(r, 2600));
      const cam = await p.evaluate(() => window.__sim.camera.position.toArray().map((v) => +v.toFixed(1)));
      console.log(tag, i, JSON.stringify(cam));
      await p.screenshot({ path: `${pre}${tag}_${String(i).padStart(2, '0')}.png` }); }
    await p.close();
  }
  console.log('errors:', errs.length ? errs.join('\n') : 'none'); await b.close();
})();
