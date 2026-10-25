# shared builders for the newer assets (mast, pu wheels, yokes)
from lib import *

def puwheel(nm, x, y, r, w, tread_m, hub_m, seg=24):
    p = [cyl(nm + 't', r, w, (x, y, r), tread_m, 'X', seg=seg, bev=min(0.015, w * 0.15)),
         cyl(nm + 'h', r * 0.45, w + 0.012, (x, y, r), hub_m, 'X', seg=12, bev=0.004)]
    return join(p, nm, pivot=(x, y, r))

def yoke(nm, x, y, r, w, top, m, axle_m):
    p = [box2('yk', (x - w / 2 - 0.03, y - 0.03, r - 0.025), (x - w / 2 - 0.012, y + 0.03, top - 0.01), m, bev=0.004),
         box2('yk', (x + w / 2 + 0.012, y - 0.03, r - 0.025), (x + w / 2 + 0.03, y + 0.03, top - 0.01), m, bev=0.004),
         box2('ykt', (x - w / 2 - 0.036, y - 0.036, top - 0.02), (x + w / 2 + 0.036, y + 0.036, top), m, bev=0.004),
         cyl('axl', 0.012, w + 0.07, (x, y, r), axle_m, 'X', seg=8)]
    return join(p, nm, pivot=(x, y, r))

def fork_blade(name, x, yb, L, w, t, m, z0=0.0):
    """tapered fork tine: heel at y=yb, tip at yb-L (front=-Y), last 0.10 m tapers in thickness"""
    prof = [(yb, z0), (yb, z0 + t), (yb - L + 0.1, z0 + t), (yb - L, z0 + 0.01), (yb - L, z0)]
    return prism(name, prof[::-1], x - w / 2, x + w / 2, m, bev=0.006)

