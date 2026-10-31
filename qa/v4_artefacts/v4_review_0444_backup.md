# v4 visual/UX review: full scene renders (verdict: FAIL; 2 NEW blockers not yet notified: BLOCKER-8, BLOCKER-9)

Reviewer: QA (read-only; only qa/ was written). Updated Sat 2026-10-31, about 04:43 EDT (America/Toronto). This covers the **04:38:09 EDT** renders and supersedes the 04:32 version (backed up at `qa/v4_artefacts/v4_review_0433_backup.md`; older backups: `v4_review_0408_backup.md`, `v4_review_0346_backup.md`, `v4_review_0331_backup.md`).

**Scope.** I took `ls -la --time-style=full-iso` of preview/v4_*.png and parts/v4/preview at the start (about 04:39 EDT, `qa/v4_artefacts/ls_start_0438.txt`) and the end (04:42:23 EDT, `ls_end_0438.txt`). The two listings were identical, so **nothing changed during this review**. `find -newer preview/v4_phone.png` over preview/, parts/v4/ and v4/ returned nothing. All 20 `preview/v4_*.png` were re-rendered together at 04:38:09. They are newer than the latest source (main.js, a1_core.js and out.js at 04:36:58; news.json at 04:36:59). Nothing in parts/v4/preview is newer than v4_models_final.png (04:24:32), so the parts findings carry over unchanged.

**Old → new names.** v4_01 to v4_15 keep their names. v4_16_upstairs → **v4_17_upstairs**. v4_17_overview → **v4_18_overview**. **v4_16_stairs** is a new step. desktop and phone are unchanged.

**Method.**
- I viewed every image at full size and as a 390 px-wide copy (`qa/v4_artefacts/*_0438_390w.png`, plus a contact sheet `sheet_0438_390w.png`). I also made 2-6x crops (`c0438_*`).
- I compared content against ref/: backroom_1/2, wrapped_skid_ref, bev_skid_*, egg_case_*, milk_crates_cooler, mckesson_tote_*, cardboard_bale, dsd_truck_*.
- I judged the look only against ref/reel f01-f06. The toy-like, low-poly, faceless style is **not** penalised.

## What changed 04:22 → 04:38 (summary)
- **v4_01:** The unloader now holds a case in a carry pose at the roller head. MAJOR-17 is resolved.
- **v4_06:** The skid now holds 8 cases (4 stacks of 2), and a worker bends over it, taking a case. The v4_06 half of MAJOR-18 is resolved.
- **v4_05 (regression):** The camera is now high over the gondolas. The tagged "Dept 46 skid (1 person)" is **completely hidden** behind shelving. → **BLOCKER-8 (new)**.
- **v4_07 (regression):** The camera now looks into an almost empty cooler: **1 milk skid, no egg pallet, no people**. → **BLOCKER-9 (new)**, which supersedes MAJOR-24.
- **v4_11 (regression):** The associate's hand is on a jack ring, but the handle runs *away* from the pallet. No jack is under the load.
- **v4_09:** The jack under the beverage skid is gone. No idle jack remains, but the "brings the skids in by pallet jack" step is now not shown at all.
- **v4_10:** A driver is now visible in the foreground Walmart tractor, but he is sunk chest-deep into a solid hood under a canopy (MAJOR-27). The red "reversing" truck still shows no driver.
- **v4_12:** 3 finished, strapped cardboard bales now stand beside the baler. The MINOR-17 scene part is resolved.
- **v4_16_stairs (new step):** The stair is shown, but the frame is badly composed (MAJOR-26).
- **v4_02, v4_13, v4_14, v4_15, v4_17, v4_18, desktop, phone:** substantively unchanged.

