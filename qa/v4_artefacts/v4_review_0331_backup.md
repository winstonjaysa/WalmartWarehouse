# v4 visual/UX review: full scene renders (verdict: FAIL)

Reviewer: QA (read-only; only qa/ was written). Written Sat 2026-10-31, about 03:31 EDT (America/Toronto). Supersedes the 03:17 EDT part-preview review.

This is the first review with assembled scene renders (preview/v4_*.png). Each image was viewed at full size and as a 390 px-wide copy, compared against the user's photos (ref/, downscaled in qa/v4_artefacts/ref_small/), and cross-checked against the scene source (v4/main.js imports) and the part sources (parts/v4/*.js, README.md).

**Note:** the renders were being regenerated while I reviewed. v4_01, 03, 04, 14, desktop and phone, plus parts/v4/preview/trucks_test, worker_test and v4_models, were rewritten between 03:27:56 and 03:30:03 EDT. I re-viewed v4_01, v4_phone, trucks_test and worker_test after the rewrite, and their content had not materially changed. The mtimes in the table below are the latest ones I saw.

**Root-cause finding:** `v4/main.js` and `a1_core.js` import materials, skateConveyor, baler, compactor, dsdBoxTruck, dsdTractorTrailer, mckessonTote, palletJack, popSkid, zebraHandheld and _pallet. They do **not** import `wrappedSkid.js` or `worker.js`. Every person in the scene is a placeholder capsule, and every skid is a stack of untextured, unwrapped boxes. The part-level fixes (drivers, jackPullPose, wrapped skids, the new worker) therefore never reach the scene.

## Files reviewed (`ls -la --time-style=full-iso`, EDT -04:00)
| Path | mtime | Size (B) | Notes |
|---|---|---|---|
| preview/v4_01_truck.png | 2026-10-31 03:27:58.250046737 -0400 | 234958 | 1280x800; re-viewed after re-render |
| preview/v4_02_breakdown.png | 2026-10-31 03:21:39.717160105 -0400 | 398159 | 1280x800 |
| preview/v4_03_roller.png | 2026-10-31 03:28:00.238045234 -0400 | 372054 | 1280x800 |
| preview/v4_04_sort.png | 2026-10-31 03:28:02.058043816 -0400 | 648702 | 1280x800 |
| preview/v4_05_floor.png | 2026-10-31 03:23:40.881743317 -0400 | 249297 | 1280x800 |
| preview/v4_06_stock.png | 2026-10-31 03:23:42.493748853 -0400 | 150886 | 1280x800 |
| preview/v4_07_dsd.png | 2026-10-31 03:21:49.933222975 -0400 | 370370 | 1280x800 |
| preview/v4_08_snack.png | 2026-10-31 03:23:44.613756053 -0400 | 192048 | 1280x800 |
| preview/v4_09_pharm.png | 2026-10-31 03:23:47.429765473 -0400 | 335896 | 1280x800 |
| preview/v4_10_baler.png | 2026-10-31 03:21:56.057259369 -0400 | 241179 | 1280x800 |
| preview/v4_11_omni.png | 2026-10-31 03:23:49.213771358 -0400 | 228029 | 1280x800 |
| preview/v4_12_fashion.png | 2026-10-31 03:21:59.433279020 -0400 | 246428 | 1280x800 |
| preview/v4_13_claims.png | 2026-10-31 03:22:00.821287019 -0400 | 272945 | 1280x800 |
| preview/v4_14_overview.png | 2026-10-31 03:28:04.314042000 -0400 | 478085 | 1280x800 |
| preview/v4_15_overview.png | 2026-10-31 03:22:06.873321320 -0400 | 403227 | 1280x800; older than v4_14, possibly stale |
| preview/v4_desktop.png | 2026-10-31 03:27:56.410048083 -0400 | 477755 | 1280x800 landing frame |
| preview/v4_phone.png | 2026-10-31 03:28:08.194038730 -0400 | 143195 | 390x844 landing frame (the only phone render) |
| parts/v4/preview/v4_models.png | 2026-10-31 03:30:03.609862596 -0400 | 1913615 | 1800x1680 contact sheet, now with @boxTruckDriver, @tractorDriver, @jackPull tiles |
| parts/v4/preview/v4_models_final.png | 2026-10-31 03:30:03.769862254 -0400 | 1913615 | Same size as v4_models.png (presumed duplicate) |
| parts/v4/preview/trucks_test.png | 2026-10-31 03:29:27.141933867 -0400 | 261755 | Re-viewed |
| parts/v4/preview/worker_test.png | 2026-10-31 03:29:28.501931454 -0400 | 286503 | Re-viewed; now includes a seated-drive pose |
| parts/v4/preview/contact.html / trucks_test.html / worker_test.html | 03:25:07.873969350 / 03:29:23.369940454 / 03:27:22.258065174 | 11148 / 3708 / 2716 | Harness sources |
| parts/v4/README.md | 2026-10-31 03:29:40.029910232 -0400 | 6907 | Context |
| parts/v4/worker.js / wrappedSkid.js | 03:27:22.258065174 / 03:20:33.164680858 | 22665 / 8687 | **Not imported by the scene** |
| v4/main.js / v4/body.html | 03:27:50.390052189 / 03:23:29.737703556 | 99074 / 7788 | Scene imports; the "Live store data" markup is in body.html line 30 |

