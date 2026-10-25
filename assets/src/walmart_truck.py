# Walmart tractor + 53ft trailer (matched to imgref/02_exterior_docks_walmartcom_trailers.png, 15)
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
reset()
OFF = 11.0
def T(y): return y - OFF   # local (front bumper = 0, increasing to rear) -> Blender Y (front = -Y)
WH = mat('cab_white', '#F4F4F1', 0.6); BL = mat('brand_blue', '#0071CE', 0.65); DB = mat('walmart_navy', '#004C91', 0.7)
GR = mat('bumper_grey', '#C3C7CC', 0.55); CH = mat('truck_charcoal', '#33373D', 0.8); BK = mat('truck_black', '#1D1E21', 0.85)
GLS = mat('glass_dark', '#1F2D3D', 0.25); TY = mat('tyre', '#26272B', 0.92); ALU = mat('alu', '#C9CCD1', 0.55); HUB = mat('hub_grey', '#8E949B', 0.6)
LAMP = mat('lamp_white', '#FFF6E0', 0.3, emit='#FFF2D0', estr=4); AMB = mat('lamp_amber', '#FFA21F', 0.4, emit='#FF9A10', estr=3)
RED = mat('lamp_red', '#E0282A', 0.4, emit='#FF2020', estr=3); TW = mat('trailer_white', '#F2F1EC', 0.75)
SIDE = mat('trailer_side', '#ffffff', 0.75, tex=os.path.join(TEX, 'trailer_side.png'))
REAR = mat('trailer_rear', '#ffffff', 0.75, tex=os.path.join(TEX, 'trailer_rear.png'))
M53 = mat('mark53', '#ffffff', 0.75, tex=os.path.join(TEX, 'mark53.png'))
LOGO = mat('brand_cab_logo', '#ffffff', 0.7, tex=os.path.join(TEX, 'cab_logo.png'))
SPK = mat('brand_cab_spark', '#ffffff', 0.7, tex=os.path.join(TEX, 'cab_spark.png'))
TRIM = mat('trailer_trim', '#BFC3C8', 0.6)

tr = []
# ---- bumper, hood, grille, lights
tr.append(prism('bumper', [(T(0.0), 0.45), (T(0.42), 0.45), (T(0.42), 0.9), (T(0.08), 0.9), (T(0.0), 0.82)], -1.25, 1.25, GR, bev=0.06, seg=3))
tr.append(prism('hood', [(T(0.3), 0.88), (T(2.45), 0.88), (T(2.45), 2.02), (T(1.2), 1.9), (T(0.36), 1.78), (T(0.26), 1.6)], -1.0, 1.0, WH, bev=0.12, seg=3))
tr.append(prism('hoodstripe', [(T(0.6), 1.25), (T(2.46), 1.25), (T(2.46), 1.42), (T(0.6), 1.38)], -1.012, 1.012, BL))
tr.append(box2('grillef', (-0.62, T(0.22), 0.95), (0.62, T(0.34), 1.72), GR, bev=0.04, seg=3))
for k in range(8):
    z = 1.02 + k * 0.085
    tr.append(box2('slat', (-0.54, T(0.2), z), (0.54, T(0.24), z + 0.045), CH, bev=0.01, seg=1))
tr.append(box2('badge', (-0.16, T(0.19), 1.6), (0.16, T(0.21), 1.68), BL, bev=0.01))
for sx in (-1, 1):
    tr.append(box2('hlb', (sx * 0.82 - 0.2, T(0.2), 1.0), (sx * 0.82 + 0.2, T(0.45), 1.3), CH, bev=0.05, seg=3))
    tr.append(box2('hl', (sx * 0.80 - 0.11, T(0.18), 1.04), (sx * 0.80 + 0.11, T(0.22), 1.26), LAMP, bev=0.02))
    tr.append(box2('hla', (sx * 0.82 + sx * 0.13 - 0.03, T(0.18), 1.04), (sx * 0.82 + sx * 0.13 + 0.03, T(0.22), 1.26), AMB, bev=0.01))
    tr.append(box2('fog', (sx * 0.9 - 0.08, T(-0.01), 0.55), (sx * 0.9 + 0.08, T(0.02), 0.65), LAMP, bev=0.01))
