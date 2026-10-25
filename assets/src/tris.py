import json, struct, sys
def load(p):
    b = open(p, 'rb').read(); n = struct.unpack('<I', b[12:16])[0]; return json.loads(b[20:20 + n])
g = load(sys.argv[1]); tot = 0; rows = []
for nd in g['nodes']:
    if 'mesh' in nd:
        t = sum(g['accessors'][p['indices']]['count'] // 3 for p in g['meshes'][nd['mesh']]['primitives'])
        tot += t; rows.append((t, nd.get('name'), len(g['meshes'][nd['mesh']]['primitives'])))
for r in sorted(rows, reverse=True): print(*r)
print('TOTAL', tot, 'prims', sum(r[2] for r in rows), 'materials', len(g.get('materials', [])))
