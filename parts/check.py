import json, sys
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg = b.new_page(); errs=[]
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
    pg.goto('http://127.0.0.1:18431/parts/check.html')
    pg.wait_for_function('window.__check', timeout=180000)
    res = pg.evaluate('window.__check')
    json.dump(res, open('/workspace/gateflow/parts/check_results.json','w'), indent=1)
    fails = 0
    for o in res:
        ok = o['groundOK'] and not o['issues']; fails += (not ok)
        print(('PASS' if ok else 'FAIL'), o['name'], o['phase'], 'minY=%s' % o.get('minY'), 'size=%s' % o.get('size'), json.dumps(o.get('joints','')) if o.get('joints') else '', '; '.join(o['issues']))
        if '-v' in sys.argv: print('   pivots', json.dumps(o.get('pivots')), '\n   wheels', json.dumps(o.get('wheels')))
    print('TOTAL', len(res), 'FAIL', fails, 'ERRS', errs)
