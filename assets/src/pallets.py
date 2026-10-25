# Pallets (pine / blue wood / blue steel), pallet loads (full wrapped, half wrapped, partial) and a loose case stack.
# Pallet = 1.2 m (X) x 1.0 m (Blender Y = glTF Z) x 0.144 m, EPAL-style block construction built plank by plank.
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *

PL_X, PL_Y, PL_H = 1.2, 1.0, 0.144
TOPW = [0.145, 0.1, 0.1, 0.145, 0.1, 0.1, 0.145]

def wood_pallet(tones, block_tone, nail=True, seed=1):
    rnd = random.Random(seed)
    ms = [mat('wood_%d_%s' % (i, t.lstrip('#')), t, 0.86) for i, t in enumerate(tones)]
    mb = mat('wood_block_' + block_tone.lstrip('#'), block_tone, 0.88)
    NL = mat('nail_head', '#6E6A64', 0.7)
    P = []; hx, hy = PL_X / 2, PL_Y / 2
    rows_y = [(-hy, -hy + 0.1), (-0.0725, 0.0725), (hy - 0.1, hy)]       # bottom boards / block rows (along X)
    cols_x = [(-hx, -hx + 0.145), (-0.0725, 0.0725), (hx - 0.145, hx)]   # cross boards / block columns (along Y)
    for (y0, y1) in rows_y:
        P.append(box2('bot', (-hx, y0, 0.0), (hx, y1, 0.022), rnd.choice(ms), bev=0.004, seg=2))
    for (x0, x1) in cols_x:
        for (y0, y1) in rows_y:
            P.append(box2('blk', (x0 + 0.002, y0 + 0.002, 0.022), (x1 - 0.002, y1 - 0.002, 0.1), mb, bev=0.006, seg=2))
        P.append(box2('cross', (x0, -hy, 0.1), (x1, hy, 0.122), rnd.choice(ms), bev=0.004, seg=2))
    gap = (PL_Y - sum(TOPW)) / (len(TOPW) - 1); y = -hy
    tops = []
    for w in TOPW:
        P.append(box2('top', (-hx, y, 0.122), (hx, y + w, PL_H), rnd.choice(ms), bev=0.004, seg=2)); tops.append((y, y + w)); y += w + gap
    if nail:
        for (x0, x1) in cols_x:
            for (y0, y1) in tops:
                for k in (0.3, 0.7):
                    P.append(cyl('nail', 0.0055, 0.0016, ((x0 + x1) / 2 + (k - 0.5) * 0.06, (y0 + y1) / 2, PL_H + 0.0004), NL, seg=8))
    return P

def steel_pallet():
    B = mat('steel_pallet_blue', '#1E78D2', 0.72); BD = mat('steel_pallet_blue_dk', '#1763B4', 0.75)
    P = []; hx, hy = PL_X / 2, PL_Y / 2
    for yc in (-hy + 0.04, 0.0, hy - 0.04):
        r = box2('runner', (-hx, yc - 0.04, 0.0), (hx, yc + 0.04, 0.114), BD)
        for xc in (-0.4, 0.0, 0.4):
            c = box2('win', (xc - 0.15, yc - 0.06, 0.022), (xc + 0.15, yc + 0.06, 0.092), BD)
            boolean(r, c)
        bevel(r, 0.005, 2)
        P.append(r)
    n = 9; w = 0.1; gap = (PL_X - n * w) / (n - 1)
    for i in range(n):
        x0 = -hx + i * (w + gap)
        s = box2('slat', (x0, -hy, 0.114), (x0 + w, hy, PL_H), B, bev=0.006, seg=3)
        P.append(s)
        # slot pattern in each slat (pressed openings)
        for yc in (-0.25, 0.25):
            c = box2('slot', (x0 + 0.03, yc - 0.12, 0.11), (x0 + w - 0.03, yc + 0.12, 0.15), B)
            s.modifiers.remove(s.modifiers['bev']); boolean(s, c); bevel(s, 0.004, 2)
    return P

