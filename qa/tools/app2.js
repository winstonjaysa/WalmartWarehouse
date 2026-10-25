// usage: node app2.js MODE   MODE=boot|sim
const puppeteer=require('puppeteer-core');const fs=require('fs');const OUT=process.env.OUT||'../runs/app2';fs.mkdirSync(OUT,{recursive:true});
const MODE=process.argv[2];const BASE=process.env.BASE||'http://127.0.0.1:8931/walmart-dc.html';
const TO=(p,ms,m)=>Promise.race([p,new Promise((_,j)=>setTimeout(()=>j(new Error(m+' timeout '+ms+'ms')),ms))]);
const ARGS=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'];
async function open(b,url,w,h,mob,tag){const p=await b.newPage();const T=Date.now();const f=`${OUT}/console_${tag}.txt`;fs.writeFileSync(f,'');
 const L=s=>fs.appendFileSync(f,`${((Date.now()-T)/1000).toFixed(1)}s ${s}\n`);
 await p.setViewport({width:w,height:h,isMobile:mob,hasTouch:mob,deviceScaleFactor:mob?2:1});
 p.on('console',m=>L(`[${m.type()}] ${m.text().slice(0,500)}`));p.on('pageerror',e=>L('[pageerror] '+e.message));
 p.on('requestfailed',r=>L('[requestfailed] '+r.url()+' '+(r.failure()&&r.failure().errorText)));
 p.on('response',r=>{if(r.status()>=400)L('[http '+r.status()+'] '+r.url())});
 await p.evaluateOnNewDocument(()=>{window.__THREE_DEVTOOLS__=new EventTarget();window.__objs=[];window.__THREE_DEVTOOLS__.addEventListener('observe',e=>window.__objs.push(e.detail));});
 p.goto(url,{timeout:0}).catch(e=>L('goto '+e.message));
 let ready=false;for(let i=0;i<40&&!ready;i++){await new Promise(r=>setTimeout(r,5000));try{ready=await TO(p.evaluate(()=>!!window.__ready),6000,'eval')}catch(e){L(e.message)}}
 L('ready='+ready);return {p,L,T,ready};}
async function canvasInfo(p){return TO(p.evaluate(()=>{const c=document.getElementById('gl');const r=c.getBoundingClientRect();return {buf:[c.width,c.height],css:[Math.round(r.width),Math.round(r.height)],vis:getComputedStyle(c).visibility,disp:getComputedStyle(c).display,placeholder:!!document.body.innerText.match(/Three\.js mounts here/)}}),15000,'cinfo')}
async function pix(p){ // read canvas via toDataURL (needs preserveDrawingBuffer=capture) -> stats
 return TO(p.evaluate(()=>{const c=document.getElementById('gl');const o=document.createElement('canvas');o.width=128;o.height=80;const x=o.getContext('2d');x.drawImage(c,0,0,128,80);const d=x.getImageData(0,0,128,80).data;let n=0,s=0,s2=0,uniq=new Set();for(let i=0;i<d.length;i+=4){const l=(d[i]+d[i+1]+d[i+2])/3;s+=l;s2+=l*l;n++;uniq.add((d[i]>>4)+'-'+(d[i+1]>>4)+'-'+(d[i+2]>>4));}const m=s/n;return {mean:+m.toFixed(1),std:+Math.sqrt(s2/n-m*m).toFixed(1),colours:uniq.size,alpha0:d[3]}}),20000,'pix')}
