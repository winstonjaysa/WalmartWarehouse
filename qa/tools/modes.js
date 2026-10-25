// usage: node modes.js URL OUTDIR
const puppeteer = require('puppeteer-core'); const fs=require('fs');
const URL=process.argv[2], OUT=process.argv[3]; fs.mkdirSync(OUT,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); const log=[];
async function clickText(page, re){
  return page.evaluate((src)=>{const re=new RegExp(src,'i');
    const els=[...document.querySelectorAll('button,[role=button],[role=tab],a,label,li,div,span')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&r.width<400&&r.height<120;});
    const cand=els.filter(e=>re.test((e.innerText||'').trim())||re.test(e.title||'')||re.test(e.getAttribute('aria-label')||'')||re.test(e.dataset?JSON.stringify(e.dataset):''));
    cand.sort((a,b)=>(a.innerText||'').length-(b.innerText||'').length);
    const e=cand[0]; if(!e) return null; e.click(); const r=e.getBoundingClientRect(); return {text:(e.innerText||e.title||e.getAttribute('aria-label')||'').trim().slice(0,40), tag:e.tagName, x:r.x, y:r.y};},re.source);
}
(async()=>{
  const browser=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const page=await browser.newPage(); await page.setViewport({width:1440,height:900});
  page.on('console',m=>{if(['error','warning','warn'].includes(m.type()))log.push(`[console.${m.type()}] ${m.text()}`)});
  page.on('pageerror',e=>log.push(`[pageerror] ${e.message}`));
  page.on('requestfailed',r=>log.push(`[requestfailed] ${r.url()}`));
  await page.goto(URL,{waitUntil:'load',timeout:90000}); await sleep(8000);
  const steps=JSON.parse(process.env.STEPS||'[]');
  for(const [name,re,wait] of steps){
    let res;
    if(name.startsWith('key:')){ await page.keyboard.press(re); res={key:re}; }
    else if(name.startsWith('canvas:')){ const [x,y]=re.split(',').map(Number); await page.mouse.move(x,y); await sleep(300); await page.mouse.click(x,y); res={x,y}; }
    else if(name.startsWith('hover:')){ const [x,y]=re.split(',').map(Number); await page.mouse.move(x,y); res={hover:[x,y]}; }
    else res=await clickText(page,new RegExp(re,'i'));
    log.push(`[step] ${name} -> ${JSON.stringify(res)}`);
    const w=wait||2000;
    if(process.env.MID && !name.startsWith('hover')){ await sleep(Math.round(w*0.2)); await page.screenshot({path:`${OUT}/${name.replace(/[^\w-]/g,'_')}_mid.png`}); await sleep(Math.round(w*0.8)); }
    else await sleep(w);
    await page.screenshot({path:`${OUT}/${name.replace(/[^\w-]/g,'_')}.png`});
  }
  if(process.env.SEQ){ const [n,dt]=process.env.SEQ.split(',').map(Number); for(let i=0;i<n;i++){await page.screenshot({path:`${OUT}/seq_${String(i).padStart(3,'0')}.png`}); await sleep(dt);} }
  fs.writeFileSync(`${OUT}/log.txt`,log.join('\n')); console.log(log.join('\n')); await browser.close();
})().catch(e=>{console.error('FATAL',e);fs.writeFileSync(`${OUT}/log.txt`,log.join('\n')+'\nFATAL '+e);process.exit(1)});
