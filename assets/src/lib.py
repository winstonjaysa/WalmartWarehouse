"""Shared helpers for the GateFlow Walmart DC hero assets (Blender 4.2, run headless).
Convention while modelling (Blender space): Z up, FRONT = -Y, right = +X.
glTF export converts to Y-up, so FRONT faces +Z in three.js, right = +X (three.js -X is model left... see manifest).
Origins at ground centre unless noted."""
import bpy, bmesh, math, os, json, random
from mathutils import Vector, Matrix, Euler

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
RAW = os.path.join(ROOT, 'raw'); RENDERS = os.path.join(ROOT, 'renders'); TEX = os.path.join(HERE, 'tex')
META = os.path.join(HERE, 'meta')
for d in (RAW, RENDERS, META): os.makedirs(d, exist_ok=True)
R = math.radians

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    random.seed(7)

def lin(c):
    if isinstance(c, str):
        c = c.lstrip('#'); c = tuple(int(c[i:i + 2], 16) / 255 for i in (0, 2, 4))
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)

def mat(name, col='#cccccc', rough=0.82, emit=None, estr=3.0, alpha=None, tex=None, metal=0.0):
    if name in bpy.data.materials: return bpy.data.materials[name]
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*lin(col), 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    m.diffuse_color = (*lin(col), 1)
    if emit:
        b.inputs['Emission Color'].default_value = (*lin(emit), 1)
        b.inputs['Emission Strength'].default_value = estr
    if alpha is not None:
        b.inputs['Alpha'].default_value = alpha
        try: m.blend_method = 'BLEND'
        except Exception: pass
        try: m.surface_render_method = 'BLENDED'
        except Exception: pass
    if tex:
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(tex)
        t.interpolation = 'Linear'
        nt.links.new(t.outputs['Color'], b.inputs['Base Color'])
    return m

# ---------------------------------------------------------------- primitives
def _link(o):
    bpy.context.scene.collection.objects.link(o); return o

def mk(name, bm, m=None, loc=(0, 0, 0), rot=None):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = _link(bpy.data.objects.new(name, me))
    if m is not None:
        for mm in (m if isinstance(m, (list, tuple)) else [m]): me.materials.append(mm)
    o.location = loc
    if rot: o.rotation_euler = [R(a) for a in rot]
    return o

def bevel(o, w, seg=2, angle=40, clamp=True):
    if w <= 0: return o
    md = o.modifiers.new('bev', 'BEVEL'); md.width = w; md.segments = max(2, seg)
    md.limit_method = 'ANGLE'; md.angle_limit = R(angle); md.use_clamp_overlap = clamp
    md.harden_normals = True; md.miter_outer = 'MITER_ARC'
    return o

def box(name, size, loc, m, bev=0.0, seg=2, rot=None, uv=False):
    bm = bmesh.new()
    if uv: bm.loops.layers.uv.new('UVMap')
    bmesh.ops.create_cube(bm, size=1.0, calc_uvs=uv)
    bmesh.ops.scale(bm, vec=Vector(size), verts=bm.verts)
    o = mk(name, bm, m, loc, rot)
    return bevel(o, bev, seg)

def box2(name, a, b, m, bev=0.0, seg=2):
    """axis aligned box from corner a to corner b"""
    a, b = Vector(a), Vector(b)
    return box(name, [abs(b[i] - a[i]) for i in range(3)], (a + b) / 2, m, bev, seg)

def hexa(name, v, m, bev=0.0, seg=2):
    """8 vertex block. order: bottom (x-,y-),(x+,y-),(x+,y+),(x-,y+), then top same order"""
    bm = bmesh.new(); vs = [bm.verts.new(p) for p in v]
    for f in ((0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)):
        bm.faces.new([vs[i] for i in f])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bevel(mk(name, bm, m), bev, seg)

def cyl(name, r, depth, loc, m, axis='Z', seg=24, bev=0.0, bseg=2, r2=None, cap=True, rot=None):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=cap, cap_tris=False, segments=seg, radius1=r, radius2=r if r2 is None else r2, depth=depth)
    if axis == 'X': bmesh.ops.rotate(bm, verts=bm.verts, matrix=Matrix.Rotation(R(90), 3, 'Y'))
    if axis == 'Y': bmesh.ops.rotate(bm, verts=bm.verts, matrix=Matrix.Rotation(R(90), 3, 'X'))
    o = mk(name, bm, m, loc, rot)
    return bevel(o, bev, bseg, angle=50)

def sphere(name, r, loc, m, seg=24, rings=12, scale=(1, 1, 1)):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r)
    bmesh.ops.scale(bm, vec=Vector(scale), verts=bm.verts)
    return mk(name, bm, m, loc)

def lathe(name, prof, loc, m, axis='Z', seg=32, angle=360.0, closed=False):
    """revolve profile [(radius, height),...] around Z (then reoriented to axis). closed=True joins last->first point."""
    bm = bmesh.new()
    vs = [bm.verts.new((r, 0, h)) for r, h in prof]
    es = [bm.edges.new((vs[i], vs[i + 1])) for i in range(len(vs) - 1)]
    if closed: es.append(bm.edges.new((vs[-1], vs[0])))
    full = abs(angle - 360) < 1e-3
    bmesh.ops.spin(bm, geom=vs + es, cent=(0, 0, 0), axis=(0, 0, 1), angle=R(angle), steps=seg, use_duplicate=False)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    # close poles
    if axis == 'X': bmesh.ops.rotate(bm, verts=bm.verts, matrix=Matrix.Rotation(R(90), 3, 'Y'))
    if axis == 'Y': bmesh.ops.rotate(bm, verts=bm.verts, matrix=Matrix.Rotation(R(-90), 3, 'X'))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return mk(name, bm, m, loc)

