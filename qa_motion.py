import asyncio, sys, json, time
from playwright.async_api import async_playwright
SECS=float(sys.argv[1]) if len(sys.argv)>1 else 120
URL='http://localhost:8799/walmart-dc.html?capture&demo=0&toast=0&inspect=0&q=low&nopost'
JS='''(secs)=>{ const S=window.__sim, out={slip:0,slipN:0,frames:0,steerErr:[],yawJump:0,palJump:0,events:[]}; const n=Math.round(secs*60); const prev=new Map(); const pp=new Map();
 for(let f=0;f<n;f++){ window.__step(1/60); out.frames++;
  for(const v of S.VEH){ if(v.isSemi) continue; const p=prev.get(v);
    if(p){ const dx=v.x-p.x, dz=v.z-p.z, lat=Math.abs(dx*Math.cos(p.th)-dz*Math.sin(p.th))*60; if(lat>0.02){out.slipN++; out.slip=Math.max(out.slip,lat);} 
      const dth=Math.abs(Math.atan2(Math.sin(v.th-p.th),Math.cos(v.th-p.th))); if(dth>0.035){out.yawJump++; out.events.push(['yaw',f,v.id,+(dth*57.3).toFixed(1)]);}
      const ds=Math.hypot(dx,dz); if(ds>1e-4){ const kAct=Math.atan2(Math.sin(v.th-p.th),Math.cos(v.th-p.th))/(ds*(v.gear||1)); const dImp=Math.atan(v.wb*kAct); out.steerErr.push(Math.abs(dImp-v.steer)*57.3);} }
    prev.set(v,{x:v.x,z:v.z,th:v.th}); }
  window.__place();
  for(const pl of S.PALS){ pl.updateMatrixWorld(true); const w=pl.getWorldPosition(new pl.position.constructor()); const q=pp.get(pl); if(q){const d=q.distanceTo(w); if(d>0.05){out.palJump++; out.events.push(['pal',f,pl.userData.lpn,+(d*100).toFixed(1)]);}} pp.set(pl,w);} }
 const se=out.steerErr; out.steerMean=se.reduce((a,b)=>a+b,0)/Math.max(1,se.length); out.steerMax=Math.max(0,...se); delete out.steerErr; out.events=out.events.slice(0,40); out.assert=S.ASSERT; out.counts=S.COUNTS; out.t=S.t; return out; }'''
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg=await b.new_page(viewport={'width':800,'height':500}); logs=[]
        pg.on('console',lambda m: logs.append(f'{m.type}: {m.text}') if m.type in('error','warning') or '[ASSERT]' in m.text else None)
        pg.on('pageerror',lambda e: logs.append('PAGEERROR '+str(e)))
        await pg.goto(URL,wait_until='commit',timeout=120000)
        await pg.wait_for_function('window.__ready===true',timeout=240000)
        r=await pg.evaluate(JS, SECS)
        print(json.dumps(r,indent=1)); print('\n'.join(logs[:60]))
        await b.close()
asyncio.run(main())