(async()=>{const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',protocolTimeout:600000,args:ARGS});
if(MODE==='boot'){
 for(const [w,h,tag,mob] of [[1280,800,'desk',false],[390,844,'mob',true]]){
  const {p,L,T,ready}=await open(b,BASE+'?capture&noao',w,h,mob,tag);
  try{L('canvas '+JSON.stringify(await canvasInfo(p)));const t0=Date.now();await TO(p.evaluate(()=>window.__render()),180000,'render');L('render1 ms '+(Date.now()-t0));
   const t1=Date.now();await TO(p.evaluate(()=>window.__render()),180000,'render');L('render2 ms '+(Date.now()-t1));
   L('pixels '+JSON.stringify(await pix(p)));await TO(p.screenshot({path:`${OUT}/boot_${tag}_${w}x${h}.png`}),60000,'shot');L('shot ok');}catch(e){L('ERR '+e.message)}
  await p.close();}
 // default URL (no capture) and ?q=low just for console + responsiveness
 for(const [q,tag] of [['','desk_default'],['?q=low','desk_qlow']]){const {p,L,ready}=await open(b,BASE+q,1280,800,false,tag);
  try{L('canvas '+JSON.stringify(await canvasInfo(p)));L('qlow-effect '+JSON.stringify(await TO(p.evaluate(()=>({pr:window.devicePixelRatio,q:new URLSearchParams(location.search).get('q')})),8000,'e')))
   const f=await TO(p.evaluate(()=>new Promise(r=>{let n=0,t0=performance.now();function k(){n++;if(performance.now()-t0<8000)requestAnimationFrame(k);else r({frames:n,sec:(performance.now()-t0)/1000})}requestAnimationFrame(k)})),60000,'fps');L('FPS '+JSON.stringify(f)+' = '+(f.frames/f.sec).toFixed(3));
   await TO(p.screenshot({path:`${OUT}/boot_${tag}.png`}),60000,'shot');L('shot ok')}catch(e){L('ERR '+e.message)}
  await p.close();}
}

if(MODE==='boot2'){
 for(const [w,h,tag,mob,q] of [[1280,800,'desk_default',false,''],[1280,800,'desk_qlow',false,'?q=low'],[390,844,'mob_default',true,''],[390,844,'mob_qlow',true,'?q=low'],[390,844,'mob_capture_noao',true,'?capture&noao']].filter(c=>!process.env.ONLY||c[2]===process.env.ONLY)){
  const {p,L,ready}=await open(b,BASE+q,w,h,mob,tag);
  try{L('canvas '+JSON.stringify(await canvasInfo(p)));L('state '+JSON.stringify(await TO(p.evaluate(()=>({q:window.__quality,assert:window.__assert,load:!!document.getElementById('gfLoad'),docW:document.documentElement.scrollWidth,vw:innerWidth})),15000,'st')));
   if(q.includes('capture')){const t=Date.now();await TO(p.evaluate(()=>window.__render()),180000,'render');await TO(p.evaluate(()=>1),180000,'flush');L('render ms '+(Date.now()-t));}
   else{const f=await TO(p.evaluate(()=>new Promise(r=>{let n=0,t0=performance.now();function k(){n++;if(performance.now()-t0<6000)requestAnimationFrame(k);else r({frames:n,sec:(performance.now()-t0)/1000})}requestAnimationFrame(k)})),90000,'fps');L('FPS '+JSON.stringify(f)+' = '+(f.frames/f.sec).toFixed(3));}
   await TO(p.screenshot({path:`${OUT}/boot_${tag}.png`}),120000,'shot');L('shot ok')}catch(e){L('ERR '+e.message)}
  await p.close();}
}
if(MODE==='sim'){
 const {p,L,ready}=await open(b,BASE+(process.env.SIMQ||'?capture&noao'),1280,800,false,'sim');
 const SEC=+process.argv[3]||60, SHOTS=(process.argv[4]||'').split(',').filter(Boolean).map(Number);
 const t0=Date.now();
 await p.evaluate(()=>{const R=window.__objs.find(o=>o&&o.isWebGLRenderer);const S=window.__objs.find(o=>o&&o.isScene);window.__R=R;window.__S=S;window.__realRender=R.render.bind(R);R.render=()=>{};
  const fks=[],pals=[],sc=[];S.traverse(o=>{if(o.userData&&o.userData.parts&&o.userData.parts.carriage)fks.push(o);if(o.name==='pallet')pals.push(o)});window.__fks=fks;window.__pals=pals;
  window.__log=[];window.__V=new THREE_V();function THREE_V(){}
 }).catch(e=>L('setup '+e.message));
 const info=await p.evaluate(()=>{const S=window.__S;const c={};let n=0,inst=0;S.traverse(o=>{n++;if(o.isInstancedMesh)inst+=o.count;const k=o.name||'';if(/^(forklift|reachTruck|autoStacker|walkieStacker|palletJack|riderPalletTruck|semiTruck|yardTractor|worker|amr|tugTrain|semi|tractor|trailer)/i.test(k))c[k]=(c[k]||0)+1});return {objects:n,instances:inst,named:c,forklifts:window.__fks.length,pallets:window.__pals.length}});
 L('scene '+JSON.stringify(info));
 const rows=[];const N=SEC*60;
 for(let f=0;f<N;f+=60){
  const chunk=await p.evaluate((f0)=>{const out=[];const v=new window.__S.position.constructor();for(let i=0;i<60;i++){window.__step(1/60);window.__render();
    const fr={f:f0+i,fk:[],pal:[],pop:0};
    for(const o of window.__fks){o.updateMatrixWorld(true);const P=o.userData.parts;const car=P.carriage;car.getWorldPosition(v);const cy=v.y;const w=new o.position.constructor();o.getWorldPosition(w);
      const d=new o.position.constructor();o.getWorldDirection(d);
      const wh=(P.wheels||[]).map(x=>{const q=new o.position.constructor();x.getWorldPosition(q);return [x.name,+q.x.toFixed(4),+q.y.toFixed(4),+q.z.toFixed(4),+x.rotation.x.toFixed(4),+x.rotation.y.toFixed(4)]});
      fr.fk.push({x:+w.x.toFixed(4),y:+w.y.toFixed(4),z:+w.z.toFixed(4),dx:+d.x.toFixed(5),dz:+d.z.toFixed(5),carY:+cy.toFixed(4),kids:car.children.filter(c=>c.name==='pallet').map(c=>c.uuid.slice(0,8)),wh,fh:o.userData.getForkHeight?+o.userData.getForkHeight().toFixed(4):null});}
    for(const pl of window.__pals){pl.getWorldPosition(v);fr.pal.push([pl.uuid.slice(0,8),+v.x.toFixed(4),+v.y.toFixed(4),+v.z.toFixed(4),pl.parent?pl.parent.name||pl.parent.type:'-',pl.visible?1:0,+pl.scale.x.toFixed(3)])}
    out.push(fr)}return out},f);
  for(const r of chunk)rows.push(r);
  if(SHOTS.includes(f/60)){try{await p.evaluate(()=>{window.__R.render=window.__realRender;window.__render();window.__R.render=()=>{}});await TO(p.screenshot({path:`${OUT}/sim_t${f/60}s.png`}),120000,'shot');L('shot t='+f/60)}catch(e){L('shot err '+e.message)}}
  if(f%600===0)L('sim t='+(f/60)+'s wall '+((Date.now()-t0)/1000).toFixed(1)+'s');
 }
 try{L('assert '+JSON.stringify(await TO(p.evaluate(()=>({a:window.__assert,q:window.__quality,kpi:window.__kpi})),20000,'a')))}catch(e){L(e.message)}
 fs.writeFileSync(OUT+'/sim_frames.json',JSON.stringify(rows));L('done frames '+rows.length+' wall '+((Date.now()-t0)/1000).toFixed(1));
}
await b.close();process.exit(0)})().catch(e=>{console.error('FATAL',e);process.exit(1)});
