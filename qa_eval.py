import asyncio, sys, json
from playwright.async_api import async_playwright
URL='http://localhost:8799/walmart-dc.html?capture&demo=0&toast=0&inspect=0&q=low&nopost'
JS=open(sys.argv[1]).read()
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg=await b.new_page(viewport={'width':800,'height':500}); logs=[]
        pg.on('console',lambda m: logs.append(f'{m.type}: {m.text}') if m.type in('error','warning') or '[ASSERT]' in m.text or '[gf]' in m.text else None)
        pg.on('pageerror',lambda e: logs.append('PAGEERROR '+str(e)))
        await pg.goto(URL,wait_until='commit',timeout=120000)
        await pg.wait_for_function('window.__ready===true',timeout=240000)
        r=await pg.evaluate(JS)
        print(json.dumps(r,indent=1)); print('\n'.join(logs[:80]))
        await b.close()
asyncio.run(main())