Refs compared (qa/v4_artefacts/ref_small/): backroom_1, backroom_2, wrapped_skid_ref, pop_skid_1/2/3, mckesson_tote_1/2, slip_zebra_1, dsd_truck_blue_trailer, dsd_truck_red_box.

New artefacts (qa/v4_artefacts/): `v4_*_390w.png` for every scene render and part preview, plus crops: crop_01_blur, crop_02_skids, crop_05_jack_worker, crop_06_empty_pallet, crop_07_jacks, crop_08_cabs, crop_08_roofless, crop_09_pop_noTote, crop_11_sign_bars, crop_12_ghost_legs, crop_15_live_data, crop_models_drivers.

## Findings (worst first)

### BLOCKER-1 (NEW): Dashboard and data clutter is back in the story (check 5)
- **Files and regions:** v4_15_overview.png, left panel, lower half (crop_15_live_data.png): a "Live store data" section with 3 KPI tiles ("Trucks tonight", "Skids sorted", "Shelves filled", each reading "Live data coming soon"), above them a "Headlines" list of 5 Google News links. v4_14_overview.png, left 45% of the frame: a dense 11-row Division/Departments table, a high-shrink line and a "Pay-for-scan" notes block.
- **Problem:** The user wants no charts, graphs or dashboards. KPI tiles are a dashboard even when they are empty, and a "reserved for a future live API" panel promises one. The news feed and the 11-row table are clutter that has nothing to do with a visual backroom story, and the table covers almost half the 3D view.
- **Fix:** Delete the `.live` block and the headlines list from body.html (line 30), the news fetch in a7_ui.js, and news.json. Replace the v4_14 table with at most one sentence ("Every department number maps to a division skid"), or show it physically as a few labelled department skids in the scene. No tiles, counters or feeds anywhere.

### BLOCKER-2 (NEW): No stretch-wrapped skids anywhere; the scene doesn't use wrappedSkid.js (checks 1 and 6)
- **Files and regions:** v4_02_breakdown.png, right and centre (crop_02_skids.png); v4_04_sort.png, every skid; v4_07_dsd.png, left skid; v4_desktop.png and v4_14, inside the trailers.
- **Problem:** The step 2 card reads "Mixed skids, stretch-wrapped … about 1.9 m tall", but every skid is bare, flat-shaded coloured boxes (solid red, blue and yellow cubes) with no film. The right-hand skid in v4_02 is two separate columns with a visible gap, not one load. wrapped_skid_ref and backroom_1/2 show wrapped or loose kraft cartons, not primary-colour toy blocks. v4/main.js never imports wrappedSkid.js.
- **Fix:** Import `wrappedSkid.js` and place seeded 1.9 m wrapped skids at the dock and the breakdown spot (v4_02) and in the trailer (v4_01). Show the wrap partly cut on the skid being broken down. Retint sort-area cartons to kraft (about 70%), white (about 20%) and printed (about 10%), and remove the saturated solid colours.

### BLOCKER-3 (NEW): People are faceless capsule placeholders; the scene doesn't use worker.js (check 6)
- **Files and regions:** every story frame, most visibly v4_03_roller.png (foreground back view), v4_07_dsd.png (crop_07_jacks.png), v4_10_baler.png and v4_13_claims.png.
- **Problem:** The figures are stacked capsules: an egg head with a black cap, a tank-top torso, sausage arms with no hands, and two-tube legs with no feet. There are no vests, badges or Zebras on hips. In v4_13 the arms stick straight out like a zombie, holding a floating black band. This differs from the old BLOCKER-3 (worker.js mannequin features): worker.js now has hands, a vest, a badge and a holster (worker_test.png), but the scene doesn't import it, so none of that work is visible.
- **Fix:** Replace the capsule instancer (a3_inst.js / a6_render.js) with `worker.js` builds, using LOD if draw calls matter. Use `walkPose`, `carryPose`, `jackPullPose` and `seatedDrivePose`. Remove the painted face features first (see Previous findings status, BLOCKER-3).