def torus(name, R1, r2, loc, m, axis='Z', seg=32, rseg=10):
    prof = [(R1 + r2 * math.cos(2 * math.pi * i / rseg), r2 * math.sin(2 * math.pi * i / rseg)) for i in range(rseg + 1)]
    return lathe(name, prof, loc, m, axis, seg)

def tube(name, p0, p1, r, m, seg=12, cap=True):
    """cylinder between two points"""
    p0, p1 = Vector(p0), Vector(p1); d = p1 - p0
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=cap, segments=seg, radius1=r, radius2=r, depth=d.length)
    q = Vector((0, 0, 1)).rotation_difference(d.normalized())
    bmesh.ops.rotate(bm, verts=bm.verts, matrix=q.to_matrix())
    return mk(name, bm, m, (p0 + p1) / 2)

def bar(name, p0, p1, w, h, m, bev=0.0, up=(0, 0, 1)):
    """rectangular bar between two points, w across, h along 'up'-ish"""
    p0, p1 = Vector(p0), Vector(p1); d = p1 - p0
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=(w, d.length, h), verts=bm.verts)
    y = d.normalized(); upv = Vector(up)
    if abs(y.dot(upv)) > 0.99: upv = Vector((1, 0, 0))
    x = y.cross(upv).normalized(); z = x.cross(y)
    M = Matrix((x, y, z)).transposed()
    bmesh.ops.rotate(bm, verts=bm.verts, matrix=M)
    return bevel(mk(name, bm, m, (p0 + p1) / 2), bev, 2)

