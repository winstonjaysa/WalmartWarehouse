# parts/postfx — composer chain (QA B12) + brand colour & light rig (QA B10)

`postfx.js` is a standalone ES module for Three.js r160. It uses the app importmap (`three`, `three/addons/`). It does not edit `walmart-dc.html`.

## API
```js
import { create, applyLighting, markBrand, markBrandDecals, pickQuality, glInfo, BRAND, EXPOSURE } from './parts/postfx/postfx.js';

const rig = applyLighting(scene, renderer, { quality, center:[x,z], halfW:75, halfD:70 /*, exposure, hemi, sun, fill, mapSize, sunDir, removeExisting */ });
//  -> { hemi, sun, fill, fitShadow(cx, cz, halfW, halfD) -> texelCm, texelCm }
const fx = create(renderer, scene, camera, { quality: pickQuality(renderer), outlineObjects: [trucks, forklifts, workers] /*, ao:{radius..}, aoIntensity, ink:{color,strength} */ });
//  -> { render(dt), setSize(w,h), setQuality('high'|'med'|'low'), addOutline(obj), markBrand(x), dispose(), quality, composer, passes }
markBrand(meshOrMaterial)               // unlit, toneMapped:false and ACES-compensated, so the output is the exact hex
markBrand(meshOrMaterial, { lit:true }) // keeps the clay shading; toneMapped:false + compensated
markBrandDecals(root)                   // models.js content: textured toneMapped:false decals -> unlit; solid brand mats -> lit
```

### Chain (high and med)
1. `RenderPass` renders into a HalfFloat target (linear).
2. `GTAOPass` gives soft clay contact AO (radius 0.6 m, blend 0.75).
3. `InkPass` draws a thin dark ink outline (#1a2130) from depth and normal edges. It reuses GTAO's G-buffer, so the extra scene render is only the outline-object mask. It is limited to `outlineObjects`/`addOutline()` objects (layer 7) and is occlusion-aware. With no objects registered, it outlines the whole scene.
4. `SMAAPass`.
5. `OutputPass` applies ACES and sRGB here only, so nothing is doubled. The renderer renders to a target, which disables its own tone mapping.

| tier | pixelRatio | AO | outline | SMAA | path |
|---|---|---|---|---|---|
| high | min(dpr, 2) | GTAO, 16 samples | yes | yes | composer |
| med | 1 | GTAO, 8 samples | yes | yes | composer |
| low | 1 | – | – | – | `renderer.render` direct (ACES + sRGB by renderer) |

`pickQuality()` checks these in order:
1. `?q=low|med|high`
2. `'low'` when `WEBGL_debug_renderer_info` matches SwiftShader, llvmpipe, softpipe or software
3. `'med'` on a coarse pointer (mobile)
4. otherwise `'high'`

### Brand colour (B10)
Under a composer, `material.toneMapped=false` has no effect, because OutputPass applies ACES to every pixel. Brand materials get an injected shader that applies the exact inverse of three's `ACESFilmicToneMapping` (including `toneMappingExposure`) when the composer is active. OutputPass then lands on the source hex. #FFC220 needs a slightly negative linear blue, which the HalfFloat target keeps. In `low` (direct) the compensation is switched off and `toneMapped:false` bypasses ACES. Both paths are exact.

### Light rig (B10/M5/M6)
- Hemisphere light: 0.9 (#f4f8ff / #b4bcc8).
- Key sun: 2.8, PCFSoft, radius 3, bias -0.00025, normalBias 0.02.
- Fill: 0.2.
- No ambient light.
- ACES exposure: 1.0.
- Shadow frustum: 150 × 140 m on 4096², about **3.7 cm/texel** (was 250 × 200 m, about 6 cm/texel by this formula). `fitShadow()` re-centres it on the active area or camera target and snaps to whole texels, so it does not shimmer.
- The `low` tier uses 2048², about 7.3 cm/texel, for software GL. Pass `mapSize:4096` to override.

## Integration snippet (walmart-dc.html owner)
```js
import { create, applyLighting, markBrandDecals, pickQuality } from './parts/postfx/postfx.js';
const Q = pickQuality(renderer);                       // replaces the local GL_INFO/Q logic
// remove hemi/amb/sun/fill creation (lines ~3719-3727 and the frustum override at ~4420), then:
const rig = applyLighting(scene, renderer, { quality: Q, center: [-5, 10], halfW: 75, halfD: 70 });
const sun = rig.sun;                                   // day/night code can keep driving sun/hemi intensities
markBrandDecals(scene);                                // after all models are added (and call again for spawned trucks)
const fx = create(renderer, scene, camera, { quality: Q, outlineObjects: [...trucks, ...forklifts, ...workers] });
// spawn: fx.addOutline(newVehicle); fx.markBrand(newVehicle.userData.parts.logoRight)
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); fx.setSize(innerWidth, innerHeight); });
// loop: replace renderer.render(scene, camera) with
fx.render(dt);
// optional: rig.fitShadow(controls.target.x, controls.target.z, 75, 70) when the camera tours far away
```
Notes:
- Create the WebGLRenderer with `antialias: false` when the composer is used, since SMAA does the AA. Keep `preserveDrawingBuffer` for capture.
- With `?noao`, call `fx.setQuality('low')` or pass `quality: 'low'`.

## Test
- `test.html?mode=before` uses the current app recipe: hemi 1.25, ambient 0.25, sun 2.3, fill 0.45, ACES 1.05 and a 250 × 200 m shadow.
- `test.html?mode=after&q=high|med|low` uses the new module.
- The scene is a semi truck, a forklift, 2 workers, 4 pallets and a brand swatch card (#0071CE | #FFC220 | #041E42).
- `capture.js` runs headless Chrome (SwiftShader) and writes `before.png`, `after.png`, `after_med.png`, `after_low.png`, `after_auto.png` and `runs.json`.
- `sample.py` writes `samples.json` with dE00 values.
