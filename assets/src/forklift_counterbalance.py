# Counterbalance LPG forklift (matched to imgref/13_forklift_detail.jpg, 08, 14)
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
reset()
Y = mat('fl_yellow', '#F1B31C', 0.72); CH = mat('fl_charcoal', '#3B4047', 0.8); BK = mat('fl_black', '#1D1E21', 0.85)
TY = mat('tyre', '#26272B', 0.92); RIM = mat('fl_rim', '#F1B31C', 0.7); HUB = mat('hub_dark', '#3B4047', 0.75)
MAST = mat('fl_mast', '#2E3237', 0.78); FORK = mat('fl_fork', '#2A2D31', 0.5); CHAIN = mat('chain', '#80858C', 0.45)
RED = mat('lpg_red', '#D2382F', 0.6); ORG = mat('beacon_orange', '#FF8A1F', 0.4, emit='#FF7A10', estr=6)
LAMP = mat('lamp_white', '#FFF6E0', 0.3, emit='#FFF2D0', estr=4); TL = mat('lamp_red', '#E0282A', 0.4, emit='#FF2020', estr=3)
GL = mat('mirror_glass', '#9FB8CC', 0.25); SILV = mat('steel_light', '#B9BDC3', 0.6); STK = mat('sticker_yellow', '#FFD23A', 0.7)

body = []
# --- lower yellow chassis with wheel arches
lo = box2('lo', (-0.53, -0.66, 0.17), (0.53, 0.56, 0.74), Y, bev=0.05, seg=3)
for yy, rr in ((-0.45, 0.37), (0.82, 0.315)):
    for sx in (-1, 1):
        c = cyl('cut', rr, 0.4, (sx * 0.5, yy, 0.33 if yy < 0 else 0.27), None, 'X', seg=40)
        boolean(lo, c)
body.append(lo)
# fender lips (charcoal arcs) over front wheels
for sx in (-1, 1):
    body.append(arch('lip', 0.37, 0.425, 0.06, (sx * 0.535, -0.45, 0.33), CH, a0=12, a1=168, seg=24, bev=0.012))
# --- counterweight (big rounded yellow block)
cw = box2('cw', (-0.56, 0.52, 0.14), (0.56, 1.2, 1.1), Y, bev=0.16, seg=5)
for sx in (-1, 1): boolean(cw, cyl('cut', 0.31, 0.53, (sx * 0.55, 0.82, 0.27), None, 'X', seg=40))
body.append(cw)
body.append(box2('cwbump', (-0.5, 1.12, 0.14), (0.5, 1.25, 0.3), BK, bev=0.04, seg=3))
body.append(box2('towslot', (-0.08, 1.19, 0.34), (0.08, 1.235, 0.44), BK, bev=0.01))
for sx in (-1, 1):
    body.append(box2('tl', (sx * 0.44 - 0.05, 1.16, 0.86), (sx * 0.44 + 0.05, 1.205, 0.96), TL, bev=0.012))
    body.append(box2('tla', (sx * 0.44 - 0.05, 1.16, 0.80), (sx * 0.44 + 0.05, 1.2, 0.845), mat('lamp_amber', '#FFA21F', 0.4, emit='#FF9A10', estr=3), bev=0.01))
# --- charcoal upper body / hood + side panels
body.append(hexa('hood', [(-0.5, -0.02, 0.72), (0.5, -0.02, 0.72), (0.5, 0.62, 0.72), (-0.5, 0.62, 0.72),
                         (-0.47, 0.02, 1.0), (0.47, 0.02, 1.0), (0.47, 0.62, 1.04), (-0.47, 0.62, 1.04)], CH, bev=0.04, seg=3))
for sx in (-1, 1):  # side panel with louvres
    body.append(box2('sp', (sx * 0.535 - 0.01, 0.08, 0.76), (sx * 0.535 + 0.01, 0.5, 0.95), CH, bev=0.008))
    for k in range(4):
        body.append(box2('lv', (sx * 0.548 - 0.006, 0.14 + k * 0.08, 0.80), (sx * 0.548 + 0.006, 0.18 + k * 0.08, 0.91), BK))
