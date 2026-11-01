// usage: node qa/v4_phoneshots.js file outprefix steps_csv [simSec] ; phone 390x844 stills, instant cut to each step
const puppeteer = require(__dirname + '/tools/node_modules/puppeteer-core'); const path = require('path');
(async () => {
  const file = path.resolve(process.argv[2]); const pre = process.argv[3]; const only = process.argv[4].split(',').map(Number); const sim = +(process.argv[5] || 6);
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await p.goto('file://' + file, { waitUntil: 'load' }); await p.waitForFunction('window.__ready', { timeout: 60000 });
  for (const i of only) {
    await p.evaluate((i, sim) => { document.querySelectorAll('.step')[i].scrollIntoView({ block: 'center' }); window.__goStep(i, true); window.__step(sim); }, i, sim);
    await new Promise((r) => setTimeout(r, 2500));
    const id = await p.evaluate((i) => document.querySelectorAll('.step')[i].dataset.cam, i);
    const cam = await p.evaluate(() => window.__sim.camera.position.toArray().map((v) => +v.toFixed(1)));
    console.log(i, id, JSON.stringify(cam));
    await p.screenshot({ path: `${pre}p_${String(i).padStart(2, '0')}_${id}.png` });
  }
  console.log('errors:', errs.length ? errs.join('\n') : 'none'); await b.close();
})();