### BLOCKER-4 (still open; same as previous BLOCKER-1, already notified): Vehicles and pallet jacks have no drivers or operators in the scene (check 3)
- **Files and regions:**
  - v4_02_breakdown.png: jack at the dock door, centre, unattended.
  - v4_03_roller.png: right-middle jack, unattended.
  - v4_05_floor.png (crop_05_jack_worker.png): the worker stands beside the skid reaching into the shelf, not on the handle, though the card says he "pulls each finished skid … with a pallet jack".
  - v4_06_stock.png: jack with nobody near it.
  - v4_07_dsd.png (crop_07_jacks.png): both jacks are unattended, and the "Beverage vendor" stands about 1.5 m from his jack with his hands at his sides, though the card says "The vendor pulls the skid in".
  - v4_09_pharm.png: jack under a pop skid, unattended.
  - v4_08_snack.png (crop_08_cabs.png): the tractor "reversing to door" has no visible occupant, and the blue Walmart yard vehicle at the bottom has a tiny black stick-figure driver about 0.6 m tall.
  - v4_desktop.png and v4_14: tractor cabs are empty.
- **Problem:** The part sheet now has @boxTruckDriver, @tractorDriver and @jackPull tiles (crop_models_drivers.png), but none of them are used in the scene. Note that in trucks_test.png (03:29) the tractor cab still looks empty.
- **Fix:** For every jack that moves or is "pulled" in the card text, put a worker.js figure in `jackPullPose` on `userData.gripPoint`. Seat a full-scale worker on the `seat` pivot of every truck and the yard vehicle. Never park a jack in frame with no person near it unless the card says it is parked.

### BLOCKER-5 (NEW): The story's first frame shows nothing (checks 2 and 6)
- **File and region:** v4_01_truck.png, the whole 3D area right of the card (crop_01_blur.png).
- **Problem:** The camera is jammed against a trailer side wall that is heavily blurred (it looks like depth of field or motion blur on near geometry). There is no visible truck, dock door, roller head or worker. The labels "Walmart trailer · placard CP", "Stocking 2 · unloading" and "Roller head" point into blur, and "Roller head" is half hidden under the card. This is the opening frame after the hero, so the story starts broken.
- **Fix:** Move the step 1 camera to stand inside the backroom at eye level (about 1.6 m), about 5 m from the dock door. Frame the open trailer rear with floor-loaded cases, the roller head entering it, and 2 workers lifting cases. Disable DOF on near geometry. Keep every label anchor on screen and outside the card's rectangle.

### BLOCKER-6 (NEW): A loaded skid and its worker vanish between steps 5 and 6 (check 2)
- **Files and regions:** v4_05_floor.png, centre-right: a worker and a skid of about 8 cases on a jack. v4_06_stock.png, centre (crop_06_empty_pallet.png): the same jack and black pallet, completely empty, with no worker anywhere in frame.
- **Problem:** Every case disappears between consecutive frames, and the shelves don't visibly gain the same cases (the shelves were already "full" of colour blocks in v4_05). "Empty slots get filled" points at a single box. This is exactly the magic disappearance the user banned.
- **Fix:** In v4_06 show the same worker mid-move with 2 or 3 cases left on the skid, one case in hand, and the gaps on the shelf visibly filling. Or animate case by case and capture a mid-state. Keep the object count continuous across frames (assert it in qa_motion.py).

### MAJOR-1: Trailers are roofless cutaways with cargo visible from above (check 6)
- **Files:** v4_08_snack.png, right (crop_08_roofless.png); v4_14_overview.png; v4_15_overview.png; v4_desktop.png; v4_phone.png.
- **Problem:** The Walmart trailers have no roof and show internal ribs and coloured toy boxes from above. Real trailers have roofs; this reads as a dollhouse.
- **Fix:** Close the roofs. If the cargo must be shown, use a translucent roof only in "Explore 3D" mode, or cut to an interior camera.