# operator floor + mat
body.append(box2('floor', (-0.46, -0.64, 0.605), (0.46, 0.0, 0.66), CH, bev=0.015))
for k in range(6):
    body.append(box2('mat', (-0.36, -0.55 + k * 0.08, 0.66), (0.36, -0.51 + k * 0.08, 0.675), BK))
# cowl / dashboard
body.append(hexa('cowl', [(-0.46, -0.72, 0.6), (0.46, -0.72, 0.6), (0.46, -0.5, 0.6), (-0.46, -0.5, 0.6),
                          (-0.42, -0.72, 1.08), (0.42, -0.72, 1.08), (0.42, -0.58, 1.12), (-0.42, -0.58, 1.12)], CH, bev=0.04, seg=3))
body.append(box2('dash', (-0.3, -0.66, 1.1), (0.3, -0.52, 1.16), BK, bev=0.02))
for i, xx in enumerate((-0.32, -0.24, -0.16)):  # control levers
    body.append(tube('lev', (xx + 0.5, -0.62, 1.1), (xx + 0.5, -0.56, 1.3), 0.009, BK, seg=8))
    body.append(sphere('knob', 0.022, (xx + 0.5, -0.56, 1.31), mat('knob_red', '#C9302C', 0.6), seg=10, rings=6))
# steering column + wheel
body.append(tube('col', (0, -0.6, 1.08), (0, -0.46, 1.36), 0.035, BK, seg=12))
sw = torus('sw', 0.16, 0.018, (0, 0, 0), BK, 'Z', seg=28, rseg=8)
sw.location = (0, -0.45, 1.38); sw.rotation_euler = (R(-35), 0, 0); body.append(sw)
for a in (0, 120, 240):
    sp = box('spk', (0.15, 0.025, 0.012), (0, 0, 0), BK)
    sp.location = (0, -0.45, 1.38); sp.rotation_euler = Euler((R(-35), 0, 0)).to_matrix().to_4x4().to_euler()
    M = Euler((R(-35), 0, 0)).to_matrix() @ Matrix.Rotation(R(a), 3, 'Z') @ Matrix.Translation((0.075, 0, 0)).to_3x3()
    sp.matrix_world = Matrix.Translation((0, -0.45, 1.38)) @ (Euler((R(-35), 0, 0)).to_matrix().to_4x4() @ Matrix.Rotation(R(a), 4, 'Z') @ Matrix.Translation((0.075, 0, 0)))
    body.append(sp)
body.append(cyl('swhub', 0.04, 0.05, (0, -0.45, 1.38), BK, rot=(-35, 0, 0)))
body.append(sphere('spinner', 0.025, (0.11, -0.39, 1.43), BK, seg=10, rings=6))
for xx in (-0.15, 0.1, 0.2):  # pedals
    body.append(box('ped', (0.07, 0.03, 0.1), (xx, -0.58, 0.72), BK, rot=(-30, 0, 0)))
# side step (left) + grab handle
body.append(box2('step', (0.5, -0.4, 0.4), (0.6, -0.06, 0.44), BK, bev=0.01))
for k in range(4):
    body.append(box2('stt', (0.51, -0.37 + k * 0.08, 0.44), (0.6, -0.34 + k * 0.08, 0.452), CH))
# --- seat
body.append(box2('seatbase', (-0.24, 0.12, 1.0), (0.24, 0.55, 1.07), CH, bev=0.02))
body.append(box2('cush', (-0.25, 0.08, 1.07), (0.25, 0.55, 1.18), BK, bev=0.045, seg=4))
for sx in (-1, 1):
    body.append(box2('bol', (sx * 0.25 - 0.045, 0.1, 1.14), (sx * 0.25 + 0.045, 0.5, 1.22), BK, bev=0.03, seg=3))
br = hexa('back', [(-0.25, 0.5, 1.15), (0.25, 0.5, 1.15), (0.25, 0.62, 1.15), (-0.25, 0.62, 1.15),
                   (-0.23, 0.6, 1.7), (0.23, 0.6, 1.7), (0.23, 0.7, 1.7), (-0.23, 0.7, 1.7)], BK, bev=0.05, seg=4)
