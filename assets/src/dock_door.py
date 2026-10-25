# Loading dock door: wall panel, roll-up door, dock shelter, bumpers, leveler with lip, traffic light (imgref 02, 01, 15)
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
reset()
WALL = mat('wall_tiltup', '#DAD6CE', 0.88); CONC = mat('concrete_floor', '#BDBAB3', 0.9)
DOOR = mat('door_curtain', '#EEF0F2', 0.75); RUB = mat('rubber_black', '#25262A', 0.9); FOAM = mat('shelter_foam', '#2D2F34', 0.88)
YEL = mat('brand_yellow', '#FFC220', 0.7); STL = mat('steel_grey', '#7D838B', 0.6); PLT = mat('leveler_plate', '#8C9198', 0.55)
BLU = mat('brand_blue', '#0071CE', 0.75)
RED_L = mat('light_red', '#FF2A2A', 0.5, emit='#FF2A2A', estr=4); GRN_L = mat('light_green', '#22E06A', 0.5, emit='#22E06A', estr=4)
WW, WH, WT = 4.2, 5.0, 0.25          # wall panel
OW, OH, DH = 2.7, 3.0, 1.22          # opening width / height, dock (floor) height
# ---- static frame: wall + interior slab + shelter + bumpers + rails + housing
s = []
wall = box2('wall', (-WW / 2, 0.0, 0.0), (WW / 2, WT, WH), WALL, bev=0.01)
cut = box2('_cut', (-OW / 2, -0.5, DH), (OW / 2, WT + 0.5, DH + OH), WALL)
boolean(wall, cut); s.append(wall)
s.append(box2('slab', (-WW / 2, WT, 0.0), (WW / 2, WT + 2.4, DH), CONC, bev=0.01))
s.append(box2('stripe', (-WW / 2 + 0.005, -0.004, 0.25), (WW / 2 - 0.005, 0.0, 0.45), BLU))       # painted blue band (proud 4 mm)
for sx in (-1, 1):   # shelter side pads with yellow guide stripe
    x0, x1 = sorted((sx * (OW / 2), sx * (OW / 2 + 0.3)))
    s.append(box2('pad', (x0, -0.3, DH - 0.05), (x1, 0.0, DH + OH + 0.1), FOAM, bev=0.04, seg=3))
    xm = sx * (OW / 2 + 0.15)
    s.append(box2('pstripe', (xm - 0.04, -0.306, DH + 0.3), (xm + 0.04, -0.296, DH + OH - 0.2), YEL, bev=0.003))
s.append(box2('headpad', (-OW / 2 - 0.3, -0.36, DH + OH + 0.1), (OW / 2 + 0.3, 0.0, DH + OH + 0.5), FOAM, bev=0.04, seg=3))
for sx in (-1, 1):   # bumpers below the dock edge
    x = sx * 1.2
    s.append(box2('bumper', (x - 0.125, -0.12, DH - 0.36), (x + 0.125, 0.0, DH - 0.06), RUB, bev=0.02, seg=3))
    for z in (DH - 0.3, DH - 0.12):
        s.append(cyl('bolt', 0.015, 0.012, (x - 0.08, -0.126, z), STL, 'Y', seg=8)); s.append(cyl('bolt', 0.015, 0.012, (x + 0.08, -0.126, z), STL, 'Y', seg=8))
    # door guide rails (interior face)
    xr0, xr1 = sorted((sx * (OW / 2 - 0.05), sx * (OW / 2 + 0.1)))
    s.append(box2('guide', (xr0, WT, DH), (xr1, WT + 0.09, DH + OH + 0.3), STL, bev=0.006))
    s.append(box2('brk', (xr0, WT, DH + OH + 0.3), (xr1, WT + 0.75, DH + OH + 0.95), STL, bev=0.01))
