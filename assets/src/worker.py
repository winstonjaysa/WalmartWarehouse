# DC associate: rigid-skinned toy character (hard hat, hi-vis vest), armature + Walk (1 s) / Idle (2 s) NLA clips
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
import lib
from mathutils import Quaternion
reset(); bpy.context.scene.render.fps = 30; bpy.context.scene.frame_start = 1; bpy.context.scene.frame_end = 61
SKIN = mat('wk_skin', '#E3AE86', 0.8); SHIRT = mat('wk_shirt', '#2F6DB5', 0.85); VEST = mat('wk_vest', '#F2D40C', 0.8)
REFL = mat('wk_reflective', '#D7DADF', 0.5); PANTS = mat('wk_pants', '#2E3440', 0.88); BOOT = mat('wk_boot', '#5B3C24', 0.82)
HAT = mat('wk_hat', '#F3F3F0', 0.7); EYE = mat('wk_eye', '#1E1F22', 0.6); SOLE = mat('wk_sole', '#26272A', 0.9)
BADGE = mat('brand_blue', '#0071CE', 0.75)

def limb(nm, p0, p1, r, m, r2=None, seg=20):
    p0, p1 = Vector(p0), Vector(p1); d = p1 - p0
    o = cyl(nm, r, d.length, (0, 0, 0), m, seg=seg, bev=min(r, r2 or r) * 0.45, bseg=3, r2=r2)
    o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(d.normalized())
    o.location = (p0 + p1) / 2
    return o

# joint positions (Blender: Z up, front -Y, character's left = +X)
J = dict(hip=0.93, knee=0.5, ankle=0.095, sh=1.36, el=1.09, wr=0.84)
parts = []   # (bone, obj)
def add(bone, o): parts.append((bone, o)); return o
for s, side in ((1, 'L'), (-1, 'R')):
    x = s * 0.1
    add('thigh_' + side, limb('thigh', (x, 0, J['hip'] + 0.02), (x, 0, J['knee']), 0.078, PANTS, r2=0.066))
    add('shin_' + side, sphere('knee', 0.066, (x, 0, J['knee']), PANTS, seg=20, rings=10))
    add('shin_' + side, limb('shin', (x, 0, J['knee']), (x, 0, J['ankle'] + 0.03), 0.062, PANTS, r2=0.055))
    add('foot_' + side, box2('boot', (x - 0.056, -0.175, 0.022), (x + 0.056, 0.065, 0.13), BOOT, bev=0.04, seg=3))
    add('foot_' + side, box2('sole', (x - 0.058, -0.178, 0.0), (x + 0.058, 0.068, 0.03), SOLE, bev=0.01, seg=2))
    xs, xe, xw = s * 0.2, s * 0.222, s * 0.235
    add('upper_arm_' + side, sphere('shoulder', 0.06, (xs, 0, J['sh']), SHIRT, seg=20, rings=10))
    add('upper_arm_' + side, limb('uarm', (xs, 0, J['sh']), (xe, 0, J['el']), 0.054, SHIRT, r2=0.047))
    add('forearm_' + side, sphere('elbow', 0.043, (xe, 0, J['el']), SKIN, seg=16, rings=8))
    add('forearm_' + side, limb('farm', (xe, 0, J['el']), (xw, 0, J['wr']), 0.042, SKIN, r2=0.035))
    add('hand_' + side, sphere('hand', 0.056, (xw, -0.005, J['wr'] - 0.06), SKIN, seg=18, rings=10, scale=(0.62, 0.9, 1.25)))
    add('head', sphere('eye', 0.012, (s * 0.036, -0.098, 1.585), EYE, seg=10, rings=6))
