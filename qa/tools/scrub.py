# python3 scrub.py FRAMEDIR [ARTDIR] -> per-frame diff energy, spikes, blobs appearing/disappearing; saves zoomed crops
import sys,os,glob,json,numpy as np
from PIL import Image
from scipy import ndimage
d=sys.argv[1]; art=sys.argv[2] if len(sys.argv)>2 else None
fs=sorted(glob.glob(d+'/f*.png')); prev=None; E=[]; boxes=[]
mask_ui=None
for i,f in enumerate(fs):
    a=np.asarray(Image.open(f).convert('L'),dtype=np.int16)
    if prev is not None:
        df=np.abs(a-prev)>18; E.append(df.mean()); lab,n=ndimage.label(ndimage.binary_dilation(df,iterations=2))
        sl=ndimage.find_objects(lab); big=[(s[0].start,s[1].start,s[0].stop,s[1].stop,int((lab[s]>0).sum())) for s in sl if (lab[s]>0).sum()>40]
        boxes.append(big)
    else: E.append(0); boxes.append([])
    prev=a
E=np.array(E); med=np.median(E[1:]) if len(E)>2 else 0
rep={'frames':len(fs),'median_diff':float(med),'spikes':[],'flicker_px':[]}
for i in range(2,len(E)-1):
    if E[i]>max(3*med,0.002) and E[i]>2*E[i-1] and E[i]>2*E[i+1]: rep['spikes'].append({'frame':i,'diff':float(E[i]),'boxes':boxes[i][:8]})
# flicker: pixels toggling A->B->A over 3 frames (z-fight/shimmer)
imgs=None
cnt=0
for i in range(1,len(fs)-1):
    if i%4: continue
    a,b,c=[np.asarray(Image.open(fs[j]).convert('L'),dtype=np.int16) for j in (i-1,i,i+1)]
    fl=(np.abs(a-c)<6)&(np.abs(a-b)>30)
    lab,n=ndimage.label(ndimage.binary_dilation(fl,iterations=1)); 
    for s in ndimage.find_objects(lab):
        px=int((lab[s]>0).sum())
        if px>25: rep['flicker_px'].append({'frame':i,'box':[s[0].start,s[1].start,s[0].stop,s[1].stop],'px':px})
json.dump(rep,open(d+'/scrub.json','w'),indent=1)
print('frames',len(fs),'median diff',round(med,5),'spikes',len(rep['spikes']),'flicker regions',len(rep['flicker_px']))
for s in rep['spikes'][:20]: print('SPIKE',s['frame'],round(s['diff'],4),s['boxes'][:3])
for s in sorted(rep['flicker_px'],key=lambda x:-x['px'])[:20]: print('FLICK',s)