## Files reviewed (EDT, -04:00; identical at the start ≈04:39 and the end 04:42:23)
| Path | mtime | Size (B) | Notes |
|---|---|---|---|
| preview/v4_01_truck.png | 2026-10-31 04:38:09.384173466 | 213193 | 1280×800 |
| preview/v4_02_breakdown.png | 2026-10-31 04:38:09.384173466 | 186861 | |
| preview/v4_03_roller.png | 2026-10-31 04:38:09.388173459 | 474235 | |
| preview/v4_04_sort.png | 2026-10-31 04:38:09.388173459 | 778284 | |
| preview/v4_05_floor.png | 2026-10-31 04:38:09.388173459 | 204092 | Regressed (BLOCKER-8) |
| preview/v4_06_stock.png | 2026-10-31 04:38:09.392173451 | 312564 | Improved |
| preview/v4_07_milk.png | 2026-10-31 04:38:09.392173451 | 188353 | Regressed (BLOCKER-9) |
| preview/v4_08_dsd.png | 2026-10-31 04:38:09.392173451 | 358823 | |
| preview/v4_09_bev.png | 2026-10-31 04:38:09.396173443 | 378290 | |
| preview/v4_10_snack.png | 2026-10-31 04:38:09.396173443 | 276742 | |
| preview/v4_11_pharm.png | 2026-10-31 04:38:09.396173443 | 322087 | |
| preview/v4_12_baler.png | 2026-10-31 04:38:09.400173436 | 391633 | Bales added |
| preview/v4_13_omni.png | 2026-10-31 04:38:09.400173436 | 268642 | |
| preview/v4_14_fashion.png | 2026-10-31 04:38:09.400173436 | 276757 | |
| preview/v4_15_claims.png | 2026-10-31 04:38:09.400173436 | 305834 | |
| preview/v4_16_stairs.png | 2026-10-31 04:38:09.404173428 | 296041 | **New step** |
| preview/v4_17_upstairs.png | 2026-10-31 04:38:09.404173428 | 171336 | Was v4_16_upstairs |
| preview/v4_18_overview.png | 2026-10-31 04:38:09.404173428 | 572074 | Was v4_17_overview |
| preview/v4_desktop.png | 2026-10-31 04:38:09.408173421 | 535770 | |
| preview/v4_phone.png | 2026-10-31 04:38:09.408173421 | 158042 | 390×844 |
| parts/v4/preview/v4_models_final.png | 2026-10-31 04:24:32.981192083 | 5029936 | Unchanged; still byte-identical to v4_models.png (04:24:30.361192377) |
| parts/v4/preview/cardboardBale.png / _crop.png | 04:24:17.997193349 / 04:24:54.213188599 | 181649 / 530536 | Unchanged |
| parts/v4/preview/floor1_test.png | 04:18:02.996798021 | 1367722 | Unchanged |
| parts/v4/preview/trucks_test.png / worker_test.png | 03:29:27.141933867 / 03:29:28.501931454 | 261755 / 286503 | Unchanged (stale) |
| parts/v4/preview/contact.html / floor1_test.html / trucks_test.html / worker_test.html | 04:23:47.905 / 04:17:31.720 / 03:29:23.369 / 03:27:22.258 | 12104 / 10968 / 3708 / 2716 | Not rendered |
| v4/body.html / a7_ui.js / main.js / news.json | 04:33:09.376 / 04:35:12.924 / 04:36:58.528 / 04:36:59.272 | 9022 / 12657 / 120194 / 1991 | Grepped only: body.html:32 `<details id="newsBar">`; body.html:28 `routechip` + `table.route`; allorigins/Google News fetch at a7_ui.js:97 and main.js:1018 |

New artefacts in qa/v4_artefacts/:
- `ls_start_0438.txt`, `ls_end_0438.txt`.
- 390 px copies: `*_0438_390w.png` (20 files) and `sheet_0438_390w.png`.
- Crops: `c0438_02_skid`, `c0438_04_topleft`, `c0438_04_behindcard`, `c0438_05_tag_skid`, `c0438_06_skid`, `c0438_07_stack`, `c0438_07_right`, `c0438_08_jack`, `c0438_08_left_fg`, `c0438_09_skidbase`, `c0438_10_fg_tractor`, `c0438_10_red_cab`, `c0438_10_red_cab_zoom`, `c0438_11_jack`, `c0438_12_bales`, `c0438_15_cage`, `c0438_16_stair`, `c0438_18_jacks`, `c0438_desk_milkpuller`.

