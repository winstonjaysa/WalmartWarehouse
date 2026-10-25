import sys, subprocess, os, time, json
from playwright.sync_api import sync_playwright
BASE = 'http://127.0.0.1:18431/parts/preview.html'
mode = sys.argv[1] if len(sys.argv) > 1 else 'still'
out = '/workspace/gateflow/parts/'
errs = []
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    pg = b.new_page(viewport={'width': 1280, 'height': 720}); pg.set_default_timeout(180000)
    pg.on('console', lambda m: errs.append('console.' + m.type + ': ' + m.text) if m.type in ('error',) else None)
    pg.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))
    pg.on('response', lambda r: errs.append('HTTP %d %s' % (r.status, r.url)) if r.status >= 400 else None)
    pg.on('requestfailed', lambda r: errs.append('requestfailed: ' + r.url) if 'favicon' not in r.url else None)
    def load(q):
        pg.goto(BASE + q)
        try: pg.wait_for_function('window.__ready === true || (window.__errors && window.__errors.length)', timeout=90000)
        except Exception as e: print('TIMEOUT', errs); raise
    if mode == 'still':
        load('?manual=1'); pg.evaluate('window.__step(1/30, 40)'); pg.screenshot(path=out + 'preview.png')
        print('names', pg.evaluate('window.__names')); print('pageErrors', pg.evaluate('window.__errors'))
    elif mode == 'video':
        load('?manual=1'); d = '/tmp/frames'; os.makedirs(d, exist_ok=True); [os.remove(os.path.join(d, f)) for f in os.listdir(d)]
        N = int(sys.argv[2]) if len(sys.argv) > 2 else 150
        for i in range(N):
            pg.evaluate('window.__step(1/30, 1)'); pg.screenshot(path=f'{d}/f{i:04d}.png')
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '30', '-i', f'{d}/f%04d.png', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', out + 'preview.mp4'], check=True)
        print('video ok')
    elif mode == 'close':
        names = sys.argv[2].split(',')
        for n in names:
            ang = '35'
            if ':' in n: n, ang = n.split(':')
            load(f'?manual=1&rot=0&only={n}&angle={ang}'); pg.evaluate('window.__step(1/30, 45)'); pg.screenshot(path=out + f'closeup_{n}.png'); print('shot', n, pg.evaluate('window.__errors'))
    b.close()
print('ERRORS', json.dumps(errs, indent=1))
