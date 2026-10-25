// Deterministic virtual-time capture.  node cap60.js URL OUTDIR [fps=60] [warmFrames=480] [nFrames=240] [w=1440] [h=900] [dpr=1]
// env STEPS_BEFORE='[["click","regex"],...]' optional UI clicks before warm-up
const puppeteer=require('puppeteer-core'); const fs=require('fs');
const [URL,OUT,FPS='60',WARM='480',N='240',W='1440',H='900',DPR='1']=process.argv.slice(2);
fs.mkdirSync(OUT,{recursive:true}); const log=[];
const shim=`(()=>{const DT=1000/${FPS};let vt=0;const t0=Date.now();
 let seed=1234567;Math.random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return ((seed>>>0)%1e9)/1e9;};
 const rq=new Map();let rid=1;window.requestAnimationFrame=cb=>{rq.set(rid,cb);return rid++;};window.cancelAnimationFrame=id=>rq.delete(id);
 performance.now=()=>vt; const RD=Date; const D=function(...a){return a.length?new RD(...a):new RD(t0+vt)}; D.now=()=>t0+vt; D.prototype=RD.prototype; D.UTC=RD.UTC; D.parse=RD.parse; window.Date=D;
 const tq=[];let tid=1e6;const rST=window.setTimeout.bind(window);
 window.setTimeout=(f,ms=0,...a)=>{const id=tid++;tq.push({id,at:vt+(+ms||0),f,a});return id;};
 window.setInterval=(f,ms=0,...a)=>{const id=tid++;const rep={id,at:vt+Math.max(+ms||0,1),f,a,iv:Math.max(+ms||0,1)};tq.push(rep);return id;};
 window.clearTimeout=window.clearInterval=id=>{const i=tq.findIndex(t=>t.id===id);if(i>=0)tq.splice(i,1);};
 window.__realSetTimeout=rST;
 window.__vstep=(n=1)=>{let calls=0;for(let k=0;k<n;k++){vt+=DT;
   tq.sort((a,b)=>a.at-b.at);while(tq.length&&tq[0].at<=vt){const t=tq.shift();if(t.iv){t.at+=t.iv;tq.push(t);}try{typeof t.f==='function'?t.f(...t.a):0}catch(e){console.error('timer',e)} }
   const cbs=[...rq.values()];rq.clear();for(const cb of cbs){try{cb(vt);calls++}catch(e){console.error('raf',e&&e.stack||e)}}}
   return {vt,calls,pending:rq.size};};
})();`;
(async()=>{
 const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage(); await p.setViewport({width:+W,height:+H,deviceScaleFactor:+DPR});
 p.on('console',m=>{if(['error','warn','warning'].includes(m.type()))log.push(`[console.${m.type()}] ${m.text()}`)});
 p.on('pageerror',e=>log.push('[pageerror] '+e.message)); p.on('requestfailed',r=>log.push('[requestfailed] '+r.url()));
 await p.evaluateOnNewDocument(shim);
 await p.goto(URL,{waitUntil:'load',timeout:120000});
 await new Promise(r=>setTimeout(r,3000)); // let async loaders (GLB fetch/decode) resolve in real time
 for(const [kind,arg] of JSON.parse(process.env.STEPS_BEFORE||'[]')){
   if(kind==='click') log.push('[click] '+await p.evaluate(src=>{const re=new RegExp(src,'i');const e=[...document.querySelectorAll('button,[role=button],[role=tab]')].find(e=>re.test(e.innerText||e.title||e.getAttribute('aria-label')||''));if(e){e.click();return e.innerText}return null},arg));
   if(kind==='key') await p.keyboard.press(arg);
   await p.evaluate(()=>__vstep(30));
 }
 const w=+WARM; for(let i=0;i<w;i+=60){ const r=await p.evaluate(n=>__vstep(n),Math.min(60,w-i)); if(i===0) log.push('[warm] '+JSON.stringify(r)); }
 const times=[];
 for(let i=0;i<+N;i++){ const t=Date.now(); const r=await p.evaluate(()=>__vstep(1)); if(r.calls===0&&i<3) log.push('[warn] no rAF callbacks at frame '+i);
   await p.screenshot({path:`${OUT}/f${String(i).padStart(4,'0')}.png`}); times.push(Date.now()-t); }
 const s=[...times].sort((a,b)=>a-b); log.push(`[capture] ${N} frames @${FPS} virtual fps; wall ms/frame p50 ${s[s.length>>1]} max ${s[s.length-1]}`);
 fs.writeFileSync(`${OUT}/log.txt`,log.join('\n')); console.log(log.join('\n')); await b.close();
})().catch(e=>{console.error('FATAL',e);fs.writeFileSync(`${OUT}/log.txt`,log.join('\n')+'\nFATAL '+e);process.exit(1)});
