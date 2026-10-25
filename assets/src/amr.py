# Goods-to-person AMR drive unit (Kiva-style): differential drive, 4 casters, lift_top turntable, emissive light strips
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
from kit import *
reset()
BODY = mat('amr_body', '#E9E7E2', 0.78); BLU = mat('brand_blue', '#0071CE', 0.75); CH = mat('amr_charcoal', '#2F3237', 0.82)
GRY = mat('amr_grey', '#8C9198', 0.65); TR = mat('tread_black', '#1D1E21', 0.88); YEL = mat('brand_yellow', '#FFC220', 0.7)
LED = mat('amr_led_cyan', '#36D6FF', 0.4, emit='#36D6FF', estr=5); LEDR = mat('amr_led_red', '#FF3B30', 0.4, emit='#FF3B30', estr=4)
L, W, H = 0.98, 0.78, 0.30     # footprint x (W) , y (L), body top (without lift)
GC = 0.03                       # ground clearance
b = []
b.append(box2('skirt', (-W / 2, -L / 2, GC), (W / 2, L / 2, GC + 0.14), CH, bev=0.05, seg=3))
b.append(box2('shell', (-W / 2 + 0.01, -L / 2 + 0.01, GC + 0.14), (W / 2 - 0.01, L / 2 - 0.01, H - 0.02), BODY, bev=0.06, seg=3))
b.append(box2('deck', (-W / 2 + 0.07, -L / 2 + 0.07, H - 0.02), (W / 2 - 0.07, L / 2 - 0.07, H), BLU, bev=0.015, seg=3))
b.append(cyl('ring', 0.3, 0.012, (0, 0, H + 0.006), CH, seg=40))
# bumpers front/back (black) with sensor windows
for sy in (-1, 1):
    y0, y1 = sorted((sy * (L / 2 - 0.004), sy * (L / 2 + 0.02)))
    b.append(box2('bump', (-W / 2 + 0.08, y0, GC + 0.03), (W / 2 - 0.08, y1, GC + 0.11), TR, bev=0.015, seg=3))
# front camera bezel + spark badge on top
b.append(box2('badge', (-0.06, -L / 2 + 0.12, H), (0.06, -L / 2 + 0.2, H + 0.004), YEL, bev=0.002))
body = join(b, 'body', pivot=(0, 0, 0))
# emissive light strips (separate node so the scene can recolour/flash)
ls = []
for sx in (-1, 1):
    x0, x1 = sorted((sx * (W / 2 - 0.005), sx * (W / 2 + 0.006)))
    ls.append(box2('ls', (x0, -L / 2 + 0.14, GC + 0.165), (x1, L / 2 - 0.14, GC + 0.19), LED, bev=0.003))
for sy in (-1, 1):
    y0, y1 = sorted((sy * (L / 2 - 0.005), sy * (L / 2 + 0.006)))
    ls.append(box2('ls', (-W / 2 + 0.14, y0, GC + 0.165), (W / 2 - 0.14, y1, GC + 0.19), LED if sy < 0 else LEDR, bev=0.003))
strips = join(ls, 'light_strip', pivot=(0, 0, GC + 0.18))
# lift top: turntable disk that rises 0..0.06 m and rotates to keep pods still
lt = [cyl('lt', 0.28, 0.04, (0, 0, H + 0.032), GRY, seg=40, bev=0.008),
      cyl('lt_pad', 0.22, 0.008, (0, 0, H + 0.056), CH, seg=40, bev=0.002)]
for a in range(4):
    x, y = 0.2 * math.cos(R(45 + 90 * a)), 0.2 * math.sin(R(45 + 90 * a))
    lt.append(cyl('fid', 0.022, 0.004, (x, y, H + 0.062), YEL, seg=12))
lift = join(lt, 'lift_top', pivot=(0, 0, H + 0.012))
# drive wheels (centre, differential) + 4 casters
wl = {nm: puwheel(nm, sx * (W / 2 - 0.1), 0.0, 0.075, 0.05, TR, GRY, seg=24) for nm, sx in (('wheel_L', 1), ('wheel_R', -1))}
casters = {}
for nm, sx, sy in (('FL', 1, -1), ('FR', -1, -1), ('RL', 1, 1), ('RR', -1, 1)):
    x, y = sx * (W / 2 - 0.12), sy * (L / 2 - 0.14)
    cw = puwheel('caster_wheel_' + nm, x, y + 0.02, 0.03, 0.025, TR, GRY, seg=16)
    yk = yoke('caster_' + nm, x, y + 0.02, 0.03, 0.025, GC + 0.06, CH, GRY)
    # yoke origin at the swivel axis (above the axle, offset 0.02 ahead -> trail)
    yk2 = join([yk], 'caster_' + nm, pivot=(x, y, 0.03))
    casters[nm] = (yk2, cw)
root = empty('amr')
parent(body, root); parent(strips, body); parent(lift, body)
for w in wl.values(): parent(w, body)
for yk, cw in casters.values(): parent(yk, body); parent(cw, yk)
export('amr', dict(
    facing='+Z (front bumper with the cyan strip; rear strip is red)', refs=['14_iso_cutaway_orange_base.jpg', '18_topdown_warehouse_blue_stripe.jpg'],
    dims={'footprint_m': [W, L], 'body_height_m': H, 'lift_stroke_m': 0.06},
    hierarchy='amr > body > {light_strip, lift_top, wheel_L, wheel_R, caster_FL > caster_wheel_FL, caster_FR > ..., caster_RL > ..., caster_RR > ...}',
    rig={'drive': 'differential: spin wheel_L / wheel_R about local X (r=0.075 m); turn in place by spinning them opposite',
         'casters': 'caster_* swivel about local Y (origin on the swivel axis, 0.02 m trail); caster_wheel_* spin about local X (r=0.03 m)',
         'lift_top': 'translate +Y 0..0.06 m to lift a pod; rotate about Y to counter-rotate the pod while the robot spins',
         'light_strip': 'emissive (amr_led_cyan front/sides, amr_led_red rear); set toneMapped=false and pulse emissiveIntensity'},
    nodes={'body': 'chassis, origin ground centre', 'wheel_*': 'origin on axle centre', 'lift_top': 'origin at the lift base'}))
render('amr', view=(1.0, -1.2, 0.8))
closeups('amr', [('caster', (W / 2 - 0.12, -L / 2 + 0.14, 0.05, 0.2), (0.9, -1.0, 0.25))])
