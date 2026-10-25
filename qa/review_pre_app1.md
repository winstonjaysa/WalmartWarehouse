# Walmart DC Live Ops (walmart-dc.html): QA & Art-Direction Review, FIRST PASS

**Reviewer:** QA/art-direction executor · **Date:** 2026-10-25 ~07:40 UTC · **Checklist:** `qa/reference-checklist.md` (sections A R S V X Y Z W W-b P B–J)

---

## RELEASE GATE

# SHIP: NO

**Grading standard (binding):** strict, judged as art. **Every checklist item defaults to FAIL** until frame evidence (crop path plus frame number or timestamp) proves a pass. Code that looks correct is not proof; it only gets an item to "plausible, unproven".

**Open BLOCKERS (17):** B1–B12 from the first pass, plus B13–B17 from the Process legibility audit (07:55 UTC)

| # | Blocker | Evidence |
|---|---|---|
| B1 | **The product does not exist yet.** `/workspace/gateflow/walmart-dc.html` is missing, so nothing can be rendered, captured or scored. Every R, S, V, X, Y, Z, W, B–J item is FAIL by default. | `ls walmart-dc.html` → "No such file" (07:39 UTC); waiter log `/home/box/.cursor/projects/workspace/terminals/650592.txt` last line "03:39:34 waiting2" |
| B2 | **Objects pop in and out by scaling on screen.** `popIn()` scales from 0.0001 with easeOutBack overshoot and `popOut()` shrinks to 0. This breaks the hard rule that nothing appears or vanishes on screen. | `src/app1.js:77-87`: `function popIn(obj, dur = 0.7, ...) { obj.scale.setScalar(0.0001); ...` / `p.obj.scale.setScalar(Math.max(0.0001, p.target * easeOutBack(k)))` |
| B3 | **The fleet is missing machine types.** There is no reach truck and no tug / cart train anywhere in the model library (Z3, Z6). | `grep -n "reach\|tug\|createReach\|createTug" parts/models.js` → only robot-arm IK `reachTo` (models.js:938, 970); `parts/check_results.txt`: 72 models, none of these types |
| B4 | **The auto stacker mast has one stage.** The carriage rises 1.8 m inside a 2.0 m outer mast with no inner stage, so at full lift the carriage and backrest run off the top of the uprights (Y2, A). | crop `qa/artefacts/glb_stacker_single_stage_mast.png` (render `assets/renders/pallet_stacker_auto.png`); GLB node tree has a single `mast` node; check_results "autoStacker animated size y 3.62 vs rest 2.5" |
| B5 | **Lift, stack, putaway and trailer loading are unproven** (Y1–Y4): double-stacking, multi-level putaway with a telescoping mast, level set-down, and trailer rows. | No app; `parts/motion_demo.mp4` missing |
| B6 | **Vehicle kinematics in the app are unproven** (V1–V10, Z1–Z7): pivot, slip, wheel roll, rear steer, forks low, articulated reverse into dock. | No app, no motion_demo.mp4. The library `drive()` code is good (see "What is already right"), but there is no frame proof |
| B7 | **The 60 fps deterministic capture and scrub have not been run** (R1–R10: jitter, popping, z-fighting, clipping, AA). | Pending the HTML |
| B8 | **The 3 simulated-minute automation run has not been run** (S1–S8: pops, stuck agents, teleports, camera tour loop). | Pending the HTML |
| B9 | **Dock count in the UI contradicts the scene.** The UI says 24 docks "D01–D24, 14 of 24 occupied", but the scene builds 8 inbound + 8 outbound doors with IDs `DR-001…` / `DS-101…`. Labels cannot anchor to doors that don't exist, and the ID scheme differs. | `src/body.html:9-10` "Building A · Docks D01–D24", "Receiving · D01–D12 / Shipping · D13–D24"; `src/app2.js:4-5` `IN_DOORS = Array.from({ length: 8 }...'DR-'+...` and `OUT_DOORS ... length: 8 ... 'DS-'+(101+i)` |
| B10 | **Brand colour is washed out in render** (trailer wordmark). The texture is on brand, but the lit and tone-mapped result is far off: rendered `#3B8BE6` vs `#0071CE`, **ΔE00 9.8**. The reference photo is navy `#133462`. Spark renders `#FFE243` vs `#FFC220`, **ΔE00 10.3** (shifted toward lemon). The app uses the same lighting recipe (hemi 1.25 + ambient 0.25 + ACES 1.05), so this will reproduce in product. | crops `qa/artefacts/glb_truck_wordmark_washout.png`, ref `qa/artefacts/ref02_trailer_wordmark.png`; samples `qa/colour_samples.json`; `src/app1.js:35-36,53-54` |
| B11 | **The truck tractor carries no Walmart branding** in the GLB: generic white cab, blue stripe, no door spark or wordmark. Real Walmart tractors (imgref 01/02) carry the wordmark and spark on the door and fairing. | crop `qa/artefacts/glb_truck_cab_no_branding.png` (render `assets/renders/qa/walmart_truck__cab.png`) |
| B12 | **No post-processing chain** (SSAO / outline / AA-through-composer / OutputPass). The clay-toy reference look (soft AO contact, ink outline) cannot be met by forward rendering alone (P1–P6). | `grep -nE "EffectComposer|SSAO|GTAO|Outline|SMAA|FXAA|OutputPass" src/app1.js src/app2.js` → no hits |
| B13 | **No part of the DC process is shown in motion.** `src/` (app1–app3, last change 03:38 box) creates **no** trucks, yard tractors, forklifts, reach trucks, pallet jacks or associates. The model factories are imported but never called. The only moving elements are the sorter cases and the belt UV scroll. So L1–L10 have scenery but no behaviour. | `grep -nE "create(SemiTruck\|YardTractor\|Forklift\|PalletJack\|Worker\|AMR)\(" src/app*.js` → 0 hits; the only motion is `updateCases()` at `src/app3.js:70-76` |
| B14 | **The facility is named after a real Walmart DC.** The spec says the site must stay fictional, but the UI and loader say "DC #6094 · Bentonville, AR". The building sign says "Demo RDC-7041", so the naming also contradicts itself. | `SIM_SPEC_WALMART.md:5` "RDC-7041 stays fictional… (… Bentonville DC 6094 …)"; `src/body.html:6,9,46`, `src/app1.js:2` vs `src/app2.js:158` |
| B15 | **The pallet build and stretch-wrap stage (NCV) is missing.** There is no NCV zone, no wrap turntable and no film. The spec flow "pallet build → wrap → load" has a hole (L8). | `src/app2.js:3` layout comment lists only RCV, MXA, RES, XDK, PM, CNV, NXA/SRT1, OBS; `grep -in "ncv\|wrap station\|turntable" src/` → 0; spec `SIM_SPEC.md:52` NCV "Pallet build…, wrap stations" |
| B16 | **The sorter is a closed racetrack, and its cases sink into a diamond tube.** (a) 90 cases loop forever at 1.8 m/s. Nothing feeds them from the pick conveyors, there is no scan tunnel, and no case diverts to a door lane, so it reads as a toy track rather than sortation (L7). (b) `TubeGeometry(…, 0.42, 4 radial segs)` makes a diamond cross-section with its apex at y 6.62, while the case bottoms sit at 6.32. So **0.30 m of each 0.32 m case is inside the belt**: clipping. | `src/app3.js:61-76`; a numeric rebuild of the same geometry (`/tmp/tube.mjs`, three r1xx) gives tube y 5.78…6.62, case 6.32…6.64. The `sh` belt Shape at `app3.js:62` is built and then never used. |
| B17 | **There are no captions and no guided tour.** body.html has no caption element. Tools offer only a camera preset and auto-orbit. No code follows one item from the gate to departure. A layperson cannot read the flow (L12, L13). | `src/body.html` tools `data-t="cam"`/`orbit` only; `grep -in "caption\|tour\|follow" src/` → 0 hits |