## Findings (worst first)

### BLOCKER-9 (NEW, not yet notified; supersedes MAJOR-24): The v4_07 cooler step is almost empty
- **File and region:** v4_07_milk.png, the whole frame (c0438_07_stack.png, c0438_07_right.png).
- **Problem:**
  - The card says "5 milk skids (9 crates per layer, 4-6 layers) + wrapped egg pallet go straight to the cooler". The frame shows **one** black crate stack on a natural pallet, standing alone at the far wall of a bare grey room.
  - **No egg pallet at all.** The 04:22 render had it, so the wrapped egg pallet has disappeared.
  - The other 4 milk skids are missing.
  - There are no people and no jack, so nothing explains how the skids got there.
  - About 60% of the frame is empty wall and floor. The right third is a strip curtain and an out-of-focus dock area.
  - At 390 px the crates read as a black box, and the jugs are a few white flecks.
  - A matching black crate stack shows up inside the dry trailer in v4_02 (c0438_02_skid.png), so the milk seems to be in the wrong place rather than in the cooler.
- **Fix:**
  - Frame the cooler from the doorway at about 35°.
  - Put 5 milk skids in their slots with ≥ 0.2 m gaps, plus the wrapped kraft egg pallet (`buildEggs`), all clearly in frame.
  - Add a worker pulling the last skid in on a jack (BLOCKER-4 recipe).
  - Make the jug bodies white and only the caps coloured (milk_crates_cooler.jpg).
  - Add "STEP n" to the card.

### BLOCKER-8 (NEW, not yet notified): The v4_05 step's subject (the skid, its puller and the jack) is invisible
- **File and region:** v4_05_floor.png, centre-top (c0438_05_tag_skid.png).
- **Problem:**
  - The yellow tag "Stocking 3 · Dept 46 skid (1 person)" points into an aisle that is completely blocked by the gondola in front of it. Only a 1 cm kraft sliver of a case shows under the tag.
  - The card says "pulls each finished skid to its aisle with a pallet jack", but no skid, person or jack is visible anywhere.
  - The frame is 100% toy-brick shelving seen from about 60° above.
  - This regressed from 04:22, when a skid and jack were at least in view.
- **Fix:**
  - Drop the camera to aisle level, looking down the Dept 46 aisle.
  - Show the 6-10 case skid on an engaged jack, with the puller in `jackPullPose` (hand on the grip, leaning ≤ 10°), coming in from the main aisle.
  - Keep the subject outside the card's rectangle.

### BLOCKER-4 (still open; already notified as item 1): Loaded jacks and moving trucks still have no operator
- **Still failing:**
  - **v4_08_dsd.png, centre (c0438_08_jack.png):** a yellow jack sits under the beverage skid with its handle up, and nobody touches it. The "Beverage vendor" stands beside it with both arms down. The card says "The vendor pulls the skid in".
  - **v4_11_pharm.png, left of centre (c0438_11_jack.png), regression:** the associate grips a yellow ring, but its shaft runs down-left, *away* from the pallet, to a jack hidden behind the card. The pallet's deck sits on the floor with no forks under it. He is holding a jack that isn't connected to the load. His right hand also reaches into the film.
  - **v4_10_snack.png, centre-top (c0438_10_red_cab_zoom.png):** on the red box truck tagged "Snack Vendor reversing to door", only the cab roof shows above the Beverage trailer. No driver is visible.
  - **v4_05:** the jack and puller aren't visible (BLOCKER-8).
  - **v4_02:** no person and no jack (BLOCKER-2).
- **Changed:**
  - v4_09: the jack was removed. There is no unoperated jack now, but the jack step isn't shown (MINOR-2).
  - v4_10: the foreground Walmart tractor now has a visible driver, but he is intersecting (MAJOR-27).
- **OK:**
  - v4_18 / desktop: pullers are walking behind their jacks (c0438_18_jacks.png).
  - v4_08: the clipped foreground figure holds a jack grip.