# front fenders (arched shells over front wheels)
for sx in (-1, 1):
    tr.append(arch('fender', 0.6, 0.66, 0.4, (sx * 1.03, T(1.35), 0.52), WH, a0=-5, a1=150, seg=18))
    tr.append(box2('fstep', (sx * 1.0 - 0.15, T(1.95), 0.85), (sx * 1.0 + 0.15, T(2.4), 0.9), WH, bev=0.03))
# ---- cab + sleeper (side profile extruded)
cab = [(T(2.35), 1.15), (T(5.05), 1.15), (T(5.05), 3.75), (T(4.0), 3.78), (T(3.05), 3.18), (T(2.95), 3.02), (T(2.55), 2.06), (T(2.35), 2.0)]
tr.append(prism('cab', cab, -1.24, 1.24, WH, bev=0.12, seg=3))
for sx in (-1, 1):   # blue lower side band + skirts
    tr.append(prism('band', [(T(2.4), 1.2), (T(5.0), 1.2), (T(5.0), 1.62), (T(2.4), 1.62)], sx * 1.245 - 0.008, sx * 1.245 + 0.008, BL))
    tr.append(prism('skirt', [(T(5.05), 0.6), (T(5.8), 0.6), (T(5.8), 1.15), (T(5.05), 1.15)], sx * 1.2 - 0.04, sx * 1.2 + 0.04, WH, bev=0.03))
# livery decals on the sleeper sides: wordmark panel below the bunk window, spark above it
for sx in (-1, 1):
    x = sx * 1.2418
    for nm_, m_, ya, yb, za, zb in (('logo', LOGO, T(3.96), T(4.99), 1.68, 2.30), ('spark', SPK, T(4.17), T(4.79), 2.86, 3.48)):
        pts = [(x, ya, za), (x, yb, za), (x, yb, zb), (x, ya, zb)] if sx > 0 else [(x, yb, za), (x, ya, za), (x, ya, zb), (x, yb, zb)]
        tr.append(quad(nm_, pts, m_))
# blue centre stripe along the hood (follows the hood crown, 12 mm proud)
tr.append(prism('hstripe', [(T(0.55), 1.777), (T(1.2), 1.87), (T(2.38), 1.983), (T(2.38), 2.025), (T(1.2), 1.912), (T(0.55), 1.819)], -0.28, 0.28, BL))
# windshield (two panes on the slant)
n = Vector((0, -(3.02 - 2.06), (2.95 - 2.55))).normalized()
for sx in (-1, 1):
    p0 = Vector((sx * 0.55, T(2.57), 2.12)) + n * 0.012; p1 = Vector((sx * 0.55, T(2.92), 2.97)) + n * 0.012
    tr.append(bar('ws', p0, p1, 1.0, 0.02, GLS, up=n))
tr.append(bar('wspost', Vector((0, T(2.57), 2.1)) + n * 0.02, Vector((0, T(2.93), 2.99)) + n * 0.02, 0.07, 0.03, WH, up=n))
tr.append(box2('visor', (-1.15, T(2.85), 2.98), (1.15, T(3.1), 3.08), WH, bev=0.03))
for k in range(5):
    tr.append(box2('roofl', (-0.4 + k * 0.2 - 0.04, T(3.1), 3.12), (-0.4 + k * 0.2 + 0.04, T(3.18), 3.2), AMB, bev=0.01))
