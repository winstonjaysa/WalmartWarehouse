# python3 vehicle_analyze.py TRACKDIR simdt_s [vehicleRegex]
import sys,json,re,math,collections
d=sys.argv[1]; sdt=float(sys.argv[2])
VR=re.compile(sys.argv[3] if len(sys.argv)>3 else r'forklift|truck|amr|stacker|tug|pallet.?jack|yard|agv|reach',re.I)
LOAD=re.compile(r'pallet|load|payload',re.I)
rows=[json.loads(l) for l in open(d+'/track.jsonl')]
def ang(a): return (a+math.pi)%(2*math.pi)-math.pi
viol=collections.defaultdict(list); stats=collections.defaultdict(lambda:collections.defaultdict(list))
prev={}
for r in rows:
    if 'o' not in r: continue
    f=r['f']; O={o[0]:o for o in r['o']}; kids=collections.defaultdict(list)
    for o in r['o']: kids[o[14]].append(o)
    def desc(u,depth=0):
        out=[]
        for k in kids.get(u,[]):
            out.append(k); 
            if depth<6: out+=desc(k[0],depth+1)
        return out
    roots=[o for o in r['o'] if VR.search(o[1]) and not (o[14] in O and VR.search(O[o[14]][1])) and not re.search(r'wheel|fork|mast|carriage',o[1],re.I)]
    for o in roots:
        u,n=o[0],o[1]; P=prev.get(u)
        ds=desc(u); parts={k[1]:k for k in ds}
        if P:
            dx,dz=o[2]-P[2],o[4]-P[4]; dist=math.hypot(dx,dz); sp=dist/sdt; dyaw=abs(ang(o[13]-P[13]))
            st=stats[n+'#'+u]; st['speed'].append(sp)
            if sp<0.05 and math.degrees(dyaw)/sdt>15: viol['V1_pivot'].append(dict(f=f,t=round(r['vt']/1000,2),entity=n,uuid=u,yawrate=round(math.degrees(dyaw)/sdt,1),sx=o[10],sy=o[11]))
            if sp>0.2:
                vd=math.atan2(dx,dz); slip=abs(ang(vd-o[13])); slip=min(slip,math.pi-slip)
                st['slip'].append(math.degrees(slip))
                if math.degrees(slip)>5: viol['V2_slip'].append(dict(f=f,t=round(r['vt']/1000,2),entity=n,uuid=u,slip=round(math.degrees(slip),1),speed=round(sp,2),sx=o[10],sy=o[11]))
            # wheels
            for pn,k in parts.items():
                if not re.search(r'wheel',pn,re.I): continue
                front=re.search(r'_?F[LR]?\b|front|FL|FR',pn) is not None
                st['steer_'+('front' if front else 'rear')].append(round(math.degrees(k[17]),1))
                Pk=prev.get(k[0])
                if Pk: st['spin'].append((dist,abs(ang(k[16]-Pk[16]))))
            tr=[k for pn,k in parts.items() if re.search(r'^trailer$|trailer(?!_)',pn,re.I)]; tc=[k for pn,k in parts.items() if re.search(r'^tractor$|cab$',pn,re.I)]
            if tr and tc: st['artic'].append(round(math.degrees(ang(tr[0][13]-tc[0][13])),1))
            fc=[k for pn,k in parts.items() if re.search(r'carriage',pn,re.I)]
            if fc:
                h=fc[0][3]-o[3]; st['fork_h'].append(round(h,3)); st['fork_h_speed'].append((round(sp,2),round(h,3)))
                if sp>0.3 and not (0.05<=h<=0.25): viol['V7_forks_high_travel'].append(dict(f=f,t=round(r['vt']/1000,2),entity=n,uuid=u,fork_h=round(h,2),speed=round(sp,2),sx=o[10],sy=o[11]))
                Pf=prev.get(fc[0][0])
                if Pf and abs(fc[0][3]-Pf[3])>0.005 and sp>0.2: viol['V8_lift_while_moving'].append(dict(f=f,t=round(r['vt']/1000,2),entity=n,uuid=u,speed=round(sp,2),dh=round(fc[0][3]-Pf[3],3)))
                st['lift_step'].append(round(fc[0][3]-(Pf[3] if Pf else fc[0][3]),4))
            mi=[k for pn,k in parts.items() if re.search(r'mast_?inner',pn,re.I)]
            if mi: st['mast_inner_ly'].append(mi[0][15])
            loads=[k for k in ds if LOAD.search(k[1]) and not re.search(r'wheel|fork',k[1],re.I)]
            st['attached'].append(len(loads))
    # free loads resting heights
    for o in r['o']:
        if LOAD.search(o[1]) and not (o[14] in O and VR.search(O[o[14]][1])):
            Pk=prev.get(o[0])
            lp=lambda q:(q[19],q[15],q[20])
            if Pk and Pk[14]==o[14] and math.dist(lp(Pk),lp(o))>0.01: viol['V10_free_load_moving'].append(dict(f=f,t=round(r['vt']/1000,2),entity=o[1],uuid=o[0],parent=o[14],step=round(math.dist(lp(Pk),lp(o)),3),sx=o[10],sy=o[11]))
    prev={o[0]:o for o in r['o']}
summ={}
for k,st in stats.items():
    s={}
    sp=st['speed']; s['moving_frac']=round(sum(1 for x in sp if x>0.2)/max(1,len(sp)),2); s['max_speed']=round(max(sp),2) if sp else 0
    if st['slip']: ss=sorted(st['slip']); s['slip_p95']=round(ss[int(len(ss)*.95)],1)
    for w in ('steer_front','steer_rear'):
        if st[w]: s[w+'_range']=[min(st[w]),max(st[w])]
    if st['spin']:
        dd=sum(a for a,b in st['spin']); th=sum(b for a,b in st['spin']); s['spin_rad_per_m']=round(th/dd,2) if dd else None
    if st['artic']: s['artic_range']=[min(st['artic']),max(st['artic'])]
    if st['fork_h']: s['fork_h_range']=[min(st['fork_h']),max(st['fork_h'])]
    if st['lift_step']:
        ls=[abs(x) for x in st['lift_step'] if abs(x)>1e-4]; s['lift_frames']=len(ls); s['lift_max_step']=max(ls) if ls else 0; s['lift_med_step']=sorted(ls)[len(ls)//2] if ls else 0
    if st['mast_inner_ly']: s['mast_inner_range']=[min(st['mast_inner_ly']),max(st['mast_inner_ly'])]
    s['attached_max']=max(st['attached']) if st['attached'] else 0
    summ[k]=s
out=dict(vehicles=len(summ),summary=summ,violation_counts={k:len(v) for k,v in viol.items()},violations={k:v[:300] for k,v in viol.items()})
json.dump(out,open(d+'/vehicles.json','w'),indent=1)
print(json.dumps(out['violation_counts'])); 
for k,s in list(summ.items())[:40]: print(k,s)
