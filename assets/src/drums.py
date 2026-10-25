# 55-gal (205 L) steel drums: blue / green / yellow with red bands (matched to imgref/14_iso_cutaway_orange_base.jpg, 15)
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
reset()
RED = mat('drum_red_band', '#D52B2B', 0.7); GRY = mat('drum_grey', '#8A8F96', 0.6)
D, H = 0.58, 0.88; r = D / 2
cols = {'blue': '#1F6FD1', 'green': '#2E9E4A', 'yellow': '#F5C027'}
root = empty('drums')
for i, (nm, c) in enumerate(cols.items()):
    M = mat('drum_' + nm, c, 0.72)
    x = (i - 1) * 0.66
    p = []
    # shell (lathe): slight inset ends, rolled chimes at both ends
    prof = [(0.0, 0.02), (r - 0.02, 0.02), (r - 0.012, 0.03), (r, 0.03), (r, H - 0.03), (r - 0.012, H - 0.03), (r - 0.02, H - 0.02), (0.0, H - 0.02)]
    p.append(lathe('shell', prof, (x, 0, 0), M, 'Z', seg=40))
    # chime rings (rolled rims) top + bottom
    p.append(torus('chime_b', r - 0.004, 0.012, (x, 0, 0.012), M, 'Z', seg=40, rseg=8))
    p.append(torus('chime_t', r - 0.004, 0.012, (x, 0, H - 0.012), M, 'Z', seg=40, rseg=8))
    # 2 rolling hoops at 1/3 and 2/3
    for z in (H / 3, 2 * H / 3):
        p.append(torus('hoop', r, 0.01, (x, 0, z), M, 'Z', seg=40, rseg=8))
    # red bands (painted stripes, slightly proud)
    for z in (0.1, H - 0.1):
        p.append(cyl('band', r + 0.003, 0.07, (x, 0, z), RED, seg=40))
    # bungs on the lid
    p.append(cyl('bung2', 0.03, 0.012, (x + 0.18, 0, H - 0.006), GRY, seg=16, bev=0.003))
    p.append(cyl('bung34', 0.02, 0.012, (x - 0.18, 0, H - 0.006), GRY, seg=12, bev=0.003))
    o = join(p, 'drum_' + nm, pivot=(x, 0, 0))
    parent(o, root)
export('drums', dict(
    facing='symmetric (rotate freely about Y); drums sit along X, 0.66 m apart', refs=['14_iso_cutaway_orange_base.jpg', '15_iso_dock_cutaway_trucks.jpg'],
    hierarchy='drums > {drum_blue, drum_green, drum_yellow}',
    nodes={'drum_blue/green/yellow': 'one 205 L drum each, 0.58 m dia x 0.88 m, two red bands; origin at the bottom centre on the ground (clone + reposition individually)'}))
render('drums', view=(1.0, -1.3, 0.8))
closeups('drums', [('rim', (0.66, 0, 0.85, 0.25), (0.8, -1.0, 0.8))], rear=False)