# side windows, doors, handles, steps, mirrors
for sx in (-1, 1):
    x = sx * 1.245
    tr.append(prism('sw', [(T(2.72), 2.15), (T(3.75), 2.15), (T(3.75), 2.88), (T(3.02), 2.88)], x - 0.012, x + 0.012, GLS))
    tr.append(prism('sw2', [(T(4.15), 2.35), (T(4.75), 2.35), (T(4.75), 2.75), (T(4.15), 2.75)], x - 0.012, x + 0.012, GLS))
    for (a, b) in (((T(2.62), 1.25), (T(2.62), 2.05)), ((T(3.85), 1.25), (T(3.85), 2.98)), ((T(2.62), 1.25), (T(3.85), 1.25))):
        tr.append(bar('dline', (x, a[0], a[1]), (x, b[0], b[1]), 0.026, 0.018, CH))
    tr.append(box2('dh', (x - 0.03, T(3.55), 1.85), (x + 0.03, T(3.72), 1.9), CH, bev=0.01))
    for k, z in enumerate((0.62, 0.95)):
        tr.append(box2('step', (sx * 1.15 - 0.12, T(2.7), z), (sx * 1.15 + 0.12, T(3.7), z + 0.05), ALU, bev=0.015))
    # west-coast mirror
    tr.append(tube('ma1', (x, T(2.65), 2.0), (sx * 1.48, T(2.6), 2.05), 0.02, CH, seg=8))
    tr.append(tube('ma2', (x, T(2.65), 2.75), (sx * 1.48, T(2.6), 2.7), 0.02, CH, seg=8))
    tr.append(box2('mir', (sx * 1.48 - 0.06, T(2.62), 1.95), (sx * 1.48 + 0.06, T(2.7), 2.8), CH, bev=0.025, seg=3))
    tr.append(box2('mirg', (sx * 1.48 - 0.045, T(2.705), 2.0), (sx * 1.48 + 0.045, T(2.715), 2.75), mat('mirror_glass', '#9FB8CC', 0.25)))
    tr.append(tube('hm', (sx * 0.95, T(0.8), 1.8), (sx * 1.15, T(0.75), 1.95), 0.012, CH, seg=6))
    tr.append(box2('hmir', (sx * 1.15 - 0.04, T(0.72), 1.9), (sx * 1.15 + 0.04, T(0.78), 2.02), CH, bev=0.01))
    # fuel tank (aluminium, along Y) with straps + step
    ft = cyl('ft', 0.32, 1.25, (sx * 0.98, T(4.15), 0.78), ALU, 'Y', seg=18, bev=0.04, bseg=2)
    tr.append(ft)
    for yy in (3.7, 4.6):
        tr.append(torus('strap', 0.325, 0.014, (sx * 0.98, T(yy), 0.78), CH, 'Y', seg=18, rseg=3))
    tr.append(cyl('cap', 0.07, 0.04, (sx * 0.98, T(4.3), 1.11), CH, seg=12))
    # exhaust stack + heat shield behind sleeper
    tr.append(tube('stack', (sx * 1.08, T(5.18), 1.1), (sx * 1.08, T(5.18), 4.15), 0.065, ALU, seg=12))
    tr.append(cyl('shield', 0.085, 0.9, (sx * 1.08, T(5.18), 2.2), GR, seg=12))
    tr.append(box2('hbar', (sx * 1.08 - 0.1, T(5.1), 3.2), (sx * 1.08 + 0.1, T(5.12), 3.25), CH))
# frame, deck plate, fifth wheel, mud flaps, rear fenders
for sx in (-1, 1):
    tr.append(box2('rail', (sx * 0.45 - 0.07, T(0.4), 0.72), (sx * 0.45 + 0.07, T(8.1), 1.02), CH, bev=0.01))