add('hips', sphere('pelvis', 0.1, (0, 0, J['hip'] + 0.02), PANTS, seg=24, rings=12, scale=(1.75, 1.15, 1.0)))
add('hips', limb('belt', (0, 0, J['hip'] + 0.05), (0, 0, J['hip'] + 0.09), 0.158, PANTS, seg=28))
t = add('spine', cyl('torso', 0.15, 0.44, (0, 0, 1.17), SHIRT, seg=28, bev=0.06, bseg=3, r2=0.2)); t.scale = (1, 0.66, 1)
v = add('chest', cyl('vest', 0.16, 0.33, (0, 0, 1.175), VEST, seg=28, bev=0.03, bseg=3, r2=0.205)); v.scale = (1, 0.69, 1)
for z in (1.08, 1.22):
    rr = 0.16 + (0.205 - 0.16) * (z - 1.01) / 0.33 + 0.004
    b = add('chest', cyl('band', rr, 0.032, (0, 0, z), REFL, seg=28, r2=rr + 0.0044)); b.scale = (1, 0.69, 1)
add('chest', box2('badge', (0.05, -0.15, 1.24), (0.11, -0.13, 1.28), BADGE, bev=0.004))
add('neck', limb('neck', (0, 0, 1.33), (0, 0, 1.49), 0.056, SKIN))
add('head', sphere('headball', 0.106, (0, 0, 1.575), SKIN, seg=28, rings=14, scale=(0.92, 1.0, 1.08)))
add('head', sphere('nose', 0.02, (0, -0.104, 1.555), SKIN, seg=10, rings=6))
hat = lathe('hat', [(0, 0.13), (0.05, 0.127), (0.09, 0.11), (0.113, 0.07), (0.12, 0.02), (0.15, 0.01), (0.152, -0.006), (0.11, -0.008), (0, -0.008)], (0, 0, 1.615), HAT, seg=32)
hat.scale = (0.95, 1.08, 1); add('head', hat)
add('head', box2('hatrib', (-0.015, -0.12, 1.66), (0.015, 0.12, 1.745), HAT, bev=0.012, seg=3) if False else None)
base = lib._PART_ID
order = [b for b, o in parts if o is not None]
body = join([o for b, o in parts if o is not None], 'worker_body', pivot=(0, 0, 0), ang=40)
# --- armature
arm = bpy.data.armatures.new('worker_rig'); rig = lib._link(bpy.data.objects.new('worker_rig', arm))
bpy.context.view_layer.objects.active = rig; bpy.ops.object.mode_set(mode='EDIT')
B = {}
def bone(nm, h, t, par=None):
    eb = arm.edit_bones.new(nm); eb.head = h; eb.tail = t; eb.roll = 0
    if par: eb.parent = B[par]; eb.use_connect = False
    B[nm] = eb
bone('hips', (0, 0, J['hip']), (0, 0, 1.02)); bone('spine', (0, 0, 1.02), (0, 0, 1.2), 'hips'); bone('chest', (0, 0, 1.2), (0, 0, 1.36), 'spine')
bone('neck', (0, 0, 1.36), (0, 0, 1.48), 'chest'); bone('head', (0, 0, 1.48), (0, 0, 1.7), 'neck')
for s, side in ((1, 'L'), (-1, 'R')):
    x = s * 0.1
    bone('thigh_' + side, (x, 0, J['hip']), (x, 0, J['knee']), 'hips'); bone('shin_' + side, (x, 0, J['knee']), (x, 0, J['ankle']), 'thigh_' + side)
    bone('foot_' + side, (x, 0, J['ankle']), (x, -0.14, 0.03), 'shin_' + side)
    bone('upper_arm_' + side, (s * 0.2, 0, J['sh']), (s * 0.222, 0, J['el']), 'chest')
    bone('forearm_' + side, (s * 0.222, 0, J['el']), (s * 0.235, 0, J['wr']), 'upper_arm_' + side)
    bone('hand_' + side, (s * 0.235, 0, J['wr']), (s * 0.235, 0, J['wr'] - 0.12), 'forearm_' + side)