def prism(name, prof, x0, x1, m, bev=0.0, seg=2):
    """polygon profile [(y,z),...] (CCW seen from +X) extruded along X from x0 to x1"""
    bm = bmesh.new()
    vs = [bm.verts.new((x0, y, z)) for y, z in prof]
    f = bm.faces.new(vs)
    r = bmesh.ops.extrude_face_region(bm, geom=[f])
    nv = [g for g in r['geom'] if isinstance(g, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, vec=(x1 - x0, 0, 0), verts=nv)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bevel(mk(name, bm, m), bev, seg)

def quad(name, pts, m, uvs=((0, 0), (1, 0), (1, 1), (0, 1))):
    bm = bmesh.new(); uv = bm.loops.layers.uv.new('UVMap')
    f = bm.faces.new([bm.verts.new(p) for p in pts])
    for l, t in zip(f.loops, uvs): l[uv].uv = t
    return mk(name, bm, m)

def boolean(o, cutter, op='DIFFERENCE'):
    md = o.modifiers.new('bool', 'BOOLEAN'); md.object = cutter; md.operation = op; md.solver = 'EXACT'
    cutter.hide_render = True; cutter.hide_viewport = True
    return o

def mirror_x(objs):
    out = []
    for o in objs:
        c = o.copy(); c.data = o.data.copy(); _link(c)
        c.location.x = -c.location.x
        c.rotation_euler.y = -c.rotation_euler.y; c.rotation_euler.z = -c.rotation_euler.z
        c.scale.x = -c.scale.x
        out.append(c)
    return out

def dup(o, loc=None, rot=None, name=None):
    c = o.copy(); c.data = o.data.copy(); _link(c)
    if name: c.name = name
    if loc is not None: c.location = loc
    if rot is not None: c.rotation_euler = [R(a) for a in rot]
    return c

# ---------------------------------------------------------------- assembly
def smooth_by_angle(bm, ang=50):
    for f in bm.faces: f.smooth = True
    for e in bm.edges:
        if len(e.link_faces) != 2: e.smooth = False; continue
        try: e.smooth = e.calc_face_angle() < R(ang)
        except ValueError: e.smooth = False

_PART_ID = 0
def join(objs, name, pivot=(0, 0, 0), ang=35, keep_uv=True):
    """Apply modifiers+transforms of objs, merge into ONE mesh object whose origin is `pivot` (world)."""
    objs = [o for o in objs if o is not None]
    dg = bpy.context.evaluated_depsgraph_get()
    mats = []; bm = bmesh.new()
    for o in objs:
        me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
        me.transform(o.matrix_world)
        if o.matrix_world.determinant() < 0: me.flip_normals()
        remap = []
        for mm in me.materials:
            if mm not in mats: mats.append(mm)
            remap.append(mats.index(mm))
        if remap:
            for p in me.polygons: p.material_index = remap[min(p.material_index, len(remap) - 1)]
        if keep_uv and not me.uv_layers: me.uv_layers.new(name='UVMap')
        tb = bmesh.new(); tb.from_mesh(me)
        if all(len(e.link_faces) == 2 for e in tb.edges):   # closed part: force outward normals
            bmesh.ops.recalc_face_normals(tb, faces=tb.faces)
        tb.to_mesh(me); tb.free()
        if 'part' not in me.attributes: me.attributes.new('part', 'INT', 'FACE')
        global _PART_ID; _PART_ID += 1
        me.attributes['part'].data.foreach_set('value', [_PART_ID] * len(me.polygons))
        bm.from_mesh(me); bpy.data.meshes.remove(me)
    for o in objs:
        for md in list(o.modifiers):
            if md.type == 'BOOLEAN' and md.object and md.object.name in bpy.data.objects:
                pass
    cutters = set()
    for o in objs:
        for md in o.modifiers:
            if md.type == 'BOOLEAN' and md.object: cutters.add(md.object)
    for o in objs: bpy.data.objects.remove(o, do_unlink=True)
    for c in cutters:
        try: bpy.data.objects.remove(c, do_unlink=True)
        except ReferenceError: pass
    bmesh.ops.translate(bm, vec=-Vector(pivot), verts=bm.verts)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    smooth_by_angle(bm, ang)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for mm in mats: me.materials.append(mm)
    o = _link(bpy.data.objects.new(name, me)); o.location = pivot
    bake_normals(o)
    return o

def bake_normals(o):
    """weighted (face-area) custom normals respecting sharp edges, baked into the mesh: clean flat faces + soft bevels"""
    md = o.modifiers.new('wn', 'WEIGHTED_NORMAL'); md.mode = 'FACE_AREA'; md.keep_sharp = True; md.weight = 50
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    me2 = bpy.data.meshes.new_from_object(o.evaluated_get(dg), preserve_all_data_layers=True, depsgraph=dg)
    old = o.data; o.modifiers.remove(md); o.data = me2; me2.name = old.name
    bpy.data.meshes.remove(old)

def empty(name, loc=(0, 0, 0)):
    o = _link(bpy.data.objects.new(name, None)); o.location = loc; o.empty_display_size = 0.3
    return o

def parent(child, par):
    bpy.context.view_layer.update()
    mw = child.matrix_world.copy()
    child.parent = par; child.matrix_parent_inverse = Matrix.Identity(4)
    child.matrix_basis = par.matrix_world.inverted() @ mw
    bpy.context.view_layer.update()
    return child

def tri_count():
    dg = bpy.context.evaluated_depsgraph_get(); n = 0
    for o in bpy.context.scene.objects:
        if o.type == 'MESH' and not o.hide_render:
            me = o.evaluated_get(dg).to_mesh(); me.calc_loop_triangles(); n += len(me.loop_triangles)
            o.evaluated_get(dg).to_mesh_clear()
    return n

# ---------------------------------------------------------------- export / render
def pivotize():
    """Every mesh node becomes: Empty '<name>' (keeps pivot/transform) -> Mesh '<name>_geo' (identity local).
    Mesh quantisation (meshopt) may then rewrite only the *_geo leaf transforms, never the animatable pivots."""
    for o in [o for o in bpy.context.scene.objects if o.type == 'MESH' and not o.name.startswith('_')]:
        if any(m.type == 'ARMATURE' for m in o.modifiers): continue
        nm = o.name; o.name = nm + '_geo'; o.data.name = nm
        e = empty(nm); e.parent = o.parent; e.matrix_parent_inverse = o.matrix_parent_inverse.copy()
        e.matrix_basis = o.matrix_basis.copy()
        bpy.context.view_layer.update()
        for c in list(o.children):
            mw = c.matrix_world.copy(); c.parent = e; c.matrix_parent_inverse = Matrix.Identity(4); c.matrix_basis = e.matrix_world.inverted() @ mw
        o.parent = e; o.matrix_parent_inverse = Matrix.Identity(4); o.matrix_basis = Matrix.Identity(4)
        bpy.context.view_layer.update()
    bpy.context.view_layer.update()

def scene_checks():
    """world-space QA over every visible mesh: min z, coplanar same-facing overlaps between different parts (z-fight), open edges."""
    from mathutils.bvhtree import BVHTree
    dg = bpy.context.evaluated_depsgraph_get()
    bm = bmesh.new(); pid = []
    for k, o in enumerate([o for o in bpy.context.scene.objects if o.type == 'MESH' and not o.hide_render and not o.name.startswith('_')]):
        me = bpy.data.meshes.new_from_object(o.evaluated_get(dg)); me.transform(o.matrix_world)
        pa = [0] * len(me.polygons)
        if 'part' in me.attributes: me.attributes['part'].data.foreach_get('value', pa)
        pid += [(k, p) for p in pa]
        bm.from_mesh(me); bpy.data.meshes.remove(me)
    bm.faces.ensure_lookup_table()
    minz = min(v.co.z for v in bm.verts) if bm.verts else 0
    bvh = BVHTree.FromBMesh(bm)
    bad = 0; badpos = []
    for f in bm.faces:
        if f.calc_area() < 1e-6: continue
        c = f.calc_center_median(); n = f.normal
        for (co, nn, idx, d) in bvh.find_nearest_range(c, 2e-4):
            if idx != f.index and pid[idx] != pid[f.index] and nn.dot(n) > 0.995:
                bad += 1; badpos.append(tuple(round(x, 3) for x in c)); break
    tmp = bmesh.new()
    names = [o.name for o in bpy.context.scene.objects if o.type == 'MESH' and not o.hide_render and not o.name.startswith('_')]
    openedges = 0; per = {}; osamp = []
    for e in bm.edges:
        if len(e.link_faces) == 1:
            openedges += 1; nm = names[pid[e.link_faces[0].index][0]]; per[nm] = per.get(nm, 0) + 1
            if len(osamp) < 8: osamp.append(tuple(round(x, 3) for x in (e.verts[0].co + e.verts[1].co) / 2))
    bm.free(); tmp.free()
    return dict(min_z=round(minz, 5), zfight_faces=bad, zfight_samples=badpos[:12], open_edges=openedges, open_by_node=per, open_samples=osamp)

def export(name, meta):
    bpy.context.view_layer.update()
    qa = scene_checks()
    # snap ground contact to exactly z=0 by moving the root(s)
    if abs(qa['min_z']) > 1e-6:
        for o in [o for o in bpy.context.scene.objects if o.parent is None and not o.name.startswith('_')]:
            # keep an Empty root at the true ground origin; move its children instead
            for t in (list(o.children) if o.type == 'EMPTY' else [o]):
                t.location.z -= qa['min_z']
        bpy.context.view_layer.update()
    qa['ground_shift'] = round(-qa['min_z'], 5)
    print('QA', name, json.dumps(qa))
    if name in MERGE_ASSETS: meta = dict(meta); meta['material_pass'] = merge_materials(name)
    pivotize()
    for o in list(bpy.context.scene.objects):
        if o.hide_render and o.type == 'MESH': bpy.data.objects.remove(o, do_unlink=True)
    path = os.path.join(RAW, name + '.glb')
    kw = dict(filepath=path, export_format='GLB', export_apply=True, export_yup=True, use_selection=False,
              export_cameras=False, export_lights=False, export_extras=False, export_texcoords=True,
              export_normals=True, export_materials='EXPORT', export_image_format='AUTO')
    if meta.get('animations'):
        kw.update(export_animations=True, export_animation_mode='NLA_TRACKS', export_skins=True,
                  export_force_sampling=True, export_def_bones=False, export_anim_single_armature=True)
    else:
        kw.update(export_animations=False)
    bpy.ops.export_scene.gltf(**kw)
    meta = dict(meta); meta['qa'] = qa; meta['blender_tris'] = tri_count(); meta['file'] = name + '.glb'
    with open(os.path.join(META, name + '.json'), 'w') as f: json.dump(meta, f, indent=1)
    print('EXPORTED', path, meta['blender_tris'])

def render(name, res=900, dist_mul=1.0, view=(0.95, -1.25, 0.75), lens=50, ground='#ECE6DC', samples=48, target=None, fill=0.86, outdir=None, backdrop='gradient'):
    """3/4 render, camera auto-fitted so the projected bbox fills `fill` of the frame (target only aims the fit box)."""
    from bpy_extras.object_utils import world_to_camera_view
    sc = bpy.context.scene
    for o in list(sc.objects):
        if o.name.startswith(('_ground', 'cam', 'sun', 'fill')): bpy.data.objects.remove(o, do_unlink=True)
    bpy.context.view_layer.update()
    pts = []
    mn = Vector((1e9,) * 3); mx = Vector((-1e9,) * 3)
    for o in sc.objects:
        if o.type == 'MESH' and not o.hide_render:
            for c in o.bound_box:
                w = o.matrix_world @ Vector(c); pts.append(w); mn = Vector(map(min, mn, w)); mx = Vector(map(max, mx, w))
    if target is not None:
        tc, ts = Vector(target[:3]), (target[3] if len(target) > 3 else 3.0)
        pts = [p for p in pts if (p - tc).length < ts * 1.5] or [tc + Vector((a, b, c)) * ts for a in (-1, 1) for b in (-1, 1) for c in (-1, 1)]
        pts += [tc + Vector((a, b, c)) * ts * 0.5 for a in (-1, 1) for b in (-1, 1) for c in (-1, 1)]
    ctr = sum(pts, Vector()) / len(pts)
    size = max(mx - mn)
    g = box('_ground', (size * 30 + 20, size * 30 + 20, 0.02), ((mn.x + mx.x) / 2, (mn.y + mx.y) / 2, mn.z - 0.011), mat('_ground', ground, 0.95))
    cam_d = bpy.data.cameras.new('cam'); cam_d.lens = lens
    cam = _link(bpy.data.objects.new('cam', cam_d)); sc.camera = cam
    sc.render.resolution_x = res; sc.render.resolution_y = res
    v = Vector(view).normalized()
    rad = max((p - ctr).length for p in pts)
    fov = 2 * math.atan(18 / lens)
    d = rad / math.sin(fov / 2) * dist_mul
    rot = (-v).to_track_quat('-Z', 'Y')
    cam.rotation_euler = rot.to_euler()
    right = rot @ Vector((1, 0, 0)); up = rot @ Vector((0, 1, 0))
    for it in range(8):
        cam.location = ctr + v * d
        cam_d.clip_end = d * 20 + 200; cam_d.clip_start = max(0.01, d / 2000)
        bpy.context.view_layer.update()
        pr = [world_to_camera_view(sc, cam, p) for p in pts]
        x0 = min(p.x for p in pr); x1 = max(p.x for p in pr); y0 = min(p.y for p in pr); y1 = max(p.y for p in pr)
        span = max(x1 - x0, y1 - y0)
        # shift centre in the image plane (approx, at distance d)
        wplane = 2 * d * math.tan(fov / 2)
        ctr = ctr + right * ((x0 + x1) / 2 - 0.5) * wplane + up * ((y0 + y1) / 2 - 0.5) * wplane
        d *= max(0.3, min(2.5, 1 + (span / fill - 1) * 0.9))
    cam.location = ctr + v * d
    sun_d = bpy.data.lights.new('sun', 'SUN'); sun_d.energy = 3.0; sun_d.angle = R(18)
    sun = _link(bpy.data.objects.new('sun', sun_d)); sun.rotation_euler = (R(38), R(8), R(28))
    fill_d = bpy.data.lights.new('fill', 'SUN'); fill_d.energy = 0.8; fill_d.angle = R(40)
    fl = _link(bpy.data.objects.new('fill', fill_d)); fl.rotation_euler = (R(60), 0, R(-140))
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
    nt = w.node_tree; bg = nt.nodes['Background']; bg.inputs[1].default_value = 0.85
    # camera rays see a soft vertical gradient backdrop (seamless: the ground is a shadow catcher); light rays see a flat warm white
    tc = nt.nodes.new('ShaderNodeTexCoord'); sep = nt.nodes.new('ShaderNodeSeparateXYZ'); ramp = nt.nodes.new('ShaderNodeValToRGB')
    nt.links.new(tc.outputs['Window'], sep.inputs[0]); nt.links.new(sep.outputs['Y'], ramp.inputs[0])
    ramp.color_ramp.elements[0].position = 0.0; ramp.color_ramp.elements[0].color = (*lin('#E4DDD2'), 1)
    ramp.color_ramp.elements[1].position = 1.0; ramp.color_ramp.elements[1].color = (*lin('#FAF8F4'), 1)
    lp = nt.nodes.new('ShaderNodeLightPath'); mix = nt.nodes.new('ShaderNodeMixRGB')
    mix.inputs[1].default_value = (*lin('#F3EEE6'), 1)
    nt.links.new(lp.outputs['Is Camera Ray'], mix.inputs[0]); nt.links.new(ramp.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], bg.inputs[0])
    if backdrop == 'gradient':
        g.is_shadow_catcher = True
    else:
        bg.inputs[0].default_value = (*lin('#F3EEE6'), 1); nt.links.remove(bg.inputs[0].links[0])
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = samples
    sc.cycles.use_denoising = True; sc.cycles.max_bounces = 6
    sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
    sc.render.film_transparent = False
    sc.render.image_settings.file_format = 'PNG'
    sc.render.filepath = os.path.join(outdir or RENDERS, name + '.png')
    bpy.ops.render.render(write_still=True)
    print('RENDERED', sc.render.filepath)

