# Manual hydraulic pallet jack (matched to imgref/01_interior_dock_forklifts.jpg, 10_stacked_pallets)
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
from kit import *
reset()
RED = mat('pj_yellow', '#F2B90F', 0.72); CH = mat('pj_charcoal', '#33373D', 0.8); BK = mat('pj_black', '#1C1D20', 0.85)
GRY = mat('pj_grey', '#7B8088', 0.7); CHR = mat('chrome_soft', '#C9CDD2', 0.45); PU = mat('pu_tread', '#E8B528', 0.75)
STL = mat('fork_steel', '#3A3D42', 0.5)
FL, FW, FX, FT = 1.15, 0.16, 0.19, 0.085      # fork length, width, centre x, top height (lowered)
SA = (0.0, 0.32)                                # steer axis (x, y)
b = []
for sx in (-1, 1):
    x = sx * FX
    # channel fork: top plate + two flanges, tapered nose
    prof = [(0.05, 0.035), (0.05, FT), (-FL + 0.12, FT), (-FL, 0.05), (-FL, 0.035)]
    b.append(prism('ftop', prof[::-1], x - FW / 2, x + FW / 2, RED, bev=0.008))
    for fx in (x - FW / 2 + 0.006, x + FW / 2 - 0.006):
        b.append(box2('flange', (fx - 0.006, -FL + 0.03, 0.03), (fx + 0.006, 0.05, 0.04), RED))
    # entry roller under the tip
    b.append(cyl('entry', 0.018, FW - 0.03, (x, -FL + 0.03, 0.03), GRY, 'X', seg=10))
b.append(box2('heel', (-FX - FW / 2 + 0.01, 0.02, 0.04), (FX + FW / 2 - 0.01, 0.16, 0.2), RED, bev=0.03, seg=3))
b.append(box2('backplate', (-0.2, 0.12, 0.08), (0.2, 0.2, 0.32), RED, bev=0.03, seg=3))
b.append(box2('rmplate', (-0.1, 0.2, 0.26), (0.1, 0.215, 0.31), CH, bev=0.01))
body = join(b, 'body', pivot=(0, 0, 0))

# tiller assembly (turns with steering): wheel fork, pump, handle hinge
t = []
t.append(cyl('pump', 0.065, 0.3, (SA[0], SA[1], 0.36), RED, seg=20, bev=0.01))
t.append(cyl('ram', 0.035, 0.1, (SA[0], SA[1], 0.55), CHR, seg=16))
t.append(box2('head', (-0.07, SA[1] - 0.05, 0.59), (0.07, SA[1] + 0.1, 0.63), CH, bev=0.01))
t.append(cyl('turntable', 0.09, 0.03, (SA[0], SA[1], 0.215), CH, seg=20, bev=0.005))
for sx in (-1, 1):
    t.append(box2('yoke', (sx * 0.125 - 0.01, SA[1] - 0.06, 0.08), (sx * 0.125 + 0.01, SA[1] + 0.06, 0.21), CH, bev=0.005))
t.append(cyl('axle', 0.012, 0.285, (SA[0], SA[1], 0.1), GRY, 'X', seg=8))
for sx in (-1, 1):
    t.append(box2('hk', (sx * 0.05 - 0.012, SA[1] + 0.03, 0.56), (sx * 0.05 + 0.012, SA[1] + 0.09, 0.66), CH, bev=0.004))
tiller_geo = join(t, 'tiller_frame', pivot=(SA[0], SA[1], 0.1))
wheels = {nm: puwheel(nm, sx * 0.07, SA[1], 0.1, 0.05, PU, GRY, seg=20) for nm, sx in (('wheel_steer_L', 1), ('wheel_steer_R', -1))}
loads = {nm: puwheel(nm, sx * FX, -FL + 0.12, 0.04, 0.07, PU, GRY, seg=14) for nm, sx in (('wheel_load_L', 1), ('wheel_load_R', -1))}

# handle: hinge at (0, SA_y+0.06, 0.62); shaft leans back 12 deg; loop grip at 1.2 m
HZ = 0.62; HY = SA[1] + 0.06
a = R(12); top = Vector((0, HY + math.sin(a) * 0.62, HZ + math.cos(a) * 0.62))
h = [tube('shaft', (0, HY, HZ), top, 0.018, RED, seg=10), cyl('hpin', 0.012, 0.13, (0, HY, HZ), GRY, 'X', seg=8)]
gtop = top + Vector((0, 0, 0.1))
for sx in (-1, 1):
    h.append(tube('loop', top, gtop + Vector((sx * 0.14, 0.02, 0.0)), 0.016, RED, seg=10))
h.append(tube('grip', gtop + Vector((-0.15, 0.02, 0)), gtop + Vector((0.15, 0.02, 0)), 0.02, BK, seg=12))
h.append(box2('lever', (-0.03, gtop.y - 0.02, gtop.z - 0.07), (0.03, gtop.y + 0.0, gtop.z - 0.02), GRY, bev=0.006))
handle = join(h, 'tiller_handle', pivot=(0, HY, HZ))

root = empty('pallet_jack')
parent(body, root)
for w in loads.values(): parent(w, body)
tiller = empty('tiller', (SA[0], SA[1], 0.1)); parent(tiller, body)
parent(tiller_geo, tiller); parent(handle, tiller)
for w in wheels.values(): parent(w, tiller)

_anc = empty('anchor_tiller_grip', (gtop.x, gtop.y + 0.02, gtop.z)); parent(_anc, handle)
export('pallet_jack', dict(anchors={'anchor_tiller_grip': 'centre of the tiller loop grip (hand point), child of tiller_handle so it follows steer + pump arc'}, 
    facing='+Z (fork tips point toward +Z; the operator pulls from the tiller at -Z)', refs=['01_interior_dock_forklifts.jpg', '10_pallet_wood_stacked.jpg'],
    sides="L = +X, R = -X (looking along the forks)",
    hierarchy='pallet_jack > body > {wheel_load_L, wheel_load_R, tiller > {tiller_frame, tiller_handle, wheel_steer_L, wheel_steer_R}}',
    rig={'steer': 'rotate tiller about local Y (+-90 deg); its origin is ON the steer axis at the steer-wheel axle centre (x=0, y=0.10, z=-0.32 glTF), so the handle and both steer wheels swing together',
         'handle': 'rotate tiller_handle about local X: 0 = 12 deg back (rest/towing); -60..+15 deg pumping arc',
         'spin': 'rotate wheel_* about local X; steer wheels r=0.10 m, load rollers r=0.04 m',
         'lift': 'translate body +Y 0..0.115 m (lowered 0.085 -> raised 0.200 m fork top) while keeping wheels on the floor (move the wheel nodes -Y by the same amount)'},
    nodes={'body': 'forks 1.15 x 0.54 m overall (two 0.16 m channels), heel, back plate; origin on the ground at the fork heel centre',
           'tiller': 'Empty on the steer axis at axle height', 'tiller_frame': 'pump, turntable, wheel yoke (turns with steering)',
           'tiller_handle': 'handle, origin at the hinge pin (0.62 m)', 'wheel_*': 'origin on the axle centre'}))
render('pallet_jack', view=(1.0, -1.0, 0.7))
closeups('pallet_jack', [('tiller', (0, 0.3, 0.4, 0.45), (1.0, 0.6, 0.6)), ('tips', (0, -1.05, 0.05, 0.3), (0.9, -1.0, 0.5))])
