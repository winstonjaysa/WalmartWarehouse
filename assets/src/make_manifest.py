import json, struct, glob, os, re, datetime
A = os.path.dirname(os.path.abspath(__file__)) + '/..'
R = json.load(open(f'{A}/src/check_results.json'))['results']
if isinstance(R, list): R = {x['file']: x for x in R}
R160 = json.load(open(f'{A}/src/check_results_r160.json'))
DU = json.load(open(f'{A}/src/check_results_datauri_r160.json'))
import base64
IMG = sorted(os.listdir(f'{A}/../imgref'))
def gltf_json(p):
    b = open(p, 'rb').read(); l = struct.unpack('<I', b[12:16])[0]
    return json.loads(b[20:20 + l])
UNLIT = re.compile(r'^(brand_|trailer_side|trailer_rear|mark53)|led|light_|beacon', re.I)
assets = []; total = 0; total64 = 0
for p in sorted(glob.glob(f'{A}/*.glb')):
    f = os.path.basename(p); n = f[:-4]; g = gltf_json(p); c = R[f]
    meta = json.load(open(f'{A}/src/meta/{n}.json'))
    names = [x.get('name', '') for x in g['nodes']]
    nodes = {k: c['nodes'][k] for k in names if k and not k.endswith('_geo') and k in c['nodes']}
    anchors = {k: {'pivot_world': nodes.get(k), 'desc': v} for k, v in (meta.get('anchors') or {}).items()}
    refs = meta.get('refs', [])
    bad = [r for r in refs if r not in IMG]
    assert not bad, (n, bad)
    by = os.path.getsize(p); total += by; b64 = DU['sizes'][f]['base64_chars']; total64 += b64
    du = DU['results'][n]; c160 = R160['results'][f]
    assets.append(dict(
        file=f, bytes=by, bytes_base64=b64, data_uri_chars=DU['sizes'][f]['data_uri_chars'], bytes_raw=os.path.getsize(f'{A}/raw/{f}'), tris=c['tris'], draw_calls=c['draws'],
        size_m=c['size'], bbox_min=c['min'], bbox_max=c['max'], facing=meta.get('facing', '+Z'),
        sides=meta.get('sides'), hierarchy=meta.get('hierarchy'),
        nodes=nodes, anchors=anchors or None, rig=meta.get('rig'), node_notes=meta.get('nodes'),
        animations=[{'name': a, 'duration_s': d} for a, d in c['animations']],
        materials_toneMapped_false=sorted(m['name'] for m in g.get('materials', []) if UNLIT.search(m.get('name', ''))),
        textures=len(g.get('images', [])), extensions=sorted(g.get('extensionsUsed', [])),
        qa_blender=meta.get('qa'), check_threejs={'r170': {'pass': c['ok'], 'minY': c['minY'], 'animMinY': c['animMinY'] or None}, 'r160': {'pass': c160['ok'], 'minY': c160['minY'], 'draws': c160['draws'], 'tris': c160['tris']}, 'r160_data_uri': {'loadAsync_dataURI': du['loadAsync_dataURI']['ok'], 'parse_ArrayBuffer': du['parse_ArrayBuffer']['ok']}},
        material_pass=meta.get('material_pass'),
        imgref=refs, notes=meta.get('notes')))
man = dict(
    generated=datetime.datetime.now().isoformat(timespec='seconds'),
    units='metres (1 unit = 1 m), real-world scale', up='+Y', facing='+Z = vehicle/asset front', left='+X',
    origin='ground centre of footprint at y=0 (unless noted in node_notes)', style='clay/toy matte PBR',
    compression=dict(tool='@gltf-transform/cli 4.5.1',
        steps=['prune --keep-leaves true --keep-attributes false --keep-solid-textures false',
               'optimize --compress meshopt --texture-compress webp --flatten false --join false --instance false --simplify false --palette false --prune false'],
        extensions=['EXT_meshopt_compression', 'KHR_mesh_quantization', 'EXT_texture_webp', 'KHR_materials_emissive_strength'],
        decoder='three/examples/jsm/libs/meshopt_decoder.module.js (MeshoptDecoder)'),
    toneMapped_false_rule=UNLIT.pattern + '  (brand colours, livery decals, LEDs/beacons: set material.toneMapped=false so Walmart blue #0071CE / yellow #FFC220 render exact)',
    anchors_convention='Empty nodes; +Z forward. anchor_seat = operator hip (H-point) on the seat top; anchor_stand = operator feet on the platform floor; anchor_tiller_grip = hand point on the handle. Parent the operator (e.g. worker.glb) to the anchor.',
    no_anchor=dict(amr='autonomous mobile robot, no operator position', robot_arm='stationary, not a vehicle'),
    material_merge=dict(applied_to=sorted(a['file'][:-4] for a in assets if a.get('material_pass')),
        rule='per animatable node (pivot Empty), all static sub-meshes merged by material: opaque untextured colours -> one clay_palette material (base-colour + metallic-roughness palette PNG/WebP, per-face UVs collapsed to texel centres, NEAREST sampling: do not change the sampler/filters); livery decals + brand solids + lamps -> one brand_atlas material (decal atlas + emissive-mask atlas, emissiveStrength = brightest lamp). Transparent materials kept separate. Result: 1-2 draws per animatable node.'),
    checks=dict(
        r170=dict(page='/workspace/tools/verify/web/check.html', three_revision=R160 and json.load(open(f'{A}/src/check_results.json')).get('three_revision'), all_pass=all(v['ok'] for v in R.values())),
        r160=dict(page='/workspace/tools/verify/web/check160.html (three@0.160.0 npm GLTFLoader + examples/jsm/libs/meshopt_decoder.module.js)', three_revision=R160.get('three_revision'), all_pass=all(v['ok'] for v in R160['results'].values()), console=R160.get('console')),
        r160_data_uri=dict(page='src/qa/datauri_check_r160.html (single self-contained page, every GLB inlined as data:model/gltf-binary;base64, three@0.160.0 from unpkg)', three_revision=DU['three_revision'],
            all_pass=all(r[m]['ok'] for r in DU['results'].values() for m in r), modes=['GLTFLoader.loadAsync(dataURI)', 'GLTFLoader.parse(ArrayBuffer)'],
            network_requests=DU['network_requests'], foreign_requests=DU['foreign_requests'], console=DU['console'], page_bytes=DU['page_bytes'])),
    total_bytes=total, total_bytes_base64=total64, count=len(assets), assets=assets)
json.dump(man, open(f'{A}/manifest.json', 'w'), indent=1)
print(len(assets), total)
