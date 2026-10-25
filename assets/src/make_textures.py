# Generates decal textures with Pillow (system python3). Run: python3 make_textures.py
import math, os
from PIL import Image, ImageDraw, ImageFont
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tex')
os.makedirs(D, exist_ok=True)
FONT = '/usr/share/fonts/truetype/sand-box/google/Lato/Lato-Bold.ttf'
FONTB = '/usr/share/fonts/truetype/sand-box/google/Lato/Lato-Black.ttf'
BLUE = (0, 113, 206); YEL = (255, 194, 32); WHITE = (242, 241, 236)

def spark(dr, cx, cy, R, col):
    # 6 rounded petals (Walmart spark)
    for i in range(6):
        a = math.radians(90 + i * 60)
        r0, r1, w = R * 0.30, R * 1.0, R * 0.26
        ux, uy = math.cos(a), -math.sin(a)
        px, py = -uy, ux
        pts = []
        for t in range(0, 21):
            s = t / 20
            # tapered capsule: wider at outer end
            ww = w * (0.55 + 0.45 * s) / 2
            pts.append((cx + ux * (r0 + (r1 - r0) * s) + px * ww, cy + uy * (r0 + (r1 - r0) * s) + py * ww))
        for t in range(20, -1, -1):
            s = t / 20
            ww = w * (0.55 + 0.45 * s) / 2
            pts.append((cx + ux * (r0 + (r1 - r0) * s) - px * ww, cy + uy * (r0 + (r1 - r0) * s) - py * ww))
        dr.polygon(pts, fill=col)
        ex, ey = cx + ux * r1, cy + uy * r1
        dr.ellipse([ex - w / 2, ey - w / 2, ex + w / 2, ey + w / 2], fill=col)
        sx, sy = cx + ux * r0, cy + uy * r0
        dr.ellipse([sx - w * 0.29, sy - w * 0.29, sx + w * 0.29, sy + w * 0.29], fill=col)

# Trailer side: physical 16.15m x 2.85m. Draw at 4x scale proportion then resize to 2048x512
W, H = 3230, 570
im = Image.new('RGB', (W, H), WHITE)
dr = ImageDraw.Draw(im)
f = ImageFont.truetype(FONT, 250)
f2 = ImageFont.truetype(FONT, 250)
t1 = 'Walmart'; t2 = 'com'
w1 = dr.textlength(t1, font=f); w2 = dr.textlength(t2, font=f2)
gap = 40; sp = 230
total = w1 + gap + sp + gap + w2
x0 = (W - total) / 2 - 60; y0 = H * 0.5
dr.text((x0, y0), t1, font=f, fill=BLUE, anchor='lm')
spark(dr, x0 + w1 + gap + sp / 2, y0 - 6, sp * 0.55, YEL)
dr.text((x0 + w1 + gap * 2 + sp, y0), t2, font=f2, fill=BLUE, anchor='lm')
# 53' mark near rear lower corner (rear = right side of image for the left/driver side)
# thin bottom rail shadow line + top rail
dr.rectangle([0, H - 14, W, H], fill=(205, 205, 200)); dr.rectangle([0, 0, W, 10], fill=(215, 215, 210))
im.resize((2048, 512), Image.LANCZOS).save(os.path.join(D, 'trailer_side.png'))

# Trailer rear (door) small badge texture: Walmart + spark, 53'
im = Image.new('RGB', (512, 512), WHITE); dr = ImageDraw.Draw(im)
fr = ImageFont.truetype(FONT, 84)
dr.text((256, 180), 'Walmart', font=fr, fill=BLUE, anchor='mm')
spark(dr, 256, 300, 52, YEL)
dr.text((256, 430), "53'", font=ImageFont.truetype(FONTB, 70), fill=(60, 64, 70), anchor='mm')
im.save(os.path.join(D, 'trailer_rear.png'))

# Hazard stripes (yellow/black diagonal)
im = Image.new('RGB', (256, 256), (245, 197, 24)); dr = ImageDraw.Draw(im)
for k in range(-4, 8):
    x = k * 64
    dr.polygon([(x, 256), (x + 32, 256), (x + 32 + 256, 0), (x + 256, 0)], fill=(28, 28, 30))
im.save(os.path.join(D, 'hazard.png'))
im = Image.new('RGB', (128, 64), WHITE); dr = ImageDraw.Draw(im)
dr.text((64, 34), "53'", font=ImageFont.truetype(FONTB, 46), fill=(60, 64, 70), anchor='mm')
im.save(os.path.join(D, 'mark53.png'))
# Tractor cab livery (sleeper side): brand-blue panel, white wordmark + yellow spark. physical 1.03 x 0.62 m
im = Image.new('RGB', (1030, 620), BLUE); dr = ImageDraw.Draw(im)
fw = ImageFont.truetype(FONT, 215)
tw = dr.textlength('Walmart', font=fw); sp = 150; total = tw + 30 + sp
x0 = (1030 - total) / 2
dr.text((x0, 300), 'Walmart', font=fw, fill=(255, 255, 255), anchor='lm')
spark(dr, x0 + tw + 30 + sp / 2, 288, sp * 0.55, YEL)
im.resize((1024, 616), Image.LANCZOS).save(os.path.join(D, 'cab_logo.png'))
# Tractor sleeper upper: big spark on brand blue, 0.62 x 0.62 m
im = Image.new('RGB', (512, 512), BLUE); dr = ImageDraw.Draw(im)
spark(dr, 256, 256, 205, YEL)
im.save(os.path.join(D, 'cab_spark.png'))
print('ok')
# DC office facade tower decal (imgref 05): spark over white wordmark on brand blue, physical 3.6 x 4.95 m
im = Image.new('RGB', (720, 990), BLUE); dr = ImageDraw.Draw(im)
spark(dr, 360, 330, 230, YEL)
fw = ImageFont.truetype(FONT, 150)
dr.text((360, 700), 'Walmart', font=fw, fill=(255, 255, 255), anchor='mm')
im.save(os.path.join(D, 'facade_logo.png'))
# Pickup sign (blue panel, white text) 2.4 x 0.8 m
im = Image.new('RGB', (600, 200), BLUE); dr = ImageDraw.Draw(im)
dr.text((300, 100), 'Pickup', font=ImageFont.truetype(FONT, 110), fill=(255, 255, 255), anchor='mm')
im.save(os.path.join(D, 'sign_pickup.png'))
# Door number plaque W06 (white on dark grey) 0.6 x 0.3 m
im = Image.new('RGB', (256, 128), (60, 64, 70)); dr = ImageDraw.Draw(im)
dr.text((128, 66), 'W06', font=ImageFont.truetype(FONTB, 76), fill=(255, 255, 255), anchor='mm')
im.save(os.path.join(D, 'sign_w06.png'))