# ---------------------------------------------------------------- reusable parts
def tire_profile(ro, ri, w, round_=0.35, n=6):
    """cross-section of a tyre (radius, axial) from inner bead around outer tread back to inner bead"""
    hw = w / 2; rr = min(w, ro - ri) * round_
    pts = [(ri, -hw * 0.9)]
    # outer side wall to tread with rounded corners
    for i in range(n + 1):
        a = math.pi / 2 * i / n
        pts.append((ro - rr + rr * math.sin(a), -hw + rr - rr * math.cos(a)))
    for i in range(n + 1):
        a = math.pi / 2 * i / n
        pts.append((ro - rr + rr * math.cos(a), hw - rr + rr * math.sin(a)))
    pts.append((ri, hw * 0.9))
    return pts

def wheel(name, ro, w, rim_col, tire_m, rim_m, hub_m, seg=28, center=(0, 0, 0), rim_ratio=0.62,
          lugs=8, side=1, tread=0, dual=False, inset=0.02, lug_m=None, tn=6, back=True, hub_seg=20, lug_seg=6):
    """Wheel spinning about X. side=+1 => outer face at +X. returns joined object with origin at center."""
    c = Vector(center); parts = []
    widths = [(0.0,)] if not dual else [(-w * 0.55,), (w * 0.55,)]
    for k, (off,) in enumerate(widths):
        cc = c + Vector((off, 0, 0))
        ri = ro * rim_ratio
        t = lathe(name + '_t', [(r, z) for r, z in tire_profile(ro, ri * 0.98, w, n=tn)], cc, tire_m, 'X', seg, closed=True)
        parts.append(t)
        if tread:
            for i in range(tread):
                a = 2 * math.pi * i / tread
                for sgn in (-1, 1):
                    tb = box(name + '_tr', (w * 0.36, ro * 0.16, ro * 0.07), (0, 0, 0), tire_m)
                    tb.location = cc + Vector((sgn * w * 0.22, math.sin(a + sgn * 0.12) * (ro - ro * 0.012), math.cos(a + sgn * 0.12) * (ro - ro * 0.012)))
                    tb.rotation_euler = (-(a + sgn * 0.12), 0, 0)
                    parts.append(tb)
        if dual and k == 0 and side == 1 or dual and k == 1 and side == -1:
            continue  # inner tyre of a dual pair: no visible rim face on the outside
        # rim: dish
        sx = side
        rim = lathe(name + '_r', [(ri * 0.99, -w * 0.42), (ri * 0.99, w * 0.42), (ri * 0.9, w * 0.42), (ri * 0.86, w * 0.42 - inset),
                                  (ri * 0.45, w * 0.42 - inset * 1.4), (ri * 0.42, w * 0.42 - inset * 0.6), (ri * 0.0, w * 0.42 - inset * 0.6)],
                    (0, 0, 0), rim_m, 'X', seg)
        if sx < 0: rim.scale.x = -1
        rim.location = cc
        parts.append(rim)
        if back:
            rim2 = lathe(name + '_r2', [(ri * 0.99, -w * 0.42), (0, -w * 0.42)], (0, 0, 0), rim_m, 'X', seg); rim2.location = cc
            if sx < 0: rim2.scale.x = -1
            parts.append(rim2)
        # hub cap + lugs
        hz = w * 0.42 - inset * 0.6
        hub = lathe(name + '_h', [(0, 0), (ri * 0.26, 0), (ri * 0.24, ri * 0.1), (ri * 0.15, ri * 0.17), (0, ri * 0.19)], (0, 0, 0), hub_m, 'X', hub_seg)
        hub.location = cc + Vector((sx * hz, 0, 0)); hub.scale.x = sx
        parts.append(hub)
        for i in range(lugs):
            a = 2 * math.pi * i / lugs
            lg = cyl(name + '_l', ri * 0.045, ri * 0.08, cc + Vector((sx * (hz + ri * 0.03), math.sin(a) * ri * 0.37, math.cos(a) * ri * 0.37)), lug_m or hub_m, 'X', seg=lug_seg)
            parts.append(lg)
    return join(parts, name, pivot=c)

