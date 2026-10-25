import re, pathlib, time, datetime
R = pathlib.Path('/workspace/gateflow')
chrome = pathlib.Path('/home/box/shared/walmart-dc/chrome.html').read_text()
models = (R/'parts/models.js').read_text()
models = '\n'.join(l for l in models.split('\n') if not l.startswith('import '))
EXPORTS = ', '.join(dict.fromkeys(re.findall(r'^export (?:function|const|let|class) (\w+)', models, flags=re.M)))
models = re.sub(r'^export (function|const|let|class)', r'\1', models, flags=re.M)
def soft(src, old, new):
    if old not in src: print('  (model patch skipped, upstream changed):', old[:60]); return src
    return src.replace(old, new)
def must(src, old, new, cnt=1):
    n = src.count(old)
    if n < 1: raise SystemExit('PATCH MISSING: ' + old[:80])
    return src.replace(old, new) if cnt == 0 else src.replace(old, new, cnt)
# --- model patches (to be upstreamed to parts/models.js by raptor) ---
models = must(models, "const mast = makeMast({ H0: 2.1, half: 0.33, forkLen: 1.07, maxH: 3.0 });", "const mast = makeMast({ H0: opts.mastH0 ?? 2.1, half: 0.33, forkLen: 1.07, maxH: opts.maxH ?? 3.0 });") if "forkLen: 1.07, maxH: 3.0" in models else models
# B19 reach truck lift: beams at 7.00 / 8.75 m need ~9 m
models = soft(models, "maxH: opts.maxForkHeight ?? 6.5", "maxH: opts.maxForkHeight ?? 9.0")
# B20 trapezoidal lift profile, lands exactly on target (v <= 0.5 m/s, a = 0.5 m/s^2)
models = soft(models, "step(dt) { st.h = damp(st.h, st.target, 3.2, dt); apply(); } };",
  "step(dt) { const d = st.target - st.h; if (Math.abs(d) < 1e-4) { st.h = st.target; st.v = 0; apply(); return; } const vd = Math.sign(d) * Math.min(LIFT_V, Math.sqrt(2 * LIFT_A * Math.abs(d))); const vv = st.v || 0; st.v = vv + THREE.MathUtils.clamp(vd - vv, -LIFT_A * dt * 2, LIFT_A * dt * 2); if (Math.sign(st.v) !== Math.sign(d)) st.v = vd; const s = st.v * dt; if (Math.abs(s) >= Math.abs(d)) { st.h = st.target; st.v = 0; } else st.h += s; apply(); } };")
models = soft(models, "const OVERLAP = 0.4;", "const OVERLAP = 0.4, LIFT_V = 0.5, LIFT_A = 0.5;")
# tilt: rate-limited linear, exact arrival
models = models.replace("ud.tilt = damp(ud.tilt, ud.tiltTarget, 3, dt);", "{ const dT = ud.tiltTarget - ud.tilt, mx = 0.12 * dt; ud.tilt = Math.abs(dT) <= mx ? ud.tiltTarget : ud.tilt + Math.sign(dT) * mx; }")
# B21 carried load seated on tine top: pallet top-deck underside (0.122) on tine top (0.048)
models, n = re.subn(r"loadG\.position\.set\(0, 0\.05, ", "loadG.position.set(0, 0.048 - 0.122, ", models)

app = ''.join((R/f'src/app{i}.js').read_text() + f'\nawait __yield({i * 12}, "{["","scene","environment","racks & conveyors","vehicles","simulation","fleet & people","post"][i]}");\n' for i in range(1, 8))
def strip_comments(js):
    js = re.sub(r'^[ \t]*/\*\*(?:(?!\*/)[\s\S])*\*/[ \t]*\n', '', js, flags=re.M)   # block comments that start a line
    js = re.sub(r'^\s*//.*\n', '', js, flags=re.M)                      # full-line // comments
    return js
def cooker(name):
    src = (R/f'parts/cooker/{name}.js').read_text()
    src = '\n'.join(l for l in src.split('\n') if not l.startswith('import '))
    names = re.findall(r'^export (?:function|const|let|class) (\w+)', src, flags=re.M) + [n.strip() for m in re.findall(r'^export \{([^}]*)\};?', src, flags=re.M) for n in m.split(',')]
    src = re.sub(r'^export \{[^}]*\};?', '', src, flags=re.M); src = re.sub(r'^export (function|const|let|class)', r'\1', src, flags=re.M)
    return strip_comments(src), ', '.join(dict.fromkeys(names))
