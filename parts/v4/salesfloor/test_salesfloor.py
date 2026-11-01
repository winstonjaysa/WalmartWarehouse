# Headless test: python3 parts/v4/salesfloor/test_salesfloor.py  (run from /workspace/gateflow; serves on :8812)
import asyncio, json, base64, subprocess, sys, os, time
from playwright.async_api import async_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
async def main():
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8812'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
            pg = await b.new_page(); logs = []
            pg.on('console', lambda m: logs.append(m.text)); pg.on('pageerror', lambda e: logs.append('PAGEERROR ' + str(e)))
            await pg.goto('http://localhost:8812/parts/v4/salesfloor/test.html')
            await pg.wait_for_function('window.__ready===true', timeout=180000)
            res = await pg.evaluate('window.__results'); png = await pg.evaluate('window.__png')
            open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'preview.png'), 'wb').write(base64.b64decode(png.split(',')[1]))
            await b.close()
    finally: srv.terminate()
    print(json.dumps(res, indent=1)); [print('LOG', l) for l in logs if 'rror' in l]
    bad = [r for r in res if not r.get('ok')]
    if bad: print('FAIL', [r['name'] for r in bad]); sys.exit(1)
    print('PASS: all modules <=3 draw calls and <=15k verts')
asyncio.run(main())
