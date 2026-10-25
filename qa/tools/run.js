const puppeteer = require('puppeteer-core');
const fs = require('fs'); const path = require('path');
const URL = process.argv[2]; const OUT = process.argv[3] || '/workspace/gateflow/qa/shots';
fs.mkdirSync(OUT, {recursive:true}); fs.mkdirSync(path.join(OUT,'..','frames'),{recursive:true});
const sleep = ms => new Promise(r=>setTimeout(r,ms));
const log = [];
(async () => {
  const browser = await puppeteer.launch({executablePath:'/usr/bin/google-chrome', headless:'new',
    args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--window-size=1440,900']});
  const page = await browser.newPage();
  await page.setViewport({width:1440,height:900});
  page.on('console', m => { if (['error','warning','warn'].includes(m.type())) log.push(`[console.${m.type()}] ${m.text()}`); });
  page.on('pageerror', e => log.push(`[pageerror] ${e.message}`));
  page.on('requestfailed', r => log.push(`[requestfailed] ${r.url()} ${r.failure()&&r.failure().errorText}`));
  page.on('response', r => { if (r.status()>=400) log.push(`[http ${r.status()}] ${r.url()}`); });
  const t0=Date.now();
  await page.goto(URL, {waitUntil:'load', timeout:60000});
  await sleep(300); await page.screenshot({path:`${OUT}/01_initial.png`});
  await sleep(6000); await page.screenshot({path:`${OUT}/02_settled.png`});
  log.push(`[info] load+settle ${Date.now()-t0}ms`);
  const gl = await page.evaluate(()=>{const c=document.querySelector('canvas'); if(!c) return 'no canvas'; const g=c.getContext('webgl2')||c.getContext('webgl'); if(!g) return 'canvas ctx busy/none (likely in use)'; const e=g.getExtension('WEBGL_debug_renderer_info'); return e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):'webgl ok';});
  log.push(`[info] GL: ${gl}`);
  // fps
  const fps = await page.evaluate(()=>new Promise(res=>{let n=0;const s=performance.now();const dts=[];let last=s;function f(t){n++;dts.push(t-last);last=t;if(t-s<5000)requestAnimationFrame(f);else{dts.sort((a,b)=>a-b);res({fps:n/((t-s)/1000),p50:dts[dts.length>>1],p95:dts[Math.floor(dts.length*.95)]});}}requestAnimationFrame(f);}));
  log.push(`[info] FPS ${JSON.stringify(fps)}`);
  // sequence 30 x 100ms
  for (let i=0;i<30;i++){ await page.screenshot({path:`${OUT}/../frames/seq_${String(i).padStart(2,'0')}.png`}); await sleep(100); }
  // UI inventory
  const ui = await page.evaluate(()=>[...document.querySelectorAll('button,[role=button],select,input,[data-mode],[data-floor],[data-view]')].filter(e=>e.offsetParent!==null||e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return {tag:e.tagName,id:e.id,cls:e.className&&String(e.className).slice(0,60),text:(e.innerText||e.value||e.title||e.getAttribute('aria-label')||'').trim().slice(0,40),x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}}));
  fs.writeFileSync(`${OUT}/ui_inventory.json`, JSON.stringify(ui,null,1));
  fs.writeFileSync(`${OUT}/console.log`, log.join('\n'));
  console.log(log.join('\n')); console.log('UI elements:', ui.length);
  await browser.close();
})().catch(e=>{console.error('FATAL',e); fs.writeFileSync(`${OUT}/console.log`, log.join('\n')+'\nFATAL '+e); process.exit(1);});
