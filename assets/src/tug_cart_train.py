# Tow tractor (tugger) + 3 platform carts with hitch nodes (matched to imgref/01_interior_dock_forklifts.png, 15, 14)
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
from kit import *
reset()
BL = mat('brand_blue', '#0071CE', 0.65); YEL = mat('brand_yellow', '#FFC220', 0.6)
CH = mat('tug_charcoal', '#33373D', 0.8); BK = mat('tug_black', '#1C1D20', 0.85); GRY = mat('tug_grey', '#7B8088', 0.7)
TY = mat('tyre', '#26272B', 0.92); RIM = mat('tug_rim', '#D9DADC', 0.6); HUB = mat('hub_dark', '#3B4047', 0.75)
SEAT = mat('seat_black', '#2A2C30', 0.9); LAMP = mat('lamp_white', '#FFF6E0', 0.3, emit='#FFF2D0', estr=4)
TL = mat('lamp_red', '#E0282A', 0.4, emit='#FF2020', estr=3); ORG = mat('beacon_orange', '#FF8A1F', 0.4, emit='#FF7A10', estr=6)
DECK = mat('cart_deck', '#9AA0A8', 0.75); CART = mat('cart_frame', '#2F6FB3', 0.72); STL = mat('hitch_steel', '#3A3D42', 0.5)

# ---------------- tug: Blender front = -Y; spans y -0.95 .. 0.95, width 1.0
tp = []
tp.append(box2('chassis', (-0.5, -0.95, 0.2), (0.5, 0.95, 0.42), CH, bev=0.04, seg=2))
tp.append(box2('nose', (-0.48, -0.95, 0.42), (0.48, -0.25, 0.92), BL, bev=0.1, seg=3))
tp.append(box2('bumper', (-0.52, -1.02, 0.22), (0.52, -0.94, 0.38), BK, bev=0.03, seg=2))
for sx in (-1, 1):
    tp.append(box2('hl', (sx * 0.32 - 0.07, -0.952, 0.74), (sx * 0.32 + 0.07, -0.94, 0.82), LAMP))
tp.append(box2('spark_plate', (-0.12, -0.953, 0.55), (0.12, -0.94, 0.66), YEL))
tp.append(box2('deck', (-0.48, -0.25, 0.42), (0.48, 0.55, 0.47), BK))
tp.append(box2('rear', (-0.48, 0.45, 0.42), (0.48, 0.95, 0.8), BL, bev=0.08, seg=3))
for sx in (-1, 1):
    tp.append(box2('tl', (sx * 0.36 - 0.06, 0.95, 0.66), (sx * 0.36 + 0.06, 0.962, 0.74), TL))
# seat on the rear body, steering column, wheel
tp.append(box2('cushion', (-0.25, 0.48, 0.8), (0.25, 0.9, 0.9), SEAT, bev=0.04))
tp.append(box2('backrest', (-0.25, 0.82, 0.9), (0.25, 0.92, 1.35), SEAT, bev=0.04))
tp.append(tube('column', (0, -0.3, 0.88), (0, -0.05, 1.18), 0.03, CH, seg=10))
tp.append(torus('swheel', 0.17, 0.018, (0, -0.04, 1.2), BK, 'Z', seg=24, rseg=6))
for k in range(3):
    a = R(90 + k * 120)
    tp.append(tube('spoke', (0, -0.04, 1.2), (math.cos(a) * 0.16, -0.04 + math.sin(a) * 0.16, 1.2), 0.01, BK, seg=6))
# canopy frame
for sx in (-1, 1):
    tp.append(tube('cpost', (sx * 0.45, 0.9, 0.8), (sx * 0.45, 0.9, 1.95), 0.025, CH, seg=10))
    tp.append(tube('cpostf', (sx * 0.45, -0.3, 0.92), (sx * 0.45, -0.2, 1.95), 0.025, CH, seg=10))
