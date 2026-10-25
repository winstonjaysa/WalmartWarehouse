# Walmart DC office facade: tilt-up panels, blue spark tower, blue band, glazed entrance + canopy, bollards (imgref 05, 16, 17)
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
reset()
PAN = mat('facade_panel', '#CFCFCB', 0.88); BASE = mat('facade_base_grey', '#8E9399', 0.85); JNT = mat('facade_joint', '#B9BBBD', 0.9)
BLU = mat('brand_blue', '#0071CE', 0.75); YEL = mat('brand_yellow', '#FFC220', 0.7)
GLS = mat('glass_tint', '#5E7E9A', 0.25); MUL = mat('mullion_dark', '#3A3E44', 0.6); WHT = mat('canopy_white', '#F2F2EF', 0.8)
LOGO = mat('brand_facade_logo', '#ffffff', 0.75, tex=os.path.join(TEX, 'facade_logo.png'))
PICK = mat('brand_sign_pickup', '#ffffff', 0.75, tex=os.path.join(TEX, 'sign_pickup.png'))
W06 = mat('sign_w06', '#ffffff', 0.75, tex=os.path.join(TEX, 'sign_w06.png'))
DOORM = mat('door_grey', '#6B7077', 0.75)
WL, WH, WT = 32.0, 12.0, 0.4      # wall length (x), height, thickness; front face at y=0 (Blender -Y = glTF +Z)
x0, x1 = -WL / 2, WL / 2
s = []
wall = box2('wall', (x0, 0.0, 0.0), (x1, WT, WH), PAN, bev=0.03, seg=2)
boolean(wall, box2('_cut', (6.0, -0.5, -0.5), (12.0, WT + 0.5, 4.6), PAN)); s.append(wall)
s.append(box2('coping', (x0 - 0.02, -0.06, WH), (x1 + 0.02, WT + 0.02, WH + 0.15), JNT, bev=0.02))
# dark base band 0..4.0 (proud 5 mm), panel joints every 4 m (proud 3 mm)
GX0, GX1 = 6.0, 12.0   # glazed entrance span (x)
for a, b in ((x0 + 0.01, -10.6), (-6.4, -2.4), (-1.4, GX0), (GX1, x1 - 0.01)):
    s.append(box2('base', (a, -0.005, 0.0), (b, 0.0, 4.0), BASE))
for i in range(1, 8):
    x = x0 + i * 4.0
    if -11.0 < x < -6.0 or GX0 - 0.2 < x < GX1 + 0.2: continue
    s.append(box2('joint', (x - 0.012, -0.008, 0.004), (x + 0.012, -0.002, WH), JNT))
for z in (4.0, 8.0):
    for a, b in ((x0 + 0.01, -10.6), (-6.4, GX0 - 0.15), (GX1 + 0.15, x1 - 0.01)):
        s.append(box2('hjoint', (a, -0.008, z - 0.012), (b, -0.006, z + 0.012), JNT))
# blue spark tower (proud 0.3 m, taller than parapet)
TX0, TX1 = -10.6, -6.4
s.append(box2('tower', (TX0, -0.3, 0.0), (TX1, 0.0, WH + 1.5), BLU, bev=0.04, seg=3))
s.append(quad('logo', [(TX0 + 0.3, -0.306, 6.4), (TX1 - 0.3, -0.306, 6.4), (TX1 - 0.3, -0.306, 11.35), (TX0 + 0.3, -0.306, 11.35)], LOGO))
# blue horizontal band + drop to grade
s.append(box2('band', (TX1, -0.06, 5.4), (x1 - 0.01, 0.0, 6.2), BLU, bev=0.01))
s.append(box2('drop', (-2.4, -0.06, 0.0), (-1.4, 0.0, 5.4), BLU, bev=0.01))
# glazed entrance (recessed 0.35 m into the wall) with mullions + sliding doors
s.append(box2('recess_back', (GX0, 0.35, 0.0), (GX1, WT + 0.02, 4.6), MUL))
gl = box2('glass', (GX0 + 0.15, 0.3, 0.0), (GX1 - 0.15, 0.33, 4.5), GLS); s.append(gl)
for i in range(7):
    x = GX0 + 0.19 + i * (GX1 - GX0 - 0.38) / 6
    s.append(box2('mull', (x - 0.04, 0.26, 0.0), (x + 0.04, 0.3, 4.5), MUL))
