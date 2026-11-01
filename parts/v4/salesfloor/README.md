# parts/v4/salesfloor — Walmart Canada sales-floor fixtures (Three.js r160, low poly)

Contract as parts/v4: `export function build(THREE, mats, opts={}) -> THREE.Group`, metres, y up, origin = floor centre of footprint (y=0).
`userData = { name, dims:{w,h,d}, pivots, drawCalls, verts, offset, ... }`. Materials: only `mats.vc` and `mats.vcMetal` (vertex colours baked by the inline merge in `../_merge.js`; falls back to local MeshStandardMaterials if missing). No new materials, no logos/text (blank colour bands and small coloured price slabs only).
`_kit.js` = shared helpers (face-culled `slab` boxes to save verts, rod, colour jitter, finish). Not an asset.
Test: `python3 parts/v4/salesfloor/test_salesfloor.py` (from /workspace/gateflow; serves :8812, headless Chrome + SwiftShader via Playwright, loads `test.html`) asserts ≤3 meshes and ≤15k verts per module and writes `preview.png`.

| file | opts (defaults) | footprint w × h × d (m) | facing | draw calls | verts | bytes |
|---|---|---|---|---|---|---|
| gondolaAisle.js | `length` (8 → 7 × 1.22 m sections = 8.54 m run), `height` (1.8), `seed` (1), `gapRate` (0.07) | 9.46 × 3.40 × 1.07 (fixture 1.8 m tall; base deck + 4 shelves per side at 0.14/0.47/0.80/1.12/1.45, end caps 4 levels, 0.45 deep each; 3.4 = sign rod tops) | long axis x; shelves face ±z; end caps face ±x; blank blue sign (0.9 × 0.5, bottom 2.3 m, ≥0.5 m above fixture top) hangs above the +x end, faces ±x | 2 (steel vcMetal, products+sign vc) | 11,334 (default seed 1); 11,844 (seed 3) | 5,062 |
| produceTable.js | `seed` (1), `variety` ('orange' \| 'apple' \| 'lemon' \| 'lime' \| 'melon' \| 'avocado' \| 'greenApple'), `fruitColor` (overrides variety colours), `fruitRadius`, `mound` (0.26 dome height) | 1.24 × 1.29 × 1.05 (rim 0.76, fruit dome ≈1.0, board top ≈1.29) | price board / front +z | 2 (bin+fruit+board vc, post vcMetal) | 9,096 orange (seed 2); 9,516 melon (seed 7) | 4,588 |
| meatCase.js | `length` (3.7), `seed` (1) | 3.80 × 2.07 × 1.10 | open front +z, length along x | 2 (case vcMetal, trays+price slabs vc) | 6,936 (seed 4) | 3,309 |
| electronicsWall.js | `width` (6), `seed` (1) | 7.31 × 2.60 × 2.39 (wall 6 wide; merch shelf 1.22 at +x; table 2.4 × 0.9 at z≈+1.9) | +z | 2 (wall+TVs+table+devices+boxes vc, shelving vcMetal) | 2,022 (seed 5) | 5,029 |
| checkoutLane.js | `seed` (1), `lightColor` ('#1f5fb8') | 4.01 × 2.62 × 1.58 | customer side +z, cashier −z, flow −x (belt) → +x (bagging); light pole + impulse rack at −x end | 2 (counter/POS/bags/candy vc, rods+rack vcMetal) | 1,968 (seed 6) | 3,729 |

Helpers/test: `_kit.js` 3,179 B; `test.html` 3,170 B; `test_salesfloor.py` 1,615 B; `preview.png` (contact sheet, 3/4 views, hemi + key light clay setup).
Verts vary a little with seed (random product sizes/gaps); all tested seeds are well under 15k.
