# Collapsible wire-mesh pallet cage (stillage) with a drop-gate (imgref 14, 03; preview "wire cage")
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
reset()
ZN = mat('cage_zinc', '#A7AEB6', 0.5); FR = mat('cage_frame', '#6E757D', 0.6); YEL = mat('brand_yellow', '#FFC220', 0.7)
L, W, H = 1.2, 1.0, 0.9     # outer footprint and height (x along L)
FH = 0.12                   # base/feet height
T = 0.03                    # frame tube
P = 0.1                     # mesh pitch
w = 0.005                   # wire thickness

def mesh_panel(p, axis, c, a0, a1, z0, z1, inward):
    """wire grid in plane axis=c (axis 'x' or 'y'); verticals on the plane, horizontals offset `inward`"""
    n = max(1, int(round((a1 - a0) / P)))
    for i in range(1, n):
        a = a0 + i * (a1 - a0) / n
        if axis == 'y': p.append(box2('v', (a - w / 2, c - w / 2, z0), (a + w / 2, c + w / 2, z1), ZN))
        else: p.append(box2('v', (c - w / 2, a - w / 2, z0), (c + w / 2, a + w / 2, z1), ZN))
    m = max(1, int(round((z1 - z0) / P)))
    for j in range(1, m):
        z = z0 + j * (z1 - z0) / m
        cc = c + inward * w
        if axis == 'y': p.append(box2('h', (a0, cc - w / 2, z - w / 2), (a1, cc + w / 2, z + w / 2), ZN))
        else: p.append(box2('h', (cc - w / 2, a0, z - w / 2), (cc + w / 2, a1, z + w / 2), ZN))

b = []
# base: deck frame + 4 corner feet (stackable cups on top of posts)
b.append(box2('deck', (-L / 2 + 0.01, -W / 2 + 0.01, FH - 0.03), (L / 2 - 0.01, W / 2 - 0.01, FH), FR, bev=0.006))
for sx in (-1, 1):
    for sy in (-1, 1):
        x, y = sx * (L / 2 - 0.05), sy * (W / 2 - 0.05)
        b.append(box2('foot', (x - 0.05, y - 0.05, 0.0), (x + 0.05, y + 0.05, FH - 0.03), FR, bev=0.008))
        b.append(box2('post', (sx * L / 2 - (T if sx > 0 else 0), sy * W / 2 - (T if sy > 0 else 0), FH), (sx * L / 2 + (0 if sx > 0 else T), sy * W / 2 + (0 if sy > 0 else T), H), FR, bev=0.005))
        b.append(cyl('cup', 0.025, 0.03, (sx * (L / 2 - T / 2), sy * (W / 2 - T / 2), H + 0.015), FR, seg=12, bev=0.004))
# top rails on 3 sides (front = -Y has the drop gate)
for sy in (1,):
    b.append(box2('rail_t', (-L / 2 + T, sy * W / 2 - T, H - T), (L / 2 - T, sy * W / 2, H), FR, bev=0.004))
for sx in (-1, 1):
    b.append(box2('rail_s', (sx * L / 2 - (T if sx > 0 else 0), -W / 2 + T, H - T), (sx * L / 2 + (0 if sx > 0 else T), W / 2 - T, H), FR, bev=0.004))
# skid rails between posts at deck level
b.append(box2('skid_b', (-L / 2 + T, W / 2 - T, FH), (L / 2 - T, W / 2, FH + T), FR, bev=0.004))
for sx in (-1, 1):
    b.append(box2('skid_s', (sx * L / 2 - (T if sx > 0 else 0), -W / 2 + T, FH), (sx * L / 2 + (0 if sx > 0 else T), W / 2 - T, FH + T), FR, bev=0.004))
mesh_panel(b, 'y', W / 2 - T / 2, -L / 2 + T, L / 2 - T, FH + T, H - T, -1)
for sx in (-1, 1):
    mesh_panel(b, 'x', sx * (L / 2 - T / 2), -W / 2 + T, W / 2 - T, FH + T, H - T, -sx)
# yellow ID plate on the back
b.append(box2('plate', (-0.15, W / 2, H - 0.2), (0.15, W / 2 + 0.006, H - 0.08), YEL, bev=0.002))
body = join(b, 'cage_body', pivot=(0, 0, 0))

# drop gate (front, -Y): hinged at the bottom; origin on the hinge axis
GZ = FH + T
g = [box2('gf_b', (-L / 2 + T + 0.005, -W / 2, GZ), (L / 2 - T - 0.005, -W / 2 + T, GZ + T), FR, bev=0.004),
     box2('gf_t', (-L / 2 + T + 0.005, -W / 2, H - T), (L / 2 - T - 0.005, -W / 2 + T, H), FR, bev=0.004)]
for sx in (-1, 1):
    g.append(box2('gf_s', (sx * (L / 2 - T - 0.005) - (T if sx > 0 else 0), -W / 2, GZ + T), (sx * (L / 2 - T - 0.005) + (0 if sx > 0 else T), -W / 2 + T, H - T), FR, bev=0.004))
mesh_panel(g, 'y', -W / 2 + T / 2, -L / 2 + 2 * T + 0.005, L / 2 - 2 * T - 0.005, GZ + T, H - T, 1)
for sx in (-1, 1):
    g.append(box2('latch', (sx * 0.45 - 0.03, -W / 2 - 0.02, H - 0.06), (sx * 0.45 + 0.03, -W / 2, H - 0.01), YEL, bev=0.004))
gate = join(g, 'gate', pivot=(0, -W / 2 + T / 2, GZ))

root = empty('cage')
parent(body, root); parent(gate, body)
export('cage', dict(
    facing='+Z = drop-gate side', refs=['14_iso_cutaway_orange_base.jpg', '03_interior_orange_racks_mezzanine.jpg'],
    dims={'outer_m': [L, H + 0.03, W], 'pallet_footprint': '1.2 x 1.0 m, stackable 4-high (corner cups)'},
    hierarchy='cage > cage_body > gate',
    rig={'gate': 'rotate gate about local X: 0 = closed, +90 deg = dropped open outward (+Z); origin on the bottom hinge axis'},
    nodes={'cage_body': 'base with feet, corner posts, 3 mesh walls; origin ground centre', 'gate': 'front drop gate, origin on its hinge'}))
render('cage', view=(1.0, -1.25, 0.7))
closeups('cage', [('corner', (L / 2, -W / 2, 0.8, 0.3), (1.0, -1.0, 0.7))])
