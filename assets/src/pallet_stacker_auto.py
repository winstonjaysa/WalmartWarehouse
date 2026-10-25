# Autonomous pallet stacker (orange / charcoal) matched to imgref/01_interior_dock_forklifts.jpg (foreground unit) + 14
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
reset()
OR = mat('stacker_orange', '#F07A1A', 0.72); CH = mat('stacker_charcoal', '#2E3136', 0.82); BK = mat('stacker_black', '#18191B', 0.85)
GRY = mat('stacker_grey', '#7B8088', 0.7); STL = mat('fork_steel', '#3A3D42', 0.5); WHT = mat('decal_white', '#F4F4F2', 0.7)
BLUE = mat('brand_blue', '#0071CE', 0.65); YEL = mat('brand_yellow', '#FFC220', 0.6)
CYAN = mat('strip_cyan', '#38E0FF', 0.4, emit='#30D8FF', estr=5); REDL = mat('estop_red', '#E3262B', 0.55)
BLUEL = mat('beacon_blue', '#3C8CFF', 0.35, emit='#3C8CFF', estr=6); GLS = mat('sensor_glass', '#1A2430', 0.25)
PU = mat('pu_wheel', '#D9A520', 0.75); TY = mat('tyre', '#26272B', 0.92)

def rrect(y0, y1, z0, z1, r, n=5, corners=(1, 1, 1, 1)):
    """rounded rectangle profile in (y,z); corners = (front-bottom, rear-bottom, rear-top, front-top) radii flags"""
    pts = []
    cs = [((y0 + r, z0 + r), 180, 270), ((y1 - r, z0 + r), 270, 360), ((y1 - r, z1 - r), 0, 90), ((y0 + r, z1 - r), 90, 180)]
    raw = [(y0, z0), (y1, z0), (y1, z1), (y0, z1)]
    for k, ((cy, cz), a0, a1) in enumerate(cs):
        if corners[k]:
            for i in range(n + 1):
                a = R(a0 + (a1 - a0) * i / n); pts.append((cy + r * math.cos(a), cz + r * math.sin(a)))
        else: pts.append(raw[k])
    return pts

body = []
# chassis (charcoal) - front at -Y
body.append(prism('chassis', rrect(-0.32, 1.05, 0.07, 0.44, 0.08), -0.54, 0.54, CH, bev=0.04, seg=3))
body.append(box2('rearbump', (-0.5, 1.03, 0.1), (0.5, 1.1, 0.3), BK, bev=0.03, seg=3))
# orange shell with a rounded front-top shoulder
body.append(prism('shell', rrect(-0.28, 0.98, 0.42, 1.28, 0.16, corners=(0, 0, 1, 1)), -0.5, 0.5, OR, bev=0.05, seg=4))
# charcoal recessed side panel + top deck
for sx in (-1, 1):
    body.append(prism('sidepanel', rrect(0.12, 0.86, 0.55, 1.06, 0.06), sx * 0.5 - 0.012, sx * 0.5 + 0.012, CH, bev=0.006))
    # white decal stripe and blue/yellow spark badge on the orange flank
    body.append(prism('decal', [(-0.2, 1.12), (0.75, 1.12), (0.75, 1.16), (-0.2, 1.16)], sx * 0.5 - 0.004, sx * 0.5 + 0.004, WHT))
    body.append(cyl('badge', 0.065, 0.012, (sx * 0.505, -0.02, 0.86), BLUE, 'X', seg=20))
    for i in range(6):
        a = R(i * 60 + 90); bx = sx * 0.512
        body.append(bar('petal', (bx, -0.02 + math.cos(a) * 0.014, 0.86 + math.sin(a) * 0.014), (bx, -0.02 + math.cos(a) * 0.05, 0.86 + math.sin(a) * 0.05), 0.004, 0.018, YEL))
    # side safety scanner window
    body.append(box2('sidescan', (sx * 0.545 - 0.01, 0.92, 0.2), (sx * 0.545 + 0.01, 1.02, 0.3), GLS, bev=0.004))