- **Fix:**
  - v4_08: vendor in `jackPullPose` with his hand on the grip of the jack under the skid.
  - v4_11: rotate the jack so its forks are under the pallet and the handle is on the associate's side.
  - v4_10: frame the reversing truck's windshield with a `seatedDrivePose` driver visible.

### BLOCKER-1 (still open, unchanged; already notified as item 4): A news feature and a data table are still in the product
- **Every one of the 20 frames, bottom-left:** a "News" chip (body.html:32 `#newsBar`). The live allorigins → Google News fetch is still at a7_ui.js:97 and main.js:1018, and news.json was re-written at 04:36:59.
- **v4_18_overview.png, card:** the "How receiving routes items (store receiving notes) ▸" pill (body.html:28 `routechip`) expands to a Division/Departments `table.route`.
- **Fix:** Delete `#newsBar`, the news code, news.json and the fetch. Delete the routechip table, or replace it with one plain sentence.

### BLOCKER-2 (still open, unchanged; already notified as item 5): Step 2 still doesn't show the breakdown process
- **File and region:** v4_02_breakdown.png, centre (c0438_02_skid.png). This is pixel-for-pixel the same composition as 04:22.
- **Problem:**
  - The "Wrapped mixed skid ≈ 1.9 m" is still inside the trailer. It is about 40% hidden by the door jamb and the white bar (MAJOR-25), and a black milk-crate stack is fused against it with zero gap.
  - At 390 px it reads as bare cartons.
  - There is **no worker, no jack, no cut film and no empty-pallet stack**.
  - The "Stocking 2 · pulling skids" tag points at an empty dock plate.
- **Fix:**
  - Pull the wrapped skid onto the dock plate.
  - Show one worker on a jack and a second slitting the film, with a flap of film hanging.
  - Put an empty-pallet stack by the wall.
  - Leave ≥ 0.2 m between the skid and any other load.

### MAJOR-27 (NEW): The v4_10 foreground tractor driver is buried in the hood, and the cab has no shell
- **File and region:** v4_10_snack.png, bottom-centre (c0438_10_fg_tractor.png).
- **Problem:**
  - The Walmart tractor is a solid blue slab with a flat roof on 4 thin posts. It has no windshield, doors or seat, so it reads as a golf-cart canopy.
  - The driver's head and shoulders stick out of the solid hood. His body is inside the geometry, with no steering wheel.
  - The tractor is also clipped by the bottom bar.
- **Fix:**
  - Use the closed tractor cab (as in v4_models row 4), with the driver seated behind a glazed windshield.
  - Pull the camera back so the whole tractor is in frame.

### MAJOR-26 (NEW): The v4_16 stairs step is poorly composed
- **File and region:** v4_16_stairs.png (c0438_16_stair.png).
- **Problem:**
  - The bottom ~40% of the frame is the black dock-door header and the top of the receiving desk.
  - Only the upper flight is visible. It ends on a landing that appears to sit on top of the Receiving office wall, and the lower flight and its foot are hidden behind that wall. It is unclear how anyone reaches it from the floor.
  - Nobody is on the stairs.
  - The bev skid is cut by the right edge, and the compactor is cut too.
  - The card says "U-turn stair with a mid landing", but the U-turn isn't readable.
- **Fix:**
  - Put the camera on the backroom floor near the stair foot, looking up, so both flights, the landing and the mezzanine edge show.
  - Remove the foreground door header.
  - Add one worker climbing (one hand on the rail).

### MAJOR-25 (still open): A white horizontal bar crosses dock-door openings
- **Files and regions:**
  - v4_01_truck.png: across the trailer mouth, with a case still resting on it.
  - v4_02_breakdown.png: across the door, hiding the lower part of the skid.
  - v4_08_dsd.png: the left door.
  - v4_13_omni.png: the right door.
- **Fix:** Roll each door fully into its header, or remove the bar.

### MAJOR-22 (still open): Beverage skids read as coloured toy bricks
- **Files and regions:** v4_09_bev.png, centre (c0438_09_skidbase.png); v4_08_dsd.png, centre and right; v4_16, right edge.
- **Problem:** Lime, purple and red stud-topped slabs, translucent ghost cubes on top, and black layers with red and green cones.
- **Fix:** As before: can/bottle-top texture instead of studs, muted print bands, carton seams, and supported top cases.

