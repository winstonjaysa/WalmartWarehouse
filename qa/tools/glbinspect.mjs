import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { getBounds } from '@gltf-transform/core';
import fs from 'fs'; import path from 'path';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const dir = process.argv[2]; const out = {};
for (const f of fs.readdirSync(dir).filter(f=>/\.(glb|gltf)$/i.test(f))) {
  const p = path.join(dir,f); const r = {file:f, bytes: fs.statSync(p).size};
  try {
    const doc = await io.read(p); const root = doc.getRoot();
    let tris=0, verts=0, prims=0;
    for (const m of root.listMeshes()) for (const pr of m.listPrimitives()) { prims++; const pos=pr.getAttribute('POSITION'); const c=pos?pos.getCount():0; verts+=c; const idx=pr.getIndices(); tris += (idx?idx.getCount():c)/3; }
    r.meshes=root.listMeshes().length; r.primitives=prims; r.tris=Math.round(tris); r.verts=verts;
    r.materials=root.listMaterials().map(m=>({name:m.getName(), color:'#'+m.getBaseColorFactor().slice(0,3).map(v=>Math.round(Math.pow(v,1/2.2)*255).toString(16).padStart(2,'0')).join(''), rough:+m.getRoughnessFactor().toFixed(2), metal:+m.getMetallicFactor().toFixed(2), emissive:m.getEmissiveFactor().some(v=>v>0), tex:!!m.getBaseColorTexture(), alpha:m.getAlphaMode()}));
    r.textures=root.listTextures().map(t=>({name:t.getName(), mime:t.getMimeType(), size:t.getSize(), kb:Math.round((t.getImage()?.byteLength||0)/1024)}));
    const scene=root.getDefaultScene()||root.listScenes()[0]; const b=getBounds(scene);
    r.bboxMin=b.min.map(v=>+v.toFixed(3)); r.bboxMax=b.max.map(v=>+v.toFixed(3)); r.size=b.max.map((v,i)=>+(v-b.min[i]).toFixed(3));
    r.nodes=root.listNodes().length; r.nodeNames=root.listNodes().map(n=>n.getName()).slice(0,60);
    r.animations=root.listAnimations().map(a=>a.getName());
    r.extensions=root.listExtensionsUsed().map(e=>e.extensionName);
  } catch(e){ r.error=String(e); }
  out[f]=r;
}
console.log(JSON.stringify(out,null,1));
