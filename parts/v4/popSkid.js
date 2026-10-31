// Mixed beverage (pop) skid: pallet + 4 tiers of shrink-wrapped 24/12-packs, cans as one InstancedMesh. opts: {seed, tiers=1, bottles=true}
import { mergeGeos, box, rng } from './_merge.js';
import { palletGeo, PALLET } from './_pallet.js';
const FLAV = ["#c3c8cf", "#1f9a9a", "#e8771c", "#8cc63f", "#c3c8cf", "#c8202e", "#1f9a9a", "#20324f", "#e8771c"];
function canTexture(THREE) {
  const c = document.createElement('canvas'); c.width = 16; c.height = 256; const x = c.getContext('2d');
  // lathe v: 0 bottom-centre .. 1 top-centre (canvas y inverted)
  const band = (v0, v1, col) => { x.fillStyle = col; x.fillRect(0, (1 - v1) * 256, 16, (v1 - v0) * 256); };
  band(0, 0.29, '#9a9a9a'); band(0.29, 0.43, '#ffffff'); band(0.33, 0.35, '#2a2a2a'); band(0.385, 0.40, '#f4f4f4'); band(0.36, 0.385, '#bdbdbd');
  band(0.43, 0.6, '#d9dcdf'); band(0.6, 0.72, '#f2f3f4'); band(0.72, 0.86, '#a9adb2'); band(0.86, 1, '#c9ccd0');
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function build(THREE, mats, opts = {}) {
  const r = rng((opts.seed ?? 3) * 7919 + 5), tiers = opts.tiers ?? 1, g = new THREE.Group();
  const woodM = mats.woodVC || new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true });
  const shrinkM = mats.shrink || mats.wrap || new THREE.MeshPhysicalMaterial({ color: 0xf4f8fb, transparent: true, opacity: 0.22, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide });
  const D = 0.066, CH = 0.122, TRAY = 0.004, PH = CH + TRAY + 0.004, SHEET = 0.004;
  const prof = [[0, 0], [0.026, 0], [0.0325, 0.009], [0.033, 0.106], [0.027, 0.119], [0.026, 0.122], [0.022, 0.1205], [0, 0.119]].map(([a, b]) => new THREE.Vector2(a, b));
  const canGeo = new THREE.LatheGeometry(prof, 14), NP = prof.length, mask = new Float32Array(canGeo.attributes.position.count);
  for (let i = 0; i < mask.length; i++) { const j = i % NP; mask[i] = j >= 1 && j <= 3 ? 1 : 0; }
  canGeo.setAttribute('bodyMask', new THREE.BufferAttribute(mask, 1));
  const canM = new THREE.MeshStandardMaterial({ map: canTexture(THREE), metalness: 0.5, roughness: 0.28, envMapIntensity: 1.3 });
  canM.onBeforeCompile = (sh) => {
    sh.vertexShader = 'attribute float bodyMask;\n' + sh.vertexShader.replace('#include <color_vertex>', '#ifdef USE_INSTANCING_COLOR\n vColor = mix(vec3(1.0), instanceColor.xyz, bodyMask);\n#endif\n vBodyMask = bodyMask;').replace('void main() {', 'varying float vBodyMask;\nvoid main() {');
    // silver top/rim/base (mask 0): polished aluminium; printed body (mask 1): keeps material roughness/metalness
    sh.fragmentShader = 'varying float vBodyMask;\n' + sh.fragmentShader.replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\n roughnessFactor = mix(0.25, roughnessFactor, vBodyMask);\n metalnessFactor = mix(0.8, metalnessFactor, vBodyMask);');
  };
  canM.customProgramCacheKey = () => 'canSilverTopShiny';
  const cans = [], wood = [palletGeo(THREE, (opts.seed ?? 3) + 2, ['#c98a5a', '#b9774a', '#d29a66', '#a86a40'], opts.palletColor)], film = [];
  // column layout across x (each column one pack type), packs along z
  const cols = [[4, 6], [4, 6], [3, 4], [4, 6], [3, 4]]; // [cans across x, cans along z]
  let y = PALLET.h; const blk = [];
  for (let t = 0; t < tiers; t++) {
    wood.push(box(THREE, 1.2, SHEET, 1.0, 0, y + SHEET / 2, 0, { c: '#b89466', uv: [0.1, 0.5] }));
    y += SHEET;
    const order = t % 2 ? [...cols].reverse() : cols;
    let x = -1.188 / 2;
    order.forEach(([nx, nz], ci) => {
      const colW = nx * D; let z = -0.495;
      const seq = []; let rem = 0.99;
      while (rem >= nz * D - 1e-6) { seq.push(nz); rem -= nz * D; }
      if (rem >= 3 * D - 1e-6) seq.push(Math.floor(rem / D + 1e-6));
      seq.forEach((nzz, pi) => {
        const flav = FLAV[(t * 3 + ci * 2 + (pi > 1 ? 1 : 0) + (opts.seed ?? 3)) % FLAV.length];
        if (opts.bottles !== false && t === tiers - 1 && ((ci === 0 && pi < 2) || (ci === 1 && pi === 0))) { blk.push([x + (colW - 0.208) / 2, z + (nzz * D - 0.312) / 2, y]); z += nzz * D; return; } // 2L 6-packs in-layer, one corner
        if (r() < 0.04 && t === tiers - 1) { z += nzz * D; return; } // occasional missing pack on top
        const pw = colW, pd = nzz * D, cx = x + pw / 2, cz = z + pd / 2;
        wood.push(box(THREE, pw - 0.002, TRAY, pd - 0.002, cx, y + TRAY / 2, cz, { c: '#a88a62', uv: [0.1, 0.5] }));
        for (let i = 0; i < nx; i++) for (let k = 0; k < nzz; k++) cans.push([x + D / 2 + i * D, y + TRAY, z + D / 2 + k * D, flav]);
        film.push(box(THREE, pw + 0.003, CH + 0.006, pd + 0.003, cx, y + TRAY + CH / 2 + 0.001, cz));
        if (t === tiers - 1) { const lx = cx + (r() - 0.5) * (pw - 0.09), lz = cz + (r() - 0.5) * (pd - 0.07), ry = (r() - 0.5) * 0.5; // white barcode label per pack
          wood.push(box(THREE, 0.075, 0.0015, 0.05, lx, y + TRAY + CH + 0.0055, lz, { ry, c: '#f7f7f3', uv: [0.02, 0.02] }), box(THREE, 0.05, 0.0015, 0.018, lx, y + TRAY + CH + 0.0062, lz, { ry, c: '#2a2a2a', uv: [0.02, 0.02] })); }
        z += pd;
      });
      x += colW;
    });
    y += PH;
  }
  // stickers on random top-tier packs + side faces
  const yTop = y;
  for (let i = 0; i < 0; i++) wood.push(box(THREE, 0.07, 0.002, 0.045, -0.5 + r() * 1.0, yTop + 0.002, -0.45 + r() * 0.9, { ry: (r() - 0.5) * 0.6, c: '#ff7a1a', uv: [0.02, 0.02] }));
  for (let i = 0; i < 5; i++) wood.push(box(THREE, 0.06, 0.04, 0.002, -0.5 + r() * 1.0, PALLET.h + 0.06 + Math.floor(r() * tiers) * PH, 0.497, { c: i % 2 ? '#ff7a1a' : '#ffffff', uv: [0.02, 0.02] }));
  // 2L bottle 6-pack blocks (2x3 bottles) sitting in the top layer at one corner
  let maxY = yTop;
  if (opts.bottles !== false) {
    const BR = 0.052, BHt = 0.33, colors = ['#151517', '#1c1a18', '#121214', '#1a1c1e'];
    blk.forEach(([bx, bz, by0], bi) => {
      const c = colors[bi % colors.length];
      for (let lvl = 0; lvl < 1; lvl++) {
        const by = by0;
        for (let i = 0; i < 2; i++) for (let k = 0; k < 3; k++) {
          const lg = new THREE.LatheGeometry([[0, 0], [BR * 0.85, 0], [BR, 0.02], [BR, 0.2], [BR * 0.6, 0.27], [0.016, 0.31], [0.016, BHt], [0, BHt]].map(([a, b]) => new THREE.Vector2(a, b)), 10);
          lg.translate(bx + BR + i * 2 * BR, by, bz + BR + k * 2 * BR);
          const uv = lg.attributes.uv; for (let q = 0; q < uv.count; q++) uv.setXY(q, 0.02, 0.02);
          const col = new Float32Array(lg.attributes.position.count * 3), cc = new THREE.Color(c), cap = new THREE.Color('#2a2a2c'), lab = new THREE.Color(bi % 2 ? '#3d3d40' : '#7a1420');
          const pp = lg.attributes.position; for (let q = 0; q < pp.count; q++) { const yy = pp.getY(q) - by; const cl = yy > 0.3 ? cap : yy > 0.1 && yy < 0.19 ? lab : cc; col.set([cl.r, cl.g, cl.b], q * 3); }
          lg.setAttribute('color', new THREE.BufferAttribute(col, 3)); wood.push(lg);
        }
        film.push(box(THREE, 4 * BR + 0.006, BHt * 0.72, 6 * BR + 0.006, bx + BR, by + BHt * 0.36, bz + 2 * BR));
        maxY = Math.max(maxY, by + BHt);
      }
    });
  }
  const im = new THREE.InstancedMesh(canGeo, canM, cans.length), m4 = new THREE.Matrix4(), col = new THREE.Color();
  cans.forEach(([x, yy, z, f], i) => { m4.makeRotationY(r() * 6.28); m4.setPosition(x, yy, z); im.setMatrixAt(i, m4); col.set(f); im.setColorAt(i, col); });
  im.instanceMatrix.needsUpdate = true; im.castShadow = im.receiveShadow = true; im.name = 'cans';
  const pal = new THREE.Mesh(mergeGeos(THREE, wood), woodM); pal.name = 'pallet'; pal.castShadow = pal.receiveShadow = true;
  const shr = new THREE.Mesh(mergeGeos(THREE, film), shrinkM); shr.name = 'shrink'; shr.renderOrder = 2;
  g.add(pal, im, shr);
  g.userData = { name: 'popSkid', dims: { w: 1.22, h: +maxY.toFixed(3), d: 1.02 }, pivots: {}, drawCalls: 3, canCount: cans.length };
  return g;
}
