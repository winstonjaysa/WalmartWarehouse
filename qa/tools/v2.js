// node v2.js  -> fast pass: boot, population, zoom, pallet cases, 60s sim per-vehicle record
const puppeteer=require('puppeteer-core');const fs=require('fs');const OUT=process.env.OUT||'../runs/v2';fs.mkdirSync(OUT,{recursive:true});
const BASE=process.env.BASE;const SEC=+(process.env.SEC||60);
const TO=(p,ms,m)=>Promise.race([p,new Promise((_,j)=>setTimeout(()=>j(new Error(m+' timeout '+ms+'ms')),ms))]);
const ARGS=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'];
(async()=>{const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',protocolTimeout:600000,args:ARGS});
const p=await b.newPage();const T=Date.now();const f=`${OUT}/console_sim.txt`;fs.writeFileSync(f,'');
const L=s=>fs.appendFileSync(f,`${((Date.now()-T)/1000).toFixed(1)}s ${s}\n`);
await p.setViewport({width:1280,height:800});
p.on('console',m=>L(`[${m.type()}] ${m.text().slice(0,400)}`));p.on('pageerror',e=>L('[pageerror] '+e.message));
p.on('requestfailed',r=>L('[requestfailed] '+r.url()));
await p.evaluateOnNewDocument(()=>{window.__THREE_DEVTOOLS__=new EventTarget();window.__objs=[];window.__THREE_DEVTOOLS__.addEventListener('observe',e=>window.__objs.push(e.detail));});
p.goto(BASE+'?capture&noao&q=low',{timeout:0}).catch(e=>L('goto '+e.message));
let ready=false;for(let i=0;i<60&&!ready;i++){await new Promise(r=>setTimeout(r,3000));try{ready=await TO(p.evaluate(()=>!!window.__ready),6000,'eval')}catch(e){}}
L('ready='+ready);if(!ready){await b.close();return;}
const res={};
// setup
res.setup=await p.evaluate(()=>{const R=window.__objs.find(o=>o&&o.isWebGLRenderer);const S=window.__objs.find(o=>o&&o.isScene);window.__R=R;window.__S=S;const real=R.render.bind(R);window.__real=real;
 R.render=(s,c)=>{window.__C=c};window.__render();const C=window.__C;
 const VN=/^(forklift|reachTruck|autoStacker|walkieStacker|palletJack|riderPalletTruck|tugTrain|yardTractor|semiTruck|amr)$/;
 const veh=[],wk=[];S.traverse(o=>{if(VN.test(o.name)){let a=o.parent,nest=false;while(a){if(VN.test(a.name))nest=true;a=a.parent}if(!nest)veh.push(o)}if(o.name==='worker')wk.push(o)});
 window.__veh=veh;window.__wk=wk;
 const find=(o,re)=>{const r=[];o.traverse(x=>{if(re.test(x.name))r.push(x)});return r};
 window.__vinfo=veh.map((v,i)=>({i,name:v.name,drv:find(v,/driver|operator|^worker$|rider/i).map(x=>x.name),handle:find(v,/tiller|handleYoke|^handle$|tillerHead/).map(x=>x.name),carts:(v.userData.parts&&v.userData.parts.carts||[]).length}));
 // pallets & cases
 const pals=[];S.traverse(o=>{if(o.name==='pallet')pals.push(o)});
 const pc=pals.map(pl=>{let k=0;pl.traverse(x=>{if(x!==pl&&/case|box|carton|load|tote|wrap/i.test(x.name)&&x.visible)k++});
   // also siblings? check children meshes above deck
   let m=0;pl.children.forEach(c=>{if(c.isMesh||c.isGroup)m++});return {k,m,parent:pl.parent&&pl.parent.name}});
 let inst=[];S.traverse(o=>{if(o.isInstancedMesh)inst.push({n:o.name||o.parent&&o.parent.name,c:o.count})});
 return {cam:[C.position.x,C.position.y,C.position.z],veh:window.__vinfo,wk:wk.length,pals:pals.length,palsWithCases:pc.filter(x=>x.k>0).length,pc:pc.slice(0,40),inst:inst.filter(x=>/pallet|load|case|box|carton/i.test(x.n))}
});
L('setup '+JSON.stringify(res.setup));
// sim record
const rows=[];
for(let f0=0;f0<SEC*60;f0+=60){const ch=await p.evaluate((f0)=>{const out=[];const V=window.__S.position.constructor;const v=new V(),d=new V();
 for(let i=0;i<60;i++){window.__step(1/60);if(i==59)window.__render();
  const fr={f:f0+i,v:[],w:[]};
  for(const o of window.__veh){o.updateMatrixWorld(true);o.getWorldPosition(v);o.getWorldDirection(d);const ud=o.userData;const fh=ud.getForkHeight?ud.getForkHeight():null;
   let drv=0;o.traverse(x=>{if(/driver|operator|^worker$|rider/i.test(x.name)){let vis=true,a=x;while(a){if(!a.visible)vis=false;a=a.parent}if(vis)drv=1}});
   let hp=null;o.traverse(x=>{if(!hp&&/tillerHead|handleYoke|^tiller$|steerTiller/.test(x.name)){const q=new V();x.getWorldPosition(q);hp=[+q.x.toFixed(3),+q.y.toFixed(3),+q.z.toFixed(3)]}});
   let carts=null;const P=ud.parts;if(P&&P.carts&&P.carts.length)carts=P.carts.map(c=>{const q=new V();c.body.getWorldPosition(q);return [+q.x.toFixed(3),+q.z.toFixed(3)]});
   fr.v.push([+v.x.toFixed(4),+v.y.toFixed(4),+v.z.toFixed(4),+Math.atan2(d.x,d.z).toFixed(5),fh==null?null:+fh.toFixed(4),drv,hp,carts])}
  for(const w of window.__wk){w.updateMatrixWorld(true);w.getWorldPosition(v);const P=w.userData.parts||{};const lg=P.legLeft?+P.legLeft.rotation.x.toFixed(3):null;
   const hands=[];w.traverse(x=>{if(x.name==='hand'){const q=new V();x.getWorldPosition(q);hands.push([+q.x.toFixed(3),+q.y.toFixed(3),+q.z.toFixed(3)])}});
   let a=w,vis=true;while(a){if(!a.visible)vis=false;a=a.parent}
   fr.w.push([+v.x.toFixed(4),+v.z.toFixed(4),lg,hands,vis?1:0,w.parent&&w.parent.name])}
  out.push(fr)}return out},f0);rows.push(...ch);if(f0%600==0)L('sim t='+f0/60)}
fs.writeFileSync(`${OUT}/frames.json`,JSON.stringify(rows));
L('assert '+JSON.stringify(await p.evaluate(()=>({a:window.__assert,kpi:window.__kpi,counts:window.__sim&&window.__sim.COUNTS}))));
// zoom tests
res.zoom=await p.evaluate(()=>{window.__cam(60,40,60,0,0,0);for(let i=0;i<30;i++)window.__render();const C=window.__C;const dist=()=>Math.hypot(C.position.x,C.position.y,C.position.z);return {d0:dist()}});
const dist=()=>p.evaluate(()=>{const C=window.__C;return +Math.hypot(C.position.x,C.position.y,C.position.z).toFixed(3)});
const settle=async(n=40)=>{const s=[];for(let i=0;i<n;i++)s.push(await p.evaluate(()=>{window.__render();const C=window.__C;return +Math.hypot(C.position.x,C.position.y,C.position.z).toFixed(3)}));return s};
// wheel in
await p.mouse.move(640,400);
const wheel=async(dy,n)=>{for(let i=0;i<n;i++){await p.mouse.wheel({deltaY:dy});}};
await wheel(-200,3);res.zoom.wheelIn=await settle(30);
await wheel(200,3);res.zoom.wheelOut=await settle(30);
await wheel(-400,60);res.zoom.clampMin=(await settle(40)).slice(-1)[0];
res.zoom.camYmin=await p.evaluate(()=>window.__C.position.y);
await wheel(400,80);res.zoom.clampMax=(await settle(40)).slice(-1)[0];
// pinch via CDP touch
await p.evaluate(()=>{window.__cam(60,40,60,0,0,0);for(let i=0;i<30;i++)window.__render()});
const cdp=await p.target().createCDPSession();await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
const d1=await dist();
await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:600,y:400,id:1},{x:680,y:400,id:2}]});
for(let k=1;k<=10;k++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:600-k*15,y:400,id:1},{x:680+k*15,y:400,id:2}]});await p.evaluate(()=>window.__render())}
await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
res.zoom.pinch={d1,after:(await settle(30))};
// buttons
res.zoom.buttons=await p.evaluate(()=>[...document.querySelectorAll('button,[role=button]')].filter(e=>/zoom|^\s*[+−-]\s*$/i.test((e.getAttribute('aria-label')||'')+' '+(e.title||'')+' '+e.textContent)).map(e=>({t:e.textContent.trim().slice(0,20),a:e.getAttribute('aria-label'),id:e.id,cls:e.className})));
if(res.zoom.buttons.length){await p.evaluate(()=>{window.__cam(60,40,60,0,0,0);for(let i=0;i<30;i++)window.__render()});const b0=await dist();
 const clicked=await p.evaluate(()=>{const e=[...document.querySelectorAll('button,[role=button]')].find(e=>/zoom in|\+/i.test((e.getAttribute('aria-label')||'')+(e.title||'')+e.textContent));if(e){e.click();return e.outerHTML.slice(0,120)}return null});
 res.zoom.btn={b0,clicked,after:await settle(30)};}
L('zoom '+JSON.stringify(res.zoom));
// pallet crop: frame a carried/trailer pallet
await p.evaluate(()=>{const pl=[];window.__S.traverse(o=>{if(o.name==='pallet')pl.push(o)});const o=pl[0];const V=o.position.constructor;const q=new V();o.getWorldPosition(q);window.__cam(q.x+3,q.y+2.5,q.z+3,q.x,q.y+0.5,q.z);window.__R.render=window.__real;window.__render();});
await TO(p.screenshot({path:`${OUT}/pallet_crop.png`,clip:{x:340,y:150,width:600,height:500}}),120000,'shot').catch(e=>L(e.message));
await p.evaluate(()=>{window.__cam(-40,45,60,-5,0,15);window.__render()});
await TO(p.screenshot({path:`${OUT}/overview.png`}),120000,'shot').catch(e=>L(e.message));
L('done');await b.close();})().catch(e=>{console.error('FATAL',e);process.exit(1)});
