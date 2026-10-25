# Moving-mast reach truck (narrow-aisle racking; matched to imgref/06_aisle_blue_racks.png, 07, 03)
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
from kit import *
reset()
WH = mat('rt_white', '#ECEBE6', 0.72); CH = mat('rt_charcoal', '#33373D', 0.8); BK = mat('rt_black', '#1C1D20', 0.85)
RED = mat('rt_red', '#D8322B', 0.65); GRY = mat('rt_grey', '#7B8088', 0.7); STL = mat('fork_steel', '#3A3D42', 0.5)
CHR = mat('chrome_soft', '#C9CDD2', 0.45); PU = mat('pu_tread', '#E8B528', 0.75); TY = mat('tyre', '#26272B', 0.92)
SEAT = mat('seat_black', '#2A2C30', 0.9); LAMP = mat('lamp_white', '#FFF6E0', 0.3, emit='#FFF2D0', estr=4)
ORG = mat('beacon_orange', '#FF8A1F', 0.4, emit='#FF7A10', estr=6); BLUE = mat('safety_blue', '#2D7FF9', 0.4, emit='#2D7FF9', estr=5)
LIPM = mat('rt_lip', '#2A2D31', 0.6)

# Blender: front (forks) = -Y. chassis y 0..1.3, baselegs reach forward to y -1.05
body = []
# battery / drive unit (rounded box), counter-shaped top
body.append(box2('chassis', (-0.62, 0.0, 0.09), (0.62, 1.3, 0.95), WH, bev=0.08, seg=3))
body.append(box2('skirt', (-0.625, 0.0, 0.07), (0.625, 1.305, 0.22), CH, bev=0.03, seg=2))
body.append(box2('redband', (-0.627, 0.25, 0.62), (-0.612, 1.2, 0.68), RED, bev=0.005, seg=2))
body.append(box2('redband2', (0.612, 0.25, 0.62), (0.627, 0.53, 0.68), RED, bev=0.005, seg=2))
body.append(box2('redband3', (-0.5, 1.29, 0.62), (0.5, 1.307, 0.68), RED, bev=0.005, seg=2))
# operator compartment: stand-in sideways cockpit cut into the rear-left (+X) corner
cut = box2('cut', (0.05, 0.55, 0.3), (0.7, 1.18, 1.2), WH)
boolean(body[0], cut)
body.append(box2('pad', (0.08, 0.58, 0.3), (0.58, 1.16, 0.306), mat('mat_grey', '#55595F', 0.9)))
# console with joystick + display at the front of the cockpit
body.append(box2('console', (0.1, 0.42, 0.95), (0.6, 0.62, 1.12), CH, bev=0.03))
body.append(cyl('joy', 0.018, 0.12, (0.45, 0.52, 1.18), BK, seg=10))
body.append(sphere('knob', 0.03, (0.45, 0.52, 1.25), RED, seg=12, rings=6))
body.append(box2('screen', (0.18, 0.43, 1.12), (0.34, 0.47, 1.22), mat('screen', '#1E3A55', 0.3, emit='#2B6CB0', estr=1.2)))
# backrest pad (seat/lean pad) on the rear wall
body.append(box2('lean', (0.15, 1.13, 0.62), (0.5, 1.185, 1.05), SEAT, bev=0.02))
# overhead guard: 4 posts + slatted roof
for (x, y) in ((0.57, 0.08), (-0.57, 0.08), (0.57, 1.22), (-0.57, 1.22)):
    body.append(box2('post', (x - 0.03, y - 0.03, 0.9), (x + 0.03, y + 0.03, 2.2), CH, bev=0.01))
body.append(box2('roofrim', (-0.62, 0.03, 2.2), (0.62, 1.27, 2.26), CH, bev=0.02))
for k in range(7):
    y = 0.15 + k * 0.16
    body.append(box2('slat', (-0.58, y - 0.025, 2.215), (0.58, y + 0.025, 2.25), CH))
body.append(cyl('beaconb', 0.05, 0.03, (-0.45, 1.15, 2.275), BK, seg=16))
body.append(box2('lamp', (-0.2, 0.0, 2.2), (0.2, 0.03, 2.25), LAMP))
# blue spot projector on the rear
body.append(box2('blu', (-0.35, 1.3, 0.85), (-0.2, 1.33, 0.9), BLUE))
# baselegs (straddle outriggers) with load-wheel pockets
for sx in (-1, 1):
    x = sx * 0.52
    body.append(box2('leg', (x - 0.07, -1.05, 0.2), (x + 0.07, 0.1, 0.32), CH, bev=0.025, seg=2))
    body.append(box2('legside', (x + sx * 0.06 - 0.01, -1.05, 0.06), (x + sx * 0.06 + 0.01, -0.75, 0.2), CH, bev=0.004))
    body.append(box2('legtoe', (x - 0.07, -1.12, 0.12), (x + 0.07, -1.03, 0.32), RED, bev=0.03, seg=2))
    body.append(box2('rail', (x - sx * 0.07 - 0.015, -1.0, 0.32), (x - sx * 0.07 + 0.015, 0.05, 0.36), STL))
body_o = join(body, 'body', pivot=(0, 0, 0))

beacon = join([sphere('dome', 0.045, (-0.45, 1.15, 2.29), ORG, seg=16, rings=8, scale=(1, 1, 0.9))], 'beacon', pivot=(-0.45, 1.15, 2.29))