### MAJOR-21 (still open, changed): The camera clips or the card hides foreground workers
- **Resolved:** The v4_04 bottom-centre worker is gone.
- **Still open:**
  - v4_08_dsd.png, left (c0438_08_left_fg.png): a giant figure is cut by the frame edge, the card and the bottom bar. Only the legs and one hand show.
  - v4_04_sort.png: a sorter stands directly behind the card and shows through it as a ghost (c0438_04_behindcard.png).
- **Fix:** Keep the camera ≥ 1.5 m from workers, and keep people outside the card's rectangle.

### MAJOR-20 (still open): The breakdown step has no worker
v4_02_breakdown.png has no person anywhere (see BLOCKER-2).

### MAJOR-1 (still open): Trailers are roofless cutaways
v4_10_snack.png (the Walmart FDS trailer, with ribbed open bays), v4_18_overview, v4_desktop and v4_phone. Fix: close the roofs, and show the load through the open rear doors instead.

### MAJOR-2 (still open): Black pallets remain
v4_04 (most department skids), v4_06 (the hero skid, black with teal slats), v4_14 (left), and v4_18/desktop (empty black pallets near the docks). Fix: natural, CHEP blue or red wood everywhere.

### MAJOR-5 (still open): Toy-block products and unidentified monoliths
- v4_05 and v4_06 gondolas: solid-colour bricks.
- v4_14: garment slabs with no hangers.
- v4_12, bottom-left: the lone kraft cube.
- v4_18 and v4_desktop: the red and blue 1.5-2 m monoliths.

### MAJOR-8 (still open, worse): Interpenetration and floating objects
- **v4_14_fashion.png, centre:** the worker is inside the garments, and the Z-racks cross at a shared upright.
- **v4_15_claims.png, centre (c0438_15_cage.png):**
  - The 3 shelf boards still extend out through the cage's front uprights, with no uprights of their own.
  - **New:** the lower row of 3 cases hangs in air *below* the middle shelf, well above the bottom board.
- **Fix:** Separate the racks, and move the worker to the open end. Put the shelving inside the cage on its own uprights, and seat every case on a board.

### MAJOR-9 (still open): Too empty compared with backroom_1/2
- No people in v4_07, v4_13 (which has only 4 totes), v4_16 or v4_17.
- v4_11: one pallet in a white void.
- v4_15: 6 cases.
- **Fix:** Populate each step with the people and objects its card names.

### MAJOR-10 (still open): Phone and 390 px legibility
- **390 px copies:**
  - v4_17's room plaques ("Training room", "Lunch room", "Sick room", "Cleaning") are illegible.
  - v4_16's "Cleaning" and wall signs are illegible.
  - v4_10's "FDS" placard is marginal.
  - v4_18 wall signs and the desktop Cooler/Freezer area are at the limit.
- **v4_phone:** the "Stocking 2 · sorting by dept" tag runs to the right screen edge.
- **Fix:** Use larger plaques, keep a 24 px safe area, and render each step at 390×844.

### MAJOR-11 (still open): Step labels don't match the rail
- v4_08 and v4_10 both say "STEP 7".
- v4_13, v4_14 and v4_15 all say "STEP 8".
- v4_07, v4_09, v4_11, v4_12 ("MORNING PRE-OP", mid-night), v4_16 ("STAIRS") and v4_17 ("UPSTAIRS") have no number.
- **Fix:** Number 1-18 to match the file NN, and move pre-op to the start or end of the story.

### MAJOR-12 (still open): Aerial dollhouse landing
v4_desktop.png, v4_phone.png and v4_18_overview.png.

### MINOR-1: The card hides the subject
- v4_15: the worker's torso is behind the card.
- v4_12: the kraft cube and the compactor are behind the card.
- v4_10: the Beverage tractor cab is behind the card.
- v4_04: a sorter and the left roller section are behind the card.
- v4_11: the jack is behind the card.

