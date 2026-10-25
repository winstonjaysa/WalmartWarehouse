/**
 * GateFlow post-FX + brand-colour + light rig (Three.js r160, plain ES module; needs importmap 'three' + 'three/addons/').
 * Fixes QA B12 (composer chain: Render -> GTAO -> ink outline -> SMAA -> Output) and B10 (brand colours true to hex).
 *
 *   import { create, applyLighting, markBrand, markBrandDecals, pickQuality } from './parts/postfx/postfx.js';
 *   applyLighting(scene, renderer, { center: [x, z], halfW: 75, halfD: 70 });
 *   const fx = create(renderer, scene, camera, { quality: pickQuality(renderer), outlineObjects: [truck, forklift, worker] });
 *   fx.markBrand(truck.userData.parts.logoRight);   // or markBrandDecals(scene)
 *   loop: fx.render(dt);   resize: fx.setSize(innerWidth, innerHeight);
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';

export const BRAND = { blue: '#0071CE', spark: '#FFC220', navy: '#041E42' };
export const OUTLINE_LAYER = 7;
export const EXPOSURE = 1.0;    // tuned with applyLighting(): clay reads bright, whites hold detail

/* ------------------------------------------------------------------ quality */
export function glInfo(renderer) {
  try {
    const gl = renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
    const name = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    return { name, weak: /swiftshader|llvmpipe|softpipe|software|basic render/i.test(name) };
  } catch (e) { return { name: 'unknown', weak: false }; }
}
/** ?q=low|med|high wins; else 'low' on SwiftShader/llvmpipe; else 'med' on small/mobile screens; else 'high'. */
export function pickQuality(renderer) {
  const q = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('q') : null;
  if (q === 'low' || q === 'med' || q === 'high') return q;
  if (renderer && glInfo(renderer).weak) return 'low';
  if (typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches) return 'med';
  return 'high';
}
const TIERS = {
  high: { pr: 2, ao: true, aoSamples: 16, outline: true, smaa: true },
  med: { pr: 1, ao: true, aoSamples: 8, outline: true, smaa: true },
  low: { pr: 1, ao: false, outline: false, smaa: false },
};

/* ------------------------------------------------------------------ brand colour (B10) */
// Shared uniforms: when the composer is active the scene is rendered linear into a HalfFloat target and ACES is applied
// later by OutputPass to every pixel, so material.toneMapped=false alone does nothing. Brand materials therefore
// pre-apply the exact inverse of three's ACESFilmicToneMapping (+ exposure) so OutputPass lands on the source hex.
// In direct rendering ('low') uInvACES=0 and toneMapped=false bypasses ACES -> also exact.
const brandU = { uInvACES: { value: 0 }, uExposure: { value: 1 } };
const INV_ACES_GLSL = /* glsl */`
uniform float uInvACES; uniform float uExposure;
vec3 gfInvFit(vec3 y) { y = clamp(y, 0.0, 1.0);
  vec3 A = 0.983729 * y - 1.0, B = 0.4329510 * y - 0.0245786, C = 0.238081 * y + 0.000090537;
  return (-B - sqrt(max(B * B - 4.0 * A * C, 0.0))) / (2.0 * A); }
vec3 gfInvACES(vec3 c) {
  const mat3 IN = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));
  const mat3 OUT = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));
  vec3 y = inverse(OUT) * c; vec3 x = gfInvFit(y); x = inverse(IN) * x;
  return x * 0.6 / uExposure; }   // may go slightly negative (e.g. #FFC220 needs B<0): fine in the HalfFloat target
`;
const _brandCache = new WeakMap();
const _litCache = new WeakMap();
function injectInvACES(m) {
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, brandU);
    sh.fragmentShader = INV_ACES_GLSL + sh.fragmentShader.replace('#include <opaque_fragment>',
      '#include <opaque_fragment>\n if (uInvACES > 0.5) gl_FragColor.rgb = gfInvACES(gl_FragColor.rgb);');
  };
  m.customProgramCacheKey = () => 'gfBrand' + m.type;
  m.userData.gfBrand = true; return m;
}
function brandMaterial(src, lit = false) {
  if (src.userData && src.userData.gfBrand) return src;
  if (lit) {   // keep shading (clay form) but make the composer path match the direct toneMapped:false path
    if (_litCache.has(src)) return _litCache.get(src);
    const m = injectInvACES(src.clone()); m.toneMapped = false; m.name = (src.name || 'mat') + ':brandLit'; _litCache.set(src, m); return m;
  }
  if (_brandCache.has(src)) return _brandCache.get(src);
  const m = new THREE.MeshBasicMaterial({
    color: src.color ? src.color.clone() : 0xffffff, map: src.map || null, transparent: src.transparent, opacity: src.opacity,
    alphaTest: src.alphaTest, side: src.side, depthWrite: src.depthWrite, depthTest: src.depthTest,
    polygonOffset: src.polygonOffset, polygonOffsetFactor: src.polygonOffsetFactor, polygonOffsetUnits: src.polygonOffsetUnits,
    toneMapped: false, fog: true,
  });
  m.name = (src.name || 'mat') + ':brand'; injectInvACES(m);
  _brandCache.set(src, m); return m;
}
/**
 * Make a material / mesh / group render brand-true. Default: unlit MeshBasic, toneMapped:false, ACES-compensated under
 * the composer -> exact hex. { lit: true }: keep the lit material (shaded clay) but toneMapped:false + compensated, so the
 * composer path looks the same as direct rendering. Returns the (new) material for a material input, else x.
 */