def carton(name, size, loc, m_box, m_tape, rot=0, bev=0.012):
    sx, sy, sz = size
    b = box(name, size, loc, m_box, bev=bev, seg=2); b.rotation_euler.z = R(rot)
    t = box(name + 't', (sx + 0.004, sy * 0.16, 0.006), Vector(loc) + Vector((0, 0, sz / 2)), m_tape)
    t.rotation_euler.z = R(rot)
    t.location = Vector(loc) + Vector((0, 0, sz / 2 + 0.001))
    t2 = box(name + 't2', (0.004 + 0.002, sy * 0.16, sz * 0.35), (0, 0, 0), m_tape)
    # tape runs down front and back faces
    out = [b, t]
    for s in (-1, 1):
        tt = box(name + 'td', (0.006, sy * 0.16, sz * 0.32), (0, 0, 0), m_tape)
        off = Matrix.Rotation(R(rot), 3, 'Z') @ Vector((s * (sx / 2 + 0.001), 0, sz / 2 - sz * 0.16))
        tt.location = Vector(loc) + off; tt.rotation_euler.z = R(rot)
        out.append(tt)
    bpy.data.objects.remove(t2, do_unlink=True)
    return out

def arch(name, ri, ro, w, center, m, a0=0.0, a1=180.0, seg=16, bev=0.02):
    """solid arc band (fender / wheel arch) around the X axis; angles in degrees measured in the YZ plane from -Y (front) over the top (+Z)."""
    bm = bmesh.new(); rings = []
    for i in range(seg + 1):
        a = R(a0 + (a1 - a0) * i / seg)
        dy, dz = -math.cos(a), math.sin(a)
        rings.append([bm.verts.new((x, r * dy, r * dz)) for (x, r) in ((-w / 2, ri), (w / 2, ri), (w / 2, ro), (-w / 2, ro))])
    for i in range(seg):
        A, B = rings[i], rings[i + 1]
        for k in range(4):
            bm.faces.new((A[k], A[(k + 1) % 4], B[(k + 1) % 4], B[k]))
    bm.faces.new(rings[0][::-1]); bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = mk(name, bm, m, center)
    return bevel(o, bev, 2, angle=50)


