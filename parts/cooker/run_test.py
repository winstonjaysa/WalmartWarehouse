import json, sys, subprocess, threading, http.server, functools, socketserver
from playwright.sync_api import sync_playwright
d = '/workspace/gateflow/parts/cooker'

class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=d)); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    pg = b.new_page(viewport={'width': 1600, 'height': 900})
    pg.on('console', lambda m: print('console:', m.text))
    pg.on('pageerror', lambda e: print('pageerror:', e))
    q = sys.argv[1] if len(sys.argv) > 1 else ''
    pg.goto(f'http://127.0.0.1:{port}/sorter_test.html{q}', wait_until='commit')
    pg.wait_for_function('window.RESULT', timeout=600000)
    print(json.dumps(pg.evaluate('window.RESULT'), indent=1))
    if len(sys.argv) > 2: pg.locator('canvas').screenshot(path=sys.argv[2])
    b.close()