### MINOR-2: Card promises that aren't shown
- v4_02: no cutting and no empty-pallet stack.
- v4_09: no jack (now removed), no film cutting and no handheld.
- v4_12: nobody loads the baler (the bales are now shown).
- v4_05: no jack (BLOCKER-8).

### MINOR-3: Idle poses
- v4_12: the worker stands facing the camera with his arms down, in front of the open baler.
- v4_15: the worker isn't scanning.
- v4_04: the right-hand sorter stands with his arms down.
- v4_08: the vendor stands with his arms down.

### MINOR-4: Tag collisions
- v4_desktop: "Stocking 2 · sorting by dept" covers "Gravity roller".
- v4_14: "Z-racks" and "Fashion · hanging apparel" overlap.
- v4_12: the "Baler" tag covers the "Cardboard baler" sign.

### MINOR-5 to MINOR-10 and MINOR-13 to MINOR-15: parts-sheet items, unchanged
- MINOR-5: driver tiles show "? × ? × ?".
- MINOR-6 (partly resolved): v4_models_final.png is still a duplicate.
- MINOR-7: the stale worker and truck tests.
- MINOR-8: the pop skid's black cones.
- MINOR-9: the compactor decal confetti.
- MINOR-10: the driver tiles can't show the drivers.
- MINOR-13: the McKesson tote strap.
- MINOR-14: the egg film highlights.
- MINOR-15: impossible crate dates.

### MINOR-11: The v4_10 card and tags disagree
The card says "The tractor-trailer reverses", but the "reversing" tag is on a red box truck, and the "Snack vendor" tag points at the door behind the Beverage trailer.

### MINOR-12: The pharmacy wrap reads as a glass cabinet
v4_11_pharm.png (c0438_11_jack.png): beaded vertical posts and rims on the film. Fix: use the wrappedSkid film.

### MINOR-16: Unidentified grey planks lie flat
v4_18_overview.png, centre-right, beside the monoliths.

### MINOR-17 (partly resolved): The cardboard bale
- **Resolved:** 3 strapped bales on natural pallets now stand beside the baler in v4_12 (c0438_12_bales.png). The straps read as sitting on the surface.
- **Open:**
  - cardboardBale.png is still a mostly blank 1800×500 canvas.
  - The rightmost bale touches the claims-cage fence line.

### MINOR-18: The straight-stairs test variant floats
floor1_test.png. Unchanged; it isn't used in the scene.

### MINOR-19 (partly resolved): v4_17 upstairs framing
- **Resolved:** The stairs now have their own frame (v4_16).
- **Open:**
  - The "1st flo…" floor sign is still cut by the bottom bar.
  - The division shelving is cut by the right edge.
  - There are no people.

### MINOR-20 (NEW): The v4_12 card is a 5-bullet checklist
- **File and region:** v4_12_baler.png, card.
- **Problem:** "Baler… Compactor… Wave check done… Aisles… Pallet jacks…" is a list/panel, the kind of data clutter the user doesn't want. It also makes the card taller than every other card.
- **Fix:** One sentence ("Before the shift, the baler and compactor doors, gates and stop buttons get checked"), and show it with a worker pressing the baler's stop button.

### MINOR-21 (NEW): Small issues in the v4_06 hero skid
- **File and region:** v4_06_stock.png, centre (c0438_06_skid.png).
- **Problem:**
  - There is no jack under or near the skid, even though v4_05's card says it was pulled in by jack.
  - The worker's right hand closes on air beside a case.
  - A loose white case stands behind him on the floor.
  - The pallet is black (MAJOR-2).
- **Fix:** Park the jack, lowered, under the pallet. Put the hand on the case top, and put the white case on the skid or the shelf.