body.append(box2('topdeck', (-0.44, 0.0, 1.27), (0.44, 0.9, 1.3), CH, bev=0.01))
# compute / battery tower behind (black box with handle + screen)
body.append(box2('tower', (0.02, 0.5, 1.28), (0.47, 0.97, 1.78), BK, bev=0.04, seg=3))
body.append(box2('screen', (0.08, 0.485, 1.48), (0.4, 0.5, 1.7), GLS, bev=0.006))
body.append(tube('handle', (-0.38, 0.95, 1.3), (-0.38, 0.95, 1.5), 0.02, CH, seg=8))
body.append(tube('handle2', (-0.38, 0.95, 1.5), (-0.05, 0.95, 1.5), 0.02, CH, seg=8))
body.append(tube('handle3', (-0.05, 0.95, 1.3), (-0.05, 0.95, 1.5), 0.02, CH, seg=8))
# e-stop on rear corner + beacon
body.append(cyl('estopb', 0.05, 0.05, (0.38, 1.0, 1.8), YEL, seg=16))
body.append(cyl('estop', 0.04, 0.04, (0.38, 1.0, 1.84), REDL, seg=16, bev=0.012))
body.append(cyl('beacon', 0.045, 0.1, (0.1, 0.9, 1.84), BLUEL, seg=16, bev=0.015))
# front safety scanner (low lidar) + camera pods on shoulders
body.append(box2('scanhous', (-0.16, -0.38, 0.14), (0.16, -0.3, 0.3), BK, bev=0.02))
body.append(cyl('scanwin', 0.07, 0.08, (0, -0.37, 0.22), GLS, seg=20))
for sx in (-1, 1):
    body.append(box2('campod', (sx * 0.38 - 0.06, -0.3, 1.16), (sx * 0.38 + 0.06, -0.2, 1.26), BK, bev=0.02))
    body.append(cyl('camlens', 0.025, 0.02, (sx * 0.38, -0.305, 1.21), GLS, 'Y', seg=12))
    # warning-light dots
    body.append(cyl('blspot', 0.03, 0.02, (sx * 0.3, -0.33, 0.08), BLUEL, seg=12))
# drive wheel + casters (under chassis, PU yellow)
# drive/steer unit housing (wheel itself is a separate node)
body.append(cyl('dhous', 0.13, 0.03, (0.0, 0.62, 0.345), CH, seg=24, bev=0.008))
# straddle-free fork-over load rollers live in the forks
stk = join(body, 'body', pivot=(0, 0, 0))

# wheels: rear drive/steer wheel (steer node = vertical axis through the contact patch centre) + two swivel casters
def puwheel(nm, x, y, r, w, fork=True):
    p = [cyl(nm + 't', r, w, (x, y, r), PU, 'X', seg=24, bev=0.015), cyl(nm + 'h', r * 0.45, w + 0.012, (x, y, r), GRY, 'X', seg=12, bev=0.004)]
    return join(p, nm, pivot=(x, y, r))
def yoke(nm, x, y, r, w, top):
    p = [box2('yk', (x - w / 2 - 0.03, y - 0.03, r - 0.025), (x - w / 2 - 0.012, y + 0.03, top - 0.01), CH, bev=0.004),
         box2('yk', (x + w / 2 + 0.012, y - 0.03, r - 0.025), (x + w / 2 + 0.03, y + 0.03, top - 0.01), CH, bev=0.004),
         box2('ykt', (x - w / 2 - 0.036, y - 0.036, top - 0.02), (x + w / 2 + 0.036, y + 0.036, top), CH, bev=0.004),
         cyl('axl', 0.012, w + 0.07, (x, y, r), GRY, 'X', seg=8)]
    return join(p, nm, pivot=(x, y, r))
w_drive = puwheel('wheel_drive', 0.0, 0.62, 0.15, 0.12)
st_drive = yoke('steer_drive', 0.0, 0.62, 0.15, 0.12, 0.33)
casters = {}
for nm, sx in (('L', 1), ('R', -1)):
    casters[nm] = (yoke('caster_' + nm, sx * 0.4, 0.92, 0.07, 0.06, 0.1), puwheel('wheel_caster_' + nm, sx * 0.4, 0.92, 0.07, 0.06))

# light strip around the base (emissive cyan) - its own node so the app can recolour it
ls = []
for sx in (-1, 1):
    ls.append(box2('ls_side', (sx * 0.548 - 0.008, -0.25, 0.37), (sx * 0.548 + 0.008, 0.98, 0.4), CYAN, bev=0.004))
ls.append(box2('ls_rear', (-0.46, 1.1, 0.24), (0.46, 1.112, 0.27), CYAN, bev=0.004))
ls.append(box2('ls_front', (-0.5, -0.334, 0.37), (0.5, -0.322, 0.4), CYAN, bev=0.004))
light = join(ls, 'light_strip', pivot=(0, 0.35, 0.38))

