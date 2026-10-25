# HANDOFF: Walmart DC Live Ops 3D Dashboard

## What this is
A single-file HTML/CSS/JS dashboard (Three.js r160 from unpkg via an import map) showing a live, animated 3D Walmart-style regional distribution centre. It's a smooth cartoon/clay style with Walmart blue (#0071CE, navy #041E42, spark yellow #FFC220). Footer: "Concept demo · not affiliated with Walmart Inc. · All data synthetic".

- **Live demo (v3):** `index.html`, which is the same file as `builds/walmart-dc_v3.html`.
- **Current deliverable:** `builds/walmart-dc_v3.html` (437 KB). It boots with zero console errors (headless, `?q=low`).

## Hard rules from the client (non-negotiable)
1. Nothing appears or vanishes by magic. Every pallet, case and tote is physically carried. No scale pop-in.
2. Vehicles drive like real vehicles, with bicycle-model kinematics (dθ = v/wb·tanδ), rate-limited steering and Ackermann. Forklifts and reach trucks are rear-steer. Semis are front-steer with an articulated trailer and reverse into docks. No spinning in place, no sliding sideways.
3. Forks travel low (≤0.3 m), lift only at the destination with a telescoping mast (0.5 m/s trapezoid), and enter the pallet pocket at deck +3 cm.
4. Slot-exact: every machine knows each rack slot (AA-BBB-L-P). It never reaches level 6 for a level-7 pallet, and a pallet moves only while physically supported. The asserts log `[ASSERT]` warnings if fork-to-slot error is >2 cm or a pallet jumps >5 cm in a frame.
5. Pallets are real scale (1.2 × 1.0 m, about 1.5 m loaded). Full, partial and half loads are mixed. Forklifts stack pallets.
6. Every vehicle has a visible driver. Pallet trucks move only with a human operating them. Manual pump trucks are hauled (pulled) over distance and pushed only for short positioning. Pump-handle routine: insert, pump 3–4 times, pull, position, release lever, lower, walk away.
7. The process reads clearly to a layperson: gate → yard → unload + scan → put-away or cross-dock → replenishment → pick → sorter → build + wrap → load → depart. Zone signs and captions throughout.
8. It stays a dashboard, with KPIs and chrome in the blue theme. The story lives in the 3D scene.
9. Zoomable: wheel, pinch, +/- buttons, double-click fly-in. An "Explore" mode where scrolling steps through each department, auto-zooms and explains it in plain English.
10. Visible cartons on every pallet, including rack pallets. Black totes with yellow grid lids (`imgref/19`). Hand pump trucks (`imgref/20`).
11. Flawless on modern phones (360–430 px wide, portrait and landscape).
12. Be very strict and sceptical on visual quality ("you're creating art").

## Repo map
- `builds/`: frozen snapshots, logged in `builds/CANDIDATES.txt`. Only test snapshots.
- `src/app1–7.js`, `body.html`, `style.css`, `build.py`: builder sources. `build.py` inlines everything into one HTML file and must escape `</script` as `<\/script`.
- `parts/models.js`: the procedural model library (forklift, reach truck, pallet jacks, walkie, tug train, yard tractor, semi, workers and operators, totes, pallets, racks, conveyors). Change log is `parts/CHANGES.txt`. Run `parts/check.py` before inlining (the last edit pass was interrupted).
- `parts/inky/camera.js`: zoom rig (B30). Done and tested, **not yet inlined**.
- `parts/inky/rackCartons.js`: instanced cartons on rack loads (B31). Done and tested, **not yet inlined**.
- `parts/postfx/postfx.js`: GTAO, ink outline, SMAA and exact brand colours (B10/B12). See its README. Done, **not yet inlined**.
- `parts/cooker/signs.js`: inlined. `wrapper.js`: stretch wrapper with operator, done, not inlined. `tour.js`: auto tour plus Explore mode, done, not inlined. `sorter.js`: partial and untested, don't use it yet.
- `assets/*.glb`: 21 Blender GLBs (meshopt + webp, r160 compatible, base64-embeddable). `manifest.json` and `renders/contact.png` are alongside them. Optional upgrade.
- Shared UI chrome came from `chrome.html` (Inky). It may have a partial phone-CSS edit, so verify it before re-inlining.
- `qa/review.md`: the full QA gate, with blockers B0–B31 and legibility checks L1–L13. `qa/tools/`: headless puppeteer-core scripts.
- `imgref/`: client reference images.

## Status at handoff (v3)
**In v3:** live fixed-timestep sim. A populated scene:
- 3 forklifts unloading trailers.
- 2 rider pallet trucks.
- 3 reach trucks doing put-away and replenishment.
- 2 forklifts loading outbound.
- 3 hand pallet jacks.
- 2 walkie stackers.
- A tug train, 2 yard tractors and 14 workers.

Every vehicle has a driver. Fork-to-slot accuracy is within 2 cm, with no per-frame jumps. Bicycle-model driving. Forks are low in travel.

**Known issues in v3:**
- One assert: RT-04 at PD-04 seats 3.7 cm high.
- Some path ends finish 2–7 cm off target.
- The hand-jack route to the wrapper hasn't been checked visually.
- KPI seeding isn't done, and B27's first cycle under 20 s isn't verified.
- No 30 fps cap on the low tier.

**Next steps (v4), in order. Inline each in its own try/catch and keep zero console errors as the gate:**
1. postfx.js
2. camera.js
3. rackCartons.js (wire `setSlot` to sim handoffs)
4. tour.js (Explore mode)
5. wrapper.js
6. Phone layout pass at 360×780, 390×844, 393×852, 412×915, 430×932 and 844×390: no clipping or overflow, text ≥11 px, safe-area insets, usable bottom sheet.
7. Fix RT-04, KPI seeding, and the semi reverse-dock (about 1.3 m off in v2; recheck).
8. Then work the open items in `qa/review.md`.
