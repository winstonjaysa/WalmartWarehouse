# 6-axis-style palletising robot arm: pedestal + turret yaw + shoulder/elbow/wrist pitch + gripper roll + parallel fingers
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
reset()
YEL = mat('arm_yellow', '#F4B41A', 0.7); CH = mat('arm_charcoal', '#33363B', 0.8); GRY = mat('arm_grey', '#9AA0A6', 0.72)
PAD = mat('arm_pad', '#1E1F22', 0.88); BLU = mat('brand_blue', '#0071CE', 0.75)
SH, EL, WY, GZ = 0.66, 1.41, -0.75, 1.25    # shoulder z, elbow z, wrist y, gripper flange z
# static pedestal
p = [cyl('plate', 0.3, 0.06, (0, 0, 0.03), GRY, seg=40, bev=0.012),
     cyl('col', 0.2, 0.32, (0, 0, 0.22), GRY, seg=40, bev=0.015),
     cyl('band', 0.203, 0.05, (0, 0, 0.3), BLU, seg=40)]
for a in range(6):
    p.append(cyl('bolt', 0.022, 0.02, (0.255 * math.cos(R(60 * a + 30)), 0.255 * math.sin(R(60 * a + 30)), 0.07), CH, seg=10, bev=0.004))
ped = join(p, 'arm_pedestal', pivot=(0, 0, 0))
# J0 turret (yaw about Z / glTF Y)
b = [cyl('turret', 0.24, 0.1, (0, 0, 0.43), CH, seg=40, bev=0.012),
     cyl('housing', 0.22, 0.06, (0, 0, 0.51), YEL, seg=40, bev=0.015)]
for s in (-1, 1):
    x0, x1 = sorted((s * 0.125, s * 0.2))
    b.append(box2('cheek', (x0, -0.14, 0.5), (x1, 0.14, 0.78), YEL, bev=0.03, seg=3))
    b.append(cyl('motor', 0.08, 0.05, (s * 0.225, 0, SH), CH, axis='X', seg=28, bev=0.01))
base = join(b, 'arm_base', pivot=(0, 0, 0.38))
# J1 shoulder (pitch about X): lower arm, vertical 0.75 m
j1 = join([cyl('hub', 0.11, 0.23, (0, 0, SH), CH, axis='X', seg=32, bev=0.01),
           box2('link', (-0.09, -0.08, SH), (0.09, 0.08, EL), YEL, bev=0.04, seg=3),
           cyl('ehub', 0.1, 0.2, (0, 0, EL), CH, axis='X', seg=32, bev=0.01)], 'arm_j1', pivot=(0, 0, SH))
# J2 elbow (pitch about X): forearm reaching forward (-Y in Blender = +Z glTF)
f = []
for s in (-1, 1):
    x0, x1 = sorted((s * 0.11, s * 0.165))
    f.append(box2('fcheek', (x0, -0.13, EL - 0.13), (x1, 0.13, EL + 0.13), YEL, bev=0.03, seg=3))
    f.append(cyl('fmotor', 0.07, 0.05, (s * 0.19, 0, EL), CH, axis='X', seg=28, bev=0.01))
    x0, x1 = sorted((s * 0.085, s * 0.125))
    f.append(box2('wcheek', (x0, WY - 0.085, EL - 0.075), (x1, -0.66, EL + 0.075), YEL, bev=0.015, seg=3))
f.append(box2('cross', (-0.16, -0.21, EL - 0.1), (0.16, -0.12, EL + 0.1), YEL, bev=0.03, seg=3))
f.append(box2('beam', (-0.1, -0.17, EL - 0.08), (0.1, -0.7, EL + 0.08), YEL, bev=0.035, seg=3))
f.append(box2('stripe', (-0.06, -0.3, EL + 0.08), (0.06, -0.55, EL + 0.083), BLU, bev=0.001, seg=1))
j2 = join(f, 'arm_j2', pivot=(0, 0, EL))
# J3 wrist (pitch about X)
j3 = join([cyl('whub', 0.07, 0.16, (0, WY, EL), CH, axis='X', seg=28, bev=0.008),
           cyl('wbody', 0.06, EL - GZ, (0, WY, (EL + GZ) / 2), GRY, seg=28, bev=0.008)], 'arm_j3', pivot=(0, WY, EL))
# J4 gripper (roll about Z / glTF Y)
g = join([cyl('flange', 0.075, 0.03, (0, WY, GZ - 0.015), CH, seg=32, bev=0.006),
          box2('palm', (-0.11, WY - 0.045, GZ - 0.1), (0.11, WY + 0.045, GZ - 0.03), GRY, bev=0.012, seg=3),
          box2('rail', (-0.1, WY - 0.02, GZ - 0.112), (0.1, WY + 0.02, GZ - 0.1), CH, bev=0.003, seg=2)], 'gripper', pivot=(0, WY, GZ))
fingers = []
for nm, s in (('finger_L', 1), ('finger_R', -1)):
    x0, x1 = sorted((s * 0.05, s * 0.08))
    fg = join([box2('f', (x0, WY - 0.03, GZ - 0.25), (x1, WY + 0.03, GZ - 0.112), CH, bev=0.006, seg=2),
               box2('pad', *(((x0 - 0.008, WY - 0.025, GZ - 0.245), (x0, WY + 0.025, GZ - 0.18)) if s > 0 else ((x1, WY - 0.025, GZ - 0.245), (x1 + 0.008, WY + 0.025, GZ - 0.18))), PAD, bev=0.002, seg=2)],
              nm, pivot=(s * 0.065, WY, GZ - 0.112))
    fingers.append(fg)
root = empty('robot_arm')
parent(ped, root); parent(base, root); parent(j1, base); parent(j2, j1); parent(j3, j2); parent(g, j3)
for fg in fingers: parent(fg, g)
export('robot_arm', dict(
    facing='+Z (forearm reaches toward +Z at rest)', refs=['14_iso_cutaway_orange_base.jpg'],
    dims={'height_m': round(EL + 0.13, 3), 'reach_m': abs(WY), 'shoulder_y_m': SH, 'elbow_y_m': EL},
    hierarchy='robot_arm > {arm_pedestal, arm_base > arm_j1 > arm_j2 > arm_j3 > gripper > {finger_L, finger_R}}',
    rig={'arm_base': 'yaw about local Y; origin on the vertical axis at y=0.38 (top of pedestal)',
         'arm_j1': 'shoulder pitch about local X; origin on the shoulder axis (0, 0.66, 0)',
         'arm_j2': 'elbow pitch about local X; origin on the elbow axis (0, 1.41, 0)',
         'arm_j3': 'wrist pitch about local X; origin on the wrist axis (0, 1.41, 0.75)',
         'gripper': 'roll about local Y; origin at the tool flange (0, 1.25, 0.75)',
         'finger_L/R': 'translate along local X: open +-0.03 m (L +X, R -X); origin at the finger root'},
    nodes={'arm_pedestal': 'static'}))
render('robot_arm', view=(1.0, -1.15, 0.6))
closeups('robot_arm', [('gripper', (0, WY, GZ - 0.1, 0.25), (0.9, -1.0, 0.3)), ('elbow', (0, 0, EL, 0.3), (1.0, -0.6, 0.5))])
