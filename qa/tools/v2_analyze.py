import json,math,sys
d=json.load(open(sys.argv[1]+'/frames.json'));N=len(d)
names=sys.argv[2].split(',') if len(sys.argv)>2 else None
nv=len(d[0]['v']);print('frames',N,'vehicles',nv,'workers',len(d[0]['w']))
for i in range(nv):
    mv=0;unm=0;dist=0;maxyaw=(0,0);slip=0;hi=0;fhmax=0
    for f in range(1,N):
        a=d[f-1]['v'][i];b=d[f]['v'][i]
        ds=math.hypot(b[0]-a[0],b[2]-a[2]);dy=abs((b[3]-a[3]+math.pi)%(2*math.pi)-math.pi)*57.3
        if dy>maxyaw[0]:maxyaw=(round(dy,2),f)
        if ds>1e-4 or dy>0.05:
            mv+=1;dist+=ds
            if not b[5]: unm+=1
            vx=(b[0]-a[0])*60;vz=(b[2]-a[2])*60;lat=abs(vx*math.cos(b[3])-vz*math.sin(b[3]))
            if lat>0.03: slip+=1
            if b[4] is not None:
                fhmax=max(fhmax,b[4])
                if b[4]>0.3: hi+=1
    print(f'V{i} {names[i] if names else ""} moving {mv} dist {dist:.1f} m | unmanned moving frames {unm} | maxYawStep {maxyaw} | slip>0.03 {slip} | forks>0.3m while moving {hi} (max {fhmax:.3f})')
for j in range(len(d[0]['w'])):
    mv=0;dist=0;legs=set()
    for f in range(1,N):
        a=d[f-1]['w'][j];b=d[f]['w'][j];ds=math.hypot(b[0]-a[0],b[1]-a[1])
        if ds>1e-4: mv+=1;dist+=ds;legs.add(b[2])
    print(f'W{j} moving {mv} dist {dist:.1f} m leg-angle distinct {len(legs)} parent {d[0]["w"][j][5]} pos0 {d[0]["w"][j][:2]} posN {d[-1]["w"][j][:2]}')
