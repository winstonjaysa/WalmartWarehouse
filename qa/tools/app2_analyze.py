import json,math,sys
R=json.load(open('../runs/app2/sim_frames.json'))
FLOOR=1.2
ev=[];jumps=[];prev=None
for i,fr in enumerate(R):
  if prev:
    P={p[0]:p for p in prev['pal']}
    for p in fr['pal']:
      q=P.get(p[0]);
      if q:
        d=math.dist(p[1:4],q[1:4])
        if d>0.05: jumps.append((fr['f'],p[0],round(d,3),q[4],p[4]))
        if q[4]!=p[4]: ev.append((fr['f'],p[0],q[4],p[4]))
        if q[5]!=p[5] or abs(q[6]-p[6])>1e-3: ev.append((fr['f'],p[0],'vis/scale',q[5:],p[5:]))
  prev=fr
print('events',ev[:40]);print('jumps>5cm',len(jumps),jumps[:30])
# per event detail
for e in ev:
  f=e[0];fr=R[f];fk=fr['fk'][0];pal=[p for p in fr['pal'] if p[0]==e[1]][0]
  win=[R[k] for k in range(max(0,f-10),min(len(R),f+11))]
  mj=0
  for a,b in zip(win,win[1:]):
    pa=[p for p in a['pal'] if p[0]==e[1]][0];pb=[p for p in b['pal'] if p[0]==e[1]][0];mj=max(mj,math.dist(pa[1:4],pb[1:4]))
  yaw=math.degrees(math.atan2(fk['dx'],fk['dz']));yerr=abs(((yaw+45)%90)-45)
  bef=[p for p in R[f-1]['pal'] if p[0]==e[1]][0]
  print(f"EV f{f} t{f/60:.2f}s pal {e[1]} {e[2]}->{e[3]} carY {fk['carY']} fh {fk['fh']} fkY {fk['y']} palY_before {bef[2]} palY_after {pal[2]} dY {pal[2]-bef[2]:+.3f} dXZ {math.hypot(pal[1]-bef[1],pal[3]-bef[3]):.3f} yaw {yaw:.2f} yawErr {yerr:.2f} maxJump±10 {mj:.3f} fk {fk['x']},{fk['z']}")
# kinematics: forklift
xs=[(fr['f'],fr['fk'][0]) for fr in R]
slip=[];roll=[];steer=[];fl=[]
for (f0,a),(f1,b) in zip(xs,xs[1:]):
  vx,vz=(b['x']-a['x'])*60,(b['z']-a['z'])*60;sp=math.hypot(vx,vz)
  if sp>0.05:
    hx,hz=b['dx'],b['dz'];lat=abs(-hz*vx+hx*vz);slip.append((f1,sp,lat))
    # wheel roll: first wheel rot.x delta vs distance
    if a['wh'] and b['wh']:
      dth=abs(b['wh'][0][4]-a['wh'][0][4]);roll.append((f1,sp/60,dth))
    steer.append((f1,[w[5] for w in b['wh']]))
    fl.append((f1,b['fh'],b['carY']-b['y']))
print('moving frames',len(slip))
if slip:
  big=[s for s in slip if s[2]>0.05*max(s[1],0.1)+0.02];print('slip frames (lat v>0.02+5%)',len(big),big[:10]);print('max lat',max(s[2] for s in slip))
  print('roll samples',roll[:5],'zero-roll moving frames',sum(1 for r in roll if r[2]<1e-4))
  print('steer sample',steer[::max(1,len(steer)//10)][:10])
  print('forks while moving (fh,carY-vehY) min/max',min(x[1] for x in fl if x[1] is not None),max(x[1] for x in fl if x[1] is not None),max(x[2] for x in fl))
print('wheel names',R[0]['fk'][0]['wh'])
print('pal parents t0',sorted(set(p[4] for p in R[0]['pal'])),'scales',sorted(set(p[6] for fr in R for p in fr['pal'])))