# lidar on a sensor arch above the mast (in photo: two slim posts + top bar with a puck)
la = []
for sx in (-1, 1):
    la.append(box2('post', (sx * 0.44 - 0.03, -0.12, 1.28), (sx * 0.44 + 0.03, -0.06, 2.12), CH, bev=0.01))
la.append(box2('topbar', (-0.47, -0.14, 2.1), (0.47, -0.04, 2.17), CH, bev=0.02))
la.append(cyl('puckbase', 0.075, 0.04, (0, -0.09, 2.19), BK, seg=24, bev=0.01))
la.append(cyl('puck', 0.06, 0.07, (0, -0.09, 2.245), GLS, seg=24))
la.append(cyl('puckcap', 0.065, 0.025, (0, -0.09, 2.29), BK, seg=24, bev=0.008))
la.append(box2('cam3d', (-0.09, -0.19, 2.04), (0.09, -0.13, 2.09), BK, bev=0.01))
la.append(box2('cam3dw', (-0.07, -0.195, 2.05), (0.07, -0.19, 2.08), GLS))
lidar = join(la, 'lidar', pivot=(0, -0.09, 2.2))

# --- two-stage telescoping mast: mast_outer (fixed) > mast_inner (extends) > fork_carriage (free lift inside the inner rails)
MY = -0.42
CHR = mat('chrome_soft', '#C9CDD2', 0.45)
mo = []
for sx in (-1, 1):
    x = sx * 0.33
    mo.append(box2('up_o', (x - 0.05, MY - 0.06, 0.06), (x + 0.05, MY + 0.06, 2.0), STL, bev=0.012))
    mo.append(box2('up_l', (x - sx * 0.05 - 0.008, MY - 0.055, 0.07), (x - sx * 0.05 + 0.008, MY + 0.055, 1.99), CH))
    mo.append(box2('leg', (x - 0.05, MY - 0.05, 0.0), (x + 0.05, MY + 0.32, 0.12), STL, bev=0.015))
mo.append(box2('tie_t', (-0.375, MY + 0.02, 1.94), (0.375, MY + 0.06, 1.997), STL, bev=0.01))
mo.append(box2('tie_m', (-0.375, MY + 0.02, 1.1), (0.375, MY + 0.06, 1.16), STL, bev=0.01))
mo.append(box2('cylbase', (-0.07, MY + 0.03, 0.02), (0.07, MY + 0.17, 0.045), STL, bev=0.006))
mo.append(cyl('liftcyl', 0.04, 1.7, (0, MY + 0.1, 0.045 + 0.85), GRY, seg=16, bev=0.006))
mast_outer = join(mo, 'mast_outer', pivot=(0, MY, 0))

mi = []
IX = 0.24
for sx in (-1, 1):
    x = sx * IX
    mi.append(box2('up_i', (x - 0.035, MY - 0.055, 0.09), (x + 0.035, MY + 0.015, 1.96), STL, bev=0.01))
    mi.append(box2('up_il', (x - sx * 0.035 - 0.006, MY - 0.05, 0.1), (x - sx * 0.035 + 0.006, MY + 0.01, 1.95), CH))
mi.append(box2('xhead', (-0.28, MY - 0.055, 1.96), (0.28, MY + 0.015, 2.0), STL, bev=0.01))
mi.append(box2('xbot', (-0.21, MY - 0.03, 0.12), (0.21, MY + 0.0, 0.17), STL, bev=0.008))
mi.append(box2('rodbrk', (-0.06, MY - 0.03, 2.003), (0.06, MY + 0.15, 2.05), STL, bev=0.01))
mi.append(cyl('liftrod', 0.024, 1.95, (0, MY + 0.1, 2.003 - 0.975), CHR, seg=12))
for sx in (-1, 1):
    mi.append(box2('chain', (sx * 0.15 - 0.015, MY - 0.05, 0.55), (sx * 0.15 + 0.015, MY - 0.02, 1.93), GRY))
    mi.append(cyl('sheave', 0.05, 0.04, (sx * 0.15, MY - 0.035, 1.93), CH, 'X', seg=16, bev=0.006))
mast_inner = join(mi, 'mast_inner', pivot=(0, MY, 0))

fk = []
FY = MY - 0.09
fk.append(box2('carr', (-0.4, FY - 0.04, 0.08), (0.4, FY + 0.03, 0.62), CH, bev=0.015))
for z in (0.14, 0.56):
    fk.append(box2('carbar', (-0.42, FY - 0.06, z - 0.04), (0.42, FY - 0.02, z + 0.04), OR, bev=0.012))
    for sx in (-1, 1):   # guide rollers running inside the inner-rail channels
        fk.append(cyl('roller', 0.028, 0.045, (sx * (IX - 0.012), MY - 0.035, z), GRY, 'Y', seg=14, bev=0.004))