CK = {n: cooker(n) for n in ['signs', 'wrapper'] if (R/f'parts/cooker/{n}.js').exists()}
COOKER = ''.join(f"const COOKER_{n.upper()} = (() => {{\n{re.sub(r"</(script)", r"<\\/\1", js, flags=re.I)}\nreturn {{ {ex} }};\n}})();\n" for n, (js, ex) in CK.items())
models = strip_comments(models); app = strip_comments(app)
esc = lambda s: re.sub(r'</(script)', r'<\\/\1', s, flags=re.I)
models = esc(models); app = esc(app)
# --- chrome patches: dock ids match the sim (DR-001..008 / DS-101..108), no AMR demo content ---
for a, b in [('DR-012', 'DR-005'), ('DR-019', 'DR-003'), ('DS-147', 'DS-103'), ('DS-131', 'DS-105'), ('DR012', 'DR005'), ('14-032-C-2', '04-016-C-2'), ('22-041-D-1', '06-021-D-1'), ('07-118-A-1', '02-011-A-1'), ('aisle 14', 'aisle 04'), ('aisle 22', 'aisle 06'), ('RES aisle 14', 'RES aisle 04')]:
    chrome = chrome.replace(a, b)
chrome = '\n'.join(l for l in chrome.split('\n') if not re.search(r"g: 'AMR'|INFO AMR|WARN AMR|BATTERY_LOW|\['INFO', 'AMR'", l))
MOBILE_CSS = '''
<style id="gf-extra">
#gfLoad{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:3;min-width:260px;padding:14px 18px;border-radius:14px;background:rgba(255,255,255,.86);box-shadow:0 8px 30px rgba(4,30,66,.18);font:600 13px Inter,Arial,sans-serif;color:#041E42;text-align:center}
#gfLoad .bar{height:6px;border-radius:3px;background:#dfe7f1;margin-top:10px;overflow:hidden}#gfLoad .bar i{display:block;height:100%;width:0;background:#0071CE;transition:width .2s}
#gfLoad.err{background:#fff4f2;color:#9b1c10}#gfLoad.err .bar{display:none}
</style>
'''
html = must(chrome, '</head>', MOBILE_CSS + '</head>')
html = must(html, '<div class="scene-hint" id="sceneHint">', '<canvas id="gl" style="position:absolute;inset:0;width:100%;height:100%;display:block"></canvas>\n  <div id="gfLoad">Loading 3D scene…<div class="bar"><i></i></div></div>\n  <div class="scene-hint" id="sceneHint">')
BOOT = '''<script>
// boot watchdog: visible error if Three.js / addons fail to load from the CDN (M16)
window.__glBoot = 0;
window.__gfFail = function (msg) { var el = document.getElementById('gfLoad'); if (!el) return; el.className = 'err'; el.innerHTML = '3D view unavailable<br><small style="font-weight:500">' + msg + '</small>'; };
window.addEventListener('error', function (e) { if (!window.__glBoot && e && e.target && e.target.tagName === 'SCRIPT') window.__gfFail('Could not load Three.js from unpkg.com. Check your connection and reload.'); }, true);
setTimeout(function () { if (!window.__glBoot) window.__gfFail('Three.js did not load within 20 s (CDN unreachable?). The dashboard panels still work.'); }, 20000);
</script>'''
script = f'''
{BOOT}
<script type="importmap">{{"imports":{{"three":"https://unpkg.com/three@0.160.0/build/three.module.js","three/addons/":"https://unpkg.com/three@0.160.0/examples/jsm/"}}}}</script>
<script type="module" onerror="window.__gfFail && window.__gfFail('Three.js module failed to load from the CDN.')">
import * as THREE from 'three';
import {{ OrbitControls }} from 'three/addons/controls/OrbitControls.js';
import {{ RoundedBoxGeometry }} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {{ mergeGeometries }} from 'three/addons/utils/BufferGeometryUtils.js';
import {{ EffectComposer }} from 'three/addons/postprocessing/EffectComposer.js';
import {{ RenderPass }} from 'three/addons/postprocessing/RenderPass.js';
import {{ GTAOPass }} from 'three/addons/postprocessing/GTAOPass.js';
import {{ OutlinePass }} from 'three/addons/postprocessing/OutlinePass.js';
import {{ SMAAPass }} from 'three/addons/postprocessing/SMAAPass.js';
import {{ OutputPass }} from 'three/addons/postprocessing/OutputPass.js';
window.__glBoot = 1;
window.POST = {{ EffectComposer, RenderPass, GTAOPass, OutlinePass, SMAAPass, OutputPass }};
const __gfl = document.getElementById('gfLoad');
async function __yield(pct, label) {{ if (__gfl) {{ __gfl.firstChild.textContent = 'Loading 3D scene · ' + label + '…'; __gfl.querySelector('i').style.width = pct + '%'; }} await new Promise((r) => setTimeout(r, 0)); }}
try {{
const MODELS = (() => {{
{models}
return {{ {EXPORTS} }};
}})();
{COOKER}
await __yield(8, 'models');
{app}
}} catch (e) {{ console.error(e); window.__gfFail && window.__gfFail('Scene failed to build: ' + (e && e.message)); }}
</script>
'''
html = must(html, '</body>', script + '\n</body>')
out = R/'walmart-dc.html'; out.write_text(html)
print('ok', len(html.encode()), datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%SZ'))