bpy.ops.object.mode_set(mode='OBJECT')
# rigid weights by part id
me = body.data; pa = [0] * len(me.polygons); me.attributes['part'].data.foreach_get('value', pa)
groups = {nm: body.vertex_groups.new(name=nm) for nm in arm.bones.keys()}
vb = {}
for p in me.polygons:
    bn = order[pa[p.index] - base - 1]
    for vi in p.vertices: vb.setdefault(vi, bn)
for vi, bn in vb.items(): groups[bn].add([vi], 1.0, 'REPLACE')
body.parent = rig; md = body.modifiers.new('Armature', 'ARMATURE'); md.object = rig
root = empty('worker'); parent(rig, root)
# --- animation helpers (rotations expressed about WORLD axes, converted to each bone's rest frame)
def q(bn, axis, deg):
    ax = arm.bones[bn].matrix_local.to_3x3().inverted() @ Vector(axis)
    return Quaternion(ax.normalized(), R(deg))
def key(action, frames, fn):
    rig.animation_data_create(); rig.animation_data.action = action
    for pb in rig.pose.bones: pb.rotation_mode = 'QUATERNION'
    for f in frames:
        for pb in rig.pose.bones: pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0)
        fn(f)
        for pb in rig.pose.bones:
            pb.keyframe_insert('rotation_quaternion', frame=f); pb.keyframe_insert('location', frame=f)
    tr = rig.animation_data.nla_tracks.new(); tr.name = action.name
    st = tr.strips.new(action.name, int(frames[0]), action); st.name = action.name
    rig.animation_data.action = None
FWD = (1, 0, 0)   # +angle about world +X swings a downward bone backward (+Y); forward swing = negative
P = rig.pose.bones
def walk(f):
    t = (f - 1) / 30.0; w = 2 * math.pi * t
    for side, ph in (('L', 0.0), ('R', math.pi)):
        sw = 22 * math.sin(w + ph)                     # + = forward
        P['thigh_' + side].rotation_quaternion = q('thigh_' + side, FWD, -sw)
        kb = 45 * max(0.0, math.cos(w + ph + 0.35)) ** 1.3   # knee flex in swing
        P['shin_' + side].rotation_quaternion = q('shin_' + side, FWD, kb)
        P['foot_' + side].rotation_quaternion = q('foot_' + side, FWD, -0.35 * kb + 0.25 * max(0.0, -sw))
        P['upper_arm_' + side].rotation_quaternion = q('upper_arm_' + side, FWD, 16 * math.sin(w + ph))   # opposite to same-side leg
        P['forearm_' + side].rotation_quaternion = q('forearm_' + side, FWD, -(18 + 10 * max(0.0, -math.sin(w + ph))))
    P['hips'].location = (0, HOFF.get(f, 0.0), 0)   # bone Y = world up: solved per frame so the planted boot touches y=0
    P['hips'].rotation_quaternion = q('hips', (0, 0, 1), 5 * math.sin(w))
    P['chest'].rotation_quaternion = q('chest', (0, 0, 1), -8 * math.sin(w)) @ q('chest', FWD, -3)
    P['head'].rotation_quaternion = q('head', (0, 0, 1), 3 * math.sin(w))
def idle(f):
    t = (f - 1) / 60.0; w = 2 * math.pi * t
    P['chest'].rotation_quaternion = q('chest', FWD, -1.5 * math.sin(w))
    P['head'].rotation_quaternion = q('head', (0, 0, 1), 6 * math.sin(w)) @ q('head', FWD, -2 * math.sin(2 * w))
    for side, s in (('L', 1), ('R', -1)):
        P['upper_arm_' + side].rotation_quaternion = q('upper_arm_' + side, (0, 1, 0), -s * 4) @ q('upper_arm_' + side, FWD, 2.5 * math.sin(w))
        P['forearm_' + side].rotation_quaternion = q('forearm_' + side, FWD, -12)
