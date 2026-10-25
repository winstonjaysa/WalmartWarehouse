// Long accelerated automation session with scene-graph tracking.
// node auto.js URL OUTDIR [simSeconds=180] [speed=8] [shotEvery=30]
const puppeteer=require('puppeteer-core'); const fs=require('fs');
const [URL,OUT,SIM='180',SPEED='8',SHOT='30']=process.argv.slice(2); fs.mkdirSync(OUT,{recursive:true});
const DT=1000/60*(+SPEED);
const shim=`(()=>{let vt=0;const t0=Date.now();window.__VDT=${DT};
 let seed=1234567;Math.random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return ((seed>>>0)%1e9)/1e9;};
 const rq=new Map();let rid=1;window.requestAnimationFrame=cb=>{rq.set(rid,cb);return rid++;};window.cancelAnimationFrame=id=>rq.delete(id);
 performance.now=()=>vt;const RD=Date;const D=function(...a){return a.length?new RD(...a):new RD(t0+vt)};D.now=()=>t0+vt;D.prototype=RD.prototype;D.UTC=RD.UTC;D.parse=RD.parse;window.Date=D;
 const tq=[];let tid=1e6;window.setTimeout=(f,ms=0,...a)=>{const id=tid++;tq.push({id,at:vt+(+ms||0),f,a});return id;};
 window.setInterval=(f,ms=0,...a)=>{const id=tid++;const iv=Math.max(+ms||0,1);tq.push({id,at:vt+iv,f,a,iv});return id;};
 window.clearTimeout=window.clearInterval=id=>{const i=tq.findIndex(t=>t.id===id);if(i>=0)tq.splice(i,1);};
 window.__vstep=(n=1)=>{let calls=0;for(let k=0;k<n;k++){vt+=window.__VDT;tq.sort((a,b)=>a.at-b.at);
   while(tq.length&&tq[0].at<=vt){const t=tq.shift();if(t.iv){t.at+=t.iv;tq.push(t);}try{typeof t.f==='function'&&t.f(...t.a)}catch(e){console.error('timer',e)}}
   const cbs=[...rq.values()];rq.clear();for(const cb of cbs){try{cb(vt);calls++}catch(e){console.error('raf',e&&e.stack||e)}}}return {vt,calls};};
 // three devtools hook
 const T=window.__THREE_DEVTOOLS__=new EventTarget();window.__scenes=[];window.__renderers=[];
 window.__skipRender=false;window.__wantRender=true;T.addEventListener('observe',e=>{const o=e.detail;if(o&&o.isScene)__scenes.push(o);else if(o&&o.render&&o.domElement){__renderers.push(o);const r0=o.render.bind(o);o.render=(s,c)=>{if(s&&s.isScene&&c&&c.isCamera&&!(s.userData&&s.userData.__fsq)){if(!window.__lastScene||s.children.length>=window.__lastScene.children.length){window.__lastScene=s;window.__lastCam=c;}}if(window.__skipRender&&!window.__wantRender)return;return r0(s,c);};}});
 window.__track=()=>{const s=window.__lastScene||__scenes[0],c=window.__lastCam;if(!s||!c)return null;c.updateMatrixWorld();
   const V=c.position.constructor;const out=[];const fog=s.fog;const cp=c.getWorldPosition(new V());
   const pm=c.projectionMatrix.clone().multiply(c.matrixWorldInverse);
   s.traverse(o=>{ if(o===s)return; const nm=o.name||''; const isMesh=o.isMesh||o.isInstancedMesh||o.isSprite;
     // track named groups and meshes whose parent is a scene/top-level group child (entities)
     const part=/wheel|tyre|tire|mast|fork|carriage|tine|trailer|tractor|cab|steer|kingpin|lift/i.test(nm);const ent=part||(o.isGroup||o.type==='Object3D'||isMesh)&&(nm||o.parent===s||(o.parent&&o.parent.parent===s));
     if(!ent)return; let vis=o.visible,p=o.parent;while(p){if(!p.visible){vis=false;break;}p=p.parent;}
     const w=o.getWorldPosition(new V()); const q=w.clone().applyMatrix4(pm); const onScr=Math.abs(q.x)<=1&&Math.abs(q.y)<=1&&q.z>-1&&q.z<1;
     const d=w.distanceTo(cp); let ff=0; if(fog){ff=fog.isFogExp2?1-Math.exp(-((fog.density*d)**2)):Math.min(1,Math.max(0,(d-fog.near)/(fog.far-fog.near)));}
     let op=1; if(o.material&&!Array.isArray(o.material))op=o.material.opacity*(o.material.transparent?1:1);
     out.push([o.uuid.slice(0,8),nm.slice(0,40)||o.type,+w.x.toFixed(2),+w.y.toFixed(2),+w.z.toFixed(2),vis?1:0,onScr?1:0,+ff.toFixed(2),+op.toFixed(2),+(o.scale.x).toFixed(2),+((q.x+1)/2).toFixed(3),+((1-q.y)/2).toFixed(3),o.isInstancedMesh?o.count:-1, (()=>{const e=o.matrixWorld.elements;return +Math.atan2(e[8],e[10]).toFixed(4)})(), o.parent?o.parent.uuid.slice(0,8):'', +o.position.y.toFixed(3), +o.rotation.x.toFixed(4), +o.rotation.y.toFixed(4), +o.rotation.z.toFixed(4), +o.position.x.toFixed(3), +o.position.z.toFixed(3)]);});
   return {cam:[+cp.x.toFixed(2),+cp.y.toFixed(2),+cp.z.toFixed(2)],n:out.length,o:out};};
 window.__VEH=/^(reachTruck|forklift|autoStacker|walkieStacker|palletJack|riderPalletTruck)$/;
 window.__slotProbe=()=>{const s=window.__lastScene||__scenes[0];if(!s)return null;const V=s.position.constructor;const veh=[],loads=[];
   s.traverse(o=>{const nm=o.name||'';
     if(__VEH.test(nm)){o.updateMatrixWorld(true);const e=o.matrixWorld.elements;let car=null,fk=[];o.traverse(c=>{if(!car&&(c.name==='carriage'||c.name==='liftFrame'))car=c;if(c.name==='forkLeft'||c.name==='forkRight')fk.push(c);});
       const hp=car?car.getWorldPosition(new V()):null;const tips=fk.map(f=>{const t=f.localToWorld(new V(0,0,1.07));return [+t.x.toFixed(3),+t.y.toFixed(3),+t.z.toFixed(3)];});
       const fd=new V(e[8],e[9],e[10]).normalize();
       veh.push([o.uuid.slice(0,8),nm,+e[12].toFixed(3),+e[13].toFixed(3),+e[14].toFixed(3),+Math.atan2(fd.x,fd.z).toFixed(4),hp?[+hp.x.toFixed(3),+hp.y.toFixed(3),+hp.z.toFixed(3)]:null,tips,+(o.userData&&o.userData.getForkHeight?o.userData.getForkHeight():-1).toFixed(3)]);}
     if(nm==='pallet'||nm==='tote'||nm==='palletLoad'){let a=o.parent,own='',vis=o.visible;while(a){if(!a.visible)vis=false;if(!own&&__VEH.test(a.name||''))own=a.uuid.slice(0,8);a=a.parent;}
       const w=o.getWorldPosition(new V());loads.push([o.uuid.slice(0,8),nm,+w.x.toFixed(3),+w.y.toFixed(3),+w.z.toFixed(3),o.parent?o.parent.uuid.slice(0,8):'',o.parent?(o.parent.name||o.parent.type):'',own,vis?1:0]);}});
   let sl=null;try{if(typeof SLOTS!=='undefined'){sl=[];if(!window.__slPrev)window.__slPrev=SLOTS.map(x=>x.occ);SLOTS.forEach((x,i)=>{if(x.occ!==window.__slPrev[i]){sl.push([i,x.id,x.occ?1:0,+x.X.toFixed(3),+x.Y.toFixed(3),+x.Z.toFixed(3)]);window.__slPrev[i]=x.occ;}});}}catch(e){}
   return {veh,loads,sl};};
 window.__slotMeta=()=>{try{return typeof SLOTS!=='undefined'?SLOTS.map(x=>[x.id,+x.X.toFixed(3),+x.Y.toFixed(3),+x.Z.toFixed(3),x.row.face]):null}catch(e){return null}};
})();`;
(async()=>{const log=[];
 const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage(); await p.setViewport({width:+(process.env.VW||1440),height:+(process.env.VH||900)});
 const call=[];p.on('console',m=>{call.push(`[${m.type()}] ${m.text()}`);if(['error','warn','warning'].includes(m.type()))log.push(`[console.${m.type()}] ${m.text()}`)});
 p.on('pageerror',e=>log.push('[pageerror] '+e.message));
 await p.evaluateOnNewDocument(shim); await p.goto(URL,{waitUntil:'load',timeout:120000}); await new Promise(r=>setTimeout(r,3000));
 const SL=new Set((process.env.SHOTLIST||'').split(',').filter(Boolean).map(Number)); const frames=Math.ceil(+SIM*1000/DT); const ws=fs.createWriteStream(`${OUT}/track.jsonl`),sws=fs.createWriteStream(`${OUT}/slots.jsonl`);
 for(let i=0;i<frames;i++){ const want=(+SHOT>0&&i%(+SHOT)===0)||SL.has(i)||SL.has(i+1); const r=await p.evaluate((want)=>{window.__skipRender=true;window.__wantRender=want;const s=__vstep(1);return {s,t:__track(),sp:__slotProbe()};},want);
   if(i===0) fs.writeFileSync(`${OUT}/slots_meta.json`,JSON.stringify(await p.evaluate(()=>__slotMeta())));
   sws.write(JSON.stringify({f:i,vt:r.s.vt,...(r.sp||{})})+'\n'); delete r.sp;
   ws.write(JSON.stringify({f:i,vt:r.s.vt,calls:r.s.calls,...(r.t||{})})+'\n');
   if(want) await p.screenshot({path:`${OUT}/a${String(i).padStart(5,'0')}.png`});
   if(i%300===0) console.log('frame',i,'/',frames,'objs',r.t&&r.t.n); }
 ws.end(); sws.end(); fs.writeFileSync(`${OUT}/log.txt`,log.join('\n')); fs.writeFileSync(`${OUT}/console_all.txt`,call.join('\n')); console.log('done', log.length,'console issues'); await b.close();
})().catch(e=>{console.error('FATAL',e);process.exit(1)});
