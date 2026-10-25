# Stretch-film texture (RGBA): blue-white tint, horizontal wrap bands (overlap = denser), thin specular streaks.
# v 0..0.85 = side wrap (bottom->top), v 0.85..1 = bunched top lip. Run with system python3.
import os, math, random
from PIL import Image
W, H = 32, 256
im = Image.new('RGBA', (W, H)); px = im.load(); rnd = random.Random(5)
TINT = (226, 236, 246)
NB = 9   # wrap passes over the side height
streak_rows = {int(rnd.uniform(0, 0.85) * H) for _ in range(14)}
for y in range(H):
    v = 1 - (y + 0.5) / H                       # PIL row 0 = top = v 1
    if v < 0.85:
        t = (v / 0.85) * NB; f = t - math.floor(t)
        a = 0.36 + 0.06 * math.sin(f * math.pi)          # body of each pass
        if f < 0.10 or f > 0.93: a = 0.52                  # overlap band (double film)
        if 0.10 <= f < 0.13: a = 0.46
        bright = 0.0
        if abs(f - 0.11) < 0.012: bright = 0.9             # specular edge of the overlap
    else:
        a = 0.62; bright = 0.25 * (0.5 + 0.5 * math.sin((v - 0.85) / 0.15 * math.pi * 5))
    for x in range(W):
        b = bright
        if y in streak_rows: b = max(b, 0.55 + 0.4 * rnd.random())
        n = 0.0
        c = tuple(int(min(255, ch + (255 - ch) * b)) for ch in TINT)
        px[x, y] = (*c, int(255 * min(0.8, max(0.2, a + n + 0.12 * b))))
os.makedirs('tex', exist_ok=True); im.save('tex/film_bands.png'); print('ok')