The gate flips to **SHIP: YES** only when B1–B17 are all closed **with frame evidence**, no MAJOR item remains in categories 1–11, and every Process legibility stage (L1–L13) is graded PASS.

---

## PROCESS LEGIBILITY (checklist §L): can a layperson read the DC flow just by watching?

**Method:** I read `SIM_SPEC.md` §A–B8 and `SIM_SPEC_WALMART.md` in full, then checked each stage against `src/app1.js`, `app2.js`, `app3.js` and `body.html`, plus `parts/models.js` for the available machines. **Code evidence only:** walmart-dc.html has not landed, so every stage is still FAIL until frame-proven. The "Frame evidence" column fills in after the app run.

**Spatial order is correct.** Seen in plan view, the zones run south to north exactly as the spec does: RCV y0–10 → MXA → RES aisles 01–08 / XDK corridor x45–50 → PM x50–72 → CNV x72–98 → NXA + SRT1 at +5 m → OBS y50–62 (`app2.js:2-3`, floor paint `app2.js:72-85`). Inbound doors are on the south wall and outbound on the north, as in the spec. **What is missing is the process in time:** nothing moves through these zones (B13).

| # | Stage (spec) | Exists? (code evidence) | Order | Signs / captions vs spec | Grade | Concrete fix | Frame evidence |
|---|---|---|---|---|---|---|---|
| L1 | Gate check-in (B1.1; W A7 automated lane + GC exception lane) | **Static prop only.** One booth with a single boom arm at the SE corner (100, 0, 70). The arm group is exposed (`world.userData.gate`) but nothing animates it. There are no in/out lane split, no OCR/QR camera post, no scale, no queue. `app2.js:189-193` | Position matches the spec (GTE at SE) | No "GATE" or "CHECK-IN" sign; no caption | **BLOCKER** (B13) / MAJOR for missing lanes | Add 2 in + 2 out lanes with islands, a camera pole that flashes on read, and the boom raised with easeIO when a truck stops. Signs "GATE · CHECK-IN" / "CHECK-OUT". Caption "Truck checks in at the gate (QR + plate scan)". | pending |
| L2 | Yard: drop, yard tractor hook, move to door, back in (B1.2–B1.4, B8) | **Partial.** Slots are painted, with labels `YA-01…15` (south) and `YD-01…15` (north) only (`app2.js:35`). Spec has YA/YB/YC + YD/YE/YF, and **YE is the outbound-staged zone that departure needs**. `createYardTractor` is never called. | n/a | Slot labels match the spec format `Y[A-F]-NN` ✓; no "YARD" sign | **BLOCKER** (B13) | Add YB/YC/YE/YF (or at least YE). Instantiate yard tractors that drive `drive()` paths: hook → pull → reverse in with trailer leading (tractrix). Caption "Yard truck moves trailer to door DR-00x". | pending |
| L3 | Inbound unload + scan (B2.1–B2.4) | **Scenery only.** Door corridors, a green leveler strip and stage lanes `STG-DR001-1` with 4 FIFO slots per door (`app3.js:39-41`, `app2.js:73`). The `STG-DRxxx-n` naming matches the spec ✓. No unloader, no scanning, no SS/DA split, no EXT/ACL conveyor door. | Correct (south docks → RCV) | Floor label "RECEIVING" is painted flat (`app2.js:83`) and unreadable at oblique angles. No door numbers on the doors. No "Staple Stock"/"DA" vocabulary (W A3). | **BLOCKER** (B13) | Animate pallet jack / forklift trailer → stage lane. Add an associate with an RF scanner that flashes a beam and a "✓ LPN" chip over the pallet. Add hanging door number plates "DR-001…". Caption "Unload + scan each pallet (LPN)". | pending |
| L4 | Disposition: put-away to reserve **or** cross-dock (B2.4, B3) | **Partial.** RES racks: 8 aisles × 11 bays × 6 levels with beam tops 0/1.75/3.5/5.25/7.0/8.75 = spec ✓ (`app2.js:6-7`, `app3.js:3-19`); aisle clear ≈ 3.2 m ✓. XDK corridor with northbound arrows ✓ (`app2.js:75-78`). **No reach truck exists** (B3), so narrow-aisle put-away cannot be shown. Slot fill is toggled by **scale 0↔1** (`app3.js:31-32`), so a put-away would **pop** a pallet into the rack (B2 class). | Correct | "XDK ▲" floor text is 0.6 scale (≈1.1 m glyphs) and sits under the mezzanine edge. **No "RESERVE" sign.** Slot IDs are `RES-01-01W-A1` vs the spec format `01-001-A-1` (MINOR). | **BLOCKER** (B3, B13) | Build a reach truck (pantograph/reach carriage, triple mast). Put-away should carry the pallet in, raise the mast, reach and lower onto the beam, *then* call setSlot. Never scale. Show the split with a coloured route ribbon (blue = store, yellow = XDK). Upright signs "RESERVE STORAGE" and "CROSS-DOCK". | pending |
| L5 | Replenishment reserve → pick face (B4) | **Absent behaviour.** Flow-rack faces at x 57/65 on L1 (`app3.js:54-58`), but nothing feeds them, and there is no replenishment aisle or rear-load side marking. | n/a | No sign | **BLOCKER** (B3, B13) | A reach truck lowers a pallet from RES and drives to the rear of a PM flow lane. The case slides forward (flow-rack motion). Caption "Replenish pick face from reserve". | pending |
| L6 | Pick (B5: voice/RF case pick → label → takeaway conveyor) | **Scenery only.** 3-tier mezzanine (decks at +5.0/+8.5, yellow rails), flow faces on L1 only, takeaway conveyors at x 52/70/74 (`app3.js:48-58`). No associates (`createWorker` unused); L2/L3 decks are empty slabs. | Correct (PM between RES and CNV) | No "PICK MODULE" sign: the mezzanine deck covers the floor paint | **BLOCKER** (B13) / MAJOR (empty decks) | Pickers walk to the face, take a case, apply a label (white flash), and place it on the belt. Cases ride the takeaway belt into CNV. Populate L2/L3 with carton-flow faces. | pending |
| L7 | Sortation (B6: merge → induct/scan → sliding-shoe divert → spiral to OBS) | **Exists but wrong.** The SRT1 loop is at +5 m over NXA (position matches the spec ✓), but it is a closed loop with no merge, no scan tunnel, no diverts and no spirals. The diamond tube clips the cases by 0.30 m (B16). | **Out of order in effect:** the loop is disconnected from pick and from OBS | No "SORTER" sign (only "CNV · INDUCT" floor text at `app2.js:84`) | **BLOCKER** (B16) | Model it as a flat belt (use the unused `sh` Shape + ExtrudeGeometry along the curve). Add an induct merge fed from the takeaway belts, a scan arch that blinks, and divert chutes/spirals down to each DS lane. A case leaves the loop at its door. | pending |
| L8 | Pallet build + stretch wrap (NCV; W B6) | **Absent.** | — | — | **BLOCKER** (B15) | Add an NCV area by the OBS ends: a pallet build station plus a turntable wrapper with an animated film spiral. Caption "Build + wrap mixed pallet". | pending |
| L9 | Outbound load (B7.1–B7.4, W: trailer stays until cubed/weighed out) | **Scenery only.** OBS lanes are painted 1 per door with green plates (`app2.js:74`). There is no loader, no trailer at the DS door, and no fill % display. | Correct (north) | "SHIPPING · OBS" floor text ✓ vocabulary. No door numbers. | **BLOCKER** (B13) | Spot an empty trailer, load nose-first in rows (sim `loadedPct`), show a fill bar above the door, and close the door at ≥ 92 %. | pending |
| L10 | Departure (seal → YE → road tractor → gate out with seal check) | **Absent.** No YE zone (L2) and no gate out-lane (L1). | — | — | **BLOCKER** (B13) | Seal flash at the door, pull to YE, road tractor hooks and exits through the gate out-lane, fading out through fog beyond the perimeter road (no scale pop). | pending |
| L11 | Order and continuity, one item end to end | No item identity carries across stages: the stage-lane pallets (`makePalletObj`), the rack instances (`imLoad`) and the sorter cases (`cases`) are three unrelated systems | Spatial ✓, temporal ✗ | — | **BLOCKER** (B13) | Give each payload an id that persists. Hand the same mesh (or a matched instance swap hidden by the carrier) from truck → lane → rack/XDK → pick → case → sorter → lane → trailer. | pending |
| L12 | Captions and zone signs accurate to the spec | All zone naming is floor paint at 50 % navy (`app2.js:82-85`), hidden under racks and mezzanine at hero angles. **Missing:** RESERVE/RES, PICK MODULE/PM, SORTER/SRT, NCV, GATE, YARD, door numbers. "AMR ZONE" (`app2.js:84`) conflicts with W C12 (AMRs default 0 in Mode A). Facility naming conflicts with the spec (B14). Dock IDs conflict with the UI (B9). | — | see left | **BLOCKER** (B14, B17) / MAJOR (signage) | Add hanging double-sided zone signs (navy #041E42 board, white Bogle-like text, spark accent) at each zone entry, ~6 m up, sized ≥ 1.2 m cap height. Add a caption bar (bottom-centre, ≤ 8 words, fades in and out with the stage). Remove "AMR ZONE" or gate it behind Mode B. | pending |
| L13 | Camera tour follows one item | **Absent.** Only a HOME preset (`app1.js:44`) and auto-orbit. | — | — | **BLOCKER** (B17) | A tour of about 12 shots (one per L1–L10 + intro/outro), each 8–15 s, eased dolly with a look-at on the tracked item, looping to HOME without a cut jump. | pending |

**Process MAJOR / MINOR findings (code):**
- **M12 (MAJOR):** stored rack loads are a single rounded box scaled non-uniformly in Y. This squashes the bevel radius, and every load is the same 1.0 × 1.0 footprint with only 6 colours, so the racks read as clones (X2/W). Evidence: `app3.js:21,29,32`. Fix: use 4–6 load archetypes (cases stacked, shrink-wrapped, drums, mixed), each with its own geometry, and pick by slot hash.
- **M13 (MAJOR):** gate and yard are underspecified vs the spec. There is one gate lane, and only YA and YD are built (YE is missing, and departure needs it). Evidence: `app2.js:35`, `app2.js:189-193`.
- **M14 (MAJOR):** there is no SS/DA receiving-door vocabulary and no EXT/ACL door, although Walmart spec A3 asks for it. Fix: label DR-001…004 "SS" and DR-005…008 "DA", and give one door an extendable conveyor.
- **m7 (MINOR):** the RES slot-ID format `RES-01-01W-A1` differs from the spec `AA-BBB-L-P` (`app3.js:18`).
- **m8 (MINOR):** UI numbers drift from the spec. Throughput "18,420 units/hr" vs spec seed 14,500 cases/h (`SIM_SPEC.md:335`). "48,212 pallet positions" vs spec 36,480 (`SIM_SPEC.md:64`; the built scene has 8×2×11×6×2 = 2,112). The shift list has no Swing 14–22 (`SIM_SPEC.md:513`).
- **m9 (MINOR):** no Mode A / Mode B toggle (W §Two modes, line 25).

## Inputs: present vs missing

| Input | Status |
|---|---|
| `walmart-dc.html` | **MISSING.** Waited 03:00→07:39 UTC (two waiters; `qa/wait2.sh` deadline 07:51 UTC). **Pending** |
| `parts/motion_demo.mp4` | **MISSING.** Frame extraction at 10 fps (wheel, steer, articulation) **pending** |
| `src/app1.js` (122 lines), `src/app2.js` (193), `src/body.html` (46), `src/style.css` (185) | Present, read-only reviewed (code evidence below) |
| `parts/models.js` (1,479 lines), `parts/preview.html`, `parts/check_results.txt` (72 PASS / 0 FAIL, all static bounds checks), `parts/closeup_*.png` | Present, reviewed |
| `assets/raw/*.glb` (forklift_counterbalance, pallet_stacker_auto, walmart_truck) + `assets/renders/**` | Present, reviewed (`qa/glb_inspect.json`) |
| `imgref/01–18` | Present, used for the checklist and colour refs |

---

## Mandatory category coverage (strict: FAIL unless frame-proven)

| # | Category | Grade | Findings |
|---|---|---|---|
| 1 | Scale & proportions | **FAIL** (unproven in app) | Library dims are good (see "What is already right"). **MAJOR M1:** fork length is inconsistent. GLB tines are **1.20 m** (z 1.0–2.2), procedural `forkGeo(L = 1.07)` (`models.js:643`). Use 1.07 m everywhere so the pallet overhangs the tips by ~0.13 m. **MINOR m1:** rack bay depth 1.25 m (`check_results`: rackBay 2.96×7.27×1.25) is deeper than the 1.22 m pallet, so pallets won't overhang the beams the way real ones do (1.07–1.1 m frame, 50–75 mm overhang each side). Set frame depth to 1.07 m. |
| 2 | Clipping & z-fighting | **FAIL** (unproven) | **MAJOR M2:** the `sb` sub-sign plane is coplanar with the parapet face at x 58.75 with no polygonOffset; only the main sign has it (`src/app2.js:156` has `polygonOffset: true`, `:159` `new THREE.MeshBasicMaterial({ map: sub, transparent: true })` does not). Add `polygonOffset: true, polygonOffsetFactor: -2` or move it 2 cm off the face. **MAJOR M3:** stacker carriage overruns the mast top (B4). Needs the R-capture z-fight scan once the app exists. |
| 3 | Jitter & popping | **FAIL** | B2 (scale pop-in/out). Fix: spawn and despawn only beyond the fog/frustum edge. Trucks enter via the gate road from outside `Fog(380,900)`; pallets are created inside trailers or behind dock doors; no scale tweens on world objects. Keep `popIn` for UI tags only. |
| 4 | Wheel roll & steer | **FAIL** (unproven) | Library math is correct: per-wheel ICR distance `d / radius` (`models.js:452-455`), bicycle model yaw `speed*tan(steer)/L` (`:441`). Unproven in the app (B6). **MAJOR M4:** `spinWheels()` (`models.js:408`) uses `speed*dt/r` with no ICR correction. Any model driven through it (pallet jack, AMR, rider truck) will slip inner/outer wheels on turns. Route all wheeled machines through `drive()` with `kin` set. |
| 5 | Mast timing | **FAIL** | B4 (single stage). Telescoping order is unproven: free-lift of the carriage first, then the inner stage, eased, only while stationary. Fix: add `mast_inner` to the stacker; sequence carriage 0→free-lift, then inner stage; gate lift on `speed < 0.05`. |
| 6 | Pallet seating | **FAIL** (unproven) | Pallet geometry is excellent (plank by plank). Seating on forks, beams and trailer floor is unproven. Requirement: pallet bottom = beam top ±1 cm, pitch/roll ≤0.5°, tines fully inside the fork pockets (pocket clear height 0.078 m vs tine thickness; check tine ≤0.05 m). |
| 7 | Shadows & lighting | **FAIL** | **MAJOR M5:** one 4096² sun shadow over a 250×200 m frustum (`src/app1.js:57-58`) gives ≈6 texels/m (16 cm per texel). Fork, pallet and wheel contact shadows will be mush and shimmer as the camera tours. Fix: CSM (3 cascades) or fit the frustum to the camera view each frame, plus baked contact AO under vehicles. **MAJOR M6:** fill is too flat. Hemi 1.25 + ambient 0.25 + fill 0.45 (`src/app1.js:53-54,61`) kills form and washes out brand colour (B10). Target hemi 0.6–0.8, drop ambient, rely on SSAO. |
| 8 | Outline & AA sharpness | **FAIL** | B12 (no composer, so no outline). `antialias: true` is lost the moment a composer is added: use a multisampled render target (`samples: 4`) or SMAA. **MAJOR M7:** ground markings are painted into a **10 px/m** canvas (`src/app2.js:17` `GP = 10`), so a 0.15 m dock line is **1.5 px wide**. That blurs at hero zoom (R4). Use 40 px/m tiles, or vector line meshes / decals for markings within 60 m of the hero camera. |
| 9 | Label alignment | **FAIL** | B9 (24 vs 16 docks, mismatched IDs). Tags `#tags` (body.html:2) projection, anchoring, drift and overlap all untested. Need a 240-frame capture with a projected anchor vs label centre error ≤2 px and no overlap. Wordmark on trailer texture: 54% width, 33% height, fine (texture). **MINOR m2:** trailer wordmark weight looks lighter than the bold photo reference. |
| 10 | Colour fidelity (ΔE00) | **FAIL** | Sampled in `qa/colour_samples.json`. **Source values are on brand:** CSS `--blue:#0071CE --navy:#041E42 --mid:#004C91 --spark:#FFC220` exact (`src/style.css:1`); trailer texture #0673CE (ΔE 0.7), #FEC223 (ΔE 0.2); GLB `walmart_blue` #0070CD, `spark_yellow` #FFC125. **Rendered values are not:** truck wordmark #3B8BE6 (ΔE **9.8**), spark #FFE243 (ΔE **10.3**), stacker badge #488DE3 (ΔE **10.5**). Forklift body #FFC93B vs spark ΔE 2.3, a fine safety yellow (material #F1B222, ΔE 4.3). Gate ΔE00 ≤ 3 for brand surfaces in product frames. Fix: lower exposure and fill, author brand decals as emissive-assisted or `toneMapped: false` on decal materials, and re-sample in the app. |
| 11 | Appearing / vanishing | **FAIL** | B2. `roof.visible = false` (`app2.js:133`) is a user toggle, which is fine if eased (fade or slide), not a hard cut. Run `auto.js` (S) to prove 0 on-screen pops over 3 min. |

---

## MAJOR (non-blocking but must fix before ship)

- **M1** Fork length 1.20 m in the GLB vs 1.07 m spec. Evidence: GLB node bounds (fork_L/R z 1.0–2.2), `models.js:643`, crop `qa/artefacts/glb_forklift_tines_square_tips.png`. Fix: scale the tines to 1.07 m, add a 45° taper over the last 0.1 m, and make them 0.10 m wide × 0.045 m thick.
- **M2** Sub-sign z-fight risk. `src/app2.js:159`; fix as in the table.
- **M3** Stacker carriage overruns the mast (see B4).
- **M4** `spinWheels` has no ICR. `parts/models.js:408`.
- **M5** Shadow resolution 16 cm/texel. `src/app1.js:57-58`.
- **M6** Over-filled lighting washes out the palette. `src/app1.js:53-54,61`.
- **M7** 10 px/m ground-marking texture. `src/app2.js:17`.
- **M8** Truck GLB is over budget: **32,878 tris** (budget ≤25k per vehicle), **60 primitives / 19 materials**. Fix: merge primitives by material (`gltf-transform` `join`/`palette`) to ≤12 draws, and decimate the tyre treads and the lug-nut ring.
- **M9** All GLBs are uncompressed. Measured with meshopt + webp: forklift 1,563,168 → **293,212 B**, stacker 604,132 → **116,684 B**, truck 2,251,852 → **409,024 B** (−81%). Base64 in a single HTML adds 33%. Command: `gltf-transform optimize in.glb out.glb --compress meshopt --texture-compress webp` (load with `MeshoptDecoder`).
- **M10** The forklift GLB has 4 open edges on the body (asset meta QA). Weld or close them, or they will show as light leaks with SSAO.
- **M11** No motion reference: `parts/motion_demo.mp4` is missing, so the wheel, steer and articulation timing review cannot be done.

## MINOR

- **m1** Rack depth 1.25 m (see category 1).
- **m2** Wordmark weight.
- **m3** Asset render staging has a hard beige horizon band (#E2DDD6 at y≈67) across the top of the renders. Crop: `qa/artefacts/glb_truck_render_bg_seam.png`. This is presentation only; use a gradient sweep backdrop.
- **m4** The main truck render crops the cab. Re-frame it.
- **m5** All materials are metalness 0, even forks, chains and chrome. That's acceptable for the clay look, but give chains and forks roughness ≤0.5 for a soft highlight so they read as steel.
- **m6** Camera near plane 1 m (`src/app1.js:42`) clips anything within 1 m in close inspector shots. Use near 0.3 with a logarithmic depth buffer, or a dynamic near.

---

## What is already right (plausible, still needs frame proof)

- **Pallets are plank by plank:** 3 bottom boards, 9 blocks, 3 stringer boards, 5 top boards with gaps, 1.02×1.22×0.144 m. Steel and blue-wood variants and instancing (`models.js:282-330,402`).
- **Load mix exists in the library:** heights 0.86 (sacks), 1.07 (totes), 1.17 (cartons), 1.38 (wrapped) (`check_results.txt`). This is still not proof the app mixes them.
- **Tractor-trailer `drive()`:** bicycle model, tractrix trailer at the kingpin with off-tracking, per-wheel ICR roll (`models.js:437-460`). check_results "semiTruck driven trailerYaw 0.163, kingpinErr 0".
- **Forklift GLB hierarchy is fixed:** body > mast_tilt > mast_outer > mast_inner > fork_carriage > forks; rear steer ±75°; min y 0. The 03:15 version had forks floating 2.8 m ahead; that is resolved.
- **Damping is delta-time based** (`app1.js:16-17` `1 - Math.exp(-k*dt)`). DPR is capped at 2 (`app1.js:31`). sRGB output and ACES are set (`app1.js:35-37`). Fog starts at 380 m, which gives a spawn edge.
- **Slab band style** blue #0071CE and spark pinstripe (`app2.js:53-54`) matches imgref 17. Bollards are present at the docks and the parapet (`app2.js:113,160`).

---

## Pending runs (tooling ready, all in `qa/tools/`, run as soon as walmart-dc.html lands)

1. `node run.js` / `modes.js`: 1440×900 console errors plus screenshots (initial, settled, 2D, 3D, floors, inspector, day, night) and a 390×844 mobile view.
2. `node cap60.js http://127.0.0.1:8931/walmart-dc.html /tmp/cap60 60 5 240 1440 900 1`, then `python3 scrub.py`. Artefacts go to `qa/artefacts/fNNNN_<kind>_<where>.png`.
3. `node realfps.js`: p50/p95/max frame time and long frames (SwiftShader numbers are flagged as software GL).
4. `node auto.js URL /tmp/auto 180 8 2`, then `auto_analyze.py` (pop, stuck, teleport, camera tour) and `vehicle_analyze.py` (V1/V2/V7/V8/V10 plus spin, steer, articulation, fork-height summaries and a speed plot).
5. `ffmpeg -i parts/motion_demo.mp4 -vf fps=10 qa/motion/f%04d.png` when it exists.