HOFF = {}
def lows(action, frames):
    rig.animation_data.action = action
    for tr in rig.animation_data.nla_tracks: tr.mute = True
    out = {}
    for f in frames:
        bpy.context.scene.frame_set(f); dg = bpy.context.evaluated_depsgraph_get()
        m2 = body.evaluated_get(dg).to_mesh(); out[f] = min((rig.matrix_world @ body.matrix_local @ v.co).z for v in m2.vertices); body.evaluated_get(dg).to_mesh_clear()
    rig.animation_data.action = None
    for tr in rig.animation_data.nla_tracks: tr.mute = False
    return out
tmp = bpy.data.actions.new('tmp'); key(tmp, range(1, 32), walk)
lo = lows(tmp, range(1, 32)); HOFF = {f: -v for f, v in lo.items()}; HOFF[31] = HOFF[1]
rig.animation_data.nla_tracks.remove(rig.animation_data.nla_tracks['tmp']); bpy.data.actions.remove(tmp)
wa = bpy.data.actions.new('Walk'); key(wa, range(1, 32), walk)
ia = bpy.data.actions.new('Idle'); key(ia, range(1, 62), idle)
# QA of the animation: sample the lowest skin vertex per frame (feet should touch, not sink)
def lowest(action, frames):
    rig.animation_data.action = action
    for tr in rig.animation_data.nla_tracks: tr.mute = True
    out = []
    for f in frames:
        bpy.context.scene.frame_set(f); dg = bpy.context.evaluated_depsgraph_get()
        m2 = body.evaluated_get(dg).to_mesh(); out.append(min((rig.matrix_world @ body.matrix_local @ v.co).z for v in m2.vertices)); body.evaluated_get(dg).to_mesh_clear()
    rig.animation_data.action = None
    for tr in rig.animation_data.nla_tracks: tr.mute = False
    return round(min(out), 4), round(max(out), 4)
walk_lo = lowest(wa, range(1, 32)); idle_lo = lowest(ia, range(1, 62, 6))
print('ANIMQA walk minY range', walk_lo, 'idle', idle_lo)
# rest pose for QA / render
for tr in rig.animation_data.nla_tracks: tr.mute = True
bpy.context.scene.frame_set(1)
for pb in rig.pose.bones: pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0)
bpy.context.view_layer.update()
for tr in rig.animation_data.nla_tracks: tr.mute = False
export('worker', dict(
    facing='+Z (face/toes toward +Z)', refs=['01_interior_dock_forklifts.jpg', '14_iso_cutaway_orange_base.jpg'],
    dims={'height_m': 1.745}, animations=['Walk', 'Idle'],
    hierarchy='worker > worker_rig (Armature, 21 bones) > worker_body (SkinnedMesh, rigid 1-bone weights)',
    rig={'bones': list(arm.bones.keys()), 'skinning': 'every vertex weighted 1.0 to one bone (rigid toy segments) -> cheap, no candy-wrapping',
         'Walk': '1.0 s loop (31 frames @30fps), in place; drive root at ~1.35 m/s (stride 0.67 m, 2 steps/cycle) to avoid foot slide',
         'Idle': '2.0 s loop (61 frames @30fps): breathing, head look, arm sway',
         'anim_qa': {'walk_lowest_vertex_m': walk_lo, 'idle_lowest_vertex_m': idle_lo}},
    nodes={'worker': 'origin ground centre between feet', 'hips': 'bone at y=0.93'}))
for tr in rig.animation_data.nla_tracks: tr.mute = True
bpy.context.scene.frame_set(1); bpy.context.view_layer.update()
render('worker', view=(1.0, -1.3, 0.45))
closeups('worker', [('head', (0, 0, 1.6, 0.22), (0.8, -1.0, 0.2)), ('boots', (0, -0.05, 0.08, 0.25), (0.9, -1.0, 0.4))])
# walk pose sample (frame 8 = mid swing) for the QA folder
rig.animation_data.action = bpy.data.actions['Walk']; bpy.context.scene.frame_set(8); bpy.context.view_layer.update()
render('worker_walk_f8', view=(1.0, -0.6, 0.3), outdir=os.path.join(RENDERS, 'qa'))
