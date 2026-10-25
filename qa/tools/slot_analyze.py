#!/usr/bin/env python3
"""Slot-exact handling analyzer. usage: slot_analyze.py RUNDIR SPEED [fps=60]
Reads RUNDIR/slots.jsonl (+slots_meta.json, console_all.txt). Writes RUNDIR/slot_events.json, slot_events.md, slot_violations.json.
Rules (checklist §K): (a) |load-bottom-on-forks - surfaceY| <= 0.02 m at attach/detach; raw fork heel Y also logged;
(b) yaw error to nearest face axis < 2 deg, lateral error of fork centreline vs slot centre < 0.05 m;
(c) source pallet seated (|bottom - surface| <= 0.02) and visible in the frame before pickup;
(d) load world position jump between consecutive frames <= 0.05 m * SPEED (60 fps virtual); evaluated in +-10 frames and globally."""
import json, sys, math, re, collections
RUN = sys.argv[1]; SPEED = float(sys.argv[2]) if len(sys.argv) > 2 else 1.0
JT = 0.05 * SPEED
fr = [json.loads(l) for l in open(f'{RUN}/slots.jsonl') if l.strip()]
try: meta = json.load(open(f'{RUN}/slots_meta.json')) or []
except Exception: meta = []
def wrap(a): return (a + math.pi) % (2 * math.pi) - math.pi
def yawerr(y): return abs(math.degrees(wrap(y - round(y / (math.pi / 2)) * (math.pi / 2))))
L = collections.defaultdict(dict)   # uuid -> f -> rec
V = collections.defaultdict(dict)
slotev = []
for r in fr:
    f = r['f']
    for l in r.get('loads') or []: L[l[0]][f] = dict(name=l[1], p=l[2:5], par=l[5], parn=l[6], own=l[7], vis=l[8])
    for v in r.get('veh') or []: V[v[0]][f] = dict(name=v[1], p=v[2:5], yaw=v[5], heel=v[6], tips=v[7], fh=v[8])
    for s in r.get('sl') or []: slotev.append(dict(f=f, i=s[0], id=s[1], occ=s[2], p=s[3:6]))
def nearest_slot(p, maxd=1.0):
    best = None
    for m in meta:
        d = math.hypot(m[1] - p[0], m[3] - p[2]); dy = abs(m[2] - p[1])
        if d < maxd and dy < 0.9 and (best is None or d + dy < best[0]): best = (d + dy, m)
    return best[1] if best else None
def jump(seq, f0, f1):
    mx, at = 0.0, None
    for f in range(f0 + 1, f1 + 1):
        if f in seq and f - 1 in seq:
            a, b = seq[f - 1]['p'], seq[f]['p']; d = math.dist(a, b)
            if d > mx: mx, at = d, f
    return mx, at
events = []
for u, seq in L.items():
    fs = sorted(seq)
    for k in range(1, len(fs)):
        f, fp = fs[k], fs[k - 1]; a, b = seq[fp], seq[f]
        kind = None
        if not a['own'] and b['own']: kind = 'attach'
        elif a['own'] and not b['own']: kind = 'detach'
        elif b['own'] and a['vis'] == 0 and b['vis'] == 1: kind = 'attach(swap-show)'
        elif a['own'] and a['vis'] == 1 and b['vis'] == 0: kind = 'detach(swap-hide)'
        elif not b['own'] and a['vis'] != b['vis']: kind = 'appear' if b['vis'] else 'vanish'
        if not kind: continue
        vu = b['own'] or a['own']
        if not vu:  # nearest vehicle by heel within 2.5 m
            best = None
            for vv, vs in V.items():
                if f in vs and vs[f]['heel']:
                    d = math.dist(vs[f]['heel'], b['p'])
                    if d < 2.5 and (best is None or d < best[0]): best = (d, vv)
            vu = best[1] if best else None
        v = V.get(vu, {}).get(f) if vu else None
        onf = b if b['own'] else a          # pose while on forks
        off = a if b['own'] else b          # pose while on the surface
        sl = nearest_slot(off['p'])
        surfY = sl[2] if sl else off['p'][1]
        stype = 'rack ' + sl[0] if sl else 'surface (lane/floor/trailer/conveyor)'
        heel = v['heel'] if v else None
        err = onf['p'][1] - surfY
        ye = yawerr(v['yaw']) if v else None
        lat = None
        if v and heel:
            ref = (sl[1], sl[3]) if sl else (off['p'][0], off['p'][2])
            dx, dz = ref[0] - heel[0], ref[1] - heel[2]; fx, fz = math.sin(v['yaw']), math.cos(v['yaw'])
            lat = abs(dx * fz - dz * fx)
        seated = None
        if kind.startswith('attach') and fp in seq:
            seated = abs(seq[fp]['p'][1] - surfY) <= 0.02 and seq[fp]['vis'] == 1
        mj, mjf = jump(seq, f - 10, f + 10)
        fails = []
        if heel is None and kind in ('attach', 'detach'): fails.append('no vehicle/forks at event')
        if abs(err) > 0.02: fails.append(f'(a) seat err {err*100:+.1f} cm')
        if ye is not None and ye >= 2: fails.append(f'(b) yaw {ye:.1f} deg')
        if lat is not None and lat >= 0.05: fails.append(f'(b) lateral {lat*100:.1f} cm')
        if seated is False: fails.append('(c) not seated/visible before pickup')
        if mj > JT: fails.append(f'(d) jump {mj*100:.1f} cm @f{mjf}')
        if kind in ('appear', 'vanish'): fails.append('appear/vanish on screen-path (check vis/fog)')
        events.append(dict(f=f, t=round(fr[0]['vt'] and 0 or 0, 2), kind=kind, load=u, veh=(v or {}).get('name'), vuuid=vu, slot=stype,
                           forkY=heel[1] if heel else None, slotY=round(surfY, 3), heelMinusSlot=round(heel[1] - surfY, 3) if heel else None,
                           err=round(err, 3), yaw=None if ye is None else round(ye, 2), lat=None if lat is None else round(lat, 3),
                           maxJump=round(mj, 3), maxJumpF=mjf, result='PASS' if not fails else 'FAIL', fails=fails))
