import json,math,sys,re
D=sys.argv[1];R=json.load(open(D+'/sim_frames.json'))
NF=len(R[0]['fk']);print('frames',len(R),'carriage vehicles',NF,'pallets',len(R[0]['pal']))
vis={p[0]:p[5] for p in R[0]['pal']}
ev=[];jumps=[]
for i in range(1,len(R)):
  P={p[0]:p for p in R[i-1]['pal']}
  for p in R[i]['pal']:
    q=P.get(p[0])
    if not q: continue
    d=math.dist(p[1:4],q[1:4])
    if d>0.05 and (p[5] or q[5]): jumps.append((i,p[0],round(d,3),q[4],p[4]))
    if q[4]!=p[4]: ev.append((i,p[0],q[4],p[4]))
    if q[5]!=p[5] or abs(q[6]-p[6])>1e-3: print('VIS/SCALE change',i,p[0],q[5:],p[5:])
print('visible-load jumps>5cm',len(jumps),jumps[:12])
def pal(fr,u): return [p for p in fr['pal'] if p[0]==u][0]
rows=[]
for f,u,a,b in ev:
  # which vehicle: nearest carriage
  pa=pal(R[f],u);k=min(range(NF),key=lambda j:abs(R[f]['fk'][j]['x']-pa[1])+abs(R[f]['fk'][j]['z']-pa[3]));fk=R[f]['fk'][k]
  bef=pal(R[f-1],u);mj=max(math.dist(pal(R[x],u)[1:4],pal(R[x-1],u)[1:4]) for x in range(max(1,f-10),min(len(R),f+11)))
  yaw=math.degrees(math.atan2(fk['dx'],fk['dz']));ye=abs(((yaw+45)%90)-45)
  kind='attach' if b=='carriage' else 'detach'
  # seat: pallet bottom Y vs carriage heel at attach; at detach pallet bottom vs final
  seat = fk['carY']-pa[2] if kind=='attach' else bef[2]-pa[2]
  rows.append(dict(f=f,t=round(f/60,2),kind=kind,veh=k,pal=u,frm=a,to=b,carY=fk['carY'],palY_before=bef[2],palY_after=pa[2],seat=round(seat,3),yawErr=round(ye,2),dXZ=round(math.hypot(pa[1]-bef[1],pa[3]-bef[3]),3),maxJump=round(mj,3),fh=fk['fh']))
for r in rows: print('EV',r)
# kinematics per vehicle
for k in range(NF):
  F=[fr['fk'][k] for fr in R]
  def h(i):return math.degrees(math.atan2(F[i]['dx'],F[i]['dz']))
  dy=sorted([(abs((h(i)-h(i-1)+180)%360-180),i) for i in range(1,len(F))],reverse=True)[:5]
  def mid(fk,n):
    w=[x for x in fk['wh'] if x[0]==n] or fk['wh'][:2];return [sum(x[j] for x in w)/len(w) for j in (1,2,3)] if w else [fk['x'],fk['y'],fk['z']]
  lat=[];dist=rot=0;ack=[];fhm=[]
  for i in range(1,len(F)):
    a,b=F[i-1],F[i];pa,pb=mid(a,'wheelFront'),mid(b,'wheelFront');vx,vz=(pb[0]-pa[0])*60,(pb[2]-pa[2])*60;sp=math.hypot(vx,vz)
    if sp>0.05:
      lat.append(abs(-b['dz']*vx+b['dx']*vz));d=sp/60;dist+=d
      if b['wh']:
        dr=abs(b['wh'][0][4]-a['wh'][0][4]);rot+=dr if dr<1 else 0
        st=[x[5] for x in b['wh'] if x[0]=='wheelRear']
        dh=math.radians((h(i)-h(i-1)+180)%360-180)
        if st and abs(st[0])>0.05 and d>0.005: ack.append(abs(abs(st[0])-abs(math.atan(1.26*dh/d))))
      if b['fh'] is not None: fhm.append(b['fh'])
  print(f'VEH{k}: maxYawStep {[(round(a,2),i) for a,i in dy]}; slip max {max(lat) if lat else 0:.3f} m/s n>0.03 {sum(1 for x in lat if x>0.03)}/{len(lat)}; roll r={dist/rot if rot else 0:.3f} wheelH {F[0]["wh"][0][2]-F[0]["y"] if F[0]["wh"] else 0:.3f}; steerErr mean {math.degrees(sum(ack)/len(ack)) if ack else 0:.1f} max {math.degrees(max(ack)) if ack else 0:.1f}; forks moving {min(fhm) if fhm else None}-{max(fhm) if fhm else None}; dist {dist:.1f}')
json.dump(rows,open(D+'/slot_events_v.json','w'),indent=1)