tr.append(box2('deck', (-0.9, T(5.05), 1.02), (0.9, T(6.0), 1.06), mat('deckplate', '#7D838A', 0.7), bev=0.01))
tr.append(box2('fw', (-0.5, T(6.4), 1.06), (0.5, T(7.3), 1.22), BK, bev=0.03, seg=3))
tr.append(box2('fwv', (-0.08, T(6.85), 1.2), (0.08, T(7.32), 1.225), CH))
for sx in (-1, 1):
    tr.append(box2('flap', (sx * 0.85 - 0.33, T(8.05), 0.25), (sx * 0.85 + 0.33, T(8.08), 0.95), BK, bev=0.008))
    for yy in (6.2, 7.5):
        tr.append(arch('rf', 0.6, 0.63, 0.66, (sx * 0.86, T(yy), 0.52), CH, a0=40, a1=140, seg=10, bev=0.01))
    tr.append(box2('tlt', (sx * 0.85 - 0.1, T(8.0), 0.98), (sx * 0.85 + 0.1, T(8.06), 1.06), RED))
tractor = join(tr, 'tractor', pivot=(0, T(6.85), 0))

wheels = {}
RW = 0.52
for nm, (x, ly, side, dual) in {'wheel_FL': (1.04, 1.35, 1, False), 'wheel_FR': (-1.04, 1.35, -1, False),
                                'wheel_RL1': (0.86, 6.2, 1, True), 'wheel_RR1': (-0.86, 6.2, -1, True),
                                'wheel_RL2': (0.86, 7.5, 1, True), 'wheel_RR2': (-0.86, 7.5, -1, True)}.items():
    wheels[nm] = wheel(nm, RW, 0.29, None, TY, ALU, HUB, seg=18, center=(x, T(ly), RW), rim_ratio=0.5, lugs=8, side=side,
                       dual=dual, inset=0.05, tn=2, back=True, hub_seg=12, lug_seg=5)

# ---- trailer 53 ft: local y 5.85 .. 22.0
Y0, Y1, Z0, Z1, HW = T(5.85), T(22.0), 1.25, 4.1, 1.3
KZ = 1.22   # fifth-wheel plate top = kingpin coupling plane
tl = []
tl.append(box2('tbox', (-HW, Y0, Z0), (HW, Y1 - 0.06, Z1), TW, bev=0.06, seg=3))
for sx in (-1, 1):
    x = sx * (HW + 0.004); ya, yb = Y0 + 0.08, Y1 - 0.14
    if sx > 0: pts = [(x, ya, Z0 + 0.06), (x, yb, Z0 + 0.06), (x, yb, Z1 - 0.06), (x, ya, Z1 - 0.06)]
    else: pts = [(x, yb, Z0 + 0.06), (x, ya, Z0 + 0.06), (x, ya, Z1 - 0.06), (x, yb, Z1 - 0.06)]
    tl.append(quad('decal', pts, SIDE))
    # 53' near rear lower corner
    ya2, yb2 = Y1 - 0.75, Y1 - 0.25
    pts = [(x * 1.0005, ya2, Z0 + 0.15), (x * 1.0005, yb2, Z0 + 0.15), (x * 1.0005, yb2, Z0 + 0.4), (x * 1.0005, ya2, Z0 + 0.4)] if sx > 0 else \
          [(x * 1.0005, yb2, Z0 + 0.15), (x * 1.0005, ya2, Z0 + 0.15), (x * 1.0005, ya2, Z0 + 0.4), (x * 1.0005, yb2, Z0 + 0.4)]
    tl.append(quad('m53', pts, M53))
    # bottom side rail, top rail, corner posts
    tl.append(box2('brail', (sx * HW - 0.03, Y0, Z0 - 0.02), (sx * HW + 0.03, Y1, Z0 + 0.1), TRIM, bev=0.01))
    tl.append(box2('trail', (sx * HW - 0.025, Y0, Z1 - 0.06), (sx * HW + 0.025, Y1, Z1 + 0.01), TRIM, bev=0.01))
    for yy in (Y0 + 0.03, Y1 - 0.08):
        tl.append(box2('cpost', (sx * HW - 0.04, yy - 0.06, Z0), (sx * HW + 0.04, yy + 0.06, Z1 + 0.004), TRIM, bev=0.015))
    for k in range(3):  # marker lights
        yy = Y0 + 0.4 + k * 7.6
        tl.append(box2('mk', (sx * (HW + 0.03) - 0.015, yy, Z0 + 0.03), (sx * (HW + 0.03) + 0.015, yy + 0.1, Z0 + 0.08), AMB))
        tl.append(box2('mkt', (sx * (HW + 0.03) - 0.015, yy, Z1 - 0.12), (sx * (HW + 0.03) + 0.015, yy + 0.08, Z1 - 0.07), AMB))
