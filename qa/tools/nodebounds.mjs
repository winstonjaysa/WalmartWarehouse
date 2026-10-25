import { NodeIO, getBounds } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
const doc = await new NodeIO().registerExtensions(ALL_EXTENSIONS).read(process.argv[2]);
for (const n of doc.getRoot().listNodes()) { if(!n.getMesh()) { console.log('GROUP',n.getName(),'T',n.getTranslation().map(v=>+v.toFixed(3)),'R',n.getRotation().map(v=>+v.toFixed(3)),'S',n.getScale()); continue;}
  const b=getBounds(n); console.log(n.getName().padEnd(22),'local T',n.getTranslation().map(v=>+v.toFixed(3)),'world min',b.min.map(v=>+v.toFixed(2)),'max',b.max.map(v=>+v.toFixed(2)));}
