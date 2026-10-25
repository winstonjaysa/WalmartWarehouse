const puppeteer=require('puppeteer-core');const fs=require('fs');const OUT='../runs/app1_patched';fs.mkdirSync(OUT,{recursive:true});
const L=f=>fs.appendFileSync(OUT+'/console_live.txt',`${((Date.now()-T)/1000).toFixed(1)}s ${f}\n`);let T=Date.now();
(async()=>{const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',protocolTimeout:20000,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage();await p.setViewport({width:1280,height:800});
p.on('console',m=>L(`[${m.type()}] ${m.text().slice(0,400)}`));p.on('pageerror',e=>L('[pageerror] '+e.message));
p.on('requestfailed',r=>L('[requestfailed] '+r.url()));p.on('response',r=>{if(r.status()>=400||/unpkg/.test(r.url()))L('[http '+r.status()+'] '+r.url())});
p.on('load',()=>L('LOAD event'));
p.goto('http://127.0.0.1:8931/qa/patched/walmart-dc.fixed.html',{timeout:0}).catch(e=>L('goto '+e.message));
for(let i=0;i<8;i++){await new Promise(r=>setTimeout(r,10000));
 try{const info=await Promise.race([p.evaluate(()=>{const c=document.getElementById('gl');return {c:[c.width,c.height],fr:window.__frames||null,t:performance.now()|0}}),new Promise((_,j)=>setTimeout(()=>j(new Error('eval timeout 8s')),8000))]);L('probe '+JSON.stringify(info));
 if(i==2||i==7){await Promise.race([p.screenshot({path:OUT+'/patched_desk_'+i+'.png'}),new Promise((_,j)=>setTimeout(()=>j(new Error('shot timeout')),15000))]).then(()=>L('shot '+i)).catch(e=>L(e.message));}
 }catch(e){L(e.message)}}
// fps
try{const f=await Promise.race([p.evaluate(()=>new Promise(r=>{let n=0,t0=performance.now();function k(){n++;if(performance.now()-t0<5000)requestAnimationFrame(k);else r(n/((performance.now()-t0)/1000))}requestAnimationFrame(k)})),new Promise((_,j)=>setTimeout(()=>j(new Error('fps timeout')),20000))]);L('FPS(swiftshader 1280x800) '+f.toFixed(2))}catch(e){L(e.message)}
process.exit(0)})();
