import json, struct, glob, os, re, datetime
A = os.path.dirname(os.path.abspath(__file__)) + '/..'
R = json.load(open(f'{A}/src/check_results.json'))['results']
if isinstance(R, list): R = {x['file']: x for x in R}
IMG = sorted(os.listdir(f'{A}/../imgref'))
def gltf_json(p):
    b = open(p, 'rb').read(); l = struct.unpack('<I', b[12:16])[0]
    return json.loads(b[20:20 + l])
UNLIT = re.compile(r'^(brand_|trailer_side|trailer_rear|mark53)|led|light_|beacon', re.I)
assets = []; total = 0
for p in sorted(glob.glob(f'{A}/*.glb')):
    f = os.path.basename(p); n = f[:-4]; g = gltf_json(p); c = R[f]
    meta = json.load(open(f'{A}/src/meta/{n}.json'))
    names = [x.get('name', '') for x in g['nodes']]
    nodes = {k: c['nodes'][k] for k in names if k and not k.endswith('_geo') and k in c['nodes']}
    anchors = {k: {'pivot_world': nodes.get(k), 'desc': v} for k, v in (meta.get('anchors') or {}).items()}
    refs = meta.get('refs', [])
    bad = [r for r in refs if r not in IMG]
    assert not bad, (n, bad)
    by = os.path.getsize(p); total += by
    assets.append(dict(
        file=f, bytes=by, bytes_raw=os.path.getsize(f'{A}/raw/{f}'), tris=c['tris'], draw_calls=c['draws'],
        size_m=c['size'], bbox_min=c['min'], bbox_max=c['max'], facing=meta.get('facing', '+Z'),
        sides=meta.get('sides'), hierarchy=meta.get('hierarchy'),
        nodes=nodes, anchors=anchors or None, rig=meta.get('rig'), node_notes=meta.get('nodes'),
        animations=[{'name': a, 'duration_s': d} for a, d in c['animations']],
        materials_toneMapped_false=sorted(m['name'] for m in g.get('materials', []) if UNLIT.search(m.get('name', ''))),
        textures=len(g.get('images', [])), extensions=sorted(g.get('extensionsUsed', [])),
        qa_blender=meta.get('qa'), check_threejs={'pass': c['ok'], 'minY': c['minY'], 'animMinY': c['animMinY'] or None},
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
    total_bytes=total, count=len(assets), assets=assets)
json.dump(man, open(f'{A}/manifest.json', 'w'), indent=1)
print(len(assets), total)
