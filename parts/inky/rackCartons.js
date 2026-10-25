// rackCartons.js — instanced pallets + carton loads + shrink wrap for pallet rack slots.
// three r160. 3 draw calls total (pallets, cartons, wrap). No side effects at import.
import * as THREE from 'three';

const PALLET_H = 0.144;
const _instances = new Set();

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashSeed(s, i) {
  if (typeof s === 'number' && isFinite(s)) return (s * 2654435761) ^ (i * 40503);
  const str = String(s ?? i); let h = 2166136261;
  for (let k = 0; k < str.length; k++) h = Math.imul(h ^ str.charCodeAt(k), 16777619);
  return h;
}

// ---- merged pallet geometry (unit 1 x PALLET_H x 1, origin at bottom centre) ----
function boxInto(list, sx, sy, sz, cx, cy, cz) {
  const g = new THREE.BoxGeometry(sx, sy, sz); g.translate(cx, cy, cz); list.push(g);
}
function mergeGeoms(list) {
  let nv = 0, ni = 0;
  for (const g of list) { nv += g.attributes.position.count; ni += g.index.count; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), uv = new Float32Array(nv * 2);
  const idx = new Uint16Array(ni); let vo = 0, io = 0;
  for (const g of list) {
    pos.set(g.attributes.position.array, vo * 3); nor.set(g.attributes.normal.array, vo * 3);
    uv.set(g.attributes.uv.array, vo * 2);
    const gi = g.index.array; for (let k = 0; k < gi.length; k++) idx[io + k] = gi[k] + vo;
    vo += g.attributes.position.count; io += gi.length; g.dispose();
  }
  const m = new THREE.BufferGeometry();
  m.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  m.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  m.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  m.setIndex(new THREE.BufferAttribute(idx, 1));
  return m;
}
function makePalletGeometry(hi) {
  const L = [], deck = 0.022, block = PALLET_H - 2 * deck;
  if (!hi) { // cheap: top deck + 3 stringers
    boxInto(L, 1, deck, 1, 0, PALLET_H - deck / 2, 0);
    for (const x of [-0.45, 0, 0.45]) boxInto(L, 0.1, PALLET_H - deck, 1, x, (PALLET_H - deck) / 2, 0);
    return mergeGeoms(L);
  }
  // 5 top deck boards along x with gaps, 3x3 blocks, 3 bottom boards
  const nTop = 5, bw = 0.14;
  for (let i = 0; i < nTop; i++) boxInto(L, 1, deck, bw, 0, PALLET_H - deck / 2, -0.5 + bw / 2 + i * (1 - bw) / (nTop - 1));
  for (const x of [-0.45, 0, 0.45]) for (const z of [-0.43, 0, 0.43]) boxInto(L, 0.1, block, 0.14, x, deck + block / 2, z);
  for (const z of [-0.43, 0, 0.43]) boxInto(L, 1, deck, 0.14, 0, deck / 2, z);
  return mergeGeoms(L);
}

// ---- procedural textures ----
function woodTexture(size) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'), r = mulberry32(7);
  g.fillStyle = '#b89668'; g.fillRect(0, 0, size, size);
  for (let i = 0; i < 260; i++) {
    const y = r() * size, l = 120 + r() * 60;
    g.strokeStyle = `rgba(${l * 0.55 | 0},${l * 0.4 | 0},${l * 0.25 | 0},${0.08 + r() * 0.18})`;
    g.lineWidth = 0.5 + r() * 2; g.beginPath(); g.moveTo(0, y);
    for (let x = 0; x <= size; x += size / 8) g.lineTo(x, y + Math.sin(x * 0.02 + i) * 2 + (r() - 0.5) * 2);
    g.stroke();
  }
  for (let i = 0; i < 12; i++) { // knots
    g.fillStyle = `rgba(90,60,30,${0.25 + r() * 0.3})`;
    g.beginPath(); g.ellipse(r() * size, r() * size, 3 + r() * 5, 2 + r() * 2, 0, 0, 7); g.fill();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
}