# rear frame
tl.append(box2('header', (-HW, Y1 - 0.12, Z1 - 0.22), (HW, Y1 + 0.02, Z1 + 0.01), TRIM, bev=0.02))
tl.append(box2('sill', (-HW, Y1 - 0.12, Z0 - 0.06), (HW, Y1 + 0.03, Z0 + 0.14), CH, bev=0.02))
for k, xx in enumerate((-1.05, -0.85, 0.85, 1.05)):
    tl.append(box2('tail', (xx - 0.07, Y1 + 0.03, Z0 - 0.02), (xx + 0.07, Y1 + 0.045, Z0 + 0.1), RED, bev=0.01))
for xx in (-0.3, 0.0, 0.3):
    tl.append(box2('idl', (xx - 0.04, Y1 + 0.02, Z1 - 0.12), (xx + 0.04, Y1 + 0.035, Z1 - 0.07), RED))
# underside: crossmembers, landing gear, slider, suspension, ICC bumper, flaps
for k in range(14):
    yy = Y0 + 2.6 + k * 0.85
    if yy > Y1 - 0.4: break
    tl.append(box2('xm', (-1.2, yy, Z0 - 0.12), (1.2, yy + 0.08, Z0), CH))
lgp = []
for sx in (-1, 1):
    x = sx * 0.85
    tl.append(box2('lg', (x - 0.07, T(8.6) - 0.07, 0.35), (x + 0.07, T(8.6) + 0.07, Z0 - 0.1), CH, bev=0.01))
    lgp.append(box2('lgi', (x - 0.05, T(8.6) - 0.05, 0.12), (x + 0.05, T(8.6) + 0.05, 0.4), GR))
    lgp.append(box2('pad', (x - 0.14, T(8.6) - 0.14, 0.0), (x + 0.14, T(8.6) + 0.14, 0.12), CH, bev=0.02))
    tl.append(box2('slr', (sx * 0.55 - 0.08, T(18.6), 0.9), (sx * 0.55 + 0.08, T(21.3), Z0 - 0.1), CH))
    tl.append(box2('flap', (sx * 0.86 - 0.33, T(21.35), 0.2), (sx * 0.86 + 0.33, T(21.38), 1.0), BK))
tl.append(box2('lgx', (-0.85, T(8.6) - 0.03, 0.75), (0.85, T(8.6) + 0.03, 0.8), CH))
tl.append(tube('crank', (0.92, T(8.6), 0.95), (1.18, T(8.6), 0.95), 0.02, CH, seg=6))
for yy in (19.3, 20.55):
    tl.append(cyl('axle', 0.07, 1.6, (0, T(yy), RW), CH, 'X', seg=12))
tl.append(box2('icc', (-1.15, Y1 - 0.18, 0.46), (1.15, Y1 - 0.04, 0.62), GR, bev=0.02))
for sx in (-1, 1):
    tl.append(box2('iccv', (sx * 0.6 - 0.05, Y1 - 0.4, 0.5), (sx * 0.6 + 0.05, Y1 - 0.1, Z0 - 0.08), CH))
    tl.append(box2('icct', (sx * 0.85 - 0.25, Y1 - 0.035, 0.48), (sx * 0.85 + 0.25, Y1 - 0.03, 0.6), RED))