tp.append(box2('roof', (-0.52, -0.3, 1.95), (0.52, 0.95, 2.0), CH, bev=0.02))
tp.append(cyl('beaconb', 0.05, 0.03, (0.35, 0.8, 2.015), BK, seg=16))
# fenders
for (x, y) in ((0.42, -0.6), (-0.42, -0.6), (0.42, 0.6), (-0.42, 0.6)):
    tp.append(arch('fender', 0.25, 0.28, 0.18, (x, y, 0.22), CH, a0=0, a1=180, seg=14, bev=0.008))
# rear hitch: pin coupler
HY, HZ = 1.05, 0.33
tp.append(box2('hitchplate', (-0.12, 0.95, HZ - 0.06), (0.12, 1.12, HZ - 0.02), STL, bev=0.008))
tp.append(box2('hitchplate2', (-0.12, 0.95, HZ + 0.03), (0.12, 1.12, HZ + 0.07), STL, bev=0.008))
tp.append(cyl('pin', 0.016, 0.16, (0, HY, HZ + 0.06), STL, seg=10))
tp.append(cyl('pinhead', 0.03, 0.02, (0, HY, HZ + 0.15), STL, seg=12))
tug = join(tp, 'tug', pivot=(0, 0, 0))
beacon = join([sphere('dome', 0.045, (0.35, 0.8, 2.035), ORG, seg=16, rings=8, scale=(1, 1, 0.9))], 'tug_beacon', pivot=(0.35, 0.8, 2.035))

TR = 0.2
tw = {}
for nm, (x, y, side) in {'wheel_FL': (0.42, -0.6, 1), 'wheel_FR': (-0.42, -0.6, -1), 'wheel_RL': (0.42, 0.6, 1), 'wheel_RR': (-0.42, 0.6, -1)}.items():
    tw[nm] = wheel('tug_' + nm, TR, 0.14, None, TY, RIM, HUB, seg=20, center=(x, y, TR), rim_ratio=0.55, lugs=5, side=side, inset=0.02, tn=3)

root = empty('tug_cart_train')
parent(tug, root); parent(beacon, tug)
for nm, sx in (('steer_FL', 1), ('steer_FR', -1)):
    st = empty('tug_' + nm, (sx * 0.34, -0.6, TR)); parent(st, tug); parent(tw[nm.replace('steer', 'wheel')], st)
for nm in ('wheel_RL', 'wheel_RR'): parent(tw[nm], tug)
hitch0 = empty('tug_hitch', (0, HY, HZ)); parent(hitch0, tug)