def mast2(MY, H, ox, mats, ext=1.6, free=1.2, base_z=0.06, back_h=1.07, cw=0.4, fork_x=0.27, fork_w=0.10, fork_t=0.045, FL=1.07, legs=False):
    """two-stage telescoping mast. returns (mast_outer, mast_inner, fork_carriage, info)
    MY: mast centre-line y; H: outer upright top; ox: outer upright centre x; mats: dict(rail, lip, accent, steel, chrome, grey)"""
    R, LIP, ACC, STL, CHR, GRY = (mats[k] for k in ('rail', 'lip', 'accent', 'steel', 'chrome', 'grey'))
    mo = []
    for sx in (-1, 1):
        x = sx * ox
        mo.append(box2('up_o', (x - 0.05, MY - 0.06, base_z), (x + 0.05, MY + 0.06, H), R, bev=0.012))
        mo.append(box2('up_l', (x - sx * 0.05 - 0.008, MY - 0.055, base_z + 0.01), (x - sx * 0.05 + 0.008, MY + 0.055, H - 0.01), LIP))
        if legs: mo.append(box2('leg', (x - 0.05, MY - 0.05, 0.0), (x + 0.05, MY + 0.32, base_z + 0.06), R, bev=0.015))
    mo.append(box2('tie_t', (-ox - 0.045, MY + 0.02, H - 0.06), (ox + 0.045, MY + 0.06, H - 0.003), R, bev=0.01))
    mo.append(box2('tie_m', (-ox - 0.045, MY + 0.02, H * 0.55), (ox + 0.045, MY + 0.06, H * 0.55 + 0.06), R, bev=0.01))
    mo.append(box2('tie_b', (-ox - 0.045, MY + 0.02, base_z + 0.02), (ox + 0.045, MY + 0.06, base_z + 0.09), R, bev=0.01))
    cyl_h = H - 0.3
    mo.append(cyl('liftcyl', 0.04, cyl_h, (0, MY + 0.1, base_z + 0.1 + cyl_h / 2), GRY, seg=16, bev=0.006))
    mo.append(box2('cylbase', (-0.07, MY + 0.03, base_z + 0.075), (0.07, MY + 0.17, base_z + 0.1), R, bev=0.006))
    outer = join(mo, 'mast_outer', pivot=(0, MY, 0))
    mi = []
    ix = ox - 0.09; Hi = H - 0.04
    for sx in (-1, 1):
        x = sx * ix
        mi.append(box2('up_i', (x - 0.035, MY - 0.055, base_z + 0.03), (x + 0.035, MY + 0.015, Hi), R, bev=0.01))
        mi.append(box2('up_il', (x - sx * 0.035 - 0.006, MY - 0.05, base_z + 0.04), (x - sx * 0.035 + 0.006, MY + 0.01, Hi - 0.01), LIP))
    mi.append(box2('xhead', (-ix - 0.04, MY - 0.055, Hi), (ix + 0.04, MY + 0.015, Hi + 0.04), R, bev=0.01))
    mi.append(box2('xbot', (-ix + 0.03, MY - 0.03, base_z + 0.06), (ix - 0.03, MY + 0.0, base_z + 0.11), R, bev=0.008))
    mi.append(box2('rodbrk', (-0.06, MY - 0.03, Hi + 0.043), (0.06, MY + 0.15, Hi + 0.09), R, bev=0.01))
    rod_l = Hi + 0.043 - base_z - 0.12   # rod bottom sits just above the cylinder floor at rest
    assert base_z + 0.12 + ext < base_z + H - 0.25, 'rod would leave its cylinder'
    mi.append(cyl('liftrod', 0.024, rod_l, (0, MY + 0.1, Hi + 0.043 - rod_l / 2), CHR, seg=12))
    for sx in (-1, 1):
        mi.append(box2('chain', (sx * 0.15 - 0.015, MY - 0.05, 0.55), (sx * 0.15 + 0.015, MY - 0.02, Hi - 0.03), GRY))
        mi.append(cyl('sheave', 0.05, 0.04, (sx * 0.15, MY - 0.035, Hi - 0.03), LIP, 'X', seg=16, bev=0.006))
    inner = join(mi, 'mast_inner', pivot=(0, MY, 0))
    fk = []
    FY = MY - 0.09
    fk.append(box2('carr', (-cw, FY - 0.04, 0.08), (cw, FY + 0.03, 0.62), LIP, bev=0.015))
    for z in (0.14, 0.56):
        fk.append(box2('carbar', (-cw - 0.02, FY - 0.06, z - 0.04), (cw + 0.02, FY - 0.02, z + 0.04), ACC, bev=0.012))
        for sx in (-1, 1):
            fk.append(cyl('roller', 0.028, 0.045, (sx * (ix - 0.012), MY - 0.035, z), GRY, 'Y', seg=14, bev=0.004))
    nb = 5
    for i in range(nb):
        x = -cw + 0.08 + i * (2 * cw - 0.16) / (nb - 1)
        fk.append(box2('back', (x - 0.015, FY - 0.04, 0.62), (x + 0.015, FY - 0.01, back_h - 0.02), STL))
    fk.append(box2('backtop', (-cw, FY - 0.05, back_h - 0.04), (cw, FY, back_h), STL, bev=0.01))
    for sx in (-1, 1):
        x = sx * fork_x
        fk.append(fork_blade('tine', x, FY - 0.04, FL, fork_w, fork_t, STL))
        fk.append(box2('shank', (x - fork_w / 2 + 0.005, FY - 0.08, 0.006), (x + fork_w / 2 - 0.005, FY - 0.03, 0.6), STL, bev=0.01))
    car = join(fk, 'fork_carriage', pivot=(0, FY, 0.0))
    info = dict(outer_top=H, inner_top=Hi, carriage_top=0.62, free_lift=free, inner_ext=ext,
                max_fork_height=round(free + ext, 2),
                stays_in_rails='carriage top %.2f + free lift %.2f = %.2f < inner rail top %.2f; inner stage keeps %.2f m overlap in the outer rails at full extension' % (0.62, free, 0.62 + free, Hi, H - (base_z + 0.03 + ext)))
    assert 0.62 + free < Hi and H - (base_z + 0.03 + ext) > 0.25, info
    return outer, inner, car, info