tl.append(cyl('kingpin', 0.05, 0.1, (0, T(6.85), KZ - 0.04), CH, seg=12))
# upper coupler plate: trailer floor rests exactly on the fifth-wheel top (no gap)
tl.append(box2('coupler', (-0.62, T(6.0), KZ), (0.62, T(8.3), Z0 + 0.001), CH))
tl.append(box2('nosecap', (-HW + 0.06, Y0 - 0.03, Z0 + 0.06), (HW - 0.06, Y0 + 0.02, Z1 - 0.06), TRIM, bev=0.03))
tl.append(box2('glad', (-0.4, Y0 - 0.06, Z0 + 0.3), (0.4, Y0 - 0.02, Z0 + 0.45), CH, bev=0.01))
trailer = join(tl, 'trailer', pivot=(0, T(6.85), KZ))
landing = join(lgp, 'landing_gear', pivot=(0, T(8.6), 0.0))

for nm, (x, ly, side) in {'trailer_wheel_L1': (0.86, 19.3, 1), 'trailer_wheel_R1': (-0.86, 19.3, -1),
                          'trailer_wheel_L2': (0.86, 20.55, 1), 'trailer_wheel_R2': (-0.86, 20.55, -1)}.items():
    wheels[nm] = wheel(nm, RW, 0.29, None, TY, ALU, HUB, seg=18, center=(x, T(ly), RW), rim_ratio=0.5, lugs=8, side=side,
                       dual=True, inset=0.05, tn=2, back=True, hub_seg=12, lug_seg=5)

# rear doors (vehicle-left door = +X). pivot = outer hinge line, bottom.
doors = {}
DZ0, DZ1, DY = Z0 + 0.14, Z1 - 0.22, Y1 + 0.0
for nm, sx in (('trailer_door_L', 1), ('trailer_door_R', -1)):
    xo = sx * (HW - 0.06); xi = sx * 0.006
    p = [box2('door', (min(xo, xi), DY - 0.02, DZ0), (max(xo, xi), DY + 0.03, DZ1), TW, bev=0.012)]
    for k in range(4):
        z = DZ0 + 0.18 + k * (DZ1 - DZ0 - 0.36) / 3
        p.append(box2('hinge', (xo - sx * 0.2 if sx < 0 else xo - 0.2, DY + 0.03, z - 0.04), (xo + 0.06 if sx > 0 else xo + 0.2, DY + 0.05, z + 0.04), CH, bev=0.008))
        p.append(cyl('pin', 0.022, 0.1, (xo + sx * 0.04, DY + 0.045, z), CH, seg=8))
    for fx in (0.32, 0.78):
        xx = sx * fx
        p.append(tube('rod', (xx, DY + 0.07, DZ0 - 0.05), (xx, DY + 0.07, DZ1 + 0.05), 0.018, ALU, seg=8))
        for z in (DZ0 - 0.02, DZ1 + 0.02):
            p.append(box2('cam', (xx - 0.04, DY + 0.03, z - 0.04), (xx + 0.04, DY + 0.1, z + 0.04), CH, bev=0.008))
        p.append(box2('hbr', (xx - 0.03, DY + 0.03, 2.2), (xx + 0.03, DY + 0.08, 2.28), CH))
        p.append(bar('handle', (xx, DY + 0.09, 2.24), (xx - sx * 0.28, DY + 0.1, 2.24), 0.03, 0.03, ALU, bev=0.008))
        p.append(box2('hk', (xx - sx * 0.28 - 0.03, DY + 0.03, 2.2), (xx - sx * 0.28 + 0.03, DY + 0.07, 2.28), CH))
    if sx > 0:
        a, b = 0.36, 1.12
        p.append(quad('rdec', [(sx * a, DY + 0.0305, 3.0), (sx * b, DY + 0.0305, 3.0), (sx * b, DY + 0.0305, 3.76), (sx * a, DY + 0.0305, 3.76)], REAR,
                      uvs=((1, 0), (0, 0), (0, 1), (1, 1))))
    doors[nm] = join(p, nm, pivot=(xo, DY, DZ0))

root = empty('walmart_truck')
parent(tractor, root); parent(trailer, tractor); parent(landing, trailer)
# front steer knuckles: Empty on the kingpin axis (inboard of the tyre centre plane, at axle height); spin wheel is its child
KPX = 0.90
steer = {}
for nm, sx in (('steer_FL', 1), ('steer_FR', -1)):
    steer[nm] = empty(nm, (sx * KPX, T(1.35), RW)); parent(steer[nm], tractor)
