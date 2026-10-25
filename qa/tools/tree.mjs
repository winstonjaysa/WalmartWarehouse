import { NodeIO } from '@gltf-transform/core'; import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
const doc=await new NodeIO().registerExtensions(ALL_EXTENSIONS).read(process.argv[2]);
const sc=doc.getRoot().listScenes()[0];
function w(n,d){const wm=n.getWorldTranslation();console.log(' '.repeat(d*2)+n.getName(),'local',n.getTranslation().map(v=>+v.toFixed(3)),'world',wm.map(v=>+v.toFixed(3)),n.getMesh()?'[mesh]':'');for(const c of n.listChildren())w(c,d+1);}
for(const n of sc.listChildren())w(n,0);