// Atlas: 4 cols x 8 rows of cells. Variant v (0..7) -> col v%4, rows base=(v>>2)*3 + sub
// sub 0 = top face, 1 = +-z side (tape continues), 2 = +-x side (no tape). Variants 6,7 = blue printed.
const ATLAS_COLS = 4, ATLAS_ROWS = 8;
function cartonAtlas(S) {
  const c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'), cw = S / ATLAS_COLS, ch = S / ATLAS_ROWS;
  const kraft = ['#a87d4a', '#9c7242', '#b38a55', '#94693d', '#b9915c', '#a3784a'];
  const r = mulberry32(1234);
  const cell = (v, sub) => {
    const col = v % 4, row = (v >> 2) * 3 + sub; // row index in UV space (v from bottom)
    return [col * cw, S - (row + 1) * ch]; // canvas coords (flipY)
  };
  const noise = (x, y, w, h, a) => {
    for (let i = 0; i < w * h / 60; i++) {
      g.fillStyle = r() < 0.5 ? `rgba(0,0,0,${a * r()})` : `rgba(255,240,210,${a * r()})`;
      g.fillRect(x + r() * w, y + r() * h, 1 + r() * 2, 1 + r() * 2);
    }
  };
  const edgeShade = (x, y, w, h, bottomDark) => {
    // fake AO: darken edges, more at bottom for sides
    let gr = g.createLinearGradient(x, y, x, y + h);
    gr.addColorStop(0, 'rgba(255,245,225,0.10)'); gr.addColorStop(0.15, 'rgba(0,0,0,0)');
    gr.addColorStop(0.8, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(20,10,0,${bottomDark})`);
    g.fillStyle = gr; g.fillRect(x, y, w, h);
    gr = g.createLinearGradient(x, y, x + w, y);
    gr.addColorStop(0, 'rgba(20,10,0,0.25)'); gr.addColorStop(0.06, 'rgba(0,0,0,0)');
    gr.addColorStop(0.94, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(20,10,0,0.25)');
    g.fillStyle = gr; g.fillRect(x, y, w, h);
    g.strokeStyle = 'rgba(40,25,10,0.55)'; g.lineWidth = Math.max(1, w * 0.008); g.strokeRect(x + 1, y + 1, w - 2, h - 2);
  };
  const tape = (x, y, w, h, color, alpha) => {
    g.fillStyle = color; g.globalAlpha = alpha; g.fillRect(x, y, w, h); g.globalAlpha = 1;
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(x, y, w * 0.12, h); g.fillRect(x + w * 0.85, y, w * 0.05, h);
  };
  for (let v = 0; v < 8; v++) {
    const blue = v >= 6;
    const base = blue ? (v === 6 ? '#1f5fa8' : '#2a6fbf') : kraft[v];
    const tapeCol = blue ? '#d9e6f5' : (v % 3 === 0 ? '#c9a46a' : v % 3 === 1 ? '#e8dcc2' : '#7a5a34');
    for (let sub = 0; sub < 3; sub++) {
      const [x, y] = cell(v, sub);
      g.fillStyle = base; g.fillRect(x, y, cw, ch);
      // corrugation fibres
      for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${blue ? '255,255,255' : '60,40,15'},${0.03 + r() * 0.04})`; g.fillRect(x, y + r() * ch, cw, 1 + r() * 2); }
      noise(x, y, cw, ch, blue ? 0.08 : 0.22);
      if (!blue) for (let i = 0; i < 3; i++) { g.fillStyle = `rgba(60,35,10,${0.015 + r() * 0.025})`; g.beginPath(); g.ellipse(x + r() * cw, y + r() * ch, cw * (0.05 + r() * 0.15), ch * (0.05 + r() * 0.15), r() * 3, 0, 7); g.fill(); } // scuffs/stains
      if (sub === 0) { // top: flap seam + tape along v (canvas vertical)
        g.fillStyle = 'rgba(30,18,5,0.6)'; g.fillRect(x + cw / 2 - 1, y, 2, ch);
        if (!blue || v === 7) tape(x + cw * 0.42, y, cw * 0.16, ch, tapeCol, blue ? 0.9 : 0.75);
        if (blue) { g.fillStyle = 'rgba(255,255,255,0.9)'; g.fillRect(x + cw * 0.06, y + ch * 0.1, cw * 0.25, ch * 0.3); }
        edgeShade(x, y, cw, ch, 0.2);
      } else {
        if (sub === 1 && (!blue || v === 7)) tape(x + cw * 0.42, y, cw * 0.16, ch * 0.28, tapeCol, blue ? 0.9 : 0.75);
        if (blue) { // printed case: white band, logo, label
          g.fillStyle = '#f4f6f8'; g.fillRect(x, y + ch * 0.62, cw, ch * 0.12);
          g.fillStyle = '#ffc220'; // spark-like logo
          const lx = x + cw * 0.18, ly = y + ch * 0.4;
          for (let k = 0; k < 6; k++) { g.save(); g.translate(lx, ly); g.rotate(k * Math.PI / 3); g.fillRect(-cw * 0.008, -ch * 0.16, cw * 0.016, ch * 0.1); g.restore(); }
          g.fillStyle = '#ffffff'; g.font = `bold ${ch * 0.16 | 0}px sans-serif`; g.fillText(v === 6 ? 'GREAT VALUE' : 'MAINSTAYS', x + cw * 0.3, y + ch * 0.47);
          g.fillStyle = '#123'; g.font = `${ch * 0.08 | 0}px sans-serif`; g.fillText('12 x 500 ml', x + cw * 0.06, y + ch * 0.71);
        } else { // kraft: printed handling text, label
          g.fillStyle = 'rgba(40,25,10,0.55)'; g.font = `bold ${ch * 0.09 | 0}px sans-serif`;
          g.fillText(['THIS SIDE UP', 'FRAGILE', 'ITEM 55' + v + '01', 'KEEP DRY', 'NET 12 LB', 'MADE IN USA'][(v + sub) % 6], x + cw * 0.06, y + ch * 0.8);
          if (sub === 1) { g.lineWidth = ch * 0.012; g.strokeStyle = 'rgba(40,25,10,0.5)'; g.beginPath(); g.moveTo(x + cw * 0.85, y + ch * 0.75); g.lineTo(x + cw * 0.85, y + ch * 0.45); g.moveTo(x + cw * 0.82, y + ch * 0.52); g.lineTo(x + cw * 0.85, y + ch * 0.45); g.lineTo(x + cw * 0.88, y + ch * 0.52); g.stroke(); }
        }
        if (sub === 2 || blue) { // shipping label with barcode
          const lx = x + cw * 0.6, ly = y + ch * 0.36, lw = cw * 0.3, lh = ch * 0.3;
          g.fillStyle = '#f2efe8'; g.fillRect(lx, ly, lw, lh);
          g.fillStyle = '#111'; for (let k = 0; k < 26; k++) if (r() > 0.4) g.fillRect(lx + lw * 0.08 + k * lw * 0.032, ly + lh * 0.45, lw * 0.018, lh * 0.4);
          g.fillRect(lx + lw * 0.08, ly + lh * 0.12, lw * 0.6, lh * 0.1);
        }
        edgeShade(x, y, cw, ch, 0.45);
      }
    }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}

