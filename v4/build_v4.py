import pathlib, subprocess, json, re, datetime, urllib.request, xml.etree.ElementTree as ET, shutil
R = pathlib.Path('/workspace/gateflow'); V = R/'v4'
parts = [(V/f).read_text() for f in ['a1_core.js','a2_static.js','a3_inst.js','a4_sim.js','a5_brains.js','a6_render.js','a7_ui.js']]
names = ['a3','a4','a5','a6','a7']
main = parts[0] + '\nawait __yield("a1");\n' + parts[1] + '\nawait __yield("a2"); await __compile(2500); __earlyPaint(); __mark("paint"); await __yield("p");\n' + ''.join(parts[2+i] + f'\nawait __yield("{names[i]}");\n' for i in range(5))
(V/'main.js').write_text(main)
subprocess.run([str(V/'node_modules/.bin/esbuild'), str(V/'main.js'), '--bundle', '--format=esm', '--external:three', '--external:three/addons/*', '--target=es2022', '--minify-syntax', '--minify-whitespace', '--outfile=' + str(V/'out.js')], check=True)
js = (V/'out.js').read_text().replace('</script', '<\\/script')
# news.json baked at build time: headlines + links only
news = {'items': [], 'date': ''}
try:
    req = urllib.request.Request('https://news.google.com/rss/search?q=Walmart+Canada&hl=en-CA&gl=CA&ceid=CA:en', headers={'User-Agent': 'Mozilla/5.0'})
    x = urllib.request.urlopen(req, timeout=15).read()
    root = ET.fromstring(x)
    for it in root.iter('item'):
        t, l = it.findtext('title') or '', it.findtext('link') or ''
        if t and l.startswith('https://'): news['items'].append({'title': t, 'link': l})
        if len(news['items']) >= 5: break
    news['date'] = datetime.date.today().isoformat()
except Exception as e: print('news fetch failed:', e)
(V/'news.json').write_text(json.dumps(news, indent=1))
nj = json.dumps(news).replace('</', '<\\/')
html = f'''<!doctype html><html lang="en-CA"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Backroom · a night of receiving &amp; stocking (concept demo)</title><meta name="description" content="A visual story of a Walmart Canada store backroom: receiving, sorting and overnight stocking. Concept demo, not affiliated with Walmart Inc.">
<style>{(V/'style.css').read_text()}</style>
<script type="importmap">{{"imports":{{"three":"https://unpkg.com/three@0.160.0/build/three.module.js","three/addons/":"https://unpkg.com/three@0.160.0/examples/jsm/"}}}}</script>
</head><body>
{(V/'body.html').read_text()}
<script type="application/json" id="newsData">{nj}</script>
<script type="module">{js}</script>
</body></html>'''
out = R/'builds/walmart-store_v4.html'; out.write_text(html); shutil.copy(out, R/'index.html')
print('built', out, len(html)//1024, 'KB; news items', len(news['items']))