body.append(br)
for sx in (-1, 1):
    body.append(hexa('bb', [(sx * 0.22, 0.47, 1.22), (sx * 0.28, 0.47, 1.22), (sx * 0.28, 0.6, 1.22), (sx * 0.22, 0.6, 1.22),
                            (sx * 0.21, 0.56, 1.6), (sx * 0.27, 0.56, 1.6), (sx * 0.27, 0.68, 1.6), (sx * 0.21, 0.68, 1.6)], BK, bev=0.025, seg=3))
    body.append(box2('arm', (sx * 0.31 - 0.03, 0.2, 1.3), (sx * 0.31 + 0.03, 0.5, 1.35), BK, bev=0.02))
    body.append(tube('armp', (sx * 0.31, 0.45, 1.18), (sx * 0.31, 0.45, 1.31), 0.015, CH, seg=8))
# --- overhead guard (4 posts + slatted roof)
G = mat('fl_guard', '#3E454E', 0.75)
fpb = [(sx * 0.46, -0.6, 0.72) for sx in (-1, 1)]
for sx in (-1, 1):
    body.append(bar('fpost', (sx * 0.46, -0.62, 0.66), (sx * 0.44, -0.42, 2.08), 0.07, 0.07, G, bev=0.015))
    body.append(bar('rpost', (sx * 0.46, 0.98, 1.0), (sx * 0.44, 0.78, 2.08), 0.07, 0.07, G, bev=0.015))
    body.append(bar('rail', (sx * 0.44, -0.47, 2.12), (sx * 0.44, 0.83, 2.12), 0.075, 0.07, G, bev=0.018))
body.append(bar('frail', (-0.48, -0.44, 2.12), (0.48, -0.44, 2.12), 0.07, 0.07, G, bev=0.018))
body.append(bar('rrail', (-0.48, 0.8, 2.12), (0.48, 0.8, 2.12), 0.07, 0.07, G, bev=0.018))
for k in range(6):
    xx = -0.3 + k * 0.12
    body.append(bar('slat', (xx, -0.42, 2.135), (xx, 0.78, 2.135), 0.055, 0.035, G, bev=0.01))
# corner gussets
for sx in (-1, 1):
    for yy in (-0.44, 0.8):
        body.append(sphere('gus', 0.05, (sx * 0.44, yy, 2.12), G, seg=12, rings=6))
# rear grab handle + horn
for sx in (-1, 1):
    body.append(tube('gh', (sx * 0.44, 0.92, 1.25), (sx * 0.44, 0.88, 1.6), 0.018, BK, seg=8))
# work lights on front posts
for sx in (-1, 1):
    body.append(box2('lh', (sx * 0.45 - 0.05, -0.6, 1.88), (sx * 0.45 + 0.05, -0.5, 1.98), BK, bev=0.015))
    body.append(cyl('lamp', 0.035, 0.01, (sx * 0.45, -0.603, 1.93), LAMP, 'Y', seg=16))
# mirrors
for sx in (-1, 1):
    body.append(tube('marm', (sx * 0.47, -0.46, 1.98), (sx * 0.6, -0.5, 2.0), 0.01, BK, seg=6))
    body.append(box2('mir', (sx * 0.6 - 0.07, -0.53, 1.95), (sx * 0.6 + 0.07, -0.49, 2.06), BK, bev=0.015))
    body.append(box2('mirg', (sx * 0.6 - 0.06, -0.535, 1.96), (sx * 0.6 + 0.06, -0.525, 2.05), GL))
# --- LPG tank at rear (red), lying across X, on bracket
tank = lathe('tank', [(0, -0.38), (0.09, -0.37), (0.15, -0.33), (0.17, -0.27), (0.17, 0.27), (0.15, 0.33), (0.09, 0.37), (0, 0.38)], (0.0, 1.0, 1.36), RED, 'X', seg=28)
body.append(tank)
body.append(box2('tbrk', (-0.3, 0.88, 1.08), (0.3, 1.1, 1.18), CH, bev=0.02))
for xx in (-0.22, 0.22):
    body.append(torus('strap', 0.175, 0.012, (xx, 1.0, 1.36), CH, 'X', seg=24, rseg=6))