function wrapTexture(size) { // vertical streaks + horizontal stretch bands, greyscale
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'), r = mulberry32(99);
  g.fillStyle = '#c8c8c8'; g.fillRect(0, 0, size, size);
  for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.35})`; g.fillRect(0, r() * size, size, 1 + r() * 6); }
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(120,120,120,${r() * 0.25})`; g.fillRect(r() * size, 0, 1 + r() * 3, size); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// ---- main factory ----
export function create({ scene, slots = [], quality = 'high' } = {}) {
  const hi = quality !== 'low';
  const group = new THREE.Group(); group.name = 'rackCartons';
  const N = slots.length;

  // Pass 1: deterministic layout per slot
  const plans = new Array(N); let cartonTotal = 0, wrapTotal = 0;
  const ids = new Map();
  for (let i = 0; i < N; i++) {
    const s = slots[i];
    const id = s.id ?? i; ids.set(id, i);
    const r = mulberry32(hashSeed(s.seed, i));
    const w = s.w ?? 1.2, d = s.d ?? 1.0, h = s.h ?? 1.6;
    const perLayer = 4 + Math.floor(r() * 3);   // 4..6
    let layers = 3 + Math.floor(r() * 3);       // 3..5
    const avail = Math.max(0.05, h - PALLET_H - 0.005);
    // carton height: 0.18..0.42 m, constrained so load <= avail
    let ch = 0.18 + r() * 0.24;
    if (ch * layers > avail) ch = avail / layers;
    const blue = r() < 0.15, wrapped = r() < 0.30;
    const variant = blue ? 6 + (r() < 0.5 ? 0 : 1) : Math.floor(r() * 6);
    const topMissing = (!wrapped && r() < 0.35) ? 1 + Math.floor(r() * Math.min(2, perLayer - 2)) : 0;
    const count = perLayer * layers - topMissing;
    plans[i] = { s, w, d, h, perLayer, layers, ch, blue, wrapped, variant, topMissing, count, seed: hashSeed(s.seed, i) ^ 0x5bd1e995,
      cStart: cartonTotal, wIdx: wrapped ? wrapTotal : -1, occupied: s.occupied !== false };
    cartonTotal += count; if (wrapped) wrapTotal++;
  }

  // Geometries & materials (shared within this instance)
  const palletGeo = makePalletGeometry(hi);
  const woodTex = woodTexture(hi ? 256 : 128);
  const palletMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.92, metalness: 0 });
  const cartonGeo = new THREE.BoxGeometry(1, 1, 1); cartonGeo.translate(0, 0.5, 0);
  const atlas = cartonAtlas(hi ? 2048 : 1024);
  const cartonMat = new THREE.MeshStandardMaterial({ map: atlas, roughness: 0.88, metalness: 0 });
  const offsets = new Float32Array(Math.max(1, cartonTotal) * 2);
  cartonGeo.setAttribute('atlasOffset', new THREE.InstancedBufferAttribute(offsets, 2));
  cartonMat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec2 atlasOffset;')
      .replace('#include <uv_vertex>', `#include <uv_vertex>
        { float sub = abs(normal.y) > 0.5 ? 0.0 : (abs(normal.z) > 0.5 ? 1.0 : 2.0);
          vMapUv = (uv * 0.96 + 0.02) * vec2(${(1 / ATLAS_COLS).toFixed(4)}, ${(1 / ATLAS_ROWS).toFixed(4)})
                 + atlasOffset + vec2(0.0, sub * ${(1 / ATLAS_ROWS).toFixed(4)}); }`);
  };
  cartonMat.customProgramCacheKey = () => 'rackCartonsAtlas';

  const wrapGeo = new THREE.BoxGeometry(1, 1, 1); wrapGeo.translate(0, 0.5, 0);
  const wrapTex = wrapTexture(hi ? 256 : 128);
  const wrapMat = new THREE.MeshPhysicalMaterial({
    color: 0xe8eef2, map: wrapTex, transparent: true, opacity: 0.26, roughness: 0.2, metalness: 0,
    clearcoat: 1, clearcoatRoughness: 0.1, depthWrite: false, side: THREE.FrontSide,
  });
  wrapMat.onBeforeCompile = (sh) => { // cheap fresnel: more opaque & whiter at grazing angles
    sh.fragmentShader = sh.fragmentShader.replace('#include <dithering_fragment>', `#include <dithering_fragment>
      { float fr = pow(1.0 - clamp(abs(dot(normalize(vViewPosition), normal)), 0.0, 1.0), 2.5);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.92,0.95,0.98), fr * 0.5);
        gl_FragColor.a = clamp(gl_FragColor.a + fr * 0.45, 0.0, 0.8); }`);
  };
  wrapMat.customProgramCacheKey = () => 'rackCartonsWrap';

  const pallets = new THREE.InstancedMesh(palletGeo, palletMat, Math.max(1, N));
  const cartons = new THREE.InstancedMesh(cartonGeo, cartonMat, Math.max(1, cartonTotal));
  const wraps = new THREE.InstancedMesh(wrapGeo, wrapMat, Math.max(1, wrapTotal));
  pallets.name = 'rackCartons.pallets'; cartons.name = 'rackCartons.cartons'; wraps.name = 'rackCartons.wrap';
  wraps.renderOrder = 2;
  for (const m of [pallets, cartons, wraps]) m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  pallets.count = N; cartons.count = cartonTotal; wraps.count = wrapTotal;

  // Cached "visible" matrices, used to restore instances on show
  const palletCache = new Float32Array(Math.max(1, N) * 16);
  const cartonCache = new Float32Array(Math.max(1, cartonTotal) * 16);
  const wrapCache = new Float32Array(Math.max(1, wrapTotal) * 16);

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), sc = new THREE.Vector3();
  const col = new THREE.Color(), up = new THREE.Vector3(0, 1, 0);
  const box = new THREE.Box3(), tmpV = new THREE.Vector3();
  const layouts = { 4: [[2, 2]], 5: [[2, 3]], 6: [[3, 2], [2, 3]] }; // [rows, ...] handled below

  for (let i = 0; i < N; i++) {
    const P = plans[i], s = P.s, r = mulberry32(P.seed);
    const px = s.position.x, py = s.position.y, pz = s.position.z;
    const rotY = s.rotY ?? 0, cy = Math.cos(rotY), sy = Math.sin(rotY);
    const toWorld = (lx, lz) => { p.set(px + lx * cy + lz * sy, 0, pz - lx * sy + lz * cy); return p; };
    // pallet
    q.setFromAxisAngle(up, rotY + (r() - 0.5) * 0.02);
    toWorld((r() - 0.5) * 0.02, (r() - 0.5) * 0.02); p.y = py;
    m4.compose(p, q, sc.set(P.w, 1, P.d)); m4.toArray(palletCache, i * 16);
    const wt = 0.85 + r() * 0.25; col.setRGB(wt, wt * (0.95 + r() * 0.05), wt * (0.88 + r() * 0.1));
    if (r() < 0.12) col.multiplyScalar(0.7); // older greyed pallets
    pallets.setColorAt(i, col);
    box.expandByPoint(tmpV.set(px, py, pz));
    box.expandByPoint(tmpV.set(px, py + P.h, pz));
    tmpV.set(px, py, pz); box.expandByPoint(tmpV.set(px + P.w, py, pz + P.w)); box.expandByPoint(tmpV.set(px - P.w, py, pz - P.w));

    // cartons
    const fw = P.w * 0.99, fd = P.d * 0.99; let k = P.cStart;
    const baseTone = 0.9 + r() * 0.15;
    let loadTop = 0;
    for (let L = 0; L < P.layers; L++) {
      const n = P.perLayer, flip = (L & 1) === 1;
      // cells in local (u along x, v along z); 5 = row of 2 + row of 3
      const cells = [];
      if (n === 4) { for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) cells.push([(a + 0.5) / 2, 1 / 2, (b + 0.5) / 2, 1 / 2]); }
      else if (n === 6) { for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) cells.push([(a + 0.5) / 3, 1 / 3, (b + 0.5) / 2, 1 / 2]); }
      else { const split = 0.5; for (let a = 0; a < 2; a++) cells.push([(a + 0.5) / 2, 1 / 2, split / 2, split]);
             for (let a = 0; a < 3; a++) cells.push([(a + 0.5) / 3, 1 / 3, split + (1 - split) / 2, 1 - split]); }
      let use = cells.length;
      const isTop = L === P.layers - 1;
      if (isTop && P.topMissing) use -= P.topMissing;
      const y0 = py + PALLET_H + L * P.ch;
      for (let c = 0; c < use; c++) {
        let [u, cu, v, cv] = cells[c];
        if (flip) { u = 1 - u; v = 1 - v; } // interlock-ish mirror
        const jw = 1 + (r() - 0.5) * 0.04, jd = 1 + (r() - 0.5) * 0.04, jh = 1 - r() * 0.03;
        const cwid = fw * cu * 0.965 * jw, cdep = fd * cv * 0.965 * jd, chei = P.ch * 0.985 * jh;
        const lx = (u - 0.5) * fw + (r() - 0.5) * 0.015, lz = (v - 0.5) * fd + (r() - 0.5) * 0.015;
        toWorld(lx, lz); p.y = y0;
        q.setFromEuler(e.set((r() - 0.5) * 0.008, rotY + (r() - 0.5) * 0.035, (r() - 0.5) * 0.008));
        m4.compose(p, q, sc.set(cwid, chei, cdep)); m4.toArray(cartonCache, k * 16);
        const variant = (!P.blue && r() < 0.08) ? Math.floor(r() * 6) : P.variant;
        offsets[k * 2] = (variant % 4) / ATLAS_COLS; offsets[k * 2 + 1] = ((variant >> 2) * 3) / ATLAS_ROWS;
        const t = baseTone * (0.9 + r() * 0.14) * (P.blue ? 1 : 1);
        col.setRGB(t, t * (0.97 + r() * 0.04), t * (0.93 + r() * 0.08)); cartons.setColorAt(k, col);
        k++;
      }
      loadTop = (L + 1) * P.ch;
    }
    // wrap
    if (P.wrapped) {
      toWorld(0, 0); p.y = py + PALLET_H * 0.55;
      q.setFromAxisAngle(up, rotY);
      m4.compose(p, q, sc.set(P.w * 1.012, loadTop + PALLET_H * 0.45 + 0.012, P.d * 1.012)); m4.toArray(wrapCache, P.wIdx * 16);
      const wt = 0.9 + r() * 0.1; col.setRGB(wt, wt, wt * (0.97 + r() * 0.05)); wraps.setColorAt(P.wIdx, col);
    }
  }

  // write initial state
  const zero16 = new Float32Array(16);
  const writeSlot = (i, on) => {
    const P = plans[i];
    const pa = pallets.instanceMatrix.array, ca = cartons.instanceMatrix.array, wa = wraps.instanceMatrix.array;
    if (on) {
      pa.set(palletCache.subarray(i * 16, i * 16 + 16), i * 16);
      ca.set(cartonCache.subarray(P.cStart * 16, (P.cStart + P.count) * 16), P.cStart * 16);
      if (P.wIdx >= 0) wa.set(wrapCache.subarray(P.wIdx * 16, P.wIdx * 16 + 16), P.wIdx * 16);
    } else {
      pa.fill(0, i * 16, i * 16 + 16);
      ca.fill(0, P.cStart * 16, (P.cStart + P.count) * 16);
      if (P.wIdx >= 0) wa.fill(0, P.wIdx * 16, P.wIdx * 16 + 16);
    }
  };
  for (let i = 0; i < N; i++) writeSlot(i, plans[i].occupied);
  cartons.instanceColor && (cartons.instanceColor.needsUpdate = true);

  // bounding volumes covering every slot (incl. hidden) so frustum culling is correct
  if (N) {
    box.expandByScalar(0.1);
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    for (const m of [pallets, cartons, wraps]) { m.boundingBox = box.clone(); m.boundingSphere = sphere.clone(); m.frustumCulled = true; }
  }
  group.add(pallets, cartons, wraps);
  if (scene) scene.add(group);

  // dirty tracking: single min/max range per mesh, flushed in update()
  const dirty = { p: [Infinity, -1], c: [Infinity, -1], w: [Infinity, -1] };
  const mark = (d, a, b) => { if (a < d[0]) d[0] = a; if (b > d[1]) d[1] = b; };
  let occupiedCount = 0; for (const P of plans) if (P.occupied) occupiedCount++;

  function setSlot(id, occupied) {
    const i = ids.get(id); if (i === undefined) return false;
    const P = plans[i]; occupied = !!occupied;
    if (P.occupied === occupied) return true;
    P.occupied = occupied; occupiedCount += occupied ? 1 : -1;
    writeSlot(i, occupied);
    mark(dirty.p, i, i + 1); mark(dirty.c, P.cStart, P.cStart + P.count);
    if (P.wIdx >= 0) mark(dirty.w, P.wIdx, P.wIdx + 1);
    return true;
  }
  function setSlots(map) {
    if (map instanceof Map) { for (const [k, v] of map) setSlot(k, v); }
    else for (const k in map) setSlot(ids.has(k) ? k : (ids.has(+k) ? +k : k), map[k]);
  }
  const flush = (mesh, d) => {
    if (d[1] < 0) return;
    const attr = mesh.instanceMatrix;
    if (attr.clearUpdateRanges) { attr.clearUpdateRanges(); attr.addUpdateRange(d[0] * 16, (d[1] - d[0]) * 16); }
    attr.needsUpdate = true; d[0] = Infinity; d[1] = -1;
  };
  function update(/* dt */) { flush(pallets, dirty.p); flush(cartons, dirty.c); flush(wraps, dirty.w); }
  let disposed = false;
  function dispose() {
    if (disposed) return; disposed = true; _instances.delete(api);
    group.removeFromParent();
    for (const o of [palletGeo, cartonGeo, wrapGeo, palletMat, cartonMat, wrapMat, woodTex, atlas, wrapTex]) o.dispose();
    for (const m of [pallets, cartons, wraps]) m.dispose?.();
  }
  const api = {
    group, setSlot, setSlots, update, dispose,
    count: () => occupiedCount,
    meshes: { pallets, cartons, wraps },
    stats: () => ({ slots: N, cartons: cartonTotal, wraps: wrapTotal, occupied: occupiedCount }),
  };
  _instances.add(api);
  return api;
}

export function update(dt) { for (const inst of _instances) inst.update(dt); }
export const PALLET_HEIGHT = PALLET_H;
export default { create, update };