### MAJOR-2: Pallets are black (checks 6 and 1)
- **Files:** v4_02, v4_04, v4_05, v4_06 (crop_06_empty_pallet.png), v4_12.
- **Problem:** Nearly every pallet renders as glossy black planks. The refs (backroom_1/2, pop_skid_1-3) show blue CHEP (worn), red and natural wood. The README says _pallet.js now colours by seed, so the vertex colours or material are probably being lost in the scene merge (an inkyPalletGeo plus non-vertex-colour material).
- **Fix:** Render the pallets with `PM.woodVC`, or a material with `vertexColors: true`, and check the blue, red and natural split.

### MAJOR-3: The roller is broken into disconnected zig-zag sections (checks 2 and 6)
- **Files:** v4_04_sort.png, centre (3-4 sections at different angles with gaps between their ends); v4_03_roller.png, mid-ground.
- **Problem:** Boxes "roll by gravity" (v4_03 label) across open gaps, which is impossible. backroom_1/2 show one continuous curving skate line.
- **Fix:** Chain the sections end to end (the same rollerTopY, ends touching or overlapping 2 cm), or use the conveyor's `compress` to bend one continuous run.

### MAJOR-4: Signs render as barcode stripes (check 4)
- **Files:** v4_11_omni.png, top (crop_11_sign_bars.png); v4_12_fashion.png, top; v4_02_breakdown.png, upper-left; v4_03_roller.png, centre-back wall; v4_desktop.png, right wall.
- **Problem:** The blue hanging signs show vertical white bars instead of text. This looks like a stretched or back-face canvas texture, or text seen edge-on. It reads as a glitch.
- **Fix:** Make the signs double-sided, with the correctly oriented texture on the back face (or `side: FrontSide` plus a second mirrored plane). Keep the canvas aspect equal to the plane aspect, and give each sign a fixed text size.

### MAJOR-5: Products and props are toy blocks (check 6)
- **Files and regions:**
  - v4_05_floor.png and v4_06_stock.png: gondolas filled with solid-colour bricks about 0.4-0.5 m each.
  - v4_12_fashion.png (crop_12_ghost_legs.png): the clothes are flat coloured slabs with no hangers.
  - v4_10_baler.png: the "Cardboard" is a single untextured brown cube about 1 m on a side.
  - v4_09_pharm.png, right: a toy control panel with giant green, red and yellow squares.
- **Problem:** These are the most "fake" elements in the build: flat shading and scale that doesn't match retail product.
- **Fix:** Use facings of 0.1-0.3 m product with cardboard texture and printed fronts (instanced). Put garments on hangers with drape and a slight sway. Replace the cardboard cube with a messy pile of flattened kraft sheets on a cart. Shrink the panel to 0.4 x 0.6 m with real-size mushroom E-stop and push buttons.

### MAJOR-6: Scale errors on the sales floor and the yard vehicle (check 1)
- **Files:** v4_05_floor.png (the gondola top is at about the worker's shoulder, about 1.5 m; real gondolas are 1.8-2.1 m) and v4_08_snack.png (the blue yard vehicle's driver is about 0.6 m tall, and the canopy sits on 4 thin posts).
- **Fix:** Set the gondolas to 1.9 m with 5 shelves. Replace the yard vehicle's driver with a full-scale worker.js in `seatedDrivePose`, or remove the vehicle.

### MAJOR-7: Pharmacy step shows no pharmacy tote (checks 2 and 6)
- **File and region:** v4_09_pharm.png. The "Pharmacy totes (sealed)" label points at the receiving desk, where no tote is visible (crop_09_pop_noTote.png). The foreground holds a pop skid instead.
- **Problem:** mckessonTote.js is imported but not visible, so the card contradicts the picture.
- **Fix:** Put 3-4 raspberry McKesson totes, strapped and with memos, on the desk or on a cart in the foreground, with the DSD associate scanning one.

### MAJOR-8: Interpenetration and floating poses (check 6)
- **Files and regions:**
  - v4_05: the worker's arm passes through the shelf upright, and the case floats at arm's length.
  - v4_09: the associate's forearms sink into the desk.
  - v4_13: rigid outstretched arms with a floating scanner.
  - v4_12 (crop_12_ghost_legs.png): only a pair of legs shows under the Z-rack, with the torso hidden, so it reads as ghost legs.
  - v4_06: the jack forks show yellow plates through the front of the pallet.