body.append(cyl('valve', 0.03, 0.08, (0.42, 1.0, 1.36), SILV, 'X', seg=12))
body.append(torus('vwheel', 0.035, 0.008, (0.47, 1.0, 1.36), mat('valve_red', '#B02A25', 0.6), 'X', seg=16, rseg=6))
body.append(tube('hose', (0.42, 1.0, 1.32), (0.42, 0.8, 1.05), 0.012, BK, seg=8))
# warning stickers
body.append(box2('stk', (0.18, -0.725, 0.85), (0.3, -0.72, 0.95), STK))
body_o = join(body, 'body')

# --- beacon (emissive orange) on rear roof rail
bc = [cyl('bbase', 0.055, 0.05, (0, 0.8, 2.18), BK, seg=20, bev=0.01),
      lathe('dome', [(0, 0), (0.045, 0), (0.046, 0.05), (0.035, 0.085), (0.0, 0.095)], (0, 0.8, 2.205), ORG, 'Z', seg=20)]
beacon = join(bc, 'beacon', pivot=(0, 0.8, 2.155))

# --- wheels
wl = {}
for nm, (x, y, r, w, side) in {'wheel_FL': (0.46, -0.45, 0.32, 0.23, 1), 'wheel_FR': (-0.46, -0.45, 0.32, 0.23, -1),
                               'wheel_RL': (0.44, 0.82, 0.26, 0.19, 1), 'wheel_RR': (-0.44, 0.82, 0.26, 0.19, -1)}.items():
    wl[nm] = wheel(nm, r, w, None, TY, RIM, HUB, seg=28, center=(x, y, r), rim_ratio=0.56, lugs=6, side=side, tread=18, inset=0.03, tn=4)

# --- mast outer (pivot at mast base = tilt hinge)
MZ0 = 0.12; MY = -0.84
mo = []
for sx in (-1, 1):
    x = sx * 0.34
    mo.append(box2('web', (x - sx * 0.0 - 0.012, MY - 0.07, MZ0), (x + 0.012, MY + 0.07, 2.2), MAST, bev=0.006))
    for fy in (MY - 0.07, MY + 0.07):
        mo.append(box2('fl', (min(x, x - sx * 0.07), fy - 0.012, MZ0), (max(x, x - sx * 0.07), fy + 0.012, 2.2), MAST, bev=0.004))
    # lift cylinder behind channel
    mo.append(cyl('lcyl', 0.038, 1.55, (sx * 0.2, MY + 0.11, MZ0 + 0.8), MAST, seg=16, bev=0.008))
    mo.append(cyl('lrod', 0.022, 0.4, (sx * 0.2, MY + 0.11, MZ0 + 1.75), SILV, seg=12))
    # tilt cylinders
    mo.append(tube('tilt', (sx * 0.4, -0.55, 0.7), (sx * 0.4, MY + 0.07, 1.0), 0.04, MAST, seg=12))
    mo.append(tube('tiltr', (sx * 0.4, -0.66, 0.78), (sx * 0.4, MY + 0.05, 1.0), 0.022, SILV, seg=10))
for z in (MZ0 + 0.1, 1.25, 2.12):
    mo.append(box2('xb', (-0.36, MY + 0.04, z - 0.04), (0.36, MY + 0.1, z + 0.04), MAST, bev=0.01))
mo.append(box2('hinge', (-0.38, MY - 0.03, MZ0 - 0.02), (0.38, MY + 0.16, MZ0 + 0.08), MAST, bev=0.01))
mo.append(box2('stk2', (0.37, MY - 0.03, 1.4), (0.383, MY + 0.03, 1.48), STK))
mast_outer = join(mo, 'mast_outer', pivot=(0, MY, MZ0))