QA_DIR = os.path.join(RENDERS, 'qa')
def closeups(name, shots=(), rear=True, res=700):
    """QA renders (not deliverables): rear 3/4 of the whole asset + zoomed detail shots [(tag, (x,y,z,radius), view)]."""
    os.makedirs(QA_DIR, exist_ok=True)
    if rear: render(name + '__rear', res=res, view=(-0.9, 1.1, 0.6), samples=24, outdir=QA_DIR)
    for tag, tgt, view in shots:
        render(name + '__' + tag, res=res, view=view, target=tgt, samples=24, outdir=QA_DIR)

# ---------------------------------------------------------------- draw-call pass (material merge + atlases)
import re as _re
UNLIT_RE = _re.compile(r'^(brand_|trailer_side|trailer_rear|mark53)|led|light_|beacon', _re.I)
MERGE_ASSETS = {'walmart_truck', 'tug_cart_train', 'forklift_counterbalance', 'reach_truck', 'pallet_stacker_auto', 'amr'}
GEN = os.path.join(TEX, 'gen')

def _srgb(c):
    return tuple(12.92 * x if x <= 0.0031308 else 1.055 * x ** (1 / 2.4) - 0.055 for x in c[:3])

def _minfo(m):
    b = m.node_tree.nodes.get('Principled BSDF') if m.use_nodes else None
    if b is None: return None
    img = None
    for l in m.node_tree.links:
        if l.to_node == b and l.to_socket.name == 'Base Color' and l.from_node.type == 'TEX_IMAGE': img = l.from_node.image
    em = tuple(b.inputs['Emission Color'].default_value)[:3]; es = b.inputs['Emission Strength'].default_value
    return dict(base=tuple(b.inputs['Base Color'].default_value)[:3], rough=b.inputs['Roughness'].default_value,
                metal=b.inputs['Metallic'].default_value, alpha=b.inputs['Alpha'].default_value, img=img,
                emit=em if es > 0 and max(em) > 0 else None, estr=es, blend=getattr(m, 'surface_render_method', 'DITHERED') == 'BLENDED' or m.blend_method == 'BLEND')