- **Fix:** Use worker.js with IK hand targets, and collision-check poses against fixtures. Move the v4_12 worker to the open end of the rack, hanging an item.

### MAJOR-9: Too clean, too empty and flat-lit versus backroom_1/2 (check 6; extends previous MAJOR-9)
- **Files:**
  - v4_11_omni.png: 2 bare shelves and 4 green totes, nobody present.
  - v4_13_claims.png: an almost empty cage.
  - v4_12_fashion.png: bare walls.
  - v4_06_stock.png: a black ceiling void.
  - v4_08_snack.png: a grey void sky over a black plane.
  - Every frame: uniform lighting with no strip-LED pools and no AO under pallets.
- **Problem:** The refs show loose carton piles, plastic bags, garbage bins, conduit on the walls, the green EXIT sign, stained and cracked concrete, and bright LED strips on a black-painted ceiling with ducts. The floor-crack lines in v4_11 and v4_13 are thin black vector strokes, not cracks.
- **Fix:** Add clutter props from the refs: loose cartons, a wrap ball, bins, a bag pile, wall conduit and an EXIT sign. Add SSAO or contact-shadow decals under every pallet and box. Add emissive strip-LED meshes with a light falloff. Give the floor a real stain and crack texture (normal plus albedo), and use a sky or HDRI for the exterior.

### MAJOR-10: Phone legibility is not verified, and 3D text is unreadable at 390 px (check 4; extends previous MAJOR-10)
- **Files:** v4_phone.png (the only phone render; the "Stocking 2 · sorting by dept" tag is clipped at the right screen edge). The `_390w` copies of v4_07 (the "Receiving Check-in · invoices" sign, the Beverage Vendor placard), v4_08 (the "Snack Vendor" placard, the "FDS" placard) and v4_desktop (the Cooler/Freezer plaques) are all illegible.
- **Problem:** No phone render exists for steps 1-15, so card/scene overlap and tag collisions on a phone can't be judged.
- **Fix:** Render every step at 390x844 DPR3. Clamp tag positions inside the viewport with an 8 px margin. Treat in-scene text as decoration only, and put anything that matters in HTML tags at 12 CSS px or more.

### MAJOR-11: Step numbering and order are broken (check 2, UX)
- **Files:** the "STEP 7" label is on both v4_07 and v4_08. "STEP 8" is on v4_11, v4_12 and v4_13. v4_09 just says "PHARMACY". v4_10 "MORNING PRE-OP" sits mid-sequence after the overnight steps. There are 16 rail dots but 15 frames.
- **Fix:** Number the steps uniquely and in order (1-15), or drop the numbers. Move the pre-op step to where it happens in the night, and make the dot count match the frames.

### MAJOR-12: The landing frame and overviews are aerial dollhouse views (carried over from the v3 baseline warning)
- **Files:** v4_desktop.png, v4_phone.png, v4_14_overview.png, v4_15_overview.png.
- **Problem:** The story opens on a high aerial cutaway of the whole store, with no roof, toy trailers and a black ceiling-beam lattice in v4_15. The user's subject is the eye-level white backroom.
- **Fix:** Open on an eye-level view of the backroom cooler wall (backroom_1 composition: 2 stainless doors, yellow rails, EXIT sign, LED strips). Keep the aerial view only behind "Explore 3D".

### MAJOR-13: Pop skids are still loose cans, not shrink-packs (still open; same as previous MAJOR-5)
- **Files:** v4_09_pharm.png, foreground (crop_09_pop_noTote.png); v4_07_dsd.png, right.
- **Problem:** The cans are an even grid of individual cylinders, the black bottles look like toy rockets, and there is no per-pack film or barcode sticker.
- **Fix:** Group the cans into packs with a film shell and a white barcode label per pack, as in pop_skid_1/2/3.

### MAJOR-14: The baler is still loaded with wooden planks (still open; same as previous MAJOR-7)
- **File and region:** v4_10_baler.png, inside the open door.
- **Fix:** Compressed kraft bale with straps, as in the previous review.

### MAJOR-15: The Snack Vendor trailer still reads as a steel shipping container (still open; same as previous MAJOR-2)
- **File:** v4_08_snack.png, centre.
- **Fix:** Tarp material with sag and straps, or a smooth dry-van skin.