export function markBrand(x, o = {}) {
  if (!x) return x;
  const f = (m) => brandMaterial(m, !!o.lit);
  if (x.isMaterial) return f(x);
  x.traverse?.((n) => { if (n.isMesh) n.material = Array.isArray(n.material) ? n.material.map(f) : f(n.material); });
  return x;
}
/**
 * Convenience for parts/models.js content: textured toneMapped:false decals (wordmarks, sparks, labels) -> unlit exact;
 * untextured toneMapped:false solids (brand-blue bodies, spark-yellow trims) -> lit + compensated ({lit:true}).
 */
export function markBrandDecals(root, { solids = true } = {}) {
  const hits = [];
  root.traverse((o) => { const m = o.material;
    if (!o.isMesh || Array.isArray(m) || m.toneMapped !== false || m.userData.gfBrand) return;
    if (m.map) { markBrand(o); hits.push(o); } else if (solids) { markBrand(o, { lit: true }); } });
  return hits;
}

/* ------------------------------------------------------------------ light rig (B10 / M5 / M6) */
/**
 * Hemisphere + key sun with a tight shadow frustum (texel = 2*half/mapSize; defaults 150x140 m on 4096 -> 3.7 cm).
 * Returns { hemi, sun, fill, fitShadow(cx, cz, halfW, halfD), texelCm }. Call fitShadow to follow the active area
 * (it snaps to whole texels, so moving the frustum does not shimmer).
 */
export function applyLighting(scene, renderer, o = {}) {
  const low = o.quality === 'low';
  const map = o.mapSize ?? (low ? 2048 : 4096);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = low ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = o.exposure ?? EXPOSURE;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  if (o.removeExisting !== false) scene.children.filter((c) => c.isLight).forEach((l) => scene.remove(l));
  const hemi = new THREE.HemisphereLight(0xf4f8ff, 0xb4bcc8, o.hemi ?? 0.9);
  const sun = new THREE.DirectionalLight(0xfff1de, o.sun ?? 2.8);
  const dir = new THREE.Vector3(...(o.sunDir ?? [-0.42, 0.82, 0.38])).normalize();
  sun.castShadow = true; sun.shadow.mapSize.set(map, map);
  sun.shadow.bias = -0.00025; sun.shadow.normalBias = 0.02; sun.shadow.radius = low ? 1 : 3;
  const fill = new THREE.DirectionalLight(0xdfe9ff, o.fill ?? 0.2); fill.position.set(90, 60, -80);
  scene.add(hemi, sun, sun.target, fill);
  const sc = sun.shadow.camera, dist = 160;
  function fitShadow(cx = 0, cz = 0, halfW = 75, halfD = 70) {
    const texel = (2 * Math.max(halfW, halfD)) / map;
    cx = Math.round(cx / texel) * texel; cz = Math.round(cz / texel) * texel;
    Object.assign(sc, { left: -halfW, right: halfW, top: halfD, bottom: -halfD, near: dist - 120, far: dist + 120 });
    sc.updateProjectionMatrix();
    sun.target.position.set(cx, 0, cz); sun.position.set(cx + dir.x * dist, dir.y * dist, cz + dir.z * dist);
    sun.target.updateMatrixWorld(); api.texelCm = texel * 100; return api.texelCm;
  }
  const api = { hemi, sun, fill, fitShadow, texelCm: 0 };
  const c = o.center ?? [-5, 10];
  fitShadow(c[0], c[1], o.halfW ?? 75, o.halfD ?? 70);
  return api;
}

