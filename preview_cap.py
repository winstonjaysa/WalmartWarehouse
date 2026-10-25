import asyncio, sys, os, time, glob
from playwright.async_api import async_playwright
N=int(sys.argv[1]) if len(sys.argv)>1 else 450
FPS=float(sys.argv[2]) if len(sys.argv)>2 else 30
Q=sys.argv[3] if len(sys.argv)>3 else 'low'
EXTRA=sys.argv[4] if len(sys.argv)>4 else ''
URL='http://localhost:8799/walmart-dc.html?capture&demo=0&toast=0&inspect=0&q='+Q+EXTRA
os.makedirs('preview/frames',exist_ok=True)
if not os.environ.get('RESUME'):
    for f in glob.glob('preview/frames/*.jpg'): os.remove(f)
ARGS=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-gpu-watchdog','--disable-features=GpuWatchdog']
errs=[]
async def session(p, start):
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=ARGS)
    try:
        pg=await b.new_page(viewport={'width':1280,'height':720})
        pg.set_default_timeout(300000)
        pg.on('console',lambda m: errs.append(f'{m.type}: {m.text}') if m.type in('error',) else None)
        pg.on('pageerror',lambda e: errs.append('PAGEERROR '+str(e)))
        await pg.goto(URL, wait_until='commit', timeout=120000)
        await pg.wait_for_function('window.__ready===true',timeout=240000)
        await pg.evaluate(f'window.__step({20 + start/FPS})')
        t0=time.time()
        for i in range(start,N):
            a=-0.35+0.5*i/N
            await pg.evaluate(f'''(()=>{{const a={a};const r=125;if(!{1 if 'tour' in EXTRA else 0})window.__cam(-14+Math.sin(a)*r, 70, 22+Math.cos(a)*r, -14,0,22);window.__step({1/FPS});window.__render();}})()''')
            await pg.screenshot(path=f'preview/frames/f{i:04d}.jpg',type='jpeg',quality=88)
            if i==0: await pg.screenshot(path='preview/still1.png')
            if i==N//2: await pg.screenshot(path='preview/still2.png')
            if i%15==0: print(i,round(time.time()-t0,1),flush=True)
        return N
    except Exception as e:
        print('session error', str(e)[:200], flush=True)
        return len(glob.glob('preview/frames/f*.jpg'))
    finally:
        try: await b.close()
        except Exception: pass
async def main():
    async with async_playwright() as p:
        done=len(glob.glob('preview/frames/f*.jpg')); tries=0
        while done<N and tries<6:
            done=await session(p, done); tries+=1
        print('frames', done, 'tries', tries)
        print('\n'.join(errs[:20]),flush=True)
asyncio.run(main())
