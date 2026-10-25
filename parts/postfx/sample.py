# python3 sample.py -> samples.json : dE00 of rendered wordmark blue / spark yellow vs brand hex
import json, colorsys, numpy as np
from PIL import Image
def srgb2lab(c):
    c = np.asarray(c, float) / 255; c = np.where(c > 0.04045, ((c + 0.055) / 1.055) ** 2.4, c / 12.92)
    M = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]]); xyz = M @ c / np.array([0.95047, 1, 1.08883])
    f = np.where(xyz > 216 / 24389, np.cbrt(xyz), (24389 / 27 * xyz + 16) / 116); return np.array([116 * f[1] - 16, 500 * (f[0] - f[1]), 200 * (f[1] - f[2])])
def de00(l1, l2):
    L1, a1, b1 = l1; L2, a2, b2 = l2; C1 = np.hypot(a1, b1); C2 = np.hypot(a2, b2); Cb = (C1 + C2) / 2
    G = 0.5 * (1 - np.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7))); a1p, a2p = (1 + G) * a1, (1 + G) * a2
    C1p, C2p = np.hypot(a1p, b1), np.hypot(a2p, b2); h1 = np.degrees(np.arctan2(b1, a1p)) % 360; h2 = np.degrees(np.arctan2(b2, a2p)) % 360
    dL = L2 - L1; dC = C2p - C1p; dh = h2 - h1
    if C1p * C2p == 0: dh = 0
    elif dh > 180: dh -= 360
    elif dh < -180: dh += 360
    dH = 2 * np.sqrt(C1p * C2p) * np.sin(np.radians(dh / 2)); Lb = (L1 + L2) / 2; Cbp = (C1p + C2p) / 2
    hb = (h1 + h2) / 2 if abs(h1 - h2) <= 180 else (h1 + h2 + 360) / 2 if h1 + h2 < 360 else (h1 + h2 - 360) / 2
    if C1p * C2p == 0: hb = h1 + h2
    T = 1 - 0.17 * np.cos(np.radians(hb - 30)) + 0.24 * np.cos(np.radians(2 * hb)) + 0.32 * np.cos(np.radians(3 * hb + 6)) - 0.2 * np.cos(np.radians(4 * hb - 63))
    dT = 30 * np.exp(-((hb - 275) / 25) ** 2); RC = 2 * np.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7))
    SL = 1 + 0.015 * (Lb - 50) ** 2 / np.sqrt(20 + (Lb - 50) ** 2); SC = 1 + 0.045 * Cbp; SH = 1 + 0.015 * Cbp * T; RT = -np.sin(np.radians(2 * dT)) * RC
    return float(np.sqrt((dL / SL) ** 2 + (dC / SC) ** 2 + (dH / SH) ** 2 + RT * (dC / SC) * (dH / SH)))
hx = lambda h: [int(h[i:i + 2], 16) for i in (1, 3, 5)]
runs = json.load(open('runs.json')); out = {}
for tag, r in runs.items():
    if not r.get('info'): continue
    x0, y0, x1, y1 = r['info']['logo']; im = np.asarray(Image.open(tag + '.png').convert('RGB'))[max(0, y0):y1, max(0, x0):x1].reshape(-1, 3)
    hsv = np.array([colorsys.rgb_to_hsv(*(p / 255)) for p in im])
    res = {}
    for name, target, hlo, hhi in [('wordmark', '#0071CE', 0.53, 0.64), ('spark', '#FFC220', 0.09, 0.18)]:
        sel = im[(hsv[:, 0] > hlo) & (hsv[:, 0] < hhi) & (hsv[:, 1] > 0.6) & (hsv[:, 2] > 0.5)]
        if len(sel) < 20: res[name] = {'n': int(len(sel))}; continue
        # core pixels: drop AA fringe by keeping the most saturated 50%
        s = np.array([colorsys.rgb_to_hsv(*(p / 255))[1] for p in sel]); core = sel[s >= np.median(s)]
        med = np.median(core, axis=0).round().astype(int); h = '#%02X%02X%02X' % tuple(med)
        res[name] = {'n': int(len(sel)), 'rendered': h, 'target': target, 'dE00': round(de00(srgb2lab(med), srgb2lab(hx(target))), 2)}
    sw = np.asarray(Image.open(tag + '.png').convert('RGB'))
    for (x, y), name, target in zip(r['info'].get('swatch', []), ['swatchBlue', 'swatchSpark', 'swatchNavy'], ['#0071CE', '#FFC220', '#041E42']):
        med = np.median(sw[y - 4:y + 5, x - 4:x + 5].reshape(-1, 3), axis=0).round().astype(int)
        res[name] = {'rendered': '#%02X%02X%02X' % tuple(med), 'target': target, 'dE00': round(de00(srgb2lab(med), srgb2lab(hx(target))), 2)}
    out[tag] = res; print(tag, res)
# navy check via a flat swatch is reported from the swatch probe when present
json.dump(out, open('samples.json', 'w'), indent=1)