# rack instance toggles with no matching vehicle event within +-10 frames = pop
for s in slotev:
    near = [e for e in events if abs(e['f'] - s['f']) <= 10 and e['slot'].endswith(s['id'])]
    if not near:
        events.append(dict(f=s['f'], kind='rack-instance ' + ('fill' if s['occ'] else 'empty'), load='instanced', veh=None, slot='rack ' + s['id'],
                           forkY=None, slotY=s['p'][1], heelMinusSlot=None, err=None, yaw=None, lat=None, maxJump=None, maxJumpF=None,
                           result='FAIL', fails=['instance toggled with no fork at slot in +-10 f (pop)']))
# global jumps
glob = []
for u, seq in L.items():
    fs = sorted(seq)
    for k in range(1, len(fs)):
        if fs[k] - fs[k - 1] != 1: continue
        d = math.dist(seq[fs[k - 1]]['p'], seq[fs[k]]['p'])
        if d > JT: glob.append(dict(f=fs[k], load=u, jump=round(d, 3), own=seq[fs[k]]['own'], parn=seq[fs[k]]['parn']))
vt = {r['f']: r['vt'] for r in fr}
for e in events: e['t_s'] = round(vt.get(e['f'], 0) / 1000, 2)
events.sort(key=lambda e: e['f'])
con = []
try:
    for line in open(f'{RUN}/console_all.txt'):
        if re.search(r'fork|slot|seat|beam|attach|detach|assert', line, re.I): con.append(line.rstrip())
except FileNotFoundError: pass
json.dump(dict(speed=SPEED, jumpThreshold=JT, events=events, globalJumps=glob[:500], nGlobalJumps=len(glob), consoleHits=con), open(f'{RUN}/slot_events.json', 'w'), indent=1)
with open(f'{RUN}/slot_events.md', 'w') as o:
    o.write(f'speed {SPEED}x, jump threshold {JT*100:.0f} cm/frame. events {len(events)}, FAIL {sum(e["result"]=="FAIL" for e in events)}, global jumps {len(glob)}, console hits {len(con)}\n\n')
    o.write('| f | t (s) | event | vehicle | slot | fork Y | slot Y | err | yaw err | lateral err | max frame jump | result |\n|---|---|---|---|---|---|---|---|---|---|---|---|\n')
    for e in events:
        F = lambda x, s='{:.3f}': '—' if x is None else s.format(x)
        o.write(f"| {e['f']} | {e['t_s']} | {e['kind']} | {e['veh'] or '—'} | {e['slot']} | {F(e['forkY'])} | {F(e['slotY'])} | {F(e['err'])} | {F(e['yaw'],'{:.2f}°')} | {F(e['lat'])} | {F(e['maxJump'])} | {e['result']} {'; '.join(e['fails'])} |\n")
    o.write('\nconsole hits:\n' + '\n'.join('    ' + c for c in con) + '\n')
print(open(f'{RUN}/slot_events.md').read()[:3000])
