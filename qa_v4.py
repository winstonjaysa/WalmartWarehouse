import asyncio, sys, json
from playwright.async_api import async_playwright
# usage: qa_v4.py URLPATH W H DPR mobile(0/1) shot.png [secs] [simsecs]
path, W, H, DPR, MOB, SHOT = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), float(sys.argv[4]), sys.argv[5] == '1', sys.argv[6]
SECS = float(sys.argv[7]) if len(sys.argv) > 7 else 4
SIM = float(sys.argv[8]) if len(sys.argv) > 8 else 0
URL = 'http://localhost:8799/' + path
LAYOUT = r'''() => {
 const vw = innerWidth, vh = innerHeight, out = { vw, vh, scrollW: document.documentElement.scrollWidth, bodyScrollW: document.body.scrollWidth, small: [], offscreen: [], overlaps: [] };
 const vis = (el) => { const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
 const all = [...document.querySelectorAll('body *')].filter((e) => !['SCRIPT','STYLE','svg','use','path','CANVAS'].includes(e.tagName) && !e.closest('svg'));
 for (const el of all) { if (!vis(el)) continue; let hidden = false; for (let p = el; p; p = p.parentElement) { if (p !== el && p.nodeType === 1 && !vis(p) && p !== document.body && p !== document.documentElement) { hidden = true; break; } } if (hidden) continue;
   const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()); const r = el.getBoundingClientRect(); const fs = parseFloat(getComputedStyle(el).fontSize);
   if (own && fs < 11) out.small.push([el.tagName + (el.id ? '#' + el.id : '') + '.' + String(el.className).slice(0, 30), fs, el.textContent.trim().slice(0, 20)]);
   if (own && (r.right > vw + 1 || r.left < -1 || r.bottom > vh + 1) ) { let clip = false; for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { const ov = getComputedStyle(p); if (/(auto|scroll|hidden)/.test(ov.overflowX + ov.overflowY)) { clip = true; break; } } const fx = getComputedStyle(el).position; out.offscreen.push([el.tagName + '.' + String(el.className).slice(0, 30) + (el.id ? '#' + el.id : ''), Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom), clip ? 'in-scroller' : '', el.textContent.trim().slice(0, 18)]); }
 }
 // top-level UI panels overlap
 const panels = [...document.querySelectorAll('body > .ui, body > nav, body > aside, body > header, .gf-cam, .gf-explore, #gfLoad, .sheet, [class*="mission"]')].filter(vis);
 const rr = panels.map((e) => [e, e.getBoundingClientRect()]);
 for (let i = 0; i < rr.length; i++) for (let j = i + 1; j < rr.length; j++) { const [a, A] = rr[i], [b, B] = rr[j]; if (a.contains(b) || b.contains(a)) continue; const ix = Math.min(A.right, B.right) - Math.max(A.left, B.left), iy = Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top); if (ix > 2 && iy > 2) out.overlaps.push([a.tagName + '.' + String(a.className).slice(0, 25) + '#' + a.id, b.tagName + '.' + String(b.className).slice(0, 25) + '#' + b.id, Math.round(ix), Math.round(iy)]); }
 out.panels = rr.map(([e, r]) => [e.tagName + '.' + String(e.className).slice(0, 25) + '#' + e.id, Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)]);
 out.quality = window.__quality; return out; }'''
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        ctx = await b.new_context(viewport={'width': W, 'height': H}, device_scale_factor=DPR, is_mobile=MOB, has_touch=MOB)
        pg = await ctx.new_page(); logs = []
        pg.on('console', lambda m: logs.append(f'{m.type}: {m.text}'))
        pg.on('pageerror', lambda e: logs.append('PAGEERROR ' + str(e)))
        await pg.goto(URL, wait_until='commit', timeout=120000)
        await pg.wait_for_function('window.__ready===true', timeout=300000)
        if SIM: await pg.evaluate(f'window.__step && window.__step({SIM})')
        await pg.wait_for_timeout(int(SECS * 1000))
        lay = await pg.evaluate(LAYOUT)
        await pg.screenshot(path=SHOT)
        errs = [l for l in logs if l.startswith('error') or l.startswith('PAGEERROR')]
        warns = [l for l in logs if l.startswith('warning')]
        mods = [l for l in logs if '[gf]' in l and ('module' in l or 'postfx' in l or 'sorter' in l or 'rackCartons' in l or 'GL:' in l)]
        print(json.dumps({'errors': errs[:30], 'nerr': len(errs), 'warnings': warns[:25], 'nwarn': len(warns), 'mods': mods, 'layout': lay}, indent=1))
        await b.close()
asyncio.run(main())