## Status of previous findings (04:32 review → 04:43)
| ID | Status at 04:43 |
|---|---|
| BLOCKER-1 news/data clutter | **Open (already notified)**, unchanged: a News chip with a live fetch on every frame, and the routechip table in v4_18 |
| BLOCKER-2 no breakdown process / wrapped skid buried | **Open (already notified)**, unchanged (same v4_02 composition) |
| BLOCKER-4 no operators | **Open (already notified)**, changed: v4_08 and the v4_10 red truck still fail; **v4_11 regressed** (handle detached from the load); v4_09's jack was removed; v4_10's foreground driver was added but intersects (MAJOR-27) |
| BLOCKER-7 tote pallet in v4_07 | Remains resolved as such, but the egg pallet is now **absent**: tracked as **BLOCKER-9 (new)** |
| BLOCKER-3, 5 / MAJOR-3, 4, 6, 7, 14, 15, 16, 19, 23 | Remain resolved |
| MAJOR-17 unloader not unloading (v4_01) | **Resolved**: carry pose with a case at the roller head. The case left on the white bar is covered by MAJOR-25 |
| MAJOR-18 single-case skid (v4_05/06) | **Resolved for v4_06** (8-case skid, worker unloading; residuals in MINOR-21). **The v4_05 part is escalated to BLOCKER-8** (subject invisible) |
| MAJOR-24 v4_07 spacing and framing | **Superseded by BLOCKER-9**. The joists are gone, but so is the content |
| MAJOR-1, 2, 5, 9, 10, 11, 12, 20, 22, 25 | **Open** |
| MAJOR-8 | **Open, worse** (v4_15 floating cases) |
| MAJOR-21 | **Open, changed**: the v4_04 bottom worker is fixed; v4_08's left figure and a v4_04 worker behind the card remain |
| MINOR-1 to 5, 7 to 16, 18 | **Open** |
| MINOR-6 | **Partly resolved** (models_final is still a duplicate) |
| MINOR-17 | **Partly resolved** (bales are in the scene; the preview canvas is still blank) |
| MINOR-19 | **Partly resolved** (the stairs now have their own frame) |
| New this pass | **BLOCKER-8, BLOCKER-9**, MAJOR-26, MAJOR-27, MINOR-20, MINOR-21 |

## Blockers already notified to Soros (for dedupe)
From the 03:17 EDT review:
1. Vehicles have no drivers or operators (BLOCKER-4): **still open**
2. No scene render (resolved)
3. Cartoon mannequin worker (resolved)

From the 03:31 EDT review:

4. Dashboard and news clutter (BLOCKER-1): **still open**
5. No stretch-wrapped skids / breakdown process (BLOCKER-2): **still open**
6. Capsule people (resolved)
7. Blank first frame (resolved)
8. Skid and worker vanish between steps 5 and 6 (was MAJOR-18; v4_06 is now fixed, and the v4_05 regression is the new BLOCKER-8)

Not notified and not needed: BLOCKER-7 (resolved before notification).

**NEW, open blockers NOT yet notified (the caller handles notification; not marked as notified here):**
- **BLOCKER-8:** v4_05_floor.png, centre-top. The Dept 46 skid, its puller and the jack are fully hidden behind a gondola, and the tag points at shelving. Fix: an aisle-level camera showing the skid on a jack with the puller's hand on the grip.
- **BLOCKER-9:** v4_07_milk.png, whole frame. The cooler holds 1 of 5 milk skids, the egg pallet is gone, there are no people, and the frame is about 60% empty wall. Fix: 5 spaced milk skids, the wrapped egg pallet and a puller, framed from the doorway at about 35°.

## Counts
- **BLOCKER (open): 5.** BLOCKER-1, -2 and -4 are already notified. **New and not yet notified: 2** (BLOCKER-8, BLOCKER-9).
- **MAJOR (open): 14.** MAJOR-1, 2, 5, 8, 9, 10, 11, 12, 20, 21, 22, 25, plus the new 26 and 27. Resolved or superseded this pass: MAJOR-17, 18 and 24.
- **MINOR (open): 21.** MINOR-1 to -21; MINOR-6, -17 and -19 are partial, and MINOR-20 and -21 are new.
- **Files changed during the review:** none (the start and end listings are identical, and `find -newer` returned nothing).

## Notification handoff (04:44 EDT)
BLOCKER-8 (v4_05_floor) and BLOCKER-9 (v4_07_milk) were handed to trax for delivery to Soros at about 04:44 EDT. Treat them as notified for dedupe.
