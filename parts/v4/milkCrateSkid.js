// Stack of black plastic milk crates (3×3 per layer) of 4-litre jugs on a milk dolly or pallet.
// opts: {seed=1, layers=5 (4..6), base:'dolly'|'pallet'|'none', blueRate=0.15, palletColor}
// Draw calls: 3 = crates (InstancedMesh: alphaTest lattice atlas + per-instance colour + per-instance stencil number),
//                 jugs (InstancedMesh: white bodies, instance-coloured caps; juice bottles fully coloured), base.
import { mergeGeos, box, cyl, rng } from './_merge.js';
import { palletGeo, PALLET } from './_pallet.js';
const S = 0.33, CH = 0.28, PITCH = 0.336, STEP = 0.272; // crate size, layout pitch, stacking step (crates nest ~8 mm)
const STENCILS = ['22/01 31', '16/01 31', '33/11 31', '09/12 31', '27/01 31', '14/11 31'];
function crateAtlas(THREE) {
  // 4 tiles (256 px each) across u. tile 0 = plain lattice side, tiles 1..3 = front faces with white stencil numbers.
  // Encoding (linear, no colour decode): plastic = (255,0,0,255), stencil paint = (255,255,0,255), hole = alpha 0.
  const T = 256, c = document.createElement('canvas'); c.width = T * 4; c.height = T; const x = c.getContext('2d');
  for (let k = 0; k < 4; k++) {
    const ox = k * T; x.fillStyle = '#ff0000'; x.fillRect(ox, 0, T, T);
    // diamond lattice in the middle band (canvas y 40..200 ~ v 0.22..0.84)
    x.save(); x.beginPath(); x.rect(ox + 14, 46, T - 28, 150); x.clip();
    for (let r = 0; r < 9; r++) for (let q = 0; q < 10; q++) {
      const cx = ox + 14 + q * 25 + (r % 2 ? 12.5 : 0), cy = 46 + r * 18.5;
      x.save(); x.translate(cx, cy); x.rotate(Math.PI / 4); x.clearRect(-7.2, -7.2, 14.4, 14.4); x.restore();
    }
    x.restore();
    // hand-hold slot under the top rim (rounded)
    x.save(); x.beginPath(); const hx = ox + 78, hy = 16, hw = 100, hh = 20; x.moveTo(hx + 10, hy); x.arcTo(hx + hw, hy, hx + hw, hy + hh, 10); x.arcTo(hx + hw, hy + hh, hx, hy + hh, 10); x.arcTo(hx, hy + hh, hx, hy, 10); x.arcTo(hx, hy, hx + hw, hy, 10); x.closePath();
    x.globalCompositeOperation = 'destination-out'; x.fill(); x.restore();
    // bottom solid band (canvas y 200..256) carries the stencil on front tiles
    if (k > 0) { x.fillStyle = '#ffff00'; x.font = 'bold 30px monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(STENCILS[(k - 1) * 2 % STENCILS.length], ox + T / 2, 226); }
  }
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; t.generateMipmaps = true; return t;
}
function crateGeo(THREE) {
  const parts = [], uvMap = (g, u0, u1, v0, v1) => { const u = g.attributes.uv; for (let i = 0; i < u.count; i++) u.setXY(i, u0 + u.getX(i) * (u1 - u0), v0 + u.getY(i) * (v1 - v0)); return g; };
  const side = (w, ry, dx, dz, tile, inset) => { const p = uvMap(new THREE.PlaneGeometry(w, CH - 0.004), tile * 0.25, tile * 0.25 + 0.25, 0, 1); if (inset) p.rotateY(Math.PI); p.rotateY(ry); p.translate(dx, CH / 2, dz); return p; };
  const h = S / 2, i = h - 0.011;
  parts.push(side(S, 0, 0, h, 1)); // outer front first: its 6 verts get front=1
  parts.push(side(S, Math.PI, 0, -h, 0), side(S, Math.PI / 2, h, 0, 0), side(S, -Math.PI / 2, -h, 0, 0));
  parts.push(side(S - 0.022, 0, 0, i, 0, 1), side(S - 0.022, Math.PI, 0, -i, 0, 1), side(S - 0.022, Math.PI / 2, i, 0, 0, 1), side(S - 0.022, -Math.PI / 2, -i, 0, 0, 1));
  const bot = uvMap(new THREE.PlaneGeometry(S - 0.02, S - 0.02), 0.04, 0.21, 0.3, 0.75); bot.rotateX(-Math.PI / 2); bot.translate(0, 0.012, 0); parts.push(bot);
  const U = { uv: [0.125, 0.985] }; // solid texel (top rim band)
  for (const [w, d, x, z] of [[S + 0.006, 0.016, 0, h - 0.005], [S + 0.006, 0.016, 0, -h + 0.005], [0.016, S + 0.006, h - 0.005, 0], [0.016, S + 0.006, -h + 0.005, 0]]) {
    parts.push(box(THREE, w, 0.022, d, x, CH - 0.011, z, U), box(THREE, w - 0.004, 0.02, d, x, 0.012, z, U), box(THREE, w - 0.004, 0.012, d, x, 0.2, z, U));
  }
  for (const sx of [1, -1]) for (const sz of [1, -1]) parts.push(box(THREE, 0.03, CH - 0.004, 0.03, sx * (h - 0.012), CH / 2, sz * (h - 0.012), U));
  for (const t of [-0.11, 0, 0.11]) parts.push(box(THREE, S - 0.024, 0.016, 0.012, 0, 0.01, t, U), box(THREE, 0.012, 0.016, S - 0.024, t, 0.01, 0, U));
  const g = mergeGeos(THREE, parts), n = g.attributes.position.count, f = new Float32Array(n); for (let k = 0; k < 6; k++) f[k] = 1;
  g.setAttribute('front', new THREE.BufferAttribute(f, 1)); return g;
}
function jugGeo(THREE) {
  const prof = [[0, 0], [0.064, 0], [0.069, 0.012], [0.069, 0.165], [0.058, 0.2], [0.03, 0.224], [0.02, 0.232], [0.022, 0.233], [0.022, 0.252], [0, 0.252]].map(([a, b]) => new THREE.Vector2(a, b));
  const g = new THREE.LatheGeometry(prof, 8); g.rotateY(Math.PI / 8); g.scale(1.03, 1, 1.03);
  const NP = prof.length, m = new Float32Array(g.attributes.position.count); for (let i = 0; i < m.length; i++) m[i] = (i % NP) >= 7 ? 1 : 0;
  g.setAttribute('capMask', new THREE.BufferAttribute(m, 1)); return g;
}
export function build(THREE, mats, opts = {}) {
  const seed = opts.seed ?? 1, r = rng(seed * 7717 + 31), L = Math.max(4, Math.min(6, Math.round(opts.layers ?? 5))), base = opts.base ?? 'dolly';
  const blueRate = opts.blueRate ?? 0.15, g = new THREE.Group();
  // --- base
  let baseH = 0, baseMesh = null;
  if (base === 'pallet') {
    baseMesh = new THREE.Mesh(palletGeo(THREE, seed, undefined, opts.palletColor), mats.woodVC || new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82 })); baseH = PALLET.h;
  } else if (base === 'dolly') {
    const P = [], FR = '#2b2d30', RB = '#18181a', ST = '#8d9297', W = 1.04, top = 0.135;
    P.push(box(THREE, W, 0.03, W, 0, top - 0.015, 0, { c: FR }));
    for (let i = 0; i < 7; i++) P.push(box(THREE, W - 0.04, 0.012, 0.04, 0, top + 0.004, -W / 2 + 0.08 + i * (W - 0.16) / 6, { c: '#222326' }));
    for (const s of [1, -1]) P.push(box(THREE, W, 0.05, 0.04, 0, top - 0.035, s * (W / 2 - 0.02), { c: FR }), box(THREE, 0.04, 0.05, W, s * (W / 2 - 0.02), top - 0.035, 0, { c: FR }));
    for (const sx of [1, -1]) for (const sz of [1, -1]) {
      const x = sx * (W / 2 - 0.09), z = sz * (W / 2 - 0.09);
      P.push(box(THREE, 0.1, 0.008, 0.1, x, top - 0.064, z, { c: ST }), box(THREE, 0.008, 0.06, 0.05, x - 0.022, 0.06, z, { c: ST }), box(THREE, 0.008, 0.06, 0.05, x + 0.022, 0.06, z, { c: ST }));
      P.push(cyl(THREE, 0.045, 0.045, 0.032, 14, x, 0.045, z, { rz: Math.PI / 2, c: RB }), cyl(THREE, 0.018, 0.018, 0.036, 8, x, 0.045, z, { rz: Math.PI / 2, c: ST }));
    }
    baseMesh = new THREE.Mesh(mergeGeos(THREE, P), mats.vc || new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62 })); baseH = top + 0.01;
  }
  if (baseMesh) { baseMesh.name = 'base'; baseMesh.castShadow = baseMesh.receiveShadow = true; g.add(baseMesh); }
  // --- crates
  const atlas = crateAtlas(THREE), N = 9 * L;
  const crateM = new THREE.MeshStandardMaterial({ map: atlas, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.58, metalness: 0 });
  crateM.onBeforeCompile = (sh) => {
    sh.vertexShader = 'attribute float front;\nattribute float stencilIdx;\n' + sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n#ifdef USE_MAP\n vMapUv.x += front * stencilIdx * 0.25;\n#endif');
    sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', '#ifdef USE_MAP\n vec4 sampledDiffuseColor = texture2D( map, vMapUv );\n diffuseColor.a *= sampledDiffuseColor.a;\n float stencilAmt = sampledDiffuseColor.g;\n#else\n float stencilAmt = 0.0;\n#endif')
      .replace('#include <color_fragment>', '#include <color_fragment>\n diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.80), stencilAmt);');
  };
  crateM.customProgramCacheKey = () => 'milkCrateAtlas';
  const cGeo = crateGeo(THREE), sIdx = new Float32Array(N);
  const crates = new THREE.InstancedMesh(cGeo, crateM, N); crates.name = 'crates';
  crates.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: atlas, alphaTest: 0.5 });
  const jGeo = jugGeo(THREE), NJ = N * 4, whole = new Float32Array(NJ);
  const jugM = new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0 });
  jugM.onBeforeCompile = (sh) => {
    sh.vertexShader = 'attribute float capMask;\nattribute float whole;\n' + sh.vertexShader.replace('#include <color_vertex>', '#ifdef USE_INSTANCING_COLOR\n vColor = mix(mix(vec3(0.86, 0.87, 0.85), instanceColor.xyz, capMask), instanceColor.xyz * (1.0 - 0.35 * capMask), whole);\n#endif');
  };
  jugM.customProgramCacheKey = () => 'milkJugCap';
  const jugs = new THREE.InstancedMesh(jGeo, jugM, NJ); jugs.name = 'jugs';
  const CAPS = ['#c8202e', '#1f5fbf', '#2e8b3e', '#6b2f86'], JUICE = ['#e8891c', '#f0a21e', '#6a2c7a', '#3a6fc4'];
  const M = new THREE.Matrix4(), Mj = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3(1, 1, 1), col = new THREE.Color();
  let k = 0, j = 0;
  for (let l = 0; l < L; l++) for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
    const x = (a - 1) * PITCH + (r() - 0.5) * 0.012, z = (b - 1) * PITCH + (r() - 0.5) * 0.012, y = baseH + l * STEP;
    e.set(0, (r() - 0.5) * 0.035, 0); q.setFromEuler(e); M.compose(v.set(x, y, z), q, sc.set(1, 1, 1)); crates.setMatrixAt(k, M);
    const blue = r() < blueRate; col.set(blue ? '#1f47a8' : '#1b1b1d'); col.offsetHSL(0, 0, (r() - 0.5) * 0.02); crates.setColorAt(k, col);
    sIdx[k] = Math.floor(r() * 3); k++;
    const juice = r() < 0.3, cap = CAPS[Math.floor(r() * CAPS.length)], jc = JUICE[Math.floor(r() * JUICE.length)];
    for (let u = 0; u < 4; u++) {
      const ox = (u % 2 ? 1 : -1) * 0.074, oz = (u < 2 ? 1 : -1) * 0.074, s = juice ? 0.82 : 1;
      e.set(0, (r() - 0.5) * 0.3, 0); q.setFromEuler(e); Mj.compose(v.set(ox + (r() - 0.5) * 0.006, 0.013, oz + (r() - 0.5) * 0.006), q, sc.set(s, juice ? 0.95 : 1, s)); Mj.premultiply(M);
      jugs.setMatrixAt(j, Mj); col.set(juice ? jc : cap); jugs.setColorAt(j, col); whole[j] = juice ? 1 : 0; j++;
    }
  }
  cGeo.setAttribute('stencilIdx', new THREE.InstancedBufferAttribute(sIdx, 1));
  jGeo.setAttribute('whole', new THREE.InstancedBufferAttribute(whole, 1));
  crates.castShadow = crates.receiveShadow = true; jugs.castShadow = jugs.receiveShadow = true;
  crates.instanceMatrix.needsUpdate = jugs.instanceMatrix.needsUpdate = true; crates.computeBoundingSphere(); jugs.computeBoundingSphere();
  g.add(crates, jugs);
  const H = baseH + (L - 1) * STEP + CH, W = base === 'pallet' ? 1.22 : base === 'dolly' ? 1.04 : 3 * PITCH;
  g.userData = { name: 'milkCrateSkid', dims: { w: +W.toFixed(3), h: +H.toFixed(3), d: base === 'pallet' ? 1.02 : +W.toFixed(3) }, pivots: {}, drawCalls: baseMesh ? 3 : 2, layers: L, base, crate: { w: S, h: CH, step: STEP } };
  return g;
}
export default build;