# ---------------- platform carts: front turntable (steer) with drawbar, rear fixed axle, rear hitch pin
DL = 0.85         # drawbar length (eye -> turntable king bolt), horizontal at rest
CL, CW, DZ = 2.0, 1.1, 0.48
CR = 0.15
def cart(i, eye_y):
    tt_y = eye_y + DL               # turntable king bolt
    y0 = tt_y - 0.3; y1 = y0 + CL   # deck span
    pre = 'cart%d_' % i
    cp = []
    cp.append(box2('deck', (-CW / 2, y0, DZ - 0.04), (CW / 2, y1, DZ), DECK, bev=0.012))
    for sx in (-1, 1):
        cp.append(box2('siderail', (sx * CW / 2 - 0.03, y0, DZ - 0.12), (sx * CW / 2 + 0.03, y1, DZ - 0.04), CART, bev=0.01))
    for yy in (y0 + 0.02, y1 - 0.02):
        cp.append(box2('endrail', (-CW / 2, yy - 0.02, DZ - 0.12), (CW / 2, yy + 0.02, DZ - 0.04), CART, bev=0.008))
    # corner stakes + rails on the long sides
    for sx in (-1, 1):
        for yy in (y0 + 0.05, (y0 + y1) / 2, y1 - 0.05):
            cp.append(box2('stake', (sx * (CW / 2 - 0.03) - 0.02, yy - 0.02, DZ), (sx * (CW / 2 - 0.03) + 0.02, yy + 0.02, DZ + 0.55), CART, bev=0.006))
        cp.append(box2('toprail', (sx * (CW / 2 - 0.03) - 0.022, y0 + 0.03, DZ + 0.55), (sx * (CW / 2 - 0.03) + 0.022, y1 - 0.03, DZ + 0.59), CART, bev=0.008))
    # front end stop (headboard)
    cp.append(box2('headboard', (-CW / 2 + 0.05, y0 + 0.035, DZ), (CW / 2 - 0.05, y0 + 0.065, DZ + 0.4), CART, bev=0.006))
    # turntable ring (fixed part under the deck)
    cp.append(cyl('ttring', 0.3, 0.03, (0, tt_y, DZ - 0.135), CH, seg=24))
    # rear axle beam + springs blocks
    cp.append(box2('raxle', (-0.42, y1 - 0.38, CR - 0.03), (0.42, y1 - 0.32, CR + 0.03), CH, bev=0.006))
    for sx in (-1, 1):
        cp.append(box2('rhang', (sx * 0.42 - 0.03, y1 - 0.39, CR), (sx * 0.42 + 0.03, y1 - 0.31, DZ - 0.12), CH, bev=0.006))
    # rear hitch (same pin coupler as the tug)
    hy = y1 + 0.1
    cp.append(box2('hplate', (-0.1, y1 - 0.02, HZ - 0.06), (0.1, y1 + 0.17, HZ - 0.02), STL, bev=0.006))
    cp.append(box2('hplate2', (-0.1, y1 - 0.02, HZ + 0.03), (0.1, y1 + 0.17, HZ + 0.07), STL, bev=0.006))
    cp.append(box2('hdrop', (-0.1, y1 - 0.06, HZ - 0.06), (0.1, y1 - 0.02, DZ - 0.12), STL, bev=0.006))
    cp.append(cyl('pin', 0.016, 0.16, (0, hy, HZ + 0.06), STL, seg=10))
    cp.append(cyl('pinhead', 0.03, 0.02, (0, hy, HZ + 0.15), STL, seg=12))
    body = join(cp, pre + 'body', pivot=(0, tt_y, 0))
    # turntable (steer) assembly: front axle + drawbar hinge
    fp = [cyl('ttplate', 0.28, 0.03, (0, tt_y, DZ - 0.165), GRY, seg=24),
          box2('faxle', (-0.42, tt_y - 0.03, CR - 0.03), (0.42, tt_y + 0.03, CR + 0.03), CH, bev=0.006),
          box2('fhang', (-0.1, tt_y - 0.05, CR + 0.03), (0.1, tt_y + 0.05, DZ - 0.18), CH, bev=0.006)]
    for sx in (-1, 1):
        fp.append(box2('dbclevis', (sx * 0.08 - 0.012, tt_y - 0.42, CR - 0.02), (sx * 0.08 + 0.012, tt_y - 0.02, CR + 0.06), CH, bev=0.004))
    front = join(fp, pre + 'steer', pivot=(0, tt_y, CR))
    # drawbar: hinge at the front axle clevis (y tt_y-0.4), eye ring at the hitch pin
    hinge = (0, tt_y - 0.4, HZ)
    db = [bar('db', Vector((0.0, tt_y - 0.4, HZ)), Vector((0.0, eye_y + 0.06, HZ)), 0.05, 0.035, CART, bev=0.006),
          torus('eye', 0.045, 0.014, (0, eye_y, HZ + 0.005), STL, 'Z', seg=16, rseg=6),
          cyl('hingepin', 0.015, 0.2, (0, tt_y - 0.4, HZ), STL, 'X', seg=8),
          box2('dbdrop', (-0.07, tt_y - 0.43, CR + 0.02), (0.07, tt_y - 0.37, HZ), CH, bev=0.004),
          tube('handle', (0, eye_y + 0.2, HZ + 0.02), (0, eye_y + 0.32, HZ + 0.25), 0.015, CART, seg=8)]
    drawbar = join(db, pre + 'drawbar', pivot=hinge)
    whs = {}
    for nm, (x, y, side) in {'wheel_FL': (0.5, tt_y, 1), 'wheel_FR': (-0.5, tt_y, -1), 'wheel_RL': (0.5, y1 - 0.35, 1), 'wheel_RR': (-0.5, y1 - 0.35, -1)}.items():
        whs[nm] = wheel(pre + nm, CR, 0.1, None, TY, RIM, HUB, seg=16, center=(x, y, CR), rim_ratio=0.55, lugs=0, side=side, inset=0.015, tn=2)
    eye = empty(pre + 'eye', (0, eye_y, HZ))
    hitch = empty(pre + 'hitch', (0, hy, HZ))
    parent(body, root); parent(front, body); parent(drawbar, front); parent(eye, drawbar); parent(hitch, body)
    for nm in ('wheel_FL', 'wheel_FR'): parent(whs[nm], front)
    for nm in ('wheel_RL', 'wheel_RR'): parent(whs[nm], body)
    return hy, dict(turntable_y=tt_y, hitch_y=hy)

