# Selective pallet racking bay: blue uprights, orange step beams, wire decks (imgref 06, 07, 03)
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
reset()
BLU = mat('rack_upright_blue', '#1F5FB8', 0.72); ORG = mat('rack_beam_orange', '#EE7A1E', 0.7)
WIRE = mat('wire_deck', '#9AA1A9', 0.5); PLT = mat('rack_baseplate', '#5B6068', 0.75); YEL = mat('brand_yellow', '#FFC220', 0.7)
SPAN = 2.70          # clear beam span between uprights
UW, UD = 0.09, 0.075 # upright face width (x) and depth (y)
D = 1.07             # frame depth (outer face to outer face)
H = 6.0              # frame height
LEVELS = [1.60, 3.10, 4.60]  # top of beam
XU = SPAN / 2 + UW / 2
BH, BT = 0.12, 0.05  # beam height, thickness

def frame(nm, xc):
    p = []
    for yc in (-D / 2 + UD / 2, D / 2 - UD / 2):
        p.append(box2('up', (xc - UW / 2, yc - UD / 2, 0.012), (xc + UW / 2, yc + UD / 2, H), BLU, bev=0.008))
        p.append(box2('bp', (xc - 0.075, yc - 0.075, 0.0), (xc + 0.075, yc + 0.075, 0.012), PLT, bev=0.003))
        # column guard (yellow) on the aisle side
        if yc < 0: p.append(box2('cg', (xc - 0.07, yc - UD / 2 - 0.035, 0.012), (xc + 0.07, yc - UD / 2 - 0.005, 0.45), YEL, bev=0.008))
    # horizontals + diagonals (Z bracing) inside the frame, 0.04 x 0.03 lips
    y0, y1 = -D / 2 + UD, D / 2 - UD
    zs = [0.15] + [0.15 + i * 1.2 for i in range(1, 5)] + [H - 0.15]
    for z in (0.15, H - 0.15):
        p.append(bar('hb', (xc, y0 - 0.001, z), (xc, y1 + 0.001, z), 0.035, 0.04, BLU))
    for i in range(len(zs) - 1):
        a, b = zs[i], zs[i + 1]
        if i % 2 == 0: p.append(bar('dg', (xc, y0 + 0.01, a + 0.02), (xc, y1 - 0.01, b - 0.02), 0.033, 0.03, BLU))
        else: p.append(bar('dg', (xc, y1 - 0.01, a + 0.02), (xc, y0 + 0.01, b - 0.02), 0.033, 0.03, BLU))
    return join(p, nm, pivot=(xc, 0, 0))

def level(nm, z):
    p = []
    h = SPAN / 2
    for sy in (-1, 1):
        yo = sy * (D / 2 - 0.005); yi = sy * (D / 2 - 0.005 - BT)
        y0, y1 = min(yo, yi), max(yo, yi)
        p.append(box2('beam', (-h, y0, z - BH), (h, y1, z), ORG, bev=0.01, seg=3))
        c0, c1 = (yi - 0.006, yi) if sy > 0 else (yi, yi + 0.006)
        for sx in (-1, 1):
            xa, xb = (h - 0.06, h) if sx > 0 else (-h, -h + 0.06)
            p.append(box2('conn', (xa, c0, z - BH - 0.06), (xb, c1, z - 0.005), ORG, bev=0.002))
    # galvanised wire deck resting on the beams
    for cx in (-0.9, 0.0, 0.9):
        p.append(box2('ch', (cx - 0.02, -D / 2 + 0.005, z), (cx + 0.02, D / 2 - 0.005, z + 0.03), WIRE, bev=0.003))
    for i in range(25):
        xx = -h + 0.05 + i * (SPAN - 0.1) / 24
        p.append(box2('w', (xx - 0.003, -D / 2 + 0.015, z + 0.028), (xx + 0.003, D / 2 - 0.015, z + 0.034), WIRE))
    for yy in (-D / 2 + 0.03, -0.25, 0.25, D / 2 - 0.03):
        p.append(box2('xw', (-h + 0.03, yy - 0.003, z + 0.022), (h - 0.03, yy + 0.003, z + 0.028), WIRE))
    return join(p, nm, pivot=(0, 0, z))

root = empty('rack_bay')
parent(frame('upright_frame_L', XU), root)
parent(frame('upright_frame_R', -XU), root)
for i, z in enumerate(LEVELS):
    parent(level('beam_level_%d' % (i + 1), z), root)

export('rack_bay', dict(
    facing='+Z = aisle (pick) face; beams run along X', refs=['06_aisle_blue_racks.jpg', '07_overhead_aisle_wire_decks.jpg', '03_interior_orange_racks_mezzanine.jpg'],
    hierarchy='rack_bay > {upright_frame_L, upright_frame_R, beam_level_1, beam_level_2, beam_level_3}',
    dims={'clear_span_m': SPAN, 'overall_width_m': round(SPAN + 2 * UW, 3), 'frame_depth_m': D, 'frame_height_m': H, 'beam_tops_m': LEVELS,
          'bay_pitch_m': round(SPAN + UW, 3), 'pallets_per_level': '2 x 1.2 m (1.0 m deep) pallets'},
    rig={'tiling': 'for a run of N bays, clone the whole bay every %.2f m along X and hide upright_frame_R on all but the last bay (frames are shared)' % (SPAN + UW),
         'levels': 'beam_level_* origins are at the beam top (pallet seat) height on the bay centre-line; translate Y to re-space levels'},
    nodes={'upright_frame_L/R': 'two uprights + Z-bracing + base plates + yellow column guards; origin at the frame centre on the ground',
           'beam_level_N': 'front+back orange step beams with connectors and a galvanised wire deck; origin at the beam top'}))
render('rack_bay', view=(1.0, -1.3, 0.55))
closeups('rack_bay', [('beam_conn', (XU, -D / 2, 1.55, 0.35), (0.9, -1.0, 0.5)), ('base', (XU, -D / 2, 0.2, 0.4), (0.9, -1.0, 0.5))])