KRAFT = ['#C99A62', '#C39158', '#D0A46E']
def case(name, x, y, z, sx, sy, sz, rnd, label=True, rot=0):
    mk_ = mat('kraft_%d' % rnd.randrange(3), KRAFT[rnd.randrange(3)], 0.88)
    tp = mat('carton_tape', '#E2BE86', 0.6)
    out = carton(name, (sx, sy, sz), (x, y, z + sz / 2), mk_, tp, rot=rot, bev=0.008)
    if label:
        W = mat('label_white', '#F5F5F2', 0.75); BL = mat('brand_blue', '#0071CE', 0.65)
        c, s_ = math.cos(R(rot)), math.sin(R(rot))
        # label on the -Y face (front), offset sideways so it clears the tape
        lx, ly = -sx * 0.25, -(sy / 2 + 0.0015)
        p = Vector((x + lx * c - ly * s_, y + lx * s_ + ly * c, z + sz * 0.55))
        lb = box('lab', (min(0.12, sx * 0.3), 0.003, min(0.09, sz * 0.3)), p, W); lb.rotation_euler.z = R(rot)
        p2 = p + Vector((0, 0, min(0.09, sz * 0.3) * 0.32))
        p2 = p2 + Vector((-s_ * -0.0005, c * -0.0005, 0))
        lb2 = box('labb', (min(0.12, sx * 0.3) - 0.004, 0.0032, min(0.09, sz * 0.3) * 0.22), p2, BL); lb2.rotation_euler.z = R(rot)
        out += [lb, lb2]
    return out

def layer_grid(z, h, rnd, skip=()):
    out = []; nx, ny = 3, 2; cx, cy = PL_X / nx, PL_Y / ny
    for i in range(nx):
        for j in range(ny):
            if (i, j) in skip: continue
            x = -PL_X / 2 + cx * (i + 0.5); y = -PL_Y / 2 + cy * (j + 0.5)
            out += case('c', x, y, z, cx - 0.006, cy - 0.006, h, rnd, label=(j == 0))
    return out

def film(z0, z1):
    F = mat('stretch_film', '#DDE8EE', 0.35, alpha=0.32)
    return box2('film', (-PL_X / 2 - 0.008, -PL_Y / 2 - 0.008, z0), (PL_X / 2 + 0.008, PL_Y / 2 + 0.008, z1), F, bev=0.03, seg=3)

PINE = ['#E6C690', '#DDB87E', '#D2AC70']; PINE_BLK = '#C99C62'
BLUEW = ['#2272C4', '#1C67B6', '#2A7ACB']; BLUE_BLK = '#1B5EA6'

def finish(name, meta, view=(0.95, -1.25, 0.75), shots=()):
    export(name, meta); render(name, view=view); closeups(name, shots, rear=False)

ONLY = os.environ.get('ONLY', '')
def want(n): return not ONLY or n in ONLY.split(',')
STATIC = 'static prop: no moving parts'
PFACE = '1.2 m side along X, 1.0 m side along Z (4-way entry; either axis is valid for forks)'

for nm, tones, blk, ref in (('pallet_pine', PINE, PINE_BLK, ['09_pallet_wood_euro.jpg', '10_pallet_wood_stacked.jpg']),
                            ('pallet_bluewood', BLUEW, BLUE_BLK, ['11_pallet_blue_wood.jpg'])):
    if not want(nm): continue
    reset(); p = join(wood_pallet(tones, blk), 'pallet')
    root = empty(nm); parent(p, root)
    finish(nm, dict(facing=PFACE, refs=ref, nodes={'pallet': 'single merged mesh (every plank, block and nail head), origin ground centre; ' + STATIC}),
           shots=[('corner', (0.6, -0.5, 0.08, 0.25), (1.0, -0.8, 0.4))])

if want('pallet_steel'):
    reset(); p = join(steel_pallet(), 'pallet'); root = empty('pallet_steel'); parent(p, root)
    finish('pallet_steel', dict(facing=PFACE, refs=['12_pallet_blue_steel.jpg'], nodes={'pallet': 'single merged mesh, origin ground centre; ' + STATIC}),
           shots=[('corner', (0.6, -0.5, 0.08, 0.25), (1.0, -0.8, 0.4))])