eye_y = HY; info = {}
for i in (1, 2, 3):
    eye_y, info[i] = cart(i, eye_y)

def gz(y): return round(-y, 3)   # Blender y -> glTF z
_anc = empty('anchor_seat', (0, 0.69, 0.9)); parent(_anc, tug)
export('tug_cart_train', dict(anchors={'anchor_seat': 'seat cushion top centre (driver hip point), child of tug; face +Z'}, 
    facing='+Z (tug drives toward +Z; the carts trail toward -Z)', refs=['01_interior_dock_forklifts.jpg', '15_iso_dock_cutaway_trucks.jpg', '14_iso_cutaway_orange_base.jpg'],
    sides="L/R = vehicle's own left/right: L = +X, R = -X",
    hierarchy='tug_cart_train > {tug > {tug_beacon, tug_steer_FL > tug_wheel_FL, tug_steer_FR > tug_wheel_FR, tug_wheel_RL, tug_wheel_RR, tug_hitch}, cartN_body > {cartN_steer > {cartN_wheel_FL, cartN_wheel_FR, cartN_drawbar > cartN_eye}, cartN_wheel_RL, cartN_wheel_RR, cartN_hitch}} for N = 1..3',
    rig={'tug_drive': 'move/rotate tug (Ackermann, wheelbase 1.2 m, track 0.84 m); fixed rear axle at z -0.60 glTF',
         'tug_steer': 'rotate tug_steer_FL/FR about local Y +-40 deg (kingpin origin at x +-0.34, axle height)',
         'spin': 'rotate *_wheel_* about local X; tug r=0.20 m, carts r=0.15 m',
         'coupling': 'each cartN_eye must coincide with the hitch in front (tug_hitch for cart1, cart(N-1)_hitch otherwise). Simple follower: per frame, place cartN_body so its rear axle trails the eye, then yaw cartN_steer so cartN_drawbar points at the leading hitch',
         'cart_steer': 'cartN_steer = front turntable (Ackermann-free "fifth wheel" steering) - rotate about local Y; origin on the king bolt at axle height',
         'drawbar': 'cartN_drawbar hinges at the front axle clevis - rotate about local X to raise / lower (rest = horizontal, eye at hitch height 0.33 m)',
         'hitch_spacing_m': {'tug_hitch': gz(HY), **{'cart%d_hitch' % i: gz(v['hitch_y']) for i, v in info.items()}}},
    nodes={'tug': 'tow tractor body, seat, steering wheel, canopy (2.0 m), rear pin hitch',
           'tug_hitch': 'Empty at the tug pin coupler (x=0, y=0.33, z=%.3f glTF)' % gz(HY),
           'cartN_body': 'platform cart 2.0 x 1.1 m, deck 0.48 m, stake sides; origin on the ground under the turntable king bolt',
           'cartN_steer': 'front turntable + front axle; origin at the king bolt (axle height 0.15 m)',
           'cartN_drawbar': 'drawbar, origin on its hinge (front clevis)', 'cartN_eye': 'Empty at the drawbar eye centre (couples to the leading hitch)',
           'cartN_hitch': 'Empty at the cart rear pin coupler', 'tug_steer_FL/FR': 'Empty on each tug front kingpin, parent of the wheel'}))
render('tug_cart_train', view=(1.0, -0.9, 0.55), lens=45, fill=0.84, res=1000)
closeups('tug_cart_train', [('hitch', (0, HY + 0.4, 0.4, 0.7), (1.0, 0.3, 0.6)), ('tug', (0, 0, 0.9, 1.4), (1.0, -1.0, 0.5))], rear=False)
