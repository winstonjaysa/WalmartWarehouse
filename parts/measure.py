import json
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg = b.new_page(); errs=[]
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('http://127.0.0.1:18431/parts/measure.html'); 
    try: pg.wait_for_function('window.__out', timeout=60000)
    except Exception: print(errs); raise
    r = pg.evaluate('window.__out'); 
    for k,v in r['out'].items(): print(k, v)
    print('ERR', r['err'], errs)
