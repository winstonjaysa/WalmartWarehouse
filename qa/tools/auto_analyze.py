# python3 auto_analyze.py TRACKDIR simdt_s  -> automation.json + printed summary
import sys,json,re,math,collections
d=sys.argv[1]; sdt=float(sys.argv[2])
MOB=re.compile(r'fork|amr|truck|tractor|worker|person|tug|stacker|jack|robot|agv|cart|vehicle|picker|driver',re.I)
LOAD=re.compile(r'box|carton|tote|pallet|parcel|case|load|crate|sack|bin',re.I)
TRUCK=re.compile(r'truck|trailer|tractor|semi',re.I)
rows=[json.loads(l) for l in open(d+'/track.jsonl')]
last={}; seen=set(); ev=[]; steps=collections.defaultdict(list); still=collections.defaultdict(int); moved=set(); stuck=[]
pop=[]; cams=[]
def kind(n): return 'truck' if TRUCK.search(n) else 'mobile' if MOB.search(n) else 'load' if LOAD.search(n) else 'other'
for r in rows:
    f=r['f']; t=r['vt']/1000*1  # virtual ms (already sim-scaled by DT)
    if 'o' not in r: continue
    cams.append((f,r['cam'])); pop.append(r['n']); cur={}
    for o in r['o']:
        u,n,x,y,z,vis,on,ff,op,sc,sx,sy,cnt=o; cur[u]=o
        k=kind(n)
        if u in last:
            p=last[u]; dd=math.dist(p[2:5],(x,y,z))
            if p[5]!=vis and on and ff<0.9 and k!='other': ev.append(dict(type='show' if vis else 'hide',f=f,t=round(t,2),name=n,uuid=u,kind=k,sx=sx,sy=sy,fog=ff))
            if vis and on and ff<0.9 and k!='other' and abs(p[9]-sc)>0.5 and min(p[9],sc)<0.05: ev.append(dict(type='scalepop',f=f,t=round(t,2),name=n,uuid=u,kind=k,sx=sx,sy=sy))
            if vis: steps[u].append(dd)
            lim={'truck':15,'mobile':6,'load':8,'other':1e9}[k]*sdt*3
            if vis and dd>max(lim,0.5) and k!='other': ev.append(dict(type='teleport',f=f,t=round(t,2),name=n,uuid=u,kind=k,dist=round(dd,2),limit=round(lim,2),sx=sx,sy=sy,on=on))
            if k in('mobile','truck'):
                if dd<0.005: still[u]+=1
                else:
                    if still[u]*sdt>30: stuck.append(dict(name=n,uuid=u,kind=k,from_f=f-still[u],to_f=f,secs=round(still[u]*sdt,1),pos=[x,y,z]))
                    still[u]=0; moved.add(u)
        elif f>0 and vis and on and ff<0.9 and k!='other':
            ev.append(dict(type='added',f=f,t=round(t,2),name=n,uuid=u,kind=k,sx=sx,sy=sy,fog=ff))
    for u,p in last.items():
        if u not in cur and p[5] and p[6] and p[7]<0.9 and kind(p[1])!='other': ev.append(dict(type='removed',f=f,t=round(t,2),name=p[1],uuid=u,kind=kind(p[1]),sx=p[10],sy=p[11]))
    last=cur
for u,c in still.items():
    if c*sdt>30 and u in last: stuck.append(dict(name=last[u][1],uuid=u,kind=kind(last[u][1]),from_f=len(rows)-c,to_f=len(rows),secs=round(c*sdt,1),pos=last[u][2:5],never_moved=u not in moved,open=True))
# camera
sp=[math.dist(cams[i][1],cams[i-1][1]) for i in range(1,len(cams))]
mv=sorted(s for s in sp if s>1e-3); med=mv[len(mv)//2] if mv else 0
camjumps=[dict(f=cams[i+1][0],step=round(s,2),median=round(med,3)) for i,s in enumerate(sp) if med and s>3*max(med,0.05) and s>1]
shots=[];cur=None
for i,s in enumerate(sp):
    m=s>1e-3
    if cur is None or cur['moving']!=m: cur=dict(moving=m,f0=cams[i][0],f1=cams[i][0]); shots.append(cur)
    cur['f1']=cams[i+1][0]
for s in shots: s['secs']=round((s['f1']-s['f0'])*sdt,1)
cnt=collections.Counter(e['type'] for e in ev); off=collections.Counter(e['name'] for e in ev)
out=dict(frames=len(rows),sim_seconds=round(len(rows)*sdt,1),pop_first=pop[:1],pop_last=pop[-1:],pop_min=min(pop) if pop else 0,pop_max=max(pop) if pop else 0,
 counts=dict(cnt),stuck=len(stuck),top_offenders=off.most_common(15),events=ev[:2000],stuck_list=stuck[:200],cam_jumps=camjumps[:200],cam_segments=shots[:200])
json.dump(out,open(d+'/automation.json','w'),indent=1)
print(json.dumps({k:out[k] for k in ['frames','sim_seconds','pop_first','pop_last','pop_min','pop_max','counts','stuck','top_offenders']},indent=0))
print('cam jumps',len(camjumps),camjumps[:5]); print('cam segments',len(shots),[(s['moving'],s['f0'],s['secs']) for s in shots[:20]])
for e in ev[:15]: print(e)
for s in stuck[:10]: print('STUCK',s)