s.append(cyl('housing', 0.32, OW + 0.3 - 0.004, (0, WT + 0.4, DH + OH + 0.62), STL, 'X', seg=32, bev=0.01))
# traffic light (exterior, right of the shelter as seen by the driver)
tx = -(OW / 2 + 0.55)
s.append(box2('tl', (tx - 0.09, -0.12, 2.6), (tx + 0.09, 0.0, 3.05), RUB, bev=0.02, seg=3))
s.append(cyl('tl_r', 0.055, 0.02, (tx, -0.125, 2.93), RED_L, 'Y', seg=16))
s.append(cyl('tl_g', 0.055, 0.02, (tx, -0.125, 2.72), GRN_L, 'Y', seg=16))
# leveler deck (pit in the slab; plate 5 mm proud) and its front header
s.append(box2('lev', (-1.0, -0.002, DH - 0.02), (1.0, WT + 2.0, DH + 0.005), PLT, bev=0.004))
s.append(box2('lev_hdr', (-1.0, -0.03, DH - 0.12), (1.0, -0.002, DH + 0.005), STL, bev=0.004))
for sx in (-1, 1):
    s.append(box2('toe', (sx * 1.0 - (0.006 if sx > 0 else 0), WT + 0.1, DH + 0.005), (sx * 1.0 + (0 if sx > 0 else 0.006) - (0.0), WT + 1.9, DH + 0.012), YEL))
frame = join(s, 'dock_frame', pivot=(0, 0, 0))

# ---- lip: hinged at the front edge of the leveler, hangs down (stored)
LZ = DH - 0.004; LY = -0.045
lip = join([box2('lip', (-0.99, LY - 0.016, LZ - 0.41), (0.99, LY, LZ), PLT, bev=0.004)], 'leveler_lip', pivot=(0, LY - 0.008, LZ))

# ---- roll-up door curtain: corrugated slats, origin at the top of the curtain (scale Y to roll)
Z0, Z1 = DH + 0.002, DH + OH + 0.3
YC = WT + 0.035
prof = []; n = 40
for i in range(n + 1):
    z = Z0 + 0.03 + (Z1 - Z0 - 0.03) * i / n
    prof.append((YC + (0.0 if i % 2 == 0 else -0.012), z))
front = prof
back = [(YC + 0.018, Z1), (YC + 0.018, Z0 + 0.03)]
poly = [(YC, Z0 + 0.03)] + front[1:] + back
c = [prism('curtain', poly, -OW / 2 - 0.02, OW / 2 + 0.02, DOOR)]
c.append(box2('astragal', (-OW / 2 - 0.02, YC - 0.02, Z0), (OW / 2 + 0.02, YC + 0.03, Z0 + 0.03), RUB, bev=0.008))
c.append(box2('handle', (-0.15, YC + 0.018, Z0 + 0.35), (0.15, YC + 0.06, Z0 + 0.39), YEL, bev=0.008))
door = join(c, 'door_roll', pivot=(0, YC, Z1), ang=8)

root = empty('dock_door')
parent(frame, root); parent(lip, frame); parent(door, frame)
export('dock_door', dict(
    facing='+Z = exterior/truck side (shelter, bumpers, lights); interior floor slab at 1.22 m runs toward -Z',
    refs=['02_exterior_docks_walmartcom_trailers.png', '01_interior_dock_forklifts.jpg', '15_iso_dock_cutaway_trucks.jpg'],
    dims={'opening_w_m': OW, 'opening_h_m': OH, 'dock_height_m': DH, 'wall_panel_m': [WW, WH, WT]},
    hierarchy='dock_door > dock_frame > {door_roll, leveler_lip}',
    rig={'door_roll': 'origin at the curtain top (y=%.2f m) inside the head; roll up by scaling Y 1 -> 0.03 (or translate +Y up to 3.0 m, it hides behind the coil housing)' % Z1,
         'leveler_lip': 'origin on the lip hinge at the leveler front edge; rotate about local X by -90 deg to deploy onto a trailer bed (rest = hanging/stored)',
         'traffic_light': 'materials light_red / light_green are emissive; swap emissiveIntensity to signal'},
    nodes={'dock_frame': 'wall panel with opening, interior slab, shelter pads, bumpers, guides, coil housing, leveler deck; origin on the ground at the exterior wall face, door centre'}))
render('dock_door', view=(0.95, -1.3, 0.55))
closeups('dock_door', [('bumper', (1.2, -0.1, 1.0, 0.6), (0.8, -1.0, 0.4))])