LH = 0.339   # case layer pitch (0.335 case + 0.004 gap) -> 4 layers + pallet = 1.50 m
def load_asset(nm, layers, wrap, top_skip=(), pal=(PINE, PINE_BLK), refs=(), note=''):
    reset(); rnd = random.Random(hash(nm) & 0xffff)
    pal_o = join(wood_pallet(*pal), 'pallet')
    cs = []
    for k in range(layers):
        cs += layer_grid(PL_H + 0.0008 + k * LH, LH - 0.004, rnd, skip=top_skip if k == layers - 1 else ())
    load = join(cs, 'load')
    root = empty(nm); parent(pal_o, root); parent(load, root)
    top = PL_H + 0.0008 + layers * LH - 0.004
    nodes = {'pallet': 'pallet (merged), origin ground centre', 'load': 'cartons + tape + labels (merged); hide/show to load/unload'}
    if wrap:
        f = join([film(0.128, top + 0.006)], 'film'); parent(f, root)
        nodes['film'] = 'transparent stretch film (material stretch_film, alpha 0.32, roughness 0.35 for sheen)'
    finish(nm, dict(facing=PFACE, refs=list(refs), nodes=nodes, note=note, height_m=round(top + (0.006 if wrap else 0), 3)),
           shots=[('top', (0.6, -0.5, top - 0.1, 0.35), (1.0, -0.9, 0.6))])

if want('pallet_load_wrapped'):
    load_asset('pallet_load_wrapped', 4, True, refs=['01_interior_dock_forklifts.jpg', '14_iso_cutaway_orange_base.jpg', '03_interior_orange_racks_mezzanine.jpg'],
               note='full load: pine pallet + 4 layers x 6 cases (0.39 x 0.49 x 0.335 m), stretch wrapped; total ~1.5 m')
if want('pallet_load_half'):
    load_asset('pallet_load_half', 2, True, pal=(BLUEW, BLUE_BLK), refs=['14_iso_cutaway_orange_base.jpg'],
               note='half-height load on a blue (CHEP-style) pallet, 2 layers, wrapped; total ~0.83 m')
if want('pallet_load_partial'):
    load_asset('pallet_load_partial', 3, False, top_skip=((2, 0), (2, 1), (1, 1)), refs=['14_iso_cutaway_orange_base.jpg', '06_aisle_blue_racks.jpg'],
               note='partial (picked) load: 2 full layers + 3 of 6 cases on top, unwrapped')

if want('case_stack_loose'):
    reset(); rnd = random.Random(11); cs = []
    # bottom: 3 cases, middle: 2 rotated, top: 1 small (all on the floor, no pallet)
    spec = [(-0.41, -0.05, 0.0, 0.4, 0.5, 0.33, 3), (0.0, 0.02, 0.0, 0.4, 0.5, 0.33, -2), (0.41, -0.03, 0.0, 0.4, 0.5, 0.33, 4),
            (-0.21, 0.0, 0.33, 0.38, 0.46, 0.3, 8), (0.22, -0.02, 0.33, 0.38, 0.46, 0.3, -6),
            (0.0, -0.02, 0.63, 0.3, 0.36, 0.24, 15)]
    for (x, y, z, sx, sy, sz, r) in spec:
        cs += case('c', x, y, z + 0.0005 if z else z, sx, sy, sz, rnd, label=True, rot=r)
    st = join(cs, 'cases'); root = empty('case_stack_loose'); parent(st, root)
    finish('case_stack_loose', dict(facing='front labels face +Z', refs=['14_iso_cutaway_orange_base.jpg'],
                                    nodes={'cases': 'six loose cartons stacked on the floor (merged); ' + STATIC}),
           shots=[('labels', (0, -0.3, 0.5, 0.4), (0.4, -1.0, 0.4))])