### MAJOR-16: Doors and curtains may still animate by squashing (still open; same as previous MAJOR-1; cannot be judged from stills)
- **Source:** README (03:29) still lists `rearDoor (roll-up, scale.y 1→0.08)`, `curtain_L/R (scale.x…; placards hide below 0.6)` and `landingGear (scale.y…)`.
- **Fix:** As in the previous review. Also capture a mid-animation frame so QA can verify.

### MINOR-1: The step card hides the subject
On desktop the card covers about 30% of the frame and sits on top of the action: the v4_09 workers, the v4_02 left skids, the v4_10 "Receiving" sign, and the v4_01 "Roller head" tag. Fix: frame each shot with the subject in the right 60%, or collapse the card to a bottom sheet.

### MINOR-2: The card text promises things that aren't shown
v4_02 says "Empty pallets are stacked by the wall", but there are none. v4_01 says "placard CP", but nothing is readable. Fix: add an empty-pallet stack, and use a close-up of the placard.

### MINOR-3: Identical idle workers
In v4_03 and v4_04 every sorter has the same body and the same arms-down pose, and nobody is handling a box. Fix: vary height and skin with `seed`, and use carryPose or reach poses with a box in hand.

### MINOR-4: The 3D sign "Receiving" is cropped at the frame edge (v4_07, top right), and in v4_10 the "Baler" tag covers the "Cardboard baler" sign text
Fix: reframe, and offset tags so they don't overlap signs.

### MINOR-5: Dev chrome and caption gaps on the contact sheet
In v4_models.png the composed tiles read "? × ? × ? m" and show draw-call captions. This is fine for QA, but don't ship it.

### MINOR-6: Possibly stale render
v4_15_overview.png (03:22:06) is older than v4_14 (03:28:04) and the desktop frame (03:27:56). v4_models_final.png duplicates v4_models.png. Fix: re-render all frames from one build and stamp the build hash.

### MINOR-7: worker_test.png still has painted faces
At 03:29 the faces still have closed-eye and beard paint, and the soles still look like plates (see previous BLOCKER-3). The seated driver's steering wheel floats with no column. Fix: as in the previous BLOCKER-3, and attach the wheel to a column.

## Previous findings status (03:17 review)
| Previous ID | Status |
|---|---|
| BLOCKER-1 no drivers or operators | **Open in scene** (now BLOCKER-4). Part tiles exist but are unused |
| BLOCKER-2 no scene render | Resolved: renders exist |
| BLOCKER-3 cartoon worker (worker.js) | Partly fixed at part level (hands, badge, holster), but faces and soles remain (MINOR-7). Superseded in scene by BLOCKER-3 (capsules) |
| MAJOR-1 squash/hide animation | Open (MAJOR-16) |
| MAJOR-2 container curtain-sider | Open (MAJOR-15) |
| MAJOR-3 jack too tall | Fixed per README (1.20 m); in-scene jacks look plausible |
| MAJOR-4 pallet colours | Part fixed, but in scene the pallets are black (MAJOR-2) |
| MAJOR-5 pop-skid cans | Open (MAJOR-13) |
| MAJOR-6 Zebra | Improved (thin slab, "Shipment received" screen) |
| MAJOR-7 baler planks | Open (MAJOR-14) |
| MAJOR-8 wrapped skids too perfect | Moot: wrapped skids aren't in the scene (BLOCKER-2) |
| MAJOR-9 toy look and grounding | Open (MAJOR-9) |
| MAJOR-10 phone text | Open (MAJOR-10) |
| MAJOR-11 tote | Part improved; tote not visible in scene (MAJOR-7) |
| MAJOR-12 tractor axle | Not re-checked in scene (the tractor is cropped in v4_08) |

## Blockers already notified to Soros (for dedupe)
From the 03:17 EDT review:
1. Vehicles have no drivers or operators (check 3)
2. No scene render, so most checks are unverifiable (resolved 03:21)
3. The worker is a cartoon mannequin (check 6)

New in this review (reported back 03:31 EDT):
4. Dashboard and data clutter is back in the story (v4_15 "Live store data" KPI tiles and headlines; v4_14 division table)
5. No stretch-wrapped skids anywhere; the scene doesn't use wrappedSkid.js
6. People are faceless capsule placeholders; the scene doesn't use worker.js
7. The story's first frame shows nothing (v4_01 blurred trailer wall)
8. A loaded skid and its worker vanish between steps 5 and 6 (v4_05 → v4_06)

## Counts
- **BLOCKER: 6** (5 new; 1 still open from before: drivers and operators)
- **MAJOR: 16**
- **MINOR: 7**
