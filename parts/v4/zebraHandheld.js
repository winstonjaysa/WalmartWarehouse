// Generic rugged enterprise handheld (TC-series look), 0.077 w x 0.155 h x 0.021 d. Standing upright, screen faces +z.
// Origin at the grip (centre of lower body, mid-thickness). opts: {screen:'done' (default confirmation view)|'list'|'scan', trigger:false (snap-on pistol grip; refs show none)}
import { mergeGeos, box, tint } from './_merge.js';
function screenTex(THREE, mode) {
  const c = document.createElement('canvas'); c.width = 128; c.height = 228; const x = c.getContext('2d');
  if (mode !== 'list' && mode !== 'scan') { // single-purpose confirmation view (default), like the refs
    x.fillStyle = '#f5f6f8'; x.fillRect(0, 0, 128, 228); x.fillStyle = '#20232a'; x.fillRect(0, 0, 128, 10);
    x.fillStyle = '#2e9e44'; x.beginPath(); x.arc(64, 84, 30, 0, 7); x.fill(); x.strokeStyle = '#fff'; x.lineWidth = 7; x.lineCap = 'round'; x.beginPath(); x.moveTo(50, 85); x.lineTo(60, 96); x.lineTo(80, 72); x.stroke();
    x.fillStyle = '#222'; x.font = 'bold 12px sans-serif'; x.textAlign = 'center'; x.fillText('Shipment', 64, 140); x.fillText('received', 64, 156);
    x.fillStyle = '#0071ce'; x.fillRect(14, 190, 100, 22); x.fillStyle = '#fff'; x.font = 'bold 10px sans-serif'; x.fillText('OK', 64, 205);
    x.fillStyle = '#555'; for (const bx of [36, 64, 92]) x.fillRect(bx - 4, 220, 8, 4);
    const t0 = new THREE.CanvasTexture(c); t0.colorSpace = THREE.SRGBColorSpace; return t0;
  }
  x.fillStyle = '#f2f4f7'; x.fillRect(0, 0, 128, 228); x.fillStyle = '#1a3d7a'; x.fillRect(0, 0, 128, 12); x.fillStyle = '#0071ce'; x.fillRect(0, 12, 128, 26);
  x.fillStyle = '#fff'; x.font = 'bold 11px sans-serif'; x.fillText(mode === 'scan' ? 'SCAN ITEM' : 'RECEIVING', 8, 30);
  for (let i = 0; i < 6; i++) { x.fillStyle = '#fff'; x.fillRect(6, 46 + i * 26, 116, 22); x.fillStyle = '#333'; x.fillRect(12, 51 + i * 26, 60, 4); x.fillStyle = '#999'; x.fillRect(12, 59 + i * 26, 40, 3); x.fillStyle = i === 1 ? '#2e9e44' : '#ffc220'; x.fillRect(104, 52 + i * 26, 12, 10); }
  x.fillStyle = '#ffc220'; x.fillRect(6, 208, 116, 16); x.fillStyle = '#222'; x.font = 'bold 9px sans-serif'; x.fillText('SUBMIT', 46, 220);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function build(THREE, mats, opts = {}) {
  const g = new THREE.Group(), vcM = mats.vc || new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 });
  const W = 0.077, H = 0.155, D = 0.021, yo = -0.045; // body bottom at y=yo
  const shp = new THREE.Shape(), r = 0.009, w2 = W / 2 - 0.003;
  shp.moveTo(-w2 + r, 0); shp.lineTo(w2 - r, 0); shp.quadraticCurveTo(w2, 0, w2, r); shp.lineTo(w2, H - 0.006 - r); shp.quadraticCurveTo(w2, H - 0.006, w2 - r, H - 0.006);
  shp.lineTo(-w2 + r, H - 0.006); shp.quadraticCurveTo(-w2, H - 0.006, -w2, H - 0.006 - r); shp.lineTo(-w2, r); shp.quadraticCurveTo(-w2, 0, -w2 + r, 0);
  const body = new THREE.ExtrudeGeometry(shp, { depth: D - 0.006, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 2, curveSegments: 4 });
  body.translate(0, yo + 0.003, -(D - 0.006) / 2); tint(THREE, body, '#2b2e33');
  const P = [body];
  // rubber corner bumpers + front bezel + back battery door + side scan buttons + scan window
  for (const sx of [1, -1]) for (const sy of [0, 1]) P.push(box(THREE, 0.012, 0.022, D + 0.002, sx * (W / 2 - 0.004), yo + (sy ? H - 0.012 : 0.012), 0, { c: '#141414' }));
  P.push(box(THREE, W - 0.008, H - 0.02, 0.002, 0, yo + H / 2 + 0.002, D / 2 + 0.0005, { c: '#111317' }));
  P.push(box(THREE, W - 0.016, 0.07, 0.003, 0, yo + 0.05, -D / 2 - 0.001, { c: '#3a3d42' }), box(THREE, 0.03, 0.012, 0.002, 0, yo + 0.11, -D / 2 - 0.001, { c: '#55585e' }));
  for (const sx of [1, -1]) P.push(box(THREE, 0.004, 0.022, 0.012, sx * (W / 2 + 0.001), yo + 0.105, 0.002, { c: '#f2a900' }));
  P.push(box(THREE, 0.004, 0.012, 0.01, W / 2 + 0.001, yo + 0.075, 0.002, { c: '#555' }));
  P.push(box(THREE, 0.04, 0.004, 0.016, 0, yo + H + 0.0005, 0, { c: '#5a0d14' }), box(THREE, 0.046, 0.003, 0.02, 0, yo + H - 0.001, 0, { c: '#1a1a1a' }));
  for (let i = 0; i < 6; i++) P.push(box(THREE, 0.0035, 0.0012, 0.001, -0.009 + i * 0.0036, yo + H - 0.007, D / 2 + 0.0012, { c: '#050505' })); // speaker grille
  // front nav buttons below screen
  for (const bx of [-0.018, 0, 0.018]) P.push(box(THREE, 0.01, 0.004, 0.002, bx, yo + 0.012, D / 2 + 0.0015, { c: '#4a4d52' }));
  // hand strap on back
  P.push(box(THREE, 0.024, 0.09, 0.006, 0, yo + 0.065, -D / 2 - 0.004, { c: '#1e1e1e' }));
  // optional pistol trigger handle (snap-on, angled down/back from the rear) — off by default: refs show the flat TC-style unit
  if (opts.trigger) {
    const tg = new THREE.Group();
    P.push(box(THREE, 0.05, 0.075, 0.018, 0, yo + 0.075, -D / 2 - 0.012, { c: '#1c1d20' }));
    P.push(box(THREE, 0.036, 0.12, 0.034, 0, yo + 0.035, -D / 2 - 0.07, { rx: 0.35, c: '#1c1d20' }));
    P.push(box(THREE, 0.03, 0.028, 0.016, 0, yo + 0.085, -D / 2 - 0.045, { rx: 0.35, c: '#f2a900' }));
    P.push(box(THREE, 0.04, 0.012, 0.045, 0, yo - 0.022, -D / 2 - 0.09, { rx: 0.35, c: '#141414' }));
  }
  const bm = new THREE.Mesh(mergeGeos(THREE, P.map(q => (q.attributes.uv ? q : q))), vcM); bm.name = 'body'; bm.castShadow = true;
  const scrM = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: screenTex(THREE, opts.screen), emissiveIntensity: 0.85, roughness: 0.12, metalness: 0 });
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.062, 0.11), scrM); scr.position.set(0, yo + 0.087, D / 2 + 0.0017); scr.name = 'screen';
  g.add(bm, scr);
  g.userData = { name: 'zebraHandheld', dims: { w: W, h: H, d: D }, pivots: { grip: new THREE.Object3D() }, trigger: !!opts.trigger, drawCalls: 2, originAt: 'grip (0.045 m above bottom edge)', scanWindowY: yo + H };
  return g;
}