# --- mast inner (telescopes up)
mi = []
IY = MY - 0.035
for sx in (-1, 1):
    x = sx * 0.255
    mi.append(box2('iweb', (x - 0.011, IY - 0.055, MZ0 + 0.04), (x + 0.011, IY + 0.055, 2.28), MAST, bev=0.005))
    for fy in (IY - 0.055, IY + 0.055):
        mi.append(box2('ifl', (min(x, x - sx * 0.06), fy - 0.01, MZ0 + 0.04), (max(x, x - sx * 0.06), fy + 0.01, 2.28), MAST, bev=0.004))
mi.append(box2('ixt', (-0.27, IY - 0.04, 2.2), (0.27, IY + 0.07, 2.3), MAST, bev=0.012))
mi.append(box2('ixb', (-0.27, IY - 0.0, MZ0 + 0.06), (0.27, IY + 0.05, MZ0 + 0.14), MAST, bev=0.01))
for sx in (-1, 1):
    mi.append(cyl('sheave', 0.06, 0.04, (sx * 0.12, IY - 0.06, 2.25), SILV, 'X', seg=20, bev=0.006))
    # chain: alternating link plates from sheave down to carriage
    for k in range(34):
        z = 0.62 + k * 0.047
        if z > 2.22: break
        w = 0.032 if k % 2 == 0 else 0.022
        mi.append(box2('lnk', (sx * 0.12 - w / 2, IY - 0.13, z), (sx * 0.12 + w / 2, IY - 0.11, z + 0.05), CHAIN))
mast_inner = join(mi, 'mast_inner', pivot=(0, IY, MZ0))

# --- fork carriage with backrest grille
CY = MY - 0.13
fc = []
fc.append(box2('ub', (-0.52, CY - 0.03, 0.48), (0.52, CY + 0.03, 0.6), MAST, bev=0.012))
fc.append(box2('lb', (-0.52, CY - 0.03, 0.12), (0.52, CY + 0.03, 0.22), MAST, bev=0.012))
for sx in (-1, 1):
    fc.append(box2('sp', (sx * 0.3 - 0.03, CY - 0.02, 0.12), (sx * 0.3 + 0.03, CY + 0.06, 0.62), MAST, bev=0.008))
    fc.append(box2('bs', (sx * 0.51 - 0.025, CY - 0.02, 0.48), (sx * 0.51 + 0.025, CY + 0.02, 1.32), MAST, bev=0.008))
fc.append(box2('bt', (-0.531, CY - 0.025, 1.28), (0.531, CY + 0.025, 1.34), MAST, bev=0.01))
fc.append(box2('bm', (-0.51, CY - 0.02, 0.92), (0.51, CY + 0.02, 0.96), MAST, bev=0.006))
for k in range(9):
    xx = -0.4 + k * 0.1
    fc.append(box2('bv', (xx - 0.013, CY - 0.018, 0.6), (xx + 0.013, CY + 0.018, 1.3), MAST, bev=0.004))
fc.append(box2('stk3', (0.1, CY - 0.034, 0.5), (0.2, CY - 0.03, 0.58), STK))
carriage = join(fc, 'fork_carriage', pivot=(0, CY, 0.12))
forks = {}
for nm, sx in (('fork_L', 1), ('fork_R', -1)):
    x = sx * 0.28; fy = CY - 0.03
    p = []
    p.append(box2('hook', (x - 0.055, fy - 0.05, 0.47), (x + 0.055, fy + 0.0, 0.62), FORK, bev=0.008))
    p.append(box2('shank', (x - 0.047, fy - 0.048, 0.04), (x + 0.047, fy - 0.002, 0.6), FORK, bev=0.008))
    L = 1.07; t0 = 0.045; z0 = 0.015; W2 = 0.05   # 1.07 m blade, 0.10 x 0.045 m, 45-deg-ish taper over the last 0.10 m
    prof = [(fy - 0.03, z0), (fy - 0.03, z0 + t0), (fy - L + 0.1, z0 + t0), (fy - L, z0 + 0.009), (fy - L, z0)]
    p.append(prism('blade', prof[::-1], x - W2, x + W2, FORK, bev=0.006, seg=2))
    heel = cyl('heel', 0.05, 0.1, (x, fy - 0.05, z0 + 0.05), FORK, 'X', seg=16)
    p.append(heel)
    forks[nm] = join(p, nm, pivot=(x, fy, z0))