def _img_np(img):
    import numpy as np
    a = np.empty(img.size[0] * img.size[1] * 4, dtype=np.float32); img.pixels.foreach_get(a)
    return a.reshape(img.size[1], img.size[0], 4)

def _save_img(nm, arr, noncolor=False):
    import numpy as np
    os.makedirs(GEN, exist_ok=True)
    h, w = arr.shape[:2]
    if nm in bpy.data.images: bpy.data.images.remove(bpy.data.images[nm])
    im = bpy.data.images.new(nm, w, h, alpha=False)
    if noncolor: im.colorspace_settings.name = 'Non-Color'
    im.pixels.foreach_set(np.ascontiguousarray(arr, dtype=np.float32).ravel())
    p = os.path.join(GEN, nm + '.png'); im.filepath_raw = p; im.file_format = 'PNG'; im.save()
    im.source = 'FILE'; im.filepath = p; im.reload()
    if noncolor: im.colorspace_settings.name = 'Non-Color'
    return im

def merge_materials(asset):
    """Collapse every opaque, untextured, non-emissive material into ONE 'clay_palette' material
    (base colour + roughness/metal palette textures, NEAREST sampled, UVs collapsed to the palette texel), and every
    brand/livery/lamp material (UNLIT_RE, emissive, or brand textures) into ONE 'brand_atlas' material (atlas of the
    decal textures + solid brand/lamp swatches, emissive mask atlas) -> 1-2 primitives per node."""
    import numpy as np
    objs = [o for o in bpy.context.scene.objects if o.type == 'MESH' and not o.name.startswith('_')
            and not any(md.type == 'ARMATURE' for md in o.modifiers)]
    used = []
    for o in objs:
        for m in o.data.materials:
            if m and m not in used: used.append(m)
    info = {m.name: _minfo(m) for m in used}
    cls = {}
    for m in used:
        i = info[m.name]
        if i is None or i['blend'] or i['alpha'] < 0.999: cls[m.name] = 'keep'
        elif i['img'] is not None: cls[m.name] = 'atlas_tex' if UNLIT_RE.search(m.name) else 'keep'
        elif UNLIT_RE.search(m.name) or i['emit']: cls[m.name] = 'atlas_solid'
        else: cls[m.name] = 'pal'
    # ---- palette (lit)
    pal = [m.name for m in used if cls[m.name] == 'pal']
    B = 16; PC = 8
    PW = B * PC; PH = B * max(1, -(-len(pal) // PC))
    pbase = np.ones((PH, PW, 4), np.float32); pmr = np.ones((PH, PW, 4), np.float32); puv = {}
    for k, nm in enumerate(pal):
        cx, cy = k % PC, k // PC; i = info[nm]
        pbase[cy * B:(cy + 1) * B, cx * B:(cx + 1) * B, :3] = _srgb(i['base'])
        pmr[cy * B:(cy + 1) * B, cx * B:(cx + 1) * B, :3] = (0.0, i['rough'], i['metal'])
        puv[nm] = ((cx + 0.5) * B / PW, (cy + 0.5) * B / PH)
    # ---- brand atlas (decal textures shelf-packed with edge gutters + 64 px solid swatches)
    tex = [m.name for m in used if cls[m.name] == 'atlas_tex']; sol = [m.name for m in used if cls[m.name] == 'atlas_solid']
    PAD = 8; SW = 64
    imgs = {nm: _img_np(info[nm]['img']) for nm in tex}
    AW = max([a.shape[1] + 2 * PAD for a in imgs.values()] + [SW * 8])
    AW = -(-AW // 16) * 16
    rects = {}; x = y = rowh = 0
    for nm in sorted(tex, key=lambda n: -imgs[n].shape[0]):
        h, w = imgs[nm].shape[:2]
        if x + w + 2 * PAD > AW: x = 0; y += rowh; rowh = 0
        rects[nm] = (x + PAD, y + PAD, w, h); x += w + 2 * PAD; rowh = max(rowh, h + 2 * PAD)
    y += rowh; sy0 = y; scol = AW // SW
    AH = sy0 + SW * max(1, -(-len(sol) // scol)) if sol else max(sy0, 16)
    AH = -(-AH // 16) * 16
    abase = np.ones((AH, AW, 4), np.float32); aem = np.zeros((AH, AW, 4), np.float32); aem[..., 3] = 1
    for nm, (rx, ry, w, h) in rects.items():
        abase[ry - PAD:ry + h + PAD, rx - PAD:rx + w + PAD] = np.pad(imgs[nm], ((PAD, PAD), (PAD, PAD), (0, 0)), mode='edge')
    emax = max([info[n]['estr'] for n in sol if info[n]['emit']] + [1.0])
    for k, nm in enumerate(sol):
        cx, cy = k % scol, k // scol; i = info[nm]
        sl = (slice(sy0 + cy * SW, sy0 + (cy + 1) * SW), slice(cx * SW, (cx + 1) * SW))
        abase[sl][..., :3] = _srgb(i['base'])
        if i['emit']: aem[sl][..., :3] = _srgb(tuple(min(1.0, c * i['estr'] / emax) for c in i['emit']))
        rects[nm] = ((cx + 0.5) * SW, sy0 + (cy + 0.5) * SW, 0, 0)
    has_atlas = bool(tex or sol); has_em = has_atlas and any(info[n]['emit'] for n in sol)
    # ---- materials
    newm = {}
    if pal:
        ib = _save_img(asset + '_palette', pbase); imr = _save_img(asset + '_palette_mr', pmr, noncolor=True)
        m = bpy.data.materials.new('clay_palette'); m.use_nodes = True; nt = m.node_tree; b = nt.nodes['Principled BSDF']
        t1 = nt.nodes.new('ShaderNodeTexImage'); t1.image = ib; t1.interpolation = 'Closest'
        t2 = nt.nodes.new('ShaderNodeTexImage'); t2.image = imr; t2.interpolation = 'Closest'
        sp = nt.nodes.new('ShaderNodeSeparateColor')
        nt.links.new(t1.outputs['Color'], b.inputs['Base Color']); nt.links.new(t2.outputs['Color'], sp.inputs['Color'])
        nt.links.new(sp.outputs['Green'], b.inputs['Roughness']); nt.links.new(sp.outputs['Blue'], b.inputs['Metallic'])
        newm['pal'] = m
    if has_atlas:
        ia = _save_img(asset + '_brand_atlas', abase)
        m = bpy.data.materials.new('brand_atlas'); m.use_nodes = True; nt = m.node_tree; b = nt.nodes['Principled BSDF']
        t1 = nt.nodes.new('ShaderNodeTexImage'); t1.image = ia; t1.interpolation = 'Linear'
        nt.links.new(t1.outputs['Color'], b.inputs['Base Color']); b.inputs['Roughness'].default_value = 0.6
        if has_em:
            ie = _save_img(asset + '_brand_emissive', aem)
            t2 = nt.nodes.new('ShaderNodeTexImage'); t2.image = ie; t2.interpolation = 'Linear'
            nt.links.new(t2.outputs['Color'], b.inputs['Emission Color']); b.inputs['Emission Strength'].default_value = emax
        newm['atlas_tex'] = newm['atlas_solid'] = m
    # ---- remap meshes
    done = set(); uvwarn = []
    for o in objs:
        me = o.data
        if me.name in done or not me.materials: continue
        done.add(me.name)
        if not me.uv_layers: me.uv_layers.new(name='UVMap')
        uvl = me.uv_layers.active
        np_ = len(me.polygons); nl = len(me.loops)
        mi = np.zeros(np_, np.int32); me.polygons.foreach_get('material_index', mi)
        ls = np.zeros(np_, np.int32); me.polygons.foreach_get('loop_start', ls)
        lt = np.zeros(np_, np.int32); me.polygons.foreach_get('loop_total', lt)
        lpoly = np.repeat(np.arange(np_), lt)
        uv = np.zeros(nl * 2, np.float32); uvl.data.foreach_get('uv', uv); uv = uv.reshape(nl, 2)
        old = list(me.materials); slots = []; remap = []
        for m in old:
            c = cls.get(m.name, 'keep') if m else 'keep'
            tgt = newm.get(c, m)
            if tgt not in slots: slots.append(tgt)
            remap.append(slots.index(tgt))
        lmi = mi[lpoly]
        for si, m in enumerate(old):
            if m is None: continue
            c = cls.get(m.name, 'keep'); sel = lmi == si
            if not sel.any() or c == 'keep': continue
            if c == 'pal': uv[sel] = puv[m.name]
            elif c == 'atlas_solid': rx, ry, _, _ = rects[m.name]; uv[sel] = (rx / AW, ry / AH)
            else:
                rx, ry, w, h = rects[m.name]; u = uv[sel]
                if u.min() < -0.002 or u.max() > 1.002: uvwarn.append((o.name, m.name, float(u.min()), float(u.max())))
                u = np.clip(u, 0, 1)
                uv[sel] = np.stack([(rx + u[:, 0] * w) / AW, (ry + u[:, 1] * h) / AH], 1)
        uvl.data.foreach_set('uv', uv.ravel())
        me.materials.clear()
        for m in slots: me.materials.append(m)
        me.polygons.foreach_set('material_index', np.array(remap, np.int32)[mi])
        me.update()
    rep = dict(palette=pal, atlas_textures=tex, atlas_solid=sol, kept=[n for n in cls if cls[n] == 'keep'],
               palette_px=[PW, PH], atlas_px=[AW, AH] if has_atlas else None, emissive_strength=emax if has_em else None, uv_warnings=uvwarn)
    print('MERGE', asset, json.dumps({k: (len(v) if isinstance(v, list) and k != 'uv_warnings' else v) for k, v in rep.items()}))
    return rep