/* ------------------------------------------------------------------ ink outline pass */
const InkShader = {
  uniforms: { tDiffuse: { value: null }, tDepth: { value: null }, tNormal: { value: null }, tMask: { value: null }, tMaskDepth: { value: null },
    resolution: { value: new THREE.Vector2(1, 1) }, near: { value: 1 }, far: { value: 3000 }, px: { value: 1 },
    inkColor: { value: new THREE.Color(0x1a2130) }, strength: { value: 0.85 }, useMask: { value: 1 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: /* glsl */`
#include <packing>
uniform sampler2D tDiffuse, tDepth, tNormal, tMask, tMaskDepth; uniform vec2 resolution; uniform float near, far, px, strength, useMask; uniform vec3 inkColor;
varying vec2 vUv;
float vz(vec2 uv){ return -perspectiveDepthToViewZ(texture2D(tDepth, uv).x, near, far); }
vec3 nrm(vec2 uv){ return texture2D(tNormal, uv).xyz * 2.0 - 1.0; }
float vis(vec2 uv){ if (useMask < 0.5) return 1.0; float m = texture2D(tMask, uv).r; return (m > 0.5 && texture2D(tMaskDepth, uv).x <= texture2D(tDepth, uv).x + 1e-6) ? 1.0 : 0.0; }
void main(){
  vec4 c = texture2D(tDiffuse, vUv);
  float vc = vis(vUv);
  if (vc < 0.5) { gl_FragColor = c; return; }
  vec2 t = px / resolution; float zc = vz(vUv); vec3 nc = nrm(vUv); float e = 0.0;
  vec2 o[4]; o[0] = vec2(t.x,0.); o[1] = vec2(-t.x,0.); o[2] = vec2(0.,t.y); o[3] = vec2(0.,-t.y);
  for (int i = 0; i < 4; i++) { vec2 uv = vUv + o[i]; float zn = vz(uv);
    float de = smoothstep(0.012, 0.03, (zn - zc) / zc);              // only the nearer side inks -> 1px inner line
    float ne = smoothstep(0.35, 0.6, 1.0 - dot(nc, nrm(uv))) * step(abs(zn - zc) / zc, 0.05);
    float me = (useMask > 0.5) ? 1.0 - vis(uv) : 0.0;
    e = max(e, max(de, max(ne * 0.7, me))); }
  gl_FragColor = vec4(mix(c.rgb, inkColor, e * strength), c.a);
}`,
};
class InkPass extends Pass {
  constructor(scene, camera, gtao) {
    super(); this.scene = scene; this.camera = camera; this.gtao = gtao; this.objects = new Set();
    this.material = new THREE.ShaderMaterial({ ...InkShader, uniforms: THREE.UniformsUtils.clone(InkShader.uniforms), depthTest: false, depthWrite: false });
    this.fsQuad = new FullScreenQuad(this.material);
    this.maskRT = new THREE.WebGLRenderTarget(1, 1, { depthTexture: new THREE.DepthTexture(1, 1) });
    this.maskMat = new THREE.MeshBasicMaterial({ color: 0xffffff }); this.pixelRatio = 1;
  }
  add(obj) { this.objects.add(obj); obj.traverse((o) => o.layers.enable(OUTLINE_LAYER)); }
  setSize(w, h) { this.maskRT.setSize(w, h); this.material.uniforms.resolution.value.set(w, h); }
  render(renderer, writeBuffer, readBuffer) {
    const u = this.material.uniforms, useMask = this.objects.size > 0;
    if (useMask) {   // silhouette mask of outlined objects (own depth, compared with scene depth for occlusion)
      const bg = this.scene.background, fog = this.scene.fog, ov = this.scene.overrideMaterial, mask = this.camera.layers.mask, cc = renderer.getClearColor(new THREE.Color()), ca = renderer.getClearAlpha();
      this.scene.background = null; this.scene.fog = null; this.scene.overrideMaterial = this.maskMat; this.camera.layers.set(OUTLINE_LAYER);
      renderer.setRenderTarget(this.maskRT); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(this.scene, this.camera);
      this.scene.background = bg; this.scene.fog = fog; this.scene.overrideMaterial = ov; this.camera.layers.mask = mask; renderer.setClearColor(cc, ca);
    }
    u.tDiffuse.value = readBuffer.texture; u.tDepth.value = this.gtao.depthTexture; u.tNormal.value = this.gtao.normalTexture;
    u.tMask.value = this.maskRT.texture; u.tMaskDepth.value = this.maskRT.depthTexture; u.useMask.value = useMask ? 1 : 0;
    u.near.value = this.camera.near; u.far.value = this.camera.far; u.px.value = Math.max(1, this.pixelRatio * 0.75);
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer); this.fsQuad.render(renderer);
  }
  dispose() { this.material.dispose(); this.fsQuad.dispose(); this.maskRT.dispose(); this.maskMat.dispose(); }
}

/* ------------------------------------------------------------------ composer */
/**
 * create(renderer, scene, camera, { quality, outlineObjects, ao: {radius,...}, ink: {color, strength} })
 * -> { render(dt), setSize(w,h), setQuality(q), addOutline(obj), markBrand(x), dispose(), quality, composer, passes }
 */
export function create(renderer, scene, camera, opts = {}) {
  let quality = opts.quality || pickQuality(renderer);
  let composer = null, passes = {}, W = 0, H = 0;
  const outlined = new Set(opts.outlineObjects || []);
  const size = () => { const v = renderer.getSize(new THREE.Vector2()); return [W || v.x, H || v.y]; };

  function build() {
    teardown();
    const T = TIERS[quality] || TIERS.high, [w, h] = size();
    renderer.setPixelRatio(Math.min(typeof devicePixelRatio !== 'undefined' ? devicePixelRatio : 1, T.pr));
    renderer.setSize(w, h, false);
    brandU.uExposure.value = renderer.toneMappingExposure;
    if (quality === 'low') { brandU.uInvACES.value = 0; return; }    // direct render: renderer applies ACES + sRGB once
    brandU.uInvACES.value = renderer.toneMapping === THREE.ACESFilmicToneMapping ? 1 : 0;
    const pr = renderer.getPixelRatio();
    const rt = new THREE.WebGLRenderTarget(w * pr, h * pr, { type: THREE.HalfFloatType, samples: 0 });
    composer = new EffectComposer(renderer, rt);
    composer.addPass(passes.render = new RenderPass(scene, camera));
    if (T.ao) {
      const ao = passes.ao = new GTAOPass(scene, camera, w * pr, h * pr, {});
      ao.updateGtaoMaterial({ radius: 0.6, distanceExponent: 1.5, thickness: 1.0, scale: 1.0, samples: T.aoSamples, distanceFallOff: 1.0, screenSpaceRadius: false, ...(opts.ao || {}) });
      ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: T.aoSamples });
      ao.blendIntensity = opts.aoIntensity ?? 0.75;
      composer.addPass(ao);
      if (T.outline) {
        const ink = passes.ink = new InkPass(scene, camera, ao); ink.pixelRatio = pr;
        if (opts.ink?.color !== undefined) ink.material.uniforms.inkColor.value.set(opts.ink.color);
        if (opts.ink?.strength !== undefined) ink.material.uniforms.strength.value = opts.ink.strength;
        outlined.forEach((o) => ink.add(o)); composer.addPass(ink);
      }
    }
    if (T.smaa) composer.addPass(passes.smaa = new SMAAPass(w * pr, h * pr));
    composer.addPass(passes.output = new OutputPass());               // the ONLY place ACES + sRGB happen
    composer.setPixelRatio(pr); composer.setSize(w, h);
  }
  function teardown() {
    if (!composer) return;
    for (const p of composer.passes) p.dispose?.();
    composer.renderTarget1.dispose(); composer.renderTarget2.dispose(); composer = null; passes = {};
  }
  const api = {
    get quality() { return quality; }, get composer() { return composer; }, get passes() { return passes; },
    render(dt) { brandU.uExposure.value = renderer.toneMappingExposure; if (composer) composer.render(dt); else renderer.render(scene, camera); },
    setSize(w, h) { W = w; H = h; renderer.setSize(w, h, false); if (composer) { composer.setSize(w, h); passes.ink?.setSize(w * renderer.getPixelRatio(), h * renderer.getPixelRatio()); } },
    setQuality(q) { if (!TIERS[q] || q === quality) return; quality = q; build(); },
    addOutline(obj) { outlined.add(obj); passes.ink?.add(obj); return obj; },
    markBrand,
    dispose() { teardown(); },
  };
  build();
  if (passes.ink) { const pr = renderer.getPixelRatio(), [w, h] = size(); passes.ink.setSize(w * pr, h * pr); }
  return api;
}
export default { create, applyLighting, markBrand, markBrandDecals, pickQuality, glInfo, BRAND, EXPOSURE };
