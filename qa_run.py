import asyncio, sys, json, time
T0=time.time()
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8799/walmart-dc.html?capture&demo=0&toast=0&inspect=0'
OUT = sys.argv[2] if len(sys.argv) > 2 else 'qa/test.png'
STEPS = float(sys.argv[3]) if len(sys.argv) > 3 else 20
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':1440,'height':900})
        errs = []
        pg.on('console', lambda m: errs.append(f'{m.type}: {m.text}') if m.type in ('error','warning','info') else None)
        pg.on('pageerror', lambda e: errs.append('PAGEERROR: ' + str(e)))
        await pg.goto(URL, wait_until='commit', timeout=120000); 
        try: await pg.wait_for_function('window.__ready === true', timeout=90000)
        except Exception as e: errs.append('not ready ' + str(e))
        await pg.evaluate(f'window.__step && window.__step({STEPS})')
        await pg.evaluate('window.__render && window.__render()')
        await pg.screenshot(path=OUT); print('elapsed', round(time.time()-T0,1))
        print('ASSERT', await pg.evaluate('JSON.stringify(window.__assert)'), 'Q', await pg.evaluate('window.__quality'))
        print('\n'.join(errs[:30]))
        await b.close()
asyncio.run(main())