for z in (2.6, 4.46):
    s.append(box2('trans', (GX0 + 0.17, 0.265, z - 0.04), (GX1 - 0.17, 0.295, z), MUL))
for sx in (-1, 1):   # entrance jamb returns
    xx = GX0 if sx < 0 else GX1
    s.append(box2('jamb', (xx if sx < 0 else xx - 0.15, -0.02, 0.0), (xx + 0.15 if sx < 0 else xx, 0.35, 4.6), BLU, bev=0.01))
s.append(box2('head', (GX0 - 0.15, -0.02, 4.55), (GX1 + 0.15, 0.35, 5.4), BLU, bev=0.01))
# canopy: blue fascia slab on 2 posts, white soffit
CY = -3.0
s.append(box2('canopy', (GX0 - 0.6, CY, 4.2), (GX1 + 0.6, -0.001, 4.75), BLU, bev=0.03, seg=3))
s.append(box2('soffit', (GX0 - 0.55, CY + 0.05, 4.19), (GX1 + 0.55, -0.05, 4.2), WHT))
for x in (GX0 - 0.3, GX1 + 0.3):
    s.append(cyl('post', 0.1, 4.19, (x, CY + 0.3, 4.19 / 2), WHT, seg=16, bev=0.01))
# Pickup sign + service door W06
s.append(box2('pick_bx', (14.0 - 1.25, -0.12, 6.5), (14.0 + 1.25, 0.0, 7.35), BLU, bev=0.02))
s.append(quad('pick', [(12.8, -0.123, 6.53), (15.2, -0.123, 6.53), (15.2, -0.123, 7.32), (12.8, -0.123, 7.32)], PICK))
DX = -13.2
s.append(box2('sdoor', (DX - 0.5, -0.04, 0.003), (DX + 0.5, -0.01, 2.2), DOORM, bev=0.01))
s.append(box2('sframe', (DX - 0.58, -0.03, 0.0), (DX + 0.58, -0.005, 2.28), MUL, bev=0.005))
s.append(quad('w06', [(DX - 0.3, -0.046, 2.45), (DX + 0.3, -0.046, 2.45), (DX + 0.3, -0.046, 2.75), (DX - 0.3, -0.046, 2.75)], W06))
s.append(box2('w06bx', (DX - 0.32, -0.045, 2.43), (DX + 0.32, -0.005, 2.77), MUL, bev=0.004))
s.append(box2('lamp', (DX - 0.12, -0.18, 2.95), (DX + 0.12, -0.005, 3.1), MUL, bev=0.01))
walls = join(s, 'facade', pivot=(0, 0, 0))
# bollards in front of the entrance (separate node so they can be hidden)
bl = []
for i in range(9):
    x = GX0 - 1.0 + i * (GX1 - GX0 + 2.0) / 8
    bl.append(cyl('bol', 0.11, 1.05, (x, CY - 0.8, 0.525), YEL, seg=16, bev=0.03, bseg=3))
    bl.append(cyl('bolb', 0.112, 0.06, (x, CY - 0.8, 0.85), mat('reflect_band', '#2B2D31', 0.6), seg=16))
bol = join(bl, 'bollards', pivot=(0, CY - 0.8, 0))
root = empty('walmart_facade')
parent(walls, root); parent(bol, root)
export('walmart_facade', dict(
    facing='+Z = street/parking side; the wall back face is 0.4 m behind the origin (toward -Z)',
    refs=['05_facade_logo_parking.jpg', '16_supercentre_facade.webp', '17_supercentre_entrance_bollards.jpg'],
    dims={'wall_m': [WL, WH, WT], 'tower_m': [TX1 - TX0, WH + 1.5, 0.7], 'entrance_glazing_m': [GX1 - GX0, 4.5], 'canopy_depth_m': 3.0},
    hierarchy='walmart_facade > {facade, bollards}',
    nodes={'facade': 'tilt-up panel wall with base band, joints, blue spark tower (logo decal), blue band, glazed entrance, canopy, Pickup sign, W06 service door; origin at ground on the front wall line, centre',
           'bollards': '9 yellow bollards 1.05 m in front of the canopy'}))
render('walmart_facade', view=(0.75, -1.25, 0.35), lens=40)
closeups('walmart_facade', [('tower', (-8.5, -0.3, 9.0, 3.0), (0.5, -1.0, 0.2)), ('entrance', (9.0, -1.5, 2.5, 4.0), (0.6, -1.0, 0.3))])