# wheels: load wheels in the baselegs (fixed axle), drive/steer wheel under the chassis (offset -X), castor (+X)
wheels = {}
for nm, sx in (('wheel_LL', 1), ('wheel_LR', -1)):
    wheels[nm] = puwheel(nm, sx * 0.52, -0.9, 0.11, 0.1, PU, GRY, seg=20)
w_drive = puwheel('wheel_drive', -0.25, 0.75, 0.17, 0.14, TY, GRY, seg=24)
st_drive = yoke('steer_drive', -0.25, 0.75, 0.17, 0.14, 0.4, CH, GRY)
cst = yoke('caster', 0.35, 1.05, 0.09, 0.07, 0.15, CH, GRY)
w_cst = puwheel('wheel_caster', 0.35, 1.05, 0.09, 0.07, PU, GRY, seg=16)

# reach: mast assembly slides along the baselegs (Empty at the mast foot, on the rails)
MY = -0.12
mats = dict(rail=CH, lip=LIPM, accent=RED, steel=STL, chrome=CHR, grey=GRY)
mo, mi, car, info = mast2(MY, 2.45, 0.37, mats, ext=1.85, free=1.3, base_z=0.06, back_h=1.25, cw=0.42, fork_x=0.25)
# reach carriage plate riding the rails
rc = [box2('rplate', (-0.47, MY + 0.065, 0.36), (0.47, MY + 0.26, 0.44), CH, bev=0.02)]
for sx in (-1, 1):
    rc.append(cyl('rroll', 0.035, 0.05, (sx * 0.45, MY + 0.16, 0.395), GRY, 'X', seg=14))
    rc.append(cyl('reachcyl', 0.03, 0.5, (sx * 0.2, MY + 0.35, 0.4), GRY, 'Y', seg=12))
reach_geo = join(rc, 'reach_base', pivot=(0, MY, 0.36))

root = empty('reach_truck')
parent(body_o, root); parent(beacon, body_o)
for w in wheels.values(): parent(w, body_o)
parent(st_drive, body_o); parent(w_drive, st_drive)
parent(cst, body_o); parent(w_cst, cst)
reach = empty('reach', (0, MY, 0.36)); parent(reach, body_o)
parent(reach_geo, reach); parent(mo, reach); parent(mi, mo); parent(car, mi)

_anc = empty('anchor_stand', (0.33, 0.87, 0.306)); parent(_anc, body_o)
export('reach_truck', dict(anchors={'anchor_stand': 'floor pad centre of the stand-in cockpit (operator feet), child of body; face +Z'}, 
    facing='+Z (forks point toward +Z in glTF / three.js)', refs=['06_aisle_blue_racks.jpg', '07_overhead_aisle_wire_decks.jpg', '03_interior_orange_racks_mezzanine.jpg'],
    sides="L/R = vehicle's own left/right: L = +X, R = -X",
    hierarchy='reach_truck > body > {beacon, wheel_LL, wheel_LR, steer_drive > wheel_drive, caster > wheel_caster, reach > {reach_base, mast_outer > mast_inner > fork_carriage}}',
    rig={'drive': 'move/rotate root; fixed axle = load wheels in the baselegs (z +0.90 m glTF); the single drive wheel (x=-0.25, z=-0.75 glTF) steers',
         'steer': 'rotate steer_drive about local Y, +-90 deg (reach trucks turn on the spot)',
         'spin': 'rotate wheel_* about local X; drive r=0.17, load wheels r=0.11, caster r=0.09',
         'reach': 'translate reach along local +Z (glTF) 0..0.60 m: the whole mast rolls forward along the baseleg rails',
         'lift': 'two-stage: fork_carriage +Y 0..%.2f m (free lift), then mast_inner +Y 0..%.2f m; max fork height %.2f m above rest. %s' % (info['free_lift'], info['inner_ext'], info['max_fork_height'], info['stays_in_rails']),
         'caster': 'caster yoke may swivel freely about Y (cosmetic)'},
    nodes={'body': 'chassis, operator compartment (stand-in, open to the vehicle-left side), overhead guard 2.26 m, baselegs',
           'reach': 'Empty at the mast foot on the rails (x=0, y=0.36, z=+0.12 glTF); translate +Z to reach',
           'reach_base': 'reach carriage plate + rollers (child of reach)',
           'mast_outer': 'outer uprights 2.45 m, child of reach', 'mast_inner': 'inner stage, translate +Y',
           'fork_carriage': 'carriage + backrest + 2 forks 1.07 x 0.10 x 0.045 m, tapered tips; translate +Y',
           'steer_drive': 'drive-wheel yoke; origin at the axle centre (steer axis is vertical through it)',
           'wheel_drive/wheel_LL/wheel_LR/wheel_caster': 'origin exactly at axle centre; spin about local X',
           'caster': 'caster yoke, origin at axle centre', 'beacon': 'emissive orange dome'}))
render('reach_truck', view=(1.0, -1.2, 0.6))
closeups('reach_truck', [('cockpit', (0.3, 0.8, 1.0, 0.8), (1.0, 0.6, 0.8)), ('forks', (0, -0.8, 0.3, 0.8), (0.9, -1.0, 0.5))])
