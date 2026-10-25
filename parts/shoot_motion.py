import sys, os, subprocess, json
from playwright.sync_api import sync_playwright
URL = 'http://127.0.0.1:18431/parts/motion.html'
mode = sys.argv[1] if len(sys.argv) > 1 else 'probe'
errs = []
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    pg = b.new_page(viewport={'width': 1280, 'height': 720}); pg.set_default_timeout(600000)
    pg.on('console', lambda m: errs.append('console.' + m.type + ': ' + m.text) if m.type in ('error', 'warning') else None)
    pg.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))
    pg.on('response', lambda r: errs.append('HTTP %d %s' % (r.status, r.url)) if r.status >= 400 else None)
    pg.on('requestfailed', lambda r: errs.append('requestfailed: ' + r.url))
    pg.goto(URL); pg.wait_for_function('window.__ready === true || (window.__errors && window.__errors.length)', timeout=120000)
    print('info', json.dumps(pg.evaluate('window.__info'))); print('errors', pg.evaluate('window.__errors'), errs)
    total = pg.evaluate('window.__total'); N = int(round(total * 30))
    if mode == 'probe':   # sample frames at given seconds
        secs = [float(x) for x in sys.argv[2].split(',')]; f = 0
        for s in secs:
            tgt = int(s * 30); pg.evaluate(f'window.__step({max(1, tgt - f)})'); f = max(f + 1, tgt)
            pg.screenshot(path=f'/tmp/mprobe_{s:05.1f}.png')
    elif mode == 'chunk':   # render frames [a, b) in a fresh browser (resumable; stepping is deterministic)
        a0, b0 = int(sys.argv[2]), min(int(sys.argv[3]), N); d = '/tmp/mframes'; os.makedirs(d, exist_ok=True)
        if a0 > 0: pg.evaluate(f'window.__step({a0})')
        for i in range(a0, b0):
            pg.evaluate('window.__step(1)'); pg.screenshot(path=f'{d}/f{i:04d}.png')
        print('chunk ok', a0, b0, 'of', N, flush=True)
    elif mode == 'encode':
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '30', '-i', '/tmp/mframes/f%04d.png', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-movflags', '+faststart', '/workspace/gateflow/parts/motion_demo.mp4'], check=True)
        print('video ok', N)
    else:
        d = '/tmp/mframes'; os.makedirs(d, exist_ok=True); [os.remove(os.path.join(d, x)) for x in os.listdir(d)]
        for i in range(N):
            pg.evaluate('window.__step(1)'); pg.screenshot(path=f'{d}/f{i:04d}.png')
            if i % 100 == 0: print('frame', i, '/', N, flush=True)
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '30', '-i', f'{d}/f%04d.png', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-movflags', '+faststart', '/workspace/gateflow/parts/motion_demo.mp4'], check=True)
        print('video ok', N)
    print('final errors', pg.evaluate('window.__errors'), errs)
    b.close()