for nm, w in wheels.items():
    if nm.startswith('trailer'): parent(w, trailer)
    elif nm in ('wheel_FL', 'wheel_FR'): parent(w, steer['steer_' + nm[-2:]])
    else: parent(w, tractor)
for d in doors.values(): parent(d, trailer)

_anc = empty('anchor_seat', (0.55, T(3.45), 1.95)); parent(_anc, tractor)
export('walmart_truck', dict(anchors={'anchor_seat': 'driver H-point (vehicle-left/+X seat, US LHD), child of tractor; face +Z'}, 
    facing='+Z (cab front toward +Z); total length ~22.0 m, trailer box 16.15 x 2.6 x 2.85 m (top at 4.10 m)',
    sides="L/R are the vehicle's own left/right: L = +X, R = -X",
    refs=['02_exterior_docks_walmartcom_trailers.png', '15_iso_dock_cutaway_trucks.jpg'],
    hierarchy='walmart_truck > tractor > {steer_FL > wheel_FL, steer_FR > wheel_FR, wheel_RL1/RR1/RL2/RR2, trailer > {landing_gear, trailer_wheel_*, trailer_door_L/R}}',
    rig={'drive': 'move/rotate the tractor node (or root) on the ground; tractor origin = ground point under the fifth wheel = centre of the rear tandem (bicycle-model rear axle)',
         'steer': 'rotate steer_FL/steer_FR about local Y (+ = turn toward +X/vehicle left), typical max +-35 deg; Ackermann: inner wheel more',
         'spin': 'rotate wheel_* about local X; angle = distance / 0.52 m (tyre radius)',
         'articulate': 'rotate trailer about local Y (its origin is exactly on the kingpin at the fifth-wheel plate top)',
         'landing_gear': 'translate landing_gear +Y by 0..0.25 m to retract the legs (pads off the ground)',
         'wheelbase': {'tractor_front_to_tandem_centre_m': 5.5, 'kingpin_to_trailer_tandem_centre_m': 13.075, 'track_front_m': 2.08}},
    nodes={'tractor': 'origin on the ground directly under the kingpin/fifth wheel (= rear tandem centre); drive node',
           'trailer': 'child of tractor; origin EXACTLY at the kingpin on the fifth-wheel plate top (y=1.22 m, 4.15 m behind the front of the overall origin): rotate about Y to articulate',
           'landing_gear': 'child of trailer; inner legs + sand pads; origin on the ground between the pads; translate +Y to raise',
           'steer_FL/steer_FR': 'children of tractor; Empty on the steering kingpin axis (x=+-0.90, at axle height 0.52 m), rotate about local Y to steer',
           'wheel_FL/FR': 'children of steer_FL/FR; origin exactly at the hub/axle centre, spin about local X',
           'wheel_RL1/RR1/RL2/RR2': 'tractor rear dual wheels, children of tractor, origin at axle centre, spin about local X',
           'trailer_wheel_L1/R1/L2/R2': 'trailer dual wheels, children of trailer, spin about local X',
           'trailer_door_L/R': 'children of trailer, origin on the outer hinge line at door bottom: rotate about Y to swing open (L: negative angle opens outward, R: positive)'},
    texture='trailer_side.png (Walmart + spark + com), trailer_rear.png, mark53.png embedded'))
render('walmart_truck', view=(1.0, -1.05, 0.42), lens=40, fill=0.8, res=1100)
closeups('walmart_truck', [('cab', (0, T(2.5), 1.8, 3.0), (1.0, -1.0, 0.4)), ('rear', (0, T(21.0), 2.2, 2.6), (0.8, 1.2, 0.35)), ('tandem', (0, T(7.0), 1.0, 2.2), (1.0, -0.4, 0.25))], rear=False)