root = empty('forklift_counterbalance')
parent(body_o, root); parent(beacon, body_o)
# rear-axle steering: Empty on each kingpin (inboard of the tyre plane, at axle height); spin wheel is its child
steer = {}
for nm, sx in (('steer_RL', 1), ('steer_RR', -1)):
    steer[nm] = empty(nm, (sx * 0.33, 0.82, 0.26)); parent(steer[nm], body_o)
for nm, w in wl.items(): parent(w, steer['steer_' + nm[-2:]] if nm in ('wheel_RL', 'wheel_RR') else body_o)
tilt = empty('mast_tilt', (0, MY, MZ0)); parent(tilt, body_o)
parent(mast_outer, tilt); parent(mast_inner, mast_outer); parent(carriage, mast_inner)
for f in forks.values(): parent(f, carriage)

_anc = empty('anchor_seat', (0, 0.33, 1.18)); parent(_anc, body_o)
export('forklift_counterbalance', dict(anchors={'anchor_seat': 'seat cushion top centre (operator hip point), child of body; face +Z'}, 
    facing='+Z (forks point toward +Z in glTF / three.js)', refs=['13_forklift_detail.jpg', '08_forklift_racks_render.jpg', '14_iso_cutaway_orange_base.jpg'],
    sides='L/R are the vehicle\'s own left/right: L = +X, R = -X (vehicle faces +Z)',
    hierarchy='forklift_counterbalance > body > {beacon, wheel_FL, wheel_FR, steer_RL > wheel_RL, steer_RR > wheel_RR, mast_tilt > mast_outer > mast_inner > fork_carriage > {fork_L, fork_R}}',
    rig={'drive': 'move/rotate body (or root); front axle (drive, y=-0.45 m in Blender = z +0.45 in glTF) is the fixed axle, rear axle steers (wheelbase 1.27 m)',
         'steer': 'rotate steer_RL/steer_RR about local Y, up to +-75 deg (rear-steer: positive yaw turns the truck the opposite way)',
         'spin': 'rotate wheel_* about local X; front r=0.32 m, rear r=0.26 m',
         'tilt': 'rotate mast_tilt about local X: about -3 deg (forward) .. +6 deg (back)',
         'lift': 'stage 1: translate fork_carriage +Y 0..1.0 m inside mast_inner (free lift); stage 2: translate mast_inner +Y 0..1.9 m (carriage rides along). Max fork height ~3.0 m'},
    nodes={'body': 'static chassis, counterweight, overhead guard, seat, LPG tank; parent of all moving parts',
           'mast_tilt': 'Empty at the mast base hinge (x=0, y=0.12 m, z=+0.84 m glTF); rotate about X to tilt; parents mast_outer',
           'steer_RL/steer_RR': 'Empty on each rear kingpin (x=+-0.33, axle height 0.26 m); rotate about Y to steer; parent of wheel_RL/RR',
           'beacon': 'emissive orange dome, origin at its base on the rear roof rail (blink / scale)',
           'wheel_FL/FR/RL/RR': 'origin exactly at axle centre, spin about local X (RL/RR are children of steer_RL/RR)',
           'mast_outer': 'child of mast_tilt, origin coincident with the tilt hinge; fixed outer stage',
           'mast_inner': 'child of mast_outer, origin at its base; translate +Y up to ~1.9 m (telescoping stage)',
           'fork_carriage': 'child of mast_inner, origin at carriage bottom; translate +Y (lift)',
           'fork_L/fork_R': 'children of fork_carriage, origin at fork heel; translate X for side-shift / spread'}))
render('forklift_counterbalance')
closeups('forklift_counterbalance', [('wheel', (0.5, -0.45, 0.4, 0.6), (1.0, -0.5, 0.3)), ('cockpit', (0, -0.2, 1.3, 0.8), (0.6, -1.0, 0.8)), ('forks', (0, -1.3, 0.4, 0.9), (0.9, -1.0, 0.6))])
