# renders/contact.png : 6-col grid of the Blender beauty renders, labelled with bytes / draws / tris from manifest.json
import json, os
from PIL import Image, ImageDraw, ImageFont
A = os.path.dirname(os.path.abspath(__file__)) + '/..'
m = json.load(open(f'{A}/manifest.json')); C, TW, TH = 6, 480, 360
try: F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 17); F2 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 14)
except Exception: F = F2 = ImageFont.load_default()
rows = (len(m['assets']) + C - 1) // C; S = Image.new('RGB', (C * TW, rows * TH + 40), (238, 236, 232)); d = ImageDraw.Draw(S)
d.text((12, 10), f"gateflow assets - {m['count']} GLBs, {m['total_bytes']/1024:.0f} KB ({m['total_bytes_base64']/1024:.0f} KB as base64) - three r160 + data-URI load: {'PASS' if m['checks']['r160_data_uri']['all_pass'] else 'FAIL'}", fill=(30, 30, 30), font=F)
for i, a in enumerate(m['assets']):
    n = a['file'][:-4]; im = Image.open(f'{A}/renders/{n}.png').convert('RGB'); im.thumbnail((TW, TH - 44))
    x, y = (i % C) * TW, 40 + (i // C) * TH; S.paste(im, (x + (TW - im.width) // 2, y))
    d.text((x + 10, y + TH - 42), n, fill=(20, 20, 20), font=F)
    d.text((x + 10, y + TH - 21), f"{a['bytes']/1024:.0f} KB (b64 {a['bytes_base64']/1024:.0f})  draws {a['draw_calls']}  tris {a['tris']:,}", fill=(70, 70, 70), font=F2)
S.save(f'{A}/renders/contact.png'); print(S.size)