for i in range(5):
    x = -0.32 + i * 0.16
    fk.append(box2('back', (x - 0.015, FY - 0.04, 0.62), (x + 0.015, FY - 0.01, 1.05), STL))
fk.append(box2('backtop', (-0.4, FY - 0.05, 1.03), (0.4, FY, 1.07), STL, bev=0.01))
FL = 1.07
for sx in (-1, 1):
    x = sx * 0.27; yb = FY - 0.04
    prof = [(yb, 0.0), (yb, 0.06), (yb - FL + 0.1, 0.06), (yb - FL, 0.012), (yb - FL, 0.0)]
    fk.append(prism('tine', prof[::-1], x - 0.06, x + 0.06, STL, bev=0.006))
    fk.append(box2('shank', (x - 0.055, FY - 0.08, 0.006), (x + 0.055, FY - 0.03, 0.5), STL, bev=0.01))
forks = join(fk, 'fork_carriage', pivot=(0, FY, 0.0))

root = empty('pallet_stacker_auto')
parent(stk, root)
parent(st_drive, stk); parent(w_drive, st_drive)
for yk, wh in casters.values(): parent(yk, stk); parent(wh, yk)
parent(light, stk); parent(lidar, stk); parent(mast_outer, stk); parent(mast_inner, mast_outer); parent(forks, mast_inner)
_anc = empty('anchor_tiller_grip', (-0.215, 0.95, 1.5)); parent(_anc, stk)
export('pallet_stacker_auto', dict(anchors={'anchor_tiller_grip': 'centre of the manual-mode push handle on the compute tower (hand point; walk-behind), child of body'}, 
    facing='+Z (forks point toward +Z)',
    refs=['01_interior_dock_forklifts.jpg', '14_iso_cutaway_orange_base.jpg'],
    hierarchy='pallet_stacker_auto > body > {steer_drive > wheel_drive, caster_L > wheel_caster_L, caster_R > wheel_caster_R, light_strip, lidar, mast_outer > mast_inner > fork_carriage}',
    rig={'drive': 'move/rotate body (or root); rear drive wheel steers like a forklift rear axle; the fixed axle is the fork-side load rollers / mast legs (z +0.42 m glTF)',
         'steer': 'rotate steer_drive about local Y (+-90 deg); casters caster_L/R swivel freely about Y (point them along the velocity)',
         'spin': 'rotate wheel_drive (r 0.15 m) / wheel_caster_L/R (r 0.07 m) about local X',
         'lift': 'two-stage: (1) free lift - translate fork_carriage +Y 0..1.30 m (carriage frame stays inside the inner rails: top 1.92 < rail top 1.96); (2) translate mast_inner +Y 0..1.60 m (keeps 0.30 m overlap in the outer rails, lift rod stays in its cylinder). Max fork height 2.90 m; lift only when speed < 0.05 m/s'},
    nodes={'body': 'chassis + orange shell + tower, origin ground centre of chassis',
           'steer_drive': 'drive-wheel yoke; origin at the drive axle centre (x=0, y=0.15, z=-0.62 glTF) on the vertical steer axis; rotate about Y',
           'wheel_drive': 'child of steer_drive, origin at axle centre, spin about X',
           'caster_L/R': 'swivel yokes, origin at caster axle centre on the swivel axis; wheel_caster_L/R children spin about X',
           'light_strip': 'emissive cyan perimeter strip (material strip_cyan) - recolour/blink',
           'lidar': 'sensor arch + top lidar puck; origin at puck centre - spin about Y',
           'mast_outer': 'child of body, fixed outer uprights + lift cylinder; origin at mast foot on the ground (x=0, z=+0.42 glTF)',
           'mast_inner': 'child of mast_outer, inner uprights + crosshead + chains + lift rod; origin at mast foot; translate +Y 0..1.60 m',
           'fork_carriage': 'child of mast_inner; carriage, backrest, guide rollers, 2 tines (1.07 m x 0.12 x 0.06 m, tapered tips); origin at the fork heel on the ground; translate +Y 0..1.30 m (free lift)'}))
render('pallet_stacker_auto')
closeups('pallet_stacker_auto', [('front', (0, -0.6, 0.6, 0.9), (0.5, -1.2, 0.5)), ('top', (0, 0.4, 1.9, 0.7), (0.8, -0.6, 0.9))])
